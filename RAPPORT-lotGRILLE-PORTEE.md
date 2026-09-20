# RAPPORT — lot GRILLE-PORTÉE

Exécuté le **20/09/2026** sur `main` = `ce3ea49` (merge du lot AVARIES, #165),
branche `claude/lot-grille-portee`. Brief : `BRIEF-lotGRILLE-PORTEE.md`.

**En une phrase :** ce qui lit `GRILLE` accepte désormais une grille en
argument, `GRILLE` en défaut ; sans argument, tout rend exactement ce que cela
rendait — les **200 témoins de combat sont identiques au bit**, et le témoin de
BASES-0 aussi. Aucune seconde grille n'entre, aucun type de site ne reçoit de
champ `grille`, aucun art n'est touché, `SAVE_VERSION` reste à 39.

Version et build produits : **0.99.73 · build 185** (chaînes, vérifié au type),
depuis 0.99.72 · 184.

---

## 1. La base relevée par exécution, avant travail

| grandeur | relevé |
|---|---|
| `package.json` | 0.99.72 · build 184 |
| `npm test` tel quel | **1660 déclarés · 1658 pass · 1 fail · 1 skipped** |
| le rouge | `entrées — tout fichier d'art/sources/ est CLASSÉ, consommé ou dormant` |
| `npm test` après déplacement des trois PNG | **1660 · 1659 · 0 · 1**, `npm run check` en 0 |
| `dist/index.html` | **9 375 557 octets**, 313 lignes / 312 URI `data:` |
| `SAVE_VERSION` | **39** |
| `test/` | 80 fichiers `*.test.js` |
| Node | v22.23.2 (portable, `outils/node22`) |

⚠ **Le rouge de départ n'est pas le dépôt, c'est l'environnement.** Les trois
fonds longs livrés par Ethan le 20/09 — `base_fond_ouvrage_verrou_a.png`,
`_verrou_b.png`, `_finale.png`, 1080 × 3240, **non commités** — étaient posés
dans `art/sources/`, où la garde de classement les compte non classés. Le brief
interdit de les déclarer comme de les conditionner (§9). Ils ont été **déplacés
dans `art/sourcesstandby/`**, le dossier d'attente que le dépôt prévoit pour ce
cas, sans qu'un octet ne bouge — SHA-256 :

```
d29e003a9595b0aa5175b647b7556c4e0945be6b01813ad868bac19f34443600  base_fond_ouvrage_verrou_a.png  (5 596 234 o)
7f5f91437bf815df3c3f0602d1db17438353773801e147e9540bb26b084a2ab9  base_fond_ouvrage_verrou_b.png  (5 447 648 o)
2d3a62fa6e7db7222320716369f78cb81b59dcfa8a4c01af835bef367b00a906  base_fond_ouvrage_finale.png    (5 523 941 o)
```

Ils restent non suivis par git, à Ethan de les remettre où il veut. ⚠ Le
message qui portait le brief montrait **quatre** images ; trois fichiers sont
au disque. La quatrième n'a pas été cherchée — elle n'est pas dans ce lot.

---

## 2. Les deux sondes du §2, rejouées

### Avant le lot, sur `main` — sorties recopiées

```
=== §2.1 (import après mutation) ===
tiersDeLaDefense LÈVE : générateur : les tiers couvrent 8 rangées, la bande en fait 16
genererSite(base,50) LÈVE : générateur : les tiers couvrent 8 rangées, la bande en fait 16
tiers -> {"avant":"{3,8}","milieu":"{9,12}","arriere":"{13,18}"}
genererSite OK — 39 bât (rangées 19-27), 39 déf (rangées 3-18)

=== §2.2 (import statique) ===
DERNIERE_RANGEE (figée à l'import) = 18
RANGEE_DEFENSE_FRANCHIE            = 11
genererSite OK — 39 bât (rangées 19-27), 39 déf (rangées 3-18)
creerCombat LÈVE : combat : bâtiment « souche » en (26, 6) est hors de la grille (rangées 1–18, colonnes 1–9)
```

Les deux reproduisent le brief mot pour mot : le premier mur est la table des
tiers à huit, qui se dérive ; le second — **le vrai** — est la constante figée à
l'import, qui laisse `creerCombat` refuser un site que `genererSite` vient de
produire.

### Après le lot — la même sonde §2.2, verbatim (elle MUTE `GRILLE`, ce que le lot interdit)

```
DERNIERE_RANGEE (figée à l'import) = 18
RANGEE_DEFENSE_FRANCHIE            = 11
genererSite OK — 39 bât (rangées 19-27), 39 déf (rangées 3-18)
creerCombat OK
```

Les deux constantes sont toujours figées — elles restent, documentaires — et
**plus rien de production ne les lit** : `creerCombat` passe. Mais ce n'est pas
la voie du lot, donc la sonde a été réécrite dans la voie du lot :

### Après le lot — GRILLE intacte, une seconde grille en argument (import statique)

```
DERNIERE_RANGEE (constante, grille par défaut) = 18
derniereRangee(grilleLongue)                    = 27
RANGEE_DEFENSE_FRANCHIE (constante)             = 11
rangeeDefenseFranchie(grilleLongue)             = 19
estDansLaGrille(27, 9)            = false / avec grilleLongue = true
bornesBande(batiments)            = {"premiere":11,"derniere":18} / longue = {"premiere":19,"derniere":27}
tiersDeLaDefense(longue) LÈVE : générateur : les tiers couvrent 8 rangées, la bande en fait 16
creerCombat(long SANS grille) LÈVE : combat : bâtiment « souche » en (26, 3) est hors de la grille (rangées 1–18, colonnes 1–9)
creerCombat(long AVEC grille) OK — etat.grille === grilleLongue : true
  bâtiments en rangées 20–27, 93 entités
  résolu : cause « attaquants » au tick 179
  serialiserEtat porte "grille" : true
etat par défaut : "grille" in etat = false / serialiserEtat porte "grille" : false
projection longue : lignes 27.5 tailleCase 108 yDeRangee(27) === margeY : true caseDepuisPixels(rangée 27) = {"rangee":27,"colonne":1}
casesDeLaBande(null)            = 18 / longue = 27
ligneEcranDeLaRangee(1)         = 18 / longue = 27
bandesDe() === BANDES           = true / bandesDe(longue).batiments = {"cle":"batiments","nom":"Chantier","premiere":19,"derniere":27}
GRILLE intacte après tout ça    = true
```

Un combat de 27 rangées se monte, se résout (`attaquants`, tick 179) et se
sérialise, **sans qu'une ligne de `GRILLE` ait bougé**. `tiersDeLaDefense`
lève sur seize rangées : c'est la table `[3, 2, 3]`, qui reste — l'arbitrage
de la table à seize est le lot GRILLE LONGUE.

---

## 3. Les signatures modifiées, toutes, avec leur défaut

### `src/sim/grille.js` — les sept du §4.1, plus trois entrées

| export | avant | après |
|---|---|---|
| `estDansLaGrille` | `(rangee, colonne)` | `(rangee, colonne, grille = GRILLE)` |
| `estDansLaBande` | `(rangee, nomBande)` | `(rangee, nomBande, grille = GRILLE)` |
| `bornesBande` | `(nomBande)` | `(nomBande, grille = GRILLE)` |
| `estSortiParLeHaut` | `(rangeeMilli)` | `(rangeeMilli, grille = GRILLE)` |
| `estSortiParLeCote` | `(colonneMilli)` | `(colonneMilli, grille = GRILLE)` |
| `DERNIERE_RANGEE`, `DERNIERE_COLONNE` | constantes | **gardées**, voir §4 |
| `derniereRangee` | — | **entre**, `(grille = GRILLE)` |
| `derniereColonne` | — | **entre**, `(grille = GRILLE)` |
| `verifierGrille` | — | **entre**, `(grille, contexte = 'grille')` — objet, entiers ≥ 1, trois bandes contiguës depuis la rangée 1 jusqu'à `longueur`, `casesBatiments` égal à la bande des bâtiments × largeur ; rend la grille |

⚠ `verifierGrille` itère sur `Object.keys(GRILLE.bandes)` — la grille par défaut
est la RÉFÉRENCE des bandes. Le premier jet nommait les trois clés en dur et
**`RAID-E T5` est tombé** : « les trois bandes sont nommées ailleurs qu'une
fois ». Corrigé en lisant la référence au lieu de la recopier.

Les vingt autres exports n'ont pas bougé (`grep -c "^export" src/sim/grille.js`
rend **30** : 27 + 3 entrées).

