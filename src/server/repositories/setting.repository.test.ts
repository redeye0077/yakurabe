import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { SettingRepository, UpsertSettingInput } from "@/server/repositories/setting.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        setting: {
            findMany: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.setting.findMany);
const mockedUpsert = vi.mocked(prisma.setting.upsert);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SettingRepository.findLatest", () => {
    const expectedQuery = {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
            id: true,
            title: true,
            imageUrl: true,
            createdAt: true,
            user: { select: { username: true } },
            barrel: { select: { name: true, weight: true, price: true } },
            shaft: { select: { name: true, price: true } },
            flight: { select: { name: true, price: true } },
            tip: { select: { name: true, price: true } },
        },
    };

    it("新着順(同時刻はid順)に、表示に必要な項目だけを指定件数取得する", async () => {
        mockedFindMany.mockResolvedValue([]);

        await SettingRepository.findLatest(4);

        expect(mockedFindMany).toHaveBeenCalledWith({ ...expectedQuery, take: 4 });
    });

    it("件数を省略すると全件を取得する", async () => {
        mockedFindMany.mockResolvedValue([]);

        await SettingRepository.findLatest();

        expect(mockedFindMany).toHaveBeenCalledWith({ ...expectedQuery, take: undefined });
    });
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
