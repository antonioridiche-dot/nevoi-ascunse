import { COOKIE_NAME } from "@shared/const";
import { getBrandCatalog } from "./db";
import { createTarotOrder, decideTarotOffer, finalizeTarotEmbeddedPayment, getTarotOrder, prepareTarotEmbeddedPayment, recordTarotExitOffer, startTarotCheckout, startTarotOfferCheckout, trackTarotEvent } from "./commerce/tarotService";
import { getTarotDashboard, getTarotLibrary, redeemTarotAccess } from "./access/tarotAccess";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { confirmFamilyPayment, createFamilyPaymentIntent, decideFamilyOffer, guardFamilyStep } from "./commerce/familyService";
import { familyDashboard, issueFamilyAccessForSession, requestFamilyRecovery } from "./access/familyAccess";
import { createPbcCheckout, getPbcCheckoutStatus } from "./commerce/pbcService";
import { createVrajiPostPurchase, getVrajiPaymentStatus, prepareVrajiPayment } from "./commerce/vrajiService";
import { createWeightlossIntent, isWeightlossProduct, oneClickWeightlossUpsell } from "./commerce/weightlossService";
import { confirmRelatiiPayment, decideRelatiiOffer, getRelatiiOrder, prepareRelatiiPayment, recordRelatiiAffiliateOfferDecision, submitRelatiiCoachingApplication } from "./commerce/relatiiService";
import { redeemRelatiiAccessLink, requestRelatiiRecovery } from "./access/relatiiAccess";
import { authenticateRelatiiAffiliate, createRelatiiAffiliate, getRelatiiAffiliateStats, trackRelatiiAffiliateClick } from "./commerce/relatiiAffiliateService";
import { getRelatiiAdminSnapshot } from "./commerce/relatiiAdminService";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  catalog: router({
    listBrands: publicProcedure.query(async () => getBrandCatalog()),
  }),
  tarot: router({
    redeemAccess: publicProcedure.input(z.object({ token: z.string().min(30).max(128) })).mutation(async ({ input, ctx }) => redeemTarotAccess(input.token, ctx.res)),
    library: publicProcedure.query(async ({ ctx }) => getTarotLibrary(ctx.req)),
    dashboard: publicProcedure.query(async ({ ctx }) => getTarotDashboard(ctx.req)),
    createOrder: publicProcedure.input(z.object({ customerName: z.string().min(2).max(160), customerEmail: z.string().email().max(320), birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), topic: z.string().min(2).max(160), selectedCards: z.array(z.string()).length(3), marketingConsent: z.boolean() })).mutation(async ({ input }) => createTarotOrder(input)),
    getOrder: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96) })).query(async ({ input }) => getTarotOrder(input.publicToken)),
    prepareEmbeddedPayment: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96), currency: z.enum(["ron", "eur", "gbp", "usd"]), offerCode: z.enum(["welcome33", "exit20"]) })).mutation(async ({ input }) => prepareTarotEmbeddedPayment(input.publicToken, input.currency, input.offerCode)),
    finalizeEmbeddedPayment: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96), paymentIntentId: z.string().startsWith("pi_") })).mutation(async ({ input }) => finalizeTarotEmbeddedPayment(input.publicToken, input.paymentIntentId)),
    recordExitOffer: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96) })).mutation(async ({ input }) => recordTarotExitOffer(input.publicToken)),
    trackFunnelEvent: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96), eventType: z.enum(["checkout_viewed", "currency_changed", "dashboard_viewed", "payment_form_error"]) })).mutation(async ({ input }) => trackTarotEvent(input.publicToken, input.eventType)),
    decideOffer: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96), productKey: z.enum(["numerology", "portrait", "palm"]), accepted: z.boolean() })).mutation(async ({ input }) => decideTarotOffer(input.publicToken, input.productKey, input.accepted)),
    startCheckout: publicProcedure
      .input(z.object({
        customerName: z.string().min(2).max(160),
        customerEmail: z.string().email().max(320),
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        topic: z.string().min(2).max(160),
        selectedCards: z.array(z.string()).length(3),
        marketingConsent: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => startTarotCheckout({ ...input, origin: ctx.req.headers.origin ?? "" })),
    startOfferCheckout: publicProcedure
      .input(z.object({
        checkoutToken: z.string().min(32).max(96),
        productKey: z.enum(["numerology", "portrait", "palm"]),
      }))
      .mutation(async ({ input, ctx }) => startTarotOfferCheckout({ ...input, origin: ctx.req.headers.origin ?? "" })),
  }),
  familie: router({
    createPaymentIntent: publicProcedure.input(z.object({ customerName: z.string().trim().min(2).max(160), customerEmail: z.string().trim().email().max(320), checkoutKey: z.string().min(16).max(120), currency: z.enum(["ron", "eur", "usd", "gbp"]), variant: z.enum(["promo67", "exit20"]).optional(), productHandle: z.enum(["last-mile-72-hour-readiness-plan", "field-continuity-protocol", "field-continuity-protocol-essentials", "72-hour-decision-card-pack"]) })).mutation(({ input }) => createFamilyPaymentIntent(input)),
    confirmPayment: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), paymentIntentId: z.string().startsWith("pi_") })).mutation(({ input }) => confirmFamilyPayment(input.sessionToken, input.paymentIntentId)),
    guard: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), step: z.enum(["oto1", "ds1", "ds2", "thank_you"]) })).query(({ input }) => guardFamilyStep(input.sessionToken, input.step)),
    decide: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), currentStep: z.enum(["oto1", "ds1", "ds2"]), accepted: z.boolean(), consent: z.boolean().default(false) })).mutation(({ input }) => decideFamilyOffer(input.sessionToken, input.currentStep, input.accepted, input.consent)),
    issueAccess: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), email: z.string().email(), deviceHash: z.string().min(16).max(256) })).mutation(({ input }) => issueFamilyAccessForSession(input.sessionToken, input.email, input.deviceHash)),
    dashboard: publicProcedure.input(z.object({ accessToken: z.string().regex(/^[a-f0-9]{64}$/), deviceHash: z.string().min(16).max(256) })).query(({ input }) => familyDashboard(input.accessToken, input.deviceHash)),
    requestRecovery: publicProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => requestFamilyRecovery(input.email)),
  }),
  pbc: router({
    checkout: router({
      create: publicProcedure.input(z.object({ productIds: z.array(z.enum(["frontEnd", "upsellOne", "downsell", "upsellTwo"])).min(1), customerName: z.string().trim().min(2).max(160), customerEmail: z.string().trim().email().max(320), acceptedTerms: z.literal(true) })).mutation(({ input, ctx }) => createPbcCheckout({ ...input, origin: ctx.req.headers.origin ?? "" })),
      status: publicProcedure.input(z.object({ sessionId: z.string().min(8).max(255) })).query(({ input }) => getPbcCheckoutStatus(input.sessionId)),
    }),
  }),
  vraji: router({
    tracking: router({
      event: publicProcedure.input(z.object({ sessionId: z.string().min(8).max(80), eventName: z.string().min(2).max(80), stage: z.string().min(2).max(64) })).mutation(async () => ({ success: true as const })),
    }),
    checkout: router({
      prepare: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), offerVariant: z.enum(["promo67", "exit20"]), bumps: z.array(z.enum(["priority-journal", "closure-ritual"])).max(2), affiliateCode: z.string().trim().min(4).max(48).nullable().optional() })).mutation(({ input }) => prepareVrajiPayment(input)),
      status: publicProcedure.input(z.object({ paymentIntentId: z.string().min(10).max(255) })).query(({ input }) => getVrajiPaymentStatus(input.paymentIntentId)),
      postPurchase: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), sourcePaymentIntentId: z.string().min(10).max(255), sku: z.enum(["attraction-expansion", "connection-compass", "intention-audio"]) })).mutation(({ input }) => createVrajiPostPurchase(input)),
    }),
  }),
  weightloss: router({
    payment: router({
      createIntent: publicProcedure.input(z.object({ productSlug: z.string().refine(isWeightlossProduct, "Produs necunoscut"), buyerEmail: z.string().email(), buyerName: z.string().trim().min(2).max(160), orderToken: z.string().uuid().optional(), affiliateCode: z.string().trim().max(64).optional() })).mutation(({ input }) => createWeightlossIntent(input)),
      oneClickUpsell: publicProcedure.input(z.object({ productSlug: z.enum(["retete", "miscare", "longevitate"]), orderToken: z.string().uuid(), originalPaymentIntentId: z.string().min(5) })).mutation(({ input }) => oneClickWeightlossUpsell(input)),
    }),
  }),
  relatii: router({
    admin: router({
      snapshot: adminProcedure.query(() => getRelatiiAdminSnapshot()),
    }),
    affiliate: router({
      signup: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320), password: z.string().min(8).max(120) })).mutation(({ input }) => createRelatiiAffiliate(input)),
      login: publicProcedure.input(z.object({ code: z.string().trim().min(4).max(64), password: z.string().min(8).max(120) })).query(({ input }) => authenticateRelatiiAffiliate(input)),
      dashboard: publicProcedure.input(z.object({ code: z.string().trim().min(4).max(64) })).query(({ input }) => getRelatiiAffiliateStats(input.code)),
      track: publicProcedure.input(z.object({ code: z.string().trim().min(4).max(64), path: z.string().trim().min(1).max(500) })).mutation(({ input }) => trackRelatiiAffiliateClick(input)),
    }),
    library: router({
      redeem: publicProcedure.input(z.object({ token: z.string().trim().min(30).max(200) })).mutation(({ input }) => redeemRelatiiAccessLink(input.token)),
      requestRecovery: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(({ input, ctx }) => requestRelatiiRecovery({ email: input.email, origin: ctx.req.headers.origin ?? `${ctx.req.protocol}://${ctx.req.get("host")}` })),
    }),
    coaching: router({
      submit: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(320), context: z.string().trim().min(20).max(3000) })).mutation(({ input }) => submitRelatiiCoachingApplication(input)),
    }),
    order: router({
      get: publicProcedure.input(z.object({ orderId: z.number().int().positive() })).query(({ input }) => getRelatiiOrder(input.orderId)),
    }),
    offers: router({
      decide: publicProcedure.input(z.object({ orderId: z.number().int().positive(), offerId: z.string().trim().min(2).max(80), decision: z.enum(["accepted", "declined"]) })).mutation(({ input }) => decideRelatiiOffer(input)),
      affiliateDecision: publicProcedure.input(z.object({ affiliateCode: z.string().trim().min(4).max(64), orderId: z.number().int().positive(), offerId: z.string().trim().min(2).max(80), amountCents: z.number().int().positive(), decision: z.enum(["accepted", "declined"]) })).mutation(({ input }) => recordRelatiiAffiliateOfferDecision(input)),
    }),
    checkout: router({
      prepare: publicProcedure.input(z.object({
        productKey: z.enum(["dictionarul-femeilor", "dictionarul-barbatilor"]),
        audience: z.enum(["barbati", "femei"]),
        email: z.string().trim().email().max(320),
        offerCode: z.enum(["promo67", "exit20"]),
        affiliateCode: z.string().trim().min(4).max(64).optional(),
      })).mutation(({ input }) => prepareRelatiiPayment(input)),
      confirm: publicProcedure.input(z.object({
        checkoutToken: z.string().min(32).max(96),
        paymentIntentId: z.string().startsWith("pi_"),
      })).mutation(({ input }) => confirmRelatiiPayment(input)),
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
