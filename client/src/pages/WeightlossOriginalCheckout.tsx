import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ProductArt } from "./WeightlossProductArt";
import { SiteFooter, SiteHeader } from "./WeightlossSiteChrome";
import { formatWeightlossPrice as formatPrice, isWeightlossProductSlug as isProductSlug, orderedWeightlossUpsells as orderedUpsells, weightlossProducts as products, type WeightlossProductSlug as ProductSlug } from "@/flows/weightlossProducts";
import { trpc } from "@/lib/trpc";

export function getNextRoute(slug: ProductSlug, orderToken: string, originalPaymentIntentId: string) {
  const payment = encodeURIComponent(originalPaymentIntentId);
  if (slug === "bucatarie") return `/weightloss/oferta/retete?comanda=${encodeURIComponent(orderToken)}&plata=${payment}`;
  const index = orderedUpsells.indexOf(slug as Exclude<ProductSlug, "bucatarie">);
  const next = orderedUpsells[index + 1];
  return next ? `/weightloss/oferta/${next}?comanda=${encodeURIComponent(orderToken)}&plata=${payment}` : `/weightloss/multumim?comanda=${encodeURIComponent(orderToken)}`;
}

function PayButton({ buyerEmail, orderToken, product }: { buyerEmail: string; orderToken: string; product: ProductSlug }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true); setError("");
    localStorage.setItem(`order-email:${orderToken}`, buyerEmail);
    localStorage.setItem(`order-name:${orderToken}`, window.sessionStorage.getItem(`checkout-name:${orderToken}`) ?? "");
    const { error: submitError } = await elements.submit();
    if (submitError) { setError(submitError.message ?? "Verifică datele introduse."); setBusy(false); return; }
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: product === "bucatarie"
        ? `${window.location.origin}/weightloss/oferta/retete?comanda=${encodeURIComponent(orderToken)}`
        : `${window.location.origin}/weightloss/multumim?comanda=${encodeURIComponent(orderToken)}` },
      redirect: "if_required",
    });
    if (confirmError) { setError(confirmError.message ?? "Plata nu a putut fi confirmată."); setBusy(false); return; }
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      localStorage.setItem(`order-payment:${orderToken}`, paymentIntent.id);
      setLocation(getNextRoute(product, orderToken, paymentIntent.id));
      return;
    }
    setError("Plata necesită o confirmare suplimentară. Încearcă din nou."); setBusy(false);
  }

  return <form onSubmit={pay} className="mt-6"><PaymentElement options={{ layout: "tabs" }} /><button disabled={!stripe || busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9322d] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#a92321] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{busy ? "Se confirmă plata..." : "Plătește în siguranță"}</button>{error && <p className="mt-3 text-center text-sm text-red-700">{error}</p>}</form>;
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const paramProduct = params.get("produs");
  const productSlug: ProductSlug = isProductSlug(paramProduct) ? paramProduct : "bucatarie";
  const product = products[productSlug];
  const inheritedOrder = params.get("comanda") || undefined;
  const [buyerName, setBuyerName] = useState(() => inheritedOrder ? localStorage.getItem(`order-name:${inheritedOrder}`) ?? "" : "");
  const [buyerEmail, setBuyerEmail] = useState(() => inheritedOrder ? localStorage.getItem(`order-email:${inheritedOrder}`) ?? "" : "");
  const [secret, setSecret] = useState<string>();
  const [orderToken, setOrderToken] = useState<string>();
  const [error, setError] = useState("");
  const createIntent = trpc.weightloss.payment.createIntent.useMutation();
  const affiliateCode = params.get("ref") || undefined;

  async function preparePayment(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      const result = await createIntent.mutateAsync({ productSlug, buyerName, buyerEmail, orderToken: inheritedOrder, affiliateCode });
      window.sessionStorage.setItem(`checkout-name:${result.orderToken}`, buyerName);
      setSecret(result.clientSecret); setOrderToken(result.orderToken);
    } catch (err) { setError(err instanceof Error ? err.message : "Nu am putut pregăti plata."); }
  }

  return <div className="min-h-screen bg-[#f5f2ed] text-slate-900"><SiteHeader compact /><main className="px-4 py-8 sm:py-14"><div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[.85fr_1.15fr]"><aside className="rounded-[2rem] bg-slate-950 p-8 text-white lg:sticky lg:top-24 lg:h-fit"><Link href={productSlug === "bucatarie" ? "/weightloss" : `/weightloss/oferta/${productSlug}?comanda=${inheritedOrder ?? ""}`} className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Înapoi la ofertă</Link><div className="mt-8"><ProductArt product={product} compact /></div><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-[#f7cf78]">Comanda ta</p><h1 className="mt-3 font-serif text-3xl font-bold leading-tight">{product.title}</h1><p className="mt-4 text-sm leading-6 text-white/70">{product.description}</p><div className="mt-7 border-t border-white/15 pt-5"><div className="flex justify-between text-sm text-white/70"><span>Acces digital</span><span>{formatPrice(product.price)}</span></div><div className="mt-4 flex justify-between font-serif text-2xl font-bold"><span>Total</span><span>{formatPrice(product.price)}</span></div></div><div className="mt-7 flex gap-2 text-xs leading-5 text-white/60"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />Datele cardului sunt prelucrate de Stripe. Acest site nu stochează numărul cardului sau codul CVV.</div></aside><section className="rounded-[2rem] border border-black/10 bg-[#fffdf9] p-6 shadow-[0_18px_50px_rgba(76,52,34,.10)] sm:p-9"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f9e6df] text-[#c9322d]"><LockKeyhole className="h-4 w-4" /></span><div><p className="font-serif text-2xl font-bold">Finalizează comanda</p><p className="text-sm text-slate-500">Primești acces după confirmarea plății.</p></div></div>{!secret ? <form onSubmit={preparePayment} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Nume și prenume<input value={buyerName} onChange={e => setBuyerName(e.target.value)} required autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#c9322d] focus:ring-4 focus:ring-red-100" placeholder="Numele tău" /></label><label className="block text-sm font-semibold">Adresă de e-mail<input value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required type="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#c9322d] focus:ring-4 focus:ring-red-100" placeholder="nume@exemplu.ro" /></label><p className="flex gap-2 rounded-xl bg-[#f4f0ea] p-4 text-xs leading-5 text-slate-600"><Mail className="h-4 w-4 shrink-0 text-[#c9322d]" />Folosim e-mailul pentru identificarea comenzii și pentru verificarea accesului la fișierele digitale. Nu trimitem confirmare prin e-mail până când expeditorul nu este verificat.</p><button disabled={createIntent.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-[#c9322d] disabled:opacity-60">{createIntent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{createIntent.isPending ? "Se pregătește plata..." : "Continuă către plată"}</button>{error && <p className="text-center text-sm text-red-700">{error}</p>}</form> : <><div className="mt-8 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5" />Datele comenzii sunt pregătite pentru plată.</div><Elements stripe={stripePromise} options={{ clientSecret: secret, appearance: { theme: "stripe", variables: { colorPrimary: "#c9322d", borderRadius: "12px" } } }}><PayButton buyerEmail={buyerEmail} orderToken={orderToken!} product={productSlug} /></Elements><button onClick={() => { setSecret(undefined); setOrderToken(undefined); }} className="mt-4 w-full text-center text-xs font-semibold text-slate-500 underline">Editează datele de comandă</button></>}</section></div></main><SiteFooter /></div>;
}
