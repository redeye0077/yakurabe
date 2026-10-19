import { z } from "zod";
import { createSettingSchema, type CreateSettingField } from "@/schemas/setting";
import { SettingService } from "@/server/services/setting.service";
import { SettingRuleError } from "@/server/errors/setting.error";

// 項目ごとに最初の1件のエラーメッセージ
export type CreateSettingFieldErrors = Partial<Record<CreateSettingField, string>>;

export type CreateSettingResult =
  | { status: "success"; id: string }
  | { status: "invalid"; fieldErrors: CreateSettingFieldErrors };

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
};
