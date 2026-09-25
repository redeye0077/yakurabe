import Link from "next/link";
import { SettingCard } from "@/components/features/setting/setting-card";
import type { SettingSummary } from "@/server/dto/setting.dto";

type LatestSettingsProps = {
  settings: SettingSummary[];
};

export function LatestSettings({ settings }: LatestSettingsProps) {
  return (
    <section className="px-6 pt-4 pb-16 md:px-12">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[21px] font-semibold text-brand-ink">
          新着のセッティング
        </h2>
        <Link
          href="/settings"
          className="text-[13.5px] text-brand-brass transition-colors hover:text-brand-brass-dark hover:underline"
        >
          もっと見る &gt;
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {settings.map((setting) => (
          <SettingCard key={setting.id} setting={setting} />
        ))}
      </div>
    </section>
  );
}
