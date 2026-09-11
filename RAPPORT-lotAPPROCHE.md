# RAPPORT — lot APPROCHE

*L'entrée réelle des vagues par le bas, et la fin de la rampe décorative.*
Exécuté le **11/09/2026**, branche `claude/lot-approche`.

Ethan, 11/09 : « qu'elles apparaissent en dessous hors écran, du coup en rangée
zéro, trois rangées avant la défense en gros, et elles arrivent normalement. Et
elles peuvent engager le combat dès qu'elles sont visibles. » Et le défaut :
« elles arrivent très vite, puis elles arrivent dans le tas, comme si elles
avaient un boost de vitesse. »

---

## 1. Base de départ

Mesurée **avant d'écrire une ligne**, sur l'arbre de travail à `main` = `dff2689`
(le commit de fusion du lot TERRITOIRE-ET-ÉCHELLE, vérifié au `git fetch`) :

| Grandeur | Valeur |
|---|---|
| Tests déclarés (garde de `documentation.test.js`) | **1 575** |
| Verdict mesuré | 1 574 pass · 0 fail · 1 skipped (`LIMITE T8`) |
| `dist/index.html` | **9 367 456 octets**, 0 référence externe |
| Version · build | **0.99.45 · build 147** |
| `SAVE_VERSION` | 32 |

⚠ **La base annoncée par le brief était exacte**, ce qui n'arrive pas toujours :
les cinq faits dont le lot dépend — `RANGEE_APPARITION` égale à
`GRILLE.bandes.deploiement.derniere`, les deux validations de pose, le
`Math.min(brut, bas)` de `yDeRangeeMilli`, les 282 lignes de
`src/render/arrivee.js`, `SAVE_VERSION` à 32 — étaient tous présents et uniques.

---

## 2. Version et build produits

**0.99.46 · build 148**, le suivant disponible. `package.json` porte les deux en
CHAÎNES (`"version"` et `"config.build"`), comme `android/app/build.gradle.kts`
les lit.

---

## 3. Le patch, section par section

### §3.1 — `src/sim/grille.js` : la voie d'approche, pure et exportée

Deux ajouts, chacun avec sa prose :

- `RANGEE_APPROCHE = PREMIERE_RANGEE - 1`, soit **0** ;
- `estEnApproche(rangeeMilli)` — `rangeeMilli < milliDepuisCase(PREMIERE_RANGEE)`.

⚠ **`estDansLaGrille` N'A PAS ÉTÉ ÉLARGIE**, et c'est délibéré : elle est lue par
`render/portee.js` — qui cerclerait une case qui n'existe pas — et par
`caseDepuisPixels`, qui rendrait un toucher hors grille. La voie d'approche est
une exception de POSE, pas une extension de la grille.

### §3.2 — `src/sim/combat.js` : l'apparition, et les deux validations

- `RANGEE_APPARITION` vaut désormais `RANGEE_APPROCHE`. Sa prose est réécrite et
  porte la mesure du « boost » (voir §7 ci-dessous).
- `posePermise(camp, rangee, colonne)` et `bornesDePose(camp)` entrent juste
  avant `ajouterEntite`. La rangée d'approche n'est ouverte qu'à
  `camp === 'attaque'` ; pour tout le reste, `posePermise` délègue à
  `estDansLaGrille` sans changer un caractère.
- `ajouterEntite` et la validation de vague de `creerCombat` passent par elles.
  Les deux messages de refus nomment la bonne fourchette selon le camp.

### §3.3 — le verrou de combat, dans `ciblage` et nulle part ailleurs

Deux lignes, aux deux bouts de la même boucle :

- en tête, `if (estEnApproche(e.rangeeMilli)) { e.cibleIndice = null; continue; }` ;
- dans la boucle des candidats, `if (estEnApproche(c.rangeeMilli)) continue;`.

⚠ **`estActive` n'est PAS touchée.** Elle est lue par `construireOccupation`,
`ciblage`, `tir`, `deplacement`, `appliquerDegats` et `conditionsDeFin` :
l'approche y ferait d'un coup trois choses qu'on ne veut pas — l'unité
n'avancerait plus, elle ne bloquerait plus sa case (donc plus de file hors écran,
et deux unités superposées), et un raid où il ne resterait que des approchantes
se terminerait « attaquants éliminés ». Une unité en approche **avance, bloque et
compte** ; elle ne fait que ne pas tirer, et n'être pas tirée.

