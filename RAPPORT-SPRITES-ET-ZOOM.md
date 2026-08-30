# RAPPORT — lot SPRITES-ET-ZOOM — 30/08/2026

Répond au relevé d'Ethan du 30/08, fait sur appareil, captures à l'appui.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.48.0 · build 49 | **0.49.0 · build 50** |
| `npm run check` | 619 pass / 0 fail | **634 pass / 0 fail** |
| `dist/index.html` | 1 230 416 o | **1 242 496 o** (+12 080) |
| Borne de T10 | 1 300 000 | inchangée — marge **57 504 o**, 4,4 % |
| `SAVE_VERSION` | 9 | inchangée — aucun champ d'état touché |

⚠ **La borne n'a PAS été relevée, et c'est le fait qui compte :** aucun atlas
n'entre au livrable. Les +12 080 octets sont du code et de la feuille de style.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'EST CONFORME.**
`CLAUDE.md` §0.5 le réserve aux lots qui touchent `art/sources/`,
`art/sprites/` ou un outil de `tools/` — « ⚠ Pas aux autres lots ». Ce lot n'a
touché aucun des trois : `git status` ne montre que `src/`, `test/`,
`package.json` et ce rapport. Le déclarer non lancé plutôt que de le lancer par
acquit de conscience est ce que la consigne demande.

---

## 1. Les neuf demandes, une par une

| # | Demande d'Ethan | État |
|---|---|---|
| 1 | Sprites de bâtiment +20 % | **fait** |
| 2 | Zoom sur la base, l'UI de même taille | **fait** |
| 3 | Zoom carte et base au doigt, plus de `+ −` | **fait** |
| 4 | Terrain de la base : sprites terrain monde en 2 × 2 | **fait** |
| 5 | Carte : 4 terrains pour une tuile, gros carré moche | **fait** |
| 6 | Implantation des sprites icône | ⚠ **art absent AU MOMENT DU LOT — arrivé depuis, voir §2** |
| 7 | Retirer carrés, traits, lettres d'obstacle | **fait** |
| 8 | Offense : sprites d'unité du joueur | **fait** |
| 9 | Barres du bas (base, déf., off.) : sprites au lieu de carrés | **fait** |

---

## 2. ⚠⚠ CE QUI N'A PAS PU ÊTRE FAIT, ET POURQUOI

### ⚠ AMENDÉ LE 30/08 AU SOIR : LES SOURCES SONT ARRIVÉES

Ethan a livré `FoyerZero_S11_UI_complet_v1.zip` après la rédaction de ce
rapport. **Les neuf planches du lot 7 sont désormais au dépôt**, dans
`art/sources/`, plus trois flèches vertes qui n'étaient pas au brief d'origine.
Ce qui suit décrit donc l'état AU MOMENT DU LOT, et reste vrai de ce qui manque
encore : la CHAÎNE. Voir `RAPPORT-SPRITES-S11.md` pour ce qui est entré et ce
qui reste à faire.

### Les sprites icône (demande 6) — les quarante et un fichiers n'existaient pas

Cherché avant de conclure, et pas seulement dans `src/` :

```
find art -name "ui_*"        → aucun résultat
find art -name "*icon*"      → art/sources/icone_appli.png, et lui seul
```

`icone_appli.png` est la source de l'icône de l'**application Android**
(`tools/icone.py`, qui écrit dans `android/`) : il n'a rien à voir avec des
icônes d'interface.

Ce qu'Ethan demande est le **lot 7 d'`INVENTAIRE-SPRITES.md` §7**, spécifié au
fichier près — 41 sprites : 3 ressources, 4 compteurs, 6 cibles et châssis,
4 catégories de défense, 14 modules, 10 états et actions. Le §9 du même document
le range **en dernier de l'ordre de production**, et pour une raison écrite :
« une icône de module se dessine d'après le module fini ». **Il n'a jamais été
produit.**

Il n'y a donc rien à implanter. Les trois portes possibles :

1. produire les 41 sprites (`BRIEF-SPRITES-IA.md` donne la marche à suivre) ;
2. n'en produire qu'une partie — les 3 ressources et les 4 compteurs suffiraient
   au bandeau du haut, qui est l'endroit le plus visible ;
3. dessiner des glyphes procéduraux en attendant, ce qui serait un choix de
   style que je ne peux pas trancher seul.

