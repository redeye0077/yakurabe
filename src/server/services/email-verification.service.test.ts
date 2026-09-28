import { createHash } from "node:crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EmailVerificationToken } from "@prisma/client";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import { EmailVerificationTokenRepository } from "@/server/repositories/email-verification-token.repository";
import {
    ExpiredVerificationTokenError,
    InvalidVerificationTokenError,
} from "@/server/errors/email-verification.error";
import { getMailSender } from "@/server/mail/get-mail-sender";
import type { MailSender } from "@/server/mail/mail-sender";

vi.mock("@/server/repositories/email-verification-token.repository", () => ({
    EmailVerificationTokenRepository: {
        upsertByUserId: vi.fn(),
        findByTokenHash: vi.fn(),
        consume: vi.fn(),
    },
}));

vi.mock("@/server/config/app-config", () => ({
    loadAppConfig: () => ({ APP_URL: "http://localhost:3000" }),
}));

vi.mock("@/server/mail/get-mail-sender", () => ({
    getMailSender: vi.fn(),
}));

const mockedUpsert = vi.mocked(EmailVerificationTokenRepository.upsertByUserId);
const mockedFindByTokenHash = vi.mocked(EmailVerificationTokenRepository.findByTokenHash);
const mockedConsume = vi.mocked(EmailVerificationTokenRepository.consume);

const mockedSend = vi.fn<MailSender["send"]>();
vi.mocked(getMailSender).mockReturnValue({ send: mockedSend });

const NOW = new Date("2026-09-28T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

function createMockToken(overrides: Partial<EmailVerificationToken> = {}): EmailVerificationToken {
    return {
        id: "token-1",
        userId: "user-1",
        tokenHash: sha256("plain-token"),
        expiresAt: new Date(NOW.getTime() + DAY_MS),
        issuedAt: NOW,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
});

afterEach(() => {
    vi.useRealTimers();
});

describe("EmailVerificationService.issueToken", () => {
    it("平文トークンを返し、DBにはそのSHA-256ハッシュのみを渡す", async () => {
        const token = await EmailVerificationService.issueToken("user-1");

        expect(mockedUpsert).toHaveBeenCalledTimes(1);
        const arg = mockedUpsert.mock.calls[0][0];
        expect(arg.userId).toBe("user-1");
        expect(arg.tokenHash).toBe(sha256(token));
        expect(arg.tokenHash).toMatch(/^[0-9a-f]{64}$/);
        expect(arg.tokenHash).not.toBe(token);
    });

    it("URLに載せられるbase64url形式の32バイトのトークンを返す", async () => {
        const token = await EmailVerificationService.issueToken("user-1");

        expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it("有効期限を発行時刻の24時間後に設定する", async () => {
        await EmailVerificationService.issueToken("user-1");

        expect(mockedUpsert.mock.calls[0][0].expiresAt).toEqual(
            new Date(NOW.getTime() + DAY_MS),
        );
    });

    it("発行のたびに異なるトークンを生成する", async () => {
        const first = await EmailVerificationService.issueToken("user-1");
        const second = await EmailVerificationService.issueToken("user-1");

        expect(first).not.toBe(second);
    });
});

describe("EmailVerificationService.verifyToken", () => {
    it("有効なトークンの場合、ハッシュで検索してトークンを消費する", async () => {
        mockedFindByTokenHash.mockResolvedValue(createMockToken());
        mockedConsume.mockResolvedValue(true);

        await expect(EmailVerificationService.verifyToken("plain-token")).resolves.toBeUndefined();

        expect(mockedFindByTokenHash).toHaveBeenCalledWith(sha256("plain-token"));
        expect(mockedConsume).toHaveBeenCalledWith({
            tokenId: "token-1",
            userId: "user-1",
            verifiedAt: NOW,
        });
    });

    it("トークンが見つからない場合はInvalidVerificationTokenErrorを投げる", async () => {
        mockedFindByTokenHash.mockResolvedValue(null);

        await expect(EmailVerificationService.verifyToken("unknown")).rejects.toThrow(
            InvalidVerificationTokenError,
        );
        expect(mockedConsume).not.toHaveBeenCalled();
    });

    it("有効期限ちょうどの場合はExpiredVerificationTokenErrorを投げ、消費しない", async () => {
        mockedFindByTokenHash.mockResolvedValue(createMockToken({ expiresAt: NOW }));

        await expect(EmailVerificationService.verifyToken("plain-token")).rejects.toThrow(
            ExpiredVerificationTokenError,
        );
        expect(mockedConsume).not.toHaveBeenCalled();
    });

    it("有効期限を過ぎている場合はExpiredVerificationTokenErrorを投げ、消費しない", async () => {
        mockedFindByTokenHash.mockResolvedValue(
            createMockToken({ expiresAt: new Date(NOW.getTime() - 1) }),
        );

        await expect(EmailVerificationService.verifyToken("plain-token")).rejects.toThrow(
            ExpiredVerificationTokenError,
        );
        expect(mockedConsume).not.toHaveBeenCalled();
    });

    it("同時リクエストで既に消費されていた場合はInvalidVerificationTokenErrorを投げる", async () => {
        mockedFindByTokenHash.mockResolvedValue(createMockToken());
        mockedConsume.mockResolvedValue(false);

        await expect(EmailVerificationService.verifyToken("plain-token")).rejects.toThrow(
            InvalidVerificationTokenError,
        );
    });
});

describe("EmailVerificationService.sendVerificationEmail", () => {
    const user = { userId: "user-1", email: "test@example.com", username: "testuser" };

    it("発行したトークン付きの認証URLを本文に入れて、登録メールアドレス宛に送信する", async () => {
        await EmailVerificationService.sendVerificationEmail(user);

        const tokenHash = mockedUpsert.mock.calls[0][0].tokenHash;
        expect(mockedSend).toHaveBeenCalledTimes(1);
        const message = mockedSend.mock.calls[0][0];
        expect(message.to).toBe("test@example.com");
        expect(message.subject).toBe("【矢比べ】メールアドレスの確認をお願いします");

        const urlInText = message.text.match(/http\S+/)?.[0];
        expect(urlInText).toBeDefined();
        const url = new URL(urlInText ?? "");
        expect(`${url.origin}${url.pathname}`).toBe("http://localhost:3000/verify");
        expect(sha256(url.searchParams.get("token") ?? "")).toBe(tokenHash);
    });

    it("トークンの保存に失敗した場合はメールを送らずにエラーを投げる", async () => {
        mockedUpsert.mockRejectedValueOnce(new Error("db down"));

        await expect(EmailVerificationService.sendVerificationEmail(user)).rejects.toThrow("db down");
        expect(mockedSend).not.toHaveBeenCalled();
    });

    it("メール送信に失敗した場合はエラーを投げる", async () => {
        mockedSend.mockRejectedValueOnce(new Error("smtp down"));

        await expect(EmailVerificationService.sendVerificationEmail(user)).rejects.toThrow("smtp down");
    });
});
