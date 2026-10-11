import { describe, it, expect } from "vitest";
import { calcTotalPrice } from "@/lib/setting-price";

describe("calcTotalPrice", () => {
    it("シャフトがある場合は4パーツの価格を合計する", () => {
        expect(
            calcTotalPrice({
                barrel: { price: 17600 },
                shaft: { price: 4180 },
                flight: { price: 1080 },
                tip: { price: 770 },
            })
        ).toBe(23630);
    });

    it("シャフトがnull(一体型フライト)の場合はシャフト分を加算しない", () => {
        expect(
            calcTotalPrice({
                barrel: { price: 17600 },
                shaft: null,
                flight: { price: 1980 },
                tip: { price: 880 },
            })
        ).toBe(20460);
    });
});
