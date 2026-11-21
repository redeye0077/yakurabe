import { z } from "zod";
import type { SearchParams } from "@/schemas/setting-list-query";

// /compare のパス。ids に比べる2件の id を「,」区切りで渡す(例: /compare?ids=a,b)
export const SETTING_COMPARE_PATH = "/compare";

/**
 * セッティングの id の形。DB の id は cuid だが、Seed の固定 id(例: sample-setting-01)も通すため、
 * cuid かどうかではなく英数字・「_」・「-」の 1〜64 文字で確かめる。
 * 存在するかどうかは Service が確かめるため、ここでは明らかにおかしい値を DB に問い合わせる前に弾くだけにする
 */
const settingIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

/**
 * ids の値。文字列でない(未指定・?ids=a&ids=b のような配列)、2件でない、空の要素や空白を含む、
 * 同じ id が2つある場合は失敗する。trim はしない(空白を含む値はそのまま不正とする)
 */
const settingCompareIdsSchema = z
  .string()
  .transform((value) => value.split(","))
  .pipe(z.tuple([settingIdSchema, settingIdSchema]))
  .refine(([a, b]) => a !== b);

export type SettingCompareQuery = { ok: true; ids: [string, string] } | { ok: false };

// searchParams から比べる2件の id を取り出す。不正なら ok: false を返し、throw しない
export function parseSettingCompareQuery(searchParams: SearchParams): SettingCompareQuery {
  const result = settingCompareIdsSchema.safeParse(searchParams.ids);
  return result.success ? { ok: true, ids: result.data } : { ok: false };
}
