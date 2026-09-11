/**
 * VERIFICATOR DE SISTEM — Te Vreau Inapoi
 * ========================================
 *   node verifica-sistem.mjs
 *
 * Verifica automat:
 *   1. Ce active sunt SCRISE vs. ce e planificat in generator (68 per gen)
 *   2. Daca vreun asset se repeta la mai putin de 21 de zile in calendar
 *   3. Distributia pe niveluri de constientizare vs. tinta 20/30/25/15/10
 *   4. ID-urile din calendar care nu exista in biblioteca
 */

import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const read = (f) => { try { return fs.readFileSync(path.join(DIR, f), "utf8"); } catch { return ""; } };

// ── 1. Activele planificate (din generator) ──
const gen = read("generator-calendar.mjs");
const planned = {};
for (const gen2 of ["male", "female"]) {
  const block = gen.split(gen2 + ": {")[1];
  if (!block) continue;
  planned[gen2] = [];
  for (const serie of ["A", "C", "P", "B", "I", "D", "E", "O"]) {
    const re = new RegExp(serie + ": \\[([\\s\\S]*?)\\],");
    const m = block.match(re);
    if (!m) continue;
    const titles = m[1].split(/","|",\s*$/).length;
    // numaram elementele din array
    const items = m[1].match(/"[^"]*"/g) || [];
    items.forEach((_, i) => planned[gen2].push(serie + (i + 1)));
  }
}

// ── 2. Activele scrise (din fisierele de biblioteca) ──
const bibFiles = fs.readdirSync(DIR).filter((f) => /^0[6-9]|^1[01]/.test(f) && f.endsWith(".md"));
const written = { male: new Set(), female: new Set() };
for (const f of bibFiles) {
  const txt = read(f);
  const isFemale = /FEMEI/.test(f) || /FEMEI/.test(txt.slice(0, 300));
  const ids = [...txt.matchAll(/^## ([ACPBDIEO]\d+) ·/gm)].map((m) => m[1]);
  for (const id of ids) (isFemale ? written.female : written.male).add(id);
}

// ── 3. Verificare acoperire ──
console.log("\n════════ 1. ACOPERIRE BIBLIOTECA ════════");
for (const g of ["male", "female"]) {
  const label = g === "male" ? "BĂRBAȚI" : "FEMEI";
  const plan = planned[g] || [];
  const have = written[g];
  const missing = plan.filter((id) => !have.has(id));
  const bySerie = {};
  for (const id of plan) {
    const s = id[0];
    bySerie[s] = bySerie[s] || { total: 0, done: 0 };
    bySerie[s].total++;
    if (have.has(id)) bySerie[s].done++;
  }
  console.log("\n" + label + ": " + have.size + " / " + plan.length + " active scrise (" + Math.round(have.size / plan.length * 100) + "%)");
  for (const [s, v] of Object.entries(bySerie)) {
    const bar = "█".repeat(Math.round(v.done / v.total * 10)).padEnd(10, "░");
    console.log("   " + s + " " + bar + " " + v.done + "/" + v.total);
  }
  if (missing.length && missing.length <= 30) console.log("   lipsesc: " + missing.join(", "));
  else if (missing.length) console.log("   lipsesc: " + missing.slice(0, 30).join(", ") + " … (+" + (missing.length - 30) + ")");
}

// ── 4. Verificare rotatie in calendar ──
console.log("\n════════ 2. ROTAȚIE (minim 21 de zile între repetări) ════════");
for (const f of ["02-CALENDAR-BARBATI-SOCIAL.md", "03-CALENDAR-FEMEI-SOCIAL.md"]) {
  const txt = read(f);
  if (!txt) { console.log(f + ": lipsește"); continue; }
  const rows = [...txt.matchAll(/^\| (\d{2}\.\d{2}) \|.*?\| ([ACPBDIEO]\d+) \|/gm)].map((m) => ({ date: m[1], id: m[2] }));
  const last = {};
  let violations = 0;
  const gaps = [];
  for (const r of rows) {
    if (last[r.id]) {
      const [d1, m1] = last[r.id].split(".").map(Number);
      const [d2, m2] = r.date.split(".").map(Number);
      const days = (m2 - m1) * 30 + (d2 - d1);
      gaps.push(days);
      if (days < 21) violations++;
    }
    last[r.id] = r.date;
  }
  const avg = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;
  const min = gaps.length ? Math.min(...gaps) : 0;
  console.log(f.replace(".md", "") + ": " + rows.length + " piese · distanță medie între repetări: " + avg + " zile · minim: " + min + " zile · încălcări (<21): " + violations);
}

// ── 5. Distributia pe niveluri ──
console.log("\n════════ 3. DISTRIBUȚIA PE PILONI (țintă din strategie) ════════");
const tinta = { A: 20, C: 20, P: 15, B: 15, I: 12, D: 8, E: 5, O: 5 };
const nume = { A: "Autoritate", C: "Curiozitate", P: "Poveste", B: "Credințe", I: "Permisiune", D: "Identitate", E: "Engagement", O: "Ofertă" };
for (const f of ["02-CALENDAR-BARBATI-SOCIAL.md"]) {
  const txt = read(f);
  const rows = [...txt.matchAll(/^\| \d{2}\.\d{2} \|.*?\| ([ACPBDIEO])\d+ \|/gm)].map((m) => m[1]);
  const count = {};
  for (const s of rows) count[s] = (count[s] || 0) + 1;
  const total = rows.length;
  console.log("\n" + f.replace(".md", "") + " (" + total + " piese):");
  for (const s of ["A", "C", "P", "B", "I", "D", "E", "O"]) {
    const pct = Math.round((count[s] || 0) / total * 100);
    const diff = pct - tinta[s];
    const mark = Math.abs(diff) <= 4 ? "✅" : (Math.abs(diff) <= 8 ? "⚠️ " : "❌");
    console.log("   " + mark + " " + nume[s].padEnd(12) + String(pct).padStart(3) + "%  (țintă " + tinta[s] + "%)");
  }
}

// ── 6. VERIFICARE EMAILURI ──
console.log("\n════════ 5. CALITATE EMAILURI ════════");
const emailQ = fs.readdirSync(DIR).filter((f) => /EMAILURI/i.test(f) && f.endsWith(".md"));
if (!emailQ.length) {
  console.log("  (niciun fișier de emailuri încă)");
} else {
  for (const f of emailQ) {
    const t = read(f);
    const emails = [...t.matchAll(/^## (S\d+ · [^\n]+)/gm)].length;
    const subiecte = [...t.matchAll(/^\*\*Subiect:\*\* (.+)$/gm)].map((m) => m[1].replace(/\*\*/g, "").trim());
    const lungi = subiecte.filter((s) => s.length > 45);
    const cta = (t.match(/^👉/gm) || []).length;
    const ps = (t.match(/^P\.S\./gm) || []).length;
    const interzis = [
      [/\b9[0-9]%\s+(dintre|din)/i, "procent inventat"],
      [/garantat\s+(că\s+)?(se|o)\s+(împac|recuper)/i, "promisiune garantată"],
      [/(o\s+forțezi|nu\s+va\s+avea\s+de\s+ales)/i, "coerciție"],
    ].filter(([re]) => re.test(t)).map(([, n]) => n);
    const bad = (t.match(/Ã|Å|È|Ä|â€/g) || []).length;
    const ok = emails > 0 && lungi.length === 0 && ps >= emails && !interzis.length && bad === 0;
    console.log("  " + (ok ? "✅" : "⚠️ ") + " " + f.padEnd(30) + " emailuri: " + String(emails).padStart(3) + " · CTA: " + String(cta).padStart(3) + " · P.S.: " + String(ps).padStart(3));
    if (lungi.length) console.log("        ❌ " + lungi.length + " subiecte peste 45 caractere: " + JSON.stringify(lungi.slice(0, 2)));
    if (interzis.length) console.log("        ❌ formulări interzise: " + interzis.join(", "));
    if (bad) console.log("        ❌ encoding corupt: " + bad + " caractere");
    if (ps < emails) console.log("        ⚠️  " + (emails - ps) + " emailuri fără P.S.");
  }
}

// ── 7. Structura fiecarui fisier de emailuri ──
console.log("\n════════ 6. STRUCTURĂ EMAILURI ════════");
const emailStruct = fs.readdirSync(DIR).filter((f) => /^1[3-9]-EMAILURI/.test(f));
if (!emailStruct.length) {
  console.log("  (niciun fișier de emailuri încă)");
} else {
  let totalEmail = 0;
  for (const f of emailStruct.sort()) {
    const t = read(f);
    const emailuri = t.split(/^## /m).slice(1).filter((b) => /^S\d+ ·/.test(b));
    const subiect = (t.match(/^\*\*Subiect:\*\*/gm) || []).length;
    const preview = (t.match(/^\*\*Preview:\*\*/gm) || []).length;
    const ps = (t.match(/^P\.S\./gm) || []).length;
    const ctaMultiplu = emailuri.filter((b) => (b.match(/👉/g) || []).length > 1).length;
    const subiecteLungi = [...t.matchAll(/^\*\*Subiect:\*\* (.+)$/gm)].map((m) => m[1]).filter((s) => s.length > 45).length;
    const sapt = [...new Set([...t.matchAll(/^## S(\d+) ·/gm)].map((m) => Number(m[1])))].sort((a, b) => a - b);
    totalEmail += emailuri.length;
    const ok = subiect === emailuri.length && preview === emailuri.length && ps === emailuri.length && ctaMultiplu === 0 && subiecteLungi === 0;
    console.log("  " + (ok ? "✅" : "⚠️ ") + " " + f.padEnd(30) + String(emailuri.length).padStart(3) + " emailuri" +
      (sapt.length ? "  S" + sapt[0] + "-S" + sapt[sapt.length - 1] : "") +
      "  subiecte lungi: " + subiecteLungi + "  CTA dublu: " + ctaMultiplu);
  }
  console.log("  TOTAL: " + totalEmail + " / 314 emailuri (" + Math.round(totalEmail / 314 * 100) + "%)");
}

// ── 8. ID-uri orfane in calendar ──
console.log("\n════════ 8. ID-URI DIN CALENDAR FĂRĂ ASSET SCRIS ════════");
for (const [f, g] of [["02-CALENDAR-BARBATI-SOCIAL.md", "male"], ["03-CALENDAR-FEMEI-SOCIAL.md", "female"]]) {
  const txt = read(f);
  const ids = [...new Set([...txt.matchAll(/\| ([ACPBDIEO]\d+) \|/g)].map((m) => m[1]))];
  const orphan = ids.filter((id) => !written[g].has(id));
  console.log(f.replace(".md", "") + ": " + orphan.length + " ID-uri fără conținut scris" + (orphan.length ? " -> " + orphan.slice(0, 20).join(", ") : " ✅"));
}
// ── 8. Acoperirea bibliotecii de EMAILURI ──
console.log("\n════════ 7. ACOPERIRE EMAILURI (157 per gen) ════════");
const emailCov = fs.readdirSync(DIR).filter((f) => /^1[3-9]-EMAILURI/.test(f));
for (const gen of ["BARBATI", "FEMEI"]) {
  const mele = emailCov.filter((f) => f.includes(gen));
  let count = 0;
  const sapt = new Set();
  for (const f of mele) {
    const t = read(f);
    const m = [...t.matchAll(/^## S(\d+) ·/gm)];
    count += m.length;
    m.forEach((x) => sapt.add(Number(x[1])));
  }
  const maxSapt = sapt.size ? Math.max(...sapt) : 0;
  const pct = Math.round(count / 157 * 100);
  const bar = "█".repeat(Math.round(pct / 5)).padEnd(20, "░");
  console.log("  " + gen.padEnd(8) + " " + bar + " " + count + "/157 emailuri (" + pct + "%) · săptămâni: " + (sapt.size ? "1–" + maxSapt : "0"));
  if (mele.length) console.log("           fișiere: " + mele.sort().join(", "));
}
console.log("");
