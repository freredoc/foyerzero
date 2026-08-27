# CLAUDE.md — Foyer Zéro

À lire en premier, à chaque session. Fait autorité sur ce document-ci ;
pour le contenu du jeu, voir la hiérarchie ci-dessous.

**Foyer Zéro** (codename interne : *Chantier*) — jeu de guerre idle solo, hors ligne,
distribué comme un fichier HTML autonome, avec enveloppe Android WebView et
auto-update par GitHub Pages. Paquet : `fr.freredoc.foyerzero`.

Dernière révision : **27/08/2026**, version 0.16.0 · build 16.

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

**Référence au 27/08/2026 (après le lot POSE-À-L'ÉCRAN), à confronter :**
`npm test` → **291 pass / 0 fail**, `npm run build` → `dist/index.html`,
**133 455 octets**, 0 référence externe.

⚠ **130 488 était faux de 814 octets** — mesuré le 27/08 au soir sur un clone
neuf, `npm ci && npm run build`. Le nombre a été écrit avant la dernière reprise
du lot ÉCRAN-NAVIGATION et personne ne l'a relevé : `dist/` n'est pas suivi par
git, donc aucun test ne le confronte. C'est le seul chiffre de ce fichier
qu'aucune garde ne protège.

⚠ **LE HTML BOUGE MAINTENANT À CHAQUE LOT D'INTERFACE.** Il était figé à 81 236
octets depuis le lot RÉSIDU ; ÉCRAN-CHANTIER l'a porté à 123 785 en branchant la
session de jeu, ÉCRAN-NAVIGATION à 130 488 en ajoutant l'écran Offense, les lots DÉMARRAGE
et SOL à 131 302, POSE-À-L'ÉCRAN à 133 455 en rendant la palette vivante.
La borne de T10 (200 000 octets) tient, avec 33 % de marge — mais elle se surveille
désormais à chaque lot, ce qui n'était pas le cas pendant douze lots.

Le compte de tests a BAISSÉ de sept au lot ORPHELIN — `test/economy.test.js`
est parti avec le module qu'il testait — puis remonté d'un au lot HOMONYMES, de
quatorze au lot ÉCRAN-CHANTIER (treize pour `test/chantier.test.js`, un pour la
garde §11 scindée en deux), et de onze au lot ÉCRAN-NAVIGATION (six pour
`test/offense.test.js`, trois d'orientation dans `test/rendu.test.js`, deux dans
`test/chantier.test.js` — la barre à deux bandes et la pastille de pose), et de
cinq au lot POSE-À-L'ÉCRAN, tous dans `test/chantier.test.js`. Une baisse n'est pas forcément une régression, mais elle se
justifie, toujours.

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

Relevée le **27/08/2026**, fichier par fichier. **La lister quand même.**

```
src/index.src.html      point d'entrée ; son <script type="module"> est LE point d'entrée JS

src/data/               toutes les valeurs de calibrage — 5 fichiers ; RIEN d'autre n'a le droit d'en porter
  combat.js             grille, unités, défenses, modules, ciblage, écrasement, obstacles
  sites.js              bâtiments de site, butin, densité, garnisons, vagues, recherche, géographie
  niveaux.js            courbe de niveau du COMBAT — PV et dégâts
  economie.js           courbe des COÛTS et de la PRODUCTION — distincte de la précédente
  base.js               les onze bâtiments de la base du joueur ; lu par champs, disposition et le tick

src/sim/                simulation déterministe, sans DOM — 11 fichiers
  rng.js  clock.js  state.js  grille.js  combat.js  generateur.js
  champs.js             terrain d'une base : 12 cases tirées de la POSITION
  disposition.js        validation, voisinage TYPÉ, débits d'une base posée
  economie-base.js      le TICK : stocks, saturation, rattrapage analytique
  carte.js              distances de GEOGRAPHIE → coordonnées, niveau d'une rangée
  niveau-de-base.js     les trois niveaux du JOUEUR : moyennes, en dixièmes

src/render/             rendu, sans DOM non plus : rend des primitives — 5 fichiers
  projection.js  canvas2d.js  interpolation.js  scene.js
  orientation.js        où une rangée tombe à l'écran, et la réciproque

src/ui/                 les trois écrans et leurs éditeurs — 6 fichiers
  session.js            LE SEUL fichier du dépôt qui lise l'horloge murale, une fois
  chantier.js           l'écran de la base : formatage PUR, puis rendu au DOM
  offense.js            l'écran des quatre vagues — coquille, rien à composer
  banc.js               le banc d'essai, désormais derrière un geste de debug
  arsenal.js            éditeur d'assaut — module PUR
  defense.js            éditeur de garnison — module PUR
  ⤷ le DOM reste confiné à ce dossier, mais il n'y a plus UN seul fichier qui y
    touche : `banc.js` et `chantier.js` le font tous les deux, et `session.js`
    les met en scène. La garde de `banc.test.js` porte sur le DOSSIER, pas sur
    un nom.

test/                   24 fichiers *.test.js (node:test) ; prereglages-lot3a.js n'est PAS un test
  arsenal  assaut  banc  base  carte  champs  chantier  cible  clock  combat
  defense
  disposition  documentation  donnees  economie-base  generateur
  grille  niveau-de-base  offense  rendu  repli  rng  roster  state
  ⤷ documentation.test.js : les COMPTES **et les NOMS** de ce fichier-ci sont
    assertés contre le disque — noms de `test/` et noms de chaque dossier de
    `src/`. Ajouter, retirer ou déplacer un fichier sans mettre §0 et §2 à jour
    rend la suite ROUGE. C'est voulu — §2 a menti deux fois, §0 quatre, et le
    compte seul a laissé passer un écrasement le 27/08 (§6, homonymes).
  ⤷ base.test.js croise base.js et sites.js : ne pas le déplacer sans lire
    pourquoi (appariements Ouvrage, dans les deux sens).
  ⤷ base.test.js : invariants de src/data/base.js — roster des onze, classes
    de coût, emplacements, géométrie, champs, débits, stockage. AJOUTÉ le
    26/08 (lot BASE-0) : le fichier vivait depuis un mois sans un seul test.
  ⤷ donnees.test.js : invariants des tables de src/data/ — sommes, bornes,
    références croisées. Il REMPLACE l'ancien verif.mjs de la racine.

tools/                  3 fichiers, dont un seul sert au build
  build.js              src/ → dist/index.html, un seul fichier autonome
  conditionneur.html    outil hors ligne, sans rapport avec le build
  audit-maquette.mjs    confronte foyer-zero-ui.html aux tables — À LA MAIN
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

Elle est **auditée**, pas testée : `node tools/audit-maquette.mjs` confronte ses
noms, son terrain, ses débits, ses capacités et sa palette aux tables du dépôt.
Il ne vit PAS dans `npm run check`, et c'est délibéré — la faire garder par la
suite ferait passer `main` au rouge pour un fichier que le joueur ne verra
jamais. Il se lance quand on touche à la maquette. **C'est la seule exception à
« un audit hors de `npm run check` n'existe pas »**, et elle tient parce que la
maquette n'est pas du code livré.

⚠ **La version précédente de ce paragraphe annonçait sa mort « le jour où
l'écran de jeu aura ses propres tests ».** Ce jour est venu le 27/08 —
`test/chantier.test.js` existe — et l'audit ne meurt PAS. Les deux ne mesurent
pas la même chose : `chantier.test.js` vérifie que l'écran LIT le moteur,
`audit-maquette.mjs` vérifie que la MAQUETTE ne ment pas. Tant qu'on dessine une
décision d'interface dans la maquette avant de l'écrire, elle a besoin de son
garde-fou. Il mourra le jour où plus personne ne la touchera.

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
- **`sim/state.js` tourne sur `economie-base`** depuis le 26/08.
  `SAVE_VERSION` vaut **6**. L'état porte `position` (où la base est sur la
  carte AUJOURD'HUI), `fondation` (où elle a été POSÉE), `disposition`
  (bâtiments placés à la case) et `economie` (trois ressources).
  ⚠ **LE TERRAIN EST GELÉ À LA FONDATION.** Arbitré par Ethan le 27/08 : « une
  fois qu'il a posé sa base, les champs de quartz et de scorie ne changent plus
  jamais, sinon ça casserait les collecteurs et le schéma ». Un redéploiement
  change donc la position, mais pas les douze cases : le joueur ne perd jamais
  la disposition de ses collecteurs en se repliant.
  ⚠ **`position` et `fondation` ne se confondent JAMAIS.** `position` sert la
  carte et le niveau, `fondation` ne sert QUE le terrain. Elles coïncident à la
  création et à ce seul instant, et ce sont **deux objets distincts** : partager
  la référence marcherait jusqu'au premier redéploiement, puis déplacerait le
  terrain en silence. Un test l'asserte par identité, pas par valeur.
  ⚠ **La migration 4 → 5 NE PERD RIEN** — la première dans ce cas depuis la
  v2. Sous la v4 le terrain se déduisait de `position` ; écrire
  `fondation = position` rend donc exactement le terrain que la sauvegarde
  avait.
  ⚠ **`sim/economy.js` ET `src/data/params.js` N'EXISTENT PLUS** — retirés le
  27/08 (lot ORPHELIN) avec `test/economy.test.js`. Le moteur du lot 1 est
  entièrement remplacé par `sim/economie-base.js` + `sim/disposition.js` +
  `data/base.js` + `data/economie.js`. Toute mention de l'un ou de l'autre
  ailleurs dans ce fichier, dans le code ou dans un rapport est de l'HISTOIRE :
  elle se lit au passé, et rien ne doit être recréé sous ces noms.
  ⚠ **La passation du 26/08 annonçait quatre champs morts** — `params.batiments`,
  `params.stockage`, `params.courbes`, `params.adjacence`. Mesuré au retrait :
  ils étaient **huit sur huit**, plus l'export `RHO`. Personne n'importait plus
  `data/params.js`. Une liste de morts se recompte avant d'être crue.
  ⚠ **LE TERRAIN N'EST PAS SAUVEGARDÉ.** `serialiser` l'omet, `charger` le
  redéduit de `fondation`.
  ⚠ **`instantSauvegardeMs` FAIT LE CHEMIN INVERSE** — v6, 27/08. Le terrain vit
  dans l'état et sort de la sauvegarde ; l'instant mural vit dans la sauvegarde
  et n'entre **jamais** dans l'état. Une fois la partie chargée il ne veut plus
  rien dire, et le garder en mémoire inviterait quelqu'un à s'en servir comme
  d'une horloge.
  ⚠ **`serialiser(etat, instantMs)` ET `charger(json, instantMs)` PRENNENT
  L'INSTANT EN ARGUMENT**, obligatoire. Aucun fichier de `src/` n'a le droit
  d'appeler l'horloge système — `banc.test.js` §11 balaie `Date.now` sur tout
  `src/` **et** sur `index.src.html`. Le temps mural entre par la couche qui
  touche au DOM, et par elle seule. C'est la même discipline qu'`accumuler()`
  de `sim/clock.js`, qui reçoit une durée au lieu d'aller la chercher.
  ⚠ **`charger` RATTRAPE, il ne fait pas que restaurer.** Un état chargé mais
  pas rattrapé afficherait les stocks d'hier soir. Le seul moment où l'on
  connaît à la fois la sauvegarde et l'instant présent, c'est celui-là.
  ⚠ **UNE HORLOGE QUI RECULE NE FAIT RIEN, ELLE NE LÈVE PAS.** Fuseau, NTP,
  joueur qui change la date : la durée peut être négative, elle est ramenée à
  zéro. Refuser la sauvegarde punirait le joueur pour l'heure de son téléphone.
  ⚠ **DIX ANS D'ABSENCE SATURENT SANS DÉBORDER**, mesuré et non supposé :
  3,15 milliards de ticks, stock exactement égal à la capacité, aucune levée.
  Un mois et dix ans donnent le même stock — c'est la définition de saturé.
  ⚠ **La migration 5 → 6 NE DONNE AUCUNE ABSENCE.** Une sauvegarde v5 ne dit pas
  quand elle a été écrite ; lui inventer une durée fabriquerait des ressources.
  `instantSauvegardeMs` y vaut `null`, et `charger` réancre sur maintenant. Le recalculer par tick coûterait 71,6 µs — plus du
  double du tick économique ; le sauvegarder créerait une SECONDE source de
  vérité, donc une occasion de divergence muette. Un seul endroit peut mentir,
  et c'est celui qui est écrit.
  ⚠ **La migration 3 → 4 REFONDE, elle ne convertit pas.** Aucune
  correspondance entre une `foreuse` sans coordonnée et un collecteur qui doit
  se poser sur un champ. Ce qui survit : la graine, le tirage, l'horloge — le
  TEMPS de la partie, pas son contenu. Légitime uniquement parce qu'aucune
  sauvegarde n'existait (26/08) ; le jour où il y en aura, il faudra prévenir
  le joueur AVANT.
  ⚠ **`verifierEtat` LÈVE là où `problemesDeDisposition` rend une liste.** En
  cours de partie, une disposition illégale est un fait de JEU (on la montre,
  le joueur purge) ; au CHARGEMENT, c'est un fait de programme.
- **Le coût du tick monte vite avec la taille de la base** — 2,0 µs à un
  bâtiment, 21 à neuf, 108 à vingt, **280,7 à quarante**. Une base pleine coûte
  neuf fois le chiffre longtemps cité, qui n'avait été mesuré qu'en un point.
  2,8 ms par seconde de jeu reste acceptable, mais la croissance est
  superlinéaire.
  ⚠ **Conséquence sur les TESTS, pas seulement sur le jeu.** Simuler 72 h tick
  par tick fait 2,6 millions de ticks : la suite est passée de 13 à 74 secondes
  à la bascule. Les horizons de boucle ont été rabotés à 2 h, et les longues
  absences se testent par COMPOSITION — rattraper deux fois vaut rattraper une
  fois — qui est en temps constant et va jusqu'à un mois. Suite ramenée à 20 s.
  **Une suite qu'on hésite à lancer cesse d'être lancée.**
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
- ⚠⚠ **UNE BASE NEUVE NE PEUT RIEN PRODUIRE, JAMAIS. BLOCAGE OUVERT, 27/08.**
  Mesuré en simulant 24 h sur les quatre choix possibles, pas déduit :
  un Chantier niveau 1 ouvre **2** emplacements et en occupe **1** — il en reste
  **UN**. Or produire demande DEUX bâtiments : un producteur et un stockage.
  | Le seul bâtiment posable | Production | Capacité | Après 24 h |
  |---|---|---|---|
  | Collecteur | 240/h de quartz | **0** | **0** |
  | Raffinerie | — | 2 880 | **0** |
  | Centrale | 120/h d'électricité | **0** | **0** |
  | Accumulateur | — | 1 440 | **0** |
  `capacitesMilli` ne compte que la raffinerie et l'accumulateur ; sans eux le
  plafond vaut zéro, et `min(cap, stock + gain)` reste à zéro pour toujours.
  ⚠ **ET LE VERROU SE REFERME** : ouvrir un troisième emplacement demande le
  Chantier niveau 2, qui coûte **8** (classe majeur). Le joueur a zéro et ne
  peut pas en obtenir. **La partie est instartable.** Ce n'est pas un défaut
  d'écran — l'écran a raison de ne rien montrer qui monte. C'est un arbitrage
  qui manque, et il est devant tout le reste.
- **TOUTE base neuve du joueur est un Chantier de construction niveau 1, en
  (18, 5)** — pas seulement la première. Arbitré le 26/08 : « toutes les bases
  que le joueur pose suivront la même logique ». `BASE_NEUVE` de `data/base.js`,
  `dispositionNouvelleBase()` de `sim/disposition.js`, qui rend une COPIE.
  ⚠ **Ne pas dire « base initiale ».** Le nom ferait croire à un cas particulier
  du démarrage, et quelqu'un écrirait une seconde fonction pour les bases
  suivantes. La première base n'est que la première application de la règle.
  ⚠ **Un seul bâtiment suffit parce que le niveau 1 ne coûte rien**
  (`ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2). Le Chantier ouvre deux
  emplacements et en prend un : il en reste exactement UN, le premier vrai
  choix. Le tutoriel guide à partir de là.
  ⚠ **« EN HAUT » EST AMBIGU, NE PAS L'EMPLOYER.** Selon qu'on regarde l'écran
  ou les numéros de rangée, il désigne l'un ou l'autre bout de la bande — et la
  confusion a coûté un lot le 26/08. La rangée 18 est le **FOND** : l'assaillant
  part des rangées 1–2 et monte en numéro, donc la 18 est la dernière qu'il
  atteint. C'est cohérent avec le Chantier, seul bâtiment sans plancher de PV et
  dont la perte force le redéploiement. La fonction s'appelle `caseDuChantier`,
  jamais `caseHaute` ni `caseBasse`.
  ⚠ **Cette case ne porte JAMAIS de champ**, quelle que soit la graine : les
  champs se tiennent entre les rangées 12 et 17. La fondation est légale partout
  **par construction** — ce qui compte d'autant plus que la règle vaut pour des
  positions inconnues à l'avance. Un test le vérifie sur 65 terrains tirés.
