# RAPPORT — lot PRÉDILECTION

**13/09/2026.** Branche `claude/new-session-j500j0`. PR ouverte, jamais fusionnée.

Ethan, 13/09, point 3 : « L'épervier ne s'est pas arrêté pour cibler le fendeur.
D'autres situations comme ça ? » — **oui, douze unités sur quatorze.**
Arbitrage rendu : **route i**, on change `ciblage`, pas la règle d'arrêt.

---

## 1. Version, build, `npm run check`, octets, `SAVE_VERSION`

| | avant | après |
|---|---|---|
| `version` · `config.build` | 0.99.57 · 159 | **0.99.58 · 160** |
| type des deux champs | chaînes | **chaînes**, vérifié au type |
| `npm run check` | 1609 déclarés · 1608 pass · 0 fail · 1 skipped, sortie 0 | **1611 déclarés · 1610 pass · 0 fail · 1 skipped, sortie 0** |
| `dist/index.html` | 9 385 997 o | **9 386 114 o** |
| références externes | 0 | **0** |
| marge sous la borne T10 (9 600 000) | 214 003 o · 2,23 % | **213 886 o · 2,23 %** |

Le skip est `LIMITE T8`, suspendu par Ethan le 08/09 ; il n'a pas été touché.

### Le coût, ventilé poste par poste

Mesuré contre le livrable **rebâti dans un `git worktree`** sur l'arbre pristine de
`main` = `a5dbd5a`. Ce pristine rend **9 385 997 octets**, c'est-à-dire le nombre que
la §0 de `CLAUDE.md` annonçait, **retrouvé à l'octet**.

| poste | pristine | lot | écart |
|---|---|---|---|
| JavaScript | 425 725 | 425 842 | **+117** |
| feuille | 46 538 | 46 538 | +0 |
| balisage | 36 785 | 36 785 | +0 |
| images | 7 683 603 | 7 683 603 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |
| **total** | **9 385 997** | **9 386 114** | **+117** |

La partition tombe **exactement** sur le total des deux côtés — écart 0 · 0 — et il y
a **306 URI / 307 lignes `data:` de part et d'autre**. Le lot ne fait entrer ni une
image ni un son : **la borne T10 ne bouge pas**.

### `SAVE_VERSION` — démontré, pas raisonné

`src/sim/state.js` **n'apparaît pas au diff**. La démonstration est un aller-retour de
sérialisation sur cinq parties **réellement jouées vingt-quatre heures sous le feu** —
base plantée rangée 200, donc à portée de bases de l'Ouvrage de niveau suffisant, donc
quatre rapports de raid subi rangés dans chacune :

| graine | `version` | octets | rapports | aller-retour |
|---|---|---|---|---|
| 1 | 33 | 8 260 | 4 | identique à l'octet |
| 7 | 33 | 8 372 | 4 | identique à l'octet |
| 42 | 33 | 8 292 | 4 | identique à l'octet |
| 2026 | 33 | 8 386 | 4 | identique à l'octet |
| 99991 | 33 | 8 224 | 4 | identique à l'octet |

`SAVE_VERSION` **reste à 33**. Le lot n'ajoute aucun champ : `cibleIndice` existe
depuis toujours, et un combat ne se sauvegarde pas.

### Ce qui n'a pas été lancé, et pourquoi c'était conforme

**`python3 tools/verifier.py` n'a pas été lancé.** `CLAUDE.md` §0.5 le réserve aux
lots qui touchent `art/sources/`, `art/sprites/` ou un outil de `tools/` — « ⚠ **Pas
aux autres lots.** Il prend deux minutes ; une consigne qu'on n'applique pas en
affaiblit d'autres. » Le lot ne touche **aucun** des trois : zéro fichier au diff.

---

## 2. La base confrontée, et ce que ce brief dit de faux

`npm ci && npm run check` au départ : **1609 déclarés · 1608 pass · 0 fail · 1
skipped**, sortie 0. `origin/main` = `a5dbd5a`, identique à `HEAD`.

Les pré-vérifications du §0 du brief ont été confrontées une par une. **Quatre de ses
affirmations sont fausses**, et les voici dans l'ordre où elles coûtent.

### 2.1 — §1 : le retard n'est pas de trois rangées et demie, et sa cause est l'inverse

Le brief écrit : « Il ne le prendra qu'à la mort des Fusiliers — trois rangées et
demie trop tard. »

