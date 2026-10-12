// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import LoginPage from "@/app/login/page";

const hardNavigateMock = vi.fn();
const signInMock = vi.fn();

vi.mock("@/lib/navigation", () => ({
    hardNavigate: (...args: unknown[]) => hardNavigateMock(...args),
}));

vi.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => signInMock(...args),
}));

beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/login");
});

async function submitValidLogin() {
    const user = userEvent.setup();
    renderWithQueryClient(<LoginPage />);

    await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
    await user.type(screen.getByLabelText("パスワード"), "Password123!");
    await user.click(screen.getByRole("button", { name: "ログイン" }));
}

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

    it("ログインに成功したら、callbackUrlが無ければページを読み込み直して/へ遷移する", async () => {
        signInMock.mockResolvedValue({ error: undefined, ok: true });
        const user = userEvent.setup();
        renderWithQueryClient(<LoginPage />);

        await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
        await user.type(screen.getByLabelText("パスワード"), "Password123!");
        await user.click(screen.getByRole("button", { name: "ログイン" }));

        await waitFor(() => expect(hardNavigateMock).toHaveBeenCalledWith("/"));
        expect(signInMock).toHaveBeenCalledWith("credentials", {
            email: "test@example.com",
            password: "Password123!",
            redirect: false,
        });
    });

    it("同じオリジンのcallbackUrlがあれば、そのパスへ遷移する", async () => {
        window.history.replaceState({}, "", `/login?callbackUrl=${encodeURIComponent(`${window.location.origin}/mypage`)}`);
        signInMock.mockResolvedValue({ error: undefined, ok: true });

        await submitValidLogin();

        await waitFor(() => expect(hardNavigateMock).toHaveBeenCalledWith("/mypage"));
    });

    it("callbackUrlが外部のURLなら/へ遷移する", async () => {
        window.history.replaceState({}, "", `/login?callbackUrl=${encodeURIComponent("https://evil.com/mypage")}`);
        signInMock.mockResolvedValue({ error: undefined, ok: true });

        await submitValidLogin();

        await waitFor(() => expect(hardNavigateMock).toHaveBeenCalledWith("/"));
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
        expect(hardNavigateMock).not.toHaveBeenCalled();
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
        expect(hardNavigateMock).not.toHaveBeenCalled();
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
        expect(hardNavigateMock).not.toHaveBeenCalled();
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
        expect(hardNavigateMock).not.toHaveBeenCalled();
    });
});
