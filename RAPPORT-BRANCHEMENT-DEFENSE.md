# RAPPORT — lot BRANCHEMENT-DÉFENSE : la garnison prend ses sprites

Toutes les grandeurs sont **mesurées par exécution**, aucune n'est recopiée du
brief.

---

## 1. Ce qui a été produit

| Grandeur | Valeur |
|---|---|
| Version | **0.44.0 · build 45** — `version` et `config.build` restés des **chaînes** |
| `npm run check` | **582 pass / 0 fail** (578 avant, **+4**) |
| `dist/index.html` | **859 646 octets**, delta depuis 608 040 : **+251 606** |
| Borne T10 | relevée **700 000 → 900 000**, avec sa raison écrite |
| Marge réelle | **40 354 octets, soit 4,5 %** |
| `atlas.py --verifier` | `4 identiques, 0 différent, 0 nouveau` |
| `planches.py --verifier` | `88 identiques, 2 différents, 0 nouveau` — les deux ÉCART voulus |

Les cinq chiffres de référence du brief ont tous été retrouvés avant de
commencer : `main` à `e0d1ca8`, 578 pass, 608 040 octets, 0.43.0 · build 44,
et les deux outils idempotents.

⚠ **LA TAILLE RÉELLE DÉPASSE L'ESTIMATION DU BRIEF DE 8 241 OCTETS** — 859 646
mesurés contre ≈851 405 annoncés. L'écart vient de l'approximation de base64 que
`tools/atlas.py` affiche (`len × 4 // 3`, une troncature). La borne à 900 000
tient quand même, mais la marge est plus mince que prévu : **4,5 % et non 5,4 %**.

---

## 2. ⚠⚠ LE DÉFAUT DE BOUSSOLE — corrigé d'abord, comme le brief l'exige

### Ce qui a été mesuré, avant de toucher au code

Les trois montages du brief se sont reproduits **à l'identique** :

| montage | rendu par `orientationVers` | où est la cible à l'écran |
|---|---|---|
| garnison rangée 5 → assaillant rangée 2 | `n` | ligne 17 contre 14 → **plus BAS** |
| garnison rangée 5 → déploiement rangée 1 | `n` | ligne 18 contre 14 → **plus BAS** |
| armée rangée 2 → bâtiment rangée 15 | `s` | ligne 4 contre 17 → **plus HAUT** |

La boussole pointait à l'opposé de l'écran **dans les trois cas**.

### Ce qui a changé

1. **`orientationVers` : `atan2(dc, -dr)` → `atan2(dc, dr)`.** Vérifié après coup
   sur le code DÉCOMMENTÉ : une occurrence du nouveau, **zéro** de l'ancien —
   la seule mention restante du `-dr` est dans le commentaire qui explique le
   correctif.
2. **`ORIENTATION_PAR_DEFAUT` n'a pas bougé d'un caractère.** C'est lui qui avait
   raison, et c'est asserté.
3. **Les deux commentaires de nord sont réécrits.** Celui d'`orientationDeLAngle`
   disait « 0 vise le haut de la grille » — le mot est ambigu, et
   `render/orientation.js` explique en tête pourquoi il ne s'emploie pas dans ce
   dépôt. Il dit maintenant « la rangée 18, le fond de la base, la première ligne
   d'écran ».

### Les tests qui ont bougé

| Test | Ce qui a changé | Assertions |
|---|---|---|
| `la rangée croît vers le bas, donc le nord est la rangée décroissante` | **retourné**, titre et raison réécrits, renvoi au lot dans son commentaire | 5 → **6** |
| *(nouveau)* `la boussole s'accorde à l'écran` | le test croisé qui manquait | **+13** |

Le test retourné passe de 5 à 6 assertions : l'est et l'ouest sont **conservés
tels quels** — le correctif ne touche que l'écart de rangée — et une assertion de
plus dit que le retournement n'a pas débordé sur l'axe des colonnes.

C'est le cas que CLAUDE.md §5 autorise explicitement, « retourner un garde-fou en
écrivant pourquoi », et **le compte ne baisse pas**.

### ⚠ AUCUN TEST DE COMBAT N'A ÉTÉ TOUCHÉ, ET C'EST MESURÉ

Le brief demandait de vérifier le résolveur de combat et le banc d'essai.
Mesuré par `grep` sur `src/` et `test/` : **rien hors de
`test/rendu-pose.test.js` n'appelait `orientationVers`, `orientationDeLaPiece` ni
`orientationDeLAngle`.** Le module était un utilitaire de rendu qui attendait son
premier appelant — et c'est `ui/chantier.js`, dans ce lot, qui le devient.

