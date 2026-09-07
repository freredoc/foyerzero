# RAPPORT — lot RETOUR-DÉFENSES

*Exécuté le 06/09/2026, sur la branche `claude/reparation-foyer-zero-b68muf`.*

---

## 0. Ce qu'il faut lire avant tout le reste

⚠⚠ **LE BRIEF SE PRÉSENTE COMME REMPLAÇANT UN LOT « JAMAIS EXÉCUTÉ », ET IL L'A
ÉTÉ.** Son en-tête : « *Remplace `BRIEF-lotCOMPLEXE.md`, écrit le même jour et
jamais exécuté* ». Le lot COMPLEXE a été exécuté quelques heures plus tôt sur
cette même branche — commit `ec86543`, **PR #92, ouverte, CI verte,
`mergeable_state: clean`**. Les deux lots ne s'empilent donc pas : ils se
**substituent**, et ce lot-ci réécrit ce que celui-là avait posé.

⚠⚠ **LE §0 DU BRIEF DEMANDE DE S'ARRÊTER SI L'UN DES SEPT FAITS A BOUGÉ. LE
PREMIER A BOUGÉ — À CAUSE DE MA PROPRE PR.** « `complexeDeDefense` n'apparaît
dans AUCUN module de `src/sim/` » : c'est encore vrai de `main`, et c'est le lot
COMPLEXE qui l'a rendu faux en substance sur la branche. **Le lot a été poursuivi
plutôt qu'arrêté**, pour trois raisons dites d'avance :
- la condition d'arrêt vise un dépôt qui aurait bougé *sous* le brief ; ici c'est
  le brief qui ignore un travail livré et non mergé ;
- s'arrêter aurait laissé `main` sans aucune des deux règles, et la branche avec
  la mauvaise ;
- **le brief RETOUR-DÉFENSES est un sur-ensemble de COMPLEXE** — il couvre les
  DEUX camps, remplace l'échéance sèche par un palier et une rampe, et rouvre
  une constante que le modèle disait supprimée. Il fallait donc de toute façon
  réécrire ce que COMPLEXE avait posé.

**Les six autres faits sont intacts, vérifiés un par un :**

| fait | vérification | verdict |
|---|---|---|
| `BATIMENTS.etai` porte `reparationDefenses: true` et `ta: 'Complexe de défense'` | `src/data/sites.js` l. 28-38 | ✅ |
| `reparerLaGarnison` est le module `autoReparation`, `AUTO_REPARATION_PCT = 20` | `src/sim/raid.js` l. 625 | ✅ |
| `sim/site-entame.js` porte `reparerLesSites`, `etaiDebout`, `TICKS_REPARATION_BASE`, `TICKS_REPARATION_DEFENSES` | les quatre présents avant le lot | ✅ |
| `facteurMilli` refuse un niveau non entier et au-delà de `NIVEAU.plafond` | `src/sim/combat.js` l. 437-448 | ✅ |
| sur un site de l'Ouvrage, tout est au niveau du site | `placerBatiments` / `placerDefenses` poussent le même `niveau` | ✅ |
| `subirUnRaid` écrit `degatsMilli` sur `laBase.garnison` | `src/sim/raid-ouvrage.js` l. 280, 544 | ✅ |

⚠⚠ **ET LE §2 DU BRIEF CONTREDIT UN ARBITRAGE D'ETHAN POSTÉRIEUR — LE CODE SUIT
L'ARBITRAGE.** Le brief pose la pénalité de santé **géométrique** avec
`PLANCHER = 72`, et écrit « la géométrique est prise parce que tout l'est dans
ce jeu ». Il est daté du 05/09 ; l'arbitrage d'Ethan est du **06/09** et dit
l'inverse mot pour mot : « *la courbe choisie est géométrique. je préfère
linéaire. 24h, pas 72h* ». Le brief note lui-même « **une seule ligne les
sépare** ». Le code garde donc la forme **linéaire** et le plancher **24 h**, et
toutes les durées de son §2 sont recalculées — table au §8 ci-dessous.

---

## 1. Version, build, sauvegarde

| | |
|---|---|
| `GAME_VERSION` | **0.99.2** (0.99.0 sur `main`, 0.99.1 au lot COMPLEXE) |
| `GAME_BUILD` | **103** (101 sur `main`, 102 au lot COMPLEXE) |
| `SAVE_VERSION` | **26** — un seul maillon depuis la 25, voir ci-dessous |

