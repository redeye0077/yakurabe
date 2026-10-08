import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Tip } from "@prisma/client";
import { TipService } from "@/server/services/tip.service";
import { TipRepository } from "@/server/repositories/tip.repository";

vi.mock("@/server/repositories/tip.repository", () => ({
    TipRepository: {
        findAll: vi.fn(),
        create: vi.fn(),
    },
}));

const mockedFindAll = vi.mocked(TipRepository.findAll);
const mockedCreate = vi.mocked(TipRepository.create);

function createMockTip(overrides: Partial<Tip> = {}): Tip {
    return {
        id: "tip-1",
        name: "テストチップ 2BA",
        maker: "テストメーカー",
        price: 550,
        imageUrl: "https://example.com/tip.png",
        hiveUrl: "https://example.com/hive",
        threadSize: "TWO_BA",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("TipService.listAll", () => {
    it("Repositoryの全件取得を呼び、DTOの形に変換された結果を返す", async () => {
        mockedFindAll.mockResolvedValue([
            createMockTip({ id: "tip-1", name: "テストチップ 2BA", price: 550 }),
            createMockTip({ id: "tip-2", name: "テストチップ No.5", price: 660, threadSize: "NO_5" }),
        ]);

        const result = await TipService.listAll();

        expect(mockedFindAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            { id: "tip-1", name: "テストチップ 2BA", price: 550 },
            { id: "tip-2", name: "テストチップ No.5", price: 660 },
        ]);
    });

    it("チップが0件の場合は空配列を返す", async () => {
        mockedFindAll.mockResolvedValue([]);

        const result = await TipService.listAll();

        expect(result).toEqual([]);
    });

    it("結果にmaker/threadSize等の余分なフィールドが含まれない", async () => {
        mockedFindAll.mockResolvedValue([createMockTip()]);

        const result = await TipService.listAll();

        expect(Object.keys(result[0]).sort()).toEqual(
            ["id", "name", "price"].sort()
        );
    });
});

describe("TipService.create", () => {
    it("受け取った入力をそのままRepositoryに渡す", async () => {
        const input = {
            name: "テストチップ No.5",
            maker: "テストメーカー",
            price: 660,
            imageUrl: "https://example.com/tip.png",
            threadSize: "NO_5" as const,
        };

        await TipService.create(input);

        expect(mockedCreate).toHaveBeenCalledWith(input);
    });
});
