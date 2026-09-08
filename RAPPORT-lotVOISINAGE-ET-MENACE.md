# RAPPORT — lot VOISINAGE-ET-MENACE

Points **3** et **4** du relevé d'Ethan du 08/09/2026.

- **Version produite : `0.99.36` · build `138`** — les deux restent des chaînes JSON.
- **Branche :** `claude/foyer-zer0-patch-5lqyq8`, repartie de `origin/main` = `566a453`.

---

## 1. Base de départ — mesurée, pas recopiée

| Grandeur | Valeur |
| --- | --- |
| `main` | **`566a453`** — exactement le commit contre lequel le brief a été écrit |
| `npm test` avant | **1472 tests, 1471 pass / 1 fail** |
| Le rouge | `LIMITE T8`, `test/limite.test.js:432` — `limite_j : #475A2F est à 3.5 sous le p5 du sol (5 au moins)` |
| `dist/index.html` avant | **9 124 362 octets** |
| `SAVE_VERSION` | **29** |

⚠⚠ **LE ROUGE EST LE POINT D'ARRÊT DÉCLARÉ PAR LE §1.4 DU BRIEF.** Il était là
avant le lot, il est unique, il n'a été ni réparé, ni contourné, ni commenté.

**Arborescence relevée** (§1.2, jamais depuis la mémoire) : racine **85**
fichiers · `src/data/` **13** · `src/sim/` **31** · `src/render/` **14** ·
`src/son/` **2** · `src/ui/` **13** · `test/` **69** dont **62** `.test.js`.
Passation la plus récente : `rapports/PASSATION-2026-09-01-raid.md` — **aucune à
la racine**, elles ont toutes migré dans `rapports/`.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** (§1.5) :
le lot ne touche ni `art/`, ni un outil de la chaîne.

---

## 2. Point 4 — la menace : ce que la mesure répond

**Le §3 a été fait AVANT d'écrire une ligne du §2**, pour que la mesure ne soit
pas polluée par la règle.

### 2.1 Ethan est à portée, et c'est exactement le problème

Balayage sur **25 graines**, rangée par rangée, base du joueur déplacée puis
`ciblesAPortee` et `attaquantesDeLaPosition` interrogées :

| rangée | niveau | sites VISIBLES à portée | bases qui PEUVENT attaquer | raids / 72 h |
|---|---|---|---|---|
| 295 (départ) | 1 | **0,0** | 0,0 | 0,0 |
| 290 | 2 | 0,2 | 0,0 | 0,0 |
| 285 | 3 | 12,6 | 0,0 | 0,0 |
| 275 | 5 | 45,1 | 0,0 | 0,0 |
| 270 | 6 | **55,3** | **0,0** | **0,0** |
| 264 | 7 | 55,7 | 0,0 | 0,0 |
| **262** | 8 | 55,8 | **0,2** | 0,6 |
| 260 | 8 | 55,5 | 4,0 | 11,8 |
| 250 | 10 | 55,4 | 36,2 | **107,9** |
| 240 | 12 | 54,9 | 54,9 | **163,4** |

**De la rangée 290 à la rangée 263 — vingt-huit rangées — le joueur voit jusqu'à
55,7 bases de l'Ouvrage dans son propre rayon d'attaque, et pas une ne peut le
raider.** Au départ il n'y a même **rien du tout** à portée : la garde de
peuplement (`PEUPLEMENT.garde.gardeAutourDuDepart` vaut 15) écarte l'Ouvrage de
quinze cases, et le rayon d'attaque en fait dix.

⚠⚠ **« À PORTÉE » EST SYMÉTRIQUE EN GÉOMÉTRIE ET ASYMÉTRIQUE EN RÈGLE.** Le
joueur peut raider une base de niveau 3 ; une base de niveau 3 ne peut pas le
raider — `RAID_OUVRAGE.niveauMinimal` vaut 10, et le niveau d'une base de
l'Ouvrage est celui de sa RANGÉE. Même disque, circulation à sens unique. **Rien
à l'écran ne le dit**, et c'est toute la plainte d'Ethan.

### 2.2 L'issue retenue est (a) — et (b) comme (c) sont écartées par la mesure

