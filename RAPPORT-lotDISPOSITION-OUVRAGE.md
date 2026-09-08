# RAPPORT — lot DISPOSITION-OUVRAGE

**08/09/2026 · version 0.99.36 · build 138 · base `main` = `566a453`**

Point **9** du relevé d'Ethan du 08/09 : « Malgré un patch, toutes les bases
Ouvrage restent identiques : les unités de défense sont au fond, tous les
bâtiments au premier rang, et souche et étai restent au fond. »

---

## 0. En un paragraphe

Le bloc occupé d'un site de l'Ouvrage **flotte désormais dans sa bande** au lieu
d'être collé à son bord, il peut porter jusqu'à deux rangées vides en son sein,
et les **colonnes** de la Souche et de l'Étai se tirent — leur RANGÉE, elle, ne
bouge pas. Tout cela est tiré sur un **second flux, salé**, ce qui laisse la
composition du site inchangée à l'identifiant près et **évite un bump de
`SAVE_VERSION`**. Coût : **+512 octets, entièrement du JavaScript**.

---

## 1. Base de départ, mesurée

| Grandeur | Valeur |
| --- | --- |
| `main` au démarrage | `566a453` — exactement la base du brief |
| `npm test` | **1472 tests, 1471 pass, 1 fail** |
| le rouge | `LIMITE T8`, unique, **déclaré par le brief, non réparé** |
| `npm run build` | `dist/index.html`, **9 124 362 octets**, 0 référence externe |
| `SAVE_VERSION` | **29** (re-vérifiée sur la base neuve, pas supposée) |
| version / build | 0.99.35 · build 137 |