Un seul test est tombé au correctif : celui que le brief demande de retourner.

### La falsification

Le signe d'origine remis, **deux** tests tombent : le retourné et le croisé. Le
test croisé aurait donc attrapé le défaut **à lui seul**, ce qui est exactement
ce qu'on lui demande.

⚠ **CE QUI A LAISSÉ PASSER LA CONTRADICTION, C'EST L'ABSENCE DE CE TEST-LÀ.**
`rendu-pose.js` et `render/orientation.js` étaient chacun juste, chacun gardé, et
rien ne les confrontait. **Deux modules justes séparément peuvent être faux
ensemble.** Le nouveau test ne connaît aucune valeur d'orientation : il compare
un SENS à une ligne d'écran, et resterait vrai si les seize noms changeaient.

---

## 3. L'arbitrage du §2 — vérifié, rien à changer

Confirmé **par exécution**, pas par lecture :

```
campChaine('joueur')  = true
campChaine('ouvrage') = false
SE_LIE_AU_MUR = batterie, casemate, creneau, faucheuse, harpon, merlon, mortier
ronce  portée 1 → dans SE_LIE_AU_MUR ? false
herse  portée 1 → dans SE_LIE_AU_MUR ? false
```

« Seules les tourelles et mur joueur auront des liaisons » : le code l'appliquait
déjà. **Aucune ligne n'a été changée sur ce point.**

### Le trou d'art des trois artilleries

Mesuré sur `art/sprites/socle/64/` :

| | type | portée | socle de base | `_est` `_ouest` `_isole` `_traversant` |
|---|---|---|---|---|
| casemate · créneau · batterie | `tourelle` | 2,5 | oui | **oui** |
| faucheuse · mortier · harpon | `artillerie` | 5,5 | oui | **non** |

C'est une absence de **source** : `tools/connexions.py` coupe
`socles_j_tourelles_connexions_3x4.png`, un 3 × 4 — trois tourelles, quatre
états. **Rien n'a été produit pour les trois artilleries**, comme le brief le
demande ; Ethan tranchera s'il dessine la planche.

**Le rendu s'y adapte en LISANT l'atlas.** `existeDansAtlas('socle',
'socle_def_j_faucheuse_est')` rend `false`, et le socle retombe sur
`socle_def_j_faucheuse`. Mesuré sur les neuf pièces — voir §5.

Le jour où la planche arrive, les trois artilleries prennent leurs liaisons
**sans qu'une ligne de code change**, et le test du §5.4 rougit pour prévenir.

### Le poids mort Ouvrage — LAISSÉ EN PLACE

Les neuf `socle_def_o_*_{est,ouest,traversant}` et les trois
`def_o_merlon_{est,ouest,traversant}` — **trente-six fichiers sur trois grilles**
— ne sont jamais lus, côté Ouvrage seul `isole` l'étant. **Ils n'ont pas été
retirés**, conformément au brief : un retrait est un lot de production, pas un
lot d'écran, et il changerait les effectifs assertés par `tools/atlas.py` au
milieu d'un branchement.

---

## 4. Les fichiers

### 4.1 `tools/atlas.py` — deux lignes

```python
'defense': ('defense', 204),
'socle': ('socle', 36),
```

Effectifs **relevés sur le disque** avant écriture : 204 et 36. Rien d'autre
touché dans l'outil.

```
bâtiment           34 sprites  6×6     43117 o  (57489 o en base64)
terrain            18 sprites  5×4     10549 o  (14065 o en base64)
defense           204 sprites  15×14  127148 o  (169530 o en base64)
socle              36 sprites  6×6     55376 o  (73834 o en base64)
atlas identiques : 4 · différents : 0 · nouveaux : 0
```

### 4.2 `src/render/sprite.js` — `existeDansAtlas`

Elle **ne lève pas** : c'est une question, pas un accès. Une famille inconnue
rend `false`. `celluleDuSprite` et `fondDuSprite` gardent leur comportement —
vérifié : un nom absent **lève toujours**.

### 4.3 `src/ui/chantier.js` — le crochet passe à plusieurs couches

`spriteDe` rend désormais **une liste de couches**, `{ famille, nom }`, de la
plus haute à la plus basse — **même pour une seule couche**. Rendre tantôt un
nom, tantôt une liste obligerait l'appelant à connaître la différence, ce qui est
le cas particulier qu'on refuse.

`couchesDeLaDefense` décide **par `DEFENSES[id].type`**, jamais par
l'identifiant : une dixième défense héritera de sa famille sans qu'on y touche.

