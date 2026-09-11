# TeVreauInapoi — portare pe Cloudflare (Workers + D1 + R2)

Baza: varianta localhost (manus-app). Scop: acelasi site/funnel pe Cloudflare,
independent de platforma Manus. Repo-urile Manus/localhost NU sunt atinse.

## Arhitectura tinta
- Client: Vite React (acelasi cod de pagini), build -> client/dist (static assets).
- Server: un singur Worker (dist/worker.js) care serveste API-ul + assets.
  - tRPC (fetchRequestHandler) pentru routerele existente.
  - Rute REST portate: stripe (payment intents/checkout), library (link/me/logout),
    download (PDF din R2), unsubscribe, webhook-uri, cron.
- DB: D1 (SQLite Cloudflare) — schema drizzle existenta, generam migrarile D1.
- Fisiere carti: R2 (3 PDF-uri), servite doar dupa verificarea achizitiei.
- Email: Resend (aceleasi secvente 66 pasi), trimitere prin Cron Trigger
  (la fiecare 5 min) catre /api/cron/process-emails.
- Afiliati: Stripe Connect (Express RO) — onboarding, comisioane, transferuri
  automate dupa perioada de retentie; cron /api/cron/process-payouts.
- Admin simplu: doar owner (email din env + cod), vede comenzi/cliente/emailuri/comisioane.

## Status
- [x] Schelet proiect + configs (package.json, wrangler.jsonc, tsconfig, vite.config)
- [x] Copiat client/server/shared/drizzle/data(books) din manus-app
- [x] const.ts fara OAuth Manus (getLoginUrl -> /admin)
- [ ] Curatare client: App.tsx rute finale, admin simplu, portal afiliat Connect
- [x] Migrari D1 generate si aplicate pe D1 remote (14 tabele)
- [ ] worker/index.ts: fetch handler (tRPC + rute REST portate)
- [ ] server/_core: env, trpc adapter, cookies (fara express)
- [ ] stripe.ts: portare handlers (fara express Router)
- [x] PDF-uri urcate in R2 (biblia-impacarii, jurnalul-negru, mesaje-extra) — ruta de download autorizata ramane de portat
- [ ] email: seed secvente in D1 + cron trimitere
- [ ] afiliati: schema + onboarding Connect + transferuri + pagini portal
- [ ] admin minimal
- [ ] Test local: pnpm i, vite build, wrangler dev (D1/R2 local), plata test 4242
- [ ] Deploy: wrangler login, d1 create, r2 create + upload PDFs, secrets,
      domeniu/DNS Cloudflare, webhook Stripe, trecere pe chei LIVE

## Note preturi/funnel (nu se schimba)
Biblia 67 lei (100 carti, garantie 30 zile), exit 47, bump Mesaje EXTRA +27,
jurnal 47, coaching 147/luna, doarjurnal 39,95, jurnalredus 19,95;
quiz 10 intrebari; email inainte de rezultate; afiliati 20-50%.