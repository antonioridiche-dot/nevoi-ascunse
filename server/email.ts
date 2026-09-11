/**
 * Email automation service.
 * Uses Resend MCP for sending emails.
 * Processes the email sequences (32 men + 34 women) on a scheduled basis.
 */
import { getDb } from "./db";
import { contacts, emailSequences, emailSteps, emailSends } from "../drizzle/schema";
import { eq, and, lte, isNotNull, sql } from "drizzle-orm";

// Resend API integration (via environment variable)
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = "Cristina Munteanu <anca@pestedespartire.ro>";
const REPLY_TO = "anca@pestedespartire.ro";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  previewText?: string;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(payload: EmailPayload): Promise<{ id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] No RESEND_API_KEY configured, skipping send");
    return { error: "No API key" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.to],
        reply_to: REPLY_TO,
        subject: payload.subject,
        html: payload.html,
        headers: {
          "List-Unsubscribe": `<{{SITE_URL}}/unsubscribe?email=${encodeURIComponent(payload.to)}>`,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[Email] Send failed:", data);
      return { error: data.message || "Send failed" };
    }

    return { id: data.id };
  } catch (err: any) {
    console.error("[Email] Network error:", err.message);
    return { error: err.message };
  }
}

/**
 * Replace personalization variables in email content
 */
function personalize(content: string, contact: any): string {
  let result = content;
  result = result.replace(/\{procent_sanse\}/g, String(contact.procentSanse || "50"));
  result = result.replace(/\{incercari_reparare\}/g, contact.incercariReparare || "diverse metode");
  result = result.replace(/\{first_name\}/g, contact.firstName || "");
  result = result.replace(/\{email\}/g, contact.email || "");
  return result;
}

/**
 * Wrap email body in the standard template
 */
function wrapInTemplate(body: string, contact: any): string {
  const unsubscribeUrl = `{{SITE_URL}}/unsubscribe?email=${encodeURIComponent(contact.email)}`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Georgia, serif; font-size: 16px; line-height: 1.7; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
${body}
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center;">
  <p>Cristina Munteanu — pestedespartire.ro</p>
  <p><a href="${unsubscribeUrl}" style="color: #888;">Dezabonare</a></p>
</div>
</body>
</html>`;
}

/**
 * Process email queue - called by heartbeat cron
 * Finds contacts who are due for their next email and sends it
 */
export async function processEmailQueue(): Promise<{ sent: number; errors: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, errors: 0 };

  const now = new Date();
  let sent = 0;
  let errors = 0;

  // Get contacts who need an email sent
  const dueContacts = await db.select().from(contacts).where(
    and(
      eq(contacts.emailSubscribed, true),
      isNotNull(contacts.nextEmailAt),
      lte(contacts.nextEmailAt, now),
      // Only send to leads (not refunded/unsubscribed)
      sql`${contacts.status} IN ('lead', 'customer')`
    )
  ).limit(50); // Process in batches of 50

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

      // Personalize subject and body
      const subject = personalize(emailStep.subject, contact);
      const body = personalize(emailStep.body || "", contact);
      const html = wrapInTemplate(body, contact);

      // Send the email
      const result = await sendEmail({
        to: contact.email,
        subject,
        html,
        previewText: emailStep.previewText || undefined,
      });

      // Log the send
      await db.insert(emailSends).values({
        contactId: contact.id,
        emailStepId: emailStep.id,
        resendMessageId: result.id || null,
        status: result.error ? "bounced" : "sent",
      });

      if (result.error) {
        errors++;
        continue;
      }

      sent++;

      // Calculate next email timing
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
    } catch (err: any) {
      console.error(`[Email] Error processing contact ${contact.id}:`, err.message);
      errors++;
    }
  }

  console.log(`[Email] Queue processed: sent=${sent}, errors=${errors}`);
  return { sent, errors };
}

/**
 * Send a transactional email (book delivery, purchase confirmation, etc.)
 */
export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  body: string;
  contactId?: number;
}): Promise<{ id?: string; error?: string }> {
  const contact = { email: opts.to, procentSanse: null, firstName: null };
  const html = wrapInTemplate(opts.body, contact);

  const result = await sendEmail({
    to: opts.to,
    subject: opts.subject,
    html,
  });

  // Log if we have a contact ID
  if (opts.contactId) {
    const db = await getDb();
    if (db) {
      await db.insert(emailSends).values({
        contactId: opts.contactId,
        emailStepId: null as any, // transactional, no step
        resendMessageId: result.id || null,
        status: result.error ? "bounced" : "sent",
      });
    }
  }

  return result;
}
