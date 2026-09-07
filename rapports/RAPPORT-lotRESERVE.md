# RAPPORT — lot RÉSERVE : le temps de réparation devient un stock

Écrit le 01/09/2026, en fin de session, sur disque et à la racine.
Brief de référence : `BRIEF-lotRESERVE.md`.

---

## 1. Version et build produits

| Grandeur | Avant | Après |
| --- | --- | --- |
| `package.json` `version` | 0.59.0 | **0.60.0** |
| `package.json` `config.build` | `"60"` | **`"61"`** |

⚠ **LES DEUX SONT RESTÉS DES CHAÎNES**, vérifié par exécution après l'édition —
`typeof` rend `string` pour les deux. C'est le piège de `CLAUDE.md` §6 : Kotlin
les lit `as String` dans `android/app/build.gradle.kts`, et un nombre y fait
tomber le build Android à la CONFIGURATION, avant le moindre test. Aucun test JS
ne le verrait ; la garde de `donnees.test.js` est passée.

Le bump est dû : `dist/index.html` change (voir §3).

---

## 2. Base de référence du §1 du brief — retrouvée sur le dépôt

Les cinq nombres, re-mesurés avant de toucher à quoi que ce soit :

| Grandeur | Attendu par le brief | Mesuré | Verdict |
| --- | --- | --- | --- |
| `version` / `build` | 0.59.0 / 60 | 0.59.0 / 60 | ✅ |
| `dist/index.html` | 1 339 823 o | **1 339 823 o** | ✅ |
| `node --test "test/*.test.js"` | 792 pass / 0 fail | **792 pass / 0 fail** | ✅ |
| `SAVE_VERSION` | 16 | 16 (`state.js:41`) | ✅ |
| `reparation.js` / `reparation.test.js` | 343 / 303 lignes | 343 / 303 | ✅ |

**Base intégralement reproduite.** Le §7 « la base de référence n'est pas
retrouvée » ne s'est pas déclenché.

---

## 3. Delta et comptes

| Grandeur | Avant | Après | Delta |
| --- | --- | --- | --- |
| `dist/index.html` | 1 339 823 o | **1 339 813 o** | **−10 o** |
| Tests | 792 | **799** | +7 |
| `src/sim/reparation.js` | 343 l. | 555 l. | +212 |
| `test/reparation.test.js` | 303 l. | 615 l. | +312 |

⚠ **CE LOT REND DES OCTETS, ET C'EST LE PREMIER DEPUIS BÂTIMENTS-1024.** Il
remplace un chronomètre par trois compteurs : quatre fonctions sortent
(`lancerLaReparation`, `avancerLaReparation`, `annulerLaReparation`,
`problemesDeLaReparationEnCours`), sept entrent, plus courtes. Le gain net est de
dix octets — négligeable, et c'est le fait : **ce lot n'est pas une optimisation,
il ne coûte simplement rien.** La borne T10 de 1 400 000 n'a pas été touchée ;
marge **60 187 octets, 4,30 %**.

Le module gagne 212 lignes alors qu'il perd des fonctions : ce sont des
commentaires. L'en-tête a été **réécrit**, pas raboté, comme le §3.1 l'exigeait.

**Suite finale : `npm run check` → build OK, `799 pass / 0 fail`.**

---

## 4. Chaque test du §6, avec le montage de falsification effectivement joué

Toutes les falsifications ont été jouées **par injection de défaut sur une copie
fraîche** (`src/` et `test/` recopiés depuis le dépôt avant chaque injection),
jamais sur l'arbre de travail. Verdict attendu : ROUGE.

