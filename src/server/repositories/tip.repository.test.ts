import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { TipRepository } from "@/server/repositories/tip.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tip: {
            findMany: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.tip.findMany);
const mockedUpsert = vi.mocked(prisma.tip.upsert);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("TipRepository.findAll", () => {
    it("絞り込み・件数上限なしで、名前順(同名はid順)に全件取得する", async () => {
        mockedFindMany.mockResolvedValue([]);

        await TipRepository.findAll();

        expect(mockedFindMany).toHaveBeenCalledWith({
            orderBy: [{ name: "asc" }, { id: "asc" }],
        });
    });
});

describe("TipRepository.upsert", () => {
    it("idで検索し、無ければidを付けて作成、あれば同じ内容で更新する", async () => {
        const data = { name: "テストチップ", maker: "テストメーカー", price: 550, imageUrl: "/x.png", threadSize: "TWO_BA" as const };

        await TipRepository.upsert("tip-1", data);

        expect(mockedUpsert).toHaveBeenCalledWith({
            where: { id: "tip-1" },
            create: { id: "tip-1", ...data },
            update: data,
        });
    });
});
