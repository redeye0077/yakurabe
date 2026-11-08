import { SETTING_LEVEL_LABELS, type SettingLevel } from "@/schemas/setting-level";
import { cn } from "@/lib/utils";

type SettingLevelBadgeProps = {
  // 未設定(null)なら何も表示しない
  level: SettingLevel | null;
  // 置く場所に合わせた余白を呼び出し側が渡す
  className?: string;
};

// セッティングの対象レベルのバッジ。カードの文字(12px・brand-muted / brand-ink)に馴染むよう、
// 真鍮色を薄く敷いた控えめな見た目にする(shadcn の Badge は使わない)。
// 文字色は brand-brass-dark(#8e6b37)だとこの背景(白地に brass 10%)でコントラスト比 4.44 と AA の 4.5 に届かないため、
// 同じ色相で少し暗くした #876534(4.85)にする。brand-brass-dark は他でも使うので変えない
export function SettingLevelBadge({ level, className }: SettingLevelBadgeProps) {
  if (level === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] border border-brand-brass/40 bg-brand-brass/10 px-2 py-0.5 text-[11px] leading-[1.5] font-medium text-[#876534]",
        className
      )}
    >
      {SETTING_LEVEL_LABELS[level]}
    </span>
  );
}
