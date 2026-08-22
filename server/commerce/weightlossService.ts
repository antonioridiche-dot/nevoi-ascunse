import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import Stripe from "stripe";
import { brandContacts, brands, contacts, entitlements, orderItems, orders, productAssets, products } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { storageGetSignedUrl, storagePut } from "../storage";

export const WEIGHTLOSS_PRODUCTS = {
  bucatarie: { slug: "bucatarie", title: "Bucătăria Care Arde Grăsimea", price: 19700, kind: "main" },
  retete: { slug: "retete", title: "82 de Rețete cu Superalimente", price: 7900, kind: "upsell" },
  miscare: { slug: "miscare", title: "Metabolic Aftershock", price: 11900, kind: "upsell" },
  longevitate: { slug: "longevitate", title: "101 Alimente pentru Longevitate", price: 3900, kind: "upsell" },
} as const;
export type WeightlossProductSlug = keyof typeof WEIGHTLOSS_PRODUCTS;
const stripe = () => { if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat."); return new Stripe(ENV.stripeSecretKey); };
export const isWeightlossProduct = (value: string): value is WeightlossProductSlug => value in WEIGHTLOSS_PRODUCTS;

export async function createWeightlossIntent(input: { productSlug: string; buyerName: string; buyerEmail: string; orderToken?: string; affiliateCode?: string }) { if (!isWeightlossProduct(input.productSlug)) throw new Error("Produs indisponibil."); const product = WEIGHTLOSS_PRODUCTS[input.productSlug]; const orderToken = input.orderToken ?? randomUUID(); const client = stripe(); const customer = await client.customers.create({ email: input.buyerEmail.toLowerCase(), name: input.buyerName, metadata: { order_token: orderToken } }); const intent = await client.paymentIntents.create({ amount: product.price, currency: "ron", description: product.title, receipt_email: input.buyerEmail.toLowerCase(), customer: customer.id, setup_future_usage: "off_session", automatic_payment_methods: { enabled: true }, metadata: { order_token: orderToken, product_slug: product.slug, buyer_email: input.buyerEmail.toLowerCase(), buyer_name: input.buyerName, affiliate_code: input.affiliateCode ?? "" } }); if (!intent.client_secret) throw new Error("Nu am putut pregăti plata."); return { clientSecret: intent.client_secret, orderToken }; }

export async function oneClickWeightlossUpsell(input: { productSlug: Exclude<WeightlossProductSlug, "bucatarie">; orderToken: string; originalPaymentIntentId: string }) { const product = WEIGHTLOSS_PRODUCTS[input.productSlug]; const client = stripe(); const original = await client.paymentIntents.retrieve(input.originalPaymentIntentId); if (original.status !== "succeeded" || original.metadata.order_token !== input.orderToken || original.metadata.product_slug !== "bucatarie" || !original.payment_method) throw new Error("Comanda inițială nu a fost confirmată pentru această ofertă."); const customer = typeof original.customer === "string" ? original.customer : original.customer?.id; if (!customer) throw new Error("Metoda de plată inițială nu poate fi reutilizată."); const intent = await client.paymentIntents.create({ amount: product.price, currency: "ron", description: product.title, customer, payment_method: typeof original.payment_method === "string" ? original.payment_method : original.payment_method.id, payment_method_types: ["card"], off_session: true, confirm: true, receipt_email: original.receipt_email ?? original.metadata.buyer_email, metadata: { order_token: input.orderToken, product_slug: product.slug, original_payment_intent: original.id } }, { idempotencyKey: `one-click:${input.orderToken}:${product.slug}:${original.id}` }); return { status: intent.status, paymentIntentId: intent.id, clientSecret: intent.client_secret }; }

async function weightlossResources() {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "weightloss")).limit(1))[0];
  if (!brand) throw new Error("Brandul Weightloss nu este configurat.");
  const records = {} as Record<WeightlossProductSlug, { id: number; slug: WeightlossProductSlug }>;
  for (const product of Object.values(WEIGHTLOSS_PRODUCTS)) {
    let record = (await db.select().from(products).where(and(eq(products.brandId, brand.id), eq(products.productKey, product.slug))).limit(1))[0];
    if (!record) {
      const inserted = await db.insert(products).values({ brandId: brand.id, productKey: product.slug, displayName: product.title, description: product.title, accessMode: "download", status: "active" });
      record = (await db.select().from(products).where(eq(products.id, Number(inserted[0].insertId))).limit(1))[0];
    }
    records[product.slug] = { id: record.id, slug: product.slug };
  }
  return { db, brand, products: records };
}

async function ensureWeightlossContact(input: { email: string; name: string; brandId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const email = input.email.trim().toLowerCase();
  let contact = (await db.select().from(contacts).where(eq(contacts.email, email)).limit(1))[0];
  const [firstName, ...lastNameParts] = input.name.trim().split(/\s+/);
  if (!contact) {
    const inserted = await db.insert(contacts).values({ email, firstName: firstName || null, lastName: lastNameParts.join(" ") || null });
    contact = (await db.select().from(contacts).where(eq(contacts.id, Number(inserted[0].insertId))).limit(1))[0];
  }
  const membership = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, input.brandId), eq(brandContacts.contactId, contact.id))).limit(1))[0];
  if (!membership) await db.insert(brandContacts).values({ brandId: input.brandId, contactId: contact.id, transactionalConsentAt: new Date(), metadataJson: JSON.stringify({ source: "weightloss-secure-downloads" }) });
  return contact;
}

