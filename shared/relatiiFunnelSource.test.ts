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

  it("păstrează cele șapte etape, prețurile și succesiunea din harta sursă", () => {
    expect(Object.entries(OFFERS).map(([route, offer]) => ({ route, price: offer.price, acceptTo: offer.acceptTo, declineTo: offer.declineTo }))).toEqual([
      { route: "conversatii-jucause", price: "97 RON", acceptTo: "/relatii/oferta/friendzone", declineTo: "/relatii/oferta/downsell-conversatii" },
      { route: "downsell-conversatii", price: "37 RON", acceptTo: "/relatii/oferta/friendzone", declineTo: "/relatii/oferta/downsell-claritate" },
      { route: "downsell-claritate", price: "49 RON", acceptTo: "/relatii/oferta/conexiune-incredere", declineTo: "/relatii/oferta/downsell-mesaj" },
      { route: "downsell-mesaj", price: "27 RON", acceptTo: "/relatii/oferta/conexiune-incredere", declineTo: "/relatii/multumesc" },
      { route: "friendzone", price: "67 RON", acceptTo: "/relatii/oferta/conexiune-incredere", declineTo: "/relatii/oferta/downsell-friendzone" },
      { route: "downsell-friendzone", price: "37 RON", acceptTo: "/relatii/oferta/conexiune-incredere", declineTo: "/relatii/oferta/conexiune-incredere" },
      { route: "conexiune-incredere", price: "29,95 RON", acceptTo: "/relatii/multumesc", declineTo: "/relatii/multumesc" },
    ]);
  });
});
