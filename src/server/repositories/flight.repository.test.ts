import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { FlightRepository } from "@/server/repositories/flight.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        flight: {
            findMany: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.flight.findMany);

beforeEach(() => {
    vi.clearAllMocks();
});

describe("FlightRepository.findAll", () => {
    it("絞り込み・件数上限なしで、名前順(同名はid順)に全件取得する", async () => {
        mockedFindMany.mockResolvedValue([]);

        await FlightRepository.findAll();

        expect(mockedFindMany).toHaveBeenCalledWith({
            orderBy: [{ name: "asc" }, { id: "asc" }],
        });
    });
});
