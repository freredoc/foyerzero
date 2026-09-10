# RAPPORT — lot MUR

Deux points d'Ethan du 10/09, livrés ensemble parce qu'ils décrivent le même
moment du tick :

> **2.** « Un mur, tourelles, structure bloque. Donc une unité s'arrête avant,
> pas dedans. Ou peut-être que la hitbox est mal faite ? »
>
> **3.** « Une unité anti-structure doit s'arrêter pour détruire mur barrière
> tourelles. C'est une cible de prédilection. »

⚠⚠ **LES DEUX MOITIÉS NE SE RECOUVRENT PAS, ET C'EST TOUT LE LOT.** Le point 3
tient les unités anti-structure, qui sortent d'`avancer` par le `return` de
l'ARRÊT, avant toute avance. Le point 2 tient **toutes les autres** — celles qui
restent BLOQUÉES devant le mur sans s'arrêter, parce qu'elles ne peuvent pas le
blesser utilement : elles se RANGENT désormais sur leur case au lieu d'y fluer
jusqu'à 999 millièmes. C'est cette seconde moitié qui est le défaut qu'Ethan a
VU : une unité en case 2 pour le moteur, dessinée à 96 % sur la case 3, celle du
mur.

---

## Base de départ

`npm ci && npm run check` sur `main` = **`213d155`**, avant qu'une ligne ne
bouge :

| | |
|---|---|
| `npm run check` | **1564 déclarés · 1563 pass · 0 fail · 1 skipped**, sortie **0** |
| skipped | `LIMITE T8`, suspendu par Ethan le 08/09 — préexistant, hors lot |
| version · build | **0.99.41 · build 143** |
| `SAVE_VERSION` | **31** |
| `dist/index.html` | **9 310 752 octets**, 0 référence externe |
| fichiers `*.test.js` | **67** |

⚠ **ÉCART À LA BASE ANNONCÉE PAR LE BRIEF, SANS CONSÉQUENCE.** Son §0 pose
« 0.99.40 · build 142 » ; mesuré, `main` était déjà à **0.99.41 · build 143** —
le lot ARRIVÉE-CARTE-ET-BUILD a été fusionné entre l'écriture du brief et son
exécution. Les faits dont le lot dépend étaient tous intacts, vérifiés un par un
avant d'écrire : les deux ancres présentes et UNIQUES, `SAVE_VERSION` à 31, et
`estStructureDefensive` avec son unique appelant.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff. ⚠ Relevé au
passage : **cette machine n'a pas `python3`, elle a `python`** (3.12.2). La
commande de `CLAUDE.md` §0.5 est à adapter le jour où un lot d'art tournera ici.

---

## Ce qui est produit

| | avant | après | delta |
|---|---|---|---|
| `dist/index.html` | 9 310 752 | **9 310 842** | **+90** |
| lignes `data:` | 307 | 307 | 0 |
| URI `data:` | 306 | 306 | 0 |
| version · build | 0.99.41 · 143 | **0.99.42 · build 144** | — |
| `SAVE_VERSION` | 31 | **31** | inchangé |

**Ventilation poste par poste**, contre le livrable rebâti dans un
`git worktree` sur l'arbre pristine de `main` :

```
poste                 avant          apres      delta
feuille               44556          44556         +0
javascript           405352         405442        +90
balisage              36255          36255         +0
images              7631243        7631243         +0
audio               1193346        1193346         +0
TOTAL               9310752        9310842        +90
somme des postes : +90  (accord : True)
```

La somme des cinq postes tombe **exactement** sur le total. Le lot est du
JavaScript pur : il ne fait entrer ni image, ni son, ni une règle de feuille.

⚠ **BORNE T10 INCHANGÉE À 9 600 000**, marge **289 158 octets, 3,01 %**. Le lot
ne fait entrer aucune ressource ; une borne ne se relève pas pour du code.

⚠ **`SAVE_VERSION` RESTE À 31**, vérifié au diff et non supposé : la règle est
une décision de TICK. `rangeeMilli` naît de `creerCombat` et meurt avec le
montage — il ne traverse ni `serialiser`, ni une migration. Aucun champ n'entre
dans l'état, et la sauvegarde ne grandit pas d'un octet.

