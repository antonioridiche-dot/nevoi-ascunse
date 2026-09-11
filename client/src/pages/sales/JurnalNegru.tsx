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
  return <img src={`${IMG}/${src}`} alt={alt} loading="lazy" className={`block w-full ${max} mx-auto my-7 rounded-lg`} />;
}

function JournalPayForm({ isMen }: { isMen: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(true); // fara bifa obligatorie
  const [error, setError] = useState("");
  const [email, setEmail] = useState(() => localStorage.getItem("tvii_email") || "");
  const acceptPath = isMen ? "/barbati/multumesc" : "/femei/multumesc";
  const iubita = isMen ? "iubita" : "iubitul";

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
          "Da! Înțeleg că dacă nu sunt mulțumit timp de 30 de zile, pot să-i trimit un email Ancăi și îmi voi primi toți banii înapoi. Fără întrebări.",
          `Da! Înțeleg că mă pot folosi de acest jurnal pentru a-mi recupera ${iubita}.`,
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

  const P = isMen ? "ea" : "el";           // partner
  const Pei = isMen ? "ei" : "lui";
  const Pacc = isMen ? "o" : "îl";          // accusative
  const Pacc2 = isMen ? "o" : "îl";
  const minteFemeie = isMen ? "mintea oricărei femei" : "mintea oricărui bărbat";
  const oFemeie = isMen ? "o femeie" : "un bărbat";
  const hipnotizat = isMen ? "hipnotizată" : "hipnotizat";
  const iubita = isMen ? "iubita" : "iubitul";
  const fosta = isMen ? "fosta lui, care îl blocase peste tot și era cu un alt bărbat, l-a căutat înapoi plângând la ușă după doar câteva zile. Altul mi-a zis că orice femeie cu care vorbea era pur și simplu hipnotizată de o obsesie ciudată pentru el."
    : "fostul ei, care o blocase peste tot și era cu o altă fată, a căutat-o înapoi plângând la ușă după doar câteva zile. Alta mi-a zis că orice bărbat cu care vorbea era pur și simplu hipnotizat de o obsesie ciudată pentru ea.";

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

  return (
    <div className="qz-wrap" style={{ background: "#ffffff" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-[17px] leading-relaxed" style={{ color: "#1a1a2e" }}>
        <div className="text-center font-bold tracking-widest text-sm mb-3" style={{ color: "#8b95a5" }}>✦ pestedespartire.ro</div>

        <div className="text-center text-[13px] font-bold text-white bg-[#7a1115] border border-[#c8102e] rounded-md px-4 py-2 mb-5">
          ⚠ Atenție: Această pagină nu va fi disponibilă mult timp — citește până la capăt înainte să fie prea târziu
        </div>

        <div className="space-y-4">
          <p>Când am scris prima versiune a Bibliei Împăcării,</p>
          <p>am primit niște recenzii alarmante.</p>
          <p>Oamenii mi-au spus că materialul era pur și simplu <strong style={{ color: RED }}>PREA puternic.</strong></p>
          <p>Mi s-a spus că anumite capitole trec linia fină dintre influență și manipulare psihologică periculoasă.</p>
          <p>Așa că pentru a nu-mi fi ștearsă cartea de pe internet, am fost forțată să elimin acele secțiuni.</p>
          <p>Dar nu le-am șters complet. Le-am ascuns într-un jurnal numit:</p>
        </div>

        <RedH sm>L-am numit Zero Despărțiri.</RedH>

        <Img src="copertajurnal.png" alt="Zero Despărțiri" max="max-w-md sm:max-w-lg" />
        <p className="text-center text-sm text-[#64748b] -mt-3">({isMen ? "149" : "118"} pagini)</p>

        <div className="space-y-4">
          <p>Acest jurnal conține tactici interzise care <strong style={{ color: RED }}>EXPLOATEAZĂ erorile de sistem ale {isMen ? "minții oricărei femei" : "minții oricărui bărbat"}.</strong></p>
          <p>Este controversat pentru că aproape {isMen ? "fiecare bărbat căruia i l-am dat" : "fiecare femeie căreia i l-am dat"} mi-a scris înapoi, {isMen ? "șocat" : "șocată"}.</p>
          <p>Mi-au spus că funcționează un pic prea repede.</p>
          <p>{isMen ? "Un tip mi-a zis că " : "O tipă mi-a zis că "}{fosta}</p>
        </div>

        <RedH>Îți va da control aproape IMEDIAT asupra „părții impulsive" din {minteFemeie}.</RedH>

        <div className="space-y-4">
          <p>Este acea parte specifică din creier care se umple cu un nivel incontrolabil de <strong style={{ color: RED }}>DORINȚĂ</strong> pentru tine.</p>
          <p>Asta poate crea o <strong style={{ color: RED }}>OBSESIE pe viață</strong> în momentul în care spui și faci lucrurile potrivite.</p>
          <p>Poți folosi asta chiar și pentru a face {isMen ? "acea femeie să uite complet de actualul ei iubit" : "acel bărbat să uite complet de actuala lui iubită"}.</p>
          <p>{isMen ? "O poți face" : "Îl poți face"} să {isMen ? "îl urască și să îl părăsească pentru tine, fără ca ea să își dea seama" : "o urască și să o părăsească pentru tine, fără ca el să își dea seama"} că tu ai plănuit totul.</p>
          <p>De asta l-am ascuns. Pentru că în Mâinile Greșite <strong style={{ color: RED }}>Poate DISTRUGE Emoțional {isMen ? "O Femeie" : "Un Bărbat"}</strong></p>
        </div>

        <Img src="transparentcopertabiblieREAS.png" alt="" max="max-w-sm sm:max-w-md" />

        <div className="space-y-4">
          <p>Dar doar pentru astăzi, ca mod al meu de a-ți arăta că poți să ai încredere în mine...</p>
          <p>Am decis să deschid din nou accesul la Zero Despărțiri.</p>
        </div>

        <RedH>Iată doar o mică parte din ce vei descoperi înăuntru:</RedH>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Infiltrarea.</strong> Cum să scrii mesajul perfect care îi taie orgoliul și {isMen ? "o" : "îl"} face să accepte o cafea cu tine imediat, chiar dacă acum te {isMen ? "urăște" : "urăște"}. <em>(pagina 15)</em></li>
          <li>Cum {isMen ? "o" : "îl"} faci să NU îi mai asculte deloc pe {isMen ? "prietenele și familia ei atunci când o sfătuiesc" : "prietenii și familia lui atunci când îl sfătuiesc"} să te lase. <em>(pagina 47)</em></li>
          <li><strong>Bârfa Falsă și Mesajele de Curiozitate Extremă.</strong> O metodă garantată să {isMen ? "o" : "îl"} facă să moară de curiozitate și să îți răspundă la mesaje în câteva secunde. <em>(pagina 33)</em></li>
          <li>Cum să {isMen ? "o" : "îl"} atingi din greșeală ca să eliberezi hormonul iubirii în creierul {Pei}. Te va dori din nou fără să știe de ce. <em>(pagina 70)</em></li>
          <li><strong>Rescrierea Trecutului.</strong> O tactică psihologică prin care îi ștergi din minte amintirile urâte cu tine și {isMen ? "o" : "îl"} faci să creadă că v-ați iubit nebunește tot timpul. <em>(pagina 85)</em></li>
          <li>Cum să distrugi noua {isMen ? "ei relație fără să fii prins. O vei face să își urască noul iubit și să se simtă nefericită cu el, în timp ce tu pari doar un prieten bun care o ascultă" : "lui relație fără să fii prinsă. Îl vei face să își urască noua iubită și să se simtă nefericit cu ea, în timp ce tu pari doar o prietenă bună care îl ascultă"}. <em>(pagina 102)</em></li>
          <li>Cum să {isMen ? "o faci să nu se mai placă pe ea însăși atunci când stă cu actualul ei prieten" : "îl faci să nu se mai placă pe el însuși atunci când stă cu actuala lui prietenă"}. <em>(pagina 134)</em></li>
          <li><strong>Pedeapsa Silențioasă.</strong> Cum să {isMen ? "o dresezi ca pe un animal de companie, ca să o faci total dependentă" : "îl dresezi ca pe un animal de companie, ca să îl faci total dependent"} de validarea ta. <em>(pagina 120)</em></li>
          <li>Cum să afli fix ce îi lipsește în noua relație și să îi arăți subtil că tu ești {isMen ? "singurul bărbat" : "singura femeie"} care îi poate oferi acel lucru. <em>(pagina 78)</em></li>
          <li>Metoda extremă prin care {isMen ? "îl faci pe noul ei iubit paranoic și gelos, ca să distrugă el relația din interior, iar tu să pici ca un înger salvator" : "o faci pe noua lui iubită paranoică și geloasă, ca să distrugă ea relația din interior, iar tu să pici ca un înger salvator"}. <em>(pagina 66)</em></li>
          <li>Cele 2 cuvinte pe care trebuie să le zici fix în timp ce {isMen ? "o" : "îl"} săruți. Creierul {Pei} se va bloca și va accepta orice vrei tu. <em>(pagina 115)</em></li>
          <li>Cum să plantezi gânduri perverse în mintea {Pei}. {isMen ? "O" : "Îl"} vei face să se gândească la sex cu tine toată noaptea, folosind replici hipnotice ascunse. <em>(pagina 147)</em></li>
        </ul>

        <Img src="Screenshot2026-04-07161237.png" alt="" max="max-w-sm sm:max-w-md" />

        <div className="space-y-4">
          <p>Nu o să găsești aceste secrete nicăieri altundeva.</p>
          <p>Sunt prea puternice și prea controversate.</p>
          <p>Dar azi, poți pune mâna pe ele.</p>
          <p>Trebuie doar să fii conștient că tu ești responsabil de cum le folosești.</p>
          <p>Te rog folosește-le cu bună credință.</p>
        </div>

        {/* 30-day guarantee — NOT 60 */}
        <RedH sm>Și Acest Jurnal Este Protejat De Garanția Mea De 30 De Zile</RedH>
        <div className="text-center my-6">
          <img src={"/img/barbati-biblia/guarantee.png"} alt="Garanție 30 de zile" className="w-40 mx-auto mb-4 rounded-full" />
          <p>Dacă nu vezi cum comportamentul {Pei} se schimbă radical, primești fiecare banuț înapoi.</p>
        </div>

        {/* OFFER */}
        <div className="bg-[#ffffff] border-2 border-[#c8102e] rounded-lg p-6 my-6 text-center">
          <p className="mb-2 text-[#64748b]">În mod normal, am vândut Zero Despărțiri pentru <span className="line-through text-[#94a3b8]">100 de lei</span>.</p>
          <p className="font-bold text-[#1a1a2e] mb-2">...dar astăzi îl poți primi pe email pentru încă {JURNAL_PRICE} de lei <span className="text-[#22c55e]">(o singură plată)</span></p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-[#94a3b8] line-through text-xl">100 lei</span>
            <span className="text-[44px] font-extrabold leading-none" style={{ color: RED }}>{JURNAL_PRICE} <span className="text-2xl">RON</span></span>
          </div>
          <p className="text-[#22c55e] font-bold text-sm mb-4">O reducere de 53%. Fără costuri ascunse.</p>
        </div>

        <RedH sm>Acceptă Oferta Fără Riscuri</RedH>

        {/* EMBEDDED CHECKOUT — no separate checkout page */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg p-6 my-6">
          {initError === "nokey" && (
            <div className="text-sm text-[#64748b] text-center py-6">
              Formularul de plată se activează imediat ce este configurată cheia Stripe publishable
              (<code>VITE_STRIPE_PUBLISHABLE_KEY</code>).
            </div>
          )}
          {initError && initError !== "nokey" && (
            <div className="text-sm text-red-400 text-center py-6">A apărut o eroare la inițializarea plății. Reîncarcă pagina.</div>
          )}
          {!initError && !clientSecret && (
            <div className="text-center py-8 text-[#64748b]">
              <span className="inline-block w-6 h-6 border-2 border-[#e2e8f0] border-t-[#c8102e] rounded-full animate-spin" />
              <p className="mt-2 text-sm">Se pregătește plata securizată...</p>
            </div>
          )}
          {/* NOTE: intentionally NOT "clientSecret && stripePromise && ..." — with an
              empty publishable key stripePromise is statically null and the bundler
              tree-shakes this form away. The "nokey" early return guarantees
              clientSecret is only set when stripePromise exists. */}
          {clientSecret && (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "flat", variables: { colorPrimary: "#c8102e", borderRadius: "8px" } } }}
            >
              <JournalPayForm isMen={isMen} />
            </Elements>
          )}
        </div>

        {/* TRUST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
          <div className="text-center">
            <img src="/img/barbati-jurnal/discretbilling.png" alt="Plată discretă" className="h-14 mx-auto mb-2 object-contain" />
            <p className="text-xs text-[#64748b]"><strong className="text-[#1a1a2e]">Plată Discretă:</strong> Pe extrasul tău bancar va apărea doar o plată către „ANCA STEFANESCU", fără nicio referință la titlul cărții, astfel încât nimeni nu va ști ce ai cumpărat.</p>
          </div>
          <div className="text-center">
            <img src="/img/barbati-jurnal/cardsecuredlock.png" alt="Plată sigură" className="h-14 mx-auto mb-2 object-contain" />
            <p className="text-xs text-[#64748b]"><strong className="text-[#1a1a2e]">Plata Este Sigură:</strong> Tranzacția ta respectă cel mai înalt standard de securitate existent în industria plăților online. Datele cardului tău nu sunt stocate niciodată pe serverele noastre, fiind procesate direct de Stripe (eu nu am acces niciodată la datele cardului tău și doar tu îți vezi datele).</p>
          </div>
        </div>

        <footer className="border-t border-[#e2e8f0] pt-6 mt-8 text-center text-xs text-[#94a3b8] space-x-3">
          <Link href="/termeni" className="hover:text-[#1a1a2e]">Termeni și Condiții</Link>
          <Link href="/privacy" className="hover:text-[#1a1a2e]">Politica de Confidențialitate</Link>
          <Link href="/rambursare" className="hover:text-[#1a1a2e]">Politica de Rambursare</Link>
          <Link href="/contact" className="hover:text-[#1a1a2e]">Contact</Link>
          <Link href="/affiliate/register" className="hover:text-[#1a1a2e]">Afiliere</Link>
          <p className="mt-3">© 2026 TeVreauInapoi</p>
        </footer>
      </div>
    </div>
  );
}
