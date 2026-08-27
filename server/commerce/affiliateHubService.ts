import { and, eq, gt, inArray, isNull, lte, sql } from "drizzle-orm";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import {
  affiliateAttributions,
  affiliateHubAccounts,
  affiliateHubLoginCodes,
  affiliateHubSessions,
  affiliateLedgerEntries,
  affiliatePayoutProfiles,
  affiliatePayoutRequestEntries,
  affiliatePayoutRequests,
  brands,
  checkoutSessions,
  funnelEvents,
  orderItems,
  orders,
  products,
  webhookDeliveries,
} from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb } from "../db";

export const AFFILIATE_COMMISSION_BPS = 5_000;
export const AFFILIATE_HOLD_DAYS = 30;
export const AFFILIATE_MINIMUM_PAYOUT_CENTS = 10_000;
export const AFFILIATE_PAYOUT_CURRENCY = "ron" as const;
export const AFFILIATE_PAYOUT_IBAN_COUNTRY = "RO" as const;
export const AFFILIATE_PAYOUT_SCHEDULE = "Cererile eligibile sunt revizuite în două batchuri lunare, la 1 și 15. După aprobare, plata manuală este confirmată în ledger după transferul bancar.";
export const AFFILIATE_TERMS_VERSION = "2026-08-v1";
const LOGIN_CODE_TTL_MS = 10 * 60 * 1_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const ATTRIBUTION_TTL_MS = AFFILIATE_HOLD_DAYS * 24 * 60 * 60 * 1_000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const canonicalRoute = (brandKey: string) => `/${brandKey}`;

