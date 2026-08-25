import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router, type SsrContext } from "wouter";
import { AppRouter, CATALOG_ROUTE, directPathFromLegacyOffer, usesDirectOfferFallback } from "./App";

function renderRoute(path: string) {
  return renderToStaticMarkup(<Router ssrPath={path}><AppRouter /></Router>);
}

function redirectedRoute(path: string) {
  const ssrContext: SsrContext = {};
  renderToStaticMarkup(<Router ssrPath={path} ssrContext={ssrContext}><AppRouter /></Router>);
  return ssrContext.redirectTo;
}

describe("direct catalog routing contract", () => {
  it("reserves /oferte for the catalog", () => {
    expect(CATALOG_ROUTE).toBe("/oferte");
  });

  it("keeps a controlled direct fallback for unported offer roots", () => {
    expect(usesDirectOfferFallback("/armonii-bine")).toBe(true);
    expect(usesDirectOfferFallback("/oferte")).toBe(false);
    expect(usesDirectOfferFallback("/weightloss/comanda")).toBe(false);
  });

  it("converts legacy offer paths to their direct equivalents", () => {
    expect(directPathFromLegacyOffer("/oferte/tarot")).toBe("/tarot");
    expect(directPathFromLegacyOffer("/oferte/relatii/oferta/friendzone")).toBe("/relatii/oferta/friendzone");
  });

  it("redirects both legacy offer route patterns through the active Wouter router", () => {
    expect(redirectedRoute("/oferte/tarot")).toBe("/tarot");
    expect(redirectedRoute("/oferte/relatii/oferta/friendzone")).toBe("/relatii/oferta/friendzone");
  });

  it("renders the editorial catalog at /oferte", () => {
    expect(renderRoute("/oferte")).toContain("Alege ce");
  });

  it("renders the controlled offer fallback at an unported direct route", () => {
    const html = renderRoute("/armonii-bine");
    expect(html).toContain("Armonii &amp; Bine");
    expect(html).toContain("flux este în curs de consolidare");
  });
});
