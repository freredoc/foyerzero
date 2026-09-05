# RAPPORT — lot ARRÊT

**Version produite : 0.92.0 · build 94.**
`npm run check` → **1063 pass / 0 fail** · `dist/index.html` **6 791 759 octets**,
0 référence externe · `SAVE_VERSION` inchangé à **24**.

Base au départ du lot, confrontée et non recopiée : **1053 pass / 0 fail**,
`dist/index.html` **6 791 796 octets**, version **0.91.0 · build 93**. Le brief
annonçait ces trois nombres ; les trois sont justes.

---

## 1. Ce qui change, et c'est trois lignes

Ancre EXTRAITE de `src/sim/combat.js`, jamais retapée — après :

```js
function doitSArreter(etat, e, p) {
  if (p.comportementAerien === 'traversant') return false;
  if (!e.aTire || e.cibleIndice === null) return false;
  return profil(etat.entites[e.cibleIndice]).genre === 'batiment';
}
```

Avant, extraite de `origin/main` au commit `6825f81` :

```js
function doitSArreter(etat, e, p) {
  if (p.comportementAerien === 'traversant') return false;
  if (!e.aTire || e.cibleIndice === null) return false;
  const pc = profil(etat.entites[e.cibleIndice]);
  return p.colonnePredilection === pc.colonneMatrice;
}
```

`count` vérifiés sur le fichier : `doitSArreter` **7 occurrences**,
`colonnePredilection` **12** (dont 5 en commentaire ; `ARRÊT T10` en compte
**7 hors commentaires** — trois écritures de profil, une garde de nullité, trois
lectures de comparaison).

⚠⚠ **LE FAIT CENTRAL EST QUE LA COLONNE NE POUVAIT PAS SÉPARER UN MUR D'UN
BÂTIMENT.** `COLONNE_PAR_TYPE_DEFENSE` range `mur`, `barriere` et `tourelle` sous
`structureOuAviation`, et `profilBatiment` pose la même valeur. Une anti-structure
s'arrêtait donc pour les trois. Le `genre` — `'defense'` contre `'batiment'` — est
le seul discriminant qui existe.

⚠ **`p` reste dans la signature** parce que la garde aérienne le lit, et
`colonnePredilection` **reste vivant** : la munition spéciale et le camouflage le
lisent tous les deux, vérifié par grep avant de toucher quoi que ce soit et gardé
par `ARRÊT T10`.

---

## 2. « Sauf si ils empêchent d'avancer » — le brief se trompait de mécanisme

Le brief pose que `structureForcee` retient l'unité devant un merlon. **Mesuré,
c'est faux pour douze pièces sur quatorze** :

```js
if (!moduleActif(etat, e, p, 'ecraseur')) return undefined;
```

`structureForcee` ne rend une structure qu'aux porteurs de l'**Écraseur** — le
Fendeur et le Broyeur. Ce qui retient les douze autres devant un mur est le
**TIR** : `nuit(e)` vaut `e.aTire`, et une unité qui tire sur le mur remet
`ticksInutiles` à zéro à chaque tick. `ARRÊT T8` mesure les deux cas, avec le
Broyeur (qui force) et les Perceurs (qui ne font que tirer).

⚠⚠ **ET LE REPLI NE PEUT PAS EMPIRER PAR CETTE FONCTION, PAR CONSTRUCTION.**
`doitSArreter` exige `e.aTire` en deuxième ligne, et `nuit(e)` EST `e.aTire` :
toute bascule de vrai à faux ne peut qu'ajouter une chance de progresser, jamais
retirer une raison de rester utile. Le chemin « ne s'arrête plus, ne progresse
pas, ne force pas, ne nuit pas » que le brief demande de chercher **ne peut pas
être créé par la règle**. Il pouvait l'être par le DÉPLACEMENT qu'elle induit, et
c'est ce que M5 est allé voir.

---

## 3. Les cinq mesures — 162 montages, `main` contre la branche

Échantillon : **3 niveaux (5, 15, 30) × 3 préréglages × 3 types de site ×
6 graines**, par `montageDuBanc`, résolus par le moteur. Le brief demandait « au
moins une base, un camp et un avant-poste, à plusieurs niveaux, avec des
compositions différentes » : les 162 couvrent les trois types, les trois
préréglages et les trois niveaux.

### Agrégé

| | avant | après | écart |
|---|---|---|---|
| **M1** durée médiane | 296 ticks | **277** | −6,4 % |
| **M1** durée totale | 53 582 | **46 192** | **−13,8 %** |
| **M1** répartition | — | — | 103 plus courts · 52 plus longs · 7 égaux |
| **M2** causes de fin | 157 `attaquants` · 4 `duree` · 1 `souche` | **162 `attaquants`** | les 4 expirations ET le rasage disparaissent |
| **M2** sites rasés | 1 | **0** | `n30/mixte/camp/7` ne tombe plus |
| **M3** attaquantes détruites | 1 534 / 2 121 | **1 655 / 2 121** | **+7,9 %** |
| **M3** survivantes sur le terrain | 6 | **0** | — |
| **M4** PV de défense restants | 381 ‰ | **444 ‰** | la défense est MOINS entamée |
| **M4** PV de bâtiments restants | 925 ‰ | **928 ‰** | quasi inchangé |
| **M5** replis | 562 | **447** | **−20,5 %** |
| **M5** montages avec repli | 106 | **79** | — |
| **M5** sorties aériennes | 19 | 19 | inchangé |
| **butin** total | 108 606 958 | **81 853 061** | **−24,6 %** |
| **butin** répartition | — | — | 68 en baisse · 42 en hausse · 52 égaux |

### Et il ne faut PAS lire « −24,6 % » comme un effet uniforme

| butin | camp | avant-poste | base |
|---|---|---|---|
| **niveau 5** | 92 268 → 103 929 (**+12,6 %**) | 225 996 → 238 998 (**+5,8 %**) | 66 213 → 58 314 (−11,9 %) |
| **niveau 15** | 592 784 → 584 778 (−1,4 %) | 135 084 → 106 131 (−21,4 %) | 25 379 → 23 121 (−8,9 %) |
| **niveau 30** | 107 278 410 → 78 336 344 (**−27,0 %**) | **0 → 2 280 882** | 190 824 → 120 564 (−36,8 %) |

Le total est **dominé par les camps de niveau 30**, qui pèsent 99 % de la masse.
Aux petits niveaux le butin MONTE ; l'avant-poste de niveau 30 passe de **rien du
tout** à deux millions et demi. **Un allongement uniforme n'aurait pas fait ça.**

