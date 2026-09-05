# RAPPORT — lot EMBLÈMES-ABÎMÉS

> ⚠⚠ **EN TÊTE, ET EN UNE LIGNE, PARCE QUE LE BRIEF L'EXIGE : NON, AUCUN CHEMIN
> NE RÉPARE LES BÂTIMENTS DU JOUEUR SUR `main` AU MOMENT DE L'EXÉCUTION.**
> `REPARATION_BASE_JOUEUR.courbe` vaut toujours `null`, `sim/reparation.js` ne
> touche que `laBase.armee`, et le seul `degatsMilli = 0` posé sur une
> `disposition` est la migration v19 → v20, qui remplit un champ absent. **Un
> emblème de la base du joueur passé au feu y restera donc définitivement**
> jusqu'à ce que le lot réparation arrive. Côté Ouvrage il n'y a pas de
> problème : `reparerLesSites` efface l'entrée au bout d'une heure, et
> `EMB T12` mesure que l'emblème redevient sain de lui-même.

`npm run check` → **1093 pass / 0 fail** (avant : 1080) · `npm run build` →
`dist/index.html`, **7 060 617 octets**, 0 référence externe · version
**0.94.0 · build 96** · `SAVE_VERSION` **inchangée à 24**.

---

## 1. Ce qui entre

Huit planches d'Ethan, 1024 × 1024, deux états — dégâts fumants et incendie —
pour les quatre familles d'emblème de site. **72 sprites neufs**, et **les 36
sains régénérés**, parce que l'échelle change pour tout le monde.

| Geste | Où |
|---|---|
| Couper les huit planches en 72 sprites | `tools/emblemes.py` |
| Rendre l'échelle relative — anciens compris | `tools/final128.py`, `tools/emblemes.py` |
| Choisir l'emblème selon l'état du site | `src/sim/site-entame.js`, `src/render/embleme.js`, `src/ui/monde.js` |

---

## 2. Les planches : ce qui a été mesuré, et où le brief se trompait

Toutes les valeurs du §2 du brief ont été **remesurées** sur les fichiers.

**Ce qui se confirme.** 1024 × 1024, mode RGB, fond magenta pur sur 64 à 67 %
de la surface. Les gouttières VERTICALES existent sur les huit — trois bandes
de matière franches, aux colonnes 292–377 et 612–692 sur la planche du joueur.

⚠⚠ **ET LES GOUTTIÈRES HORIZONTALES N'EXISTENT PAS, CE QUI EST LE FAIT CENTRAL
DE LA CHAÎNE.** À la frontière du tiers, il reste de la matière sur les huit :

| planche | à `y = 341` | à `y = 682` | lignes vides intérieures |
|---|---|---|---|
| `base_joueur_degats_fumee` | 129 px | 115 px | 256–287 · 581–588 |
| `base_joueur_en_feu` | 129 px | 140 px | 256–290 · 581–591 |
| `base_ouvrage_degats_fumee` | 154 px | 283 px | **aucune** |
| `base_ouvrage_en_feu` | 216 px | 278 px | **aucune** |
| `camps_quartz_degats_fumee` | 145 px | 393 px | 278–289 |
| `camps_quartz_en_feu` | 165 px | 434 px | 278–287 |
| `camps_scories_degats_fumee` | 157 px | 331 px | 301–314 |
| `camps_scories_en_feu` | 207 px | 341 px | 301–308 |

Les deux planches `base_ouvrage` n'ont **aucune** ligne vide entre leurs
rangées, et là où il y en a, elles ne tombent pas sur les tiers. **La coupe se
fait donc par composante connexe, et la cellule rendue porte le MASQUE de sa
composante** — jamais un rectangle, qui reprendrait forcément un morceau du
panache voisin.

**Sept planches sur huit rendent exactement neuf composantes** de plus de
500 px. La huitième, `camps_quartz_en_feu`, en rend **huit** : la composante
fusionnée mesure **253 × 620**, deux cellules de haut, dans la colonne du
milieu.

⚠ **LE SEUIL DE 500 PX N'EN EST PAS UN.** Mesuré sur les douze planches : la
plus petite composante d'emblème fait **13 541 px**, la plus grosse braise
détachée **258**. Un facteur cinquante-deux — ce n'est pas un seuil calibré,
c'est un fossé.

### Comment `camps_quartz_en_feu` a été séparée

Par une **coupe horizontale à la taille la plus fine du tiers central** de la
composante. Le profil de largeur de la composante fusionnée descend de 245 px
sous le bâtiment du haut à **20 px** au plus fin, puis remonte avec le panache :

