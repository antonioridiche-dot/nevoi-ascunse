/**
 * GENERATOR DE CALENDARE — Te Vreau Inapoi
 * =========================================
 * Produce cele 4 calendare anuale (barbati/femei × social/email) din reguli,
 * ca sa nu fie nevoie sa fie scrise de mana in fiecare an.
 *
 *   node generator-calendar.mjs 2027
 *
 * Refolosire anuala: ruleaza din nou cu alt an. Sarbatorile mobile
 * (Pasti, Rusalii, Ziua Mamei, Ziua Tatalui) se calculeaza automat.
 */

import fs from "node:fs";
import path from "node:path";

const YEAR = parseInt(process.argv[2] || "2027", 10);
const OUT = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));

// ─────────────────────────────────────────────────────────────
// 1. SARBATORI (fixe + mobile)
// ─────────────────────────────────────────────────────────────

/** Pasti ortodoxe (calendar iulian) -> data gregoriana. */
function orthodoxEaster(year) {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const julian = new Date(Date.UTC(year, month - 1, day));
  julian.setUTCDate(julian.getUTCDate() + 13); // iulian -> gregorian (1900-2099)
  return julian;
}

function nthWeekdayOfMonth(year, month, weekday, n) {
  const d = new Date(Date.UTC(year, month - 1, 1));
  let count = 0;
  while (d.getUTCMonth() === month - 1) {
    if (d.getUTCDay() === weekday) { count++; if (count === n) return new Date(d); }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

function addDays(date, n) { const d = new Date(date); d.setUTCDate(d.getUTCDate() + n); return d; }
function key(d) { return d.toISOString().slice(0, 10); }

function buildHolidays(year) {
  const easter = orthodoxEaster(year);
  const h = {};
  const put = (date, name, angle, prio, gen) => { h[key(date)] = { name, angle, prio, gen: gen || "both" }; };

  // fixe
  put(new Date(Date.UTC(year, 0, 1)),  "Anul Nou", "An nou, aceeași durere. Rezoluții care nu se țin.", 3);
  put(new Date(Date.UTC(year, 0, 6)),  "Boboteaza", "Curățare, început nou. Ce lași în urmă?", 1);
  put(new Date(Date.UTC(year, 0, 7)),  "Sf. Ion", "Tradiție, familie.", 1);
  put(new Date(Date.UTC(year, 0, 15)), "Ziua Culturii", "Cultural, ușor.", 0);
  put(new Date(Date.UTC(year, 0, 24)), "Unirea Principatelor", "Unire, împreună. Ce faci când ce ai unit s-a rupt?", 1);
  put(new Date(Date.UTC(year, 1, 14)), "Valentine's", "Toată lumea postează cupluri. Tu stai cu telefonul.", 3);
  put(new Date(Date.UTC(year, 1, 24)), "Dragobete", "Sărbătoarea românească a iubirii. Despre a fi ales.", 3);
  put(new Date(Date.UTC(year, 2, 1)),  "Mărțișor", "Cui îi dai mărțișor anul ăsta?", 3);
  put(new Date(Date.UTC(year, 2, 8)),  "Ziua Femeii", "Meriți să fii sărbătorită, nu doar să sărbătorești.", 3, "female");
  put(new Date(Date.UTC(year, 3, 23)), "Sf. Gheorghe", "Tradiție.", 0);
  put(new Date(Date.UTC(year, 4, 1)),  "Ziua Muncii", "Zi liberă. Mai mult timp cu gândurile.", 1);
  put(new Date(Date.UTC(year, 5, 1)),  "Ziua Copilului", "Copiii între părinți despărțiți.", 3);
  put(new Date(Date.UTC(year, 5, 24)), "Sânziene", "Mistic românesc, noaptea dragostei.", 1);
  put(new Date(Date.UTC(year, 5, 29)), "Sf. Petru și Pavel", "Vară, vacanță.", 0);
  put(new Date(Date.UTC(year, 6, 20)), "Ziua Drapelului", "Național.", 0);
  put(new Date(Date.UTC(year, 7, 15)), "Sf. Maria Mare", "Familie. Ce spui când te întreabă toți.", 1);
  put(new Date(Date.UTC(year, 8, 1)),  "Început de școală", "Doi părinți, două locuri, un copil.", 3);
  put(new Date(Date.UTC(year, 8, 14)), "Ziua Crucii", "Religios, răbdare.", 1);
  put(new Date(Date.UTC(year, 9, 1)),  "Ziua Vârstnicilor", "Respect, timp.", 0);
  put(new Date(Date.UTC(year, 9, 26)), "Ziua Armatei", "Național.", 0);
  put(new Date(Date.UTC(year, 10, 30)),"Sf. Andrei", "Mistic românesc, noaptea prezicerilor.", 1);
  put(new Date(Date.UTC(year, 11, 1)), "Ziua Națională", "Familie adunată. Și tu, singur.", 3);
  put(new Date(Date.UTC(year, 11, 6)), "Sf. Nicolae", "Cadouri, copii, familie.", 1);
  put(new Date(Date.UTC(year, 11, 24)),"Ajunsul Crăciunului", "Ultima zi înainte. Ești singur.", 3);
  put(new Date(Date.UTC(year, 11, 25)),"Crăciun", "CEL MAI PUTERNIC MOMENT. Masă în familie, toți întreabă.", 3);
  put(new Date(Date.UTC(year, 11, 26)),"A doua zi de Crăciun", "Empatie pură. ZERO vânzare.", 3);
  put(new Date(Date.UTC(year, 11, 31)),"Revelion", "Cu cine intri în anul nou?", 3);

  // mobile
  put(addDays(easter, -3), "Vinerea Mare", "Reflecție, durere, sens.", 1);
  put(easter, "Paște", "Înviere, renaștere. Relația ta poate și ea.", 2);
  put(addDays(easter, 1), "A doua zi de Paște", "Familie.", 1);
  put(addDays(easter, 49), "Rusalii", "Familie adunată.", 1);
  const mama = nthWeekdayOfMonth(year, 5, 0, 1);
  if (mama) put(mama, "Ziua Mamei", "Pentru mame după despărțire. Relația cu mama.", 2);
  const tata = nthWeekdayOfMonth(year, 6, 0, 2);
  if (tata) put(tata, "Ziua Tatălui", "Tați fără copii lângă ei.", 2);

  // comerciale
  const bf = nthWeekdayOfMonth(year, 11, 5, 4); // a 4-a vineri din noiembrie
  if (bf) { put(bf, "Black Friday", "Singura reducere reală a anului.", 3); h[key(bf)].commercial = true; }
  if (bf) { put(addDays(bf, 3), "Cyber Monday", "Prelungire.", 2); h[key(addDays(bf, 3))].commercial = true; }
  // Craciun: empatie pura, zero vanzare
  h[key(new Date(Date.UTC(year, 11, 24)))].noCta = true;
  h[key(new Date(Date.UTC(year, 11, 25)))].noCta = true;
  h[key(new Date(Date.UTC(year, 11, 26)))].noCta = true;

  return h;
}

// ─────────────────────────────────────────────────────────────
// 2. ACTIVELE (68 per gen) — titlurile; conținutul e în bibliotecă
// ─────────────────────────────────────────────────────────────

const ASSETS = {
  male: {
    A: ["Ce se întâmplă în capul ei când îi scrii al 14-lea mesaj","De ce «dă-mi o șansă» nu a funcționat niciodată","Cele 3 faze prin care trece o femeie după ce te lasă","De ce «spațiul» funcționează (și de ce majoritatea îl fac greșit)","Ce simte ea când vezi că e cu altcineva","De ce te trezești la 3 noaptea și te gândești la ea","Ce se întâmplă în creierul tău în primele 72 de ore","De ce «a trecut prea mult timp» e o minciună","Ce simte ea când îi apari la ușă neanunțat","Cele 4 greșeli din prima săptămână care costă luni","De ce ea nu-ți răspunde (nu e ce crezi)","Ce înseamnă «am nevoie de spațiu», tradus corect","De ce confunzi insistența cu lupta","Ce se întâmplă când îi scrii prietenei ei","De ce «hai să fim prieteni» e cea mai scumpă greșeală","Cum se stinge atracția (și cum se reaprinde)","Ce caută ea de fapt la alt bărbat","Ultimele 90 de zile înainte de despărțire","De ce «nu mai am nevoie de ea» e cel mai atractiv lucru","Împăcare care rezistă vs. împăcare care se rupe iar"],
    C: ["3 semne că fosta ta nu e peste tine","5 lucruri pe care le faci fără să realizezi și o îndepărtezi","Ce înseamnă de fapt când te-a blocat","4 semne că ești în friend zone fără să-ți dai seama","3 lucruri pe care le spune o femeie când te testează","Ce înseamnă când îți răspunde după 3 zile","5 fraze care sună bine dar o îndepărtează instant","3 semne că relația ei nouă nu va rezista","Ce înseamnă când îți vede story-ul dar nu reacționează","4 momente în care e cel mai probabil să te citească","3 tipuri de mesaje care primesc răspuns (și 3 care nu)","Ce se întâmplă dacă nu faci nimic 60 de zile"],
    P: ["«Am trimis 47 de mesaje în 3 zile. Al 48-lea a schimbat totul»","Andrei, 34 — 11 luni de încercări, apoi 6 săptămâni de tăcere","«Ea mi-a scris prima. După 5 săptămâni»","«Credeam că e terminat. Eram în luna 8»","«Am aflat că e cu altcineva. A durat 3 luni»","«Nu voiam să o recuperez. Voiam să nu mai simt»","«Nu am crezut până nu am încetat să mai încerc»","«Eram sigur că sunt prea bătrân pentru asta»","«Mi-a spus că m-am schimbat. Nu i-am spus nimic»"],
    B: ["«Dacă mă schimb, se întoarce» — de ce e greșit","Gesturile mari nu repară nimic","«Trebuie să lupt» — de ce lupta ta e greșită","«Ea e problema» — adevărul incomod","«Dacă o iubesc destul, simte»","«Timpul vindecă tot» — de ce nu e adevărat pentru tine","«Trebuie să fiu prieten cu ea ca să rămân în joc»","«Femeile vor bărbați răi»","«Dacă aș fi fost mai bun, nu pleca»"],
    I: ["Nu ești nebun","Slab e să repeți aceeași greșeală 6 luni","Nu ți-a lipsit curajul. Ți-a lipsit ordinea.","Ce ai voie să simți (și ce nu-ți spune nimeni)","Durerea nu te face slab. Te face uman.","Nu ești «prea mult». Ai fost cu persoana nepotrivită","Meriți să lupți pentru ce vrei, chiar dacă pierzi"],
    D: ["Bărbatul care nu mai are nevoie de validare","Ce înseamnă să fii puternic, de fapt","Omul pe care l-ar alege din nou","Versiunea ta de peste 6 luni","Nu te schimbi ca s-o impresionezi. Te schimbi ca să nu mai ai nevoie."],
    E: ["Poll: în ce fază ești acum?","Ce ai încercat până acum? Scrie în comentarii","Care e cel mai greu moment al zilei pentru tine?"],
    O: ["Ce e în Biblie + garanția de 30 de zile","Testul de șanse — gratuit, 1 minut","Coaching 97 lei/lună cu Anca"],
  },
  female: {
    A: ["De ce el s-a distanțat exact când tu ai început să faci mai mult","De ce «fii mai bună cu el» e cel mai prost sfat","Cele 3 faze prin care trece un bărbat după ce te lasă","De ce tăcerea ta îl sperie mai mult decât orice conversație","Ce simte el când îți vede story-ul","De ce te simți vinovată că te-ai supărat, deși ai avut dreptate","Ce se întâmplă în creierul tău când verifici telefonul la 2 noaptea","De ce «am nevoie de spațiu» nu înseamnă ce crezi","De ce el se întoarce mereu când te-ai resemnat","Cele 4 lucruri pe care le faci din dragoste și te distrug","De ce el nu-ți spune niciodată adevăratul motiv","Ce înseamnă când răspunde politicos dar rece","De ce ai impresia că «nimeni nu te înțelege»","Ce se întâmplă când îi scrii mamei lui","De ce «hai să rămânem prieteni» e cea mai crudă variantă","Cum se stinge dorința lui (și cum se reaprinde)","Ce caută el de fapt la altă femeie","Ultimele 90 de zile înainte de despărțire","De ce «nu mai am nevoie de el» e cel mai atractiv lucru","Împăcare care rezistă vs. împăcare care te rănește iar"],
    C: ["3 semne că el încă ține la tine (chiar dacă nu o spune)","5 lucruri pe care le faci ca să-l recuperezi și îl îndepărtezi","Ce înseamnă de fapt când te-a blocat","4 semne că ești opțiunea de rezervă","3 lucruri pe care le spune un bărbat când te testează","Ce înseamnă când îți răspunde după 3 zile","5 fraze care sună bine dar îl fac să fugă","3 semne că relația lui nouă nu va rezista","Ce înseamnă când îți vede story-ul dar nu reacționează","4 momente în care un bărbat se gândește cel mai mult la tine","3 tipuri de mesaje care primesc răspuns (și 3 care te fac penibilă)","Ce se întâmplă dacă nu faci nimic 60 de zile"],
    P: ["«Am încercat 7 luni. A funcționat când am renunțat să mai încerc»","Maria, 31 — «Eram sigură că sunt prea mult pentru el»","«Mi-a scris el primul. După 4 săptămâni de tăcere»","«Credeam că e vina mea. Nu era»","«A apărut cu altcineva. Greșeam tot ce se putea greși»","«Nu voiam să-l recuperez. Voiam să nu mă mai simt așa»","«Cea mai bună decizie a fost să tac»","«La 42 de ani credeam că e prea târziu»","«Mi-a spus că sunt altfel. Nu am făcut nimic special»"],
    B: ["«Dacă iubesc mai mult, se schimbă»","«Am făcut totul pentru el» — de ce te-a costat","«E vina mea» — adevărul incomod","«O femeie bună nu renunță»","«Dacă plec, nu mă mai vrea nimeni»","«Trebuie să am răbdare»","«Am încercat tot»","«Bărbații nu se schimbă niciodată»","«Nu sunt destul de bună»"],
    I: ["Nu ești exagerată","Nu e egoism să te pui pe tine prima dată","Nu ți-a lipsit dragostea. Ți-a lipsit ordinea.","Ce ai voie să simți (și ce nu-ți spune nimeni)","Nu ești «prea mult». Ai fost cu cineva care nu putea duce atât","Meriți să fii aleasă, nu tolerată","Oboseala nu e slăbiciune. E semnalul că ai dus prea mult singură"],
    D: ["Femeia care nu mai cerșește iubire","Ce înseamnă să fii puternică, de fapt","Femeia pe care ar alege-o din nou","Versiunea ta de peste 6 luni","Nu te schimbi ca să-l impresionezi. Te schimbi ca să nu mai accepți mai puțin."],
    E: ["Poll: în ce fază ești acum?","Ce ai încercat până acum? Scrie în comentarii","Care e cel mai greu moment al zilei pentru tine?"],
    O: ["Ce e în Biblie + garanția de 30 de zile","Testul de șanse — gratuit, 1 minut","Coaching 97 lei/lună cu Anca"],
  },
};

// ─────────────────────────────────────────────────────────────
// 3. RITMUL SAPTAMANAL
// ─────────────────────────────────────────────────────────────

/**
 * Pilonul pentru fiecare zi. NU e fix pe zi (ar da 14% fiecare), ci alterneaza
 * pe saptamani pare/impere, ca sa iasa distributia din strategie:
 * A 20% · C 20% · P 15% · B 15% · I 12% · D 8% · E 5% · O 5%
 */
const PILLAR_META = {
  A: { name: "Autoritate",             level: "2",     cta: "Urmărire" },
  C: { name: "Curiozitate",           level: "2-3",   cta: "Salvare" },
  P: { name: "Poveste / Testimonial", level: "3-4",   cta: "Test gratuit" },
  B: { name: "Spărgere de credințe",  level: "3",     cta: "Test gratuit" },
  I: { name: "Permisiune / Reflecție",level: "1-2",   cta: "Comentariu / salvare" },
  D: { name: "Identitate",            level: "4",     cta: "Test gratuit" },
  E: { name: "Engagement / Trend",    level: "orice", cta: "Comentariu" },
  O: { name: "Ofertă",                level: "4-5",   cta: "CUMPĂRĂ" },
};

function pillarFor(dow, week) {
  const alt = week % 2 === 0;
  switch (dow) {
    case 0: return "I";                       // duminică — permisiune (cel mai emoțional slot)
    case 1: return "A";                       // luni — autoritate
    case 2: return "C";                       // marți — curiozitate
    case 3: return alt ? "A" : "P";           // miercuri — autoritate / poveste
    case 4: return alt ? "B" : "C";           // joi — credințe / curiozitate
    case 5: return alt ? "P" : "B";           // vineri — poveste / credințe
    case 6: return ["D", "E", "O", "D"][week % 4]; // sâmbătă — rotație
    default: return "C";
  }
}

// ─────────────────────────────────────────────────────────────
// 4. GENERARE
// ─────────────────────────────────────────────────────────────

function generate(gender) {
  const holidays = buildHolidays(YEAR);
  const assets = ASSETS[gender];
  const counters = {};        // cat de departe suntem pe fiecare serie
  const lastUsed = {};        // cand a fost folosit ultima data un asset
  const rows = [];
  let offerWeekCounter = 0;

  // numerotam asseturile
  const pool = {};
  for (const [serie, titles] of Object.entries(assets)) {
    pool[serie] = titles.map((t, i) => ({ id: serie + (i + 1), title: t }));
  }

  const start = new Date(Date.UTC(YEAR, 0, 1));
  const end = new Date(Date.UTC(YEAR, 11, 31));
  let weekIndex = 0;

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay();
    const h = holidays[key(d)];

    // sarbatoare relevanta pentru genul asta
    const holidayApplies = h && (h.gen === "both" || h.gen === gender);

    // saptamana de OFERTA la fiecare 12 saptamani
    const saptamana = Math.floor(weekIndex / 7);
    const isOfferWeek = saptamana > 0 && saptamana % 12 === 0;
    // ziua de oferta din saptamana de oferta = sambata
    const isOfferDay = isOfferWeek && dow === 6;

    let serie = pillarFor(dow, Math.floor(weekIndex / 7));

    // in saptamana de oferta, mijlocul saptamanii devine oferta/dovada
    if (isOfferWeek && (dow === 3 || dow === 4)) serie = "O";
    const slot = PILLAR_META[serie];

    // sarbatorile majore inlocuiesc slotul
    let forcedHoliday = holidayApplies && h.prio >= 3;

    // alegem assetul: cel mai demult nefolosit din serie
    const list = pool[serie] || pool.A;
    let chosen = null, oldest = Infinity;
    for (const a of list) {
      const t = lastUsed[a.id] ?? -1;
      if (t < oldest) { oldest = t; chosen = a; }
    }
    lastUsed[chosen.id] = d.getTime();

    rows.push({
      date: key(d),
      dow: ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"][dow],
      holiday: holidayApplies ? h : null,
      isHolidaySlot: forcedHoliday,
      serie,
      asset: forcedHoliday ? "—" : chosen.id,
      title: forcedHoliday ? h.angle : chosen.title,
      level: forcedHoliday ? "1-3" : slot.level,
      cta: forcedHoliday
        ? (h.commercial ? "CUMPĂRĂ ACUM" : (h.noCta ? "FĂRĂ CTA — doar empatie" : "Comentariu (fără vânzare)"))
        : (isOfferDay ? "CUMPĂRĂ" : slot.cta),
      isOfferDay,
    });

    if (dow === 6) weekIndex++;
  }
  return rows;
}

function fmt(rows, gender) {
  const g = gender === "male" ? "BĂRBAȚI" : "FEMEI";
  let out = "# CALENDAR " + g + " — SOCIAL " + YEAR + "\n\n";
  out += "> Generat automat de " + String.fromCharCode(96) + "generator-calendar.mjs" + String.fromCharCode(96) + ". ";
  out += "Regenerare pentru alt an: " + String.fromCharCode(96) + "node generator-calendar.mjs 2028" + String.fromCharCode(96) + "\n\n";
  out += "**Legenda:** Nivel = nivelul de conștientizare (1=nu știe, 5=vreau să cumpere) · Serie = A autoritate, C curiozitate, P poveste, B credințe, I permisiune, D identitate, E engagement, O ofertă\n\n";
  out += "| Data | Zi | Sărbătoare | Nivel | Asset | Titlu / unghi | CTA |\n";
  out += "|---|---|---|---|---|---|---|\n";
  let lastMonth = "";
  for (const r of rows) {
    const month = r.date.slice(0, 7);
    if (month !== lastMonth) {
      lastMonth = month;
      const luna = ["ianuarie","februarie","martie","aprilie","mai","iunie","iulie","august","septembrie","octombrie","noiembrie","decembrie"][parseInt(month.slice(5), 10) - 1];
      out += "| **" + luna.toUpperCase() + "** | | | | | | |\n";
    }
    const d = r.date.slice(8) + "." + r.date.slice(5, 7);
    const hol = r.holiday ? (r.holiday.prio >= 3 ? "🔴 " : "") + r.holiday.name : "";
    const title = r.title.length > 95 ? r.title.slice(0, 92) + "…" : r.title;
    out += "| " + d + " | " + r.dow + " | " + hol + " | " + r.level + " | " + r.asset + " | " + title + " | " + r.cta + " |\n";
  }
  return out;
}

// ─── EMAIL: 3 pe săptămână (luni poveste, miercuri mecanism, vineri ofertă) ───

/**
 * 3 emailuri pe săptămână. Vineri ALTERNEAZĂ între ofertă și dovadă socială,
 * ca să iasă raportul valoare:ofertă de ~5:1 din strategie.
 * (Înainte era ofertă în fiecare vineri = 33% oferte — prea agresiv pentru
 * sănătatea listei pe termen lung.)
 */
function emailSlotFor(dow, week) {
  if (dow === 1) return { serie: "P", tip: "Poveste",  level: "1-2", cta: "Citește povestea" };
  if (dow === 3) return { serie: "A", tip: "Mecanism", level: "2-3", cta: "Vezi testul" };
  if (dow === 5) {
    return week % 2 === 0
      ? { serie: "O", tip: "Ofertă", level: "4-5", cta: "CUMPĂRĂ" }
      : { serie: "P", tip: "Dovadă", level: "3-4", cta: "Vezi testul" };
  }
  return null;
}

/** Subiect de email: max 45 caractere. */
function emailSubject(tip, title, i) {
  const t = title.replace(/[«»"]/g, "").trim();
  const patterns = {
    "Poveste": ["«" + t.slice(0, 38) + "»", "A trecut prin asta", "Povestea lui " + (i % 2 ? "Andrei" : "Mihai")],
    "Mecanism": [t.slice(0, 44), "De ce se întâmplă, de fapt", t.slice(0, 30) + " — explicația"],
    "Ofertă": ["Ultima zi cu reducere", "Îți dau banii înapoi dacă", "Garanția de 30 de zile"],
    "Dovadă": ["A funcționat pentru ei", "«Nu am crezut până nu am văzut»", "Poveste reală, fără filtre"],
  };
  const list = patterns[tip] || [t.slice(0, 44)];
  return list[i % list.length];
}

function generateEmail(gender) {
  const holidays = buildHolidays(YEAR);
  const assets = ASSETS[gender];
  const pool = {};
  for (const [serie, titles] of Object.entries(assets)) pool[serie] = titles.map((t, i) => ({ id: serie + (i + 1), title: t }));

  const lastUsed = {};
  const rows = [];
  const start = new Date(Date.UTC(YEAR, 0, 1));
  const end = new Date(Date.UTC(YEAR, 11, 31));
  let week = 1;
  let i = 0;

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay();
    const slot = emailSlotFor(dow, week);
    if (!slot) { if (dow === 0) week++; continue; }

    const list = pool[slot.serie] || pool.A;
    let chosen = null, oldest = Infinity;
    for (const a of list) { const t = lastUsed[a.id] ?? -1; if (t < oldest) { oldest = t; chosen = a; } }
    lastUsed[chosen.id] = d.getTime();

    const h = holidays[key(d)];
    const holFree = h && h.prio >= 3 && (h.gen === "both" || h.gen === gender);

    rows.push({
      week,
      date: key(d),
      dow: ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"][dow],
      tip: holFree ? "Sărbătoare" : slot.tip,
      level: holFree ? "1-3" : slot.level,
      asset: holFree ? "—" : chosen.id,
      subject: holFree ? h.name + ": " + h.angle.slice(0, 28) : emailSubject(slot.tip, chosen.title, i++),
      angle: holFree ? h.angle : chosen.title,
      cta: holFree
        ? (h.commercial ? "CUMPĂRĂ ACUM" : (h.noCta ? "FĂRĂ CTA — doar empatie" : "Fără vânzare — doar empatie"))
        : slot.cta,
    });
  }
  return rows;
}

function fmtEmail(rows, gender) {
  const g = gender === "male" ? "BĂRBAȚI" : "FEMEI";
  let out = "# CALENDAR " + g + " — EMAIL " + YEAR + "\n\n";
  out += "> Generat automat. Regenerare: " + String.fromCharCode(96) + "node generator-calendar.mjs 2028" + String.fromCharCode(96) + "\n\n";
  out += "**Ritm:** Luni = poveste · Miercuri = mecanism/autoritate · Vineri = ofertă/dovadă. Total **" + rows.length + " emailuri**.\n\n";
  out += "**Reguli:** un singur CTA per email · subiect max 45 caractere · raport 4:1 valoare/ofertă · prima propoziție decide deschiderea următorului email.\n\n";
  out += "| Săpt. | Data | Tip | Nivel | Asset | Subiect (max 45 car.) | Unghi | CTA |\n";
  out += "|---|---|---|---|---|---|---|---|\n";
  let lastMonth = "";
  for (const r of rows) {
    const month = r.date.slice(0, 7);
    if (month !== lastMonth) {
      lastMonth = month;
      const luna = ["ianuarie","februarie","martie","aprilie","mai","iunie","iulie","august","septembrie","octombrie","noiembrie","decembrie"][parseInt(month.slice(5), 10) - 1];
      out += "| | **" + luna.toUpperCase() + "** | | | | | | |\n";
    }
    const d = r.date.slice(8) + "." + r.date.slice(5, 7);
    const subj = r.subject.length > 45 ? r.subject.slice(0, 42) + "…" : r.subject;
    const ang = r.angle.length > 80 ? r.angle.slice(0, 77) + "…" : r.angle;
    out += "| " + r.week + " | " + d + " | " + r.tip + " | " + r.level + " | " + r.asset + " | " + subj + " | " + ang + " | " + r.cta + " |\n";
  }
  return out;
}

for (const gender of ["male", "female"]) {
  const erows = generateEmail(gender);
  const ename = gender === "male" ? "04-CALENDAR-BARBATI-EMAIL.md" : "05-CALENDAR-FEMEI-EMAIL.md";
  fs.writeFileSync(path.join(OUT, ename), fmtEmail(erows, gender), "utf8");
  console.log(ename + " -> " + erows.length + " emailuri");
}

for (const gender of ["male", "female"]) {
  const rows = generate(gender);
  const name = gender === "male" ? "02-CALENDAR-BARBATI-SOCIAL.md" : "03-CALENDAR-FEMEI-SOCIAL.md";
  fs.writeFileSync(path.join(OUT, name), fmt(rows, gender), "utf8");
  const holidays = rows.filter((r) => r.holiday && r.holiday.prio >= 3).length;
  console.log(name + " -> " + rows.length + " zile, " + holidays + " zile de sărbătoare majoră");
}
console.log("\nAn generat: " + YEAR);
