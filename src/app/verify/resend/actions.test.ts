import { describe, it, expect, vi, beforeEach } from "vitest";
import { resendVerificationAction } from "@/app/verify/resend/actions";
import { EmailVerificationController } from "@/server/controllers/email-verification.controller";

// 本物のredirect()と同様に例外を投げて処理を止める
class RedirectSignal extends Error {
    constructor(public readonly url: string) {
        super(`redirect:${url}`);
    }
}

vi.mock("next/navigation", () => ({
    redirect: vi.fn((url: string) => {
        throw new RedirectSignal(url);
    }),
}));

vi.mock("@/server/controllers/email-verification.controller", () => ({
    EmailVerificationController: {
        resend: vi.fn(),
    },
}));

const mockedResend = vi.mocked(EmailVerificationController.resend);

function formDataWith(email: string): FormData {
    const formData = new FormData();
    formData.set("email", email);
    return formData;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("resendVerificationAction", () => {
    it("フォームのemailをControllerに渡し、受け付けたら完了画面へリダイレクトする", async () => {
        mockedResend.mockReturnValue({ status: "accepted" });

        const error = await resendVerificationAction(formDataWith("test@example.com")).catch(
            (e: unknown) => e,
        );

        expect(mockedResend).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(error).toBeInstanceOf(RedirectSignal);
        expect((error as RedirectSignal).url).toBe("/verify/resend/sent");
    });

    it("入力が不正ならリダイレクトせずにメッセージを返す", async () => {
        mockedResend.mockReturnValue({ status: "invalid", message: "メールアドレスの形式が正しくありません" });

        await expect(resendVerificationAction(formDataWith("bad"))).resolves.toEqual({
            error: "メールアドレスの形式が正しくありません",
        });
    });
});
