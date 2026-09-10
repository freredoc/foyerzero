# Rapport — lot EMPRISES-ET-DÉLAI

Exécuté le **10/09/2026 au soir**, sur `main` = **`d68c4d1`** (PR #127 fusionnée).
Branche : `claude/new-session-g2ki79`. **`main` n'a pas bougé sous le lot** —
vérifié au `git fetch` en fin d'exécution, il est toujours à `d68c4d1`.

---

## 0. Ce que le lot produit

| | |
|---|---|
| version · build | **0.99.40 · build 142** (les deux en CHAÎNES dans `package.json`) |
| `npm test` | **1556 déclarés · 1555 pass · 0 fail · 1 skipped** (`LIMITE T8`, suspendu le 08/09) |
| `npm run check` | sort en **0** |
| `dist/index.html` | **9 404 978 octets**, 0 référence externe |
| borne T10 | **9 600 000, NON TOUCHÉE** — le lot allège |
| marge T10 | **195 022 octets, 2,03 %** |
| `SAVE_VERSION` | **31**, inchangé |

⚠ **Le lot REND 20 443 octets.** C'est le premier depuis SPRITES-V2-JOUEUR à en
rendre, et ce n'est pas une économie cherchée : neuf bâtiments sur vingt
rétrécissent, et un WebP q85 compresse mieux un dessin plus petit.

---

## 1. Ventilation poste par poste

Mesurée contre un livrable **rebâti dans un `git worktree` pristine à
`d68c4d1`** au premier `npm run check` de la session. Chaque poste est NET de
ses `data:`, et les cinq PARTITIONNENT le fichier des deux côtés.

| poste | AVANT | APRÈS | écart |
|---|---:|---:|---:|
| images | 7 652 091 | 7 631 243 | **−20 848** |
| audio | 1 193 346 | 1 193 346 | +0 |
| feuille | 141 932 | 141 932 | +0 |
| JavaScript | 402 229 | 402 634 | **+405** |
| balisage | 35 823 | 35 823 | +0 |
| **TOTAL** | **9 425 421** | **9 404 978** | **−20 443** |

**Somme des cinq postes : −20 443 — partition exacte.**
`data:` : **311 lignes / 306 URI** des deux côtés — aucune ressource n'entre ni
ne sort.

⚠⚠ **LES −20 848 OCTETS D'IMAGES SONT UN SEUL FICHIER, AU DERNIER OCTET.**
`atlas-batiment-128.webp` passe de **507 076 à 491 442**, soit
**676 104 → 655 256 en base64** : l'écart du poste `images` EST celui de cet
atlas-là. La grille 64 maigrit aussi — **185 210 → 179 002** — et **ne coûte
rien au livrable**, `GRILLE_ATLAS` valant 128.

⚠ **Les +405 octets de JavaScript sont la table des cinquante plafonds**, moins
ce que la ligne `delaiDeplacementMinutes` rendait. Aucun autre poste ne bouge :
le lot ne touche ni `src/ui/`, ni `src/render/`, ni `src/son/`, ni
`src/index.src.html`, ni `tools/build.js` — vérifié au diff.

---

## 2. Fichiers touchés

**Modifiés** — `CLAUDE.md`, `package.json`, `src/data/sites.js`,
`src/sim/deplacement.js`, `tools/batiments_v2.py`, `tools/ruines.py`,
`test/art-90.test.js`, `test/deplacement.test.js`, `test/pictogramme.test.js`,
`test/state.test.js`, **86 PNG** de `art/sprites/bâtiment/`, les deux atlas
`batiment` et `art/sprites/atlas-empreintes.json`.

**Entrent** — `test/emprises-et-delai.test.js`, `RAPPORT-lotEMPRISES-ET-DELAI.md`.

⚠ **`tools/joueur_v2.py` N'A PAS UNE LIGNE DE CHANGÉE**, et
`EMPRISE_QUATRE_VINGT_DIX` y vaut toujours 29 pour les murs, les barrières et
les socles d'artillerie — voir §3.

### Les 86 PNG, comptés

166 fichiers sont réécrits par la chaîne (162 par `batiments_v2.py`, 4 par
`ruines.py`) ; **86 changent**, et le compte se décompose :

| palier | sprites par grille | PNG modifiés (deux grilles) |
|---|---:|---:|
| 31 — Chantier, Souche | 8 | **16** |
| 27 — les huit de l'économie | 32 | **64** |
| 27 — la vignette mixte | 1 | **2** |
| 31 — les deux ruines | 2 | **4** |
| 29 — les dix autres bâtiments | 40 | **0** |
| | **81 + 2** | **86** |

⚠⚠ **DIX BÂTIMENTS NE BOUGENT PAS D'UN PIXEL, ET C'EST LE FAIT LE MOINS
ÉVIDENT DU LOT.** 92 % de 32 font 29,44, donc **29** — exactement ce qu'ART-90
avait posé partout. Le palier médian est un non-événement, et c'est ce qui rend
ce lot-ci beaucoup moins cher que celui du matin.

---

## 3. §1 · §1bis — les trois paliers

Ethan : « Passer tous les bâtiments collecteur et central etc à 85. Les autres
92 %. Chantier et souche 98 % », puis, la classification lui ayant été soumise
ligne par ligne, « Emprise 3 palier ok ».

### Les trois nombres, et les trois écarts déclarés

| palier | % voulu | 32 × % | retenu | % réel | écart |
|---|---:|---:|---:|---:|---:|
| haut | 98 | 31,36 | **31** | 96,9 | −0,36 gros pixel |
| médian (défaut) | 92 | 29,44 | **29** | 90,6 | −0,44 |
| bas | 85 | 27,2 | **27** | 84,4 | −0,20 |

Les trois sont **sous le demi-gros pixel**. Aucun n'est arrondi vers le haut :
31,36 → 32 déborderait la case.

### Le partage, bâtiment par bâtiment

- **31** — `chantier_de_construction`, `souche` (2 bâtiments, 8 sprites/grille).
- **27** — `centrale`, `collecteur_quartz`, `collecteur_scorie`, `raffinerie`,
  `accumulateur`, `noeud`, `gangue`, `terril` (8 bâtiments, 32 sprites/grille),
  plus la vignette `collecteur_mixte`.
- **29, par DÉFAUT** — `centre_de_commandement`, `qg_de_defense`,
  `complexe_de_defense`, `caserne`, `depot_de_vehicules`, `aerodrome`, les trois
  artilleries, `etai` (10 bâtiments, 40 sprites/grille).

⚠ **CASERNE, DÉPÔT ET AÉRODROME SONT AU PALIER DES « AUTRES », PAS À CELUI DE
L'ÉCONOMIE**, et c'est un choix qui a été soumis à Ethan puis validé : ils
PRODUISENT des unités, ils ne produisent pas de ressource. La formule d'Ethan
nomme « collecteur et central etc », c'est-à-dire la chaîne
quartz/scorie/électricité et ses deux entrepôts, plus leurs pendants de
l'Ouvrage.

### Ce qui est écrit, et où

```python
EMPRISE_QUATRE_VINGT_DIX_HUIT = 31
EMPRISE_QUATRE_VINGT_DOUZE = 29
EMPRISE_QUATRE_VINGT_CINQ_BATIMENT = 27
EMPRISE_DEFAUT = EMPRISE_QUATRE_VINGT_DOUZE
```

⚠⚠ **LES TROIS SONT ÉCRITS DANS `batiments_v2.py` ET NON LUS DANS
`joueur_v2.py`, ALORS QUE DEUX DE LEURS VALEURS Y EXISTENT DÉJÀ.**
`EMPRISE_QUATRE_VINGT_DIX` (29) et `EMPRISE_QUATRE_VINGT_CINQ` (27) y servent
les murs, les barrières et les socles d'artillerie — des UNITÉS et des DÉFENSES,
qu'Ethan a nommément exclues : « seulement bâtiment, pas unités ». Les partager
ferait bouger quatorze unités le jour où il règle le palier des collecteurs, et
**aucun test ne le dirait** puisque les nombres sont ÉGAUX aujourd'hui.
`batiments_v2.py` cesse donc d'IMPORTER `joueur_v2` — `ED T2` garde l'absence de
cet import **par le STATEMENT, jamais par le mot**, la docstring nommant
légitimement l'autre outil.

⚠⚠ **LA TABLE NE PORTE QUE LES DEUX EXCEPTIONS, ET LE DÉFAUT EST ÉCRIT COMME UN
DÉFAUT.** Un vingt-et-unième bâtiment ajouté demain prend 92 % sans que personne
ne l'inscrive. ⚠ Le prix de ce choix : **une clé mal orthographiée enverrait son
bâtiment au défaut EN SILENCE**. `emprise_du_batiment` LÈVE donc sur toute clé
absente de `BATIMENTS`, en la nommant :

```
AssertionError : EMPRISE_PAR_BATIMENT : collecteur_scorries — aucun bâtiment de
ce nom dans `BATIMENTS` ; une clé mal orthographiée enverrait son bâtiment au
palier par défaut en silence
```

### La vignette mixte redevient un CALCUL

Le second membre de `VIGNETTES` avait cessé d'en être un au lot ART-90, qui
écrivait qu'il « ne sert plus à CALCULER l'emprise ; il dit QUEL bâtiment la
vignette représente ». Les paliers reviennent, donc l'emprunt aussi : l'emprise
de `collecteur_mixte` est **celle de `collecteur_quartz`, lue dans la table**.

⚠ Écrire `27` en dur **passerait aujourd'hui** — c'est mesuré, voir la
falsification F11 — et se tairait au premier réglage d'Ethan. `ED T3` compare
donc les DEUX SORTIES et prouve d'abord que le collecteur n'est PAS au palier
par défaut.

### Les deux ruines

Ethan : « Les ruines doivent suivre les bâtiments ». Retenu : le palier **HAUT**,
26 → **31**, et non le défaut — une ruine remplace à l'écran une base RASÉE TOUT
ENTIÈRE ; plus petite que le bâtiment central qu'elle recouvre, elle se lirait
comme un rétrécissement du site.

Boîtes d'encre mesurées, en unités de 32 :

| sprite | grille | AVANT | APRÈS |
|---|---:|---|---|
| `ruine_j` | 64 | 26,0 × 10,5 | **31,0 × 12,0** |
| `ruine_o` | 64 | 26,0 × 11,0 | **31,0 × 13,0** |
| `ruine_j` | 128 | 26,0 × 10,2 | **31,0 × 12,0** |
| `ruine_o` | 128 | 26,0 × 10,5 | **31,0 × 12,5** |

⚠ **Le nombre s'IMPORTE** : `ruines.py` lit `EMPRISE_QUATRE_VINGT_DIX_HUIT` de
`batiments_v2.py`. Deux `31` dans deux fichiers seraient deux occasions de
diverger, et celle-là serait muette. **Comptes vérifiés** :
`EMPRISE_QUATRE_VINGT_DIX_HUIT` apparaît 3 fois dans `batiments_v2.py`
(définition + les deux lignes de la table) et 2 fois dans `ruines.py`
(import + emploi) ; **une seule définition dans tout `tools/`**, ce que `ED T4`
compte.

### La tolérance du panache d'ART-90 : reconduite, remesurée, ENCORE NÉCESSAIRE

`bat_j_artillerie_anti_infanterie_tres_abime` sort à **57 sur 58** en grille 64
et **114 sur 116** en 128 — **exactement les nombres d'ART-90**, parce que son
palier n'a pas bougé : elle est au 92 %, celui qui vaut encore 29. La cause est
`eroder(m, 3)` de `conditionner`, pas l'arrondi, et un changement d'emprise ne
la touche pas. **Quatre-vingts sprites sur quatre-vingts tombent AU PIXEL sur
leur palier, sur les deux grilles.** La tolérance est donc reconduite
NOMMÉMENT dans `ED T1`, avec sa cause.

---

## 4. §3 — la recouture des atlas

⚠⚠ **LE PIÈGE D'ART-90 S'EST REPRÉSENTÉ À L'IDENTIQUE, ET IL A ÉTÉ MESURÉ
PLUTÔT QU'ÉVITÉ DE MÉMOIRE.** `tools/build.js` n'inline pas les PNG, il inline
les atlas cousus. Falsification **F15**, jouée pour de bon : les atlas d'avant
le lot remis en place sous les PNG du lot, `npm run build` rend
**9 425 826 octets** — c'est-à-dire 9 425 421 + les 405 octets de JavaScript,
les images étant revenues à leur poids d'hier. **Deux gardes tombent** :
`PIC T6` et `sprite — l'atlas cousu répond des sprites d'aujourd'hui`.

Commande jouée : `python3 tools/atlas.py --ecrire --forcer batiment`.
⚠ `--forcer` est obligatoire : sans lui l'outil imprime « ÉCART » et **n'écrit
pas** — c'est l'invariant « on n'écrase jamais un fichier existant qui ne se
reproduit pas ».

### Familles recousues — et celles qui ne l'ont PAS été

| famille | recousue ? | motif |
|---|---|---|
| `batiment` 64 et 128 | **OUI** | 86 sprites changent |
| `carte` 64 | **NON** | écart PRÉEXISTANT, zéro sprite changé |
| `carte` 128 | **NON** | idem |
| `interface` 128 | **NON** | idem |
| les 14 autres | sans objet | identiques |

⚠⚠ **C'EST UN ÉCART DÉCLARÉ AU BRIEF, TRANCHÉ PAR LA MESURE.** Le §3 demandait
de recoudre « chacune des familles listées » par les lignes ÉCART, et `carte`
comme `interface` y apparaissent. **Mesuré sur le `git worktree` pristine à
`d68c4d1`, AVANT d'écrire une ligne : `atlas.py --verifier` y rend déjà
17 identiques · 3 différents — `carte-64`, `carte-128`, `interface-128`, et eux
seuls** — ce qui est exactement ce qu'ART-90 a laissé et a écrit. Leur écart est
l'encodeur WebP de cette machine ; **aucun sprite de ces deux familles n'a
changé** (zéro fichier au `git status`). Les recoudre aurait réécrit des images
identiques avec les octets de cette machine-ci, ce que `CLAUDE.md` interdit
depuis le lot PICTOGRAMMES. **Le lot laisse ces trois-là exactement où il les a
trouvés.**

Verdict final, arbre du lot : **17 atlas identiques · 3 différents · 0 nouveau**,
`src/data/atlas.js` **identique**, `atlas-empreintes.json` **identique**.

⚠ **LE COMPTE DE « DIFFÉRENTS » INCLUT `atlas-empreintes.json` LUI-MÊME**, et il
fallait le lire dans le code plutôt que le supposer : `atlas.py` l'ajoute à la
liste. `src/data/atlas.js`, lui, n'y est pas — la géométrie des cellules ne
change pas, 83 sprites en 10 × 9 des deux côtés.

⚠⚠ **ET `--ecrire` SEUL ÉCRIT QUAND MÊME LE MANIFESTE, CE QUI LAISSE UN ÉTAT
INCOHÉRENT — trouvé en le faisant.** L'appel de reconnaissance du §3, celui qui
ne devait rien écrire, a modifié `atlas-empreintes.json` alors qu'aucun `.webp`
ne l'était. Restauré au `git checkout` avant de mesurer quoi que ce soit. Le
manifeste final est cohérent, et `ED T5` le confronte au disque.

---

## 5. §4 — `PIC T7` réancré

⚠⚠ **IL MENTAIT DEPUIS UN LOT.** Il écrivait **9 410 485** quand le disque en
rendait **9 425 421** : **14 936 octets de dérive**, donc SOUS la tolérance de
50 000, donc VERT. Le lot ÉCRANS connaissait le bon chiffre — son rapport écrit
9 425 421, marge 174 579, 1,82 % — et n'a pas rouvert `test/pictogramme.test.js`.
C'est très exactement ce que la dernière assertion de ce test existe pour
empêcher : **la tolérance garde contre la dérive lente, pas contre un lot qui
sait ce qu'il déplace.**

Réancrage, **cumulatif et non effacé** :

```js
const BORNE  = 9_600_000;   // T10, relevée au lot ART-90
const MESURE = 9_404_978;   // mesuré le 10/09 au soir, base `d68c4d1`
const MARGE  = BORNE - MESURE;   // 195 022 octets
// 9 410 485 était l'ancre du lot ART-90 ; le disque en rendait 9 425 421 dès le
// lot ÉCRANS — 14 936 octets sous la tolérance, donc muets.
```

`PIC T6` est réancré aussi, **dans l'autre sens que d'habitude** : les deux
atlas `batiment` MAIGRISSENT, et les seize autres lignes n'ont pas bougé d'un
octet.

| atlas | ancre précédente | ancre du lot |
|---|---:|---:|
| `atlas-batiment-128.webp` | 507 076 | **491 442** |
| `atlas-batiment-64.webp` | 185 210 | **179 002** |

---

## 6. §5 — le délai de déplacement

Ethan, le soir du 10/09 : « 1 h 30 niv 10 distance 10 ; 3 h niv 20 d10 ; 6 h niv
30 d10 ; 12 h niv 40 d10 ; 24 h niv 50 d10 », puis « 1 h mini ».

⚠⚠ **CE LOT RENVERSE UN LOT DU MATIN MÊME.** La droite de RÈGLES-DE-CARTE —
`60 + niveau + (distance − 1)` minutes — plafonnait le jeu entier à **1 h 59** ;
le pire cas vaut de nouveau **24 h**.

### La forme

```
plafond(niveau) = 900 × 2 ^ ((niveau − 10) / 10)     en dixièmes de minute
délai           = 600 + max(0, plafond − 600) × distance / portéeMax
```

⚠⚠ **AUCUN `Math.pow` DANS LE MOTEUR, ET LES CINQUANTE PLAFONDS SONT
PRÉCALCULÉS DANS `src/data/sites.js`.** Cette durée **entre dans la
sauvegarde** — `dernierDeplacementDelaiTicks`, posé au lot RÈGLES-DE-CARTE — et
`2 ^ 0,1` n'est pas garanti bit à bit d'un moteur JavaScript à l'autre : une
divergence de dernier bit donnerait deux attentes différentes pour la même
partie selon le navigateur.

⚠ **ET LE RISQUE EST MESURÉ, PAS CRAINT** : `plafond(8)` vaut **783,4955**, à
quatre millièmes d'une bascule d'arrondi. C'est le seul des cinquante qui en
approche une, et il suffit à justifier la table.

⚠⚠ **LE PLANCHER D'UNE HEURE EST DANS LA FORME, PAS POSÉ SUR LE RÉSULTAT.** Un
`Math.max(600, …)` final rendrait le même nombre et cacherait le mécanisme : le
`max(0, plafond − 600)` dit que **c'est le SURPLUS qui se paie à la distance**.

⚠⚠ **CE QU'IL COÛTE EST À DIRE : SOUS LE NIVEAU 4,2 LA DISTANCE EST GRATUITE.**
Le plafond passe sous 600 en dessous de ce niveau — mesuré, `plafond(1) = 482` —
donc dix cases coûtent autant qu'une, et **une base NEUVE est exactement dans ce
cas**, donc le premier déplacement de toute partie. C'est une conséquence de la
forme d'Ethan, pas un oubli. **Ethan tranche** s'il la veut payante dès le
premier niveau ; le levier est le `900` de la formule, ou un plancher de niveau.

⚠⚠ **ET CE FAIT-LÀ A ÉTÉ TROUVÉ PAR TROIS GARDES « LE MONTAGE NE MESURE RIEN »,
QUI ONT MORDU ENSEMBLE.** `DÉPLACEMENT T8`, `RC T5` et `RC T6` portaient chacun
un « dix cases coûtent autant qu'une » ; les trois montages posaient une base
NEUVE. **C'est le MONTAGE qu'on répare, jamais l'assertion** — les assouplir
aurait retiré la seule chose qui disait que la distance compte.
`baseHorsDuPlancher` les monte au-dessus de 4,2 et vérifie que la distance
discrimine.

### L'interpolation, sur les DIXIÈMES

⚠⚠ **`niveauDesBatiments` REND 86 POUR UNE BASE DE NIVEAU 8,6** — le piège déjà
payé deux fois par le dépôt. Le plafond vaut
`783 + arrondi((840 − 783) × 6 / 10)` = **817**, jamais `plafonds[85]` ni
`plafonds[7]`. Le délai à distance 1 rend alors **622** dixièmes de minute.
⚠ Au plafond exact, l'interpolation ne lit PAS `plafonds[50]`, qui n'existe pas :
c'est un `return` qui le dit, pas un commentaire.

⚠ **LA CONVERSION EN TICKS EST EXACTE, MESURÉ** : un dixième de minute vaut six
secondes, donc **exactement soixante ticks** à 10 Hz. L'arrondi final est un
non-événement aujourd'hui, et la monotonie du barème en dixièmes se transporte
telle quelle en ticks.

### La table du §6 — MESURÉE, ligne par ligne

| niveau | distance | brief | mesuré | ticks |
|---:|---:|---|---|---:|
| 1,0 | 10 | 1 h 00 | **1 h 00** — 600 dixièmes | 36 000 |
| 10,0 | 1 | 1 h 03 | **1 h 03** — 630 | 37 800 |
| 10,0 | 5 | 1 h 15 | **1 h 15** — 750 | 45 000 |
| 10,0 | 10 | 1 h 30 | **1 h 30** — 900 | 54 000 |
| **8,6** | 1 | 1 h 02,2 — 622 | **1 h 02,2 — 622** | 37 320 |
| 20,0 | 1 | 1 h 12 | **1 h 12** — 720 | 43 200 |
| 20,0 | 10 | 3 h 00 | **3 h 00** — 1 800 | 108 000 |
| 30,0 | 10 | 6 h 00 | **6 h 00** — 3 600 | 216 000 |
| 40,0 | 10 | 12 h 00 | **12 h 00** — 7 200 | 432 000 |
| 50,0 | 1 | 3 h 18 | **3 h 18** — 1 980 | 118 800 |
| 50,0 | 10 | 24 h 00 | **24 h 00** — 14 400 | 864 000 |

**Onze lignes sur onze tombent juste.** Aucun désaccord entre le brief et le
lot ; il n'y avait donc rien à arbitrer.

### Ce que le barème déplace, mesuré des deux côtés

| niveau | distance | AVANT (RÈGLES-DE-CARTE) | APRÈS | rapport |
|---:|---:|---|---|---:|
| 1,0 | 1 | 1 h 01,0 | **1 h 00,0** | ×0,98 |
| 1,0 | 10 | 1 h 10,0 | **1 h 00,0** | ×0,86 |
| 8,6 | 1 | 1 h 08,6 | **1 h 02,2** | ×0,91 |
| 10,0 | 10 | 1 h 19,0 | **1 h 30,0** | ×1,14 |
| 20,0 | 1 | 1 h 20,0 | **1 h 12,0** | ×0,90 |
| 25,5 | 1 | 1 h 25,5 | **1 h 20,4** | ×0,94 |
| 30,0 | 10 | 1 h 39,0 | **6 h 00,0** | ×3,64 |
| 50,0 | 1 | 1 h 50,0 | **3 h 18,0** | ×1,80 |
| 50,0 | 10 | 1 h 59,0 | **24 h 00,0** | **×12,10** |

⚠ **Le bas de la carte devient plus RAPIDE, le haut beaucoup plus lent.** C'est
la forme d'Ethan : elle échange une droite quasi plate contre une géométrique.

⚠ **LES SAUVEGARDES EXISTANTES GARDENT LA DURÉE CONTRACTÉE SOUS L'ANCIEN
BARÈME**, ce qui est juste : un joueur a contracté une attente, il la purge.
**Rien n'est rétro-corrigé**, et `SAVE_VERSION` ne bouge pas — aucun champ
n'entre ni ne sort, `dernierDeplacementDelaiTicks` existe depuis
RÈGLES-DE-CARTE et porte toujours une durée en ticks.

---

## 7. §6 — les sept tests, avec leur montage effectif

| test | verdict | montage effectif |
|---|---|---|
| **`ED T1`** | **PASS** | les **81** sprites de `art/sprites/bâtiment/64` ET de `/128`, boîte d'encre au seuil `SEUIL_ALPHA` LU dans `tools/final128.py` ; la table des paliers est obtenue en EXÉCUTANT `emprise_du_batiment` pour chaque clé, jamais recopiée. Exige **trois emprises distinctes** — c'est la falsification de face de l'ancienne règle « tous à 29 ». Tolérance panache reconduite nommément (1 sprite, grille 128, cause érosion). |
| **`ED T2`** | **PASS** | les trois paliers deux à deux différents, `EMPRISE_DEFAUT === 29`, toute clé hors table rend 29 ; la garde anti-faute-de-frappe est exercée **pour de bon** par monkeypatch d'une clé absente + `assert.throws` ; l'absence de l'import `joueur_v2` est mesurée sur la source **DÉCOMMENTÉE**, par le STATEMENT, avec un témoin et un appât. |
| **`ED T3`** | **PASS** | `taches()` rend pour `bat_j_collecteur_mixte` **la même emprise** que pour `bat_j_collecteur_quartz` — les DEUX SORTIES comparées, jamais l'une à un nombre. Prouve d'abord que le collecteur n'est PAS au défaut, puis **forge** `EMPRISE_PAR_BATIMENT['collecteur_quartz'] = 21` et exige que la vignette suive. |
| **`ED T4`** | **PASS** | boîtes de `ruine_j` et `ruine_o` en 64 ET en 128, exigées à `2 × 31` ; puis balayage de `tools/*.py` : **une seule définition** de `EMPRISE_QUATRE_VINGT_DIX_HUIT`, et `ruines.py` l'IMPORTE. |
| **`ED T5`** | **PASS** | `atlas-empreintes.json` confronté au disque, SHA-256 par sprite ET par atlas, pour la famille `batiment` aux deux grilles. La garde historique de `test/sprite.test.js` est verte elle aussi. |
| **`ED T6`** | **PASS** | les onze lignes ci-dessus, plus le chemin de l'interpolation **REFAIT à la main** (783 → 817 → 622) et non recopié, plus l'interdiction de `Math.pow` dans `src/sim/` et `src/data/`, plus la table lue à **50 entrées** exactement. |
| **`ED T7`** | **PASS** | **5 000 points** balayés — 500 dixièmes de niveau × 10 distances, dont les neuf premiers exercent la borne `[10, 500]`, soit **4 910 distincts**. Monotonie large sur les DEUX axes, plancher tenu à 600, et le point où le plancher cesse de mordre mesuré à **4,2** exactement. |

⚠ **Aucun test n'a été supprimé, aucune assertion assouplie.** Un test SORT de
`test/art-90.test.js` — `AR T2` — et il ne disparaît pas : il DEVIENT `ED T1`.

### Les gardes existantes qui changent de cible

Six, et **toutes se RESSERRENT ou se RETOURNENT** :

- **`AR T2` → `ED T1`** — RETOURNÉ. Il exigeait que les quatre-vingt-un sprites
  prennent TOUS 29, ce qui est la propriété qu'Ethan renverse. Précédent exact :
  `EMB T6` → `EMB-C T1` au lot EMBLÈME-CENTRÉ. Un bloc de commentaire reste dans
  `test/art-90.test.js` pour dire où il est parti.
- ⚠⚠ **`AR T3`** — il était devenu **un PROXY MUET, vert en ne mesurant plus
  rien.** Il comptait TROIS occurrences de `EMPRISE_QUATRE_VINGT_DIX` avec un
  motif **NON BORNÉ** ; le palier haut s'appelle
  `EMPRISE_QUATRE_VINGT_DIX_HUIT`, dont l'ancien nom est un **PRÉFIXE**.
  **Mesuré : le motif non borné en trouve exactement 3, le motif borné en trouve
  ZÉRO.** La garde passait au vert en comptant une constante qu'elle ne nomme
  pas. C'est le piège du préfixe que `MODULES-D` a payé avec `moduleDefense` et
  `CLAUDE.md` §6 avec `jouer(` contre `rejouer(`. Il est RETOURNÉ, borné en
  Unicode, et gagne un appât.
- **`PIC T6`** et **`PIC T7`** — réancrés, l'ancien nombre écrit à côté du neuf.
- **`DÉPLACEMENT T7`** et **`RC T4`** — le barème est retourné, les deux règles
  mortes falsifiées de face ; les cinq lignes de `RC T4` sont réancrées avec
  l'ancienne valeur en commentaire de fin de ligne.
- **Trois montages remontés au-dessus du plancher** — `DÉPLACEMENT T8`, `RC T5`
  (deux montages), `RC T6`.

### L'invariant de rattrapage, rejoué des deux côtés

`tickJeu` × 2 592 000 contre `rattraperJeu(2 592 000)`, **72 h, cinq graines,
sérialisation comparée à l'octet** :

| graine | AVANT (`d68c4d1`) | APRÈS | taille |
|---:|---|---|---:|
| 1 | identique | identique | 1 404 o |
| 7 | identique | identique | 1 404 o |
| 42 | identique | identique | 1 406 o |
| 2026 | identique | identique | 1 410 o |
| 31337 | identique | identique | 1 412 o |

**0 divergence sur 5, des deux côtés**, et **la sauvegarde ne grandit pas d'un
octet** — les cinq tailles sont identiques avant et après.

### Les témoins

⚠⚠ **LES DEUX CENTS TÉMOINS DE COMBAT NE BOUGENT PAS, ET LE TÉMOIN DE BASES-0
NON PLUS.** `test/temoins-combat.js` et `test/temoins-bases-0.js` n'ont pas une
ligne de changée, et les fichiers de test qui les rejouent sont verts. **Aucune
couche `DEPLACES_PAR_EMPRISES_ET_DELAI` n'est ajoutée**, parce qu'il n'y a rien
à attribuer : le lot ne touche ni le moteur de combat, ni le placement, ni une
garnison, et le scénario de BASES-0 ne déplace pas de base.

---

## 8. Les falsifications — 13 mordent, 1 déclarée inerte

### Côté délai — 7 mordent, 0 muette

| | falsification | chutes |
|---|---|---|
| F1 | `Math.pow` remis dans le moteur | 1 — `ED T6` |
| F2 | interpolation retirée, niveau entier seul | 3 — `DÉPLACEMENT T7`, `RC T4`, `ED T6` |
| F3 | la table lue comme si elle avait 500 entrées | 6 — `DÉPLACEMENT T7`, `DÉPLACEMENT T8`, `RC T4`, `RC T5`… |
| F4 | la garde du plafond exact retirée (`plafonds[50]` lu) | 4 — `DÉPLACEMENT T7`, `RC T4`, `ED T6`, `ED T7` |
| F5 | le plancher retiré du terme de distance | 4 — idem |
| F6 | un plafond de la table retouché à la main (niveau 8) | 1 — `ED T6` |
| F7 | le plancher passé de 600 à 0 | 4 — `DÉPLACEMENT T7`, `RC T4`, `ED T6`, `ED T7` |

### Côté art — 6 mordent, 0 muette

| | falsification | chutes |
|---|---|---|
| F9 | la table des paliers vidée (tout au défaut) | 3 — `ED T1`, `ED T2`, `ED T4` |
| F10 | une clé mal orthographiée (`collecteur_scorries`) | **l'OUTIL lève** ; le fichier de test entier tombe |
| F11 | la vignette mixte écrite en dur à 27 | 1 — `ED T3` |
| F12 | un seul des deux `out.append` remis sur la constante | 2 — `AR T3`, `ED T3` |
| F13 | l'import de `joueur_v2` revenu | 2 — `AR T3`, `ED T2` |
| F14 | `ruines.py` recopie 31 au lieu de l'importer | 1 — `ED T4` |

⚠ **F10 mord DANS L'OUTIL, et c'est le bon endroit** — `emprise_du_batiment`
LÈVE avant qu'un seul PNG ne soit écrit, exactement comme `atlas.py` refuse
d'écraser ce qui ne se reproduit pas. Le fichier de test tombe en bloc parce
qu'il exécute le Python à son chargement ; ce n'est pas un test NOMMÉ qui
tombe, et il fallait le dire plutôt que de le compter comme tel.

### F15 — le piège d'ART-90

Atlas d'avant remis sous les PNG du lot : le livrable rend **9 425 826** au lieu
de 9 404 978, et **deux gardes tombent** — `PIC T6` et
`sprite — l'atlas cousu répond des sprites d'aujourd'hui`.

### ⚠⚠ F8 — LA SEULE QUI NE MORD PAS, ET ELLE SE DÉCLARE

**F8 : `DEPLACEMENT.porteeMaxCases` remplacé par `10` écrit en dur.**
**Mesurée : elle ne fait tomber AUCUN test.** La portée vaut 10 aujourd'hui,
donc les deux écritures rendent le même nombre partout ; il n'existe aucun état
du dépôt qui les distingue. Écrire un test pour elle serait écrire un test qui
ne peut tomber sur aucune donnée d'aujourd'hui — le dépôt le refuse
nommément. **Elle est déclarée, elle n'est pas comptée**, et elle tombera le
jour où Ethan changera la portée.

---

## 9. `tools/verifier.py` — lancé AVANT et APRÈS

⚠ **L'AVANT A ÉTÉ LANCÉ DANS UN `git worktree` PRISTINE ISOLÉ** —
`CLAUDE.md` interdit de le lancer sur un arbre qu'on modifie, et le lot avait
dix minutes de travail à faire pendant.

| | AVANT (`d68c4d1`, worktree isolé) | APRÈS (arbre du lot) |
|---|---|---|
| identiques à l'octet | **1 110** | **1 110** |
| différents | 0 | 0 |
| nouveaux | 0 | 0 |
| MANQUANTS | 0 | 0 |
| durée | 557,0 s | 583,9 s |
| code de sortie | **1**, sur la seule ligne `ATLAS` | **1**, sur la seule ligne `ATLAS` |

⚠⚠ **LES 86 PNG RÉGÉNÉRÉS SONT DANS LES « IDENTIQUES À L'OCTET ».** C'est la
seule chose qui dise que les trois paliers commités viennent de l'outil commité.

⚠ **La ligne `ATLAS` est PRÉEXISTANTE** — `atlas.py --verifier` rend
**17 identiques · 3 différents** des deux côtés, sur `carte-64`, `carte-128` et
`interface-128`. Le lot **laisse ce compte exactement où il l'a trouvé**.

⚠ `entrees.py --verifier` rend **501 / 501 consommées et 152 / 152 dormantes**,
`art/sourcesstandby/` 34 fichiers **0 lu**, `art/reserve/` 10 fichiers **0 lu** :
**aucune source n'entre ni ne sort**, le lot ne fait que recadrer ce que la
chaîne lisait déjà.

⚠⚠ **LES TROIS PAQUETS PYTHON ET `opus-tools` MANQUAIENT AU CONTENEUR** et ont
dû être installés : sans eux le vérificateur sort en 1 dès le premier outil, et
on lit « chaîne cassée » là où il manque un paquet (§3). Versions employées :
**Pillow 12.3.0, numpy 2.4.6, scipy 1.17.1, libopus 1.4** — celles qu'ART-90 a
mesurées, donc la reproductibilité à l'octet tient pour la même raison.

---

## 10. Écarts au brief

1. **§3 — seule la famille `batiment` est recousue.** Le brief demandait toutes
   les familles listées en ÉCART ; mesuré sur l'arbre pristine, `carte-64`,
   `carte-128` et `interface-128` étaient DÉJÀ différentes avant le lot, et
   aucun de leurs sprites n'a changé. Voir §4. **Écart déclaré, tranché par la
   mesure.**
2. **§6 / `ED T7` — 5 000 points balayés, 4 910 distincts.** Le brief annonce
   5 000 points distincts ; le domaine `[10, 500]` fait que les neuf premiers
   dixièmes rendent tous ce que rend le niveau 1. Le balayage les couvre quand
   même, **pour exercer la borne**. Écart de comptage, pas de couverture.
3. **`F8` déclarée inerte** plutôt que comptée — voir §8.
4. **Le rendu n'a pas été vu** — voir §12.

Aucun autre écart. Les onze lignes du §6 tombent juste sans qu'un seul nombre
du brief ait eu à être discuté.

---

## 11. Points en suspens — pour Ethan

1. ⚠⚠ **SOUS LE NIVEAU 4,2, LA DISTANCE EST GRATUITE**, et une base neuve est
   exactement dans ce cas : le premier déplacement de toute partie coûte 1 h
   qu'on aille à une case ou à dix. C'est une conséquence de la forme, pas un
   oubli. **Ethan tranche** s'il la veut payante dès le premier niveau.
2. **Le bas de la carte est devenu plus RAPIDE** — 1 h 10 → 1 h 00 à niveau 1
   distance 10, 1 h 20 → 1 h 12 à niveau 20 distance 1. Le nouveau barème
   n'est pas partout plus lourd que l'ancien ; il l'est très fortement en haut
   et un peu plus léger en bas.
3. **Les trois paliers sont des nombres**, et ils se changent seuls :
   `EMPRISE_QUATRE_VINGT_DIX_HUIT`, `EMPRISE_QUATRE_VINGT_DOUZE`,
   `EMPRISE_QUATRE_VINGT_CINQ_BATIMENT` de `tools/batiments_v2.py`. Le partage
   aussi — `EMPRISE_PAR_BATIMENT` ne porte que les deux exceptions.
4. **Les trois atlas laissés en écart** — `carte-64`, `carte-128`,
   `interface-128` — attendent toujours un lot qui les touche pour de bon. Ils
   sont dans cet état depuis ART-90.
5. **Le palier des ruines est une LECTURE**, pas un mot d'Ethan : il a dit
   « les ruines doivent suivre les bâtiments », et le lot a retenu le palier
   HAUT plutôt que le défaut. Une ligne de `ruines.py` le renverse.

---

## 12. ⚠⚠ Le rendu n'a pas été vu, ni sur appareil ni dans un navigateur

**Il se déclare NON EXÉCUTÉ.** Tout ce qui précède est mesuré sur les PIXELS des
PNG, sur la SOURCE des outils, sur les octets du livrable et sur des fonctions
PURES. C'est le lot le plus visuel depuis ART-90 : **neuf bâtiments sur vingt
changent de taille à l'écran**, et personne ne les a regardés côte à côte.

**Ce qu'il faut regarder au premier essai :**

1. **La différence entre 27 et 31 gros pixels sur une même base** — poser un
   Collecteur à côté du Chantier de construction. C'est un écart de 12,9 % de
   côté, et c'est tout l'objet du lot : il doit se voir sans se compter.
2. **Les deux ruines**, qui passent de 26 à 31 — donc de 81 % à 97 % de leur
   case. Elles se dessinent à la place d'une base rasée, sur la carte du monde.
3. **La vignette du collecteur mixte**, dans la palette du Chantier, qui doit
   avoir exactement la taille des deux collecteurs qu'elle représente.
4. **Un déplacement de base en fin de partie** : 24 h à niveau 50 distance 10
   est douze fois ce que le jeu demandait ce matin.
