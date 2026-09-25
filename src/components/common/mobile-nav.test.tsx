// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "@/components/common/mobile-nav";

vi.mock("next/navigation", () => ({
    usePathname: () => "/settings",
}));

const navLinks = [
    { href: "/settings", label: "セッティング一覧" },
    { href: "/settings/new", label: "新規投稿" },
    { href: "/mypage", label: "マイページ" },
];

describe("MobileNav", () => {
    it("メニューを開くとリンク3つが表示される", async () => {
        const user = userEvent.setup();
        render(<MobileNav navLinks={navLinks} />);

        expect(screen.queryByRole("link")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "メニューを開く" }));

        const links = await screen.findAllByRole("link");
        expect(links).toHaveLength(3);
        for (const link of navLinks) {
            expect(screen.getByRole("link", { name: link.label })).toHaveAttribute(
                "href",
                link.href,
            );
        }
    });

    it("リンクをクリックするとメニューが閉じる", async () => {
        const user = userEvent.setup();
        render(<MobileNav navLinks={navLinks} />);

        await user.click(screen.getByRole("button", { name: "メニューを開く" }));
        await user.click(await screen.findByRole("link", { name: "新規投稿" }));

        await waitFor(() => {
            expect(screen.queryByRole("link")).not.toBeInTheDocument();
        });
    });
});