export function isValidRomanianPayoutIban(value: string) {
  const iban = value.replace(/\s/g, "").toUpperCase();
  if (!/^RO\d{2}[A-Z0-9]{20}$/.test(iban)) return false;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const character of rearranged) {
    const numeric = character >= "A" && character <= "Z" ? String(character.charCodeAt(0) - 55) : character;
    for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export type AffiliatePayoutRequestStatus = "requested" | "reviewing" | "approved" | "paid" | "rejected" | "cancelled";
export type AffiliatePayoutDecision = "approved" | "rejected" | "paid";

export function canReviewAffiliatePayoutRequest(status: AffiliatePayoutRequestStatus, decision: AffiliatePayoutDecision) {
  if (decision === "approved") return status === "requested" || status === "reviewing";
  if (decision === "rejected") return status === "requested" || status === "reviewing" || status === "approved";
  return status === "approved";
}

export function assertAffiliatePayoutRequestTransition(status: AffiliatePayoutRequestStatus, decision: AffiliatePayoutDecision) {
  if (!canReviewAffiliatePayoutRequest(status, decision)) throw new Error(`Nu poți schimba cererea din starea „${status}” în „${decision}”.`);
}

export function assertAffiliatePayoutRequestReview(input: { status: AffiliatePayoutRequestStatus; decision: AffiliatePayoutDecision; payoutReference?: string }) {
  assertAffiliatePayoutRequestTransition(input.status, input.decision);
  if (input.decision === "paid" && !input.payoutReference?.trim()) throw new Error("Adaugă referința transferului bancar înainte de confirmarea plății.");
}

export function shouldReverseAffiliateCommissionForFullRefund(input: { refundStatus: string | null | undefined; chargeRefunded: boolean; chargeAmountCents: number; chargeAmountRefundedCents: number }) {
  return input.refundStatus === "succeeded" && input.chargeRefunded && input.chargeAmountCents > 0 && input.chargeAmountRefundedCents === input.chargeAmountCents;
}

export function shouldReverseAffiliateCommissionForLostFullDispute(input: { disputeStatus: string | null | undefined; disputeAmountCents: number; chargeAmountCents: number }) {
  return input.disputeStatus === "lost" && input.chargeAmountCents > 0 && input.disputeAmountCents === input.chargeAmountCents;
}

export function shouldQueueAffiliateCommissionReviewForPartialRefund(input: { refundStatus: string | null | undefined; chargeAmountCents: number; chargeAmountRefundedCents: number }) {
  return input.refundStatus === "succeeded" && input.chargeAmountCents > 0 && input.chargeAmountRefundedCents > 0 && input.chargeAmountRefundedCents < input.chargeAmountCents;
}

export function shouldQueueAffiliateCommissionReviewForLostPartialDispute(input: { disputeStatus: string | null | undefined; disputeAmountCents: number; chargeAmountCents: number }) {
  return input.disputeStatus === "lost" && input.chargeAmountCents > 0 && input.disputeAmountCents > 0 && input.disputeAmountCents < input.chargeAmountCents;
}

export function affiliateCommissionReversalRecoveryPolicy(commissionStatus: string) {
  if (commissionStatus === "paid") return { requiresManualBankRecovery: true as const, recoveryMethod: "manual_bank_recovery" as const };
  return { requiresManualBankRecovery: false as const, recoveryMethod: "not_applicable" as const };
}

export function calculateAffiliateCommission(input: { grossSaleAmountCents: number; excludedTaxAmountCents?: number; excludedProcessorFeeCents?: number }) {
  const excludedTaxAmountCents = Math.max(0, input.excludedTaxAmountCents ?? 0);
  const excludedProcessorFeeCents = Math.max(0, input.excludedProcessorFeeCents ?? 0);
  const commissionBaseAmountCents = Math.max(0, input.grossSaleAmountCents - excludedTaxAmountCents - excludedProcessorFeeCents);
  const grossCommissionAmountCents = Math.floor((commissionBaseAmountCents * AFFILIATE_COMMISSION_BPS) / 10_000);
  return { excludedTaxAmountCents, excludedProcessorFeeCents, commissionBaseAmountCents, grossCommissionAmountCents };
}

async function refreshAffiliateEligibility(db: Awaited<ReturnType<typeof database>>, affiliateId: number) {
  await db.update(affiliateLedgerEntries).set({ status: "eligible" }).where(and(eq(affiliateLedgerEntries.affiliateId, affiliateId), eq(affiliateLedgerEntries.status, "pending"), lte(affiliateLedgerEntries.eligibleAt, new Date())));
}

async function database() {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  return db;
}

async function accountFromSession(sessionToken: string) {
  const db = await database();
  const session = (await db.select().from(affiliateHubSessions).where(and(eq(affiliateHubSessions.tokenHash, sha256(sessionToken)), isNull(affiliateHubSessions.revokedAt), gt(affiliateHubSessions.expiresAt, new Date()))).limit(1))[0];
  if (!session) throw new Error("Sesiunea de afiliat nu este validă. Cere un nou cod de acces.");
  const account = (await db.select().from(affiliateHubAccounts).where(eq(affiliateHubAccounts.id, session.affiliateId)).limit(1))[0];
  if (!account || account.status !== "active") throw new Error("Contul de afiliat nu este disponibil.");
  await db.update(affiliateHubSessions).set({ lastUsedAt: new Date() }).where(eq(affiliateHubSessions.id, session.id));
  return { db, account };
}

async function uniqueAffiliateCode(db: Awaited<ReturnType<typeof database>>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `NA-${randomBytes(5).toString("hex").toUpperCase()}`;
    const existing = (await db.select().from(affiliateHubAccounts).where(eq(affiliateHubAccounts.affiliateCode, code)).limit(1))[0];
    if (!existing) return code;
  }
  throw new Error("Nu am putut genera un cod de afiliat unic.");
}

export async function listAffiliateOffers() {
  const db = await database();
  const records = await db.select({ id: brands.id, key: brands.key, displayName: brands.displayName, routeBase: brands.routeBase, status: brands.status }).from(brands).where(inArray(brands.status, ["active", "migrating"]));
  return records.map((brand) => ({ id: brand.id, key: brand.key, displayName: brand.displayName, route: canonicalRoute(brand.key), sourceStatus: brand.status }));
}

