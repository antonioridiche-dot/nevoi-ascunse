# Approved Offer Inventory and Source-Fidelity Matrix

> **Source of truth:** the corresponding repository in `/home/ubuntu/nevoi-ascunse-source/`. Each unified implementation must copy the source route, UI, copy, prices, checkout type, transitions, and delivery behavior. The only permitted differences are the direct root-level route (for example, `/tarot`), compatibility redirects from the legacy path, and required shared platform adapters. The route `/oferte` is the catalog only.

| Offer / brand | Approved source repository | Unified route | Source checkout behavior | Current state | Required remaining work before verified |
|---|---|---|---|---|---|
| Tarot | `tarot` | `/tarot` | Embedded Stripe card payment | Active source port | Full sandbox click-through, sender delivery, source-to-target route diff, library assets |
| Familie protejată | `survival` | `/familieprotejata` | Embedded Stripe card payment | Partially active | Source quiz, delivery/recovery, affiliate, administration, real sandbox flow |
| Prieteni cu beneficii | `prieteni-cu-beneficii` | `/prieteni-cu-beneficii` | **External Stripe Checkout** | Partially active | Verify hosted-session creation and return, then source legal, fulfillment, library, and automation routes |
| Vrăji | `vraji-spells-store` | `/vraji` | Embedded Stripe card payment | Active flow, partially verified | Fulfillment idempotent, thank-you, magic-link request and private library are ported; affiliate, administration, source assets and completed sandbox-to-library audit remain |
| Weightloss | `romanian-weightloss-funnel` + `weight-los-manifest` | `/weightloss` | Embedded Stripe Payment Element and one-click sequence | Active route batch, unverified | Sandbox main payment, one-click sequence, secure downloads, file upload/admin, source manifest comparison |
| Relații | `dic-ionarul-rela-iilor` | `/relatii` | Embedded Stripe card payment | Active route batch, unverified | Source route diff, valid-order click-through, affiliate attribution, e-mail delivery, sandbox flow |
| Armonii & Bine | `armonii-bine` | `/armonii-bine` | Embedded Stripe card checkout, acces temporar la audio/PDF, upsell one-click | Rută/checkout/livrare active, parțial | Repository-ul complet `antonioridiche-dot/armonii-bine` a fost recuperat. Ruta directă, copy-ul public, PaymentIntent card-only, fulfillment idempotent și accesul semnat de 72h sunt portate. Mai rămân upsell-ul cu fallback 3DS, pagina de confirmare/livrare completă, administrarea assets/testimoniale, auditul sandbox și assetul sursă `valuri-aurii-wellness_c1ff0783.jpg`, al cărui URL `/manus-storage/...` nu este disponibil în proiectul unificat; nu a fost înlocuit. |
| Iubire | `iubire` | `/iubire` | Embedded Stripe CardNumber/CardExpiry/CardCvc checkout | Rută/checkout/confirmare/bibliotecă parțiale | Sursa definește „Deschide Spațiu pentru Iubire”: preț de referință 200 RON, cod automat IUBIRE97 la 97 RON și ofertă exit la 77 RON. Platforma unificată are acum `/iubire`, `/iubire/checkout`, oferta exit20, PaymentIntent card-only, confirmare idempotentă cu comandă/drept/acces, `/iubire/multumesc` și `/iubire/biblioteca`; rutele și câmpurile Stripe au fost verificate vizual, iar testele statice trec. Accesul cu token real, tokenul HMAC sursă/livrarea Resend deduplicată, copierea integrală a componentelor editoriale, administrarea și auditul Stripe sandbox rămân de finalizat. Repository-ul nu conține fișiere PNG/JPG/MP3/WAV/PDF; coperta și resursele referite prin `/manus-storage/...` rămân indisponibile și nu au fost înlocuite creativ. |
| Liniște Audio | `liniste-audio` | `/liniste-audio` | Embedded Stripe CardNumber/CardExpiry/CardCvc checkout | Home activ; contract/adaptor server parțial | Catalogul sursă, toate prețurile RON/EUR/USD/GBP, reducerea exit20 și contractul URL direct pentru quiz/pagini tematice/checkout sunt testate. Pagina publică `/liniste-audio`, cu cele trei produse, pachetul și probele sursă, a fost verificată vizual. Adaptorul comun are PaymentIntent card-only, confirmare idempotentă și acces autorizat. Activele sursă verificate — hero-ul și cele cinci probe audio `/manus-storage/...` — răspund prin redirect semnat în storage-ul unificat. Încă nu sunt activate public Quiz, paginile tematice, Checkout, upsell-ul one-click cu fallback 3DS, thank-you, recovery, legalul, trackingul și livrarea audio. |
| Calendarul norocului | `calendarul-norocului` | `/calendarul-norocului` | Repository-specific personalized flow | Checkout/one-click active, partial | Ruta directă are formular de personalizare, pachete USD/EUR/GBP, Payment Element embedded, confirmare idempotentă, pași one-click și thank-you. Mai rămân calendarul complet, trackingul/campaniile, administrarea, auditul Stripe sandbox și restaurarea integrală a secțiunilor editoriale sursă. |
| Peste despărțire | `pestedespartire` | `/peste-despartire` | Source checkout in repository | Not ported | Copy Sales, female sales, quiz, offers, checkout, thank-you, legal |
| Numerologie | `numerology` | `/numerologie` | Source checkout in repository | Not ported | Copy Home, Checkout, Report, Affiliate, Legal |
| Soulmate Sketch | `soulmate-sketch` | `/soulmate-sketch` | Repository-specific capture/checkout flow | Not ported | Copy complete source application and delivery route |
| Linia palmelor | `linia-palmelor` | `/linia-palmelor` | Repository-specific interpretation flow | Not ported | Copy complete source application and affiliate behavior |
| Cafe(ea) | `cafeea` | `/cafeea` | Repository-specific intake/result flow | Not ported | Copy complete source application, result, legal and affiliate behavior |
| Visul meu | `visul-meu` | `/visul-meu` | Repository-specific offer/checkout flow | Not ported | Copy Home, Offer, ThankYou, Affiliate and Legal routes |
| Direcția abundenței | `directia-abundentei` | `/directia-abundentei` | Source checkout and optional post-purchase step | Not ported | Copy FunnelHome, Checkout, PostPurchase and ThankYou routes |
| Slăbiciunea zodiei | `secretul-zodiei` | `/slabiciunea-zodiei` | Source personalized storefront checkout | Not ported | Copy Storefront, affiliate program/dashboard/admin and zodiac step offers |

