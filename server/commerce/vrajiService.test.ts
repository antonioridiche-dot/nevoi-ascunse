import { describe, expect, it } from "vitest";
import { vrajiCheckoutAmount } from "./vrajiService";

describe("Vrăji checkout contract", () => {
  it("păstrează reducerea promo și prețurile bump-urilor din sursă", () => {
    expect(vrajiCheckoutAmount("promo67", [])).toBe(6700);
    expect(vrajiCheckoutAmount("exit20", [])).toBe(4700);
    expect(vrajiCheckoutAmount("promo67", ["priority-journal", "closure-ritual"])).toBe(9198);
  });
});
