import { z } from "zod";
import { CONTROL_CHAR_REGEX } from "@/schemas/auth";

// CONTROL_CHAR_REGEX から改行(\n, \r)とタブ(\t)を除いたもの。複数行の入力欄で使う
const MULTILINE_CONTROL_CHAR_REGEX =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏﻿]/;

// 未選択(空文字)・未送信(null)・ファイルのどれでも同じ文言にする
function requiredId(message: string) {
  return z.string({ error: message }).min(1, message);
}

// セッティング登録フォーム。商品の存在や組み合わせ(規格・一体型)はService側で判定する
export const createSettingSchema = z.object({
  title: z
    .string({ error: "タイトルを入力してください" })
    .trim() // 前後の空白(全角スペース含む)を除去してからチェック
    .min(1, "タイトルを入力してください")
    .max(50, "タイトルは50文字以内で入力してください")
    .refine(
      (value) => !CONTROL_CHAR_REGEX.test(value),
      "タイトルに使用できない文字が含まれています"
    ),

  // 任意。改行・タブは入力できるようにする。trim後に空なら null にする
  description: z.preprocess(
    (value) => value ?? "",
    z
      .string({ error: "特徴・使用感の形式が正しくありません" })
      .trim()
      .max(191, "特徴・使用感は191文字以内で入力してください")
      .refine(
        (value) => !MULTILINE_CONTROL_CHAR_REGEX.test(value),
        "特徴・使用感に使用できない文字が含まれています"
      )
      .transform((value) => (value === "" ? null : value))
  ),

  barrelId: requiredId("バレルを選択してください"),
  flightId: requiredId("フライトを選択してください"),
  tipId: requiredId("チップを選択してください"),

  // シャフト一体型フライトでは選ばないため、未選択は null にする。必須かどうかはService側で判定する
  shaftId: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.string({ error: "シャフトの形式が正しくありません" }).nullable()
  ),
});

export type CreateSettingInput = z.infer<typeof createSettingSchema>;

// エラーを表示する入力項目
export type CreateSettingField = keyof CreateSettingInput;

// セッティングの削除。id の形式(cuid)までは見ず、存在と投稿者の確認は Service 側で行う
export const deleteSettingSchema = z.object({
  id: z
    .string({ error: "削除するセッティングが正しくありません" })
    .trim()
    .min(1, "削除するセッティングが正しくありません"),
});

export type DeleteSettingInput = z.infer<typeof deleteSettingSchema>;

// 編集対象のセッティングの id。形式が誤っている場合は Controller で「見つからない」として扱う
export const settingIdSchema = z.string().trim().min(1);
