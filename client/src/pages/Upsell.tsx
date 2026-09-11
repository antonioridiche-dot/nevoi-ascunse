import { useLocation } from "wouter";
import { useState } from "react";
import { trackPurchase } from "@/lib/tracking";

/**
 * Funnel upsell/downsell — a SECOND BOOK (1-click, reuses the saved card):
 *   women → Zero Despărțiri,  men → Zero Despărțiri.
 *   asteapta = upsell (39.95 lei) → decline → downsell (19.95 lei) → thank-you.
 */
export default function Upsell() {
  const [location, setLocation] = useLocation();
  const isMen = location.includes("/barbati/") || location.includes("/sfaturireduse");
  const tier: "upsell" | "downsell" = location.includes("asteapta") ? "upsell" : "downsell";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paymentIntentId = localStorage.getItem("tvii_pi") || "";
  const slug = isMen ? "zero-despartiri" : "zero-despartiri";
  const price = tier === "upsell" ? "39,95" : "19,95";
  const priceNum = tier === "upsell" ? 39.95 : 19.95;
  const cover = isMen ? "/img/funnel/jurnal-cover.png" : "/img/funnel/zero-cover.png";

  // where to go after this step
  const declinePath = tier === "upsell"
    ? (isMen ? "/barbati/sansemaxime" : "/femei/ultimaoferta")
    : (isMen ? "/barbati/multumesc" : "/femei/multumesc");
  const acceptPath = isMen ? "/barbati/multumesc" : "/femei/multumesc";

  const t = isMen
    ? { bg: "#14171c", fg: "#d8dde5", card: "#1e232b", border: "#2d343f", red: "#ff3b3b", muted: "#8b95a5",
        cta: "from-[#b91c1c] to-[#e11d2a]", radius: "rounded-md" }
    : { bg: "#f0f3f8", fg: "#1a1a2e", card: "#ffffff", border: "#e8d9a0", red: "#cc0000", muted: "#64748b",
        cta: "from-[#b8860b] to-[#c9a44a]", radius: "rounded-2xl" };

  const handleAccept = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: slug,
          contactEmail: localStorage.getItem("tvii_email") || "",
          contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
          affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
          origin: window.location.origin,
          isUpsell: true,
          paymentIntentId,
          tier,
        }),
      });
      const data = await res.json();
      if (data.oneClick && data.success) {
        trackPurchase({ productName: slug, value: priceNum, orderId: data.paymentIntentId });
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

  const bookTitle = isMen ? "Zero Despărțiri" : "Zero Despărțiri";
  const pages = isMen ? "149 pagini" : "89 de pagini";

  return (
    <div className="qz-wrap" style={{ background: t.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-[17px] leading-relaxed" style={{ color: t.fg }}>
        <div className="text-center text-sm font-bold mb-3" style={{ color: t.red }}>
          ⏰ AȘTEAPTĂ! Comanda ta este în procesare — nu închide pagina
        </div>

        <h1 className="text-center text-[24px] sm:text-[28px] font-extrabold leading-snug mb-4" style={{ color: t.red }}>
          {tier === "upsell"
            ? (isMen
              ? "Înainte de a-ți descărca cartea... ți-am adăugat în comandă ceva ce țin de obicei ascuns"
              : "Înțeleg că nu vrei încă sfaturile mele... dar ce zici dacă păstrezi în comandă și cartea Zero Despărțiri?")
            : "Okay... asta e ultima mea ofertă"}
        </h1>

        <p className="text-center mb-5" style={{ color: t.muted }}>
          {tier === "upsell"
            ? `(o singură plată de doar ${price} lei)`
            : `Dacă ți-aș oferi „${bookTitle}" pentru doar ${price} lei?`}
        </p>

        <img src={cover} alt={bookTitle} className="block w-full max-w-[260px] mx-auto my-6 rounded-lg shadow-md" />

        <h2 className="text-center text-[22px] font-bold mb-1">Cartea „{bookTitle}"</h2>
        <p className="text-center mb-5" style={{ color: t.muted }}>({pages})</p>

        {isMen ? (
          <div className="space-y-4">
            <p><strong>Zero Despărțiri</strong> conține tactici interzise care exploatează erorile minții umane — secțiunile pe care a trebuit să le scot din Cum să Oprești Durerea unei Despărțiri pentru că erau <em>prea</em> puternice.</p>
            <p>Îți va da control aproape imediat asupra „părții impulsive" din mintea oricărei femei — acea parte care se umple cu un nivel incontrolabil de dorință pentru tine, creând o obsesie care o face să te caute prima.</p>
            <p
              className="text-[15px] font-extrabold rounded-lg px-4 py-3 border-2"
              style={{ color: t.red, borderColor: t.red, background: "rgba(255,59,59,0.10)" }}
            >
              ⚠ Te rog folosește-l cu bună credință. În mâinile greșite poate fi folosit pentru a distruge emoțional o femeie.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p>Femeile care au achiziționat „Cum să Oprești Durerea unei Despărțiri" aleg să cumpere la pachet și „Zero Despărțiri". De ce? Pentru că ce rost are să depui atâta efort să te împaci cu el dacă vă veți despărți din nou peste câteva luni?</p>
            <p className="font-semibold" style={{ color: t.red }}>Iată ce vei găsi în această carte:</p>
            <ul className="list-disc pl-6 space-y-2" style={{ marginLeft: 0 }}>
              <li>Cum să îi accesezi o nevoie biologică profundă care îl face complet dependent de prezența ta. <em>(pag. 22)</em></li>
              <li>Cum să plantezi ideea de angajament, mutare împreună sau căsătorie direct în mintea lui. <em>(pag. 39)</em></li>
              <li>Cum să-l faci să se gândească obsesiv la tine chiar și când nu ești lângă el. <em>(pag. 45)</em></li>
              <li>Cum să activezi Efectul „Romeo și Julieta" — devotamentul lui crește exponențial. <em>(pag. 55)</em></li>
              <li>Reprogramarea prin „Pedeapsă" (Strict 18+) — tehnica controversată care creează dependență emoțională și fizică. <em>(pag. 64)</em></li>
              <li>O singură propoziție care oprește și câștigă o ceartă toxică în 60 de secunde. <em>(pag. 76)</em></li>
              <li>Conversația de Salvare — exact ce să faci în primele 24 de ore când simți că urmează o despărțire. <em>(pag. 82)</em></li>
            </ul>
          </div>
        )}

        {/* 30-day guarantee */}
        <div className="text-center my-6">
          <div className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 mx-auto mb-3" style={{ borderColor: t.red, background: t.card }}>
            <span className="text-[28px] font-extrabold leading-none">30</span>
            <span className="text-[10px] font-bold tracking-wide">DE ZILE</span>
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: t.red }}>GARANȚIE</span>
          </div>
          <p className="text-sm" style={{ color: t.muted }}>
            Garanție 30 de zile. Dacă nu ești mulțumit(ă), scrie la <a href="mailto:anca@pestedespartire.ro" className="underline">anca@pestedespartire.ro</a> și primești banii înapoi.
          </p>
        </div>

        <div className="rounded-xl p-5 my-6 text-center border-2" style={{ background: t.card, borderColor: t.red }}>
          <p className="mb-2" style={{ color: t.muted }}>
            În mod normal costă <span className="line-through">100 lei</span>. Doar prin această pagină:
          </p>
          <div className="text-[40px] font-extrabold leading-none mb-4" style={{ color: t.red }}>{price} <span className="text-xl">lei</span></div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>}

          <button
            onClick={handleAccept}
            disabled={loading}
            className={`w-full max-w-md mx-auto text-center bg-gradient-to-r ${t.cta} text-white font-extrabold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 active:scale-[0.98] uppercase tracking-wide`}
          >
            {loading ? "Se procesează..." : `DA, ADAUGĂ ÎN COMANDĂ (${price} lei) →`}
          </button>
        </div>

        <button
          onClick={() => setLocation(declinePath)}
          className="block w-full text-center text-sm py-2 hover:underline mx-auto"
          style={{ color: t.muted }}
        >
          {tier === "upsell"
            ? `Nu, mulțumesc — scoate „${bookTitle}" din comandă. Înțeleg că nu voi mai vedea această ofertă.`
            : "Nu, mulțumesc — continuă fără această ofertă."}
        </button>
      </div>
    </div>
  );
}
