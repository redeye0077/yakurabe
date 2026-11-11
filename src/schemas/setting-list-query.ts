import { z } from "zod";

// /settings の1ページあたりの件数
export const SETTINGS_PAGE_SIZE = 12;

// /settings のパス。1ページ目へのリンクは page を付けずにここへ戻す
export const SETTINGS_LIST_PATH = "/settings";

// URL の searchParams の値(Next.js が渡す形)
export type SearchParamValue = string | string[] | undefined;
export type SearchParams = Record<string, SearchParamValue>;

/**
 * page の値。数字だけの文字列なら整数にし、それ以外(数字以外・小数・負の数・"1e3"・空文字・配列・未指定)は1にする。
 * 先頭の0は許して10進数として読む("01" は 1、"02" は 2)。
 * 1未満("0")も1にする。最後のページより大きい値はここでは補正せず、件数を知っている Service で補正する。
 * Number の安全な整数を超える桁数は Number.MAX_SAFE_INTEGER に丸める(Service の補正で最後のページになる)。
 * キーが無くても失敗しないよう optional にしている(Zod v4 の z.unknown() はキーの存在を求める)
 */
const pageSchema = z.unknown().optional().transform((value): number => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return 1;
  }
  const page = Number(value);
  if (!Number.isSafeInteger(page)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.max(page, 1);
});

// 一覧の検索条件。level・名前検索を足すときは、ここに項目を追加する
export const settingListQuerySchema = z.object({
  page: pageSchema,
});

export type SettingListQuery = z.infer<typeof settingListQuerySchema>;

// searchParams から一覧の検索条件を取り出す。不正な値は既定値にするため、失敗しない
export function parseSettingListQuery(searchParams: SearchParams): SettingListQuery {
  return settingListQuerySchema.parse(searchParams);
}
