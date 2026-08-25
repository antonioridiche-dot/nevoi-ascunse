import { describe, expect, it } from "vitest";
import { linisteCheckoutUrl, linisteThemeUrl, normalizeLinisteEmail } from "./linisteFunnel";

describe("rute directe Liniște Audio", () => {
  it("păstrează cheile query sursă pe noile prefixe directe", () => {
    expect(normalizeLinisteEmail(" ANA@EXEMPLU.RO ")).toBe("ana@exemplu.ro");
    expect(linisteThemeUrl("anxietate", { currency: "gbp", fromQuiz: true })).toBe("/liniste-audio/anxietate?currency=gbp&quiz=1");
    expect(linisteCheckoutUrl("frica", { currency: "usd", theme: "bani", fromQuiz: true, offer: "exit20", claimCode: "exit_123" })).toBe("/liniste-audio/checkout?produs=frica&currency=usd&tema=bani&quiz=1&oferta=exit20&reducere=exit_123");
    expect(linisteCheckoutUrl("frica", { currency: "usd", tracking: { utm_source: "instagram", gclid: "123", utm_term: "x".repeat(121) } })).toBe("/liniste-audio/checkout?produs=frica&currency=usd&utm_source=instagram&gclid=123");
  });
});
