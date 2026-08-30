# RAPPORT — lot FINITIONS

L'hexagone, les lettres, le terrain, l'icône. Écrit le 30/08/2026.

---

## 1. Ce qui a été produit

| | |
|---|---|
| version · build | **0.48.0 · "49"** (chaînes, éditées textuellement) |
| `dist/index.html` | **1 230 416 octets** — mesuré |
| avant le lot | 1 229 274 octets |
| **delta** | **+1 142** ⚠ *il a grossi* |
| SHA-256 | `0e982448e0f2ca83db297bc0f76adc80d012c19e7f69d5cc7141b959a7fb0abd` |
| borne T10 | 1 300 000, **inchangée** — marge 69 584, soit 5,4 % |
| `npm run check` | **619 pass / 0 fail** (608 avant) |
| `tools/verifier.py` | **0 MANQUANT**, verdict **VERT**, 127 s |

⚠⚠ **ÉCART À LA PRÉVISION DU BRIEF : `dist` DEVAIT RÉTRÉCIR, IL A GROSSI DE
1 142 OCTETS.** Le §5 posait que les parties 1 et 2 retirent du code sans ajouter
de sprite. C'est vrai de la partie 2 — la lettre, son seuil et son commentaire
partent — mais la partie 1 AJOUTE : le chargement des deux grosses bases,
l'attente de leur décodage, la table des côtés, la fonction de dessin. Le
câblage de l'hexagone pèse plus que la lettre retirée. **Mesuré, pas estimé.**

`versionName` de l'APK lit `package.json` — vérifié, rien n'est saisi deux fois.

---

## 2. §1 — La base terminale prend l'hexagone

Arbitré par Ethan : « la base terminale c'est la base en hexagone, sur 9 tuiles
monde. » Elle prenait `site_base_o_n9` et **se confondait exactement** avec une
base de l'Ouvrage au dernier palier.

- `cotesDuSite(type)` entre dans `src/render/embleme.js` et rend 3 pour elle,
  `null` pour les quatre autres ;
- `spriteDuSite` **LÈVE** pour ce type — un appelant oublié doit se voir ;
- `empriseDeLaGrosseBase` **LÈVE** si le carré déborde la carte.

⚠ **LA TABLE VIT DANS `render/`, PAS DANS L'ÉCRAN.** `ui/monde.js` demande le
nombre de cases plutôt que de reconnaître `baseTerminale` par son nom : un
`=== 'baseTerminale'` écrit à la main dans la boucle de dessin serait le premier
cas particulier à diverger — le dépôt refuse déjà cette forme pour `deplacer`.

⚠ **L'EMPRISE TIENT, ET C'EST MESURÉ, PAS AFFIRMÉ** : rangées 25 à 27, colonnes
15 à 17, sur une carte de 300 × 31. Un test le vérifie à la position RÉELLE, et
quatre positions de bord font lever.

⚠ **LA 2 × 2 RESTE PRÉ-BRANCHÉE ET SANS EMPLOI.** Ethan : « la base 2 × 2 sera
pour autre chose. » Un test asserte qu'aucun type de site ne la demande. Elle est
chargée quand même par l'écran — elle est dans le fichier livré de toute façon,
15 134 octets, et l'attendre évite qu'un futur emploi redécouvre le décodage.

**Le compte de noms distincts a été RECOMPTÉ : il vaut toujours 36**, et pour une
raison différente. Avant, la terminale était balayée et partageait
`site_base_o_n9` — elle n'ajoutait aucun nom. Maintenant elle est **hors** du
balayage. Deux causes pour le même nombre : c'est le genre de coïncidence qui
ferait croire qu'un test n'a pas bougé, d'où le paragraphe qui l'explique dans le
test et l'assertion de levée qui l'accompagne.

---

## 3. §2 — Les lettres partent

Arbitré : « on enlève les lettres quoi qu'il arrive. » Pas de seuil, pas de cran.

Partis : le `fillText`, sa garde de seuil, `CSS_MINI_LETTRE` et son commentaire
de dix lignes.

### ⚠ Les lecteurs ont été cherchés champ par champ AVANT de toucher à la table

