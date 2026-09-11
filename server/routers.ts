import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createOrUpdateContact, saveQuizResponse, trackFunnelEvent,
  getContactByEmail, listContacts, updateContact, getContactById,
  getAffiliateByCode, getAffiliateByEmail, createAffiliate,
  listProducts, getProductBySlug, getFunnelStats, getDb
} from "./db";
import { calculateScore } from "../shared/quizData";
import { affiliateRouter } from "./affiliateRouter";
import { startAffiliateConnectOnboarding, getConnectBalance, createExpressLoginLink, payOutAffiliate, CONNECT_MIN_PAYOUT_CENTS, sendAffiliateEmail, payoutEmailHtml, linkEmailHtml } from "./affiliateConnect";
import { createAffiliateSession, resolveAffiliateSession, revokeAffiliateSession } from "./affiliateSession";

// Praguri de retragere (in lei):
//  - Stripe (automat): FARA prag — afiliatul retrage orice suma scadenta.
//  - Manual (IBAN): minim 50 lei, ca sa merite transferul bancar.
const MANUAL_MIN_PAYOUT_LEI = 50;
const MANUAL_MIN_PAYOUT_CENTS = MANUAL_MIN_PAYOUT_LEI * 100;
import { adminRouter } from "./adminRouter";
import { financeRouter } from "./financeRouter";
import { contacts, orders, emailSends, affiliates, affiliateReferrals, affiliateLoginCodes, commissions, funnelEvents, emailSteps, emailSequences, payouts } from "../drizzle/schema";
import { eq, and, desc, count, sql, gte, lte, inArray, or, isNull } from "drizzle-orm";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

/**
 * Ia afiliatul din token-ul de sesiune.
 *
 * Toate procedurile care ating datele sau banii unui afiliat trec prin aici.
 * Inainte primeau direct "affiliateId" din browser, deci oricine nimerea un id
 * putea citi datele altui afiliat (inclusiv IBAN-ul). Acum id-ul nu mai vine
 * niciodata din client — se deduce pe server din token.
 */