## Approved Consolidations and Exclusions

| Repository | Treatment |
|---|---|
| `romanian-weightloss-funnel` + `weight-los-manifest` | One consolidated Weightloss offer under `/weightloss`; the main funnel is authoritative and the manifest supplies approved supplementary source material. |
| `dic-ionarul-rela-iilor` | The public, authoritative Relații source under `/relatii`. |
| `dictionarulrelatiilor` | Technical archive only; never a public offer or migration target. |
| `tevreauinapoi` | Explicitly excluded. |
| `groworpay-website` and `groworpay-v2` | Explicitly excluded. |
| `parinte-de-succes` | Explicitly excluded. |

## Checkout Verification Matrix

No entry below is considered **verified** until its exact source journey is executed end-to-end with Stripe sandbox credentials and the resulting order/access state is checked.

| Offer | Required source checkout type | Required verification path | Current verification state |
|---|---|---|---|
| Tarot | Embedded | Sales/citire → Stripe payment → source post-purchase sequence → thank-you → dashboard | Embedded main payment, confirmed fulfillment, and dashboard handoff verified through Stripe sandbox APIs; transactional confirmation attempted but Resend returned 403 because `nevoi-ascunse.ro` is not verified, and source post-purchase/full access checks remain pending |
| Familie protejată | Embedded | Sales/quiz → Stripe payment → OTO/DS1/DS2 → thank-you → dashboard/recovery | Main embedded payment, payment confirmation, OTO acceptance, and protected thank-you state verified through Stripe sandbox APIs; quiz, alternate decline branches, dashboard/recovery, and browser field validation remain pending |
| Prieteni cu beneficii | External Stripe Checkout | Sales → Stripe Checkout session → Stripe-hosted payment → return/thank-you → entitlement delivery | Session creation, source metadata, duplicate-product handling, and preview-origin redirect verified in Stripe sandbox; completed-payment/return validation remains pending |
| Vrăji | Embedded | Offer/bump selection → Stripe payment → source post-purchase pages → thank-you → library | Main card payment with bump, paid-status recognition, and one-click post-purchase payment verified through Stripe sandbox APIs after restoring the source customer binding. Idempotent order/right materialization, thank-you, magic-link request and direct private-library routes are now ported and route-rendered; a full sandbox fulfillment-to-library audit, affiliate/admin and verified transactional e-mail remain |
| Weightloss | Embedded Payment Element | Sales → checkout → PaymentIntent → retete/miscare/longevitate one-click sequence → thank-you → signed download | Main PaymentIntent, one-click `retete`, confirmed entitlement claim, and secure-download result verified in Stripe sandbox; browser Payment Element and remaining source offers still require click-through validation |
| Relații | Embedded | Product audience route → checkout → Stripe payment → seven source decision pages → thank-you → library | Embedded payment, confirmed order fulfillment, entitlement claim, and the first source decision handoff verified through Stripe sandbox APIs; all seven page routes, thank-you/library/recovery and transactional e-mail still require source-diff completion |
| Remaining offers | Exactly as implemented in source | Source-specific payment, confirmation, and access path | Not yet ported; test after copy-first migration |

## Copy-First Regression Rule

Each route is accepted only after these conditions are met:

1. The source file and unified file have the same customer-facing structure, copy, prices, CTA order, checkout type, and post-payment navigation.
2. Any difference is documented as only one of: unified route prefix, typed server contract, unified database relation, or shared secure storage/email adapter.
3. The server validates products and amounts, Stripe confirms payment, the source-equivalent post-payment path completes, and protected access is granted only after the confirmed order.
4. Source assets are used only when present in the repository or approved storage. Missing assets remain documented and are never replaced with invented media.
