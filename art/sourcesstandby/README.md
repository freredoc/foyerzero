# `art/sourcesstandby/` — les images en attente d'intégration

**Aucun outil ne lit ce dossier.** Ni `tools/planches.py`, ni les douze autres
producteurs, ni `tools/atlas.py`, ni le build. Ce qui est ici n'entre pas dans
`dist/index.html` et ne devient aucun sprite.

C'est un dépôt d'attente, pas une corbeille : ces images sont destinées à
entrer, un jour, par un lot qui le dira.

## Comment une image en sort

1. la déplacer dans `art/sources/` ;
2. écrire le lot qui la consomme — un outil de `tools/` doit la nommer ;
3. relancer `python3 tools/entrees.py --declarer` et **commiter**
   `art/sources-declarees.json`, qui la fera passer de rien à `consommees`.

Sans le troisième point, `python3 tools/verifier.py` sort en erreur : une image
posée dans `art/sources/` sans être classée fait rougir la garde, exprès.

## Pourquoi ce dossier est À CÔTÉ de `art/sources/`, pas DEDANS

Un sous-dossier `art/sources/attente/` serait balayé par le premier
`os.listdir` qu'on ajouterait un jour sans y penser. Ce n'est pas une crainte
théorique : `tools/tourelles.py` a porté pendant des semaines un balayage qui
rendait le PREMIER fichier commençant par « T01_ », et un second fichier de ce
nom aurait changé une tourelle sur douze **au hasard et sans lever**. Le lot
ENTRÉES l'a désarmé le 03/09 ; le dossier d'attente reste dehors pour que la
question ne se repose pas.

⚠ **`art/sourcesstandby` a `art/sources` pour préfixe**, ce qui est un piège pour
qui trierait les chemins à la sous-chaîne. `tools/entrees.py` compare le dossier
PARENT d'un chemin, jamais son texte — voir sa fonction `dans`.

## Ce dossier ne s'ampute pas non plus

Même règle que `art/sources/` : rien ici n'est un produit, tout y est un
original. On y ajoute, on en sort par un lot, on n'y supprime pas.
