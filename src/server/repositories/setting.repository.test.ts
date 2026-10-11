import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { SettingRepository, UpsertSettingInput } from "@/server/repositories/setting.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        setting: {
            upsert: vi.fn(),
        },
    },
}));

const mockedUpsert = vi.mocked(prisma.setting.upsert);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SettingRepository.upsert", () => {
    it("idで検索し、無ければidを付けて作成、あれば同じ内容で更新する", async () => {
        const data: UpsertSettingInput = {
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

        await SettingRepository.upsert("setting-1", data);

        expect(mockedUpsert).toHaveBeenCalledWith({
            where: { id: "setting-1" },
            create: { id: "setting-1", ...data },
            update: data,
        });
    });
});
