import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { checkoutSessions, entitlements, funnelEvents, orderItems, orders, products } from "../../drizzle/schema";
import { getDb } from "../db";
import { createAffiliateCommissionsForOrder } from "./affiliateHubService";

const vrajiProductNames: Record<string, string> = {
  "love-core": "Vraja pentru iubire",
  "overcoming-rejection": "Depășește respingerea",
  "keep-love-alive": "Păstrează iubirea vie",
  "priority-journal": "Jurnal de intenție, 7 zile",
  "closure-ritual": "Ritual de încheiere",
  "attraction-expansion": "Extensia de atracție",
  "connection-compass": "Busola conexiunii",
  "intention-audio": "Audio de intenție",
};

function intentSkus(intent: Stripe.PaymentIntent) {
  return (intent.metadata.skus || intent.metadata.sku || "").split(",").map((sku) => sku.trim()).filter((sku) => sku in vrajiProductNames);
}

async function ensureVrajiProduct(brandId: number, sku: string) {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  let product = (await db.select().from(products).where(and(eq(products.brandId, brandId), eq(products.productKey, sku))).limit(1))[0];
  if (!product) {
    const inserted = await db.insert(products).values({
      brandId,
      productKey: sku,
      displayName: vrajiProductNames[sku] ?? sku,
      description: null,
      accessMode: "library",
      status: "active",
    });
    product = (await db.select().from(products).where(eq(products.id, Number(inserted[0].insertId))).limit(1))[0];
  }
  return product;
}

export async function registerVrajiPaymentIntent(input: { brandId: number; contactId: number; intent: Stripe.PaymentIntent }) {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const skus = intentSkus(input.intent);
  const primarySku = skus[0];
  if (!primarySku) throw new Error("Comanda Vrăji nu conține produse valide.");
  const primaryProduct = await ensureVrajiProduct(input.brandId, primarySku);
  const existing = (await db.select().from(checkoutSessions).where(eq(checkoutSessions.stripePaymentIntentId, input.intent.id)).limit(1))[0];
  if (!existing) {
    await db.insert(checkoutSessions).values({
      brandId: input.brandId,
      productId: primaryProduct.id,
      contactId: input.contactId,
      checkoutToken: `vraji-${input.intent.id}`,
      stripePaymentIntentId: input.intent.id,
      affiliateAttributionId: Number.isInteger(Number(input.intent.metadata.affiliate_attribution_id)) && Number(input.intent.metadata.affiliate_attribution_id) > 0 ? Number(input.intent.metadata.affiliate_attribution_id) : null,
      checkoutState: input.intent.status === "succeeded" ? "completed" : "payment_pending",
    });
  }
  if (input.intent.status === "succeeded") return fulfillVrajiPayment(input.intent);
  return { fulfilled: false as const, skus };
}

export async function fulfillVrajiPayment(intent: Stripe.PaymentIntent) {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  if (intent.metadata.brand_key !== "vraji") throw new Error("Plata nu aparține brandului Vrăji.");
  const brandId = Number(intent.metadata.brand_id);
  const contactId = Number(intent.metadata.contact_id);
  const skus = intentSkus(intent);
  if (!Number.isInteger(brandId) || !Number.isInteger(contactId) || !skus.length) throw new Error("Metadatele plății Vrăji sunt incomplete.");

  const checkout = (await db.select().from(checkoutSessions).where(eq(checkoutSessions.stripePaymentIntentId, intent.id)).limit(1))[0];
  let order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, intent.id)).limit(1))[0];
  if (!order) {
    const inserted = await db.insert(orders).values({
      brandId,
      contactId,
      checkoutSessionId: checkout?.id ?? null,
      stripeCustomerId: typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null,
      stripePaymentIntentId: intent.id,
      amountCents: intent.amount,
      currency: intent.currency,
      fulfillmentStatus: "fulfilled",
      fulfilledAt: new Date(),
    });
    order = (await db.select().from(orders).where(eq(orders.id, Number(inserted[0].insertId))).limit(1))[0];
  } else if (order.fulfillmentStatus !== "fulfilled") {
    await db.update(orders).set({ fulfillmentStatus: "fulfilled", fulfilledAt: new Date() }).where(eq(orders.id, order.id));
  }

  for (const sku of skus) {
    const product = await ensureVrajiProduct(brandId, sku);
    let item = (await db.select().from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.productId, product.id))).limit(1))[0];
    if (!item) {
      const inserted = await db.insert(orderItems).values({ orderId: order.id, productId: product.id });
      item = (await db.select().from(orderItems).where(eq(orderItems.id, Number(inserted[0].insertId))).limit(1))[0];
    }
    const entitlement = (await db.select().from(entitlements).where(and(eq(entitlements.contactId, contactId), eq(entitlements.productId, product.id))).limit(1))[0];
    if (!entitlement) await db.insert(entitlements).values({ contactId, brandId, productId: product.id, orderItemId: item.id, status: "active" });
  }

  if (checkout) { await db.update(checkoutSessions).set({ checkoutState: "completed" }).where(eq(checkoutSessions.id, checkout.id)); await createAffiliateCommissionsForOrder(checkout.id, order.id); }
  await db.insert(funnelEvents).values({ brandId, contactId, orderId: order.id, eventType: "purchase_fulfilled", metadataJson: JSON.stringify({ paymentIntentId: intent.id, skus }) });
  return { fulfilled: true as const, orderId: order.id, skus };
}
