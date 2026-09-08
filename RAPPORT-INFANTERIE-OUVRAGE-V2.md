# RAPPORT — infanterie de l'Ouvrage, v2

Neuf jets, neuf pièces. Meute et Perceurs sont portées de trois à cinq figures
par recopie au pixel près, dans la formation mesurée sur la Carapace. Aucun
pixel redessiné, aucun rééchantillonnage.

---

## 1. Attribution

Trois signaux, et ils concordent tous les trois : l'accent donne la cible, le
nombre de figures distingue les deux paires de même accent, l'extrémité fine
donne la pose.

| Jet | Nom livré | Ce qui l'attribue |
|---|---|---|
| `77942` | `off_o_meute` | blanc, 3 figures larges (391 × 372), extrémité haute fine (21 px) |
| `74018` | `off_o_meute_def` | blanc, 3 figures, aucune extrémité fine — armes de flanc, vue de face |
| `77940` | `off_o_guetteur` | blanc, 3 figures hautes (309 × 583), long tube — *Sniper Team* |
| `77941` | `off_o_guetteur_def` | blanc, tube vers nous (34 px en bas) |
| `74019` | `off_o_perceurs` | jaune, missile vers le haut — *Missile Squad* |
| `74020` | `off_o_perceurs_def` | jaune, missile vers nous |
| `77939` | `off_o_fouisseurs` | jaune, **une seule figure**, 942 × 926 |
| `74021` | `off_o_carapace` | rouge, **5 figures**, canon vers le haut |
| `74022` | `off_o_carapace_def` | rouge, 5 figures, canon vers nous |

Les accents suivent `combat.js` sans exception : Meute et Guetteur sont
`antiInfanterie`, Perceurs et Fouisseurs `antiStructure`, Carapace
`antiVehicule`. Les deux blancs se départagent par le tube du tireur d'élite.

**La pose se mesure.** En attaque on voit le dos et l'arme pointe au loin, donc
vers le haut de l'image : la boîte est fine en haut et le centre de masse tombe
en bas. En défense c'est l'inverse. Mesuré, largeur à 6 % de chaque extrémité :

| | haut | bas | centre de masse | pose |
|---|---|---|---|---|
| `77940` | 28 | 150 | 0,65 | attaque |
| `77941` | 121 | 34 | 0,38 | défense |
| `74019` | 40 | 180 | 0,60 | attaque |
| `74020` | 160 | 40 | 0,41 | défense |
| `74021` | 33 | 189 | 0,65 | attaque |
| `74022` | 107 | 34 | 0,42 | défense |

`74018` est le seul cas que ce test ne tranche pas — 163 en haut, 160 en bas,
centre de masse à 0,50. Il est symétrique parce qu'il porte ses armes sur les
flancs. C'est `77942`, avec son extrémité haute de 21 px, qui force le couple :
l'un des deux est l'attaque, et ce n'est pas lui.

---

## 2. Le recoupage à cinq

**La formation n'est pas inventée, elle est lue.** Le script ouvre
`off_o_carapace`, la seule escouade déjà à cinq, y repère les cinq figures et en
tire deux nombres : **écart horizontal 0,655 largeur de figure, écart vertical
0,895 largeur**. Ils sont réappliqués tels quels aux deux escouades recoupées,
dans les deux poses.

⚠ **L'écart vertical se normalise par la largeur, pas par la hauteur.** Une
figure qui pointe une arme vers le haut est haute sans occuper plus de sol : les
Perceurs font 459 px de haut pour 342 de large, la Carapace 358 pour 311.
Normaliser par la hauteur aurait écarté les Perceurs d'un tiers de plus que la
Carapace pour la même emprise au sol, et le groupe se serait délité.

| Pièce | Figure | Écarts appliqués | Toile | Pixels recouverts |
|---|---|---|---|---|
| `off_o_meute` | 391 × 372 | 256 × 349 | 951 × 1119 | **0** |
| `off_o_meute_def` | 412 × 314 | 269 × 368 | 999 × 1099 | **0** |
| `off_o_perceurs` | 342 × 459 | 224 × 305 | 838 × 1118 | **0** |
| `off_o_perceurs_def` | 349 × 406 | 228 × 312 | 854 × 1078 | **0** |

Le collage va du plus loin au plus proche, parce que les **boîtes** se
chevauchent — jusqu'à 154 px chez les Perceurs — et que l'ordre déciderait alors
qui passe devant. En pratique aucun **pixel** ne se recouvre : les boîtes se
croisent là où les figures sont fines, à hauteur du missile. Le script compte et
le dit, c'est la seule façon de ne pas confondre les deux.

Les toiles ne font plus 1024 : elles sont taillées sur la formation, avec 24 px
de marge. Sans effet, la source étant recadrée sur sa boîte à la découpe.

---

## 3. Une divergence de comptage entre les deux camps

A6 est retirée, donc **le nombre de figures dit la nature de l'unité**. Or il ne
dit pas la même chose des deux côtés :

| Clé | Joueur | Ouvrage après recoupage |
|---|---|---|
| `meute` | 3 | **5** |
| `guetteur` | **5** | 3 |
| `perceurs` | 5 | 5 |
| `fouisseurs` | 1 | 1 |
| `carapace` | **2** | 5 |

Trois lignes sur cinq divergent, et la Meute et le Guetteur sont exactement
inversés. Si le nombre de figures veut dire quelque chose, les Fusiliers du
joueur et la Meute de l'Ouvrage — même clé, même rôle — le disent différemment.
Deux issues possibles : aligner les comptes, ou acter que la formation est un
trait de camp et non d'unité. Rien à refaire tant que ce n'est pas tranché ; le
recoupage se rejoue en une commande si tu changes les nombres.

---

## 4. Passage au fond vert, et un point rose réparé

Neuf pièces au `#00FF00`, **neuf clés relues vertes, zéro magenta restant**.

La Meute portait une tache de 8 px à `#B70B97` *à l'intérieur* de la figure —
un artefact de compression, ni franc magenta (qui serait du fond) ni couleur du
dessin. Le recoupage l'aurait recopiée cinq fois. Une quatrième règle a été
ajoutée à `fond-vert-ouvrage.py` : un résidu enfermé et pas franc
(90 ≤ d < 140) est remplacé par la médiane de son voisinage sain. Les lots
défenses et aéronefs déjà livrés en comptaient 2 et 0 — inutile de les réémettre.

---

## 5. Ce qui reste

**L'emprise n'est toujours pas appliquée**, même arbitrage ouvert que pour les
aéronefs. À 40 px, une escouade de cinq et le Fouisseur solitaire occupent la
même case : c'est la décision d'empreinte uniforme prise côté joueur, et elle
tient ici aussi.

**Le liseré blanc reste le plus faible des trois**, comme sur les défenses.
Meute et Guetteur sont les deux escouades concernées.

**Compte du camp.** 13 pièces d'unités livrées sur les 27 du miroir joueur —
9 escouades et 4 aéronefs. Restent les 14 pièces de marcheurs, qui attendent la
confirmation du 27.

**Rien n'est câblé.** Neuf sources, pas neuf sprites.

---

## 6. Contenu de l'archive

```
art/sources/off_o_{meute,guetteur,perceurs,carapace}{,_def}.png
art/sources/off_o_fouisseurs.png
art/essai/PLANCHE-infanterie-ouvrage-40.png
tools/fond-vert-ouvrage.py                     remplace la version du lot défenses
tools/recoupage-escouades-ouvrage.py
tools/planche-controle-infanterie-ouvrage.py
```
