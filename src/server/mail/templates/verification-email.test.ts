import { describe, it, expect } from "vitest";
import { buildVerificationEmail } from "@/server/mail/templates/verification-email";

const url = "http://localhost:3000/verify?token=abc_DEF-123";

describe("buildVerificationEmail", () => {
    it("宛先・件名を設定し、テキスト本文にユーザー名と認証URLを含める", () => {
        const message = buildVerificationEmail({ to: "a@example.com", username: "ダーツ太郎", verificationUrl: url });

        expect(message.to).toBe("a@example.com");
        expect(message.subject).toBe("【矢比べ】メールアドレスの確認をお願いします");
        expect(message.text).toContain("ダーツ太郎 さん");
        expect(message.text).toContain(url);
        expect(message.text).toContain("24時間");
    });

    it("HTML本文に認証URLへのリンクを含める", () => {
        const message = buildVerificationEmail({ to: "a@example.com", username: "ダーツ太郎", verificationUrl: url });

        expect(message.html).toContain(`<a href="${url}">`);
    });

    it("HTML本文ではユーザー名をエスケープする", () => {
        const message = buildVerificationEmail({
            to: "a@example.com",
            username: '<script>alert("x")</script>',
            verificationUrl: url,
        });

        expect(message.html).not.toContain("<script>");
        expect(message.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    });
});
