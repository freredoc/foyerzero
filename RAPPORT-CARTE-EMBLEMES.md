# RAPPORT — lot CARTE-EMBLÈMES

La carte du monde prend ses dessins. Écrit le 30/08/2026.

---

## 1. Ce qui a été produit

| | |
|---|---|
| version · build | **0.47.0 · "48"** (chaînes, éditées textuellement) |
| `dist/index.html` | **1 229 274 octets** — mesuré |
| avant le lot | 1 074 070 octets |
| **delta** | **+155 204**, dont **152 443 d'images** |
| SHA-256 | `e7822fc72a7f9a31de3c7e143b168c41340cf0df4a3f5507ea7a8c3a1c0b00bb` |
| borne T10 | **1 150 000 → 1 300 000**, marge **70 726**, soit **5,4 %** |
| `npm run check` | **608 pass / 0 fail** (600 avant) |
| `atlas.py --verifier` | **8 identiques · 0 différent · 0 nouveau** |

**Le prérequis du §0.5 était satisfait** — `carte/64/base_o_2x2.png` mesure
128 × 128 et `base_o_3x3.png` 192 × 192, la branche portant déjà le lot
CHAÎNE-VÉRIFIÉE.

⚠ **La borne monte parce qu'une ressource entre légitimement, et le test écrit
pourquoi.** Trois entrées, mesurées : l'atlas `carte` (43 sprites en 7 × 7,
86 554 o, **115 405 en base64**), `base_o_2x2` (11 351 o, **15 134**) et
`base_o_3x3` (16 428 o, **21 904**). Aucun atlas n'a été rogné (CLAUDE.md §5).
La prévision du brief était de 152 443 octets d'images pour un `dist` à
≈ 1 226 500 ; le mesuré est 152 443 d'images et 1 229 274 au total, l'écart de
2 774 étant le code qui les pose.

---

## 2. Ce que le lot branche

Les 45 sprites de `art/sprites/carte/` existaient depuis le lot 6 et **aucun
n'était branché** : l'écran Monde dessinait un carré arrondi et une lettre.

| | |
|---|---|
| **36 emblèmes de site** | en usage réel, résolus par `spriteDuSite` |
| **7 POI** + **2 grosses bases** | **pré-branchés**, au sens du §5 du brief |

### La règle des paliers — `src/data/sites.js`

`palierDeNiveau(niveau)` : `n1` couvre 1–9, puis des bandes de cinq, et **`n9`
absorbe le 50**.

⚠ **ELLE SE CALCULE, ELLE NE SE TABULE PAS.** Une table de cinquante lignes
serait une seconde vérité sur la même règle. `PALIERS_EMBLEME` porte les trois
nombres — 9, 5, 9 —, la fonction fait le reste, et **elle lève hors de 1…50**
plutôt que de rendre un palier par défaut.

⚠ **LA NEUVIÈME BANDE DEVAIT ABSORBER LE 50, ET C'EST MESURÉ.** Huit bandes de
cinq après le premier palier s'arrêteraient à 49 ; or `niveauDeLaRangee` rend 50
pour **toutes les rangées de 1 à 50** — vérifié dans le test —, donc de tels
sites existent en nombre. Un site sans emblème est le seul résultat exclu.

### La saveur, transportée

`sitesDeLaFenetre` ne portait que type, rangée, colonne et niveau. Il appelle
maintenant `saveurDeLaCase`, **sans la recalculer** : zéro réimplémentation dans
`ui/monde.js` comme dans `render/embleme.js` — vérifié par `grep`.

⚠ **LES TROIS SITES DE TYPE « BASE » LA DEMANDENT AUSSI, sous le type que le
modèle connaît.** `TYPES_SITE` n'a que camp, avantPoste et base : ni `baseJoueur`
ni `baseTerminale` n'y sont, et les deux sont des bases. Leur passer `'base'`
laisse la règle de `saveurDeLaCase` décider — elle rend `null` — là où écrire
`saveur: null` à la main serait une quatrième affirmation sur une question qui a
déjà sa réponse.

