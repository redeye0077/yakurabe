// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PaginationNav, type PaginationNavItem } from "@/components/common/pagination-nav";

const items: PaginationNavItem[] = [
    { type: "page", page: 1, href: "/settings", current: false },
    { type: "ellipsis" },
    { type: "page", page: 4, href: "/settings?page=4", current: false },
    { type: "page", page: 5, href: "/settings?page=5", current: true },
    { type: "page", page: 6, href: "/settings?page=6", current: false },
    { type: "ellipsis" },
    { type: "page", page: 10, href: "/settings?page=10", current: false },
];

describe("PaginationNav", () => {
    it("ページ番号を渡された href のリンクで並べ、現在のページに aria-current を付ける", () => {
        render(<PaginationNav items={items} prevHref="/settings?page=4" nextHref="/settings?page=6" />);

        const nav = screen.getByRole("navigation", { name: "ページ" });
        expect(within(nav).getByRole("link", { name: "1" })).toHaveAttribute("href", "/settings");
        expect(within(nav).getByRole("link", { name: "10" })).toHaveAttribute("href", "/settings?page=10");
        expect(within(nav).getByRole("link", { name: "5" })).toHaveAttribute("aria-current", "page");
        expect(within(nav).getByRole("link", { name: "4" })).not.toHaveAttribute("aria-current");
        expect(within(nav).getAllByText("…")).toHaveLength(2);
    });

    it("前へ/次へは渡された href のリンクにする", () => {
        render(<PaginationNav items={items} prevHref="/settings?page=4" nextHref="/settings?page=6" />);

        expect(screen.getByRole("link", { name: "前へ" })).toHaveAttribute("href", "/settings?page=4");
        expect(screen.getByRole("link", { name: "次へ" })).toHaveAttribute("href", "/settings?page=6");
    });

    it("href が null の前へ/次へはリンクにせず、無効として表示する", () => {
        render(<PaginationNav items={items} prevHref={null} nextHref={null} />);

        expect(screen.queryByRole("link", { name: "前へ" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "次へ" })).not.toBeInTheDocument();
        expect(screen.getByText("前へ")).toHaveAttribute("aria-disabled", "true");
        expect(screen.getByText("次へ")).toHaveAttribute("aria-disabled", "true");
    });
});
