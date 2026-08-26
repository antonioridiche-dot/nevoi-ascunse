import { SiteFooter } from "./RelatiiSiteFooter";
import { BOOKS, MAIN_PRODUCT_POST_PAYMENT_ROUTE, type Audience } from "@/flows/relatiiFunnelSource";
import { trpc } from "@/lib/trpc";
import { stripePromise } from "@/lib/stripe";
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { Check, ChevronDown, CircleHelp, LockKeyhole, MoveDown, ShieldCheck, Tag, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import "./relatii-original.css";

const CHECKOUT_PRICES = { RON: { reference: 200, promo: 67, exit: 47 } } as const;
type OfferVariant = "promo67" | "exit20";
const formatCheckoutPrice = (_currency: "RON", amount: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(amount);
const stripeElementOptions = {
  style: {
    base: { color: "#181512", fontFamily: "inherit", fontSize: "16px", "::placeholder": { color: "#7f746a" } },
    invalid: { color: "#b42318" },
  },
};

function goToCheckout() {
  document.getElementById("comanda")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ProductPage({ audience }: { audience: Audience }) {
  const book = BOOKS[audience];
  const initial = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    return { email: window.localStorage.getItem("checkout-email") ?? "", offer: query.get("offer") === "exit20" ? "exit20" as const : "promo67" as const };
  }, []);
  const [offer, setOffer] = useState<OfferVariant>(initial.offer);
  const [showExitOffer, setShowExitOffer] = useState(false);
  const referencePrice = CHECKOUT_PRICES.RON.reference;
  const price = offer === "exit20" ? CHECKOUT_PRICES.RON.exit : CHECKOUT_PRICES.RON.promo;
  const discount = referencePrice - price;

  useEffect(() => {
    const showOnce = (event: MouseEvent) => {
      if (event.clientY > 0 || sessionStorage.getItem(`exit20:${book.handle}`)) return;
      sessionStorage.setItem(`exit20:${book.handle}`, "shown");
      setShowExitOffer(true);
    };
    document.addEventListener("mouseleave", showOnce);
    return () => document.removeEventListener("mouseleave", showOnce);
  }, [book.handle]);

  const applyExitOffer = () => {
    setOffer("exit20");
    setShowExitOffer(false);
    goToCheckout();
  };

  return (
    <main className={`book-page ${book.accent}`}>
      <header className="site-header"><Link href="/relatii" className="brand-lockup"><span className="brand-mark" aria-hidden="true" /><span>Dicționarul<br />Relațiilor</span></Link><button onClick={goToCheckout} className="header-cta">Adaugă în coș <MoveDown size={15} /></button></header>
      <section className="product-hero"><aside className="reading-rail"><span>Volum digital</span><span>Promoție</span><span>Română</span></aside><div className="product-hero-copy"><p className="eyebrow">{book.eyebrow}</p><h1>{book.strapline}<br /><em>Începe să observi mai clar.</em></h1><p className="lead-copy">{book.subtitle}</p><div className="hero-actions"><button className="primary-button" onClick={goToCheckout}>Adaugă {book.title} în coș <span>{formatCheckoutPrice("RON", price)}</span></button><a href="#continut" className="text-link">Vezi ce conține <ChevronDown size={16} /></a></div><p className="quiet-note"><ShieldCheck size={16} /> Ghid educațional, cu accent pe comunicare, consimțământ și respect reciproc.</p></div><div className="book-stage"><div className="book-glow" /><img src={book.image} alt={`Coperta ${book.title}`} /></div></section>
      <section className="signal-section"><div className="signal-bracket">„</div><p>{book.signal}</p><div className="signal-bracket end">”</div></section>
      <section className="what-section" id="continut"><div className="section-kicker"><span>01</span><p>Un vocabular mai bun pentru relațiile care contează.</p></div><div className="what-grid"><h2>Nu este o carte despre „trucuri”.<br /><em>Este o hartă pentru conversații mai curate.</em></h2><div className="outcome-list">{book.outcomes.map(item => <p key={item}><Check size={18} />{item}</p>)}</div></div></section>
      <section className="chapters-section"><div className="chapter-intro"><p className="eyebrow">Cuprins orientativ</p><h2>Șase capitole pentru momentele în care ai nevoie de mai mult decât o presupunere.</h2><p>Fiecare capitol combină exemple de conversație, întrebări de reflecție și repere aplicabile în ritmul tău.</p></div><div className="chapter-list">{book.chapters.map(chapter => <article key={chapter.number} className="chapter-card"><span>{chapter.number}</span><h3>{chapter.title}</h3><p>{chapter.text}</p></article>)}</div></section>
      <section className="conversation-photo"><img src="/manus-storage/editorial-conversation_faaf8ab9.png" alt="Două persoane într-o conversație atentă" /><div><p className="eyebrow">Întrebare înainte de reacție</p><h2>O relație nu devine mai simplă când presupui mai mult. Devine mai clară când puteți vorbi mai bine.</h2></div></section>
      <section id="comanda" className="checkout-section"><div className="checkout-side"><p className="eyebrow">Preț promoțional</p><h2>Alege claritatea.<br /><em>Începe cu o pagină.</em></h2><p>Comanda include ghidul digital <strong>{book.title}</strong>. Accesul securizat în bibliotecă va fi trimis la e-mailul afișat după confirmarea plății.</p><div className="price-block"><span>Cod promoțional aplicat</span><strong>RELAȚII67</strong></div><p className="checkout-micro"><LockKeyhole size={14} /> Datele de card sunt procesate exclusiv de Stripe și nu ajung niciodată pe serverul site-ului.</p></div><Elements stripe={stripePromise}><StripeCheckoutForm audience={audience} book={book} initialEmail={initial.email} offer={offer} price={price} referencePrice={referencePrice} discount={discount} /></Elements></section>
      <section className="faq-section"><div><p className="eyebrow">Întrebări firești</p><h2>Înainte să alegi.</h2></div><div className="faq-list"><details open><summary>Este potrivit dacă sunt deja într-o relație?<CircleHelp size={17} /></summary><p>Da. Materialul este gândit pentru claritate în comunicare, indiferent dacă ești la începutul unei cunoașteri sau într-o relație deja construită.</p></details><details><summary>Este un ghid despre cum să controlez pe cineva?<CircleHelp size={17} /></summary><p>Nu. Accentul este pus pe întrebări bune, limite, acord și atenție față de persoana din fața ta.</p></details><details><summary>Cum aleg între cele două volume?<CircleHelp size={17} /></summary><p>Alege volumul care corespunde întrebărilor pe care le ai acum. Poți reveni oricând la pagina principală pentru celălalt traseu.</p></details></div></section>
      {showExitOffer && <div className="exit-offer-backdrop" role="dialog" aria-modal="true" aria-labelledby="exit-offer-title"><div className="exit-offer-card"><button className="exit-close" onClick={() => setShowExitOffer(false)} aria-label="Închide oferta"><X size={18} /></button><img src={book.image} alt={`Coperta ${book.title}`} /><p className="eyebrow">O OFERTĂ PENTRU TINE</p><h2 id="exit-offer-title">Ai primit o reducere de 20 de lei</h2><p>Poți continua acum cu reducerea unică de 20 de lei pentru acest volum. Oferta se aplică doar produsului principal, nu și pașilor opționali.</p><div className="exit-price"><span>{formatCheckoutPrice("RON", CHECKOUT_PRICES.RON.promo)}</span><strong>{formatCheckoutPrice("RON", CHECKOUT_PRICES.RON.exit)}</strong></div><div className="exit-actions"><button className="primary-button" onClick={applyExitOffer}>Da, vreau reducerea de 20 de lei</button><button className="text-link" onClick={() => setShowExitOffer(false)}>Nu, păstrez oferta curentă</button></div></div></div>}
      <SiteFooter />
    </main>
  );
}

function StripeCheckoutForm({ audience, book, initialEmail, offer, price, referencePrice, discount }: { audience: Audience; book: typeof BOOKS[Audience]; initialEmail: string; offer: OfferVariant; price: number; referencePrice: number; discount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState(initialEmail);
  const preparePayment = trpc.relatii.checkout.prepare.useMutation();
  const confirmPayment = trpc.relatii.checkout.confirm.useMutation();
  const isPaying = preparePayment.isPending || confirmPayment.isPending;

  const pay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return toast.error("Introdu o adresă de e-mail validă înainte de plată.");
    if (!stripe || !elements) return toast.error("Câmpurile securizate pentru card se încarcă. Încearcă din nou în câteva secunde.");
    const card = elements.getElement(CardNumberElement);
    if (!card) return toast.error("Numărul cardului nu este încă disponibil. Reîncarcă pagina și încearcă din nou.");
    try {
      const prepared = await preparePayment.mutateAsync({ productKey: book.handle as "dictionarul-femeilor" | "dictionarul-barbatilor", audience, email: normalized, offerCode: offer, affiliateCode: window.localStorage.getItem("affiliate-code") || undefined });
      window.localStorage.setItem("checkout-email", normalized);
      const confirmation = await stripe.confirmCardPayment(prepared.clientSecret, { payment_method: { card, billing_details: { email: normalized } } });
      if (confirmation.error) return toast.error(confirmation.error.message ?? "Plata nu a putut fi confirmată. Verifică datele cardului și încearcă din nou.");
      if (confirmation.paymentIntent?.status === "succeeded") {
        const completed = await confirmPayment.mutateAsync({ checkoutToken: prepared.checkoutToken, paymentIntentId: confirmation.paymentIntent.id });
        toast.success("Plata a fost confirmată. Pregătim accesul tău securizat.");
        window.location.assign(`${MAIN_PRODUCT_POST_PAYMENT_ROUTE}?orderId=${completed.orderId}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nu am putut pregăti plata. Încearcă din nou.");
    }
  };

  return <form className="checkout-form" onSubmit={pay}><div className="form-title"><span>Plată securizată</span><p>{book.title}</p></div><div className="order-summary"><div className="promo-line"><Tag size={15} /><span>Cod promoțional aplicat: <strong>RELAȚII67</strong></span></div><span className="strikethrough">{formatCheckoutPrice("RON", referencePrice)}</span><strong>{formatCheckoutPrice("RON", price)}</strong><p>Economisești {formatCheckoutPrice("RON", discount)}. Prețul este calculat și validat server-side înainte de plată.</p></div><label className="checkout-field">Adresa de e-mail<input required type="email" autoComplete="email" inputMode="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="nume@exemplu.ro" /></label><label className="checkout-field">Numărul cardului<span className="stripe-card-field"><CardNumberElement options={stripeElementOptions} /></span></label><div className="card-details-row"><label className="checkout-field">Expirare<span className="stripe-card-field"><CardExpiryElement options={stripeElementOptions} /></span></label><label className="checkout-field">CVC<span className="stripe-card-field"><CardCvcElement options={stripeElementOptions} /></span></label></div><button className="primary-button w-full" type="submit" disabled={isPaying}>{isPaying ? "Procesăm plata…" : `Plătește ${formatCheckoutPrice("RON", price)}`}</button><p className="form-footnote">După plata confirmată, primești pe acest e-mail accesul securizat la bibliotecă. Nu colectăm nume sau dată de naștere pentru acest checkout.</p></form>;
}
