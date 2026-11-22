// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompareBar } from "@/components/features/compare/compare-bar";
import { useSettingCompareStore } from "@/stores/setting-compare-store";

const A = { id: "setting-a", title: "セッティングA" };
const B = { id: "setting-b", title: "セッティングB" };

function select(...items: { id: string; title: string }[]) {
    for (const item of items) {
        useSettingCompareStore.getState().toggle(item);
    }
}

function getBar() {
    return screen.getByRole("region", { name: "比較するセッティング" });
}

function querySpacer(container: HTMLElement) {
    return container.querySelector("[data-compare-bar-spacer]");
}

beforeEach(() => {
    useSettingCompareStore.setState(useSettingCompareStore.getInitialState(), true);
});

describe("CompareBar", () => {
    it("何も選んでいなければ、バーも余白も出さない", () => {
        const { container } = render(<CompareBar />);

        expect(screen.queryByRole("region", { name: "比較するセッティング" })).not.toBeInTheDocument();
        expect(querySpacer(container)).toBeNull();
    });

    it("1件なら A のタイトルと案内を出し、「比べる」は押せないリンク(aria-disabled・href なし)にする", () => {
        select(A);
        const { container } = render(<CompareBar />);

        const bar = getBar();
        expect(within(bar).getByText("セッティングA")).toBeInTheDocument();
        expect(within(bar).getByText("もう1件選んでください")).toBeInTheDocument();
        const compareLink = within(bar).getByRole("link", { name: "比べる" });
        expect(compareLink).toHaveAttribute("aria-disabled", "true");
        expect(compareLink).not.toHaveAttribute("href");
        expect(querySpacer(container)).not.toBeNull();
    });

    it("2件なら選んだ順に A・B を出し、「比べる」は /compare?ids=A,B へのリンクにする", () => {
        select(B, A);
        render(<CompareBar />);

        const bar = getBar();
        expect(within(bar).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
            "A:セッティングB",
            "B:セッティングA",
        ]);
        expect(within(bar).queryByText("もう1件選んでください")).not.toBeInTheDocument();
        const compareLink = within(bar).getByRole("link", { name: "比べる" });
        expect(compareLink).toHaveAttribute("href", "/compare?ids=setting-b,setting-a");
        expect(compareLink).not.toHaveAttribute("aria-disabled");
    });

    it("「〇〇を比較から外す」で、その1件だけを外す", async () => {
        const user = userEvent.setup();
        select(A, B);
        render(<CompareBar />);

        await user.click(screen.getByRole("button", { name: "セッティングAを比較から外す" }));

        expect(useSettingCompareStore.getState().selected).toEqual([B]);
        expect(within(getBar()).getByText("セッティングB")).toBeInTheDocument();
        expect(within(getBar()).getByRole("link", { name: "比べる" })).toHaveAttribute("aria-disabled", "true");
    });

    it("「すべて解除」で選択を空にし、バーと余白を消す", async () => {
        const user = userEvent.setup();
        select(A, B);
        const { container } = render(<CompareBar />);

        await user.click(screen.getByRole("button", { name: "すべて解除" }));

        expect(useSettingCompareStore.getState().selected).toEqual([]);
        expect(screen.queryByRole("region", { name: "比較するセッティング" })).not.toBeInTheDocument();
        expect(querySpacer(container)).toBeNull();
    });
});
