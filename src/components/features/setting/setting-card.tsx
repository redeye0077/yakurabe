import type { ReactNode } from "react";
import Image from "next/image";
import { DartMark } from "@/components/common/dart-mark";
import { SettingLevelBadge } from "@/components/features/setting/setting-level-badge";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

type SettingCardProps = {
  setting: SettingListItemDto;
  // トップは h2「新着のセッティング」の下なので 3、一覧ページは h1 の直下なので 2
  headingLevel: 2 | 3;
  // カード下部に差し込む操作ボタン(マイページの削除など)。トップ・一覧では渡さない
  actions?: ReactNode;
};

// サーバーがUTCで動いていても日本の日付で表示する
const postedDateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function SettingCard({ setting, headingLevel, actions }: SettingCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const parts = [
    { label: "バレル", name: setting.barrelName },
    // シャフト一体型フライトの場合はシャフトを選ばないため null になる
    { label: "シャフト", name: setting.shaftName ?? "一体型" },
    { label: "フライト", name: setting.flightName },
    { label: "チップ", name: setting.tipName },
  ];

  return (
    // カードから詳細ページへのリンクは作らない方針。
    // グリッドの同じ行で高さが伸びたとき、レベル・画像の有無やタイトルの行数に関係なく下段がカードの下端にそろうよう、縦の flex にする
    <article className="flex h-full flex-col overflow-hidden rounded-[12px] border border-brand-border bg-white">
      <div className="relative flex h-[140px] shrink-0 items-center justify-center bg-brand-border/50">
        {setting.imageUrl ? (
          <Image
            src={setting.imageUrl}
            alt={setting.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <DartMark className="size-[34px] text-brand-muted" />
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 py-3.5">
        {/* 1行のタイトルでもパーツ一覧の開始位置がそろうよう、常に2行分の高さを確保する。
            2lh は「この要素の行の高さ × 2」なので、文字サイズや行間を変えても書き直さなくてよい */}
        <Heading className="line-clamp-2 min-h-[2lh] text-[13.5px] leading-[1.4] font-bold text-brand-ink">
          {setting.title}
        </Heading>
        {/* レベルが無くても同じ高さを空けておく枠。最低の高さはバッジ1つ分
            (文字 11px × 行間 1.5 + 上下の padding 2px × 2 + 上下の border 1px × 2 = 22.5px)。
            min-h なので、文字が大きくなる環境ではバッジに合わせて伸び、はみ出さない。バッジの見た目を変えたらここも合わせる。
            flex にしてバッジを flex アイテムにし、行の高さで余分な隙間ができないようにする */}
        <div className="mt-2 flex min-h-[22.5px] items-start">
          <SettingLevelBadge level={setting.level} />
        </div>
        <dl className="mt-2.5 space-y-1 text-[12px] leading-[1.5]">
          {parts.map((part) => (
            <div key={part.label} className="flex gap-2">
              <dt className="w-[52px] shrink-0 text-brand-muted">{part.label}</dt>
              <dd className="min-w-0 truncate text-brand-ink">{part.name}</dd>
            </div>
          ))}
        </dl>
        {/* 下段(重量・合計・投稿者・日付・操作ボタン)。mt-auto で残りの高さを上に空け、カードの下端に寄せる */}
        <div className="mt-auto">
          <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-brand-border pt-2.5">
            <span className="text-[12px] text-brand-muted">
              バレル <span className="text-brand-ink">{setting.barrelWeight.toFixed(1)}g</span>
            </span>
            <span className="text-[12px] text-brand-muted">
              合計{" "}
              <span className="text-[14px] font-bold text-brand-ink">
                ¥{setting.totalPrice.toLocaleString("ja-JP")}
              </span>
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-brand-muted">
            <span className="truncate">{setting.userName}</span>
            <time dateTime={setting.createdAt} className="shrink-0">
              {postedDateFormat.format(new Date(setting.createdAt))}
            </time>
          </div>
          {actions && (
            <div className="mt-2.5 flex justify-end gap-2 border-t border-brand-border pt-2.5">
              {actions}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
