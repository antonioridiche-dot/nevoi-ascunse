import { Link } from "wouter";

export default function Refund() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl font-bold text-[#1b2d4f] font-['Playfair_Display'] mb-6">Politica de Rambursare</h1>
        <div className="text-[15px] text-[#475569] space-y-3 leading-relaxed">
          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">Garanție 30 de zile</h2>
          <p>Oferim o garanție comercială de rambursare completă de <strong>30 de zile</strong> de la data achiziției. Dacă nu ești mulțumit(ă) de produs, poți solicita rambursarea integrală, fără nicio întrebare.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">Cum soliciți rambursarea</h2>
          <p>Trimite un email la <a href="mailto:anca@pestedespartire.ro" className="text-[#1155cc] underline">anca@pestedespartire.ro</a> cu subiectul „Solicitare Rambursare" și include adresa de email cu care ai făcut achiziția. Rambursarea va fi procesată în 5–10 zile lucrătoare, prin Stripe, către aceeași metodă de plată.</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">Conținut digital</h2>
          <p>Această garanție comercială de 30 de zile se aplică suplimentar față de drepturile tale legale. Întrucât produsele sunt digitale, la cumpărare îți exprimi acordul ca livrarea să înceapă imediat (vezi Termeni și Condiții).</p>

          <h2 className="text-lg font-semibold text-[#1b2d4f] pt-2">Abonamente (coaching)</h2>
          <p>Poți anula abonamentul de coaching oricând; anularea oprește facturările viitoare. Pentru rambursarea ultimei facturi, scrie-ne în intervalul de 30 de zile.</p>
        </div>
        <div className="mt-8 text-center"><Link href="/" className="text-[#c9a44a] hover:underline text-sm">Înapoi la pagina principală</Link></div>
      </div>
    </div>
  );
}
