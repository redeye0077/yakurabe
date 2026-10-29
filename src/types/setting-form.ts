import type { CreateSettingField } from "@/schemas/setting";
import type { CreateSettingFieldErrors } from "@/server/controllers/setting.controller";

// フォームの入力値。エラー時に戻す値と、編集時の初期値の両方で使う。ファイルなど文字列以外は空文字にする
export type SettingFormValues = Record<CreateSettingField, string>;

// 登録・編集フォームの Server Action が返す状態(useActionState 用)。
// message は特定の項目に属さないエラー(編集対象が見つからないなど)
export type SettingFormActionState = {
  fieldErrors: CreateSettingFieldErrors;
  values: SettingFormValues;
  message?: string;
} | null;

export type SettingFormAction = (
  prevState: SettingFormActionState,
  formData: FormData,
) => Promise<SettingFormActionState>;
