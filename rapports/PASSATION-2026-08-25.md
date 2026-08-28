# PASSATION — Foyer Zéro, session du 25/08/2026

> À lire avant tout, avec `CLAUDE.md`. Ce document dit où en est le projet, ce
> qui a bougé aujourd'hui, ce qui reste ouvert, et les pièges qui ont coûté
> quelque chose. Il ne remplace pas `CLAUDE.md` — celui-là fait autorité.

---

## 1. État du dépôt, mesuré et non cru

| | |
|---|---|
| Dépôt | `freredoc/foyerzero`, branche `main` |
| Version · build | **0.11.0 · 11** |
| `npm test` | **152 tests, 152 pass, 0 fail** |
| `npm run build` | `dist/index.html` — **81 236 octets** (79,3 Kio), 0 référence externe |
| Dernier lot mergé | correctif `surObstacle` + panneau de fin |

**Premier geste de la prochaine session** : lire `CLAUDE.md`, lister la racine,
`src/`, `src/ui/`, `src/render/`, `src/sim/`, `src/data/` et `test/`, puis
`npm ci && npm run check`. Ne jamais se fier à la mémoire pour l'arborescence.

⚠ `CLAUDE.md` §2 **annonce toujours `src/render/` et `src/ui/` vides**. Ils
portent sept fichiers. La correction était au périmètre du lot 5B et n'a pas été
faite : à reprendre.

---

## 2. Ce qui a changé aujourd'hui — cinq lots

### 2.1 La courbe de combat passe à ×1,1 (lot COURBE)

`NIVEAU.penteBasse` et `penteHaute` valent **1,1**, `deuxRegimes` est `false`.
Au niveau 50, le facteur passe de **480 941 681 à 106 719** — 4 505 fois plus
plat.

**Ce que ça a réglé.** Le débordement arithmétique du §5 de
`COURBE-DE-NIVEAU-2.md` disparaît sans correctif : le produit intermédiaire
tombe de 1,5 × 10²² à 2,6 × 10¹⁴, soit 35 fois de marge SOUS l'entier sûr. Le
point de rupture des PV de base passe de 18 728 à **84 401 083**.

**Ce que ça a coûté.** L'écart de niveau devient doux : +1 vaut ×1,21 d'avantage
effectif au lieu de ×1,74, +5 vaut ×2,59 au lieu de ×16. La pression
géographique de la §10 de la spec — 0,2 niveau par case — s'en trouve très
allégée. **Conséquence assumée, pas encore éprouvée en jeu.**

**Le résultat qui compte, et il est contre-intuitif** : sur les quatre raids de
référence, **aucun tick, aucune cause, aucun compte de survivants n'a bougé**.
Seuls deux butins ont glissé de une et deux unités de quartz. C'est l'invariance
en miroir — PV et dégâts partagent la courbe, donc la changer ne change pas
l'issue du combat, seulement l'arrondi de ce qui s'en déduit.

### 2.2 La courbe économique sort de `niveaux.js` (fichier `economie.js`)

`NIVEAU.penteHaute` servait **deux grandeurs** : la mise à l'échelle du combat
ET la pente des coûts de montée. Elles valaient 1,32 toutes deux, la confusion
ne se voyait pas. Elles divergent maintenant — 1,1 et 1,32 — d'où
`src/data/economie.js`, qui porte `ECONOMIE_NIVEAU` : les dix ratios de coût des
niveaux 2 à 12, `penteStable: 1.32`, `penteProduction: 1.25`.

⚠ Le garde-fou de `test/generateur.test.js` T10 **a été retourné, pas
supprimé** : il assertait que `NIVEAU` et `BUTIN` partagent leurs pentes ; il
asserte désormais que la divergence est **celle qu'on a voulue**, et il tombera
tout autant si quelqu'un réaligne les deux par distraction.

### 2.3 Les points de recherche quittent leur barème propre (lot RECHERCHE)

