# RAPPORT — lot MUR-DE-CONTOUR

**31/08/2026** — version **0.58.0**, build **59**, réellement produits.

Douzième et dernier retour d'Ethan du 31/08 : « les murs contour ne sont pas
là ». Le lot les dessine.

---

## 0. Référence mesurée

| Grandeur | Avant (`origin/main`, bf62433) | Après |
|---|---|---|
| `npm test` | 764 pass / 0 fail | **768 pass / 0 fail** |
| `dist/index.html` | 1 274 380 o | **1 333 691 o** |
| Borne T10 | 1 300 000 | **1 400 000** |
| Marge sous la borne | 25 620 o (1,97 %) | **66 309 o (4,7 %)** |
| `tools/verifier.py` | — | **1 386 identiques · 2 différents (déclarés) · 0 nouveau · 0 MANQUANT**, VERT, 131 s |
| `SAVE_VERSION` | 15 | **15**, inchangée |

Le HTML change, donc `version` et `config.build` sont bumpés **ensemble**, et
**en chaînes** — `android/app/build.gradle.kts` les lit `as String`.

`tools/verifier.py` était dû : le lot touche `art/sprites/` et `tools/`.

---

## 1. Ce qui a été demandé, et dans quel ordre

Quatre messages d'Ethan, tous du 31/08, chacun corrigeant le précédent :

1. « les murs contour ne sont pas là »
2. « a cheval sur le bord / le brun orangé joueur le violet ouvrage »
3. « bien trop petit. fait les 4x pluslong et 4x plus large »
4. « mais c'est quoi cette chiasse de pixel. divise par deux l'asset original.
   et garde la colorisation. le mur fera 512x64. et le mur fait un U, le bas
   reste sans mur »

Le quatrième **remplace** le troisième : le premier essai gardait le mur dans la
chaîne des sprites de case — 64 × 64, quantifié sur les quatorze teintes de
`cond.py`, cousu dans un atlas — et n'agrandissait que le CADRAGE. C'était la
mauvaise réponse, et le mot d'Ethan la tranche. Ce qui suit décrit l'état
livré ; l'essai intermédiaire n'a pas survécu au lot.

---

## 2. Le producteur — `tools/bords.py`, réécrit

### 2.1 Un mur n'est pas un sprite de case

`planches.py`, `final128.py` et leurs cousins ramènent un dessin de 1 024 à une
case de 64. C'est juste pour une unité, qui doit tenir dans une case et se lire à
trente pixels ; c'est faux pour un mur, qui court le long d'un côté entier. La
réduction au seizième détruit le seul détail qui le fait lire comme une
construction — d'où « chiasse de pixel ».

**Mesuré des deux côtés** : le mur conditionné pesait 3 792 octets de base64 pour
seize tuiles ; celui-ci en pèse 52 864 pour cinq images. **Quatorze fois plus**,
et c'est le prix que l'arbitrage a fixé.

### 2.2 « Divise par deux », pris au mot

La planche fait 2 048 × 2 048, donc quatre cellules de 1 024. Mesuré sur les
quatre planches, le trait d'un mur occupe les **128 lignes centrales** de sa
cellule et l'angle le **carré central de 128**. Réduit d'un facteur deux :

| Sprite | Taille | Poids PNG (joueur) |
|---|---|---|
| `bord_j_mur_h_a`, `_h_b` | **512 × 64** | 10 250 · 8 485 |
| `bord_j_mur_v_a`, `_v_b` | 64 × 512 | 12 478 · 12 491 |
| `bord_j_angle_{no,ne,so,se}` | 64 × 64 | 2 216 · 2 213 · 2 192 · 2 157 |

À `COTE_SPRITE` pixels par case — le plafond du zoom — un mur couvre donc HUIT
cases au rapport 1:1.

### 2.3 La fenêtre de découpe est FIXE

L'étendue exacte du trait varie d'un pixel d'une cellule à l'autre : `y =
448..574` sur `mur_h_a`, `448..575` sur `mur_h_b`. Découper sur la boîte
englobante donnerait des sprites de tailles différentes, qui ne se
raccorderaient plus. L'outil découpe la fenêtre **centrale** et **asserte**
qu'aucun pixel opaque n'en sort.

### 2.4 « Garde la colorisation »

