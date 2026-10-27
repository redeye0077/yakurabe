import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CreateSettingRecordInput, SettingRepository, UpsertSettingInput } from "@/server/repositories/setting.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        setting: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.setting.findMany);
const mockedFindUnique = vi.mocked(prisma.setting.findUnique);
const mockedCreate = vi.mocked(prisma.setting.create);
const mockedUpsert = vi.mocked(prisma.setting.upsert);
const mockedDelete = vi.mocked(prisma.setting.delete);

function createKnownRequestError(code: string) {
    return new Prisma.PrismaClientKnownRequestError("test error", { code, clientVersion: "test" });
}

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

describe("SettingRepository.create", () => {
    it("受け取った入力で作成し、作成したセッティングのidだけを返す", async () => {
        const data: CreateSettingRecordInput = {
            userId: "user-1",
            title: "テストセッティング",
            description: null,
            imageUrl: null,
            barrelId: "barrel-1",
            shaftId: "shaft-1",
            flightId: "flight-1",
            tipId: "tip-1",
        };

        await SettingRepository.create(data);

        expect(mockedCreate).toHaveBeenCalledWith({
            data,
            select: { id: true },
        });
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

describe("SettingRepository.findOwnerById", () => {
    it("idで検索し、投稿者のidだけを取得する", async () => {
        mockedFindUnique.mockResolvedValue(null);

        await SettingRepository.findOwnerById("setting-1");

        expect(mockedFindUnique).toHaveBeenCalledWith({
            where: { id: "setting-1" },
            select: { userId: true },
        });
    });
});

describe("SettingRepository.delete", () => {
    it("idと投稿者の両方で絞り込んで削除し、true を返す", async () => {
        const result = await SettingRepository.delete("setting-1", "user-1");

        expect(mockedDelete).toHaveBeenCalledWith({ where: { id: "setting-1", userId: "user-1" } });
        expect(result).toBe(true);
    });

    it("該当するセッティングが無い(P2025)場合は false を返す", async () => {
        mockedDelete.mockRejectedValue(createKnownRequestError("P2025"));

        const result = await SettingRepository.delete("setting-1", "user-1");

        expect(result).toBe(false);
    });

    it("P2025 以外のエラーはそのまま throw する", async () => {
        const dbError = createKnownRequestError("P2003");
        mockedDelete.mockRejectedValue(dbError);

        await expect(SettingRepository.delete("setting-1", "user-1")).rejects.toBe(dbError);
    });
});
