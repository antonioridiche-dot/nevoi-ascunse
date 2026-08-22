import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, inArray } from "drizzle-orm";
import type { Request, Response } from "express";
import { accessSessions, brands, contacts, entitlements, products } from "../../drizzle/schema";
import { getDb } from "../db";

const COOKIE_NAME = "mara_tarot_access";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function secureCookieOptions() {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/oferte/tarot", maxAge: Math.floor(TOKEN_TTL_MS / 1000) };
}

export function extractCookieValue(header: string | undefined, name: string) {
  if (!header) return undefined;
  const pair = header.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : undefined;
}

async function tarotBrand() {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "tarot")).limit(1))[0];
  if (!brand) throw new Error("Brandul Tarot nu este configurat.");
  return { db, brand };
}

export async function issueTarotAccess(contactId: number) {
  const { db, brand } = await tarotBrand();
  const rawToken = randomBytes(32).toString("base64url");
  await db.insert(accessSessions).values({ contactId, brandId: brand.id, tokenHash: hash(rawToken), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) });
  return rawToken;
}

export async function redeemTarotAccess(rawToken: string, res: Response) {
  if (!rawToken || rawToken.length < 30) throw new Error("Linkul de acces nu este valid.");
  const { db, brand } = await tarotBrand();
  const session = (await db.select().from(accessSessions).where(and(eq(accessSessions.brandId, brand.id), eq(accessSessions.tokenHash, hash(rawToken)), gt(accessSessions.expiresAt, new Date()))).limit(1))[0];
  if (!session) throw new Error("Linkul de acces a expirat sau nu mai este valid.");
  await db.update(accessSessions).set({ lastUsedAt: new Date() }).where(eq(accessSessions.id, session.id));
  res.cookie(COOKIE_NAME, rawToken, secureCookieOptions());
  return { granted: true as const };
}

export async function getTarotLibrary(req: Request) {
  const token = extractCookieValue(req.headers.cookie, COOKIE_NAME);
  if (!token) return { access: false as const, products: [] };
  const { db, brand } = await tarotBrand();
  const session = (await db.select().from(accessSessions).where(and(eq(accessSessions.brandId, brand.id), eq(accessSessions.tokenHash, hash(token)), gt(accessSessions.expiresAt, new Date()))).limit(1))[0];
  if (!session) return { access: false as const, products: [] };
  const grants = await db.select({ productId: entitlements.productId, displayName: products.displayName, description: products.description, accessMode: products.accessMode }).from(entitlements).innerJoin(products, eq(entitlements.productId, products.id)).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, session.contactId), eq(entitlements.status, "active")));
  return { access: true as const, products: grants };
}

export function clearTarotAccess(res: Response) {
  res.clearCookie(COOKIE_NAME, { ...secureCookieOptions(), maxAge: 0 });
}
