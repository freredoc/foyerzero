# RAPPORT — lot EMBLÈME : le modèle de la carte monde

**27/08/2026 · documentation seule · aucun fichier de `src/`, `test/` ou `dist/`
touché.**

---

## 1. Ce qui est livré

| Fichier | Emplacement | État |
|---|---|---|
| `INVENTAIRE-SPRITES.md` | racine | **modifié** — v3 → v4 |
| `PLAN-PRODUCTION-SPRITES.md` | racine | **modifié** — v2 → v3 |
| `RAPPORT-lotEMBLEME-carte-monde.md` | racine | nouveau |

Aucune version de build à bumper : `dist/index.html` n'est pas concerné, la
règle du projet est de ne bumper que quand le fichier distribué change.

---

## 2. Le défaut corrigé

`INVENTAIRE-SPRITES.md` v3 ouvrait le lot 1 sur une phrase fausse :

> « la carte du monde et le sol du champ de bataille lisent les **mêmes
> fichiers** »

De là sortait tout le §2.4 : une carte pavée de tuiles, une plage de zoom de
6 × 12 à 24 × 48 cases, une case entre 68 et 17 px CSS, et une exception
`imageSmoothingEnabled` pour le dézoom. Ces chiffres n'ont jamais été mesurés :
ils ont été **déduits** d'un raisonnement sur le zoom d'une carte qui n'a pas ce
modèle.

C'est ce qui bloquait les sessions sprite depuis plusieurs jours. Le symptôme
visible était toujours un désaccord sur la taille des sprites ; la cause était
qu'une des deux vues du jeu était décrite avec le modèle de l'autre.

---

## 3. Ce qui a été mesuré, et comment

Deux captures de la référence (Tiberium Alliances dans Brave, téléphone en
portrait, DPR 3, viewport 412 px CSS), prises aux deux bouts du zoom. Mesure de
l'écart entre deux emblèmes voisins, en pixels physiques, sur les captures
elles-mêmes :

| Capture | Écart largeur | Écart hauteur | Case en px CSS | Cases visibles en largeur |
|---|---|---|---|---|
| 08 h 13 — zoom serré | ~300 px | ~220 px | 100 × 73 | ~3,5 |
| 10 h 56 — zoom large | ~141 px | ~106 px | 47 × 35 | ~7,7 |

**Méthode et sa limite.** Positions relevées à l'œil sur les captures, pas par
détection automatique : les valeurs sont à ±5 px physiques près, soit ±2 px CSS.
C'est largement suffisant pour trancher entre « 17 px » et « 47 px », qui est le
seul point en jeu, et insuffisant pour en tirer un ratio au centième.

Trois faits en sortent, tous relus deux fois sur les captures :

1. **Plage réelle 47 → 100 px CSS**, pas 17 → 68. Le dézoom s'arrête bien avant
   la case minuscule.
2. **Une case occupée = un objet.** Aucun bâtiment, aucune tourelle, aucune
   unité n'est visible sur la carte. Correction apportée par Ethan et vérifiée
   sur la seconde capture : les objets verts et jaunes ne sont **pas** des champs
   de ressource, ce sont des camps, avant-postes et bases ennemies — la ressource
   est dessinée dans l'emblème du site.
3. **Le fond n'est pas un pavage.** Texture continue, sans correspondance
   visible avec la grille ; les frontières d'alliance sont tracées par-dessus.

Fait relevé mais **non adopté** : le rapport largeur/hauteur de la case vaut 0,73
dans les deux captures, indépendamment du zoom — la référence compresse
verticalement sa grille. Foyer Zéro garde une grille carrée, conformément au §1.1
de `FICHE-STYLE.md`. Si ce point se rouvre, il se rouvre explicitement.

---

## 4. Les arbitrages tranchés

**Par Ethan, le 27/08 :**

1. La carte monde est un **fond continu + un emblème par case occupée**.
2. Le fond est **procédural au canvas** — bruit fractal en trois teintes de la
   palette, déterministe sur la graine de la carte. Motif : 30 × 300 cases font
   1 410 × 14 100 px CSS au zoom large ; aucune image ne couvre ça, et de grandes
   tuiles de fond auraient rouvert le problème de couture. Coût : zéro fichier,
   zéro session de génération.

