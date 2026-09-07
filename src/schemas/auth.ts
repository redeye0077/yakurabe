// schemas/auth.ts
import { z } from "zod";

// 制御文字・不可視文字を検出する正規表現
// (半角制御文字、ゼロ幅文字、BOMなどを弾く)
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\uFEFF]/;

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),

  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .min(8, "パスワードは8文字以上で入力してください")
    .max(50, "パスワードは50文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9!-/:-@¥[-`{-~]+$/,
      "パスワードは半角英数字と記号で入力してください"
    ),

  username: z
    .string()
    .trim() // 前後の空白(全角スペース含む)を除去してからチェック
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください")
    .refine(
      (value) => !CONTROL_CHAR_REGEX.test(value),
      "ユーザー名に使用できない文字が含まれています"
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が間違っています"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
