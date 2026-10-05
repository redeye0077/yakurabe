import { z } from "zod";

// 認証リンクのトークン。存在・有効期限はService側で判定するため、
// ここでは空でない文字列であることのみを確認する
export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// 確認メール再送フォーム。アカウントの有無・認証状態はService側で判定する
export const resendVerificationSchema = z.object({
  // フォームを経由しないリクエストでemailが欠けている(null)場合も同じ文言にする
  email: z
    .string({ error: "メールアドレスを入力してください" })
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