```
  y=540  245 px   ############################################
  y=560  212 px   #####################################
  y=568  107 px   ##################
  y=576   49 px   ########
  y=583   20 px   ###          ← la taille
  y=600   59 px   ##########
  y=640   83 px   ##############
```

⚠⚠ **ET LA COUPE SE CONFRONTE À LA PLANCHE SŒUR, PAS À UN NOMBRE ÉCRIT.** Sur
`camps_quartz_degats_fumee`, où les deux composantes sont **séparées**, la même
colonne met sa frontière à **y = 582** (fin de la rangée 2) et **y = 580**
(début de la rangée 3). La coupe tombe à **y = 583** : **un pixel d'écart sur
1 024**, soit un huitième de pixel du sprite produit. `EMB T1` rejoue cette
comparaison à chaque exécution.

Regardé au pixel : les deux moitiés sont des bâtiments complets, avec leur feu
et leur panache, de la même taille que leurs jumeaux `_fumee` issus d'une source
séparée. **Ni panache tronqué, ni moignon du voisin.**

### Les braises détachées

**32 petites composantes sur `camps_quartz_en_feu`, 0,08 % de la matière des
douze planches.** Ce sont les étincelles d'un incendie : les jeter reviendrait à
éteindre le feu. Chacune rejoint la composante dont elle est la **plus proche**,
par transformée de distance — et non celle dont la boîte la contient, une braise
qui monte sortant de sa boîte.

### Les trous quasi-magenta

⚠⚠ **UN DÉFAUT A ÉTÉ INTRODUIT PUIS CORRIGÉ DANS CE LOT, ET C'EST LE SECOND
PIÈGE DE LA SECONDE PORTE D'`est_fond`.** Le premier jet masquait sur la
composante **nue** — celle qu'`est_fond` rend — et peignait en magenta tout le
reste. Or la seconde porte d'`est_fond` attrape le **violet clair de l'Ouvrage**
jusqu'au milieu d'une base : c'est très exactement le défaut que le lot PIXELS a
mesuré et que `est_fond_sujet` borne, dans `conditionner`, à la composante de
fond qui **touche le bord**. En rabattant ces pixels sur le magenta EN AMONT, on
les rendait irrattrapables en aval.

**Mesuré : `site_base_o` passait de 0 à 893 pixels de trou**, et les 525 pixels
percés de sa source sont du `#8D5FA0` — c'est-à-dire du sujet. Le masque porte
désormais sur la composante **remplie** (`binary_fill_holes`), qui ne bouche que
ce qui est **enfermé** : une arche ouverte sur le dehors reste ouverte.

| | total sur 108 sprites | pire sprite |
|---|---|---|
| masque sur la composante nue | 1 400 px | 195 px (`site_base_o_n9`) |
| **masque sur la composante remplie** | **187 px** | **56 px** (`site_quartz_n3_fumee`) |

Après correction : **les 36 sains ont exactement ZÉRO trou**, comme avant le
lot ; 14 sprites sur 108 en portent au moins un, la médiane est 0, et la pire
part vaut **1,75 %** de la matière de son sprite. `EMB T7` fige les trois faits,
et c'est le zéro des sains qui mord.

### Le violet de l'Ouvrage — verdict à l'œil

Le brief demandait de vérifier à l'ŒIL, pas dans un histogramme. Planche de
contact des 27 sprites de `site_base_o`, agrandie : **le violet n'est pas
mangé.** Les bâtiments sortent entiers, dans leur rampe `A contour` → `A
lumière`, panache et flammes propres par-dessus. La matière intérieure de ces
deux planches ne descend qu'à 29,7 et 9,4 du magenta, très loin du seuil de 140,
et le rendu le confirme.

---

## 3. L'échelle — les 36 sains avaient déjà perdu la leur

⚠⚠ **LA DÉCOUVERTE DU BRIEF EST CONFIRMÉE, ET ELLE EST PIRE QU'ANNONCÉE.**
`recadrer` portait le contenu de **chaque cellule** à `cible/N` de sa boîte,
donc normalisait chaque palier séparément. Mesuré sur `art/sprites/carte/128/`
avant le lot : non seulement `site_base_j` faisait 86 px de large en `n1` pour
118 en `n9`, mais **sept des neuf paliers valaient 117 ou 118** — il n'y avait
pas de progression du tout, seulement deux accidents.

### Ce qui a été fait

