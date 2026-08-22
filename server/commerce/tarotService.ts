import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import {
  brandContacts,
  brands,
  checkoutSessions,
  contacts,
  contactTags,
  entitlements,
  funnelEvents,
  intakeSubmissions,
  orderItems,
  orders,
  products,
  tags,
  webhookDeliveries,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { sendBrandEmail } from "../email/brandMailer";
import { issueTarotAccess } from "../access/tarotAccess";
import { ENV } from "../_core/env";
import { isTarotCard, TAROT_PRODUCTS } from "./tarotConfig";

type TarotCheckoutInput = {
  customerName: string;
  customerEmail: string;
  birthDate: string;
  topic: string;
  selectedCards: string[];
  marketingConsent: boolean;
  origin: string;
};

type TarotOrderInput = Omit<TarotCheckoutInput, "origin">;

type TarotOfferCheckoutInput = {
  checkoutToken: string;
  productKey: Exclude<keyof typeof TAROT_PRODUCTS, "tarot_guide">;
  origin: string;
};

function requireDb<T>(db: T | null): asserts db is T {
  if (!db) throw new Error("Baza de date nu este disponibilă.");
}

function stripeClient() {
  if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat încă.");
  return new Stripe(ENV.stripeSecretKey);
}

function token() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

function validateInput(input: TarotCheckoutInput) {
  if (!input.customerName.trim() || !/^\S+@\S+\.\S+$/.test(input.customerEmail)) {
    throw new Error("Completează numele și o adresă de e-mail validă.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) throw new Error("Data de naștere nu este validă.");
  if (!input.topic.trim()) throw new Error("Alege zona pentru care vrei ghidul.");
  if (input.selectedCards.length !== 3 || new Set(input.selectedCards).size !== 3 || input.selectedCards.some((card) => !isTarotCard(card))) {
    throw new Error("Alege exact trei cărți diferite.");
  }
  if (!input.origin.startsWith("http")) throw new Error("Nu am putut stabili adresa sigură de întoarcere după plată.");
}

function getTarotProductDefinition(value: string) {
  const definition = TAROT_PRODUCTS[value as keyof typeof TAROT_PRODUCTS];
  if (!definition) throw new Error("Oferta Tarot selectată nu este disponibilă.");
  return definition;
}

export const TAROT_EMBEDDED_PRICES = {
  ron: { welcome33: 6700, exit20: 4700 },
  eur: { welcome33: 1340, exit20: 940 },
  gbp: { welcome33: 1200, exit20: 1000 },
  usd: { welcome33: 1474, exit20: 1032 },
} as const;

async function getTarotBrand() {
  const db = await getDb();
  requireDb(db);
  const brand = (await db.select().from(brands).where(eq(brands.key, "tarot")).limit(1))[0];
  if (!brand) throw new Error("Brandul Tarot nu a fost configurat.");
  return { db, brand };
}

async function ensureTarotProducts() {
  const { db, brand } = await getTarotBrand();
  const records = {} as Record<keyof typeof TAROT_PRODUCTS, { id: number; productKey: string }>;

  for (const [key, definition] of Object.entries(TAROT_PRODUCTS)) {
    let product = (await db.select().from(products).where(and(eq(products.brandId, brand.id), eq(products.productKey, definition.productKey))).limit(1))[0];
    if (!product) {
      const insert = await db.insert(products).values({
        brandId: brand.id,
        productKey: definition.productKey,
        displayName: definition.displayName,
        description: definition.description,
        accessMode: definition.accessMode,
        status: "active",
      });
      product = (await db.select().from(products).where(eq(products.id, Number(insert[0].insertId))).limit(1))[0];
    }
    records[key as keyof typeof TAROT_PRODUCTS] = { id: product.id, productKey: product.productKey };
  }
  return { db, brand, products: records };
}

async function ensureContact(input: TarotCheckoutInput, brandId: number) {
  const db = await getDb();
  requireDb(db);
  const email = input.customerEmail.trim().toLowerCase();
  let contact = (await db.select().from(contacts).where(eq(contacts.email, email)).limit(1))[0];
  if (!contact) {
    const nameParts = input.customerName.trim().split(/\s+/);
    const insert = await db.insert(contacts).values({ email, firstName: nameParts[0] ?? null, lastName: nameParts.slice(1).join(" ") || null });
    contact = (await db.select().from(contacts).where(eq(contacts.id, Number(insert[0].insertId))).limit(1))[0];
  }

  let brandContact = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brandId), eq(brandContacts.contactId, contact.id))).limit(1))[0];
  if (!brandContact) {
    const insert = await db.insert(brandContacts).values({
      brandId,
      contactId: contact.id,
      marketingConsent: input.marketingConsent ? 1 : 0,
      transactionalConsentAt: new Date(),
      marketingConsentAt: input.marketingConsent ? new Date() : null,
      metadataJson: JSON.stringify({ source: "tarot-intake" }),
    });
    brandContact = (await db.select().from(brandContacts).where(eq(brandContacts.id, Number(insert[0].insertId))).limit(1))[0];
  }

  if (input.marketingConsent) {
    await db.update(brandContacts).set({ marketingConsent: 1, marketingConsentAt: new Date(), lastActivityAt: new Date() }).where(eq(brandContacts.id, brandContact.id));
    const marketingTag = (await db.select().from(tags).where(and(eq(tags.brandId, brandId), eq(tags.key, "marketing_opt_in"))).limit(1))[0];
    if (marketingTag) {
      const assignment = (await db.select().from(contactTags).where(and(eq(contactTags.brandContactId, brandContact.id), eq(contactTags.tagId, marketingTag.id))).limit(1))[0];
      if (!assignment) await db.insert(contactTags).values({ brandContactId: brandContact.id, tagId: marketingTag.id, source: "tarot-intake" });
    }
  }

  return { contact, brandContact };
}

