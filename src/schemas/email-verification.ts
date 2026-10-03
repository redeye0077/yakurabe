import { z } from "zod";

// 認証リンクのトークン。存在・有効期限はService側で判定するため、
// ここでは空でない文字列であることのみを確認する
export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
