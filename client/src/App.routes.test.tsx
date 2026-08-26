import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router, type SsrContext } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { AppRouter, CATALOG_ROUTE, directPathFromLegacyOffer, usesDirectOfferFallback } from "./App";

const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "http://localhost/api/trpc", transformer: superjson })] });

function renderRoute(path: string) {
  return renderToStaticMarkup(<trpc.Provider client={trpcClient} queryClient={new QueryClient()}><QueryClientProvider client={new QueryClient()}><Router ssrPath={path}><AppRouter /></Router></QueryClientProvider></trpc.Provider>);
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
    expect(usesDirectOfferFallback("/peste-despartire")).toBe(true);
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
    const html = renderRoute("/peste-despartire");
    expect(html).toContain("Peste despărțire");
    expect(html).toContain("flux este în curs de consolidare");
  });

  it("renders the Calendarul norocului source preview at its direct route", () => {
    const html = renderRoute("/calendarul-norocului");
    expect(html).toContain("CALENDARUL");
    expect(html).toContain("Introdu data ta");
  });

  it("renders Iubire thank-you at its direct route", () => {
    expect(renderRoute("/iubire/multumesc")).toContain("Bine ai venit în spațiul tău pentru iubire");
  });

  it("renders Iubire before the generic direct-route fallback", () => {
    expect(renderRoute("/iubire")).toContain("Deschide spațiu pentru iubirea");
  });

  it("renders Liniște Audio before the generic direct-route fallback", () => {
    expect(renderRoute("/liniste-audio")).toContain("Un spațiu sonor");
  });
});
