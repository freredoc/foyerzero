# RAPPORT — lot ÉCHELLE-RECHERCHE (14/09/2026)

Les points de recherche quittent la courbe de BUTIN pour la leur.
Mesuré sur `main` **après** le lot FREIN, et empilé par-dessus lui.

## 1. Le défaut

Le barème de `POINTS_RECHERCHE` s'applique **par cible**. La courbe économique
qu'il empruntait depuis le 25/08/2026 décrit, elle, le total d'un **site**.
Entre les deux, `DENSITE` et `GARNISON` ajoutaient leur propre croissance :

| | niveau 10 | niveau 40/50 |
|---|---|---|
| défenses d'un camp (`DENSITE`) | 8 | 25 |
| barème moyen (`GARNISON`) | 10,7 | 26,1 |

Le total d'un site montait donc de **×1,44 par niveau** là où la courbe
économique monte de ×1,32 — et il partait **7,4 fois trop bas**. Les deux écarts
se compensant sur 34 niveaux, le défaut était invisible en fin de partie et
paralysant au début : au niveau 12, un camp rasé rapportait 1 427 points quand
le premier rang payant de l'arbre en coûte 200 000.

## 2. Le correctif

`POINTS_RECHERCHE.echelle = { ancrage: 8.875, pente: 1.244 }`, lue par
`facteurRechercheMilli(n) = round(1000 × ancrage × pente^(n−1))` de
`sim/combat.js`, en remplacement de `facteurEconomiqueMilli` **pour cette seule
grandeur**.

Ajustement minimax en logarithme sur trois relevés de *Tiberium Alliances*
dictés par Ethan, confrontés au total mesuré du générateur (40 tirages/niveau) :

| relevé TA | attendu | obtenu | écart |
|---|---|---|---|
| camp niveau 10 | 5 000 | 5 370 | +7,4 % |
| camp niveau 26 | 827 000 | 769 648 | −6,9 % |
| avant-poste niveau 44 | 85 000 000 | 91 329 645 | +7,4 % |

Le camp de niveau 12 passe de 1 427 à **11 230**.

### Ce qui n'a pas été fait, et pourquoi

- **Pas de second régime.** La pente qu'exigent les deux camps est 1,2552 ;
  celle du passage camp 26 → avant-poste 44 est 1,2341. Deux régimes les
  rendraient exacts tous les trois, au prix d'une bascule inventée pour trois
  points — alors que le tirage d'un site fait déjà varier son total de ±20 %
  d'une graine à l'autre. Le résidu est plus petit que le bruit.
- **Pas de multiplicateur de site.** L'avant-poste 44 tombe sur la courbe des
  camps extrapolée depuis les deux camps : TA n'applique pas son ×3,25 aux
  points de recherche, et `pointsRecherche` ne le fait pas non plus.
- **Aucun barème par cible touché**, aucun coût de `ARBRE_RECHERCHE` touché.

## 3. Le garde-fou de débordement

`verifierArithmetique` borne désormais le produit le plus lourd avec
`facteurRechercheMilli`, qui est la grandeur susceptible de déborder.

⚠ **Deux tests PASSAIENT tout en ne gardant plus rien** — `generateur.test.js`
T13 et `grille.test.js` recopiaient le garde-fou avec l'ancien facteur. Repointés.

La marge s'élargit : `60 × 392 976 879 × 1200 = 28 294 335 288 000`, soit
**318 fois** sous l'entier sûr contre 260 avant. `BigInt` reste obligatoire : le
produit complet, avec `pvPerdusMilli`, atteint 4,3 × 10²¹.

## 4. Les témoins : des couches, aucune recapture

**`COMBATS_DEPLACES_PAR_ECHELLE_RECHERCHE` (+ `_AVANT_PAQUETS`)**, empilées
par-dessus celles de FREIN. La couche porte **200 champs sur 1 600, tous dans la
colonne 6** — les points de recherche. Aucune empreinte, aucune cause, aucun
tick, aucun butin, aucun PV restant, aucune destruction. Seule couche de
l'histoire du fichier à ne toucher qu'une colonne sur huit, et signature inverse
de celle de FREIN.

- `JOURNAL T1` : surcharge 1 213 → **1 240**, gardés 387 → **360** (27 neufs).
- `JOURNAL T1 bis` : surcharge 1 341 → **1 343**, gardés 259 → **257**.

**`DEPLACES_PAR_ECHELLE_RECHERCHE`** et ses trois tables sœurs dans
`temoins-bases-0.js` : **16 couples sur 350**, deux champs — `recherche` et
`rapports` —, phases p07 à p14. Les six premières phases sont identiques au bit.
`butin` ne bouge pas, ni `economie`, ni les dix-sept scalaires.

## 5. Valeurs de référence réancrées

| test | avant | après |
|---|---|---|
| `combat.test.js` T13 — Merlon niv 3 à 50 % | 1 585 | 13 734 |
| — avec module · Merlon entier | 1 902 · 3 804 | 16 480 · 32 961 |
| `generateur.test.js` T13 — Broyeur niv 50 | 24 377 381 190 | 19 918 729 352 |
| `recherche.test.js` — raid de référence | 2 059 722 | 10 376 040 |
| — avec `pvPlusVingt` | 2 106 166 | 10 600 850 |
| — liste du défenseur | 2 471 666 | 12 451 248 |
| MODULES-F T14 niv 20 | 4 225 153 · 7 185 767 · 2 665 613 | 20 451 490 · 34 782 081 · 12 902 675 |
| MODULES-F T14 niv 38 | 1 778 393 323 · 820 121 721 · 474 790 516 | 2 960 363 423 · 1 365 197 628 · 790 349 617 |
| MODULES-F T14 niv 50 | 44 429 976 952 · 21 968 630 813 · 26 466 085 261 | 36 303 681 644 · 17 950 542 267 · 21 625 406 980 |

Toutes mesurées à l'exécution, aucune calculée à la main.

## 6. Validation

`npm run check` : **1 612 tests verts, 0 échec**, 1 ignoré — exactement le compte
de `main` avant le lot.

## 7. Version

Le lot ne propose aucun numéro : à monter au commit.
`SAVE_VERSION` ne bouge pas — le schéma sauvegardé est identique, seul un solde
change de valeur. Les parties en cours restent lisibles, sans rattrapage des
points déjà acquis.

## 8. Ce qui n'est PAS dans ce lot

L'équilibrage de l'arbre. Le rendement d'un camp croît toujours plus vite que le
prix d'un rang : la recherche reste une barrière de début et de milieu de partie
qui se dissout ensuite. C'est un arbitrage de jeu, et il appartient à Ethan.

## 9. Application

Ce lot se livre en **patch**, pas en fichiers entiers — la première tentative
avait écrasé le lot FREIN en silence. `git apply` refuse de s'appliquer si l'un
des dix fichiers a bougé depuis la mesure, ce qui est exactement le garde-fou
qui manquait.
