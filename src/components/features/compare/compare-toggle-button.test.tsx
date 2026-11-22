// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompareToggleButton } from "@/components/features/compare/compare-toggle-button";
import { useSettingCompareStore } from "@/stores/setting-compare-store";

beforeEach(() => {
    useSettingCompareStore.setState(useSettingCompareStore.getInitialState(), true);
});

describe("CompareToggleButton", () => {
    it("未選択なら「比較に追加」と表示し、押すと store に追加して「比較から外す」に変わる", async () => {
        const user = userEvent.setup();
        render(<CompareToggleButton settingId="setting-a" title="セッティングA" />);

        const button = screen.getByRole("button", { name: "比較に追加" });
        expect(button).toHaveAttribute("aria-pressed", "false");

        await user.click(button);

        expect(useSettingCompareStore.getState().selected).toEqual([{ id: "setting-a", title: "セッティングA" }]);
        expect(screen.getByRole("button", { name: "比較から外す" })).toHaveAttribute("aria-pressed", "true");
    });

    it("選択中に押すと store から外れ、「比較に追加」に戻る", async () => {
        const user = userEvent.setup();
        useSettingCompareStore.getState().toggle({ id: "setting-a", title: "セッティングA" });
        render(<CompareToggleButton settingId="setting-a" title="セッティングA" />);

        await user.click(screen.getByRole("button", { name: "比較から外す" }));

        expect(useSettingCompareStore.getState().selected).toEqual([]);
        expect(screen.getByRole("button", { name: "比較に追加" })).toBeInTheDocument();
    });

    it("ほかの2件を選んでいれば disabled になる。選択中のボタンは押せるまま", () => {
        useSettingCompareStore.getState().toggle({ id: "setting-a", title: "セッティングA" });
        useSettingCompareStore.getState().toggle({ id: "setting-b", title: "セッティングB" });
        render(
            <>
                <CompareToggleButton settingId="setting-a" title="セッティングA" />
                <CompareToggleButton settingId="setting-c" title="セッティングC" />
            </>,
        );

        expect(screen.getByRole("button", { name: "比較から外す" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "比較に追加" })).toBeDisabled();
    });
});