- **(b) « des bases qualifient, et rien n'arrive » — ÉCARTÉE, maillon par
  maillon.** À la rangée 250, graine 7 : `basesAttaquantes` → **36** ;
  `baseAttaqueALaMinute` → **39 tirs sur 1440 minutes** ; `prochaineMinuteDeRaid`
  → **minute 9** ; `resoudreLaMinute` → **1 raid** ; `subirUnRaid` → **1 rapport**,
  `sens=defense`, `verdict=defaite-totale`, `restantBatiments=0`, **5 500 000
  milli-PV de dégâts posés**. Aucun maillon ne rend systématiquement vide. À la
  rangée 270 la chaîne s'arrête au PREMIER, et c'est le comportement correct.
- **(c) « 1/1440 rend la menace imperceptible » — RÉFUTÉE.** Une fois qualifié,
  c'est **107,9 raids par 72 h** à la rangée 250 et **165,1** à la 227 : un raid
  toutes les quarante minutes. La menace n'est pas faible, elle est **absente
  puis brutale**. Il n'y a pas de gradient, il y a une falaise.
- **(a) « aucune base qualifiée à portée » — RETENUE.** Ce n'est pas un défaut du
  moteur, c'est un défaut de **LISIBILITÉ**, et le brief le range dans le lot
  PANNEAUX-DE-LA-CARTE. **Ce lot ne corrige pas l'écran.**

### 2.3 L'invariant qui prime sur tout est intact

`tickJeu` × 2 592 000 contre `rattraperJeu(2 592 000)`, rangée 250, **5 graines,
72 h simulées** : **0 divergence**, sérialisation identique à l'octet (1 770 à
1 773 octets selon la graine), mêmes rapports, mêmes positions, mêmes dégâts.
Coût : 7 à 46 ms en rattrapage contre 9,7 à 63 s en direct.

### 2.4 Un fait émergent, non demandé et mesuré

Une base neuve posée rangée 250 est **rasée à la minute 9** — elle n'a qu'un
Chantier de niveau 1, donc aucune défense — et `sanctionRasage` la descend de
vingt rangées, à **270**, où plus rien ne peut l'attaquer. Mesuré rangée par
rangée : le repli protège aux rangées **245–250**, et **plus du tout à partir de
240**. Le rasage renvoie donc dans la bande immunisée, mais seulement au début.

### 2.5 La table d'arbitrage — RIEN N'A ÉTÉ TOUCHÉ

`chanceParMinute` et `niveauMinimal` sont **inchangés** (§5 du brief). Ce que
vaudrait un autre seuil, mesuré sur 25 graines :

| `niveauMinimal` | 1re rangée menaçante | cases depuis le départ | bande immunisée |
|---|---|---|---|
| **10 (actuel)** | 262 | 33 | **28 rangées** |
| 8 | 272 | 23 | 18 rangées |
| 6 | 282 | 13 | 8 rangées |
| 4 | 290 | 5 | **0 rangée** |

À **4**, la bande disparaît : dès qu'une base de l'Ouvrage est visible à portée,
elle peut attaquer. **Ethan tranche.**

---

## 3. Point 3 — aucune base collée à une autre

### 3.1 Une écriture, deux lecteurs

`src/sim/voisinage-des-bases.js` entre, avec **une** fonction exportée,
`problemesDuVoisinageDesBases(etat, cible, baseExclue)`. Elle est appelée par
`problemesDeLaFondation` **et** par `problemesDuDeplacement`.

⚠⚠ **SANS LE SECOND APPEL, LA RÈGLE NE VAUDRAIT RIEN** : le joueur fonderait
loin, puis déplacerait sa base juste à côté de l'Ouvrage au geste suivant. Le
contournement serait à un toucher. `VM T4` est le test qui prouve qu'il est
fermé, et sa falsification — retirer l'appel du déplacement — le fait rougir
pendant que `VM T1` reste vert.

La constante vit dans **sa propre table**, `ENCOMBREMENT_DES_BASES` de
`src/data/sites.js`, jamais dans `FONDATION` ni dans `DEPLACEMENT` : c'est la
quatrième grandeur de distance du fichier — le déplacement dit jusqu'où une base
SAUTE (10), la fondation jusqu'où on en POSE une (10), le transfert jusqu'où une
ressource VOYAGE (99), celle-ci dit ce qu'une base **ENCOMBRE** (1, Tchebychev).

⚠ **TCHEBYCHEV, PAS UNE PORTÉE EUCLIDIENNE.** Le lot EUCLIDE a fait de toute
*portée* un disque ; ceci n'est pas une portée, c'est un encombrement, et « les
9 cases » nomme un carré. `d² ≤ 2` couvrirait bien les huit voisines aujourd'hui,
mais dirait une géométrie qui n'est pas celle de la règle, et le premier qui
porterait le rayon à 2 obtiendrait un octogone.

