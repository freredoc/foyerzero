# RAPPORT — lot GRILLE LONGUE

Exécuté le **20/09/2026** sur `main` = `7e68258` (merge du lot GRILLE-PORTÉE,
#166), branche `claude/lot-grille-longue`. Brief : `BRIEF-lotGRILLE-LONGUE.md`.

**En une phrase :** les sept bases du bout de carte — six verrous, une finale —
se combattent désormais sur **9 × 27** (défense 3–18, bâtiments 19–27), avec
**78 défenses** dérivées du rapport des cases et non écrites « × 2 », trois
décors longs de 1080 × 3240 entrés en q70, la grille rangée dans chaque rapport
rejouable (`SAVE_VERSION` 39 → 40, maillon qui ne transforme rien) ; **les 200
témoins de combat sont identiques au bit, 0 couche**, et le témoin de BASES-0
aussi. Le livrable passe à **10 603 945 octets** et franchit dix mégaoctets —
signalé, non traité (brief §8).

Version et build produits : **0.99.74 · build 186** (chaînes, vérifié au type),
depuis 0.99.73 · 185.

---

## 1. La base relevée par exécution, avant travail

| grandeur | relevé |
|---|---|
| `package.json` | 0.99.73 · build 185 |
| `npm test` tel quel | **1662 déclarés · 1661 pass · 0 fail · 1 skipped** (`LIMITE T8`) |
| `npm run check` | **0** |
| `dist/index.html` | **9 377 613 octets**, 313 lignes / 312 URI `data:`, 0 référence externe |
| `SAVE_VERSION` | **39** |
| `test/` | 80 fichiers `*.test.js` |
| `art/sources/` | 690 à la racine, 515 consommées · 175 dormantes |
| `art/sourcesstandby/` | les trois décors longs, SHA-256 égaux à ceux du rapport GRILLE-PORTÉE §1 (`d29e003a…`, `7f5f9143…`, `2d3a62fa…`) |
| `art/sprites/` | 1 185 fichiers suivis (`git ls-files`) — ⚠ CLAUDE.md §2 en annonçait 1 173, compte périmé depuis les douze sprites d'AVARIES |
| Node | v22.23.2 (portable, `outils/node22`) |

Le point de départ est **vert**. Le worktree pristine de `7e68258`, rebâti
avec le même Node, rend **9 377 613 octets à l'octet** — c'est la base du coût
du §7.

---

## 2. Les 200 témoins — identiques, mesuré

`JOURNAL T1` (`test/journal-raids.test.js`) rejoue les deux cents combats
capturés au lot APPROCHE et compare champ par champ ; `JOURNAL T1 bis` rejoue
l'ancien placement « sous les sept couches empilées ». Après le lot, sur la
suite complète :

```
ok 11 - JOURNAL T1 — deux cents combats rendent le résultat capturé au lot APPROCHE (falsification n° 1)
ok 12 - JOURNAL T1 bis — l'ancien placement rejoué : 0 écart sous les sept couches empilées
```

**Aucune ligne ne bouge, aucune couche n'est ajoutée** — `test/temoins-combat.js`
n'est pas touché. Le témoin de `BASES-0 T1` (« empreinte par champ : le
dépliage n'a bougé aucune valeur », « empreinte par graine : aucune graine ne
diverge ») est vert aussi.

Pourquoi c'est vrai par construction, et pas par chance : les trois types
autres que `baseVerrou` et `baseTerminale` n'ont **pas de champ `grille`** ;
`genererSite` lit `TYPES_SITE[type].grille` (`src/sim/generateur.js`,
L. 1124–1127), passe `GRILLE` quand il est absent, et le montage porte la clé
`grille` **seulement** si le type en nomme une — clé absente, jamais
`undefined`, parce que `serialiserEtat` trie les clés propres et qu'une clé
`grille: undefined` posée partout aurait changé les deux cents empreintes.
`creerCombat` ne pose `etat.grille` que sur un montage qui en porte une
(inchangé depuis GRILLE-PORTÉE). Ce que la relecture hostile a demandé — *un
montage ordinaire peut-il recevoir une grille par accident ?* — est mesuré au
§6 : F3 (grille donnée à `base`) et F6 (`etat.grille` inconditionnel) font
tomber `JOURNAL T1` avec le nom du témoin qui bouge.

