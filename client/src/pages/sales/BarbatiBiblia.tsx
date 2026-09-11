import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trackViewContent } from "@/lib/tracking";
import { trpc } from "@/lib/trpc";

const IMG = "/img/barbati-biblia";
const RED = "#c8102e";

export const BARBATI_BOOK_PRICE = 67;
export const BARBATI_EXIT_OFFER_PRICE = 47;

const CTA_LABEL = "Vezi dacă mai poți achiziționa Cum să Oprești Durerea unei Despărțiri la 67 de lei";

function CTA({ label = CTA_LABEL, onClick }: { label?: string; onClick?: () => void }) {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      className="block w-full max-w-md mx-auto text-center bg-gradient-to-r from-[#c8102e] to-[#a50d23] text-white font-extrabold py-4 px-6 rounded-md shadow-lg hover:shadow-xl transition-all text-lg active:scale-[0.98] my-6 uppercase tracking-wide cursor-pointer"
      style={{ textDecoration: "none" }}
    >
      {label}
    </a>
  );
}

function RedH({ children, sm }: { children: React.ReactNode; sm?: boolean }) {
  return (
    <h2 className={`text-center font-extrabold leading-snug my-6 ${sm ? "text-[22px]" : "text-[26px] sm:text-[31px]"}`} style={{ color: RED }}>
      {children}
    </h2>
  );
}

function Img({ src, alt, max = "max-w-md" }: { src: string; alt: string; max?: string }) {
  return <img src={`${IMG}/${src}`} alt={alt} loading="lazy" className={`block w-full ${max} mx-auto my-7 rounded-lg`} />;
}

