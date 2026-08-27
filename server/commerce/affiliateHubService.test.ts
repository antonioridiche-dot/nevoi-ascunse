import { describe, expect, it } from "vitest";
import { describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock("../db", () => ({ getDb: getDbMock }));

import { AFFILIATE_COMMISSION_BPS, AFFILIATE_HOLD_DAYS, AFFILIATE_MINIMUM_PAYOUT_CENTS, AFFILIATE_PAYOUT_CURRENCY, AFFILIATE_PAYOUT_SCHEDULE, affiliateCommissionReversalRecoveryPolicy, assertAffiliatePayoutRequestReview, assertAffiliatePayoutRequestTransition, calculateAffiliateCommission, canReviewAffiliatePayoutRequest, isValidRomanianPayoutIban, registerAffiliate, reverseAffiliateCommissionsForOrder, shouldQueueAffiliateCommissionReviewForLostPartialDispute, shouldQueueAffiliateCommissionReviewForPartialRefund, shouldReverseAffiliateCommissionForFullRefund, shouldReverseAffiliateCommissionForLostFullDispute } from "./affiliateHubService";

describe("affiliate hub commission policy", () => {
  it("uses the confirmed commission rate, hold period, and payout threshold", () => {
    expect(AFFILIATE_COMMISSION_BPS).toBe(5_000);
    expect(AFFILIATE_HOLD_DAYS).toBe(30);
    expect(AFFILIATE_MINIMUM_PAYOUT_CENTS).toBe(10_000);
    expect(AFFILIATE_PAYOUT_CURRENCY).toBe("ron");
    expect(AFFILIATE_PAYOUT_SCHEDULE).toContain("1 și 15");
  });

  it("calculates 50 percent only from the configured net commission base", () => {
    expect(calculateAffiliateCommission({ grossSaleAmountCents: 19_700, excludedTaxAmountCents: 2_000, excludedProcessorFeeCents: 300 })).toEqual({ excludedTaxAmountCents: 2_000, excludedProcessorFeeCents: 300, commissionBaseAmountCents: 17_400, grossCommissionAmountCents: 8_700 });
  });

  it("never produces a negative commission when exclusions exceed the sale amount", () => {
    expect(calculateAffiliateCommission({ grossSaleAmountCents: 100, excludedTaxAmountCents: 90, excludedProcessorFeeCents: 30 })).toEqual({ excludedTaxAmountCents: 90, excludedProcessorFeeCents: 30, commissionBaseAmountCents: 0, grossCommissionAmountCents: 0 });
  });
});

describe("affiliate hub payout review policy", () => {
  it("accepts only a checksum-valid Romanian IBAN for manual RON payout v1", () => {
    expect(isValidRomanianPayoutIban("RO49AAAA1B31007593840000")).toBe(true);
    expect(isValidRomanianPayoutIban("RO48AAAA1B31007593840000")).toBe(false);
    expect(isValidRomanianPayoutIban("DE89370400440532013000")).toBe(false);
  });

  it("allows the requested → approved → paid path only in that order", () => {
    expect(canReviewAffiliatePayoutRequest("requested", "approved")).toBe(true);
    expect(canReviewAffiliatePayoutRequest("approved", "paid")).toBe(true);
    expect(() => assertAffiliatePayoutRequestTransition("requested", "approved")).not.toThrow();
    expect(() => assertAffiliatePayoutRequestTransition("approved", "paid")).not.toThrow();
  });

  it("rejects premature or duplicate payment confirmation", () => {
    expect(canReviewAffiliatePayoutRequest("requested", "paid")).toBe(false);
    expect(canReviewAffiliatePayoutRequest("paid", "paid")).toBe(false);
    expect(canReviewAffiliatePayoutRequest("rejected", "approved")).toBe(false);
    expect(() => assertAffiliatePayoutRequestTransition("requested", "paid")).toThrow("requested");
    expect(() => assertAffiliatePayoutRequestTransition("paid", "paid")).toThrow("paid");
  });

  it("permits administrative rejection before bank-payment confirmation", () => {
    expect(canReviewAffiliatePayoutRequest("requested", "rejected")).toBe(true);
    expect(canReviewAffiliatePayoutRequest("approved", "rejected")).toBe(true);
  });

  it("requires a bank-transfer reference before a request can become paid", () => {
    expect(() => assertAffiliatePayoutRequestReview({ status: "approved", decision: "paid" })).toThrow("referința transferului bancar");
    expect(() => assertAffiliatePayoutRequestReview({ status: "approved", decision: "paid", payoutReference: "BT-2026-08-001" })).not.toThrow();
  });
});

describe("affiliate hub email-only registration", () => {
  it("creates an account using only email and terms acceptance", async () => {
    const values = vi.fn();
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => []) })) })) })),
      insert: vi.fn(() => ({ values })),
    };
    getDbMock.mockResolvedValue(db);

    await expect(registerAffiliate({ email: "  afiliat@example.ro ", acceptedTerms: true })).resolves.toMatchObject({ created: true, email: "afiliat@example.ro", affiliateCode: expect.stringMatching(/^NA-/) });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ email: "afiliat@example.ro", displayName: "Afiliat" }));
    await expect(registerAffiliate({ email: "afiliat@example.ro", acceptedTerms: false })).rejects.toThrow("Acceptarea termenilor");
  });
});

