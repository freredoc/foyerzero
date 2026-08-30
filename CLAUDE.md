# CLAUDE.md — Foyer Zéro

À lire en premier, à chaque session. Fait autorité sur ce document-ci ;
pour le contenu du jeu, voir la hiérarchie ci-dessous.

**Foyer Zéro** (codename interne : *Chantier*) — jeu de guerre idle solo, hors ligne,
distribué comme un fichier HTML autonome, avec enveloppe Android WebView et
auto-update par GitHub Pages. Paquet : `fr.freredoc.foyerzero`.

Dernière révision : **30/08/2026**, version 0.42.0 · build 43.

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
5. ⚠ **AVANT DE DEMANDER UN ARBITRAGE À ETHAN, CHERCHER LA RÉPONSE DANS LE
   DÉPÔT.** `src/data/` porte toutes les valeurs de calibrage,
   `SPEC-FOYER-ZERO.md` la règle, les `RELEVE-TA-*.md` d'où elle vient. Le
   29/08, quatre questions ont été posées à Ethan sur les points d'attaque :
   **trois avaient déjà leur réponse dans `POINTS_ATTAQUE` et dans la §3 de la
   spec** — le plafond, le barème du raid et le nom même de la grandeur —, et la
   quatrième a fait remplacer une valeur juste par une autre, retirée le soir
   même. Un `grep` de trente secondes sur la grandeur en jeu vaut mieux qu'une
   question : le dépôt est devenu assez gros pour que le savoir y soit déjà, et
   assez gros pour qu'on ne tombe plus dessus par hasard.

**Référence au 29/08/2026 (après le lot RÉPARATION), à confronter :**
`npm test` → **578 pass / 0 fail**, `npm run build` → `dist/index.html`,
**577 357 octets**, 0 référence externe. Le lot POINTS-D'ATTAQUE a coûté
**+1 828 octets** — de la simulation pure, aucun écran, comme SATELLITES avant
lui. SITE-D'UNE-CASE a coûté **zéro**, faute d'appelant : `esbuild` l'élaguait.
SITE-ENTAMÉ a fait entrer les deux d'un coup, +2 868, en branchant la
réparation dans le tick. BUTIN-SOLDÉ, +237 ; RECHERCHE-AU-PRORATA, +57 ; MULTIPLICATEUR, +52 ; ACTE-DE-RAID, +158 ; RÉPARATION, +1 163.

⚠ **`dist/` N'EST PAS SUIVI PAR GIT, DONC AUCUN TEST NE CONFRONTE CE NOMBRE.**
C'est le seul chiffre de ce fichier qu'aucune garde ne protège, et il a déjà été
faux de 814 octets : 130 488 annoncé le 27/08 au soir, 131 302 mesurés sur un
clone neuf. Ce nombre-ci se mesure, il ne se recopie pas.

⚠ **LE HTML BOUGE MAINTENANT À CHAQUE LOT D'INTERFACE.** Il était figé à 81 236
octets depuis le lot RÉSIDU ; ÉCRAN-CHANTIER l'a porté à 123 785 en branchant la
session de jeu, ÉCRAN-NAVIGATION à 130 488 en ajoutant l'écran Offense, les lots DÉMARRAGE
et SOL à 131 302, POSE-À-L'ÉCRAN à 133 455 en rendant la palette vivante,
AMORCE-ET-SIGNATURE à 134 118, ÉCRAN-ACTIONS à 137 225 en branchant améliorer
et démolir, PANNEAU-ET-MARGES à 151 187 en ajoutant le panneau de détail d'un
bâtiment et les marges des barres système, STOCKAGE-ET-VOISINAGE à 153 506,
QUEUE-DE-COURBE à 153 505,
MISE-EN-PAGE à 156 633 en sortant l'en-tête des écrans,
POSE-ET-DÉPLACEMENT à 161 583, TUTORIEL à 167 308 en ouvrant l'onglet Mission,
GARNISON-ET-ARMÉE à 179 928 en donnant un état à la garnison et à l'armée,
puis en branchant l'écran Offense et la bande Défense,
CARTE (données) à 181 014 — le seul lot depuis longtemps qui ne touche pas
l'interface, d'où le +1 086 : c'est un module de simulation et deux tables.
OBSTACLES à 183 645, en les branchant dans l'état et en les dessinant,
SATELLITES à 188 451 — de la simulation pure, aucun écran.

⚠⚠ **ET LE LOT ÉCRAN-CARTE A TOUT CHANGÉ D'ÉCHELLE : 503 724 OCTETS.** Le saut
est de +315 273, dont **299 400 pour le seul atlas de terrain** — 64 tuiles,
224 548 octets de PNG, inlinés en base64 par `tools/build.js`. C'est la première
ressource BINAIRE du livrable, et c'est le prix de l'offline : une image en
`data:` pèse un tiers de plus qu'un fichier, et un fichier à côté serait une
référence externe, ce que le build refuse.

⚠ **LA BORNE DE T10 EST PASSÉE DE 200 000 À 600 000 OCTETS**, et elle a changé
de sens en même temps. Ce que T10 tient VRAIMENT, c'est que le HTML ne référence
rien d'extérieur — cette assertion-là n'a pas bougé d'un mot. La taille n'est
qu'un ordre de grandeur destiné à attraper une explosion : un bundle parti en
boucle, une image entrée deux fois. Elle se relève quand une ressource entre
légitimement, et le lot le dit ; jamais pour faire passer un débordement.
Marge actuelle : **3,8 %** — le lot PREMIÈRE-COUCHE avait porté le HTML à
581 125 octets, et le lot BÂTIMENTS-1024 l'a RAMENÉ à **577 357** : les seize
bâtiments de la V2 se compressent mieux, l'atlas passant de 23 285 à 20 459
octets. Une bascule d'illustration peut donc rendre des octets, et celle-ci en a
rendu 3 768. Le lot TUTORIEL-EN-BAS l'avait mené à 523 905 (+10 993 : les
dix-sept missions dictées, la mini-fenêtre du bas, le compteur par objectif et le
bouton de réouverture de l'onglet Mission), puis la boucle du raid à 530 268.

⚠⚠ **ET LE LOT PREMIÈRE-COUCHE A MANGÉ LA MOITIÉ DE CE QUI RESTAIT : +50 857.**
Deux atlas de sprites entrent en `data:` — **45 111 octets de base64** pour les
16 bâtiments et les 18 tuiles de terrain —, le reste étant le code qui les pose.
C'est la deuxième et la troisième ressource BINAIRE du livrable, après l'atlas de
la carte du monde, et c'est encore le prix de l'offline.

⚠⚠ **LA BORNE DE 600 000 N'A PAS ÉTÉ TOUCHÉE, ET LA MARGE EST MAINTENANT MINCE.**
18 875 octets, soit 3,1 % : les cinq familles de sprites NON cousues — socle,
defense, unite, tourelle-unite, carte, 477 sprites — ne tiendront pas dedans.
Mesuré le 30/08 par `tools/atlas.py` lui-même : sept atlas pèsent **697 898
octets en base64**, à eux seuls. Le prochain lot qui en fait entrer une devra
donc relever la borne EN ÉCRIVANT POURQUOI, jamais rogner un atlas pour passer
dessous. C'est la règle §5 — « baisser une borne pour faire passer un lot :
jamais » — prise par l'autre bout : une ressource qui entre légitimement fait
monter la borne, et le lot le dit.

