"use server";

import { redirect } from "next/navigation";
import { EmailVerificationController } from "@/server/controllers/email-verification.controller";

export type ResendVerificationActionState = { error: string };

/**
 * 確認メール再送フォームから呼ばれるServer Action。
 * 入力が不正な場合だけエラーを返し、それ以外はアカウントの有無に関係なく
 * 同じ完了画面へリダイレクトする(PRG)。
 * redirect()は例外で遷移を実現するため、try/catchの中では呼ばない。
 */
export async function resendVerificationAction(
  formData: FormData,
): Promise<ResendVerificationActionState> {
  const result = EmailVerificationController.resend({
    email: formData.get("email"),
  });
  if (result.status === "invalid") {
    return { error: result.message };
  }
  redirect("/verify/resend/sent");
}
