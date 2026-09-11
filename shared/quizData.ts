/**
 * Quiz questions, scoring logic, and observation generators.
 * Shared between client (rendering) and server (validation).
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
  // Q0 — gender (needed for the funnel + personalized results)
  { section: "PASUL 1", text: "Selectează una din afirmațiile de mai jos:", multi: false,
    options: ["Sunt femeie și sunt curioasă ce șanse de împăcare mai am cu el", "Sunt bărbat și sunt curios ce șanse de împăcare mai am cu ea"] },
  // Q1 — the situation (who initiated / still together / complicated)
  { section: "SECȚIUNEA 1 — SITUAȚIA VOASTRĂ", text: "Cel mai bine situația mea se descrie astfel:", multi: false,
    options: {
      f: ["Ne-am despărțit și el a inițiat despărțirea", "Ne-am despărțit și eu am inițiat-o, dar acum regret", "Am decis împreună să ne luăm o pauză", "Suntem încă împreună, dar relația se destramă — certuri, distanță emoțională", "E complicat — nu suntem nici împreună, nici complet despărțiți"],
      m: ["Ne-am despărțit și ea a inițiat despărțirea", "Ne-am despărțit și eu am inițiat-o, dar acum regret", "Am decis împreună să ne luăm o pauză", "Suntem încă împreună, dar relația se destramă — certuri, distanță emoțională", "E complicat — nu suntem nici împreună, nici complet despărțiți"]
    }},
  // Q2 — how much history/investment there is (strong predictor)
  { section: "SECȚIUNEA 1 — SITUAȚIA VOASTRĂ", text: "Cât a durat relația voastră?", multi: false,
    options: ["Sub 6 luni", "Între 6 luni și 1 an", "Între 1 și 3 ani", "Peste 3 ani"] },
  // Q3 — breakup pattern (repeat breakups vs first time)
  { section: "SECȚIUNEA 1 — SITUAȚIA VOASTRĂ", text: "V-ați mai despărțit în trecut?", multi: false,
    options: ["Da, de mai multe ori", "Da, o singură dată", "Nu, aceasta este prima oară", "Încă suntem împreună"] },
  // Q4 — current communication (the #1 indicator)
  { section: "SECȚIUNEA 2 — SITUAȚIA ACTUALĂ", text: "În acest moment, comunicarea dintre voi arată cam așa:", multi: false,
    options: {
      f: ["Vorbim în fiecare zi, dar simt că ceva s-a schimbat", "Vorbim ocazional, dar conversațiile sunt reci sau superficiale", "Nu am mai vorbit de câteva săptămâni", "Nu am mai vorbit de luni de zile", "Am încercat să-l contactez, dar mă ignoră sau răspunde sec", "Mă are la block"],
      m: ["Vorbim în fiecare zi, dar simt că ceva s-a schimbat", "Vorbim ocazional, dar conversațiile sunt reci sau superficiale", "Nu am mai vorbit de câteva săptămâni", "Nu am mai vorbit de luni de zile", "Am încercat să o contactez, dar mă ignoră sau răspunde sec", "Mă are la block"]
    }},
  // Q5 — infidelity (heavy weight either way)
  { section: "SECȚIUNEA 2 — SITUAȚIA ACTUALĂ", text: "A existat infidelitate în relația voastră?", multi: false,
    options: {
      f: ["Da, el m-a înșelat", "Da, eu l-am înșelat", "Da, amândoi am greșit", "Nu, nu a existat infidelitate"],
      m: ["Da, ea m-a înșelat", "Da, eu am înșelat-o", "Da, amândoi am greșit", "Nu, nu a existat infidelitate"]
    }},
  // Q6 — how they reacted at the breakup (attachment signal)
  { section: "SECȚIUNEA 2 — SITUAȚIA ACTUALĂ", text: { f: "Când s-au stricat lucrurile, cum a reacționat el?", m: "Când s-au stricat lucrurile, cum a reacționat ea?" }, multi: false,
    options: {
      f: ["A fost foarte furios și agresiv verbal", "A fost destul de supărat, dar fără scandal mare", "A fost trist și vizibil afectat", "A părut ușor trist, dar și-a revenit repede", "Nu a arătat nicio emoție — a fost complet rece"],
      m: ["A fost foarte furioasă și agresivă verbal", "A fost destul de supărată, dar fără scandal mare", "A fost tristă și vizibil afectată", "A părut ușor tristă, dar și-a revenit repede", "Nu a arătat nicio emoție — a fost complet rece"]
    }},
  // Q7 — current behavior toward you (multi — the full picture)
  { section: "SECȚIUNEA 2 — SITUAȚIA ACTUALĂ", text: { f: "Cum se comportă el acum față de tine?", m: "Cum se comportă ea acum față de tine?" }, hint: "Poți selecta mai multe variante", multi: true,
    options: {
      f: ["Este foarte rece și distant — pare că nu-i pasă deloc", "Alternează între momente în care e cald și momente în care e rece", "Este furios sau ostil — pare supărat pe mine", "Pare trist sau rănit, dar nu vrea să vorbească", "Se comportă normal, ca și cum nu s-ar fi întâmplat nimic", "Inițiază el contact uneori, dar apoi se retrage"],
      m: ["Este foarte rece și distantă — pare că nu-i pasă deloc", "Alternează între momente în care e caldă și momente în care e rece", "Este furioasă sau ostilă — pare supărată pe mine", "Pare tristă sau rănită, dar nu vrea să vorbească", "Se comportă normal, ca și cum nu s-ar fi întâmplat nimic", "Inițiază ea contact uneori, dar apoi se retrage"]
    }},
  // Q8 — is there someone else? (one of the heaviest factors)
  { section: "SECȚIUNEA 2 — SITUAȚIA ACTUALĂ", text: { f: "Știi dacă el este împreună cu altă fată în acest moment?", m: "Știi dacă ea este împreună cu alt bărbat în acest moment?" }, multi: false,
    options: {
      f: ["Da, știu sigur că este cu altcineva", "Nu sunt sigură, dar cred că da", "Nu cred, dar e posibil", "Nu, nu este cu nimeni"],
      m: ["Da, știu sigur că este cu altcineva", "Nu sunt sigur, dar cred că da", "Nu cred, dar e posibil", "Nu, nu este cu nimeni"]
    }},
  // Q9 — what they already tried (used for email personalization {incercari_reparare})
  { section: "SECȚIUNEA 3 — CE AI ÎNCERCAT", text: "Până acum, am încercat să repar lucrurile prin...", hint: "Poți selecta mai multe variante", multi: true,
    options: {
      f: ["I-am trimis mesaje lungi explicându-i ce simt", "Am încercat să-l fac gelos", "M-am rugat de el să ne mai dăm o șansă", "Am încercat să mă prefac că nu-mi pasă", "Nu am făcut nimic — nu știu ce ar trebui să fac"],
      m: ["I-am trimis mesaje lungi explicându-i ce simt", "Am încercat să o fac geloasă", "M-am rugat de ea să ne mai dăm o șansă", "Am încercat să mă prefac că nu-mi pasă", "Nu am făcut nimic — nu știu ce ar trebui să fac"]
    }}
];

/**
 * Calculate quiz score from answers.
 * Mirrors the original calcScore() exactly.
 */
