import { prisma } from "@/lib/prisma";

export const EmailVerificationTokenRepository = {
  // 1ユーザー1トークンのため、再発行時は既存の行を上書きする(issuedAtは@updatedAtで更新される)
  async upsertByUserId(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const { userId, tokenHash, expiresAt } = data;
    return prisma.emailVerificationToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt },
      update: { tokenHash, expiresAt },
    });
  },

  async findByUserId(userId: string) {
    return prisma.emailVerificationToken.findUnique({
      where: { userId },
    });
  },

  async findByTokenHash(tokenHash: string) {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  },

  /**
   * トークンを削除し、削除できた場合のみユーザーを認証済みにする。
   * 同時リクエストで既に削除されていた場合は更新せずfalseを返す。
   */
  async consume(data: {
    tokenId: string;
    userId: string;
    verifiedAt: Date;
  }): Promise<boolean> {
    const { tokenId, userId, verifiedAt } = data;
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.emailVerificationToken.deleteMany({
        where: { id: tokenId },
      });
      if (count === 0) {
        return false;
      }

      await tx.user.update({
        where: { id: userId },
        data: { emailVerified: verifiedAt },
      });
      return true;
    });
  },
};
