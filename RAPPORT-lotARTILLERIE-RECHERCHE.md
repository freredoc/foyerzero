# Rapport — lot ARTILLERIE-RECHERCHE

**23/09/2026** · branche `claude/rayons-artillerie-arbitrage-8jyf8c` ·
base `main` = `40c83a3` (merge du lot ARTILLERIE, PR #168, 23/09 15:48:01Z) ·
version **0.99.76 · build 188**.

Les trois nœuds `soutienAntiInfanterie`, `soutienAntiAerien` et
`soutienAntiVehicule` de l'onglet Spécial portaient `cout: null` depuis le lot
RECHERCHE : ils s'affichaient, et ils ne s'achetaient pas. Ils ont désormais un
prix, un moteur, un bouton, et leur achat est la **porte** des trois bâtiments
d'artillerie. Le lot ARTILLERIE (build 187) avait branché l'**effet** ;
celui-ci branche l'**accès**, et c'est tout ce qu'il fait.

---

## 1. `npm run check` — avant et après

| | déclarés | pass | fail | skipped | sortie |
|---|---|---|---|---|---|
| **avant**, sur `40c83a3` | 1666 | 1 665 | 0 | 1 | 0 |
| **après** | **1668** | **1 667** | **0** | **1** | **0** |

Le `skipped` est `LIMITE T8`, suspendu par Ethan le 08/09 — il ne bouge pas.

**Deux tests entrent**, `SOUT T1` et `SOUT T2`, dans le nouveau
`test/artillerie-recherche.test.js` : `test/` passe de **80** à **81** fichiers.
Aucun fichier n'entre ni ne sort de `src/`.

⚠ **PAS DE TROISIÈME TEST** — le brief l'interdit nommément, et l'interdit avait
raison : l'achat lui-même (codes de refus, tri de la liste, doublon refusé) est
le geste d'`acheter` et d'`acheterUneBaseDePlus`, déjà tenus par
`test/recherche.test.js`. En écrire un de plus ici aurait testé le lot
précédent.

⚠ **AUCUNE ASSERTION N'A ÉTÉ RETIRÉE NI ASSOUPLIE.** Sept réancrages, chacun
écrivant le nombre d'avant à côté de celui d'après — voir §6.

---

## 2. Le livrable, poste par poste

`npm run build` → `dist/index.html`, **10 606 810 octets**, 0 référence externe.

Mesuré contre un livrable **rebâti** dans un `git worktree` pristine de `main` =
**`40c83a3`** — retrouvé à l'octet : **10 605 304**, le nombre que la §0 du lot
ARTILLERIE annonce.

| poste | avant | après | écart |
|---|---:|---:|---:|
| JavaScript | 444 232 | **445 738** | **+1 506** |
| feuille | 48 142 | 48 142 | +0 |
| balisage | 38 932 | 38 932 | +0 |
| images | 8 832 344 | 8 832 344 | +0 |
| audio | 1 241 654 | 1 241 654 | +0 |
| **total** | **10 605 304** | **10 606 810** | **+1 506** |

**Les cinq postes PARTITIONNENT le fichier des deux côtés** — chacun NET de ses
`data:`, somme exacte sur le total avant comme après, **écart 0 · 0**. `data:` à
**316 lignes / 315 URI** de part et d'autre (263 `audio/`, 52 `image/`).

⚠ **LE COÛT EST ENTIÈREMENT DU JAVASCRIPT, ET C'EST ATTENDU** : le lot ne fait
entrer ni image, ni son, ni règle de feuille, ni balise. Les trois sigles
`AAI` / `AAV` / `AAA` existent depuis le lot précédent.

⚠ **ET LE COMMENTAIRE NE PÈSE RIEN** : `tools/build.js` passe `minify: true`
pour le seul JavaScript, si bien que les cent quarante lignes de commentaire du
lot n'entrent pas dans ces 1 506 octets. Une ligne de commentaire CSS, elle,
voyagerait telle quelle — il n'y en a aucune ici.

**Borne T10 : 10 820 000, NON TOUCHÉE.** Marge **213 190 octets, 1,97 %**,
au-dessus du plancher de 150 000 qu'asserte `PIC T7`.

⚠⚠ **`PIC T7` EST RÉANCRÉ SUR SA DÉCIMALE, PAS SUR SA TOLÉRANCE — TROISIÈME FOIS
DE SUITE.** Les 1 506 octets valent un trente-troisième de sa tolérance de
50 000 : son assertion de taille serait restée VERTE. Ce qui le fait tomber est
`Math.round((MARGE / BORNE) * 10_000) / 100`, qui passe de **1,98 %** à
**1,97 %**. Le réancrer porte `MESURE` 10 605 304 → **10 606 810** et `MARGE`
214 696 → **213 190**, avec un `notEqual` de plus refusant le retour de
l'ancienne marge.

---

## 3. `SOUT T1` — la preuve sur une sauvegarde v40 RÉELLE

`SAVE_VERSION` passe de **40 à 41**. C'est la chose qu'on ne rattrape pas après
coup : une sauvegarde mal migrée est perdue chez le joueur.

### Le montage — rabaissé, jamais écrit à la main

C'est l'idiome du dépôt, et il n'y en a pas d'autre : « les montages du dépôt
fabriquent leurs vieilles sauvegardes en **RABAISSANT** une récente ». Le
montage part d'`partieJouable(7)` — le montage de `test/journal-raids.test.js`,
repris tel quel par `test/verrous.test.js` — puis **mène un vrai raid** sur le
premier camp, **achète pour de bon** le Bélier en offense, sérialise, rabaisse
`version` à 40 et **retire** `recherche.soutiens`.

Écrire une v40 à la main aurait donné un objet plausible et faux : il lui
manquerait la moitié des champs que les quarante maillons d'avant ont posés, et
le `deepStrictEqual` de l'assertion (c) ne mesurerait plus rien.

### Les cinq assertions de prémisse

Le test refuse d'abord de mesurer sur un montage vide :

- `soutiens` **absent** de la v40 — sinon le maillon n'est plus exercé ;
- `rapports` **non vide** — le raid a bien eu lieu ;
- `bases` **non vide** ;
- `recherche.acquises.offense` contient **`belier`** — la recherche est peuplée ;
- `recherche.pointsMilli` **> 0** — le raid a crédité.

### Les trois moitiés du maillon

**(a) il pose.** `migrer(v40)` rend `version === SAVE_VERSION` et
`recherche.soutiens` `deepStrictEqual` `[]`.

⚠ **ET LA LECTURE PASSE PAR LE MOTEUR, PAS PAR LE CHAMP EN CLAIR.** `exigerEtat`
de `sim/recherche.js` **EXIGE** `soutiens` au même titre qu'`acquises`,
`modules` et `basesAutorisees` : un maillon qui ne ferait qu'`s.version = 41`
lèverait « champ `recherche.soutiens` absent — sauvegarde non migrée ? » à la
première ouverture de l'écran Recherche. Le test le mesure par
`charger(JSON.stringify(v40), …)` sous `doesNotThrow`, puis
`soutienEstAcquis(charge, 'soutienAntiVehicule') === false`. **Ces deux
lignes-là sont ce que le joueur vit.**

**(b) il n'écrase pas.** Une v40 à qui l'on donne
`['soutienAntiVehicule', 'soutienAntiInfanterie']` la ressort **intacte, ordre
compris**.

⚠ **LA LISTE TÉMOIN N'EST PAS TRIÉE, ET C'EST DÉLIBÉRÉ.** `acheterUnSoutien`
trie ce qu'il range ; une liste témoin triée ne distinguerait pas « le maillon
n'y touche pas » de « le maillon la retrie ». Celle-ci les sépare.

**(c) il ne touche à rien d'autre.** `deepStrictEqual` sur la sauvegarde privée
de `version` **et** de `recherche.soutiens` — les deux seuls champs que le
maillon a le droit de toucher — sur les DEUX cas, la v40 nue et la v40 déjà
pourvue. Tout le reste est identique au caractère.

### La quatrième question de la relecture hostile

> *que se passe-t-il si le maillon tourne deux fois ?*

Le `!Array.isArray` **est** la garde, pas une précaution : remettre `[]` sans
condition effacerait trois achats payés plusieurs millions de points, en
silence. Mesuré sur les **trois formes** qu'une `recherche` de v40 peut prendre —
absente du champ, portant une liste, portant autre chose qu'un tableau — et
**une sauvegarde à la version courante traverse la chaîne sans être réécrite
d'un octet** (`deepStrictEqual(migrer(v41), v41)`). C'est la discipline des
maillons 23 → 24 et 37 → 38, qui n'écrasent pas non plus une valeur présente.

### Le coût dans la sauvegarde

**14 octets exactement, sur les 25 graines** — `,"soutiens":[]`, soit la
longueur du littéral au caractère. `serialiserEtat` trie les clés PROPRES, donc
`soutiens` tombe en dernier dans `recherche` et le texte ajouté est
rigoureusement celui-là.

Le témoin de BASES-0 prend sa **trente-troisième** couche,
`DEPLACES_PAR_ARTILLERIE_RECHERCHE` : **un seul champ, `recherche`, sur les
quatorze phases** — les vingt-deux autres ne bougent sur aucune. Les cinq
empreintes distinctes se regroupent p01–p06 / p07–p10 / p11–p12 / p13 / p14,
**exactement le même groupement qu'avant le lot** : c'est ce qui dit que seul le
champ neuf a bougé, et pas ce que la recherche contient.
`OCTETS_AJOUTES_PAR_ARTILLERIE_RECHERCHE = 14` **s'ajoute** aux termes
précédents, il ne les remplace pas.

---

## 4. `SOUT T2` — la porte s'ouvre, et elle ne s'ouvre que pour son bâtiment

### Le montage, chiffré

Un état neuf, graine 7, portant **exactement 7 500 000 000 milli-points** — le
prix du Soutien anti-véhicule, lu dans `coutDuSoutienMilli` et non écrit dans le
test.

⚠ **MODE DÉVELOPPEUR ÉTEINT, ET C'EST ASSERTÉ, PAS SUPPOSÉ.** Il lève le péage
sans rien créditer : le solde resterait à 7 500 000 après l'achat, et la
dernière assertion du test cesserait de mesurer quoi que ce soit.

### Avant l'achat

Palette de **treize** vignettes — `ORDRE_PALETTE.length` —, dont **trois**
artilleries, donc **dix** autres. Les trois portent une `raison` non nulle, et
le test exige la **forme** du motif :

```
/^la recherche .+ ouvre ce bâtiment$/
```

⚠ **LE MOTIF EST CELUI DE LA RECHERCHE, PAS CELUI DE L'ARTILLERIE EN PLACE** —
une base neuve n'en porte aucune. Sans cette forme, un grisage qui se tromperait
de motif passerait : la marque serait la même.

### Après l'achat de `soutienAntiVehicule`

| | avant | après |
|---|---|---|
| `soutienEstAcquis('soutienAntiVehicule')` | `false` | **`true`** |
| `artillerieAntiVehicule.raison` | « la recherche Soutien anti-véhicule ouvre ce bâtiment » | **`null`** |
| `artillerieAntiInfanterie.raison` | non nulle | **identique au caractère** |
| `artillerieAntiAerien.raison` | non nulle | **identique au caractère** |
| les **dix** autres vignettes | — | **`deepStrictEqual`, identiques** |
| solde en milli-points | 7 500 000 000 | **0** |

Le débit est vérifié deux fois : le solde tombe à zéro, **et** l'écart vaut
exactement le prix. Un débit partiel, ou un achat gratuit, fait tomber l'un ou
l'autre.

⚠ **LA PORTE N'OUVRE PAS LES TROIS D'UN COUP**, et le test le nomme : les deux
autres soutiens restent non acquis, leurs vignettes restent grisées, **et leur
motif n'a pas changé**.

---

## 5. Les écarts déclarés

### 5.1 L'ordre de priorité entre les motifs de grisage (§5)

`raisonDuGrisage` porte **trois** motifs depuis ce lot, dans cet ordre :

1. `unique` déjà posé ;
2. **une artillerie occupe déjà la base** ;
3. **le soutien n'est pas acheté**.

**L'artillerie en place prime sur la recherche**, et c'est l'arbitrage que le
brief recommande en toutes lettres — « la plus actionnable est l'artillerie en
place : démolir est un geste qu'il peut faire tout de suite, acheter une
recherche dépend de ses points ». Le joueur lit donc **une** raison, jamais deux
collées.

⚠ **L'`unique` RESTE EN TÊTE PARCE QU'IL EST DISJOINT DES DEUX AUTRES** —
**mesuré** : `BASE_BATIMENTS[x].unique` vaut `false` sur les trois artilleries.
Sa position ne décide de rien, et la déplacer ne changerait aucune phrase.

⚠ **LE LIBELLÉ EST CELUI DU NŒUD, PAS CELUI DU BÂTIMENT** — « la recherche
**Soutien anti-véhicule** ouvre ce bâtiment » nomme ce que le joueur doit aller
chercher dans l'onglet Spécial. Une phrase bâtie sur « Canon ionique » le
renverrait vers un mot qui n'y figure pas.

### 5.2 Le rendu N'A PAS été vu — déclaré non exécuté

Ce que le lot change se **VOIT** : trois vignettes grisées qui se dégrisent à
l'achat, et trois lignes de prix dans l'onglet Spécial. **Rien n'a été ouvert
dans un navigateur.** Tout est mesuré sur le faux document de
`chantier.test.js`, sur `posablesDeLaBase` et sur des fonctions PURES.

**À regarder au premier essai** : que la phrase « la recherche Soutien
anti-véhicule ouvre ce bâtiment » tienne dans la vignette sans la déformer, et
que les trois prix — 1,50M · 3,50M · 7,50M sous `formaterPoints` — s'alignent
avec les 2,00M de la base supplémentaire dans le même onglet.

### 5.3 `tools/verifier.py` n'a pas été lancé, et c'était conforme

Le lot ne touche ni `art/`, ni un outil de la chaîne — **zéro fichier au diff**
des deux côtés, et le brief l'écarte nommément.

### 5.4 La branche

Le brief demande `claude/artillerie-recherche` ; l'environnement d'exécution
épingle la session à **`claude/rayons-artillerie-arbitrage-8jyf8c`** et interdit
de pousser ailleurs sans autorisation explicite. **Écart déclaré**, comme au lot
précédent.

---

## 6. Ce qui a été trouvé et qui contredit le brief ou le dépôt

Cinq choses. Le dépôt a raison contre le brief, toujours.

### 6.1 Le facteur d'échelle du brief : la conclusion tient, les deux chiffres qui la portent, non

Le brief justifie les trois prix par un rapport d'échelle entre les prix de
`ARBRE-RECHERCHE.md` §3.5 et ceux du dépôt, qu'il donne comme **« douze lignes
de défense, de ×29 à ×46, médiane ×38 »**.

**Mesuré : treize lignes, et de ×29,1 à ×337,5, médiane ×37,9.** La fourchette
annoncée ne tient que sur les **neuf** lignes au-dessus de 11 000 points de
document — ×29,1 à ×45,9, médiane ×35,3 —, les quatre lignes basses partant
jusqu'à ×337,5 parce qu'un prix de document arrondi au millier se compare mal à
un prix de dépôt qui ne l'est pas.

**La conclusion, elle, tient** : les trois prix retenus — 1 500 000 · 3 500 000
· 7 500 000 contre 40 000 · 90 000 · 200 000 au document — valent
**×37,5 · ×38,9 · ×37,5**, donc en plein dans la fourchette des neuf lignes
comparables. Les prix ne bougent pas ; ce sont les deux chiffres d'appui qui
sont réécrits, dans `src/data/recherche.js`.

⚠ **ET LE MÊME §3.5 ÉCRIT « Deuxième base 500 000 » QUAND `baseSupplementaire`
PORTE 2 000 000 DEPUIS LE 02/09.** Le document n'a pas été corrigé et ne le sera
pas ici : **le document est de la matière première, le dépôt est la décision.**

### 6.2 Le commentaire de `raisonDuGrisage` disait « ils sont disjoints », et ce n'était plus vrai

Il posait que « l'ordre des deux motifs ne peut pas se poser : ils sont
disjoints — aucune artillerie n'est `unique: true` ». **Vrai des deux motifs
d'alors, faux du troisième** : un joueur sans recherche **et** avec une
artillerie en place tombe dans les deux à la fois, sur les trois mêmes
vignettes. Le laisser aurait été le motif mort sous une conclusion vivante que
ce dépôt punit ailleurs quatre fois. **Réécrit**, avec l'arbitrage du §5.1.

### 6.3 `ERGO T15` interdit à tout `src/` de raconter la disparition de `COULEUR_OBSTACLE` — trouvé, non corrigé

En retirant `SANS_MOTEUR` de `src/ui/recherche.js`, la suite est passée au rouge
sur `ERGO T15` : il balaie **les quatre dossiers de `src/`** à la recherche de
`COULEUR_OBSTACLE`, **sur la source BRUTE**, commentaires compris. C'est la
seule garde d'orphelinage du dépôt qui fasse les deux à la fois.

**Conséquence** : aucun fichier de `src/` ne peut expliquer par écrit pourquoi
cette constante est partie — la phrase qui le dirait fait tomber le test.
Réparé ici en reformulant la prose, **pas la garde** : c'est la discipline
« une garde qui lit ce qu'on a écrit à son sujet ne garde rien », prise par
l'autre bout — ici la garde a raison, et c'est le texte qui cède. **Neuvième
fois du dépôt.** Le desserrer serait un arbitrage ; **Ethan tranche.**

### 6.4 « Aucune vignette grisée sur une base neuve » était écrite DEUX fois, à quatre-vingt-dix lignes d'écart

Dans `test/chantier.test.js`, avec **deux raisons différentes**. Corriger la
première a laissé la seconde rouge — `10 !== 13` — et il a fallu la chercher.
Les deux sont **retournées**, chacune avec son `notEqual`, et **leur compte se
DÉRIVE de `ARTILLERIES.length`** : le jour où une quatrième artillerie entrera,
les deux suivront ensemble ou tomberont ensemble.

### 6.5 Le lot ajoute un NEUVIÈME péage au mode développeur, et `MODE-DEV T1` n'a pas rougi tout seul

`acheterUnSoutien` lève le péage comme `acheter` le fait depuis le lot MODE-DEV
— même geste, même franchise, mêmes deux moitiés.

**Mesuré : `MODE-DEV T1` ÉNUMÈRE les péages, il ne les COMPTE pas.** Un péage
neuf y entre donc en silence **dans les deux sens** : branché sur la franchise,
il passe sans être gardé ; non branché, il passe aussi. Et son en-tête disait
« elle s'applique aux **HUIT** péages du dépôt » — une phrase juste hier et
fausse aujourd'hui, très exactement le mensonge que `CLAUDE.md` punit ailleurs
quatre fois.

L'énumération est **étendue** — un **resserrement**, jamais un troisième test,
que le brief interdit nommément — et elle porte désormais la règle en toutes
lettres : **« tout lot qui ajoute un péage ajoute sa ligne ici »**.

⚠ **ET LA MOITIÉ ALLUMÉE VÉRIFIE QUE L'ACHAT GRATUIT A BIEN OUVERT.** La
franchise saute le **DÉBIT**, jamais l'effet du geste : sans
`soutienEstAcquis` après l'appel, l'assertion sur `pointsMilli` passerait sur un
achat qui n'a pas eu lieu, et le péage neuf serait vert pour la mauvaise raison.

⚠ Le brief ne met pas le mode développeur hors périmètre (§7), et le neuvième
péage naît de ce lot : le taire aurait laissé au dépôt une phrase fausse et un
péage non gardé.

---

## 7. La relecture hostile — les quatre questions

**Qui d'autre écrit `recherche.soutiens` ?** Trois sites, et ils se comptent :
le constructeur `creerAcquises` (`src/sim/recherche.js:169`), le maillon de
migration (`src/sim/state.js:3632`), et `acheterUnSoutien`, qui `push` puis
`sort` (`:714–715`). Rien d'autre dans tout `src/`.

**Qui d'autre lit cet état ?** Un seul lecteur, `soutienEstAcquis`
(`src/sim/recherche.js:602`). Les deux écrans passent par les exports du
moteur ; `src/ui/chantier.js:2360` porte le commentaire qui le dit, et la ligne
qui lirait `etat.recherche.soutiens` en clair n'existe nulle part.

**Cet état est-il seulement atteignable ?** Oui, et par un seul chemin :
l'onglet Spécial de l'écran Recherche. Le mode développeur est honoré sur les
**deux** moitiés du chemin d'achat — le refus et le débit — et la franchise
laisse l'ouverture avoir lieu (§6.5).

**Que se passe-t-il si le maillon tourne deux fois ?** Rien — §3, quatrième
question, mesuré sur les trois formes.

---

## 8. Ce qui n'est PAS dans ce lot

- **L'effet, les rayons, le barème** : mergés au build 187, pas une ligne
  touchée. **La contradiction entre les deux relevés TA sur les rayons —
  `RELEVE-TA-ARSENAL.md` §4 contre `RELEVE-TA-COURBES-2.md` §6.6 — reste
  ouverte et attend Ethan.**
- **`test/temoins-couts.js`**, périmé avant même le lot ARTILLERIE : 42 lignes
  pour onze bâtiments quand le roster en compte quinze. **Non régénéré** —
  `donnees.test.js` épingle `TEMOINS_COUTS.length` à 42, et le réancrer au
  passage mélangerait deux dettes. **Son propre lot.**
- **Aucun emploi offensif**, **aucune portée dessinée sur la carte**, **aucune
  ligne de retrait au rapport de défense**.
- **Aucun sprite, aucun pictogramme neuf.**
- **Aucun prérequis entre les trois nœuds**, et **aucun changement aux prix de
  l'arbre offense/défense** — vérifié au diff : `src/data/recherche.js` ne
  bouge que sur les trois `cout: null` et leur `ouvre`.

---

## 9. Fichiers au diff

`src/data/recherche.js` · `src/sim/{recherche,state}.js` ·
`src/ui/{chantier,recherche}.js` · **douze** fichiers de `test/` — le témoin de
BASES-0 compris — · `package.json` · `CLAUDE.md` · ce rapport.

**Il FAIT ENTRER `test/artillerie-recherche.test.js`** et n'en sort aucun.

**Pas une ligne de `src/render/`, `src/son/`, `src/sim/combat.js`,
`src/data/` hors `recherche.js`, `tools/` ni `art/`** — vérifié au diff.
