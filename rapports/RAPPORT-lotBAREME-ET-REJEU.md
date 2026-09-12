# Rapport — lot BARÈME-ET-REJEU

12/09/2026. Second et dernier lot de la journée, après VITESSE.

**Verdict d'ensemble : quatre points sur cinq sont faits, le cinquième — le rejeu
— est ARRÊTÉ sur la condition d'arrêt que le brief pose lui-même, et le coût qui
justifie l'arrêt est publié ci-dessous, chiffré et rejouable.**

---

## 0. Ce qui est mesuré

| | |
|---|---|
| `npm test` | **1601 déclarés · 1600 pass · 0 fail · 1 skipped** (`LIMITE T8`, suspendu par Ethan le 08/09) |
| `npm run check` | sortie **0** |
| `npm run build` | `dist/index.html`, **9 383 670 octets**, 0 référence externe |
| base pristine | `main` = `f6fb04e`, rebâti dans un `git worktree` → **9 383 149 octets** |
| coût | **+521 octets, ENTIÈREMENT DU JAVASCRIPT** |
| ventilation | JavaScript **+521** · feuille **+0** · balisage **+0** · images **+0** · audio **+0** |
| partition | la somme des cinq postes tombe **EXACTEMENT** sur le total, des DEUX côtés |
| `data:` | **306 URI / 307 lignes** de part et d'autre |
| borne T10 | **inchangée à 9 600 000**, marge **216 330 octets, 2,25 %** |
| version | **0.99.53 · build 155**, les deux bumpées ensemble |
| `SAVE_VERSION` | **32, inchangé** — vérifié au diff |

⚠ **Les deux numéros de `package.json` restent des CHAÎNES**, vérifié au type :
`android/app/build.gradle.kts` les lit `as String`, et un nombre y fait tomber le
job Android à la CONFIGURATION — pas à un test, à l'évaluation du Gradle. C'est le
piège que `CLAUDE.md` §6 documente, et la garde de `donnees.test.js` le tient.

⚠ **Le bump ne coûte pas un octet** : `0.99.52` → `0.99.53` et `154` → `155`
gardent leur nombre de chiffres, et le livrable pèse le même nombre avant et après.

### Fichiers touchés

`src/data/combat.js`, `src/sim/combat.js`, `src/sim/deplacement.js`,
`src/sim/state.js`, `src/ui/defense.js`, `src/ui/monde.js`, `package.json`,
`CLAUDE.md`, **quatorze** fichiers de `test/` — dont `pictogramme.test.js`,
RÉANCRÉ —, les DEUX témoins
(`test/temoins-combat.js`, `test/temoins-bases-0.js`). **Entrent :**
`test/bareme-et-rejeu.test.js` et ce rapport.

**Pas une ligne de `src/render/`, `src/son/`, `src/data/` hors `combat.js`,
`tools/` ni `art/`** — vérifié au diff.

---

## 1. Le barème de défense — et la provenance du brief est réfutée

`merlon` 5 → **3**, `casemate` 8 → **10**, `faucheuse` 22 → **30**. Cinq autres
pièces ne bougent pas.

⚠⚠ **LE BRIEF DONNE CES TROIS VALEURS COMME UN RELEVÉ. CONFRONTÉES À
`RELEVE-TA-ARSENAL.md`, AUCUNE DES TROIS N'Y FIGURE SOUS CETTE FORME.** Le relevé
porte 0, 0 et 30. Donc :

| pièce | relevé TA | dépôt avant | arbitrage 12/09 |
|---|---|---|---|
| Mur de défense (`merlon`) | 0 | 5 | **3** |
| Tourelle mitrailleuse (`casemate`) | 0 | 8 | **10** |
| Mirador (`faucheuse`) | 30 | 22 | **30** |

**La `faucheuse` DEVIENT donc conforme au relevé** — ce lot referme un écart
vieux de trois semaines — et les deux autres sont des valeurs d'Ethan sans source
antérieure. Le bloc de déclaration écrit les trois colonnes côte à côte dans
`src/data/combat.js`, pour qu'un lot futur ne défende pas un chiffre en croyant
défendre une mesure. **C'est le §0.6 de `CLAUDE.md` appliqué : la réponse était
dans le dépôt, et elle contredisait le brief.**

⚠ **Les barrières ne sont pas des murs.** `ronce` et `herse` gardent 5. Le
discriminant est `categorie`, jamais le nom.

### `points` a DEUX lecteurs, et le second n'est pas celui qu'on attend

