import { z } from "zod";
import {
  createSettingSchema,
  deleteSettingSchema,
  settingIdSchema,
  type CreateSettingField,
  type CreateSettingInput,
} from "@/schemas/setting";
import { SettingService } from "@/server/services/setting.service";
import type { SettingEditDto } from "@/server/dto/setting.dto";
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

export type GetSettingForEditResult =
  | { status: "success"; setting: SettingEditDto }
  | { status: "not_found" };

export type UpdateSettingResult =
  | { status: "success" }
  | { status: "invalid"; fieldErrors: CreateSettingFieldErrors }
  | { status: "not_found"; message: string };

const NOT_FOUND_MESSAGE = "セッティングが見つかりません。すでに削除されている可能性があります";

// zod のエラーを、項目ごとに最初の1件のメッセージへ変換する
function toFieldErrors(error: z.ZodError<CreateSettingInput>): CreateSettingFieldErrors {
  const { fieldErrors } = z.flattenError(error);
  const errors: CreateSettingFieldErrors = {};
  for (const field of Object.keys(fieldErrors) as CreateSettingField[]) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      errors[field] = message;
    }
  }
  return errors;
}

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
      return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
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
        return { status: "not_found", message: NOT_FOUND_MESSAGE };
      }
      throw e;
    }
  },

  /**
   * 編集ページの初期値として、ログイン中のユーザーのセッティングを取得する。
   * id の形式の誤り(zod)と、対象が無い・本人の投稿でない(SettingNotFoundError)は、どちらも not_found を返す。
   * 想定外のエラー(DB障害など)はそのままthrowする。
   */
  async getForEdit(userId: string, input: { id: unknown }): Promise<GetSettingForEditResult> {
    const parsedId = settingIdSchema.safeParse(input.id);
    if (!parsedId.success) {
      return { status: "not_found" };
    }

    try {
      const setting = await SettingService.getForEdit(userId, parsedId.data);
      return { status: "success", setting };
    } catch (e) {
      if (e instanceof SettingNotFoundError) {
        return { status: "not_found" };
      }
      throw e;
    }
  },

  /**
   * 編集フォームの入力を検証して、ログイン中のユーザーのセッティングを更新する。
   * id の形式の誤り(zod)と、対象が無い・本人の投稿でない(SettingNotFoundError)は not_found、
   * 入力形式の誤り(zod)と業務ルール違反(SettingRuleError)は項目ごとのエラーに変換して返す。
   * 想定外のエラー(DB障害など)はそのままthrowする。
   */
  async update(
    userId: string,
    input: { id: unknown } & Record<CreateSettingField, unknown>
  ): Promise<UpdateSettingResult> {
    const { id, ...fields } = input;
    const parsedId = settingIdSchema.safeParse(id);
    if (!parsedId.success) {
      return { status: "not_found", message: NOT_FOUND_MESSAGE };
    }

    const parsed = createSettingSchema.safeParse(fields);
    if (!parsed.success) {
      return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
    }

    try {
      await SettingService.update(userId, parsedId.data, parsed.data);
      return { status: "success" };
    } catch (e) {
      if (e instanceof SettingNotFoundError) {
        return { status: "not_found", message: NOT_FOUND_MESSAGE };
      }
      if (e instanceof SettingRuleError) {
        return { status: "invalid", fieldErrors: { [e.field]: e.message } };
      }
      throw e;
    }
  },
};
