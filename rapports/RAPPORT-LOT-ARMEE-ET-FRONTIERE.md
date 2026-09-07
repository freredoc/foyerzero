# Lot ARMÉE-ET-FRONTIÈRE — 03/09/2026

**Version produite : 0.79.0 · build 81.**
`npm test` → **967 pass / 0 fail** · `npm run build` → `dist/index.html`,
**3 343 043 octets**, 0 référence externe.

Quatre points d'Ethan, dans ses mots :

> ui armée : une barre : d'abord l'infanterie puis véhicule et avion
> pas de changement vitesse
> « comment le joueur choisit le niveau d'une pièce » cad ?
> code couleur frontiere : vert kaki joueur et l'autre violet ouvrage
> il faut que ça ressort sur le terrain.
> recolorise si il le faut

Deux sont du code, un est un arbitrage qui ferme un point ouvert, un est une
question à laquelle ce rapport répond en §3.

---

## 0. Ce que le lot coûte — il REND 10 896 octets

**Poste par poste, mesuré :**

| Poste | Octets |
|---|---|
| `atlas-limite-128.webp` (le seul embarqué) en base64 | **−11 608** |
| code, balisage, feuille | **+712** |
| **total** | **−10 896** |

`dist/index.html` passe de **3 353 939** à **3 343 043 octets**.
**25 `data:` avant, 25 après** — aucune image n'entre ni ne sort.

⚠⚠ **ET C'EST LA RECOLORISATION QUI REND CES OCTETS, PAS UNE ÉCONOMIE
CHERCHÉE.** L'atlas de limites passe de **19 178 à 10 472 octets** — 45 % de
moins — parce qu'un WebP q85 compresse quatre tons sombres et plats mieux que
l'or, l'ambre et le gris-bleu pâle qu'il portait. La grille 64, non embarquée,
suit : 14 646 → 8 406.

⚠ **LA BORNE T10 NE BOUGE PAS, ET RESTE À 3 400 000.** Une borne ne se baisse
pas parce qu'un lot rend — c'est la §5 de `CLAUDE.md` prise par l'autre bout.
Marge **56 957 octets, 1,68 %**, contre 46 061 et 1,37 % avant le lot : c'est le
premier lot depuis MURS qui desserre la marge au lieu de la pincer.

---

## 1. La palette de l'armée tient en une bande

### Ce qui change

`#offense-palette` passe de deux rangées qui tiennent à **une seule bande qui
défile**, `flex: 0 0 86px` inchangé. C'est le geste appliqué le matin même à la
palette du Chantier, et la demande est mot pour mot la même.

⚠⚠ **C'EST LE TROISIÈME ARBITRAGE SUR CETTE LIGNE, ET LES TROIS SE LISENT
ENSEMBLE.** Le lot 5A FILTRAIT — « une unité qu'on ne peut pas construire n'a
pas à occuper l'écran » — sur des colonnes de 82 px qui défilaient. Le 29/08 la
palette a cessé de filtrer, donc montré quatorze unités, donc passé à deux
rangées : « tu compresses tout dans l'ui ». Le motif était juste et avait un prix
que personne n'avait mesuré — **dans 86 px, deux rangées laissent 38 px par
vignette, sprite et libellé compris ; une seule en laisse 76.**

⚠ **LA HAUTEUR NE BOUGE PAS, ET C'EST LA MOITIÉ DE LA DEMANDE.** Les **288 px**
de chrome de l'Offense que `chantier.test.js` somme — 40 + 44 + 26 + 46 + 86 + 46
— ne bougent donc pas non plus, et la garde le vérifie sans être touchée.