| champ | lecteurs | verdict |
|---|---|---|
| `lettre` | 2 — le `fillText` et `test/monde.test.js:437` | **gardé** |
| `nom` | **3, tous vivants** — `lignesDuSite`, le titre du panneau, son test | **intouchable** |
| `fond` | 1 — le gabarit de repli | gardé |
| `bord` | 2 — le gabarit de repli, le `fillText` | gardé |

**`nom` est la raison pour laquelle la table ne bouge pas** : le panneau de site
en dépend, et le brief l'avait bien anticipé en demandant de chercher.

### Choix réversible n° 1 : **le champ `lettre` est GARDÉ**

La carte ne l'affiche plus, mais c'est la seule désignation courte des cinq types
de site, et un panneau futur la reprendra. Le supprimer serait détruire de
l'information pour économiser cinq caractères. **Ses deux assertions restent.**

### ⚠ Une assertion existante a été retirée, et elle est déclarée

`assert.ok(CSS_MINI_LETTRE > 0)` dans `test/monde.test.js` **part avec sa
constante**. Ce n'est pas un assouplissement : deux tests neufs exigent
maintenant que ni la constante ni le `fillText` ne reparaissent, l'un balayant
tout `src/` **décommenté**.

⚠ **CINQUIÈME FOIS QUE LE DÉCOMMENTAGE EST NÉCESSAIRE** — après
`viewport-fit=cover`, `MENTION_SATURE`, `etat.rng` et `campChaine`. Le
commentaire qui EXPLIQUE le retrait nomme `CSS_MINI_LETTRE` ; une garde qui lit
ce qu'on a écrit à son sujet ne garde rien. Un appât le prouve.

---

## 4. §3 — Le terrain devient une source

Arbitré : « déclarer le terrain comme une source. » `SOURCES_DECLAREES` entre
dans `tools/verifier.py`.

**Les fichiers ont été COMPTÉS, pas recopiés du brief** : `terrain/{128,64,32}`
en porte **18 chacun, soit 54**, plus les 2 de `carte/` — **56**.

| entrée | raison |
|---|---|
| `terrain/` (54) | migration à usage unique consommée ; les planches d'origine n'existent plus, les fichiers commités SONT la source |
| `carte/atlas-terrain-64.png` | livré fini au lot ÉCRAN-CARTE, 224 548 o ; `build.js` l'inline, aucun outil ne le produit |
| `carte/controle-pavage.png` | image de contrôle du pavage, produite une fois |

⚠⚠ **LE PRIX EST ÉCRIT DANS LA TABLE ELLE-MÊME**, pour être lu par celui qui le
paiera : **un futur changement de palette ne pourra pas être appliqué au terrain
automatiquement.** Il faudra retoucher les 54 tuiles à la main, ou retrouver les
planches.

⚠⚠ **ET L'ASSERTION INVERSE, QUI REND LA TABLE HONNÊTE.** Chaque source déclarée
doit ENCORE être introuvable dans la production. Falsifiée en déclarant source un
fichier que la chaîne produit très bien :

```
  ⚠ SOURCE DÉCLARÉE QUE LA CHAÎNE PRODUIT MAINTENANT : defense/64/def_j_merlon_isole.png
    couverte par « defense/64/def_j_merlon_isole.png » — la déclaration est périmée, retirer sa ligne
VERDICT : la chaîne ne répond pas de ses sprites          (code 1)
```

### Le verdict, en régime

```
identiques : le dépôt et la chaîne s'accordent à l'octet
différents : les deux l'ont, ils ne sont pas les mêmes
nouveaux   : la chaîne le produit, le dépôt ne l'a pas
MANQUANTS  : le dépôt le porte, aucun outil ne le produit —
             hors sources déclarées, qui sont dans ce cas EXPRÈS

identiques à l'octet : 1370
différents           : 2
nouveaux             : 0
MANQUANTS            : 0
durée                : 127.1 s
  écart déclaré  unite/32/off_j_belier.png — même cas que le Ratisseur
  écart déclaré  unite/32/off_j_ratisseur.png — la source 1024 ne redescend pas
                 à 32 sans retouche à la main (passation du 30/08, §3.2.6)

VERDICT : la chaîne répond de ses sprites
```

**Les 56 MANQUANTS du lot CHAÎNE-VÉRIFIÉE sont soldés**, et le vérificateur sort
en **0** pour la première fois.

---

## 5. §4 — L'icône

### La source, mesurée

