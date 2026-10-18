import type { ShaftListItemDto } from "@/server/dto/shaft.dto";
import type { FlightListItemDto } from "@/server/dto/flight.dto";

type FlightForShaft = Pick<FlightListItemDto, "flightType" | "flightSystem">;

// シャフト一体型フライトか。一体型はシャフト部分ごと交換するため、シャフトを組み合わせない
export function isShaftIntegrated(flight: FlightForShaft | undefined): boolean {
  return flight?.flightType === "SHAFT_INTEGRATED";
}

/**
 * 選んだフライトと組み合わせられるシャフトを返す。
 * フライト未選択なら全件。一体型、または規格(flightSystem)を持たないフライトなら空配列。
 * それ以外は規格が一致するシャフトだけを返す。
 * Service の規格一致チェック(assertValidProducts)と結果が揃うようにしているが、実装は別なので、
 * ルールを変えるときは両方を直す
 */
export function filterShaftsByFlight<T extends Pick<ShaftListItemDto, "flightSystem">>(
  shafts: T[],
  flight: FlightForShaft | undefined
): T[] {
  if (!flight) {
    return shafts;
  }
  if (isShaftIntegrated(flight) || flight.flightSystem === null) {
    return [];
  }
  return shafts.filter((shaft) => shaft.flightSystem === flight.flightSystem);
}