`recadrer` gagne deux paramètres **optionnels**, `cote_ref` et `ancrage`, dont
les défauts rendent la formule d'hier au caractère près — c'est ce qui laisse
les quinze autres producteurs byte-identiques, et **le vérificateur le dit**.

- **`cote_ref`** : la référence est **commune à la famille entière**, saine et
  abîmée ensemble. Sans ça, `site_base_j_n5` sain et son `n5` en feu auraient
  deux tailles, et la base grandirait en prenant feu.
- **`ancrage='bas'`** : les contenus reposent sur une **ligne de sol commune**,
  posée là où le centrage mettait le plus grand contenu — `box/2 + cote_ref/2`.
  L'emprise ne change donc pas de valeur : `EMPRISE = 30` reste 30, elle devient
  celle du plus GRAND palier au lieu d'être celle de tous.

⚠⚠ **ET LA RÉFÉRENCE EST RELATIVE À LA CELLULE DE PLANCHE, PAS EN PIXELS BRUTS.**
Les quatre planches saines font **1 254** pixels de côté, les huit neuves
**1 024**. Comparer des pixels bruts aurait rétréci tout l'état abîmé de 18 %.

**C'est une mesure qui autorise à les mettre à la même échelle**, pas une
supposition. Largeurs rapportées à la cellule, sain contre fumée :

| famille | n1 | n2 | n3 | n4 | n5 | n6 | n7 | n8 | n9 |
|---|---|---|---|---|---|---|---|---|---|
| `base_o` sain | 0,366 | 0,488 | 0,608 | 0,510 | 0,620 | 0,699 | 0,696 | 0,768 | 0,940 |
| `base_o` fumée | 0,366 | 0,489 | 0,609 | 0,507 | 0,621 | 0,700 | 0,697 | 0,765 | 0,940 |
| `scorie` sain | 0,376 | 0,533 | 0,663 | 0,574 | 0,651 | 0,756 | 0,739 | 0,715 | 0,974 |
| `scorie` fumée | 0,372 | 0,533 | 0,662 | 0,574 | 0,653 | 0,756 | 0,741 | 0,715 | 0,973 |

Trois familles sur quatre coïncident à moins de 1 %. `site_base_j` est
systématiquement **3 % plus étroite** à l'état abîmé — c'est le dessin d'Ethan,
et la chaîne ne peut pas le rattraper sans normaliser par planche, c'est-à-dire
sans casser la propriété qu'on vient d'acheter.

⚠ **ET C'EST `max(largeur, hauteur)` QUI BORNE LA RÉFÉRENCE, PAS LA SEULE
LARGEUR.** Le panache fait monter la hauteur jusqu'à **1,08 cellule** ; une
référence prise sur la largeur aurait laissé le sommet du panache hors de la
boîte.

### Les 36 sains, avant → après

Largeur de matière, alpha ≥ 128, grille 128 :

| famille | n1 | n2 | n3 | n4 | n5 | n6 | n7 | n8 | n9 |
|---|---|---|---|---|---|---|---|---|---|
| `site_base_j` | 86→**36** | 117→56 | 118→80 | 118→68 | 117→78 | 118→92 | 118→89 | 106→84 | 118→**108** |
| `site_base_o` | 97→**38** | 107→52 | 111→66 | 94→54 | 108→68 | 109→76 | 102→76 | 102→84 | 111→**102** |
| `site_quartz` | 86→**33** | 109→52 | 118→70 | 117→68 | 117→81 | 118→83 | 110→77 | 103→83 | 115→**99** |
| `site_scorie` | 112→**44** | 117→63 | 118→78 | 117→68 | 117→77 | 118→90 | 118→88 | 110→85 | 118→**116** |

Hauteur :

| famille | n1 | n2 | n3 | n4 | n5 | n6 | n7 | n8 | n9 |
|---|---|---|---|---|---|---|---|---|---|
| `site_base_j` | 115→47 | 112→52 | 81→50 | 111→64 | 113→74 | 92→71 | 103→78 | 118→93 | 107→98 |
| `site_base_o` | 116→46 | 117→57 | 117→70 | 118→68 | 117→73 | 118→81 | 118→87 | 118→97 | 118→109 |
| `site_quartz` | 115→44 | 116→54 | 105→62 | 93→54 | 100→68 | 103→72 | 118→82 | 117→94 | 118→101 |
| `site_scorie` | 115→45 | 101→54 | 102→67 | 99→57 | 93→61 | 91→69 | 99→74 | 118→90 | 103→101 |

Ligne de sol — le bas de la matière :

