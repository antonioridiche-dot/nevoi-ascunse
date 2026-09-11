import { getDb } from "../db";
import { contacts } from "../../drizzle/schema";
import { jwtVerify } from "jose";
import { parseCookies, type Env, type Handler } from "./http";

// GET /api/admin/export-contacts — CSV cu toate contactele (protejat: doar admin).
export const adminExportContacts: Handler = async (request, env) => {
  const cookies = parseCookies(request);
  const token = cookies["tvii_admin"];
  const secret = env.JWT_SECRET || (typeof process !== "undefined" ? process.env.JWT_SECRET : "") || "";
  if (!token || !secret) return new Response("Neautorizat", { status: 401 });
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.role !== "admin") return new Response("Neautorizat", { status: 401 });
  } catch {
    return new Response("Neautorizat", { status: 401 });
  }
  const db = await getDb();
  if (!db) return new Response("DB indisponibila", { status: 500 });
  const rows = await db.select().from(contacts).orderBy(contacts.id);
  const Q = String.fromCharCode(34);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (s.indexOf(Q) !== -1 || s.indexOf(",") !== -1 || s.indexOf(";") !== -1) {
      return Q + s.split(Q).join(Q + Q) + Q;
    }
    return s;
  };
  const date = (v: Date | null | undefined) => (v ? new Date(v).toISOString() : "");
  const head = ["id", "email", "firstName", "gender", "status", "procentSanse", "leadScore", "pipelineStage", "emailSubscribed", "currentSequenceStep", "sequenceStartedAt", "nextEmailAt", "createdAt"];
  const out: string[] = [head.join(",")];
  for (const r of rows) {
    out.push([String(r.id), esc(r.email), esc(r.firstName), esc(r.gender), esc(r.status), r.procentSanse ?? "", r.leadScore ?? "", esc(r.pipelineStage), r.emailSubscribed ? "1" : "0", r.currentSequenceStep ?? "", date(r.sequenceStartedAt), date(r.nextEmailAt), date(r.createdAt)].join(","));
  }
  const csv = String.fromCharCode(0xFEFF) + out.join(String.fromCharCode(13, 10));
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=contacte-tevreauinapoi.csv",
    },
  });
};