**Mesuré sur son propre montage, arbre pristine** : l'Épervier prend le Chasseur au
**tick 35, rangée 6 080**, et les Fusiliers sont **encore vivants, à 595 704 / 700 000,
soit 85,1 % de leurs PV**. Le retard vaut **dix-neuf ticks et 2,28 rangées**, et ce
n'est pas une mort.

⚠⚠ **Et le mécanisme est un DÉPASSEMENT, pas une préférence tardive.** À ce tick-là
l'Épervier a **doublé** les Fusiliers : d² 1 166 400 contre 1 006 400 pour le Chasseur,
qui est donc devenu **le plus proche**. Il ne l'a jamais préféré — il l'a rattrapé.
C'est un fait de plus contre le défaut, pas un fait de moins : la règle d'arrêt ne
pouvait répondre oui qu'au moment où la géométrie le lui accordait par accident.

⚠ **En revanche la prédiction du brief sur le PROTOTYPE tombe au caractère** : « au
tick 16, rangée 3,80, il bascule sur le Chasseur ET s'arrête — `avance = false` à tous
les ticks suivants ». C'est exactement ce que `PRÉDILECTION T1` mesure.

### 2.2 — §6 : 21 tests tombent sur 13 fichiers, pas 6 sur 8

Le brief annonce « 86 tests, 86 verts sur `main`, 80 verts avec le prototype » sur huit
fichiers, et nomme six tests qui tombent. Les six tombent bien. **Beaucoup d'autres
tombent aussi, sur des fichiers que le brief n'a pas balayés** : `arsenal`, `assaut`,
`repli`, `roster`, `disposition-ouvrage`, `contact`, `recherche`, `generateur`,
`pictogramme`. Un lot qui n'aurait réancré que sa liste aurait laissé `main` **rouge**.

### 2.3 — §5 : la cause de l'allongement est l'inverse de ce qu'il dit

Voir le §3 de ce rapport, qui la mesure raid par raid.

### 2.4 — §6 / `COL T18 bis` : la dette ne se ferme pas, et le compte d'hier était faux

Le brief pose « le lot ferme la dette ». **Mesuré sur le balayage de 600 scénarios :
une levée subsiste, `camp/30/30`.**

⚠⚠ Et l'ancre d'hier mentait. Le lot CONTACT-2 épinglait **deux** couples ; son propre
arbre pristine en rend **six** — `25/92`, `26/1`, `27/1`, `29/60`, `30/30`, `30/53`. Le
mouvement réel de ce lot-ci est donc **six → une**, et `camp/30/30` lève **des deux
côtés**. Le test est **gardé, pas retiré** : son couple épinglé passe à
`[['camp', 30, 30]]` et son compte de 2 à **1**. *Un correctif qui ne mord pas se
vérifie avant d'être cru* — et un compte de dette aussi.

### 2.5 — Ce que le brief dit de VRAI, et qu'il fallait confronter aussi

- **§0 bis** : `CLAUDE.md` annonçait **0.99.56 · build 158** quand `package.json`
  portait **0.99.57 · build 159**. Vérifié, et **corrigé dans ce lot** : l'en-tête
  passe à 0.99.58 · build 160. C'est la contradiction entre deux documents que ce
  fichier punit ailleurs quatre fois, commise sur sa propre première page.
- **§2** : `doitSArreter` demande bien si la cible **courante** est de prédilection ;
  `ciblage` élisait bien la plus proche sans préférence. Vérifié au code.
- **§2** : la forme `p.colonnePredilection === pc.colonneMatrice` est bien un piège —
  les deux peuvent valoir `null`, et l'avertissement est déjà écrit dans `degatsContre`
  et `doitSArreter`.
- **§7** : la couche de témoins fait bien **1 074 champs sur 193 combats**. Retrouvé
  exactement. ⚠ En revanche son « 526 gardés » est la **soustraction naïve**
  `1 600 − 1 074`, qui ignore l'empilement des couches — voir le §6 de ce rapport.

---

## 3. Le §5 en premier plan : l'équilibrage, mesuré et non réglé

### 3.1 — La liste des plafonds

`CIBLE T5` balaie 54 raids (3 préréglages × 3 types × 6 graines, niveau 15) et relève
ceux qui touchent le plafond de `dureeMaxCombatSec` (900 ticks).

| | avant | après |
|---|---|---|
| raids au plafond | **aucun** | **`infanterie/base/3`** |
| le plus long des 54 | 895 ticks | **900** |

### 3.2 — Le tick 1 973, vérifié à plafond levé