- **`sim/carte.js` traduit les DISTANCES de `GEOGRAPHIE` en COORDONNÉES**, et
  c'est le seul endroit qui a le droit de le faire. Deux conventions y vivent :
  **rangée 1 = bord HAUT**, `hauteur` = bord bas (même sens que la grille de
  combat) ; et le **centre d'une largeur paire est 16 sur 30**, employé par les
  deux bouts du couloir.
  ⚠ **Le décalage de rangée n'a pas été choisi, il a été DÉDUIT.**
  `departJoueur` porte deux faits liés — `strate: 5` et `casesDepuisBordBas: 25`
  — et un seul décalage les rend vrais tous les deux. Un test asserte qu'aucune
  rangée voisine n'y arrive.
  ⚠ **Le joueur ne démarre PAS au bord bas**, malgré la formule « tout en bas ».
  Le bord vaudrait le niveau 0. Il démarre **rangée 275, colonne 16**, 25 cases
  plus haut, dans une **strate 5**. La base terminale est rangée 26, colonne 16,
  strate 50.
  ⚠ **« STRATE 5 » N'EST PAS « BASE DE NIVEAU 5 ».** C'est le niveau des sites
  de l'OUVRAGE à cet endroit de la carte — ce que le joueur y trouvera à
  attaquer. Sa propre base n'a aucun niveau qui vienne de la carte. Écrire
  « le joueur démarre au niveau 5 » est faux, et la formule a traîné dans ce
  fichier jusqu'au 27/08.
