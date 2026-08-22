import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { completeTarotCheckout } from "./commerce/tarotService";

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    if (!ENV.stripeSecretKey || !ENV.stripeWebhookSecret) {
      return res.status(503).json({ error: "Webhook-ul Stripe nu este configurat." });
    }
    const stripe = new Stripe(ENV.stripeSecretKey);
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") return res.status(400).json({ error: "Lipsește semnătura Stripe." });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, ENV.stripeWebhookSecret);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Semnătura Stripe nu este validă." });
    }
    if (event.id.startsWith("evt_test_")) return res.json({ verified: true });

    try {
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        await completeTarotCheckout(event.data.object as Stripe.Checkout.Session, event.id);
      }
      return res.json({ received: true });
    } catch (error) {
      console.error("[Stripe webhook]", error);
      return res.status(500).json({ error: "Evenimentul nu a putut fi procesat." });
    }
  });
}