`pointsEngages` borne la composition — c'est celui qu'on cherche. **Mais
`forceDeLaDefense` note la puissance d'un site entamé.** Une garnison déjà posée
qui dépasse son budget est donc TOLÉRÉE — Ethan : « on tolère » —, et c'est la
discipline de `CODES_TOLERES_AU_CHARGEMENT` : on signale, le joueur purge, rien ne
se retire en silence.

### `defense.test.js` T2(b) était un proxy qui ne mesurait rien

Trouvé en le réancrant. Il comparait `floor(290 / 5) = 58` à
`NB_EMPLACEMENTS = 72`, un plafond **INATTEIGNABLE** : le vrai plafond est
`NB_RANGEES × OCCUPANTS_MAX_PAR_RANGEE` = **48**. À 3 points, le budget en paie
**96** — donc la géométrie mord la première, et le test cessait de distinguer quoi
que ce soit.

Il est **RETOURNÉ** : 26 Merlons payables au niveau 8, **dérivés de
`budgetDuNiveau`, jamais écrits**, et il falsifie l'ancienne règle de face en
montrant que 96 dépasse `NB_EMPLACEMENTS`. ⚠ Et il asserte que le budget **ne
tombe pas rond** — 80 n'est pas divisible par 3, il reste 2 points — là où
l'ancien montage tombait juste (seize Merlons à 5 font 80 pile) et ne distinguait
donc pas un `floor` d'un arrondi.

⚠ **L'invariant documenté de `src/ui/defense.js` était doublement faux**, et il
est réécrit avec les nombres mesurés : au niveau 50 la bande sature à **48
Merlons = 144 points sur 290**, soit **146 impossibles à dépenser** ; et
`budgetDuNiveau(1)` valant 45, la PREMIÈRE Faucheuse à 30 passe, la SECONDE est
refusée.

⚠ **Le montage de T7 a perdu sa prémisse, pas son assertion** : dix-huit
Faucheuses à 30 coûtent 540 pour un budget de 290. Il pose les Casemates sur les
seules rangées 3 à 5 et **calcule** son coût — 270 ≤ 290 — plutôt que de l'écrire.

---

## 2. Une pièce abîmée ne s'améliore plus

Ethan : « ça doit bloquer ». Le code `abimee` entre dans
`problemesDeLAmelioration` (bâtiments) **et** dans
`problemesDeLAmeliorationDEffectif` (garnison et assaut) — deux portes, une règle,
et les deux sont falsifiées séparément (§7, F6 et F8).

⚠ **Il est poussé AVANT la boucle des coûts et ne rend pas**, pour que le joueur
lise les DEUX faits d'un coup. Mesuré au doigt, écran Offense : l'avis dit
**« sans Centre de commandement, aucune pièce ne monte ; abîmée : réparez-la
d'abord »**. Un `return` hâtif aurait caché la seconde moitié.

### La raison est arithmétique, pas un goût

`degatsMilli` est un ABSOLU de milli-PV quand `pvMax` suit le niveau par
`facteurMilli`. Monter une pièce entamée la rend donc **relativement plus saine
sans lui rendre un seul PV**, et le prix de sa remise en état monte avec son
niveau : l'amélioration était un demi-soin payant. C'est écrit à côté du code.

⚠ **Aucune phrase n'est écrite dans `src/ui/`** : les deux écrans reprennent le
message du moteur mot pour mot, comme ils le font des huit autres refus.

⚠ **`CH-F T8` n'a pas eu à être réécrit — ÉCART AU BRIEF, DÉCLARÉ.** Il monte
DÉJÀ le niveau dans son montage, donc sa prémisse tient. Ce qui a dû être réparé
est `AMÉLIORER-PIÈCE` de `state.test.js`, qui abîmait sa pièce AVANT de
l'améliorer, et `état — améliorer sans les ressources`, qui a été RESSERRÉ : il
asserte désormais qu'aucun problème n'existe avant d'écrire les dégâts, puis
`abimee` PUIS un `manque:` sur le même appel.

---

## 3. Le chevauchement allié, et le repli qui ne mord plus derrière une alliée

Ethan, sur une vraie partie : **« les véhicules étaient à 80 % sur l'infanterie,
plutôt que d'attendre derrière. Puis ils ont disparu. Mais 0 détruit. »**

**Les deux moitiés de sa phrase sont DEUX règles distinctes.**

### 3.1 — le dessin, converti en pixels

`caseDepuisMilli` est un `floor` : une unité à `rangeeMilli = 17 960` est en
case 17 pour le moteur, et **`yDeRangeeMilli` projette la POSITION, pas
l'indice**. Converti par la projection RÉELLE de l'écran de raid, à la géométrie
du S25 FE plein cadre (`tailleCase` 120, `margeY` 90) :

