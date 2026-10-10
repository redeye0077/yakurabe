import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { ShaftRepository } from "@/server/repositories/shaft.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        shaft: {
            findMany: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.shaft.findMany);

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
