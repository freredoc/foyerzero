# PASSATION — Foyer Zéro, session du 26/08/2026

> À lire avant tout, avec `CLAUDE.md`. Ce document dit où en est le projet, ce
> qui a bougé aujourd'hui, ce qui reste ouvert, et les pièges qui ont coûté
> quelque chose. Il ne remplace pas `CLAUDE.md` — celui-là fait autorité.

---

## 1. État du dépôt, mesuré et non cru

| | |
|---|---|
| Dépôt | `freredoc/foyerzero`, branche `main` |
| Version · build | **0.12.0 · 12** |
| `npm test` | **164 tests, 164 pass, 0 fail** |
| `npm run build` | `dist/index.html` — **81 236 octets**, 0 référence externe |
| `SAVE_VERSION` | **2** |
| Fichiers de test | **16** `*.test.js` |
| Dernier lot mergé | lot HYGIÈNE |

Relevé depuis `main` après dépôt, arborescence et SHA-256 contrôlés fichier par
fichier : rien d'égaré, aucun fichier parasite, `verif.mjs` bien supprimé.

**Premier geste de la prochaine session** : lire `CLAUDE.md`, lister la racine,
`src/`, `src/data/`, `src/sim/`, `src/render/`, `src/ui/` et `test/`, puis
`npm ci && npm run check`. Ne jamais se fier à la mémoire pour l'arborescence.

⚠ `CLAUDE.md` §2 est à jour au 26/08, **relevé fichier par fichier**. Il a menti
deux fois : le lister quand même.

---

## 2. Ce qui a changé aujourd'hui — trois lots

### 2.1 Lot RÉSIDU — l'économie par tick devient exacte

**Aucun débit n'est plus arrondi par tick.** Un débit se range PAR HEURE,
entier, et chaque bâtiment porte un résidu (`residuFlux`) dans l'état de jeu.

```
residu += debitMilliParHeure
gain    = Math.floor(residu / TICKS_PAR_HEURE)
residu  = residu % TICKS_PAR_HEURE
```

Erreur d'arrondi par tick : **exactement zéro**, à n'importe quelle fréquence.
`fluxMilliParTick` n'existe plus, `debitMilliParHeure` le remplace.
`TICKS_PAR_HEURE` est né dans `sim/clock.js`, et c'est LA grandeur de conversion.

**Effet de bord voulu : le passage du hors-combat à 1 Hz devient sans effet sur
l'économie.** Sous l'ancien régime, diviser la fréquence par dix aurait
multiplié l'erreur d'arrondi par dix.

**Impact de calibrage.** Le niveau 1 est rigoureusement inchangé (20 milli/tick
× 36 000 = 720 000 milli/h). Les autres bougent de ce que l'arrondi leur
coûtait : **+0,716 % au niveau 3, −0,357 % au niveau 4, +0,569 % au niveau 6**,
et ça s'éteint en montant — +0,001 % au niveau 50. C'est du bruit supprimé, pas
une courbe déplacée : l'écart va dans les deux sens.

`SAVE_VERSION` passe à 2, migration `1 → 2` qui pose `residuFlux = 0`.

⚠ `dist/index.html` **n'a pas bougé d'un octet** : `src/index.src.html`
n'importe ni `sim/economy.js` ni `sim/state.js`. Le lot est invisible en jeu
aujourd'hui, et le deviendra le jour où la base du joueur sera branchée.

### 2.2 Lot MIROIR — la tolérance du T12, enfin mesurée

Dette portée par deux passations sans jamais être re-mesurée.

**La tolérance d'un tick est JUSTE**, et elle est maintenant mesurée sur
**4 200 comparaisons** (3 types × 20 graines × 7 compositions × 5 niveaux) au
lieu de 4 : médiane 0, maximum 1, **0 cause divergente**.

**Mais le test ne prouvait rien.** Défaut injecté sur une copie — dégâts mis à
l'échelle par `facteurMilli × 1,002`, soit +0,2 % de rupture du miroir :
l'ancien T12 **passait**, écart max 0 tick. À +0,02 % aussi. Sa graine unique
tombait sur un site où l'arrondi n'avait aucune prise. Le nouveau tombe dans les
deux cas (7 et 3 ticks).

**Et la mesure a trouvé ce que le T12 ne regardait pas : le sort des entités.**
Un montage sur 420 porte une Batterie qui survit au niveau 1, meurt aux niveaux
2 et 10, survit aux niveaux 30 et 50 — en tenant **2,7 PV sur 106 719** au
plafond. Le tick de fin ne bouge pas (228 partout), ni la cause.

