import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trackViewContent } from "@/lib/tracking";
import { trpc } from "@/lib/trpc";

const IMG = "/img/femei-biblia";
const RED = "#cc0000";

export const FEMEI_BOOK_PRICE = 67;
export const FEMEI_EXIT_OFFER_PRICE = 47;

const CTA_LABEL = "Vezi dacă mai poți achiziționa Cum să Oprești Durerea unei Despărțiri la 67 de lei";

function CTA({ label = CTA_LABEL, onClick }: { label?: string; onClick?: () => void }) {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      className="block w-full max-w-md mx-auto text-center bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-extrabold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-lg active:scale-[0.98] my-6 cursor-pointer"
      style={{ textDecoration: "none", letterSpacing: "0.02em" }}
    >
      {label}
    </a>
  );
}

// Red headline, matching the original (#cc0000), responsive sizing.
function RedH({ children, sm }: { children: React.ReactNode; sm?: boolean }) {
  return (
    <h2 className={`text-center font-extrabold leading-snug my-6 font-['Playfair_Display'] ${sm ? "text-[22px]" : "text-[26px] sm:text-[30px]"}`} style={{ color: RED }}>
      {children}
    </h2>
  );
}

function Img({ src, alt, max = "max-w-md" }: { src: string; alt: string; max?: string }) {
  return <img src={`${IMG}/${src}`} alt={alt} loading="lazy" className={`block w-full ${max} mx-auto my-7 rounded-2xl shadow-md`} />;
}

function Testimonial({ text, name }: { text: string; name: string }) {
  return (
    <div className="bg-white border border-[#e8d9a0] rounded-2xl p-5 my-4 text-left shadow-sm">
      <div className="text-[#c9a44a] text-xs font-bold tracking-wider mb-2">★★★★★ RECENZIE CLIENTĂ</div>
      <p className="text-[#1a1a2e] text-[16px] leading-relaxed whitespace-pre-line">{text}</p>
      <p className="text-[#64748b] text-sm font-semibold mt-3">— {name}</p>
    </div>
  );
}

