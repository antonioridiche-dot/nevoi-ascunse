import { getDb } from "../db";
import { contacts, orders, products } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import {
  json,
  fail,
  readJson,
  parseCookies,
  clientIp,
  isSecure,
  type Env,
  type Handler,
} from "./http";

/**
 * Personal library access — NO password, email-only:
 *  - the email link contains a signed JWT (?t=...) that logs the buyer in
 *    automatically on first use,
 *  - after that an httpOnly cookie keeps them logged in on the same browser/IP,
 *  - the token/cookie is bound to the first-seen IP, so forwarding the link to
 *    other people does NOT work (different IP → rejected).
 *
 * Cloudflare Worker port of manus-app/server/libraryRouter.ts plus the protected
 * GET /api/download/:slug route from manus-app/server/_core/index.ts.
 * PDFs are served from the BOOKS R2 bucket (key = products.fileKey) instead of
 * data/books/<fileKey> on disk.
 */

export const LIB_COOKIE = "tvii_library";

/** Cookie de sesiune: 30 de zile, legata de IP-ul care a facut achizitia. */
const LIBRARY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LIBRARY_MAX_AGE_SECONDS = Math.floor(LIBRARY_TTL_MS / 1000);
/**
 * Linkul magic din email: valabil 24 de ore.
 * 15 minute erau prea putin — cine deschide emailul dupa o ora ajungea la un link
 * mort. Ramane sigur pentru ca tokenul e legat de IP-ul care l-a cerut.
 */
const LIBRARY_LINK_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Secret resolution priority: env.JWT_SECRET (binding) first, then
 * process.env.JWT_SECRET (nodejs_compat vars), then the dev fallback.
 * The helpers (sign/verify) have no env parameter, so handlers remember the
 * binding secret on first use; standalone calls still work via process.env.
 */
let envJwtSecret: string | null = null;

export function rememberJwtSecret(env: Env): void {
  if (env.JWT_SECRET) envJwtSecret = env.JWT_SECRET;
}

function secretKey(): Uint8Array {
  const fromProcess =
    typeof process !== "undefined" && process.env && process.env.JWT_SECRET
      ? process.env.JWT_SECRET
      : null;
  const secret = envJwtSecret || fromProcess || "tvii-library-dev-secret";
  return new TextEncoder().encode(secret);
}

type LibrarySession = { contactId: number; email: string; ip: string };

export async function signLibraryToken(
  contactId: number,
  email: string,
  ip: string,
  ttlMs: number = LIBRARY_TTL_MS,
): Promise<string> {
  return new SignJWT({ contactId, email, ip })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ttlMs) / 1000))
    .sign(secretKey());
}

/** Compara IP-uri: exact sau acelasi prefix de retea (IP dinamic = acelasi /24 IPv4 sau /48 IPv6). */
function ipMatches(tokenIp: string, ip: string, mode: "exact" | "prefix"): boolean {
  if (!tokenIp || !ip) return true;
  if (tokenIp === ip) return true;
  if (mode === "exact") return false;
  const a = tokenIp.split(".");
  const b = ip.split(".");
  if (a.length === 4 && b.length === 4) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  const a6 = tokenIp.split(":");
  const b6 = ip.split(":");
  if (a6.length > 1 && b6.length > 1) {
    return a6[0] === b6[0] && a6[1] === b6[1] && a6[2] === b6[2];
  }
  return false;
}

/**
 * Verifies the token signature/expiry and enforces the IP binding. Returns null on any failure.
 * mode "exact" (recomandat pentru linkurile ?t=) sau "prefix" (pentru cookie — utilizatorii cu
 * IP dinamic raman conectati, dar un alt utilizator de pe alta retea tot nu poate folosi cookie-ul).
 */
export async function verifyLibToken(
  token: string | null | undefined,
  ip: string,
  mode: "exact" | "prefix" = "exact",
): Promise<LibrarySession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const contactId = Number(payload.contactId);
    const email = typeof payload.email === "string" ? payload.email : "";
    const tokenIp = typeof payload.ip === "string" ? payload.ip : "";
    if (!contactId || !email) return null;
    if (!ipMatches(tokenIp, ip, mode)) return null;
    return { contactId, email, ip: tokenIp };
  } catch {
    return null;
  }
}

