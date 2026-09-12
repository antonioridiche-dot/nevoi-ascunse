import { useLocation } from "wouter";
import { useState } from "react";
import { trackPurchase } from "@/lib/tracking";

const RED = "#c8102e";
const CTA = "from-[#c8102e] to-[#a50d23]";

function RedH({ children, sm }: { children: React.ReactNode; sm?: boolean }) {
  return (
    <h2 className={`text-center font-extrabold leading-snug my-6 ${sm ? "text-[22px]" : "text-[26px] sm:text-[31px]"}`} style={{ color: RED }}>
      {children}
    </h2>
  );
}

/**
 * 1-click upsell (sansemaxime-style): personalized coaching (97 RON/lună)
 * + Zero Despărțiri as a FREE bonus.
 *   /barbati/asteapta  → decline → /barbati/doarjurnal
 *   /femei/asteapta    → decline → /femei/doarjurnal
 */
export default function Asteapta() {
  const [location, setLocation] = useLocation();
  const isMen = !location.includes("/femei");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paymentIntentId = localStorage.getItem("tvii_pi") || "";
  const coachingSlug = isMen ? "sustinere-barbati" : "sustinere-femei";
  const acceptPath = isMen ? "/barbati/multumesc" : "/femei/multumesc";
  const declinePath = isMen ? "/barbati/doarjurnal" : "/femei/doarjurnal";
  const P = isMen ? "ea" : "el";        // partner pronoun
  const Pgen = isMen ? "acelei femei" : "acelui bărbat";
  const Pei = isMen ? "ei" : "lui";
  const iubita = isMen ? "iubita" : "iubitul";

  const handleAccept = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: coachingSlug,
          contactEmail: localStorage.getItem("tvii_email") || "",
          contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
          affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
          origin: window.location.origin,
          isUpsell: true,
          paymentIntentId,
          tier: "upsell",
          journalBonus: true,
        }),
      });
      const data = await res.json();
      if (data.oneClick && data.success) {
        trackPurchase({ productName: coachingSlug, value: 97, orderId: data.subscriptionId || data.paymentIntentId });
        setLocation(acceptPath);
      } else if (data.url) {
        window.location.href = data.url; // fallback to hosted checkout
      } else {
        setError(data.error || "A apărut o eroare. Încearcă din nou.");
      }
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally { setLoading(false); }
  };

  return (
    <div className="qz-wrap" style={{ background: "#ffffff" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-[17px] leading-relaxed" style={{ color: "#1a1a2e" }}>
        <div className="text-center font-bold tracking-widest text-sm mb-3" style={{ color: "#8b95a5" }}>✦ pestedespartire.ro</div>

        <div className="text-center text-[13px] font-bold text-white bg-[#7a1115] border border-[#c8102e] rounded-md px-4 py-2 mb-5">
          Stai! Mai Am Ceva Să-ți Spun... Nu ieși de pe această pagină! Altfel s-ar putea să apară erori la comandă. Citește textul de mai jos pentru a continua...
        </div>

        <h1 className="text-center text-[26px] sm:text-[31px] font-extrabold leading-tight mb-6" style={{ color: RED }}>
          Dacă Vrei Să Treci Peste Asta Definitiv, Nu Doar Să Aștepți Să Trecă...
        </h1>

        <div className="space-y-4">
          <p>Cartea te învață metoda. Dar situația ta este a ta — și exact acolo apar blocajele.</p>
          <p>Cele mai multe femei care rămân blocate ani de zile nu rămân blocate pentru că nu știu metoda. Rămân blocate pentru că, atunci când o aplică, dau peste ceva ce nu se potrivește cu ce scrie în carte. Și, neavând pe nimeni care să le spună ce să facă mai departe, se opresc.</p>
          <p>E ca atunci când ai o problemă la mașină. Nu te apuci să o repari singur{isMen ? "" : "ă"} pentru că știi că cel mai probabil o să faci o greșeală care o strică de tot. Te duci la cineva care a mai făcut asta de sute de ori.</p>
          <p>De aceea, în loc să te las să treci singur{isMen ? "" : "ă"} prin asta, riscând să rămâi blocat{isMen ? "" : "ă"} luni de zile... îți recomand să adaugi la comanda ta <strong>programul meu de susținere personală pe email</strong>.</p>
          <p>Imediat ce îmi dai câteva detalii despre situația ta, îți construiesc un <strong>plan concret, doar pentru tine</strong> — ce faci în fiecare săptămână, ce exerciții aplici și în ce ordine.</p>
          <p>Îmi poți scrie oricând te blochezi: când o amintire te lovește din senin, când simți nevoia să-i verifici iar rețelele, când ai o zi în care ți se pare că ai dat înapoi tot progresul. Îți răspund personal, de obicei în aceeași zi sau a doua zi, și îți spun exact ce să faci mai departe.</p>
          <p>Asta e diferența dintre a citi o carte și a te vindeca cu cineva care știe exact unde ești.</p>
          <p>Dar fii atent{isMen ? "" : "ă"} la un detaliu: <strong>timpul meu este limitat</strong>. Poți vedea situația locurilor mai jos.</p>
        </div>

        {/* Scarcity */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg p-5 my-6 text-center">
          <p className="font-bold text-[#1a1a2e] mb-2">Locuri Disponibile În Programul De Susținere Personală</p>
          <div className="text-[32px] font-extrabold" style={{ color: RED }}>25 / 28</div>
          <p className="text-sm text-[#64748b]">Mai SUNT doar <strong className="text-[#1a1a2e]">3</strong> locuri rămase disponibile.</p>
        </div>

        <div className="space-y-4">
          <p>Odată ce ai intrat în program, nu mai ești singur{isMen ? "" : "ă"}. Îmi poți scrie de câte ori te simți blocat{isMen ? "" : "ă"} sau nu știi ce să-i răspunzi. Sunt la un email distanță pentru a-ți corecta fiecare mișcare (îți răspund de obicei în aceeași zi sau a doua zi).</p>
          <p>Dar trebuie să te grăbești. Cu cât trece mai mult timp, cu atât durerea se cuibărește mai adânc — și devine mai greu de scos. Nu pentru că ai fi slab{isMen ? "" : "ă"}, ci pentru că așa funcționează creierul.</p>
          <p>De aceea, dacă mai sunt locuri disponibile trebuie să acționezi astăzi. Altfel locul tău se poate duce la altcineva.</p>
          <p>De asemenea, tot ce îmi scrii rămâne strict între noi. Nu le voi distribui niciodată mai departe și eu sunt singura care are acces la ele.</p>
        </div>

        {/* FREE BONUS — Zero Despărțiri */}
        <div className="bg-[#ffffff] border-2 border-[#e8c96a] rounded-lg p-6 my-6 text-center">
          <span className="inline-block bg-[#e8c96a] text-[#14171c] text-xs font-extrabold tracking-widest px-4 py-1.5 rounded-full mb-4">🎁 BONUS GRATIS</span>
          <img src="/img/barbati-jurnal/copertajurnal.png" alt="Zero Despărțiri" className="block w-full max-w-md sm:max-w-xl mx-auto mb-4 rounded-lg shadow-lg" />
          <h3 className="text-[#1a1a2e] font-extrabold text-xl mb-1">Zero Despărțiri</h3>
          <p className="text-sm text-[#64748b] mb-2">(149 pagini)</p>
          <p className="text-sm text-[#1a1a2e]">
            Primești <strong>GRATIS</strong> alături de programul de susținere personală — ghidul care te învață să nu mai ajungi niciodată aici.
          </p>
          <p className="text-sm text-[#64748b] mt-2">
            Ai trecut prin durerea unei despărțiri o dată. <strong>Zero Despărțiri</strong> este despre ce urmează: cum să construiești o relație
            în care să nu te mai rănească nimeni, cum să recunoști din timp semnalele și cum să nu mai repeți aceleași greșeli.
            <strong> Și doar acum, pe această pagină, îl primești gratuit dacă te înscrii la programul meu de susținere personală.</strong>
          </p>
        </div>

        <div className="space-y-4">
          <p><strong>Dacă alegi să păstrezi în comanda ta programul de susținere personală</strong>, vei fi direcționat către un formular în care te voi pune să-mi detaliezi situația ta specifică. După aceea voi analiza răspunsurile tale și vom vorbi personal pe email, cu scopul de a trece peste asta cât mai curând — și definitiv.</p>
        </div>

        {/* 30-day guarantee — NOT 60 */}
        <RedH sm>Și Această Ofertă Este Protejată De Garanția Mea De 30 De Zile</RedH>
        <div className="text-center my-6">
          <img src="/img/barbati-biblia/guarantee.png" alt="Garanție 30 de zile — banii înapoi fără întrebări" className="w-64 sm:w-80 mx-auto mb-4 rounded-full" />
          <p>Dacă nu simți nicio diferență, trimite-mi un email la <a href="mailto:cristina@pestedespartire.ro" className="text-[#c8102e] underline">cristina@pestedespartire.ro</a> și primești fiecare banuț înapoi.</p>
        </div>

        {/* OFFER */}
        <div className="bg-[#ffffff] border-2 border-[#c8102e] rounded-lg p-6 my-6 text-center">
          <p className="mb-2 text-[#64748b]">În mod normal, consultanța mea costă <span className="line-through text-[#94a3b8]">500 RON/lună</span>. Dar dacă acționezi acum, prin această pagină, primești accesul la Programul Meu De Susținere Personală...</p>
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-[#94a3b8] line-through text-xl">500 RON</span>
            <span className="text-[44px] font-extrabold leading-none" style={{ color: RED }}>97 <span className="text-2xl">RON/lună</span></span>
          </div>
          <p className="text-[#22c55e] font-bold text-sm mb-1">(care înseamnă 3,2 lei pe zi până când te vindeci)</p>
          <p className="text-[#22c55e] font-bold text-sm mb-2">O reducere directă de peste 80%. Fără costuri ascunse.</p>
          <p className="text-xs text-[#64748b] mb-4">Poți să anulezi când dorești. Tot ce trebuie să faci este să-mi trimiți un email la cristina@pestedespartire.ro. De asemenea, dacă nu folosești deloc programul ți-l voi anula personal pentru tine.</p>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>}

          <button
            onClick={handleAccept}
            disabled={loading}
            className={`w-full max-w-md mx-auto block text-center bg-gradient-to-r ${CTA} text-white font-extrabold py-4 px-6 rounded-md shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] uppercase tracking-wide`}
          >
            {loading ? "Se procesează..." : "Adaugă În Comanda Mea Sfaturile Tale Personalizate →"}
          </button>
          <p className="text-xs text-[#64748b] mt-3">🎁 Bonus gratuit inclus: Zero Despărțiri (149 pagini)</p>
        </div>

        <button
          onClick={() => setLocation(declinePath)}
          className="block w-full text-center text-sm py-2 hover:underline mx-auto"
          style={{ color: "#8b95a5" }}
        >
          Nu, mulțumesc. Voi risca să fac greșeli care înseamnă că {isMen ? "o" : "îl"} pot pierde pentru totdeauna.
        </button>

      </div>
    </div>
  );
}
