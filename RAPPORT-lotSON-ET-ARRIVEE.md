# RAPPORT — lot SON-ET-ARRIVÉE

Points 9, 10 et 12 de la liste d'Ethan du 10/09/2026.

**Version produite : 0.99.38 · build 140.**
Branche `claude/lot-3-ralft2`. `main` = `14dd4ac` au départ.

---

## 0. Verdict

`npm run check` sort en **0**.
`npm test` → **1531 tests déclarés · 1530 pass · 0 fail · 1 skipped**.
Le skip est `LIMITE T8`, suspendu par Ethan le 08/09 ; il n'a pas été touché.

`npm run build` → `dist/index.html`, **9 135 255 octets**, 0 référence externe.

⚠ **LA BASE ANNONCÉE PAR LE BRIEF ÉTAIT EXACTE, AU TEST ET À L'OCTET.** Mesuré au
départ sur `14dd4ac` : **1524 déclarés · 1523 pass · 0 fail · 1 skipped**, sortie
0, et `dist/index.html` à **9 134 181 octets**. C'est la troisième fois du dépôt
qu'un brief tombe juste des deux côtés ; il faut le dire aussi quand ça marche.

---

## 1. Ventilation du livrable — poste par poste

Mesurée contre le livrable rebâti sur l'arbre pristine de `main` = `14dd4ac`,
sauvegardé AVANT la première écriture.

| poste | avant | après | écart |
|---|---:|---:|---:|
| JavaScript | 399 346 | 400 420 | **+1 074** |
| feuille | 129 497 | 129 497 | **+0** |
| balisage | 36 205 | 36 205 | **+0** |
| images | 7 375 787 | 7 375 787 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| **TOTAL** | **9 134 181** | **9 135 255** | **+1 074** |

**La somme des cinq postes tombe EXACTEMENT sur le total.**
`data:` : **311 lignes / 306 URI** des deux côtés (263 audio · 2 png · 41 webp).

Borne T10 **inchangée à 9 300 000** — marge **164 745 octets, 1,77 %**.

⚠ **`images +0 · audio +0`, ce que le brief exigeait.** Pas un `.opus` n'a été
réencodé : voir le §6, qui explique comment la table générée a été refaite sans
toucher un octet d'audio.

---

## 2. Point 12 — le son qui tourne tout le temps s'arrête

Ethan : « Enlever le son qui tourne tout le temps », puis, le 10/09 : « faut
croire, il s'arrête jamais ».

**Il avait raison, et la cause est mécanique.** `ambience_base_player_loop` était
sur **cinq écrans** — Chantier, Mission, Offense, Options, Recherche — et une
boucle **n'a ni garde ni plafond** : `reconcilierLesBoucles` l'écrit en toutes
lettres, « une boucle a une raison de sonner, ou elle n'en a pas ». Elle avait
donc une raison de sonner partout sauf sur la carte, et y revenir la relançait.
Ce n'est pas une durée mal réglée, c'est un état permanent.

`AMBIANCE_PAR_ECRAN` ne porte plus que **`raid`**.

⚠ **`raid` RESTE, ET C'EST UNE LECTURE, PAS UNE DICTÉE.** Le champ de bataille ne
sonne que pendant un raid, donc il ne « tourne pas tout le temps », et un champ
muet serait un appauvrissement que personne n'a demandé. **Si Ethan veut le
silence complet, c'est cette ligne-ci qui part, et rien d'autre.**

⚠ **LE SON RESTE AU LIVRABLE, ET DEVIENT DORMANT.** Comme
`ambience_calm_map_loop` avant lui (lot SON-VOLUMES) : plus aucun demandeur, mais
pas un `data:` ne sort du bundle. Le retirer serait de l'audio en moins et un
`data:` en moins, donc une ventilation d'octets et un arbitrage à part.

**Comptes déplacés, mesurés :** atteignables **168 → 167**, muets **95 → 96**.
Les ambiances muettes passent de cinq à sept ; **une seule des huit sonne
encore**, et un test la nomme dans les deux sens.

### ⚠⚠ `BOUCLES_DE_BATIMENT` — le second candidat, relevé et NON touché

Le brief demande de le nommer pour qu'Ethan tranche sans qu'on refasse le
relevé. **Ses quatre clés :**

| clé | boucle |
|---|---|
| `aerodrome` | `building_player_factory_loop` |
| `caserne` | `building_player_factory_loop` |
| `centrale` | `building_reactor_loop` |
| `depotDeVehicules` | `building_player_factory_loop` |

