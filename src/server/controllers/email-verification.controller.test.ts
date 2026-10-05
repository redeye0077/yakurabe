import { describe, it, expect, vi, beforeEach } from "vitest";
import { after } from "next/server";
import { EmailVerificationController } from "@/server/controllers/email-verification.controller";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import {
    ExpiredVerificationTokenError,
    InvalidVerificationTokenError,
} from "@/server/errors/email-verification.error";

vi.mock("@/server/services/email-verification.service", () => ({
    EmailVerificationService: {
        verifyToken: vi.fn(),
        resendVerificationEmail: vi.fn(),
    },
}));

vi.mock("next/server", () => ({
    after: vi.fn(),
}));

const mockedVerifyToken = vi.mocked(EmailVerificationService.verifyToken);
const mockedResend = vi.mocked(EmailVerificationService.resendVerificationEmail);
const mockedAfter = vi.mocked(after);

// after()に登録されたコールバックを、応答後の実行に見立てて呼び出す
async function runAfterCallbacks(): Promise<void> {
    for (const [task] of mockedAfter.mock.calls) {
        if (typeof task === "function") {
            await task();
        }
    }
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("EmailVerificationController.verify", () => {
    it("検証に成功したら success を返す", async () => {
        mockedVerifyToken.mockResolvedValue();

        expect(await EmailVerificationController.verify({ token: "plain-token" })).toBe("success");
        expect(mockedVerifyToken).toHaveBeenCalledWith("plain-token");
    });

    it("期限切れなら expired を返す", async () => {
        mockedVerifyToken.mockRejectedValue(new ExpiredVerificationTokenError());

        expect(await EmailVerificationController.verify({ token: "plain-token" })).toBe("expired");
    });

    it("無効なトークンなら invalid を返す", async () => {
        mockedVerifyToken.mockRejectedValue(new InvalidVerificationTokenError());

        expect(await EmailVerificationController.verify({ token: "plain-token" })).toBe("invalid");
    });

    it.each([
        ["tokenが無い(null)", null],
        ["tokenが空文字", ""],
        ["tokenがファイル", new File([""], "token.txt")],
    ])("%s場合はServiceを呼ばずに invalid を返す", async (_, token) => {
        expect(await EmailVerificationController.verify({ token })).toBe("invalid");
        expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("想定外のエラーは変換せずにそのままthrowする", async () => {
        const dbError = new Error("connection lost");
        mockedVerifyToken.mockRejectedValue(dbError);

        await expect(EmailVerificationController.verify({ token: "plain-token" })).rejects.toBe(dbError);
    });
});

describe("EmailVerificationController.resend", () => {
    it("Serviceの完了を待たずに accepted を返し、再送はafter()で応答後に行う", async () => {
        const result = EmailVerificationController.resend({ email: "test@example.com" });

        expect(result).toEqual({ status: "accepted" });
        expect(mockedResend).not.toHaveBeenCalled();
        expect(mockedAfter).toHaveBeenCalledTimes(1);

        await runAfterCallbacks();
        expect(mockedResend).toHaveBeenCalledWith("test@example.com");
    });

    it.each([
        ["emailが無い(null)", null, "メールアドレスを入力してください"],
        ["emailが空文字", "", "メールアドレスを入力してください"],
        ["emailの形式が不正", "not-an-email", "メールアドレスの形式が正しくありません"],
    ])("%s場合は再送せずに invalid とメッセージを返す", (_, email, message) => {
        expect(EmailVerificationController.resend({ email })).toEqual({ status: "invalid", message });
        expect(mockedAfter).not.toHaveBeenCalled();
    });

    it("応答後の再送で起きたエラーはログに残して握りつぶす", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        mockedResend.mockRejectedValue(new Error("smtp down"));

        EmailVerificationController.resend({ email: "test@example.com" });
        await expect(runAfterCallbacks()).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });
});