### 3.2 Écart déclaré : le bloc contient son CENTRE

Le brief laissait entendre que seules les HUIT voisines étaient en jeu, la case
exacte étant déjà refusée ailleurs. **Elle l'est à la fondation ; elle ne l'était
PAS au déplacement** — mesuré, `problemesDuDeplacement` ne connaissait que
`hors-carte`, `sur-place`, `trop-loin` et `delai`.

⚠⚠ **DÉPLACER SA BASE SUR LA CASE EXACTE D'UNE BASE DE L'OUVRAGE ÉTAIT DONC
PERMIS, ET LE GESTE L'EFFAÇAIT DE LA CARTE** — `siteDeLaCase` rend `null` sur
toute case occupée par une base du joueur. Ethan dit « les 9 cases » ; on prend
les neuf, et le trou se ferme avec la règle plutôt qu'avec une seconde condition.

⚠ **ET LA CASE EXACTE GARDE SON REFUS PROPRE, DES DEUX CÔTÉS.** Le brief demande
de **RÉÉCRIRE le commentaire** du `=== 0` — pas de supprimer le bloc, ce que la
relecture de la phrase (« *ce commentaire* doit être réécrit ») confirme. « Une
de tes bases est déjà là » est plus utile au joueur que « il faut une case
libre ». Sur la case exacte il lit donc deux raisons, et les deux sont vraies :
elles répondent à deux questions différentes — la **crushabilité** et
l'**encombrement**.

### 3.3 Ce que la règle coûte — LE CHIFFRE À ARBITRER

L'Ouvrage est **beaucoup plus dense que le brief ne le suppose**. Cases dont le
3 × 3 est libre de toute base de l'Ouvrage, 10 graines × 29 colonnes :

| rangée | 295 | 285 | 275 | 265 | 255 | 245 | 225 | 150 | 50 |
|---|---|---|---|---|---|---|---|---|---|
| cases au 3 × 3 libre | 94,1 % | 73,8 % | **0,3 %** | 1,7 % | 3,1 % | 0,3 % | 1,0 % | 1,4 % | **0,0 %** |

Conséquence sur `casesAtteignables`, **20 graines** :

| rangée | 295 | 290 | 285 | 280 | 275 | 265 | 250 | 200 | 100 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| avant la règle | 261 | 316 | 316 | 316 | 316 | 316 | 316 | 316 | 316 | 316 |
| **après** | **261** | 306,8 | 217,7 | 124,0 | 43,1 | **5,0** | 5,7 | 6,0 | 6,5 | 5,5 |
| graines BLOQUÉES | 0 | 0 | 0 | 0 | 0 | **3/20** | 0 | 0 | 1/20 | 0 |

**5 situations sur 300 (1,7 %) n'ont AUCUNE destination légale** — un joueur
immobilisé. Le départ, lui, n'est pas touché : 261 avant, 261 après.

⚠⚠ **MAIS LA PORTE DE SORTIE TIENT, ET ELLE EST MESURÉE 5 FOIS SUR 5 : UN SEUL
RASAGE DÉBLOQUE.** Raser une base de l'Ouvrage voisine la met dans `casesRasees`,
`siteDeLaCase` y rend `null`, et le 3 × 3 s'ouvre — 2 à 6 destinations
retrouvées. La règle n'est donc pas une impasse : c'est une porte qui se mérite,
ce qui est « tout se débloque lorsqu'on pourra bouger la base » pris à la lettre.
**Le fait est remonté, pas corrigé : la règle est celle d'Ethan.**

### 3.4 Une seconde règle d'Ethan entre en collision — mesuré, non corrigé

`SATELLITES.camps.anneau` vaut `{min: 1, max: 2}`. Sur **60 graines, 180
satellites** :

| type | à Tchebychev 1 | à Tchebychev ≥ 2 | devenus INFONDABLES |
|---|---|---|---|
| camp | 84 / 120 | 36 / 120 | **70,0 %** |
| avantPoste | 0 / 60 | 60 / 60 | **0,0 %** |

**70 % des camps paraissent collés à la base du joueur, et sont donc devenus
infondables** alors que `TYPES_ECRASABLES` les autorise toujours. Le levier est
**un nombre** — `SATELLITES.camps.anneau.min` de 1 à 2 — et c'est du calibrage :
**Ethan tranche.** `BASES-1 T6` mesure et garde les deux moitiés.

