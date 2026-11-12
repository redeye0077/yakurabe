import { describe, expect, it } from "vitest";
import { buildSampleDescription, sampleSettings } from "./sample-settings";

// prisma/seed.ts の商品マスタから、組み合わせの判定に使う規格だけを書き写したもの(商品を変えたらここも合わせる)。
// バレルはスキーマにねじ規格を持たず、すべて 2BA とみなす(ソフトバレルの約95%が 2BA のため)
const BARREL_THREAD: Record<string, "TWO_BA" | "NO_5"> = {
  "seed-barrel-01": "TWO_BA",
  "seed-barrel-02": "TWO_BA",
  "seed-barrel-03": "TWO_BA",
  "seed-barrel-04": "TWO_BA",
  "seed-barrel-05": "TWO_BA",
};
const TIP_THREAD: Record<string, "TWO_BA" | "NO_5"> = {
  "seed-tip-01": "TWO_BA",
  "seed-tip-02": "TWO_BA",
  "seed-tip-03": "TWO_BA",
  "seed-tip-04": "TWO_BA",
  "seed-tip-05": "TWO_BA",
};
const SHAFT_SYSTEM: Record<string, string> = {
  "seed-shaft-01": "UNIVERSAL",
  "seed-shaft-02": "FIT",
  "seed-shaft-03": "UNIVERSAL",
  "seed-shaft-04": "EIGHT",
  "seed-shaft-05": "FIT",
};
// null はシャフト一体型(規格を持たない)
const FLIGHT_SYSTEM: Record<string, string | null> = {
  "seed-flight-01": "UNIVERSAL",
  "seed-flight-02": null,
  "seed-flight-03": "FIT",
  "seed-flight-04": "EIGHT",
  "seed-flight-05": "FIT",
};

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
});
