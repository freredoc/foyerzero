# RAPPORT — lot CONTACT-2

**« Fermer la famille B. Écraser en quatre ticks au lieu d'un, à quart de
vitesse. »**

Exécuté le 13/09/2026. Arbitrages d'Ethan du même jour, rendus sur le §9 de
`rapports/RAPPORT-lotCONTACT.md` :

> « A : garder — B : à corriger. »
> « On prend c plus vitesse divisée par quatre. »

---

## 1. Ce que la suite et le livrable rendent

| grandeur | valeur |
|---|---|
| `npm test` — tests déclarés | **1604** |
| `npm test` — verdict mesuré | **1603 pass · 0 fail · 1 skipped** |
| le skip | `LIMITE T8`, suspendu par Ethan le 08/09 — inchangé |
| `npm run check` | **sort en 0** |
| `dist/index.html` | **9 385 408 octets**, 0 référence externe |
| borne T10 | **9 600 000, NON TOUCHÉE** |
| marge | **214 592 octets, 2,24 %** |
| version · build | **0.99.56 · build 158**, les deux CHAÎNES |
| `SAVE_VERSION` | **33, inchangé** |

Le compte passe de 1 603 à **1 604** : `CONTACT-2 T1` entre, `CONTACT T2`
devient `CONTACT-2 T2` (il ne s'ajoute pas, il REMPLACE — voir §5).

**Version et build sont des CHAÎNES**, vérifié au type et non à l'œil :
`android/app/build.gradle.kts` les lit `as String`, et un nombre y fait tomber le
job Android à la CONFIGURATION.

```
version "0.99.56" string
build   "158"     string
```

### Coût, ventilé poste par poste

Contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de `main`
= `f21ba4e` (le commit de fusion de la PR #139) :

| poste | avant | après | écart |
|---|---|---|---|
| total | 9 385 049 | 9 385 408 | **+359** |
| JavaScript | 424 777 | 425 136 | **+359** |
| feuille | 46 538 | 46 538 | 0 |
| balisage | 36 785 | 36 785 | 0 |
| images | 7 683 603 | 7 683 603 | 0 |
| audio | 1 193 346 | 1 193 346 | 0 |
| URI `data:` | 306 | 306 | 0 |

**La somme des cinq postes tombe EXACTEMENT sur le total des DEUX côtés.** Le
lot ne fait entrer ni une image ni un son : il élargit une fenêtre de balayage
et étale un écrasement dans le temps.

### `SAVE_VERSION` : démontré, pas supposé

`src/sim/state.js` n'apparaît pas au diff. Une partie neuve se sérialise en
**1 207 octets** sous `"version":33` et se recharge **identique à l'octet**. Une
position en milli-cases portait déjà des valeurs non multiples de
`MILLI_PAR_CASE` — c'était tout le sujet du lot CONTACT — et rien de ce lot-ci
n'ajoute un champ à une entité sauvegardée.

### Fichiers touchés

`src/sim/combat.js` est le **SEUL** fichier de `src/` qui bouge — vérifié au
diff, pas à la relecture. Pas une ligne de `src/data/`, `src/render/`,
`src/ui/`, `src/son/`, `tools/` ni `art/`, comme le §6 du brief l'exige.

```
 package.json                     |   4 +-
 src/sim/combat.js                | 408 ++++++++++++++++++++++-------
 test/assaut.test.js              |  40 +++-
 test/bases.test.js               |  33 ++-
 test/cible.test.js               |  42 +++-
 test/combat.test.js              |  45 +++-
 test/contact.test.js             | 278 +++++++++++++++++-------
 test/disposition-ouvrage.test.js |  12 +-
 test/generateur.test.js          |  66 +++++-
 test/journal.test.js             | 139 +++++++++++-
 test/pictogramme.test.js         |  24 ++-
 test/poi.test.js                 |  17 +-
 test/recherche.test.js           |  71 ++++++-
 test/repli.test.js               |  54 ++++-
 test/roster.test.js              |  51 ++++-
 test/temoins-bases-0.js          |  70 ++++++
 test/temoins-combat.js           | 448 +++++++++++++++++++++++++++++
```

Plus `rapports/RAPPORT-lotCONTACT-2.md`, qui entre.

---

## 2. La base confrontée, et ce que le brief dit de faux

La base annoncée par le brief a été retrouvée : `main` à **`f21ba4e`**, le
commit de fusion de la PR #139, **1 603 tests déclarés**, **9 385 049 octets**,
version 0.99.55 · build 157. Les faits dont le lot dépend étaient intacts,
vérifiés un par un avant d'écrire : `margeDeContact` sur deux cellules,
`bloqueuseSur` qui rend `null` sur une écrasable, `ECRASEUR_PCT_PAR_TICK`, les
deux constantes d'axe, `CONTACT T2` et sa clé `B` à 22.

**Deux choses que le brief annonce sont fausses, et les deux sont mesurées :**

1. **§1.2 — « huit cellules ».** La déduction en rend **six**. Voir §4.
2. **§4 — « 952 millièmes et huit ticks » avant.** Mesuré : **930 millièmes** et
   **22 ticks**. Le second est faux du simple au double. Voir §5.

Une troisième prédiction du brief tombe juste : la profondeur après le lot, qu'il
donne à « 120 millièmes », mesurée à **138** — le même ordre, et l'écart
s'explique : le toucher COMPTE (`ecart === 0` et non `< MILLI_PAR_CASE`
strict), si bien que le premier tick de contact laisse passer un pas freiné et
non un pas nul.

---

## 3. Le coût du tick — non mesurable ici, et il faut le dire ainsi

Le §0 bis du brief demande de mesurer ce que la fenêtre élargie coûte. **Elle
n'est pas mesurable sur cette machine à cette précision, et c'est le résultat.**

Premier relevé, en **séries séparées** — le lot d'abord, le fusionné ensuite :
**67,8 µs contre 63,2 µs par tick, soit +7,2 %**. Ce chiffre a été **retiré, pas
corrigé** : c'est la faute que le lot ART-90 a payée sur le temps de démarrage,
et sa leçon est écrite dans `CLAUDE.md` — « deux séries à la suite mesurent la
machine autant que le livrable ».

Remesuré en **A/B ALTERNÉ**, les deux moteurs chargés dans le même processus, dix
couples de passes après quatre passes de chauffe alternées, médiane, sur dix
montages de 200 ticks chacun :

| exécution | lot | fusionné | écart des médianes | étendues qui se recouvrent |
|---|---|---|---|---|
| 1 | 65,70 | 64,81 | **+1,4 %** | oui |
| 2 | 67,87 | 64,53 | **+5,2 %** | oui |
| 3 | 64,92 | 66,13 | **−1,8 %** | oui |

**Le signe change d'une exécution à l'autre**, et les étendues se recouvrent sur
les trois. Ce qu'on peut en dire est que le coût du tick **ne se dégrade pas d'un
ordre de grandeur** ; toute affirmation plus fine mesurerait le conteneur.

⚠ **Et six cellules au lieu de deux ne triplent pas le coût**, ce qui est
cohérent : le balayage sort à la première bloqueuse trouvée, la plupart des
cellules d'une grille de combat sont vides, et le déplacement est une petite part
d'un tick que le ciblage et le tir dominent.

---

## 4. La fenêtre — SIX cellules, et le six se déduit

Le §1.2 du brief pose que « quatre cases par axe » est une première
approximation et que **la fenêtre se déduit, elle ne se choisit pas**. La
déduction est faite, et elle rend six.

Soit `M` en `(mr, mc)` qui avance d'un pas strictement inférieur à
`MILLI_PAR_CASE` sur l'axe des rangées, et `B` en `(br, bc)`. Une entité occupe
`[m, m + MILLI_PAR_CASE)` sur **chacun** des deux axes ; deux pavés d'une case ne
se recouvrent que si les **deux** intervalles se recouvrent. `B` peut donc borner
`M` si et seulement si :

- **en travers** : `|mc − bc| < MILLI_PAR_CASE`, donc
  `floor(bc) ∈ { cM − 1, cM, cM + 1 }` — **trois** colonnes ;
- **dans le sens du pas** : `mr < br < mr + 2 × MILLI_PAR_CASE`, donc
  `floor(br) ∈ { rM + 1, rM + 2 }` — **deux** rangées.

Soit **3 × 2 = six cellules**, contre deux avant le lot.

### Pourquoi le brief en annonçait huit, et pourquoi il a tort

Il ajoutait la rangée `rM` elle-même, qu'il appelle « le cas le moins
intuitif » : une bloqueuse enregistrée dans la MÊME rangée-index peut être devant
`M` de moins de mille millièmes. **Elle le peut ; elle ne la BORNE pas pour
autant.**

Une bloqueuse d'index `rM` a `br < (rM + 1) × MILLI_PAR_CASE ≤ mr +
MILLI_PAR_CASE`, donc `br − mr < MILLI_PAR_CASE`, donc son écart signé moins une
case est **NÉGATIF**. La marge vaudrait alors **zéro**, et `M` serait figée pour
toujours dans un chevauchement hérité qu'elle était **en train de quitter**. Le
`Math.max(0, …)` de `margeDeContact` existe précisément pour ne jamais REPOUSSER
personne ; inclure `rM` changerait ce plancher en prison.

Et un chevauchement NEUF demande `br ≥ mr + MILLI_PAR_CASE`, ce qui place `B` en
`rM + 1` ou `rM + 2` — jamais en `rM`.

**La mesure tranche : avec six cellules, la famille B tombe à zéro.** Elle
n'aurait pas pu tomber plus bas avec huit, et huit aurait figé des entités.

### Ce que la fenêtre ne peut pas retirer

À `j === 0`, le test `|perp(b) − perp(e)| < MILLI_PAR_CASE` est **toujours
vrai** — les deux positions sont dans la même bande de mille millièmes. La
fenêtre élargie ne peut donc qu'AJOUTER des bornes, jamais en retirer : c'est ce
qui garantit qu'aucune entité ne gagne le droit de passer là où elle était
bornée.

### Les deux déplacements se composent par échange des deltas

`AXE_RANGEE` et `AXE_COLONNE` portent chacun `dRangee` et `dColonne`, dont l'un
vaut 1 et l'autre 0 ; les échanger donne la perpendiculaire. Écrire quatre
offsets en dur aurait été la seconde vérité que ces deux constantes existent pour
empêcher.

### Une dépendance, et elle est héritée, pas ajoutée

La fenêtre de deux cases dans le sens du pas DÉPEND de l'invariant « aucune
vitesse n'atteint 1 000 millièmes par tick » — il est écrit dans `peutAvancer` et
gardé des deux côtés, `MODULES-A T6` sur la donnée et `COL T14` sur le latéral.
Le jour où une vitesse boostée franchirait le millier, la fenêtre deviendrait
fausse **en silence**.

---

## 5. Les deux familles, recomptées

Mesuré sur les quatre raids réels de `CONTACT-2 T2`, **même filtre des deux
côtés** — entités actives ET bloquantes ; un aéronef traversant survole, il ne
recouvre pas.

| famille | CONTACT | CONTACT-2 |
|---|---|---|
| A — l'écrasement différé | 69 | **26** |
| B — le croisement à cheval | 22 | **0** |
| **TOTAL** | **91** | **26** (−71,4 %) |

### B — fermée

Les 22 paires vivaient **TOUTES** dans `avantPoste/n20/g2`. Relevé type : une
Meute décalée en colonne **1 720** et une Carapace montée en rangée **7 020**,
masses égales donc aucun écrasement possible, chacune hors de l'index que l'autre
inspectait.

**Zéro paire de cette nature sur les quatre raids.** Et la branche qui les
comptait est devenue un `assert.fail` : une paire qui reviendrait **fait tomber
le test** au lieu d'être tolérée. Le message garde sa caractérisation — « au
moins une des quatre coordonnées n'est pas un multiple de `MILLI_PAR_CASE` » —
pour qu'une telle paire se **diagnostique** plutôt que de se compter.

### A — gardée sur arbitrage, et elle maigrit de 62 %

`bloqueuseSur` rend `null` sur une occupante ÉCRASABLE — sinon la marge bornerait
le pas avant que `peutEcraser` ne soit atteint et l'écrasement mourrait en
silence. L'écraseuse entre donc dans le pavé de sa victime, et les deux se
recouvrent jusqu'à la mort.

Ce que CONTACT-2 change est la **DURÉE** de cet épisode, pas son existence :

| grandeur | fusionné | lot |
|---|---|---|
| paires (A + B) | 91 | **26** |
| profondeur maximale | **930** millièmes | **138** |
| durée maximale d'un chevauchement | **22** ticks | **4** |

Répartition de A par montage, assertée exactement :

| montage | A |
|---|---|
| `camp/n5/g1` | 4 |
| `avantPoste/n20/g2` | 15 |
| `base/n35/g3` | 4 |
| `base/n50/g4` | 3 |

⚠ **Le brief se trompait sur les deux nombres d'avant.** Il annonce « 952
millièmes et huit ticks » ; mesuré, **930** et **22**. Le 11 qu'il cite ailleurs
est le pire d'un SEUL montage, `base/n35/g3` ; le pire des quatre vaut **22**,
dans `avantPoste/n20/g2` — qui est aussi le montage où la famille B vivait.

**La fermer demanderait de tuer AVANT d'entrer**, donc de renoncer à
l'écrasement progressif qu'Ethan vient d'arbitrer. Elle reste ouverte, et c'est
son choix.

### Le test ne se desserre pas

`CONTACT T2` **EST** devenu `CONTACT-2 T2`, privé de son exception B — il n'y en
a pas un second à côté, le dépôt aurait deux vérités sur le même invariant.

- **Il n'y a plus de clé `B`** : la famille est fermée, donc son exception est
  RETIRÉE et non mise à zéro. Un zéro laisserait une place où la reposer.
- Les trois montages du brief sont tenus **en absolu**, sans une exception.
- La seule famille qui reste est **NOMMÉE**, son compte est **EXACT**, sa
  répartition par montage l'est aussi, et elle porte une caractérisation
  **POSITIVE** qui peut tomber : camps opposés, masses strictement différentes.
- **Le jour où A se ferme à son tour, ce test tombe : c'est ce qu'on lui
  demande.**

C'est l'idiome de `DETTES_ACCENT`, repris à la lettre.

---

## 6. Les écrasements aboutis — 5 → 8

Sur les quatre raids réels, armée de toutes les unités du roster :

| montage | fusionné | lot |
|---|---|---|
| `camp/n5/g1` | 1 | 1 |
| `avantPoste/n20/g2` | **2** | **5** |
| `base/n35/g3` | 1 | 1 |
| `base/n50/g4` | 1 | 1 |
| **TOTAL** | **5** | **8** |

**Le gain est ENTIÈREMENT dans `avantPoste/n20/g2`** — le montage où la famille B
vivait. Ce n'est pas une coïncidence : les croisements à cheval empêchaient des
écraseuses d'être bornées par ce qu'elles auraient dû broyer.

### Attribution, mesurée par isolation

`iso.sh` copie le moteur du lot, puis joue trois configurations :

| configuration | écrasements aboutis |
|---|---|
| LOT COMPLET (fenêtre 6, TICKS=4, FREIN=4) | **8** |
| FENÊTRE 2 SEULE (TICKS=4, FREIN=4) | **11** |
| ÉCRASEMENT INSTANTANÉ (fenêtre 6, TICKS=1, FREIN=1) | **9** |
| arbre fusionné (fenêtre 2, instantané, au franchissement) | **5** |

**Les trois configurations ne se composent pas additivement**, et c'est normal
sur une simulation non linéaire — un tick de plus déplace ce que tout le monde
fait au suivant. Ce qui est affirmé est le CLASSEMENT, pas une somme.

⚠ **La troisième moitié du lot n'est pas commutable** : payer l'écrasement au
CONTACT plutôt qu'au franchissement de l'INDEX ne s'isole par aucune constante.
Elle se mesure en résidu — c'est l'écart que les trois configurations ci-dessus
n'expliquent pas.

---

## 7. Où le ÷4 se place dans la chaîne de vitesse

### Un seul prédicat, évalué une fois

`margeDeContact` range dans un **paramètre de sortie** `ecrasees` les victimes
qui sont AU CONTACT — `ecart === 0`. `avancer` et `seDecaler` en tirent :

```js
const frein = ecrasees.length > 0 ? ECRASEMENT_FREIN : 1;
```

**Deux lectures séparées dériveraient au premier réglage**, et le symptôme serait
une écraseuse qui ralentit sans mordre, ou qui mord sans ralentir —
indiscernable d'un défaut d'équilibrage. C'est le §2.3 du brief, tenu à la
lettre : la MÊME lecture décide que l'occupante est transparente à la marge,
qu'elle prend des dégâts, et que l'écraseuse freine.

### Le frein est le DERNIER facteur

`vitesseBruteDuTick` est extraite pour que les trois écritures de la vitesse ne
puissent pas diverger ; `vitesseDuTick(…, frein)` et `vitesseLaterale(…, frein)`
l'appellent et divisent **en dernier** :

1. la vitesse de base de l'entité ;
2. la réduction d'obstacle ;
3. le ×10 du Booster ;
4. le ×2/3 latéral, s'il y a lieu ;
5. **le ÷4 de l'écrasement**.

**Posé avant le Booster, le ×10 aurait annulé le ÷4** — l'écraseuse boostée
aurait traversé sa victime à pleine vitesse, ce qui est exactement le
comportement qu'Ethan fait corriger. C'est la même règle d'ordre que le lot
MODULES-A a posée pour l'obstacle.

### « Au contact » est la même arithmétique que la marge

`ecart === 0`, et non un second calcul. Elle vaut zéro dès que l'écart signé
tombe à une case ou moins, c'est-à-dire dès que les deux pavés se touchent.

⚠ **Et le toucher COMPTE, il n'est pas exclu.** Avec un `< MILLI_PAR_CASE`
strict, l'écraseuse ferait un pas PLEIN dans le pavé de sa victime avant de
freiner — mesuré sur le Bélier de référence, **120 millièmes de pénétration au
premier tick au lieu de 30**, soit la profondeur que le §4 du brief prédit pour
QUATRE ticks, atteinte dès le premier.

### `ECRASEUR_PCT_PAR_TICK` ne bouge pas

Le §6 du brief l'interdit nommément, et le diff le confirme : le forçage de
l'Écraseur, `doitSArreter`, `ciblage`, `progresse`, `allieeDevant` et le repli
n'ont pas une ligne de changée. Les masses non plus.

---

## 8. `JOURNAL T8` — les indices mesurés, pas comptés

Ce test gardait une exception d'écrasement en reconnaissant une victime à son
drapeau `ecrase`. **Ce drapeau n'est posé qu'à la MORT.** Sous un écrasement en
quatre ticks, une pièce encaisse plus que ce que le journal publie pendant trois
ticks **sans être encore marquée** : la prémisse du test a cessé d'être vraie.

Il asserte désormais une propriété **positive et falsifiable** :

- tout excédent non publié vaut **au plus un quantum d'écrasement**,
  `Math.ceil(pvMaxMilli / ECRASEMENT_TICKS)` — la constante est **IMPORTÉE de
  `src/sim/combat.js`**, jamais retapée ;
- **toute entité en écart finit écrasée** — l'inverse serait une fuite de dégâts
  sans rapport avec l'écrasement ;
- le compte est **EXACT**, et les indices sont **NOMMÉS**, pas comptés.

### Mesuré

| grandeur | fusionné | lot |
|---|---|---|
| écrasées | `[28, 79]` | **`[10, 20, 21, 28]`** |
| indices en écart | — (2 violations) | **`[10, 28]`** |
| écarts non publiés | 2 | **5** |
| impacts | 1 324 | **1 314** |
| ticks | 281 | **303** |

La **Carapace d'indice 10** est écrasée sur les ticks **219 à 222** : l'excédent
vaut exactement le quantum **13 252 800** trois fois de suite, puis le reste
**8 973 481** au quatrième. C'est la signature de l'écrasement en quatre ticks,
lue dans le journal. Le **Guetteur 28**, lui, tombe sur un seul tick — sa santé
restante était déjà sous un quantum.

Une contre-assertion `notDeepEqual` refuse le retour de `[28, 79]`, et une
assertion de non-vacuité refuse qu'un code futur fasse disparaître les écarts
sans que personne le remarque.

---

## 9. Les témoins — déplacés ET gardés

**Aucun témoin n'est recapturé.** Une recapture ferait comparer un code à
lui-même ; on empile.

### `test/temoins-combat.js`

| couche | champs déplacés | combats touchés | combats intacts |
|---|---|---|---|
| `COMBATS_DEPLACES_PAR_CONTACT_2` | **907** / 1 600 | 177 | **23** |
| `…_CONTACT_2_AVANT_PAQUETS` | **764** | 149 | **51** |

Comptes de l'union, après empilement :

| test | surchargés | gardés |
|---|---|---|
| `JOURNAL T1` | 1 125 → **1 153** | **447** |
| `JOURNAL T1 bis` | 1 334 → **1 335** | **265** |

⚠ **Les deux tables portent les 200 clés, `{ }` là où rien ne bouge.** Une clé
absente se lirait « ce combat n'existe plus ».

⚠⚠ **Et c'est l'invariance de `T1 bis` qui dit ce que le lot touche : 1 334 →
1 335, UN SEUL champ neuf à surcharger.** Le lot bouge donc le MÊME axe que
CONTACT, ARRÊT, COLONNE, MUR et BARÈME-ET-REJEU — **la FILE** — et ni le tir ni
le ciblage : ceux-là auraient brisé les causes qui tiennent encore.

### `test/temoins-bases-0.js` — la vingt-cinquième couche

| table | déplacés |
|---|---|
| `DEPLACES_PAR_CONTACT_2` | **31 couples / 350**, cinq champs, phases p07 à p14 |
| `EMPREINTES_PAR_GRAINE_CONTACT_2` | **6 graines sur 25** |
| `RAPPORTS_PROCHE_CONTACT_2` | **5 / 25** |
| `RAPPORTS_OUVRAGE_CONTACT_2` | **2 / 25** |

**C'est la couche la plus étroite de l'histoire de ce témoin.** Les six premières
phases sont identiques **AU BIT**, et **aucun scalaire ne bouge** — gestes,
gestes d'armement, taille de la sauvegarde, cases atteignables, déplacement,
bases attaquantes, nombre de cibles, cible retenue.

Les trois tables de rapport sont **CREUSES** — 6, 5 et 2 sur 25, contre 23, 20 et
16 au lot CONTACT. C'est juste : ce qui bouge est le déroulé d'un combat, et il
ne mord que là où une pièce en croisait une autre à cheval sur deux index. C'est
un cas rare, et c'est bien ce que la mesure dit.

---

## 10. Les deux tests neufs, vus ROUGES d'abord

Les deux ont été **vus rouges sur l'arbre fusionné** avant d'être écrits, comme
le §7 du brief l'exige.

### `CONTACT-2 T1` — un écrasement prend quatre ticks, et il use la victime

Rouge sur `f21ba4e` : la victime y meurt en **un** tick, au franchissement de
l'index. Le test asserte :

- la victime encaisse `ceil(pvMax / 4)` par tick de contact, **quatre ticks** sur
  une victime intacte ;
- l'écraseuse avance au **quart** de son pas nominal pendant ces ticks ;
- le compte de ticks et le pas sont mesurés **au millième**.

### `CONTACT-2 T2` — la famille B est fermée

Rouge sur `f21ba4e` : 22 paires de famille B, toutes dans `avantPoste/n20/g2`.
Voir §5.

---

## 11. Relecture hostile

### Un faux rouge a coûté une heure, et la cause était dans l'outillage

`CONTACT-2 T2` est tombé sur `avantPoste/n20/g2, tick 118` — une paire en
diagonale, Δrangée **940** et Δcolonne **920** — **après une suite complète
VERTE**. Le premier réflexe a été de le lire comme une découverte du lot : une
famille B diagonale que la fenêtre ne fermerait pas.

**C'était l'arbre de travail.** `iso.sh` restaure `src/sim/combat.js` à sa
DERNIÈRE ligne, sous `set -e` : toute sortie non nulle d'un harnais l'abandonne
dans la configuration du dernier patch écrit — ici « fenêtre 2 seule », qui est
très exactement la configuration où la famille B existe.

Corrigé par un `trap 'cp /tmp/combat.lot.js …' EXIT`, qui survit à une sortie non
nulle. **Vérifier l'arbre avant de croire un rouge** : un `git diff` sur le
moteur l'aurait dit en dix secondes, et la suite complète verte quelques minutes
plus tôt était déjà l'indice.

### `PIC T7` mentait depuis le lot CONTACT

Trouvé en le réancrant. Il écrivait encore **9 384 775**, la mesure du lot REJEU,
quand le disque en rendait **9 385 049** : la §0 de `CLAUDE.md` annonçait déjà
9 385 049 et une marge de **214 951 octets**, là où ce test écrivait **215 225**.
**Les deux documents se contredisaient**, et la suite était VERTE — 274 octets
valent un cent-quatre-vingt-deuxième de la tolérance de 50 000, et les deux
marges s'arrondissent à 2,24 %.

C'est **très exactement la dérive LENTE que la dernière assertion de ce test
existe pour refuser**, commise par le lot précédent. Quatrième réancrage, après
VITESSE, BARÈME-ET-REJEU et REJEU. Une contre-assertion `notEqual` refuse le
retour de l'ancienne ancre.

### `generateur.test.js T12` — le montage réparé, pas l'assertion

C'est le point le plus délicat du lot, et il vaut d'être lu deux fois.

`T12` compare deux combats miroirs case par case. Un combat **TRONQUÉ** au
plafond de 900 ticks, comparé à un autre, mesure le **PLAFOND** et non le
miroir : les deux s'arrêtent au même tick par construction, donc ils
« s'accordent » pour une raison qui n'a rien à voir avec la propriété gardée.

Le lot allonge les combats — l'écrasement prend quatre ticks au lieu d'un — donc
le nombre de combats coupés monte :

| grandeur | fusionné | lot |
|---|---|---|
| écarts comparés | 470 | **456** |
| paires sautées | 30 | **44** |
| combats au plafond | 15 | **21** |

Les paires dont un des deux côtés est tronqué sont désormais **sautées**, et le
partage du sort des entités suit la même règle — sans quoi il comparait encore à
travers un combat coupé.

⚠ **Ce qui est perdu est asserté EXACTEMENT** — les trois nombres ci-dessus —
**plus un plancher `>= 450`**. Sans ce plancher, des lots successifs éroderaient
la couverture un réancrage défendable à la fois, et personne ne verrait le
moment où le test cesse de mesurer quoi que ce soit.

⚠ **Et la propriété du miroir, elle, NE BOUGE PAS** : `ecartMax` **1**, médiane
**0**, quatre cellules au-dessus de zéro, `entitesQuiBasculent` **0**. L'écart
relatif maximal passe de **0,148 % à 0,211 %**, et la cellule qui le porte se
déplace de `camp g37 mixte/17` à **`camp g53 infanterie/5`** — niveau 2 dans les
deux cas, 475 contre 476.

### L'audit du compte d'assertions

`CLAUDE.md` §5 l'exige : « auditer le compte d'assertions avant et après, et ne
jamais supprimer une assertion sans le dire ». Compté fichier par fichier, sur
les treize fichiers de `test/` touchés :

| fichier | avant | après | écart |
|---|---|---|---|
| `assaut.test.js` | 67 | 67 | 0 |
| `bases.test.js` | 207 | 207 | 0 |
| `cible.test.js` | 53 | 55 | **+2** |
| `combat.test.js` | 160 | 163 | **+3** |
| `contact.test.js` | 12 | 30 | **+18** |
| `disposition-ouvrage.test.js` | 67 | 67 | 0 |
| `generateur.test.js` | 183 | 186 | **+3** |
| `journal.test.js` | 80 | 89 | **+9** |
| `pictogramme.test.js` | 75 | 76 | **+1** |
| `poi.test.js` | 142 | 144 | **+2** |
| `recherche.test.js` | 916 | 916 | 0 |
| `repli.test.js` | 89 | 92 | **+3** |
| `roster.test.js` | 84 | 84 | 0 |
| **TOTAL** | **2 135** | **2 176** | **+41** |

**Pas un fichier n'en perd.** Les réancrages remplacent une valeur, ils ne
retirent pas une ligne ; les tests réparés en GAGNENT — `generateur T12` trois
(les deux comptes de couverture et le plancher), `journal T8` neuf, `contact`
dix-huit.

### Les réancrages, et leur attribution

Aucune assertion n'a été retirée ni assouplie. Chaque nombre réancré porte sa
valeur d'avant **et** la configuration d'isolation qui l'attribue.

| test | avant | après | attribution |
|---|---|---|---|
| `POI T18` butin nu | 69 / 23 | **62 / 20** | l'écrasement — la fenêtre seule rend 69/23 |
| `POI T18` butin POI | 92 / 30 | **87 / 29** | idem |
| `POI T18` durée | 451 | **451** | inchangée des deux côtés |
| `MODULES-D T4` | 120 | **121** | le quatre-ticks — fenêtre 2 rend 121 aussi |
| `MODULES-E T7` | 120 | **121** | idem |
| `PIC T7` | 9 384 775 | **9 385 408** | remesuré, base `f21ba4e` |

⚠ **`POI T18` : l'écart que le test garde se CREUSE**, de **+33,3 % à +40,3 %**
— la majoration de POI mord davantage sur un butin plus petit. La propriété
gardée tient, et elle tient plus franchement.

⚠ **`MODULES-D T4` et `MODULES-E T7` : les CINQ valeurs de points ne bougent pas
d'une unité** (2 059 722 trois fois, 2 106 166 deux fois). Seul le tick de fin
bouge.

⚠⚠ **`MODULES-F T14` garde ses graines `[7, 18, 24]`, et c'est la troisième fois
que sa prémisse tient.** Le balayage de 1 à 60 en rend **douze** qui discriminent
aux trois niveaux (7, 18, 24, 33, 34, 36, 39, 45, 51, 52, 56, 57) contre dix au
lot CONTACT. **Trois des neuf valeurs ne bougent pas.**

### Un constat à remonter à Ethan

Sur la **graine 24 au niveau 50**, l'écart de `MODULES-F T14` entre canal armé et
canal vide **s'effondre de 57,7 % à 0,8 %**. Le test garde le **SIGNE**, qui
tient ; mais un écart de 0,8 % est à un cheveu de s'inverser, et cette
assertion-là a déjà perdu sa prémisse six fois.

**Ce n'est pas un défaut du lot** — le canal de l'Ouvrage rend toujours plus que
le canal vide — **c'est du calibrage, et il revient à Ethan.**

### Ce qui n'a pas été fait, et qui se déclare

- **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : le lot
  ne touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff. Le §0.5
  du brief l'interdisait nommément.
- **Le rendu n'a pas été vu, ni sur appareil ni dans un navigateur.** Ce que le
  lot change se VOIT — une écraseuse qui traverse le pavé de sa victime pendant
  quatre ticks au lieu de vingt-deux, et à quart de vitesse — et tout est mesuré
  sur `rangeeMilli` et `colonneMilli`. **À regarder au premier essai** : que
  l'écrasement se lise comme un broyage et non comme une disparition, et que la
  famille A, qui reste ouverte, ne saute plus aux yeux.
- **Le lot n'est pas sur la branche que le brief nomme — écart déclaré.** Il
  demande `claude/[descriptive]` ; l'environnement d'exécution épingle la session
  à `claude/new-session-b3ddpp` et interdit de pousser ailleurs sans autorisation
  explicite. Même écart que les lots CONTACT, REJEU et BARÈME-ET-REJEU.

---

## Ce qui reste ouvert

1. **La famille A**, gardée sur arbitrage. La fermer demanderait de tuer AVANT
   d'entrer, donc de renoncer à l'écrasement progressif. `CONTACT-2 T2` tombera
   le jour où elle se fermera, et c'est ce qu'on lui demande.
2. **Le calibrage de `MODULES-F T14` sur la graine 24 au niveau 50** — 0,8 %
   d'écart, voir ci-dessus.
3. **Le coût du tick**, non mesurable ici. Il se remesurera le jour où le dépôt
   aura une machine moins bruyante, ou sur l'appareil d'Ethan.
