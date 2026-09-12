import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trackViewContent } from "@/lib/tracking";

export default function Coaching() {
  const [location] = useLocation();
  const isMen = !location.includes("/femei");
  const accent = isMen ? "#c8102e" : "#b8860b";
  const checkout = (isMen ? "/barbati/checkout" : "/femei/checkout") + "?product=coaching";
  useEffect(() => { trackViewContent({ productName: isMen ? "sustinere-barbati" : "sustinere-femei", value: 147, gender: isMen ? "male" : "female" }); }, [isMen]);
  const CTA = () => <Link href={checkout} className="block w-full max-w-md mx-auto text-center text-white font-extrabold py-4 px-6 rounded-xl shadow-lg text-lg my-6 uppercase tracking-wide" style={{ background: accent }}>Încep susținerea personală · 147 lei/lună →</Link>;
  return <main className="min-h-screen bg-[#faf8f5] px-4 py-10 text-[#1a1a2e]"><div className="max-w-2xl mx-auto text-[17px] leading-relaxed">
    <div className="text-center font-bold tracking-widest text-sm mb-5 text-[#8b95a5]">✦ pestedespartire.ro</div>
    <div className="text-center rounded-2xl bg-white border p-7 shadow-sm" style={{ borderColor: `${accent}55` }}>
      <p className="font-bold text-sm tracking-wide mb-3" style={{ color: accent }}>PROGRAM LUNAR DE SUSȚINERE PERSONALĂ</p>
      <h1 className="text-[29px] sm:text-[38px] font-extrabold leading-tight" style={{ color: accent }}>Nu trebuie să treci prin asta singur{isMen ? "" : "ă"}.</h1>
      <p className="mt-5 text-lg">Ai un loc în care poți vorbi sincer despre ce ți se întâmplă și primi un răspuns calm, orientat spre tine — nu spre a controla sau convinge pe altcineva.</p>
      <CTA />
      <p className="text-xs text-[#64748b]">Abonament lunar. Poți renunța oricând.</p>
    </div>
    <section className="space-y-4 my-10"><h2 className="text-2xl font-extrabold" style={{ color: accent }}>Ce primești</h2><p>După înscriere îmi trimiți, în ritmul tău, contextul prin care treci. Îți răspund personal pe email, de regulă în aceeași zi lucrătoare sau în următoarea.</p><ul className="list-disc pl-6 space-y-3 marker:text-[color:var(--accent)]"><li>Un spațiu confidențial în care să pui în cuvinte ce te apasă.</li><li>Întrebări și pași concreți pentru momentele în care te simți blocat{isMen ? "" : "ă"}.</li><li>Sprijin pentru limite, comunicare, decizii și reconstrucția încrederii în tine.</li><li>Un plan realist pentru următoarea perioadă, adaptat situației tale.</li></ul></section>
    <section className="rounded-2xl bg-[#1b2d4f] text-white p-7 my-8"><h2 className="text-2xl font-extrabold mb-3">Ce nu este</h2><p>Nu este terapie și nu înlocuiește sprijinul medical sau psihologic. Nu ofer promisiuni de împăcare și nu folosesc tactici de manipulare. Dacă ești în pericol sau te gândești să-ți faci rău, contactează imediat serviciile de urgență sau un specialist local.</p></section>
    <section className="space-y-4 my-10"><h2 className="text-2xl font-extrabold" style={{ color: accent }}>Pentru cine este potrivit</h2><p>Pentru tine dacă nu mai vrei să iei fiecare decizie din panică, dacă ai nevoie de claritate și dacă vrei să înveți să te alegi pe tine fără să negi ce simți.</p><p>Nu trebuie să ai toate răspunsurile. E suficient să fii pregătit{isMen ? "" : "ă"} să începi cu următorul pas.</p></section>
    <section className="rounded-2xl bg-white border-2 p-7 text-center" style={{ borderColor: accent }}><p className="text-[#64748b]">Susținere personală</p><p className="text-5xl font-extrabold my-2" style={{ color: accent }}>147 <span className="text-xl">lei/lună</span></p><p className="text-sm text-[#64748b]">Plată recurentă. Anulezi oricând printr-un email la cristina@pestedespartire.ro.</p><CTA /></section>
    <section className="my-10 space-y-3"><h2 className="text-2xl font-extrabold" style={{ color: accent }}>Întrebări frecvente</h2><p><strong>Cât de repede primesc răspuns?</strong><br />De regulă, în aceeași zi lucrătoare sau în următoarea.</p><p><strong>Pot anula?</strong><br />Da. Scrii la cristina@pestedespartire.ro și abonamentul este oprit pentru perioada următoare.</p><p><strong>Este confidențial?</strong><br />Da. Detaliile pe care le împărtășești sunt tratate cu discreție.</p></section>
    <CTA /><footer className="border-t pt-6 mt-8 text-center text-xs text-[#64748b] space-x-3"><Link href="/termeni">Termeni</Link><Link href="/privacy">Confidențialitate</Link><Link href="/rambursare">Rambursare</Link><Link href="/contact">Contact</Link><p className="mt-3">© 2026 pestedespartire.ro</p></footer>
  </div></main>;
}
