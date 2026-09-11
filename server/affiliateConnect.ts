import Stripe from "stripe";
import { getDb } from "./db";
import { affiliates, commissions, payouts } from "../drizzle/schema";
import { eq, and, lte, isNotNull, isNull, inArray, or } from "drizzle-orm";

/**
 * Doar afiliatii care AU ALES Stripe ca metoda de plata primesc bani automat.
 * Fara asta, cine a ales IBAN (manual) dar are si cont Connect activ ar putea
 * fi platit de doua ori: o data de cron, o data manual de admin.
 */
const ONLY_STRIPE_METHOD = (a: typeof affiliates) =>
  or(isNull(a.payoutMethod), eq(a.payoutMethod, "stripe"));

/**
 * Stripe Connect (Express) - afiliatii isi conecteaza un cont Stripe si sunt
 * platiti automat prin transferuri, dupa perioada de garantie + retentie.
 */

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_not_configured", {
    apiVersion: "2025-04-30.basil" as any,
  });
}

// Prag minim pentru retragerea MANUALA (butonul "Retrage acum" din panoul afiliatului):
// 0 = fara prag, afiliatul poate retrage orice suma scadenta.
export const CONNECT_MIN_PAYOUT_CENTS = 0;
// Prag minim doar pentru transferurile AUTOMATE din cron (ca sa nu facem
// transferuri de 3 lei in fundal la fiecare comision scadent).
export const CONNECT_AUTO_PAYOUT_MIN_CENTS = 5000; // 50 lei

/** Trimite un email catre afiliat (Resend). Best-effort: nu arunca niciodata. */
export async function sendAffiliateEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey || !to) return false;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Cristina de la Peste Despartire <anca@comenzi.tevreauinapoi.ro>",
        to: [to],
        subject,
        html,
      }),
    });
    return true;
  } catch (err) {
    console.error("[Affiliate email] failed:", (err as Error).message);
    return false;
  }
}

/**
 * Sablon email pentru LINKUL DE ACCES in panoul de afiliat.
 *
 * Am renuntat la codul de 6 cifre: afiliatul primeste direct un link pe care
 * apasa o singura data. Linkul e valabil 60 de minute si poate fi folosit o
 * singura data (dupa aceea browserul ramane conectat 90 de zile).
 *
 * ATENTIE la construirea atributului href: se foloseste UN SINGUR q inainte si
 * UN SINGUR q dupa link. Cu doi de q se genera href="" (link gol) si butonul nu
 * mai facea nimic cand era apasat.
 */
export function linkEmailHtml(url: string, created: boolean): string {
  const q = String.fromCharCode(34);
  const title = created ? "Contul tău de afiliat e gata" : "Linkul tău de acces";
  const intro = created
    ? "Bine ai venit! Ți-am creat contul de afiliat. Apasă butonul de mai jos ca să intri în panoul tău — de acolo iei linkurile de promovare și vezi cât ai câștigat."
    : "Apasă butonul de mai jos ca să intri în panoul tău de afiliat. Nu ai nevoie de parolă.";
  return [
    "<!DOCTYPE html><html><body style=" + q + "font-family:Arial,Helvetica,sans-serif;background:#f5f2ea;padding:24px;" + q + ">",
    "<div style=" + q + "max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;text-align:center;" + q + ">",
    "<p style=" + q + "color:#c9a44a;font-size:28px;margin:0 0 8px;" + q + ">&#9829;</p>",
    "<h2 style=" + q + "color:#1b2d4f;margin:0 0 8px;" + q + ">" + title + "</h2>",
    "<p style=" + q + "font-size:14px;color:#444;margin:0 0 22px;" + q + ">" + intro + "</p>",
    "<p style=" + q + "margin:0 0 20px;" + q + "><a href=" + q + url + q + " style=" + q + "display:inline-block;background:#1b2d4f;color:#fff;text-decoration:none;padding:15px 30px;border-radius:999px;font-weight:bold;font-size:15px;" + q + ">Deschide panoul meu de afiliat →</a></p>",
    "<p style=" + q + "font-size:12px;color:#888;margin:0 0 6px;word-break:break-all;" + q + ">Dacă butonul nu se deschide, copiază linkul de aici:<br>" + url + "</p>",
    "<p style=" + q + "font-size:14px;color:#444;margin:18px 0 8px;" + q + ">Linkul expiră în <strong>60 de minute</strong> și poate fi folosit o singură dată.</p>",
    "<p style=" + q + "font-size:13px;color:#666;margin:0;" + q + ">Dacă nu ai cerut tu acest link, ignoră emailul — nu se întâmplă nimic.</p>",
    "<p style=" + q + "font-size:13px;color:#666;margin:20px 0 0;" + q + ">— Cristina, Peste Despartire</p>",
    "</div></body></html>",
  ].join("");
}

