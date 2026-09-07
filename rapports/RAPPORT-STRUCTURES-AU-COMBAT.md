# RAPPORT — lot STRUCTURES-AU-COMBAT

Une défense se dessine pareil partout. Écrit le 30/08/2026.

---

## 1. Ce qui a été produit

| | |
|---|---|
| version | **0.46.0** |
| `config.build` | **"47"** |
| `dist/index.html` | **1 074 070 octets**, mesuré |
| SHA-256 | `3313cf90f8d435fbdeda6644146d2b3c9fa1c1d66c4a2f80a1ba63b5640da69a` |
| référence avant le lot | 1 073 238 octets, `d9044d8a…` |
| **delta** | **+832 octets** |
| borne T10 | **1 150 000, INCHANGÉE** — marge réelle **75 930 octets**, 6,6 % |
| `npm run check` | **600 pass / 0 fail** |
| références externes | 0 |

⚠ **Les deux champs de `package.json` sont restés des CHAÎNES**, éditées
textuellement par `sed` et non par un sérialiseur JSON : `"0.46.0"` et `"47"`.
Vérifié après coup — `typeof` rend `string` pour les deux. C'est la faute du
28/08 qui faisait tomber le job Android à la CONFIGURATION, et aucun test JS ne
la voit.

⚠ **La borne n'a pas bougé, et c'est le fait du lot.** Aucun atlas n'entre,
aucun sprite n'est ajouté : les +832 octets sont du CODE, et c'est du code
DÉPLACÉ, pas ajouté. Le brief prévoyait « quelques milliers d'octets » ; mesuré,
c'est 832.

---

## 2. Le problème, et le geste

Une casemate se dessinait de **trois** façons : en sprites sur l'écran Chantier,
en primitives géométriques dans l'éditeur Défense, en primitives au combat. Un
bâtiment de l'Ouvrage se dessinait en carré plein, indiscernable de celui du
joueur. Aucun test ne pouvait le voir — chacun des trois chemins était juste
séparément.

Le geste est un **déplacement**, pas une addition :

| avant | après |
|---|---|
| `couchesDeLaDefense` dans `src/ui/chantier.js` | montée dans `src/render/scene.js` |
| `spriteDuBatiment` dans `src/ui/chantier.js`, `bat_j_` **en dur** | montée en `couchesDuBatiment`, propriétaire lu |
| `couchesDeLUnite` exportée de `scene.js` | interne |
| — | `couchesDeLEntite(d, contexte)`, **LE** point d'entrée des trois genres |

