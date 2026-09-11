/**
 * Schelet de automatizare pentru plati manuale catre afiliati:
 * Wise Business, Revolut Business, PayPal Payouts.
 *
 * DE CE EXISTA: Stripe Connect acopera platile automate; metodele manuale
 * (IBAN/PayPal/Wise/Revolut) sunt trimise azi de catre administrator pe email.
 * Cand volumul creste, putem activa un provider Business aici, fara sa
 * schimbam logica de comisioane din DB.
 *
 * CUM SE ACTIVEAZA UN PROVIDER (pasii de config, o singura data):
 *  1. Cont BUSINESS la provider (Wise Business / Revolut Business / PayPal Business)
 *     + aplicatie/API token (fiecare cere o scurta aprobare cu scopul: "plati afiliati").
 *  2. Se pun cheile ca secrete Cloudflare (wrangler secret put ...) —
 *     numele sunt in Env (server/cloud/http.ts).
 *  3. Se implementeaza functia "pay" din adapterul respectiv (ex. apel REST SEPA).
 *  4. Din panoul admin, in loc de "trimite manual", se apeleaza routePayout().
 *
 * ATENTIE FISCAL: indiferent de provider, fiecare plata catre un afiliat trebuie
 * inregistrata (factura PFA/SRL sau contract PF) — vezi contabilul.
 */

export type PayoutProviderId = "stripe" | "iban" | "paypal" | "wise" | "revolut";

export interface AffiliatePayoutTarget {
  affiliateId: number;
  name: string;
  email: string;
  /** Metoda aleasa de afiliat (paypal/wise/revolut/iban) */
  method: Exclude<PayoutProviderId, "stripe">;
  /** Detaliile introduse de afiliat: IBAN / email PayPal / email Wise / tag Revolut */
  details: string;
}

export interface PayoutResult {
  ok: boolean;
  /** Referinta externa (id transfer Wise/Revolut/PayPal) */
  reference?: string;
  /** Mesaj de eroare prietenos pentru admin */
  error?: string;
  /** true daca providerul nu e inca configurat (chei lipsa) */
  notConfigured?: boolean;
}

/**
 * Configurare citita din env (secrete Cloudflare). Toate optionale:
 * pana nu punem cheile, adapterele raspund notConfigured.
 */
export interface PayoutProviderEnv {
  WISE_API_TOKEN?: string;
  WISE_PROFILE_ID?: string;
  REVOLUT_API_TOKEN?: string;
  REVOLUT_ACCOUNT_ID?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_MODE?: string; // "sandbox" | "live"
}

const envOf = (env?: PayoutProviderEnv): PayoutProviderEnv => env ?? {};

/* ============ ADAPTERE (schelet) ============ */

async function payWise(env: PayoutProviderEnv, t: AffiliatePayoutTarget, amountCents: number): Promise<PayoutResult> {
  if (!env.WISE_API_TOKEN) return { ok: false, notConfigured: true, error: "Wise Business nu e configurat inca (lipseste WISE_API_TOKEN)." };
  // TODO(wise): POST https://api.transferwise.com/v3/profiles/{profile}/transfers
  //   1. creaza "quote" (source RON -> target RON/EUR, payOut=IBAN al afiliatului din t.details)
  //   2. creaza "transfer" cu quoteId
  //   3. "fund" transferul cu contul tau de debit
  // Repornirea se face cu amountCents (in bani) — atentie la conversii valutare.
  return { ok: false, error: "Adapter Wise: de implementat (vezi TODO din server/payout/autoProviders.ts)." };
}

async function payRevolut(env: PayoutProviderEnv, t: AffiliatePayoutTarget, amountCents: number): Promise<PayoutResult> {
  if (!env.REVOLUT_API_TOKEN) return { ok: false, notConfigured: true, error: "Revolut Business nu e configurat inca (lipseste REVOLUT_API_TOKEN)." };
  // TODO(revolut): POST https://merchant.revolut.com/api/1.0/payouts (sau /api/transfers pentru SEPA)
  //   - in t.details avem IBAN-ul sau tag-ul Revolut al afiliatului.
  //   - amountCents / 100 in currency RON (sau EUR daca afiliatul are cont EUR).
  return { ok: false, error: "Adapter Revolut: de implementat (vezi TODO din server/payout/autoProviders.ts)." };
}

async function payPaypal(env: PayoutProviderEnv, t: AffiliatePayoutTarget, amountCents: number): Promise<PayoutResult> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    return { ok: false, notConfigured: true, error: "PayPal Payouts nu e configurat (lipsesc PAYPAL_CLIENT_ID/SECRET)." };
  }
  // TODO(paypal): POST /v1/payments/payouts cu:
  //   { sender_batch_header: { sender_batch_id: "aff-<id>-<ts>", email_subject: "Plata afiliat TeVreauInapoi" },
  //     items: [{ recipient_type: "EMAIL", receiver: t.email, amount: { value, currency } }] }
  //   - se ia intai access token cu client_id/secret (sandbox: api-m.sandbox.paypal.com).
  return { ok: false, error: "Adapter PayPal: de implementat (vezi TODO din server/payout/autoProviders.ts)." };
}

/* ============ RUTARE ============ */

/**
 * Apeleaza providerul automat potrivit metodei afiliatului.
 * Returneaza notConfigured=true daca nu au fost puse inca cheile Business —
 * atunci administratorul face plata manual (fluxul actual).
 */
export async function routePayout(
  env: PayoutProviderEnv | undefined,
  target: AffiliatePayoutTarget,
  amountCents: number,
): Promise<PayoutResult> {
  const e = envOf(env);
  switch (target.method) {
    case "wise": return payWise(e, target, amountCents);
    case "revolut": return payRevolut(e, target, amountCents);
    case "paypal": return payPaypal(e, target, amountCents);
    default:
      return { ok: false, error: "Metoda '" + target.method + "' nu suporta automatizare (se plateste manual prin IBAN)." };
  }
}

/** Eticheta scurta, pentru afisaj/admin. */
export function methodLabel(method: PayoutProviderId): string {
  switch (method) {
    case "stripe": return "Stripe Connect (automat)";
    case "iban": return "Transfer bancar (IBAN)";
    case "paypal": return "PayPal";
    case "wise": return "Wise";
    case "revolut": return "Revolut";
  }
}
