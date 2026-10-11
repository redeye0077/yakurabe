import { connection } from "next/server";
import { SettingService } from "@/server/services/setting.service";
import { SettingGrid } from "@/components/features/setting/setting-grid";

export default async function SettingsPage() {
  // DBの最新を毎回表示する。ビルド時に事前生成させない
  await connection();

  // 未ログインでも閲覧できる。新着順・ページネーションなしで全件を表示する
  const settings = await SettingService.listLatest();

  return (
    <section className="px-6 pt-10 pb-16 md:px-12">
      <h1 className="font-heading text-[24px] font-semibold text-brand-ink">
        セッティング一覧
      </h1>
      <div className="mt-6">
        <SettingGrid settings={settings} headingLevel={2} />
      </div>
    </section>
  );
}
