import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise, STRIPE_PUBLISHABLE_SET } from "@/lib/stripeClient";
import { trackViewContent, trackInitiateCheckout, trackPurchase } from "@/lib/tracking";

const IMG = "/img/barbati-jurnal";
const RED = "#c8102e";

export const JURNAL_PRICE = 47; // lei — reduced from 100

function RedH({ children, sm }: { children: React.ReactNode; sm?: boolean }) {
  return (
    <h2 className={`text-center font-extrabold leading-snug my-6 ${sm ? "text-[22px]" : "text-[26px] sm:text-[31px]"}`} style={{ color: RED }}>
      {children}
    </h2>
  );
}

function Img({ src, alt, max = "max-w-md" }: { src: string; alt: string; max?: string }) {
  return <img src={src === "copertajurnal.png" ? "/img/peste-zero.svg" : `${IMG}/${src}`} alt={alt} loading="lazy" className={`block w-full ${max} mx-auto my-7 rounded-lg`} />;
}

function JournalPayForm({ isMen }: { isMen: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(true); // fara bifa obligatorie
  const [error, setError] = useState("");
  const [email, setEmail] = useState(() => localStorage.getItem("tvii_email") || "");
  const acceptPath = isMen ? "/barbati/multumesc" : "/femei/multumesc";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const em = email.trim();
    if (!em || !em.includes("@") || !em.includes(".")) { setError("Te rog introdu o adresă de email validă."); return; }
    setError("");
    localStorage.setItem("tvii_email", em);
    setLoading(true);
    const { error: submitErr } = await elements.submit();
    if (submitErr) { setError(submitErr.message || "Verifică datele cardului."); setLoading(false); return; }
    const { error: confErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}${acceptPath}`, receipt_email: em },
    });
    if (confErr) { setError(confErr.message || "Plata nu a putut fi procesată."); setLoading(false); return; }
    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        await fetch("/api/stripe/confirm-order", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            productSlug: "zero-despartiri",
            contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
            affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
            isUpsell: false,
          }),
        });
      } catch { /* webhook will back this up */ }
      localStorage.setItem("tvii_pi", paymentIntent.id);
      trackPurchase({ productName: "zero-despartiri", value: JURNAL_PRICE, orderId: paymentIntent.id });
      window.location.href = acceptPath;
    } else {
      setError("Plata este în așteptare. Verifică emailul pentru confirmare.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      <div>
        <label className="block text-sm font-semibold text-[#1a1a2e] mb-1">Pe ce Email vrei să primești cartea?</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); localStorage.setItem("tvii_email", e.target.value); }}
          placeholder="adresa@email.com"
          className="w-full bg-white border border-[#cbd5e1] rounded-md px-4 py-3 text-[15px] text-[#1a1a2e] outline-none focus:border-[#c8102e]"
        />
      </div>

      {/* NOTE: intentionally NOT "clientSecret && stripePromise && ..." — with an empty
          publishable key stripePromise is statically null and the bundler tree-shakes
          this form away. clientSecret is only set when the key exists (see below). */}
      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: { name: "auto" } },
          paymentMethodOrder: ["card", "applePay", "googlePay", "revolutPay"],
          terms: { card: "never" },
        }}
      />

      <div className="flex items-center justify-center gap-3 pt-1">
        <span className="bg-[#1a1f71] text-white text-[11px] font-black italic tracking-wide px-2.5 py-1 rounded-sm">VISA</span>
        <span className="flex items-center">
          <span className="w-6 h-4 rounded-full bg-[#eb001b] opacity-90" />
          <span className="w-6 h-4 rounded-full bg-[#f79e1b] opacity-90 -ml-3" />
        </span>
        <span className="text-[10px] font-bold text-[#64748b]">Mastercard</span>
        <span className="text-[10px] font-bold text-[#64748b]">Apple Pay · Google Pay · Revolut Pay</span>
      </div>

      <div className="space-y-2.5">
        {[
          `Da! Vreau "Zero Despărțiri" la prețul de ${JURNAL_PRICE} lei, o singură plată.`,
          "Da! Înțeleg că am garanție 30 de zile și pot cere rambursarea prin email, fără întrebări.",
          "Da! Înțeleg că acest jurnal este despre mine, limitele mele și relații mai sănătoase.",
        ].map((s, i) => (
          <label key={i} className="flex items-start gap-2 text-[13px] text-[#1a1a2e]">
            <input type="checkbox" checked readOnly disabled className="mt-0.5 accent-[#c8102e]" />
            <span>{s}</span>
          </label>
        ))}
      </div>

      <label className="flex items-start gap-2 text-xs text-[#64748b] cursor-pointer">
        <input type="checkbox" checked readOnly disabled className="mt-0.5" />
        <span>
          Sunt de acord ca livrarea conținutului digital (PDF-ul) să înceapă imediat după plată și înțeleg că, odată ce am accesat-o, îmi pierd dreptul legal de retragere de 14 zile. Beneficiez în continuare de <strong className="text-[#1a1a2e]">garanția de 30 de zile</strong> oferită de vânzător.
        </span>
      </label>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-[#c8102e] to-[#a50d23] text-white font-extrabold py-4 px-6 rounded-md shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] uppercase tracking-wide"
      >
        {loading ? "Se procesează..." : "ACCEPT OFERTA →"}
      </button>
      <p className="text-center text-xs text-[#64748b]">
        🔒 Plată securizată prin Stripe · Datele cardului nu sunt stocate pe serverele noastre. Dacă banca ta îți cere confirmarea în aplicația bancară, aprobă plata acolo.
      </p>
    </form>
  );
}

export default function JurnalNegru() {
  const [location] = useLocation();
  const isMen = !location.includes("/femei");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState("");
  // Compatibilitate temporară pentru texte istorice care vor fi înlocuite integral.
  const P = isMen ? "ea" : "el";
  const Pei = isMen ? "ei" : "lui";
  const minteFemeie = isMen ? "mintea unei persoane" : "mintea unei persoane";


  useEffect(() => { trackViewContent({ productName: "zero-despartiri", value: JURNAL_PRICE, gender: isMen ? "male" : "female" }); }, [isMen]);
  useEffect(() => {
    trackInitiateCheckout({ productName: "zero-despartiri", value: JURNAL_PRICE });
    if (!STRIPE_PUBLISHABLE_SET) { setInitError("nokey"); return; }
    fetch("/api/stripe/create-payment-intent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug: "zero-despartiri",
        contactEmail: localStorage.getItem("tvii_email") || "",
        contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
        affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
        isUpsell: false,
        bump: false,
        exitOffer: false,
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.clientSecret) setClientSecret(d.clientSecret); else setInitError(d.error || "init"); })
      .catch(() => setInitError("init"));
  }, []);

  // Pagina de vânzare actuală: checkout-ul Stripe rămâne mai jos, iar această
  // prezentare este afișată înaintea vechiului material de arhivă.
  const checkoutPath = isMen ? "/barbati/checkout?product=jurnal" : "/femei/checkout?product=jurnal";
  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-10 text-[#1a1a2e]">
      <div className="max-w-2xl mx-auto text-[17px] leading-relaxed">
        <div className="text-center font-bold tracking-widest text-sm mb-5 text-[#8b95a5]">✦ pestedespartire.ro</div>
        <section className="text-center bg-white border border-[#ead9d2] rounded-2xl p-7 shadow-sm">
          <p className="font-bold tracking-wide text-sm text-[#c8102e]">JURNAL DIGITAL · ACCES IMEDIAT</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mt-3 text-[#c8102e]">Zero Despărțiri</h1>
          <p className="text-xl mt-3">Un jurnal pentru tine, când alegi să nu te mai pierzi într-o relație.</p>
          <Img src="copertajurnal.png" alt="Zero Despărțiri" max="max-w-md" />
          <p className="text-[#64748b]">47 lei · o singură plată · PDF primit pe email</p>
          <Link href={checkoutPath} className="block max-w-md mx-auto mt-6 bg-[#c8102e] text-white font-extrabold py-4 px-6 rounded-xl shadow-lg">Vreau Zero Despărțiri la 47 lei →</Link>
        </section>
        <section className="space-y-4 my-10"><h2 className="text-2xl font-extrabold text-[#c8102e]">Ce vei face cu acest jurnal</h2><p>Vei pune în ordine ce simți, vei observa tiparele care te fac să te întorci în aceleași situații și vei construi pași mici pentru a-ți recăpăta stabilitatea.</p><ul className="list-disc pl-6 space-y-3 marker:text-[#c8102e]"><li>Exerciții pentru limite și respect de sine.</li><li>Întrebări care te ajută să înțelegi ce s-a rupt cu adevărat.</li><li>Pași pentru zilele în care dorul sau furia revin.</li><li>Un mod mai sănătos de a alege relațiile viitoare.</li></ul></section>
        <section className="rounded-2xl bg-[#1b2d4f] text-white p-7 text-center"><h2 className="text-2xl font-extrabold">Nu este despre a aduce pe cineva înapoi.</h2><p className="mt-3">Este despre a nu te mai abandona pe tine. Nu conține tactici de manipulare și nu promite împăcări.</p></section>
        <section className="my-10 text-center"><h2 className="text-2xl font-extrabold text-[#c8102e]">Garanție 30 de zile</h2><p className="mt-3">Îl parcurgi în ritmul tău. Dacă nu simți că îți este util, scrii la cristina@pestedespartire.ro și primești banii înapoi.</p><Link href={checkoutPath} className="block max-w-md mx-auto mt-6 bg-[#c8102e] text-white font-extrabold py-4 px-6 rounded-xl shadow-lg">Încep cu Zero Despărțiri →</Link></section>
        <footer className="border-t pt-6 text-center text-xs text-[#64748b] space-x-3"><Link href="/termeni">Termeni</Link><Link href="/privacy">Confidențialitate</Link><Link href="/rambursare">Rambursare</Link><Link href="/contact">Contact</Link><p className="mt-3">© 2026 pestedespartire.ro</p></footer>
      </div>
    </main>
  );

}