describe("affiliate hub automatic reversals", () => {
  it("accepts only a completed full refund for automatic reversal", () => {
    expect(shouldReverseAffiliateCommissionForFullRefund({ refundStatus: "succeeded", chargeRefunded: true, chargeAmountCents: 19_700, chargeAmountRefundedCents: 19_700 })).toBe(true);
    expect(shouldReverseAffiliateCommissionForFullRefund({ refundStatus: "pending", chargeRefunded: true, chargeAmountCents: 19_700, chargeAmountRefundedCents: 19_700 })).toBe(false);
    expect(shouldReverseAffiliateCommissionForFullRefund({ refundStatus: "succeeded", chargeRefunded: false, chargeAmountCents: 19_700, chargeAmountRefundedCents: 9_850 })).toBe(false);
  });

  it("accepts only a lost dispute that covers the full charge", () => {
    expect(shouldReverseAffiliateCommissionForLostFullDispute({ disputeStatus: "lost", disputeAmountCents: 19_700, chargeAmountCents: 19_700 })).toBe(true);
    expect(shouldReverseAffiliateCommissionForLostFullDispute({ disputeStatus: "won", disputeAmountCents: 19_700, chargeAmountCents: 19_700 })).toBe(false);
    expect(shouldReverseAffiliateCommissionForLostFullDispute({ disputeStatus: "lost", disputeAmountCents: 9_850, chargeAmountCents: 19_700 })).toBe(false);
  });

  it("queues only succeeded partial outcomes for accounting review", () => {
    expect(shouldQueueAffiliateCommissionReviewForPartialRefund({ refundStatus: "succeeded", chargeAmountCents: 19_700, chargeAmountRefundedCents: 9_850 })).toBe(true);
    expect(shouldQueueAffiliateCommissionReviewForPartialRefund({ refundStatus: "pending", chargeAmountCents: 19_700, chargeAmountRefundedCents: 9_850 })).toBe(false);
    expect(shouldQueueAffiliateCommissionReviewForLostPartialDispute({ disputeStatus: "lost", chargeAmountCents: 19_700, disputeAmountCents: 9_850 })).toBe(true);
    expect(shouldQueueAffiliateCommissionReviewForLostPartialDispute({ disputeStatus: "won", chargeAmountCents: 19_700, disputeAmountCents: 9_850 })).toBe(false);
  });

  it("reverses the ledger for a paid commission without claiming an automatic bank recovery", () => {
    expect(affiliateCommissionReversalRecoveryPolicy("paid")).toEqual({ requiresManualBankRecovery: true, recoveryMethod: "manual_bank_recovery" });
    expect(affiliateCommissionReversalRecoveryPolicy("eligible")).toEqual({ requiresManualBankRecovery: false, recoveryMethod: "not_applicable" });
  });

  it("creates one idempotent chargeback adjustment and records manual recovery for a paid commission", async () => {
    const commission = { id: 71, affiliateId: 31, brandId: 9, orderId: 44, orderItemId: 56, entryType: "commission", status: "paid", commissionRateBps: 5_000, netCommissionAmountCents: 8_700, currency: "ron" };
    const inserted: Array<Record<string, unknown>> = [];
    const updates: Array<Record<string, unknown>> = [];
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(async () => [commission]) })) })),
      update: vi.fn(() => ({ set: vi.fn((values) => ({ where: vi.fn(async () => { updates.push(values); }) })) })),
      insert: vi.fn(() => ({ values: vi.fn((values) => ({ onDuplicateKeyUpdate: vi.fn(async () => { inserted.push(values); }) })) })),
    };
    getDbMock.mockResolvedValue(db);

    await expect(reverseAffiliateCommissionsForOrder({ orderId: 44, reason: "chargeback", reference: "dp_cb_01" })).resolves.toEqual({ reversed: 1, reason: "chargeback" });
    const firstAdjustment = inserted[0];
    expect(firstAdjustment.entryType).toBe("chargeback_adjustment");
    expect(firstAdjustment.netCommissionAmountCents).toBe(-8_700);
    expect(JSON.parse(String(firstAdjustment.metadataJson))).toMatchObject({ sourceLedgerEntryId: 71, reason: "chargeback", reference: "dp_cb_01", recovery: { requiresManualBankRecovery: true, recoveryMethod: "manual_bank_recovery" } });
    expect(updates).toEqual([{ status: "reversed", reversedAt: expect.any(Date) }]);

    commission.status = "reversed";
    await expect(reverseAffiliateCommissionsForOrder({ orderId: 44, reason: "chargeback", reference: "dp_cb_01" })).resolves.toEqual({ reversed: 0, reason: "chargeback" });
    expect(inserted).toHaveLength(1);
    expect(updates).toHaveLength(1);
  });
});
