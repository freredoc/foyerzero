# CLAUDE.md — Foyer Zéro

À lire en premier, à chaque session. Fait autorité sur ce document-ci ;
pour le contenu du jeu, voir la hiérarchie ci-dessous.

**Foyer Zéro** (codename interne : *Chantier*) — jeu de guerre idle solo, hors ligne,
distribué comme un fichier HTML autonome, avec enveloppe Android WebView et
auto-update par GitHub Pages. Paquet : `fr.freredoc.foyerzero`.

Dernière révision : **26/08/2026**, version 0.12.0 · build 12.

---

## 0. Premier geste, sans exception

1. Lire ce fichier.
2. Lire la **passation la plus récente** — `PASSATION-<date>.md` à la racine.
   Elle dit où en est le projet, ce qui est ouvert et ce qui a coûté cher.
3. **Lister** la racine, `src/`, `src/data/`, `src/sim/`, `src/render/`,
   `src/ui/` et `test/`. Ne jamais se fier à la mémoire pour l'arborescence, ni
   à la §2 de ce fichier : **elle a déjà menti, deux fois.** Elle est relevée le
   26/08/2026 ; elle sera périmée le jour où quelqu'un ajoutera un fichier.
4. `npm ci && npm run check` **avant de toucher quoi que ce soit**, et consigner
   le compte de tests obtenu. Un lot qui démarre sur une base rouge sans le
   savoir est un lot perdu.

**Référence au 26/08/2026, à confronter :** `npm test` → **154 pass / 0 fail**,
`npm run build` → `dist/index.html`, **81 236 octets**, 0 référence externe.

---

## 1. Qui fait autorité

Dans cet ordre, sans exception :

| Rang | Fichier | Statut |
|---|---|---|
| 1 | `SPEC-FOYER-ZERO.md` | **la spécification. Arbitrée par Ethan. Fait autorité.** |
| 2 | `src/data/*.js` | transcription figée de la spec, **seule source lue par le code** |
| 3 | `PASSATION-*.md` (la plus récente) | état du projet, décisions du jour, pièges |
| 4 | `MODELE-REPARATION-1.md`, `COURBE-DE-NIVEAU-2.md`, `BASE-DU-JOUEUR-1.md`, `PATCH-grille-vagues-portrait.md` | arbitrages des 24–25/08, dictés par Ethan |
| 5 | `ANNEXE-STATS.md`, `MODELE-COMBAT.md`, `MODELE-ECONOMIQUE.md`, `ROSTER.md`, `ARBRE-RECHERCHE.md` | appui, partiellement périmés |
| 6 | `RELEVE-TA-*.md`, `REFERENCE-TA.md`, `COMPTE-RENDU.md`, `AUDIT-CALIBRAGE.md`, `SESSION-RELEVE-BUTIN.md`, `SYNTHESE-ET-PLAN.md`, `RAPPORT-*.md` | matière première et historique |

**Pour les sprites, une hiérarchie à part** — `FICHE-STYLE.md` dit COMMENT
dessiner et fait foi sur le style ; `INVENTAIRE-SPRITES.md` dit QUOI dessiner et
sous quel nom de fichier, et fait foi sur la liste ; `BRIEF-SPRITES-IA.md` dit
COMMENT LE DEMANDER à un modèle d'image. Les trois se lisent ensemble, aucun ne
remplace les deux autres. Les étalons visuels sont dans `art/etalon/`.

⚠ **Les documents du rang 4 se citent entre eux SANS leur suffixe** —
`MODELE-REPARATION-1.md` renvoie à `COURBE-DE-NIVEAU.md` et à
`BASE-DU-JOUEUR.md`, qui n'existent pas sous ce nom. Trois liens morts. Lire les
suffixes comme s'ils n'y étaient pas.

### Les classeurs `.xlsx` ne sont PAS des sources

`FOYER-ZERO-BATIMENTS-JOUEUR.xlsx`, `FOYER-ZERO-CALIBRAGE-2.xlsx`,
`FOYER-ZERO-LEXIQUE.xlsx`, `FOYER-ZERO-PROPORTIONS-IA.xlsx`,
`FOYER-ZERO-RECHERCHE.xlsx`, `GABARIT-CALIBRAGE-vide.xlsx` sont des **feuilles
de saisie**. Le classeur de calibrage est resté à l'état d'avant l'audit du
23/08 : noms d'unités manquants, Perceurs déclaré anti-véhicule, Broyeur
anti-structure, Guetteur anti-véhicule en défense, colonne `credit` alors que
les crédits n'existent plus, formules de couverture latérale cassées.