export async function registerAffiliate(input: { email: string; acceptedTerms: boolean }) {
  if (!input.acceptedTerms) throw new Error("Acceptarea termenilor programului este obligatorie.");
  const email = normalizeEmail(input.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Completează adresa de e-mail validă.");
  const displayName = "Afiliat";
  const db = await database();
  const existing = (await db.select().from(affiliateHubAccounts).where(eq(affiliateHubAccounts.email, email)).limit(1))[0];
  if (existing) return { created: false as const, affiliateCode: existing.affiliateCode, email: existing.email };
  const affiliateCode = await uniqueAffiliateCode(db);
  await db.insert(affiliateHubAccounts).values({ email, displayName, affiliateCode, termsVersion: AFFILIATE_TERMS_VERSION, termsAcceptedAt: new Date() });
  return { created: true as const, affiliateCode, email };
}

export async function requestAffiliateLoginCode(emailInput: string) {
  const db = await database();
  const email = normalizeEmail(emailInput);
  const account = (await db.select().from(affiliateHubAccounts).where(eq(affiliateHubAccounts.email, email)).limit(1))[0];
  if (!account || account.status !== "active") return { deliveryReady: false as const, accepted: true as const };
  const code = String(randomInt(100_000, 1_000_000));
  await db.insert(affiliateHubLoginCodes).values({ affiliateId: account.id, codeHash: sha256(code), expiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MS) });
  if (!ENV.resendApiKey) return { deliveryReady: false as const, accepted: true as const };
  try {
    const resend = new Resend(ENV.resendApiKey);
    const result = await resend.emails.send({ from: "Nevoi Ascunse Afiliere <afiliere@nevoi-ascunse.ro>", to: [account.email], subject: "Codul tău de acces — Afiliere Nevoi Ascunse", html: `<p>Codul tău de acces este <strong>${code}</strong>.</p><p>Codul expiră în 10 minute. Nu îl trimite nimănui.</p>` });
    if (result.error || !result.data?.id) return { deliveryReady: false as const, accepted: true as const };
    return { deliveryReady: true as const, accepted: true as const };
  } catch {
    return { deliveryReady: false as const, accepted: true as const };
  }
}

export async function verifyAffiliateLoginCode(input: { email: string; code: string }) {
  const db = await database();
  const account = (await db.select().from(affiliateHubAccounts).where(eq(affiliateHubAccounts.email, normalizeEmail(input.email))).limit(1))[0];
  if (!account || account.status !== "active" || !/^\d{6}$/.test(input.code)) throw new Error("Codul de acces este invalid sau expirat.");
  const record = (await db.select().from(affiliateHubLoginCodes).where(and(eq(affiliateHubLoginCodes.affiliateId, account.id), isNull(affiliateHubLoginCodes.consumedAt), gt(affiliateHubLoginCodes.expiresAt, new Date()))).orderBy(sql`${affiliateHubLoginCodes.createdAt} desc`).limit(1))[0];
  if (!record || !timingSafeEqual(Buffer.from(record.codeHash, "hex"), Buffer.from(sha256(input.code), "hex"))) throw new Error("Codul de acces este invalid sau expirat.");
  await db.update(affiliateHubLoginCodes).set({ consumedAt: new Date() }).where(eq(affiliateHubLoginCodes.id, record.id));
  const sessionToken = randomBytes(32).toString("hex");
  await db.insert(affiliateHubSessions).values({ affiliateId: account.id, tokenHash: sha256(sessionToken), expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
  return { sessionToken, affiliate: { displayName: account.displayName, affiliateCode: account.affiliateCode, email: account.email } };
}

export async function logoutAffiliate(sessionToken: string) {
  const db = await database();
  await db.update(affiliateHubSessions).set({ revokedAt: new Date() }).where(eq(affiliateHubSessions.tokenHash, sha256(sessionToken)));
  return { ok: true as const };
}

export async function trackAffiliateReferral(input: { offerKey: string; affiliateCode: string; visitorToken: string; landingPath: string }) {
  const db = await database();
  const [brand] = await db.select().from(brands).where(eq(brands.key, input.offerKey)).limit(1);
  const [affiliate] = await db.select().from(affiliateHubAccounts).where(and(eq(affiliateHubAccounts.affiliateCode, input.affiliateCode.trim().toUpperCase()), eq(affiliateHubAccounts.status, "active"))).limit(1);
  if (!brand || !affiliate) return { valid: false as const };
  const expiresAt = new Date(Date.now() + ATTRIBUTION_TTL_MS);
  await db.insert(affiliateAttributions).values({ affiliateId: affiliate.id, brandId: brand.id, visitorTokenHash: sha256(input.visitorToken), landingPath: input.landingPath.slice(0, 500), expiresAt }).onDuplicateKeyUpdate({ set: { affiliateId: affiliate.id, landingPath: input.landingPath.slice(0, 500), clickedAt: new Date(), expiresAt } });
  return { valid: true as const, destination: canonicalRoute(brand.key) };
}

export async function resolveAffiliateAttribution(brandId: number, visitorToken?: string) {
  if (!visitorToken) return undefined;
  const db = await database();
  return (await db.select().from(affiliateAttributions).where(and(eq(affiliateAttributions.brandId, brandId), eq(affiliateAttributions.visitorTokenHash, sha256(visitorToken)), gt(affiliateAttributions.expiresAt, new Date()))).limit(1))[0];
}

export async function createAffiliateCommissionsForOrder(checkoutSessionId: number, orderId: number) {
  const db = await database();
  const checkout = (await db.select().from(checkoutSessions).where(eq(checkoutSessions.id, checkoutSessionId)).limit(1))[0];
  if (!checkout?.affiliateAttributionId) return { created: 0 };
  const attribution = (await db.select().from(affiliateAttributions).where(and(eq(affiliateAttributions.id, checkout.affiliateAttributionId), gt(affiliateAttributions.expiresAt, new Date()))).limit(1))[0];
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!attribution || !order || order.fulfillmentStatus !== "fulfilled") return { created: 0 };
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  if (!items.length) return { created: 0 };
  const eligibleAt = new Date((order.fulfilledAt ?? order.createdAt).getTime() + ATTRIBUTION_TTL_MS);
  let allocated = 0;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const grossSaleAmountCents = index === items.length - 1 ? order.amountCents - allocated : Math.floor(order.amountCents / items.length);
    allocated += grossSaleAmountCents;
    const commission = calculateAffiliateCommission({ grossSaleAmountCents });
    await db.insert(affiliateLedgerEntries).values({ affiliateId: attribution.affiliateId, brandId: order.brandId, orderId: order.id, orderItemId: item.id, entryType: "commission", commissionRateBps: AFFILIATE_COMMISSION_BPS, grossSaleAmountCents, ...commission, netCommissionAmountCents: commission.grossCommissionAmountCents, currency: order.currency, eligibleAt, metadataJson: JSON.stringify({ attributionId: attribution.id, policy: "tax_and_processor_fee_adjustments_pending_accounting_configuration" }) }).onDuplicateKeyUpdate({ set: { metadataJson: sql`metadataJson` } });
  }
  return { created: items.length };
}

