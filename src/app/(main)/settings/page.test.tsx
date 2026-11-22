// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/(main)/settings/page";
import { SettingService } from "@/server/services/setting.service";
import type { SettingListItemDto, SettingListPageDto } from "@/server/dto/setting.dto";
import type { SearchParams } from "@/schemas/setting-list-query";
import { useSettingCompareStore } from "@/stores/setting-compare-store";

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
    // 比較の選択はモジュールに1つの store に残るため、テストごとに初期状態に戻す
    useSettingCompareStore.setState(useSettingCompareStore.getInitialState(), true);
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

    describe("比較", () => {
        const threeSettings = () =>
            makePage({
                items: [
                    makeSetting("setting-1", "セッティング1"),
                    makeSetting("setting-2", "セッティング2"),
                    makeSetting("setting-3", "セッティング3"),
                ],
                total: 3,
            });

        function getCard(title: string): HTMLElement {
            const card = screen.getByRole("heading", { level: 2, name: title }).closest("article");
            if (!card) throw new Error(`${title} のカードが見つかりません`);
            return card;
        }

        it("各カードに「比較に追加」ボタンを出し、選ぶまではバーを出さない", async () => {
            vi.mocked(SettingService.listPaged).mockResolvedValue(threeSettings());

            render(await renderPage());

            for (const title of ["セッティング1", "セッティング2", "セッティング3"]) {
                expect(within(getCard(title)).getByRole("button", { name: "比較に追加" })).toBeEnabled();
            }
            expect(screen.queryByRole("region", { name: "比較するセッティング" })).not.toBeInTheDocument();
        });

        it("2件選ぶと残りのカードのボタンを disabled にし、バーに選んだ順のタイトルと /compare へのリンクを出す", async () => {
            const user = userEvent.setup();
            vi.mocked(SettingService.listPaged).mockResolvedValue(threeSettings());

            render(await renderPage());

            await user.click(within(getCard("セッティング3")).getByRole("button", { name: "比較に追加" }));
            await user.click(within(getCard("セッティング1")).getByRole("button", { name: "比較に追加" }));

            expect(within(getCard("セッティング2")).getByRole("button", { name: "比較に追加" })).toBeDisabled();
            expect(within(getCard("セッティング1")).getByRole("button", { name: "比較から外す" })).toBeEnabled();
            expect(within(getCard("セッティング3")).getByRole("button", { name: "比較から外す" })).toBeEnabled();

            const bar = screen.getByRole("region", { name: "比較するセッティング" });
            expect(within(bar).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
                "A:セッティング3",
                "B:セッティング1",
            ]);
            expect(within(bar).getByRole("link", { name: "比べる" })).toHaveAttribute(
                "href",
                "/compare?ids=setting-3,setting-1",
            );
        });

        it("選択中のボタンを押して外すと、ほかのカードのボタンが押せる状態に戻る", async () => {
            const user = userEvent.setup();
            vi.mocked(SettingService.listPaged).mockResolvedValue(threeSettings());

            render(await renderPage());

            await user.click(within(getCard("セッティング1")).getByRole("button", { name: "比較に追加" }));
            await user.click(within(getCard("セッティング2")).getByRole("button", { name: "比較に追加" }));
            await user.click(within(getCard("セッティング1")).getByRole("button", { name: "比較から外す" }));

            expect(within(getCard("セッティング3")).getByRole("button", { name: "比較に追加" })).toBeEnabled();
            expect(
                within(screen.getByRole("region", { name: "比較するセッティング" })).getByRole("link", { name: "比べる" }),
            ).toHaveAttribute("aria-disabled", "true");
        });

        it("バーはページネーションより後ろに置き、その前に余白を入れる", async () => {
            const user = userEvent.setup();
            vi.mocked(SettingService.listPaged).mockResolvedValue(
                makePage({ ...threeSettings(), total: 30, totalPages: 3 }),
            );

            const { container } = render(await renderPage());
            await user.click(within(getCard("セッティング1")).getByRole("button", { name: "比較に追加" }));

            const nav = screen.getByRole("navigation", { name: "ページ" });
            const spacer = container.querySelector("[data-compare-bar-spacer]");
            expect(spacer).not.toBeNull();
            // 余白がページネーションの後ろにあれば、一番下までスクロールしたときにページネーションがバーに隠れない
            expect(nav.compareDocumentPosition(spacer as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });
    });
});
