import { Check, ChevronDown, FileText, LockKeyhole, MailX, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { ProductArt } from "./WeightlossProductArt";
import { formatWeightlossPrice, weightlossProducts } from "@/flows/weightlossProducts";

const struggleList = [
  "Te simți blocat(ă), indiferent câte reguli alimentare ai încercat.",
  "Ai energie bună pentru scurt timp, apoi urmează iar o perioadă de oboseală.",
  "Îți este greu să alegi ce să pui în farfurie fără să cauți încă o listă pe internet.",
  "Ai impresia că orice plan începe bine, dar devine prea complicat pentru viața ta reală.",
  "Vrei o explicație mai limpede și o rutină pe care să o poți repeta.",
];

const reasons = [
  ["Motivul #1 — Mesele construite doar în jurul produselor foarte procesate", "Când cea mai mare parte a alegerilor vine din produse ambalate, este mai dificil să înțelegi ce te ajută să rămâi sătul(ă), concentrat(ă) și consecvent(ă)."],
  ["Motivul #2 — Reguli multe, fără un cadru simplu", "Un plan care nu se potrivește programului tău va fi greu de urmat, chiar dacă ideile sună bine pe hârtie. Asta nu spune nimic despre voința ta."],
  ["Motivul #3 — Lipsa unor idei practice pentru ziua de mâine", "Informația devine valoroasă atunci când o poți transforma într-un mic dejun, un prânz, o listă de cumpărături și o decizie mai ușoară la următoarea masă."],
];

const faq = [
  ["Cum primesc produsul?", "După confirmarea plății, primești acces la pagina securizată de descărcare și un e-mail cu confirmarea comenzii."],
  ["Este un program medical?", "Nu. Materialele sunt educaționale și generale. Ele nu oferă diagnostic, tratament sau recomandare medicală personalizată."],
  ["Pot reveni mai târziu la produse?", "Da. Pagina de acces îți permite să verifici descărcările cu e-mailul utilizat la plată și codul comenzii."],
];

function PaperRule() {
  return <div className="mx-auto my-8 h-px w-full bg-[#d7d7d7]" />;
}

export default function SalesPage() {
  const product = weightlossProducts.bucatarie;
  return (
    <div className="min-h-screen bg-[#ededed] font-sans text-[#252525]">
      <div className="sticky top-0 z-50 h-12 bg-[#242424] text-white shadow-sm">
        <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-3 text-[11px] sm:px-5">
          <span className="font-serif text-sm font-bold tracking-tight">Bucătăria <span className="text-[#e84a43]">Vie</span></span>
          <span className="hidden items-center gap-2 font-bold sm:flex"><span className="grid h-5 w-5 place-items-center rounded bg-white/10">☎</span> 031 000 00 00</span>
          <span className="rounded border border-dashed border-[#b6df87] px-2 py-1 text-[9px] font-bold tracking-wider text-[#c7e99d]">PLATĂ PROTEJATĂ</span>
        </div>
      </div>

      <main className="mx-auto min-h-screen w-full max-w-[625px] bg-white px-5 py-10 shadow-[0_0_0_1px_rgba(0,0,0,.03)] sm:px-6">
        <section className="text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-600"><span className="rounded bg-[#cf243b] px-2 py-1 text-white">Salvează</span><span className="rounded bg-[#2d6cb2] px-2 py-1 text-white">Distribuie</span></div>
          <p className="mt-8 text-left text-sm italic text-[#454545]">Atenție bărbați și femei care simt că au încercat deja prea multe planuri alimentare...</p>
          <h1 className="mt-4 font-sans text-[28px] font-bold leading-[1.25] tracking-tight sm:text-[31px]">Descoperă cum alegerile pe care le faci zilnic pot transforma un plan alimentar <u>complicat</u> într-unul mai clar...</h1>
          <p className="mt-6 text-[22px] font-bold leading-[1.36] sm:text-[24px]"><span className="text-[#d92521]">Fără să renunți la tot ce îți place</span>, fără să urmezi reguli imposibil de ținut și fără să te simți permanent vinovat(ă).</p>
        </section>

        <section className="mt-7 bg-black px-4 py-5 text-[18px] font-bold italic leading-[1.45] text-white">
          Poate ai crezut că problema este lipsa ta de disciplină. Dar dacă simplul fapt că ai încercat atâtea variante înseamnă că <u>nu ți-a lipsit efortul</u> — ci doar un mod de a începe mai bine?
        </section>

        <section className="mt-7 text-[16px] leading-[1.55] text-[#333]">
          <p className="font-semibold">Sună familiar?</p>
          <p className="mt-5">Ia două minute și citește acest articol până la capăt. Vei vedea de ce multe persoane rămân prinse între reguli alimentare contradictorii și de ce o structură mai simplă poate schimba felul în care abordezi mesele de zi cu zi.</p>
          <p className="mt-7 text-sm italic">de Echipa Bucătăria Vie<br />material educațional digital · actualizat în 2026</p>
          <PaperRule />
          <h2 className="font-serif text-[25px] font-bold leading-tight">Cum te-ai simțit în această dimineață?</h2>
          <p className="mt-5">Ai avut energie pentru începutul zilei sau ți-a luat ceva timp până să te simți prezent(ă)? Ai ales o masă pentru că te ajuta sau doar pentru că era la îndemână?</p>
          <p className="mt-5">Când ai timp pentru tine, te simți confortabil cu felul în care îți organizezi mesele? Sau ai senzația că pornești mereu de la zero, fără să știi încotro să mergi?</p>
          <p className="mt-5">Aceste întrebări nu sunt aici pentru a te face să te simți mai rău. Sunt aici pentru că un plan bun pornește de la realitatea ta, nu de la o imagine perfectă pe care trebuie să o atingi.</p>
        </section>

        <section className="mt-9 border-y border-[#d5d5d5] bg-[#fafafa] px-4 py-6">
          <h2 className="text-[21px] font-bold">Câte dintre acestea te descriu în prezent?</h2>
          <ul className="mt-5 space-y-3 text-[15px] leading-6">{struggleList.map(item => <li className="flex gap-3" key={item}><span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#cf2222] text-white"><Check className="h-2.5 w-2.5" /></span>{item}</li>)}</ul>
        </section>

        <section className="mt-9 text-[16px] leading-[1.58] text-[#333]">
          <h2 className="font-serif text-[27px] font-bold">De unde începe, de fapt, confuzia?</h2>
          <p className="mt-5">În ultimii ani, am primit mai multe informații despre alimentație decât oricând. O zi auzi că o categorie de alimente e răspunsul. A doua zi, afli că aceeași categorie este problema. Rezultatul este un val de sfaturi care nu te ajută să alegi ce faci la următoarea masă.</p>
          <p className="mt-5">Ghidul nostru nu îți promite o scurtătură miraculoasă. Îți oferă o hartă practică: ce merită observat, ce poate fi simplificat și ce întrebări utile să pui înainte de a urma încă o regulă.</p>
          <PaperRule />
          <h2 className="font-serif text-[25px] font-bold">Trei lucruri pe care merită să le înțelegi despre rutina ta alimentară</h2>
          <div className="mt-6 space-y-7">{reasons.map(([heading, body]) => <article key={heading}><h3 className="font-bold leading-6">{heading}</h3><p className="mt-2">{body}</p></article>)}</div>
        </section>

        <section className="mt-10 bg-[#f1f1f1] px-5 py-7 text-center">
          <p className="text-sm font-bold italic">„Nu ai nevoie de o listă mai lungă de interdicții. Ai nevoie de alegeri mai ușor de înțeles.”</p>
        </section>

        <section className="mt-10 text-[16px] leading-[1.58] text-[#333]">
          <h2 className="font-serif text-[27px] font-bold">Acum ai o alegere simplă de făcut...</h2>
          <p className="mt-5">Poți continua să aduni informații din locuri diferite, sperând că la un moment dat toate se vor lega. Sau poți folosi un ghid care le organizează într-un singur loc, într-un limbaj direct și cu idei pentru situațiile de zi cu zi.</p>
          <p className="mt-5">Aici intră în scenă <strong>Bucătăria Care Arde Grăsimea</strong> — un pachet digital de orientare practică, fără jargon inutil și fără promisiuni care nu pot fi susținute.</p>
        </section>

        <section className="mt-9 border-y-4 border-black bg-[#fffbe8] px-5 py-8 text-center">
          <div className="mx-auto max-w-[220px]"><ProductArt product={product} compact /></div>
          <h2 className="mt-7 font-serif text-[29px] font-bold leading-tight">Bucătăria Care Arde Grăsimea</h2>
          <p className="mt-4 text-[16px] leading-7 text-[#333]">Primești un ghid digital care explică principiile de bază, liste utile și idei de organizare pentru mese mai ușor de construit.</p>
          <div className="mx-auto mt-6 max-w-sm text-left text-[15px] leading-6">{["Capitole clare, pe care le poți parcurge în ritmul tău", "Idei de mese și liste de cumpărături orientative", "Acces digital după confirmarea plății"].map(item => <div className="mt-3 flex gap-3" key={item}><Check className="mt-1 h-4 w-4 shrink-0 text-[#13753e]" />{item}</div>)}</div>
        </section>

        <section className="mt-9 text-[16px] leading-[1.58] text-[#333]">
          <h2 className="font-serif text-[25px] font-bold">Iată ce conține pachetul digital:</h2>
          <p className="mt-5">Ghidul este organizat în module scurte, astfel încât să nu fie nevoie să citești totul dintr-o dată. Începi cu partea care îți este utilă acum și revii când ai nevoie.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 border border-[#d0d0d0] bg-white p-4 text-sm"><div><strong>Partea 1</strong><br />Mese mai simple</div><div><strong>Partea 2</strong><br />Alegeri mai clare</div><div><strong>Partea 3</strong><br />Liste practice</div><div><strong>Partea 4</strong><br />Idei de ritm</div></div>
          <p className="mt-6">Nu este necesar să faci totul perfect. Ideea este să ai un material la care poți reveni când vrei să alegi mai conștient și mai puțin complicat.</p>
        </section>

        <section className="mt-10 border-2 border-black bg-white p-5 text-center">
          <p className="font-serif text-[24px] font-bold">Oferta de acces digital de astăzi</p>
          <p className="mt-4 text-sm text-[#555]">Prețul obișnuit al pachetului</p>
          <p className="text-lg font-bold text-[#777] line-through">{formatWeightlossPrice(product.oldPrice!)}</p>
          <p className="mt-2 text-[25px] font-bold text-[#cf2222]">Astăzi: {formatWeightlossPrice(product.price)}</p>
          <p className="mt-4 text-[13px] leading-5 text-[#555]">Acces digital securizat. După confirmarea plății, poți continua către materialele suplimentare și pagina ta de descărcare.</p>
          <Link href="/oferte/weightloss/comanda?produs=bucatarie" className="mt-6 block border-2 border-[#775000] bg-[#f5c842] px-4 py-5 text-[17px] font-extrabold leading-6 text-[#241600] shadow-[0_3px_0_#9b7412] transition hover:bg-[#ffd561] active:translate-y-px">DA — VREAU SĂ ÎNCEP CU GHIDUL DIGITAL ACUM</Link>
          <p className="mt-5 text-[12px] text-[#555]"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" />Plata este procesată securizat, direct pe acest site.</p>
        </section>

        <section className="mt-10 border-[3px] border-[#444] bg-white p-4">
          <div className="flex items-center gap-4"><FileText className="h-14 w-14 shrink-0 text-[#c92828]" /><div><p className="text-[21px] font-bold leading-tight">Fără costuri de transport.</p><p className="mt-1 text-sm leading-5">Materialele sunt digitale. După plată, fișierele disponibile pentru comanda ta sunt accesibile online.</p></div><MailX className="ml-auto h-12 w-12 shrink-0 text-[#c92828]" /></div>
        </section>

        <section className="mt-9 border-t border-[#ddd] pt-7 text-[15px] leading-6 text-[#333]">
          <h2 className="font-serif text-[24px] font-bold">Întrebări importante înainte de comandă</h2>
          <div className="mt-4 divide-y divide-[#ddd] border-y border-[#ddd]">{faq.map(([question, answer]) => <details className="group py-4" key={question}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">{question}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" /></summary><p className="mt-3 pr-6 text-sm leading-6 text-[#555]">{answer}</p></details>)}</div>
        </section>

        <footer className="mt-10 border-t border-[#ddd] pt-6 text-center text-[10px] leading-5 text-[#555]">
          <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-[#18733b]" />
          <p>© {new Date().getFullYear()} Bucătăria Vie. Materialele au scop educațional general.</p>
          <p className="mt-2"><Link className="text-[#18733b] underline" href="/oferte/weightloss/confidentialitate">Confidențialitate</Link> · <Link className="text-[#18733b] underline" href="/oferte/weightloss/termeni">Termeni și condiții</Link> · <Link className="text-[#18733b] underline" href="/oferte/weightloss/declaratie">Declarație</Link> · <Link className="text-[#18733b] underline" href="/oferte/weightloss/afiliati">Afiliere</Link></p>
          <p className="mt-2">Conținutul nu înlocuiește sfatul, diagnosticul sau tratamentul medical personalizat.</p>
        </footer>
      </main>
    </div>
  );
}
