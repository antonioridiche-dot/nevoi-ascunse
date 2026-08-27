import { describe, expect, it } from "vitest";
import { ARMONII_DOWNLOAD_WINDOW_HOURS, ARMONII_PRODUCTS } from "./armoniiConfig";
import { isArmoniiPreviewAsset } from "./armoniiService";

describe("contract Armonii & Bine", () => {
  it("păstrează pachetul principal și upsell-ul sursă în RON", () => {
    expect(ARMONII_PRODUCTS["pachet-armonie"]).toMatchObject({ priceCents: 7900, currency: "ron", kind: "main" });
    expect(ARMONII_PRODUCTS["ritual-aprofundare"]).toMatchObject({ priceCents: 2900, currency: "ron", kind: "upsell" });
    expect(ARMONII_DOWNLOAD_WINDOW_HOURS).toBe(72);
  });

  it("expune ca preview numai un activ audio etichetat explicit", () => {
    expect(isArmoniiPreviewAsset({ label: "Fragment audio", mimeType: "audio/mpeg" })).toBe(true);
    expect(isArmoniiPreviewAsset({ label: "Ghidul integral", mimeType: "audio/mpeg" })).toBe(false);
    expect(isArmoniiPreviewAsset({ label: "Preview copertă", mimeType: "image/jpeg" })).toBe(false);
  });

  it("nu confundă un preview audio cu un activ de livrare", () => {
    const assets = [{ label: "Preview audio", mimeType: "audio/mpeg" }, { label: "Rugăciune audio", mimeType: "audio/mpeg" }];
    expect(assets.some(asset => !isArmoniiPreviewAsset(asset))).toBe(true);
    expect([{ label: "Fragment audio", mimeType: "audio/mpeg" }].some(asset => !isArmoniiPreviewAsset(asset))).toBe(false);
  });
});
