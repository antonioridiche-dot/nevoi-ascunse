import { FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useLocation } from "wouter";

function normalizeCheckoutEmail(value: string) {
  const email = value.trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : "";
}

export default function FamilyOriginalQuiz() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("familie");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeCheckoutEmail(email);
    if (!normalized) {
      setError("Introdu o adresă de e-mail validă.");
      return;
    }
    const product = goal === "continuitate" ? "field-continuity-protocol" : goal === "calatorie" ? "72-hour-decision-card-pack" : "last-mile-72-hour-readiness-plan";
    setLocation(`/familieprotejata?email=${encodeURIComponent(normalized)}&quiz=${goal}&product=${product}&offer=promo67#secure-order`);
  };
  return <main className="site-shell simple-page"><section className="simple-card"><p className="eyebrow">BRIEFING RAPID / 01</p><h1>Construiește-ți planul de pregătire.</h1><p>Răspunde la două întrebări. Îți păstrăm e-mailul și îl precompletăm la adăugarea în coș și la checkout.</p><form onSubmit={submit} className="space-y-4"><label className="form-label"><span>CARE ESTE PRIORITATEA TA?</span><select value={goal} onChange={event => setGoal(event.target.value)}><option value="familie">Familia și locuința</option><option value="calatorie">Călătorii și deplasări</option><option value="continuitate">Continuitatea muncii</option></select></label><label className="form-label"><span>E-MAIL</span><input type="email" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} autoComplete="email" inputMode="email" placeholder="tu@exemplu.ro" />{error && <small className="form-error" role="alert">{error}</small>}</label><button className="primary-cta w-full" type="submit">VEZI PLANUL POTRIVIT <ArrowRight size={18} /></button></form><div className="compact-proof"><Check size={17} /> Nu îți cerem parolă și nu pierdem e-mailul pe parcurs.</div></section></main>;
}
