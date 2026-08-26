import React from "react";
import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="site-footer legal-footer">
      <div className="footer-primary">
        <Link href="/relatii">Dicționarul Relațiilor</Link>
        <Link href="/relatii/afiliere">Afiliere</Link>
        <Link href="/relatii/biblioteca">Biblioteca mea</Link>
      </div>
      <div className="footer-legal">
        <Link href="/relatii/legal/confidentialitate">Politica de confidențialitate</Link>
        <Link href="/relatii/legal/termeni">Termeni și condiții</Link>
        <Link href="/relatii/legal/rambursari">Politica de rambursare</Link>
        <Link href="/relatii/legal/contact">Contact</Link>
      </div>
      <p className="company-placeholder"><strong>Date firmă:</strong> [Denumire firmă] · [CUI] · [Nr. Reg. Com.] · [Sediu social] · [E-mail suport]</p>
      <span>© {new Date().getFullYear()} Dicționarul Relațiilor</span>
    </footer>
  );
}
