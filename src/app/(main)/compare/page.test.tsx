// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ComparePage from "@/app/(main)/compare/page";
import { SettingService } from "@/server/services/setting.service";
import { SettingNotFoundError } from "@/server/errors/setting.error";
import type { SettingCompareDto, SettingCompareItemDto } from "@/server/dto/setting.dto";
import type { SearchParams } from "@/schemas/setting-list-query";

vi.mock("next/server", () => ({
    connection: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/server/services/setting.service", () => ({
    SettingService: { listForCompare: vi.fn() },
}));

const mockedListForCompare = vi.mocked(SettingService.listForCompare);

const INVALID_MESSAGE = "比較するセッティングを2件選んでください";
const NOT_FOUND_MESSAGE = "比較するセッティングが見つかりませんでした。削除された可能性があります";

function makeItem(overrides: Partial<SettingCompareItemDto> = {}): SettingCompareItemDto {
    return {
        id: "setting-a",
        title: "セッティングA",
        level: "BEGINNER",
        imageUrl: null,
        barrel: { id: "barrel-1", name: "テストバレル", weight: 18, price: 17600 },
        shaft: { id: "shaft-1", name: "テストシャフト", price: 4180 },
        flight: { id: "flight-1", name: "テストフライト", price: 1080 },
        tip: { id: "tip-1", name: "テストチップ", price: 770 },
        totalPrice: 17600 + 4180 + 1080 + 770,
        userName: "ユーザーA",
        createdAt: "2026-10-01T00:00:00.000Z",
        ...overrides,
    };
}

// B はバレルだけ違い、A より 2.5g 重く 2200 円高い
function makeData(overrides: Partial<SettingCompareDto> = {}): SettingCompareDto {
    return {
        settings: [
            makeItem(),
            makeItem({
                id: "setting-b",
                title: "セッティングB",
                level: null,
                userName: "ユーザーB",
                createdAt: "2026-10-02T00:00:00.000Z",
                barrel: { id: "barrel-2", name: "別のバレル", weight: 20.5, price: 19800 },
                totalPrice: 19800 + 4180 + 1080 + 770,
            }),
        ],
        diff: {
            barrelWeightDiff: 2.5,
            totalPriceDiff: 2200,
            sameParts: { barrel: false, shaft: true, flight: true, tip: true },
        },
        ...overrides,
    };
}

async function renderPage(searchParams: SearchParams) {
    render(await ComparePage({ searchParams: Promise.resolve(searchParams) }));
}

// 項目名から比較表の行(項目名・A・B をまとめた要素)を取る
function getRow(label: string): HTMLElement {
    const row = screen.getByText(label, { selector: "dt > span" }).closest("dt")?.parentElement;
    if (!row) throw new Error(`${label} の行が見つかりません`);
    return row;
}

// 行の A・B の値(dd)を取る
function getValues(label: string): [HTMLElement, HTMLElement] {
    const values = getRow(label).querySelectorAll("dd");
    expect(values).toHaveLength(2);
    return [values[0] as HTMLElement, values[1] as HTMLElement];
}

