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
import { getVrajiLibrary, requestVrajiLibraryAccess } from "./access/vrajiAccess";
import { confirmCalendarIntent, createCalendarIntent, purchaseCalendarOneClick } from "./commerce/calendarService";
import { calendarLifecycleEvents, getCalendarCampaignExport, getCalendarManualSegments, trackCalendarLifecycle } from "./commerce/calendarTracking";
import { createWeightlossIntent, getWeightlossSecureDownloads, isWeightlossProduct, listWeightlossDownloadAssets, listWeightlossOrdersForAdmin, oneClickWeightlossUpsell, setWeightlossDownloadActive, uploadWeightlossDownload } from "./commerce/weightlossService";
import { confirmRelatiiPayment, decideRelatiiOffer, getRelatiiOrder, prepareRelatiiPayment, recordRelatiiAffiliateOfferDecision, submitRelatiiCoachingApplication } from "./commerce/relatiiService";
import { redeemRelatiiAccessLink, requestRelatiiRecovery } from "./access/relatiiAccess";
import { authenticateRelatiiAffiliate, createRelatiiAffiliate, getRelatiiAffiliateStats, trackRelatiiAffiliateClick } from "./commerce/relatiiAffiliateService";
import { getRelatiiAdminSnapshot } from "./commerce/relatiiAdminService";
import { chargeArmoniiUpsell, confirmArmoniiIntent, createArmoniiIntent, finalizeArmoniiUpsell, getArmoniiDownloads, getArmoniiUpsellOffer } from "./commerce/armoniiService";
import { authorizeIubireLibrary, confirmIubireIntent, createIubireIntent } from "./commerce/iubireService";
import { authorizeLinisteAccess, chargeLinisteEveningPause, confirmLinisteIntent, createLinisteIntent, finalizeLinisteEveningPause, getLinisteEveningPauseOffer } from "./commerce/linisteService";
import { requestLinisteRecovery } from "./access/linisteRecovery";
import { affiliateAdminSnapshot, affiliateDashboard, listAffiliateOffers, logoutAffiliate, registerAffiliate, requestAffiliateLoginCode, requestAffiliatePayout, reverseAffiliateCommissionsForOrder, reviewAffiliatePayoutProfile, reviewAffiliatePayoutRequest, submitAffiliatePayoutProfile, trackAffiliateReferral, verifyAffiliateLoginCode } from "./commerce/affiliateHubService";

