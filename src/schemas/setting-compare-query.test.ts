import { describe, it, expect } from "vitest";
import { buildSettingCompareHref, parseSettingCompareQuery } from "@/schemas/setting-compare-query";

describe("parseSettingCompareQuery", () => {
    it("「,」区切りの2件なら、その順で ids を返す", () => {
        expect(parseSettingCompareQuery({ ids: "setting-a,setting-b" })).toEqual({
            ok: true,
            ids: ["setting-a", "setting-b"],
        });
    });

    it("cuid の形の id と、Seed の固定 id(英数字・_・-)を通す", () => {
        expect(parseSettingCompareQuery({ ids: "cmhx1a2b3c4d5e6f7g8h9i0jk,sample_setting-01" })).toEqual({
            ok: true,
            ids: ["cmhx1a2b3c4d5e6f7g8h9i0jk", "sample_setting-01"],
        });
    });

    it("64文字の id は通し、65文字の id は不正にする", () => {
        const id64 = "a".repeat(64);
        const id65 = "a".repeat(65);

        expect(parseSettingCompareQuery({ ids: `${id64},b` })).toEqual({ ok: true, ids: [id64, "b"] });
        expect(parseSettingCompareQuery({ ids: `${id65},b` })).toEqual({ ok: false });
    });

    it.each([
        ["未指定", undefined],
        ["空文字", ""],
        ["1件", "setting-a"],
        ["3件", "setting-a,setting-b,setting-c"],
        ["末尾が空の要素", "setting-a,"],
        ["先頭が空の要素", ",setting-b"],
        ["空白を含む", "setting-a, setting-b"],
        ["使えない文字を含む", "setting-a,setting/b"],
        ["同じ id が2つ", "setting-a,setting-a"],
    ])("%s なら ok: false", (_, ids) => {
        expect(parseSettingCompareQuery({ ids })).toEqual({ ok: false });
    });

    it("ids が配列(?ids=a&ids=b)なら ok: false", () => {
        expect(parseSettingCompareQuery({ ids: ["setting-a", "setting-b"] })).toEqual({ ok: false });
    });
});

describe("buildSettingCompareHref", () => {
    it("[A, B] の順で /compare?ids=A,B を作る", () => {
        expect(buildSettingCompareHref(["setting-b", "setting-a"])).toBe("/compare?ids=setting-b,setting-a");
    });

    it("作ったリンクのクエリは parseSettingCompareQuery で同じ順の ids に戻る", () => {
        const href = buildSettingCompareHref(["cmhx1a2b3c4d5e6f7g8h9i0jk", "sample_setting-01"]);
        const ids = new URL(href, "http://localhost").searchParams.get("ids") ?? undefined;

        expect(parseSettingCompareQuery({ ids })).toEqual({
            ok: true,
            ids: ["cmhx1a2b3c4d5e6f7g8h9i0jk", "sample_setting-01"],
        });
    });
});
