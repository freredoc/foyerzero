# RAPPORT — sources de bâtiment, quatre états

**80 sources livrées** : 20 bâtiments × 4 états. Les deux archives d'Ethan en
portaient 22 ; deux restent sans affectation (§4).

---

## 1. Les quatre états, et d'où ils viennent

| État | Suffixe | Source |
|---|---|---|
| intact | *aucun* | **sprite de sélection** |
| un peu abîmé | `_abime` | cellule 1 de la planche 3 × 1 |
| très abîmé | `_tres_abime` | cellule 2 |
| détruit | `_detruit` | cellule 3 |

⚠⚠ **LA CELLULE 1 N'EST PAS L'INTACT**, et je l'avais écrit à l'envers avant de
mesurer. Les 22 sprites de sélection portent **zéro pixel de fumée** ; les trois
cellules en portent toutes. Le feu suit la même courbe — Accumulateur 1 457 px de
feu à l'intact, puis 1 107 · 10 029 · 4 682. Les deux archives donnent donc
exactement les quatre états annoncés, sans trou.

---

## 2. La fumée est gardée, donc opacifiée

Peinte semi-transparente sur le fond de clé, elle sortait à moitié effacée avec
des lambeaux roses. La retirer est impossible : **18 % de sa surface est déjà
opaque**, et une propagation à travers les gris sombres emporte 377 307 px de la
Caserne, bâtiment compris.

Elle est donc **inversée**. Sur magenta, le canal vert ne reçoit rien du fond,
d'où `a = 1 − (R − V)/255` et `C = V/a`. Chaque pixel translucide reprend sa
couleur pleine. **1 162 891 px opacifiés** sur les 80 sprites.

⚠ **La borne de neutralité vaut 12, pas 40.** À 40, `|R − B|` attrapait
l'ardoise de l'Ouvrage, qui n'a que 15 d'écart : **438 548 px de la Souche**
passaient pour de la fumée. Le fond contaminant R et B à l'identique, la vraie
fumée les garde égaux — 8 d'écart en médiane, 11 au 90ᵉ centile.

⚠ **L'ordre compte** : opacifier D'ABORD, sur le magenta. Le calcul s'appuie sur
un canal vert propre ; après passage au vert c'est ce canal-là qui porte le fond.

---

## 3. La clé se décide par bâtiment, et par la mesure

**16 bâtiments sur 20 sont passés au vert**, dont **onze du JOUEUR**. Le critère
n'est pas le camp mais le perçage : on garde la clé qui ne mange pas le dessin.

- La **Raffinerie du joueur** perdait 1 293 px en pose abîmée — son violet clair
  `(193, 94, 225)` tombe sous le seuil du magenta. Un `if camp == 'o'` l'aurait
  laissée passer en silence.
- La **Souche** perdait son dôme, 7 122 px en pose abîmée et 11 562 à l'intact.

⚠ **Le choix est fait POUR LES QUATRE ÉTATS À LA FOIS, le pire décidant.** Cellule
par cellule, la Centrale sortait avec son état abîmé sur vert et les trois autres
sur magenta : quatre fichiers du même objet, deux clés.

⚠ Le passage au vert porte deux corrections trouvées ici : magenta franc à **60**
au lieu de 90, et frange bornée à `|R − B| < 40` — sans quoi le violet du dôme
déclenche « rouge et bleu hauts, vert bas » comme un liseré magenta.

**Résultat : 78 sprites sur 80 sans un pixel de dessin percé.** Les deux restants,
`bat_j_artillerie_anti_vehicule_detruit` et `bat_j_artillerie_anti_aerien_tres_abime`,
en comptent 3 et 8 — de la poussière, sous le seuil de bascule.

---

## 4. Ce qui n'est pas livré

- `16_collecteur_raffinerie` : aucune affectation. Ni `collecteur_quartz`, ni
  `collecteur_scorie`, ni `raffinerie`, qui ont chacun leur planche.
- `22_collecteur_mixte_icone` : c'est une icône d'interface, pas un sprite de
  bâtiment. Elle relève de la famille `ui_`, pas de `bat_`.

Les deux sont restées dans les archives d'origine, non traitées.

---

## 5. Les identifiants

Cinq entrent dans `base.js` : `collecteurQuartz` et `collecteurScorie` qui
remplacent `collecteur`, et les trois `artillerie*`. C'est le lot de code qui
les crée — voir `BRIEF-lotBATIMENTS-QUATRE-ETATS.md`.

Le camp est mesuré, pas supposé : les cinq de l'Ouvrage portent 76 à 91 % de
pixels à signature violette, les quinze du joueur 40 à 77 % de kaki.

---

## 6. Contenu

```
art/sources/bat_j_<id>{,_abime,_tres_abime,_detruit}.png    15 bâtiments
art/sources/bat_o_<id>{,_abime,_tres_abime,_detruit}.png     5 bâtiments
tools/opacifier-fumee.py
tools/lot-batiments.py        rejoue les 80 depuis les deux archives
rapport_lot.txt               la sortie de la chaîne, pièce par pièce
```
