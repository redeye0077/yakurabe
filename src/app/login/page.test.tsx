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

    it("未認証ならその旨と再送ページへのリンクを表示する", async () => {
        signInMock.mockResolvedValue({
            error: "CredentialsSignin",
            code: "email_not_verified",
        });
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "Password123!");
        await user.click(screen.getByRole("button", { name: "ログイン" }));

        expect(
            await screen.findByText(/メールアドレスの確認が完了していません/)
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "確認メールを再送する" })
        ).toHaveAttribute("href", "/verify/resend");
        expect(pushMock).not.toHaveBeenCalled();
    });

    it("パスワード違いでは再送リンクを表示しない", async () => {
        signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "credentials" });
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "wrong-password");
        await user.click(screen.getByRole("button", { name: "ログイン" }));

        expect(
            await screen.findByText("メールアドレスまたはパスワードが違います")
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "確認メールを再送する" })
        ).not.toBeInTheDocument();
    });

    it("CredentialsSignin以外のエラー(DB障害など)では共通のエラーメッセージを表示する", async () => {
        // DB停止時の実際の戻り値に合わせる
        signInMock.mockResolvedValue({
            error: "Configuration",
            code: undefined,
            status: 200,
            ok: true,
            url: null,
        });
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "Password123!");
        await user.click(screen.getByRole("button", { name: "ログイン" }));

        expect(
            await screen.findByText("エラーが発生しました。時間をおいて再度お試しください")
        ).toBeInTheDocument();
        expect(
            screen.queryByText("メールアドレスまたはパスワードが違います")
        ).not.toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it("signInが例外を投げた場合(通信失敗など)も共通のエラーメッセージを表示する", async () => {
        signInMock.mockRejectedValue(new TypeError("Failed to fetch"));
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "Password123!");
        await user.click(screen.getByRole("button", { name: "ログイン" }));

        expect(
            await screen.findByText("エラーが発生しました。時間をおいて再度お試しください")
        ).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });
});
