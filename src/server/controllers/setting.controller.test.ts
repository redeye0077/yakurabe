import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingController } from "@/server/controllers/setting.controller";
import { SettingService } from "@/server/services/setting.service";
import { SettingRuleError } from "@/server/errors/setting.error";

vi.mock("@/server/services/setting.service", () => ({
    SettingService: {
        create: vi.fn(),
    },
}));

const mockedCreate = vi.mocked(SettingService.create);

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