export async function reverseAffiliateCommissionsForOrder(input: { orderId: number; reason: "refund" | "chargeback"; reference?: string }) {
  const db = await database();
  const commissions = (await db.select().from(affiliateLedgerEntries).where(and(eq(affiliateLedgerEntries.orderId, input.orderId), eq(affiliateLedgerEntries.entryType, "commission")))).filter((commission) => commission.status !== "reversed");
  const reversedAt = new Date();
  for (const commission of commissions) {
    await db.update(affiliateLedgerEntries).set({ status: "reversed", reversedAt }).where(eq(affiliateLedgerEntries.id, commission.id));
    const entryType = input.reason === "refund" ? "refund_reversal" as const : "chargeback_adjustment" as const;
    const status = input.reason === "refund" ? "reversed" as const : "chargeback_adjustment" as const;
    await db.insert(affiliateLedgerEntries).values({ affiliateId: commission.affiliateId, brandId: commission.brandId, orderId: commission.orderId, orderItemId: commission.orderItemId, entryType, status, commissionRateBps: commission.commissionRateBps, grossSaleAmountCents: 0, excludedTaxAmountCents: 0, excludedProcessorFeeCents: 0, commissionBaseAmountCents: 0, grossCommissionAmountCents: 0, withholdingAmountCents: 0, netCommissionAmountCents: -Math.abs(commission.netCommissionAmountCents), currency: commission.currency, eligibleAt: reversedAt, reversedAt, metadataJson: JSON.stringify({ sourceLedgerEntryId: commission.id, reason: input.reason, reference: input.reference?.trim() || null, recovery: affiliateCommissionReversalRecoveryPolicy(commission.status) }) }).onDuplicateKeyUpdate({ set: { metadataJson: sql`metadataJson`, reversedAt } });
  }
  return { reversed: commissions.length, reason: input.reason };
}

export async function reverseAffiliateCommissionsForStripePayment(input: { stripePaymentIntentId: string; reason: "refund" | "chargeback"; reference?: string }) {
  const db = await database();
  const order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, input.stripePaymentIntentId)).limit(1))[0];
  if (!order) return { found: false as const, reversed: 0 };
  const result = await reverseAffiliateCommissionsForOrder({ orderId: order.id, reason: input.reason, reference: input.reference });
  if (input.reason === "refund") await db.update(orders).set({ fulfillmentStatus: "refunded" }).where(eq(orders.id, order.id));
  return { found: true as const, orderId: order.id, ...result };
}

