# RAPPORT — lot EMBLÈME-CENTRÉ

Retour d'Ethan du 06/09, point **1** : « le sprite a dû être fabriqué bizarrement
peut-être ? Regarde, il est collé au sud. »

C'est le seul lot de cette série qui touche à l'art.

---

## 0. Ce qui a été produit

| | valeur |
|---|---|
| version · build | **0.99.12 · build 113** (les deux restent des chaînes JSON) |
| `npm test` avant | **1 241 pass / 0 fail** |
| `npm test` après | **1 245 pass / 0 fail** |
| `dist/index.html` avant | **8 003 079 octets** |
| `dist/index.html` après | **8 003 811 octets** |
| delta | **+732 octets** |
| borne T10 | inchangée à 9 300 000 — marge **1 296 189 octets, 13,94 %** |

**Le coût est ENTIÈREMENT EN IMAGES**, mesuré poste par poste contre un livrable
rebâti dans un `git worktree` depuis le commit précédent (`d41f821`, lot
FICHE-JUSTE) :

```
images   6 306 190 → 6 306 922  +732
js         356 871 →   356 871    +0
feuille  3 187 921 → 3 187 921    +0
audio    1 193 346 → 1 193 346    +0
balisage         inchangé          +0
somme des cinq postes : +732   ← tombe EXACTEMENT sur le total
lignes `data:` : 296 avant, 296 après   ·   URI : 291 de part et d'autre
```

⚠ **LE COMPTE DE `data:` NE BOUGE PAS**, ce que le brief pose comme condition
d'arrêt : aucun sprite n'est apparu ni n'a disparu. Les 732 octets sont le
base64 d'`atlas-carte-128.webp`, **409 686 → 410 234 octets** (+548), qui est la
grille EMBARQUÉE — `GRILLE_ATLAS = 128` dans `tools/build.js`.

⚠ **ET L'ATLAS GROSSIT ALORS QU'ON NE FAIT QUE DÉPLACER DES PIXELS.** Le WebP
q85 prédit un peu moins bien une planche dont les cellules ne partagent plus leur
ligne de base. `atlas-carte-64.webp` grossit aussi — 155 418 → 156 372 — et **ne
coûte rien**, la 64 n'étant pas embarquée. Mouvement inverse du lot
ARMÉE-ET-FRONTIÈRE, qui avait RENDU 11 608 octets en désaturant.

**Fichiers touchés :** `tools/emblemes.py`, `tools/final128.py`, **208 PNG** de
`art/sprites/carte/` (104 par grille), les deux atlas de carte,
`art/sprites/atlas-empreintes.json`, `test/embleme.test.js`, `package.json`,
`CLAUDE.md`, plus ce rapport.

---

## 1. `tools/verifier.py` — AVANT et APRÈS

**AVANT toute modification :**

```
identiques à l'octet : 858
différents           : 0
nouveaux             : 0
MANQUANTS            : 0
durée                : 516,9 s
VERDICT : la chaîne répond de ses sprites

art/sources/ : consommées 393 / déclarées 393 · dormantes 123 / déclarées 123
VERDICT : la chaîne lit exactement les sources déclarées
```

**APRÈS**, l'art régénéré et les atlas recousus :

```
identiques à l'octet : 858
différents           : 0
nouveaux             : 0
MANQUANTS            : 0
durée                : 509,9 s
VERDICT : la chaîne répond de ses sprites

art/sources/ : consommées 393 / déclarées 393 · dormantes 123 / déclarées 123
art/sourcesstandby/ : 34 fichiers, 0 lu par la chaîne
art/reserve/        : 10 fichiers, 0 lu par la chaîne
VERDICT : la chaîne lit exactement les sources déclarées
```

⚠⚠ **LES QUATRE NOMBRES SONT IDENTIQUES DES DEUX CÔTÉS, ET C'EST CE QU'ON LEUR
DEMANDE.** Le compte ne bouge pas — aucun sprite n'entre ni ne sort — et les
**858 sont TOUS dans les « identiques à l'octet »**, les 208 PNG régénérés
compris : la chaîne reproduit exactement ce que le dépôt porte, ce qui est la
seule chose qui dise que l'art commité vient bien de l'outil commité.

⚠ **ET `python3 tools/atlas.py --verifier` LE CONFIRME DE SON CÔTÉ** :
**18 atlas identiques · 0 différent · 0 nouveau**, `src/data/atlas.js` identique,
`atlas-empreintes.json` identique. Relancé APRÈS la ronde de falsifications,
pour que l'arbre final soit celui qui a été mesuré.

