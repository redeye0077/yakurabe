import { calcTotalPrice } from "@/lib/setting-price";

type ComparePart = { id: string; price: number };

// 比較に必要な項目。パーツの同じ/違うは名前ではなく商品の id で判定する
export type SettingCompareInput = {
  barrel: ComparePart & { weight: number };
  shaft: ComparePart | null; // シャフト一体型フライトの場合は null
  flight: ComparePart;
  tip: ComparePart;
};

export type SettingPartKey = "barrel" | "shaft" | "flight" | "tip";

export type SettingDiff = {
  barrelWeightDiff: number; // g。B − A を 0.1g 単位に丸めた値
  totalPriceDiff: number; // 円。B − A
  sameParts: Record<SettingPartKey, boolean>; // パーツごとに同じ商品なら true
};

// 小数の引き算の誤差(例: 18.3 - 18.2 = 0.10000000000000142)を消すため 0.1 単位に丸める。
// 丸めた結果の -0 は 0 にそろえる
function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10 + 0;
}

// シャフトは両方 null(一体型同士)なら同じ、片方だけ null なら違うとみなす
function isSamePart(a: { id: string } | null, b: { id: string } | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a.id === b.id;
}

/**
 * セッティング A と B の差分。差は B − A で計算する(B のほうが重い・高いと正の値)。
 * 重量はバレル重量を比べる。合計価格は保存していないため calcTotalPrice で計算する。
 * Service とクライアントの両方から使えるよう、server-only にはしない
 */
export function calcSettingDiff(a: SettingCompareInput, b: SettingCompareInput): SettingDiff {
  return {
    barrelWeightDiff: roundToTenth(b.barrel.weight - a.barrel.weight),
    totalPriceDiff: calcTotalPrice(b) - calcTotalPrice(a),
    sameParts: {
      barrel: isSamePart(a.barrel, b.barrel),
      shaft: isSamePart(a.shaft, b.shaft),
      flight: isSamePart(a.flight, b.flight),
      tip: isSamePart(a.tip, b.tip),
    },
  };
}