Elles tournent tant que le bâtiment est posé, **sur n'importe quel écran** —
vérifié : `bouclesDesirees({ ecran: 'monde', disposition: [{ id: 'caserne' }] })`
rend `['building_player_factory_loop']`. Ce sont donc, elles aussi, des sons qui
« tournent tout le temps » dès qu'une usine existe. Elles sont motivées par une
SITUATION et non par le fait d'être quelque part, d'où le choix de ne pas les
toucher. **Ethan tranche.**

### Les tests repris — aucun assoupli

Six tests lisaient `AMBIANCE_PAR_ECRAN.chantier`, qui n'existe plus. **Aucun n'a
été supprimé, aucune assertion retirée.**

- **`SON T14`** et **`SON T20`** — réancrés en écrivant les DEUX nombres :
  168 → 167 atteignables, 95 → 96 muets. `SON T20` gagne en plus la garde
  INVERSE : l'ensemble des ambiances qui sonnent ENCORE est nommé, sinon un lot
  qui aurait tout coupé — le raid compris — serait passé pour avoir répondu.
- **`SON T15`** — deux montages ont perdu leur prémisse. Celui « sur la base »
  se rejoue sur les **deux boucles de bâtiment** (le brief le demandait), et il
  gagne l'assertion qui MESURE le point 12 : l'écran de la base ne demande plus
  aucune ambiance. Celui de la réconciliation prend sa seconde boucle **DÉRIVÉE
  du pack** plutôt que de la lire dans la table — un nom recopié aurait été la
  seconde vérité que ce fichier refuse par ailleurs.
- **`SON T16`** — même dérivation ; ce test mesure le CYCLE DE VIE d'une boucle,
  qui ne dépend pas de l'écran qui la demande.
- **`SON-V T3`** — son témoin POSITIF passe du chantier au raid. Le garder aurait
  fait tomber le test sur un code juste ; l'assouplir aurait retiré la seule
  chose qui empêche `bouclesDesirees` de ne jamais rien rendre.
- **`SON-V T2` est RETOURNÉ.** Il figeait « six écrans sur sept gardent leur
  ambiance » — très exactement ce que le point 12 renverse. Il porte la règle
  neuve **et refuse l'ancienne de face** : la table d'avant le lot y est écrite
  et comparée en `notDeepEqual`, pour qu'un retour en arrière ne puisse pas être
  « corrigé » en recopiant une égalité.

La garde des écrans est **retournée sans se relâcher** : elle exige l'**ÉGALITÉ**
sur les deux listes — les six écrans SANS ambiance, nommés, et le singleton
`['raid']`. Un `>= 6` ou un `includes` aurait laissé passer le raid perdant la
sienne.

---

## 3. Point 10 — trois tirs par seconde, pas quarante-cinq

Ethan : « La fréquence des tirs du son est basée sur la fréquence. Ce qui est
assez inaudible il faudrait plutôt 3 son par seconde ».

### La mesure d'abord

La garde existante est **par ÉVÉNEMENT**, et elle n'a jamais eu pour objet de
tenir une cadence d'ensemble. Mesuré sur `src/data/sons.js` :

| événement | `gardeMs` | déclenchements/s pour lui seul |
|---|---:|---:|
| `weapon_ouvrage_aa` | 22 | **45,5** |
| `weapon_ouvrage_machinegun` | 22 | 45,5 |
| `weapon_player_rifle` | 22 | 45,5 |
| `weapon_*_artillery` | 65 | 15,4 |
| `weapon_*_aa_burst` | 80 | 12,5 |

Et le bus `armes` porte **vingt-sept événements**, dont **vingt-cinq qui ne
bouclent pas**, qu'une bande de défense fait tirer en parallèle. C'est cette
SOMME qu'Ethan entend, et rien ne la bornait.

### Ce qui entre

`GARDE_PAR_BUS = { armes: 334 }` — **334 = ceil(1000 / 3)**, arrondi au supérieur
pour que trois sons par seconde soit un **PLAFOND** et non une moyenne. L'écart à
la consigne vaut **0,3 %**, et il est déclaré.

`demanderUnSon` gagne une **étape 2 bis**, entre la garde d'événement et
`purger`. `creerVoix` naît avec `gardesBus` vide.

