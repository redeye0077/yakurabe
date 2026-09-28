import { createHash, randomBytes } from "node:crypto";
import { EmailVerificationTokenRepository } from "@/server/repositories/email-verification-token.repository";
import {
  ExpiredVerificationTokenError,
  InvalidVerificationTokenError,
} from "@/server/errors/email-verification.error";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// DBにはトークンの平文を保存せず、SHA-256のhex(64文字)のみ保存する
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const EmailVerificationService = {
  /**
   * 認証トークンを発行し、メールに載せる平文トークンを返す。
   * 既存のトークンは上書きされ無効になる。
   */
  async issueToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");

    await EmailVerificationTokenRepository.upsertByUserId({
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    });

    return token;
  },

  /**
   * トークンを検証し、ユーザーを認証済みにする。
   * 期限切れのトークンは再送時のupsertで上書きされるため削除しない。
   */
  async verifyToken(token: string): Promise<void> {
    const record = await EmailVerificationTokenRepository.findByTokenHash(
      hashToken(token),
    );
    if (!record) {
      throw new InvalidVerificationTokenError();
    }

    const now = new Date();
    if (record.expiresAt.getTime() <= now.getTime()) {
      throw new ExpiredVerificationTokenError();
    }

    const consumed = await EmailVerificationTokenRepository.consume({
      tokenId: record.id,
      userId: record.userId,
      verifiedAt: now,
    });
    if (!consumed) {
      throw new InvalidVerificationTokenError();
    }
  },
};
