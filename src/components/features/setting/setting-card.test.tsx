// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingCard } from "@/components/features/setting/setting-card";
import type { SettingListItemDto } from "@/server/dto/setting.dto";

function createSetting(overrides: Partial<SettingListItemDto> = {}): SettingListItemDto {
    return {
        id: "setting-1",
        title: "テストセッティング",
        imageUrl: null,
        barrelName: "テストバレル",
        shaftName: "テストシャフト",
        flightName: "テストフライト",
        tipName: "テストチップ",
        barrelWeight: 18,
        totalPrice: 23630,
        userName: "テストユーザー",
        createdAt: "2026-10-01T00:00:00.000Z",
        ...overrides,
    };
}

describe("SettingCard", () => {
    it("画像がある場合は、タイトルを代替テキストにした画像を表示する", () => {
        render(<SettingCard headingLevel={3} setting={createSetting({ imageUrl: "/images/samples/test.jpg" })} />);

        const image = screen.getByRole("img", { name: "テストセッティング" });
        expect(image.getAttribute("src")).toContain(encodeURIComponent("/images/samples/test.jpg"));
    });

    it("画像が無い場合は画像を表示しない(代わりにDartMarkを表示する)", () => {
        render(<SettingCard headingLevel={3} setting={createSetting({ imageUrl: null })} />);

        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it.each([2, 3] as const)("タイトルを h%i の見出しで表示する", (headingLevel) => {
        render(<SettingCard headingLevel={headingLevel} setting={createSetting()} />);

        expect(screen.getByRole("heading", { level: headingLevel, name: "テストセッティング" })).toBeInTheDocument();
    });

    it("4つの商品名、バレル重量、合計価格、投稿者名を表示する", () => {
        render(<SettingCard headingLevel={3} setting={createSetting()} />);

        expect(screen.getByText("テストバレル")).toBeInTheDocument();
        expect(screen.getByText("テストシャフト")).toBeInTheDocument();
        expect(screen.getByText("テストフライト")).toBeInTheDocument();
        expect(screen.getByText("テストチップ")).toBeInTheDocument();
        // 値はラベルと色を分けているため、ラベルを含む親要素の文字列で確認する
        expect(screen.getByText("18.0g").parentElement).toHaveTextContent(/^バレル 18\.0g$/);
        expect(screen.getByText("¥23,630").parentElement).toHaveTextContent(/^合計 ¥23,630$/);
        expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    });

    it("シャフトがnull(一体型フライト)の場合、シャフト欄に「一体型」と表示する", () => {
        render(<SettingCard headingLevel={3} setting={createSetting({ shaftName: null })} />);

        expect(screen.getByText("一体型")).toBeInTheDocument();
    });

    it("投稿日は日本時間の日付で表示する", () => {
        // UTCでは9/30だが、日本時間では10/1になる
        render(<SettingCard headingLevel={3} setting={createSetting({ createdAt: "2026-09-30T15:00:00.000Z" })} />);

        expect(screen.getByText("2026/10/01")).toHaveAttribute("dateTime", "2026-09-30T15:00:00.000Z");
    });

    it("詳細ページへのリンクを持たない", () => {
        render(<SettingCard headingLevel={3} setting={createSetting()} />);

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});