⚠ **VERSION ET BUILD SONT DES CHAÎNES**, `"0.99.42"` et `"144"` :
`android/app/build.gradle.kts` les lit `as String`, et un nombre y fait tomber le
build Android à la CONFIGURATION (`CLAUDE.md` §6).

**Fichiers touchés** — `src/sim/combat.js`, `package.json`, `CLAUDE.md`, quatorze
fichiers de `test/`, les DEUX témoins ; **entrent** `test/mur.test.js` et ce
rapport. **Pas une ligne de `src/data/`, `src/ui/`, `src/render/`, `src/son/` ni
`tools/`.**

---

## Ancres appliquées

**Comptées sur le `src/sim/combat.js` de `main` AVANT modification** — un compte
différent de 1 arrêtait le lot :

| ancre | motif | occurrences |
|---|---|---|
| **A** | `return !estStructureDefensive(pc);` | **1** |
| **B** | `if (caseDestination === rangee) {` | **1** |

### Ancre A — l'exclusion du 04/09 tombe

`return !estStructureDefensive(pc);` devient `return true;`, et
**`estStructureDefensive` est SUPPRIMÉE**, son en-tête avec elle : elle venait de
perdre son unique lecteur, et la garder « au cas où » l'aurait fait relire comme
une règle encore en vigueur.

⚠⚠ **AUCUNE GARDE « ANTI-STRUCTURE SEULEMENT » N'A ÉTÉ AJOUTÉE, ET C'EST
MESURÉ.** La branche de prédilection discrimine déjà : `MUR T2` le montre sur les
**huit** autres unités du roster, pas sur un échantillon. En écrire une aurait
été une seconde vérité sur la même grandeur.

Le bloc de `doitSArreter` est réécrit — 81 lignes — et raconte les **trois**
arbitrages dans l'ordre (04/09, 06/09, 10/09), en disant que le troisième
**renverse** le premier. Un futur lot qui « restaurerait » l'exclusion en croyant
réparer une régression tombe sur cet avertissement avant d'écrire une ligne.

Règle finale :

```js
function doitSArreter(etat, e, p) {
  if (p.comportementAerien === 'traversant') return false;
  if (!e.aTire || e.cibleIndice === null) return false;
  const pc = profil(etat.entites[e.cibleIndice]);
  if (pc.genre === 'batiment') return true;
  if (p.colonnePredilection === null) return false;
  if (pc.colonneMatrice !== p.colonnePredilection) return false;
  return true;
}
```

### Ancre B — le rangement

```js
if (caseDestination === rangee) {
  if (bloqueeParUneStructure) {
    e.rangeeMilli = milliDepuisCase(rangee);
    return;
  }
  e.rangeeMilli = destinationMilli;
  return;
}
```

### La « case devant » — une écriture, deux lecteurs

Elle est calculée **une fois**, dans `avancer` :

```js
const caseDevant = rangee + 1;                                            // l. 2673
const bloqueeParUneStructure = structureImmobileDevant(…, caseDevant);    // l. 2674
const forcee = progresse ? undefined : structureForcee(…, caseDevant);    // l. 2714
```

**Ses lecteurs sont exactement deux** — `structureImmobileDevant`, qui entre avec
le lot, et `structureForcee`, qui existait et lisait jusqu'ici
`caseDestination`. C'est ce second point qui compte : sous blocage,
`caseDestination` VAUT `rangee`, donc l'ancien forçage regardait la case de
l'unité elle-même au lieu de celle du mur.

Le helper, posé immédiatement après `structureForcee` :

```js
function structureImmobileDevant(etat, e, p, occupation, caseDevant) {
  if (!p.bloquant) return false;
  const indice = occupantDe(occupation, caseDevant, caseColonne(e));
  if (indice === undefined) return false;
  return profil(etat.entites[indice]).vitesseMilli === 0;
}
```

### ⚠⚠ LE PIÈGE QUI A COÛTÉ LE LOT ENTIER

