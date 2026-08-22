import { describe, expect, it } from "vitest";
import { WEIGHTLOSS_PRODUCTS, isWeightlossProduct } from "./weightlossService";

describe("Weightloss source catalogue", () => {
  it("păstrează produsele și prețurile din sursa principală", () => {
    expect(WEIGHTLOSS_PRODUCTS.bucatarie.price).toBe(19700);
    expect(WEIGHTLOSS_PRODUCTS.retete.price).toBe(7900);
    expect(isWeightlossProduct("longevitate")).toBe(true);
    expect(isWeightlossProduct("invalid")).toBe(false);
  });
});
