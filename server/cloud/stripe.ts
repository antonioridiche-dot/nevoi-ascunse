import Stripe from "stripe";
import { getDb, createOrUpdateContact } from "../db";
import { contacts, orders, commissions, affiliates, products } from "../../drizzle/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { trackFunnelEvent } from "../db";
import { json, fail, readJson, type Env, type Handler } from "./http";

// Lazy singleton, created on first use: the Worker secret lives in the env
// binding (env.STRIPE_SECRET_KEY) and is only known at request time, so a
// module-load singleton would capture an empty key. Use a non-empty
// placeholder when the key is unset so the module can load and real Stripe
// calls fail clearly until the secret is configured (Stripe v22 throws on an
// empty key).
let _stripe: Stripe | null = null;
let _stripeKey = "";
function getStripe(env: Env): Stripe {
  const key = env.STRIPE_SECRET_KEY
    || (typeof process !== "undefined" ? process.env.STRIPE_SECRET_KEY : undefined)
    || "sk_test_placeholder_not_configured";
  if (!_stripe || _stripeKey !== key) {
    _stripe = new Stripe(key, {
      apiVersion: "2025-04-30.basil" as any,
    });
    _stripeKey = key;
  }
  return _stripe;
}

const isStripeConfigured = (env: Env): boolean =>
  Boolean(env.STRIPE_SECRET_KEY || (typeof process !== "undefined" ? process.env.STRIPE_SECRET_KEY : undefined));

// ============ PRODUCTS CONFIG ============
// Products defined here for centralized access
// priceInCents = standalone price; upsellPriceInCents = price inside the 1-click
// funnel. recurring=true → monthly Stripe subscription (coaching).
// priceInCents = standalone; upsellPriceInCents = 1-click funnel upsell;
// downsellPriceInCents = the cheaper 1-click downsell (decline path).
// recurring=true → monthly Stripe subscription (coaching).
type ProductCfg = {
  slug: string; name: string; priceInCents: number; upsellPriceInCents: number; downsellPriceInCents: number;
  gender: "male" | "female"; type: "main" | "upsell" | "coaching"; recurring: boolean;
};
// Bump offer: "Mesajele EXTRA de Împăcare" — +19,95 lei added to the front book at checkout.
export const BUMP_PRICE_CENTS = 1995;
export const MESAJE_EXTRA_SLUGS = { male: "mesaje-extra-barbati", female: "mesaje-extra-femei" } as const;
// Exit-offer discount on the front book (67 lei -> 47 lei).
export const EXIT_OFFER_DISCOUNT_CENTS = 2000;
export const FRONT_BOOK_SLUGS = ["opreste-durerea-barbati", "opreste-durerea-femei"];

export const PRODUCTS: Record<string, ProductCfg> = {
  biblia_impacare_femei: { slug: "opreste-durerea-femei", name: "Cum să Oprești Durerea unei Despărțiri (Femei)", priceInCents: 6700, upsellPriceInCents: 6700, downsellPriceInCents: 6700, gender: "female", type: "main", recurring: false },
  biblia_impacare_barbati: { slug: "opreste-durerea-barbati", name: "Cum să Oprești Durerea unei Despărțiri (Bărbați)", priceInCents: 6700, upsellPriceInCents: 6700, downsellPriceInCents: 6700, gender: "male", type: "main", recurring: false },
  // Second book — real funnel: 67 standalone, 39.95 upsell (asteapta), 19.95 downsell.
  zero_despartiri: { slug: "zero-despartiri", name: "Zero Despărțiri", priceInCents: 6700, upsellPriceInCents: 3995, downsellPriceInCents: 1995, gender: "female", type: "upsell", recurring: false },
  // Mesajele EXTRA — sold as a bump on the checkout, but also purchasable standalone
  // from the library promo (27 lei).
  mesaje_extra_barbati: { slug: "mesaje-extra-barbati", name: "Mesajele EXTRA de Împăcare (Bărbați)", priceInCents: 1995, upsellPriceInCents: 1995, downsellPriceInCents: 1995, gender: "male", type: "main", recurring: false },
  mesaje_extra_femei: { slug: "mesaje-extra-femei", name: "Mesajele EXTRA de Împăcare (Femei)", priceInCents: 1995, upsellPriceInCents: 1995, downsellPriceInCents: 1995, gender: "female", type: "main", recurring: false },
  jurnal_negru: { slug: "zero-despartiri", name: "Zero Despărțiri", priceInCents: 4700, upsellPriceInCents: 3995, downsellPriceInCents: 1995, gender: "male", type: "upsell", recurring: false },
  // Coaching: DOUA preturi, intentionat diferite.
  //   priceInCents      = 147 lei/luna — pagina separata de sfaturi (Coaching.tsx + /checkout?product=coaching)
  //   upsellPriceInCents=  97 lei/luna — 1-click upsell (Asteapta.tsx din funnel + Biblioteca.tsx)
  //   downsellPriceInCents = 97 lei/luna — pagina /downsell?product=sustinere-barbati
  //   Nota: pagina de downsell trimite isUpsell:true FARA tier, deci de fapt primeste
  //   upsellPriceInCents. Ambele sunt 97 ca sa nu existe nepotrivire intre ce vede
  //   clientul pe ecran si ce se taxeaza. (Inainte: pagina afisa 97, se taxa 147.)
  sfaturi_personalizate: { slug: "sustinere-barbati", name: "Susținere Personală", priceInCents: 14700, upsellPriceInCents: 9700, downsellPriceInCents: 9700, gender: "male", type: "coaching", recurring: true },
  ajutor_personalizat: { slug: "sustinere-femei", name: "Susținere Personală (Femei)", priceInCents: 14700, upsellPriceInCents: 9700, downsellPriceInCents: 9700, gender: "female", type: "coaching", recurring: true },
};

