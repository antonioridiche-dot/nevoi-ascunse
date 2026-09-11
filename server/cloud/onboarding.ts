import { eq, and } from "drizzle-orm";
import { getDb, trackFunnelEvent } from "../db";
import { contacts, orders, products } from "../../drizzle/schema";
import { json, fail, readJson, type Env, type Handler } from "./http";
import {
  rememberJwtSecret,
  verifyLibToken,
  getLibIp,
  parseLibCookie,
  libraryCookieHeader,
  signLibraryToken,
} from "./library";

/**
 * Formular de onboarding pentru cumpărătorii de „Susținere Personală".
 *
 * Cumpărătorul își povestește situația (întrebări DESCHISE, diferite de quiz).
 * Răspunsurile se salvează în D1 (ca să poată fi refăcute/reeditate și trimise
 * din nou) și ajung pe emailul Ancăi (anca@pestedespartire.ro). Cristina răspunde
 * direct din email — Reply-To este chiar emailul cumpărătorului, deci firul
 * discuției continuă pe email.
 *
 * Acces: DOAR sesiunea de bibliotecă a unui contact care a cumpărat Sfaturi
 * Personalizate (coaching), prin cookie sau token ?t= legat de IP.
 */

export const COACHING_SLUGS = ["sustinere-barbati", "sustinere-femei"] as const;

type OnboardingAnswer = { q: string; a: string };

async function loadContactAndOwnership(env: Env, request: Request): Promise<{ contact: any; owns: boolean } | null> {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("t");
  const token = (typeof queryToken === "string" ? queryToken : undefined) || parseLibCookie(request);
  const session = await verifyLibToken(token, getLibIp(request), typeof queryToken === "string" ? "exact" : "prefix");
  if (!session) return null;
  const db = await getDb();
  if (!db) return null;
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, session.contactId)).limit(1);
  if (!contact) return null;
  // Coaching achizitionat (comenzi completed pe produsele de coaching)?
  const rows = await db.select({ slug: products.slug }).from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(and(eq(orders.contactId, contact.id), eq(orders.status, "completed")))
    .all();
  const owns = rows.some((r) => COACHING_SLUGS.includes(r.slug as any));
  return { contact, owns };
}

/** Escaping minim pentru textul care ajunge in email (fara HTML injection). */
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function quoteAttr(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Creeaza tabelul la prima nevoie (idempotent) — nu depinde de migrari manuale. */
async function ensureTable(env: Env): Promise<void> {
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS coaching_onboarding (" +
      "contact_id INTEGER PRIMARY KEY, answers TEXT NOT NULL, " +
      "first_sent_at INTEGER NOT NULL, last_sent_at INTEGER NOT NULL)"
    ).run();
  } catch (err) {
    console.error("[Onboarding] ensureTable error:", err instanceof Error ? err.message : err);
  }
}

/** Salveaza/actualizeaza ultimul formular trimis al contactului (raw SQL pe D1). */
async function saveSubmission(env: Env, contactId: number, answers: OnboardingAnswer[]): Promise<void> {
  await ensureTable(env);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    "INSERT INTO coaching_onboarding (contact_id, answers, first_sent_at, last_sent_at) VALUES (?, ?, ?, ?) " +
    "ON CONFLICT(contact_id) DO UPDATE SET answers = excluded.answers, last_sent_at = excluded.last_sent_at"
  ).bind(contactId, JSON.stringify(answers), now, now).run();
}

/** GET /api/library/onboarding — intoarce ultimul formular salvat (pentru edit/resend). */
export const onboardingGet: Handler = async (request, env) => {
  try {
    rememberJwtSecret(env);
    const res = await loadContactAndOwnership(env, request);
    if (!res) return fail(401, "unauthorized");
    if (!res.owns) return json({ ok: true, owns: false, submitted: false, answers: [], sentAt: null });
    await ensureTable(env);
    const row = await env.DB.prepare(
      "SELECT answers, first_sent_at AS f, last_sent_at AS l FROM coaching_onboarding WHERE contact_id = ?"
    ).bind(res.contact.id).first<{ answers: string; f: number; l: number }>();
    const parsed = row ? JSON.parse(row.answers) : [];
    return json({
      ok: true, owns: true, submitted: !!row,
      answers: Array.isArray(parsed) ? parsed : [],
      firstSentAt: row ? row.f * 1000 : null,
      lastSentAt: row ? row.l * 1000 : null,
    });
  } catch (err) {
    console.error("[Onboarding] get error:", err instanceof Error ? err.message : err);
    return fail(500, "Eroare internă.");
  }
};

