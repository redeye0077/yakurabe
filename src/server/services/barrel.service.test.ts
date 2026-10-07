import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Barrel } from "@prisma/client";
import { BarrelService } from "@/server/services/barrel.service";
import { BarrelRepository } from "@/server/repositories/barrel.repository";

vi.mock("@/server/repositories/barrel.repository", () => ({
    BarrelRepository: {
        findAll: vi.fn(),
        create: vi.fn(),
    },
}));

const mockedFindAll = vi.mocked(BarrelRepository.findAll);

function createMockBarrel(overrides: Partial<Barrel> = {}): Barrel {
    return {
        id: "barrel-1",
        name: "テストバレル",
        maker: "テストメーカー",
        price: 10000,
        imageUrl: "https://example.com/barrel.png",
        hiveUrl: "https://example.com/hive",
        weight: 20,
        totalLength: 40,
        maxDiameter: 7.5,
        material: "タングステン",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("BarrelService.listAll", () => {
    it("Repositoryの全件取得を呼び、DTOの形に変換された結果を返す", async () => {
        mockedFindAll.mockResolvedValue([
            createMockBarrel({ id: "barrel-1", name: "テストバレルA", price: 10000, weight: 20 }),
            createMockBarrel({ id: "barrel-2", name: "テストバレルB", price: 15000, weight: 18.5 }),
        ]);

        const result = await BarrelService.listAll();

        expect(mockedFindAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            { id: "barrel-1", name: "テストバレルA", price: 10000, weight: 20 },
            { id: "barrel-2", name: "テストバレルB", price: 15000, weight: 18.5 },
        ]);
    });

    it("バレルが0件の場合は空配列を返す", async () => {
        mockedFindAll.mockResolvedValue([]);

        const result = await BarrelService.listAll();

        expect(result).toEqual([]);
    });

    it("結果にmaker/imageUrl等の余分なフィールドが含まれない", async () => {
        mockedFindAll.mockResolvedValue([createMockBarrel()]);

        const result = await BarrelService.listAll();

        expect(Object.keys(result[0]).sort()).toEqual(
            ["id", "name", "price", "weight"].sort()
        );
    });
});
