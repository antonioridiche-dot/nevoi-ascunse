import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { brandContacts, brands, checkoutSessions, contacts, entitlements, funnelEvents, orderItems, orders, products } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { FAMILY_CURRENCIES, FAMILY_PRODUCTS, familyPrice, type FamilyCurrency, type FamilyProductKey } from "./familyConfig";

type StartInput = { customerName: string; customerEmail: string; checkoutKey: string; currency: FamilyCurrency; variant?: "promo67" | "exit20"; productHandle: FamilyProductKey };

function stripeClient() { if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat încă."); return new Stripe(ENV.stripeSecretKey); }
function token() { return randomBytes(24).toString("hex"); }

async function familyBrand() { const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă."); const brand = (await db.select().from(brands).where(eq(brands.key, "familieprotejata")).limit(1))[0]; if (!brand) throw new Error("Brandul Familie protejată nu este configurat."); return { db, brand }; }

async function familyProduct(productKey: FamilyProductKey) {
  const { db, brand } = await familyBrand(); const definition = FAMILY_PRODUCTS[productKey]; let product = (await db.select().from(products).where(and(eq(products.brandId, brand.id), eq(products.productKey, productKey))).limit(1))[0];
  if (!product) { const inserted = await db.insert(products).values({ brandId: brand.id, productKey, displayName: definition.title, description: definition.description, accessMode: "library", status: "active" }); product = (await db.select().from(products).where(eq(products.id, Number(inserted[0].insertId))).limit(1))[0]; }
  return { db, brand, product, definition };
}

async function familyContact(db: Awaited<ReturnType<typeof getDb>> & {}, brandId: number, name: string, email: string) {
  const normalized = email.trim().toLowerCase(); let contact = (await db.select().from(contacts).where(eq(contacts.email, normalized)).limit(1))[0];
  if (!contact) { const parts = name.trim().split(/\s+/); const inserted = await db.insert(contacts).values({ email: normalized, firstName: parts[0] ?? null, lastName: parts.slice(1).join(" ") || null }); contact = (await db.select().from(contacts).where(eq(contacts.id, Number(inserted[0].insertId))).limit(1))[0]; }
  const existing = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brandId), eq(brandContacts.contactId, contact.id))).limit(1))[0];
  if (!existing) await db.insert(brandContacts).values({ brandId, contactId: contact.id, marketingConsent: 0, transactionalConsentAt: new Date(), metadataJson: JSON.stringify({ source: "familieprotejata" }) });
  return contact;
}

export async function createFamilyPaymentIntent(input: StartInput) {
  if (!/^\S+@\S+\.\S+$/.test(input.customerEmail) || input.customerName.trim().length < 2) throw new Error("Introdu o adresă de e-mail și un nume valid.");
  const { db, brand, product, definition } = await familyProduct(input.productHandle); const contact = await familyContact(db, brand.id, input.customerName, input.customerEmail); const sessionToken = token(); const amount = familyPrice(input.productHandle, input.currency, input.variant); const stripe = stripeClient(); const customer = await stripe.customers.create({ email: contact.email, name: input.customerName, metadata: { brand_key: brand.key, product_handle: input.productHandle } }, { idempotencyKey: `family-customer-${input.checkoutKey}` });
  const intent = await stripe.paymentIntents.create({ amount, currency: FAMILY_CURRENCIES[input.currency].code, payment_method_types: ["card"], customer: customer.id, setup_future_usage: "off_session", receipt_email: contact.email, description: definition.title, metadata: { brand_key: brand.key, session_token: sessionToken, customer_name: input.customerName, customer_email: contact.email, product_handle: input.productHandle, currency: input.currency, variant: input.variant ?? "" } }, { idempotencyKey: `family-payment-${input.checkoutKey}-${input.currency}-${input.variant ?? "standard"}` });
  if (!intent.client_secret) throw new Error("Nu am putut inițializa plata securizată.");
  await db.insert(checkoutSessions).values({ brandId: brand.id, productId: product.id, contactId: contact.id, checkoutToken: sessionToken, stripePaymentIntentId: intent.id, checkoutState: "payment_pending" });
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "checkout_started", metadataJson: JSON.stringify({ sessionToken, productHandle: input.productHandle, currency: input.currency, variant: input.variant }) });
  return { sessionToken, clientSecret: intent.client_secret };
}

