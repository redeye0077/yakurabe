import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSettingServiceInput, SettingService } from "@/server/services/setting.service";
import {
    SettingEditRecord,
    SettingListItemRecord,
    SettingRepository,
    UpsertSettingInput,
} from "@/server/repositories/setting.repository";
import { BarrelRepository } from "@/server/repositories/barrel.repository";
import { ShaftRepository } from "@/server/repositories/shaft.repository";
import { FlightRepository } from "@/server/repositories/flight.repository";
import { TipRepository } from "@/server/repositories/tip.repository";
import { SettingNotFoundError, SettingRuleError, SettingRuleField } from "@/server/errors/setting.error";

vi.mock("@/server/repositories/setting.repository", () => ({
    SettingRepository: {
        findLatest: vi.fn(),
        findByUserId: vi.fn(),
        findOwnerById: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
    },
}));
vi.mock("@/server/repositories/barrel.repository", () => ({
    BarrelRepository: { findById: vi.fn() },
}));
vi.mock("@/server/repositories/shaft.repository", () => ({
    ShaftRepository: { findById: vi.fn() },
}));
vi.mock("@/server/repositories/flight.repository", () => ({
    FlightRepository: { findById: vi.fn() },
}));
vi.mock("@/server/repositories/tip.repository", () => ({
    TipRepository: { findById: vi.fn() },
}));

const mockedFindLatest = vi.mocked(SettingRepository.findLatest);
const mockedFindByUserId = vi.mocked(SettingRepository.findByUserId);
const mockedCreate = vi.mocked(SettingRepository.create);
const mockedUpsert = vi.mocked(SettingRepository.upsert);
const mockedFindOwnerById = vi.mocked(SettingRepository.findOwnerById);
const mockedDelete = vi.mocked(SettingRepository.delete);
const mockedFindById = vi.mocked(SettingRepository.findById);
const mockedUpdate = vi.mocked(SettingRepository.update);
const mockedFindBarrel = vi.mocked(BarrelRepository.findById);
const mockedFindShaft = vi.mocked(ShaftRepository.findById);
const mockedFindFlight = vi.mocked(FlightRepository.findById);
const mockedFindTip = vi.mocked(TipRepository.findById);

// 成型フライト(FIT規格)と、規格が合うシャフトの組み合わせ。業務ルールの正常系の基準にする
function mockValidMoldedProducts() {
    mockedFindBarrel.mockResolvedValue({ id: "barrel-1" });
    mockedFindShaft.mockResolvedValue({ id: "shaft-1", flightSystem: "FIT" });
    mockedFindFlight.mockResolvedValue({ id: "flight-1", flightType: "MOLDED", flightSystem: "FIT" });
    mockedFindTip.mockResolvedValue({ id: "tip-1" });
}

// シャフト一体型フライト(規格を持たない)の組み合わせ
function mockValidIntegratedProducts() {
    mockValidMoldedProducts();
    mockedFindFlight.mockResolvedValue({ id: "flight-2", flightType: "SHAFT_INTEGRATED", flightSystem: null });
}

function createInput(overrides: Partial<CreateSettingServiceInput> = {}): CreateSettingServiceInput {
    return {
        title: "テストセッティング",
        description: "テスト",
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
        ...overrides,
    };
}

// SettingRuleError が、指定した項目のエラーとして throw されることを確かめる
async function expectRuleError(promise: Promise<unknown>, field: SettingRuleField) {
    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SettingRuleError);
    expect((error as SettingRuleError).field).toBe(field);
}

type FoundSetting = SettingListItemRecord;

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

function createEditRecord(overrides: Partial<SettingEditRecord> = {}): SettingEditRecord {
    return {
        userId: "user-1",
        title: "テストセッティング",
        description: "テスト",
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
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

describe("SettingService.listByUser", () => {
    it("userIdをRepositoryに渡し、一覧用のDTOに変換して返す", async () => {
        mockedFindByUserId.mockResolvedValue([
            createFoundSetting(),
            createFoundSetting({ id: "setting-2", shaft: null, flight: { name: "一体型フライト", price: 1980 } }),
        ]);

        const result = await SettingService.listByUser({ userId: "user-1" });

        expect(mockedFindByUserId).toHaveBeenCalledWith("user-1");
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
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
        });
        // シャフトがnullでも一覧と同じく合計価格からシャフト分を除く
        expect(result[1].shaftName).toBeNull();
        expect(result[1].totalPrice).toBe(17600 + 1980 + 770);
    });

    it("投稿が0件の場合は空配列を返す", async () => {
        mockedFindByUserId.mockResolvedValue([]);

        const result = await SettingService.listByUser({ userId: "user-without-posts" });

        expect(mockedFindByUserId).toHaveBeenCalledWith("user-without-posts");
        expect(result).toEqual([]);
    });
});