// ============ CREATE CHECKOUT SESSION ============
export const stripeCreateCheckout: Handler = async (request, env) => {
  try {
    const { productSlug, contactEmail, contactId, affiliateId, origin, isUpsell, paymentIntentId, tier, journalBonus } = await readJson(request);

    const product = Object.values(PRODUCTS).find(p => p.slug === productSlug);
    if (!product) {
      return fail(400, "Product not found");
    }
    const tierAmount = tier === "downsell" ? product.downsellPriceInCents : product.upsellPriceInCents;

    // Rezolva contactul si din email (buyerii din dashboard au doar cookie/email,
    // nu intotdeauna contactId in localStorage) — necesar ca 1-click-ul si
    // webhook-ul sa inregistreze comanda pe contactul corect.
    let resolvedContactId = Number(contactId) || 0;
    let resolvedEmail = String(contactEmail || "").trim().toLowerCase();
    if (!resolvedContactId && resolvedEmail && resolvedEmail.includes("@")) {
      try {
        const db = await getDb();
        const existing = db
          ? await db.select().from(contacts).where(eq(contacts.email, resolvedEmail)).limit(1)
          : [];
        if (existing.length) {
          resolvedContactId = existing[0].id;
        } else {
          resolvedContactId = (await ensureContactId(resolvedEmail, product.gender)) || 0;
        }
      } catch (err) {
        console.error("[Stripe] contact resolve error:", (err as Error).message);
      }
    }

    const affiliateIdRes = await resolveOrderAffiliate(affiliateId, resolvedContactId);

    const baseMeta = {
      contact_id: resolvedContactId ? String(resolvedContactId) : "",
      product_slug: product.slug,
      affiliate_id: affiliateIdRes ? String(affiliateIdRes) : "",
    };

    /** Set-Cookie refresh pentru sesiunea de biblioteca (doar dupa o comanda inregistrata). */
    const withLibraryCookie = async (response: Response): Promise<Response> => {
      if (!resolvedContactId) return response;
      try {
        const { libraryCookieForContact } = await import("./library");
        const header = await libraryCookieForContact(env, request, resolvedContactId);
        if (header) response.headers.set("Set-Cookie", header);
      } catch { /* cookie optional */ }
      return response;
    };

    // ===== 1-CLICK UPSELL: reuse the saved card off-session =====
    // One-click e permis doar cumparatorilor care au deja cel putin o comanda
    // finalizata (contactul trebuie sa existe si sa fi cumparat inainte).
    let isExistingBuyer = false;
    try {
      const db = await getDb();
      if (db && resolvedContactId) {
        const prior = await db.select().from(orders)
          .where(and(eq(orders.contactId, resolvedContactId), eq(orders.status, "completed")))
          .limit(1);
        isExistingBuyer = prior.length > 0;
      }
    } catch { /* treated as false */ }

    if (isUpsell && paymentIntentId && isExistingBuyer) {
      try {
        const originalPI = await getStripe(env).paymentIntents.retrieve(paymentIntentId);
        const paymentMethodId = originalPI.payment_method as string;
        const customerId = originalPI.customer as string;

        if (paymentMethodId && customerId) {
          if (product.recurring) {
            // Coaching: create a monthly subscription at the discounted upsell price.
            const price = await getStripe(env).prices.create({
              unit_amount: tierAmount,
              currency: "ron",
              recurring: { interval: "month" },
              product_data: { name: product.name },
            });
            const sub = await getStripe(env).subscriptions.create({
              customer: customerId,
              items: [{ price: price.id }],
              default_payment_method: paymentMethodId,
              off_session: true,
              metadata: { ...baseMeta, is_upsell: "true" },
            });
            if (sub.status === "active" || sub.status === "trialing") {
              await recordPurchase(resolvedContactId, product.slug, tierAmount, affiliateIdRes, true, sub.id, customerId);
              if (journalBonus) await recordBonusJournal(resolvedContactId, sub.id);
              return withLibraryCookie(json({ success: true, oneClick: true, subscriptionId: sub.id, paymentIntentId }));
            }
          } else {
            // One-time book upsell.
            const newPI = await getStripe(env).paymentIntents.create({
              amount: tierAmount,
              currency: "ron",
              payment_method: paymentMethodId,
              customer: customerId,
              confirm: true,
              off_session: true,
              metadata: { ...baseMeta, is_upsell: "true" },
            });
            if (newPI.status === "succeeded") {
              await recordPurchase(resolvedContactId, product.slug, tierAmount, affiliateIdRes, true, newPI.id, customerId);
              if (journalBonus) await recordBonusJournal(resolvedContactId, newPI.id);
              return withLibraryCookie(json({ success: true, oneClick: true, paymentIntentId: newPI.id }));
            }
          }
        }
      } catch (err: any) {
        console.warn("[Stripe] 1-click upsell failed, falling back to checkout:", err.message);
      }
    }

    // ===== HOSTED CHECKOUT (first purchase or fallback) =====
    const gender = product.gender;
    const successPath = gender === "female" ? "/femei/multumesc" : "/barbati/multumesc";
    const cancelPath = gender === "female" ? "/femei/oprestedurerea" : "/barbati/oprestedurerea";
    const base = origin || env.VITE_FRONTEND_URL || "";

    const session = await getStripe(env).checkout.sessions.create({
      payment_method_types: ["card"],
      mode: product.recurring ? "subscription" : "payment",
      customer_email: contactEmail || undefined,
      allow_promotion_codes: true,
      ...(product.recurring
        ? { subscription_data: { metadata: baseMeta } }
        : { payment_intent_data: { setup_future_usage: "off_session", metadata: baseMeta } }),
      line_items: [{
        price_data: {
          currency: "ron",
          product_data: { name: product.name },
          unit_amount: isUpsell ? tierAmount : product.priceInCents,
          ...(product.recurring ? { recurring: { interval: "month" as const } } : {}),
        },
        quantity: 1,
      }],
      metadata: { ...baseMeta, is_upsell: isUpsell ? "true" : "false", journal_bonus: journalBonus ? "true" : "false" },
      success_url: `${base}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}${cancelPath}`,
    });

    return json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe] Create checkout error:", err.message);
    return fail(500, err.message);
  }
};

