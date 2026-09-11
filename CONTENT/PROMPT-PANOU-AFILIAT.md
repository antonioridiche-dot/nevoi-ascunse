# PROMPT — Panou de afiliere complet (model „Te Vreau Înapoi")

> **Cum se folosește:** copiază TOT textul de mai jos și dă-l unui AI într-o sesiune nouă, care are acces la codul site-ului.
> Completează doar secțiunea 0. Restul e specificația pe care trebuie să o respecte exact.

---

# 0. PERSONALIZARE PENTRU OFERTA ASTA (completează înainte să trimiți)

- **Domeniu / nume ofertă:** `[ex. parintedesucces.ro]`
- **Numele afișat al brandului:** `[ex. ParinteDeSucces]`
- **Email de contact pus la dispoziția afiliaților:** `[ex. anca@tevreauinapoi.ro]`
- **Procent comision:** `50%`
- **Praguri de plată:** Stripe (automat) = 50 lei · IBAN (manual) = 50 lei
- **Termen de plată:** comisionul devine scadent la **31 de zile** de la achiziție (30 de zile garanție + 1 zi)
- **Fereastră de atribuire:** **60 de zile** de la click
- **Produse:** `[lista cu prețuri, format PDF și număr de pagini]`
- **Produs recurent (dacă există):** `[ex. coaching 97 lei/lună în funnel, 147 lei/lună pe pagina separată]`
- **Culori brand:** `[ex. bleumarin #1b2d4f, auriu #c9a44a, verde #15803d, fundal #f0f3f8, card #f8fafc, accent cald #f8f5ec/#e8d9a0]`
- **Câștig total per client:** `[ex. ≈140 lei, cu defalcarea]`

---

# 1. CE CONSTRUIEȘTI

Un **panou de afiliere complet**, funcțional în producție, care:

1. lasă pe oricine să devină afiliat **fără parolă și fără să-și scrie numele** — doar email + un cod de 6 cifre primit pe email;
2. îi dă linkuri de tracking;
3. înregistrează clicurile și vânzările aduse de el;
4. plătește **50% comision pe fiecare vânzare**, inclusiv pe cele care vin din emailurile automate ale site-ului, până la **60 de zile** de la click;
5. plătește **50% și pe fiecare reînnoire** a abonamentului, lunar, nelimitat;
6. îl plătește automat (Stripe Connect) sau manual (IBAN);
7. îi explică totul în limbaj simplu, în 14 secțiuni, în ordinea din secțiunea 6.

Plus un **panou de admin** de unde proprietarul vede IBAN-urile, sumele scadente și marchează plățile manuale ca făcute.

---

# 2. STACK ȘI ARHITECTURĂ

- **Frontend:** React + TypeScript + Vite + Tailwind, rutare cu `wouter`, componente shadcn/ui, notificări cu `sonner`
- **Backend:** tRPC
- **Bază de date:** SQLite (Cloudflare D1) + Drizzle ORM
- **Plăți:** Stripe (Checkout + Payment Intents) + **Stripe Connect Express** pentru plățile către afiliați
- **Emailuri:** Resend, trimise din cron
- **Rute publice:** `/affiliate/register`, `/affiliate/login`, `/affiliate/dashboard`, `/affiliate/termeni`

---

# 3. BAZA DE DATE — TABELE

**`affiliates`** — `id, email (unic), name, referralCode (unic), passwordHash, commissionPercent, status (pending|active|suspended), totalEarned, totalPaid, stripeConnectAccountId, connectStatus, payoutMethod, payoutDetails, createdAt, updatedAt`

**`affiliateReferrals`** — `id, affiliateId, contactId, ipAddress, landingPage, converted, createdAt` (un rând per click)

**`affiliateLoginCodes`** — `id, email, code (6 cifre), purpose (login|register), expiresAt, usedAt, attempts, createdAt`

**`commissions`** — `id, affiliateId, orderId, amountInCents, status (pending|approved|paid|cancelled), payableAt, paidAt, createdAt`

