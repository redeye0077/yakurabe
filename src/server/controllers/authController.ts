// src/server/controllers/authController.ts
import { NextRequest, NextResponse } from "next/server";
import { CredentialsSignin } from "next-auth";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { authService } from "@/server/services/authService";
import { EmailNotVerifiedError } from "@/server/errors/auth.error";
import { LOGIN_ERROR_CODE } from "@/lib/auth-error-codes";

// NextAuth は CredentialsSignin の code をそのまま signIn の戻り値に渡す
export class EmailNotVerifiedSignin extends CredentialsSignin {
  code = LOGIN_ERROR_CODE.emailNotVerified;
}

export const authController = {
  async register(req: NextRequest) {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    try {
      const user = await authService.register(parsed.data);
      return NextResponse.json(user, { status: 201 });
    } catch (e) {
      const message = e instanceof Error ? e.message : "登録に失敗しました";
      return NextResponse.json({ error: message }, { status: 409 });
    }
  },

  // NextAuth Credentials の authorize から呼ぶ。null は通常のログイン失敗として扱われる
  async authorize(credentials: unknown) {
    const parsed = loginSchema.safeParse(credentials);
    if (!parsed.success) return null;

    try {
      return await authService.validateCredentials(
        parsed.data.email,
        parsed.data.password
      );
    } catch (e) {
      if (e instanceof EmailNotVerifiedError) {
        throw new EmailNotVerifiedSignin();
      }
      throw e;
    }
  },
};
