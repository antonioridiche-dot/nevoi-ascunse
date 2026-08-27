import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Filter, Layers2 } from "lucide-react";
import { Link } from "wouter";
import { brandCatalog, brandCategories, type BrandCategory, type BrandCatalogItem } from "@shared/brandRegistry";
import { CatalogMark } from "@/components/CatalogMark";

const images = {
  relationships: "/manus-storage/catalog-relationships_2a17ed9e.jpg",
  symbols: "/manus-storage/catalog-symbols_9366f171.jpg",
  resilience: "/manus-storage/catalog-resilience_1b077ea1.jpg",
};

const toneStyle = {
  terra: { accent: "#b64a32", shape: "✦" },
  blue: { accent: "#526e89", shape: "◌" },
  sage: { accent: "#637a6c", shape: "▱" },
  gold: { accent: "#a67828", shape: "◒" },
  ink: { accent: "#293934", shape: "◆" },
} as const;

function artworkFor(brand: BrandCatalogItem) {
  if (brand.category === "Relații") return images.relationships;
  if (brand.category === "Familie" || brand.category === "Wellness") return images.resilience;
  return images.symbols;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<BrandCategory | "Toate">("Toate");
  const filtered = useMemo(
    () => brandCatalog.filter((brand) => activeCategory === "Toate" || brand.category === activeCategory),
    [activeCategory],
  );

  return (
    <main className="catalog-shell min-h-screen overflow-hidden bg-[#f3eee5] text-[#201f1d]">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <Link href="/" className="group flex items-center gap-3" aria-label="Nevoi Ascunse, acasă">
          <img src="/manus-storage/nevoi-ascunse-mark_33e26499.png" alt="" className="h-9 w-9 object-contain transition duration-200 group-hover:-rotate-6" />
          <span className="font-display text-2xl tracking-[-.05em]">Nevoi Ascunse</span>
        </Link>
        <div className="hidden items-center gap-8 text-xs font-bold tracking-[.15em] text-[#71695f] sm:flex">
          <a href="#catalog" className="transition hover:text-[#b64a32]">CATALOG</a>
          <a href="#cum-functioneaza" className="transition hover:text-[#b64a32]">CUM FUNCȚIONEAZĂ</a>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d5cbbd] bg-[#f8f4ed] px-3 py-2 text-[10px] font-bold tracking-[.13em] text-[#786f64]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b64a32]" /> CATALOG / 20
        </span>
      </nav>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-16 pt-4 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-12 lg:pb-28 lg:pt-9">
        <div className="relative z-10 flex flex-col justify-between py-5 lg:py-14">
          <div>
            <p className="catalog-eyebrow">COLECȚIE DIGITALĂ / 2026</p>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(4.2rem,9vw,8.5rem)] leading-[.8] tracking-[-.078em] text-[#24221f]">
              Alege ce<br />
              <em className="font-normal text-[#b64a32]">te cheamă</em><br />
              acum.
            </h1>
            <p className="mt-8 max-w-md text-base leading-7 text-[#686057] sm:text-lg">
              O arhivă de experiențe digitale construite pentru momente, întrebări și direcții diferite. Fiecare ofertă își păstrează identitatea; tu alegi unde intri.
            </p>
          </div>
          <a href="#catalog" className="mt-12 inline-flex w-fit items-center gap-3 border-b border-[#37332d] pb-2 text-xs font-bold tracking-[.14em] transition hover:border-[#b64a32] hover:text-[#b64a32]">
            VEZI TOATE OFERTELE <ArrowDownRight className="h-4 w-4" />
          </a>
        </div>
        <div className="hero-art relative min-h-[460px] overflow-hidden rounded-[2rem] bg-[#d7c4ab] shadow-[16px_17px_0_#d5caba] sm:min-h-[570px]">
          <img src="/manus-storage/catalog-hero-archive_a645a047.jpg" alt="Obiecte editoriale așezate într-o arhivă personală" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2b2722]/55 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6 text-[#fffaf2] sm:p-8">
            <div>
              <p className="text-[10px] font-bold tracking-[.16em] text-[#dfb474]">DOSARUL 01</p>
              <p className="mt-2 font-display text-3xl tracking-[-.04em]">Dezvăluie firul.</p>
            </div>
            <CatalogMark className="hidden sm:inline-flex" />
          </div>
        </div>
      </section>

      <section id="cum-functioneaza" className="border-y border-[#d9d0c3] bg-[#e9e1d5]">
        <div className="mx-auto grid max-w-[1440px] divide-y divide-[#cfc2b1] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-12">
          {[
            ["01", "Alegi o direcție", "Explorezi ofertele după temă, ritm și felul în care vrei să intri în ele."],
            ["02", "Intri în universul ei", "Fiecare pagină are propriul ton, propriile pași și propria poveste."],
            ["03", "Păstrezi accesul", "După comandă, primești comunicarea și accesul dedicate acelui brand."],
          ].map(([number, title, text]) => (
            <article key={number} className="py-8 pr-7 md:px-8 md:py-10 first:md:pl-0 last:md:pr-0">
              <span className="font-display text-4xl text-[#b64a32]">{number}</span>
              <h2 className="mt-7 font-display text-3xl tracking-[-.04em]">{title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#6a6258]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex flex-col justify-between gap-7 border-b border-[#cdc3b6] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3 text-[#b64a32]"><Layers2 className="h-4 w-4" /><p className="catalog-eyebrow text-[#b64a32]">INDEXUL COLECȚIEI</p></div>
            <h2 className="mt-4 font-display text-5xl tracking-[-.06em] sm:text-6xl">Toate dosarele.</h2>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filtre de categorie">
            <Filter className="mr-1 h-4 w-4 self-center text-[#71695f]" />
            {brandCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-3 py-2 text-[11px] font-bold tracking-[.08em] transition ${activeCategory === category ? "border-[#282520] bg-[#282520] text-[#fffaf3]" : "border-[#d0c6b8] bg-[#f8f5ef] text-[#6c655c] hover:border-[#b64a32] hover:text-[#b64a32]"}`}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((brand) => {
            const dossierNumber = brandCatalog.findIndex((item) => item.key === brand.key) + 1;
            const tone = toneStyle[brand.tone];
            return (
            <Link href={brand.routeBase} key={brand.key} className="catalog-card group block" aria-label={`Deschide dosarul ${brand.displayName}`}>
              <article className="relative" style={{ "--dossier-accent": tone.accent } as React.CSSProperties}>
                <div className="catalog-art relative aspect-[1.05/1] overflow-hidden bg-[#d7c6b2]">
                  <img src={artworkFor(brand)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" />
                  <div className="absolute inset-0 bg-[#1c1a17]/[.07] transition group-hover:bg-[#1c1a17]/[.16]" />
                  <span className="absolute left-4 top-4 bg-[#f8f4ed]/92 px-3 py-1.5 text-[10px] font-bold tracking-[.13em] text-[#554b40] backdrop-blur-sm">{brand.category.toUpperCase()}</span>
                  <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center bg-[#201f1d] text-xs text-[#fffaf3] shadow-sm">{tone.shape}</span>
                  <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center border border-[#f8f4ed]/70 bg-[#f8f4ed]/92 text-[#211f1c] transition duration-200 group-hover:-rotate-45 group-hover:bg-[var(--dossier-accent)] group-hover:text-[#fffaf3]"><ArrowUpRight className="h-4 w-4" /></span>
                </div>
                <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-4">
                  <span className="font-display text-3xl text-[var(--dossier-accent)]">{String(dossierNumber).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-3xl leading-none tracking-[-.045em] transition group-hover:text-[#b64a32]">{brand.displayName}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#70685f]">{brand.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#d9d0c3] pt-3">
                      {brand.capabilities.slice(0, 3).map((capability) => <span key={capability} className="text-[10px] font-bold tracking-[.08em] text-[#968a7b]">{capability.toUpperCase()}</span>)}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          )})}
        </div>
      </section>

      <section className="mx-5 mb-5 overflow-hidden rounded-[2rem] bg-[#242421] text-[#fbf4e8] sm:mx-8 lg:mx-12">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-7 py-12 sm:px-10 lg:grid-cols-[1fr_.9fr] lg:px-16 lg:py-16">
          <div>
            <p className="catalog-eyebrow text-[#d7a64e]">O SINGURĂ PLATFORMĂ, MAI MULTE VOCI</p>
            <h2 className="mt-5 max-w-xl font-display text-5xl leading-[.92] tracking-[-.06em] sm:text-6xl">Fiecare dosar își păstrează numele.</h2>
          </div>
          <div className="self-end text-base leading-7 text-[#c9c0b3]">
            <p>Comenzile, accesul și comunicările rămân dedicate brandului pe care îl alegi. În spate, experiența este susținută de aceeași infrastructură atent construită.</p>
            <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-[#f4eadb]"><Check className="h-4 w-4 text-[#d7a64e]" /> Acces și comunicări organizate per brand</div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-10 text-xs font-semibold tracking-[.1em] text-[#81776b] sm:flex-row sm:items-center sm:px-8 lg:px-12">
        <p>NEVOI ASCUNSE / CATALOG DIGITAL</p>
        <div className="flex items-center gap-5 self-end sm:ml-auto">
          <p>UN LOC PENTRU DIRECȚII DIFERITE</p>
          <Link href="/afiliere" className="rounded-full border border-[#b64a32] bg-[#fffaf3] px-4 py-2 text-[10px] font-bold tracking-[.12em] text-[#9f3f2d] transition hover:bg-[#b64a32] hover:text-[#fffaf3]">PROGRAM DE AFILIERE</Link>
        </div>
      </footer>
    </main>
  );
}
