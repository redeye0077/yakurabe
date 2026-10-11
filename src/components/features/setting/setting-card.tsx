import Image from "next/image";
import { DartMark } from "@/components/common/dart-mark";
import type { SettingSummary } from "@/server/dto/setting.dto";

type SettingCardProps = {
  setting: SettingSummary;
};

export function SettingCard({ setting }: SettingCardProps) {
  return (
    // カードから詳細ページへのリンクは作らない方針
    <article className="overflow-hidden rounded-[12px] border border-brand-border bg-white">
      <div className="relative flex h-[140px] items-center justify-center bg-brand-border/50">
        {setting.imageUrl ? (
          <Image
            src={setting.imageUrl}
            alt={setting.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <DartMark className="size-[34px] text-brand-muted" />
        )}
      </div>
      <div className="px-4 py-3.5">
        <h3 className="line-clamp-2 text-[13.5px] leading-[1.4] font-bold text-brand-ink">
          {setting.title}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-brand-muted">
          <span className="truncate">{setting.userName}</span>
          <span className="shrink-0">{setting.barrelWeight.toFixed(1)}g</span>
        </div>
      </div>
    </article>
  );
}