/** Sablon email pentru afiliat: "banii au plecat spre tine". */
export function payoutEmailHtml(opts: { name: string; amountLei: string; methodLabel: string; extra?: string }): string {
  const q = String.fromCharCode(34);
  const row = (label: string, value: string, strong?: boolean) =>
    "<p style=" + q + "font-size:14px;color:#444;margin:6px 0;" + q + "><strong>" + label + "</strong> " +
    (strong ? "<span style=" + q + "font-size:16px;color:#1b2d4f;font-weight:bold;" + q + ">" + value + "</span>" : value) + "</p>";
  return [
    "<!DOCTYPE html><html><body style=" + q + "font-family:Arial,Helvetica,sans-serif;background:#f5f2ea;padding:24px;" + q + ">",
    "<div style=" + q + "max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;" + q + ">",
    "<h2 style=" + q + "color:#1b2d4f;margin-top:0;" + q + ">Banii tăi au plecat 🎉</h2>",
    "<p style=" + q + "font-size:14px;color:#444;" + q + ">Bună, " + opts.name + "!</p>",
    row("Sumă:", opts.amountLei + " RON", true),
    row("Metoda:", opts.methodLabel),
    "<p style=" + q + "font-size:14px;color:#444;" + q + ">" + (opts.extra || "") + "</p>",
    "<p style=" + q + "font-size:14px;color:#444;" + q + ">Poți vedea statusul fiecărui comision în panoul tău de afiliat, la „Comisioanele Tale” — cele plătite apar cu statusul <strong>Plătit</strong>.</p>",
    "<p style=" + q + "font-size:13px;color:#666;" + q + ">Dacă ceva nu e în regulă, răspunde direct la acest email.</p>",
    "<p style=" + q + "font-size:13px;color:#666;" + q + ">— Cristina, Peste Despartire</p>",
    "</div></body></html>",
  ].join("");
}

export function classifyConnectStatus(account: Stripe.Account): "active" | "restricted" | "pending" {
  if (account.payouts_enabled && account.details_submitted) return "active";
  if (account.requirements?.disabled_reason) return "restricted";
  return "pending";
}

export async function getAffiliateById(affiliateId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(affiliates).where(eq(affiliates.id, affiliateId)).limit(1);
  return rows[0] ?? null;
}

/** Creeaza/actualizeaza contul Connect si intoarce linkul de onboarding. */
export async function startAffiliateConnectOnboarding(affiliateId: number, origin: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) throw new Error("Afiliatul nu a fost gasit.");
  const stripe = getStripe();
  let accountId = affiliate.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "RO",
      email: affiliate.email,
      business_type: "individual",
      capabilities: { transfers: { requested: true } },
      business_profile: { product_description: "Promovare afiliata a produselor digitale" },
      metadata: { affiliateId: String(affiliate.id), affiliateCode: affiliate.referralCode },
    });
    accountId = account.id;
    await db.update(affiliates).set({ stripeConnectAccountId: accountId, connectStatus: "pending" }).where(eq(affiliates.id, affiliateId));
  }
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: origin + "/affiliate/dashboard?connect=refresh",
    return_url: origin + "/affiliate/dashboard?connect=return",
    type: "account_onboarding",
  });
  return { url: accountLink.url, accountId };
}

