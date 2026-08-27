import { eq } from "drizzle-orm";
import { brands, funnelEvents } from "../../drizzle/schema";
import { getDb } from "../db";

export const linisteLifecycleEvents = ["quiz_completed"] as const;
export type LinisteLifecycleEvent = (typeof linisteLifecycleEvents)[number];

export async function trackLinisteLifecycle(input: { eventType: LinisteLifecycleEvent; quizResult: "bani" | "sanatate" | "anxietate" | "eliberare" | "iubire"; visitorId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Baza de date nu este disponibilă.");
  const brand = (await db.select().from(brands).where(eq(brands.key, "liniste-audio")).limit(1))[0];
  if (!brand) throw new Error("Brandul Liniște Audio nu este configurat.");
  await db.insert(funnelEvents).values({ brandId: brand.id, eventType: input.eventType, metadataJson: JSON.stringify({ quizResult: input.quizResult, visitorId: input.visitorId, marketingConsent: false }) });
  return { ok: true as const };
}
