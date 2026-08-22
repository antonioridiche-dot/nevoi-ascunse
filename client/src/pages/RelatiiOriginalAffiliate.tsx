import { trpc } from "@/lib/trpc";
import { ArrowRight, BarChart3, Link2, Percent, Users } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { SiteFooter } from "./RelatiiSiteFooter";
import "./relatii-original.css";

export default function RelatiiOriginalAffiliate() {
  const [mode, setMode] = useState<"signup" | "dashboard">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [authenticatedCode, setAuthenticatedCode] = useState("");
  const signup = trpc.relatii.affiliate.signup.useMutation();
  const login = trpc.relatii.affiliate.login.useQuery({ code: authenticatedCode, password }, { enabled: authenticatedCode.length > 0 && password.length >= 8 });
  const stats = trpc.relatii.affiliate.dashboard.useQuery({ code: authenticatedCode }, { enabled: Boolean(login.data?.code) });
  useEffect(() => { const savedCode = localStorage.getItem("relatii-affiliate-dashboard-code"); if (savedCode) setCode(savedCode); }, []);
  const referralLink = useMemo(() => authenticatedCode ? `${window.location.origin}/oferte/relatii?ref=${authenticatedCode}` : "", [authenticatedCode]);
  const onSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await signup.mutateAsync(form);
      setCode(result.code); setAuthenticatedCode(result.code); setPassword(form.password); localStorage.setItem("relatii-affiliate-dashboard-code", result.code); setMode("dashboard"); toast.success("Contul de afiliat a fost creat și autentificat.");
    } catch { toast.error("Nu am putut crea contul. Verifică datele și încearcă din nou."); }
  };
  const openDashboard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const normalized = code.trim().toUpperCase();
    if (!normalized || password.length < 8) { toast.error("Introdu codul și parola de minimum 8 caractere."); return; }
    setAuthenticatedCode(normalized); localStorage.setItem("relatii-affiliate-dashboard-code", normalized);
  };
  return <main className="offer-page affiliate-page"><header className="site-header"><Link href="/oferte/relatii" className="brand-lockup"><span className="brand-mark" /><span>Dicționarul<br />Relațiilor</span></Link><Link href="/oferte/relatii" className="offer-progress">Înapoi la site</Link></header><section className="affiliate-shell"><p className="eyebrow">Programul de afiliere</p><h1>Recomandă ce<br /><em>merită transmis.</em></h1><p className="lead-copy">Primești 50% din valoarea produselor principale și a upsell-urilor atribuite linkului tău. Pentru coaching recurent, comisionul este 50% în prima lună și 0% în lunile următoare.</p><div className="affiliate-promise"><div><Percent size={18} /><strong>50%</strong><span>Produse și upsell-uri</span></div><div><Users size={18} /><strong>50% / 0%</strong><span>Coaching: prima lună / ulterior</span></div><div><Link2 size={18} /><strong>1 link</strong><span>Tracking prin recomandare</span></div></div><div className="affiliate-card"><div className="affiliate-tabs"><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Înscriere</button><button className={mode === "dashboard" ? "active" : ""} onClick={() => setMode("dashboard")}>Dashboard</button></div>{mode === "signup" ? <form onSubmit={onSignup} className="affiliate-form"><h2>Începe ca afiliat</h2><label>Nume și prenume<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Numele tău" /></label><label>Adresă de e-mail<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="nume@exemplu.ro" /></label><label>Parolă<input required minLength={8} type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Minimum 8 caractere" /></label><button className="primary-button" type="submit" disabled={signup.isPending}>{signup.isPending ? "Creăm contul…" : "Creează contul de afiliat"}<ArrowRight size={17} /></button></form> : <form onSubmit={openDashboard} className="affiliate-form"><h2>Accesează dashboard-ul</h2><label>Codul tău de afiliat<input required value={code} onChange={event => setCode(event.target.value)} placeholder="AF-XXXXXXXX" /></label><label>Parola<input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Parola contului" /></label><button className="primary-button" type="submit">Vezi rezultatele <ArrowRight size={17} /></button>{login.isLoading && <p className="affiliate-muted">Verificăm accesul…</p>}{login.isError && <p className="affiliate-error">Codul sau parola nu sunt corecte.</p>}{stats.isLoading && login.data && <p className="affiliate-muted">Încărcăm datele…</p>}{stats.data && <><div className="affiliate-stats"><div><BarChart3 size={16} /><strong>{stats.data.clicks}</strong><span>click-uri</span></div><div><Users size={16} /><strong>{stats.data.orders}</strong><span>comenzi</span></div><div><Percent size={16} /><strong>{stats.data.commissionRon} RON</strong><span>comision acumulat</span></div></div><div className="affiliate-link"><span>Linkul tău</span><code>{referralLink}</code></div><div className="affiliate-link"><span>Defalcare comision</span><p>Produse: {stats.data.commissions.productsRon} RON · Pași: {stats.data.commissions.stepsRon} RON · Coaching: {stats.data.commissions.coachingRon} RON</p></div><div className="affiliate-link"><span>Tranzacții eligibile recente</span>{stats.data.transactions.length ? stats.data.transactions.map(item => <p key={item.id}>{item.category} · {item.label} · {item.amountRon} RON <strong>+{item.commissionRon} RON</strong></p>) : <p>Nu există încă tranzacții atribuite linkului tău.</p>}</div></>}</form>}</div></section><SiteFooter /></main>;
}
