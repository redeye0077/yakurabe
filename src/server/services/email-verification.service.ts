import { createHash, randomBytes } from "node:crypto";
import { userRepository } from "@/server/repositories/userRepository";
import { EmailVerificationTokenRepository } from "@/server/repositories/email-verification-token.repository";
import {
  ExpiredVerificationTokenError,
  InvalidVerificationTokenError,
} from "@/server/errors/email-verification.error";
import { loadAppConfig } from "@/server/config/app-config";
import { getMailSender } from "@/server/mail/get-mail-sender";
import { buildVerificationEmail } from "@/server/mail/templates/verification-email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const RESEND_INTERVAL_MS = 60 * 1000;

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
   * トークンを発行し、認証リンク付きの確認メールを送信する。
   * 失敗時はthrowするので、呼び出し側でどう扱うか(登録を成功扱いにする等)を決める。
   */
  async sendVerificationEmail(user: {
    userId: string;
    email: string;
    username: string;
  }): Promise<void> {
    const { APP_URL } = loadAppConfig();
    const token = await EmailVerificationService.issueToken(user.userId);

    const verificationUrl = new URL("/verify", APP_URL);
    verificationUrl.searchParams.set("token", token);

    await getMailSender().send(
      buildVerificationEmail({
        to: user.email,
        username: user.username,
        verificationUrl: verificationUrl.toString(),
      }),
    );
  },

  /**
   * 未認証のユーザーにだけ確認メールを再送する。
   * 未登録・認証済み・前回の発行から間もない場合は何もせずに終える
   * (どの場合も画面上は同じ結果にするため、呼び出し側には区別を返さない)。
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user || user.emailVerified !== null) {
      return;
    }

    // 送信時のupsertでissuedAtが更新されるため、間隔の判定は必ず送信より前に行う
    const current = await EmailVerificationTokenRepository.findByUserId(user.id);
    if (
      current &&
      Date.now() - current.issuedAt.getTime() < RESEND_INTERVAL_MS
    ) {
      console.info("[email-verification] 再送間隔内のため送信をスキップしました", {
        userId: user.id,
      });
      return;
    }

    await EmailVerificationService.sendVerificationEmail({
      userId: user.id,
      email: user.email,
      username: user.username,
    });
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
