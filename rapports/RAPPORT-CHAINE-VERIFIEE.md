# RAPPORT — lot CHAÎNE-VÉRIFIÉE

Un outil doit répondre de ses sprites. Écrit le 30/08/2026.

---

## 1. Ce qui a été produit, et pourquoi rien n'a été bumpé

| | |
|---|---|
| `dist/index.html` SHA-256 **avant** | `3313cf90f8d435fbdeda6644146d2b3c9fa1c1d66c4a2f80a1ba63b5640da69a` |
| `dist/index.html` SHA-256 **après** | `3313cf90f8d435fbdeda6644146d2b3c9fa1c1d66c4a2f80a1ba63b5640da69a` |
| taille | **1 074 070 octets**, inchangée |
| version · build | **0.46.0 · "47" — NON BUMPÉS** |
| `npm run check` | **600 pass / 0 fail**, avant comme après |

⚠ **LE BUMP AURAIT ÉTÉ UNE FAUTE.** `src/` et `test/` ne sont pas touchés, et les
six PNG régénérés vivent dans `art/sprites/carte/`, que `tools/build.js`
n'inline pas : il n'inline de ce dossier que `carte/atlas-terrain-64.png`, qui
n'a pas bougé. Le HTML ressort donc identique à l'octet, SHA-256 compris — donc
son manifeste de Pages aussi, et bumper aurait poussé une mise à jour aux
appareils pour rien (CLAUDE.md §5). **Comparé, pas supposé.**

**Référence de départ, relevée sur `main` à `778f619`** — conforme au brief au
chiffre près : 600 pass / 0 fail · 1 074 070 octets · 0.46.0 · build 47 ·
`planches.py --verifier` → 88 / 2 / 0 · `atlas.py --verifier` → 7 identiques,
0 différent, 0 nouveau.

---

## 2. Le défaut live, confirmé puis réparé

Mesuré sur `main` **avant** toute modification :

```
art/sprites/carte/128/base_o_2x2.png (128, 128)
art/sprites/carte/128/base_o_3x3.png (128, 128)
art/sprites/carte/32/base_o_2x2.png  (32, 32)
art/sprites/carte/32/base_o_3x3.png  (32, 32)
art/sprites/carte/64/base_o_2x2.png  (64, 64)
art/sprites/carte/64/base_o_3x3.png  (64, 64)
```

Les six étaient à la taille d'une case, alors que `tools/emblemes.py`, corrigé et
commité le 30/08, exige 2× et 3×. **`npm run check` était vert.**

### `python3 tools/emblemes.py` — sortie exacte

```
135 fichiers écrits
```

**Six fichiers modifiés sur 135 écrits, donc 129 identiques à l'octet** — le
compte du brief, retrouvé. Mesuré par `git status`, pas déduit.

### Les dimensions produites, mesurées

| fichier | produit | attendu | |
|---|---|---|---|
| `carte/128/base_o_2x2.png` | 256 × 256 | 256 × 256 | ok |
| `carte/128/base_o_3x3.png` | 384 × 384 | 384 × 384 | ok |
| `carte/64/base_o_2x2.png` | 128 × 128 | 128 × 128 | ok |
| `carte/64/base_o_3x3.png` | 192 × 192 | 192 × 192 | ok |
| `carte/32/base_o_2x2.png` | 64 × 64 | 64 × 64 | ok |
| `carte/32/base_o_3x3.png` | 96 × 96 | 96 × 96 | ok |

**6 / 6 conformes.** Les six PNG se commitent ; ils ne sont consommés par rien —
la famille `carte` n'est pas cousue —, donc aucun test ne bouge et `dist` non
plus, ce que le §1 mesure.

---

## 3. Ce qui a été construit

### `tools/chemins.py` — la destination se déroute, la source jamais

Onze producteurs portaient chacun leur ligne
`DST = os.path.join(RACINE, 'art', 'sprites', …)`. Ils demandent maintenant ce
dossier à `dossier_sprites(*sous)`, qui honore `FZ_SPRITES`. **Douze lignes
remplacées** — `chassis.py` en portait deux.

