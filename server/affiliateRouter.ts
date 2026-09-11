/**
 * Affiliate system router.
 * Handles affiliate registration, dashboard data, referral tracking, and payouts.
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { affiliates, affiliateReferrals, commissions, contacts, orders, payouts } from "../drizzle/schema";
import { eq, and, desc, sql, count, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { startAffiliateConnectOnboarding } from "./affiliateConnect";

export const affiliateRouter = router({
  // ============ PUBLIC: Register as affiliate ============
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      paymentMethod: z.enum(["bank_transfer", "paypal"]).default("bank_transfer"),
      paymentDetails: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if already registered
      const existing = await db.select().from(affiliates).where(eq(affiliates.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered as affiliate" });
      }

      const referralCode = nanoid(10);
      await db.insert(affiliates).values({
        name: input.name,
        email: input.email,
        referralCode,
        passwordHash: "", // Will be set on first login
        commissionPercent: 30, // 30% default
        status: "pending", // Needs admin approval
      });

      return { referralCode, status: "pending" };
    }),

  // ============ PUBLIC: Login as affiliate (simple email-based) ============
  login: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const affiliate = await db.select().from(affiliates).where(eq(affiliates.email, input.email)).limit(1);
      if (!affiliate.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Affiliate not found" });
      }

      if (affiliate[0].status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account not yet approved" });
      }

      // Return affiliate data (in production, you'd issue a JWT or session)
      return {
        id: affiliate[0].id,
        name: affiliate[0].name,
        email: affiliate[0].email,
        referralCode: affiliate[0].referralCode,
        commissionRate: affiliate[0].commissionPercent || 30,
      };
    }),

  // ============ AFFILIATE DASHBOARD DATA ============
  dashboard: publicProcedure
    .input(z.object({ affiliateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const affiliate = await db.select().from(affiliates).where(eq(affiliates.id, input.affiliateId)).limit(1);
      if (!affiliate.length) throw new TRPCError({ code: "NOT_FOUND" });

      // Get referral stats
      const referralStats = await db.select({
        totalReferrals: count(),
      }).from(affiliateReferrals).where(eq(affiliateReferrals.affiliateId, input.affiliateId));

      // Get commission stats
      const commissionStats = await db.select({
        status: commissions.status,
        total: sum(commissions.amountInCents),
        count: count(),
      }).from(commissions)
        .where(eq(commissions.affiliateId, input.affiliateId))
        .groupBy(commissions.status);

      // Get recent referrals
      const recentReferrals = await db.select({
        id: affiliateReferrals.id,
        contactId: affiliateReferrals.contactId,
        converted: affiliateReferrals.converted,
        createdAt: affiliateReferrals.createdAt,
        contactEmail: contacts.email,
        contactName: contacts.firstName,
      }).from(affiliateReferrals)
        .leftJoin(contacts, eq(affiliateReferrals.contactId, contacts.id))
        .where(eq(affiliateReferrals.affiliateId, input.affiliateId))
        .orderBy(desc(affiliateReferrals.createdAt))
        .limit(20);

      // Get payout history
      const payoutHistory = await db.select().from(payouts)
        .where(eq(payouts.affiliateId, input.affiliateId))
        .orderBy(desc(payouts.createdAt))
        .limit(10);

      // Calculate pending/approved/paid totals
      const pending = commissionStats.find(s => s.status === "pending");
      const approved = commissionStats.find(s => s.status === "approved");
      const paid = commissionStats.find(s => s.status === "paid");

      return {
        affiliate: affiliate[0],
        stats: {
          totalReferrals: referralStats[0]?.totalReferrals || 0,
          pendingCommissions: Number(pending?.total || 0),
          approvedCommissions: Number(approved?.total || 0),
          paidCommissions: Number(paid?.total || 0),
          pendingCount: Number(pending?.count || 0),
          approvedCount: Number(approved?.count || 0),
          paidCount: Number(paid?.count || 0),
        },
        recentReferrals,
        payoutHistory,
      };
    }),

  // ============ STRIPE CONNECT: start onboarding ============
  connectStart: publicProcedure
    .input(z.object({ affiliateId: z.number(), origin: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await startAffiliateConnectOnboarding(input.affiliateId, input.origin);
        return { url: result.url, accountId: result.accountId };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Connect onboarding failed" });
      }
    }),

  // ============ TRACK REFERRAL CLICK ============
  trackClick: publicProcedure
    .input(z.object({ referralCode: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false };

      const affiliate = await db.select().from(affiliates)
        .where(and(eq(affiliates.referralCode, input.referralCode), eq(affiliates.status, "active")))
        .limit(1);

      if (!affiliate.length) return { valid: false };

      // Track click (increment earned as a proxy for now)
      // In production you'd have a separate clicks table

      return { valid: true, affiliateId: affiliate[0].id };
    }),

  // ============ ADMIN: List all affiliates ============
  listAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];

      return db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
    }),

  // ============ ADMIN: Approve/reject affiliate ============
  updateStatus: protectedProcedure
    .input(z.object({
      affiliateId: z.number(),
      status: z.enum(["active", "suspended", "pending"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(affiliates).set({ status: input.status }).where(eq(affiliates.id, input.affiliateId));
      return { success: true };
    }),

  // ============ ADMIN: Process payouts ============
  processPayout: protectedProcedure
    .input(z.object({ affiliateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get all approved commissions for this affiliate
      const approvedCommissions = await db.select().from(commissions)
        .where(and(
          eq(commissions.affiliateId, input.affiliateId),
          eq(commissions.status, "approved")
        ));

      if (!approvedCommissions.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No approved commissions to pay" });
      }

      const totalAmount = approvedCommissions.reduce((sum, c) => sum + c.amountInCents, 0);

      // Create payout record
      await db.insert(payouts).values({
        affiliateId: input.affiliateId,
        amountInCents: totalAmount,
        notes: "Processing",
      });

      // Mark commissions as paid
      for (const commission of approvedCommissions) {
        await db.update(commissions).set({
          status: "paid",
          paidAt: new Date(),
        }).where(eq(commissions.id, commission.id));
      }

      // Update affiliate totals
      await db.update(affiliates).set({
        totalPaid: sql`${affiliates.totalPaid} + ${totalAmount}`,
      }).where(eq(affiliates.id, input.affiliateId));

      return { success: true, amount: totalAmount, count: approvedCommissions.length };
    }),
});
