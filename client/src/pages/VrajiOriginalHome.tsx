import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle, ArrowRight, Check, CheckCircle2, ChevronDown, CreditCard, Download, Gift, LockKeyhole, Mail, Pencil, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import "./vraji-original.css";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) : null;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cardOptions = {
  style: {
    base: { color: "#231820", fontFamily: "DM Sans, sans-serif", fontSize: "16px", fontSmoothing: "antialiased", "::placeholder": { color: "#9c8c91" } },
    invalid: { color: "#bd205b" },
  },
};

type OfferVariant = "promo67" | "exit20";
type DiscountState = "idle" | "checking" | "awarded";

function money(value: number) {
  return `${value.toFixed(2).replace(".", ",")} RON`;
}

function getSessionId() {
  let sessionId = sessionStorage.getItem("vraji-funnel-session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("vraji-funnel-session", sessionId);
  }
  return sessionId;
}

function Brand() {
  return <div className="flex items-center gap-3"><div className="relative grid h-10 w-10 place-items-center rounded-full border border-[#f28d88] text-[#f28d88]"><Star size={14} fill="currentColor"/><span className="absolute -bottom-1 h-2 w-2 rounded-full bg-[#c12664]"/></div><div><div className="font-display text-[20px] tracking-[.16em] text-[#fff1eb]">VRAJI</div><div className="text-[9px] uppercase tracking-[.28em] text-[#cbb6ba]">intenție · ritual · claritate</div></div></div>;
}

function Header() {
  const [, navigate] = useLocation();
  return <header className="sticky top-0 z-40 border-b border-[#3a2530] bg-[#0c0a0c]/95 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10"><button onClick={() => navigate("/vraji")} aria-label="Pagina principală"><Brand/></button><nav className="hidden items-center gap-7 text-[11px] uppercase tracking-[.17em] text-[#cbb6ba] md:flex"><button onClick={() => document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth" })}>Oferta</button><button onClick={() => navigate("/vraji/afiliere")}>Afiliere</button><button onClick={() => navigate("/vraji/biblioteca")}>Biblioteca mea</button></nav><button onClick={() => document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth" })} className="bg-[#f28d88] px-4 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#160b11] transition hover:bg-[#ffb5aa] active:scale-[.97]">Începe acum</button></div></header>;
}

function InputLabel({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="grid gap-2"><label className="text-xs font-bold uppercase tracking-[.12em] text-[#523942]">{label}</label>{children}{hint && <span className="text-xs leading-5 text-[#876d74]">{hint}</span>}</div>;
}

function FunnelEvent({ eventName, stage }: { eventName: "landing_viewed" | "offer_viewed" | "checkout_viewed"; stage: string }) {
  const event = trpc.vraji.tracking.event.useMutation();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    event.mutate({ sessionId: getSessionId(), eventName, stage });
  }, [event, eventName, stage]);
  return null;
}

function OfferChoice({ active, title, text, onClick }: { active: boolean; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-44 border p-5 text-left transition ${active ? "border-[#c12664] bg-[#f5afa8] shadow-[inset_0_0_0_1px_#c12664]" : "border-[#be8e92] bg-[#f9d1ca] hover:border-[#c12664]"}`}><div className="flex items-start justify-between gap-3"><span className="text-lg font-bold leading-6">{title}</span><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${active ? "border-[#c12664] bg-[#c12664] text-white" : "border-[#a67b80]"}`}>{active && <Check size={14}/>}</span></div><p className="mt-4 text-sm leading-6 text-[#684953]">{text}</p><span className="mt-5 block text-[10px] font-bold uppercase tracking-[.15em] text-[#9e2855]">Apasă pentru a selecta</span></button>;
}