export async function getWeightlossSecureDownloads(input: { orderToken: string; buyerEmail: string }) {
  const { db, brand, products: weightlossProducts } = await weightlossResources();
  const email = input.buyerEmail.trim().toLowerCase();
  const intents = (await stripe().paymentIntents.list({ limit: 100 })).data.filter(intent => intent.status === "succeeded" && intent.metadata.order_token === input.orderToken && (intent.receipt_email ?? intent.metadata.buyer_email ?? "").toLowerCase() === email && isWeightlossProduct(intent.metadata.product_slug ?? ""));
  if (!intents.length) throw new Error("Nu am găsit o comandă confirmată pentru aceste date.");
  const buyerName = intents.find(intent => intent.metadata.buyer_name)?.metadata.buyer_name ?? "";
  const contact = await ensureWeightlossContact({ email, name: buyerName, brandId: brand.id });
  const owned = new Set<WeightlossProductSlug>();
  for (const intent of intents) {
    const slug = intent.metadata.product_slug as WeightlossProductSlug;
    const product = weightlossProducts[slug];
    let order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, intent.id)).limit(1))[0];
    if (!order) {
      const inserted = await db.insert(orders).values({ brandId: brand.id, contactId: contact.id, stripeCustomerId: typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null, stripePaymentIntentId: intent.id, amountCents: intent.amount, currency: intent.currency, fulfillmentStatus: "fulfilled", fulfilledAt: new Date() });
      order = (await db.select().from(orders).where(eq(orders.id, Number(inserted[0].insertId))).limit(1))[0];
    }
    let item = (await db.select().from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.productId, product.id))).limit(1))[0];
    if (!item) { const inserted = await db.insert(orderItems).values({ orderId: order.id, productId: product.id }); item = (await db.select().from(orderItems).where(eq(orderItems.id, Number(inserted[0].insertId))).limit(1))[0]; }
    const entitlement = (await db.select().from(entitlements).where(and(eq(entitlements.contactId, contact.id), eq(entitlements.productId, product.id))).limit(1))[0];
    if (!entitlement) await db.insert(entitlements).values({ contactId: contact.id, brandId: brand.id, productId: product.id, orderItemId: item.id, status: "active" });
    owned.add(slug);
  }
  const ownedSlugs = Array.from(owned) as WeightlossProductSlug[];
  const ownedRecords = ownedSlugs.map(slug => weightlossProducts[slug]);
  const assets = ownedRecords.length ? await db.select().from(productAssets).where(and(inArray(productAssets.productId, ownedRecords.map(product => product.id)), eq(productAssets.isActive, true))) : [];
  const files = await Promise.all(assets.map(async asset => ({ id: asset.id, productSlug: Object.entries(weightlossProducts).find(([, product]) => product.id === asset.productId)?.[0] ?? "", displayName: asset.label, signedUrl: await storageGetSignedUrl(asset.storageKey) })));
  return { buyerName, products: ownedSlugs, files };
}

export async function listWeightlossOrdersForAdmin() {
  const { db, brand } = await weightlossResources();
  const rows = await db.select({ orderId: orders.id, buyerEmail: contacts.email, buyerName: contacts.firstName, confirmedAt: orders.fulfilledAt, productSlug: products.productKey, stripePaymentIntentId: orders.stripePaymentIntentId }).from(orders).innerJoin(contacts, eq(orders.contactId, contacts.id)).innerJoin(orderItems, eq(orderItems.orderId, orders.id)).innerJoin(products, eq(orderItems.productId, products.id)).where(eq(orders.brandId, brand.id)).orderBy(desc(orders.fulfilledAt));
  const client = stripe();
  return Promise.all(rows.map(async row => {
    const intent = await client.paymentIntents.retrieve(row.stripePaymentIntentId).catch(() => null);
    return { ...row, buyerName: row.buyerName ?? "", affiliateCode: intent?.metadata.affiliate_code || null };
  }));
}

export async function listWeightlossDownloadAssets() {
  const { db, brand } = await weightlossResources();
  const assets = await db.select({ id: productAssets.id, productSlug: products.productKey, displayName: productAssets.label, storageKey: productAssets.storageKey, isActive: productAssets.isActive, createdAt: productAssets.createdAt }).from(productAssets).innerJoin(products, eq(productAssets.productId, products.id)).where(eq(products.brandId, brand.id)).orderBy(desc(productAssets.createdAt));
  return assets;
}

export async function uploadWeightlossDownload(input: { productSlug: string; displayName: string; fileName: string; base64: string }) {
  if (!isWeightlossProduct(input.productSlug)) throw new Error("Produs indisponibil.");
  const fileBytes = Buffer.from(input.base64, "base64");
  if (fileBytes.byteLength > 25 * 1024 * 1024) throw new Error("Fișierul PDF depășește 25 MB.");
  const { db, products: weightlossProducts } = await weightlossResources();
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const stored = await storagePut(`produse/weightloss/${input.productSlug}/${safeFileName}`, fileBytes, "application/pdf");
  await db.insert(productAssets).values({ productId: weightlossProducts[input.productSlug].id, label: input.displayName.trim(), storageKey: stored.key, mimeType: "application/pdf", isActive: true });
  return { success: true as const };
}

export async function setWeightlossDownloadActive(input: { assetId: number; isActive: boolean }) {
  const { db, brand } = await weightlossResources();
  const asset = (await db.select({ id: productAssets.id }).from(productAssets).innerJoin(products, eq(productAssets.productId, products.id)).where(and(eq(productAssets.id, input.assetId), eq(products.brandId, brand.id))).limit(1))[0];
  if (!asset) throw new Error("Fișierul nu aparține acestui brand.");
  await db.update(productAssets).set({ isActive: input.isActive }).where(eq(productAssets.id, asset.id));
  return { success: true as const };
}
