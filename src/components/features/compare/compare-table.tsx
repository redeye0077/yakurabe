import type { ReactNode } from "react";
import Image from "next/image";
import { DartMark } from "@/components/common/dart-mark";
import { SettingLevelBadge } from "@/components/features/setting/setting-level-badge";
import { formatPriceDiff, formatWeightDiff, NO_DIFF_LABEL } from "@/lib/setting-compare-format";
import type { SettingPartKey } from "@/lib/setting-compare";
import type { SettingCompareDto, SettingCompareItemDto } from "@/server/dto/setting.dto";

type CompareTableProps = {
  data: SettingCompareDto;
};

// サーバーがUTCで動いていても日本の日付で表示する(SettingCard と同じ形式)
const postedDateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const COLUMN_LABELS = ["A", "B"] as const;

// PC は「項目名 | A | B」の3列、スマホは A | B の2列にし、項目名は各行の上に横幅いっぱいで置く
const ROW_GRID = "grid grid-cols-2 gap-x-3 md:grid-cols-[140px_1fr_1fr] md:gap-x-5";

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

// パーツの同じ/違う。色だけに頼らないよう、文字でも示す
function SameBadge({ same }: { same: boolean }) {
  return same ? (
    <span className="inline-flex items-center rounded-[6px] border border-brand-border px-2 py-0.5 text-[11px] leading-[1.5] text-brand-muted">
      同じ
    </span>
  ) : (
    // 文字色は SettingLevelBadge と同じ理由(コントラスト比 AA)で #876534 にする
    <span className="inline-flex items-center rounded-[6px] border border-brand-brass/40 bg-brand-brass/10 px-2 py-0.5 text-[11px] leading-[1.5] font-bold text-[#876534]">
      違う
    </span>
  );
}

// 重量・合計価格の差(B − A)。0 なら「差なし」だけを表示する
function DiffLabel({ text }: { text: string }) {
  if (text === NO_DIFF_LABEL) {
    return <span className="text-[12px] text-brand-muted">{text}</span>;
  }
  return (
    <span className="text-[12px] text-brand-muted">
      差(B − A) <span className="text-[13px] font-bold text-brand-ink">{text}</span>
    </span>
  );
}

type CompareRowProps = {
  label: string;
  // 項目名の横に置く「同じ/違う」や差
  aside: ReactNode;
  values: [ReactNode, ReactNode];
};

function CompareRow({ label, aside, values }: CompareRowProps) {
  return (
    <div className={`${ROW_GRID} gap-y-1.5 py-3.5`}>
      <dt className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:flex-col md:items-start md:gap-1">
        <span className="text-[13px] font-bold text-brand-ink">{label}</span>
        {aside}
      </dt>
      {values.map((value, i) => (
        <dd key={COLUMN_LABELS[i]} className="min-w-0 text-[13px] leading-[1.5] break-words text-brand-ink">
          {/* 列見出しは上部に1度だけ出すため、読み上げでどちらの値か分かるよう A / B を付ける */}
          <span className="sr-only">{COLUMN_LABELS[i]}: </span>
          {value}
        </dd>
      ))}
    </div>
  );
}

// 商品名と価格。シャフト一体型フライトの場合はシャフトが null なので「一体型」と表示し、価格は「—」にする
function PartValue({ part }: { part: { name: string; price: number } | null }) {
  return (
    <>
      <span className="block">{part?.name ?? "一体型"}</span>
      <span className="block text-[12px] text-brand-muted">{part ? formatPrice(part.price) : "—"}</span>
    </>
  );
}

function CompareHeader({ label, setting }: { label: string; setting: SettingCompareItemDto }) {
  return (
    <div className="min-w-0">
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-green text-[12px] font-bold text-brand-cream">
        {label}
      </span>
      {/* サンプル画像は横長(1376×768)のため、枠は 16:9 にして画像全体を contain で収める(切らない)。
          余った部分は SettingCard と同じ背景色にする。画像が無いときの DartMark も同じ枠で表示し、A と B の高さをそろえる */}
      <div className="relative mt-2 flex aspect-video items-center justify-center overflow-hidden rounded-[10px] bg-brand-border/50">
        {setting.imageUrl ? (
          <Image
            src={setting.imageUrl}
            alt={setting.title}
            fill
            sizes="(min-width: 768px) 360px, 50vw"
            className="object-contain"
          />
        ) : (
          <DartMark className="size-[34px] text-brand-muted" />
        )}
      </div>
      <h2 className="mt-2.5 text-[14px] leading-[1.4] font-bold break-words text-brand-ink">{setting.title}</h2>
      {/* レベルが無くても A と B で下の行がずれないよう、バッジ1つ分の高さを空けておく(SettingCard と同じ) */}
      <div className="mt-1.5 flex min-h-[22.5px] items-start">
        <SettingLevelBadge level={setting.level} />
      </div>
      <p className="mt-1.5 truncate text-[12px] text-brand-muted">{setting.userName}</p>
      <time dateTime={setting.createdAt} className="block text-[12px] text-brand-muted">
        {postedDateFormat.format(new Date(setting.createdAt))}
      </time>
    </div>
  );
}

const PART_ROWS: { key: SettingPartKey; label: string }[] = [
  { key: "barrel", label: "バレル" },
  { key: "shaft", label: "シャフト" },
  { key: "flight", label: "フライト" },
  { key: "tip", label: "チップ" },
];

/**
 * セッティング2件の比較表。A は左、B は右で、差は B − A。
 * パーツの行は名前と価格だけにし、重量は「重量」の行にまとめる(PC とスマホで同じ並び)
 */
export function CompareTable({ data }: CompareTableProps) {
  const { settings, diff } = data;
  const [a, b] = settings;

  return (
    <div className="mx-auto max-w-[880px]">
      <div className={ROW_GRID}>
        {/* PC では項目名の列の分を空ける */}
        <div className="hidden md:block" />
        {settings.map((setting, i) => (
          <CompareHeader key={COLUMN_LABELS[i]} label={COLUMN_LABELS[i]} setting={setting} />
        ))}
      </div>
      <dl className="mt-6 divide-y divide-brand-border border-y border-brand-border">
        {PART_ROWS.map(({ key, label }) => (
          <CompareRow
            key={key}
            label={label}
            aside={<SameBadge same={diff.sameParts[key]} />}
            values={[<PartValue key="a" part={a[key]} />, <PartValue key="b" part={b[key]} />]}
          />
        ))}
        <CompareRow
          label="重量"
          aside={<DiffLabel text={formatWeightDiff(diff.barrelWeightDiff)} />}
          values={[`${a.barrel.weight.toFixed(1)}g`, `${b.barrel.weight.toFixed(1)}g`]}
        />
        <CompareRow
          label="合計価格"
          aside={<DiffLabel text={formatPriceDiff(diff.totalPriceDiff)} />}
          values={[
            <span key="a" className="font-bold">{formatPrice(a.totalPrice)}</span>,
            <span key="b" className="font-bold">{formatPrice(b.totalPrice)}</span>,
          ]}
        />
      </dl>
    </div>
  );
}
