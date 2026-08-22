import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { affiliateClicks, affiliateCommissions, affiliates, brands, funnelEvents, orderItems, orders, products } from "../../drizzle/schema";
import { getDb } from "../db";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

async function relatiiBrand() {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "relatii")).limit(1))[0];
  if (!brand) throw new Error("Brandul Relații nu a fost configurat.");
  return { db, brand };
}

async function affiliateByCode(code: string) {
  const { db, brand } = await relatiiBrand();
  const affiliate = (await db.select().from(affiliates).where(and(eq(affiliates.brandId, brand.id), eq(affiliates.affiliateCode, code.trim().toUpperCase()))).limit(1))[0];
  return { db, brand, affiliate };
}

export async function createRelatiiAffiliate(input: { name: string; email: string; password: string }) {
  const { db, brand } = await relatiiBrand();
  const email = input.email.trim().toLowerCase();
  const existing = (await db.select().from(affiliates).where(and(eq(affiliates.brandId, brand.id), eq(affiliates.email, email))).limit(1))[0];
  if (existing) throw new Error("Există deja un cont de afiliat pentru această adresă de e-mail.");
  let code = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `AF-${randomBytes(5).toString("hex").toUpperCase()}`;
    const collision = (await db.select().from(affiliates).where(and(eq(affiliates.brandId, brand.id), eq(affiliates.affiliateCode, candidate))).limit(1))[0];
    if (!collision) { code = candidate; break; }
  }
  if (!code) throw new Error("Nu am putut genera un cod de afiliat unic.");
  await db.insert(affiliates).values({ brandId: brand.id, email, displayName: input.name.trim(), affiliateCode: code, passwordHash: hashPassword(input.password), status: "active" });
  return { name: input.name.trim(), email, code };
}

export async function authenticateRelatiiAffiliate(input: { code: string; password: string }) {
  const { affiliate } = await affiliateByCode(input.code);
  if (!affiliate || affiliate.status !== "active" || !verifyPassword(input.password, affiliate.passwordHash)) return undefined;
  return { id: affiliate.id, name: affiliate.displayName, email: affiliate.email, code: affiliate.affiliateCode };
}

export async function trackRelatiiAffiliateClick(input: { code: string; path: string }) {
  const { db, affiliate } = await affiliateByCode(input.code);
  if (!affiliate || affiliate.status !== "active") return { success: false as const };
  await db.insert(affiliateClicks).values({ affiliateId: affiliate.id, landingPath: input.path });
  return { success: true as const };
}

type AffiliateTransaction = { id: string; category: string; label: string; amountRon: number; commissionRon: number };

export async function getRelatiiAffiliateStats(code: string) {
  const { db, brand, affiliate } = await affiliateByCode(code);
  if (!affiliate || affiliate.status !== "active") return undefined;
  const clicks = Number((await db.select({ count: sql<number>`count(*)` }).from(affiliateClicks).where(eq(affiliateClicks.affiliateId, affiliate.id)))[0]?.count ?? 0);
  const productRows = await db.select({
    commissionId: affiliateCommissions.id,
    amount: affiliateCommissions.commissionAmountCents,
    itemId: orderItems.id,
    productName: products.displayName,
    orderId: orders.id,
    createdAt: affiliateCommissions.createdAt,
  }).from(affiliateCommissions).innerJoin(orderItems, eq(affiliateCommissions.orderItemId, orderItems.id)).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(products, eq(orderItems.productId, products.id)).where(and(eq(affiliateCommissions.affiliateId, affiliate.id), eq(orders.brandId, brand.id))).orderBy(desc(affiliateCommissions.createdAt));
  const stepEvents = await db.select({ id: funnelEvents.id, metadataJson: funnelEvents.metadataJson, occurredAt: funnelEvents.occurredAt }).from(funnelEvents).where(and(eq(funnelEvents.brandId, brand.id), eq(funnelEvents.eventType, "affiliate_offer_decision"))).orderBy(desc(funnelEvents.occurredAt));
  const stepTransactions = stepEvents.flatMap((event) => {
    try {
      const metadata = JSON.parse(event.metadataJson ?? "{}") as { affiliateId?: number; offerId?: string; amountCents?: number; commissionCents?: number; decision?: string };
      if (metadata.affiliateId !== affiliate.id || metadata.decision !== "accepted") return [];
      return [{ id: `step-${event.id}`, category: "Pași", label: metadata.offerId ?? "Pas post-cumpărare", amountRon: (metadata.amountCents ?? 0) / 100, commissionRon: (metadata.commissionCents ?? 0) / 100 }];
    } catch { return []; }
  });
  const productTransactions: AffiliateTransaction[] = productRows.map((row) => ({ id: `product-${row.commissionId}`, category: "Produse", label: row.productName, amountRon: row.amount / 50, commissionRon: row.amount / 100 }));
  const productsRon = productTransactions.reduce((sum, item) => sum + item.commissionRon, 0);
  const stepsRon = stepTransactions.reduce((sum, item) => sum + item.commissionRon, 0);
  const transactions = [...productTransactions, ...stepTransactions].slice(0, 20);
  return {
    clicks,
    orders: productRows.length,
    commissionRon: Number((productsRon + stepsRon).toFixed(2)),
    commissions: { productsRon: Number(productsRon.toFixed(2)), stepsRon: Number(stepsRon.toFixed(2)), coachingRon: 0 },
    transactions,
  };
}