### `src/render/embleme.js` — au singulier

Module **pur** : il rend des noms et une géométrie, `ui/monde.js` appelle
`drawImage`. Le singulier n'est pas cosmétique — `tools/emblemes.py` produit les
sprites que ce module nomme, et deux fichiers qui ne diffèrent que par un `s`
final sont l'accident du 27/08 (CLAUDE.md §6, homonymes).

⚠ **`SPRITES_POI` EST LU DANS L'ATLAS**, pas recopié : une liste écrite à la main
vieillirait au premier POI ajouté, et rien ne le dirait.

⚠ **AUCUN TYPE DE SITE N'A ÉTÉ INVENTÉ.** `EMBLEMES_CARTE` porte toujours ses
cinq entrées, `TYPES_SITE` ses trois. Le pré-branchement est entièrement du côté
du **dessin** : ajouter `poi_reacteur` à la table du modèle écrirait une entrée
que le modèle ne produit pas, et le prochain lot devrait la contredire.

---

## 3. ⚠ Les trois choix réversibles, et la question pour Ethan

### 3.1 — Le niveau retenu pour la base du joueur : **ses BÂTIMENTS**

`baseJoueur` porte `niveau: null` : son palier ne peut pas se lire sur sa rangée.
Le joueur en a trois — bâtiments, défense, armée. **Retenu : les bâtiments**,
parce que c'est ce qu'une base montre de loin, et c'est aussi ce que l'écran Base
affiche en premier. Il est en dixièmes entiers ; il s'arrondit au plus proche
avant de chercher le palier, avec un plancher à 1 — une base neuve n'a qu'un
Chantier de niveau 1, donc 10 dixièmes.

**Réversible en une ligne** de `palierDuSite`. C'est le seul point du lot
qu'Ethan n'a pas arbitré.

⚠⚠ **ET C'EST LE POINT QUI A FAILLI PASSER SANS GARDE.** Une falsification
remplaçant ce calcul par `niveauDeLaRangee(site.rangee)` — exactement la faute
que `sim/carte.js` existe pour empêcher — laissait la suite **VERTE**. Cause
mesurée : à la rangée de départ (275, niveau 5, palier 1) une base neuve donne
*aussi* le palier 1, donc les deux lectures coïncident. Le test place maintenant
la base rangée 50, où la rangée donnerait le palier 9, et asserte que les deux
diffèrent.

### 3.2 — Le coin de la 2 × 2 : **HAUT-GAUCHE**

Une 3 × 3 se centre sur sa case ; une 2 × 2 **n'a pas de centre** —
`data/sites.js` a déjà buté sur cette parité, la carte étant passée de 30 à 31
colonnes pour cette raison. Retenu : la case du site est le coin **haut-gauche**.
Le coin bas-droit serait aussi défendable. **Réversible en une ligne** de
`empriseDeLaGrosseBase`.

### 3.3 — Le seuil de la lettre : **inchangé, et rien de neuf n'a été créé**

Le brief demandait de chercher un seuil existant avant d'en créer un second.
**Trouvé** : `CSS_MINI_LETTRE = 40`, dans `src/ui/monde.js` depuis le lot
ÉCRAN-CARTE — et non dans `data/sites.js` comme le brief le supposait.

Il fait déjà exactement ce que le brief recommande : à `devicePixelRatio` 2, les
crans 128 et 256 px physiques donnent 64 et 128 px CSS et portent la lettre ; les
crans 32 et 64 donnent 16 et 32 px CSS et ne la portent pas. **Aucun second seuil
n'a été créé, et l'existant n'a pas bougé.**

### 3.4 — ⚠ La base terminale, posée pour Ethan et NON décidée