export default function FemeiBiblia() {
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

  useEffect(() => { trackViewContent({ productName: "opreste-durerea-femei", value: 67, gender: "female" }); }, []);

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

  const goCheckout = () => setLocation("/femei/checkout");

  const scrollToOffer = () => {
    document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submitOfferEmail = async () => {
    const em = email.trim();
    if (!em || !em.includes("@") || !em.includes(".")) { setEmailError(true); return; }
    setEmailError(false);
    setEmailSaving(true);
    try {
      const res = await captureEmail.mutateAsync({ email: em, gender: "female", affiliateCode: localStorage.getItem("tvii_affiliate") || undefined });
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
      const res = await captureEmail.mutateAsync({ email: em, gender: "female", affiliateCode: localStorage.getItem("tvii_affiliate") || undefined });
      if (res.contactId) localStorage.setItem("tvii_contact_id", String(res.contactId));
    } catch { /* continuam cu emailul salvat local */ }
    localStorage.setItem("tvii_email", em);
    setKnownEmail(true);
    setPopupSaving(false);
    finishExit();
  };

  return (
    <div className="qz-wrap" style={{ background: "#ffffff" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-[17px] leading-relaxed text-[#1a1a2e]">
        <div className="text-center text-[#c9a44a] font-bold tracking-widest text-sm mb-3">✦ pestedespartire.ro</div>
        <div className="text-center mb-2">
          <span className="inline-block bg-[#1b2d4f] text-[#e8c96a] text-xs font-bold tracking-widest px-4 py-1.5 rounded-full">GHID PDF · 165 DE PAGINI</span>
        </div>

        <h1 className="text-center text-[26px] sm:text-[32px] font-extrabold leading-tight font-['Playfair_Display'] mb-6" style={{ color: RED }}>
          Cum reușesc unele femei să treacă complet peste o despărțire, să meargă mai departe și să găsească pe cineva mai bun — chiar și atunci când credeau că e imposibil să mai simtă o așa iubire <span className="whitespace-nowrap">(Funcționează în 2026)</span>
        </h1>

        <div className="space-y-4">
          <p>Dacă citești asta, înseamnă că în inima ta ceva doare.</p>
          <p>Poate tocmai v-ați despărțit și te simți rănită.</p>
          <p>Poate au trecut luni sau ani de zile și încă te gândești la el.</p>
          <p>Și poate ai încercat deja să treci peste, dar nu ai reușit.</p>
          <p>Indiferent de situația ta, vreau să știi un lucru:</p>
        </div>

        <RedH>Poți să faci să nu mai doară și să-ți găsești pe cineva mai bun</RedH>

        <div className="space-y-4">
          <p>Chiar dacă crezi că a fost iubirea vieții tale și că nu vei mai simți niciodată ce ai simțit cu el.</p>
          <p>Chiar dacă o parte din tine încă nu vrea să renunțe și să meargă mai departe.</p>
          <p>Și chiar dacă nu te simți încă pregătită să o faci.</p>
          <p>Există o metodă care poate face orice femeie să treacă peste o despărțire — și nu a fost inventată de mine.</p>
        </div>

        <Img src="story1.png" alt="Metoda creată pentru soldați" />
        <RedH>A fost creată de cercetători care au folosit-o inițial pentru a ajuta soldații întorși din război să se vindece de traume cumplite, fără psiholog, fără pastile și fără droguri</RedH>

        <div className="space-y-4">
          <p>Aceștia erau soldați care au pierdut tot ce aveau.</p>
          <p>Care și-au văzut prietenii murind lângă ei.</p>
          <p>Cărora li s-au amputat brațe sau picioare.</p>
          <p>Oameni care au văzut lucruri de nedescris și care nu mai puteau trăi normal.</p>
          <p>Nu a fost ușor, dar după mulți ani de încercare, acei cercetători au reușit.</p>
          <p>Au descoperit o metodă simplă și practică, pe care oricine o poate face acasă — o metodă care ajută creierul și inima să proceseze durerea și să meargă mai departe, fără ani de chin.</p>
        </div>

        <Img src="story1.png" alt="Strategia hormonul iubirii" />
        <RedH>Când am aflat prima dată de ea, eram distrusă</RedH>

        <div className="space-y-4">
          <p>Mă numesc <strong>Cristina Munteanu</strong>. Pe vremea aceea trăiam o poveste de dragoste cu un bărbat pe care îl credeam alesul.</p>
          <p>Eram căsătoriți și aveam 2 copii împreună.</p>
          <p>Numai că într-o zi l-am găsit în pat cu altă femeie.</p>
          <p>Nu știu cum să descriu în cuvinte ce am simțit în acel moment. A fost un amestec de furie, rușine, trădare și o durere atât de mare încât parcă mi se rupea ceva pe dinăuntru.</p>
          <p>În fața prietenilor și familiei mă prefăceam că sunt bine. Zâmbeam. Spuneam „trece, sunt ok". Dar în inima mea era haos.</p>
          <p>Cât plângeam și cât sufeream, numai eu știam. Și partea cea mai ciudată? La cât rău mi-a făcut, o parte din mine încă ținea la el și nu voia să treacă peste.</p>
          <p>Încă mai speram, undeva adânc, că o să se întoarcă și o să fie bine. Mă agățam de o speranță care mă ținea blocată și nu mă lăsa să mă vindec.</p>
          <p>Îl iubeam, deși mă distrusese.</p>
        </div>

        <Img src="story1.png" alt="Timpul care nu vindecă nimic" />
        <RedH>Timpul trecea, dar nu vindeca nimic</RedH>

        <div className="space-y-4">
          <p>Trecuseră deja doi ani de la despărțire și eu tot acolo eram.</p>
          <p>Alcoolul nu mă ajuta. Alte relații nu ajutau, pentru că îl comparam constant pe orice bărbat nou cu el. Și, ce-i drept, îmi pierdusem și încrederea în bărbați.</p>
          <p>Nu credeam vreodată că voi mai putea să iubesc. De fapt, nici nu mai voiam iubire.</p>
          <p>Eram blocată. Până când o prietenă psiholog mi-a vorbit despre metoda aceea simplă, creată pentru soldați.</p>
          <p>La început mi s-a părut prea simplă ca să funcționeze. Nu credeam în ea. Dar mi-am zis: ce am de pierdut? Mai rău de atât nu se poate.</p>
          <p>Așa că am încercat-o.</p>
        </div>

        <Img src="story2.png" alt="Rezultatele, săptămână cu săptămână" />

        <div className="space-y-4">
          <p>La început nu am văzut cine știe ce schimbare. Dar după o săptămână am observat ceva ciudat.</p>
          <p>Nu m-am mai trezit cu gândul la el primul lucru dimineața. Mă trezeam, îmi beam cafeaua și abia după o oră îmi aminteam: „uite, nu m-am gândit la el".</p>
          <p><strong>După două săptămâni</strong>, am observat că nu mai simțeam nevoia să spionez ce mai postează pe Facebook. Nu mai voiam să știu ce face, cu cine e.</p>
          <p>Iar după o lună întreagă, eram de nerecunoscut.</p>
        </div>

        <RedH>Nu uitasem cât de mult l-am iubit, dar nu mai simțeam nimic când mă gândeam la el</RedH>

        <Img src="story3.png" alt="După o lună" />

        <div className="space-y-4">
          <p>Nu-mi mai făcea inima să bată mai tare. Nu-mi mai venea să plâng. Eram indiferentă.</p>
          <p>Și, cel mai important, eram cu adevărat împăcată cu ideea că s-a terminat.</p>
          <p>Fostul nu mai avea nicio putere în viața mea. Era ca un film pe care l-am văzut demult și care a trecut.</p>
          <p>Nu mai simțeam nevoia să-i scriu. Nu-l mai comparam pe noul partener cu el. Nu-mi mai păsa de el. Nici măcar curioasă nu mai eram ce se întâmplă în viața lui.</p>
        </div>

        <RedH>Și nu doar că am trecut peste</RedH>

        <Img src="strategy.png" alt="O viață nouă" />

        <div className="space-y-4">
          <p>Am prins curajul să-mi dau voie să cunosc alți bărbați și să mă îndrăgostesc din nou.</p>
          <p>Am ajuns la concluzia că meritam un bărbat mai bun. Și l-am găsit.</p>
          <p>Un bărbat care îmi este cu adevărat fidel, care mă iubește, care nu e toxic, care e implicat și care m-a cerut de nevastă. Un bărbat lângă care mă simt în siguranță, lângă care pot să fiu vulnerabilă și lângă care am putut să-mi fac o familie.</p>
          <p>Nu doar că îl iubesc. Îl iubesc mai mult decât pe fostul.</p>
        </div>

        <Img src="flowers.png" alt="O relație nouă, sănătoasă" />

        <div className="space-y-4">
          <p>La început am crezut că am avut noroc.</p>
          <p>Dar într-o zi prietenele mele m-au întrebat ce anume am făcut. Le-am povestit despre metodă, le-am explicat cum funcționează și, la insistențele lor, le-am explicat pașii.</p>
          <p>Din nou, am rămas uimită: <strong>funcționa de fiecare dată</strong>.</p>
          <p>Zvonul s-a răspândit și în scurt timp primeam mesaje de la femei pe care nici nu le cunoșteam. Femei care voiau și ele să știe cum să scape de durerea unei despărțiri, cum să treacă peste și cum să-și găsească un bărbat care să le iubească cu adevărat.</p>
          <p>Văzând cât de mare este nevoia și cât de mult poate ajuta această metodă, am decis să o scriu într-o carte.</p>
        </div>

        <RedH sm>Am numit-o<br /><span className="text-[28px] sm:text-[34px]">„Oprește Durerea Despărțirii"</span><br /><span className="text-[15px] font-normal">Cum Să Treci Peste Despărțire, Să-Ți Recapeți Încrederea Și Să Găsești O Nouă Iubire</span></RedH>

        <Img src="book.png" alt="Oprește Durerea Despărțirii — 165 de pagini" max="max-w-md sm:max-w-lg" />

        <div className="space-y-4">
          <p>Cartea are <strong>165 de pagini</strong>, este în format <strong>PDF</strong> și o primești imediat după comandă. Nu trebuie să aștepți livrarea, nu trebuie să ieși din casă. O citești direct pe telefon.</p>
          <p>Nu-ți promit miracole peste noapte. Dar îți promit că, dacă faci exact ce scrie acolo, durerea o să înceapă să se stingă.</p>
          <p>Pentru că știu cum e. Știu cum e să plângi în fiecare seară. Știu cum e să te prefaci că ești bine când tu ești moartă pe dinăuntru. Știu cum e să crezi că nu vei mai iubi niciodată pe cineva la fel.</p>
          <p>Și mai știu și că se poate ieși din starea asta. Nu cu vorbe goale. Nu așteptând. Ci cu o metodă reală, pe care oricine o poate aplica.</p>
        </div>

        <CTA onClick={scrollToOffer} />

        <RedH sm>Uite o parte din ce vei descoperi în carte…</RedH>
        <ul className="list-disc pl-6 space-y-3">
          <li>De ce creierul tău se agață de fostul partener <strong>ca de un drog</strong> — și cum să rupi această dependență, pas cu pas. <em>(pagina 12)</em></li>
          <li>Un exercițiu simplu de <strong>2 minute</strong> care oprește imediat gândurile obsesive la el. <em>(pagina 26)</em></li>
          <li>Ce să faci exact când simți nevoia bruscă de a-i verifica rețelele sociale sau ultima conectare — și cum să scapi de impulsul ăsta fără să te chinui. <em>(pagina 41)</em></li>
          <li>O tehnică pe care o poți folosi oriunde (chiar și la serviciu) și care calmează anxietatea în <strong>mai puțin de 90 de secunde</strong>. <em>(pagina 58)</em></li>
          <li>Cum să-ți transformi tristețea într-o forță care te face <strong>mai atrăgătoare</strong>, nu mai fragilă — fără să te prefaci. <em>(pagina 73)</em></li>
          <li>Greșelile pe care le fac majoritatea femeilor după o despărțire și care le țin blocate <strong>ani întregi</strong>. <em>(pagina 89)</em></li>
          <li>Cum să nu mai aștepți mesajul lui, fără să-ți impui forțat „să-l uiți" — o soluție blândă care funcționează chiar dacă încă mai ai sentimente pentru el. <em>(pagina 102)</em></li>
          <li>Ce să faci când o amintire cu el te lovește din senin și simți că te sufoci. <em>(pagina 115)</em></li>
          <li>Cum să-ți refaci stima de sine după o relație toxică sau după un divorț, chiar dacă ai fost umilită. <em>(pagina 130)</em></li>
          <li>Pașii concreți prin care îți recapeți pofta de viață și te pregătești pentru o nouă iubire, una mai sănătoasă și mai frumoasă. <em>(pagina 148)</em></li>
          <li>Cum să te vindeci chiar dacă încă mai vorbești cu el sau o parte din tine nu vrea să treacă peste.</li>
        </ul>

        <Img src="bullets.png" alt="Ce vei învăța" />

        <div className="space-y-4">
          <p>… și multe, multe altele. Cartea e plină de astfel de „secrete" mici, dar extrem de puternice.</p>
          <p>Important e că toate duc către același loc: <strong>liniștea ta</strong>.</p>
        </div>

        <RedH sm>Cât valorează liniștea ta?</RedH>

        <div className="space-y-4">
          <p>La terapie, o singură ședință costă între <strong>150 și 250 de lei</strong>, iar pentru rezultate vizibile ai nevoie de luni sau ani.</p>
          <p>Medicamentele? Ameliorări temporare și efecte secundare.</p>
          <p>Lunile pierdute suferind? Alea nu mai vin înapoi niciodată.</p>
          <p>Cartea mea, cu toate metodele și exercițiile, am vândut-o inițial la prețul de <span className="line-through">197 de lei</span>. O sumă corectă dacă ne gândim la densitatea informației și la potențialul ei de a-ți schimba viața.</p>
          <p>Cu toate acestea, mi-am dorit ca ea să fie accesibilă oricărei femei care suferă, indiferent de buzunarul ei. De aceea, astăzi și doar de pe această pagină, prețul este:</p>
        </div>

        {/* ===== OFFER ===== */}
        <div id="oferta" className="bg-white border-2 border-[#c9a44a] rounded-2xl p-6 my-6 text-center shadow-lg">
          <img src="/img/femei-biblia/book.png" alt="Cum să Oprești Durerea unei Despărțiri" className="block w-full max-w-md sm:max-w-lg mx-auto my-4 rounded-2xl shadow-md" />
          <p className="font-bold text-[#1b2d4f] mb-3">Următoarele <strong>100 de cărți</strong> le voi vinde pentru <strong>DOAR 67 lei</strong> <span style={{ color: "#15803d" }}>(reducere primele 100 de cărți: 197 lei → 67 lei)</span>.</p>
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-[#94a3b8] line-through text-xl">197 lei</span>
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
                className="w-full bg-white border border-[#cbd5e1] rounded-full px-4 py-3 text-[15px] mb-1 outline-none focus:border-[#cc0000]"
                style={emailError ? { borderColor: "#cc0000" } : {}}
              />
              {emailError && <p className="text-xs text-[#dc2626] mb-1 text-left">Te rog introdu o adresă de email validă.</p>}
              <button
                type="submit"
                disabled={emailSaving}
                className="w-full max-w-md mx-auto block text-center bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-extrabold py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-lg active:scale-[0.98] my-3 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSaving ? "Se verifică..." : "Vezi dacă mai poți achiziționa Cum să Oprești Durerea unei Despărțiri la 67 de lei"}
              </button>
            </form>
          )}
          <p className="text-xs text-[#64748b] mt-1">🔒 Garanție 30 de zile · Acces imediat pe email</p>
        </div>

        {/* ===== 30-DAY GUARANTEE (CSS badge, was a 60-day image) ===== */}
        <div className="text-center my-8">
          <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-[#c9a44a] bg-[#fffdf5] mx-auto mb-4 shadow-md">
            <span className="text-[34px] font-extrabold leading-none" style={{ color: RED }}>30</span>
            <span className="text-[11px] font-bold text-[#1b2d4f] tracking-wide">DE ZILE</span>
            <span className="text-[10px] font-semibold text-[#64748b] tracking-widest mt-0.5">GARANȚIE</span>
          </div>
          <p>
            Vreau să te simți complet în siguranță atunci când faci această alegere pentru tine.
          </p>
          <p className="mt-3">
            Citește cartea cap-coadă, aplică exercițiile și lasă-ți timp să vezi cum reacționezi. Dacă, din orice motiv, în următoarele <strong>30 de zile</strong> simți că nu te-a ajutat,
            îmi poți trimite un email la <a href="mailto:cristina@pestedespartire.ro" className="text-[#1155cc] underline">cristina@pestedespartire.ro</a>, iar eu îți voi returna personal fiecare leu,
            fără să-ți cer explicații și fără să te pun să completezi formulare.
          </p>
          <p className="mt-3 font-bold">
            Asta înseamnă că nu ai absolut nimic de pierdut — nici măcar durerea, pentru că ea va începe oricum să se retragă.
          </p>
        </div>

        <p className="my-6">
          <strong>Cu drag, Cristina.</strong><br /><br />
          <strong>P.S.</strong> Tot ce trebuie să faci ca să primești cartea este să dai click pe butonul de mai sus. Dar grăbește-te — fiecare zi în care rămâi blocată în durere este o zi pe care nu ți-o mai dă nimeni înapoi.
        </p>

        {/* ===== TESTIMONIALS ===== */}
        <Testimonial name="Ioana, 29 de ani, București" text={`După 5 ani de relație, m-a înșelat și a plecat cu alta. Am rămas distrusă. Am cumpărat cartea într-o seară, am citit-o până târziu și am început să aplic. În a 3-a zi m-am trezit fără durerea din piept. Am crezut că e întâmplare. Am continuat. Acum, după o lună, sunt un om nou. Nu mai plâng, nu-l mai caut, și am ieșit la o cafea cu un bărbat foarte drăguț. Nu m-aș fi crezut capabilă de asta.`} />
        <Testimonial name="Gabriela, 46 de ani, Iași" text={`Divorț după 18 ani de căsnicie. Am crezut că mor. Copiii mă țineau pe linia de plutire. Cartea Cristinei m-a ajutat mai mult decât 6 luni de terapie. Exercițiile sunt atât de simple, dar atât de bune! Acum mă simt din nou femeie, nu doar mamă.`} />
        <Testimonial name="Andreea, 33 de ani, Cluj" text={`Relație toxică, cu certuri și umilințe. Deși știam că e mai bine fără el, tot mă întorceam cu gândul la el. Cartea m-a făcut să înțeleg de ce. Am făcut exercițiile și, pe bune, parcă mi s-a luat o piatră de pe inimă. Mă respect pentru prima dată după mult timp.`} />

        <Img src="testimonials.png" alt="Recenzii clienți" />

        {/* ===== ÎNTREBĂRI FRECVENTE ===== */}
        <RedH sm>Întrebări frecvente despre carte</RedH>
        <div className="space-y-3 my-4">
          {[
            {
              q: "Am avut o relație scurtă. Cartea mă ajută?",
              a: "Da. Durerea nu ține cont de cât a durat relația. Metoda funcționează indiferent de situație.",
            },
            {
              q: "Sunt după divorț, am copii. E pentru mine?",
              a: "Da. Sunt capitole dedicate exact femeilor care își refac viața după o căsnicie lungă. Vei găsi sprijin real.",
            },
            {
              q: "Cartea mă ajută să-l recuperez pe fostul?",
              a: "NU. Această carte NU te învață cum să-l aduci înapoi. Te învață cum să fii tu bine, indiferent de ce face el.",
            },
            {
              q: "Am peste 50 de ani. Mai are rost?",
              a: "Are. Am primit mesaje de la femei de 50+ care și-au regăsit bucuria de a trăi. Nu există vârstă pentru vindecare.",
            },
            {
              q: "Dacă nu funcționează pentru mine?",
              a: "Îmi scrii în 30 de zile și primești banii înapoi. Garanția este totală. Nu pierzi nimic.",
            },
            {
              q: "În cât timp văd primele schimbări?",
              a: "Multe cititoare spun că simt o diferență încă din primele zile, mai ales când aplică exercițiile de procesat emoții atunci când se gândesc la el.",
            },
          ].map((item) => (
            <details key={item.q} className="bg-[#fffdf7] border border-[#e8d9a0] rounded-xl p-4">
              <summary className="cursor-pointer font-bold text-[#1b2d4f] text-[16px]">{item.q}</summary>
              <p className="mt-2 text-[#334155] leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>

        {/* BIG ARROW IMAGE + FINAL CTA */}
        <div className="text-center my-6">
          <img src="/img/arrow-down.png" alt="⬇" className="w-32 mx-auto mb-2" />
        </div>
        <CTA onClick={scrollToOffer} />

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-[#dde3ef] pt-6 mt-8 text-center text-xs text-[#94a3b8] space-x-3">
          <Link href="/termeni" className="hover:text-[#1b2d4f]">Termeni și Condiții</Link>
          <Link href="/privacy" className="hover:text-[#1b2d4f]">Politica de Confidențialitate</Link>
          <Link href="/rambursare" className="hover:text-[#1b2d4f]">Politica de Rambursare</Link>
          <Link href="/contact" className="hover:text-[#1b2d4f]">Contact</Link>
          <Link href="/affiliate/register" className="hover:text-[#1b2d4f]">Afiliere</Link>
          <p className="mt-3"><Link href="/femei/achizitii" className="font-semibold text-[#1b2d4f] underline hover:text-[#cc0000]">Ai cumpărat deja? Apasă aici</Link></p>
          <p className="mt-3">© 2026 TeVreauInapoi</p>
        </footer>
      </div>

      {exitOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white border-2 border-[#e8c96a] rounded-2xl p-6 max-w-md w-full text-center relative" style={{ boxShadow: "0 0 60px rgba(232,201,106,.4)" }}>
            <button
              onClick={() => setExitOffer(false)}
              className="absolute top-2 right-3 text-[#94a3b8] hover:text-[#1a1a2e] text-xl"
              aria-label="Închide"
            >✕</button>
            <img src="/img/femei-biblia/book.png" alt="Cum să Oprești Durerea unei Despărțiri" className="w-32 mx-auto mb-3 rounded-lg shadow-lg" />
            <h3 className="font-extrabold text-xl mb-2" style={{ color: RED }}>Așteaptă! Nu pleca încă…</h3>
            <p className="text-sm text-[#64748b] mb-3">
              Îți ofer <strong>Cum să Oprești Durerea unei Despărțiri</strong> (207 pagini) cu o reducere specială, doar pentru tine, chiar acum.
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-[#94a3b8] line-through text-xl">67 lei</span>
              <span className="text-[44px] font-extrabold leading-none" style={{ color: "#b8860b" }}>{FEMEI_EXIT_OFFER_PRICE} <span className="text-2xl">RON</span></span>
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
                  className="w-full border border-[#cbd5e1] rounded-full px-4 py-3 text-[15px] outline-none focus:border-[#cc0000] bg-white"
                  style={popupEmailError ? { borderColor: "#dc2626" } : {}}
                />
                {popupEmailError && <p className="text-xs text-[#dc2626] mt-1">Te rog introdu o adresă de email validă.</p>}
              </div>
            )}
            <button
              onClick={acceptExitOffer}
              disabled={popupSaving}
              className="w-full bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white font-extrabold py-3.5 px-6 rounded-full shadow-lg hover:shadow-xl transition-all text-base uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {popupSaving ? "Se verifică..." : knownEmail ? ("Da, vreau oferta la " + FEMEI_EXIT_OFFER_PRICE + " lei →") : "Da, trimite-mi oferta la " + FEMEI_EXIT_OFFER_PRICE + " lei →"}
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