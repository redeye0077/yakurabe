import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingService } from "@/server/services/setting.service";
import { SettingRepository, UpsertSettingInput } from "@/server/repositories/setting.repository";

vi.mock("@/server/repositories/setting.repository", () => ({
    SettingRepository: {
        findLatest: vi.fn(),
        upsert: vi.fn(),
    },
}));

const mockedFindLatest = vi.mocked(SettingRepository.findLatest);
const mockedUpsert = vi.mocked(SettingRepository.upsert);

type FoundSetting = Awaited<ReturnType<typeof SettingRepository.findLatest>>[number];

function createFoundSetting(overrides: Partial<FoundSetting> = {}): FoundSetting {
    return {
        id: "setting-1",
        title: "テストセッティング",
        imageUrl: "/images/samples/test.jpg",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        user: { username: "テストユーザー" },
        barrel: { name: "テストバレル", weight: 18, price: 17600 },
        shaft: { name: "テストシャフト", price: 4180 },
        flight: { name: "テストフライト", price: 1080 },
        tip: { name: "テストチップ", price: 770 },
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SettingService.listLatest", () => {
    it("指定した件数をRepositoryに渡し、一覧用のDTOに変換して返す", async () => {
        mockedFindLatest.mockResolvedValue([createFoundSetting()]);

        const result = await SettingService.listLatest({ limit: 4 });

        expect(mockedFindLatest).toHaveBeenCalledWith(4);
        expect(result).toEqual([
            {
                id: "setting-1",
                title: "テストセッティング",
                imageUrl: "/images/samples/test.jpg",
                barrelName: "テストバレル",
                shaftName: "テストシャフト",
                flightName: "テストフライト",
                tipName: "テストチップ",
                barrelWeight: 18,
                totalPrice: 17600 + 4180 + 1080 + 770,
                userName: "テストユーザー",
                createdAt: "2026-10-01T00:00:00.000Z",
            },
        ]);
    });

    it("件数を省略するとRepositoryに件数を渡さず全件を取得する", async () => {
        mockedFindLatest.mockResolvedValue([]);

        const result = await SettingService.listLatest();

        expect(mockedFindLatest).toHaveBeenCalledWith(undefined);
        expect(result).toEqual([]);
    });

    it("シャフトがnull(一体型フライト)の場合はshaftNameをnullにし、合計価格にシャフト分を含めない", async () => {
        mockedFindLatest.mockResolvedValue([
            createFoundSetting({ shaft: null, flight: { name: "一体型フライト", price: 1980 } }),
        ]);

        const [result] = await SettingService.listLatest();

        expect(result.shaftName).toBeNull();
        expect(result.totalPrice).toBe(17600 + 1980 + 770);
    });

    it("画像が未設定の場合はimageUrlをnullのまま返す", async () => {
        mockedFindLatest.mockResolvedValue([createFoundSetting({ imageUrl: null })]);

        const [result] = await SettingService.listLatest();

        expect(result.imageUrl).toBeNull();
    });
});

describe("SettingService.upsert", () => {
    it("受け取ったidと入力をそのままRepositoryに渡す", async () => {
        const input: UpsertSettingInput = {
            userId: "user-1",
            title: "テストセッティング",
            description: "テスト",
            imageUrl: null,
            tag: "BALANCE",
            barrelId: "barrel-1",
            shaftId: null,
            flightId: "flight-1",
            tipId: "tip-1",
            createdAt: new Date("2026-10-01T00:00:00.000Z"),
        };

        await SettingService.upsert("setting-1", input);

        expect(mockedUpsert).toHaveBeenCalledWith("setting-1", input);
    });
});