**Ce n'est pas un gel**, vérifié comme les huit fois précédentes en portant `maxTicks`
à 20 000 : `infanterie/base/3` se conclut de lui-même par **`attaquants`** au tick
**1 973**, soit **2,19 fois le plafond** — 197 secondes de combat. À comparer aux
dépassements des lots précédents : 4 645 (CARTE), 5 478 (COLONNE), 3 539
(DISPOSITION-OUVRAGE), 2 618 (MUR), 940 (APPROCHE), 1 018 (BARÈME-ET-REJEU), 1 020
(CONTACT). C'est un combat deux fois trop long, pas un combat sans issue.

### 3.3 — ⚠⚠⚠ Et le SENS de la cause est l'inverse de ce que le brief annonce

Le brief écrit que l'assaut « s'arrête pour la combattre, et n'avance plus vers les
bâtiments ». **Faux sur le seul raid concerné, et mesuré des deux côtés :**

| `infanterie/base/3` | avant | après |
|---|---|---|
| tick de fin | **414** | **1 973** (plafond levé) |
| cause | `attaquants` | `attaquants` |
| bâtiments tombés | **0 sur 21** | **4 sur 21** |

Avant le lot, l'assaut était **balayé en quarante et une secondes sans jamais griffer
l'objectif**. Après, il tient et il mord. Sur les **cinquante-quatre raids** :

| grandeur | avant | après | écart |
|---|---|---|---|
| attaquants détruits | 424 | **388** | −8,5 % |
| bâtiments tombés | 35 | **44** | +25,7 % |
| défenseurs tombés | 179 | **188** | +5,0 % |
| somme des ticks | 25 715 | **29 169** | +13,4 % |

**Le lot rend les assauts plus FORTS, et c'est pour ça qu'ils durent** : une unité qui
tire dans sa colonne la plus forte survit plus longtemps et fait plus de dégâts. Ce
n'est pas un piétinement.

### 3.4 — Les trois issues, et aucune n'est prise

1. **Accepter.** Un raid sur cinquante-quatre dépasse 90 s, et il dépassait déjà
   silencieusement par le haut à d'autres lots. Le plafond fait son travail : il coupe.
   Coût : le joueur voit un raid tronqué sur ce montage-là.
2. **Relever `dureeMaxCombatSec`.** 200 s couvriraient `infanterie/base/3` à son
   terme. Coût : **tous** les raids peuvent alors durer deux fois plus longtemps à
   l'écran, et c'est l'écran de raid qui se regarde en temps réel (arbitrage du 01/09).
3. **Borner la préférence.** N'appliquer le critère de tête que sous une distance, ou
   ne l'appliquer qu'à l'attaque. Coût : deux vérités sur la même question, et le
   défaut d'Ethan reviendrait dans la moitié bornée.

**Aucune n'est prise. Aucun barème n'a été touché** — ni `dureeMaxCombatSec`, ni les
tables de dégâts, ni les portées, ni les masses. **Ethan tranche.**

---

## 4. Le §4 tranché : on n'extrait PAS de prédicat partagé

La question du brief : `ciblage` et `ensembleCamoufles` posent la même question — « ce
candidat est-il de ma prédilection ? » — faut-il l'extraire ?

**Non, et c'est une mesure qui le dit.**

Montage : un **Frappeur camouflé, `reserve: 0`, avec un bâtiment à portée**.

- `ensembleCamoufles` le **révèle** : le bâtiment est de sa prédilection
  (`structureOuAviation`), donc il sort du camouflage. Cette fonction ne filtre **pas**
  par les dégâts, et elle a raison de ne pas le faire — le camouflage tombe quand la
  cible de prédilection est là, pas quand on peut la tuer.
- `ciblage` ne lui donne **aucune cible** : `degatsContre` rend zéro, la réserve étant
  vide, et « une cible valide est une cible qu'on peut blesser » est ce que
  `CIBLE T5` a fermé au lot 3C.

**Les deux réponses sont justes, et un prédicat unique devrait en choisir une** : y
mettre le filtre de dégâts garderait ce Frappeur camouflé ; l'en retirer ferait viser
une cible qu'on ne peut pas blesser.

⚠ Et les **cinq** sites posent en réalité cinq questions distinctes :

| site | la question |
|---|---|
| `ensembleCamoufles` | une cible de prédilection existe-t-elle dans MA portée ? (sans filtre de dégâts) |
| `ciblage` | ce candidat, déjà filtré par les dégâts, l'approche et le masque, est-il de ma prédilection ? |
| `cibleDuDecalage` | où est la plus proche, SANS condition de portée ? |
| `doitSArreter` | la cible que je tiens DÉJÀ est-elle de ma prédilection ? |
| `degatsContre` | dois-je majorer ce tir de la munition spéciale ? |

