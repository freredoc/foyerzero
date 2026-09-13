# RAPPORT — lot CONTACT (13/09/2026)

> « Quand deux unités défensives se déplacent, elles semblent entrer en
> collision, puis une ou l'autre est poussée très rapidement. »
> — Ethan, 13/09, puis l'arbitrage : **« Je ne veux pas de saut, ni de
> chevauchement. »**

---

## 1. Ce qui a été produit

| | |
|---|---|
| Version | **0.99.55** · build **157** — les deux sont des CHAÎNES, vérifié au type |
| `npm run check` | **sort en 0** |
| `npm test` | **1603 déclarés** · **1602 pass · 0 fail · 1 skipped** |
| Le skip | `LIMITE T8`, suspendu par Ethan le 08/09 — antérieur au lot |
| `dist/index.html` | **9 385 049 octets**, **0 référence externe** |
| `SAVE_VERSION` | **33**, inchangé — démontré au §10 |

Le lot touche `src/sim/combat.js`, `package.json`, `CLAUDE.md`, **quatorze**
fichiers de `test/`, les **deux** témoins gelés, et fait entrer
`test/contact.test.js` et ce rapport. **Pas une ligne de `src/data/`,
`src/render/`, `src/ui/`, `src/son/`, `tools/` ni `art/`** — vérifié au diff.

### Le coût, poste par poste

Mesuré contre le livrable **rebâti dans un `git worktree`** sur l'arbre pristine
de `main` = `48827c8`, et non contre un nombre recopié.

| poste | avant | après | écart |
|---|---:|---:|---:|
| total | 9 384 775 | 9 385 049 | **+274** |
| JavaScript | 424 503 | 424 777 | **+274** |
| feuille | 46 538 | 46 538 | +0 |
| balisage | 36 785 | 36 785 | +0 |
| images | 7 683 603 | 7 683 603 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| URI `data:` | 306 | 306 | +0 |
| lignes `data:` | 307 | 307 | +0 |

**La somme des cinq postes tombe EXACTEMENT sur le total des DEUX côtés.**
Borne T10 **inchangée à 9 600 000** — le lot ne fait entrer aucune ressource —,
marge **214 951 octets, 2,24 %**.

---

## 2. La base de départ, confrontée et non recopiée

Le brief le demandait en toutes lettres : « **La base réelle est à établir au
§0, pas à me croire.** » Les nombres qu'il annonce ont été confrontés un par un.

### Ce qui était juste

| annoncé | mesuré | |
|---|---|---|
| `package.json` 0.99.54 · build 156 | idem | ✔ |
| `CLAUDE.md` « 12/09/2026, version 0.99.54 · build 156 » | idem | ✔ |
| `src/sim/state.js` l. 80 `SAVE_VERSION = 33` | idem | ✔ |
| `src/sim/combat.js` **172 766 octets** | idem | ✔ |
| ancres aux lignes 2479, 2782, 2823, 2891, 3017 | idem | ✔ |
| `chevauchementInterditSur` **3** occurrences | 3 | ✔ |
| `allieeDevant` **2** | 2 | ✔ |
| `milliDepuisCase` **7** | 7 | ✔ |
| `peutEcraser` **4** | 4 | ✔ |
| `peutAvancer` **2** | 2 | ✔ |
| `dist/index.html` de `main` = 9 384 775 | idem, rebâti | ✔ |
| le saut du §1 : **920 millièmes au tick 27 contre un pas de 80** | idem, au millième | ✔ |
| `COMBATS_DEPLACES_PAR_CONTACT` = **1 086** champs | 1 086 | ✔ |

### Ce qui était FAUX — quatre nombres

**① « 514 gardés » dans les témoins de combat (§7).** C'est `1 600 − 1 086`,
une soustraction naïve qui ignore l'empilement des couches : 36 des 1 086 champs
déplacés étaient *déjà* surchargés par une couche antérieure. Le nombre mesuré
est **475 gardés / 1 125 surchargés**.

**② « la fenêtre `bloques = 16` se décale d'un tick » (`ARRÊT T7`, §6).**
Mesuré : elle ne se décale **pas**. Le premier forçage reste au **tick 35**, et
`bloques = 16` tient inchangé. Seule la POSITION du porteur bouge, 5 060 → 5 000.

