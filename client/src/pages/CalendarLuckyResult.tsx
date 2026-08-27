import { BriefcaseBusiness, CalendarDays, CircleAlert, Eye, Heart, Sparkles, Star } from "lucide-react";
import { calendarLifePathNumber, calendarPathFocus } from "@/flows/calendarSource";
import { CalendarCheckout } from "./CalendarLuckyPreview";

export type CalendarLuckyDetails = { name: string; email: string; month: number; day: number; year: number; zodiac: { name: string; glyph: string } };
type Timing = { date: Date; type: "love" | "career" | "warning"; title: string; copy: string };

const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
function addDays(date: Date, count: number) { const output = new Date(date); output.setDate(output.getDate() + count); return output; }
function shortMonth(date: Date) { return months[date.getMonth()].slice(0, 3).toUpperCase(); }
function formattedDate(date: Date) { return `${String(date.getDate()).padStart(2, "0")} ${shortMonth(date)}`; }
function Sigil({ size = 18 }: { size?: number }) { return <span className="calendar-sigil" style={{ width: size, height: size }}><Sparkles size={Math.round(size * .52)} fill="currentColor" /></span>; }

function makeTiming(details: CalendarLuckyDetails): Timing[] {
  const path = calendarLifePathNumber(details.month, details.day, details.year);
  const seed = details.day + details.month * 5 + path * 3;
  return [
    { date: addDays(new Date(), 7 + (seed % 10)), type: "love", title: "O fereastră de apropiere", copy: "În jurul acestei date, poate fi mai ușor să faci loc unei invitații, unei conversații sau unei reconectări." },
    { date: addDays(new Date(), 26 + (seed % 18)), type: "career", title: "Muncă și oportunitate", copy: `Numărul tău personal ${path} pune accent pe ${calendarPathFocus(path)}. Alege un pas mic pe care îl poți începe atunci.` },
    { date: addDays(new Date(), 52 + (seed % 18)), type: "warning", title: "Pauză și verificare", copy: "În jurul acestei date, merită să nu te grăbești. O pauză și o întrebare în plus pot aduce claritate." },
  ];
}

function VisibleTimingCard({ timing }: { timing: Timing }) {
  const Icon = timing.type === "love" ? Heart : timing.type === "career" ? BriefcaseBusiness : Eye;
  const typeLabel = timing.type === "love" ? "APROPIERE" : timing.type === "career" ? "OPORTUNITATE" : "PAUZĂ";
  return <article className={`source-timing-card ${timing.type}`}><div className="source-timing-head"><div className="source-date"><span>{shortMonth(timing.date)}</span><strong>{String(timing.date.getDate()).padStart(2, "0")}</strong></div><div className="source-type"><Icon size={17} /><span>{typeLabel}</span></div><div className="source-countdown"><span>ÎN CURÂND</span><strong>{formattedDate(timing.date)}</strong></div></div><p>{timing.copy}</p><div className="source-seal-box"><p aria-hidden="true">Ce poți observa înainte de această zi, cum să alegi momentul și ce notă personală merită păstrată pentru calendarul tău.</p><div><Sigil size={18} /><b>Sensul complet al acestei date rămâne sigilat</b><span>În calendarul complet poți vedea contextul și nota personală pentru această fereastră.</span></div></div></article>;
}

function LockedCard({ title, tone }: { title: string; tone: string }) { return <article className={`source-locked-card ${tone}`}><div><span>???</span><strong>88</strong></div><div><Sigil size={15} /><b>{title}</b></div><div><span>ÎN CURÂND</span><strong>??</strong></div><p>Data exactă și nota aferentă sunt disponibile în calendarul complet.</p><small><Sigil size={12} /> DATĂ SIGILATĂ</small></article>; }

function ResultFooter() { return <footer className="calendar-source-footer"><div className="calendar-footer-ceremony"><Sparkles size={18} /><span>CALENDARUL<br /><b>NOROCULUI</b></span></div><p><strong>Calendarul Norocului</strong> <span>·</span> <a href="#footer">Confidențialitate</a> <span>·</span> <a href="#footer">Termeni</a> <span>·</span> <a href="#footer">Rambursare</a> <span>·</span> <a href="#footer">Contact</a></p><p id="footer">Material pentru divertisment și reflecție personală. Rezultatele nu sunt garantate.</p><p>Folosește orice interpretare ca punct de plecare, nu ca înlocuitor pentru informații verificabile sau propria judecată.</p></footer>; }

export function CalendarLuckyLoader({ name }: { name: string }) { return <main className="calendar-source-shell"><section className="source-loader"><Sigil size={46} /><h1>Citim harta lui {name || "tine"}...</h1><p>Potrivim zodia, numărul personal și următoarele 90 de zile.</p><div><span /></div><small>Durează câteva secunde</small></section></main>; }

export function CalendarLuckyResult({ details, visitorId }: { details: CalendarLuckyDetails; visitorId: string }) {
  const timing = makeTiming(details); const path = calendarLifePathNumber(details.month, details.day, details.year);
  return <main className="calendar-source-shell"><section className="source-result-page"><div className="source-result-column"><header className="result-brand"><div><Sigil size={22} /><span>CALENDARUL<br /><b>NOROCULUI</b></span></div><span className="result-header-note">PREVIZUALIZARE PERSONALĂ</span></header><div className="result-sign-chip"><Star size={12} fill="currentColor" /> {details.zodiac.glyph} {details.zodiac.name} · NUMĂR PERSONAL {path}</div><h1>{details.name} — harta ta are 3 repere pentru tine.</h1><p className="result-intro">În următoarele 90 de zile, ai o fereastră de apropiere, una de oportunitate și una de pauză. Ele folosesc data ta de naștere, zodia aleasă și numărul personal ca punct de plecare.</p><div className="how-it-works"><Sigil size={28} /><div><h2>Cum funcționează</h2><p>Data ta de naștere, zodia <strong>{details.zodiac.name}</strong> și numărul personal <strong>{path}</strong> sunt puse lângă următoarele 90 de zile. <b>Calculat ca structură, interpretat ca reflecție.</b></p></div></div><p className="result-section-label">FERSTRELE TALE DE TIMING — URMĂTOARELE 90 DE ZILE (PREVIZUALIZARE)</p><div className="source-timing-list result-timing-list">{timing.map((item) => <VisibleTimingCard timing={item} key={item.type} />)}</div><p className="result-section-label locked-label">RESTUL CALENDARULUI — SIGILAT</p><div className="source-locked-list result-locked-list"><LockedCard title="ZI DE ATENȚIE" tone="danger" /><LockedCard title="CONEXIUNE" tone="connection" /><LockedCard title="INIȚIATIVĂ" tone="initiative" /><LockedCard title="PAUZĂ" tone="pause" /><LockedCard title="REORIENTARE" tone="reorient" /></div><p className="result-small-disclaimer"><CircleAlert size={14} /> Material pentru divertisment și reflecție personală; nu reprezintă sfat financiar, medical, juridic sau profesional.</p><CalendarCheckout email={details.email} firstName={details.name} visitorId={visitorId} /></div><ResultFooter /></section></main>;
}
