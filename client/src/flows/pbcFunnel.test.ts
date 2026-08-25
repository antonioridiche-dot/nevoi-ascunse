import { describe, expect, it } from "vitest";
import { initialPbcFunnelState, pbcOrderTotalLei, pbcRouteForStep, transitionPbcFunnel } from "./pbcFunnel";

describe("Prieteni cu beneficii funnel", () => {
  it("păstrează ramura originală către downsell și checkout", () => {
    const first = transitionPbcFunnel(initialPbcFunnelState, "start");
    const downsell = transitionPbcFunnel(first, "declineUpsellOne");
    const final = transitionPbcFunnel(transitionPbcFunnel(downsell, "acceptDownsell"), "declineUpsellTwo");
    expect(final).toEqual({ step: "checkout", products: ["frontEnd", "downsell"] });
    expect(pbcOrderTotalLei(final)).toBe(120);
  });

  it("aplică prefixul direct fără să schimbe rutele interne", () => {
    expect(pbcRouteForStep("upsellOne")).toBe("/prieteni-cu-beneficii/oferta-speciala");
    expect(pbcRouteForStep("checkout")).toBe("/prieteni-cu-beneficii/checkout");
  });
});