/** POST /api/library/onboarding — trimite povestea catre Cristina si o salveaza. */
export const onboardingSubmit: Handler = async (request, env) => {
  try {
    rememberJwtSecret(env);
    const res = await loadContactAndOwnership(env, request);
    if (!res) return fail(401, "unauthorized");
    if (!res.owns) return fail(403, "Acest formular este disponibil după achiziția Sfaturilor Personalizate.");

    const body = await readJson(request);
    const raw = Array.isArray(body?.answers) ? (body.answers as unknown[]) : [];
    // Acceptam atat [ { q, a } ] cat si [ { question, answer } ].
    const answers: OnboardingAnswer[] = [];
    for (const item of raw) {
      const it = (item ?? {}) as Record<string, unknown>;
      const q = String(it.q ?? it.question ?? "").trim();
      const a = String(it.a ?? it.answer ?? "").trim();
      if (q && a) answers.push({ q, a });
    }
    const totalChars = answers.reduce((s, x) => s + x.a.length, 0);
    if (!answers.length || totalChars < 20) {
      return fail(400, "Scrie-ne puțin din povestea ta înainte de a trimite (minim câteva propoziții).");
    }

    await saveSubmission(env, res.contact.id, answers);

    const apiKey = env.RESEND_API_KEY || (typeof process !== "undefined" ? process.env.RESEND_API_KEY : "") || "";
    if (!apiKey) {
      console.warn("[Onboarding] RESEND_API_KEY not set — formular salvat, dar emailul nu a plecat");
      return fail(500, "Formularul a fost salvat, dar trimiterea nu este disponibilă momentan. Încearcă din nou în câteva minute.");
    }

    const buyerEmail = res.contact.email;
    const genderLabel = res.contact.gender === "female" ? "Femeie" : "Bărbat";
    const when = new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "long", timeStyle: "short" });
    const q = String.fromCharCode(34);

    const rowsHtml = answers.map((x, i) => [
      '<tr>',
      '<td style="padding:10px 14px;vertical-align:top;border-bottom:1px solid #e8e0cf;font-weight:bold;color:#1b2d4f;white-space:nowrap;font-size:14px;">' + (i + 1) + ".</td>",
      '<td style="padding:10px 14px;vertical-align:top;border-bottom:1px solid #e8e0cf;">',
      '<div style="font-weight:bold;color:#1b2d4f;font-size:15px;margin-bottom:6px;">' + esc(x.q) + "</div>",
      '<div style="white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6;">' + esc(x.a) + "</div>",
      "</td></tr>",
    ].join(""));

    const html = [
      "<!DOCTYPE html><html><body style=" + q + "font-family:Arial,Helvetica,sans-serif;background:#f5f2ea;padding:24px;margin:0;" + q + ">",
      "<div style=" + q + "max-width:640px;margin:0 auto;background:#fffdf7;border:1px solid #e5dcc4;border-radius:12px;overflow:hidden;" + q + ">",
      '<div style="background:#1b2d4f;padding:22px 26px;">',
      "<h2 style=" + q + "margin:0;color:#fff;font-size:20px;font-family:Georgia,serif;" + q + ">Formular de situație — Susținere Personală</h2>",
      "</div>",
      '<div style="padding:6px 26px 14px;">',
      '<table style="width:100%;border-collapse:collapse;margin:14px 0 4px;font-family:Arial,Helvetica,sans-serif;">',
      "<tr><td style=" + q + "padding:4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;" + q + ">Cumpărător</td><td style=" + q + "padding:4px 0;font-size:14px;color:#1a1a2e;" + q + ">" + esc(res.contact.firstName || "") + " (" + genderLabel + ")</td></tr>",
      "<tr><td style=" + q + "padding:4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;" + q + ">Email (răspunsul ajunge aici)</td><td style=" + q + "padding:4px 0;font-size:14px;" + q + "><a href=" + q + "mailto:" + quoteAttr(buyerEmail) + q + " style=" + q + "color:#1155cc;" + q + ">" + esc(buyerEmail) + "</a></td></tr>",
      "<tr><td style=" + q + "padding:4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;" + q + ">Trimis la</td><td style=" + q + "padding:4px 0;font-size:14px;color:#1a1a2e;" + q + ">" + esc(when) + "</td></tr>",
      "</table>",
      "<table style=" + q + "width:100%;border-collapse:collapse;margin-top:10px;" + q + ">" + rowsHtml + "</table>",
      '<div style="margin-top:18px;padding:14px 16px;background:#f3ecd8;border-radius:8px;font-size:13px;color:#4a3f25;line-height:1.6;">',
      "<strong>Cum răspunzi:</strong> apasă direct „Reply” — răspunsul ajunge automat pe emailul cumpărătorului de mai sus și discuția continuă acolo. Răspunde-i personal, în maximum 48 de ore.",
      "</div>",
      "</div></div></body></html>",
    ].join("");

    const payload = {
      from: "Cristina de la Peste Despartire <anca@comenzi.tevreauinapoi.ro>",
      reply_to: [buyerEmail],
      to: ["anca@pestedespartire.ro"],
      subject: "Situație client Susținere Personală — " + (res.contact.firstName ? res.contact.firstName + " (" + buyerEmail + ")" : buyerEmail),
      html,
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      console.error("[Onboarding] resend error:", resp.status, await resp.text());
      return fail(500, "Nu am putut trimite formularul acum. Încearcă din nou peste câteva minute.");
    }
    await trackFunnelEvent({ contactId: res.contact.id, event: "coaching_onboarding_submitted" as any, metadata: { answers: answers.length } });

    const sentAt = Date.now();
    // Re-emit cookie fresh (nu strică nimic) — mentine sesiunea de biblioteca activa.
    const fresh = await signLibraryToken(res.contact.id, buyerEmail, getLibIp(request));
    const out = json({ ok: true, sentAt, owns: true });
    out.headers.set("Set-Cookie", libraryCookieHeader(fresh, request));
    return out;
  } catch (err) {
    console.error("[Onboarding] submit error:", err instanceof Error ? err.message : err);
    return fail(500, "Eroare internă.");
  }
};