**Ce qui en découle mécaniquement, et que j'ai appliqué :**

3. Les 28 tuiles de terrain ne s'affichent plus jamais sur la carte — combat et
   vue de base seulement. Le terrain d'une case reste une **donnée** de premier
   plan (`sim/champs.js`, `DEBITS.centrale.parVoisin.champDeScorie`).
4. `tile_horschamp.png` est **supprimé**. Il ne bordait que le couloir de la
   carte. Devient un traitement du fond procédural. Lot 1 : 29 → **28**. Total
   général : 158 → **157**, 60 → **59** générations.
5. Les 8 masques `tile_bord_*` **survivent**, mais pour une autre raison que
   celle écrite en v3 : ils ne servaient pas la carte, ils servent la vue de
   base, où les douze cases de champ de `sim/champs.js` forment des blocs de
   quartz et de scorie au milieu du stérile. La mosaïque a changé d'échelle,
   elle n'a pas disparu.
6. Le lot 6 **remonte** de l'avant-dernière place à juste après les bâtiments. Il
   porte désormais tout le visuel de la carte, et il emprunte sa grammaire aux
   bâtiments — un emblème de base est une base lue de loin —, donc il ne peut pas
   passer avant eux, mais il n'a plus rien à faire après les états de réparation
   et les obstacles.

---

## 5. Ce qui reste ouvert — à trancher sur pièce

**Dette 3 bis, nouvelle : la grille des 13 emblèmes du lot 6.**

À 47–100 px CSS et DPR 3, un emblème est demandé entre 141 et 300 px physiques.
Sur une grille 32, cela fait des pixels logiques de **4,4 à 9,4 px** — trois à
sept fois plus gros qu'au combat, où 40 px CSS donnent 3,75 px physiques par
pixel logique.

| Option | Ce qu'on gagne | Ce qu'on paie |
|---|---|---|
| **32 / 128 partout** | la règle « une seule grille » intacte, aucun réglage de conditionneur à ajouter | emblèmes à très gros grain, sans commune mesure avec une unité |
| **48 / 192 ou 64 / 256 pour le lot 6 seul** | grain comparable au combat | la règle « une seule grille » tombe, pour 13 fichiers qui n'apparaissent jamais à côté d'une unité |

Consigne écrite dans le plan : générer **P10.1 dans les deux grilles**, comparer
aux deux tailles de rendu, trancher là. Les trois planches suivantes attendent ce
verdict. Ce n'est pas un arbitrage à faire en amont — c'est exactement le
mécanisme des dettes 1, 2, 4 et 5, qui se soldent par la génération elle-même.

**Non traité ici, et signalé pour ne pas le redécouvrir :** le fond procédural
n'a ni spécification ni test. Il ne coûte aucun sprite, mais il coûtera un lot de
code — trois teintes, une graine, une fonction de bruit, et la question de savoir
si les frontières et le hors-couloir se dessinent dans la même passe.

---

## 6. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Somme des lots du §0 = total annoncé | 28+6+28+18+16+7+13+41 = **157** ✓ |
| Somme des générations du plan = total annoncé | 7+7+6+6+4+4+4+3+4+3+3+8 = **59** ✓ |
| Cohérence « un-par-un » | 157 + 7 essais = **164**, 164/59 = **2,78** ✓ |
| Occurrences résiduelles de « 17 px », « 24 × 48 », « imageSmoothing », « mêmes fichiers » | 6, **toutes dans les blocs qui citent l'erreur pour la corriger** ✓ |
| `tile_horschamp` | 3 occurrences, **toutes des mentions de suppression** ✓ |
| Identifiants de session | inchangés — le journal du §13 du plan reste valide ✓ |
| `src/`, `test/`, `dist/` | non touchés ✓ |

**Ce qui n'a PAS été vérifié :** je n'ai pas relu `BRIEF-SPRITES-IA.md` ni
`FICHE-STYLE.md` ligne à ligne à la recherche d'une reprise de la prémisse
fausse. Le grep sur les quatre formulations connues ne les fait apparaître nulle
part ailleurs, mais un grep ne prouve pas l'absence d'une paraphrase.

---

## 7. Écarts au brief

Aucun : il n'y avait pas de brief écrit pour ce lot, l'arbitrage a été pris en
conversation et exécuté dans la foulée.
