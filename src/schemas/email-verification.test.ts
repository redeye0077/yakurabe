import { describe, it, expect } from "vitest";
import { verifyEmailSchema } from "@/schemas/email-verification";

describe("verifyEmailSchema", () => {
    it("tokenが空でない文字列なら成功する", () => {
        const result = verifyEmailSchema.safeParse({ token: "plain-token" });

        expect(result.success).toBe(true);
    });

    it.each([
        ["未指定", {}],
        ["空文字", { token: "" }],
        ["配列(?token=a&token=b)", { token: ["a", "b"] }],
    ])("tokenが%sの場合は失敗する", (_, input) => {
        expect(verifyEmailSchema.safeParse(input).success).toBe(false);
    });
});
