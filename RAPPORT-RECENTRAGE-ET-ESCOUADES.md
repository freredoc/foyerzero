# RAPPORT — recentrage des tourelles, escouades des deux camps

Trois chantiers, tous mesurés contre les outils du dépôt mergé.

---

## 1. Les onze tourelles de l'Ouvrage sont recentrées — onze contrôles verts

`tools/joueur_v2.py` conditionne les tourelles en mode `carre` : aucun recadrage,
la planche EST le sprite. Deux conditions, et les onze planches de l'Ouvrage en
manquaient les deux — pivot 14 à 147 px sous le centre, et quatre carrés de
rotation plus grands que leur toile.

**Le script ne fait qu'une translation.** Le sujet est recopié tel quel dans une
toile carrée remplie de la couleur de fond lue sur l'original. Aucun
rééchantillonnage. Trois contrôles par pièce, tous verts sur les onze :

| | Toile | Carré | Reste au centre |
|---|---|---|---|
| `def_o_casemate` | 1024 → **838** | 834 | 0,5 px |
| `def_o_creneau` | 1024 → **1110** | 1106 | 0 |
| `def_o_batterie` | 1024 → **936** | 932 | 0 |
| `def_o_faucheuse` | 1024 → **1224** | 1220 | 0,5 px |
| `def_o_mortier` | 1024 → **1164** | 1160 | 0 |
| `def_o_harpon` | 1024 → **1046** | 1042 | 0,5 px |
| `off_o_ratisseur_tourelle` | 1024 → 506 | 502 | 0 |
| `off_o_fendeur_tourelle` | 1024 → 736 | 732 | 0 |
| `off_o_broyeur_tourelle` | 1024 → 768 | 764 | 0 |
| `off_o_belier_tourelle` | 1254 → 704 | 700 | 0 |
| `off_o_pilon_tourelle` | 1024 → 652 | 648 | 0 |

Le pivot est celui du dépôt, importé de `tools/ancres-defense.py` : première
ligne de la bande où la silhouette atteint 98 % de sa largeur, c'est-à-dire le
centre de la face supérieure de l'embase. Ce n'est **pas** le centre de la boîte
du corps que j'avais utilisé au lot blindés — il tombe un demi-cylindre plus bas.

Contrôle de conservation : même nombre de pixels de sujet et même somme des
canaux avant et après, sur les onze. Le reste au centre vaut 0 ou 0,5 px, la
moitié d'un pixel source, soit 0,02 px à la taille du jeu.

⚠ **Une conséquence à traiter au lot suivant.** `src/data/ancres-blindes.js`
montre que le rendu ne pose pas la tourelle à l'échelle 1 : le côté du carré
vaut `largeur_de_la_pièce × diametre_pct × cote_pct_embase × echelle`, donc
**l'embase est mise à la taille du logement**. Mon `ancres-blindes-ouvrage.json`
mesure le disque lisse INTÉRIEUR du logement — 119 px sur une coque de 761 pour
le Bélier, soit 15,6 %, quand le dépôt mesure l'anneau entier et trouve 37,5 %
sur la coque du Pionnier. Les ancres de l'Ouvrage sont donc à refaire avec
`tools/chassis.py:ancre`, pas avec mon détecteur. C'est mécanique maintenant que
les sources sont centrées, mais ce n'est pas fait.

---

## 2. Escouades — un défaut de mon outil, trouvé par le joueur

Le Guetteur du joueur a **trois rangées** : une figure en haut, deux au milieu,
deux en bas, et les deux rangées n'ont pas le même écart horizontal. Mon
recoupage moyennait l'écart vertical sur toute la planche — ça marche sur un
quinconce à deux rangées, et ça collait la figure du milieu dans celle du haut
dès la troisième. Mesuré : **1 688 pixels recouverts** sur la Meute du joueur
recoupée à cinq.

Corrigé : les rangées se regroupent, chacune garde SA hauteur, et la symétrie ne
joue qu'à l'intérieur d'une rangée. **Zéro pixel recouvert** sur les six pièces
recoupées.

⚠ **Meute et Perceurs de l'Ouvrage sont réémis** : la toile passe de 951 à 957
et de 838 à 843. L'ancienne version donnait le même écart aux deux rangées du
quinconce (0,655) là où elles valent 0,647 et 0,663. Ce n'est pas une
régression, c'est l'ancien qui était approximatif.

**Côté joueur** — formations lues sur les planches du dépôt, jamais inventées :

- `off_j_meute` et `off_j_meute_def` : 3 → **5 figures**, formation du Guetteur
- `off_j_guetteur` et `off_j_guetteur_def` : 5 → **3 figures**, formation de la Meute

**Côté Ouvrage** — `off_o_carapace` et `off_o_carapace_def` : 5 → **2 figures**,
formation lue sur `off_j_carapace` du dépôt, écart 0,558 largeur, aucun écart
vertical.

Les toiles du joueur restent sur **fond magenta** : la couleur de remplissage
est lue sur l'entrée, pas écrite en dur. Remplir de vert aurait changé la clé de
détourage de quatre planches du joueur au passage d'un recoupage.

---

## 3. Planche d'échelles

Les ±10 % sont retirés partout sauf le Frappeur (×0,90) et les trois artilleries
de défense (×1,10, soit 37 px de socle au lieu de 34). Les emprises sont lues
dans `tools/joueur_v2.py`.

---

## 4. Reste ouvert

- les ancres de l'Ouvrage, à refaire avec `tools/chassis.py:ancre` — §1
- le bloc rose du Merlon, non traité
