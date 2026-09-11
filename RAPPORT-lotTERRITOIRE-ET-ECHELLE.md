# RAPPORT — lot TERRITOIRE-ET-ÉCHELLE

Exécuté le 11/09/2026. Deux moitiés qui ne partagent aucun fichier : le point 5
du 10/09 sur le territoire des ruines, et l'échelle des quatre états des
bâtiments.

---

## Base de départ

- `npm run check` sur l'arbre pristine de `main` = **`72245db`** (le commit de
  fusion du lot RAID-ET-ÉCRAN) : **1 573 déclarés · 1 572 pass · 0 fail ·
  1 skipped** (`LIMITE T8`, suspendu par Ethan le 08/09), sortie **0**.
- Version **0.99.44 · build 146**, `SAVE_VERSION` **32**.
- `dist/index.html` : **9 314 390 octets**, 0 référence externe.

⚠⚠ **TROIS CHIFFRES DU BRIEF SONT PÉRIMÉS, ET LES TROIS SONT DÉCLARÉS.** Il pose
1 564 tests, `0.99.40 · build 142` et « `SAVE_VERSION` reste à 31 » ; mesuré au
départ, **1 573**, `0.99.44 · build 146` et **32**. EMPRISES-ET-DÉLAI, MUR et
RAID-ET-ÉCRAN ont été mergés entre l'écriture du brief et son exécution. Ce que
le brief voulait dire sur la sauvegarde est tenu : **le lot n'ajoute, ne retire
et ne convertit aucun champ.**

### `tools/verifier.py` AVANT — et il ne peut PAS être lancé en entier ici

⚠⚠ **`opus-tools` N'EST PAS INSTALLABLE SUR CETTE MACHINE.**
`choco install opus-tools` échoue : « l'accès au chemin
`C:\ProgramData\chocolatey\lib-bad` est refusé » — pas de droits
d'administrateur. `tools/sons.py` sort donc en erreur, et avec lui la chaîne
complète ET `tools/entrees.py`, qui la rejoue.

**Le repli employé, et ce qu'il coûte :** la chaîne est jouée **outil par outil**
sous `--outil`, **sans `sons`**. Le vérificateur le dit lui-même — `--outil`
**restreint la comparaison à la FAMILLE et ne rend AUCUN manquant**. Le verdict
est donc **plus faible** que celui de la chaîne entière, et il faut le lire comme
tel. Ce qu'il garde intact est la seule chose qui compte pour ce lot-ci : la
chaîne reproduit-elle les sprites du dépôt.

```
planches         identiques     0  différents  92
emblemes         identiques     1  différents 270
effets           identiques     0  différents  24
ruines           identiques     0  différents   4
joueur_v2        identiques     0  différents  84
ouvrage_v2       identiques     0  différents  84
batiments_v2     identiques     0  différents 162
ancres-defense   identiques     0  différents   1
ancres-blindes   identiques     0  différents   1
ancres-ouvrage   SORTIE 2   (montage, voir ci-dessous)
fonds            identiques     9  différents   1
sols             identiques    22  différents   1
limites          identiques    14  différents  54
terrain          identiques     0  différents  20
entrees          SORTIE 2   (opusenc)
TOTAL  identiques 46 · différents 798 · nouveaux 0 · 472,2 s
tools/atlas.py --verifier → 17 identiques · 3 différents (carte-64, carte-128, interface-128)
```

⚠⚠ **LES 798 « DIFFÉRENTS » SONT L'ENCODEUR PNG DE CETTE MACHINE, ET LES PIXELS
SONT IDENTIQUES — MESURÉ, PAS SUPPOSÉ.** Le même arbre pristine passé à un
comparateur de PIXELS, outil par outil, rend **zéro différence sur les quinze
producteurs** :

```
planches     memes PIXELS  92 · PIXELS DIFFERENTS 0
emblemes     memes PIXELS 270 · PIXELS DIFFERENTS 0
effets       memes PIXELS  24 · PIXELS DIFFERENTS 0
ruines       memes PIXELS   4 · PIXELS DIFFERENTS 0
joueur_v2    memes PIXELS  84 · PIXELS DIFFERENTS 0
ouvrage_v2   memes PIXELS  84 · PIXELS DIFFERENTS 0
batiments_v2 memes PIXELS 162 · PIXELS DIFFERENTS 0
limites      memes PIXELS  54 · PIXELS DIFFERENTS 0
terrain      memes PIXELS  20 · PIXELS DIFFERENTS 0
fonds/sols   memes PIXELS   1 chacun (les deux manifestes JSON)
```

