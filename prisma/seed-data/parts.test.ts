import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { createBarrelSchema } from "@/schemas/barrel";
import { createShaftSchema } from "@/schemas/shaft";
import { createFlightSchema } from "@/schemas/flight";
import { createTipSchema } from "@/schemas/tip";
import { seedBarrels, seedFlights, seedShafts, seedTips } from "./parts";

// 1件ずつスキーマで検証する(price: 0 などの入れ忘れを Seed の実行前に見つけるため)。
// スキーマは余分な項目を捨てるので、id は付けたまま渡す。
// フライトのタイプと規格・長さのルールは Service(FlightService.upsert)にあり、ここでは確かめない(Seed の実行で確かめる)
function itPassesSchema(items: { id: string }[], schema: z.ZodType) {
  it.each(items)("$id: スキーマの検証を通る", (item) => {
    expect(schema.safeParse(item).error).toBeUndefined();
  });
}

describe("商品マスタの Seed データ", () => {
  it.each([
    ["バレル", seedBarrels],
    ["シャフト", seedShafts],
    ["フライト", seedFlights],
    ["チップ", seedTips],
  ] as const)("%s: 商品 id が重複しない", (_, items) => {
    const ids = items.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe("バレル", () => itPassesSchema(seedBarrels, createBarrelSchema));
  describe("シャフト", () => itPassesSchema(seedShafts, createShaftSchema));
  describe("フライト", () => itPassesSchema(seedFlights, createFlightSchema));
  describe("チップ", () => itPassesSchema(seedTips, createTipSchema));
});