⚠ `python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot
ne touche ni `art/`, ni `tools/`.

⚠ `main` **n'a pas bougé pendant l'exécution** — revérifié au moment de la
mesure du livrable : toujours `566a453`. Le §8 du brief prévoyait de remesurer
contre une base neuve ; il n'y a pas eu lieu.

---

## 2. La mesure du §3, AVANT d'écrire une ligne

### 2.1 Vingt cases distinctes, quatre niveaux, trois types

Graines dérivées comme le jeu les dérive —
`graineDeLInstance(1, 200 − 7k, 1 + 3k mod 31, 1)`.

Nombre d'**ensembles de rangées occupées DISTINCTS** sur les vingt graines,
bâtiments / défenses, et nombre de **positions d'uniques distinctes** :

|  | avant | après |
| --- | --- | --- |
| camp n.12 | 4 / 4 · uniques 1 | 16 / 16 · uniques 18 |
| camp n.20 | 4 / 3 · uniques 1 | 18 / 18 · uniques 18 |
| camp n.30 | 4 / 3 · uniques 1 | 16 / 18 · uniques 18 |
| camp n.45 | 5 / 4 · uniques 1 | 15 / 15 · uniques 18 |
| avantPoste n.12 | 4 / 3 · uniques 1 | 18 / 16 · uniques 18 |
| avantPoste n.20 | 5 / 3 · uniques 1 | 15 / 19 · uniques 18 |
| avantPoste n.30 | 4 / 3 · uniques 1 | 13 / 9 · uniques 18 |
| avantPoste n.45 | 4 / 3 · uniques 1 | 13 / 7 · uniques 18 |
| base n.12 | 4 / 3 · uniques 1 | 18 / 17 · uniques 18 |
| base n.20 | 5 / 4 · uniques 1 | 15 / 17 · uniques 18 |
| base n.30 | 4 / 3 · uniques 1 | 13 / 8 · uniques 18 |
| base n.45 | 3 / 2 · uniques 1 | 9 / 3 · uniques 18 |
| **somme** | **50 / 38 · 12** | **179 / 163 · 216** |

### 2.2 Ce qui était invariant, chiffré

Sur les **240 montages** (20 graines × 4 niveaux × 3 types) :

- les bâtiments commencent en **rangée 11 sur 240 sur 240** ;
- les défenses finissent en **rangée 10 sur 240 sur 240** ;
- l'Étai est en **(18, 4)** et la Souche en **(18, 5) sur 240 sur 240**.

**Les trois phrases d'Ethan décrivent exactement ces trois invariants.** La
mesure ne contredit pas le §2 du brief ; elle le confirme et le chiffre.

⚠ **UNE NUANCE À DÉCLARER, PARCE QUE LE §2 DU BRIEF EST TROP FORT SUR CE
POINT.** Il écrit « deux sites de même niveau ont donc la même silhouette ».
Mesuré : l'occupation **case par case** était DÉJÀ toute distincte avant le lot
— **20 silhouettes sur 20**, aux douze cellules. Ce qui se répétait n'était pas
l'image entière, c'était l'**ensemble des rangées employées** et la **position
des deux uniques**. C'est pour cela que `DO T1` garde les trois grandeurs
séparément : asserter la silhouette seule aurait rendu le test vert sur le
générateur d'hier.

### 2.3 Le degré de liberté réel de `taillesDeRangee`

Mille sites par colonne, 48 000 transferts tentés (24 par appel, deux appels par
site) :

| | même case | rangée source VIDE | plafond | **annulés par contiguïté** | acceptés |
| --- | --- | --- | --- | --- | --- |
| tous types / tous niveaux | 13,3 % | **40,4 %** | 13,5 % | **13,7 %** | 19,1 % |
| camp n.30 | 13,2 % | 40,3 % | 8,8 % | **19,6 %** | 18,1 % |
| base n.45 | 13,3 % | 9,9 % | 36,0 % | **4,3 %** | 36,6 % |
| camp n.12 | 13,3 % | 60,2 % | 1,4 % | **18,4 %** | 6,7 % |

⚠⚠ **ET C'EST LA COLONNE « RANGÉE SOURCE VIDE » QUI EXPLIQUE LE DÉFAUT, PAS
CELLE QU'ON ATTENDAIT.** `contigueDepuisLOrigine` interdit à l'indice 0 du
tableau des tailles d'être vide ; le bloc est donc collé à cet indice et tout le
reste du tableau est à zéro, si bien que **quatre transferts sur dix tirent une
source qui n'a rien à donner**. Le bord ancré du bloc ne peut pas bouger : il
faudrait vider entièrement l'indice 0, ce qui demande six transferts sortants
consécutifs de cette exacte case.

**Conclusion : relâcher `contigueDepuisLOrigine` ne suffisait pas.** Il fallait
une couche de PLACEMENT.

---

## 3. Le verdict du §5 sur `sitesEntames` — cherché AVANT d'écrire

### 3.1 Le piège est réel, et il est du côté des DÉFENSES

`montageCourant` (`sim/site-entame.js`) applique `entree.pvBatimentsMilli` au
tableau `montage.batiments` **par indice** ; `santeDeLEtai` fait un `findIndex`
puis lit la même case. Mesuré sur **200 graines par couple (type, niveau)**, 21
couples :

- la suite des identifiants de **BÂTIMENTS** est **invariante par graine sur
  21 couples sur 21** — `composerBatiments` est pure et ne consomme aucun tirage ;
- la suite des identifiants de **DÉFENSES** **varie avec la graine sur 18 des
  21** — `composerRepartition` tire, et elle tire APRÈS `placerBatiments`.

**Donc un seul tirage ajouté au flux principal aurait remappé silencieusement
les `pvDefensesMilli` de tout site à moitié rasé d'une sauvegarde existante.**
C'est exactement ce que les trois lots précédents — COLONNE, CIBLES-RANGÉES —
ont fait sans le mesurer : leurs propres commentaires écrivent « tout ce qui
tire APRÈS `placerDefenses` et `placerBatiments` se décale ».

### 3.2 La sortie retenue : un second flux, salé

`genererSite` ouvre un **second** générateur,
`creerRng(hachageBrut(graine, 0, 0, SEL_PLACEMENT_DES_RANGEES))`, sel **8**. Le
placement des rangées et les colonnes des deux uniques y tirent, jamais dans le
premier.

⚠ **CE QUI A ÉTÉ ÉCARTÉ, ET POURQUOI.** Relâcher `contigueDepuisLOrigine` dans
`taillesDeRangee` aurait donné des trous — mais aurait changé `L`, le nombre de
rangées employées, donc le nombre de tirages de `repartirLesColonnes`
(`9·L + nb − L`), donc la position du flux au moment de `composerRepartition`.
`taillesDeRangee` n'a donc **pas été touchée d'une ligne**.

### 3.3 Le verdict, mesuré sur 6 000 montages

3 types × 50 niveaux × 40 graines, générateur d'avant contre générateur d'après,
montage par montage :

| grandeur | montages où elle diffère |
| --- | --- |
| suite des identifiants de **bâtiments** | **0 / 6 000** |
| suite des identifiants de **défenses** | **0 / 6 000** |
| rangées (ce que le lot veut déplacer) | 5 611 / 6 000 |
| colonnes des uniques (idem) | 5 850 / 6 000 |

**Verdict : l'ordre d'insertion est préservé à l'identique. Aucun bump de
`SAVE_VERSION`, aucune purge de `sitesEntames`.** `SAVE_VERSION` reste à **29**.

⚠ Le brief demandait aussi « combien d'entrées `sitesEntames` existent » sur une
sauvegarde réelle. **Le dépôt n'a pas de sauvegarde d'Ethan** : la mesure a été
faite sur une sauvegarde RECONSTRUITE — un camp de niveau 25 raidé pour de bon,
qui laisse **cinq bâtiments touchés dont quatre détruits**. C'est le montage de
`DO T8`, et il exerce les deux branches de `montageCourant`.

---

## 4. Ce que le lot écrit

### 4.1 `placementDesRangees` — `src/sim/generateur.js`

Rend une liste d'**offsets croissants** depuis le bord ancré, un par rangée
employée. Trois grandeurs tirées, **toutes avant tout test** :

1. `etalement` — combien de rangées VIDES le bloc porte en son sein, borné par
   `min(etalementMaxRangees, marge, nbUtilisées − 1)` ;
2. `derive` — de combien le bloc s'écarte du bord ancré, borné par
   `marge − etalement` ;
3. `etalementMaxRangees` clés pour répartir les vides dans les intervalles, dont
   seules les `etalement` premières sont EMPLOYÉES.

**Le nombre de tirages vaut `2 + etalementMaxRangees`, quels que soient le bloc
et le résultat.** C'est la règle que `taillesDeRangee` et `profilDeCharge`
portent déjà — « un transfert refusé consomme ses tirages comme un accepté ».

⚠ `borner(cle, n)` ramène une clé de `[0, 10⁶]` dans `[0, n[` par mise à
l'échelle et non par modulo : le biais tombe sous 10⁻⁶ au lieu de 10⁻¹ sur huit
valeurs. `sim/poi.js` accepte le biais du modulo par écrit parce qu'il tire une
case sur une carte ; ici on tire une rangée sur huit.

### 4.2 Les quatre invariants du §4, chacun avec sa mesure

1. **L'ordre de retrait des portées.** Les offsets croissent et la rangée
   DÉCROÎT avec l'offset : le rang 0 de la liste — donc l'artillerie, que
   `ordonnerDefenses` met en tête — garde la rangée la plus arrière du bloc. Le
   bloc se décale, il ne se retourne pas. **`DO T4` le remesure de l'extérieur
   sur 3 000 montages** (voir §6).
2. **`rangeeLaPlusAvanceeQuiTire`.** Elle reste **vacueuse** : elle rend
   `bande.premiere` pour les trois artilleries, mesuré et asserté par le `T7`
   existant de `generateur.test.js`. Le bloc atteint bien la rangée 3, mais
   l'artillerie non — elle occupe le bord arrière, donc elle ne descend qu'à
   **6 sur 110 000 montages**.
3. **`occupantsMaxParRangee: 6`.** Intact, et `DO T5` vérifie en plus que le
   plafond est ATTEINT — sans quoi la garde serait vacueuse.
4. **Le déterminisme.** `DO T2`, `DO T3` et `DO T3 bis` (voir §6).

### 4.3 Souche et Étai

La **rangée 18 reste** — §4.2 du brief, non négociable. La **colonne se tire** :
`melanger(placement, colonnes())`, huit tirages toujours, les deux premières
colonnes du mélange. Les neuf colonnes sont atteintes des deux côtés, mesuré sur
soixante graines.

Le bloc des proportionnels reste borné à `11..17` : les laisser monter jusqu'au
fond les ferait entrer en collision avec les uniques, dont les colonnes ne sont
plus fixes. `DO T6` l'asserte.

⚠ **CE QUI N'A PAS ÉTÉ PRIS, ET QUI EST POSÉ À ETHAN.** Le §4.2 prévoit : « si
Ethan veut plus que ça — les deux uniques ailleurs qu'au fond —, c'est un
arbitrage de RÈGLE ». Il n'a pas été pris.

⚠ **UN FAIT À CONNAÎTRE : la colonne d'un unique ne dépend QUE de la graine**,
le second flux étant semé sur elle seule. Deux sites de niveaux différents sur la
MÊME case portent donc les mêmes deux colonnes. En jeu, chaque site a sa propre
graine (`graineDeLInstance` mêle la case ET l'instance), donc cela ne se voit
pas ; mais c'est pourquoi la couverture des neuf colonnes se mesure sur le
nombre de GRAINES et non de montages.

### 4.4 `etalementMaxRangees: 2` — `src/data/sites.js`

Mesuré, ensembles de rangées occupées distincts sur vingt graines :

| étalement | camp n.30 | base n.45 | camp n.12 |
| --- | --- | --- | --- |
| *(avant le lot)* | 4 / 3 | 3 / 2 | 4 / 4 |
| 0 | 11 / 11 | 5 / 3 | 11 / 12 |
| 1 | 16 / 16 | 9 / 4 | 16 / 16 |
| **→ 2** | **16 / 18** | **9 / 3** | **16 / 16** |
| 3 | 16 / 19 | 9 / 4 | 17 / 16 |
| 4 | 16 / 18 | 9 / 4 | 17 / 16 |

⚠ **La première ligne n'est pas « étalement 0 »** : sans la couche de placement,
le bloc est CLOUÉ. À étalement 0 il DÉRIVE déjà sans porter de trou.

⚠ **`base n.45` ne bouge presque pas, et c'est la GÉOMÉTRIE.** À ce niveau-là,
les blocs remplissent presque leur bande — sept ou huit des huit rangées de
défense —, donc la marge est nulle ou d'une rangée et aucun plafond ne l'ouvre.
Une grosse base est dense ; c'est la densité qui la fige.

### 4.5 Les obstacles — §4.3

`placerObstacles` **n'a pas été touché**. L'arbitrage du 29/08 tient.

⚠⚠ **ET L'EFFET SUR LA TRAVERSÉE EST L'INVERSE DE CE QUE LE BRIEF ANNONÇAIT.**
Il prévoyait que « les obstacles se retrouveront parfois seuls devant ». Mesuré
sur 40 raids par cellule, obstacles en avant de la défense la plus avancée :

| | avant | après |
| --- | --- | --- |
| camp n.12 | 7,85 | **2,70** |
| camp n.30 | 5,13 | **1,10** |
| avantPoste n.30 | 1,45 | **0,15** |
| base n.45 | 0,75 | **0,20** |

Le bloc de défense dérive souvent vers l'AVANT et **dépasse** les obstacles.

Et la traversée elle-même, mêmes 40 raids :

| | ticks moyens | PV de défense restants (‰) |
| --- | --- | --- |
| camp n.12 | 279,8 → **340,3** | 610 → **536** |
| camp n.30 | 282,9 → **302,6** | 463 → **376** |
| avantPoste n.30 | 209,1 → **194,3** | 526 → **509** |
| base n.45 | 217,4 → **221,3** | 546 → **534** |

Le combat s'allonge plus souvent qu'il ne raccourcit, de peu, et la défense
s'use davantage : elle vient à la rencontre de l'assaut. **Aucun barème n'a été
touché ; le calibrage revient à Ethan.**

---

## 5. Le livrable

Mesuré poste par poste contre un livrable rebâti dans un `git worktree` depuis
`566a453` :

| poste | avant | après | écart |
| --- | --- | --- | --- |
| images | 7 374 800 | 7 374 800 | **+0** |
| audio | 1 187 560 | 1 187 560 | **+0** |
| feuille | 124 686 | 124 686 | **+0** |
| balisage | 42 469 | 42 469 | **+0** |
| JavaScript | 391 803 | 392 315 | **+512** |
| **total** | 9 124 362 | **9 124 874** | **+512** |

**La somme des cinq postes tombe exactement sur le total.** **306 URI `data:`
avant, 306 après ; 311 lignes `data:` avant, 311 après** — le lot ne fait entrer
ni une image ni un son.

Borne T10 **inchangée à 9 300 000**, marge **175 126 octets, 1,88 %**.

---

## 6. Les tests

Treize entrent, dans `test/disposition-ouvrage.test.js`. Le compte passe de
**1 472 à 1 485**. **Aucune assertion n'a été retirée.**

| test | montage effectif | ce qu'il tient |
| --- | --- | --- |
| **DO T1** | 20 graines × 4 niveaux × 3 types = 240 montages | les ensembles de rangées distincts dépassent un plancher **calculé sur la marge mesurée**, `1 + 3 × marge` plafonné à 12 ; les uniques ≥ 12 sur 20 ; la somme sur les douze cellules ≥ 120 (mesurée 179 / 163, contre 50 / 38 avant) ; et la silhouette case par case reste 20 sur 20 |
| **DO T2** | 3 types × 5 niveaux × 5 graines, deux appels chacun | `deepEqual` au champ près, plus la contre-épreuve qu'une autre graine diffère |
| **DO T3** | 3 types × 3 niveaux × 6 graines, `etalementMaxRangees` tourné de +3 | **la COMPOSITION ne suit pas le placement** — c'est la garde du §5 —, et ≥ 30 des 54 montages changent bien de rangées, sinon l'égalité serait gratuite |
| **DO T3 bis** | 3 types × 4 niveaux × 5 graines = 60 montages | le flux de placement est **rejoué de l'extérieur** depuis le sel exporté, tirage pour tirage : colonnes des uniques, puis bloc des bâtiments, puis bloc des défenses |
| **DO T4** | 3 types × 10 niveaux (10 à 50) × **100 graines = 3 000 montages** | `verifierLeRetraitDesPortees` ne lève sur aucun, et l'ordre est **remesuré de l'extérieur** — une garde retirée du générateur laisserait ce test vert. 1 000 artilleries au moins rencontrées |
| **DO T5** | 3 types × 50 niveaux × 5 graines = 750 montages | six occupants au plus, trois colonnes libres au minimum, **et le plafond est ATTEINT** plus de 100 fois |
| **DO T6** | 3 types × 6 niveaux × 20 graines = 360 montages, plus 60 graines pour les colonnes | rangée 18 pour les deux, cases distinctes, **les neuf colonnes atteintes des deux côtés**, et aucun proportionnel au fond |
| **DO T7** | 3 types × 5 niveaux × 20 graines = 300 montages | obstacles dans la bande de défense, sur aucune case prise, et jamais deux sur la même |
| **DO T8** | un camp n.25 graine 99, raidé pour de bon : **5 bâtiments touchés dont 4 détruits** | chaque bâtiment retrouve SES dégâts, **nommés par identifiant et par case** ; la falsification — permuter deux entrées — est **jouée**, pas décrite |
| **DO T9** | un site `base n.30` | la FORME du montage, clé par clé, et il passe `creerCombat` sans adaptation |
| **DO T10** | 3 types × 50 niveaux × 20 graines = 3 000 montages | les bornes en clair : défenses **3 à 10**, bâtiments **11 à 17**, trous **exactement 2** des deux côtés — atteints ET jamais dépassés |
| **DO T11** | les sels lus dans `sim/` et `render/`, 2 000 graines | le sel 8 est le premier libre **partout** ; le hachage ne recolle jamais au flux principal à moins de 1 000 tirages |
| **DO T12** | 3 types × 3 niveaux × 4 graines = 36 montages | l'empreinte, qui garde l'AVENIR |

### 6.1 Quatorze falsifications, quatorze chutes

Chacune est nommée par le test qu'elle vise (en gras) :

| # | falsification | attrapée par |
| --- | --- | --- |
| F1 | les deux blocs recollés à leur bord — le générateur d'avant | **T1**, T3, T3 bis, T8, T10, T12 |
| F2 | colonnes des uniques refigées au centre | T1, T3 bis, **T6**, T12 |
| F3 | le placement tire sur le flux PRINCIPAL — **la faute du §5** | **T3**, T3 bis, T12 |
| F4 | un tirage conditionnel dans le placement | **T3**, **T3 bis**, T12 |
| F5 | les bâtiments montent jusqu'au fond, sur les uniques | T3 bis, **T6**, T12 |
| F6 | `etalementMaxRangees` débridé à 7 | T8, **T10**, T12 |
| F7 | offsets renversés : l'artillerie devant | **T4** et dix autres |
| F8 | `occupantsMaxParRangee` relevé à 9 | **T5**, T8, T12 |
| F9 | sel 8 → 4, celui de la saveur | T8, **T11**, T12 |
| F10 | second flux dérivé par `graine + 0x6d2b79f5` | **T3 bis**, T12 |
| F11 | obstacles sur toute la grille | **T7**, T8, T12 |
| F12 | sel 8 → 7, celui de `render/terrain.js` | **T11**, T12 |
| F13 | une pièce gagne un champ | **T9**, T12 |
| F14 | `Math.random` dans le placement | **T2**, T3 bis, T12 |

⚠⚠ **ET F10 A CORRIGÉ UN DE MES PROPRES TESTS.** `DO T11` disait garder que la
dérivation passe par `hachageBrut` ; mesuré, elle **ne le voyait pas** — elle
recalculait le hachage au lieu de lire ce que le code emploie. C'est un proxy, et
le dépôt en a déjà payé trois. Son commentaire dit désormais que ce qui relie la
propriété au code est **`DO T3 bis`**, et pas lui.

### 6.2 Sept gardes existantes changent de cible, aucune ne s'assouplit

- **`COL T16`**, **`CR T4`** et le **`T6`** de `generateur.test.js` exigeaient
  `min(rangées) === derniere − taille + 1` — un bloc collé à la rangée 10 et sans
  trou. **C'est l'invariant qu'Ethan demande de relâcher.** Elles exigent
  désormais la bande ET un étalement borné par `etalementMaxRangees`, ce qu'un
  semis ne passerait pas.
- **`COL T18`** et **`CR T5`** exigeaient les uniques « au centre » — 5 et 4 sur
  toute graine. La moitié « au fond » **reste, intacte** ; la moitié « au centre »
  devient « colonnes distinctes, et les neuf atteintes ».
- **`T7`** de `generateur.test.js` réancre la rangée la plus avancée d'une
  artillerie, **8 → 7** sur le balayage du test, avec la mesure large en clair —
  **6 sur 110 000 montages** — et le fait qu'elle ne descende PAS jusqu'à la
  rangée 3.
- **`T12`** (invariance du miroir) passe d'un plafond en TICKS à un plafond
  RELATIF. Il tenait `ecartMax <= 1` sur un montage dont le pire combat durait
  434 ticks ; le même montage en dure 644 et le seul écart non nul vaut 5. **La
  structure n'a pas bougé d'un cheveu** — 4 comparaisons sur 500 avant comme
  après, toujours UNE cellule sur 50, toujours le niveau 2 seul contre les
  quatre autres. Le plafond tient donc la PART du combat que l'arrondi déplace :
  **0,231 % avant, 0,782 % après**, borne à 1 %. Un `<= 5` nu aurait laissé
  passer un miroir cassé sur un combat de cent ticks.

### 6.3 Les mesures figées, réancrées avec le nombre d'avant et celui d'après

| test | avant → après |
| --- | --- |
| `cible.test.js T4` | 409 → **414** ticks · butin 31 028 / 10 342 → **21 542 / 7 180** |
| `cible.test.js T5` | trois raids au plafond → **deux**, la liste bougeant des deux côtés |
| `roster.test.js T5` | 146 → **183** ticks, **une seule durée sur neuf niveaux** |
| `roster.test.js T6` | A 241 → **340** (redevient rentable), B 311 → **323**, C 635 → **528** |
| `assaut.test.js T7` | figés 296/588/569 → **206/492/650**, budgétés 241/311/635 → **340/323/528** |
| `repli.test.js T6` | 635 → **528** ticks, butin 60 714 → **69 210**, 9 → **11** survivants |
| `arsenal.test.js T10` | 635 → **528** ticks |
| `poi.test.js T18` | 743 / 896 → **939 / 1 095**, **écart relatif +16,6 %, au dixième de point comme aux deux lots précédents** |
| `recherche.test.js MODULES-F T14` | niveau 20 réancré ; **les trois du niveau 38 et deux des trois du niveau 50 sont identiques au point**, et **les trois graines ne changent pas** |
| `colonne.test.js T18 bis` | dette déclarée, triplets réancrés — **16 lèvent sur 600** contre 188 sur 540 |
| `raid-ecran.test.js` | le montage qui rase rebalayé : **g42 n.20 → g42 n.30**, seul le niveau bouge |

⚠ **`MODULES-F T14` EST LE PLUS PARLANT.** C'est la première fois en trois lots
que **sa prémisse ne tombe pas** : les trois graines discriminent toujours aux
trois niveaux, et un balayage des graines 1 à 60 en donne **33** qui le font,
contre six au lot précédent. C'est une conséquence directe du second flux — le
lot ne recompose rien.

### 6.4 Les deux témoins sont surchargés, jamais recapturés

- **`temoins-bases-0.js`, seizième couche** : **58 couples sur 308**, et **les
  six premières phases sont identiques AU BIT**. Tout part de la phase 7, le
  premier raid. ⚠ **`disposition` n'y est PAS**, alors que les quinze couches
  d'avant en déplaçaient : c'est celle de la base du JOUEUR, et ce lot ne
  recompose rien. Les scalaires ne bougent que sur les deux rapports de raid —
  gestes, sauvegarde, cases atteignables, déplacement, bases attaquantes, nombre
  de cibles et cible retenue sont **identiques sur les vingt-cinq graines**.
- **`temoins-combat.js`, quatrième couche** : 200 combats sur 200, **1 039
  champs déplacés**, dont **1 004 déjà surchargés** par l'une des trois couches
  d'avant. La surcharge passe de 1 296 à **1 331**, et il reste **269 champs**
  adossés à la capture d'avant JOURNAL-DE-COMBAT.

---

## 7. Écarts au brief, et ce qui est posé à Ethan

1. **Le §2 du brief est trop fort sur la « même silhouette ».** L'occupation case
   par case était déjà toute distincte — 20 sur 20 — avant le lot. Ce qui se
   répétait est nommé au §2.2 ci-dessus. Signalé, pas traité comme un point
   d'arrêt.
2. **Le §4.3 annonçait plus d'obstacles seuls devant ; il y en a MOINS.** Mesuré
   au §4.5. Le bloc de défense dérive vers l'avant et les dépasse.
3. **Le brief demande neuf tests, treize entrent.** `DO T3 bis`, `DO T10`,
   `DO T11` et `DO T12` s'ajoutent : le premier parce que le §4 exige un nombre
   de tirages constant et que `DO T3` seul ne le mesure pas ; les trois autres
   parce qu'une liberté non bornée n'est pas une liberté, qu'un sel réemployé se
   corrèle, et qu'une empreinte garde l'avenir.
4. **`DO T4` passe 3 000 montages, pas 5 000.** Le brief demande « des milliers
   de graines, pas trois » et de « borner le test et dire combien ». 3 types ×
   10 niveaux × 100 graines couvrent les niveaux 10 à 50 ; les porter à 5 000
   coûterait 66 % de temps de plus pour la même réponse. **Le nombre est écrit
   dans le test.**
5. **Un raid de référence touche de nouveau le « autre régime ».**
   `blindeLourd/camp/42` se conclut au tick **3 539** sans plafond, soit quatre
   fois les 900. C'est le troisième du genre après le 4 645 du lot CARTE et le
   5 478 du lot COLONNE. **À remonter ; Ethan tranche.**
6. **Les raids se déplacent dans les deux sens, et aucun barème n'a été touché.**
   Voir §6.3. Le calibrage revient à Ethan.
7. **Les deux uniques ailleurs qu'au fond n'a pas été pris** — c'est un arbitrage
   de règle, et le §4.2 du brief demande de le poser plutôt que de le prendre.
8. **`etalementMaxRangees` monte encore à 3.** Le tableau du §4.4 dit ce qu'on y
   gagnerait ; 2 est le point où le bloc reste lisible comme un bloc. **Un nombre
   se change seul.**

---

## 8. État final

| Grandeur | Valeur |
| --- | --- |
| `npm test` | **1 485 tests, 1 484 pass, 1 fail** |
| le rouge | `LIMITE T8`, unique, **celui de la baseline, non réparé** |
| `npm run build` | `dist/index.html`, **9 124 874 octets**, 0 référence externe |
| coût | **+512 octets, entièrement du JavaScript** |
| borne T10 | inchangée à 9 300 000 · marge **175 126 octets, 1,88 %** |
| `SAVE_VERSION` | **29**, inchangée |
| version / build | **0.99.36 · build 138** |
| `tools/verifier.py` | non lancé, et c'était conforme |

**Fichiers touchés** — `src/sim/generateur.js`, `src/data/sites.js`,
`test/disposition-ouvrage.test.js` (neuf), `test/generateur.test.js`,
`test/colonne.test.js`, `test/cible.test.js`, `test/roster.test.js`,
`test/repli.test.js`, `test/assaut.test.js`, `test/arsenal.test.js`,
`test/recherche.test.js`, `test/poi.test.js`, `test/raid-ecran.test.js`,
`test/bases.test.js`, `test/journal.test.js`, `test/temoins-bases-0.js`,
`test/temoins-combat.js`, `CLAUDE.md`, `package.json`, ce rapport.

**Aucun fichier de `src/ui/` ni de `src/render/`.**
