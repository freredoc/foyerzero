# Foyer Zéro — la courbe de niveau

Arbitré par Ethan le 24/08/2026. Ferme le trou n° 1 de `MODELE-REPARATION-1.md`.

---

## 1. La règle

**PV et dégâts croissent exactement comme le reste : ×1,32 par niveau.**

La propriété visée, énoncée telle quelle : *une unité de niveau 30 face à son miroir de niveau 30
doit se comporter exactement comme une unité de niveau 50 face au sien.*

C'est ce qu'on obtient dès lors que **PV et dégâts partagent la même courbe** — et seulement à
cette condition. Le temps pour tuer vaut `PV_cible / (dégâts_tireur × cadence)` : si les deux
termes sont multipliés par le même facteur, il ne bouge pas. Tout combat à niveaux égaux se
déroule donc à l'identique, quel que soit le niveau. Le jeu n'a qu'un seul combat, joué de plus
en plus cher.

---

## 2. Ce qui monte, ce qui ne monte pas

| Grandeur | Suit la courbe ? | Pourquoi |
|---|---|---|
| **PV** | oui | |
| **Dégâts par tir** | oui | |
| Butin | oui, déjà acquis | |
| Coût de construction et de montée | oui, déjà acquis | |
| **Réserve de munitions** | **non** | c'est un nombre de tirs. PV et dégâts montant ensemble, il faut toujours le même nombre de tirs pour abattre la même cible. Une réserve qui monterait casserait le plancher de 10 % |
| **Portée, portée minimale** | **non** | des cases, pas une puissance |
| **Vitesse** | **non** | idem |
| **Masse** | **non** | l'écrasement est un seuil, pas un barème |
| **Points d'armée** | **non** | le coût en emplacement ne change pas ; c'est le plafond du Centre de commandement qui monte, +5 par niveau |
| **Cadence** | **non** | 10 tirs/s pour tout le monde, à vie |
| Points de recherche | **non**, ×2 par niveau | courbe propre, calée sur le doublement du coût de l'arbre |

Conséquence directe : **le test T5 du lot 2A vaut à tous les niveaux.** Un Fusilier met 209 ticks
à abattre un Merlon de son niveau, au niveau 1 comme au niveau 50. Les 90 secondes de combat
restent donc une contrainte constante — ce qui est exactement ce qu'on veut d'un plafond de durée.

---

## 3. Un régime ou deux ?

Le butin et les coûts ont **deux régimes** : ×1,259 jusqu'au niveau 12, ×1,32 au-delà — le début
de partie est plus doux que l'asymptote ne le laisse croire.

**Question ouverte : les PV suivent-ils les deux régimes, ou 1,32 partout ?**

| | niveau 12 | niveau 30 | niveau 50 |
|---|---|---|---|
| ×1,32 partout | ×21 | ×3 138 | ×809 324 |
| deux régimes | ×13 | ×1 865 | ×480 942 |

L'écart n'est pas cosmétique : à 1,32 partout, un site de niveau 12 a **1,6 fois plus de PV** que
ce que son butin justifie, et l'écart reste acquis ensuite. Le rapport butin / PV détruit, qui est
rigoureusement constant si les deux courbes coïncident, dériverait de 40 % avant le niveau 12.

**Recommandation : les deux régimes, comme le butin et les coûts.** C'est la seule forme où
« le rapport butin / effort est constant » reste vrai littéralement. La propriété du miroir tient
dans les deux cas, elle ne tranche pas. À confirmer.

---

## 4. L'écart de niveau est brutal, et il faut le savoir

PV et dégâts montant tous les deux, un écart de niveau se paie **deux fois** :

| Écart | Dégâts | PV | Avantage effectif |
|---|---|---|---|
| +1 | ×1,32 | ×1,32 | **×1,74** |
| +2 | ×1,74 | ×1,74 | **×3,04** |
| +3 | ×2,30 | ×2,30 | **×5,29** |
| +5 | ×4,01 | ×4,01 | **×16,06** |

Trois niveaux d'écart et le combat n'est plus un combat. C'est cohérent avec la géographie —
0,2 niveau par case, donc cinq cases par niveau, et une base composée de deux niveaux adjacents
seulement — mais ça veut dire que **le niveau du Centre de commandement est le seul paramètre qui
compte vraiment** dans la réussite d'un raid. À surveiller à la calibration : si monter d'un
niveau vaut ×1,74 en combat, plus rien d'autre n'a d'importance.

---

## 5. ⚠ Défaut à corriger dans le brief du lot 2A