**Aucune ligne n'a été écrite pour cette demande** : brancher une famille
d'atlas vide ferait lever `fondDuSprite` au premier affichage, ou — pire —
demanderait de désarmer la levée qui existe précisément pour qu'un sprite
manquant se voie.

---

## 3. ⚠⚠ UN DÉFAUT TROUVÉ SUR `main`, ET RÉPARÉ : L'ÉCRAN BLANC DE LA GARNISON

Trouvé en **exécutant** le chemin de la palette, pas en le relisant.

`rosterDefensif()` compose les dix-sept pièces posables en garnison à partir de
**deux** tables : les neuf ouvrages et artilleries de `DEFENSES`, plus les huit
unités de `UNITES` dont `defense.present` est vrai. `ui/chantier.js` demandait
`genre: 'defense'` pour les dix-sept ; `couchesDeLEntite` **lève** sur les huit
unités — « `meute` n'est pas une pièce de défense » — et comme la levée part de
`peindre`, **poser des Fusiliers en garnison laissait tout l'écran de la base
blanc.**

⚠ **MESURÉ SUR `main` AVANT CE LOT**, par `git stash` : huit levées sur dix-sept.
Le défaut est antérieur, il n'a pas été introduit ici. Ce lot le rend seulement
atteignable **plus tôt** — la palette résout maintenant un sprite pour chacune
des dix-sept, donc la levée arriverait au dessin de la palette et non plus à la
pose.

⚠ **AUCUN TEST NE POUVAIT LE VOIR**, et il faut savoir pourquoi : le test qui
gardait la garnison montait une base portant les **neuf** `DEFENSES` — soit
exactement la moitié du roster qui fonctionnait. C'est la leçon que le dépôt a
déjà payée deux fois : **un montage écrit à la main ne garde que lui-même.** Le
nouveau part de `rosterDefensif()`, et il mesure d'abord qu'il y a bien deux
genres, sans quoi il passerait sur le code cassé qu'il existe pour attraper.

**Réparé** par `genreDeLaGarnison(id)` dans `render/scene.js`, qui pose la même
question que `nomDeLaPieceDeDefense` — `DEFENSES[id] ?? UNITES[id]` — au lieu
d'une liste de huit noms écrite à la main.

---

## 4. Le « gros carré moche » de la carte — ce que c'était vraiment

Ethan : « les tuiles 128×128 sont responsables. Donc la solution : utiliser
4 terrains pour faire qu'une seule tuile. Je suppose qu'il faut redécouper les
planches pour éviter de ×4 la taille de la carte. »

**Le diagnostic est juste, la crainte ne l'était pas.**

Mesuré en rendant des dalles hors navigateur : l'art de
`art/sprites/carte/atlas-terrain-64.png` a un **grain de 4 pixels source**. Une
tuile couvrait exactement une case, donc une case valait 128 pixels source ; au
cran le plus serré (256 px par case) le pavage **agrandissait sa source d'un
facteur deux**, et le grain de 4 px se lisait à l'écran en **carrés de 8 px
alignés sur les axes**. C'est ce qu'on voyait.

