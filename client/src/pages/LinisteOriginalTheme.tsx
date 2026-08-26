import { ArrowDown, ArrowLeft, Check, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { linisteCheckoutUrl, normalizeLinisteEmail, type LinisteCurrency, type LinisteProductKey, type LinisteTheme } from "@/flows/linisteFunnel";
import "./liniste-theme.css";

const THEME_PAGES: Record<LinisteTheme, { eyebrow: string; title: string; accent: string; lead: string; productKey: LinisteProductKey; moments: string[]; note: string }> = {
  bani: { eyebrow: "PENTRU MOMENTE ÎN CARE BANII APASĂ", title: "Când grija pentru bani îți ocupă tot spațiul.", accent: "gold", lead: "Un audio ghidat de câteva minute pentru a încetini ritmul unui moment tensionat și a face loc următorului pas mic.", productKey: "anxietate", moments: ["Când verifici contul iar și iar", "Înainte de o decizie financiară", "După o conversație apăsătoare despre bani"], note: "Nu oferă sfaturi financiare; este un instrument de sprijin pentru felul în care te simți în acel moment." },
  sanatate: { eyebrow: "PENTRU GRIJI LEGATE DE SĂNĂTATE", title: "Când corpul sau o veste îți cere toată atenția.", accent: "ocean", lead: "Un moment de orientare blândă pentru zilele în care ai nevoie să revii la prezent, fără să rezolvi totul deodată.", productKey: "frica", moments: ["Înainte de o programare", "În timpul unei perioade de așteptare", "Când gândurile devin prea multe"], note: "Acest audio nu oferă recomandări medicale și nu înlocuiește evaluarea unui profesionist." },
  anxietate: { eyebrow: "PENTRU MOMENTE TENSIONATE", title: "Când mintea aleargă înaintea ta.", accent: "iris", lead: "O invitație audio de a observa ce este aici, acum — respirație, spațiu și pași mici, fără presiunea de a te simți altfel imediat.", productKey: "anxietate", moments: ["Când simți că se adună prea multe", "Înainte de un moment important", "Când ai nevoie de o pauză de orientare"], note: "Audio-ul este un instrument de sprijin și nu este tratament medical." },
  eliberare: { eyebrow: "PENTRU A LĂSA PUȚIN DIN GREUTATE JOS", title: "Când ai ținut prea mult în tine.", accent: "clay", lead: "Un spațiu audio discret pentru a încetini, a observa tensiunea și a-ți permite câteva minute cu mai puține cerințe.", productKey: "dispozitie-joasa", moments: ["După o zi intensă", "Când nu mai ai cuvinte", "Când vrei o trecere mai blândă spre seară"], note: "Nu înlocuiește sprijinul profesional atunci când ai nevoie de el." },
  iubire: { eyebrow: "PENTRU ZILE ÎN CARE RELAȚIILE DOR", title: "Când inima cere un loc mai blând.", accent: "rose", lead: "Un audio scurt pentru momentele în care o relație, o lipsă sau o conversație îți rămâne aproape de inimă.", productKey: "dispozitie-joasa", moments: ["După o conversație dificilă", "Când apare dorul", "Când vrei să te întorci puțin spre tine"], note: "Audio-ul nu este terapie de cuplu și nu înlocuiește sprijinul specializat." },
};

const labels: Record<LinisteCurrency, string> = { ron: "RON", eur: "EUR", usd: "USD", gbp: "GBP" };
const PRODUCTS: Record<LinisteProductKey, { displayName: string; price: Record<LinisteCurrency, number>; reference: Record<LinisteCurrency, number> }> = {
  anxietate: { displayName: "Punct de sprijin", price: { ron: 6700, eur: 1340, usd: 1475, gbp: 1120 }, reference: { ron: 10000, eur: 2000, usd: 2200, gbp: 1700 } },
  "dispozitie-joasa": { displayName: "O clipă mai blândă", price: { ron: 6700, eur: 1340, usd: 1475, gbp: 1120 }, reference: { ron: 10000, eur: 2000, usd: 2200, gbp: 1700 } },
  frica: { displayName: "Spațiu de siguranță", price: { ron: 6700, eur: 1340, usd: 1475, gbp: 1120 }, reference: { ron: 10000, eur: 2000, usd: 2200, gbp: 1700 } },
  "pachet-intreg": { displayName: "Pachetul de însoțire", price: { ron: 6900, eur: 1390, usd: 1490, gbp: 1190 }, reference: { ron: 9900, eur: 2000, usd: 2200, gbp: 1700 } },
};
const number = (cents: number, currency: LinisteCurrency) => new Intl.NumberFormat("ro-RO", { style: "currency", currency: labels[currency] }).format(cents / 100);

export default function LinisteOriginalTheme({ theme }: { theme: LinisteTheme }) {
  const [, navigate] = useLocation();
  const page = THEME_PAGES[theme];
  const params = useMemo(() => typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search), []);
  const initialCurrency = (params.get("currency") ?? "ron") as LinisteCurrency;
  const [currency, setCurrency] = useState<LinisteCurrency>(["ron", "eur", "usd", "gbp"].includes(initialCurrency) ? initialCurrency : "ron");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const product = PRODUCTS[page.productKey];
  const offer = params.get("oferta") === "exit20" ? "exit20" : undefined;
  const fromQuiz = params.get("quiz") === "1";
  const tracking = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"].flatMap(key => { const value = params.get(key); return value ? [[key, value]] : []; }));
  const finalPrice = offer === "exit20" && page.productKey !== "pachet-intreg" ? ({ ron: 4700, eur: 940, usd: 1025, gbp: 770 } as const)[currency] : product.price[currency];
  const goToOffer = () => document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeLinisteEmail(email);
    if (!normalized) { setError("Introdu o adresă de email validă pentru a continua."); return; }
    const target = linisteCheckoutUrl(page.productKey, { currency, theme, fromQuiz, offer, claimCode: params.get("reducere") ?? undefined, tracking });
    navigate(`${target}&email=${encodeURIComponent(normalized)}`);
  };
  return <main className={`liniste-theme liniste-theme-${page.accent}`}>
    <header className="liniste-theme-header"><Link href="/liniste-audio"><ArrowLeft size={16} /> Înapoi la liniște</Link><Link href="/liniste-audio" className="liniste-wordmark"><span>l</span> liniște</Link><Link href="/liniste-audio/quiz">Nu știi ce să alegi? Fă quiz-ul</Link></header>
    <section className="liniste-theme-hero"><p className="liniste-theme-number">0{Object.keys(THEME_PAGES).indexOf(theme) + 1}</p><p className="liniste-theme-eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p>{page.lead}</p><button onClick={goToOffer}>Adaugă în coș <ArrowDown size={17} /></button><span><LockKeyhole size={14} /> Plata se face în siguranță, pe site.</span></section>
    <section className="liniste-theme-moments"><p className="liniste-theme-eyebrow">POATE FI UN MOMENT POTRIVIT CÂND...</p><div>{page.moments.map(moment => <article key={moment}><Check size={18} />{moment}</article>)}</div></section>
    <section className="liniste-theme-product"><div className="liniste-theme-art"><span>audio ghidat</span></div><div><p className="liniste-theme-eyebrow">AUDIO RECOMANDAT</p><h2>{product.displayName}</h2><p>{page.lead}</p><div className="liniste-theme-price"><del>{number(product.reference[currency], currency)}</del><strong>{number(finalPrice, currency)}</strong></div><dl><div><dt>Durată</dt><dd>aprox. 1 min</dd></div><div><dt>Acces</dt><dd>imediat după plată</dd></div></dl></div><button onClick={goToOffer}>Adaugă în coș <ArrowDown size={16} /></button></section>
    <section className="liniste-theme-safety"><ShieldCheck size={21} /><p>{page.note} Dacă este vorba despre o urgență sau risc imediat, sună la 112. Telefonul Speranței: 0800 801 200.</p></section>
    <section className="liniste-theme-offer" id="oferta"><div><p className="liniste-theme-eyebrow">ALEGE MOMENTUL TĂU</p><h2>Adaugă în coș, când ești pregătit.</h2><p>{fromQuiz ? "Am păstrat emailul pe care l-ai introdus la quiz. Îl poți modifica înainte de plată." : "Adresa de email este necesară pentru accesul securizat după confirmare."}</p></div><form onSubmit={submit}><label htmlFor="liniste-email">Adresa de email</label><div><Mail size={17} /><input id="liniste-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} placeholder="numele@exemplu.ro" required /></div>{error && <p className="liniste-theme-error">{error}</p>}<label htmlFor="liniste-currency">Moneda de plată</label><select id="liniste-currency" value={currency} onChange={event => setCurrency(event.target.value as LinisteCurrency)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><strong>{number(finalPrice, currency)}</strong><button type="submit">Adaugă în coș <span>→</span></button><small>Continuând, ești de acord cu termenii și condițiile și politica de confidențialitate. Nu se activează abonamente.</small></form></section>
  </main>;
}
