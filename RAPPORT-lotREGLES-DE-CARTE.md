# RAPPORT — lot RÈGLES-DE-CARTE

⚠⚠ **LES 24 HEURES DU NIVEAU 50 SONT ABANDONNÉES, ET C'EST LA PREMIÈRE LIGNE DE
CE RAPPORT PARCE QUE C'EST LA SEULE CHOSE QUE CE LOT RETIRE AU JEU.** Le délai
entre deux déplacements de base interpolait linéairement de **1 h au niveau 1 à
24 h au niveau 50** ; Ethan tranche le 10/09 — « Q2 b » —
`délai en minutes = 60 + niveau + (distance − 1)`. Le PIRE cas de la règle neuve
est **1 h 59** : niveau 50, dix cases, `60 + 50 + 9 = 119 minutes`. **Le plafond
est divisé par douze.** `GEOGRAPHIE.delaiEntreSautsHeures` ne passe pas à une
autre valeur : elle DISPARAÎT, et `DEPLACEMENT.delaiHeures` change de nom en même
temps que d'unité.

---

## 0. Ce qui est livré

| | |
|---|---|
| Version · build | **0.99.39 · build 141** |
| `SAVE_VERSION` | **30 → 31** |
| `npm test` | **1532 tests · 1531 pass · 0 fail · 1 skipped** (`LIMITE T8`) |
| `npm run check` | **sort en 0** |
| `npm run build` | `dist/index.html`, **9 134 922 octets**, 0 référence externe |
| Base | `main` = `14dd4ac`, **1524 déclarés · 1523 pass · 0 fail · 1 skipped**, 9 134 181 octets |

⚠ **LE NUMÉRO DE VERSION EST LE SUIVANT DISPONIBLE, ET IL N'EST PAS 140.** Le lot
3 de la série a déjà pris **0.99.38 · build 140** sur `origin/claude/lot-3-ralft2`
au moment de l'exécution ; celui-ci prend le suivant. Vérifié branche par branche
avant d'écrire le nombre, pas supposé.

### Le livrable, poste par poste

Mesuré contre le livrable rebâti sur l'arbre pristine de `main` = `14dd4ac`,
gardé sur disque pendant tout le lot.

| Poste | Avant | Après | Écart |
|---|---:|---:|---:|
| JavaScript | 399 346 | 400 087 | **+741** |
| feuille | 129 497 | 129 497 | **+0** |
| balisage | 36 205 | 36 205 | **+0** |
| images | 7 375 787 | 7 375 787 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| **total** | **9 134 181** | **9 134 922** | **+741** |

La somme des cinq postes tombe **EXACTEMENT** sur le total des deux côtés.
`data:` : **311 lignes / 306 URI** de part et d'autre — aucune ressource n'entre
ni ne sort. Borne T10 **inchangée à 9 300 000**, marge **165 078 octets, 1,78 %**
(contre 165 819 et 1,78 % avant : la marge perd 741 octets et ne change pas de
deuxième décimale).

### Fichiers touchés

**Modèle** — `src/data/sites.js`, `src/sim/deplacement.js`, `src/sim/fondation.js`,
`src/sim/points-attaque.js`, `src/sim/raid.js`, `src/sim/state.js`,
`src/sim/territoire.js`.
**Entrent** — `src/sim/prix-du-raid.js`, `src/sim/territoire-tenu.js`.
**Écran** — la LIGNE D'IMPORT de `src/ui/monde.js` et de `src/ui/raid.js`, et
rien d'autre : les deux diffs sont vérifiables à l'œil, ils déplacent
`coutDUnRaid` d'un module à l'autre.
**Tests** — seize fichiers, plus `test/temoins-bases-0.js`.
**Documentation** — `CLAUDE.md`, `package.json`, ce rapport.

⚠ **AUCUN FICHIER DE `src/render/`, `src/son/`, `src/index.src.html`, `art/` NI
`tools/` N'EST TOUCHÉ** — vérifié au diff, pas supposé. C'est ce qui explique les
quatre postes à `+0`.

### Écarts au périmètre du brief, déclarés

1. **`src/sim/fondation.js`** n'est pas dans la liste du §0 et le §3 l'exige :
   « extraire le couple `code` + `message` dans une fonction partagée […] appelée
   par les DEUX gestes ». Sans lui, le message serait écrit deux fois.