### §3.4 — le gel du repli

Dans `avancer`, le `else` qui incrémente `ticksInutiles` devient
`} else if (!estEnApproche(e.rangeeMilli)) {`. Le compteur est **laissé tel
quel** — ni remis à zéro, ni incrémenté. Mesures en §6.

### §3.5 — `src/render/projection.js`

`yDeRangeeMilli` perd `Math.min(brut, bas)` et garde `Math.max(brut, haut)`. La
prose dit les deux raisons : la borne basse collait toute rangée sous la 1 sur la
rangée 1, et la borne haute reste parce que rien ne se dessine au-dessus du champ.

### §3.6 — la suppression de `src/render/arrivee.js`

- **Le fichier sort** — 282 lignes.
- `OPACITE_PLEINE` déménage dans `src/render/scene.js`, chez son seul lecteur.
- `listeAffichage` perd son huitième paramètre `arrivees`, la fonction
  `arriveeDe` et le décalage de `yDe`. `MILLI_PAR_CASE` n'y a plus d'emploi et
  sort de l'import.
- `src/ui/raid.js` perd l'import, l'état `arrivees` de sa fermeture, l'appel à
  `noterLesArrivees` et la remise à zéro de `ouvrirSurLaCible`.

### §3.7 — `CLAUDE.md`

§0 gagne son bloc daté « après le lot APPROCHE » ; l'ancien passe en
« Auparavant ». §2 : `src/render/` passe de 16 à 15 fichiers et perd
`arrivee.js` ; `test/` passe de 68 à 69 et gagne `approche`. La ligne de révision
passe à 0.99.46 · build 148.

---

## 4. Les deux cents témoins

### 4.1 — La preuve d'invariance, D'ABORD

Mesurée avec l'ancien point d'apparition **écrit explicitement** dans les
montages, avant toute recapture :

| Suite | Verdict |
|---|---|
| `test/journal.test.js` | **11 pass / 0 fail** — 0 écart |
| `test/bases.test.js` | **30 pass / 0 fail** — 0 écart |

Sans l'injection : exactement **trois rouges**, les trois `BASES-0 T1`, plus les
deux `JOURNAL T1`. Le moteur n'a donc rien changé d'autre que le point d'entrée.

⚠⚠ **ET CETTE PREUVE EST DEVENUE PERMANENTE, PLUTÔT QUE JOUÉE UNE FOIS.**
`montagesTemoins` de `journal.test.js` prend désormais une rangée ;
`JOURNAL T1 bis` lui passe `DEPART_AVANT_APPROCHE`, dérivé de `GRILLE.bandes` et
jamais écrit `2`. Il rejoue donc à **chaque `npm test`** les empreintes d'avant
PAQUETS sous les cinq couches d'alors et rend **0 écart, 1 331 champs surchargés,
269 gardés** — exactement le compte d'avant le lot. **Si ce test tombe un jour,
la recapture ci-dessous cesse d'être légitime.**

### 4.2 — La recapture de `TEMOINS_COMBAT`

Mesuré contre la table du lot MUR, **couche `COMBATS_DEPLACES_PAR_MUR`
appliquée** :

| Grandeur | Valeur |
|---|---|
| Champs comparés | 1 600 |
| **Champs déplacés** | **1 132** |
| Champs identiques | 468 |
| Combats touchés | **200 sur 200** |
| Combats entièrement intacts | **0** |
| Ticks de fin déplacés | 199 sur 200 |
| Causes de fin déplacées | 8 sur 200 |

Une sixième couche aurait couvert **71 %** de la table : il n'y aurait plus rien
à adosser, c'est la situation du lot PAQUETS et la recapture est la seule
procédure honnête. Le motif est écrit **dans `test/temoins-combat.js`**, avec la
preuve qui l'autorise.

⚠ `TEMOINS_COMBAT_AVANT_PAQUETS` et les six couches `COMBATS_DEPLACES_PAR_*` ne
sont pas touchées. ⚠ `COMBATS_DEPLACES_PAR_MUR` a perdu sa table de base et n'a
plus de lecteur : elle est **gardée sans être lue**, et un pavé le dit à côté
d'elle plutôt que de la retirer en silence.

### 4.3 — Le témoin de BASES-0 : une vingtième couche, pas une recapture

`DEPLACES_PAR_APPROCHE`, `EMPREINTES_PAR_GRAINE_APPROCHE`,
`RAPPORTS_PROCHE_APPROCHE` et `RAPPORTS_OUVRAGE_APPROCHE` entrent dans
`test/temoins-bases-0.js`.

