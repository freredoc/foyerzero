# RAPPORT — lot FREIN

*Trois étages sur le décalage de la défense : freiner, tenir sa cible, rentrer.*
Exécuté le **14/09/2026**, sur `main` = `d6732fa`.

---

## 1. Version, build, `npm run check`, octets, `SAVE_VERSION`

**Version et build : `0.99.59 · build 161`.** Les deux restent des **CHAÎNES** —
vérifié au type, `typeof pkg.version === 'string'` et
`typeof pkg.config.build === 'string'`. `android/app/build.gradle.kts` les lit
`as String`, et un nombre y ferait tomber le job Android à la CONFIGURATION.

**`npm test` rend 1613 tests déclarés** au sens de la garde de
`documentation.test.js`. Le verdict MESURÉ est **1612 pass · 0 fail ·
1 skipped** — le `skipped` est `LIMITE T8`, suspendu par Ethan le 08/09 et
inchangé ici. **`npm run check` sort en 0.**

**`npm run build` → `dist/index.html`, 9 386 707 octets, 0 référence externe.**

### Le coût, poste par poste

Mesuré contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de
`main` = `d6732fa`, et non contre un nombre recopié. Le pristine rend
**9 386 114 octets** — c'est-à-dire **exactement le nombre que la §0 du lot
PRÉDILECTION annonçait, retrouvé à l'octet**.

| poste | pristine | lot | écart |
|---|---:|---:|---:|
| JavaScript | 425 842 | 426 435 | **+593** |
| feuille | 46 538 | 46 538 | +0 |
| balisage | 36 785 | 36 785 | +0 |
| images | 7 683 603 | 7 683 603 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |
| **somme des cinq** | **9 386 114** | **9 386 707** | **+593** |
| **total du fichier** | **9 386 114** | **9 386 707** | **+593** |

La partition tombe **EXACTEMENT** sur le total des DEUX côtés — écart **0 · 0**.
**306 URI / 307 lignes `data:` de part et d'autre** : aucune ressource n'entre ni
ne sort, et le coût est **entièrement du JavaScript**.

**Borne T10 inchangée à 9 600 000**, marge **213 293 octets, 2,22 %**. La borne
n'a pas été touchée : le lot ne fait entrer aucune ressource, et §5 de
`CLAUDE.md` interdit de la relever pour faire passer du code.

### `SAVE_VERSION` reste à 33 — démontré, pas supposé

Deux preuves, l'une structurelle et l'autre mesurée.

1. **`src/sim/state.js` n'apparaît pas au diff.** Le lot touche
   `src/sim/combat.js` et lui seul dans `src/`.
2. **Cinq parties menées jusqu'à QUATRE raids chacune** — `creerEtat`,
   rattrapage, bâtiments de production, armée composée, puis boucle sur
   `satellites.presents` avec 36 000 ticks entre chaque passe — se sérialisent
   sous `"version":33`, se rechargent et se resérialisent **identiques à
   l'octet** (sauvegardes d'environ 12,4 Ko). 5/5.

⚠ **Et les deux champs neufs de l'entité de combat ne traversent PAS
`serialiser`**, ce que le témoin de BASES-0 confirme par l'autre bout : la
**taille de la sauvegarde est identique sur 25 graines sur 25**. Une entité de
combat naît de `creerCombat` et meurt avec le montage.

### Ce que le lot touche

`src/sim/combat.js` (**et lui seul** dans `src/`, +189 lignes), `package.json`,
`CLAUDE.md`, **quinze fichiers de `test/`** — les DEUX témoins compris —, et il
fait entrer `test/frein.test.js` et le présent rapport.

**Pas une ligne de `src/data/`, `src/render/`, `src/ui/`, `src/son/`, `tools/`
ni `art/`** — vérifié au diff.

