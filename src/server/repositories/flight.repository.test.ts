import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { FlightRepository } from "@/server/repositories/flight.repository";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        flight: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

const mockedFindMany = vi.mocked(prisma.flight.findMany);
const mockedFindUnique = vi.mocked(prisma.flight.findUnique);
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

describe("FlightRepository.findById", () => {
    it("idで1件を、判定に必要な項目だけ取得する", async () => {
        mockedFindUnique.mockResolvedValue(null);

        await FlightRepository.findById("flight-1");

        expect(mockedFindUnique).toHaveBeenCalledWith({
            where: { id: "flight-1" },
            select: { id: true, flightType: true, flightSystem: true },
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
