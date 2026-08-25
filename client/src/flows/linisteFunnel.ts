export type LinisteCurrency = "ron" | "eur" | "usd" | "gbp";
export type LinisteProductKey = "anxietate" | "dispozitie-joasa" | "frica" | "pachet-intreg";
export type LinisteTheme = "bani" | "sanatate" | "anxietate" | "eliberare" | "iubire";
export type LinisteOffer = "exit20" | undefined;
export type LinisteTracking = Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term" | "gclid" | "fbclid", string>>;
const trackingKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"] as const;

export function normalizeLinisteEmail(value: string | null | undefined) { const email = value?.trim().toLowerCase() ?? ""; return /^\S+@\S+\.\S+$/.test(email) ? email : null; }
function applyTracking(params: URLSearchParams, tracking?: LinisteTracking) { trackingKeys.forEach(key => { const value = tracking?.[key]; if (value && value.length <= 120) params.set(key, value); }); }
export function linisteThemeUrl(theme: LinisteTheme, input: { currency?: LinisteCurrency; fromQuiz?: boolean; offer?: LinisteOffer; claimCode?: string; tracking?: LinisteTracking } = {}) { const params = new URLSearchParams(); if (input.currency) params.set("currency", input.currency); if (input.fromQuiz) params.set("quiz", "1"); if (input.offer) params.set("oferta", input.offer); if (input.claimCode) params.set("reducere", input.claimCode); applyTracking(params, input.tracking); const query = params.toString(); return `/liniste-audio/${theme}${query ? `?${query}` : ""}`; }
export function linisteCheckoutUrl(product: LinisteProductKey, input: { currency?: LinisteCurrency; theme?: LinisteTheme; fromQuiz?: boolean; offer?: LinisteOffer; claimCode?: string; tracking?: LinisteTracking } = {}) { const params = new URLSearchParams({ produs: product }); if (input.currency) params.set("currency", input.currency); if (input.theme) params.set("tema", input.theme); if (input.fromQuiz) params.set("quiz", "1"); if (input.offer) params.set("oferta", input.offer); if (input.claimCode) params.set("reducere", input.claimCode); applyTracking(params, input.tracking); return `/liniste-audio/checkout?${params.toString()}`; }