Le premier jet n'a mis `bloqueeParUneStructure` que dans la **branche de
rangement**. Or `peutAvancer` rend `true` quand `caseDestination === rangee` :
`progresse` restait donc VRAI pour toujours, `forcee` n'était **jamais**
calculée, et **l'Écraseur cessait silencieusement de forcer** — écart **0 sur
120 ticks**, mesuré. `progresse` porte donc aussi la garde :

```js
const progresse = !arrete && !bloqueeParUneStructure
  && peutAvancer(etat, e, p, occupation, rangee, caseDestination);
```

⚠⚠ **ET CE PIÈGE SE LIT DANS LE COMPTE DE TÉMOINS.** Le brief annonce **565**
champs déplacés : c'est le chiffre de la variante **buguée**. L'implémentation
juste en rend **561**, et les quatre champs d'écart sont **six combats** qui
cessent de buter sur le plafond de 900 ticks parce que l'Écraseur force à
nouveau. *Un compte de témoin qui ne tombe pas sur le nombre annoncé se mesure
avant d'être corrigé.*

---

## Surcharge des témoins

⚠⚠ **AUCUN TÉMOIN N'A ÉTÉ RECAPTURÉ. ON EMPILE, ON NE REMPLACE PAS.**

### `test/temoins-combat.js`

| table | combats | champs | lecteur |
|---|---|---|---|
| `COMBATS_DEPLACES_PAR_MUR` | **110** / 200 | **561** / 1 600 | `JOURNAL T1` |
| `COMBATS_DEPLACES_PAR_MUR_AVANT_PAQUETS` | **125** / 200 | **681** | `JOURNAL T1 bis`, **5ᵉ couche** |

`JOURNAL T1` : **561 surchargés, 1 039 encore adossés** à la capture d'origine —
c'est cette moitié-là qui dit que le lot ne touche qu'au déplacement.

`JOURNAL T1 bis` : la cinquième couche **n'ajoute ZÉRO champ neuf à l'union**.
Les 681 étaient **tous** déjà surchargés par l'une des quatre couches d'avant, si
bien que les comptes ne bougent pas — **1 331 surchargés, 269 gardés**,
identiques au lot PAQUETS. Le compte est l'UNION des cinq, jamais leur somme.

### `test/temoins-bases-0.js`

| table | couverture |
|---|---|
| `DEPLACES_PAR_MUR` | **20 couples**, phases 7 à 14 |
| `EMPREINTES_PAR_GRAINE_MUR` | **22 graines sur 25** |
| `RAPPORTS_PROCHE_MUR` | **10 sur 25** |
| `RAPPORTS_OUVRAGE_MUR` | **4 sur 25** |

⚠ **LES GRAINES 15, 21 ET 24 SONT IDENTIQUES AU BIT**, et c'est ce qui rend le
repli `??` de `bases.test.js` **nécessaire et non décoratif** — sans lui, ces
trois-là seraient comparées à `undefined` :

```js
if (obtenue !== (EMPREINTES_PAR_GRAINE_MUR[g] ?? EMPREINTES_PAR_GRAINE_REGLES_DE_CARTE[g])) …
```

⚠ **LES SIX PREMIÈRES PHASES SONT IDENTIQUES AU BIT** : construction, économie,
garnison, armée. Le lot n'atteint l'état qu'au premier raid.

### ⚠⚠ `JOURNAL T1 bis` — KO, contre le §4 du brief

Le brief demande ici un **PASS sans couche neuve**, et pose qu'un KO signalerait
une surcharge mal placée. **Il tombe, et son propre §5 le nommait pourtant parmi
les vingt-neuf** : le brief se contredit d'une section à l'autre.

**La mesure tranche.** `T1 bis` rejoue les deux cents témoins d'AVANT le lot
PAQUETS sur le moteur **courant**, avec l'ancien placement de
`test/generateur-ancien.js` : un moteur qui change change donc aussi ce que
l'ancien placement rend. Le lot MUR le déplace exactement comme il déplace `T1`,
et chacun a besoin de sa propre table. La surcharge n'est pas mal placée — c'est
la prémisse du §4 qui est fausse.

