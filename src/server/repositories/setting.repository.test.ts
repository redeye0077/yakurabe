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

describe("SettingRepository.findByUserId", () => {
    it("指定したユーザーの投稿だけを、新着順(同時刻はid順)に一覧と同じ項目で全件取得する", async () => {
        mockedFindMany.mockResolvedValue([]);

        await SettingRepository.findByUserId("user-1");

        expect(mockedFindMany).toHaveBeenCalledWith({
            where: { userId: "user-1" },
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
        });
    });

    it("投稿が無い場合は空配列を返す", async () => {
        mockedFindMany.mockResolvedValue([]);

        const result = await SettingRepository.findByUserId("user-without-posts");

        expect(result).toEqual([]);
    });
});

describe("SettingRepository.upsert", () => {
    it("idで検索し、無ければidを付けて作成、あれば同じ内容で更新する", async () => {
        const data: UpsertSettingInput = {
            userId: "user-1",
            title: "テストセッティング",
            description: "テスト",
            imageUrl: null,
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
