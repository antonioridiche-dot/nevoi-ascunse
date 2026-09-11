/**
 * Testul „Cât la sută te-ai vindecat?" — pestedespartire.ro
 * Shared between client (rendering) and server (validation).
 *
 * Rezultatul e un PROCENT DE VINDECARE (0-100).
 * Procent MIC = durerea inca te tine pe loc.
 * Procent MARE = esti pe drumul bun.
 */

export type Gender = "M" | "F";

export interface QuizQuestion {
  section: string;
  text: string | { f: string; m: string };
  hint?: string;
  multi: boolean;
  options: string[] | { f: string[]; m: string[] };
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Q0 — gen (pentru personalizare)
  { section: "PASUL 1", text: "Selectează una din afirmațiile de mai jos:", multi: false,
    options: ["Sunt femeie și vreau să aflu cât de mult m-am vindecat după despărțire", "Sunt bărbat și vreau să aflu cât de mult m-am vindecat după despărțire"] },

  // Q1 — de cat timp s-a terminat
  { section: "SECȚIUNEA 1 — UNDE EȘTI ACUM", text: "De cât timp v-ați despărțit?", multi: false,
    options: ["Mai puțin de o lună", "Între 1 și 3 luni", "Între 3 luni și un an", "Peste un an"] },

  // Q2 — cat a durat relatia (cu cat mai lunga, cu atat vindecarea e mai grea)
  { section: "SECȚIUNEA 1 — UNDE EȘTI ACUM", text: "Cât a durat relația voastră?", multi: false,
    options: ["Sub 6 luni", "Între 6 luni și 1 an", "Între 1 și 3 ani", "Peste 3 ani"] },

  // Q3 — cat de des te gandesti la el/ea (cel mai bun indicator)
  { section: "SECȚIUNEA 1 — UNDE EȘTI ACUM", text: { f: "Cât de des te gândești la el acum?", m: "Cât de des te gândești la ea acum?" }, multi: false,
    options: ["Constant — de la prima secundă când mă trezesc", "De mai multe ori pe zi, dar pot funcționa", "Din când în când, dar nu mă mai doare", "Foarte rar — aproape deloc"] },

  // Q4 — verificatul retelelor (impulsul cel mai greu de rupt)
  { section: "SECȚIUNEA 2 — CE SE ÎNTÂMPLĂ ÎN TINE", text: "Cât de des îi verifici rețelele sociale sau ultima conectare?", multi: false,
    options: ["Zilnic, uneori de mai multe ori pe zi", "De câteva ori pe săptămână", "Rar, doar când apare ceva", "Nu mai simt nevoia deloc"] },

  // Q5 — reactia cand il/o vezi sau auzi de el/ea
  { section: "SECȚIUNEA 2 — CE SE ÎNTÂMPLĂ ÎN TINE", text: { f: "Ce simți când vezi o poză cu el sau auzi numele lui?", m: "Ce simți când vezi o poză cu ea sau auzi numele ei?" }, multi: false,
    options: ["Mă doare fizic, parcă mi se strânge pieptul", "Îmi vine un nod în stomac și mă întristez", "Simt ceva, dar trece repede", "Nimic. E ca orice alt om"] },

  // Q6 — mai speri la o impacare (speranta blocheaza vindecarea)
  { section: "SECȚIUNEA 2 — CE SE ÎNTÂMPLĂ ÎN TINE", text: "Cât de mult mai speri că vă veți împăca?", multi: false,
    options: ["Sper în fiecare zi — nu pot renunța la gândul ăsta", "Mai sper, dar mai rar", "Am acceptat că s-a terminat", "Nu mai vreau să mă împac"] },

  // Q7 — somn, pofta de mancare, energie
  { section: "SECȚIUNEA 2 — CE SE ÎNTÂMPLĂ ÎN TINE", text: "Cum îți sunt somnul, pofta de mâncare și energia în ultima perioadă?", multi: false,
    options: ["Foarte rău — nu dorm, nu mănânc, nu am energie", "Destul de rău, dar funcționez cumva", "Variabil, dar spre bine", "Bine — dorm și mănânc normal"] },

  // Q8 — ce ai incercat ca sa treci peste (multi)
  { section: "SECȚIUNEA 3 — CE AI ÎNCERCAT", text: "Ce ai încercat până acum ca să treci peste?", hint: "Poți selecta mai multe variante", multi: true,
    options: {
      f: ["Am încercat să-l uit forțat, dar nu reușesc", "M-am ocupat de altceva ca să nu mă gândesc", "Am vorbit cu prietenele până m-am plictisit de subiect", "Am încercat să ies cu alți bărbați", "Am citit articole pe internet", "Nimic concret — doar aștept să treacă"],
      m: ["Am încercat s-o uit forțat, dar nu reușesc", "M-am ocupat de altceva ca să nu mă gândesc", "Am vorbit cu prietenii până m-am plictisit de subiect", "Am încercat să ies cu alte femei", "Am citit articole pe internet", "Nimic concret — doar aștept să treacă"]
    }},

