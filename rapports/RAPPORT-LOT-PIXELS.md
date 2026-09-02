# RAPPORT — LOT PIXELS

**Version produite** : `0.68.0` · build `69`.
**Base** : `main` à `caf55cc` (le brief annonçait `9d7d711` et `0.65.0` ; le
dépôt avait avancé de deux lots, BASES-0 et BASES-1, et de deux versions).
**`SAVE_VERSION`** : inchangée, **24**. Le lot ne touche ni l'état, ni la
sauvegarde, ni une règle de jeu.

---

## 0. Ce qui a été fait, en une phrase

La chaîne a cessé de faire rentrer les planches dans un moule. `ecrire` ne peint
plus une grille d'indices quantifiée sur quatorze teintes : il **détoure,
prémultiplie, réduit en LANCZOS, dé-prémultiplie et coupe l'alpha sous 8**. Les
atlas passent au WebP, la grille 32 sort, et deux gardes changent de nature —
chacune sur arbitrage d'Ethan, chacune falsifiée pour de bon.

---

## 1. État avant / après, mesuré

| | avant (`caf55cc`) | après |
|---|---|---|
| `npm test` | 902 pass / 0 fail | **903 pass / 0 fail** |
| `dist/index.html` | 1 388 959 o | **1 581 919 o** (+192 960) |
| borne T10 | 1 400 000 | **1 650 000**, marge 68 081 (4,13 %) |
| `data:` dans le HTML | 16 | **16** (8 PNG + 8 WebP) |
| `tools/verifier.py` | 1 386 · 2 · 0 · 0, vert, 116,4 s | **931 · 0 · 0 · 0, vert, 197,0 s** |
| `ECARTS_PERMANENTS` | 2 | **0** |

Les deux exécutions du vérificateur sont collées au §8.

---

## 2. Les bornes du §5 du brief, valeur MESURÉE

| mesure | attendu | **mesuré** | verdict |
|---|---|---|---|
| atlas WebP q85, grille 64, huit familles | ~490 ko (±10 %) | **561 240 o = 561 kB** | **+14,5 %** — manqué de plus de 10 %, moins de 20 % |
| atlas WebP q85, grille 128 | ~1 260 ko (±10 %) | **1 407 070 o = 1 407 kB** | **+11,7 %** — même cas |
| trous enfermés, Ouvrage, grille 128 | ≤ 1 500 px | **1 194 px** | tenu (le brief mesurait 1 192) |
| silhouettes | inchangées hors Ouvrage | joueur **0,56 %** de px changés, Ouvrage **6,14 %** | voir ci-dessous |
| effectifs par famille | identiques | **identiques**, 34 · 204 · 36 · 36 · 10 · 80 · 43 · 18 | tenu |
| `tools/verifier.py` | vert | **vert** | tenu |

**Sur les deux dépassements de taille.** Ils sont réels et je ne les ai pas
rognés : la §5 du CLAUDE.md interdit de baisser une borne pour faire passer un
lot, et elle interdit tout autant de rogner un atlas pour tenir un chiffre. La
composition, famille par famille, est au §7 ; le poste le plus lourd est
`defense` (204 sprites), qui passe de 127 148 à 180 268 octets. Aucune borne
n'est manquée de plus de 20 %, donc aucune condition d'arrêt du §7 du brief.

**Sur les silhouettes.** « Inchangées » est vrai à 0,56 % près côté joueur, pas
au pixel. C'est inhérent au geste : le vote de bloc rendait un bord franc, le
filtre rend un bord en alpha partiel, et le seuil de 128 déplace un pixel de
contour ici ou là. Les 6,14 % côté Ouvrage sont les trous rebouchés.

---

## 3. Les gestes, fichier par fichier

### 3.1 `tools/cond.py`

- `reduire(idx, N, TR)` — la sentinelle de transparence devient un **paramètre**.
  Elle valait `len(PAL)` = 14 ; la palette de l'Ouvrage en compte 19 et son
  index 14 est « A contour » `#0D0B12`.
- `est_fond_sujet(rgb)` — fonction **neuve**, où la seconde porte `c2` ne vaut
  que sur la composante de fond qui touche le bord (`scipy.ndimage.label`).
- `cle_de_fond(rgb)` — magenta ou vert `#00FF00`, d'après les quatre coins.
- **`est_fond` n'a pas été touchée**, conformément au §2.2 : elle découpe aussi
  les planches, et la déplacer déplacerait les gouttières.

### 3.2 `tools/final128.py`