C'est la situation que `CLAUDE.md` §6 documente pour PICTOGRAMMES, à une autre
échelle. **Toolchain ici : Pillow 12.3.0, numpy 2.5.3, scipy 1.18.1** ; ART-90
mesurait 1 110 identiques sous numpy 2.4.6 / scipy 1.17.1 — **ce n'est donc pas
Pillow seul.**

⚠ **`ancres-ouvrage.py` SORT EN 2 POUR UNE RAISON DE MONTAGE, PAS DE CHAÎNE.** Il
lit `ancres-blindes.json` dans le dossier dérouté par `FZ_SPRITES` ; seul un
passage COMPLET l'y écrit avant lui, et le repli par outil lui donne un dossier
vide. Vérifié en lisant la trace : `FileNotFoundError` sur ce fichier-là.

---

## Ce qui est produit

- Version **0.99.45 · build 147**, `SAVE_VERSION` **32, inchangé**.
- `npm run check` : **1 575 déclarés · 1 574 pass · 0 fail · 1 skipped**,
  sortie **0**.
- `dist/index.html` : **9 367 456 octets**, 0 référence externe.

### Delta, poste par poste

Mesuré contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de
`72245db` :

| poste | avant | après | delta |
|---|---:|---:|---:|
| feuille | 45 020 | 45 020 | **+0** |
| JavaScript | 408 183 | 408 889 | **+706** |
| balisage | 36 598 | 36 598 | **+0** |
| images | 7 631 243 | 7 683 603 | **+52 360** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| **TOTAL** | **9 314 390** | **9 367 456** | **+53 066** |

La somme des cinq postes tombe **EXACTEMENT** sur le total. **307 lignes `data:`
et 306 URI de part et d'autre** : aucune ressource n'entre — ce sont les mêmes
306 URI, dont un pèse plus lourd.

⚠ **LES 52 360 OCTETS SONT UN SEUL FICHIER, AU DERNIER OCTET.**
`atlas-batiment-128.webp` passe de **491 442 à 530 710**, soit 655 256 → 707 616
en base64. La grille 64 grossit aussi — 179 002 → **190 064** — et **ne coûte
rien au livrable**, `GRILLE_ATLAS` valant 128.

Borne T10 **inchangée à 9 600 000**, marge **232 544 octets, 2,42 %**.

### `tools/verifier.py` APRÈS

```
planches         identiques     0  différents  92
emblemes         identiques     1  différents 270
effets           identiques     0  différents  24
ruines           identiques     0  différents   4
joueur_v2        identiques     0  différents  84
ouvrage_v2       identiques     0  différents  84
batiments_v2     identiques   132  différents  30
ancres-defense   identiques     0  différents   1
ancres-blindes   identiques     0  différents   1
ancres-ouvrage   SORTIE 2   (montage, préexistant)
fonds            identiques     9  différents   1
sols             identiques    22  différents   1
limites          identiques    14  différents  54
terrain          identiques     0  différents  20
entrees          SORTIE 2   (opusenc, préexistant)
TOTAL  identiques 178 · différents 666 · nouveaux 0 · 461,7 s
tools/atlas.py --verifier → 17 identiques · 3 différents (les trois mêmes)
src/data/atlas.js  identique · atlas-empreintes.json  identique
```

⚠⚠ **UNE SEULE LIGNE BOUGE, ET ELLE S'INVERSE : `batiments_v2` PASSE DE
0 / 162 À 132 / 30.** Le total suit exactement — 46 / 798 devient 178 / 666, soit
**+132 / −132**, et aucune autre ligne ne change d'une unité. Les **132 PNG que
le lot régénère sont dans les
« identiques à l'octet »** — c'est la seule chose qui dise que l'art commité
vient de l'outil commité. Les **30 restants** sont ceux que le lot **rend à
`HEAD`** (voir plus bas) : leur dessin n'a pas bougé, et ils portent les octets
de l'encodeur d'origine.

