// repositories/userRepository.ts
import { prisma } from "@/lib/prisma";

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async create(data: {
    email: string;
    passwordHash: string;
    username: string;
  }) {
    return prisma.user.create({
      data,
    });
  },

  // Seed専用。固定idで作成し、同じidがあれば同じ内容で更新する
  async upsert(
    id: string,
    data: {
      email: string;
      passwordHash: string;
      username: string;
      emailVerified: Date | null;
    }
  ) {
    return prisma.user.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  },
};
