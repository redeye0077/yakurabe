import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingService } from "@/server/services/setting.service";
import { SettingGrid } from "@/components/features/setting/setting-grid";

export default async function MyPage() {
  // DBの最新を毎回表示する。ビルド時に事前生成させない
  await connection();

  // middlewareで保護済みだが、セッションからuserIdを取れない場合に備えてログイン画面へ戻す
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  // 自分の投稿のみ。新着順・ページネーションなしで全件を表示する
  const settings = await SettingService.listByUser({ userId });

  return (
    <section className="px-6 pt-10 pb-16 md:px-12">
      <h1 className="font-heading text-[24px] font-semibold text-brand-ink">
        マイページ
      </h1>
      <h2 className="mt-8 font-heading text-[18px] font-semibold text-brand-ink">
        自分の投稿
      </h2>
      <div className="mt-4">
        <SettingGrid
          settings={settings}
          headingLevel={3}
          emptyMessage="まだ投稿がありません"
        />
      </div>
    </section>
  );
}
