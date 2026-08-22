export type WeightlossProductSlug = "bucatarie" | "retete" | "miscare" | "longevitate";
export type WeightlossProduct = { slug: WeightlossProductSlug; title: string; shortTitle: string; price: number; oldPrice?: number; description: string; accent: string; route: string };
export const weightlossProducts: Record<WeightlossProductSlug, WeightlossProduct> = {
  bucatarie: { slug: "bucatarie", title: "Bucătăria Care Arde Grăsimea", shortTitle: "Ghidul principal", price: 197, oldPrice: 297, description: "Un ghid digital clar, cu principii alimentare, liste practice și idei de mese pentru o rutină mai ușor de urmat.", accent: "#c9322d", route: "/oferte/weightloss" },
  retete: { slug: "retete", title: "82 de Rețete cu Superalimente", shortTitle: "Pachetul de rețete", price: 79, oldPrice: 159, description: "Rețete organizate pentru mic dejun, prânz, cină și gustări, create pentru a completa ghidul principal.", accent: "#d4582a", route: "/oferte/weightloss/oferta/retete" },
  miscare: { slug: "miscare", title: "Metabolic Aftershock", shortTitle: "Ghidul de mișcare", price: 119, oldPrice: 197, description: "Material video complementar cu sesiuni scurte de mișcare și structură de progres adaptabilă.", accent: "#1f4d57", route: "/oferte/weightloss/oferta/miscare" },
  longevitate: { slug: "longevitate", title: "101 Alimente pentru Longevitate", shortTitle: "Ghidul de longevitate", price: 39, oldPrice: 139, description: "Un ghid digital complementar cu idei alimentare și informații pentru organizarea meselor.", accent: "#6d4338", route: "/oferte/weightloss/oferta/longevitate" },
};
export const formatWeightlossPrice = (price: number) => `${price} lei`;
export const orderedWeightlossUpsells: Exclude<WeightlossProductSlug, "bucatarie">[] = ["retete", "miscare", "longevitate"];
export const isWeightlossProductSlug = (value: string | null): value is WeightlossProductSlug => value !== null && value in weightlossProducts;