- `conditionner` rend `(g, (a, fond))`. Signature explicite, aucune globale.
- `ecrire(g, P, path, matiere=None)` : sans matière, comportement d'avant ; avec,
  les cinq gestes dans l'ordre, prémultiplication comprise.
- `quant` lit ses seuils dans `tools/portes.py` (voir §5).

### 3.3 Les onze sites d'appel

Les dix outils du brief, patchés : `planches`, `tourelles` (×2),
`tourelles_unite`, `socles`, `connexions`, `emblemes`, `unites_ouvrage`,
`barrieres`, `chassis`, `ruines` (×2). **`tools/effets.py` n'a PAS été touché**
sur ce point, comme le brief l'exige. Le `__main__` historique de `final128.py`
a été mis à jour aussi : y laisser un appel à l'ancienne signature aurait été un
appel mort qui ment.

### 3.4 La grille 32

`GRILLES = (128, 64)` dans les onze fichiers qui la portaient. **465 fichiers
retirés du dépôt.**

⚠ **UN ÉCART DÉLIBÉRÉ AU §3.1 : `terrain/32` reste.** `terrain/` est une SOURCE
DÉCLARÉE de `tools/verifier.py` — aucun outil ne la produit, la branche terrain
de `planches.py` était une migration à usage unique qui a supprimé ses propres
originaux. Ses 18 tuiles en 32 sont **irrécupérables** ; les effacer aurait été
la seule amputation irréversible du lot. Le vérificateur les couvre par le
préfixe `terrain/`, donc elles ne sont pas comptées MANQUANTES.

Conséquences soldées avec elle :
- `ECARTS_PERMANENTS` devient **vide** — ses deux lignes désignaient
  `unite/32/off_j_ratisseur.png` et `off_j_belier.png` ;
- la passe `aligner` des chenilles est **retirée** de `planches.py` : elle ne
  tournait qu'en 32, et elle peignait dans `g`, que plus rien ne dessine ;
  `tools/align_chenilles.py` reste au dépôt, sans appelant, parce que retirer un
  outil d'art est une décision d'art ;
- les deux blocs de commentaire correspondants sont **réécrits**, pas laissés.

### 3.5 `tools/atlas.py`

- `GRILLES = (64, 128)`, `COTE_INDEX = 64`. Les deux grilles sont cousues,
  **seule la 64 est embarquée** ; la 128 coûte 1 407 070 octets de dépôt et zéro
  octet de livrable.
- Encodage **WebP q85, method 6, `exact=True`**. `exact` empêche l'encodeur de
  réécrire le RGB sous l'alpha : le dépôt compare à l'octet.
- Écrit `art/sprites/atlas-empreintes.json` (voir §4).
- `src/data/atlas.js` est **identique à l'octet** — noms et géométrie inchangés.

### 3.6 `tools/build.js`

`GRILLE_ATLAS = 64` et un constructeur `atlas(slug)` : **une seule constante**
décide de la grille embarquée, et le type MIME passe à `image/webp`. Le marqueur
`%ATLAS_TERRAIN_BASE%` garde sa ligne propre, son nom ne se déduisant pas du
slug — `%ATLAS_TERRAIN%` est pris par l'atlas du fond de carte.

⚠ **L'atlas du fond de carte (`carte/atlas-terrain-64.png`) reste un PNG**, et
c'est ce qui sauve trois tests : c'est une SOURCE DÉCLARÉE, aucun outil ne la
produit, ce lot n'y touche pas. `test/terrain.test.js` continue de la décoder et
`test/monde.test.js` de la relire en octets — le §3.3 du brief craignait pour
eux, la crainte était sans objet. **Vérifié en le jouant, pas en le raisonnant.**

### 3.7 `src/ui/banc.js`

`imageSmoothingEnabled` passe à `true`, avec le commentaire réécrit.

⚠⚠ **DIX AUTRES SITES PORTENT LE MÊME ARGUMENT ET N'ONT PAS ÉTÉ TOUCHÉS**, parce
que le brief ne nomme que cette ligne-là : `src/ui/raid.js` (le champ de
bataille, même échelle non entière), et **huit `image-rendering: pixelated`** de
la feuille, dont la grille de la base, qui vit à `--case-cote` px et n'est donc
pas non plus un multiple de 64. L'argument NE vaut PAS pour `src/ui/monde.js`,
dont les quatre crans sont des puissances de deux. **C'est une décision d'Ethan,
et elle est en attente** ; elle est écrite dans le commentaire de `banc.js` pour
que personne ne la croie tranchée.

---

## 4. Les tests

### 4.1 `test/sprite.test.js` l. 374 — NON TOUCHÉ

