import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import "../pages/quiz.css";

export default function SalesPage() {
  const [location] = useLocation();
  const isMen = location.includes("/barbati/");
  const gender = isMen ? "men" : "women";

  // Determine which product page this is
  const getPageType = () => {
    if (location.includes("oprestedurerea")) return "biblia";
    if (location.includes("ajutorpersonalizat") || location.includes("sfaturipersonalizate")) return "coaching";
    if (location.includes("stopdespartiri") || location.includes("jurnalulnegru")) return "secondary_book";
    return "biblia";
  };

  const pageType = getPageType();

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm text-[#c9a44a] font-bold tracking-widest uppercase mb-4">
            {pageType === "biblia" ? "METODA #1 DIN ROMÂNIA PENTRU ÎMPĂCARE" : "PROGRAM DE COACHING"}
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold text-[#1b2d4f] leading-tight mb-6">
            {pageType === "biblia" && "Cum să Oprești Durerea unei Despărțiri"}
            {pageType === "coaching" && (isMen ? "Susținere Personală" : "Susținere Personală")}
            {pageType === "secondary_book" && (isMen ? "Zero Despărțiri" : "Stop Despărțirii")}
          </h1>
          <p className="text-lg text-[#64748b] max-w-2xl mx-auto">
            {pageType === "biblia" && "Descoperă metoda exactă prin care poți reactiva sentimentele partenerului tău și să vă împăcați — chiar și din situații care par imposibile."}
            {pageType === "coaching" && "Primește ghidare personalizată pentru situația ta exactă, direct de la Cristina Munteanu."}
            {pageType === "secondary_book" && "Materialul complementar care îți oferă strategii avansate pentru a-ți consolida relația."}
          </p>
        </div>

        {/* Price & CTA */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto text-center">
          <div className="mb-6">
            <span className="text-sm text-[#64748b] line-through">147 RON</span>
            <div className="text-4xl font-bold text-[#1b2d4f]">
              {pageType === "biblia" ? "67" : pageType === "coaching" ? "147" : "47"} RON{pageType === "coaching" ? "/lună" : ""}
            </div>
            <p className="text-sm text-[#64748b] mt-1">Acces instant • Garanție 30 de zile</p>
          </div>

          <a
            href={`/${isMen ? "barbati" : "femei"}/checkout?product=${pageType}`}
            className="qz-btn qz-btn-gold block"
            style={{ textDecoration: "none" }}
          >
            ADAUGĂ ÎN COȘ →
          </a>

          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-[#64748b]">
            <span>🔒 Plată securizată</span>
            <span>📖 Acces imediat</span>
          </div>
        </div>

        {/* Testimonials placeholder */}
        <div className="mt-12 text-center">
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1b2d4f] mb-6">
            Ce spun {isMen ? "bărbații" : "femeile"} care au citit cartea
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl border border-[#dde3ef]">
                <div className="text-[#c9a44a] mb-2">★★★★★</div>
                <p className="text-[#64748b] text-sm italic">"Testimonial placeholder - to be replaced with real testimonials from the original sales page."</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-[#64748b] space-y-2">
          <p>© 2026 tevreauinapoi — Toate drepturile rezervate.</p>
          <div className="flex justify-center gap-4">
            <a href="/termeni" className="hover:text-[#1b2d4f]">Termeni</a>
            <a href="/privacy" className="hover:text-[#1b2d4f]">Confidențialitate</a>
            <a href="/rambursare" className="hover:text-[#1b2d4f]">Rambursare</a>
            <a href="/contact" className="hover:text-[#1b2d4f]">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