| # | Test | Falsification injectée | Verdict |
| --- | --- | --- | --- |
| T1 | `n` ticks créditent `n` ticks dans chaque réservoir | crédit forcé à `+ nbTicks * 2` | **ROUGE** ✅ |
| T2 | plafond 12 h + 1 h × niveau, armée vide → 12 h pile | `/ DIXIEMES_PAR_NIVEAU` retiré | **ROUGE** ✅ |
| T3 | `tickJeu` × n ≡ `rattraperJeu(n)` sur l'état entier | réserve tenue en **secondes flottantes** | **ROUGE** ✅ |
| T4 | parallélisme : vider `escouade` ne touche pas les deux autres | les trois débités ensemble | **ROUGE** ✅ |
| T5 | réparer débite ET rend les PV dans le même appel | `degatsMilli = 0` retiré | **ROUGE** ✅ |
| T6 | réserve insuffisante : le manque est dit, rien ne bouge | débit placé **avant** la vérification | **ROUGE** ✅ |
| T7 | sans son bâtiment, un châssis ne se répare pas | *(test conservé, cf. §6)* | ✅ PASS |
| T7 bis | le refus sans bâtiment a son **propre** code | code changé en `reserve-insuffisante` | **ROUGE** ✅ |
| T8 | coût scorie additif, gratuit au niveau 1 | *(tests conservés, cf. §6)* | ✅ PASS |
| T9 | `toutReparer` répare tout le payable et compte le reste | `continue` → `break` | **ROUGE** ✅ |
| T10 | un raid ne touche plus aux réserves | remise à zéro des réserves dans `executerRaid` | **ROUGE** ✅ |
| T11 | la sauvegarde traverse ; `reparation` absente | migration remet `s.reparation = null` | **ROUGE** ✅ |

### ⚠⚠ T3 : la PREMIÈRE falsification est passée VERTE, et il faut savoir pourquoi

Le brief demandait « remplacer le crédit analytique par une boucle avec arrondi
flottant ». Écrite littéralement — une boucle qui accumule `0.1` puis
**réentière** par `Math.round(secondes * TICKS_PAR_SECONDE)` à chaque appel —,
elle laisse la suite **entièrement verte**.

**Ce n'était pas une garde molle : ce n'était pas un défaut.** Un accumulateur
flottant réentièré à chaque appel rend exactement le même nombre que l'addition
d'entiers ; c'est une implémentation ÉQUIVALENTE, pas une cassée. Ce qui rompt
l'équivalence des deux chemins, c'est de **garder l'accumulateur en flottant**
entre les appels — la boucle ajoute `0.1` 997 fois et obtient
`99.70000000000007` là où le rattrapage obtient `99.7`.

Les deux vraies variantes ont été jouées, et **les deux font tomber T3** :

- **T3-a** — réserve stockée en secondes (`avant + nbTicks * 0.1`) → ROUGE ;
- **T3-b** — accumulation pas à pas en flottant, sans réentier → ROUGE.

La leçon est celle que `CLAUDE.md` répète : *un test qui passe sans qu'on sache
le faire tomber ne prouve rien* — mais aussi son revers, moins souvent écrit :
**une falsification qui ne casse rien n'accuse pas forcément le test.** Il faut
d'abord vérifier qu'on a bien injecté un défaut.

---

## 5. La mesure M1 — mesurée, rapportée, arbitrée par Ethan

**Montage** : l'unité dont la base `reparation` est la plus haute, au niveau le
plus haut du jeu, avec son bâtiment réparateur au niveau le plus bas.

| Grandeur | Valeur |
| --- | --- |
| Unité | **Enclume** (`aeronef`), base `reparation` = 1 605 s — la plus chère des quatorze |
| Niveau de l'unité | **50** (`NIVEAU.plafond`) |
| Niveau du bâtiment réparateur (Aérodrome) | **1** |
| **Coût de réparation pleine** | **1 512 409 s = 420,1 h = 17,5 jours** (15 124 089 ticks) |
| Plafond correspondant (armée niveau 50) | **62 h = 223 200 s** (2 232 000 ticks) |
| **Ratio coût / plafond** | **6,78 ×** |

**Le coût dépasse donc le plafond, et l'unité est irréparable dans cet état.**

Deux mesures complémentaires, qui changent la lecture :

- **La sortie existe, et elle est franche.** Avec l'Aérodrome au niveau 50, le
  même coût tombe à **2,19 h**, très en deçà des 62 h. **Aucun niveau d'unité
  n'est irréparable si le bâtiment réparateur suit.** L'unité n'est jamais
  condamnée : c'est le bâtiment qui est en retard.
- **Le premier niveau irréparable sous un bâtiment de niveau 1 est le 35**
  (51,6 h contre un plafond de 47 h). En dessous, tout passe.

### L'arbitrage

Le §7 du brief en faisait un point d'arrêt ; le §6 disait « mesurer, rapporter,
ne rien décider ». La mesure a été soumise à Ethan le 01/09 **avant d'écrire une
ligne de code**. Réponse :

