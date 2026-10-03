"use server";

import { redirect } from "next/navigation";
import {
  EmailVerificationController,
  type VerifyEmailResult,
} from "@/server/controllers/email-verification.controller";

const RESULT_PATHS: Record<VerifyEmailResult, string> = {
  success: "/verify/success",
  expired: "/verify/expired",
  invalid: "/verify/invalid",
};

/**
 * 認証リンクの確認ボタンから呼ばれるServer Action。
 * 検証はControllerに任せ、結果ごとの画面へリダイレクトする(PRG)。
 * redirect()は例外で遷移を実現するため、try/catchの中では呼ばない。
 */
export async function verifyEmailAction(formData: FormData): Promise<void> {
  const result = await EmailVerificationController.verify({
    token: formData.get("token"),
  });
  redirect(RESULT_PATHS[result]);
}
