import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { BarrelRepository } from "@/server/repositories/barrel.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        barrel: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.barrel.findMany);
const mockedFindUnique = vi.mocked(prisma.barrel.findUnique);
const mockedUpsert = vi.mocked(prisma.barrel.upsert);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("BarrelRepository.findAll", () => {
    it("絞り込み・件数上限なしで、名前順(同名はid順)に全件取得する", async () => {
        mockedFindMany.mockResolvedValue([]);

        await BarrelRepository.findAll();

        expect(mockedFindMany).toHaveBeenCalledWith({
            orderBy: [{ name: "asc" }, { id: "asc" }],
        });
    });
});

describe("BarrelRepository.findById", () => {
    it("idで1件を、判定に必要な項目だけ取得する", async () => {
        mockedFindUnique.mockResolvedValue(null);

        await BarrelRepository.findById("barrel-1");

        expect(mockedFindUnique).toHaveBeenCalledWith({
            where: { id: "barrel-1" },
            select: { id: true },
        });
    });
});

describe("BarrelRepository.upsert", () => {
    it("idで検索し、無ければidを付けて作成、あれば同じ内容で更新する", async () => {
        const data = { name: "テストバレル", maker: "テストメーカー", price: 10000, imageUrl: "/x.png", weight: 20, totalLength: 40, maxDiameter: 7.5, material: "タングステン" };

        await BarrelRepository.upsert("barrel-1", data);

        expect(mockedUpsert).toHaveBeenCalledWith({
            where: { id: "barrel-1" },
            create: { id: "barrel-1", ...data },
            update: data,
        });
    });
});