| Grandeur | Valeur |
|---|---|
| Couples déplacés | **35 sur 350** |
| Phases touchées | 8 — `p07` à `p14` |
| **Phases identiques AU BIT** | **les six premières** |
| Graines déplacées | 25 sur 25 |
| Rapports de proximité déplacés | 25 sur 25 |
| Rapports de l'Ouvrage déplacés | 25 sur 25 |
| **Scalaires déplacés** | **AUCUN** |

⚠ Aucun scalaire ne bouge : ni les gestes de construction, ni ceux d'armement, ni
la taille de la sauvegarde, ni les cases atteignables, ni le déplacement, ni le
nombre de bases attaquantes, ni le nombre de cibles, ni la cible retenue. C'est
cette moitié-là qui dit que le lot ne touche ni la carte, ni l'économie, ni la
pose.

⚠⚠ **ET LA COUCHE DÉPLACE LES DEUX RAIDS SUR LES VINGT-CINQ GRAINES, LÀ OÙ MUR
N'EN DÉPLAÇAIT QUE 4 SUR 25 CÔTÉ OUVRAGE.** C'est l'attribution du lot : MUR
touchait ce qu'un camp a de murs, que la base du JOUEUR n'a pas ; ici le
changement porte sur l'ENTRÉE d'une vague, et les deux camps entrent par la même
porte.

---

## 5. Les deux tests

`test/approche.test.js` entre, avec deux tests et rien d'autre.

### APPROCHE T1 — le verrou de `ciblage`

**Montage** : une Faucheuse (artillerie, portée 5,5 / mini 3,5, `cible:
infanterie`) en rangée 5 colonne 4 ; une Meute en vague 1 colonne 4, donc posée
en rangée 0 par le défaut neuf ; une Gangue en rangée 15 colonne 9.

**Assertions préalables, mesurées sur l'entité montée** :
`porteeMiniCarree ≤ distanceCarreeMilli(Faucheuse, Meute) ≤ porteeCarree`, la
Meute bien en rangée 0, et la Faucheuse capable de blesser l'infanterie. Sans
elles, un futur ajustement de portée rendrait le test vert sans plus rien garder.

**Ce qui est asserté** : au tick 1 la Meute est intacte et la Faucheuse n'a pas de
cible ; au tick d'entrée — **demandé au moteur, pas écrit** — elle est encore
intacte ; au tick suivant elle encaisse.

**Verdict : PASS.**

**La falsification, mesurée par exécution** — garde de candidat retirée dans
`ciblage`, arbre par ailleurs identique :

```
not ok 1 - APPROCHE T1
  error: 690000 !== 700000
```

La Meute perd **10 000 milli-PV dès le tick 1**, c'est-à-dire un tir de la
Faucheuse dans la voie d'approche. Le KO passe à PASS avec la garde : c'est la
meilleure preuve de correctif qui existe, et elle est jouée, pas déduite.

⚠⚠ **LA MOITIÉ SYMÉTRIQUE DU VERROU EST INERTE AUJOURD'HUI, ET ELLE SE
DÉCLARE.** « Celui qui approche ne vise personne » ne peut mordre sur aucun
montage d'aujourd'hui : un attaquant en rangée 0 ne peut atteindre que la bande
de défense, dont la première rangée est la **troisième**, et **la plus longue
portée du roster vaut 2,5** — mesuré sur `UNITES`. `creerCombat` refuse d'ailleurs
un défenseur hors de la bande 3–10, donc le montage est impossible à construire.
La ligne est écrite quand même — c'est l'énoncé symétrique de la règle — et
`APPROCHE T1` garde sa **PRÉMISSE** plutôt que son effet : le jour où une unité
portera à trois cases, l'assertion tombera et obligera à remesurer. *Un test qui
ne peut tomber sur aucun état d'aujourd'hui se déclare, il ne se compte pas.*

### APPROCHE T2 — la borne basse de `yDeRangeeMilli`

**Montage** : la projection RÉELLE du déroulé —
`calculerProjection(1159, 1311, MUR_CASES, { lignesVisibles: casesDeLaBande(null, MUR_CASES) })`
— et un combat à deux attaquants, l'un en rangée 0, l'autre en rangée 1 par
surcharge de `rangee`. **Tous les nombres sont dérivés de la projection** : ni 70
ni 1303 ne sont écrits.

