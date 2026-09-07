# RAPPORT — lot PREMIÈRE-COUCHE : les sprites entrent à l'écran

Écrit sur disque, à la racine, commité avec le reste. Toutes les grandeurs
ci-dessous sont **mesurées par exécution**, aucune n'est recopiée du brief.

---

## 1. Ce qui a été produit

| Grandeur | Valeur |
|---|---|
| Version | **0.41.0 · build 42** — `version` et `config.build` restés des **CHAÎNES** |
| `npm run check` | **559 pass / 0 fail** |
| `dist/index.html` | **581 125 octets**, delta depuis 530 268 : **+50 857** |
| Borne T10 | **600 000, INCHANGÉE** — marge 18 875 octets, soit **3,1 %** |

Le bump est dû : le HTML change de 50 857 octets, donc son SHA-256 et le
manifeste de Pages aussi.

⚠ **`version` ET `config.build` ONT ÉTÉ ÉDITÉS TEXTUELLEMENT, PAS PAR UN
SÉRIALISEUR JSON.** C'est la faute du 28/08 (CLAUDE.md §6, « les types de
`package.json` ») : un round-trip JSON rend `"41"` en `41`, et
`android/app/build.gradle.kts` le lit `as String`, si bien que le build Android
tombe à la CONFIGURATION — avant le moindre test, et le job `android` est le seul
qui ne tourne pas ici. Vérifié après édition : `typeof version === 'string'` et
`typeof config.build === 'string'`.

---

## 2. Les cinq chiffres de référence du brief, confrontés sur ce clone

Tous retrouvés avant de toucher à quoi que ce soit :

| Référence attendue | Mesurée |
|---|---|
| 548 pass / 0 fail | **548 pass / 0 fail** ✓ |
| `dist/index.html` 530 268 octets | **530 268** ✓ |
| 0.40.0 · build 41 | **0.40.0 · build 41** ✓ |
| `planches.py --verifier` → 88 identiques, 2 différents, 0 nouveau | **exactement ça** ✓ |
| les deux écarts sont `off_j_ratisseur` et `off_j_belier` en 32 | **exactement ceux-là** ✓ |

⚠ **UNE DÉPENDANCE MANQUAIT, ET CE N'EST PAS UN ÉCART AU DÉPÔT.** Les outils
Python demandent `Pillow`, `numpy` et `scipy`, absents de l'image. Ils ont été
installés pour pouvoir mesurer ; **aucun fichier du dépôt n'a été modifié pour
ça**, et `npm run check` ne les emploie pas.

---

## 3. Les sorties exactes des deux outils

Après `python3 tools/atlas.py --ecrire` :

```
bâtiment           16 sprites  4×4    23285 o  (31046 o en base64)
terrain            18 sprites  5×4    10549 o  (14065 o en base64)
src/data/atlas.js  identique
atlas identiques : 2 · différents : 0 · nouveaux : 0
```

C'est le contrôle d'idempotence demandé : **`2 identiques, 0 différent,
0 nouveau`**. Les deux tailles cousues tombent à l'octet sur celles annoncées par
le brief, ce qui dit que la couture est bien déterministe d'une machine à
l'autre.

`python3 tools/planches.py --verifier` :

```
identiques à l'octet : 88
différents           : 2
nouveaux             : 0
  ÉCART unite/32/off_j_ratisseur.png
  ÉCART unite/32/off_j_belier.png
```

Les deux écarts sont ceux que le brief §4.4 déclare **voulus**. Ils n'ont pas été
touchés, pas « réparés », et ils ne sont ni dans la grille 64 ni dans ce lot.

### `tools/atlas.py` n'a pas été modifié

`git status` et `git diff` sur ce fichier ne rendent rien : il est resté
exactement le fichier joint. Une réécriture « équivalente » changerait l'ordre de
couture, donc l'index, donc ce que le jeu affiche — et rien ne le dirait.

⚠ **SON ASSERTION D'EFFECTIF A ÉTÉ FALSIFIÉE, PAS SEULEMENT LUE.** Un sprite
retiré de `terrain/64/` : l'outil **sort en erreur, code de retour 1**, avec le
message qui dit que ce n'est pas un incident à contourner. Le sprite a été remis
et l'atlas se recoud identique.

---

## 4. Le compte de tests