**Mesuré après, sur mille demandes de vingt-cinq événements DIFFÉRENTS espacées
de 10 ms sur 10 s :**

- **30 accords, soit exactement 3,00 sons par seconde** ;
- 968 refusés par le bus, 2 par la garde d'événement ;
- **les alertes restent à 31,2/s**, indépendantes — leur garde de 450 ms par
  événement, sur dix-huit événements, n'a pas bougé.

### ⚠⚠ L'ordre des étapes n'est pas indifférent

La garde de bus se pose **AVANT** le tirage de variante. `tirer` fait avancer la
graine du xorshift : refuser APRÈS avoir tiré consommerait un tirage pour un son
qui ne sort pas, donc **déplacerait la suite des variantes de tous les sons
suivants** — deux exécutions du même combat ne sonneraient plus pareil, et rien
d'autre ne le dirait. C'est la règle que `tirer` écrit déjà en tête : « il
n'avance que quand on tire pour de bon ».

**La falsification qui déplace l'étape après le tirage ne fait tomber que
`SB T2`.** C'est la meilleure preuve possible que ce test existe pour ça.

### ⚠ Les boucles ne sont pas atteintes

Deux sons du bus `armes` BOUCLENT — `weapon_missile_flight_loop` et
`weapon_ouvrage_beam_loop`. La garde vit dans `demanderUnSon`, que les boucles ne
traversent jamais ; **vérifié plutôt que supposé** par `SB T3`, qui les démarre
toutes les deux, ensemble et sans délai, et qui lit en plus la SOURCE pour
refuser que `GARDE_PAR_BUS` entre dans `reconcilierLesBoucles`.

⚠ **`src/ui/son.js` N'A PAS UNE LIGNE DE CHANGÉE**, et c'est mesuré : l'adaptateur
ne lit jamais `raison`, seulement `jouer`. `garde-bus` est un diagnostic, au même
titre que `garde`, `plafond` et `silence`.

---

## 4. Point 9 — les unités arrivent d'en dessous, en fantôme

Ethan : « Lors des raids faire apparaître les unités une case en dessous fantôme
pour qu'on voit les véhicules arrivés pour pas qu'ils apparaissent directement
sur la bande du bas ».

### ⚠⚠ `src/sim/` n'a pas une ligne de changée

Et c'est la mesure qui le dit, pas la lecture du diff : **les deux cents témoins
de combat et les huit raids de référence sont VERTS sans avoir été touchés**.
`test/temoins-combat.js` n'a pas bougé d'un caractère.

### Le module

`src/render/arrivee.js` entre, PUR. Une rampe de **`ARRIVEE_MS = 400`** —
quatre ticks à 10 Hz, soit un dixième de l'intervalle entre deux vagues
(`GRILLE.intervalleVagueSec` vaut 5 s) : assez pour être vu, trop court pour
retarder le combat. **En temps RÉEL, pas en ticks** — comptée en ticks elle
durerait 100 ms à ×4, c'est-à-dire un clignotement.

- `decalageMilli` : d'une case entière à **exactement 0** ;
- `opacite` : de **350 ‰ à exactement 1000 ‰**, en entiers.

Les deux expressions sont écrites en entiers, division en dernier : à
`ecoule = ARRIVEE_MS` le numérateur du décalage est nul et celui de l'opacité
vaut son dénominateur. Une rampe qui manquerait le zéro laisserait l'unité posée
un dixième de case sous sa case **pour toujours**.

### ⚠⚠ Le décalage s'applique en PIXELS, après la projection — et c'est une mesure

`yDeRangeeMilli` de `render/projection.js` **BORNE** sa sortie au bord haut de la
rangée 1. Mesuré sur la projection du raid : **`yDeRangeeMilli(p, 0)` et
`yDeRangeeMilli(p, 1000)` rendent le même nombre, 630.** Faire descendre l'entité
en lui donnant `rangeeMilli − 1000` l'écraserait donc sur sa propre case, et le
fantôme n'existerait pas. Le brief ne le mentionnait pas ; c'est le premier
obstacle qu'on rencontre en écrivant, et il fallait le mesurer avant.

Le décalage passe par **`yDe`**, donc il emporte tout ce qui suit l'entité — son
sprite, ses deux barres, son cadre de neutralisation et le départ de ses traits
de tir. Ne le poser que sur le sprite laisserait la barre de vie accrochée à la
case pendant que l'unité monte vers elle.