Vérifié avant d'y toucher : `assert.equal(couleursMax, 16, …)` et les bornes
`> 7` / `<= 16` portent sur la seule famille `bord`, produite par
`tools/bords.py`, hors du lot. Le bloc est intact.

### 4.2 Test neuf — les trous

`sprite — les sprites de l'Ouvrage ne sont plus percés de trous`. Remplissage
depuis le bord, quatre voisins, soustraction ; **1 194 px** sur les 163 sprites
`_o_` en grille 128, borne 1 500. Il est dans `sprite.test.js` et non dans un
fichier neuf : c'est le fichier qui porte déjà les croisements art ↔ chaîne, et
un fichier de plus aurait fait bouger `documentation.test.js` sans rien gagner.

**Montage falsifiable** : le compteur doit compter. Les châssis du JOUEUR portent
**2 694 px** enfermés, déjà au dépôt avant le lot — un `trousEnfermes` qui
rendrait zéro ferait passer l'assertion principale sur n'importe quel art. Et le
balayage doit trouver ses fichiers : `> 150` sprites exigés, 163 trouvés.

⚠⚠ **LA FALSIFICATION QUE LE BRIEF PROPOSAIT NE MARCHE PAS, ET C'EST MESURÉ.**
« Remettre `TR = len(PAL)` doit faire remonter au-dessus de 50 000 » : rejoué
pour de bon, en modifiant le code et en relançant quatre outils dans un dossier
dérouté, **0 fichier sur 51 change d'un octet** et le compte de trous ne bouge
pas d'une unité. La raison tient au §1 du brief lui-même : depuis que `ecrire`
réduit la MATIÈRE, la grille `g` n'atteint plus aucun fichier, et `boite(g)` —
son unique consommateur en production, dans `planches.produire` — voit son retour
jeté par l'appelant. **Les §1 et §2.1 ne sont pas indépendants : le premier
supprime le chemin par lequel le défaut du second pouvait se voir.**