---

## 2. Le défaut, mesuré — et il l'était sur 216 sprites, pas trois

Le relevé du brief est reproduit à l'identique sur `art/sprites/carte/128/`,
à alpha ≥ 128, la convention de mesure du dépôt :

| sprite | marge haut | marge bas | écart au centre |
|---|---|---|---|
| `site_base_j_n1` | 76 px | **5 px** | **+35,5 px** au sud |
| `site_base_j_n7` | 45 px | **5 px** | **+20,0 px** au sud |
| `site_base_j_n9` | 25 px | **5 px** | **+10,0 px** au sud |

**La marge basse vaut 5 px à tous les paliers** : tout reposait sur le fond de la
cellule.

⚠⚠ **ET LE BALAYAGE COMPLET DIT COMBIEN C'ÉTAIT GÉNÉRAL.** Sur les **216
emblèmes** — 4 familles × 3 états × 9 paliers × 2 grilles —, écart entre marge
haute et marge basse de l'encre :

| | avant | après |
|---|---|---|
| écart > 1 px | **201 / 216** | **0 / 216** |
| pire écart vertical | **+74 px** (`site_scorie_n1`, grille 128 — 58 % de la case) | **+1 px** |
| écart nul | 7 | **154** |
| écart d'un pixel | 8 | 62 |
| écart horizontal > 1 px | 0 | 0 |

Les trois paliers du relevé, après :

| sprite | alpha ≥ 128 | seuil de l'encre |
|---|---|---|
| `site_base_j_n1` | 40 / 40 | **40 / 40** |
| `site_base_j_n7` | 27 / 23 | **23 / 22** |
| `site_base_j_n9` | 19 / 11 | **11 / 10** |

---

## 3. ⚠⚠ LE SEUIL DE MESURE A DÛ CHANGER, ET C'EST LA TROUVAILLE DU LOT

À alpha ≥ 128, `site_base_j_n9` rend **19 / 11** après recentrage — la propriété
que le brief demande d'asserter (« la marge haute doit ÉGALER la marge basse »)
paraît donc violée de 8 px sur une chaîne juste.

**Cherché plutôt que supposé.** Sondé le pipeline étape par étape sur cette
cellule :

- les deux masques de fond s'accordent sur la source — `est_fond` et
  `est_fond_sujet` rendent la MÊME boîte, `y[0..371]`, centre 185,5 ;
- le recadré est symétrique : **37 px en haut, 35 en bas** sur une boîte de 444,
  soit 10,7 / 10,1 ramenés à 128 ;
- après `eroder(m, 3)` : 40 / 38, toujours symétrique.

**Le sprite est donc centré.** Ce qui manque à 128, ce sont les rangées 11 à 18,
qui portent **deux pixels chacune à alpha 86 à 95** : un **mât de deux pixels de
large**, que la réduction LANCZOS par 3,47 rend translucide sans l'effacer.

⚠⚠ **CE MÂT EST DESSINÉ.** `ecrire` de `tools/final128.py` coupe l'alpha sous
`SEUIL_ALPHA`, qui vaut 8 : tout ce qui survit à cette coupe atteint l'écran.
**128 est une convention de mesure, pas une propriété du produit**, et c'est elle
qui était fausse ici — pas le sprite. `EMB-C T1` mesure donc l'encre au seuil de
la chaîne, **lu dans `tools/final128.py`** plutôt que retapé : un 8 écrit dans le
test aurait été la seconde vérité que §4 de `CLAUDE.md` interdit.

**Écart au brief, déclaré** : la propriété est bien « marge haute = marge basse à
un pixel près », mais elle se mesure sur l'ENCRE, et le brief ne le disait pas.

---

## 4. Ce qui a changé, et ce qui n'a pas changé

### L'appel — une ligne

`tools/emblemes.py` passe `ancrage='centre'` au lieu de `'bas'`. **C'était le
seul appel du dépôt à passer `'bas'`**, vérifié par `grep` sur tout `tools/` : il
n'en reste aucun.

### `cote_ref` est INTACT

Les deux paramètres de `recadrer` sont indépendants — `cote_ref` décide de
l'ÉCHELLE, `ancrage` de la POSITION —, et le corps les lit séparément.
`EMB-C T2` attrape un lot qui aurait retiré l'un avec l'autre ; `EMB-C T5` exige
que l'appel porte encore les deux.