`baseTerminale` prend `site_base_o_n9`, faute de sprite propre : **elle se
confond avec une base de l'Ouvrage de niveau 45 à 50.** C'est mesuré et chiffré
plutôt que laissé passer — le test compte **36 noms distincts** et asserte que la
terminale rend le même nom que `base` au palier 9. Le jour où elle gagnera son
dessin, ce 36 deviendra 37 et le test fera relire ce paragraphe.

**La grosse base 3 × 3 en est le candidat naturel.** C'est un arbitrage.

---

## 4. Les atlas

### `atlas.py --verifier` — sortie exacte

```
bâtiment           34 sprites  6×6    43117 o  (57489 o en base64)
terrain            18 sprites  5×4    10549 o  (14065 o en base64)
defense           204 sprites  15×14   127148 o  (169530 o en base64)
socle              36 sprites  6×6    55376 o  (73834 o en base64)
unite              36 sprites  6×6    50146 o  (66861 o en base64)
chassis            10 sprites  4×3    15322 o  (20429 o en base64)
tourelle-unite     80 sprites  9×9    90581 o  (120774 o en base64)
carte              43 sprites  7×7    86554 o  (115405 o en base64)
src/data/atlas.js  identique
atlas identiques : 8 · différents : 0 · nouveaux : 0
```

**43 sprites, 7 × 7, 86 554 octets** — le chiffre du §8 du brief, retrouvé.

### L'exclusion, assertée dans les deux sens

`FAMILLES` porte désormais **trois champs** par entrée — slug, effectif cousu,
fichiers exclus — et le troisième vaut `()` partout ailleurs : un champ optionnel
aurait laissé croire qu'une famille sans exclusion n'a pas eu à en décider.

⚠⚠ **UNE EXCLUSION SE JUSTIFIE DANS LES DEUX SENS.** Le fichier exclu doit
**exister** et ne doit **pas** être `COTE × COTE`. Sans cette seconde moitié, une
exclusion deviendrait un moyen de faire disparaître un sprite cassé. Les deux
moitiés sont falsifiées :

```
  APPÂT A — exclure poi_reacteur, qui est bien 64×64 :
ATLAS EN ÉCHEC — carte/64 : « poi_reacteur » mesure 64×64 et pourrait donc être cousu.
  Son exclusion n'a plus de raison d'être : retirer sa ligne de FAMILLES.

  APPÂT B — exclure un nom qui n'existe pas :
ATLAS EN ÉCHEC — carte/64 : « nexiste_pas » est exclu de la couture mais absent du disque.
  Une exclusion qui ne désigne rien est une ligne morte : la retirer.
```

### Les marqueurs

Trois neufs — `%ATLAS_CARTE%`, `%BASE_O_2X2%`, `%BASE_O_3X3%`. **Aucun des onze
n'est préfixe d'un autre**, vérifié par balayage croisé, et non par relecture :
tous commencent et finissent par `%`, ce qui est ce qui sauve déjà
`%ATLAS_TERRAIN%` devant `%ATLAS_TERRAIN_BASE%`.

---

## 5. Le dessin

Le sprite remplace le carré arrondi ; **le gabarit reste en REPLI** tant que
l'image n'est pas décodée — une image dessinée trop tôt est blanche, et le défaut
ne se reproduit qu'au tout premier chargement, donc jamais en essai. `monde.js`
attendait déjà son atlas de terrain de cette façon ; on suit le précédent.

⚠ `ctx.imageSmoothingEnabled = false`, posé chez celui qui **crée** le contexte —
un emblème de 64 px source posé sur une case de 32 ou 256 px serait interpolé.

⚠ **Les échelles se LISENT dans `ZOOM_CARTE`** : un emblème se dessine à la
taille d'une case, une grosse base à `cran × cotes` pixels. Un test tombe si un
cran change dans les données sans que le dessin suive.

⚠ **Les coins se posent en entiers.** Un `drawImage` à une position
fractionnaire rééchantillonne et rend le pixel art flou — déjà la règle du fond
de carte.

