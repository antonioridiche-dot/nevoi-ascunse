import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { brandContacts, brands, checkoutSessions, contacts, entitlements, funnelEvents, orderItems, orders, products } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { CALENDAR_PACKAGES, calendarEligiblePackages, type CalendarCurrency, type CalendarPackageId } from "./calendarConfig";
import { createAffiliateCommissionsForOrder, resolveAffiliateAttribution } from "./affiliateHubService";

const stripeClient = () => { if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat încă."); return new Stripe(ENV.stripeSecretKey); };

async function calendarContext(packageId: CalendarPackageId) {
  const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "calendarul-norocului")).limit(1))[0];
  if (!brand) throw new Error("Brandul Calendarul norocului nu este configurat.");
  let product = (await db.select().from(products).where(and(eq(products.brandId, brand.id), eq(products.productKey, packageId))).limit(1))[0];
  if (!product) { const created = await db.insert(products).values({ brandId: brand.id, productKey: packageId, displayName: CALENDAR_PACKAGES[packageId].name, description: CALENDAR_PACKAGES[packageId].description, accessMode: "library", status: "active" }); product = (await db.select().from(products).where(eq(products.id, Number(created[0].insertId))).limit(1))[0]; }
  return { db, brand, product };
}

function calendarConsentMetadata(metadataJson: string | null) { try { const value = JSON.parse(metadataJson ?? "{}"); return value && typeof value === "object" ? value as Record<string, unknown> : {}; } catch { return {}; } }

async function calendarContact(db: Awaited<ReturnType<typeof getDb>> & {}, brandId: number, email: string, firstName?: string, consent?: { marketingConsent?: boolean; oneClickConsent?: boolean }) {
  const normalized = email.trim().toLowerCase(); let contact = (await db.select().from(contacts).where(eq(contacts.email, normalized)).limit(1))[0];
  if (!contact) { const created = await db.insert(contacts).values({ email: normalized, firstName: firstName?.trim() || null }); contact = (await db.select().from(contacts).where(eq(contacts.id, Number(created[0].insertId))).limit(1))[0]; }
  const link = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brandId), eq(brandContacts.contactId, contact.id))).limit(1))[0];
  const hasMarketingConsent = consent?.marketingConsent === true; const hasOneClickConsent = consent?.oneClickConsent === true;
  if (!link) await db.insert(brandContacts).values({ brandId, contactId: contact.id, transactionalConsentAt: new Date(), marketingConsent: hasMarketingConsent ? 1 : 0, marketingConsentAt: hasMarketingConsent ? new Date() : null, metadataJson: JSON.stringify({ source: "calendarul-norocului", ...(hasOneClickConsent ? { oneClickConsentAt: new Date().toISOString() } : {}) }) });
  else if (hasMarketingConsent || hasOneClickConsent) { const existingMetadata = calendarConsentMetadata(link.metadataJson); await db.update(brandContacts).set({ marketingConsent: hasMarketingConsent ? 1 : link.marketingConsent, marketingConsentAt: hasMarketingConsent && !link.marketingConsentAt ? new Date() : link.marketingConsentAt, metadataJson: JSON.stringify({ ...existingMetadata, ...(hasOneClickConsent ? { oneClickConsentAt: new Date().toISOString() } : {}) }), lastActivityAt: new Date() }).where(eq(brandContacts.id, link.id)); }
  return contact;
}

export async function createCalendarIntent(input: { packageId: CalendarPackageId; email: string; firstName?: string; currency: CalendarCurrency; visitorId?: string; marketingConsent?: boolean; oneClickConsent?: boolean; affiliateVisitorToken?: string }) {
  const { db, brand, product } = await calendarContext(input.packageId); const contact = await calendarContact(db, brand.id, input.email, input.firstName, { marketingConsent: input.marketingConsent, oneClickConsent: input.oneClickConsent }); const attribution = await resolveAffiliateAttribution(brand.id, input.affiliateVisitorToken); const token = randomBytes(24).toString("hex");
  const stripe = stripeClient(); const existingCustomers = await stripe.customers.list({ email: contact.email, limit: 1 }); const customer = existingCustomers.data[0] ?? await stripe.customers.create({ email: contact.email, name: contact.firstName ?? undefined, metadata: { brand_key: brand.key, contact_id: String(contact.id) } });
  const amount = CALENDAR_PACKAGES[input.packageId].prices[input.currency]; const intent = await stripe.paymentIntents.create({ amount, currency: input.currency, automatic_payment_methods: { enabled: true }, customer: customer.id, receipt_email: contact.email, setup_future_usage: input.oneClickConsent ? "off_session" : undefined, metadata: { brand_key: brand.key, brand_id: String(brand.id), contact_id: String(contact.id), package_id: input.packageId, visitor_id: input.visitorId ?? "", affiliate_attribution_id: attribution ? String(attribution.id) : "" } });
  if (!intent.client_secret) throw new Error("Stripe nu a returnat tokenul securizat pentru plată.");
  await db.insert(checkoutSessions).values({ brandId: brand.id, productId: product.id, contactId: contact.id, affiliateAttributionId: attribution?.id, checkoutToken: token, stripePaymentIntentId: intent.id, checkoutState: "payment_pending" });
  await db.insert(funnelEvents).values([{ brandId: brand.id, contactId: contact.id, eventType: "cart_started", metadataJson: JSON.stringify({ token, packageId: input.packageId, currency: input.currency, visitorId: input.visitorId ?? "" }) }, { brandId: brand.id, contactId: contact.id, eventType: "checkout_created", metadataJson: JSON.stringify({ token, packageId: input.packageId, currency: input.currency, visitorId: input.visitorId ?? "" }) }]);
  return { clientSecret: intent.client_secret, checkoutToken: token, amount, currency: input.currency };
}

