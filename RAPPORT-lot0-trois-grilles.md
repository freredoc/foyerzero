# RAPPORT — lot 0, les trois grilles de l'existant

**29/08/2026.** Complète en 128, 64 et 32 les 78 sprites déjà validés, sans
générer une seule image nouvelle. Aucun fichier de `src/` ni de `test/` touché.

---

## 1. Ce qui a été produit

| Dossier | Avant | Après |
|---|---:|---:|
| `art/sprites/unite/{128,64,32}` | 14 + 14 | **14 + 14 + 14** |
| `art/sprites/bâtiment/{128,64,32}` | 16 + 16 | **16 + 16 + 16** |
| `art/sprites/terrain/{128,64,32}` | 18 à plat | **18 + 18 + 18** |
| **Total** | **78** | **144** |

**66 fichiers neufs, 20 déplacés ou supprimés.** Les 18 tuiles de terrain
quittent `art/sprites/terrain/` pour `art/sprites/terrain/128/`, ce qui aligne le
terrain sur la convention déjà en vigueur pour les unités et les bâtiments.
Aucun fichier de `src/` ne référence ces chemins — vérifié par `grep`, zéro
occurrence — donc le déplacement ne casse rien.

`bat_j_usine.png` disparaît des trois grilles au profit de
`bat_j_depot_de_vehicules.png`, conformément à l'arbitrage du 26/08 que
`src/data/base.js` documente en commentaire.

## 2. L'outil

`tools/planches.py`, deux modes :

```
python3 tools/planches.py --verifier   # ne rien écrire, comparer à l'existant
python3 tools/planches.py --ecrire     # produire les trois grilles
```

Il rejoue la chaîne de `final128.py` depuis la racine du dépôt, sans chemin
absolu. Deux corrections d'une ligne ont été nécessaires : `final128.py` et
`align_chenilles.py` pointaient tous deux sur `/home/claude/work` en dur.

**L'invariant central : on n'écrase jamais un fichier existant qui ne se
reproduit pas.** S'il diverge, c'est que sa provenance n'est pas entièrement
dans cette chaîne, et le commité fait foi. Les divergences sont écrites en clair
à la fin du contrôle.

## 3. Le contrôle, et ce qu'il a mordu

Contrôle avant écriture, sur les 58 fichiers déjà commités :

| Étape | Identiques |
|---|---|
| Chaîne `final128.py` seule | **51 / 58** |
| + `retirer_appendice` et `align_chenilles` chaînés | **56 / 58** |

Les sept écarts initiaux n'étaient pas répartis au hasard : `bat_j_accumulateur`
et `bat_j_raffinerie` sur les deux grilles, et `off_j_ratisseur`,
`off_j_fendeur`, `off_j_belier` en 32 seulement. La réponse était dans l'en-tête
de deux outils que personne n'appelait :

- `tools/retirer_appendice.py` — « Retire le bloc détaché à gauche de
  **l'Accumulateur et de la Raffinerie** ». Vaut pour les trois grilles.
- `tools/align_chenilles.py` — « Aligne les chenilles des **trois blindés** à
  10 points ». Son cadre est écrit en dur en coordonnées de grille 32
  (`CX0=9, CX1=22, CY0=7, CY1=23`) : la passe n'a de sens qu'à cette grille-là,
  et c'est pourquoi les 128 se reproduisaient déjà sans elle.

Les deux passes sont désormais chaînées dans `produire()`, au bon moment et sur
les bonnes grilles.

Avant d'y arriver, deux hypothèses ont été essayées et réfutées, mesure à
l'appui : une coupe de planche par gouttière (toujours différent) et un
dépoussiérage des 1 146 mouchetures de `P2_3` (3 identiques sur 6 au lieu de 3,
donc pire).

## 4. Les deux écarts qui restent

`unite/32/off_j_ratisseur.png` et `unite/32/off_j_belier.png` ne se reproduisent
pas : 93 et 96 gros pixels d'écart, tous confinés aux colonnes 9 à 22, soit
exactement le cadre de caisse d'`align_chenilles`. Le commité est décalé d'un ou
deux gros pixels vers le bas par rapport au produit.