### `recadrer` et le mode `'bas'` ne sont PAS touchés

La primitive garde ses trois branches et sa levée sur un ancrage inconnu.
**Elle n'a plus aucun appelant**, et c'est exactement pourquoi `EMB-C T5` existe.

### ⚠⚠ QUATRE SPRITES SUR 108 NE CHANGENT PAS D'UN OCTET, ET CE SONT LES BONS

Ce sont exactement **`site_base_j_n9_feu`, `site_base_o_n9_feu`,
`site_quartz_n9_feu` et `site_scorie_n9_feu`** — la **cellule de référence de
chaque famille**, celle dont `max(largeur, hauteur)` définit `reference`. Son
encre remplit la référence, donc `box//2 + reference//2 − ys.max()` vaut
`box//2 − cy` : la ligne de sol et le centre coïncident pour elle, et pour elle
seule.

C'est la preuve **à l'octet** que le lot n'a touché QUE l'ancrage. L'ancien
commentaire de `recadrer` l'annonçait — « la ligne de sol est celle que le
centrage donnait au plus grand contenu » — et les quatre fichiers le confirment.

### Les deux grosses bases : elles passent par un AUTRE chemin

`base_o_2x2` et `base_o_3x3` sortent par la **seconde** boucle de
`tools/emblemes.py`, celle qui balaie `PLANCHES`. Elle appelle
`recadrer(cell, EMPRISE * cases * (N // 32), cote)` — **sans `cote_ref`, sans
`ancrage`**, donc `'centre'` par défaut depuis toujours.

Mesuré AVANT le lot, marges haut / bas sur la grille 128 : **11 / 11** pour
`base_o_2x2`, **31 / 31** pour `base_o_3x3` — écart nul. Les sept POI sont dans
le même cas. **Aucun des neuf ne change d'un octet**, ce que `git status`
confirme : 104 fichiers modifiés par grille sur 117.

---

## 5. Les deux commentaires réécrits, cités

**`tools/final128.py`**, en-tête de `recadrer` — le paragraphe qui défendait
`'bas'` reste, et il apprend sa borne :

> ⚠⚠ ET IL NE VAUT PAS POUR UNE VUE ZÉNITHALE — ETHAN, 06/09 : « le sprite a dû
> être fabriqué bizarrement peut-être ? Regarde, il est collé au sud. » Le
> paragraphe ci-dessus disait « sous une carte » ; c'était le contresens. Une
> carte se regarde de DESSUS : il n'y a pas de sol à toucher, et « reposer sur le
> sol » y devient « décalé vers le sud » — mesuré, jusqu'à 35,5 px sur une
> cellule de 128, soit 28 % d'une case au palier le plus bas.
> **`tools/emblemes.py` est passé à `'centre'` ; ce mode-ci RESTE**, il est juste
> pour ce qu'il servira de côté, et le retirer casserait ce qui l'emploierait un
> jour. `EMB-C T5` le tient, et il n'a plus aucun appelant.

plus, à la fin du même en-tête :

> ⚠⚠ ET LES DEUX PARAMÈTRES SONT INDÉPENDANTS, CE QUI EST TOUT CE QUI A PERMIS DE
> N'EN CHANGER QU'UN. `cote_ref` décide de l'ÉCHELLE, `ancrage` de la POSITION,
> et ce corps les lit séparément : passer à `'centre'` ne touche pas au rapport
> de taille des paliers, qui est l'acquis d'EMBLÈMES-ABÎMÉS.

**`tools/emblemes.py`**, au point d'appel :

> ⚠⚠ `ancrage='centre'`, ET C'EST UN RENVERSEMENT DU LOT EMBLÈMES-ABÎMÉS — Ethan,
> 06/09 […]. Cet appel-ci passait `'bas'`, et c'était le SEUL du dépôt.
>
> ⚠⚠ LE MOTIF QU'ON ÉCARTE ÉTAIT JUSTE POUR UN BÂTIMENT VU DE CÔTÉ, ET FAUX POUR
> UNE VUE ZÉNITHALE. […] Mesuré sur la grille 128, marge haute / marge basse de
> l'encre : `site_base_j_n1` 76 / 5, `n7` 45 / 5, `n9` 25 / 5 — **la marge basse
> valait 5 px à TOUS les paliers**, et l'écart au centre de la cellule montait à
> 35,5 px, soit 28 % d'une case.
>
> ⚠⚠ ET `cote_ref` RESTE, INTACT : C'EST L'AUTRE MOITIÉ, ET ELLE N'A RIEN À VOIR
> AVEC L'ANCRAGE. […] Un lot qui la retirerait avec l'ancrage ferait tomber
> `EMB-C T2`.