**Ce qui se partage est la DISCIPLINE, pas le code**, et `ARRÊT T10` la tient :
il passe de **11 à 13 occurrences** de `colonnePredilection` (3 écritures de profil,
**10 lectures** — deux de plus, la garde de nullité de `ciblage` et sa comparaison), il
**nomme les cinq sites** au lieu de les compter, et il exige de chacun **la garde de
nullité**. Son titre passe de « HUIT lecteurs » à « DIX ».

---

## 5. Les tests, un par un

**Aucune assertion n'a été retirée ni assouplie.** Chaque réancrage écrit le nombre
d'avant à côté de celui d'après et porte une contre-assertion `notEqual` qui refuse le
retour de l'ancien. **Quatorze fichiers de `test/` sont touchés**, plus les deux
témoins.

### 5.1 — Les réancrages de valeur

| test | avant | après | ce que l'assertion mesure désormais |
|---|---|---|---|
| `ARRÊT T10` | 11 occurrences | **13** | les cinq sites NOMMÉS, chacun avec sa garde de nullité |
| `ARSENAL T10` | `nbTicks` 501 | **493** | huitième cause de fin réancrée, même nature que la septième |
| `ASSAUT T7` figés | 871 · 700 · 478 | **834 · 698 · 478** | le 478 ne bouge pas pour le quatrième lot d'affilée |
| `ASSAUT T7` budgétés | 322 · 439 · 501 | **727 · 424 · 493** | le A passe de ×1 à **×2,26** |
| `ASSAUT T7` butin A | `{0, 0}` | **`{254 470, 84 823}`** | **neuvième renversement** : il sort du zéro où huit lots l'avaient laissé |
| `ASSAUT T7` butin C | 150 quartz | **6 486** | ×43,2 |
| `CIBLE T4` butin | `{20 898, 6 966}` | **`{20 885, 6 961}`** | −0,06 % : le plus PETIT réancrage que ce test ait porté |
| `CIBLE T5` plafonds | `[]` · 895 | **`['infanterie/base/3']`** · 900 | voir le §3 |
| `COL T18 bis` | 2 levées | **1** | la dette reste OUVERTE, et son ancre d'hier était fausse |
| `CONTACT-2 T2` | A = 26 | **A = 14** | **−46,2 %**, avec la répartition par montage des deux côtés |
| `DO T8` | graine 189 | **graine 141** | montage réparé, voir 5.2 |
| `GEN T12` couverture | 456 · 44 · 21 | **460 · 40 · 20** | la couverture **MONTE**, première fois |
| `GEN T12` `ecartMax` | 1 | **0** | contre-assertion **RETOURNÉE** : elle refusait le zéro, elle refuse le un |
| `JOURNAL T1` | 1 153 / 447 | **1 179 / 421** | huitième couche empilée |
| `JOURNAL T1 bis` | 1 335 / 265 | **1 337 / 263** | **deux champs neufs** : le lot bouge le TIR et le CIBLAGE |
| `JOURNAL T8` | écrasées `[10,20,21,28]` | **`[10,11]`** | 8 écarts non publiés au lieu de 5 |
| `PIC T7` | 9 385 997 · marge 214 003 | **9 386 114 · 213 886** | sixième réancrage, troisième contre-assertion |
| `MODULES-F T14` | graines `[7,18,24]` | **`[1,36,39]`** | voir 5.2 |
| `REPLI T6` | 501 · `{150,50}` · 3 survivants | **493 · `{6 486, 2 162}` · 5** | contre-assertion RETOURNÉE sur le butin |
| `ROSTER T5` | `[166]` ticks | **`[200]`** | quatrième réancrage ; la propriété — UNE durée sur neuf niveaux — ne bouge pas |
| `ROSTER T6` | A/B/C | **727 · 424 · 493** | mêmes trois raids que `ASSAUT T7`, mêmes nombres |
| `BASES-0 T1` | — | 26ᵉ couche | voir le §6 |

### 5.2 — Les trois montages qui ont perdu leur PRÉMISSE

**C'est le montage qu'on répare, jamais l'assertion.**

