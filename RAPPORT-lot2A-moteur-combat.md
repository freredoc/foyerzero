# Rapport — lot 2A : moteur de combat déterministe

## Version livrée

| | |
|---|---|
| `version` | **0.3.0** (était 0.2.0) |
| `config.build` | **3** (était 2) |
| Build produit | `dist/index.html` — version 0.3.0 build 3 — 2974 octets (2,9 Kio) |
| `npm run check` | **PASS** — build **et** 58 tests, 0 échec |

Le brief ne proposait aucun numéro ; 0.3.0 / build 3 étaient les suivants disponibles.

---

## Fichiers

### Créés

| Fichier | Lignes |
|---|---|
| `src/sim/grille.js` | 199 |
| `src/sim/combat.js` | 1064 |
| `test/grille.test.js` | 205 |
| `test/combat.test.js` | 1054 |
| `RAPPORT-lot2A-moteur-combat.md` | ce fichier |

### Modifiés

| Fichier | Modification |
|---|---|
| `package.json` | `version` 0.2.0 → 0.3.0, `config.build` 2 → 3. Rien d'autre. |

**Aucun autre fichier existant n'a été touché.** `git diff main -- CLAUDE.md src/data/combat.js
src/data/sites.js` est vide : les trois fichiers du lot 2A-0 étaient déjà sur `main` et sont
intacts.

---

## Résultat de chaque test

`node --test "test/*.test.js"` — **58 tests, 58 PASS, 0 KO.** Les 26 tests des deux fichiers
neufs sont détaillés ci-dessous ; les 32 autres sont ceux des lots 1 et 1C, tous encore verts.

### Les seize tests du brief

| Test | Résultat | Montage effectivement joué |
|---|---|---|
| **T1** déterminisme | **PASS** | Montage riche (niveau 12, saveur `richeQuartz`, 3 obstacles, 5 bâtiments, 13 défenseurs dont les 3 artilleries, 4 vagues avec aviation traversante et stoppeuse). Deux `creerCombat` indépendants, trace `serialiserEtat` à chaque tick jusqu'à la fin, comparaison ligne à ligne. Trace longue de plus de 100 ticks — assertion explicite pour qu'une trace courte ne puisse pas faire passer le test à vide. |
| **T2** aucun aléa | **PASS** | Même montage riche, résolu de bout en bout avec `Math.random` et `Date.now` remplacés par des bouchons qui lèvent, **pour toute la durée du fichier** (installés au chargement du module de test, restaurés sur `exit`). Le test vérifie ensuite que les bouchons lèvent réellement, puis scanne le texte de `src/sim/combat.js` et `src/sim/grille.js`, commentaires retirés, pour les trois interdits (`Math.random`, `Date.now`, `Math.sqrt`). |
| **T3** ciblage | **PASS** | Meute en (3,5), Merlons en (4,4) et (4,6). Les deux à 2 000 000 de distance², sous la portée² de 2 250 000. Cible retenue : colonne 4. Le Merlon de droite est intact après un tick. |
| **T4** portée et portée mini | **PASS** | Faucheuse défensive en (8,5) (portée² 30 250 000, mini² 12 250 000), trois montages avec un Meute en (5,5) → 9 000 000, (4,5) → 16 000 000, (2,5) → 36 000 000. Ne tire pas / tire (20 000 milli-PV) / ne tire pas. |
| **T5** plancher de réserve | **PASS** | Meute (vague 1, apparition en (2,5)) face à un Merlon en (3,5). Réserve 15 aux ticks 135 **et** 209, Merlon détruit et retiré au tick 209. **Écart sur un point, voir §Écarts.** |
| **T5 bis** plancher levé sur bâtiment | **PASS** | Meute monté à `reserve: 15` en (10,5), Gangue en (11,5), `maxTicks: 25`. Gangue finale 114 000 milli-PV, réserve 0, aucun tir après le tick 15. Butin : 216 quartz, 0 scorie. |
| **T6** dégâts proportionnels | **PASS** | Même montage que T5, Meute monté à `pvMilli: 50 000`. 1200 milli-PV par tir, Merlon à 488 000 après 10 ticks. |
| **T7 a** écrasement | **PASS** | Fendeur (masse 10) en vague 1, Meute défensive (masse 1) en (3,5). Au tick 9 le Fendeur est à 2900 et le Meute vivant ; au tick 10 le Meute est écrasé (`ecrase: true`, 0 PV) et le Fendeur à 3000 — il a bien avancé de 100 milli-cases sans s'arrêter. |
| **T7 b** blocage à masse égale | **PASS** | Deux Fendeurs opposés en (2,5) et (3,5) : positions inchangées après 20 ticks, tous deux vivants. **Complété** par un couple qui n'est pas de prédilection l'un pour l'autre — Ratisseur attaquant contre Bélier défensif, masse 5 contre 5 — pour isoler le blocage : bloqué à 2960 du tick 9 au tick 25. Sans ce second cas, l'arrêt pour prédilection du Fendeur suffisait à faire passer le test sans que la règle de masse soit jamais éprouvée. |
| **T8** obstacle | **PASS** | Meute en (1,5), obstacle `infanterie` en (2,5) : +500 sur les 10 premiers ticks hors obstacle, entrée en case 2 au tick 20, puis +200 sur les ticks 21 à 30 (20 milli/tick). Crécelle en (1,5) avec un obstacle `les_deux` en (2,5) : +1500 en 10 ticks, inchangé. |
| **T9** vagues | **PASS** | Quatre vagues d'un Meute chacune, colonne 1. Attaquants présents aux ticks 0, 49, 50, 99, 100, 149, 150 : 1, 1, 2, 2, 3, 3, 4. |
| **T10** aucun plancher de PV | **PASS** | Casemate montée à `pvMilli: 35 000` (10 %) en (3,5), Fouisseurs en vague 1. Son tir vaut 1500 milli-PV au tick 1, elle tombe à **0** au tick 2 — jamais à 1 % — cesse de tirer, et sa case est libérée (les Fouisseurs l'occupent avant le tick 32). |
| **T11** fin sur la Souche | **PASS** | Pilon en (10,5), Souche en (11,5), Gangue en (11,7). Fin au tick 27, cause `souche`. Butin intégral 1200 quartz, Gangue livrée bien qu'intacte. Points de recherche : 0. |
| **T12** butin proportionnel | **PASS** | Pilon en (10,5), Gangue en (11,5), `maxTicks: 5`. 75 000 milli-PV perdus sur 150 000 → 450 quartz, 0 scorie. |
| **T13** points de recherche | **PASS** | Niveau 3, Merlon monté à `pvMilli: 250 000` en (3,5), attaquant hors de portée en (2,1), `maxTicks: 1`. 4 000 milli-points ; 4 800 avec `modulesDebloques.ouvrage = ['pvPlusVingt']`. |
| **T14** durée maximale | **PASS** | Meute en colonne 1, Gangue en (18,9), aucune défense. Fin au tick 900, cause `duree`, butin nul. |
| **T15** validation | **PASS** | Onze cas de refus, chacun avec le motif attendu : identifiant inconnu, identifiant sans rôle en défense, case hors grille, deux entités sur la même case, bâtiment hors de 11–18, défenseur hors de 3–10, défenseur sur un obstacle, attaquant sur un obstacle, cinq vagues, niveau 51, saveur inconnue. Le montage de référence, lui, passe. |
| **T16** cohérence arithmétique | **PASS** | Sur **toutes** les lignes de `UNITES` et `DEFENSES` : vitesse × 100 entière, `(vitesse_milli × 1000) % 2500 === 0` (division par 2,5 entière), portées et PV entiers en milli, matrices entières et multiples de 100 en millièmes et dans 0…1000. Plus `2^49 = 562 949 953 421 312 < Number.MAX_SAFE_INTEGER`, asserté et non supposé. |

### Tests ajoutés

Six tests au-delà du §12. Les quatre premiers couvrent des règles du brief qu'aucun test du §12
n'atteignait : sans eux, autant de chemins du moteur n'auraient été asseyés par rien.

| Test | Résultat | Ce qu'il couvre |
|---|---|---|
| **§13** aucun flottant | **PASS** | Parcours récursif de l'état sérialisé — pas un contrôle à l'œil — à la création, au tick 137 et au tick 900 du montage riche. Zéro nombre non entier. C'est le premier des six contrôles de §13. |
| **§7** franchissement | **PASS** | Meute traversant une Ronce en (3,5). La barrière ne bloque pas (entrée en case 3 au tick 20, il continue jusqu'à 3250) ; premier tick de présence à 15 200 milli-PV ; mort au tick 27 ; **la Ronce reste debout** à 142 692. Une Crécelle sur la même barrière ne perd rien : la matrice de la Ronce vaut 0 en colonne aviation. |
| **§7** comportements aériens | **PASS** | Frappeur (traversant, 300 milli/tick) : 18 800 au tick 56, sort au tick 57, `sorti: true` et `vivant: true`, fin cause `attaquants`. Busard (stoppeur, 150 milli/tick) : bloqué à 18 950 au tick 113, toujours là au tick 200, jamais sorti. |
| **§8** plancher, cas discriminant | **PASS** | Le cas où la formulation du brief et celle du compte rendu divergent : Meute **déjà dans la bande des bâtiments** (11,5), `reserve: 16`, tirant **en arrière** sur un Merlon en (10,5). Réserve à 15 dès le tick 1, toujours 15 au tick 10, Merlon à 476 000 : le tir n'a jamais cessé. C'est bien le type de la cible qui tranche, pas la rangée du tireur. |
| **§10** deux pentes du butin | **PASS** | `butinPlein(1,1) = 300` ; rapport de niveau à niveau égal à `penteBasse` jusqu'à la bascule et à `penteHaute` au-delà, à 1e−12 près ; proportionnalité à l'indice. |
| **§10** saveur | **PASS** | Montage de T11 en `richeScorie` : le total 1200 est reventilé en 300 quartz / 900 scorie. |
| **§11** champs 2C | **PASS** | `modulesActifs` et `effetsTemporises` présents sur chaque entité à la création et toujours vides après 200 ticks. |
| **§9** vague à venir | **PASS** | Vague 1 anéantie au tick 7 par une Casemate, vague 2 attendue au tick 50 : le combat **ne s'arrête pas** entre les deux. Voir §Écarts. |
| **§11** API | **PASS** | `construireResultat(etat)` rend le même objet que `resoudre`. |
| **G1 à G6** géométrie | **PASS** | Conversions milli-cases réversibles ; distances au carré ; bornes et contiguïté des trois bandes (2 + 8 + 8 = 18, et 8 × 9 = 72 = `casesBatiments`) ; occupation ; obstacles et ralentissement ; sortie par le haut. |

---

## Écarts par rapport au brief, et leurs raisons

### 1. Formule de dégâts — arbitrage reçu en cours d'exécution

Le §4 donnait `floor(degats × facteurMatrice × pvCourant / pvMax)`, avec « un seul `Math.floor`,
en bout de chaîne, jamais d'arrondi intermédiaire ». Ethan a arbitré en cours de lot la forme en
deux temps :

```js
const ratioMilli  = Math.floor(pvCourantMilli * 1000 / pvMaxMilli);   // 0 à 1000
const degatsMilli = Math.floor(degats * facteurMatrice * ratioMilli / 1000);
```

La santé du tireur passe d'abord en millièmes, sur le même barème que la matrice. C'est cette
forme qui est implémentée.

**Aucun seuil chiffré du §12 ne bouge** : ils portent tous sur des ratios ronds (100 %, 50 %,
10 %), où les deux écritures coïncident exactement — 2400, 1200, 15 000, 20 000, 1500 sont
inchangés. Seules deux valeurs intermédiaires que j'avais dérivées moi-même se déplacent, et les
tests ont été recalculés : le second tir de la Casemate de T10 vaut 630 au lieu de 642
(santé `floor(15 000 × 1000 / 350 000) = 42 ‰`), et la chaîne de franchissement de la Ronce
passe par 55 100 · 40 520 · 26 080 · 11 740 au lieu de 55 084 · 40 496 · 26 040 · 11 681 — même
tick de mort, même PV final de la barrière.

**La phrase du §4 du brief est à corriger** : « jamais d'arrondi intermédiaire » ne décrit plus
le moteur. Le code porte la nouvelle formule et la raison du changement en commentaire.

### 2. T5 — le Meute avance au tick 209, pas 210

C'est le seul point où deux sections du brief se contredisent, et il est arbitré en faveur du §6.

Le §6 est déclaré **normatif** et place le **retrait des morts (étape 6) avant le déplacement
(étape 7)**. Au tick 209, le Merlon tombe à 0 (étape 5), est retiré de la grille (étape 6), puis
le Meute — bloqué à 2950 depuis le tick 20 — trouve sa case de destination libre et avance
(étape 7). Le §12 annonce le tick 210, ce qui suppose un retrait *après* le déplacement.

Toutes les autres valeurs de T5 sont exactement celles du brief (réserve 15 aux ticks 135 et 209,
Merlon détruit au tick 209). Le test assied 209, et le calcul est en commentaire au-dessus de
l'assertion. **Il faut trancher : soit le §12 corrige son 210, soit le §6 déplace son étape 6
après son étape 7** — auquel cas tous les combats où une unité est bloquée derrière une structure
qu'elle abat gagnent un tick de retard.

### 3. Rangée d'apparition d'une vague, et champ `rangee` optionnel

Le format du §11 ne donne pas de rangée aux entrées de vague. Deux décisions :

- **Rangée par défaut : 2**, le front de la bande de déploiement. C'est la seule valeur qui
  reproduit les chiffres de T5 : il faut que le Meute soit à portée du Merlon dès le tick 1, donc
  à une case de la bande de défense.
- **Un champ `rangee` optionnel** a été ajouté aux entrées de vague. Il est **nécessaire** :
  T5 bis (« passée la ligne »), T11 (« Pilon adjacent à une Souche ») et T12 exigent un attaquant
  déjà dans la bande des bâtiments, impossible à monter depuis la rangée 2 sans jouer 65 ticks
  d'approche. C'est exactement l'usage annoncé au §11 pour `pvMilli` et `reserve` : « monter un
  état déjà entamé ». Le champ est validé (dans la grille, pas sur un obstacle, pas sur une case
  occupée) et vaut 2 par défaut.

### 4. Condition de fin nº 2 — les vagues à venir comptent

Le §9 dit « plus aucun attaquant vivant sur la grille ». Pris à la lettre, un raid s'arrêterait
dès que la vague 1 est anéantie, les trois autres n'étant pas encore apparues. Le moteur exige
donc **en plus** qu'il ne reste ni vague ni apparition en attente. Aucun test du §12 ne dépend
de ce point ; un test dédié le couvre.

### 5. Ordre total du ciblage — deux critères de plus

Le §5 affirme que « le couple (rangée, colonne) forme un ordre total et stable » et que la règle
ne peut pas rendre d'ex æquo. C'est faux dans un cas : deux cibles à égale distance et **dans la
même colonne**, l'une au-dessus l'autre au-dessous du tireur — situation atteignable dès qu'une
unité tire vers l'arrière. Le tri est donc (distance², colonne, rangée, indice d'insertion). Les
deux premiers critères sont ceux du brief ; les deux suivants ne servent qu'à garantir qu'aucun
ex æquo ne subsiste. T3 vérifie le critère de colonne.

### 6. Apparition différée si la case est occupée

Le brief ne dit rien du cas où la case d'apparition d'une vague est occupée — situation réelle
dès qu'une unité lente est bloquée dans la bande de déploiement. Plutôt que de lever en pleine
résolution ou d'admettre deux entités bloquantes sur une case, l'unité concernée **reste en
attente et retente à chaque tick**. L'aviation, qui ne bloque rien et n'est bloquée par rien,
apparaît toujours immédiatement.

### 7. Interprétations là où le brief ne tranche pas

- **Dégâts de franchissement** : `floor(degatsFranchissement × facteurMatrice × santé‰ / 1000)`,
  la barrière tenant le rôle du tireur. Le brief ne dit que « pondéré par la matrice » ; la
  proportionnalité aux PV restants est reprise du « partout » de `combat.js`, et la formule est
  celle des tirs, sans exception supplémentaire.
- **Saveur du site** : elle reventile le total du site (0,75 / 0,25) au lieu du partage par
  bâtiment. Le partage étant linéaire, par bâtiment ou par site donne le même résultat.
- **Niveau des cibles** pour les points de recherche : celui du site (`montage.niveau`). Les
  niveaux par entité, annoncés par `GEOGRAPHIE.compositionBase`, relèvent du lot 2B.
- **Colonne de matrice d'une cible** : châssis pour les unités (`escouade` → infanterie,
  `blinde` → véhicule, `aeronef` → 3ᵉ colonne), 3ᵉ colonne pour murs, barrières, tourelles et
  bâtiments, **véhicule pour les trois artilleries** — comme le dit le commentaire de `DEFENSES`.
  Une seule table suffit pour les deux camps : aucun aéronef ne défend, aucun défenseur ne
  rencontre de structure amie, les deux lectures de la 3ᵉ colonne ne se croisent jamais.
- **Réserve** : notion d'attaquant. Les défenseurs tirent sans compter — les deux lignes du
  tableau du §8 ne décrivent que des cibles d'attaquant.
- **Arrêt au fond de la carte** : une unité au sol et une aviation stoppeuse refusent le pas qui
  les mènerait au-delà de la rangée 18 ; seule la traversante sort.
- **Bâtiments** : bloquants et non écrasables, comme les murs.
- **`TYPES_SITE.multiplicateurButin`** n'est pas appliqué : le montage ne porte pas de type de
  site, et l'application relève du lot 2B.

### 8. Ce que le moteur n'a **pas** lu

- `GRILLE.plancherPvDefenseurPct` (1 %) : le §8 est formel, ce plancher est d'après-raid et
  appartient au lot 2B. Le moteur rapporte les PV bruts.
- Le commentaire de `GRILLE.plancherReservePct` dit encore « le plancher se lève au passage de
  ligne ». Le §8 remplace cette formulation : c'est le type de la cible qui tranche. Seule la
  **valeur** (10) est lue ; `src/data/combat.js` n'a pas été modifié.
- `DISPOSITION_DEFENSES_A_CONFIRMER` : jamais lu.
- **Aucun `.xlsx` n'a été ouvert.**

---

## Points laissés en suspens

1. **Le §4 et le §12-T5 du brief sont à mettre à jour** — voir écarts 1 et 2. Ce sont les deux
   seuls endroits où le document ne décrit plus le moteur.

2. **La garde du lot 1 a un faux positif sur le français accentué.** `test/clock.test.js`,
   test 4, scanne le texte brut de `src/sim/` avec `/\bdocument\b/` : en JavaScript, `\b` se
   calcule sur `[A-Za-z0-9_]`, donc **« documenté » déclenche la garde** — l'accent crée une
   frontière de mot. Mes commentaires ont été reformulés (« consigné ») et la garde est verte,
   mais le piège reste posé pour le prochain lot. Même remarque pour les interdits nommés en
   commentaire : la garde ne distingue pas code et commentaire, il est donc impossible d'écrire
   `Math.random` dans un commentaire de `src/sim/`. `test/clock.test.js` étant un fichier
   existant, je ne l'ai pas touché.

3. **`degatsFranchissement` vaut 20 PV *par tick*, soit 200 PV/s.** Le §7 est explicite
   (« par tick de présence ») et c'est ce qui est implémenté, mais l'effet est brutal : un Meute
   (100 PV) traversant une Ronce à pleine vie meurt en 5 ticks, une demi-seconde. Le test §7
   montre qu'avec la décroissance mutuelle il tient 7 ticks. Si l'intention était 20 PV *par
   seconde*, c'est un facteur 10 à corriger dans `src/data/combat.js` — arbitrage d'Ethan, hors
   de mon périmètre.

4. **Les points de recherche dépassent l'entier sûr aux très hauts niveaux.** Le brief demandait
   d'asserter `2^49 < Number.MAX_SAFE_INTEGER` : c'est fait (T16). Mais le **produit** complet,
   `bareme × 2^(n−1) × facteur × pvPerdus / pvMax`, dépasse 2^53 pour un Broyeur (barème 60) au
   niveau 50. C'est une propriété du barème lui-même — un doublement par niveau sur 50 niveaux —
   pas du code : à ce niveau les valeurs sont de toute façon astronomiques. À trancher au moment
   où l'arbre de recherche sera branché (lot où les points sont dépensés), pas ici.

5. **Le point d'entrée `src/index.src.html` ne charge pas le moteur de combat.** Le brief
   interdisait de modifier tout fichier existant hors `package.json` ; `dist/index.html` ne
   contient donc pas encore `combat.js`. C'est au lot 3 (rendu, interface) de le brancher.

---

## Les six contrôles du §13

| Contrôle | État |
|---|---|
| Aucun flottant dans un état sérialisé, vérifié **par parcours de l'état** | **OK** — test « §13 », parcours récursif à la création, au tick 137 et au tick 900. |
| Aucun `Math.random`, `Math.sqrt`, `Date.now` dans `src/sim/combat.js` et `src/sim/grille.js` | **OK** — scan du texte des deux fichiers dans T2, plus la garde du lot 1 (`test/clock.test.js`, test 4) qui scanne tout `src/sim/` et interdit en outre `window`, `document`, `fetch`, `new Date`, `performance.now`. |
| L'ordre du tick est celui du §6, et un commentaire le dit à l'endroit où il est appliqué | **OK** — les neuf appels de `tick()` portent chacun leur numéro d'étape en commentaire de fin de ligne. |
| Chaque seuil de test porte son calcul en commentaire | **OK** — sans exception, y compris les chaînes de décroissance mutuelle du test de franchissement. |
| `npm run check` passe : build **et** tests | **OK** — `dist/index.html` version 0.3.0 build 3, 2974 octets ; 58 tests, 58 PASS. |
| Les fichiers du lot 2A-0 n'ont pas été modifiés | **OK** — `git diff main -- CLAUDE.md src/data/combat.js src/data/sites.js` est vide. |

Et le septième, hors liste : **aucun `.xlsx` n'a été ouvert.**