2. **`src/sim/raid.js`** suit son import de `coutDUnRaid`, comme les deux
   fichiers de `src/ui/` que le brief autorise nommément. C'est le quatrième
   appelant.
3. **Sept fichiers de `test/` hors liste** ont dû suivre : `test/euclide.test.js`
   (l'unique écriture de la géométrie et `EUCLIDE T6 bis`), `test/bases.test.js`
   (`BASES-1 T2` et la dix-huitième couche du témoin), `test/monde.test.js`
   (`DÉ T10` et `PC T1`, dont les montages n'avaient plus de destination),
   `test/paquets.test.js`, `test/raid-ouvrage.test.js`,
   `test/journal-raids.test.js`, `test/batiments-quatre-etats.test.js` et
   `test/raid-ecran.test.js` (le numéro de `SAVE_VERSION` et l'import), plus
   `test/pictogramme.test.js` (`PIC T7`, collision annoncée par le §6).

---

## 1. Point 8 — le prix d'un raid lit la CARTE

### Le défaut, et pourquoi il n'était pas dans le barème

Ethan, 10/09, capture à l'appui : « une base ouvrage à côté de ma base est à 12
points alors qu'elle est en territoire ouvrage […] il doit y avoir un truc lié au
fait qu'une base reste toujours dans son territoire, alors que le calcul est basé
sur la force des territoires en ignorant les exceptions. »

Il y avait **deux définitions de « à qui est cette case »** :

- `estEnTerritoireAllie(cible, bases)` — « la case est-elle dans l'OCTOGONE de
  rayon 2 d'une de mes bases ? », pure géométrie ;
- `campDeLaCase(etat, r, c)` — « à qui la carte la donne-t-elle ? », somme des
  forces `raison ^ (niveau − distance)` par camp, **avec le PLANCHER d'Ethan** :
  le territoire où une base se trouve ne change pas.

Avant TERRITOIRE-FORCE les deux étaient la même question. Depuis, elles
divergent, et **l'exception qu'Ethan nomme EST le plancher** : une base de
l'Ouvrage garde sa propre case même quand le joueur y est plus fort. L'octogone
ne pouvait pas le voir, donc il facturait le tarif de chez soi.

### La mesure, faite avant d'écrire une ligne

20 graines × 5 rangées (250, 200, 150, 100, 50) — **5 508 cibles**, l'ancienne
règle recopiée à l'identique à côté de la neuve :

```
cibles 5508, désaccords 353 (6,41 %)
écarts : 0 ×5155 · +2 ×132 · +4 ×221
prix moyen 27,905 → 28,114 ; médiane 28 → 28
  rangée 250 : 71/1105 = 6,43 %
  rangée 200 : 71/1113 = 6,38 %
  rangée 150 : 69/1110 = 6,22 %
  rangée 100 : 70/1075 = 6,51 %
  rangée  50 : 72/1105 = 6,52 %
```

⚠⚠ **TOUS LES DÉSACCORDS VONT DANS LE MÊME SENS : LE PRIX MONTE, JAMAIS
L'INVERSE.** Et l'écart vaut **+2 ou +4 points, jamais plus** — les cases
concernées sont dans l'octogone de rayon 2, donc à une ou deux cases. Le prix
moyen bouge de **0,21 point**, la médiane pas du tout. **Aucun barème n'a été
touché** : `POINTS_ATTAQUE.coutRaid` est intact au caractère près, c'est la
QUESTION posée qui change.

### `src/sim/prix-du-raid.js` entre, et c'est un cycle qui l'a exigé

`territoire.js` importe `distanceOctogonaleDInfluence` de `points-attaque.js`.
Faire lire `campDeLaCase` à `points-attaque.js` aurait refermé **le premier cycle
d'imports de `src/sim/`**. Précédents exacts : `base-courante.js` au lot BASES-0,
`saveur.js` au lot RETOUCHES.

⚠ **`coutDuRaid(distance, enTerritoireAllie)` NE BOUGE PAS D'UN CARACTÈRE ET
RESTE PURE.** C'est `coutDUnRaid` — celle qui interroge l'état — qui déménage.
Ses quatre appelants suivent leur import : `sim/raid.js`, `ui/monde.js`,
`ui/raid.js`, et les tests.

### `estEnTerritoireAllie` est RETIRÉE, pas gardée sans lecteur

Le brief demandait de la chercher au `grep` puis de trancher : « ne pas la
laisser sans lecteur et sans phrase ». Mesuré — son seul lecteur de production
était **la ligne même que ce lot change**. Elle est retirée, et pas seulement
parce qu'elle n'a plus d'appelant : **son nom était devenu faux.** « En
territoire allié » désigne désormais ce que la carte peint ; garder une fonction
qui répond autre chose sous ce nom-là remettrait au dépôt les deux vérités qu'on
vient de réduire à une.

Ses deux assertions se réancrent sur **`dansLOctogoneDInfluence`**, qui reste et
qui dit la GÉOMÉTRIE — la grandeur dont le territoire, lui, a toujours besoin.

### Le paragraphe périmé de `territoire.js` est réécrit

Il déclarait la divergence close : « il n'y a plus qu'une écriture de la forme,
donc plus d'accord à tenir ». C'est vrai de la **FORME** de l'octogone et faux du
**PARTAGE**, et c'est très exactement l'écart qu'Ethan a vu. Il dit maintenant
laquelle des deux moitiés était vraie, laquelle ne l'était pas, et où le prix va
chercher sa réponse. **Un commentaire qui déclare close une divergence ouverte
est pire que pas de commentaire** — le brief le dit, et c'est ce qui a fait
perdre trois jours à ce défaut-ci.

---

## 2. Point 15 — le délai de déplacement dépend de la distance

### Le barème

`GEOGRAPHIE.delaiEntreSautsHeures: { depart: 1, niveau50: 24 }` **disparaît** et
laisse la place à :

```js
delaiDeplacementMinutes: { base: 60, parNiveau: 1, parCaseAuDela: 1 },
```

`DEPLACEMENT.delaiHeures` la référençait ; il devient `DEPLACEMENT.delaiMinutes`
— **il change de nom en même temps que d'unité**, sans quoi un appelant oublié
lirait des minutes en croyant lire des heures, et `node --check` ne dirait rien.

### En dixièmes de minute, et le calcul reste entier

`niveauDesBatiments` rend **86** pour une base de niveau 8,6. Le lire comme un
entier ferait 86 minutes au lieu de 8,6 — **le piège que ce dépôt a déjà payé
deux fois** (`niveauDeLArmee` au lot RÉSERVE, et ce module-ci le documentait
déjà). Tout se calcule donc en **dixièmes de minute** :

```
600 + dixièmes + 10 × (distance − 1)
```

et ne se convertit en ticks **qu'une fois**, à la fin.

### La table de contrôle, MESURÉE

Les cinq lignes du brief, rejouées par `RC T4` — pas recopiées :

| Niveau | Distance | Dixièmes de minute | Lecture | Ticks |
|---:|---:|---:|---|---:|
| 1 | 1 | **610** | 1 h 01 | 36 600 |
| 5 | 4 | **680** | 1 h 08 | 40 800 |
| **8,6** | 1 | **686** | 1 h 08,6 | 41 160 |
| 20 | 1 | **800** | 1 h 20 | 48 000 |
| 50 | 10 | **1190** | 1 h 59 | 71 400 |

⚠ **LA LIGNE « 5 / 4 » REND 1 h 08 LÀ OÙ ETHAN ÉCRIT « 1h04 »**, et c'est SA
propre règle qui le dit : `60 + 5 + 3`. On mesure la formule qu'il a choisie en
connaissance des trois candidates ; on ne bricole pas la formule pour tomber sur
son exemple. **À signaler s'il voulait dire autre chose.**

⚠ **LA LIGNE 8,6 EST CELLE QUI COMPTE** : c'est la seule qui attrape un niveau lu
en entiers, et la falsification qui arrondit le niveau ne fait tomber qu'elle et
`DÉPLACEMENT T7`.

### La distance est EUCLIDIENNE arrondie au supérieur, pas Tchebychev

`casesEnLigneDroite(distanceCarreeCases(…))`, la même mesure que le refus
`trop-loin` — sans quoi une case au bord du disque coûterait un tarif que le
refus ne reconnaîtrait pas.

⚠⚠ **ET LA FALSIFICATION QUI PREND TCHEBYCHEV N'A PAS MORDU AU PREMIER RELEVÉ.**
La diagonale est le SEUL endroit où les deux divergent — un saut de (7, 7) fait
**sept** cases de Tchebychev et **dix** en ligne droite — et aucun montage du
dépôt ne sautait en diagonale. C'est cette mesure qui a fait écrire la dernière
moitié de `RC T5`, et la falsification mord maintenant.

### `SAVE_VERSION` passe à 31, et le bump est obligatoire

`ticksAvantProchainDeplacement` ne peut plus recalculer le délai : elle ne sait
pas de combien la base a sauté. La base porte donc
**`dernierDeplacementDelaiTicks`**, la durée **CONTRACTÉE au saut**, figée, écrite
par `deplacerLaBase` **avant** que `poserLaBaseSur` ne déplace la base — sinon la
distance mesurée vaudrait zéro.

⚠⚠ **CONSÉQUENCE MESURÉE ET VOULUE : améliorer sa base ne rallonge plus l'attente
en cours.** Un recalcul à la lecture la faisait grandir sous les yeux du joueur,
qui se serait retrouvé plus bloqué qu'au moment où il a sauté — pour avoir
amélioré ses bâtiments. `RC T5` monte la base de vingt niveaux et l'exige.

⚠ **LA SAUVEGARDE GRANDIT DE 36 OCTETS EXACTEMENT**, sur les vingt-cinq graines du
témoin : `,"dernierDeplacementDelaiTicks":null`. Le nombre est FIXE, et c'est ce
qu'on lui demande.

### La migration 30 → 31 contracte la durée la plus COURTE

Une v30 porte l'INSTANT du dernier saut et **jamais son amplitude**. Trois
lectures étaient possibles — la plus longue (distance 10), une moyenne, la plus
courte (distance 1) — et c'est la **distance 1** qui est prise :

⚠⚠ **UNE MIGRATION NE DOIT JAMAIS ENFERMER UN JOUEUR DERRIÈRE UNE ATTENTE QU'IL
N'A PAS CONTRACTÉE.** Elle peut le libérer plus tôt, elle ne peut pas le retenir
plus longtemps. `RC T6` le mesure sur l'ATTENTE, pas seulement sur le champ, et
exige `attenteApres <= attenteAvant`.

⚠ **ET UNE BASE QUI N'A JAMAIS SAUTÉ REÇOIT `null`, JAMAIS ZÉRO.** Zéro se lirait
« une durée contractée qui vaut zéro tick » — vrai par accident aujourd'hui, faux
le jour où le plancher bougerait. `null` dit « aucun saut », ce qui est le fait.

⚠ **LA MIGRATION APPELLE `delaiPourLaBase(base, 1)`, PAS UNE COPIE DE LA
FORMULE.** D'où l'extraction : la fonction prend **une base** et non un état,
parce qu'une migration travaille sur une SAUVEGARDE et n'a pas de `baseCourante`.
C'est le motif de `problemesDeLEffectif`, qui prend une liste. Une recopie aurait
mis deux écritures du barème au dépôt, et la seconde se serait tue au premier
réglage d'Ethan.

⚠ **`state.js` IMPORTE DÉSORMAIS `deplacement.js`, ET L'ARÊTE EXISTAIT DÉJÀ** —
transitivement, par `raid-ouvrage.js`. Vérifié avant d'écrire : aucun cycle neuf.

---

## 3. Point 16 — on ne déplace pas sa base en territoire de l'Ouvrage

### Une seule écriture, deux gestes

Ethan : « Je ne dois pas pouvoir poser ma base dans [le] territoire ouvrage ». La
règle existait à la **FONDATION** et manquait au **DÉPLACEMENT** : on fondait
loin, puis on sautait dans le violet au geste suivant. Le contournement tenait à
un toucher — c'est exactement la faute que le lot VOISINAGE avait fermée pour
l'encombrement, vue une seconde fois.

`src/sim/territoire-tenu.js` entre, **sur le modèle EXACT de
`voisinage-des-bases.js`** : elle rend une liste de problèmes, elle LÈVE sur une
case malformée, et `problemesDeLaFondation` comme `problemesDuDeplacement`
l'appellent. Le message est celui de la fondation, **mot pour mot** — « Cette
case est tenue par l'Ouvrage. »

⚠ **LE REFUS EST POSÉ APRÈS LE VOISINAGE ET AVANT LE DÉLAI**, comme le brief le
demande.

### L'ordre est gardé, et il a fallu le mesurer sur une partie ordinaire

⚠⚠ **LA FALSIFICATION QUI DÉPLACE LE REFUS N'A PAS MORDU AU PREMIER RELEVÉ.** Le
montage dégagé de `deplacement.test.js` ne porte AUCUNE case qui cumule deux
refus — par construction, puisqu'il rase précisément ce qui les produit. Mesuré
sur une partie **ORDINAIRE**, graine 2026 rangée 200 : **432 cases portent
`voisinage` ET `territoire-ennemi` à la fois**. `RC T7` s'y ancre désormais, avec
le délai armé pour porter les trois codes, et les deux falsifications d'ordre —
avant le voisinage, après le délai — font tomber le test.

### Ce que la règle coûte, mesuré et non deviné

Destinations médianes, 20 graines par rangée, sans la règle → avec :

| Rangée | Avant | Après | Graines à zéro |
|---:|---:|---:|---:|
| 295 (départ) | 261 | **261** | 0/20 |
| 290 | 307 | 270 | 0/20 |
| 285 | 218 | 173 | 0/20 |
| 280 | 124 | 83 | 0/20 |
| 275 | 44 | **14** | 0/20 |
| 250 | 6 | **0** | **20/20** |
| 200 | 6 | **0** | **20/20** |
| 150 | 6 | **0** | **20/20** |
| 100 | 6 | **0** | **20/20** |
| 50 | 6 | **0** | **20/20** |

Situations sans **AUCUNE** destination : **2/200 (1,0 %) → 100/200 (50,0 %)**.

⚠ **LE DÉPART N'EST PAS TOUCHÉ D'UNE CASE** — 261 avant, 261 après. La garde du
peuplement écarte l'Ouvrage de quinze cases, donc la règle n'y retire rien.

⚠⚠ **ET MÊME UNE BASE DE NIVEAU 50 N'A AUCUNE DESTINATION À LA RANGÉE 250 :
MESURÉ, CHAQUE CASE DU DISQUE Y PORTE DÉJÀ `voisinage`.** Le refus de territoire
ne retire donc **rien de plus** dans le haut de la carte : ce que la table
ci-dessus montre à partir de la rangée 250, c'est l'encombrement du lot
VOISINAGE, pas la règle neuve. Elle mord **entre les rangées 275 et 290**,
exactement là où le joueur peut encore bouger.

### La porte de sortie tient, 15 fois sur 15, et elle coûte plus cher

Raser une base de l'Ouvrage voisine la met dans `casesRasees` : elle cesse de
peindre, et le disque se rouvre. Vérifié aux rangées 250, 200 et 150, cinq
graines chacune : **15/15**.

⚠⚠ **MAIS IL FAUT 4 À 10 RASAGES LÀ OÙ IL EN FALLAIT UN AU LOT VOISINAGE.** La
règle porte sur l'**INFLUENCE**, qui va à trois cases, et non sur le 3 × 3 : une
base rasée libère une couronne bien plus large qu'un simple encombrement, donc il
faut en raser plusieurs pour dégager un point de chute. **Ethan tranche** s'il
juge la porte trop chère ; le levier serait `GEOGRAPHIE.rayonInfluenceEnnemie`,
qui est du calibrage et hors du périmètre de ce lot.

### `casesAtteignables` suit PAR CONSTRUCTION

Elle **INTERROGE** `problemesDuDeplacement` au lieu de réécrire ses règles : la
falsification que le brief annonçait comme « le défaut le plus probable du §3 »
ne peut donc pas se commettre par inattention. **`VM T8` n'est pas touchée d'un
caractère.** Elle a été falsifiée quand même — en faisant filtrer le code neuf par
`casesAtteignables` —, et elle fait tomber quatre tests, dont `VM T8` lui-même.

---

## 4. Les tests

### Ce qui entre — huit tests, de 1 524 à 1 532

| Test | Fichier | Ce qu'il mesure |
|---|---|---|
| `RC T1` | `territoire.test.js` | le prix suit `campDeLaCase`, case par case, sur deux rangées × 5 graines |
| `RC T2` | `territoire.test.js` | la capture d'Ethan : base de niveau 8,6 à deux cases d'une base faible → **16 points, pas 12** |
| `RC T3` | `points-attaque.test.js` | `prix-du-raid.js` se charge seul, et aucun cycle ne se referme |
| `RC T4` | `deplacement.test.js` | la table de contrôle du barème, ligne par ligne |
| `RC T5` | `deplacement.test.js` | la durée est FIGÉE au saut ; et la distance est euclidienne, pas Tchebychev |
| `RC T6` | `state.test.js` | la migration 30 → 31 contracte la durée la plus courte |
| `RC T7` | `deplacement.test.js` | le refus de territoire, l'ordre des trois codes, et `casesAtteignables` |
| — | `points-attaque.test.js` | « le prix se paie sur la CARTE, plus sur l'octogone » |

⚠⚠ **`RC T1` ET `RC T2` ONT ÉTÉ VUS ROUGES SUR L'ARBRE INTACT, ET POUR LA BONNE
RAISON.** Rejoués dans un `git worktree` sur `main` = `14dd4ac`, avec l'ancien
corps de `coutDUnRaid` recopié à l'identique dans le module neuf pour que le
fichier puisse seulement se charger :

```
not ok 23 - RC T1 — le prix d'un raid lit la même case que la carte
    graine 3, case (283, 15) : le prix ne suit pas la carte
    12 !== 16
not ok 24 - RC T2 — le PLANCHER est facturé : une base ennemie chez soi se paie cher
    16 points
    12 !== 16
# tests 24 · # pass 22 · # fail 2
```

**Le message des deux est `12 !== 16` — le nombre exact de la capture d'Ethan.**

⚠ **UNE PREMIÈRE TENTATIVE DE CE RELEVÉ A ÉTÉ JETÉE, ET IL FAUT LE DIRE.** Elle
faisait lever `estEnTerritoireAllie` sur sa garde de signature : les deux tests
tombaient bien, mais sur un `RangeError` de montage et non sur l'assertion. **Un
rouge qui ne vient pas de la propriété mesurée ne prouve rien.**

### Aucune assertion retirée, aucune assouplie

**Trois gardes sont RETOURNÉES :**

1. `EUCLIDE — les zones d'influence sont un OCTOGONE, et une seule écriture` :
   elle exigeait que `points-attaque.js` porte la distance de Tchebychev du prix.
   Cette ligne a déménagé ; elle exige désormais que **`prix-du-raid.js` ne nomme
   ni `dansLOctogoneDInfluence` ni `distanceOctogonaleDInfluence`**, qu'il nomme
   `campDeLaCase(`, et que le barème ne nomme plus `estEnTerritoireAllie`. Elle
   est plus forte qu'avant : elle garde le sens de la dépendance.
2. `EUCLIDE T6 bis` : réancré sur `campDeLaCase`.
3. `BASES-1 T2` : il prédisait le prix depuis l'octogone ; il le prédit depuis
   `campDeLaCase`, **et falsifie l'ancienne lecture de face**, cible par cible,
   avec une garde `desaccords > 0` qui refuse un montage où les deux
   coïncideraient.

**`VM T4` gagne la moitié qui manquait** : la couronne 2 porte désormais
`territoire-ennemi`, et la moitié discriminante s'ancre sur le CODE du voisinage
plutôt que sur la liste vide — la base survivante tient son octogone de rayon 3.

**`PIC T7` est remesuré**, comme le §6 du brief l'annonçait : 9 134 181 → 9 134 922,
marge 165 819 → 165 078, toujours 1,78 %.

### Les montages qui ont dû suivre

⚠⚠ **`partieDegagee` DE `deplacement.test.js` S'ÉLARGIT POUR LA TROISIÈME FOIS,
ET TOUJOURS PAR UNE SOMME DE PORTÉES NOMMÉES.** Son rayon de rasage devient
`porteeMaxCases + rayonCases + rayonInfluenceEnnemie` : une base restée à onze
cases peindrait encore la couronne du disque, et les sept tests qui parlent de
PORTÉE, de TERRAIN, de POI, d'ANNEAUX, de DÉLAI et de MIGRATION mesureraient à
nouveau la densité au lieu du geste.

⚠⚠ **ET `RC T7` REPREND LE RAYON D'HIER, CE QUI EST TOUT SON INTÉRÊT.** Le rayon
par défaut rend la règle **inatteignable** — c'est son objet. Le montage qui la
MESURE est celui d'avant le lot : à onze cases, une base de l'Ouvrage survit
juste au-delà du disque, son octogone peint la couronne, et son 3 × 3 n'encombre
aucune des cases qu'elle tient. **Mesuré : 23 cases refusées pour cette seule
raison, et 293 destinations au lieu des 316 du disque — l'écart EST le compte des
cases violettes**, ce que le test exige par une égalité.

⚠ **`test/monde.test.js` A GAGNÉ `ouvrirUneDestination`** : `DÉ T10` et `PC T1`
n'avaient plus une seule destination à la rangée 200. Le helper rase les bases de
l'Ouvrage les plus proches jusqu'à ce qu'une case s'ouvre, et `PC T1` **exige
qu'UN SEUL rasage suffise** — mesuré — plutôt que de raser jusqu'à ce que ça
passe.

---

## 5. Les falsifications — quatorze, treize chutes, une déclarée

| # | Falsification | Verdict |
|---|---|---|
| F1 | le prix relit l'octogone au lieu de la carte | 5 chutes — `EUCLIDE`, `RC T1`, `RC T2`, `RC T3`, le test de `points-attaque` |
| F2 | le camp est comparé à `!== JOUEUR` | 5 chutes, dont `paiement` de `raid.test.js` |
| F3 | le niveau est lu en ENTIERS | 2 chutes — `DÉPLACEMENT T7`, `RC T4` |
| F4 | l'attente est RECALCULÉE au lieu d'être lue figée | 3 chutes — `T8`, `T9`, `RC T5` |
| F5 | la migration contracte le PIRE cas (distance 10) | 1 chute — `RC T6` |
| F6 | le refus de territoire retiré du déplacement | 3 chutes — `RC T7`, `PC T1`, `VM T4` |
| F7 | le message réécrit au lieu d'être partagé | 1 chute — `RC T7` |
| F8 | le refus posé AVANT le voisinage | 1 chute — `RC T7` ⚠ **reprise** |
| F9 | le refus posé APRÈS le délai | 1 chute — `RC T7` |
| F10 | `casesAtteignables` cesse de suivre le refus | 4 chutes, dont `VM T8` |
| F11 | la distance du saut prise en Tchebychev | 1 chute — `RC T5` ⚠ **reprise** |
| F12 | la durée mesurée APRÈS le saut | 2 chutes — `T8`, `RC T5` |
| F13 | le niveau n'est plus borné `[10, 500]` | **0 chute — déclarée** |
| F14 | le barème perd son terme de distance | 5 chutes |

⚠⚠ **DEUX ONT DÛ ÊTRE REPRISES APRÈS MESURE, ET CHACUNE A FAIT ÉCRIRE UNE MOITIÉ
DE TEST.** F8 ne mordait pas — aucune case du montage dégagé ne cumule deux
refus — et F11 non plus — aucun montage ne sautait en diagonale. **Une
falsification qui ne mord pas se vérifie avant d'être crue** ; les deux mordent
désormais.

⚠ **F13 SE DÉCLARE PLUTÔT QUE DE SE COMPTER.** Le bornage du niveau à `[10, 500]`
dixièmes est **INERTE aujourd'hui** : `ameliorer` plafonne déjà à
`NIVEAU.plafond` et `verifierEtat` refuse au chargement une disposition qui en
sortirait. Il est écrit quand même, et le module dit pourquoi : un barème qui
rendrait une durée négative **ne lèverait pas**, il déverrouillerait le
déplacement. « Un test qui ne peut tomber sur aucun état d'aujourd'hui se
déclare, il ne se compte pas. »

---

## 6. Les invariants

### Le rattrapage — rejoué AVANT et APRÈS, comme le §0 l'exige

`tickJeu` × 2 592 000 contre `rattraperJeu(2 592 000)`, **5 graines, 72 heures**,
sérialisations comparées à l'octet :

| | Avant (`14dd4ac`) | Après |
|---|---|---|
| Divergences | **0 / 5** | **0 / 5** |
| Taille sérialisée | 1 368 octets | 1 404 octets |

⚠ **ET LES 36 OCTETS D'ÉCART SONT EXACTEMENT LE CHAMP QUI ENTRE** — le même
nombre que le témoin de BASES-0 mesure sur ses vingt-cinq graines.

### Les témoins de combat NE BOUGENT PAS

⚠⚠ **`test/temoins-combat.js` N'A PAS UNE LIGNE DE CHANGÉE**, vérifié au
`git diff`. Le brief posait un point d'arrêt : « si les témoins de combat
bougent, s'arrêter et le dire ». Ils ne bougent pas, et la raison est mécanique —
le lot ne touche ni le moteur de combat, ni le placement, ni une composition de
garnison : il change **un prix, un délai et un refus**. `test/temoins-couts.js`
est intact lui aussi.

### Le témoin de BASES-0 gagne une dix-huitième couche

`DEPLACES_PAR_REGLES_DE_CARTE` — **sept couples sur 350** : `attaque` et
`rapports` aux phases 11, 12 et 13, `rapports` seul à la phase 14. **Les dix
premières phases sont identiques AU BIT.**

⚠⚠ **ET L'ATTRIBUTION EST PARFAITE, MESURÉE RAID PAR RAID.** Le raid **LOINTAIN**
bouge sur **25 graines sur 25** ; le raid de **PROXIMITÉ** sur **0 sur 25**. Le
premier vise la rangée 201, en plein territoire de l'Ouvrage — il renchérit ; le
second vise un camp du joueur, que la carte peint au joueur **des deux côtés de
la règle**, donc son prix ne peut pas bouger. C'est cette moitié-là qui dit que
le lot ne touche qu'au prix.

⚠ **`OCTETS_AJOUTES_PAR_REGLES_DE_CARTE = 36`** s'AJOUTE aux termes précédents au
lieu de les remplacer, pour que chaque lot dise ce qu'il a coûté.

---

## 7. Ce qui n'est pas dans le lot, et se déclare

- **Le barème lui-même** — `POINTS_ATTAQUE.coutRaid` : 10 fixes, +1 par case chez
  soi, +3 ailleurs. Intact au caractère.
- **La forme du territoire et `GEOGRAPHIE.rayonInfluence*`** : intacts. C'est
  pourtant le levier de la porte de sortie du §3, et c'est du calibrage.
- **Les seuils de `RAID_OUVRAGE`** : intacts. La bande immunisée de vingt-huit
  rangées, relevée au lot VOISINAGE, reste ouverte.
- **`LIMITE T8`** : toujours `skip`, non réparé, corps intact.
- **`src/ui/` hors les deux lignes d'import**, `src/render/`, `src/son/`,
  `src/index.src.html`, `art/`, `tools/` : pas une ligne.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne. Son dernier verdict connu reste
celui du lot SOL-OUVRAGE.

⚠ **LE RENDU N'A PAS ÉTÉ VU, NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE DÉCLARE
NON EXÉCUTÉ.** Le lot ne change aucun pixel : il change un prix, un délai et un
refus dans le modèle. Les deux écrans touchés le sont sur leur ligne d'import.

---

## 8. Ce qui reste ouvert, pour Ethan

1. ⚠⚠ **LE PLAFOND DE DÉPLACEMENT TOMBE DE 24 h À 1 h 59.** C'est sa règle prise
   à la lettre ; si les deux heures lui paraissent trop courtes en fin de partie,
   le levier est `parNiveau` ou `parCaseAuDela`, une valeur chacun.
2. ⚠ **LA LIGNE « niveau 5, distance 4 » REND 1 h 08 ET SON EXEMPLE DISAIT
   1 h 04.** Sa formule (b) donne 1 h 08. À trancher.
3. ⚠⚠ **LA PORTE DE SORTIE DU §3 COÛTE 4 À 10 RASAGES**, contre un seul au lot
   VOISINAGE. Passé la rangée 275, le joueur ne bouge plus sa base sans se battre.
4. ⚠ **LE PRIX MOYEN D'UN RAID MONTE DE 0,21 POINT**, et rien n'a été compensé.