L'orientation vient d'`orientationDeLaPiece('garnison', piece, null)` — **jamais
d'un `'s'` écrit en dur**. `liaisonDuMur` et `liaisonDuSocle` reçoivent
`etat.garnison`, la garnison ENTIÈRE, et laissent le camp à `'joueur'`.

⚠ **LES TROIS LISTES CSS SONT COMPTÉES.** `poserCouches` lève si elles
divergent : une liste plus courte **se répète en silence**, et le socle prendrait
le cadrage de la tourelle sans que rien ne le dise.

### 4.4 Les marqueurs de build — l'ordre vérifié avant d'ajouter

Les cinq marqueurs confrontés deux à deux : **aucun marqueur complet n'est
préfixe d'un autre.**

⚠ **PRÉCISION SUR LE BRIEF.** Il dit que `%ATLAS_TERRAIN_BASE%` est « préfixé
par » `%ATLAS_TERRAIN%` : ce n'est vrai **que si l'on retire le `%` final**.
Les chaînes complètes diffèrent au quatorzième caractère — `%` contre `_` — et
c'est précisément ce `%` terminal qui rend `replaceAll` sûr. Mesuré, et le
commentaire de `build.js` le dit.

### 4.5 Les trois commentaires menteurs

1. **`src/ui/chantier.js`**, le bloc au-dessus de `spriteDe: null` — il disait
   « rien dans l'état ne dit l'orientation d'une pièce posée » et « une règle de
   chaînage qui n'existe pas davantage ». **Parti avec le `null`.**
2. **`src/index.src.html`**, au-dessus de `.jeton.sprite` — il disait la même
   chose ET invoquait `TERRAINS[x].familleAtlas`. **Vérifié : zéro occurrence de
   ce crochet dans tout le dépôt.** Le champ s'appelle `spriteDe`. Ce commentaire
   avait été écrit au lot PREMIÈRE-COUCHE — c'est-à-dire par moi. Réécrit pour
   dire ce qui est réellement fait.
3. **`src/sim/rendu-pose.js`**, les deux commentaires de nord — §2.

⚠ Un quatrième a été trouvé et corrigé, hors brief : la garde de
`chantier.test.js` affirmait que « la bande de défense dépend ENTIÈREMENT de
`SIGLES_DEFENSE`, ses seize orientations n'étant pas branchables ». Elle l'est
depuis ce lot ; l'exigence reste, la raison a changé.

---

## 5. Les tests du §4 — verdict et montage

| # | Test | Verdict | Montage effectif | Falsification → rouge |
|---|---|---|---|---|
| 1 | La boussole s'accorde à l'écran | **PASS** | 4 montages, `ligneEcranDeLaRangee` des deux pièces, comparaison de SENS ; assertion préalable que les deux lignes diffèrent | signe d'origine remis → **2 rouges** |
| 2 | Tests d'orientation retournés | **PASS** | 5 → 6 assertions, est/ouest conservés | idem |
| 3 | L'index décrit le disque, les 4 familles | **PASS** | table famille→dossier **rendue générale** : le dossier EST le slug, seule l'exception accentuée s'écrit | un sprite ajouté à l'index → rouge |
| 4 | Socles à liaison = exactement `type: 'tourelle'` | **PASS** | balayage de `DEFENSES` × `existeDansAtlas` ; **les deux groupes assertés non vides d'abord** | socle forcé à la liaison → **1 rouge** |
| 5 | Chaque pièce de garnison résout ses couches | **PASS** | les 9 `DEFENSES` posées sur cases **cherchées** (la bande porte des obstacles) ; liste non vide assertée d'abord ; compte de couches **calculé**, pas écrit | `couchesDeLaDefense` rend `[]` → **2 rouges** |
| 6 | Les 4 états de liaison atteignables | **PASS** | **préexistant** — `un mur seul est isolé, avec un voisin il pointe du bon côté`, 4 valeurs distinctes | — |
| 7 | Le camp Ouvrage ne chaîne pas | **PASS** | **préexistant** — asserte `traversant` en camp joueur AVANT d'exiger `isole` en Ouvrage | — |
| 8 | Ronce et herse : une couche, sans orientation | **PASS** | 1 couche exactement, nom sans suffixe ; **témoin** : une tourelle du même montage en porte 2 | orientation ajoutée aux barrières → **2 rouges** |
| 9 | `chantier.test.js` tient | **PASS** | garde mise à jour, `spriteDe: null` désormais **interdit** par `doesNotMatch` | ordre des couches inversé → **1 rouge** |

**Les tests 6 et 7 existaient déjà** et satisfont la falsifiabilité demandée ;
ils n'ont pas été dupliqués.

### L'audit des assertions

