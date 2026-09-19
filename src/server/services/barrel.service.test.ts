import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Barrel } from "@prisma/client";
import { BarrelService } from "@/server/services/barrel.service";
import { BarrelRepository } from "@/server/repositories/barrel.repository";

vi.mock("@/server/repositories/barrel.repository", () => ({
    BarrelRepository: {
        findByNameContains: vi.fn(),
        create: vi.fn(),
    },
}));

const mockedFindByNameContains = vi.mocked(BarrelRepository.findByNameContains);

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

describe("BarrelService.search", () => {
    it("queryが未指定の場合は空配列を返し、Repositoryを呼ばない", async () => {
        const result = await BarrelService.search(undefined);

        expect(result).toEqual([]);
        expect(mockedFindByNameContains).not.toHaveBeenCalled();
    });

    it("queryが空文字の場合は空配列を返し、Repositoryを呼ばない", async () => {
        const result = await BarrelService.search("");

        expect(result).toEqual([]);
        expect(mockedFindByNameContains).not.toHaveBeenCalled();
    });

    it("queryが指定された場合はRepositoryを呼び、DTOの形に変換された結果を返す", async () => {
        mockedFindByNameContains.mockResolvedValue([
            createMockBarrel({ id: "barrel-1", name: "テストバレル", price: 10000, weight: 20 }),
        ]);

        const result = await BarrelService.search("テスト");

        expect(mockedFindByNameContains).toHaveBeenCalledWith("テスト");
        expect(result).toEqual([
            { id: "barrel-1", name: "テストバレル", price: 10000, weight: 20 },
        ]);
    });

    it("結果にmaker/imageUrl等の余分なフィールドが含まれない", async () => {
        mockedFindByNameContains.mockResolvedValue([createMockBarrel()]);

        const result = await BarrelService.search("テスト");

        expect(result[0]).not.toHaveProperty("maker");
        expect(result[0]).not.toHaveProperty("imageUrl");
        expect(result[0]).not.toHaveProperty("hiveUrl");
        expect(result[0]).not.toHaveProperty("totalLength");
        expect(result[0]).not.toHaveProperty("maxDiameter");
        expect(result[0]).not.toHaveProperty("material");
        expect(result[0]).not.toHaveProperty("createdAt");
        expect(result[0]).not.toHaveProperty("updatedAt");
        expect(Object.keys(result[0]).sort()).toEqual(
            ["id", "name", "price", "weight"].sort()
        );
    });
});