function Offer({ email, setEmail, onAdd }: { email: string; setEmail: (value: string) => void; onAdd: () => void }) {
  const [intention, setIntention] = useState<"new" | "relationship" | null>(null);
  const validEmail = emailRegex.test(email);
  return <section id="oferta" className="relative scroll-mt-28 px-5 py-16 lg:px-10"><FunnelEvent eventName="offer_viewed" stage="offer"/><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><div className="text-[10px] font-bold uppercase tracking-[.23em] text-[#f28d88]">Pasul 1 · alegerea ta</div><h2 className="mt-4 font-display text-6xl leading-[.9]">Nu ghici.<br/><em>Alege.</em></h2><p className="mt-6 max-w-sm text-base leading-7 text-[#cbb6ba]">Alege direcția care ți se potrivește, lasă emailul pentru acces și finalizează comanda în același loc.</p><div className="mt-8 grid gap-3 text-sm text-[#bca7ac]"><div className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#f28d88]"/>Pachet digital cu 3 ghiduri incluse</div><div className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#f28d88]"/>Plată procesată securizat de Stripe</div><div className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#f28d88]"/>Acces protejat în biblioteca personală</div></div></div><div className="border border-[#74515c] bg-[#f7d8cf] p-6 text-[#251720] shadow-xl shadow-black/20 sm:p-9"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c59b9b] pb-5"><span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#9e2855]">Ghidul iubirii cu sens</span><span className="rounded-full bg-[#c12664] px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-white">Pachet digital</span></div><h3 className="mt-6 font-display text-5xl leading-none">Începe cu o intenție<br/><em>care se vede clar.</em></h3><p className="mt-4 text-sm leading-6 text-[#684953]">Nu cerem nume sau data nașterii. Emailul este folosit pentru comandă și accesul securizat la bibliotecă.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><OfferChoice active={intention === "new"} onClick={() => setIntention("new")} title="Vreau să fac loc iubirii" text="O intenție deschisă pentru o conexiune nouă."/><OfferChoice active={intention === "relationship"} onClick={() => setIntention("relationship")} title="Vreau claritate într-o relație" text="Pentru un context pe care îl trăiești deja."/></div><div className="mt-7 border-t border-[#c59b9b] pt-6"><InputLabel label="Email pentru acces și confirmare" hint="Se completează automat în checkout, dar îl poți edita și acolo."><input autoComplete="email" inputMode="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="numele@exemplu.ro" className="w-full border border-[#af878b] bg-white px-4 py-4 text-base outline-none transition focus:border-[#c12664] focus:ring-2 focus:ring-[#c12664]/20"/></InputLabel>{email && !validEmail && <p className="mt-2 flex items-center gap-2 text-xs text-[#a41750]"><AlertCircle size={14}/>Verifică formatul adresei de email.</p>}<button disabled={!validEmail || !intention} onClick={onAdd} className="mt-5 flex w-full items-center justify-center gap-3 bg-[#c12664] px-5 py-4 text-xs font-bold uppercase tracking-[.15em] text-white transition hover:bg-[#a51d52] disabled:cursor-not-allowed disabled:opacity-40">Adaugă în coș <ArrowRight size={16}/></button><p className="mt-3 text-center text-[11px] leading-5 text-[#795c64]">Prețul și orice reducere aplicată se văd clar înainte de plată.</p></div></div></div></section>;
}

function DiscountReveal({ status, offerVariant }: { status: DiscountState; offerVariant: OfferVariant }) {
  if (status === "idle") return <div className="mt-5 rounded-sm border border-dashed border-[#d6a5a8] bg-[#fffaf8] p-4 text-sm text-[#76505c]">Introdu emailul pentru a verifica și aplica promoția de lansare.</div>;
  if (status === "checking") return <div className="discount-reveal mt-5 border border-[#efafad] bg-[#fff5f2] p-4"><div className="flex items-center gap-3"><span className="discount-orbit grid h-9 w-9 place-items-center rounded-full border border-[#c12664] text-[#c12664]"><Sparkles size={16}/></span><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a02956]">Verificăm promoția de lansare</div><div className="mt-1 text-sm text-[#684953]">Calculăm reducerea disponibilă pentru pachetul tău…</div></div></div></div>;
  return <div className="discount-reveal mt-5 overflow-hidden border border-[#e39ca1] bg-[#fff4f1] p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c12664] text-white"><Gift size={17}/></span><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a02956]">Promoție activată acum</div><div className="mt-1 font-semibold text-[#452b35]">Reducerea de {offerVariant === "exit20" ? "153" : "133"} RON este aplicată în sumarul de mai jos.</div><p className="mt-1 text-xs leading-5 text-[#76505c]">Este o ofertă de lansare afișată transparent înainte de plată; nu este un premiu aleatoriu.</p></div></div></div>;
}

