import { useEffect, useRef, useState } from "react";

/**
 * Formularul de începere coaching — DOUĂ versiuni, una pentru bărbați și una
 * pentru femei (ca și dashboardul de achiziții, care are /barbati/achizitii și
 * /femei/achizitii). Diferența nu e doar pronumele: titlul, explicația, tonul și
 * îndemnurile sunt scrise separat pentru fiecare.
 *
 * NU există nicio limită de cuvinte. Casetele sunt mari și se pot întinde —
 * clientul poate scrie cât vrea, la fiecare întrebare. Răspunsurile NU se șterg:
 * se salvează local + pe server, iar după trimitere le poate rescrie și retrimite.
 */

type Gen = "male" | "female";
type Q = { id: string; q: string; hint: string; ph: string };

/** Câte rânduri are fiecare casetă de răspuns. Generos, ca să nu limiteze pe nimeni. */
const RANDURI_CASETA = 7;

const VERSIUNE: Record<Gen, {
  tag: string;
  titlu: string;
  intro: string;
  salut: string;
  trimisTitlu: string;
  trimisText: string;
  buton: string;
  nota: string;
}> = {
  male: {
    tag: "Formular pentru începerea programului de sfaturi personalizate",
    titlu: "Povestea ta cu ea — spune-mi exact ce s-a întâmplat",
    intro:
      "Vrei să o recuperezi pe ea. Ca să-ți pot spune concret ce să faci și ce să-i scrii, am nevoie să văd situația prin ochii tăi: " +
      "cine ați fost, ce s-a rupt și ce ai încercat până acum. Cu cât ești mai sincer și mai concret, cu atât sfatul meu e mai precis. " +
      "Nu te judec, scrie-mi ca și cum mi-ai povesti unui prieten care chiar te poate ajuta.",
    salut: "Ia-ți timp — nu trebuie să fie perfect scris. Vreau să înțeleg povestea ta adevărată, cu bune și cu rele.",
    trimisTitlu: "Formularul tău a ajuns la Cristina Munteanu.",
    trimisText:
      "Îl citesc cu atenție și îți răspund personal pe email, în maximum 48 de ore (de obicei mult mai repede). " +
      "De acolo continuăm discuția pe email, pas cu pas, până o recuperezi pe ea.",
    buton: "Trimite povestea către Cristina Munteanu",
    nota: "Confidențial — doar Cristina vede răspunsurile tale. Poți reveni oricând să editezi și să trimiți din nou.",
  },
  female: {
    tag: "Formular pentru începerea programului de sfaturi personalizate",
    titlu: "Povestea ta cu el — spune-mi exact ce s-a întâmplat",
    intro:
      "Vrei să-l recuperezi pe el. Ca să-ți pot spune concret ce să faci și ce să-i scrii, am nevoie să văd situația prin ochii tăi: " +
      "cine ați fost, ce s-a rupt și ce ai încercat până acum. Cu cât ești mai sinceră și mai concretă, cu atât sfatul meu e mai precis. " +
      "Nu te judec, scrie-mi ca și cum mi-ai povesti unei prietene care chiar te poate ajuta.",
    salut: "Ia-ți timpul de care ai nevoie — nu trebuie să fie perfect scris. Vreau să înțeleg povestea ta adevărată, cu bune și cu rele.",
    trimisTitlu: "Formularul tău a ajuns la Cristina Munteanu.",
    trimisText:
      "Îl citesc cu atenție și îți răspund personal pe email, în maximum 48 de ore (de obicei mult mai repede). " +
      "De acolo continuăm discuția pe email, pas cu pas, până îl recuperezi pe el.",
    buton: "Trimite povestea către Cristina Munteanu",
    nota: "Confidențial — doar Cristina vede răspunsurile tale. Poți reveni oricând să editezi și să trimiți din nou.",
  },
};

