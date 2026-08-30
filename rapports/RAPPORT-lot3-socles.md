# RAPPORT — lot 3, socles des défenses

**29/08/2026.** 36 fichiers dans `art/sprites/socle/{128,64,32}` : 12 socles,
un par défense à tourelle. Aucun fichier de `src/` ni `test/` touché.

---

## 1. Ce que contiennent réellement les planches — l'inventaire avait tort

L'inventaire v5 §5.4 proposait « 3 types de socle × 4 états de connexion = 24 ».
**C'est faux**, et la mesure le montre.

Il y a **six** planches de socles, pas deux :

| Planche | Grille | Contenu mesuré |
|---|---|---|
| `M1_socles_j_tourelles_3` | 3 × 1 | 3 socles carrés, rapport 1,18 |
| `M2_socles_j_artilleries_3` | 3 × 1 | 3 socles hauts, rapport 0,72 |
| `M3_socles_o_tourelles_3` | 3 × 1 | idem, camp Ouvrage |
| `M4_socles_o_artilleries_3` | 3 × 1 | idem, camp Ouvrage |
| `socles_j_tourelles_connexions_3x4` | 3 × 4 | autre chose, voir §3 |
| `socles_o_tourelles_connexions_3x4` | 3 × 4 | autre chose, voir §3 |

Les quatre planches `M` donnent **douze socles**, ce qui recoupe exactement les
douze tourelles du lot 1 : un socle par défense à tourelle.

## 2. L'attribution, mesurée

Deux mesures suffisent, les mêmes que pour les tourelles :

- **L'accent donne la cible.** Sur `M1` : cellule 0 à 9,7 % de blanc et 0 % de
  rouge, cellule 1 à 18,4 % de rouge, cellule 2 à 23,6 % de jaune. Soit
  infanterie, véhicule, aviation.
- **La forme donne la portée.** `M1` et `M3` ont un rapport largeur/hauteur de
  1,18 — carrés. `M2` et `M4` sont à 0,72 — hauts. Et leur nom dit
  « artilleries », ce qui recoupe la portée 5,5.

| Planche | Socles |
|---|---|
| M1 | casemate · créneau · batterie, joueur |
| M2 | faucheuse · mortier · harpon, joueur |
| M3 | casemate · créneau · batterie, Ouvrage |
| M4 | faucheuse · mortier · harpon, Ouvrage |

Vérifié à l'œil sur la planche de contrôle en 64 : les cadres rouges tombent sur
les créneau et mortier, les cadres jaunes sur les batterie et harpon.

## 3. ⚠ Les deux planches de connexions ne sont pas traitées

Leurs 12 cellules ne sont pas 12 socles. Mesuré, ce sont **quatre rangées
identiques de trois pièces** :

| Colonne | Forme | Accent |
|---|---|---|
| 0 | carré, ~170 px | blanc, 6,5 à 8,8 % |
| 1 | **LARGE, 341 px, rapport 2,3** | rouge, 10,8 à 14,6 % |
| 2 | carré, ~165 px | jaune, 22,1 à 25,6 % |

La colonne 1 fait exactement la largeur de la cellule : c'est une pièce qui
traverse la tuile de bord à bord, donc une **liaison est-ouest**, ce qui recoupe
l'arbitrage du 28/08 sur les murs.

Les quatre rangées, elles, ne diffèrent que par la hauteur — 148, 150, 150,
143 px — et de deux points d'accent. **Rien dans l'image ne dit ce qu'elles
représentent.** Quatre états de connexion ? Quatre niveaux ? Quatre variantes ?
Je ne produis rien tant que ce n'est pas dit.

## 4. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **36** |
| Dimensions | 128×128, 64×64, 32×32 |
| Couleurs hors palette | **0** |
| Occupation en 32 | 39,4 % de moyenne, 18,9 % au minimum |
| Attribution vérifiée à l'œil | ✔ accents rouges et jaunes à leur place |

## 5. Reste ouvert

1. **Les 24 cellules des deux planches de connexions** (§3) — que sont les
   quatre rangées ?
2. **L'emprise de 28 gros pixels** a été reprise des gros bâtiments faute
   d'instruction. Si les socles doivent affleurer la tuile, c'est 32.
3. **La superposition socle + tourelle n'a pas été vérifiée** : les deux
   viennent de planches différentes, rien ne garantit que le diamètre de la
   tourelle du lot 1 tombe dans le logement du socle. À contrôler par
   composition avant de considérer les deux lots clos.
