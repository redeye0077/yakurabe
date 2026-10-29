// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingEditButton } from "@/components/features/setting/setting-edit-button";

describe("SettingEditButton", () => {
    it("編集ページへのリンクとして表示する", () => {
        render(<SettingEditButton id="setting-1" />);

        const link = screen.getByRole("link", { name: "編集" });
        expect(link.getAttribute("href")).toBe("/settings/setting-1/edit");
    });
});
