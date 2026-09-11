import type { User } from "../../drizzle/schema";
import { jwtVerify } from "jose";
import { ENV } from "./env";

export type TrpcContext = {
  /** Minimal request info (headers) for context-sensitive procedures. */
  headers: Headers | null;
  /** Response headers accumulator — procedures can append Set-Cookie here. */
  resHeaders: Headers;
  user: User | null;
};

function parseCookies(headers: Headers | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  const raw = headers.get("cookie");
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

async function resolveUser(headers: Headers | null): Promise<User | null> {
  const cookies = parseCookies(headers);
  const token = cookies["tvii_admin"];
  if (!token || !ENV.cookieSecret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(ENV.cookieSecret));
    if (payload.role !== "admin") return null;
    // Synthetic admin user — the Manus OAuth users table is not used on Cloudflare.
    return {
      id: -1,
      openId: String(payload.email ?? "admin"),
      name: "Admin",
      email: String(payload.email ?? "admin"),
      loginMethod: "admin",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as User;
  } catch {
    return null;
  }
}

export async function createContext(opts: { req: Request; resHeaders: Headers }): Promise<TrpcContext> {
  const user = await resolveUser(opts.req.headers);
  return { headers: opts.req.headers, resHeaders: opts.resHeaders, user };
}
