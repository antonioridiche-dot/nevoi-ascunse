/**
 * Sesiunea de afiliat tinuta in browser.
 *
 * Dupa ce afiliatul confirma o singura data codul din email, serverul ii da un
 * token aleator (256 biti) pe care il tinem aici. Token-ul e dovada de intrare
 * in cont: serverul il verifica la fiecare cerere si deduce singur cine este.
 * Nu mai tinem "affiliate_id" — un id se poate ghici, un token nu.
 */
const TOKEN_KEY = "affiliate_token";
const NAME_KEY = "affiliate_name";

export function getAffiliateToken(): string {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

export function saveAffiliateSession(token: string, name: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(NAME_KEY, name || "");
    localStorage.removeItem("affiliate_id");
  } catch { /* localStorage indisponibil — ignoram */ }
}

export function clearAffiliateSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem("affiliate_id");
  } catch { /* localStorage indisponibil — ignoram */ }
}

export function hasAffiliateSession(): boolean {
  return getAffiliateToken().length > 0;
}