---

## 3. Les effectifs mesurés, les rangées obtenues, et la preuve que le facteur est dérivé

Sortie de `garde.mjs` (scratchpad) sur l'arbre du lot, niveau 50, graines 7 et
42 — recopiée :

```
facteurDeDefenseMilli(GRILLE) = 1000 · (GRILLE_LONGUE) = 2000 · effectifDeDefense(39, GRILLE) = 39 · (39, GRILLE_LONGUE) = 78
camp          grille —             g7   OK — 25 déf rangées 3–10, 25 bât rangées 12–18
camp          grille —             g42  OK — 25 déf rangées 3–10, 25 bât rangées 11–18
avantPoste    grille —             g7   OK — 35 déf rangées 3–10, 35 bât rangées 11–18
avantPoste    grille —             g42  OK — 35 déf rangées 3–10, 35 bât rangées 11–18
base          grille —             g7   OK — 39 déf rangées 3–10, 39 bât rangées 11–18
base          grille —             g42  OK — 39 déf rangées 3–10, 39 bât rangées 11–18
baseVerrou    grille GRILLE_LONGUE g7   OK — 78 déf rangées 3–18, 39 bât rangées 19–27
baseVerrou    grille GRILLE_LONGUE g42  OK — 78 déf rangées 3–18, 39 bât rangées 19–27
baseTerminale grille GRILLE_LONGUE g7   OK — 78 déf rangées 3–18, 39 bât rangées 19–27
baseTerminale grille GRILLE_LONGUE g42  OK — 78 déf rangées 3–18, 39 bât rangées 19–27
```

| type | grille | défenses | rangées de défense | bâtiments | rangées de bâtiments |
|---|---|---|---|---|---|
| camp | `GRILLE` | **25** | 3–10 | 25 | 11/12–18 |
| avant-poste | `GRILLE` | **35** | 3–10 | 35 | 11–18 |
| base | `GRILLE` | **39** | 3–10 | 39 | 11–18 |
| verrou | `GRILLE_LONGUE` | **78** | 3–18 | 39 | 19–27 |
| finale (niveau 50 et **60**) | `GRILLE_LONGUE` | **78** | 3–18 | 39 | 19–27 |

`LONGUE T1` mesure la même chose sur cinq graines (`7, 11, 42, 1234, 99991`)
et sur la finale au niveau 60. ⚠ **Le premier jet du test écrivait les rangées
EXACTES** (12–18 pour un camp) et il est tombé sur la graine 42 (11–18) : depuis
PAQUETS la rangée du premier paquet dépend du tirage. Le test exige donc les
**bandes**, et que la bande longue **serve** vraiment — au moins une défense
au-delà de la rangée 10, aucun bâtiment sous la 19. C'est un écart de forme au
brief §7 (« avec les rangées obtenues »), déclaré ; les rangées obtenues sont
ci-dessus.

**Le facteur est dérivé, pas écrit.** `facteurDeDefenseMilli(grille)`
(`src/sim/generateur.js`) rend `floor((2 × cases × 1000 + 72) / 144)`, le
rapport des cases de défense de la grille à celles de `GRILLE`, arrondi au demi
supérieur, en **millièmes** — ⚠ écart de forme au brief §1.2, qui écrivait
`facteurDeDefense(GRILLE) === 1` : c'est l'unité de tous les facteurs de ce
fichier, et aucun flottant n'en sort. `effectifDeDefense(defenses, grille)`
l'applique dans `genererSite`, AU-DESSUS de `densite`, qui sert les cinq types
et n'a pas bougé : doubler `DENSITE.parNiveau` aurait rendu 77 (`35 × 2`,
majoré × 1,1).

