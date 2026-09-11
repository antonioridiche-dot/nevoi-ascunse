/**
 * One-click buy helpers — reuse the card saved at the original purchase
 * (the same mechanism as the post-purchase upsells). Falls back to Stripe
 * hosted checkout when the saved card is not available.
 */

export const RON2 = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");

export const MESAJE_PRICE = 19.95; // Mesajele EXTRA de Impacare (o singura plata)
export const JOURNAL_SPECIAL = 39.95; // Zero Despărțiri - pret special dashboard (in loc de 100)
export const JOURNAL_REGULAR = 47; // pret normal al Jurnalului pe pagina de vanzare
// Susținere Personală (coaching) are DOUA preturi, intentionat diferite:
export const COACHING_PRICE = 97; // 1-click upsell (funnel /asteapta + biblioteca)
export const COACHING_PRICE_STANDALONE = 147; // pagina separata de sfaturi (/coaching)

export type OneClickResult =
  | { ok: true; oneClick: boolean; url?: string }
  | { ok: false; error: string };

/**
 * Incearca plata 1-click (taxeaza cardul salvat de la achizitia anterioara).
 * Daca cardul salvat nu exista / nu mai e valid, serverul raspunde cu un URL
 * de checkout Stripe hostat (acelasi pret special) si il deschidem noi aici.
 */
export async function oneClickOrder(opts: {
  productSlug: string;
  contactEmail: string;
  tier?: "upsell" | "downsell";
}): Promise<OneClickResult> {
  try {
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug: opts.productSlug,
        contactEmail: opts.contactEmail,
        contactId: Number(localStorage.getItem("tvii_contact_id")) || undefined,
        affiliateId: localStorage.getItem("tvii_affiliate") || undefined,
        origin: window.location.origin,
        isUpsell: true,
        paymentIntentId: localStorage.getItem("tvii_pi") || "",
        tier: opts.tier || "upsell",
      }),
      credentials: "same-origin",
    });
    const data = await res.json();
    if (data && data.oneClick && data.success) {
      return { ok: true, oneClick: true };
    }
    if (data && data.url) {
      return { ok: true, oneClick: false, url: data.url };
    }
    return { ok: false, error: (data && data.error) || "A aparut o eroare. Incearca din nou." };
  } catch {
    return { ok: false, error: "Eroare de conexiune. Incearca din nou." };
  }
}

/** Mesajul de confirmare afisat in dashboard dupa o achizitie 1-click. */
export const oneClickSuccessMessages: Record<string, string> = {
  "mesaje-extra-barbati": "Mesajele EXTRA de Impacare au fost adaugate la materialele tale.",
  "mesaje-extra-femei": "Mesajele EXTRA de Impacare au fost adaugate la materialele tale.",
  "zero-despartiri": "Zero Despărțiri al Impacarii a fost adaugat la materialele tale.",
  "zero-despartiri-femei": "Zero Despărțiri al Impacarii a fost adaugat la materialele tale.",
  "sustinere-barbati": "Ai inceput programul de Susținere Personală (97 lei/luna).",
  "sustinere-femei": "Ai inceput programul de Susținere Personală (97 lei/luna).",
};

export const isCoachingSlug = (s: string): boolean =>
  s === "sustinere-barbati" || s === "sustinere-femei";