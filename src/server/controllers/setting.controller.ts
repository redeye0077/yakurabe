import { z } from "zod";
import {
  createSettingImageUploadSchema,
  createSettingSchema,
  deleteSettingSchema,
  settingIdSchema,
  updateSettingSchema,
  type CreateSettingField,
} from "@/schemas/setting";
import { SettingService } from "@/server/services/setting.service";
import type { SettingEditDto, SettingImageUploadDto } from "@/server/dto/setting.dto";
import {
  SettingImageError,
  SettingNotFoundError,
  SettingRuleError,
} from "@/server/errors/setting.error";

// 項目ごとに最初の1件のエラーメッセージ
export type CreateSettingFieldErrors = Partial<Record<CreateSettingField, string>>;

export type CreateSettingResult =
  | { status: "success"; id: string }
  | { status: "invalid"; fieldErrors: CreateSettingFieldErrors };

export type CreateSettingImageUploadResult =
  | { status: "success"; upload: SettingImageUploadDto }
  | { status: "invalid"; message: string };

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

function isCreateSettingField(value: unknown): value is CreateSettingField {
  return typeof value === "string" && Object.hasOwn(createSettingSchema.shape, value);
}

// zod のエラーを、項目ごとに最初の1件のメッセージへ変換する(登録・編集のスキーマで共通)
function toFieldErrors(error: z.ZodError): CreateSettingFieldErrors {
  const errors: CreateSettingFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (isCreateSettingField(field) && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export const SettingController = {
  /**
   * 画像のアップロード先(署名付き POST)を発行する。
   * 形式・サイズの誤り(zod)はメッセージに変換して返す。想定外のエラー(S3 の設定ミスなど)はそのままthrowする。
   */
  async createImageUpload(
    userId: string,
    input: { contentType: unknown; size: unknown }
  ): Promise<CreateSettingImageUploadResult> {
    const parsed = createSettingImageUploadSchema.safeParse(input);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "画像を確認できませんでした";
      return { status: "invalid", message };
    }

    const upload = await SettingService.createImageUpload(userId, parsed.data.contentType);
    return { status: "success", upload };
  },

  /**
   * 登録フォームの入力を検証してセッティングを作成する。
   * 入力形式の誤り(zod)・商品の組み合わせの業務ルール違反(SettingRuleError)・画像の確認の失敗(SettingImageError)は、
   * どれも項目ごとのエラーに変換して返す。このとき、アップロード済みの画像は削除する(次の送信で画面がアップロードし直す)。
   * 想定外のエラー(DB障害など)はそのままthrowする。
   */
  async create(
    userId: string,
    input: Record<CreateSettingField, unknown>
  ): Promise<CreateSettingResult> {
    const invalid = async (fieldErrors: CreateSettingFieldErrors): Promise<CreateSettingResult> => {
      // 検証前の値を使う(imageKey 以外の項目が不正でも、画像は後片付けする)
      if (typeof input.imageKey === "string" && input.imageKey !== "") {
        await SettingService.discardUploadedImage(userId, input.imageKey);
      }
      return { status: "invalid", fieldErrors };
    };

    const parsed = createSettingSchema.safeParse(input);
    if (!parsed.success) {
      return invalid(toFieldErrors(parsed.error));
    }

    try {
      const { id } = await SettingService.create(userId, parsed.data);
      return { status: "success", id };
    } catch (e) {
      if (e instanceof SettingRuleError || e instanceof SettingImageError) {
        return invalid({ [e.field]: e.message });
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
    input: { id: unknown } & Record<Exclude<CreateSettingField, "imageKey">, unknown>
  ): Promise<UpdateSettingResult> {
    const { id, ...fields } = input;
    const parsedId = settingIdSchema.safeParse(id);
    if (!parsedId.success) {
      return { status: "not_found", message: NOT_FOUND_MESSAGE };
    }

    // 編集では画像を変更しないため、imageKey が送られてきても updateSettingSchema で捨てる
    const parsed = updateSettingSchema.safeParse(fields);
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