`POINTS_RECHERCHE.multiplicateurParNiveau: 2` **n'existe plus**. Le barème suit
la courbe économique via `facteurEconomiqueMilli(niveau)` de `sim/combat.js`.
Le produit le plus lourd passe de 4,05 × 10¹⁹ — 4 500 fois l'entier sûr — à
**3,46 × 10¹³**, soit 260 fois de marge. Le dernier débordement du projet est
fermé.

⚠ **BigInt reste obligatoire** et un test l'asserte : le produit COMPLET, avec
`pvPerdusMilli`, atteint encore 5,2 × 10²¹. Repasser ce calcul en `Number`
serait une régression silencieuse.

⚠ `butinPlein` **n'a délibérément pas été refactorisé** pour passer par
`facteurEconomique`. La multiplication flottante n'est pas associative :
regrouper les facteurs autrement déplace le butin d'une unité, et six tests le
mesurent au champ près. C'est écrit au-dessus de la fonction.

### 2.4 La base du joueur existe en données (`src/data/base.js`)

Onze bâtiments, PV et temps de réparation de niveau 1, emplacements, coûts,
débits, stockage. Fichier neuf, importé par personne pour l'instant.

**Ce qui a été arbitré par Ethan** : réparation manuelle chez le joueur (les
trois autres régimes étaient DÉJÀ dans `TYPES_SITE` de `sites.js` — ne pas les
recopier), noms TA, le Chantier occupe un emplacement, et la courbe de stockage.

⚠ **La courbe de stockage a été REPRISE en cours de route.** Le premier ancrage
— 20 unités montées en ×2 jusqu'au niveau 10 — donnait un plein en **cinq
minutes** au niveau 1 et en **soixante et un ans** au niveau 50, et sa capacité
arrivait à 1,26 fois seulement sous l'entier sûr en milli-unités. Remplacé par
un ancrage sur une **durée d'absence tolérée** :

```
capacité(niveau) = STOCKAGE.autonomieHeures × débitPropre(niveau)
```

Le stockage suit donc la pente de production, ×1,25, sans rupture. À niveau égal
l'autonomie vaut 12 h sur les cinquante niveaux ; elle s'effondre dès que le
stockage prend du retard sur le producteur — 6,1 h à trois niveaux d'écart,
1,6 h à neuf. `STOCKAGE.autonomieHeures` est LE réglage de confort du jeu.

### 2.5 L'écran de Défense (lots 5B partie 1, 5C, et correctif)

- **`src/ui/defense.js`** — module pur, jumeau de l'Arsenal. Grille 8 × 9 dont
  les rangées SONT les rangées 3 à 10 du champ. Budget-barrière, six occupants
  par rangée, obstacles, indice de couverture.
- **La propriété** — `creerCombat` accepte `proprietaireDefense` et
  `proprietaireAttaque` (défauts `'ouvrage'` et `'joueur'`), chaque entité porte
  `proprietaire`, et `nomAffiche` le lit **au lieu du camp**.
- **Les neuf noms joueur des défenses** — Mur de défense, Barbelés, Barrière
  anti-char, Tourelle mitrailleuse, Canon anti-char, DCA, Mirador, Artillerie
  lourde, SAM.
