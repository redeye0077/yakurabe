import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/schemas/auth";

describe("registerSchema", () => {
    const validInput = {
        email: "test@example.com",
        password: "Password123!",
        username: "テストユーザー",
    };

    it("正しい入力を受け入れる", () => {
        const result = registerSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it.each([
        ["email", "", "メールアドレスを入力してください"],
        ["email", "invalid-email", "メールアドレスの形式が正しくありません"],
        ["password", "", "パスワードを入力してください"],
        ["password", "short1!", "パスワードは8文字以上で入力してください"], // 7文字
        ["password", "a".repeat(51), "パスワードは50文字以内で入力してください"],
        ["password", "パスワード123", "パスワードは半角英数字と記号で入力してください"], // 全角
        ["password", "pass word1", "パスワードは半角英数字と記号で入力してください"], // 半角スペース
        ["username", "", "ユーザー名を入力してください"],
        ["username", "   ", "ユーザー名を入力してください"], // trim後に空
        ["username", "a".repeat(51), "ユーザー名は50文字以内で入力してください"],
        ["username", "user\u0000name", "ユーザー名に使用できない文字が含まれています"], // 制御文字
    ])("%s が「%s」のときエラーになる", (field, value, expectedMessage) => {
        const input = { ...validInput, [field]: value };
        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
            const message = result.error.issues.find(
                (issue) => issue.path[0] === field
            )?.message;
            expect(message).toBe(expectedMessage);
        }
    });
});

describe("loginSchema", () => {
    it("正しい入力を受け入れる", () => {
        const result = loginSchema.safeParse({
            email: "test@example.com",
            password: "anything",
        });
        expect(result.success).toBe(true);
    });

    it.each([
        ["email", "", "メールアドレスを入力してください"],
        ["email", "invalid", "メールアドレスの形式が間違っています"],
        ["password", "", "パスワードを入力してください"],
    ])("%s が「%s」のときエラーになる", (field, value, expectedMessage) => {
        const input = { email: "test@example.com", password: "x", [field]: value };
        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
            const message = result.error.issues.find(
                (issue) => issue.path[0] === field
            )?.message;
            expect(message).toBe(expectedMessage);
        }
    });
});
