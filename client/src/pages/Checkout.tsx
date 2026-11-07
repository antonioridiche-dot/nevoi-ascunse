import { useLocation, useSearch } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise, STRIPE_PUBLISHABLE_SET } from "@/lib/stripeClient";
import { trackInitiateCheckout, trackPurchase } from "@/lib/tracking";

const RED = "#cc0000";
const NAVY = "#1b2d4f";

export const CHECKOUT_BUMP_PRICE = 19.95; // lei — Mesajele EXTRA de Împăcare

/** Afiseaza suma in format romanesc: 67 -> "67", 19.95 -> "19,95". */
const RON = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","));
export const CHECKOUT_EXIT_OFFER_PRICE = 47; // lei — price after the sales-page exit offer
export const CHECKOUT_BOOK_PRICE = 67; // lei

type ProductInfo = {
  slug: string; name: string; price: number; recurring: boolean;
  image?: string; whatsInside: string[]; forWhom: string; cases: string[];
};

function useProduct(): { info: ProductInfo; isMen: boolean; nextPath: string } {
  const [location] = useLocation();
  const search = useSearch();
  const isMen = location.includes("/barbati/");
  const param = new URLSearchParams(search).get("product") || "biblia";

  const info: ProductInfo = useMemo(() => {
    const P = isMen ? "ea" : "el";
    if (param === "coaching") {
      return {
        slug: isMen ? "sustinere-barbati" : "sustinere-femei",
        name: isMen ? "Susținere Personală" : "Susținere Personală (Femei)",
        price: 147, recurring: true,
        whatsInside: [
          "Ghidare 1-la-1 directă de la Cristina, adaptată situației tale exacte",
          "Un plan pas cu pas pentru situația ta concretă",
          "Răspuns la mesajele și întrebările tale despre ce să faci mai departe",
        ],
        forWhom: `Pentru tine, dacă vrei un plan personalizat (nu doar strategia generală din carte) ca să te împaci cu ${P}.`,
        cases: ["Situația ta e complicată sau unică", "Vrei siguranță că faci pașii corecți", "Ai nevoie de cineva care să te ghideze constant"],
      };
    }
    if (param === "mesaje") {
      // Mesajele EXTRA de Împăcare — achiziție separată (19,95 lei), cu imagine proprie
      return {
        slug: isMen ? "mesaje-extra-barbati" : "mesaje-extra-femei",
        name: "Mesajele EXTRA de Împăcare",
        price: 19.95, recurring: false, image: isMen ? "/img/mesaje-extra/cover-barbati.png" : "/img/mesaje-extra/cover-femei.png",
        whatsInside: [
          "Zeci de mesaje gata scrise, pe care le trimiți exact așa cum sunt (sau le modifici tu)",
          "Mesaje construite să-i vorbească direct „hormonului iubirii” din creierul " + (isMen ? "ei" : "lui") + " — nu rațiunii",
          "Le primești în format PDF pe email, imediat după plată — se deschid direct în browser",
        ],
        forWhom: "Pentru tine, dacă vrei mai multe mesaje gata scrise care cresc șansele să răspundă pozitiv și să se apropie din nou de tine.",
        cases: ["Vrei mesaje gata scrise, pe care să le trimiți azi", "Vrei cuvinte care îi activează dorința de împăcare", "Vrei un plus de mesaje față de ceea ce ai primit deja"],
      };
    }
    if (param === "secondary_book" || param === "jurnal") {
      return {
        slug: isMen ? "zero-despartiri" : "zero-despartiri",
        name: isMen ? "Zero Despărțiri" : "Zero Despărțiri",
        price: 47, recurring: false, image: "/img/peste-zero.svg",
        whatsInside: isMen
          ? ["Strategii avansate de comunicare și reconectare emoțională", "Tehnici pentru a menține atracția pe termen lung"]
          : ["Ghidul complet pentru a preveni o nouă despărțire", "Cum să construiești o relație stabilă după împăcare"],
        forWhom: "Pentru tine, ca material complementar la Cum să Oprești Durerea unei Despărțiri.",
        cases: ["Vrei rezultate pe termen lung", "Vrei să eviți greșelile care duc la o nouă despărțire"],
      };
    }
    // biblia (front-end book) — same book photo as the sales page (per gender)
    return {
      slug: isMen ? "opreste-durerea-barbati" : "opreste-durerea-femei",
      name: isMen ? "Cum să Oprești Durerea unei Despărțiri (274 pagini)" : "Cum să Oprești Durerea unei Despărțiri (207 pagini)",
      price: 67, recurring: false, image: isMen ? "/img/peste-ghid.svg" : "/img/peste-ghid.svg",
      whatsInside: [
        'Cum să apeși „Butonul de Resetare" și să repari greșelile (pag. 54)',
        `De ce să nu spui aproape niciodată „îmi pare rău" — și ce să faci în schimb (pag. 20)`,
        `Replici speciale care ${isMen ? "o" : "îl"} fac să simtă o dorință profundă pentru tine (pag. 101)`,
        `Cum să ștergi amintirile negative și să reaprinzi „scânteia" (pag. 148–159)`,
        "Singura greșeală fatală care îți garantează pierderea — și cum o eviți (pag. 102)",
      ],
      forWhom: isMen
        ? "Pentru bărbații care vor să-și recâștige fosta (sau actuala) parteneră, folosind psihologia, nu disperarea."
        : "Pentru femeile care vor să-și recâștige fostul (sau actualul) partener, folosind psihologia, nu disperarea.",
      cases: isMen
        ? ["Te-a înșelat sau ai înșelat-o", "Este deja cu altcineva", "A trecut mult timp de la despărțire", "Sunteți într-o pauză sau nu mai vorbiți"]
        : ["Te-a înșelat sau l-ai înșelat", "Este deja cu altcineva", "A trecut mult timp de la despărțire", "Sunteți într-o pauză sau nu mai vorbiți"],
    };
  }, [param, isMen]);

  // After the FRONT-END book, send them into the upsell path BEFORE download.
  // Coaching / secondary purchases go straight to the thank-you page.
  const nextPath = param === "biblia"
    ? (isMen ? "/barbati/asteapta" : "/femei/asteapta")
    : (isMen ? "/barbati/multumesc" : "/femei/multumesc");

  return { info, nextPath, isMen };
}

