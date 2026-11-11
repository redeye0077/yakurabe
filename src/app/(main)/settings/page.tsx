import { connection } from "next/server";
import { SettingService } from "@/server/services/setting.service";
import { SettingGrid } from "@/components/features/setting/setting-grid";
import { SampleImageNote } from "@/components/features/setting/sample-image-note";
import { PaginationNav, type PaginationNavItem } from "@/components/common/pagination-nav";
import { buildPageHref, buildPageItems, calcPageRange } from "@/lib/pagination";
import {
  parseSettingListQuery,
  SETTINGS_LIST_PATH,
  SETTINGS_PAGE_SIZE,
  type SearchParams,
} from "@/schemas/setting-list-query";

type SettingsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  // DBの最新を毎回表示する。ビルド時に事前生成させない
  await connection();

  const params = await searchParams;
  const query = parseSettingListQuery(params);

  // 未ログインでも閲覧できる。新着順で1ページ12件。範囲外の page は Service が最後のページ(0件なら1)に補正する
  const { items, total, page, pageSize, totalPages } = await SettingService.listPaged({
    page: query.page,
    pageSize: SETTINGS_PAGE_SIZE,
  });

  // リンクは今のクエリを引き継いで page だけを差し替える
  const hrefFor = (target: number) => buildPageHref(SETTINGS_LIST_PATH, params, target);
  const navItems: PaginationNavItem[] = buildPageItems(page, totalPages).map((item) =>
    item.type === "ellipsis"
      ? item
      : { type: "page", page: item.page, href: hrefFor(item.page), current: item.page === page },
  );
  const { from, to } = calcPageRange(page, pageSize, total);

  return (
    <section className="px-6 pt-10 pb-16 md:px-12">
      <h1 className="font-heading text-[24px] font-semibold text-brand-ink">
        セッティング一覧
      </h1>
      <SampleImageNote className="mt-2" />
      {total > 0 && (
        <p className="mt-4 text-[14px] text-brand-muted">
          全{total}件中 {from}〜{to}件
        </p>
      )}
      <div className="mt-6">
        <SettingGrid settings={items} headingLevel={2} />
      </div>
      {totalPages > 1 && (
        <PaginationNav
          className="mt-10"
          items={navItems}
          prevHref={page > 1 ? hrefFor(page - 1) : null}
          nextHref={page < totalPages ? hrefFor(page + 1) : null}
        />
      )}
    </section>
  );
}