**Ne jamais lire un `.xlsx` pour coder.** Tout ce qui est arbitré est déjà dans
`src/data/`. Si une valeur manque, elle se demande à Ethan — elle ne se récupère
pas dans le classeur.

### Sections périmées, à ne pas suivre

- `SPEC-FOYER-ZERO.md` l. 281 se contredit dans sa propre cellule : « couloir
  **9 × 300**, format téléphone : 30 de large ». C'est **30 × 300**, arbitré le
  24/08. ⚠ C'est le fichier de rang 1 : le laisser faux, c'est laisser la source
  de vérité mentir. **Toujours ouvert.**
- `SPEC-FOYER-ZERO.md` §1 et §2, constante « réparation gratuite 70 % » :
  **périmée**, c'est 100 % en une heure (`MODELE-REPARATION-1.md` §3). Idem pour
  « plancher de PV des défenseurs : 1 % » — c'est **1 PV**, et ce n'est pas une
  grandeur du moteur de combat mais une écriture d'après-raid.
- `ROSTER.md` §4 (grille 5 × 4 des châssis) et §9 (cases vides) : périmés par la
  suppression des châssis *Pièce* et *Masse*. Trois châssis seulement.
- `ROSTER.md` : contrainte Affût/Dard du palier 5, dette DA du Dard — **tombées**,
  il n'y a plus d'anti-aérien offensif.
- `MODELE-ECONOMIQUE.md` §5 (composition de site, butin par bâtiment) : remplacé
  par `SPEC-FOYER-ZERO.md` §8 et `src/data/sites.js`.

---

## 2. Arborescence réelle

Relevée le **26/08/2026**, fichier par fichier. **La lister quand même.**

```
src/index.src.html      point d'entrée ; son <script type="module"> est LE point d'entrée JS

src/data/               toutes les valeurs de calibrage — RIEN d'autre n'a le droit d'en porter
  params.js             économie du lot 1 : colis, flux continu, adjacence, stockage
  combat.js             grille, unités, défenses, modules, ciblage, écrasement, obstacles
  sites.js              bâtiments de site, butin, densité, garnisons, vagues, recherche, géographie
  niveaux.js            courbe de niveau du COMBAT — PV et dégâts
  economie.js           courbe des COÛTS et de la PRODUCTION — distincte de la précédente
  base.js               les onze bâtiments de la base du joueur (aucun code ne l'importe encore)

src/sim/                simulation déterministe, sans DOM
  rng.js  clock.js  state.js  economy.js  grille.js  combat.js  generateur.js

src/render/             rendu, sans DOM non plus : rend des primitives — QUATRE fichiers
  projection.js  canvas2d.js  interpolation.js  scene.js

src/ui/                 le banc d'essai et ses éditeurs — TROIS fichiers
  banc.js               SEUL fichier du dépôt qui touche le DOM
  arsenal.js            éditeur d'assaut — module PUR
  defense.js            éditeur de garnison — module PUR

test/                   quinze *.test.js (node:test) ; prereglages-lot3a.js n'est PAS un test
  arsenal  assaut  banc  cible  clock  combat  defense  economy
  generateur  grille  rendu  repli  rng  roster  state

tools/build.js          src/ → dist/index.html, un seul fichier autonome
android/                enveloppe WebView (app/) + module maj/ (Kotlin, 7 classes, 7 tests JVM)
art/etalon/             étalons visuels des sprites : joueur/, ennemi_pale/, ennemi_sombre/
.github/workflows/ci.yml   web (build + tests) · android (tests JVM + APK) · pages (main seul)
```

`dist/` est un produit de build, jamais commité. Le job `pages` **rebuilde le
HTML dans le job** et génère le manifeste à partir de CE HTML : la
désynchronisation code/livrable est structurellement impossible.

### Deux fichiers de la racine qui ne sont pas ce qu'ils paraissent

- **`verif.mjs` est MORT.** Il plante à l'import : il demande
  `MATRICE_COLONNES` à `src/data/combat.js`, qui exporte `COLONNES_DEGATS`
  depuis un lot antérieur. Et même l'import réparé, sa boucle teste `u.matrice`
  sur des unités qui portent `u.degats` : elle sauterait tout **en silence** et
  afficherait « ok ». Il n'est pas dans `npm run check`, donc rien ne le
  signale. **Ne pas s'y fier tant qu'il n'est pas réparé ou supprimé.**
