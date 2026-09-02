# RAPPORT — LOT COULEUR · Foyer Zéro

Écrit le **02/09/2026**. Base : `main` à `9d7d711`, branche
`claude/new-session-p1adzu`.

---

## 0. Version et build effectivement produits

`package.json` passe de **0.65.0 · build 66** à **0.66.0 · build 67**, les deux
en CHAÎNES — `android/app/build.gradle.kts` les lit `as String`, et un nombre y
fait tomber le build Android à la configuration.

`SAVE_VERSION` **ne bouge pas** et reste à **22** : aucun sprite n'entre dans une
sauvegarde.

---

## 1. Les bornes du §5, mesurées

| mesure | attendu | **mesuré** |
|---|---|---|
| trous enfermés, Ouvrage, grille 128 | ≤ 1 500 px | **1 192 px sur 74 sprites** (55 940 sur 163 avant) |
| teintes maximales d'un sprite (grille 64) | ≤ 48 | **38** — `carte/site_scorie_n1` |
| teintes maximales d'un atlas | ≤ 255 | **54** — `atlas-carte-64.png` |
| écart moyen à la matière, par famille et camp | ≤ 15 | **9,04 à 14,90** sur les 36 groupes ; aucun ≥ 15 |
| comptes de pixels d'accent | identiques au dépôt | **le lot COULEUR n'en déplace AUCUN** — 0 écart sur 1 387 fichiers. Le lot SILHOUETTE en déplace 146 à la grille 64, et c'est une conséquence directe des trous rebouchés — voir §4 |
| silhouette | identique hors réparations du lot 1 | **identique**, sauf 489 sprites de l'Ouvrage et 69 du joueur que le détourage répare — voir §4 |
| `tools/verifier.py` | vert | **VERT** — voir §6 |

Bornes annexes, mesurées aussi :

| | avant | après |
|---|---|---|
| `dist/index.html` | 1 383 723 o | **1 166 523 o** (−217 200) |
| les huit atlas, octets | 478 793 | **297 799** |
| les huit atlas, base64 | 638 390 | **397 065** |
| `data:image` dans le livrable | 16 | **16** |
| marge sous la borne T10 (1 400 000) | 16 277 o · 1,16 % | **233 477 o · 16,68 %** |

⚠ **La borne T10 n'a pas été baissée.** Elle attrape une explosion — un bundle
parti en boucle, une image entrée deux fois ; elle ne récompense pas une
économie. La baisser reviendrait à en faire une cible.

---

## 2. Fichiers touchés

### Outils — le lot 1 et le lot 2

| fichier | geste |
|---|---|
| `tools/cond.py` | `reduire(idx, N, TR=None)` — la sentinelle du transparent se PASSE ; nouvelle `est_fond_sujet`, seconde porte du détourage restreinte au fond touchant le bord ; `conditionner` du module passe `len(PAL)` |
| `tools/final128.py` | `conditionner` emploie `est_fond_sujet`, passe `len(P)` à `reduire`, et rend `(g, matiere)` ; `ecrire(g, P, path, matiere=None)` pose le médoïde et verrouille l'accent ; le bloc `__main__` historique suit la nouvelle signature |
| `tools/couleurs.py` | **NEUF** — la réduction par coupe médiane, groupe par groupe |
| `tools/verifier.py` | `('couleurs', [])` en fin de `CHAINE` |
| `tools/atlas.py` | `encoder()` — PNG palettisé conditionnel ; `coudre` rend un quatrième champ ; la ligne de résumé dit le mode et le compte de teintes |

**Les onze producteurs**, douze sites d'appel de `conditionner` et douze de
`ecrire`, tous de la forme `g, matiere = conditionner(...)` puis
`ecrire(g, P, chemin, matiere)` :
`planches.py` · `tourelles.py` (deux) · `tourelles_unite.py` · `socles.py` ·
`connexions.py` · `emblemes.py` · `unites_ouvrage.py` · `barrieres.py` ·
`chassis.py` · `ruines.py` (deux).

⚠ **`tools/effets.py` n'est pas touché** : il porte son propre `ecrire`, de
signature différente, et ses sprites sont DESSINÉS dans leur palette au lieu
d'être conditionnés depuis une planche.

### Tests

| fichier | geste |
|---|---|
| `test/png-rgba.js` | le décodeur lit désormais le RVBA **et** l'indexé, et rend du RVBA des deux côtés |
| `test/sprite.test.js` | deux tests neufs, plus l'import de `PALETTE` |

