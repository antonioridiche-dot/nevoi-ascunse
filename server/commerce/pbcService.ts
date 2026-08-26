import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { brandContacts, brands, contacts, funnelEvents, products } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { resolveAffiliateAttribution } from "./affiliateHubService";

export const PBC_PRODUCT_CATALOG = {
  frontEnd: { name: "Prieteni Cu Beneficii", amountLei: 47, detail: "Cartea digitală + rapoarte despre comunicare, limite și relații casual asumate." },
  upsellOne: { name: "Cum s-o faci nebună după tine în pat", amountLei: 147, detail: "Ghid despre intimitate, comunicare și atenție reciprocă într-o relație adultă." },
  downsell: { name: "Cum s-o faci nebună după tine în pat — ediție specială", amountLei: 73, detail: "Oferta redusă pentru ghidul de intimitate și conexiune." },
  upsellTwo: { name: "Cum să cucerești cele mai frumoase femei (supermodele)", amountLei: 197, detail: "Program de încredere, conversație și prezență socială, fără jocuri sau promisiuni nerealiste." },
} as const;
export type PbcProductId = keyof typeof PBC_PRODUCT_CATALOG;
const isProduct = (value: string): value is PbcProductId => value in PBC_PRODUCT_CATALOG;
const stripeClient = () => { if (!ENV.stripeSecretKey) throw new Error("Sandboxul Stripe nu este configurat încă."); return new Stripe(ENV.stripeSecretKey); };

async function pbcBrand() { const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă."); const brand = (await db.select().from(brands).where(eq(brands.key, "prieteni-cu-beneficii")).limit(1))[0]; if (!brand) throw new Error("Brandul Prieteni cu beneficii nu este configurat."); return { db, brand }; }
async function pbcContact(name: string, email: string) { const { db, brand } = await pbcBrand(); const normalized = email.trim().toLowerCase(); let contact = (await db.select().from(contacts).where(eq(contacts.email, normalized)).limit(1))[0]; if (!contact) { const parts = name.trim().split(/\s+/); const inserted = await db.insert(contacts).values({ email: normalized, firstName: parts[0] ?? null, lastName: parts.slice(1).join(" ") || null }); contact = (await db.select().from(contacts).where(eq(contacts.id, Number(inserted[0].insertId))).limit(1))[0]; } const linked = (await db.select().from(brandContacts).where(and(eq(brandContacts.brandId, brand.id), eq(brandContacts.contactId, contact.id))).limit(1))[0]; if (!linked) await db.insert(brandContacts).values({ brandId: brand.id, contactId: contact.id, transactionalConsentAt: new Date(), marketingConsent: 0, metadataJson: JSON.stringify({ source: "prieteni-cu-beneficii" }) }); return { db, brand, contact }; }

export function pbcRequestOrigin(input: { origin?: unknown; host?: unknown; protocol?: string }) {
  if (typeof input.origin === "string" && input.origin.startsWith("http")) return input.origin.replace(/\/$/, "");
  return `${input.protocol ?? "https"}://${typeof input.host === "string" ? input.host : "localhost"}`;
}

export async function createPbcCheckout(input: { productIds: string[]; customerName: string; customerEmail: string; acceptedTerms: boolean; origin?: unknown; host?: unknown; protocol?: string; affiliateVisitorToken?: string }) {
  if (!input.acceptedTerms) throw new Error("Te rugăm să confirmi Termenii și Politica de Retur.");
  const uniqueProductIds = input.productIds.filter((productId, index, values) => values.indexOf(productId) === index);
  if (!uniqueProductIds.length || !uniqueProductIds.every(isProduct)) throw new Error("Selecția de produse nu este validă.");
  if (!input.customerName.trim() || !/^\S+@\S+\.\S+$/.test(input.customerEmail)) throw new Error("Completează numele și adresa de e-mail.");
  const { db, brand, contact } = await pbcContact(input.customerName, input.customerEmail);
  const origin = pbcRequestOrigin(input); const attribution = await resolveAffiliateAttribution(brand.id, input.affiliateVisitorToken);
  const session = await stripeClient().checkout.sessions.create({ mode: "payment", customer_email: contact.email, payment_method_types: ["card"], allow_promotion_codes: true, billing_address_collection: "auto", success_url: `${origin}/prieteni-cu-beneficii/multumim?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/prieteni-cu-beneficii/checkout?anulat=1`, metadata: { customer_email: contact.email, customer_name: input.customerName, selected_products: uniqueProductIds.join(","), user_id: "guest", affiliate_attribution_id: attribution ? String(attribution.id) : "" }, line_items: uniqueProductIds.map((id) => { const product = PBC_PRODUCT_CATALOG[id]; return { quantity: 1, price_data: { currency: "ron", unit_amount: product.amountLei * 100, product_data: { name: product.name, description: product.detail } } }; }) });
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact.id, eventType: "checkout_started", metadataJson: JSON.stringify({ checkoutSessionId: session.id, products: uniqueProductIds, acceptedTerms: true, affiliateAttributionId: attribution?.id ?? null }) });
  if (!session.url) throw new Error("Nu am putut pregăti checkout-ul securizat."); return { checkoutUrl: session.url };
}

export async function getPbcCheckoutStatus(sessionId: string) { const session = await stripeClient().checkout.sessions.retrieve(sessionId); const productIds = (session.metadata?.selected_products ?? "").split(",").filter(isProduct); return { paid: session.payment_status === "paid", productIds }; }