`quantifier` de `cond.py` apparie sur les quatorze teintes de `FICHE-STYLE.md`,
réglées pour les unités et les bâtiments. Sur ces bruns-ci **la porte du ROUGE
s'ouvre** et le mur ressort semé de `#E43E32`, la teinte que le dépôt réserve à
ce qui ATTAQUE LE JOUEUR. Mesuré au premier jet, et **refalsifié à ce lot** : en
rebranchant `quantifier`, le test qui refuse `#E43E32` tombe.

Les couleurs retenues sont donc celles du dessin, **réduites à seize par CAMP** —
par camp et non par sprite, sinon l'angle et le mur qu'il joint ne tomberaient
pas sur la même teinte.

Seize est un compromis **mesuré**, pas un chiffre rond. Sur `mur_h_a` :

| Couleurs | 8 | 12 | **16** | 24 | 32 | 64 | plein (22 000) |
|---|---|---|---|---|---|---|---|
| Octets | 6 507 | 8 612 | **10 670** | 13 611 | 16 057 | 23 190 | 41 790 |

Sous seize, le détail des briques s'aplatit à l'œil ; au-dessus, on paie sans
que ça se voie.

### 2.5 La réduction est alpha-correcte

Le fond des planches est magenta. Réduire le RVB sans le prémultiplier par
l'alpha ferait baver ce magenta dans le liseré du mur sur toute sa longueur —
invisible sur une vignette, flagrant sur 512 pixels. L'alpha redevient binaire :
le dépôt n'a aucune transparence partielle, et un bord à demi transparent se
lirait comme un défaut de rendu. Un test l'asserte pixel par pixel.

---

## 3. `bord/` sort des atlas, et ne peut pas y revenir

`coudre` de `tools/atlas.py` exige des cellules **carrées d'un même côté** : une
image de 512 × 64 n'y entre pas. La famille quitte donc `FAMILLES`,
`art/sprites/atlas-bord-64.png` est supprimé, `src/data/atlas.js` **revient à
l'octet** au contenu de `main`, et `art/sprites/bord/` perd ses trois
sous-dossiers de grille : seize fichiers, à plat.

Chaque image entre dans le livrable par **son propre marqueur** de
`tools/build.js`, comme les deux grosses bases de l'Ouvrage sur la carte du
monde.

⚠ **Et seul le camp du joueur entre** : cinq images, 52 864 octets de base64. Les
cinq de l'Ouvrage sont produites et attendent l'écran de raid ; les inliner
coûterait environ 27 000 octets pour zéro pixel. **C'est une économie que seul le
passage aux fichiers séparés rend possible** — un atlas aurait été tout ou rien,
et c'est ce qui justifiait, à l'essai précédent, de coudre les huit tuiles de
l'Ouvrage avec celles du joueur.

---

## 4. Le dessin — cinq pièces en U

### 4.1 Le U

« le mur fait un U, le bas reste sans mur ». La base s'ouvre sur sa propre bande
de défense, qui commence exactement là où la sienne finit : c'est le seul des
quatre côtés qui donne sur du terrain à soi, et le seul que l'assaillant
franchit. Deux angles (`no`, `ne`), trois murs (un horizontal, deux verticaux),
**cinq nœuds** — contre trente-huit à l'essai précédent.

### 4.2 À cheval, et rien ne se recouvre

Un mur fait **une case d'épaisseur** et se centre sur la ligne du bord, donc il
mord d'une demi-case de chaque côté. Les angles prennent une case chacun ; le mur
du haut court **exactement entre eux** ; chaque mur de côté va du bas de son
angle **au bord de la base**, pas dans la défense. Un test mesure les quatre
raccords à l'unité de case.

### 4.3 Les longueurs se calculent

Sur cette grille elles tombent à **huit cases**, soit très exactement les 512
pixels de l'asset au plafond du zoom. Ce n'est pas imposé : le
`background-size: 100% 100%` de la feuille étirera l'image le jour où la base
changera de taille. Un test **relève** la coïncidence au lieu de l'exiger.

### 4.4 Les deux variantes servent de part et d'autre

`mur_v_a` est éclairée à gauche, `mur_v_b` à droite : c'est ce pour quoi elles
ont été dessinées. `mur_h_b`, qui éclaire par le bas, est le pendant du mur que
le U n'a pas — elle reste produite et ne sert pas. Choisi **après comparaison à
l'écran** des deux variantes en position de mur du haut : celle qui s'accorde aux
angles est `a`.

---

