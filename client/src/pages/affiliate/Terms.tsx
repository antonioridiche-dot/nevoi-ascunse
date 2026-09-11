import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

/** Termenii si conditiile programului de afiliere. */
export default function AffiliateTerms() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <a href="/affiliate/dashboard" className="inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1b2d4f]">
          <ArrowLeft className="w-4 h-4" /> Înapoi în panou
        </a>

        <Card>
          <CardHeader>
            <div className="text-3xl font-bold text-[#c9a44a] mb-1">&#9829;</div>
            <CardTitle className="text-2xl font-['Playfair_Display'] text-[#1b2d4f]">Termeni și condiții pentru afiliați</CardTitle>
            <p className="text-sm text-[#64748b] mt-2">Reguli simple pe care toți afiliații trebuie să le respecte. Sunt scurte și clare.</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-[#334155] leading-relaxed">

            <section>
              <h2 className="font-bold text-[#1b2d4f] text-base mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#15803d]" /> Ce ai voie să faci</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-[#64748b]">
                <li>Promovezi linkurile tale oriunde e permis: social media, blog, newsletter, grupuri unde subiectul e relevant.</li>
                <li>Scrii cu vocea ta, pe baza experienței tale reale.</li>
                <li>Spui sincer că ai un link de afiliat, atunci când recomanzi produsul.</li>
                <li>Cerți ajutor oricând la <a href="mailto:anca@pestedespartire.ro" className="text-blue-600 underline">anca@pestedespartire.ro</a> — îți răspund personal.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-[#1b2d4f] text-base mb-2 flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Ce nu ai voie să faci</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-[#64748b]">
                <li><strong>Nu promiți rezultate garantate.</strong> Nu spune că cineva „sigur" se împacă, că va obține un rezultat anume sau că metoda „funcționează 100%".</li>
                <li><strong>Nu folosi afirmații false</strong> despre câștiguri, despre produs sau despre echipă.</li>
                <li><strong>Nu face spam</strong> — în comentarii, în mesaje private în masă sau în grupuri unde nu ți s-a cerut părerea.</li>
                <li><strong>Nu te da drept altcineva</strong> (Cristina, echipa Peste Despărțire) și nu folosi site-ul sau brandul ca pagină proprie.</li>
                <li><strong>Nu promova produsul către minori</strong> și nu folosi mesaje care induc frica sau vinovăția.</li>
                <li><strong>Nu rula reclame plătite</strong> care duc direct la pagina de vânzare fără să ne întrebi înainte.</li>
                <li><strong>Nu cumpăra prin propriul link de afiliat</strong> ca să-ți generezi singur comision.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-[#1b2d4f] text-base mb-2">Cum funcționează comisionul</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-[#64748b]">
                <li><strong>50%</strong> din valoarea fiecărei vânzări făcute prin linkul tău, mai puțin eventualele reduceri aplicate clientului.</li>
                <li>Comisionul devine plătibil la <strong>31 de zile</strong> de la achiziție (după perioada de garanție de rambursare de 30 de zile).</li>
                <li>Atribuirea ține <strong>60 de zile</strong> de la click. Primești comision și pe vânzările care vin din emailurile noastre, dacă persoana și-a lăsat adresa de email.</li>
                <li>Abonamentul de coaching aduce comision <strong>în fiecare lună</strong>, cât timp clientul rămâne abonat.</li>
                <li>Pragul de plată: <strong>50 lei</strong>.</li>
                <li>O <strong>rambursare</strong> a clientului anulează comisionul aferent acelei vânzări.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-[#1b2d4f] text-base mb-2">Suspendarea contului</h2>
              <p className="text-[#64748b]">Îți putem suspenda contul de afiliat și anula comisioanele neplătite dacă încalci regulile de mai sus — în special dacă folosești afirmații false, spam sau încerci să păcălești sistemul de tracking. Te anunțăm pe email înainte, mai puțin în cazurile grave (fraudă).</p>
            </section>

            <section>
              <h2 className="font-bold text-[#1b2d4f] text-base mb-2">Datele tale</h2>
              <p className="text-[#64748b]">Păstrăm doar ce e nevoie ca să-ți plătim: numele, emailul, IBAN-ul și datele de tracking. Nu le transmitem altcuiva. Poți cere oricând să vezi sau să ștergem ce deținem, scriind la <a href="mailto:anca@pestedespartire.ro" className="text-blue-600 underline">anca@pestedespartire.ro</a>.</p>
            </section>

            <section>
              <h2 className="font-bold text-[#1b2d4f] text-base mb-2">Modificări</h2>
              <p className="text-[#64748b]">Dacă schimbăm ceva important (procent, praguri, reguli), te anunțăm pe email înainte să intre în vigoare. Continuând să promovezi după anunț, înseamnă că ești de acord cu noile condiții.</p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