export async function startTarotCheckout(input: TarotCheckoutInput) {
  validateInput(input);
  const { db, brand, products: tarotProducts } = await ensureTarotProducts();
  const { contact } = await ensureContact(input, brand.id);
  const baseProduct = tarotProducts.tarot_guide;

  await db.insert(intakeSubmissions).values({
    brandId: brand.id,
    productId: baseProduct.id,
    contactId: contact.id,
    submissionKey: "tarot-reading-v1",
    payloadJson: JSON.stringify({ birthDate: input.birthDate, topic: input.topic, selectedCards: input.selectedCards }),
  });

  const checkoutToken = token();
  const checkoutInsert = await db.insert(checkoutSessions).values({
    brandId: brand.id,
    productId: baseProduct.id,
    contactId: contact.id,
    checkoutToken,
    checkoutState: "started",
  });
  const checkoutId = Number(checkoutInsert[0].insertId);
  await db.insert(funnelEvents).values({
    brandId: brand.id,
    contactId: contact.id,
    eventType: "quiz_completed",
    metadataJson: JSON.stringify({ productKey: baseProduct.productKey, topic: input.topic, checkoutToken }),
  });

  const stripe = stripeClient();
  const price = TAROT_PRODUCTS.tarot_guide;
  const origin = input.origin.replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: contact.email,
    client_reference_id: checkoutToken,
    allow_promotion_codes: true,
    line_items: [{ price_data: { currency: price.currency, unit_amount: price.amountCents, product_data: { name: price.displayName }, }, quantity: 1 }],
    success_url: `${origin}${brand.routeBase}/asteapta?checkout={CHECKOUT_SESSION_ID}&token=${checkoutToken}`,
    cancel_url: `${origin}${brand.routeBase}?checkout=cancelled`,
    payment_intent_data: {
      setup_future_usage: "off_session",
      metadata: { brand_key: brand.key, checkout_token: checkoutToken, product_key: baseProduct.productKey, contact_id: String(contact.id) },
    },
    metadata: { brand_key: brand.key, checkout_token: checkoutToken, product_key: baseProduct.productKey, contact_id: String(contact.id) },
  });
  if (!session.url) throw new Error("Stripe nu a returnat URL-ul de checkout.");

  await db.update(checkoutSessions).set({ stripeCheckoutSessionId: session.id, checkoutState: "payment_pending" }).where(eq(checkoutSessions.id, checkoutId));
  await db.insert(funnelEvents).values({
    brandId: brand.id,
    contactId: contact.id,
    eventType: "checkout_started",
    metadataJson: JSON.stringify({ checkoutToken, stripeCheckoutSessionId: session.id }),
  });
  return { checkoutUrl: session.url };
}

