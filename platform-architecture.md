# Arhitectura platformei unificate

## Obiectiv

Platforma este o aplicație nouă, cu o singură infrastructură comercială și o singură bază de date, dar cu identități de brand independente la nivel de ofertă. Vizitatorii vor vedea rute, pagini, expeditori de e-mail și comunicări specifice fiecărui brand; infrastructura „Nevoi Ascunse” nu va fi expusă ca brand public obligatoriu.

## Model de brand

Fiecare ofertă devine un **brand profile** configurabil. Profilul stabilește prefixul de rută, numele public, tema, produsele, pașii de funnel, expeditorii de e-mail, destinatarul intern al alertelor și regulile de acces.

| Câmp | Rol |
| --- | --- |
| `key` | Identificator intern stabil, de exemplu `familieprotejata` |
| `routeBase` | Prefixul tuturor paginilor publice, de exemplu `/oferte/familieprotejata` |
| `displayName` | Numele afișat public, fără referință obligatorie la platforma comună |
| `senderName` și `senderEmail` | Identitatea pentru confirmări, acces, recuperare și anunțuri |
| `replyTo` | Adresa la care pot răspunde clienții acelui brand |
| `notificationRecipients` | Destinatarii alertelor interne pentru comenzi și evenimente operaționale |
| `theme` | Paleta, fonturile și resursele vizuale proprii ofertei |
| `funnelConfig` | Pagini, pași post-cumpărare, reguli comerciale și automatizări autorizate |

Toți expeditorii vor utiliza același domeniu verificat, `nevoi-ascunse.ro`, cu identități diferite de forma `mara@nevoi-ascunse.ro` sau `andrei@nevoi-ascunse.ro`. Adresele exacte, numele afișate și destinațiile interne se administrează central, fără modificarea codului fiecărui funnel.

## Convenția de rute

Fiecare brand primește un prefix propriu. Paginile de vânzare, checkout-ul, pașii post-cumpărare, thank-you, zona client, afilierea și paginile legale rămân izolate în acel prefix. Un exemplu de flux este următorul.

```text
/oferte/familieprotejata
/oferte/familieprotejata/quiz
/oferte/familieprotejata/checkout
/oferte/familieprotejata/pas/oto-1
/oferte/familieprotejata/pas/downsell-1
/oferte/familieprotejata/multumim
/oferte/familieprotejata/biblioteca
/oferte/familieprotejata/afiliati
/oferte/familieprotejata/legal/termeni
```

Același contract de navigare păstrează state-ul util al funnelului — intenția de cumpărare, e-mailul normalizat, audiența, atribuirea de afiliat și varianta de ofertă permisă — fără a expune prețuri sau drepturi comerciale controlate de server.

## Date comerciale și acces

Modelul unificat va avea produse, pași de funnel, intenții de checkout, comenzi, drepturi de acces, clienți de marketing, taguri, evenimente de tracking, afiliați, comisioane și jurnale de e-mail. Acesta pornește gol, fără migrare de date istorice, dar fiecare tabel conține `brandId` pentru izolare logică și raportare separată.

Stripe rămâne sursa de adevăr pentru procesarea plăților. Baza locală reține identificatorii Stripe și starea de îndeplinire a drepturilor de acces; nu stochează date de card sau secrete de plată. Confirmarea unei plăți este tratată exclusiv pe server, prin webhook idempotent, iar accesul la produse este emis doar după confirmare.

## Tracking și tagging

Fiecare contact și comandă va avea o colecție de taguri per brand, nu o listă globală ambiguă. Exemplele de evenimente sunt `quiz_started`, `quiz_completed`, `sales_viewed`, `checkout_started`, `checkout_abandoned`, `purchase_completed`, `offer_accepted`, `offer_declined`, `access_opened` și `email_clicked`. Trackingul va exclude informațiile de plată și va trata e-mailul ca date sensibile, fără a-l expune în URL-uri de analytics sau în loguri publice.

## E-mailuri și automatizări

Fiecare e-mail este creat dintr-un eveniment de domeniu asociat unui brand. Confirmările de comandă, linkurile de acces, recuperarea bibliotecii, notificările de plată și mesajele post-cumpărare sunt tranzacționale. Seriile de follow-up, abandon de checkout, emailurile de anunț și segmentarea de audiență sunt tratate separat, cu consimțământul și dezabonarea potrivite tipului de comunicare.

Integrarea Resend este responsabilă pentru expediere și, după configurarea endpointului, pentru evenimente de livrare, bounce, spam complaint, deschidere și click. Deoarece evenimentele pot fi retrimise sau livrate în altă ordine, fiecare handler va fi idempotent și va utiliza identificatorul unic al evenimentului pentru deduplicare.

## Operațiuni și administrare

Administrarea comună include o zonă protejată cu filtrare pe brand. Operatorul poate vedea comenzile, accesul, statusurile e-mailurilor, tagurile, afiliații și performanța fiecărui funnel fără ca datele unui brand să se amestece implicit cu celelalte. Fiecare brand are propriile filtre, expeditori, destinatar pentru notificări și configurații de produse.