J'ai cherché le recentrage manquant par force brute, les 49 translations de
−3 à +3 en x et en y, appliquées avant l'alignement : **aucune ne reproduit**.
`off_j_fendeur`, lui, tombe juste sans aucun décalage.

Conclusion : la provenance de ces deux fichiers comporte une retouche qui n'est
dans aucun outil du dépôt. **Les deux commités sont conservés intacts** par
l'invariant du §2. Leur 64 et leur 128 viennent de la chaîne, leur 32 reste ce
qu'il était. C'est une incohérence assumée et documentée, pas une régression.

## 5. ⚠ Un défaut trouvé au passage, dans des sprites déjà validés

`P6_4_flux_joueur.png` porte quatre bâtiments sur une grille 2 × 2. Mesuré par
composantes connexes de plus de 20 000 pixels :

| Cellule | Bâtiment | Étendue en x | Coupe naïve à 615 |
|---|---|---|---|
| haut-gauche | centrale | 55 → **701** | **TRONQUÉ** |
| haut-droite | accumulateur | 746 → 1178 | intact |
| bas-gauche | collecteur | 55 → **706** | **TRONQUÉ** |
| bas-droite | raffinerie | 740 → 1147 | intact |

La coupe en quarts tombe à x = 615, **au milieu de la matière**. Les deux
bâtiments de gauche perdent 86 et 91 pixels de leur flanc droit, et cette
tranche atterrit dans la cellule voisine sous forme de bloc détaché — c'est
précisément ce que `retirer_appendice` efface depuis le début, sans que personne
remarque d'où venait le bloc.

Donc `bat_j_centrale` et `bat_j_collecteur` sont **amputés d'environ 13 % de
leur largeur**, dans les trois grilles, et ils l'étaient déjà avant ce lot. Le
module manquant est visible sur la comparaison jointe : un bloc de sortie sur le
flanc droit, absent des commités.

**Non corrigé dans ce lot**, par l'invariant du §2 : la correction change quatre
sprites validés, elle demande un arbitrage. La coupe correcte est x = 723,
dans la gouttière 706–740.

## 6. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Contrôle rejoué après écriture | 88 identiques, 2 divergents, **0 nouveau** — idempotent |
| Fichiers produits | **144**, comptés sur disque |
| Dimensions | 128×128, 64×64, 32×32 — une seule taille par dossier |
| Alpha strictement binaire | ✔ sur les neuf dossiers |
| Couleurs hors palette d'entité | 0 sur unités et bâtiments |
| Couleurs hors palette sur le terrain | 46, **identiques aux trois grilles** — ce sont les rampes de sol, hors palette d'entité par construction |
| Réductions de terrain revérifiées | **36 / 36** exactes, division entière du gros pixel |
| Terrain 128 | copié à l'octet, jamais ré-encodé |
| Suite de tests | inchangée — aucun fichier de `src/` ni `test/` touché |

## 7. ⚠ État de `main` au moment du lot

`main` est rouge avant ce lot et le reste après : `node tools/build.js` échoue et
la suite est à **292 / 308**. Cause unique, sans rapport avec les sprites :
`src/sim/site-entame.js` est importé par `src/sim/state.js` et `src/sim/raid.js`
et **n'existe nulle part** — ni dans l'historique de `main`, ni sur les cinq
branches `claude/*`, toutes fetchées et fouillées. `test/site-entame.test.js`
est bien présent, lui.

Les 16 échecs en découlent en cascade, dont les quatre tests de documentation et
le test T10 qui vérifie que le build passe. La PR de ce lot sortira donc rouge
pour cette raison-là.

## 8. Reste ouvert

1. **`site-entame.js` à retrouver ou à réécrire.** Son test décrit l'API : il est
   reconstructible, mais c'est un lot à part entière.
2. **La troncature de `centrale` et `collecteur`** (§5) — arbitrage à rendre.
3. **Le 32 de `ratisseur` et `belier`** (§4) — provenance perdue, conservés en
   l'état.
4. **Le 64 des blindés ne porte pas les chenilles alignées** — la passe n'existe
   qu'en coordonnées 32. À vérifier à l'écran avant de considérer le 64 clos.
