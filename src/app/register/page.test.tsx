// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import RegisterPage from "@/app/register/page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("RegisterPage", () => {
    it("空欄で送信するとバリデーションエラーが表示され、fetchは呼ばれない", async () => {
        const user = userEvent.setup();
        vi.stubGlobal("fetch", vi.fn());
        renderWithQueryClient(<RegisterPage />);

        await user.click(screen.getByRole("button", { name: "新規登録" }));

        expect(
            await screen.findByText("ユーザー名を入力してください")
        ).toBeInTheDocument();
        expect(screen.getByText("メールアドレスを入力してください")).toBeInTheDocument();
        expect(screen.getByText("パスワードを入力してください")).toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("登録に成功したら/loginへ遷移する", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ id: "1" }),
            })
        );
        const user = userEvent.setup();
        renderWithQueryClient(<RegisterPage />);

        await user.type(screen.getByLabelText("ユーザー名"), "testuser");
        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "Password123!");
        await user.click(screen.getByRole("button", { name: "新規登録" }));

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    });

    it("サーバーがエラーを返したらエラーメッセージを表示する", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ error: "このメールアドレスは既に登録されています" }),
            })
        );
        const user = userEvent.setup();
        renderWithQueryClient(<RegisterPage />);

        await user.type(screen.getByLabelText("ユーザー名"), "testuser");
        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "Password123!");
        await user.click(screen.getByRole("button", { name: "新規登録" }));

        expect(
            await screen.findByText("このメールアドレスは既に登録されています")
        ).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });
});
