import { describe, expect, it } from "vitest";
import { IUBIRE_PROGRAM, iubirePrice } from "./iubireConfig";

describe("contract Iubire", () => {
  it("păstrează codul automat, prețul standard și reducerea exit din sursă", () => {
    expect(IUBIRE_PROGRAM).toMatchObject({ automaticDiscountCode: "IUBIRE97", referenceAmountCents: 20000, standardAmountCents: 9700, exit20AmountCents: 7700, currency: "ron" });
    expect(iubirePrice("standard")).toBe(9700);
    expect(iubirePrice("exit20")).toBe(7700);
  });
});
