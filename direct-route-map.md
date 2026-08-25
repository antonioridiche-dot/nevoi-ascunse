# Hartă de rute directe

Catalogul editorial rămâne disponibil la **`/oferte`**. Fiecare ofertă are propria rută directă de primul nivel. Rutele istorice `/oferte/<brand>/…` vor redirecționa temporar către echivalentul direct, fără să schimbe pagina, designul, copy-ul sau flow-ul sursă.

| Ofertă | Rută directă | Rută veche compatibilă |
|---|---|---|
| Tarot | `/tarot` | `/oferte/tarot` |
| Familie protejată | `/familieprotejata` | `/oferte/familieprotejata` |
| Prieteni cu beneficii | `/prieteni-cu-beneficii` | `/oferte/prieteni-cu-beneficii` |
| Vrăji | `/vraji` | `/oferte/vraji` |
| Weightloss | `/weightloss` | `/oferte/weightloss` |
| Relații | `/relatii` | `/oferte/relatii` |
| Armonii & Bine | `/armonii-bine` | `/oferte/armonii-bine` |
| Iubire | `/iubire` | `/oferte/iubire` |
| Liniște Audio | `/liniste-audio` | `/oferte/liniste-audio` |
| Calendarul norocului | `/calendarul-norocului` | `/oferte/calendarul-norocului` |
| Peste despărțire | `/peste-despartire` | `/oferte/peste-despartire` |
| Numerologie | `/numerologie` | `/oferte/numerologie` |
| Soulmate Sketch | `/soulmate-sketch` | `/oferte/soulmate-sketch` |
| Linia palmelor | `/linia-palmelor` | `/oferte/linia-palmelor` |
| Cafe(ea) | `/cafeea` | `/oferte/cafeea` |
| Visul meu | `/visul-meu` | `/oferte/visul-meu` |
| Direcția abundenței | `/directia-abundentei` | `/oferte/directia-abundentei` |
| Slăbiciunea zodiei | `/slabiciunea-zodiei` | `/oferte/slabiciunea-zodiei` |

## Regulă de migrare

> Se schimbă numai prefixul de rută. Toate rutele copil, callback-urile Stripe, linkurile magice și tranzițiile post-cumpărare păstrează segmentul original după numele ofertei.

