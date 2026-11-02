import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingController } from "@/server/controllers/setting.controller";
import { SettingService } from "@/server/services/setting.service";
import {
    SettingImageError,
    SettingNotFoundError,
    SettingRuleError,
} from "@/server/errors/setting.error";

vi.mock("@/server/services/setting.service", () => ({
    SettingService: {
        createImageUpload: vi.fn(),
        discardUploadedImage: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        getForEdit: vi.fn(),
        update: vi.fn(),
    },
}));

const mockedCreate = vi.mocked(SettingService.create);
const mockedCreateImageUpload = vi.mocked(SettingService.createImageUpload);
const mockedDiscardUploadedImage = vi.mocked(SettingService.discardUploadedImage);

const IMAGE_KEY = "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png";
const mockedDelete = vi.mocked(SettingService.delete);
const mockedGetForEdit = vi.mocked(SettingService.getForEdit);
const mockedUpdate = vi.mocked(SettingService.update);

const validInput = {
    title: " テストセッティング ",
    description: "",
    barrelId: "barrel-1",
    shaftId: "",
    flightId: "flight-1",
    tipId: "tip-1",
    imageKey: "",
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SettingController.create", () => {
    it("検証後の値でServiceを呼び、作成したidを返す", async () => {
        mockedCreate.mockResolvedValue({ id: "setting-1" });

        const result = await SettingController.create("user-1", validInput);

        expect(result).toEqual({ status: "success", id: "setting-1" });
        expect(mockedCreate).toHaveBeenCalledWith("user-1", {
            title: "テストセッティング",
            description: null,
            barrelId: "barrel-1",
            shaftId: null,
            flightId: "flight-1",
            tipId: "tip-1",
            imageKey: null,
        });
    });

    it("入力が不正ならServiceを呼ばずに項目ごとのエラーを返す", async () => {
        const result = await SettingController.create("user-1", {
            ...validInput,
            title: "",
            barrelId: null,
            tipId: "",
        });

        expect(result).toEqual({
            status: "invalid",
            fieldErrors: {
                title: "タイトルを入力してください",
                barrelId: "バレルを選択してください",
                tipId: "チップを選択してください",
            },
        });
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it("業務ルール違反は該当する項目のエラーに変換する", async () => {
        mockedCreate.mockRejectedValue(
            new SettingRuleError("shaftId", "選択したフライトと規格が合わないシャフトです")
        );

        const result = await SettingController.create("user-1", validInput);

        expect(result).toEqual({
            status: "invalid",
            fieldErrors: { shaftId: "選択したフライトと規格が合わないシャフトです" },
        });
    });

    it("想定外のエラーは変換せずにそのままthrowする", async () => {
        const dbError = new Error("connection lost");
        mockedCreate.mockRejectedValue(dbError);

        await expect(SettingController.create("user-1", validInput)).rejects.toBe(dbError);
    });
});

describe("SettingController.createImageUpload", () => {
    it("検証後の形式で Service を呼び、アップロード先を返す", async () => {
        const upload = { url: "http://localhost:9090/yakurabe-dev", fields: { key: IMAGE_KEY }, key: IMAGE_KEY };
        mockedCreateImageUpload.mockResolvedValue(upload);

        const result = await SettingController.createImageUpload("user-1", {
            contentType: "image/png",
            size: 1024,
        });

        expect(result).toEqual({ status: "success", upload });
        expect(mockedCreateImageUpload).toHaveBeenCalledWith("user-1", "image/png");
    });

    it.each([
        ["許可しない形式", { contentType: "image/gif", size: 1024 }, "JPEG・PNG・WebP の画像を選択してください"],
        ["5MB 超", { contentType: "image/png", size: 5 * 1024 * 1024 + 1 }, "画像は 5MB 以下にしてください"],
    ])("%s なら Service を呼ばずにメッセージを返す", async (_label, input, message) => {
        const result = await SettingController.createImageUpload("user-1", input);

        expect(result).toEqual({ status: "invalid", message });
        expect(mockedCreateImageUpload).not.toHaveBeenCalled();
    });

    it("想定外のエラーは変換せずにそのまま throw する", async () => {
        const error = new Error("S3 の設定ミス");
        mockedCreateImageUpload.mockRejectedValue(error);

        await expect(
            SettingController.createImageUpload("user-1", { contentType: "image/png", size: 1024 })
        ).rejects.toBe(error);
    });
});

describe("SettingController.create の画像", () => {
    const inputWithImage = { ...validInput, imageKey: IMAGE_KEY };

    it("成功したら画像は削除しない", async () => {
        mockedCreate.mockResolvedValue({ id: "setting-1" });

        const result = await SettingController.create("user-1", inputWithImage);

        expect(result).toEqual({ status: "success", id: "setting-1" });
        expect(mockedCreate).toHaveBeenCalledWith("user-1", expect.objectContaining({ imageKey: IMAGE_KEY }));
        expect(mockedDiscardUploadedImage).not.toHaveBeenCalled();
    });

    it("入力が不正(zod)なら、Service.create を呼ばずにアップロード済みの画像を削除してエラーを返す", async () => {
        const result = await SettingController.create("user-1", { ...inputWithImage, title: "" });

        expect(result).toEqual({ status: "invalid", fieldErrors: { title: "タイトルを入力してください" } });
        expect(mockedCreate).not.toHaveBeenCalled();
        expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
    });

    it("業務ルール違反でも、アップロード済みの画像を削除してエラーを返す", async () => {
        mockedCreate.mockRejectedValue(new SettingRuleError("shaftId", "シャフトを選択してください"));

        const result = await SettingController.create("user-1", inputWithImage);

        expect(result).toEqual({ status: "invalid", fieldErrors: { shaftId: "シャフトを選択してください" } });
        expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
    });

    it("画像の確認に失敗(SettingImageError)したら imageKey のエラーにし、画像の削除を Service に任せる", async () => {
        mockedCreate.mockRejectedValue(new SettingImageError());

        const result = await SettingController.create("user-1", inputWithImage);

        expect(result).toEqual({
            status: "invalid",
            fieldErrors: { imageKey: "画像を確認できませんでした。もう一度選択してください" },
        });
        expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
    });

    it("画像を送っていなければ、エラーでも削除しない", async () => {
        const result = await SettingController.create("user-1", { ...validInput, title: "" });

        expect(result.status).toBe("invalid");
        expect(mockedDiscardUploadedImage).not.toHaveBeenCalled();
    });

    it("想定外のエラーでは削除を呼ばずにそのまま throw する(後片付けは Service が行う)", async () => {
        const dbError = new Error("connection lost");
        mockedCreate.mockRejectedValue(dbError);

        await expect(SettingController.create("user-1", inputWithImage)).rejects.toBe(dbError);
        expect(mockedDiscardUploadedImage).not.toHaveBeenCalled();
    });
});

describe("SettingController.delete", () => {
    it("検証後のidでServiceを呼び、成功を返す", async () => {
        mockedDelete.mockResolvedValue();

        const result = await SettingController.delete("user-1", { id: " setting-1 " });

        expect(result).toEqual({ status: "success" });
        expect(mockedDelete).toHaveBeenCalledWith("user-1", "setting-1");
    });

    it.each([
        ["空文字", ""],
        ["未送信(null)", null],
        ["ファイル", new File([], "a.txt")],
    ])("idが不正(%s)ならServiceを呼ばずに失敗を返す", async (_label, id) => {
        const result = await SettingController.delete("user-1", { id });

        expect(result).toEqual({
            status: "invalid",
            message: "削除するセッティングが正しくありません",
        });
        expect(mockedDelete).not.toHaveBeenCalled();
    });

    it("対象が無い・本人の投稿でない場合(SettingNotFoundError)は not_found に変換する", async () => {
        mockedDelete.mockRejectedValue(new SettingNotFoundError());

        const result = await SettingController.delete("user-1", { id: "setting-1" });

        expect(result).toEqual({
            status: "not_found",
            message: "セッティングが見つかりません。すでに削除されている可能性があります",
        });
    });

    it("想定外のエラーは変換せずにそのままthrowする", async () => {
        const dbError = new Error("connection lost");
        mockedDelete.mockRejectedValue(dbError);

        await expect(SettingController.delete("user-1", { id: "setting-1" })).rejects.toBe(dbError);
    });
});

// id として不正な値。update・getForEdit では not_found として扱う
const invalidIds = [
    ["空文字", ""],
    ["空白のみ", "  "],
    ["未送信(null)", null],
    ["ファイル", new File([], "a.txt")],
] as const;

describe("SettingController.getForEdit", () => {
    const setting = {
        title: "テストセッティング",
        description: null,
        imageUrl: null,
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
    };

    it("検証後のidでServiceを呼び、編集フォームの初期値を返す", async () => {
        mockedGetForEdit.mockResolvedValue(setting);

        const result = await SettingController.getForEdit("user-1", { id: " setting-1 " });

        expect(result).toEqual({ status: "success", setting });
        expect(mockedGetForEdit).toHaveBeenCalledWith("user-1", "setting-1");
    });

    it.each(invalidIds)("idが不正(%s)ならServiceを呼ばずに not_found を返す", async (_label, id) => {
        const result = await SettingController.getForEdit("user-1", { id });

        expect(result).toEqual({ status: "not_found" });
        expect(mockedGetForEdit).not.toHaveBeenCalled();
    });

    it("対象が無い・本人の投稿でない場合(SettingNotFoundError)は not_found に変換する", async () => {
        mockedGetForEdit.mockRejectedValue(new SettingNotFoundError());

        const result = await SettingController.getForEdit("user-1", { id: "setting-1" });

        expect(result).toEqual({ status: "not_found" });
    });

    it("想定外のエラーは変換せずにそのままthrowする", async () => {
        const dbError = new Error("connection lost");
        mockedGetForEdit.mockRejectedValue(dbError);

        await expect(SettingController.getForEdit("user-1", { id: "setting-1" })).rejects.toBe(dbError);
    });
});

describe("SettingController.update", () => {
    const notFound = {
        status: "not_found",
        message: "セッティングが見つかりません。すでに削除されている可能性があります",
    };

    it("検証後のidと入力でServiceを呼び、成功を返す", async () => {
        mockedUpdate.mockResolvedValue();

        const result = await SettingController.update("user-1", { id: " setting-1 ", ...validInput });

        expect(result).toEqual({ status: "success" });
        expect(mockedUpdate).toHaveBeenCalledWith("user-1", "setting-1", {
            title: "テストセッティング",
            description: null,
            barrelId: "barrel-1",
            shaftId: null,
            flightId: "flight-1",
            tipId: "tip-1",
            imageKey: null,
        });
    });

    it("新しい画像のキーを検証して Service に渡し、成功したら画像は削除しない", async () => {
        mockedUpdate.mockResolvedValue();

        const result = await SettingController.update("user-1", { id: "setting-1", ...validInput, imageKey: IMAGE_KEY });

        expect(result).toEqual({ status: "success" });
        expect(mockedUpdate.mock.calls[0][2]).toMatchObject({ imageKey: IMAGE_KEY });
        expect(mockedDiscardUploadedImage).not.toHaveBeenCalled();
    });

    it("画像を選んでいなければ imageKey は null で Service に渡す(Service が既存の画像を残す)", async () => {
        mockedUpdate.mockResolvedValue();

        await SettingController.update("user-1", { id: "setting-1", ...validInput });

        expect(mockedUpdate.mock.calls[0][2]).toMatchObject({ imageKey: null });
    });

    describe("新しい画像があるときにエラーで戻る場合は、アップロード済みの画像を削除する", () => {
        const withImage = { id: "setting-1", ...validInput, imageKey: IMAGE_KEY };

        it("id が不正", async () => {
            const result = await SettingController.update("user-1", { ...withImage, id: "" });

            expect(result.status).toBe("not_found");
            expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
        });

        it("入力が不正(zod)", async () => {
            const result = await SettingController.update("user-1", { ...withImage, title: "" });

            expect(result.status).toBe("invalid");
            expect(mockedUpdate).not.toHaveBeenCalled();
            expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
        });

        it("業務ルール違反", async () => {
            mockedUpdate.mockRejectedValue(new SettingRuleError("shaftId", "シャフトを選択してください"));

            const result = await SettingController.update("user-1", withImage);

            expect(result).toEqual({ status: "invalid", fieldErrors: { shaftId: "シャフトを選択してください" } });
            expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
        });

        it("画像の確認の失敗(SettingImageError)は imageKey のエラーにする", async () => {
            mockedUpdate.mockRejectedValue(new SettingImageError());

            const result = await SettingController.update("user-1", withImage);

            expect(result).toEqual({
                status: "invalid",
                fieldErrors: { imageKey: "画像を確認できませんでした。もう一度選択してください" },
            });
            expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
        });

        it("対象が無い・本人の投稿でない(SettingNotFoundError)", async () => {
            mockedUpdate.mockRejectedValue(new SettingNotFoundError());

            const result = await SettingController.update("user-1", withImage);

            expect(result.status).toBe("not_found");
            expect(mockedDiscardUploadedImage).toHaveBeenCalledWith("user-1", IMAGE_KEY);
        });

        it("想定外のエラーでは削除を呼ばずにそのまま throw する(後片付けは Service が行う)", async () => {
            const dbError = new Error("connection lost");
            mockedUpdate.mockRejectedValue(dbError);

            await expect(SettingController.update("user-1", withImage)).rejects.toBe(dbError);
            expect(mockedDiscardUploadedImage).not.toHaveBeenCalled();
        });
    });

    it("画像を選んでいなければ、エラーでも削除しない", async () => {
        const result = await SettingController.update("user-1", { id: "setting-1", ...validInput, title: "" });

        expect(result.status).toBe("invalid");
        expect(mockedDiscardUploadedImage).not.toHaveBeenCalled();
    });

    it.each(invalidIds)("idが不正(%s)ならServiceを呼ばずに not_found を返す", async (_label, id) => {
        const result = await SettingController.update("user-1", { id, ...validInput });

        expect(result).toEqual(notFound);
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it("入力が不正ならServiceを呼ばずに項目ごとのエラーを返す", async () => {
        const result = await SettingController.update("user-1", {
            id: "setting-1",
            ...validInput,
            title: "",
            flightId: null,
        });

        expect(result).toEqual({
            status: "invalid",
            fieldErrors: {
                title: "タイトルを入力してください",
                flightId: "フライトを選択してください",
            },
        });
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it("業務ルール違反は該当する項目のエラーに変換する", async () => {
        mockedUpdate.mockRejectedValue(
            new SettingRuleError("shaftId", "シャフトを選択してください")
        );

        const result = await SettingController.update("user-1", { id: "setting-1", ...validInput });

        expect(result).toEqual({
            status: "invalid",
            fieldErrors: { shaftId: "シャフトを選択してください" },
        });
    });

    it("対象が無い・本人の投稿でない場合(SettingNotFoundError)は not_found に変換する", async () => {
        mockedUpdate.mockRejectedValue(new SettingNotFoundError());

        const result = await SettingController.update("user-1", { id: "setting-1", ...validInput });

        expect(result).toEqual(notFound);
    });

    it("想定外のエラーは変換せずにそのままthrowする", async () => {
        const dbError = new Error("connection lost");
        mockedUpdate.mockRejectedValue(dbError);

        await expect(SettingController.update("user-1", { id: "setting-1", ...validInput })).rejects.toBe(dbError);
    });
});