Trois preuves qu'il se dérive :

1. sur deux grilles synthétiques non proportionnelles, il rend autre chose
   qu'un entier écrit d'avance — mesuré :
   ```
   GRILLE                       cases  72 facteur 1000 effectif(39) 39 effectif(25) 25
   GRILLE_LONGUE                cases 144 facteur 2000 effectif(39) 78 effectif(25) 50
   défense 3–12 (10 rangées)    cases  90 facteur 1250 effectif(39) 49 effectif(25) 31
   défense 3–14 (12 rangées)    cases 108 facteur 1500 effectif(39) 59 effectif(25) 38
   ```
2. **F2** (§6) remplace le corps par `return 2 * MILLE` : `LONGUE T1` tombe
   (`2000 !== 1000` sur `GRILLE`) et les trois types courts lèvent
   `replierCaseParCase` (§4) ;
3. `LONGUE T1` calcule 78 de deux façons (`effectifDeDefense(39, GRILLE_LONGUE)`
   et `39 × 144 / 72`) et asserte `notEqual 77`.

Les tiers se dérivent de la même manière : `tiersDeLaDefense(GRILLE_LONGUE)`
rend `[6, 4, 6]` (`{3,8} · {9,12} · {13,18}`), la table `[3, 2, 3]` multipliée
par le rapport entier `16 / 8`. Une hauteur qui n'est pas un multiple **lève**
— `LONGUE T1` sur une bande de douze : « les tiers couvrent 8 rangées, la bande
en fait 12 » — parce que répartir un reste serait choisir OÙ vont les rangées
en trop. `PORTÉE T2` de `test/grille.test.js`, qui exigeait la levée sur seize,
est **retourné**.

---

## 4. La levée de `replierCaseParCase`, provoquée à la main — dans les deux sens

Brief §7 : « poser `grille: GRILLE_LONGUE` sur un type sans doubler les
défenses, ou l'inverse (78 défenses sur la bande courte), doit faire lever
`replierCaseParCase` ». Les deux sens ont été joués avec `garde.mjs`, patch
appliqué puis retiré par `falsifier.py` (chaque patch asserté à une occurrence
exacte ; `git diff --stat src/sim/generateur.js` identique avant et après).

**Sens 1 — 78 défenses sur la bande courte** (F2, `return 2 * MILLE`). Les
trois types courts **lèvent**, messages recopiés :

```
camp          g7   LÈVE — générateur : défenses — 48 posés, 2 restent sans case sous le plafond de 6 par rangée
camp          g42  LÈVE — générateur : défenses — 48 posés, 2 restent sans case sous le plafond de 6 par rangée
avantPoste    g7   LÈVE — générateur : défenses — 48 posés, 1 restent sans case sous le plafond de 6 par rangée
avantPoste    g42  LÈVE — générateur : défenses — 48 posés, 4 restent sans case sous le plafond de 6 par rangée
base          g7   LÈVE — générateur : défenses — 48 posés, 2 restent sans case sous le plafond de 6 par rangée
base          g42  LÈVE — générateur : défenses — 48 posés, 2 restent sans case sous le plafond de 6 par rangée
```

48 posés = huit rangées × plafond 6 ; « restent » compte le paquet en cours,
pas le total (`src/sim/generateur.js`, L. 611). Sur la suite, la même
falsification fait tomber `PORTÉE T2`, `JOURNAL T1`, `JOURNAL T5`, `JOURNAL T8`
et `LONGUE T1` (§6).

**Sens 2 — la grille longue SANS doublement** (F7, `return MILLE` partout) :
**la garde ne mord pas.** 39 défenses tiennent dans seize rangées, et le
générateur les pose sans lever :

```
baseVerrou    g7   OK — 39 déf rangées 5–18, 39 bât rangées 19–27
baseVerrou    g42  OK — 39 déf rangées 3–18, 39 bât rangées 19–27
baseTerminale g7   OK — 39 déf rangées 5–18, 39 bât rangées 19–27
baseTerminale g42  OK — 39 déf rangées 3–18, 39 bât rangées 19–27
```