Ce n'est pas un défaut, c'est la **borne du miroir** : `pvMaxMilli` et les
dégâts sont arrondis séparément par niveau, le dernier coup tombe tantôt avant
zéro tantôt après. Et le résidu est lui-même invariant en relatif —
**25,0 / 27,4 / 25,4 ppm**. Le miroir tient jusque dans son propre bruit.

Le nouveau T12 asserte donc qu'une bascule est **à un arrondi de la mort** :
sous **100 ppm** des PV max, seuil calculé sur 27,4 ppm mesurés, 3,6 fois de
marge. Montage : 50 sites × 5 niveaux = 500 comparaisons, +1,2 s de suite.

### 2.3 Lot HYGIÈNE — quatre dettes closes

- **La garde du lot 1** (`test/clock.test.js`, test 4). `/\bdocument\b/`
  déclenchait sur « documenté » mais laissait passer « documentation » : ce
  n'était pas trop strict, c'était **arbitraire**. `\b` est ASCII, la frontière
  tombe entre le « t » et le « é ». Les neuf motifs de mot passent par
  `` (?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_]) `` en mode `u`. **Écrire « consigné »
  dans `src/sim/` n'est plus nécessaire.**
- **`SPEC-FOYER-ZERO.md` l. 281** : couloir 9 × 300 → **30 × 300**. Le fichier
  de rang 1 ne ment plus.
- **Les liens morts : sept trouvés, pas trois.** Quatre réels
  (`MODELE-REPARATION.md`, `COURBE-DE-NIVEAU.md`, `BASE-DU-JOUEUR.md`,
  `FOYER-ZERO-CALIBRAGE.xlsx`), **neuf références réparées** dans cinq
  documents. Les trois autres (`BRIEF-lot5B/5C`, `chantier-economie.xlsx`) sont
  volontairement sans cible et se disent telles.
- **`verif.mjs` supprimé**, ses invariants promus en `test/donnees.test.js`
  (10 tests, dans `npm run check`). Voir §4.1.

---

## 3. Ce qui reste ouvert

### 3.1 Foyer Zéro

1. **La base du joueur, en jeu.** `base.js` existe, rien ne l'importe. C'est le
   prochain vrai chantier. ⚠ **BLOQUÉ tant qu'Ethan n'a pas refait les
   captures** : `BASE-DU-JOUEUR-1.md` §2 nomme sept bâtiments sur onze, et le
   Chantier de construction — le central, celui dont la chute rase la base —
   n'est pas nommé du tout.
2. **La boucle du hors-combat à 1 Hz.** Décidée par Ethan, non implémentée. Elle
   est désormais **sûre côté économie** (§2.1) ; le moteur de combat reste à
   10 Hz.
3. **Les six tests appareil du lot 5C**, toujours non exécutés. Un Chromium de
   bureau au gabarit 412 × 915 n'est pas un test appareil et ne le remplace pas.
4. **`sim/economy.js` ne connaît qu'une capacité de stockage globale**
   (`params.stockage.capaciteMilli`). La capacité par bâtiment de
   `data/base.js` — `capaciteDuNiveau()`, ancrée sur `STOCKAGE.autonomieHeures`
   — n'est lue par personne. Même dette que le point 1, elle se soldera au même
   moment.
5. **Les valeurs manquantes du classeur** `FOYER-ZERO-BATIMENTS-JOUEUR.xlsx` :
   coûts de réparation, plafonds d'électricité, voisinage typé (rayon, bonus,
   plafond), réserve de temps de réparation.
6. **La marge de `DEBIT_MILLI_PAR_HEURE_MAX` est de 19, pas confortable.** Une
   donnée future qui multiplierait un débit par 20 doit faire descendre la
   fréquence de tick, pas franchir le seuil. `rattrapageEconomie` lève si elle
   est franchie, plutôt que de dériver — mais c'est un garde-fou, pas une marge.

### 3.2 Ce qui a été CLOS aujourd'hui — ne plus le lister

- ~~§3.1.2 le résidu entier dans `sim/economy.js`~~ → lot RÉSIDU.
- ~~§3.1.5 `CLAUDE.md` §2 périmé~~ → relevé fichier par fichier.
- ~~§3.1.6 les noms de documents cassés~~ → neuf références réparées.
- ~~§3.1.7 `SPEC-FOYER-ZERO.md` l. 281~~ → 30 × 300.
- ~~§3.1.8 la garde du lot 1~~ → bornée en Unicode, assertée dans les deux sens.
- ~~§3.1.9 la tolérance du miroir, T12~~ → mesurée, seuil calculé, test falsifié.

### 3.3 Archipel Industry — non touché aujourd'hui

Le test fermé Play Store reste la priorité absolue. Les trois tests appareil dus
(T7-SILENCIEUX, **T6-PONT prioritaire**, T7-PONT) n'ont pas tourné, et **aucun
autre lot Android ne doit être monté avant.** A3 et A5 attendent l'arbitrage
d'Ethan. L'île 8 reste le seul chantier de contenu, sans brief.

