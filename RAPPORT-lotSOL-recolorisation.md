# RAPPORT-lotSOL-recolorisation.md — Foyer Zéro, 27/08/2026 (nuit)

Objet : les huit tuiles de sol du lot 1, P1.1 et P1.2. **Livrées sans passer par
une génération de planche.** Le prompt de sol produisait une plaque plate ; le
lot a été fermé par recolorisation d'un jet libre fourni par Ethan, puis par
recolorisation du résultat pour l'Ouvrage.

**Décision d'Ethan, prise sur pièce : grille 32.**

---

## 1. Ce que le fichier source était, mesuré

`56489_palette_terre_cuite.png`, 1536 × 1536.

| | Mesure |
|---|---|
| Gros pixel | **24 px, partout** — 63 frontières par axe, pas constant, aucun bloc partiel |
| Grille logique | **64 × 64** |
| Blocs unis | **oui, les 4 096** |
| Couleurs | **exactement 5**, les cinq de la rampe terre cuite validée |
| Clarté | L\* 58,1 → 78,1 — la bande de `RAPPORT-S1-terrain.md` §3, au ton près |

Aucune couleur hors rampe, aucun anticrénelage. En palette, il n'y avait rien à
corriger.

## 2. Pourquoi les six jets précédents étaient moches

La clause `CE QUE LE SOL DOIT ÊTRE : presque uni. #CF9A83 occupe au moins 80 %`.

Un ton à 80 % sur 32 gros pixels, vu à 40–46 px CSS, est une plaque plate ; le
« semis discret » qu'on lui ajoute reste un semis sur une plaque. Le jet gardé n'a
**aucun ton dominant** — le plus présent est à 32 %, le sol nu à 23 %. Ce n'est
pas une question de propreté du jet, c'est la cible qui était fausse. La clause a
été retournée dans `PROMPTS-sol-de-base.md` §1 et §2.

Deuxième clause tombée : **l'anneau extérieur de 2 gros pixels uni**. Mesuré sur
un pavage 9 × 18 avec rotations, l'écart moyen entre deux gros pixels voisins vaut
**41,4 à l'intérieur d'une tuile et 51,9 au passage d'une case** — ratio 1,25,
invisible. Une texture dense et stationnaire se recolle par ses statistiques ; la
règle de l'anneau servait à raccorder des tuiles à structure et n'a pas d'objet
ici.

## 3. Lisibilité — le contrôle qui avait tué le premier jet

Sol L\* moyen **67,1**, écart-type 6,2.

| Sujet | L\* moyen | Écart au sol |
|---|---|---|
| `ref_meute` (escouade joueur) | 37,8 | **29,3** |
| `ref_marcheur` (Ouvrage) | 26,5 | **40,5** |
| `ref_pylone` (Ouvrage) | 27,7 | **39,3** |

Le bruit interne du sol tient sur 20 points de L\*, l'écart sol → entité en vaut
29 à 41. **Le bruit du fond est six fois plus faible que le contraste qu'il doit
laisser passer** : c'est la raison mesurée pour laquelle une texture dense ne
camoufle rien ici, et elle ne vaut que tant que les cinq tons restent au-dessus
de L\* 58.

Contrôle des quatre combinaisons, §7.2 des prompts : `essai/quatre-combinaisons.png`.

## 4. La grille — 64 réduit en 32

Le fichier source était en grille 64. Deux réductions ont été essayées :

| Méthode | L\* moyen | Effet |
|---|---|---|
| Majorité sur chaque bloc 2 × 2 | 65,69 | assombrit de 1,4, durcit le grain |
| **Moyenne des 4 puis requantification sur la rampe** | **66,95** | garde la clarté à 0,1 près, recentre sur le sol nu |

C'est la seconde qui est livrée. Répartition obtenue :
`#CF9A83` 35 % · `#C38C73` 32 % · `#D7A995` 21 % · `#B87E64` 8 % · `#E0B9A8` 3 %.

Le fichier livré fait 128 × 128 dans les deux grilles ; seul le pas du gros pixel
change. En 32 il vaut 4 px, ce que le reste du projet emploie.

## 5. Le sol de l'Ouvrage — recolorisation, et une rampe corrigée

Produit par substitution rang par rang sur la même texture. Deux conséquences
gratuites : les deux sols ont exactement la même structure de grain, et le
contrôle « même clarté d'ensemble » devient structurel au lieu d'être espéré.

