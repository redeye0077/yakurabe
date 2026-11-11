// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import SettingsPage from "@/app/(main)/settings/page";
import { SettingService } from "@/server/services/setting.service";
import type { SettingListItemDto, SettingListPageDto } from "@/server/dto/setting.dto";
import type { SearchParams } from "@/schemas/setting-list-query";

vi.mock("next/server", () => ({
    connection: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/server/services/setting.service", () => ({
    SettingService: { listPaged: vi.fn() },
}));

const SAMPLE_IMAGE_NOTE =
    "【サンプル】の投稿の画像はAIで生成したイメージで、実際の商品とは色や形が異なります。";

function makeSetting(id: string, title: string): SettingListItemDto {
    return {
        id,
        title,
        level: null,
        imageUrl: null,
        barrelName: "テストバレル",
        shaftName: "テストシャフト",
        flightName: "テストフライト",
        tipName: "テストチップ",
        barrelWeight: 18,
        totalPrice: 19950,
        userName: "テストユーザー",
        createdAt: "2026-10-01T00:00:00.000Z",
    };
}

function makePage(overrides: Partial<SettingListPageDto> = {}): SettingListPageDto {
    return {
        items: [makeSetting("setting-1", "セッティング1")],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
        ...overrides,
    };
}

function renderPage(searchParams: SearchParams = {}) {
    return SettingsPage({ searchParams: Promise.resolve(searchParams) });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SettingsPage", () => {
    it("見出しの下に、サンプルの画像が AI で生成したイメージであることの一文を表示する", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(
            makePage({ items: [makeSetting("sample-setting-01", "【サンプル】フィット規格でそろえた安定重視セッティング")] }),
        );

        render(await renderPage());

        expect(screen.getByRole("heading", { level: 1, name: "セッティング一覧" })).toBeInTheDocument();
        expect(screen.getByText(SAMPLE_IMAGE_NOTE)).toBeInTheDocument();
    });

    it("Service から受け取った順のままカードを表示する", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(
            makePage({
                items: [makeSetting("setting-2", "セッティング2"), makeSetting("setting-1", "セッティング1")],
                total: 2,
            }),
        );

        render(await renderPage());

        const titles = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
        expect(titles).toEqual(["セッティング2", "セッティング1"]);
    });

    it("?page が無ければ 1 ページ目を 12 件ずつで取得する", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(makePage());

        render(await renderPage());

        expect(SettingService.listPaged).toHaveBeenCalledWith({ page: 1, pageSize: 12 });
    });

    it("?page=2 なら 2 ページ目を取得する。不正な値は 1 ページ目として取得する", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(makePage());

        render(await renderPage({ page: "2" }));
        expect(SettingService.listPaged).toHaveBeenLastCalledWith({ page: 2, pageSize: 12 });

        render(await renderPage({ page: "abc" }));
        expect(SettingService.listPaged).toHaveBeenLastCalledWith({ page: 1, pageSize: 12 });
    });

    it("補正後のページをもとに「全N件中 X〜Y件」とページネーションを表示する", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(
            makePage({ total: 30, page: 3, totalPages: 3 }),
        );

        render(await renderPage({ page: "99" }));

        expect(screen.getByText("全30件中 25〜30件")).toBeInTheDocument();
        const nav = screen.getByRole("navigation", { name: "ページ" });
        expect(within(nav).getByRole("link", { name: "1" })).toHaveAttribute("href", "/settings");
        expect(within(nav).getByRole("link", { name: "2" })).toHaveAttribute("href", "/settings?page=2");
        expect(within(nav).getByRole("link", { name: "3" })).toHaveAttribute("aria-current", "page");
        expect(within(nav).getByRole("link", { name: "前へ" })).toHaveAttribute("href", "/settings?page=2");
        expect(within(nav).queryByRole("link", { name: "次へ" })).not.toBeInTheDocument();
    });

    it("1 ページ目では前へを無効にし、次へは 2 ページ目へのリンクにする", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(
            makePage({ total: 30, page: 1, totalPages: 3 }),
        );

        render(await renderPage());

        expect(screen.getByText("全30件中 1〜12件")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "前へ" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "次へ" })).toHaveAttribute("href", "/settings?page=2");
    });

    it("リンクは page 以外のクエリを引き継ぐ", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(
            makePage({ total: 30, page: 2, totalPages: 3 }),
        );

        render(await renderPage({ page: "2", level: "BEGINNER" }));

        expect(screen.getByRole("link", { name: "前へ" })).toHaveAttribute("href", "/settings?level=BEGINNER");
        expect(screen.getByRole("link", { name: "次へ" })).toHaveAttribute(
            "href",
            "/settings?level=BEGINNER&page=3",
        );
    });

    it("1 ページに収まるときは件数だけ表示し、ページネーションは表示しない", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(makePage({ total: 1 }));

        render(await renderPage());

        expect(screen.getByText("全1件中 1〜1件")).toBeInTheDocument();
        expect(screen.queryByRole("navigation", { name: "ページ" })).not.toBeInTheDocument();
    });

    it("0件のときは既存の空表示を出し、件数表示とページネーションは出さない", async () => {
        vi.mocked(SettingService.listPaged).mockResolvedValue(
            makePage({ items: [], total: 0, page: 1, totalPages: 1 }),
        );

        render(await renderPage());

        expect(screen.getByText("まだセッティングが投稿されていません")).toBeInTheDocument();
        expect(screen.queryByText(/^全\d+件中/)).not.toBeInTheDocument();
        expect(screen.queryByRole("navigation", { name: "ページ" })).not.toBeInTheDocument();
    });
});
