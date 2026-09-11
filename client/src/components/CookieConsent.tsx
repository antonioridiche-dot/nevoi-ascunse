import { useState, useEffect } from "react";
import { Link } from "wouter";
import { loadAnalytics } from "@/lib/tracking";

const KEY = "tvii_cookie_consent";

/**
 * GDPR / ePrivacy cookie consent. Analytics & marketing pixels (Meta, Google,
 * Clarity) load ONLY after the user accepts. "Doar esențiale" keeps just the
 * cookies strictly necessary for the site/checkout to work.
 */
export default function CookieConsent() {
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    setChoice(saved);
    if (saved === "accepted") loadAnalytics();
  }, []);

  if (choice) return null;

  const decide = (v: "accepted" | "rejected") => {
    localStorage.setItem(KEY, v);
    setChoice(v);
    if (v === "accepted") loadAnalytics();
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] bg-[#1b2d4f] text-white shadow-2xl">
      <div className="max-w-4xl mx-auto p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm leading-relaxed flex-1">
          Folosim cookie-uri esențiale pentru funcționarea site-ului. Cu acordul tău, folosim și
          cookie-uri de analiză și marketing (Meta, Google, Microsoft Clarity). Detalii în{" "}
          <Link href="/privacy" className="underline text-[#e8c96a]">Politica de Confidențialitate</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => decide("rejected")}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors"
          >
            Doar esențiale
          </button>
          <button
            onClick={() => decide("accepted")}
            className="px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#b8860b] to-[#c9a44a] hover:shadow-lg transition-all"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
