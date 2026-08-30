# RAPPORT — lot 10, bâtiments détruits et ruines

**30/08/2026.** 54 fichiers : 16 bâtiments détruits et 2 ruines, sur trois
grilles. Le dépôt passe à **1 669 sprites**. Aucun fichier de `src/` ni `test/`
touché.

---

## 1. La table n'est pas recopiée

Les planches détruites reprennent exactement la disposition des intactes — même
grille, mêmes bâtiments dans le même ordre. `ruines.py` lit donc la table `B` de
`final128.py` et se contente d'y substituer le fichier source. Si `B` change, ce
lot suit sans intervention.

C'est la leçon de `SE_LIE_AU_MUR` au module `rendu-pose.js` : une liste écrite à
la main est la première à diverger. Le script lève d'ailleurs si une planche
intacte n'a pas de détruite déclarée.

Le suffixe de sortie est `_detruit`, sur le modèle du `_def` des unités : même
dossier, même nom de bâtiment, un état de plus.

## 2. Deux doublons arbitrés par mesure

Faute d'instruction, et sur un critère qui se défend : **la survie à la grille de
32 gros pixels**.

| Planche | Épaisseur médiane | Matière moyenne | |
|---|---:|---:|---|
| `P2_..._detruite_1024` | **2,66 gp** | 468 345 | **retenu** |
| `P2_..._detruite_1024-1` | 2,48 gp | 432 583 | |
| `P4_..._detruite_1024-1` | **1,53 gp** | 410 368 | **retenu** |
| `P4_..._detruite_1024-2` | 1,17 gp | 377 263 | |

L'écart est de 7 % et 31 %, et il va dans le même sens que la matière totale
dans les deux cas.

⚠ **C'est un critère de lisibilité, pas de goût.** Si le jet le plus fin est le
plus beau, c'est un arbitrage d'Ethan, et il se change en une ligne du script.

## 3. Le camp des ruines est mesuré, pas déduit du nom

`R2_ruines_mur_tourelle_joueur_ouvrage_2x1` porte deux cellules. Le nom de
fichier suggère l'ordre joueur puis Ouvrage ; le script ne s'y fie pas et
**mesure la part de violet** : 0,0 % à gauche, 72,0 % à droite. Une assertion à
30 % refuse la planche si elle est un jour inversée, au lieu de produire deux
ruines de la mauvaise couleur.

## 4. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **54** |
| Couleurs hors palette | **0** |
| Occupation en 32 | 17,7 % de moyenne, **5,3 % au minimum** |
| Camp des ruines | assertion sur le violet, pas sur l'ordre du nom |
| Planche de contrôle en 64 | ✔ regardée, les dix-huit lisent comme des décombres |

## 5. ⚠ Quatre sprites sont très légers

`bat_o_terril_detruit` tombe à **5,3 % d'occupation** en 32, et
`bat_j_accumulateur_detruit`, `bat_j_centrale_detruit`,
`bat_j_raffinerie_detruit` sont entre 6 et 9 %. Un tas de décombres occupe
légitimement moins de place qu'un bâtiment debout, mais à ce niveau il faut
vérifier à l'écran que la case ne paraît pas vide.

Pour comparaison, les bâtiments intacts sont à 25–35 % d'occupation.

## 6. Reste ouvert

1. **Les quatre sprites légers** (§5).
2. **`P6_artilleries_joueur_1024-1` et sa détruite** ne sont traitées par aucun
   outil. Trois cellules chacune, vraisemblablement faucheuse, mortier et
   harpon — mais leurs tourelles viennent déjà des planches `T`. À arbitrer :
   double emploi, ou état détruit des trois artilleries ?
3. **`ruine_j` détonne** : elle lit vert pâle quand les quinze autres sprites
   détruits sont sombres. À regarder.