| | `rangeeMilli` | y peint | part du chemin vers la case 18 |
|---|---|---|---|
| AVANT | 17 960 | 94 | **96,7 %** |
| APRÈS | 17 000 | 210 | **0,0 %** |

**116 pixels de buffer, soit 96,7 % d'une case** — et après le lot l'unité tombe
sur le bord de sa propre case **au pixel**. ⚠ Ethan estimait 80 % ; la mesure dit
96,7 %. Son œil avait raison sur le fait, pas sur le nombre.

### 3.2 — le repli, et les zéro pertes

Bloquée derrière une alliée, l'unité comptait ses trente `TICKS_AVANT_REPLI` et
**rentrait à la base sans avoir été détruite** — d'où le « 0 détruit ».
`ticksInutiles` est désormais GELÉ tant qu'une alliée occupe la case devant.

⚠⚠ **`structureImmobileSur` devient `chevauchementInterditSur`, et elle ne
s'élargit QUE du côté allié.** « Pas de chevauchement allié ni horizontal ni
vertical. Totalement interdit. » **Un bloqueur ENNEMI garde le comportement
d'aujourd'hui, et c'est mesuré** : le témoin de `test/combat.test.js` — un
Ratisseur bloqué par un Bélier — reste figé à **2 960** et **VIVANT**, test vert
sans une ligne de changée. L'élargir aux deux camps aurait renversé un arbitrage
que personne n'a demandé.

⚠⚠ **ET LE SECOND PRÉDICAT N'EST PAS DÉRIVÉ DU PREMIER, DÉLIBÉRÉMENT.**
`allieeDevant` est une fonction À PART, parce que `chevauchementInterditSur` est
aussi vraie devant une STRUCTURE IMMOBILE — où `TICKS_AVANT_REPLI` **DOIT**
mordre : une unité qui ne peut pas blesser un mur doit rentrer, et `MUR T6 bis` le
garde depuis le lot MUR. Geler le repli devant une structure aurait fait de ce
lot-ci un renversement silencieux de celui-là. Les falsifications F9 et F10 se
DISTINGUENT sur exactement ce point (§7).

⚠ La condition est nommée UNE fois, deux lecteurs : `gelParUneAlliee` sert la
décision de rangement ET celle du repli.

### 3.3 — ce que ça déplace, dans TROIS directions

Mesuré sur les 200 témoins de combat :

| | avant | après |
|---|---|---|
| `souche` | 25 | **27** |
| `attaquants` | 173 | **171** |
| `duree` | 2 | 2 |

**Six combats changent de cause, et les trois sens y sont :**

| combat | cause | tick |
|---|---|---|
| `avantPoste/richeQuartz/n20/g1` | `duree` → `attaquants` | 900 → **429** |
| `avantPoste/richeScorie/n20/g1` | `duree` → `attaquants` | 900 → **429** |
| `camp/richeQuartz/n20/g5` | `attaquants` → `duree` | 523 → **900** |
| `camp/richeScorie/n20/g5` | `attaquants` → `duree` | 523 → **900** |
| `avantPoste/richeQuartz/n20/g5` | `attaquants` → **`souche`** | 485 → **727** |
| `avantPoste/richeScorie/n20/g5` | `attaquants` → **`souche`** | 485 → **727** |

Deux cessent de buter sur le plafond de 900 et concluent ; deux s'y mettent ; et
**deux RASENT leur site** là où ils y perdaient toute leur armée. **182 ticks de
fin sur 200 bougent — 135 plus longs, 47 plus courts** : un ralentissement
uniforme n'aurait pas produit ça.

**Aucun barème n'a été touché. Le calibrage revient à Ethan.**

### 3.4 — l'attribution est mesurée, pas déduite

En rendant `src/sim/combat.js` **SEUL** à son état pristine sous le reste du lot,
les deux cents témoins rendent **0 écart sur 1 600 champs**. Confirmé
structurellement : `DEFENSES[].points` n'est lu ni par `sim/generateur.js` ni par
`sim/combat.js` — seul `UNITES[].points` l'est. **Le barème ne déplace donc aucun
combat** ; tout l'écart vient du §3.

### 3.5 — les témoins sont surchargés d'une couche, jamais recapturés

`COMBATS_DEPLACES_PAR_BAREME_ET_REJEU` porte **1 089 champs sur 1 600, soit
68 %** — sous les 71 % qu'APPROCHE citait pour se recapturer. **Mais le motif
n'est pas le compte** : une recapture n'est légitime qu'APRÈS que `JOURNAL T1 bis`
a prouvé le MOTEUR inchangé, et **le moteur est ce qui change ici**. On empile.