| | |
|---|---|
| dimensions | 1254 × 1254, RGB |
| **teintes distinctes AVANT** | **109 969** |
| pixels sur la palette AVANT | **0 / 1 572 516 = 0,0000 %** |
| dominantes | `#0B0B14` 6,25 % · `#0B0B15` 5,23 % · `#0A0A13` 3,57 % · `#0C0C15` 3,26 % |
| étendue du motif | x 21…1244, y 22…1207 sur 1254 |

**Les mesures du brief sont exactes**, à 0,2 point près sur les parts : 36,0 % du
motif hors de la zone sûre en plein cadre (le brief disait 35,8), 10,4 % coupés
par un masque circulaire (10,2).

### Après conditionnement

| | |
|---|---|
| **teintes distinctes APRÈS** | **16 à 17** selon la densité |
| pixels hors palette | **0 / 82 944 = 0,0000 %** |
| fond dominant | `#0D0B12` — `A contour`, lu dans la source, pas écrit en dur |

### ⚠⚠ Le conditionnement DÉGRADE l'éclair, et je ne passe pas outre

Le brief demandait de le dire si c'était le cas. **C'est le cas.**

L'éclair de la source est mesuré à **`#F85201`** — G/max = 0,33, B/max = 0,004.
Un orange vif, tirant sur le vermillon. La palette n'a **pas d'orange** entre
`rouge clair #E43E32` (G/max 0,27) et `jaune clair #F5B636` (G/max 0,74), et la
porte de teinte de `quant` exige G/max > 0,55 pour le jaune. **L'éclair est donc
lu ROUGE** : `rouge clair` 4,60 % + `rouge sombre` 4,08 % du motif, `jaune` 0 %.

Ce n'est pas un défaut de l'outil — à G/max 0,33 la source est objectivement plus
proche du rouge — mais **c'est une perte visible** : l'éclair change de couleur.
Deux issues, et c'est un **arbitrage d'Ethan** : ajouter un orange à la palette,
ou accepter le rouge. **À constater sur appareil avant de trancher.**

Les violets, eux, tiennent : `A corps`, `A ombre`, `A eclaire` et `A lumiere`
sont tous présents, le marcheur garde son camp.

### Choix réversible n° 2 : **l'encastrement à 72/108**

C'est le choix (a) du brief, celui qui ne détruit rien. `ENCASTREMENT` est une
constante de `tools/icone.py` ; la porter à `1.0` rend le plein cadre — et fait
**tomber** le test de zone sûre, ce qui est le but : personne n'y repasse sans le
dire. La vraie réponse serait une composition dessinée pour 108/72, et c'est de
l'art, pas du code.

### Les cinq densités

| densité | côté | motif | marge | teintes |
|---|---|---|---|---|
| mdpi | 108 | 72 | 18 | 16 |
| hdpi | 162 | 108 | 27 | 16 |
| xhdpi | 216 | 144 | 36 | 17 |
| xxhdpi | 324 | 216 | 54 | 17 |
| xxxhdpi | 432 | 288 | 72 | 17 |

### Le reste du §4

- **La source a été renommée** `Icône_appli.png` → `icone_appli.png`, par
  `git mv`. C'était le **seul** des 149 fichiers de `art/sources/` avec un nom
  non-ASCII ; il n'en reste aucun, et rien ne le citait sous l'ancien nom.
- **Le `<vector>` du creuset est parti, fichier compris** — `drawable/` n'existe
  plus. `ic_launcher.xml` garde sa forme : un fond en couleur, un premier plan en
  drawable ; seul ce dernier passe de `<vector>` à `@mipmap`.
- **`couleurs.xml` est GÉNÉRÉ** et sa teinte est la dominante de l'icône
  conditionnée. Il disait `#161914` — le contour kaki — quand le fond de la scène
  est un quasi-noir bleuté ; les deux ne pouvaient pas rester.

---

## 6. ⚠⚠ Un défaut trouvé en chemin, mesuré, et DÉLIBÉRÉMENT non corrigé

**`reduire` de `tools/cond.py` efface la teinte `A contour`.**

Elle prend `len(PAL)` — la palette de base, **quatorze** teintes — comme
sentinelle de transparence. Or `tools/final128.py` réduit avec la palette
**étendue**, dix-neuf teintes, dont l'indice **14 est `A contour` `#0D0B12`**, le
ton le plus sombre de l'Ouvrage. Chaque bloc qui vote pour lui devient donc
**transparent**.

