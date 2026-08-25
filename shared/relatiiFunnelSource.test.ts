import { describe, expect, it } from "vitest";
import { MAIN_PRODUCT_POST_PAYMENT_ROUTE, OFFERS } from "../client/src/flows/relatiiFunnelSource";

describe("Relații funnel routes", () => {
  it("keeps every post-payment transition under the direct route base", () => {
    expect(MAIN_PRODUCT_POST_PAYMENT_ROUTE).toMatch(/^\/relatii\//);

    Object.values(OFFERS).forEach((offer) => {
      expect(offer.acceptTo).toMatch(/^\/relatii\//);
      expect(offer.declineTo).toMatch(/^\/relatii\//);
    });
  });
});
