# RAPPORT — lot CONDITIONNEMENT-ZÉNITH

**19/09/2026 — branche `claude/conditionnement-zenith-recentrage`, depuis `main` =
`105d4fc` (PR #160 fusionnée, arbre identique à la branche du lot précédent).**
**Version et build réellement produits : `0.99.68` · build `180`.** `dist/index.html`
passe de 9 409 289 à 9 418 621 octets (+9 332 : trois atlas recousus, `socle`
grossit, `defense` maigrit). Le bump est dû.

`npm run check` : **vert avant** (1 643 tests, 1 642 pass · 0 fail · 1 skipped) et
**vert après** (1 645 tests, 1 644 pass · 0 fail · 1 skipped), Node 22.23.2.
`SAVE_VERSION` = 38, inchangé — vérifié dans `src/sim/state.js`, rien n'entre dans
l'état.

Ce lot ferme l'état transitoire d'ANCRES-ZÉNITH : ancres zénithales sur des
sprites encore à 75°, 44 sprites concernés. Il ne touche ni `ECHELLE`, ni un
dessin, ni les 23 sources encore hors dépôt.

---

## 0. Pré-checks

| # | Pré-check | Relevé |
|---|---|---|
| 1 | `git pull` ; PR #160 fusionnée | `main` = `105d4fc`, squash de la branche du lot précédent, `git diff` vide entre les deux |
| 2 | `CLAUDE.md` ; `npm run check` avant | lu (0.99.67 · 179) ; vert, 1 642 pass · 0 fail · 1 skipped |
| 3 | les 22 sources entrées, les 22 `*_75_ECARTE.png` | présentes ; déclaration : 501 consommées · 175 dormantes dont 22 `_75_ECARTE` |

---

## 1. Les douze tourelles : côté et pivot, avant / après

Le mode `carre` de `joueur_v2.py` — « aucun recadrage, la planche EST le sprite »
— exige le pivot au centre exact du fichier et un carré de rotation qui tient
dans la planche. Mesuré sur les douze sources telles que livrées, pivot par la
règle du lot précédent (le plus grand disque inscrit) :

| tourelle | planche | pivot (x, y) | écart au centre | carré | tient | → planche | → pivot | reste |
|---|---|---|---|---|---|---|---|---|
| def_j_casemate | 1254 | 627,5 · 774,6 | 147,6 px · 11,77 % | 1212 | oui | **1216** | 607,5 · 607,6 (centre 608) | 0,5 · 0,4 |
| def_j_creneau | 1254 | 627,9 · 793,4 | 166,4 px · 13,27 % | 1430 | NON | **1434** | 716,9 · 717,4 (717) | 0,1 · 0,4 |
| def_j_batterie | 1254 | 628,2 · 795,1 | 168,1 px · 13,40 % | 1372 | NON | **1376** | 688,2 · 688,1 (688) | 0,2 · 0,1 |
| def_j_faucheuse | 1254 | 627,5 · 825,9 | 198,9 px · 15,86 % | 1496 | NON | **1500** | 749,5 · 749,9 (750) | 0,5 · 0,1 |
| def_j_mortier | 1254 | 627,5 · 851,6 | 224,6 px · 17,91 % | 1638 | NON | **1642** | 821,5 · 820,6 (821) | 0,5 · 0,4 |
| def_j_harpon | 1254 | 627,0 · 780,7 | 153,7 px · 12,25 % | 1378 | NON | **1382** | 691,0 · 690,7 (691) | 0,0 · 0,3 |
| def_o_casemate | 1024 | 511,8 · 533,2 | 21,2 px · 2,07 % | 894 | oui | **898** | 448,8 · 449,2 (449) | 0,2 · 0,2 |
| def_o_creneau | 1024 | 511,8 · 606,7 | 94,7 px · 9,25 % | 1150 | NON | **1154** | 576,8 · 576,7 (577) | 0,2 · 0,3 |
| def_o_batterie | 1024 | 512,8 · 639,3 | 127,3 px · 12,43 % | 1176 | NON | **1180** | 589,8 · 590,3 (590) | 0,2 · 0,3 |
| def_o_faucheuse | 1024 | 511,9 · 710,3 | 198,3 px · 19,36 % | 1390 | NON | **1394** | 696,9 · 697,3 (697) | 0,1 · 0,3 |
| def_o_mortier | 1024 | 512,5 · 653,9 | 141,9 px · 13,86 % | 1270 | NON | **1274** | 637,5 · 636,9 (637) | 0,5 · 0,1 |
| def_o_harpon | 1024 | 510,2 · 509,9 | 2,8 px · 0,27 % | 1054 | NON | **1058** | 529,2 · 528,9 (529) | 0,2 · 0,1 |

Le brief annonçait 0 à 2 px en x, +22 à +224 px en y, dix carrés sur douze plus
grands que la planche : relevé 0 à 2,8 px en x, +21 à +225 en y, dix sur douze —
concordant. Le Harpon de l'Ouvrage est le seul déjà centré (2,8 px), et il
tombe quand même : son carré (1 054) dépasse sa planche (1 024).

**Geste :** `tools/recentrer-tourelles-ouvrage.py` — une TRANSLATION entière,
rien d'autre. Le sujet (masque `est_fond_sujet`, celui de toute la chaîne) est
recopié tel quel dans une toile carrée remplie de la clé pure, côté = carré de
rotation + 4 px de marge (2 de chaque côté, la constante historique du script),
arrondi au pair. Les trois contrôles du script passent sur les douze — sujet
conservé au pixel ET à la somme des couleurs, pivot à ≤ 0,5 px du centre,
carré tenu — et la sortie brute est celle du tableau (« reste » = écart
résiduel du pivot au centre, le demi-pixel de l'arrondi). Le dessin ne bouge
pas d'un pixel par rapport à son pivot ; seul le cadre change. ⚠ Écart au brief
déclaré : « côté égal au carré arrondi au pair supérieur » → **carré + 4**, la
marge que le script a toujours prise et sans laquelle un pixel à distance
exactement maximale pourrait tomber à un demi-pixel du bord après l'arrondi de
la translation.

Les douze sources sont remplacées EN PLACE dans `art/sources/` (brief §1). Les
versions non recentrées restent lisibles à `105d4fc` et dans
`claudax/sprite/conditionne/`.

⚠⚠ **LE SCRIPT ÉTAIT CASSÉ DEPUIS ANCRES-ZÉNITH, ET RIEN NE LE DISAIT.** Il
exécutait le SOURCE de `pivot` extrait de `ancres-defense.py` avec `np` pour
seul nom global ; depuis que `pivot` est le disque inscrit il demande
`scipy.ndimage` — `NameError: name 'nd' is not defined`, reproduit avant de
toucher une ligne. Réparé par import des deux modules d'ancres, et généralisé :
la règle d'embase est celle DE LA FAMILLE (disque inscrit pour `def_*`, tambour
d'`ancres-blindes` pour `off_*_tourelle` — la même que celle qui a recentré les
cinq blindés de l'Ouvrage le 07/09), le masque est `est_fond_sujet` (les
sources du joueur ont un fond BRUITÉ à 5 000 couleurs, coins à (239, 14, 239) ;
l'ancien « > 90 de la clé en somme » divergeait sur la frange), et les noms se
passent en arguments. Aucun outil n'entre dans `tools/` : 45, inchangé.

**Les quatre JSON d'ancres se reproduisent au caractère près sur les sources
recentrées** (rejoués sous `FZ_SPRITES`, CRLF de Windows retirés) : pivot et
carré de rotation sont invariants par translation — mesuré, pas supposé.

---

## 2. Conditionner et coudre

`joueur_v2.py` et `ouvrage_v2.py` rejoués sous `FZ_SPRITES` dans un dossier
temporaire, comparés au **pixel** au dépôt :

```
sprites : 168 produits — identiques au pixel 124, différents 44
  chassis/{64,128}/off_j_pilon_chassis  ·  defense/{64,128}/def_{j,o}_{6}  ·  socle/{64,128}/socle_def_o_{6} + socle_def_j_{casemate,creneau,batterie}
```

**Seuls les 44 sont copiés** dans `art/sprites/` — les 124 identiques au pixel ne
sont pas rafraîchis pour l'encodeur PNG de cette machine (`CLAUDE.md` §6). Le
mode `carre` s'applique bel et bien une fois le §1 fait : les douze tourelles
sortent centrées sur leur embase dans leur cellule (planche de contrôle jointe
au rapport, `rapports/planche-conditionnement-zenith-128.png`).

`python tools/atlas.py --ecrire --forcer defense --forcer socle --forcer chassis` :

| atlas | avant (octets) | après | Δ |
|---|---|---|---|
| atlas-defense-128.webp | 65 050 | **59 120** | −5 930 — les carrés de tourelle sont vides à 59–90 % |
| atlas-defense-64.webp | 27 124 | **24 648** | −2 476 |
| atlas-socle-128.webp | 53 918 | **66 600** | +12 682 — un disque peint remplace un trou transparent |
| atlas-socle-64.webp | 21 750 | **26 344** | +4 594 |
| atlas-chassis-128.webp | 72 842 | **73 090** | +248 |
| atlas-chassis-64.webp | 27 802 | **27 824** | +22 |

`src/data/atlas.js` **identique** (aucun nom, aucune géométrie ne change : 18 ·
12 · 18 des deux côtés). `atlas-empreintes.json` réécrit (25 lignes : les 22
empreintes de sprites 128 et les trois d'atlas). `atlas.py --verifier` rend
ensuite **17 identiques · 3 différents** — `carte-64`, `carte-128`,
`interface-128`, l'encodeur WebP de la machine, exactement ce que l'arbre
pristine rendait avant le lot ; ils sont laissés où ils étaient.

---

## 3. T1 et T2

### T1 — `CZ T1`, les tourelles sont centrées sur leur pivot

**Montage.** `test/ancres-zenith.test.js`, dans `npm run check`. Pour chacune des
douze sources, le pivot est refait en JavaScript par une voie indépendante de
l'outil : masque « à 140 ou plus du magenta » au quart de la résolution (bloc
4 × 4 sujet à la majorité), **transformée de distance euclidienne exacte**
(Felzenszwalb–Huttenlocher, colonnes puis lignes), centre du plateau du maximum
à un centième du rayon. La distance du pixel de sujet le plus loin du centre du
FICHIER est mesurée à pleine résolution. Montage falsifiable : le rayon trouvé
doit dépasser 10 % du côté, sinon la mesure a pris un rivet pour l'embase.

**Assertions.** Écart pivot–centre du fichier < 1 % du côté ; aucun pixel de
sujet à plus d'une demi-planche du centre.

**Rouge avant** (sources telles que livrées, tableau §1 — même mesure en Python
pour les douze ; le test Node s'arrête au premier) :

```
not ok 3 - CZ T1 — les douze tourelles zénithales sont centrées sur leur pivot, et leur carré tient dans la planche
  error: 'def_j_casemate : pivot en (627.4, 778.9) pour un centre à 627 — écart 151.9 px, 12.11 % du côté'
```

Écarts de 2,07 % (`def_o_casemate`) à 19,36 % (`def_o_faucheuse`) ; dix planches
trop petites pour leur carré ; `def_o_harpon` centré (0,27 %) mais son carré
1 054 dépasse sa planche de 1 024.

**Vert après :** `ok 3 - CZ T1 …` en 806 ms pour les douze décodages. Le pivot
JavaScript (quart de résolution) tombe à moins de 5 px du pivot Python (pleine
résolution) sur les douze, sous une tolérance de 9 à 16 px.

### T2 — `CZ T2`, la table et l'art s'accordent enfin

**Montage.** Même fichier. Pour chacun des neuf socles redessinés, le SPRITE 128
cousu (`art/sprites/socle/128/`) est relu en RVBA — le fond est l'alpha —, et le
trou du logement y est refait par la recette d'`AZ T1` (seuil absolu 200,
ouverture 1 % W, fermeture 2,5 % W, plus grande composante sombre qui ne touche
ni le fond ni le bord), désormais PARTAGÉE entre le dessin et le sprite dans
`trouDansLeMasque`. `recadrer` centre la boîte de la pièce dans la cellule, donc
le centre de la pièce est le centre de la case : le centroïde se lit
directement en `dx_case_pct` / `dy_case_pct`.

**Assertion.** |Δdx| et |Δdy| < 2 % du côté de la case (2,56 px sur 128, 1,28 sur
64). Appât : un sprite qui porterait encore le trou 75° du joueur (−15,74 %) doit
tomber.

**Rouge avant** (sprites 75° du dépôt contre la table zénithale) :

```
socle                      sprite dx,dy %case    table dx,dy  écart %  px/64
socle_def_o_batterie          0.20,   -21.83   0.00, -0.18    21.65   13.9  ÉCART
socle_def_o_casemate          0.26,   -21.78  -0.00, -0.36    21.42   13.7  ÉCART
socle_def_o_creneau           0.21,   -21.95  -0.00, -0.27    21.68   13.9  ÉCART
socle_def_o_faucheuse         0.34,   -26.32  -0.00, -0.47    25.85   16.5  ÉCART
socle_def_o_harpon            0.23,   -26.25  -0.00, -0.56    25.69   16.4  ÉCART
socle_def_o_mortier           0.22,   -26.26  -0.00, -0.62    25.64   16.4  ÉCART
socle_def_j_batterie         15.03,     6.72  -0.00, -1.06    15.03    9.6  ÉCART
socle_def_j_casemate         15.03,     6.72  -0.00, -1.06    15.03    9.6  ÉCART
socle_def_j_creneau          15.03,     6.72  -0.00, -1.06    15.03    9.6  ÉCART
```

Le brief disait « 15 px sur une case de 64 » : 13,7 à 16,5 px à l'Ouvrage, 9,6
chez le joueur (dont la recette, sur un trou vu de biais, ne trouve pas le
logement — c'est l'autre moitié du rouge).

**Vert après** (sprites recousus) :

```
socle                      sprite dx,dy %case    table dx,dy  écart %  px/64
socle_def_o_batterie         -0.07,     0.04   0.00, -0.18     0.22    0.1  ok
socle_def_o_casemate         -0.09,    -0.55  -0.00, -0.36     0.19    0.1  ok
socle_def_o_creneau          -0.03,    -0.01  -0.00, -0.27     0.26    0.2  ok
socle_def_o_faucheuse         0.05,    -0.41  -0.00, -0.47     0.06    0.0  ok
socle_def_o_harpon            0.01,    -0.41  -0.00, -0.56     0.15    0.1  ok
socle_def_o_mortier          -0.13,    -0.46  -0.00, -0.62     0.16    0.1  ok
socle_def_j_batterie         -0.15,    -1.54  -0.00, -1.06     0.48    0.3  ok
socle_def_j_casemate         -0.15,    -1.54  -0.00, -1.06     0.48    0.3  ok
socle_def_j_creneau          -0.15,    -1.54  -0.00, -1.06     0.48    0.3  ok
pire écart : 0.48 % de la case (0.31 px sur 64) — PASS
```

`ok 4 - CZ T2 …` en 43 ms. **Pire écart : 0,48 % de la case, soit 0,31 px sur
64, contre 13,9 à 16,5 avant.**

### Relevé dans le navigateur (Chromium du volet, `dist/index.html` servi en HTTP)

Partie neuve, QG de défense posé (gratuit), une Tourelle mitrailleuse posée dans
la bande de défense. Lu au DOM : la `.couche-tournante` de la pièce posée fait
**107,18 % de la case** (49,30 px pour une case de 46), centrée à **dx 0,00 ·
dy −1,05 %** — la table dit 107,19 et −1,06 —, `matrix(-1, 0, 0, -1, 0, 0)` (la
garnison au repos regarde le déploiement), `pointer-events: none`, cellule
`25% 0%` d'un atlas `500% 400%` — la deuxième des dix-huit de `defense`. Le socle
sous elle est la cellule `33,3333% 0%` d'un atlas `400% 300%` — la deuxième des
douze de `socle`, `socle_def_j_casemate`. Les vignettes de la palette portent
107,18 · 95,83 · 130,19 pour les trois tourelles de contact. **Zéro erreur de
console.** Aucune capture fichier n'est jointe : le volet ne l'écrit pas sur
disque ; les nombres ci-dessus sont ce qu'une capture aurait montré à 46 px.

### Réancrages — trois, aucun assouplissement

- `sprite.test.js` « une tourelle ne sort pas de son carré en tournant » : pire
  rayon **31,69 → 31,60** sur 32. Les six zénithales, recentrées dans un carré à
  quatre pixels de marge, s'arrêtent à 31,50–31,60 ; ce sont deux blindés
  inchangés (`belier`, `broyeur`) qui partagent le pire avec la casemate. Le
  nombre d'avant est écrit à côté.
- `sprite.test.js` « les sprites de l'Ouvrage ne sont plus percés de trous » :
  l'appât CHANGE pour la troisième fois de son histoire, et le seuil de 500 ne
  bouge pas. Les trois socles de tourelle du joueur passent de 972 à **0 px**
  transparents enfermés — vu de dessus, le logement est un disque PEINT, plus
  un trou traversant — et il ne reste que 68 · 74 · 77 = 219 px sur les trois
  socles d'artillerie à 75°. Remesuré sur les onze familles en 128 : `interface`
  porte **15 777 px sur 46 pictogrammes** — un trait sur du vide enferme par
  construction, et aucun camp ni aucune refonte d'une pièce ne la touche.
- `PIC T6` : six tailles d'atlas réancrées (tableau §2), les anciennes à côté ;
  les douze autres lignes n'ont pas bougé d'un octet.

---

## 4. Le plafond de dépassement, mesuré et écrit

Mesuré sur les sprites 128 cousus et la table (`ANCRES_DEFENSE`, `TOURELLES_DEFENSE`) :

| tourelle | carré (% case) | portée du carré | rayon dessin / 64 | portée du dessin | remplissage | cote_pct_embase |
|---|---|---|---|---|---|---|
| def_j_casemate | 107,19 | 54,66 | 0,980 | 53,60 | 18,8 % | 274,8 |
| def_j_creneau | 95,84 | 48,98 | 0,979 | 47,98 | 17,1 % | 245,7 |
| def_j_batterie | 130,20 | 66,16 | 0,986 | 65,22 | 18,0 % | 333,8 |
| def_j_faucheuse | 146,89 | 82,81 | 0,988 | 81,92 | 14,5 % | 274,5 |
| def_j_mortier | 159,17 | 88,78 | 0,992 | 88,19 | 12,4 % | 303,3 |
| **def_j_harpon** | **180,01** | **99,97** | 0,978 | **97,99** | 24,4 % | 304,9 |
| def_o_casemate | 107,19 | 53,95 | 0,984 | 53,07 | 37,8 % | 147,5 |
| def_o_creneau | 95,82 | 48,18 | 0,978 | 47,13 | 23,6 % | 193,6 |
| def_o_batterie | 130,18 | 65,27 | 0,984 | 64,20 | 20,9 % | 205,6 |
| def_o_faucheuse | 146,88 | 73,91 | 0,984 | 72,70 | **10,4 %** | 325,5 |
| def_o_mortier | 159,18 | 80,21 | 0,978 | 78,47 | 15,6 % | 282,9 |
| def_o_harpon | 179,99 | 90,56 | 0,986 | 89,25 | **41,4 %** | 270,3 |

La portée se lit depuis le centre de la case, en % de son côté ; le bord est à
50. **Plafond : 99,97 % pour le carré (`def_j_harpon`, carré de 180,0 % de la
case), 97,99 % pour le dessin lui-même** — la pointe des missiles atteint le bord
opposé de la case voisine. Le carré n'est rempli qu'à **10,4 à 41,4 %** (le brief
disait 11 à 43 : même mesure, sprites conditionnés) ; une tourelle du joueur
occupe 12 à 24 % de sa cellule. Ratio carré/embase médian **2,72** (brief : 2,72).

**Ligne écrite dans `INVENTAIRE-SPRITES.md` A7**, sous « ET LE CARRÉ DE TOURELLE,
LUI, SORT DE LA CASE » : le plafond, les trois mesures, l'arbitrage (« on achète
le dépassement, `ECHELLE` ne bouge pas », le rejet à l'œil du 05/09, les −74 %
qu'un raccourcissement demanderait au mortier), et la garde qui le tient
(`sprite.test.js`, plafonds 101 / 92, pire nommé, Créneau qui tient). `ECHELLE`
n'a pas été touchée : `git diff tools/ancres-defense.py` est vide.

---

## 5. Vérificateur, fichiers touchés, écarts

**`tools/verifier.py`** — voir §7 en fin de rapport (chaîne complète).

**Fichiers touchés :** `art/sources/def_{j,o}_{6}.png` (12 recentrées en place),
`art/sprites/{defense,socle,chassis}/{64,128}/…` (44), `art/sprites/atlas-{defense,socle,chassis}-{64,128}.webp`
(6), `art/sprites/atlas-empreintes.json`, `tools/recentrer-tourelles-ouvrage.py`,
`test/ancres-zenith.test.js` (+2 tests, recette du trou partagée),
`test/sprite.test.js` (2 réancrages), `test/pictogramme.test.js` (PIC T6),
`INVENTAIRE-SPRITES.md` (A7), `CLAUDE.md`, `package.json`, `package-lock.json`,
`rapports/RAPPORT-lotCONDITIONNEMENT-ZENITH.md`,
`rapports/planche-conditionnement-zenith-128.png`.

**Tests :** 1 643 → 1 645 (+2, `CZ T1`, `CZ T2`). Aucune assertion retirée ni
assouplie ; trois réancrages avec le nombre d'avant à côté ; un appât changé
sans toucher au seuil.

**Écarts au brief, déclarés :**
1. Côté de la toile = carré **+ 4 px** (marge historique du script), pas « le
   carré arrondi au pair supérieur » — le demi-pixel de l'arrondi de la
   translation l'exige pour que « aucun pixel plus loin que la moitié du côté »
   tienne par construction.
2. Le script de recentrage a été réparé et généralisé (il était cassé) plutôt
   qu'un second écrit — le brief ne nommait aucun outil.
3. Le relevé au navigateur n'était pas demandé ; il est fait, au DOM, sans capture
   fichier.

---

## 6. Ce qui reste ouvert

1. **`ECHELLE` sur les dessins zénithaux** — arbitrage d'Ethan, explicitement
   hors lot. Le plafond est écrit ; le regarder en jeu à 64 px sur un S25 FE est
   ce qui reste à faire pour le juger. Ce que la mesure dit : une tourelle du
   joueur n'occupe que 12 à 24 % de sa cellule, le reste est marge de rotation.
2. **Les sources recentrées sont des originaux retravaillés.** `art/sources/` ne
   porte que des originaux ; les douze sont désormais l'original translaté dans
   une toile plus grande, sans un pixel de dessin touché. Les versions telles
   que livrées sont à `105d4fc` et dans `claudax/sprite/conditionne/` ; si l'on
   veut les garder au dépôt, c'est un `_livree_ECARTE.png` de plus par tourelle,
   et ce lot ne l'a pas fait — le brief dit « en place ».
3. **Les 23 sources hors dépôt** — ruines de défense (lot RUINES-DÉFENSE, qui prend
   l'atlas après celui-ci), barrières et merlon, blindés zénithaux du joueur (qui
   devront passer `ancres-blindes.pivot` au disque inscrit et leurs cinq
   tourelles par ce même script de recentrage — il sait déjà le faire).
4. **`atlas.py --verifier` : 3 différents permanents** (`carte-64`, `carte-128`,
   `interface-128`), l'encodeur WebP de la machine ; préexistants, laissés tels
   quels, comme aux quatre lots précédents.
5. **Le lecteur des ruines de défense** n'existe toujours pas dans le moteur
   (`couchesDeLaRuine` ne connaît que `ruine_j` / `ruine_o`) — hors lot.

---

## 7. Vérificateur de la chaîne d'art

`python tools/verifier.py --silencieux` (Pillow 12.3.0, `opusenc` d'opus-tools 0.2
sur le PATH), **10 min 06** :

```
identiques à l'octet : 222
différents           : 888
nouveaux             : 0
MANQUANTS            : 0
  DIFFÈRE   ancres-blindes-ouvrage.json
  DIFFÈRE   ancres-blindes.json
  DIFFÈRE   ancres-defense-ouvrage.json
  DIFFÈRE   ancres-defense.json
  … (884 sprites)
VERDICT : la chaîne ne répond pas de ses sprites
```

**Lecture, en deux nombres.** Avant le lot, sur le même arbre et la même machine :
178 identiques · 932 différents (rapport ANCRES-ZÉNITH §8). Après : **222 · 888,
soit +44 identiques** — exactement les 44 sprites que ce lot écrit, produits par
l'encodeur de cette machine et donc reproduits à l'octet. Les 888 restants sont
le bruit d'encodeur PNG de Pillow 12.3 déjà documenté (lot TERRITOIRE-ET-ÉCHELLE :
0 différence au pixel sur un arbre pristine), et les quatre JSON diffèrent par
les seuls CRLF de Windows (identiques au caractère près, mesuré §1). Au PIXEL,
`joueur_v2` + `ouvrage_v2` rejoués après le lot rendent **168 sprites sur 168
identiques** au dépôt. La ligne `ATLAS` du verdict a disparu : les trois atlas
recousus correspondent à leurs sprites.
