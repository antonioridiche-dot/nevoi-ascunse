import { useLocation } from "wouter";
import { useState } from "react";

export default function BookDelivery() {
  const [location, setLocation] = useLocation();
  const isMen = location.includes("/barbati/");
  const [extraDownloading, setExtraDownloading] = useState(false);
  const libraryPath = isMen ? "/barbati/biblioteca" : "/femei/biblioteca";

  const getBookInfo = () => {
    if (location.includes("bibliax") || location.includes("impacare")) {
      return {
        title: "Cum să Oprești Durerea unei Despărțiri",
        subtitle: "Metoda completă de împăcare",
        slug: isMen ? "opreste-durerea-barbati" : "opreste-durerea-femei",
        icon: "📖",
        // Bump offer — delivered together with the book when bought at checkout.
        extra: isMen
          ? { title: "Mesajele EXTRA de Împăcare", slug: "mesaje-extra-barbati" }
          : { title: "Mesajele EXTRA de Împăcare", slug: "mesaje-extra-femei" },
      };
    }
    if (location.includes("deschidebiblia") || location.includes("relatiereusita")) {
      return {
        title: isMen ? "Cum să Oprești Durerea unei Despărțiri" : "Zero Despărțiri",
        subtitle: isMen ? "Accesează cartea ta" : "Relația ta de succes",
        slug: isMen ? "opreste-durerea-barbati" : "zero-despartiri",
        icon: "📚",
      };
    }
    if (location.includes("deschidejurnalul") || location.includes("jurnalredus")) {
      return {
        title: "Zero Despărțiri",
        subtitle: "Strategii avansate",
        slug: "zero-despartiri",
        icon: "📓",
      };
    }
    if (location.includes("doarcartea")) {
      return {
        title: "Zero Despărțiri",
        subtitle: "Cartea ta",
        slug: "zero-despartiri",
        icon: "📗",
      };
    }
    return {
      title: "Cartea Ta",
      subtitle: "Accesează acum",
      slug: isMen ? "opreste-durerea-barbati" : "opreste-durerea-femei",
      icon: "📖",
    };
  };

  const book = getBookInfo();

  const handleExtraDownload = async () => {
    setExtraDownloading(true);
    try {
      const contactEmail = localStorage.getItem("tvii_email") || "";
      const res = await fetch(`/api/download/${book.extra?.slug}?email=${encodeURIComponent(contactEmail)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        alert("Nu ai acces la acest fișier. Verifică emailul asociat achiziției.");
      }
    } catch (err) {
      alert("Eroare. Încearcă din nou.");
    } finally {
      setExtraDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="text-5xl mb-4">{book.icon}</div>
        <h1 className="text-3xl font-bold text-[#1b2d4f] mb-2 font-['Playfair_Display']">
          {book.title}
        </h1>
        <p className="text-[#64748b] mb-6">{book.subtitle}</p>

        <div className="bg-[#f8f4e8] border border-[#e8d9a0] rounded-xl p-6 mb-6">
          <p className="text-sm text-[#64748b] mb-4">
            Apasă butonul de mai jos ca să deschizi biblioteca ta — cărțile cumpărate se deschid direct în browser, oricând.
          </p>
          <button
            onClick={() => setLocation(libraryPath)}
            className="w-full bg-gradient-to-r from-[#1b2d4f] to-[#2d4a7a] text-white font-bold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-lg active:scale-[0.97]"
            style={{ transition: "all 160ms cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            ACCESEAZĂ ACUM CE AI CUMPĂRAT →
          </button>
          {book.extra && (
            <button
              onClick={handleExtraDownload}
              disabled={extraDownloading}
              className="w-full mt-3 bg-gradient-to-r from-[#7a1115] to-[#b91c1c] text-white font-bold py-3.5 px-6 rounded-full shadow hover:shadow-lg transition-all text-base disabled:opacity-50 active:scale-[0.97]"
              style={{ transition: "all 160ms cubic-bezier(0.23, 1, 0.32, 1)" }}
            >
              {extraDownloading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Se deschide...
                </span>
              ) : (
                "DESCHIDE MESAJELE EXTRA DE ÎMPĂCARE (PDF) →"
              )}
            </button>
          )}
        </div>

        <p className="text-xs text-[#94a3b8] mt-6">
          Probleme cu deschiderea? Scrie la <a href="mailto:anca@pestedespartire.ro" className="underline">anca@pestedespartire.ro</a>
        </p>
      </div>
    </div>
  );
}
