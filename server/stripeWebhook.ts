import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { completeTarotCheckout } from "./commerce/tarotService";
import { recordAffiliateCommissionReview, reverseAffiliateCommissionsForStripePayment, shouldQueueAffiliateCommissionReviewForLostPartialDispute, shouldQueueAffiliateCommissionReviewForPartialRefund, shouldReverseAffiliateCommissionForFullRefund, shouldReverseAffiliateCommissionForLostFullDispute } from "./commerce/affiliateHubService";

export function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export function constructStripeWebhookEvent(input: { stripe: Stripe; payload: Buffer; signature: string; webhookSecret: string }) {
  return input.stripe.webhooks.constructEvent(input.payload, input.signature, input.webhookSecret);
}

export async function processAffiliateReversal(stripe: Stripe, event: Stripe.Event) {
  if (event.type === "refund.updated") {
    const refund = event.data.object as Stripe.Refund;
    const chargeId = stripeId(refund.charge as string | { id: string } | null | undefined);
    if (!chargeId) return { processed: false as const, reason: "refund_without_charge" };
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = stripeId(charge.payment_intent as string | { id: string } | null | undefined);
    if (!paymentIntentId) return { processed: false as const, reason: "refund_without_payment_intent" };
    if (shouldReverseAffiliateCommissionForFullRefund({ refundStatus: refund.status, chargeRefunded: charge.refunded, chargeAmountCents: charge.amount, chargeAmountRefundedCents: charge.amount_refunded })) return { processed: true as const, result: await reverseAffiliateCommissionsForStripePayment({ stripePaymentIntentId: paymentIntentId, reason: "refund", reference: refund.id }) };
    if (shouldQueueAffiliateCommissionReviewForPartialRefund({ refundStatus: refund.status, chargeAmountCents: charge.amount, chargeAmountRefundedCents: charge.amount_refunded })) return { processed: false as const, reason: "partial_refund_review", stripePaymentIntentId: paymentIntentId, reference: refund.id };
    return { processed: false as const, reason: "unconfirmed_refund" };
  }

  if (event.type === "charge.dispute.closed") {
    const dispute = event.data.object as Stripe.Dispute;
    const chargeId = stripeId(dispute.charge as string | { id: string } | null | undefined);
    if (!chargeId) return { processed: false as const, reason: "dispute_without_charge" };
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = stripeId(charge.payment_intent as string | { id: string } | null | undefined);
    if (!paymentIntentId) return { processed: false as const, reason: "dispute_without_payment_intent" };
    if (shouldReverseAffiliateCommissionForLostFullDispute({ disputeStatus: dispute.status, disputeAmountCents: dispute.amount, chargeAmountCents: charge.amount })) return { processed: true as const, result: await reverseAffiliateCommissionsForStripePayment({ stripePaymentIntentId: paymentIntentId, reason: "chargeback", reference: dispute.id }) };
    if (shouldQueueAffiliateCommissionReviewForLostPartialDispute({ disputeStatus: dispute.status, disputeAmountCents: dispute.amount, chargeAmountCents: charge.amount })) return { processed: false as const, reason: "partial_chargeback_review", stripePaymentIntentId: paymentIntentId, reference: dispute.id };
    return { processed: false as const, reason: "non_lost_dispute" };
  }

  return { processed: false as const, reason: "unsupported_event" };
}

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    if (!ENV.stripeSecretKey || !ENV.stripeWebhookSecret) {
      return res.status(503).json({ error: "Webhook-ul Stripe nu este configurat." });
    }
    const stripe = new Stripe(ENV.stripeSecretKey);
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") return res.status(400).json({ error: "Lipsește semnătura Stripe." });

    let event: Stripe.Event;
    try {
      event = constructStripeWebhookEvent({ stripe, payload: req.body as Buffer, signature, webhookSecret: ENV.stripeWebhookSecret });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Semnătura Stripe nu este validă." });
    }
    if (event.id.startsWith("evt_test_")) return res.json({ verified: true });

    try {
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        await completeTarotCheckout(event.data.object as Stripe.Checkout.Session, event.id);
      }
      if (event.type === "refund.updated" || event.type === "charge.dispute.closed") {
        const reversal = await processAffiliateReversal(stripe, event);
        if (!reversal.processed && reversal.stripePaymentIntentId && reversal.reference && (reversal.reason === "partial_refund_review" || reversal.reason === "partial_chargeback_review")) {
          await recordAffiliateCommissionReview({ providerEventId: event.id, providerEventType: event.type, stripePaymentIntentId: reversal.stripePaymentIntentId, reason: reversal.reason === "partial_refund_review" ? "partial_refund" : "partial_chargeback", reference: reversal.reference });
        }
      }
      return res.json({ received: true });
    } catch (error) {
      console.error("[Stripe webhook]", error);
      return res.status(500).json({ error: "Evenimentul nu a putut fi procesat." });
    }
  });
}
