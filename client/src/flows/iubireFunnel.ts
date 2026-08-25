export type IubireOfferVariant = "exit20" | undefined;

export function normalizeIubireEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function iubireSalesUrl(email: string, offer?: IubireOfferVariant) {
  const params = new URLSearchParams({ audience: "general", email });
  if (offer) params.set("offer", offer);
  return `/iubire?${params.toString()}`;
}

export function iubireCheckoutUrl(email: string, offer?: IubireOfferVariant) {
  const params = new URLSearchParams({ audience: "general", email, cart: "1" });
  if (offer) params.set("offer", offer);
  return `/iubire/checkout?${params.toString()}`;
}

export function iubireExitHandoff(email: string, offer?: IubireOfferVariant) {
  const normalized = normalizeIubireEmail(email);
  if (!normalized || offer === "exit20") return null;
  return { salesUrl: iubireSalesUrl(normalized, "exit20"), checkoutUrl: iubireCheckoutUrl(normalized, "exit20") };
}
