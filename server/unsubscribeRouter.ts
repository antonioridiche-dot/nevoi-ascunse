import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { contacts, emailSends } from "../drizzle/schema";

export const unsubscribeRouter = router({
  /**
   * Unsubscribe a contact from email sequences.
   * Called from unsubscribe link in emails.
   */
  unsubscribe: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Token is base64(contactId:email)
      let contactId: number;
      try {
        const decoded = Buffer.from(input.token, "base64").toString("utf-8");
        const [id] = decoded.split(":");
        contactId = parseInt(id);
        if (!contactId) throw new Error("Invalid token");
      } catch {
        throw new Error("Invalid unsubscribe token");
      }

      // Mark contact as unsubscribed and stop email sequences
      await db
        .update(contacts)
        .set({
          status: "unsubscribed",
          emailSubscribed: false,
          currentSequenceStep: null,
        })
        .where(eq(contacts.id, contactId));

      return { success: true, message: "You have been unsubscribed from our emails." };
    }),

  /**
   * Check if a contact is unsubscribed.
   */
  isUnsubscribed: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let contactId: number;
      try {
        const decoded = Buffer.from(input.token, "base64").toString("utf-8");
        const [id] = decoded.split(":");
        contactId = parseInt(id);
        if (!contactId) throw new Error("Invalid token");
      } catch {
        return { unsubscribed: false };
      }

      const contact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1);

      return { unsubscribed: contact[0]?.status === "unsubscribed" || !contact[0]?.emailSubscribed || false };
    }),
});
