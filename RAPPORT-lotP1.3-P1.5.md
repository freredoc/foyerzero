# RAPPORT-lotP1.3-P1.5.md — Foyer Zéro, 27/08/2026 (nuit)

Les dix éléments posés du lot 1 : deux champs, trois obstacles, deux variantes
chacun. **Livrés, conformes, S1 close.**

Méthode : prompts de trois ou quatre lignes, **un sujet par image**, jets bruts en 1254 px
sans contrainte de palette ni de grille, puis conditionnement en Python. Aucun
prompt ne portait de code couleur.

---

## 1. Ce qui a été retenu, et ce qui a été écarté

| Reçu | Retenu | Motif |
|---|---|---|
| 10 jets bruts, première série | **les 10** | — |
| 4 champs « corrigés compacts » | aucun | **aucun ne touche les bords** : 0 pixel de contact sur les quatre côtés. Deux cases voisines auraient donné deux taches |
| 4 sprites de validation antérieurs | aucun | eau au lieu du pétrole, contour en tons de sol, champ sans raccord |

Les fichiers nommés `..._ancien_connecte` sont ceux qui touchent les bords : ce
sont eux qui sont bons. Le mot « ancien » est trompeur, le raccord est la
condition qui compte.

## 2. Les champs — le raccord est ANNULÉ

⚠ **Décision d'Ethan, 27/08 au soir : plus de raccord pour le quartz ni pour la
scorie.** Les deux champs sont des sujets isolés, marge de 2 gros pixels comme
les obstacles, et deux cases voisines montrent **deux gisements distincts**, pas
un seul étendu. C'est un choix de lecture : une case, un gisement.

Les quatre fichiers livrés viennent de deux jets neufs — un bouquet de cristaux
pour le quartz, une masse de scories veinée de braises. Les variantes `b` sont
les mêmes retournées horizontalement ; un vrai second jet par sujet les
remplacerait sans rien changer d'autre.

Le quartz reçoit `#3E454C` · `#9FB3C5` · `#C1CEDA`, la scorie `#382E47` ·
`#4E4160` · **`#F5B636`** pour les braises.

⚠ **`#F5B636` est une couleur d'accent** — la seule du décor. Si le combat s'en
sert pour le feu ou les chiffres de dégâts, les deux se disputeront l'œil. Une
version braises éteintes, corps noir `#1E2124`, existe et se substitue en une
ligne.

### Ce qui a été essayé avant, et qui ne sert plus



Un disque posé dans un carré ne touche chaque bord qu'en un point : trois cases
voisines donnaient un chapelet de perles. La correction est géométrique, pas
graphique — **le sujet est surdimensionné jusqu'à ce que la corde de contact
atteigne la moitié du bord**, ce que le débordement du disque produit
naturellement tout en laissant les angles vides.

| Fichier | Surdimension | Contact h/b/g/d, sur 32 | Angles 3 × 3 |
|---|---|---|---|
| `champ_quartz_a` | ×1,15 | 14 · 17 · 16 · 15 | vides |
| `champ_quartz_b` | ×1,35 | 13 · 16 · 20 · 11 | vides |
| `champ_scorie_a` | ×1,10 | 13 · 12 · 14 · 13 | vides |
| `champ_scorie_b` | ×1,10 | 14 · 15 · 14 · 15 | vides |

Vérifié à l'œil sur trois cases en ligne **et sur un triplet coudé**, les deux
formes que `CHAMPS.taillesBloc` autorise : `essai/controle-sur-le-sol.png`.

## 3. Recolorisation

Les niveaux de gris de chaque jet sont regroupés par k-moyennes sur L\*, puis
associés dans l'ordre à la rampe du sujet. Aucun ton n'a été choisi à la main
image par image.

| Sujet | Rampe appliquée |
|---|---|
| `champ_quartz` | `#3E454C` · `#9FB3C5` · `#C1CEDA` |
| `champ_scorie` | `#382E47` · `#4E4160` · `#6B5B80` |
| `obs_infanterie` | `#231D2E` · `#5B4133` |
| `obs_vehicule` | `#1E2124` seul — la nappe est strictement plate |
| `obs_les_deux` | `#1E2124` · `#3E454C` · `#68727E` |

⚠ **Deux écarts à la fiche, tous deux assumés et réversibles.**

1. **La scorie est montée d'un cran dans la rampe ardoise.** Peinte sur
   `#231D2E`/`#382E47` comme la fiche le laissait entendre, elle devenait
   quasi noire et se confondait avec la nappe de pétrole à distance. Montée sur
   `#382E47`/`#4E4160`/`#6B5B80`, elle lit violet et se sépare franchement.
   Comparaison faite sur pièce, les deux versions côte à côte avec le pétrole en
   regard.
2. **Le quartz reçoit `#3E454C`** pour les creux entre éclats : la fiche ne lui
   donnait que deux tons, et un affleurement à deux tons n'a pas de relief. Le
   ton est celui du métal, pas celui de la scorie — les deux ressources restent
   distinctes.

## 4. Contrôles

| Contrôle | Résultat |
|---|---|
| Taille | 128 × 128, les dix |
| Gros pixel | 4 px — grille 32, les dix |
| Tons hors rampe du sujet | **aucun**, les dix |
| **Ton de sol sur un contour** | **aucun**, les dix — la règle de silhouette tient |
| Emprise des obstacles | 24 à 28 gros pixels, marge ≥ 2 sur les quatre bords |
| Champs : angles vides | oui, les quatre |
| Trois obstacles distinguables | oui, vérifié sur les **deux** sols : `essai/obstacles-sur-les-deux-sols.png` |

## 5. Ce que cette session apprend sur la méthode

**La planche a échoué et le prompt court a gagné.** Le lot 1 devait coûter 5
générations en planches 2 × 2 ; il en a coûté 11, une par fichier. Le rendement
par génération est deux fois pire — et c'est le premier lot qui passe sans
reprise. Les prompts longs, avec palette, interdits et clauses de contrat,
produisaient des sujets qui échouaient sur ce qu'ils ne disaient pas ; les
prompts de quatre lignes ne disent que le sujet, la forme et le raccord, et tout
le reste se rattrape après coup.

Conséquence pour la suite : le tableau du §1 du plan est probablement optimiste
partout. Il n'a pas été refait — il sera corrigé session par session, sur mesure.

## 6. Ce qui reste

- **S1 est close.** 18 fichiers, aucun défaut ouvert.
- Les jets bruts des dix éléments et la source du sol sont dans `art/sources/`
  — l'amendement A9 est appliqué en fait, il reste à l'écrire dans l'inventaire.
- `PROMPTS-sol-de-base.md` décrit une méthode qui n'a servi à rien dans ce lot.
  À conserver comme trace, à ne pas rouvrir pour S2.
- Prochaine session : **S2, unités du joueur, 14 sprites** — et il faudra
  trancher d'entrée si elle part en planches ou en prompts courts.
