// src/server/services/authService.ts
import { userRepository } from "@/server/repositories/userRepository";
import { hashPassword, verifyPassword } from "@/lib/password";
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
    
    return { id: user.id, email: user.email, username: user.username };
  },

  async validateCredentials(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    return { id: user.id, email: user.email, username: user.username };
  },
};