---

## 6. Les tests — PASS/KO et montage effectivement écrit

**Cinq tests entrent, un est RETOURNÉ, et le compte passe de 1 241 à 1 245.**
`test/embleme.test.js` passe de 13 à 17.

| Code | verdict | montage écrit |
|---|---|---|
| **EMB-C T1** | PASS | Balaie les **108** emblèmes de la grille 128 et exige `\|marge haute − marge basse\| ≤ 1` sur chacun, **au seuil de l'encre lu dans l'outil**. Asserte que le pire écart vaut EXACTEMENT 1 — un zéro dirait qu'on ne mesure plus des entiers — et **falsifie l'ancienne propriété de face** : les lignes de sol ne coïncident PLUS. ⚠ Ce test RETOURNE `EMB T6`, qui exigeait l'inverse. |
| **EMB-C T2** | PASS | Par famille : hauteur d'encre du palier 9 **strictement supérieure** à celle du palier 1, et rapport `h1/h9 < 0,7` — mesuré entre 0,45 et 0,55. Un `>` seul passerait sur un accident d'arrondi. |
| **EMB-C T3** | PASS | Non-régression : `\|marge gauche − marge droite\| ≤ 1` sur les 108. `recadrer` pose `box//2 − cx` quel que soit l'ancrage, qui ne décide que de la verticale. |
| **EMB-C T4** | PASS | **117 PNG par grille** (108 emblèmes + 7 POI + 2 grosses bases), `ATLAS.carte.noms.length === 115`, les 108 y sont, **et les deux grosses bases n'y sont pas** — elles font 2 × 2 et 3 × 3 cases, que `coudre` refuse. |
| **EMB-C T5** | PASS | Source de `tools/final128.py` : la signature, la branche `'bas'` avec sa formule exacte, la branche `'centre'`, et la levée sur un ancrage inconnu. Plus, sur `tools/emblemes.py` **décommenté** : `ancrage='…'` n'apparaît qu'une fois et vaut `'centre'`, et `cote_ref` est toujours au même appel. |

⚠⚠ **ET `EMB T5` A CHANGÉ DE MESURE SANS QUE SON SEUIL BOUGE — C'EST UN
RESSERREMENT, PAS UN ASSOUPLISSEMENT.** Il exige qu'un palier fasse la même
largeur dans les trois états, à 4 px près. Il tombait après le lot :
`site_base_j_n7` rendait 89, 86, **84**, écart 5. Mesuré au seuil de l'encre, les
neuf paliers rendent **EXACTEMENT les mêmes largeurs avant et après** — la seule
cellule qui bouge à 128 est `site_base_j_n7_feu`, 86 → 84, parce que le décalage
vertical change la PHASE de la réduction LANCZOS et fait tomber deux colonnes de
bord sous 128. **Le 4 n'a pas été relevé** ; c'est la mesure qui a cessé de
compter des pixels que l'écran dessine.

⚠ **`matiere()` GARDE SON DÉFAUT À 128**, et gagne un paramètre. `EMB T3`, `T4`
et `T7` continuent de mesurer à la convention du dépôt ; seuls `EMB T5` et les
quatre `EMB-C` mesurent l'encre. Changer le défaut aurait déplacé la garde des
trous sans qu'on le décide.

### Sept falsifications, sept chutes

| | falsification | ce qui tombe |
|---|---|---|
| **F1** | `ancrage='bas'` remis dans `tools/emblemes.py`, art régénéré | `EMB-C T1`, `EMB-C T5` |
| **F2** | `cote_ref` retiré de l'appel, art régénéré | `EMB T3`, `EMB T4`, `EMB T5`, `EMB T10`, `EMB-C T2`, `EMB-C T5` |
| **F3** | le mode `'bas'` retiré de `recadrer` | `EMB-C T5` seul |
| **F4** | le centrage HORIZONTAL décalé de 10 px, art régénéré | `EMB T5`, `EMB-C T3` |
| **F5** | la levée sur un ancrage inconnu retirée de `recadrer` | `EMB-C T5` seul |
| **F6** | `EMB-C T1` mesuré à la convention des 128 au lieu de l'encre | `EMB-C T1` seul |
| **F7** | un sprite retiré de `carte/128` | sept tests, dont `EMB-C T1`, `T3` et `T4` |