⚠ **ET LA LARGEUR D'UNE COLONNE QUITTE LE JS POUR LA FEUILLE.** Tant que la
palette devait TENIR, seul le JS savait combien de vignettes il y avait, donc lui
seul pouvait poser `gridTemplateColumns`. Depuis qu'elle défile, `grid-auto-columns:
68px` est une constante de la feuille et le nombre de colonnes n'a plus à être
connu de personne.

### L'ordre des châssis — il était DÉJÀ juste, et il cesse d'être une coïncidence

⚠⚠ **MESURÉ AVANT D'ÉCRIRE UNE LIGNE : `UNITES` EST DÉJÀ ÉCRITE DANS L'ORDRE
QU'ETHAN DEMANDE** — cinq escouades, puis cinq blindés, puis quatre aéronefs, et
`unitesDeLaPalette` faisait `Object.keys(UNITES).map(…)`. **Ce lot ne déplace
donc AUCUNE vignette à l'écran**, et un test le relève au lieu de le supposer.

Ce qui change est le STATUT du fait. `ORDRE_CHASSIS = ['escouade', 'blinde',
'aeronef']` entre dans `src/data/combat.js` et la palette **trie** dessus :
l'ordre cesse d'être une propriété accidentelle de la table pour devenir une
propriété de la palette, qui tient encore le jour où quelqu'un insère une
quinzième unité au mauvais rang.

⚠⚠ **ET C'EST L'INVERSE D'`ORDRE_PALETTE` DE `data/base.js`, ÉCRITE LA VEILLE.**
Là-bas, aucune clé du roster ne disait « ce bâtiment vient tôt » : il a fallu
écrire les onze noms à la main, faute de grandeur à trier — et le rapport du lot
FREEZE-ET-PALETTE l'a dit de face. Ici la clé existe depuis toujours,
`UNITES[x].chassis` classe les quatorze : **on trie, on ne recopie pas.** Une
seconde liste de quatorze noms serait la première à oublier une unité.

⚠ **LE TRI EST STABLE, ET C'EST LA MOITIÉ QUI COMPTE.** Ethan a donné l'ordre des
TROIS châssis, pas celui des quatorze unités : à l'intérieur d'un groupe l'ordre
du roster fait foi. Un `sort` sur clé numérique est stable en JS depuis ES2019.

⚠ **UN CHÂSSIS HORS TABLE LÈVE, IL NE SE RANGE PAS EN FIN DE LISTE.** `-1` le
mettrait EN TÊTE, donc devant l'infanterie : la palette mentirait sur l'ordre
demandé et rien ne le dirait. Falsifié — un châssis inconnu fait tomber cinq
tests, pas zéro.

---

## 2. La frontière de territoire est recolorisée

### Le défaut était de CLARTÉ, pas seulement de teinte — et il se mesure

Les dessins livrés portaient leurs propres teintes : **or et ambre pour le
joueur, gris-bleu pâle pour l'Ouvrage**. Le rapport du lot TERRITOIRE l'avait
relevé comme « un arbitrage qui revient à Ethan » ; il est rendu.

Mais la moitié qui explique « il faut que ça ressorte » n'est pas la teinte.
Le sol de la carte est **CLAIR des deux côtés** : `TERRAIN_CARTE.rampes` porte
deux rampes dont les cinq clartés valent **L\* 58,1 · 62,9 · 68,0 · 73,0 · 77,9**,
rang par rang et à dessein — `FICHE-STYLE.md` §3 : « deux sols de clarté
différente donnent à un camp un camouflage que personne n'a décidé ».

**Mesuré sur l'ancienne frontière, ton par ton, écart de clarté au sol le plus
proche :**

| Camp | Ton | Part | L\* | Écart au sol |
|---|---|---|---|---|
| joueur | `#7E4A12` | 41,0 % | 36,7 | 21,4 |
| joueur | `#CD6F26` | 16,2 % | 56,6 | **1,5** |
| joueur | `#EAB82B` | 31,9 % | 77,2 | 4,2 |
| joueur | `#FFE984` | 11,0 % | 92,2 | 14,1 |
| Ouvrage | `#514A68` | 41,0 % | 33,2 | 24,9 |
| Ouvrage | `#7A6F99` | 16,2 % | 49,3 | **8,8** |
| Ouvrage | `#9FB3C5` | 31,9 % | 72,0 | 1,0 |
| Ouvrage | `#D8E2EA` | 11,0 % | 89,4 | 11,3 |

⚠⚠ **DEUX TONS SUR HUIT ÉTAIENT À MOINS DE DEUX DE CLARTÉ D'UN TON DE SOL** —
`#CD6F26` à **1,5** et `#9FB3C5` à **1,0**, soit **48 % du dessin** à eux deux.
Ces pixels-là étaient invisibles sur le terrain. C'est exactement le rapport
d'Ethan, et ce n'était pas une affaire de goût.

### Les quatre tons les plus sombres de chaque rampe — et le choix est mesuré

Les deux rampes de camp de `FICHE-STYLE.md` §3 portent cinq tons ; le dessin en
a quatre. Lesquels quatre :

| Rampe | Écart minimal au sol | Écart interne dedans → dehors |
|---|---|---|
| kaki, tons **1-4** | **10,2** | **27,4** |
| kaki, tons 2-5 | 3,5 | 24,4 |
| ardoise, tons **1-4** | **28,1** | **17,7** |
| ardoise, tons 2-5 | 16,6 | 17,8 |