### `src/sim/combat.js`

| fonction | avant | après |
|---|---|---|
| `RANGEE_DEFENSE_FRANCHIE` | constante | **gardée**, documentaire ; `test/formation-et-garnison.test.js` la lit |
| `rangeeDefenseFranchie` | — | **entre**, exporté, `(grille = GRILLE)` |
| `grilleDuCombat` | — | **entre**, privé, `(etat) → etat.grille ?? GRILLE` |
| `posePermise` | `(camp, rangee, colonne)` | `(camp, rangee, colonne, grille)` — **sans défaut** : ses deux appelants l'ont |
| `bornesDePose` | `(camp)` | `(camp, grille)` — sans défaut |
| `caseAccueille` | `(occupation, obstacles, p, rangee, colonne)` | `(…, colonne, grille)` — sans défaut |
| `creerCombat` | `(montage)` | `(montage)`, **`montage.grille` optionnel** : passé par `verifierGrille(…, 'combat : montage.grille')`, puis `if (montage.grille !== undefined) etat.grille = grille;` — posé AVANT le premier `ajouterEntite` |
| `ajouterEntite`, `peutAvancer`, `seDecaler`, `avancer`, `debarquements` | — | signatures inchangées, lisent `grilleDuCombat(etat)` |

Les six lectures des constantes du §4.1 (L. 660, 674, 1039, 1060, 3114, 3827
sur `main`) passent toutes par `derniereRangee` / `derniereColonne` de la
grille du combat ; les quatre messages de refus nomment les bornes de cette
grille-là.