**`MODULES-A T2`** — Tir de barrage. Son mur témoin était en **(3, 4)**, à d²
2 000 000 pour une portée de 2 250 000 : **dedans**. Or le mur est de colonne
`structureOuAviation`, qui **est** la prédilection des Perceurs : depuis le lot, les
Perceurs le visent LUI au lieu de la cible que le test veut faire éclabousser. Le mur
passe en **(4, 4)** — d² 5 000 000, donc **dehors** — tout en restant à Tchebychev 1 de
la cible, donc toujours éclaboussable. **Les trois nombres assertés — 5 000, 7 500,
0 — ne bougent pas d'une unité.**

**`MODULES-C T5`** — Bouclier. La tourelle de c4 était une **Casemate**, qui fait 20 à
l'infanterie contre 5 à la structure : sa prédilection est l'**infanterie**, donc les
deux casemates visaient la `meute` et `vises` rendait `[5, 5]`. Elle devient une
**Batterie** — **40 à la structure, 0 partout ailleurs** — qui ne peut élire que
l'aéronef. `vises` rend `[4, 5]`, et **les six assertions de corps ne bougent pas**.
Ce n'est pas un assouplissement : la Batterie est une contrainte **plus** forte.

**`DO T8`** — la graine 189 ne touchait plus que **deux** bâtiments, et le test en veut
six survivants. Balayage des graines 99 à 240 : **46** qualifient ; **141** donne
**12 touchés / 6 détruits / 6 survivants**, la marge la plus large et la seule à
atteindre six. **Les trois seuils du montage ne bougent pas.**

**`MODULES-F T14`** — ⚠⚠ **les trois graines perdent leur prémisse ENSEMBLE, première
fois du dépôt.** Balayage de 1 à 60 : **six** conviennent aux trois niveaux — 1, 36,
39, 51, 56, 57 — et **l'intersection avec `[7, 18, 24]` est VIDE**. Elles passent à
`[1, 36, 39]`. **Septième fois que ce montage-là perd sa prémisse.**

### 5.3 — `COL T18 bis` : gardé, et dit

Le brief demandait de le retirer si la dette se fermait. **Elle ne se ferme pas** (voir
2.4). Le test reste, resserré : un couple épinglé au lieu de deux, et une levée au lieu
de deux. Il porte désormais, en commentaire, que l'ancre du lot CONTACT-2 sous-comptait
d'un facteur trois.

---

## 6. La couche de témoins

**Empilée, jamais recapturée.** Une recapture n'est légitime qu'après que
`JOURNAL T1 bis` a prouvé le MOTEUR inchangé, et le moteur est ce qui change ici.

### 6.1 — Les témoins de combat

| table | clés | combats touchés | champs |
|---|---|---|---|
| `COMBATS_DEPLACES_PAR_PREDILECTION` | 200 | **193** | **1 074** |
| `COMBATS_DEPLACES_PAR_PREDILECTION_AVANT_PAQUETS` | 200 | 190 | 994 |

⚠ **Le brief annonçait 1 074 champs sur 193 combats : retrouvé exactement.** ⚠⚠ Mais
son « 526 gardés » est une **soustraction naïve** — `1 600 − 1 074` — qui ignore que
les couches s'**empilent**. C'est la faute que le lot CONTACT a déjà relevée sur son
propre brief (« le 514 gardés est faux »). Les comptes d'UNION, mesurés :

| | avant | après |
|---|---|---|
| `JOURNAL T1` — surchargés / gardés | 1 153 / 447 | **1 179 / 421** |
| `JOURNAL T1 bis` — surchargés / gardés | 1 335 / 265 | **1 337 / 263** |

⚠⚠ **Et l'invariance de `T1 bis` dit ce que le lot touche : 1 335 → 1 337, DEUX
champs neufs.** Les six lots précédents n'en ajoutaient qu'UN, et tous bougeaient la
**FILE**. Celui-ci bouge le **TIR** et le **CIBLAGE** — c'est la première fois depuis
longtemps, et c'est exactement ce qu'un lot de ciblage doit déplacer.

⚠ Les deux tables portent les **200** clés, `{ }` là où rien ne bouge : une clé absente
se lirait « ce combat n'existe plus ».

### 6.2 — Le témoin de BASES-0, vingt-sixième couche

**16 couples sur 350 — la plus étroite de l'histoire de ce témoin.** Cinq champs,
phases **p11 à p14** : **les dix premières phases sont identiques AU BIT**, là où les
deux lots d'avant partaient de la p07. **Aucun scalaire ne bouge** — les dix-sept, sur
25 graines sur 25, la taille de la sauvegarde comprise.

