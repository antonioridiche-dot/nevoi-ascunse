/**
 * Cloudflare Worker port of the Manus scheduled / email / webhook / seed logic.
 *
 * Sources (mirrored, minus Express + Manus SDK auth):
 *   - manus-app/server/scheduledHandlers.ts (handleProcessEmails/Payouts/LeadScores)
 *   - manus-app/server/email.ts          (sendEmail / personalize / wrapInTemplate / processEmailQueue)
 *   - manus-app/server/resendWebhook.ts  (registerResendWebhook)
 *   - manus-app/server/_core/seed.ts     (seedAll + PRODUCT_SEED)
 *   - manus-app/server/seedData.ts       (EMAIL_SEED, lives at ../seedData here)
 *
 * Plain functions invoked by worker/index.ts: cron triggers and the
 * /api/cron/* + /api/resend/webhook + /api/bootstrap routes.
 */

import { eq, and, lte, isNotNull, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  contacts, emailSequences, emailSteps, emailSends, products, commissions, affiliates,
} from "../../drizzle/schema";
import { json, fail, type Env } from "./http";
import { EMAIL_SEED } from "../seedData";

// ============================================================================
// Private Resend helpers (copied from manus-app/server/email.ts, env-parameterized)
// ============================================================================

const FROM_EMAIL = "Peste Despartire <@@P1@@>";
const REPLY_TO: string[] = ["anca@pestedespartire.ro"];

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  previewText?: string;
}

/** Deployment base URL (wrangler var VITE_FRONTEND_URL) or the original placeholder. */
function siteUrl(env: Env): string {
  let raw = env.VITE_FRONTEND_URL || "";
  while (raw.endsWith("/")) raw = raw.slice(0, -1);
  return raw || "{{SITE_URL}}";
}

/**
 * Send an email via the Resend API.
 * Mirrors manus-app sendEmail(); the API key comes from env instead of process.env.
 */
async function sendResendEmail(payload: EmailPayload, apiKey: string, url: string): Promise<{ id?: string; error?: string }> {
  if (!apiKey) {
    console.warn("[Email] No RESEND_API_KEY configured, skipping send");
    return { error: "No API key" };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.to],
        reply_to: REPLY_TO,
        subject: payload.subject,
        html: payload.html,
        headers: {
          "List-Unsubscribe": "<" + url + "/unsubscribe?email=" + encodeURIComponent(payload.to) + ">",
        },
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      console.error("[Email] Send failed:", data);
      return { error: data.message || "Send failed" };
    }
    return { id: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Network error:", message);
    return { error: message };
  }
}

/** Replace personalization variables in email content (mirrors manus email.ts). */
function personalize(content: string, contact: {
  procentSanse?: number | null;
  incercariReparare?: string | null;
  firstName?: string | null;
  email?: string | null;
}): string {
  let result = content;
  const percent = String(contact.procentSanse || "50");
  result = result.split("{procent_sanse}").join(percent);
  result = result.split("{incercari_reparare}").join(contact.incercariReparare || "diverse metode");
  result = result.split("{first_name}").join(contact.firstName || "");
  result = result.split("{email}").join(contact.email || "");
  return result;
}

/**
 * Adauga codul de afiliat (?ref=...) in linkurile din email.
 *
 * De ce e nevoie: fara asta, daca omul deschide emailul pe telefon (sau in alt
 * browser, sau revine dupa o saptamana), linkul nu mai are codul de afiliat si
 * comisionul se pierde. Cu codul in link, atribuirea calatoreste odata cu linkul.
 */
/**
 * Repara linkurile malformate din textele de email (mostenite din template):
 *   "https:///www.pestedespartire.ro/x"          -> "https://www.pestedespartire.ro/x"
 *   "https://  https://www.pestedespartire.ro/x" -> "https://www.pestedespartire.ro/x"
 * Fara asta, linkul poate sa nu se deschida sau sa nu primeasca codul de afiliat.
 */