### `src/sim/generateur.js`

| fonction | avant | après |
|---|---|---|
| `tiersDeLaDefense` | `()` | `(grille = GRILLE)` — exporté |
| `rangeeLaPlusAvanceeQuiTire` | `(id)` | `(id, grille = GRILLE)` — exporté |
| `genererVague` | `({ niveau, budgetPoints, graine })` | `(spec, grille = GRILLE)` — exporté |
| `CASES_DEPLOIEMENT` | constante figée, un lecteur | **devient** `casesDeDeploiement(grille)`, privé |
| `tiersPrefere` | `(cle, categorie)` | `(cle, categorie, grille)` |
| `ouvrirLaBande` | `(bande, plafondRangee, plafondColonne)` | `(…, grille)` ; garde `grille` sur l'état de placement, `parColonne` dimensionné sur `grille.largeur + 1` |
| `admissible`, `replierCaseParCase` | lisaient `GRILLE.largeur` | lisent `etat.grille.largeur` |
| `poserLesPaquets` | `(placement, paquets, bande, plafondRangee, nb, quoi)` | `(…, quoi, grille)` |
| `placerBatiments`, `placerDefenses` | `(placement, liste, niveau)` | `(placement, liste, niveau, grille)` |
| `verifierLeRetraitDesPortees` | `(poses)` | `(poses, grille)` |
| `placerObstacles` | `(rng, casesPrises)` | `(rng, casesPrises, grille)` |
| `colonnesDesRangees` | `(rng, nb)` | `(rng, nb, grille)` |
| `genererSite` | `({ type, niveau, saveur, graine })` | **inchangée** : `const grille = GRILLE;` descend vers les trois poseurs ; **le montage rendu ne porte PAS de `grille`**, délibérément (voir §5) |
| `colonnes` | helper privé | **retiré** — aucun appelant depuis PAQUETS (09/09) ; `test/generateur-ancien.js` garde sa propre copie |

