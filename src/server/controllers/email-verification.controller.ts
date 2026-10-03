import { verifyEmailSchema } from "@/schemas/email-verification";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import {
  ExpiredVerificationTokenError,
  InvalidVerificationTokenError,
} from "@/server/errors/email-verification.error";

export type VerifyEmailResult = "success" | "expired" | "invalid";

export const EmailVerificationController = {
  /**
   * 認証リンクのトークンを検証し、画面の出し分けに使う結果へ変換する。
   * 想定外のエラー(DB障害など)はリンク無効と区別するため、そのままthrowする。
   */
  async verify(input: { token: unknown }): Promise<VerifyEmailResult> {
    const parsed = verifyEmailSchema.safeParse(input);
    if (!parsed.success) {
      return "invalid";
    }

    try {
      await EmailVerificationService.verifyToken(parsed.data.token);
      return "success";
    } catch (e) {
      if (e instanceof ExpiredVerificationTokenError) {
        return "expired";
      }
      if (e instanceof InvalidVerificationTokenError) {
        return "invalid";
      }
      throw e;
    }
  },
};
