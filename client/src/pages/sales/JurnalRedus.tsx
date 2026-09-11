import { useLocation } from "wouter";
import { useState } from "react";
import { trackPurchase } from "@/lib/tracking";

const RED = "#c8102e";

/**
 * 1-click downsell: Zero Despărțiri REDUS, 19.95 lei.
 *   /barbati/ultimaoferta → decline → /barbati/multumesc
 *   /femei/ultimaoferta   → decline → /femei/multumesc
 */
export default function JurnalRedus() {
  const [location, setLocation] = useLocation();
  const isMen = !location.includes("/femei");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paymentIntentId = localStorage.getItem("tvii_pi") || "";
  const acceptPath = isMen ? "/barbati/multumesc" : "/femei/multumesc";
  const Pei = isMen ? "ei" : "lui";

  const handleAccept = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: "zero-despartiri",
          contactEmail: localStorage.getItem("tvii_email") || "",
          contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
          affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
          origin: window.location.origin,
          isUpsell: true,
          paymentIntentId,
          tier: "downsell",
        }),
      });
      const data = await res.json();
      if (data.oneClick && data.success) {
        trackPurchase({ productName: "zero-despartiri", value: 19.95, orderId: data.paymentIntentId });
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
          Stai! Nu vrei să ratezi această oportunitate...
        </div>

        <h1 className="text-center text-[26px] sm:text-[31px] font-extrabold leading-tight mb-4" style={{ color: RED }}>
          Ce Zici Dacă Îți Dau Zero Despărțiri Pentru 19.95 lei?
        </h1>
        <p className="text-center text-[#64748b] mb-2">(REDUCERE DE 92% — ultima ta șansă)</p>

        <img src="/img/barbati-jurnal/copertajurnal.png" alt="Zero Despărțiri" className="block w-full max-w-md sm:max-w-xl mx-auto my-6 rounded-lg shadow-lg" />
        <p className="text-center text-sm text-[#64748b] -mt-3">Zero Despărțiri (149 pagini)</p>

        <div className="space-y-4">
          <p>Nu vreau să ratezi această oportunitate... Ce zici dacă îți ofer Jurnalul la un preț mult mai mic?</p>
          <p>Acest Jurnal este plin cu <strong>cele mai potente și avansate metode</strong> care o fac pe acea femeie să simtă că înnebunește fără tine.</p>
          <p>De fapt, în momentul în care aplici aceste tactici avansate, va începe să creadă că despărțirea a fost <strong>cea mai mare greșeală din viața ei</strong>.</p>
        </div>

        {/* 30-day guarantee — NOT 60 */}
        <div className="text-center my-6">
          <img src="/img/barbati-biblia/guarantee.png" alt="Garanție 30 de zile — banii înapoi fără întrebări" className="w-64 sm:w-80 mx-auto mb-4 rounded-full" />
          <p><strong>Și Acest Jurnal Este Protejat De Garanția Mea De 30 De Zile.</strong></p>
          <p className="text-sm text-[#64748b]">Dacă nu vezi cum comportamentul ei se schimbă radical, primești fiecare banuț înapoi.</p>
        </div>

        <div className="bg-[#ffffff] border-2 border-[#c8102e] rounded-lg p-6 my-6 text-center">
          <p className="mb-2 text-[#64748b]">În mod normal, am vândut Zero Despărțiri pentru <span className="line-through text-[#94a3b8]">250 de lei</span>.</p>
          <p className="font-bold text-[#1a1a2e] mb-2">...dar acum îl poți primi pe email pentru încă <span style={{ color: RED }}>19.95 de lei</span> (o singură plată)</p>
          <p className="text-[#22c55e] font-bold text-sm mb-4">O reducere de 92% (cea mai mare de până acum). Fără costuri ascunse.</p>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>}

          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full max-w-md mx-auto block text-center bg-gradient-to-r from-[#c8102e] to-[#a50d23] text-white font-extrabold py-4 px-6 rounded-md shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] uppercase tracking-wide"
          >
            {loading ? "Se procesează..." : "Păstrează în comanda mea Zero Despărțiri Pentru 19.95 lei →"}
          </button>
        </div>

        <button
          onClick={() => setLocation(acceptPath)}
          className="block w-full text-center text-sm py-2 hover:underline mx-auto"
          style={{ color: "#8b95a5" }}
        >
          Nu, mulțumesc. Du-mă la următorul pas. Înțeleg că nu voi mai vedea niciodată această ofertă.
        </button>

      </div>
    </div>
  );
}
