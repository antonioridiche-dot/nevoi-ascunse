import { and, eq, sql } from "drizzle-orm";
import { accessSessions, brands, checkoutSessions, contactTags, emailProviderEvents, emailMessages, funnelEvents, orders, tags } from "../../drizzle/schema";
import { getDb } from "../db";

export async function getRelatiiAdminSnapshot() {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "relatii")).limit(1))[0];
  if (!brand) throw new Error("Brandul Relații nu a fost configurat.");
  const [orderAggregate] = await db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.amountCents}), 0)` }).from(orders).where(and(eq(orders.brandId, brand.id), eq(orders.fulfillmentStatus, "fulfilled")));
  const checkouts = await db.select({ status: checkoutSessions.checkoutState, count: sql<number>`count(*)` }).from(checkoutSessions).where(eq(checkoutSessions.brandId, brand.id)).groupBy(checkoutSessions.checkoutState);
  const tagRows = await db.select({ tag: tags.key, count: sql<number>`count(${contactTags.id})` }).from(tags).leftJoin(contactTags, eq(contactTags.tagId, tags.id)).where(eq(tags.brandId, brand.id)).groupBy(tags.key);
  const emailEvents = await db.select({ eventType: emailProviderEvents.eventType, count: sql<number>`count(*)` }).from(emailProviderEvents).innerJoin(emailMessages, eq(emailProviderEvents.emailMessageId, emailMessages.id)).where(eq(emailMessages.brandId, brand.id)).groupBy(emailProviderEvents.eventType);
  const [captured] = await db.select({ count: sql<number>`count(*)` }).from(funnelEvents).where(and(eq(funnelEvents.brandId, brand.id), eq(funnelEvents.eventType, "checkout_started")));
  const [abandoned] = await db.select({ count: sql<number>`count(*)` }).from(checkoutSessions).where(and(eq(checkoutSessions.brandId, brand.id), eq(checkoutSessions.checkoutState, "abandoned")));
  const [recoveriesRequested] = await db.select({ count: sql<number>`count(*)` }).from(funnelEvents).where(and(eq(funnelEvents.brandId, brand.id), eq(funnelEvents.eventType, "access_link_requested")));
  const [recoveriesRedeemed] = await db.select({ count: sql<number>`count(*)` }).from(funnelEvents).where(and(eq(funnelEvents.brandId, brand.id), eq(funnelEvents.eventType, "access_link_redeemed")));
  const [activeAccess] = await db.select({ count: sql<number>`count(*)` }).from(accessSessions).where(eq(accessSessions.brandId, brand.id));
  const capturedCount = Number(captured?.count ?? 0);
  const pendingCount = checkouts.filter(row => row.status === "payment_pending").reduce((sum, row) => sum + Number(row.count), 0);
  return {
    orders: { count: Number(orderAggregate?.count ?? 0), revenueRon: Number((Number(orderAggregate?.revenue ?? 0) / 100).toFixed(2)) },
    funnel: { captured: capturedCount, cartAdded: pendingCount, cartRate: capturedCount ? Number(((pendingCount / capturedCount) * 100).toFixed(1)) : 0, abandoned: Number(abandoned?.count ?? 0) },
    checkouts: checkouts.map(row => ({ status: row.status, count: Number(row.count) })),
    tags: tagRows.map(row => ({ tag: row.tag, count: Number(row.count) })),
    emailEvents: emailEvents.map(row => ({ eventType: row.eventType, count: Number(row.count) })),
    recoveries: { requested: Number(recoveriesRequested?.count ?? 0), redeemed: Number(recoveriesRedeemed?.count ?? 0), active: Number(activeAccess?.count ?? 0) },
  };
}