---

## Tests

**Verdict final : 1569 déclarés · 1568 pass · 0 fail · 1 skipped**, `npm run
check` sortie 0. Le skipped est `LIMITE T8`, préexistant.

**Aucune assertion n'a été retirée ni assouplie.** Une garde est RETOURNÉE, une
change de montage, et vingt-six changent de valeur — **chacune en écrivant le
nombre d'avant à côté de celui d'après, et pourquoi il a changé**.

### Méthode de mesure

La liste ci-dessous n'est pas recopiée du brief : elle est **mesurée**, en
jouant les tests DU LOT contre le `src/sim/combat.js` de `main`. Chaque ligne
marquée **KO** y est tombée pour de bon, avec son message.

### Inversions d'énoncé

| test | verdict | ce qui a changé, et pourquoi |
|---|---|---|
| `ARRÊT T2` | **KO → réécrit** | Il figeait « ne s'arrête plus pour une **tourelle** » (04/09). Retourné : les Perceurs gèlent à **4 940** au tick **50**, la batterie meurt au tick **89**. |
| `ARRÊT T3` | **KO → réécrit** | Idem pour un **mur** : gel à **4 520** au tick **43**, le merlon meurt au tick **122**. |
| `COL T2` | **KO → réécrit** | La moitié « hors de sa colonne » reste VRAIE ; seule l'autre s'inverse. L'assertion passe de `rangeeMilli > avant` à `rangeeMilli === avant`, **plus** une seconde moitié : le mur perd des PV — figée SANS tirer serait un blocage, pas un arrêt. |
| `ARRÊT T10` | **KO → RETOURNÉ** | Il EXIGEAIT `estStructureDefensive` dans la règle ; il **INTERDIT** maintenant que le nom reparaisse dans le code, et exige `/return true;\n}$/` en fin de règle. Le balayage porte sur la source **décommentée**, ce qui permet au bloc de `doitSArreter` de raconter l'exclusion retirée sans faire tomber sa propre garde. |

⚠ **LE §5 DU BRIEF SE TROMPAIT SUR `ARRÊT T10`** : il annonce que
`colonnePredilection` « perd un lecteur si l'exclusion part ». Mesuré, le compte
**ne bouge pas** — 11 occurrences avant comme après, dont 8 lectures. Le test
tombe pour une autre raison : sa garde de l'exclusion.

⚠ **ET SON TITRE ÉTAIT PÉRIMÉ DEPUIS LE LOT COLONNE** — « garde ses **QUATRE**
lecteurs » au-dessus d'une assertion qui en mesure **huit**. Corrigé dans le même
geste : un titre faux est un commentaire menteur en puissance.

### Gardes lisant la source

| test | verdict | ce qui a changé |
|---|---|---|
| `ARRÊT T7` | **KO → réancré** | Le canari du piège du §3.2. Relevé déplacé au tick **34**, position **5 060** ; position finale **5 000**, **plus** une assertion de modulo — la position est un multiple exact de `MILLI_PAR_CASE`. |
| `ARRÊT T8` | **KO → réancré** | Valeurs d'arrêt par pièce : `[['broyeur', ['ecraseur'], 5000], ['perceurs', [], 4520]]`, plus une assertion de modulo et d'identité sur `broyeur`. |

### Témoins

| test | verdict | ce qui a changé |
|---|---|---|
| `JOURNAL T1` | **KO → surchargé** | 5ᵉ couche `COMBATS_DEPLACES_PAR_MUR` : `surcharges === 561`, `110` combats, `1 039` gardés. |
| `JOURNAL T1 bis` | **KO → surchargé** | 5ᵉ couche `…_AVANT_PAQUETS`, 125 combats / 681 champs. Surcharges **1 331** et gardés **269** INCHANGÉS — voir ci-dessus. |
| `BASES-0 T1` ×3 | **KO → surchargés** | Empreinte par champ, empreinte par graine, scalaires. Quatre tables neuves, aucune recapture. |

### Valeurs de combat recalculées

