// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LatestSettings } from "@/components/features/top/latest-settings";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

function createSetting(id: string): SettingListItemDto {
    return {
        id,
        title: `セッティング ${id}`,
        imageUrl: null,
        barrelName: "テストバレル",
        shaftName: "テストシャフト",
        flightName: "テストフライト",
        tipName: "テストチップ",
        barrelWeight: 18,
        totalPrice: 23630,
        userName: "テストユーザー",
        createdAt: "2026-10-01T00:00:00.000Z",
    };
}

describe("LatestSettings", () => {
    it("新着が1件以上ある場合は、一覧ページへの「もっと見る」を表示し、カードタイトルは h3 にする", () => {
        render(<LatestSettings settings={[createSetting("1")]} />);

        expect(screen.getByRole("link", { name: /もっと見る/ })).toHaveAttribute("href", "/settings");
        expect(screen.getByRole("heading", { level: 3, name: "セッティング 1" })).toBeInTheDocument();
    });

    it("0件の場合は「もっと見る」を表示しない", () => {
        render(<LatestSettings settings={[]} />);

        expect(screen.queryByRole("link", { name: /もっと見る/ })).not.toBeInTheDocument();
        expect(screen.getByText("まだセッティングが投稿されていません")).toBeInTheDocument();
    });
});
