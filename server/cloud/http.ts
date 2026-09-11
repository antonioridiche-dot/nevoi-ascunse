import type { D1Database, R2Bucket, Fetcher } from "@cloudflare/workers-types";

/** Worker environment: bindings + vars. Populated by wrangler.jsonc. */
export type Env = {
  DB: D1Database;
  BOOKS: R2Bucket;
  ASSETS?: Fetcher;
  JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  ADMIN_SECRET?: string;
  VITE_FRONTEND_URL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  CRON_SECRET?: string;
  // Plati automate manuale (optiune, vezi server/payout/autoProviders.ts)
  WISE_API_TOKEN?: string;
  WISE_PROFILE_ID?: string;
  REVOLUT_API_TOKEN?: string;
  REVOLUT_ACCOUNT_ID?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_MODE?: string;
  NODE_ENV?: string;
};

export type Handler = (request: Request, env: Env) => Promise<Response> | Response;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function fail(status: number, message: string): Response {
  return json({ error: message }, status);
}

export async function readJson(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function parseCookies(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = request.headers.get("cookie");
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "";
}

export function isSecure(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  return proto === "https" || (proto?.includes("https") ?? false) || request.url.startsWith("https");
}

/** Expresie-echivalent: url pathname (fara query). */
export function pathOf(request: Request): string {
  return new URL(request.url).pathname;
}