### La réponse à la phrase que le brief exige noir sur blanc

> **Les raids sont devenus plus DURS, et de 24,6 % de butin sur l'échantillon.**
> Les unités meurent davantage (+7,9 %), il ne reste plus une seule survivante
> sur le terrain, le seul site que l'échantillon rasait ne tombe plus, et les
> combats se terminent 13,8 % plus tôt parce que l'assaut se défait plus vite.
> **Mais la difficulté a changé de forme, pas seulement de niveau** : au niveau 5
> les raids rapportent PLUS, et l'avant-poste de niveau 30, qui ne rapportait
> rien, rapporte désormais. Ce qui s'est durci, c'est le camp de haut niveau.

### Par montage

Les 162 lignes sont en annexe, §9. Groupées par (niveau · préréglage · type),
six graines chacune :

| niveau · assaut · type (6 graines) | ticks | détruites | replis | butin |
|---|---|---|---|---|
| n5 · infanterie · camp | 2510 → 2420 | 5 → 7 | 49 → 47 | 30756 → 34643 |
| n5 · infanterie · avantPoste | 2312 → 2137 | 12 → 18 | 42 → 36 | 75332 → 79666 |
| n5 · infanterie · base | 1804 → 1898 | 9 → 19 | 45 → 35 | 22071 → 19438 |
| n5 · blindeLourd · camp | 2510 → 2420 | 5 → 7 | 49 → 47 | 30756 → 34643 |
| n5 · blindeLourd · avantPoste | 2312 → 2137 | 12 → 18 | 42 → 36 | 75332 → 79666 |
| n5 · blindeLourd · base | 1804 → 1898 | 9 → 19 | 45 → 35 | 22071 → 19438 |
| n5 · mixte · camp | 2510 → 2420 | 5 → 7 | 49 → 47 | 30756 → 34643 |
| n5 · mixte · avantPoste | 2312 → 2137 | 12 → 18 | 42 → 36 | 75332 → 79666 |
| n5 · mixte · base | 1804 → 1898 | 9 → 19 | 45 → 35 | 22071 → 19438 |
| n15 · infanterie · camp | 1960 → 1996 | 74 → 81 | 28 → 21 | 160814 → 163687 |
| n15 · infanterie · avantPoste | 1660 → 1470 | 98 → 102 | 4 → 0 | 1029 → 0 |
| n15 · infanterie · base | 2132 → 1572 | 97 → 102 | 5 → 0 | 156 → 0 |
| n15 · blindeLourd · camp | 2927 → 2310 | 20 → 25 | 33 → 29 | 214149 → 222061 |
| n15 · blindeLourd · avantPoste | 1707 → 1310 | 53 → 54 | 1 → 0 | 63301 → 42985 |
| n15 · blindeLourd · base | 2955 → 1643 | 51 → 53 | 2 → 1 | 9547 → 11206 |
| n15 · mixte · camp | 2584 → 1967 | 40 → 47 | 16 → 10 | 217821 → 199030 |
| n15 · mixte · avantPoste | 1577 → 1856 | 55 → 57 | 3 → 1 | 70754 → 63146 |
| n15 · mixte · base | 2951 → 1804 | 57 → 61 | 3 → 0 | 15676 → 11915 |
| n30 · infanterie · camp | 1678 → 1559 | 115 → 116 | 4 → 3 | 2878082 → 2657226 |
| n30 · infanterie · avantPoste | 1311 → 1190 | 118 → 119 | 1 → 0 | 0 → 0 |
| n30 · infanterie · base | 1294 → 1138 | 117 → 119 | 2 → 0 | 0 → 0 |
| n30 · blindeLourd · camp | 2269 → 2002 | 65 → 77 | 35 → 23 | 71816165 → 62649001 |
| n30 · blindeLourd · avantPoste | 1207 → 1043 | 95 → 99 | 5 → 1 | 0 → 2035076 |
| n30 · blindeLourd · base | 1396 → 867 | 97 → 100 | 3 → 0 | 97448 → 0 |
| n30 · mixte · camp | 1915 → 1269 | 95 → 99 | 6 → 4 | 32584163 → 13030117 |
| n30 · mixte · avantPoste | 1120 → 928 | 103 → 106 | 3 → 0 | 0 → 245806 |
| n30 · mixte · base | 1061 → 903 | 106 → 106 | 0 → 0 | 93376 → 120564 |

---

## 4. M5 monte sur un montage, et le chemin a été cherché ET trouvé

**Un seul des 162** voit ses replis augmenter : `n30/infanterie/camp/11`, de 2 à 3.
Le brief demande de ne pas conclure à un effet de calibrage avant d'avoir cherché
le chemin. Il a été cherché, en instrumentant le montage tick par tick.

L'unité de plus est un **Guetteur**, colonne 1, et voici son état aux trois ticks
qui précèdent son repli :

```
tick 416 guetteur c1 ti=27 rangee=11 (11960) portee²=6250000 aTire=false reserve=0 cible=batterie
  case 12 : gangue(defense,batiment)
  ennemis les plus proches : gangue/batiment d²=1600 | gangue/batiment d²=1001600 | noeud/batiment d²=1921600
```

Il est **collé à une Gangue** — d² = 1 600, soit 0,04 case — largement dans ses
2,5 cases de portée, et sa table de dégâts vaut 4 contre les structures. Il ne
tire pourtant pas, et la raison est dans la ligne : **`reserve=0`**. La règle du
lot 3C veut qu'un attaquant à sec fasse ZÉRO dégât contre un bâtiment ; la Gangue
n'est donc pas une cible valide, il conserve son ancienne (une Batterie hors de
portée), ne tire pas, ne progresse pas — et rentre au bout de trente ticks.

**Ce n'est pas la règle d'arrêt qui crée ce chemin**, et la preuve est celle du
§2 : elle ne peut pas retirer un `aTire`. Ce que le lot fait, c'est **porter les
unités plus loin** — jusqu'à la première rangée de bâtiments — donc rendre
atteignable un état qui existait déjà : arriver au contact d'un bâtiment le
chargeur vide. **Mécanisme antérieur au lot, rendu plus fréquent par lui.** Et
globalement les replis BAISSENT de 20,5 %.

---

## 5. Les dix tests, avec leur montage effectif

`test/arret.test.js`, dix tests, **tous verts**.

