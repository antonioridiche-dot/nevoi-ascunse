import { COOKIE_NAME } from "@shared/const";
import { getBrandCatalog } from "./db";
import { startTarotCheckout, startTarotOfferCheckout } from "./commerce/tarotService";
import { getTarotLibrary, redeemTarotAccess } from "./access/tarotAccess";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

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

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