`python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot ne
touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff.

---

## 2. La base confrontée, et ce que le brief dit de faux

La base annoncée par le brief a été retrouvée : `main` à `d6732fa`, 1 611 tests
déclarés, `dist/index.html` à 9 386 114 octets, version 0.99.58 · build 160. Les
quatre ancres dont le lot dépend — `doitSArreter` répondant « une cible de
prédilection est-elle à portée », `cibleDuDecalage` élisant à la seule distance,
`ajouterEntite` destructurant une liste fermée, `seDecaler` payant l'écrasement
avant tout `return` — étaient intactes, vérifiées une par une avant d'écrire.

Le brief dit trois choses fausses, et elles sont déclarées ici plutôt que
contournées.

### 2.1 — Le §7 se contredit lui-même

Il demande `assert.ok(voyage < tir)`. **Sa propre table du §3 annonce voyage 50
contre tir 31** : l'assertion serait tombée sur le code même qu'elle est censée
garder. Le premier jet l'a écrite telle quelle et elle est tombée à la première
exécution.

`FREIN T1` asserte donc **`voyage < 2 × tirs`** — la propriété que le brief
VOULAIT dire, « elle ne passe plus l'essentiel de son temps à courir » — plus les
six valeurs exactes et quatre contre-assertions. Écart déclaré.

### 2.2 — Le §1.3 attribue la retraversée à `C3`, et c'est `A`

Il pose que l'hystérésis ferme les demi-tours. **Mesuré en isolant les trois
étages sur le montage du §3 : `A` SEUL rend `inversions: 0`.** La pièce n'a plus
le temps de traverser la grille — elle freine dès la première cible à portée, et
la question du changement d'avis ne se pose jamais.

`C3` reste écrit, et il n'est pas décoratif : il mord dès qu'une pièce est
RÉELLEMENT en route sans cible à portée, ce que `FREIN T2` monte. **La correction
est reprise dans le commentaire du code**, pas seulement ici — voir §6.

### 2.3 — Le §11 annonce dix-sept tests, et il y en a dix-sept — mais pas les siens

Le compte tombe juste ; la liste, non. Voir §7 : `PIC T7`, `JOURNAL T1`,
`JOURNAL T1 bis` et les deux `BASES-0 T1` ne sont pas des tests « qui tombent »,
ce sont des témoins et une ancre de taille, qu'aucun brief ne peut prévoir avant
d'avoir mesuré le livrable.

---

## 3. Les gardes de `doitSArreter` côté défense

Le brief demande si les gardes de `doitSArreter` sont atteignables au site du
frein. **Instrumenté, pas raisonné** : un compteur par branche, posé au site
d'appel de `seDecaler`, sur **72 raids** du balayage, soit **86 024 appels**.

| branche | tirs | part |
|---|---:|---:|
| 1 — aéronef traversant | **0** | 0 % |
| 2 — la pièce n'a pas tiré | 63 659 | **74,00 %** |
| 3 — la cible est un bâtiment | **0** | 0 % |
| 4 — `colonnePredilection === null` | **0** | 0 % |
| 5 — la cible est hors prédilection | 12 533 | **14,57 %** |
| 6 — ARRÊT | 9 832 | **11,43 %** |

**Trois des six sorties ne tirent jamais**, et la structure le confirme — la
mesure et le raisonnement se rejoignent, ce qui est ce qu'on demande à une
mesure :

1. **La garde aérienne est inatteignable** parce qu'aucune unité `traversant`
   n'a `defense.present`, et parce qu'aucune entrée de `DEFENSES` n'est
   traversante. Une pièce de garnison n'est jamais un aéronef qui survole.
2. **La garde bâtiment est inatteignable** parce que `creerCombat` donne
   toujours `camp: 'defense'` à un bâtiment : une défenseuse ne peut pas viser
   un bâtiment de son propre camp, et il n'y a pas de bâtiment dans l'autre.
3. **La garde de nullité est inatteignable au site du frein** parce que
   `colonneDuDecalage` sort AVANT lui quand `p.colonnePredilection === null` —
   une pièce sans prédilection ne se décale pas du tout.

**Elles sont laissées telles quelles.** `doitSArreter` sert aussi `avancer`, où
les trois mordent pour de bon : les retirer casserait le côté attaque pour
alléger un chemin où elles ne coûtent qu'une comparaison.

---

## 4. §2.1 — les écrasements par la défense, et lequel des deux invariants prime

Le brief demande combien d'écrasements latéraux disparaissent. **Réponse
mesurée : ZÉRO. Les deux invariants tiennent ensemble, et aucun n'est choisi
contre l'autre.**

| arbre | `seDecaler` | `avancer` |
|---|---:|---:|
| `main` pristine | **16** | 18 |
| lot FREIN | **16** | 27 |
| contre-épreuve : frein en TÊTE de `seDecaler` | **0** | 26 |

Les seize écrasements latéraux des quatre raids réels sont **préservés
exactement**. Ce qui les préserve est la POSITION de trois lignes : le frein est
placé **après** le paiement de l'écrasement, jamais avant.

C'est l'invariant du lot CONTACT-2, qui exige que les dégâts d'écrasement soient
payés **avant tout `return`** de `seDecaler`. La contre-épreuve dit ce qu'aurait
coûté l'ordre inverse : **seize sur seize détruits**, et un écrasement qui
mourrait en silence — ni test rouge ni levée, juste une mécanique qui cesse de
fonctionner.

⚠ Le nombre d'écrasements par `avancer` monte de 18 à 27, et ce n'est pas le
lot qui les crée : ce sont les mêmes combats qui durent autrement.

---

## 5. Le tableau du §3 confronté

Montage du §3 : un `ratisseur` en colonne 5, rangée 6 ; quatre `meute` en
colonnes 1, 3, 7 et 9 ; une `souche` en colonne 5.

| grandeur | avant (`main`) | après | brief §3 |
|---|---:|---:|---:|
| ticks de voyage | **99** | **50** | 50 |
| ticks de tir | **32** | **31** | 31 |
| inversions de sens | **7** | **0** | 0 |
| parcours latéral cumulé | **7 920** | **4 000** | 4 000 |
| colonne finale | **7 000** | **1 000** | 1 000 |
| cases visitées | — | `[5, 4, 3, 2, 1]` | `[5, 4, 3, 2, 1]` |

**Les six valeurs du brief tombent au millième.** C'est la seule chose que le
brief dise juste sans réserve, et elle est dite ici dans ce sens-là.

La mesure qui compte est le rapport : **99 ticks de trajet pour 32 de tir**
devient **50 pour 31**. Une pièce de garnison passait trois fois plus de temps à
courir qu'à tirer ; elle en passe un peu plus d'une fois et demie.

`FREIN T1` fige les six, plus **quatre contre-assertions `notEqual`** qui
refusent le retour de 99, 32, 7 920 et 7 000, plus
`assert.ok(m.voyage < 2 * m.tirs)` en remplacement de l'assertion contradictoire
du §7, plus deux gardes de prémisse — `tirs > 0` et `voyage > 0` : une pièce qui
ne tirerait plus du tout, ou qui ne se décalerait plus du tout, passerait
l'inégalité sans rien mesurer.

---

## 6. β — le montage, la colonne finale, la correction du §1.3 dans le code

### Le montage

Montage du §3.1 : un `fendeur` en colonne 5 (le poste), un `belier` en colonne 9,
deux `meute` en colonnes 1 et 2. Le fendeur part vers les meute, les tue, et il
ne reste sur la grille **aucune** cible de sa prédilection.

| grandeur | avant (`main`) | après |
|---|---:|---:|
| colonne finale | **9 000** | **5 000** |
| poste (`colonneDePoseMilli`) | — | 5 000 |
| écart maximal au poste | — | **4 000** |

Sur `main`, la défenseuse restait collée à la colonne de sa dernière cible morte.
Elle rentre.

⚠ **`FREIN T2` prouve sa prémisse avant d'asserter quoi que ce soit** :
`ecartMax === 4 × MILLI_PAR_CASE` dit que la pièce EST partie de son poste. Sans
cette assertion, une défenseuse qui n'aurait jamais bougé passerait le test —
c'est le montage dégénéré que ce dépôt a payé sept fois.

### L'ordre des trois étages

```
A   une cible de prédilection est à portée            → on ne bouge pas
C3  sinon, la cible retenue est encore valide         → on va vers elle
β   sinon, aucune cible de prédilection sur la grille → on rentre au poste
```

**Le retour est le DERNIER**, et ce n'est pas un détail d'écriture : une pièce
qui rentre s'arrête à l'instant où une cible entre dans sa portée, parce que `A`
est évalué le premier à chaque tick. L'ordre inverse la ferait rentrer jusqu'au
bout sous le feu.

### La correction du §1.3, reprise dans le code

Le commentaire de `colonneDuDecalage` porte, en toutes lettres :

> ⚠⚠ ET LE §1.3 DU BRIEF ATTRIBUE LA RETRAVERSÉE À `C3` — MESURÉ, C'EST `A`.
> En isolant les trois étages sur le montage du §3, `A` seul rend `inversions:
> 0` : la pièce n'a plus le temps de traverser, elle freine dès la première
> cible à portée. `C3` reste écrit et mord ailleurs — il empêche une pièce déjà
> en route de changer d'avis à chaque tick.

Un rapport qu'on ne relit pas ne corrige rien ; le code, si.

---

## 7. Les dix-sept tests, un par un

### 7.1 — `ARRÊT T10` : le compte des lecteurs

`colonnePredilection` passe de **13 à 16** occurrences dans `src/sim/combat.js` —
trois écritures de profil et **treize lectures** au lieu de dix. Les trois
nouveaux lecteurs sont **NOMMÉS**, pas seulement comptés :
`cibleDeDecalageValide` (garde puis comparaison), `colonneDuDecalage` (sa garde
d'entrée, qui décide de β), et `ajouterEntite` (une POSE, pas une comparaison).
Le test exige en plus la garde de nullité dans **huit** sites au lieu de cinq.
Contre-assertion `notEqual(13)`.

⚠ Et le test dit ce qui compte le plus : **`doitSArreter` n'a pas été touché,
deux lots de suite.**

### 7.2 — `assaut T7` : les préréglages figés et les assauts budgétés

| | avant | après |
|---|---:|---:|
| figé A, tick | 834 | **793** |
| figé B, tick | 698 | **676** |
| figé C, tick | 478 | **478** |
| budgété A, ticks | 727 | **695** |
| budgété A, butin | 254 470 / 84 823 | **24 987 / 8 329** |
| budgété B, cause | `attaquants` | **`duree`** |
| budgété B, ticks | 424 | **900** (`TICKS_MAX_COMBAT`) |
| budgété C, ticks | 493 | **493** |
| budgété C, butin quartz | 6 486 | **10 493** |

Le plafond est **LU** dans `TICKS_MAX_COMBAT`, jamais retapé — un 900 écrit en
clair cesserait de dire « ce raid expire » le jour où le plafond bougerait. Une
assertion `equal(TICKS_MAX_COMBAT, 900)` le fige à côté, pour que le réancrage se
sache à reprendre si le plafond change.

### 7.3 et 7.4 — `BASES-0 T1` (empreinte par graine) et `BASES-0 T1` (scalaires)

Vingt-septième couche du témoin, **36 couples sur 350**, six champs, phases p07 à
p14. Les six premières phases sont identiques **AU BIT**. Voir §8.

### 7.5 — `cible T5` : la liste des raids au plafond

`['infanterie/base/3']` → **`['blindeLourd/camp/1']`**. La liste bouge des DEUX
côtés — un raid qui traînait s'achève, un raid qui s'achevait traîne. Un
allongement uniforme ne ferait pas ça. Contre-assertion `notDeepEqual` refusant
la liste d'hier. Voir §9.

### 7.6 — `CONTACT-2 T2` : la famille A

`ATTENDUS = { A: 14 }` → **`{ A: 13 }`**. La famille B reste fermée — il n'y a
toujours pas de clé `B`, et la branche qui la comptait reste un `assert.fail`.
La famille A maigrit d'un chevauchement, ce qui est cohérent : une défenseuse qui
cesse de courir croise moins d'écraseuses. Contre-assertion `notEqual(14)`.

### 7.7 — `generateur T12` : déplacé, pas cassé — et c'est mesuré

Le brief demande de trancher. **Déplacé.**

| | avant | après |
|---|---:|---:|
| `ecarts.length` | 460 | **480** |
| paires sautées | 40 | **20** |
| combats au plafond | 20 | **10** |
| `ecartMax` | 0 | **1** |
| médiane | 0 | 0 |
| `entitesQuiBasculent` | 0 | **0** |

La couverture **MONTE** : le lot raccourcit encore les combats miroirs que le
plafond de 900 tronquait, donc moins de paires sont sautées et plus de cellules
sont comparées. Le plancher `>= 450` tient, et il tient mieux qu'avant.

⚠⚠ **`ecartMax` remonte de 0 à 1, sur une inversion de structure que le dépôt
n'avait jamais vue : le niveau 1 SEUL contre les quatre autres.** La cellule est
`camp` graine 23, montage `mixte/5`, **299 contre 300 ticks**, écart relatif
**0,334 %**. Tous les réancrages précédents de ce test portaient sur un niveau 2
ou au-dessus ; celui-ci porte sur le niveau le plus bas, où les entités sont les
plus fragiles et où un tick de tir de plus tue.

**La propriété du miroir ne bouge pas** : `entitesQuiBasculent` vaut toujours
**0**. Le test n'est donc pas cassé — il mesure toujours ce qu'il mesurait, sur
plus de cellules. La contre-assertion est **RETOURNÉE** : elle refusait le un,
elle refuse le zéro. Un lot qui cesserait d'échantillonner l'arrondi repasserait
au vert sans elle, et c'est exactement la faute que ce test existe pour refuser.

### 7.8 et 7.9 — `JOURNAL T1` et `JOURNAL T1 bis`

Les deux couches de témoins de combat. Voir §8.

### 7.10 — `PIC T7` : l'ancre de taille, septième réancrage

9 386 114 → **9 386 707**, marge 213 886 → **213 293**, 2,23 % → **2,22 %**. Les
593 octets valent **un quatre-vingt-quatrième** de sa tolérance de 50 000 : le
laisser aurait passé au VERT en faisant mentir la §0 de `CLAUDE.md`. Une
quatrième contre-assertion `notEqual` refuse l'ancre de PRÉDILECTION, à côté de
celles de REJEU, CONTACT-2 et ÉCRANS.

### 7.11 — `POI T18` : l'écart se resserre

| | avant | après |
|---|---:|---:|
| butin sans POI | 62 / 20 | **40 / 13** |
| butin avec POI | 87 / 29 | **44 / 14** |
| durée | 451 | **451** |
| écart relatif gardé | +40,3 % | **+10,0 %** |

La durée ne bouge pas d'un tick des deux côtés — c'est ce qui rend la mesure
lisible. Le SIGNE que le test garde tient ; ce qui se resserre est l'ampleur, et
le motif est mécanique : **une majoration de dégâts ne paie que sur ce qu'on
atteint, et l'assaut atteint moins.** Contre-assertion refusant `{62, 20}`.

### 7.12 — `raid « deux raids »` : la garde change comme son message l'annonçait

La garde portait, en toutes lettres, que la décroissance stricte de la défense
avait été abandonnée au lot COLONNE — la première passe rasant déjà tout — et
qu'elle reviendrait le jour où ce ne serait plus vrai. Ce jour est celui-ci.

Mesuré : la première passe laisse **40 ‰** de défense, la seconde **0**. La
décroissance stricte **revient**, encadrée de deux assertions de prémisse :
`equal(un.restantDefense, 40)` et `notEqual(un.restantDefense, 0)`. Sans la
seconde, la décroissance stricte redeviendrait vacueuse le jour où la première
passe raserait à nouveau, et personne ne le verrait.

### 7.13 — `NEUT T3` : le montage est réparé, jamais l'assertion

Sa prémisse a cessé d'être vraie. Il opposait une défenseuse neutralisée à une
défenseuse LIBRE, en lisant des ticks ÉCRITS EN DUR — 39, 40, 60 — et en
supposant que la libre courrait jusqu'au contact. Elle freine désormais.

Le montage **DEMANDE** désormais au moteur : il relève le tick où le Flashbang
tombe pour de bon, exige qu'il soit assez tardif pour que la pièce ait marché,
mesure le pas de décalage libre, et asserte que le pas est **constant** avant
l'effet, **nul** pendant, et **repris** après. Il asserte en plus que les deux
montages coïncident avant l'effet, et que la défenseuse est encore vivante à la
fin — sans quoi il ne mesurerait plus rien.

**Aucune assertion n'a été retirée** ; le test mesure désormais la
neutralisation elle-même plutôt qu'une position qui dépendait du frein.

### 7.14 — `MODULES-F T14` : les graines

`[1, 36, 39]` → **`[9, 36, 39]`**. La graine `1` perd sa prémisse, la `9`
revient — elle avait été écartée au lot CONTACT. Balayage des graines 1 à 60 :
**cinq** conviennent aux trois niveaux — 9, 36, 39, 56, 57. **Huitième fois que
ce montage-là perd sa prémisse**, et la première où une graine écartée revient.
Les neuf valeurs de points suivent.

### 7.15 — `repli T6` : le butin bouge sans la durée

Tick **493 inchangé**. Butin `{6 486, 2 162}` → **`{10 493, 3 497}`**,
soit **+61,8 %**. Survivants **5 → 6**, avec un `notEqual(…, 5)`.

C'est la **deuxième fois de l'histoire de ce seuil** qu'un lot déplace le butin
sans la durée, après CONTACT-2 — et par le mécanisme **INVERSE** : là-bas une
écraseuse broyait plus vite, ici une défenseuse tire au lieu de courir, donc
l'assaut casse moins de défense et la met plus longtemps à portée du butin.
Contre-assertion refusant `{6 486, 2 162}`.

### 7.16 — `roster T5`

`[200]` → **`[199]`**, avec `notDeepEqual([200])`. Un tick.

### 7.17 — `roster T6` : RETOURNÉ, pas assoupli

Les trois cas :

| | cause | tick | butin | survivants |
|---|---|---:|---|---:|
| A `avantPoste`/`infanterie` | `attaquants` | **695** | **24 987 / 8 329** | 3 |
| B `camp`/`blindeLourd` | **`duree`** | **900** | **33 380 / 11 126** | 9 |
| C `camp`/`infanterie` | `attaquants` | **493** | **10 493 / 3 497** | **6** |

⚠⚠ **L'assertion du plafond est RETOURNÉE.** Elle exigeait
`r.nbTicks < TICKS_MAX_COMBAT` **pour les trois**. Écrire `<=` aurait effacé la
propriété pour A et C — c'est l'assouplissement que ce dépôt refuse. Une branche
**NOMMÉE** exige donc l'égalité **STRICTE** au plafond pour B, et l'inégalité
stricte pour les deux autres :

```js
if (c.nom === 'B') {
  assert.equal(r.nbTicks, TICKS_MAX_COMBAT, `raid ${c.nom} : ${r.nbTicks} ticks`);
} else {
  assert.ok(r.nbTicks < TICKS_MAX_COMBAT, `raid ${c.nom} : ${r.nbTicks} ticks`);
}
```

Un lot qui ferait expirer A ou C tombe ; un lot qui ferait conclure B tombe
aussi. Le test est **plus fort** qu'avant, pas plus tolérant.

---

## 8. La couche de témoins : les deux comptes mesurés

Le brief annonce **1 053 champs sur 200 combats**.

### `COMBATS_DEPLACES_PAR_FREIN` — cinquième couche de `JOURNAL T1`

- **1 053 champs déplacés sur 1 600.** Le nombre du brief tombe **au champ
  près**.
- **Trente-quatre champs NEUFS à la surcharge** : 1 179 → **1 213**, **387
  gardés** contre la capture d'APPROCHE. Les 1 019 autres étaient déjà couverts
  par l'une des quatre couches d'avant.
- **AUCUN des deux cents combats n'est intact** — là où PRÉDILECTION en laissait
  sept et CONTACT-2 vingt-trois. C'est juste : le lot change le déplacement
  latéral de toute pièce de garnison qui a une prédilection, et il n'existe aucun
  site généré qui n'en porte aucune.
- **Deux causes de fin basculent**, contre huit à PRÉDILECTION. **173 ticks de
  fin** déplacés.

### `COMBATS_DEPLACES_PAR_FREIN_AVANT_PAQUETS` — dixième couche de `T1 bis`

- **1 030 champs déplacés.**
- **QUATRE champs neufs seulement** : 1 337 → **1 341**, **259 gardés**.
- **Quatre causes de fin basculent** — le seul compte du lot où l'ancien
  placement bouge PLUS que le neuf. Les vagues y naissent groupées sur le front
  de la bande de déploiement : une défenseuse qui cesse de courir y change
  davantage l'issue que devant des vagues étalées.

### Ce que les deux comptes disent, et ce qu'ils ne disent pas

⚠⚠ **Le nombre de champs NEUFS mesure l'épaisseur de la pile, pas l'ampleur du
lot.** Trente-quatre d'un côté, quatre de l'autre, pour les mêmes 1 053 / 1 030
champs déplacés : ce sont les mêmes combats vus sous quatre couches d'un côté et
neuf de l'autre.

⚠⚠ **Ce qui dit que le lot ne touche pas au CIBLAGE, c'est la cause de fin :
deux basculent dans `T1`, quatre dans `T1 bis`.** PRÉDILECTION, qui changeait le
ciblage, en faisait basculer huit. `ciblage`, `doitSArreter` et `cibleIndice`
n'ont pas une ligne de changée — ce qui bouge est **OÙ une défenseuse se tient**,
jamais **QUI elle vise**.

⚠ **Les deux tables portent les 200 clés**, `{ }` là où rien ne bouge : une clé
absente se lirait « ce combat n'existe plus ». Il se trouve qu'aucune n'est vide
ici, et c'est la mesure ci-dessus, pas une commodité d'écriture.

### Le témoin de BASES-0 — vingt-septième couche

**36 couples sur 350**, six champs, phases **p07 à p14**. Les six premières
phases sont identiques **AU BIT** : le scénario ne combat pas avant son premier
raid.

⚠⚠ **Le raid de proximité bouge sur 19 graines sur 25, celui de l'Ouvrage sur
21 — et c'est l'INVERSE exact du lot PRÉDILECTION**, dont la table de proximité
était VIDE. Le motif se lit dans les deux règles : la prédilection ne mord que là
où une pièce a plus d'une **CLASSE** de cible valide à portée — et le camp de la
phase 7 porte trois `meute` et rien d'autre, mesuré tick par tick au lot
précédent ; le frein, lui, ne demande qu'**UNE** cible de la bonne classe, et il
n'existe aucun camp qui n'en porte aucune.

⚠ **Vingt-trois graines sur vingt-cinq sont déplacées.** Les deux qui tombent à
l'octet — **8 et 15** — sont des parties où aucune pièce de garnison n'a jamais
eu à se décaler. Le `??` de `bases.test.js` reste **NÉCESSAIRE**, comme aux six
lots d'avant.

⚠ **Aucun des dix-sept scalaires ne bouge**, sur 25 graines sur 25 : ni les
gestes de construction, ni ceux d'armement, ni les cases atteignables, ni le
déplacement, ni les bases attaquantes, ni le nombre de cibles, ni la cible
retenue, ni l'équivalence des deux chemins d'avancement, **ni la taille de la
sauvegarde**.

---

## 9. §9 — le nouveau raid au plafond, et aucune issue prise

**Le brief interdit de trancher. Rien n'est tranché, aucun barème n'est touché.**

Sur les cinquante-quatre raids du balayage, il y en a toujours **exactement un**
qui touche le plafond de 900 ticks, et **ce n'est plus le même** :
`infanterie/base/3` sort, **`blindeLourd/camp/1`** entre. C'est le même raid que
le B de `roster T6` et de `assaut T7`.

⚠ **Ce n'est pas un gel**, vérifié comme les neuf fois précédentes en portant
`maxTicks` à 20 000 : il se conclut par **`attaquants` au tick 2 629**, soit
**2,92 fois le plafond**. À comparer aux précédents — 4 645 au lot CARTE, 5 478
au lot COLONNE, 3 539 au lot DISPOSITION-OUVRAGE, 2 618 au lot MUR, 940 au lot
APPROCHE, 1 020 au lot CONTACT, 1 973 au lot PRÉDILECTION. Ce n'est pas un combat
sans issue, c'est un combat trois fois trop long.

⚠ Et il ne fait tomber **AUCUN** de ses quatorze bâtiments, même à plafond levé —
là où `infanterie/base/3` en abattait quatre sur vingt et un.

### Le sens de la cause est l'inverse de celui du lot précédent

PRÉDILECTION rendait les assauts plus **FORTS**, et c'est pour ça qu'ils
duraient. **FREIN les rend plus FAIBLES**, et le raid qui traîne y traîne pour la
raison opposée.

| grandeur, 54 raids | PRÉDILECTION | FREIN |
|---|---:|---:|
| attaquants détruits | 388 | **398** |
| bâtiments tombés | 44 | **28** |
| défenseurs tombés | 606 | **586** |
| somme des ticks | 29 169 | **28 458** |

Les combats **RACCOURCISSENT** en moyenne et l'assaut casse **moins** : une
garnison qui reste en place tire au lieu de courir. Le raid au plafond est
l'exception qui va dans l'autre sens, pas la règle.

**Aucun barème n'a été touché. Le calibrage revient à Ethan.**

---

## 10. `FREIN T1` et `FREIN T2` vus rouges sur `main`

Les deux tests ont été joués dans un `git worktree` sur l'arbre pristine de
`main` **avant d'être écrits contre le code du lot**.

### `FREIN T1` sur `main`

```
AssertionError: les ticks de voyage ont bougé
    actual: 99
  expected: 50
