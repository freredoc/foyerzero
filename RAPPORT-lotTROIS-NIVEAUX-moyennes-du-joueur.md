# RAPPORT — lot TROIS-NIVEAUX : le niveau du joueur est une moyenne

> Arbitrage d'Ethan du **27/08/2026** : « les niveaux, ça concerne uniquement
> l'Ouvrage. Les niveaux du joueur, par base, il en a trois : le niveau de ses
> bâtiments, le niveau de sa défense et le niveau de son armée offensive. À
> chaque fois c'est une moyenne. » Puis, le même jour : **une décimale**, et
> **seulement ce qui est posé**.
>
> Livré dans le même dépôt que le lot FONDATION-GELÉE, dont il corrige la
> conséquence fausse.

---

## 1. Version et build produits

| | Avant | Après |
|---|---|---|
| `version` · `config.build` | 0.12.0 · 12 | **0.12.0 · 12** — pas de bump |
| `dist/index.html` | 81 236 o, `f6b082b4…5ad430` | **identique** |
| `npm test` | 245 (après FONDATION-GELÉE) | **250 pass / 0 fail** |

---

## 2. Ce qui a été écrit, et ce qui ne l'a pas été

`src/sim/niveau-de-base.js` porte **deux** fonctions :

- `moyenneEnDixiemes(niveaux)` — la règle, une fois ;
- `niveauDesBatiments(disposition)` — son application aux bâtiments posés.

**Les deux autres niveaux ne sont pas écrits, et c'est délibéré.** La matière
n'existe pas : `sim/state.js` ne porte que `disposition`, c'est-à-dire les
bâtiments. La garnison du joueur et son armée d'assaut se composent dans
`ui/defense.js` et `ui/arsenal.js`, qui sont des **éditeurs** — rien de ce
qu'ils produisent n'est sauvegardé. Les écrire aujourd'hui reviendrait à choisir
seul la forme de cet état. Le fichier dit où elles iront et à quoi elles
appelleront : `moyenneEnDixiemes`, jamais une seconde moyenne à elles. Trois
moyennes qui divergeraient seraient trois grandeurs différentes portant le même
nom.

### Deux décisions d'écriture qui ne se lisent pas dans l'arbitrage

**Le résultat est rendu en DIXIÈMES ENTIERS.** `5,8` se range `58`. Une décimale
en flottant s'additionne mal, se compare mal, et se sérialise en
`5.799999999999999`. C'est la même discipline que les milli-unités de
l'économie. La conversion pour l'affichage — diviser par dix, virgule française,
décimale **toujours** montrée, donc « 6,0 » et jamais « 6 » — appartient à
l'interface.

**L'arrondi se calcule sans flottant.** `Math.round(somme × 10 / n)` passerait
par un double pour un calcul qui n'en a pas besoin. `(somme × 20 + n) / 2n`
tronqué donne le même résultat en restant dans les entiers exacts : ajouter une
demi-unité de dixième avant de tronquer **est** l'arrondi à la demie supérieure.

---

## 3. Le périmètre, asserté des deux côtés

« Seulement ce qui est posé » se prouve mal par une égalité seule : un `5,0`
peut sortir d'un calcul faux qui tombe juste. Le test asserte donc aussi les
**deux façons de se tromper**, chiffrées :

| Faute | Ce qu'elle donnerait | Assertion |
|---|---|---|
| compter les emplacements vides pour zéro | base neuve à **0,5** au lieu de 1,0 | `notEqual(…, 5)` |
| exclure le Chantier de construction | **7,0** au lieu de 5,0 sur le montage à trois bâtiments | `notEqual(…, 70)` |

---

## 4. Falsification — six défauts injectés, cinq attrapés, un équivalent

| # | Défaut injecté | Résultat |
|---|---|---|
| N1 | arrondi au plancher au lieu de la demie supérieure | **rouge** |
| N2 | deux décimales au lieu d'une | **rouge**, 3 tests |
| N3 | liste vide rend 0 au lieu de lever | **rouge** |
| N4 | le Chantier exclu de la moyenne | **rouge** |
| N5 | les niveaux non entiers ne sont plus refusés | **rouge** |
| N6 | `Math.round(somme × 10 / n)` à la place de la formule entière | **passe** |

**N6 n'est pas un trou, c'est une stratégie équivalente** — et le test le dit
de face plutôt que de l'ignorer : il compare les deux chemins sur 3 000 listes
tirées et exige qu'ils coïncident partout. Aux ordres de grandeur du jeu
(somme ≤ 2 000, n ≤ 40) le double est exact, donc les deux formules **doivent**
s'accorder ; si elles divergent un jour, c'est le flottant qui aura tort et le
test le nommera. La formule entière est gardée parce qu'elle ne dépend pas de
cette borne, pas parce que l'autre serait fausse aujourd'hui.

Le même test asserte d'abord qu'il a **rencontré des cas pile sur la demie**,
sinon il ne mesurerait pas l'arrondi qu'il prétend mesurer.

---

## 5. Ce que ce lot corrige dans le précédent

`RAPPORT-lotFONDATION-GELEE-terrain-fige.md` §5 raconte l'erreur : ce lot-ci
avait d'abord été écrit en faisant suivre le niveau de la base à sa rangée sur
la carte. **Rien n'avait été déposé** quand Ethan l'a relevé ; les trois
fichiers concernés ont été corrigés avant livraison, pas après.

`sim/carte.js` porte désormais l'avertissement à l'endroit exact où la faute se
commettrait : `niveauDeLaRangee` s'annonce comme le niveau des sites de
**l'Ouvrage**, et dit de ne jamais l'appeler avec la position du joueur.

---

## 6. Points laissés en suspens

- **`niveauDeLaDefense` et `niveauDeLArmeeOffensive`** attendent que l'état du
  joueur porte sa garnison et son armée.
- **`RAID_OUVRAGE.niveauMinimal` vaut 10 et `indexeSur: 'niveauDuJoueur'`** dans
  `data/sites.js`. Le jour où ces deux-là seront branchés, il faudra dire
  **lequel** des trois niveaux ils lisent, et comparer des dixièmes à des
  dixièmes — 10 s'écrira 100. Aucun code ne les lit aujourd'hui.
- **Brancher l'écran**, décidé « à fond » le 27/08 : jouable, pas une vitrine.
