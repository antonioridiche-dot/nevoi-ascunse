import { ArrowRight, Check, CircleCheck, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import "./tarot-original.css";

const steps = {
  numerology: { eyebrow: "Pasul următor", title: "Numerologie personală", lead: "Adaugă o sinteză simbolică bazată pe numele și data deja oferite.", includes: ["o sinteză a numerelor personale", "teme și ritmuri de reflecție", "livrare cu ghidul tarot"], next: "/tarot/aproapegata", price: "47 lei" },
  portrait: { eyebrow: "Aproape gata", title: "Portret simbolic", lead: "Adaugă un portret creat cu AI, inspirat de contextul ales și de ghidul tău.", includes: ["o schiță simbolică pregătită cu AI", "teme relaționale pentru reflecție", "livrare cu ghidul tarot"], next: "/tarot/stai", price: "47 lei" },
  palm: { eyebrow: "Stai puțin", title: "Ghid pentru palmă", lead: "Poți adăuga și o sinteză simbolică a palmei. După plată, încarci sau fotografiezi palma în spațiul tău privat.", includes: ["încărcare sau fotografie din telefon", "sinteză simbolică a marcajelor observate", "livrare împreună cu ghidul"], next: "/tarot/multumesc", price: "47 lei" },
} as const;
type ProductCode = keyof typeof steps;

export function TarotOriginalPostPurchase({ productCode }: { productCode: ProductCode }) {
  const [, setLocation] = useLocation(); const token = new URLSearchParams(window.location.search).get("order") ?? ""; const decideOffer = trpc.tarot.decideOffer.useMutation(); const [error, setError] = useState(""); const step = steps[productCode]; const continueToNext = () => setLocation(`${step.next}?order=${encodeURIComponent(token)}`);
  async function decide(accepted: boolean) { if (token.length < 32) return setLocation("/tarot"); setError(""); try { const result = await decideOffer.mutateAsync({ publicToken: token, productKey: productCode, accepted }); if (result.status === "checkout_required") { setError("Banca are nevoie de o confirmare suplimentară pentru acest pas. Cardul nu a fost taxat; poți reveni mai târziu din dashboard."); return; } continueToNext(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Nu am putut salva alegerea. Încearcă din nou."); } }
  if (token.length < 32) return <main className="post-purchase"><section className="post-missing"><h1>Lipsește comanda</h1><button className="gold-button" onClick={() => setLocation("/tarot")}>Înapoi la Mara Tarot</button></section></main>;
  return <main className="post-purchase"><section className="post-card view-enter"><p className="eyebrow">{step.eyebrow} · opțional</p><span className="post-sigil"><Sparkles size={22} /></span><h1>{step.title} <em>· {step.price}</em></h1><p className="post-lead">{step.lead}</p><div className="post-includes"><p>Ce se adaugă</p>{step.includes.map(item => <span key={item}><Check size={16} />{item}</span>)}</div><aside><ShieldCheck size={17} /><p>Butonul de mai jos confirmă explicit adăugarea de <b>{step.price}</b> pe cardul folosit anterior. Dacă banca solicită o verificare suplimentară, nu procesăm plata fără confirmarea ta.</p></aside>{error && <p className="form-error">{error}</p>}<div className="post-actions"><button className="back-button" disabled={decideOffer.isPending} onClick={() => decide(false)}>Nu acum, continuă <ArrowRight size={16} /></button><button className="gold-button" disabled={decideOffer.isPending} onClick={() => decide(true)}>{decideOffer.isPending ? "Se confirmă…" : `Da, adaugă pentru ${step.price}`} <ArrowRight size={18} /></button></div></section></main>;
}

export function TarotOriginalThankYou() {
  const [, setLocation] = useLocation(); const token = new URLSearchParams(window.location.search).get("order") ?? "";
  if (token.length < 32) return <main className="post-purchase"><section className="post-missing"><h1>Lipsește comanda</h1><button className="gold-button" onClick={() => setLocation("/tarot")}>Înapoi la Mara Tarot</button></section></main>;
  return <main className="post-purchase"><section className="post-card thanks-final view-enter"><CircleCheck size={32} /><p className="eyebrow">Comanda este confirmată</p><h1>Ai ajuns la <em>final.</em></h1><p className="post-lead">În dashboard vezi ghidul tarot și fiecare produs adăugat. Accesul rămâne pe acest dispozitiv; pentru un dispozitiv nou, folosești linkul privat trimis la email.</p><button className="gold-button" onClick={() => setLocation("/tarot/dashboard")}>Deschide dashboardul <ArrowRight size={18} /></button></section></main>;
}
