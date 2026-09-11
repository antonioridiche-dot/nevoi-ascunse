export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Cloudflare: fara portal OAuth Manus — logarea de admin/afiliat se face
// prin fluxul propriu al Worker-ului (email/magic link sau cod din env).
export const getLoginUrl = () => "/admin";