### 3.5 Les trois conséquences du §2.6 du brief

1. **Aucune rétro-correction.** `SAVE_VERSION` reste à **29**, vérifié au diff ;
   rien ne déplace ni ne signale quoi que ce soit au chargement. La règle juge
   les GESTES, pas l'histoire.
2. **La sanction de rasage n'est pas soumise à la règle.** `raserLaBase` passe
   par `poserLaBaseSur`, qui ne vérifie ni portée, ni délai, ni voisinage —
   vérifié à l'exécution. Si la case d'arrivée tombe à côté d'une base de
   l'Ouvrage, elle y tombe : **relevé, non corrigé**.
3. **`casesAtteignables` suit PAR CONSTRUCTION**, et c'est le fait à garder :
   elle INTERROGE `problemesDuDeplacement` au lieu de réécrire ses règles — le
   motif de `casesPosables` de l'écran Chantier. **La falsification que le brief
   proposait ne peut donc pas mordre** ; `VM T8` garde la propriété par la
   SOURCE, et la falsification qui la fait décider seule le fait tomber.

⚠ **AUCUN CYCLE D'IMPORT**, vérifié avant d'écrire : `site-de-la-case.js`
n'importe ni `deplacement.js` ni `fondation.js`. Et **le poids ne bouge pas** de
ce côté — tout est déjà inliné dans un fichier unique ; ce qui bouge est le
couplage.

---

## 4. Les neuf tests, et les onze falsifications

`test/voisinage.test.js` entre — **`VM T1` à `VM T9`**.

⚠⚠ **TOUS LES MONTAGES RASENT LE VOISINAGE AVANT DE MESURER, ET CE N'EST PAS UN
CONFORT.** À 0,3–3 % de cases au 3 × 3 libre, un montage posé sur une carte
intacte mesurerait la DENSITÉ du peuplement et pas la règle : tout y est refusé,
et une falsification qui retire le refus laisserait le test vert.

| # | falsification | tests qui rougissent |
|---|---|---|
| F1 | rayon ramené à 0 | T1, T2, T3, T4, T5 |
| F2 | rayon porté à 2 | T2, T3, T4 — **et T1 reste VERT** |
| F3 | appel retiré du déplacement | T4, T5, T8 |
| F4 | appel retiré de la fondation | T1, T2, T6 |
| F5 | la base qui bouge n'est plus exclue | T5 |
| F6 | le refus « case exacte » remplacé par le voisinage | T6 |
| F7 | on compte tout ce que `siteDeLaCase` rend | T7 |
| F8 | `casesAtteignables` réécrit ses règles | T8 |
| F9 | le sel du tirage de raid change | T9 |
| F10 | on ne compte que l'Ouvrage | T2, T5 |
| F11 | euclidien au lieu de Tchebychev | T2, T5 |

**Onze falsifications, onze chutes, ZÉRO muette.** Chacun des neuf tests tombe
sous au moins une.

⚠ **`F2` EST LE COUPLE QUE LE BRIEF ANNONÇAIT** : porter le rayon à 2 fait
rougir T3 et **laisse T1 vert** — c'est le couple T1/T3 qui mesure le rayon, pas
T1 seul.

⚠ **`F11` NE FALSIFIE QUE LA MOITIÉ DE LA GÉOMÉTRIE, ET IL FAUT LE DIRE.** Elle
remplace `distanceTchebychev` par une distance euclidienne dans la boucle des
bases du JOUEUR ; la boucle de l'Ouvrage balaie un carré par construction et ne
peut pas « devenir euclidienne » sans être réécrite. C'est le seul endroit où
une fonction de distance est appelée.

⚠ **DEUX VALEURS DE `VM T9` ONT ÉTÉ ÉCRITES AU JUGÉ PUIS MESURÉES**, et les deux
étaient fausses — 15 et 720283454 inventés contre **7** et **662170501** mesurés.
Elles sont ancrées sur la mesure.

---

## 5. Les montages réparés — aucune assertion retirée ni assouplie

Vingt-deux montages ont perdu leur prémisse. **Aucun n'a été assoupli ; chacun a
été réparé en nommant l'observable qui discrimine encore.**

