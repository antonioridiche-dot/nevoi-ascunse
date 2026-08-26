import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { constructStripeWebhookEvent, stripeId } from "./stripeWebhook";

describe("Stripe webhook signature contract", () => {
  const stripe = new Stripe("sk_test_signature_contract");
  const secret = "whsec_signature_contract";
  const payload = (type: "refund.updated" | "charge.dispute.closed") => JSON.stringify({ id: `evt_test_${type.replaceAll(".", "_")}`, object: "event", type, data: { object: { id: "re_signature_contract" } } });

  it.each(["refund.updated", "charge.dispute.closed"] as const)("accepts the unmodified raw %s payload with its matching Stripe signature", (type) => {
    const body = payload(type);
    const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
    const event = constructStripeWebhookEvent({ stripe, payload: Buffer.from(body), signature, webhookSecret: secret });
    expect(event.id).toBe(`evt_test_${type.replaceAll(".", "_")}`);
    expect(event.type).toBe(type);
  });

  it("rejects a signature when the raw body was altered", () => {
    const body = payload("refund.updated");
    const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
    expect(() => constructStripeWebhookEvent({ stripe, payload: Buffer.from(`${body} `), signature, webhookSecret: secret })).toThrow();
  });

  it("normalizes Stripe object references without accepting missing identifiers", () => {
    expect(stripeId("pi_string")).toBe("pi_string");
    expect(stripeId({ id: "pi_object" })).toBe("pi_object");
    expect(stripeId(null)).toBeNull();
  });
});