**`payouts`** — `id, affiliateId, amountInCents, paymentMethod, paymentReference, notes, createdAt`

**`contacts`** — trebuie să aibă **`affiliateId`** (nulabil). E piesa centrală a atribuirii.

**`orders`** — trebuie să aibă **`affiliateId`** (nulabil).

---

# 4. AUTENTIFICARE — DOAR EMAIL + COD

## Reguli absolute
- **NU se cere nume la înregistrare.** Se folosește prefixul emailului ca nume afișabil.
- **NU există parolă.** Fără câmp de parolă, fără „ai uitat parola", fără login alternativ. Un singur mod de acces: email + cod.

## `requestCode({ email, purpose: "login" | "register" })`
- La `register`: dacă există deja cont → eroare „Există deja un cont cu acest email. Folosește Conectare."
- La `login`: dacă NU există cont → eroare „Nu există cont de afiliat cu acest email. Înregistrează-te mai întâi."
- **Anti-spam:** maximum un cod pe minut per email
- Generează cod de **6 cifre**, expiră în **15 minute**, îl trimite pe email
- Dacă emailul nu pleacă → eroare explicită cu adresa de contact

## `verifyCode({ email, code, purpose })`
- Ia ultimul cod **nefolosit** pentru email + purpose
- Verifică: există, nu e expirat, maximum 5 încercări, codul coincide
- Cod greșit → incrementează numărul de încercări și eroare „Cod greșit. Mai încearcă."
- Succes → marchează codul ca folosit, apoi:
  - la `register`: creează afiliatul activ, cu parolă goală, cod de referral generat automat, iar numele = prefixul emailului
  - întoarce id, nume, email, cod de referral
- Clientul salvează id-ul în localStorage și merge la dashboard

## Interfața
- **Register:** pas 1 = câmp email + buton „Trimite-mi codul pe email". Pas 2 = câmp cod (6 cifre, centrat, mono, spațiat) + buton „Creează-mi contul" + link „Schimbă emailul".
- **Login:** identic, dar cu „Conectează-mă" și link către înregistrare.
- Ambele au lista **„De ce să promovezi [BRAND]"** (vezi 6.4).
- Sub câmpul de email: „Îți trimit un cod de 6 cifre pe email — fără parolă."

## Șablonul emailului cu codul
Fundal `#f5f2ea`, card alb rotunjit, inimă aurie sus, titlu bleumarin, **codul mare, mono, spațiat** în cutie `#f8f5ec` cu bordură `#e8d9a0`. Text: „Codul expiră în 15 minute. Dacă nu ai cerut tu acest cod, ignoră emailul."

---

# 5. TRACKING ȘI ATRIBUIRE — CEA MAI IMPORTANTĂ SECȚIUNE

**Modelul țintă: atribuire pe email, 60 de zile. Banii vin din emailuri și din backend, nu din vânzarea pe loc.**

## 5.1 Captarea codului
Pe **orice pagină**, citește parametrul de referral din URL, salvează-l în localStorage și trimite un trackClick care inserează un rând în tabela de referrali.

⚠️ **Înregistrează click-ul o singură dată per cod, per sesiune de browser.** Altfel fiecare navigare care păstrează parametrul în URL adaugă un click în plus, umflă statisticile și face ca **rata de conversie și EPC-ul să iasă mai mici decât realitatea**.

## 5.2 La captarea emailului (quiz / formular)
Când un contact își lasă emailul, trimite și codul din localStorage. Serverul îl rezolvă în id de afiliat și îl salvează pe **contact**.

⚠️ La **update**-ul unui contact existent, salvează afiliatul **doar dacă nu avea deja unul**. Nu suprascrie.

## 5.3 La plată — ordinea rezolvării
1. codul / id-ul trimis de pagină
2. **dacă lipsește → caută afiliatul pe contact** (fallback pe server, funcționează pe orice device sau browser)
3. apoi **salvează afiliatul pe contact**, doar dacă nu avea deja unul

Aplică fallback-ul în **toate** locurile care creează comisioane: crearea sesiunii de checkout, crearea payment intent-ului, confirmarea comenzii, **webhook-ul Stripe** și funcția comună care înregistrează o achiziție.