/** Sincronizeaza statusul contului Connect (webhook account.updated). */
export async function syncConnectStatusFromAccount(account: Stripe.Account) {
  const db = await getDb();
  if (!db) return;
  const status = classifyConnectStatus(account);
  const rows = await db.select().from(affiliates).where(eq(affiliates.stripeConnectAccountId, account.id)).limit(1);
  if (rows[0]) {
    await db.update(affiliates).set({ connectStatus: status }).where(eq(affiliates.id, rows[0].id));
    return;
  }
  const metaId = account.metadata?.affiliateId;
  if (metaId) {
    await db.update(affiliates).set({ stripeConnectAccountId: account.id, connectStatus: status }).where(eq(affiliates.id, Number(metaId)));
  }
}

/** Plateste automat comisioanele scadente catre afiliatii cu cont Connect activ. */
export async function processConnectPayouts(): Promise<{ paid: number; amountCents: number; failed: number }> {
  const db = await getDb();
  if (!db) return { paid: 0, amountCents: 0, failed: 0 };
  if (!process.env.STRIPE_SECRET_KEY) return { paid: 0, amountCents: 0, failed: 0 };

  const due = await db.select({
    commissionId: commissions.id,
    affiliateId: commissions.affiliateId,
    amountInCents: commissions.amountInCents,
    accountId: affiliates.stripeConnectAccountId,
    connectStatus: affiliates.connectStatus,
  })
    .from(commissions)
    .innerJoin(affiliates, eq(commissions.affiliateId, affiliates.id))
    .where(and(
      eq(commissions.status, "pending"),
      lte(commissions.payableAt, new Date()),
      isNotNull(affiliates.stripeConnectAccountId),
      eq(affiliates.connectStatus, "active"),
      ONLY_STRIPE_METHOD(affiliates),
    ));

  if (due.length === 0) return { paid: 0, amountCents: 0, failed: 0 };

  const byAffiliate = new Map<number, { accountId: string; amount: number; commissionIds: number[] }>();
  for (const row of due) {
    if (!row.accountId) continue;
    const existing = byAffiliate.get(row.affiliateId);
    const bucket = existing ?? { accountId: row.accountId, amount: 0, commissionIds: [] };
    bucket.amount += row.amountInCents;
    bucket.commissionIds.push(row.commissionId);
    byAffiliate.set(row.affiliateId, bucket);
  }

  const stripe = getStripe();
  let paid = 0;
  let amountCents = 0;
  let failed = 0;
  for (const item of byAffiliate) {
    const affiliateId = item[0];
    const entry = item[1];
    // Transferurile automate asteapta un prag rezonabil; retragerea manuala nu are prag.
    if (entry.amount < CONNECT_AUTO_PAYOUT_MIN_CENTS) {
      console.log("[Connect] affiliate " + affiliateId + " below auto-payout min (" + entry.amount + " < " + CONNECT_AUTO_PAYOUT_MIN_CENTS + "), keeping pending");
      continue;
    }
    try {
      await stripe.transfers.create({
        amount: entry.amount,
        currency: "ron",
        destination: entry.accountId,
        metadata: { affiliateId: String(affiliateId), mode: "auto-connect" },
      });
      for (const commissionId of entry.commissionIds) {
        await db.update(commissions).set({ status: "paid", paidAt: new Date() }).where(eq(commissions.id, commissionId));
      }
      await db.insert(payouts).values({
        affiliateId,
        amountInCents: entry.amount,
        paymentMethod: "stripe_connect",
        paymentReference: "transfer:" + affiliateId,
        notes: "Plata automata Stripe Connect",
      });
      const affRows = await db.select({ totalPaid: affiliates.totalPaid }).from(affiliates).where(eq(affiliates.id, affiliateId)).limit(1);
      const current = affRows[0]?.totalPaid ?? 0;
      await db.update(affiliates).set({ totalPaid: current + entry.amount }).where(eq(affiliates.id, affiliateId));
      paid += 1;
      amountCents += entry.amount;
    } catch (err) {
      console.error("[Connect] transfer failed for affiliate " + affiliateId + ":", (err as Error).message);
      failed += 1;
    }
  }
  return { paid, amountCents, failed };
}

