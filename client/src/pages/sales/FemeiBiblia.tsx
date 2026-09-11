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
          <span className="inline-block bg-[#1b2d4f] text-[#e8c96a] text-xs font-bold tracking-widest px-4 py-1.5 rounded-full">CARTE INCLUSĂ</span>
        </div>

        <h1 className="text-center text-[26px] sm:text-[32px] font-extrabold leading-tight font-['Playfair_Display'] mb-6" style={{ color: RED }}>
          Cum M-am Împăcat Cu El Folosind Hormonul Iubirii — Și Cum Poți Folosi Aceeași Strategie <span className="whitespace-nowrap">(Funcționează în 2026)</span>
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
        <RedH>Am descoperit o strategie psihologică șocantă care poate reaprinde iubirea în inima oricărui bărbat, indiferent de cât de rece și distant a devenit</RedH>

        <div className="space-y-4">
          <p>Eram genul de fată care făcea TOTUL pentru iubitul ei. Eram împreună de trei ani și eram convinsă că ne vom căsători. Eram loială, iubitoare și complet dedicată lui. Aș fi făcut orice ca să-l fac fericit.</p>
          <p>Dar oricât de mult am încercat să fiu iubita perfectă, el mi-a frânt inima oricum. Într-o seară, din senin, mi-a spus cele patru cuvinte de care mă temeam cel mai mult: <em>„Vreau să ne despărțim."</em></p>
          <p>Am fost distrusă. Zile întregi, i-am trimis mesaje implorându-l să se întoarcă și rugându-l să ne mai dăm o șansă. Mi-am cerut scuze pentru toate momentele în care am fost dificilă. Făceam tot ce-mi stătea în putere ca să-i arăt că îl iubesc… dar fiecare încercare nu făcea decât să-l îndepărteze și mai mult.</p>
        </div>

        <Img src="story2.png" alt="Despărțirea" />

        <div className="space-y-4">
          <p>Apoi într-o zi... s-a întâmplat ceva de necrezut, ceva care mi-a întors stomacul pe dos. Era la două săptămâni după despărțire, la ziua de naștere a unui prieten comun. M-am dus sperând că l-aș putea vedea și că și-ar da seama ce greșeală a făcut.</p>
          <p>M-am îmbrăcat cu rochia lui roșie preferată, m-am aranjat perfect și am intrat cu un zâmbet plin de speranță. Numai că atunci când l-am găsit, nu era singur...</p>
          <p>L-am văzut râzând pe canapea cu brațul înfășurat strâns în jurul unei alte fete... O blondă mai tânără și mai frumoasă... Se uita la ea cu aceeași privire cu care se uita la mine odată. Și într-un moment care a părut o veșnicie, s-au sărutat.</p>
          <p>Fără să vreau… mi-am scăpat paharul din mână și s-a făcut țăndări pe podea... ceea ce i-a atras atenția.</p>
        </div>

        <Img src="story3.png" alt="Momentul de cotitură" />

        <div className="space-y-4">
          <p><em>„Ce naiba faci aici?"</em> mi-a zis el, apărând-o pe noua lui iubită de parcă eu aș fi fost un fel de monstru.</p>
          <p>Am fugit de la petrecere și în zilele ce au urmat, am dispărut. Nu m-am dus la muncă... Nu am răspuns la niciun mesaj... Eram convinsă că am o cădere nervoasă. Mă simțeam în cel mai jos punct al vieții mele. Plângeam toată ziua și toată noaptea după un prost… Dar prost cum era, îl iubeam și îl voiam înapoi.</p>
          <p>Așa că am decis să nu-mi mai plâng de milă și să învăț cum alte femei au reușit să-și aducă foștii înapoi. Fiind foarte tocilară, am citit toate cărțile și articolele științifice pe care le-am putut găsi despre psihologia relațiilor și cum funcționează creierul bărbaților…</p>
        </div>

        <RedH>Și atunci am descoperit: o strategie care îi declanșează <u>Hormonul Iubirii</u> în creierul și inima unui bărbat și care îl face să simtă o dorință irezistibilă să fie înapoi cu tine.</RedH>

        <Img src="strategy.png" alt="Hormonul iubirii" />

        <div className="space-y-4">
          <p>O strategie care îl va face să uite orice altă fată, să-și șteargă sentimentele negative față de tine și să te vadă ca fiind <strong>„Aleasa"</strong> cu care trebuia să fie mereu.</p>
          <p>Când folosești această strategie, accesezi direct partea din creierul lui animalic care controlează frica de a te pierde.</p>
          <p>Așa că după săptămâni întregi în care am stat închisă în apartamentul meu, plângând în pijamale, am decis să încerc strategia. I-am trimis un mesaj de 7 cuvinte... un mesaj special la care <strong>bărbații nu pot rezista</strong>.</p>
          <p>În 10 minute, mi-a răspuns pentru prima dată în săptămâni. A doua zi, l-am făcut să mă invite la o întâlnire și să-mi recunoască că îi era dor de mine. În următoarea săptămână, l-am făcut să creadă că ideea de a se împăca cu mine e de fapt ideea lui. La scurt timp a apărut la ușa mea cu flori implorându-mă pentru o a doua șansă.</p>
        </div>

        <Img src="flowers.png" alt="A revenit cu flori" />

        <div className="space-y-4">
          <p>Entuziasmată de succesul meu, am început să le spun despre această strategie și prietenelor mele care treceau prin despărțiri similare. Au aplicat-o și rezultatele lor m-au șocat chiar și pe mine: <strong>funcționa de fiecare dată</strong>.</p>
          <p>Vestea s-a răspândit și în scurt timp am ajuns să primesc mesaje de la foarte multe femei care mă rugau să le învăț cum să-l facă pe fostul lor să-și dorească să se împace cu ele. Neavând suficient timp pentru a le ajuta pe toate, am decis să scriu întreaga strategie într-o carte. Îți prezint:</p>
        </div>

        <RedH sm>Cartea virtuală în format PDF numită<br /><span className="text-[28px] sm:text-[34px]">„Cum să Oprești Durerea unei Despărțiri"</span><br />(207 pagini)</RedH>

        <Img src="book.png" alt="Cum să Oprești Durerea unei Despărțiri — 207 pagini" max="max-w-md sm:max-w-lg" />

        <div className="space-y-4">
          <p>Am ales acest nume deoarece este cea mai avansată și puternică carte din România de acest gen (și crede-mă, le-am citit pe toate).</p>
          <p>Această carte te învață tot ce trebuie să <strong>FACI</strong> (și ce să <strong>NU faci</strong>) pentru a-i declanșa hormonul iubirii și a-l face pe acel bărbat să se întoarcă din nou în viața ta, total îndrăgostit de tine.</p>
          <p>Nu contează dacă este cu altcineva... dacă ți-a spus să nu-l mai contactezi niciodată... sau dacă crezi că situația ta este fără speranță. Strategia a fost șlefuită pe durerea și succesul a sute de femei. Va funcționa pentru aproape orice femeie, chiar și dacă:</p>
          <ul className="list-disc pl-6 space-y-1.5 marker:text-[#cc0000]">
            <li>Te consideri un caz pierdut, au trecut luni de la despărțire sau el deja este îndrăgostit de altcineva</li>
            <li>Tu te-ai despărțit de el și acum îl vrei înapoi</li>
            <li>Te-ai rugat deja de el de o mie de ori să vă împăcați</li>
            <li>Crezi că e imposibil să te mai iubească vreodată</li>
          </ul>
        </div>

        <CTA onClick={scrollToOffer} />

        <RedH sm>Iată o mică parte din ce vei găsi în carte…</RedH>
        <ul className="list-disc pl-6 space-y-3">
          <li>Cum să apeși <strong>„Butonul de Resetare"</strong> — o metodă simplă de a repara instantaneu greșelile care îl fac să se îndepărteze, forțându-l să te vadă din nou ca pe femeia de care s-a îndrăgostit. <em>(pagina 54)</em></li>
          <li>De ce nu ar trebui să-i spui aproape niciodată <strong>„îmi pare rău"</strong> — și ce să faci în schimb atunci când el te va contacta (și crede-mă, o va face). <em>(pagina 20)</em></li>
          <li><strong>Cum să-l faci gelos</strong> (fără să pari patetică). O simplă poză sau story care îi declanșează un junghi de gelozie și regret. <em>(pagina 112)</em></li>
          <li>Replici speciale care îl fac să simtă o dorință profundă pentru tine — genul care îl face să se gândească obsesiv la tine zi și noapte. <em>(pagina 101)</em></li>
          <li>Cum să reiei contactul, ce mesaj exact să-i trimiți, când să accepți o întâlnire și cum să escaladezi totul.</li>
          <li>Cum să-i ștergi complet amintirile negative și să le înlocuiești cu gânduri plăcute despre viitorul vostru. <em>(pagina 159)</em></li>
          <li>O tehnică subtilă care reaprinde „magia" și „scânteia" pe care ați avut-o când v-ați sărutat prima dată. <em>(pagina 148)</em></li>
          <li><strong>Singura greșeală fatală</strong> care îți garantează că îl vei pierde pentru totdeauna — aproape toate femeile o fac din disperare. Tu vei fi cea care o evită. <em>(pagina 102)</em></li>
        </ul>

        <Img src="bullets.png" alt="Ce vei învăța" />

        <div className="space-y-4">
          <p>Cât ai fi dispusă să plătești ca să fiți din nou împreună și să te iubească mai mult ca oricând? Ai plăti 1.000 de euro? Dar €500? Dar €100?</p>
          <p>Stai liniștită, nu îți voi cere atât. De obicei cartea mea se vinde cu <span className="line-through">149 lei</span>. Dar astăzi derulez o ofertă specială.</p>
        </div>

        {/* ===== OFFER ===== */}
        <div id="oferta" className="bg-white border-2 border-[#c9a44a] rounded-2xl p-6 my-6 text-center shadow-lg">
          <img src="/img/femei-biblia/book.png" alt="Cum să Oprești Durerea unei Despărțiri" className="block w-full max-w-md sm:max-w-lg mx-auto my-4 rounded-2xl shadow-md" />
          <p className="font-bold text-[#1b2d4f] mb-3">Următoarele <strong>100 de cărți</strong> le voi vinde pentru <strong>DOAR 67 lei</strong> <span style={{ color: "#15803d" }}>(reducere primele 100 de cărți: 149 lei → 67 lei)</span>.</p>
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
            Îți ofer o perioadă de încercare de <strong>30 de zile</strong> în care poți primi banii înapoi dacă nu ești mulțumită, fără întrebări. <strong>Tot riscul este de partea mea!</strong> Scrie-mi la <a href="mailto:anca@pestedespartire.ro" className="text-[#1155cc] underline">anca@pestedespartire.ro</a> pentru o rambursare rapidă.
          </p>
        </div>

        <p className="my-6">
          <strong>Cu drag, Cristina.</strong><br /><br />
          <strong>P.S.</strong> Tot ce trebuie să faci pentru a accepta oferta și a primi cartea este să dai click pe butonul „Vezi dacă mai poți achiziționa Cum să Oprești Durerea unei Despărțiri la 67 de lei" de mai sus. Dar grăbește-te — fiecare secundă pe care o pierzi așteptând este o altă secundă în care fostul tău s-ar putea îndrăgosti de altcineva.
        </p>

        {/* ===== TESTIMONIALS ===== */}
        <Testimonial name="Andreea C. (București)" text={`Prietenele mele îmi ziceau să ies cu alții ca să-l fac gelos sau să renunț la iubirea noastră. Noroc că am dat de această carte înainte să fac vreo prostie.\nCartea și ajutorul ei personalizat m-au ajutat enorm să-l fac pe iubitul meu să-și recapete interesul în relație și acum suntem din nou fericiți împreună.`} />
        <Testimonial name="Bianca R. (Cluj-Napoca)" text={`Dacă ești în faza în care plângi și îți vine să-l suni non-stop să-i ceri explicații, trebuie să citești cartea asta.\nModul în care te învață să-i scrii este genial. Abordarea e super matură și bazată pe psihologie. Nu doar că nu m-am mai milogit de el, dar el a cerut să ne împăcăm.`} />
        <Testimonial name="Elena M. (Pitești)" text={`Situația mea era groaznică, eu și soțul meu pur și simplu nu ne mai înțelegeam, parcă vorbeam limbi diferite.\nCartea asta mi-a arătat unde greșeam fără să-mi dau seama. Am aplicat pașii și, pentru prima dată după luni de zile, suntem din nou împreună.`} />
        <Testimonial name="Ioana E. (București)" text={`Când și-a luat lucrurile și mi-a zis că are nevoie de spațiu, am crezut că s-a terminat definitiv. Eram praf.\nO prietenă mi-a recomandat Cum să Oprești Durerea unei Despărțiri și într-un final am înțeles cum funcționează mintea bărbaților. Am urmat pașii, am schimbat total placa, iar acum o lună ne-am împăcat. Trage el de relația asta mai mult decât mine acum!`} />

        <Img src="testimonials.png" alt="Recenzii clienți" />

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