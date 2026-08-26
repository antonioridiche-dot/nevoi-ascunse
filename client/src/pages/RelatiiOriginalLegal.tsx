import { Link } from "wouter";
import { SiteFooter } from "./RelatiiSiteFooter";
import "./relatii-original.css";

const LEGAL_COPY = {
  confidentialitate: { title: "Politica de confidențialitate", body: "Acest document va descrie în detaliu categoriile de date prelucrate, temeiurile legale, perioada de păstrare, drepturile persoanelor vizate și datele de contact ale operatorului. Completează datele firmei înainte de publicarea comercială." },
  termeni: { title: "Termeni și condiții", body: "Acest document va stabili condițiile de utilizare a site-ului, regulile de acces la produsele digitale, prețurile, condițiile de plată și limitările materialelor educaționale. Completează datele firmei și verifică documentul cu un profesionist înainte de publicare." },
  rambursari: { title: "Politica de rambursare", body: "Acest document va preciza condițiile aplicabile rambursărilor pentru produse digitale și servicii de coaching. Completează politica finală în acord cu modelul tău comercial și cu legislația aplicabilă înainte de publicare." },
  contact: { title: "Contact", body: "Pentru suport, înlocuiește acest placeholder cu e-mailul, telefonul, adresa și datele complete ale firmei. Poți afișa și un termen orientativ de răspuns pentru solicitările clienților." },
} as const;

export default function RelatiiOriginalLegal({ page }: { page: keyof typeof LEGAL_COPY }) {
  const content = LEGAL_COPY[page];
  return <main className="legal-page"><header className="site-header"><Link href="/relatii" className="brand-lockup"><span className="brand-mark" /><span>Dicționarul<br />Relațiilor</span></Link></header><section className="legal-shell"><p className="eyebrow">Document juridic — placeholder</p><h1>{content.title}</h1><p className="lead-copy">{content.body}</p><div className="legal-company-card"><p><strong>Operator:</strong> [Denumire firmă]</p><p><strong>CUI:</strong> [CUI] · <strong>Registrul Comerțului:</strong> [Nr. Reg. Com.]</p><p><strong>Sediu:</strong> [Adresă completă] · <strong>Suport:</strong> [E-mail suport]</p></div><p className="legal-note">Acesta este un placeholder operațional, nu consultanță juridică. Înlocuiește toate câmpurile între paranteze înainte de lansare.</p></section><SiteFooter /></main>;
}
