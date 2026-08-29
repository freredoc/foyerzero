# RAPPORT — lot 4, socles de tourelle et leurs connexions

**29/08/2026.** 72 fichiers dans `art/sprites/socle/{128,64,32}` : 3 socles ×
4 états × 2 camps. S'ajoutent aux 36 du lot 3, total 108 fichiers dans ce
dossier. Aucun fichier de `src/` ni `test/` touché.

---

## 1. ⚠ Correction d'une erreur du rapport du lot 3

Le §3 du lot 3 décrivait dans ces planches « une pièce LARGE de 341 px, rapport
2,3 » au centre de chaque rangée. **Elle n'existe pas.**

Les bandes réellement occupées vont de **159 à 388, 397 à 622 et 630 à 860**,
quand la coupe en tiers tombe à **341 et 682** — soit deux fois dans la matière.
La « pièce large » était la colonne de gauche débordant dans la suivante, et les
douze cellules sortaient tronquées. C'est le même mécanisme que
`P6_4_flux_joueur` au lot 0 : une grille régulière supposée, une coupe qui tombe
dans le dessin.

`tools/socles.py` a été corrigé pour ne plus porter cette affirmation.

Coupe correcte, par gouttière : **x = 392 et 626** côté joueur, **385 et 630**
côté Ouvrage. Une fois faite, la structure est nette : trois colonnes de largeur
égale, quatre rangées.

## 2. L'ordre des quatre états, mesuré

Ethan a arbitré que les murs ne se raccordent qu'à l'est et à l'ouest, d'où
quatre états. Reste à savoir quelle rangée est laquelle. L'asymétrie du contenu
autour du pivot le dit — écart entre la portée à droite et la portée à gauche :

| Rangée | Largeur | D − G | Lecture |
|---|---:|---:|---|
| 0 | **174 px**, le plus étroit | +13 | symétrique → **isolé** |
| 1 | 211 px | **+49** | déborde à droite → **est** |
| 2 | 212 px | **−24** | déborde à gauche → **ouest** |
| 3 | **229 px**, le plus large | +10 | symétrique → **traversant** |

Le profil se retrouve à l'identique côté Ouvrage — 184 / 201 (+42) / 194 (−39) /
217 (symétrique) — et sur les trois colonnes de chaque planche, soit **six
séries indépendantes qui donnent le même ordre**.

Vérifié à l'œil sur la planche de contrôle : `isole` est un socle nu, `est`
porte une amorce à droite, `ouest` à gauche, `traversant` des deux côtés.

Les trois colonnes ne diffèrent que par l'accent — blanc, rouge, jaune — donc
casemate, créneau, batterie. Les artilleries n'ont pas de variante de connexion.

## 3. Ce que ça règle du lot 1

Le §3 du rapport du lot 1 signalait que les deux planches de merlons semblaient
étiquetées différemment. Vérification faite :

- **La coupe des merlons est bonne.** Les gouttières tombent à 480–505 côté
  joueur et 464–498 côté Ouvrage, la coupe naïve à 512 passe dedans. Pas de
  troncature.
- **`merlons_o` suit l'ordre isolé / est / ouest / traversant**, et le profil est
  parfait : 377 px symétrique, puis 445 à **+262** vers la droite, puis 426 à
  **−71** vers la gauche, puis 494 le plus large et symétrique.
- **`merlons_j` ne suit aucun ordre lisible** : 407 (+102), 445 (−48), 444
  (−139), 481 (+100). Le plus étroit déborde à droite, ce qui exclut qu'il soit
  l'état isolé.

Donc **les quatre merlons du joueur produits au lot 1 sont probablement mal
nommés**, et ceux de l'Ouvrage sont bons. À trancher à l'œil sur la planche.

## 4. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **72**, plus les 36 du lot 3 |
| Dimensions | 128×128, 64×64, 32×32 |
| Couleurs hors palette | **0** sur 108 |
| Occupation en 32 | 35,1 % de moyenne, 17,3 % au minimum |
| Grille détectée | assertion `3 × 4` dans le script, pas une hypothèse tacite |
| Ordre des états | confirmé par 6 séries indépendantes, puis à l'œil |

## 5. Reste ouvert

1. **Les merlons du joueur** (§3) — l'ordre des quatre cellules ne se lit pas.
2. **`socle_*_isole` contre les socles du lot 3** — les planches `M1` et `M3`
   donnent les mêmes trois socles sans connexion. Redondance probable avec
   l'état `isolé` ; à comparer, et à supprimer d'un côté ou de l'autre.
3. **La superposition socle + tourelle** n'est toujours pas vérifiée.
