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
    routeBase: "/oferte/peste-despartire",
    displayName: "Peste despărțire",
    category: "Relații",
    sourceRepo: "pestedespartire",
    summary: "Un traseu de reflecție și reconstrucție pentru după o relație încheiată.",
    capabilities: ["quiz", "checkout", "pași post-cumpărare", "thank-you"],
    tone: "terra",
  },
  {
    key: "numerologie",
    routeBase: "/oferte/numerologie",
    displayName: "Numerologie",
    category: "Ritualuri",
    sourceRepo: "numerology",
    summary: "Experiență personalizată cu raport digital, comandă și afiliere.",
    capabilities: ["raport", "checkout", "afiliere"],
    tone: "blue",
  },
  {
    key: "weightloss-manifest",
    routeBase: "/oferte/weightloss-manifest",
    displayName: "Weightloss Manifest",
    category: "Wellness",
    sourceRepo: "weight-los-manifest",
    summary: "O ofertă de wellness construită în jurul unui manifest de schimbare.",
    capabilities: ["pagină FE", "checkout", "produs digital"],
    tone: "sage",
  },
  {
    key: "soulmate-sketch",
    routeBase: "/oferte/soulmate-sketch",
    displayName: "Soulmate Sketch",
    category: "Relații",
    sourceRepo: "soulmate-sketch",
    summary: "Un parcurs editorial personalizat, cu quiz și captare de e-mail.",
    capabilities: ["quiz", "e-mail", "checkout"],
    tone: "terra",
  },
  {
    key: "linia-palmelor",
    routeBase: "/oferte/linia-palmelor",
    displayName: "Linia palmelor",
    category: "Ritualuri",
    sourceRepo: "linia-palmelor",
    summary: "O interpretare ghidată cu parcurs digital și program de afiliere.",
    capabilities: ["interpretare", "ghid", "afiliere"],
    tone: "gold",
  },
  {
    key: "cafeea",
    routeBase: "/oferte/cafeea",
    displayName: "Cafe(ea)",
    category: "Ritualuri",
    sourceRepo: "cafeea",
    summary: "Experiență de citire ghidată, cu rezultat, pagini legale și afiliere.",
    capabilities: ["intake", "rezultat", "afiliere"],
    tone: "gold",
  },
  {
    key: "visul-meu",
    routeBase: "/oferte/visul-meu",
    displayName: "Visul meu",
    category: "Ritualuri",
    sourceRepo: "visul-meu",
    summary: "Experiență conversațională pentru interpretarea viselor și oferte complementare.",
    capabilities: ["teaser", "oferte", "thank-you"],
    tone: "blue",
  },
  {
    key: "familieprotejata",
    routeBase: "/oferte/familieprotejata",
    displayName: "Familie protejată",
    category: "Familie",
    sourceRepo: "survival",
    summary: "Traseu de pregătire pentru familie, cu quiz, ofertă și acces client.",
    capabilities: ["quiz", "2 downsell-uri", "dashboard", "afiliere"],
    tone: "ink",
  },
  {
    key: "directia-abundentei",
    routeBase: "/oferte/directia-abundentei",
    displayName: "Direcția abundenței",
    category: "Ritualuri",
    sourceRepo: "directia-abundentei",
    summary: "Produs digital despre claritate, oportunități și acțiune conștientă.",
    capabilities: ["checkout", "pas opțional", "thank-you"],
    tone: "gold",
  },
  {
    key: "armonii-bine",
    routeBase: "/oferte/armonii-bine",
    displayName: "Armonii & Bine",
    category: "Audio",
    sourceRepo: "armonii-bine",
    summary: "Colecție audio de wellness, rugăciune ghidată și resurse digitale.",
    capabilities: ["audio", "checkout", "administrare"],
    tone: "sage",
  },
  {
    key: "iubire",
    routeBase: "/oferte/iubire",
    displayName: "Iubire",
    category: "Audio",
    sourceRepo: "iubire",
    summary: "Program audio cu checkout, bibliotecă digitală și e-mailuri tranzacționale.",
    capabilities: ["audio", "bibliotecă", "e-mail"],
    tone: "terra",
  },
  {
    key: "liniste-audio",
    routeBase: "/oferte/liniste-audio",
    displayName: "Liniște Audio",
    category: "Audio",
    sourceRepo: "liniste-audio",
    summary: "Piese ghidate pe teme distincte, cu quiz, acces și recuperare.",
    capabilities: ["quiz", "ofertă", "recuperare", "audio"],
    tone: "sage",
  },
  {
    key: "calendarul-norocului",
    routeBase: "/oferte/calendarul-norocului",
    displayName: "Calendarul norocului",
    category: "Ritualuri",
    sourceRepo: "calendarul-norocului",
    summary: "Experiență cu date personalizate, calendar și automatizări de follow-up.",
    capabilities: ["quiz", "calendar", "campanii e-mail"],
    tone: "blue",
  },
  {
    key: "relatii",
    routeBase: "/oferte/relatii",
    displayName: "Relații",
    category: "Relații",
    sourceRepo: "dic-ionarul-rela-iilor",
    summary: "Funnel de relații cu produse pentru audiențe distincte și bibliotecă securizată.",
    capabilities: ["2 audiențe", "downsell-uri", "bibliotecă", "afiliere"],
    tone: "terra",
  },
  {
    key: "slabiciunea-zodiei",
    routeBase: "/oferte/slabiciunea-zodiei",
    displayName: "Slăbiciunea zodiei",
    category: "Ritualuri",
    sourceRepo: "secretul-zodiei",
    summary: "Rapoarte personalizate pe zodii, cu pași post-cumpărare și acces protejat.",
    capabilities: ["personalizare", "bibliotecă", "afiliere", "admin"],
    tone: "blue",
  },
  {
    key: "tarot",
    routeBase: "/oferte/tarot",
    displayName: "Tarot",
    category: "Ritualuri",
    sourceRepo: "tarot",
    summary: "Citire interactivă cu onboarding, pași post-cumpărare și dashboard.",
    capabilities: ["citire", "dashboard", "automatizări"],
    tone: "blue",
  },
  {
    key: "romanian-weightloss",
    routeBase: "/oferte/romanian-weightloss",
    displayName: "Romanian Weightloss",
    category: "Wellness",
    sourceRepo: "romanian-weightloss-funnel",
    summary: "Funnel de nutriție cu checkout, upsell-uri, afiliere și administrare.",
    capabilities: ["checkout", "3 upsell-uri", "afiliere", "admin"],
    tone: "sage",
  },
  {
    key: "vrajii",
    routeBase: "/oferte/vrajii",
    displayName: "Vrăjii",
    category: "Ritualuri",
    sourceRepo: "vraji-spells-store",
    summary: "Experiență demonstrativă cu quiz, ofertă, acces digital și afiliere.",
    capabilities: ["quiz", "pași", "bibliotecă", "admin"],
    tone: "gold",
  },
  {
    key: "prieteni-cu-beneficii",
    routeBase: "/oferte/prieteni-cu-beneficii",
    displayName: "Prieteni cu beneficii",
    category: "Relații",
    sourceRepo: "prieteni-cu-beneficii",
    summary: "Platformă de produse digitale pentru adulți, cu ofertă și pași post-cumpărare.",
    capabilities: ["checkout", "upsell-uri", "downsell", "thank-you"],
    tone: "terra",
  },
];

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
