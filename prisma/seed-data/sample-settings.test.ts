import { describe, expect, it } from "vitest";
import type { TipThreadSize } from "@/schemas/tip";
import { seedBarrels, seedFlights, seedShafts, seedTips } from "./parts";
import { buildSampleDescription, sampleSettings } from "./sample-settings";
import { SAMPLE_USER_IDS } from "./sample-users";

// 組み合わせの判定に使う規格だけを、商品マスタ(parts.ts)の配列から id → 規格 のマップにしたもの
const toMap = <T extends { id: string }, V>(items: T[], pick: (item: T) => V): Record<string, V> =>
  Object.fromEntries(items.map((item) => [item.id, pick(item)]));

// バレルはスキーマにねじ規格を持たず、すべて 2BA とみなす(ソフトバレルの約95%が 2BA のため)
const BARREL_THREAD = toMap(seedBarrels, (): TipThreadSize => "TWO_BA");
const TIP_THREAD = toMap(seedTips, (t) => t.threadSize);
const SHAFT_SYSTEM = toMap(seedShafts, (s) => s.flightSystem);
// null はシャフト一体型(規格を持たない)。成型で規格が抜けていれば undefined になり、テストで落ちる
const FLIGHT_SYSTEM = toMap(seedFlights, (f) => (f.flightType === "SHAFT_INTEGRATED" ? null : f.flightSystem));

const SAMPLE_USER_ID_LIST: string[] = Object.values(SAMPLE_USER_IDS);

// 検索の確認用にタイトルにだけ書く語(sample-settings.ts の先頭コメントと同じ)
const TITLE_ONLY_WORDS = ["ストレート", "トルピード", "グリップ", "朝練"];

// JST の日付(YYYY-MM-DD)。UTC に9時間足してから日付部分を取る
const toJstDate = (date: Date): string => new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("サンプルセッティングの Seed データ", () => {
  it("id・画像の UUID・画像ファイル名が重複しない", () => {
    const ids = sampleSettings.map((s) => s.id);
    const images = sampleSettings.flatMap((s) => (s.image ? [s.image] : []));

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(images.map((i) => i.uuid)).size).toBe(images.length);
    expect(new Set(images.map((i) => i.fileName)).size).toBe(images.length);
  });

  it.each(sampleSettings)("$id: シャフトとフライトの規格が合っている(一体型ならシャフトなし)", (setting) => {
    const flightSystem = FLIGHT_SYSTEM[setting.flightId];
    expect(flightSystem).toBeDefined();

    if (flightSystem === null) {
      expect(setting.shaftId).toBeNull();
    } else {
      expect(setting.shaftId).not.toBeNull();
      expect(SHAFT_SYSTEM[setting.shaftId ?? ""]).toBe(flightSystem);
    }
  });

  it.each(sampleSettings)("$id: バレルとチップのねじ規格が合っている", (setting) => {
    expect(BARREL_THREAD[setting.barrelId]).toBeDefined();
    expect(TIP_THREAD[setting.tipId]).toBe(BARREL_THREAD[setting.barrelId]);
  });

  it.each(sampleSettings)("$id: 保存する説明文(AI 画像の注記込み)が 191 字以内", (setting) => {
    expect(buildSampleDescription(setting).length).toBeLessThanOrEqual(191);
  });

  it.each(sampleSettings)("$id: タイトルが【サンプル】で始まり、50字以内", (setting) => {
    expect(setting.title.startsWith("【サンプル】")).toBe(true);
    expect(setting.title.length).toBeLessThanOrEqual(50);
  });

  it.each(sampleSettings)("$id: userId がサンプルユーザーのどれか", (setting) => {
    expect(SAMPLE_USER_ID_LIST).toContain(setting.userId);
  });

  it("createdAt の日付(JST)が重ならない", () => {
    const dates = sampleSettings.map((s) => toJstDate(s.createdAt));
    expect(new Set(dates).size).toBe(dates.length);
  });

  it.each(sampleSettings)("$id: 説明文に検索語が入っていない", (setting) => {
    for (const word of TITLE_ONLY_WORDS) {
      expect(setting.description).not.toContain(word);
    }
  });

  it.todo("画像ありのサンプルは prisma/seed-images/ にファイルがある");
});
