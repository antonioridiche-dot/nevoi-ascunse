import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

/**
 * O singură instanță Stripe.js pentru toate checkouturile consolidate.
 * Fluxurile individuale își păstrează propriile Elements și mecanisme de confirmare.
 */
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