**Correctif :** `ZOOM_CARTE.pixelsParTuile` est scindé en `coteTuile` (128, le
côté d'une tuile) et `tuilesParCase` (2, par axe). Une case vaut donc 256 pixels
source : le cran 256 tombe au **rapport 1:1** et les trois autres RÉDUISENT.
Plus aucun agrandissement, donc plus de carré.

⚠ **ET ÇA NE COÛTE NI UN OCTET NI UNE MILLISECONDE.**

- **Pas un octet** : c'est le MÊME fichier, lu à une autre échelle. Il n'y avait
  donc rien à redécouper, et la carte ne quadruple pas.
- **Pas une milliseconde** : le pas du réseau est lui aussi en pixels source, si
  bien que le nombre de tuiles superposées **sur un pixel d'écran** vaut
  `(coteTuile / pasSourcePx)²` — 5,2 — **quelle que soit l'échelle**. Le coût
  d'une dalle est un produit `pixels × recouvrement` : les deux facteurs sont
  inchangés.

**Les seuils de teinte ont été relevés à nouveau**, sur 2 949 120 pixels — quatre
crans × cinq graines × quatre endroits. Ils bougent de 0,004 à 0,026 :
`0,660 · 1,586 · 2,444 · 3,363` → `0,656 · 1,574 · 2,418 · 3,338`. C'est le cas
que `CLAUDE.md` §5 autorise — « recalculer un seuil parce qu'une constante a
bougé : oui ». **La tolérance du test n'a pas été touchée** (20 % ± 2 par teinte).

⚠ **L'accord entre crans s'est desserré, et il faut le dire** : il valait 0,05,
il vaut **0,094** au pire (premier seuil : 0,631 au cran 32 contre 0,725 au cran
256). Il tient dans la tolérance ; un jeu de seuils par cran resterait un jeu de
seuils de trop.

**Couverture minimale**, mesurée aux quatre crans — la garde qui dit que le
plancher `Σw ≤ 0` ne mord pas, donc qu'aucun pixel ne rend du noir :

| cran | avant | après |
|---|---|---|
| 32 | 0,220 | 0,140 |
| 64 | 0,266 | 0,258 |
| 128 | 0,411 | 0,274 |
| 256 | 0,549 | 0,351 |

Elle baisse et **reste franchement au-dessus de zéro**. Le test qui la mesure
est resté vert sans qu'on touche à sa borne.

---

## 5. Le sol de la base — les sprites du monde, et zéro octet

Ethan : « changer le terrain de la base. Utiliser les sprites terrain monde
(en 2×2) ».

Le sol était l'un des quatre `tile_sol_j_*` de l'atlas de la base, **un par
case** : quatre dessins pour cent soixante-deux cases, et la répétition se lisait
d'un coup d'œil sous le quadrillage.

⚠⚠ **L'ATLAS DU MONDE EST DÉJÀ DANS LE LIVRABLE**, payé depuis le lot
ÉCRAN-CARTE — 299 400 octets de base64 — et **sa palette EST la rampe « sol
joueur » de `FICHE-STYLE.md`**, aux cinq teintes près :
`#B87E64 · #C38C73 · #CF9A83 · #D7A995 · #E0B9A8`. Vérifié sur la table `PLTE`
du fichier. Le sol de la base et le sol du monde sont donc littéralement la même
matière, ce qu'ils devaient être.

Découpé au pas de 64 — la grille de tous les sprites du dépôt — l'atlas de
1024 px rend **16 × 16 = 256 cellules**, et une case en pose quatre. Deux gains,
et il faut les distinguer :

- le **grain** devient deux fois plus fin à l'écran (128 pixels source par case
  au lieu de 64) ;
- le **nombre de sols possibles** passe de 4 à 256⁴.

⚠ **La variante se prend sur la SOUS-CASE**, pas sur la case : `variante` est une
fonction de (graine, rangée, colonne), donc appelée quatre fois sur les mêmes
coordonnées elle rendrait quatre fois le même quartier, et le 2 × 2 n'apporterait
rien. Les sous-cases sont une grille deux fois plus fine — `(2r + qy, 2c + qx)`.
Un test le **mesure** : il exige que les quatre quartiers d'une case diffèrent, et
que deux cases voisines diffèrent entre elles.

⚠ **Et elle ne consomme toujours pas `etat.rng`** — le flux de la simulation
n'est pas touché, et le test qui relève l'état du flux avant et après une
peinture complète est resté vert.

---

## 6. ⚠⚠ LE COUPLAGE DES ATLAS A ÉTÉ RETOURNÉ, ET LE BUILD L'A EXIGÉ

Quatre atlas servent maintenant **des deux côtés** : en `background-image` sur
des éléments du DOM — le sol de la base, les unités de l'Offense — et en
`drawImage` sur un canevas, qui exige un `HTMLImageElement` et pas une adresse.

Les déclarer aux deux endroits les inlinerait **deux fois** : mesuré,
**507 464 octets** de base64 en trop — 299 400 pour l'atlas du monde, 208 064
pour les trois atlas d'unité —, soit **plus de sept fois** la marge restante.
Vérifié par falsification : remettre le `src` sur une seule image porte le
livrable de 1 242 496 à **1 541 447 octets**.

**Premier essai : garder le `src` dans le balisage et faire ÉCRIRE la variable
par le JS. Le build l'a refusé, et il avait raison.** Une adresse d'image
assemblée à l'exécution met dans le HTML final une chaîne que la garde offline ne
peut pas distinguer d'une vraie référence externe ; la faire taire pour ce cas-là
aurait été **passer sous un garde-fou en silence** — exactement ce que
`CLAUDE.md` §6 interdit nommément pour les hex à trois chiffres et pour l'espace
de noms SVG.