---

## 4. Ce qui a coûté quelque chose — à ne pas réapprendre

### 4.1 Un audit hors de `npm run check` ne s'exécute pas, donc n'existe pas

`verif.mjs` portait **seize invariants de données** et aucune commande ne le
lançait. Il avait pourri sans que rien ne le dise :

- il importait `MATRICE_COLONNES`, renommé `COLONNES_DEGATS` depuis un lot
  antérieur — il **plantait à l'import** ;
- et même l'import réparé, sa boucle testait `u.matrice` sur des entités qui
  portent `u.degats` : elle aurait sauté **toutes** les entités en silence et
  affiché « ok ».

Réparé, il aurait re-pourri à l'identique. Il est **supprimé**, et ses
invariants vivent dans `test/donnees.test.js`. **Ne pas en recréer un.**

Un de ses invariants était devenu FAUX : il bornait les matrices de dégâts à
`[0, 1]`. C'étaient des coefficients ; `degats` porte aujourd'hui des dégâts
**absolus**, jusqu'à 300 — le borner échouerait sur **51 valeurs**. Abandonné
plutôt que remplacé par une borne inventée. Ce qui reste vérifiable, ce sont les
clés et le fait qu'un dégât soit un entier ≥ 0.

Deux autres écartés parce que **déjà couverts** : « 14 unités, 9 défenses »
(`roster.test.js`) et « bandes contiguës, 72 cases » (`grille.test.js`). Les
recopier aurait créé deux endroits où la même vérité s'écrit.

### 4.2 Un test qui passe n'est pas un test qui prouve

L'ancien T12 passait depuis le lot 2B **sans rien mesurer**. Une graine, une
composition, quatre couples — et un site où l'arrondi n'avait aucune prise. Il a
laissé passer une rupture du miroir de +0,2 % sans broncher.

**La leçon est de méthode : la seule façon de savoir qu'un test prouve quelque
chose est de lui présenter un défaut et de vérifier qu'il tombe.** Trois lots
sur trois l'ont fait aujourd'hui, et les trois y ont gagné :

| lot | défaut injecté | résultat |
|---|---|---|
| MIROIR | dégâts × 1,002, puis × 1,0002 | ancien T12 **passe**, nouveau tombe (7 et 3 ticks) |
| HYGIÈNE | part du `noeud` 0,40 → 0,45 | attrapé — « somme des parts = 1.05 » |
| HYGIÈNE | module `fumigene` → `module_fantome` | attrapé — « module inconnu » |
| HYGIÈNE | `merlon: 5` glissé dans `VAGUES` niveau 5 | attrapé par **deux** tests |

### 4.3 La borne de débordement de l'économie était fausse — de 471 fois

Le commentaire de `data/base.js` écrit le 25/08 annonçait que le pire cas — dix
ans hors ligne au débit du niveau 50 — restait « deux fois sous l'entier sûr ».

**Mesuré : le produit naïf `N × debitParHeure` y vaut 4,245 × 10¹⁸, soit
471 fois AU-DESSUS de `MAX_SAFE_INTEGER`.** La formule fermée telle qu'elle
était écrite aurait dérivé en silence.

Le rattrapage ne calcule donc pas ce produit. Il décompose
`N = q × TICKS_PAR_HEURE + r` : le résidu ne dépend que de `r` (arithmétique
modulaire), et les heures pleines `q` sont **bornées à ce qu'il faut pour
saturer** — au-delà le stock vaut la capacité de toute façon, donc le produit
n'a plus à être exact, donc il n'a plus le droit d'être grand.

### 4.4 J'ai deviné deux seuils, les deux étaient faux

- « le niveau 50 reste **dix-neuf mille fois** sous le seuil » → **19**.
- `donnees.test.js` portait neuf gardes de montage `>= 5`. L'une était fausse et
  le test est tombé : il n'y a pas cinq bâtiments proportionnels, il y en a
  **trois** (`noeud` 0,4 · `gangue` 0,3 · `terril` 0,3).

Les deux corrigés avant livraison. Les neuf gardes sont devenues des **égalités
mesurées** — 20 entités porteuses de dégâts, 8 unités en défense, 4 aéronefs,
42 références de modules, 3 bâtiments proportionnels, 22 lignes de composition,
17 au pool défensif, 10 paliers de densité, 9 paliers de budget. Une égalité
plutôt qu'un plancher : ajouter une unité au roster fera tomber le test, et
c'est **voulu** — le changement doit être délibéré et visible.