export async function confirmFamilyPayment(sessionToken: string, paymentIntentId: string) {
  const { db, brand } = await familyBrand(); const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, sessionToken), eq(checkoutSessions.brandId, brand.id))).limit(1))[0]; if (!checkout?.contactId || checkout.stripePaymentIntentId !== paymentIntentId) throw new Error("Sesiunea de plată nu a fost găsită."); const intent = await stripeClient().paymentIntents.retrieve(paymentIntentId); if (intent.status !== "succeeded") throw new Error("Plata nu a fost confirmată."); const product = (await db.select().from(products).where(eq(products.id, checkout.productId)).limit(1))[0]; await db.update(checkoutSessions).set({ checkoutState: "completed" }).where(eq(checkoutSessions.id, checkout.id)); let order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntentId)).limit(1))[0]; if (!order) { const inserted = await db.insert(orders).values({ brandId: brand.id, contactId: checkout.contactId, checkoutSessionId: checkout.id, stripeCustomerId: typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null, stripePaymentIntentId: paymentIntentId, fulfillmentStatus: "fulfilled", fulfilledAt: new Date() }); order = (await db.select().from(orders).where(eq(orders.id, Number(inserted[0].insertId))).limit(1))[0]; await db.insert(orderItems).values({ orderId: order.id, productId: product.id }); await db.insert(entitlements).values({ contactId: checkout.contactId, brandId: brand.id, productId: product.id, orderItemId: Number((await db.select().from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.productId, product.id))).limit(1))[0].id), status: "active" }); }
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: checkout.contactId, orderId: order.id, eventType: "payment_succeeded", metadataJson: JSON.stringify({ sessionToken, productHandle: product.productKey }) }); return { sessionToken, nextState: "oto1" as const };
}

export type FamilyOfferStep = "oto1" | "ds1" | "ds2";
type FamilyFunnelState = FamilyOfferStep | "thank_you";
const familyOffers: Record<FamilyOfferStep, { productHandle: FamilyProductKey; title: string; priceCents: number }> = {
  oto1: { productHandle: "field-continuity-protocol", title: "Protocolul de continuitate pe teren", priceCents: 6700 },
  ds1: { productHandle: "field-continuity-protocol-essentials", title: "Protocolul de continuitate — ediția Essentials", priceCents: 3900 },
  ds2: { productHandle: "72-hour-decision-card-pack", title: "Setul de carduri pentru decizii în 72 de ore", priceCents: 1700 },
};

export function nextFamilyState(currentStep: FamilyOfferStep, accepted: boolean): FamilyFunnelState {
  if (currentStep === "oto1") return accepted ? "thank_you" : "ds1";
  if (currentStep === "ds1") return accepted ? "thank_you" : "ds2";
  return "thank_you";
}

function eventMetadata(value: string | null) {
  try { return value ? JSON.parse(value) as Record<string, unknown> : {}; } catch { return {}; }
}

async function familyOrderDetail(sessionToken: string) {
  const { db, brand } = await familyBrand();
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.brandId, brand.id), eq(checkoutSessions.checkoutToken, sessionToken))).limit(1))[0];
  if (!checkout?.contactId || checkout.checkoutState !== "completed") return undefined;
  const contact = (await db.select().from(contacts).where(eq(contacts.id, checkout.contactId)).limit(1))[0];
  const baseProduct = (await db.select().from(products).where(eq(products.id, checkout.productId)).limit(1))[0];
  const events = await db.select().from(funnelEvents).where(and(eq(funnelEvents.brandId, brand.id), eq(funnelEvents.contactId, checkout.contactId)));
  const decisions = events.filter(event => event.eventType === "family_offer_decision" && eventMetadata(event.metadataJson).sessionToken === sessionToken).map(event => eventMetadata(event.metadataJson));
  let state: FamilyFunnelState = "oto1";
  for (const step of ["oto1", "ds1", "ds2"] as const) { const decision = decisions.find(item => item.step === step); if (!decision) break; state = nextFamilyState(step, Boolean(decision.accepted)); if (state === "thank_you") break; }
  const selections = [{ step: "fe", title: baseProduct.displayName, priceCents: 0, accepted: true }, ...decisions.map(item => ({ step: String(item.step), title: String(item.title), priceCents: Number(item.priceCents), accepted: Boolean(item.accepted) }))];
  return { db, brand, checkout, contact, baseProduct, state, selections };
}