## 5.4 Codul afiliatului în linkurile din emailuri
Când cronul trimite un email unui contact care are afiliat, **adaugă parametrul de referral în toate linkurile către site** din corpul emailului.

Reguli: nu atinge linkurile externe, nu dubla parametrul dacă există deja, nu atinge linkul de dezabonare. Aplică **înainte** o normalizare a linkurilor malformate de tipul „trei slash-uri" și „două URL-uri lipite".

## 5.5 Comisionul
La fiecare vânzare cu afiliat: comision = suma × procentul afiliatului (implicit 50%), cu status „pending" și **scadență la 31 de zile**. Incrementează totalul câștigat al afiliatului.

**Idempotență obligatorie:** verifică dacă există deja o comandă cu același identificator Stripe înainte de a înregistra. Webhook-urile se pot repeta.

## 5.6 Comision pe reînnoiri (abonament)
Handler pe evenimentul **invoice.paid**:
- ignoră prima factură a abonamentului (e tratată de checkout)
- ia abonamentul și metadata din câmpul nou al facturii, nu din cel vechi
- suma = suma plătită, cu rezervă la totalul facturii (suma plătită poate fi 0 la plăți în afara sistemului)
- idempotență pe identificatorul facturii
- verifică că **contactul există** înainte de a crea comanda, altfel creezi comenzi orfane
- creează comandă + comision, cu scadență la 31 de zile

---

# 6. PANOUL AFILIATULUI — 14 SECȚIUNI, ÎN ORDINEA ASTA

> Ordinea nu e opțională. E rezultatul mai multor iterații cu proprietarul.

## 6.1 „Comisioanele Tale" (tabel)
Coloane: **Data · Suma · Status · Platibil la**. Statusuri: În asteptare (galben) → Aprobat (albastru) → Plătit (verde) / Anulat (roșu).

## 6.2 Statistici (DOAR performanță — nicio cifră de bani)
Două rânduri de câte 4 carduri:
- **Click-uri · Conversie (click → vânzare) · EPC (câștig/click) · Sumă medie/comandă**
- **Lead-uri (emailuri captate) · Conversie (lead → vânzare) · Vânzări · Rata de rambursări**

⚠️ **Regulă impusă de proprietar: nicio statistică nu are voie să apară de două ori în panou.** Cifrele de bani (total câștigat / disponibil / în așteptare / plătit) **nu se pun aici** — ele apar o singură dată, în cardul „Banii tăi" (6.3). Dacă adaugi un card nou, verifică mai întâi că cifra lui nu există deja în alt card.

„Conversie (lead → vânzare)" = din lead-urile captate, câte au cumpărat. Se calculează în client din vânzări ÷ lead-uri, ca să nu fie nevoie de o interogare nouă pe server.