⚠⚠ **Et c'est l'invariance de `T1 bis` qui dit ce que le lot touche : 1 064 champs
déplacés pour seulement DEUX nouveaux à surcharger** — 1 331 → **1 333**. Le lot
bouge donc le MÊME axe qu'ARRÊT, COLONNE et MUR — la FILE — et pas le tir ni le
ciblage : ceux-là auraient brisé les 269 causes qui tiennent encore.

⚠ **`JOURNAL T8` est réancré de 2 à 3 écrasées, et ce n'est pas un
assouplissement** : mesuré avant/après sur un arbre pristine, le témoin propre de
l'exception — la Carapace écrasée — est IDENTIQUE, et une contre-assertion
`notEqual 2` refuse le retour de l'ancien nombre.

⚠ **Le témoin de BASES-0 prend sa vingt-deuxième couche** — 37 couples, phases
p07 à p14 —, plus trois tables de rapport : **22 graines sur 25** (les 3, 9 et 15
sont identiques AU BIT), **9/25** côté proche et **14/25** côté Ouvrage, la forme
INVERSE de celle du lot MUR. **Aucun scalaire ne bouge** — 17 champs sur 25
graines sur 25 — et **une seule position** se déplace, celle de la graine 17
(200,16 → 220,16 en p13), qui **converge** à 280,16 en p14.

---

## 4. Le rejeu d'un raid — ARRÊTÉ, et voici le chiffre

Le §4 du brief écrit : « **MESURER LE COÛT AVANT DE LE FAIRE, ET LE PUBLIER** […]
Si le surcoût d'une sauvegarde dépasse ce qui paraît raisonnable, s'arrêter et le
dire à Ethan plutôt que de tailler dans le montage : un montage incomplet rejoue
faux, et un rejeu faux est pire qu'aucun rejeu. »

**La mesure a été faite. Elle dépasse. Le lot s'arrête là.**

### 4.1 — ce qu'un rapport porte déjà, et ce qu'il ne porte pas

Un rapport porte **dix-huit champs** : `sens, cible, cout, cause, ticks, butin,
rechercheMilli, rase, unitesEngagees, unitesAuPlancher, pointsRestants,
restantDefense, restantBatiments, restantSouche, restantEtai, reparationInduite,
verdict, tick`.

Le MONTAGE que `creerCombat` exige porte **neuf champs que le rapport n'a pas** —
`type, niveau, saveur, obstacles, batiments, defenseurs, vagues, modulesDebloques,
majorationsPoi`. Sur un montage réel mesuré : **rapport 631 o, montage 1 270 o**.
Ranger le montage **TRIPLE** donc le rapport, avant même de parler de la base.

### 4.2 — et le coût irréductible est la base du joueur telle qu'elle était

Un raid SUBI se rejoue contre la garnison de l'époque ; un raid MENÉ avec l'armée
de l'époque. Ni l'une ni l'autre n'est déductible : `sitesEntames` est écrasé par
les raids suivants, et la garnison comme l'armée sont réparées entre-temps.
Mesuré, script rejouable :

| état de la base | bât / garnison / armée | par rapport | sauvegarde | × 10 rapports | sauvegarde |
|---|---|---|---|---|---|
| base neuve | 4 / 62 / 36 | 7 780 o | 8 948 o | 77 800 o | **×9,7** |
| base à moitié pleine | 20 / 62 / 36 | 8 908 o | 10 716 o | 89 080 o | **×9,3** |
| base pleine | 40 / 62 / 36 | 10 312 o | 12 920 o | 103 120 o | **×9,0** |

La borne est `APRES_RAID.rapportsGardes` = **10**. **Une sauvegarde qui décuple
pour une fonction de CONSULTATION n'est pas « ce qui paraît raisonnable ».**

### 4.3 — et l'arbitrage que le §4 renverse avait déjà écrit cette raison

`src/sim/raid.js`, au-dessus de `montageDuRaid` :

> ⚠ ET IL NE VOYAGE PAS DANS LE RAPPORT. Le mettre dans le rapport le ferait
> entrer dans les dix rapports gardés, donc dans la sauvegarde : c'est exactement
> ce que « ne pas stocker le combat » interdit. L'écran le demande AVANT le raid,
> s'en sert pour rejouer, et le jette.

**Le code avait anticipé la question et donné sa raison ; la mesure la confirme.**
C'est le §0.6 de `CLAUDE.md` par l'autre bout — la réponse était dans le dépôt.

### 4.4 — les issues, pour Ethan, aucune prise ici

1. **Ne rien faire.** Le journal reste une lecture ; un rapport dit ce qui s'est
   passé, il ne le rejoue pas. Coût zéro.
