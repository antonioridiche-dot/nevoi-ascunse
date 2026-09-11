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
          Dacă Vrei Să Ai Șanse Maxime De Împăcare...
        </h1>

        <div className="space-y-4">
          <p>Îți mai pot oferi ceva care {isMen ? "o va face pe acea femeie" : "îl va face pe acel bărbat"} să te caute și să-ți bată la ușă disperat{isMen ? "ă" : ""} până când îl primești înapoi.</p>
          <p>Vezi tu... Adevărul e că situația ta e probabil unică și chiar și cu cea mai bună carte de împăcare de pe internet... Tot s-ar putea să faci greșeli...</p>
          <p>E ca atunci când ți se strică mașina. Nu te pui să o repari singur deoarece știi că cel mai probabil o să faci greșeli care o să o strice de tot. În schimb, mergi cu ea la un mecanic care se pricepe și care a mai făcut asta.</p>
          <p>De aceea, în loc să te las să treci singur prin asta și să riști să faci greșeli care te pot costa să {isMen ? "o" : "îl"} pierzi pentru totdeauna... îți recomand să adaugi la comanda ta și <strong>programul meu de sfaturi personalizate pe email</strong>.</p>
          <p>Imediat ce îmi vei oferi câteva detalii cheie despre situația ta specifică... Voi construi un <strong>profil psihologic exact al {Pgen}</strong> pe care {isMen ? "o" : "îl"} vrei înapoi.</p>
          <p>Iar odată ce deținem aceste informații... Mă voi asigura personal că pur și simplu nu va avea altă opțiune decât să te vrea înapoi. Vom ști exact cum să-i atingem punctele vulnerabile și să-i reaprindem dorința.</p>
          <p>Odată ce facem asta, e ca și cum i-ai citi gândurile. Îi vei provoca un dor intens în inimă... {isMen ? "O" : "Îl"} vei face să se gândească la tine obsedat{isMen ? "ă" : ""}, așa cum nu credeai că mai e posibil... și, cel mai important, {isMen ? "o" : "îl"} vei determina să lase garda jos și să inițieze {P} împăcarea.</p>
          <p>Dar fii atent la un detaliu critic: <strong>timpul meu este limitat</strong>. Poți vedea situația locurilor mai jos.</p>
        </div>

        {/* Scarcity */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg p-5 my-6 text-center">
          <p className="font-bold text-[#1a1a2e] mb-2">Locuri Disponibile În Programul De Susținere Personală</p>
          <div className="text-[32px] font-extrabold" style={{ color: RED }}>25 / 28</div>
          <p className="text-sm text-[#64748b]">Mai SUNT doar <strong className="text-[#1a1a2e]">3</strong> locuri rămase disponibile.</p>
        </div>

        <div className="space-y-4">
          <p>Odată ce ai intrat în program, nu mai ești singur{isMen ? "" : "ă"}. Îmi poți scrie de câte ori te simți blocat{isMen ? "" : "ă"} sau nu știi ce să-i răspunzi. Sunt la un email distanță pentru a-ți corecta fiecare mișcare (îți răspund de obicei în aceeași zi sau a doua zi).</p>
          <p>Dar trebuie să te grăbești... Amândoi știm că timpul nu este de partea noastră după o despărțire. Cu cât trece mai mult timp, cu atât cresc șansele să-și găsească pe altcineva și să uite de tine.</p>
          <p>De aceea, dacă mai sunt locuri disponibile trebuie să acționezi astăzi. Altfel locul tău se poate duce la altcineva.</p>
          <p>De asemenea, datele tale și toate informațiile pe care mi le dai rămân strict între noi doi. Nu le voi distribui niciodată mai departe și eu sunt singura care are acces la ele.</p>
        </div>

        {/* FREE BONUS — Zero Despărțiri */}
        <div className="bg-[#ffffff] border-2 border-[#e8c96a] rounded-lg p-6 my-6 text-center">
          <span className="inline-block bg-[#e8c96a] text-[#14171c] text-xs font-extrabold tracking-widest px-4 py-1.5 rounded-full mb-4">🎁 BONUS GRATIS</span>
          <img src="/img/barbati-jurnal/copertajurnal.png" alt="Zero Despărțiri" className="block w-full max-w-md sm:max-w-xl mx-auto mb-4 rounded-lg shadow-lg" />
          <h3 className="text-[#1a1a2e] font-extrabold text-xl mb-1">Zero Despărțiri</h3>
          <p className="text-sm text-[#64748b] mb-2">(149 pagini)</p>
          <p className="text-sm text-[#1a1a2e]">
            Primești <strong>GRATIS</strong> alături de programul de sfaturi personalizate — jurnalul cu tacticile interzise pe care le-am scos din Cum să Oprești Durerea unei Despărțiri.
          </p>
          <p className="text-sm text-[#64748b] mt-2">
            Le-am scos pentru că, imediat după prima versiune a Bibliei, oamenii mi-au scris că sunt <strong>prea puternice</strong> — capitole
            care treceau linia fină dintre influență și manipulare. Ca să nu-mi fie ștearsă cartea de pe internet, a trebuit să le elimin.
            <strong> Nu le-am șters însă</strong> — le-am strâns la un loc, aici, în acest Jurnal de {isMen ? "149" : "118"} de pagini.
            <strong> Și doar acum, pe această pagină, îl primești gratuit dacă te înscrii la programul meu de sfaturi personalizate.</strong>
          </p>
        </div>

        <div className="space-y-4">
          <p><strong>Dacă alegi să păstrezi în comanda ta sfaturile mele personalizate</strong>, vei fi direcționat către un formular în care te voi pune să-mi detaliezi situația ta specifică. După aceea voi analiza răspunsurile tale și vom vorbi personal pe email cu scopul de a-ți recupera {iubita} cât mai curând.</p>
        </div>

        {/* 30-day guarantee — NOT 60 */}
        <RedH sm>Și Această Ofertă Este Protejată De Garanția Mea De 30 De Zile</RedH>
        <div className="text-center my-6">
          <img src="/img/barbati-biblia/guarantee.png" alt="Garanție 30 de zile — banii înapoi fără întrebări" className="w-64 sm:w-80 mx-auto mb-4 rounded-full" />
          <p>Dacă nu vezi cum comportamentul {Pei} se schimbă radical, trimite-mi un email la <a href="mailto:anca@pestedespartire.ro" className="text-[#c8102e] underline">anca@pestedespartire.ro</a> și primești fiecare banuț înapoi.</p>
        </div>

        {/* OFFER */}
        <div className="bg-[#ffffff] border-2 border-[#c8102e] rounded-lg p-6 my-6 text-center">
          <p className="mb-2 text-[#64748b]">În mod normal, consultanța mea costă <span className="line-through text-[#94a3b8]">500 RON/lună</span>. Dar dacă acționezi acum, prin această pagină, primești accesul la Programul Meu De Susținere Personală...</p>
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-[#94a3b8] line-through text-xl">500 RON</span>
            <span className="text-[44px] font-extrabold leading-none" style={{ color: RED }}>97 <span className="text-2xl">RON/lună</span></span>
          </div>
          <p className="text-[#22c55e] font-bold text-sm mb-1">(care înseamnă 3,2 lei pe zi până când vă împăcați)</p>
          <p className="text-[#22c55e] font-bold text-sm mb-2">O reducere directă de peste 80%. Fără costuri ascunse.</p>
          <p className="text-xs text-[#64748b] mb-4">Poți să anulezi când dorești. Tot ce trebuie să faci este să-mi trimiți un email la anca@pestedespartire.ro. De asemenea, dacă nu folosești deloc programul de sfaturi personalizate ți-l voi anula personal pentru tine.</p>

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