- **Le banc en sens Défense** (PR #11, par Claude Code) — sélecteur
  *Raid* / *Défense*, `listeDefense` dans `scene.js`, `montageDefense` dans
  `banc.js`, panneau de fin qui dit à qui est le butin.
- **Deux constantes périmées retirées de `GRILLE`** :
  `plancherPvDefenseurPct` (c'est 1 PV, pas 1 %, et ce n'est pas une grandeur
  de combat) et `reparationGratuitePct` (c'est 100 %, en une heure).
- **Le commentaire d'inertie de `DISPOSITION_DEFENSES` corrigé** — voir §4.1.

---

## 3. Ce qui reste ouvert

### 3.1 Foyer Zéro

1. **La base du joueur, en jeu.** `base.js` existe, rien ne l'importe. C'est le
   prochain vrai chantier. ⚠ Il est BLOQUÉ tant qu'Ethan n'a pas refait les
   captures : `BASE-DU-JOUEUR-1.md` §2 nomme sept bâtiments sur onze, et le
   Chantier de construction — le central, celui dont la chute rase la base —
   n'est pas nommé du tout.
2. **Le résidu entier dans `sim/economy.js`.** Correctif conçu et vérifié, PAS
   implémenté. Voir §4.4 : il supprime toute erreur d'arrondi par tick et touche
   `fluxMilliParTick`, le rattrapage analytique et le format d'état.
3. **La boucle du hors-combat à 1 Hz.** Décidé par Ethan, non implémenté. Le
   moteur de combat reste à 10 Hz.
4. **Les six tests appareil du lot 5C**, listés au `RAPPORT-lot5C-banc-defense.md`
   comme non exécutés. Claude Code les a rejoués dans un Chromium de bureau au
   gabarit 412 × 915 — **ce n'est pas un test appareil et ne le remplace pas.**
5. **`CLAUDE.md` §2 périmé** (arborescence), et §1 ne liste pas les cinq
   documents committés le 25/08.
6. **Les noms des documents sont cassés.** Les fichiers sont
   `MODELE-REPARATION-1.md`, `COURBE-DE-NIVEAU-2.md`, `BASE-DU-JOUEUR-1.md`,
   mais les trois se citent **entre eux sans suffixe**. Trois liens morts.
7. **`SPEC-FOYER-ZERO.md` l. 281** se contredit dans sa propre cellule :
   « couloir 9 × 300, format téléphone : 30 de large ». C'est 30 × 300, arbitré
   le 24/08. C'est le fichier qui fait autorité : le laisser faux, c'est laisser
   la source de vérité mentir.
8. **La garde du lot 1** (`test/clock.test.js`, test 4) : `/\bdocument\b/`
   matche « documenté », `\b` étant ASCII en JavaScript. Correctif vérifié :
   `` new RegExp(`(?<![\p{L}\p{N}_])${mot}(?![\p{L}\p{N}_])`, 'u') ``. En
   attendant, écrire « consigné » dans `src/sim/`.
9. **La tolérance du miroir, T12 du lot 2B.** Signalée par la passation
   précédente, **jamais re-mesurée**. Protocole avant de toucher : cinq
   compositions × cinq graines × les niveaux 1, 2, 10 et 30.
10. **Les valeurs manquantes du classeur** `FOYER-ZERO-BATIMENTS-JOUEUR.xlsx` :
    coûts de réparation, plafonds d'électricité, voisinage typé (rayon, bonus,
    plafond), réserve de temps de réparation.

### 3.2 Archipel Industry — non touché aujourd'hui

Le test fermé Play Store reste la priorité absolue. Les trois tests appareil
dus (T7-SILENCIEUX, T6-PONT prioritaire, T7-PONT) n'ont pas tourné, et **aucun
autre lot Android ne doit être monté avant.** A3 et A5 attendent l'arbitrage
d'Ethan. L'île 8 reste le seul chantier de contenu, sans brief.

---

## 4. Ce qui a coûté quelque chose — à ne pas réapprendre

### 4.1 « Toute artillerie avancée est inerte » était faux

`DISPOSITION_DEFENSES` raisonnait en RANGÉES. Le moteur teste une distance
**euclidienne 2D et sans direction** : `d² = (Δrangée)² + (Δcolonne)²` contre
`porteeCarree` et `porteeMiniCarree`. Une Faucheuse en rangée 3 tire dès le
tick 1 — elle atteint les colonnes lointaines à l'apparition, puis tire dans le
dos de ce qui l'a dépassée.

Mesuré, 5 graines, niveau 30, colonne 5, ticks de tir médians :

| rangée | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|
| Faucheuse | 23 | 32 | 44 | 64 | 85 | 94 | 101 | 110 |

⚠ **Ces chiffres n'ont pas bougé d'une unité après le passage à ×1,1.**

Le commentaire est corrigé. Le libellé montré au joueur dit **« engagement
réduit », jamais « inerte »**.

### 4.2 `ajouterEntite` destructure une LISTE FERMÉE

Un champ passé par l'appelant et absent de la destructuration **disparaît en
silence**. C'est ce qui s'est produit avec `proprietaire` : deux tests l'ont
attrapé, rien dans le code ne l'aurait signalé. Un avertissement est posé à
l'endroit exact. **Ajouter un champ là, c'est l'ajouter aux DEUX endroits.**

### 4.3 Changer la clé d'une fonction oblige à suivre TOUS ses appelants

`nomAffiche` est passé du camp au propriétaire. Le panneau de fin lui forge son
argument à la main :

```js
nomAffiche({ genre: 'unite', camp: 'attaque', id })   // sans proprietaire
```

Résultat : les survivants du joueur se sont affichés **« Meute » au lieu de
« Fusiliers »**, en sens Raid, pendant un commit entier. Aucun test ne couvrait
ce texte. Le T18 de `defense.test.js` garde la régression **et le piège** — il
asserte que l'appel sans propriétaire rend bien le nom de l'Ouvrage, pour que
personne ne prenne ça pour un défaut de `nomAffiche` à « corriger ».

### 4.4 L'exactitude de l'économie ne dépend PAS de la divisibilité

Objection posée, puis **retirée après vérification**. `economy.js` porte déjà la
bonne architecture : *« l'arrondi se fait UNE fois, par couple (niveau,
voisins) : le résultat est un entier, et tout ce qui en découle — tick et
rattrapage — est exact. »*