### ⚠⚠ La géométrie sous la rangée 1 — mesurée, comme le brief l'exige

| cadrage | canevas | `t` | bas rangée 1 | **libre dessous** | **fantôme rogné de** |
|---|---|---:|---:|---:|---:|
| **déroulé, plein cadre, dpr 3** | 1080 × 2160 | 108 | 2079 | **81 px** | **27 px (25 %)** |
| préparation, bande Défense, dpr 3 | 1080 × 1398 | 108 | 1398 | 0 px | 108 px (100 %) |
| préparation, bande Bâtiments | 1080 × 1398 | 108 | 1998 | −600 px | hors cadre |

**Le cas qui compte est le premier**, et c'est le seul où des unités arrivent :
le déroulé cadre la vue d'ensemble (`bandeDeLaVue()` rend `null`), tandis que la
préparation ne cadre que les bandes **Défense** et **Bâtiments** — la bande de
déploiement n'est pas navigable, vérifié : `bornesDeDefilement` lève dessus.

Donc, au déroulé : **81 px de letterboxing sous la rangée 1**, et le fantôme
déborde de **27 px au premier instant, soit un quart de sa hauteur**. Il est
entier dès qu'il a monté 27 px, c'est-à-dire au bout de **100 ms sur 400**.
C'est l'effet voulu — « le véhicule émerge du bord » — et **ni le canevas ni la
projection n'ont été touchés**.

### ⚠⚠ Écart au brief : les arrivées se notent dans `dessiner`, pas dans `avancerDUnTick`

Le brief demandait de noter « AVANT `prendrePositions` ». **Mesuré, ça aurait
laissé la vague 1 sans fantôme** — c'est-à-dire très exactement celle qu'Ethan
voit apparaître sur la bande du bas :

1. la vague 1 naît dans **`creerCombat`**, avant qu'un seul tick n'ait tourné
   (c'est sa dernière ligne, ce que `rejouer` sait déjà puisqu'il relève le
   journal juste après) ;
2. la **première image ne fait tourner aucun tick** : `derniereImageMs` est nul,
   donc `ecoule` vaut zéro, donc `ticksDus` rend zéro.

Un seul point d'appel, **juste avant de peindre**, stampe chaque entité à
l'instant de la première image qui la DESSINE — ce qui est de là que part la
rampe de temps réel — et couvre la boucle d'images comme le pas-à-pas du
simulateur. Un second point d'appel serait un point d'appel à oublier.

⚠ `dessiner` écrit déjà dans `mesure` : elle n'est pas pure et ne l'a jamais été.
Ce qu'on lui ajoute est de la même nature — de l'état d'AFFICHAGE.

### ⚠⚠ La condition de rangée est une CEINTURE VACUEUSE — et il faut le dire dans ce sens-là

Le brief la demande pour écarter les passagères. **Mesuré sur douze graines,
quatre vagues chacune : zéro attaquant sur 60 ne naît hors de la bande de
déploiement** — les 60 naissent aux rangées 1 et 2, et les 372 défenseurs
ailleurs.

Une passagère n'échappe donc **pas** à ce filtre : `sim/combat.js` la crée AVEC
son porteur, dans la bande, et ce qu'il ne journalise qu'au débarquement est
l'événement **SONORE**, pas l'entité. **Ce qui l'écarte vraiment est
l'EXPIRATION du stamp**, mesurée sur un montage et non de mémoire :

- un Éclaireur portant une Meute débarque au **tick 75**, soit 7 500 ms à ×1 et
  **1 875 ms à ×4**, contre 400 ms de montée : **marge ×4,69** au pire ;
- la borne THÉORIQUE est plus serrée et tient aussi : neuf cases au moins
  (rangée 2 → rangée 11) à 240 milli-cases par tick pour la plus rapide, soit
  37,5 ticks, donc 940 ms à ×4 — **marge ×2,35**.

La condition reste, parce qu'elle est la seule à tenir le jour où un attaquant
naîtrait ailleurs — un renfort, un largage, une pièce créée en cours de combat.
`ajouterEntite` ne l'interdit pas ; ce qui l'empêche aujourd'hui est que personne
ne l'appelle hors de l'apparition de vague.

