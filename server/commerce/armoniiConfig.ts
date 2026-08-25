export const ARMONII_PRODUCTS = {
  "pachet-armonie": {
    displayName: "Pachetul Armonie de Seară",
    description: "Un pachet digital pentru momente de liniște, alcătuit din piese audio de wellness, o rugăciune audio și ghiduri PDF. Nu este un serviciu medical și nu înlocuiește îngrijirea de specialitate.",
    priceCents: 7900,
    currency: "ron",
    kind: "main" as const,
  },
  "ritual-aprofundare": {
    displayName: "Ritual de Aprofundare",
    description: "O selecție suplimentară de resurse audio și PDF, livrată imediat după confirmarea plății. Este un produs de wellness, nu un tratament medical.",
    priceCents: 2900,
    currency: "ron",
    kind: "upsell" as const,
  },
} as const;

export type ArmoniiProductKey = keyof typeof ARMONII_PRODUCTS;
export const ARMONII_DOWNLOAD_WINDOW_HOURS = 72;
