import { useLocation, useSearch } from "wouter";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import CoachingOnboarding from "@/components/CoachingOnboarding";
import { oneClickOrder, oneClickSuccessMessages } from "@/lib/shop";

/**
 * Biblioteca personala („Materiale Cumparate”).
 * - cartile cumparate se deschid direct in browser (PDF inline);
 * - achizitii 1-CLICK din dashboard (cardul salvat de la achizitia anterioara):
 *   mesaje extra / jurnal / coaching;
 * - cumparatorii de Susținere Personală au formularul de onboarding
 *   (povestea lor ajunge pe emailul Ancai).
 */
export default function Biblioteca() {
  const [location] = useLocation();
  const search = useSearch();
  const isMen = location.includes("/barbati/");
  const [state, setState] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [email, setEmail] = useState(() => localStorage.getItem("tvii_email") || "");
  const [emailError, setEmailError] = useState("");
  const [data, setData] = useState<{
    email: string; firstName: string | null; gender?: string | null;
    books: { slug: string; name: string; fileKey: string | null }[];
    hasCoaching: boolean; hasJournal: boolean; hasExtra: boolean;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [buyError, setBuyError] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    const t = new URLSearchParams(search).get("t") || "";
    try {
      const res = await fetch("/api/library/me" + (t ? "?t=" + encodeURIComponent(t) : ""), { credentials: "same-origin" });
      if (!res.ok) { setState("login"); return; }
      const d = await res.json();
      setData(d);
      setState("ready");
    } catch { setState("error"); }
  };

  useEffect(() => { load(); }, [search]);

  const login = async () => {
    const em = email.trim();
    if (!em.includes("@") || !em.includes(".")) { setEmailError("Introdu o adresa de email valida."); return; }
    setEmailError(""); setSending(true); setLinkSent(false);
    try {
      const res = await fetch("/api/library/link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, path: window.location.pathname }), credentials: "same-origin",
      });
      const d = await res.json();
      if (!res.ok) { setEmailError(d.error || "Nu am putut trimite linkul. Incearca din nou."); setSending(false); return; }
      localStorage.setItem("tvii_email", em);
      setSending(false);
      setLinkSent(true);
    } catch { setEmailError("Eroare de conexiune. Incearca din nou."); }
  };

  const logout = async () => {
    await fetch("/api/library/logout", { method: "POST", credentials: "same-origin" });
    setState("login");
  };

  /** 1-click: taxeaza cardul salvat; daca nu exista, ne duce la checkout Stripe. */
  const buy = async (productSlug: string) => {
    if (!data) return;
    setBuying(productSlug);
    setBuyError("");
    const r = await oneClickOrder({ productSlug, contactEmail: data.email });
    if (r.ok && r.oneClick) {
      setFlash(oneClickSuccessMessages[productSlug] || "Plata a fost confirmata.");
      setBuying(null);
      await load();
      return;
    }
    if (r.ok && r.url) {
      window.location.href = r.url;
      return;
    }
    setBuyError(r.ok ? "A aparut o eroare. Incearca din nou." : r.error);
    setBuying(null);
  };

  const buyerFemale = data ? (data.gender ? data.gender === "female" : !isMen) : !isMen;
  const cover = buyerFemale ? "/img/mesaje-extra/cover-femei.png" : "/img/mesaje-extra/cover-barbati.png";
  const mesajeSlug = buyerFemale ? "mesaje-extra-femei" : "mesaje-extra-barbati";
  const coachingSlug = buyerFemale ? "sustinere-femei" : "sustinere-barbati";

  return (
    <div className="qz-wrap" style={{ background: "#f0f3f8" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center font-bold tracking-widest text-sm mb-4" style={{ color: "#c9a44a" }}>✦ pestedespartire.ro</div>
        <h1 className="text-center text-[26px] sm:text-[30px] font-extrabold mb-2" style={{ color: "#1b2d4f" }}>
          Materiale Cumpărate
        </h1>
        <p className="text-center text-[#64748b] mb-6">Tot ce ai cumpărat — se deschide direct în browser, fără descărcare obligatorie.</p>

        {state === "loading" && (
          <div className="text-center py-10 text-[#64748b]">
            <span className="inline-block w-6 h-6 border-2 border-[#dde3ef] border-t-[#1b2d4f] rounded-full animate-spin" />
            <p className="mt-2 text-sm">Se deschid materialele tale...</p>
          </div>
        )}

        {state === "error" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-[#64748b]">
            A apărut o eroare. Reîncarcă pagina.
          </div>
        )}

        {state === "login" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-center font-bold text-[#1b2d4f] text-xl mb-2">Accesează-ți materialele cumpărate</h2>
            <p className="text-center text-sm text-[#64748b] mb-4">
              Fără parolă: introdu emailul cu care ai cumpărat și îți trimitem un link de acces personal
              (valabil 24 de ore, legat de dispozitivul tău — nu poate fi folosit de altcineva).
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              placeholder="adresa@email.com"
              className="w-full border border-[#cbd5e1] rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#1b2d4f]"
            />
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
            {linkSent ? (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-4 text-center">
                ✅ Ți-am trimis linkul pe <strong>{email.trim()}</strong>.<br />
                Deschide emailul și apasă butonul din el ca să intri (linkul e personal, valabil 24 de ore).
              </div>
            ) : (
              <button
                onClick={login}
                disabled={sending}
                className="w-full mt-4 bg-gradient-to-r from-[#1b2d4f] to-[#2d4a7a] text-white font-bold py-3.5 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-base disabled:opacity-60"
              >
                {sending ? "Se trimite..." : "Trimite-mi linkul de acces"}
              </button>
            )}
          </div>
        )}

        {state === "ready" && data && (
          <>
            <div className="flex justify-between items-center mb-5">
              <p className="text-sm text-[#64748b]">Bine ai revenit{data.firstName ? ", " + data.firstName : ""}!</p>
              <button onClick={logout} className="text-xs text-[#94a3b8] hover:text-[#1b2d4f] underline">Ieși</button>
            </div>

            <div className="bg-[#fffdf5] border border-[#e8d9a0] rounded-xl p-4 mb-6 text-sm text-[#33384a]">
              <p>
                Poți deschide materialele pe care le-ai cumpărat și din emailul pe care l-ai primit de la mine,
                pe adresa de pe care ai cumpărat — sau direct de aici, de pe dashboard.
              </p>
              <p className="mt-2">
                În viitor, când vrei să deschizi din nou cartea, deschide-o din linkul din email.
                O poți și descărca, dacă dorești.
              </p>
            </div>

            {flash && (
              <div className="bg-[#f0fdf4] border border-green-200 text-green-800 text-sm rounded-xl p-4 mb-6">
                ✅ {flash} Poți deschide noul material chiar mai jos. 👇
              </div>
            )}
            {buyError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6">
                {buyError}
              </div>
            )}

            {/* BOOKS */}
            {data.books.length > 0 ? (
              <div className="space-y-4">
                {data.books.map((b) => (
                  <div key={b.slug} className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
                    <div className="text-4xl">📖</div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1b2d4f]">{b.name}</p>
                      <p className="text-xs text-[#64748b]">PDF — se deschide direct în browser</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/library/token", { method: "POST", credentials: "same-origin" });
                          if (res.ok) {
                            const d = await res.json();
                            if (d && d.token) {
                              window.open("/api/download/" + b.slug + "?t=" + encodeURIComponent(d.token), "_blank", "noopener");
                              return;
                            }
                          }
                          // Fallback: cookie
                          window.open("/api/download/" + b.slug, "_blank", "noopener");
                        } catch {
                          setEmailError("Nu am putut deschide materialul. Reîncearcă.");
                        }
                      }}
                      className="bg-gradient-to-r from-[#1b2d4f] to-[#2d4a7a] text-white font-bold py-2.5 px-4 rounded-full text-sm whitespace-nowrap shadow hover:shadow-lg transition-all cursor-pointer"
                    >
                      DESCHIDE CARTEA PDF
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-[#64748b]">Nu ai încă nicio carte în bibliotecă.</div>
            )}

            {/* FORMULAR ONBOARDING — doar pentru cumpărătorii de Susținere Personală */}
            {data.hasCoaching && (
              <div className="mt-6">
                <CoachingOnboarding
                  email={data.email}
                  firstName={data.firstName}
                  gender={buyerFemale ? "female" : "male"}
                />
              </div>
            )}

            {/* OFERTE 1-CLICK — pentru produsele pe care nu le-au cumpărat încă */}
            {(!data.hasJournal || !data.hasCoaching || !data.hasExtra) && (
              <div className="mt-8 mb-2">
                <h2 className="text-[#1b2d4f] font-extrabold text-lg">Oferte speciale, doar pentru tine</h2>
                <p className="text-xs text-[#64748b] mt-0.5 mb-4">
                  Cumpără cu 1 CLICK — plata se face automat pe cardul folosit la ultima achiziție, fără să completezi nimic.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {!data.hasJournal && (
                <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
                  <div className="text-4xl">📓</div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1b2d4f]">Zero Despărțiri</p>
                    <p className="text-xs text-[#64748b]">Tacticile interzise — capitolele pe care le-am scos din Cum să Oprești Durerea unei Despărțiri pentru că erau prea puternice. Pentru tine, după achiziție: <strong className="text-[#b91c1c]">39,95 lei</strong> în loc de 100 lei — o singură plată.</p>
                  </div>
                  <button
                    type="button"
                    disabled={buying !== null}
                    onClick={() => buy("zero-despartiri")}
                    className="bg-gradient-to-r from-[#b91c1c] to-[#e11d2a] text-white font-bold py-2.5 px-4 rounded-full text-sm whitespace-nowrap shadow hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 text-center"
                  >
                    {buying === "zero-despartiri"
                      ? "Se procesează..."
                      : "CUMPĂRĂ CU 1 CLICK — " + "39,95 lei"}
                  </button>
                </div>
              )}
              {!data.hasCoaching && (
                <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
                  <div className="text-4xl">💬</div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1b2d4f]">Susținere Personală</p>
                    <p className="text-xs text-[#64748b]">Îți spun exact ce să faci și ce să spui, pentru situația ta. 97 lei/lună — anulezi oricând printr-un email la anca@pestedespartire.ro.</p>
                  </div>
                  <button
                    type="button"
                    disabled={buying !== null}
                    onClick={() => buy(coachingSlug)}
                    className="bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-bold py-2.5 px-4 rounded-full text-sm whitespace-nowrap shadow hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 text-center"
                  >
                    {buying === coachingSlug ? "Se procesează..." : "ÎNCEPE CU 1 CLICK — 97 lei/lună"}
                  </button>
                </div>
              )}
              {!data.hasExtra && (
                <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
                  <img src={cover} alt="Mesajele EXTRA de Împăcare" className="w-16 h-24 object-cover rounded-md shadow" />
                  <div className="flex-1">
                    <p className="font-bold text-[#1b2d4f]">Mesajele EXTRA de Împăcare</p>
                    <p className="text-xs text-[#64748b]">Mai multe mesaje gata scrise, care îi inundă mintea și inima cu hormonul iubirii. Doar 19,95 lei — o singură plată.</p>
                  </div>
                  <button
                    type="button"
                    disabled={buying !== null}
                    onClick={() => buy(mesajeSlug)}
                    className="bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-bold py-2.5 px-4 rounded-full text-sm whitespace-nowrap shadow hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 text-center"
                  >
                    {buying === mesajeSlug ? "Se procesează..." : "CUMPĂRĂ CU 1 CLICK — 19,95 lei"}
                  </button>
                </div>
              )}
            </div>

            <footer className="border-t border-[#dde3ef] pt-6 mt-10 text-center text-xs text-[#94a3b8] space-x-3">
              <Link href="/termeni" className="hover:text-[#1b2d4f]">Termeni și Condiții</Link>
              <Link href="/privacy" className="hover:text-[#1b2d4f]">Politica de Confidențialitate</Link>
              <Link href="/rambursare" className="hover:text-[#1b2d4f]">Politica de Rambursare</Link>
              <Link href="/contact" className="hover:text-[#1b2d4f]">Contact</Link>
              <Link href="/affiliate/register" className="hover:text-[#1b2d4f]">Afiliere</Link>
              <p className="mt-3">© 2026 Peste Despărțire</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