**③ « `T7 b` asserte aujourd'hui `2960`, 960 millièmes de recouvrement assertés
au dépôt » (§1.4 et §6).** Il assertait **`2000`**. Le lot COLONNE (06/09) l'avait
déjà figé par l'arrêt sur prédilection : le Fendeur attaquant vise un véhicule,
donc il s'arrête. Le 2 960 est de l'histoire, pas un état du 13/09. **Le montage
est repris quand même** dans `CONTACT T2` : ce qu'il exerce — une bloquante
devant une ennemie de MÊME MASSE — n'est couvert par aucun autre.

**④ « L'invariant devrait tenir par construction, […] l'écrasement tuant dans le
même pas » (§8).** L'écrasement ne tue **pas** dans le même pas. C'est la
découverte du lot ; elle a son §9.

### Un cinquième écart, de périmètre

Le brief écrit : « Mon relevé porte sur **huit** fichiers de test du moteur ».
**Quatorze** sont touchés. S'ajoutent `generateur.test.js`, `recherche.test.js`,
`journal.test.js`, `mur.test.js`, `arsenal.test.js`, `assaut.test.js`,
`cible.test.js`, `roster.test.js`, `bases.test.js` et les deux témoins.

---

## 3. Les ancres, extraites du fichier APRÈS patch

Comptées **commentaires ôtés**, par un motif borné en Unicode.

| nom | avant | après | |
|---|---:|---:|---|
| `chevauchementInterditSur` | 3 | **0** | remplacée, jamais doublée |
| `bloqueuseSur` | 0 | **2** | déclaration + son unique lecteur |
| `margeDeContact` | 0 | **3** | déclaration + `avancer` + `seDecaler` |
| `AXE_RANGEE` / `AXE_COLONNE` | 0 | **2** / **2** | déclaration + son appel |
| `bloqueeAuContact` | 0 | **2** | déclaration + `progresse` |
| `milliDepuisCase` | 7 | **5** | les DEUX rangements partent |
| `peutEcraser` | 4 | **5** | +1, dans `bloqueuseSur` |
| `peutAvancer` | 2 | **2** | intacte |
| `allieeDevant` | 2 | **2** | **intacte — §5 l'exige** |

`src/sim/combat.js` passe de 172 766 à **176 259 octets**. Les cinq
`milliDepuisCase` restants sont l'import, les deux du littéral d'entité
(la POSE initiale) et les deux du **débarquement** — une pose, pas un rangement.

### Deux écarts au code du brief, déclarés

**① L'arithmétique est simplifiée.** Le brief écrit
`borne = mo − sens × MILLI_PAR_CASE` puis `marge = max(0, sens × (borne − m))`.
`sens × sens` valant 1 pour les deux sens, les deux formes rendent le **même
entier** ; celle du dépôt dit ce qu'elle mesure — *l'écart signé, moins une
case* : `max(0, sens × (mo − m) − MILLI_PAR_CASE)`.

**② Le paramètre `axe` n'est pas une chaîne.** Le brief le passe en `'rangee'` /
`'colonne'` et compare à chaque appel. Deux constantes de module,
`AXE_RANGEE` et `AXE_COLONNE`, portent `{ dRangee, dColonne, milliDe }` : le
chemin chaud — deux appels par entité par tick — n'alloue rien, et aucun
`axe === 'rangee'` n'existe dans le moteur.

---

## 4. Les cinq tests du dépôt, un par un

| test | avant | après | ce que l'assertion mesure désormais |
|---|---:|---:|---|
| `ARRÊT T7` | `5060` | **`5000`** | l'ÉCART au mur vaut `MILLI_PAR_CASE`. Le `% MILLI_PAR_CASE === 0` cède la place : le mur étant sur un multiple exact, il était vrai des deux côtés. **La fenêtre `bloques = 16` et le tick 35 ne bougent pas** — contre le brief. |
| `BR T1` | `17000` | **`17960`** | l'écart au contact, plus le multiple. Son message disait « CHEVAUCHEMENT : B a fini par fluer » : B ne flue plus, il **colle**. Le multiple exact n'était plus la preuve de rien. |
| `T4` (`repli.test.js`) | `17000` | **`17060`** | idem, plus `bloque.rangeeMilli > 17 × 1000` — B **a progressé** au lieu d'être reculé. Le gel du compteur, qui est ce que ce test existe pour tenir, est vérifié inchangé. Et la reprise part de `18 050`, non de `17 090` : B repart de là où il était, pas du début de sa case. |
| `T7 b` (`combat.test.js`) | `2000` | **`2000`** | la valeur ne bouge pas (voir §2 ③) ; l'assertion gagne `ecart() === MILLI_PAR_CASE` au départ ET à l'arrivée, ce que le titre « aucune n'avance » supposait sans le dire. |
| `T6` (`repli.test.js`) | 509 ticks | **501** | empreinte, pas invariant. Huit ticks de moins : les unités ne perdent plus une case de vide derrière chaque bloqueuse. **Le butin passe de 1 541/513 à 6 471/2 157, ×4,2, et les survivants de 3 à 4** — le brief ne l'annonçait pas. Ce que le test tient — au moins une unité rentre, moins de 900 ticks — ne bouge pas. |

