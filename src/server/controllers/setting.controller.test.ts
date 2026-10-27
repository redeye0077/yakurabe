import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingController } from "@/server/controllers/setting.controller";
import { SettingService } from "@/server/services/setting.service";
import { SettingNotFoundError, SettingRuleError } from "@/server/errors/setting.error";

vi.mock("@/server/services/setting.service", () => ({
    SettingService: {
        create: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockedCreate = vi.mocked(SettingService.create);
const mockedDelete = vi.mocked(SettingService.delete);

const validInput = {
    title: " テストセッティング ",
    description: "",
    barrelId: "barrel-1",
    shaftId: "",
    flightId: "flight-1",
    tipId: "tip-1",
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