export async function createTarotOrder(input: TarotOrderInput) {
  const fullInput = { ...input, origin: "https://nevoi-ascunse.ro" };
  validateInput(fullInput);
  const { db, brand, products: tarotProducts } = await ensureTarotProducts();
  const { contact } = await ensureContact(fullInput, brand.id);
  const publicToken = token();
  await db.insert(intakeSubmissions).values({ brandId: brand.id, productId: tarotProducts.tarot_guide.id, contactId: contact.id, submissionKey: "tarot-reading-v1", payloadJson: JSON.stringify({ birthDate: input.birthDate, topic: input.topic, selectedCards: input.selectedCards }) });
  await db.insert(checkoutSessions).values({ brandId: brand.id, productId: tarotProducts.tarot_guide.id, contactId: contact.id, checkoutToken: publicToken, checkoutState: "started" });
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "request_created", metadataJson: JSON.stringify({ publicToken, topic: input.topic, selectedCards: input.selectedCards }) });
  return { publicToken };
}

export async function getTarotOrder(publicToken: string) {
  const { db, brand } = await getTarotBrand();
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, publicToken), eq(checkoutSessions.brandId, brand.id))).limit(1))[0];
  if (!checkout?.contactId) throw new Error("Cererea nu a fost găsită.");
  const contact = (await db.select().from(contacts).where(eq(contacts.id, checkout.contactId)).limit(1))[0];
  const intake = (await db.select().from(intakeSubmissions).where(and(eq(intakeSubmissions.contactId, contact.id), eq(intakeSubmissions.brandId, brand.id))).limit(1))[0];
  const payload = intake ? JSON.parse(intake.payloadJson) as { birthDate?: string; topic?: string; selectedCards?: string[] } : {};
  return { publicToken, customerName: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Client", customerEmail: contact.email, birthDate: payload.birthDate ?? "", topic: payload.topic ?? "", selectedCards: payload.selectedCards ?? [], status: checkout.checkoutState };
}

export async function prepareTarotEmbeddedPayment(publicToken: string, currency: keyof typeof TAROT_EMBEDDED_PRICES, offerCode: "welcome33" | "exit20") {
  const { db, brand } = await getTarotBrand();
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, publicToken), eq(checkoutSessions.brandId, brand.id))).limit(1))[0];
  if (!checkout?.contactId) throw new Error("Cererea nu a fost găsită.");
  if (checkout.checkoutState === "completed") throw new Error("Această comandă este deja plătită.");
  const contact = (await db.select().from(contacts).where(eq(contacts.id, checkout.contactId)).limit(1))[0];
  const stripe = stripeClient();
  const customer = await stripe.customers.create({ email: contact.email, name: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || undefined, metadata: { brand_key: brand.key, checkout_token: publicToken } });
  const amount = TAROT_EMBEDDED_PRICES[currency][offerCode];
  const intent = await stripe.paymentIntents.create({ amount, currency, customer: customer.id, receipt_email: contact.email, setup_future_usage: "off_session", description: "Ghid tarot personalizat", metadata: { brand_key: brand.key, checkout_token: publicToken, product_key: "tarot_guide", offer_code: offerCode, checkout_currency: currency, contact_id: String(contact.id) } }, { idempotencyKey: `tarot-embedded-${checkout.id}-${currency}-${offerCode}` });
  if (!intent.client_secret) throw new Error("Plata nu a putut fi pregătită.");
  await db.update(checkoutSessions).set({ checkoutState: "payment_pending", stripePaymentIntentId: intent.id }).where(eq(checkoutSessions.id, checkout.id));
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "embedded_checkout_prepared", metadataJson: JSON.stringify({ publicToken, paymentIntentId: intent.id, currency, offerCode }) });
  return { clientSecret: intent.client_secret, price: { amount, currency } };
}

