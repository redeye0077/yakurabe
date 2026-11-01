import { unstable_rethrow } from "next/navigation";
import { readSettingFormData, toFormValuesFromInput } from "@/lib/setting-form-values";
import type { SettingFormAction } from "@/types/setting-form";

export const SETTING_FORM_ERROR_MESSAGE = "送信に失敗しました。時間をおいて再度お試しください";

/**
 * useActionState に渡す保存の Action を画面側で包み、Action が例外を投げた場合(DB 障害・通信エラーなど)は
 * error.tsx に飛ばさず、フォームのエラー(formError)と送信した入力値を返す。
 * 成功時の redirect() は、クライアントでは redirect 用のエラーで reject されるため、
 * unstable_rethrow で Next.js の内部エラー(redirect・notFound など)だけはそのまま投げ直して遷移させる
 */
export function withFormError(action: SettingFormAction): SettingFormAction {
  return async (prevState, formData) => {
    try {
      return await action(prevState, formData);
    } catch (error) {
      unstable_rethrow(error);
      console.error("[setting-form] 送信に失敗しました", error);
      return {
        fieldErrors: {},
        values: toFormValuesFromInput(readSettingFormData(formData)),
        formError: SETTING_FORM_ERROR_MESSAGE,
      };
    }
  };
}