| famille | avant | après |
|---|---|---|
| `site_base_j` | 120 · 119 · **104** · 119 · 120 · **113** · 117 · 122 · 121 | **122 partout** |
| `site_base_o` | 122 partout | 122 partout |
| `site_quartz` | 121 · 122 · **116** · **110** · **113** · **115** · 122 · 122 · 122 | **122 partout** |
| `site_scorie` | 121 · **114** · **114** · **113** · **110** · **109** · **113** · 122 · **115** | **122 partout** |

### Les 72 nouveaux

Largeur × hauteur, ligne de sol **122 partout** :

| | n1 | n2 | n3 | n4 | n5 | n6 | n7 | n8 | n9 |
|---|---|---|---|---|---|---|---|---|---|
| `base_j` fumée | 34×72 | 54×80 | 76×82 | 66×96 | 75×97 | 88×101 | 86×106 | 80×114 | 104×117 |
| `base_j` feu | 34×73 | 53×79 | 76×82 | 66×100 | 75×98 | 88×100 | 86×107 | 81×113 | 104×117 |
| `base_o` fumée | 38×73 | 52×79 | 66×88 | 54×89 | 67×92 | 76×94 | 75×104 | 82×108 | 102×117 |
| `base_o` feu | 38×74 | 52×82 | 66×88 | 54×90 | 67×94 | 76×95 | 74×107 | 82×110 | 102×118 |
| `quartz` fumée | 36×69 | 51×83 | 70×86 | 68×83 | 80×93 | 84×96 | 76×103 | 83×109 | 98×117 |
| `quartz` feu | 37×69 | 51×83 | 70×86 | 68×86 | 80×94 | 84×97 | 76×103 | 82×108 | 98×118 |
| `scorie` fumée | 42×77 | 62×87 | 78×96 | 68×88 | 77×89 | 90×96 | 87×100 | 84×113 | 116×117 |
| `scorie` feu | 42×80 | 62×88 | 78×99 | 68×90 | 77×91 | 90×98 | 87×101 | 84×114 | 116×118 |

⚠ **LA HAUTEUR MONTE ET LA LARGEUR NON, ET C'EST LE PANACHE.** Un `n1` en feu
fait 34 px de large comme son sain, et 73 px de haut contre 47 : c'est la fumée
qui monte dans l'espace laissé libre au-dessus de la ligne de sol.

⚠⚠ **ET LA LARGEUR EST LA MÊME DANS LES TROIS ÉTATS, À 4 PIXELS PRÈS AU PIRE** —
`base_o` et `scorie` tiennent à 2, `base_j` et `quartz` à 4. Le résidu est dans
l'ART, pas dans la chaîne : `EMB T5` le mesure des deux façons, en absolu et en
rapport à la source, et la seconde moitié tombe à 2 px.

---

## 4. Le câblage

| État du site | Emblème |
|---|---|
| aucun dommage | l'emblème sain, comme aujourd'hui |
| un bâtiment ou une défense abîmés | **fumée** |
| le bâtiment **qui rase le site** abîmé | **feu** |

⚠⚠ **`avarie` EST UNE RÈGLE, ÉCRITE UNE FOIS POUR LES DEUX CAMPS.** Elle reçoit
deux booléens et rend un des trois états ; `avarieDuSite` (Ouvrage) et
`avarieDeLaBase` (joueur) ne font qu'extraire les faits. `EMB T11` mesure la
table de vérité complète — quatre entrées, quatre sorties.

⚠⚠ **ET LE DISCRIMINANT EST `raseLeSite`, DES DEUX CÔTÉS.** `src/data/base.js`
le porte sur le Chantier de construction, avec le commentaire qui dit que c'est
le même nom de champ que `BATIMENTS.souche.raseLeSite`. Un
`id === 'chantierDeConstruction'` aurait été la seconde vérité que §4 interdit,
et il aurait menti pour toutes les bases de l'Ouvrage. `EMB T13` balaie les
trois fonctions qui décident.

⚠ **LA GARDE A ACCUSÉ UN INNOCENT AU PREMIER JET, SIXIÈME FOIS DU DÉPÔT.** Elle
balayait le module entier et tombait sur `resultat.cause === 'souche'` — où
« souche » est une CAUSE DE FIN DE COMBAT qui se trouve s'écrire comme
l'identifiant du bâtiment. Elle nomme désormais son périmètre : les trois
fonctions de décision, et elles seules.