Les privés prennent la grille **sans défaut** : elle descend de `genererSite`.
Ils ne sont donc exercés qu'avec `GRILLE` aujourd'hui, et ne deviendront
falsifiables par une autre grille qu'au lot qui donnera une grille à
`genererSite` — c'est dit ici plutôt que tu.

### `src/render/projection.js` — les sept lectures

| fonction | après |
|---|---|
| `calculerProjection(largeurPx, hauteurPx, murCases = 0, vue = {})` | **`vue.grille`**, défaut `GRILLE`, passé par `verifierGrille(…, 'projection : vue.grille')` ; `lignesVisibles` prend son défaut sur `grille.longueur` ; `colonnes` et `contenuY` lisent `grille` ; **la projection rendue porte `grille`** |
| `grilleDeLaProjection(projection)` | **entre** : `projection.grille ?? GRILLE`, seule écriture du repli (sept lecteurs) |
| `xDeColonneMilli`, `yDeRangeeMilli`, `yDeRangee`, `caseDepuisPixels` | signatures inchangées, lisent `grilleDeLaProjection(projection)` |

⚠ **Écart de forme au §4.2, déclaré** : le brief donnait `caseDepuisPixels`
« avec `GRILLE` en défaut », c'est-à-dire un quatrième argument. La grille est
prise **sur la projection** : une réciproque inverse la projection qui a posé
`margeY`, et lui passer une autre grille rendrait une case d'une géométrie qui
n'est pas celle du dessin. Sans `vue.grille`, elle rend ce qu'elle rendait.

### `src/render/bandes.js`

| fonction | après |
|---|---|
| `BANDES` | **gardée**, constante de la grille par défaut, construite par `construireLesBandes(GRILLE)` |
| `bandesDe(grille = GRILLE)` | **entre** : `BANDES` par identité pour la grille par défaut, sinon `construireLesBandes(verifierGrille(grille, 'bandes'))` |
| `voilesDeLaBande(cle, grille = GRILLE)` · `basculeDeBande(cleCourante, grille = GRILLE)` · `bornesDeDefilement(cleBande, hauteurRangee, hauteurVue, padding = 0, grille = GRILLE)` · `bandeDeLaRangee(rangee, grille = GRILLE)` · `casesDeLaBande(cleBande, murCases = 0, grille = GRILLE)` · `bornesDuDecalage(cleBande, coteCase, hauteurVue, murCases = 0, grille = GRILLE)` · `bornesDuDecalageX(coteCase, largeurVue, murCases = 0, grille = GRILLE)` | la grille en DERNIER, `GRILLE` en défaut |
| `bandesDansLOrdreDeLEcran(grille = GRILLE)` | privé |

### `src/render/orientation.js`

`ligneEcranDeLaRangee(rangee, grille = GRILLE)`, `rangeeDeLaLigneEcran(ligne,
grille = GRILLE)`, `ligneEcranDeLaBande(bande, grille = GRILLE)` ; privé
`exigerRangee(rangee, grille)`.

### `src/render/portee.js`

`casesAPortee(depuis, portees, grille = GRILLE)` — le bord où le balayage
s'arrête, seule lecture du module.

### `src/render/fond.js`