**Aucune assertion n'a été retirée ni assouplie.** Cinq sont **RETOURNÉES** — le
multiple cède la place à l'écart — et chacune écrit le nombre d'avant à côté de
celui d'après.

### Neuf autres, que le brief ne connaissait pas

`generateur.test.js T12` (§8 ci-dessous), `NEUT T3` et `MODULES-F T14`
(`recherche.test.js`), `JOURNAL T1`, `T1 bis` et `T8` (`journal.test.js`),
`MUR T4`, `T5`, `T6`, `T6 bis`, plus les réancrages d'empreinte de
`arsenal.test.js`, `assaut.test.js`, `cible.test.js`, `roster.test.js` et
`bases.test.js`.

**`generateur.test.js T12`** bascule pour la **quatrième** fois, et l'écart reste
d'une unité : `ecartMax` 0 → **1**, sur **UNE cellule des 500** — colonne `camp`,
graine 37, montage `mixte/17`, niveau 2, 675 contre 674 —, médiane **0**, écart
relatif maximal **0,148 %** (MUR mesurait 0,173 %), `entitesQuiBasculent`
toujours **0**. Une contre-assertion `notEqual(ecartMax, 0)` refuse le retour du
zéro : un miroir qui cesserait d'échantillonner l'arrondi repasserait au vert
**sans rien garder**.

**`NEUT T3` et `MODULES-F T14` ont perdu leur PRÉMISSE — c'est le montage qu'on
répare, jamais l'assertion.** Le premier oppose une défenseuse neutralisée à une
défenseuse libre ; la libre fluait jusqu'à **4 960** et s'arrête désormais au
**contact, 4 000**. Le montage RELÈVE le contact (`colonneMilli` de la cible
moins une case) au lieu de l'écrire, et une assertion exige que la gelée —
mesurée à **3 560** — soit STRICTEMENT en deçà : sans elle, le test cesserait de
distinguer la neutralisation de l'arrêt au contact. Le second balayait les
graines `[7, 9, 24]` ; la **9** s'inverse au niveau 50 — canal armé **59,09 G**
contre **56,13 G** à vide —, et un balayage de 1 à 60 rend **dix** graines qui
tiennent les trois niveaux (7, 18, 24, 33, 36, 39, 51, 52, 56, 57). Elle passe à
**18**. **Sixième fois que ce montage-là perd sa prémisse.**

---

## 5. Les témoins — deux couches, jamais une recapture

### `test/temoins-combat.js`

| | mesuré | annoncé par le brief |
|---|---:|---:|
| `COMBATS_DEPLACES_PAR_CONTACT` | **1 086** champs sur 1 600 | 1 086 ✔ |
| dont NEUFS (jamais surchargés avant) | **36** | — |
| union avec les couches antérieures | **1 125 surchargés / 475 gardés** | 1 086 / **514** ✘ |
| causes de fin déplacées | **5** | — |
| combats entièrement intacts | **0** | — |

Le « 514 » est `1 600 − 1 086`. Il ignore que 1 050 des 1 086 champs étaient
**déjà** couverts par une couche antérieure, si bien que la couche CONTACT
n'ajoute que 36 champs à l'union. **475 est le nombre qui reste adossé à la
capture d'APPROCHE.**

### `JOURNAL T1 bis` — sa propre couche, et c'est elle qui attribue le lot

`COMBATS_DEPLACES_PAR_CONTACT_AVANT_PAQUETS` porte **1 051 champs déplacés**, et
l'union passe de **1 333 à 1 334 surchargés / 266 gardés** : **UN SEUL champ
neuf**. Moins encore que les deux de BARÈME-ET-REJEU.