⚠ **`test/sprite.test.js` l. 374 n'a pas été touchée**, ni la ligne
`assert.equal(couleursMax, 16, …)`, ni les bornes `> 7` / `<= 16`, ni
l'interdiction de `#E43E32` : elles portent sur la seule famille `bord`, que ce
lot ne touche pas.

⚠ **`test/accent.test.js` n'a pas bougé d'une ligne**, et il passe.

### Sprites

**1 333 fichiers réécrits** dans `art/sprites/`, plus les **8 atlas** recousus.
Par famille et par grille :

| famille | 128 | 64 | 32 |
|---|---|---|---|
| bâtiment | 34 | 34 | 34 |
| carte | 45 | 45 | 45 |
| chassis | 10 | 10 | 10 |
| defense | 204 | 204 | 204 |
| socle | 36 | 36 | 36 |
| tourelle-unite | 80 | 80 | 80 |
| unite | 36 | 36 | **34** |

⚠ **Les deux manquants d'`unite/32` sont les ÉCARTS PERMANENTS**, préservés :
`off_j_ratisseur.png` et `off_j_belier.png` ont été retouchés à la main, et Ethan
a tranché le 30/08 — « on garde les commités ». Voir §7.

**53 fichiers ressortent identiques à l'octet, et c'était la promesse du §2.5** :
`effet/` (36), `bord/` (16) et `ancres-chassis.json`. `terrain/`,
`carte/atlas-terrain-64.png` et `carte/controle-pavage.png` ne sont produits par
aucun outil — ce sont les sources déclarées, elles n'ont pas été touchées.

### Documentation

`CLAUDE.md` §0 (le bloc de référence), §2 (le compte de `tools/`, la note de
`png-rgba.js`), §3 (la durée du vérificateur, le compte de sprites) et §6 (une
entrée dans « Sur les sprites et les atlas »).

---

## 3. `tools/couleurs.py` — les 36 groupes

`K` **ne se choisit pas, il se mesure** : le plus petit de 16, 24, 32, 48 qui
ramène l'écart moyen à la matière sous 15. Résultat : **vingt groupes à 16, onze
à 24, cinq à 32, AUCUN à 48.** La borne haute n'a jamais eu à mordre.

```
groupe                             sprites   K   écart  avant  après
bâtiment/128 joueur                     23  24   14.08  48773     24
bâtiment/128 ouvrage                    11  16    9.67  17142     16
bâtiment/64 joueur                      23  24   13.34  16861     24
bâtiment/64 ouvrage                     11  16    9.50   6143     16
bâtiment/32 joueur                      23  16   14.32   4847     16
bâtiment/32 ouvrage                     11  16    9.04   1843     16
carte/128 joueur                        34  32   14.79 139354     32
carte/128 ouvrage                       11  16   10.62  81717     16
carte/64 joueur                         34  32   14.90  49433     32
carte/64 ouvrage                        11  16   10.22  30517     16
carte/32 joueur                         34  32   14.28  14374     32
carte/32 ouvrage                        11  16    9.14   9606     16
chassis/128 joueur                      10  16   13.06  22470     16
chassis/64 joueur                       10  16   12.96   9692     16
chassis/32 joueur                       10  16   12.29   3155     16
defense/128 joueur                     102  32   14.74 134942     32
defense/128 ouvrage                    102  24   14.73  77134     24
defense/64 joueur                      102  24   14.49  39005     24
defense/64 ouvrage                     102  32   13.18  24062     32
defense/32 joueur                      102  24   13.14   9633     24
defense/32 ouvrage                     102  24   13.85   6576     24
socle/128 joueur                        18  16   13.86  58114     16
socle/128 ouvrage                       18  16   14.24  50260     16
socle/64 joueur                         18  16   12.38  19806     16
socle/64 ouvrage                        18  16   13.63  17610     16
socle/32 joueur                         18  16   10.65   5900     16
socle/32 ouvrage                        18  16   14.64   5606     16
tourelle-unite/128 joueur               80  24   14.18 110706     24
tourelle-unite/64 joueur                80  24   14.62  46840     24
tourelle-unite/32 joueur                80  24   14.16  15345     24
unite/128 joueur                        14  24   13.53  27333     24
unite/128 ouvrage                       22  16   13.60  40050     16
unite/64 joueur                         14  24   14.08   9898     24
unite/64 ouvrage                        22  16   13.86  13917     16
unite/32 joueur                         14  16   14.34   2914     16
unite/32 ouvrage                        22  16   13.34   3890     16
```