2. **Baisser `rapportsGardes`** pour financer le montage — par exemple trois
   rapports rejouables au lieu de dix consultables. C'est un arbitrage de JEU :
   il retire de l'historique pour ajouter du rejeu.
3. **Ne rejouer que le DERNIER raid.** Un seul montage rangé, donc ×1,9 au lieu
   de ×9,7 sur une base neuve. C'est le meilleur rapport, et c'est aussi ce que le
   joueur demande le plus souvent — « qu'est-ce qui vient de se passer ».
4. **Rejouer APPROXIMATIVEMENT**, depuis l'état d'aujourd'hui. **Écarté de face** :
   le brief l'interdit en toutes lettres, « un rejeu faux est pire qu'aucun
   rejeu », et le journal garde déjà depuis le lot RAPPORTS-ET-PLEIN la propriété
   qu'aucun chiffre n'est recomposé depuis l'état courant (`JRN T9`).

**Conséquence sur le §7 du brief : son T2 ne peut pas être écrit.** Écrire un test
sur un rejeu qu'on n'a pas fait serait pire que de n'en pas écrire. Sa place est
prise par le §5 — voir §6 ci-dessous.

---

## 5. L'aperçu de territoire au déplacement — reproduit, puis corrigé

Ethan : **« Simulation de territoire en cas de déplacement : échec »**.

### 5.1 — la fonction n'avait rien

Le brief le disait, et c'est vrai : **« LA FONCTION EXISTE, ELLE EST CÂBLÉE, ET
ELLE EST TESTÉE. Ne pas l'écrire une seconde fois. »** Mesuré :
`bilanDuTerritoire` rend **1 305 bilans non nuls sur 1 305** sur cinq graines.
**Rien n'a été réécrit, et aucune formule d'influence n'a été touchée.**

### 5.2 — le défaut, reproduit avant de toucher une ligne

`demanderLeDeplacement` **SORTAIT par `refuserLeGeste` avant de peindre ses
lignes** : le bilan ne s'affichait donc que sur une case ACCEPTÉE. Or :

| rangée de la base | cases atteignables (20 graines) |
|---|---|
| 295 (départ) | 261 |
| 290 | 269,9 |
| 285 | 172,9 |
| 280 | 83,2 |
| 275 | 13,4 |
| **272 et au-dessus** | **0 sur 20 graines sur 20** |

Et **ZÉRO pendant toute l'heure qui suit un déplacement**. **Le joueur ne pouvait
voir la simulation qu'aux instants où il n'en avait pas besoin.**

### 5.3 — reproduit dans Chromium, sur le livrable, avant ET après

Géométrie du S25 FE (360 × 780, dpr 3), sauvegardes injectées dans
`localStorage`, sur le livrable **PRISTINE** puis sur celui du lot.

| cas touché | refus | corps AVANT | corps APRÈS |
|---|---|---|---|
| délai en cours (la base vient de bouger) | `delai` | **(VIDE)** | Distance 2 cases · Immobilisée 1 h · gagnées 10 · perdues 10 · Solde 0 |
| rangée 272 | `voisinage` + `territoire-ennemi` | **(VIDE)** | Distance 3 cases · Immobilisée 1 h · gagnées 1 · perdues 1 · Solde 0 |
| sa propre case | `sur-place` | (VIDE) | **(VIDE)** |

Zéro erreur de page, débordement horizontal 0, accord fermé dans les trois cas.

### 5.4 — la décision : le bilan s'affiche sous un refus de PERMISSION, jamais de GÉOMÉTRIE

**Et la partition est FORCÉE par le moteur, pas choisie.** `CODES_DE_GEOMETRIE`
entre dans `sim/deplacement.js` : `delaiDuDeplacementVers` **LÈVE** sur
`hors-carte`, `sur-place` et `trop-loin`, et sur eux seuls — `delaiPourLaBase`
borne la distance à `[1, porteeMaxCases]`, et ces trois refus rendent des
distances de **300, 0 et 40** sur une base neuve en rangée 295. Peindre sans ce
partage remplacerait un fait de JEU par un fait de PROGRAMME, ce que l'en-tête de
`demanderLeDeplacement` interdit deux paragraphes plus haut. **Falsifié : c'est
exactement ce qui arrive** (§7, F2).

⚠ **La confirmation n'en reçoit pas, décision écrite.** Elle relit les problèmes
parce que le MONDE a pu bouger entre le toucher et l'accord — un raid qui rase
déplace la base de vingt rangées — donc son refus ne parle pas de la case, et le
joueur a déjà vu le bilan un toucher plus tôt. **Une ligne suffit à le lui
remettre si Ethan tranche autrement.**