**Ce qui est asserté** : le `y` du sprite en rangée 0 est au moins
`yDeRangee(projection, 1) + tailleCase` ; le `y` du sprite en rangée 1 vaut
exactement `yDeRangeeMilli(projection, 1000)` ; les deux DIFFÈRENT, d'exactement
une case.

**Verdict : PASS.**

**La falsification** — `Math.min(brut, bas)` remis :

```
not ok 2 - APPROCHE T2
  error: 'la Meute en rangée 0 se dessine à 1233, au-dessus du bas de grille 1303'
```

Les deux `y` redeviennent **égaux** : soixante-dix pixels sur soixante-dix de
l'unité en rangée 0 sont dans le champ. C'est très exactement le défaut que ce
lot ferme.

### La troisième falsification

Le **gel du repli** du §3.4 retiré : `JOURNAL T1` tombe. Le gel est donc gardé par
les deux cents témoins, pas par une assertion écrite pour lui.

---

## 6. La mesure du §3.4

Sur les **deux cents combats témoins**, joués jusqu'à leur terme :

| Grandeur | Avec le gel | Sans le gel |
|---|---|---|
| Entités passées par la voie d'approche | 2 100 | 2 100 |
| **Attaquants `sorti` en rangée < 1** | **0** | **14** |
| `ticksInutiles` maximal atteint en approche | **0** | **29** |

`TICKS_AVANT_REPLI` vaut 30 : sans le gel, quatorze unités sur deux cents combats
rentraient à la base **sans jamais être entrées en grille**, et le compteur en
frôlait le seuil. Attendu zéro, mesuré zéro.

---

## 7. Les mesures déclarées

### Le « boost de vitesse », chiffré

`dureeDArrivee` valait `MILLI_PAR_CASE × TICK_MS / vitesse`, c'est-à-dire
**exactement le temps de franchir une case à vitesse ×1**, pendant que le sprite
partait **une case plus bas**. Il couvrait donc **deux cases dans le temps
d'une** — et l'écran de raid tourne jusqu'à ×4 :

| Vitesse de déroulé | Rapport apparent |
|---|---|
| ×1 | **×2** |
| ×2 | **×3** |
| ×4 | **×5** |

Ce n'était pas un réglage à adoucir : c'était un mensonge de dessin, et il part
avec son module.

### La géométrie du déroulé, relevée sur la projection réelle

| Grandeur | Valeur |
|---|---|
| `tailleCase` | **70** |
| `margeY` | **43** |
| `y` de la rangée 1 | **1 233** |
| Bas de la grille (`yDeRangee(1) + tailleCase`) | **1 303** |
| **`y` du sprite en rangée 0** | **1 303** |
| **`y` du sprite en rangée 1** | **1 233** |
| Écart | **70**, une case exactement |
| Débord du sprite sous le canevas | **62 px** |
| **Buffer résiduel sous la rangée 1** | **8 px** |

⚠ Les 8 px sont ceux que le §5.4 du brief annonce, et ils ne sont **pas
corrigés** : la correction serait une demi-case réservée dans
`calculerProjection`, qui déplacerait la douzaine de positions en pixels que
`test/banc.test.js` asserte. **Ethan tranche.**

### Les ticks d'entrée, par palier de vitesse

Mesurés au moteur, montage à une unité seule :

| Vitesse | Unité témoin | Tick d'entrée en rangée 1 |
|---|---|---|
| 60 | Meute | **17** |
| 90 | Fendeur | **12** |
| 120 | Ratisseur | **9** |
| 240 | Frappeur | **5** |

C'est l'allongement que l'approche coûte, unité par unité. **Aucun barème n'a été
touché** ; ce sont des mesures, pas des assertions.

### L'effet d'équilibrage, mesuré et non compensé

Les trois raids de référence, `executerRaidComplet`, graine 1, niveau 15 :

| Raid | Ticks | Butin | Survivants |
|---|---|---|---|
| A — avant-poste / infanterie | 280 → **326** | 0 · 0 → 0 · 0 | 2 → 1 |
| B — camp / blindé lourd | 287 → **309** | 25 199 · 8 399 → **25 179 · 8 393** | 6 → 6 |
| C — camp / infanterie | 458 → **489** | **0 · 0 → 36 · 12** | 4 → 5 |

Aucune cause de fin ne change. Le raid **C quitte le zéro de butin** pour la
première fois depuis PAQUETS : trente et un ticks de plus veulent dire trente et
un ticks de tirs de plus.

