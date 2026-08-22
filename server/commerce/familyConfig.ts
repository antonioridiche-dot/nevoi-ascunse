export const FAMILY_PRODUCTS = {
  "last-mile-72-hour-readiness-plan": { title: "Planul de pregătire pentru 72 de ore", description: "Fișier PDF digital cu harta de acțiune și fișele printabile pentru gospodărie.", priceCents: 6700 },
  "field-continuity-protocol": { title: "Protocolul de continuitate pe teren", description: "Fișier PDF digital cu protocolul de contact, roluri și decizii de continuitate.", priceCents: 6700 },
  "field-continuity-protocol-essentials": { title: "Protocolul de continuitate — ediția Essentials", description: "Pachet PDF digital compact pentru priorități, contacte și rotația proviziilor.", priceCents: 3900 },
  "72-hour-decision-card-pack": { title: "Setul de carduri pentru decizii în 72 de ore", description: "Carduri digitale PDF pentru decizii rapide și pașii următori ai familiei.", priceCents: 1700 },
} as const;

export const FAMILY_CURRENCIES = {
  ron: { code: "ron", promo67: 6700, exit20: 4700 },
  eur: { code: "eur", promo67: 1300, exit20: 900 },
  usd: { code: "usd", promo67: 1500, exit20: 1100 },
  gbp: { code: "gbp", promo67: 1100, exit20: 800 },
} as const;

export type FamilyProductKey = keyof typeof FAMILY_PRODUCTS;
export type FamilyCurrency = keyof typeof FAMILY_CURRENCIES;

export function familyPrice(productKey: FamilyProductKey, currency: FamilyCurrency, variant?: "promo67" | "exit20") {
  if (productKey === "last-mile-72-hour-readiness-plan" && variant) return FAMILY_CURRENCIES[currency][variant];
  if (currency === "ron") return FAMILY_PRODUCTS[productKey].priceCents;
  const conversion: Record<FamilyCurrency, number> = { ron: 1, eur: 0.13, usd: 0.15, gbp: 0.11 };
  return Math.round(FAMILY_PRODUCTS[productKey].priceCents * conversion[currency]);
}