⚠⚠ **F1 EST LA FALSIFICATION QUI COMPTE, ET ELLE MORD SUR DEUX TESTS
DIFFÉRENTS** : `EMB-C T1` voit le décalage dans les PIXELS produits, `EMB-C T5`
le voit dans la SOURCE de l'outil. Un lot qui reviendrait à `'bas'` sans
régénérer l'art ne ferait tomber que le second — et c'est précisément le trou
que le §0 de `CLAUDE.md` raconte pour le 30/08, où six PNG d'emblème
contredisaient l'outil qui les fabrique pendant que `npm run check` était vert.

⚠⚠ **ET F6 EST CELLE QUI JUSTIFIE LE §3.** Mesurer `EMB-C T1` à 128 le fait
tomber sur une chaîne parfaitement juste — c'est la mesure qui serait fausse.
Sans cette falsification, le choix du seuil serait une opinion.

⚠ **F2 FAIT TOMBER SIX TESTS, ET C'EST LA MESURE DE CE QUE `cote_ref` TIENT.**
Quatre gardes du lot EMBLÈMES-ABÎMÉS s'écroulent avec lui : le lot ne pouvait pas
retirer l'échelle par mégarde sans que la suite le dise.

---

## 7. Ce qui n'a pas bougé, vérifié plutôt que cru

- **`src/render/embleme.js`** : aucune ligne. `dessinerEmblemeDUneCase` rend déjà
  `cote: taille` et pose l'emblème sur la case entière — il était juste, c'est
  son contenu qui était décalé.
- **`src/ui/monde.js`** : aucune ligne.
- **`src/data/atlas.js`** : **identique**, `tools/atlas.py --ecrire` le dit
  lui-même. Les noms n'ont pas changé, seuls les pixels.
- **`art/sources-declarees.json`** : **identique** —
  `python3 tools/entrees.py --declarer` rend **393 consommées · 123 dormantes ·
  516 fichiers dans `art/sources/`**. Aucune source n'entre ni ne sort : le lot
  repeint ce que la chaîne produit déjà.
- **`art/sprites/carte/emblemes-mesures.json`** : identique. La référence
  d'échelle, les côtés de planche et les coupes ne dépendent pas de l'ancrage.
- **Les autres familles de sprites** — unités, bâtiments, défenses, limites,
  sols, sons : aucune ne passe par cet appel, et le vérificateur le confirme.
- **`SAVE_VERSION` reste à 27.** Un emblème est un dessin.

---

## 8. Écarts et points en suspens

1. ⚠ **LE LOT N'EST PAS SUR SA PROPRE BRANCHE, ET LE BRIEF LE DEMANDAIT.**
   « À exécuter seul sur sa branche. » L'environnement d'exécution épingle la
   session à `claude/foyer-zer0-patch-5lqyq8` et interdit d'en pousser une
   autre ; les quatre lots de la série sont donc **quatre commits distincts** sur
   cette branche-là, dans l'ordre SATELLITES-RESPAWN, CARTE-C, FICHE-JUSTE,
   EMBLÈME-CENTRÉ. Celui-ci est le dernier et le seul à toucher `art/` : il se
   révoque par un `git revert` d'un seul commit. **Écart déclaré, non contourné.**
2. ⚠ **LE SEUIL DE MESURE**, §3. Le brief demandait d'asserter l'égalité des
   marges sans dire à quel seuil d'alpha ; à 128 la propriété est fausse sur une
   chaîne juste. `EMB-C T1` mesure l'encre. **À relire si Ethan tenait à la
   convention des 128** — ce serait alors le mât de `site_base_j_n9` qu'il
   faudrait épaissir dans la source, pas la chaîne qu'il faudrait changer.
3. ⚠ **LE RENDU N'A PAS ÉTÉ VU SUR APPAREIL, ET SE DÉCLARE NON EXÉCUTÉ.** §3 de
   `CLAUDE.md` : il n'y a pas d'appareil ici. Ce qui est mesuré l'est sur les PNG
   produits et sur le livrable ; le halo carré qu'Ethan cite comme repère est
   dessiné par `src/ui/monde.js`, que le lot ne touche pas.