⚠⚠ **LES TONS 1-4 GAGNENT DES DEUX CÔTÉS, SUR LES DEUX RAMPES.** Prendre les
tons 2 à 5 laisserait le kaki `#8C9A72` à L\* 61,6, donc à **3,5** du sol le plus
sombre : ce serait refaire la faute qu'on corrige. Et l'écart interne — celui qui
porte le dedans et le dehors — ne se paie pas : 27,4 contre 24,4 en kaki, 17,7
contre 17,8 en ardoise.

**Après recolorisation, écart au sol le plus proche :**

| Camp | Ton | Part | L\* | Écart |
|---|---|---|---|---|
| joueur | `#161914` | 41,0 % | 8,3 | 49,8 |
| joueur | `#343A2C` | 16,2 % | 23,5 | 34,6 |
| joueur | `#4E5742` | 31,9 % | 35,7 | 22,4 |
| joueur | `#6A7658` | 11,0 % | 47,9 | **10,2** |
| Ouvrage | `#0D0B12` | 41,0 % | 3,3 | 54,8 |
| Ouvrage | `#231D2E` | 16,2 % | 12,2 | 45,9 |
| Ouvrage | `#382E47` | 31,9 % | 21,0 | 37,1 |
| Ouvrage | `#4E4160` | 11,0 % | 30,0 | **28,1** |

Le pire écart passe de **1,5 à 10,2** — **6,8 fois**. Et les parts sont
identiques rang par rang, ce qui dit que la substitution a été une
correspondance et non un redessin.

⚠ **LE JOUEUR EST VERT PARCE QUE LA FICHE LE DIT**, pas parce qu'Ethan l'a
demandé sans raison : « la rampe kaki ci-dessus est celle du joueur,
définitivement », et « aucun vert dans le terrain, nulle part : le vert est la
couleur du joueur ». C'est ce qui rend le kaki lisible comme sien sur un sol de
terre cuite — aucune tuile de sol ne peut le citer.

### Comment la substitution est écrite

⚠⚠ **ON RANGE PAR CLARTÉ, PAS PAR FRÉQUENCE, ET LA RAISON N'EST PAS
COSMÉTIQUE.** Les deux donneraient le même résultat sur la livraison — mesuré,
les quatre tons de chaque camp ont exactement les mêmes parts, 41,0 · 31,9 ·
16,2 · 11,0 % — mais la fréquence n'a aucun rapport avec ce qu'on veut
préserver : c'est l'**ordre des clartés** qui porte le dedans et le dehors. Un
rangement monotone garde la lecture PAR CONSTRUCTION, quel que soit le dessin
qui arrive.

⚠⚠ **EXACTEMENT QUATRE TONS, ET LE COMPTE EST ASSERTÉ AVANT LA SUBSTITUTION.**
Une cinquième teinte — une planche anticrénelée, un dessin repris — n'aurait
aucune image dans la rampe : sans cette garde elle passerait TELLE QUELLE, et la
frontière ressortirait mi-kaki mi-or sans que rien ne le dise.

⚠⚠ **ET L'ORDRE DES TROIS GESTES N'EST PAS LIBRE : `assert_fond`, PUIS
RECOLORISER, PUIS `baver`.** `assert_fond` travaille sur le RVB de la LIVRAISON
— c'est ce qui lui permet de mesurer que la planche est sans anticrénelage —,
donc la recolorisation vient après lui, et **aucune des assertions du lot
TERRITOIRE n'est touchée**. Et `baver` vient après elle : il étend la couleur
opaque dans le transparent, donc baver d'abord laisserait dans la frange le RVB
des anciennes teintes, que le WebP q85 lisserait en un **liseré or autour d'une
frontière kaki** — exactement le liseré rouge sombre mesuré au lot MURS, dans
une autre couleur.

### La garde a manqué la moitié qui compte, et elle a été réécrite

⚠⚠ **UNE PREMIÈRE VERSION DE `LIMITE T8` NE COMPARAIT QUE L'ENSEMBLE DES TONS À
LA RAMPE, ET LA FALSIFICATION L'A DÉBUSQUÉE.** Renverser le rangement par clarté
dans l'outil — donc peindre la bande extérieure du creux et la bande intérieure
de la lumière, c'est-à-dire **inverser le dedans et le dehors** — la laissait
**entièrement verte** : la permutation ne fait sortir aucun ton de la rampe. Or
c'est précisément ce que la frontière apporte sur un trait de deux pixels.