## 5. Le défaut le plus coûteux du lot : trois étages, pas un ordre de document

Le calque du mur était le **premier enfant** de la grille et n'avait pas de
`z-index` : il peignait donc **sous le sol des cases qu'il chevauche**.

**Mesuré dans Chromium**, profil vertical à travers le mur du haut : la moitié
intérieure du trait était couverte par le sol dès la première rangée de cases —
et **pas la même moitié en haut qu'en bas**, si bien que les deux murs
horizontaux ne montraient pas le même dessin. Invisible tant que le trait faisait
un huitième de case ; flagrant à la moitié.

La feuille dit maintenant l'ordre : **le SOL (aucun étage), puis le MUR (étage 1),
puis les JETONS et le calque des traits (étage 2)**. Un test asserte la
**relation**, pas les trois nombres — recopier « 1 » et « 2 » laisserait passer
leur inversion, qui est exactement la faute.

### `.case.choisie` perd son `z-index`, et c'est mesuré avant d'être retiré

Il ne peignait rien : `outline-offset: -2px` tient le liseré **à l'intérieur** de
la case, où aucune voisine ne le recouvre. Montage de douze cases légales autour
d'une choisie, capture avec et sans : **zéro pixel de différence sur 457 600.**

Il coûtait en revanche cher depuis le mur. Un `z-index` sur une case en fait un
**contexte d'empilement** : le jeton de la case choisie restait prisonnier de
l'étage 1, et le mur lui passait dessus. Le bâtiment sélectionné — celui dont on
vient d'ouvrir le panneau — aurait été le seul barré par son propre mur.

---

## 6. Ce que le mur à cheval coûte, dit plutôt que tu

Un mur à cheval **recouvre forcément du sol**, et deux des quatre côtés n'ont
nulle part où se réfugier : la bande de défense commence là où celle des
bâtiments finit. Ce que le mur mange, c'est le **quart extérieur d'une case du
pourtour**, liseré de case légale compris **sur ce côté-là seulement** — les
trois autres côtés du liseré restent lisibles, et le jeton passe devant.

C'est le prix de « à cheval sur le bord », et il est écrit ici pour qu'il soit lu.

---

## 7. La demi-case de `padding`, et ce qu'elle a déplacé

Sans elle, la moitié extérieure du mur sortirait de la boîte de
`#chantier-grille` et le champ défilerait horizontalement au repos — **mesuré :
414 px de grille dans 360**. Trois conséquences, toutes dans `ui/chantier.js` :

- `coteQuiTient` divise par `GRILLE.largeur + 1` — la boîte fait dix cases de
  large pour neuf colonnes ;
- `hauteurRangee` rend `coteCase` au lieu de mesurer la boîte, qui porte
  maintenant le padding ;
- `bornesDeDefilement` prend une **marge**, sans quoi la demi-case du bas serait
  inatteignable au défilement.

Le test du zoom a été **recalibré, pas assoupli** : il asserte la nouvelle
division ET le `padding` de la feuille, les deux moitiés devant s'accorder.

### Un défaut du lot, trouvé à l'écran et non à la relecture

`bornesDeDefilement` raisonnait en coordonnées de RANGÉE, où la première rangée
commence à zéro. Avec le `padding`, elle commence une demi-case plus bas : chaque
bascule s'arrêtait donc une demi-rangée trop haut, et la Défense s'ouvrait sur la
fin de la base. **Mesuré dans Chromium : 288 px au lieu de 306.**

La fonction prend maintenant le `padding` et retire le mur **seulement au-dessus
de la bande qu'il entoure** — le U n'a pas de bas, ses bras s'arrêtent au bord de
la base, donc il n'y a rien à retirer en dessous. Le bas d'une bande suit le
CONTENU et non la boîte : la demi-case de padding du bas ne porte aucun dessin, et
la rendre atteignable ferait défiler dans du vide.

Trois falsifications de plus : ignorer le padding dans `min` (1 rouge), faire
déborder le mur au-dessus de toutes les bandes (1 rouge), descendre dans le
padding du bas (1 rouge).

---

## 8. Ce qui a été retiré

- **`fondAgrandi` de `render/sprite.js`** — écrite à l'essai précédent pour
  n'agrandir qu'un quart de cellule. Elle n'a plus d'appelant depuis que le mur
  n'est plus une cellule d'atlas, et une fonction sans appelant est une invitation
  à s'en servir de travers. Retirée avec ses tests.
