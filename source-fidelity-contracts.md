# Contracte de fidelitate ale surselor

## Regula de migrare

Pentru fiecare ofertă, repository-ul indicat este sursa de adevăr pentru toate componentele vizibile și toate regulile de flux. Migrarea schimbă numai prefixul de rută pentru a coexista pe platforma unificată și adapterele minime către autentificarea, datele, Stripe și Resend comune. Nu schimbă copy-ul, ierarhia, stilurile, prețurile, pașii, tipul de checkout sau succesiunea ofertelor.

## Fluxuri și rute obligatorii

| Rută unificată | Repository sursă | Pagini/fluxuri ce trebuie păstrate |
| --- | --- | --- |
| `/oferte/peste-despartire` | `pestedespartire` | două audiențe, quiz, checkout pe audiență, upsell/downsell, thank-you și toate paginile legale |
| `/oferte/numerologie` | `numerology` | raport, comandă, afiliere și pagini legale |
| `/oferte/weightloss` | `romanian-weightloss-funnel` + `weight-los-manifest` | pagină FE, comandă, trei pagini de ofertă, thank-you, afiliere, administrare și resurse aprobate din a doua sursă |
| `/oferte/soulmate-sketch` | `soulmate-sketch` | pagina FE și comportamentul de captare din sursă |
| `/oferte/linia-palmelor` | `linia-palmelor` | interpretare, ghid, afiliere și paginile legale |
| `/oferte/cafeea` | `cafeea` | interpretare, ghid, afiliere și paginile legale |
| `/oferte/visul-meu` | `visul-meu` | lectură completă, ofertele adiacente, thank-you, afiliere și paginile legale |
| `/oferte/familieprotejata` | `survival` | FE, quiz, checkout embedded, oto1, ds1, ds2, thank-you, dashboard, afiliere și marketing |
| `/oferte/directia-abundentei` | `directia-abundentei` | FE, checkout, pas post-cumpărare și thank-you |
| `/oferte/armonii-bine` | `armonii-bine` | catalog audio, confirmare și administrare |
| `/oferte/iubire` | `iubire` | FE, checkout, thank-you și bibliotecă |
| `/oferte/liniste-audio` | `liniste-audio` | quiz, pagini tematice, checkout, ofertă, confirmare, thank-you și recuperare |
| `/oferte/calendarul-norocului` | `calendarul-norocului` | FE, checkout și automatizările sursă |
| `/oferte/relatii` | `dic-ionarul-rela-iilor` | două audiențe, ofertele ramificate, thank-you, bibliotecă, afiliere, admin și legal |
| `/oferte/slabiciunea-zodiei` | `secretul-zodiei` | storefront, pașii de ofertă, bibliotecă, acces, admin, afiliere, campanii și legal |
| `/oferte/tarot` | `tarot` | cărți, context, detalii, checkout embedded, ieșire, pași one-click, thank-you și dashboard |
| `/oferte/vraji` | `vraji-spells-store` | FE, pașii post-cumpărare, thank-you, bibliotecă, afiliat și admin |
| `/oferte/prieteni-cu-beneficii` | `prieteni-cu-beneficii` | FE, ofertă specială/redusă/avansată, checkout, thank-you și legal |

## Cerințe de validare

Fiecare migrare trebuie să păstreze: toate rutele sursei sub prefixul ofertei; toate paginile de ofertă, thank-you, bibliotecă, afiliere, administrare și legal existente; checkout-ul embedded atunci când sursa îl folosește; aceleași condiții de afișare pentru upsell/downsell și ieșire; aceleași declanșatoare de e-mail și acces după plata confirmată. Orice abatere necesită confirmare explicită din partea utilizatorului înainte de implementare.
