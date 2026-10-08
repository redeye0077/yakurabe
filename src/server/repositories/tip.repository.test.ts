import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { TipRepository } from "@/server/repositories/tip.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tip: {
            findMany: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.tip.findMany);

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