La falsification qui mord est l'autre geste, §2.2 : rendre à `conditionner` la
clé nue (`est_fond` au lieu d'`est_fond_sujet`). Rejouée pour de bon, sur les
mêmes 51 sprites : **113 px → 19 213 px enfermés**, et 45 fichiers sur 51
changent. C'est écrit dans le commentaire du test.

⚠ **Le §2.1 a quand même été fait**, et il reste juste : `boite(g)` et
`bordure_vide` mentaient pour l'Ouvrage, et ils mentiront de nouveau le jour où
quelqu'un les relira. Mais il faut le dire pour ce qu'il est — **une correction
sur un diagnostic que personne ne lit aujourd'hui**, pas la cause des trous.

### 4.3 `test/accent.test.js` — arbitré par Ethan le 02/09

Il est tombé comme annoncé. Mesuré : après réduction par filtre, **aucun pixel
ne tombe plus exactement sur une teinte d'accent** — `off_j_pilon_s` passe de
161 pixels de véhicule à **zéro**.

Ethan a demandé de mesurer d'abord une quatrième voie : *le plus proche parmi
les six teintes d'accent seulement, sur les pixels déjà proches d'un accent*.
**Mesurée, elle plafonne à 40/48**, balayée de 10 à 100 dans les deux métriques
(euclidienne et pondérée 2/4/3) ; sa variante sans seuil — le plus proche des
six est-il plus proche que le plus proche des huit autres — rend 46/48, le
`busard` basculant sur structure (140 px contre 115). Sous 48, donc, et
l'instruction était alors de prendre « au plus proche + portes ».

**Retenu** : chaque pixel opaque est apparié à la teinte la plus proche des
quatorze de la rampe du joueur, sous les trois portes de `final128.quant`.
**48/48 d'accord hors dettes**, là où l'ancien test n'exigeait que 30 mesures ;
le plancher de couverture est relevé de 30 à **45** (52 combinaisons mesurées
sur 56).

⚠⚠ **LES SEUILS NE SE RETAPENT PAS EN JS, ILS SE GÉNÈRENT** — exigence d'Ethan.
`tools/portes.py` (module **neuf**, sans aucun import) porte les poids et les
trois portes ; `final128.quant` les emploie ; `tools/atlas.py` les écrit dans
`art/sprites/atlas-empreintes.json` ; le test les lit. **Le JS ne porte que la
FORME des trois conditions, pas un seul de leurs nombres.** C'est le motif
d'`ancres-chassis.json` appliqué ici.

**Falsification, jouée** : fermer la porte du rouge dans le fichier généré
(`rougeMin: 250`) fait tomber **les quatre tests**. La plomberie est prouvée,
pas supposée.

⚠⚠ **DEUX DES QUATRE `DETTES_ACCENT` SE REFERMENT, ET L'ART N'A PAS BOUGÉ.**
`ratisseur` et `belier`, camp `o`, rendent maintenant exactement ce que la table
de dégâts dit. Ce n'était pas l'art qui était de travers : **c'était la
quantification qui effaçait l'accent** — un pixel d'accent isolé perdait son
vote de bloc contre le kaki autour, et le sprite ressortait nu (« la pose
d'attaque n'a AUCUN pixel d'accent », disait la dette du 30/08). Les deux lignes
sont retirées, comme la table l'exigeait d'elle-même. Il en reste deux,
`broyeur j` et `pilon j`, **assertées encore violées**. Le témoin chiffré passe
de 161 à **179** pixels de véhicule : le nombre bouge parce que la mesure a
changé de nature, pas l'art.

### 4.4 La garde des pixels de l'atlas — arbitrée par Ethan le 02/09

**Le brief n'avait pas vu ceci** : `test/sprite.test.js` DÉCODAIT l'atlas pour
vérifier que sa cellule `i` porte les pixels du sprite `i` — la garde née de
BÂTIMENTS-1024. Node n'a pas de décodeur WebP, et le §3 du CLAUDE.md interdit
d'ajouter une dépendance de test ; écrire un décodeur VP8 à la main pour une
garde serait pire que le mal.

Trois issues ont été mesurées et soumises :
1. **manifeste d'empreintes** — retenu ;
2. committer aussi un PNG jamais embarqué : **+1,6 Mio de dépôt**, deux fichiers
   pour une vérité, et rien dans `npm run check` qui les relie ;
3. rester en PNG : le livrable passe de 1,58 à **~2,94 Mo**.

`tools/atlas.py` écrit donc `art/sprites/atlas-empreintes.json` : le SHA-256 de
chaque atlas ET de chaque sprite source. Le test vérifie les deux sans décoder
un pixel.

**Falsification, jouée dans les deux sens** :
- un sprite remplacé par un autre sous un atlas intact — le défaut du 30/08
  exactement — fait tomber la garde : « `bâtiment/bat_j_collecteur.png` a changé
  sans que l'atlas soit recousu » ;
- un atlas remplacé sous des sprites intacts la fait tomber aussi : « le fichier
  cousu n'est plus celui du manifeste ».

⚠ **CE QU'ELLE NE TIENT PLUS, ÉCRIT DANS LE TEST** : la correspondance CELLULE ↔
SPRITE, cellule par cellule. Elle est refaite par **reconstruction** à chaque
`python3 tools/verifier.py`, qui appelle `atlas.py --verifier` — l'outil recoud
l'atlas depuis les sprites et compare à l'octet, ce qui est strictement plus
fort, mais sur les lots qui touchent à l'art seulement, plus à chaque
`npm run check`. C'est le prix du WebP, et il est écrit.

### 4.5 La géométrie de l'atlas

`tailleDuWebp` lit l'en-tête RIFF — les trois conteneurs `VP8X`, `VP8L`, `VP8 `
— et **lève** sur un quatrième plutôt que d'inventer une taille. Aucun pixel
décodé. La garde de géométrie de l'index passe dessus telle quelle, sur huit
familles de géométries différentes (6×6, 5×4, 15×14, 9×9, 7×7, 4×3…).

### 4.6 La borne T10

Relevée de **1 400 000 à 1 650 000**, avec sa raison écrite dans le test :
la matière elle-même, chiffrée des trois façons (PNG quantifié, PNG libre,
WebP). Marge **68 081 octets, 4,13 %**.

---

## 5. Le fichier neuf, et le fichier généré

- `tools/portes.py` — **24ᵉ fichier de `tools/`**. Sans aucun import, exprès :
  `tools/atlas.py` ne dépend que de Pillow, et le faire passer par `final128`
  lui ferait traîner `cond`, donc `scipy`, pour lire quatre nombres.
- `art/sprites/atlas-empreintes.json` — 46 253 octets, généré. Il commence par
  `atlas-` et vit à la racine d'`art/sprites/`, donc `est_un_atlas` du
  vérificateur le couvre : il est comparé par `atlas.py --verifier`, pas compté
  MANQUANT. **La liste se calcule, elle ne s'écrit pas** — la ligne était déjà
  écrite comme ça.

---

## 6. Les écarts au brief, et leurs raisons

1. **`terrain/32` n'est pas supprimé** (§3.1). Source déclarée, irrécupérable.
2. **Les deux bornes de taille sont dépassées** de 14,5 % et 11,7 % (§5). Rien
   n'a été rogné pour les tenir.
3. **La falsification du §4.2 est réfutée** et remplacée par celle qui mord.
4. **Le lissage n'est changé que sur le canevas nommé** (§3.3), alors que dix
   autres sites portent le même argument. Décision en attente.
5. **Le test neuf est dans `sprite.test.js`**, pas dans un fichier à lui.
6. **La clé verte est plombée, pas éprouvée** : aucune source verte n'est au
   dépôt. Une qui arriverait passerait aussi par `recadrer`, dont le
   remplissage est magenta en dur et qui appelle `est_fond` — que le §2.2
   interdit de toucher. **Ce sera un lot, pas une ligne.**
7. Le brief annonçait `main` à `9d7d711` et `0.65.0` ; c'était `caf55cc` et
   `0.67.0`. Aucun numéro de ligne du brief n'a été suivi sans vérification.

---

## 7. La composition du poids, famille par famille (grille 64)

| famille | PNG quantifié (avant) | WebP q85 (après) |
|---|---|---|
| bâtiment | 43 117 | 42 952 |
| terrain | 10 549 | 14 598 |
| defense | 127 148 | 180 268 |
| socle | 55 376 | 63 230 |
| unite | 50 146 | 59 122 |
| chassis | 15 322 | 14 676 |
| tourelle-unite | 90 581 | 102 164 |
| carte | 86 554 | 84 230 |
| **total** | **478 793** | **561 240** |

Hors atlas, les deux grosses bases de l'Ouvrage passent de **27 779 à 90 047
octets** : elles sont inlinées une par une, un atlas d'un seul sprite ne cousant
rien. C'est le reste du +192 960.

⚠ `terrain` est la seule famille que le WebP alourdit (10 549 → 14 598) : ses
tuiles sont une source déclarée, toujours quantifiée sur quatorze teintes, et le
PNG est meilleur là-dessus. Quatre kilo-octets ; mélanger deux formats dans un
outil pour les récupérer aurait coûté plus cher en règle qu'en octets.

---

## 8. Les sorties, collées

### `npm run check` — après le lot

```
dist/index.html — version 0.68.0 build 69 — 1581919 octets (1544.8 Kio)
# tests 903
# pass 903
# fail 0
```

### `python3 tools/verifier.py` — avant le lot, sur `main` à `caf55cc`

```
identiques à l'octet : 1386
différents           : 2
nouveaux             : 0
MANQUANTS            : 0
durée                : 116.4 s
  écart déclaré  unite/32/off_j_belier.png — même cas que le Ratisseur — le fichier commité fait foi
  écart déclaré  unite/32/off_j_ratisseur.png — la source 1024 ne redescend pas à 32 sans retouche à la main
VERDICT : la chaîne répond de ses sprites
```

### `python3 tools/verifier.py` — après le lot

```
identiques à l'octet : 931
différents           : 0
nouveaux             : 0
MANQUANTS            : 0
durée                : 197.0 s

VERDICT : la chaîne répond de ses sprites
```

Il a été rejoué **après** l'extraction des seuils dans `tools/portes.py`, et il
est resté à 931 · 0 · 0 · 0 : l'extraction est un no-op à l'octet, mesuré et non
supposé.

---

## 9. Ce qui reste ouvert

1. **Le lissage sur les dix autres sites** — `ui/raid.js` et les huit
   `image-rendering: pixelated`. Décision d'Ethan.
2. **Les deux bornes de taille**, dépassées de 14,5 % et 11,7 %. Si le chiffre
   compte plus que le rendu, le curseur est `QUALITE` dans `tools/atlas.py` :
   mesuré, q80 rend **514 712 octets**, soit 46 528 de moins.
3. **La grille 128 est cousue et n'est lue par personne** — 1,4 Mo de dépôt pour
   un écran qui n'existe pas. Le brief la demande ; si Ethan préfère ne pas la
   porter, c'est une ligne de `GRILLES` dans `tools/atlas.py`.
4. **`tools/align_chenilles.py` n'a plus d'appelant.** Le retirer est une
   décision d'art : les bandes qu'il dessinait pourraient revenir dans la source.
5. **Les emprises, les tourelles de l'Ouvrage deux fois trop petites, la rotation
   dans l'outil** — hors lot, §6 du brief, inchangés.
6. **La clé verte** attend sa première source, et le lot qui ira avec.
