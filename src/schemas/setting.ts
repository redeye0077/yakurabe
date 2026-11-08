import { z } from "zod";
import { CONTROL_CHAR_REGEX } from "@/schemas/auth";
import { settingLevelSchema } from "@/schemas/setting-level";
import {
  SETTING_IMAGE_MAX_BYTES,
  SETTING_IMAGE_SIZE_MESSAGE,
  SETTING_IMAGE_TYPE_MESSAGE,
  SETTING_IMAGE_TYPES,
  SETTING_IMAGE_UNVERIFIED_MESSAGE,
} from "@/lib/setting-image";

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

  // 任意。"" と null(FormData.get が返す null。フォームに項目が無い場合も含む)は null にする。DB には空文字を入れない
  level: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    settingLevelSchema.nullable()
  ),

  // 任意。画面が S3 にアップロードした画像の保存先キー。未選択(空文字・未送信)は null にする。
  // 本人のキーか・画像が実在して形式が正しいかは Service 側で確認する
  imageKey: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z
      .string({ error: SETTING_IMAGE_UNVERIFIED_MESSAGE })
      .max(191, SETTING_IMAGE_UNVERIFIED_MESSAGE)
      .nullable()
  ),
});

export type CreateSettingInput = z.infer<typeof createSettingSchema>;

// エラーを表示する入力項目
export type CreateSettingField = keyof CreateSettingInput;

// 画像のアップロード先(署名付き POST)の発行。形式は画面が先頭バイトで判定したものを受け取る
export const createSettingImageUploadSchema = z.object({
  contentType: z.enum(SETTING_IMAGE_TYPES, { error: SETTING_IMAGE_TYPE_MESSAGE }),
  size: z
    .number({ error: SETTING_IMAGE_TYPE_MESSAGE })
    .int(SETTING_IMAGE_TYPE_MESSAGE)
    .min(1, SETTING_IMAGE_TYPE_MESSAGE)
    .max(SETTING_IMAGE_MAX_BYTES, SETTING_IMAGE_SIZE_MESSAGE),
});

export type CreateSettingImageUploadInput = z.infer<typeof createSettingImageUploadSchema>;

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