⚠ `atlas.py --verifier` rend les mêmes trois écarts préexistants — `carte-64`,
`carte-128`, `interface-128` —, laissés exactement où ART-90 les a trouvés. ⚠ Et
`atlas-empreintes.json` rend **identique** après le recousage : le manifeste
décrit le fichier RETENU, pas celui qu'on vient de coudre.

---

# PREMIÈRE MOITIÉ — le territoire

## Ancres appliquées, comptes AVANT modification

| ancre | fichier | compte |
|---|---|---:|
| A — `if (!base.ruine && base.rangee === rangee …)` | `src/sim/territoire.js` | **1** |
| B — `if (!centre.ruine && centre.rangee >= r0 …)` | `src/sim/territoire.js` | **1** |
| portée, case — `if (distance > RAYONS[camp]) return;` | `src/sim/territoire.js` | **1** |
| portée, carte — `const rayon = RAYONS[camp];` | `src/sim/territoire.js` | **1** |
| E — `return RAISON ** BigInt(niveau - distance + …)` | `src/sim/territoire.js` | **1** |
| `raisonDeLaForce: 2,` | `src/data/sites.js` | **1** |

Les six comptent **exactement 1**. Aucun n'a arrêté le lot.

### La correspondance `type` → camp d'origine

Écrite **une fois**, dans `src/sim/territoire.js` :

```js
export const CAMP_D_ORIGINE_DE_LA_RUINE = Object.freeze({
  base: OUVRAGE,
  baseJoueur: JOUEUR,
});
```

