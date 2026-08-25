export type IubireOffer = "standard" | "exit20";

export const IUBIRE_PROGRAM = {
  productKey: "deschide-spatiu-pentru-iubire",
  displayName: "Deschide Spațiu pentru Iubire",
  referenceAmountCents: 20000,
  automaticDiscountCode: "IUBIRE97",
  standardAmountCents: 9700,
  exit20AmountCents: 7700,
  currency: "ron",
} as const;

export function iubirePrice(offer: IubireOffer) {
  return offer === "exit20" ? IUBIRE_PROGRAM.exit20AmountCents : IUBIRE_PROGRAM.standardAmountCents;
}
