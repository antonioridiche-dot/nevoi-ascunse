import { getDb } from "./db";
import { affiliates, commissions, orders } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Calculate next payout date and amount for an affiliate.
 * Payouts are held for 45 days after order completion (guarantee period).
 */
export async function calculateNextPayout(affiliateId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all pending commissions (not yet paid)
  const pendingCommissions = await db
    .select()
    .from(commissions)
    .where(and(eq(commissions.affiliateId, affiliateId), eq(commissions.status, "pending")))
    .orderBy(commissions.createdAt);

  if (pendingCommissions.length === 0) {
    return {
      nextPayoutDate: null,
      nextPayoutAmount: 0,
      readyForPayout: false,
    };
  }

  // Find the earliest commission that's eligible for payout (45 days old)
  const now = Date.now();
  const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;

  let earliestReadyDate: Date | null = null;
  let readyAmount = 0;
  let nextEligibleDate: Date | null = null;

  for (const commission of pendingCommissions) {
    const createdTime = commission.createdAt.getTime();
    const eligibleTime = createdTime + fortyFiveDaysMs;

    if (eligibleTime <= now) {
      // This commission is ready for payout
      readyAmount += commission.amountInCents;
      if (!earliestReadyDate) earliestReadyDate = new Date(eligibleTime);
    } else {
      // This commission is not yet ready
      if (!nextEligibleDate || eligibleTime < nextEligibleDate.getTime()) {
        nextEligibleDate = new Date(eligibleTime);
      }
    }
  }

  return {
    nextPayoutDate: nextEligibleDate,
    nextPayoutAmount: readyAmount / 100,
    readyForPayout: readyAmount > 0,
    readyAmount: readyAmount / 100,
  };
}

/**
 * Process payouts for affiliates whose 45-day hold has expired.
 * Called by scheduled cron job.
 */
export async function processAffiliatePayouts() {
  const db = await getDb();
  if (!db) return { processed: 0, error: null };

  try {
    const now = new Date();
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

    // Find all pending commissions older than 45 days
    const eligibleCommissions = await db
      .select()
      .from(commissions)
      .where(
        and(
          eq(commissions.status, "pending"),
          lte(commissions.createdAt, fortyFiveDaysAgo)
        )
      );

    if (eligibleCommissions.length === 0) {
      return { processed: 0, message: "No commissions ready for payout" };
    }

    // Group by affiliate and calculate totals
    const payoutsByAffiliate: Record<number, number> = {};
    const commissionIds: number[] = [];

    for (const commission of eligibleCommissions) {
      payoutsByAffiliate[commission.affiliateId] =
        (payoutsByAffiliate[commission.affiliateId] || 0) + commission.amountInCents;
      commissionIds.push(commission.id);
    }

    // Update commissions to paid status
    for (const commissionId of commissionIds) {
      await db
        .update(commissions)
        .set({ status: "paid", paidAt: now })
        .where(eq(commissions.id, commissionId));
    }

    // Update affiliate totals
    for (const [affiliateIdStr, amount] of Object.entries(payoutsByAffiliate)) {
      const affiliateId = parseInt(affiliateIdStr);
      const aff = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.id, affiliateId))
        .limit(1);

      if (aff.length > 0) {
        await db
          .update(affiliates)
          .set({
            totalPaid: aff[0].totalPaid + amount,
          })
          .where(eq(affiliates.id, affiliateId));
      }
    }

    return {
      processed: commissionIds.length,
      affiliatesUpdated: Object.keys(payoutsByAffiliate).length,
      message: `Processed ${commissionIds.length} commissions for ${Object.keys(payoutsByAffiliate).length} affiliates`,
    };
  } catch (error) {
    console.error("[Affiliate Payouts] Error:", error);
    return { processed: 0, error: (error as Error).message };
  }
}
