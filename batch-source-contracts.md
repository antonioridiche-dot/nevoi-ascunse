# Contracte de fidelitate — lot de migrare

Acest document fixează structura existentă a fiecărui flux înainte de integrare. În timpul migrării se schimbă numai prefixul global al rutei și apelurile către infrastructura comună; structura de pagini, copy-ul, designul, checkout-ul embedded, ramurile post-cumpărare și zona client rămân cele din sursă.

| Rută unificată | Repository sursă | Rute sursă care trebuie păstrate sub prefix | Funcții obligatorii |
| --- | --- | --- | --- |
| `/oferte/relatii` | `dic-ionarul-rela-iilor` | audiențe, 7 oferte, thank-you, funnel map, afiliere, bibliotecă, admin și pagini legale | selecție de audiență, funnel-uri cu downsell, bibliotecă, afiliere, administrație |
| `/oferte/prieteni-cu-beneficii` | `prieteni-cu-beneficii` | ofertă principală, checkout, ofertă specială, ofertă redusă, program avansat, thank-you și 3 pagini legale | checkout embedded, upsell și downsell |
| `/oferte/vraji` | `vraji-spells-store` | ofertă principală, 3 pași post-cumpărare, thank-you, bibliotecă, afiliat și admin | quiz/ofertă, post-cumpărare, bibliotecă și afiliere |
| `/oferte/weightloss` | `romanian-weightloss-funnel` + `weight-los-manifest` | sales page, comandă, 3 oferte, thank-you, pagini legale, afiliați și admin | o singură ofertă Weightloss; pagina din Manifest este utilizată numai ca sursă auxiliară aprobată |
| `/oferte/armonii-bine` | `armonii-bine` | ofertă, confirmare și admin | catalog audio și flux de cumpărare |
| `/oferte/iubire` | `iubire` | ofertă, checkout, thank-you și bibliotecă | checkout, livrare și bibliotecă audio |
| `/oferte/liniste-audio` | `liniste-audio` | ofertă, quiz, 5 teme, checkout, confirmare, upsell, thank-you, recuperare și pagini legale | segmentare prin quiz, livrare audio, upsell și recuperare |

## Reguli de integrare

Fiecare rută sursă va deveni o sub-rută a prefixului din tabel. De exemplu, checkout-ul din `iubire` devine `/oferte/iubire/checkout`, iar biblioteca devine `/oferte/iubire/biblioteca`. Paginile nu sunt rescrise editorial și nu primesc tema catalogului central.

Fiecare repository își păstrează contractul de checkout embedded. Confirmarea plății și procesarea webhook-urilor sunt adaptate la infrastructura comună numai în măsura necesară pentru a păstra funcționarea originală.
