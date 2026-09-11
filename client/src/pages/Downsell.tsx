import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useSearch } from "wouter";
import { Loader2, Gift, ArrowRight, X } from "lucide-react";
import { useState } from "react";

const DOWNSELL_CONFIG: Record<string, { title: string; originalPrice: number; downsellPrice: number; recurring?: boolean; slug: string; nextUpsell?: string; description: string }> = {
  "zero-despartiri": {
    title: "Zero Despărțiri",
    originalPrice: 100,
    downsellPrice: 39.95,
    slug: "zero-despartiri",
    nextUpsell: "sustinere-barbati",
    description: "Ghidul care te ajută să nu mai treci niciodată prin asta: cum să construiești o relație în care să nu te mai rănească nimeni.",
  },
  "sustinere-barbati": {
    title: "Susținere Personală",
    originalPrice: 147,
    downsellPrice: 97,
    recurring: true,
    slug: "sustinere-barbati",
    description: "Acces la coaching personalizat cu Cristina Munteanu. Primesti sfaturi adaptate situatiei tale specifice.",
  },
};

export default function Downsell() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const product = params.get("product") || "zero-despartiri";
  const gender = params.get("gender") || "male";
  const contactId = params.get("contactId") || "";
  const sessionId = params.get("session_id") || "";
  const [loading, setLoading] = useState(false);

  const config = DOWNSELL_CONFIG[product];
  if (!config) {
    navigate(`/thank-you?gender=${gender}&contactId=${contactId}`);
    return null;
  }

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: config.slug,
          contactId: parseInt(contactId) || 0,
          gender,
          isUpsell: true,
          previousSessionId: sessionId,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (config.nextUpsell) {
      navigate(`/upsell?product=${config.nextUpsell}&gender=${gender}&contactId=${contactId}&session_id=${sessionId}`);
    } else {
      navigate(`/thank-you?gender=${gender}&contactId=${contactId}`);
    }
  };

  const discount = Math.round(((config.originalPrice - config.downsellPrice) / config.originalPrice) * 100);
  // Abonamentele (coaching) se afiseaza cu "/lună" — altfel pretul lunar pare o singura plata.
  const sfx = config.recurring ? "/lună" : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f5ec] to-white py-12 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="mb-6">
          <span className="inline-block bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            STAI! Oferta Speciala
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1b2d4f] font-['Playfair_Display'] mb-3">
            Am o oferta mai buna pentru tine
          </h1>
          <p className="text-[#64748b] text-lg">
            Intelegem ca {config.originalPrice} RON{sfx} poate fi mult. De aceea, iti oferim <strong>{config.title}</strong> la un pret special:
          </p>
        </div>

        <Card className="border-2 border-[#c9a44a] shadow-xl mb-8">
          <CardContent className="p-8">
            <Gift className="w-12 h-12 text-[#c9a44a] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#1b2d4f] mb-2">{config.title}</h2>
            <p className="text-[#64748b] mb-4">{config.description}</p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-2xl text-[#94a3b8] line-through">{config.originalPrice} RON{sfx}</span>
              <span className="text-4xl font-bold text-[#c9a44a]">{config.downsellPrice} RON{sfx}</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">-{discount}%</span>
            </div>

            <Button
              onClick={handleAccept}
              disabled={loading}
              className="w-full bg-[#c9a44a] hover:bg-[#b8933a] text-white text-lg py-6 mb-3"
            >
              {loading ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : <ArrowRight className="mr-2 w-5 h-5" />}
              Da, vreau la {config.downsellPrice} RON{sfx}!
            </Button>

            <button
              onClick={handleDecline}
              className="text-sm text-[#94a3b8] hover:text-[#64748b] underline"
            >
              <X className="inline w-3 h-3 mr-1" />
              Nu, multumesc, nu vreau aceasta oferta
            </button>
          </CardContent>
        </Card>

        <p className="text-xs text-[#94a3b8]">
          Garantie de rambursare 30 de zile. Plata securizata prin Stripe.
        </p>
      </div>
    </div>
  );
}