export default function BarbatiBiblia() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [exitOffer, setExitOffer] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [popupEmailError, setPopupEmailError] = useState(false);
  const [popupSaving, setPopupSaving] = useState(false);
  const [knownEmail, setKnownEmail] = useState(() => {
    if (typeof window === "undefined") return false;
    const em = localStorage.getItem("tvii_email");
    return !!em && em.includes("@");
  });

  const captureEmail = trpc.quiz.captureEmail.useMutation();

  useEffect(() => { trackViewContent({ productName: "opreste-durerea-barbati", value: 67, gender: "male" }); }, []);

  useEffect(() => {
    if (sessionStorage.getItem("tvii_exit_seen") || localStorage.getItem("tvii_exit_offer")) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        sessionStorage.setItem("tvii_exit_seen", "1");
        setExitOffer(true);
        document.removeEventListener("mouseout", onLeave);
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, []);

  const goCheckout = () => setLocation("/barbati/checkout");

  // Toate butoanele rosii de pe pagina deruleaza automat la caseta ofertei,
  // unde se cere emailul (doar daca nu a fost deja dat, ex. din testul de sanse).
  const scrollToOffer = () => {
    document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submitOfferEmail = async () => {
    const em = email.trim();
    if (!em || !em.includes("@") || !em.includes(".")) { setEmailError(true); return; }
    setEmailError(false);
    setEmailSaving(true);
    try {
      const res = await captureEmail.mutateAsync({ email: em, gender: "male", affiliateCode: localStorage.getItem("tvii_affiliate") || undefined });
      localStorage.setItem("tvii_email", em);
      if (res.contactId) localStorage.setItem("tvii_contact_id", String(res.contactId));
      setKnownEmail(true);
      goCheckout();
    } catch {
      localStorage.setItem("tvii_email", em);
      setKnownEmail(true);
      goCheckout();
    } finally {
      setEmailSaving(false);
    }
  };

  // Pop-up-ul de reducere speciala: cine NU vine de pe quiz (nu are email salvat)
  // trebuie sa-si lase emailul aici ca sa poata primi cartea dupa plata.
  const finishExit = () => {
    localStorage.setItem("tvii_exit_offer", "1");
    setExitOffer(false);
    goCheckout();
  };

  const acceptExitOffer = async () => {
    if (knownEmail) { finishExit(); return; }
    const em = popupEmail.trim();
    if (!em || !em.includes("@") || !em.includes(".")) { setPopupEmailError(true); return; }
    setPopupEmailError(false);
    setPopupSaving(true);
    try {
      const res = await captureEmail.mutateAsync({ email: em, gender: "male", affiliateCode: localStorage.getItem("tvii_affiliate") || undefined });
      if (res.contactId) localStorage.setItem("tvii_contact_id", String(res.contactId));
    } catch { /* daca esueaza salvarea, mergem mai departe cu emailul local */ }
    localStorage.setItem("tvii_email", em);
    setKnownEmail(true);
    setPopupSaving(false);
    finishExit();
  };

  return (
    <div className="qz-wrap" style={{ background: "#ffffff" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-[17px] leading-relaxed text-[#1a1a2e]">
        <div className="text-center font-bold tracking-widest text-sm mb-3" style={{ color: "#8b95a5" }}>✦ pestedespartire.ro</div>

        <div className="text-center text-[13px] font-bold text-white bg-[#7a1115] border border-[#c8102e] rounded-md px-4 py-2 mb-5">
          ⚠ Atenție: Această pagină nu va fi disponibilă mult timp — citește până la capăt înainte să fie prea târziu
        </div>

        <div className="text-center mb-2">
          <span className="inline-block bg-[#1f242c] text-[#e8c96a] text-xs font-bold tracking-widest px-4 py-1.5 rounded-full border border-[#2d343f]">CARTE INCLUSĂ</span>
        </div>

        <h1 className="text-center text-[26px] sm:text-[33px] font-extrabold leading-tight mb-6" style={{ color: RED }}>
          Secretul care o va face pe acea femeie să se <em>răzgândească</em> în privința despărțirii și să te <em>roage</em> să vă împăcați <span className="whitespace-nowrap">(<u>Funcționează în 2026</u>)</span>
        </h1>

        <div className="space-y-4">
          <p>Dacă ai ajuns aici, înseamnă că treci printr-una dintre <strong>cele mai dureroase experiențe</strong> prin care poate trece un bărbat.</p>
          <p>Ea a plecat. Sau e pe cale să plece. Sau poate încă sunteți împreună dar relația voastră nu mai funcționează.</p>
          <p>Aceste lucruri îi afectează chiar și pe cei mai puternici bărbați. Poate ai <u>inima frântă</u>, sau ți-ai pierdut speranța. Poate te gândești încontinuu la ea și simți un <strong>dor care nu dispare</strong> și te face să <em>te întrebi dacă oare e prea târziu...</em></p>
          <p><strong>Și gândul că ar putea fi cu altcineva?</strong> Te poate face să simți că o iei razna.</p>
          <p><strong>Ce-ar fi dacă ți-aș spune că poți să o faci pe acea femeie <u>să se întoarcă în brațele tale</u> mai îndrăgostită ca niciodată?</strong></p>
          <p><strong>Și ce-ar fi dacă ți-aș spune că poate funcționa chiar și dacă:</strong></p>
          <ul className="list-disc pl-6 space-y-1.5 marker:text-[#c8102e]">
            <li>Ai înșelat-o sau te-a înșelat</li>
            <li>A trecut mult timp de când v-ați despărțit</li>
            <li>Nu ați mai vorbit de săptămâni sau luni de zile</li>
            <li>Locuiți departe unul de celălalt.</li>
            <li>Ea este deja cu altcineva.</li>
            <li>Te urăște de moarte în acest moment.</li>
            <li>Te-a blocat, te ignoră sau ți-a spus că s-a terminat între voi pentru totdeauna și că nu te mai iubește.</li>
          </ul>
          <p>Vreau să știi un lucru. <strong>Situația ta NU este pierdută.</strong> Indiferent ce ți-a spus ea… <strong>Indiferent cât de rece pare acum…</strong> <strong>Indiferent dacă spune că „nu mai simte nimic"…</strong></p>
        </div>

        <Img src="story1.png" alt="" />
        <RedH>Încă Ai O Șansă Bună Să Vă Împăcați</RedH>

        <div className="space-y-4">
          <p>Sună prea bine să fie adevărat? Poate că așa e... ...Dar sunt așa de convinsă că te pot învăța cum să o faci să vină <u>înapoi în brațele</u> tale încât o să-ți dau și o <strong>GARANȚIE (mai multe despre asta imediat),</strong> dar mai întâi ar trebui să mă prezint.</p>
          <p>Mă numesc <strong>Cristina Munteanu</strong> și am petrecut ultimii ani ascultând, studiind și înțelegând <u>de ce femeile pleacă din relații</u>... și, mai ales, <strong>de ce se întorc.</strong></p>
          <p>De-a lungul timpului am ascultat <strong>sute de povești de despărțire</strong> care m-au lăsat fără cuvinte. Femei care plecaseră de la <u>bărbații care le înșelaseră</u>. Femei care plecaseră de la bărbații care le trataseră prost. Femei care plecaseră pur și simplu pentru că <strong>simțeau că murise</strong> iubirea din relație.</p>
          <p><strong>Dar multe din acele relații ajungeau să se împace înapoi...</strong></p>
          <p>Și ce m-a surprins cel mai tare a fost faptul că în <strong><u>peste 90% din acele împăcări,</u></strong> bărbații făceau și spuneau anumite lucruri comune. Lucruri care le făceau pe acele femei <u>să regrete despărțirea</u> și să îi implore pentru o <strong>a doua șansă.</strong></p>
          <p>Ce făceau acei bărbați diferit? Ce secret aveau?</p>
        </div>

        <Img src="story2.png" alt="" />
        <RedH><u>Făceau și Spuneau Anumite Lucruri</u> Care Inundă Creierul și Inima Femeilor Cu „<u>Hormonul Iubirii</u>"</RedH>

        <div className="space-y-4">
          <p>Când o femeie se îndrăgostește (și când rămâne îndrăgostită) — nu este vorba în primul rând de rațiune. Este vorba de chimie. De neurologie. De un <strong>hormon numit „oxitocină"</strong> care odată activat o face <u>să uite de orice alt bărbat</u>, să-și șteargă sentimentele negative față de tine și să te vadă ca fiind <strong>„Alesul"</strong> cu care trebuia să fie mereu.</p>
          <p><strong>Că fără tine viața ei nu e completă</strong>. Că doar gândul la tine îi produce un <u>dor în piept</u> pe care nu îl poate ignora.</p>
          <p>Când activezi din nou acel hormon, accesezi direct partea din creierul ei animalic care <u>controlează frica de a te pierde.</u> Asta o va face să creadă că ideea de a se împăca înapoi cu tine <strong><u>e de fapt ideea ei.</u></strong></p>
          <p>Când acel hormon dispare (sau când tu, fără să îți dai seama, ai blocat producerea lui) <strong>relația se răcește</strong>. Ea începe să se distanțeze. Să găsească scuze. Să te iubească tot mai puțin. <strong><u>(asta a dus la despărțire)</u></strong></p>
          <p>Și dacă nu înțelegi de ce se întâmplă asta și <em>cum să inversezi procesul</em>, <strong><u>riști să pierzi acea femeie definitiv.</u></strong></p>
          <p>Acum vine vestea bună: <strong>acel hormon poate fi reactivat.</strong> Chiar și după o despărțire. Chiar și dacă ea <strong>ți-a spus că nu te mai iubește.</strong> Chiar și dacă <u>e cu altcineva acum.</u> Ăsta e secretul.</p>
          <p><strong>Am adunat toate strategiile de împăcare care activează Hormonul Iubirii în inima femeilor și <u>le-am transformat într-o carte.</u></strong></p>
          <p>Vezi tu, aceste strategii chiar funcționează! Nu sunt ca <strong>sfaturile pe care le găsești gratis pe internet</strong> (le-am citit deja pe toate și <u>acelea nu merg</u>).</p>
          <p><strong>Îți prezint:</strong></p>
        </div>

        <RedH sm><u>Cartea virtuală în format PDF numită</u><br /><span className="text-[28px] sm:text-[34px]">„Cum să Oprești Durerea unei Despărțiri"</span><br />(274 pagini)</RedH>

        <Img src="book.png" alt="Cum să Oprești Durerea unei Despărțiri" max="max-w-md sm:max-w-lg" />

        <div className="space-y-4">
          <p>Am ales acest nume deoarece este <strong>cea mai avansată și puternică carte</strong> din <strong>România</strong> de acest gen <em>(și crede-mă, le-am citit pe toate)</em>.</p>
          <p>Această carte te învață tot ce trebuie să <strong>FACI</strong> (și ce să <strong>NU faci</strong>) pentru <strong>a o face pe acea femeie să se întoarcă din nou în viața ta, total îndrăgostită de tine.</strong></p>
          <p><strong>Nu contează dacă</strong> este cu altcineva, dacă <strong><u>ți-a spus să nu o mai contactezi niciodată</u></strong> sau dacă crezi că <strong>situația ta</strong> este <u>fără speranță.</u></p>
          <p>Strategiile prezentate în carte au fost șlefuite și perfecționate pe <strong>durerea și succesul a sute de relații.</strong> <strong>Asta înseamnă că va funcționa pentru aproape orice relație,</strong> <u>indiferent de situație</u>, chiar dacă:</p>
          <ul className="list-disc pl-6 space-y-1.5 marker:text-[#c8102e]">
            <li>Te consideri <strong>un caz pierdut</strong> sau au <strong>trecut luni</strong> de la despărțire.</li>
            <li>Ea deja este <strong>îndrăgostită nebunește de altcineva</strong>...</li>
            <li><strong>Tu te-ai despărțit de ea</strong> și acum o vrei înapoi.</li>
            <li>Te-ai rugat deja de ea de <strong>o mie de ori</strong> să vă împăcați.</li>
            <li>Crezi că e <strong>imposibil</strong> să te mai iubească vreodată.</li>
          </ul>
        </div>

        <CTA onClick={scrollToOffer} />

        <RedH sm>Iată o mică parte din ce vei învăța în carte…</RedH>
        <ul className="list-disc pl-6 space-y-3">
          <li>Cuvintele exacte pe care trebuie să le <strong>spui ca să îi inunzi mintea cu hormonul iubirii</strong>. <em>(pagina 7)</em></li>
          <li>Cum să o faci să simtă un dor uriaș de tine chiar dacă acum <strong><u>ți-a zis că nu vrea să te mai vadă</u></strong>. <em>(pagina 83)</em></li>
          <li>Secretul ciudat care <strong><u>șterge</u></strong> definitiv toate greșelile tale din mintea ei și o face să te vadă din nou ca pe <em>bărbatul visurilor ei</em>. <em>(pagina 72)</em></li>
          <li>Metoda extrem de simplă prin care o faci <strong><u>să regrete amarnic despărțirea</u></strong> și va plânge după tine. <em>(pagina 49)</em></li>
          <li><strong>Greșeala fatală</strong> pe care toți bărbații o fac <em>fix după despărțire</em> și cum să eviți această capcană care <u>îți distruge orice șansă</u>. <em>(pagina 45)</em></li>
          <li>Ce <em>mesaje scurte</em> să îi scrii ca <strong><u>să îi intri sub piele</u></strong> și să o faci <em>să se gândească la tine obsesiv toată noaptea</em>. <em>(pagina 6)</em></li>
          <li>Trucul psihologic care o forțează să lase mândria la o parte și <strong><u>să facă ea primul pas spre împăcare</u></strong>. <em>(pagina 7)</em></li>
          <li>Ce trebuie să faci atunci când ea îți spune că vrea să fiți <strong><u>doar prieteni</u></strong> și cum să întorci rapid situația în favoarea ta. <em>(pagina 57)</em></li>
          <li>Cum să o recucerești și să o aduci <strong><u>înapoi în patul tău</u></strong> chiar dacă a început deja să iasă cu un <em>alt bărbat</em>. <em>(pagina 16)</em></li>
          <li>Cuvintele aproape magice care reaprind pe loc o <strong><u>atracție sălbatică pentru tine</u></strong>. <em>(pagina 141)</em></li>
          <li>Planul pas cu pas ca să o aduci înapoi în brațele tale <strong><u>fără să te milogești sau să pari disperat</u></strong> nici măcar o secundă. <em>(pagina 71)</em></li>
          <li><strong><u>De ce ignorarea ei în momentul potrivit</u></strong> o va face să îți <em>umple telefonul de mesaje și să te caute disperată</em>. <em>(pagina 73)</em></li>
          <li>Cum să îi demonstrezi că ești un bărbat mult mai valoros acum <strong><u>fără să scoți măcar un singur cuvânt despre asta</u></strong>. <em>(pagina 109)</em></li>
        </ul>

        <div className="space-y-4">
          <p>Și multe multe altele. Vei fi uimit cât de incredibil se simte să te trezești în fiecare dimineață lângă ea… Știind că nu va mai vrea să te părăsească vreodată.</p>
          <p><strong>Cât ai fi dispus să plătești ca să fiți din nou împreună <u>și să te iubească mai mult ca oricând?</u></strong> Ai plăti 1.000 de euro dacă ai știi că va fi din nou a ta și va rămâne lângă tine pentru totdeauna? Dar €500? Dar €100?</p>
          <p>Stai liniștit, nu îți voi cere atât. De obicei cartea mea se vinde cu <span className="line-through">149 lei</span>. <u>Dar astăzi derulez o ofertă specială.</u></p>
        </div>

        {/* OFFER */}
        <div id="oferta" className="bg-white border-2 border-[#c8102e] rounded-lg p-6 my-6 text-center shadow-lg">
          <img src="/img/barbati-biblia/book.png" alt="Cum să Oprești Durerea unei Despărțiri" className="block w-full max-w-md sm:max-w-lg mx-auto my-4 rounded-lg" />
          <p className="font-bold text-[#1a1a2e] mb-3">Următoarele <strong>100 de cărți</strong> le voi vinde pentru <strong>DOAR 67 lei</strong> <span style={{ color: "#15803d" }}>(reducere primele 100 de cărți: 149 lei → 67 lei)</span>.</p>
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-[#94a3b8] line-through text-xl">149 lei</span>
            <span className="text-[44px] font-extrabold leading-none" style={{ color: RED }}>67 <span className="text-2xl">RON</span></span>
          </div>
          <p className="text-[#15803d] font-bold text-sm mb-2">o singură plată de doar 67 RON</p>
          <p className="text-xs text-[#64748b] mb-4"><u>După primele 100 de cărți vândute voi închide această promoție.</u></p>
          {knownEmail ? (
            <CTA onClick={goCheckout} />
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submitOfferEmail(); }} noValidate>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                placeholder="adresa@email.com"
                aria-invalid={emailError}
                autoComplete="email"
                className="w-full bg-white border border-[#cbd5e1] rounded-md px-4 py-3 text-[15px] mb-1 outline-none focus:border-[#c8102e]"
                style={emailError ? { borderColor: "#c8102e" } : {}}
              />
              {emailError && <p className="text-xs text-[#dc2626] mb-1 text-left">Te rog introdu o adresă de email validă.</p>}
              <button
                type="submit"
                disabled={emailSaving}
                className="w-full max-w-md mx-auto block text-center bg-gradient-to-r from-[#c8102e] to-[#a50d23] text-white font-extrabold py-4 px-6 rounded-md shadow-lg hover:shadow-xl transition-all text-lg active:scale-[0.98] my-3 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSaving ? "Se verifică..." : "Vezi dacă mai poți achiziționa Cum să Oprești Durerea unei Despărțiri la 67 de lei"}
              </button>
            </form>
          )}
          <p className="text-xs text-[#64748b] mt-1">🔒 Garanție 30 de zile · Acces imediat pe email</p>
        </div>

        {/* 30-DAY GUARANTEE */}
        <div className="text-center my-8">
          <img src="/img/barbati-biblia/guarantee.png" alt="Garanție 30 de zile" className="w-64 mx-auto mb-4 rounded-full" />
          <p><strong>Dacă ceea ce te învăț în carte nu o va aduce din nou în brațele tale, probabil <span style={{ color: RED }}>NIMIC altceva nu o va face</span>.</strong></p>
          <p className="my-3">Sunt așa de convinsă că ceea ce te voi învăța este <strong>cea mai eficientă metodă</strong> de a te împăca cu femeia pe care o iubești încât îți voi oferi și o garanție.</p>
          <p>Pe lângă oferta promoțională pe care ți-am făcut-o, îți ofer și o <u>perioadă de încercare de 30 de zile</u> în care poți primi banii înapoi dacă nu ești mulțumit, fără întrebări...</p>
          <p>Asta înseamnă că poți încerca cartea mea <strong>FĂRĂ NICIUN RISC.</strong> Literalmente, tot riscul este de partea mea!</p>
          <p>Dacă din orice motiv cartea nu funcționează pentru tine, trebuie doar să-mi trimiți un email la adresa <u>anca@pestedespartire.ro</u> pentru o rambursare rapidă.</p>
          <p>Dar să fiu sinceră, dacă ceea ce te învăț nu o va aduce înapoi în brațele tale, nimic altceva nu o va face și măcar <strong><u>vei ști că ai încercat tot ce puteai încerca dar nu v-a fost sortit să vă împăcați.</u></strong></p>
          <p className="my-3">Acum că am eliminat tot <strong>riscul</strong>... și ți-am oferit programul la cel mai mic preț posibil <u>este timpul să lași scuzele deoparte și să treci la acțiune.</u></p>
        </div>

        <p className="my-6">
          <strong>Cu drag, Cristina.</strong><br /><br />
          <strong>P.S.</strong> Tot ce trebuie să faci pentru a accepta oferta și a primi cartea pe email este să dai click pe butonul de mai jos. Dar grăbește-te — fiecare secundă pe care o pierzi așteptând este o altă secundă în care fosta ta <strong><u>s-ar putea îndrăgosti de altcineva</u></strong>.
        </p>

        <Img src="testimonials.png" alt="Recenzii clienți" />

        {/* BIG ARROW IMAGE + FINAL CTA — the page ends with the arrow above the last button */}
        <div className="text-center my-6">
          <img src="/img/arrow-down.png" alt="⬇" className="w-32 mx-auto mb-2" />
        </div>
        <CTA onClick={scrollToOffer} />

        <footer className="border-t border-[#dde3ef] pt-6 mt-8 text-center text-xs text-[#94a3b8] space-x-3">
          <Link href="/termeni" className="hover:text-[#1b2d4f]">Termeni și Condiții</Link>
          <Link href="/privacy" className="hover:text-[#1b2d4f]">Politica de Confidențialitate</Link>
          <Link href="/rambursare" className="hover:text-[#1b2d4f]">Politica de Rambursare</Link>
          <Link href="/contact" className="hover:text-[#1b2d4f]">Contact</Link>
          <Link href="/affiliate/register" className="hover:text-[#1b2d4f]">Afiliere</Link>
          <p className="mt-3"><Link href="/barbati/achizitii" className="font-semibold text-[#1b2d4f] underline hover:text-[#c8102e]">Ai cumpărat deja? Apasă aici</Link></p>
          <p className="mt-3">© 2026 TeVreauInapoi</p>
        </footer>
      </div>

      {/* EXIT POPUP — discount offer with the same book photo */}
      {exitOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white border-2 border-[#e8c96a] rounded-xl p-6 max-w-md w-full text-center relative" style={{ boxShadow: "0 0 60px rgba(232,201,106,.4)" }}>
            <button
              onClick={() => setExitOffer(false)}
              className="absolute top-2 right-3 text-[#94a3b8] hover:text-[#1a1a2e] text-xl"
              aria-label="Închide"
            >✕</button>
            <img src="/img/barbati-biblia/book.png" alt="Cum să Oprești Durerea unei Despărțiri" className="w-32 mx-auto mb-3 rounded-lg shadow-lg" />
            <h3 className="font-extrabold text-xl mb-2" style={{ color: RED }}>Așteaptă! Nu pleca încă…</h3>
            <p className="text-sm text-[#64748b] mb-3">
              Îți ofer <strong>Cum să Oprești Durerea unei Despărțiri</strong> (274 pagini) cu o reducere specială: de la 67 lei la doar {BARBATI_EXIT_OFFER_PRICE} lei, chiar acum.
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-[#94a3b8] line-through text-xl">67 lei</span>
              <span className="text-[44px] font-extrabold leading-none" style={{ color: "#c8102e" }}>{BARBATI_EXIT_OFFER_PRICE} <span className="text-2xl">RON</span></span>
            </div>
            {!knownEmail && (
              <div className="mb-3 text-left">
                <label className="block text-xs font-semibold text-[#64748b] mb-1">Email unde îți trimit cartea</label>
                <input
                  type="email"
                  value={popupEmail}
                  onChange={(e) => { setPopupEmail(e.target.value); setPopupEmailError(false); }}
                  placeholder="adresa@email.com"
                  autoComplete="email"
                  className="w-full border border-[#cbd5e1] rounded-md px-4 py-3 text-[15px] outline-none focus:border-[#c8102e] bg-white"
                  style={popupEmailError ? { borderColor: "#dc2626" } : {}}
                />
                {popupEmailError && <p className="text-xs text-[#dc2626] mt-1">Te rog introdu o adresă de email validă.</p>}
              </div>
            )}
            <button
              onClick={acceptExitOffer}
              disabled={popupSaving}
              className="w-full bg-gradient-to-r from-[#c8102e] to-[#a50d23] text-white font-extrabold py-3.5 px-6 rounded-md shadow-lg hover:shadow-xl transition-all text-base uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {popupSaving ? "Se verifică..." : knownEmail ? ("Da, vreau oferta la " + BARBATI_EXIT_OFFER_PRICE + " lei →") : "Da, trimite-mi oferta la " + BARBATI_EXIT_OFFER_PRICE + " lei →"}
            </button>
            <button
              onClick={() => setExitOffer(false)}
              className="w-full text-xs text-[#94a3b8] hover:text-[#1a1a2e] mt-3"
            >
              Nu, mulțumesc. Vreau să plec.
            </button>
          </div>
        </div>
      )}
    </div>
  );
}