⚠ **ET LE PORTEUR ET SA PASSAGÈRE MONTENT ENSEMBLE**, la même rampe au nombre
près. `visible` de `render/scene.js` vaut `e.vivant && !e.sorti` — il ne regarde
**pas** `embarquee`, contrairement à `estActive` du moteur —, donc une passagère
EST dessinée, à la case de son porteur. L'exclure l'aurait fait apparaître à
pleine opacité sur la case d'arrivée pendant que son porteur, une case plus bas,
monte encore.

⚠ **UNE UNITÉ RETENUE FAUTE DE CASE LIBRE ARRIVE COMME LES AUTRES**, sans rien de
particulier : elle n'entre dans `etat.entites` que le tick où elle entre
vraiment, donc elle est neuve à ce moment-là. Bon comportement par construction.

### `globalAlpha`

`sprite()` gagne un champ `alpha` en millièmes, valant 1000 par défaut — porté
par TOUTES les primitives, comme l'angle, pour que `canvas2d.js` n'ait jamais à
distinguer « absente » de « pleine ».

⚠⚠ **IL SE REMET À UN, ET C'EST LA MOITIÉ QUI COMPTE.** `globalAlpha` est un
ÉTAT du contexte : l'oublier repeindrait en translucide tout ce que la liste
dessine ENSUITE — barres et traits de tir compris — et **aucun test sans
navigateur ne le verrait**, la liste d'affichage restant juste.

⚠ Il se remet **APRÈS** le `restore` de la branche tournante : `save` capture
`globalAlpha` avec le reste, donc `restore` le REMET à la valeur translucide
qu'on venait de poser. `SB T6` exige la séquence exacte
`globalAlpha=0.4 · save · drawImage · restore · globalAlpha=1`.

⚠ Un sprite opaque **ne touche pas au contexte du tout**, exactement comme un
angle nul.

---

## 5. Les tests — verdict, montage effectif, falsifications

**Sept tests entrent — `SB T1` à `T6`, plus `SB T5 bis` — et le compte passe de
1 524 à 1 531.** Aucune assertion retirée, aucune assouplie.

### ⚠⚠ `SB T5` vu ROUGE sur l'arbre intact, et sur la PROPRIÉTÉ

Le brief l'exigeait avant d'écrire le §3. Pour que l'échec soit une **ASSERTION**
et non un fichier manquant — « ce n'est pas la propriété qu'ils mesurent »,
CLAUDE.md §6 —, le module pur est entré **d'abord, sans aucun câblage**. Verdict
mesuré :

```
not ok 2 - SB T5 — l'unité arrivée est dessinée PLUS BAS que sa case, puis dessus
  error: "l'unité apparaît directement sur sa case : y = 1863, case = 1863"
```

**C'est le défaut d'Ethan, au pixel.** Une sonde sur l'arbre strictement pristine
le confirme de son côté : sur un montage à une vague, le sprite de l'attaquant
est posé à `y = 594`, c'est-à-dire exactement `yDeRangeeMilli` de sa case.
`SB T4`, lui, était VERT au même instant — le module pur marchait, seul le
câblage manquait.

### Les sept tests

| test | ce qu'il mesure | montage effectif | verdict |
|---|---|---|---|
| **`SB T1`** | un seul écran demande une ambiance | `bouclesDesirees` sur les **sept** écrans, disposition et unités vides ; égalité sur le singleton `['raid']` **et** sur l'ensemble vide des six autres | **PASS** |
| **`SB T2`** | 3 sons/s, et la garde ne consomme pas de tirage | 1 000 demandes de 25 événements d'armes différents à 10 ms d'écart ; puis deux voix de même graine, l'une avec refus, l'autre aux seuls instants accordés — **suites de variantes ET graine finale comparées** | **PASS** |
| **`SB T3`** | ni les alertes ni les boucles ne sont atteintes | tir + alerte en alternance toutes les 10 ms ; les deux boucles du bus démarrées ensemble ; lecture de la SOURCE de `reconcilierLesBoucles` | **PASS** |
| **`SB T4`** | la rampe est monotone et tombe juste | six instants 0…500 ms, plus un balayage au pas de 7 ms ; **plus un état FORGÉ** pour séparer les deux conditions de `arrive` | **PASS** |
| **`SB T5`** | l'unité est dessinée plus bas, puis dessus | combat monté, `listeAffichage` à 0 / 200 / 400 / 500 ms ; **VALEURS** de `y` comparées, décalage exigé égal à `tailleCase` ; alpha des sprites ; **et les autres sprites ne bougent pas d'un pixel** | **PASS** |
| **`SB T5 bis`** | la passagère monte avec son porteur, pas depuis le bas | Éclaireur + Meute embarquée, colonne dégagée, tick jusqu'au débarquement | **PASS** |
| **`SB T6`** | `globalAlpha` est restauré | enregistreur ; séquence exacte avec et sans rotation ; deux sprites à la suite ; sprite opaque | **PASS** |