export async function finalizeTarotEmbeddedPayment(publicToken: string, paymentIntentId: string) {
  const intent = await stripeClient().paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded" || intent.metadata.checkout_token !== publicToken || intent.metadata.product_key !== "tarot_guide") throw new Error("Plata nu a fost confirmată.");
  await completeTarotCheckout({ id: `embedded-${intent.id}`, metadata: { brand_key: "tarot", checkout_token: publicToken, product_key: "tarot_guide" }, payment_intent: intent.id, customer: intent.customer } as unknown as Stripe.Checkout.Session, `embedded-${intent.id}`);
  return { dashboardPath: "/oferte/tarot/dashboard" };
}

export async function recordTarotExitOffer(publicToken: string) {
  const { db, brand } = await getTarotBrand();
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, publicToken), eq(checkoutSessions.brandId, brand.id))).limit(1))[0];
  if (!checkout?.contactId || checkout.checkoutState === "completed") return { eligible: false, expiresAt: null };
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: checkout.contactId, eventType: "exit_offer_viewed", metadataJson: JSON.stringify({ publicToken, expiresAt }) });
  return { eligible: true, expiresAt };
}

export async function trackTarotEvent(publicToken: string, eventType: string) {
  const { db, brand } = await getTarotBrand();
  const checkout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, publicToken), eq(checkoutSessions.brandId, brand.id))).limit(1))[0];
  if (checkout?.contactId) await db.insert(funnelEvents).values({ brandId: brand.id, contactId: checkout.contactId, eventType, metadataJson: JSON.stringify({ publicToken }) });
  return { tracked: true as const };
}

export async function startTarotOfferCheckout(input: TarotOfferCheckoutInput) {
  if (!input.checkoutToken || !input.origin.startsWith("http")) throw new Error("Nu am putut identifica sesiunea de cumpărare.");
  const { db, brand, products: tarotProducts } = await ensureTarotProducts();
  const sourceCheckout = (await db.select().from(checkoutSessions).where(eq(checkoutSessions.checkoutToken, input.checkoutToken)).limit(1))[0];
  if (!sourceCheckout || sourceCheckout.brandId !== brand.id || !sourceCheckout.contactId) throw new Error("Comanda inițială nu a fost găsită.");
  if (sourceCheckout.checkoutState !== "completed") throw new Error("Oferta devine disponibilă după confirmarea plății inițiale.");

  const definition = getTarotProductDefinition(input.productKey);
  const product = tarotProducts[input.productKey];
  const contact = (await db.select().from(contacts).where(eq(contacts.id, sourceCheckout.contactId)).limit(1))[0];
  if (!contact) throw new Error("Datele de livrare nu au fost găsite.");
  const offerToken = token();
  const created = await db.insert(checkoutSessions).values({ brandId: brand.id, productId: product.id, contactId: contact.id, checkoutToken: offerToken, checkoutState: "started" });
  const routeAfterSuccess: Record<TarotOfferCheckoutInput["productKey"], string> = { numerology: "aproapegata", portrait: "stai", palm: "multumesc" };
  const origin = input.origin.replace(/\/$/, "");
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: contact.email,
    client_reference_id: offerToken,
    allow_promotion_codes: true,
    line_items: [{ price_data: { currency: definition.currency, unit_amount: definition.amountCents, product_data: { name: definition.displayName } }, quantity: 1 }],
    success_url: `${origin}${brand.routeBase}/${routeAfterSuccess[input.productKey]}?checkout={CHECKOUT_SESSION_ID}&token=${input.checkoutToken}`,
    cancel_url: `${origin}${brand.routeBase}/${routeAfterSuccess[input.productKey]}?token=${input.checkoutToken}&checkout=cancelled`,
    payment_intent_data: { metadata: { brand_key: brand.key, checkout_token: offerToken, parent_checkout_token: input.checkoutToken, product_key: input.productKey, contact_id: String(contact.id) } },
    metadata: { brand_key: brand.key, checkout_token: offerToken, parent_checkout_token: input.checkoutToken, product_key: input.productKey, contact_id: String(contact.id) },
  });
  if (!session.url) throw new Error("Stripe nu a returnat URL-ul de checkout pentru ofertă.");
  await db.update(checkoutSessions).set({ stripeCheckoutSessionId: session.id, checkoutState: "payment_pending" }).where(eq(checkoutSessions.id, Number(created[0].insertId)));
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "offer_checkout_started", metadataJson: JSON.stringify({ productKey: input.productKey, offerToken, parentCheckoutToken: input.checkoutToken }) });
  return { checkoutUrl: session.url };
}

