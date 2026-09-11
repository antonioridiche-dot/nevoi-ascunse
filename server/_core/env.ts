// Environment accessor. Under nodejs_compat, process.env is populated from the
// Worker's vars + secrets. D1/R2 bindings are NOT in process.env — they are
// injected separately via setDb()/the fetch handler env.
export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  isProduction: process.env.NODE_ENV === "production",
  frontendUrl: process.env.VITE_FRONTEND_URL ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "anca@pestedespartire.ro",
  adminSecret: process.env.ADMIN_SECRET ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
