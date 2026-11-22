// 比較ページで差を表示するときの文言。差は calcSettingDiff で計算した B − A の値を受け取る

// 0 のときの表示
export const NO_DIFF_LABEL = "差なし";

// マイナスはハイフン(-)ではなく U+2212(−)にする。「+」と幅がそろい、数字の前で目立つため
const MINUS_SIGN = "−";

function signOf(diff: number): string {
  return diff > 0 ? "+" : MINUS_SIGN;
}

// 重量の差。例: +1.5g / −1.5g。0 なら「差なし」。値は calcSettingDiff で 0.1g 単位に丸め済み
export function formatWeightDiff(diff: number): string {
  if (diff === 0) return NO_DIFF_LABEL;
  return `${signOf(diff)}${Math.abs(diff).toFixed(1)}g`;
}

// 合計価格の差。例: +¥1,200 / −¥1,200。0 なら「差なし」
export function formatPriceDiff(diff: number): string {
  if (diff === 0) return NO_DIFF_LABEL;
  return `${signOf(diff)}¥${Math.abs(diff).toLocaleString("ja-JP")}`;
}