- **`foyer-zero-ui.html` est une maquette**, pas un livrable ni une source du
  build. Le jeu est `src/index.src.html`.

---

## 3. Commandes

```
npm ci
npm run build     # node tools/build.js → dist/index.html
npm test          # node --test "test/*.test.js"
npm run check     # build + tests, à passer avant toute livraison
```

Le build **sort en erreur** si le HTML produit référence quoi que ce soit
d'extérieur. L'offline est non négociable.

⚠ **Le dépôt n'a ni jsdom ni navigateur de test.** `esbuild` est sa seule
dépendance de développement, et ce n'est pas un oubli. Ce qui touche le DOM ne
s'automatise donc pas ici : ça se teste sur appareil, et un test appareil non
exécuté se déclare **non exécuté**, jamais passé.

---

## 4. Conventions

- **ESM**, `"type": "module"`. Français dans le code, les commentaires et les
  messages.
- **Toutes les valeurs de calibrage vivent dans `src/data/`**, jamais en dur dans
  `src/sim/`. **Une seule table fait foi par grandeur** : ne jamais dupliquer un
  niveau de déblocage ou un barème d'une table à l'autre. Et quand deux
  grandeurs qui partageaient une constante divergent, **séparer les fichiers** —
  un commentaire ne suffit pas (c'est l'origine d'`economie.js`).
- **Déterminisme strict** : PRNG explicite, boucle de combat à 10 Hz,
  arithmétique entière pour l'économie par tick. Aucun `Math.random`, aucune
  dépendance à l'horloge murale dans la simulation.
- **Aucun débit ne s'arrondit par tick.** Un débit se range PAR HEURE, entier,
  et le porteur garde un résidu — voir §6, « Sur l'économie ». La conversion
  passe par `TICKS_PAR_HEURE` de `sim/clock.js`, et par elle seule.
- **Deux jeux de noms.** Le joueur emploie le vocabulaire d'une armée régulière
  (Fusiliers, Grenadiers, Mur de défense…), l'Ouvrage celui des outils et des
  bêtes (Meute, Perceurs, Merlon…). Même ligne de données, `nom.joueur` et
  `nom.ouvrage`. Ne jamais les mélanger dans une chaîne affichée.
  ⚠ **La clé est le PROPRIÉTAIRE, pas le camp.** `camp` désigne un côté de la
  grille, `proprietaire` désigne à qui c'est. Le joueur peut défendre.
- **Rien ne se retire en silence.** Quand le contexte bouge sous une composition
  déjà faite — niveau descendu, obstacle apparu — on le SIGNALE dans le bilan et
  on propose de purger. Jamais d'amputation automatique.
- **Un indice n'est pas une interdiction.** Le joueur doit pouvoir se tromper
  exprès.
- `node --check` ne prouve que la syntaxe. Un fichier de données se valide **en
  l'important et en asseyant ses invariants** (sommes, bornes, références
  croisées).

---

## 5. Livraison

**Deux chemins, et la ligne de partage n'est pas la taille du lot — c'est la
vérifiabilité.**

- **Vérifiable par exécution ici** (module pur, données, tests, moteur) → le
  fichier s'écrit directement, se vérifie (`node --check` + suite complète sur
  une copie du dépôt), se livre dans `/mnt/user-data/outputs/` avec le REPO et
  le DOSSIER exacts. **Pas de brief.** C'est Ethan qui commite.
- **Pas vérifiable ici** (tout ce qui touche le DOM) → brief pour Claude Code,
  qui ouvre une **PR**.

Dans les deux cas :

- Le **merge sur `main` appartient à Ethan seul.**
- Toujours dire si la livraison laisse la suite **verte ou rouge, mesuré et non
  estimé**, et découper pour que ce qui peut être commité tout de suite le soit
  sans casser `main`. **Et dire quand ce n'est PAS découpable** : un lot qui
  change une unité de mesure se commite d'un bloc ou laisse `main` rouge.
- Un lot confié à Claude Code produit un `RAPPORT-<lot>.md` **écrit sur disque**,
  nom descriptif. Contenu minimal : version et build réellement produits,
  fichiers touchés, résultat de chaque test (PASS/KO et montage effectif),
  écarts par rapport au brief et leurs raisons, points laissés en suspens.