---

## 6. Les tests

**600 avant, 608 après.** Huit ajoutés — sept dans `test/monde.test.js`, un dans
`test/sprite.test.js`. Aucun fichier de test créé ni retiré.

| # | test du §9 | verdict | montage effectif |
|---|---|---|---|
| 1 | les paliers, aux bornes | **PASS** | les 8 bornes du brief, **plus** le compte des paliers distincts sur les 50 niveaux (9), sans quoi une fonction constante passerait les bornes une à une ; plus la vérification que le plafond est bien atteint par une rangée réelle |
| 2 | hors de 1…50, ça lève | **PASS** | 0, −1, 51, 3.5, NaN, null, undefined ; plus deux témoins qui ne lèvent pas |
| 3 | chaque site résout un sprite de l'atlas | **PASS** | 5 types × 2 saveurs × 9 paliers, **36 noms distincts assertés** ; puis la vraie liste de `sitesDeLaFenetre` |
| 4 | la saveur voyage | **PASS** | deux cases de saveurs **différentes**, assertées telles avant comparaison ; deux camps posés à la main ; plus l'égalité champ par champ avec la fonction du modèle |
| 5 | les neuf pré-branchés sont joignables | **PASS** | les 7 POI dans l'atlas, les 2 grosses bases **hors** atlas et sur le disque, plus leurs deux emprises |
| 6 | les exclusions sont réelles | **PASS** | lues **dans `tools/atlas.py`**, pas recopiées ; chacune existe et n'est pas `COTE × COTE` ; plus un témoin cousable |
| 7 | `ZOOM_CARTE` est la source des échelles | **PASS** | les quatre crans, le côté, le centrage, les coins entiers, et le refus d'un cran hors table |
| + | le palier du joueur vient de ses bâtiments | **PASS** | ajouté après falsification — voir §3.1 |

### Falsification — neuf injections

| injection | tombe |
|---|---|
| la neuvième bande s'arrête à 49 | 3 tests |
| les paliers deviennent constants | paliers |
| la saveur d'un satellite devient une constante | saveur |
| la saveur se lit sur la mauvaise case | saveur |
| un type de site perd son sprite | atlas |
| la 3 × 3 cesse de se centrer | 2 tests |
| l'échelle est écrite en dur | échelles |
| **la base du joueur prend le niveau de sa rangée** | palier du joueur |
| une exclusion cache un sprite cousable | 2 tests |

⚠⚠ **DEUX GARDES SONT PASSÉES VERTES SUR DU CODE CASSÉ, ET ONT ÉTÉ RESSERRÉES.**

1. **La saveur.** Le premier montage bouclait sur `creerEtat(4242)`, qui n'a
   **aucun satellite** — ils sont en attente à 3 000 ticks. Le test ne voyait que
   des bases, dont la saveur est `null` des deux côtés : remplacer la saveur d'un
   satellite par une constante, ou la lire sur la mauvaise rangée, le laissait
   vert. Deux camps sont maintenant posés à la main, comme un état HÉRITÉ, et un
   témoin exige que les deux saveurs soient représentées.
2. **Le palier du joueur** — §3.1.

C'est la troisième fois en trois lots que « un montage écrit à la main ne garde
que lui-même » se vérifie.

### Audit des assertions

| fichier | avant | après | retirées |
|---|---|---|---|
| `test/monde.test.js` | 103 | **145** | 0 |
| `test/sprite.test.js` | 139 | **145** | 0 |
| `test/banc.test.js` | — | — | 0 (borne T10 recalculée, voir §1) |

**Aucune assertion n'a été supprimée ni assouplie.** Deux gardes ont dû
**apprendre** les exclusions plutôt que d'être relâchées :
`sprite — l'index dit exactement ce que le disque porte` comparait l'index au
listage brut, et la famille `carte` en porte 45 pour 43 cousus. Elle lit
désormais les exclusions **dans `tools/atlas.py`** — recopier la liste aurait été
la seconde vérité que le lot précédent a passé son temps à retirer — et un test
voisin vérifie que chaque exclusion est légitime dans les deux sens. L'exigence
s'est resserrée, pas assouplie.

