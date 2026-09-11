import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trackViewContent } from "@/lib/tracking";

/**
 * Coaching standalone sales page (recurring 147 RON/mo) — copy identical to the
 * live page for men (/barbati/sfaturipersonalizate), gender-adapted for women.
 * CTA → the on-page checkout for the coaching product.
 */
export default function Coaching() {
  const [location] = useLocation();
  const isMen = !location.includes("/femei");
  const checkoutHref = (isMen ? "/barbati/checkout" : "/femei/checkout") + "?product=coaching";
  useEffect(() => { trackViewContent({ productName: isMen ? "sustinere-barbati" : "sustinere-femei", value: 147, gender: isMen ? "male" : "female" }); }, [isMen]);

  const t = isMen
    ? { bg: "#ffffff", fg: "#1a1a2e", card: "#ffffff", border: "#e2e8f0", red: "#c8102e", muted: "#64748b", cta: "from-[#c8102e] to-[#a50d23]", radius: "rounded-md" }
    : { bg: "#f0f3f8", fg: "#1a1a2e", card: "#ffffff", border: "#e8d9a0", red: "#cc0000", muted: "#64748b", cta: "from-[#b8860b] to-[#c9a44a]", radius: "rounded-2xl" };

  const CTA = () => (
    <Link href={checkoutHref}
      className={`block w-full max-w-md mx-auto text-center bg-gradient-to-r ${t.cta} text-white font-extrabold py-4 px-6 ${t.radius} shadow-lg hover:shadow-xl transition-all text-lg active:scale-[0.98] my-5 uppercase tracking-wide`}
      style={{ textDecoration: "none" }}>
      ACCEPTĂ OFERTA → 147 lei/lună
    </Link>
  );

  return (
    <div className="qz-wrap" style={{ background: t.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-8 text-[17px] leading-relaxed" style={{ color: t.fg }}>
        <div className="text-center font-bold tracking-widest text-sm mb-3" style={{ color: t.muted }}>✦ pestedespartire.ro</div>

        <h1 className="text-center text-[26px] sm:text-[31px] font-extrabold leading-tight mb-6" style={{ color: t.red }}>
          {isMen ? "Dacă Vrei Să Ai Șanse Maxime De Împăcare Cu Ea..." : "Dacă Vrei Să Ai Șanse Maxime De Împăcare Cu El..."}
        </h1>

        <div className="space-y-4">
          <p>Vezi tu... Adevărul e că situația ta e probabil unică și chiar și cu cea mai bună carte de împăcare de pe internet... Tot s-ar putea să faci greșeli...</p>
          <p>De aceea, în loc să te las să treci {isMen ? "singur" : "singură"} prin asta și să riști să {isMen ? "o" : "îl"} pierzi pentru totdeauna... consideră să intri în <strong>programul meu de sfaturi personalizate pe e-mail</strong>.</p>
          <p>Imediat ce îmi vei oferi câteva detalii cheie despre despărțirea voastră și îmi vei explica situația ta specifică... Voi construi un <strong>profil psihologic exact al {isMen ? "fostei tale partenere" : "fostului tău partener"}</strong>. Iar odată ce deținem aceste informații... Mă voi asigura personal că pur și simplu nu va avea altă opțiune decât să te vrea înapoi.</p>
          <p>Vom ști exact cum să-i atingem punctele vulnerabile și să-i eliberăm hormonul iubirii în creier.</p>
          <p>Odată ce înțelegi cum să te joci cu hormonul iubirii din creierul {isMen ? "ei" : "lui"}, e ca și cum i-ai citi gândurile. Îi vei putea provoca un <strong>dor real și palpabil</strong>... {isMen ? "o" : "îl"} vei putea face {isMen ? "obsedată" : "obsedat"} și {isMen ? "îndrăgostită" : "îndrăgostit"} de tine, așa cum nu credeai că mai e posibil... și, cel mai important, {isMen ? "o" : "îl"} vei determina să lase garda jos și să-și dorească {isMen ? "ea" : "el"} să vă împăcați. (poate chiar mai mult decât tine)</p>
          <p>Dar fii atent la un detaliu important: <strong>timpul meu este limitat</strong>. Poți vedea situația locurilor mai jos.</p>
        </div>

        {/* Scarcity */}
        <div className="rounded-xl p-5 my-6 text-center border" style={{ background: t.card, borderColor: t.border }}>
          <p className="font-bold mb-2" style={{ color: t.fg }}>Locuri Disponibile În Programul De Susținere Personală</p>
          <div className="text-[32px] font-extrabold" style={{ color: t.red }}>25 / 28</div>
          <p className="text-sm" style={{ color: t.muted }}>Mai SUNT doar <strong style={{ color: t.fg }}>3</strong> locuri rămase disponibile.</p>
        </div>

        <div className="space-y-4">
          <p>Odată ce ai intrat în program, nu mai ești {isMen ? "singur" : "singură"}. Îmi poți scrie de câte ori te simți {isMen ? "blocat" : "blocată"} sau nu știi ce să {isMen ? "îi" : "îi"} răspunzi sau ce să faci corect mai departe. Sunt la un e-mail distanță pentru a-ți corecta fiecare mișcare (îți răspund de obicei în aceeași zi sau a doua zi)</p>
        </div>

        {/* 30-day guarantee — NOT 60 */}
        <div className="text-center my-6">
          <div className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 mx-auto mb-3" style={{ borderColor: t.red, background: t.card }}>
            <span className="text-[28px] font-extrabold leading-none" style={{ color: t.fg }}>30</span>
            <span className="text-[10px] font-bold tracking-wide" style={{ color: t.fg }}>DE ZILE</span>
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: t.red }}>GARANȚIE</span>
          </div>
          <p className="font-bold" style={{ color: t.fg }}>Și Această Ofertă Este Protejată De Garanția Mea De 30 De Zile</p>
          <p className="text-sm" style={{ color: t.muted }}>Dacă nu vezi cum comportamentul {isMen ? "ei" : "lui"} se schimbă radical, trimite-mi un email la <a href="mailto:anca@pestedespartire.ro" className="underline" style={{ color: t.red }}>anca@pestedespartire.ro</a> și primești fiecare banuț înapoi.</p>
        </div>

        {/* Offer */}
        <div className="rounded-xl p-6 my-6 text-center border-2" style={{ background: t.card, borderColor: t.red }}>
          <p className="mb-2" style={{ color: t.muted }}>În mod normal, consultanța mea costă <span className="line-through">500 RON/lună</span>. Dar dacă acționezi acum, prin această pagină, primești accesul la Programul Meu De Susținere Personală...</p>
          <div className="text-[40px] font-extrabold leading-none mb-1" style={{ color: t.red }}>147 <span className="text-xl">RON/lună</span></div>
          <p className="text-sm font-bold mb-1" style={{ color: isMen ? "#22c55e" : "#15803d" }}>(care înseamnă 5 lei pe zi până când vă împăcați)</p>
          <p className="text-sm font-bold mb-1" style={{ color: isMen ? "#22c55e" : "#15803d" }}>O reducere directă de 70%. Fără costuri ascunse.</p>
          <p className="text-xs mb-4" style={{ color: t.muted }}>Poți să anulezi când dorești. Tot ce trebuie să faci este să-mi trimiți un email la anca@pestedespartire.ro. De asemenea, dacă nu folosești deloc programul de sfaturi personalizate ți-l voi anula personal pentru tine.</p>
          <CTA />
        </div>

        <div className="space-y-4">
          <p>Și da, ai putea cheltui acei bani pe alte chestii precum alcool, țigări sau ieșiri, care îți pot aduce alinare pe moment, dar amândoi știm că durerea despărțirii va reveni.</p>
          <p>Ca să nu mai doară o despărțire pe termen lung ai doar 2 opțiuni.</p>
          <p><strong>Treci peste și nu te mai gândești deloc la {isMen ? "ea" : "el"}</strong> (mulți oameni nu reușesc niciodată asta)</p>
          <p><strong>Te împaci cu {isMen ? "ea" : "el"} și sunteți din nou fericiți împreună</strong></p>
          <p>Tu alegi ce vrei să încerci.</p>
          <p>Acum că am eliminat tot riscul... și ți-am oferit programul de sfaturi personalizate la cel mai mic preț posibil, este timpul să treci la acțiune.</p>
          <p>Dar trebuie să te grăbești... Amândoi știm că timpul nu este de partea noastră după o despărțire. Cu cât trece mai mult timp, cu atât cresc șansele să-și găsească pe altcineva și să uite de tine.</p>
          <p>De aceea, dacă mai sunt locuri disponibile îți recomand să acționezi astăzi. Altfel locul tău se poate duce la altcineva.</p>
          <p>De asemenea, datele tale și toate informațiile pe care mi le dai rămân strict între noi doi. Nu le voi distribui niciodată mai departe și eu sunt singura care are acces la ele.</p>
          <p>147 lei pe lună înseamnă 5 lei pe zi până la împăcare. Merită relația ta atât? Merită 5 lei pe zi să primești șansa de a scăpa de durerea despărțirii pentru totdeauna?</p>
          <p>După ce apeși „Acceptă Oferta" vei primi un email de la mine pe adresa ta de email pe care ai completat-o.</p>
        </div>

        {/* Trust */}
        <div className="rounded-xl p-5 my-6 text-sm space-y-3" style={{ background: t.card, borderColor: t.border, border: "1px solid" }}>
          <p><strong style={{ color: t.fg }}>Plata este 100% sigură</strong> și respectă cel mai înalt standard de securitate astfel încât eu nu voi avea niciodată acces la datele cardului tău (și nici nu voi putea vedea ce completezi).</p>
          <p style={{ color: t.muted }}>Pe extrasul tău bancar va apărea o plată către „ANCA STEFANESCU", fără alte detalii, astfel încât nimeni nu va ști ce ai cumpărat.</p>
        </div>

        {/* FAQ */}
        <div className="space-y-4 my-6">
          <div>
            <p className="font-bold" style={{ color: t.fg }}>Cât durează până la împăcare?</p>
            <p style={{ color: t.muted }}>Depinde foarte mult de cât de complicată e situația dintre voi. Am văzut cazuri în care au reușit să se împace într-o săptămână sau două. Și am văzut cazuri care au durat 1 lună, 2 luni sau chiar 3 luni. Dar toți aceștia au spus că s-a meritat și acum au o relație așa cum își doreau. Ce este sigur e că îți voi oferi cel mai rapid drum cu cele mai multe șanse de împăcare.</p>
            <p style={{ color: t.muted }}>Acum tu trebuie să decizi. Dacă ai ști că v-ați împăca în 1 sau 2 luni dacă faci ce-ți zic, s-ar merita?</p>
          </div>
          <div>
            <p className="font-bold" style={{ color: t.fg }}>De ce să mă asculți pe mine?</p>
            <p style={{ color: t.muted }}>În primul rând, nu sunt psiholog și nu sunt doctor. Sunt o autoare care a ajutat foarte mulți oameni să-și repare relațiile. În al doilea rând sunt femeie și știu ce gândesc femeile... Știu ce face o femeie obsedată până în punctul în care nu mai are somn noaptea și nu se poate gândi decât la tine. Știu ce o face pe o femeie să te iubească și să-ți ierte greșelile chiar dacă ți-a spus că te urăște și nu mai vrea să vadă niciodată. Și știu ce greșeli o fac să plece pentru totdeauna. Secretul stă în ceva numit hormonul iubirii și cum trebuie să vorbești și să te comporți ca să îl activezi (îți voi arăta asta în programul de sfaturi personalizate).</p>
          </div>
          <div>
            <p className="font-bold" style={{ color: t.fg }}>Va funcționa?</p>
            <p style={{ color: t.muted }}>Să fiu sinceră cu tine, dacă ceea ce te învăț nu {isMen ? "o" : "îl"} aduce înapoi în brațele tale, cel mai probabil nimic altceva nu {isMen ? "o" : "îl"} va face și măcar vei ști că ai făcut tot ce puteai face dar nu v-a fost sortit să vă împăcați.</p>
          </div>
          <div>
            <p className="font-bold" style={{ color: t.fg }}>Mai am și alte întrebări, nelămuriri sau nu sunt încă convins că va funcționa în situația mea</p>
            <p style={{ color: t.muted }}>Poți să-mi trimiți un email la adresa <a href="mailto:anca@pestedespartire.ro" className="underline" style={{ color: t.red }}>anca@pestedespartire.ro</a> și putem discuta personal despre orice dorești înainte să te decizi. Nu te judec și nu mușc :)</p>
          </div>
        </div>

        <CTA />

        <footer className="border-t pt-6 mt-8 text-center text-xs space-x-3" style={{ borderColor: t.border, color: t.muted }}>
          <Link href="/termeni" className="hover:underline">Termeni și Condiții</Link>
          <Link href="/privacy" className="hover:underline">Politica de Confidențialitate</Link>
          <Link href="/rambursare" className="hover:underline">Politica de Rambursare</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/affiliate/register" className="hover:underline">Afiliere</Link>
          <p className="mt-3">© 2026 TeVreauInapoi</p>
        </footer>
      </div>
    </div>
  );
}
