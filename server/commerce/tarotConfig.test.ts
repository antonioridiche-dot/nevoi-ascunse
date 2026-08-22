import { describe, expect, it } from "vitest";
import { isTarotCard, TAROT_CARDS, TAROT_POST_PURCHASE_STEPS, TAROT_PRODUCTS } from "./tarotConfig";

describe("tarot commerce configuration", () => {
  it("keeps the base offer and post-purchase steps priced in bani", () => {
    expect(TAROT_PRODUCTS.tarot_guide.amountCents).toBe(5700);
    expect(TAROT_POST_PURCHASE_STEPS.map((step) => step.routeSuffix)).toEqual(["asteapta", "aproapegata", "stai"]);
  });

  it("accepts only cards from the selected Tarot deck", () => {
    expect(TAROT_CARDS).toHaveLength(8);
    expect(isTarotCard("luna")).toBe(true);
    expect(isTarotCard("o-carte-inventata")).toBe(false);
  });
});