> « Mais j'ai déjà dit que tu t'en fous de ça. Si le joueur est stupide pour
> avoir une enclume 50 avec un aérodrome 1 c'est son problème. 420h de repa. »

**Aucun nombre n'a donc été touché** — ni le plafond, ni `partDuCoutDeMontee`, ni
la pente 1,15. Le fait est **figé par un test** (`RÉSERVE M1`), qui tombera le
jour où l'un de ces nombres bougera : c'est exactement ce qu'on lui demande.

### ⚠ Une seconde mesure, qui n'était pas celle qu'on cherchait

En montant le test M1, **c'est la SCORIE qui a bloqué avant le temps**.
`REPARATION.partDuCoutDeMontee` vaut 1, donc remettre à neuf cette même Enclume
de niveau 50 coûte sa dernière montée, soit **10 995 172 196 de scorie**.

Ce nombre est déjà marqué « à arbitrer » dans `data/sites.js` depuis son
écriture, et **ce lot n'y touche pas** — le brief §4.4 est explicite : « le coût
en scorie ne change pas ». Il est figé par un test et **reste ouvert**.

---

## 6. Les tests retirés ou refondus, un par un, avec leur raison

Le brief §6 nommait huit lignes à retirer ou refondre. Toutes traitées.

| Ligne d'origine | Test | Sort | Raison |
| --- | --- | --- | --- |
| l. 88 | « le temps est la SOMME des pièces, le total leur MAXIMUM » | **REFONDU** | Le maximum disait la durée d'immobilisation d'un chantier ; il n'y a plus de chantier. Remplacé par « le devis SOMME les trois châssis », qui garde **intacte** l'assertion « un réservoir additionne ses pièces » et retourne celle du total. |
| l. 131 | « l'exemple d'Ethan » | **REFONDU**, pas jeté | Sa mécanique survit sous forme de réservoirs remplis en parallèle — c'est ce que le brief demandait. Devenu **T4** : « vider un réservoir ne touche pas les deux autres ». La phrase d'Ethan est citée dans son commentaire. |
| l. 164 | « un châssis revient D'UN BLOC » | **RETIRÉ** | Il mesurait que toutes les pièces d'un châssis finissent ensemble **au bout d'une durée**. Sans durée, l'énoncé n'a plus d'objet : une réparation est instantanée et pièce par pièce. |
| l. 217 | « les deux chemins d'avancement rendent le même état » | **REFONDU** | Même intention, autre objet : il mesurait la restitution progressive des PV, il mesure maintenant le crédit de la réserve. Devenu **T3**, et **renforcé** — il compare l'état ENTIER, pas seulement l'armée. |
| l. 233 | « un nouveau raid ABANDONNE la réparation en cours » | **RETOURNÉ** | L'arbitrage du 29/08 est caduc (§2.9 du brief). Devenu **T10**, qui asserte l'inverse : le raid ne touche pas aux réserves. Un garde-fou retourné, avec le pourquoi écrit — pas un garde-fou supprimé. |
| l. 261 | « la réparation en cours traverse la sauvegarde » | **REFONDU** | Devenu **T11** : c'est la réserve qui traverse, et le chronomètre qui doit avoir disparu. La garde du numéro de version (`SAVE_VERSION === 17`) y est reprise, cf. §7. |
| l. 281 | « une réparation illisible fait lever au chargement » | **REFONDU** | `problemesDeLaReparationEnCours` n'existe plus. Devenu **T11 bis** sur `problemesDesReserves`, avec les mêmes appâts — plus un neuf : une réserve **flottante** doit être refusée, puisqu'elle ferait diverger les deux chemins. |
| l. 290 | « annuler — ce qui est rendu reste rendu » | **RETIRÉ** | `annulerLaReparation` n'existe plus ; il n'y a rien en vol à annuler. |

### Tests conservés, comme le brief l'exigeait

- **l. 112 (T7), « sans son bâtiment » — conservé, un seul mot changé** : l'appel
  `problemesDeLaReparation` est devenu `problemesDeToutReparer` (cf. §7). **Toutes
  les assertions sont identiques au caractère près.**
- **l. 207 (T8), « une unité de niveau 1 se répare gratuitement » — conservé
  intégralement, aucune retouche.**