- **LA BASE DU JOUEUR PORTE TROIS NIVEAUX, ET CE SONT DES MOYENNES.** Arbitré
  par Ethan le 27/08 : « les niveaux, ça concerne uniquement l'Ouvrage. Les
  niveaux du joueur, par base, il en a trois : le niveau de ses bâtiments, le
  niveau de sa défense et le niveau de son armée offensive. À chaque fois c'est
  une moyenne. »
  ⚠ **Aucun des trois ne dépend de la position sur la carte.** Ils se
  recalculent depuis ce que le joueur a posé, et rien d'autre. Un redéploiement
  ne les change pas.
  ⚠ **La même règle vaut déjà côté Ouvrage** : `GEOGRAPHIE.niveauBase` de
  `data/sites.js` dit « moyenne des niveaux de ses bâtiments » depuis le début.
  Ce qui est neuf le 27/08, c'est qu'elle vaut aussi pour le joueur, et qu'il y
  en a TROIS au lieu d'une.
  ⚠ **UNE DÉCIMALE, ET SEULEMENT CE QUI EST POSÉ.** Arbitré le 27/08 : la
  moyenne se donne à une décimale (5,8) et porte sur les bâtiments POSÉS. Un
  emplacement vide ne compte pas pour zéro, il ne compte pas du tout ; le
  Chantier de construction compte comme les autres.
  ⚠ **RANGÉE EN DIXIÈMES ENTIERS** — `5,8` se range `58`, jamais en flottant.
  Même discipline que les milli-unités de l'économie : une décimale en flottant
  s'additionne mal et se sérialise en `5.799999999999999`. L'arrondi se fait à
  la demie supérieure, `(somme × 20 + n) / 2n` tronqué, sans jamais quitter les
  entiers. `sim/niveau-de-base.js`, et lui seul.
  ⚠ **L'affichage divise par dix et montre TOUJOURS la décimale** — « 6,0 »,
  jamais « 6 ». C'est de l'interface, ça ne descend pas dans `sim/`.
  ⚠ **DEUX DES TROIS NE SONT PAS ÉCRITS**, et c'est délibéré. `sim/state.js` ne
  porte que les bâtiments ; la garnison et l'armée d'assaut du joueur se
  composent dans `ui/defense.js` et `ui/arsenal.js`, qui sont des ÉDITEURS —
  rien de ce qu'ils produisent n'est sauvegardé. Les écrire aujourd'hui
  reviendrait à choisir seul la forme de cet état. Ils appelleront
  `moyenneEnDixiemes`, jamais une seconde moyenne à eux.