⚠ **RIEN N'ENTRE DANS L'ÉTAT, ET `SAVE_VERSION` RESTE À 24.** L'avarie se LIT
sur des PV qui étaient déjà là : `pvBatimentsMilli` côté Ouvrage — où `null` veut
dire intacte, `0` détruite, un nombre les milli-PV restants —, `degatsMilli` côté
joueur. `EMB T12` remet les PV à `null` et vérifie que l'emblème redevient sain
de lui-même.

⚠ **L'ÉCRAN DEMANDE, IL NE RECOMPOSE PAS.** `avariesParCase` part des sites
ENTAMÉS — quelques dizaines — et non des sites visibles, qui vont jusqu'à quinze
cents : interroger chaque case régénérerait un montage par case, à chaque image.

⚠ **ET LE PALIER NE CHANGE PAS AVEC L'ÉTAT.** `palierDeNiveau` choisit le
palier, l'avarie choisit la FAMILLE de dessin. `EMB T10` le vérifie sur trois
paliers et mesure en plus que les trois états font la même largeur.

⚠ **AUCUN POI N'A D'ÉTAT** : il n'y a qu'un dessin par type, un gisement ne
brûle pas, et un POI ne s'attaque même pas — il n'est dans aucun `TYPES_SITE`.
Leur coudre quatorze sprites de plus aurait payé des octets pour un état
inatteignable.

---

## 5. Les treize tests, et leur montage effectif