- Le brief ne propose **aucun numéro de version** : bumper `version` et
  `config.build` de `package.json` ensemble, au numéro disponible au moment de
  l'exécution.
- Ne jamais signaler un défaut connu au moment de livrer : le corriger avant.

### Les tests ne s'assouplissent jamais

Recalculer un seuil parce qu'une constante a bougé : oui. Retourner un garde-fou
en écrivant pourquoi : oui. **Baisser une borne pour faire passer un lot :
jamais.** Auditer le compte d'assertions avant et après, et ne jamais supprimer
une assertion sans le dire.

Les seuils **se calculent, ne se devinent pas**. Cinq graines et une médiane au
minimum : une seule graine ne mesure rien.

**Un montage doit être falsifiable.** Asserter d'abord que le montage mesure
quelque chose — qu'un débit n'est pas divisible avant de tester un résidu, qu'un
bonus n'est pas nul avant de le comparer, qu'un stock sature bien dans la
fenêtre. Un test qui passerait aussi sur du code cassé ne prouve rien.

---

## 6. Pièges connus

### Sur les données

- Le classeur et la spec divergent (§1). La spec gagne, toujours.
- `CIBLAGE-DEFENSE` du classeur porte trois niveaux d'apparition divergents de
  `UNITES` : **`UNITES` fait foi**, arbitré le 24/08. Il n'existe **pas** de
  champ `defense.apparition` — l'asserter par `hasOwnProperty`, jamais par
  `!== undefined` sur une valeur calculée.
- La carte fait **30 × 300**, pas 9 × 300 : le « 9 » de la §10 de la spec est une
  contamination de la largeur de la grille de combat. Arbitré le 24/08.
- Le glossaire des modules ne dit pas qui les porte. Les affectations sont dans
  `UNITES[x].module` / `moduleOuvrage`, pas dans la colonne de description.
- **Deux courbes, à ne jamais confondre.** `NIVEAU` (`niveaux.js`) est la courbe
  du COMBAT — pente unique 1,1 depuis le 25/08. `BUTIN` et `ECONOMIE_NIVEAU`
  portent la courbe ÉCONOMIQUE — deux régimes, 1,259 puis 1,32. `facteurMilli`
  sert la première, `facteurEconomiqueMilli` la seconde. Un test asserte que la
  divergence est bien celle qu'on a voulue, et il tombera si on les réaligne.

### Sur l'économie

- **`sim/economy.js` range un débit PAR HEURE, jamais par tick.** Chaque
  bâtiment porte `residuFlux` dans l'état ; l'erreur d'arrondi par tick est
  exactement nulle, à n'importe quelle fréquence. Le nom de la fonction est
  `debitMilliParHeure` — `fluxMilliParTick` n'existe plus, et le recréer
  réintroduirait un arrondi qui coûtait jusqu'à 0,71 % de production.
- **Le rattrapage ne calcule JAMAIS `nbTicks × debit`.** Sur une longue absence
  ce produit atteint 4,2 × 10¹⁸, soit 471 fois au-dessus de l'entier sûr — la
  formule fermée « évidente » dérive en silence. Il décompose `nbTicks` en
  heures pleines + reste (arithmétique modulaire) et **borne les heures pleines
  à ce qu'il faut pour saturer** : au-delà le stock vaut la capacité de toute
  façon, donc le produit n'a plus à être exact, donc il n'a plus le droit d'être
  grand.
- **`DEBIT_MILLI_PAR_HEURE_MAX`** (2,502 × 10¹¹ milli/h à 10 Hz) est le seuil
  au-delà duquel l'exactitude tomberait. Le débit le plus lourd du jeu —
  collecteur niveau 50 de `data/base.js`, 13 452 465 unités/h — est **19 fois
  dessous seulement**. La marge est réelle et pas confortable : le rattrapage
  **lève** si elle est franchie, plutôt que de dériver. Une donnée future qui
  multiplierait un débit par 20 doit faire descendre la fréquence de tick, pas
  franchir le seuil.
- **Le résidu avance MÊME stockage plein.** Le geler casserait l'exactitude du
  rattrapage : la composition `min(cap, min(cap, x+a)+b) = min(cap, x+a+b)` ne
  tient que si les gains sont indépendants de l'état du stock. Un test le garde,
  avec le commentaire qui dit pourquoi.
