import { BOOKS } from "@/flows/relatiiFunnelSource";
import { ArrowRight, BookOpenText, MoveDown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { SiteFooter } from "./RelatiiSiteFooter";
import "./relatii-original.css";

function ReferralTracker() {
  const track = trpc.relatii.affiliate.track.useMutation();
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) return;
    localStorage.setItem("affiliate-code", ref);
    track.mutate({ code: ref, path: window.location.pathname });
  }, []);
  return null;
}

export default function Home() {
  return (
    <><ReferralTracker /><main className="home-page">
      <header className="site-header">
        <a href="#alege" className="brand-lockup"><span className="brand-mark" aria-hidden="true" /><span>Dicționarul<br />Relațiilor</span></a>
        <a className="header-cta" href="#alege">Alege traseul <MoveDown size={15} /></a>
      </header>
      <section className="home-hero"><div className="hero-micro"><Sparkles size={14} /> Un spațiu pentru conversații mai clare</div><div className="hero-main"><p className="eyebrow">Înainte de sfaturi. Înainte de scenarii.</p><h1>Înțelege mai bine<br /><em>ce se întâmplă între voi.</em></h1><p className="lead-copy">Două volume digitale pentru oamenii care preferă dialogul în locul ghicitului și respectul în locul jocurilor de putere.</p></div><div className="hero-aside"><span>01 — Alege</span><span>02 — Citește</span><span>03 — Vorbește</span></div></section>
      <section id="alege" className="choose-section"><div className="choose-header"><div><p className="eyebrow">Începe aici</p><h2>Pentru cine vrei să ai mai multă claritate?</h2></div><p>Nu alegi un rol. Alegi întrebările care te preocupă acum.</p></div><div className="choice-grid"><Link href={BOOKS.barbati.route} className="choice-card petrol"><div className="choice-card-copy"><p className="eyebrow">Sunt bărbat</p><h3>Vreau să înțeleg mai bine femeile.</h3><span>Descoperă Dicționarul Femeilor <ArrowRight size={18} /></span></div><div className="choice-book"><img src={BOOKS.barbati.image} alt="Coperta Dicționarul Femeilor" /></div></Link><Link href={BOOKS.femei.route} className="choice-card terracotta"><div className="choice-card-copy"><p className="eyebrow">Sunt femeie</p><h3>Vreau să înțeleg mai bine bărbații.</h3><span>Descoperă Dicționarul Bărbaților <ArrowRight size={18} /></span></div><div className="choice-book"><img src={BOOKS.femei.image} alt="Coperta Dicționarul Bărbaților" /></div></Link></div></section>
      <section className="manifesto-section"><div className="manifesto-symbol"><BookOpenText size={28} /></div><div><p className="eyebrow">O bibliotecă practică</p><h2>Relațiile nu au nevoie de formule magice. Au nevoie de cuvinte mai bune, întrebări mai bune și limite pe care le poți spune fără să te ascunzi.</h2></div></section>
      <section className="home-note"><p>Materialele sunt educaționale și încurajează comunicarea responsabilă, acordul și respectul reciproc. Nu înlocuiesc sprijinul profesionist atunci când ai nevoie de el.</p></section>
      <SiteFooter />
    </main></>
  );
}
