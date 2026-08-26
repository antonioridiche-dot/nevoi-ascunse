import { stripePromise } from "@/lib/stripe";
import { Check, ChevronLeft, Download, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function ArmoniiUpsell({ access }: { access: string }) {
  const offer = trpc.armonii.postPurchase.context.useQuery({ access }, { retry: false });
  const charge = trpc.armonii.postPurchase.chargeRitual.useMutation();
  const finalize = trpc.armonii.postPurchase.finalizeRitual.useMutation();
  const [error, setError] = useState("");
  const accept = async () => {
    try {
      setError("");
      const result = await charge.mutateAsync({ access });
      if (result.status === "succeeded") return offer.refetch();
      const stripe = await stripePromise;
      if (!stripe || !result.clientSecret || !result.paymentIntentId) throw new Error("Confirmarea suplimentară nu este disponibilă.");
      const confirmed = await stripe.confirmCardPayment(result.clientSecret);
      if (confirmed.error || !confirmed.paymentIntent) throw new Error(confirmed.error?.message ?? "Confirmarea băncii nu a fost finalizată.");
      await finalize.mutateAsync({ access, paymentIntentId: confirmed.paymentIntent.id });
      await offer.refetch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Oferta nu a putut fi adăugată.");
    }
  };
  if (offer.isLoading || !offer.data?.available || !offer.data.title || offer.data.priceCents === null) return null;
  return <section className="mt-8 rounded-2xl border border-[#e5d4be] bg-[#fffdf8] p-6 text-[#32281e]"><p className="flex items-center gap-2 text-xs font-bold tracking-[.17em] text-[#946c40]"><Sparkles className="h-4 w-4" /> OFERTĂ DOAR ACUM</p><h2 className="mt-3 font-serif text-3xl">Vrei să adaugi „{offer.data.title}”?</h2><p className="mt-3 leading-6 text-[#6e6456]">{offer.data.description}</p><strong className="mt-5 block text-3xl">{(offer.data.priceCents / 100).toLocaleString("ro-RO")} lei</strong><small className="mt-1 block text-[#756959]">O plată unică. Nu este abonament.</small>{error && <p className="mt-4 text-sm text-[#a13d47]">{error}</p>}<div className="mt-6 flex flex-col gap-3 sm:flex-row"><button className="rounded-full bg-[#8a6946] px-6 py-3 text-sm font-bold text-white disabled:opacity-60" onClick={accept} disabled={charge.isPending || finalize.isPending}>{charge.isPending || finalize.isPending ? "Se adaugă…" : <><LockKeyhole className="mr-2 inline h-4 w-4" /> Da, adaugă acum</>}</button><button className="rounded-full border border-[#c9b499] px-6 py-3 text-sm font-bold text-[#5f4b35]" onClick={() => offer.refetch()}>Nu, continuă fără ofertă</button></div></section>;
}

export default function ArmoniiOriginalConfirmation() {
  const access = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("acces") ?? "";
  const downloads = trpc.armonii.checkout.downloads.useQuery({ access: access || "0".repeat(32) }, { enabled: Boolean(access), retry: false });
  if (downloads.isLoading) return <main className="flex min-h-screen items-center justify-center bg-[#f6f2e9]"><Loader2 className="h-8 w-8 animate-spin text-[#8a6946]" /></main>;
  if (!access || downloads.isError || !downloads.data) return <main className="min-h-screen bg-[#f6f2e9] px-5 py-24 text-center text-[#29251f]"><p className="text-xs font-semibold tracking-[.17em] text-[#946c40]">ACCES NEGĂSIT</p><h1 className="mt-3 font-serif text-5xl">Linkul nu mai este activ</h1><p className="mx-auto mt-5 max-w-lg text-[#6e6456]">Verifică linkul primit după plată sau contactează administratorul magazinului.</p><Link href="/armonii-bine" className="mt-8 inline-flex rounded-full bg-[#8a6946] px-6 py-3 text-sm font-bold text-white">Înapoi la pagină</Link></main>;
  return <main className="min-h-screen bg-[#f6f2e9] px-5 py-10 text-[#fffaf0] sm:py-16"><div className="mx-auto max-w-3xl"><Link href="/armonii-bine" className="inline-flex items-center gap-2 text-sm text-[#756959]"><ChevronLeft className="h-4 w-4" /> Înapoi la pagina principală</Link><section className="mt-8 rounded-[2rem] bg-[#24201b] p-8 shadow-2xl sm:p-12"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d5a76b] text-[#2c241b]"><Check className="h-6 w-6" /></div><p className="mt-7 text-xs font-semibold tracking-[.17em] text-[#dfbd8d]">PLATĂ CONFIRMATĂ</p><h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Bun venit în spațiul tău de liniște.</h1><p className="mt-5 max-w-xl leading-7 text-[#ded4c4]">Accesul tău este pregătit. Linkurile sunt valabile până la {new Date(downloads.data.expiresAt).toLocaleString("ro-RO")}.</p><div className="mt-8 grid gap-3">{downloads.data.files.length ? downloads.data.files.map(file => <a key={file.id} href={file.url} className="flex items-center justify-between rounded-xl bg-[#f6e7cf] px-6 py-4 text-sm font-bold text-[#302519] hover:bg-white"><span>{file.title}</span><Download className="h-4 w-4" /></a>) : <p className="rounded-xl bg-white/10 p-5 text-sm text-[#ded4c4]">Resursele sunt în curs de asociere pentru această comandă.</p>}</div></section><ArmoniiUpsell access={access} /></div></main>;
}