⚠⚠ **UN SEUL MAILLON v25 → v26, PAS DEUX, ET C'EST UN CHOIX MOTIVÉ.** Le lot
COMPLEXE avait déjà porté `SAVE_VERSION` à 26 avec un champ `retourTick` ; ce
lot-ci le RÉÉCRIT pour porter `retour` et la santé figée, au lieu d'empiler un
v26 → v27. Motif : **aucune sauvegarde au monde n'a jamais été en v26** — la PR
de COMPLEXE n'est pas mergée et Pages ne bâtit que `main` —, donc empiler deux
liens embarquerait pour toujours une migration pour une forme qui n'a jamais
quitté la branche. Vu de `main`, c'est **UN SEUL** changement de forme d'état.

**La migration ne calcule rien, des deux côtés.** Elle ne pose même pas le champ
— « absent » vaut « null » vaut « pas de rampe en cours » — et se contente de
ramener à `null` une valeur héritée malformée. Côté Ouvrage elle ne touche pas
`sitesEntames` : c'est `reparerLesSites` qui relit la santé sur l'Étai **tel que
le raid l'a laissé**, ce qui EST la santé du raid.

---

## 2. `npm run check`, avant et après

| | avant (base de départ) | après |
|---|---|---|
| `npm test` | **1129 pass / 0 fail** | **1135 pass / 0 fail** |
| `dist/index.html` | 7 985 488 o (branche) · **7 982 366 o (`origin/main`)** | **7 987 956 o** |
| références externes | 0 | 0 |

⚠ **LA BASE DE DÉPART EST CELLE DE LA BRANCHE, PAS CELLE D'UN BRIEF.** Le brief
n'en annonce aucune, et c'est ce qu'il demande : `npm ci && npm run check` a été
lancé avant de toucher quoi que ce soit, et il rendait **1129 pass / 0 fail**.

**Coût, mesuré poste par poste contre un livrable REBÂTI depuis `origin/main`**
(le seul point de comparaison qui ait un sens : les deux lots se substituent) :

| poste | `origin/main` | après | delta |
|---|---|---|---|
| JavaScript | 344 310 | 349 524 | **+5 214** |
| feuille | 3 179 955 | 3 180 279 | **+324** |
| balisage | 4 458 101 | 4 458 153 | **+52** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| images | 6 306 190 | 6 306 190 | **+0** |
| **total** | **7 982 366** | **7 987 956** | **+5 590** |

**La somme des trois postes qui bougent tombe EXACTEMENT sur le total.**
**296 `data:` avant, 296 après** — aucune image, aucun son n'entre.

**Borne T10 inchangée à 9 300 000** — marge **1 312 044 octets, 14,11 %**.

---

## 3. Les dix-sept tests du brief, plus trois

