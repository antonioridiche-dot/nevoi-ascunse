export const LINISTE_PRODUCTS = {
  anxietate: { displayName: "Punct de sprijin", price: { ron: 6700, eur: 1340, usd: 1475, gbp: 1120 }, reference: { ron: 10000, eur: 2000, usd: 2200, gbp: 1700 } },
  "dispozitie-joasa": { displayName: "O clipă mai blândă", price: { ron: 6700, eur: 1340, usd: 1475, gbp: 1120 }, reference: { ron: 10000, eur: 2000, usd: 2200, gbp: 1700 } },
  frica: { displayName: "Spațiu de siguranță", price: { ron: 6700, eur: 1340, usd: 1475, gbp: 1120 }, reference: { ron: 10000, eur: 2000, usd: 2200, gbp: 1700 } },
  "pachet-intreg": { displayName: "Pachetul de însoțire", price: { ron: 6900, eur: 1390, usd: 1490, gbp: 1190 }, reference: { ron: 9900, eur: 2000, usd: 2200, gbp: 1700 } },
  "pauza-de-seara": { displayName: "Pauză de seară", price: { ron: 1500, eur: 300, usd: 350, gbp: 250 }, reference: { ron: 2500, eur: 500, usd: 550, gbp: 430 } },
} as const;

export type LinisteProductKey = keyof typeof LINISTE_PRODUCTS;
export type LinisteCurrency = "ron" | "eur" | "usd" | "gbp";
export type LinisteOffer = "exit20" | undefined;
export const LINISTE_SAFETY_NOTICE = "Aceste audio-uri sunt instrumente de sprijin, nu tratament medical și nu înlocuiesc evaluarea, îngrijirea sau intervenția unui profesionist. Dacă este vorba de o urgență sau de risc imediat, sună la 112. Telefonul Speranței: 0800 801 200.";
export function linistePrice(product: LinisteProductKey, currency: LinisteCurrency, offer?: LinisteOffer) {
  if (offer === "exit20" && (product === "anxietate" || product === "dispozitie-joasa" || product === "frica")) return ({ ron: 4700, eur: 940, usd: 1025, gbp: 770 } as const)[currency];
  return LINISTE_PRODUCTS[product].price[currency];
}
