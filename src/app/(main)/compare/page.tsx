import type { Metadata } from "next";
import { connection } from "next/server";
import { SettingService } from "@/server/services/setting.service";
import { SettingNotFoundError } from "@/server/errors/setting.error";
import type { SettingCompareDto } from "@/server/dto/setting.dto";
import { CompareTable } from "@/components/features/compare/compare-table";
import { CompareEmptyState } from "@/components/features/compare/compare-empty-state";
import { parseSettingCompareQuery } from "@/schemas/setting-compare-query";
import type { SearchParams } from "@/schemas/setting-list-query";

// root layout に title の template が無いため、サイト名まで書く
export const metadata: Metadata = {
  title: "セッティング比較 | 矢比べ",
};

type ComparePageProps = {
  searchParams: Promise<SearchParams>;
};

// 比較の内容を表示できない理由ごとの案内。どちらも一覧へのリンクを出す
const EMPTY_MESSAGES = {
  invalid: "比較するセッティングを2件選んでください",
  not_found: "比較するセッティングが見つかりませんでした。削除された可能性があります",
} as const;

type CompareResult =
  | { status: "ok"; data: SettingCompareDto }
  | { status: "invalid" }
  | { status: "not_found" };

// ids が不正なら DB に問い合わせずに invalid を返す。2件とも見つかれば比較の内容を、
// どちらかが見つからなければ not_found を返す。それ以外のエラーはそのまま throw する
async function findCompareData(query: ReturnType<typeof parseSettingCompareQuery>): Promise<CompareResult> {
  if (!query.ok) {
    return { status: "invalid" };
  }
  try {
    return { status: "ok", data: await SettingService.listForCompare(query.ids) };
  } catch (error) {
    if (error instanceof SettingNotFoundError) {
      return { status: "not_found" };
    }
    throw error;
  }
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  // DBの最新を毎回表示する。ビルド時に事前生成させない
  await connection();

  // 未ログインでも閲覧できる
  const result = await findCompareData(parseSettingCompareQuery(await searchParams));

  return (
    <section className="px-4 pt-10 pb-16 sm:px-6 md:px-12">
      <h1 className="font-heading text-[24px] font-semibold text-brand-ink">セッティング比較</h1>
      <div className="mt-6">
        {/* ids が不正な場合も、見つからない場合も 404 にはせず、理由に合わせた案内を出す */}
        {result.status === "ok" ? (
          <CompareTable data={result.data} />
        ) : (
          <CompareEmptyState message={EMPTY_MESSAGES[result.status]} />
        )}
      </div>
    </section>
  );
}
