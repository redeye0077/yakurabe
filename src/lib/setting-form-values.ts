import type { CreateSettingField } from "@/schemas/setting";
import type { SettingEditDto } from "@/server/dto/setting.dto";
import type { SettingFormValues } from "@/types/setting-form";

type SettingFormInput = Record<CreateSettingField, FormDataEntryValue | null>;

// 登録・編集フォームの FormData から、検証前の6項目を取り出す
export function readSettingFormData(formData: FormData): SettingFormInput {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    barrelId: formData.get("barrelId"),
    shaftId: formData.get("shaftId"),
    flightId: formData.get("flightId"),
    tipId: formData.get("tipId"),
  };
}

// エラー時にフォームへ戻す入力値。ファイルなど文字列以外は空文字にする
export function toFormValuesFromInput(input: SettingFormInput): SettingFormValues {
  const str = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");
  return {
    title: str(input.title),
    description: str(input.description),
    barrelId: str(input.barrelId),
    shaftId: str(input.shaftId),
    flightId: str(input.flightId),
    tipId: str(input.tipId),
  };
}

// 編集フォームの初期値。未入力の項目(null)は空文字にする
export function toSettingFormValues(setting: SettingEditDto): SettingFormValues {
  return {
    title: setting.title,
    description: setting.description ?? "",
    barrelId: setting.barrelId,
    shaftId: setting.shaftId ?? "",
    flightId: setting.flightId,
    tipId: setting.tipId,
  };
}
