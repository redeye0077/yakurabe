import { describe, it, expect, vi, beforeEach } from "vitest";
import { CredentialsSignin } from "next-auth";
import {
    authController,
    EmailNotVerifiedSignin,
} from "@/server/controllers/authController";
import { authService } from "@/server/services/authService";
import { EmailNotVerifiedError } from "@/server/errors/auth.error";

vi.mock("@/server/services/authService", () => ({
    authService: {
        validateCredentials: vi.fn(),
    },
}));

const mockedValidateCredentials = vi.mocked(authService.validateCredentials);

const credentials = { email: "test@example.com", password: "Password123!" };

beforeEach(() => {
    vi.clearAllMocks();
});

describe("authController.authorize", () => {
    it("入力が不正ならServiceを呼ばずにnullを返す", async () => {
        expect(await authController.authorize({ email: "", password: "" })).toBeNull();
        expect(mockedValidateCredentials).not.toHaveBeenCalled();
    });

    it("認証に成功したらユーザー情報を返す", async () => {
        const user = { id: "id-1", email: "test@example.com", username: "testuser" };
        mockedValidateCredentials.mockResolvedValue(user);

        expect(await authController.authorize(credentials)).toEqual(user);
        expect(mockedValidateCredentials).toHaveBeenCalledWith(
            "test@example.com",
            "Password123!"
        );
    });

    it("認証に失敗したらnullを返す", async () => {
        mockedValidateCredentials.mockResolvedValue(null);

        expect(await authController.authorize(credentials)).toBeNull();
    });

    it("未認証ならcode付きのCredentialsSigninを投げる", async () => {
        mockedValidateCredentials.mockRejectedValue(new EmailNotVerifiedError());

        const error = await authController.authorize(credentials).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(EmailNotVerifiedSignin);
        expect(error).toBeInstanceOf(CredentialsSignin);
        expect(error).toHaveProperty("code", "email_not_verified");
    });

    it("想定外のエラーはそのまま投げる", async () => {
        const unexpected = new Error("db down");
        mockedValidateCredentials.mockRejectedValue(unexpected);

        await expect(authController.authorize(credentials)).rejects.toBe(unexpected);
    });
});
