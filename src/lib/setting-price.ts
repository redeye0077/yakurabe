type PricedPart = { price: number };

/**
 * セッティングの合計価格(バレル+シャフト+フライト+チップ)。合計価格はDBに保存せず、表示のたびにこの関数で計算する。
 * シャフト一体型フライトを選んだ場合はシャフトが null になるため、シャフト分を加算しない。
 * 登録画面(クライアント)のプレビューでも使うため、server-only にはしない
 */
export function calcTotalPrice(parts: {
  barrel: PricedPart;
  shaft: PricedPart | null;
  flight: PricedPart;
  tip: PricedPart;
}): number {
  return (
    parts.barrel.price +
    (parts.shaft?.price ?? 0) +
    parts.flight.price +
    parts.tip.price
  );
}
