import Image from "next/image";
import { DartMark } from "@/components/common/dart-mark";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

type SettingCardProps = {
  setting: SettingListItemDto;
  // トップは h2「新着のセッティング」の下なので 3、一覧ページは h1 の直下なので 2
  headingLevel: 2 | 3;
};

// サーバーがUTCで動いていても日本の日付で表示する
const postedDateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function SettingCard({ setting, headingLevel }: SettingCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const parts = [
    { label: "バレル", name: setting.barrelName },
    // シャフト一体型フライトの場合はシャフトを選ばないため null になる
    { label: "シャフト", name: setting.shaftName ?? "一体型" },
    { label: "フライト", name: setting.flightName },
    { label: "チップ", name: setting.tipName },
  ];

  return (
    // カードから詳細ページへのリンクは作らない方針
    <article className="overflow-hidden rounded-[12px] border border-brand-border bg-white">
      <div className="relative flex h-[140px] items-center justify-center bg-brand-border/50">
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
      <div className="px-4 py-3.5">
        <Heading className="line-clamp-2 text-[13.5px] leading-[1.4] font-bold text-brand-ink">
          {setting.title}
        </Heading>
        <dl className="mt-2.5 space-y-1 text-[12px] leading-[1.5]">
          {parts.map((part) => (
            <div key={part.label} className="flex gap-2">
              <dt className="w-[52px] shrink-0 text-brand-muted">{part.label}</dt>
              <dd className="min-w-0 truncate text-brand-ink">{part.name}</dd>
            </div>
          ))}
        </dl>
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
      </div>
    </article>
  );
}