- **Le paramètre `fenetre` de `poserCouches`** — même raison.
- **`bord` de `VARIABLE_DATLAS`** — ce n'est plus une famille cousue.

Rien de tout cela n'existait sur `main` : c'est du travail de ce lot défait par
la suite du même lot. Aucune assertion antérieure n'a été retirée ni assouplie.

---

## 9. Les tests — quatre neufs, tous falsifiés

| Fichier | Test | Ce qu'il mesure |
|---|---|---|
| `sprite.test.js` | `bord — les murs de contour sont des images à part` | 16 fichiers, pas de dossier de grille, absent de `ATLAS`, tailles 512 × 64 / 64 × 512 / 64 × 64, entre 8 et 16 teintes, pas de `#E43E32`, alpha binaire, et le rapport 1:1 relevé |
| `chantier.test.js` | `contour — le mur fait un U` | 5 pièces, pas d'angle bas, un seul mur horizontal, à cheval sur les trois lignes, bras arrêtés au bord de la base, quatre raccords sans trou |
| `chantier.test.js` | `contour — l'écran pose les cinq images` | chaque nom a une variable, chaque variable est une image INLINÉE du livrable, l'Ouvrage n'y est pas, la boucle lève au lieu de sauter |
| `chantier.test.js` | `contour — trois étages` | sol < mur < jetons, en RELATION ; `.case` et `.case.choisie` sans étage ; `pointer-events: none` ; la pièce ne fixe pas sa largeur dans la feuille |

### Falsifications passées

| # | Sabotage | Verdict |
|---|---|---|
| F1 | le U reprend un angle en bas | **2 rouges** |
| F2 | le bras du U dépasse dans la défense | 1 rouge |
| F3 | trou entre l'angle et le mur du haut | **2 rouges** |
| F4 | une image manque à `VARIABLE_DU_MUR` | 1 rouge |
| F5 | la boucle saute une image absente au lieu de lever | 1 rouge |
| F6 | `.case.choisie` reprend son `z-index` | 1 rouge |
| F7 | les jetons perdent leur étage | 1 rouge |
| F8 | la feuille refixe `width` sur une pièce | 1 rouge |
| P1 | `COULEURS = 32` | 1 rouge |
| P2 | `DEMI = 4` | 1 rouge |
| P3 | `BANDE = 256` | 1 rouge |
| P4 | quantification sur la palette du dépôt | 1 rouge — **et c'est la mesure du §2.4** |

Témoin à chaque fois : code intact → 0 rouge.

---

## 10. La borne T10, relevée de 1 300 000 à 1 400 000

Le lot fait entrer 52 864 octets d'images pour un livrable qui n'avait que
25 620 octets de marge. La borne monte **parce qu'une ressource entre
légitimement**, et le lot le dit — c'est la règle §5 de `CLAUDE.md` prise par
l'endroit. Elle n'a **pas** été relevée à l'essai précédent, où le mur tenait
sous la marge : ce n'est pas la même situation, et les deux sont écrites dans le
commentaire de T10.

Marge après le lot : **66 309 octets, 4,7 %**. Elle repasse au-dessus des quatre
pour cent, après neuf lots de baisse continue.

---

## 11. Ce qui reste ouvert

- **Le mur de l'Ouvrage n'est pas dans le livrable.** Cinq images produites,
  zéro inlinée. Le jour de l'écran de raid : une ligne dans `VARIABLE_DU_MUR`,
  une dans `tools/build.js`. L'écran LÈVE si on demande ces pièces avant.
- **`mur_h_b`, `angle_so` et `angle_se` ne servent pas** — le U n'a pas de bas.
  Elles restent produites : `art/sprites/` est reproductible, et la chaîne doit
  répondre de ce qu'elle sait faire.
- **Le rendu n'a pas été vu sur appareil.** Il a été mesuré et capturé dans
  Chromium en portrait 360 × 740, aux deux bouts du zoom ; il n'y a pas
  d'appareil ici, et un test appareil non exécuté se déclare **non exécuté**
  (`CLAUDE.md` §3).
- **Un bâtiment du pourtour perce le mur**, puisque les jetons passent devant.
  C'est voulu — un mur est un décor, un bâtiment est une information de jeu — et
  ça se voit sur la capture du Chantier, qui est en rangée 18. Si Ethan veut le
  contraire, c'est un `z-index` à échanger, et un seul.