- **Livraison : `src/` et `test/` ne voyagent JAMAIS dans la même archive.**
  Le dépôt se met à jour depuis un téléphone et le sélecteur n'affiche que les
  noms courts : `disposition.js` et `disposition.test.js` s'y confondent. Deux
  dépôts de suite sont tombés à côté avant que la règle soit posée. Archive 1 = tout ce
  qui va dans `src/`, archive 2 = `test/` + racine. `main` est ROUGE entre les
  deux, et c'est le garde-fou qui le dit — c'est voulu.
  ⚠ **ET UNE ARCHIVE NE PROPOSE JAMAIS DEUX DOSSIERS DE DESTINATION QUAND UN
  NOM COURT EST AMBIGU ENTRE EUX.** Le 27/08, une archive portait `src/data/`
  et `src/sim/` : la paire de `src/data/` est partie deux fois, une fois au bon
  endroit et une fois dans `src/sim/`. `src/sim/base.js` est apparu, et
  **`src/sim/combat.js` — le moteur de combat, 1 450 lignes — a été remplacé
  par la table de données du même nom court.** Une archive plate, une seule
  destination, aucun choix à faire : c'est ce qui a réparé.
- **DEUX FICHIERS SANS RAPPORT PORTENT LE MÊME NOM COURT** : `combat.js` est à
  la fois une table de `src/data/` et le moteur de `src/sim/`. C'est légitime —
  les dossiers disent le rôle — mais ça rend tout dépôt manuel dangereux, et
  le sélecteur d'un téléphone n'affiche que le nom court.
  ⚠ **Le COMPTE de §2 n'a rien vu de l'écrasement** : `src/sim/` avait toujours
  ses onze fichiers, un module de moins et un intrus de plus. Seul le BUILD est
  tombé, et il ne tourne pas sur le téléphone. D'où le garde-fou des NOMS de
  `src/` (lot HOMONYMES, 27/08) : `documentation.test.js` asserte désormais la
  liste nominale de `src/data/`, `src/sim/`, `src/render/` et `src/ui/` contre
  le disque, comme il le faisait déjà pour `test/`.
  ⚠ **Conséquence sur la prose de §2** : les lignes de description d'un bloc de
  `src/` ne doivent nommer aucun fichier en `.js`, elles seraient lues comme des
  déclarations.
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
  deux voisins (dans l'ancien `data/params.js`, retiré le 27/08) ; ce modèle-ci
  compte les huit cases. Confondre les deux divise la production par quatre.
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
  le champ `colis` de `params.js`, `intervalleColisTicks`, les deux blocs de
  `economy.js`, le champ `colis` de `creerBatiment` et le test 9. **`SAVE_VERSION`
  est passée à 3.** Les deux fichiers cités ont eux-mêmes disparu le 27/08.
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

- **Un débit se range PAR HEURE, jamais par tick.** La règle est née dans
  `sim/economy.js` (lot RÉSIDU) et vit désormais dans `sim/economie-base.js`,
  qui l'a reprise telle quelle. Chaque bâtiment porte un résidu ; l'erreur
  d'arrondi par tick est exactement nulle, à n'importe quelle fréquence. Un
  `fluxMilliParTick` n'existe nulle part, et le recréer réintroduirait un
  arrondi qui coûtait jusqu'à 0,71 % de production.
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
- **Il n'y a plus de capacité de stockage GLOBALE.** Le lot 1 en avait une,
  unique, dans l'ancien `data/params.js`. Depuis la bascule la capacité est
  **par bâtiment et par ressource** : `capaciteDuNiveau()` de `data/base.js`,
  ancrée sur `STOCKAGE.autonomieHeures`, lue par `sim/economie-base.js`.
  ⚠ **Le « `base.js` n'est lu par personne » de la version précédente de cette
  ligne était périmé** : `champs.js`, `disposition.js` et `economie-base.js`
  l'importent tous les trois. Un fait d'orphelinage se remesure, il ne se
  reconduit pas.
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

- **`poser(etat, id, rangee, colonne)` et `problemesDeLaPose`** vivent dans
  `sim/state.js` depuis le 27/08 (lot POSE). **Poser ne coûte rien** —
  `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2, le niveau 1 est gratuit pour les
  onze — et c'est pourquoi la pose a pu être écrite sans attendre l'arbitrage
  sur la répartition quartz/scorie, qui ne concerne que l'AMÉLIORATION.
  ⚠ **Aucune règle de pose n'est réécrite.** La légalité d'une pose est celle de
  la disposition qui en résulterait : on construit la candidate et on la soumet
  à `problemesDeDisposition`. Une seconde liste de règles finirait par diverger.
  ⚠ **Les défauts PRÉEXISTANTS sont filtrés.** Une base amputée par un raid
  resterait constructible : faire remonter ses propres défauts sur chaque pose
  enfermerait le joueur pour des fautes qui ne sont pas les siennes.
  ⚠ **Le résidu suit le bâtiment.** Poser sans allonger `economie.residus` fait
  lever le TICK suivant, pas la pose — donc loin de la faute.

### Sur l'interface

- **LA PALETTE EST FERMÉE : vingt-huit teintes, plus un seul `rgba`.**
  `banc.test.js` balaie `src/render/`, `src/ui/` et `src/index.src.html` et
  refuse toute couleur hors de `FICHE-STYLE.md`, ainsi que tout `rgba` autre que
  `rgba(0,0,0,0.31)`. Aucune transparence, donc — ni tuile pâle, ni gris
  intermédiaire. Les vingt-huit : cinq de châssis kaki, cinq de sol joueur, cinq
  d'ardoise Ouvrage, quatre d'accents de terrain, trois de métal, six d'accents
  fonctionnels.
  ⚠ **LA GARDE N'EN CONNAISSAIT QUE QUATORZE PENDANT UNE JOURNÉE.** `FICHE-STYLE.md`
  est passé en v4 le 27/08 avec trois rampes de plus ; la liste de `banc.test.js`
  se disait « transcrite » et ne l'était plus. Elle serait restée VERTE
  indéfiniment — elle ne regarde que du code qui n'emploie pas encore ces
  teintes — tout en refusant quatorze couleurs parfaitement légitimes au premier
  écran qui s'en servirait.
  ⚠ **Une transcription qui ne se confronte pas à sa source est une copie qui
  vieillit.** La liste reste ÉCRITE — pour qu'un ajout se voie en relecture, et
  pour qu'une faute de frappe dans la fiche n'autorise pas une couleur en
  silence — et un test l'asserte contre le document **dans les deux sens**.
  Même garde dans `tools/audit-maquette.mjs`.
  ⚠ **DEUX ÉCHAPPATOIRES EXISTENT, ET ELLES SONT INTERDITES D'USAGE.** Le motif
  de la garde est `` #[0-9A-Fa-f]{6}(?![0-9A-Za-z]) `` : un hex à **trois**
  chiffres (`#000`) et un hex à **huit** (`#F5F3E80D`) passent tous les deux au
  travers. S'en servir contournerait la garde en silence, ce qui coûte plus cher
  que la contrainte qu'elle pose. `tools/audit-maquette.mjs` refuse les deux de
  face, pour que la maquette n'apprenne pas la triche à l'écran.
- **La maquette a été dessinée sous la contrainte à quatorze teintes**, avant
  la v4 de la fiche. Elle tient, mais elle ne connaît pas encore les couleurs de
  terrain que la fiche porte maintenant : `#9FB3C5` · `#C1CEDA` pour le quartz,
  `#382E47` pour la scorie. À reprendre quand Ethan dira comment il veut qu'un
  champ se lise — c'est une décision de style, et la fiche fait autorité.
  ⚠ **LA MAQUETTE A SUIVI LE RETOURNEMENT ET LA BARRE À DEUX BANDES** (27/08 au
  soir) — sans quoi elle aurait enseigné une navigation que le jeu ne fait plus.
  Elle ne porte PAS l'écran Offense : elle en montre le renvoi et rien d'autre.
  `audit-maquette.mjs` ne regarde pas la navigation et ne l'aurait pas dit.
  ⚠ **L'ÉCRAN DE JEU A REPRIS LE RENDU DE LA MAQUETTE, PAS CES TROIS TEINTES**,
  et c'est délibéré : leur emploi n'est pas arbitré, et trancher seul aurait fixé
  la lecture d'un champ sans que personne la revoie. Le champ est donc, à
  l'écran comme sur la maquette, un fond kaki plein avec un liseré. **Les deux
  se reprendront ENSEMBLE** le jour de l'arbitrage — les laisser diverger
  reviendrait à dessiner dans la maquette une décision que l'écran ignore.
- **Ce que la contrainte a donné, le 27/08, et qui vaut mieux que ce qu'elle a
  remplacé.** Les trois bandes de la grille n'ont plus de fond propre : la fiche
  n'a pas trois gris voisins, le RAIL disait déjà où l'on est, et une nuance de
  noir ne se distingue pas sur un téléphone au soleil. Un champ de ressource
  n'est plus une teinte pâle mais un fond kaki plein, avec un liseré qui dit la
  ressource — os pour le quartz, ambre pour la scorie.
- **La grille de la base fait 9 colonnes.** Arbitré le 27/08 après que la
  maquette en ait montré 8 pendant trois jours. `GRILLE.largeur` fait foi, et
  `audit-maquette.mjs` l'asserte contre la maquette.
- **LE TEMPS MURAL A SON POINT D'ENTRÉE DEPUIS LE 27/08, ET IL EST UNIQUE.**
  `charger` et `serialiser` l'attendaient en argument depuis la v6 sans que
  personne le leur passe ; le lot ÉCRAN-CHANTIER a branché l'écran, donc
  **retourné la garde §11** exactement dans la forme que cette ligne annonçait.
  Elle dit maintenant : interdiction TOTALE sur `src/sim/`, `src/data/` et
  `src/render/` ; **exactement une** occurrence dans `src/ui/session.js`, nommé
  dans le test. Le compte est **asserté, pas borné** — « au plus une » laisserait
  passer zéro, c'est-à-dire la disparition silencieuse du seul point d'entrée du
  temps réel, et le jeu réafficherait les stocks d'hier soir sans qu'un test
  tombe. Le verdict vit dans `fautesDHorloge`, séparé de la mesure pour être
  falsifiable : on lui donne zéro, deux, et une occurrence ailleurs, et il
  refuse les trois.
  ⚠ **Tout `src/` porte la fonction `maintenantMs()` et ELLE SEULE.** Ce qui a
  besoin de l'heure l'appelle ; personne n'écrit une seconde fois le nom de
  l'horloge du langage.
  ⚠ **LES DEUX CONTOURNEMENTS SONT INTERDITS PARTOUT, PORTEUR COMPRIS** —
  `new Date` et `performance.timeOrigin` donnent l'heure murale sans écrire le
  nom que la garde cherche. Le test les refuse de face, avec un appât pour
  chacun. Même discipline que les hex à trois et à huit chiffres de la garde de
  palette.
  ⚠ **DEUX CHEMINS DE RETOUR, PAS UN.** Une application TUÉE repasse par
  `charger`, qui rattrape. Une application seulement REPLIÉE ne repasse par
  rien : les horodatages de `requestAnimationFrame` sont monotones et ne
  courent pas pendant qu'on ne regarde pas. D'où l'instant retenu au masquage et
  la reprise qui rattrape la différence — sans quoi la vérification appareil
  n° 4 échouerait pour la moitié des façons de fermer le jeu.
- **Le banc d'essai RESTE dans le HTML livré**, caché derrière un appui long de
  1,5 s sur le numéro de version — arbitré le 27/08, branché le même jour.
  C'est ce que T10 de `banc.test.js` exige déjà : il asserte la présence de
  `banc-canvas`, `banc-graine`, `banc-lancer` et `banc-pas` dans
  `dist/index.html`. Le sortir aurait mis ce test au rouge.
  ⚠ **`initialiserBanc` n'est appelé QU'À L'OUVERTURE**, jamais au chargement :
  il pose des écouteurs, un ResizeObserver et une projection, et mesure son
  canvas au câblage — un élément caché mesure zéro. Le démasquage vient donc
  avant l'appel, et l'appel n'a lieu qu'une fois.
- **LA GRILLE SE DESSINE À L'ENVERS DES NUMÉROS DE RANGÉE, ET C'EST VOULU.**
  Arbitré le 27/08 au soir : la base d'abord, puis la défense, puis les deux
  rangées de déploiement. La transformation vit dans `src/render/orientation.js`
  et nulle part ailleurs — `ligne d'écran = GRILLE.longueur + 1 − rangée`, avec
  sa réciproque. **Le modèle ne bouge pas** : la rangée 1 reste celle où les
  vagues paraissent, la rangée 18 reste le fond.
  ⚠ **ELLE EST DANS `render/` PARCE QUE LA MÊME VUE SERVIRA AU RAID.** Ethan :
  « il faut toujours que la base, quoi qu'il arrive, joueur ou Ouvrage, soit
  [en premier], puis défense, puis les deux petites rangées ». C'est la même
  géométrie des deux côtés — d'où `GEOMETRIE_BASE` qui RÉFÉRENCE `GRILLE`.
  Écrite en dur dans l'écran Chantier, elle serait recopiée pour l'écran de
  raid, et les deux copies divergeraient.
  ⚠ **`render/projection.js` PORTAIT DÉJÀ CETTE CONVENTION**, depuis le lot 3A :
  `yDeRangee` vaut `margeY + (GRILLE.longueur − rangee) × tailleCase`. Le canvas
  du banc dessinait donc dans le bon sens ; l'écran DOM du lot ÉCRAN-CHANTIER
  était le SEUL à la contredire, parce qu'il posait ses cases dans l'ordre
  naturel de sa boucle. Un test asserte désormais que les deux chemins
  s'accordent, pour qu'on ne puisse plus en corriger un seul.
  ⚠ **POUR UNE BANDE, LA LIGNE DE DÉPART SE CALCULE DEPUIS SA RANGÉE LA PLUS
  HAUTE EN NUMÉRO.** Prendre `premiere` par symétrie apparente décale chaque
  bande de sa propre longueur — la défense se poserait sur les bâtiments, et le
  rail désignerait la mauvaise bande **sans que rien ne casse**.
- **LA BARRE DU BAS PORTE DEUX BANDES, PAS TROIS.** Chantier et Défense, dans un
  seul défilement continu : ce sont deux repères de la même grille, pas deux
  écrans. Le jeu s'ouvre sur le Chantier.
  ⚠ **LE BOUTON « ASSAUT » ÉTAIT UNE FAUTE, retirée le 27/08 au soir.** Il
  pointait sur les rangées 1–2, qui sont l'endroit où les vagues PARAISSENT
  pendant un combat — pas celui où on les COMPOSE. Il promettait un éditeur et
  livrait du sol nu. La composition a désormais son écran, et un test refuse
  qu'un bouton « Assaut » reparaisse dans la page.
- **L'ÉCRAN OFFENSE EST UNE COQUILLE, ET IL SE DIT COQUILLE.** Trente-six
  emplacements — quatre vagues de neuf, `EMPLACEMENTS_ASSAUT` — dessinés et
  vides, niveau et budget à « — », palette présente et désactivée, et un mot qui
  dit que la composition d'armée n'existe pas encore. L'état ne porte pas
  d'armée ; en inventer la forme reviendrait à trancher seul.
  ⚠ **LA PALETTE N'EST PAS FILTRÉE PAR NIVEAU.** `unitesDisponibles(niveau)` de
  l'Arsenal ne montre que `apparition <= niveau` — mais le joueur n'a pas de
  niveau d'armée. En choisir un pour pouvoir filtrer, c'est l'inventer.
  ⚠ **`GRILLE.intervalleVagueSec` VAUT 5, PAS 10.** La capture de référence
  fournie avec l'amendement affiche « +10 s » : c'est un autre jeu. La table du
  dépôt fait foi, et un test l'asserte de face.
  ⚠ **CHANGER D'ÉCRAN N'ARRÊTE PAS LA BOUCLE.** `suspendre()` et `reprendre()`
  de `session.js` existent pour le BANC, qui remplace la page, et pour le
  masquage de l'application. Les brancher sur la navigation interne gèlerait
  l'économie — et **le défaut serait invisible** : au retour, le rattrapage par
  l'horloge murale rendrait les ressources manquantes, si bien que le gel ne se
  lirait que sur un chronomètre. Un test lit la source pour l'empêcher.
- **POSER UN BÂTIMENT NE COÛTE RIEN, ET LA VIGNETTE DOIT LE DIRE.**
  `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2 : le niveau 1 est gratuit pour
  les onze. Le lot ÉCRAN-CHANTIER affichait pourtant `COUT_NIVEAU_DEUX` en
  chiffre nu dans un coin de chaque vignette — « 3 » sur un Collecteur posable
  se lit « poser coûte 3 » — alors qu'un commentaire du même fichier écrivait
  noir sur blanc que la pose est gratuite. La vignette annonce maintenant
  « gratuit » ; le coût de la première amélioration vit dans son titre, et le
  champ s'appelle `coutPremiereAmelioration`, pour que le point d'appel ne
  puisse plus se tromper sans que ça se voie.
  ⚠ **AUCUNE RESSOURCE N'EST NOMMÉE AVEC CE NOMBRE.** `COUT_NIVEAU_DEUX` donne
  un nombre unique et `COUT_ELECTRICITE` une fraction du coût EN QUARTZ ; rien
  ne dit comment le total se répartit entre quartz et scorie depuis que le
  modèle du lot 1 est parti avec `data/params.js`. Un nombre sans ressource, dit
  comme tel, est plus honnête qu'un « 3 quartz » faux.
- **LA POSE EST BRANCHÉE DEPUIS LE 27/08 ; AMÉLIORER ET DÉMONTER NE LE SONT
  PAS.** L'écran n'est plus en lecture seule : la palette est vivante, le joueur
  choisit un bâtiment, les cases où il peut se poser se cerclent, il touche, ça
  se pose. Les deux autres boutons **restent présents et désactivés** — améliorer
  attend la répartition d'un coût entre quartz et scorie, que rien n'arbitre
  depuis le départ de `data/params.js` ; démonter attend de savoir si ça rend
  quelque chose. Des boutons montrés vifs mentiraient ; absents, ils feraient
  croire à un écran fini.
  ⚠ **ON DEMANDE, PUIS ON POSE — ET JAMAIS DE `try` AUTOUR DE `poser`.**
  `problemesDeLaPose` rend une LISTE, `poser` LÈVE, et la différence est la règle
  du dépôt : une pose refusée est un fait de JEU qu'on montre au joueur, une
  levée est un fait de PROGRAMME. Rattraper la levée traiterait la seconde comme
  la première et masquerait le jour où l'écran appellerait vraiment de travers.
  Un test balaie `src/ui/` bloc `try` par bloc `try`.
  ⚠ **`src/ui/` PORTE DEUX FONCTIONS `poser` SANS RAPPORT** : celle de
  `sim/state.js` (un bâtiment dans la base) et celle d'`ui/arsenal.js` (une unité
  dans une vague). `ui/banc.js` entoure la seconde d'un `try`, et il a RAISON —
  le contrat de l'Arsenal est de lever sur un dépassement de budget, qui est un
  fait de jeu. D'où l'import sous le nom `poserBatiment` dans `chantier.js` :
  sans lui, la garde accuserait le banc d'une faute qu'il ne commet pas.
  ⚠ **LES CASES LÉGALES SE CALCULENT, ELLES NE SE DEVINENT PAS.**
  `casesPosables` interroge `problemesDeLaPose` sur les 72 cases de la bande des
  bâtiments — 1,5 ms, un geste et non une boucle de rendu. Réimplémenter les
  règles dans l'écran pour aller plus vite ferait diverger une seconde lecture
  de `sim/disposition.js`, qui est la seule table de règles. **Ne balayer QUE la
  bande des bâtiments** : ailleurs, la réponse serait `hors-base` 90 fois.
  ⚠ **LES MESSAGES DE REFUS SE REPRENNENT MOT POUR MOT.** Ils sont déjà écrits
  en français lisible dans `sim/disposition.js`. Les reformuler dans l'écran
  créerait une seconde formulation qui finirait par dire autre chose que la
  règle.
  ⚠ **UNE POSE SE SAUVEGARDE TOUT DE SUITE.** C'est la première action
  irréversible du jeu ; la perdre parce que l'application a été tuée avant
  l'enregistrement périodique serait la pire façon de perdre la confiance du
  joueur. L'écran dit QUAND (`apresPose`), la session sait COMMENT.
  ⚠ **POSER UN NIVEAU 1 FAIT BAISSER LE NIVEAU MOYEN**, et ça se verra à
  l'écran : 4,6 → 4,3 en posant une raffinerie sur la base de la maquette. C'est
  une MOYENNE, pas un total. Un test l'asserte pour qu'on ne le prenne jamais
  pour un défaut de calcul.
  ⚠ **LE BANDEAU D'AVIS APPARTIENT À `chantier.js`.** La session lui parle par
  `ecran.avis()` au lieu d'écrire dans l'élément : depuis que la pose s'y exprime
  aussi, deux modules qui l'écriraient sans se connaître s'effaceraient l'un
  l'autre.

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
