import { describe, expect, it } from "vitest";
import { AFFILIATE_COMMISSION_BPS, AFFILIATE_HOLD_DAYS, AFFILIATE_MINIMUM_PAYOUT_CENTS, AFFILIATE_PAYOUT_SCHEDULE, calculateAffiliateCommission } from "./affiliateHubService";

describe("affiliate hub commission policy", () => {
  it("uses the confirmed commission rate, hold period, and payout threshold", () => {
    expect(AFFILIATE_COMMISSION_BPS).toBe(5_000);
    expect(AFFILIATE_HOLD_DAYS).toBe(30);
    expect(AFFILIATE_MINIMUM_PAYOUT_CENTS).toBe(10_000);
    expect(AFFILIATE_PAYOUT_SCHEDULE).toContain("1 și 15");
  });

  it("calculates 50 percent only from the configured net commission base", () => {
    expect(calculateAffiliateCommission({ grossSaleAmountCents: 19_700, excludedTaxAmountCents: 2_000, excludedProcessorFeeCents: 300 })).toEqual({ excludedTaxAmountCents: 2_000, excludedProcessorFeeCents: 300, commissionBaseAmountCents: 17_400, grossCommissionAmountCents: 8_700 });
  });

  it("never produces a negative commission when exclusions exceed the sale amount", () => {
    expect(calculateAffiliateCommission({ grossSaleAmountCents: 100, excludedTaxAmountCents: 90, excludedProcessorFeeCents: 30 })).toEqual({ excludedTaxAmountCents: 90, excludedProcessorFeeCents: 30, commissionBaseAmountCents: 0, grossCommissionAmountCents: 0 });
  });
});
