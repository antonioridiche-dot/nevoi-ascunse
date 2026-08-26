import { and, eq } from "drizzle-orm";
import { brands, contacts, funnelEvents } from "../../drizzle/schema";
import { getDb } from "../db";

export const calendarLifecycleEvents = ["landing_viewed", "method_viewed", "birth_form_started", "birth_form_completed", "preview_generated", "marketing_opted_in", "package_viewed", "package_selected", "cart_started", "checkout_created", "payment_form_loaded", "payment_submit_attempted", "payment_failed", "purchase_completed", "next_step_seen", "next_step_accepted", "next_step_skipped", "thank_you_viewed"] as const;
export type CalendarLifecycleEvent = (typeof calendarLifecycleEvents)[number];

export async function trackCalendarLifecycle(input: { eventType: CalendarLifecycleEvent; email?: string; visitorId?: string; productId?: string; metadata?: Record<string, unknown> }) {
  const db = await getDb(); if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "calendarul-norocului")).limit(1))[0]; if (!brand) throw new Error("Brandul Calendarul norocului nu este configurat.");
  const contact = input.email ? (await db.select().from(contacts).where(eq(contacts.email, input.email.trim().toLowerCase())).limit(1))[0] : undefined;
  await db.insert(funnelEvents).values({ brandId: brand.id, contactId: contact?.id, eventType: input.eventType, metadataJson: JSON.stringify({ visitorId: input.visitorId ?? "", productId: input.productId ?? "", ...(input.metadata ?? {}) }) });
  return { ok: true as const };
}
