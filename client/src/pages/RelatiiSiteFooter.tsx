import React from "react";
import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="site-footer legal-footer">
      <div className="footer-primary">
        <Link href="/oferte/relatii">Dicționarul Relațiilor</Link>
        <Link href="/oferte/relatii/afiliere">Afiliere</Link>
        <Link href="/oferte/relatii/biblioteca">Biblioteca mea</Link>
      </div>
      <div className="footer-legal">
        <Link href="/oferte/relatii/legal/confidentialitate">Politica de confidențialitate</Link>
        <Link href="/oferte/relatii/legal/termeni">Termeni și condiții</Link>
        <Link href="/oferte/relatii/legal/rambursari">Politica de rambursare</Link>
        <Link href="/oferte/relatii/legal/contact">Contact</Link>
      </div>
      <p className="company-placeholder"><strong>Date firmă:</strong> [Denumire firmă] · [CUI] · [Nr. Reg. Com.] · [Sediu social] · [E-mail suport]</p>
      <span>© {new Date().getFullYear()} Dicționarul Relațiilor</span>
    </footer>
  );
}
