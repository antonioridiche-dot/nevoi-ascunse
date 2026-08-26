import { createHash } from "node:crypto";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { brandContacts, brands, contacts, funnelEvents } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { registerVrajiPaymentIntent } from "./vrajiFulfillment";
import { resolveAffiliateAttribution } from "./affiliateHubService";

export const VRAJI_PRODUCTS = {
  loveCore: { sku: "love-core", name: "Vraja pentru iubire", priceRonBani: 20_000 },
  rejection: { sku: "overcoming-rejection", name: "Depășește respingerea", priceRonBani: 2_700 },
  keepLove: { sku: "keep-love-alive", name: "Păstrează iubirea vie", priceRonBani: 3_300 },
  priority: { sku: "priority-journal", name: "Jurnal de intenție, 7 zile", priceRonBani: 999 },
  closure: { sku: "closure-ritual", name: "Ritual de încheiere", priceRonBani: 1499 },
  upsellOne: { sku: "attraction-expansion", name: "Extensia de atracție", priceRonBani: 3999 },
  upsellTwo: { sku: "connection-compass", name: "Busola conexiunii", priceRonBani: 2999 },
  downsellOne: { sku: "intention-audio", name: "Audio de intenție", priceRonBani: 1499 },
} as const;

export type VrajiVariant = "promo67" | "exit20";
export type VrajiBumpSku = "priority-journal" | "closure-ritual";
export type VrajiPostSku = "attraction-expansion" | "connection-compass" | "intention-audio";

const productBySku = Object.values(VRAJI_PRODUCTS).reduce((map, product) => ({ ...map, [product.sku]: product }), {} as Record<string, { sku: string; name: string; priceRonBani: number }>);
const validBumps = new Set<VrajiBumpSku>(["priority-journal", "closure-ritual"]);
const validPost = new Set<VrajiPostSku>(["attraction-expansion", "connection-compass", "intention-audio"]);
const stripeClient = () => {
  if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat încă.");
  return new Stripe(ENV.stripeSecretKey);
};
const baseAmount = (variant: VrajiVariant) => variant === "exit20" ? 4_700 : 6_700;

export function vrajiCheckoutAmount(variant: VrajiVariant, bumps: readonly VrajiBumpSku[]) {
  return baseAmount(variant) + bumps.reduce((total, sku) => total + productBySku[sku].priceRonBani, 0);
}

async function getVrajiContact(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "vraji")).limit(1))[0];
  if (!brand) throw new Error("Brandul Vrăji nu este configurat.");
  const normalized = email.trim().toLowerCase();
  let contact = (await db.select().from(contacts).where(eq(contacts.email, normalized)).limit(1))[0];
  if (!contact) {
    const inserted = await db.insert(contacts).values({ email: normalized });
    contact = (await db.select().from(contacts).where(eq(contacts.id, Number(inserted[0].insertId))).limit(1))[0];
  }
  const linked = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brand.id), eq(brandContacts.contactId, contact.id))).limit(1))[0];
  if (!linked) await db.insert(brandContacts).values({ brandId: brand.id, contactId: contact.id, transactionalConsentAt: new Date(), marketingConsent: 0, metadataJson: JSON.stringify({ source: "vraji-spells-store" }) });
  return { db, brand, contact };
}