⚠ **La FONDATION n'en reçoit pas non plus**, et c'est l'arbitrage de BASES-2, pas
un oubli : `bilanDuTerritoire` chiffre ce que gagne une base qui SE DÉPLACE ; une
base neuve qui S'AJOUTE est une autre grandeur, et la réutiliser afficherait un
nombre plausible et faux.

### 5.5 — `PC T3` est resserré, pas bumpé, et il avait raison de tomber

Il comptait `bilanDuTerritoire(` et exigeait **2** ; le lot en fait entrer un
second dans la MÊME fonction, sur la branche du refus. **Écrire `3` aurait été
assouplir** : un nombre nu autorise un appel n'importe où. Le total se **DÉRIVE**
désormais de ce que `demanderLeDeplacement` porte, plus sa déclaration — un appel
ajouté dans `dessiner`, dans `rafraichir` ou dans la confirmation fait tomber
l'égalité sans qu'on ait eu à le prévoir.

⚠⚠ **ET UNE ASSERTION DE COÛT A DÛ ÊTRE REFAITE DEUX FOIS AVANT DE MESURER LA
RÈGLE — c'est la leçon du lot.** La première comparait un compte ABSOLU (2) :
relevé **11**, parce qu'un toucher arme, désarme et repeint. La seconde exigeait
`coutGeometrie + unBilan === coutPermission` en mesurant `unBilan` par un appel
direct : relevé **5 + 2 contre 16**, et l'écart n'est pas une faute du code, c'est
le **MÉMO** — `territoireDeLaFenetre` partage une entrée par graine depuis
MÉMO-DES-TOURS, donc le premier bilan d'une fenêtre la peuple (onze lectures) et
le second la relit (deux). **Asserter cette égalité aurait mesuré le mémo et non
la règle.**

Ce qui est asserté est le **ZÉRO** : un refus de géométrie coûte EXACTEMENT ce que
coûte un repeint nu — **5 contre 5, donc il ne calcule RIEN** — et un refus de
permission coûte strictement plus, **16**.

---

## 6. Les tests

**Le compte passe de 1 599 à 1 601. Aucune assertion n'a été retirée ni
assouplie.**

### Deux tests entrent

- **`BR T1`**, dans `test/bareme-et-rejeu.test.js` — le chevauchement et le
  repli, et **chaque assertion NOMME sa moitié** pour qu'un lot qui n'en défait
  qu'une sache laquelle. Montage : un Guetteur au FOND (rangée 18, la plus lente
  du roster) qui TIRE sur un bâtiment à deux colonnes — donc son compteur reste à
  zéro et il ne part pas —, et un Ratisseur deux fois plus rapide derrière lui,
  **sans aucun ennemi à sa portée**. Les quatre prémisses sont assertées avant
  toute mesure.
- **`BR T2`**, dans `test/monde.test.js` — le §5. **Il est là et pas dans le
  fichier du lot parce qu'il a besoin du FAUX DOCUMENT de l'écran Monde, qui est
  local à ce fichier-là** : le recopier en aurait fait deux, dont un seul aurait
  reçu la prochaine correction. Il est la moitié comportementale de `PC T3`, et il
  reprend le montage de `DÉ T9` — qui avait la prémisse sans l'assertion.

**La substitution est déclarée dans les deux fichiers** : le T2 du brief portait
sur le rejeu, qui est arrêté.

### Trois gardes RETOURNÉES

| garde | ce qu'elle exigeait | ce qu'elle exige |
|---|---|---|
| `defense.test.js` T2 | 16 Merlons, et un plafond inatteignable | 26 **dérivés**, et la géométrie mord la première |
| `MUR T4` | la verticale flue jusqu'à 2 960 | **2 000**, multiple exact, `notEqual 2960` |
| `MUR T6 bis` | la latérale flue | **4 000**, et l'ancienne valeur refusée par son nom |

⚠ **`MUR T4` n'est pas au brief — ÉCART DÉCLARÉ.** Il ne nomme que `MUR T6 bis`,
la moitié LATÉRALE ; `MUR T4` est la moitié VERTICALE, et elle figeait exactement
la règle que ce lot renverse. En laisser une des deux aurait laissé `main` rouge.

### Douze réancrages, chacun en écrivant le nombre d'avant à côté de celui d'après

`repli.test.js` T4 (retourné) et T6 (489 → **509**, butin {36,12} → **{1541,513}**,
survivants 5 → 3) · `colonne.test.js` `COL T18 bis` (3 → **2** triplets) ·
`arsenal.test.js` T7 (`derriere` 327 → **338**) et T10 (489 → **509**) ·
`roster.test.js` T5 (162 → **193**) et T6 · `assaut.test.js` T7 ·
`cible.test.js` T5 (la liste des raids au plafond change de contenu) ·
`journal.test.js` T1, T1 bis et T8 · `recherche.test.js` `MODULES-F T14`
(**valeurs seules, graines inchangées**) · `bases.test.js` (vingt-deuxième couche).

