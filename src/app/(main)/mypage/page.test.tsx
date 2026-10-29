// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import MyPage from "@/app/(main)/mypage/page";
import { SettingService } from "@/server/services/setting.service";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

const { mockedAuth } = vi.hoisted(() => ({
    mockedAuth: vi.fn<() => Promise<{ user?: { id?: string } } | null>>(),
}));

vi.mock("@/lib/auth", () => ({
    auth: mockedAuth,
}));

vi.mock("next/server", () => ({
    connection: vi.fn(() => Promise.resolve()),
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

vi.mock("@/app/(main)/mypage/actions", () => ({
    deleteSettingAction: vi.fn(),
}));

vi.mock("@/server/services/setting.service", () => ({
    SettingService: { listByUser: vi.fn() },
}));

function makeSetting(id: string, title: string): SettingListItemDto {
    return {
        id,
        title,
        imageUrl: null,
        barrelName: "テストバレル",
        shaftName: "テストシャフト",
        flightName: "テストフライト",
        tipName: "テストチップ",
        barrelWeight: 18,
        totalPrice: 19950,
        userName: "テストユーザー",
        createdAt: "2026-10-28T00:00:00.000Z",
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });
});

describe("MyPage", () => {
    it("各カードに、そのセッティングの編集ページへのリンクと削除ボタンを表示する", async () => {
        vi.mocked(SettingService.listByUser).mockResolvedValue([
            makeSetting("setting-1", "セッティング1"),
            makeSetting("setting-2", "セッティング2"),
        ]);

        render(await MyPage());

        expect(SettingService.listByUser).toHaveBeenCalledWith({ userId: "user-1" });
        const cards = screen.getAllByRole("article");
        expect(cards).toHaveLength(2);
        cards.forEach((card, index) => {
            const id = `setting-${index + 1}`;
            expect(within(card).getByRole("heading", { name: `セッティング${index + 1}` })).toBeInTheDocument();
            expect(within(card).getByRole("link", { name: "編集" }).getAttribute("href")).toBe(
                `/settings/${id}/edit`
            );
            expect(within(card).getByRole("button", { name: "削除" })).toBeInTheDocument();
        });
    });
});