⚠ **`chassis.py` ÉCRIT AUSSI `art/sprites/ancres-chassis.json`, ET LE BRIEF NE LE
DIT PAS.** Sans rediriger cette seconde ligne, le vérificateur aurait écrasé le
JSON commité à chaque exécution — c'est-à-dire violé son invariant central
pendant qu'il prétendait le tenir. Trouvé en relisant les outils, pas en les
lançant.

⚠ **UNE VARIABLE VIDE EST TRAITÉE COMME ABSENTE.** `FZ_SPRITES=` en tête de
commande écrirait sinon à la racine du système de fichiers.

**Les onze `SRC` sont intacts** — vérifié par `grep`, onze sur onze —, et aucun
`SRC` ne passe par `dossier_sprites`. Rediriger les deux ferait tourner le
vérificateur sur un dossier vide, et il rendrait « tout va bien » sur rien.

### `tools/verifier.py`

Dossier temporaire, `FZ_SPRITES` pointé dessus, les onze producteurs rejoués en
sous-processus **dans l'ordre de la chaîne** — repris de
`rapports/RAPPORT-PRODUCTION-SPRITES.md` §2, qui l'a relevé en le jouant —, arrêt
immédiat si l'un sort en erreur, puis comparaison à l'octet.

**Quatre catégories**, et la légende s'imprime, parce que le mot peut tromper :

```
identiques : le dépôt et la chaîne s'accordent à l'octet
différents : les deux l'ont, ils ne sont pas les mêmes
nouveaux   : la chaîne le produit, le dépôt ne l'a pas
MANQUANTS  : le dépôt le porte, aucun outil ne le produit
```

⚠ **`PYTHONDONTWRITEBYTECODE=1` est posé sur les sous-processus.** Sans lui,
l'import de `cond` et de `chemins` sème un `tools/__pycache__` qui salit
`git status` à chaque exécution.

---

## 4. Le verdict — la sortie exacte et complète

```
### planches.py --ecrire  (19.5 s)
identiques à l'octet : 0
différents           : 0
nouveaux             : 90
### tourelles.py --ecrire  (31.2 s)
600 fichiers écrits
### tourelles_unite.py --ecrire  (13.9 s)
240 fichiers écrits
### socles.py   (2.9 s)
36 fichiers écrits
### connexions.py   (3.6 s)
72 fichiers écrits
### emblemes.py   (14.0 s)
135 fichiers écrits
### unites_ouvrage.py   (10.3 s)
66 fichiers écrits
### barrieres.py   (1.1 s)
12 fichiers écrits
### effets.py   (6.6 s)
36 fichiers écrits
### chassis.py   (8.2 s)
30 fichiers écrits, 10 ancres dont 9 mesurées
### ruines.py   (12.6 s)
54 fichiers écrits

identiques à l'octet : 1370
différents           : 2
nouveaux             : 0
MANQUANTS            : 56
durée                : 124.3 s
  écart déclaré  unite/32/off_j_belier.png — même cas que le Ratisseur
  écart déclaré  unite/32/off_j_ratisseur.png — la source 1024 ne redescend pas
                 à 32 sans retouche à la main (passation du 30/08, §3.2.6)
  MANQUANT  carte/atlas-terrain-64.png
  MANQUANT  carte/controle-pavage.png
  MANQUANT  terrain/128/…  (18 fichiers)
  MANQUANT  terrain/32/…   (18 fichiers)
  MANQUANT  terrain/64/…   (18 fichiers)

VERDICT : la chaîne ne répond pas de ses sprites
```

**Code de sortie : 1. Durée : 124,3 s** — deux minutes, dont la moitié pour
`planches.py` et `tourelles.py` à eux deux. C'est trop long pour être lancé à
chaque lot ; c'est pourquoi `CLAUDE.md` §0 l'inscrit **aux lots qui touchent à
l'art seulement**.

### ⚠⚠ La réponse à la question que personne n'avait posée

**Les dix outils sans mode de vérification reproduisent bien leurs sprites, à
l'octet.** 1 370 identiques, 0 nouveau, et les onze comptes de fichiers écrits
retombent exactement sur ceux de `RAPPORT-PRODUCTION-SPRITES.md` — 600, 240, 36,
72, 135, 66, 12, 36, 30, 54. **C'est un résultat, pas une non-nouvelle** : avant
ce lot, rien au dépôt ne permettait de l'affirmer.

