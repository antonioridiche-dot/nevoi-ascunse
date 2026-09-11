import { useLocation, useSearch } from "wouter";
import { useEffect } from "react";
import { trackPurchase } from "@/lib/tracking";

export default function ThankYou() {
  const [location] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isMen = !location.includes("/femei");
  const sessionId = params.get("session_id");

  useEffect(() => {
    // Track purchase if coming from Stripe checkout
    if (sessionId) {
      trackPurchase({ productName: "biblia-impacare", value: 67 });
      // Store payment intent for potential upsells
      localStorage.setItem("tvii_session", sessionId);
    }
  }, [sessionId]);

  const libraryPath = isMen ? "/barbati/achizitii" : "/femei/achizitii";

  return (
    <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-[#1b2d4f] mb-4 font-['Playfair_Display']">
          Mulțumesc pentru achiziție!
        </h1>
        <p className="text-[#64748b] mb-4">
          Poți deschide materialele pe care le-ai cumpărat și din emailul pe care tocmai l-ai primit de la mine,
          pe adresa de pe care ai cumpărat. Sau poți apăsa direct butonul de mai jos.
        </p>

        <div className="bg-[#f0fdf4] border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700 font-semibold">✓ Plata confirmată</p>
          <p className="text-green-600 text-sm mt-1">Verifică inbox-ul (și folderul Spam/Promoții)</p>
        </div>

        <div className="space-y-3">
          <a
            href={libraryPath}
            className="block w-full bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all active:scale-[0.97]"
            style={{ textDecoration: "none", transition: "all 160ms cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            ACCESEAZĂ ACUM CE AI CUMPĂRAT →
          </a>
        </div>

        <p className="text-sm text-[#64748b] mt-6">
          În viitor, când vrei să deschizi din nou cartea, deschide-o din linkul din email.
          O poți și descărca, dacă dorești.
        </p>
        <p className="text-sm text-[#64748b] mt-3">
          Dacă ai întrebări, scrie-ne la <a href="mailto:anca@pestedespartire.ro" className="text-[#1b2d4f] underline">anca@pestedespartire.ro</a>
        </p>
      </div>
    </div>
  );
}
