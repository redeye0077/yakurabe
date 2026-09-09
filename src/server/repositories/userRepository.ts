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
};
