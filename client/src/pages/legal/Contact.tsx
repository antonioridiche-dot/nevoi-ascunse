import { Link } from "wouter";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl font-bold text-[#1b2d4f] font-['Playfair_Display'] mb-6">Contact</h1>
        <div className="text-[15px] text-[#475569] space-y-3 leading-relaxed">
          <p>Pentru orice întrebări, sugestii sau solicitări, ne poți contacta:</p>
          <div className="bg-[#f8f5ec] border border-[#c9a44a]/30 rounded-lg p-6 space-y-2">
            <p><strong className="text-[#1b2d4f]">Vânzător:</strong> TeVreauInapoi</p>
            <p><strong className="text-[#1b2d4f]">Adresă:</strong> Str. Inginer Cristian Pascal nr. 37, ap. 406, București, 060223, România</p>
            <p><strong className="text-[#1b2d4f]">Email:</strong> <a href="mailto:anca@pestedespartire.ro" className="text-[#1155cc] underline">anca@pestedespartire.ro</a></p>
            <p><strong className="text-[#1b2d4f]">Timp de răspuns:</strong> de obicei în aceeași zi sau în 24–48 de ore lucrătoare.</p>
          </div>
        </div>
        <div className="mt-8 text-center"><Link href="/" className="text-[#c9a44a] hover:underline text-sm">Înapoi la pagina principală</Link></div>
      </div>
    </div>
  );
}