`largeurEnCases(grille = GRILLE)` et `hauteurEnCases(grille = GRILLE)`
**entrent** ; `LARGEUR_EN_CASES` et `HAUTEUR_EN_CASES` **restent**, dérivées
d'elles pour la grille par défaut (`ui/chantier.js` et trois tests —
`chantier`, `fond`, `sprite` — les lisent, quatre avec `grille` depuis ce lot) ;
`rectangleDuFond(projection)` prend `l` sur la grille de la projection et
**laisse `h` sur `HAUTEUR_IMAGE_EN_CASES`**, donc sur le `× 2` — voir §9.

### `src/render/scene.js`

`listeArsenal(grille, projection, …)` et `listeDefense(grille, projection, …)`
— où `grille` est l'ÉTAT DE L'ÉDITEUR — lisent la géométrie sur
`grilleDeLaProjection(projection)` ; `GRILLE` sort des imports du module.

### Ce qui n'est PAS touché, et pourquoi

`data/base.js` (`GEOMETRIE_BASE`), `sim/state.js` (`FORCES.garnison`),
`sim/champs.js`, `ui/defense.js`, `ui/chantier.js` : la base du **joueur**, qui
lit `GRILLE` et n'a pas d'autre grille (§4.3 du brief). `ui/raid.js` : zéro
lecture de `GRILLE`, et `RAID-E T5` le garde ; il passera sa grille à `render/`
au lot suivant. `sim/raid.js`, `sim/raid-ouvrage.js`, `sim/peuplement.js` :
leurs lectures de `GRILLE` sont `vaguesParRaid`, `tickSec`, `lateral`,
`ticksAvantRepli`, `plancherReservePct` — pas de la géométrie. `cleCase` :
laissé, voir §9.

---

## 4. La voie choisie pour `DERNIERE_RANGEE` / `DERNIERE_COLONNE`

**Hybride, (a) + (b).** Les deux constantes RESTENT, exportées, documentaires —
`test/colonne.test.js`, `test/grille.test.js` et, pour `RANGEE_DEFENSE_FRANCHIE`,
`test/formation-et-garnison.test.js` les lisent — et **plus aucune ligne de
production ne les lit** : `derniereRangee(grille = GRILLE)`,
`derniereColonne(grille = GRILLE)` et `rangeeDefenseFranchie(grille = GRILLE)`
prennent leur place partout. Rendre sans argument ce que rend la constante est
ce que `PORTÉE T1` asserte, et n'être plus lues par personne est ce que la
sonde §2.2 rejouée montre — `creerCombat OK` avec les constantes encore figées.

**Le sort de `posePermise` L. 660**, le trou nommé par le brief : elle prend la
grille **sans défaut**, et ses deux appelants la lui donnent — `ajouterEntite`
par `grilleDuCombat(etat)`, `creerCombat` (validation des vagues) par la grille
du montage. Un défaut l'aurait laissée retomber sur `GRILLE` sans rien pour le
dire ; l'absence de défaut fait lever `estDansLaGrille` sur `undefined.longueur`
au premier oubli. Falsifiée : `estDansLaGrille(rangee, colonne)` sans grille
dans `posePermise` fait tomber `PORTÉE T2` sur « bâtiment « souche » en (26, 3)
est hors de la grille (rangées 1–27, colonnes 1–9) » — le refus vient de
`ajouterEntite`, qui voit 27 rangées, quand `posePermise` en voit 18.

Pourquoi pas (b) seule : retirer les trois constantes aurait touché trois
fichiers de test (`colonne`, `grille`, `formation-et-garnison`) pour une
valeur qui ne change pas, et une constante de la grille par défaut reste
vraie. ⚠ `ui/banc.js` et `test/defense.test.js` lisent un AUTRE
`DERNIERE_RANGEE`, celui d'`ui/defense.js` (`GRILLE.bandes.defense.derniere`,
côté joueur) — vérifié à l'import, ce n'est pas la constante de `sim/grille.js`. Pourquoi pas (a) seule : le brief le dit — sans
le paramètre descendu jusqu'à `posePermise`, (a) n'est pas acceptable.