C'est l'invariance de `T1 bis` qui dit ce que le lot touche : **le même axe
qu'ARRÊT, COLONNE, MUR et BARÈME-ET-REJEU — la FILE**, et ni le tir ni le
ciblage, qui auraient brisé les causes qui tiennent encore.

**Une recapture serait illégitime ici quel que soit le compte** : elle ne
s'autorise qu'APRÈS que `T1 bis` ait prouvé le MOTEUR inchangé, et c'est très
exactement le moteur que ce lot change. On empile.

### `test/temoins-bases-0.js` — vingt-quatrième couche

`DEPLACES_PAR_CONTACT` : **36 couples sur 350**, six champs, phases **p07 à
p14**. **Les six premières phases sont identiques AU BIT** — rien ne combat avant
le premier raid — et **aucun scalaire ne bouge**, la taille de la sauvegarde
comprise.

Trois tables de rapport, toutes **CREUSES** — la forme du lot MUR, pas celle de
REJEU : `EMPREINTES_PAR_GRAINE_CONTACT` **23/25** (les graines **9** et **18**
sont identiques au bit), `RAPPORTS_PROCHE_CONTACT` **20/25**,
`RAPPORTS_OUVRAGE_CONTACT` **16/25**. C'est juste : ce qui bouge est le DÉROULÉ
d'un combat, et il ne mord que là où une pièce en bloquait une autre.

⚠⚠ **ET UNE ERREUR DE CLÉ A FAILLI FAIRE ÉCRIRE 25/25.** Le dépouillement lisait
`x['raidProcheRapport']` quand la boucle du témoin range sous
`x['p07_raidProcheRapport']` : `JSON.stringify(undefined)` rend la chaîne
`undefined`, donc **un seul et même hachage — `eb045d78d2731073` — répété
vingt-cinq fois**. C'est la RÉPÉTITION qui l'a dit, pas la relecture. Les deux
tables et la prose de `bases.test.js` sont réécrites sur les nombres mesurés.

---

## 6. `JOURNAL T8` — compris avant d'être réparé

Le §7 du brief : « **Réparer d'abord et expliquer ensuite, c'est masquer.** »

Le test comptait **TROIS** écrasées ; il en compte **DEUX**.

**Celle qui disparaît est le Guetteur d'indice 24.** Mesuré tick par tick sur
les deux arbres :

| | arbre d'avant | arbre du lot |
|---|---|---|
| colonne du Guetteur 24 | flue jusqu'à **3 360** (case 3) | s'immobilise à **4 000** exactement |
| ticks 200 → 217 | dans la case 3 | dans la case 4 |
| écrasement | **tick 216**, par l'attaquant qui monte la colonne 3 | **jamais** — l'attaquant traverse la colonne 3 sans l'y trouver |

Le fluage l'amenait dans une colonne qui n'était pas la sienne, et il s'y faisait
écraser. Le contact l'y empêche : il reste dans sa case, hors du chemin.

⚠ **La Carapace qui MESURE l'exception — l'écrasement que ce test existe pour
tenir, indice 79 — est identique AU BIT** : tick 64, rangée 3 780, colonne 2 000.
L'assertion **nomme désormais les deux indices** (`deepEqual([28, 79])`) au lieu
de compter : un écrasement qui s'échangerait contre un autre ne bougerait pas un
compte, et passerait.

---

## 7. `MUR T4`, `MUR T5`, `MUR T6`, `MUR T6 bis`

Le brief avertissait : « **`MUR T6 bis` et `MUR T4` restent verts, et c'est un
piège.** […] Ces deux tests ne mesurent plus leur règle. »

### `MUR T4` — RATTACHÉ, et il discrimine

Son suiveur partait de la **rangée 2**, collé à son alliée : marge nulle dès le
premier tick, donc il ne bougeait jamais et `% MILLI_PAR_CASE === 0` était vrai
par accident de montage. Il part désormais de la **rangée 1** — il a une case à
parcourir — et le test vérifie **à chaque tick sur 60** que
`devant.rangeeMilli − derriere.rangeeMilli >= MILLI_PAR_CASE`.

