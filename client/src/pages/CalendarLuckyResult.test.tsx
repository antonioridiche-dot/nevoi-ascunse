import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { describe, expect, it } from "vitest";
import { trpc } from "@/lib/trpc";
import { CalendarLuckyResult } from "./CalendarLuckyResult";

const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "http://localhost/api/trpc", transformer: superjson })] });

describe("CalendarLuckyResult", () => {
  it("afișează previzualizarea personală, reperele sigilate și alegerea de pachet", () => {
    const html = renderToStaticMarkup(<trpc.Provider client={trpcClient} queryClient={new QueryClient()}><QueryClientProvider client={new QueryClient()}><CalendarLuckyResult visitorId="calendar-test-visitor" details={{ name: "Andreea", email: "andreea@example.com", month: 3, day: 21, year: 2000, zodiac: { name: "Berbec", glyph: "♈" } }} /></QueryClientProvider></trpc.Provider>);
    expect(html).toContain("Andreea — harta ta are 3 repere pentru tine.");
    expect(html).toContain("♈ Berbec · NUMĂR PERSONAL 8");
    expect(html).toContain("FERSTRELE TALE DE TIMING — URMĂTOARELE 90 DE ZILE");
    expect(html).toContain("RESTUL CALENDARULUI — SIGILAT");
    expect(html).toContain("DESCHIDE CALENDARUL COMPLET");
  });
});
