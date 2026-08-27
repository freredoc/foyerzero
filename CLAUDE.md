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

**Référence au 26/08/2026 (après le lot COLIS), à confronter :** `npm test` →
**233 pass / 0 fail**, `npm run build` → `dist/index.html`, **81 236 octets**,
0 référence externe. Le HTML n'a pas bougé d'un octet depuis le lot RÉSIDU :
`src/index.src.html` n'importe toujours que `ui/banc.js`.

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

⚠ **Les suffixes numériques font partie des noms.** Les documents du rang 4 se
citaient entre eux SANS leur suffixe — `MODELE-REPARATION.md`,
`COURBE-DE-NIVEAU.md`, `BASE-DU-JOUEUR.md`, plus `FOYER-ZERO-CALIBRAGE.xlsx` :
neuf références vers des fichiers qui n'existent pas sous ce nom. **Réparées le
26/08** dans les cinq documents concernés. Les fichiers n'ont PAS été renommés,
délibérément : les renommer aurait cassé toutes les citations des passations et
des rapports, qui font l'historique. En écrire une nouvelle : copier le nom de
fichier, ne jamais le retaper.

Trois références restent volontairement sans cible : `BRIEF-lot5B-*.md` et
`BRIEF-lot5C-*.md` (livrables hors dépôt, `PASSATION-2026-08-25.md` §6) et
`chantier-economie.xlsx` (`RAPPORT-LOT-1.md`). Elles se disent telles.

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

- ~~`SPEC-FOYER-ZERO.md` l. 281, « couloir 9 × 300 »~~ — **corrigé le 26/08**,
  la cellule dit maintenant 30 × 300, conforme à `GEOGRAPHIE.carte` de
  `sites.js`. C'était le fichier de rang 1 qui mentait.
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

