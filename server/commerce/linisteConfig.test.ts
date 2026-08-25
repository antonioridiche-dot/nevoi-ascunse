import { describe, expect, it } from "vitest";
import { LINISTE_PRODUCTS, LINISTE_SAFETY_NOTICE, linistePrice } from "./linisteConfig";

describe("contract Liniște Audio", () => {
  it("păstrează catalogul, prețurile promo și reducerea exit20 din sursă", () => {
    expect(Object.keys(LINISTE_PRODUCTS)).toEqual(["anxietate", "dispozitie-joasa", "frica", "pachet-intreg", "pauza-de-seara"]);
    expect(linistePrice("anxietate", "ron")).toBe(6700);
    expect(linistePrice("pachet-intreg", "eur")).toBe(1390);
    expect(linistePrice("anxietate", "ron", "exit20")).toBe(4700);
    expect(linistePrice("pachet-intreg", "ron", "exit20")).toBe(6900);
    expect(LINISTE_SAFETY_NOTICE).toContain("112");
  });
});
