import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import {
  brandContacts,
  brands,
  checkoutSessions,
  contacts,
  entitlements,
  funnelEvents,
  orderItems,
  orders,
  products,
} from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";

export const RELATII_PRODUCTS = {
  "dictionarul-femeilor": {
    audience: "barbati",
    displayName: "Dicționarul Femeilor",
    description: "Ghid digital de claritate pentru conversațiile, diferențele și momentele în care presupunerile ocupă locul întrebărilor bune.",
  },
  "dictionarul-barbatilor": {
    audience: "femei",
    displayName: "Dicționarul Bărbaților",
    description: "Ghid digital de claritate pentru conversațiile, diferențele și momentele în care semnalele neclare pot deveni întrebări curate.",
  },
} as const;

export type RelatiiProductKey = keyof typeof RELATII_PRODUCTS;
export type RelatiiAudience = "barbati" | "femei";
export type RelatiiOfferCode = "promo67" | "exit20";

const RELATII_PRICES: Record<RelatiiOfferCode, number> = {
  promo67: 6700,
  exit20: 4700,
};

function requireDb<T>(db: T | null): asserts db is T {
  if (!db) throw new Error("Baza de date nu este disponibilă.");
}

function stripeClient() {
  if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat.");
  return new Stripe(ENV.stripeSecretKey);
}

function checkoutToken() {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function isRelatiiProductKey(value: string): value is RelatiiProductKey {
  return value in RELATII_PRODUCTS;
}

async function getRelatiiResources() {
  const db = await getDb();
  requireDb(db);
  const brand = (await db.select().from(brands).where(eq(brands.key, "relatii")).limit(1))[0];
  if (!brand) throw new Error("Brandul Relații nu a fost configurat.");

  const records = {} as Record<RelatiiProductKey, { id: number; productKey: RelatiiProductKey }>;
  for (const [productKey, definition] of Object.entries(RELATII_PRODUCTS) as Array<[RelatiiProductKey, (typeof RELATII_PRODUCTS)[RelatiiProductKey]]>) {
    let product = (await db.select().from(products).where(and(eq(products.brandId, brand.id), eq(products.productKey, productKey))).limit(1))[0];
    if (!product) {
      const inserted = await db.insert(products).values({
        brandId: brand.id,
        productKey,
        displayName: definition.displayName,
        description: definition.description,
        accessMode: "library",
        status: "active",
      });
      product = (await db.select().from(products).where(eq(products.id, Number(inserted[0].insertId))).limit(1))[0];
    }
    records[productKey] = { id: product.id, productKey };
  }

  return { db, brand, products: records };
}

async function ensureContact(db: Awaited<ReturnType<typeof getDb>> & {}, brandId: number, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  let contact = (await db.select().from(contacts).where(eq(contacts.email, normalizedEmail)).limit(1))[0];
  if (!contact) {
    const inserted = await db.insert(contacts).values({ email: normalizedEmail });
    contact = (await db.select().from(contacts).where(eq(contacts.id, Number(inserted[0].insertId))).limit(1))[0];
  }
  const existingBrandContact = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brandId), eq(brandContacts.contactId, contact.id))).limit(1))[0];
  if (!existingBrandContact) {
    await db.insert(brandContacts).values({
      brandId,
      contactId: contact.id,
      transactionalConsentAt: new Date(),
      metadataJson: JSON.stringify({ source: "relatii-embedded-checkout" }),
    });
  }
  return contact;
}