export async function decideTarotOffer(publicToken: string, productKey: Exclude<keyof typeof TAROT_PRODUCTS, "tarot_guide">, accepted: boolean) {
  const { db, brand, products: tarotProducts } = await ensureTarotProducts();
  const sourceCheckout = (await db.select().from(checkoutSessions).where(and(eq(checkoutSessions.checkoutToken, publicToken), eq(checkoutSessions.brandId, brand.id))).limit(1))[0];
  if (!sourceCheckout?.contactId || sourceCheckout.checkoutState !== "completed") throw new Error("Pasurile suplimentare devin disponibile după confirmarea plății inițiale.");
  if (!accepted) {
    await db.insert(funnelEvents).values({ brandId: brand.id, contactId: sourceCheckout.contactId, eventType: "offer_declined", metadataJson: JSON.stringify({ publicToken, productKey }) });
    return { status: "declined" as const };
  }
  if (!sourceCheckout.stripePaymentIntentId) throw new Error("Datele de plată inițiale nu sunt disponibile încă.");
  const sourceIntent = await stripeClient().paymentIntents.retrieve(sourceCheckout.stripePaymentIntentId);
  const paymentMethod = typeof sourceIntent.payment_method === "string" ? sourceIntent.payment_method : sourceIntent.payment_method?.id;
  const customer = typeof sourceIntent.customer === "string" ? sourceIntent.customer : sourceIntent.customer?.id;
  if (!paymentMethod || !customer) throw new Error("Cardul inițial nu poate fi reutilizat pentru acest pas.");
  const definition = TAROT_PRODUCTS[productKey];
  const childToken = token();
  const child = await db.insert(checkoutSessions).values({ brandId: brand.id, productId: tarotProducts[productKey].id, contactId: sourceCheckout.contactId, checkoutToken: childToken, checkoutState: "started" });
  const intent = await stripeClient().paymentIntents.create({ amount: definition.amountCents, currency: definition.currency, customer, payment_method: paymentMethod, confirm: true, off_session: true, description: definition.displayName, metadata: { brand_key: brand.key, checkout_token: childToken, parent_checkout_token: publicToken, product_key: productKey, contact_id: String(sourceCheckout.contactId) } }, { idempotencyKey: `tarot-one-click-${publicToken}-${productKey}` });
  if (intent.status !== "succeeded") {
    await db.update(checkoutSessions).set({ checkoutState: "payment_pending", stripePaymentIntentId: intent.id }).where(eq(checkoutSessions.id, Number(child[0].insertId)));
    return { status: "checkout_required" as const };
  }
  await completeTarotCheckout({ id: `one-click-${intent.id}`, metadata: { brand_key: brand.key, checkout_token: childToken, product_key: productKey }, payment_intent: intent.id, customer: intent.customer } as unknown as Stripe.Checkout.Session, `one-click-${intent.id}`);
  return { status: "paid" as const };
}