Le premier verdict, pris **avant** de régénérer les emblèmes, donnait 1 364
identiques et **8 différents** : les 6 emblèmes plus les 2 écarts déclarés. La
régénération a fait passer les six du côté des identiques, et rien d'autre n'a
bougé.

---

## 5. Les 56 MANQUANTS — décrits, NON corrigés

Aucun n'a été touché. Ce sont des arbitrages d'Ethan, pas des décisions de lot.

### 5.1 — 54 tuiles de terrain

`terrain/{128,64,32}/` : 18 fichiers par grille — quatre sols joueur, quatre sols
Ouvrage, deux champs de quartz, deux de scorie, six obstacles.

**Cause mesurée, pas supposée.** La branche terrain de `planches.py` est une
**migration à usage unique, déjà consommée** : elle lit des PNG à plat dans
`DST/terrain/`, et seulement si `DST/terrain/128` n'existe pas encore ; elle les
copie dans les trois grilles, puis **supprime les originaux à plat**. Dans un
dossier vide il n'y a rien à lire, donc rien à produire.

Autrement dit : **la source du terrain, ce sont les fichiers commités
eux-mêmes.** Les originaux ont été consommés par la migration et n'existent plus.

**Ce qu'il faudrait décider :** soit remettre les 18 planches d'origine dans
`art/sources/` et écrire l'outil qui les coupe, soit déclarer le terrain comme
une source et non un produit — auquel cas il sort du périmètre du vérificateur et
sa ligne entre dans une table, avec sa raison. **Je n'ai tranché ni l'un ni
l'autre.**

### 5.2 — 2 fichiers de `carte/`

| fichier | ce que c'est |
|---|---|
| `carte/atlas-terrain-64.png` | l'atlas du fond de carte du monde, 224 548 octets, **livré fini** au lot ÉCRAN-CARTE. `tools/build.js` l'inline ; aucun outil du dépôt ne le produit. |
| `carte/controle-pavage.png` | l'image de contrôle du pavage, produite par le §7 de ce même lot et citée par son rapport. |

Ce sont des **sources déposées dans un dossier de produits**. Même arbitrage que
ci-dessus, en plus petit : les déplacer dans `art/sources/`, ou les déclarer.

### 5.3 — les sept atlas cousus : traités, pas manquants

Le premier verdict les comptait manquants — `atlas-batiment-64.png` et les six
autres. C'est le §2.1 du brief qui donne la réponse : `atlas.py` reste à part, et
le vérificateur **l'appelle** en `--verifier`. **Je l'avais omis au premier jet**,
et le verdict le disait. Les sept sortent maintenant des deux côtés de la
comparaison à la fois, et leur contrôle est délégué.

⚠ **La liste des atlas se CALCULE** (`atlas-*` à la racine des sprites), elle ne
s'écrit pas : un huitième atlas cousu demain entrerait tout seul.

⚠ **`atlas.py --verifier` a DEUX façons de mal finir, et elles ne se disent pas
pareil.** Un effectif qui ne colle plus le fait sortir en **1** avec « ATLAS EN
ÉCHEC » ; un atlas simplement périmé le fait sortir en **0** en le disant dans sa
ligne de résumé. Le vérificateur lit le code **et** la ligne, et **exige d'avoir
trouvé la ligne** — sans quoi un reformatage de sa sortie rendrait ce contrôle-ci
muet pour toujours, ce qui est la panne silencieuse que tout ce lot combat.

---

## 6. Les démonstrations du §7 — sortie réelle

### 4. Le vérificateur n'écrit pas dans `art/sprites/` — **le contrôle le plus important**

```
empreinte AVANT : 659897dbc4d7f0e5068a84466d5516a2801abdafc7d748377ae38d22fb4fe892
nombre de fichiers AVANT : 1435
code : 1
empreinte APRÈS : 659897dbc4d7f0e5068a84466d5516a2801abdafc7d748377ae38d22fb4fe892
nombre de fichiers APRÈS : 1435
dossiers temporaires laissés : 0
```

Empreinte de l'arbre entier — `sha256sum` de tous les fichiers, puis `sha256sum`
du résultat — **identique à l'octet sur 1 435 fichiers**, après une exécution
complète. Rejouée une seconde fois en fin de lot, même empreinte.