export async function confirmCalendarIntent(input: { checkoutToken: string; paymentIntentId: string }) {
  const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă."); const intent = await stripeClient().paymentIntents.retrieve(input.paymentIntentId);
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, input.checkoutToken), eq(checkoutSessions.stripePaymentIntentId, input.paymentIntentId))).limit(1))[0];
  if (!checkout?.contactId || intent.status !== "succeeded") throw new Error("Plata nu a fost confirmată.");
  const customerId = typeof intent.customer === "string" ? intent.customer : intent.customer?.id;
  const paymentMethodId = typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id;
  const consent = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, checkout.brandId), eq(brandContacts.contactId, checkout.contactId))).limit(1))[0];
  if (customerId && paymentMethodId && calendarConsentMetadata(consent?.metadataJson ?? null).oneClickConsentAt) await stripeClient().customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
  let order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, intent.id)).limit(1))[0];
  if (!order) { const created = await db.insert(orders).values({ brandId: checkout.brandId, contactId: checkout.contactId, checkoutSessionId: checkout.id, stripeCustomerId: typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null, stripePaymentIntentId: intent.id, amountCents: intent.amount, currency: intent.currency, fulfillmentStatus: "fulfilled", fulfilledAt: new Date() }); order = (await db.select().from(orders).where(eq(orders.id, Number(created[0].insertId))).limit(1))[0]; const item = await db.insert(orderItems).values({ orderId: order.id, productId: checkout.productId }); await db.insert(entitlements).values({ contactId: checkout.contactId, brandId: checkout.brandId, productId: checkout.productId, orderItemId: Number(item[0].insertId), status: "active" }); await db.update(checkoutSessions).set({ checkoutState: "completed" }).where(eq(checkoutSessions.id, checkout.id)); await createAffiliateCommissionsForOrder(checkout.id, order.id); }
  const owned = await db.select({ productKey: products.productKey }).from(entitlements).innerJoin(products, eq(entitlements.productId, products.id)).where(and(eq(entitlements.contactId, checkout.contactId), eq(entitlements.brandId, checkout.brandId), eq(entitlements.status, "active")));
  await db.insert(funnelEvents).values({ brandId: checkout.brandId, contactId: checkout.contactId, orderId: order.id, eventType: "purchase_completed", metadataJson: JSON.stringify({ checkoutToken: input.checkoutToken, paymentIntentId: intent.id }) });
  const packageIds = owned.map((item) => item.productKey).filter((key): key is CalendarPackageId => key in CALENDAR_PACKAGES); return { eligibleProductIds: calendarEligiblePackages(packageIds) };
}

export async function purchaseCalendarOneClick(input: { email: string; packageId: CalendarPackageId }) {
  const { db, brand, product } = await calendarContext(input.packageId); const contact = await calendarContact(db, brand.id, input.email); const consent = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brand.id), eq(brandContacts.contactId, contact.id))).limit(1))[0]; if (!calendarConsentMetadata(consent?.metadataJson ?? null).oneClickConsentAt) throw new Error("Ai nevoie de acordul explicit pentru salvarea metodei de plată înainte de acest pas."); const owned = await db.select({ productId: entitlements.productId }).from(entitlements).where(and(eq(entitlements.contactId, contact.id), eq(entitlements.brandId, brand.id), eq(entitlements.productId, product.id), eq(entitlements.status, "active")));
  if (owned.length) throw new Error("Acest produs este deja în calendarul tău."); const stripe = stripeClient(); const customer = (await stripe.customers.list({ email: contact.email, limit: 1 })).data[0]; if (!customer || typeof customer.invoice_settings.default_payment_method !== "string") throw new Error("Nu există o metodă de plată salvată pentru acest pas.");
  const intent = await stripe.paymentIntents.create({ amount: CALENDAR_PACKAGES[input.packageId].prices.usd, currency: "usd", customer: customer.id, payment_method: customer.invoice_settings.default_payment_method, confirm: true, off_session: true, metadata: { brand_key: brand.key, package_id: input.packageId, contact_id: String(contact.id), funnel_step: "one_click" } }, { idempotencyKey: `calendar-one-click-${contact.id}-${input.packageId}` });
  if (intent.status !== "succeeded" && intent.status !== "processing") throw new Error("Plata pentru acest pas nu a fost aprobată."); const existing = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, intent.id)).limit(1))[0]; if (!existing) { const created = await db.insert(orders).values({ brandId: brand.id, contactId: contact.id, stripeCustomerId: customer.id, stripePaymentIntentId: intent.id, amountCents: intent.amount, currency: intent.currency, fulfillmentStatus: "fulfilled", fulfilledAt: new Date() }); const orderId = Number(created[0].insertId); const item = await db.insert(orderItems).values({ orderId, productId: product.id }); await db.insert(entitlements).values({ contactId: contact.id, brandId: brand.id, productId: product.id, orderItemId: Number(item[0].insertId), status: "active" }); }
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "next_step_accepted", metadataJson: JSON.stringify({ packageId: input.packageId, paymentIntentId: intent.id }) });
  return { eligibleProductIds: calendarEligiblePackages((await db.select({ productKey: products.productKey }).from(entitlements).innerJoin(products, eq(entitlements.productId, products.id)).where(and(eq(entitlements.contactId, contact.id), eq(entitlements.brandId, brand.id), eq(entitlements.status, "active")))).map(item => item.productKey).filter((key): key is CalendarPackageId => key in CALENDAR_PACKAGES)) };
}