// ===== EMBEDDED ON-PAGE PAYMENT: PaymentIntent (book) or Subscription (coaching) =====

/**
 * Gaseste sau creeaza contactul din email. Fara asta, un vizitator care ajunge
 * direct pe checkout (fara quiz/email capturat inainte) ar plati, dar comanda
 * nu s-ar inregistra — „nu se intampla nimic” dupa plata.
 */
async function ensureContactId(email: string, gender: "male" | "female"): Promise<number | null> {
  const em = String(email || "").trim().toLowerCase();
  if (!em.includes("@") || !em.includes(".")) return null;
  try {
    return await createOrUpdateContact({ email: em, gender, tag: "checkout_lead" });
  } catch (err) {
    console.error("[Stripe] ensureContact error:", (err as Error).message);
    return null;
  }
}

export const stripeCreatePaymentIntent: Handler = async (request, env) => {
  try {
    const { productSlug, contactEmail, contactId, affiliateId, isUpsell, tier, bump, exitOffer } = await readJson(request);
    const product = Object.values(PRODUCTS).find((p) => p.slug === productSlug);
    if (!product) return fail(400, "Product not found");
    if (!isStripeConfigured(env)) return fail(400, "Plățile nu sunt configurate momentan.");

    // Asiguram contactul chiar daca emailul a fost introdus doar pe checkout.
    let resolvedContactId = Number(contactId) || 0;
    if (!resolvedContactId && contactEmail) {
      resolvedContactId = (await ensureContactId(contactEmail, product.gender)) || 0;
    }

    const isFrontBook = FRONT_BOOK_SLUGS.includes(product.slug);
    const baseAmount = isUpsell ? (tier === "downsell" ? product.downsellPriceInCents : product.upsellPriceInCents) : product.priceInCents;
    // Exit-offer discount (sales-page popup) applies only to the front book:
    // 67 lei -> 47 lei. The checkout price updates automatically when the offer was accepted.
    const discount = exitOffer && isFrontBook && !isUpsell ? EXIT_OFFER_DISCOUNT_CENTS : 0;
    // Bump offer (Mesaje EXTRA) is sold together with the front book at checkout: +19,95 lei.
    const bumpExtra = bump && isFrontBook && !isUpsell ? BUMP_PRICE_CENTS : 0;
    const amount = baseAmount - discount + bumpExtra;
    const customer = await getStripe(env).customers.create({
      email: contactEmail || undefined,
      metadata: { contact_id: resolvedContactId ? String(resolvedContactId) : "" },
    });
    const affiliateIdRes = await resolveOrderAffiliate(affiliateId, resolvedContactId);
    const meta = {
      contact_id: resolvedContactId ? String(resolvedContactId) : "",
      product_slug: product.slug,
      affiliate_id: affiliateIdRes ? String(affiliateIdRes) : "",
      is_upsell: isUpsell ? "true" : "false",
    };

    if (product.recurring) {
      const price = await getStripe(env).prices.create({
        unit_amount: amount, currency: "ron", recurring: { interval: "month" },
        product_data: { name: product.name },
      });
      const sub = await getStripe(env).subscriptions.create({
        customer: customer.id, items: [{ price: price.id }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription", payment_method_types: ["card"] },
        expand: ["latest_invoice.payment_intent", "latest_invoice.confirmation_secret"], metadata: meta,
      });
      const inv: any = sub.latest_invoice;
      const clientSecret = inv?.payment_intent?.client_secret || inv?.confirmation_secret?.client_secret || null;
      return json({ clientSecret, mode: "subscription", customerId: customer.id, amount });
    }

    // Card + Apple Pay + Google Pay + Revolut Pay only (no Link, no other methods).
    // Wallet methods appear automatically once they are activated in the Stripe
    // dashboard; until then we fall back to card so the checkout never breaks.
    const makePI = (methods: string[]) =>
      getStripe(env).paymentIntents.create({
        amount, currency: "ron", customer: customer.id,
        setup_future_usage: "off_session",
        payment_method_types: methods as any,
        metadata: { ...meta, bump: bumpExtra ? "true" : "false", exit_offer: discount ? "true" : "false" },
      });
    let pi: Stripe.PaymentIntent;
    try {
      pi = await makePI(["card", "apple_pay", "google_pay", "revolut_pay"]);
    } catch (err: any) {
      if (/payment method type|not activated|invalid/i.test(err?.message || "")) {
        pi = await makePI(["card"]);
      } else {
        throw err;
      }
    }
    return json({ clientSecret: pi.client_secret, mode: "payment", customerId: customer.id, amount });
  } catch (err: any) {
    console.error("[Stripe] create-payment-intent error:", err.message);
    return fail(500, err.message);
  }
};

// ===== Confirm + record an embedded purchase (server verifies status with Stripe) =====
export const stripeConfirmOrder: Handler = async (request, env) => {
  try {
    const { paymentIntentId, productSlug, contactId, affiliateId, isUpsell, bump } = await readJson(request);
    const product = Object.values(PRODUCTS).find((p) => p.slug === productSlug);
    if (!product || !paymentIntentId) return fail(400, "Bad request");
    const pi = await getStripe(env).paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") return json({ error: "Payment not completed", status: pi.status }, 402);

    // Rezolvam contactul: body -> metadata PI -> emailul din plata (receipt/customer).
    let resolvedContactId = Number(contactId) || 0;
    if (!resolvedContactId) {
      const metaContact = pi.metadata?.contact_id;
      if (metaContact) resolvedContactId = Number(metaContact) || 0;
    }
    if (!resolvedContactId) {
      const email = (typeof pi.receipt_email === "string" ? pi.receipt_email : "") ||
        (typeof pi.customer === "string" && pi.customer.startsWith("cus_")
          ? ((await getStripe(env).customers.retrieve(pi.customer as string).catch(() => null)) as Stripe.Customer | null)?.email ?? ""
          : "");
      if (email) resolvedContactId = (await ensureContactId(email, product.gender)) || 0;
    }

    const hasBump = !!bump || pi.metadata?.bump === "true";
    const affiliateIdRes = await resolveOrderAffiliate(affiliateId || pi.metadata?.affiliate_id, resolvedContactId);
    await recordPurchase(resolvedContactId, product.slug, pi.amount, affiliateIdRes, !!isUpsell, pi.id, (pi.customer as string) || undefined, hasBump);
    // Acces automat la „Materialele Cumpărate” doar in sesiunea care a platit.
    const res = json({ ok: true });
    if (resolvedContactId) {
      const { libraryCookieForContact } = await import("./library");
      const header = await libraryCookieForContact(env, request, resolvedContactId);
      if (header) res.headers.set("Set-Cookie", header);
    }
    return res;
  } catch (err: any) {
    console.error("[Stripe] confirm-order error:", err.message);
    return fail(500, err.message);
  }
};

/**
 * Record a completed purchase (first purchase OR 1-click upsell). Idempotent on
 * stripeRef so webhooks + confirm-order can't double-record. 50% affiliate commission,
 * payable after the 30-day guarantee + 45-day hold.
 */
/**
 * Records the Zero Despărțiri as a FREE bonus (amount 0) so the buyer can
 * download it on the delivery page. Used by the /barbati/asteapta upsell
 * (coaching + journal bonus). Idempotent on the payment ref.
 */
async function recordBonusJournal(contactId: number, stripeRef: string) {
  const db = await getDb();
  if (!db || !contactId) return;
  const bonusRef = stripeRef + "-bonus-jurnal";
  const existing = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, bonusRef)).limit(1);
  if (existing.length) return;
  // Bonusul de jurnal este pe genul cumparatorului.
  const contactRows = await db.select({ gender: contacts.gender }).from(contacts).where(eq(contacts.id, contactId)).limit(1);
  const bonusSlug = contactRows[0]?.gender === "female" ? "zero-despartiri-femei" : "zero-despartiri";
  const [bumpProduct] = await db.select().from(products).where(eq(products.slug, bonusSlug)).limit(1);
  await db.insert(orders).values({
    contactId,
    productId: bumpProduct?.id ?? null,
    amountInCents: 0,
    status: "completed",
    stripePaymentIntentId: bonusRef,
    affiliateId: null,
    isUpsell: false,
  });
}