**548 avant · 559 après · +11**, et **aucune assertion existante retirée ni
assouplie**.

| Fichier | Tests | Assertions |
|---|---|---|
| `test/sprite.test.js` (nouveau) | +7 | 38 |
| `test/chantier.test.js` | 62 → 66 | 583 → **609** |

Audit demandé par le brief §5 : `git diff test/chantier.test.js` ne contient
**aucune ligne `assert.` supprimée** — le fichier est purement additif.

---

## 5. Chaque test du §5 : verdict et montage effectif

Les sept tests de `test/sprite.test.js`, avec **la falsification qui prouve que
chacun mord**. Une falsification qui laisse la suite verte est un test qui ne
mesure rien ; les huit ci-dessous font toutes rougir.

| # | Test | Verdict | Montage effectif | Falsification → rouge |
|---|---|---|---|---|
| 1 | L'index correspond au disque | **PASS** | `readdirSync` sur `art/sprites/<dossier>/64/`, `.png` ôté, `sort()` en points de code, comparé à `ATLAS[slug].noms` pour les deux familles | un `bat_j_intrus` ajouté à l'index → **2 tests rouges** |
| 2 | La géométrie correspond à l'atlas réel | **PASS** | `readUInt32BE` sur l'IHDR des deux PNG cousus ; exige `largeur === colonnes × 64` et `hauteur === rangees × 64`, signature PNG assertée d'abord | `colonnes: 4` → `3` dans l'index → **1 rouge** |
| 3 | La formule rend le bon décalage | **PASS** | 4 cellules dont (0,0) et une intérieure ; le décalage est **recalculé** par `P/100 × (cadre − image)` sur une case de 42 px et confronté à `−colonne × 42` | `/(total − 1)` → `/total` → **1 rouge** |
| 4 | Un nom absent lève | **PASS** | trois levées attendues (nom absent, famille absente) + un témoin qui ne lève pas | retour d'une cellule (0,0) au lieu de lever → **1 rouge** |
| 5 | Les onze bâtiments se résolvent | **PASS** | balayage de `BASE_BATIMENTS`, règle camelCase → serpent, présence dans l'atlas, **et 11 noms distincts** | `id.toLowerCase()` au lieu du `replace` → **1 rouge** |
| 6 | La variante est stable et bornée | **PASS** | 162 cases × {2, 4} variantes : entier dans `0…n−1`, deux appels identiques, **et `vues.size === nombre`** | `return 0` → **1 rouge** ; graine ignorée → **1 rouge** |
| 7 | `etat.rng` n'est pas consommé | **PASS** | `creerEtat(4242)`, **témoin d'abord** (`tirer()` fait bouger `rng.s`), puis 162 peintures, puis `rng.s` inchangé ; plus un balayage de la source **décommentée** | import + usage du PRNG ajoutés au module → **1 rouge** |

### ⚠ Le test 7 est passé VERT sur du code cassé au premier essai

Sa garde de source cherchait `etat.rng` dans `variante.js` **commentaires
compris** — et l'en-tête du module NOMME `etat.rng` pour dire qu'il n'y touche
pas. La garde tombait donc sur sa propre explication.

C'est la **troisième fois** que le dépôt commet cette faute : après
`viewport-fit=cover` et `MENTION_SATURE` (CLAUDE.md §6). La garde lit maintenant
la source décommentée, et **deux appâts** prouvent qu'elle mesure encore quelque
chose — que le décommentage n'a pas vidé le fichier, et que le motif reconnaît
toujours un `etat.rng` écrit dans du vrai code.

### Les quatre tests ajoutés à `test/chantier.test.js`

Gardes de TEXTE, comme leurs voisines — le dépôt n'a ni jsdom ni navigateur.

| Test | Verdict | Falsification → rouge |
|---|---|---|
| Les 162 cases reçoivent un sol venu de l'atlas | **PASS** | pose du sol retirée → **1 rouge** |
| Le jeton porte un sprite, plus un sigle | **PASS** | jeton remis au sigle pour tous → **1 rouge** |
| L'obstacle perd son fond, garde sa lettre | **PASS** | lettre vidée → **1 rouge** |
| Les deux atlas entrent par une variable CSS, pixel art non lissé | **PASS** | `--atlas-batiment` retirée → **1 rouge** ; `image-rendering` retiré → **1 rouge** |