- **l. 183 (T8), « coût additif, en scorie » — conservé sauf deux lignes**, cf. §7.
- Les deux tests de **courbe** (l. 54 et l. 72) — le diviseur, sa rupture au
  niveau 12, et la série Caserne du relevé — sont **conservés au caractère près**.
  C'est la meilleure preuve que rien n'a glissé sur les barèmes.

### Tests ajoutés au-delà du brief

`T7 bis` (le refus sans bâtiment porte son propre code), le prorata des dégâts,
et « le niveau du bâtiment décote le coût mais ne change pas le crédit » — ce
dernier garde le §2.7 du brief, qui interdit d'appliquer le niveau deux fois.

---

## 7. Écarts par rapport au brief

Cinq écarts, tous mineurs, tous consignés.

### 7.1 `problemesDeLaReparation` est devenue `problemesDeToutReparer`

Le brief se contredit sur ce point : son **§4.4** liste `problemesDeToutReparer`
dans l'API à écrire, tandis que son **§6** demande que les tests l. 112 et l. 183
passent « sans être retouchés » — or ils appellent `problemesDeLaReparation`.

**Retenu : l'API du §4.4**, qui est normative, et un **renommage mécanique** dans
les deux tests. Garder les deux noms aurait donné deux noms pour une fonction,
ce que le dépôt refuse par ailleurs. **Aucune assertion n'a été modifiée.**

### 7.2 `lancerLaReparation` ne pouvait pas survivre dans le test l. 183

Même contradiction : le §3.1 la déclare **supprimée**, et le test l. 183 —
« conservé sans retouche » — l'appelle, son titre disant « payé au lancement ».

**Retenu** : les assertions sur le devis et sur le refus `scorie-insuffisante`
sont **conservées mot pour mot** ; les deux lignes qui appelaient
`lancerLaReparation` passent par `toutReparer`, et le titre devient « payé au
moment où l'on répare ». La tolérance du débit est passée à ±2 000 milli, la
scorie étant maintenant arrondie **par pièce** et non plus sur le total.

### 7.3 `devis.secondes` change de sens plutôt que de disparaître

Le §3.1 dit que « `temps = max(réservoirs)` disparaît ». Le champ ne pouvait pas
disparaître : le test l. 112, conservé, asserte `devis.secondes === 0`.

**Retenu** : le champ devient la **SOMME** des trois châssis, ce qui est son sens
juste sous le nouveau modèle — chacun puisant dans son propre stock, le total
dépensé est bien la somme. Le maximum, lui, a bien disparu, et un test asserte de
face que le devis somme au lieu de prendre le maximum.

### 7.4 Un code de refus de plus : `scorie-insuffisante`

Le §4.4 nomme trois codes (`rien-a-reparer`, `sans-batiment`,
`reserve-insuffisante`). Le coût en scorie subsistant (§4.4 : « le coût en scorie
ne change pas »), il peut bloquer une réparation : le quatrième code est donc
nécessaire, et il reprend le nom déjà en place.

### 7.5 Deux commentaires réparés en passant

- `src/sim/raid.js` affirmait que les deux seuls écrivains de `degatsMilli` sont
  `reporterLesDegats` et `avancerLaReparation`. La seconde n'existe plus : le
  commentaire nommait une fonction morte comme écrivain vivant. **Remesuré** —
  ce sont `reporterLesDegats` et `reparerUnePiece` — et réécrit. C'est le §5.2 du
  brief appliqué.
- `test/state.test.js` prouvait le maillon v12 → v13 par `migre.reparation ===
  null`. Le maillon v16 → v17 **supprime** ce champ : qu'il ait tourné ou non, la
  sauvegarde finit sans `reparation`, et **aucune assertion ne peut plus les
  distinguer**. En garder une qui ne distingue rien ferait croire qu'elle garde
  quelque chose. Remplacée par l'observable du dernier maillon, avec la raison
  écrite. **C'est le seul point où un test a changé de cible pour une raison
  sémantique et non mécanique**, et il est signalé ici à ce titre.

---

## 8. Les sept autres fichiers de test — ce qui a cassé, et pourquoi

Le §5.4 du brief demandait de traiter leurs échecs comme une information.
**Six échecs, tous mécaniques. Aucun sémantique**, hors le cas 7.5 ci-dessus.

