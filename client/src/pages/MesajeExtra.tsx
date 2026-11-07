import { useLocation, Link } from "wouter";
import { useState } from "react";
import { oneClickOrder } from "@/lib/shop";

/**
 * Pagina dedicata Mesajelor EXTRA de Impacare (achizitie separata, 19,95 lei).
 * Nu contine nicio referire la Biblia Impacarii — este produsul sau pagina.
 */
export default function MesajeExtra() {
  const [location, setLocation] = useLocation();
  const isMen = !location.includes("/femei");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cover = isMen ? "/img/mesaje-extra/cover-barbati.png" : "/img/mesaje-extra/cover-femei.png";
  const slug = isMen ? "mesaje-extra-barbati" : "mesaje-extra-femei";
  const P = isMen ? "ea" : "el";
  const Pei = isMen ? "ei" : "lui";
  const checkoutPath = (isMen ? "/barbati/checkout" : "/femei/checkout") + "?product=mesaje";
  const thanksPath = isMen ? "/barbati/multumesc" : "/femei/multumesc";

  const t = isMen
    ? { bg: "#ffffff", fg: "#1a1a2e", card: "#ffffff", border: "#e2e8f0", red: "#c8102e", muted: "#64748b", cta: "from-[#c8102e] to-[#a50d23]" }
    : { bg: "#f0f3f8", fg: "#1a1a2e", card: "#ffffff", border: "#e8d9a0", red: "#cc0000", muted: "#64748b", cta: "from-[#b8860b] to-[#c9a44a]" };

  const buy = async () => {
    setBusy(true);
    setError("");
    const email = (localStorage.getItem("tvii_email") || "").trim();
    // Fara email cunoscut -> checkout normal (introduci emailul + cardul acolo).
    if (!email || !email.includes("@")) {
      setLocation(checkoutPath);
      return;
    }
    const r = await oneClickOrder({ productSlug: slug, contactEmail: email });
    if (r.ok && r.oneClick) {
      setLocation(thanksPath);
      return;
    }
    if (r.ok && r.url) {
      window.location.href = r.url;
      return;
    }
    setError(r.ok ? "A apărut o eroare. Încearcă din nou sau folosește butonul de mai jos." : r.error);
    setBusy(false);
  };

  return (
    <div className="qz-wrap" style={{ background: t.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-[17px] leading-relaxed" style={{ color: t.fg }}>
        <div className="text-center font-bold tracking-widest text-sm mb-3" style={{ color: t.muted }}>✦ pestedespartire.ro</div>

        <div className="text-center text-[13px] font-bold text-white bg-[#7a1115] border border-[#c8102e] rounded-md px-4 py-2 mb-5">
          PDF IMEDIAT PE EMAIL — MESAJE GATA SCRISE, PENTRU ÎMPĂCARE
        </div>

        <h1 className="text-center text-[26px] sm:text-[31px] font-extrabold leading-tight mb-4" style={{ color: t.red }}>
          Mesaje care Îi Inundă Creierul {P.toUpperCase()} Cu „Hormonul Iubirii” — Gata Scrise, Doar Le Copiezi Și Le Trimiți
        </h1>
        <p className="text-center text-sm mb-2" style={{ color: t.muted }}>(19,95 lei — o singură plată, PDF livrat instant pe email)</p>

        <img src={cover} alt="Mesajele EXTRA de Împăcare" className="block w-full max-w-[300px] mx-auto my-6 rounded-lg shadow-lg" />
        <p className="text-center text-sm mb-6" style={{ color: t.muted }}>Mesajele EXTRA de Împăcare — de Cristina Munteanu</p>

        <div className="space-y-4">
          <p>Știu exact cum e: ai primit deja mesaje de împăcare, ți-au plăcut, dar după câteva zile simți că ai nevoie de mai mult — de mai multe cuvinte care o fac pe {P} să se gândească la tine, să răspundă, să se apropie din nou.</p>
          <p>De aceea am scris <strong>Mesajele EXTRA de Împăcare</strong>: un set de mesaje noi, gata scrise, pe care le trimiți exact așa cum sunt — sau le modifici tu, după stilul vostru.</p>
          <p>Fiecare mesaj e construit să-i vorbească direct <strong>„hormonului iubirii”</strong> din creierul {Pei} — nu rațiunii care îi spune să stea departe. Cu cât răspunde pozitiv la mai multe mesaje de acest gen, cu atât ești mai aproape de împăcare.</p>
        </div>

        <div className="rounded-xl p-5 my-6 border" style={{ background: t.card, borderColor: t.border }}>
          <p className="font-bold mb-3" style={{ color: t.red }}>Ce primești:</p>
          <ul className="list-disc pl-6 space-y-2 text-[16px]" style={{ marginLeft: 4 }}>
            <li>Zeci de mesaje noi, gata scrise — le copiezi și le trimiți azi, nu peste o săptămână;</li>
            <li>Mesaje pentru momente diferite: după o ceartă, după tăcere, când simți că se răcește, când vrei să te caute {P} primul/prima;</li>
            <li>Formulări care o scot din poziția de „nu vreau să discut” și o fac să îți răspundă;</li>
            <li>PDF-ul se deschide direct în browser, pe orice telefon, tabletă sau PC — fără descărcare obligatorie.</li>
          </ul>
        </div>

        <p className="font-semibold">Cum funcționează:</p>
        <ol className="list-decimal pl-6 space-y-2 my-4 text-[16px]">
          <li>Comanzi acum — 19,95 lei, o singură plată;</li>
          <li>Primești PDF-ul instant pe emailul tău și îl găsești și în „Materialele Cumpărate”, de pe site;</li>
          <li>Deschizi, copiezi mesajul potrivit momentului și îl trimiți.</li>
        </ol>

        {/* Garanție 30 de zile */}
        <div className="text-center my-6">
          <div className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 mx-auto mb-3" style={{ borderColor: t.red, background: t.card }}>
            <span className="text-[28px] font-extrabold leading-none">30</span>
            <span className="text-[10px] font-bold tracking-wide">DE ZILE</span>
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: t.red }}>GARANȚIE</span>
          </div>
          <p className="text-sm" style={{ color: t.muted }}>
            Garanție 30 de zile. Dacă nu ești mulțumit{isMen ? "" : "ă"}, scrie-mi la <a href="mailto:anca@pestedespartire.ro" className="underline">anca@pestedespartire.ro</a> și primești fiecare ban înapoi.
          </p>
        </div>

        {/* Oferta */}
        <div className="rounded-xl p-6 my-6 text-center border-2" style={{ background: t.card, borderColor: t.red }}>
          <p className="mb-2 text-[15px]" style={{ color: t.muted }}>Toate mesajele EXTRA de Împăcare, pentru o singură plată:</p>
          <div className="text-[44px] font-extrabold leading-none mb-3" style={{ color: t.red }}>19,95 <span className="text-2xl">lei</span></div>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>}
          <button
            onClick={buy}
            disabled={busy}
            className={"w-full max-w-md mx-auto block text-center bg-gradient-to-r " + t.cta + " text-white font-extrabold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] uppercase tracking-wide"}
          >
            {busy ? "Se procesează..." : "CUMPĂRĂ ACUM — 19,95 lei →"}
          </button>
          <p className="text-xs mt-3" style={{ color: t.muted }}>
            Dacă ai mai cumpărat de la noi, plata se face cu cardul salvat, fără să completezi nimic. Altfel vei fi dus{isMen ? "" : "ă"} la finalizarea plății.
          </p>
        </div>

        <p className="text-sm" style={{ color: t.muted }}>Dacă preferi să nu plătești acum, poți reveni oricând din „Materialele Cumpărate”, unde această ofertă rămâne disponibilă în contul tău.</p>

        <footer className="border-t pt-6 mt-8 text-center text-xs space-x-3" style={{ borderColor: t.border, color: t.muted }}>
          <Link href="/termeni" className="hover:underline">Termeni și Condiții</Link>
          <Link href="/privacy" className="hover:underline">Politica de Confidențialitate</Link>
          <Link href="/rambursare" className="hover:underline">Politica de Rambursare</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/affiliate/register" className="hover:underline">Afiliere</Link>
          <p className="mt-3">© 2026 Peste Despărțire</p>
        </footer>
      </div>
    </div>
  );
}
