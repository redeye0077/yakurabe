import { describe, it, expect } from "vitest";
import { filterShaftsByFlight, isShaftIntegrated } from "@/lib/shaft-compatibility";
import type { ShaftListItemDto } from "@/server/dto/shaft.dto";

const shafts: ShaftListItemDto[] = [
  { id: "shaft-universal-1", name: "汎用シャフトA", price: 500, flightSystem: "UNIVERSAL" },
  { id: "shaft-universal-2", name: "汎用シャフトB", price: 600, flightSystem: "UNIVERSAL" },
  { id: "shaft-fit", name: "フィットシャフト", price: 800, flightSystem: "FIT" },
];

describe("filterShaftsByFlight", () => {
  it("フライト未選択なら全件を返す", () => {
    expect(filterShaftsByFlight(shafts, undefined)).toEqual(shafts);
  });

  it("一体型フライトなら空配列を返す", () => {
    expect(
      filterShaftsByFlight(shafts, { flightType: "SHAFT_INTEGRATED", flightSystem: null })
    ).toEqual([]);
  });

  it("成型フライトなら規格が一致するシャフトだけを返す", () => {
    expect(
      filterShaftsByFlight(shafts, { flightType: "MOLDED", flightSystem: "UNIVERSAL" }).map(
        (shaft) => shaft.id
      )
    ).toEqual(["shaft-universal-1", "shaft-universal-2"]);
  });

  it("成型フライトなのに規格が null なら空配列を返す", () => {
    expect(filterShaftsByFlight(shafts, { flightType: "MOLDED", flightSystem: null })).toEqual([]);
  });

  it("規格が一致するシャフトが無ければ空配列を返す", () => {
    expect(filterShaftsByFlight(shafts, { flightType: "MOLDED", flightSystem: "CLICK" })).toEqual(
      []
    );
  });
});

describe("isShaftIntegrated", () => {
  it("一体型フライトなら true を返す", () => {
    expect(isShaftIntegrated({ flightType: "SHAFT_INTEGRATED", flightSystem: null })).toBe(true);
  });

  it("成型フライトなら false を返す", () => {
    expect(isShaftIntegrated({ flightType: "MOLDED", flightSystem: "FIT" })).toBe(false);
  });

  it("フライト未選択(undefined)なら false を返す", () => {
    expect(isShaftIntegrated(undefined)).toBe(false);
  });
});
