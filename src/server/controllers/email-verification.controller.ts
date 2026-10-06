import { after } from "next/server";
import {
  resendVerificationSchema,
  verifyEmailSchema,
} from "@/schemas/email-verification";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import {
  ExpiredVerificationTokenError,
  InvalidVerificationTokenError,
} from "@/server/errors/email-verification.error";

export type VerifyEmailResult = "success" | "expired" | "invalid";

export type ResendVerificationResult =
  | { status: "accepted" }
  | { status: "invalid"; message: string };

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

  /**
   * 確認メールの再送を受け付ける。
   * ユーザー検索・間隔判定・送信はafter()で応答後に実行し、アカウントの有無や
   * 認証状態によって応答時間に差が出ないようにする。失敗はログにのみ残す。
   */
  resend(input: { email: unknown }): ResendVerificationResult {
    const parsed = resendVerificationSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "invalid", message: parsed.error.issues[0].message };
    }

    const { email } = parsed.data;
    after(async () => {
      try {
        await EmailVerificationService.resendVerificationEmail(email);
      } catch (error) {
        console.error("[email-verification] 確認メールの再送に失敗しました", {
          error,
        });
      }
    });
    return { status: "accepted" };
  },
};
