import { eq, and, lte, isNotNull, sql, desc, count, gte } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import {
  InsertUser, users, contacts, quizResponses, orders, products,
  emailSequences, emailSteps, emailSends, affiliates, affiliateReferrals,
  commissions, abTests, funnelEvents, payouts,
  type InsertContact, type Contact, type InsertAffiliate
} from "../drizzle/schema";

let _db: DrizzleD1Database | null = null;

/**
 * Cloudflare D1 database. The binding (env.DB) is injected by the Worker
 * entry point (worker/index.ts) before any request is served.
 */
export function setDb(binding: D1Database) {
  _db = drizzle(binding);
}

export async function getDb() {
  return _db;
}

// ============ USER HELPERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.email && user.email.toLowerCase() === (process.env.ADMIN_EMAIL ?? "anca@pestedespartire.ro").toLowerCase()) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CONTACT HELPERS ============

export async function createOrUpdateContact(data: {
  email: string;
  firstName?: string;
  gender: "male" | "female";
  procentSanse?: number;
  affiliateId?: number;
  tag?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(contacts).where(eq(contacts.email, data.email)).limit(1);

  if (existing.length > 0) {
    const patch: Partial<InsertContact> = {
      firstName: data.firstName || existing[0].firstName,
      procentSanse: data.procentSanse ?? existing[0].procentSanse,
      gender: data.gender,
      tag: data.tag || existing[0].tag,
    };
    // Contactul existent nu avea afiliat, dar acum a venit prin cineva:
    // il salvam (nu suprascriem un afiliat existent — primul care l-a adus ramane).
    if (data.affiliateId && !existing[0].affiliateId) patch.affiliateId = data.affiliateId;
    await db.update(contacts).set(patch).where(eq(contacts.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(contacts).values({
    email: data.email,
    firstName: data.firstName || null,
    gender: data.gender,
    procentSanse: data.procentSanse || null,
    affiliateId: data.affiliateId || null,
    tag: data.tag || "quiz_lead",
    status: "lead",
    pipelineStage: "quiz_completed",
  }).returning({ id: contacts.id });
  return result[0].id;
}

export async function getContactByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function listContacts(opts: { limit?: number; offset?: number; gender?: "male" | "female"; status?: string }) {
  const db = await getDb();
  if (!db) return { contacts: [], total: 0 };
  const conditions = [];
  if (opts.gender) conditions.push(eq(contacts.gender, opts.gender));
  if (opts.status) conditions.push(eq(contacts.status, opts.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, totalResult] = await Promise.all([
    db.select().from(contacts).where(where).orderBy(desc(contacts.createdAt)).limit(opts.limit || 50).offset(opts.offset || 0),
    db.select({ count: count() }).from(contacts).where(where),
  ]);
  return { contacts: rows, total: totalResult[0]?.count || 0 };
}

// ============ QUIZ HELPERS ============

export async function saveQuizResponse(data: {
  contactId: number;
  answers: Record<string, any>;
  incercariReparare?: string;
  infidelitate?: string;
  durataRelatie?: string;
  timpDespartire?: string;
  initiatorDespartire?: string;
  comunicare?: string;
  sentimente?: string;
  scorFinal: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(quizResponses).values({
    contactId: data.contactId,
    answers: data.answers,
    incercariReparare: data.incercariReparare || null,
    infidelitate: data.infidelitate || null,
    durataRelatie: data.durataRelatie || null,
    timpDespartire: data.timpDespartire || null,
    initiatorDespartire: data.initiatorDespartire || null,
    comunicare: data.comunicare || null,
    sentimente: data.sentimente || null,
    scorFinal: data.scorFinal,
  });
}

// ============ FUNNEL EVENT HELPERS ============

export async function trackFunnelEvent(data: {
  contactId?: number;
  sessionId?: string;
  event: typeof funnelEvents.$inferInsert["event"];
  metadata?: any;
  gender?: "male" | "female";
  abVariant?: string;
  abTestId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(funnelEvents).values({
    contactId: data.contactId || null,
    sessionId: data.sessionId || null,
    event: data.event,
    metadata: data.metadata || null,
    gender: data.gender || null,
    abVariant: data.abVariant || null,
    abTestId: data.abTestId || null,
  });
}

// ============ ORDER HELPERS ============

export async function createOrder(data: {
  contactId: number;
  productId: number;
  amountInCents: number;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  affiliateId?: number;
  isUpsell?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values({
    contactId: data.contactId,
    productId: data.productId,
    amountInCents: data.amountInCents,
    status: "completed",
    stripePaymentIntentId: data.stripePaymentIntentId || null,
    stripeSessionId: data.stripeSessionId || null,
    affiliateId: data.affiliateId || null,
    isUpsell: data.isUpsell || false,
  }).returning({ id: orders.id });
  return result[0].id;
}

// ============ PRODUCT HELPERS ============

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.active, true));
}

// ============ EMAIL HELPERS ============

export async function getContactsNeedingEmail() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(contacts).where(
    and(
      eq(contacts.emailSubscribed, true),
      isNotNull(contacts.nextEmailAt),
      lte(contacts.nextEmailAt, now),
      eq(contacts.status, "lead")
    )
  ).limit(100);
}

export async function logEmailSend(data: {
  contactId: number;
  emailStepId: number;
  resendMessageId?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailSends).values({
    contactId: data.contactId,
    emailStepId: data.emailStepId,
    resendMessageId: data.resendMessageId || null,
    status: "sent",
  });
}

export async function getEmailSequenceForGender(gender: "male" | "female") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailSequences)
    .where(and(eq(emailSequences.gender, gender), eq(emailSequences.type, "nurture"), eq(emailSequences.active, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEmailStepByPosition(sequenceId: number, position: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailSteps)
    .where(and(eq(emailSteps.sequenceId, sequenceId), eq(emailSteps.position, position)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ AFFILIATE HELPERS ============

export async function getAffiliateByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliates).where(eq(affiliates.referralCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAffiliateByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliates).where(eq(affiliates.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAffiliate(data: InsertAffiliate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(affiliates).values(data).returning({ id: affiliates.id });
  return result[0].id;
}

export async function getPayableCommissions() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(commissions)
    .where(and(eq(commissions.status, "approved"), lte(commissions.payableAt!, now)));
}

// ============ ANALYTICS HELPERS ============

export async function getFunnelStats(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db.select({
    event: funnelEvents.event,
    count: count(),
  }).from(funnelEvents)
    .where(gte(funnelEvents.createdAt, since))
    .groupBy(funnelEvents.event);
}
