import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { renderToStaticMarkup } from "react-dom/server";
import superjson from "superjson";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { trpc } from "@/lib/trpc";
import RelatiiOriginalAffiliate from "./RelatiiOriginalAffiliate";

describe("Relații local affiliate program", () => {
  it("keeps the source signup and dashboard entry points on the direct route", () => {
    const client = trpc.createClient({ links: [httpBatchLink({ url: "http://localhost/api/trpc", transformer: superjson })] });
    const html = renderToStaticMarkup(<trpc.Provider client={client} queryClient={new QueryClient()}><QueryClientProvider client={new QueryClient()}><Router ssrPath="/relatii/afiliere"><RelatiiOriginalAffiliate /></Router></QueryClientProvider></trpc.Provider>);
    expect(html).toContain("Recomandă ce");
    expect(html).toContain("Creează contul de afiliat");
    expect(html).toContain("Dashboard");
  });
});
