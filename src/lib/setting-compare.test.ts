import { describe, it, expect } from "vitest";
import { calcSettingDiff, type SettingCompareInput } from "@/lib/setting-compare";

// 基準のセッティング。各テストでは違いを出したい項目だけを上書きする
const base: SettingCompareInput = {
    barrel: { id: "barrel-a", weight: 18.0, price: 17600 },
    shaft: { id: "shaft-a", price: 4180 },
    flight: { id: "flight-a", price: 1080 },
    tip: { id: "tip-a", price: 770 },
};

describe("calcSettingDiff", () => {
    it("同じ組み合わせなら差は 0 で、パーツはすべて同じ", () => {
        expect(calcSettingDiff(base, base)).toEqual({
            barrelWeightDiff: 0,
            totalPriceDiff: 0,
            sameParts: { barrel: true, shaft: true, flight: true, tip: true },
        });
    });

    it("重量と合計価格の差は B − A で計算する", () => {
        const b: SettingCompareInput = {
            ...base,
            barrel: { id: "barrel-b", weight: 20.5, price: 19800 },
        };

        const diff = calcSettingDiff(base, b);
        expect(diff.barrelWeightDiff).toBe(2.5);
        expect(diff.totalPriceDiff).toBe(2200);
        expect(calcSettingDiff(b, base).barrelWeightDiff).toBe(-2.5);
        expect(calcSettingDiff(b, base).totalPriceDiff).toBe(-2200);
    });

    it("重量の差は小数の誤差を消して 0.1g 単位に丸める", () => {
        const a = { ...base, barrel: { ...base.barrel, weight: 18.2 } };
        const b = { ...base, barrel: { id: "barrel-b", weight: 18.3, price: 17600 } };

        expect(calcSettingDiff(a, b).barrelWeightDiff).toBe(0.1);
        expect(calcSettingDiff(b, a).barrelWeightDiff).toBe(-0.1);
    });

    it("同じ重量で違うバレルなら、重量の差は 0 でバレルは違うと判定する", () => {
        const b: SettingCompareInput = {
            ...base,
            barrel: { id: "barrel-b", weight: 18.0, price: 17600 },
        };

        const diff = calcSettingDiff(base, b);
        expect(diff.barrelWeightDiff).toBe(0);
        expect(Object.is(diff.barrelWeightDiff, -0)).toBe(false);
        expect(diff.sameParts.barrel).toBe(false);
    });

    it("一体型同士(シャフトが両方 null)なら、シャフトは同じと判定し価格にも加算しない", () => {
        const a: SettingCompareInput = { ...base, shaft: null, flight: { id: "flight-int", price: 1980 } };
        const b: SettingCompareInput = { ...base, shaft: null, flight: { id: "flight-int", price: 1980 } };

        const diff = calcSettingDiff(a, b);
        expect(diff.sameParts.shaft).toBe(true);
        expect(diff.sameParts.flight).toBe(true);
        expect(diff.totalPriceDiff).toBe(0);
    });

    it("片方だけ一体型なら、シャフトは違うと判定し、シャフトの価格の分だけ差が出る", () => {
        const integrated: SettingCompareInput = {
            ...base,
            shaft: null,
            flight: { id: "flight-int", price: 1080 },
        };

        const diff = calcSettingDiff(base, integrated);
        expect(diff.sameParts.shaft).toBe(false);
        expect(diff.sameParts.flight).toBe(false);
        expect(diff.totalPriceDiff).toBe(-4180);
        expect(calcSettingDiff(integrated, base).sameParts.shaft).toBe(false);
    });

    it("価格が同じでも id が違うパーツは違うと判定する", () => {
        const b: SettingCompareInput = {
            ...base,
            flight: { id: "flight-b", price: 1080 },
            tip: { id: "tip-b", price: 770 },
        };

        expect(calcSettingDiff(base, b).sameParts).toEqual({
            barrel: true,
            shaft: true,
            flight: false,
            tip: false,
        });
    });
});
