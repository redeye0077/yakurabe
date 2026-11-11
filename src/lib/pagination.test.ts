import { describe, it, expect } from "vitest";
import { buildPageHref, buildPageItems, calcPageRange, type PageItem } from "@/lib/pagination";

// 比較しやすいよう、ページ番号は数字、「…」は "…" にする
function simplify(items: PageItem[]): (number | "…")[] {
    return items.map((item) => (item.type === "page" ? item.page : "…"));
}

describe("buildPageItems", () => {
    it("1ページだけなら 1 だけを返す", () => {
        expect(simplify(buildPageItems(1, 1))).toEqual([1]);
    });

    it("7ページ以下なら省略せずに全部並べる", () => {
        expect(simplify(buildPageItems(4, 7))).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it("8ページ以上で先頭付近なら 1〜5 の後を省略する", () => {
        expect(simplify(buildPageItems(1, 10))).toEqual([1, 2, 3, 4, 5, "…", 10]);
        expect(simplify(buildPageItems(4, 10))).toEqual([1, 2, 3, 4, 5, "…", 10]);
    });

    it("中央なら前後を省略し、現在のページの前後1ページを残す", () => {
        expect(simplify(buildPageItems(5, 10))).toEqual([1, "…", 4, 5, 6, "…", 10]);
        expect(simplify(buildPageItems(6, 10))).toEqual([1, "…", 5, 6, 7, "…", 10]);
    });

    it("末尾付近なら最後の5ページの前を省略する", () => {
        expect(simplify(buildPageItems(7, 10))).toEqual([1, "…", 6, 7, 8, 9, 10]);
        expect(simplify(buildPageItems(10, 10))).toEqual([1, "…", 6, 7, 8, 9, 10]);
    });

    it("8ページちょうどでも並びの長さは 7 にそろう", () => {
        for (let current = 1; current <= 8; current++) {
            expect(buildPageItems(current, 8)).toHaveLength(7);
        }
    });
});

describe("calcPageRange", () => {
    it("1ページ目は 1〜pageSize 件目", () => {
        expect(calcPageRange(1, 12, 30)).toEqual({ from: 1, to: 12 });
    });

    it("最後のページで端数があれば to は全件数", () => {
        expect(calcPageRange(3, 12, 30)).toEqual({ from: 25, to: 30 });
    });

    it("ちょうど割り切れる件数なら最後のページも pageSize 件", () => {
        expect(calcPageRange(2, 12, 24)).toEqual({ from: 13, to: 24 });
    });

    it("0件なら 0〜0", () => {
        expect(calcPageRange(1, 12, 0)).toEqual({ from: 0, to: 0 });
    });
});

describe("buildPageHref", () => {
    it("1ページ目は page を付けず basePath だけにする", () => {
        expect(buildPageHref("/settings", {}, 1)).toBe("/settings");
        expect(buildPageHref("/settings", { page: "3" }, 1)).toBe("/settings");
    });

    it("2ページ目以降は ?page=N を付ける", () => {
        expect(buildPageHref("/settings", {}, 2)).toBe("/settings?page=2");
    });

    it("今の page は新しい page に差し替える", () => {
        expect(buildPageHref("/settings", { page: "2" }, 3)).toBe("/settings?page=3");
    });

    it("page 以外のクエリは引き継ぐ(配列は同じキーで複数付け、undefined は付けない)", () => {
        expect(
            buildPageHref("/settings", { level: "BEGINNER", q: "フィット", tag: ["a", "b"], x: undefined, page: "1" }, 2),
        ).toBe("/settings?level=BEGINNER&q=%E3%83%95%E3%82%A3%E3%83%83%E3%83%88&tag=a&tag=b&page=2");
    });

    it("page 以外のクエリがあれば、1ページ目でもそのクエリは残す", () => {
        expect(buildPageHref("/settings", { level: "BEGINNER", page: "2" }, 1)).toBe("/settings?level=BEGINNER");
    });
});
