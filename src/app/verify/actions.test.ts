import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyEmailAction } from "@/app/verify/actions";
import {
    EmailVerificationController,
    type VerifyEmailResult,
} from "@/server/controllers/email-verification.controller";

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
        verify: vi.fn(),
    },
}));

const mockedVerify = vi.mocked(EmailVerificationController.verify);

function formDataWith(token: string): FormData {
    const formData = new FormData();
    formData.set("token", token);
    return formData;
}

async function redirectedTo(formData: FormData): Promise<string> {
    const error = await verifyEmailAction(formData).catch((e: unknown) => e);
    if (!(error instanceof RedirectSignal)) {
        throw new Error("redirectされませんでした");
    }
    return error.url;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("verifyEmailAction", () => {
    it("フォームのtokenをControllerに渡す", async () => {
        mockedVerify.mockResolvedValue("success");

        await redirectedTo(formDataWith("plain-token"));

        expect(mockedVerify).toHaveBeenCalledWith({ token: "plain-token" });
    });

    it.each<[VerifyEmailResult, string]>([
        ["success", "/verify/success"],
        ["expired", "/verify/expired"],
        ["invalid", "/verify/invalid"],
    ])("結果が %s なら %s へリダイレクトする", async (result, path) => {
        mockedVerify.mockResolvedValue(result);

        expect(await redirectedTo(formDataWith("plain-token"))).toBe(path);
    });

    it("Controllerが投げた想定外のエラーはリダイレクトせずにそのままthrowする", async () => {
        const dbError = new Error("connection lost");
        mockedVerify.mockRejectedValue(dbError);

        await expect(verifyEmailAction(formDataWith("plain-token"))).rejects.toBe(dbError);
    });
});
