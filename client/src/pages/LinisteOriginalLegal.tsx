import { Link } from "wouter";
import "./liniste-original.css";
import "./liniste-footer-legal.css";

export default function LinisteOriginalLegal({ type }: { type: "terms" | "privacy" }) {
  const terms = type === "terms";
  return <main className="liniste-legal confirmation-page"><header className="confirmation-header"><Link className="wordmark" href="/liniste-audio"><span className="wordmark-mark">l</span> liniște</Link></header><section className="confirmation-hero"><p className="eyebrow">INFORMAȚII LEGALE</p><h1>{terms ? "Termeni și condiții" : "Politica de confidențialitate"}</h1><p>{terms ? "Prin cumpărare primești acces digital la audio-urile selectate. Plata este unică, iar conținutul este un instrument de sprijin, nu tratament medical." : "Folosim emailul pentru accesul la comandă și, numai dacă alegi explicit ulterior, pentru comunicări de marketing. Nu expunem emailul în linkurile de navigare."}</p><p>Detaliile complete ale operatorului și politica de retur trebuie completate de proprietarul site-ului înainte de folosirea plăților live.</p></section></main>;
}