**Son seul lecteur est `rayonDeLaForce`**, elle-même appelée par **deux**
fonctions : `campDeLaCase` (la question d'UNE case) et `peindre` de
`territoireDeLaFenetre` (la carte d'une fenêtre). Un `type` inconnu **LÈVE** en
nommant la valeur, plutôt que de retomber sur un rayon par défaut.

## Les trois correctifs

### 2.1 — le plancher s'applique aux ruines, sur leur carré et rien de plus

Ethan : « quoi qu'il arrive la ruine conserve son carré original. Comme une base
[…] **Juste le petit carré, même pas l'octogone.** »

Les deux `!ruine` partent, des deux ancres **ensemble**. Le bloc de CONQUÊTE-24H
qui portait la lecture inverse — « une ruine n'est pas une base, elle peut donc
perdre sa propre case », déclarée réversible au retrait de deux mots — est
réécrit, pas supprimé : il raconte les deux arbitrages et dit lequel l'emporte.

**Mesure du défaut.** Sur **1 630 rasages simulés** — dix graines, les rangées 120
à 290, chaque base de l'Ouvrage rasée tour à tour — la ruine **PERDAIT sa propre
case 826 fois sous l'ancien barème (50,7 %)** et en perdrait **885 sous celui du
jour (54,3 %)**, pendant que `lignesDeLaRuine` de `ui/monde.js` annonçait
« Terrain : Vous » **1 630 fois sur 1 630**. Le panneau n'est pas touché : il
devient vrai par l'autre bout.

### 2.2 — une ruine émet au rayon de ce qu'elle ÉTAIT

`rayonDeLaForce(force, camp)` remplace `RAYONS[camp]` aux deux endroits. Une base
debout garde le rayon de son camp ; une ruine prend celui de son camp d'ORIGINE.

**Mesuré, ruine isolée, octogone COMPTÉ :**

| type de ruine | cases peintes |
|---|---:|
| `base` (base de l'Ouvrage rasée) | **37** |
| `baseJoueur` (base du joueur rasée) | **21** |

⚠ **Les deux nombres ne se confondent pas**, donc la correspondance est
observable — c'est ce que le §5 du brief demandait de vérifier avant de conclure.

### 2.3 — la prime de niveau devient fractionnaire

`GEOGRAPHIE` porte désormais **deux** raisons :

```js
raisonDeLaForce: 2,                                 // la DISTANCE
raisonDeNiveau: { numerateur: 7, denominateur: 5 }, // le NIVEAU
```

et `forceDUneBase` rend `NUM^n × DEN^(50−n) × 2^(3−d)`. **Aucun flottant
n'entre** : diviser chaque terme par `5^50 × 2^3` — un facteur COMMUN qui ne
change aucune comparaison — donne `(7/5)^niveau × 2^(−distance)`.

Le commentaire de `raisonDeLaForce` est réécrit : il affirmait « DEUX, ET C'EST
CE NOMBRE-LÀ QUI FAIT TENIR LES DEUX MOITIÉS DE LA PHRASE » et « c'est le seul
nombre à tourner », ce qui envoyait chercher un réglage impossible.

**Barème mesuré :**

| grandeur | avant | après |
|---|---:|---:|
| +1 niveau vaut | 2 bases | **1,400** |
| +2 niveaux | 4 | **1,960** |
| +3 niveaux | 8 | **2,744** |
| +4 niveaux | 16 | **3,842** |
| +5 niveaux | 32 | **5,378** |
| +10 niveaux (un 20 contre des 10) | 1 024 | **28,925** |
| bases de niveau 10 pour DÉPASSER un niveau 20 | 1 025 | **29** (28 restent dessous) |
| niveaux pour doubler la force | 1,00 | **2,06** |

⚠⚠ **RAPPORT DE DISTANCE À NIVEAU ÉGAL : EXACTEMENT 2.** Une base à une case pèse
le double d'une base à deux cases. La distance n'est **pas** adoucie — c'est ce
que le brief demandait de vérifier, et ce n'est donc pas un défaut à signaler.

⚠⚠ **UNE PROPRIÉTÉ ARBITRÉE DISPARAÎT, ET LE RAPPORT LA NOMME.** « Deux bases 10
est moins fort qu'une base 20 » TIENT (il en faut 29). Mais l'égalité exacte
« deux bases de niveau 10 valent EXACTEMENT une base de niveau 11 », vraie
seulement à la raison 2, devient une **inégalité** : deux bases 10 valent un peu
**PLUS** qu'une base 11. **Essaimer devient légèrement meilleur que monter.**
C'est le prix de l'adoucissement ; `TF T1` le DIT au lieu de disparaître.

## Les neuf témoins de calibrage

Chacun porte, dans le code, la ligne que le §4 du brief exige — « témoin de
calibrage, valeur arbitrée par Ethan le 10/09, à réaligner au prochain arbitrage,
jamais à opposer à celui qui viendra ».

| test | ce qui a bougé |
|---|---|
| `C24 T1` | 21 → **37** ; assertion du plancher **INVERSÉE** (`OUVRAGE` → `JOUEUR`), plus une moitié neuve : le plancher s'arrête au carré |
| `C24 T2` | montage réparé — l'adversaire passe de 18 à **17** |
| `C24 T5` | 21 → **37** |
| `C24 T7` | 21 → **37**, deux fois |
| `C24 T12` | 21 → **37** |
| `TF T1` | égalité exacte → **inégalité**, et les deux raisons sont lues dans `GEOGRAPHIE` |
| `TF T2` | 1 024 → **29**, borne serrée des deux côtés (28 dessous, 29 dessus) |
| `TF T3` | le rognage **RÉTRÉCIT** : 21/26 → **18/29** |
| `RC T2` | montage réparé — la cible se cherche sous le niveau **4** au lieu de 5 |

⚠⚠ **`C24 T5`, `T7` ET `T12` TOMBAIENT SUR DES COMPTES DE CASES, PAS SUR DES
SEUILS D'HORLOGE — VÉRIFIÉ AVANT DE TOUCHER AU MONTAGE.** `TICKS_DE_RUINE` n'a
pas bougé d'un tick, `ruineEstActive` n'a pas une ligne de changée, et `C24 T6`
garde toujours l'autre côté du seuil. C'est écrit dans chacun des trois.

⚠⚠ **ET DEUX MONTAGES ONT PERDU LEUR PRÉMISSE — C'EST LE MONTAGE QU'ON RÉPARE,
JAMAIS L'ASSERTION.**

- **`C24 T2`** opposait une ruine de 20 puis de 17 à un adversaire de **18**.
  Sous 7/5 les deux perdent : le test cessait de distinguer quoi que ce soit,
  c'est-à-dire qu'il aurait passé au vert sur un code émettant au niveau du
  VAINQUEUR. Balayé sur `forceDUneBase`, les adversaires 15, 16 et 17 départagent
  encore ; **17** est retenu, et il le fait par les deux bouts — trois niveaux
  d'avance battent une case de retard, l'égalité de niveau non.
- **`RC T2`** exigeait que le joueur soit le plus fort sur la case avant de
  mesurer le plancher. Sous 7/5 il faut **cinq niveaux pleins** pour franchir deux
  cases : à niveau 5 l'Ouvrage l'emporte, à niveau 4 le joueur.
  `trouverUneBaseFaible(graine, 4)`. **La capture d'Ethan — base du joueur à 8,6 —
  n'a pas bougé d'une ligne.** ⚠ Le brief annonçait « le prix change » pour ce
  test : **écart déclaré, le prix ne change pas** — il vaut 16 des deux côtés,
  c'est la prémisse du montage qui était tombée.

## Les deux tests neufs

**`RT T1` — la ruine tient sa case sous le feu.** Une base de l'Ouvrage de niveau
20 rasée par le joueur, entourée de **quatre ruines de l'Ouvrage de niveau 30 à
une case**. Le montage prouve son mordant **par l'arithmétique avant d'asserter
quoi que ce soit** : `forceDUneBase(20, 0) < 4n × forceDUneBase(30, 1)`. Les deux
lecteurs sont interrogés, et la case à DEUX de la ruine est exigée à l'Ouvrage —
sans quoi un plancher élargi à l'octogone passerait.

⚠ **L'ENTOURAGE EST FAIT DE RUINES ET NON DE BASES, ET C'EST MESURABLE.** Le
niveau d'un site de l'Ouvrage est celui de sa RANGÉE, à 0,2 par case : quatre
voisines à une case ne peuvent différer que d'un cinquième de niveau. Le niveau
d'une ruine est STOCKÉ — c'est le montage de `C24 T2`, légitime pour la même
raison.

**`RT T2` — la carte et la case s'accordent, case par case.** Balayage d'une
fenêtre de 13 × 13 portant une ruine dominée, `campDeLaCase` contre
`occupantDeLaCase`, et le montage prouve d'abord qu'il porte à la fois une case
que la ruine GARDE et une qu'elle PERD, du neutre et du tenu, des deux camps.

### Falsifications — cinq jouées, cinq chutes, zéro muette

| falsification | rouges |
|---|---|
| F1 — le plancher retiré des DEUX ancres (l'état d'avant le lot) | `C24 T1`, `RT T1`, `RT T2` |
| F2 — corrigé sur la SEULE ancre A (`campDeLaCase`) | `C24 T1`, `RT T1`, `RT T2` |
| F3 — corrigé sur la SEULE ancre B (`peindre`) | `C24 T1`, `RT T1`, `RT T2` |
| F4 — la ruine reprend le rayon du camp qui la TIENT | `C24 T1`, `T5`, `T7`, `T12` |
| F5 — la raison de niveau revient à 2 | `TF T1`, `TF T2`, `TF T3` |

⚠⚠ **F2 ET F3 SONT CE QUI JUSTIFIE `RT T2`** : une demi-correction ne passe pas.
C'est exactement la falsification que le §5 du brief demandait — « ne corriger
que l'ancre A, et vérifier le rouge ».

⚠ **L'arbre a été restauré en RÉÉCRIVANT le contenu gardé en mémoire, jamais par
`git checkout`** — sur ce dépôt, restaurer l'index efface le travail du lot.
Vérifié par égalité du fichier après chaque passe.

## Ce que la première moitié ne change pas

- **L'expiration à 24 h**, bord franc compris : `TICKS_DE_RUINE`,
  `ruineEstActive`, `ruinesActives` — pas une ligne.
- **`casesRasees`**, qui ignore l'expiration : une base rasée ne revient jamais.
- **`rayonInfluenceJoueur: 2` et `rayonInfluenceEnnemie: 3`** : inchangés.
- **Le panneau de la ruine** : il devient vrai par l'autre bout, et il n'appelle
  pas `campDeLaCase` « pour être sûr » — ce serait un troisième chemin.
- **`SAVE_VERSION`** : les trois correctifs sont des LECTURES de champs que
  `basesRasees` porte depuis la v28.

---

# SECONDE MOITIÉ — l'échelle des quatre états

## 7.1 — la référence d'échelle est celle de l'état NEUF

`tools/batiments_v2.py` appelait `recadrer(im, emprise * (N // 32), N)` **sans
`cote_ref`** : chaque état était normalisé sur sa propre boîte d'encre, et celle
d'un état abîmé est plus large. Il reçoit désormais un `cote_ref` **commun à la
famille**, mesuré une fois par `cote_de_letat_neuf(prefixe, cle)`.

⚠⚠ **LE CÔTÉ NE SE RECALCULE PAS : `boite_dencre` EST EXTRAITE DE `recadrer`.**
Même clé DÉTECTÉE (`cle_de_fond`), même seuil d'encre (`alpha >= 128`), même
`max(largeur, hauteur)`. Une seconde version dans `batiments_v2.py` aurait donné
deux définitions de la même boîte, dont une seule aurait reçu la prochaine
correction. `ED T3` lit l'appel dans la source.

⚠ **LA VIGNETTE MIXTE NE BOUGE PAS**, et c'est délibéré : elle n'a qu'UN état,
donc aucune famille à mettre à l'échelle. `cote_ref=None`, `ancrage='centre'` —
lui prêter la référence du collecteur quartz déplacerait l'icône de la palette,
qu'Ethan n'a pas visée.

**Résultat mesuré, sur les deux grilles :**

| population | compte | mesure |
|---|---:|---|
| états NEUF (20 bâtiments + la vignette) | 21 | **emprise atteinte EXACTEMENT, zéro écart** |
| états abîmés au-dessus de leur emprise | **50** / 60 | c'est ce que le lot achète |
| états abîmés sous leur emprise | 4 (grille 64) · 6 (grille 128) | des `_detruit` : les gravats sont plus bas et plus étroits que le bâtiment debout |
| pire écart en dessous | 6 (64) · **14** (128) | `bat_j_artillerie_anti_infanterie_detruit` |

⚠ **Sans `cote_ref`, les quatre-vingt-un tomberaient exactement sur leur
emprise.** `ED T1` falsifie l'ancienne règle **de face** en exigeant ce cinquante.

## 7.2 — le débordement va vers le HAUT (`ancrage='bas'`)

⚠⚠ **ET IL EST RÉEL — ÉCART AU BRIEF, MESURÉ.** Le brief annonçait « dix-neuf
familles sur vingt tiennent sans un pixel coupé ». **Faux.** Sa marge comparait le
côté du contenu à la CASE ; sous `ancrage='bas'` le contenu repose sur la ligne de
sol de la référence, donc il ne dispose que de **1,05 × référence** au-dessus
d'elle, jamais de la case entière (`box//2 + ref//2`).

| grille | encre au bord HAUT | au bord LATÉRAL | au bord BAS |
|---|---:|---:|---:|
| 128 | **28** / 81 | 5 / 81 | **0** |
| 64 | **29** / 81 | 8 / 81 | **0** |

Pire coupe mesurée : **la Caserne très abîmée, 108 pixels source sur 873, soit
15,8 px de 128** — le haut du panache est coupé net.

⚠⚠ **AUCUN SPRITE NE TOUCHE LE BORD BAS, ET C'EST EXACTEMENT CE QUE
`ancrage='bas'` ACHÈTE.** Centré, le débordement serait rogné en haut ET en bas à
parts égales : le bâtiment serait coupé à sa base.

⚠⚠ **ET C'EST STRUCTUREL, PAS UN RÉGLAGE.** La boîte de recadrage DÉCIDE de
l'échelle : l'agrandir pour tout contenir rétrécirait le bâtiment, c'est-à-dire
rouvrirait le défaut qu'on corrige. Faire déborder un sprite hors de sa case
sortirait les 81 de l'atlas cousu — `coudre` exige des cellules carrées — et les
paierait en `data:` séparés. **Ce serait un autre lot. Ethan arbitre sur la
planche.**

## 7.3 — la Souche passe au palier 92 %

À 98 % son état DÉTRUIT touche les deux bords latéraux de sa case : `bat_o_souche_detruit`
sortait à **l=128 sur 128**. **C'est une ligne qui PART de `EMPRISE_PAR_BATIMENT`,
pas une ligne qui change** — 92 % EST le défaut, et la réécrire ferait la ligne
que la table interdit, celle qui ne dit rien et qui survivrait à un changement de
défaut.

⚠ **LE CHANTIER RESTE À 98 %** : il tient. **L'Étai était déjà au défaut sans
être dans la table** — vérifié, rien à faire pour lui, et surtout pas l'y
inscrire. ⚠ **Les deux ruines lisent le palier du CHANTIER** et n'ont pas eu une
ligne à changer ; `ED T4` change de titre, pas d'assertion.

⚠ **Il reste du rogné après le passage à 92 % : `bat_o_souche_detruit` touche
encore les deux bords latéraux en 128** (24 pixels source coupés, 12 de chaque
côté, soit ~1,8 px de 128). Le brief annonçait « moins d'un pixel sur 128,
invisible » : mesuré, c'est **1,8**.

## L'exception du panache d'ART-90 est levée

`bat_j_artillerie_anti_infanterie_tres_abime` était le seul sprite SOUS son
palier — **57 sur 58** en 64, **114 sur 116** en 128 — à cause de `eroder(m, 3)`.
La cause n'a pas disparu ; ce qui a changé, c'est qu'il n'est plus normalisé sur
sa propre boîte. Il sort à **61** et **122**, donc **au-dessus**. `ED T1`
l'asserte LEVÉE plutôt que de la retirer en silence : un lot qui ramènerait la
normalisation par sprite ferait tomber cette ligne en nommant l'endroit.

## Les 162 fichiers, et les 30 rendus à `HEAD`

L'outil réécrit ses **162** PNG. **132 changent de dessin ; 30 ne changent que
d'octets.**

⚠⚠ **LES TRENTE SONT RENDUS À `HEAD` À L'OCTET, ET C'EST UNE RÈGLE DU DÉPÔT.**
`CLAUDE.md` §6 : « ne jamais rafraîchir les fichiers commités pour faire taire
l'outil ». L'encodeur PNG de cette machine ne reproduit pas celui du dépôt (voir
le verdict AVANT) : les laisser aurait mis au diff trente images **identiques au
pixel**. Ce sont les états neufs dont l'ancrage ne déplace rien — les familles
dont le contenu est plus HAUT que large — plus la vignette mixte. La restauration
lit les octets de `HEAD` et les réécrit ; **elle n'appelle pas `git checkout`.**

⚠⚠ **ET LE VÉRIFICATEUR LE DIT DANS L'AUTRE SENS APRÈS LE LOT :
`batiments_v2` passe de 0 / 162 à 132 / 30.** Les 132 régénérés sont dans les
« identiques à l'octet » — la seule chose qui dise que l'art commité vient de
l'outil commité.

## L'atlas

`python3 tools/atlas.py --ecrire --forcer batiment`. **Sans `--forcer`, l'outil
imprime « ÉCART » et n'écrit rien.** Seules les deux lignes `batiment` sont
réécrites ; `carte-64`, `carte-128` et `interface-128` restent exactement où
ART-90 les a trouvés.

- `atlas-batiment-128.webp` : 491 442 → **530 710** (+39 268 ; **+52 360** en
  base64, c'est-à-dire tout le poste `images` du lot)
- `atlas-batiment-64.webp` : 179 002 → **190 064**
- `src/data/atlas.js` : **identique** — 83 sprites en 10 × 9 des deux côtés, la
  géométrie des cellules ne change pas.
- `art/sprites/atlas-empreintes.json` : mis à jour.

## La planche de contact

**`rapports/planche-echelle-quatre-etats.png`** — 1 324 × 1 368, huit familles en
rangées (Chantier, Souche, Caserne, Collecteur à quartz, Complexe de défense,
Raffinerie, Dépôt de véhicules, Terril), les quatre états en colonnes, **AVANT à
gauche et APRÈS à droite**, cadre de case dessiné pour que le rognage se voie.

⚠⚠ **C'EST LA SEULE VÉRIFICATION QUI VAILLE POUR CETTE MOITIÉ.** Aucune assertion
ne dit qu'un bâtiment « a l'air de la même taille ». **Ethan arbitre dessus**, et
c'est là que se juge le panache coupé du §7.2.

## Ce que la seconde moitié ne change pas

- Les **unités**, les **défenses**, les **murs**, les **tourelles**, les
  **emblèmes de carte** : hors périmètre. `EMPRISE_QUATRE_VINGT_DIX` et
  `EMPRISE_QUATRE_VINGT_CINQ` de `tools/joueur_v2.py` ne sont **pas** partagées.
- Le **canevas** des sprites : 128 et 64.
- Les **trois paliers** : 31 / 29 / 27. Seule la Souche change de palier.
- **`art/sources/` n'est pas touché** — zéro fichier au diff, donc
  `art/sources-declarees.json` ne bouge pas et `tools/entrees.py --declarer`
  n'avait pas lieu d'être lancé.

---

## Fichiers touchés

```
src/data/sites.js                    raisonDeNiveau, commentaire de raisonDeLaForce
src/sim/territoire.js                les trois correctifs
tools/final128.py                    boite_dencre extraite de recadrer
tools/batiments_v2.py                cote_ref commun, ancrage bas, Souche au défaut
package.json                         0.99.45 · build 147
test/conquete-24h.test.js            C24 T1, T2, T4 (commentaire), T5, T7, T12
test/territoire.test.js              TF T1, TF T2, TF T3, RC T2, RT T1, RT T2
test/emprises-et-delai.test.js       ED T1 (retourné), ED T2, ED T3, ED T4 (titre)
test/pictogramme.test.js             PIC T6, PIC T7 réancrés
CLAUDE.md                            §0 et ligne de révision
art/sprites/bâtiment/{64,128}/       132 PNG
art/sprites/atlas-batiment-{64,128}.webp
art/sprites/atlas-empreintes.json
rapports/planche-echelle-quatre-etats.png   (entrant)
RAPPORT-lotTERRITOIRE-ET-ECHELLE.md         (entrant)
```

**Pas une ligne de `src/ui/`, `src/render/`, `src/son/`, `src/sim/combat.js`,
`src/sim/generateur.js` ni `art/sources/`** — vérifié au diff.

---

## Écarts au brief, déclarés

1. **`SAVE_VERSION` : le brief dit 31, il vaut 32** depuis RAID-ET-ÉCRAN. Il reste
   à 32 ; l'intention du brief — aucun champ ne bouge — est tenue.
2. **La base annoncée est périmée de trois chiffres** : 1 564 → 1 573,
   `0.99.40 · build 142` → `0.99.44 · build 146`.
3. **`tools/verifier.py` ne peut pas être lancé en entier** : `opus-tools` n'est
   pas installable sans droits d'administrateur. Repli par outil, sans `sons`,
   **verdict plus faible, déclaré**. Deux outils sortent en 2 pour des raisons de
   montage, pas de chaîne.
4. **La chaîne ne reproduit plus le dépôt à l'octet sur cette machine, AVANT le
   lot** : 798 différents, **0 pixel différent**. Encodeur PNG, numpy 2.5.3 /
   scipy 1.18.1 contre 2.4.6 / 1.17.1 à ART-90.
5. **Le débordement du §7.2 est bien plus large que le brief ne l'annonce** :
   28 sprites sur 81 ont de l'encre au bord haut, pas un seul. Mesuré, expliqué
   (la ligne de sol, pas la case), porté à la planche.
6. **`RC T2` : le prix ne change pas.** Le brief annonce « le plancher est
   facturé — le prix change » ; il vaut 16 des deux côtés. Ce qui est tombé est la
   prémisse du montage.
7. **La Souche reste rognée de ~1,8 px sur 128 au palier 92 %**, là où le brief
   annonçait « moins d'un pixel, invisible ».

---

## Ce qui n'a pas été vu, et se déclare non exécuté

- **Le rendu en jeu.** Ce que le lot change est précisément ce qu'on regarde — un
  bâtiment qui brûle sur l'écran du Chantier et sur celui d'un raid, les
  frontières de territoire sur la carte du monde — et **rien n'a été ouvert dans
  un navigateur**. Tout est mesuré sur les PIXELS des PNG et sur des fonctions
  PURES.
- **Le panache coupé**, jugé sur la planche de contact et non à l'écran.
- **Le rendu sur l'appareil d'Ethan** (§3).
