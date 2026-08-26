import { Link } from "wouter";
import "./pbc-checkout.css";

export default function PbcLegalUnavailable() {
  return <main className="pbc-checkout-shell"><header className="pbc-checkout-header"><Link href="/prieteni-cu-beneficii" className="pbc-checkout-brand"><span>Prieteni</span> Cu Beneficii</Link></header><section className="pbc-checkout-content"><div className="pbc-checkout-intro"><p>DOCUMENT SURSĂ INDISPONIBIL</p><h1>Pagina legală nu poate fi afișată încă.</h1><p>Checkout-ul sursă trimite către acest document, însă fișierul legal nu este prezent în repository-ul disponibil. Nu afișăm o versiune rescrisă sau generică.</p><Link href="/prieteni-cu-beneficii" className="pbc-checkout-submit">ÎNAPOI LA OFERTĂ</Link></div></section></main>;
}