/** Procentul real de comision al afiliatului (implicit 50% din vanzare). */
async function resolveAffiliateId(raw: unknown): Promise<number | null> {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  // Paginile trimit codul de referral (ex: "abc123") — il rezolvam la id.
  try {
    const db = await getDb();
    const rows = db
      ? await db.select({ id: affiliates.id }).from(affiliates).where(eq(affiliates.referralCode, s)).limit(1)
      : [];
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("[Stripe] affiliate resolve error:", (err as Error).message);
    return null;
  }
}
/**
 * Fallback de atribuire: daca linkul de afiliat s-a pierdut (cumparatorul a
 * deschis emailul pe alt telefon, a schimbat browserul, a golit storage-ul sau
 * a revenit mai tarziu), il recuperam din contact — contactul retine ce afiliat
 * l-a adus, iar informatia aia e pe server, nu in browser.
 */
async function affiliateIdForContact(contactId: number | null | undefined): Promise<number | null> {
  const id = Number(contactId) || 0;
  if (!id) return null;
  try {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select({ affiliateId: contacts.affiliateId }).from(contacts).where(eq(contacts.id, id)).limit(1);
    return rows[0]?.affiliateId ?? null;
  } catch (err) {
    console.error("[Stripe] contact affiliate fallback error:", (err as Error).message);
    return null;
  }
}

