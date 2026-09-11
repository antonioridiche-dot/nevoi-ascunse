/**
 * Admin router - provides dashboard data for the admin panel.
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { contacts, orders, emailSends, affiliates, commissions, funnelEvents, abTests, emailSequences } from "../drizzle/schema";
import { eq, and, desc, count, sql, gte, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const adminRouter = router({
  // ============ OVERVIEW STATS ============
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalContacts: 0, totalOrders: 0, totalRevenue: 0, totalEmailsSent: 0, maleLeads: 0, femaleLeads: 0, conversionRate: "0" };

    const [
      contactCount, orderCount, revenueResult, emailCount,
      maleCount, femaleCount, customerCount
    ] = await Promise.all([
      db.select({ count: count() }).from(contacts),
      db.select({ count: count() }).from(orders).where(eq(orders.status, "completed")),
      db.select({ total: sql<number>`COALESCE(SUM(amountInCents), 0)` }).from(orders).where(eq(orders.status, "completed")),
      db.select({ count: count() }).from(emailSends),
      db.select({ count: count() }).from(contacts).where(eq(contacts.gender, "male")),
      db.select({ count: count() }).from(contacts).where(eq(contacts.gender, "female")),
      db.select({ count: count() }).from(contacts).where(eq(contacts.status, "customer")),
    ]);

    const total = contactCount[0]?.count || 0;
    const customers = customerCount[0]?.count || 0;
    const conversionRate = total > 0 ? ((customers / total) * 100).toFixed(1) : "0";

    return {
      totalContacts: total,
      totalOrders: orderCount[0]?.count || 0,
      totalRevenue: revenueResult[0]?.total || 0,
      totalEmailsSent: emailCount[0]?.count || 0,
      maleLeads: maleCount[0]?.count || 0,
      femaleLeads: femaleCount[0]?.count || 0,
      conversionRate,
    };
  }),

  // ============ CONTACTS LIST ============
  listContacts: adminProcedure.input(z.object({
    limit: z.number().min(1).max(200).default(25),
    offset: z.number().min(0).default(0),
    gender: z.enum(["male", "female"]).optional(),
    status: z.string().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { contacts: [], total: 0 };

    const conditions = [];
    if (input.gender) conditions.push(eq(contacts.gender, input.gender));
    if (input.status) conditions.push(eq(contacts.status, input.status as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db.select().from(contacts).where(where).orderBy(desc(contacts.createdAt)).limit(input.limit).offset(input.offset),
      db.select({ count: count() }).from(contacts).where(where),
    ]);

    return { contacts: rows, total: totalResult[0]?.count || 0 };
  }),

  // ============ PIPELINE STATS ============
  pipelineStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db.select({
      stage: contacts.pipelineStage,
      count: count(),
    }).from(contacts).groupBy(contacts.pipelineStage);

    return result;
  }),

  // ============ EMAIL STATS ============
  emailStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalSent: 0, openRate: 0, clickRate: 0, unsubscribed: 0, bySequence: [] };

    const stats = await db.select({
      status: emailSends.status,
      count: count(),
    }).from(emailSends).groupBy(emailSends.status);

    const sent = stats.find(s => s.status === "sent")?.count || 0;
    const delivered = stats.find(s => s.status === "delivered")?.count || 0;
    const opened = stats.find(s => s.status === "opened")?.count || 0;
    const clicked = stats.find(s => s.status === "clicked")?.count || 0;
    const totalDelivered = sent + delivered + opened + clicked;
    const openRate = totalDelivered > 0 ? Math.round((opened + clicked) / totalDelivered * 100) : 0;
    const clickRate = totalDelivered > 0 ? Math.round(clicked / totalDelivered * 100) : 0;

    const unsubscribed = await db.select({ count: count() }).from(contacts).where(eq(contacts.status, "unsubscribed"));

    // By sequence
    const sequences = await db.select().from(emailSequences);
    const bySequence = sequences.map(seq => ({
      name: seq.name,
      sent: 0, // Would need a join to get real numbers
      opened: 0,
      clicked: 0,
    }));

    return {
      totalSent: totalDelivered,
      openRate,
      clickRate,
      unsubscribed: unsubscribed[0]?.count || 0,
      bySequence,
    };
  }),

  // ============ EMAIL SEQUENCES ============
  emailSequences: adminProcedure.input(z.object({
    campaign: z.enum(["male", "female"]),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    // Find the sequence for this campaign
    const seqs = await db.select().from(emailSequences);
    const seq = seqs.find(s => s.name.toLowerCase().includes(input.campaign === "male" ? "barbati" : "femei") || s.name.toLowerCase().includes(input.campaign));
    if (!seq) return [];
    // Import emailSteps
    const { emailSteps } = await import("../drizzle/schema");
    return db.select().from(emailSteps).where(eq(emailSteps.sequenceId, seq.id)).orderBy(emailSteps.position);
  }),

  updateEmailSequence: adminProcedure.input(z.object({
    id: z.number(),
    subject: z.string(),
    previewText: z.string().optional(),
    bodyHtml: z.string(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { emailSteps } = await import("../drizzle/schema");
    await db.update(emailSteps).set({
      subject: input.subject,
      previewText: input.previewText || null,
      body: input.bodyHtml,
    }).where(eq(emailSteps.id, input.id));
    return { success: true };
  }),

  // ============ A/B TESTS ============
  abTests: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(abTests).orderBy(desc(abTests.createdAt));
  }),

  createAbTest: adminProcedure.input(z.object({
    name: z.string(),
    type: z.enum(["page_headline", "email_subject", "page_layout"]),
    variantA: z.string(),
    variantB: z.string(),
    gender: z.enum(["male", "female"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.insert(abTests).values({
      name: input.name,
      type: input.type,
      variants: { a: input.variantA, b: input.variantB, gender: input.gender || null },
      status: "running",
    });

    return { success: true };
  }),

  // ============ FUNNEL ANALYTICS ============
  funnelAnalytics: adminProcedure.input(z.object({
    days: z.number().min(1).max(365).default(30),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
    return db.select({
      event: funnelEvents.event,
      count: count(),
    }).from(funnelEvents)
      .where(gte(funnelEvents.createdAt, since))
      .groupBy(funnelEvents.event);
  }),
});
