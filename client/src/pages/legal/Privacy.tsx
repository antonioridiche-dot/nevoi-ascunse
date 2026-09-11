import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl font-bold text-[#1b2d4f] font-['Playfair_Display'] mb-6">Politica de Confidențialitate</h1>
        <div className="text-[15px] text-[#475569] space-y-3 leading-relaxed">
          <p>Ultima actualizare: Iunie 2026</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">1. Operatorul de date</h2>
          <p>TeVreauInapoi, Str. Inginer Cristian Pascal nr. 37, ap. 406, București, 060223, România. Contact pentru protecția datelor: <a href="mailto:anca@pestedespartire.ro" className="text-[#1155cc] underline">anca@pestedespartire.ro</a>.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">2. Ce date colectăm</h2>
          <p>Nume (opțional) și adresă de email; răspunsurile tale la testul de împăcare (care pot include informații despre viața ta personală și relații — date pe care le tratăm cu confidențialitate sporită); istoricul comenzilor. Datele cardului sunt introduse direct la procesatorul de plăți (Stripe) și <strong>nu</strong> ajung pe serverele noastre.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">3. Scopuri și temei juridic</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Executarea contractului (livrarea produselor, procesarea plăților) — art. 6(1)(b) GDPR.</li>
            <li>Comunicări prin email și marketing — pe baza consimțământului — art. 6(1)(a).</li>
            <li>Cookie-uri de analiză/marketing — doar cu consimțământul tău (bannerul de cookie-uri).</li>
            <li>Îmbunătățirea serviciilor și prevenirea fraudei — interes legitim — art. 6(1)(f).</li>
          </ul>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">4. Cu cine partajăm datele (împuterniciți)</h2>
          <p>Stripe (procesare plăți), Resend (livrare email), Meta / Google / Microsoft Clarity (analiză și marketing — doar cu consimțământ), furnizorul de găzduire. Nu vindem datele tale.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">5. Cât timp păstrăm datele</h2>
          <p>Păstrăm datele cât este necesar pentru scopurile de mai sus și pentru respectarea obligațiilor legale (de ex. fiscale). Poți cere ștergerea oricând.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">6. Drepturile tale (GDPR)</h2>
          <p>Ai dreptul de acces, rectificare, ștergere („dreptul de a fi uitat"), restricționare, portabilitate, opoziție și retragerea consimțământului în orice moment. Le poți exercita scriindu-ne la <a href="mailto:anca@pestedespartire.ro" className="text-[#1155cc] underline">anca@pestedespartire.ro</a>. Ai de asemenea dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (<a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-[#1155cc] underline">dataprotection.ro</a>).</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">7. Cookie-uri</h2>
          <p>Folosim cookie-uri strict necesare pentru funcționarea site-ului și a coșului. Cookie-urile de analiză și marketing (Google Analytics, Meta Pixel, Microsoft Clarity) se activează <strong>doar după ce accepți</strong> în bannerul de cookie-uri. Îți poți schimba opțiunea ștergând cookie-urile din browser.</p>
        </div>
        <div className="mt-8 text-center"><Link href="/" className="text-[#c9a44a] hover:underline text-sm">Înapoi la pagina principală</Link></div>
      </div>
    </div>
  );
}