export function getLibIp(request: Request): string {
  return clientIp(request);
}

export function parseLibCookie(request: Request): string | null {
  return parseCookies(request)[LIB_COOKIE] ?? null;
}

/** Set-Cookie value for the library cookie (httpOnly, path=/, SameSite=Lax, Secure on https). */
export function libraryCookieHeader(token: string, request: Request): string {
  const secure = isSecure(request) ? "; Secure" : "";
  // An empty token produces an expiring Max-Age=0 cookie (logout/clear).
  const maxAge = token ? LIBRARY_MAX_AGE_SECONDS : 0;
  return `${LIB_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}

/**
 * POST /api/library/link — acces DOAR prin email verificat.
 * Protecții:
 *  - răspunsul NU conține niciodată tokenul (nu poate fi „pescuit” de pe alt IP);
 *  - linkul merge EXCLUSIV pe emailul cu care s-a cumpărat;
 *  - tokenul din link expiră în 24 de ore și e legat de IP-ul care l-a cerut;
 *  - fără achiziție completă nu se trimite nimic (răspuns identic, ca să nu
 *    poți verifica dacă un email a cumpărat sau nu).
 */
export const libraryLink: Handler = async (request, env) => {
  try {
    rememberJwtSecret(env);
    const body = await readJson(request);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email.includes("@") || !email.includes(".")) {
      return json({ ok: true, sent: true });
    }
    const db = await getDb();
    if (!db) return fail(500, "Serviciu indisponibil momentan.");

    const [contact] = await db.select().from(contacts).where(eq(contacts.email, email)).limit(1);
    const purchase = contact
      ? await db.select().from(orders)
          .where(and(eq(orders.contactId, contact.id), eq(orders.status, "completed")))
          .limit(1)
      : [];

    // Răspuns identic indiferent dacă emailul există/cumpărător sau nu.
    if (!contact || !purchase.length) return json({ ok: true, sent: true });

    // Trimitem linkul magic DOAR pe emailul cumpărătorului.
    const apiKey = env.RESEND_API_KEY || (typeof process !== "undefined" ? process.env.RESEND_API_KEY : "") || "";
    if (!apiKey) {
      console.warn("[Library] link requested but RESEND_API_KEY not set");
      return fail(500, "Trimiterea linkului nu este disponibilă momentan. Scrie-ne la anca@pestedespartire.ro.");
    }

    const origin = env.VITE_FRONTEND_URL || new URL(request.url).origin;
    const path = typeof body?.path === "string" && body.path.startsWith("/") ? body.path : "/barbati/achizitii";
    const token = await signLibraryToken(contact.id, email, getLibIp(request), LIBRARY_LINK_TTL_MS);
    const link = origin.replace(/\/$/, "") + path + "?t=" + encodeURIComponent(token);
    const q = String.fromCharCode(34);

    const payload = {
      from: "Cristina de la Peste Despartire <anca@comenzi.tevreauinapoi.ro>",
      reply_to: ["anca@pestedespartire.ro"],
      to: [email],
      subject: "Acces la Materiale Cumpărate — pestedespartire.ro",
      html: [
        "<!DOCTYPE html><html><body style=" + q + "font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;padding:24px;" + q + ">",
        "<div style=" + q + "max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5;" + q + ">",
        "<h2 style=" + q + "margin-top:0;color:#1b2d4f;" + q + ">Materialele tale cumpărate</h2>",
        "<p style=" + q + "color:#444;font-size:15px;line-height:1.6;" + q + ">Bună" + (contact.firstName ? ", " + contact.firstName : "") + "! Apasă butonul de mai jos ca să deschizi materialele pe care le-ai cumpărat de la brand-ul Peste Despărțire. Citești direct în browser, fără descărcare obligatorie.</p>",
        "<p style=" + q + "text-align:center;margin:28px 0;" + q + "><a href=" + q + link + q + " style=" + q + "background:#1b2d4f;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold;display:inline-block;" + q + ">Deschide Materialele Cumpărate →</a></p>",
        "<p style=" + q + "color:#888;font-size:12px;line-height:1.5;word-break:break-all;" + q + ">Dacă butonul nu se deschide, copiază linkul de aici:<br>" + link + "</p>",
        "<p style=" + q + "color:#888;font-size:12px;line-height:1.5;" + q + ">Linkul este personal și expiră în 24 de ore. Dacă nu ai cerut tu acest email, poți să-l ignori.</p>",
        "</div></body></html>",
      ].join(""),
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      console.error("[Library] resend error:", resp.status, await resp.text());
      return fail(500, "Nu am putut trimite linkul acum. Încearcă din nou peste câteva minute.");
    }
    return json({ ok: true, sent: true });
  } catch (err) {
    console.error("[Library] link error:", err instanceof Error ? err.message : err);
    return fail(500, "Eroare internă.");
  }
};

/**
 * Set-Cookie pentru cumpărător, emis chiar de server DUPĂ plata confirmată
 * (nu poate fi obținut decât din sesiunea care a plătit). Folosit de stripe.ts.
 */
export async function libraryCookieForContact(
  env: Env,
  request: Request,
  contactId: number,
): Promise<string | null> {
  try {
    rememberJwtSecret(env);
    const db = await getDb();
    if (!db) return null;
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!contact || !contact.email) return null;
    const token = await signLibraryToken(contact.id, contact.email, getLibIp(request));
    return libraryCookieHeader(token, request);
  } catch {
    return null;
  }
}

/**
 * POST /api/library/token — emite un token PROASPAT (24 h, legat de IP) pentru
 * sesiunea deja autentificata, folosit la deschiderea PDF-urilor intr-un tab nou.
 * Fara sesiune valida nu se returneaza nimic.
 */
export const libraryToken: Handler = async (request, env) => {
  try {
    rememberJwtSecret(env);
    const ip = getLibIp(request);
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("t");
    const t = (typeof queryToken === "string" ? queryToken : undefined) || parseLibCookie(request);
    const session = await verifyLibToken(t, ip, typeof queryToken === "string" ? "exact" : "prefix");
    if (!session) return fail(401, "unauthorized");
    const db = await getDb();
    if (!db) return fail(500, "Serviciu indisponibil momentan.");
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, session.contactId)).limit(1);
    if (!contact || !contact.email) return fail(401, "unauthorized");
    const fresh = await signLibraryToken(contact.id, contact.email, ip, LIBRARY_LINK_TTL_MS);
    return json({ ok: true, token: fresh });
  } catch (err) {
    console.error("[Library] token error:", err instanceof Error ? err.message : err);
    return fail(500, "Eroare internă.");
  }
};

/**
 * GET /api/library/me — returns the buyer's library (books + what they still
 * haven't bought) using the cookie or ?t= token. Refreshes the cookie so the
 * session stays alive.
 */
export const libraryMe: Handler = async (request, env) => {
  try {
    rememberJwtSecret(env);
    const ip = getLibIp(request);
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("t");
    const token = (typeof queryToken === "string" ? queryToken : undefined) || parseLibCookie(request);
    const session = await verifyLibToken(token, ip, typeof queryToken === "string" ? "exact" : "prefix");
    if (!session) return fail(401, "unauthorized");

    const db = await getDb();
    if (!db) return fail(500, "Serviciu indisponibil momentan.");

    const [contact] = await db.select().from(contacts).where(eq(contacts.id, session.contactId)).limit(1);
    if (!contact) return fail(401, "unauthorized");

    const bought = await db.select({
      productId: orders.productId,
    }).from(orders)
      .where(and(eq(orders.contactId, contact.id), eq(orders.status, "completed")));

    const productIds = Array.from(
      new Set(
        bought
          .map((o) => o.productId)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    );
    const allProducts = await db.select().from(products);

    // Resolve slugs for the products the contact bought.
    const productsById = new Map(allProducts.map((p) => [p.id, p]));
    const ownedSlugs = new Set<string>();
    for (const pid of productIds) {
      const p = productsById.get(pid);
      if (p) ownedSlugs.add(p.slug);
    }

    const owned = Array.from(ownedSlugs);
    const hasCoaching = owned.some((s) => s === "sustinere-barbati" || s === "sustinere-femei");
    // Jurnalul are varianta de barbati (zero-despartiri) si de femei (zero-despartiri-femei).
    const hasJournal = owned.some((s) => s === "zero-despartiri" || s === "zero-despartiri-femei");
    const hasExtra = owned.some((s) => s.startsWith("mesaje-extra"));

    // Books to show: everything they own (ebooks only, no coaching).
    const books = allProducts
      .filter((p) => ownedSlugs.has(p.slug) && p.type !== "coaching" && p.fileKey)
      .map((p) => ({ slug: p.slug, name: p.name, fileKey: p.fileKey }));

    // Refresh the cookie so the session stays alive.
    const fresh = await signLibraryToken(contact.id, contact.email, ip);

    const res = json({
      email: contact.email,
      firstName: contact.firstName,
      gender: contact.gender ?? null,
      books,
      hasCoaching,
      hasJournal,
      hasExtra,
    });
    res.headers.set("Set-Cookie", libraryCookieHeader(fresh, request));
    return res;
  } catch (err) {
    console.error("[Library] me error:", err instanceof Error ? err.message : err);
    return fail(500, "Eroare internă.");
  }
};

/** POST /api/library/logout — clears the library cookie. */
export const libraryLogout: Handler = async (request) => {
  const res = json({ ok: true });
  res.headers.set("Set-Cookie", libraryCookieHeader("", request));
  return res;
};

/**
 * GET /api/download/:slug — protected PDF download. Identity ONLY from the
 * library session (cookie sau token ?t=, ambele legate de IP si de o achizitie
 * confirmata). Fara portita de ?email=: simpla cunoastere a unui email nu da
 * acces la PDF.
 */
export const bookDownload: Handler = async (request, env) => {
  try {
    rememberJwtSecret(env);
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 1] || "";

    const db = await getDb();
    if (!db) return fail(500, "DB unavailable");

    // Identitate doar din sesiunea de biblioteca (cookie sau ?t=), IP-bound.
    const queryToken = url.searchParams.get("t");
    const t = (typeof queryToken === "string" ? queryToken : undefined) || parseLibCookie(request);
    const session = await verifyLibToken(t, getLibIp(request), typeof queryToken === "string" ? "exact" : "prefix");
    let resolvedEmail = "";
    if (session) {
      const [c] = await db.select().from(contacts).where(eq(contacts.id, session.contactId)).limit(1);
      if (c) resolvedEmail = c.email;
    }
    if (!resolvedEmail) {
      return new Response(
        "<!doctype html><html lang=\"ro\"><meta charset=\"utf-8\"><title>Acces necesar</title>" +
        "<body style=\"font-family:Arial,sans-serif;background:#f0f3f8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0\">" +
        "<div style=\"background:#fff;border-radius:14px;padding:34px;max-width:440px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.12)\">" +
        "<div style=\"font-size:40px\">🔐</div>" +
        "<h2 style=\"color:#1b2d4f;margin:10px 0\">Intră în contul tău ca să deschizi materialele</h2>" +
        "<p style=\"color:#64748b\">Apasă pe „Accesează-ți materialele cumpărate” de pe site sau deschide linkul primit pe email (este personal și expiră în 24 de ore).</p>" +
        "<a href=\"/dashboard\" style=\"display:inline-block;background:#1b2d4f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;margin-top:8px\">Deschide Materialele Cumpărate →</a>" +
        "</div></body></html>",
        { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Verify the contact exists and has purchased this product.
    const [contact] = await db.select().from(contacts).where(eq(contacts.email, resolvedEmail)).limit(1);
    if (!contact) return fail(403, "Access denied");

    // Get the product by slug first.
    const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!product || !product.fileKey) return fail(404, "File not available");

    // Verify the purchase exists.
    const [order] = await db.select().from(orders)
      .where(and(
        eq(orders.contactId, contact.id),
        eq(orders.productId, product.id),
        eq(orders.status, "completed"),
      ))
      .limit(1);
    if (!order) return fail(403, "No purchase found");

    // Serve the PDF from R2 (key = fileKey) — inline, so it OPENS in the browser.
    const obj = await env.BOOKS.get(product.fileKey);
    if (!obj) return fail(404, "File not found on server");
    return new Response(obj.body as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${product.fileKey}"`,
      },
    });
  } catch (err) {
    console.error("[Download] Error:", err instanceof Error ? err.message : err);
    return fail(500, "Internal error");
  }
};