/** Soldul real (RON) disponibil/in tranzit din contul Connect al afiliatului. */
export async function getConnectBalance(accountId: string): Promise<{ available: number; pending: number } | null> {
  try {
    const bal: any = await (getStripe().balance.retrieve as any)(undefined, { stripeAccount: accountId });
    const pick = (arr: any[]): number => {
      const row = (arr || []).find((b: any) => b.currency === "ron");
      return row?.amount ?? 0;
    };
    return { available: pick(bal?.available), pending: pick(bal?.pending) };
  } catch (err) {
    console.error("[Connect] balance error:", (err as Error).message);
    return null;
  }
}

/** Link unic de acces in dashboard-ul Express (doar daca afiliatul are nevoie: cont bancar, verificari). */
export async function createExpressLoginLink(accountId: string): Promise<string | null> {
  try {
    const link = await getStripe().accounts.createLoginLink(accountId);
    return link.url;
  } catch (err) {
    console.error("[Connect] login link error:", (err as Error).message);
    return null;
  }
}

/** Plateste acum toate comisioanele scadente/aprobate ale unui afiliat conectat. */
export async function payOutAffiliate(affiliateId: number, minCents: number): Promise<{ amountCents: number; count: number; error?: string }> {
  const db = await getDb();
  if (!db) return { amountCents: 0, count: 0 };
  const now = new Date();
  const rows = await db.select({
    id: commissions.id,
    amountInCents: commissions.amountInCents,
    accountId: affiliates.stripeConnectAccountId,
    affiliateEmail: affiliates.email,
    affiliateName: affiliates.name,
  })
    .from(commissions)
    .innerJoin(affiliates, eq(commissions.affiliateId, affiliates.id))
    .where(and(
      eq(commissions.affiliateId, affiliateId),
      inArray(commissions.status, ["pending", "approved"]),
      or(
        eq(commissions.status, "approved"),
        lte(commissions.payableAt, now)
      ),
      isNotNull(affiliates.stripeConnectAccountId),
      eq(affiliates.connectStatus, "active"),
      ONLY_STRIPE_METHOD(affiliates),
    ));

  const total = rows.reduce((s, r) => s + r.amountInCents, 0);
  const accountId = rows[0]?.accountId;
  if (!rows.length || !accountId || total <= 0 || total < minCents) return { amountCents: 0, count: 0 };

  try {
    await getStripe().transfers.create({
      amount: total,
      currency: "ron",
      destination: accountId,
      metadata: { affiliateId: String(affiliateId), mode: "affiliate-withdraw" },
    });
    for (const row of rows) {
      await db.update(commissions).set({ status: "paid", paidAt: new Date() }).where(eq(commissions.id, row.id));
    }
    await db.insert(payouts).values({
      affiliateId,
      amountInCents: total,
      paymentMethod: "stripe_connect",
      paymentReference: "transfer:" + accountId,
      notes: "Retragere din panoul de afiliat",
    });
    const affRows = await db.select({ totalPaid: affiliates.totalPaid }).from(affiliates).where(eq(affiliates.id, affiliateId)).limit(1);
    await db.update(affiliates).set({ totalPaid: (affRows[0]?.totalPaid ?? 0) + total }).where(eq(affiliates.id, affiliateId));
    // Notificare afiliat: banii au intrat in contul lui Stripe.
    await sendAffiliateEmail(
      rows[0]?.affiliateEmail || "",
      "Banii tăi au intrat în contul Stripe — " + (total / 100).toFixed(2) + " RON",
      payoutEmailHtml({
        name: rows[0]?.affiliateName || "",
        amountLei: (total / 100).toFixed(2),
        methodLabel: "Stripe (automat)",
        extra: "Suma a intrat în contul tău Stripe. De acolo Stripe o trimite automat în contul tău bancar, de obicei în 1–2 zile lucrătoare — primești și un email de la Stripe când pleacă spre bancă.",
      }),
    );
    return { amountCents: total, count: rows.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Connect] withdraw transfer failed for affiliate " + affiliateId + ":", msg);
    return { amountCents: 0, count: 0, error: msg };
  }
}