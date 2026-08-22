import { Check, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import "./tarot-original.css";

export default function TarotOriginalDashboard() {
  const [, setLocation] = useLocation(); const dashboard = trpc.tarot.dashboard.useQuery(); const trackEvent = trpc.tarot.trackFunnelEvent.useMutation();
  useEffect(() => { if (dashboard.data?.publicToken) trackEvent.mutate({ publicToken: dashboard.data.publicToken, eventType: "dashboard_viewed" }); }, [dashboard.data?.publicToken]);
  if (dashboard.isLoading) return <main className="buyer-dashboard"><p>Verificăm accesul privat…</p></main>;
  if (!dashboard.data) return <main className="buyer-dashboard"><section className="buyer-panel"><LockKeyhole size={26} /><p className="eyebrow">Acces protejat</p><h1>Dashboardul tău este disponibil doar pe dispozitivul autorizat.</h1><p>Pentru un dispozitiv nou, folosește linkul privat primit pe email după plată. Nu publicăm produsele la un link liber distribuibil.</p><button className="gold-button" onClick={() => setLocation("/oferte/tarot")}>Înapoi la Mara Tarot</button></section></main>;
  const order = dashboard.data; const productStatus = (code: string) => order.items.find(item => item.productCode === code)?.status as "paid" | "declined" | undefined; const productLabel = (code: string) => code === "numerology" ? "Numerologie personală" : code === "portrait" ? "Portret simbolic" : "Ghid pentru palmă";
  return <main className="buyer-dashboard"><header><span className="buyer-logo"><Sparkles size={17} /> Mara Tarot</span><span><LockKeyhole size={13} /> Sesiune privată</span></header><section className="buyer-panel"><p className="eyebrow">Bine ai revenit, {order.customerName}</p><h1>Citirea ta este <em>în pregătire.</em></h1><p>Produsele de mai jos sunt legate de această sesiune. Le poți accesa pe acest dispozitiv fără email repetat.</p><div className="buyer-products"><article><Check size={18} /><b>Ghid tarot personalizat</b><small>{order.status === "paid" ? "Plată confirmată · în pregătire" : "Așteaptă confirmarea plății"}</small></article>{["numerology", "portrait", "palm"].map(code => { const status = productStatus(code); return <article key={code} className={!status || status === "declined" ? "is-placeholder" : ""}>{status === "paid" ? <Check size={18} /> : <LockKeyhole size={18} />}<b>{productLabel(code)}</b><small>{status === "paid" ? "Inclus · în pregătire" : "Nu este inclus în această comandă"}</small></article>; })}</div><p className="buyer-email"><Mail size={15} /> Actualizările și linkul de acces pentru un dispozitiv nou sunt trimise la <b>{order.customerEmail}</b>.</p></section></main>;
}
