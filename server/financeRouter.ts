/**
 * Finanțe / contabilitate — acces doar pentru admin.
 *
 * Răspunde la întrebările pe care le are proprietarul:
 *   - cât am încasat și din ce surse vin banii;
 *   - cât trebuie trimis fiecărui afiliat și cât în total;
 *   - cât am cheltuit (cheltuieli adăugate manual);
 *   - care e profitul, pe lună și în total.
 *
 * Convenții:
 *   - toate sumele sunt în bani (cents) în baza de date și în LEI în răspuns;
 *   - comisionul se recunoaște în luna în care s-a făcut vânzarea (nu când se
 *     plătește afiliatului), ca profitul lunar să reflecte realitatea.
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { affiliates, commissions, expenses } from "../drizzle/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const rangeInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

/** Conditii SQL pentru un interval de date (inclusiv capetele). */
function dateConds(column: unknown, from?: string, to?: string) {
  const conds = [];
  if (from) conds.push(gte(column as never, new Date(from)));
  if (to) conds.push(lte(column as never, new Date(to + "T23:59:59.999Z")));
  return conds;
}

const lei = (cents: number | null | undefined) => Math.round(Number(cents || 0)) / 100;

/** Aduna cheltuielile pe categorii, in lei. */
const EXPENSE_LABELS: Record<string, string> = {
  stripe_fees: "Comisioane Stripe",
  ads: "Reclame",
  software: "Abonamente software",
  contractors: "Colaboratori",
  content: "Conținut / producție",
  taxes: "Taxe și impozite",
  other: "Altele",
};

