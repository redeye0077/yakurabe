import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { ShaftRepository } from "@/server/repositories/shaft.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        shaft: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.shaft.findMany);
const mockedFindUnique = vi.mocked(prisma.shaft.findUnique);
const mockedUpsert = vi.mocked(prisma.shaft.upsert);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("ShaftRepository.findAll", () => {
    it("絞り込み・件数上限なしで、名前順(同名はid順)に全件取得する", async () => {
        mockedFindMany.mockResolvedValue([]);

        await ShaftRepository.findAll();

        expect(mockedFindMany).toHaveBeenCalledWith({
            orderBy: [{ name: "asc" }, { id: "asc" }],
        });
    });
});

describe("ShaftRepository.findById", () => {
    it("idで1件を、判定に必要な項目だけ取得する", async () => {
        mockedFindUnique.mockResolvedValue(null);

        await ShaftRepository.findById("shaft-1");

        expect(mockedFindUnique).toHaveBeenCalledWith({
            where: { id: "shaft-1" },
            select: { id: true, flightSystem: true },
        });
    });
});

describe("ShaftRepository.upsert", () => {
    it("idで検索し、無ければidを付けて作成、あれば同じ内容で更新する", async () => {
        const data = { name: "テストシャフト", maker: "テストメーカー", price: 660, imageUrl: "/x.png", shaftLength: "24.0mm", shaftShape: "ノーマル", isSpin: false, material: "ナイロン", flightSystem: "FIT" as const };

        await ShaftRepository.upsert("shaft-1", data);

        expect(mockedUpsert).toHaveBeenCalledWith({
            where: { id: "shaft-1" },
            create: { id: "shaft-1", ...data },
            update: data,
        });
    });
});
