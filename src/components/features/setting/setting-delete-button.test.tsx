// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingDeleteButton } from "@/components/features/setting/setting-delete-button";
import type { DeleteSettingActionResult } from "@/app/(main)/mypage/actions";

const { mockedDeleteSettingAction } = vi.hoisted(() => ({
    mockedDeleteSettingAction: vi.fn<(formData: FormData) => Promise<DeleteSettingActionResult>>(),
}));

vi.mock("@/app/(main)/mypage/actions", () => ({
    deleteSettingAction: mockedDeleteSettingAction,
}));

function renderAndOpen() {
    render(<SettingDeleteButton id="setting-1" title="テストセッティング" />);
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    return screen.findByRole("alertdialog");
}

describe("SettingDeleteButton", () => {
    beforeEach(() => {
        mockedDeleteSettingAction.mockReset();
    });

    it("キャンセルではActionを呼ばずにダイアログを閉じる", async () => {
        await renderAndOpen();

        fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        expect(mockedDeleteSettingAction).not.toHaveBeenCalled();
    });

    it("「削除する」でActionをid付きで呼ぶ", async () => {
        mockedDeleteSettingAction.mockResolvedValue({ status: "success" });
        await renderAndOpen();

        fireEvent.click(screen.getByRole("button", { name: "削除する" }));

        await waitFor(() => {
            expect(mockedDeleteSettingAction).toHaveBeenCalledTimes(1);
        });
        const formData = mockedDeleteSettingAction.mock.calls[0][0];
        expect(formData.get("id")).toBe("setting-1");
    });

    it("失敗したときはダイアログ内にメッセージを表示し、開いたままにする", async () => {
        mockedDeleteSettingAction.mockResolvedValue({ status: "unauthorized", message: "ログインしてください" });
        await renderAndOpen();

        fireEvent.click(screen.getByRole("button", { name: "削除する" }));

        const dialog = await screen.findByRole("alertdialog");
        expect(await screen.findByText("ログインしてください")).toBeInTheDocument();
        expect(dialog).toContainElement(screen.getByText("ログインしてください"));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "削除する" })).toBeEnabled();
        });
        expect(screen.getByRole("alertdialog")).toBe(dialog);
    });

    it("成功したときはダイアログを閉じる", async () => {
        mockedDeleteSettingAction.mockResolvedValue({ status: "success" });
        await renderAndOpen();

        fireEvent.click(screen.getByRole("button", { name: "削除する" }));

        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
    });

    it("対象が見つからない(not_found)ときもダイアログを閉じる", async () => {
        mockedDeleteSettingAction.mockResolvedValue({
            status: "not_found",
            message: "セッティングが見つかりません。すでに削除されている可能性があります",
        });
        await renderAndOpen();

        fireEvent.click(screen.getByRole("button", { name: "削除する" }));

        await waitFor(() => {
            expect(screen.queryByRole("alertdialog")).toBeNull();
        });
        expect(screen.queryByText("セッティングが見つかりません。すでに削除されている可能性があります")).toBeNull();
    });
});