| Test | Montage effectif | Ce qu'il mesure |
|---|---|---|
| `ARRÊT T1` | Meute (anti-infanterie) colonne 5, Gangue en (12,6) — **colonne LIBRE devant elle** | elle acquiert la Gangue au tick 150 à 10 940 et ne bouge plus d'un milli-case sur 50 ticks |
| `ARRÊT T2` | Perceurs colonne 5, Batterie en (6,6) — table {0,0,40}, elle ne peut pas riposter | l'avance sur 40 ticks vaut **40 × 60 = 2 400** ; sur `main` elle vaut **60** |
| `ARRÊT T3` | Perceurs colonne 5, Merlon en (6,5) — **même colonne**, donc bloquant | elle monte de son point d'acquisition jusqu'à 5 960, le bord de la case du mur ; sur `main` elle n'a pas bougé |
| `ARRÊT T4` | Carapace colonne 5, Harpon en (6,6) — artillerie, `infanterie: 0` | l'avance sur 20 ticks vaut **20 × 60 = 1 200** ; sur `main` elle vaut **120** |
| `ARRÊT T5` | Crécelle (`traversant`) colonne 5, Gangue en (12,6) | elle vise le bâtiment, avance quand même de 120/tick, et sort par le fond |
| `ARRÊT T6` | Meute qui a acquis la Gangue, puis **replacée à 2 000** — la cible passe hors de portée et est CONSERVÉE | `cibleIndice` pointe un bâtiment, `aTire` est faux, et elle avance de 60 |
| `ARRÊT T7` | Broyeur **avec** et **sans** Écraseur devant le même Merlon, rejoués côte à côte | l'écart de PV du mur vaut **exactement 16 × 1 % des PV max** — le forçage isolé par différence |
| `ARRÊT T8` | Broyeur (force) ET Perceurs (ne fait que tirer), `TICKS_AVANT_REPLI + 5` ticks après le blocage | ni l'un ni l'autre ne se replie, `ticksInutiles` reste à 0, **et le mur est encore debout** — sinon la fenêtre ne mesurerait rien |
| `ARRÊT T9` | la table `DEFENSES` entière, puis un Fendeur contre un Harpon latéral | **aucune tourelle ni artillerie n'est non bloquante** ; latéralement, l'unité passe à sa vitesse nominale |
| `ARRÊT T10` | la source de `src/sim/combat.js`, commentaires ôtés | `colonnePredilection` garde ses lecteurs, la règle lit le `genre`, les deux gardes sont là |

### T2, T3 et T4 sont ROUGES sur `main` — la preuve

Le fichier a été copié tel quel dans un `git worktree` sur `origin/main`
(`6825f81`) et exécuté. **Sept des dix y tombent**, dont les trois inversions, et
chacune tombe sur la ligne qui porte la règle :

```
not ok 2 - ARRÊT T2 …  elle ne s'est pas déplacée de quarante pas : elle s'arrête pour la tourelle
                       60 !== 2400
not ok 3 - ARRÊT T3 …  elle n'a pas bougé depuis qu'elle vise le mur : elle s'arrête encore pour lui
not ok 4 - ARRÊT T4 …  elle est restée devant l'artillerie
                       120 !== 1200
```

⚠ **`T5`, `T6` et `T7` sont VERTS des deux côtés, et c'est ce qu'on leur
demande** : ils gardent ce que le lot ne change PAS — la garde aérienne, la garde
du tir, et le forçage de l'Écraseur.

---

## 6. Vingt et un tests sont tombés, aucun n'a été assoupli

**Onze mesures figées, réancrées en écrivant les deux nombres :**

| Test | avant | après |
|---|---|---|
| `arsenal T10` | 305 ticks | **335** |
| `assaut T7` figés | A 669 · B 608 `souche` · C 524 | **A 338 · B 408 `attaquants` · C 529** |
| `assaut T7` budgétés | A 429 / 772 · B 409 · C 305 / 24 796 | **A 380 / 0 · B 440 · C 335 / 24 640** |
| `cible T4` | 313 ticks, butin 8 992 · 2 997 | **193 ticks, 2 094 · 698** |
| `cible T5` | 4 raids au plafond de 900 | **aucun** |
| `combat T7 b` | attaquant figé à 2 000 | **2 990, toujours case 2** |
| `MODULES-D T4` | tick 120 | **110** |
| `MODULES-E T7` | tick 120 | **110** |
| `MODULES-F T14` | points aux niveaux 20/38/50 | recalculés, et **méthode changée** — voir ci-dessous |
| `repli T6` | 305 ticks, 24 796 · 8 265, 7 survivants | **335, 24 640 · 8 213, 6** |
| `roster T5` / `T6` | 174 ticks · A/B/C | **113** · A 380/0/0 · B 440 · C 335 |

**Six montages dont la PRÉMISSE a cessé d'être vraie, réparés en nommant
l'observable qui discrimine encore :**

- `MODULES-B T1` — le Bélier ne gèle plus à 2 000, il monte à 3 920. La garde
  figeait sa case ; elle mesure maintenant ce qu'elle DÉFENDAIT — que le Guetteur
  reste à portée aux deux bouts, sinon son silence viendrait de la distance et
  non du module.
- `MODULES-C T4` — le porteur double l'allié au tick 5 et la Casemate change de
  cible. La garde de non-vacuité ne compte plus que les ticks où le tir arrive
  vraiment sur l'allié ; l'invariant du lot (« le réservoir ne remonte jamais »)
  reste asserté sur les **trente**.
- `POI T18` — les deux raids durent maintenant **441 ticks tous les deux**, et
  c'est le BUTIN qui diffère (1 088 → 1 230). Le commentaire disait « asserter
  sur le seul butin rendrait ce test vert sur un `executerRaid` qui n'emporte
  rien » : c'était vrai, ça ne l'est plus, et il est réécrit.
- `raid.test.js` « deux raids » — même chose : 441 des deux côtés, mais la
  défense restante passe de 52 ‰ à 33 et les bâtiments de 86 à 69. Le test
  asserte enfin ce qu'il PRÉTENDAIT mesurer.
- `RAID-A T8` — une Meute seule de niveau 1 griffe désormais un bâtiment du camp
  (verdict `victoire`), donc la défaite totale n'y est plus atteignable. La cible
  passe au **camp → avant-poste**, où elle tombe avant d'arriver.
- `JOURNAL T8` — une pièce **écrasée** perd tous ses PV hors de
  `appliquerDegats`, donc sans impact. Le cas n'était pas atteignable tant que
  les attaquants s'arrêtaient devant la défense. L'exception est nommée, et le
  montage doit vraiment écraser quelqu'un — deux pièces, asserté.

**Deux témoins, surchargés et jamais recapturés** — voir §7.

**Deux gardes de `documentation.test.js`**, qui faisaient leur travail : le
compte de tests et la liste de `test/`.