| Fichier | Cause | Traitement |
| --- | --- | --- |
| `chantier.test.js` (2) | `baseDeLaMaquette()` monte un état à la main ; `tickJeu` lit un champ neuf | Ajout de `reserveReparation`, **dans le motif déjà établi par le fichier** — c'est la cinquième fois (forces 28/08, satellites 29/08, points d'attaque 29/08, sites entamés), et chaque ajout porte son ⚠ qui dit pourquoi |
| `state.test.js` (2) | `SAVE_VERSION` et le bout de chaîne écrits en dur à 16 | Portés à 17 |
| `poi.test.js` | idem, plus la garde « bump oublié » | Garde **déplacée** vers `reparation.test.js`, maillon le plus récent — c'est la convention que `reparation.test.js` documentait déjà pour v12 → v13. POI garde `SAVE_VERSION >= 16`, forme identique à celle qu'il remplace |
| `recherche.test.js` | bout de chaîne écrit en dur à 16 | Porté à 17 |

`documentation.test.js` a ensuite exigé la mise à jour de `CLAUDE.md` §0 — la
garde du compte de tests a fait son travail.

---

## 9. Points laissés en suspens

### 9.1 Volontairement non traités — le §2.10 du brief

Trois choses sont **hors périmètre et n'ont pas été commencées**, comme demandé.
Elles sont **notées, pas écrites** :

1. **Le quatrième réservoir « base »** de `MODELE-ECONOMIQUE.md` §7. Le §4 de
   `MODELE-REPARATION-1.md` va plus loin : il dit que les bâtiments de la base et
   les unités offensives **puisent dans la même réserve**. Le lot n'implémente
   que les trois châssis d'armée. Aucun écran ne répare un bâtiment aujourd'hui.
2. **La réparation gratuite des défenses en une heure**, sur son horloge propre —
   hors réserve, dit le même §4. Non implémentée.
3. **Un raid ennemi vide la réserve** (`MODELE-ECONOMIQUE.md` §7). Les raids de
   l'Ouvrage n'existent pas (lot RAID-B) ; il n'y a rien à quoi l'accrocher.

### 9.2 Ouverts par ce lot

- **Le barème de coût en temps** — `MODELE-REPARATION-1.md` §6 point 7 — reste
  ouvert. `secondesPleines` en porte la forme ; les nombres viennent d'Ethan.
- **`REPARATION.partDuCoutDeMontee`** vaut 1 et reste « à arbitrer ». La mesure du
  §5 lui donne un ordre de grandeur : onze milliards de scorie pour une Enclume
  de niveau 50.
- **La réserve est par base** et vit sur `etat` faute de multi-bases. La condition
  de rupture est écrite dans `state.js` et dans `reparation.js` : le jour du
  multi-bases, ce champ descend d'un cran.
- **`toutReparer` reste ordonnée quand la réserve s'épuise en cours de route** :
  les pièces les plus basses dans `etat.armee` sont servies les premières. C'est
  inévitable dès lors qu'une réparation est pleine ou rien ; l'écran laissera le
  joueur réparer pièce par pièce s'il veut choisir. Écrit dans le module.
- **Aucun écran n'appelle encore la réparation** — c'est ce qui avait laissé la
  divergence de huit jours invisible. Ce lot ne branche rien : c'est RAID-A.

### 9.3 Ce qui n'a pas été lancé, et pourquoi c'était conforme

`python3 tools/verifier.py` **n'a pas été lancé** : le lot ne touche ni `art/`,
ni `tools/`. `CLAUDE.md` §0 point 5 le réserve aux lots qui touchent à l'art.
Son dernier verdict connu reste celui de MUR-DE-CONTOUR.

`node tools/audit-maquette.mjs` n'a pas été lancé non plus : la maquette n'est
pas touchée.

---

## 10. Point d'arrêt du §7 — état

| Cas d'arrêt | Déclenché ? |
| --- | --- |
| base de référence non retrouvée | Non — les cinq nombres sont exacts |
| **M1 dépasse le plafond** | **OUI** — arrêt observé, mesure soumise à Ethan **avant tout code**, arbitrage rendu (§5), reprise du lot sur sa décision |
| migration 16 → 17 de plus de trois lignes | Non — **trois lignes de corps**, exactement |
| un autre fichier de test casse pour une raison sémantique | Un seul cas, §7.5, traité et signalé |
| une décision du §2 impossible à tenir | Non — les dix tiennent |