export async function completeTarotCheckout(session: Stripe.Checkout.Session, providerEventId: string) {
  const checkoutToken = session.metadata?.checkout_token;
  if (!checkoutToken || session.metadata?.brand_key !== "tarot") return;
  const { db, brand, products: tarotProducts } = await ensureTarotProducts();
  const productKey = session.metadata?.product_key;
  const definition = productKey ? getTarotProductDefinition(productKey) : null;
  if (!definition || !productKey) throw new Error("Produsul din evenimentul Stripe nu este valid.");
  const purchasedProduct = tarotProducts[productKey as keyof typeof tarotProducts];
  const existingDelivery = (await db.select().from(webhookDeliveries).where(and(eq(webhookDeliveries.provider, "stripe"), eq(webhookDeliveries.providerEventId, providerEventId))).limit(1))[0];
  if (existingDelivery?.processingStatus === "processed") return;
  if (!existingDelivery) await db.insert(webhookDeliveries).values({ provider: "stripe", providerEventId, eventType: "checkout.session.completed", processingStatus: "received" });

  const checkout = (await db.select().from(checkoutSessions).where(eq(checkoutSessions.checkoutToken, checkoutToken)).limit(1))[0];
  if (!checkout || checkout.brandId !== brand.id || !checkout.contactId) return;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Stripe nu a transmis identificatorul plății confirmate.");

  await db.update(checkoutSessions).set({ checkoutState: "completed", stripeCheckoutSessionId: session.id, stripePaymentIntentId: paymentIntentId }).where(eq(checkoutSessions.id, checkout.id));
  let order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntentId)).limit(1))[0];
  if (!order) {
    const insert = await db.insert(orders).values({
      brandId: brand.id,
      contactId: checkout.contactId,
      checkoutSessionId: checkout.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripePaymentIntentId: paymentIntentId,
      fulfillmentStatus: "fulfilled",
      fulfilledAt: new Date(),
    });
    order = (await db.select().from(orders).where(eq(orders.id, Number(insert[0].insertId))).limit(1))[0];
  }

  let item = (await db.select().from(orderItems).where(and(eq(orderItems.orderId, order.id), eq(orderItems.productId, purchasedProduct.id))).limit(1))[0];
  if (!item) {
    const insert = await db.insert(orderItems).values({ orderId: order.id, productId: purchasedProduct.id, stripePriceId: null });
    item = (await db.select().from(orderItems).where(eq(orderItems.id, Number(insert[0].insertId))).limit(1))[0];
  }
  const entitlement = (await db.select().from(entitlements).where(and(eq(entitlements.contactId, checkout.contactId), eq(entitlements.productId, purchasedProduct.id))).limit(1))[0];
  if (!entitlement) {
    await db.insert(entitlements).values({ contactId: checkout.contactId, brandId: brand.id, productId: purchasedProduct.id, orderItemId: item.id, status: "active" });
  }
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: checkout.contactId, orderId: order.id, eventType: productKey === "tarot_guide" ? "purchase_completed" : "offer_completed", metadataJson: JSON.stringify({ checkoutToken, paymentIntentId, productKey }) });
  await db.update(webhookDeliveries).set({ processingStatus: "processed", processedAt: new Date() }).where(and(eq(webhookDeliveries.provider, "stripe"), eq(webhookDeliveries.providerEventId, providerEventId)));

  const contact = (await db.select().from(contacts).where(eq(contacts.id, checkout.contactId)).limit(1))[0];
  if (contact) {
    const accessToken = await issueTarotAccess(contact.id);
    const publicBaseUrl = (process.env.PUBLIC_APP_URL || "https://nevoi-ascunse.ro").replace(/\/$/, "");
    const accessLink = `${publicBaseUrl}/oferte/tarot/acces?token=${encodeURIComponent(accessToken)}`;
    await sendBrandEmail({
      brandId: brand.id,
      brandName: brand.displayName,
      senderName: brand.senderName,
      senderEmail: brand.senderEmail,
      replyToEmail: brand.replyToEmail,
      contactId: contact.id,
      recipientEmail: contact.email,
      orderId: order.id,
      templateKey: "purchase-confirmed",
      category: "transactional",
      subject: `${brand.displayName}: comanda ta este confirmată`,
      html: `<p>Mulțumim. Comanda ta pentru <strong>${definition.displayName}</strong> este confirmată.</p><p><a href="${accessLink}">Deschide biblioteca ta privată</a>.</p><p>Vei primi accesul și actualizările necesare de la ${brand.displayName}.</p>`,
    }).catch((error: unknown) => console.error("[Tarot] E-mailul de confirmare nu a putut fi trimis", error));
  }
}