- **`sim/economy.js` ne connaît qu'une capacité de stockage globale**
  (`params.stockage.capaciteMilli`). La capacité par bâtiment de `data/base.js`
  — `capaciteDuNiveau()`, ancrée sur `STOCKAGE.autonomieHeures` — n'est lue par
  personne, comme `base.js` tout entier.
- **BigInt reste obligatoire** pour les points de recherche : le plafond du
  barème tient largement, mais le produit complet atteint encore 5,2 × 10²¹.
- **`butinPlein` n'est délibérément PAS refactorisé.** La multiplication
  flottante n'est pas associative : regrouper les facteurs autrement déplace le
  butin d'une unité, et six tests le mesurent au champ près.

### Sur le moteur de combat

- **Un obstacle interdit de POSER, rien d'autre.** Il ne bloque le déplacement
  de personne : pour un attaquant il ne fait que ralentir. Et aucun défenseur ne
  bouge aujourd'hui — `deplacement()` écarte tout ce qui n'est pas
  `camp === 'attaque'`.
- **La portée se teste en euclidien 2D et sans direction** :
  `d² = (Δrangée)² + (Δcolonne)²`. Raisonner en rangées seules donne des
  conclusions fausses — c'est ce qui avait fait écrire, à tort, qu'« une
  artillerie avancée est inerte ».
- **`ajouterEntite` destructure une LISTE FERMÉE.** Un champ passé par
  l'appelant et absent de cette liste disparaît en silence. L'ajouter, c'est
  l'ajouter aux DEUX endroits.
- Un montage veut un **type** d'obstacle : `infanterie`, `vehicule` ou
  `les_deux`. Un type inconnu fait lever `creerCombat`.
- **Changer la clé d'une fonction oblige à suivre TOUS ses appelants.**
  `nomAffiche` est passé du camp au propriétaire, et le panneau de fin lui
  forgeait son argument à la main : les survivants du joueur se sont affichés
  « Meute » pendant un commit entier. Le T18 de `defense.test.js` garde la
  régression **et le piège**.

### Sur les tests et l'outillage

- **La garde du lot 1** (`test/clock.test.js`, test 4) scanne avec
  `/\bdocument\b/`. `\b` est ASCII en JavaScript : **le mot « documenté » la
  déclenche**. Écrire « consigné » dans `src/sim/`, ou corriger la garde avec
  `` new RegExp(`(?<![\p{L}\p{N}_])${mot}(?![\p{L}\p{N}_])`, 'u') ``.
  **Toujours ouvert.**
- **Un montage de test doit tenir dans le budget** — sinon il ne prouve rien.
  Huit Faucheuses au niveau 30 font 202 points pour un budget de 190.
- **`[hidden]` ne cache rien contre un sélecteur d'id.** `#banc-arsenal` fixe
  `display: flex` (spécificité 1,0,0) et l'emporte sur `[hidden]` (0,1,0). D'où
  le `!important` en tête de feuille.
- **`isDisabled()` de Playwright ne connaît pas `<option>`** — il rend toujours
  `false`. Lire `element.disabled`.
- **L'API GitHub est en rate-limit partagé.** Passer par
  `codeload.github.com/<repo>/tar.gz/refs/heads/main`, et pour une PR par
  `refs/pull/<n>/head`.

### Sur le vocabulaire

- Ne jamais dire « l'IA » en parlant de l'adversaire : c'est **l'Ouvrage**.
- Sur l'écran de Défense : **« engagement réduit »**, jamais « inerte ».
- Le champ du bilan s'appelle `verrouilles` en défense et `verrouillees` à
  l'Arsenal. Les deux grilles ne portent pas les mêmes objets, et recopier le
  nom de l'Arsenal donne `undefined.length`.

### Sur la méthode

- **Vérifier avant d'affirmer.** Les erreurs les plus coûteuses du projet sont
  toutes des affirmations écrites sans mesure : l'inertie de l'artillerie
  avancée, `depuisDefenseurs` qui « refuserait les cases interdites », le calcul
  des points d'armée offensifs, la borne de débordement de l'économie
  (annoncée « deux fois sous l'entier sûr », mesurée 471 fois au-dessus), la
  marge du seuil de débit (annoncée 19 000, mesurée 19). Une grandeur qui
  s'écrit se calcule d'abord.
