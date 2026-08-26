import { ArrowLeft, Download, LoaderCircle, MailX, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const campaignKeys = ["abandoned_checkout", "base_only", "next_step_skipped", "missing_product"] as const;
type CampaignKey = (typeof campaignKeys)[number];

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadCampaignCsv(rows: Array<{ email: string; firstName: string; campaignKey: string; subject: string; text: string }>, campaignKey: CampaignKey) {
  const header = ["email", "firstName", "campaignKey", "subject", "text"];
  const csv = [header.join(","), ...rows.map((row) => [row.email, row.firstName, row.campaignKey, row.subject, row.text].map(csvEscape).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `calendarul-norocului-${campaignKey}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CalendarLuckyAdmin() {
  const segments = trpc.calendar.lifecycle.manualSegments.useQuery();
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignKey | null>(null);
  const exportCampaign = trpc.calendar.lifecycle.exportCampaign.useQuery({ campaignKey: selectedCampaign ?? "abandoned_checkout" }, { enabled: Boolean(selectedCampaign), retry: false });
  const campaign = segments.data?.campaigns.find((item) => item.key === selectedCampaign);

  if (segments.isLoading) return <main className="flex min-h-screen items-center justify-center bg-[#10111a] text-[#f8efe1]"><LoaderCircle className="mr-3 animate-spin text-[#eaa21b]" /> Încărcăm segmentele Calendarului…</main>;
  if (segments.isError || !segments.data) return <main className="min-h-screen bg-[#10111a] px-5 py-20 text-[#f8efe1]"><div className="mx-auto max-w-xl border border-white/15 bg-white/[.04] p-8 text-center"><ShieldCheck className="mx-auto text-[#eaa21b]" size={32} /><p className="mt-5 text-xs tracking-[.16em] text-[#eaa21b]">ACCES ADMINISTRATIV</p><h1 className="mt-3 font-serif text-4xl">Segmentele nu sunt disponibile.</h1><p className="mt-4 text-sm leading-6 text-white/70">Această zonă este disponibilă numai administratorilor. Nu trimite e-mailuri și nu modifică automat contactele.</p><Link href="/calendarul-norocului" className="mt-7 inline-flex items-center gap-2 text-sm text-[#f0c46b]"><ArrowLeft size={16} /> Înapoi la Calendar</Link></div></main>;

  return <main className="min-h-screen bg-[#10111a] px-5 py-10 text-[#f8efe1] sm:py-16"><div className="mx-auto max-w-5xl"><header className="flex flex-col justify-between gap-5 border-b border-white/15 pb-7 sm:flex-row sm:items-end"><div><p className="text-xs tracking-[.17em] text-[#eaa21b]">CALENDARUL NOROCULUI · ADMIN</p><h1 className="mt-3 font-serif text-5xl">Segmente manuale</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">Exportă destinatarii și copy-ul aprobat pentru campania aleasă. Acest panou nu expediază e-mailuri și nu adaugă automat contacte în nicio campanie.</p></div><Link href="/calendarul-norocului" className="inline-flex items-center gap-2 text-sm text-[#f0c46b]"><ArrowLeft size={16} /> Calendar public</Link></header><section className="mt-9 grid gap-4 sm:grid-cols-2"><article className="border border-[#eaa21b]/40 bg-[#eaa21b]/10 p-5"><MailX className="text-[#eaa21b]" size={24} /><h2 className="mt-4 font-serif text-2xl">Fără trimitere automată</h2><p className="mt-2 text-sm leading-6 text-white/70">Rezultatul este un CSV manual. Revizuiește conținutul, consimțământul și expeditorul verificat înainte de orice utilizare externă.</p></article><article className="border border-white/15 bg-white/[.04] p-5"><ShieldCheck className="text-[#eaa21b]" size={24} /><h2 className="mt-4 font-serif text-2xl">Segmente cu consimțământ</h2><p className="mt-2 text-sm leading-6 text-white/70">Numărătoarea se bazează pe contactele Calendar cu consimțământ de marketing salvat în schema comună.</p></article></section><section className="mt-9"><p className="text-xs tracking-[.17em] text-[#eaa21b]">DESTINATARI DISPONIBILI</p><div className="mt-4 grid gap-4 md:grid-cols-2">{segments.data.segments.map((segment) => <article key={segment.key} className="border border-white/15 bg-white/[.04] p-5"><p className="text-xs tracking-[.15em] text-[#f0c46b]">{segment.key.replaceAll("_", " ")}</p><div className="mt-3 flex items-end justify-between gap-4"><h2 className="font-serif text-3xl">{segment.name}</h2><strong className="text-3xl text-[#eaa21b]">{segment.count}</strong></div><p className="mt-3 text-sm text-white/70">{segment.count === 1 ? "1 contact eligibil" : `${segment.count} contacte eligibile`}</p><button type="button" onClick={() => setSelectedCampaign(segment.key as CampaignKey)} className="mt-5 inline-flex items-center gap-2 border border-[#eaa21b]/60 px-4 py-2 text-xs font-bold text-[#f0c46b] hover:bg-[#eaa21b]/10"><Download size={15} /> Pregătește exportul</button></article>)}</div></section>{selectedCampaign && <section className="mt-9 border border-[#eaa21b]/40 bg-[#eaa21b]/10 p-6"><p className="text-xs tracking-[.17em] text-[#eaa21b]">EXPORT MANUAL</p><h2 className="mt-3 font-serif text-3xl">{campaign?.name ?? "Campanie"}</h2><p className="mt-3 text-sm text-white/75">Subiect: <strong className="font-semibold text-white">{campaign?.subject ?? "—"}</strong></p>{exportCampaign.isLoading ? <p className="mt-5 flex items-center gap-2 text-sm text-white/70"><LoaderCircle className="animate-spin" size={16} /> Pregătim CSV-ul…</p> : exportCampaign.isError ? <p className="mt-5 text-sm text-[#ffb6a8]">Exportul nu a putut fi pregătit. Verifică drepturile administrative și încearcă din nou.</p> : <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-white/75">{exportCampaign.data?.length ?? 0} rânduri disponibile. Fișierul include e-mailul, prenumele, subiectul și textul campaniei.</p><button type="button" onClick={() => downloadCampaignCsv(exportCampaign.data ?? [], selectedCampaign)} className="inline-flex items-center justify-center gap-2 bg-[#e88d06] px-5 py-3 text-xs font-bold text-[#151118] disabled:opacity-50" disabled={!exportCampaign.data?.length}><Download size={15} /> Descarcă CSV</button></div>}</section>}</div></main>;
}
