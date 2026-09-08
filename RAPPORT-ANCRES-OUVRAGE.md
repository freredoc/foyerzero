# RAPPORT — ancres de l'Ouvrage, mesurées avec les outils du dépôt

`tools/ancres-ouvrage.py` ne réimplémente rien : `ancre`, `pivot`,
`cote_du_carre`, `boite_dans_la_case` et `ancre_de_case` sont importées de
`chassis.py`, `ancres-blindes.py` et `ancres-defense.py`. Deux JSON sortent, au
format exact de ceux du joueur.

---

## 1. Deux écarts obligatoires, et un seul touche le dépôt

**Le masque.** Les deux outils du joueur ne connaissent que le magenta ; les
sources de l'Ouvrage sont sur vert. On passe par `cond.est_fond_sujet`, qui lit
la clé sur les quatre coins. Appelées telles quelles, leurs fonctions auraient
rendu une image entièrement « sujet » et l'ancre serait tombée au milieu du fond.

**Le garde-fou de décalage — celui-ci modifie `tools/chassis.py`.** `ancre`
écarte un candidat dont le centre est à plus de 22 % du centre de la pièce, pour
rejeter les chenilles. Les **six** socles de défense de l'Ouvrage portent leur
logement 25 à 35 % au-dessus du centre — le socle carré a une haute face avant
sous son plateau, le marcheur a ses pattes — et les six étaient rejetés, alors
que leur rondeur vaut 0,65 à 0,83 quand une chenille est à 0,10.

Le seuil devient le paramètre `decal_max`, **défaut 0,22 inchangé**. Le contrôle
est celui qui compte : `ancres-defense.py` et `ancres-blindes.py` rejoués après
le changement rendent **des JSON et des sorties texte identiques au bit près**.
Les neuf coques de l'Ouvrage passent au défaut ; seules les défenses demandent
0,40.

---

## 2. Ce que les ancres disent

| Coque | Logement | Carré de tourelle |
|---|---|---|
| `off_o_ratisseur_chassis` | 12,8 % = 124 px | 29,25 % de case |
| `off_o_ratisseur_chassis_def` | 21,5 % = 197 px | 49,13 % |
| `off_o_fendeur_chassis` | 28,6 % = 233 px | **95,49 %** |
| `off_o_fendeur_chassis_def` | 30,5 % = 232 px | **103,71 %** |
| `off_o_broyeur_chassis` | 27,2 % = 249 px | **116,58 %** |
| `off_o_broyeur_chassis_def` | 26,4 % = 249 px | **113,15 %** |
| `off_o_belier_chassis` | 29,6 % = 225 px | 58,73 % |
| `off_o_belier_chassis_def` | 28,2 % = 226 px | 55,95 % |
| `off_o_pilon_chassis` | 22,5 % = 216 px | 75,05 % |

| Socle | Logement | Carré |
|---|---|---|
| `socle_def_o_casemate` | 31,4 % = 278 px | 63,02 % |
| `socle_def_o_creneau` | 32,8 % = 300 px | 93,37 % |
| `socle_def_o_batterie` | 32,9 % = 301 px | 80,11 % |
| `socle_def_o_faucheuse` | 20,5 % = 202 px | 91,58 % |
| `socle_def_o_mortier` | 20,5 % = 202 px | 83,32 % |
| `socle_def_o_harpon` | 20,4 % = 201 px | 82,29 % |

---

## 3. Les échelles du joueur ne transfèrent pas — quatre carrés dépassent la case

À 2,2, l'échelle des blindés du joueur, **le carré du Broyeur fait 116,6 % de sa
case** et celui du Chasseur 103,7 %. Le montage joint le montre : ces deux
tourelles avalent leur coque, quand celle du Ratisseur est minuscule à 29,3 %.

La cause se mesure : la marge de rotation des tourelles de l'Ouvrage va de
**×1,44 (Bélier) à ×2,47 (Fendeur)** — leur canon sort loin d'une petite embase.
Le carré est proportionnel à cette marge, donc à échelle égale il varie du simple
au double d'une tourelle à l'autre.

Échelle maximale par pièce pour que le carré tienne à 90 % de la case :

| | Échelle actuelle | Échelle max |
|---|---|---|
| Ratisseur | 2,2 | 6,77 · 4,03 |
| Bélier | 2,2 | 3,37 · 3,54 |
| Pilon | 2,2 | 2,64 |
| Fendeur | 2,2 | **2,07 · 1,91** |
| Broyeur | 2,2 | **1,70 · 1,75** |
| Créneau | 1,6 | **1,54** |
| Batterie | 1,6 | 1,80 |
| Casemate | 1,6 | 2,28 |
| Artilleries | 2,4 | 2,36 · 2,59 · 2,62 |

Une échelle unique pour les blindés de l'Ouvrage vaut donc **1,70** — mais elle
rend la tourelle du Ratisseur illisible, exactement le défaut que l'échelle 2,2
avait été choisie pour corriger côté joueur. Trois issues, et c'est un
arbitrage : une échelle par camp, une échelle par pièce, ou des embases
redessinées plus larges.

---

## 4. Contenu

```
art/sprites/ancres-blindes-ouvrage.json
art/sprites/ancres-defense-ouvrage.json
art/essai/MONTAGE-OUVRAGE-40.png
tools/ancres-ouvrage.py
tools/montage-ouvrage-40.py      montage À LA FORMULE du rendu, pas à l'œil
tools/chassis.py                 `ancre` prend `decal_max`, défaut inchangé
```