export const financeRouter = router({
  // ============ SITUATIA PE SCURT ============
  overview: adminProcedure.input(rangeInput).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const orderConds = dateConds(sql`createdAt`, input.from, input.to);
    const commConds = dateConds(sql`createdAt`, input.from, input.to);
    const expConds = dateConds(sql`spentAt`, input.from, input.to);

    const whereOrders = orderConds.length ? sql` WHERE ${sql.join(orderConds, sql` AND `)}` : sql``;
    const whereComms = commConds.length ? sql` WHERE ${sql.join(commConds, sql` AND `)}` : sql``;
    const whereExp = expConds.length ? sql` WHERE ${sql.join(expConds, sql` AND `)}` : sql``;

    // Incasari si rambursari
    const revenueRow = await db.all<{ incasat: number; rambursat: number; comenzi: number }>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amountInCents ELSE 0 END), 0) AS incasat,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amountInCents ELSE 0 END), 0) AS rambursat,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS comenzi
      FROM orders${whereOrders}`);

    // Comisioane generate in perioada (cheltuiala reala cu afiliatii)
    const commRow = await db.all<{ total: number; scadent: number; in_asteptare: number; platit: number; anulat: number }>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN amountInCents ELSE 0 END), 0) AS total,
        COALESCE(SUM(CASE WHEN status IN ('pending','approved') AND payableAt <= unixepoch() THEN amountInCents ELSE 0 END), 0) AS scadent,
        COALESCE(SUM(CASE WHEN status IN ('pending','approved') AND payableAt > unixepoch() THEN amountInCents ELSE 0 END), 0) AS in_asteptare,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amountInCents ELSE 0 END), 0) AS platit,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN amountInCents ELSE 0 END), 0) AS anulat
      FROM commissions${whereComms}`);

    const expRow = await db.all<{ total: number }>(sql`
      SELECT COALESCE(SUM(amountInCents), 0) AS total FROM expenses${whereExp}`);

    const incasat = Number(revenueRow[0]?.incasat || 0);
    const rambursat = Number(revenueRow[0]?.rambursat || 0);
    const comenzi = Number(revenueRow[0]?.comenzi || 0);
    const venitNet = incasat - rambursat;
    const comisionTotal = Number(commRow[0]?.total || 0);
    const cheltuieli = Number(expRow[0]?.total || 0);
    const profit = venitNet - comisionTotal - cheltuieli;

    return {
      incasat: lei(incasat),
      rambursat: lei(rambursat),
      venitNet: lei(venitNet),
      comenzi,
      comandaMedie: comenzi > 0 ? lei(venitNet / comenzi) : 0,
      comisionTotal: lei(comisionTotal),
      comisionScadent: lei(Number(commRow[0]?.scadent || 0)),
      comisionInAsteptare: lei(Number(commRow[0]?.in_asteptare || 0)),
      comisionPlatit: lei(Number(commRow[0]?.platit || 0)),
      comisionAnulat: lei(Number(commRow[0]?.anulat || 0)),
      cheltuieli: lei(cheltuieli),
      profit: lei(profit),
      marja: venitNet > 0 ? Math.round((profit / venitNet) * 1000) / 10 : 0,
    };
  }),

  // ============ DE UNDE VIN BANII ============
  bySource: adminProcedure.input(rangeInput).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const conds = [sql`o.status = 'completed'`, ...dateConds(sql`o.createdAt`, input.from, input.to)];
    const where = sql` WHERE ${sql.join(conds, sql` AND `)}`;

    // Clasificare, in ordine de prioritate:
    //   1. are afiliat pe comanda  -> "Afiliați"
    //   2. clientul a dat click pe un email in cele 7 zile dinaintea comenzii -> "Emailuri"
    //   3. restul -> "Direct / social / organic"
    const rows = await db.all<{ sursa: string; comenzi: number; suma: number }>(sql`
      SELECT
        CASE
          WHEN o.affiliateId IS NOT NULL THEN 'afiliati'
          WHEN EXISTS (
            SELECT 1 FROM email_sends e
            WHERE e.contactId = o.contactId
              AND e.clickedAt IS NOT NULL
              AND e.clickedAt <= o.createdAt
              AND e.clickedAt >= o.createdAt - 604800
          ) THEN 'emailuri'
          ELSE 'direct'
        END AS sursa,
        COUNT(*) AS comenzi,
        COALESCE(SUM(o.amountInCents), 0) AS suma
      FROM orders o${where}
      GROUP BY sursa
      ORDER BY suma DESC`);

    const etichete: Record<string, string> = {
      afiliati: "Afiliați",
      emailuri: "Emailuri (campanii automate)",
      direct: "Direct / social media / organic",
    };

    const total = rows.reduce((s, r) => s + Number(r.suma || 0), 0);
    return {
      total: lei(total),
      surse: rows.map((r) => ({
        sursa: r.sursa,
        eticheta: etichete[r.sursa] || r.sursa,
        comenzi: Number(r.comenzi || 0),
        suma: lei(Number(r.suma || 0)),
        procent: total > 0 ? Math.round((Number(r.suma || 0) / total) * 1000) / 10 : 0,
      })),
    };
  }),

  // ============ PE LUNI ============
  byMonth: adminProcedure.input(z.object({ months: z.number().min(1).max(36).default(12) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Ultimele N luni, inclusiv cea curenta, ca sir "YYYY-MM".
    const months: string[] = [];
    const now = new Date();
    for (let i = input.months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push(d.toISOString().slice(0, 7));
    }
    const first = months[0] + "-01";
    const firstTs = Math.floor(new Date(first + "T00:00:00Z").getTime() / 1000);

    const rev = await db.all<{ luna: string; incasat: number; rambursat: number; comenzi: number }>(sql`
      SELECT strftime('%Y-%m', createdAt, 'unixepoch') AS luna,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amountInCents ELSE 0 END), 0) AS incasat,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amountInCents ELSE 0 END), 0) AS rambursat,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS comenzi
      FROM orders WHERE createdAt >= ${firstTs} GROUP BY luna`);

    const com = await db.all<{ luna: string; total: number }>(sql`
      SELECT strftime('%Y-%m', createdAt, 'unixepoch') AS luna,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN amountInCents ELSE 0 END), 0) AS total
      FROM commissions WHERE createdAt >= ${firstTs} GROUP BY luna`);

    const exp = await db.all<{ luna: string; total: number }>(sql`
      SELECT strftime('%Y-%m', spentAt, 'unixepoch') AS luna,
        COALESCE(SUM(amountInCents), 0) AS total
      FROM expenses WHERE spentAt >= ${firstTs} GROUP BY luna`);

    const map = (rows: { luna: string }[], key: string) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(String(r.luna), Number((r as never as Record<string, number>)[key] || 0));
      return m;
    };
    const mRev = map(rev, "incasat");
    const mRef = map(rev, "rambursat");
    const mCnt = map(rev, "comenzi");
    const mCom = map(com, "total");
    const mExp = map(exp, "total");

    return months.map((luna) => {
      const incasat = mRev.get(luna) || 0;
      const rambursat = mRef.get(luna) || 0;
      const venitNet = incasat - rambursat;
      const commission = mCom.get(luna) || 0;
      const cheltuiala = mExp.get(luna) || 0;
      return {
        luna,
        incasat: lei(incasat),
        rambursat: lei(rambursat),
        venitNet: lei(venitNet),
        comenzi: mCnt.get(luna) || 0,
        comision: lei(commission),
        cheltuieli: lei(cheltuiala),
        profit: lei(venitNet - commission - cheltuiala),
      };
    });
  }),

  // ============ CAT TREBUIE PLATIT AFILIATILOR ============
  affiliateLiabilities: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const rows = await db.all<{
      id: number; name: string; email: string; payoutMethod: string | null; payoutDetails: string | null;
      scadent: number; in_asteptare: number; platit: number; total: number;
    }>(sql`
      SELECT a.id, a.name, a.email, a.payoutMethod, a.payoutDetails,
        COALESCE(SUM(CASE WHEN c.status IN ('pending','approved') AND c.payableAt <= unixepoch() THEN c.amountInCents ELSE 0 END), 0) AS scadent,
        COALESCE(SUM(CASE WHEN c.status IN ('pending','approved') AND c.payableAt > unixepoch() THEN c.amountInCents ELSE 0 END), 0) AS in_asteptare,
        COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amountInCents ELSE 0 END), 0) AS platit,
        COALESCE(SUM(CASE WHEN c.status != 'cancelled' THEN c.amountInCents ELSE 0 END), 0) AS total
      FROM affiliates a
      LEFT JOIN commissions c ON c.affiliateId = a.id
      GROUP BY a.id
      ORDER BY scadent DESC, total DESC`);

    const lista = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      email: r.email,
      payoutMethod: r.payoutMethod,
      payoutDetails: r.payoutDetails,
      scadent: lei(Number(r.scadent || 0)),
      inAsteptare: lei(Number(r.in_asteptare || 0)),
      platit: lei(Number(r.platit || 0)),
      total: lei(Number(r.total || 0)),
    }));

    const suma = (k: "scadent" | "inAsteptare" | "platit" | "total") =>
      Math.round(lista.reduce((s, r) => s + r[k], 0) * 100) / 100;

    return {
      lista,
      totaluri: {
        scadent: suma("scadent"),
        inAsteptare: suma("inAsteptare"),
        platit: suma("platit"),
        total: suma("total"),
        // Cati bani mai trebuie trimisi de acum inainte (scadent + in asteptare).
        dePlatit: Math.round((suma("scadent") + suma("inAsteptare")) * 100) / 100,
      },
    };
  }),

  // ============ CHELTUIELI ============
  expenses: router({
    list: adminProcedure.input(z.object({ limit: z.number().min(1).max(500).default(200) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(expenses).orderBy(desc(expenses.spentAt)).limit(input.limit);
      return rows.map((r) => ({
        id: r.id,
        spentAt: r.spentAt,
        category: r.category,
        categoryLabel: EXPENSE_LABELS[r.category] || r.category,
        description: r.description,
        amount: lei(r.amountInCents),
        recurring: r.recurring,
        notes: r.notes,
      }));
    }),

    byCategory: adminProcedure.input(rangeInput).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conds = dateConds(sql`spentAt`, input.from, input.to);
      const where = conds.length ? sql` WHERE ${sql.join(conds, sql` AND `)}` : sql``;
      const rows = await db.all<{ category: string; total: number; nr: number }>(sql`
        SELECT category, COALESCE(SUM(amountInCents), 0) AS total, COUNT(*) AS nr
        FROM expenses${where} GROUP BY category ORDER BY total DESC`);
      return rows.map((r) => ({
        category: r.category,
        categoryLabel: EXPENSE_LABELS[r.category] || r.category,
        total: lei(Number(r.total || 0)),
        nr: Number(r.nr || 0),
      }));
    }),

    add: adminProcedure
      .input(z.object({
        spentAt: z.string(),
        category: z.enum(["stripe_fees", "ads", "software", "contractors", "content", "taxes", "other"]),
        description: z.string().min(2).max(200),
        amount: z.number().positive(),
        recurring: z.boolean().default(false),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const amountInCents = Math.round(input.amount * 100);
        await db.insert(expenses).values({
          spentAt: new Date(input.spentAt + "T12:00:00Z"),
          category: input.category,
          description: input.description.trim(),
          amountInCents,
          recurring: input.recurring,
          notes: input.notes?.trim() || null,
        });
        return { ok: true };
      }),

    remove: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(expenses).where(eq(expenses.id, input.id));
      return { ok: true };
    }),

    categories: adminProcedure.query(() =>
      Object.entries(EXPENSE_LABELS).map(([value, label]) => ({ value, label })),
    ),
  }),

  /** Lista afiliatilor, pentru filtre si pentru pagina de plati. */
  affiliatesSimple: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({ id: affiliates.id, name: affiliates.name, email: affiliates.email, status: affiliates.status }).from(affiliates).orderBy(affiliates.id);
    return rows;
  }),
});