describe("SettingService.create", () => {
    describe("正常系", () => {
        it("成型フライトと規格が合うシャフトなら、投稿者と画像なし(null)を付けて作成し、idを返す", async () => {
            mockValidMoldedProducts();
            mockedCreate.mockResolvedValue({ id: "setting-new" });
            const input = createInput();

            const result = await SettingService.create("user-1", input);

            expect(mockedCreate).toHaveBeenCalledWith({ ...input, userId: "user-1", imageUrl: null });
            expect(result).toEqual({ id: "setting-new" });
        });

        it("一体型フライトでシャフトがnullなら作成し、シャフトは取得しない", async () => {
            mockValidIntegratedProducts();
            mockedCreate.mockResolvedValue({ id: "setting-new" });
            const input = createInput({ shaftId: null, flightId: "flight-2" });

            await SettingService.create("user-1", input);

            expect(mockedFindShaft).not.toHaveBeenCalled();
            expect(mockedCreate).toHaveBeenCalledWith({ ...input, userId: "user-1", imageUrl: null });
        });

        it("特徴・使用感がnullでも作成する", async () => {
            mockValidMoldedProducts();
            mockedCreate.mockResolvedValue({ id: "setting-new" });

            await SettingService.create("user-1", createInput({ description: null }));

            expect(mockedCreate).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
        });
    });

    describe("① 選んだ商品が存在しない", () => {
        it.each([
            { name: "バレル", field: "barrelId", mockNotFound: () => mockedFindBarrel.mockResolvedValue(null) },
            { name: "シャフト", field: "shaftId", mockNotFound: () => mockedFindShaft.mockResolvedValue(null) },
            { name: "フライト", field: "flightId", mockNotFound: () => mockedFindFlight.mockResolvedValue(null) },
            { name: "チップ", field: "tipId", mockNotFound: () => mockedFindTip.mockResolvedValue(null) },
        ] as const)("$name が見つからなければ $field のエラーにし、作成しない", async ({ field, mockNotFound }) => {
            mockValidMoldedProducts();
            mockNotFound();

            await expectRuleError(SettingService.create("user-1", createInput()), field);
            expect(mockedCreate).not.toHaveBeenCalled();
        });
    });

    describe("② シャフトとフライトの規格", () => {
        it("規格が一致しなければ shaftId のエラーにし、作成しない", async () => {
            mockValidMoldedProducts();
            mockedFindShaft.mockResolvedValue({ id: "shaft-1", flightSystem: "UNIVERSAL" });

            await expectRuleError(SettingService.create("user-1", createInput()), "shaftId");
            expect(mockedCreate).not.toHaveBeenCalled();
        });

        it("成型フライトなのに規格がnullなら、シャフトを指定しても規格不一致として shaftId のエラーにし、作成しない", async () => {
            mockValidMoldedProducts();
            mockedFindFlight.mockResolvedValue({ id: "flight-1", flightType: "MOLDED", flightSystem: null });

            const error = await SettingService.create("user-1", createInput()).catch((e: unknown) => e);
            expect(error).toBeInstanceOf(SettingRuleError);
            expect((error as SettingRuleError).field).toBe("shaftId");
            expect((error as SettingRuleError).message).toBe("選択したフライトと規格が合わないシャフトです");
            expect(mockedCreate).not.toHaveBeenCalled();
        });
    });

    describe("③ 一体型フライトとシャフトの有無", () => {
        it("一体型フライトにシャフトを指定したら shaftId のエラーにし、作成しない", async () => {
            mockValidIntegratedProducts();

            await expectRuleError(
                SettingService.create("user-1", createInput({ flightId: "flight-2" })),
                "shaftId",
            );
            expect(mockedCreate).not.toHaveBeenCalled();
        });

        it("一体型でないフライトでシャフトがnullなら shaftId のエラーにし、作成しない", async () => {
            mockValidMoldedProducts();

            await expectRuleError(SettingService.create("user-1", createInput({ shaftId: null })), "shaftId");
            expect(mockedCreate).not.toHaveBeenCalled();
        });
    });

    it("Repositoryの想定外のエラーはそのままthrowする", async () => {
        const dbError = new Error("DB接続エラー");
        mockValidMoldedProducts();
        mockedFindBarrel.mockRejectedValue(dbError);

        await expect(SettingService.create("user-1", createInput())).rejects.toBe(dbError);
        expect(mockedCreate).not.toHaveBeenCalled();
    });
});

describe("SettingService.upsert", () => {
    const input: UpsertSettingInput = {
        userId: "user-1",
        title: "テストセッティング",
        description: "テスト",
        imageUrl: null,
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
    };

    it("業務ルールを満たせば、受け取ったidと入力をそのままRepositoryに渡す", async () => {
        mockValidMoldedProducts();

        await SettingService.upsert("setting-1", input);

        expect(mockedUpsert).toHaveBeenCalledWith("setting-1", input);
    });

    it("登録フォームと同じ業務ルールで検証し、違反していればupsertしない", async () => {
        mockValidMoldedProducts();
        mockedFindShaft.mockResolvedValue({ id: "shaft-1", flightSystem: "UNIVERSAL" });

        await expectRuleError(SettingService.upsert("setting-1", input), "shaftId");
        expect(mockedUpsert).not.toHaveBeenCalled();
    });
});

