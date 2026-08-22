import { trpc } from "@/lib/trpc";
import { BookOpenCheck, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { SiteFooter } from "./RelatiiSiteFooter";
import "./relatii-original.css";

type LibraryItem = { id: number; productKey: string; status: "active" };

const PRODUCT_PLACEHOLDERS: Record<string, { title: string; description: string }> = {
  "dictionarul-femeilor": { title: "Dicționarul Femeilor", description: "Mockup PDF protejat. Fișierul final va apărea aici după încărcare." },
  "dictionarul-barbatilor": { title: "Dicționarul Bărbaților", description: "Mockup PDF protejat. Fișierul final va apărea aici după încărcare." },
  "conversatii-jucause": { title: "Pasul 1 · Atracție și vizibilitate", description: "Mockup PDF protejat. Fișierul final va apărea aici după încărcare." },
  friendzone: { title: "Pasul 2 · Direcție și intimitate", description: "Mockup PDF protejat. Fișierul final va apărea aici după încărcare." },
  "conexiune-incredere": { title: "Pasul 3 · Intimitate memorabilă", description: "Mockup PDF protejat. Fișierul final va apărea aici după încărcare." },
};

export default function RelatiiOriginalLibrary() {
  const [email, setEmail] = useState("");
  const [library, setLibrary] = useState<LibraryItem[] | null>(() => {
    try { return JSON.parse(sessionStorage.getItem("relatii-customer-library") || "null"); } catch { return null; }
  });
  const [customerEmail, setCustomerEmail] = useState(() => sessionStorage.getItem("relatii-customer-library-email") || "");
  const redeem = trpc.relatii.library.redeem.useMutation();
  const recovery = trpc.relatii.library.requestRecovery.useMutation();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token || redeem.isPending || library) return;
    redeem.mutate({ token }, { onSuccess: result => {
      if (!result) return;
      setLibrary(result.library as LibraryItem[]);
      setCustomerEmail(result.email);
      sessionStorage.setItem("relatii-customer-library", JSON.stringify(result.library));
      sessionStorage.setItem("relatii-customer-library-email", result.email);
      window.history.replaceState({}, "", "/oferte/relatii/biblioteca");
    } });
  }, [library, redeem]);

  const requestRecovery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    recovery.mutate({ email }, { onSuccess: () => setEmail("") });
  };
  const signOut = () => {
    sessionStorage.removeItem("relatii-customer-library");
    sessionStorage.removeItem("relatii-customer-library-email");
    setLibrary(null);
    setCustomerEmail("");
  };

  return <main className="library-page"><header className="site-header"><Link href="/oferte/relatii" className="brand-lockup"><span className="brand-mark" /><span>Dicționarul<br />Relațiilor</span></Link><span className="offer-progress">Biblioteca mea</span></header><section className="library-shell">{library ? <><div className="library-heading"><p className="eyebrow">Acces protejat</p><h1>Biblioteca ta</h1><p className="lead-copy">Ești conectat ca <strong>{customerEmail}</strong>. Produsele se afișează numai în această sesiune de browser.</p><button className="text-link" onClick={signOut}>Ieși din bibliotecă</button></div>{library.length ? <div className="library-grid">{library.map(item => { const product = PRODUCT_PLACEHOLDERS[item.productKey] ?? { title: item.productKey, description: "Material digital protejat." }; return <article className="library-card" key={item.id}><BookOpenCheck size={24} /><p className="eyebrow">Produs deținut</p><h2>{product.title}</h2><p>{product.description}</p><button className="primary-button" disabled>PDF disponibil după încărcare</button></article>; })}</div> : <div className="empty-library"><ShieldCheck size={28} /><h2>Nu găsim încă produse active în această bibliotecă.</h2><p>Drepturile de acces se vor acorda după confirmarea plății. Dacă ai cumpărat deja, cere un nou link de recuperare.</p></div>}</> : <div className="recovery-card"><KeyRound size={28} /><p className="eyebrow">Recuperează accesul</p><h1>Deschide biblioteca de pe orice dispozitiv.</h1><p className="lead-copy">Introdu e-mailul folosit la cumpărare. Vei primi un link securizat, cu durată limitată, iar linkul nu poate fi reutilizat după accesare.</p><form onSubmit={requestRecovery}><label>Adresa de e-mail<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="nume@exemplu.ro" /></label><button className="primary-button" type="submit" disabled={recovery.isPending}>{recovery.isPending ? "Pregătim accesul…" : "Trimite linkul securizat"}</button></form>{recovery.isSuccess && <p className="form-success"><MailCheck size={16} /> Dacă există o bibliotecă pentru această adresă, vei primi instrucțiunile de acces.</p>}{redeem.isError && <p className="form-error">Acest link nu mai este valabil. Cere unul nou.</p>}</div>}</section><SiteFooter /></main>;
}
