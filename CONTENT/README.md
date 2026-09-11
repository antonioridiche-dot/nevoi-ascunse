# 📁 SISTEMUL DE CONȚINUT — TE VREAU ÎNAPOI
## Index master · cum se folosește totul

---

# CE E ÎN FOLDERUL ĂSTA

| Fișier | Ce e | Când îl deschizi |
|---|---|---|
| `00-STRATEGIE.md` | **Creierul sistemului.** Avataruri, credințe de spart, scara conștientizării, cei 8 piloni, reguli de brand, ce NU spui niciodată | O dată, ca să înțelegi. Apoi când ai o decizie de luat. |
| `01-ARHITECTURA-CALENDAR.md` | Cum e structurat anul, ritmul săptămânal, sistemul de rotație, calendarul de sărbători românești | La început de an și când planifici luna |
| `02-CALENDAR-BARBATI-SOCIAL.md` | **365 de zile** pentru bărbați — dată, pilon, asset, CTA | Zilnic |
| `03-CALENDAR-FEMEI-SOCIAL.md` | **365 de zile** pentru femei | Zilnic |
| `04-CALENDAR-BARBATI-EMAIL.md` | **157 emailuri** pentru bărbați | Luni, miercuri, vineri |
| `05-CALENDAR-FEMEI-EMAIL.md` | **157 emailuri** pentru femei | Luni, miercuri, vineri |
| `06-BIBLIOTECA-CONTINUT.md` | Conținutul scris — **BĂRBAȚI** (text + transcript video + muzică) | Când produci |
| `07-BIBLIOTECA-FEMEI.md` | Conținutul scris — **FEMEI** | Când produci |
| `08–11-*.md` | Restul bibliotecii (aceeași structură) | Când produci |
| `12-SISTEM-EMAIL.md` | Cum transformi un asset social în email · 20 de subiecte · 6 emailuri gata scrise | Când scrii emailuri |
| `13-EMAILURI-BARBATI.md` | Emailurile scrise complet — bărbați, săptămânile 1–13 (37 emailuri) | Luni, miercuri, vineri |
| `14-EMAILURI-FEMEI.md` | Emailurile scrise complet — femei, săptămânile 1–13 (37 emailuri) | Luni, miercuri, vineri |
| `15–16-EMAILURI-*.md` | Săptămânile 14–26 (în lucru) | Luni, miercuri, vineri |
| `generator-calendar.mjs` | **Scriptul care generează calendarele.** Refolosibil în fiecare an | O dată pe an, în decembrie |
| `verifica-sistem.mjs` | **Validator automat** — acoperire, rotație, distribuție pe piloni, ID-uri orfane | După fiecare lot nou |

---

# CUM SE FOLOSEȘTE ZILNIC (5 minute)

```
1. Deschide calendarul potrivit (02 pentru bărbați, 03 pentru femei)
2. Caută data de azi
3. Ia ID-ul assetului (ex. A3)
4. Deschide biblioteca (06 sau 07) și caută assetul
5. Textul → Facebook/Instagram. Transcriptul → TikTok/Reels.
6. Gata.
```

**Timp de producție:** dacă filmezi în batch, o zi pe lună acoperă tot.

---

# CUM SE REFOLOSEȘTE ÎN FIECARE AN

```
decembrie, anul N:
  1. node generator-calendar.mjs 2028     ← regenerează toate cele 4 calendare
  2. Verifică sărbătorile mobile (Paște, Rusalii, Ziua Mamei, Ziua Tatălui)
     — scriptul le calculează automat, dar confirmă-le
  3. Scoate din rotație cele 10 piese cu cea mai slabă performanță
  4. Înlocuiește-le cu piese noi (scrie-le în bibliotecă)
  5. Actualizează testimonialele cu povești reale din ultimul an
  6. Verifică prețurile și numerele de pagini în seria O (ofertă)
  7. Gata pentru anul N+1
```

**Ce rămâne identic:** pilonii, structura săptămânală, activele, arcul pe trimestre.
**Ce se schimbă:** trendurile (12 piese), testimonialele, numerele.

---

# STRUCTURA SISTEMULUI (pe scurt)

## 4 fluxuri separate
- Bărbați — social (365/an)
- Femei — social (365/an)
- Bărbați — email (157/an)
- Femei — email (157/an)

**Nu se amestecă.** Un bărbat nu trebuie să vadă niciodată conținut pentru femei.

## 68 de active per gen
| Serie | Pilon | Nr. |
|---|---|---|
| A | Autoritate | 20 |
| C | Curiozitate | 12 |
| P | Poveste | 9 |
| B | Spărgere de credințe | 9 |
| I | Permisiune | 7 |
| D | Identitate | 5 |
| E | Engagement | 3 |
| O | Ofertă | 3 |

Rotație la minim 21 de zile distanță. Fiecare reluare schimbă un element (hook / format / unghi / sezon).

## Ritmul săptămânal (social)
| Zi | Pilon | Nivel |
|---|---|---|
| Duminică | Permisiune / Reflecție | 1–2 |
| Luni | Autoritate | 2 |
| Marți | Curiozitate | 2–3 |
| Miercuri | Poveste | 3–4 |
| Joi | Spărgere de credințe | 3 |
| Vineri | Identitate | 4 |
| Sâmbătă | Engagement / Trend | orice |

## Ritmul săptămânal (email)
| Zi | Tip |
|---|---|
| Luni | Poveste |
| Miercuri | Mecanism |
| Vineri | Ofertă / Dovadă |

