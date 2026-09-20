# RAPPORT — lot SOUFFLE

**20/09/2026.** Les deux grosses bases de l'Ouvrage passent de PNG en WebP.
Version produite : **0.99.70 · build 182**. Base de départ : `c8567bc`, merge du
lot RUINES-DÉFENSE (PR #159).

Le lot ne fait entrer aucun dessin et n'en modifie aucun. Il change un encodage,
et rend **371 454 octets de livrable**.

---

## 1. Ce que le lot corrige

`tools/build.js` inlinait **trente-neuf ressources binaires** : dix-neuf atlas et
neuf fonds en WebP, deux cent soixante-trois sons en Opus — et **deux PNG**,
`base_o_2x2` et `base_o_3x3`.

Ces deux-là sont les seules images du dépôt qui entrent dans le livrable
**telles qu'elles sont sur le disque**. Toutes les autres passent par `coudre`,
qui les réencode en WebP q85 : le PNG d'un sprite cousu est un intermédiaire, et
son poids ne se retrouve nulle part dans le livrable. Les deux grosses bases ne
sont pas carrées à la taille de case — 2 × 2 et 3 × 3 cases —, donc `coudre` les
refuse et elles voyagent par leur propre marqueur. **Leurs octets de PNG étaient
les octets du livrable**, à un tiers près pour le base64.

Elles ont gardé leur format depuis le lot CARTE-EMBLÈMES (30/08), quand le dépôt
entier était encore en PNG. Le lot PIXELS a porté les atlas en WebP et ne les a
pas vues : elles n'en sont pas.

---

## 2. La mesure qui a décidé

Le gain n'était pas en question — il se lit sur le disque. Ce qui devait être
mesuré, c'est **la perte**.

Écart RGB entre la source et l'encodé, sur les **pixels opaques** :

| Fichier | moyenne | maximum | px au-delà de 30 |
|---|---|---|---|
| `base_o_2x2` (256²) | **7,14** | 102 | 1,27 % |
| `base_o_3x3` (384²) | **7,35** | 89 | 1,18 % |
| *référence :* `site_base_o_n9` *dans `atlas-carte-128.webp`, tel qu'il est au dépôt* | *10,38* | *113* | *2,77 %* |

La référence est un emblème de la **même famille**, cousu, que le jeu affiche
aujourd'hui. **Le lot dégrade donc moins que la couture que tous les autres
emblèmes de la famille subissent déjà.** C'est ce qui a rendu la décision
facile : il ne s'agissait pas d'accepter une perte nouvelle, mais d'aligner deux
images sur le régime des cent trente-trois autres.

⚠ **L'alpha est intact au bit** — écart maximum **0** sur les quatre fichiers,
aux deux grilles. Aucun bord ne bouge. C'est le point qui inquiétait le plus :
un lossy qui fait baver l'alpha aurait rongé le contour des grosses bases, et
`ecrire` met justement le RGB à zéro sous le seuil pour n'avoir rien à cacher.

⚠ **Le lossless a été essayé et écarté, mesuré** : 85 448 + 147 960 octets, soit
un gain de 28 % là où le lossy en rend 85 %. Pour une image que le jeu affiche à
la taille d'une tuile de carte, le prix ne se défendait pas.

---

## 3. Le gain, ventilé

Mesuré poste par poste contre le livrable rebâti dans un `git worktree` sur
l'arbre pristine de `main` = `c8567bc`.

| Poste | Avant | Après | Écart |
|---|---|---|---|
| images | 7 767 587 | 7 396 133 | **−371 454** |
| audio | 1 203 086 | 1 203 086 | +0 |
| feuille | 48 043 | 48 043 | +0 |
| JavaScript | 437 026 | 437 026 | +0 |
| balisage | 38 429 | 38 429 | +0 |
| **TOTAL** | **9 494 171** | **9 122 717** | **−371 454** |

Les cinq postes **partitionnent** le fichier des deux côtés — chacun net de ses
`data:`, somme exacte sur le total avant comme après, **écart 0 · 0**. Et
**306 URI / 307 lignes `data:` de part et d'autre** : aucune ressource n'entre
ni ne sort, ce sont les mêmes deux images.

Sur le disque, à la grille inlinée (128) : 326 146 octets de PNG contre **47 546
de WebP**. Le calcul base64 prévoyait 371 436 octets de gain, le build en rend
**371 454** — 18 octets d'écart, le padding.

---

## 4. La borne T10 ne bouge pas

**Décision, et elle mérite d'être écrite.** Le dossier qui a préparé ce lot
annonçait un relèvement à 10 770 000. Il anticipait les lots suivants, qui font
entrer des fonds ; **ce lot-ci ne fait rien entrer du tout**.

`CLAUDE.md` §5 et le commentaire de `banc.test.js` ne connaissent qu'un sens à ce
curseur : « elle se RELÈVE quand une ressource entre légitimement ». La
descendre pour recoller à un livrable plus léger serait un resserrement que rien
ne demande, et qui coûterait le prochain lot d'art.

**Borne 9 700 000, inchangée. Marge 205 829 → 577 283 octets, 2,12 % → 5,95 %.**

Le plancher de 150 000 qu'asserte `PIC T7` est donc à **3,8 fois** sa valeur.

---

## 5. Où la frontière PNG / WebP est écrite — et pourquoi elle ne l'est pas

`tools/emblemes.py` gagne une fonction `sortie(nom, cases, dossier)` qui rend le
chemin et les options d'encodage. La règle tient en une ligne : **`cases > 1`
donne un WebP, sinon un PNG.**

Ce n'est pas un raccourci. « Multi-cases » et « hors atlas » sont **la même
chose**, et c'est `tools/atlas.py` qui le dit — « `coudre` exige `COTE × COTE` ».
Une liste de noms écrite dans `emblemes.py` aurait été une seconde vérité à côté
de celle-là, et les deux auraient divergé à la première planche ajoutée. Les
sept POI, à `cases == 1`, restent en PNG sans qu'une ligne les nomme.

Les réglages — `quality=85, method=6, exact=True` — sont ceux d'`atlas.py`, et
`SOUFFLE T2` les confronte à sa constante `QUALITE` plutôt que de les recopier.
`exact` préserve le RGB à zéro que `ecrire` pose sous le seuil d'alpha.

`tools/final128.py` : `ecrire` prend un cinquième paramètre `options`, vide par
défaut. **Tous les appelants d'avant le lot rendent exactement les mêmes
octets** — `verifier.py --outil emblemes` le mesure sur 271 fichiers : *271
identiques, 0 différents, 0 nouveaux.*

---

## 6. Deux gardes ont changé de nature — le point délicat

C'est la partie du lot qui a demandé le plus d'attention, et elle n'était pas
prévue.

`sprites_de` d'`atlas.py` ne liste que les `.png`. Les deux grosses bases
n'étant plus des PNG, elles ne sont plus **candidates** à la couture — et leur
exclusion nommée est devenue la ligne morte que la garde inverse du même fichier
punit : *« une exclusion qui ne désigne rien est une ligne morte : la retirer. »*
`FAMILLES['carte']` passe donc de `('base_o_2x2', 'base_o_3x3')` à `()`.
**L'effectif reste 133** : c'est 135 fichiers moins deux non cousables — hier
par exclusion, aujourd'hui par extension.

Conséquence : `test/sprite.test.js` n'avait plus aucune exclusion à mesurer, et
sa boucle ne s'exécutait plus. **Un test qui ne mesure rien passe au vert**, ce
que ce dépôt refuse. La garde a donc changé de nature plutôt que de disparaître :

- elle vérifiait « l'exclu existe sur le disque et n'est pas cousable » ;
- elle vérifie « **ce qui n'est plus exclu n'est plus cousable non plus** » —
  les deux noms existent en `.webp`, et **aucun `.png` ne les accompagne**.

Sans elle, un `base_o_3x3.png` de 384 × 384 remis dans `carte/128` entrerait
dans la couture et `coudre` lèverait, sans qu'aucun test ne l'ait vu venir.

Même logique pour `EMB-C T4` : il comptait 135 PNG, il compte maintenant **133
PNG + exactement deux WebP nommés**, et **asserte la somme à 135** — sans quoi
effacer un sprite l'aurait fait passer au vert.

---

## 7. Tests

**Deux tests neufs**, dans `test/embleme.test.js` — pas de fichier à eux : le lot
ne crée aucune notion, il change l'encodage d'une famille que ce fichier garde
déjà, et un `souffle.test.js` aurait coûté une ligne à la §2 de `CLAUDE.md`.

- **`SOUFFLE T1`** — les deux grosses bases entrent en WebP, et par le seul
  chemin qui existe : marqueurs présents (montage asserté d'abord), `.webp` dans
  `tools/build.js`, **aucun `.png`**, et `type: 'image/webp'` sur les deux
  lignes. Un `image/png` laissé sur un fichier WebP produirait un `data:` que le
  navigateur refuse de peindre, sans rien dire à la console.
- **`SOUFFLE T2`** — le format se dérive de l'emprise : la fonction `sortie`
  existe, la condition est bien `cases > 1`, **aucun nom de grosse base
  n'apparaît hors commentaire ailleurs que dans `PLANCHES`**, la qualité est lue
  dans `atlas.py` et non recopiée, et les **deux** `save` d'`ecrire` passent
  leurs options — n'en câbler qu'une laisserait la moitié des sprites aux
  défauts de PIL, ce qu'aucun test de nom ne verrait.

### Cinq falsifications, cinq chutes

| Falsification | Verdict |
|---|---|
| `.webp` remis en `.png` dans `tools/build.js` | **tombe** (`SOUFFLE T1`) |
| `type: 'image/png'` sur une grosse base | **tombe** (`SOUFFLE T1`) |
| format écrit par NOM au lieu de `cases > 1` | **tombe** (`SOUFFLE T2`) |
| une des deux `save` d'`ecrire` privée de ses options | **tombe** (`SOUFFLE T2`) |
| un PNG de grosse base laissé à côté de son WebP | **tombe** (`EMB-C T4`) |

Chacune a été appliquée, mesurée, puis défaite ; la suite revient à 19 pass / 0
fail sur le fichier après restauration.

### Quatre tests réancrés, aucun assoupli

| Test | Avant | Après |
|---|---|---|
| `AC T8` (`chantier.test.js`) | `{ ogg: 263, webp: 41, png: 2 }` | `{ ogg: 263, webp: 43 }` |
| `PIC T7` (`pictogramme.test.js`) | mesure 9 494 171 · marge 205 829 · 2,12 % | **9 122 717 · 577 283 · 5,95 %** |
| `EMB-C T4` (`embleme.test.js`) | 135 PNG | 133 PNG + 2 WebP, somme 135 |
| « les neuf pré-branchés » (`monde.test.js`) | lit `base_o_*.png` | lit l'extension **depuis le dossier** |
| garde d'exclusion (`sprite.test.js`) | 2 exclusions justifiées | 0 exclusion + garde de non-cousabilité |

⚠ `AC T8` mérite un mot : la clé `png` **disparaît** de la table, et son absence
est une assertion — `deepEqual` refuse une clé en trop. Le jour où un PNG
rentrerait par un marqueur oublié, ce test tombe. C'est ce qui remplace le « 2 »
qu'il gardait.

⚠ Dans `monde.test.js`, l'extension n'est **pas écrite** : le test lit le
dossier et exige qu'il n'y ait **qu'un seul format** par nom. Un `.webp` écrit en
dur aurait passé au vert le jour où un lot rebasculerait en PNG sans toucher ce
fichier.

---

## 8. Verdict

- `npm run check` : **0**.
- `npm test` : **1650 déclarés · 1649 pass · 0 fail · 1 skipped**
  (`LIMITE T8`, suspendu par Ethan le 08/09).
- `python3 tools/verifier.py --outil emblemes` : **271 identiques · 0 différents
  · 0 nouveaux · VERDICT : la chaîne répond de ses sprites**.
- `python3 tools/atlas.py --verifier` : **17 identiques · 3 différents** —
  `carte-64`, `carte-128`, `interface-128`, les trois ÉCARTs préexistants,
  laissés où le lot les a trouvés, comme au lot précédent.
- `dist/index.html` : **9 122 717 octets**, 0 référence externe.

### ⚠⚠ La chaîne COMPLÈTE sort en rouge, et ce n'est PAS ce lot — mesuré

`python3 tools/verifier.py` **sans `--outil`** rend **950 identiques · 176
différents · 0 nouveaux · 0 MANQUANTS · VERDICT : la chaîne ne répond pas de ses
sprites**, EXIT 1.

Le réflexe serait de suspecter le lot. **Il est hors de cause, et c'est
mesuré**, de deux façons indépendantes :

1. **Aucun fichier de `carte/` ne diffère.** Les 176 se répartissent en
   `bâtiment` **132**, `defense` **24**, `socle` **18**, `chassis` **2**, aux
   deux grilles. La famille `carte` — la seule que ce lot touche — est
   **identique à l'octet**, ses 271 fichiers compris.
2. **Le même rouge sort de `main` pristine.** `verifier.py --outil batiments_v2`
   lancé dans un `git worktree` sur `c8567bc`, **sans une ligne de ce lot**,
   rend **30 identiques · 132 différents** — le même compte, la même famille.

La cause la plus probable est l'**environnement d'exécution**, pas le dépôt :
ces sprites sont produits par `joueur_v2` / `ouvrage_v2` / `batiments_v2`, qui
passent par des filtres de Pillow, et ce conteneur tourne **Pillow 12.2.0 /
numpy 2.4.4** — pas nécessairement les versions de la machine où les fichiers
commités ont été fabriqués. Un rééchantillonnage qui change d'un ULP suffit à
faire diverger un PNG à l'octet sans qu'un pixel soit visiblement différent.

**Ce lot ne le corrige pas**, et ne le pouvait pas : le corriger voudrait dire
soit régénérer 176 sprites — donc faire entrer dans le dépôt des octets que
personne n'a demandés —, soit épingler une version de Pillow, ce qui est un lot
d'outillage à part entière. **C'est à arbitrer**, et c'est signalé ici plutôt
que tu par respect de §5.

⚠ À vérifier côté Ethan avant d'en faire un sujet : **la même commande sur sa
machine rend-elle vert ?** Si oui, il n'y a rien à corriger — seulement à savoir
que le vérificateur complet n'est pas concluant dans ce conteneur-ci, et que
`--outil emblemes` reste, lui, exact et vert.

**Aucun fichier de `src/` n'est touché**, vérifié au diff. Le lot est entièrement
dans `tools/`, `test/`, `art/sprites/carte/` et la documentation. `SAVE_VERSION`
ne bouge pas et reste à **38** : un format d'encodage est une propriété de la
chaîne graphique, pas de la partie.

---

## 9. Deux défauts du dépôt relevés au passage

**Le premier est corrigé ici.** La §0 de `CLAUDE.md`, écrite au lot
RUINES-DÉFENSE, annonçait « `SAVE_VERSION` **EST À 37** » quand
`src/sim/state.js:84` porte **38** depuis le lot MODE-DEV — et quand le bloc
« Auparavant » du même fichier, deux cents lignes plus bas, écrivait déjà 38. Le
document se contredisait lui-même. Corrigé dans le bloc d'historique, qui garde
par ailleurs ce que son lot a mesuré.

**Le second ne l'est pas, et c'est délibéré.** `SPEC-FOYER-ZERO.md` §10 annonce
une carte « **30 × 300** » (ligne 312) et une base terminale « **à 25 cases du
bord haut** » (ligne 315), quand `GEOGRAPHIE` dit **31 × 300** et **14 cases** —
rangée 15. Les deux lignes sont fausses depuis le 31/08. C'est la spec qui ment,
pas le code.

Ce lot ne touche ni à la géographie ni à la spec. Les corriger ici aurait été un
changement sans rapport dans un lot d'art ; les taire aurait été contraire à §5.
**C'est au prochain lot qui touche à la géographie** — le lot VERROUS du dossier
`DOSSIER-BASE-FINALE-ET-VERROUS.md`, qui le porte déjà en §0.

---

## 10. Ce que ce lot débloque

Les 371 454 octets rendus ne sont pas une fin : ils sont ce qui rend le reste du
dossier possible. La marge dépensable était de **55 829 octets** — la marge
totale moins le plancher de `PIC T7` —, soit un vingtième d'un seul fond long.
Elle est maintenant de **427 283**.

Les lots suivants du dossier — VERROUS, AVARIES, GRILLE LONGUE — n'attendent plus
que le feu vert. Le lot GRILLE LONGUE, qui fait entrer trois fonds de
1080 × 3240, relèvera la borne T10 : **c'est lui qui fait entrer une ressource,
donc c'est lui qui écrit pourquoi.**
