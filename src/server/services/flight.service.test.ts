import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Flight } from "@prisma/client";
import { FlightService } from "@/server/services/flight.service";
import { FlightRepository } from "@/server/repositories/flight.repository";
import { CreateFlightInput } from "@/schemas/flight";
import { ValidationError } from "@/server/errors/validation.error";

vi.mock("@/server/repositories/flight.repository", () => ({
    FlightRepository: {
        findAll: vi.fn(),
        create: vi.fn(),
    },
}));

const mockedFindAll = vi.mocked(FlightRepository.findAll);
const mockedCreate = vi.mocked(FlightRepository.create);

function createMockFlight(overrides: Partial<Flight> = {}): Flight {
    return {
        id: "flight-1",
        name: "テストフライト",
        maker: "テストメーカー",
        price: 550,
        imageUrl: "https://example.com/flight.png",
        hiveUrl: "https://example.com/hive",
        flightType: "MOLDED",
        shaftLength: null,
        flightShape: "シェイプ",
        flightSystem: "UNIVERSAL",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        ...overrides,
    };
}

function createInput(overrides: Partial<CreateFlightInput> = {}): CreateFlightInput {
    return {
        name: "テストフライト",
        maker: "テストメーカー",
        price: 550,
        imageUrl: "https://example.com/flight.png",
        flightType: "MOLDED",
        flightShape: "シェイプ",
        flightSystem: "UNIVERSAL",
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("FlightService.listAll", () => {
    it("Repositoryの全件取得を呼び、DTOの形に変換された結果を返す", async () => {
        mockedFindAll.mockResolvedValue([
            createMockFlight({ id: "flight-1", name: "テストフライトA", price: 550 }),
            createMockFlight({
                id: "flight-2",
                name: "テスト一体型フライト 27.5mm",
                price: 1430,
                flightType: "SHAFT_INTEGRATED",
                shaftLength: "27.5mm",
                flightSystem: null,
            }),
        ]);

        const result = await FlightService.listAll();

        expect(mockedFindAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            { id: "flight-1", name: "テストフライトA", price: 550, flightType: "MOLDED" },
            {
                id: "flight-2",
                name: "テスト一体型フライト 27.5mm",
                price: 1430,
                flightType: "SHAFT_INTEGRATED",
            },
        ]);
    });

    it("フライトが0件の場合は空配列を返す", async () => {
        mockedFindAll.mockResolvedValue([]);

        const result = await FlightService.listAll();

        expect(result).toEqual([]);
    });

    it("結果にmaker/shaftLength等の余分なフィールドが含まれない", async () => {
        mockedFindAll.mockResolvedValue([createMockFlight()]);

        const result = await FlightService.listAll();

        expect(Object.keys(result[0]).sort()).toEqual(
            ["id", "name", "price", "flightType"].sort()
        );
    });
});

describe("FlightService.create", () => {
    it("成型フライトはshaftLengthをnullにして登録する", async () => {
        await FlightService.create(createInput({ flightType: "MOLDED" }));

        expect(mockedCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                flightType: "MOLDED",
                shaftLength: null,
                flightSystem: "UNIVERSAL",
            })
        );
    });

    it("シャフト一体型フライトはshaftLengthを含めて登録する", async () => {
        await FlightService.create(
            createInput({
                flightType: "SHAFT_INTEGRATED",
                shaftLength: "27.5mm",
                flightSystem: null,
            })
        );

        expect(mockedCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                flightType: "SHAFT_INTEGRATED",
                shaftLength: "27.5mm",
                flightSystem: null,
            })
        );
    });

    it("シャフト一体型フライトでshaftLengthが無い場合はValidationErrorを投げる", async () => {
        await expect(
            FlightService.create(
                createInput({ flightType: "SHAFT_INTEGRATED", flightSystem: null })
            )
        ).rejects.toThrow(ValidationError);
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it("成型フライトでshaftLengthが指定された場合はValidationErrorを投げる", async () => {
        await expect(
            FlightService.create(createInput({ flightType: "MOLDED", shaftLength: "27.5mm" }))
        ).rejects.toThrow(ValidationError);
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it("シャフト一体型フライトでflightSystemが省略された場合はnullにして登録する", async () => {
        const input = createInput({ flightType: "SHAFT_INTEGRATED", shaftLength: "27.5mm" });
        delete input.flightSystem;

        await FlightService.create(input);

        expect(mockedCreate).toHaveBeenCalledWith(
            expect.objectContaining({ flightType: "SHAFT_INTEGRATED", flightSystem: null })
        );
    });

    it("シャフト一体型フライトでflightSystemが指定された場合はValidationErrorを投げる", async () => {
        await expect(
            FlightService.create(
                createInput({
                    flightType: "SHAFT_INTEGRATED",
                    shaftLength: "27.5mm",
                    flightSystem: "FIT",
                })
            )
        ).rejects.toThrow(ValidationError);
        expect(mockedCreate).not.toHaveBeenCalled();
    });

    it("成型フライトでflightSystemが無い場合はValidationErrorを投げる", async () => {
        await expect(
            FlightService.create(createInput({ flightType: "MOLDED", flightSystem: null }))
        ).rejects.toThrow(ValidationError);
        expect(mockedCreate).not.toHaveBeenCalled();
    });
});
