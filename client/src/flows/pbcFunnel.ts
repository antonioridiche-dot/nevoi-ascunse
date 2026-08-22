export type PbcProductId = "frontEnd" | "upsellOne" | "downsell" | "upsellTwo";
export type PbcFunnelStep = "frontEnd" | "upsellOne" | "downsell" | "upsellTwo" | "checkout" | "thankYou";
export type PbcFunnelAction = "start" | "acceptUpsellOne" | "declineUpsellOne" | "acceptDownsell" | "declineDownsell" | "acceptUpsellTwo" | "declineUpsellTwo";
export type PbcFunnelState = { step: PbcFunnelStep; products: PbcProductId[] };

export const PBC_PRODUCTS: Record<PbcProductId, { name: string; price: string; detail: string }> = {
  frontEnd: { name: "Prieteni Cu Beneficii", price: "47 lei", detail: "Cartea digitală + rapoarte despre comunicare, limite și relații casual asumate." },
  upsellOne: { name: "Cum s-o faci nebună după tine în pat", price: "147 lei", detail: "Ghid despre intimitate, comunicare și atenție reciprocă într-o relație adultă." },
  downsell: { name: "Cum s-o faci nebună după tine în pat — ediție specială", price: "73 lei", detail: "Oferta redusă pentru ghidul de intimitate și conexiune." },
  upsellTwo: { name: "Cum să cucerești cele mai frumoase femei (supermodele)", price: "197 lei", detail: "Program de încredere, conversație și prezență socială, fără jocuri sau promisiuni nerealiste." },
};

const amounts: Record<PbcProductId, number> = { frontEnd: 47, upsellOne: 147, downsell: 73, upsellTwo: 197 };
export const initialPbcFunnelState: PbcFunnelState = { step: "frontEnd", products: [] };
const storageKey = "prietenicubeneficii-funnel";
const prefix = "/oferte/prieteni-cu-beneficii";
const addProduct = (products: PbcProductId[], product: PbcProductId) => products.includes(product) ? products : [...products, product];

export function transitionPbcFunnel(state: PbcFunnelState, action: PbcFunnelAction): PbcFunnelState {
  switch (action) {
    case "start": return { step: "upsellOne", products: ["frontEnd"] };
    case "acceptUpsellOne": return { step: "upsellTwo", products: addProduct(state.products, "upsellOne") };
    case "declineUpsellOne": return { ...state, step: "downsell" };
    case "acceptDownsell": return { step: "upsellTwo", products: addProduct(state.products, "downsell") };
    case "declineDownsell": return { ...state, step: "upsellTwo" };
    case "acceptUpsellTwo": return { step: "checkout", products: addProduct(state.products, "upsellTwo") };
    case "declineUpsellTwo": return { ...state, step: "checkout" };
  }
}

export function pbcRouteForStep(step: PbcFunnelStep) { return `${prefix}${({ frontEnd: "", upsellOne: "/oferta-speciala", downsell: "/oferta-redusa", upsellTwo: "/program-avansat", checkout: "/checkout", thankYou: "/multumim" } as Record<PbcFunnelStep, string>)[step]}`; }
export const selectedPbcProducts = (state: PbcFunnelState) => state.products.map(productId => PBC_PRODUCTS[productId]);
export const pbcOrderTotalLei = (state: PbcFunnelState) => state.products.reduce((total, productId) => total + amounts[productId], 0);
export function readPbcFunnel(): PbcFunnelState { if (typeof window === "undefined") return initialPbcFunnelState; try { const saved = window.sessionStorage.getItem(storageKey); if (!saved) return initialPbcFunnelState; const parsed = JSON.parse(saved) as PbcFunnelState; return !parsed.step || !Array.isArray(parsed.products) ? initialPbcFunnelState : parsed; } catch { return initialPbcFunnelState; } }
export const savePbcFunnel = (state: PbcFunnelState) => { if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, JSON.stringify(state)); };