### `MODULES-F T14` change de MÉTHODE, et c'était une faute à corriger

Il opposait les points d'aujourd'hui à des nombres relevés sur `origin/main`
**avant le lot MODULES-F** : deux codes, deux règles, et l'écart cessait de dire
ce qu'il prétendait dès qu'une seconde règle bougeait. Il compare désormais le
canal de l'Ouvrage **armé** au canal **vide** dans la MÊME exécution — ce que
MODULES-F voulait dire, et ce qui reste vrai d'un lot à l'autre.

⚠⚠ **ET LE SIGNE S'EST INVERSÉ AU NIVEAU 38.** MODULES-F relevait que les points
MONTAIENT quand le canal s'arme ; ils BAISSENT désormais, sur les trois graines.
Le bonus de 20 % ne compense plus le surcroît de résistance de la garnison, parce
que l'assaut arrive entamé et casse moins. **Mesuré, rapporté, non corrigé.**

| points | canal armé | canal vide |
|---|---|---|
| n38 g11 | 99 380 188 | 99 422 297 |
| n38 g22 | 132 090 028 | 132 090 189 |
| n38 g33 | 246 884 277 | 246 914 765 |

---

## 7. Les deux témoins sont surchargés, jamais rafraîchis

**`test/temoins-combat.js`** — les 200 combats capturés sur `origin/main` avant le
lot JOURNAL-DE-COMBAT. Le fichier porte en tête « elle ne se rafraîchit pas », et
il n'a pas été touché : `COMBATS_DEPLACES_PAR_ARRET` est ajouté à la suite et
nomme, **combat par combat et champ par champ**, ce que la règle déplace.

- **1 032 champs sur 1 600** sont surchargés, sur **181 combats**.
- **568 champs restent gardés contre la capture d'avant**, dont **19 combats
  entiers** et **198 des 200 causes de fin**.
- Le test compte les surcharges et **tombe si elles grandissent** :
  `assert.equal(surcharges, 1032)`.

**`test/temoins-bases-0.js`** — `DEPLACES_PAR_ARRET` nomme **61 couples
(phase, champ)**, tous **à partir de la phase 7**, qui est le premier raid. Les
**six premières phases sont identiques AU BIT** : construction, économie,
garnison, armée, carte, satellites. La règle ne touche qu'au combat.

⚠⚠ **ET AUCUN SCALAIRE NE BOUGE — 25 graines sur 25.** Gestes de construction,
gestes d'armement, **taille de la sauvegarde**, cases atteignables, déplacement,
nombre de bases attaquantes, nombre de cibles et cible retenue des deux raids :
identiques. Seules les empreintes des deux RAPPORTS changent — 25 sur 25 pour le
raid de proximité, 22 sur 25 pour celui de l'Ouvrage.

---

## 8. Coût, bornes, et ce qui n'a pas bougé

| poste | avant | après | écart |
|---|---|---|---|
| `dist/index.html` | 6 791 796 | **6 791 759** | **−37 octets** |
| `data:` | 289 | 289 | 0 |
| images | — | — | +0 |
| feuille | — | — | +0 |
| balisage | — | — | +0 |
| JavaScript | — | — | **−37** |

**Le lot REND 37 octets** : la règle est d'une ligne plus courte que celle qu'elle
remplace. Borne T10 **inchangée à 7 000 000**, marge **208 241 octets, 2,97 %**.

`SAVE_VERSION` **reste à 24** : pas un champ n'entre dans l'état, et la taille de
la sauvegarde est identique sur les vingt-cinq graines du témoin.