### Les dix falsifications — dix chutes, deux reprises

| # | falsification | ce qui tombe |
|---|---|---|
| F1 | les cinq écrans retrouvent leur ambiance | `SON T14`, `SON T15`, `SON T20`, `SON-V T2`, **`SB T1`** |
| F2 | l'étape 2 bis posée **après** le tirage de variante | **`SB T2` seul** |
| F3 | la garde de cadence entre dans `reconcilierLesBoucles` | **`SB T3` seul** |
| F4 | la rampe n'atteint pas exactement zéro | `SB T4`, `SB T5` |
| F5 | le décalage n'est plus appliqué au dessin | **`SB T5` seul** |
| F6 | `globalAlpha` posé sans être remis | **`SB T6` seul** |
| F7 | la condition de CAMP retirée | `SB T4` *(après reprise)* |
| F8 | la condition de RANGÉE retirée | `SB T4` *(après reprise)* |
| F9 | `creerVoix` ne naît plus avec `gardesBus` | `SON T8 quater`, `SON T17`, `SON T23`, `SB T2`, `SB T3` |
| F10 | l'opacité n'est plus passée au dessin de l'entité | **`SB T5` seul** |

⚠⚠ **F7 ET F8 ÉTAIENT MUETTES AU PREMIER RELEVÉ, ET C'EST LA LEÇON DU LOT.** Les
deux conditions de `arrive` **se couvrent l'une l'autre sur un vrai combat** : les
attaquants naissent tous dans la bande, les défenseurs tous en dehors. Retirer
l'une ou l'autre ne faisait tomber aucun montage. `SB T4` a gagné un **état
FORGÉ** APRÈS la mesure — l'idiome que le dépôt emploie déjà pour un cas
inatteignable (`F-J T5`, le `parVoisin` monté à la main) — et les deux mordent
maintenant. **Une falsification qui ne mord pas se vérifie avant d'être crue.**

---

## 6. ⚠⚠ Écart déclaré : `tools/sons.py` est touché, et il devait l'être

**Le brief exclut `tools/` de son territoire.** Il n'était pas tenable, et le
motif est mesuré.

`src/data/sons.js` porte en première ligne : « **FICHIER GÉNÉRÉ** par
`python3 tools/sons.py --ecrire`. NE PAS MODIFIER À [la main] ». Les deux tables
que ce lot change — `AMBIANCE_PAR_ECRAN` et la nouvelle `GARDE_PAR_BUS` — sont
écrites **depuis des dictionnaires Python**, aux lignes 536 et suivantes.
Éditer le seul fichier généré aurait donc laissé au dépôt une bombe à retardement :
le prochain `--ecrire` — ou `tools/verifier.py`, qui l'appelle —

- aurait **rendu ses cinq écrans à l'ambiance**, annulant l'arbitrage d'Ethan en
  silence ;
- aurait **supprimé `GARDE_PAR_BUS`**, donc cassé l'import de
  `src/son/politique.js` — le jeu ne se chargerait plus du tout.

C'est exactement « une transcription qui ne se confronte pas à sa source est une
copie qui vieillit », dans sa version la plus coûteuse.

### Et la régénération n'a pas touché un octet d'audio

`main()` de `tools/sons.py` réencode les 263 sons avant d'écrire la table, et
`opusenc` est absent de ce conteneur. **`ecrire_la_table` a donc été appelée
SEULE**, par import du module — elle ne demande que `json` et le manifeste :

```
python3 -c "import sons; sons.ecrire_la_table(json.load(open(sons.MANIFESTE)))"
```

⚠ **VÉRIFIÉ AVANT D'ÉCRIRE UNE LIGNE** : sur l'arbre pristine, cette commande
reproduit `src/data/sons.js` **identique à l'octet** (`git diff --exit-code`
vide). Le générateur et le fichier commité étaient donc en phase au départ, et ils
le restent. **Zéro `.opus` réencodé, d'où `audio +0`.**