---

## 6. Les vérifications APPAREIL — toutes NON EXÉCUTÉES

⚠⚠ **IL N'Y A PAS D'APPAREIL DANS CETTE SESSION, ET UN TEST APPAREIL NON EXÉCUTÉ
SE DÉCLARE NON EXÉCUTÉ, JAMAIS PASSÉ** (CLAUDE.md §3).

| Vérification | État |
|---|---|
| **§4.2 — le bavement entre cellules d'atlas** | **NON EXÉCUTÉE** |
| Le sol se lit-il comme un sol, et non comme un damier ? | **NON EXÉCUTÉE** |
| Les onze bâtiments sont-ils reconnaissables à 42 px ? | **NON EXÉCUTÉE** |
| Le cadre de famille serre-t-il le sprite (voir §7) ? | **NON EXÉCUTÉE** |
| La lettre d'obstacle reste-t-elle lisible sur le sprite ? | **NON EXÉCUTÉE** |

**Ce qu'il faut regarder pour le bavement** : ouvrir l'écran Chantier, zoomer
fort sur le bord d'un jeton et sur le bord d'une case de sol. Un atlas mis à
l'échelle en pourcentage sur une case dont la largeur n'est pas un compte entier
de pixels peut laisser voir le bord de la cellule voisine ;
`image-rendering: pixelated` le contient dans la plupart des cas, et il est bien
posé sur `.case` **et** sur `.jeton.sprite`.

**Le repli, SI et SEULEMENT SI le cas se présente** : gouttière transparente de
2 px dans la couture et positions en pixels calculées d'un
`getBoundingClientRect`. C'est plus lourd, et il n'a **pas** été écrit d'avance.

---

## 7. Les deux points laissés à Ethan, réversibles tous les deux

### 7.1 Le cadre de famille et la géométrie à 84 % (demandé par le brief §3.7)

Livré comme le brief le demande : le jeton **perd** son fond uni et son sigle,
il **garde** son cadre de famille (`prod` · `mil` · `pivot`), son niveau, et sa
géométrie à 84 % de la case.

⚠ **C'EST RÉVERSIBLE EN DEUX LIGNES DE CSS.** Le cadre de famille est un
`box-shadow: inset` sur `.jeton.prod|mil|pivot`, la géométrie un
`width/height: 84%` sur `.jeton`. Si le cadre serre trop le sprite sur appareil,
il suffit de retirer l'un ou de porter l'autre à 100 %. **Ce n'est pas décidé
ici** : le sprite dit CE QU'EST le bâtiment, le cadre dit sa famille de coût et
le niveau son niveau — trois informations distinctes, et laquelle cède est un
arbitrage de lecture, pas de code.

### 7.2 Le liseré tireté des champs — ÉCART assumé, voir §8

---

## 8. Écarts par rapport au brief, et leurs raisons

### 8.1 `PASSATION-2026-08-30-sprites.md` est ABSENTE du dépôt

Le brief §0 demande de la lire, « la plus récente ». Elle n'existe pas : ni à la
racine, ni dans `rapports/`, ni dans l'historique git. La plus récente est
`PASSATION-2026-08-29-soir.md`, qui a été lue à sa place.

**Ce que ça change :** rien de mesurable — les cinq chiffres de référence du
brief ont tous été retrouvés, et les points de la passation cités par le brief
(§2 les PNG dérivés, §3.2.6 les deux écarts voulus, §4.1 la leçon de l'effectif
asserté) sont tous repris dans le brief lui-même. **Mais elle reste à écrire ou à
déposer** : c'est le document qui clôt la chaîne de production graphique.

### 8.2 `tools/` : le brief dit « 8 → 9 », le compte réel est **15**

Le brief §3.8 demande de porter la ligne `tools/` de 8 à 9 fichiers. **Le 8 était
déjà faux avant ce lot** : le dossier en portait 15 au départ (16 entrées moins
`__pycache__/`, qui est ignoré par git), la chaîne de production graphique y ayant
déposé ses scripts sans que personne ne recompte.

Écrire 9 aurait été recopier une erreur. La ligne dit **15**, et elle dit
pourquoi elle a dérivé : **aucune garde ne compte ce dossier** — le test de §2 ne
porte que sur les quatre dossiers de `src/` et sur `test/`.