`python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot ne
touche ni `art/`, ni `tools/`. **Aucun module de `src/ui/` n'est modifié** — le
brief en faisait un signal de dérapage ; le diff porte sur `src/sim/combat.js`,
neuf fichiers de `test/`, `CLAUDE.md`, `package.json` et ce rapport.

---

## 9. Écarts au brief, et points en suspens

1. **Le brief se trompe sur le mécanisme de « sauf si ils empêchent d'avancer »**
   (§2 ci-dessus) : `structureForcee` ne couvre que les porteurs de l'Écraseur.
   Écart déclaré, lot poursuivi, et `ARRÊT T8` mesure les deux cas.
2. **`ARRÊT T9` ne peut pas être écrit comme le brief le demande** : il n'existe
   **aucune tourelle non bloquante**. Les trois tourelles et les trois artilleries
   portent `bloque: true` ; seules `ronce` et `herse` ne bloquent pas, et elles ne
   tirent jamais. Le test asserte ce fait de données, puis mesure le cas qui reste
   — la tourelle LATÉRALE, devant laquelle l'unité passe désormais.
3. **`AUDIT-REPARATION.md`, cité en §5 du brief, n'existe pas au dépôt** —
   vérifié par `grep` sur tout l'arbre. Référence sans cible, signalée.
4. **Le calibrage n'a pas été touché**, comme le brief l'exige : ni les PV des
   défenses, ni `TICKS_AVANT_REPLI`, ni `ECRASEUR_PCT_PAR_TICK`. Les mesures du §3
   disent où ça se déplace ; **l'arbitrage revient à Ethan.** Trois points s'y
   prêtent : le camp de niveau 30 perd 27 % de butin, le raid A de référence ne
   rapporte plus rien, et le signe du canal de l'Ouvrage s'inverse au niveau 38.

---

## 10. Annexe — les 162 montages

| montage | ticks | cause | détruites / engagées | replis | déf. ‰ | bât. ‰ | butin |
|---|---|---|---|---|---|---|---|
| `n5/infanterie/camp/1` | 361 → **416** | attaquants | 3/9 | 6 | 528 → **515** | 790 → **757** | 5225 → **6782** |
| `n5/infanterie/camp/2` | 349 → **409** | attaquants | 1/9 → **2/9** | 8 → **7** | 0 → **94** | 841 → **809** | 3570 → **4129** |
| `n5/infanterie/camp/3` | 356 → **391** | attaquants | 0/9 | 9 | 0 | 802 → **785** | 4718 → **5392** |
| `n5/infanterie/camp/7` | 546 → **367** | attaquants | 0/9 → **1/9** | 9 → **8** | 0 | 749 → **799** | 6225 → **5756** |
| `n5/infanterie/camp/11` | 345 → **366** | attaquants | 0/9 | 9 | 0 | 822 | 4973 → **5154** |
| `n5/infanterie/camp/42` | 553 → **471** | attaquants | 1/9 | 8 | 0 | 741 → **707** | 6045 → **7430** |
| `n5/infanterie/avantPoste/1` | 314 → **296** | attaquants | 4/9 | 5 | 405 → **524** | 876 → **881** | 14841 → **14016** |
| `n5/infanterie/avantPoste/2` | 319 → **345** | attaquants | 2/9 | 7 | 122 → **160** | 904 → **899** | 9234 → **9653** |
| `n5/infanterie/avantPoste/3` | 518 → **295** | attaquants | 2/9 → **5/9** | 7 → **4** | 0 → **376** | 896 | 11890 → **11882** |
| `n5/infanterie/avantPoste/7` | 355 → **359** | attaquants | 2/9 → **3/9** | 7 → **6** | 178 → **276** | 872 → **878** | 14293 → **13028** |
| `n5/infanterie/avantPoste/11` | 410 → **383** | attaquants | 0/9 → **1/9** | 9 → **8** | 0 | 861 → **813** | 14037 → **21202** |
| `n5/infanterie/avantPoste/42` | 396 → **459** | attaquants | 2/9 → **3/9** | 7 → **6** | 169 → **162** | 892 → **901** | 11037 → **9885** |
| `n5/infanterie/base/1` | 275 → **323** | attaquants | 4/9 | 5 | 387 → **459** | 903 → **906** | 3815 → **3757** |
| `n5/infanterie/base/2` | 275 → **258** | attaquants | 1/9 → **2/9** | 8 → **7** | 0 → **88** | 925 | 2736 → **2615** |
| `n5/infanterie/base/3` | 300 → **324** | attaquants | 0/9 → **5/9** | 9 → **4** | 0 → **345** | 898 → **904** | 3556 → **3421** |
| `n5/infanterie/base/7` | 275 → **289** | attaquants | 2/9 → **3/9** | 7 → **6** | 106 → **192** | 899 → **901** | 3257 → **3211** |
| `n5/infanterie/base/11` | 404 | attaquants | 0/9 → **2/9** | 9 → **7** | 0 → **92** | 861 → **898** | 5290 → **3838** |
| `n5/infanterie/base/42` | 275 → **300** | attaquants | 2/9 → **3/9** | 7 → **6** | 146 | 897 → **915** | 3417 → **2596** |
| `n5/blindeLourd/camp/1` | 361 → **416** | attaquants | 3/9 | 6 | 528 → **515** | 790 → **757** | 5225 → **6782** |
| `n5/blindeLourd/camp/2` | 349 → **409** | attaquants | 1/9 → **2/9** | 8 → **7** | 0 → **94** | 841 → **809** | 3570 → **4129** |
| `n5/blindeLourd/camp/3` | 356 → **391** | attaquants | 0/9 | 9 | 0 | 802 → **785** | 4718 → **5392** |
| `n5/blindeLourd/camp/7` | 546 → **367** | attaquants | 0/9 → **1/9** | 9 → **8** | 0 | 749 → **799** | 6225 → **5756** |
| `n5/blindeLourd/camp/11` | 345 → **366** | attaquants | 0/9 | 9 | 0 | 822 | 4973 → **5154** |
| `n5/blindeLourd/camp/42` | 553 → **471** | attaquants | 1/9 | 8 | 0 | 741 → **707** | 6045 → **7430** |
| `n5/blindeLourd/avantPoste/1` | 314 → **296** | attaquants | 4/9 | 5 | 405 → **524** | 876 → **881** | 14841 → **14016** |
| `n5/blindeLourd/avantPoste/2` | 319 → **345** | attaquants | 2/9 | 7 | 122 → **160** | 904 → **899** | 9234 → **9653** |
| `n5/blindeLourd/avantPoste/3` | 518 → **295** | attaquants | 2/9 → **5/9** | 7 → **4** | 0 → **376** | 896 | 11890 → **11882** |
| `n5/blindeLourd/avantPoste/7` | 355 → **359** | attaquants | 2/9 → **3/9** | 7 → **6** | 178 → **276** | 872 → **878** | 14293 → **13028** |
| `n5/blindeLourd/avantPoste/11` | 410 → **383** | attaquants | 0/9 → **1/9** | 9 → **8** | 0 | 861 → **813** | 14037 → **21202** |
| `n5/blindeLourd/avantPoste/42` | 396 → **459** | attaquants | 2/9 → **3/9** | 7 → **6** | 169 → **162** | 892 → **901** | 11037 → **9885** |
| `n5/blindeLourd/base/1` | 275 → **323** | attaquants | 4/9 | 5 | 387 → **459** | 903 → **906** | 3815 → **3757** |
| `n5/blindeLourd/base/2` | 275 → **258** | attaquants | 1/9 → **2/9** | 8 → **7** | 0 → **88** | 925 | 2736 → **2615** |
| `n5/blindeLourd/base/3` | 300 → **324** | attaquants | 0/9 → **5/9** | 9 → **4** | 0 → **345** | 898 → **904** | 3556 → **3421** |
| `n5/blindeLourd/base/7` | 275 → **289** | attaquants | 2/9 → **3/9** | 7 → **6** | 106 → **192** | 899 → **901** | 3257 → **3211** |
| `n5/blindeLourd/base/11` | 404 | attaquants | 0/9 → **2/9** | 9 → **7** | 0 → **92** | 861 → **898** | 5290 → **3838** |
| `n5/blindeLourd/base/42` | 275 → **300** | attaquants | 2/9 → **3/9** | 7 → **6** | 146 | 897 → **915** | 3417 → **2596** |
| `n5/mixte/camp/1` | 361 → **416** | attaquants | 3/9 | 6 | 528 → **515** | 790 → **757** | 5225 → **6782** |
| `n5/mixte/camp/2` | 349 → **409** | attaquants | 1/9 → **2/9** | 8 → **7** | 0 → **94** | 841 → **809** | 3570 → **4129** |
| `n5/mixte/camp/3` | 356 → **391** | attaquants | 0/9 | 9 | 0 | 802 → **785** | 4718 → **5392** |
| `n5/mixte/camp/7` | 546 → **367** | attaquants | 0/9 → **1/9** | 9 → **8** | 0 | 749 → **799** | 6225 → **5756** |
| `n5/mixte/camp/11` | 345 → **366** | attaquants | 0/9 | 9 | 0 | 822 | 4973 → **5154** |
| `n5/mixte/camp/42` | 553 → **471** | attaquants | 1/9 | 8 | 0 | 741 → **707** | 6045 → **7430** |
| `n5/mixte/avantPoste/1` | 314 → **296** | attaquants | 4/9 | 5 | 405 → **524** | 876 → **881** | 14841 → **14016** |
| `n5/mixte/avantPoste/2` | 319 → **345** | attaquants | 2/9 | 7 | 122 → **160** | 904 → **899** | 9234 → **9653** |
| `n5/mixte/avantPoste/3` | 518 → **295** | attaquants | 2/9 → **5/9** | 7 → **4** | 0 → **376** | 896 | 11890 → **11882** |
| `n5/mixte/avantPoste/7` | 355 → **359** | attaquants | 2/9 → **3/9** | 7 → **6** | 178 → **276** | 872 → **878** | 14293 → **13028** |
| `n5/mixte/avantPoste/11` | 410 → **383** | attaquants | 0/9 → **1/9** | 9 → **8** | 0 | 861 → **813** | 14037 → **21202** |
| `n5/mixte/avantPoste/42` | 396 → **459** | attaquants | 2/9 → **3/9** | 7 → **6** | 169 → **162** | 892 → **901** | 11037 → **9885** |
| `n5/mixte/base/1` | 275 → **323** | attaquants | 4/9 | 5 | 387 → **459** | 903 → **906** | 3815 → **3757** |
| `n5/mixte/base/2` | 275 → **258** | attaquants | 1/9 → **2/9** | 8 → **7** | 0 → **88** | 925 | 2736 → **2615** |
| `n5/mixte/base/3` | 300 → **324** | attaquants | 0/9 → **5/9** | 9 → **4** | 0 → **345** | 898 → **904** | 3556 → **3421** |
| `n5/mixte/base/7` | 275 → **289** | attaquants | 2/9 → **3/9** | 7 → **6** | 106 → **192** | 899 → **901** | 3257 → **3211** |
| `n5/mixte/base/11` | 404 | attaquants | 0/9 → **2/9** | 9 → **7** | 0 → **92** | 861 → **898** | 5290 → **3838** |
| `n5/mixte/base/42` | 275 → **300** | attaquants | 2/9 → **3/9** | 7 → **6** | 146 | 897 → **915** | 3417 → **2596** |
| `n15/infanterie/camp/1` | 305 → **335** | attaquants | 11/18 → **12/18** | 7 → **6** | 345 → **414** | 914 → **917** | 33061 → **32853** |
| `n15/infanterie/camp/2` | 317 → **372** | attaquants | 11/17 | 6 | 266 → **336** | 921 → **957** | 30526 → **21817** |
| `n15/infanterie/camp/3` | 268 → **267** | attaquants | 16/17 → **17/17** | 1 → **0** | 454 → **469** | 998 → **996** | 400 → **1806** |
| `n15/infanterie/camp/7` | 329 → **332** | attaquants | 9/16 → **11/16** | 7 → **5** | 509 → **586** | 957 → **966** | 12110 → **9634** |
| `n15/infanterie/camp/11` | 454 → **426** | attaquants | 13/18 → **14/18** | 5 → **4** | 180 → **244** | 843 → **831** | 69972 → **73281** |
| `n15/infanterie/camp/42` | 287 → **264** | attaquants | 14/16 → **16/16** | 2 → **0** | 377 → **476** | 975 → **959** | 14745 → **24296** |
| `n15/infanterie/avantPoste/1` | 429 → **380** | attaquants | 15/18 → **18/18** | 3 → **0** | 256 → **319** | 1000 | 1029 → **0** |
| `n15/infanterie/avantPoste/2` | 240 → **228** | attaquants | 17/17 | 0 | 601 → **637** | 1000 | 0 |
| `n15/infanterie/avantPoste/3` | 219 → **208** | attaquants | 17/17 | 0 | 622 → **678** | 1000 | 0 |
| `n15/infanterie/avantPoste/7` | 280 → **209** | attaquants | 16/16 | 0 | 543 → **665** | 1000 | 0 |
| `n15/infanterie/avantPoste/11` | 245 → **235** | attaquants | 17/18 → **18/18** | 1 → **0** | 413 → **531** | 1000 | 0 |
| `n15/infanterie/avantPoste/42` | 247 → **210** | attaquants | 16/16 | 0 | 455 → **556** | 1000 | 0 |
| `n15/infanterie/base/1` | 273 → **257** | attaquants | 17/18 → **18/18** | 1 → **0** | 459 → **482** | 1000 | 0 |
| `n15/infanterie/base/2` | 247 → **332** | attaquants | 17/17 | 0 | 510 → **547** | 1000 | 0 |
| `n15/infanterie/base/3` | 296 → **301** | attaquants | 16/17 → **17/17** | 1 → **0** | 389 → **473** | 1000 | 0 |
| `n15/infanterie/base/7` | 216 → **201** | attaquants | 15/16 → **16/16** | 1 → **0** | 436 → **515** | 1000 | 0 |
| `n15/infanterie/base/11` | 861 → **236** | attaquants | 16/18 → **18/18** | 2 → **0** | 320 → **473** | 1000 | 156 → **0** |
| `n15/infanterie/base/42` | 239 → **245** | attaquants | 16/16 | 0 | 403 → **522** | 1000 | 0 |
| `n15/blindeLourd/camp/1` | 409 → **440** | attaquants | 1/9 → **3/9** | 8 → **6** | 0 | 892 → **887** | 49628 → **54674** |
| `n15/blindeLourd/camp/2` | 900 → **500** | duree → **attaquants** | 2/9 → **5/9** | 6 → **4** | 25 → **221** | 895 → **892** | 44094 → **46372** |
| `n15/blindeLourd/camp/3` | 414 → **459** | attaquants | 2/9 | 7 | 0 | 918 → **917** | 30536 → **30118** |
| `n15/blindeLourd/camp/7` | 553 → **259** | attaquants | 5/9 | 4 | 65 → **302** | 907 → **910** | 34570 → **32764** |
| `n15/blindeLourd/camp/11` | 426 → **366** | attaquants | 5/9 | 4 | 216 → **206** | 930 | 28036 → **28325** |
| `n15/blindeLourd/camp/42` | 225 → **286** | attaquants | 5/9 | 4 | 284 → **268** | 935 → **930** | 27285 → **29808** |
| `n15/blindeLourd/avantPoste/1` | 313 → **193** | attaquants | 9/9 | 0 | 441 → **497** | 989 → **997** | 11989 → **2792** |
| `n15/blindeLourd/avantPoste/2` | 401 → **152** | attaquants | 8/9 → **9/9** | 1 → **0** | 602 → **683** | 998 → **1000** | 1890 → **0** |
| `n15/blindeLourd/avantPoste/3` | 262 → **234** | attaquants | 9/9 | 0 | 445 → **456** | 998 → **1000** | 2290 → **0** |
| `n15/blindeLourd/avantPoste/7` | 249 → **256** | attaquants | 9/9 | 0 | 468 → **476** | 987 → **988** | 29210 → **27966** |
| `n15/blindeLourd/avantPoste/11` | 260 → **221** | attaquants | 9/9 | 0 | 463 → **549** | 993 → **994** | 6998 → **6657** |
| `n15/blindeLourd/avantPoste/42` | 222 → **254** | attaquants | 9/9 | 0 | 419 → **386** | 990 → **995** | 10924 → **5570** |
| `n15/blindeLourd/base/1` | 679 → **308** | attaquants | 7/9 → **8/9** | 2 → **1** | 387 → **543** | 987 → **989** | 5219 → **4008** |
| `n15/blindeLourd/base/2` | 269 → **259** | attaquants | 9/9 | 0 | 554 → **608** | 998 → **993** | 1325 → **5348** |
| `n15/blindeLourd/base/3` | 528 → **303** | attaquants | 9/9 | 0 | 291 → **385** | 998 → **1000** | 848 → **0** |
| `n15/blindeLourd/base/7` | 326 → **241** | attaquants | 9/9 | 0 | 299 → **401** | 997 | 1096 → **1120** |
| `n15/blindeLourd/base/11` | 900 → **289** | duree → **attaquants** | 8/9 → **9/9** | 0 | 493 → **447** | 1000 | 163 → **0** |
| `n15/blindeLourd/base/42` | 253 → **243** | attaquants | 9/9 | 0 | 275 → **241** | 997 → **998** | 896 → **730** |
| `n15/mixte/camp/1` | 390 → **350** | attaquants | 6/11 | 3 | 519 → **557** | 894 → **895** | 52620 → **52385** |
| `n15/mixte/camp/2` | 501 → **496** | attaquants | 6/11 | 3 | 454 → **516** | 753 → **775** | 110873 → **102213** |
| `n15/mixte/camp/3` | 330 → **348** | attaquants | 6/11 → **8/11** | 5 → **3** | 450 → **475** | 976 → **969** | 9106 → **12881** |
| `n15/mixte/camp/7` | 289 → **241** | attaquants | 8/10 → **10/10** | 2 → **0** | 610 → **637** | 965 → **989** | 14585 → **4564** |
| `n15/mixte/camp/11` | 900 → **359** | duree → **attaquants** | 7/11 → **9/11** | 2 → **1** | 349 → **465** | 951 → **960** | 21764 → **20125** |
| `n15/mixte/camp/42` | 174 → **173** | attaquants | 7/10 → **8/10** | 1 → **0** | 666 → **671** | 981 → **984** | 8873 → **6862** |
| `n15/mixte/avantPoste/1` | 242 → **245** | attaquants | 9/11 | 0 | 653 → **730** | 990 | 20324 |
| `n15/mixte/avantPoste/2` | 384 → **710** | attaquants | 9/11 | 1 | 535 → **708** | 992 → **989** | 11961 → **15137** |
| `n15/mixte/avantPoste/3` | 332 → **306** | attaquants | 10/11 → **11/11** | 1 → **0** | 670 → **691** | 999 | 2296 → **1244** |
| `n15/mixte/avantPoste/7` | 191 | attaquants | 8/10 | 0 | 785 → **789** | 993 | 14468 |
| `n15/mixte/avantPoste/11` | 232 → **230** | attaquants | 11/11 | 0 | 600 → **696** | 1000 | 0 |
| `n15/mixte/avantPoste/42` | 196 → **174** | attaquants | 8/10 → **9/10** | 1 → **0** | 638 → **642** | 989 → **994** | 21705 → **11973** |
| `n15/mixte/base/1` | 605 → **347** | attaquants | 8/11 → **9/11** | 1 → **0** | 531 → **596** | 982 → **984** | 10505 → **9281** |
| `n15/mixte/base/2` | 265 → **219** | attaquants | 11/11 | 0 | 580 → **742** | 1000 → **999** | 0 → **230** |
| `n15/mixte/base/3` | 604 → **277** | attaquants | 9/11 → **11/11** | 2 → **0** | 399 → **681** | 995 → **999** | 2980 → **308** |
| `n15/mixte/base/7` | 350 → **340** | attaquants | 9/10 | 0 | 520 → **613** | 998 → **997** | 1814 → **2078** |
| `n15/mixte/base/11` | 900 → **457** | duree → **attaquants** | 10/11 → **11/11** | 0 | 484 → **557** | 1000 | 355 → **0** |
| `n15/mixte/base/42` | 227 → **164** | attaquants | 10/10 | 0 | 617 → **739** | 1000 | 22 → **18** |
| `n30/infanterie/camp/1` | 288 → **230** | attaquants | 20/20 | 0 | 686 → **736** | 1000 | 0 |
| `n30/infanterie/camp/2` | 253 → **224** | attaquants | 21/22 → **22/22** | 1 → **0** | 467 → **548** | 1000 | 0 |
| `n30/infanterie/camp/3` | 209 → **208** | attaquants | 20/20 | 0 | 858 → **859** | 1000 | 0 |
| `n30/infanterie/camp/7` | 185 → **182** | attaquants | 17/17 | 0 | 804 → **808** | 1000 | 0 |
| `n30/infanterie/camp/11` | 522 → **506** | attaquants | 17/19 → **16/19** | 2 → **3** | 466 → **491** | 889 → **893** | 2878082 → **2657226** |
| `n30/infanterie/camp/42` | 221 → **209** | attaquants | 20/21 → **21/21** | 1 → **0** | 650 → **699** | 1000 | 0 |
| `n30/infanterie/avantPoste/1` | 257 → **234** | attaquants | 20/20 | 0 | 703 → **744** | 1000 | 0 |
| `n30/infanterie/avantPoste/2` | 278 → **220** | attaquants | 22/22 | 0 | 505 → **654** | 1000 | 0 |
| `n30/infanterie/avantPoste/3` | 182 → **175** | attaquants | 20/20 | 0 | 881 → **899** | 1000 | 0 |
| `n30/infanterie/avantPoste/7` | 184 → **185** | attaquants | 17/17 | 0 | 820 → **824** | 1000 | 0 |
| `n30/infanterie/avantPoste/11` | 189 → **172** | attaquants | 19/19 | 0 | 750 → **762** | 1000 | 0 |
| `n30/infanterie/avantPoste/42` | 221 → **204** | attaquants | 20/21 → **21/21** | 1 → **0** | 731 → **812** | 1000 | 0 |
| `n30/infanterie/base/1` | 186 → **178** | attaquants | 19/20 → **20/20** | 1 → **0** | 721 → **799** | 1000 | 0 |
| `n30/infanterie/base/2` | 282 → **198** | attaquants | 21/22 → **22/22** | 1 → **0** | 518 → **657** | 1000 | 0 |
| `n30/infanterie/base/3` | 171 → **169** | attaquants | 20/20 | 0 | 851 → **866** | 1000 | 0 |
| `n30/infanterie/base/7` | 167 → **165** | attaquants | 17/17 | 0 | 837 → **839** | 1000 | 0 |
| `n30/infanterie/base/11` | 287 → **233** | attaquants | 19/19 | 0 | 772 → **810** | 1000 | 0 |
| `n30/infanterie/base/42` | 201 → **195** | attaquants | 21/21 | 0 | 845 → **838** | 1000 | 0 |
| `n30/blindeLourd/camp/1` | 469 → **456** | attaquants | 9/17 | 8 | 78 → **138** | 456 → **241** | 18245868 → **22583376** |
| `n30/blindeLourd/camp/2` | 486 → **441** | attaquants | 5/15 → **8/15** | 10 → **7** | 3 → **112** | 395 → **478** | 22388301 → **20228945** |
| `n30/blindeLourd/camp/3` | 148 → **143** | attaquants | 17/17 | 0 | 724 | 1000 | 0 |
| `n30/blindeLourd/camp/7` | 485 → **457** | attaquants | 10/17 | 7 | 81 → **192** | 522 → **527** | 17358561 → **16844589** |
| `n30/blindeLourd/camp/11` | 452 → **249** | attaquants | 10/17 → **17/17** | 7 → **0** | 244 → **471** | 653 → **936** | 13553702 → **1813581** |
| `n30/blindeLourd/camp/42` | 229 → **256** | attaquants | 14/17 → **16/17** | 3 → **1** | 395 → **396** | 988 → **948** | 269733 → **1178510** |
| `n30/blindeLourd/avantPoste/1` | 167 → **163** | attaquants | 17/17 | 0 | 520 → **467** | 1000 | 0 |
| `n30/blindeLourd/avantPoste/2` | 177 → **216** | attaquants | 15/15 | 0 | 540 → **402** | 1000 → **999** | 0 → **79994** |
| `n30/blindeLourd/avantPoste/3` | 122 | attaquants | 17/17 | 0 | 797 → **793** | 1000 | 0 |
| `n30/blindeLourd/avantPoste/7` | 191 → **140** | attaquants | 15/17 → **17/17** | 2 → **0** | 629 → **627** | 1000 | 0 |
| `n30/blindeLourd/avantPoste/11` | 213 → **278** | attaquants | 15/17 → **16/17** | 2 → **1** | 541 → **605** | 1000 → **981** | 0 → **1955082** |
| `n30/blindeLourd/avantPoste/42` | 337 → **124** | attaquants | 16/17 → **17/17** | 1 → **0** | 481 → **574** | 1000 | 0 |
| `n30/blindeLourd/base/1` | 555 → **157** | attaquants | 15/17 → **17/17** | 2 → **0** | 244 → **408** | 997 → **1000** | 97448 → **0** |
| `n30/blindeLourd/base/2` | 193 → **176** | attaquants | 15/15 | 0 | 538 → **500** | 1000 | 0 |
| `n30/blindeLourd/base/3` | 123 → **121** | attaquants | 17/17 | 0 | 803 → **805** | 1000 | 0 |
| `n30/blindeLourd/base/7` | 205 → **163** | attaquants | 16/17 → **17/17** | 1 → **0** | 570 → **537** | 1000 | 0 |
| `n30/blindeLourd/base/11` | 153 → **110** | attaquants | 17/17 | 0 | 721 → **769** | 1000 | 0 |
| `n30/blindeLourd/base/42` | 167 → **140** | attaquants | 17/17 | 0 | 701 → **607** | 1000 | 0 |
| `n30/mixte/camp/1` | 316 → **172** | attaquants | 18/18 | 0 | 511 → **619** | 999 → **1000** | 14469 → **5145** |
| `n30/mixte/camp/2` | 297 → **271** | attaquants | 16/17 | 1 | 321 → **313** | 936 → **918** | 1456932 → **1867594** |
| `n30/mixte/camp/3` | 168 → **152** | attaquants | 18/18 | 0 | 683 → **782** | 1000 | 0 |
| `n30/mixte/camp/7` | 515 → **236** | souche → **attaquants** | 9/17 → **12/17** | 3 → **2** | 86 → **377** | 230 → **765** | 29089642 → **8724476** |
| `n30/mixte/camp/11` | 400 → **234** | attaquants | 15/17 → **16/17** | 2 → **1** | 360 → **575** | 960 → **931** | 2023120 → **2432902** |
| `n30/mixte/camp/42` | 219 → **204** | attaquants | 19/19 | 0 | 524 → **604** | 1000 | 0 |
| `n30/mixte/avantPoste/1` | 166 → **150** | attaquants | 18/18 | 0 | 694 → **714** | 1000 | 0 |
| `n30/mixte/avantPoste/2` | 268 → **180** | attaquants | 17/17 | 0 | 484 → **486** | 1000 | 0 |
| `n30/mixte/avantPoste/3` | 132 | attaquants | 18/18 | 0 | 857 → **867** | 1000 | 0 |
| `n30/mixte/avantPoste/7` | 160 → **148** | attaquants | 17/17 | 0 | 678 → **767** | 1000 | 0 |
| `n30/mixte/avantPoste/11` | 209 → **131** | attaquants | 15/17 → **17/17** | 2 → **0** | 584 → **735** | 1000 | 0 |
| `n30/mixte/avantPoste/42` | 185 → **187** | attaquants | 18/19 → **19/19** | 1 → **0** | 724 → **698** | 1000 → **998** | 0 → **245806** |
| `n30/mixte/base/1` | 161 → **141** | attaquants | 18/18 | 0 | 722 → **702** | 1000 | 0 |
| `n30/mixte/base/2` | 254 → **177** | attaquants | 17/17 | 0 | 410 → **437** | 997 | 93376 → **120564** |
| `n30/mixte/base/3` | 122 → **120** | attaquants | 18/18 | 0 | 810 → **811** | 1000 | 0 |
| `n30/mixte/base/7` | 143 → **136** | attaquants | 17/17 | 0 | 809 → **790** | 1000 | 0 |
| `n30/mixte/base/11` | 186 → **134** | attaquants | 17/17 | 0 | 655 → **725** | 1000 | 0 |
| `n30/mixte/base/42` | 195 | attaquants | 19/19 | 0 | 835 → **837** | 1000 | 0 |