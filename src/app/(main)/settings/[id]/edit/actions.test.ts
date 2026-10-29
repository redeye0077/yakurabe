import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { updateSettingAction } from "@/app/(main)/settings/[id]/edit/actions";
import { SettingController } from "@/server/controllers/setting.controller";

// 本物のredirect()と同様に例外を投げて処理を止める
class RedirectSignal extends Error {
    constructor(public readonly url: string) {
        super(`redirect:${url}`);
    }
}

const { mockedAuth } = vi.hoisted(() => ({
    mockedAuth: vi.fn<() => Promise<{ user?: { id?: string } } | null>>(),
}));

vi.mock("@/lib/auth", () => ({
    auth: mockedAuth,
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn((url: string) => {
        throw new RedirectSignal(url);
    }),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/server/controllers/setting.controller", () => ({
    SettingController: {
        update: vi.fn(),
    },
}));

const mockedUpdate = vi.mocked(SettingController.update);
const mockedRevalidatePath = vi.mocked(revalidatePath);

const formValues = {
    title: "更新後のセッティング",
    description: "",
    barrelId: "barrel-1",
    shaftId: "shaft-1",
    flightId: "flight-1",
    tipId: "tip-1",
};

function createFormData(): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(formValues)) {
        formData.set(key, value);
    }
    return formData;
}

async function redirectedTo(promise: Promise<unknown>): Promise<string> {
    const error = await promise.catch((e: unknown) => e);
    if (!(error instanceof RedirectSignal)) {
        throw new Error("redirectされませんでした");
    }
    return error.url;
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });
});

describe("updateSettingAction", () => {
    it("未ログインなら、Controller を呼ばずにログイン後に編集ページへ戻るようリダイレクトする", async () => {
        mockedAuth.mockResolvedValue(null);

        const url = await redirectedTo(updateSettingAction("setting-1", null, createFormData()));

        expect(url).toBe(`/login?callbackUrl=${encodeURIComponent("/settings/setting-1/edit")}`);
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it("bind された id と FormData の入力で Controller を呼び、成功したら再検証してマイページへリダイレクトする", async () => {
        mockedUpdate.mockResolvedValue({ status: "success" });

        const url = await redirectedTo(updateSettingAction("setting-1", null, createFormData()));

        expect(mockedUpdate).toHaveBeenCalledWith("user-1", { id: "setting-1", ...formValues });
        expect(mockedRevalidatePath.mock.calls).toEqual([["/mypage"], ["/settings"], ["/"]]);
        expect(url).toBe("/mypage");
    });

    it("入力エラーなら、項目ごとのエラーと入力値を返し、再検証しない", async () => {
        mockedUpdate.mockResolvedValue({
            status: "invalid",
            fieldErrors: { title: "タイトルを入力してください" },
        });

        const result = await updateSettingAction("setting-1", null, createFormData());

        expect(result).toEqual({
            fieldErrors: { title: "タイトルを入力してください" },
            values: formValues,
        });
        expect(mockedRevalidatePath).not.toHaveBeenCalled();
    });

    it("対象が見つからなければ、再検証したうえでメッセージと入力値を返し、リダイレクトしない", async () => {
        mockedUpdate.mockResolvedValue({
            status: "not_found",
            message: "セッティングが見つかりません。すでに削除されている可能性があります",
        });

        const result = await updateSettingAction("setting-1", null, createFormData());

        expect(result).toEqual({
            fieldErrors: {},
            values: formValues,
            message: "セッティングが見つかりません。すでに削除されている可能性があります",
        });
        expect(mockedRevalidatePath.mock.calls).toEqual([["/mypage"], ["/settings"], ["/"]]);
    });
});
