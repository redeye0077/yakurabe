import Link from "next/link";
import { SettingGrid } from "@/components/features/setting/setting-grid";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

type LatestSettingsProps = {
  settings: SettingListItemDto[];
};

export function LatestSettings({ settings }: LatestSettingsProps) {
  return (
    <section className="px-6 pt-4 pb-16 md:px-12">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[21px] font-semibold text-brand-ink">
          新着のセッティング
        </h2>
        {/* 0件のときは一覧ページも空なので出さない */}
        {settings.length > 0 && (
          <Link
            href="/settings"
            className="text-[13.5px] text-brand-brass transition-colors hover:text-brand-brass-dark hover:underline"
          >
            もっと見る &gt;
          </Link>
        )}
      </div>
      <div className="mt-5">
        <SettingGrid settings={settings} headingLevel={3} />
      </div>
    </section>
  );
}