/** Întrebările, adaptate după genul partenerului. Fără nicio limită de lungime. */
function questions(gen: Gen): Q[] {
  const partenerFemeie = gen === "male";      // el vrea sa o recupereze pe EA
  const he = partenerFemeie ? "ea" : "el";
  const him = partenerFemeie ? "o" : "îl";
  const la = partenerFemeie ? "la ea" : "la el";
  const his = partenerFemeie ? "ei" : "lui";
  const tu = partenerFemeie ? "(ă)" : "ă";     // acordul: "fii sincer(ă)" / "fii sinceră"

  return [
    {
      id: "q1",
      q: "Povestea voastră — cum a început și cum ați trăit împreună până s-a stricat?",
      hint: "Unde v-ați cunoscut, cât a ținut relația, ce ați trăit frumos împreună. Vreau să pornim de la povestea voastră reală, nu de la generalități.",
      ph: "Ne-am cunoscut în… Am fost împreună… La început eram…",
    },
    {
      id: "q2",
      q: "Ce s-a întâmplat, de fapt, când s-a rupt relația? Descrie-mi momentul cât mai exact.",
      hint: "A fost o decizie bruscă sau s-a tot amânat? Ce s-a spus atunci? Cine a plecat și în ce context? Orice detaliu contează.",
      ph: "Totul s-a rupt când… Mi-a spus că… În ziua aceea…",
    },
    {
      id: "q3",
      q: "Ce ți-a spus " + he + " că simte și care au fost motivele invocate pentru despărțire?",
      hint: "Dacă îți amintești cuvintele aproape exact, scrie-le așa cum le-ai auzit — mă ajută enorm să înțeleg ce e în mintea și în inima " + his + " acum.",
      ph: "Mi-a zis că… M-a acuzat de… Cuvintele exacte au fost…",
    },
    {
      id: "q4",
      q: "Ce ai făcut de la despărțire încoace ca să " + him + " recuperezi? Fii sincer" + tu + " cu mine.",
      hint: "Mesaje, promisiuni, rugăminți, cadouri, vizite, discuții cu prietenii comuni, postări, tăcere… tot ce ai încercat contează, chiar și ce-ți pare acum o greșeală.",
      ph: "I-am scris de câteva ori… Am promis că… Nu mai știu ce să fac…",
    },
    {
      id: "q5",
      q: "Cum se comportă " + he + " cu tine acum?",
      hint: "Îți răspunde la mesaje? Te evită? E rece sau neutru" + (partenerFemeie ? "ă" : "") + "? Vă vedeți? Cine începe discuțiile? Cât de repede răspunde?",
      ph: "Îmi răspunde rareori… Mă tratează cu… Ultima dată când am vorbit…",
    },
    {
      id: "q6",
      q: "Există altcineva în viața " + his + " acum? Ce știi sigur și ce bănuiești?",
      hint: "Dacă nu știi nimic sigur, spune-mi ce simți sau ce ai auzit. E un detaliu important, dar nu este automat o piedică.",
      ph: "Nu știu sigur, dar… Am aflat că… Bănuiesc că…",
    },
    {
      id: "q7",
      q: "Care crezi că au fost cele mai mari greșeli ale tale în relație? Ce ai învățat din ele?",
      hint: "Fii sincer" + tu + " — nu te judec. Ca să-ți spun exact ce să faci de acum înainte, trebuie să știu ce nu a mers și cum gândești acum.",
      ph: "Cea mai mare greșeală a mea a fost… Acum înțeleg că…",
    },
    {
      id: "q8",
      q: "Cum te simți și ce faci tu, zi de zi, de la despărțire încoace?",
      hint: "Disperare, urmărire, tăcere, supărare, muncă, nopți nedormite? Ce simți când îți scrie și ce simți când nu-ți scrie deloc?",
      ph: "Sunt distrus" + tu + "… Am încercat să… Mă gândesc " + la + " tot timpul…",
    },
    {
      id: "q9",
      q: "Cât de mult îți dorești împăcarea și ce ți-ai dori să se întâmple în următoarele 30 de zile?",
      hint: "Vrei să vorbiți normal? Să vă vedeți? Să vă mutați împreună? Spune-mi exact cum ar arăta „bine” pentru tine, ca să știu încotro te îndrum.",
      ph: "Mi-aș dori ca în 30 de zile… Cel mai mult vreau…",
    },
    {
      id: "q10",
      q: "Încă trei lucruri care schimbă mult sfatul meu: v-ați mai despărțit înainte, aveți copii împreună, și cum se înțelegeau familia și prietenii " + his + " cu tine?",
      hint:
        "Scrie-mi pe rând: (1) dacă ați mai trecut printr-o despărțire și cum s-a reparat atunci; " +
        "(2) dacă aveți copii împreună și cum se descurcă " + he + " cu ei acum; " +
        "(3) dacă familia și prietenii " + his + " te plăceau sau nu — și dacă ei au avut vreo influență în decizia " + his + ". " +
        "Adaugă apoi orice altceva crezi că trebuie să știu: distanță, muncă, bani, sănătate, presiune din partea celor din jur.",
      ph: "Ne-am mai despărțit o dată în… Copii avem / nu avem… Mama " + his + " mă…",
    },
  ];
}