  // Q9 — ce eviti din cauza lui/ei (multi)
  { section: "SECȚIUNEA 3 — CE AI ÎNCERCAT", text: "Ce eviți să faci din cauza despărțirii?", hint: "Poți selecta mai multe variante", multi: true,
    options: ["Evit locurile în care am fost împreună", "Evit să ascult anumite melodii", "Evit să vorbesc despre asta cu cineva", "Am renunțat la lucruri care îmi plăceau", "Nu evit nimic — merg înainte"]
  }
];

/**
 * Calculeaza procentul de vindecare (0-100).
 * Procent mic = inca esti blocat; procent mare = esti pe drumul bun.
 */
export function calculateScore(answers: Record<number, number[]>): number {
  let sc = 30;
  // Q1 — de cat timp: mai mult timp = usor mai bine, dar timpul singur nu vindeca
  if (answers[1]) sc += [0, 2, 4, 5][answers[1][0]] || 0;
  // Q2 — relatia lunga = rana mai adanca
  if (answers[2]) sc += [4, 2, 0, -3][answers[2][0]] || 0;
  // Q3 — cat de des te gandesti (cel mai greu indicator)
  if (answers[3]) sc += [-12, -6, 10, 18][answers[3][0]] || 0;
  // Q4 — verificatul retelelor
  if (answers[4]) sc += [-12, -5, 6, 16][answers[4][0]] || 0;
  // Q5 — reactia la poza/nume
  if (answers[5]) sc += [-10, -5, 6, 15][answers[5][0]] || 0;
  // Q6 — speranta la impacare (speranta blocheaza vindecarea)
  if (answers[6]) sc += [-10, -3, 10, 16][answers[6][0]] || 0;
  // Q7 — somn, mancare, energie
  if (answers[7]) sc += [-12, -5, 5, 14][answers[7][0]] || 0;
  // Q8 — ce a incercat (multi): metodele care chiar ajuta dau puncte
  if (answers[8]) { const m8 = [-4, 3, 2, -2, 1, -6]; answers[8].forEach((i) => { sc += m8[i] || 0; }); }
  // Q9 — ce eviti (multi): evitarea tine omul blocat
  if (answers[9]) { const m9 = [-4, -3, -4, -3, 12]; answers[9].forEach((i) => { sc += m9[i] || 0; }); }

  sc = Math.max(11, Math.min(86, sc));
  sc += Math.floor(Math.random() * 7) - 3;
  return Math.max(9, Math.min(89, sc));
}

/** Resolve a question for a specific gender. */
export function resolveQuestion(index: number, gender: Gender) {
  const q = QUIZ_QUESTIONS[index];
  const text = typeof q.text === "object" ? (gender === "M" ? q.text.m : q.text.f) : q.text;
  const options = Array.isArray(q.options) ? q.options : (gender === "M" ? q.options.m : q.options.f);
  return { section: q.section, text, hint: q.hint || "", multi: q.multi, options };
}

/**
 * Textul afisat sub rezultat. Cu cat procentul e mai mic, cu atat mesajul e mai
 * direct — pentru ca exact acei oameni au nevoie de ajutor.
 */
export function getUrgencyText(score: number): string {
  if (score >= 72) return `Testul arată că te-ai vindecat în proporție de <strong>${score}%</strong>. Ești pe drumul cel bun — dar ultima parte e cea care decide dacă treci complet peste sau rămâi cu o sensibilitate care te va durea la următoarea relație.`;
  if (score >= 52) return `Testul arată că te-ai vindecat în proporție de <strong>${score}%</strong>. Ai făcut progres real, dar ești în zona în care oamenii se blochează cel mai des — destul de bine ca să funcționezi, destul de rău ca să nu fii liber.`;
  if (score >= 32) return `Testul arată că te-ai vindecat în proporție de <strong>${score}%</strong>. Durerea încă îți ocupă mult din zi. Nu e vina ta — pur și simplu nu ai folosit metoda care chiar funcționează pe creier.`;
  return `Testul arată că te-ai vindecat în proporție de <strong>${score}%</strong>. Ești încă în miezul durerii, iar timpul singur nu te va scoate de acolo. Vestea bună e că se poate repara — și se repară mai repede decât crezi.`;
}

/** Culoarea barei de progres. */
export function getBarColor(score: number): string {
  if (score >= 72) return "linear-gradient(90deg,#15803d,#22c55e)";
  if (score >= 52) return "linear-gradient(90deg,#b45309,#f59e0b)";
  return "linear-gradient(90deg,#b91c1c,#ef4444)";
}