La garde nomme donc la propriété : sur `carre`, dont le territoire est dedans, la
**ligne logique 0 est plus claire que la ligne 1**. Mesuré : L\* moyen **38,7
contre 10,0** côté joueur, **23,3 contre 4,4** côté Ouvrage ; la borne est à 8.
Après réécriture, le renversement fait tomber le test.

⚠ **ET LA BORNE DE CONTRASTE N'EST PAS VACUEUSE : LES DEUX TONS QUI ONT FAIT LE
RAPPORT D'ETHAN LA FRANCHISSENT.** Le test asserte de face que `#CD6F26` et
`#9FB3C5` — les deux anciens tons mesurés à 1,5 et 8,8 — seraient REFUSÉS par le
même prédicat. Sans cette paire, « écart au moins 8 » pourrait être n'importe
quel nombre.

⚠ **« VERT » ET « VIOLET » SE VÉRIFIENT AUSSI.** Un rangement par clarté seule
serait vrai de deux rampes grises : le test exige le VERT dominant sur les quatre
tons du joueur et le BLEU dominant sur les quatre de l'Ouvrage.

⚠ **LA RAMPE SE LIT DANS `FICHE-STYLE.md`, ELLE NE SE RECOPIE PAS UNE TROISIÈME
FOIS.** Elle est déjà transcrite dans `tools/limites.py` et dans
`test/banc.test.js` ; le test l'extrait du document, qui fait autorité sur le
style, et asserte que l'outil lui a obéi.

---

## 3. « Comment le joueur choisit le niveau d'une pièce », c'est-à-dire ?

C'est une phrase de MON rapport de la veille, pas une demande d'Ethan, et elle
signalait un trou. Le voici en clair.

**Une pièce de garnison ou d'armée porte un niveau, et rien ne le monte.**
`etat.garnison` et `etat.armee` rangent `{ id, rangee|vague, colonne, niveau,
degatsMilli }` depuis le 28/08 : le niveau est **par pièce**. Mais les deux
éditeurs portent UN niveau pour toute la grille et le recopient sur chaque pièce
posée, et le jeu pose au **niveau 1**. Conséquences mesurables aujourd'hui :

- `niveauDeLArmee` et `niveauDeLaDefense` sont des moyennes de niveaux qui
  valent tous 1 : elles affichent **1,0**, toujours ;
- `data/couts-militaires.js` porte l'ancre du niveau 2 de chaque entité — donc
  **le prix d'une montée est arbitré depuis le 28/08** ;
- mais **aucune fonction ne monte une pièce** : les boutons « Améliorer » de la
  bande Défense et de l'Offense portent `null` dans leur table et disent qu'ils
  n'ont pas de moteur ;
- et **ce que GAGNE une pièce améliorée n'est pas arbitré** non plus.

Ce que le lot de la veille a fait, c'est **nommer le plafond** : `POINTS_ARMEE`
dit depuis toujours que le bâtiment de commandement « fixe aussi le niveau
maximal des unités de son côté », et `niveauDesPieces` entre dans les deux
éditeurs pour que la borne soit APPLIQUÉE — le plafond lève quand il est
franchi, et le défaut vaut le plafond, si bien que rien ne bouge pour un
appelant existant.

**Ce qui reste à trancher, et c'est à Ethan :** par quel geste le joueur monte
une pièce. Trois formes possibles, chacune d'une ligne à brancher —
un niveau choisi À LA POSE (un curseur dans la palette, la pièce coûte ce
niveau) ; une pièce posée au niveau 1 puis AMÉLIORÉE une par une, comme un
bâtiment ; ou un niveau GLOBAL de la force, monté d'un coup, qui s'applique à
tout ce qui est posé. Le moteur est prêt pour les trois — le niveau est déjà par
pièce, le coût est déjà tabulé, le plafond est déjà appliqué. Ce qui manque est
la décision, et le gain d'un niveau.

---

## 4. Les vitesses : rien n'a été touché

Ethan : « pas de changement vitesse ». L'arbitrage est rendu et il ferme le point
laissé ouvert la veille. Pour mémoire, ce que le relevé de la veille disait :
quatre valeurs dans `UNITES` — **60 (six unités) · 90 (deux) · 120 (cinq) · 240
(une)** —, fidèles au §6 de `RELEVE-TA-COURBES-2.md` ligne par ligne, et
`deplacement` ajoute `p.vitesseMilli` par tick. **Pas un octet de `UNITES` n'a
bougé.**

---

## 5. Tests