⚠ **`avant` est le compte de teintes LIBRES du groupe** — ce que le médoïde rend
avant réduction. `carte/128 joueur` en portait **139 354**.

### L'écart à la matière, par famille et par camp

C'est la distance RVB moyenne, par pixel opaque hors accent, entre le sprite
écrit et le sprite LIBRE. Avant le lot, c'est la palette fermée qu'on compare à
la matière ; après, la palette adaptative.

| groupe | avant | après | | groupe | avant | après |
|---|---|---|---|---|---|---|
| bâtiment/128 j | 33,70 | 14,08 | | defense/64 o | 66,32 | 13,18 |
| bâtiment/64 j | 36,46 | 13,34 | | socle/128 j | 64,52 | 13,86 |
| bâtiment/32 j | 38,75 | 14,32 | | socle/64 j | 62,68 | 12,38 |
| bâtiment/128 o | 19,90 | 9,67 | | socle/32 j | 62,61 | 10,65 |
| carte/64 j | 37,79 | **14,90** | | socle/128 o | 45,82 | 14,24 |
| carte/32 j | 42,04 | 14,28 | | tourelle-unite/128 j | 40,80 | 14,18 |
| chassis/32 j | 50,70 | 12,29 | | tourelle-unite/32 j | 56,10 | 14,16 |
| defense/128 j | 63,01 | 14,74 | | unite/64 j | 44,83 | 14,08 |
| defense/128 o | 64,27 | 14,73 | | unite/32 o | 27,23 | 13,34 |
| defense/32 o | **67,58** | 13,85 | | bâtiment/32 o | 24,62 | **9,04** |

**Avant : 19,9 à 67,6. Après : 9,0 à 14,9.** Le brief annonçait « 21,9 à 63,9 »
puis « 9,6 à 14,9 » ; l'amplitude mesurée est un peu plus large des deux côtés,
la borne du §5 tient.

⚠ **UNE SEULE VALEUR DÉPASSE 15 SUR LE DISQUE, ET CE N'EST PAS LA CHAÎNE.**
`unite/32 joueur` mesure **22,30** sur les quatorze fichiers du dépôt et
**14,48** sur les douze que la chaîne y écrit : les deux écarts permanents
restent dans la palette FERMÉE et tirent la moyenne. La grille 32 n'est cousue
dans aucun atlas — rien de cela n'atteint l'écran.

---

## 4. Ce que chaque lot déplace, séparément

Les trois lots ont été mesurés SÉPARÉMENT, en confrontant trois arbres : le dépôt
d'avant, la sortie de chaîne AVANT `couleurs.py`, et la sortie APRÈS.

### Le lot SILHOUETTE déplace des silhouettes — et rien d'autre ne le fait

| | Ouvrage | joueur |
|---|---|---|
| sprites dont la silhouette change, trois grilles | **489** | **69** |
| sprites dont le compte d'accent change, grille 64 | **142** | **4** |

⚠ **LES 69 DU JOUEUR NE SONT PAS UNE SURPRISE, ILS SONT LA MÊME CAUSE.** Ce sont
presque tous des `site_scorie_*` : la scorie est `#382E47`, un violet, et le
violet clair de son dessin tombait dans `c2` exactement comme celui de l'Ouvrage.
S'y ajoutent huit défenses aux orientations `_oso` / `_sso` / `_so` / `_ene`,
`poi_reacteur`, `poi_ressource_a`, `site_quartz_n5` et les deux
`off_j_broyeur_chassis`.

