import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma, type Setting } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    CreateSettingRecordInput,
    SettingRepository,
    UpdateSettingRecordInput,
    UpsertSettingInput,
} from "@/server/repositories/setting.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        setting: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.setting.findMany);
const mockedFindUnique = vi.mocked(prisma.setting.findUnique);
const mockedCreate = vi.mocked(prisma.setting.create);
const mockedUpdate = vi.mocked(prisma.setting.update);
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
            imageKey: true,
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
                imageKey: true,
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
            imageKey: null,
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

describe("SettingRepository.create の UNIQUE 制約違反", () => {
    const data: CreateSettingRecordInput = {
        userId: "user-1",
        title: "テストセッティング",
        description: null,
        imageKey: "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png",
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
    };

    function p2002(meta: Record<string, unknown>) {
        return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
            code: "P2002",
            clientVersion: "test",
            meta,
        });
    }

    // mariadb の driver adapter 経由の形(meta.target は無く、制約名が入る)
    const adapterMeta = (index: string) => ({
        modelName: "Setting",
        driverAdapterError: {
            name: "DriverAdapterError",
            cause: { kind: "UniqueConstraintViolation", constraint: { index }, table: "setting" },
        },
    });

    it("作成したセッティングの id を返す", async () => {
        mockedCreate.mockResolvedValue({ id: "setting-new" } as unknown as Setting);
        await expect(SettingRepository.create(data)).resolves.toEqual({ id: "setting-new" });
    });

    it.each([
        ["driver adapter の制約名が setting_imageKey_key", adapterMeta("setting_imageKey_key")],
        ["meta.target が [\"imageKey\"]", { target: ["imageKey"] }],
        ["meta.target が \"setting_imageKey_key\"", { target: "setting_imageKey_key" }],
    ])("imageKey の P2002(%s)なら null を返す", async (_label, meta) => {
        mockedCreate.mockRejectedValue(p2002(meta));
        await expect(SettingRepository.create(data)).resolves.toBeNull();
    });

    it.each([
        ["driver adapter の制約名が別の UNIQUE", adapterMeta("setting_other_key")],
        ["meta.target が別の項目", { target: ["title"] }],
        ["meta が空", {}],
    ])("imageKey 以外の P2002(%s)はそのまま throw する", async (_label, meta) => {
        const error = p2002(meta);
        mockedCreate.mockRejectedValue(error);
        await expect(SettingRepository.create(data)).rejects.toBe(error);
    });

    it("P2002 以外のエラーはそのまま throw する", async () => {
        const error = createKnownRequestError("P2003");
        mockedCreate.mockRejectedValue(error);
        await expect(SettingRepository.create(data)).rejects.toBe(error);
    });
});

describe("SettingRepository.existsByImageKey", () => {
    const imageKey = "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png";

    it("imageKey で検索し、見つかれば true", async () => {
        mockedFindUnique.mockResolvedValue({ id: "setting-1" } as unknown as Setting);

        await expect(SettingRepository.existsByImageKey(imageKey)).resolves.toBe(true);
        expect(mockedFindUnique).toHaveBeenCalledWith({ where: { imageKey }, select: { id: true } });
    });

    it("見つからなければ false", async () => {
        mockedFindUnique.mockResolvedValue(null);
        await expect(SettingRepository.existsByImageKey(imageKey)).resolves.toBe(false);
    });
});

describe("SettingRepository.upsert", () => {
    it("idで検索し、無ければidを付けて作成、あれば同じ内容で更新する", async () => {
        const data: UpsertSettingInput = {
            userId: "user-1",
            title: "テストセッティング",
            description: "テスト",
            imageKey: null,
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

describe("SettingRepository.findById", () => {
    it("idで検索し、編集フォームの初期値と投稿者の確認に必要な項目だけを取得する", async () => {
        mockedFindUnique.mockResolvedValue(null);

        await SettingRepository.findById("setting-1");

        expect(mockedFindUnique).toHaveBeenCalledWith({
            where: { id: "setting-1" },
            select: {
                userId: true,
                title: true,
                description: true,
                imageKey: true,
                barrelId: true,
                shaftId: true,
                flightId: true,
                tipId: true,
            },
        });
    });

    it("見つかった場合は、select で指定した項目の値をそのまま返す", async () => {
        const found = {
            userId: "user-1",
            title: "テストセッティング",
            description: null,
            barrelId: "barrel-1",
            shaftId: null,
            flightId: "flight-1",
            tipId: "tip-1",
        };
        // モックの型は select を反映しないため Setting として渡す
        mockedFindUnique.mockResolvedValue(found as Setting);

        const result = await SettingRepository.findById("setting-1");

        expect(result).toEqual(found);
    });
});

describe("SettingRepository.update", () => {
    const data: UpdateSettingRecordInput = {
        title: "更新後のセッティング",
        description: null,
        barrelId: "barrel-2",
        shaftId: null,
        flightId: "flight-2",
        tipId: "tip-2",
    };

    it("idと投稿者の両方で絞り込んで更新し、idだけを取得して返す", async () => {
        // 実際の戻り値は select で指定した id だけ。モックの型は select を反映しないため Setting として渡す
        mockedUpdate.mockResolvedValue({ id: "setting-1" } as Setting);

        const result = await SettingRepository.update("setting-1", "user-1", data);

        expect(mockedUpdate).toHaveBeenCalledWith({
            where: { id: "setting-1", userId: "user-1" },
            data,
            select: { id: true },
        });
        expect(result).toEqual({ id: "setting-1" });
    });

    it("該当するセッティングが無い(P2025)場合は null を返す", async () => {
        mockedUpdate.mockRejectedValue(createKnownRequestError("P2025"));

        const result = await SettingRepository.update("setting-1", "user-1", data);

        expect(result).toBeNull();
    });

    it("P2025 以外のエラーはそのまま throw する", async () => {
        const dbError = createKnownRequestError("P2003");
        mockedUpdate.mockRejectedValue(dbError);

        await expect(SettingRepository.update("setting-1", "user-1", data)).rejects.toBe(dbError);
    });
});
