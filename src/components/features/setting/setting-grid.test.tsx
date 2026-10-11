// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingGrid } from "@/components/features/setting/setting-grid";
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

describe("SettingGrid", () => {
    it("0件の場合は空の状態のメッセージを表示し、リンクは表示しない", () => {
        render(<SettingGrid settings={[]} headingLevel={2} />);

        expect(screen.getByText("まだセッティングが投稿されていません")).toBeInTheDocument();
        expect(screen.queryByRole("article")).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("渡された件数だけカードを表示する", () => {
        render(<SettingGrid settings={[createSetting("1"), createSetting("2"), createSetting("3")]} headingLevel={2} />);

        expect(screen.getAllByRole("article")).toHaveLength(3);
        // 見出しレベルはカードに引き渡す
        expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
        expect(screen.queryByText("まだセッティングが投稿されていません")).not.toBeInTheDocument();
    });
});