⚠⚠ **LE DOUZIÈME EST `PIC T7`, ET IL A ÉTÉ TROUVÉ PAR LA RELECTURE HOSTILE DU
§10, PAS PAR LE BRIEF.** Son ancre écrivait **9 383 149** — juste, c'est le
livrable pristine que ce lot mesure contre — et le disque en rend **9 383 670**,
soit les **521 octets** du lot. Sous la tolérance de 50 000, donc **VERT**, et
faux : `CLAUDE.md` annonçait déjà la marge de **216 330 octets, 2,25 %** pendant
que le test écrivait 216 851 et 2,26. **Les deux documents se contredisaient, et
c'est exactement ce que la dernière assertion de ce test existe pour empêcher** —
« la tolérance garde contre la dérive LENTE, pas contre un lot qui sait ce qu'il
déplace ».
⚠ **DEUX RÉANCRAGES DE `PIC T7` LE MÊME JOUR, ET C'EST CE QU'ON LUI DEMANDE.**
VITESSE l'a porté de 9 377 421 à 9 383 149 le matin ; celui-ci l'amène à
9 383 670. Un lot qui connaît sa ventilation au poste près le réécrit, quelle que
soit la marge qui lui reste — 521 octets sont un centième de la tolérance, et
c'est précisément le régime de dérive que quatre lots successifs ont laissé
s'accumuler jusqu'à 9 965 octets avant BASES-2.

⚠ **`COL T6 bis` et `test/combat.test.js` restent verts, sans une ligne de
changée** — ce sont les deux témoins du côté ENNEMI, et c'est ce qui dit que le
lot ne les a pas touchés.

⚠⚠ **`MODULES-F T14` : une erreur de ma part, corrigée.** J'ai d'abord conclu que
la graine 9 avait perdu sa prémisse et je l'ai remplacée par la graine 1, avec un
long commentaire justificatif. **C'était mon script de mesure qui employait
`GRILLE.bandes.deploiement.premiere` là où le test emploie `.derniere`.** Remesuré
correctement : les trois graines discriminent toujours, et le balayage rend **les
mêmes onze** que le lot MUR (7, 9, 18, 24, 33, 36, 39, 51, 52, 56, 57). La
substitution de graine a été annulée ; c'est un réancrage de VALEURS, et rien de
plus.

---

## 7. Falsifications

**Onze jouées, onze chutes. Une douzième ne mord pas et se déclare.**

| | falsification | ce qui tombe |
|---|---|---|
| F1 | le `return` d'avant le lot dans `demanderLeDeplacement` | `BR T2` **et** `PC T3` |
| F2 | le partage `CODES_DE_GEOMETRIE` retiré | `BR T2`, **par une LEVÉE** (`distance « 0 »`) |
| F3 | le bilan calculé AVANT le partage | `BR T2`, l'assertion de coût **par son nom**, + `PC T3` |
| F4 | un appel de bilan dans `dessiner` | `PC T3` seul |
| F5 | Merlon rendu à 5 | `defense.test.js` T2 seul |
| F6 | le refus `abimee` retiré des BÂTIMENTS | `état — améliorer sans les ressources` |
| F7 | Faucheuse rendue à 22 | `defense.test.js` T7 |
| F8 | le refus `abimee` retiré de l'EFFECTIF | `AMÉLIORER-PIÈCE` |
| F9 | le chevauchement rouvert aux alliées | `BR T1`, `MUR T4`, **`MUR T6 bis`**, `repli` T4, T6 |
| F10 | le gel du repli derrière une alliée retiré | `BR T1`, `MUR T4`, `repli` T4, T6 — **SANS `MUR T6 bis`** |
| F11 | Casemate rendue à 8 | `defense.test.js` T7 |

⚠ **F9 et F10 se DISTINGUENT sur `MUR T6 bis`** : c'est ce qui dit que les deux
règles du §3 sont bien deux, et qu'aucune ne recouvre l'autre.

### ⚠⚠ Deux d'entre elles ont dû être rejouées parce que le patch n'avait jamais été appliqué

C'est la leçon du lot. Un `sed` sur `points: 3, categorie: 'mur'` et un autre sur
la ligne du repli **n'ont rien remplacé** — les champs ne sont pas sur la ligne que
je croyais —, et la suite est restée VERTE. Lue sans vérifier, la conclusion aurait
été « le barème n'est gardé par personne » : **faux**, `T2` porte le pin ET le
nombre dérivé. **Une falsification s'ASSERTE appliquée avant que son verdict ne
soit cru.** Les onze le sont désormais, chacune derrière un
`assert s.count(v) == 1`.