⚠ La seconde faute a été commise **dans le fichier même qui prétend asseoir les
invariants**. « Les seuils se calculent, ne se devinent pas » vaut aussi pour
les gardes de montage, pas seulement pour les assertions principales.

### 4.5 Le résidu doit avancer même stockage plein

Le geler à la saturation casserait l'exactitude du rattrapage : la composition
`min(cap, min(cap, x+a)+b) = min(cap, x+a+b)` ne tient que si les gains sont
indépendants de l'état du stock. Un test le garde, **avec le commentaire qui dit
pourquoi** — pour que personne ne « corrige » ça plus tard.

### 4.6 Renommer un fichier casse plus qu'il ne répare

Renommer `MODELE-REPARATION-1.md` en `MODELE-REPARATION.md` aurait été plus
propre en apparence. Mais toutes les citations des passations et des rapports —
l'historique du projet — nomment les fichiers **avec** leur suffixe : on aurait
échangé quatre liens morts contre plusieurs dizaines. **Les suffixes numériques
font partie des noms.** En écrire une citation : copier le nom de fichier,
jamais le retaper.

---

## 5. La méthode, telle qu'elle a évolué aujourd'hui

Rien n'a changé sur le fond. Deux précisions de forme, l'une importante.

### 5.1 ⚠ FORME DE LIVRAISON — Ethan travaille sur TÉLÉPHONE

**Dès qu'une livraison compte strictement plus de deux fichiers, livrer un ZIP
UNIQUE**, dont l'arborescence reproduit celle du dépôt, rapport inclus, avec un
`LISEZ-MOI-DEPOT.md` en tête qui donne les étapes de dépôt. À deux fichiers ou
moins, livrer les fichiers tels quels.

⚠ **Et ne pas écrire « décompresse-le à la racine du dépôt » : GitHub ne
décompresse pas un zip.** Le gain est sur le TÉLÉCHARGEMENT (un fichier au lieu
de onze), l'extraction se fait sur le téléphone, et le téléversement se fait
dossier par dossier via *Add file → Upload files*. Piège : téléverser depuis la
racine des fichiers destinés à `test/` les dépose à la racine.

**Cette contrainte n'avait jamais été demandée en trois sessions.** Leçon
générale : demander comment l'interlocuteur travaille, ne pas le déduire.

### 5.2 Le rapport de lot entre au dépôt

Neuf `RAPPORT-*.md` y étaient déjà, `CLAUDE.md` les cite au rang 6, mais les
lots récents ne les commitaient plus. **Sans eux, `CLAUDE.md` affirme des seuils
sans que rien ne dise d'où ils sortent** — « 100 ppm », « 19 fois », « 471 fois
au-dessus » deviennent des affirmations nues. Les trois de la journée sont au
dépôt.

### 5.3 Ce qui n'a pas changé

- Le **merge sur `main` appartient à Ethan seul.**
- **Vérifiable par exécution → livraison directe.** Pas vérifiable ici (tout ce
  qui touche le DOM) → brief pour Claude Code, qui ouvre une PR.
- **Ne jamais assouplir un test pour le faire passer.** Audit systématique du
  compte d'assertions avant/après. Trois lots aujourd'hui, **zéro assertion
  supprimée, zéro seuil abaissé.**
- **Les seuils se calculent, ne se devinent pas.** Cinq graines et une médiane
  au minimum.
- **Vérifier avant d'affirmer.** Deux affirmations fausses de plus aujourd'hui,
  les deux écrites par moi, les deux attrapées avant livraison (§4.4).
- **Vocabulaire** : l'adversaire est **l'Ouvrage**, jamais « l'IA ». Deux jeux
  de noms, jamais mélangés dans une chaîne affichée.

### 5.4 Une décision de version reconduite trois fois

`package.json` n'a été bumpé qu'**une fois** aujourd'hui, pour le lot RÉSIDU.
Les lots MIROIR et HYGIÈNE ne touchent que des tests et de la documentation :
`dist/index.html` est identique à l'octet, donc son SHA-256 et le manifeste de
Pages aussi. Bumper aurait poussé une mise à jour aux appareils pour un
changement qui ne les concerne pas.

**Règle qui en sort** : bumper `version` et `config.build` ensemble **quand
`dist/index.html` change**. Sinon, s'en abstenir et le dire.

---

## 6. Livrables hors dépôt de cette session

- **`balayage-miroir.mjs`** et deux sondes — le banc de mesure du §2.2, 420
  montages, 12 s d'exécution. **Écartés du dépôt** : ils doubleraient la suite
  pour un gain de couverture marginal, le T12 livré couvrant déjà 50 montages en
  1,2 s. Se remontent en dix minutes si un audit ponctuel les redemande.
- Aucun brief Claude Code : les trois lots étaient vérifiables par exécution.