/**
 * Retine afiliatul pe contact, daca nu avea deja unul. Asa, la comenzile
 * urmatoare ale aceleiasi persoane (inclusiv cele din emailuri, de pe alt
 * telefon) atribuirea se pastreaza si comisionul nu se pierde.
 */
async function stampContactAffiliate(contactId: number | null | undefined, affiliateId: number | null): Promise<void> {
  const cid = Number(contactId) || 0;
  if (!cid || !affiliateId) return;
  try {
    const db = await getDb();
    if (!db) return;
    await db.update(contacts).set({ affiliateId }).where(and(eq(contacts.id, cid), isNull(contacts.affiliateId)));
  } catch (err) {
    console.error("[Stripe] stamp contact affiliate error:", (err as Error).message);
  }
}

/** Afiliatul unei comenzi: intai codul/id-ul trimis de pagina, apoi contactul. */
async function resolveOrderAffiliate(raw: unknown, contactId: number | null | undefined): Promise<number | null> {
  const direct = await resolveAffiliateId(raw);
  if (direct) return direct;
  return affiliateIdForContact(contactId);
}

/** Procentul real de comision al afiliatului (implicit 50% din vanzare). */
async function commissionRateFor(affiliateId: number | null): Promise<number> {
  if (!affiliateId) return 0;
  try {
    const db = await getDb();
    const rows = db
      ? await db.select({ percent: affiliates.commissionPercent }).from(affiliates).where(eq(affiliates.id, affiliateId)).limit(1)
      : [];
    const percent = rows[0]?.percent;
    if (typeof percent === "number" && percent > 0) return percent / 100;
  } catch (err) {
    console.error("[Stripe] commission rate error:", (err as Error).message);
  }
  return 0.5; // implicit 50% (valoarea din schema + textul programului de afiliere)
}

