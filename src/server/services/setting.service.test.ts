import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingService } from "@/server/services/setting.service";
import { SettingRepository, UpsertSettingInput } from "@/server/repositories/setting.repository";

vi.mock("@/server/repositories/setting.repository", () => ({
    SettingRepository: {
        upsert: vi.fn(),
    },
}));

const mockedUpsert = vi.mocked(SettingRepository.upsert);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SettingService.upsert", () => {
    it("受け取ったidと入力をそのままRepositoryに渡す", async () => {
        const input: UpsertSettingInput = {
            userId: "user-1",
            title: "テストセッティング",
            description: "テスト",
            imageUrl: null,
            tag: "BALANCE",
            barrelId: "barrel-1",
            shaftId: null,
            flightId: "flight-1",
            tipId: "tip-1",
            createdAt: new Date("2026-10-01T00:00:00.000Z"),
        };

        await SettingService.upsert("setting-1", input);

        expect(mockedUpsert).toHaveBeenCalledWith("setting-1", input);
    });
});
