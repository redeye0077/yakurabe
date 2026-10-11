import { userRepository } from "@/server/repositories/userRepository";
import { ValidationError } from "@/server/errors/validation.error";

// bcrypt のハッシュ形式ではない文字列。どのパスワードと照合しても一致しないため、ログインできない
export const LOGIN_DISABLED_PASSWORD_HASH = "!login-disabled";

// 確認メールの再送対象にならないよう、認証済みとして扱う。Seedを再実行しても値が変わらないよう固定する
const SAMPLE_USER_EMAIL_VERIFIED_AT = new Date("2026-10-01T00:00:00.000Z");

export const UserService = {
  /**
   * Seed専用。サンプルセッティングの投稿者として、ログインできないユーザーを固定idで作る。
   * 更新時もパスワードを上書きするため、Seedを再実行すればログインできない状態に戻る。
   */
  async upsertSampleUser(id: string, data: { email: string; username: string }) {
    // メールが外部に配送されないよう、予約ドメイン(.invalid)のアドレスに限る
    if (!data.email.endsWith(".invalid")) {
      throw new ValidationError("サンプルユーザーのメールアドレスは .invalid ドメインにしてください");
    }

    return userRepository.upsert(id, {
      ...data,
      passwordHash: LOGIN_DISABLED_PASSWORD_HASH,
      emailVerified: SAMPLE_USER_EMAIL_VERIFIED_AT,
    });
  },
};