**Mesuré, pas soupçonné**, avant réduction :

| sprite | pixels en `A contour` | part | dans le sprite commité |
|---|---|---|---|
| `bat_o_gangue` | 8 798 / 416 233 | 2,11 % | **0** |
| `bat_o_noeud` | 9 563 / 449 126 | 2,13 % | **0** |
| `bat_o_terril` | 9 230 / 425 338 | 2,17 % | **0** |

**Trouvé parce que l'icône y tombe à 64,6 %** : tout le fond de la scène
disparaissait en silence. `tools/icone.py` porte donc sa **propre** réduction,
qui prend le nombre de teintes en argument et ne peut pas se tromper de palette.

⚠ **CE N'EST PAS CORRIGÉ POUR LES BÂTIMENTS, ET C'EST UN CHOIX.** Le faire
régénérerait des sprites commités, recoudrait un atlas, changerait `dist` et
rendrait `verifier.py` rouge jusqu'à sa relance. C'est un lot à part et un
arbitrage d'Ethan — le même traitement que les 56 MANQUANTS du lot précédent, qui
ont attendu leur arbitrage plutôt que d'être « réparés » à la volée.

**Un test le garde** — `test/icone.test.js`, dernier bloc — sur le modèle de
`DETTES_ACCENT` : il asserte que les trois sprites portent **zéro** `#0D0B12`,
avec un témoin qui prouve que la teinte est atteignable ailleurs. **Il tombera le
jour de la correction**, et quelqu'un relira le paragraphe.

---

## 7. Les tests

**608 avant, 619 après.** Onze ajoutés : cinq dans `test/monde.test.js`, six dans
`test/icone.test.js`, fichier neuf.

| # | test du §6 | verdict | montage effectif |
|---|---|---|---|
| 1 | la terminale est dessinée en 3 × 3 | **PASS** | `cotesDuSite` sur les cinq types ; la primitive aux quatre crans ; **témoin d'abord** — une base ordinaire n'occupe qu'une case |
| 2 | `spriteDuSite('baseTerminale')` lève | **PASS** | les neuf paliers ; plus deux témoins qui ne lèvent pas |
| 3 | l'emprise ne déborde pas | **PASS** | position réelle (25–27 × 15–17), plus quatre bords qui lèvent, plus un témoin intérieur |
| 4 | le compte de noms, recompté | **PASS** | **36**, et le paragraphe qui dit pourquoi c'est le même nombre pour une autre raison |
| 5 | aucune lettre n'est dessinée | **PASS** | source **décommentée**, avec appât ; **et le témoin qu'il y en avait** — les cinq lettres sont toujours dans les données, distinctes |
| 6 | `CSS_MINI_LETTRE` n'existe plus | **PASS** | tout `src/` décommenté, 46 fichiers, compte asserté |
| 7 | chaque source déclarée est encore introuvable | **PASS** | dans `verifier.py`, falsifié par un appât |
| 8 | le vérificateur rend 0 MANQUANT | **PASS** | sortie complète au §4 |
| 9 | l'icône est à 100 % sur la palette | **PASS** | les cinq densités, décodeur **réemployé** de `test/png-rgba.js` ; témoins : pixels opaques > 0, teintes > 3 |
| 10 | les cinq densités ont les bonnes dimensions | **PASS** | 108, 162, 216, 324, 432 ; témoin : les cinq côtés sont distincts |
| 11 | le motif tient dans la zone sûre | **PASS** | boîte englobante des pixels opaques vs marge, **et** le motif OCCUPE la zone — un pixel unique y tiendrait aussi |
| + | l'enveloppe pointe sur les mipmaps | **PASS** | hors §6 — le `<vector>` et son fichier ont disparu, le fond est sur la palette |
| + | la palette transcrite est celle de l'outil | **PASS** | confrontée à `final128.py` dans les deux sens |
| + | **DETTE** `cond.reduire` | **PASS** | §6 ci-dessus |

### Falsification — neuf injections, neuf gardes qui tombent

