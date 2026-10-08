import { FlightRepository } from "@/server/repositories/flight.repository";
import { FlightListItemDto } from "@/server/dto/flight.dto";
import { CreateFlightInput } from "@/schemas/flight";
import { ValidationError } from "@/server/errors/validation.error";

export const FlightService = {
  /**
   * セッティング登録フォームのCombobox用に全件を返す。
   * 商品はSeedでのみ管理していて件数が増えないため、絞り込みは画面側で行う。
   */
  async listAll(): Promise<FlightListItemDto[]> {
    const flights = await FlightRepository.findAll();

    return flights.map((flight) => ({
      id: flight.id,
      name: flight.name,
      price: flight.price,
      flightType: flight.flightType,
    }));
  },

  // Seed専用。APIからは公開しない。
  async create(data: CreateFlightInput) {
    const shaftLength = data.shaftLength ?? null;

    // シャフト一体型は長さ違いを別商品として扱うため、長さが必須
    if (data.flightType === "SHAFT_INTEGRATED" && shaftLength === null) {
      throw new ValidationError("シャフト一体型フライトにはシャフトの長さが必要です");
    }
    if (data.flightType === "MOLDED" && shaftLength !== null) {
      throw new ValidationError("成型フライトにはシャフトの長さを指定できません");
    }

    return FlightRepository.create({ ...data, shaftLength });
  },
};
