import { describe, expect, it } from "vitest";
import { PBC_PRODUCT_CATALOG, pbcRequestOrigin } from "./pbcService";

describe("Prieteni cu beneficii checkout catalog", () => {
  it("păstrează produsele și prețurile sursei pentru Stripe Checkout", () => {
    expect(PBC_PRODUCT_CATALOG.frontEnd.amountLei).toBe(47);
    expect(PBC_PRODUCT_CATALOG.upsellOne.amountLei).toBe(147);
    expect(PBC_PRODUCT_CATALOG.downsell.amountLei).toBe(73);
    expect(PBC_PRODUCT_CATALOG.upsellTwo.amountLei).toBe(197);
  });

  it("folosește origin-ul cererii sau hostul curent pentru returnarea Stripe Checkout", () => {
    expect(pbcRequestOrigin({ origin: "https://preview.example/", host: "ignored.example", protocol: "https" })).toBe("https://preview.example");
    expect(pbcRequestOrigin({ host: "localhost:3000", protocol: "http" })).toBe("http://localhost:3000");
  });
});