**Le sens est donc inversé** : la déclaration vit dans la feuille, une seule
fois, avec son marqueur ; `garnirLesAtlas` de `ui/session.js` recopie l'adresse
dans le `src` des images au démarrage. Le JS ne fait plus que **lire** ce que le
build a écrit et vérifié. Une garde balaie tout `src/ui/` et refuse qu'un
`url(` y soit fabriqué.

⚠ **Un piège rencontré en chemin, noté pour la suite : la garde offline lit le
HTML COMMENTAIRES COMPRIS.** Deux mentions en prose de la fonction CSS, dans un
commentaire qui expliquait précisément pourquoi on ne l'écrit pas, ont fait
tomber le build. C'est la faute que `CLAUDE.md` §6 raconte déjà — « une garde qui
lit ce qu'on a écrit à son sujet ne garde rien » — vue par l'autre bout.

---

## 7. Le zoom — deux surfaces, deux mécanismes, et c'est justifié

⚠⚠ **NI L'UN NI L'AUTRE N'EMPLOIE `transform: scale()`**, et c'est l'assertion
qui compte. Le dépôt l'interdit sur la grille de la base depuis le lot
POSE-À-L'ÉCRAN, pour une raison qui n'a pas bougé : une transformation déplace le
**dessin** sans déplacer la géométrie du pointage, donc le doigt cesse de tomber
sur la case qu'il vise. Le zoom devait arriver **sans rouvrir cette faute**.

**La base** change le **côté d'une case en pixels** (`--case-cote`, écrit par le
JS). Les cases restent des carrés que le navigateur sait localiser, et
`elementFromPoint` continue de rendre la bonne : la pose, le déplacement et le
panneau marchent après un zoom.

- plancher : la taille qui fait tenir les neuf colonnes dans la largeur
  disponible, **mesurée** sur `clientWidth`. En dessous, le zoom arrière ne
  montrerait que du vide.
- plafond : `COTE_SPRITE`, soit 64 — la résolution à laquelle un pixel de sprite
  vaut un pixel CSS. Au-delà on agrandirait du pixel art au-dessus de sa propre
  définition, ce que ce lot vient de retirer à la carte. **Le nombre se lit dans
  l'atlas, il n'est pas choisi.**
- le défaut d'ouverture se lit dans la feuille (`--case-defaut`), pas dans le
  code : c'est une décision de mise en page.

⚠ **`#chantier-defile` défile maintenant dans les deux sens**, sans quoi zoomer
ne montrerait rien de plus. **Ça ne contredit pas « tu compresses tout dans
l'ui »** : la consigne porte sur le CHROME, et la garde des 288 px continue de
refuser `overflow-x` sur les six barres nommées. Ici c'est le champ de jeu —
celui qu'Ethan vient de demander à pouvoir agrandir —, et la carte du monde se
promène dans les deux sens depuis le lot ÉCRAN-CARTE pour la même raison.

⚠⚠ **LES DEUX GESTES N'EMPLOIENT PAS LA MÊME API, ET CE N'EST PAS UNE
INCOHÉRENCE.**

- La **carte** est un canevas en `touch-action: none` : rien ne dispute le geste
  au JS, les évènements de pointeur y sont fiables, et `ui/monde.js` s'en sert
  déjà pour promener la carte.
- La **base** est un conteneur qui **défile nativement**. Sous
  `touch-action: pan-x pan-y`, le navigateur garde le droit de faire défiler à
  deux doigts ; quand il prend la main il envoie `pointercancel` et le pincement
  se perd au milieu du geste. Un `touchmove` **non passif** avec
  `preventDefault` le lui refuse pour ce geste-là seulement — le défilement à un
  doigt reste natif, inertie comprise.

Les aligner aurait demandé de repeindre à la main le défilement de la base, donc
d'en perdre l'inertie, pour uniformiser un mécanisme que rien n'oblige à l'être.

⚠ **`{ passive: false }` est la moitié qui compte**, et un test la garde : sans
lui `preventDefault` est **ignoré** dans un `touchmove`. Le code aurait l'air
juste, le navigateur défilerait quand même, et rien à l'écran ne dirait que c'est
l'option qui manque.

