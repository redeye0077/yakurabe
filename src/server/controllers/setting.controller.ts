import { z } from "zod";
import { createSettingSchema, deleteSettingSchema, type CreateSettingField } from "@/schemas/setting";
import { SettingService } from "@/server/services/setting.service";
import { SettingNotFoundError, SettingRuleError } from "@/server/errors/setting.error";

// 項目ごとに最初の1件のエラーメッセージ
export type CreateSettingFieldErrors = Partial<Record<CreateSettingField, string>>;

export type CreateSettingResult =
  | { status: "success"; id: string }
  | { status: "invalid"; fieldErrors: CreateSettingFieldErrors };

export type DeleteSettingResult =
  | { status: "success" }
  | { status: "invalid"; message: string }
  | { status: "not_found"; message: string };

export const SettingController = {
  /**
   * 登録フォームの入力を検証してセッティングを作成する。
   * 入力形式の誤り(zod)と商品の組み合わせの業務ルール違反(SettingRuleError)は、
   * どちらも項目ごとのエラーに変換して返す。想定外のエラー(DB障害など)はそのままthrowする。
   */
  async create(
    userId: string,
    input: Record<CreateSettingField, unknown>
  ): Promise<CreateSettingResult> {
    const parsed = createSettingSchema.safeParse(input);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      const errors: CreateSettingFieldErrors = {};
      for (const field of Object.keys(fieldErrors) as CreateSettingField[]) {
        const message = fieldErrors[field]?.[0];
        if (message) {
          errors[field] = message;
        }
      }
      return { status: "invalid", fieldErrors: errors };
    }

    try {
      const { id } = await SettingService.create(userId, parsed.data);
      return { status: "success", id };
    } catch (e) {
      if (e instanceof SettingRuleError) {
        return { status: "invalid", fieldErrors: { [e.field]: e.message } };
      }
      throw e;
    }
  },

  /**
   * id を検証して、ログイン中のユーザーのセッティングを削除する。
   * id の形式の誤り(zod)と、対象が無い・本人の投稿でない(SettingNotFoundError)は失敗の結果に変換して返す。
   * 想定外のエラー(DB障害など)はそのままthrowする。
   */
  async delete(userId: string, input: { id: unknown }): Promise<DeleteSettingResult> {
    const parsed = deleteSettingSchema.safeParse(input);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "削除するセッティングが正しくありません";
      return { status: "invalid", message };
    }

    try {
      await SettingService.delete(userId, parsed.data.id);
      return { status: "success" };
    } catch (e) {
      if (e instanceof SettingNotFoundError) {
        return {
          status: "not_found",
          message: "セッティングが見つかりません。すでに削除されている可能性があります",
        };
      }
      throw e;
    }
  },
};
