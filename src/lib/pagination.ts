// ページネーションの汎用処理。どの一覧でも使えるよう、特定のページの URL や件数には依存させない

export type PageItem = { type: "page"; page: number } | { type: "ellipsis" };

// ページ番号をすべて並べる上限。これを超えたら「…」で省略する
const MAX_VISIBLE_ITEMS = 7;

function pages(from: number, to: number): PageItem[] {
  return Array.from({ length: to - from + 1 }, (_, i) => ({ type: "page", page: from + i }));
}

const ELLIPSIS: PageItem = { type: "ellipsis" };

/**
 * ページ番号の並びを作る。7ページ以下なら全部並べ、それより多ければ先頭・末尾・現在のページの前後を残して「…」で省略する。
 * 並びの長さは常に7にそろえ、ページを移動してもナビの幅が変わりにくいようにする。
 * 例(全10ページ): 1ページ目 → 1 2 3 4 5 … 10、5ページ目 → 1 … 4 5 6 … 10、10ページ目 → 1 … 6 7 8 9 10
 * current は 1〜totalPages に補正済みの値を渡す
 */
export function buildPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_VISIBLE_ITEMS) {
    return pages(1, totalPages);
  }
  // 先頭側: 1〜5 と「…」と最後のページ
  if (current <= 4) {
    return [...pages(1, 5), ELLIPSIS, ...pages(totalPages, totalPages)];
  }
  // 末尾側: 最初のページと「…」と最後の5ページ
  if (current >= totalPages - 3) {
    return [...pages(1, 1), ELLIPSIS, ...pages(totalPages - 4, totalPages)];
  }
  return [...pages(1, 1), ELLIPSIS, ...pages(current - 1, current + 1), ELLIPSIS, ...pages(totalPages, totalPages)];
}

/**
 * 表示中のページが全体の何件目から何件目か(「全N件中 X〜Y件」の X と Y)。0件なら { from: 0, to: 0 }。
 * page は 1〜最後のページに補正済みの値を渡す
 */
export function calcPageRange(page: number, pageSize: number, total: number): { from: number; to: number } {
  if (total === 0) {
    return { from: 0, to: 0 };
  }
  const from = (page - 1) * pageSize + 1;
  return { from, to: Math.min(page * pageSize, total) };
}

/**
 * ページへのリンクを作る。今のクエリ(level・名前検索など)を引き継ぎ、page だけを差し替える。
 * 1ページ目は page を付けずに basePath だけにする(/settings?page=1 と /settings を同じ URL にそろえる)
 */
export function buildPageHref(
  basePath: string,
  params: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) {
      query.append(key, v);
    }
  }
  if (page > 1) {
    query.set("page", String(page));
  }
  const search = query.toString();
  return search === "" ? basePath : `${basePath}?${search}`;
}
