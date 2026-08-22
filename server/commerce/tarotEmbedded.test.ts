import { describe, expect, it } from "vitest";
import { TAROT_EMBEDDED_PRICES } from "./tarotService";

describe("Tarot embedded checkout", () => {
  it("păstrează prețurile de bun venit și de ieșire din fluxul sursă", () => {
    expect(TAROT_EMBEDDED_PRICES.ron).toEqual({ welcome33: 6700, exit20: 4700 });
    expect(TAROT_EMBEDDED_PRICES.eur).toEqual({ welcome33: 1340, exit20: 940 });
  });

  it("oferă patru monede pentru checkout-ul direct în pagină", () => {
    expect(Object.keys(TAROT_EMBEDDED_PRICES)).toEqual(["ron", "eur", "gbp", "usd"]);
  });
});