describe("SettingService.delete", () => {
    it("自分の投稿なら、idと投稿者を指定して削除する", async () => {
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue(true);

        await SettingService.delete("user-1", "setting-1");

        expect(mockedFindOwnerById).toHaveBeenCalledWith("setting-1");
        expect(mockedDelete).toHaveBeenCalledWith("setting-1", "user-1");
    });

    it("対象が存在しなければ SettingNotFoundError を throw し、削除しない", async () => {
        mockedFindOwnerById.mockResolvedValue(null);

        await expect(SettingService.delete("user-1", "setting-1")).rejects.toBeInstanceOf(SettingNotFoundError);
        expect(mockedDelete).not.toHaveBeenCalled();
    });

    it("他人の投稿なら、存在しない場合と同じ SettingNotFoundError を throw し、削除しない", async () => {
        mockedFindOwnerById.mockResolvedValue({ userId: "user-2" });

        await expect(SettingService.delete("user-1", "setting-1")).rejects.toBeInstanceOf(SettingNotFoundError);
        expect(mockedDelete).not.toHaveBeenCalled();
    });

    it("確認後に別の操作で削除されていた(Repository が false を返した)場合も SettingNotFoundError を throw する", async () => {
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue(false);

        await expect(SettingService.delete("user-1", "setting-1")).rejects.toBeInstanceOf(SettingNotFoundError);
    });
});

describe("SettingService.getForEdit", () => {
    it("自分の投稿なら、投稿者を除いた編集フォームの初期値を返す", async () => {
        mockedFindById.mockResolvedValue(createEditRecord({ description: null, shaftId: null }));

        const result = await SettingService.getForEdit("user-1", "setting-1");

        expect(mockedFindById).toHaveBeenCalledWith("setting-1");
        expect(result).toEqual({
            title: "テストセッティング",
            description: null,
            barrelId: "barrel-1",
            shaftId: null,
            flightId: "flight-1",
            tipId: "tip-1",
        });
    });

    it("対象が存在しなければ SettingNotFoundError を throw する", async () => {
        mockedFindById.mockResolvedValue(null);

        await expect(SettingService.getForEdit("user-1", "setting-1")).rejects.toBeInstanceOf(SettingNotFoundError);
    });

    it("他人の投稿なら、存在しない場合と同じ SettingNotFoundError を throw する", async () => {
        mockedFindById.mockResolvedValue(createEditRecord({ userId: "user-2" }));

        await expect(SettingService.getForEdit("user-1", "setting-1")).rejects.toBeInstanceOf(SettingNotFoundError);
    });
});

describe("SettingService.update", () => {
    it("自分の投稿で業務ルールを満たせば、idと投稿者を指定して入力どおりに更新する", async () => {
        mockedFindById.mockResolvedValue(createEditRecord());
        mockValidMoldedProducts();
        mockedUpdate.mockResolvedValue({ id: "setting-1" });
        const input = createInput({ title: "更新後のセッティング", description: null });

        await SettingService.update("user-1", "setting-1", input);

        expect(mockedFindById).toHaveBeenCalledWith("setting-1");
        expect(mockedUpdate).toHaveBeenCalledWith("setting-1", "user-1", input);
    });

    it("対象が存在しなければ SettingNotFoundError を throw し、業務ルールの確認も更新もしない", async () => {
        mockedFindById.mockResolvedValue(null);

        await expect(SettingService.update("user-1", "setting-1", createInput())).rejects.toBeInstanceOf(
            SettingNotFoundError,
        );
        expect(mockedFindBarrel).not.toHaveBeenCalled();
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it("他人の投稿なら、存在しない場合と同じ SettingNotFoundError を throw し、業務ルールの確認も更新もしない", async () => {
        mockedFindById.mockResolvedValue(createEditRecord({ userId: "user-2" }));

        await expect(SettingService.update("user-1", "setting-1", createInput())).rejects.toBeInstanceOf(
            SettingNotFoundError,
        );
        expect(mockedFindBarrel).not.toHaveBeenCalled();
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it("登録と同じ業務ルールで検証し、違反していれば更新しない", async () => {
        mockedFindById.mockResolvedValue(createEditRecord());
        mockValidMoldedProducts();
        mockedFindShaft.mockResolvedValue({ id: "shaft-1", flightSystem: "UNIVERSAL" });

        await expectRuleError(SettingService.update("user-1", "setting-1", createInput()), "shaftId");
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it("確認後に別の操作で削除されていた(Repository が null を返した)場合は SettingNotFoundError を throw する", async () => {
        mockedFindById.mockResolvedValue(createEditRecord());
        mockValidMoldedProducts();
        mockedUpdate.mockResolvedValue(null);

        await expect(SettingService.update("user-1", "setting-1", createInput())).rejects.toBeInstanceOf(
            SettingNotFoundError,
        );
    });
});