function normalizeEmailLinks(html: string): string {
  return html
    .replace(/https?:\/{3,}/gi, "https://")
    .replace(/(https?:\/\/)\s+(?=https?:\/\/)/gi, "");
}

function applyAffiliateRef(html: string, refCode: string | null | undefined): string {
  if (!refCode) return html;
  const code = encodeURIComponent(refCode);
  // Linkuri absolute catre site + linkuri relative (fara unsubscribe — ala se adauga dupa).
  return html.replace(
    /href\s*=\s*(["'])((?:https?:\/{1,3}(?:www\.)?tevreauinapoi\.ro)?\/[^"']*)\1/gi,
    (match, quote: string, target: string) => {
      if (/[?&]ref=/.test(target)) return match;
      const sep = target.includes("?") ? "&" : "?";
      return "href=" + quote + target + sep + "ref=" + code + quote;
    },
  );
}

/** Wrap email body in the standard template (mirrors manus email.ts). */
function wrapInTemplate(body: string, contact: { email?: string | null }, url: string): string {
  const unsubscribeUrl = url + "/unsubscribe?email=" + encodeURIComponent(contact.email || "");
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>',
    '<body style="font-family: Georgia, serif; font-size: 16px; line-height: 1.7; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">',
    body,
    '<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center;">',
    '<p>Cristina Munteanu — pestedespartire.ro</p>',
    '<p><a href="' + unsubscribeUrl + '" style="color: #888;">Dezabonare</a></p>',
    '</div>',
    '</body>',
    '</html>',
  ].join(String.fromCharCode(10));
}

// ============================================================================
// Scheduled / cron logic (mirrors manus scheduledHandlers.ts minus auth)
// ============================================================================

/**
 * Process the email queue: sends the step that is due for every contact whose
 * nextEmailAt has passed, logs the send into email_sends, then advances the
 * contact to the next step (scheduling nextEmailAt from the next step's delay).
 * Mirrors handleProcessEmails -> processEmailQueue in manus-app/server/email.ts.
 *
 * Deviation from the original: when env.RESEND_API_KEY is missing we bail out
 * immediately (console.warn) instead of marking every send "bounced" and
 * advancing sequences. Returns { sent, skipped } where skipped counts attempts
 * that reached Resend but failed (mirrors the original's "errors" counter).
 */
export async function processEmails(env: Env): Promise<{ sent: number; skipped: number }> {
  const apiKey = env.RESEND_API_KEY || "";
  if (!apiKey) {
    console.warn("[Email] No RESEND_API_KEY configured, skipping email queue run");
    return { sent: 0, skipped: 0 };
  }
  const url = siteUrl(env);

  const db = await getDb();
  if (!db) {
    console.warn("[Email] Database not available, skipping email queue run");
    return { sent: 0, skipped: 0 };
  }

  const now = new Date();
  let sent = 0;
  let skipped = 0;

  // Contacts who need an email sent now (batch of 50, same filter as original).
  const dueContacts = await db.select().from(contacts).where(
    and(
      eq(contacts.emailSubscribed, true),
      isNotNull(contacts.nextEmailAt),
      lte(contacts.nextEmailAt, now),
      // Only send to leads/customers (not refunded/unsubscribed)
      sql.raw("contacts.status IN ('lead', 'customer')")
    )
  ).limit(50);

  for (const contact of dueContacts) {
    try {
      // Get the sequence for this contact's gender
      const sequence = await db.select().from(emailSequences)
        .where(and(
          eq(emailSequences.gender, contact.gender),
          eq(emailSequences.type, "nurture"),
          eq(emailSequences.active, true)
        ))
        .limit(1);

      if (!sequence.length) {
        // No active sequence, clear the next email
        await db.update(contacts).set({ nextEmailAt: null }).where(eq(contacts.id, contact.id));
        continue;
      }

      const currentStep = contact.currentSequenceStep || 0;

      // Get the email step
      const step = await db.select().from(emailSteps)
        .where(and(
          eq(emailSteps.sequenceId, sequence[0].id),
          eq(emailSteps.position, currentStep)
        ))
        .limit(1);

      if (!step.length) {
        // Sequence complete, clear the next email
        await db.update(contacts).set({
          nextEmailAt: null,
          currentSequenceStep: null,
        }).where(eq(contacts.id, contact.id));
        continue;
      }

      const emailStep = step[0];

      // Codul de afiliat al contactului (daca a venit prin cineva) — il punem in
      // linkuri, ca sa nu se piarda comisionul cand cumpara mai tarziu din email.
      let refCode: string | null = null;
      if (contact.affiliateId) {
        try {
          const aff = await db.select({ referralCode: affiliates.referralCode, status: affiliates.status })
            .from(affiliates).where(eq(affiliates.id, contact.affiliateId)).limit(1);
          if (aff[0] && aff[0].status === "active") refCode = aff[0].referralCode;
        } catch (err) {
          console.error("[Email] affiliate lookup failed for contact " + contact.id + ":", (err as Error).message);
        }
      }

      // Personalize subject and body
      const subject = personalize(emailStep.subject, contact);
      const body = applyAffiliateRef(normalizeEmailLinks(personalize(emailStep.body || "", contact)), refCode);
      const html = wrapInTemplate(body, contact, url);

      // Send the email
      const result = await sendResendEmail({
        to: contact.email,
        subject,
        html,
        previewText: emailStep.previewText || undefined,
      }, apiKey, url);

      // Log the send
      await db.insert(emailSends).values({
        contactId: contact.id,
        emailStepId: emailStep.id,
        resendMessageId: result.id || null,
        status: result.error ? "bounced" : "sent",
      });

      if (result.error) {
        skipped++;
        continue;
      }

      sent++;

      // Calculate next email timing from the following step's delaySeconds
      const nextStep = currentStep + 1;
      const nextStepData = await db.select().from(emailSteps)
        .where(and(
          eq(emailSteps.sequenceId, sequence[0].id),
          eq(emailSteps.position, nextStep)
        ))
        .limit(1);

      if (nextStepData.length) {
        const delayMs = nextStepData[0].delaySeconds * 1000;
        await db.update(contacts).set({
          currentSequenceStep: nextStep,
          nextEmailAt: new Date(Date.now() + delayMs),
        }).where(eq(contacts.id, contact.id));
      } else {
        // Sequence complete
        await db.update(contacts).set({
          currentSequenceStep: null,
          nextEmailAt: null,
        }).where(eq(contacts.id, contact.id));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Email] Error processing contact " + contact.id + ":", message);
      skipped++;
    }
  }

  console.log("[Email] Queue processed: sent=" + sent + ", skipped=" + skipped);
  return { sent, skipped };
}

/**
 * Approve commissions whose 45-day hold has elapsed (payableAt <= now).
 * Mirrors handleProcessPayouts: status "pending" -> "approved".
 * (Stripe Connect transfers to affiliates with a stripeConnectAccountId are a
 * future step; the original logic is kept as-is for now.)
 * The returned field is named "paid" to match the cron route contract, but the
 * transition performed here is the original "approved" step of the manual
 * payout-evidence flow.
 */
export async function processPayouts(_env: Env): Promise<{ paid: number }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Scheduled] Database not available, skipping payout processing");
    return { paid: 0 };
  }

  const now = new Date();

  // Pasul 1: Stripe Connect — plati automate catre afiliatii cu cont conectat.
  let connectPaid = 0;
  try {
    const { processConnectPayouts } = await import("../affiliateConnect");
    const result = await processConnectPayouts();
    connectPaid = result.paid;
    if (result.failed > 0) console.warn("[Scheduled] Connect transfers failed: " + result.failed);
  } catch (err) {
    console.error("[Scheduled] Connect payouts error:", (err as Error).message);
  }

  // Pasul 2: evidenta manuala — comisioanele scadente ramase devin "approved",
  // EXCEPAND cele ale afiliatilor cu Connect activ (ale lor raman pending pana
  // depasesc pragul minim, apoi sunt transferate automat la pasul 1).
  const dueCommissions = await db.select({
    id: commissions.id,
    affiliateId: commissions.affiliateId,
    accountId: affiliates.stripeConnectAccountId,
    connectStatus: affiliates.connectStatus,
  }).from(commissions)
    .leftJoin(affiliates, eq(commissions.affiliateId, affiliates.id))
    .where(and(
      eq(commissions.status, "pending"),
      lte(commissions.payableAt!, now)
    ));

  let approved = 0;
  for (const commission of dueCommissions) {
    const autoPaid = commission.connectStatus === "active" && commission.accountId;
    if (autoPaid) continue; // raman pending — pasul 1 le plateste automat la pragul minim
    await db.update(commissions)
      .set({ status: "approved" })
      .where(eq(commissions.id, commission.id));
    approved++;
  }

  console.log("[Scheduled] Payouts processed: " + approved + " approved, " + connectPaid + " connect-transferred");
  return { paid: approved + connectPaid };
}