**Vu rouge sur l'arbre intact** :
`tick 17 : la seconde est entrée dans la case de son alliée (2020 contre 3000)`.
L'ancien moteur fait `1960 → 2020 (t17) → 2000 (t18)` ; le nouveau `1960 → 2000
(t17)` et s'y tient. L'assertion finale est l'ÉGALITÉ de l'écart à
`MILLI_PAR_CASE`, plus `derriere.rangeeMilli > departDerriere` — il a **avancé**.

### `MUR T5` — RATTACHÉ, et il discrimine

Titre corrigé : « dès le tick où il **bute au contact** » — plus rien ne se range.
Son `% MILLI_PAR_CASE === 0` était vrai **des deux côtés**, le Merlon étant posé
sur une case pleine, donc le contact tombant sur un multiple. Il cède la place à
l'écart au mur, vérifié **à chaque tick**.

**Vu rouge sur l'arbre intact** :
`tick 56 : le porteur est entré dans la case du mur (5040 contre 6000)`.

⚠ Et `ecartAuRangement` devient `ecartAuContact`, **40 000 → 20 000**, asserté
au pas EXACT et non plus par `> 0` : l'ancien moteur consommait un tick de PLUS
à défaire son chevauchement (5 040 → 5 000), donc la boucle y comptait **deux**
ticks de forçage au lieu d'un. Sans cette égalité, ce nombre-là cesserait d'être
gardé.

### `MUR T6` et `MUR T6 bis` — DÉCLARÉS INERTES, avec la raison mesurée

**Ils ne distinguent pas ce lot du lot MUR, et on ne peut pas les y amener.**
Mesuré : **latéralement, les deux règles rendent la MÊME position à CHAQUE
tick**, sur 80 ticks.

La raison est arithmétique, et elle a deux moitiés :

1. le rangement collait au **début de case**, qui **EST** le contact dès que le
   bloqueur est posé sur un multiple — et toute pièce immobile l'est ;
2. le pas latéral de la Meute vaut **40**, qui **divise 1 000** : partant d'un
   multiple, elle ne peut jamais dépasser le contact, donc il n'y a jamais rien
   à défaire.

Le roster a été balayé pour une unité de garnison dont le pas latéral ne divise
pas 1 000 — `ratisseur` 80, `fendeur` et `broyeur` 60, `belier` 80 : la position
finale coïncide de toute façon.

Les deux gardent leur règle — ils n'ont pas été affaiblis — et gagnent une
vérification d'écart **par tick** plus un pavé ⚠⚠ qui **dit** qu'ils sont inertes
pour ce lot-ci, et renvoie à `MUR T4` (tick 17) et à `test/contact.test.js`.

---

## 8. `CONTACT T1` et `CONTACT T2` — vus rouges, puis verts

Les deux ont été **écrits, puis joués sur l'arbre pristine AVANT d'être joués
sur celui du lot**.

### Rouges sur l'arbre intact

```
not ok 1 - CONTACT T1 — aucune entité ne franchit plus que son pas nominal en un tick
  error: 'convergence (§1), tick 27 : ratisseur a sauté de 920 millièmes
          en colonne (6920 → 6000), son pas vaut 80'
not ok 2 - CONTACT T2 — deux bloquantes actives ne se recouvrent jamais…
  error: 'convergence (§1), tick 84 : ratisseur et meute se recouvrent
          (Δrangée 960, Δcolonne 0)'
```

**920 contre 80, au tick 27** : le nombre du §1 du brief, au millième.

### Verts sur l'arbre du lot

```
ok 1 - CONTACT T1 — aucune entité ne franchit plus que son pas nominal en un tick
ok 2 - CONTACT T2 — deux bloquantes actives ne se recouvrent jamais, hors deux
       familles nommées et comptées
