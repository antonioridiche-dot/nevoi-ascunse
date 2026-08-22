import { Resend } from "resend";
import { emailMessages } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "../_core/env";

type BrandMailInput = {
  brandId: number;
  brandName: string;
  senderName: string | null;
  senderEmail: string | null;
  replyToEmail: string | null;
  contactId: number;
  recipientEmail: string;
  orderId?: number;
  templateKey: string;
  category: "transactional" | "lifecycle" | "marketing" | "operational";
  subject: string;
  html: string;
};

export async function sendBrandEmail(input: BrandMailInput) {
  if (!ENV.resendApiKey || !input.senderEmail) {
    return { sent: false as const, reason: "sender_not_configured" as const };
  }

  const resend = new Resend(ENV.resendApiKey);
  const from = input.senderName ? `${input.senderName} <${input.senderEmail}>` : input.senderEmail;
  const result = await resend.emails.send({
    from,
    to: [input.recipientEmail],
    replyTo: input.replyToEmail ?? undefined,
    subject: input.subject,
    html: input.html,
  });

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Resend nu a confirmat expedierea e-mailului.");
  }

  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă pentru auditul e-mailului.");
  await db.insert(emailMessages).values({
    brandId: input.brandId,
    contactId: input.contactId,
    orderId: input.orderId ?? null,
    templateKey: input.templateKey,
    category: input.category,
    resendEmailId: result.data.id,
    senderEmail: input.senderEmail,
    recipientEmail: input.recipientEmail,
    sentAt: new Date(),
  });

  return { sent: true as const, emailId: result.data.id };
}
