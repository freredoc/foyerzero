# RAPPORT — lot 6, emblèmes de carte, POI et grosses bases

**29/08/2026.** 135 fichiers dans `art/sprites/carte/{128,64,32}` : 36 emblèmes
de site, 7 points d'intérêt, 2 grosses bases de l'Ouvrage. Aucun fichier de
`src/` ni `test/` touché.

---

## 1. L'arbitrage v1 contre v2, tranché par la mesure

Les neuf niveaux de chaque planche ont été conditionnés en 64, puis comptés en
**morceaux détachés** — le nombre de composantes connexes pesant plus de 10 % de
la plus grosse. C'est ce qui distingue une base d'un tas de débris.

| Planche | Morceaux par cellule | Occupation en 64 | Progression n1 → n9 |
|---|---:|---:|---:|
| base joueur | **1,0** | 53,2 % | +38 % |
| camps quartz | **1,0** | 47,7 % | +55 % |
| camps scories | **1,0** | 49,6 % | −5 % |
| base Ouvrage **v1** | **10,4** | 31,2 % | −4 % |
| base Ouvrage **v2** | **2,8** | 33,7 % | +21 % |

`v1` se casse en dix morceaux par cellule quand les trois autres planches
donnent un bloc d'un tenant. **`v2` gagne**, et `S10_base_ouvrage_64-256.png`
est écarté. `S10_base_joueur_32-128_comparaison.png` l'est aussi : c'est un
essai de grille, pas un livrable. Les deux peuvent être supprimés du dépôt.

## 2. ⚠ Les camps de scories ne progressent pas

Occupation plate à −5 % du niveau 1 au niveau 9, quand le quartz gagne 55 % et
la base du joueur 38 %. Les neuf niveaux de scorie occupent la même surface et
ne diffèrent que par le tracé des veines de lave. Sur la carte, un joueur ne
distinguera pas un camp de niveau 3 d'un niveau 7. À confirmer : voulu ou non.

## 3. Ce qui est produit

| Préfixe | Sprites | Source |
|---|---:|---|
| `site_base_j_n1…n9` | 9 | `S10_base_joueur_64-256` |
| `site_base_o_n1…n9` | 9 | `S10_base_ouvrage_64-256_v2` |
| `site_quartz_n1…n9` | 9 | `S10_camps_avant-postes_quartz` |
| `site_scorie_n1…n9` | 9 | `S10_camps_avant-postes_scories` |
| `poi_ressource_a·b`, `poi_reacteur` | 3 | `P10.3`, grille 3 × 1 |
| `poi_bonus_a…d` | 4 | `P10.4`, grille 2 × 2 |
| `base_o_2x2`, `base_o_3x3` | 2 | les deux objectifs du 28/08 |

Les deux grosses bases sont produites aux trois grilles comme le reste. Elles
seront affichées à **128 px pour l'emprise 2 × 2 et 192 px pour la 3 × 3**, donc
la grille 128 est celle qui leur sert ; le 64 et le 32 existent par cohérence.

## 4. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **135** |
| Couleurs hors palette | **0** |
| Occupation | 46 à 48 % de moyenne, 29,5 % au minimum |
| Morceaux détachés en 32 | **1,0 de moyenne** — toutes les silhouettes tiennent |
| Grille de chaque planche | **assertion** dans le script, pas une hypothèse tacite |
| Coupe | par gouttière, jamais en tiers |

## 5. Reste ouvert

1. **L'ordre des neuf niveaux** est la lecture normale, non vérifiable par la
   mesure : l'occupation croît sur trois planches sur quatre, mais elle est
   plate sur les scories (§2).
2. **Les sept POI ne sont pas identifiés un par un.** Leurs noms viennent du nom
   de fichier — `poi_ressource_a`, `poi_bonus_c` — faute d'instruction.
3. **La progression des camps de scories** (§2).