### 1. Il détecte une différence

Un seul pixel altéré : `(0,0,0,0) → (255,0,255,255)` sur
`defense/64/def_j_merlon_isole.png`.

```
différents           : 1
  DIFFÈRE   defense/64/def_j_merlon_isole.png
VERDICT : la chaîne ne répond pas de ses sprites
code : 1
```
Restauré : 0 modification.

### 3. Il détecte un fichier qu'aucun outil ne produit

`def_j_intrus_isole.png` déposé dans `defense/64/` :

```
MANQUANTS            : 57
  MANQUANT  defense/64/def_j_intrus_isole.png
code : 1
```
56 → 57, et il est nommé. Retiré : 0 modification.

### 2. Il détecte un sprite commité retiré

```
nouveaux             : 1
  NOUVEAU   defense/64/def_j_merlon_isole.png
code : 1
```
Restauré : 0 modification.

⚠⚠ **ÉCART AU BRIEF, ET C'EST LE BRIEF QUI SE CONTREDIT.** Son §7.2 demande que
retirer un sprite commité soit signalé comme **MANQUANT**, et son §7.3 qu'ajouter
un fichier le soit aussi. Or son propre §2.2.5 définit MANQUANTS comme « les
fichiers commités qu'aucun outil ne produit **plus** » — le dépôt l'a, la chaîne
non. **Sous cette définition, les deux démonstrations sont interverties** :
retirer un fichier que la chaîne produit toujours donne un NOUVEAU, et ajouter un
orphelin donne un MANQUANT. J'ai suivi la **définition**, qui est la bonne — un
« manquant » qui désignerait un fichier absent du dépôt serait le contraire de ce
que le §2.2.5 veut attraper, à savoir les 240 tourelles restées après le lot
PRODUCTION. **Les deux chemins sont démontrés**, seuls leurs noms changent.

### 5. Un écart déclaré qui se reproduit fait tomber le vérificateur

Appât : `defense/64/def_j_merlon_isole.png` ajouté à `ECARTS_PERMANENTS`, alors
qu'il se reproduit très bien.

```
  ⚠ ÉCART DÉCLARÉ QUI SE REPRODUIT MAINTENANT : defense/64/def_j_merlon_isole.png
    il n'est plus un écart — retirer sa ligne d'ECARTS_PERMANENTS
VERDICT : la chaîne ne répond pas de ses sprites
code : 1
```

Et dans le run normal, les **deux écarts réels sont assertés encore violés** : ils
apparaissent en `écart déclaré`, donc dans `différents`. Une table d'exceptions
sans assertion inverse pourrit en silence — c'est la mécanique de `DETTES_ACCENT`.

### 6 (hors brief). Un outil qui lève arrête la course

Appât : `raise SystemExit` ajouté à `socles.py`.

```
### socles.py   (3.0 s)

⚠ socles.py sort en 1 — la course s'arrête ici.
36 fichiers écrits
APPÂT — socles.py refuse de tourner
code : 2
```

Code **2**, distinct du **1** d'un écart : un outil cassé n'est pas un dépôt
divergent, et les confondre ferait accuser les fichiers d'un défaut qui est dans
l'outil.

---

## 7. Un défaut de conception trouvé par la falsification

⚠⚠ **LE CONTRÔLE DES ATLAS PASSAIT AVANT LA COMPARAISON, ET IL LA MASQUAIT.**
Découvert en jouant la démonstration 2 : retirer un sprite commité fait échouer
`atlas.py` — son effectif ne colle plus, `defense/64` porte 203 sprites pour 204
attendus — et le vérificateur s'arrêtait là, **sans jamais rendre le verdict
qu'on lui demandait**. Première sortie observée :

```
### atlas.py --verifier

⚠ atlas.py --verifier : sortie illisible — le contrôle des atlas ne peut pas être rendu.
```

Le message était faux, en plus d'être prématuré : `atlas.py` n'avait pas produit
une sortie illisible, il avait **échoué et dit pourquoi**. Deux corrections : le
contrôle des atlas passe **après** la comparaison, et sa sortie réelle est
relayée au lieu d'être résumée de travers. **Un contrôle secondaire qui masque le
verdict principal est pire qu'un contrôle absent.**

