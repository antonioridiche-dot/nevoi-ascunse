import { describe, expect, it } from "vitest";
import { orderedWeightlossUpsells, weightlossProducts } from "./weightlossProducts";

describe("Weightloss direct product routes", () => {
  it("keeps the source product sequence under the direct route base", () => {
    expect(weightlossProducts.bucatarie.route).toBe("/weightloss");
    expect(orderedWeightlossUpsells.map((slug) => weightlossProducts[slug].route)).toEqual([
      "/weightloss/oferta/retete",
      "/weightloss/oferta/miscare",
      "/weightloss/oferta/longevitate",
    ]);
  });
});