Les cinq appelants y passent : `listeAffichage`, `listeArsenal`, `listeDefense`,
`listeLegende` (qui n'y passe que pour s'en voir refuser l'accès) et
`src/ui/chantier.js`, **pour ses DEUX bandes**.

⚠ **Écart au brief, assumé et plus strict : la bande des BÂTIMENTS de l'écran y
passe aussi.** Le brief ne le demandait pas nommément ; le laisser de côté aurait
gardé `spriteDuBatiment` avec son `bat_j_` en dur à côté de `couchesDuBatiment`
qui lit le propriétaire — c'est-à-dire exactement la seconde vérité que le §2 du
brief existe pour interdire, et la première à diverger.

---

## 3. ⚠⚠ Un défaut TROUVÉ par la falsification : le chaînage était mort au combat

C'est le fait le plus important de ce lot, et il n'était pas au brief.

La liste des voisines que `listeAffichage` compose portait **`e.rangee`**. Ce
champ **n'existe pas** sur une entité de combat : le moteur range `rangeeMilli`.
Chaque comparaison de rangée de `liaisonDuMur` échouait donc contre `undefined`,
tout rendait `isole`, et **deux merlons côte à côte se rejoignaient sur l'écran
Chantier sans se rejoindre au combat**.

Mesuré, avant correctif, sur un combat où le joueur défend :

```
avant [ 'def_j_merlon_isole', 'def_j_merlon_isole' ]     ← faux
après [ 'def_j_merlon_est',   'def_j_merlon_ouest'  ]     ← correctif
```

⚠ **LE PREMIER MONTAGE DU TEST NE POUVAIT PAS LE VOIR.** Il appelait
`couchesDeLEntite` avec une liste de voisines **écrite à la main** : retirer
`visible(e)` du filtre de `listeAffichage` le laissait **VERT**. C'est la faute
que `CLAUDE.md` nomme déjà — « un montage écrit à la main ne garde que
lui-même » — vue pour la deuxième fois en trois lots. Le test passe maintenant
par `listeAffichage`.

⚠ **Il faut un combat où le JOUEUR défend, sans quoi rien n'est observable** :
l'Ouvrage ne chaîne pas (arbitré le 30/08), et un site de l'Ouvrage est le seul
défenseur que le jeu produise aujourd'hui. `montage.proprietaireDefense` existe
depuis le lot 3A — c'est ce qui permet de mesurer dès maintenant un chemin que le
raid empruntera plus tard.

⚠ **Et ce montage ne peut porter AUCUN bâtiment** : `creerCombat` ne connaît que
les cinq de l'Ouvrage, et en poser un sous un propriétaire joueur demande
`bat_j_gangue`, qui n'existe pas — le rendu **lève**, ce qui est le bon
comportement (« une unité invisible est un défaut qu'on doit voir »). C'est le
trou que le raid sur la base du joueur comblera.

### Un second piège, évité avant d'écrire une ligne

`couchesDeLaDefense` rendait ses couches **de la plus HAUTE à la plus basse** —
l'ordre d'une liste `background-image` CSS, dont la première ligne se dessine
au-dessus — et `couchesDeLUnite` **de la plus BASSE à la plus haute**, l'ordre du
canvas. Unifier sans y prendre garde aurait posé le socle **par-dessus** la
tourelle, avec les mêmes deux noms, donc **sans faire tomber un seul test**.

L'inversion se fait maintenant une fois, dans `poserCouches` de
`src/ui/chantier.js`, et deux assertions d'indice de `sprite.test.js` la
tiennent. Falsifiée : inverser le `return` de `couchesDeLaDefense` fait tomber
trois tests.

---

## 4. Les sprites dormants : 110 sur 125, comptés

125 sprites de l'Ouvrage étaient **dans le fichier livré** et n'étaient nommés
par aucune ligne de `src/` : 102 `def_o_*`, 18 `socle_def_o_*`, 5 `bat_o_*`.

**110 sont désormais atteints**, et le test le compte plutôt que de le déclarer :
il compose 238 noms distincts — 9 défenses × 2 propriétaires × 4 liaisons × 16
orientations, plus 16 bâtiments — et asserte le total et la part d'Ouvrage.

**Les quinze qui restent dormants se nomment**, dans une liste assertée :

| combien | lesquels | pourquoi |
|---|---|---|
| 3 | `def_o_merlon_{est,ouest,traversant}` | l'Ouvrage ne chaîne pas — arbitré le 30/08 |
| 9 | `socle_def_o_{batterie,casemate,creneau}_{est,ouest,traversant}` | idem |
| 3 | `socle_def_o_{batterie,casemate,creneau}` (nus) | idem : seul `isole` est lu, et sa variante existe |
| 3 | `socle_def_j_{batterie,casemate,creneau}` (nus) | **conséquence mesurable** : les quatre variantes raccordées couvrent les quatre liaisons, `isole` compris, donc le repli d'`existeDansAtlas` ne mord jamais |

Les trois derniers sont une découverte du lot : ce ne sont pas des sprites
manquants, ce sont des replis que la planche complète rend inutiles.

---

## 5. Les tests

**593 avant, 600 après.** Sept ajoutés, tous dans `test/sprite.test.js`, aucun
fichier créé ni retiré — `CLAUDE.md` §2 et `documentation.test.js` restent
d'accord avec le disque.

⚠ **Écart au brief, dit :** le brief parlait de « T8 étendue ». La T8 d'origine
vit dans `arsenal.test.js`, qui est le fichier de l'éditeur d'assaut ; l'extension
croise `src/ui/chantier.js` et `src/render/scene.js`, donc elle vit dans
`sprite.test.js`, avec les autres gardes de résolution de sprite. Le nom du test
dit qu'elle étend T8.

| # | test | verdict | montage effectif |
|---|---|---|---|
| 1 | T8 étendue — structure identique écran Chantier / combat | **PASS** | 9 défenses de `garnisonComplete()` + 11 bâtiments ; `TERRAINS.defense.spriteDe` et `TERRAINS.batiments.spriteDe` confrontés à `couchesDeLEntite` à propriétaire et contexte égaux. Falsifiabilité en deux moitiés : liste non vide, **et** un propriétaire différent donne des noms différents |
| 2 | les trois genres rendent des couches, `null` réservé à la légende | **PASS** | 14 unités × 2 camps × 2 propriétaires + 9 défenses × 2 + 16 bâtiments = **90 descripteurs**, compte asserté ; témoin : un genre inconnu rend toujours `null` |
| 3 | tout nom composable est dans un atlas cousu | **PASS** | 238 noms distincts, dont **110 d'Ouvrage** ; les 4 liaisons se CONSTRUISENT par voisinage et les 16 orientations par une cible posée — aucun suffixe n'est écrit à la main |
| 4 | le chaînage suit les vivantes | **PASS** | **par `listeAffichage`**, combat `proprietaireDefense: 'joueur'`, deux merlons adjacents ; assertion préalable qu'ils se lient, puis mise à mort et retour à `isole` |
| 5 | l'Ouvrage ne chaîne pas | **PASS** | mêmes voisines, deux propriétaires ; témoin joueur d'abord — mur non isolé et socle à amorce |
| 6 | le renommage `proprietaire` est complet | **PASS** | balaye les 45 fichiers de `src/` **décommentés**, plus les signatures des deux fonctions de liaison |
| 7 | la tourelle vise sa cible | **PASS** | deux cibles à deux azimuts → `_n` et `_s` ; plus le témoin sans cible, qui doit égaler `ORIENTATION_PAR_DEFAUT.garnison` |

### Falsification — dix injections, dix tests qui tombent

| injection | tombe |
|---|---|
| l'écran redérive le nom d'un bâtiment | T8 étendue |
| `couchesDeLEntite` rend `null` pour une défense | 9 tests |
| la lettre du propriétaire écrite en dur (`'j'`) | T8 étendue, balayage d'atlas |
| le chaînage lit les entités **mortes** | chaînage |
| la voisine reprend `e.rangee` (**le défaut réel**) | chaînage |
| l'Ouvrage se met à chaîner | balayage, Ouvrage |
| la tourelle ignore sa cible | balayage, tourelle |
| `campChaine` revient | 10 tests |
| l'ordre des couches s'inverse (socle par-dessus) | 3 tests |

⚠ **Deux gardes ont dû être resserrées après être passées, ou tombées, à tort :**

1. Le balayage de `campChaine` **tombait sur `rendu-pose.js`**, dont le
   commentaire RACONTE le renommage. C'est la **quatrième** fois que le dépôt
   commet cette faute — après `viewport-fit=cover`, `MENTION_SATURE` et
   `etat.rng`. Il lit maintenant la source décommentée, et **un appât prouve que
   le motif reconnaît encore la vraie faute**.
2. La garde du chaînage, décrite au §3.

### Audit des assertions : dix modifiées, aucune perdue en silence

| fichier | avant | après | retirées | ce qui les remplace |
|---|---|---|---|---|
| `test/sprite.test.js` | 97 | **139** | 4 | voir ci-dessous |
| `test/rendu.test.js` | 124 | **128** | 3 | voir ci-dessous |
| `test/chantier.test.js` | 612 | **615** | 3 | voir ci-dessous |
| `test/rendu-pose.test.js` | 57 | **57** | 0 | renommages seuls |

- `chantier.test.js` — `spriteDe: couchesDeLaDefense`, `spriteDe: (piece) => [{ famille: 'batiment'`
  et `function spriteDuBatiment(id)` exigeaient des formes que cet écran PORTAIT.
  Remplacées par **six** assertions plus strictes : le point d'entrée unique est
  importé, appelé exactement deux fois, et l'écran ne redérive **ni** le nom
  d'une défense **ni** celui d'un bâtiment (`doesNotMatch` sur `couchesDeLaDefense`
  et sur `bat_j_`). L'exigence s'est resserrée, pas assouplie.
- `rendu.test.js` T5 — `attendu === 44` et `liste.length === 44` deviennent 35 :
  les structures émettent leurs couches. **Ce test avait raison de tomber, il
  mesure exactement ce que le lot change** ; le nombre se LIT dans
  `NB_PRIMITIVES`, il n'est pas recopié. La sonde `iBatiment` cherchait un `rect`
  en `metalMoyen`, qu'un bâtiment n'émet plus : elle cherche maintenant la
  FAMILLE d'atlas, et l'ordre asserté passe de deux comparaisons à **cinq**
  (bâtiments < structures < unités < barres, plus trois témoins de présence).
- `sprite.test.js` — l'index du socle passe de `[1]` à `[0]` (inversion d'ordre,
  §3), assertion **doublée** : socle en `[0]` ET défense en `[1]`. Les deux
  `assert.equal(…, null)` sur la défense et le bâtiment sont **retournées** : ce
  qu'elles interdisaient est devenu obligatoire, et un témoin de `null` sur un
  genre inconnu les remplace.

`NB_PRIMITIVES` a changé de valeurs — mur 2→1, barrière 3→1, tourelle 4→2,
artillerie 5→2, bâtiment 2→1 — et son en-tête dit désormais qu'elle décrit **le
champ et les éditeurs, pas la légende**, qui garde ses anciens comptes.

---

## 6. Le code du §7 : rien n'est mort, mesuré

Le brief prévoyait que `dessinerStructure`, `dessinerBatiment`,
`dessinerEscouade`, `dessinerBlinde` et `dessinerAeronef` pourraient perdre leur
appelant. **Les cinq restent joignables**, par `dessinerVignette` et par elle
seule : `ENTREES_LEGENDE` liste 19 couples classe × accent, sans identifiant,
donc sans sprite possible.

Mesuré : `listeLegende` émet **120 primitives et zéro sprite**. `corpsDe` garde
ses trois appelants.

**Aucun retrait n'a donc eu lieu, et il n'y avait pas lieu d'en faire.** Le
nettoyage annoncé comme possible n'est pas reporté à un lot suivant : il n'a
simplement pas de matière.

---

## 7. Vérifications appareil — **NON EXÉCUTÉES**

Le dépôt n'a ni jsdom ni navigateur (`CLAUDE.md` §3). Elles s'accumulent depuis
cinq lots ; les voici en bloc.

Ce lot :

1. un bâtiment du joueur et un de l'Ouvrage **se distinguent** au combat ;
2. une casemate a le **même dessin** sur l'écran Chantier, dans l'éditeur Défense
   et au combat ;
3. un merlon voisin d'une tourelle morte **perd son raccord** pendant le combat —
   ⚠ observable seulement dans un combat où le joueur défend, que le jeu ne
   produit pas encore ; à revoir au lot du raid ;
4. le socle est **sous** la tourelle, et non l'inverse, aux deux endroits.

En attente des lots précédents, reprises telles quelles :

5. les unités du champ portent leur sprite, à la bonne pose et à la bonne
   orientation ;
6. la tourelle d'un blindé du joueur se pose sur l'ancre de sa coque ;
7. les seize orientations de tourelle se lisent à l'œil pendant une approche ;
8. l'accent d'une unité — sa colonne de dégâts dominante — reste lisible sans la
   légende (voir §8) ;
9. la carte, les atlas de terrain et le pavage sur un vrai téléphone ;
10. le temps de rendu d'une dalle sur l'appareil (`CLAUDE.md` : jamais mesuré).

---

## 8. Points laissés en suspens

- **L'accent d'une unité ne se voit plus sur l'unité**, depuis le lot
  UNITÉS-AU-COMBAT. Toujours non tranché : soit il revient en couche mince
  par-dessus le sprite, soit le joueur lit le type à la silhouette. Ce lot n'y
  touche pas ; les structures perdent le leur de la même façon.
- **Le chaînage d'un mur du joueur n'est pas observable en jeu**, faute d'un
  combat où le joueur défend. Le code est correct et testé ; la vérification
  appareil n° 3 attendra le raid sur la base du joueur.
- **`creerCombat` ne connaît que les cinq bâtiments de l'Ouvrage.** Un combat où
  le joueur défend ne peut donc porter aucun bâtiment sans lever. C'est un trou
  du moteur, pas du rendu.
- **Deux familles de sprites restent non cousues** : `carte` (trois arbitrages en
  attente) et `effet` (le moteur ne publie pas d'événement de mort).
- **Les 18 sprites de bâtiment détruit et les deux ruines ne sont nommés par
  aucune ligne de `src/`** — `bat_*_detruit`, `ruine_j`, `ruine_o`. Rien dans le
  rendu ne lit un état de destruction de bâtiment. Hors périmètre de ce lot,
  signalé pour ne pas le redécouvrir.