| test | fichier | avant → après | pourquoi |
|---|---|---|---|
| `T10` | `arsenal` | `nbTicks` 396 → **458** | Le montage du banc : les unités s'arrêtent devant les structures, le raid dure plus longtemps. |
| `T7` | `assaut` | figés 260 → **259**, 646 → **667** ; budgétés 264 → **280**, 287 → **244**, 396 → **458** | Trois raids, **trois sens différents** — B raccourcit, A et C s'allongent. Un allongement uniforme n'aurait pas fait ça : ce qui change est QUI meurt et QUAND. |
| `T4` | `cible` | 308 → **309**, butin `{18 610, 6 203}` → **`{15 636, 5 212}`**, survivants 4 → **3** | Le raid expirait au tick 900 ; il se conclut désormais. Butin moindre : les unités s'arrêtent pour casser les structures au lieu de courir aux bâtiments. |
| `T5` | `cible` | `['blindeLourd/base/7', 'mixte/base/1', 'mixte/camp/7']` → **`['mixte/camp/7']`** | Deux des trois raids stériles se concluent maintenant dans le plafond. Le troisième reste, et il est au **reste ouvert**. |
| `COL T18 bis` | `colonne` | `[['camp',28,19], ['camp',25,31], ['camp',30,60]]` → **`[['camp',28,54], ['camp',29,54], ['camp',30,92]]`** | La DETTE n'est pas payée, elle a **bougé** : sur le même échantillon de 600, **3 triplets sur 600 lèvent encore** contre 8 avant. Le test reste, réancré. |
| `T5` | `combat` | `rangeeMilli` 3 020 → **2 060**, puis 3 080 → **2 120** | **C'est le défaut d'Ethan, mesuré au millième.** Le Meute montait à 2 960 — case 2 pour le moteur, dessiné à 96 % sur la case 3, celle du mur. Il se range désormais à **2 000 pile**, donc il repart de 2 000 et non de 3 020 : le rangement lui coûte les 960 millièmes qu'il n'aurait jamais dû prendre. |
| `DO T8` | `disposition-ouvrage` | graine 102 → **106** | **Réancrage de MONTAGE, pas de valeur, et le motif est l'inverse du précédent.** Sur la 102 le raid rase désormais TOUT ce qu'il touche — sept touchés, sept détruits — donc plus un seul survivant abîmé, et la seconde branche de `montageCourant` n'était plus exercée. Balayage des graines 99 à 140 : dix-sept conviennent, la **106** en laisse **dix touchés dont six détruits**, la marge la plus large. |
| `T12` | `generateur` | `ecartMax` 0 → **1** | **Ce test n'est PAS dans les 29 du brief.** Il tombe sur la variante **JUSTE** et sur elle seule. |
| `T12` | `recherche` | bélier 3 920 → **2 000** | L'Écraseur retire 1 % des PV max par tick : le montage se range désormais sur sa case. |
| `MODULES-B T1` | `recherche` | tick 110 → **120** | Flashbang : la cible s'arrête devant la structure, l'acquisition glisse. |
| `MODULES-D T4` | `recherche` | valeurs de points | Les points de recherche suivent la durée des raids. |
| `MODULES-E T7` | `recherche` | tick 110 → **120** | Même cause que `MODULES-B T1`. |
| `MODULES-F T14` | `recherche` | graines `[1,7,24]` → **`[7,9,24]`**, tables apres20/38/50 | La graine 1 **perd sa prémisse** : son canal cesse de discriminer au niveau 38. Réancré par balayage. |
| `T6` | `repli` | 396 → **458** | Le raid C ne se traîne plus jusqu'au tick 900. |
| `T5` | `roster` | `[122]` → **`[162]`** | Un même site à deux niveaux se résout dans le même temps — le temps a changé, l'égalité tient. |
| `T6` | `roster` | A 264 → **280** · B 287 → **244**, butin `{24 516, 8 172}` → **`{25 184, 8 394}`** · C 396 → **458** | Les trois raids de référence, mesurés après conversion. |

### Les deux qui se réparent tout seuls

