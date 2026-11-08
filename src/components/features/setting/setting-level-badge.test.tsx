// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingLevelBadge } from "@/components/features/setting/setting-level-badge";
import { SETTING_LEVELS, SETTING_LEVEL_LABELS } from "@/schemas/setting-level";

describe("SettingLevelBadge", () => {
    it.each(SETTING_LEVELS)("%s なら SETTING_LEVEL_LABELS の表示名を出す", (level) => {
        render(<SettingLevelBadge level={level} />);

        expect(screen.getByText(SETTING_LEVEL_LABELS[level])).toBeInTheDocument();
    });

    it("未設定(null)なら何も表示しない", () => {
        const { container } = render(<SettingLevelBadge level={null} />);

        expect(container).toBeEmptyDOMElement();
    });
});
