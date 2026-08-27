import { ArrowRight, ChefHat, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/weightloss" className={`flex items-center gap-2 font-serif text-lg font-bold tracking-tight ${inverted ? "text-white" : "text-slate-950"}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#c9322d] text-white shadow-lg shadow-red-950/15"><ChefHat className="h-4 w-4" /></span>
      Bucătăria <span className={inverted ? "text-[#f7cf78]" : "text-[#c9322d]"}>Vie</span>
    </Link>
  );
}

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#fffdf9]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        {compact ? <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Plată protejată</div> : (
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#ghid">Ce primești</a>
            <a href="#intrebari">Întrebări</a>
            <Link className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-[#c9322d]" href="/weightloss/comanda?produs=bucatarie">Vezi oferta <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div><Wordmark inverted /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">Resurse digitale pentru organizarea alimentației și a mișcării. Materialele educaționale nu înlocuiesc recomandarea personalizată a unui profesionist medical.</p></div>
        <div><h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#f7cf78]">Informații</h2><div className="mt-4 grid gap-2 text-sm"><Link href="/weightloss/afiliati">Program de afiliere</Link><Link href="/weightloss/confidentialitate">Confidențialitate</Link><Link href="/weightloss/termeni">Termeni și condiții</Link><Link href="/weightloss/declaratie">Declarație privind veniturile</Link></div></div>
        <div><h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#f7cf78]">Ajutor</h2><p className="mt-4 text-sm leading-6">Ai o întrebare despre accesul la produse? Păstrează pagina finală deschisă după plată și codul comenzii pentru a-ți putea accesa descărcările.</p></div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} Bucătăria Vie. Toate drepturile rezervate.</div>
    </footer>
  );
}
