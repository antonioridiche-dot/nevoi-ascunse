# Hartă de migrare — Nevoi Ascunse

> Acest document este un inventar de lucru. O ofertă devine „pregătită de migrare” doar după ce rutele, produsele, fișierele livrate și evenimentele de e-mail au fost identificate în repository-ul sursă.

| Ofertă / grup | Repository sursă identificat | Rută publică propusă | Fluxuri identificate | Decizie curentă |
| --- | --- | --- | --- | --- |
| Peste despărțire | `pestedespartire` | `/oferte/peste-despartire` | două audiențe, quiz, checkout, upsell, downsell, thank-you, pagini legale | Inclusă |
| Weightloss | `weight-los-manifest` | `/oferte/weightloss` | FE, catalog de produse, checkout | Inclusă provizoriu — necesită confirmarea gamei finale |
| Familie protejată | `survival` | `/oferte/familieprotejata` | quiz, FE, două downsell-uri, thank-you, dashboard, afiliere, livrare și e-mail | Inclusă; redenumire confirmată |
| Relații | `dic-ionarul-rela-iilor` | `/oferte/relatii` | două audiențe, produse adiționale, downsell-uri, thank-you, bibliotecă, afiliere, administrare, e-mailuri | Inclusă; redenumire confirmată |
| Slăbiciunea zodiei | `secretul-zodiei` | `/oferte/slabiciunea-zodiei` | FE personalizat, pași post-cumpărare, bibliotecă, acces, afiliere și administrare | Inclusă provizoriu — necesită confirmarea gamei finale |
| Tarot | `tarot` | `/oferte/tarot` | onboarding, citire, pași post-cumpărare, thank-you, dashboard, automatizări și webhook-uri e-mail | Inclusă |
| Calendarul norocului | `calendarul-norocului` | `/oferte/calendarul-norocului` | FE, checkout, ciclul de viață și campanii de e-mail | Inclusă |
| Armonii & Bine | `armonii-bine` | `/oferte/armonii-bine` | magazin audio, checkout, confirmare, administrare | Inclusă ca posibil grup Music Tracks |
| Iubire | `iubire` | `/oferte/iubire` | FE, checkout, thank-you, bibliotecă, e-mail și webhook Stripe | Inclusă ca posibil grup Music Tracks |
| Liniște audio | `liniste-audio` | `/oferte/liniste-audio` | quiz, FE tematice, checkout, confirmare, ofertă, thank-you, recuperare și automatizări | Inclusă ca posibil grup Music Tracks |
| Prieteni cu beneficii | neasociat încă | `/oferte/prieteni-cu-beneficii` | neinventariat | Necesită identificarea repository-ului |
| Vrăji | `vraji-spells-store` | `/oferte/vraji` | FE, pași post-cumpărare, thank-you, bibliotecă, afiliere și admin | Migrare și audit sursă în curs |

## Proiecte excluse explicit

| Repository | Motiv |
| --- | --- |
| `tevreauinapoi` | Exclus la cererea utilizatorului |
| `groworpay-website` și `groworpay-v2` | Excluse la cererea utilizatorului |
| `parinte-de-succes` | Exclus la cererea utilizatorului |

## Reguli de consolidare

Fiecare flux va primi un prefix propriu de rută, astfel încât paginile sale de vânzare, checkout, pașii post-cumpărare, mulțumirea, zona client și paginile juridice să nu intre în conflict cu celelalte oferte. Datele comerciale vor fi modelate central, iar codul sursă va fi adus ca module de produs, nu ca aplicații independente copiate în același proiect.

Plățile, confirmările și drepturile de acces vor trece printr-un singur model de comandă și permisiuni, însă regulile comerciale și e-mailurile fiecărei oferte rămân izolate pe produs. Pentru protecția cumpărătorilor, accesul la produse se acordă numai după confirmarea plății, iar prețurile și pașii post-cumpărare se validează pe server.