function Bump({ active, title, price, text, onClick }: { active: boolean; title: string; price: number; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`mb-3 flex w-full gap-3 border p-3 text-left transition ${active ? "border-[#bd205b] bg-[#fff0ed]" : "border-[#e4d8d9] hover:border-[#bd205b]"}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border ${active ? "border-[#bd205b] bg-[#bd205b] text-white" : "border-[#b69ea3]"}`}>{active && <Check size={13}/>}</span><span><span className="block text-sm font-bold">{title} <em className="not-italic text-[#a02956]">· {money(price)}</em></span><small className="mt-1 block leading-5 text-[#80666e]">{text}</small></span></button>;
}

function PriceSummary({ offerVariant, bumps, expanded, setExpanded, toggleBump }: { offerVariant: OfferVariant; bumps: ("priority-journal" | "closure-ritual")[]; expanded: boolean; setExpanded: (open: boolean) => void; toggleBump: (sku: "priority-journal" | "closure-ritual") => void }) {
  const basePrice = 200;
  const launchDiscount = 133;
  const exitDiscount = offerVariant === "exit20" ? 20 : 0;
  const bumpTotal = (bumps.includes("priority-journal") ? 9.99 : 0) + (bumps.includes("closure-ritual") ? 14.99 : 0);
  const total = basePrice - launchDiscount - exitDiscount + bumpTotal;
  return <aside className="self-start border border-[#ddcfd0] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-display text-3xl">Coșul tău</h3><button type="button" onClick={() => setExpanded(!expanded)} aria-label="Extinde detaliile"><ChevronDown className={`transition ${expanded ? "rotate-180" : ""}`}/></button></div>{expanded && <><div className="mt-5 border-y border-[#e7dcdc] py-5"><div className="flex items-start justify-between gap-4"><div><div className="font-semibold">Vraja pentru iubire + 2 ebook-uri</div><div className="mt-1 flex items-center gap-2 text-xs text-[#8b7379]"><Download size={13}/>Pachet digital</div></div><b className="shrink-0 text-lg">{money(basePrice)}</b></div></div><div className="mt-5 rounded-sm border border-[#d4adb4] bg-[#fff6f3] p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a02956]">Reducere aplicată</div><div className="mt-1 font-semibold">Cod promo: <span className="rounded bg-[#f2cfca] px-1.5 py-0.5 text-[#8e244d]">VRAJI67</span></div></div><Check size={20} className="text-[#19966a]"/></div><p className="mt-2 text-xs leading-5 text-[#74545e]">Codul și valoarea finală sunt verificate pe server înainte de plată.</p></div><div className="mt-5"><div className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#76505c]">Completează pachetul, dacă vrei</div><Bump active={bumps.includes("priority-journal")} onClick={() => toggleBump("priority-journal")} title="Jurnal de intenție — 7 zile" price={9.99} text="Întrebări zilnice pentru a-ți păstra intenția clară."/><Bump active={bumps.includes("closure-ritual")} onClick={() => toggleBump("closure-ritual")} title="Ritual de încheiere" price={14.99} text="Un ghid blând pentru despărțire și noi începuturi."/></div></>}<div className="mt-6 border-t border-[#dfd4d5] pt-5"><div className="flex justify-between text-sm text-[#725862]"><span>Valoare pachet</span><span>{money(basePrice)}</span></div><div className="mt-2 flex justify-between text-sm font-semibold text-[#9d2551]"><span>Promoție de lansare</span><span>− {money(launchDiscount)}</span></div>{exitDiscount > 0 && <div className="mt-2 flex justify-between text-sm font-semibold text-[#9d2551]"><span>Reducere suplimentară de ieșire</span><span>− {money(exitDiscount)}</span></div>}{bumpTotal > 0 && <div className="mt-2 flex justify-between text-sm text-[#725862]"><span>Extra-uri selectate</span><span>+ {money(bumpTotal)}</span></div>}<div className="mt-2 flex justify-between text-sm text-[#725862]"><span>TVA</span><span>Inclus</span></div><div className="mt-4 flex justify-between border-t border-[#bda9ae] pt-4 text-lg font-bold"><span>Total de plată</span><span>{money(total)}</span></div><div className="mt-2 text-right text-xs text-[#80666e]">Economisești {money(launchDiscount + exitDiscount)} față de valoarea pachetului.</div></div><div className="mt-6 flex gap-3 border-t border-[#dfd4d5] pt-5"><LockKeyhole size={18} className="shrink-0 text-[#a02956]"/><p className="text-xs leading-5 text-[#76505c]">Plată criptată, card procesat de Stripe, confirmare și acces securizat la biblioteca ta.</p></div></aside>;
}

function PaymentForm({ email, offerVariant, bumps, affiliateCode }: { email: string; offerVariant: OfferVariant; bumps: ("priority-journal" | "closure-ritual")[]; affiliateCode: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const prepare = trpc.vraji.checkout.prepare.useMutation();
  const confirmPayment = trpc.vraji.checkout.confirm.useMutation();
  const tracking = trpc.vraji.tracking.event.useMutation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let active = true;
    setClientSecret(null);
    prepare.mutate({ email, offerVariant, bumps, affiliateCode }, { onSuccess: result => active && setClientSecret(result.clientSecret), onError: () => active && setError("Nu am putut pregăti plata. Verifică mediul Stripe sandbox și încearcă din nou.") });
    return () => { active = false; };
  }, [email, offerVariant, bumps.join(","), affiliateCode]);

  async function pay() {
    if (!stripe || !elements || !clientSecret) return;
    const card = elements.getElement(CardNumberElement);
    if (!card) return;
    setPaying(true);
    setError(null);
    const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card, billing_details: { email } } });
    if (result.error) {
      setError(result.error.message ?? "Cardul nu a putut fi verificat.");
      setPaying(false);
      return;
    }
    if (result.paymentIntent?.status === "succeeded") {
      await confirmPayment.mutateAsync({ paymentIntentId: result.paymentIntent.id });
      sessionStorage.setItem("vraji-checkout-email", email);
      sessionStorage.setItem("vraji-payment-intent", result.paymentIntent.id);
      tracking.mutate({ sessionId: getSessionId(), eventName: "payment_succeeded", stage: "payment" });
      navigate("/vraji/pas/1");
      return;
    }
    setError("Plata necesită o verificare suplimentară. Încearcă din nou.");
    setPaying(false);
  }

  return <div><InputLabel label="Numărul cardului"><div className="stripe-field"><div className="stripe-mount"><CardNumberElement options={cardOptions}/></div><CreditCard size={19} className="shrink-0 text-[#a02956]"/></div></InputLabel><div className="mt-4 grid gap-4 sm:grid-cols-2"><InputLabel label="Data expirării"><div className="stripe-field"><div className="stripe-mount"><CardExpiryElement options={cardOptions}/></div></div></InputLabel><InputLabel label="Cod de securitate (CVC)"><div className="stripe-field"><div className="stripe-mount"><CardCvcElement options={cardOptions}/></div></div></InputLabel></div><div className="mt-5 flex items-start gap-3 rounded-sm border border-[#e8d9da] bg-[#fffaf9] p-3"><ShieldCheck size={19} className="shrink-0 text-[#19966a]"/><p className="text-xs leading-5 text-[#76505c]">Confirmi plata pentru produs digital. Vei primi acces în biblioteca ta după confirmarea securizată a plății.</p></div>{error && <p className="mt-4 flex items-center gap-2 text-sm text-[#bd205b]"><AlertCircle size={16}/>{error}</p>}<button disabled={!clientSecret || paying || prepare.isPending} onClick={pay} className="mt-6 flex w-full items-center justify-center gap-3 bg-[#bd205b] px-5 py-5 text-xs font-bold uppercase tracking-[.15em] text-white transition hover:bg-[#a51d52] disabled:cursor-not-allowed disabled:opacity-50">{paying ? "Procesăm plata…" : prepare.isPending ? "Pregătim plata…" : "Plătește în siguranță"}<LockKeyhole size={16}/></button><p className="mt-3 text-center text-[11px] text-[#8b7379]">Nu stocăm numărul cardului, data expirării sau CVC-ul.</p></div>;
}

