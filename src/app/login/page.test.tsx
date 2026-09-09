// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import LoginPage from "@/app/login/page";

const pushMock = vi.fn();
const signInMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
}));

vi.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => signInMock(...args),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("LoginPage", () => {
    it("空欄で送信するとバリデーションエラーが表示され、signInは呼ばれない", async () => {
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.click(screen.getByRole("button", { name: "ログイン" }));

        expect(
            await screen.findByText("メールアドレスを入力してください")
        ).toBeInTheDocument();
        expect(screen.getByText("パスワードを入力してください")).toBeInTheDocument();
        expect(signInMock).not.toHaveBeenCalled();
    });

    it("ログインに成功したら/へ遷移する", async () => {
        signInMock.mockResolvedValue({ error: undefined, ok: true });
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "Password123!");
        await user.click(screen.getByRole("button", { name: "ログイン" }));

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
        expect(signInMock).toHaveBeenCalledWith("credentials", {
            email: "test@example.com",
            password: "Password123!",
            redirect: false,
        });
    });

    it("認証に失敗したらエラーメッセージを表示する", async () => {
        signInMock.mockResolvedValue({ error: "CredentialsSignin" });
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "wrong-password");
        await user.click(screen.getByRole("button", { name: "ログイン" }));

        expect(
            await screen.findByText("メールアドレスまたはパスワードが違います")
        ).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });
});