---

## 5. Les 200 témoins — identiques, mesuré

`JOURNAL T1` (200 empreintes du lot APPROCHE) et `JOURNAL T1 bis` (200
empreintes d'avant PAQUETS, rejouées sous sept couches) sont **VERTS après
chaque étape** — grille.js, combat.js, generateur.js, render/, prose — sans
qu'une ligne de `test/temoins-combat.js` bouge : **0 écart, 0 couche ajoutée.**
Le témoin de BASES-0 (`BASES-0 T1`, 25 graines × 14 phases) est vert aussi,
`tailleSauvegarde` comprise.

Ce qui le garantit, et qui a été falsifié (§6) : `etat.grille` n'est posé que
si le montage en porte une, et `genererSite` **ne pose pas de `grille` sur ses
montages** — les deux cents témoins sont ses montages, et `serialiserEtat` trie
les clés propres. Une seule ligne dans l'autre sens et les deux cents tombent.

---

## 6. Les falsifications, avec le rouge réel

Chacune appliquée, mesurée, défaite — le fichier vérifié identique après.

**T1 — un seul défaut change** (`estSortiParLeHaut(rangeeMilli, grille = { ...GRILLE, longueur: GRILLE.longueur + 1 })`) :

```
# tests 10 · # pass 8 · # fail 2
not ok 7 - G6 — au-delà de la dernière rangée, on sort du combat
not ok 9 - PORTÉE T1 — sans argument, tout rend exactement ce que cela rendait
error: estSortiParLeHaut(19000) sans argument  false !== true
```

**T2 n° 1 — une signature relit `GRILLE`** (`bornesBande` : `GRILLE.bandes[nomBande]`) :

```
not ok 10 - PORTÉE T2 — une grille passée change le résultat, et `creerCombat` est seul à la poser
error: bornesBande ignore sa grille + actual - expected
```

La même faute côté rendu (`ligneEcranDeLaRangee` : `GRILLE.longueur + 1 - …`) :

```
not ok 10 - PORTÉE T2 …
error: voilesDeLaBande ignore sa grille + actual - expected
```

**T2 n° 2 — `etat.grille` posé inconditionnellement** (`etat.grille = grille;` sans la condition) :

```
test/journal.test.js : # tests 11 · # pass 9 · # fail 2
not ok 1 - JOURNAL T1 — deux cents combats rendent le résultat capturé au lot APPROCHE (falsification n° 1)
not ok 2 - JOURNAL T1 bis — l'ancien placement rejoué : 0 écart sous les sept couches empilées
error: camp/richeQuartz/n5/g1/toutes : le champ 2 a bougé depuis le témoin du lot APPROCHE
error: camp/richeQuartz/n5/g1/toutes : le champ 2 a bougé depuis le témoin d'avant le lot
test/grille.test.js : # tests 10 · # pass 9 · # fail 1
error: creerCombat pose `etat.grille` sur un montage qui n'en porte pas  true !== false
test/bases.test.js : # tests 30 · # pass 30 · # fail 0
```

Les deux cents tombent — **c'est la vraie garde** — et BASES-0 ne bouge pas :
il ne hache pas l'état de combat, seulement les rapports.

**T2 n° 3 — un second `.grille =` dans `src/`** (`poserLaGrille` ajouté à `sim/raid.js`) :

```
not ok 10 - PORTÉE T2 …
error: `.grille =` est écrit ailleurs que dans creerCombat : [["sim/combat.js",1],["sim/raid.js",1]] + actual - expected
```

### La relecture hostile, mesurée sur TOUTES les signatures

« Si je remets `GRILLE` en dur dans une seule des signatures modifiées, la suite
le voit-elle ? » — répondu en lançant la suite, signature par signature :
**45 falsifications, une par lecture de grille modifiée, 45 vues par
`PORTÉE T2`**, chacune restaurée et vérifiée après (`balayage-hostile.txt`).
⚠ **Deux étaient aveugles au premier balayage**, et `T2` a été REFAIT, pas le
rapport nuancé : `bornesBande('batiments')` sans grille dans `creerCombat` ne se
voyait que dans le TEXTE du refus — `T2` monte désormais une souche en rangée 18
et un merlon en rangée 19 sur la grille longue et exige « (19–27) » et
« (3–18) » dans les messages ; et `colonnes = GRILLE.largeur + …` dans
`calculerProjection` ne changeait ni `tailleCase` ni `margeX` sur les deux
projections assertées — `T2` asserte désormais `tailleCase === 100` et
`margeX === MUR_CASES × 100` sur la projection 11 × 18. ⚠ `basculeDeBande` rend
la même cible sur toute grille (l'ordre des bandes ne dépend pas de leurs
bornes) : sa grille se falsifie par la GARDE — une grille malformée doit lever —
et `T2` le fait.

---

## 7. Les six prose du §6 — et ce qui a été mesuré

| # | où | fait | mesuré |
|---|---|---|---|
| 1 | `src/data/sites.js` | réécrit : aucun test n'asserte la somme ; la garde est le `throw` de `tiersDeLaDefense`, atteint par `PQ T6` ; et la table à huit LÈVE sur seize, point d'arrêt voulu | `grep` de `tiersDeLaBande` dans `test/` : **zéro occurrence** — aucun test ne la lit, a fortiori ne la somme |
| 2 | `src/sim/grille.js` | réécrit : `avancer` est le troisième lecteur d'`estEnApproche` ; et « élargir » n'est pas « paramétrer » | `ciblage` ×2, `avancer` ×1 dans `sim/combat.js` |
| 3 | `test/pictogramme.test.js` L. 487 | **titre seul** : « 9 375 557 octets, 3,34 % » | constantes L. 990-1035 intactes, `git diff` d'une ligne ; `PIC T7` **non réancré** — 2 056 octets sur une tolérance de 50 000, vert |
| 4 | `test/banc.test.js` L. 934 | prose : « 324 443 octets, 3,34 % » | — |
| 5 | `CLAUDE.md` §2 L. 14170 et 14184 | « NEUF n'en sont PAS » ; « LE NEUVIÈME EST `portants.js` » (lot ÉCRASEMENT, 18/09), le huitième restant `generateur-ancien.js` | `test/documentation.test.js` en liste neuf |
| 6 | `src/render/fond.js` | « trente-deux lectures » ; et le commentaire de `FONDS` dit ce qui manque désormais | sur `main` : **32** occurrences de `GRILLE.longueur` dans **8** fichiers (21 en code, 11 en prose) ; sur le lot, 4 en code : la définition de `DERNIERE_RANGEE` (`sim/grille.js:22`) et trois côté joueur (`ui/chantier.js` ×2, `ui/defense.js`) |
| 7 | `src/data/base.js` L. 547-551 | **amendé**, pas corrigé : la grille portée n'est pas une grille du joueur, le joueur prend le défaut | — |

Aucune n'a fait tomber un test.

---

## 8. Le coût, ventilé

Mesuré contre le livrable **rebâti** dans un `git worktree` pristine de `main`
= `ce3ea49` — 9 375 557 octets, retrouvés à l'octet —, cinq postes qui
partitionnent le fichier des deux côtés :

| Poste | `main` | lot | Écart |
|---|---|---|---|
| images | 7 607 579 | 7 607 579 | +0 |
| JavaScript | 439 495 | 441 551 | **+2 056** |
| balisage | 38 786 | 38 786 | +0 |
| feuille | 48 043 | 48 043 | +0 |
| audio | 1 241 654 | 1 241 654 | +0 |
| **TOTAL** | **9 375 557** | **9 377 613** | **+2 056** |

Écart de partition **0 · 0** ; `data:` à **313 lignes / 312 URI** des deux
côtés — aucune ressource n'entre ni ne sort. **Borne T10 : 9 700 000, non
touchée**, marge **322 387 octets, 3,32 %**.

### Verdict

- `npm run check` : **0**.
- `npm test` : **1662 déclarés · 1661 pass · 0 fail · 1 skipped** (`LIMITE T8`).
- `dist/index.html` : **9 377 613 octets**, 0 référence externe.
- `test/` : **80** fichiers, aucun créé ni supprimé ; `src/` : aucun fichier
  créé ni supprimé.
- `tools/verifier.py`, `tools/atlas.py`, `tools/fonds.py` : **pas lancés**,
  aucun art ni outil de la chaîne au diff.
- `SAVE_VERSION` : **39**, inchangé — `git diff src/sim/state.js` vide, et
  `BASES-0 T1` mesure la taille de sauvegarde sur 25 graines.

---

## 9. Ce qui reste ouvert, nommément

- **`render/fond.js` L. 69 — le `× 2`** de `HAUTEUR_IMAGE_EN_CASES`. Non
  touché. `rectangleDuFond` prend sa largeur sur la grille projetée et sa
  hauteur sur ce `× 2` : sur une grille de 27 rangées, `h` vaudrait 20 cases là
  où un décor 1080 × 3240 en fait 30. Le facteur est une propriété du DÉCOR, à
  dériver de `fond-empreintes.json` fond par fond — lot GRILLE LONGUE.
- **`COTE_CASE_SOURCE = 108`** (L. 101) — non touché, même lot.
- **Le doublement des défenses, 77 ou 78** — hors lot ; `× 2` sur `DENSITE`
  rend 77, sur l'effectif 78. À dériver du rapport des bandes.
- **`cleCase(rangee, colonne) = rangee × 100 + colonne`** — laissé. C'est la
  seule hypothèse de dimension non dérivée : elle tient tant que `largeur < 100`,
  et vaut 2709 à 27 rangées.
- **La garde de `replierCaseParCase`** — ne mord toujours pas ; hors lot.
- **La table des tiers à seize rangées** — `tiersDeLaDefense(grilleLongue)`
  LÈVE (« les tiers couvrent 8 rangées, la bande en fait 16 ») : c'est
  l'arbitrage `DISPOSITION_DEFENSES.tiersDeLaBande` du lot suivant, pas un
  défaut de celui-ci.
- **`pourLeRejeu` ferait voyager `montage.grille`** dans `etat.rapports[].rejeu`,
  donc dans la sauvegarde : il ne retire que les deux tableaux d'indices.
  Aujourd'hui aucun montage de production n'en porte — `genererSite` ne la pose
  pas, et BASES-0 le mesure. Le jour où un montage en portera une, la sauvegarde
  grandira d'autant : **`SAVE_VERSION`**, ou une grille redérivée du type au
  rejeu — à trancher au lot GRILLE LONGUE.
- **Les poseurs privés de `genererSite`** reçoivent la grille par descente et ne
  sont exercés qu'avec `GRILLE` : ils deviendront falsifiables quand
  `genererSite` lira `TYPES_SITE[type].grille`.
- **Un helper mort retiré** : `colonnes()` de `sim/generateur.js`, sans appelant
  depuis PAQUETS. `test/generateur-ancien.js` garde le sien.
- **Les trois fonds longs** déplacés dans `art/sourcesstandby/` (§1), non
  commités, à remettre par Ethan ; et la quatrième image du message, non
  cherchée.
- **Le rendu n'a pas été vu**, et se déclare non exécuté : aucun écran ne
  passe encore une autre grille, et sur la grille par défaut la projection
  rend la formule d'hier au caractère près — `RAID-E T2` et `FOND T5` la
  refont à la main, `PORTÉE T1` asserte les sept exports sans argument. Ce
  sont des fonctions PURES ; pas un pixel n'a été regardé.