⚠ Le générateur gagne aussi une garde : **un bus inconnu dans `GARDE_PAR_BUS`
LÈVE**. Une clé mal tapée rendrait la cadence INERTE en silence,
`GARDE_PAR_BUS[bus]` valant `undefined` pour tout le monde, et le son se
remettrait à bouillir sans qu'une ligne ne tombe.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ.** Le lot ne touche ni `art/`
ni un outil de la chaîne GRAPHIQUE — mais `tools/sons.py` **est** dans `CHAINE`,
et l'écart se déclare plutôt qu'il ne se glisse : son mode `--ecrire` n'a pas été
appelé, et **pas un octet d'`art/sprites/son/` ne change**. Le verdict du lot
SOL-OUVRAGE tient.

---

## 7. Ce qui n'a pas pu être vu

⚠ **LE RENDU N'A ÉTÉ VU NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE DÉCLARE NON
EXÉCUTÉ.** Tout ce qui précède est mesuré sur la **liste d'affichage** et sur la
**géométrie**, jamais à l'écran. En particulier :

- **le fantôme lui-même n'a été vu par personne.** Sa lisibilité à 350 ‰
  d'opacité, la douceur de la montée sur 400 ms, et le fait qu'un quart de sprite
  rogné par le bas se lise comme « il émerge » plutôt que comme « il est coupé »
  sont des jugements d'œil que ce lot ne peut pas rendre ;
- **le son n'a été mesuré que par la politique**, qui est pure. Trois sons par
  seconde est un nombre juste ; que ce soit la bonne CADENCE à l'oreille reste à
  entendre, et le nombre se change seul dans `GARDE_PAR_BUS` ;
- **le silence des cinq écrans n'a pas été entendu** — il est mesuré par
  `bouclesDesirees`, qui dit ce que l'état demande, pas ce qui sort du
  haut-parleur.

---

## 8. Points en suspens, pour Ethan

1. **`BOUCLES_DE_BATIMENT`** — les quatre clés sont nommées au §2. Elles tournent
   aussi tant qu'un bâtiment est posé. **Faut-il les couper aussi ?**
2. **L'ambiance du raid** — gardée par lecture. **Silence complet ?** C'est une
   ligne.
3. **`GARDE_PAR_BUS.armes = 334`** — trois sons par seconde est la consigne au
   mot. Si c'est encore trop dense ou devenu trop maigre à l'oreille, **c'est un
   nombre, et lui seul**.
4. **`ARRIVEE_MS = 400`** — même chose : un nombre, dérivé de l'intervalle entre
   vagues, à juger à l'œil.
5. **`OPACITE_ARRIVEE = 350`** — le fantôme part à 35 % d'opacité. Plus
   transparent, il disparaît sur le décor sombre ; plus opaque, il cesse d'être un
   fantôme.
6. **Le retrait des deux ambiances dormantes du livrable** — `ambience_calm_map_loop`
   et `ambience_base_player_loop` ne sont plus demandées par personne et pèsent
   toujours leurs `data:`. Les sortir est une **économie d'octets**, donc une
   ventilation et un arbitrage à part, comme le brief le dit.

---

## 9. Ce qui n'a PAS bougé

- **`src/sim/`** — pas une ligne. Vérifié au diff, et **mesuré** : les deux cents
  témoins de combat et les huit raids de référence sont verts sans avoir été
  recapturés.
- **`SAVE_VERSION` reste à 30.** Aucun champ n'entre dans l'état : une arrivée est
  un état d'AFFICHAGE qui vit dans la fermeture de l'écran de raid et meurt avec
  le déroulé ; une cadence est un réglage de sortie.
- **`src/ui/chantier.js`, `src/ui/offense.js`, `src/ui/monde.js`,
  `src/index.src.html`, `art/`** — intacts.
- **`src/ui/raid.js`** — **six lignes de code**, toutes dans le chemin de dessin :
  un import, la déclaration de l'état, l'appel de relevé, l'argument passé à
  `listeAffichage`, et la remise à zéro dans `rejouer`. Ce dernier point est un
  élargissement minime de la lettre du brief, et il est nécessaire : `vus` est une
  marque haute sur l'INDICE, donc gardée d'un raid à l'autre elle laisserait le
  **deuxième** raid d'une session sans fantôme — la pire façon de rater un effet.
- **`LIMITE T8`** — toujours suspendu, non réparé.
- **`src/ui/son.js`** — pas une ligne : l'adaptateur ne lit jamais `raison`.
