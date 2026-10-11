import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { FlightRepository } from "@/server/repositories/flight.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        flight: {
            findMany: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.flight.findMany);
const mockedUpsert = vi.mocked(prisma.flight.upsert);

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

describe("FlightRepository.upsert", () => {
    it("idで検索し、無ければidを付けて作成、あれば同じ内容で更新する", async () => {
        const data = { name: "テストフライト", maker: "テストメーカー", price: 550, imageUrl: "/x.png", flightType: "MOLDED" as const, flightShape: "シェイプ", flightSystem: "FIT" as const };

        await FlightRepository.upsert("flight-1", data);

        expect(mockedUpsert).toHaveBeenCalledWith({
            where: { id: "flight-1" },
            create: { id: "flight-1", ...data },
            update: data,
        });
    });
});
