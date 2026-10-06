// src/server/services/authService.ts
import { userRepository } from "@/server/repositories/userRepository";
import { EmailVerificationService } from "@/server/services/email-verification.service";
import { hashPassword, verifyPassword } from "@/lib/password";
import { EmailNotVerifiedError } from "@/server/errors/auth.error";
import { RegisterInput } from "@/schemas/auth";

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("このメールアドレスは既に登録されています");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      username: input.username,
    });

    // 確認メールが送れなくても登録自体は成功扱いにする(再送で復旧できるため)。
    // トークンや認証URLはログに出さない
    try {
      await EmailVerificationService.sendVerificationEmail({
        userId: user.id,
        email: user.email,
        username: user.username,
      });
    } catch (error) {
      console.error("[auth] 確認メールの送信に失敗しました", {
        userId: user.id,
        error,
      });
    }

    return { id: user.id, email: user.email, username: user.username };
  },

  async validateCredentials(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    // パスワード一致後に判定する。未認証であることは正しいパスワードを知る本人にしか分からない
    if (user.emailVerified === null) {
      throw new EmailNotVerifiedError();
    }

    return { id: user.id, email: user.email, username: user.username };
  },
};