⚠ **La rampe cendre de `PROMPTS-sol-de-base.md` §0 était 3,8 L\* trop claire.**

| Rang | Cendre du prompt | L\* | **Cendre livrée** | L\* | Terre cuite | L\* |
|---|---|---|---|---|---|---|
| creux | `#9892AE` | 61,9 | **`#8E88A4`** | 58,1 | `#B87E64` | 58,1 |
| ombre | `#A6A0B9` | 67,1 | **`#9B95AE`** | 62,9 | `#C38C73` | 63,0 |
| sol nu | `#B3AEC4` | 72,1 | **`#A8A3B9`** | 68,0 | `#CF9A83` | 68,0 |
| clair | `#BDB9CB` | 76,0 | **`#B5B1C2`** | 73,0 | `#D7A995` | 72,9 |
| poussière | `#CAC7D4` | 80,8 | **`#C2BFCC`** | 77,9 | `#E0B9A8` | 78,1 |

La correction a été calculée en Lab : L\* recopié rang par rang depuis la terre
cuite, **a\* et b\* de la cendre conservés** — l'écart de teinte introduit vaut au
plus 0,4 sur a\* et b\*. Un sol plus clair de 3,8 L\* aurait rendu les défenses de
l'Ouvrage plus visibles sur sa propre base que les unités du joueur sur la
sienne : un avantage que personne n'a décidé.

Écarts de la nouvelle rampe au reste de la palette : kaki 34,2 · accents 21,6 ·
sol du joueur 21,5 · ardoise 18,4 · métal 15,0. Aucune collision.

⚠ **Une seule collision, connue et sans effet aujourd'hui : le quartz est à ΔE 7
de la poussière de cendre** (`#C1CEDA` contre `#C2BFCC`). Vérifié dans les
sources : `champs.js` n'est importé que par `state.js` et `disposition.js`, la
base du joueur — les champs ne se posent jamais sur un sol d'Ouvrage, où l'écart
vaut ΔE 26 sur terre cuite. Le jour où un champ y apparaîtrait, il lui faudrait
un ton propre.

## 6. Les quatre variantes — dérivées, pas générées

Le fichier source est **une seule tuile**. Les quatre variantes de chaque camp
sont obtenues par **décalage torique** : mêmes statistiques, même palette, motif
cassé. Décalages employés, joueur `(0,0) (15,8) (4,20) (22,14)`, Ouvrage
`(0,0) (9,25) (19,3) (27,17)` — **différents d'un camp à l'autre**, pour que les
deux sols ne portent pas le même motif à teinte près.

Le décalage crée une discontinuité interne de même nature que celle qui existe
déjà à chaque bord de case, donc du même ordre que le ratio 1,25 du §2 : rien de
visible sur les deux pavages 9 × 18 de `essai/`.

⚠ C'est une dérivation. Si de vraies variantes deviennent souhaitables, la voie
propre ne coûte pas une génération : **recoloriser les trois autres quadrants de
la planche 56489**, qui en contenait quatre.

## 7. Vérification des fichiers livrés

Huit fichiers, `sprites/terrain/`, contrôlés un par un après écriture :

| Contrôle | Résultat |
|---|---|
| Taille | 128 × 128, les huit |
| Couleurs | 5 exactement, les huit |
| Toutes dans la rampe du camp | oui, les huit |
| Pas du gros pixel | 4 px, les huit |

Aucun n'est passé par `tools/conditionneur.html` : il n'a pas de palette *Sol*.
Le conditionnement a été fait en Python. C'est un écart au protocole du §0 du
plan, et il est assumé — l'outil aurait fait moins bien, il ne sait pas
rééchantillonner de 64 à 32.

## 8. Ce qui reste ouvert

1. **P1.3, P1.4, P1.5** — champs et obstacles, 10 fichiers, 3 générations. Les
   prompts sont en service et inchangés.
2. **La palette *Sol* du conditionneur**, toujours absente. Elle passera par un
   brief Claude Code avec les trois défauts déjà relevés.
3. **Les champs et les obstacles restent en grille 32**, comme le sol : plus
   aucun mélange de finesse à l'écran.
4. **Les 1024 sources.** Le fichier fourni par Ethan est le seul état source des
   huit tuiles : à archiver dans `art/sources/` — amendement A9, toujours pas
   écrit dans l'inventaire.
