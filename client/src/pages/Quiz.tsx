import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { QUIZ_QUESTIONS, resolveQuestion, calculateScore, getUrgencyText, getBarColor, type Gender } from "../../../shared/quizData";

type Screen = "intro" | "quiz" | "email" | "loading" | "results";

export default function Quiz() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [gender, setGender] = useState<Gender>("F");
  const [email, setEmail] = useState("");
  const [score, setScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [emailError, setEmailError] = useState(false);

  const submitMutation = trpc.quiz.submit.useMutation();

  // Get affiliate code from URL
  const [affiliateCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") || undefined;
  });

  const resolved = resolveQuestion(currentQ, gender);
  const totalQuestions = QUIZ_QUESTIONS.length;
  const progress = Math.round((currentQ / totalQuestions) * 100);

  const handleSelect = useCallback((questionIndex: number, optionIndex: number, multi: boolean) => {
    setAnswers(prev => {
      const current = prev[questionIndex] || [];
      let updated: number[];
      if (multi) {
        const idx = current.indexOf(optionIndex);
        updated = idx > -1 ? current.filter(i => i !== optionIndex) : [...current, optionIndex];
      } else {
        updated = [optionIndex];
      }
      // Set gender from Q0
      if (questionIndex === 0) {
        setGender(optionIndex === 0 ? "F" : "M");
      }
      return { ...prev, [questionIndex]: updated };
    });

    // Auto-advance for single-select. Advance by the answered index directly —
    // the old code called a memoized handleNext that captured a stale (empty)
    // `answers` from the first render, so the quiz froze on question 1.
    if (!multi) {
      setTimeout(() => {
        setCurrentQ((q) => {
          const next = questionIndex + 1;
          if (next >= totalQuestions) { setScreen("email"); return q; }
          window.scrollTo({ top: 0, behavior: "smooth" });
          return next;
        });
      }, 350);
    }
  }, [totalQuestions]);

  const handleNext = useCallback((fromQ?: number) => {
    const q = fromQ !== undefined ? fromQ : currentQ;
    const a = answers[q];
    if (!a || a.length === 0) return;
    const next = q + 1;
    if (next >= totalQuestions) {
      setScreen("email");
    } else {
      setCurrentQ(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQ, answers, totalQuestions]);

  const handleBack = useCallback(() => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQ]);

  const handleSubmit = async () => {
    if (!email || !email.includes("@") || !email.includes(".")) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    const sc = calculateScore(answers);
    setScore(sc);
    setScreen("loading");

    // Persist identity for the rest of the funnel (checkout, upsells, book delivery).
    // Without this, checkout has no email and buyers can't download their book.
    localStorage.setItem("tvii_email", email);
    if (affiliateCode) localStorage.setItem("tvii_affiliate", affiliateCode);

    // Submit to backend
    submitMutation.mutate({
      email,
      gender: gender === "F" ? "female" : "male",
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v])),
      affiliateCode,
    }, {
      onSuccess: (data) => {
        if (data?.contactId) localStorage.setItem("tvii_contact_id", String(data.contactId));
      },
    });

    // Show loading animation then results
    setTimeout(() => {
      setScreen("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Animate score counter
      let c = 0;
      const interval = setInterval(() => {
        c++;
        setAnimatedScore(c);
        if (c >= sc) clearInterval(interval);
      }, 30);
    }, 3900);
  };

  // Fire Facebook Pixel events
  useEffect(() => {
    if (screen === "intro") {
      // @ts-ignore
      if (window.fbq) window.fbq("track", "ViewContent", { content_name: "Quiz Page" });
    }
    if (screen === "results") {
      // @ts-ignore
      if (window.fbq) window.fbq("track", "Lead", { value: score, currency: "RON" });
    }
  }, [screen, score]);

  const letters = "ABCDEFGHIJKLMNOP";

  return (
    <div className="qz-wrap">
      {/* INTRO */}
      {screen === "intro" && (
        <div className="qz-screen active">
          <div className="qz-brand">✦ pestedespartire.ro</div>
          <div className="qz-card">
            <div className="qz-tag">Test gratuit • 1 minut</div>
            <h1 className="qz-h1">
              Ai trecut peste despărțire sau încă o porți în tine? <em>Află în 1 minut.</em>
            </h1>
            <p className="qz-sub">
              Răspunde sincer la câteva întrebări și afli imediat <strong>cât la sută te-ai vindecat</strong> după despărțire.
              Nu e un test de personalitate — e o radiografie a stării în care ești acum, ca să știi exact de unde pornești.
            </p>
            <button className="qz-btn" onClick={() => { setScreen("quiz"); setCurrentQ(0); }}>
              ÎNCEPE TESTUL GRATUIT →
            </button>
            <div className="qz-trust">
              <span>🔒 100% confidențial</span>
              <span>⏱️ 1 minut</span>
              <span>📊 Rezultat personalizat</span>
            </div>
          </div>
          <div className="qz-faq">
            <FaqItem q="Cum funcționează acest test?" a="Testul folosește o serie de întrebări care identifică mai mulți factori despre situația ta — mulți dintre ei dovediți că influențează nivelul tău de vindecare. Un algoritm analizează răspunsurile tale și calculează un procentaj personalizat bazat pe situația ta concretă." />
            <FaqItem q="Cât de precise sunt rezultatele?" a="Testul a fost dezvoltat și calibrat cu atenție, astfel încât rezultatele să fie cât mai relevante. Cu cât răspunzi mai sincer la fiecare întrebare, cu atât procentajul tău va reflecta mai fidel situația ta reală." />
            <FaqItem q="Cine a creat acest test?" a="Întrebările testului și algoritmul de calcul au fost create de Cristina Munteanu, autoare și coach de relații din București." />
          </div>
        </div>
      )}

      {/* QUIZ */}
      {screen === "quiz" && (
        <div className="qz-screen active">
          <div className="qz-prog-wrap">
            <div className="qz-prog-meta">
              <span>Întrebarea {currentQ + 1} din {totalQuestions}</span>
              <span>{progress}%</span>
            </div>
            <div className="qz-prog-bg">
              <div className="qz-prog-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="qz-card">
            <div className="qz-qnum">{resolved.section}</div>
            <div className="qz-qtext">{resolved.text}</div>
            {resolved.hint && <div className="qz-qhint">{resolved.hint}</div>}
            <div className="qz-options">
              {resolved.options.map((opt, i) => (
                <button
                  key={i}
                  className={`qz-opt${resolved.multi ? " multi-mode" : ""}${answers[currentQ]?.includes(i) ? " sel" : ""}`}
                  onClick={() => handleSelect(currentQ, i, resolved.multi)}
                >
                  <span className="qz-indicator">
                    <span className="ql">{letters[i]}</span>
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <div className="qz-nav">
              <button
                className="qz-back"
                onClick={handleBack}
                style={{ visibility: currentQ > 0 ? "visible" : "hidden" }}
              >
                ← Înapoi
              </button>
              {resolved.multi && (
                <button
                  className="qz-btn"
                  disabled={!answers[currentQ] || answers[currentQ].length === 0}
                  onClick={() => handleNext()}
                  style={{ maxWidth: 320 }}
                >
                  {currentQ === totalQuestions - 1 ? "FINALIZEAZĂ TESTUL →" : "Continuă →"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMAIL */}
      {screen === "email" && (
        <div className="qz-screen active">
          <div className="qz-brand">✦ pestedespartire.ro</div>
          <div className="qz-card" style={{ textAlign: "center" }}>
            <h2 className="qz-h2">Ai terminat testul!</h2>
            <p className="qz-sub">
              Algoritmul nostru îți va analiza situația și îți va explica ce e de făcut în continuare. Nu te costă nimic să vezi rezultatele.
              <br /><br />
              Introdu adresa de email mai jos și apasă butonul pentru a-ți vedea imediat rezultatul.
            </p>
            <div style={{ textAlign: "left" }}>
              <label className="qz-label">Adresa ta de email</label>
              <input
                className="qz-input"
                type="email"
                placeholder="adresa@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                style={emailError ? { borderColor: "#b91c1c" } : {}}
              />
            </div>
            <button className="qz-btn" onClick={handleSubmit}>
              ARATĂ-MI CE ȘANSE DE ÎMPĂCARE MAI AM →
            </button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {screen === "loading" && <LoadingScreen />}

      {/* RESULTS */}
      {screen === "results" && (
        <ResultsScreen score={score} animatedScore={animatedScore} answers={answers} gender={gender} />
      )}
    </div>
  );
}

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = ["Analizez situația ta...", "Calculez factorii de atașament...", "Evaluez comportamentul partenerului...", "Generez raportul tău personalizat..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1));
    }, 950);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="qz-screen active">
      <div className="qz-brand">✦ pestedespartire.ro</div>
      <div className="qz-card">
        <div className="qz-loading">
          <div className="qz-spinner" />
          <div className="qz-loading-text">Se analizează răspunsurile tale...</div>
          <div className="qz-loading-step">{steps[step]}</div>
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({ score, animatedScore, answers, gender }: { score: number; animatedScore: number; answers: Record<number, number[]>; gender: Gender }) {
  const barColor = getBarColor(score);
  const urgency = getUrgencyText(score);
  const observations = buildObservations(answers, gender);
  const isMale = gender === "M";
  const link = isMale ? "/barbati/biblie" : "/femei/biblie";
  const Pei = isMale ? "ei" : "lui";
  const vaFace = isMale ? "o va face" : "îl va face";
  const ideea = isMale ? "ideea ei" : "ideea lui";
  const persoane = isMale ? "bărbați" : "femei";
  const pronCei = isMale ? "cei" : "cele";
  const fricaQ = isMale ? "o face" : "îl face";
  const propuna = isMale ? "să-ți propună ea prima" : "să-ți propună el primul";

  return (
    <div className="qz-screen active">
      <div className="qz-brand">✦ pestedespartire.ro</div>
      <div className="qz-card">
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div className="qz-tag">REZULTATUL TĂU PERSONALIZAT</div>
        </div>
        <h2 className="qz-h2" style={{ textAlign: "center" }}>Cât Te-Ai Vindecat După Despărțire</h2>
        <div className="qz-pct-display">{animatedScore}</div>
        <div style={{ textAlign: "center", fontSize: 32, color: "var(--acc)", marginTop: -4, fontWeight: 800 }}>%</div>
        <div className="qz-pct-label">vindecat</div>
        <div className="qz-bar-bg">
          <div className="qz-bar-fill" style={{ width: `${score}%`, background: barColor }} />
        </div>
        <div className="qz-urgency" dangerouslySetInnerHTML={{ __html: urgency }} />
        <hr className="qz-divider" />
        <h2 className="qz-h2">Observații Pe Baza Situației Tale</h2>
        {observations.map((obs, i) => (
          <div key={i} className="qz-obs-item">
            <div className="qz-obs-icon">{obs.icon}</div>
            <div className="qz-obs-content" dangerouslySetInnerHTML={{ __html: obs.text }} />
          </div>
        ))}

        {/* Bridge */}
        <div className="qz-bridge">
          Procentul de mai sus nu spune cât de puternic ești. Spune doar cât de mult timp ai petrecut procesând durerea —
          și, cel mai probabil, nu ai petrecut deloc, pentru că nimeni nu te-a învățat cum se face.
          Durerea de despărțire nu trece cu timpul. Trece când creierul procesează amintirile care o țin vie.
          <div className="qz-bridge-q">Cum se procesează, concret? (citește mai jos)</div>
        </div>

        {/* Book card */}
        <div className="qz-book-card">
          <span className="qz-book-label">📖 Pasul tău următor</span>
          <div className="qz-book-title">Există o carte numită <em>Cum să Oprești Durerea unei Despărțiri</em> care te învață exact cum să faci asta.</div>
          <p className="qz-book-text">
            Metoda din carte nu a fost inventată de autoare. A fost creată de cercetători care au folosit-o inițial pentru a-i ajuta pe soldații întorși din război
            să se vindece de traume cumplite — fără psiholog, fără pastile, fără ani de chin.
          </p>
          <div className="qz-book-secret">
            Cartea are 165 de pagini și îți arată pas cu pas cum să-ți oprești durerea, nu doar cum să o amâni.
          </div>
          <p className="qz-book-text">
            Cristina Munteanu a trecut ea însăși prin asta: doi ani în care timpul nu a vindecat nimic, până când a descoperit metoda.
            Apoi a scris-o într-o carte pe care au folosit-o mii de oameni din România.
            <br /><br />
            Dacă vrei să afli cum poți face rost de această carte, apasă butonul de mai jos.
          </p>
          <a href={link} className="qz-btn qz-btn-gold" style={{ textDecoration: "none", display: "block", marginTop: 10 }}>
            VREAU SĂ VĂD CARTEA CARE OPREȘTE DUREREA →
          </a>
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 12 }}>
            🔒 Garanție 30 de zile · Acces imediat
          </p>
        </div>

        <div className="qz-trust" style={{ marginTop: 22 }}>
          <span>🔒 Garanție 30 de zile</span>
          <span>📖 Metodă bazată pe psihologie</span>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`qz-faq-item${open ? " open" : ""}`} onClick={() => setOpen(!open)}>
      <div className="qz-faq-q">{q}<span className="qz-faq-arrow">▼</span></div>
      <div className="qz-faq-a">{a}</div>
    </div>
  );
}

// Build observations based on answers (mirrors original buildObs)
function buildObservations(answers: Record<number, number[]>, gender: Gender) {
  const obs: { icon: string; text: string }[] = [];
  const isMale = gender === "M";
  const P = isMale ? "ea" : "el";
  const Pei = isMale ? "ei" : "lui";
  const plural = isMale ? "Femeile" : "Bărbații";
  const afectat = isMale ? "afectată" : "afectat";

  function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // Q4 — Comunicare
  if (answers[4] !== undefined) {
    const ci = answers[4][0];
    if (ci === 5) obs.push({ icon: "🔇", text: `<strong>Te are la block.</strong> Știm că asta doare enorm. Dar mulți oameni blochează pe cineva exact pentru că acea persoană îi afectează emoțional mai mult decât vor să recunoască. Mesajul greșit acum poate închide definitiv ușa. Abordarea potrivită poate deschide o conversație complet nouă.` });
    else if (ci === 0) obs.push({ icon: "💬", text: `<strong>Vorbiți în continuare zilnic.</strong> Ușa nu s-a închis — ${P} nu a tăiat legătura complet. Dar conversațiile frecvente fără direcție pot consolida o dinamică greșită. Contează <em>cum</em> comunici, nu doar <em>cât de des</em>.` });
    else if (ci === 3 || ci === 4) obs.push({ icon: "🔕", text: `<strong>Comunicarea este aproape inexistentă.</strong> Tăcerea poate părea un semn rău — dar adesea este o oportunitate. Revenirea cu mesajul greșit poate distruge orice șansă. Revenirea la momentul potrivit și cu abordarea corectă poate reseta totul de la zero.` });
    else if (ci === 1) obs.push({ icon: "💬", text: `<strong>Vorbiți ocazional, dar conversațiile sunt reci.</strong> ${cap(P)} nu a tăiat complet legătura — ceea ce contează. Conversațiile superficiale pot deveni un tipar permanent dacă nu schimbi dinamica dintr-o poziție de putere.` });
  }

  // Q6 — Reacție
  if (answers[6] !== undefined) {
    const ri = answers[6][0];
    if (ri === 0 || ri === 1) obs.push({ icon: "😤", text: `<strong>${cap(P)} a reacționat cu furie.</strong> Contrar instinctului tău, furia arată atașament. Un om care nu simte nimic nu se enervează. Emoția ${Pei} arată că relația a contat — dar trebuie să știi cum să dezamorsezi această energie, nu să o alimentezi și mai mult.` });
    else if (ri === 2 || ri === 3) obs.push({ icon: "💔", text: `<strong>A fost vizibil ${afectat} emoțional.</strong> Tristețea ${Pei} la despărțire indică faptul că sentimentele nu au dispărut. ${plural} procesează durerea diferit — adesea se retrag tocmai pentru că simt prea mult, nu prea puțin.` });
    else if (ri === 4) obs.push({ icon: "🧊", text: `<strong>Nu a arătat nicio emoție.</strong> Lipsa reacției vizibile nu înseamnă lipsa sentimentelor. ${plural} care se închid complet sunt adesea cei mai afectați interior — este un mecanism de protecție, nu o decizie finală.` });
  }

  // Q7 — Comportament actual
  if (answers[7] !== undefined) {
    const beh = answers[7];
    if (beh.includes(5)) obs.push({ icon: "📱", text: `<strong>${cap(P)} inițiază contact uneori, dar se retrage.</strong> Acesta este unul dintre cele mai clare semne că se gândește activ la tine. Comportamentul „du-te-vino" arată un conflict intern real — o parte din ${P} vrea să revină, dar ceva ${Pei} reține.` });
    else if (beh.includes(1)) obs.push({ icon: "🔄", text: `<strong>Alternează între căldură și răceală.</strong> Asta arată că ${P} nu și-a luat o decizie finală — se mai poate face ceva. Dar trebuie să știi exact cum să reacționezi în fiecare tip de moment.` });
    else if (beh.includes(0) && !beh.includes(5) && !beh.includes(1)) obs.push({ icon: "❄️", text: `<strong>Este rece și distant${isMale ? "ă" : ""} față de tine.</strong> Distanța emoțională nu înseamnă absența sentimentelor. Adesea este un mecanism de protecție — ${P} se retrage tocmai pentru că situația ${Pei} afectează.` });
  }

  // (intimitatea a fost integrată în comportamentul actual)
  if (answers[7] !== undefined && answers[7].length === 99) { // removed
    const ii = answers[12][0];
    if (ii === 0) obs.push({ icon: "🔥", text: `<strong>Ați mai fost intimi de curând.</strong> Atracția fizică nu a dispărut — asta e un semn important. Dar fără o strategie clară, intimitatea poate deveni o capcană.` });
    else if (ii === 3) obs.push({ icon: "👀", text: `<strong>Nu v-ați mai văzut deloc.</strong> Lipsa contactului face procesul mai dificil, dar nu imposibil. O reîntâlnire la momentul și în contextul potrivit poate reporni totul.` });
  }

  // Q8 — Altcineva
  if (answers[8] !== undefined && (answers[8][0] === 0 || answers[8][0] === 1)) {
    obs.push({ icon: "⚠️", text: `<strong>${cap(P)} este sau ar putea fi cu altcineva.</strong> Știm că asta doare. Dar relațiile fix după despărțire au o rată foarte mare de eșec — sunt o reacție la durere, nu o alegere reală.` });
  }

  // Q5 — Infidelitate
  if (answers[5] !== undefined) {
    const inf = answers[5][0];
    if (inf === 1) obs.push({ icon: "💔", text: `<strong>Ai recunoscut că tu ai înșelat.</strong> Aceasta e una din cele mai dificile situații de reparat — dar nu imposibilă. Cheia nu e să ceri iertare în mod repetat. E să demonstrezi printr-o schimbare reală de comportament.` });
    else if (inf === 0) obs.push({ icon: "💔", text: `<strong>${cap(P)} te-a înșelat.</strong> Faptul că vrei totuși să repari lucrurile arată maturitate. Dar trebuie să te asiguri că nu te întorci dintr-o poziție de disperare, ci dintr-una de putere și claritate.` });
  }

  // Q9 — Ce ai încercat
  if (answers[9] !== undefined) {
    const tMsg = answers[9].includes(0);
    const tBeg = answers[9].includes(2);
    if (tMsg || tBeg) {
      let txt = "<strong>Ai ";
      if (tMsg && tBeg) txt += `trimis mesaje lungi și te-ai rugat de ${P} să vă mai dați o șansă.`;
      else if (tMsg) txt += "trimis mesaje lungi explicând ce simți.";
      else txt += `cerut ${Pei} să vă mai dați o șansă.`;
      txt += `</strong> Din punct de vedere psihologic, aceste acțiuni declanșează exact reacția opusă celei pe care o dorești. ${plural} interpretează rugămințile și explicațiile emoționale ca presiune — și răspunsul instinctiv la presiune este retragerea.`;
      obs.push({ icon: "📝", text: txt });
    }
  }

  // Q3 — Despărțiri anterioare
  if (answers[5] !== undefined) {
    if (answers[3][0] === 0) obs.push({ icon: "🔁", text: `<strong>V-ați mai despărțit de mai multe ori.</strong> Asta arată un tipar care se repetă — un ciclu care nu poate fi rupt cu același tip de acțiuni. Ai nevoie de o abordare complet diferită.` });
    else if (answers[3][0] === 1) obs.push({ icon: "🔁", text: `<strong>V-ați mai despărțit o dată în trecut.</strong> Asta confirmă că relația poate supraviețui dificultăților — ați reușit înainte.` });
  }

  // (familia a fost eliminată din testul de 10 întrebări)
  if (answers[3] !== undefined && answers[3].length === 99) { // removed
    obs.push({ icon: "👨‍👩‍👦", text: `<strong>Familia și prietenii ${Pei} te plac.</strong> Asta contează mai mult decât crezi. Cercul ${Pei} apropiat poate deveni aliatul tău indirect.` });
  }

  return obs;
}
