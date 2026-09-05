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