Sur les **54 raids** du balayage de `cible.test.js`, il reste **UN seul** qui
touche le plafond de 900 — `mixte/base/42` —, et **il n'est pas un gel** :
`maxTicks` porté à 20 000, il se conclut par `attaquants` au tick **940**, soit
**1,04 fois le plafond**. C'est le meilleur dépassement que ce test ait jamais
relevé — 4 645 au lot CARTE, 5 478 au lot COLONNE, 3 539 au lot
DISPOSITION-OUVRAGE, 2 618 au lot MUR.

⚠ **L'approche est EN PLUS** — option (a), arbitrée par Ethan le 11/09, l'option
(b) (faire naître la vague 1 à un tick négatif) étant écartée. L'effet
d'équilibrage est **assumé**, mesuré ici, et **rien n'a été compensé**.

---

## 8. Compte de tests final

| Grandeur | Avant | Après |
|---|---|---|
| Tests déclarés | 1 575 | **1 572** |
| Verdict mesuré | 1 574 · 0 · 1 | **1 571 pass · 0 fail · 1 skipped** |
| `npm run check` | 0 | **0** |

**Deux tests entrent** (`APPROCHE T1`, `APPROCHE T2`), **cinq sortent avec leur
sujet** (`SB T4`, `SB T5`, `SB T5 bis`, `AC T3`, `AC T4`), soit −3.

**Aucune assertion n'a été retirée ni assouplie** hors les cinq tests dont le
sujet a disparu. **Quinze fichiers de `test/` sont touchés** ; le partage est
net :

- **Montages RÉPARÉS** — un `rangee: DEPART` explicite, dérivé de
  `GRILLE.bandes` et jamais écrit `2` — là où l'entrée n'est pas le sujet :
  `arret`, `repli`, `combat`, `colonne`, `generateur`, `recherche`, `arsenal`,
  `roster`, `rendu`. Chacun porte le même pavé de prose, écrit une fois.
- **Valeurs RÉANCRÉES**, chacune avec le nombre d'avant à côté de celui d'après
  et le motif : `repli T6` (458 → 489, butin 0 → 36 · 12), `arsenal T10`
  (458 → 489), `assaut T7` (six nombres), `cible T4` (309 → 334, butin −3,1 %),
  `cible T5` (la liste des raids qui expirent), `roster T6` (les trois raids),
  `poi T18` (les deux butins), `colonne T18 bis` (sixième réancrage de la dette),
  `generateur T12` (écart 1 → 0).

La ligne de `CLAUDE.md` §0 est mise à jour, et les six gardes de
`documentation.test.js` sont vertes.

---

## 9. Delta d'octets

`dist/index.html` : **9 367 456 → 9 366 695 octets**. Le lot **REND 761 octets**.

Mesuré **poste par poste**, chacun net de ses `data:`, contre le livrable rebâti
dans un `git worktree` sur l'arbre pristine de `main` = `dff2689` :

| Poste | Avant | Après | Delta |
|---|---|---|---|
| Images | 7 683 603 | 7 683 603 | **+0** |
| Audio | 1 193 346 | 1 193 346 | **+0** |
| Feuille | 45 020 | 45 020 | **+0** |
| **JavaScript** | 408 889 | 408 128 | **−761** |
| Balisage | 36 598 | 36 598 | **+0** |
| **Somme** | **9 367 456** | **9 366 695** | **−761** |

La somme des cinq postes tombe **EXACTEMENT** sur le total des deux côtés, et
**307 lignes `data:` / 306 URI de part et d'autre**.

⚠ C'est bien la suppression d'`arrivee.js` qui rend ces octets : le module pesait
282 lignes, et ce qui entre — deux fonctions pures dans `grille.js`, deux gardes
dans `ciblage`, `posePermise` — pèse moins.

⚠ **Borne T10 inchangée à 9 600 000.** Le lot ne fait entrer aucune ressource, et
une borne ne se baisse pas non plus parce qu'un lot rend. Marge **233 305 octets,
2,43 %**.

---

## 10. Écarts au brief, avec leur motif

