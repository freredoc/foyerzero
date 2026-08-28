# RAPPORT — lot RÉSIDU : l'économie par tick devient exacte

> Livré et commité le 26/08/2026 en version **0.12.0 · build 12**.
> Ce rapport est reconstitué à l'identique pour entrer au dépôt, où les neuf
> autres `RAPPORT-*.md` vivent déjà (rang 6 de `CLAUDE.md`).

---

## 1. Mesuré, pas estimé

| | avant | après |
|---|---|---|
| `npm test` | 152 pass / 0 fail | **154 pass / 0 fail** |
| `npm run build` | `dist/index.html`, 81 236 o | **81 236 o**, 0 référence externe |
| version · build | 0.11.0 · 11 | **0.12.0 · 12** |
| `SAVE_VERSION` | 1 | **2** |

`dist/index.html` ne bouge pas d'un octet : `src/index.src.html` n'importe ni
`sim/economy.js` ni `sim/state.js` — le banc d'essai n'a jamais branché
l'économie. Le lot est donc **invisible en jeu aujourd'hui** et le deviendra le
jour où la base du joueur sera branchée.

---

## 2. Ce que le lot fait

Plus aucun débit n'est arrondi par tick. Un débit se range **par heure**,
entier, et chaque bâtiment porte un **résidu** dans l'état de jeu.

```
residu += debitMilliParHeure
gain    = Math.floor(residu / TICKS_PAR_HEURE)
residu  = residu % TICKS_PAR_HEURE
```

Erreur d'arrondi par tick : **exactement zéro**, à n'importe quelle fréquence.
Le seul arrondi qui subsiste est celui du débit horaire, fait une fois par
niveau — nul aux niveaux 1 et 2, sous le millionième de pour cent au-delà du
niveau 4.

**Effet de bord voulu : le passage du hors-combat à 1 Hz devient sans effet sur
l'économie.** La conversion passe par `TICKS_PAR_HEURE`, nouvelle constante de
`sim/clock.js`. Sous l'ancien régime, diviser la fréquence par dix aurait
multiplié l'erreur d'arrondi par dix.

---

## 3. Impact de calibrage

Le niveau 1 est **rigoureusement inchangé** : `baseMilliParTickNiveau1: 20`
devient `baseMilliParHeureNiveau1: 720_000`, soit 20 × 36 000. Ce qui change,
c'est ce que l'ancien arrondi coûtait aux autres niveaux :

| niveau | ancien (milli/h) | nouveau | delta |
|---|---|---|---|
| 1 | 720 000 | 720 000 | 0,000 % |
| 2 | 1 044 000 | 1 044 000 | 0,000 % |
| **3** | 1 332 000 | 1 341 540 | **+0,716 %** |
| **4** | 1 656 000 | 1 650 094 | **−0,357 %** |
| 5 | 1 980 000 | 1 984 238 | +0,214 % |
| **6** | 2 340 000 | 2 353 307 | **+0,569 %** |
| 8 | 3 240 000 | 3 227 308 | −0,392 % |
| 10 | 4 320 000 | 4 334 853 | +0,344 % |
| 12 | 5 760 000 | 5 747 798 | −0,212 % |
| 20 | 16 596 000 | 16 600 804 | +0,029 % |
| 30 | 58 212 000 | 58 203 580 | −0,014 % |
| 50 | 653 544 000 | 653 552 045 | +0,001 % |

L'écart est le bruit d'arrondi qu'on supprime, pas un changement de courbe : il
va dans les deux sens, il est maximal aux petits niveaux et il s'éteint en
montant.

---

## 4. Ce qui a été trouvé faux en chemin

### 4.1 La borne de débordement annoncée dans `data/base.js` était fausse

Le commentaire écrit le 25/08 annonçait que le pire cas — dix ans hors ligne à
1 Hz au débit du niveau 50 — restait « deux fois sous l'entier sûr ».

**Mesuré : le produit naïf `N × debitParHeure` y vaut 4,245 × 10¹⁸, soit
471 fois AU-DESSUS de `Number.MAX_SAFE_INTEGER`.** La formule fermée telle
qu'elle était écrite dans le commentaire aurait dérivé en silence.

Le rattrapage ne calcule donc pas ce produit. Il décompose
`N = q × TICKS_PAR_HEURE + r` :

- le résidu final ne dépend que de `r` (arithmétique modulaire) → produit borné
  par `TICKS_PAR_HEURE × (debit + 1)` ;
- les heures pleines `q` sont **bornées à ce qu'il faut pour saturer le
  stockage** — au-delà, le stock vaut la capacité de toute façon, donc le
  produit n'a plus à être exact, donc il n'a plus le droit d'être grand. Borne :
  `cap + debit`.

### 4.2 La marge du seuil est de 19, pas de 19 000

Première rédaction de ma part : « le niveau 50 reste dix-neuf mille fois sous le
seuil ». **Faux, mesuré à 19.** Corrigé dans les deux commentaires avant
livraison.