const fmtDate = (ts: number | null): string =>
  ts ? new Date(ts).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default function CoachingOnboarding({
  email,
  firstName,
  gender,
}: {
  email: string;
  firstName: string | null;
  gender: "male" | "female";
}) {
  const gen: Gen = gender === "female" ? "female" : "male";
  const v = VERSIUNE[gen];
  const qs = questions(gen);

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<"loading" | "form" | "sent">("loading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [firstSentAt, setFirstSentAt] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const draftKey = "tvii_onb_" + gen + "_" + email;
  const loadedRef = useRef(false);

  const saveDraft = (next: Record<string, string>) => {
    setAnswers(next);
    try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      let local: Record<string, string> | null = null;
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") local = parsed;
        }
      } catch { /* ignore */ }
      try {
        const res = await fetch("/api/library/onboarding", { credentials: "same-origin" });
        if (res.ok) {
          const d = await res.json();
          if (d && d.ok && d.owns) {
            setFirstSentAt(d.firstSentAt || null);
            setSentAt(d.lastSentAt || null);
            if (d.submitted && (!local || Object.keys(local).length === 0)) {
              // Potrivim intai dupa textul intrebarii; daca intrebarile s-au schimbat
              // intre timp, punem raspunsurile pe pozitii, ca sa nu se piarda nimic.
              const seeded: Record<string, string> = {};
              (d.answers || []).forEach((item: any, idx: number) => {
                if (!item || !item.a) return;
                const gasit = qs.find((qq) => qq.q === item.q);
                const tinta = gasit ? gasit.id : (qs[idx] ? qs[idx].id : null);
                if (tinta) seeded[tinta] = item.a;
              });
              setAnswers(seeded);
              try { localStorage.setItem(draftKey, JSON.stringify(seeded)); } catch { /* ignore */ }
              setState("sent");
              setLoading(false);
              return;
            }
          }
        }
      } catch { /* continuam cu draftul local */ }
      setAnswers(local || {});
      setState("form");
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalChars = Object.values(answers).reduce((s, val) => s + (val || "").length, 0);

  const submit = async () => {
    if (totalChars < 20) {
      setError("Scrie-mi măcar câteva propoziții la una dintre întrebări, ca să am de unde porni.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const payload = qs
        .filter((qq) => (answers[qq.id] || "").trim().length > 0)
        .map((qq) => ({ q: qq.q, a: (answers[qq.id] || "").trim() }));
      const res = await fetch("/api/library/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
        credentials: "same-origin",
      });
      const d = await res.json();
      if (!res.ok) { setError(d && d.error ? d.error : "Nu am putut trimite formularul. Încearcă din nou."); setSending(false); return; }
      const now = Date.now();
      setSentAt(d.sentAt || now);
      if (!firstSentAt) setFirstSentAt(d.sentAt || now);
      try { localStorage.setItem(draftKey, JSON.stringify(answers)); } catch { /* ignore */ }
      setState("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Eroare de conexiune. Verifică internetul și încearcă din nou.");
    } finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-[#64748b]">
        <span className="inline-block w-6 h-6 border-2 border-[#dde3ef] border-t-[#1b2d4f] rounded-full animate-spin" />
        <p className="mt-2 text-sm">Se verifică formularul tău…</p>
      </div>
    );
  }

  if (state === "sent") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-[#eef2ff] text-[#1b2d4f] px-3 py-1 rounded-full mb-3">{v.tag}</span>
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl">💌</div>
          <div>
            <p className="font-extrabold text-[#1b2d4f] text-lg leading-snug">{v.trimisTitlu}</p>
            <p className="text-sm text-[#64748b] mt-1">
              {sentAt ? <>Ultima variantă a fost trimisă pe <strong>{fmtDate(sentAt)}</strong>. </> : null}
              {v.trimisText}
            </p>
          </div>
        </div>
        <p className="text-sm text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
          Ai scris deja povestea ta — nu se pierde nimic. Dacă vrei să schimbi, să adaugi sau să rescrii ceva, apasă mai jos:
          tot ce ai scris rămâne pe ecran, editezi și poți trimite din nou când vrei.
        </p>
        <button
          type="button"
          onClick={() => setState("form")}
          className="mt-4 w-full bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-bold py-3 px-6 rounded-full shadow hover:shadow-lg transition-all text-sm cursor-pointer"
        >
          ✏️ Rescrie / editează răspunsurile și trimite din nou
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-[#eef2ff] text-[#1b2d4f] px-3 py-1 rounded-full mb-3">{v.tag}</span>
      <div className="flex items-start gap-3 mb-1">
        <div className="text-3xl">🎯</div>
        <div>
          <p className="font-extrabold text-[#1b2d4f] text-lg leading-snug">{v.titlu}</p>
          <p className="text-sm text-[#64748b] mt-1">{v.intro}</p>
        </div>
      </div>

      {firstSentAt ? (
        <p className="mt-3 text-xs bg-[#fffbeb] border border-[#f0e3b6] text-[#8a6d1f] rounded-lg px-3 py-2">
          Ai mai trimis o variantă pe {fmtDate(firstSentAt)}. Poți schimba orice răspuns de mai jos și să o trimiți din nou — nu se pierde nimic din ce ai scris.
        </p>
      ) : null}

      <p className="mt-3 text-sm text-[#334155]">
        {firstName ? <>Bună, <strong>{firstName}</strong>! </> : null}{v.salut}
      </p>

      <p className="mt-3 text-xs text-[#64748b] bg-[#f0fdf4] border border-green-200 rounded-lg px-3 py-2">
        ✍️ Scrie cât vrei la fiecare întrebare — <strong>nu există nicio limită de cuvinte</strong>. Răspunde doar la cele care ți se potrivesc;
        poți lăsa liniștit gol ce nu se aplică la tine.
      </p>

      <div className="space-y-5 mt-5">
        {qs.map((qq, i) => (
          <div key={qq.id}>
            <label className="block font-bold text-[#1b2d4f] text-[15px]">{i + 1}. {qq.q}</label>
            <p className="text-sm text-[#64748b] mt-1 leading-relaxed">{qq.hint}</p>
            <textarea
              value={answers[qq.id] || ""}
              onChange={(e) => saveDraft({ ...answers, [qq.id]: e.target.value })}
              rows={RANDURI_CASETA}
              placeholder={qq.ph}
              className="w-full mt-1.5 border border-[#cbd5e1] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#1b2d4f] resize-y leading-relaxed min-h-[160px]"
            />
          </div>
        ))}
      </div>

      {error ? <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div> : null}

      <button
        type="button"
        disabled={sending}
        onClick={submit}
        className="mt-5 w-full bg-gradient-to-r from-[#1b2d4f] to-[#2d4a7a] text-white font-extrabold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? "Se trimite către Cristina…" : "✉️ " + v.buton}
      </button>
      <p className="mt-3 text-center text-xs text-[#94a3b8]">🔒 {v.nota}</p>
    </div>
  );
}
