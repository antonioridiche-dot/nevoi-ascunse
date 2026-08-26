import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { renderToStaticMarkup } from "react-dom/server";
import superjson from "superjson";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { trpc } from "@/lib/trpc";
import RelatiiOriginalThankYou from "./RelatiiOriginalThankYou";

describe("Relații thank-you coaching application", () => {
  it("retains the source form and the scoped data-use notice", () => {
    const client = trpc.createClient({ links: [httpBatchLink({ url: "http://localhost/api/trpc", transformer: superjson })] });
    const html = renderToStaticMarkup(<trpc.Provider client={client} queryClient={new QueryClient()}><QueryClientProvider client={new QueryClient()}><Router ssrPath="/relatii/multumesc"><RelatiiOriginalThankYou /></Router></QueryClientProvider></trpc.Provider>);
    expect(html).toContain("Aplică pentru coaching relațional");
    expect(html).toContain('name="context"');
    expect(html).toContain("exclusiv pentru a analiza cererea ta de coaching");
  });
});