function affiliateVisitorFromRequest(cookieHeader?: string) {
  const value = cookieHeader?.match(/(?:^|;\s*)na_affiliate_visitor=([a-f0-9]{64})(?:;|$)/i)?.[1];
  return value?.toLowerCase();
}

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
  affiliateHub: router({
    offers: publicProcedure.query(() => listAffiliateOffers()),
    register: publicProcedure.input(z.object({ displayName: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320), acceptedTerms: z.literal(true) })).mutation(({ input }) => registerAffiliate(input)),
    requestLoginCode: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(({ input }) => requestAffiliateLoginCode(input.email)),
    verifyLoginCode: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), code: z.string().regex(/^\d{6}$/) })).mutation(({ input }) => verifyAffiliateLoginCode(input)),
    logout: publicProcedure.input(z.object({ sessionToken: z.string().length(64) })).mutation(({ input }) => logoutAffiliate(input.sessionToken)),
    dashboard: publicProcedure.input(z.object({ sessionToken: z.string().length(64) })).query(({ input }) => affiliateDashboard(input.sessionToken)),
    trackReferral: publicProcedure.input(z.object({ offerKey: z.string().trim().regex(/^[a-z0-9-]+$/).max(80), affiliateCode: z.string().trim().min(4).max(64), visitorToken: z.string().length(64), landingPath: z.string().startsWith("/").max(500) })).mutation(({ input }) => trackAffiliateReferral(input)),
    submitPayoutProfile: publicProcedure.input(z.object({ sessionToken: z.string().length(64), legalName: z.string().trim().min(2).max(255), beneficiaryType: z.enum(["individual", "pfa", "company"]), taxResidenceCountry: z.string().trim().regex(/^[A-Za-z]{2}$/), legalAddress: z.string().trim().min(5).max(2000), taxIdentifier: z.string().trim().max(120).optional(), iban: z.string().trim().min(15).max(64), bic: z.string().trim().max(32).optional(), payoutCurrency: z.literal("ron") })).mutation(({ input }) => submitAffiliatePayoutProfile(input.sessionToken, input)),
    requestPayout: publicProcedure.input(z.object({ sessionToken: z.string().length(64) })).mutation(({ input }) => requestAffiliatePayout(input.sessionToken)),
    adminSnapshot: adminProcedure.query(() => affiliateAdminSnapshot()),
    reviewPayoutProfile: adminProcedure.input(z.object({ payoutProfileId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]) })).mutation(({ input }) => reviewAffiliatePayoutProfile(input)),
    reviewPayoutRequest: adminProcedure.input(z.object({ payoutRequestId: z.number().int().positive(), decision: z.enum(["approved", "rejected", "paid"]), payoutReference: z.string().trim().max(255).optional() })).mutation(({ input }) => reviewAffiliatePayoutRequest(input)),
    reverseOrderCommission: adminProcedure.input(z.object({ orderId: z.number().int().positive(), reason: z.enum(["refund", "chargeback"]), reference: z.string().trim().max(255).optional() })).mutation(({ input }) => reverseAffiliateCommissionsForOrder(input)),
  }),
  tarot: router({
    redeemAccess: publicProcedure.input(z.object({ token: z.string().min(30).max(128) })).mutation(async ({ input, ctx }) => redeemTarotAccess(input.token, ctx.res)),
    library: publicProcedure.query(async ({ ctx }) => getTarotLibrary(ctx.req)),
    dashboard: publicProcedure.query(async ({ ctx }) => getTarotDashboard(ctx.req)),
    createOrder: publicProcedure.input(z.object({ customerName: z.string().min(2).max(160), customerEmail: z.string().email().max(320), birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), topic: z.string().min(2).max(160), selectedCards: z.array(z.string()).length(3), marketingConsent: z.boolean() })).mutation(async ({ input }) => createTarotOrder(input)),
    getOrder: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96) })).query(async ({ input }) => getTarotOrder(input.publicToken)),
    prepareEmbeddedPayment: publicProcedure.input(z.object({ publicToken: z.string().min(32).max(96), currency: z.enum(["ron", "eur", "gbp", "usd"]), offerCode: z.enum(["welcome33", "exit20"]) })).mutation(async ({ input, ctx }) => prepareTarotEmbeddedPayment(input.publicToken, input.currency, input.offerCode, affiliateVisitorFromRequest(ctx.req.headers.cookie))),
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
    createPaymentIntent: publicProcedure.input(z.object({ customerName: z.string().trim().min(2).max(160), customerEmail: z.string().trim().email().max(320), checkoutKey: z.string().min(16).max(120), currency: z.enum(["ron", "eur", "usd", "gbp"]), variant: z.enum(["promo67", "exit20"]).optional(), productHandle: z.enum(["last-mile-72-hour-readiness-plan", "field-continuity-protocol", "field-continuity-protocol-essentials", "72-hour-decision-card-pack"]) })).mutation(({ input, ctx }) => createFamilyPaymentIntent({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
    confirmPayment: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), paymentIntentId: z.string().startsWith("pi_") })).mutation(({ input }) => confirmFamilyPayment(input.sessionToken, input.paymentIntentId)),
    guard: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), step: z.enum(["oto1", "ds1", "ds2", "thank_you"]) })).query(({ input }) => guardFamilyStep(input.sessionToken, input.step)),
    decide: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), currentStep: z.enum(["oto1", "ds1", "ds2"]), accepted: z.boolean(), consent: z.boolean().default(false) })).mutation(({ input }) => decideFamilyOffer(input.sessionToken, input.currentStep, input.accepted, input.consent)),
    issueAccess: publicProcedure.input(z.object({ sessionToken: z.string().regex(/^[a-f0-9]{48}$/), email: z.string().email(), deviceHash: z.string().min(16).max(256) })).mutation(({ input }) => issueFamilyAccessForSession(input.sessionToken, input.email, input.deviceHash)),
    dashboard: publicProcedure.input(z.object({ accessToken: z.string().regex(/^[a-f0-9]{64}$/), deviceHash: z.string().min(16).max(256) })).query(({ input }) => familyDashboard(input.accessToken, input.deviceHash)),
    requestRecovery: publicProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => requestFamilyRecovery(input.email)),
  }),
  pbc: router({
    checkout: router({
      create: publicProcedure.input(z.object({ productIds: z.array(z.enum(["frontEnd", "upsellOne", "downsell", "upsellTwo"])).min(1), customerName: z.string().trim().min(2).max(160), customerEmail: z.string().trim().email().max(320), acceptedTerms: z.literal(true) })).mutation(({ input, ctx }) => createPbcCheckout({ ...input, origin: ctx.req.headers.origin, host: ctx.req.headers.host, protocol: ctx.req.protocol, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
      status: publicProcedure.input(z.object({ sessionId: z.string().min(8).max(255) })).query(({ input }) => getPbcCheckoutStatus(input.sessionId)),
    }),
  }),
  vraji: router({
    tracking: router({
      event: publicProcedure.input(z.object({ sessionId: z.string().min(8).max(80), eventName: z.string().min(2).max(80), stage: z.string().min(2).max(64) })).mutation(async () => ({ success: true as const })),
    }),
    checkout: router({
      prepare: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), offerVariant: z.enum(["promo67", "exit20"]), bumps: z.array(z.enum(["priority-journal", "closure-ritual"])).max(2), affiliateCode: z.string().trim().min(4).max(48).nullable().optional() })).mutation(({ input, ctx }) => prepareVrajiPayment({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
      status: publicProcedure.input(z.object({ paymentIntentId: z.string().min(10).max(255) })).query(({ input }) => getVrajiPaymentStatus(input.paymentIntentId)),
      confirm: publicProcedure.input(z.object({ paymentIntentId: z.string().min(10).max(255) })).mutation(({ input }) => getVrajiPaymentStatus(input.paymentIntentId)),
      postPurchase: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), sourcePaymentIntentId: z.string().min(10).max(255), sku: z.enum(["attraction-expansion", "connection-compass", "intention-audio"]) })).mutation(({ input }) => createVrajiPostPurchase(input)),
    }),
    library: router({
      requestAccess: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(({ input, ctx }) => requestVrajiLibraryAccess({ email: input.email, origin: ctx.req.headers.origin ?? `${ctx.req.protocol}://${ctx.req.get("host")}` })),
      get: publicProcedure.input(z.object({ accessToken: z.string().trim().min(30).max(200).nullable().optional() })).query(({ input }) => getVrajiLibrary(input.accessToken)),
    }),
  }),
  armonii: router({
    checkout: router({
      createIntent: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), name: z.string().trim().max(160).optional() })).mutation(({ input, ctx }) => createArmoniiIntent({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
      confirm: publicProcedure.input(z.object({ checkoutToken: z.string().min(20).max(96), paymentIntentId: z.string().startsWith("pi_") })).mutation(({ input }) => confirmArmoniiIntent(input)),
      downloads: publicProcedure.input(z.object({ access: z.string().min(30).max(200) })).query(({ input }) => getArmoniiDownloads(input.access)),
    }),
    postPurchase: router({ context: publicProcedure.input(z.object({ access: z.string().min(30).max(200) })).query(({ input }) => getArmoniiUpsellOffer(input.access)), chargeRitual: publicProcedure.input(z.object({ access: z.string().min(30).max(200) })).mutation(({ input }) => chargeArmoniiUpsell(input.access)), finalizeRitual: publicProcedure.input(z.object({ access: z.string().min(30).max(200), paymentIntentId: z.string().startsWith("pi_") })).mutation(({ input }) => finalizeArmoniiUpsell(input.access, input.paymentIntentId)) }),
  }),
  iubire: router({
    checkout: router({
      createIntent: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), offer: z.enum(["standard", "exit20"]), idempotencyKey: z.string().uuid() })).mutation(({ input, ctx }) => createIubireIntent({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
      confirm: publicProcedure.input(z.object({ checkoutToken: z.string().min(32).max(96), paymentIntentId: z.string().startsWith("pi_") })).mutation(({ input }) => confirmIubireIntent(input)),
    }),
    library: router({ authorize: publicProcedure.input(z.object({ access: z.string().length(64) })).query(({ input }) => authorizeIubireLibrary(input.access)) }),
  }),
  liniste: router({
    checkout: router({
      createIntent: publicProcedure.input(z.object({ productKey: z.enum(["anxietate", "dispozitie-joasa", "frica", "pachet-intreg"]), email: z.string().trim().email().max(320), currency: z.enum(["ron", "eur", "usd", "gbp"]), offer: z.enum(["exit20"]).optional(), idempotencyKey: z.string().uuid() })).mutation(({ input, ctx }) => createLinisteIntent({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
      confirm: publicProcedure.input(z.object({ checkoutToken: z.string().min(32).max(96), paymentIntentId: z.string().startsWith("pi_") })).mutation(({ input }) => confirmLinisteIntent(input)),
    }),
    recovery: router({ request: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(({ input }) => requestLinisteRecovery(input.email)) }),
    library: router({ authorize: publicProcedure.input(z.object({ access: z.string().length(64) })).query(({ input }) => authorizeLinisteAccess(input.access)) }),
    postPurchase: router({ context: publicProcedure.input(z.object({ access: z.string().length(64) })).query(({ input }) => getLinisteEveningPauseOffer(input.access)), chargeEveningPause: publicProcedure.input(z.object({ access: z.string().length(64) })).mutation(({ input }) => chargeLinisteEveningPause(input.access)), finalizeEveningPause: publicProcedure.input(z.object({ access: z.string().length(64), paymentIntentId: z.string().startsWith("pi_") })).mutation(({ input }) => finalizeLinisteEveningPause(input.access, input.paymentIntentId)) }),
  }),
  calendar: router({
    checkout: router({
      createIntent: publicProcedure.input(z.object({ packageId: z.enum(["oneMonth", "twoMonths", "threeMonths"]), email: z.string().trim().email().max(320), firstName: z.string().trim().min(1).max(120).optional(), currency: z.enum(["usd", "eur", "gbp"]), visitorId: z.string().trim().min(1).max(128).optional(), marketingConsent: z.boolean().default(false), oneClickConsent: z.boolean().default(false) })).mutation(({ input, ctx }) => createCalendarIntent({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
      confirm: publicProcedure.input(z.object({ checkoutToken: z.string().min(20).max(96), paymentIntentId: z.string().min(10).max(255) })).mutation(({ input }) => confirmCalendarIntent(input)),
      oneClick: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), packageId: z.enum(["oneMonth", "twoMonths", "threeMonths"]) })).mutation(({ input }) => purchaseCalendarOneClick(input)),
    }),
    lifecycle: router({ manualSegments: adminProcedure.query(() => getCalendarManualSegments()), exportCampaign: adminProcedure.input(z.object({ campaignKey: z.enum(["abandoned_checkout", "base_only", "next_step_skipped", "missing_product"]) })).query(({ input }) => getCalendarCampaignExport(input.campaignKey)), track: publicProcedure.input(z.object({ eventType: z.enum(calendarLifecycleEvents), email: z.string().trim().email().max(320).optional(), visitorId: z.string().trim().min(1).max(128).optional(), productId: z.enum(["oneMonth", "twoMonths", "threeMonths"]).optional(), metadata: z.record(z.string(), z.unknown()).optional() })).mutation(({ input }) => trackCalendarLifecycle(input)) }),
  }),
  weightloss: router({
    admin: router({
      listOrders: adminProcedure.query(() => listWeightlossOrdersForAdmin()),
      listDownloads: adminProcedure.query(() => listWeightlossDownloadAssets()),
      uploadDownload: adminProcedure.input(z.object({ productSlug: z.string().refine(isWeightlossProduct, "Produs necunoscut"), displayName: z.string().trim().min(2).max(240), fileName: z.string().trim().min(3).max(180), base64: z.string().min(20) })).mutation(({ input }) => uploadWeightlossDownload(input)),
      setDownloadActive: adminProcedure.input(z.object({ assetId: z.number().int().positive(), isActive: z.boolean() })).mutation(({ input }) => setWeightlossDownloadActive(input)),
    }),
    orders: router({
      secureDownloads: publicProcedure.input(z.object({ orderToken: z.string().uuid(), buyerEmail: z.string().email() })).mutation(({ input }) => getWeightlossSecureDownloads(input)),
    }),
    payment: router({
      createIntent: publicProcedure.input(z.object({ productSlug: z.string().refine(isWeightlossProduct, "Produs necunoscut"), buyerEmail: z.string().email(), buyerName: z.string().trim().min(2).max(160), orderToken: z.string().uuid().optional(), affiliateCode: z.string().trim().max(64).optional() })).mutation(({ input, ctx }) => createWeightlossIntent({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
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
      })).mutation(({ input, ctx }) => prepareRelatiiPayment({ ...input, affiliateVisitorToken: affiliateVisitorFromRequest(ctx.req.headers.cookie) })),
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
