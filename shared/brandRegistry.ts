import { isApprovedMigrationRepository } from "./migrationAllowlist";

export type BrandCategory =
  | "Relații"
  | "Ritualuri"
  | "Wellness"
  | "Familie"
  | "Audio";

export type BrandCatalogItem = {
  key: string;
  routeBase: string;
  displayName: string;
  category: BrandCategory;
  sourceRepo: string;
  summary: string;
  capabilities: string[];
  tone: "terra" | "blue" | "sage" | "gold" | "ink";
};

export const brandCatalog: BrandCatalogItem[] = [
  {
    key: "peste-despartire",
    routeBase: "/peste-despartire",
    displayName: "Peste despărțire",
    category: "Relații",
    sourceRepo: "pestedespartire",
    summary: "Un traseu de reflecție și reconstrucție pentru după o relație încheiată.",
    capabilities: ["quiz", "checkout", "pași post-cumpărare", "thank-you"],
    tone: "terra",
  },
  {
    key: "numerologie",
    routeBase: "/numerologie",
    displayName: "Numerologie",
    category: "Ritualuri",
    sourceRepo: "numerology",
    summary: "Experiență personalizată cu raport digital, comandă și afiliere.",
    capabilities: ["raport", "checkout", "afiliere"],
    tone: "blue",
  },
  {
    key: "soulmate-sketch",
    routeBase: "/soulmate-sketch",
    displayName: "Soulmate Sketch",
    category: "Relații",
    sourceRepo: "soulmate-sketch",
    summary: "Un parcurs editorial personalizat, cu quiz și captare de e-mail.",
    capabilities: ["quiz", "e-mail", "checkout"],
    tone: "terra",
  },
  {
    key: "linia-palmelor",
    routeBase: "/linia-palmelor",
    displayName: "Linia palmelor",
    category: "Ritualuri",
    sourceRepo: "linia-palmelor",
    summary: "O interpretare ghidată cu parcurs digital și program de afiliere.",
    capabilities: ["interpretare", "ghid", "afiliere"],
    tone: "gold",
  },
  {
    key: "cafeea",
    routeBase: "/cafeea",
    displayName: "Cafe(ea)",
    category: "Ritualuri",
    sourceRepo: "cafeea",
    summary: "Experiență de citire ghidată, cu rezultat, pagini legale și afiliere.",
    capabilities: ["intake", "rezultat", "afiliere"],
    tone: "gold",
  },
  {
    key: "visul-meu",
    routeBase: "/visul-meu",
    displayName: "Visul meu",
    category: "Ritualuri",
    sourceRepo: "visul-meu",
    summary: "Experiență conversațională pentru interpretarea viselor și oferte complementare.",
    capabilities: ["teaser", "oferte", "thank-you"],
    tone: "blue",
  },
  {
    key: "familieprotejata",
    routeBase: "/familieprotejata",
    displayName: "Familie protejată",
    category: "Familie",
    sourceRepo: "survival",
    summary: "Traseu de pregătire pentru familie, cu quiz, ofertă și acces client.",
    capabilities: ["quiz", "2 downsell-uri", "dashboard", "afiliere"],
    tone: "ink",
  },
  {
    key: "directia-abundentei",
    routeBase: "/directia-abundentei",
    displayName: "Direcția abundenței",
    category: "Ritualuri",
    sourceRepo: "directia-abundentei",
    summary: "Produs digital despre claritate, oportunități și acțiune conștientă.",
    capabilities: ["checkout", "pas opțional", "thank-you"],
    tone: "gold",
  },
  {
    key: "armonii-bine",
    routeBase: "/armonii-bine",
    displayName: "Armonii & Bine",
    category: "Audio",
    sourceRepo: "armonii-bine",
    summary: "Colecție audio de wellness, rugăciune ghidată și resurse digitale.",
    capabilities: ["audio", "checkout", "administrare"],
    tone: "sage",
  },
  {
    key: "iubire",
    routeBase: "/iubire",
    displayName: "Iubire",
    category: "Audio",
    sourceRepo: "iubire",
    summary: "Program audio cu checkout, bibliotecă digitală și e-mailuri tranzacționale.",
    capabilities: ["audio", "bibliotecă", "e-mail"],
    tone: "terra",
  },
  {
    key: "liniste-audio",
    routeBase: "/liniste-audio",
    displayName: "Liniște Audio",
    category: "Audio",
    sourceRepo: "liniste-audio",
    summary: "Piese ghidate pe teme distincte, cu quiz, acces și recuperare.",
    capabilities: ["quiz", "ofertă", "recuperare", "audio"],
    tone: "sage",
  },
  {
    key: "calendarul-norocului",
    routeBase: "/calendarul-norocului",
    displayName: "Calendarul norocului",
    category: "Ritualuri",
    sourceRepo: "calendarul-norocului",
    summary: "Experiență cu date personalizate, calendar și automatizări de follow-up.",
    capabilities: ["quiz", "calendar", "campanii e-mail"],
    tone: "blue",
  },
  {
    key: "relatii",
    routeBase: "/relatii",
    displayName: "Relații",
    category: "Relații",
    sourceRepo: "dic-ionarul-rela-iilor",
    summary: "Funnel de relații cu produse pentru audiențe distincte și bibliotecă securizată.",
    capabilities: ["2 audiențe", "downsell-uri", "bibliotecă", "afiliere"],
    tone: "terra",
  },
  {
    key: "slabiciunea-zodiei",
    routeBase: "/slabiciunea-zodiei",
    displayName: "Slăbiciunea zodiei",
    category: "Ritualuri",
    sourceRepo: "secretul-zodiei",
    summary: "Rapoarte personalizate pe zodii, cu pași post-cumpărare și acces protejat.",
    capabilities: ["personalizare", "bibliotecă", "afiliere", "admin"],
    tone: "blue",
  },
  {
    key: "tarot",
    routeBase: "/tarot",
    displayName: "Tarot",
    category: "Ritualuri",
    sourceRepo: "tarot",
    summary: "Citire interactivă cu onboarding, pași post-cumpărare și dashboard.",
    capabilities: ["citire", "dashboard", "automatizări"],
    tone: "blue",
  },
  {
    key: "weightloss",
    routeBase: "/weightloss",
    displayName: "Weightloss",
    category: "Wellness",
    sourceRepo: "romanian-weightloss-funnel",
    summary: "Funnel de nutriție cu checkout, upsell-uri, afiliere și administrare, consolidat din sursele Weightloss aprobate.",
    capabilities: ["checkout", "3 upsell-uri", "afiliere", "admin"],
    tone: "sage",
  },
  {
    key: "vraji",
    routeBase: "/vraji",
    displayName: "Vrăji",
    category: "Ritualuri",
    sourceRepo: "vraji-spells-store",
    summary: "Experiență demonstrativă cu quiz, ofertă, acces digital și afiliere.",
    capabilities: ["quiz", "pași", "bibliotecă", "admin"],
    tone: "gold",
  },
  {
    key: "prieteni-cu-beneficii",
    routeBase: "/prieteni-cu-beneficii",
    displayName: "Prieteni cu beneficii",
    category: "Relații",
    sourceRepo: "prieteni-cu-beneficii",
    summary: "Platformă de produse digitale pentru adulți, cu ofertă și pași post-cumpărare.",
    capabilities: ["checkout", "upsell-uri", "downsell", "thank-you"],
    tone: "terra",
  },
];

const unapprovedCatalogSources = brandCatalog
  .filter((brand) => !isApprovedMigrationRepository(brand.sourceRepo))
  .map((brand) => brand.sourceRepo);
if (unapprovedCatalogSources.length > 0) {
  throw new Error(`Registrul public conține surse neaprobate: ${unapprovedCatalogSources.join(", ")}`);
}

export const brandCategories: Array<BrandCategory | "Toate"> = [
  "Toate",
  "Relații",
  "Ritualuri",
  "Wellness",
  "Familie",
  "Audio",
];

export function findBrandByRoute(routeBase: string) {
  return brandCatalog.find((brand) => brand.routeBase === routeBase);
}