| table | couverture |
|---|---|
| `DEPLACES_PAR_PREDILECTION` | 16 couples / 350 |
| `EMPREINTES_PAR_GRAINE_PREDILECTION` | **19 graines / 25** |
| `RAPPORTS_OUVRAGE_PREDILECTION` | **13 / 25** |
| `RAPPORTS_PROCHE_PREDILECTION` | **n'existe pas — 0 / 25** |

⚠⚠ **Le raid de proximité ne bouge pas d'un bit, et cette absence EST la mesure.**
Motif mesuré, pas supposé : sur le combat de la phase 7, tick par tick, le nombre de
colonnes de matrice **distinctes** à portée d'un attaquant ne dépasse **jamais UN** sur
483 ticks — le camp porte trois `meute` et rien d'autre, donc le critère de tête n'a
rien à départager. **La prédilection ne mord que là où une pièce avait plus d'une
CLASSE de cible valide à portée.**

⚠ Les six graines qui tombent à l'octet sur la couche `CONTACT_2` — **8, 10, 13, 17,
20, 24** — sont des parties où la garnison que l'Ouvrage attaque n'offre jamais deux
classes de cible à portée d'un même assaillant. Le repli `??` reste donc
**nécessaire**, comme aux lots MUR, VITESSE, BARÈME-ET-REJEU, CONTACT et CONTACT-2.

---

## 7. La mesure du §2 : une entité SANS prédilection

Le brief demande que cette vérification aille au **rapport** et non à un troisième
test — « c'est une mesure, pas un verrou ». La voici.

**Qui, au roster, n'a pas de prédilection ?** Trois pièces, et trois seulement :
**`merlon`, `ronce`, `herse`** — les trois `DEFENSES` dont `degats` vaut `null`.
Aucune unité.

**Sur les 54 raids du balayage :**

| grandeur | mesure |
|---|---|
| entités montées | **2 358** |
| dont bâtiments | 972 |
| dont pièces sans prédilection | **162** |
| ticks où une entité sans prédilection reçoit une cible | **0** |

⚠⚠ **La garde `p.colonnePredilection !== null` est donc INERTE sur l'état
d'aujourd'hui, et c'est mesuré, pas supposé** : `peutTirer` écarte ces trois pièces
avant que `ciblage` ne les examine, si bien qu'aucune n'atteint jamais l'ordre. La
conséquence annoncée par le §2 du brief — « une entité sans prédilection retombe
exactement sur l'ordre d'hier » — est donc **vraie et vacueuse**.

Elle est écrite quand même, pour deux raisons : la forme courte
`p.colonnePredilection === pc.colonneMatrice` serait **fausse** si un jour un profil
sans prédilection arrivait jusque-là, et la garde épargne un `profil(c)` par candidat.
*Un test qui ne peut tomber sur aucun état d'aujourd'hui se déclare, il ne se compte
pas* — c'est ce que fait ce paragraphe, et c'est pourquoi la falsification **F2** de la
§9 ne mord que par `ARRÊT T10`, qui lit la SOURCE.

---

## 8. `PRÉDILECTION T1` et `T2` — vus rouges sur `main`, puis verts

Les deux tests ont été écrits, puis joués sur l'arbre **pristine** (`src/sim/combat.js`
restauré depuis `a5dbd5a`) **avant** que le prototype ne soit remis.

### T1 — l'Épervier bascule au premier tick où le Chasseur est à portée

Montage du §1 du brief, à la lettre : Épervier colonne 5 depuis la rangée de départ,
Fusiliers en (5, 5), Chasseur en (6, 6), Souche lointaine en (15, 1) pour que la fin ne
vienne pas d'une grille vide.

| | `main` | lot |
|---|---|---|
| tick de bascule | **35** | **16** |
| rangée à la bascule | 6 080 | **3 800** |
| PV des Fusiliers | 595 704 / 700 000 | **660 028 / 700 000** |
| d² Fusiliers / Chasseur | 1 166 400 / **1 006 400** | **1 440 000** / 5 840 000 |
| l'Épervier avance après | oui | **non, à tous les ticks** |

**Rouge sur `main` : `expected: 16, actual: 35`.**

Les **trois assertions du §8** sont là : la cible **est** le Chasseur au tick épinglé,
l'entité **ne se déplace plus** sur les quarante-cinq ticks suivants, et les Fusiliers
sont **encore vivants** — à 94,3 % de leurs PV, donc « largement vivants, pas
agonisants », ce qu'une quatrième assertion exige.