Le compte de tests a BAISSÉ de sept au lot ORPHELIN — `test/economy.test.js`
est parti avec le module qu'il testait — puis remonté d'un au lot HOMONYMES, de
quatorze au lot ÉCRAN-CHANTIER (treize pour `test/chantier.test.js`, un pour la
garde §11 scindée en deux), et de onze au lot ÉCRAN-NAVIGATION (six pour
`test/offense.test.js`, trois d'orientation dans `test/rendu.test.js`, deux dans
`test/chantier.test.js` — la barre à deux bandes et la pastille de pose), et de
cinq au lot POSE-À-L'ÉCRAN et de **dix** au lot PANNEAU-ET-MARGES, tous dans
`test/chantier.test.js`, et de **cinq** au lot STOCKAGE-ET-VOISINAGE (trois dans
`chantier.test.js`, un dans `disposition.test.js`, un dans `state.test.js`), et de
**six** au lot MISE-EN-PAGE, tous dans `chantier.test.js`, et de **six** au lot
POSE-ET-DÉPLACEMENT (trois dans `chantier.test.js`, deux dans `state.test.js`, un
dans `documentation.test.js` — celui-là n'était pas au brief : il garde le compte
de teintes annoncé par ce fichier-ci, qui venait d'être trouvé faux de cinq), et
de **onze** au lot TUTORIEL : dix dans le nouveau `test/missions.test.js` — le
dixième écrit APRÈS coup, quand la falsification a trouvé que l'écran
recalculait la mission courante au lieu de la demander au moteur — et un dans
`donnees.test.js`, né d'une CI rouge (voir §6, « les types de `package.json` »).
et de **quarante-neuf** au lot GARNISON-ET-ARMÉE, le plus gros saut du projet :
quinze dans le nouveau `test/couts-militaires.test.js` (l'arbitrage des coûts),
dix-huit dans `state.test.js` et `niveau-de-base.test.js` (les deux forces, la
migration, les deux niveaux), sept dans `offense.test.js` et neuf dans
`chantier.test.js`. Quatre gardes de `chantier.test.js` ont CHANGÉ DE CIBLE sans
s'assouplir — leurs littéraux sont passés dans des fonctions — et une cinquième
a été resserrée : elle comparait deux `indexOf` sur tout le module, et une
déclaration remontée l'a fait tomber sans qu'aucun geste ait changé.
Puis de **trois** au lot CITATION (29/08), dans `donnees.test.js` : les deux
courbes confrontées au relevé qui les a mesurées, et l'écart voulu sur les
dégâts exigé DÉCLARÉ dans le fichier qui le commet.
Puis de **neuf** au lot RETOURS-ETHAN (29/08), répartis sur quatre fichiers —
deux dans `base.test.js` (le bâtiment de production par châssis, la réparation
indexée sur le Chantier), deux dans `state.test.js` (le plafond du Chantier, la
règle du bâtiment hors de `verifierEtat`), trois dans `chantier.test.js` (la
géométrie du trait, son accord avec le glyphe, le calque SVG) et deux dans
`offense.test.js` (la barre contextuelle, la palette qui ne défile plus). Aucun
fichier neuf : les six retours d'Ethan touchent du code qui existait déjà.
Puis de **neuf** au lot TUTORIEL-EN-BAS (29/08), tous dans
`test/missions.test.js` — le fichier a été RÉÉCRIT, pas allongé : dix tests
portaient la chaîne de cinq missions du 28/08, dix-neuf portent celle de
dix-sept dictée le 29. Deux d'entre eux ont été RESSERRÉS après falsification :
celui des emplacements passait VERT sur une chaîne devenue injouable, parce
qu'il ne mesurait que le montage écrit dans le test et pas la table de
`data/missions.js` — il lit maintenant la CHAÎNE ; et celui de la mise en page a
changé de cible en même temps que la fenêtre quittait `position: absolute`.
Et de **trente et un** au lot ÉCRAN-CARTE (29/08), dans deux fichiers neufs :
treize dans `test/terrain.test.js` — le pavage, confronté à l'atlas RÉEL décodé
sur place — et dix-huit dans `test/monde.test.js`. Deux d'entre eux ont été
resserrés APRÈS coup, la falsification les ayant trouvés verts sur du code
cassé : celui qui cherchait `ecranMonde.masquer()` n'importe où passait sur un
appel enfermé dans un `if (false)`, et celui qui comparait deux dalles par
`deepEqual` mettait cent secondes à dire « rouge » sur 65 536 pixels — un test
qu'on n'attend pas ne se relance pas.

Et de **onze** au lot PREMIÈRE-COUCHE (30/08) : sept dans le nouveau
`test/sprite.test.js` — l'index confronté au disque, la géométrie confrontée aux
en-têtes des PNG cousus, la formule de cadrage REFAITE plutôt que recopiée, la
levée sur un nom absent, les onze bâtiments résolus, la variante stable et
bornée, et le flux de la simulation intact après une peinture — et quatre dans
`chantier.test.js`. **Aucune assertion existante n'a été retirée ni assouplie**,
et le compte de `chantier.test.js` est passé de 583 à 609.
⚠ Une garde de ce lot est passée VERTE sur du code cassé au premier essai, et
elle a été resserrée : celle qui refuse `etat.rng` dans `variante.js` tombait sur
le COMMENTAIRE du module, qui nomme `etat.rng` pour dire qu'il n'y touche pas.
C'est la troisième fois que le dépôt commet cette faute-là — après
`viewport-fit=cover` et `MENTION_SATURE`. Elle lit maintenant la source
décommentée, et un appât prouve que le motif reconnaît encore la vraie faute.

Une baisse n'est pas forcément une régression, mais elle se justifie, toujours.

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

src/data/               toutes les valeurs de calibrage — 8 fichiers ; RIEN d'autre n'a le droit d'en porter
  combat.js             grille, unités, défenses, modules, ciblage, écrasement, obstacles
  sites.js              bâtiments de site, butin, densité, garnisons, vagues, recherche, géographie
  niveaux.js            courbe de niveau du COMBAT — PV et dégâts
  economie.js           courbe des COÛTS et de la PRODUCTION — distincte de la précédente
  base.js               les onze bâtiments de la base du joueur ; lu par champs, disposition et le tick
  couts-militaires.js   l'ancre du niveau 2 de la défense et de l'offense, entité par entité
  missions.js           la chaîne du tutoriel dictée par Ethan : objectifs, niveaux visés, comptes
  atlas.js              l'index des atlas de sprites — ⚠ GÉNÉRÉ, voir ci-dessous
  ⤷ ⚠⚠ `atlas.js` EST ÉCRIT PAR `tools/atlas.py`, PAS À LA MAIN. Sa première
    ligne le déclare généré, et elle reste. Il dit ce que chaque atlas contient
    et dans quel ordre — rien que les noms cousus et la géométrie de la grille,
    AUCUNE coordonnée : la cellule d'un sprite se calcule de son rang, et écrire
    les paires de nombres ici ferait deux calculs qui peuvent diverger. Le
    régénérer : `python3 tools/atlas.py --ecrire`. Un test le confronte au
    contenu réel de `art/sprites/`, si bien qu'un sprite ajouté sans que l'outil
    soit relancé fait ROUGIR la suite au lieu de faire dessiner de travers.

src/sim/                simulation déterministe, sans DOM — 20 fichiers
  rng.js  clock.js  state.js  grille.js  combat.js  generateur.js
  champs.js             terrain d'une base : 12 champs et 10 obstacles, tirés de la POSITION
  peuplement.js         où sont les bases de l'Ouvrage : dérivé de la graine, jamais stocké
  satellites.js         camps et avant-poste du joueur : de l'HISTOIRE, donc sauvegardée
  disposition.js        validation, voisinage TYPÉ, débits d'une base posée
  economie-base.js      le TICK : stocks, saturation, rattrapage analytique
  carte.js              distances de GEOGRAPHIE → coordonnées, niveau d'une rangée
  niveau-de-base.js     les trois niveaux du JOUEUR : moyennes, en dixièmes
  points-attaque.js     le régulateur de session : plafond à cliquet, barème du raid, territoire
  site-de-la-case.js    une case de la carte → un site jouable : deux graines, saveur, résumé
  site-entame.js        l'après-raid : planchers, ce qui reste debout, ce qui repousse
  raid.js               l'acte : payer, partir, encaisser, revenir abîmé
  reparation.js         les quatre réservoirs, en parallèle : coût additif, temps au maximum
  missions.js           le tutoriel : des QUESTIONS posées à la base, jamais une écriture
  rendu-pose.js         où poser un sprite sur une case : ancrage et variante, sans DOM

src/render/             rendu, sans DOM non plus : rend des primitives — 8 fichiers
  projection.js  canvas2d.js  interpolation.js  scene.js
  orientation.js        où une rangée tombe à l'écran, et la réciproque
  terrain.js            le pavage du fond de carte : il rend des pixels, pas un dessin
  sprite.js             où tombe un sprite dans son atlas : deux chaînes CSS, rien de plus
  variante.js           quel dessin porte une case : pur, stable, sans toucher au tirage
  ⤷ ⚠⚠ LE LECTEUR D'ATLAS NE PORTE PAS LE NOM COURT DE SA PROPRE SOURCE, et ce
    n'est pas négociable : la table qu'il lit vit dans `src/data/` sous un nom
    que le sélecteur d'un téléphone afficherait à l'identique. C'est exactement
    l'accident du 27/08 où le moteur de combat a été écrasé (§6, homonymes).
  ⤷ ⚠ ET LE CHOIX D'UNE VARIANTE NE CONSOMME PAS `etat.rng`. Le flux de l'état
    est celui de la SIMULATION : y prendre un tirage pour choisir une texture
    décalerait tout ce que le moteur tire ensuite, et la partie cesserait de se
    rejouer à l'identique. Le module salue le hachage de `sim/peuplement.js`,
    sous un sel à lui — il n'en écrit pas un second. Un test le prouve en
    relevant l'état du flux avant et après une peinture complète.

src/ui/                 les cinq écrans et leurs éditeurs — 8 fichiers
  session.js            LE SEUL fichier du dépôt qui lise l'horloge murale, une fois
  chantier.js           l'écran de la base : formatage PUR, puis rendu au DOM
  offense.js            l'écran des quatre vagues : il compose l'armée et l'écrit
  mission.js            l'écran du tutoriel — il coche, il ne décide rien
  monde.js              l'écran de la carte : canevas, quatre crans, défilement au doigt
  banc.js               le banc d'essai, désormais derrière un geste de debug
  arsenal.js            éditeur d'assaut — module PUR
  defense.js            éditeur de garnison — module PUR
  ⤷ le DOM reste confiné à ce dossier, mais il n'y a plus UN seul fichier qui y
    touche : `banc.js` et `chantier.js` le font tous les deux, et `session.js`
    les met en scène. La garde de `banc.test.js` porte sur le DOSSIER, pas sur
    un nom.
  ⤷ l'écran de la base est en LECTURE ET EN ÉCRITURE depuis le 27/08 : pose,
    amélioration, démolition, et depuis le 28/08 un panneau de détail. La ligne
    « en lecture » de son en-tête a été fausse pendant deux lots.
  ⤷ ⚠ SES DEUX BANDES SONT ÉDITABLES depuis le lot GARNISON-ET-ARMÉE, et elles
    partagent UN SEUL geste. La table `TERRAINS` porte la seule chose qui les
    sépare — d'où viennent les pièces, quel roster les propose, quelles
    fonctions du moteur on interroge. Un test compte les occurrences des
    fonctions de geste et refuse tout cas particulier nommé à la main.
  ⤷ ⚠ LA PAGE A CINQ ÉCRANS ET UN EN-TÊTE COMMUN — quatre depuis le 28/08, cinq
    depuis le lot ÉCRAN-CARTE, qui a ouvert l'onglet Monde. Les onglets,
    le bandeau des ressources, la bascule entre bases et la barre du bas vivent
    AU-DESSUS des écrans, dans `#jeu` : changer d'écran ne les fait plus
    disparaître. Le fichier de la base construit tout ce chrome — il a les
    formateurs et l'état — mais il ne change pas d'écran lui-même : il le
    DEMANDE à la session par `versEcran`.

test/                   37 fichiers *.test.js (node:test) ; prereglages-lot3a.js n'est PAS un test
  arsenal  assaut  banc  base  carte  champs  chantier  cible  clock  combat
  defense
  disposition  documentation  donnees  economie-base  generateur
  couts-militaires  peuplement  satellites  terrain  monde
  grille  missions  niveau-de-base  offense  points-attaque  raid  rendu  repli  rng
  rendu-pose  reparation  roster  site-de-la-case  site-entame  sprite  state
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

tools/                  16 fichiers, dont UN SEUL sert au build — RECOMPTÉ le 30/08.
                        §2 en annonçait trois, puis sept, puis huit : le huit était
                        déjà faux avant ce lot-ci, la chaîne de production graphique
                        ayant apporté ses scripts sans que personne ne recompte.
                        ⚠ AUCUNE GARDE NE COMPTE CE DOSSIER — le test de §2 ne porte
                        que sur les quatre dossiers de src/ et sur test/ —, et c'est
                        exactement pourquoi il dérive. Le recompter à chaque lot qui
                        y touche est la seule chose qui le tienne.
  build.js              src/ → dist/index.html, un seul fichier autonome, images comprises
  conditionneur.html    outil hors ligne, sans rapport avec le build
  audit-maquette.mjs    confronte foyer-zero-ui.html aux tables — À LA MAIN
  ⤷ plus CINQ scripts Python de traitement de sprites, hors chaîne de build et
    hors `npm run check`. Le dernier arrivé rejoue la chaîne des trois autres
    depuis la racine et produit les trois grilles ; il a deux modes, l'un qui
    n'écrit rien et compare à l'existant, l'autre qui écrit — et il n'écrase
    JAMAIS un fichier commité qui ne se reproduit pas. Aucune garde ne compte ce
    dossier : le test de §2 ne porte que sur les quatre dossiers de `src/` et sur
    `test/`.
android/                enveloppe WebView (app/) + module maj/ (Kotlin, 7 classes, 7 tests JVM)
art/etalon/             étalons visuels des sprites : joueur/, ennemi_pale/, ennemi_sombre/
art/sources/            sprites bruts, hors chaîne de build — 87 fichiers depuis le RANGEMENT
art/sprites/            les sprites conditionnés — NEUF dossiers de grille depuis le
                        lot 0 du 29/08 : unité, bâtiment et terrain, chacun en
                        128, 64 et 32, 144 fichiers en tout. Le terrain était à
                        plat ; il a rejoint la convention des deux autres. Rien
                        de tout ça n'entre dans le livrable aujourd'hui — aucun
                        fichier de `src/` ne cite ces chemins.
art/sprites/carte/      ⚠ LE SEUL DOSSIER D'IMAGES QUI ENTRE DANS LE LIVRABLE.
                        L'atlas de terrain y est LU PAR LE BUILD et inliné en
                        base64 ; son absence fait sortir le build en erreur, pas
                        rendre une carte noire. Le second fichier est l'image de
                        contrôle du pavage, citée par le rapport du lot.
rapports/               rapports et passations de plus de 48 h ; les récents restent à la racine
.github/workflows/ci.yml   web (build + tests) · android (tests JVM + APK) · pages (main seul)
```

`dist/` est un produit de build, jamais commité. Le job `pages` **rebuilde le
HTML dans le job** et génère le manifeste à partir de CE HTML : la
désynchronisation code/livrable est structurellement impossible.

### La racine a été rangée le 28/08, et rien n'a été supprimé

Trente-neuf fichiers **déplacés**, zéro retiré : vingt PNG de sprites déposés
par erreur à la racine sont partis dans `art/sources/`, et dix-sept
`RAPPORT-*.md` plus deux `PASSATION-*.md` de plus de 48 h dans `rapports/`.

⚠ **Les vingt PNG étaient bien ORPHELINS, et ça se mesure.** Aucun des vingt
n'est cité nulle part dans le dépôt — vérifié fichier par fichier avant de
bouger quoi que ce soit, pas seulement dans `src/`.

⚠ **QUATRE CITATIONS POINTENT VERS DES FICHIERS QUI ONT DÉMÉNAGÉ**, et elles
tiennent : `CLAUDE.md` cite `RAPPORT-LOT-1.md` et `PASSATION-2026-08-25.md`,
`PASSATION-2026-08-26-soir.md` cite `PASSATION-2026-08-26.md`, et
`test/champs.test.js` cite `RAPPORT-lotCHAMPS-generateur.md`. **Les quatre sont
de la PROSE, aucune n'est un chemin lu** — c'est ce qui a été vérifié avant le
déplacement, et c'est pourquoi la suite est restée verte. Le jour où l'une
devient un chemin, elle casse.

⚠ **AUCUNE GARDE NE COMPTE LA RACINE.** `documentation.test.js` asserte les
noms de `test/` et des quatre dossiers de `src/`, rien d'autre : ces deux
dossiers-ci ne sont donc décrits que par la §2 ci-dessus, et elle a déjà menti
deux fois.

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
- La carte fait **31 × 300**, pas 9 × 300 : le « 9 » de la §10 de la spec est une
  contamination de la largeur de la grille de combat. Arbitré le 24/08.
  ⚠ **ELLE FAISAIT 30 JUSQU'AU 29/08.** Une largeur paire n'a pas de centre :
  `colonneCentre()` devait trancher entre 15 et 16, et avait retenu 16. À 31,
  16 EST le centre — la fonction rend le même nombre, le départ du joueur
  (275, 16) et la base terminale ne bougent pas d'une case. 29 aurait mis le
  centre en 15, donc déplacé tout ce qui était déjà arbitré.
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
  `SAVE_VERSION` vaut **7** depuis le lot GARNISON-ET-ARMÉE. L'état porte
  `position` (où la base est sur la
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
- ⚠⚠ **LE BLOCAGE DU DÉMARRAGE EST LEVÉ — PAR L'AMORCE, ET LA CHAÎNE EST
  MESURÉE (28/08).** Ce paragraphe annonçait « la partie est instartable » et
  « capacité 0 » ; les deux sont **périmés**, et les garder aurait fait rouvrir
  un arbitrage déjà rendu. Ce qui les a périmés : le lot AMORCE (30 quartz,
  30 scorie, 20 électricité à la fondation) et la poche du Chantier
  (`stockagePropre`, 50 · 50 · 40 au niveau 1). La chaîne, simulée et non déduite :

  | Geste | Stocks | Capacités | Emplac. |
  |---|---|---|---|
  | base neuve | 30 / 30 / 20 | 50 / 50 / 40 | 1 / **3** |
  | Chantier → niv. 2 (**8 quartz**) | 22 / 30 / 20 | 63 / 63 / 50 | 1 / **6** |
  | + Collecteur sur un champ | 22 / 30 / 20 | 63 / 63 / 50 | 2 / 6 |
  | + Raffinerie voisine | 22 / 30 / 20 | **83** / 83 / 50 | 3 / 6 |
  | après 1 h | **83** (saturé) / 30 / 20 | 83 / 83 / 50 | 3 / 6 |

  ⚠ **LA COLONNE DES EMPLACEMENTS A ÉTÉ REMESURÉE LE 29/08** — la table dictée
  par Ethan ouvre 3 puis 6 emplacements là où l'ancienne courbe en ouvrait 2 puis
  4. Les stocks et les capacités, eux, n'ont pas bougé d'une unité : c'est la
  MÊME chaîne, avec deux bâtiments de marge en plus.
  ⚠⚠ **ET LE PREMIER GESTE N'EST PLUS SEULEMENT LE MEILLEUR, IL EST LE SEUL.**
  Le Chantier plafonne désormais le niveau de toute la base : tant qu'il est au
  niveau 1, aucun autre bâtiment ne monte. Monter le Chantier était déjà la
  première ligne de ce tableau ; c'est maintenant la seule montée payable d'une
  partie neuve, et un test de `state.test.js` le vérifie au lieu de le supposer.

  ⚠ **CE TABLEAU A ÉTÉ REMESURÉ LE 28/08 APRÈS LA NOUVELLE COURBE DE STOCKAGE,
  ET IL EST BEAUCOUP PLUS SERRÉ QU'AVANT.** La raffinerie de niveau 1 apportait
  2 880 de capacité ; elle en apporte **20**. L'ouverture ne se joue donc plus
  en posant une raffinerie mais en la MONTANT — ses premiers paliers coûtent 2,
  3 puis 4 quartz et doublent la capacité à chaque fois, ce qui reste payable
  sous un plafond de 83. La boucle est vérifiée, pas supposée.
  ⚠ **ET CETTE FENÊTRE SERRÉE EST VOULUE.** La mesure a été soumise à Ethan le
  28/08 ; réponse : « c'est voulu ». Ce n'est donc pas un défaut d'équilibrage à
  corriger au prochain lot — c'est le démarrage du jeu.

  ⚠ **MAIS LE PLAFOND MORD AVANT LA PREMIÈRE RAFFINERIE, ET C'EST CE QUI A ÉTÉ
  RAPPORTÉ COMME UN BOGUE.** Un Collecteur posé seul produit 240/h contre une
  capacité de 50 : le stock touche le plafond en **cinq minutes**, puis ne bouge
  plus jamais. Ethan a rapporté le 28/08 « aucun bâtiment ne produit de
  ressources » et « pas de calcul hors ligne » — c'est le même plafond, vu deux
  fois, et le moteur avait raison dans les deux cas. Mesuré sur le HTML livré :
  huit heures d'absence rendent exactement zéro quand le stock est saturé, ce
  qui est la définition de saturé.
  ⚠ **LE REMÈDE EST DE L'INTERFACE, PAS DU MOTEUR** — lot PANNEAU-ET-MARGES :
  la capacité saturée porte maintenant le mot « saturé », et le panneau de
  détail du Chantier annonce « emplacements 2 → 4, coût 8 quartz », ce qui rend
  la sortie visible. Ne pas « corriger » le moteur : il n'a rien de faux.

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
  ⚠ **DEUX BÂTIMENTS UNIQUES NE PEUVENT PAS ÊTRE VOISINS** — arbitré le 28/08.
  Sept des onze le sont, donc la règle force la base à s'étaler : c'est elle qui
  lui donne sa géométrie. « À côté » est le voisinage de `casesVoisines`, les
  huit cases — **jamais une seconde notion de voisinage** : le bonus de
  proximité et cette interdiction doivent parler du même 3 × 3, sinon le joueur
  apprendrait deux géométries pour le même mot.
  ⚠⚠ **ELLE EST TOLÉRÉE AU CHARGEMENT, ET C'EST OBLIGATOIRE.** La règle est née
  APRÈS des sauvegardes qui la violent : la base d'Ethan, mesurée sur sa capture
  du 28/08, porte le Centre de commandement, le QG de défense et le Chantier
  côte à côte. Faire lever `verifierEtat` là-dessus aurait rendu sa partie
  **injouable**, pour une faute qu'il n'a pas commise. D'où
  `CODES_TOLERES_AU_CHARGEMENT` dans `sim/state.js`.
  ⚠ **TOLÉRÉ N'EST PAS EFFACÉ.** Le défaut reste signalé, l'écran le montre, et
  il interdit toujours toute NOUVELLE pose au contact d'un unique — car
  `problemesDeLaPose` ne filtre que les défauts PRÉEXISTANTS. Le joueur voit, le
  joueur purge.
  ⚠ **N'Y METTRE QU'UNE RÈGLE NÉE APRÈS DES SAUVEGARDES.** Un code structurel —
  `sans-chantier`, `superposition`, `hors-base` — n'a jamais été légal, donc
  aucune sauvegarde honnête ne le porte, et le tolérer ferait tourner le moteur
  sur un état incohérent. Un test l'asserte de face.
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

- ⚠⚠ **L'ÉTAT PORTE DEUX FORCES DEPUIS LE 28/08 : `garnison` ET `armee`.**
  C'est ce qui débloquait d'un coup l'écran Offense, la bande Défense, les deux
  compteurs du bandeau et le filtrage des palettes. Deux LISTES CREUSES, à la
  même forme que `disposition` — un objet par pièce posée, rien pour une case
  vide : `{ id, rangee|vague, colonne, niveau, degatsMilli }`.
  ⚠ **`degatsMilli` ET NON `pvMilli`.** Une pièce intacte se sérialise à `0`, et
  surtout : le jour où un PV de `data/combat.js` change, une valeur ABSOLUE
  enregistrée peut dépasser le maximum et rendre la sauvegarde incohérente en
  silence. Des dégâts se BORNENT à la lecture. Milli-PV parce que c'est l'unité
  du moteur de combat.
  ⚠ **UNE PIÈCE DÉTRUITE RESTE DANS SA CASE.** Arbitré par Ethan le 28/08 :
  « les unités sont détruites mais pas perdues, doivent être réparées ». Elle
  compte encore dans la moyenne de niveau ET dans les points engagés — la
  décompter ferait de la destruction une façon de poser plus d'unités.
  ⚠ **AUCUN TABLEAU PARALLÈLE.** Niveau et dégâts vivent DANS la pièce. C'est
  exprès : le couplage `economie.residus` ↔ `disposition` est ce qui rend
  `deplacer` délicat, et on ne l'a pas recréé.
  ⚠ **LE NIVEAU EST PAR PIÈCE, MAIS RIEN NE PERMET D'EN POSER DEUX DIFFÉRENTS.**
  Les éditeurs portent UN niveau pour toute la grille et le recopient. Le ranger
  par pièce coûte zéro et évite une SECONDE migration le jour où la mécanique
  sera arbitrée. Comment se choisit le niveau d'une pièce posée n'est PAS tranché.
  ⚠⚠ **`verifierEtat` NE VÉRIFIE NI LE BUDGET NI L'APPARITION, ET C'EST VOULU.**
  Une composition trop chère arrive pour de bon dès que le budget BAISSE — QG
  démoli, QG tombé au raid — sous une armée déjà posée. La refuser au chargement
  rendrait la partie injouable pour une faute que le joueur n'a pas commise,
  exactement comme l'aurait fait `uniques-voisins`. On SIGNALE, le joueur purge.
  ⚠⚠ **`purger` NE S'APPLIQUE JAMAIS TOUTE SEULE** — décidé à ce lot, et c'est
  « rien ne se retire en silence » (§4) appliqué. Un test balaie `src/ui/` pour
  qu'aucun écran ne l'appelle de lui-même. L'écran Offense affiche le
  dépassement en toutes lettres, et dit que rien n'est retiré tout seul.
  ⚠ **La migration 6 → 7 N'AJOUTE QUE DEUX LISTES VIDES.** Une sauvegarde v6 ne
  porte aucune composition : il n'y a rien à convertir. C'est la migration la
  plus sûre de la chaîne.

- **`niveauDeCommandement` EST LE SEUL ENDROIT QUI LISE LE NIVEAU D'UN BUDGET.**
  `POINTS_ARMEE` de `data/sites.js` nomme déjà le bâtiment de chaque côté —
  Centre de commandement pour l'offense, QG de défense pour la défense — et le
  budget comme le filtrage des palettes en découlent tous les deux.
  ⚠ **IL REND `null`, PAS ZÉRO.** Les deux bâtiments sont `unique: true` et
  aucun n'est dans la base neuve : tant qu'ils ne sont pas posés, il n'y a pas
  de budget du tout, ce qui n'est pas un budget nul. « 0 / 0 » ferait croire à
  un plafond atteint là où il n'y en a aucun.
  ⚠ **« PAS DE BÂTIMENT, PAS DE BUDGET » N'EST PAS ARBITRÉ.** C'est le défaut
  retenu, cohérent avec une base neuve qui ne porte qu'un Chantier. Il tient en
  une ligne chez l'appelant, exprès : si Ethan tranche autrement, il n'y a qu'un
  endroit à changer.

- ⚠⚠ **LES COÛTS DE CONSTRUCTION DE LA DÉFENSE ET DE L'OFFENSE SONT ARBITRÉS
  (28/08), et ils vivent dans `data/couts-militaires.js`.** Le niveau 1 est
  gratuit des deux côtés — c'est `premierNiveauPayant`, pas une seconde
  constante — et l'ancre du niveau 2 est donnée entité par entité. Au-delà, la
  courbe est celle d'`ECONOMIE_NIVEAU`, la même que pour les bâtiments.
  ⚠⚠ **LA MÊME UNITÉ NE COÛTE PAS LE MÊME PRIX EN DÉFENSE ET EN OFFENSE.**
  Mesuré : cinq unités sur huit changent de prix selon le rôle (le Voltigeur
  vaut 5 en assaut et 2 en garnison), trois coïncident. Il y a donc DEUX tables
  d'ancres, jamais une seule indexée par unité — une table unique aurait paru
  marcher sur trois cas et faussé les cinq autres en silence.
  ⚠⚠ **LA DÉFENSE SE PAIE DANS DEUX RESSOURCES.** Les six ouvrages fixes — mur,
  barbelés, barrière anti-char, tourelle mitrailleuse, canon anti-char, DCA — en
  QUARTZ ; les trois artilleries et les huit unités de garnison en SCORIE. La
  ressource est écrite LIGNE PAR LIGNE : aucune règle ne la résume sans mentir
  sur au moins une entité. Le partage n'est pourtant pas arbitraire —
  `data/combat.js` disait déjà que les trois artilleries sont des VÉHICULES et
  non des structures — et un test asserte la corrélation sans l'exploiter.
  ⚠ **`RESSOURCE_DE_COUT` A PERDU SA CLÉ `defense`, ET L'ABSENCE EST LE
  MESSAGE.** Elle valait « scorie » depuis le 27/08, en anticipation et sans que
  rien ne la lise ; l'arbitrage la falsifie pour six entités sur dix-sept. Un
  test asserte son absence.
  ⚠ **LA RAMPE DE COÛT A QUITTÉ `data/base.js` POUR `data/economie.js`**, à côté
  de la courbe qu'elle applique. La recopier aurait fait deux implémentations du
  même arrondi palier par palier, et la première divergence se serait lue comme
  un déséquilibre de jeu. Ce qui change de famille en famille, c'est l'ANCRE.
  ⚠ **L'ÉLECTRICITÉ EST LA MÊME RÈGLE QUE POUR LES BÂTIMENTS** — le quart, à
  partir du niveau 3, par `COUT_ELECTRICITE`. C'est ce que dit
  `RELEVE-TA-COURBES-2.md` §5 : « l'électricité vaut systématiquement le quart de
  la monnaie principale ». Aucune fraction propre au militaire n'est arbitrée,
  et c'est la seule lecture de ce lot qui va au-delà du message d'Ethan.

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
- ⚠⚠ **LA COURBE DE STOCKAGE A CHANGÉ DE NATURE LE 28/08, ET `autonomieHeures`
  N'EXISTE PLUS.** Ethan a jugé l'ancienne « chelou » et l'a remplacée par des
  chiffres absolus : **20 pour la raffinerie, 15 pour l'accumulateur au niveau
  1, × 2 par palier jusqu'au niveau 10, puis un multiplicateur décroissant
  linéairement jusqu'à 1,333 au niveau 50**. La capacité ne se déduit donc plus
  du débit du producteur apparié : c'est la règle §4 appliquée — deux grandeurs
  qui partageaient une constante ont divergé, on les a séparées.
  ⚠ **L'AUTONOMIE N'EST PLUS CONSTANTE, ET L'ÉCART EST ÉNORME.** Mesurée face à
  un collecteur de même niveau : **cinq minutes au niveau 1, quarante et un ans
  au niveau 50**. L'ancienne courbe donnait 12 h partout. C'est délibéré, et
  c'est ce qui fait du stockage l'investissement qui structure la partie.
  ⚠⚠ **SA QUEUE A ÉTÉ ÉCRASÉE LE MÊME JOUR, ET IL FAUT SAVOIR POURQUOI.** La
  première écriture montait à × 1,333 au niveau 50 : une seule raffinerie de
  niveau 50 valait alors 53 % de l'entier sûr de JavaScript **à elle seule**, et
  deux le dépassaient. Ethan, mis devant la mesure : « fais au mieux pour les
  courbes stockage mais j'aime bien le × 2 des dix premiers. Sinon écrase les
  derniers niveaux pour que ça rentre. » Le × 2 est donc INTACT, et c'est la fin
  de la rampe qui est descendue : de 1,333 à **1,05**.
  ⚠ **LA CIBLE EST LA BASE LÉGALE LA PLUS GROSSE, PAS UNE BASE PLAUSIBLE** :
  40 emplacements au niveau 50, moins le Chantier, donc **39 bâtiments de
  stockage**. Dégénéré mais légal, et l'exactitude arithmétique ne se règle pas
  sur ce qui est vraisemblable. Mesuré : 3,18 × 10¹⁵ milli, soit **2,8 fois de
  marge** ; 5,5 fois à vingt raffineries, 110 fois à une seule.
  ⚠ **ET AUCUN PALIER N'EST MORT.** Écraser n'est pas aplatir : le
  multiplicateur descend de 1,976 au palier 11 à 1,05 au palier 50, donc le
  dernier niveau apporte encore +5 %. Un multiplicateur de 1 aurait laissé
  davantage de marge et rendu les derniers niveaux inutiles à acheter — un test
  refuse les deux bouts.
  ⚠ **`CAPACITE_MILLI_MAX` EST DÉSORMAIS UNE GARDE MORTE, ET C'EST CE QU'ON LUI
  DEMANDE.** Il ne mord sur AUCUNE base légale, et un test l'asserte de face. Le
  jour où il recommencerait à mordre, c'est que les données auraient dérivé.
  ⚠ **ON ÉCRÊTE, ON NE LÈVE PAS** — le contraire du choix fait pour
  `DEBIT_MILLI_PAR_HEURE_MAX`. Un débit qui déborde fausse le rattrapage en
  silence ; une capacité qui déborde ne fausse rien, elle borne.
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

### Sur les types de `package.json`

- ⚠⚠ **`config.build` ET `version` SONT DES CHAÎNES, PAS DES NOMBRES.**
  `android/app/build.gradle.kts` les lit `as String` — `version` directement,
  `config.build` puis `.toInt()`. Un nombre y fait lever
  « class java.lang.Integer cannot be cast to class java.lang.String », et le
  build Android tombe à la CONFIGURATION, avant le moindre test.
  ⚠ **AUCUN TEST JS NE LE VOYAIT, ET C'EST CE QUI L'A RENDU COÛTEUX.**
  `tools/build.js` fait `pkg.config?.build ?? '0'` et l'interpole ; le workflow
  l'interpole aussi. Les deux marchent avec l'un comme avec l'autre type. Seul
  Kotlin s'en soucie, et **le job `android` est le seul qui ne tourne pas ici**.
  Commis le 28/08 en réécrivant `package.json` avec un sérialiseur JSON, qui a
  rendu `"26"` en `26`.
  ⚠ **LA GARDE LIT LE GRADLE, ELLE NE RECOPIE PAS LA LISTE DES CHAMPS.**
  `donnees.test.js` extrait de `build.gradle.kts` les champs coulés `as String`
  et exige que `package.json` les porte en chaînes. Recopier « version et
  build » aurait vieilli au premier champ ajouté ; un test refuse aussi que les
  motifs ne trouvent plus rien, ce qui arriverait si le Gradle était reformaté.
  ⚠ **ET LE MANIFESTE DE PAGES, LUI, VEUT UN NOMBRE.** Le workflow interpole
  `config.build` **sans guillemets** dans `manifest.json`, et `Manifeste.analyser`
  du module `maj` le relit `as? Long`. Les deux sont cohérents tant que la
  chaîne est un entier décimal — ce que la garde asserte aussi.
  ⚠ **`:maj:test` NE SUFFIT PAS À LE VÉRIFIER ICI.** Sans SDK Android,
  `settings.gradle.kts` EXCLUT `:app`, donc `app/build.gradle.kts` n'est jamais
  évalué : la suite Kotlin passe en local pendant que la CI tombe. Le seul
  garde-fou exécutable ici est celui de `donnees.test.js`.

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

- ⚠⚠ **LE TEMPS VIENT DE L'HORLOGE, JAMAIS DE L'HORODATAGE D'IMAGE.** Défaut le
  plus coûteux de l'écran, trouvé le 27/08 en essayant le jeu sur GitHub Pages.
  La boucle mesurait l'écoulement sur les horodatages de
  `requestAnimationFrame` : ils sont **monotones et ne courent pas pendant qu'une
  page est gelée**. Tant qu'un `visibilitychange` encadrait le gel,
  `reprendre()` réparait — mais **quand l'évènement ne se déclenche pas, le temps
  est perdu pour toujours**, et sur Android c'est le cas courant, pas le cas rare.
  ⚠ **Mesuré, pas supposé** : deux minutes de gel sans évènement produisaient
  **0,006 unité au lieu de 8**. Ethan voyait un compteur qui n'avance que
  pendant qu'on le regarde — « je suis parti quelques minutes et le compteur n'a
  pas bougé ».
  ⚠ **Le remède n'est PAS un évènement de plus.** Ajouter `pageshow`, `focus` ou
  `resume`, c'est parier que celui-là se déclenchera toujours. `creerChronometre`
  de `ui/session.js` ne dépend d'aucun : `requestAnimationFrame` dit QUAND
  dessiner, l'horloge dit COMBIEN de temps a passé. Un gel manqué se répare à la
  première image du retour, où l'écart mesuré est simplement grand.
  ⚠ **La source de l'heure est INJECTÉE** dans le chronomètre — testable sans DOM
  ni horloge système, et `maintenantMs` reste seule lectrice de l'horloge dans
  tout `src/`, comme la garde §11 l'exige.

- **LA PALETTE EST FERMÉE : trente-trois teintes, plus un seul `rgba`.**
  `banc.test.js` balaie `src/render/`, `src/ui/` et `src/index.src.html` et
  refuse toute couleur hors de `FICHE-STYLE.md`, ainsi que tout `rgba` autre que
  `rgba(0,0,0,0.31)`. Aucune transparence, donc — ni tuile pâle, ni gris
  intermédiaire. Les trente-trois : cinq de châssis kaki, cinq de sol joueur,
  cinq de sol Ouvrage, cinq d'ardoise Ouvrage, quatre d'accents de terrain,
  trois de métal, six d'accents fonctionnels.
  ⚠ **CE PARAGRAPHE DISAIT « VINGT-HUIT » JUSQU'AU 28/08 AU SOIR, ET IL AVAIT
  TORT DE CINQ.** Son énumération avait perdu une rampe entière — les cinq tons
  du sol de l'Ouvrage — exactement comme la liste de `banc.test.js` en avait
  perdu trois la veille. La GARDE, elle, était juste : elle porte les
  trente-trois et un test l'égale à la fiche dans les deux sens. C'est la PROSE
  qui avait vieilli, et rien ne la confrontait.
  ⚠ **DÉSORMAIS SI** — `documentation.test.js` décode le nombre écrit en lettres
  ici, somme l'énumération, et exige que les deux valent le compte de teintes
  distinctes de `FICHE-STYLE.md`. Le total ET le détail : annoncer
  « trente-trois » au-dessus d'une énumération qui fait vingt-huit passerait
  sous une garde qui ne lirait que le total.
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
- **LES TROIS ACTIONS SONT BRANCHÉES DEPUIS LE 27/08, SUR LE MODÈLE « ARMER
  PUIS TOUCHER ».** C'est l'INVERSE de ce qui existait : on ne sélectionne plus
  un bâtiment pour activer les boutons, on arme un bouton puis on touche le
  bâtiment. Quatre règles, toutes arbitrées :
  retoucher l'action armée la désarme ; armer une action désarme l'autre ; armer
  une action défait aussi la palette — **un seul mode à la fois** ; et toucher
  une case VIDE désarme **sans rien dire**, comme un clic à côté d'un menu.
  L'action se désarme dans tous les cas, réussite comme refus.
  ⚠ **LES BOUTONS NE SONT PLUS DÉSACTIVÉS**, et ils ne peuvent plus l'être :
  c'est le bouton qu'on touche EN PREMIER. Un test refuse qu'un `disabled`
  revienne sur les trois, ce qui rendrait tout le modèle inatteignable au doigt.
  ⚠ **RÉPARER N'A PAS DE MOTEUR, ET SON REFUS EST LA SEULE PHRASE ÉCRITE DANS
  L'INTERFACE.** `REPARATION_BASE_JOUEUR` est une table de calibrage, aucune
  fonction ne répare, aucun bâtiment ne porte de dégâts. Le bouton suit quand
  même le chemin complet — il s'arme, il se désarme — et dit ce qui est vrai.
  Un test asserte que `sim/state.js` n'exporte toujours rien qui répare : **il
  est fait pour tomber** le jour où le moteur en gagne une, et dire quoi
  brancher.
  ⚠ **ON DEMANDE, PUIS ON AGIT — ET LA GARDE VISE AUSSI LE POINT D'APPEL
  INDIRECT.** L'écran n'appelle pas `ameliorer(...)`, il appelle
  `action.agir(...)` par la table `ACTIONS`. Une garde qui ne cherchait que les
  noms directs laissait passer un `try` autour de la répartition — la seule
  forme sous laquelle la faute se commettrait ici, et la falsification l'a
  débusquée. Elle refuse maintenant les deux.
- **LA POSE EST BRANCHÉE DEPUIS LE 27/08.** La palette est vivante, le joueur
  choisit un bâtiment, il touche, ça se pose.
  ⚠ **SEUL LE COLLECTEUR VOIT SES CASES CERCLÉES** (27/08). C'est le seul
  bâtiment pour qui le TERRAIN décide — `CHAMPS.posableDessus` ne contient que
  lui — et cercler soixante cases sur soixante-douze pour les dix autres
  n'apprend rien. **C'est l'AFFICHAGE qui disparaît, pas la règle** :
  `problemesDeLaPose` est interrogée exactement comme avant, et une case
  illégale dit toujours pourquoi. L'écran LIT la table, il n'écrit pas
  « collecteur » en dur — un test le garde.
  ⚠ **LA PALETTE SE DÉSÉLECTIONNE APRÈS LA POSE** (27/08). Poser deux bâtiments
  de suite demande de rechoisir, contre le risque de poser par inadvertance au
  toucher suivant. Et la SAUVEGARDE passe avant le repeint, pas après.
  ⚠ **LE COMPTEUR D'EMPLACEMENTS A DISPARU AVEC LA BARRE DE GAUCHE** (27/08).
  Ce qu'il disait se dit maintenant au toucher d'une vignette : si la base est
  pleine, un toast le dit AVANT que le joueur cherche une case. La grandeur
  reste calculée par `resumeDeLaBase` — c'est l'affichage permanent qui part.
  ⚠ **LA GRILLE SE CENTRE PAR LA MISE EN PAGE, JAMAIS PAR UNE TRANSFORMATION.**
  Un `transform: scale()` décrocherait le doigt de la case qu'il vise : le
  dessin bougerait, pas la géométrie du pointage. La largeur de la grille est
  plafonnée (`--case-max`, 46 px, la borne haute mesurée par la passation du
  27/08) et `margin-inline: auto` répartit également ce qui reste.
  ⚠ **UN TOAST N'EST PAS UN BANDEAU.** Les refus d'action répondent à un geste
  et s'effacent seuls ; les messages de la SESSION — sauvegarde impossible,
  sauvegarde illisible — décrivent un état qui dure et ne s'effacent pas. Les
  deux passent par `#chantier-avis`, et `avis()` l'emporte sur `toast()`.
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

- ⚠⚠ **LES BARRES SYSTÈME D'ANDROID MORDAIENT SUR L'ÉCRAN, ET LE JEU EN ÉTAIT
  INJOUABLE.** Rapporté par Ethan le 28/08, capture à l'appui : la rangée
  d'onglets passait sous l'horloge, la palette sous les trois boutons de
  navigation. **En navigateur aussi**, dès que la page passe en plein écran.
  ⚠ **LA CAUSE ÉTAIT UNE MOITIÉ DE MÉCANISME, PAS UN OUBLI ENTIER.**
  `viewport-fit=cover` était posé depuis le premier jour — il DEMANDE
  explicitement à dessiner sous les barres — et pas un seul
  `env(safe-area-inset-*)` ne rendait la place. L'enveloppe vise `targetSdk 35`,
  où l'affichage bord à bord est imposé : la WebView occupe toute la dalle.
  ⚠ **LE CORRECTIF EST DANS LE HTML, PAS DANS L'ENVELOPPE, et c'est délibéré.**
  Le HTML se met à jour tout seul par Pages ; corriger côté Android demanderait
  de reconstruire et de réinstaller l'APK, et se battrait de toute façon contre
  `viewport-fit=cover`. Les quatre côtés sont pris sur `body`, qui est le parent
  des trois écrans : un quatrième en héritera sans qu'on y pense.
  ⚠ **LES DEUX VONT ENSEMBLE.** `viewport-fit=cover` seul est exactement le
  défaut ; les `env()` seuls sont inertes, car sans lui les quatre valent zéro.
  Un test l'écrit pour qu'on ne puisse pas retirer l'un en croyant garder
  l'autre.

- ⚠⚠ **UNE CLASSE QUE LE JS BASCULE ET QUE LA FEUILLE IGNORE EST UN LOT ENTIER
  QUI NE SE VOIT PAS.** Le lot ÉCRAN-ACTIONS posait `classList.toggle('arme')`
  sur les trois boutons — le JavaScript était juste — et **aucune règle CSS ne
  peignait `arme`** : armer une action ne changeait strictement rien à l'écran,
  donc le modèle « armer puis toucher » était invisible au doigt. Livré comme ça,
  et relevé sur appareil.
  ⚠ **AUCUN TEST NE POUVAIT LE VOIR, ET C'EST RÉPARÉ D'UNE AUTRE MANIÈRE.** Une
  classe sans règle n'est pas du JS faux, c'est du CSS absent, et le dépôt n'a
  pas de navigateur. Ce qui SE teste sans navigateur, c'est la confrontation des
  deux sources : `chantier.test.js` extrait les littéraux de
  `classList.toggle/add` de tout `src/ui/` et exige de chacun une règle dans
  `index.src.html`. La garde ne dit pas que le style est BEAU, elle dit qu'il
  EXISTE — et c'est exactement ce qui manquait.
  ⚠ **ELLE LIT LA FEUILLE DÉCOMMENTÉE.** Deux gardes de ce lot se sont d'abord
  satisfaites de leur propre prose : celle des marges trouvait
  `viewport-fit=cover` dans le paragraphe qui l'explique, celle du mot
  « saturé » trouvait `MENTION_SATURE` dans sa propre déclaration. **Une garde
  qui lit ce qu'on a écrit à son sujet ne garde rien.** Les deux ont été
  resserrées — balise `<meta>` réelle, usage dans un `textContent =` — après
  falsification.

- **LE PANNEAU DE DÉTAIL PROJETTE AVEC LES FONCTIONS DU MOTEUR, JAMAIS AVEC UNE
  FORMULE.** `apercuDuBatiment` fabrique la disposition CANDIDATE — la même
  liste, ce bâtiment monté d'un niveau — et la soumet à `debitDuBatiment` et
  `capacitesMilli`. Une projection écrite dans l'écran (« × 1,25 par niveau »)
  serait une seconde lecture des règles, et elle aurait **déjà tort** : la poche
  du Chantier, le voisinage et le stockage ne suivent pas la même pente, et
  `capacitesMilli` somme des bâtiments dont un seul monte.
  ⚠ **AU PLAFOND, TOUT LE VOLET « APRÈS » VAUT `null`, PAS ZÉRO.**
  `coutDeMontee` et `capaciteDuNiveau` LÈVENT au-delà de `niveauPlafond` ; et un
  « améliorer pour 0 » se lirait comme gratuit.
  ⚠ **LE COÛT SE NOMME MAINTENANT AVEC SA RESSOURCE**, ce que le lot précédent
  ne pouvait pas faire. `coutDeMontee` rend les trois et c'est exactement ce
  qu'`ameliorer` débite : le panneau LIT la table. Mesuré le 28/08 sur 11
  bâtiments × 49 paliers — **la scorie ne coûte jamais rien** (0 sur 539) et
  l'électricité coûte à partir du niveau 3 (527 paliers). Seules les ressources
  non nulles sont nommées : « 8 quartz · 0 scorie » enverrait chercher une
  dépense qui n'existe pas.

- **LA LIGNE D'AVIS PORTE TROIS REGISTRES, ET LA PRIORITÉ EST ÉCRITE** —
  `session` > `toast` > `mode`, dans `ligneAAfficher`, qui est pure.
  ⚠ **AVANT, TROIS APPELANTS ÉCRIVAIENT AU MÊME ENDROIT SANS SE CONNAÎTRE.**
  `armer()` posait `avis('')` : armer une action effaçait donc au passage une
  alerte de sauvegarde que personne n'avait lue. Et le MODE n'écrivait rien du
  tout — armer « Démolir » ne disait rien, et le bâtiment suivant qu'on touchait
  disparaissait.
  ⚠ **LE TOAST PASSE DEVANT LE MODE, ET NON L'INVERSE.** « il manque 8 de
  quartz » répond au doigt qui vient de se poser ; « mode Améliorer » est un
  rappel qu'on peut relire quatre secondes plus tard.
  ⚠ **UN MODE N'EST PAS UNE ALERTE** : métal, pas rouge. Le rouge des refus lui
  donnerait l'air d'une panne, et le joueur chercherait ce qu'il a cassé.

- **LE COMPTEUR D'EMPLACEMENTS EST REVENU (28/08), ET LE TOAST RESTE.** Il avait
  été retiré la veille avec la barre de gauche, au motif que la saturation se
  dirait au toucher d'une vignette. Ethan : « il n'y a plus la limite de
  bâtiment ». **Un plafond qu'on ne découvre qu'en le heurtant n'est pas un
  plafond, c'est une surprise.**
  ⚠ **ET LA SATURATION SE DIT PAR UNE LIGNE DE MODE, PLUS PAR UN TOAST.** Elle
  décrit un état qui dure aussi longtemps que le mode de pose ; en toast, elle
  s'effaçait au bout de quatre secondes et laissait reparaître « touchez une
  case libre » alors qu'il n'y en a aucune. Il se range avec les ressources — il se lit
  comme un stock plafonné, « 1 / 2 » — et non dans un bandeau à lui : c'est le
  BANDEAU qui est mort, pas le chiffre.

- **LE PANNEAU S'OUVRE AU TOUCHER, PAS À LA SÉLECTION.** `peindre()` sélectionne
  le Chantier d'office à la première image : ouvrir sur une sélection ferait
  reparaître le panneau après chaque pose et chaque amélioration, par-dessus la
  grille que le joueur regarde.
  ⚠ **SON BOUTON « AMÉLIORER » AGIT DIRECTEMENT, SANS ARMER**, et ce n'est pas
  une entorse au modèle « armer puis toucher ». Ce modèle existe parce que les
  boutons du bandeau contextuel n'ont pas de cible ; celui-ci en a une — le
  bâtiment dont le panneau parle — et lui demander de viser ensuite serait un
  geste pour rien.
  ⚠ **IL RESTE VIF QUAND C'EST IMPOSSIBLE.** « Un indice n'est pas une
  interdiction » (§4) : le refus chiffré du moteur en apprend plus qu'un bouton
  mort, et il faut pouvoir le lire en appuyant.
  ⚠ **IL SE FERME EXPLICITEMENT AU CÂBLAGE.** Le `hidden` du balisage suffit
  aujourd'hui, mais il serait la SEULE chose à le tenir fermé au démarrage : un
  attribut oublié à la prochaine reprise du HTML l'ouvrirait par-dessus la
  grille sans qu'aucun test le voie.

- **LE PANNEAU PORTE UN CHRONOMÈTRE, ET SA CONDITION EST DANS L'ARBITRAGE.**
  Ethan, 28/08 : « quand l'amélioration n'est pas possible, indiquer un
  chronomètre. **Si le stock requis est sous le seuil du stockage maximum.** »
  La seconde phrase porte tout : un coût plus grand que la capacité de la base
  n'arrivera JAMAIS, et un compte à rebours dessus tournerait sans atteindre
  zéro. `delaiAvantAmelioration` rend donc trois réponses distinctes — une
  attente chiffrée, un mur de stockage, une ressource que rien ne produit — et
  `null` quand c'est payable tout de suite.
  ⚠ **LE DÉLAI EST LE MAXIMUM SUR LES RESSOURCES, PAS LEUR SOMME** : les trois
  montent en parallèle, c'est la dernière à arriver qui décide.
  ⚠ **ARRONDI VERS LE HAUT, ET LA FALSIFICATION L'A EXIGÉ.** Annoncer une
  seconde de moins que la vérité ferait cliquer le joueur sur un refus. Le
  premier montage du test tombait sur une division exacte, où `floor` et `ceil`
  rendent le même nombre : il passait sur les deux codes, donc il ne mesurait
  pas l'arrondi. **Un montage qui tombe rond ne mesure pas un arrondi.**

- **LES PASTILLES DE CASE LIBRE SONT PARTIES (28/08), LE COMPTEUR RESTE.** Elles
  marquaient en haut de la grille autant de cases vides qu'il restait
  d'emplacements — un NOMBRE dessiné à des endroits sans rapport avec les cases
  que le joueur choisirait. « Emplac. 3 / 4 » dit la même grandeur sans mentir
  sur la géométrie.

- ⚠⚠ **« TU COMPRESSES TOUT DANS L'UI » — CONSIGNE PERMANENTE D'ETHAN, 28/08.**
  Elle est plus forte que « pas de dépassement » : **tout doit TENIR dans
  l'écran, rien ne déborde, rien ne défile horizontalement, aucune barre n'en
  pousse une autre hors du cadre.** Un lot qui ajoute un contrôle le fait entrer
  dans la place existante — le bandeau contextuel est passé de trois à quatre
  boutons sans grandir d'un pixel, ce sont les écarts et le bloc de gauche qui
  ont cédé.
  ⚠ **UNE GARDE LA TIENT, AUTANT QU'UN DÉPÔT SANS NAVIGATEUR LE PERMET.**
  `chantier.test.js` somme les hauteurs fixes des six barres de la colonne de
  jeu — 40 + 44 + 26 + 46 + 46 + 86 = **288 px** — et refuse au-delà de 320. La
  borne se justifie : sur la dalle la plus courte encore en service (568 px de
  haut en CSS), 320 px de chrome laissent 248 px de grille, soit cinq rangées.
  Elle asserte aussi la LISTE des barres à hauteur fixe : une septième la fait
  tomber, ce qui force à regarder plutôt qu'à ajouter.

- ⚠⚠ **L'EN-TÊTE A QUITTÉ L'ÉCRAN DE LA BASE (28/08), ET C'EST STRUCTUREL.**
  Les onglets et le bandeau des ressources vivaient DANS `#ecran-chantier` :
  passer à l'Offense les faisait disparaître. Ethan : « garder la barre quartz
  scories etc et monde option dans le menu offense ». Ils sont maintenant dans
  `#jeu`, au-dessus de `#ecrans`, et tout écran à venir en hérite — même
  raisonnement que les marges système posées sur `body`.
  ⚠ **L'ORDRE DU DOCUMENT EST L'ORDRE DE L'ÉCRAN, jamais un `order` CSS.** Le
  même dessin obtenu par `order` casserait la navigation au clavier et la
  lecture par un lecteur d'écran. Un test compare les POSITIONS des identifiants
  dans le HTML produit.
  ⚠ **L'ÉCRAN DEMANDE, LA SESSION DÉCIDE.** `ui/chantier.js` construit la barre
  du bas — il a les formateurs et l'état — mais un de ses trois boutons change
  d'ÉCRAN, ce que seule la session sait faire : il appelle `versEcran`, comme il
  appelle `apresPose` pour écrire. Un test refuse que l'écran de la base nomme
  `ecran-offense` en dur.

- ⚠⚠ **LE NUMÉRO DE VERSION A DÉMÉNAGÉ DANS LES OPTIONS, ET IL A FALLU CRÉER
  L'ÉCRAN POUR ÇA.** Ethan voulait la barre du bas entière pour ses trois
  boutons. Or ce numéro PORTE l'appui long de 1,5 s qui ouvre le banc d'essai :
  le déplacer sans abri l'aurait rendu inatteignable — et **T10 de
  `banc.test.js` serait resté VERT**, puisqu'il exige la PRÉSENCE des contrôles
  dans le HTML, pas leur accessibilité. D'où `#ecran-options`, et l'onglet
  Options qui cesse d'être mort.
  ⚠ **LE BANC CACHE `#jeu`, PLUS LES ÉCRANS UN PAR UN.** Il en nommait deux ;
  avec trois écrans et deux barres communes, en oublier un n'était qu'une
  question de temps — le banc se serait ouvert par-dessus les onglets restés
  visibles.

- **LE COMPTEUR DU BANDEAU CHANGE DE LIBELLÉ AVEC LE CONTEXTE**, et deux de ses
  trois valeurs sont un tiret. Arbitré le 28/08 : « quand on passe en défense, le
  nombre d'emplacement change pour celui des points de défense. Idem pour
  offense. » Le LIBELLÉ change ; la valeur reste « — » parce que l'état ne porte
  ni garnison ni armée. `CONTEXTES[x].chiffre` dit si la grandeur EXISTE, pas si
  elle vaut zéro.
  ⚠ **L'ÉCRAN L'EMPORTE SUR LA BANDE** pour décider du contexte : sur l'Offense,
  allumer « Base » parce que le défilement s'y était arrêté dirait au joueur
  qu'il regarde sa base alors qu'il regarde ses vagues.

- **LES DEUX PALETTES NE DÉFILENT PLUS, ELLES TIENNENT.** Deux rangées, et le
  nombre de colonnes se CALCULE — `Math.ceil(longueur / 2)`. Celle du Chantier
  avait des colonnes de 82 px et un défilement horizontal : la première vignette
  était coupée et deux bâtiments vivaient hors de l'écran. Écrire « 6 »
  marcherait aujourd'hui et mentirait au douzième bâtiment.
  ⚠ **CELLE DE L'OFFENSE A SUIVI LE 29/08, ET ELLE Y ÉTAIT FORCÉE.** Elle gardait
  ses colonnes de 82 px et son `overflow-x: auto` : tolérable tant qu'elle
  FILTRAIT et n'en montrait que trois ou quatre, insupportable depuis qu'elle
  grise et en montre quatorze. À sept colonnes sur 360 px la vignette fait 47 px,
  et le libellé a besoin d'`overflow-wrap: anywhere` — sans quoi « Cuirassiers »
  se lit « UIRASSIER ». Vu à l'essai dans un navigateur, pas à la relecture.

- ⚠⚠ **L'ONGLET MISSION EST VIVANT DEPUIS LE 28/08 : C'EST LE TUTORIEL.** Il
  était « bouton mort pour l'instant, futur tuto » dans la liste d'Ethan ; le
  futur est arrivé. Arbitré le 28/08 : **des missions qui se cochent toutes
  seules, sans récompense.**
  ⚠ **UNE MISSION EST UNE QUESTION POSÉE À LA BASE, PAS UN COMPTEUR.**
  `sim/missions.js` LIT `disposition` et `champs` et dit si le geste décrit est
  accompli. Elle n'écrit rien, ne récompense rien, ne débloque rien. Un test
  photographie l'état et exige qu'il soit intact après lecture.
  ⚠ **AUCUNE PROGRESSION N'EST SAUVEGARDÉE, ET `SAVE_VERSION` RESTE À 6.**
  Retenir « mission 3 faite » créerait une SECONDE source de vérité sur ce que
  le joueur a construit, alors que la première — sa base — est déjà là et ne
  peut pas mentir. Conséquence assumée et testée : démolir décoche.
  ⚠ **LA CHAÎNE EST L'OUVERTURE MESURÉE DE §6**, pas une idée de l'ouverture :
  Chantier au niveau 2 → Collecteur sur un champ → Raffinerie au contact →
  monter la Raffinerie → Centrale. C'est exactement le passage où le plafond de
  stockage mord, et où Ethan s'était arrêté en croyant que rien ne produisait.
  ⚠ **ELLE TIENT DANS LES EMPLACEMENTS QU'ELLE FAIT OUVRIR** — quatre bâtiments
  pour les quatre emplacements du Chantier de niveau 2, jouée par le vrai
  moteur dans le test. Une sixième mission demandant un cinquième bâtiment
  rendrait le tutoriel INFINISSABLE, et rien à la relecture ne le dirait.
  ⚠ **AUCUN NOMBRE N'EST ÉCRIT EN DUR DANS LES TEXTES.** Le niveau visé vient
  d'`ECONOMIE_NIVEAU.premierNiveauPayant`, les noms de `nom.joueur`, et le
  niveau où l'électricité commence à coûter se **MESURE** sur `coutDeMontee` —
  3, sur les onze bâtiments. Un test refuse tout nom de l'Ouvrage dans le
  tutoriel, et exige que les noms du joueur y soient.
  ⚠ **L'ÉCRAN SE PEINT À L'OUVERTURE, ET SEULEMENT LÀ.** Rien ne peut changer
  pendant qu'on le regarde : toutes les missions portent sur ce que le joueur a
  POSÉ ou AMÉLIORÉ, gestes qui se font sur l'écran de la base. **Ce n'est vrai
  que tant qu'aucune mission ne lit l'ÉCONOMIE** — une mission « accumule 100
  quartz » avancerait sous les yeux du joueur sans que rien ne se redessine.
  Un test balaie `sim/missions.js` pour l'interdire, imports ôtés :
  `data/economie.js` est la table des COÛTS, pas les stocks, et la première
  version de la garde tombait sur cet import légitime.
  ⚠ **QUEL ONGLET S'ALLUME POUR QUEL ÉCRAN EST UNE TABLE, PLUS UNE CONDITION.**
  `session.js` écrivait « actif si ce n'est pas Options », ce qui allumait
  « Base » sur l'écran Mission le jour de son arrivée. `ONGLET_DE_L_ECRAN` le
  dit, et un test exige qu'elle couvre exactement `ECRANS`.
  ⚠ **DEUX ONGLETS MORTS RESTENT — Recherche et Monde — ET ILS SE NOMMENT.**
  Les deux gardes qui les surveillaient les COMPTAIENT, et l'une annonçait
  « Recherche, Monde et Options » alors qu'Options était vivant depuis le lot
  MISE EN PAGE : le message mentait déjà. Un nombre nu ne dit pas lequel des
  trois vient de bouger.

- **LES FLÈCHES DE BASCULE ENTRE BASES SONT UNE COQUILLE, ET ELLES LE DISENT.**
  L'état porte UNE `disposition` : il n'y a structurellement qu'une base. Les
  deux flèches sont désactivées et le libellé « Base 1 / 1 » dit pourquoi. Les
  rendre vives sur du vide promettrait une bascule qui n'existe pas — la faute
  exacte du bouton « Assaut » du lot ÉCRAN-CHANTIER.

- **LA POSE SE FAIT EN DEUX TOUCHERS DEPUIS LE 28/08.** Ethan : « il y a
  d'abord un clic et le bâtiment/sprite transparent, et les flèches bonus
  proximité s'affiche si il y en a, un deux clique pose le bâtiment ». Le
  premier toucher MONTRE — un fantôme et les flèches — et c'est ce temps-là qui
  rend le voisinage visible AVANT qu'on s'engage. Toucher une autre case déplace
  l'aperçu ; toucher la même pose.
  ⚠ **PAS DE TRANSPARENCE POUR LE FANTÔME.** La palette est fermée à
  trente-trois teintes et ne tolère qu'un seul `rgba`, réservé à autre chose. Un
  liseré tireté et un sigle éteint disent « pas encore là » aussi bien, sans
  ouvrir de brèche dans la garde de palette.

- **LES FLÈCHES DE VOISINAGE SE MONTRENT À TROIS MOMENTS, ET UNE SEULE FONCTION
  LES DESSINE** : l'aperçu de pose, le bâtiment en main pendant un déplacement,
  et l'ouverture du panneau — ce dernier demandé tel quel par Ethan. Les écrire
  trois fois donnerait trois lectures du voisinage ; un test compte les appels.
  ⚠ **`voisinsQualifiantsParCase` VIT DANS `sim/disposition.js`**, à côté de
  `voisinsQualifiants` dont elle est la variante « avec les coordonnées ». Elle
  ne dit RIEN de l'écran : ni direction, ni glyphe. Le sens de la flèche se
  décide dans `ui/`, qui seul connaît `render/orientation.js`.
  ⚠ **ET LE COMMENTAIRE DE CE BLOC A ÉTÉ FAUX PENDANT UNE HEURE.** Il affirmait
  que déduire le glyphe du signe de `rangee` « retourne les huit flèches ».
  C'est FAUX, et la falsification l'a montré : avec
  `ligne = longueur + 1 − rangee`, les deux formules donnent le même signe, le
  +19 se simplifiant. Passer par `ligneEcranDeLaRangee` ne corrige rien
  aujourd'hui — ça dit qu'on raisonne en lignes d'écran, et ça restera juste si
  la transformation cesse d'être affine. **La faute qui se commet vraiment est
  l'inversion du signe**, et c'est elle que le test attrape.

- **DÉPLACER UN BÂTIMENT EST LA SEULE ACTION À DEUX TOUCHERS**, et la table le
  dit : `ACTIONS.deplacer.cible` vaut `true`. L'écran LIT ce champ au lieu de
  reconnaître « deplacer » par son nom — un cas particulier écrit à la main
  serait le premier à diverger. Un test refuse un `=== 'deplacer'` dans l'écran.
  ⚠ **`deplacer` MODIFIE LA CASE EN PLACE, JAMAIS PAR `splice` PUIS `push`.**
  `economie.residus` est parallèle à `disposition` : réécrire la liste dans un
  autre ordre décalerait les résidus d'un cran et ferait produire à chaque
  bâtiment le reste de son voisin. Le montage du test porte TROIS bâtiments
  exprès — avec deux, le déplacé est le dernier et un `splice`/`push` le remet
  au même indice, si bien que le test passerait sur du code cassé.
  ⚠ **LES DÉFAUTS PRÉEXISTANTS SONT FILTRÉS, comme pour la pose, et c'est ici
  que ça compte le plus.** Une base peut porter deux uniques voisins, tolérés au
  chargement ; déplacer est précisément ce qui permet de la réparer. Le montage
  déplace un bâtiment INNOCENT pendant que le défaut demeure — éloigner le
  fautif rend la base saine, donc ne distingue pas les deux codes.
  ⚠ **RESTER SUR PLACE EST LÉGAL.** Le refuser obligerait l'écran à connaître
  cette exception, et priverait le joueur de toute annulation.
  ⚠ **DÉPLACER NE COÛTE RIEN**, faute d'arbitrage. En inventer un prix serait
  trancher seul une mécanique de jeu.

- **UN UNIQUE DÉJÀ POSÉ RESTE DANS LA PALETTE, GRISÉ.** Arbitré le 28/08 :
  « griser le bouton, pas le faire disparaître ». La palette perdait une
  vignette à chaque unique posé, donc elle changeait de longueur et les autres
  se déplaçaient sous le doigt entre deux gestes.
  ⚠ **ET LA VIGNETTE GRISÉE RÉPOND QUAND ON LA TOUCHE.** « Un indice n'est pas
  une interdiction » (§4) : un bouton inerte n'apprend rien, un toast qui dit
  « il est unique, et il est déjà posé » apprend la règle.

- ⚠⚠ **LES DEUX BANDES DE LA GRILLE SONT ÉDITABLES DEPUIS LE 28/08, ET ELLES
  PARTAGENT UN SEUL GESTE.** La bande Défense était en lecture seule faute
  d'état à écrire ; `etat.garnison` existe. Elle se compose à la palette, en
  deux touchers, avec fantôme et déplacement gratuit — exactement le geste des
  bâtiments. `TERRAINS` de `ui/chantier.js` porte la SEULE chose qui les sépare.
  ⚠ **UN TEST REFUSE UNE SECONDE IMPLÉMENTATION.** Il compte les occurrences
  des fonctions de geste et refuse tout `=== 'defense'` écrit à la main. Les
  deux bandes vivent dans le même écran, sous le même doigt : deux
  implémentations auraient divergé au premier ajustement, et la divergence se
  lirait comme un bogue de jeu.
  ⚠ **LE PANNEAU DE DÉTAIL NE S'OUVRE PAS SUR UNE PIÈCE DE GARNISON.** Il
  chiffre production, capacité et voisinage, qu'une pièce n'a pas. La table le
  dit par `panneau: false`, et une garde de ceinture empêche `peindrePanneau`
  de se repeindre avec un indice qui pointe dans l'autre liste — `rafraichir`
  passe dix fois par seconde.
  ⚠ **DEUX PLAFONDS SANS RAPPORT, ET IL FAUT DIRE LEQUEL MORD.** Le Chantier
  borne le NOMBRE de bâtiments par ses emplacements, le QG borne les POINTS
  d'armée par son budget. Dire « c'est plein » sans dire de quoi enverrait le
  joueur améliorer le mauvais bâtiment.
  ⚠ **AMÉLIORER ET RÉPARER N'ONT PAS DE MOTEUR EN DÉFENSE, ET LE DISENT.**
  `null` dans la table, pas un bouton inerte — « un indice n'est pas une
  interdiction » (§4). Le COÛT d'une amélioration existe depuis l'arbitrage du
  28/08 ; la mécanique, non : ce que gagne une unité améliorée n'est pas
  arbitré. C'est le prochain trou à combler.
  ⚠ **LA PALETTE SUIT LA BANDE, ET IL A FALLU LE BRANCHER.** `bandeCourante`
  bouge à chaque évènement de défilement, mais la palette n'était repeinte que
  par trois autres chemins : le joueur serait descendu sur la Défense avec les
  vignettes des onze bâtiments sous les yeux. Elle se repeint au changement de
  TERRAIN, et à lui seul — reconstruire dix-sept boutons par pixel les ferait
  clignoter sous le doigt.
  ⚠ **LES SIGLES DE DÉFENSE SONT DISTINCTS DE CEUX DES BÂTIMENTS.** Vingt-huit
  en tout, tous différents : les deux se dessinent sur la MÊME grille. « CHA »
  étant pris par le Chantier, le Chasseur porte « CHS ».

- ⚠⚠ **L'ÉCRAN OFFENSE N'EST PLUS UNE COQUILLE.** Il lit `etat.armee`, il y
  écrit, et son en-tête de fichier a été réécrit — laisser un commentaire qui
  décrit un état révolu est la faute que ce fichier-ci nomme ailleurs.
  ⚠ **SA GRAMMAIRE EST CELLE DU CHANTIER, ET SES MOTS VIENNENT DE LÀ.** Deux
  touchers pour poser ; une unité posée se prend en main, puis se déplace sur
  une case libre ou se retire en retouchant la sienne. Pas de bouton de plus :
  la consigne « tout doit tenir dans l'écran » interdisait une septième barre.
  ⚠⚠ **SA PALETTE GRISAIT-ELLE OU FILTRAIT-ELLE ? ELLE GRISE, DEPUIS LE 29/08,
  ET C'EST UN CHANGEMENT DE DÉCISION.** Elle RETIRAIT ce que le niveau
  verrouille — « une unité qu'on ne peut pas construire n'a pas à occuper
  l'écran », lot 5A. Ethan a rapporté le 29/08 deux unités « indisponibles »
  qu'il attendait : une palette qui CACHE ne peut pas répondre à ça. Les deux
  palettes se comportent donc enfin pareil, et le gain n'est pas cosmétique —
  le joueur voit ce qui existe, la règle du bâtiment de production s'apprend au
  lieu de se deviner, et la palette garde une LONGUEUR FIXE, si bien que les
  vignettes ne se déplacent plus sous le doigt entre deux gestes.
  ⚠ **L'EXPLICATION DU BUDGET ABSENT VA DANS LE REGISTRE `mode`, PAS `session`.**
  `session` est prioritaire dans `ligneAAfficher` : il aurait masqué les refus
  de geste dans le cas exact où ils arrivent — une armée posée puis le QG
  démoli. Et `mode` a le bon ton : métal, pas rouge ; rien n'est cassé, il
  manque un bâtiment.

- **LE COMPTEUR DU BANDEAU PORTE UN NOMBRE DANS LES TROIS CONTEXTES.**
  `CONTEXTES[x].chiffre` vaut `true` partout depuis le 28/08 : le champ dit si
  la grandeur EXISTE, et les points engagés existent maintenant.
  ⚠ **C'EST LA CAPACITÉ QUI DISPARAÎT SANS BÂTIMENT DE COMMANDEMENT, PAS LA
  VALEUR.** Zéro point engagé est un fait vrai et affichable ; c'est le budget
  qui n'existe pas. « 0 / 0 » ferait croire à un plafond atteint.
  ⚠ **LE BUDGET N'EST PAS RECALCULÉ.** Sa formule vit dans les deux éditeurs, et
  `CONTEXTES` porte la FONCTION plutôt qu'une troisième copie.

- **LES TROIS NIVEAUX DU JOUEUR SONT ENFIN TROIS MOYENNES.** `resumeDeLaBase`
  rendait `defense: null, assaut: null` en dur. `niveauDeLaDefense` et
  `niveauDeLArmee` de `sim/niveau-de-base.js` appellent `moyenneEnDixiemes`,
  sans la réécrire.
  ⚠ **UNE SEULE DIVERGENCE AVEC LEUR JUMEAU : LA LISTE VIDE.**
  `niveauDesBatiments` LÈVE dessus — une base sans bâtiment n'existe pas — mais
  une garnison vide et une armée vide sont l'état NORMAL d'une base neuve. Les
  deux rendent `null`, ce que `formaterNiveau` affiche « — ». Zéro se lirait
  « niveau zéro », c'est-à-dire une force posée et nulle.

- **LA CARTE EST DÉRIVÉE, PAS STOCKÉE** — lot CARTE, 29/08. Une base de
  l'Ouvrage est une FONCTION de la graine et de la case : `estBaseOuvrage` de
  `sim/peuplement.js`. Neuf mille trois cents cases pèseraient plus que tout le
  reste de la sauvegarde réunie. Ce qui se journalisera plus tard, ce sont les
  ÉCARTS — un site rasé, un camp qui réapparaît —, jamais la carte.
  ⚠ **LA RÈGLE DES 8 CASES EST LOCALE.** Une case candidate devient une base si
  son hachage DOMINE celui de ses huit voisines candidates : deux voisines ne
  peuvent donc pas gagner ensemble, et le contact est impossible **par
  construction**, sans jamais parcourir la carte. Neuf hachages par case au lieu
  d'un, et zéro passe globale.
  ⚠ **DEUX SELS, ET ILS DOIVENT RESTER INDÉPENDANTS.** Le sel 0 dit « candidate »,
  le sel 1 départage. S'ils rendaient la même valeur, la case la plus susceptible
  d'être candidate serait aussi celle qui gagne ses duels, et les bases se
  regrouperaient au lieu de se répartir. Un test compte les collisions et exige
  zéro.
  ⚠ **LA DENSITÉ SE MESURE HORS DE LA GARDE.** Une fenêtre 12×12 prise dans les
  quinze cases autour du départ porte zéro base par construction ; les compter
  fait tomber la moyenne de 12,2 à 10,8 et donne l'impression d'un réglage faux.
  ⚠ **ET LA GARDE SE MESURE DEPUIS LE DÉPART, QUI EST FIXE** — pas depuis la base
  du joueur. Si elle le suivait, les bases apparaîtraient et disparaîtraient à
  chaque redéploiement, et il faudrait toutes les journaliser. Le joueur
  s'approche des bases ; les bases ne s'écartent pas de lui.

- **LE TERRAIN DE LA PREMIÈRE BASE EST UNE TABLE** — `TERRAIN_INITIAL` de
  `data/base.js`, dessiné par Ethan le 29/08. La question était posée dans
  l'autre sens (« changer le seed de la 1re base ») et la réponse est MESURÉE :
  le terrain ne dépend pas de la graine du monde mais de la seule POSITION, et le
  dessin n'est atteignable par AUCUNE des 9 300 positions — le plus proche en
  diffère de neuf cases.
  ⚠ **LA CLÉ EST LA FONDATION, PAS LA POSITION COURANTE.** Le terrain est gelé à
  la fondation, il voyage avec la base au redéploiement, et il lui survit au
  rasage (« la base garde sa disposition », 29/08). La fondation initiale ne
  change donc jamais, et la table est servie pour toujours. C'est aussi ce qui
  donne à `fondation` son seul rôle actuel : il n'est plus une position sur la
  carte, il est l'IDENTITÉ du terrain. Il redeviendra une position le jour d'une
  deuxième base, et sera alors un champ PAR base — ne pas le supprimer en le
  croyant orphelin.
  ⚠ **`tentatives: 0` DIT « TABLE ».** Écrire 1 ferait passer une table pour un
  tirage réussi du premier coup, et la mesure de `tentativesMax` compterait une
  position qui n'en est pas une.
  ⚠ **LA TABLE EST SOUMISE AUX MÊMES RÈGLES QUE LE TIRAGE**, et un test les lui
  applique — zone, tailles de bloc reconstruites par composantes connexes,
  non-contact entre blocs de même ressource. Une table dispensée des règles serait
  la première à les contredire.

- **LES OBSTACLES SONT DANS LA BANDE DE DÉFENSE, ET NULLE PART AILLEURS** —
  arbitré le 29/08. Ils couvraient les rangées 3 à 18. Le motif est un motif de
  jeu : un obstacle chez les bâtiments mange un emplacement de construction, un
  obstacle en défense ralentit l'assaillant.
  ⚠ **CE CHANGEMENT A DÉPLACÉ SEPT CONSTANTES DE COMBAT MESURÉES**, dans les deux
  sens — le raid T4 de `cible.test.js` passe de 383 à 313 ticks, le raid A de
  `roster.test.js` perd 26 % de butin pendant que B en gagne 6 %. Un allongement
  uniforme n'aurait pas fait ça : dix obstacles sur 72 cases au lieu de 144, tous
  sur le chemin de l'assaut, changent QUI meurt et QUAND.
  ⚠ **ET QUATRE RAIDS SUR 54 TOUCHENT MAINTENANT LE PLAFOND DE 90 SECONDES**, au
  lieu de deux. Aucun n'est un gel — vérifié en portant `dureeMaxCombatSec` à
  600, ils se concluent tous par `attaquants`. Mais l'un d'eux demande **4 645
  ticks, soit 464 secondes** : ce n'est plus un dépassement, c'est un autre
  régime, et c'est à remonter.
  ⚠ **DEUX TIRAGES D'OBSTACLES COEXISTENT**, et il faut le savoir : celui du
  générateur de sites part de la graine du SITE (donc change à chaque instance),
  celui de `obstaclesDeLaBase` part de la CASE (donc tient d'une instance à
  l'autre, ce qu'Ethan a arbitré pour les camps successifs). Les deux devront se
  rejoindre le jour où un site de l'Ouvrage saura d'où il est.

- **LES OBSTACLES SONT DANS L'ÉTAT, ET ILS N'Y SONT PAS SAUVEGARDÉS** — lot
  OBSTACLES, 29/08. `etat.obstacles` est dérivé de la FONDATION comme `champs`,
  et `serialiser` retire les deux. Aucune migration : la sauvegarde n'a pas
  changé d'un octet, `SAVE_VERSION` reste à 7.
  ⚠ **SEULE LA GARNISON EST SUR LE TERRAIN**, et `FORCES[x].surLeTerrain` le dit.
  Les cases de la garnison SONT celles du champ de bataille ; les quatre vagues
  de l'armée sont une grille de COMPOSITION, dont les rangées ne sont pas des
  rangées de la grille. Reconnaître « garnison » par son nom serait le premier
  cas particulier écrit à la main — un test pose une unité sur chaque numéro de
  vague qui coïncide avec une rangée obstruée et exige qu'elle passe.
  ⚠ **`obstacle` ET `superposition` SONT DEUX CODES.** Le joueur déplace ce qui
  occupe ; il ne déplacera jamais un rocher. « Cette case est déjà occupée »
  devant un obstacle l'enverrait chercher une pièce à retirer.
  ⚠ **`obstacle` EST TOLÉRÉ AU CHARGEMENT.** Le cas ne peut plus se créer par le
  jeu, mais il apparaîtra tout seul le jour où le tirage des obstacles changera :
  le terrain se REDÉDUIT à chaque chargement, donc un obstacle peut se poser sous
  une pièce posée légalement la veille. Même raisonnement que `uniques-voisins`.
  ⚠ **LA BANDE DE DÉFENSE N'A PLUS 72 CASES POSABLES MAIS 62.** Le budget maximal
  y tient encore — 290 points, défenseur le moins cher à 5, donc 58 pièces au
  plus — mais la marge est passée de 14 à 4 cases. Le test le CALCULE au lieu de
  réécrire 62 : le jour où `OBSTACLES.nombre` bougera, il suivra.
  ⚠ **LES OBSTACLES NE COMPTENT PAS DANS LES SIX OCCUPANTS PAR RANGÉE.** C'est
  pour ça que `OBSTACLES_DE_BASE.maxParRangee` vaut 2 : neuf colonnes moins deux
  en laissent sept, donc les six restent atteignables partout. Les faire compter
  serait l'autre solution ; ce n'est pas celle-là qui a été retenue.

- **LES SATELLITES SONT DE L'HISTOIRE, PAS UNE FONCTION** — lot SATELLITES,
  29/08. `sim/peuplement.js` recalcule les bases de l'Ouvrage à partir de la
  graine ; `etat.satellites` ne peut pas se recalculer, parce qu'il dépend de ce
  que le joueur a FAIT — où il s'est posé, quand, combien de fois il a rasé le
  même camp. C'est le premier champ du dépôt qui porte de l'histoire, et il est
  SAUVEGARDÉ. `SAVE_VERSION` passe à **8**.
  ⚠ **AUCUN TIRAGE NE PASSE PAR `etat.rng`, ET C'EST UNE CONTRAINTE DE
  CORRECTION.** `rattraperJeu` est ANALYTIQUE : il avance de mille ticks d'un
  coup là où `tickJeu` en fait mille. La graine d'une apparition se dérive donc
  de la partie et du NUMÉRO D'INSTANCE, qui sont les mêmes des deux côtés.
  ⚠⚠ **ET LE TEST DES DEUX CHEMINS NE TIENT PAS CETTE RÈGLE — MESURÉ.** Remplacer
  la graine dérivée par `etat.rng` laissait la suite ENTIÈREMENT VERTE : rien
  d'autre ne consomme le flux pendant un tick aujourd'hui, donc les deux chemins
  le consomment identiquement. C'est un test DÉDIÉ qui la mesure, en comparant
  l'état du flux avant et après une apparition. Trois des quatre falsifications
  de ce lot sont passées vertes au premier essai ; les trois tests qui les
  attrapent ont été écrits après.
  ⚠ **`resoudreSatellites` NE BOUCLE PAS PAR TICK**, elle ne lit que l'horloge
  courante. C'est ce qui la rend compatible avec le rattrapage — et c'est aussi
  pourquoi elle ne peut RIEN faire qui dépende de l'instant précis d'une
  apparition. Le jour où ce sera nécessaire, cette équivalence tombe.
  ⚠ **LE NUMÉRO D'INSTANCE EST TOUT LE JOURNAL, ET IL TIENT DANS UN ENTIER.** Le
  terrain d'un camp se dérive de la CASE, ses bâtiments de la case ET de
  l'instance : deux camps successifs au même endroit ont les mêmes champs et une
  autre disposition, ce qu'Ethan a arbitré le 29/08. Stocker les bâtiments serait
  ranger ce qu'on sait recalculer. ⚠ Le compteur ne se remet JAMAIS à zéro, pas
  même à un déménagement — un test refuse un `presents[].instance` au-delà de
  `prochaineInstance`, qui est la forme que prendrait cette faute.
  ⚠ **UNE ATTENTE NON SATISFAITE SE REPORTE, ELLE NE SE PERD PAS.** Un anneau
  saturé de bases de l'Ouvrage est possible ; jeter l'attente ferait disparaître
  un camp en silence.
  ⚠ **LA MIGRATION 7 → 8 PROGRAMME, ELLE NE POSE PAS.** Poser d'office mettrait
  trois sites sur la carte à l'instant du chargement, en sautant les cinq minutes
  arbitrées, et le joueur les verrait apparaître pendant qu'il regarde ailleurs.
  Elle compte l'échéance depuis `horloge.nbTicks` de la SAUVEGARDE, pas depuis
  zéro : sinon une partie vieille de deux heures verrait paraître ses trois
  satellites au chargement.

- **DEUX CHOSES NE SONT PAS ARBITRÉES DANS CE LOT, et le code le dit** : le
  DÉLAI et la CASE d'un respawn. Ethan a dit « respawn automatique », sans plus.
  Retenu : le même délai de cinq minutes et un nouveau tirage dans l'anneau —
  c'est le même mécanisme rejoué. Les deux tiennent en une ligne chacun.
  Troisième lecture plutôt qu'arbitrage : **les anciens satellites disparaissent
  au déménagement**, parce que la spec §10 indexe l'avant-poste sur « le rayon et
  la PRÉSENCE du joueur ». Si Ethan veut qu'ils restent, c'est
  `planifierSatellites` qui change, et elle seule.

- ⚠⚠ **LE FOND DE CARTE N'EST PAS DE LA COMPOSITION ALPHA, ET C'EST TOUT LE LOT
  ÉCRAN-CARTE.** Le pavage accumule à la main dans un `Float32Array` et rend
  `μ + (Σ wᵢ·(tᵢ − μ)) / √(Σ wᵢ²)`. `drawImage` avec `globalAlpha` calcule
  `Σwᵢtᵢ / Σwᵢ`, ce qui divise l'écart-type par √N : le fond devient plat.
  Mesuré sur le dépôt, écart-type de luminance d'une dalle — **19,6 avec la
  formule contre 15,1 en alpha ordinaire**, aux quatre crans. Le chemin alpha
  existe dans le module sous une option, et il n'existe QUE pour que le test le
  mesure : sans lui, « ce n'est pas de l'alpha » serait une opinion.
  ⚠ **LE RACCOURCI A ÉTÉ ESSAYÉ ET IL NE MARCHE PAS** : composer en alpha puis
  répartir par quintiles amplifie le bruit au lieu de rendre le relief.
- **L'ATLAS EST DÉJÀ QUINTILÉ, LA SORTIE NE L'EST PAS.** Mesuré : les cinq
  indices de `atlas-terrain-64.png` couvrent 20,0 % de sa surface chacun, moyenne
  2,000, écart-type √2. Mais la SORTIE est la somme pondérée d'environ cinq
  tuiles, donc à peu près gaussienne : découper avec les seuils de l'atlas
  (0,5 · 1,5 · 2,5 · 3,5) donnerait 14 % aux teintes extrêmes et 28 % au milieu.
  `TERRAIN_CARTE.seuilsDeTeinte` porte les quintiles de la sortie, relevés sur
  2 949 120 pixels, et un test refait la mesure — 20 % ± 2 par teinte.
  ⚠ **ET LES SEUILS SONT GLOBAUX, PAS PAR DALLE.** Le brief dit « par quantiles
  sur la dalle » ; des seuils calculés dalle par dalle feraient deux découpages
  différents de part et d'autre d'un bord, donc une couture — et casseraient
  l'invariant qui compte le plus, celui qui veut qu'une zone rendue en une dalle
  soit identique à la même rendue en quatre. C'est le seul écart au brief du lot,
  et il est mesuré : les quatre crans s'accordent à 0,05 près sur ces seuils.
- **L'INDICE DE TEINTE EST LA LUMINANCE, À UNE TRANSFORMATION AFFINE PRÈS.**
  L'atlas est indexé sur la rampe du joueur ; ses cinq tons ont des clartés
  régulières (L* 58,1 · 62,9 · 68,0 · 73,0 · 77,9, pas de 4,95 ± 0,15). La
  formule et les quantiles étant invariants par transformation affine, travailler
  sur l'indice 0–4 donne EXACTEMENT le même découpage qu'une luminance en 0–255,
  pour un quart du travail. Et c'est ce qui permet aux deux rampes de partager le
  même atlas : le camp choisit la rampe, l'indice ne bouge pas.
- **`hachageBrut` EST LE HACHAGE DE `sim/peuplement.js`, RENDU EN ENTIER.**
  `hachageDeCase` le divise par 2³² ; le pavage a besoin de BITS. En écrire un
  second aurait mis deux tirages voisins dans le dépôt, tous deux « FNV, à peu
  près », dont un seul serait testé.
  ⚠ **UN HACHAGE FAIT TRENTE-DEUX BITS, ET ILS SE COMPTENT AVANT DE SE
  DÉCOUPER.** Le pavage veut deux décalages (16 bits chacun), un numéro de tuile
  (6), une rotation (2), un miroir (1) et un tirage d'appartenance : quarante-neuf
  bits. D'où DEUX sels. Lire un champ dans `h >>> 29` n'en laisse que trois, donc
  une valeur toujours minuscule — c'est la faute qui faisait basculer *toutes* les
  tuiles du même côté pendant la maquette, et elle s'est vue à l'œil, pas par
  relecture. Un test mesure la distribution de chaque champ, avec l'appât qui va
  avec.
- **LE PAS DU RÉSEAU EST PLUS PETIT QUE LA TUILE, ET C'EST CE QUI BOUCHE LES
  TROUS.** 56 px source pour une tuile de 128. Le masque tombe à zéro au bord
  d'une tuile : à 84 px de pas, des pixels ne sont couverts par AUCUNE tuile et le
  fond rend du noir. `rendreDalle` rend `couvertureMin` — le plus petit `Σw` de la
  dalle — pour qu'un test puisse mesurer que le plancher NE MORD PAS. Mesuré :
  0,165 au plus bas, sur quatre crans et trois graines.
  ⚠ **ET C'EST CETTE MESURE QUI GARDE, PAS « AUCUN PIXEL NOIR ».** Falsifié : à
  84 px de pas, la garde `Σw ≤ 0` rend la teinte moyenne, donc l'image n'a
  TOUJOURS aucun pixel noir et le test des couleurs reste vert. Seule la
  couverture tombe à zéro, et c'est elle qui le dit.
- **LA PART D'OUVRAGE DU SOL EST UNE PROPOSITION, PAS UN ARBITRAGE.** Une tuile
  est de l'Ouvrage avec la probabilité `(niveau(rangée du centre) − 1) / 49`, puis
  chaque pixel prend la rampe de la majorité pondérée. Mesuré : 0,0 % au bord bas,
  **4,2 % à la rangée de départ du joueur**, 47,7 % au milieu, 100 % dès la
  rangée 50. Elle vit dans `data/` avec ce commentaire, et une ligne suffit à la
  changer.

- ⚠⚠ **L'ONGLET MONDE EST VIVANT DEPUIS LE LOT ÉCRAN-CARTE (29/08), ET IL NE
  RESTE QU'UN ONGLET MORT : RECHERCHE.** L'écran porte un canevas, quatre crans
  de zoom, le défilement au doigt, le pavage du fond et les emblèmes des sites.
  Il ne calcule AUCUNE donnée de jeu : les bases de l'Ouvrage viennent de
  `basesDeLaFenetre`, les camps de `satellites.presents`, le niveau d'une rangée
  de `sim/carte.js`, les bornes et les crans de `data/sites.js`.
  ⚠ **`basesDeLaFenetre` REND UNE FENÊTRE, PAS LA CARTE.** Elle rogne d'elle-même
  sur les bords et se rappelle à chaque changement de vue. Ne jamais l'appeler
  sur les 9 300 cases : au cran le plus large la fenêtre en fait moins de 1 500.
  ⚠⚠ **ET LE NIVEAU DU JOUEUR N'EST PAS CELUI DE SA RANGÉE.** Le panneau de sa
  base affiche « — trois moyennes, sur l'écran Base », jamais le niveau de la
  rangée 275. C'est la faute que `sim/carte.js` existe pour empêcher, et un test
  refuse que ce nombre apparaisse dans cette ligne.
- **LE PANNEAU D'UN SITE NE PORTE AUCUN BOUTON D'ACTION, ET C'EST UNE RÈGLE.**
  Type, niveau, distance, position — et rien d'autre : le raid n'existe pas. Un
  bouton « Attaquer » serait le bouton « Assaut » du lot ÉCRAN-CHANTIER, qui
  promettait un éditeur et livrait du sol nu. Un test balaie le bloc du panneau
  dans le HTML PRODUIT et exige qu'il n'y ait que « Fermer ».
- **LES EMBLÈMES SONT DES GABARITS, ET ILS LE DISENT.** Les treize emblèmes du
  lot 6 sont spécifiés par `INVENTAIRE-SPRITES.md` et aucun fichier n'existe : un
  site se dessine en carré arrondi, bord, lettre, et la lettre n'apparaît qu'à
  partir de 40 px CSS par case.
  ⚠ **LE BORD ROUGE EST RÉSERVÉ À CE QUI ATTAQUE LE JOUEUR**, et c'est une
  information de jeu. Un test croise `EMBLEMES_CARTE` et `TYPES_SITE` :
  l'ensemble des bords rouges DOIT être exactement celui des
  `attaqueLeJoueur`. Camp et avant-poste sont en ambre parce qu'ils sont du
  butin, pas une menace.
- **L'ÉCRAN N'AJOUTE AUCUNE BARRE À HAUTEUR FIXE**, et c'est la consigne « tu
  compresses tout dans l'UI » appliquée. Les deux boutons de zoom et le panneau
  de site se POSENT sur la carte, en `absolute` : le chrome fixe reste à 288 px et
  sa garde ne bouge pas. Le canevas porte `touch-action: none`, sans quoi le
  navigateur avale le glissement pour faire défiler la page.
- **LE DÉFILEMENT SE GARDE EN FLOTTANT, LE DESSIN SE FAIT EN ENTIERS.** Un
  `drawImage` à une position fractionnaire rééchantillonne la dalle et rend le
  pixel art flou. Arrondir la position de vue elle-même perdrait un demi-pixel par
  évènement de glissement, et la carte traînerait derrière le doigt.
  ⚠ **ET CE QUI TIENT ENTIER SE CENTRE, IL NE SE COLLE PAS À GAUCHE.** Au cran le
  plus large les 31 colonnes tiennent dans 331 px CSS sur les 360 d'un téléphone :
  borner à zéro laisserait une bande vide d'un seul côté, ce qui se lit comme un
  bord de carte qui n'existe pas.
- **UNE DALLE COÛTE CHER, ET LE CACHE N'EST PAS « FENÊTRE + MARGE ».** Une dalle
  de 512 demande 1,37 million d'accumulations — mesuré à **19 ms ici, dans Node,
  et non sur l'appareil**. Le cache garde trente dalles, à éviction de la moins
  récemment employée, et se VIDE au changement de cran : une dalle est un rendu à
  un cran donné. Avec une marge plutôt qu'un cache, chaque franchissement de bord
  referait près de 7 000 poses de tuile, puis encore au retour.
  ⚠ **AU PLUS DEUX DALLES PAR IMAGE.** Un défilement qui traverse un bord en
  réclame trois d'un coup ; les calculer dans la même image ferait un à-coup de
  trois fois 19 ms. Ce qui manque se peint de la teinte MOYENNE de son camp —
  jamais du noir — et se complète à l'image suivante.
- ⚠ **LE TEMPS DE RENDU D'UNE DALLE SUR L'APPAREIL N'A PAS ÉTÉ MESURÉ**, et le
  brief le demandait. Il n'y a pas d'appareil ici, et un test appareil non exécuté
  se déclare non exécuté (§3). Si les 30 ms sont dépassées sur le téléphone, le
  curseur à tourner est `TERRAIN_CARTE.dalleCotePx` — 512 → 256 divise l'à-coup
  par quatre à travail total constant, et il faut alors monter `dallesEnCache` de
  30 à 64 pour tenir la même fenêtre. Le pas du réseau est le MAUVAIS curseur : il
  décide de la couverture, donc du noir.
- **L'ATLAS SE DÉCODE À LA PREMIÈRE OUVERTURE DE LA CARTE, PAS AU DÉMARRAGE.**
  Un million de pixels à relire coûte quelques millisecondes ; les dépenser au
  lancement pour un écran que le joueur n'ouvrira peut-être pas retarderait
  l'affichage de sa base. Même raisonnement qu'`initialiserBanc`.
  ⚠ **ET LA CARTE SE RETIRE DE LA SCÈNE QUAND ON LA QUITTE.** C'est le seul écran
  qui porte une boucle à lui. `montrerEcran` appelle `masquer()` sur tout autre
  écran ; un test exige la branche `else` NUE — sa première version cherchait le
  nom de l'appel n'importe où, et une falsification qui l'enfermait dans un
  `if (false)` passait au vert.
- **`rafraichir` NE REDESSINE QUE SI LES SATELLITES ONT BOUGÉ.** La session
  l'appelle dix fois par seconde ; refaire la liste des sites coûte neuf hachages
  par case de la fenêtre pour redessiner exactement la même image. Le fond, lui,
  est une fonction de la graine : il ne change jamais.

- ⚠⚠ **LE CHANTIER PLAFONNE LE NIVEAU DE TOUTE LA BASE** — arbitré le 29/08 par
  Ethan : « le chantier de construction définit le niveau max des bâtiments.
  Donc aucun bâtiment ne peut avoir un niveau supérieur à celui du chantier. »
  C'est ce qui fait du Chantier le rythme de la partie : on ne monte plus rien
  tant qu'il n'est pas monté lui-même. Code `plafond-chantier`, dans
  `problemesDeLAmelioration`.
  ⚠ **IL NE SE PLAFONNE PAS LUI-MÊME.** Il EST la référence ; lui appliquer la
  règle le figerait à son niveau de départ, et plus rien ne monterait jamais.
  ⚠ **ET CE N'EST PAS UNE RÈGLE DE `verifierEtat`.** C'est une règle
  d'AMÉLIORATION : aucune sauvegarde ne devient illisible, aucune migration
  n'est due, `SAVE_VERSION` reste à 8.
- **LE CHANTIER DÉFINIT AUSSI LES TEMPS DE RÉPARATION** — même arbitrage.
  `REPARATION_BASE_JOUEUR.indexeeSur` NOMME le bâtiment, comme `POINTS_ARMEE`
  nomme déjà celui de chaque budget.
  ⚠ **MAIS LA COURBE N'EST PAS DONNÉE, DONC ELLE N'EST PAS ÉCRITE.** Ethan a dit
  QUI décide, pas de combien. `courbe: null`, et un test l'asserte de face :
  inventer un barème le figerait sous l'apparence d'une donnée relevée, ce qui
  est la faute que §6 raconte déjà pour la pente de `data/niveaux.js`.
- ⚠⚠ **LA TABLE D'EMPLACEMENTS DU CHANTIER EST DICTÉE, NIVEAU PAR NIVEAU**
  (29/08) : **3 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 19 · 20** pour les dix
  premiers. Les écarts ne se résument pas — +3, +3, puis +2 six fois, puis +1
  deux fois — et aucune expression close ne les rend. On écrit les dix.
  ⚠ **AU-DELÀ DE DIX, RIEN N'A CHANGÉ** : un par niveau, plafond 40 au niveau 30.
  La table rejoint l'ancienne courbe exactement au niveau 10, à 20 des deux
  côtés, si bien que les niveaux 11 à 50 rendent les mêmes nombres qu'avant.
  ⚠ **CE QUI A CHANGÉ POUR LE JOUEUR, C'EST LE DÉBUT DE PARTIE.** DEUX
  emplacements libres au niveau 1 au lieu d'un, et le niveau 3 suffit aux sept
  obligatoires là où il fallait le niveau 4.
- ⚠⚠ **UNE UNITÉ NE SE CONSTRUIT PAS SANS SON BÂTIMENT DE PRODUCTION** — arbitré
  le 29/08 : « Infanterie inconstructible sans caserne. Même règle pour véhicule
  et avion. » `BATIMENT_DE_CHASSIS` de `data/base.js` porte les trois lignes ;
  la question se pose à `batimentDeProductionManquant` de `sim/state.js`.
  ⚠ **LA CLÉ EST LE CHÂSSIS, PAS LE NOM DE L'UNITÉ.** `UNITES[x].chassis` classe
  déjà les quatorze en escouade / blindé / aéronef : la règle tient en trois
  lignes, pas quatorze, et une unité qui arriverait demain en hérite.
  ⚠ **ELLE VAUT POUR LES DEUX FORCES, ET C'EST UNE LECTURE.** Ethan a énoncé une
  règle sur les UNITÉS, sans dire « à l'assaut » ni « en garnison » : la
  restreindre à un écran aurait été le choix arbitraire. Les six ouvrages fixes
  et les trois artilleries ne sont pas dans `UNITES`, n'ont pas de châssis, et ne
  sont donc pas concernés — un mur n'a jamais eu besoin d'une caserne.
  ⚠⚠ **ET ELLE N'EST PAS DANS `verifierEtat`, EXACTEMENT COMME LE BUDGET.** Elle
  peut devenir fausse SOUS une composition déjà posée — la Caserne démolie, ou
  tombée au raid — et refuser le chargement rendrait la partie injouable pour une
  faute que le joueur n'a pas commise. On SIGNALE au geste, le joueur purge.
  C'est aussi ce qui évite une migration.
- **« GUARDIAN ET PALADIN INDISPONIBLES » — CE QUI A ÉTÉ FAIT, ET CE QUI NE L'A
  PAS ÉTÉ.** Mesuré : `ratisseur` (Guardian) apparaît au niveau **18**,
  `busard` (Paladin) au niveau **14**, et l'ancienne palette les RETIRAIT en
  dessous. Elle les montre maintenant, éteints, avec la raison — « apparaît au
  niveau 18 », « sans Aérodrome, pas d'avion ». **Les seuils eux-mêmes n'ont pas
  été touchés** : ils viennent de `RELEVE-TA-ARSENAL.md` et `UNITES` fait foi
  (§6, arbitré le 24/08). Si Ethan voulait dire que les seuils sont faux, c'est
  un arbitrage de données qui reste à rendre.
- ⚠⚠ **L'ÉCRAN OFFENSE A UNE BARRE CONTEXTUELLE DEPUIS LE 29/08.** Ethan : « on
  ne peut pas supprimer une unité en cliquant dessus. D'ailleurs les boutons
  réparer, améliorer etc. n'apparaissent pas dans le menu offense. » L'écran
  retirait bien une unité — en DEUX touchers implicites qu'aucun bouton
  n'annonçait. C'est la barre du Chantier, aux mêmes quatre boutons et au même
  modèle « armer puis toucher », avec les mêmes quatre règles.
  ⚠ **« RETIRER », PAS « DÉMOLIR ».** On ne démolit pas des Fusiliers.
  ⚠ **RÉPARER ET AMÉLIORER N'ONT TOUJOURS PAS DE MOTEUR, ET LE DISENT.** `null`
  dans `ACTIONS_ARMEE`, pas un bouton inerte.
  ⚠ **ET LE CHROME DE L'OFFENSE FAIT EXACTEMENT 288 PX, comme celui du
  Chantier** : 40 + 44 + 26 + 46 + 86 + 46. La garde de `chantier.test.js` somme
  désormais les deux écrans.
  ⚠ **LES MESSAGES DE REFUS NOMMENT CE DONT ILS PARLENT.** `actionSansMoteur`
  disait « pour la défense » en dur et `PAS_DE_REPARATION` « aucun bâtiment » :
  juste tant que la barre n'existait qu'au Chantier, faux dès qu'elle est apparue
  à l'Offense. Le terrain donne le CONSTAT ENTIER — « aucune unité n'est
  endommagée » — et non le seul nom : recomposer une phrase française morceau par
  morceau a produit « aucun unité », puis « aucune unité n'est endommagé », en
  deux essais. Les deux se sont vues à l'essai, pas à la relecture.
- ⚠⚠ **LES FLÈCHES DE VOISINAGE SONT UN TRAIT ÉPAIS DE CENTRE À CENTRE** —
  Ethan, 29/08 : « les flèches de la base (collecteur raffinerie) sont bien trop
  petites. Elle doit partir du centre d'une case à l'autre. Trait épais. » Ce qui
  existait était un GLYPHE de 11 px posé dans un coin de la case voisine :
  lisible sur une capture de bureau, invisible au doigt sur un téléphone.
  ⚠ **UN TRAIT RELIE DEUX CASES, IL NE PEUT DONC PAS VIVRE DANS UNE CASE.** D'où
  un calque SVG posé sur `#chantier-grille`, dont le `viewBox` prend la CASE pour
  unité : l'épaisseur est une fraction de case (0,16) et suit la taille de
  l'appareil, là où un nombre de pixels serait gros sur un petit écran et maigre
  sur un grand.
  ⚠ **`pointer-events: none`, SANS EXCEPTION.** Un trait posé par-dessus une case
  qui avalerait le toucher serait la même faute que le `transform: scale()` que
  le dépôt interdit sur la grille : le doigt se décrocherait de la case qu'il
  vise. Un test l'asserte.
  ⚠ **LE GLYPHE SURVIT DANS L'INFOBULLE, ET UN TEST LES ACCORDE.** Le glyphe est
  le LIBELLÉ de la flèche, le couple départ/arrivée est son DESSIN : deux
  représentations d'un fait, donc une garde qui les compare plutôt qu'une
  duplication laissée seule.
- ⚠ **L'ESPACE DE NOMS SVG EST LA SEULE URL TOLÉRÉE DU LIVRABLE.**
  `http://www.w3.org/2000/svg` est l'argument obligatoire de `createElementNS` :
  un IDENTIFIANT, jamais une adresse — rien n'est téléchargé depuis là. La garde
  offline de `tools/build.js` et T10 le retirent à l'identique et refusent tout
  le reste, `w3.org` compris. **Ne pas contourner en assemblant l'URL à
  l'exécution** : ce serait passer sous un garde-fou en silence, comme les hex à
  trois chiffres.

- ⚠⚠ **LE TUTORIEL A UNE MINI-FENÊTRE EN BAS DE L'ÉCRAN DE LA BASE, ET ELLE EST
  DANS LE FLUX.** Ethan, 29/08 : « faire apparaître les missions en bas au début
  du jeu, au-dessus des boutons améliorer etc. Sous la forme d'une mini fenêtre.
  Texte court, compteur d'objectif. Le joueur peut quitter le tuto grâce à une
  croix comme n'importe quelle fenêtre. Il le retrouve dans l'onglet mission. »
  ⚠⚠ **ÉCRITE EN `position: absolute`, ELLE AVALAIT LE TOUCHER — MESURÉ, PAS
  SUPPOSÉ.** Posée sur `#chantier-champ` comme le panneau de détail, elle
  couvrait le bas de la grille : dans un navigateur, `elementFromPoint` sur la
  première case légale rendait `#tuto-objectifs`, et **poser un Collecteur était
  devenu impossible** — c'est-à-dire la première mission du tutoriel que la
  fenêtre venait d'annoncer. C'est la faute que le dépôt interdit déjà au calque
  des traits (`pointer-events: none`) et au `transform: scale()` de la grille.
  Elle PREND donc sa place : `#chantier-champ` est une colonne, `#chantier-defile`
  absorbe ce qui reste, la grille se fait plus courte et défile.
  ⚠ **ELLE N'EST PAS UNE SEPTIÈME BARRE**, et la nuance porte la consigne « tu
  compresses tout dans l'UI ». Sa hauteur vaut une, deux ou trois lignes
  d'objectif — `flex: 0 0 auto`, jamais `0 0 Npx` — donc elle n'entre pas dans
  les 288 px de chrome, et elle disparaît quand le tutoriel est fini. La garde
  des 288 px énumère les hauteurs FIXES et serait restée muette : c'est un test
  de `missions.test.js` qui tient celle-là.
  ⚠ **LE PANNEAU DE DÉTAIL PASSE TOUJOURS DEVANT**, puisqu'il est en `absolute`
  dans le même champ : il répond à un geste, la fenêtre est un rappel permanent.
  ⚠ **LES DEUX VUES VIVENT DANS `ui/mission.js`**, la mini-fenêtre et l'onglet.
  Les écrire séparément aurait donné deux formatages du même compteur.
  ⚠ **ET LE TITRE NE SE RÉPÈTE PAS AU-DESSUS DE SES PROPRES OBJECTIFS.** Le
  titre est COMPOSÉ des libellés d'objectif ; l'écrire puis les lister donnait
  « Collecteur sur quartz / Collecteur sur quartz 0 / 1 ». Vu à l'essai dans un
  navigateur, pas à la relecture.

- ⚠⚠ **LA CHAÎNE DU TUTORIEL EST DICTÉE, ET ELLE VIT DANS `data/missions.js`.**
  Dix-sept missions données par Ethan le 29/08, avec leurs niveaux visés et
  leurs comptes : c'est du CALIBRAGE, donc §4 le veut dans `src/data/`.
  `sim/missions.js` les INTERPRÈTE et ne porte aucun de ces nombres — un test
  balaie le moteur et refuse tout identifiant ou nom de la chaîne.
  ⚠ **LE TITRE D'UNE MISSION N'EST ÉCRIT NULLE PART**, il est composé des
  libellés de ses objectifs, eux-mêmes tirés de `nom.joueur` et des niveaux de
  la table. Seules les missions sans moteur portent un libellé de la main
  d'Ethan : il n'y a rien à en dériver. Un test l'asserte dans les deux sens.
  ⚠ **LE COMPTEUR EST PAR OBJECTIF, ET SON DÉNOMINATEUR PEUT BOUGER.** « chaque
  bâtiment au niveau 5 » compte les bâtiments POSÉS : poser du neuf le fait
  monter, donc DÉCOCHE une mission de mise à niveau déjà faite. C'est « rien
  n'est mémorisé » vu de l'autre côté, pas un défaut de calcul — la chaîne le
  fait vraiment, entre les missions 7 et 8.
  ⚠ **ELLE TIENT EXACTEMENT DANS SES EMPLACEMENTS, SANS UNE CASE DE MARGE** :
  douze bâtiments pour les douze qu'un Chantier de niveau 5 ouvre. Une mission
  de plus rendrait le tutoriel infinissable.
  ⚠⚠ **ET LA GARDE QUI LE VÉRIFIE EST PASSÉE VERTE SUR DU CODE CASSÉ, AU PREMIER
  ESSAI.** Elle jouait un montage écrit à la main dans le test : ajouter deux
  bâtiments à `data/missions.js` ne le changeait pas, donc elle ne voyait rien.
  Elle lit maintenant la CHAÎNE — ce que les objectifs exigent depuis le début
  contre ce que les Chantiers déjà demandés ont ouvert. **Un montage écrit à la
  main ne garde que lui-même.**

- ⚠⚠ **QUATRE MISSIONS N'ONT PAS DE MOTEUR, ET ELLES LE DISENT DE FACE.**
  Détruire un camp, se rapprocher des bases de l'Ouvrage, détruire une base,
  construire une seconde base : le raid, le redéploiement et la seconde base
  n'existent pas dans le dépôt au 29/08. Les taire aurait amputé la feuille de
  route d'Ethan ; les compter aurait donné un compteur qui n'atteint jamais son
  plafond, c'est-à-dire le tutoriel infinissable que §6 nomme déjà.
  ⚠ **ELLES SONT AFFICHÉES, MARQUÉES `⋯`, ET SANS COMPTEUR.** « 0 / 1 » sur une
  ligne qu'aucun geste ne peut cocher se lirait comme un retard du joueur.
  ⚠ **LE DÉNOMINATEUR EST CELUI DES VÉRIFIABLES — 13 SUR 17** — et il grandira
  tout seul le jour où le raid arrivera : c'est la ligne de `data/missions.js`
  qui change, et rien d'autre.

- ⚠⚠ **LA CHAÎNE DEMANDE DES PIÈCES QUE SES PROPRES NIVEAUX N'OUVRENT PAS, ET
  C'EST MESURÉ.** L'Éclaireur (`ratisseur`) apparaît au niveau **18** du Centre
  de commandement, que la chaîne ne fait monter qu'au **7** ; le Mur de défense
  (`merlon`) au **6** et la Tourelle mitrailleuse (`casemate`) au **8** du QG de
  défense, que la chaîne ne fait monter qu'au **5**. Le joueur PEUT y arriver —
  rien ne l'empêche de monter plus haut — mais le tutoriel ne le lui dit pas.
  ⚠ **LES SEUILS N'ONT PAS ÉTÉ TOUCHÉS.** `UNITES` et `DEFENSES` font foi (§6,
  arbitré le 24/08) ; les baisser serait un arbitrage de données, et il reste à
  rendre. C'est la même tension que « Guardien et Paladin indisponibles » du lot
  RETOURS-ETHAN, vue une deuxième fois.
  ⚠ **CE QUI A ÉTÉ FAIT À LA PLACE : LE TUTORIEL LE DIT.** Chaque mission
  d'effectif porte des PRÉREQUIS dérivés — l'apparition lue dans la table et le
  bâtiment de production lu dans `BATIMENT_DE_CHASSIS` — au lieu de laisser le
  joueur chercher pourquoi sa palette reste grise. Le jour où Ethan descend un
  seuil, la phrase suit toute seule, et un test l'asserte contre les tables.

- ⚠⚠ **`SAVE_VERSION` VAUT 9 : L'ÉTAT PORTE `tutoriel`, ET CE N'EST PAS DE LA
  PROGRESSION.** Ce qui est FAIT se recalcule depuis la base à chaque demande et
  n'est écrit nulle part — c'est la règle du 28/08, intacte. Ce qui est écrit,
  c'est « j'ai quitté le tuto » : une décision du joueur qu'aucune base ne peut
  exprimer, donc de l'histoire, au même titre que `satellites`.
  ⚠ **LA MIGRATION 8 → 9 AJOUTE `{ ferme: false }` ET RIEN D'AUTRE.** Une
  sauvegarde v8 n'a jamais eu de croix à cliquer ; la déclarer fermée priverait
  son joueur du tutoriel pour un geste qu'il n'a pas fait. Même genre que la
  v6 → v7 : elle ajoute un champ neuf avec sa valeur neutre.
  ⚠ **`tutorielEstFerme` LÈVE SI LE CHAMP MANQUE**, elle ne rend pas `false` par
  défaut : un défaut par tolérance rouvrirait la fenêtre au joueur qui l'a
  fermée, sans que rien ne le dise.
  ⚠ **L'ÉCRAN N'ÉCRIT PAS DANS L'ÉTAT** : `reglerTutoriel` est dans
  `sim/state.js`, comme `poser` et `ameliorer`. Deux vues touchent ce champ — la
  croix et le bouton de l'onglet Mission — et sans elle chacune l'aurait écrit
  de son côté.
  ⚠ **ROUVRIR CHANGE D'ÉCRAN.** Rouvrir en restant sur l'onglet Mission ne
  montrerait rien : la fenêtre redemandée est en bas d'un AUTRE écran, et le
  joueur croirait le bouton mort.

- **LA MINI-FENÊTRE SE RAFRAÎCHIT À CHAQUE IMAGE, L'ONGLET À L'OUVERTURE.** La
  différence est voulue : l'onglet, on l'ouvre exprès, et rien ne bouge pendant
  qu'on le regarde ; la fenêtre est sous les yeux du joueur PENDANT qu'il pose.
  ⚠ **MAIS ELLE NE SE RECONSTRUIT QUE QUAND SON CONTENU CHANGE.** `rafraichir`
  passe dix fois par seconde ; refaire les nœuds à chaque passage les ferait
  clignoter sous le doigt. `signatureDuTutoriel` décide, et elle porte les
  LIBELLÉS et pas seulement l'identifiant de la mission — un dénominateur qui
  bouge sans changer de mission serait resté figé à l'écran.
  ⚠ **ET UN SEUL POINT D'APPEL RAFRAÎCHIT L'ÉCRAN DE LA BASE ET SA FENÊTRE.**
  `rafraichirLaBase` de `session.js` : les trois instants sont les mêmes — chaque
  image, un retour de veille, un chargement — et trois paires d'appels côte à
  côte finissent toujours par n'en être plus que deux.

- **LE LIBELLÉ N'EST PAS LA CLÉ, ET LES TROIS MOYENNES L'ONT RAPPELÉ.** Les
  objectifs de niveau moyen affichaient « armee en moyenne au niveau 6,0 » — la
  clé de code, sans accent, sous les yeux du joueur. Même faute qu'`axe` contre
  `axeLibelle` dans `data/combat.js`, et elle ne se voit qu'à l'écran : un test
  balaie désormais tous les textes du tutoriel et refuse les clés connues.

### Sur les sprites et les atlas

- ⚠⚠ **UN ATLAS EST UN FICHIER COMMITÉ, IL NE SE RECOUD PAS TOUT SEUL — ET SA
  PÉREMPTION EST MUETTE.** Le lot BÂTIMENTS-1024 (30/08) a régénéré les seize
  sprites de `art/sprites/bâtiment/64/` ; `art/sprites/atlas-batiment-64.png`,
  lui, porte des PIXELS, et il est resté celui de la veille. **Mesuré, pas
  supposé** : dans cet état, `npm run check` rendait **559 pass / 0 fail** et
  `dist/index.html` ne bougeait pas d'un octet. Le jeu aurait affiché l'ANCIEN
  dessin pendant que le dépôt portait le nouveau.
  ⚠ **AUCUNE GARDE EXISTANTE NE POUVAIT LE VOIR, et il faut savoir pourquoi.**
  `src/data/atlas.js` ne porte que des NOMS, et une bascule d'illustration n'en
  renomme aucun : l'index restait exact, la géométrie restait exacte, les onze
  bâtiments se résolvaient toujours. Seuls les pixels avaient divergé.
  ⚠ **D'OÙ LA GARDE QUI LES COMPARE.** `test/sprite.test.js` décode l'atlas et
  chaque sprite source, et exige que la cellule du rang `i` soit le sprite
  `noms[i]`, ligne par ligne. Falsifiée en remettant l'atlas de la veille sous
  les sprites du jour : elle tombe, et elle est la SEULE à tomber.
  ⚠ **LA RÈGLE QUI EN DÉCOULE : tout lot qui touche à `art/sprites/<famille>/64/`
  relance `python3 tools/atlas.py --ecrire`**, et le HTML change, donc la version
  se bumpe. Les autres grilles — 32 et 128 — ne sont cousues dans aucun atlas
  aujourd'hui et ne déclenchent rien.
- **`art/sources/` N'EST JAMAIS AMPUTÉ.** Aucun fichier, aucune série. Les sept
  planches de la V1 des bâtiments restent au dépôt alors que plus une ligne ne
  les cite : elles sont la seule trace de ce qui a produit les fichiers qu'on a
  effacés. Rien dans ce dossier n'est un produit, tout y est un original — c'est
  ce qui le distingue de `art/sprites/`, qui est entièrement reproductible.
- **`planches.py` N'ÉCRASE JAMAIS UN FICHIER QUI NE SE REPRODUIT PAS**, et c'est
  un garde-fou, pas une gêne. Une bascule de source se fait donc en DEUX temps :
  supprimer d'abord, écrire ensuite. Dans l'autre ordre, la commande sort autant
  de lignes `ÉCART` qu'il y a de fichiers et n'écrit rien — vérifié le 30/08 :
  50 `ÉCART`, et `git status` ne montrait pas une seule modification.

### Sur le vocabulaire

- Ne jamais dire « l'IA » en parlant de l'adversaire : c'est **l'Ouvrage**.
- Sur l'écran de Défense : **« engagement réduit »**, jamais « inerte ».
- Le champ du bilan s'appelle `verrouilles` en défense et `verrouillees` à
  l'Arsenal. Les deux grilles ne portent pas les mêmes objets, et recopier le
  nom de l'Arsenal donne `undefined.length`.

### Sur la méthode

- ⚠⚠ **UNE CITATION QUI RENVOIE À UNE SOURCE QU'ON S'INTERDIT DE LIRE NE VAUT
  PAS MIEUX QUE PAS DE CITATION.** L'en-tête de `data/niveaux.js` a annoncé
  pendant quatre jours que sa pente venait d'un « onglet COURBE du classeur
  FOYER-ZERO-BATIMENTS-JOUEUR.xlsx ». Or §1 interdit de lire un `.xlsx` pour
  coder et déclare celui-ci périmé. La source était donc INVÉRIFIABLE : la
  pente 1,1 a eu l'air inventée, et la session du 29/08 a conclu — à tort — que
  le code contredisait un arbitrage d'Ethan. Elle était en fait **mesurée**,
  dans `RELEVE-TA-COURBES-2.md` §0, au dépôt depuis le 24/08.
  ⚠ **CORRIGER LES MOTS N'AURAIT PAS SUFFI.** La prochaine session aurait cru
  un commentaire, comme celle-ci l'a fait. Trois tests de `donnees.test.js`
  confrontent désormais `NIVEAU` et `ECONOMIE_NIVEAU` au tableau des cinq lois
  du relevé, et exigent que l'écart voulu sur les dégâts (×1,086 mesuré, 1,1
  codé, pour tenir le miroir) reste ÉCRIT dans le fichier qui le commet.
  ⚠ **`data/base.js` ET `data/economie.js` CITENT ENCORE LE CLASSEUR.** Ce
  n'est pas la même faute — Ethan l'a pointé lui-même pour ces deux-là — mais
  le jour où l'une de ces valeurs sera contestée, la piste sera aussi courte.

- **Vérifier avant d'affirmer.** Les erreurs les plus coûteuses du projet sont
  toutes des affirmations écrites sans mesure : l'inertie de l'artillerie
  avancée, `depuisDefenseurs` qui « refuserait les cases interdites », le calcul
  des points d'armée offensifs, la borne de débordement de l'économie
  (annoncée « deux fois sous l'entier sûr », mesurée 471 fois au-dessus), la
  marge du seuil de débit (annoncée 19 000, mesurée 19). Une grandeur qui
  s'écrit se calcule d'abord.