⚠ **Ce sens-là est vu par `LONGUE T1`** (39 ≠ 78 sur les deux types longs), pas
par `replierCaseParCase` : le brief l'écrivait comme une levée, elle n'en est
pas une, et c'est écrit plutôt que comblé. **Aucune seconde garde n'a été
écrite** — le brief l'interdit et la première mesure ce qu'elle peut mesurer :
trop de défenses pour la bande.

---

## 5. Le maillon 39 → 40 : ce qu'il fait, et la preuve qu'il ne réécrit rien

```js
  39: (s) => {
    s.version = 40;
  },
```

C'est tout, et le commentaire au-dessus dit pourquoi en toutes lettres pour
qu'on ne le lise pas comme un oubli : `pourLeRejeu` garde le montage entier,
donc `etat.rapports[].rejeu.grille` existe depuis ce lot — un champ de
sauvegarde neuf est un numéro de plus (brief §1.3). Les rapports d'avant portent
des montages SANS grille et rejouent sur `GRILLE`, ce qui est **exact** : aucune
base du bout de carte ne s'est combattue ailleurs avant ce lot. Leur poser une
grille inventerait un fait.

La preuve, `LONGUE T2` (`test/verrous.test.js`), sur une partie jouable dont la
base est déplacée à côté d'un verrou :

1. `executerRaid` sur le verrou range `rapport.rejeu` deepEqual au montage
   d'origine, et `rejeu.grille` deepEqual `GRILLE_LONGUE` ; rejouer ce montage
   rend la même cause et le même tick que le combat d'origine, et
   `serialiserEtat` des deux combats est identique ;
2. `charger(serialiser(etat))` garde la grille et rejoue identique ;
3. un rapport d'avant (un raid sur un camp), rétrogradé à `version: 39`, passe
   `migrer` : `rapports` deepEqual **et** JSON identique, aucune clé `grille`,
   rejeu identique — *un vieux rapport rejoue-t-il encore exactement pareil ?*
   Oui, mesuré.

**F5** (§6) fait écrire `r.rejeu.grille = null` au maillon : `LONGUE T2` tombe
(« le maillon 39 → 40 a réécrit les rapports ») et `PORTÉE T2` tombe par la
source, qui compte un second `.grille =` hors de `creerCombat`
(`[["sim/combat.js",1],["sim/state.js",1]]`).

Sept épingles `SAVE_VERSION` réancrées 39 → 40 dans six fichiers (`state`,
deux ; `raid-ouvrage`, `batiments-quatre-etats`, `formation-et-garnison`,
`journal-raids`, `verrous`), chacune avec l'ancien numéro écrit à côté du
nouveau.

---

## 6. Les six falsifications, rouge réel

Jouées sur les quatre fichiers qui portent `PORTÉE T2`, `JOURNAL T1`, la garde
des fonds et `LONGUE T1`/`T2` — `grille`, `journal-raids`, `sprite`, `verrous`,
**76 tests** —, chaque patch appliqué par `falsifier.py` (asserté à une
occurrence exacte), mesuré, retiré ; `git diff --stat` identique avant et
après chacune. Les six sorties TAP sont conservées (`f-F1.tap` … `f-F6.tap`).

