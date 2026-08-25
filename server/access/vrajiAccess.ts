import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { accessSessions, brands, contacts, entitlements, products } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendBrandEmail } from "../email/brandMailer";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function vrajiBrand() {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "vraji")).limit(1))[0];
  if (!brand) throw new Error("Brandul Vrăji nu este configurat.");
  return { db, brand };
}

export async function requestVrajiLibraryAccess(input: { email: string; origin: string }) {
  const { db, brand } = await vrajiBrand();
  const email = input.email.trim().toLowerCase();
  const contact = (await db.select().from(contacts).where(eq(contacts.email, email)).limit(1))[0];
  const generic = { requested: true as const, delivery: "email_not_configured" as const, previewUrl: null as string | null };
  if (!contact) return generic;

  const grant = (await db.select({ id: entitlements.id }).from(entitlements).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, contact.id), eq(entitlements.status, "active"))).limit(1))[0];
  if (!grant) return generic;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  await db.insert(accessSessions).values({ contactId: contact.id, brandId: brand.id, tokenHash: hash(token), expiresAt });
  const libraryUrl = `${input.origin.replace(/\/$/, "")}/vraji/biblioteca?access=${encodeURIComponent(token)}`;
  const previewUrl = process.env.NODE_ENV === "production" ? null : libraryUrl;

  try {
    const delivery = await sendBrandEmail({
      brandId: brand.id,
      brandName: brand.displayName,
      senderName: brand.senderName,
      senderEmail: brand.senderEmail,
      replyToEmail: brand.replyToEmail,
      contactId: contact.id,
      recipientEmail: contact.email,
      templateKey: "library-magic-link",
      category: "transactional",
      subject: "Accesează biblioteca ta Vrăji",
      html: `<p>Bună,</p><p>Ai cerut acces la biblioteca ta Vrăji. Linkul este securizat și expiră în 15 minute:</p><p><a href="${libraryUrl}">Deschide biblioteca privată</a></p><p>Dacă nu ai cerut tu accesul, poți ignora acest e-mail.</p>`,
    });
    return { requested: true as const, delivery: delivery.sent ? "email_sent" as const : "email_not_configured" as const, previewUrl };
  } catch {
    return { ...generic, previewUrl };
  }
}

export async function getVrajiLibrary(accessToken: string | null | undefined) {
  if (!accessToken) return { customer: null, products: [] };
  const { db, brand } = await vrajiBrand();
  const session = (await db.select().from(accessSessions).where(and(eq(accessSessions.brandId, brand.id), eq(accessSessions.tokenHash, hash(accessToken)), gt(accessSessions.expiresAt, new Date()))).limit(1))[0];
  if (!session) return { customer: null, products: [] };
  await db.update(accessSessions).set({ lastUsedAt: new Date() }).where(eq(accessSessions.id, session.id));
  const contact = (await db.select().from(contacts).where(eq(contacts.id, session.contactId)).limit(1))[0];
  if (!contact) return { customer: null, products: [] };
  const grants = await db.select({ id: entitlements.id, sku: products.productKey }).from(entitlements).innerJoin(products, eq(entitlements.productId, products.id)).where(and(eq(entitlements.brandId, brand.id), eq(entitlements.contactId, contact.id), eq(entitlements.status, "active")));
  return { customer: { email: contact.email }, products: grants };
}
