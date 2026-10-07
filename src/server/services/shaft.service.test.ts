import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Shaft } from "@prisma/client";
import { ShaftService } from "@/server/services/shaft.service";
import { ShaftRepository } from "@/server/repositories/shaft.repository";

vi.mock("@/server/repositories/shaft.repository", () => ({
    ShaftRepository: {
        findAll: vi.fn(),
        create: vi.fn(),
    },
}));

const mockedFindAll = vi.mocked(ShaftRepository.findAll);

function createMockShaft(overrides: Partial<Shaft> = {}): Shaft {
    return {
        id: "shaft-1",
        name: "テストシャフト",
        maker: "テストメーカー",
        price: 660,
        imageUrl: "https://example.com/shaft.png",
        hiveUrl: "https://example.com/hive",
        shaftLength: "26.0mm",
        shaftShape: "ストレート",
        isSpin: false,
        material: "ポリカーボネート",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("ShaftService.listAll", () => {
    it("Repositoryの全件取得を呼び、DTOの形に変換された結果を返す", async () => {
        mockedFindAll.mockResolvedValue([
            createMockShaft({ id: "shaft-1", name: "テストシャフトA", price: 660 }),
            createMockShaft({ id: "shaft-2", name: "テストシャフトB", price: 1320 }),
        ]);

        const result = await ShaftService.listAll();

        expect(mockedFindAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            { id: "shaft-1", name: "テストシャフトA", price: 660 },
            { id: "shaft-2", name: "テストシャフトB", price: 1320 },
        ]);
    });

    it("シャフトが0件の場合は空配列を返す", async () => {
        mockedFindAll.mockResolvedValue([]);

        const result = await ShaftService.listAll();

        expect(result).toEqual([]);
    });

    it("結果にmaker/isSpin等の余分なフィールドが含まれない", async () => {
        mockedFindAll.mockResolvedValue([createMockShaft()]);

        const result = await ShaftService.listAll();

        expect(Object.keys(result[0]).sort()).toEqual(
            ["id", "name", "price"].sort()
        );
    });
});