| injection | tombe |
|---|---|
| la terminale redevient une case | 2 tests |
| `spriteDuSite` rend de nouveau l'ancien nom | terminale/levée |
| l'emprise rogne au lieu de lever | emprise |
| la lettre revient | lettres |
| `CSS_MINI_LETTRE` revient | 2 tests |
| l'icône repasse en plein cadre | zone sûre |
| une densité perd sa taille | 2 tests |
| **la réduction reprend la sentinelle à 14** | 3 tests |
| le vectoriel revient | enveloppe |
| une source déclarée devient productible | verdict du vérificateur |

### Audit des assertions

| fichier | avant | après | retirées |
|---|---|---|---|
| `test/monde.test.js` | 145 | **170** | **1, déclarée** — `CSS_MINI_LETTRE > 0`, partie avec sa constante (§3) |
| `test/icone.test.js` | — | **23** | fichier neuf |

Aucune autre assertion n'a été supprimée ni assouplie.

---

## 8. Vérifications appareil — **NON EXÉCUTÉES**

Le dépôt n'a ni jsdom ni navigateur (CLAUDE.md §3).

Ce lot :

1. la base terminale **se distingue** d'une base de l'Ouvrage, aux quatre crans ;
2. **plus aucune lettre** n'apparaît sur la carte ;
3. l'hexagone est **bien centré** sur sa case et ne déborde pas d'une case ;
4. **l'icône sur l'écran d'accueil du S25 FE** — la seule façon de savoir si
   l'encastrement à 72/108 est le bon choix, et si l'icône paraît trop petite ;
5. **l'éclair rouge** — constater la perte du §5 avant d'arbitrer la palette.

En attente des lots précédents, reprises telles quelles : les emblèmes restent
nets aux quatre crans ; un site se distingue d'un autre au cran le plus serré ;
la base du joueur se repère parmi celles de l'Ouvrage ; les unités portent leur
sprite à la bonne pose et orientation ; la tourelle d'un blindé suit l'ancre de
sa coque ; les seize orientations se lisent pendant une approche ; l'accent d'une
unité reste lisible sans la légende ; un bâtiment joueur et un bâtiment Ouvrage
se distinguent au combat ; une casemate a le même dessin aux trois endroits ; le
socle est sous la tourelle ; le raccord d'un merlon se défait à la mort de sa
voisine ; le temps de rendu d'une dalle sur l'appareil.

---

## 9. Questions posées et NON tranchées

1. **La favicon (§4.4).** Le HTML livré n'a aucune icône : ni `favicon`, ni
   `apple-touch-icon` — un onglet de navigateur montre une page blanche sans
   marque. **Coût mesuré d'une icône de 64 px** au format de l'icône
   conditionnée : le premier plan mdpi fait 108 px pour **3 981 octets** ; à
   surface proportionnelle, une variante 64 px pèserait de l'ordre de **1 400
   octets bruts, ~1 900 en base64** — soit 0,15 % du livrable. Mais c'est un
   `data:` de plus pour tous, et l'APK est la voie d'installation réelle.
   **Non décidé.**
2. **L'orange de l'éclair** — §5. Ajouter une teinte à la palette, ou accepter le
   rouge ?
3. **La dette de `cond.reduire`** — §6. Régénérer les sprites de l'Ouvrage est un
   lot à part.
4. **La base 2 × 2** attend l'usage qu'Ethan lui destine.

---

## 10. Angles morts et points en suspens

1. ⚠ **`tools/verifier.py` ne voit pas `android/`.** Les sorties de `icone.py`
   vivent hors d'`art/sprites/`, donc hors de son périmètre : **rien ne dit que
   l'icône commitée est celle que son outil produit aujourd'hui** — exactement le
   défaut que le lot CHAÎNE-VÉRIFIÉE existait pour fermer, rouvert d'un cran
   ailleurs. **Non corrigé dans ce lot, comme le brief le demande.** Comment
   l'étendre : `icone.py` prendrait un dossier de sortie déroutable, comme les
   onze producteurs prennent `FZ_SPRITES`, et le vérificateur comparerait
   `android/app/src/main/res/mipmap-*` de la même façon. `test/icone.test.js`
   tient en attendant ce qui se tient sans Python — dimensions, palette,
   encastrement — mais **il ne rejoue pas l'outil**.
2. **La famille `effet` reste la dernière non cousue**, faute d'un événement de
   mort publié par le moteur.
3. **L'accent d'une unité ne se voit plus sur l'unité**, non tranché depuis
   UNITÉS-AU-COMBAT.
