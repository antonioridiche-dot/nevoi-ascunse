import { describe, expect, it } from "vitest";
import { VRAJI_PRODUCTS, vrajiCheckoutAmount } from "./vrajiService";

describe("Vrăji checkout contract", () => {
  it("păstrează reducerea promo și prețurile bump-urilor din sursă", () => {
    expect(vrajiCheckoutAmount("promo67", [])).toBe(6700);
    expect(vrajiCheckoutAmount("exit20", [])).toBe(4700);
    expect(vrajiCheckoutAmount("promo67", ["priority-journal", "closure-ritual"])).toBe(9198);
  });

  it("păstrează SKU-urile acordate de fluxul principal și pașii post-cumpărare", () => {
    expect(VRAJI_PRODUCTS.loveCore.sku).toBe("love-core");
    expect(VRAJI_PRODUCTS.priority.sku).toBe("priority-journal");
    expect(VRAJI_PRODUCTS.closure.sku).toBe("closure-ritual");
    expect(VRAJI_PRODUCTS.upsellOne.sku).toBe("attraction-expansion");
    expect(VRAJI_PRODUCTS.upsellTwo.sku).toBe("connection-compass");
    expect(VRAJI_PRODUCTS.downsellOne.sku).toBe("intention-audio");
  });
});
