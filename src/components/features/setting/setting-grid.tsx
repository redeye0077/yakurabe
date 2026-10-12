import { DartMark } from "@/components/common/dart-mark";
import { SettingCard } from "@/components/features/setting/setting-card";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

type SettingGridProps = {
  settings: SettingListItemDto[];
  // カードタイトルの見出しレベル。ページ内の見出し構造に合わせて呼び出し側が決める
  headingLevel: 2 | 3;
  // 0件のときの文言。マイページなど、ページに合わせて変えたい場合に渡す
  emptyMessage?: string;
};

// セッティングカードの並び。トップの新着・一覧ページ・マイページで共通に使う
export function SettingGrid({
  settings,
  headingLevel,
  emptyMessage = "まだセッティングが投稿されていません",
}: SettingGridProps) {
  if (settings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-brand-border bg-white px-6 py-12 text-center">
        <DartMark className="size-[34px] text-brand-muted" />
        <p className="text-[14px] text-brand-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {settings.map((setting) => (
        <SettingCard key={setting.id} setting={setting} headingLevel={headingLevel} />
      ))}
    </div>
  );
}
