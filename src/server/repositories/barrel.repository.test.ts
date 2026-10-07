import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { BarrelRepository } from "@/server/repositories/barrel.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        barrel: {
            findMany: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.barrel.findMany);

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