**Le zoom de la carte reste par CRANS**, et ce n'est pas un demi-travail :
`rendreDalle` lève sur un cran hors table parce qu'à chaque cran la tuile comme
l'emblème restent à un facteur d'échelle **entier** — seule façon de ne pas
brouiller du pixel art. Un zoom continu recalculerait les dalles à chaque image
— 19 ms pièce, mesuré — pour rendre du flou. Le **geste** est donc continu, son
**effet** discret : on franchit un cran quand les doigts se sont écartés de √2,
la moyenne géométrique entre deux crans qui vont du simple au double, c'est-à-dire
le point où le cran d'arrivée est plus proche que celui de départ.

⚠ **Et le zoom s'ancre sur le milieu des doigts, pas sur le centre de l'écran** :
c'est la seule façon de faire grossir **ce qu'on regarde**. Ancré au centre, la
case visée fuit sous les doigts, et sur une carte de 300 rangées on ne la
retrouve pas.

---

## 8. Ce qui a été RETIRÉ de l'écran, et où l'information est passée

« Rien ne se retire en silence » (`CLAUDE.md` §4). Ethan demande de retirer des
DESSINS ; trois d'entre eux portaient une information de jeu, et aucune n'est
détruite.

| Ce qui part | Ce qu'il disait | Où c'est passé |
|---|---|---|
| Lettre de l'obstacle | qui est ralenti | `title` de la case — appui long |
| Cadre de famille du jeton | prod · mil · pivot | `title` du jeton, et la palette le peint toujours |
| Nom de l'unité à l'Offense | quelle unité | `title` de l'emplacement, avec son niveau |

⚠ **Les classes `champ`, `quartz`, `scorie` et `obstacle` sont parties avec leurs
règles.** Elles ne peignaient plus que le fond kaki, le liseré tireté et la
lettre — les trois choses qu'Ethan fait retirer. Leur garder une règle pour
satisfaire la garde des classes aurait été **écrire une décoration pour un
test**, ce que la feuille refuse nommément depuis le lot PREMIÈRE-COUCHE. Le
code ne les pose donc plus du tout.

⚠ **`SIGLES_OBSTACLE` et `LIBELLES_OBSTACLE` restent branchés** — c'est le
`title` qui les consomme. Une table devenue morte aurait été le vrai retrait
silencieux.

---

## 9. Fichiers touchés

**`src/` (8)**

| Fichier | Ce qui change |
|---|---|
| `data/sites.js` | `ZOOM_CARTE` scindé, `PIXELS_SOURCE_PAR_CASE`, seuils relevés |
| `render/sprite.js` | `fondDeCellule` — la géométrie généralisée au quartier |
| `render/terrain.js` | le pavage lit la nouvelle échelle |
| `render/scene.js` | `genreDeLaGarnison` — le correctif de l'écran blanc |
| `ui/chantier.js` | sol 2 × 2, palette à sprites, zoom au pincement, classes retirées |
| `ui/offense.js` | sprites d'unité dans les emplacements et la palette |
| `ui/monde.js` | pincement, ancrage du zoom, boutons retirés |
| `ui/session.js` | `garnirLesAtlas`, `urlDeLaValeurCss` |
| `index.src.html` | atlas déclarés une fois, +20 %, carrés et traits retirés, zoom |

**`test/` (5)** — `chantier`, `monde`, `offense`, `sprite`, `terrain`.

**Racine (2)** — `package.json` (0.49.0 · build 50), ce rapport.

⚠ **Aucun fichier ajouté ni retiré dans `src/` ni dans `test/`** : la §2 de
`CLAUDE.md` et la garde nominale de `documentation.test.js` n'avaient rien à
apprendre de ce lot.

---

## 10. Les tests — +14, et aucune assertion retirée

619 → **634**. Le détail :

| Fichier | + | Ce qu'ils gardent |
|---|---|---|
| `sprite.test.js` | +2 | la géométrie au quartier ; les DIX-SEPT pièces de garnison |
| `chantier.test.js` | +5 | palette à sprites ; carrés et traits partis ; +20 % ; zoom (× 2) |
| `offense.test.js` | +3 | sprite au lieu du nom ; les quatorze unités ; palette |
| `monde.test.js` | +4 | pincement ; atlas inliné UNE fois ; taille déclarée ; déballage CSS |

**Quatre tests existants ont changé de cible, aucun ne s'est assoupli :**

1. *les 162 cases reçoivent un sol* — vise `fondsDuSol` et **refuse** le retour
   de `tile_sol_j` ; il mesure en plus que les quatre quartiers diffèrent.
2. *l'obstacle garde la lettre* → *l'obstacle perd sa LETTRE* : il exige
   maintenant que l'information soit dans le `title`, ce qui est **une assertion
   de plus**, pas une de moins.
