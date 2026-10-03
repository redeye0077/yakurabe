import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailVerificationController } from "@/server/controllers/email-verification.controller";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import {
    ExpiredVerificationTokenError,
    InvalidVerificationTokenError,
} from "@/server/errors/email-verification.error";

vi.mock("@/server/services/email-verification.service", () => ({
    EmailVerificationService: {
        verifyToken: vi.fn(),
    },
}));

const mockedVerifyToken = vi.mocked(EmailVerificationService.verifyToken);

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
