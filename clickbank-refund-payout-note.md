# Refunduri, comisioane și plăți pentru un marketplace de afiliere

> **Notă de lucru:** aceasta este analiză operațională, nu consultanță juridică, fiscală sau de plăți. Înainte de lansare, contractele, termenii, TVA-ul, rolul procesatorului de plăți și mecanismul de păstrare a fondurilor trebuie verificate de un avocat, contabil și furnizorul de plăți.

## Cum funcționează modelul ClickBank

Pentru o ofertă **RevShare** obișnuită, ClickBank tratează refundul ca o inversare a vânzării. Clientul primește integral suma plătită, iar distribuțiile de venit aferente acelei vânzări sunt debitate din conturile vânzătorului și afiliatului. Astfel, afiliatul nu rămâne cu comisionul pentru o vânzare refundată.[1]

ClickBank nu se bazează exclusiv pe întârzierea plății. În politica actuală, reține o fracțiune din venitul fiecărei perioade de plată ca **return allowance**: standardul publicat este 10%, iar suma este eliberată după 12 săptămâni. Această rezervă acoperă refunduri întârziate și chargeback-uri; utilizatorul trebuie de asemenea să atingă pragul de plată și cerințele de distribuție a clienților.[2]

Există o excepție importantă: pentru ofertele **CPA**, ClickBank declară că afiliații nu sunt debitați pentru refunduri și chargeback-uri. În acea structură, costul refundului rămas după taxele și comisioanele de platformă cade în principal asupra contului vânzătorului.[3]

## Regula recomandată pentru Nevoi Ascunse

Pentru prima versiune a platformei, recomand modelul **RevShare cu fonduri în așteptare**, nu CPA. Comisionul se calculează imediat pentru raportare, dar nu devine retragibil până când se încheie perioada de refund configurată pentru produs. Un refund anterior plății afiliate anulează simplu comisionul. Un refund ulterior plății creează un debit/recuperare din soldul viitor al afiliatului; nu trebuie retras automat din cardul sau contul bancar fără temei contractual explicit.

| Moment | Comandă | Sold afiliat | Acțiune |
|---|---|---:|---|
| Plata reușește | `paid` | `pending` | Se rezervă comisionul calculat din netul comercial aprobat. |
| Se închide fereastra de refund | `settled` | `eligible` | Comisionul intră în următorul lot de plată. |
| Se emite plata | `paid_out` | `paid` | Se creează o înregistrare de payout imuabilă. |
| Clientul cere refund înainte de settlement | `refunded` | `reversed` | Comisionul pending este anulat. |
| Clientul cere refund după payout | `refunded` | `debit` | Se creează o ajustare negativă, compensată din următoarele comisioane; soldul poate deveni negativ. |
| Chargeback | `charged_back` | `debit` | Se îngheață payouturile, se creează ajustarea și se aplică regula de risc/rezervă. |

## Exemplu simplificat

La o comandă de **100 RON**, cu TVA și taxele procesatorului separate, baza de comision trebuie definită contractual. Dacă baza este 90 RON net și comisionul este 50%, afiliatul vede **45 RON pending**. Dacă produsul are refund de 30 zile, cei 45 RON devin eligibili doar după ziua 30. Dacă vânzarea este refundată în ziua 10, comisionul se inversează la zero. Dacă ai plătit deja afiliatul și refundul se aprobă ulterior, ledger-ul îi înregistrează un debit de 45 RON, de compensat cu următoarele câștiguri.

## Ce trebuie implementat în produs

Platforma are nevoie de un ledger imuabil pe evenimente — nu doar de un câmp „comision plătit”. Entitățile minime sunt: `order`, `refund`, `chargeback`, `commission_ledger_entry`, `affiliate_balance`, `payout_batch`, `payout_item` și `payout_adjustment`. Fiecare comision trebuie să rețină oferta, regula de atribuire, procentul, baza exactă de calcul, moneda, fereastra de refund, starea și legătura cu plata/refundul original.

Pentru lansare, este prudent ca retragerile să fie săptămânale sau bilunare, după încheierea ferestrei de refund, cu prag minim, verificare KYC/payout și un **rolling reserve** adaptat la risc. Nu promite retragere instantă afiliaților în prima versiune.

## Surse

[1] [ClickBank Support — Managing Refunds and Chargebacks](https://support.clickbank.com/en/articles/10535249-managing-refunds-and-chargebacks)

[2] [ClickBank Support — How is my payment amount determined?](https://support.clickbank.com/en/articles/10535135-how-is-my-payment-amount-determined)

[3] [ClickBank Support — CPA FAQ for ClickBank Sellers](https://support.clickbank.com/en/articles/10535071-cpa-faq-for-clickbank-sellers)
