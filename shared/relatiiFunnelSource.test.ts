import { describe, expect, it } from "vitest";
import { MAIN_PRODUCT_POST_PAYMENT_ROUTE, OFFERS } from "../client/src/flows/relatiiFunnelSource";

describe("Relații funnel routes", () => {
  it("keeps every post-payment transition under the consolidated route base", () => {
    expect(MAIN_PRODUCT_POST_PAYMENT_ROUTE).toMatch(/^\/oferte\/relatii\//);

    Object.values(OFFERS).forEach((offer) => {
      expect(offer.acceptTo).toMatch(/^\/oferte\/relatii\//);
      expect(offer.declineTo).toMatch(/^\/oferte\/relatii\//);
    });
  });
});