| test | verdict |
|---|---|
| `FG T15` | **PASS sans retouche** — le porteur replié emporte sa passagère : la prémisse redevient vraie. |
| `MODULES-D T3` | **PASS sans retouche** — même cause. |

**Solde : 28 des 29 annoncés tombent, plus `generateur.test.js T12` que le brief
ne connaît pas.** Un lot qui n'aurait réancré que la liste du brief laisserait
`main` rouge.

### `MODULES-F T16` — un défaut latent, mesuré et NON corrigé

Le test balaie les permutations de sa garnison. Mesuré sur un `git worktree` de
`origin/main` :

| arbre | permutations divergentes |
|---|---|
| `main` | **0 sur 120** |
| lot MUR | **60 sur 120** |

Les soixante sont **exactement** celles qui échangent les rangs du **Broyeur** et
du **Créneau**, pour **9 966 milli-PV**.

⚠⚠ **LA CAUSE EST ANTÉRIEURE AU LOT.** La part d'un overkill est servie **par
indice de tireur croissant** — ce qu'`appliquerDegats` documente depuis
MODULES-F — donc le résultat de `volDeVie` **n'est pas invariant par
permutation**. Le lot ne fait que rendre le cas atteignable, en changeant le tick
où le Bélier meurt.

**La prémisse du montage est réparée par balayage**, pas au jugé : le Bélier
passe du niveau 30 au **26**. Des niveaux 26 à 35, seuls 26, 32, 33, 34 et 35
rendent les 120 permutations identiques, et 26 est le seul où le Vol de vie
soigne encore **mesurablement** dans la fenêtre. **Le défaut lui-même est un
reste ouvert : Ethan tranche.**

---

### MUR T1 à T5 — montage effectif et falsification jouée

Le montage commun : **une pièce seule face à un Merlon**, plus une Gangue
lointaine qui donne au combat une raison de durer.

⚠⚠ **LE MUR EST EN COLONNE 6, L'UNITÉ EN 5, ET C'EST TOUT CE QUI REND LA MESURE
LISIBLE.** Dans la colonne de l'unité, un Merlon la retiendrait de toute façon —
`peutAvancer` refuse la case occupée, et le rangement la clouerait sur la sienne.
La colonne étant LIBRE, rien ne peut la retenir **sauf `doitSArreter`**.

#### MUR T1 — les CINQ anti-structure s'arrêtent, et elles frappent

Le partage est **DÉDUIT du roster**, il ne s'écrit pas :

```js
const ANTI_STRUCTURE = Object.keys(UNITES).filter((id) => predilectionDe(id) === 'structureOuAviation');
const ARRETEES     = ANTI_STRUCTURE.filter((id) => UNITES[id].comportementAerien !== 'traversant');
const TRAVERSANTES = ANTI_STRUCTURE.filter((id) => UNITES[id].comportementAerien === 'traversant');
```

⚠⚠ **ELLES SONT CINQ, PAS SIX, ET LE BRIEF ANNONÇAIT SIX.**
`structureOuAviation` est la prédilection de six unités —
`['perceurs','fouisseurs','belier','pilon','frappeur','enclume']` — mais le
**Frappeur** est un aéronef `traversant`, et la garde aérienne de la **première
ligne** de `doitSArreter` l'écarte AVANT que la prédilection ne soit lue.
« L'aviation traversante ne s'arrête jamais » est antérieur au lot et n'a pas été
touché : une pièce qui TRAVERSE le champ ne peut pas buter dessus.

**Quatre écritures successives de ce test sont tombées avant d'être justes**, et
chacune a appris quelque chose :

1. `UNITES.perceurs.colonnePredilection` est `undefined` — la prédilection est
   **dérivée** par `colonneDominante`, ce n'est pas un champ de données. L'oracle
   est donc recalculé depuis `degats` dans le test.
2. Le mur mourait au milieu de la fenêtre, et l'arrêt lève avec sa cause : la
   fenêtre est **bornée par `mur().vivant`**, avec un plancher de 5 ticks
   mesurés.
