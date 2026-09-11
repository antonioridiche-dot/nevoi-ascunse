import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateNextPayout } from "./affiliatePayouts";
import { TRPCError } from "@trpc/server";

export const affiliatePayoutRouter = router({
  /**
   * Get next payout info for an affiliate
   */
  nextPayout: publicProcedure
    .input(z.object({ affiliateId: z.number() }))
    .query(async ({ input }) => {
      try {
        const payout = await calculateNextPayout(input.affiliateId);
        if (!payout) {
          return {
            nextPayoutDate: null,
            nextPayoutAmount: 0,
            readyForPayout: false,
            readyAmount: 0,
          };
        }
        return payout;
      } catch (error) {
        console.error("[Affiliate Payout] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