| fichier | combien | ce qui a changé |
|---|---|---|
| `transfert.test.js` | 11 | il fondait à UNE case de la source, il fonde à DEUX ; l'écart final, posé ensuite par `poserLaBaseSur`, n'a pas bougé |
| `missions.test.js` | 8 | il fondait « une case au sud » ; **il DEMANDE la case au moteur** |
| `deplacement.test.js` | 7 | il se posait en territoire dense et mesurait la densité ; il rase le voisinage par `partieDegagee`, le motif de `sansVoisinsOuvrage` de `poi.test.js` |
| `bases.test.js` | 3 | T6 et T7 bis cherchent un camp à deux cases et **cherchent la graine** ; T11 demande la case au moteur |

**Un montage qui écrit une coordonnée ne garde que lui-même** — sixième fois du
dépôt, et c'est la leçon qui a guidé chaque réparation.

### 5.1 Une garde est RETOURNÉE, pas réparée

`BASES-1 T5` figeait l'arbitrage du 02/09 en toutes lettres — « fonder à côté de
sa propre base est autorisé, conséquence signalée et acceptée : deux bases du
joueur peuvent être adjacentes ». **C'est exactement la propriété que ce lot
renverse**, donc c'est l'assertion qui se renverse : la réparer aurait gardé un
test vert sur une règle morte. Elle **falsifie l'ancienne de face** — comme
`EMB-C T1` l'a fait pour l'ancrage des emblèmes.

### 5.2 Une garde se RESSERRE

`BASES-1 T6` gagne la moitié qui manquait : le camp **collé** est refusé, celui à
**deux cases** passe. Sans la seconde, le test passerait sur un code qui aurait
retiré `camp` de `TYPES_ECRASABLES`, c'est-à-dire tué la règle qu'il prétend
garder.

---

## 6. Le livrable — mesuré poste par poste

Contre un livrable rebâti dans un `git worktree` depuis `origin/main` :

| poste | référence | lot | écart |
|---|---|---|---|
| JavaScript | 391 813 | 392 471 | **+658** |
| feuille | 127 211 | 127 211 | +0 |
| balisage | 36 205 | 36 205 | +0 |
| images | 7 375 787 | 7 375 787 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |
| **TOTAL** | **9 124 362** | **9 125 020** | **+658** |

**La somme des cinq postes tombe EXACTEMENT sur le total.** **311 lignes `data:`
de part et d'autre, 306 URI de part et d'autre.** **0 référence externe.**
Borne T10 **inchangée à 9 300 000**, marge **174 980 octets, 1,88 %**.

`npm test` après : **1481 tests, 1480 pass / 1 fail** — le fail est `LIMITE T8`,
celui du départ, seul et déclaré. **+9 tests, aucun retiré.**

---

## 7. Ce que le lot n'a pas touché

- **Aucun fichier de `src/ui/`** — trois lots tournaient en parallèle dessus, et
  le brief l'interdisait nommément. Vérifié au diff.
- **Aucun réglage de `chanceParMinute` ni de `niveauMinimal`** (§5).
- **Aucune correction de `LIMITE T8`.**
- **Aucun toucher à `art/`, `tools/`, `src/render/`, `src/sim/generateur.js`.**
- **Aucune rétro-correction des sauvegardes**, `SAVE_VERSION` reste à **29**.
- Le rangement des trois `casesEnLigneDroite` jumelles : **pas de ce lot**.

⚠ **LE RENDU N'A PAS ÉTÉ VU, ET SE DÉCLARE NON EXÉCUTÉ.** Le lot ne change aucun
pixel : il ajoute un refus dans le modèle et mesure une menace.

---

## 8. Ce qui reste à arbitrer par Ethan

1. **Le seuil `RAID_OUVRAGE.niveauMinimal`** — §2.5. À 10, vingt-huit rangées où
   l'on voit l'ennemi sans rien risquer ; à 4, aucune.
2. **`SATELLITES.camps.anneau.min`** — §3.4. À 1, sept camps sur dix sont
   infondables ; à 2, aucun.
3. **Le coût de la règle sur le déplacement** — §3.3. Six destinations au lieu de
   316, et 1,7 % de situations bloquées jusqu'au premier rasage. La règle est
   celle d'Ethan ; le chiffre est remonté pour qu'il sache ce qu'elle coûte.
4. **La lisibilité de la menace** — §2.2, issue (a). Rien à l'écran ne dit au
   joueur qu'il n'est pas menacé. Le brief range ce travail dans le lot
   PANNEAUX-DE-LA-CARTE ; ce lot s'arrête au constat, avec les chiffres.
