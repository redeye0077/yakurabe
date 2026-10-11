import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { ShaftRepository } from "@/server/repositories/shaft.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        shaft: {
            findMany: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.shaft.findMany);
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