### 8.3 Le liseré tireté des champs a été GARDÉ

Le brief §3.7b demande explicitement de retirer, pour les **obstacles**, le fond
`#5B4133` et le liseré — fait. Il ne dit rien du liseré des **champs** (`os` pour
le quartz, `ambre` pour la scorie), qui subsiste donc **par-dessus** le sprite.

**Pourquoi ne pas l'avoir retiré :** CLAUDE.md §6 réserve explicitement à Ethan
la façon dont un champ se lit — « à reprendre quand Ethan dira comment il veut
qu'un champ se lise ; c'est une décision de style, et la fiche fait autorité » —
et rappelle que la maquette et l'écran doivent se reprendre **ensemble**. Le
retirer aurait tranché seul cette décision-là, dans un lot qui ne la posait pas.

C'est **une ligne de CSS à retourner** (`.case.champ::before`), et c'est à voir
sur appareil : si le sprite dit déjà assez la ressource, le liseré est de trop.

### 8.4 `.case.obstacle` a gardé une règle, mais elle a changé de rôle

Retirer le fond et le liseré laissait la classe `obstacle` **sans aucune règle**
dans la feuille — et la garde du lot ÉCRAN-ACTIONS est tombée, à juste titre :
une classe que le JS bascule et que la feuille ignore est un lot entier qui ne se
voit pas.

Plutôt que d'inventer une règle décorative pour satisfaire la garde, le sélecteur
de la lettre a été **scopé** : `.obstacle-marque` est devenu
`.case.obstacle .obstacle-marque`. La classe a donc un rôle **réel** — c'est elle
qui fait apparaître la lettre, et la lettre n'apparaît que là.

### 8.5 Deux commentaires ont dû être corrigés avant livraison

Ils affirmaient que `peindre` passe « dix fois par seconde ». **C'est faux** :
`rafraichir` passe dix fois par seconde, `peindre` est appelée sur un GESTE et au
chargement. Mesuré à la place : **25,8 µs pour les 162 cases**, par geste. Le
dépôt punit les commentaires qui affirment sans mesurer (CLAUDE.md, « Vérifier
avant d'affirmer ») ; ils disent maintenant ce qui est vrai.

---

## 9. Points laissés en suspens

1. **La marge de T10 est tombée à 3,1 %** — 18 875 octets. Les cinq familles non
   cousues (socle, defense, unite, tourelle-unite, carte : 477 sprites) pèsent à
   elles seules **697 898 octets en base64**, mesurés par `atlas.py`. Le prochain
   lot qui en fait entrer une **devra relever la borne en écrivant pourquoi**,
   jamais rogner un atlas pour passer dessous.
2. **La défense reste hors sprite**, et pour deux règles de MODÈLE qui n'existent
   pas : rien dans l'état ne porte l'**orientation** d'une pièce posée
   (`sim/state.js` et `data/combat.js` n'ont ni orientation, ni azimut, ni cap),
   et les quatre socles de liaison (`_est`, `_ouest`, `_isole`, `_traversant`)
   supposent une règle de **chaînage entre merlons voisins** qui n'existe pas
   davantage. À écrire avant, pas pendant un lot d'écran. En attendant, la bande
   de garnison garde son fond uni et son sigle — `TERRAINS[x].spriteDe` vaut
   `null`, et c'est ce champ qui les sépare, jamais un nom écrit à la main.
3. **Ronce et herse** n'ont de sprite dans aucune grille ; jeton texte conservé,
   Ethan reprend la main dessus (arbitré le 30/08).
4. **Les cinq bâtiments de l'Ouvrage sont dans l'atlas cousu** — même famille —
   mais aucun écran ne les montre : ils serviront à l'écran de raid. Ce sont
   5 des 16 sprites de `atlas-batiment-64.png`, soit des octets déjà payés.
5. **Le commentaire de `index_js` dans `tools/atlas.py` cite
   `src/render/atlas.js`**, alors que le module s'appelle `sprite.js` — ce que le
   docstring de tête du même fichier dit correctement. **Non corrigé
   délibérément** : le brief §2 interdit de toucher à cet outil, et une
   correction de prose reste une modification. À reprendre le jour où l'outil
   sera rouvert pour une bonne raison.