async function recordPurchase(contactId: number, productSlug: string, amount: number, affiliateId: number | null, isUpsell: boolean, stripeRef: string, customerId?: string, bump = false) {
  const db = await getDb();
  if (!db || !contactId) return;
  // Atribuire: daca pagina nu a trimis afiliatul, il luam de pe contact.
  const resolvedAffiliateId = affiliateId ?? (await affiliateIdForContact(contactId));
  await stampContactAffiliate(contactId, resolvedAffiliateId);
  const existing = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, stripeRef)).limit(1);
  if (existing.length) return; // idempotent
  // Zero Despărțiri este pe gen: daca produsul platit este zero-despartiri (male),
  // iar cumparatorul este femeie, inregistram varianta de femei (zero-despartiri-femei).
  let dbSlug = productSlug;
  if (productSlug === "zero-despartiri") {
    const contactRows = await db.select({ gender: contacts.gender }).from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (contactRows[0]?.gender === "female") dbSlug = "zero-despartiri-femei";
  }
  const [dbProduct] = await db.select().from(products).where(eq(products.slug, dbSlug)).limit(1);
  const [order] = await db.insert(orders).values({
    contactId,
    productId: dbProduct?.id ?? null,
    amountInCents: amount,
    status: "completed",
    stripePaymentIntentId: stripeRef,
    affiliateId: resolvedAffiliateId,
    isUpsell,
  }).returning({ id: orders.id });

  // Bump order: "Mesajele EXTRA de Împăcare" (+27 lei), delivered with the book.
  if (bump) {
    const bumpSlug = MESAJE_EXTRA_SLUGS[dbProduct?.gender === "female" ? "female" : "male"];
    const bumpExisting = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, stripeRef + "-bump")).limit(1);
    if (bumpExisting.length === 0) {
      const [bumpProduct] = await db.select().from(products).where(eq(products.slug, bumpSlug)).limit(1);
      await db.insert(orders).values({
        contactId,
        productId: bumpProduct?.id ?? null,
        amountInCents: BUMP_PRICE_CENTS,
        status: "completed",
        stripePaymentIntentId: stripeRef + "-bump",
        affiliateId: null,
        isUpsell: false,
      });
    }
  }
  await db.update(contacts).set({
    status: "customer",
    pipelineStage: isUpsell ? "upsell_purchased" : "purchased",
    ...(customerId ? { stripeCustomerId: customerId } : {}),
  }).where(eq(contacts.id, contactId));
  if (resolvedAffiliateId) {
    const commissionAmount = Math.round(amount * (await commissionRateFor(resolvedAffiliateId)));
    const payableAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // 30 de zile garantie + 1 zi — afiliatii sunt platiti cat mai devreme
    await db.insert(commissions).values({ affiliateId: resolvedAffiliateId, orderId: order?.id ?? null, amountInCents: commissionAmount, status: "pending", payableAt });
    await db.update(affiliates).set({ totalEarned: sql`${affiliates.totalEarned} + ${commissionAmount}` }).where(eq(affiliates.id, resolvedAffiliateId));
  }
  await trackFunnelEvent({ contactId, event: isUpsell ? "upsell_purchased" : "purchase_completed", metadata: { productSlug, amount } });
}

