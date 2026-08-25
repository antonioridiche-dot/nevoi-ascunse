import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { brandContacts, brands, checkoutSessions, contacts, entitlements, funnelEvents, orderItems, orders, products } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { CALENDAR_PACKAGES, calendarEligiblePackages, type CalendarCurrency, type CalendarPackageId } from "./calendarConfig";

const stripeClient = () => { if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat încă."); return new Stripe(ENV.stripeSecretKey); };

async function calendarContext(packageId: CalendarPackageId) {
  const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "calendarul-norocului")).limit(1))[0];
  if (!brand) throw new Error("Brandul Calendarul norocului nu este configurat.");
  let product = (await db.select().from(products).where(and(eq(products.brandId, brand.id), eq(products.productKey, packageId))).limit(1))[0];
  if (!product) { const created = await db.insert(products).values({ brandId: brand.id, productKey: packageId, displayName: CALENDAR_PACKAGES[packageId].name, description: CALENDAR_PACKAGES[packageId].description, accessMode: "library", status: "active" }); product = (await db.select().from(products).where(eq(products.id, Number(created[0].insertId))).limit(1))[0]; }
  return { db, brand, product };
}

async function calendarContact(db: Awaited<ReturnType<typeof getDb>> & {}, brandId: number, email: string, firstName?: string) {
  const normalized = email.trim().toLowerCase(); let contact = (await db.select().from(contacts).where(eq(contacts.email, normalized)).limit(1))[0];
  if (!contact) { const created = await db.insert(contacts).values({ email: normalized, firstName: firstName?.trim() || null }); contact = (await db.select().from(contacts).where(eq(contacts.id, Number(created[0].insertId))).limit(1))[0]; }
  const link = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brandId), eq(brandContacts.contactId, contact.id))).limit(1))[0];
  if (!link) await db.insert(brandContacts).values({ brandId, contactId: contact.id, transactionalConsentAt: new Date(), marketingConsent: 0, metadataJson: JSON.stringify({ source: "calendarul-norocului" }) });
  return contact;
}

export async function createCalendarIntent(input: { packageId: CalendarPackageId; email: string; firstName?: string; currency: CalendarCurrency; visitorId?: string; oneClickConsent?: boolean }) {
  const { db, brand, product } = await calendarContext(input.packageId); const contact = await calendarContact(db, brand.id, input.email, input.firstName); const token = randomBytes(24).toString("hex");
  const stripe = stripeClient(); const existingCustomers = await stripe.customers.list({ email: contact.email, limit: 1 }); const customer = existingCustomers.data[0] ?? await stripe.customers.create({ email: contact.email, name: contact.firstName ?? undefined, metadata: { brand_key: brand.key, contact_id: String(contact.id) } });
  const amount = CALENDAR_PACKAGES[input.packageId].prices[input.currency]; const intent = await stripe.paymentIntents.create({ amount, currency: input.currency, automatic_payment_methods: { enabled: true }, customer: customer.id, receipt_email: contact.email, setup_future_usage: input.oneClickConsent ? "off_session" : undefined, metadata: { brand_key: brand.key, brand_id: String(brand.id), contact_id: String(contact.id), package_id: input.packageId, visitor_id: input.visitorId ?? "" } });
  if (!intent.client_secret) throw new Error("Stripe nu a returnat tokenul securizat pentru plată.");
  await db.insert(checkoutSessions).values({ brandId: brand.id, productId: product.id, contactId: contact.id, checkoutToken: token, stripePaymentIntentId: intent.id, checkoutState: "payment_pending" });
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "checkout_created", metadataJson: JSON.stringify({ token, packageId: input.packageId, currency: input.currency, visitorId: input.visitorId ?? "" }) });
  return { clientSecret: intent.client_secret, checkoutToken: token, amount, currency: input.currency };
}

export async function confirmCalendarIntent(input: { checkoutToken: string; paymentIntentId: string }) {
  const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă."); const intent = await stripeClient().paymentIntents.retrieve(input.paymentIntentId);
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, input.checkoutToken), eq(checkoutSessions.stripePaymentIntentId, input.paymentIntentId))).limit(1))[0];
  if (!checkout?.contactId || intent.status !== "succeeded") throw new Error("Plata nu a fost confirmată.");
  const customerId = typeof intent.customer === "string" ? intent.customer : intent.customer?.id;
  const paymentMethodId = typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id;
  if (customerId && paymentMethodId) await stripeClient().customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
  let order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, intent.id)).limit(1))[0];
  if (!order) { const created = await db.insert(orders).values({ brandId: checkout.brandId, contactId: checkout.contactId, checkoutSessionId: checkout.id, stripeCustomerId: typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null, stripePaymentIntentId: intent.id, amountCents: intent.amount, currency: intent.currency, fulfillmentStatus: "fulfilled", fulfilledAt: new Date() }); order = (await db.select().from(orders).where(eq(orders.id, Number(created[0].insertId))).limit(1))[0]; const item = await db.insert(orderItems).values({ orderId: order.id, productId: checkout.productId }); await db.insert(entitlements).values({ contactId: checkout.contactId, brandId: checkout.brandId, productId: checkout.productId, orderItemId: Number(item[0].insertId), status: "active" }); await db.update(checkoutSessions).set({ checkoutState: "completed" }).where(eq(checkoutSessions.id, checkout.id)); }
  const owned = await db.select({ productKey: products.productKey }).from(entitlements).innerJoin(products, eq(entitlements.productId, products.id)).where(and(eq(entitlements.contactId, checkout.contactId), eq(entitlements.brandId, checkout.brandId), eq(entitlements.status, "active")));
  const packageIds = owned.map((item) => item.productKey).filter((key): key is CalendarPackageId => key in CALENDAR_PACKAGES); return { eligibleProductIds: calendarEligiblePackages(packageIds) };
}
