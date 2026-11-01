import type { CreateSettingField } from "@/schemas/setting";
import type {
  CreateSettingFieldErrors,
  CreateSettingImageUploadResult,
} from "@/server/controllers/setting.controller";

// フォームの入力値。エラー時に戻す値と、編集時の初期値の両方で使う。ファイルなど文字列以外は空文字にする
export type SettingFormValues = Record<CreateSettingField, string>;

// 登録・編集フォームの Server Action が返す状態(useActionState 用)。
// message は特定の項目に属さないエラー(編集対象が見つからないなど)。
// formError は Action が例外を投げた場合に、画面側(withFormError)で入れる
export type SettingFormActionState = {
  fieldErrors: CreateSettingFieldErrors;
  values: SettingFormValues;
  message?: string;
  formError?: string;
} | null;

export type SettingFormAction = (
  prevState: SettingFormActionState,
  formData: FormData,
) => Promise<SettingFormActionState>;

// 画像のアップロード先を発行する Server Action の結果。未ログインなら unauthenticated
// (画面は画像なしで保存の Action を呼び、そちらがログイン画面へリダイレクトする)
export type SettingImageUploadResult = CreateSettingImageUploadResult | { status: "unauthenticated" };

export type SettingImageUploadAction = (input: {
  contentType: string;
  size: number;
}) => Promise<SettingImageUploadResult>;