`DEBIT_MILLI_PAR_HEURE_MAX` est exporté et vaut
`MAX_SAFE_INTEGER / TICKS_PAR_HEURE − 1` = **250 199 979 297 milli/h** à 10 Hz.
Le débit le plus lourd du jeu — collecteur niveau 50 de `data/base.js`,
13 452 465 unités/h — est 19 fois dessous. `rattrapageEconomie` **lève** si le
seuil est franchi, plutôt que de dériver. Une donnée future qui multiplierait un
débit par 20 doit faire descendre la fréquence de tick, pas franchir le seuil.

### 4.3 Le résidu doit avancer même stockage plein

Le geler à la saturation aurait cassé l'exactitude du rattrapage : la
composition `min(cap, min(cap, x+a)+b) = min(cap, x+a+b)` ne tient que si les
gains sont indépendants de l'état du stock. Un test le garde explicitement, avec
le commentaire qui dit pourquoi.

---

## 5. Fichiers touchés — sept, aucun collatéral

| fichier | ce qui change | delta |
|---|---|---|
| `src/sim/clock.js` | + `TICKS_PAR_HEURE` (36 000) | +390 o |
| `src/data/params.js` | `baseMilliParTickNiveau1: 20` → `baseMilliParHeureNiveau1: 720_000` | +696 o |
| `src/sim/economy.js` | `fluxMilliParTick` → **`debitMilliParHeure`** ; résidu ; décomposition modulaire + bornage ; + `DEBIT_MILLI_PAR_HEURE_MAX` | +4 556 o |
| `src/sim/state.js` | `SAVE_VERSION` 1 → **2** ; `residuFlux: 0` ; migration **v1 → v2** | +643 o |
| `src/data/base.js` | commentaire seul : correctif posé, rectificatif de borne | +423 o |
| `test/economy.test.js` | API renommée ; test de flux réécrit ; **+1 test** | +2 212 o |
| `test/state.test.js` | API renommée ; `TICKS_PAR_HEURE` importée ; **+1 test** | +2 433 o |

---

## 6. Audit du compte d'assertions

| fichier | tests avant → après | lignes `assert.` avant → après |
|---|---|---|
| `test/economy.test.js` | 7 → **8** | 34 → **40** |
| `test/state.test.js` | 5 → **6** | 20 → **21** |

**Aucune assertion supprimée. Aucun seuil abaissé.** Les deux assertions
réécrites le sont parce que l'API change d'unité. La partie saturation de
l'ancien test « flux continu » — trois assertions sur trois ticks — devient une
boucle de **5 000 ticks** qui asserte à chaque tick que le stock ne dépasse pas
la capacité : plus sévère, pas moins.

### Les deux tests ajoutés

- **`saturation — le stock s'arrête à la capacité, le résidu continue d'avancer`**
  garde le point du §4.3.
- **`rattrapage — une très longue absence reste exacte au bit près (contrôle
  BigInt)`** atteint ce que le test 11 ne peut pas : des fenêtres qu'on ne peut
  pas simuler tick par tick. 500 tirages **déterministes** (PRNG du dépôt,
  graine 20260826), débits jusqu'au millième du seuil, absences jusqu'à **dix
  ans à 10 Hz**, comparés à l'arithmétique BigInt exacte. **0 écart.** Le test
  asserte aussi que le plus grand entier intermédiaire est resté sous
  `MAX_SAFE_INTEGER` (mesuré 8,13 × 10¹², 1 100 fois de marge) **et** qu'il a
  dépassé 10¹² — sinon le montage ne prouverait rien.

### Falsifiabilité des montages

- Le test d'exactitude asserte d'abord que `debit % TICKS_PAR_HEURE ≠ 0` : sur
  un débit divisible il n'y aurait aucun résidu à mesurer.
- Il asserte que l'ancien arrondi coûtait **plus de 0,3 %** sur ce montage
  (mesuré 0,358 % au niveau 4) — sinon le lot ne réparerait rien.

---

## 7. Migration de sauvegarde

`SAVE_VERSION` passe à 2. La migration `1 → 2` pose `residuFlux = 0` sur chaque
bâtiment. Repartir de zéro est **exact** : le résidu perdu vaut moins d'une
milli-unité par bâtiment.

Le test 12 fabrique une sauvegarde **v0** et vérifie que la chaîne `0 → 1 → 2`
est parcourue en entier — l'assertion ajoutée tomberait si quelqu'un ajoutait un
maillon sans le brancher.

---

## 8. Laissé en suspens à la livraison

- `sim/state.js` ne branche toujours pas `data/base.js`.
- `sim/economy.js` ne connaît qu'une capacité de stockage globale
  (`params.stockage.capaciteMilli`). La capacité par bâtiment de `data/base.js`
  — `capaciteDuNiveau()` — n'est lue par personne.
- La boucle du hors-combat à 1 Hz est maintenant *sûre* côté économie, mais
  toujours pas implémentée.