### La douzième se déclare

La lecture « est-ce le PREMIER problème » au lieu de « y en a-t-il un » : mesurée
sur quatre montages, elle rend le **MÊME** mot que le `some`, parce que
`problemesDuDeplacement` pousse les trois codes de géométrie **EN TÊTE et sans
condition**. On écrit `some` quand même — c'est ce que la ligne VEUT dire, et ce
qui restera juste le jour où un refus de permission passera devant — et *un test
qui ne peut tomber sur aucun état d'aujourd'hui se déclare, il ne se compte pas*.

---

## 8. Les gestes, au doigt, dans un vrai navigateur

Chromium, géométrie du S25 FE, sauvegardes injectées dans `localStorage`.
**Cinq gestes, tous avec un AVANT/APRÈS sur le même montage.**

1. **Une sauvegarde écrite par l'arbre PRISTINE se charge** — elle est produite
   par `serialiser` du commit `f6fb04e`, donc c'est bien une sauvegarde d'avant le
   lot. La barre du bas dit « Base 3,0 · Défense 1,0 · Offense 1,0 », aucun avis.
2. **Un BÂTIMENT abîmé refuse de s'améliorer** — mode Améliorer armé, la Caserne
   touchée : **« abîmé : réparez-le d'abord »**, le message du moteur mot pour mot.
3. **Une PIÈCE D'ARMÉE abîmée refuse, et le refus s'ACCUMULE** — avant :
   « sans Centre de commandement, aucune pièce ne monte » ; après : **« … ;
   abîmée : réparez-la d'abord »**. C'est l'accumulation démontrée à l'écran, pas
   seulement en test.
4. **Le barème de défense, dans le bandeau** — le même Merlon posé, la même
   sauvegarde : **« 5 Pts déf. » → « 3 Pts déf. »**. Débordement horizontal 0.
5. **L'aperçu de territoire sur une case refusée** — les trois cas du §5.3.

⚠ **Et l'écran de raid a été OUVERT au doigt**, depuis la carte, sur un camp
trouvé par balayage : **48 356 poses de sprite, `#raid-fin` encore caché, zéro
erreur de page**. ⚠ **CE QUI N'A PAS ÉTÉ VU : la position d'un sprite INDIVIDUEL
pendant ce raid.** Le fait du §3.1 est converti en pixels par la projection
RÉELLE, qui est pure et testée — mais le sprite de l'unité bloquée n'a pas été
isolé à l'écran, et je le déclare **non exécuté** plutôt que de laisser croire
qu'il l'a été.

⚠ **La vérification « une sauvegarde d'avant le lot charge avec ses dix rapports
marqués *pas rejouable* » est SANS OBJET** : le §4 s'est arrêté, aucun champ
n'entre dans le rapport, et il n'y a donc rien à marquer.

---

## 9. Écarts au brief, tous déclarés

1. **La branche.** Le brief demande `claude/bareme-et-rejeu` ; l'environnement
   d'exécution épingle la session à `claude/new-session-ae87x9` et interdit de
   pousser ailleurs sans autorisation explicite. Le lot y est poussé d'un seul
   tenant.
2. **La provenance du barème** (§1) : les trois valeurs ne sont pas un relevé.
3. **`CH-F T8`** (§2) n'a pas eu à être réécrit — sa prémisse tient.
4. **`MUR T4`** (§6) n'est pas nommé par le brief, et devait être retourné.
5. **Le `sorti = true` « au tick 30 »** du §3 : mesuré **38**, parce que l'unité
   AVANCE réellement pendant les huit premiers ticks avant d'être bloquée, donc
   son compteur ne part pas de zéro au tick zéro. `BR T1` porte le nombre mesuré.
6. **Le T2 du §7** (§4) n'existe pas ; sa place est prise par `BR T2` sur le §5.
7. **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : le lot
   ne touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff.

---

## 10. Ce qui reste ouvert, pour Ethan

1. **Le rejeu (§4.4).** Quatre issues, chiffrées, aucune prise.
2. **Le calibrage du combat (§3.3).** Six causes de fin changent, 182 ticks sur
   200 bougent, deux raids rasent désormais leur site. Aucun barème n'a été
   touché.
3. **Le statut « gratuite » de la Casemate** reste en suspens au classeur, et
   `defense.test.js` T2 s'adosse au Merlon pour cette raison.
4. **Le bilan sur une confirmation refusée** (§5.4) : une ligne, si Ethan le veut.
