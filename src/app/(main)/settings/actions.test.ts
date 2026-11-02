import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSettingImageUploadAction } from "@/app/(main)/settings/actions";
import { SettingController } from "@/server/controllers/setting.controller";

const { mockedAuth } = vi.hoisted(() => ({
    mockedAuth: vi.fn<() => Promise<{ user?: { id?: string } } | null>>(),
}));

vi.mock("@/lib/auth", () => ({
    auth: mockedAuth,
}));

vi.mock("@/server/controllers/setting.controller", () => ({
    SettingController: {
        createImageUpload: vi.fn(),
    },
}));

const mockedCreateImageUpload = vi.mocked(SettingController.createImageUpload);

beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });
});

describe("createSettingImageUploadAction", () => {
    it("ログイン中のユーザーと入力で Controller を呼び、結果をそのまま返す", async () => {
        const result = {
            status: "success" as const,
            upload: { url: "http://localhost:9090/yakurabe-dev", fields: {}, key: "settings/user-1/x.png" },
        };
        mockedCreateImageUpload.mockResolvedValue(result);

        await expect(createSettingImageUploadAction({ contentType: "image/png", size: 1024 })).resolves.toBe(result);
        expect(mockedCreateImageUpload).toHaveBeenCalledWith("user-1", { contentType: "image/png", size: 1024 });
    });

    it.each([
        ["セッションが無い", null],
        ["ユーザー id が無い", { user: {} }],
    ])("%s なら Controller を呼ばずに unauthenticated を返す", async (_label, session) => {
        mockedAuth.mockResolvedValue(session);

        await expect(createSettingImageUploadAction({ contentType: "image/png", size: 1024 })).resolves.toEqual({
            status: "unauthenticated",
        });
        expect(mockedCreateImageUpload).not.toHaveBeenCalled();
    });
});