| n° | falsification | tests qui tombent | rouge recopié |
|---|---|---|---|
| F1 | `grille` retirée de `TYPES_SITE.baseVerrou` | `sprite` fond, `LONGUE T1`, `LONGUE T2` — **3** | `la garde du couple ne peut plus mordre : un décor court couvre la grille longue` · `undefined` vs `GRILLE_LONGUE` · `un combat sur un verrou ne porte pas sa grille` |
| F2 | `facteurDeDefenseMilli` rend `2 * MILLE` | `PORTÉE T2`, `JOURNAL T1`, `JOURNAL T5`, `JOURNAL T8`, `LONGUE T1` — **5** | `générateur : défenses — 48 posés, 3 restent sans case sous le plafond de 6 par rangée` · `camp/richeQuartz/n5/g1/toutes : le champ 1 a bougé depuis le témoin du lot APPROCHE` · `2000 !== 1000` |
| F3 | `TYPES_SITE.base.grille = GRILLE_LONGUE` | `PORTÉE T2`, `JOURNAL T1`, `JOURNAL T8`, `sprite` fond, `LONGUE T1` — **5** | `un montage long SANS grille doit être refusé sur la grille par défaut` · `combat : bâtiment « souche » en (35, 6) est hors de la grille (rangées 1–27, colonnes 1–9)` · `base/-/n5/g1/toutes : le champ 1 a bougé depuis le témoin du lot APPROCHE` · `fond_j_01 (20 cases) ne couvre pas la boîte de joueur/base (27.5)` · `« base » porte une grille : il jouerait long` |
| F4 | `pourLeRejeu` retire `grille` du montage rangé | `LONGUE T2` — **1** | `le montage rangé ne porte pas la grille longue` |
| F5 | le maillon 39 écrit `r.rejeu.grille = null` | `PORTÉE T2`, `LONGUE T2` — **2** | `` `.grille =` est écrit ailleurs que dans creerCombat : [["sim/combat.js",1],["sim/state.js",1]] `` · `le maillon 39 → 40 a réécrit les rapports` |
| F6 | `etat.grille = grille` inconditionnel dans `creerCombat` | `PORTÉE T2`, `JOURNAL T1`, `JOURNAL T1 bis`, `LONGUE T2` — **4** | `creerCombat pose \`etat.grille\` sur un montage qui n'en porte pas` · `camp/richeQuartz/n5/g1/toutes : le champ 2 a bougé depuis le témoin du lot APPROCHE` · `un combat ordinaire porte une clé grille` |

Comptes TAP, recopiés : F1 `76 · 73 · 3`, F2 `76 · 71 · 5`, F3 `76 · 71 · 5`,
F4 `76 · 75 · 1`, F5 `76 · 74 · 2`, F6 `76 · 72 · 4`. Les deux questions de la
relecture hostile ont leur réponse dans cette table : F3 et F6 sont « un
montage ordinaire reçoit une grille par accident », et les 200 témoins le
voient avec le nom du témoin ; F5 est « un vieux rapport ne rejoue plus
pareil », et `LONGUE T2` le voit.

---

## 7. Le coût, ventilé poste par poste, la borne et la marge

Cinq postes qui PARTITIONNENT le fichier — images et audio sont les URI `data:`
entières, préfixe compris ; JavaScript et feuille sont nets d'URI ; balisage est
le reste — mesurés des deux côtés par le même script (`ventiler.mjs`) :

| poste | `main` pristine `7e68258` | lot GRILLE LONGUE | écart |
|---|---|---|---|
| images | 7 607 579 | 8 832 344 | **+1 224 765** |
| audio | 1 241 654 | 1 241 654 | +0 |
| JavaScript | 441 551 | 442 873 | **+1 322** |
| feuille | 48 043 | 48 142 | +99 |
| balisage | 38 786 | 38 932 | +146 |
| **total** | **9 377 613** | **10 603 945** | **+1 226 332** |
| somme des postes − total | 0 | 0 | partition exacte |
| `data:` | 313 lignes / 312 URI | 316 / 315 (263 ogg + 52 webp) | +3, un marqueur par décor |
| références externes | 0 | 0 | |

Les images : 918 518 octets de WebP (313 328 + 308 012 + 297 178) font
**1 224 696** en base64 fichier par fichier, plus 3 × 23 de préfixe
`data:image/webp;base64,` = 1 224 765. Le brief estimait ≈ 10 602 309 ; la
mesure est **+1 636** au-dessus, dans le JavaScript et la feuille.