3. *l'atlas y est inliné* → *inliné UNE fois* : il **compte** les copies au lieu
   d'en trouver une. C'est la garde qui a le plus gagné du lot.
4. *le jeton porte un sprite* — exigeait `genre: 'defense'` écrit tel quel, ce
   qui était **la faute** ; il exige maintenant que le genre soit demandé, et
   refuse qu'on le réécrive en dur.

**Sept falsifications ont été jouées, les sept ont fait rougir la suite :**

| Falsification | Ce qui tombe |
|---|---|
| `tuilesParCase` remis à 1 | l'atlas et le sol |
| `--jeton-grossissement` remis à 1 | le +20 % |
| un `border-right` remis sur `.case` | les traits |
| le sol repasse par `tile_sol_j` | le sol |
| le `src` remis sur l'image de l'atlas | l'inlining unique (+299 429 o mesurés) |
| un `url(` fabriqué en JS | la garde `src/ui/`, **et le build** |
| `genre: 'defense'` pour les dix-sept | la garnison |
| `{ passive: false }` retiré | le pincement de la base |

---

## 11. ⚠ CE QUI N'EST PAS VÉRIFIÉ — déclaré non exécuté, jamais « passé »

`CLAUDE.md` §3 : le dépôt n'a ni jsdom ni navigateur, et **un test appareil non
exécuté se déclare non exécuté**.

1. **Les deux pincements.** Aucun geste tactile n'a été joué. Ce qui est vérifié
   est la FORME du code — rapport et non différence, `{ passive: false }`,
   fermeture du geste quand un doigt part —, pas son effet sous un doigt.
2. **L'aspect du sol 2 × 2 sur appareil.** Quatre cellules de 64 px dans une case
   de ~40 px CSS sont RÉDUITES d'un facteur 3,2 sous `image-rendering: pixelated`,
   c'est-à-dire au plus proche voisin. Sur une texture de bruit, le résultat est
   du bruit plus fin — c'est le sens voulu —, mais **je ne l'ai pas vu**. Le
   curseur si c'est trop granuleux est `ZOOM_CARTE.tuilesParCase` côté base, et
   il ne coûte qu'une ligne.
3. **Le sprite à 100,8 % de la case.** Il déborde de 0,4 % par côté. Aucun
   `overflow: hidden` ne le rogne, et deux jetons voisins ne peuvent pas se
   recouvrir de plus de 0,8 % — mais c'est un calcul, pas un regard.
4. **Le temps de rendu d'une dalle sur l'appareil**, toujours pas mesuré : il ne
   pouvait pas l'être avant ce lot non plus, et le lot ne le change pas — le
   recouvrement par pixel est identique.

---

## 12. Ce qui reste ouvert

1. **Les 41 sprites d'interface** (§2). ⚠ **AMENDÉ le 30/08 au soir** : l'art
   est arrivé, les neuf planches sont dans `art/sources/`. Ce qui manque n'est
   plus l'art mais la CHAÎNE — découpe, conditionnement, couture, index, et le
   branchement à l'écran. Voir `RAPPORT-SPRITES-S11.md`.
2. **`foyer-zero-ui.html` est ROUGE à l'audit — et elle l'était déjà.** Vérifié
   par `git stash` : sept écarts sur `main` comme après ce lot, tous sur le
   terrain et les débits de la base dessinée dans la maquette. Ce lot n'a pas
   touché la maquette et n'a pas creusé l'écart. À reprendre dans un lot qui la
   regarde.
3. **La maquette ne connaît pas les nouveaux dessins** : elle porte encore le
   quadrillage, les carrés de jeton et les liserés de champ. Le jour où on la
   reprend, c'est la même passe.
4. **Le grain de l'art de la carte reste de 4 pixels source.** Ce lot cesse de
   l'agrandir ; il ne le rend pas plus fin. Un art plus dense demanderait de
   régénérer l'atlas — et `art/sprites/carte/atlas-terrain-64.png` est une
   **source déclarée** que plus aucun outil ne produit (`tools/verifier.py`).
   Les quatre planches d'origine, elles, sont au dépôt dans
   `art/sources/carte/` : 256 tuiles de 128 px, quand l'atlas n'en porte que 64.
   **Il y a donc quatre fois plus de matière disponible que ce qui est cousu**,
   si quelqu'un veut un jour plus de variété.