## 6.3 „Banii tăi"
**Toate cifrele de bani, fiecare o singură dată** — patru casete: **Total câștigat** · **Disponibil de retras (scadent)** (evidențiată cu bordură) · **În așteptare** („devine scadent la 31 de zile de la fiecare vânzare") · **Plătit până acum** (verde).

**Metoda de plată trebuie să fie vizibilă, nu ascunsă.** În titlul cardului pune un badge colorat cu metoda activă — „Metoda ta: Stripe (automat)" (albastru) sau „Metoda ta: IBAN (transfer bancar)" (auriu). Același badge apare și în headerul panoului, lângă „Bine ai venit".

Sub ele **butonul**, care se schimbă după metoda aleasă (vezi secțiunea 7). ⚠️ Butonul **nu repetă suma** („Solicită plata →", nu „Solicită plata (X RON) →") — suma e deja în caseta de deasupra.

Sub buton, **caseta cu soldul Stripe** — doar dacă metoda e Stripe și contul e conectat: „În contul tău Stripe (în drum spre bancă)", suma, „disponibil: X RON · în tranzit: Y RON", plus buton „Deschide pagina Stripe (cont bancar / verificări)".

⚠️ Stripe arată soldul în tranzit **negativ** când banii pleacă spre bancă. Nu afișa numere negative — scrie „X RON pleacă spre banca ta".

## 6.4 „De ce să promovezi [BRAND]"
Listă cu bifă verde, adaptată la ofertă. Model:
- **Funnel de vânzare optimizat** — fiecare pas e testat și îmbunătățit constant ca să convertească
- **Versiuni separate** pe segmente — rată de conversie mai mare decât o pagină unică
- **Mai multe upsell-uri 1-click, dintre care unul recurent** — clientul cumpără cu un singur click, iar tu câștigi comision lunar, nelimitat, din același client
- **Site curat, profesionist și optimizat pentru mobil** — de la click până la plată, fără frecare
- **Produs de calitate + suport dedicat** — clienți mulțumiți și foarte puține rambursări
- Încheiere: „Suntem dedicați succesului afiliaților noștri și abia așteptăm să lucrăm cu tine."

## 6.5 „Ce vinzi: produsele, prețurile și comisionul tău"
Tabel cu coloanele: **Produs · Preț · Ce este · Comisionul tău**

Rânduri (structura exactă):
1. Produs principal — [nume] (PDF) · 67 lei · numărul de pagini · 33,50 lei
2. Bump — [nume] · 19,95 lei · 34 pagini, adăugat la checkout · 9,98 lei
3. **Upsell #1 — [produs recurent] + [bonus] (PDF)** · 97 lei/lună · „Comisionul se plătește în fiecare lună, nelimitat." · 48,50 lei/lună
4. ***SAU* — [produs recurent] cumpărat separat** · 147 lei/lună · aceeași pagină, prețul întreg, fără bonus · 73,50 lei/lună
5. Downsell — [nume], preț redus · 39,95 / 19,95 lei · se oferă dacă refuză upsell-ul · 19,98 / 9,98 lei
6. **TOTAL per client care cumpără tot** · cu defalcarea sumelor · **≈ 140,48 lei**

**Regulă importantă:** când un produs are DOUĂ prețuri (unul în funnel, altul pe pagina separată), tabelul trebuie să le arate pe amândouă, cu un rând „SAU" — altfel afiliatul nu înțelege de unde vine totalul.

## 6.6 „Lead-urile tale pot aduce bani chiar dacă nu au cumpărat din prima"
Card verde, cu:
- „Nu toată lumea cumpără din prima — și e normal. De aceea, fiecare persoană care intră prin linkul tău și își lasă adresa de email intră automat într-o **campanie de emailuri special făcută să aducă vânzări** — trimisă automat, în numele nostru, către lead-urile tale."
- Caseta evidențiată: „**Și primești 50% din toate plățile recurente pe care le aduc.** Dacă un lead al tău intră în [produsul recurent], comisionul tău se plătește **în fiecare lună**, cât timp rămâne abonat."
- „Primești același comision de 50% pe fiecare vânzare făcută din emailurile pe care site-ul le trimite automat. Chiar dacă omul cumpără peste 2 zile sau peste 3 săptămâni, chiar dacă deschide emailul pe alt telefon sau în alt browser."
- „Condiția e una singură: să-și fi lăsat adresa de email. Atribuirea ține **60 de zile** de la click."
- **Caseta pe fundal verde închis, text alb:** „**Cel mai important lucru de înțeles:** majoritatea banilor din acest program vin din **emailuri** și din **backend** — adică din oamenii care revin și cumpără din nou, plus abonamentele recurente, nu din vânzarea de pe loc. De asta merită să aduci **volum** de lead-uri: chiar dacă 9 din 10 nu cumpără imediat, ei rămân în joc pentru tine 60 de zile."

## 6.7 „Cum primești banii"
Caseta sus, pe fundal colorat, cu bifă și eticheta **ACTIVĂ**: „**Metoda ta de plată acum: [automat prin Stripe / transfer bancar (IBAN)]**". Fiecare dintre cele două blocuri pliabile primește, în titlu, eticheta verde **„✓ METODA TA ACUM"** dacă este cea selectată.

⚠️ **Nu pune aceeași informație de două ori.** Termenul de scadență (31 de zile) se explică o singură dată — în cardul „Banii tăi" — nu și în caseta metodei, nu și în FAQ. Dacă un subiect e tratat pe larg într-un card, în FAQ pune doar o trimitere de o frază către acel card, nu o a doua versiune a aceluiași text. + „Folosești o singură metodă odată — butonul din cardul «Banii tăi» și modul de plată se schimbă în funcție de ce alegi aici. Comisionul devine scadent la **31 de zile** de la fiecare achiziție (după garanția de 30 de zile)."

Apoi două blocuri pliabile:
- **Opțiunea A — automat prin Stripe Connect (recomandat).** Contul se face o singură dată; comisioanele stau la noi până devin scadente și e normal ca soldul Stripe să fie 0 în perioada aia; după scadență suma se trimite singură când ajunge la 50 lei, iar butonul „Retrage acum" merge oricând, fără prag. Dacă e conectat și e metoda activă → bifă verde. Dacă e conectat dar metoda e IBAN → buton **„Folosește Stripe pentru plăți"**. Dacă nu e conectat → buton de conectare.
- **Opțiunea B — manual, prin transfer bancar (IBAN).** Text: „Scrii IBAN-ul tău unde vrei să-ți trimit banii aici (recomand IBAN pentru un cont de Revolut, Raiffeisen, dar și orice altă bancă funcționează). Când ai minim 50 lei scadenți apeși «Solicită plata» și îți fac transferul personal în 1–3 zile lucrătoare, iar tu primești un email când ți-am trimis banii." + câmp IBAN + buton de salvare.

⚠️ **Fără dropdown cu ambele metode.** Metoda se schimbă prin butoanele din cele două opțiuni.

## 6.8 „Link-urile tale de afiliere"
Un card per link (nu doar unul), fiecare cu titlu, descriere scurtă, câmp readonly și buton de copiere. Cel puțin: intrarea principală în funnel + fiecare pagină de segment.

## 6.9 „Cum promovezi — ghid practic + FAQ"
Blocuri pliabile:
1. **Ce conținut să faci** (TikTok/Reels, story-uri, DM-uri, YouTube, bio)
2. **Câștig bani și din lead-urile care nu cumpără imediat?** — varianta detaliată a secțiunii 6.6
3. **Cât de repede primești banii și care e minimul?** — scadență 31 de zile, minim 0 la Stripe și 50 la IBAN, ce se întâmplă după ce ceri banii, cum știi că ți s-au trimis
4. **Reguli simple** (fii sincer, nu promite rezultate garantate, fără spam, o rambursare anulează comisionul)

**Nu pune texte gata de copiat** în panou — fiecare afiliat trebuie să scrie cu vocea lui.

## 6.10 „Ce spun alți afiliați"
4–5 carduri cu citate. Marchează-le explicit ca **exemple ilustrative** și spune proprietarului să le înlocuiască cu mărturii reale.

## 6.11 „Ce zice lumea despre [PRODUSUL PRINCIPAL]"
O recenzie lungă, eventual și scurte. **Fără două puncte, fără liniuță lungă, fără punct și virgulă, fără ghilimele franceze** în textul recenziei — regulă impusă de proprietar. Semnătura: „Client X ani".

## 6.12 „Alte oferte pe care le poți promova"
Jos, **grilă 2×2** cu ofertele de pe alte site-uri. Fiecare = **imagine clickabilă** care duce la pagina de afiliere a site-ului respectiv + titlu + o linie cu comisionul.

Sloturile necompletate = chenar punctat cu textul **„UPCOMING"**.

Lista trebuie să fie configurabilă, ca adăugarea unei oferte să fie o linie de cod.

## 6.13 „Termeni și condiții pentru afiliați"
Card scurt cu link către o pagină separată care conține: ce ai voie, ce nu ai voie, cum funcționează comisionul (50%, 31 de zile, 60 de zile atribuire, reînnoiri lunare, prag 50 lei, rambursarea anulează), suspendarea contului, datele personale, modificări.

## 6.14 Contact
Un singur card: „Pentru probleme sau alte informații și întrebări, scrie-mi la **EMAIL**" — cu emailul link albastru care deschide direct mail-ul.

---

# 7. METODE DE PLATĂ — REGULI

| | Stripe (automat) | IBAN (manual) |
|---|---|---|
| Cum alegi | cont Connect conectat | scrii IBAN-ul |
| Buton în panou | „Retrage acum" | „Solicită plata (X RON)" |
| Prag | **fără prag** la buton; **50 lei** la transferul automat din cron | **50 lei** |
| Cine plătește | transfer Stripe automat | proprietarul, manual din bancă |

## Anti-plată-dublă (bug real întâlnit)
- **Cronul de plăți automate trebuie să atingă DOAR afiliații cu metoda Stripe** (sau fără metodă salvată). Fără asta, un afiliat care a ales IBAN dar are și cont Connect activ **poate fi plătit de două ori**: o dată de cron, o dată manual.
- Procedura de retragere prin Stripe **refuză** dacă metoda e IBAN.
- Procedura de solicitare manuală **refuză** dacă metoda e Stripe.
- Verificările se fac **pe server**, nu doar în interfață.

## Fluxul manual (IBAN)
1. Afiliatul apasă „Solicită plata" → serverul trimite **email proprietarului** cu nume, email, sumă, metodă și **IBAN**
2. Afiliatul primește confirmare că cererea a fost înregistrată
3. Proprietarul face transferul bancar
4. Proprietarul apasă **„Marchează plătit"** în admin → comisioanele trec pe „plătit", totalul plătit crește, se înregistrează plata, **și afiliatul primește automat emailul „Banii au plecat"**

## Fluxul automat (Stripe)
Transfer reușit → comisioane plătite, rând în tabela de plăți, total actualizat, **email către afiliat „Banii au intrat în contul tău Stripe"**.

Cont Connect: tip Express, țară RO, persoană fizică, capabilitate de transferuri cerută, metadata cu id-ul afiliatului. Onboarding prin link de cont. Status sincronizat din webhook-ul de actualizare a contului.

---

# 8. PANOUL DE ADMIN

Tabel cu afiliați: **Nume · Email · Cod · Comision · Metodă de plată · IBAN / cont · De plată acum · Status · Acțiuni**
- **IBAN / cont** = text mono, click = copiază
- **De plată acum** = suma comisioanelor scadente, grupate per afiliat
- **Acțiuni** = buton **„Marchează plătit"**, activ doar dacă există sumă scadentă

⚠️ Pagina principală de admin trebuie să afișeze **direct formularul de login** când nu ești autentificat. (Bug real: buton „Login" care ducea tot pe pagina de admin — buclă infinită, imposibil de intrat.)

---

# 9. EMAILURI

Toate cu: fundal `#f5f2ea`, card alb rotunjit, antet bleumarin, butoane aurii, semnătură personală.

| Eveniment | Către cine | Conținut |
|---|---|---|
| Cod de acces | afiliat | codul mare, expiră în 15 min |
| Cerere de plată (IBAN) | **proprietar** | nume, email, sumă, metodă, **IBAN evidențiat**, link în admin |
| Cerere înregistrată | afiliat | suma, metoda, „fac transferul în 1–3 zile" |
| „Marchează plătit" apăsat | afiliat | „Banii tăi au plecat", suma, metoda |
| Transfer Stripe reușit | afiliat | „Banii au intrat în contul Stripe", suma |
| Secvență de vânzare | leaduri | emailurile site-ului, cu parametrul de referral injectat |

Folosește un singur helper de trimitere email — **best-effort, nu aruncă niciodată eroare**.

---

# 10. CAPCANE DOVEDITE — VERIFICĂ-LE PE TOATE

1. **Cronul care nu rulează.** Handler-ul de cron primește **expresia** cron, **nu un nume**. Dacă îl compari cu un nume de task, nu se execută nimic niciodată — emailurile automate și transferurile automate sunt moarte în tăcere, fără eroare.

2. **Webhook-ul Stripe care nu funcționează deloc.** În Cloudflare Workers cripto e doar asincron, deci verificarea sincronă a semnăturii aruncă mereu „SubtleCryptoProvider cannot be used in a synchronous context". **Folosește varianta asincronă.** Fără asta: rambursările nu anulează comisioane, statusul Connect nu se sincronizează, comisioanele recurente nu se creează — totul eșuează în tăcere luni de zile.

3. **Fallback-ul de atribuire nefolosit.** Testează: creează un checkout **fără** afiliat în request, dar cu un contact care are afiliat → verifică în Stripe că metadata are id-ul afiliatului.

4. **Plata dublă** (cron + manual) — vezi secțiunea 7.

5. **Click-uri umflate** prin navigare repetată — vezi 5.1.

6. **HTML-ul servit pe rutele adânci rămâne vechi.** Dacă SPA-ul e servit prin worker și index.html e inline în bundle, **regenerarea lui trebuie să facă parte din scriptul de build**. Altfel rutele adânci servesc un build vechi cu lunile.

7. **Migrări duplicate.** Generatorul de migrări poate produce instrucțiuni duplicate dacă snapshot-ul e desincronizat — rulează doar instrucțiunile noi, manual.

8. **Linkuri malformate în emailuri** — normalizează-le la trimitere.

9. **Preț afișat diferit de prețul taxat.** Dacă un produs are preț diferit în funnel față de pagina separată, pagina de downsell care trimite „isUpsell: true" fără „tier" va taxa prețul de upsell. **Verifică întotdeauna cu un test real în Stripe că ce se afișează = ce se taxează.**

---

# 11. CHECKLIST FINAL DE VERIFICARE

- [ ] Înregistrare: **fără câmp de nume**, fără parolă — doar email + cod
- [ ] Login: **o singură metodă** (email + cod), fără alternativă cu parolă
- [ ] Codul expiră în 15 min, se blochează după 5 încercări, maximum 1 pe minut
- [ ] Numărul de emailuri trimise crește după ce trece un cron de 5 minute
- [ ] Checkout fără afiliat în request, cu contact care are afiliat → metadata completată în Stripe
- [ ] Linkurile din toate emailurile conțin parametrul de referral
- [ ] Linkurile externe **nu** sunt modificate; codul existent **nu** se dublează
- [ ] Butonul din panou se schimbă corect după metoda aleasă
- [ ] Un afiliat cu metoda IBAN **nu** poate fi plătit de cron
- [ ] „Marchează plătit" trimite email afiliatului și actualizează totalurile
- [ ] Comisionul pe reînnoire se creează la factura plătită — testat cu un test clock Stripe
- [ ] Toate rutele servesc build-ul nou, nu doar prima pagină
- [ ] Cele 14 secțiuni apar **în ordinea** din secțiunea 6
- [ ] Zero mențiuni ale altor platforme în panou
- [ ] Comisionul e scadent la **31 de zile**, nu la 30

---

# 12. UNDE E MODELUL COMPLET

Dacă sesiunea are acces la repo-ul `tevreauinapoi-cloudflare`, tot sistemul de conținut e în folderul **`CONTENT/`**:
- `00-STRATEGIE.md` — strategia de marketing, avataruri, piloni
- `01-ARHITECTURA-CALENDAR.md` — structura anului, calendar de sărbători
- `02–05-CALENDAR-*.md` — 365 de zile de social media + 157 de emailuri, per segment
- `06–11-BIBLIOTECA-*.md` — 136 de piese de conținut scrise complet
- `12-SISTEM-EMAIL.md` — cum se transformă o piesă socială în email
- `13–14-EMAILURI-*.md` — emailuri gata scrise
- `SWIPE-POSTARI-TIKTOK.md` — postări și scripturi video
- `generator-calendar.mjs` și `verifica-sistem.mjs` — unelte

**Folosește-le ca model de structură și ton, dar adaptează totul la oferta nouă.** Nu copia textele — alt produs, altă audiență, alt limbaj.