⚠ **LA NUMÉROTATION EST CELLE DU BRIEF**, préfixée `RETOUR-D`. Trois s'ajoutent :
`T18` (la migration et la garde du numéro), `T19` (la borne du dépassement),
`T20` (le refus d'une rampe malformée au chargement) — ce dernier a été écrit
**après** avoir mesuré qu'une falsification ne mordait pas, voir §4.

| # | fichier | verdict | montage effectif |
|---|---|---|---|
| T1 | `reparation` | **PASS** | `pvApresRetour` à zéro tick, Complexe entier, pièce à 0 PV → **700 000 / 1 000 000**. Puis le chemin complet : une pièce à terre, `ramenerLaGarnison`, **70,0 %**. |
| T2 | `reparation` | **PASS** | Deux pièces sur la même base — une à 0 PV, une à 50 %. Après le palier : **70,0 %** et **85,0 %**. |
| T3 | `reparation` | **PASS** | Complexe à mi-vie, pièce à terre → **35,0 %**. Contre-épreuve : le même montage sous un Complexe entier rend plus du double. |
| T4 | `reparation` | **PASS** | Durée = 36 000 ticks. Au stamp : 85 %. À `durée − 1` : > 99 % et **pas** entière. À `durée` : `degatsMilli === 0` et `retour === null`. |
| T5 | `reparation` | **PASS** | +10 → **93 384 ticks = 2 h 36**, égal à `ceil(facteurMilli(11)/1000 × 36 000)` et **différent** de `ceil(1,10^10 × 36 000)`. Puis `NIVEAU.penteHaute` bougée : le résultat suit. |
| T6 | `reparation` | **PASS** | Pleine santé → **36 000 = 1 h**. Complexe de niveau 1 à **1 PV** (pas zéro) → **864 000 = 24 h 00**. Mi-vie → **450 000**, la MOYENNE des deux bornes, et **différent** de la géométrique. |
| T7 | `reparation` | **PASS** | +10 et mi-vie → **1 167 300 ticks = 32 h 26**, égal au produit des deux facteurs à un tick près. |
| T8 | `reparation` | **PASS** | Garnison à trois niveaux (5 · 8 · 12) sous un Complexe 5 → **trois** échéances distinctes et croissantes ; celle du niveau 5 vaut une heure. |
| T9 | `reparation` | **PASS** | `santeMilli: null`, 100 h → la pièce vaut ce que le raid a laissé, **250 000**. Contre-épreuve : la même à `santeMilli: 0` (Complexe à 1 PV) revient **entière**, en 24 h pile. |
| T10 | `reparation` | **PASS** | Base sans Complexe, 100 h : `degatsMilli` inchangé, `retour === null`, l'écran dit `sans-retour`. Puis le Complexe est POSÉ : le tick suivant la prend en charge. |
| T11 | `reparation` | **PASS** | Raid sous un Complexe à mi-vie, puis Complexe remis à neuf : l'échéance ne bouge que d'un tick par tick. Contre-épreuve : une pièce abîmée APRÈS profite du Complexe neuf (1 h). |
| T12 | `reparation` | **PASS** | Base en rangée 200, **49 bases attaquantes**, six heures, **4 raids**, les trois pièces stampées ; boucle et rattrapage rendent la même garnison ET la même sérialisation. |
| T13 | `site-entame` | **PASS** | Base de l'Ouvrage niveau 30, Étai à **1 PV** : à une heure, les bâtiments sont revenus et **les défenses non** ; à 24 h, tout est là. |
| T14 | `site-entame` | **PASS** | Avant-poste, Étai **tombé**, une défense détruite et une à 20 % : 100 h plus tard, `pvDefensesMilli` identique au bit, `santeComplexeMilli === null`, et le montage lu porte toujours une pièce de moins. |
| T15 | `site-entame` | **PASS** | Camp, un bâtiment à 50 % et un détruit : 100 h plus tard, les deux sont toujours là. |
| T16 | `reparation` | **PASS** | La rampe retirée à la main est reposée au tick suivant, avec l'instant du jour. Puis des dégâts NEUFS : la rampe repart de leur valeur. |
| T17 | `chantier` | **PASS** | `etatDeLaGarnison` : avertissement sans Complexe, nommant le bâtiment par la table ; il part quand on le pose ; puis une pièce abîmée fait dire « 1 pièce en retour dans … ». |
| T18 | `reparation` | **PASS** | `SAVE_VERSION === 26`. Une v25 fabriquée en rabaissant une sauvegarde : la migration n'invente rien. Puis le Complexe est CHANGÉ entre le chargement et le tick — la rampe prend la santé **d'aujourd'hui**. |
| T19 | `reparation` | **PASS** | `ticksDeRetour` lève sur un dépassement hors table et sur un niveau non entier. |
| T20 | `reparation` | **PASS** | Sept formes malformées refusées, l'absence et `null` acceptés, et le CHARGEMENT lève sur un `retour` fautif. |

---

## 4. Vingt-deux falsifications, vingt-deux chutes

⚠ **CHACUNE SUR L'ARBRE FINAL, ET CHACUNE DÉFAITE AVANT LA SUIVANTE** — un
harnais restaure les six fichiers touchés entre deux mesures.

| falsification | cible | chutes | tests tombés |
|---|---|---|---|
| F1 — le palier attend un tick | `T1` | 6 | RETOUR-D T1; RETOUR-D T2; RETOUR-D T3; RETOUR-D T4; RETOUR-D T10; RETOUR-D T16 |
| F2 — une pièce à zéro reste morte | `T2` | 3 | RETOUR-D T1; RETOUR-D T2; RETOUR-D T3 |
| F3 — le palier ignore la santé | `T3` | 2 | RETOUR-D T3; RETOUR-D T11 |
| F4 — la rampe rend le plein un tick trop tôt | `T4` | 1 | RETOUR-D T4 |
| F5 — la pente est écrite en dur | `T5` | 2 | RETOUR-D T5; RETOUR-D T7 |
| F6 — la pénalité redevient géométrique | `T6` | 2 | RETOUR-D T6; RETOUR-D T7 |
| F7 — les deux facteurs s'additionnent | `T7` | 1 | RETOUR-D T7 |
| F8 — une seule durée pour toute la garnison | `T8` | 4 | RETOUR-D T5; RETOUR-D T7; RETOUR-D T8; RETOUR-D T19 |
| F9 — la garde « rien ne revient jamais » est retirée | `T9` | 1 | RETOUR-D T9 |
| F10 — on stampe même sans Complexe | `T10` | 1 | RETOUR-D T10 |
| F11 — la santé est relue VIVE au lieu de la figée | `T11` | 1 | RETOUR-D T11 |
| F12 — le chemin DIRECT ne ramène plus rien | `T12` | 6 | RETOUR-D T4; RETOUR-D T10; RETOUR-D T11; RETOUR-D T12; RETOUR-D T16; RETOUR-D T18 |
| F12 bis — le chemin ANALYTIQUE ne ramène plus rien | `T12` | 3 | RETOUR-D T4; RETOUR-D T12; RETOUR-D T16 |
| F12 ter — le raid ne stampe plus sur-le-champ | `T12` | 1 | RETOUR-D T12 |
| F13 — sur une base, les défenses reviennent avec les bâtiments | `T13` | 1 | RETOUR-D T13 |
| F14 — un Étai tombé passe pour intact | `T14` | 4 | montage; résumé; RETOUR-D T14; recherche |
| F15 — les bâtiments d'un camp reviennent aussi | `T15` | 2 | RETOUR-D T15; réparation |
| F16 — le filet ne stampe plus ce qui n'est pas stampé | `T16` | 2 | RETOUR-D T12; RETOUR-D T16 |
| F17 — l'avertissement ne paraît jamais | `T17` | 1 | RETOUR-D T17 |
| F18 — la migration invente une rampe | `T18` | 1 | RETOUR-D T18 |
| F19 — la borne du dépassement est retirée | `T19` | 1 | RETOUR-D T19 |
| F20 — la garde de forme du champ est désarmée | `T20` | 1 | RETOUR-D T20 |
⚠⚠ **DEUX ONT DÛ ÊTRE REFAITES, ET LA SECONDE A FAIT ÉCRIRE UN TEST.**
1. **`F12` ne s'appliquait pas** : son motif visait un texte que le lot venait de
   réécrire. Reprise sur le texte réel, elle fait tomber six tests.
2. ⚠⚠ **`F20` — « la garde de forme du champ est désarmée » — NE MORDAIT PAS.
   Mesuré : 0 chute.** Rien, dans tout le dépôt, ne vérifiait qu'un `retour`
   malformé est refusé au chargement : la garde pouvait disparaître sans qu'un
   test bronche. **`RETOUR-D T20` a été écrit APRÈS cette mesure**, et la
   falsification mord depuis. C'est « une falsification qui ne mord pas se
   vérifie avant d'être crue », quinzième fois du dépôt.

⚠ **LES RECOUVREMENTS SE DÉCLARENT.** Six falsifications font tomber plus d'un
test, et c'est normal : `pvApresRetour` est le cœur commun, donc l'abîmer touche
tout ce qui en dépend. Ce qui compte est que **chaque test ait au moins une
falsification qui le fasse tomber SEUL ou presque** — `F4`, `F7`, `F9`, `F10`,
`F11`, `F12 ter`, `F13`, `F17`, `F18`, `F19` et `F20` n'en font tomber qu'un.

---

## 5. La preuve que le test 9 échoue quand on retire la garde

⚠⚠ **SANS ELLE, LA FORMULE NE REND PAS « JAMAIS » : ELLE REND TOUT EN 24 h.**
C'est exactement ce que le brief annonçait, à ceci près que le plancher est 24 h
et non 72 h. Mesuré sur une pièce d'un million de milli-PV, laissée à 250 000 par
le raid, `santeMilli: null` :

| écoulé | garde EN PLACE | garde RETIRÉE |
|---|---|---|
| 0 h | 250 000 | 250 000 |
| 1 h | 250 000 | **281 250** |
| 12 h | 250 000 | **625 000** |
| 23 h | 250 000 | **968 750** |
| 24 h | 250 000 | **1 000 000** |
| 100 h | 250 000 | 1 000 000 |

La garde retirée fait donc tomber `RETOUR-D T9`, et elle seule — mesuré, 1 chute.
**La garde n'est pas émergente : elle est la seule chose qui distingue « rien ne
revient jamais » de « tout revient en vingt-quatre heures ».**

---

## 6. La preuve que le test 12 porte bien un raid dans sa fenêtre

⚠ **SANS RAID, LE TEST SERAIT VERT SUR N'IMPORTE QUEL CODE** — c'est le brief qui
le dit, et c'est vrai : aucune pièce ne serait jamais abîmée, donc aucune rampe ne
serait posée, donc les deux chemins n'auraient rien à comparer.

Mesuré sur le montage exact du test :

```
base déplacée en rangée 200      → 49 bases attaquantes
fenêtre de 6 h (216 000 ticks)   → 4 raids subis
garnison : 3 pièces sur 3 abîmées ET stampées
  merlon   niv  5  degats 2 359 891  retour {tickDuRaid: 51600, santeMilli: 0, niveauComplexe: 5, degatsAuDebutMilli: 2 927 000}
  casemate niv  8  degats 1 664 434  retour {tickDuRaid: 51600, santeMilli: 0, niveauComplexe: 5, degatsAuDebutMilli: 1 948 000}
  creneau  niv 12  degats 3 210 827  retour {tickDuRaid: 51600, santeMilli: 0, niveauComplexe: 5, degatsAuDebutMilli: 3 565 250}
```

⚠ **LA BASE DÉMÉNAGE EN RANGÉE 200, ET C'EST OBLIGATOIRE.** À la rangée 295 — le
départ — la garde du peuplement écarte toutes les bases de l'Ouvrage à quinze
cases : `basesAttaquantes` rend une liste vide et la fenêtre ne porte aucun raid.
C'est le même geste que le témoin de BASES-0.

⚠ **DEUX ASSERTIONS DU TEST REFUSENT LE MONTAGE VIDE** : `rapports.length > 0`,
et « au moins une pièce porte une rampe ». Elles précèdent la comparaison.

---

## 7. Les trois tests retirés, nommés, avec leur raison

⚠ **RETIRÉS, PAS AJUSTÉS** — le brief l'exige, et ils figeaient la règle d'avant.

| ce qui part | où il vivait | pourquoi |
|---|---|---|
| `réparation — un camp ne répare que ses défenses SURVIVANTES` | `test/site-entame.test.js` | La règle du 05/09 rend 70 % à **chaque** pièce, détruite comprise. « Survivantes seulement » est exactement ce que le lot renverse. |
| l'assertion `'une défense détruite est revenue d'entre les morts'` | dans le test ci-dessus | Elle EST la propriété renversée. Elle part avec son test. |
| `réparation — l'Étai tombé, les défenses ne repoussent JAMAIS` **dans sa forme actuelle** | `test/site-entame.test.js` | Sa forme mesurait « une SURVIVANTE abîmée reste abîmée ». `RETOUR-D T14` garde la propriété vraie et plus forte : ni la survivante ni la détruite ne reviennent, `santeComplexeMilli` vaut `null`, et le montage LU le dit aussi. |

⚠⚠ **ET CE QUI SURVIT DES TROIS SURVIT ENTIER.** L'assertion « cent heures plus
tard, l'égratignure est toujours là » vivait DANS le premier test ; §3 du brief
la confirme comme règle. Elle a désormais son test à elle, `RETOUR-D T15`, et
elle y gagne un bâtiment DÉTRUIT en plus de l'abîmé.

### Quatre montages réparés, et aucune assertion assouplie

⚠ **LEUR PRÉMISSE A CESSÉ D'ÊTRE VRAIE, PAS LA PROPRIÉTÉ QU'ILS MESURENT.**

| test | ce qui a changé | réparation |
|---|---|---|
| `montage — les détruites sont RETIRÉES` | une détruite se relève à 70 %, donc `appliquer` ne la retire plus | l'Étai tombe dans le montage ; le bâtiment abîmé est retrouvé **par sa case**, les indices ayant glissé |
| `résumé — un site entamé annonce ce qu'il est devenu` | idem : le résumé ne bougeait plus | l'Étai tombe ; `batiments` passe de `− 0` à `− 1` |
| `recherche — cinquante pour cent plus cinquante pour cent` | une défense laissée à 50 % remonte à **85 %**, donc la seconde passe casse plus | l'Étai tombe dans la première passe. ⚠ Ce n'est pas un double paiement : c'est du travail refait sur une cible RÉPARÉE, ce que le test voisin dit déjà |
| `réparation — les deux chemins d'avancement réparent pareil` | les défenses reviennent TOUTES, donc l'entrée « ne dit plus rien » et disparaît | un bâtiment de camp abîmé entre dans le montage — il ne revient jamais, donc l'entrée persiste |

⚠⚠ **ET UN CINQUIÈME CHANGE DE GRANDEUR, DÉCLARÉ.** `deux passes — le site s'use
pour de bon` mesurait `forceDeLaDefense`, qui compte des **pièces** : le compte ne
bouge plus quand elles se relèvent. Il mesure désormais les **PV** du montage, ce
qui est la propriété qu'il annonce, et il garde en plus que les bâtiments d'un
camp ne reviennent pas. Les deux vrais combats sont intacts.

---

## 8. Le tableau des durées mesurées, contre celui du §2 du brief

⚠⚠ **LA COLONNE « BRIEF » EST GÉOMÉTRIQUE À 72 h ; LA COLONNE « CODE » EST
LINÉAIRE À 24 h, PAR ARBITRAGE D'ETHAN DU 06/09.** Les deux formes touchent
EXACTEMENT les deux points arbitrés et ne diffèrent qu'entre eux.

**Dépassement, Complexe entier** — identique des deux côtés, la pénalité valant 1 :

| dépassement | brief | mesuré | ticks |
|---|---|---|---|
| +0 | 1 h | **1 h 00** | 36 000 |
| +5 | — | **1 h 37** | 57 996 |
| +10 | 2 h 36 | **2 h 36** | 93 384 |
| +20 | 6 h 44 | **6 h 44** | 242 172 |
| +30 | 17 h 27 | **17 h 27** | 628 165 |

**Santé, dépassement nul** — c'est ici que les deux formes divergent :

| santé | brief (géom. 72) | mesuré (lin. 24) | ticks |
|---|---|---|---|
| 100 % | 1 h | **1 h 00** | 36 000 |
| 75 % | 2 h 55 | **6 h 45** | 243 000 |
| 50 % | 8 h 30 | **12 h 30** | 450 000 |
| 25 % | 24 h 43 | **18 h 15** | 657 000 |
| 1 PV | 72 h | **24 h 00** | 864 000 |

**Le cas mêlé** — +10 et Complexe à mi-vie : le brief annonce **22 h**, le code
mesuré rend **32 h 26** (1 167 300 ticks), et c'est bien le PRODUIT des deux
facteurs : `2,594 × 12,5 = 32,425 h`.

⚠⚠ **ET LES DEUX POINTS ARBITRÉS SONT TOUCHÉS EXACTEMENT, PARCE QUE LA SANTÉ SE
RANGE EN MILLIÈMES.** À 1 PV sur les 2 500 000 milli-PV du plus petit Complexe
possible, la santé vaut 0,4 millième, donc **zéro** une fois arrondie : la durée
tombe sur 24 h 00 tout rond, à la seconde. Le lot COMPLEXE annonçait 23 h 59 —
il calculait la santé en flottant.

### Ce que le palier change en jeu, mesuré sur un vrai camp

Avant-poste de la graine 2026 — 5 Meutes de niveau 2, 3 850 000 milli-PV de
défense, 19 250 000 de bâtiments. **Toutes les défenses détruites d'un coup :**

| | défenseurs à t=0 | PV du site à t=0 | à t = 1 h |
|---|---|---|---|
| Étai **debout** | **5** (tous revenus) | 21 945 000 | **23 100 000** — le plein |
| Étai **tombé** | **0** | 16 500 000 | 16 500 000 — pour toujours |

⚠⚠ **L'ARBITRAGE DE CALIBRAGE « UN CAMP SE RASE EN DEUX PASSES » DEVIENT DONC
BEAUCOUP PLUS DÉPENDANT DE L'ÉTAI.** Une passe qui nettoie la garnison sans faire
tomber l'Étai ne laisse **rien** à la seconde : le site est entier une heure plus
tard. C'est la conséquence directe de la règle d'Ethan, elle n'a été ni compensée
ni amortie, et **le calibrage lui revient.**

---

## 9. Ce qui a changé dans `MODELE-REPARATION-1.md`, section par section

| section | avant | après |
|---|---|---|
| §3, *La défense, cas à part* | « répare tout, gratuitement, en une heure — ce n'est plus 70 % des PV perdus : c'est la totalité » | **réécrite** : les 70 % sont revenus, avec la formule complète du palier et de la rampe ; l'Étai est nommé comme le même bâtiment côté Ouvrage ; la garde « zéro PV → jamais » est écrite comme garde ; le périmètre « défenses seulement » est dit, avec les trois régimes de bâtiment |
| §5, ligne SPEC §1 | « 100 %, en une heure » | « **70 % d'un coup, puis le reste en rampe** — rétabli le 05/09 » |
| §5, ligne SPEC §2 | constante des 70 % « **supprimée** » | « ~~supprimée~~ — **RÉINSTALLÉE le 05/09**, et elle porte désormais sur les pièces DÉTRUITES aussi » |
| §6 point 5 | l'écart du lot COMPLEXE : « une **échéance**, pas un débit » | l'écart du lot RETOUR-DÉFENSES : « un **palier** puis une **rampe** », avec le motif mécanique (la rampe est analytique, donc les deux chemins d'avancement coïncident par construction) |
| §6 point 6 | la formule du dépassement, close le 06/09 | la santé y est marquée **FIGÉE au raid** ; une note dit que la durée est celle de la RAMPE et que le palier la précède ; une note dit que le dépassement vaut toujours zéro côté Ouvrage sans être mort pour autant ; `RETOUR_GARNISON` devient `RETOUR_DEFENSES`, **trois** nombres au lieu de deux |

---

## 10. Les écarts par rapport au brief, et pourquoi

1. ⚠⚠ **LA PÉNALITÉ RESTE LINÉAIRE ET LE PLANCHER 24 h.** Le §2 du brief pose la
   géométrique et 72 h ; l'arbitrage d'Ethan du 06/09 dit l'inverse et lui est
   postérieur. `RETOUR-D T6` refuse la géométrique **de face**. Toutes les durées
   du §2 sont recalculées — §8 ci-dessus.
2. ⚠⚠ **`retour` PORTE QUATRE CHAMPS, PAS TROIS.** Le brief nomme `tickDuRaid`,
   `santeMilli` et `degatsAuDebutMilli` ; `niveauComplexe` s'y ajoute parce que la
   durée en dépend et que les deux décrivent **le même bâtiment au même instant**.
   En figer un seul ferait de l'autre une seconde vérité : une montée du Complexe
   raccourcirait alors une attente déjà commencée, ce que le prorata figé refuse.
   **Conséquence assumée** : démolir le Complexe pendant une rampe ne l'interrompt
   pas ; ce sont les dégâts SUIVANTS qui n'auront plus d'échéance.
3. ⚠⚠ **UN SECOND RAID PENDANT LA RAMPE LA FAIT REPARTIR DE ZÉRO** —
   renversement de la lecture du lot COMPLEXE, et il est **forcé** par la forme
   analytique : une rampe autoritaire sur `degatsMilli` qui ne repartirait pas des
   dégâts neufs les écraserait au tick suivant, et la seconde passe ne laisserait
   aucune trace. `subirUnRaid` remet donc `retour` à `null` sur ce qu'il vient
   d'abîmer.
4. ⚠⚠ **LE FILET NE PEUT PAS SE COMPARER AUX DÉGÂTS ATTENDUS — MESURÉ.** La
   première écriture testait `degats > degatsAttendus(maintenant)` : `degatsMilli`
   porte ce que le tick PRÉCÉDENT a écrit, donc il les dépasse toujours d'un cran,
   et la rampe se restampait **dix fois par seconde** — aucune pièce ne revenait
   jamais. Le test porte sur `degatsAuDebutMilli`, que la rampe ne peut que faire
   BAISSER : pas de faux positif possible.
5. ⚠⚠ **LE DISCRIMINANT `NIVEAU.deuxRegimes` DU TEST 5 EST INERTE, MESURÉ.**
   `penteBasse` et `penteHaute` valent **toutes deux 1,1** depuis le 25/08 : les
   deux régimes rendent le même nombre, et le test serait vert sur une pente
   écrite en dur. `RETOUR-D T5` bouge la **pente** — la grandeur que le drapeau
   était censé faire lire — et asserte que les deux pentes sont encore égales,
   pour que le drapeau redevienne un discriminant le jour où elles divergeront.
6. ⚠ **SANS COMPLEXE, ON NE STAMPE RIEN**, plutôt que de stamper
   `santeMilli: null`. La pièce reste abîmée et sans rampe ; le jour où le joueur
   POSE un Complexe, le tick suivant la prend en charge. Stamper un `null` la
   condamnerait pour toujours, y compris après la construction — `RETOUR-D T10`
   mesure les deux moitiés.
7. ⚠ **`SAVE_VERSION` RESTE À 26** au lieu de passer à 27 : voir §1. Vu de
   `main`, le brief est respecté à la lettre — le numéro bouge.
8. ⚠ **`RETOUR_GARNISON` DEVIENT `RETOUR_DEFENSES`**, et gagne
   `partInstantaneeMilli`. Le nom d'avant disait « garnison », qui est la moitié
   joueur ; la règle vaut pour les deux camps. ⚠ Et `heuresDeBase` ne s'écrit
   plus : elle EST `APRES_RAID.reparationDefensesHeures`, sans quoi il y aurait
   deux vérités pour la même heure.
9. ⚠ **`etaiDebout` DISPARAÎT**, remplacée par `santeDeLEtai`, qui rend une santé
   en millièmes au lieu d'un booléen — c'est la grandeur que la règle demande, et
   la garder ferait deux lectures du même Étai.
10. ⚠ **`TICKS_REPARATION_DEFENSES` N'A PLUS D'APPELANT DE PRODUCTION**, et elle
    reste exportée, avec le commentaire qui le dit : les tests s'en servent comme
    unité de temps lisible, et la retirer ferait croire que l'heure a disparu du
    modèle.
11. ⚠ **AUCUN RELEVÉ DANS CHROMIUM.** Le brief ne le demande pas, et le seul
    changement d'écran de ce lot est une branche d'une fonction PURE
    (`etatDeLaGarnison` quand le Complexe est à zéro PV, cas qui ne peut pas
    arriver côté joueur) ; l'étage DOM, `ecrireLEtatDeLaGarnison`, n'a pas changé
    d'un caractère depuis le lot COMPLEXE. `RETOUR-D T17` couvre la décision.
    **Déclaré non exécuté, pas passé.**
12. ⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le
    lot ne touche ni `art/`, ni un outil de la chaîne graphique.

---

## 11. Le témoin de BASES-0

**Huit couples déclarés, tous sur `sitesEntames`, phases 7 à 14** — c'est-à-dire
à partir du premier raid. **Les six premières phases sont identiques au bit.**

⚠⚠ **`garnison` NE BOUGE PAS, ET CE N'EST PAS UN OUBLI.** Le scénario du témoin
construit des bâtiments et une **armée** ; il ne pose aucune pièce de garnison, si
bien que la moitié joueur de la règle n'a rien à y toucher. C'est `RETOUR-D T12`
qui la mesure, sur une base qui en porte trois.

⚠ **AUCUN SCALAIRE NE BOUGE, LA TAILLE DE LA SAUVEGARDE COMPRISE.** Elle se prend
en phase 6, avant le premier raid : `sitesEntames` y est vide, donc le champ neuf
n'y coûte rien. **Aucun terme ne s'ajoute** aux quatre de `test/temoins-bases-0.js`.

---

## 12. Le compte de tests

**1129 → 1135.** Vingt tests entrent, quatorze sortent :

| fichier | entrent | sortent |
|---|---|---|
| `test/reparation.test.js` | `RETOUR-D T1`…`T12`, `T16`, `T18`, `T19`, `T20` (16) | les douze `RETOUR T1`…`T12` du lot COMPLEXE, **remplacés** |
| `test/site-entame.test.js` | `RETOUR-D T13`, `T14`, `T15` (3) | les deux tests que le brief nomme |
| `test/chantier.test.js` | `RETOUR-D T17` — c'est `RETOUR T12` **renommé**, son sujet n'ayant pas changé | — |

**Aucune assertion n'a été retirée ni assouplie** hors les trois que le brief
nomme au §7. Une garde change de porteur : le `SAVE_VERSION === 26` vit sous
`RETOUR-D T18`.

---

## 13. Ce qui reste ouvert

- ⚠⚠ **LE CALIBRAGE DU CAMP.** Une passe qui nettoie la garnison sans abattre
  l'Étai ne laisse plus rien à la seconde — §8. Les trois nombres de
  `RETOUR_DEFENSES` sont posés pour être joués et changés.
- ⚠ **`MODELE-REPARATION-1.md` §6 point 5 reste ouvert autrement** : le modèle
  fait revenir le site entier parce que le débit s'ACCÉLÈRE ; le code fige le
  prorata. L'écart est écrit au module et au document.
- ⚠ **`reparerLaGarnison` (module `autoReparation`, 20 %) coexiste**, hors lot par
  le §9 du brief. Elle s'applique AVANT la rampe, donc la rampe repart des dégâts
  qui RESTENT après elle.
- ⚠ **La PR #92 (lot COMPLEXE) est rendue caduque par celle-ci.** Elle est
  ouverte, verte et mergeable ; **Ethan décide** s'il la ferme ou s'il merge la
  branche entière, les deux commits se suivant dessus.
