export type LinisteCurrency = "ron" | "eur" | "usd" | "gbp";
export type LinisteProductKey = "anxietate" | "dispozitie-joasa" | "frica" | "pachet-intreg";
export type LinisteTheme = "bani" | "sanatate" | "anxietate" | "eliberare" | "iubire";
export type LinisteOffer = "exit20" | undefined;

export function normalizeLinisteEmail(value: string | null | undefined) { const email = value?.trim().toLowerCase() ?? ""; return /^\S+@\S+\.\S+$/.test(email) ? email : null; }
export function linisteThemeUrl(theme: LinisteTheme, input: { currency?: LinisteCurrency; fromQuiz?: boolean; offer?: LinisteOffer; claimCode?: string } = {}) { const params = new URLSearchParams(); if (input.currency) params.set("currency", input.currency); if (input.fromQuiz) params.set("quiz", "1"); if (input.offer) params.set("oferta", input.offer); if (input.claimCode) params.set("reducere", input.claimCode); const query = params.toString(); return `/liniste-audio/${theme}${query ? `?${query}` : ""}`; }
export function linisteCheckoutUrl(product: LinisteProductKey, input: { currency?: LinisteCurrency; theme?: LinisteTheme; fromQuiz?: boolean; offer?: LinisteOffer; claimCode?: string } = {}) { const params = new URLSearchParams({ produs: product }); if (input.currency) params.set("currency", input.currency); if (input.theme) params.set("tema", input.theme); if (input.fromQuiz) params.set("quiz", "1"); if (input.offer) params.set("oferta", input.offer); if (input.claimCode) params.set("reducere", input.claimCode); return `/liniste-audio/checkout?${params.toString()}`; }