⚠⚠ **Et le test mesure une PRÉFÉRENCE, pas une proximité.** Au tick de bascule les
Fusiliers sont **strictement plus proches** — 1,20 case contre 2,42 — et le Chasseur
vient d'entrer dans les 6 250 000 de portée (il était à 6 382 400 au tick d'avant).
Trois assertions le figent, et deux contre-assertions refusent le retour du tick 35 et
de la rangée 6 080.

⚠ Le montage déclare aussi sa **prémisse de roster** avant de tourner : la prédilection
de l'Épervier **est** `vehicule`, le Chasseur **est** frappé en `vehicule`, les
Fusiliers **ne le sont pas**. Sans ces trois lignes, un roster retouché ferait mesurer
autre chose en silence.

### T2 — l'invariant sur les 54 raids

Pour chaque entité, à chaque tick : **si sa cible n'est pas de sa prédilection, alors
aucune cible de prédilection n'était valide dans ses bornes** — mêmes bornes, minimale
et maximale, que son ciblage.

| | `main` | lot |
|---|---|---|
| violations | **6 097** | **0** |
| montages en violation | **53 / 54** | **0 / 54** |
| ticks-entités examinés | 130 268 | **134 836** |

**Rouge sur `main` : `infanterie/camp/1` tick 93 : « meute » vise « casemate » alors
que « carapace » est à portée.**

L'oracle est **recalculé depuis les données seules** — `colonneDe`, `tableDe`,
`dominante`, `degatsAttendus` — et ne doit rien au moteur ; c'est le motif de
`CIBLE T5`, repris et **non importé** : les deux fichiers mesurent deux propriétés
différentes du même ciblage, et un oracle partagé qui dériverait les ferait mentir
ensemble. Le **plancher de falsifiabilité** est celui du même idiome, `> 40 000`
ticks-entités.

⚠⚠⚠ **Et il a fallu le mesurer sur la photo d'AVANT le tick, sans quoi il accuse un
moteur juste.** Le ciblage est l'étape 3, le **déplacement** l'étape 7 : lire les
positions en FIN de tick compte des cibles qui n'étaient pas à portée quand le choix a
été fait. **Mesuré : la même boucle écrite sur l'état de fin de tick rend 366
violations sur l'arbre du lot, dont pas une n'en est une.** C'est la leçon de
`CIBLE T5` prise par l'autre bout — là-bas on demande si la cible stérile **survit** au
ciblage suivant, ici on juge le ciblage sur la géométrie qu'il a **vue**.

⚠ **La prémisse du camouflage est déclarée plutôt que rejouée.** `ciblage` masque les
camouflés au camp qui DÉFEND ; l'oracle ne le fait pas, et il n'a pas à le faire tant
qu'aucun module n'est armé. **Mesuré : les 54 montages arment ZÉRO module** —
`apparitionModule` du Camouflage vaut 28, les sites sont de niveau 15, et
`montageDuBanc` n'arme rien côté joueur. Une assertion le fige et tombera le jour où
l'un d'eux en armera un.

---

## 9. Relecture hostile

### 9.1 — Cinq falsifications, cinq chutes

Jouées une par une sur l'arbre du lot, suite **complète** à chaque fois.