La formule de dégâts que porte le brief déborde dès que la courbe est appliquée :

```
degatsMilli = Math.floor(degats × facteurMatrice × pvCourantMilli / pvMaxMilli)
```

Au niveau 50, avec les deux régimes : `degats ≈ 7 214 125`, `pvMaxMilli ≈ 1,92 × 10¹¹`.
Le produit intermédiaire vaut **1,39 × 10²¹**, soit **154 000 fois** `Number.MAX_SAFE_INTEGER`.
Le résultat n'est plus un entier, et `Math.floor` ne veut plus rien dire.

Le lot 2A n'en souffre pas — il reçoit des PV en clair, jamais mis à l'échelle — mais le défaut
est là et il explosera au lot 2B. **Correction, en deux temps bornés :**

```js
const ratioMilli  = Math.floor(pvCourantMilli * 1000 / pvMaxMilli);   // 0 à 1000
const degatsMilli = Math.floor(degats * facteurMatrice * ratioMilli / 1000);
```

Produit maximal : `7,2 × 10¹²`, soit une marge de **1 249×** sous la limite. Toujours entier,
toujours déterministe, et le comportement à pleine vie est inchangé.

Effet de bord assumé : une entité sous 0,1 % de ses PV inflige exactement 0. Au plancher de 1 PV
d'une base de haut niveau, c'est précisément l'effet recherché — un sac à points de vie.

---

## 6. Terminologie

« Points d'attaque » désigne déjà, dans `SPEC-FOYER-ZERO.md` §3, **le régulateur de session**
— le plafond `100 + 10 × niveau` qui limite le nombre de raids. Celui-là reste **linéaire** et ne
suit pas la courbe. La grandeur qui suit la courbe s'appelle **dégâts par tir**. Ne pas confondre
les deux dans le code : `POINTS_ATTAQUE` dans `sites.js`, `degats` dans `combat.js`.


---

## 7. ⚠ Second débordement — les points de recherche, et il est plus grave

Signalé après coup : le brief du lot 2A affirme que `2^(niveau−1)` « est sûr jusqu'au niveau 50 ».
C'est vrai de la puissance **seule** — `2^49 = 5,6 × 10¹⁴` tient — mais faux du **produit**, qui
est ce que le code calcule réellement :

```
pointsMilli = barème × 1000 × 2^(niveau−1) × (1 + 0,2) × (pvPerdus / pvMax)
```

| Barème | Représentation | Premier niveau qui casse | Valeur au niveau 50 |
|---|---|---|---|
| Merlon (2) | milli-points | **44** | 1,13 × 10¹⁸ |
| Broyeur (60) | milli-points | **39** | 3,38 × 10¹⁹ |
| Merlon (2) | points entiers | 53 | tient |
| Broyeur (60) | points entiers | **49** | 3,38 × 10¹⁶ |

Passer aux points entiers ne suffit donc pas : le Broyeur déborde encore aux niveaux 49 et 50.
Et on ne peut pas se débarrasser des décimales, elles viennent du `+20 %` du module et du
pourcentage de PV détruits.

**Deux issues, et c'est un arbitrage de conception, pas un choix d'implémentation :**

1. **`BigInt` pour les points de recherche.** Exact, sans plafond, et la seule grandeur du jeu qui
   en aurait besoin. Coût : un type à part dans l'état et dans la sauvegarde.
2. **Ramener la recherche sur ×1,32**, comme tout le reste. Le Broyeur de niveau 50 rapporterait
   alors 28,9 millions de points au lieu de 3,4 × 10¹⁶. Il faudrait recalibrer les paliers de
   l'arbre en conséquence — ils doublent aujourd'hui, ils devraient suivre la même pente.

La recherche est la seule grandeur du jeu qui ne croît pas en ×1,32. C'est ce décalage, et rien
d'autre, qui produit des nombres que JavaScript ne sait plus écrire.

## 8. Ce que 10²¹ était, et ce qu'il n'était pas

Le `1,39 × 10²¹` du §5 n'est **pas** un rapport de puissance. C'est le produit intermédiaire de
trois grands nombres à l'intérieur d'un seul calcul de dégâts — un artefact d'arithmétique, sans
signification de jeu.

Le vrai rapport de puissance entre un niveau 50 et un niveau 30, lui, vaut :

| | Rapport |
|---|---|
| Dégâts | ×258 |
| PV | ×258 |
| **Avantage effectif** | **×66 521** |

Celui-là est voulu, et il tient : un niveau 50 vaporise effectivement un niveau 30.
Les deux nombres n'ont simplement rien à voir l'un avec l'autre.