⚠ **ET LES 146 COMPTES D'ACCENT DE LA GRILLE 64 CHANGENT PARCE QU'UN TROU
REBOUCHÉ APPORTE DES PIXELS**, dont certains d'accent. Le §5 du brief demandait
des comptes « identiques au dépôt, sprite par sprite » : c'est impossible à tenir
EN MÊME TEMPS que la réparation des trous, et le brief le reconnaît lui-même pour
la silhouette (« hors les sprites de l'Ouvrage que le lot 1 répare »). La lecture
retenue est celle des six valeurs de contrôle du §2.3, qui sont toutes du camp du
joueur : **c'est le lot COULEUR qui ne doit pas déplacer l'accent**, et il ne le
déplace pas.

### Le lot COULEUR ne déplace ni silhouette ni accent

Confronté fichier par fichier, avant et après `couleurs.py` :

```
LOT COULEUR SEUL — 1387 fichiers, avant/après couleurs.py
  silhouette changée   : 0
  accent changé        : 0
```

Les six valeurs de contrôle du §2.3, mesurées sur le dépôt livré :
`bat_j_depot_de_vehicules` **591** · `bat_j_qg_de_defense` **716** ·
`off_j_fouisseurs` **546** · `off_j_carapace` **507** ·
`socle_def_j_batterie` **1 787** · `def_j_batterie_n` **1 212**.

### Le lot ATLAS est indépendant, et il a été mesuré seul

Sur les sprites d'AVANT le lot couleur, sans toucher un pixel :
**478 793 → 202 507 octets**, et `npm run check` restait à 872 pass / 0 fail.
C'est le chiffre du brief, au octet près.

| famille | RVBA avant | indexé après lot couleur | teintes |
|---|---|---|---|
| bâtiment | 43 117 | 23 363 | 46 |
| terrain | 10 549 | 5 404 | 20 |
| defense | 127 148 | 77 771 | 62 |
| socle | 55 376 | 37 544 | 38 |
| unite | 50 146 | 29 620 | 46 |
| chassis | 15 322 | 10 239 | 22 |
| tourelle-unite | 90 581 | 57 907 | 30 |
| carte | 86 554 | 55 951 | 54 |
| **TOTAL** | **478 793** | **297 799** | |

Le brief prévoyait 296 416 ; l'écart de 1 383 octets vient de `defense`, dont la
coupe médiane a retenu 32 teintes côté Ouvrage là où le brief en attendait moins.

---

## 5. Les tests, et leur falsification RÉELLE

### 5.1 `couleur — les sept familles ont quitté la palette fermée, l'accent excepté`

Grille 64, les sept familles retravaillées, 445 sprites.

- **Borne haute** : ≤ 48 teintes opaques distinctes par sprite. Mesuré : **38**.
- **Borne basse** : aucun sprite ne tient ENTIÈREMENT dans la palette fermée,
  **et aucune des treize teintes NON accent de cette palette ne survit nulle
  part**. Mesuré sur les 1 335 sprites des trois grilles : **zéro violation**.

⚠ **ÉCART AU BRIEF, DÉCLARÉ.** Le brief demandait une borne basse « teintes
opaques distinctes **> 14** ». **Elle est fausse** : mesuré, sept sprites sur 445
portent moins de quinze teintes — `defense/def_j_herse` en porte **11** pour 750
pixels opaques, `def_j_merlon_traversant` 13, `bâtiment/ruine_o` 13,
`unite/off_o_broyeur` 13, et trois autres 14. Ce sont de petits sujets, et leur
palette est parfaitement libre. Une borne à « > 14 » aurait été rouge le jour de
sa pose, pour une raison qui n'a rien à voir avec ce qu'elle prétend mesurer.
La borne posée dit ce que le brief VOULAIT dire — « sinon la palette fermée est
encore là » — et elle le dit exactement : on regarde l'APPARTENANCE à la palette
fermée, pas un compte.

**Falsification, réellement jouée deux fois :**

1. *Remettre la palette fermée* — `git checkout HEAD -- art/sprites`, c'est-à-dire
   l'état commité d'avant le lot :
   ```
   not ok 1 - couleur — les sept familles ont quitté la palette fermée, l'accent excepté
     error: "bâtiment/bat_j_accumulateur.png tient entièrement dans la palette
             fermée : la quantification d'avant le lot COULEUR est revenue"
   ```
2. *Retirer la réduction de `couleurs.py`* — installer la sortie de chaîne AVANT
   l'outil :
   ```
   not ok 1 - couleur — les sept familles ont quitté la palette fermée, l'accent excepté
     error: 'bâtiment/bat_j_accumulateur.png porte 733 teintes : la réduction de
             tools/couleurs.py ne mord plus'
   ```

Le test échoue donc **des deux côtés**, et par des messages différents.

### 5.2 `couleur — la chaîne n'enferme plus de trous dans les sprites de l'Ouvrage`

Grille 128, composantes transparentes 4-connexes ne touchant aucun bord.
Assertion : le total sur les sprites de l'Ouvrage est **≤ 1 500 px**.
Mesuré : **1 192 px sur 74 sprites**, contre **55 940 px sur 163** avant le lot.

⚠ **Le test n'asserte PAS zéro**, et le brief avait raison de l'interdire : les
1 192 restants sont de vraies ouvertures du dessin, et le camp du JOUEUR en porte
**3 465** — dont **2 722** pour la seule famille `chassis`, et **1 165** pour le
seul `off_j_broyeur_chassis`. Le montage s'en sert comme appât : il exige que le camp du joueur en
porte plus de 1 500, sans quoi le compteur ne sait pas compter.

**Falsification, réellement jouée :** `TR = len(PAL)` remis dans `cond.reduire`,
la chaîne rejouée en entier dans un arbre dérouté, et sa grille 128 installée :

```
not ok 1 - couleur — la chaîne n'enferme plus de trous dans les sprites de l'Ouvrage
  error: "42697 px de transparent enfermés sur 161 sprites de l'Ouvrage —
          la sentinelle de `cond.reduire` ou la porte de `cond.est_fond_sujet`
          a été défaite"
```

⚠ **42 697 et non « plus de 50 000 » comme l'annonçait le brief**, et l'écart
s'explique : la falsification n'inverse QU'UN des deux gestes du lot 1.
`est_fond_sujet` reste en place et retire déjà ~13 000 px des 55 940. Le test
rougit vingt-huit fois au-dessus de sa borne ; la borne du brief supposait les
deux gestes défaits.

Après falsification, `tools/cond.py` a été restauré et l'arbre de sprites
reconfronté à la sortie de chaîne mesurée : **1 386 fichiers, 0 divergent.**

### 5.3 Les deux tables des tests sont LUES dans l'outil

`tablesDeLOutilCouleur()` extrait `FAMILLES`, `ORIENT` et `FAMILLES_ORIENTEES` de
`tools/couleurs.py` au lieu de les recopier, et **asserte le parse** — sept
familles, seize orientations, au moins une famille orientée. C'est la discipline
d'`exclusionsDeLOutil` juste au-dessus, qui lit `FAMILLES` dans `tools/atlas.py`.
Sans elle, un reformatage de l'outil rendrait les deux gardes muettes : elles
balaieraient zéro fichier et passeraient sur n'importe quel art.

---

## 6. Ce qui doit passer sans être modifié — joué

### `test/accent.test.js`

```
# tests 4
# pass 4
# fail 0
```

Il n'a pas bougé d'une ligne. `off_j_pilon_s` porte toujours ses **161** pixels de
véhicule, les quatre dettes sont toujours violées comme déclaré, et le verdict
d'un blindé ne dépend toujours pas de l'orientation de sa tourelle.

### `python3 tools/verifier.py`

```
identiques à l'octet : 1386
différents           : 2
nouveaux             : 0
MANQUANTS            : 0
durée                : 288.3 s
  écart déclaré  unite/32/off_j_belier.png — même cas que le Ratisseur — le fichier commité fait foi
  écart déclaré  unite/32/off_j_ratisseur.png — la source 1024 ne redescend pas à 32 sans retouche à la main (passation du 30/08, §3.2.6)

VERDICT : la chaîne répond de ses sprites
```

Code de sortie **0**. La chaîne — `couleurs.py` compris — se rejoue et reproduit
à la SHA-256 ce qu'elle vient d'écrire.

⚠ **Elle est passée de 185 s à 288 s**, et c'est `couleurs.py` : il relit et
réécrit 1 335 fichiers. `CLAUDE.md` §3 a été corrigé — « ~2 min » y devient
« ~5 min ».

### La suite complète

```
# tests 874
# pass 874
# fail 0
```

872 avant, deux tests neufs, **aucune assertion retirée ni assouplie**.

---

## 7. Écarts au brief, et leurs raisons

1. **La borne basse du test de teintes n'est pas « > 14 ».** Mesuré, sept sprites
   sur 445 sont en dessous ; la borne aurait été rouge le jour de sa pose. Elle
   mesure l'APPARTENANCE à la palette fermée, ce que le brief voulait dire.
   Voir §5.1.
2. **Un bloc opaque sans matière prend la teinte de la FICHE, pas la moyenne du
   bloc entier.** Le brief prescrivait la moyenne. Ce cas n'existe que par
   `planches.aligner`, qui PEINT les bandes de chenille des trois blindés à la
   grille 32 là où le sujet ne s'étend pas : la moyenne du bloc entier y rendrait
   le MAGENTA du fond de recadrage, sur les deux bandes, des trois sprites. Ces
   gros pixels ont été inventés par une retouche ; la fiche est leur seule source.
3. **`test/png-rgba.js` a dû être étendu**, ce que le brief n'avait pas prévu. Il
   listait deux lectures à vérifier — `tailleDuPng` et les octets de
   `carte/atlas-terrain-64.png` — et les deux tiennent ; mais
   `sprite — l'atlas cousu porte les pixels des sprites d'aujourd'hui` (l. 502)
   décode les huit atlas avec `decoderRgba`, qui assertait `corps[9] === 6`. Sans
   l'extension, cette garde LEVAIT sur chaque atlas palettisé, pour un défaut qui
   n'existe pas. Le décodeur rend du RVBA dans les deux cas.
4. **Les comptes d'accent ne sont pas identiques au dépôt sprite par sprite**,
   parce que le lot 1 rebouche des trous. Voir §4. Le lot COULEUR, lui, n'en
   déplace aucun.
5. **Les deux écarts permanents ne sont pas réécrits.** Le brief ne les mentionne
   pas ; les écraser aurait renversé un arbitrage d'Ethan du 30/08 et fait rougir
   le vérificateur par « ÉCART DÉCLARÉ QUI SE REPRODUIT MAINTENANT ».
6. **`atlas.py` vérifie l'alpha avant de basculer en mode `P`.** Le brief posait
   la condition sur le seul compte de teintes. `tRNS` ne porte ici qu'une entrée,
   l'index 0 : un atlas à transparence PARTIELLE sortirait faux. L'alpha est
   binaire dans tout le dépôt — l'outil le vérifie, il ne le suppose pas.
7. **`couleurs.py` saute un groupe déjà sous le plafond**, ce que le brief ne
   demandait pas. Sans cette garde, une seconde exécution réduirait un groupe de
   32 teintes à 16, puis encore, et l'art se dégraderait à chaque passage sans
   qu'un fichier ne dise pourquoi. Vérifié : la seconde exécution ne déplace pas
   un octet.

---

## 8. Ce qui reste ouvert

- **Les deux écarts permanents restent dans la palette fermée** quand leurs
  frères de 128 et de 64 passent au libre. La grille 32 n'est cousue dans aucun
  atlas, donc rien ne l'atteint à l'écran ; mais le jour où elle le sera, il
  faudra soit régénérer les deux, soit les retoucher à la main dans la nouvelle
  palette. C'est un arbitrage d'Ethan, pas une décision de lot.
- **Les socles du joueur sont dorés dans leur source**, et le lot le restitue —
  93,7 % des pixels de `socle_def_j_batterie` sont en jaune, teinte 0,125,
  saturation 0,68. C'est fidèle à `M1_socles_j_tourelles_3.png`. Hors périmètre,
  comme le §6 du brief le dit : si Ethan veut du kaki, cela se règle sur la source
  ou par une exception de famille.
- **Les tourelles de l'Ouvrage sortent deux fois trop petites** — 29 × 60 contre
  54 × 81 côté joueur, parce que `tools/tourelles.py` met à l'échelle sur
  `diametre_base`, le plus grand disque inscrit, que leur forme hérissée
  n'inscrit pas. Défaut de chaîne indépendant de la couleur. **Lot séparé**, non
  touché.
- **`unite/32 joueur` mesure 22,30 d'écart sur le disque** contre 14,48 sur ce
  que la chaîne produit, à cause des deux écarts permanents. Rien à corriger tant
  que la grille 32 n'est pas cousue.
- **`icone.py` reste hors du périmètre du vérificateur** : il écrit dans
  `android/`. Angle mort déjà dit au rapport de FINITIONS, inchangé.
- **La marge sous T10 est passée à 16,68 %.** Elle n'a jamais été aussi large.
  Ce n'est pas une invitation à faire entrer une image sans l'écrire : la règle du
  §5 de `CLAUDE.md` ne change pas.

---

## 9. Vérifications appareil

**Aucune vérification sur appareil n'a été faite, et elle est due.** Le dépôt n'a
ni jsdom ni navigateur ; ce qui se voit à l'œil ne s'automatise pas ici. Ce qui
serait à regarder sur le téléphone, dans l'ordre :

1. l'écran de la base — les onze bâtiments et le sol, où la matière rendue change
   le plus par rapport à la palette fermée ;
2. l'écran Monde — les emblèmes, dont les `site_scorie_*` que le détourage
   répare ;
3. l'écran de raid — les défenses et leurs socles, le groupe au plus fort écart
   d'avant (63 à 68) ;
4. la lisibilité du liseré d'accent, qui est ce que le verrou du §2.3 existe pour
   préserver.

`npm run check` et `tools/verifier.py` disent que la chaîne est juste ; ils ne
disent pas que le dessin plaît.