src/data/               toutes les valeurs de calibrage — 6 fichiers ; RIEN d'autre n'a le droit d'en porter
  params.js             économie du lot 1 : colis, flux continu, adjacence, stockage
  combat.js             grille, unités, défenses, modules, ciblage, écrasement, obstacles
  sites.js              bâtiments de site, butin, densité, garnisons, vagues, recherche, géographie
  niveaux.js            courbe de niveau du COMBAT — PV et dégâts
  economie.js           courbe des COÛTS et de la PRODUCTION — distincte de la précédente
  base.js               les onze bâtiments de la base du joueur (aucun code ne l'importe encore)

src/sim/                simulation déterministe, sans DOM — 10 fichiers
  rng.js  clock.js  state.js  economy.js  grille.js  combat.js  generateur.js
  champs.js             terrain d'une base : 12 cases tirées de la POSITION
  disposition.js        validation, voisinage TYPÉ, débits d'une base posée
  economie-base.js      le TICK : stocks, saturation, rattrapage analytique

src/render/             rendu, sans DOM non plus : rend des primitives — 4 fichiers
  projection.js  canvas2d.js  interpolation.js  scene.js

src/ui/                 le banc d'essai et ses éditeurs — 3 fichiers
  banc.js               SEUL fichier du dépôt qui touche le DOM
  arsenal.js            éditeur d'assaut — module PUR
  defense.js            éditeur de garnison — module PUR

test/                   21 fichiers *.test.js (node:test) ; prereglages-lot3a.js n'est PAS un test
  arsenal  assaut  banc  base  champs  cible  clock  combat  defense
  disposition  documentation  donnees  economie-base  economy  generateur
  grille  rendu  repli  rng  roster  state
  ⤷ documentation.test.js : les COMPTES de ce fichier-ci sont assertés contre
    le disque. Ajouter un test ou un fichier sans mettre §0 et §2 à jour rend
    la suite ROUGE. C'est voulu — §2 a menti deux fois, §0 quatre.
  ⤷ base.test.js croise base.js et sites.js : ne pas le déplacer sans lire
    pourquoi (appariements Ouvrage, dans les deux sens).
  ⤷ base.test.js : invariants de src/data/base.js — roster des onze, classes
    de coût, emplacements, géométrie, champs, débits, stockage. AJOUTÉ le
    26/08 (lot BASE-0) : le fichier vivait depuis un mois sans un seul test.
  ⤷ donnees.test.js : invariants des tables de src/data/ — sommes, bornes,
    références croisées. Il REMPLACE l'ancien verif.mjs de la racine.

tools/build.js          src/ → dist/index.html, un seul fichier autonome
android/                enveloppe WebView (app/) + module maj/ (Kotlin, 7 classes, 7 tests JVM)
art/etalon/             étalons visuels des sprites : joueur/, ennemi_pale/, ennemi_sombre/
.github/workflows/ci.yml   web (build + tests) · android (tests JVM + APK) · pages (main seul)
```

`dist/` est un produit de build, jamais commité. Le job `pages` **rebuilde le
HTML dans le job** et génère le manifeste à partir de CE HTML : la
désynchronisation code/livrable est structurellement impossible.

### Un fichier de la racine qui n'est pas ce qu'il paraît

**`foyer-zero-ui.html` est une maquette**, pas un livrable ni une source du
build. Le jeu est `src/index.src.html`.

### `verif.mjs` a été supprimé le 26/08 — et pourquoi

Il portait seize invariants de données et **aucune commande ne le lançait**. Il
avait pourri sans que rien ne le dise : il importait `MATRICE_COLONNES`,
renommé `COLONNES_DEGATS` depuis, donc il plantait à l'import. Et même l'import
réparé, sa boucle testait `u.matrice` sur des entités qui portent `u.degats` :
elle aurait sauté toutes les entités **en silence** et affiché « ok ».

Ses invariants vivent maintenant dans `test/donnees.test.js`, dans
`npm run check`. **Un audit hors de `npm run check` ne s'exécute pas, donc
n'existe pas** — ne pas en recréer un.

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
- Bumper `version` et `config.build` de `package.json` **ensemble**, au numéro
  disponible au moment de l'exécution, et **seulement quand `dist/index.html`
  change**. Un lot qui ne touche que des tests ou de la documentation laisse le
  HTML identique à l'octet, donc son SHA-256 et le manifeste de Pages aussi :
  bumper y pousserait une mise à jour aux appareils pour rien. S'en abstenir, et
  le dire. Un brief ne propose jamais de numéro.

### ⚠ La forme de la livraison — Ethan travaille sur TÉLÉPHONE

**Dès qu'une livraison compte strictement plus de DEUX fichiers, livrer une
archive ZIP unique.** Son arborescence reproduit celle du dépôt (racine,
`src/sim/`, `test/`…), elle inclut le `RAPPORT-*.md`, et un
`LISEZ-MOI-DEPOT.md` en tête donne les étapes de dépôt. À deux fichiers ou
moins, livrer les fichiers tels quels.

⚠ **Ne jamais écrire « décompresse le zip à la racine du dépôt » : GitHub ne
décompresse pas une archive.** Le gain du zip est sur le TÉLÉCHARGEMENT — un
fichier au lieu de onze. L'extraction se fait sur le téléphone, et le
téléversement dossier par dossier via *Add file → Upload files*. Piège à
signaler : téléverser depuis la racine des fichiers destinés à `test/` les
dépose à la racine.

**Vérifier le zip dans les conditions d'usage** : le décompresser sur une copie
fraîche de `main` et y relancer `npm run check` avant de le livrer.

### Le rapport de lot entre au dépôt

`RAPPORT-<lot>.md` se commite à la racine, avec les autres. Sans lui, ce
document affirme des seuils — « 100 ppm », « 19 fois », « 471 fois au-dessus »
— sans que rien ne dise d'où ils sortent.
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
- **La base du joueur n'a pas de géométrie propre.** Elle EST la bande
  `batiments` de `GRILLE` (`data/combat.js`) : rangées 11–18 × 9 colonnes,
  72 cases. Arbitré le 26/08 — base du joueur, base de l'Ouvrage, camp et
  avant-poste ont la même géométrie. `GEOMETRIE_BASE` de `base.js` la
  RÉFÉRENCE ; en écrire une seconde, même identique, casserait la propagation.
  Corollaire : le plafond d'emplacements du Chantier (40) mord toujours, il
  reste 32 cases qu'aucun niveau n'ouvrira.
- **`sim/economie-base.js` fait passer le temps**, et il vit À CÔTÉ de
  `sim/economy.js`, il ne le remplace pas. L'ancien porte encore le modèle du
  lot 1 et reste branché à `state.js` ; le débrancher est un lot à part qui
  devra aussi retirer les colis et bouger `SAVE_VERSION` — une seule migration
  pour les deux.
  ⚠ **UN STOCK AU-DESSUS DU PLAFOND EST GELÉ, JAMAIS AMPUTÉ.** Arbitré le 26/08.
  Perdre une raffinerie ne prend rien au joueur : le stock cesse de monter, il
  ne tombe pas. Le plafond effectif d'un tick est `max(cap, stock)`, pas `cap`.
  C'est « rien ne se retire en silence » appliqué au stock.
  ⚠ **Le résidu est par (bâtiment, RESSOURCE), pas par bâtiment.** Une
  raffinerie produit dans deux ressources à la fois ; un résidu unique les
  mélangerait et les deux flux dériveraient sans que le total bouge.
  ⚠ **La marge d'exactitude est de 5,47, pas de 19.** Le 19 avait été mesuré sur
  le collecteur de niveau 50 SEUL, avant que le voisinage n'entre au modèle. Le
  pire cas réel est un collecteur niveau 50 entouré de huit raffineries :
  45 738 385 u/h.
- **Livraison : `src/` et `test/` ne voyagent JAMAIS dans la même archive.**
  Le dépôt se met à jour depuis un téléphone et le sélecteur n'affiche que les
  noms courts : `economy.js` et `economy.test.js` s'y confondent. Deux dépôts de
  suite sont tombés à côté avant que la règle soit posée. Archive 1 = tout ce
  qui va dans `src/`, archive 2 = `test/` + racine. `main` est ROUGE entre les
  deux, et c'est le garde-fou qui le dit — c'est voulu.
- **Un état ne se construit pas qu'avec le constructeur du module.** Les douze
  premiers tests d'`economie-base` partaient tous de `creerEtatEconomie`, donc de
  zéro — et depuis zéro un stock ne peut jamais dépasser sa capacité, ce qui
  était EXACTEMENT le seul état où tick et rattrapage divergeaient. 197
  divergences sur 300 bases, invisibles à douze tests verts. Les états HÉRITÉS
  (sauvegarde d'avant, base amputée par un raid) se posent à la main.
- **`sim/disposition.js` compte les voisins et calcule les débits**, et il ne
  fait QUE ça : il ne pose rien, ne retire rien, ne corrige rien.
  `problemesDeDisposition` rend une LISTE de défauts — tous, pas le premier — et
  ne lève JAMAIS pour une faute de jeu. Elle ne lève que pour une faute de
  programme (structure absente, indice hors liste). C'est « rien ne se retire en
  silence » (§4) appliqué : on signale au joueur, il purge.
  ⚠ **Aucun plafond de voisins autre que la géométrie.** Le lot 1 plafonnait à
  deux (`params.adjacence.maxVoisins`) ; ce modèle-ci compte les huit cases.
  Confondre les deux divise la production par quatre.
  ⚠ **L'arrondi se fait PAR TYPE de voisin, puis se multiplie.** Arrondir la
  somme donne 281 là où le jeu dit 282 (centrale niveau 3, trois champs) — un
  écart d'une unité qui se creuse ensuite, et un test le mesure exprès.
  ⚠ **`productionParRessource` est le point d'entrée, pas `ressourceProduite`.**
  Cette dernière rend `null` dans DEUX situations sans rapport — « mal posé » et
  « plusieurs ressources à la fois ».
  ⚠ **« La ressource du voisin » NE SE GÉNÉRALISE PAS**, et c'est le piège de
  tout ce modèle. Une centrale qui touche trois champs de scorie produit de
  l'ÉLECTRICITÉ, pas de la scorie. Le discriminant est `BASE_BATIMENTS[x].ressource` :
  `quartzOuScorie` et `electricite` ont une ressource propre et tout y va, bonus
  compris ; seule la raffinerie (`quartzEtScorie`) n'en a pas, et alors chaque
  voisin apporte la sienne. Arbitré le 26/08 — une raffinerie niveau 1 entourée
  de 2 collecteurs à quartz et 3 à scorie produit **144/h de quartz et 216/h de
  scorie**, jamais 360 d'un mélange.
  ⚠ **`indetermine` est un signal, pas une valeur.** Ce qui n'a pas pu être
  attribué — l'apport d'un collecteur posé hors champ — y tombe plutôt que
  d'être versé au hasard. Sur une disposition valide il n'apparaît jamais.
  ⚠ **Une disposition se décrit comme un site de l'Ouvrage** :
  `{ id, rangee, colonne, niveau }`, un bâtiment par case. C'est déjà la forme
  que produit `placerBatiments` du générateur — même géométrie, même écriture.
- **Le tirage des champs vit dans `sim/champs.js`.** `champsDeLaBase(rangée,
  colonne)` rend le terrain, fonction de la SEULE position. Deux règles y sont
  DÉDUITES et non dictées, et il faut le savoir avant de les changer : deux
  blocs de même ressource ne se touchent jamais par un côté (sinon deux blocs de
  deux se lisent comme un bloc de quatre), et le contact en diagonale reste
  permis. Les blocs se recomptent depuis les cases par composantes connexes —
  ne jamais vérifier une taille de bloc en relisant ce que le tirage croit avoir
  posé, il serait juge de sa propre partie.
- **Le champ décide de la ressource du collecteur** qui s'y pose — arbitré le
  26/08. C'est pourquoi `BASE_BATIMENTS.collecteur.ressource` vaut
  `quartzOuScorie` : la réponse n'est pas dans la ligne du bâtiment, elle est
  sous lui. **Et c'est tout ce que le terrain lui donne** : arbitré le 26/08,
  le Collecteur ne touche AUCUN bonus par champ voisin. **Asymétrie voulue**,
  pas trou : la production suit ×1,25 quand les coûts suivent ×1,32, et c'est ce
  décrochage qui pousse vers le raid — un multiplicateur de terrain sur le
  Collecteur amplifierait le canal qu'on a laissé décrocher exprès.
  ⚠ `champDeScorie: 60` sur la Centrale est donc **LE SEUL bonus de terrain de
  toute la table**, et un test l'asserte de face. Un autre asserte la forme
  EXACTE de chaque `parVoisin` : les égalités de valeurs laissaient passer un
  AJOUT de clé, et c'est par là qu'un bonus de terrain serait entré sans qu'on
  revoie la décision.
- **`DEBITS` est complète : SEPT valeurs**, pas six. 120 · 60 · 72 · 48 · 240 ·
  72 · 72, comptées par exécution. Le compte se vérifie, il ne se fait pas de
  tête — je l'ai annoncé à six le 26/08, et c'était faux.
- **`quartzOuScorie` est EXCLUSIF, `quartzEtScorie` est INCLUSIF.** Le
  collecteur produit l'un ou l'autre — le champ sous lui tranche. La raffinerie
  tient les deux à la fois, et `capaciteDuNiveau` vaut **par ressource** : une
  raffinerie qui rend 2 880 tient 2 880 de quartz ET 2 880 de scorie. La prendre
  pour un total divise le stockage par deux. `capaciteParRessource` dit qui est
  concerné, et seule la raffinerie porte la clé.
- **La raffinerie n'a PAS de pendant Ouvrage**, et c'est arbitré, pas oublié.
  Côté Ouvrage le stockage est DEUX bâtiments — Gangue (quartz) et Terril
  (scorie) — parce que c'est du butin ; côté joueur c'est UN qui tient les deux.
  Un vers deux : aucun nom ne convient. Trois appariements seulement : Souche,
  Étai, Nœud.
  ⚠ **Le champ `ta` n'a pas le même sens dans les deux fichiers.** Dans
  `data/base.js` c'est le nom Tiberium Alliances anglais (« Harvester ») ; dans
  `data/sites.js` c'est le nom FRANÇAIS du pendant joueur (« Collecteur »), le
  nom TA étant en commentaire de fin de ligne. Un test croise les deux tables
  dans les deux sens — c'est ce renvoi qui a révélé l'appariement de trop.
- **Les champs de ressource sont le socle des collecteurs, pas un voisinage.**
  Douze cases par base, réparties 5/7, 6/6 ou 7/5 entre quartz et scorie, en
  blocs de 1, 2 ou 3 cases contiguës (triplets droits ou coudés), tirées
  déterministement depuis la POSITION sur la carte. Jamais sur le pourtour :
  l'intérieur d'un 8 × 9 fait **6 × 7 = 42 cases**, rangées 12–17, colonnes 2–8
  (et non 7 × 5, qui serait l'intérieur d'un 9 × 7). Seul le collecteur s'y
  pose, donc **douze collecteurs au maximum**.
- **Les colis n'existent plus.** Abandonnés le 25/08, reconfirmés le 26 (« tous
  les bâtiments font de la production continue »), et RETIRÉS le 26/08 :
  `params.colis`, `intervalleColisTicks`, les deux blocs de `economy.js`, le
  champ `colis` de `creerBatiment` et le test 9. **`SAVE_VERSION` est passée à
  3.**
  ⚠ **La migration 2 → 3 SUPPRIME un champ**, ce qu'aucune autre ne faisait —
  les deux précédentes en ajoutaient. C'était le choix délibéré : une sauvegarde
  qui porte `colis` alors que plus une ligne ne le lit fait croire, six mois plus
  tard, qu'il sert encore. Ce qui est retiré est un compteur mort, pas une
  ressource du joueur.
  ⚠ `BASE-DU-JOUEUR-1.md` §3 affirme encore l'inverse. Il est du 24/08 et de
  rang 4.
- **Le bâtiment des blindés s'appelle « Dépôt de véhicules »**, clé
  `depotDeVehicules`. Trois noms avaient coexisté dans le dépôt — `usine` (la
  clé), « dépôt de véhicules » (le commentaire de `COUT_NIVEAU_DEUX`, qui avait
  raison) et « atelier » (`MODELE-REPARATION-1.md` §3). Arbitré le 26/08 et
  corrigé partout où c'était un NOM DE BÂTIMENT. Il reste cinq occurrences du
  mot, toutes légitimes et vérifiées : quatre qui racontent la correction
  elle-même (`base.js`, `MODELE-REPARATION-1.md` §6.3, `test/base.test.js`, ici)
  et une où « atelier » est un nom commun d'exemple, sans rapport
  (`MODELE-ECONOMIQUE.md` l. 184, « un atelier un silo »).
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

- ~~**La garde du lot 1** scannait avec `/\bdocument\b/`~~ — **corrigée le
  26/08.** `\b` est ASCII en JavaScript, si bien que « documenté » déclenchait
  la garde (la frontière tombe entre le « t » et le « é ») alors que
  « documentation » passait. On avait pris l'habitude d'écrire « consigné » dans
  `src/sim/` pour la contourner : **ce n'est plus nécessaire.** Les motifs sont
  bornés en Unicode par `` (?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_]) ``, et le
  test 4 asserte désormais les deux sens — cinq mots français innocents ne
  déclenchent rien, quatre vraies violations sont attrapées.
  ⚠ **La leçon reste vraie ailleurs** : `\b` est ASCII, et le projet écrit son
  code en français. Tout nouveau motif de mot doit être borné en Unicode.
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