**La borne T10** (`test/banc.test.js`) passe de 9 700 000 à **10 820 000**, avec
sa mesure écrite à côté ; **`PIC T7`** réancre `MESURE = 10_603_945`,
`MARGE === 216_055`, `notEqual 324_443` (la marge d'avant) et
`notEqual 322_387`, et **2,00 %** (`1,9968` arrondi).

| | |
|---|---|
| borne | 10 820 000 |
| livrable | 10 603 945 |
| **marge** | **216 055 octets · 2,00 %** |
| plancher (`PIC T7`) | 150 000 — **tenu**, à 66 055 près |

**Le q70 est mesuré, pas choisi par goût.** `tools/fonds.py` documente les
paliers sur les trois planches : q85 1 540 524 · q80 1 226 204 · **q75 980 878
(1 307 840 en base64)** · **q70 918 518 (1 224 696)** · q65 853 102. À q75 — la
qualité des huit décors courts — le livrable aurait fait 10 687 089 et la marge
**132 911, sous le plancher**. Les huit courts restent à q75 ; `sprite.test.js`
confronte les deux qualités au manifeste.

⚠ **Le livrable franchit dix mégaoctets** (10 355,4 Kio) — brief §8 : signalé,
non traité ; voir §10.

---

## 8. Le facteur d'image — dérivé du manifeste, et `COTE_CASE_SOURCE = 108` sur 3240

Le brief posait « le décor donne la hauteur, la grille donne la largeur ».
`src/render/fond.js` :

- `FORMATS = { court: 1080 × 2160, long: 1080 × 3240 }` et `FORMAT_DU_FOND`,
  fond par fond — les quatre `fond_j_*` et les quatre `fond_o_*` d'ambiance
  `court`, `fond_o_verrou_a`, `fond_o_verrou_b`, `fond_o_finale` `long` ;
  `formatDuFond(nom)` LÈVE sur un nom inconnu ;
- `hauteurImageEnCases(nom) = FORMATS[...].hauteur / COTE_CASE_SOURCE` — 20
  cases pour un court, **30** pour un long ; `HAUTEUR_IMAGE_EN_CASES` reste la
  hauteur du format court pour `ui/chantier.js`, dont les décors sont tous
  courts (un test l'exige) ;
- `rectangleDuFond(projection, nom)` prend le décor : la boîte projetée donne
  la largeur (`largeurEnCases(grille) × tailleCase`), le décor donne la hauteur,
  et il **lève** si la largeur du décor en cases n'est pas celle de la boîte
  (`PORTÉE T2` : « fait 10 cases de large, la boîte projetée en fait 12 ») ;
  `listeDuFond` lui passe le nom, `ui/raid.js` passe `combat?.grille` aux
  bandes et à la projection sans nommer `GRILLE`.

**Le manifeste ne peut pas diverger de la table.** `sprite.test.js` « fond »
lit `fond-empreintes.json` et confronte, décor par décor, largeur et hauteur à
`formatDuFond`, exige `% COTE_CASE_SOURCE === 0` et dix cases de large, huit
courts et trois longs nommément, et la **garde du couple** :
`hauteurImageEnCases(décor) ≥ hauteurEnCases(grille du type)` pour tout
`FONDS` — et que cette garde MORD (`fond_o_hostile`, 20 cases, sur la grille
longue, 27,5). `FOND T4` projette la grille longue en 1:1 (`tailleCase` 108) et
mesure `rectangleDuFond(pLong, 'fond_o_finale').h === sh === 3240`.

**`COTE_CASE_SOURCE = 108` tient sur 3240** : 3240 / 108 = **30**, entier, et la
grille de 108 décalée de 54 longe les flancs sur x = 54 et x = 1026 des trois
planches — regardé sur les PNG, et noté dans `fond.js` comme dans `fonds.py`.
Débords mesurés en cases : 1,5 (162 px) et 2,5 (270 px), assertés.

`SOURCE_LARGEUR` et `SOURCE_HAUTEUR` partent — deux constantes qui disaient
« 2160 » à un fichier qui en a désormais deux.

---

## 9. L'art et les outils — ce que la machine a dit

| commande | rendu |
|---|---|
| `tools/entrees.py --declarer` | **518 consommées · 175 dormantes · 693 dans art/sources/**, EXIT 0 — trois lignes ajoutées à `sources-declarees.json`, rien d'autre ne bouge |
| `tools/fonds.py` (pour de bon, `env -u FZ_SPRITES`) | **12 fichiers écrits** ; les neuf WebP d'avant identiques à l'octet (`git status` ne voit que le manifeste, +21 lignes) ; manifeste converti CRLF → LF comme aux lots précédents |
| `tools/verifier.py --outil fonds` | **12 identiques à l'octet · 1 différent · 0 nouveaux · 0 MANQUANTS**, EXIT 1 — le différent est `fond-empreintes.json` |
| `tools/verifier.py --outil emblemes` | **17 identiques · 266 différents · 0 nouveaux · 0 MANQUANTS**, EXIT 1 |

⚠⚠ **Les deux EXIT 1 ne sont pas de ce lot, et c'est mesuré, pas supposé.** Le
même `verifier.py`, même Python (3.12.2, Pillow 12.3.0), lancé dans le worktree
pristine de `main` = `7e68258` : `--outil fonds` **9 identiques · 1 différent**
(le même manifeste), `--outil emblemes` **17 · 266**, et la liste des 266 est
**identique** à celle du lot (`diff` vide). Puis, en rejouant les deux outils
sous `FZ_SPRITES` dans le scratchpad :

- `fond-empreintes.json` : le fichier rejoué porte **89 CR** (mode texte de
  Windows), le dépôt 0 ; **identiques CR retirés**. C'est le défaut connu des
  outils Python sur cette machine, déjà documenté au §0 de CLAUDE.md (« CRLF
  de Windows retirés ») ;
- `carte/` : **282 images comparées · 16 identiques à l'octet · 282 identiques
  au PIXEL · 0 différente au pixel** — les 266 PNG diffèrent par l'encodeur
  de Pillow 12.3.0, ce que le lot VERROUS avait déjà mesuré ici (`266 au pixel
  · 0 différent`). Le brief attendait « identiques, 0 différents » : sur cette
  machine la chaîne dit 17 · 266 à l'octet et 282 · 0 au pixel, et c'est ce qui
  est écrit.

Les trois WebP longs, eux, se reproduisent **à l'octet** (12 identiques contre
9 sur `main`).

---

## 10. Ce qui reste ouvert, nommément

1. **Le poids du livrable au retéléchargement.** 10 603 945 octets, soit
   **10,6 Mo** que chaque auto-update fait retélécharger en entier. Le brief
   §8 dit : signaler, ne pas traiter. Les 918 518 octets des trois décors
   sont 8,7 % du fichier ; q65 en rendrait 853 102 de WebP (−65 416, mesuré
   dans `fonds.py`, la marge restant à mesurer en base64), et c'est un
   arbitrage de qualité d'image qui n'est pas au lot.
2. **L'équilibrage des sept bases à 78 défenses.** « L'équilibrage, c'est mon
   boulot » : le lot pose 78 dérivé des cases, sur seize rangées, tiers
   `[6, 4, 6]`, rangée d'artillerie et vague suivant la grille. Il ne juge pas
   si c'est jouable, aucun banc, aucune courbe. Ce qu'Ethan voudra peut-être
   regarder : `poidsDeTiers` (inchangé, appliqué à des tiers deux fois plus
   hauts), `DISPOSITION_DEFENSES.occupantsMaxParRangee` (6, inchangé — la bande
   longue en absorbe 96), et le niveau 60 de la finale, qui joue long avec les
   mêmes tables.
3. **Le sens 2 de la garde du placement** (§4) : la grille longue sans
   doublement ne lève pas, `LONGUE T1` le voit. Si une garde structurelle est
   voulue — « une bande deux fois plus haute doit porter deux fois plus » —,
   c'est un arbitrage, pas un oubli.
4. **`GRILLE_LONGUE` ne porte que sa géométrie** — écart déclaré au brief §2.1,
   qui recommandait l'étalement de `GRILLE`. Mesuré avant d'écrire : les
   treize lectures de `vaguesParRaid`, `intervalleVagueSec`, `tickSec`,
   `dureeMaxCombatSec`, `plancherReservePct`, `ticksAvantRepli` et `lateral`
   dans `src/` nomment toutes `GRILLE`, et `verifierGrille` n'exige que la
   géométrie. Six valeurs recopiées que rien ne lirait auraient fait une seconde
   vérité, et elles auraient VOYAGÉ dans chaque rapport rejouable. `LONGUE T1`
   balaie `src/` décommenté et refuse toute lecture `grille.<calibrage>` : le
   jour où une entrera, le test la nommera et la grille longue devra la porter.
5. **Les 176 sprites rouges de `verifier.py`** (RUINES-DÉFENSE) et les 266 PNG
   d'emblèmes différents à l'octet sur cette machine — hors lot, inchangés.
6. **Le compte de `art/sprites/` dans CLAUDE.md §2** était faux de douze
   (1 173 annoncés, 1 185 suivis) depuis AVARIES ; corrigé à **1 188** et
   déclaré comme tel dans le §2.

### Écarts au brief, tous déclarés

| brief | fait | pourquoi |
|---|---|---|
| §2.1 « étaler `GRILLE` » | géométrie seule | point 4 ci-dessus |
| §1.2 `facteurDeDefense(GRILLE) === 1` | `facteurDeDefenseMilli(GRILLE) === 1000` | l'unité du moteur, aucun flottant |
| §1.1 le reste des tiers | **refus** (levée) | répartir un reste est de l'équilibrage |
| §7 « doit faire lever » dans les deux sens | lève dans un sens, `LONGUE T1` voit l'autre | §4, mesuré |
| §7 « les rangées obtenues » assertées | les bandes, et la bande longue servie | les rangées varient avec la graine depuis PAQUETS |
| §9 `verifier.py --outil emblemes` « identiques, 0 différents » | 17 · 266 à l'octet, 282 · 0 au pixel, **identique sur `main` pristine** | encodeur, §9 |
| §9 ≈ 10 602 309 | **10 603 945** | mesuré, +1 636 |

---

## Rendu final

| | attendu (brief §9) | mesuré |
|---|---|---|
| `npm run check` | 0 | **0** |
| `npm test` | 1664 déclarés, 0 fail, 1 skipped | **1664 · 1663 pass · 0 fail · 1 skipped** |
| 200 témoins | identiques au bit, 0 couche | **identiques, 0 couche** |
| `tools/fonds.py` | 12 fonds écrits | **12**, neuf d'avant à l'octet |
| `verifier.py --outil emblemes` | identiques, 0 différents | 17 · 266 à l'octet — **282 · 0 au pixel**, même verdict sur `main` |
| `dist/index.html` | ≈ 10 602 309, 315 URI | **10 603 945**, 0 externe, **315 URI / 316 lignes**, partition 0 · 0 |
| `SAVE_VERSION` | 40 | **40** |
| version · build | numéro disponible | **0.99.74 · 186** |

Fichiers touchés : `src/data/{combat,sites}.js`, `src/sim/{generateur,state}.js`,
`src/render/{fond,scene}.js`, `src/ui/raid.js`, `tools/{fonds.py,build.js}`,
`src/index.src.html`, treize fichiers de `test/`, `art/sources-declarees.json`,
`art/sprites/fond/fond-empreintes.json`, `package.json`, `CLAUDE.md`, ce
rapport ; **entrent** `art/sources/base_fond_ouvrage_{verrou_a,verrou_b,finale}.png`
et `art/sprites/fond/fond_o_{verrou_a,verrou_b,finale}.webp`. Rien ne sort de
`art/sources/`, `GRILLE` n'est pas mutée (asserté), aucun fichier de la base du
joueur n'est touché, le quatrième décor n'entre pas.