function expectEmptyState(message: string) {
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getByRole("link", { name: "セッティング一覧へ" }).getAttribute("href")).toBe("/settings");
    expect(screen.queryByText("バレル")).toBeNull();
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("ComparePage", () => {
    describe("正常表示", () => {
        beforeEach(() => {
            mockedListForCompare.mockResolvedValue(makeData());
        });

        it("ids の順で Service を呼び、A・B の見出し(タイトル・レベル・投稿者・投稿日)を順に表示する", async () => {
            await renderPage({ ids: "setting-a,setting-b" });

            expect(mockedListForCompare).toHaveBeenCalledWith(["setting-a", "setting-b"]);
            expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
                "セッティングA",
                "セッティングB",
            ]);
            expect(screen.getByText("初心者向け")).toBeTruthy();
            expect(screen.getByText("ユーザーA")).toBeTruthy();
            expect(screen.getByText("ユーザーB")).toBeTruthy();
            expect(screen.getByText("2026/10/01")).toBeTruthy();
            expect(screen.getByText("2026/10/02")).toBeTruthy();
        });

        it("パーツの行は名前と価格を A・B の順に表示し、同じ/違うを文字で示す", async () => {
            await renderPage({ ids: "setting-a,setting-b" });

            const [barrelA, barrelB] = getValues("バレル");
            expect(barrelA.textContent).toContain("テストバレル");
            expect(barrelA.textContent).toContain("¥17,600");
            expect(barrelB.textContent).toContain("別のバレル");
            expect(barrelB.textContent).toContain("¥19,800");
            // 重量はパーツの行には出さず、重量の行にまとめる
            expect(getRow("バレル").textContent).not.toContain("g");

            expect(within(getRow("バレル")).getByText("違う")).toBeTruthy();
            expect(within(getRow("シャフト")).getByText("同じ")).toBeTruthy();
            expect(within(getRow("フライト")).getByText("同じ")).toBeTruthy();
            expect(within(getRow("チップ")).getByText("同じ")).toBeTruthy();
        });

        it("重量と合計価格を表示し、差(B − A)を符号付きで表示する", async () => {
            await renderPage({ ids: "setting-a,setting-b" });

            expect(getValues("重量").map((value) => value.textContent)).toEqual(["A: 18.0g", "B: 20.5g"]);
            expect(within(getRow("重量")).getByText("+2.5g")).toBeTruthy();

            expect(getValues("合計価格").map((value) => value.textContent)).toEqual(["A: ¥23,630", "B: ¥25,830"]);
            expect(within(getRow("合計価格")).getByText("+¥2,200")).toBeTruthy();
        });

        it("B のほうが軽く安ければ、差を U+2212 のマイナスで表示する", async () => {
            mockedListForCompare.mockResolvedValue(
                makeData({
                    diff: {
                        barrelWeightDiff: -1.5,
                        totalPriceDiff: -1200,
                        sameParts: { barrel: false, shaft: true, flight: true, tip: true },
                    },
                }),
            );

            await renderPage({ ids: "setting-a,setting-b" });

            expect(within(getRow("重量")).getByText("−1.5g")).toBeTruthy();
            expect(within(getRow("合計価格")).getByText("−¥1,200")).toBeTruthy();
        });

        it("差が 0 なら「差なし」と表示する", async () => {
            mockedListForCompare.mockResolvedValue(
                makeData({
                    diff: {
                        barrelWeightDiff: 0,
                        totalPriceDiff: 0,
                        sameParts: { barrel: false, shaft: true, flight: true, tip: true },
                    },
                }),
            );

            await renderPage({ ids: "setting-a,setting-b" });

            expect(within(getRow("重量")).getByText("差なし")).toBeTruthy();
            expect(within(getRow("合計価格")).getByText("差なし")).toBeTruthy();
        });
    });

    describe("ids が不正", () => {
        it.each([
            ["未指定", {}],
            ["1件", { ids: "setting-a" }],
            ["3件", { ids: "setting-a,setting-b,setting-c" }],
            ["同じ id が2つ", { ids: "setting-a,setting-a" }],
            ["配列", { ids: ["setting-a", "setting-b"] }],
            ["使えない文字を含む", { ids: "setting-a,setting/b" }],
        ])("%s なら、Service を呼ばずに案内と一覧へのリンクを表示する", async (_, searchParams: SearchParams) => {
            await renderPage(searchParams);

            expect(mockedListForCompare).not.toHaveBeenCalled();
            expectEmptyState(INVALID_MESSAGE);
            expect(screen.queryByText(NOT_FOUND_MESSAGE)).toBeNull();
        });
    });

    describe("セッティングが見つからない", () => {
        it("Service が SettingNotFoundError を throw したら、削除された可能性がある旨の案内と一覧へのリンクを表示する", async () => {
            mockedListForCompare.mockRejectedValue(new SettingNotFoundError());

            await renderPage({ ids: "setting-a,setting-b" });

            expectEmptyState(NOT_FOUND_MESSAGE);
            expect(screen.queryByText(INVALID_MESSAGE)).toBeNull();
        });

        it("それ以外のエラーはそのまま throw する", async () => {
            mockedListForCompare.mockRejectedValue(new Error("DB に接続できません"));

            await expect(
                ComparePage({ searchParams: Promise.resolve({ ids: "setting-a,setting-b" }) }),
            ).rejects.toThrow("DB に接続できません");
        });
    });

    describe("シャフト一体型フライト", () => {
        it("シャフトが null なら「一体型」と表示し、価格は「—」にする", async () => {
            const data = makeData();
            data.settings[1] = {
                ...data.settings[1],
                shaft: null,
                flight: { id: "flight-2", name: "一体型フライト", price: 1980 },
            };
            data.diff.sameParts = { barrel: false, shaft: false, flight: false, tip: true };
            mockedListForCompare.mockResolvedValue(data);

            await renderPage({ ids: "setting-a,setting-b" });

            const [shaftA, shaftB] = getValues("シャフト");
            expect(shaftA.textContent).toBe("A: テストシャフト¥4,180");
            expect(shaftB.textContent).toBe("B: 一体型—");
            expect(within(getRow("シャフト")).getByText("違う")).toBeTruthy();
        });

        it("両方とも一体型なら、シャフトの行は「同じ」と表示する", async () => {
            const data = makeData();
            data.settings = [
                { ...data.settings[0], shaft: null },
                { ...data.settings[1], shaft: null },
            ];
            data.diff.sameParts = { barrel: false, shaft: true, flight: true, tip: true };
            mockedListForCompare.mockResolvedValue(data);

            await renderPage({ ids: "setting-a,setting-b" });

            expect(getValues("シャフト").map((value) => value.textContent)).toEqual(["A: 一体型—", "B: 一体型—"]);
            expect(within(getRow("シャフト")).getByText("同じ")).toBeTruthy();
        });
    });
});
