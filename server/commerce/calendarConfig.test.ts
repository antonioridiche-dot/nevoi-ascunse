import { describe, expect, it } from "vitest";
import { calendarEligiblePackages, calendarPrice } from "./calendarConfig";

describe("Calendarul norocului checkout contract", () => {
  it("păstrează pachetele și prețurile multi-monedă din sursă", () => {
    expect(calendarPrice("oneMonth", "usd")).toBe(3900);
    expect(calendarPrice("twoMonths", "eur")).toBe(5400);
    expect(calendarPrice("threeMonths", "gbp")).toBe(6800);
  });
  it("oferă doar pachetele pe care clientul nu le are", () => {
    expect(calendarEligiblePackages(["threeMonths"])).toEqual(["oneMonth", "twoMonths"]);
  });
});