function Checkout({ email, setEmail, offerVariant, affiliateCode, onExit }: { email: string; setEmail: (value: string) => void; offerVariant: OfferVariant; affiliateCode: string | null; onExit: () => void }) {
  const [bumps, setBumps] = useState<("priority-journal" | "closure-ritual")[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [editingEmail, setEditingEmail] = useState(false);
  const [discountState, setDiscountState] = useState<DiscountState>("idle");
  const validEmail = emailRegex.test(email);
  const bumpTotal = (bumps.includes("priority-journal") ? 9.99 : 0) + (bumps.includes("closure-ritual") ? 14.99 : 0);
  const toggleBump = (sku: "priority-journal" | "closure-ritual") => setBumps(current => current.includes(sku) ? current.filter(item => item !== sku) : [...current, sku]);

  useEffect(() => {
    if (!validEmail) { setDiscountState("idle"); return; }
    setDiscountState("checking");
    const timer = window.setTimeout(() => {
      setDiscountState("awarded");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [email, validEmail, offerVariant]);

  return <section id="checkout" className="scroll-mt-20 bg-[#f2eeee] px-5 py-16 text-[#271a22] lg:px-10"><FunnelEvent eventName="checkout_viewed" stage="checkout"/><div className="mx-auto max-w-6xl"><div className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[#a02956]">Pasul 2 · checkout securizat</div><h2 className="mt-3 font-display text-5xl">Totul este gata.<br/><em>Finalizează simplu.</em></h2></div><button onClick={onExit} className="text-xs font-bold uppercase tracking-[.13em] text-[#76505c] hover:text-[#bd205b]">Vreau să ies din checkout</button></div>{!validEmail ? <div className="border border-dashed border-[#bea5aa] bg-white/65 p-8 text-center"><Mail className="mx-auto text-[#bd205b]"/><h3 className="mt-4 font-display text-3xl">Adaugă emailul mai sus.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#76505c]">După o adresă validă, promoția și formularul securizat se activează aici.</p></div> : <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="space-y-5"><div className="border border-[#ddcfd0] bg-white p-6 shadow-sm"><div className="mb-5 flex items-start justify-between gap-4"><div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f28d88] text-xs font-bold">1</div><div><h3 className="font-display text-3xl">Confirmarea emailului</h3><p className="mt-1 text-sm text-[#76505c]">Confirmarea și accesul vor fi trimise către:</p></div></div><button onClick={() => setEditingEmail(current => !current)} className="flex items-center gap-1 text-xs font-bold uppercase tracking-[.12em] text-[#a02956]"><Pencil size={13}/>{editingEmail ? "Gata" : "Editează"}</button></div>{editingEmail ? <InputLabel label="Schimbă adresa de email"><input autoFocus value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" inputMode="email" type="email" className="w-full border border-[#af878b] bg-white px-4 py-4 text-base outline-none focus:border-[#c12664]"/></InputLabel> : <div className="flex items-center gap-3 border border-[#d8c5c8] bg-[#fffaf9] px-4 py-4"><Mail size={18} className="text-[#bd205b]"/><span className="font-medium">{email}</span><Check size={17} className="ml-auto text-[#19966a]"/></div>}<DiscountReveal status={discountState} offerVariant={offerVariant}/></div><div className="border border-[#ddcfd0] bg-white p-6 shadow-sm"><div className="mb-6 flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f28d88] text-xs font-bold">2</div><div><h3 className="font-display text-3xl">Datele de plată</h3><p className="mt-1 text-sm text-[#76505c]">Apasă în câmpuri pentru a introduce numărul cardului, expirarea și CVC-ul. Datele sunt procesate direct de Stripe.</p></div></div>{stripePromise ? <Elements stripe={stripePromise}><PaymentForm email={email} offerVariant={offerVariant} bumps={bumps} affiliateCode={affiliateCode}/></Elements> : <div className="border border-[#f0c9cc] bg-[#fff4f4] p-4 text-sm text-[#9d2551]">Stripe sandbox nu este disponibil încă. După revendicarea sandboxului, câmpurile securizate vor apărea aici.</div>}</div></div><PriceSummary offerVariant={offerVariant} bumps={bumps} expanded={expanded} setExpanded={setExpanded} toggleBump={toggleBump}/></div>}</div></section>;
}

function ExitDiscount({ open, onClose, onAccept }: { open: boolean; onClose: () => void; onAccept: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#110a0f]/80 px-4 backdrop-blur-sm"><div className="relative w-full max-w-lg overflow-hidden border border-[#f28d88]/60 bg-[#f7d8cf] p-7 text-[#21131c] shadow-2xl"><button onClick={onClose} className="absolute right-4 top-4 p-2 text-[#6d4a55]"><X size={18}/></button><div className="grid h-12 w-12 place-items-center rounded-full bg-[#c12664] text-white"><Gift size={22}/></div><div className="mt-6 text-[10px] font-bold uppercase tracking-[.23em] text-[#9e2855]">Oferta ta, o singură dată</div><h2 className="mt-3 font-display text-5xl leading-[.9]">Mai rămâi<br/><em>un moment?</em></h2><p className="mt-5 text-sm leading-6 text-[#674853]">Aplicăm încă <b>20 RON reducere</b> la pachet. În sumar vei vedea exact: 200 RON valoare, −133 RON promoție de lansare și −20 RON reducere suplimentară.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={onAccept} className="bg-[#c12664] px-4 py-4 text-xs font-bold uppercase tracking-[.13em] text-white hover:bg-[#a51d52]">Da, aplică reducerea</button><button onClick={onClose} className="border border-[#a87b84] px-4 py-4 text-xs font-bold uppercase tracking-[.13em] text-[#432d36]">Nu, continui fără</button></div></div></div>;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [offerVariant, setOfferVariant] = useState<OfferVariant>("promo67");
  const [exitOpen, setExitOpen] = useState(false);
  const affiliateCode = new URLSearchParams(window.location.search).get("ref")?.slice(0, 48) ?? null;

  useEffect(() => {
    const seen = sessionStorage.getItem("vraji-exit20-seen");
    const leave = (event: MouseEvent) => {
      if (!seen && event.clientY <= 8 && emailRegex.test(email)) {
        setExitOpen(true);
        sessionStorage.setItem("vraji-exit20-seen", "1");
      }
    };
    document.addEventListener("mouseleave", leave);
    return () => document.removeEventListener("mouseleave", leave);
  }, [email]);

  function addToCart() {
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
    toast.success("Pachetul a fost adăugat în coș.");
  }
  function acceptExit() {
    setOfferVariant("exit20");
    setExitOpen(false);
    toast.success("Reducerea suplimentară de 20 RON a fost aplicată.");
    window.setTimeout(() => document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return <div className="min-h-screen bg-[#0c0a0c] text-[#f8ece7] noise"><Header/><main><FunnelEvent eventName="landing_viewed" stage="landing"/><section className="relative overflow-hidden border-b border-[#3a2530] px-5 py-20 lg:px-10 lg:py-28"><div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_.9fr]"><div><div className="mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[.25em] text-[#f28d88]"><span className="h-px w-12 bg-[#f28d88]"/>ghiduri digitale · promoție de lansare</div><h1 className="max-w-3xl font-display text-6xl leading-[.9] tracking-[-.03em] sm:text-8xl">O alegere mică.<br/><em className="text-[#f28d88]">Un pas al tău.</em></h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#cbb6ba]">Un pachet digital pentru reflecție asupra iubirii, intențiilor și conexiunilor importante. Nu promitem rezultate — îți oferim un spațiu pentru claritate.</p><button onClick={() => document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth" })} className="mt-9 flex items-center gap-3 bg-[#f28d88] px-6 py-4 text-xs font-bold uppercase tracking-[.16em] text-[#160b11] hover:bg-[#ffb5aa]">Alege pachetul <ArrowRight size={16}/></button></div><div className="relative mx-auto w-full max-w-md"><div className="absolute inset-5 rotate-3 border border-[#f28d88]/30"/><div className="relative border border-[#765059] bg-[#f7d8cf] p-5 text-[#20121a] shadow-2xl shadow-[#c12664]/15"><div className="flex min-h-[355px] flex-col justify-between border border-[#9d757a] p-7"><div className="flex justify-between text-[10px] font-bold uppercase tracking-[.2em]"><span>Vraji / 01</span><span>Ebook</span></div><div><div className="mb-5 text-[10px] font-bold uppercase tracking-[.25em] text-[#a02956]">Ghid de intenție</div><div className="font-display text-6xl leading-[.82]">Iubire<br/><em>cu sens.</em></div></div><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.16em]"><span>Digital · acces protejat</span><Star size={16} fill="currentColor"/></div></div></div></div></div></section><Offer email={email} setEmail={setEmail} onAdd={addToCart}/><Checkout email={email} setEmail={setEmail} offerVariant={offerVariant} affiliateCode={affiliateCode} onExit={() => setExitOpen(true)}/></main><footer className="border-t border-[#3a2530] bg-[#100b10] px-5 py-10 text-xs text-[#9f878e] lg:px-10"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-5"><span>© 2026 Vraji · Produse digitale pentru reflecție personală.</span><span>Conținut de divertisment și reflecție; fără garanții de rezultat.</span></div></footer><ExitDiscount open={exitOpen} onClose={() => setExitOpen(false)} onAccept={acceptExit}/></div>;
}