---

## 7. Vérifications appareil — **NON EXÉCUTÉES**

Le dépôt n'a ni jsdom ni navigateur (CLAUDE.md §3).

Ce lot :

1. les emblèmes restent **nets** aux quatre crans de zoom
   (`imageSmoothingEnabled = false` doit s'y voir) ;
2. au cran le plus serré, **un site se distingue encore d'un autre** — c'est là
   qu'un emblème vaut 10,7 px CSS et que la lettre disparaît ;
3. la base du joueur **se repère d'un coup d'œil** parmi les bases de l'Ouvrage ;
4. le gabarit de repli ne se voit pas — l'atlas doit être décodé avant le premier
   dessin, et un carré arrondi qui clignote au premier chargement dirait le
   contraire ;
5. la base terminale **se confond** bien avec une base de l'Ouvrage du dernier
   palier — c'est le défaut du §3.4, à constater avant d'arbitrer.

En attente des lots précédents, reprises telles quelles : les unités portent leur
sprite à la bonne pose et à la bonne orientation ; la tourelle d'un blindé suit
l'ancre de sa coque ; les seize orientations se lisent pendant une approche ;
l'accent d'une unité reste lisible sans la légende ; un bâtiment joueur et un
bâtiment Ouvrage se distinguent au combat ; une casemate a le même dessin aux
trois endroits ; le socle est sous la tourelle ; le raccord d'un merlon se défait
à la mort de sa voisine ; le temps de rendu d'une dalle sur l'appareil.

---

## 8. Écarts par rapport au brief

1. **Le seuil de la lettre est dans `ui/monde.js`, pas dans `data/sites.js`.** Le
   brief le disait dans les données. Trouvé, réutilisé, rien créé — §3.3.
2. **Le §9.3 annonçait un balayage « des cinq types, deux saveurs et neuf
   paliers » ; le compte de noms distincts est 36, pas 37.** La terminale partage
   `site_base_o_n9` et n'ajoute donc aucun nom. Mon premier chiffre était faux ;
   le code avait raison, et l'écart est devenu une assertion — §3.4.
3. **Un huitième test a été ajouté**, hors des sept du §9 : le palier de la base
   du joueur. La falsification l'a rendu obligatoire — §3.1.
4. **Deux gardes existantes ont dû apprendre les exclusions** — §6.

---

## 9. Points laissés en suspens

1. **La base terminale n'a pas de dessin propre** — §3.4. Arbitrage d'Ethan.
2. **Les neuf pré-branchés ne sont dessinés par rien**, et c'est assumé : le
   modèle ne produit aucun POI, et `sim/peuplement.js` pose des bases d'**une**
   case. Ils coûtent 37 038 octets pour les deux grosses bases, payés par tous
   les joueurs pour ce que personne ne voit encore. Ce que ça achète : le jour où
   le modèle en produira, **seul le modèle changera**.
3. **La famille `effet` reste la dernière non cousue**, et attend un événement de
   mort que le moteur ne publie pas. Ce sera la dernière hausse de borne de cette
   série.
4. **Les 56 MANQUANTS de `tools/verifier.py` attendent toujours un arbitrage** —
   54 tuiles de terrain sans source et 2 fichiers de `carte/` livrés finis. Ce
   lot n'y touche pas ; voir `RAPPORT-CHAINE-VERIFIEE.md` §5.
5. **Ce lot et CHAÎNE-VÉRIFIÉE partagent une branche.** La PR de CHAÎNE-VÉRIFIÉE
   n'était pas encore mergée quand celui-ci a commencé, et la consigne fixe la
   branche de développement : les deux lots sont donc dans la même PR, chacun
   avec son commit et son rapport.