| Fichier | avant | après | |
|---|---:|---:|---|
| `rendu-pose.test.js` | 50 | **57** | +7 |
| `chantier.test.js` | 609 | **612** | +3 |
| `sprite.test.js` | 48 | **66** | +18 |
| `banc.test.js` | 74 | 74 | = |

**Net : +28.** Sept lignes d'assertion disparaissent du diff, et **chacune est
remplacée par une équivalente ou une plus forte** :

| Retirée | Remplacée par |
|---|---|
| borne T10 à `700_000` | la même à `900_000`, raison écrite |
| `spriteDe: spriteDuBatiment` | l'assertion de la liste de couches |
| `spriteDe: null` | un `doesNotMatch` qui l'**interdit** désormais — plus fort |
| 3 × `orientationVers(...)` | les mêmes retournées, plus une de contrôle |
| `dossier !== undefined` | `existsSync(...)` — vérifie le **disque**, pas une clé de table |

**Aucune assertion n'a été supprimée sans remplacement, ni assouplie.**

---

## 6. Les vérifications appareil — toutes NON EXÉCUTÉES

Il n'y a pas d'appareil dans cette session, et un test appareil non exécuté se
déclare non exécuté (CLAUDE.md §3).

| Vérification | État |
|---|---|
| Les tourelles pointent vers le **bas** de l'écran, vers le déploiement | **NON EXÉCUTÉE** |
| Le socle se voit **sous** la tourelle, pas par-dessus | **NON EXÉCUTÉE** |
| Un merlon voisin d'une tourelle montre son raccord, un merlon seul non | **NON EXÉCUTÉE** |
| Le bavement entre cellules — `defense` est la grille la plus dense (15 × 14) | **NON EXÉCUTÉE** |

⚠ **DEUX D'ENTRE ELLES SONT PARTIELLEMENT COUVERTES PAR UN TEST**, ce qui ne les
remplace pas mais réduit le risque :

- le sens des tourelles est ce que le test croisé du §2 mesure — mais il mesure
  la BOUSSOLE, pas le dessin du sprite `_s` lui-même ;
- l'ordre socle-sous-tourelle est asserté par le test 8 (`couches[1].famille ===
  'socle'`) et falsifié — mais c'est l'ordre de la LISTE, pas ce que le
  navigateur compose.

**Une tourelle qui pointe vers le fond de la base serait le symptôme du défaut du
§2 mal corrigé.** C'est le premier point à regarder.

---

## 7. Écarts par rapport au brief

1. **La taille estimée était basse de 8 241 octets** — 859 646 mesurés contre
   ≈851 405. Cause : l'affichage base64 de `tools/atlas.py` est une troncature
   entière. La borne à 900 000 tient, avec 4,5 % de marge au lieu de 5,4 %.
2. **Le brief dit `%ATLAS_TERRAIN%` préfixe de `%ATLAS_TERRAIN_BASE%`** : faux
   pour les chaînes complètes, vrai seulement sans le `%` final. Mesuré, §4.4.
3. **Les tests 6 et 7 du §4 existaient déjà** et n'ont pas été réécrits.
4. **Un quatrième commentaire menteur** a été corrigé, dans
   `test/chantier.test.js` — §4.5.

---

## 8. Points laissés en suspens

1. ⚠⚠ **LA MARGE DE T10 EST À 4,5 %, SOIT 40 354 OCTETS.** Les trois familles
   encore non cousues — `unite`, `tourelle-unite`, `carte` — pèsent bien au-delà.
   **Le prochain lot qui en fait entrer une devra relever la borne en écrivant
   pourquoi**, jamais rogner un atlas (CLAUDE.md §5).
2. **La piste du découpage par CAMP est mesurée mais NON TRANCHÉE** : elle
   épargnerait 80 068 octets à ce lot. C'est un second axe dans l'index pour un
   écran de raid qui n'existe pas encore — **arbitrage d'Ethan**, pas une
   optimisation à prendre seul.
3. **La planche des socles de liaison des trois artilleries** — à dessiner ou
   non. Le code est prêt ; le test du §5.4 rougira pour prévenir.
4. **Le poids mort Ouvrage** — 36 fichiers jamais lus, laissés en place
   délibérément. Un lot de production, pas un lot d'écran.
5. **Le camp reste `'joueur'` en dur dans `couchesDeLaDefense`.** L'écran
   Chantier montre la base du joueur ; le camp deviendra un paramètre à l'écran
   de raid, et `liaisonDuMur`/`liaisonDuSocle` le prennent déjà.
6. **Les six vérifications appareil en attente** depuis trois lots : le bavement,
   le sens des tourelles, l'ordre des couches, le raccord des merlons, et — plus
   ancien — le sens de `qg_de_defense` / `centre_de_commandement`.