// ============ WEBHOOK HANDLER ============
export const stripeWebhook: Handler = async (request, env) => {
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    // ATENTIE: in Cloudflare Workers cripto e doar asincron, deci constructEvent()
    // (sincron) arunca mereu "SubtleCryptoProvider cannot be used in a synchronous
    // context" si webhook-ul nu functiona deloc. Trebuie varianta async.
    event = await getStripe(env).webhooks.constructEventAsync(raw, sig, env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return json({ verified: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge);
        break;
      case "invoice.paid":
        // Abonamentul de coaching: comision pe FIECARE reinnoire lunara.
        await handleInvoicePaid(env, event.data.object as Stripe.Invoice);
        break;
      case "account.updated": {
        // Stripe Connect: sincronizeaza statusul contului afiliatului.
        const { syncConnectStatusFromAccount } = await import("../affiliateConnect");
        await syncConnectStatusFromAccount(event.data.object as Stripe.Account);
        break;
      }
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Handler error:", err.message);
  }

  return json({ received: true });
};

// ============ WEBHOOK HANDLERS ============

/**
 * Comision pe REINNOIRILE abonamentului de coaching.
 *
 * Prima luna e inregistrata de checkout.session.completed / payment_intent.succeeded.
 * Aici prindem fiecare reinnoire lunara, ca afiliatul sa primeasca 50% lunar,
 * nelimitat, cat timp clientul ramane abonat.
 */
async function handleInvoicePaid(env: Env, invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;

  // Prima plata a abonamentului e tratata deja de checkout/payment_intent.
  if (invoice.billing_reason === "subscription_create") return;
  if (invoice.status !== "paid") return;
  // amount_paid poate fi 0 la plati in afara sistemului sau cu cupon 100%;
  // total e suma reala a facturii dupa reduceri.
  const amount = invoice.amount_paid || invoice.total || 0;
  if (amount <= 0) return;

  // Abonamentul care a generat factura + snapshot-ul metadatelor lui
  // (API-ul nou le pune sub invoice.parent.subscription_details).
  if (invoice.parent?.type !== "subscription_details") return;
  const subDetails = invoice.parent.subscription_details;
  if (!subDetails?.subscription) return;
  const meta = (subDetails.metadata || {}) as Record<string, string>;

  // Idempotenta: webhook-urile se pot repeta.
  const ref = "inv:" + invoice.id;
  const already = await db.select({ id: orders.id }).from(orders).where(eq(orders.stripePaymentIntentId, ref)).limit(1);
  if (already.length) return;

  let contactId = parseInt(meta.contact_id || "0", 10) || 0;
  if (!contactId) {
    const email = (invoice.customer_email || "").trim().toLowerCase();
    if (email) {
      const rows = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.email, email)).limit(1);
      contactId = rows[0]?.id ?? 0;
    }
  }
  if (!contactId) {
    console.warn("[Stripe] renewal " + invoice.id + ": contact negasit, nu pot atribui comisionul");
    return;
  }
  // Contactul trebuie sa existe real, altfel am crea comenzi orfane.
  const contactExists = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, contactId)).limit(1);
  if (!contactExists.length) {
    console.warn("[Stripe] renewal " + invoice.id + ": contactul " + contactId + " nu exista, sar peste");
    return;
  }

  const productSlug = meta.product_slug || "";
  const affiliateId = (parseInt(meta.affiliate_id || "0", 10) || null) ?? (await affiliateIdForContact(contactId));
  await stampContactAffiliate(contactId, affiliateId);

  const productRows = productSlug
    ? await db.select().from(products).where(eq(products.slug, productSlug)).limit(1)
    : [];

  const [order] = await db.insert(orders).values({
    contactId,
    productId: productRows[0]?.id ?? null,
    amountInCents: amount,
    status: "completed",
    stripePaymentIntentId: ref,
    affiliateId,
    isUpsell: false,
  }).returning({ id: orders.id });

  if (affiliateId) {
    const commissionAmount = Math.round(amount * (await commissionRateFor(affiliateId)));
    const payableAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    await db.insert(commissions).values({ affiliateId, orderId: order?.id ?? null, amountInCents: commissionAmount, status: "pending", payableAt });
    await db.update(affiliates).set({ totalEarned: sql`${affiliates.totalEarned} + ${commissionAmount}` }).where(eq(affiliates.id, affiliateId));
    console.log("[Stripe] comision reinnoire: afiliat " + affiliateId + " +" + commissionAmount + " bani (factura " + invoice.id + ")");
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) return;

  const contactId = parseInt(session.metadata?.contact_id || "0");
  const productSlug = session.metadata?.product_slug || "";
  const affiliateIdMeta = parseInt(session.metadata?.affiliate_id || "0", 10) || null;
  const affiliateId = affiliateIdMeta ?? (await affiliateIdForContact(contactId));
  await stampContactAffiliate(contactId, affiliateId);
  const isUpsell = session.metadata?.is_upsell === "true";
  const journalBonus = session.metadata?.journal_bonus === "true";

  if (!contactId) return;

  const product = Object.values(PRODUCTS).find(p => p.slug === productSlug);
  if (!product) return;

  // Resolve DB product so the order stores productId (required for gated download).
  const [dbProduct] = await db.select().from(products).where(eq(products.slug, productSlug)).limit(1);
  const amount = session.amount_total || product.priceInCents;

  // Create order (productId links the purchase to the deliverable)
  const [order] = await db.insert(orders).values({
    contactId,
    productId: dbProduct?.id ?? null,
    amountInCents: amount,
    status: "completed",
    stripeSessionId: session.id,
    stripePaymentIntentId: (session.payment_intent as string) || null,
    affiliateId,
    isUpsell,
  }).returning({ id: orders.id });

  // Update contact status
  await db.update(contacts).set({
    status: "customer",
    pipelineStage: isUpsell ? "upsell_purchased" : "purchased",
    stripeCustomerId: session.customer as string || null,
  }).where(eq(contacts.id, contactId));

  // Affiliate commission: 50% of the sale, payable after 30-day guarantee + 45-day hold.
  if (affiliateId) {
    const commissionAmount = Math.round(amount * (await commissionRateFor(affiliateId)));
    const payableAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // 30 de zile garantie + 1 zi — afiliatii sunt platiti cat mai devreme
    await db.insert(commissions).values({
      affiliateId,
      orderId: order?.id ?? null,
      amountInCents: commissionAmount,
      status: "pending",
      payableAt,
    });
    await db.update(affiliates).set({
      totalEarned: sql`${affiliates.totalEarned} + ${commissionAmount}`,
    }).where(eq(affiliates.id, affiliateId));
  }

  // Free journal bonus (coaching upsell on /barbati/asteapta)
  if (journalBonus) await recordBonusJournal(contactId, session.id);

  // Track funnel event
  await trackFunnelEvent({
    contactId,
    event: isUpsell ? "upsell_purchased" : "purchase_completed",
    metadata: { productSlug, amount: session.amount_total },
  });

  console.log(`[Stripe] Order completed: contact=${contactId}, product=${productSlug}, amount=${session.amount_total}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Backs up the on-page checkout + 1-click upsell PaymentIntents (idempotent).
  const contactId = parseInt(paymentIntent.metadata?.contact_id || "0");
  const productSlug = paymentIntent.metadata?.product_slug || "";
  const isUpsell = paymentIntent.metadata?.is_upsell === "true";
  const affiliateId = parseInt(paymentIntent.metadata?.affiliate_id || "0", 10) || null;
  const bump = paymentIntent.metadata?.bump === "true";
  if (!contactId || !productSlug) return;
  await recordPurchase(contactId, productSlug, paymentIntent.amount, affiliateId, isUpsell, paymentIntent.id, (paymentIntent.customer as string) || undefined, bump);
}

async function handleRefund(charge: Stripe.Charge) {
  const db = await getDb();
  if (!db) return;

  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  // Find the order
  const order = await db.select().from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (!order.length) return;

  // Mark order as refunded
  await db.update(orders).set({ status: "refunded" }).where(eq(orders.id, order[0].id));

  // Update contact status and stop email sequence
  await db.update(contacts).set({
    status: "refunded",
    tag: "refunded",
    emailSubscribed: false,
    nextEmailAt: null,
    currentSequenceStep: null,
  }).where(eq(contacts.id, order[0].contactId));

  // Cancel affiliate commission
  if (order[0].affiliateId) {
    await db.update(commissions).set({ status: "cancelled" })
      .where(and(
        eq(commissions.affiliateId, order[0].affiliateId),
        eq(commissions.status, "pending")
      ));
  }

  await trackFunnelEvent({
    contactId: order[0].contactId,
    event: "refunded",
    metadata: { orderId: order[0].id },
  });

  console.log(`[Stripe] Refund processed: contact=${order[0].contactId}, order=${order[0].id}`);
}