---

## 8. Écarts par rapport au brief

1. **`atlas.py --verifier` n'était pas câblé au premier jet.** Le §2.1 le
   demandait ; le premier verdict comptait donc les sept atlas en MANQUANTS.
   Corrigé, et le §5.3 dit comment.
2. **`chassis.py` porte une seconde écriture dans `art/sprites/`** —
   `ancres-chassis.json` — que le brief ne mentionne pas. Redirigée aussi ; sans
   ça le vérificateur écrasait un fichier commité.
3. **Les §7.2 et §7.3 sont interverties** par rapport au §2.2.5 du même brief.
   Détaillé au §6. J'ai suivi la définition.
4. **`--outil` ne rend aucun MANQUANT, et le dit.** Un seul outil ne produit pas
   toute une famille — `emblemes.py` peuple `carte/` sans y produire l'atlas du
   monde ni l'image de contrôle. Les compter ferait crier l'option qui sert à
   itérer ; les cacher laisserait croire qu'elle vaut la chaîne entière. Le
   verdict imprime `(MANQUANTS non calculable pour un seul outil)`.
5. **Une septième démonstration a été ajoutée** — l'arrêt sur outil en erreur,
   que le §9 pose en question de relecture sans en demander la preuve.
6. **Le brief annonce que la ligne `tools/` de §2 « en annonce 9 ».** Elle en
   annonçait **17**, et le disque en portait **19**. Recomptée à **21** après ce
   lot, fichier par fichier.

---

## 9. Relecture hostile — les sept questions du §9

| question | réponse |
|---|---|
| le vérificateur a-t-il écrit dans `art/sprites/` ? | **non** — empreinte identique sur 1 435 fichiers, deux fois |
| `SRC` est-il resté non redirigé ? | **oui, onze sur onze** ; zéro `SRC = dossier_sprites` |
| un outil qui lève arrête-t-il la course ? | **oui**, code 2, démontré au §6 |
| MANQUANTS est-il réellement calculé ? | **oui** — 56 en régime, 57 avec un intrus déposé |
| chaque écart permanent est-il asserté encore violé ? | **oui**, et l'appât le prouve |
| `dist` comparé par SHA-256 ? | **oui**, identique → aucun bump |
| la ligne `tools/` a-t-elle été recomptée ? | **oui** — 21 sur le disque, 21 écrits |

⚠ **Un incident de manipulation, dit plutôt que taire : `git checkout tools/socles.py`,
lancé pour retirer l'appât de la démonstration 6, a emporté la redirection du même
fichier.** Détecté immédiatement — `socles.py` avait disparu de `git status` —,
remis, et les onze producteurs revérifiés un par un avant le run définitif.

---

## 10. Points laissés en suspens

1. **Les 54 tuiles de terrain et les 2 fichiers de `carte/` attendent un
   arbitrage** (§5). Tant qu'il n'est pas rendu, `verifier.py` sort en **1** :
   c'est son verdict, pas une panne, et `CLAUDE.md` §0 le dit.
2. **`planches.py --verifier` et `verifier.py` se recouvrent en partie.** Le
   premier ne connaît que les 90 fichiers d'unités et de bâtiments issus des
   sources 1024, le second les 1 426 ; le premier reste plus rapide (20 s contre
   125 s). Les fondre serait un lot à part, et il faudrait décider lequel meurt.
3. **Le vérificateur n'a pas de mode « écrire ».** Délibéré : un vérificateur
   dont le premier geste est d'écraser ce qu'il devait contrôler ne contrôle
   rien. Régénérer se fait en lançant l'outil concerné à la main.
4. **Deux scripts de `tools/` sont historiques** — `align_chenilles.py` et
   `retirer_appendice.py` — et leurs chemins pointent vers une machine qui
   n'existe plus. Ils ne sont dans aucune chaîne. Les retirer serait amputer une
   trace ; §2 les décrit désormais comme tels.
5. **Aucune vérification appareil dans ce lot** — il ne touche ni `src/` ni
   `dist`. Celles des cinq lots précédents restent **NON EXÉCUTÉES**, listées
   dans `RAPPORT-STRUCTURES-AU-COMBAT.md` §7.
