import { Check, PlayCircle } from "lucide-react";
import type { WeightlossProduct } from "@/flows/weightlossProducts";

export function ProductArt({ product, compact = false }: { product: WeightlossProduct; compact?: boolean }) {
  const isMotion = product.slug === "miscare";
  return (
    <div className={`relative mx-auto ${compact ? "w-44" : "w-64"}`} aria-label={`Coperta digitală pentru ${product.title}`}>
      <div className="absolute -inset-7 rounded-full bg-gradient-to-br from-[#f7cf78]/55 to-transparent blur-2xl" />
      <div className="relative aspect-[3/4] overflow-hidden rounded-r-2xl rounded-l-md border border-white/35 bg-slate-900 p-5 text-white shadow-[18px_20px_0_rgba(20,20,20,0.13),28px_35px_55px_rgba(75,27,27,0.22)]" style={{ background: `linear-gradient(155deg, ${product.accent}, #1b1d23 78%)` }}>
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-[#f7cf78]" /> resursă digitală</div>
        <div className="mt-10 font-serif text-2xl font-bold leading-[0.93] sm:text-3xl">{product.shortTitle}</div>
        <div className="mt-4 h-px w-12 bg-[#f7cf78]" />
        <p className="mt-4 text-[11px] leading-4 text-white/75">Idei practice, organizate pentru o rutină mai ușor de urmat.</p>
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-white/20 pt-3 text-[9px] font-semibold uppercase tracking-wider text-white/75">
          <span>Bucătăria Vie</span>{isMotion ? <PlayCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );
}