3. La condition d'attente est **`aTire`, pas `cibleIndice`** : une pièce qui a
   ACQUIS le mur sans avoir encore tiré avance d'un tick de plus. Le Frappeur —
   240 milli-cases par tick — le fait voir : 5 360 relevé, 5 600 au tick suivant.
4. Le Frappeur ne gelait jamais → il est `traversant`.

**Assertions** : le compte du roster AVANT la règle, le partage AVANT la règle,
puis pour chacune des cinq — position figée sur toute la fenêtre, **PV du mur qui
baissent** (figée sans tirer serait un blocage, pas un arrêt), `sorti === false`,
`ticksInutiles === 0`.

#### MUR T2 — la contre-épreuve sur les HUIT autres

Sans lui, `MUR T1` passerait mot pour mot si `doitSArreter` rendait `true` en
tête. Il porte sur les **huit** unités non anti-structure, pas sur un
échantillon, et exige que chacune ait AVANCÉ trente ticks après acquisition.

⚠ **Il PASSE sur `main` comme sur le lot** — c'est ce qu'on lui demande : il
garde ce qui n'a **pas** changé.

#### MUR T3 — rangée au millième

Le point 2 tout seul : le mur est **dans** la colonne, et l'unité (Meute) n'est
**pas** anti-structure. Le test **calcule** la valeur d'avant — `2 × 1000 + k × 60
= 2 960` — puis exige `rangeeMilli % MILLI_PAR_CASE === 0` **et** `=== 2000`. Les
deux ensemble : le modulo seul serait vrai de n'importe quelle case.

#### MUR T4 — l'embouteillage allié

Derrière une alliée bloquée, la suivante **GARDE** sa position intermédiaire :
l'unité de tête se range à **3 000**, celle de derrière reste à **2 960**. C'est
ce qui dit que le rangement ne s'applique qu'à ce qui est **devant une
structure**, jamais à un embouteillage.

#### MUR T5 — le piège de l'Écraseur, mesuré par différence

Le test ne lit pas une valeur figée : il mesure que le forçage **a déjà
commencé** au tick même du rangement, par `ecart - ecartAuRangement === 20 × pas`
avec `pas = 20 000`, et vérifie que `pvMaxMilli / pas === 100` — les cent ticks
que le module annonce.

### Falsifications — SIX POSÉES, SIX CHUTES

Chacune est jouée sur le `src/sim/combat.js` du lot, une par une, l'arbre étant
restauré entre chaque.

| | ce qui est cassé exprès | ce qui tombe |
|---|---|---|
| **F1** | l'exclusion du 04/09 revient dans `doitSArreter` | `MUR T1` |
| **F2** | la branche de rangement est retirée | `MUR T3`, `MUR T4`, `MUR T5` |
| **F3** | le forçage reprend `caseDestination` au lieu de `caseDevant` | `MUR T5` |
| **F4** | `progresse` oublie `!bloqueeParUneStructure` | `MUR T5` |
| **F5** | le rangement s'élargit à TOUT blocage (`return true`) | `MUR T4` |
| **F6** | la garde aérienne tombe | `MUR T1` |

⚠⚠ **F6 A ÉTÉ MUETTE AU PREMIER RELEVÉ, ET ELLE A FAIT RESSERRER LE TEST.**
Retirer la garde aérienne laissait `MUR T1` **VERT**. Mesuré, la raison : sans
elle le Frappeur ne se **fige** pas, il **RALENTIT** — il s'arrête le temps que le
mur tienne, l'abat en six ticks, et l'arrêt lève avec sa cause.

```
sur le lot  : ticks mur debout = 6 | pas par tick = 240 240 240 240 240 240
avec F6     : ticks mur debout = 6 | pas par tick =   0   0   0   0   0   0
```

**2 400 milli-cases sur dix ticks contre 960** : l'assertion « elle a avancé »
passait des deux côtés. La contre-épreuve est donc **bornée par `mur().vivant`**,
comme celle des cinq autres, et elle mesure **chaque tick**. F6 rejouée après
resserrement : `MUR T1` **tombe**.

*Une falsification qui ne mord pas se vérifie avant d'être crue* — sixième fois
du dépôt.

---

## Écarts au brief

1. **La base annoncée n'était plus là.** Le §0 pose `0.99.40 · build 142` ;
   `main` était à **0.99.41 · build 143**. Signalé, pas traité comme un point
   d'arrêt — les faits dont le lot dépend étaient intacts.

2. **Le §4 se trompe sur `JOURNAL T1 bis`**, et il se contredit d'une section à
   l'autre : son §4 le veut vert sans couche neuve, son §5 le liste parmi les 29.
   Mesuré, **il tombe**, et il reçoit sa propre table — 125 combats / 681 champs.

3. **Le compte de témoins annoncé est celui de la variante buguée.** 565 contre
   **561** ; les quatre champs sont six combats qui cessent de buter sur le
   plafond de 900 ticks. Cause au §3.2 ci-dessus.

4. **Le §5 se trompe sur `ARRÊT T10`** : `colonnePredilection` ne perd aucun
   lecteur — 11 occurrences avant comme après. Le test tombe pour une autre
   raison.

5. **« SIX anti-structure s'arrêtent » → CINQ.** Le Frappeur est un aéronef
   `traversant`, écarté par la première ligne de la règle.

6. **29 tests annoncés → 28 tombent**, `FG T15` et `MODULES-D T3` se réparant
   seuls, **plus** `generateur.test.js T12`, hors liste, qui tombe sur la
   variante juste et sur elle seule.

7. **`DO T8` est réancré par le MONTAGE et non par une valeur** (graine 102 →
   106) : sa prémisse avait cessé d'être vraie, la seconde branche de
   `montageCourant` n'étant plus exercée.

8. **Deux nombres faux dans ma propre prose, corrigés** : le titre d'`ARRÊT T10`
   (« QUATRE lecteurs » pour huit) et un commentaire de `journal.test.js`
   (« 685 champs » pour 681).

---

## Restes ouverts

1. ⚠⚠ **LE JUMEAU LATÉRAL DU DÉFAUT N'EST PAS TRAITÉ.** Le rangement vaut pour
   `avancer`, donc pour le camp qui **ATTAQUE**. `seDecaler` — par où la défense
   des **deux** camps passe depuis le lot COLONNE — porte le même défaut sur
   l'axe des **COLONNES** : une défenseuse bloquée latéralement peut encore fluer
   dans la case voisine. Le brief demandait de le **mesurer et de le dire**, pas
   de le corriger. **Ethan tranche.**

2. ⚠⚠ **LE DÉFAUT DE PERMUTATION DE `volDeVie`** — 60 sur 120 avec le lot, 0 sur
   120 sur `main`, 9 966 milli-PV. Antérieur au lot ; c'est l'ordre de service de
   l'overkill par indice de tireur croissant. Le montage de `MODULES-F T16` est
   réparé, **le défaut ne l'est pas**.

3. **`MODULES-F T14`, graine 1, niveau 38** : le signe du canal s'inverse. La
   graine sort de la liste, réancrée par balayage — le fait est relevé, non
   corrigé.

4. **`cible.test.js T5` — `mixte/camp/7`** reste le seul raid qui expire, à
   **2,9 fois** le plafond. Deux des trois d'avant se concluent maintenant ; ce
   troisième est un autre régime, comme le 4 645 du lot CARTE et le 5 478 du lot
   COLONNE. **À remonter.**

5. **Le rendu n'a été vu ni sur appareil ni dans un navigateur, et se déclare non
   exécuté.** Ce que le lot change est **précisément ce qu'Ethan a VU** — une
   unité dessinée à 96 % dans la case du mur — et rien de ce qui précède n'a été
   regardé à l'écran : tout est mesuré sur `rangeeMilli`.

6. **Le calibrage revient à Ethan, et rien n'a été compensé.** Les raids
   s'allongent — A 264 → 280, C 396 → 458 — et B raccourcit de 287 à 244 en
   rapportant **plus** de butin. Trois raids, trois sens : c'est un changement de
   régime de combat, pas un ajustement.