export async function prepareRelatiiPayment(input: {
  productKey: string;
  audience: RelatiiAudience;
  email: string;
  offerCode: RelatiiOfferCode;
  affiliateCode?: string;
}) {
  if (!isRelatiiProductKey(input.productKey)) throw new Error("Produs indisponibil.");
  const definition = RELATII_PRODUCTS[input.productKey];
  if (definition.audience !== input.audience) throw new Error("Traseul selectat nu corespunde produsului.");
  const { db, brand, products: relatiiProducts } = await getRelatiiResources();
  const contact = await ensureContact(db, brand.id, input.email);
  const token = checkoutToken();
  const checkoutInsert = await db.insert(checkoutSessions).values({
    brandId: brand.id,
    productId: relatiiProducts[input.productKey].id,
    contactId: contact.id,
    checkoutToken: token,
    checkoutState: "started",
  });
  const checkoutId = Number(checkoutInsert[0].insertId);
  const stripe = stripeClient();
  const customer = await stripe.customers.create({
    email: contact.email,
    metadata: { brand_key: brand.key, checkout_token: token, audience: input.audience },
  });
  const intent = await stripe.paymentIntents.create({
    amount: RELATII_PRICES[input.offerCode],
    currency: "ron",
    customer: customer.id,
    receipt_email: contact.email,
    setup_future_usage: "off_session",
    payment_method_types: ["card"],
    description: definition.displayName,
    metadata: {
      brand_key: brand.key,
      checkout_token: token,
      product_key: input.productKey,
      audience: input.audience,
      offer_code: input.offerCode,
      affiliate_code: input.affiliateCode ?? "",
      contact_id: String(contact.id),
    },
  }, { idempotencyKey: `relatii-embedded-${checkoutId}-${input.offerCode}` });
  if (!intent.client_secret) throw new Error("Plata nu a putut fi pregătită.");

  await db.update(checkoutSessions).set({ checkoutState: "payment_pending", stripePaymentIntentId: intent.id }).where(eq(checkoutSessions.id, checkoutId));
  await db.insert(funnelEvents).values({
    brandId: brand.id,
    contactId: contact.id,
    eventType: "checkout_started",
    metadataJson: JSON.stringify({ checkoutToken: token, productKey: input.productKey, audience: input.audience, offerCode: input.offerCode }),
  });
  return { clientSecret: intent.client_secret, checkoutToken: token, priceCents: RELATII_PRICES[input.offerCode] };
}

export async function confirmRelatiiPayment(input: { checkoutToken: string; paymentIntentId: string }) {
  const { db, brand, products: relatiiProducts } = await getRelatiiResources();
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.brandId, brand.id), eq(checkoutSessions.checkoutToken, input.checkoutToken))).limit(1))[0];
  if (!checkout?.contactId) throw new Error("Sesiunea de comandă nu a fost găsită.");
  const intent = await stripeClient().paymentIntents.retrieve(input.paymentIntentId);
  if (intent.status !== "succeeded" || intent.metadata.brand_key !== "relatii" || intent.metadata.checkout_token !== input.checkoutToken || !isRelatiiProductKey(intent.metadata.product_key ?? "")) {
    throw new Error("Plata nu a fost confirmată.");
  }
  const productKey = intent.metadata.product_key as RelatiiProductKey;
  const product = relatiiProducts[productKey];
  await db.update(checkoutSessions).set({ checkoutState: "completed", stripePaymentIntentId: intent.id }).where(eq(checkoutSessions.id, checkout.id));
  let order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, intent.id)).limit(1))[0];
  if (!order) {
    const inserted = await db.insert(orders).values({
      brandId: brand.id,
      contactId: checkout.contactId,
      checkoutSessionId: checkout.id,
      stripeCustomerId: typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null,
      stripePaymentIntentId: intent.id,
      fulfillmentStatus: "fulfilled",
      fulfilledAt: new Date(),
    });
    order = (await db.select().from(orders).where(eq(orders.id, Number(inserted[0].insertId))).limit(1))[0];
  }
  let item = (await db.select().from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.productId, product.id))).limit(1))[0];
  if (!item) {
    const inserted = await db.insert(orderItems).values({ orderId: order.id, productId: product.id });
    item = (await db.select().from(orderItems).where(eq(orderItems.id, Number(inserted[0].insertId))).limit(1))[0];
  }
  const entitlement = (await db.select().from(entitlements).where(and(eq(entitlements.contactId, checkout.contactId), eq(entitlements.productId, product.id))).limit(1))[0];
  if (!entitlement) await db.insert(entitlements).values({ contactId: checkout.contactId, brandId: brand.id, productId: product.id, orderItemId: item.id, status: "active" });
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: checkout.contactId, orderId: order.id, eventType: "purchase_completed", metadataJson: JSON.stringify({ checkoutToken: input.checkoutToken, productKey, paymentIntentId: intent.id }) });
  return { orderId: order.id };
}