| falsification | rouges | ce qu'elle montre |
|---|---|---|
| **F1** — le critère de tête retiré (ordre d'avant le lot) | **18** | dont `PRÉDILECTION T1` et `T2`, `CIBLE T4`, `CIBLE T5`, `JOURNAL T1`, `T1 bis`, `T8`, `BASES-0 T1` ×3, `GEN T12`, `CONTACT-2 T2` |
| **F2** — la garde de nullité retirée | **1** | **`ARRÊT T10` seul**, et c'est le bon endroit : voir 9.2 |
| **F3** — le critère de tête inversé (on FUIT la prédilection) | **25** | dont `COL T18 bis`, qui se met à lever ailleurs |
| **F4** — le drapeau oublié dans l'affectation | **29** | la plus bruyante : l'ordre devient « la DERNIÈRE de prédilection gagne » |
| **F5** — la prédilection passée en DERNIER critère | **18** | un départage qui ne mord presque jamais |

⚠ **F4 est la faute la plus probable du lot** — écrire le critère de tête et oublier de
mettre à jour `meilleurePredilection` dans le bloc d'affectation. Elle laisse le code
compilable, la règle plausible, et elle fait tomber vingt-neuf tests.

### 9.2 — La falsification qui ne mord que par la source, et pourquoi c'est juste

**F2** — retirer `p.colonnePredilection !== null &&` — ne fait tomber **aucun** test de
comportement. Ce n'est pas une faiblesse de la suite : c'est la mesure du §7 vue par
l'autre bout. Les trois pièces sans prédilection (`merlon`, `ronce`, `herse`)
n'atteignent jamais `ciblage`, écartées par `peutTirer`, et `profil(c).colonneMatrice`
n'est **jamais** `null` — un bâtiment est `structureOuAviation`. La comparaison
`null === 'infanterie'` reste donc fausse, et le comportement ne bouge pas.

**`ARRÊT T10` est le bon porteur pour cette garde-là**, parce qu'il lit la SOURCE : il
exige la garde de nullité dans chacun des cinq sites, et il tombe. C'est exactement
l'idiome du dépôt — *un test qui ne peut tomber sur aucun état d'aujourd'hui se
déclare, il ne se compte pas*.

### 9.3 — Ce que la relecture a trouvé, et corrigé

- **`PIC T7` allait mentir en silence.** Les 117 octets valent **un
  quatre-cent-vingt-septième** de sa tolérance de 50 000 : le test serait resté VERT
  pendant que la §0 de `CLAUDE.md` annonçait l'autre nombre. **Sixième réancrage**, avec
  une troisième contre-assertion qui refuse l'ancre d'ÉCRANS.
- **L'en-tête de `CLAUDE.md` mentait d'un build** avant même ce lot (§2.5).
- **Le titre d'`ARRÊT T10` a suivi son compte** — « HUIT lecteurs » → « DIX ». Un titre
  qui ne suit pas son assertion est un commentaire menteur en puissance.
- **Le premier jet de `PRÉDILECTION T2` accusait un moteur juste** (§8), et la
  correction n'a pas été d'assouplir l'assertion mais de mesurer au bon instant.
- **La première écriture de `PRÉDILECTION T1` plaçait ses gardes de distance AVANT
  l'assertion de tick**, si bien que le rouge sur `main` disait « expected 1440000,
  actual 1166400 » au lieu de « expected 16, actual 35 ». Le test mesurait la même
  chose ; il le disait mal. Réordonné.

### 9.4 — Ce qui N'EST PAS dans ce lot, vérifié au diff

- **`doitSArreter` : pas une ligne.** Vérifié au diff, et gardé par `ARRÊT T10`.
- **`cibleDuDecalage` : pas une ligne.** Le lot FREIN vient après.
- **Aucun réglage d'équilibrage** : `git diff src/data/` est **vide**.
- **Aucune ligne de `src/ui/`, `src/render/`, `src/son/`, `tools/`, `art/`.**
  `src/sim/combat.js` est **le seul fichier de `src/` qui bouge**.
- La **famille A** de `CONTACT-2 T2` reste ouverte ; seul son compte se remesure.

### 9.5 — Le rendu n'a pas été vu, et se déclare non exécuté

Ce que le lot change se **voit** — une unité qui laisse passer ce qui la serre de plus
près pour s'arrêter sur ce qu'elle sait tuer — et **rien n'a été ouvert dans un
navigateur** : tout est mesuré sur `cibleIndice`, `rangeeMilli` et des fonctions PURES.

**À regarder au premier essai :** que l'arrêt se lise comme un CHOIX et non comme un
blocage, et que les assauts qui durent **treize pour cent** plus longtemps en moyenne —
et deux fois plus sur `infanterie/base/3` — ne fassent pas attendre devant un écran qui
paraît figé.

### 9.6 — Écarts déclarés au brief

1. **§1** : le retard mesuré est de 19 ticks / 2,28 rangées, pas de trois rangées et
   demie, et les Fusiliers sont vivants. §2.1.
2. **§5** : la cause de l'allongement est l'inverse de celle qu'il donne. §3.3.
3. **§6** : 21 tests tombent sur 13 fichiers, pas 6 sur 8. §2.2.
4. **§6 / `COL T18 bis`** : la dette ne se ferme pas ; le test est **gardé**, pas
   retiré, et l'ancre d'hier était fausse d'un facteur trois. §2.4.
5. **§7** : le « 526 gardés » du brief est une soustraction naïve ; le compte d'union
   mesuré est **421**. §6.1.
6. **§11** : le brief demande « les six tests, un par un » ; **quatorze fichiers** de
   `test/` ont dû bouger, plus les deux témoins. §5.
7. **Branche** : le brief demande `claude/[descriptive]` ; l'environnement d'exécution
   épingle la session à `claude/new-session-j500j0` et interdit de pousser ailleurs
   sans autorisation explicite.
