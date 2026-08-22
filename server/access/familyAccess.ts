import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { accessSessions, brands, contacts, entitlements, products } from "../../drizzle/schema";
import { getDb } from "../db";

const ACCESS_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function familyBrand() { const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă."); const brand = (await db.select().from(brands).where(eq(brands.key, "familieprotejata")).limit(1))[0]; if (!brand) throw new Error("Brandul Familie protejată nu este configurat."); return { db, brand }; }

export async function issueFamilyAccess(contactId: number, deviceHash: string) { const { db, brand } = await familyBrand(); const accessToken = randomBytes(32).toString("hex"); await db.insert(accessSessions).values({ contactId, brandId: brand.id, tokenHash: hash(accessToken), deviceHash: hash(deviceHash), expiresAt: new Date(Date.now() + ACCESS_TTL_MS) }); return { accessToken, accessUrl: `/oferte/familieprotejata/dashboard?access=${accessToken}` }; }

export async function issueFamilyAccessForSession(sessionToken: string, email: string, deviceHash: string) { const { db, brand } = await familyBrand(); const contact = (await db.select().from(contacts).where(eq(contacts.email, email.trim().toLowerCase())).limit(1))[0]; if (!contact) throw new Error("Comanda nu a fost găsită pentru această adresă."); const entitlement = (await db.select().from(entitlements).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, contact.id), eq(entitlements.status, "active"))).limit(1))[0]; if (!entitlement) throw new Error("Nu există produse active pentru această sesiune."); return issueFamilyAccess(contact.id, deviceHash); }

export async function familyDashboard(accessToken: string, deviceHash: string) { const { db, brand } = await familyBrand(); const session = (await db.select().from(accessSessions).where(and(eq(accessSessions.brandId, brand.id), eq(accessSessions.tokenHash, hash(accessToken)), eq(accessSessions.deviceHash, hash(deviceHash)), gt(accessSessions.expiresAt, new Date()))).limit(1))[0]; if (!session) throw new Error("Linkul nu este disponibil. Cere un link nou pe e-mail."); const contact = (await db.select().from(contacts).where(eq(contacts.id, session.contactId)).limit(1))[0]; const productRows = await db.select({ productKey: products.productKey, displayName: products.displayName, description: products.description }).from(entitlements).innerJoin(products, eq(entitlements.productId, products.id)).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, session.contactId), eq(entitlements.status, "active")));
  return { email: contact?.email ?? "", products: productRows.map(product => ({ handle: product.productKey, title: product.displayName, kind: "PDF", downloadUrl: `/oferte/familieprotejata/materiale/${product.productKey}/pdf`, audioUrl: `/oferte/familieprotejata/materiale/${product.productKey}/audio` })) };
}

export async function requestFamilyRecovery(email: string) { const { db, brand } = await familyBrand(); const contact = (await db.select().from(contacts).where(eq(contacts.email, email.trim().toLowerCase())).limit(1))[0]; if (!contact) return { message: "Dacă există o comandă la această adresă, vei primi un link securizat." }; const entitlement = (await db.select().from(entitlements).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, contact.id), eq(entitlements.status, "active"))).limit(1))[0]; if (!entitlement) return { message: "Dacă există o comandă la această adresă, vei primi un link securizat." }; return { message: "Dacă există o comandă la această adresă, vei primi un link securizat." }; }
