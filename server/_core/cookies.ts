// Cloudflare port: cookie helpers without Express.
// getSessionCookieOptions kept for compatibility with ported call-sites.
export function getSessionCookieOptions(_req?: unknown) {
  return {
    httpOnly: true as const,
    path: "/" as const,
    sameSite: "lax" as const,
    secure: true as const,
  };
}

export function parseCookiesHeader(raw: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}
