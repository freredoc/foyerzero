# RAPPORT — blindés de l'Ouvrage, v2

Quatorze jets, quatorze pièces : neuf coques et cinq tourelles. **Le lot répond
lui-même à la question du comptage** — 5 coques d'attaque + 4 coques de défense
+ 5 tourelles, exactement les 14 pièces du miroir joueur. Les unités de
l'Ouvrage sont donc à 27, pas 22, et le camp est complet.

---

## 1. Ce que les jets confirment

Tu as nommé les fichiers, je n'ai eu qu'à vérifier — et les trois contrôles
passent.

**L'accent suit `combat.js` sans exception.** Ratisseur `antiInfanterie` en
blanc (0,4 % de pixels saturés, l'accent blanc n'est pas une couleur saturée),
Fendeur et Broyeur `antiVehicule` en rouge (94 à 97 % des saturés), Bélier et
Pilon `antiStructure` en jaune (91 à 98 %). Aucune pièce ne porte deux accents.

**Le Pilon n'a pas de pose de flanc, et c'est juste.** `pilon.defense.present`
vaut `false` : l'Obusier ne tient jamais de garnison. Neuf coques, pas dix.

**Chaque coque porte un logement rond**, y compris en pose de flanc.

---

## 2. Les deux ancres, mesurées

| Pièce | Logement (x, y) | ø | Rondeur |
|---|---|---|---|
| `off_o_ratisseur_chassis` | 511,2 · 330,1 | 112 | 0,97 |
| `off_o_ratisseur_chassis_def` | 553,2 · 452,0 | 107 | 0,98 |
| `off_o_fendeur_chassis` | 511,7 · 438,2 | 128 | 0,99 |
| `off_o_fendeur_chassis_def` | 511,2 · 467,4 | 126 | 0,99 |
| `off_o_broyeur_chassis` | 511,4 · 440,6 | 130 | 0,99 |
| `off_o_broyeur_chassis_def` | 506,1 · 476,2 | 129 | 0,99 |
| `off_o_belier_chassis` | 511,8 · 469,4 | 119 | 0,99 |
| `off_o_belier_chassis_def` | 487,3 · 484,1 | 117 | 0,99 |
| `off_o_pilon_chassis` | 511,6 · 426,1 | 106 | 0,99 |

| Tourelle | Pivot (x, y) | Corps |
|---|---|---|
| `off_o_ratisseur_tourelle` | 511,5 · 552,5 | 302 × 252 |
| `off_o_fendeur_tourelle` | 511,5 · 631,5 | 296 × 250 |
| `off_o_broyeur_tourelle` | 511,5 · 592,5 | 380 × 350 |
| `off_o_belier_tourelle` | 511,0 · 487,0 | 309 × 365 |
| `off_o_pilon_tourelle` | 511,5 · 607,0 | 414 × 197 |

Tout est dans `art/sources/ancres-blindes-ouvrage.json`, relisible par le lot de
câblage.

⚠ **Le pivot n'est pas le centre de la boîte.** Le canon tire la boîte vers le
haut, et de façon très inégale : le Pilon a un corps de 197 px de haut pour une
image de 520, le Broyeur 350 pour 595. Prendre le centre de la boîte aurait
posé la tourelle du Pilon 160 px trop haut dans son logement. Le pivot est donc
le centre de la boîte du CORPS — les rangées dont la largeur dépasse la moitié
de la largeur maximale.

⚠ **Le logement se détecte par la platitude**, pas par la couleur. Un critère
de noirceur a été ajouté en garde-fou : mesuré, il ne change aucun des neuf
résultats, et il ne faut donc pas lui attribuer une correction qu'il n'a pas
faite. Il est là parce que les grandes plaques blanches du Ratisseur sont plates
elles aussi et pourraient un jour gagner en surface.

---

## 3. Le montage, qui est le seul vrai contrôle

Les deux ancres peuvent être justes chacune de leur côté et le montage faux. La
planche assemble donc pour de vrai : canon au nord sur la pose d'attaque, à 45°,
puis à l'est sur la pose de flanc.

**Échelle 1 : 1, et ça tombe juste.** Coques et tourelles sont dessinées dans le
même cadre sous la même vue ; la tourelle est déjà à sa taille. Aucun facteur
n'est appliqué et l'assise est bonne sur les cinq — voir l'aperçu en grand.

**La rotation se fait autour du pivot, pas du centre de l'image.** Une rotation
autour du centre laisserait la tourelle en place à 0° et la ferait glisser hors
du logement à mesure qu'elle tourne : le défaut serait invisible sur la seule
pose qu'on regarde d'habitude. La colonne à 45° est là pour ça.

**Un point à décider, pas à corriger.** La tourelle fait de 31 % (Ratisseur) à
43 % (Pilon) de la largeur de sa coque, soit 12 à 17 px une fois à 40. C'est
lisible en grand et discret dans le jeu. Si tu veux que la tourelle distingue
les blindés d'un coup d'œil, c'est le même arbitrage que les canons
d'artillerie : un facteur, pas un redessin.

---

## 4. Un nom à confirmer

Les tourelles sont livrées en `off_o_<cle>_tourelle.png`. **C'est une
supposition** : le lot joueur, non mergé, a nommé son sprite unique de tourelle,
et je n'ai pas ce nom sous les yeux. Si le joueur dit autrement, renomme les
cinq — c'est un `mv`.

Au câblage, les seize orientations v1 (`off_o_<cle>_n.png` … `_nno.png`, seize
par blindé) disparaissent avec les cinq monolithes. C'est le gros du gain de
l'atlas.

---

## 5. Ce qui reste

**Les unités de l'Ouvrage sont complètes** : 9 escouades + 4 aéronefs + 14
blindés = 27, plus 15 défenses. Il ne reste que les 34 bâtiments.

**L'emprise n'est toujours pas appliquée**, même arbitrage ouvert depuis les
aéronefs.

**Rien n'est câblé.** Quatorze sources, pas quatorze sprites.

---

## 6. Contenu de l'archive

```
art/sources/off_o_{ratisseur,fendeur,broyeur,belier,pilon}_chassis.png
art/sources/off_o_{ratisseur,fendeur,broyeur,belier}_chassis_def.png
art/sources/off_o_{ratisseur,fendeur,broyeur,belier,pilon}_tourelle.png
art/sources/ancres-blindes-ouvrage.json
art/essai/PLANCHE-blindes-ouvrage-40.png
tools/fond-vert-ouvrage.py            table `blindes` ajoutée, remplace la précédente
tools/ancres-blindes-ouvrage.py
tools/montage-blindes-ouvrage.py
```
