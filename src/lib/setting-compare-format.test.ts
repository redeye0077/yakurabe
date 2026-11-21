import { describe, it, expect } from "vitest";
import { formatPriceDiff, formatWeightDiff } from "@/lib/setting-compare-format";

describe("formatWeightDiff", () => {
    it("正の値は + を付け、小数1桁で表示する", () => {
        expect(formatWeightDiff(1.5)).toBe("+1.5g");
        expect(formatWeightDiff(2)).toBe("+2.0g");
    });

    it("負の値は U+2212 のマイナスを付ける", () => {
        expect(formatWeightDiff(-1.5)).toBe("−1.5g");
    });

    it("0 なら「差なし」", () => {
        expect(formatWeightDiff(0)).toBe("差なし");
    });
});

describe("formatPriceDiff", () => {
    it("正の値は + を付け、3桁区切りで表示する", () => {
        expect(formatPriceDiff(1200)).toBe("+¥1,200");
        expect(formatPriceDiff(800)).toBe("+¥800");
    });

    it("負の値は U+2212 のマイナスを付ける", () => {
        expect(formatPriceDiff(-1200)).toBe("−¥1,200");
    });

    it("0 なら「差なし」", () => {
        expect(formatPriceDiff(0)).toBe("差なし");
    });
});
