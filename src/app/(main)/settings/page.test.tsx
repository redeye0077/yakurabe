// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/(main)/settings/page";
import { SettingService } from "@/server/services/setting.service";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

vi.mock("next/server", () => ({
    connection: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/server/services/setting.service", () => ({
    SettingService: { listLatest: vi.fn() },
}));

const SAMPLE_IMAGE_NOTE =
    "【サンプル】の投稿の画像はAIで生成したイメージで、実際の商品とは色や形が異なります。";

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
        createdAt: "2026-10-01T00:00:00.000Z",
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SettingsPage", () => {
    it("見出しの下に、サンプルの画像が AI で生成したイメージであることの一文を表示する", async () => {
        vi.mocked(SettingService.listLatest).mockResolvedValue([
            makeSetting("sample-setting-01", "【サンプル】フィット規格でそろえた安定重視セッティング"),
        ]);

        render(await SettingsPage());

        expect(screen.getByRole("heading", { level: 1, name: "セッティング一覧" })).toBeInTheDocument();
        expect(screen.getByText(SAMPLE_IMAGE_NOTE)).toBeInTheDocument();
    });

    it("一文と一緒に、セッティングのカードを新着順のまま表示する", async () => {
        vi.mocked(SettingService.listLatest).mockResolvedValue([
            makeSetting("setting-2", "セッティング2"),
            makeSetting("setting-1", "セッティング1"),
        ]);

        render(await SettingsPage());

        expect(SettingService.listLatest).toHaveBeenCalledWith();
        expect(screen.getByText(SAMPLE_IMAGE_NOTE)).toBeInTheDocument();
        const titles = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
        expect(titles).toEqual(["セッティング2", "セッティング1"]);
    });
});