export async function guardFamilyStep(sessionToken: string, step: FamilyFunnelState) {
  const detail = await familyOrderDetail(sessionToken);
  if (!detail || detail.state !== step) throw new Error("Pasul solicitat nu este disponibil în această ordine a funnelului.");
  return { allowed: true as const, order: { sessionToken, customerName: [detail.contact?.firstName, detail.contact?.lastName].filter(Boolean).join(" ") || "Client", customerEmail: detail.contact?.email ?? "", funnelState: detail.state, paymentStatus: "paid", selections: detail.selections } };
}

export async function decideFamilyOffer(sessionToken: string, currentStep: FamilyOfferStep, accepted: boolean, consent: boolean) {
  const detail = await familyOrderDetail(sessionToken);
  if (!detail || detail.state !== currentStep || !detail.contact || !detail.checkout.stripePaymentIntentId) throw new Error("Această ofertă nu mai este disponibilă în sesiunea curentă.");
  if (accepted && !consent) throw new Error("Confirmă autorizarea plății suplimentare pentru a continua.");
  const offer = familyOffers[currentStep];
  if (accepted) {
    const initialIntent = await stripeClient().paymentIntents.retrieve(detail.checkout.stripePaymentIntentId);
    const paymentMethodId = typeof initialIntent.payment_method === "string" ? initialIntent.payment_method : initialIntent.payment_method?.id;
    const customerId = typeof initialIntent.customer === "string" ? initialIntent.customer : initialIntent.customer?.id;
    if (!paymentMethodId || !customerId) throw new Error("Metoda de plată nu poate fi reutilizată pentru acest pas.");
    const currency = (initialIntent.currency || "ron") as FamilyCurrency;
    const productDetail = await familyProduct(offer.productHandle);
    const intent = await stripeClient().paymentIntents.create({ amount: familyPrice(offer.productHandle, currency), currency, customer: customerId, payment_method: paymentMethodId, off_session: true, confirm: true, payment_method_types: ["card"], description: offer.title, metadata: { sessionToken, offerStep: currentStep, source: "one_click_step" } }, { idempotencyKey: `${sessionToken}:${currentStep}` });
    if (intent.status !== "succeeded" && intent.status !== "processing") throw new Error("Plata pentru acest pas nu a fost aprobată.");
    let itemOrder = (await detail.db.select().from(orders).where(eq(orders.stripePaymentIntentId, intent.id)).limit(1))[0];
    if (!itemOrder) { const inserted = await detail.db.insert(orders).values({ brandId: detail.brand.id, contactId: detail.contact.id, stripeCustomerId: customerId, stripePaymentIntentId: intent.id, fulfillmentStatus: "fulfilled", fulfilledAt: new Date() }); itemOrder = (await detail.db.select().from(orders).where(eq(orders.id, Number(inserted[0].insertId))).limit(1))[0]; const itemInserted = await detail.db.insert(orderItems).values({ orderId: itemOrder.id, productId: productDetail.product.id }); await detail.db.insert(entitlements).values({ contactId: detail.contact.id, brandId: detail.brand.id, productId: productDetail.product.id, orderItemId: Number(itemInserted[0].insertId), status: "active" }); }
  }
  const nextState = nextFamilyState(currentStep, accepted);
  await detail.db.insert(funnelEvents).values({ brandId: detail.brand.id, contactId: detail.contact.id, eventType: "family_offer_decision", metadataJson: JSON.stringify({ sessionToken, step: currentStep, title: offer.title, priceCents: offer.priceCents, accepted, nextState }) });
  await detail.db.insert(funnelEvents).values({ brandId: detail.brand.id, contactId: detail.contact.id, eventType: accepted ? "offer_accepted" : "offer_declined", metadataJson: JSON.stringify({ sessionToken, productHandle: offer.productHandle, step: currentStep }) });
  return { nextState };
}