```

et, la première assertion neutralisée :

```
AssertionError: la défenseuse fait encore demi-tour
    actual: 7
  expected: 0
```

La pièce traversait la grille de la colonne 5 à la colonne 1, revenait, repartait
— **sept inversions de sens**, **7 920 millièmes de parcours cumulé** pour une
grille large de neuf cases, et elle finissait en colonne **7 000**.

### `FREIN T2` sur `main`

```
AssertionError: la défenseuse ne rentre pas à son poste
    actual: 9000
  expected: 5000
```

Elle restait collée à la colonne de sa dernière cible morte, indéfiniment.

### Sur l'arbre du lot

Les deux passent. **Le compte de tests passe de 1 611 à 1 613.**

---

## 11. Relecture hostile

Ce qui a été cherché, et ce qui a été trouvé.

### Ce qui a été trouvé et corrigé

1. **L'assertion du §7 contredisait la table du §3.** Écrite telle quelle au
   premier jet, tombée à la première exécution. Remplacée par
   `voyage < 2 × tirs`, écart déclaré au §2.1.
2. **`roster T6` aurait été assoupli par un `<=`.** Le raid B expire désormais au
   plafond ; écrire `<=` pour les trois aurait effacé la propriété pour A et C.
   Corrigé par une branche nommée qui exige l'égalité stricte pour B.
3. **Le montage de `NEUT T3` lisait des ticks écrits en dur.** Il aurait pu être
   « réparé » en décalant les trois nombres ; c'est le MONTAGE qui a été refait,
   et il demande désormais au moteur au lieu d'écrire.
4. **Le commentaire du code annonçait « seize écrasements » sans que personne
   l'ait vérifié depuis qu'il avait été écrit.** Remesuré : 16 sur `main`, 16 sur
   le lot, **0** avec le frein en tête. Le nombre était juste ; la vérification
   ne l'était pas.
5. **`generateur T12` a d'abord été sondé en neutralisant trois assertions**,
   ce qui laisse un fichier à moitié désarmé. Il a été restauré depuis sa
   sauvegarde avant que le patch propre ne soit appliqué.

### Ce qui a été cherché et n'a rien donné

- **Les deux champs neufs entrent-ils dans la sauvegarde ?** Non — la taille de
  la sauvegarde est identique sur 25 graines sur 25, et cinq allers-retours de
  sérialisation sont identiques à l'octet.
- **`ajouterEntite` destructure-t-il les deux champs aux DEUX endroits ?** Oui,
  vérifié : un champ ajouté d'un seul côté disparaîtrait en silence, et c'est le
  piège que `CLAUDE.md` §6 nomme depuis le lot 3A.
- **Le frein peut-il rendre `progresse` faux pour toujours ?** Non — il vit dans
  `seDecaler`, qui ne commande ni le repli ni l'Écraseur. Ceux-là passent par
  `avancer`, que le lot ne touche pas.
- **`cibleDuDecalage` a-t-elle gagné un filtre `estEnApproche` ?** Non — le §8
  du brief l'interdit nommément, et le grep le confirme.
- **Le facteur latéral a-t-il bougé ?** Non — `GRILLE.lateral` reste `2/3`,
  `src/data/combat.js` n'apparaît pas au diff.
- **Une garde de nullité manque-t-elle quelque part ?** Non — `ARRÊT T10` exige
  la garde dans les huit sites qui lisent `colonnePredilection`, et la forme
  courte `p.colonnePredilection === pc.colonneMatrice`, vraie quand les deux
  valent `null`, n'apparaît nulle part.

### Ce qui n'a pas été vu, et qui se déclare

⚠⚠ **Le rendu n'a pas été vu, ni sur appareil ni dans un navigateur.** Ce que le
lot change se VOIT — une garnison qui cesse de traverser la grille en courant, et
qui regagne son poste quand il n'y a plus rien à viser — et tout est mesuré sur
`colonneMilli` et des fonctions PURES.

**À regarder au premier essai** : que le retour au poste ne se lise pas comme une
fuite, et que les défenseuses ne paraissent pas figées maintenant qu'elles ne
courent plus.

⚠ **Et le lot n'est pas sur une branche nommée par le brief.** Il demande
`claude/[descriptive]` ; l'environnement d'exécution épingle la session à
`claude/new-session-j500j0` et interdit de pousser ailleurs sans autorisation
explicite. Écart déclaré, comme aux six lots précédents.

---

## Ce qui reste ouvert, et qui revient à Ethan

1. **Le raid `blindeLourd/camp/1` demande 2 629 ticks**, soit 2,92 fois le
   plafond, et ne fait tomber aucun de ses quatorze bâtiments. **Aucune issue
   n'est prise** — le §9 du brief l'interdit.
2. **Le lot rend les assauts plus faibles** — bâtiments tombés 44 → 28 sur les
   cinquante-quatre raids. Aucun barème n'a été touché.
3. **Les trois gardes inatteignables de `doitSArreter`** sont laissées telles
   quelles, parce qu'elles mordent dans `avancer`. Les retirer serait un lot à
   part, et il devrait mesurer le côté attaque.
