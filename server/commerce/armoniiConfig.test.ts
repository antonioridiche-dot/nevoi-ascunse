import { describe, expect, it } from "vitest";
import { ARMONII_DOWNLOAD_WINDOW_HOURS, ARMONII_PRODUCTS } from "./armoniiConfig";

describe("contract Armonii & Bine", () => {
  it("păstrează pachetul principal și upsell-ul sursă în RON", () => {
    expect(ARMONII_PRODUCTS["pachet-armonie"]).toMatchObject({ priceCents: 7900, currency: "ron", kind: "main" });
    expect(ARMONII_PRODUCTS["ritual-aprofundare"]).toMatchObject({ priceCents: 2900, currency: "ron", kind: "upsell" });
    expect(ARMONII_DOWNLOAD_WINDOW_HOURS).toBe(72);
  });
});
