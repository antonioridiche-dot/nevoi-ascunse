import { desc, eq, lt } from "drizzle-orm";
import { getDb } from "./db";
import { affiliateSessions, affiliates, type Affiliate } from "../drizzle/schema";

/**
 * Sesiuni de lunga durata pentru afiliati.
 *
 * Ideea: afiliatul pune codul din email O SINGURA DATA. De acolo primeste un token
 * aleator de 256 de biti pe care browserul il tine minte, deci NU mai trebuie sa
 * puna codul la fiecare intrare in panou.
 *
 * De ce e sigur:
 *  - token-ul e generat cu crypto.getRandomValues (256 biti) — imposibil de ghicit;
 *  - in baza de date se pastreaza DOAR hash-ul SHA-256, deci o scurgere de date
 *    nu permite intrarea in conturile afiliatilor;
 *  - sesiunea expira (90 de zile) si se prelungeste doar cat timp e folosita;
 *  - "Deconectare" sterge sesiunea pe server, nu doar in browser;
 *  - maximum 10 dispozitive per afiliat, ca sa nu se adune sesiuni uitate.
 */

/** Cat timp poate sta afiliatul conectat fara sa mai puna codul. */
export const SESSION_DAYS = 90;
/** Cate dispozitive poate tine conectate simultan acelasi afiliat. */
const MAX_SESSIONS_PER_AFFILIATE = 10;

/** SHA-256 in hex. In baza de date ajunge doar hash-ul, niciodata token-ul. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Token aleator de 256 de biti (64 de caractere hex). */
function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function expiryFromNow(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Emite o sesiune noua, dupa ce codul din email a fost confirmat.
 * Curata sesiunile expirate si pastreaza cel mult MAX_SESSIONS_PER_AFFILIATE.
 */
export async function createAffiliateSession(
  affiliateId: number,
  userAgent?: string,
): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibila");

  const token = newToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = expiryFromNow();

  // Igiena: scoatem sesiunile expirate, apoi cele mai vechi peste limita.
  await db.delete(affiliateSessions).where(lt(affiliateSessions.expiresAt, new Date()));
  const existing = await db
    .select({ id: affiliateSessions.id })
    .from(affiliateSessions)
    .where(eq(affiliateSessions.affiliateId, affiliateId))
    .orderBy(desc(affiliateSessions.lastUsedAt));
  for (const old of existing.slice(MAX_SESSIONS_PER_AFFILIATE)) {
    await db.delete(affiliateSessions).where(eq(affiliateSessions.id, old.id));
  }

  await db.insert(affiliateSessions).values({
    tokenHash,
    affiliateId,
    expiresAt,
    lastUsedAt: new Date(),
    userAgent: (userAgent || "").slice(0, 200) || null,
  });

  return { token, expiresAt };
}

/**
 * Intoarce afiliatul pentru un token valid, sau null daca token-ul lipseste,
 * e falsificat, a expirat ori contul nu mai e activ.
 * Sesiunea se prelungeste la fiecare folosire, deci cine intra in panou macar
 * o data la 3 luni nu vede niciodata ecranul de conectare.
 */
export async function resolveAffiliateSession(token: string): Promise<Affiliate | null> {
  const db = await getDb();
  if (!db) return null;

  const clean = (token || "").trim();
  if (clean.length !== 64) return null;

  const tokenHash = await sha256Hex(clean);
  const rows = await db
    .select()
    .from(affiliateSessions)
    .where(eq(affiliateSessions.tokenHash, tokenHash))
    .limit(1);
  const session = rows[0];
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.delete(affiliateSessions).where(eq(affiliateSessions.id, session.id));
    return null;
  }

  const aff = await db.select().from(affiliates).where(eq(affiliates.id, session.affiliateId)).limit(1);
  if (!aff.length) {
    await db.delete(affiliateSessions).where(eq(affiliateSessions.id, session.id));
    return null;
  }
  // Cont suspendat sau inactiv = sesiunea nu mai valoreaza nimic.
  if (aff[0].status !== "active") return null;

  await db
    .update(affiliateSessions)
    .set({ lastUsedAt: new Date(), expiresAt: expiryFromNow() })
    .where(eq(affiliateSessions.id, session.id));

  return aff[0];
}

/** Deconectare: sterge sesiunea curenta. Token-ul devine inutil imediat. */
export async function revokeAffiliateSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const clean = (token || "").trim();
  if (!clean) return;
  await db.delete(affiliateSessions).where(eq(affiliateSessions.tokenHash, await sha256Hex(clean)));
}

/** Sterge toate sesiunile unui afiliat (toate dispozitivele). */
export async function revokeAllAffiliateSessions(affiliateId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(affiliateSessions).where(eq(affiliateSessions.affiliateId, affiliateId));
}
