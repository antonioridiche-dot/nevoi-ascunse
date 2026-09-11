import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl font-bold text-[#1b2d4f] font-['Playfair_Display'] mb-6">Termeni și Condiții</h1>
        <div className="text-[15px] text-[#475569] space-y-3 leading-relaxed">
          <p>Ultima actualizare: Iunie 2026</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">1. Identitatea vânzătorului</h2>
          <p>
            Site-ul <strong>pestedespartire.ro</strong> este operat de <strong>TeVreauInapoi</strong> (denumire comercială),
            cu sediul în Str. Inginer Cristian Pascal nr. 37, ap. 406, București, cod poștal 060223, România.
            Email de contact: <a href="mailto:anca@pestedespartire.ro" className="text-[#1155cc] underline">anca@pestedespartire.ro</a>.
            Date de înregistrare (CUI / nr. registru): <em>[de completat de vânzător]</em>.
          </p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">2. Produse și servicii</h2>
          <p>Oferim produse digitale (cărți electronice în format PDF) și servicii de coaching/consultanță în domeniul relațiilor. Produsele digitale sunt livrate prin email.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">3. Prețuri și plăți</h2>
          <p>Toate prețurile sunt afișate în RON și reprezintă prețul final datorat. Plățile sunt procesate securizat de <strong>Stripe</strong>; nu stocăm datele cardului tău pe serverele noastre.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">4. Livrare digitală și dreptul de retragere</h2>
          <p>
            Conținutul digital este livrat imediat după confirmarea plății. La finalizarea comenzii îți exprimi acordul expres
            ca livrarea să înceapă imediat și iei la cunoștință că, în conformitate cu OUG 34/2014 și Directiva 2011/83/UE,
            <strong> îți pierzi dreptul legal de retragere de 14 zile</strong> odată ce conținutul digital a fost livrat/accesat.
            Independent de acest aspect, îți oferim o <strong>garanție comercială de rambursare de 30 de zile</strong> (vezi Politica de Rambursare).
          </p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">5. Abonamente (coaching)</h2>
          <p>Serviciul de coaching este un abonament lunar recurent. Poți anula oricând printr-un email; anularea oprește facturările viitoare.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">6. Proprietate intelectuală</h2>
          <p>Tot conținutul (texte, imagini, produse digitale) este protejat de drepturile de autor. Redistribuirea sau revânzarea fără acord scris este interzisă.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">7. Legea aplicabilă</h2>
          <p>Acești termeni sunt guvernați de legea română. Prin utilizarea site-ului ești de acord cu acești termeni.</p>
        </div>
        <div className="mt-8 text-center"><Link href="/" className="text-[#c9a44a] hover:underline text-sm">Înapoi la pagina principală</Link></div>
      </div>
    </div>
  );
}