**Le compte passe de 966 à 967.** Un test entre — `LIMITE T8` —, et deux sont
RETOURNÉS sans qu'aucune assertion soit perdue :

- `offense — la palette ne défile pas : ses colonnes se calculent` devient
  `offense — UNE bande qui défile, la hauteur gardée, et les châssis dans
  l'ordre`. Il asserte **plus** qu'avant : le défilement, la hauteur gardée, la
  largeur de colonne dans la feuille, l'absence de colonnes posées par le JS,
  l'ordre des châssis mesuré SUR LA PALETTE, et l'identité du tri sur le roster
  d'aujourd'hui.
- `DEFILE_A_L_HORIZONTALE` de `chantier.test.js` accueille `offense-palette`.

⚠⚠ **ET CETTE SECONDE EXCEPTION ÉTAIT INERTE, TROUVÉE EN LA MESURANT.** La
boucle de l'interdiction ne portait que sur `barres`, c'est-à-dire sur les six
barres du Chantier : `offense-contexte` et `offense-palette` **n'ont jamais été
atteints par l'interdiction**, si bien qu'ajouter la palette à l'exception ne
changeait RIEN. Une exception à une règle qui ne couvre pas la barre exceptée ne
dit rien du tout. La boucle balaie donc `[...barres, ...barresOffense]` : la
palette de l'Offense est exceptée pour de bon, et **`offense-contexte` est gardé
pour la première fois** — falsifié dans les deux sens.

**Neuf falsifications, huit chutes, et la neuvième est déclarée :**

| # | Falsification | Verdict |
|---|---|---|
| 1 | `ORDRE_CHASSIS` renversé | 1 fail |
| 2 | le `sort` de la palette retiré | **0 fail — DÉCLARÉ** |
| 3 | la palette de l'Offense repasse à deux rangées | 1 fail |
| 4 | sa hauteur portée à 120 px | 1 fail |
| 5 | `gridTemplateColumns` reposé par le JS | 1 fail |
| 6 | un châssis hors de `ORDRE_CHASSIS` | 5 fail |
| 7 | `offense-contexte` se met à défiler | 1 fail |
| 8 | la palette de l'Offense cesse de défiler | 1 fail |
| 9 | les tons 2-5 de chaque rampe | 1 fail |
| 10 | les deux camps échangés | 1 fail |
| 11 | le rangement par clarté renversé | 1 fail (après réécriture) |
| 12 | la recolorisation retirée | 1 fail |

⚠⚠ **LA DEUXIÈME NE MORD PAS, ET ELLE SE DÉCLARE.** Retirer le `sort`
d'`unitesDeLaPalette` laisse `offense.test.js` **entièrement vert — 22 pass / 0
fail, mesuré** —, `UNITES` étant déjà écrite dans le bon ordre. Ce que la garde
attrape est l'ordre lui-même (falsification 1) et un châssis hors table
(falsification 6) ; elle tombera pour de bon le jour où une quinzième unité sera
insérée au mauvais rang, et c'est ce qu'on lui demande. Un test qui ne peut
tomber sur aucun état d'aujourd'hui se déclare, il ne se compte pas.

⚠ **LA ONZIÈME EST CELLE QUI A FAIT RÉÉCRIRE UNE GARDE**, et elle est comptée
dans son état APRÈS réécriture : voir §2.

---

## 6. Vérificateurs

- **`python3 tools/entrees.py --verifier`** → **95 consommées / 95 déclarées,
  79 dormantes / 79 déclarées**, `art/sourcesstandby/` : 34 fichiers, **0 lu**.
  Inchangé — le lot lit exactement les mêmes planches, il les peint autrement.
- **`python3 tools/atlas.py`** (mode vérification) → rien à écrire : les
  dix-huit atlas du dépôt sont ceux que le couseur produit. `src/data/atlas.js`
  est **identique** — la recolorisation ne renomme aucun sprite.
- **`python3 tools/verifier.py`** → **1 005 identiques · 0 différent ·
  0 nouveau · 0 MANQUANT**, verdict **VERT**, en **329,6 s**. Il était dû : le
  lot touche `art/` et `tools/`.
  ⚠ **LE COMPTE NE BOUGE PAS, ET C'EST CE QU'ON LUI DEMANDE** — la
  recolorisation remplace des octets, elle n'ajoute ni ne retire un fichier. Les
  cinquante-deux limites ont changé, et elles seules ; c'est ce que ces quatre
  nombres disent.

⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 24.** Aucun champ n'entre dans
l'état : un ordre d'affichage, une barre qui défile, et des pixels.