## Distribuția pe niveluri de conștientizare
- 20% — nu știe că are o problemă (validare)
- 30% — știe problema, nu cauza (mecanism)
- 25% — știe că există soluții (cadre, testul)
- 15% — știe de produs (dovadă)
- 10% — vrea, ezită (ofertă)

**80% din conținut nu vinde nimic. Vinde doar 20%.** Dacă fiecare postare zice „cumpără", contul moare în 3 săptămâni.

---

# SĂRBĂTORILE CARE CONTEAZĂ CEL MAI MULT

| Data | Sărbătoare | De ce e importantă |
|---|---|---|
| 14 feb + 24 feb | Valentine's + **Dragobete** | toată lumea postează cupluri |
| 1 mar | **Mărțișor** | „cui îi dai mărțișor anul ăsta?" |
| 8 mar | Ziua Femeii | pentru fluxul feminin |
| 1 iun | Ziua Copilului | copii între părinți despărțiți |
| 1 sep | Început de școală | doi părinți, două locuri |
| 26 nov | **Black Friday** | singura reducere reală a anului |
| 1 dec | Ziua Națională | familie adunată, tu singur |
| **24–26 dec** | **Crăciun** | **cel mai puternic moment. FĂRĂ vânzare.** |
| **31 dec** | **Revelion** | „cu cine intri în anul nou?" |

**Plus sezoanele emoționale:** sezonul de nunți (mai–septembrie), vacanțele (iulie–august), toamna (septembrie–octombrie), „anul se termină și eu tot singur" (noiembrie).

---

# REGULI CARE NU SE CALCĂ

1. **Un singur CTA per piesă.** Două = zero.
2. **O singură idee per piesă.** Trei idei = zero idei.
3. **Nicio promisiune garantată.** „Se poate", nu „sigur se întâmplă".
4. **Fără limbaj de coerciție.** „Va veni spre tine", nu „o forțezi".
5. **Vocea bate muzica.** Întotdeauna.
6. **Primele 2 secunde decid totul.** Fără introduceri.
7. **Nivelurile 1–2 nu vând.** Rezistă tentației.
8. **Niciodată două piese din același pilon consecutive.**

---

# CIFRELE SISTEMULUI

| Ce | Cât |
|---|---|
| Active de scris | 136 (68 × 2 genuri) |
| Postări social pe an | 730 (365 × 2) |
| Emailuri pe an | 314 (157 × 2) |
| Timp de producție lunar | ~1 zi per gen |
| Sărbători majore acoperite | 11 |
| Cel mai puternic moment | 20–31 decembrie |

---

# ⚠️ NOTĂ DESPRE CALENDARUL DE EMAIL (săptămânile 1–13)

Am corectat raportul valoare:ofertă din calendar (era 2:1, acum e **6:1**, conform strategiei). Corectura a deplasat ușor alinierea pentru primele 13 săptămâni.

**Ce faci practic:**

| Săptămâni | Sursă de adevăr |
|---|---|
| **1–13** | **Emailurile din `13-EMAILURI-BARBATI.md` / `14-EMAILURI-FEMEI.md` sunt calendarul.** Datele din titlurile lor sunt programul. |
| **14–53** | **Calendarul regenerat** (`04` / `05`) — raport 6:1. |

Primele 13 săptămâni rulează mai agresiv (o ofertă pe săptămână). **Nu e o problemă** — pentru o listă proaspătă, ofertele mai dese la început sunt o practică bună. După săptămâna 13, ritmul se relaxează automat.

---

# ⚠️ DE URMĂRIT (semnalări de la producție)

Câteva piese sunt bune, dar trebuie programate cu grijă:

| Asset | Problema | Ce faci |
|---|---|---|
| **P6 femei** („Nu voiam să-l recuperez") | Cel mai bun asset de încredere din lot, dar **nu duce spre cumpărarea cărții** — e despre a realiza că nu-l mai vrei | Nivel 1–2. **Niciodată în săptămâna de ofertă.** |
| **O3** (coaching) | Scris intenționat cu „nu cumpăra încă, întâi cartea" — construiește încredere, convertește slab | Nu-l folosi ca ofertă principală. E piesă de încredere. |
| **B8 femei** („Bărbații nu se schimbă niciodată") | Aproape subminează produsul | Reframe făcut (oamenii se schimbă prin pierdere, nu prin cereri). Verifică formularea când îl publici. |
| **B6 bărbați** („Timpul vindecă tot") | „Vindecă" e în lista de termeni interziși | E credința pe care o *spargem*, între ghilimele — ok. Redenumire opțională: „Timpul rezolvă tot" |
| **A13 vs B3** / **A15 vs B7** | Suprapuneri conceptuale | Diferențiate, dar nu le programa în același deceniu |

---

# PRIMUL PAS, DACA EȘTI LA ÎNCEPUT

1. **Citește** `00-STRATEGIE.md` — 20 de minute. Fără asta, restul e zgomot.
2. **Citește** 3–4 assets din `06-BIBLIOTECA-CONTINUT.md` (recomand A3, I1, B1).
3. **Deschide** calendarul de azi și postează prima piesă.
4. **Nu aștepta** să fie totul perfect. Sistemul se îmbunătățește prin postare, nu prin planificare.

> **Adevărul central:** nu vinzi o carte. Vinzi **încrederea că se poate**. Tot conținutul din folderul ăsta există ca să construiască asta, în ordinea corectă.
