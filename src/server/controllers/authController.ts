// src/server/controllers/authController.ts
import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/schemas/auth";
import { authService } from "@/server/services/authService";

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
};