function CheckoutForm({ info, nextPath, isMen, price, bump, total, clientSecret, exitOffer }: {
  info: ProductInfo; nextPath: string; isMen: boolean; price: number; bump: boolean; total: number; clientSecret: string | null; exitOffer: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState(() => localStorage.getItem("tvii_email") || "");

  // Declarațiile de consimțământ sunt adaptate produsului: cartea principală
  // păstrează exact textul cerut, celelalte produse au textul lor propriu.
  const isFrontBook = info.slug.startsWith("opreste-durerea");
  const priceLabel = Number.isInteger(price) ? String(price) : price.toFixed(2).replace(".", ",");
  const statements = isFrontBook
    ? (isMen
        ? [
            'Da! Vreau cartea virtuală “Cum să Oprești Durerea unei Despărțiri” (274 pagini) la prețul de 67 lei, o singură plată.',
            'Da! Înțeleg că dacă nu sunt mulțumit timp de 30 de zile, pot să-i trimit un email Ancăi și îmi voi primi toți banii înapoi. Fără întrebări.',
            'Da! Înțeleg că mă pot folosi de această carte pentru a-mi recupera iubita.',
          ]
        : [
            'Da! Vreau cartea virtuală “Cum să Oprești Durerea unei Despărțiri” (207 pagini) la prețul de 67 lei, o singură plată.',
            'Da! Înțeleg că dacă nu sunt mulțumită timp de 30 de zile, pot să-i trimit un email Ancăi și îmi voi primi toți banii înapoi. Fără întrebări.',
            'Da! Înțeleg că mă pot folosi de această carte pentru a-mi recupera iubitul.',
          ])
    : [
        'Da! Vreau „' + info.name + '” la prețul de ' + priceLabel + ' lei' + (info.recurring ? ' pe lună' : '') + ', o singură plată.',
        'Da! Înțeleg că dacă nu sunt mulțumit' + (isMen ? '' : 'ă') + ' timp de 30 de zile, pot să-i trimit un email Ancăi și îmi voi primi toți banii înapoi. Fără întrebări.',
        'Da! Înțeleg că materialul îmi va fi trimis pe emailul completat mai sus, imediat după plată.',
      ];

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

    let { error: confErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}${nextPath}`, receipt_email: em },
    });
    if (confErr) { setError(confErr.message || "Plata nu a putut fi procesată."); setLoading(false); return; }

    // 3D Secure / confirmare bancara: finalizam in pagina.
    if (paymentIntent && paymentIntent.status === "requires_action" && clientSecret) {
      const next = await stripe.handleNextAction({ clientSecret });
      if (next.error) { setError(next.error.message || "Confirmarea bancară nu a putut fi finalizată."); setLoading(false); return; }
      paymentIntent = next.paymentIntent;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        await fetch("/api/stripe/confirm-order", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            productSlug: info.slug,
            contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
            affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
            isUpsell: false,
            bump,
          }),
        });
      } catch { /* webhook will back this up */ }
      localStorage.setItem("tvii_pi", paymentIntent.id);
      trackPurchase({ productName: info.slug, value: total, orderId: paymentIntent.id });
      setLocation(nextPath);
    } else {
      setError("Plata este în așteptare. Verifică emailul pentru confirmare.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email — autofilled from the quiz (or the sales page) but editable */}
      <div>
        <label className="block text-sm font-semibold text-[#1b2d4f] mb-1">Email (unde primești cartea)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); localStorage.setItem("tvii_email", e.target.value); }}
          placeholder="adresa@email.com"
          className="w-full border border-[#cbd5e1] rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#1b2d4f]"
        />
        <p className="text-xs text-[#64748b] mt-1">Îți trimitem cartea PDF și confirmarea comenzii pe acest email.</p>
      </div>

      {/* Rezumat comanda — inainte de detaliile de plata */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-sm">
        <p className="font-extrabold text-[#1b2d4f] mb-2">Rezumatul comenzii</p>
        <div className="flex justify-between py-1 items-center">
          <span className="text-[#334155]">{info.name}</span>
          <span className="font-extrabold text-[#1b2d4f]">
            {info.slug.startsWith("opreste-durerea") ? (
              <>
                <span className="line-through text-[#94a3b8] mr-1 font-normal">139 lei</span>{exitOffer ? CHECKOUT_EXIT_OFFER_PRICE : CHECKOUT_BOOK_PRICE} lei
              </>
            ) : (
              <>{info.price} lei{info.recurring ? "/lună" : ""}</>
            )}
          </span>
        </div>
        {info.slug.startsWith("opreste-durerea") && (
          <div className="flex justify-between py-1 text-[#15803d] font-semibold">
            <span>Reducere primele 100 de cărți (139 → 67 lei)</span>
            <span>−72 lei</span>
          </div>
        )}
        {info.slug.startsWith("opreste-durerea") && exitOffer && (
          <div className="flex justify-between py-1 text-[#15803d] font-semibold">
            <span>Reducere specială (pop-up)</span>
            <span>−20 lei</span>
          </div>
        )}
        {bump && (
          <div className="flex justify-between py-1">
            <span className="text-[#334155]">Mesajele EXTRA de Împăcare (PDF)</span>
            <span className="font-semibold text-[#1b2d4f]">{RON(CHECKOUT_BUMP_PRICE)} lei</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-t border-[#e2e8f0] mt-1 pt-2">
          <span className="font-bold text-[#1b2d4f]">Total</span>
          <span className="font-extrabold text-[#1b2d4f]">{RON(total)} lei{info.recurring ? "/lună" : ""}</span>
        </div>
      </div>

      {/* Detalii de plata — imediat sub rezumat */}
      <div>
        <p className="font-extrabold text-[#1b2d4f] mb-2">Detalii de plată</p>
        <PaymentElement
          onLoadError={(event) => setError(event.error.message || "Formularul de plată nu s-a încărcat. Reîncarcă pagina.")}
          options={{
            layout: "tabs",
            fields: { billingDetails: { name: "auto" } },
            paymentMethodOrder: ["card"],
            terms: { card: "never" },
          }}
        />
      </div>

      <p className="text-sm leading-relaxed text-[#334155] -mt-2">Poți deschide cartea PDF de pe orice telefon, tabletă sau PC — nu trebuie instalat nimic. Imediat după plată o vei putea accesa. Pentru informații sau cereri de rambursare, scrie-mi la <a href="mailto:anca@pestedespartire.ro" className="text-[#1155cc] underline">anca@pestedespartire.ro</a> și îți voi răspunde personal.</p>

      <div className="flex items-center justify-center gap-3 pt-1">
        <span className="bg-[#1a1f71] text-white text-[11px] font-black italic tracking-wide px-2.5 py-1 rounded-sm">VISA</span>
        <span className="flex items-center">
          <span className="w-6 h-4 rounded-full bg-[#eb001b] opacity-90" />
          <span className="w-6 h-4 rounded-full bg-[#f79e1b] opacity-90 -ml-3" />
        </span>
        <span className="text-[10px] font-bold text-[#94a3b8]">Mastercard</span>
        <span className="text-[10px] font-bold text-[#94a3b8]">Apple Pay · Google Pay · Revolut Pay</span>
      </div>

      {/* Consent statements — each with a completed (checked) box */}
      <div className="space-y-2.5">
        {statements.map((s, i) => (
          <label key={i} className="flex items-start gap-2 text-[13px] text-[#33384a]">
            <input type="checkbox" checked readOnly disabled className="mt-0.5 accent-[#1b2d4f]" />
            <span>{s}</span>
          </label>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-extrabold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] leading-tight"
      >
        {loading ? (
          <>Se procesează...</>
        ) : (
          <>
            <span className="block text-xl tracking-wide">PLĂTEȘTE ACUM</span>
            <span className="block text-[12px] font-semibold opacity-90 mt-1">ACCEPT OFERTA. Trimite-mi cartea pe email</span>
          </>
        )}
      </button>
      <p className="text-center text-xs text-[#94a3b8]">🔒 Plată securizată prin Stripe · Datele cardului nu sunt stocate pe serverele noastre. Dacă banca ta îți cere confirmarea în aplicația bancară, aprobă plata acolo.</p>
    </form>
  );
}

// Testimonials are gender-aware: men see testimonials from men (with men's
// names), women see testimonials written by women (with women's names).
const TESTIMONIALS_MEN = [
  {
    text: "Cartea Ancăi chiar e genială. Efectiv mi-a salvat relația și a durat doar două săptămâni. Chiar merită banii.",
    name: "Cristi", detail: "33 de ani, București",
  },
  {
    text: "Îți mulțumesc enorm, Cristina. Nu cred că aș fi reușit să-mi repar căsnicia fără această carte. Lucrurile sunt din nou bine între noi.",
    name: "Andrei", detail: "41 de ani, București",
  },
  {
    text: "Nu prea am citit eu cărți la viața mea dar pot spune cu mâna pe inimă că asta chiar s-a meritat. Nu credeam că mă va putea ierta vreodată pentru ce am făcut, dar am aplicat ce scria în carte și acum e din nou în brațele mele și mă iubește chiar mai mult decât înainte. Mulțumesc!",
    name: "Mihai", detail: "28 de ani, Cluj-Napoca",
  },
  {
    text: "La început aveam dubii dacă merită să mai încerc. Dar am zis să nu fiu fricos și să încerc să ne mai dăm o șansă. Și a funcționat. Familia noastră e din nou reunită! Îți sunt recunoscător!",
    name: "Radu", detail: "36 de ani, Londra",
  },
];

const TESTIMONIALS_WOMEN = [
  {
    text: "Cartea Ancăi chiar e genială. Efectiv mi-a salvat relația și a durat doar două săptămâni. Chiar merită banii.",
    name: "Ioana", detail: "29 de ani, București",
  },
  {
    text: "Îți mulțumesc enorm, Cristina. Nu cred că aș fi reușit să-mi repar căsnicia fără această carte. Lucrurile sunt din nou bine între noi.",
    name: "Andreea", detail: "35 de ani, București",
  },
  {
    text: "Nu prea am citit eu cărți la viața mea dar pot spune cu mâna pe inimă că asta chiar s-a meritat. Nu credeam că mă va putea ierta vreodată pentru ce am făcut, dar am aplicat ce scria în carte și acum e din nou în brațele mele și mă iubește chiar mai mult decât înainte. Mulțumesc!",
    name: "Elena", detail: "31 de ani, Cluj-Napoca",
  },
  {
    text: "La început aveam dubii dacă merită să mai încerc. Dar am zis să nu fiu fricoasă și să încerc să ne mai dăm o șansă. Și a funcționat. Familia noastră e din nou reunită! Îți sunt recunoscătoare!",
    name: "Maria", detail: "38 de ani, Londra",
  },
];

export default function Checkout() {
  const { info, nextPath, isMen } = useProduct();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState("");
  const [bump, setBump] = useState(false);
  const [exitOffer, setExitOffer] = useState<boolean>(() => localStorage.getItem("tvii_exit_offer") === "1");
  const [showExitPopup, setShowExitPopup] = useState(false);

  // Pop-up de reducere speciala la iesirea din pagina (doar daca nu a fost deja acceptata).
  useEffect(() => {
    if (exitOffer || !info.slug.startsWith("opreste-durerea")) return;
    if (sessionStorage.getItem("tvii_checkout_exit_seen")) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        sessionStorage.setItem("tvii_checkout_exit_seen", "1");
        setShowExitPopup(true);
        document.removeEventListener("mouseout", onLeave);
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [exitOffer, info.slug]);

  const acceptSpecialReduction = () => {
    localStorage.setItem("tvii_exit_offer", "1");
    setExitOffer(true);
    setShowExitPopup(false);
  };
  const [email, setEmail] = useState(() => localStorage.getItem("tvii_email") || "");

  // Exit-offer price: the 67 lei on checkout automatically becomes the reduced
  // price (47 lei) when the visitor accepted the exit popup on the sales page.
  const price = exitOffer && info.slug.startsWith("opreste-durerea") ? CHECKOUT_EXIT_OFFER_PRICE : info.price;
  const total = price + (bump ? CHECKOUT_BUMP_PRICE : 0);

  useEffect(() => {
    trackInitiateCheckout({ productName: info.slug, value: total });
    if (!STRIPE_PUBLISHABLE_SET) { setInitError("nokey"); return; }
    let cancelled = false;
    setInitError("");
    setClientSecret(null);
    fetch("/api/stripe/create-payment-intent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug: info.slug,
        contactEmail: localStorage.getItem("tvii_email") || email || "",
        contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
        affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
        isUpsell: false,
        bump,
        exitOffer,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setInitError(typeof d.error === "string" && d.error !== "init" ? d.error : "init");
      })
      .catch(() => { if (!cancelled) setInitError("init"); });
    return () => { cancelled = true; };
  }, [info.slug, bump, exitOffer, total]);

  return (
    <div className="qz-wrap" style={{ background: "#f0f3f8" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-center text-[26px] sm:text-[30px] font-extrabold font-['Playfair_Display'] mb-1" style={{ color: RED }}>
          Finalizează Comanda
        </h1>
        <p className="text-center text-[#64748b] mb-6">Plată 100% securizată</p>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          {info.image && <img src={info.image} alt={info.name} className="block w-full max-w-md sm:max-w-lg mx-auto rounded-xl shadow" />}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span className="font-bold text-[#1b2d4f] text-xl">{info.name}</span>
            {info.slug.startsWith("opreste-durerea") ? (
              <span className="inline-flex flex-wrap items-center justify-center gap-2">
                <span className="line-through text-[#94a3b8] text-lg">139 lei</span>
                <span className="font-extrabold text-[#1b2d4f] text-2xl">{exitOffer ? CHECKOUT_EXIT_OFFER_PRICE : CHECKOUT_BOOK_PRICE} lei</span>
                <span className="bg-[#15803d] text-white text-xs font-bold px-2 py-1 rounded-full">reducere primele 100 de cărți −72 lei</span>
                {exitOffer && (
                  <span className="bg-[#b91c1c] text-white text-xs font-bold px-2 py-1 rounded-full">Reducere specială −20 lei</span>
                )}
              </span>
            ) : (
              <span className="font-extrabold text-[#1b2d4f] text-xl">{info.price} RON{info.recurring ? "/lună" : ""}</span>
            )}
          </div>
        </div>

        {/* Bump offer — Mesajele EXTRA (+19,95 lei), only for the front book. */}
        {info.slug.startsWith("opreste-durerea") && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} className="mt-1 w-4 h-4 accent-[#1b2d4f]" />
            <span>
              <span className="font-bold text-[#1b2d4f] text-[15px] block">Adaugă Și Mesajele EXTRA de Împăcare Pentru Încă {RON(CHECKOUT_BUMP_PRICE)} lei</span>
              <span className="text-[13px] text-[#33384a] block mt-1">
                După ce am scris Cum să Oprești Durerea unei Despărțiri, foarte mulți oameni mi-au zis că vor și mai multe mesaje care ajută la împăcare și îi inundă creierul și inima {isMen ? "acelei femei" : "acelui bărbat"} cu hormonul iubirii.
                Așa că am creat acest pdf scurt cu mesaje extra ca să mulțumesc pe toată lumea. Cu cât răspunde pozitiv la mai multe mesaje de acest gen, cu atât vei fi cu un pas mai aproape de împăcare. Le vei primi cu cartea pentru încă {RON(CHECKOUT_BUMP_PRICE)} lei dacă selectezi bifa de mai sus.
              </span>
            </span>
          </label>
        </div>
        )}

        {/* Payment */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {initError === "nokey" && (
            <div className="text-sm text-[#64748b] text-center py-6">
              Formularul de plată se activează imediat ce este configurată cheia Stripe publishable
              (<code>VITE_STRIPE_PUBLISHABLE_KEY</code>).
            </div>
          )}
          {initError && initError !== "nokey" && (
            <div className="text-sm text-red-600 text-center py-6">A apărut o eroare la inițializarea plății. Reîncarcă pagina.</div>
          )}
          {!initError && !clientSecret && (
            <div className="text-center py-8 text-[#64748b]">
              <span className="inline-block w-6 h-6 border-2 border-[#dde3ef] border-t-[#1b2d4f] rounded-full animate-spin" />
              <p className="mt-2 text-sm">Se pregătește plata securizată...</p>
            </div>
          )}
          {/* NOTE: intentionally NOT "clientSecret && stripePromise && ..." — when the
              publishable key is unset, stripePromise is statically null and the bundler
              would tree-shake this whole form away. The "nokey" early return above
              guarantees clientSecret is only ever set when stripePromise exists. */}
          {clientSecret && (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#1b2d4f", borderRadius: "10px" } } }}
            >
              <CheckoutForm info={info} nextPath={nextPath} isMen={isMen} price={price} bump={bump} total={total} clientSecret={clientSecret} exitOffer={exitOffer} />
            </Elements>
          )}
        </div>

        {/* Testimonials */}
        <div className="mt-8">
          <h2 className="text-center text-xl font-extrabold font-['Playfair_Display'] text-[#1b2d4f] mb-4">
            Ce spun cei care au cumpărat cartea
          </h2>
          <div className="grid gap-4">
            {(isMen ? TESTIMONIALS_MEN : TESTIMONIALS_WOMEN).map((t, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-5">
                <p className="text-[15px] text-[#33384a] italic mb-3">“{t.text}”</p>
                <p className="text-sm font-bold text-[#1b2d4f]">⭐ {t.name} — {t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POP-UP REDUCERE SPECIALA la iesire (checkout) */}
      {showExitPopup && info.slug.startsWith("opreste-durerea") && !exitOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white border-2 border-[#e8c96a] rounded-xl p-6 max-w-md w-full text-center relative" style={{ boxShadow: "0 0 60px rgba(232,201,106,.4)" }}>
            <button
              type="button"
              onClick={() => setShowExitPopup(false)}
              className="absolute top-2 right-3 text-[#94a3b8] hover:text-[#1a1a2e] text-xl"
              aria-label="Închide"
            >✕</button>
            {info.image && <img src={info.image} alt="Cum să Oprești Durerea unei Despărțiri" className="w-32 mx-auto mb-3 rounded-lg shadow-lg" />}
            <h3 className="font-extrabold text-xl mb-2 text-[#1b2d4f]">Așteaptă! Nu pleca încă…</h3>
            <p className="text-sm text-[#64748b] mb-3">
              Îți ofer <strong>Cum să Oprești Durerea unei Despărțiri</strong> cu o <strong>reducere specială</strong>, doar pentru tine, chiar acum.
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-[#94a3b8] line-through text-xl">67 lei</span>
              <span className="text-[44px] font-extrabold leading-none text-[#1b2d4f]">{CHECKOUT_EXIT_OFFER_PRICE} <span className="text-2xl">RON</span></span>
            </div>
            <button
              type="button"
              onClick={acceptSpecialReduction}
              className="w-full bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-extrabold py-3.5 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-base uppercase tracking-wide"
            >
              Da, vreau reducerea specială — {CHECKOUT_EXIT_OFFER_PRICE} lei →
            </button>
            <button
              type="button"
              onClick={() => setShowExitPopup(false)}
              className="w-full text-xs text-[#94a3b8] hover:text-[#1a1a2e] mt-3"
            >
              Nu, mulțumesc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