Et chercher des débits divisibles serait vain : ×1,25 vaut 5/4, il faudrait
qu'un débit contienne 4⁴⁹ ≈ 3 × 10²⁹ en facteur pour rester entier jusqu'au
niveau 50. **Impossible par construction.**

Le vrai correctif, conçu et vérifié, non implémenté : garder le débit PAR HEURE
et porter un résidu.

```
residu += debitParHeure ; gain = residu / TICKS_PAR_HEURE ; residu %= TICKS_PAR_HEURE
```

Erreur par tick : **exactement zéro**, à n'importe quelle fréquence. Rattrapage
en O(1) et exact au bit — vérifié par tirage aléatoire, 200 couples, pas-à-pas
contre formule fermée, identiques à chaque fois.

### 4.5 Un obstacle interdit de POSER, rien d'autre

Arbitré le 25/08, et c'est déjà le comportement du moteur — plus large même
qu'on ne le croyait :

- un obstacle **ne bloque personne** : pour un attaquant il ne fait que
  ralentir (`vitesse = p.vitesseObstacleMilli`) ;
- **aucun défenseur ne bouge** aujourd'hui : `deplacement()` écarte tout ce qui
  n'est pas `camp === 'attaque'`.

Les défenses mobiles pourront donc traverser comme l'offense, sans rien changer
au moteur, le jour où elles bougeront.

D'où : `poser` refuse et **lui seul**. `depuisDefenseurs` est un CHARGEMENT — il
accepte, et `bilan` juge. Trois défauts possibles, tous nés d'un contexte qui
bouge sous une composition déjà faite : `verrouilles`, `depassementBudget`,
`surObstacle`. **Le troisième est le seul qui rende le montage impossible.**
`purger` les retire sur demande. **Jamais en silence** — c'est la doctrine, et
elle vaut aussi pour l'Arsenal.

### 4.6 Le champ s'appelle `verrouilles` en défense, `verrouillees` à l'Arsenal

Masculin d'un côté, féminin de l'autre : les deux grilles ne portent pas les
mêmes objets. Recopier le nom de l'Arsenal donne `undefined.length`.

### 4.7 `listeArsenal` ne se généralise pas

Trois raisons dans la même boucle : `rangee = nbVagues - indice` donne les
rangées 4 à 1 quand la défense en veut 3 à 10 dans l'autre sens ; le genre
`'unite'` est en dur alors que la grille porte aussi des `DEFENSES` ; le camp
`'attaque'` est en dur alors qu'une garnison se dessine en `'defense'`.

### 4.8 Autres pièges rencontrés