export async function recordAffiliateCommissionReview(input: { providerEventId: string; providerEventType: string; stripePaymentIntentId: string; reason: "partial_refund" | "partial_chargeback"; reference?: string }) {
  const db = await database();
  const existing = (await db.select().from(webhookDeliveries).where(and(eq(webhookDeliveries.provider, "stripe"), eq(webhookDeliveries.providerEventId, input.providerEventId))).limit(1))[0];
  if (existing) return { recorded: false as const };
  await db.insert(webhookDeliveries).values({ provider: "stripe", providerEventId: input.providerEventId, eventType: `${input.providerEventType}:accounting_review`, processingStatus: "received" });
  const order = (await db.select().from(orders).where(eq(orders.stripePaymentIntentId, input.stripePaymentIntentId)).limit(1))[0];
  if (order) {
    await db.insert(funnelEvents).values({ brandId: order.brandId, contactId: order.contactId, orderId: order.id, eventType: "affiliate_commission_review_required", metadataJson: JSON.stringify({ reason: input.reason, stripePaymentIntentId: input.stripePaymentIntentId, reference: input.reference?.trim() || null, providerEventId: input.providerEventId }) });
  }
  await db.update(webhookDeliveries).set({ processingStatus: "processed", processedAt: new Date() }).where(and(eq(webhookDeliveries.provider, "stripe"), eq(webhookDeliveries.providerEventId, input.providerEventId)));
  return { recorded: true as const, orderId: order?.id ?? null };
}

export async function affiliateDashboard(sessionToken: string) {
  const { db, account } = await accountFromSession(sessionToken);
  await refreshAffiliateEligibility(db, account.id);
  const offers = await listAffiliateOffers();
  const ledger = await db.select().from(affiliateLedgerEntries).where(eq(affiliateLedgerEntries.affiliateId, account.id)).orderBy(sql`${affiliateLedgerEntries.createdAt} desc`);
  const clicks = await db.select({ brandId: affiliateAttributions.brandId, count: sql<number>`count(*)` }).from(affiliateAttributions).where(eq(affiliateAttributions.affiliateId, account.id)).groupBy(affiliateAttributions.brandId);
  const now = new Date();
  const totals = ledger.reduce((state, item) => {
    const amount = item.netCommissionAmountCents;
    if (item.status === "pending" && item.eligibleAt <= now) state.eligible += amount;
    else if (item.status === "pending") state.pending += amount;
    else if (item.status === "eligible") state.eligible += amount;
    else if (item.status === "paid") state.paid += amount;
    else if ((item.status === "reversed" || item.status === "chargeback_adjustment") && item.entryType !== "commission") state.reversed += Math.abs(amount);
    return state;
  }, { pending: 0, eligible: 0, paid: 0, reversed: 0 });
  const profile = (await db.select().from(affiliatePayoutProfiles).where(eq(affiliatePayoutProfiles.affiliateId, account.id)).limit(1))[0];
  const payouts = await db.select().from(affiliatePayoutRequests).where(eq(affiliatePayoutRequests.affiliateId, account.id)).orderBy(sql`${affiliatePayoutRequests.requestedAt} desc`);
  return { affiliate: { displayName: account.displayName, email: account.email, affiliateCode: account.affiliateCode }, offers: offers.map((offer) => ({ ...offer, link: `/afiliere/${offer.key}/${account.affiliateCode}`, clicks: Number(clicks.find((item) => item.brandId === offer.id)?.count ?? 0) })), totals, payoutProfile: profile ? { verificationStatus: profile.verificationStatus, payoutCurrency: profile.payoutCurrency } : null, payouts, commissionPolicy: { rateBps: AFFILIATE_COMMISSION_BPS, holdDays: AFFILIATE_HOLD_DAYS, minimumPayoutCents: AFFILIATE_MINIMUM_PAYOUT_CENTS, currency: "ron", payoutSchedule: AFFILIATE_PAYOUT_SCHEDULE } };
}