1. **`AC T2` reste, trimé — le brief le range parmi les six qui sortent.**
   Mesuré : ce qu'il garde ne dépend pas de la rampe. « Aucune primitive de la
   liste d'affichage n'est translucide » reste vrai, reste mesurable, et reste la
   **seule** garde du dépôt qui attrape une opacité partielle rebranchée
   ailleurs — sur une ombre, sur un socle, sur une passagère. Le retirer
   laisserait `OPACITE_PLEINE` sans aucun lecteur de test. Ce qui part est le
   HARNAIS (les sept instants de rampe, le huitième argument) ; ce qui reste est
   le balayage. **Cinq tests sortent au lieu de six**, et le compte final en
   tient compte.

2. **La preuve du §4.1 est devenue permanente au lieu d'être jouée une fois.**
   Le brief demande de l'exécuter avant la recapture ; `montagesTemoins` prend
   désormais une rangée et `JOURNAL T1 bis` la lui passe, si bien que la preuve
   tourne à **chaque `npm test`**. C'est plus fort que ce qui était demandé : la
   recapture reste adossée à une garde vivante au lieu d'une mesure d'un jour.

3. **`COMBATS_DEPLACES_PAR_MUR` est annotée, pas retirée.** Elle a perdu sa table
   de base à la recapture et n'a plus de lecteur. Le §4.3 du brief interdit de
   toucher aux six couches ; on ne la touche pas, mais un pavé dit qu'elle est
   **gardée sans être lue** et qu'il ne faut pas l'empiler sur la capture neuve —
   une table orpheline qui ne le dirait pas serait un commentaire menteur en
   puissance.

4. **Le témoin de BASES-0 prend une couche au lieu d'être recapturé.** Le §4.5
   dit « même traitement » ; mesuré, une couche de **35 couples sur 350** s'adosse
   très bien, là où la table de combat en aurait demandé 1 132 sur 1 600. On
   recapture quand on ne peut plus adosser, pas par symétrie.

5. **La seconde moitié du verrou de `ciblage` est inerte, et `APPROCHE T1` garde
   sa PRÉMISSE.** Le brief n'annonçait pas cette inertie. Mesurée, elle est un
   fait du roster (portée maximale 2,5 contre une bande de défense qui commence
   en rangée 3) et non un oubli. Le test l'assert de face : le jour où une unité
   portera plus loin, il tombera.

---

## 11. Ce qui reste ouvert

1. **Le rendu n'a pas été vu, et se déclare non exécuté.** C'est ce que le lot
   change qu'Ethan regarde — des unités qui montent depuis le bas de l'écran au
   lieu de paraître sur la bande du bas —, et rien n'a été ouvert dans un
   navigateur : tout est mesuré sur `rangeeMilli`, sur la liste d'affichage et
   sur des fonctions pures.

2. **Le son de déploiement part à l'apparition, donc hors écran.**
   `evenementsDuJournal` de `src/son/cablage.js` lit `journal.apparitions` : on
   entendra une vague jusqu'à **1,7 s** avant de la voir (unité à `vitesse: 60`).
   §5.3 du brief le déclare et ne le traite pas. **Ethan tranche.**

3. **Les 8 px de buffer sous la rangée 1.** Le haut du sprite d'une unité en
   rangée 0 y affleure, sous le fond peint. La correction est une ligne dans
   `calculerProjection` — réserver une demi-case en bas — et elle déplacerait la
   douzaine de positions en pixels que `banc.test.js` asserte. Hors de ce lot.

4. **La file hors écran chez les unités lentes.** La vague 2 naît au tick 50,
   soit à l'instant où une lente finit tout juste d'entrer : la voie d'approche
   va se congestionner. `enAttente` et le blocage d'occupation la gèrent, et
   c'est le comportement voulu — mais personne ne l'a regardé à l'écran.

5. **L'équilibrage.** Les trois raids de référence s'allongent de 22 à 46 ticks,
   et le raid C recommence à griffer. **Rien n'a été compensé** : si l'approche
   rend les raids trop faciles ou trop durs, c'est Ethan qui le dira, et ce sera
   un autre lot.

6. **Un pincement pendant le déroulé peut ramener la rangée 0 dans le canevas.**
   Au zoom d'ouverture le plafond de `bornesDuDecalage(null, …)` vaut 0, donc la
   vue est épinglée et la rangée 0 est hors canevas par construction ; zoomé,
   elle peut redevenir visible. Il n'y a plus rien à corriger — l'unité est
   réellement là où son sprite est.

---

*`SAVE_VERSION` reste à 32, vérifié au diff. `python3 tools/verifier.py` n'a pas
été lancé, et c'était conforme : le lot ne touche ni `art/`, ni un outil de la
chaîne — zéro fichier au diff.*
