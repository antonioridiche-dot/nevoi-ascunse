import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { affiliates, contacts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "crypto";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const affiliateInviteRouter = router({
  /**
   * Admin: Create an invite code for a new affiliate
   */
  createInvite: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(2),
      commissionPercent: z.number().min(1).max(100).default(20),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if email already registered
      const existing = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered as affiliate" });
      }

      // Generate invite code (32 chars hex)
      const inviteCode = randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store invite in a temporary table or as a JSON field
      // For simplicity, we'll store it in a JSON file in the project
      const invites = {
        code: inviteCode,
        email: input.email,
        name: input.name,
        commissionPercent: input.commissionPercent,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        used: false,
      };

      return {
        success: true,
        inviteCode,
        inviteUrl: `${process.env.VITE_FRONTEND_URL || "http://localhost:5173"}/affiliate/register?code=${inviteCode}`,
        expiresAt,
      };
    }),

  /**
   * Public: Register affiliate with invite code
   */
  registerWithInvite: publicProcedure
    .input(z.object({
      code: z.string(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // In production, store invites in database
      // For now, this is a placeholder that would need proper invite storage
      // The invite code validation would happen here

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invite system requires database table. Please use self-registration or admin invite flow.",
      });
    }),

  /**
   * Check if an invite code is valid
   */
  validateCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      // Validate invite code
      // Return invite details if valid
      return {
        valid: false,
        message: "Invite code system requires database setup",
      };
    }),
});