async function findOrCreateVrajiStripeCustomer(email: string, contactId: number) {
  const api = stripeClient();
  const existing = await api.customers.list({ email, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const customer = await api.customers.create({ email, metadata: { contact_id: String(contactId) } });
  return customer.id;
}

export async function prepareVrajiPayment(input: { email: string; offerVariant: VrajiVariant; bumps: VrajiBumpSku[]; affiliateCode?: string | null; affiliateVisitorToken?: string }) {
  if (input.bumps.some((sku) => !validBumps.has(sku))) throw new Error("Un extra selectat nu este disponibil.");
  const { db, brand, contact } = await getVrajiContact(input.email); const attribution = await resolveAffiliateAttribution(brand.id, input.affiliateVisitorToken);
  const cleanBumps = [...input.bumps].sort() as VrajiBumpSku[];
  const customerId = await findOrCreateVrajiStripeCustomer(contact.email, contact.id);
  const amount = vrajiCheckoutAmount(input.offerVariant, cleanBumps);
  const idempotencyKey = createHash("sha256").update(`${contact.id}|${input.offerVariant}|${cleanBumps.join(",")}`).digest("hex");
  const intent = await stripeClient().paymentIntents.create({
    amount,
    currency: "ron",
    customer: customerId,
    receipt_email: contact.email,
    payment_method_types: ["card"],
    setup_future_usage: "off_session",
    metadata: { brand_key: brand.key, brand_id: String(brand.id), contact_id: String(contact.id), offer_variant: input.offerVariant, skus: [VRAJI_PRODUCTS.loveCore.sku, ...cleanBumps].join(","), affiliate_code: input.affiliateCode ?? "", affiliate_attribution_id: attribution ? String(attribution.id) : "" },
  }, { idempotencyKey });
  await registerVrajiPaymentIntent({ brandId: brand.id, contactId: contact.id, intent });
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "payment_prepared", metadataJson: JSON.stringify({ paymentIntentId: intent.id, amount, variant: input.offerVariant, bumps: cleanBumps }) });
  if (!intent.client_secret) throw new Error("Nu am putut pregăti plata.");
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id, amount };
}

export async function getVrajiPaymentStatus(paymentIntentId: string) {
  const intent = await stripeClient().paymentIntents.retrieve(paymentIntentId);
  const brandId = Number(intent.metadata.brand_id);
  const contactId = Number(intent.metadata.contact_id);
  if (intent.status === "succeeded" && Number.isInteger(brandId) && Number.isInteger(contactId)) await registerVrajiPaymentIntent({ brandId, contactId, intent });
  return { paid: intent.status === "succeeded", email: intent.receipt_email ?? intent.metadata.customer_email ?? null, amount: intent.amount, paymentIntentId: intent.id };
}

export async function createVrajiPostPurchase(input: { email: string; sourcePaymentIntentId: string; sku: VrajiPostSku }) {
  if (!validPost.has(input.sku)) throw new Error("Produs indisponibil.");
  const stripe = stripeClient();
  const source = await stripe.paymentIntents.retrieve(input.sourcePaymentIntentId);
  if ((source.receipt_email ?? "").toLowerCase() !== input.email.trim().toLowerCase()) throw new Error("Comanda nu corespunde acestei adrese de email.");
  const paymentMethod = typeof source.payment_method === "string" ? source.payment_method : source.payment_method?.id;
  const customer = typeof source.customer === "string" ? source.customer : source.customer?.id;
  const brandId = Number(source.metadata.brand_id);
  const contactId = Number(source.metadata.contact_id);
  if (!paymentMethod || !customer || !Number.isInteger(brandId) || !Number.isInteger(contactId)) throw new Error("Nu putem procesa alegerea one-click pentru această comandă.");
  const product = productBySku[input.sku];
  const intent = await stripe.paymentIntents.create({
    amount: product.priceRonBani,
    currency: "ron",
    customer,
    payment_method: paymentMethod,
    confirm: true,
    off_session: true,
    metadata: { brand_key: "vraji", brand_id: String(brandId), contact_id: String(contactId), offer_variant: source.metadata.offer_variant || "promo67", skus: input.sku, affiliate_code: source.metadata.affiliate_code || "", source_payment_intent_id: source.id },
  }, { idempotencyKey: `vraji-one-click-${source.id}-${input.sku}` });
  await registerVrajiPaymentIntent({ brandId, contactId, intent });
  return { paymentIntentId: intent.id, status: intent.status, product: product.name };
}