```

### Ce que les montages garantissent avant de mesurer

- **Le Booster est interdit nommément**, et pas « toutes les listes vides » :
  son ×10 porterait la borne de l'Éclaireur de 240 à **2 400**, et le saut de 920
  y passerait sans être vu. Une garde « listes vides » aurait paru plus stricte et
  aurait **refusé les quatre raids réels** — `genererSite` arme `ouvrage.defense`
  depuis le lot MODULES-F, avec cinq modules dont aucun n'est le Booster.
- **Les bornes sont LUES dans la table** : `UNITES[id].vitesse` à la verticale,
  `floor(vitesse × GRILLE.lateral.numerateur / .denominateur)` à l'horizontale.
  Une défense ou un bâtiment rend **zéro** — la plus forte des bornes.
- **On ne compare que les entités actives aux DEUX ticks.** Une entité qui
  apparaît — une vague qui entre, une passagère qui débarque — est **POSÉE**, pas
  déplacée : mesurer un « pas » entre l'absence et une position n'aurait aucun
  sens. C'est la seule exemption du test, et elle est écrite.
- **Deux planchers de falsifiabilité** : plus de 2 000 ticks joués, et un pas
  maximal strictement positif — sans eux, un moteur qui ne bougerait plus
  personne passerait le test la tête haute. `T2` en a un troisième : plus de
  100 000 paires comparées (mesuré : **1 981 774**).

### Écart au brief, déclaré

Le §8 demande `obstacles: []` « pour que le pas soit exactement la vitesse de la
table ». Les **quatre raids réels** en portent. L'assertion étant une
**INÉGALITÉ** et `vitesseSousObstacle` **divisant**, un obstacle ne peut que
rendre la borne plus large que le pas réel, jamais plus étroite. Les retirer d'un
site généré en ferait un autre site, et le lot perdrait les quatre seuls montages
où les quatorze pièces courent ensemble. Les **trois montages du brief**, eux,
ont `obstacles: []` et l'assertion le vérifie.

---

## 9. La découverte : deux familles de chevauchement restent

Le §8 du brief : « **SI T2 TOMBE SUR UN MONTAGE POUR UNE AUTRE RAISON QUE LE
RANGEMENT OU LE FLUAGE, NE PAS L'AFFAIBLIR — L'ÉCRIRE.** […] c'est une découverte
du lot, elle va dans le rapport, et l'arbitrage revient à Ethan. »

Il posait que l'invariant « devrait tenir par construction, les pièces étant
posées sur des multiples exacts et **l'écrasement tuant dans le même pas** ».
**L'écrasement ne tue pas dans le même pas, et ce n'est pas tout.**

Mesuré sur les quatre raids réels, **1 981 774 paires comparées**, arbre d'avant
contre arbre d'après :

| famille | AVANT | APRÈS |
|---|---:|---:|
| **A** — l'écrasement différé | 144 | **69** |
| **B** — le croisement à cheval sur deux index | 591 | **22** |
| **TOTAL** | **735** | **91** (−87,6 %) |

**Les deux familles sont ANTÉRIEURES au lot.** Il en retire 87,6 %.

### A — l'écrasement différé (69)

`bloqueuseSur` rend `null` sur une occupante **écrasable** — c'est le §3 du brief
mot pour mot, « sinon l'écrasement meurt en silence » — donc la marge de
l'écraseuse est **infinie** et elle entre dans le pavé de sa victime. Mais
`avancer` ne **TUE** qu'au franchissement de l'**INDEX** de case : entre les deux,
les deux pavés se recouvrent pendant plusieurs ticks.

Relevé : `camp/n5/g1`, un **Bélier à 9 048** sous une **Meute à 10 000**,
Δ = 952, **sur huit ticks**.

**Fermer cette famille demanderait d'écraser au CONTACT et non au franchissement,
c'est-à-dire de déplacer l'instant de la mort.** C'est une règle de jeu, et le §9
du brief met l'Écraseur hors lot. **Ethan tranche.**

### B — le croisement à cheval sur deux index (22)

Les deux axes se scannent **SÉPARÉMENT**, chacun sur son propre index de case :
`avancer` regarde les rangées devant **dans sa colonne**, `seDecaler` les
colonnes à côté **dans sa rangée**. Une entité à une position fractionnaire est à
cheval sur **deux** index de son axe, et l'autre ne scanne pas celui-là.

Relevé : `avantPoste/n20/g2`, une **Meute décalée en colonne 1 720** (index 1) et
une **Carapace montée en rangée 7 020** (index 7), **masses ÉGALES** donc aucun
écrasement — chacune est hors de l'index que l'autre inspecte.

Les 22 qui restent sont **tous dans `avantPoste/n20/g2`** ; les trois autres
raids en rendent **zéro**. Le fermer demande quatre cases balayées par axe au
lieu de deux, donc un **changement de coût du tick**. **Ethan tranche.**

### Et `CONTACT T2` ne se desserre pas pour autant

C'est l'idiome de `DETTES_ACCENT` — *asserter la dette ENCORE violée* :

- les **trois montages du brief** sont tenus en **ABSOLU**, sans une exception ;
- sur les quatre raids réels, les deux familles sont **NOMMÉES**, leurs comptes
  **EXACTS** — 69 et 22, plus la répartition par montage —, et chacune porte une
  caractérisation **POSITIVE** qui peut tomber ;
- pour **B** : « au moins une des quatre coordonnées n'est pas un multiple de
  `MILLI_PAR_CASE` ». **Mesuré à zéro contre-exemple sur 22.** Deux bloquantes qui
  se recouvriraient sur des multiples exacts violeraient la carte d'occupation
  elle-même — c'est une **troisième** famille, et elle tomberait par son nom.

**Le jour où l'une des deux se ferme, ce test tombe : c'est ce qu'on lui
demande.**

---

## 10. `SAVE_VERSION` — démontré, pas supposé

- `src/sim/state.js` **n'apparaît pas au diff** (`git diff --stat` vide).
- `SAVE_VERSION` vaut **33**, avant comme après.
- Une partie neuve se sérialise en **1 212 octets** sous `"version":33`, se
  recharge, et **se re-sérialise identique à l'octet**.

La raison de fond : `rangeeMilli` et `colonneMilli` portaient **déjà** des
valeurs non multiples de `MILLI_PAR_CASE` — c'est tout le sujet du lot. Le
rangement n'était pas un champ, c'était une écriture ; la retirer n'ôte rien de
l'état.

---

## 11. Relecture hostile

**Ce que le brief a raté**, et qui est corrigé ici : les quatre nombres du §2,
l'étendue du relevé (huit fichiers annoncés, quatorze touchés), et surtout
l'hypothèse « l'écrasement tue dans le même pas », qui porte toute la §9.

**Ce qui a été corrigé avant livraison, et qui ne se serait pas vu à la
relecture :**

1. **La clé du dépouillement de bases-0.** Le relevé rendait le **même hachage
   pour les vingt-cinq graines** ; j'allais écrire 25/25 dans deux tables et dans
   la prose de `bases.test.js`. C'est la répétition d'`eb045d78d2731073` qui l'a
   dit. Les vrais nombres sont 20/25 et 16/25.
2. **La première réparation de `MUR T4` était insuffisante.** Remonter le suiveur
   en rangée 1 le faisait voyager, mais le test passait encore sur l'arbre
   pristine : l'ancien rangement ramenait au début de case, qui **est** le
   contact. Il a fallu tracer tick par tick — `1960 → 2020 (t17) → 2000 (t18)` —
   pour trouver que le discriminant est le **pic intermédiaire**, donc une
   vérification **par tick** et non une position finale.
3. **`MUR T6` et `MUR T6 bis` ne peuvent PAS être rattachés**, et je l'ai cherché
   avant de le déclarer : balayage du roster pour un pas latéral qui ne divise
   pas 1 000. Déclarer inerte est plus honnête que fabriquer un montage qui
   *aurait l'air* de discriminer.
4. **La garde du Booster de `CONTACT T1` était trop large au premier jet** —
   « toutes les listes de modules sont vides » — et elle **refusait les quatre
   raids réels** pour une raison sans rapport avec la vitesse. Elle nomme le
   Booster.
5. **Le montage `FILE` levait à la construction** : deux attaquants dans la même
   colonne et la même vague occupent la même case. Ils sont sur deux vagues.

**Ce qui n'a PAS été fait, et se déclare :**

- Le rendu **n'a pas été vu**, ni sur appareil ni dans un navigateur. Tout est
  mesuré sur `rangeeMilli` et `colonneMilli`. **À regarder au premier essai** :
  que les défenseuses viennent se **coller** au lieu de se téléporter, et qu'une
  écraseuse traverse encore le pavé de sa victime pendant quelques ticks avant de
  la tuer — c'est la famille **A**, et elle se **voit**.
- `python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot
  ne touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff.
- **La branche n'est pas celle que le brief nomme.** Il demande
  `claude/contact-pas-borne` ; l'environnement d'exécution épingle la session à
  `claude/new-session-b3ddpp` et interdit de pousser ailleurs sans autorisation
  explicite.
- **Le rapport est dans `rapports/`, pas à la racine** comme le §11 le demande :
  c'est la convention des quatre derniers lots (REJEU, VITESSE, BAREME-ET-REJEU,
  BASES-2), et la §2 de `CLAUDE.md` la porte.

---

**PR ouverte, jamais fusionnée — la fusion appartient à Ethan.**
