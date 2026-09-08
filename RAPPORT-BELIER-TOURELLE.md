# CORRECTIF — tourelle du Bélier

Remplace `art/sources/off_o_belier_tourelle.png` livré au lot blindés. Le reste
du lot est inchangé.

## Passage au vert

Fond 1 326 207, sujet 246 309, clé relue verte, **zéro magenta restant**.

## Le pivot change, et pas qu'un peu

| | Ancienne | Nouvelle |
|---|---|---|
| Cadre | 1024 | **1254** |
| Pivot | 511,0 · 487,0 | 626,0 · 606,5 |
| Corps | 309 × 365 | 485 × 574 |

Le JSON `ancres-blindes-ouvrage.json` est régénéré : réutiliser l'ancien pivot
poserait la tourelle 115 px à gauche et 120 px au-dessus de son logement.

## Un facteur d'échelle, écrit et pas deviné

Le jet n'est pas seulement dans un cadre plus grand, il est **proportionnellement
plus gros**. Corps de 485 px pour une coque de 761, soit **64 % de la largeur**,
quand la famille tient entre 31 % (Ratisseur) et 43 % (Pilon). Monté tel quel il
recouvre la coque entière.

Trois facteurs essayés : 1,0 → 64 %, 0,817 (le seul rapport de cadre) → 52 %,
**0,65 → 41 %**. Le 0,65 est retenu : c'est exactement le rapport qu'avait la
tourelle remplacée, et il tombe au milieu de la famille.

⚠ **La source n'est pas rééchantillonnée.** Le facteur est inscrit dans le champ
`echelle` du JSON et appliqué au montage. Redimensionner la source ajouterait un
rééchantillonnage avant celui de la découpe, pour un gain nul. Les quatre autres
tourelles portent `echelle: 1.0`.

C'est une décision, pas une mesure : si tu veux le Bélier plus imposant, change
la valeur dans `ECHELLES` en tête de `tools/ancres-blindes-ouvrage.py` et
relance les deux scripts.

## Contenu

```
art/sources/off_o_belier_tourelle.png
art/sources/ancres-blindes-ouvrage.json      régénéré
art/essai/PLANCHE-blindes-ouvrage-40.png     régénéré
tools/ancres-blindes-ouvrage.py              champ `echelle`
tools/montage-blindes-ouvrage.py             applique le facteur
```
