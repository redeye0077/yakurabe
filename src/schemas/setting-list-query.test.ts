import { describe, it, expect } from "vitest";
import { parseSettingListQuery } from "@/schemas/setting-list-query";

describe("parseSettingListQuery の page", () => {
    it.each([
        ["数字以外", "abc"],
        ["小数", "1.5"],
        ["負の数", "-1"],
        ["0", "0"],
        ["空文字", ""],
        ["指数表記", "1e3"],
        ["前後の空白", " 2 "],
    ])("%s(%j)は 1 にする", (_, value) => {
        expect(parseSettingListQuery({ page: value })).toEqual({ page: 1 });
    });

    it("配列(?page=2&page=3)は 1 にする", () => {
        expect(parseSettingListQuery({ page: ["2", "3"] })).toEqual({ page: 1 });
    });

    it("未指定(undefined)は 1 にする", () => {
        expect(parseSettingListQuery({})).toEqual({ page: 1 });
        expect(parseSettingListQuery({ page: undefined })).toEqual({ page: 1 });
    });

    it('"2" は 2 にする', () => {
        expect(parseSettingListQuery({ page: "2" })).toEqual({ page: 2 });
    });

    it("先頭の 0 は許して 10 進数として読む(\"01\" は 1、\"02\" は 2)", () => {
        expect(parseSettingListQuery({ page: "01" })).toEqual({ page: 1 });
        expect(parseSettingListQuery({ page: "02" })).toEqual({ page: 2 });
    });

    it("非常に大きい数字もパースは通す(最後のページへの補正は Service で行う)", () => {
        expect(parseSettingListQuery({ page: "999999" })).toEqual({ page: 999999 });
    });

    it("安全な整数を超える桁数は Number.MAX_SAFE_INTEGER に丸める", () => {
        expect(parseSettingListQuery({ page: "99999999999999999999" })).toEqual({
            page: Number.MAX_SAFE_INTEGER,
        });
    });

    it("page 以外のクエリは検索条件に含めない", () => {
        expect(parseSettingListQuery({ page: "3", other: "x" })).toEqual({ page: 3 });
    });
});
