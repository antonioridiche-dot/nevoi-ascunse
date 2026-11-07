import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Publishable key (public, safe in the browser). Set VITE_STRIPE_PUBLISHABLE_KEY.
const key = "pk_test_51U4Q8UBCSfiSDNkT79Gjeu7NnrycgdhkbQihTHuJZcfsNyG3TNBqXyJ8SXDR9ePB1GF0WTjyjiA0cfBFB0twHTHz00OZ5j9FOw"; // Public key paired with this project's deployed Stripe account.

// Asistentul Stripe din modul test (pop-up „Instructions for LLMs”) este dezactivat:
// apare doar pentru dezvoltatori si nu are niciun rol pentru clienti.
export const stripePromise: Promise<Stripe | null> | null = key
  ? loadStripe(key, { developerTools: { assistant: { enabled: false } } } as never)
  : null;
export const STRIPE_PUBLISHABLE_SET = Boolean(key);
