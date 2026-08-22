export const TAROT_CARDS = ["luna", "oglinda", "steaua", "valul", "radacina", "poarta", "pana", "roata"] as const;

export const TAROT_PRODUCTS = {
  tarot_guide: {
    productKey: "tarot_guide",
    displayName: "Ghid tarot personalizat",
    description: "Ghid personalizat pe baza cărților alese și a contextului trimis.",
    amountCents: 5700,
    currency: "ron",
    accessMode: "library" as const,
  },
  numerology: {
    productKey: "numerology",
    displayName: "Numerologie personală",
    description: "Sinteză simbolică bazată pe nume și data oferită.",
    amountCents: 4700,
    currency: "ron",
    accessMode: "library" as const,
  },
  portrait: {
    productKey: "portrait",
    displayName: "Portret simbolic",
    description: "Portret creat din contextul ales și ghidul personalizat.",
    amountCents: 4700,
    currency: "ron",
    accessMode: "library" as const,
  },
  palm: {
    productKey: "palm",
    displayName: "Ghid pentru palmă",
    description: "Sinteză simbolică oferită după trimiterea fotografiei palmei.",
    amountCents: 4700,
    currency: "ron",
    accessMode: "mixed" as const,
  },
} as const;

export type TarotProductKey = keyof typeof TAROT_PRODUCTS;

export const TAROT_POST_PURCHASE_STEPS = [
  { productKey: "numerology", stepKey: "numerology", routeSuffix: "asteapta", sortOrder: 1 },
  { productKey: "portrait", stepKey: "portrait", routeSuffix: "aproapegata", sortOrder: 2 },
  { productKey: "palm", stepKey: "palm", routeSuffix: "stai", sortOrder: 3 },
] as const;

export function isTarotCard(value: string): value is (typeof TAROT_CARDS)[number] {
  return TAROT_CARDS.includes(value as (typeof TAROT_CARDS)[number]);
}