- **`hidden` ne cachait rien.** `#banc-arsenal` fixe `display: flex` par
  sélecteur d'id (1,0,0), qui l'emporte sur `[hidden] { display: none }` (0,1,0).
  Défaut hérité du lot 5A, invisible tant qu'il n'y avait qu'un bloc à cacher.
  Corrigé par `[hidden] { display: none !important; }` en tête de feuille.
- **Un montage veut un TYPE d'obstacle.** `creerCombat` lève sur un type
  inconnu ; les types réels sont `infanterie`, `vehicule`, `les_deux`.
  L'éditeur, lui, ne lit que la case.
- **`isDisabled()` de Playwright ne connaît pas `<option>`** — il rend toujours
  `false`. Lire `element.disabled`.
- **Un montage de test doit tenir dans le budget.** Huit Faucheuses au niveau 30
  font 202 points pour un budget de 190 : un montage qui ne tient pas dans le
  budget ne prouve rien.
- **L'API GitHub est en rate-limit partagé** sur cette machine. Passer par
  `codeload.github.com/<repo>/tar.gz/refs/heads/main`, et pour une PR par
  `refs/pull/<n>/head`.

---

## 5. La méthode, telle qu'elle a évolué aujourd'hui

**La règle a changé, et c'est le changement le plus important de la session.**

> Quand la livraison est un FICHIER DU DÉPÔT, ne pas rédiger de brief pour
> Claude Code. Écrire directement le fichier, le vérifier par exécution
> (`node --check` + suite de tests sur une copie du dépôt), le livrer dans
> `/mnt/user-data/outputs/` et dire à Ethan le REPO et le DOSSIER exacts. C'est
> lui qui commite.

La ligne de partage n'est pas la taille du lot, **c'est la vérifiabilité** :

- **Vérifiable par exécution → direct.** Modules purs, données, tests, moteur.
- **Pas vérifiable ici → brief.** Tout ce qui touche le DOM. Le dépôt n'a ni
  jsdom ni navigateur de test, et `esbuild` est sa seule dépendance de
  développement.

C'est exactement ainsi que le lot 5B a été coupé en deux : le cœur pur livré
directement et prouvé à 148/148, le banc confié à Claude Code par un brief court.

**Ce qui n'a pas changé** :

- Le **merge sur `main` appartient à Ethan seul.**
- **Ne jamais assouplir un test pour le faire passer.** Recalculer un seuil, oui.
  Retourner un garde-fou en disant pourquoi, oui. Baisser une borne, jamais.
  Audit systématique du compte d'assertions avant/après.
- **Les seuils se calculent, ne se devinent pas.** Cinq graines et une médiane
  au minimum ; une seule graine ne mesure rien.
- **Vérifier avant d'affirmer.** Trois affirmations de brief se sont révélées
  fausses aujourd'hui, toutes trois écrites par moi : l'inertie de l'artillerie
  avancée, `depuisDefenseurs` qui « refuse les cases interdites », et le calcul
  des points d'armée offensifs (25 au niveau 1, pas 45 ; 270 au niveau 50, pas
  290 — c'est Ethan qui l'a relevé).
- **Vocabulaire** : l'adversaire est **l'Ouvrage**, jamais « l'IA ». Deux jeux
  de noms, jamais mélangés dans une chaîne affichée.

---

## 6. Livrables hors dépôt de cette session

- **`FOYER-ZERO-BATIMENTS-JOUEUR.xlsx`** — cinq onglets : les onze bâtiments
  avec provenance ligne à ligne, les effets chiffrés classés ARBITRÉ / TA /
  MANQUANT, les PV par niveau sur les deux courbes, et les quatorze trous.
  Ethan l'a rempli en deux passes. ⚠ Feuille de saisie, **jamais une source** :
  ce qui est arbitré part dans `src/data/`, et c'est `src/data/` qui fait foi.
- **`BRIEF-lot5B-ecran-defense.md`** — **PÉRIMÉ, ne pas envoyer.** Son cœur a
  été livré directement ; seul son §4 garde de la valeur documentaire.
- **`BRIEF-lot5C-banc-defense.md`** — exécuté, PR #11 mergée.