| Test | Montage | Ce qu'il mesure |
|---|---|---|
| `EMB T1` | le manifeste des 108 cellules + les fichiers | 27 cellules par famille, la coupe unique confrontée à la planche sœur, les deux moitiés non vides et distinctes |
| `EMB T2` | colonnes et lignes de sol du manifeste | ordre de lecture 3 × 3, sol croissant dans chaque colonne, et un tri GLOBAL rejoué qui doit DIFFÉRER |
| `EMB T3` | 108 largeurs prédites contre mesurées | résidu dans ]0 ; 4[ px et étalé de moins de 3 — l'affinité |
| `EMB T4` | les 36 sains seuls | `n1 / n9 < 0,55` — tombe si les sains ne sont pas régénérés |
| `EMB T5` | les 36 triplets sain/fumée/feu | même largeur à 4 px, et le rapport de la source conservé à 2 px |
| `EMB T6` | les 108 sprites | une seule ligne de sol, `Set` de taille 1 |
| `EMB T7` | remplissage depuis le bord des 108 | zéro trou sur les sains, part < 3 %, total < 400 px |
| `EMB T8` | `ATLAS.carte` et `spriteDuSite` | 115 noms, les 108 présents, grille suffisante, et un POI qui ignore l'avarie **dans les deux sens** |
| `EMB T9` | trois raids enregistrés sur un vrai site de niveau 20 | trois avaries, trois noms de sprite, tous dans l'atlas |
| `EMB T10` | paliers 1, 5, 9 dans les trois états | le palier ne bouge pas, les largeurs non plus |
| `EMB T11` | base du joueur : Chantier, autre bâtiment, garnison | mêmes trois familles, table de vérité d'`avarie` |
| `EMB T12` | site en feu dont les PV sont restaurés | l'emblème redevient sain, la carte des avaries se vide |
| `EMB T13` | source de `site-entame.js` et de `monde.js` | aucun identifiant en dur dans les trois fonctions, l'écran demande, l'avarie atteint le nom |

⚠ **`EMB T9` MONTE UN VRAI SITE** — `montageDuSite` sur la case (250, 16), et
c'est de là que viennent les identifiants. Le résultat de raid, lui, porte des PV
posés à la main : `montageDuSite` rend `{id, rangée, colonne, niveau}` et c'est
`creerCombat` qui en tire les PV. Le premier jet lisait `b.pvMilli` sur le
montage, obtenait `undefined`, et rangeait des `undefined` que `JSON.stringify`
affiche comme `null` — **le montage passait pour intact tout en laissant une
entrée**. Une assertion vérifie désormais que le montage mesure quelque chose :
zéro entrée pour un site intact, une pour les deux autres.

### Falsifications — quatorze, treize chutes, une déclarée

| # | Falsification | Effet |
|---|---|---|
| 1 | `cote_ref` retiré, chaque cellule normalisée seule | **5 tests tombent** |
| 2 | `ancrage` remis au centre | **2 tombent** |
| 3 | masque sur la composante NUE | **1 tombe** |
| 4 | tri par le HAUT au lieu du bas, dans une colonne | ⚠ **ne mord pas — déclarée** |
| 5 | tri GLOBAL, sans groupement par colonne | **2 tombent** |
| 6 | effectif de l'atlas laissé à 43 | **l'outil sort en échec** |
| 7 | `spriteDuSite` ignore l'avarie | **3 tombent** |
| 8 | les deux tests d'`avarie` intervertis | **3 tombent** |
| 9 | identifiant en dur au lieu de `raseLeSite` | **1 tombe** |
| 10 | la garnison ne compte plus | **1 tombe** |
| 11 | le palier suit l'état | **3 tombent** |
| 12 | les 36 sains non régénérés | **5 tombent** |
| 13 | un POI reçoit un suffixe d'état | ⚠ **ne mordait pas — garde resserrée**, puis 1 tombe |
| 14 | la composante fusionnée non séparée | **l'outil LÈVE**, en nommant la colonne |

⚠⚠ **LA QUATRIÈME NE MORD PAS, ET LE BRIEF ANNONÇAIT L'INVERSE.** Il écrivait
« trier par `y` du haut mélange les rangées — vérifié, ça donne un `n2` plus
large que son `n3` ». **Mesuré colonne par colonne sur les douze planches : les
deux tris rendent le même ordre.** Ce qui corrige n'est pas le choix du bas,
c'est le GROUPEMENT PAR COLONNE — un tri global par ligne de sol met la colonne 1
devant la colonne 0 sur la planche saine du joueur, dont la rangée 1 porte les
bas 311, 310 et 311. La ligne de sol reste le bon critère, parce qu'elle ne
dépend pas de la hauteur du panache ; mais **un test qui prétendrait garder ce
choix-là serait vide aujourd'hui**, et il se déclare au lieu de se compter.

⚠⚠ **LA TREIZIÈME NE MORDAIT PAS NON PLUS, ET LA GARDE A ÉTÉ RESSERRÉE APRÈS LA
MESURE.** `EMB T8` ne lisait que l'INDEX de l'atlas : faire porter le suffixe
d'état à un POI dans `spriteDuSite` laissait la suite **entièrement verte, 13
pass / 0 fail mesuré**, parce que rien n'appelait la fonction sur un POI avec une
avarie. Elle demande maintenant les deux. **Une falsification qui ne mord pas se
vérifie avant d'être crue** — treizième fois du dépôt.

---

## 6. Le boot Chromium — et le démarrage, qui était une condition

Géométrie du S25 FE : **1080 × 2340 physiques, DPR 3**, donc 360 × 780 CSS.
Quatre boots par côté, **zéro erreur de page** sur tous.

### Le démarrage, parce que la borne l'exigeait

⚠⚠ **LE §0 DE `CLAUDE.md` POSE SEPT MÉGAOCTETS COMME « LA MARGE AU-DELÀ DE
LAQUELLE IL FAUDRA REMESURER CE DÉMARRAGE AVANT DE FAIRE ENTRER QUOI QUE CE
SOIT ».** Ce lot est le premier à franchir ce point. La condition demande
l'appareil d'Ethan — un Galaxy S25 FE — et **le dépôt n'en a pas** (§3). Elle a
donc été mesurée dans Chromium, et **ce n'est pas l'appareil** :

| | `main`, 6 801 384 o | branche, 7 060 617 o |
|---|---|---|
| `DOMContentLoaded` | 545 · 442 · 480 ms → **médiane 480** | 457 · 454 · 478 → **médiane 457** |
| `load` | 552 · 447 · 496 | 463 · 461 · 490 |
| premier rendu | 272 · 208 · 216 → **médiane 216** | 212 · 220 · 224 → **médiane 220** |

**Le démarrage ne se dégrade pas** : les 259 233 octets de base64 en plus ne
coûtent rien de mesurable ici. Ce n'est pas une preuve sur le téléphone, et le
relèvement de la borne reste **une proposition — Ethan tranche.**

### Ce qui se voit à l'écran

Captures dans `rapports/` :

| fichier | ce qu'il montre |
|---|---|
| `EMBLEMES-ABIMES-1-contact-avant-sains.png` | les 36 sains AVANT : les neuf paliers de chaque famille remplissent tous la case |
| `EMBLEMES-ABIMES-2-contact-apres.png` | les 108 APRÈS : douze rangées de neuf, la progression de taille, les trois états alignés sur une ligne de sol |
| `EMBLEMES-ABIMES-3-coupe-quartz-feu.png` | les deux moitiés de la composante fusionnée, ×3, à côté de leurs jumeaux `_fumee` |
| `EMBLEMES-ABIMES-4-carte-avant.png` | la carte AVANT : toutes les bases de la même taille |
| `EMBLEMES-ABIMES-5-carte-apres.png` | la carte APRÈS : les bases de bas niveau sont des points, la taille croît vers le haut de la carte |
| `EMBLEMES-ABIMES-6-base-apres.png` | l'écran de la base, inchangé |

⚠⚠ **LES DEUX CAPTURES DE CARTE N'ONT PAS LA MÊME GRAINE, ET IL FAUT LE DIRE.**
Une partie neuve tire sa graine à chaque chargement — c'est le piège que le lot
FREEZE-ET-PALETTE a payé en croyant comparer deux rendus. Les bases ne sont donc
pas aux mêmes cases d'une capture à l'autre. **Ce qui se compare est la
DISTRIBUTION DES TAILLES**, qui est une propriété de toutes les graines, et elle
est confirmée par la mesure sprite par sprite du §3.

⚠⚠ **ET ETHAN VERRA SA PROPRE BASE RÉTRÉCIR AU PREMIER COUP D'ŒIL.** Elle est au
niveau 1,0, donc au palier 1 : elle passe de 86 à **36 pixels de matière**. C'est
exactement ce qu'il a demandé — « les petites bases doivent rester petites » — et
c'est aussi le changement le plus visible du lot. **Une ligne à retourner s'il
juge que sa propre base doit faire exception** : ce serait un cas particulier
dans `spriteDuSite`, et ce lot n'en écrit aucun.

### Le violet de l'Ouvrage — le verdict à l'œil

Le brief demandait de regarder, pas de croire un histogramme. Sur la planche de
contact, les 27 sprites de `site_base_o` : **le violet n'est pas mangé.** Les
bâtiments sortent entiers dans leur rampe `A contour` → `A lumière`, avec leurs
foyers ambrés, et le panache gris se pose par-dessus sans les percer.

---

## 7. Le coût en octets

Mesuré poste par poste contre un livrable **rebâti depuis `main`** dans un
`git worktree` — 6 801 384 octets, exactement le nombre que `CLAUDE.md`
annonçait.

| poste | `main` | branche | delta |
|---|---|---|---|
| **TOTAL** | 6 801 384 | **7 060 617** | **+259 233** |
| images | 5 130 292 | 5 386 764 | **+256 472** |
| JavaScript | 342 911 | 345 672 | +2 761 |
| feuille | 101 261 | 101 261 | **0** |
| balisage | 34 798 | 34 798 | **0** |
| audio | 1 187 560 | 1 187 560 | **0** |

**Tout le poids est l'atlas**, qui passe de 217 330 à **409 686 octets** sur le
disque — 43 → 115 sprites, grille 7 × 7 → 11 × 11 — soit +256 475 en base64.

⚠ **`QUALITE` NE SE BAISSE PAS POUR PASSER SOUS LA BORNE.** Elle vaut 85 pour
les DIX-NEUF atlas du dépôt : la baisser pour ce lot dégraderait les dix-huit
autres, et ce serait rogner pour tenir sous une borne, ce que §5 refuse.

⚠⚠ **ET LE COMPTE DE `data:` EST 284, PAS 289 — LE DÉPÔT RÉCITE UN COMPTE DE
LIGNES.** Mesuré des deux côtés : `grep -c 'data:'` rend **289**, mais c'est le
nombre de LIGNES qui contiennent la chaîne ; les URI réelles sont **284** —
263 `audio/ogg`, 18 `image/webp`, 3 `image/png`. Les cinq lignes de trop sont un
commentaire de la feuille qui EXPLIQUE l'inlinage, plus une ligne de JavaScript
minifié où les deux mots se croisent par hasard. **284 avant, 284 après** : pas
une ressource n'entre, c'est le même atlas qui grossit. Les lots précédents ont
recopié « 289 » cinq fois de suite ; c'est corrigé au §0.

---

## 8. La chaîne graphique

```
python3 tools/verifier.py
  → 1 406 identiques à l'octet · 0 différent · 0 nouveau · 0 MANQUANT
  VERDICT : la chaîne répond de ses sprites          (442,4 s)
  VERDICT : la chaîne lit exactement les sources déclarées

python3 tools/entrees.py --declarer
  → 370 consommées · 95 dormantes · 465 dans art/sources/
```

Il était dû : le lot touche `art/` et `tools/`. **Le compte passe de 1 261 à
1 406** — les 144 sprites qui entrent (72 × deux grilles) et leur manifeste de
mesures, et rien d'autre. `art/sources/` passe de 362 / 95 / 457 à **370 / 95 /
465** : les huit planches entrent CONSOMMÉES, et le diff de
`art/sources-declarees.json` raconte le lot en huit lignes.

⚠ **ET LES QUINZE AUTRES PRODUCTEURS SONT BYTE-IDENTIQUES**, ce qui est la seule
preuve qui vaille que les deux paramètres neufs de `recadrer` n'ont pas bougé la
formule d'hier. Ce n'est pas une relecture, c'est un rejeu.

⚠ **UN DÉTAIL DE MÉTHODE, PAYÉ UNE FOIS.** `import emblemes` exécute le module —
il n'a pas de garde `__main__` — donc une simple mesure qui l'importait a
régénéré les 90 sprites d'alors. Sans conséquence : `git status` est resté vide,
ce qui a donné gratuitement la preuve que la chaîne était reproductible **avant**
qu'on y touche.

---

## 9. `tools/emblemes.py` : ce qui a changé

- `FAMILLES` entre : quatre familles × trois planches. Les quatre entrées
  d'emblème SORTENT de `PLANCHES`, qui garde ce qui n'a pas de famille — les
  POI, dont il n'existe qu'un dessin par type, et les deux grosses bases. **Une
  famille se conditionne d'un bloc**, ses trois états partageant une échelle.
- `cellules_par_composante` remplace `cellules` pour ces douze planches :
  étiquetage, colonne par gouttière verticale, séparation d'une composante qui
  en vaut deux, braises rattachées à leur emblème, tri par colonne puis ligne de
  sol, et masque de la composante REMPLIE.
- Le module écrit `art/sprites/carte/emblemes-mesures.json` — colonne, rangée,
  largeur, hauteur et ligne de sol de chacune des 108 cellules, la référence de
  chaque famille, et la liste des coupes. **Node ne peut pas lire les planches**,
  et surtout ces grandeurs sont des DÉCISIONS de l'outil, pas des propriétés
  d'une image. Même motif que `bord-empreintes.json` et `atlas-empreintes.json`.

---

## 10. Écarts au brief, et ce qui reste

**Écarts, tous déclarés :**

1. ⚠ **La falsification n° 4 du brief ne mord pas.** « Trier par le haut mélange
   les rangées » est FAUX une fois le groupement par colonne en place — mesuré
   sur les douze planches. C'est le groupement qui corrige. Voir §5.
2. ⚠ **`EMB T3` ne mesure pas ce que le brief demandait, il mesure mieux.** Le
   rapport `n1/n9` est biaisé jusqu'à 5,5 % par l'érosion, qui coûte une largeur
   ABSOLUE ; le test mesure l'affinité, résidu 2,0 px ± 0,51 sur 108.
3. ⚠ **`EMB T5` tolère 4 px, pas 2.** Le résidu est dans l'ART — les planches
   abîmées de `site_base_j` sont dessinées 3 % plus étroites que la saine — et la
   chaîne ne peut pas le rattraper sans casser la propriété que le test défend.
   Trois familles sur quatre tiennent à 2 px, et la seconde moitié du test mesure
   que la chaîne n'ajoute rien au-delà de la source.
4. ⚠ **La borne T10 est relevée sans la mesure sur appareil qu'elle exige.**
   Voir §6 : mesurée dans Chromium à la place, déclarée comme telle.
5. ⚠ **`AUDIT-REPARATION.md` n'existe toujours pas au dépôt** — le brief le cite
   en hors-lot, comme les deux briefs précédents. Signalé une troisième fois pour
   que la référence ne se propage pas.

**Ce qui revient à Ethan :**

- ⚠⚠ **LA RÉPARATION DES BÂTIMENTS DU JOUEUR**, et c'est la dépendance d'ordre du
  §4 du brief : elle n'existe pas sur `main`, donc un emblème du joueur passé au
  feu y reste définitivement. Ethan a dit s'en occuper le 05/09 ; ce lot la rend
  **visible** sans la corriger, comme le brief le demande.
- **Sa propre base rétrécit** — 86 → 36 px au niveau 1. C'est la demande prise au
  mot ; une ligne à retourner s'il veut une exception.
- **La borne à 7 300 000**, et la mesure de démarrage sur son appareil.
- **Le seuil de `SEUIL_COMPOSANTE`**, à 500 px : il ne calibre rien aujourd'hui —
  facteur 52 entre les deux populations — mais c'est un nombre, et il se change
  seul.
- **Les emblèmes de site n'ont toujours pas de halo de propriété**, que
  `INVENTAIRE-SPRITES.md` §6.2 décrit ; ce n'est pas ce lot qui l'invente.
