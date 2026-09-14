# RAPPORT — lot ÉCHELLE-RECHERCHE (14/09/2026)

Les points de recherche quittent la courbe de BUTIN pour la leur.

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

Les deux nombres sont ajustés (minimax en logarithme) sur trois relevés de
*Tiberium Alliances* dictés par Ethan, confrontés au total mesuré du générateur
sur 40 tirages par niveau :

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
- **Aucun barème par cible touché.** Le Broyeur vaut toujours trente Merlons.
- **Aucun coût de l'arbre touché.** `ARBRE_RECHERCHE` est intact.

## 3. Le garde-fou de débordement

`verifierArithmetique` bornait le produit le plus lourd avec
`facteurEconomiqueMilli` : il le borne désormais avec `facteurRechercheMilli`,
qui est la grandeur susceptible de déborder.

⚠ **Deux tests PASSAIENT tout en ne gardant plus rien** — `generateur.test.js`
T13 et `grille.test.js` recopiaient le garde-fou avec l'ancien facteur. Repointés.

La marge s'élargit : `60 × 392 976 879 × 1200 = 28 294 335 288 000`, soit
**318 fois** sous l'entier sûr contre 260 avant. Une pente plus douce partant
plus haut finit plus bas (392 976 879 contre 480 941 681 au plafond). `BigInt`
reste obligatoire : le produit complet, avec `pvPerdusMilli`, atteint 4,3 × 10²¹.

## 4. Les témoins : deux couches, aucune recapture

La consigne de `temoins-combat.js` — « le prochain lot qui touchera au combat
devra EMPILER une couche, jamais recapturer » — est suivie.

**`COMBATS_DEPLACES_PAR_ECHELLE_RECHERCHE` (+ `_AVANT_PAQUETS`)** : la couche
porte **200 champs sur 1 600, tous dans la colonne 6** — les points de
recherche. Aucune empreinte de résultat, aucune empreinte d'état, aucune cause,
aucun tick, aucun butin, aucun PV restant, aucune destruction. C'est la seule
couche de l'histoire du fichier à ne toucher qu'une colonne sur huit.

- `JOURNAL T1` : surcharge 1 179 → **1 211**, gardés 421 → **389** (32 champs neufs).
- `JOURNAL T1 bis` : surcharge 1 337 → **1 339**, gardés 263 → **261**.

**`DEPLACES_PAR_ECHELLE_RECHERCHE`** et ses trois tables sœurs dans
`temoins-bases-0.js` : **16 couples sur 350**, deux champs — `recherche` et
`rapports` —, phases p07 à p14. Les six premières phases sont identiques au bit.
`butin` ne bouge pas, ni `economie`, ni les dix-sept scalaires.

⚠ Les deux tables de rapports sont PLEINES (25 graines sur 25) alors qu'aucune
empreinte de combat ne bouge : un rapport porte ses points, pas son déroulé.
C'est la signature d'un changement de barème, et l'inverse de celle d'un
changement de règle.

## 5. Valeurs de référence réancrées

| test | avant | après |
|---|---|---|
| `combat.test.js` T13 — Merlon niv 3 à 50 % | 1 585 | 13 734 |
| — avec module | 1 902 | 16 480 |
| — Merlon entier avec module | 3 804 | 32 961 |
| `generateur.test.js` T13 — Broyeur niv 50 | 24 377 381 190 | 19 918 729 352 |
| `recherche.test.js` — raid de référence | 2 059 722 | 10 376 040 |
| — avec `pvPlusVingt` | 2 106 166 | 10 600 850 |
| — liste du défenseur | 2 471 666 | 12 451 248 |
| MODULES-F T14 niveau 20 | 12 990 000 · 10 028 009 · 2 665 090 | 62 876 952 · 48 539 702 · 12 900 146 |
| MODULES-F T14 niveau 38 | 322 302 930 · 742 303 771 · 472 790 407 | 536 514 501 · 1 235 659 687 · 787 020 180 |
| MODULES-F T14 niveau 50 | 13 882 187 857 · 23 713 374 633 · 26 497 250 142 | 11 343 119 287 · 19 376 170 379 · 21 650 871 767 |

Toutes mesurées à l'exécution, aucune calculée à la main.

## 6. Validation

`npm run check` : build à 9 386 063 octets, **1 610 tests verts, 0 échec**,
1 ignoré (le même qu'avant le lot).

## 7. Version

Le lot ne propose aucun numéro : `package.json` reste en 0.99.58 / build 160.
À monter au commit.

## 8. Ce qui n'est PAS dans ce lot

L'équilibrage de l'arbre lui-même. Le rendement d'un camp croît toujours plus
vite que le prix d'un rang (×1,44 par niveau contre ×2,09 par rang, soit environ
×1,22 par niveau si les quatorze rangs s'étalent sur cinquante niveaux) : la
recherche reste une barrière de début et de milieu de partie qui se dissout
ensuite. C'est un arbitrage de jeu, pas un défaut de programme, et il
appartient à Ethan.