async function affiliateFromToken(token: string) {
  const affiliate = await resolveAffiliateSession(token);
  if (!affiliate) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sesiunea a expirat. Intră din nou în cont cu codul primit pe email.",
    });
  }
  return affiliate;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.resHeaders.append("Set-Cookie", "tvii_admin=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
      return { success: true } as const;
    }),
    adminLogin: publicProcedure.input(z.object({ email: z.string().email(), secret: z.string() })).mutation(async ({ input, ctx }) => {
      const { ENV } = await import("./_core/env");
      if (input.email.trim().toLowerCase() !== ENV.adminEmail.trim().toLowerCase() || input.secret !== ENV.adminSecret) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credențiale incorecte." });
      }
      const { SignJWT } = await import("jose");
      const token = await new SignJWT({ email: input.email.trim(), role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(new TextEncoder().encode(ENV.cookieSecret));
      ctx.resHeaders.append("Set-Cookie", "tvii_admin=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000" + (ENV.isProduction ? "; Secure" : ""));
      return { success: true } as const;
    }),
  }),

  // ============ QUIZ ============
  quiz: router({
    // Capture an email from the sales page for visitors who did NOT come from
    // the quiz (they never entered their email). Stores the contact so the
    // checkout + download flow works for them too.
    captureEmail: publicProcedure.input(z.object({
      email: z.string().email(),
      gender: z.enum(["male", "female"]),
      affiliateCode: z.string().optional(),
    })).mutation(async ({ input }) => {
      let affiliateId: number | undefined;
      if (input.affiliateCode) {
        const aff = await getAffiliateByCode(input.affiliateCode);
        if (aff) affiliateId = aff.id;
      }
      const contactId = await createOrUpdateContact({
        email: input.email,
        gender: input.gender,
        affiliateId,
        tag: "sales_lead",
      });
      await trackFunnelEvent({
        contactId,
        event: "sales_page_viewed",
        gender: input.gender,
        metadata: { source: "email_captured" },
      });
      return { success: true, contactId };
    }),

    submit: publicProcedure.input(z.object({
      email: z.string().email(),
      gender: z.enum(["male", "female"]),
      answers: z.record(z.string(), z.array(z.number())),
      firstName: z.string().optional(),
      affiliateCode: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Calculate score server-side
      const numericAnswers: Record<number, number[]> = {};
      for (const [key, val] of Object.entries(input.answers)) {
        numericAnswers[parseInt(key)] = val;
      }
      const score = calculateScore(numericAnswers);

      // Resolve affiliate
      let affiliateId: number | undefined;
      if (input.affiliateCode) {
        const aff = await getAffiliateByCode(input.affiliateCode);
        if (aff) affiliateId = aff.id;
      }

      // Create or update contact
      const contactId = await createOrUpdateContact({
        email: input.email,
        firstName: input.firstName,
        gender: input.gender,
        procentSanse: score,
        affiliateId,
        tag: "quiz_lead",
      });

      // Extract key answers for personalization
      const resolvedAnswers: Record<string, string> = {};
      for (const [key, val] of Object.entries(input.answers)) {
        resolvedAnswers[`question_${key}`] = val.join(", ");
      }

      // Save quiz response
      await saveQuizResponse({
        contactId,
        answers: resolvedAnswers,
        incercariReparare: resolvedAnswers["question_15"] || undefined,
        infidelitate: resolvedAnswers["question_9"] || undefined,
        durataRelatie: resolvedAnswers["question_4"] || undefined,
        comunicare: resolvedAnswers["question_8"] || undefined,
        scorFinal: score,
      });

      // Start email sequence for this contact
      const db = await getDb();
      if (db) {
        const seq = await db.select().from(emailSequences)
          .where(and(eq(emailSequences.gender, input.gender), eq(emailSequences.type, "nurture")))
          .limit(1);
        if (seq.length > 0) {
          // Get first step delay
          const firstStep = await db.select().from(emailSteps)
            .where(and(eq(emailSteps.sequenceId, seq[0].id), eq(emailSteps.position, 0)))
            .limit(1);
          const delayMs = firstStep.length > 0 ? firstStep[0].delaySeconds * 1000 : 3 * 60 * 60 * 1000;
          await updateContact(contactId, {
            currentSequenceStep: 0,
            sequenceStartedAt: new Date(),
            nextEmailAt: new Date(Date.now() + delayMs),
          });
        }
      }

      // Track funnel event
      await trackFunnelEvent({
        contactId,
        event: "quiz_completed",
        gender: input.gender,
        metadata: { score },
      });

      return { success: true, score, contactId };
    }),
  }),

  // ============ CONTACTS (Admin) ============
  contacts: router({
    list: adminProcedure.input(z.object({
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
      gender: z.enum(["male", "female"]).optional(),
      status: z.string().optional(),
    })).query(async ({ input }) => {
      return listContacts(input);
    }),

    get: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const contact = await getContactById(input.id);
      if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
      return contact;
    }),

    update: adminProcedure.input(z.object({
      id: z.number(),
      tag: z.string().optional(),
      status: z.enum(["lead", "customer", "refunded", "unsubscribed"]).optional(),
      pipelineStage: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateContact(id, data as any);
      return { success: true };
    }),
  }),

  // ============ PRODUCTS (Admin) ============
  products: router({
    list: publicProcedure.query(async () => {
      return listProducts();
    }),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return getProductBySlug(input.slug);
    }),
  }),

  // ============ ANALYTICS (Admin) ============
  analytics: router({
    funnelStats: adminProcedure.input(z.object({
      days: z.number().min(1).max(365).default(30),
    })).query(async ({ input }) => {
      return getFunnelStats(input.days);
    }),

    overview: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { totalContacts: 0, totalOrders: 0, totalRevenue: 0, totalAffiliates: 0 };
      const [contactCount, orderCount, revenueResult, affiliateCount] = await Promise.all([
        db.select({ count: count() }).from(contacts),
        db.select({ count: count() }).from(orders).where(eq(orders.status, "completed")),
        db.select({ total: sql<number>`COALESCE(SUM(amountInCents), 0)` }).from(orders).where(eq(orders.status, "completed")),
        db.select({ count: count() }).from(affiliates).where(eq(affiliates.status, "active")),
      ]);
      return {
        totalContacts: contactCount[0]?.count || 0,
        totalOrders: orderCount[0]?.count || 0,
        totalRevenue: (revenueResult[0]?.total || 0) / 100,
        totalAffiliates: affiliateCount[0]?.count || 0,
      };
    }),

    emailStats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { sent: 0, opened: 0, clicked: 0, bounced: 0 };
      const stats = await db.select({
        status: emailSends.status,
        count: count(),
      }).from(emailSends).groupBy(emailSends.status);
      const result: Record<string, number> = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
      stats.forEach(s => { result[s.status] = s.count; });
      return result;
    }),
  }),

  // ============ AFFILIATES ============
  affiliates: router({
    register: publicProcedure.input(z.object({
      email: z.string().email(),
      name: z.string().min(2).optional(),
      password: z.string().min(6),
    })).mutation(async ({ input }) => {
      const existing = await getAffiliateByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });

      // Simple hash (in production use bcrypt)
      const { createHash } = await import("crypto");
      const passwordHash = createHash("sha256").update(input.password).digest("hex");

      // Numele nu mai e obligatoriu: folosim prefixul emailului ca nume afisabil.
      const displayName = (input.name || "").trim() || input.email.split("@")[0] || "Afiliat";
      const { nanoid } = await import("nanoid");
      const code = "aff-" + nanoid(8);

      const id = await createAffiliate({
        email: input.email,
        name: displayName,
        passwordHash,
        referralCode: code,
        status: "active",
      });

      return { success: true, referralCode: code, id };
    }),

    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string(),
    })).mutation(async ({ input }) => {
      const affiliate = await getAffiliateByEmail(input.email);
      if (!affiliate) throw new TRPCError({ code: "NOT_FOUND", message: "Affiliate not found" });

      const { createHash } = await import("crypto");
      const hash = createHash("sha256").update(input.password).digest("hex");
      if (hash !== affiliate.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });

      return { success: true, affiliate: { id: affiliate.id, name: affiliate.name, email: affiliate.email, referralCode: affiliate.referralCode } };
    }),

    // Inregistreaza click-ul pe un link de afiliat (apelat automat de site
    // cand cineva ajunge cu ?ref=COD — pe orice pagina).
    trackClick: publicProcedure
      .input(z.object({ referralCode: z.string().min(1).max(60), path: z.string().max(300).optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { ok: false };
        const aff = await db.select().from(affiliates)
          .where(and(eq(affiliates.referralCode, input.referralCode), eq(affiliates.status, "active")))
          .limit(1);
        if (!aff.length) return { ok: false };
        try {
          const ip = ctx.headers?.get("cf-connecting-ip") || ctx.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
          await db.insert(affiliateReferrals).values({
            affiliateId: aff[0].id,
            ipAddress: ip,
            landingPage: input.path || null,
            converted: false,
          });
        } catch (err) { console.error("[Affiliates] trackClick error:", (err as Error).message); }
        return { ok: true };
      }),

    // ============ LINK DE ACCES PE EMAIL ============
    // Nu mai exista cod de 6 cifre si nu mai exista pagini separate de login si
    // de inregistrare: afiliatul scrie emailul, primeste un link, apasa si intra.
    // Daca emailul nu are cont, contul se creeaza automat (prima intrare = inregistrare).
    requestLink: publicProcedure
      .input(z.object({
        email: z.string().email(),
        origin: z.string().max(200).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const email = input.email.trim().toLowerCase();

        // Anti-spam: maximum un link pe minut pentru acelasi email.
        const recent = await db.select({ id: affiliateLoginCodes.id })
          .from(affiliateLoginCodes)
          .where(and(
            eq(affiliateLoginCodes.email, email),
            gte(affiliateLoginCodes.createdAt, new Date(Date.now() - 60 * 1000)),
          ))
          .limit(1);
        if (recent.length) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Ai cerut deja un link acum câteva secunde. Verifică emailul (și folderul Spam)." });
        }

        // Contul se creeaza la prima cerere — nu mai exista pas separat de inregistrare.
        let affiliate = await getAffiliateByEmail(email);
        const created = !affiliate;
        if (!affiliate) {
          const displayName = email.split("@")[0] || "Afiliat";
          const { nanoid } = await import("nanoid");
          await createAffiliate({
            email,
            name: displayName,
            passwordHash: "",
            referralCode: "aff-" + nanoid(8),
            status: "active",
          });
          affiliate = await getAffiliateByEmail(email);
        }
        if (!affiliate) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Nu am putut pregăti contul. Scrie-mi la anca@pestedespartire.ro." });
        if (affiliate.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Contul tău nu este încă activ. Scrie-mi la anca@pestedespartire.ro." });

        // Token de o singura folosinta, valabil 60 de minute.
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        const linkToken = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
        await db.insert(affiliateLoginCodes).values({
          email,
          code: linkToken,
          purpose: "link",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        const base = (input.origin || process.env.VITE_FRONTEND_URL || "https://pestedespartire.ro").replace(/\/+$/, "");
        const url = base + "/affiliate/access?t=" + linkToken;

        const sent = await sendAffiliateEmail(
          email,
          created ? "Contul tău de afiliat e gata" : "Linkul tău de acces în panoul de afiliat",
          linkEmailHtml(url, created),
        );
        if (!sent) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Nu am putut trimite emailul. Scrie-mi la anca@pestedespartire.ro." });
        }
        return { ok: true, created };
      }),

    // Confirma linkul primit pe email si deschide sesiunea (90 de zile).
    // Linkul se poate folosi O SINGURA data: imediat dupa verificare e marcat ca folosit.
    verifyLink: publicProcedure
      .input(z.object({ t: z.string().min(20).max(200) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const rows = await db.select().from(affiliateLoginCodes)
          .where(and(
            eq(affiliateLoginCodes.code, input.t.trim()),
            eq(affiliateLoginCodes.purpose, "link"),
            isNull(affiliateLoginCodes.usedAt),
          ))
          .orderBy(desc(affiliateLoginCodes.createdAt))
          .limit(1);
        const row = rows[0];
        if (!row) throw new TRPCError({ code: "UNAUTHORIZED", message: "Linkul nu mai este valabil (a fost deja folosit). Cere unul nou." });
        if (row.expiresAt.getTime() < Date.now()) throw new TRPCError({ code: "UNAUTHORIZED", message: "Linkul a expirat. Cere unul nou." });

        const affiliate = await getAffiliateByEmail(row.email);
        if (!affiliate) throw new TRPCError({ code: "NOT_FOUND", message: "Contul nu a fost găsit." });
        if (affiliate.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Contul tău nu este încă activ." });

        const session = await createAffiliateSession(affiliate.id);

        // Linkul se marcheaza ca folosit ABIA DUPA ce sesiunea a fost creata cu
        // succes. Daca il marcam inainte si apoi aparea orice eroare, linkul se
        // pierdea degeaba si afiliatul ramanea pe dinafara.
        await db.update(affiliateLoginCodes).set({ usedAt: new Date() }).where(eq(affiliateLoginCodes.id, row.id));

        return {
          success: true,
          token: session.token,
          expiresAt: session.expiresAt.toISOString(),
          affiliate: { id: affiliate.id, name: affiliate.name, email: affiliate.email, referralCode: affiliate.referralCode },
        };
      }),

    // Deconectare reala: sterge sesiunea pe server, nu doar in browser.
    logout: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        await revokeAffiliateSession(input.token);
        return { ok: true };
      }),

    dashboard: publicProcedure.input(z.object({
      token: z.string(),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Afiliatul se deduce din token. Id-ul nu mai vine niciodata din browser.
      const me = await affiliateFromToken(input.token);
      const affiliateId = me.id;

      const [clickRows, referralCount, salesRows, refundRows, salesSum, withdrawableSum, commissionsData] = await Promise.all([
        db.select({ count: count() }).from(affiliateReferrals).where(eq(affiliateReferrals.affiliateId, affiliateId)),
        db.select({ count: count() }).from(contacts).where(eq(contacts.affiliateId, affiliateId)),
        db.select({ count: count() }).from(orders).where(and(eq(orders.affiliateId, affiliateId), eq(orders.status, "completed"))),
        db.select({ count: count() }).from(orders).where(and(eq(orders.affiliateId, affiliateId), eq(orders.status, "refunded"))),
        db.select({ total: sql<number>`COALESCE(SUM(amountInCents), 0)` }).from(orders).where(and(eq(orders.affiliateId, affiliateId), eq(orders.status, "completed"))),
        db.select({ total: sql<number>`COALESCE(SUM(amountInCents), 0)` }).from(commissions)
          .where(and(
            eq(commissions.affiliateId, affiliateId),
            inArray(commissions.status, ["pending", "approved"]),
            or(eq(commissions.status, "approved"), lte(commissions.payableAt, new Date()))
          )),
        db.select().from(commissions).where(eq(commissions.affiliateId, affiliateId)).orderBy(desc(commissions.createdAt)).limit(50),
      ]);

      const clicks = clickRows[0]?.count || 0;
      const sales = salesRows[0]?.count || 0;
      const revenue = salesSum[0]?.total || 0;
      const refunded = refundRows[0]?.count || 0;
      const totalEarned = me.totalEarned;
      const withdrawable = withdrawableSum[0]?.total || 0;

      let connectBalance: { available: number; pending: number } | null = null;
      if (me.stripeConnectAccountId && me.connectStatus === "active") {
        connectBalance = await getConnectBalance(me.stripeConnectAccountId);
      }

      return {
        // Doar campurile de care are nevoie panoul. Inainte se trimitea tot randul
        // din baza de date, inclusiv hash-ul de parola.
        affiliate: {
          id: me.id,
          name: me.name,
          email: me.email,
          referralCode: me.referralCode,
          commissionPercent: me.commissionPercent,
          status: me.status,
          payoutMethod: me.payoutMethod,
          payoutDetails: me.payoutDetails,
          connectStatus: me.connectStatus,
          stripeConnectAccountId: me.stripeConnectAccountId,
          totalEarned: me.totalEarned,
          totalPaid: me.totalPaid,
          createdAt: me.createdAt,
        },
        stats: {
          totalReferrals: referralCount[0]?.count || 0,
          totalSales: sales,
          totalEarned: totalEarned / 100,
          totalPaid: me.totalPaid / 100,
          pendingPayout: (totalEarned - me.totalPaid) / 100,
          withdrawable: withdrawable / 100,
          clicks,
          // Metrici stil ClickBank: conversie vizita->vanzare, EPC (castig/click), valoare medie comanda.
          conversionRate: clicks > 0 ? Math.round((sales / clicks) * 1000) / 10 : 0,
          epc: clicks > 0 ? totalEarned / clicks / 100 : 0,
          avgOrder: sales > 0 ? revenue / sales / 100 : 0,
          refundRate: sales > 0 ? Math.round((refunded / sales) * 1000) / 10 : 0,
        },
        connectBalance,
        recentCommissions: commissionsData,
      };
    }),

    // Retragere din panou prin Stripe — transfera acum toate sumele scadente (fara prag).
    withdraw: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const me = await affiliateFromToken(input.token);
        if (me.payoutMethod && me.payoutMethod !== "stripe") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Metoda ta de plată este transfer bancar (IBAN). Folosește butonul „Solicită plata” din panou." });
        }
        if (!me.stripeConnectAccountId || me.connectStatus !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Conectează-ți întâi contul Stripe (butonul din cardul „Banii tăi”), apoi poți retrage singur(ă)." });
        }
        const result = await payOutAffiliate(me.id, CONNECT_MIN_PAYOUT_CENTS);
        if (!result.amountCents) {
          if (result.error) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transferul nu a putut fi executat: " + result.error });
          }
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nu ai nicio sumă scadentă de retras acum. Comisioanele devin disponibile la 30 de zile de la fiecare achiziție." });
        }
        return { ok: true, transferred: result.amountCents / 100 };
      }),

    // Link unic spre dashboard-ul Express (doar daca afiliatul are nevoie de el).
    connectLogin: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const me = await affiliateFromToken(input.token);
        if (!me.stripeConnectAccountId) throw new TRPCError({ code: "NOT_FOUND" });
        const url = await createExpressLoginLink(me.stripeConnectAccountId);
        if (!url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Nu am putut genera linkul. Încearcă din nou." });
        return { url };
      }),

    // Afiliatul isi alege metoda de plata: automat (stripe) sau manual (iban/paypal/wise/revolut).
    updatePayoutMethod: publicProcedure
      .input(z.object({
        token: z.string(),
        method: z.enum(["stripe", "iban", "paypal", "wise", "revolut"]),
        details: z.string().max(200).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const me = await affiliateFromToken(input.token);
        const details = (input.details || "").trim();
        if (input.method !== "stripe") {
          if (details.length < 5) throw new TRPCError({ code: "BAD_REQUEST", message: "Adaugă detaliile pentru plată (ex. IBAN, email PayPal, email Wise sau tag Revolut)." });
          if (input.method === "paypal" && !details.includes("@")) throw new TRPCError({ code: "BAD_REQUEST", message: "Adaugă adresa ta de email PayPal." });
          if (input.method === "wise" && !details.includes("@")) throw new TRPCError({ code: "BAD_REQUEST", message: "Adaugă emailul contului tău Wise." });
        }
        // Cand trece pe Stripe NU stergem IBAN-ul salvat, ca sa nu-l puna la loc de fiecare data.
        const patch: { payoutMethod: typeof input.method; payoutDetails?: string } = { payoutMethod: input.method };
        if (input.method !== "stripe") patch.payoutDetails = details;
        await db.update(affiliates).set(patch).where(eq(affiliates.id, me.id));
        return { ok: true, method: input.method };
      }),

    // Solicitare plata manuala: afiliatul cere banii, primesti tu email cu detaliile.
    requestManualPayout: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const aff = await affiliateFromToken(input.token);
        if (aff.payoutMethod === "stripe") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Metoda ta de plată este Stripe (automat) — folosește butonul „Retrage acum” din panoul tău." });
        }
        const now = new Date();
        const due = await db.select({ total: sql<number>`COALESCE(SUM(amountInCents), 0)` }).from(commissions)
          .where(and(
            eq(commissions.affiliateId, aff.id),
            inArray(commissions.status, ["pending", "approved"]),
            or(eq(commissions.status, "approved"), lte(commissions.payableAt, now))
          ));
        const amountCents = due[0]?.total || 0;
        if (amountCents < MANUAL_MIN_PAYOUT_CENTS) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nu ai încă " + MANUAL_MIN_PAYOUT_LEI + " lei scadenți. Comisioanele devin disponibile la 30 de zile de la fiecare achiziție." });
        }
        const methodLabel = ({ iban: "Transfer bancar (IBAN)", paypal: "PayPal", wise: "Wise", revolut: "Revolut" } as Record<string, string>)[aff.payoutMethod || "iban"] || "Transfer bancar";
        const details = aff.payoutDetails || "—";
        const amountLei = (amountCents / 100).toFixed(2);
        const adminUrl = (process.env.VITE_FRONTEND_URL || "https://pestedespartire.ro") + "/admin/affiliates";
        const apiKey = process.env.RESEND_API_KEY || "";
        const from = "Cristina de la Peste Despartire <anca@comenzi.tevreauinapoi.ro>";
        const q = String.fromCharCode(34);
        const row = (label: string, value: string, strong?: boolean) =>
          "<p style=" + q + "font-size:14px;color:#444;margin:6px 0;" + q + "><strong>" + label + "</strong> " +
          (strong ? "<span style=" + q + "font-size:16px;color:#1b2d4f;font-weight:bold;" + q + ">" + value + "</span>" : value) + "</p>";
        if (apiKey) {
          // 1) Email catre admin (Cristina) — cu toate detaliile necesare pentru transfer.
          const html = [
            "<!DOCTYPE html><html><body style=" + q + "font-family:Arial,Helvetica,sans-serif;background:#f5f2ea;padding:24px;" + q + ">",
            "<div style=" + q + "max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;" + q + ">",
            "<h2 style=" + q + "color:#1b2d4f;margin-top:0;" + q + ">Solicitare plată afiliat</h2>",
            row("Afiliat:", (aff.name || "") + " (" + aff.email + ")"),
            row("Sumă de plată:", amountLei + " RON", true),
            row("Metoda aleasă:", methodLabel),
            "<div style=" + q + "background:#f8f5ec;border:1px solid #e8d9a0;border-radius:10px;padding:12px;margin:12px 0;" + q + ">",
            "<p style=" + q + "font-size:13px;color:#7a5b12;margin:0 0 6px;" + q + ">Detalii pentru transfer (IBAN / cont):</p>",
            "<p style=" + q + "font-family:monospace;font-size:16px;color:#1b2d4f;font-weight:bold;margin:0;word-break:break-all;" + q + ">" + details + "</p>",
            "</div>",
            "<p style=" + q + "font-size:14px;margin:16px 0;" + q + "><a href=" + q + adminUrl + q + " style=" + q + "background:#1b2d4f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:bold;" + q + ">Deschide panoul de afiliați</a></p>",
            "<p style=" + q + "font-size:13px;color:#666;" + q + ">După ce faci transferul bancar, apasă în panou butonul <strong>„Marchează plătit”</strong> pe rândul afiliatului — atunci comisioanele trec pe „Plătit” și afiliatul vede că banii au plecat.</p>",
            "</div></body></html>",
          ].join("");
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              from,
              to: ["anca@pestedespartire.ro"],
              subject: "Solicitare plată afiliat: " + (aff.name || aff.email) + " — " + amountLei + " RON",
              html,
            }),
          }).catch(() => {});
          // 2) Email catre afiliat — confirmare ca cererea a fost inregistrata.
          const affHtml = [
            "<!DOCTYPE html><html><body style=" + q + "font-family:Arial,Helvetica,sans-serif;background:#f5f2ea;padding:24px;" + q + ">",
            "<div style=" + q + "max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;" + q + ">",
            "<h2 style=" + q + "color:#1b2d4f;margin-top:0;" + q + ">Am primit cererea ta de plată</h2>",
            "<p style=" + q + "font-size:14px;color:#444;" + q + ">Bună, " + (aff.name || "") + "!</p>",
            row("Sumă cerută:", amountLei + " RON", true),
            row("Metoda:", methodLabel),
            row("Detalii:", details),
            "<p style=" + q + "font-size:14px;color:#444;" + q + ">Fac transferul în 1–3 zile lucrătoare. După ce banii pleacă, statusul comisioanelor din panoul tău se schimbă în <strong>„Plătit”</strong>.</p>",
            "<p style=" + q + "font-size:13px;color:#666;" + q + ">Dacă ceva nu e în regulă, răspunde direct la acest email.</p>",
            "<p style=" + q + "font-size:13px;color:#666;" + q + ">— Cristina, Peste Despartire</p>",
            "</div></body></html>",
          ].join("");
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              from,
              to: [aff.email],
              subject: "Cererea ta de plată a fost înregistrată — " + amountLei + " RON",
              html: affHtml,
            }),
          }).catch(() => {});
        }
        return { ok: true, amount: amountCents / 100, method: methodLabel };
      }),

    // Stripe Connect: start onboarding pentru plati automate
    connectStart: publicProcedure
      .input(z.object({ token: z.string(), origin: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const me = await affiliateFromToken(input.token);
          const result = await startAffiliateConnectOnboarding(me.id, input.origin);
          return { url: result.url, accountId: result.accountId };
        } catch (err: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Connect onboarding failed" });
        }
      }),

    // Admin: list all affiliates (+ sumele scadente, ca sa stii exact cat ai de platit)
    listAll: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
      const now = new Date();
      const dueRows = await db.select({
        affiliateId: commissions.affiliateId,
        total: sql<number>`COALESCE(SUM(${commissions.amountInCents}), 0)`,
        cnt: count(),
      }).from(commissions)
        .where(and(
          inArray(commissions.status, ["pending", "approved"]),
          or(eq(commissions.status, "approved"), lte(commissions.payableAt, now))
        ))
        .groupBy(commissions.affiliateId);
      const dueMap = new Map<number, { cents: number; count: number }>();
      for (const d of dueRows) dueMap.set(d.affiliateId, { cents: Number(d.total || 0), count: Number(d.cnt || 0) });
      return rows.map((r) => ({
        ...r,
        dueCents: dueMap.get(r.id)?.cents ?? 0,
        dueCount: dueMap.get(r.id)?.count ?? 0,
      }));
    }),

    // Admin: marcheaza ca platite toate comisioanele scadente ale unui afiliat.
    // Se foloseste DUPA ce ai facut transferul manual (IBAN), ca sa inchizi bucla:
    // comisioanele trec pe "paid", afiliatul vede "Platit" in panoul lui.
    markPaid: adminProcedure
      .input(z.object({ affiliateId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const now = new Date();
        const rows = await db.select({ id: commissions.id, amountInCents: commissions.amountInCents })
          .from(commissions)
          .where(and(
            eq(commissions.affiliateId, input.affiliateId),
            inArray(commissions.status, ["pending", "approved"]),
            or(eq(commissions.status, "approved"), lte(commissions.payableAt, now))
          ));
        if (!rows.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nu exista comisioane scadente de marcat ca platite." });
        }
        const total = rows.reduce((s, r) => s + r.amountInCents, 0);
        for (const row of rows) {
          await db.update(commissions).set({ status: "paid", paidAt: now }).where(eq(commissions.id, row.id));
        }
        await db.insert(payouts).values({
          affiliateId: input.affiliateId,
          amountInCents: total,
          paymentMethod: "manual",
          paymentReference: "manual:" + input.affiliateId,
          notes: "Plata manuala marcata din panoul de admin",
        });
        await db.update(affiliates).set({ totalPaid: sql`${affiliates.totalPaid} + ${total}` }).where(eq(affiliates.id, input.affiliateId));
        // Notificare afiliat: transferul bancar a fost facut.
        const affInfo = await db.select({ email: affiliates.email, name: affiliates.name }).from(affiliates).where(eq(affiliates.id, input.affiliateId)).limit(1);
        await sendAffiliateEmail(
          affInfo[0]?.email || "",
          "Transferul tău a plecat — " + (total / 100).toFixed(2) + " RON",
          payoutEmailHtml({
            name: affInfo[0]?.name || "",
            amountLei: (total / 100).toFixed(2),
            methodLabel: "Transfer bancar (IBAN)",
            extra: "Am făcut transferul bancar către IBAN-ul salvat în panoul tău. În funcție de bancă, banii ajung în 1–2 zile lucrătoare.",
          }),
        );
        return { ok: true, amount: total / 100, count: rows.length };
      }),
  }),

  // ============ FUNNEL TRACKING ============
  tracking: router({
    event: publicProcedure.input(z.object({
      contactId: z.number().optional(),
      sessionId: z.string().optional(),
      event: z.enum([
        "quiz_started", "quiz_completed", "sales_page_viewed",
        "checkout_started", "purchase_completed",
        "upsell_viewed", "upsell_purchased", "upsell_declined",
        "downsell_viewed", "downsell_purchased", "downsell_declined",
        "book_delivered", "email_opened", "email_clicked",
        "unsubscribed", "refunded"
      ]),
      metadata: z.any().optional(),
      gender: z.enum(["male", "female"]).optional(),
    })).mutation(async ({ input }) => {
      await trackFunnelEvent(input);
      return { success: true };
    }),
  }),

  // ============ UNSUBSCRIBE ============
  unsubscribe: router({
    process: publicProcedure.input(z.object({
      email: z.string().email(),
    })).mutation(async ({ input }) => {
      const contact = await getContactByEmail(input.email);
      if (contact) {
        await updateContact(contact.id, {
          emailSubscribed: false,
          status: "unsubscribed",
          nextEmailAt: null,
          currentSequenceStep: null,
        });
        await trackFunnelEvent({
          contactId: contact.id,
          event: "unsubscribed",
        });
      }
      return { success: true };
    }),
  }),

  // ============ ADMIN ============
  admin: adminRouter,
  finance: financeRouter,

  // ============ AFFILIATES ============
  affiliate: affiliateRouter,
});

export type AppRouter = typeof appRouter;