/**
 * Recompute lead scores from quiz score + email opens/clicks (mirrors
 * handleUpdateLeadScores, which used a raw SQL UPDATE on contacts).
 */
export async function updateLeadScores(): Promise<{ updated: number }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Scheduled] Database not available, skipping lead score update");
    return { updated: 0 };
  }

  // Score formula: base quiz score + email engagement (2 pts per open, 5 per click)
  const result = await db.run(sql.raw(
    "UPDATE contacts SET leadScore = COALESCE(procentSanse, 50) + " +
    "(SELECT COUNT(*) * 2 FROM email_sends es WHERE es.contactId = contacts.id AND es.status = 'opened') + " +
    "(SELECT COUNT(*) * 5 FROM email_sends es WHERE es.contactId = contacts.id AND es.status = 'clicked') " +
    "WHERE contacts.status IN ('lead', 'customer')"
  ));

  const meta = result.meta as any;
  const updated = (meta && typeof meta.changes === "number") ? meta.changes : 0;
  console.log("[Scheduled] Lead scores updated: " + updated);
  return { updated };
}

// ============================================================================
// Resend webhook (mirrors registerResendWebhook)
// ============================================================================

// --- Svix signature verification (Resend signs webhooks via Svix) -----------
// Resend's webhook signature scheme (used by their SDKs) is Svix's:
//   headers svix-id / svix-timestamp / svix-signature
//   message = "<id>.<timestamp>.<rawBody>"
//   signature = base64(HMAC-SHA256(signingSecretBytes, message)) in "v1,<sig>"
// The signing secret ("whsec_...") is the base64 of the raw key bytes.

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function signingKeyBytes(secret: string): Uint8Array {
  const stripped = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  try {
    const decoded = atob(stripped);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
    return bytes;
  } catch {
    // Not base64 — use the raw UTF-8 bytes of the secret as the key.
    return new TextEncoder().encode(secret);
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Base64(key: Uint8Array, message: string): Promise<string> {
  const webCrypto = (crypto as unknown as { subtle: SubtleCrypto }).subtle;
  const cryptoKey = await webCrypto.importKey(
    "raw", key.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await webCrypto.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return base64Encode(new Uint8Array(sig));
}

async function verifyResendSignature(request: Request, rawBody: string, secret: string): Promise<boolean> {
  const id = request.headers.get("svix-id") || request.headers.get("webhook-id");
  const ts = request.headers.get("svix-timestamp") || request.headers.get("webhook-timestamp");
  const signatureHeader = request.headers.get("svix-signature") || request.headers.get("webhook-signature");
  if (!id || !ts || !signatureHeader) return false;

  // Reject stale replays (Svix default tolerance is ~5 minutes).
  const timestampSec = parseInt(ts, 10);
  if (Number.isNaN(timestampSec)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSec) > 300) return false;

  const message = id + "." + ts + "." + rawBody;
  const expected = await hmacSha256Base64(signingKeyBytes(secret), message);

  for (const part of signatureHeader.split(" ")) {
    const comma = part.indexOf(",");
    if (comma === -1) continue;
    const version = part.slice(0, comma);
    const signature = part.slice(comma + 1);
    if (version !== "v1") continue;
    if (constantTimeEqual(signature, expected)) return true;
  }
  return false;
}

/**
 * POST /api/resend/webhook — updates email_sends from Resend delivery events.
 * Mirrors registerResendWebhook. When env.RESEND_WEBHOOK_SECRET is configured
 * the Svix signature is verified first (401 otherwise); without a configured
 * secret the payload is processed unverified, exactly like the original code
 * (its signature check was commented out).
 */
export async function resendWebhookHandler(request: Request, env: Env): Promise<Response> {
  try {
    // Raw body is required for signature verification, so parse manually.
    const rawBody = await request.text();
    let event: any = {};
    try {
      event = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      event = {};
    }

    // Optional signature verification (RESEND_WEBHOOK_SECRET is not yet on Env).
    const secret = (env as Env & { RESEND_WEBHOOK_SECRET?: string }).RESEND_WEBHOOK_SECRET;
    if (secret) {
      const valid = await verifyResendSignature(request, rawBody, secret);
      if (!valid) {
        console.warn("[Resend Webhook] Invalid signature rejected");
        return fail(401, "Invalid signature");
      }
    }

    const db = await getDb();
    if (!db) return json({ error: "Database unavailable" }, 500);

    const emailId = event.email_id || event.metadata?.emailSendId;
    if (!emailId) return json({ received: true });

    // Find the email send record
    const emailSend = await db
      .select()
      .from(emailSends)
      .where(eq(emailSends.id, parseInt(emailId)))
      .limit(1);

    if (!emailSend.length) {
      console.warn("[Resend Webhook] Email send not found: " + emailId);
      return json({ received: true });
    }

    // Update based on event type
    switch (event.type) {
      case "email.delivered":
        await db
          .update(emailSends)
          .set({ status: "delivered" })
          .where(eq(emailSends.id, emailSend[0].id));
        console.log("[Resend] Email " + emailId + " delivered");
        break;

      case "email.opened":
        await db
          .update(emailSends)
          .set({ status: "opened", openedAt: new Date() })
          .where(eq(emailSends.id, emailSend[0].id));
        console.log("[Resend] Email " + emailId + " opened");
        break;

      case "email.clicked":
        await db
          .update(emailSends)
          .set({ status: "clicked", clickedAt: new Date() })
          .where(eq(emailSends.id, emailSend[0].id));
        console.log("[Resend] Email " + emailId + " clicked");
        break;

      case "email.bounced":
        await db
          .update(emailSends)
          .set({ status: "bounced" })
          .where(eq(emailSends.id, emailSend[0].id));
        console.log("[Resend] Email " + emailId + " bounced");
        break;

      case "email.complained":
        await db
          .update(emailSends)
          .set({ status: "complained" })
          .where(eq(emailSends.id, emailSend[0].id));
        console.log("[Resend] Email " + emailId + " complained");
        break;

      default:
        console.log("[Resend] Unknown event type: " + event.type);
    }

    return json({ received: true });
  } catch (error) {
    console.error("[Resend Webhook] Error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

// ============================================================================
// Idempotent DB bootstrap (mirrors manus seed.ts seedAll + PRODUCT_SEED)
// ============================================================================

type InsertProduct = typeof products.$inferInsert;

/** Catalog produse: 6 PDF-uri pe gen + 2 coaching (abonamente lunare). */
const PRODUCT_SEED: InsertProduct[] = [
  { slug: "opreste-durerea-femei", name: "Cum să Oprești Durerea unei Despărțiri (Femei)", priceInCents: 6700, type: "ebook", gender: "female", fileKey: "biblia-impacarii-femei.pdf", upsellPosition: 0 },
  { slug: "opreste-durerea-barbati", name: "Cum să Oprești Durerea unei Despărțiri (Bărbați)", priceInCents: 6700, type: "ebook", gender: "male", fileKey: "biblia-impacarii-barbati.pdf", upsellPosition: 0 },
  // Bump: "Mesajele EXTRA de Împăcare" (+27 lei pe checkout).
  { slug: "mesaje-extra-barbati", name: "Mesajele EXTRA de Împăcare (Bărbați)", priceInCents: 1995, type: "ebook", gender: "male", fileKey: "mesaje-extra-barbati.pdf", upsellPosition: 0 },
  { slug: "mesaje-extra-femei", name: "Mesajele EXTRA de Împăcare (Femei)", priceInCents: 1995, type: "ebook", gender: "female", fileKey: "mesaje-extra-femei.pdf", upsellPosition: 0 },
  { slug: "zero-despartiri", name: "Zero Despărțiri (Bărbați)", priceInCents: 4700, type: "ebook", gender: "male", fileKey: "jurnalul-negru-barbati.pdf", upsellPosition: 1 },
  { slug: "zero-despartiri-femei", name: "Zero Despărțiri (Femei)", priceInCents: 4700, type: "ebook", gender: "female", fileKey: "jurnalul-negru-femei.pdf", upsellPosition: 1 },
  // Coaching: abonament lunar recurent (147 RON/luna).
  { slug: "sustinere-barbati", name: "Susținere Personală", priceInCents: 14700, type: "coaching", gender: "male", isSubscription: true, upsellPosition: 2 },
  { slug: "sustinere-femei", name: "Susținere Personală (Femei)", priceInCents: 14700, type: "coaching", gender: "female", isSubscription: true, upsellPosition: 2 },
];

/**
 * Seed products + nurture email sequences/steps (66 steps: men + women).
 * Runs once per database: when the products table already has rows it returns
 * { seeded: false } without touching anything; otherwise it inserts the product
 * catalog and syncs both nurture sequences with a per-step upsert that inserts
 * missing steps and refreshes content of existing ones (subject/preview/body/
 * delaySeconds), exactly like manus seed.ts.
 */
export async function bootstrap(env: Env): Promise<{ seeded: boolean }> {
  void env;
  const db = await getDb();
  if (!db) {
    console.warn("[bootstrap] Database not available");
    return { seeded: false };
  }

  // Idempotency gate: only seed an empty database.
  const existingProduct = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProduct.length > 0) return { seeded: false };

  // ---- Products ----
  for (const p of PRODUCT_SEED) {
    await db.insert(products).values(p);
  }

  // ---- Email sequences + steps (men + women nurture) ----
  for (const gender of ["male", "female"] as const) {
    let seq = (
      await db.select().from(emailSequences)
        .where(and(eq(emailSequences.gender, gender), eq(emailSequences.type, "nurture")))
        .limit(1)
    )[0];

    if (!seq) {
      const inserted = await db.insert(emailSequences).values({
        name: gender === "male" ? "Quiz Barbati - Nurture" : "Quiz Femei - Nurture",
        gender,
        type: "nurture",
        active: true,
      }).returning({ id: emailSequences.id });
      seq = { id: inserted[0].id } as typeof seq;
    }

    // Idempotent per-step upsert (insert missing, refresh existing content).
    for (const e of EMAIL_SEED[gender]) {
      const [step] = await db.select().from(emailSteps)
        .where(and(eq(emailSteps.sequenceId, seq.id), eq(emailSteps.position, e.position)))
        .limit(1);
      const values = {
        subject: e.subject,
        previewText: e.previewText || null,
        body: e.body,
        delaySeconds: e.delaySeconds,
        active: true,
      };
      if (step) {
        await db.update(emailSteps).set(values).where(eq(emailSteps.id, step.id));
      } else {
        await db.insert(emailSteps).values({ sequenceId: seq.id, position: e.position, ...values });
      }
    }
    console.log("[bootstrap] " + gender + " email steps synced: " + EMAIL_SEED[gender].length);
  }

  console.log("[bootstrap] products + email sequences seeded");
  return { seeded: true };
}