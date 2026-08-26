import { ArrowUpRight, CheckCircle2, HeartHandshake } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { SiteFooter } from "./RelatiiSiteFooter";
import "./relatii-original.css";

export default function RelatiiOriginalThankYou() {
  const [isApplied, setIsApplied] = useState(false);
  const application = trpc.relatii.coaching.submit.useMutation({
    onSuccess: () => {
      setIsApplied(true);
      toast.success("Aplicația ta a fost trimisă.");
    },
    onError: () => toast.error("Aplicația nu a putut fi trimisă. Încearcă din nou."),
  });
  const onApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    application.mutate({ name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), context: String(form.get("context") ?? "") });
  };

  return (
    <main className="thank-you-page">
      <header className="site-header"><Link href="/relatii" className="brand-lockup"><span className="brand-mark" /><span>Dicționarul<br />Relațiilor</span></Link></header>
      <section className="thank-you-hero"><CheckCircle2 size={40} /><p className="eyebrow">Mulțumesc</p><h1>Ai ales să intri în conversație <em>mai pregătit.</em></h1><p className="lead-copy">După confirmarea plății, îți poți accesa produsele din biblioteca personală. Până atunci, păstrează o idee simplă aproape: claritatea se construiește în dialog, nu în presupuneri.</p><Link href="/relatii/biblioteca" className="primary-button">Deschide biblioteca mea</Link></section>
      <section className="coaching-section"><div className="coaching-icon"><HeartHandshake size={30} /></div><div><p className="eyebrow">Pasul următor, dacă îl vrei</p><h2>Aplică pentru coaching relațional.</h2><p>O conversație 1:1 pentru a pune ordine în contextul tău, a formula o direcție și a decide ce întrebare merită spusă cu voce tare.</p></div></section>
      <section className="coaching-form-shell">{isApplied ? <div className="coaching-success"><CheckCircle2 size={28} /><h2>Mulțumesc. Am primit aplicația ta.</h2><p>Vei fi contactat(ă) la adresa de e-mail lăsată în formular, după ce cererea este revizuită.</p></div> : <form className="coaching-form" onSubmit={onApply}><div><p className="eyebrow">Cerere de coaching</p><h2>Spune-ne, pe scurt, unde ai nevoie de claritate.</h2></div><label>Nume și prenume<input name="name" required minLength={2} autoComplete="name" placeholder="Numele tău" /></label><label>Adresă de e-mail<input name="email" required type="email" autoComplete="email" placeholder="nume@exemplu.ro" /></label><label>Contextul tău<textarea name="context" required minLength={20} maxLength={3000} placeholder="Care este situația în care vrei să ai mai multă claritate?" /></label><button className="primary-button" type="submit" disabled={application.isPending}>{application.isPending ? "Trimitem aplicația…" : "Trimite aplicația"}<ArrowUpRight size={18} /></button><p className="form-footnote">Folosim aceste date exclusiv pentru a analiza cererea ta de coaching și a reveni cu un răspuns.</p></form>}</section>
      <SiteFooter />
    </main>
  );
}