export async function submitAffiliatePayoutProfile(sessionToken: string, input: { legalName: string; beneficiaryType: "individual" | "pfa" | "company"; taxResidenceCountry: string; legalAddress: string; taxIdentifier?: string; iban: string; bic?: string; payoutCurrency: typeof AFFILIATE_PAYOUT_CURRENCY }) {
  const { db, account } = await accountFromSession(sessionToken);
  const legalName = input.legalName.trim(); const country = input.taxResidenceCountry.trim().toUpperCase(); const iban = input.iban.replace(/\s/g, "").toUpperCase();
  if (legalName.length < 2 || !/^[A-Z]{2}$/.test(country) || input.legalAddress.trim().length < 5) throw new Error("Completează datele de retragere valide.");
  if (input.payoutCurrency !== AFFILIATE_PAYOUT_CURRENCY) throw new Error("În această versiune, profilurile de payout sunt acceptate numai în RON.");
  if (!isValidRomanianPayoutIban(iban)) throw new Error("În această versiune, retragerile manuale în RON necesită un IBAN românesc valid. Rezidența fiscală este revizuită separat de administrator.");
  await db.insert(affiliatePayoutProfiles).values({ affiliateId: account.id, legalName, beneficiaryType: input.beneficiaryType, taxResidenceCountry: country, legalAddress: input.legalAddress.trim(), taxIdentifier: input.taxIdentifier?.trim() || null, iban, bic: input.bic?.trim().toUpperCase() || null, payoutCurrency: AFFILIATE_PAYOUT_CURRENCY, verificationStatus: "submitted" }).onDuplicateKeyUpdate({ set: { legalName, beneficiaryType: input.beneficiaryType, taxResidenceCountry: country, legalAddress: input.legalAddress.trim(), taxIdentifier: input.taxIdentifier?.trim() || null, iban, bic: input.bic?.trim().toUpperCase() || null, payoutCurrency: AFFILIATE_PAYOUT_CURRENCY, verificationStatus: "submitted", verifiedAt: null } });
  return { submitted: true as const };
}

export async function requestAffiliatePayout(sessionToken: string) {
  const { db, account } = await accountFromSession(sessionToken);
  await refreshAffiliateEligibility(db, account.id);
  const profile = (await db.select().from(affiliatePayoutProfiles).where(eq(affiliatePayoutProfiles.affiliateId, account.id)).limit(1))[0];
  if (!profile || profile.verificationStatus !== "approved") throw new Error("Profilul de retragere trebuie verificat înainte de a cere plata.");
  if (profile.payoutCurrency !== AFFILIATE_PAYOUT_CURRENCY) throw new Error("Profilul de payout nu este eligibil: versiunea actuală acceptă numai retrageri manuale în RON.");
  const entries = await db.select().from(affiliateLedgerEntries).where(and(eq(affiliateLedgerEntries.affiliateId, account.id), eq(affiliateLedgerEntries.status, "eligible"))).orderBy(affiliateLedgerEntries.createdAt);
  const claimed = await db.select({ ledgerEntryId: affiliatePayoutRequestEntries.ledgerEntryId }).from(affiliatePayoutRequestEntries).innerJoin(affiliatePayoutRequests, eq(affiliatePayoutRequestEntries.payoutRequestId, affiliatePayoutRequests.id)).where(inArray(affiliatePayoutRequests.status, ["requested", "reviewing", "approved", "paid"]));
  const claimedIds = new Set(claimed.map((entry) => entry.ledgerEntryId));
  const available = entries.filter((entry) => entry.currency === AFFILIATE_PAYOUT_CURRENCY && !claimedIds.has(entry.id));
  const amount = available.reduce((sum, entry) => sum + entry.netCommissionAmountCents, 0);
  if (amount < AFFILIATE_MINIMUM_PAYOUT_CENTS) throw new Error("Soldul eligibil nu a atins pragul minim de 100 RON.");
  const inserted = await db.insert(affiliatePayoutRequests).values({ affiliateId: account.id, payoutProfileId: profile.id, requestedAmountCents: amount, currency: AFFILIATE_PAYOUT_CURRENCY });
  const payoutRequestId = Number(inserted[0].insertId);
  await db.insert(affiliatePayoutRequestEntries).values(available.map((entry) => ({ payoutRequestId, ledgerEntryId: entry.id })));
  return { requested: true as const, payoutRequestId, amountCents: amount, currency: AFFILIATE_PAYOUT_CURRENCY };
}

