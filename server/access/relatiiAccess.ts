import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { accessSessions, brands, contacts, entitlements, funnelEvents, products } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendBrandEmail } from "../email/brandMailer";

const TOKEN_TTL_MS = 30 * 60 * 1000;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function relatiiBrand() {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "relatii")).limit(1))[0];
  if (!brand) throw new Error("Brandul Relații nu a fost configurat.");
  return { db, brand };
}

export async function createRelatiiAccessLink(email: string, purpose: "purchase" | "recovery") {
  const { db, brand } = await relatiiBrand();
  const contact = (await db.select().from(contacts).where(eq(contacts.email, email.trim().toLowerCase())).limit(1))[0];
  if (!contact) return null;
  const grants = await db.select({ id: entitlements.id }).from(entitlements).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, contact.id), eq(entitlements.status, "active"))).limit(1);
  if (!grants.length) return null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await db.insert(accessSessions).values({ contactId: contact.id, brandId: brand.id, tokenHash: hash(token), expiresAt });
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "access_link_requested", metadataJson: JSON.stringify({ purpose, expiresAt: expiresAt.toISOString() }) });
  return { token, expiresAt };
}

export async function redeemRelatiiAccessLink(token: string) {
  const { db, brand } = await relatiiBrand();
  const session = (await db.select().from(accessSessions).where(and(eq(accessSessions.brandId, brand.id), eq(accessSessions.tokenHash, hash(token)), gt(accessSessions.expiresAt, new Date()))).limit(1))[0];
  if (!session) return undefined;
  const contact = (await db.select().from(contacts).where(eq(contacts.id, session.contactId)).limit(1))[0];
  if (!contact) return undefined;
  const library = await db.select({ id: entitlements.id, productKey: products.productKey, status: entitlements.status }).from(entitlements).innerJoin(products, eq(entitlements.productId, products.id)).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, contact.id), eq(entitlements.status, "active")));
  await db.delete(accessSessions).where(eq(accessSessions.id, session.id));
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "access_link_redeemed", metadataJson: JSON.stringify({ entitlementCount: library.length }) });
  return { email: contact.email, library };
}

export async function requestRelatiiRecovery(input: { email: string; origin: string }) {
  const access = await createRelatiiAccessLink(input.email, "recovery");
  if (access) {
    const { db, brand } = await relatiiBrand();
    const contact = (await db.select().from(contacts).where(eq(contacts.email, input.email.trim().toLowerCase())).limit(1))[0];
    if (contact) {
      const dashboardUrl = `${input.origin.replace(/\/$/, "")}/oferte/relatii/biblioteca?token=${encodeURIComponent(access.token)}`;
      await sendBrandEmail({
        brandId: brand.id,
        brandName: brand.displayName,
        senderName: brand.senderName,
        senderEmail: brand.senderEmail,
        replyToEmail: brand.replyToEmail,
        contactId: contact.id,
        recipientEmail: contact.email,
        templateKey: "library-recovery",
        category: "transactional",
        subject: "Accesează-ți biblioteca",
        html: `<p>Bună,</p><p>Ai cerut acces la biblioteca ta. Folosește acest link securizat, disponibil pentru o perioadă limitată:</p><p><a href="${dashboardUrl}">${dashboardUrl}</a></p><p>Dacă nu ai cerut tu acest acces, poți ignora acest e-mail în siguranță.</p><p>Dicționarul Relațiilor</p>`,
      }).catch((error: unknown) => console.error("[Relații] E-mailul de recuperare nu a putut fi trimis", error));
    }
  }
  return { requested: true as const };
}
