import { ArrowLeft, ArrowUpRight, Compass } from "lucide-react";
import { Link, useLocation } from "wouter";
import { brandCatalog } from "@shared/brandRegistry";

const visualByCategory = {
  Relații: "/manus-storage/catalog-relationships_2a17ed9e.jpg",
  Ritualuri: "/manus-storage/catalog-symbols_9366f171.jpg",
  Wellness: "/manus-storage/catalog-resilience_1b077ea1.jpg",
  Familie: "/manus-storage/catalog-resilience_1b077ea1.jpg",
  Audio: "/manus-storage/catalog-symbols_9366f171.jpg",
};

export default function OfferMigrating() {
  const [location] = useLocation();
  const brand = brandCatalog.find((item) => item.routeBase === location);
  const dossierNumber = brand ? brandCatalog.findIndex((item) => item.key === brand.key) + 1 : 0;

  return (
    <main className="min-h-screen bg-[#f3eee5] px-5 py-6 text-[#201f1d] sm:px-8 lg:px-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-[#7a7166] transition hover:text-[#b64a32]">
        <ArrowLeft className="h-4 w-4" /> Înapoi la catalog
      </Link>
      <section className="mx-auto flex min-h-[75vh] max-w-6xl items-center py-16">
        <div className="grid w-full gap-10 border-y border-[#d9d0c3] py-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="catalog-eyebrow">DOSAR / {String(dossierNumber).padStart(2, "0")} · {brand?.category.toUpperCase() ?? "COLECȚIE"}</p>
            <h1 className="mt-5 font-display text-5xl leading-[.92] tracking-[-.055em] sm:text-7xl">
              {brand?.displayName ?? "Oferta selectată"}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#665f56]">
              Acest flux este în curs de consolidare pe noua platformă. Pagina va fi activată împreună cu checkout-ul, pașii post-cumpărare și comunicările specifice acestui brand.
            </p>
          </div>
          <div className="relative min-h-[22rem] overflow-hidden bg-[#1e2624] text-[#f5efe5] shadow-[12px_15px_0_#cbbfac]">
            <img src={brand ? visualByCategory[brand.category] : visualByCategory.Ritualuri} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" />
            <div className="relative flex h-full min-h-[22rem] flex-col justify-between p-8">
              <div className="flex items-start justify-between"><Compass className="h-7 w-7 text-[#d7a64e]" /><span className="border border-[#e1d4be]/50 px-2 py-1 text-[9px] font-bold tracking-[.15em]">RUTĂ REZERVATĂ</span></div>
              <div>
                <p className="text-xs font-bold tracking-[.16em] text-[#d7a64e]">METADATE DOSAR</p>
                <p className="mt-3 font-display text-3xl leading-tight">{brand?.capabilities.join(" · ") ?? "Flux digital"}</p>
                <div className="mt-7 flex items-center gap-2 text-xs font-bold tracking-[.1em] text-[#f5efe5]"><ArrowUpRight className="h-4 w-4 text-[#d7a64e]" /> ACTIVARE ÎN CURS</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
