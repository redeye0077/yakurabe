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
import {
    SettingImageError,
    SettingNotFoundError,
    SettingRuleError,
    SettingRuleField,
} from "@/server/errors/setting.error";
import type { ObjectInspection, ObjectStorage } from "@/server/storage/object-storage";
import { S3ObjectStorage } from "@/server/storage/s3-object-storage";
import { getObjectStorage } from "@/server/storage/get-object-storage";

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
        existsByImageKey: vi.fn(),
    },
}));
// 表示用 URL の組み立てだけを使うため、通信しない実装をそのまま使う(開発と同じ形の S3_PUBLIC_BASE_URL)
const PUBLIC_BASE_URL = "http://localhost:9090/yakurabe-dev";
vi.mock("@/server/storage/get-object-storage", () => ({
    getObjectStorage: vi.fn(),
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
const mockedGetObjectStorage = vi.mocked(getObjectStorage);
const mockedExistsByImageKey = vi.mocked(SettingRepository.existsByImageKey);

const IMAGE_KEY = "settings/user-1/123e4567-e89b-42d3-a456-426614174000.webp";
const IMAGE_URL = `${PUBLIC_BASE_URL}/${IMAGE_KEY}`;

function createStorage(publicBaseUrl = PUBLIC_BASE_URL) {
    return new S3ObjectStorage({
        region: "ap-northeast-1",
        bucket: "yakurabe-dev",
        accessKeyId: "dummy",
        secretAccessKey: "dummy",
        publicBaseUrl,
        endpoint: "http://s3mock:9090",
    });
}

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
        imageKey: null,
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
        imageKey: IMAGE_KEY,
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
        imageKey: null,
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedGetObjectStorage.mockReturnValue(createStorage());
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
                imageUrl: IMAGE_URL,
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

    it("画像が未設定(imageKey が null)の場合は imageUrl を null にする", async () => {
        mockedFindLatest.mockResolvedValue([createFoundSetting({ imageKey: null })]);

        const [result] = await SettingService.listLatest();

        expect(result.imageUrl).toBeNull();
    });

    it("表示用 URL は S3_PUBLIC_BASE_URL とキーを1つの / でつなぐ(二重スラッシュにしない)", async () => {
        mockedFindLatest.mockResolvedValue([createFoundSetting()]);

        const [result] = await SettingService.listLatest();

        expect(result.imageUrl).toBe(
            "http://localhost:9090/yakurabe-dev/settings/user-1/123e4567-e89b-42d3-a456-426614174000.webp"
        );
        // プロトコルの "//" 以外にスラッシュの連続が無い
        expect(result.imageUrl?.replace("http://", "")).not.toContain("//");
    });

    it("S3_PUBLIC_BASE_URL の末尾に / が付いていても二重スラッシュにしない", async () => {
        mockedGetObjectStorage.mockReturnValue(createStorage(`${PUBLIC_BASE_URL}/`));
        mockedFindLatest.mockResolvedValue([createFoundSetting()]);

        const [result] = await SettingService.listLatest();

        expect(result.imageUrl).toBe(IMAGE_URL);
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
            imageUrl: IMAGE_URL,
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

            expect(mockedCreate).toHaveBeenCalledWith({ ...input, userId: "user-1", imageKey: null });
            expect(result).toEqual({ id: "setting-new" });
        });

        it("一体型フライトでシャフトがnullなら作成し、シャフトは取得しない", async () => {
            mockValidIntegratedProducts();
            mockedCreate.mockResolvedValue({ id: "setting-new" });
            const input = createInput({ shaftId: null, flightId: "flight-2" });

            await SettingService.create("user-1", input);

            expect(mockedFindShaft).not.toHaveBeenCalled();
            expect(mockedCreate).toHaveBeenCalledWith({ ...input, userId: "user-1", imageKey: null });
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
        imageKey: null,
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
        const storage = useFakeStorage();
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue({ imageKey: null });

        await SettingService.delete("user-1", "setting-1");

        expect(mockedFindOwnerById).toHaveBeenCalledWith("setting-1");
        expect(mockedDelete).toHaveBeenCalledWith("setting-1", "user-1");
        // 画像なしのセッティングでは、画像の確認も削除もしない
        expect(mockedExistsByImageKey).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("削除した行に画像があれば、どこからも参照されていないことを確かめて画像も削除する", async () => {
        const storage = useFakeStorage();
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue({ imageKey: PNG_KEY });
        mockedExistsByImageKey.mockResolvedValue(false);

        await SettingService.delete("user-1", "setting-1");

        expect(mockedExistsByImageKey).toHaveBeenCalledWith(PNG_KEY);
        expect(storage.delete).toHaveBeenCalledWith(PNG_KEY);
        // DB の削除が終わってから画像を消す
        expect(mockedDelete.mock.invocationCallOrder[0]).toBeLessThan(storage.delete.mock.invocationCallOrder[0]);
    });

    it("画像がほかのセッティングから参照されていれば、画像は削除しない", async () => {
        const storage = useFakeStorage();
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue({ imageKey: PNG_KEY });
        mockedExistsByImageKey.mockResolvedValue(true);

        await SettingService.delete("user-1", "setting-1");

        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("画像の削除に失敗しても、ログだけ残して成功扱いにする", async () => {
        const storage = useFakeStorage();
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue({ imageKey: PNG_KEY });
        mockedExistsByImageKey.mockResolvedValue(false);
        storage.delete.mockRejectedValue(new Error("S3 エラー"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(SettingService.delete("user-1", "setting-1")).resolves.toBeUndefined();
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("画像の使用状況を確認できなくても、削除せずログだけ残して成功扱いにする", async () => {
        const storage = useFakeStorage();
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue({ imageKey: PNG_KEY });
        mockedExistsByImageKey.mockRejectedValue(new Error("DB接続エラー"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(SettingService.delete("user-1", "setting-1")).resolves.toBeUndefined();
        expect(storage.delete).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("DB の削除が例外で失敗したら、画像には触れずにそのまま throw する", async () => {
        const storage = useFakeStorage();
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        const dbError = new Error("DB接続エラー");
        mockedDelete.mockRejectedValue(dbError);

        await expect(SettingService.delete("user-1", "setting-1")).rejects.toBe(dbError);
        expect(mockedExistsByImageKey).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
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

    it("確認後に別の操作で削除されていた(Repository が null を返した)場合も SettingNotFoundError を throw し、画像には触れない", async () => {
        const storage = useFakeStorage();
        mockedFindOwnerById.mockResolvedValue({ userId: "user-1" });
        mockedDelete.mockResolvedValue(null);

        await expect(SettingService.delete("user-1", "setting-1")).rejects.toBeInstanceOf(SettingNotFoundError);
        expect(mockedExistsByImageKey).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
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
            imageUrl: null,
            barrelId: "barrel-1",
            shaftId: null,
            flightId: "flight-1",
            tipId: "tip-1",
        });
    });

    it("画像があれば、保存先キーから組み立てた表示用 URL を返す", async () => {
        mockedFindById.mockResolvedValue(createEditRecord({ imageKey: IMAGE_KEY }));

        const result = await SettingService.getForEdit("user-1", "setting-1");

        expect(result.imageUrl).toBe(IMAGE_URL);
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
        mockedUpdate.mockResolvedValue("updated");
        const input = createInput({ title: "更新後のセッティング", description: null });

        await SettingService.update("user-1", "setting-1", input);

        expect(mockedFindById).toHaveBeenCalledWith("setting-1");
        // 画像を選んでいない(imageKey が null)ので imageKey は渡さない
        expect(mockedUpdate).toHaveBeenCalledWith("setting-1", "user-1", {
            title: "更新後のセッティング",
            description: null,
            barrelId: "barrel-1",
            shaftId: "shaft-1",
            flightId: "flight-1",
            tipId: "tip-1",
        });
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

    it("確認後に別の操作で削除されていた(Repository が not_found を返した)場合は SettingNotFoundError を throw する", async () => {
        mockedFindById.mockResolvedValue(createEditRecord());
        mockValidMoldedProducts();
        mockedUpdate.mockResolvedValue("not_found");

        await expect(SettingService.update("user-1", "setting-1", createInput())).rejects.toBeInstanceOf(
            SettingNotFoundError,
        );
    });
});

// 画像の確認・保存・削除・発行を差し替えた保存先。表示用 URL は本物と同じ組み立てにする
function useFakeStorage() {
    const real = createStorage();
    const storage = {
        createPresignedUpload: vi.fn<ObjectStorage["createPresignedUpload"]>(),
        inspect: vi.fn<ObjectStorage["inspect"]>(),
        put: vi.fn<ObjectStorage["put"]>(),
        delete: vi.fn<ObjectStorage["delete"]>(),
        publicUrl: (key: string) => real.publicUrl(key),
    } satisfies ObjectStorage;
    mockedGetObjectStorage.mockReturnValue(storage);
    return storage;
}

const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const JPEG_HEAD = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1]);
const PNG_KEY = "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png";

function inspection(overrides: Partial<ObjectInspection> = {}): ObjectInspection {
    return { contentType: "image/png", size: 2048, firstBytes: PNG_HEAD, ...overrides };
}

describe("SettingService.createImageUpload", () => {
    it("本人の prefix のキーを作り、サイズ上限 5MB で署名付き POST を発行してキーと一緒に返す", async () => {
        const storage = useFakeStorage();
        storage.createPresignedUpload.mockResolvedValue({
            url: "http://localhost:9090/yakurabe-dev",
            fields: { Policy: "policy" },
        });

        const result = await SettingService.createImageUpload("user-1", "image/png");

        expect(result.key).toMatch(/^settings\/user-1\/[0-9a-f-]{36}\.png$/);
        expect(storage.createPresignedUpload).toHaveBeenCalledWith({
            key: result.key,
            contentType: "image/png",
            maxBytes: 5 * 1024 * 1024,
        });
        expect(result).toEqual({
            url: "http://localhost:9090/yakurabe-dev",
            fields: { Policy: "policy" },
            key: result.key,
        });
    });
});

describe("SettingService.create の画像", () => {
    it("画像を確認してから、imageKey 付きで作成する", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        mockedCreate.mockResolvedValue({ id: "setting-new" });
        const input = createInput({ imageKey: PNG_KEY });

        const result = await SettingService.create("user-1", input);

        expect(storage.inspect).toHaveBeenCalledWith(PNG_KEY);
        expect(mockedCreate).toHaveBeenCalledWith({ ...input, userId: "user-1" });
        expect(result).toEqual({ id: "setting-new" });
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("画像が無ければ確認しない", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        mockedCreate.mockResolvedValue({ id: "setting-new" });

        await SettingService.create("user-1", createInput());

        expect(storage.inspect).not.toHaveBeenCalled();
    });

    it("商品の組み合わせが不正なら、画像を確認する前に SettingRuleError を throw する", async () => {
        mockValidMoldedProducts();
        mockedFindTip.mockResolvedValue(null);
        const storage = useFakeStorage();

        await expectRuleError(SettingService.create("user-1", createInput({ imageKey: PNG_KEY })), "tipId");
        expect(storage.inspect).not.toHaveBeenCalled();
    });

    async function expectImageError(imageKey: string, message = "画像を確認できませんでした。もう一度選択してください") {
        const error = await SettingService.create("user-1", createInput({ imageKey })).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(SettingImageError);
        expect((error as SettingImageError).message).toBe(message);
        expect(mockedCreate).not.toHaveBeenCalled();
    }

    it.each([
        ["他人の prefix", "settings/user-2/123e4567-e89b-42d3-a456-426614174000.png"],
        ["形が違う", "settings/user-1/image.png"],
        ["prefix が違う", "uploads/user-1/123e4567-e89b-42d3-a456-426614174000.png"],
    ])("キーが%sなら S3 を見ずに SettingImageError", async (_label, imageKey) => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();

        await expectImageError(imageKey);
        expect(storage.inspect).not.toHaveBeenCalled();
    });

    it.each([
        ["存在しない(inspect が null)", null, undefined],
        ["0 バイト", inspection({ size: 0, firstBytes: new Uint8Array() }), undefined],
        ["5MB 超", inspection({ size: 5 * 1024 * 1024 + 1 }), "画像は 5MB 以下にしてください"],
        ["Content-Type がキーの拡張子と違う", inspection({ contentType: "image/jpeg" }), undefined],
        ["Content-Type が無い", inspection({ contentType: undefined }), undefined],
        ["中身がキーの拡張子と違う(JPEG)", inspection({ firstBytes: JPEG_HEAD }), undefined],
        ["中身が画像でない", inspection({ firstBytes: new TextEncoder().encode("<!doctype html>") }), undefined],
    ])("S3 上の画像が%sなら SettingImageError", async (_label, result, message) => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(result);

        await expectImageError(PNG_KEY, message);
    });

    it("ちょうど 5MB なら作成する", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection({ size: 5 * 1024 * 1024 }));
        mockedCreate.mockResolvedValue({ id: "setting-new" });

        await expect(SettingService.create("user-1", createInput({ imageKey: PNG_KEY }))).resolves.toEqual({
            id: "setting-new",
        });
    });

    it("imageKey がすでに使われていた(Repository が null)なら SettingImageError にし、その画像は削除しない", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        mockedCreate.mockResolvedValue(null);

        const error = await SettingService.create("user-1", createInput({ imageKey: PNG_KEY })).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(SettingImageError);
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("保存に失敗したら、どのセッティングからも参照されていないことを確かめて画像を削除し、元のエラーを throw する", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        const dbError = new Error("DB接続エラー");
        mockedCreate.mockRejectedValue(dbError);
        mockedExistsByImageKey.mockResolvedValue(false);

        await expect(SettingService.create("user-1", createInput({ imageKey: PNG_KEY }))).rejects.toBe(dbError);
        expect(mockedExistsByImageKey).toHaveBeenCalledWith(PNG_KEY);
        expect(storage.delete).toHaveBeenCalledWith(PNG_KEY);
    });

    it("保存の失敗が imageKey の重複だと判定できなくても(P2002 の判定が外れた場合)、使用中の画像は削除しない", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        // Repository が null に変換できず、P2002 がそのまま throw された状態
        const uniqueError = new Error("Unique constraint failed on the setting_imageKey_key");
        mockedCreate.mockRejectedValue(uniqueError);
        mockedExistsByImageKey.mockResolvedValue(true);

        await expect(SettingService.create("user-1", createInput({ imageKey: PNG_KEY }))).rejects.toBe(uniqueError);
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("保存の失敗後に画像の使用状況を確認できなければ、削除せずログだけ残して元のエラーを throw する", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        const dbError = new Error("DB接続エラー");
        mockedCreate.mockRejectedValue(dbError);
        mockedExistsByImageKey.mockRejectedValue(new Error("DB接続エラー(確認時)"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(SettingService.create("user-1", createInput({ imageKey: PNG_KEY }))).rejects.toBe(dbError);
        expect(storage.delete).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("保存の失敗後に画像の削除も失敗したら、ログだけ残して元のエラーを throw する", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        const dbError = new Error("DB接続エラー");
        mockedCreate.mockRejectedValue(dbError);
        mockedExistsByImageKey.mockResolvedValue(false);
        storage.delete.mockRejectedValue(new Error("S3 エラー"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(SettingService.create("user-1", createInput({ imageKey: PNG_KEY }))).rejects.toBe(dbError);
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("画像なしで保存に失敗しても、削除は呼ばない", async () => {
        mockValidMoldedProducts();
        const storage = useFakeStorage();
        mockedCreate.mockRejectedValue(new Error("DB接続エラー"));

        await expect(SettingService.create("user-1", createInput())).rejects.toThrow("DB接続エラー");
        expect(mockedExistsByImageKey).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
    });
});

describe("SettingService.discardUploadedImage", () => {
    it("本人の prefix で、どのセッティングにも使われていなければ削除する", async () => {
        const storage = useFakeStorage();
        mockedExistsByImageKey.mockResolvedValue(false);

        await SettingService.discardUploadedImage("user-1", PNG_KEY);

        expect(mockedExistsByImageKey).toHaveBeenCalledWith(PNG_KEY);
        expect(storage.delete).toHaveBeenCalledWith(PNG_KEY);
    });

    it.each([
        ["他人の prefix", "settings/user-2/123e4567-e89b-42d3-a456-426614174000.png"],
        ["形が違う", "settings/user-1/../user-2/x.png"],
    ])("%s のキーは、DB も S3 も見ずに何もしない", async (_label, imageKey) => {
        const storage = useFakeStorage();

        await SettingService.discardUploadedImage("user-1", imageKey);

        expect(mockedExistsByImageKey).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("いずれかのセッティングで使われている画像は削除しない", async () => {
        const storage = useFakeStorage();
        mockedExistsByImageKey.mockResolvedValue(true);

        await SettingService.discardUploadedImage("user-1", PNG_KEY);

        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("使用状況を確認できなければ、削除せずログだけ残す", async () => {
        const storage = useFakeStorage();
        mockedExistsByImageKey.mockRejectedValue(new Error("DB接続エラー"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(SettingService.discardUploadedImage("user-1", PNG_KEY)).resolves.toBeUndefined();
        expect(storage.delete).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("削除に失敗しても throw せず、ログだけ残す", async () => {
        const storage = useFakeStorage();
        mockedExistsByImageKey.mockResolvedValue(false);
        storage.delete.mockRejectedValue(new Error("S3 エラー"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(SettingService.discardUploadedImage("user-1", PNG_KEY)).resolves.toBeUndefined();
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });
});

describe("SettingService.update の画像", () => {
    const OLD_KEY = "settings/user-1/00000000-0000-4000-8000-000000000000.jpg";

    beforeEach(() => {
        mockValidMoldedProducts();
        mockedFindById.mockResolvedValue(createEditRecord({ imageKey: OLD_KEY }));
        mockedUpdate.mockResolvedValue("updated");
        mockedExistsByImageKey.mockResolvedValue(false);
    });

    it("画像を選ばずに編集したら、imageKey を渡さず既存の画像を残す(確認も削除もしない)", async () => {
        const storage = useFakeStorage();

        await SettingService.update("user-1", "setting-1", createInput({ imageKey: null }));

        expect(mockedUpdate.mock.calls[0][2]).not.toHaveProperty("imageKey");
        expect(storage.inspect).not.toHaveBeenCalled();
        expect(mockedExistsByImageKey).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("新しい画像を選んだら、確認してから imageKey を差し替え、成功後に古い画像を削除する", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());

        await SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY }));

        expect(storage.inspect).toHaveBeenCalledWith(PNG_KEY);
        expect(mockedUpdate.mock.calls[0][2]).toMatchObject({ imageKey: PNG_KEY });
        expect(mockedExistsByImageKey).toHaveBeenCalledWith(OLD_KEY);
        expect(storage.delete).toHaveBeenCalledTimes(1);
        expect(storage.delete).toHaveBeenCalledWith(OLD_KEY);
        // 更新が終わってから古い画像を消す
        expect(mockedUpdate.mock.invocationCallOrder[0]).toBeLessThan(storage.delete.mock.invocationCallOrder[0]);
    });

    it("元の画像が無ければ、差し替えても削除はしない", async () => {
        mockedFindById.mockResolvedValue(createEditRecord({ imageKey: null }));
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());

        await SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY }));

        expect(mockedUpdate.mock.calls[0][2]).toMatchObject({ imageKey: PNG_KEY });
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("現在の画像と同じキーが送られてきたら、差し替えとして扱わない(確認・更新・削除しない)", async () => {
        const storage = useFakeStorage();

        await SettingService.update("user-1", "setting-1", createInput({ imageKey: OLD_KEY }));

        expect(storage.inspect).not.toHaveBeenCalled();
        expect(mockedUpdate.mock.calls[0][2]).not.toHaveProperty("imageKey");
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("古い画像がほかのセッティングから参照されていれば削除しない", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        mockedExistsByImageKey.mockResolvedValue(true);

        await SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY }));

        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("古い画像の削除に失敗しても、ログだけ残して更新は成功扱いにする", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        storage.delete.mockRejectedValue(new Error("S3 エラー"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(
            SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY }))
        ).resolves.toBeUndefined();
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("新しい画像の確認に失敗したら SettingImageError を throw し、更新も削除もしない", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(null);

        const error = await SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY })).catch(
            (e: unknown) => e
        );

        expect(error).toBeInstanceOf(SettingImageError);
        expect(mockedUpdate).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("他人の prefix のキーなら SettingImageError(S3 は見ない)", async () => {
        const storage = useFakeStorage();

        const error = await SettingService.update(
            "user-1",
            "setting-1",
            createInput({ imageKey: "settings/user-2/123e4567-e89b-42d3-a456-426614174000.png" })
        ).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(SettingImageError);
        expect(storage.inspect).not.toHaveBeenCalled();
        expect(mockedUpdate).not.toHaveBeenCalled();
    });

    it("imageKey がすでに使われていた(image_key_taken)なら SettingImageError にし、新しい画像も古い画像も削除しない", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        mockedUpdate.mockResolvedValue("image_key_taken");

        const error = await SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY })).catch(
            (e: unknown) => e
        );

        expect(error).toBeInstanceOf(SettingImageError);
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("更新時に対象が消えていた(not_found)なら SettingNotFoundError にし、古い画像は削除しない", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        mockedUpdate.mockResolvedValue("not_found");

        await expect(
            SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY }))
        ).rejects.toBeInstanceOf(SettingNotFoundError);
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("更新に失敗したら、新しい画像を(参照されていなければ)削除して元のエラーを throw し、古い画像は残す", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        const dbError = new Error("DB接続エラー");
        mockedUpdate.mockRejectedValue(dbError);

        await expect(
            SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY }))
        ).rejects.toBe(dbError);
        expect(mockedExistsByImageKey).toHaveBeenCalledWith(PNG_KEY);
        expect(storage.delete).toHaveBeenCalledTimes(1);
        expect(storage.delete).toHaveBeenCalledWith(PNG_KEY);
    });

    it("更新に失敗しても、新しい画像が参照されていれば(P2002 の判定が外れた場合など)削除しない", async () => {
        const storage = useFakeStorage();
        storage.inspect.mockResolvedValue(inspection());
        mockedUpdate.mockRejectedValue(new Error("Unique constraint failed on the setting_imageKey_key"));
        mockedExistsByImageKey.mockResolvedValue(true);

        await expect(
            SettingService.update("user-1", "setting-1", createInput({ imageKey: PNG_KEY }))
        ).rejects.toThrow("Unique constraint failed");
        expect(storage.delete).not.toHaveBeenCalled();
    });
});