export function calculateScore(answers: Record<number, number[]>): number {
  let sc = 54;
  // Q1 — situation: break-up initiated by them is hardest; pause/still-together is better
  if (answers[1]) sc += [-2, 2, 1, 3, 1][answers[1][0]] || 0;
  // Q2 — history: longer relationships weigh more
  if (answers[2]) sc += [1, 3, 6, 9][answers[2][0]] || 0;
  // Q3 — breakup pattern: first time is better than repeated breakups
  if (answers[3]) sc += [-3, 2, 0, 4][answers[3][0]] || 0;
  // Q4 — communication: talking daily is great, being blocked is the worst
  if (answers[4]) sc += [8, 4, 0, -4, -3, -9][answers[4][0]] || 0;
  // Q5 — infidelity: no infidelity is the best base
  if (answers[5]) sc += [-6, -8, -10, 5][answers[5][0]] || 0;
  // Q6 — reaction at breakup: visible sadness = attachment
  if (answers[6]) sc += [-2, 2, 5, 1, -5][answers[6][0]] || 0;
  // Q7 — current behavior (multi)
  if (answers[7]) { const m7 = [-3, 3, -4, 2, -1, 5]; answers[7].forEach((i) => { sc += m7[i] || 0; }); }
  // Q8 — someone else: the heaviest negative factor
  if (answers[8]) sc += [-10, -6, -2, 5][answers[8][0]] || 0;
  // Q9 — what they tried: begging/long messages hurt, doing nothing is neutral
  if (answers[9]) { const m9 = [-3, -2, -4, 1, 2]; answers[9].forEach((i) => { sc += m9[i] || 0; }); }
  // Clamp to 22-91 first
  sc = Math.max(22, Math.min(91, sc));
  // Add small random variation
  sc += Math.floor(Math.random() * 7) - 3;
  // Final clamp to 20-92
  return Math.max(20, Math.min(92, sc));
}

/**
 * Resolve a question for a specific gender.
 */
export function resolveQuestion(index: number, gender: Gender) {
  const q = QUIZ_QUESTIONS[index];
  const text = typeof q.text === "object" ? (gender === "M" ? q.text.m : q.text.f) : q.text;
  const options = Array.isArray(q.options) ? q.options : (gender === "M" ? q.options.m : q.options.f);
  return { section: q.section, text, hint: q.hint || "", multi: q.multi, options };
}

/**
 * Get urgency text based on score.
 */
export function getUrgencyText(score: number): string {
  if (score >= 78) return `Testul arată că ai <strong>${score}% șanse de împăcare</strong>. Acesta este un rezultat bun — dar chiar și cele mai mari șanse se pot pierde dacă faci mișcările greșite. Avantajul tău există <em>acum</em>. Nu mâine.`;
  if (score >= 60) return `Testul arată că ai <strong>${score}% șanse de împăcare</strong>. Există o șansă reală — dar contează enorm ce faci cu ea și cât de repede acționezi.`;
  if (score >= 44) return `Testul arată că ai <strong>${score}% șanse de împăcare</strong>. Situația nu este pierdută — dar tot ce faci greșit acum îndepărtează și mai mult. Trebuie să schimbi abordarea imediat.`;
  return `Testul arată că ai <strong>${score}% șanse de împăcare</strong>. Știm că nu e ceea ce voiai să auzi. Tocmai de aceea e vital să acționezi acum — nu mâine, nu săptămâna viitoare. Fiecare zi contează.`;
}

/**
 * Get bar color gradient based on score.
 */
export function getBarColor(score: number): string {
  if (score >= 78) return "linear-gradient(90deg,#15803d,#22c55e)";
  if (score >= 60) return "linear-gradient(90deg,#b45309,#f59e0b)";
  return "linear-gradient(90deg,#b91c1c,#ef4444)";
}
