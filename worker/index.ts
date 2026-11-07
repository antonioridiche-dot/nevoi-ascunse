import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { setDb } from "../server/db";
import type { Env } from "../server/cloud/http";
import { INDEX_HTML } from "./spa-html";

// Ported REST handlers (server/cloud/*)
import { stripeCreateCheckout, stripeCreatePaymentIntent, stripeConfirmOrder, stripeWebhook } from "../server/cloud/stripe";
import { libraryLink, libraryMe, libraryToken, libraryLogout, bookDownload } from "../server/cloud/library";
import { onboardingGet, onboardingSubmit } from "../server/cloud/onboarding";
import { processEmails, processPayouts, updateLeadScores, resendWebhookHandler, bootstrap } from "../server/cloud/system";
import { adminExportContacts } from "../server/cloud/adminExport";

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ---- tRPC ----
  if (path.startsWith("/api/trpc")) {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: async ({ req, resHeaders }) => createContext({ req, resHeaders }),
    });
  }

  // ---- Stripe ----
  if (path === "/api/stripe/create-checkout" && method === "POST") return stripeCreateCheckout(request, env);
  if (path === "/api/stripe/create-payment-intent" && method === "POST") return stripeCreatePaymentIntent(request, env);
  if (path === "/api/stripe/confirm-order" && method === "POST") return stripeConfirmOrder(request, env);
  if (path === "/api/stripe/webhook" && method === "POST") return stripeWebhook(request, env);

  // ---- Library ----
  if (path === "/api/library/link" && method === "POST") return libraryLink(request, env);
  if (path === "/api/library/token" && method === "POST") return libraryToken(request, env);
  if (path === "/api/library/me" && method === "GET") return libraryMe(request, env);
  if (path === "/api/library/logout" && method === "POST") return libraryLogout(request, env);
  if (path === "/api/library/onboarding" && method === "GET") return onboardingGet(request, env);
  if (path === "/api/library/onboarding" && method === "POST") return onboardingSubmit(request, env);

  // ---- Book download ----
  if (path.startsWith("/api/download/") && method === "GET") return bookDownload(request, env);

  // ---- Resend webhook ----
  if (path === "/api/resend/webhook" && method === "POST") return resendWebhookHandler(request, env);

  // ---- Admin export ----
  if (path === "/api/admin/export-contacts" && method === "GET") return adminExportContacts(request, env);

  // ---- Cron / manual triggers (optionally guarded by CRON_SECRET) ----
  const cronAllowed = (req: Request): boolean => {
    const secret = env.CRON_SECRET;
    if (!secret) return true;
    return req.headers.get("x-cron-secret") === secret;
  };
  if (path === "/api/cron/process-emails" && method === "POST" && cronAllowed(request)) return json2(await processEmails(env));
  if (path === "/api/cron/process-payouts" && method === "POST" && cronAllowed(request)) return json2(await processPayouts(env));
  if (path === "/api/cron/update-lead-scores" && method === "POST" && cronAllowed(request)) return json2(await updateLeadScores());
  if (path === "/api/bootstrap" && method === "POST" && cronAllowed(request)) return json2(await bootstrap(env));

  return new Response("Not found", { status: 404 });
}

function json2(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Maparea expresiilor cron (din wrangler.jsonc) catre task-ul pe care il ruleaza.
 * ATENTIE: controller.cron primeste EXPRESIA ("*\/5 * * * *"), nu un nume. Inainte
 * codul compara cu niste nume ("process-emails"), deci niciun task nu rula niciodata
 * — emailurile automate si transferurile Stripe automate erau moarte.
 */
const CRON_TASKS: Record<string, string> = {
  "*/5 * * * *": "toate",
  "0 * * * *": "process-payouts",
  "*/15 * * * *": "update-lead-scores",
};

function resolveCronTask(cron: string): string {
  const raw = (cron || "").trim();
  if (CRON_TASKS[raw]) return CRON_TASKS[raw];
  // Fallback: daca cineva cheama cu numele direct (ex. din teste).
  if (raw === "process-emails" || raw === "process-payouts" || raw === "update-lead-scores") return raw;
  return "";
}

async function handleScheduled(env: Env, cron: string): Promise<void> {
  const task = resolveCronTask(cron);
  if (!task) {
    console.warn("[cron] necunoscut, ignorat:", JSON.stringify(cron));
    return;
  }
  // Contul Cloudflare limiteaza numarul de declansatoare cron, asa ca site-ul
  // asta foloseste UN SINGUR cron (la fiecare 5 minute) si ruleaza toate
  // sarcinile de aici. Fara asta, platile automate sau scorurile de lead ar
  // ramane moarte fara ca nimeni sa observe.
  const acum = new Date();
  const minut = acum.getUTCMinutes();
  const isEmails = task === "toate" || task === "process-emails";
  const isPayouts = task === "process-payouts" || (task === "toate" && minut < 5);
  const isLeadScores = task === "update-lead-scores" || (task === "toate" && minut % 15 < 5);
  if (isEmails) {
    // Auto-bootstrap once so the funnel works right after first deploy.
    try {
      const seeded = await bootstrap(env);
      if (seeded.seeded) console.log("[bootstrap] seeded products + email sequences");
    } catch (err) {
      console.error("[bootstrap] failed:", err);
    }
    const result = await processEmails(env);
    console.log("[cron] process-emails:", JSON.stringify(result));
  } else if (isPayouts) {
    const result = await processPayouts(env);
    console.log("[cron] process-payouts:", JSON.stringify(result));
  } else if (isLeadScores) {
    const result = await updateLeadScores();
    console.log("[cron] update-lead-scores:", JSON.stringify(result));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    setDb(env.DB);
    const url = new URL(request.url);

    /**
     * Un singur domeniu canonic: www → apex, permanent (308). Fără asta, aceleași
     * pagini se văd pe două adrese, iar Google le numără ca duplicate.
     */
    if (url.hostname.startsWith("www.")) {
      const target = new URL(request.url);
      target.hostname = url.hostname.slice(4);
      return Response.redirect(target.toString(), 308);
    }

    // Static assets are served by the asset layer for real files.
    // SPA fallback for client-side routes (non-API GET requests).
    if (!url.pathname.startsWith("/api/") && request.method === "GET") {
      const html = INDEX_HTML || "<!doctype html><title>tevreauinapoi</title>";
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return handleApi(request, env);
  },

  async scheduled(controller: unknown, env: Env): Promise<void> {
    setDb(env.DB);
    const cron = (controller as { cron?: string })?.cron ?? "";
    await handleScheduled(env, cron);
  },
};