export async function affiliateAdminSnapshot() {
  const db = await database();
  const profiles = await db.select({ id: affiliatePayoutProfiles.id, affiliateId: affiliateHubAccounts.id, affiliateName: affiliateHubAccounts.displayName, email: affiliateHubAccounts.email, legalName: affiliatePayoutProfiles.legalName, beneficiaryType: affiliatePayoutProfiles.beneficiaryType, taxResidenceCountry: affiliatePayoutProfiles.taxResidenceCountry, payoutCurrency: affiliatePayoutProfiles.payoutCurrency, verificationStatus: affiliatePayoutProfiles.verificationStatus, createdAt: affiliatePayoutProfiles.createdAt }).from(affiliatePayoutProfiles).innerJoin(affiliateHubAccounts, eq(affiliatePayoutProfiles.affiliateId, affiliateHubAccounts.id)).orderBy(sql`${affiliatePayoutProfiles.createdAt} desc`);
  const payoutRequests = await db.select({ id: affiliatePayoutRequests.id, affiliateId: affiliateHubAccounts.id, affiliateName: affiliateHubAccounts.displayName, email: affiliateHubAccounts.email, requestedAmountCents: affiliatePayoutRequests.requestedAmountCents, currency: affiliatePayoutRequests.currency, status: affiliatePayoutRequests.status, requestedAt: affiliatePayoutRequests.requestedAt, payoutReference: affiliatePayoutRequests.payoutReference }).from(affiliatePayoutRequests).innerJoin(affiliateHubAccounts, eq(affiliatePayoutRequests.affiliateId, affiliateHubAccounts.id)).orderBy(sql`${affiliatePayoutRequests.requestedAt} desc`);
  const accountingReviews = await db.select({ id: funnelEvents.id, brandId: funnelEvents.brandId, orderId: funnelEvents.orderId, metadataJson: funnelEvents.metadataJson, occurredAt: funnelEvents.occurredAt }).from(funnelEvents).where(eq(funnelEvents.eventType, "affiliate_commission_review_required")).orderBy(sql`${funnelEvents.occurredAt} desc`);
  return { profiles, payoutRequests, accountingReviews, automatedTransfersEnabled: false as const, message: "Transferurile nu sunt inițiate automat. Marchează o cerere ca plătită numai după confirmarea transferului bancar." };
}

export async function reviewAffiliatePayoutProfile(input: { payoutProfileId: number; decision: "approved" | "rejected" }) {
  const db = await database();
  const profile = (await db.select().from(affiliatePayoutProfiles).where(eq(affiliatePayoutProfiles.id, input.payoutProfileId)).limit(1))[0];
  if (!profile) throw new Error("Profilul de payout nu există.");
  if (input.decision === "approved" && profile.payoutCurrency !== AFFILIATE_PAYOUT_CURRENCY) throw new Error("În această versiune pot fi aprobate numai profiluri de payout în RON.");
  await db.update(affiliatePayoutProfiles).set({ verificationStatus: input.decision, verifiedAt: input.decision === "approved" ? new Date() : null }).where(eq(affiliatePayoutProfiles.id, profile.id));
  return { updated: true as const };
}

export async function reviewAffiliatePayoutRequest(input: { payoutRequestId: number; decision: "approved" | "rejected" | "paid"; payoutReference?: string }) {
  const db = await database();
  const request = (await db.select().from(affiliatePayoutRequests).where(eq(affiliatePayoutRequests.id, input.payoutRequestId)).limit(1))[0];
  if (!request) throw new Error("Cererea de payout nu există.");
  assertAffiliatePayoutRequestReview({ status: request.status as AffiliatePayoutRequestStatus, decision: input.decision, payoutReference: input.payoutReference });
  await db.update(affiliatePayoutRequests).set({ status: input.decision, payoutReference: input.decision === "paid" ? input.payoutReference?.trim() || null : request.payoutReference, reviewedAt: input.decision === "approved" || input.decision === "rejected" ? new Date() : request.reviewedAt, paidAt: input.decision === "paid" ? new Date() : request.paidAt }).where(eq(affiliatePayoutRequests.id, request.id));
  if (input.decision === "paid") {
    const entries = await db.select({ ledgerEntryId: affiliatePayoutRequestEntries.ledgerEntryId }).from(affiliatePayoutRequestEntries).where(eq(affiliatePayoutRequestEntries.payoutRequestId, request.id));
    if (entries.length) await db.update(affiliateLedgerEntries).set({ status: "paid" }).where(inArray(affiliateLedgerEntries.id, entries.map((entry) => entry.ledgerEntryId)));
  }
  return { updated: true as const };
}
