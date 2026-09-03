# RAPPORT — lot RETOURS-DU-03

Trois retours d'Ethan, le 03/09/2026, dans son ordre :

1. « le jeu détecte la mise à jour mais refuse de l'implantation »
2. « on davantage remplir le monde avec des bases ouvrage »
3. « le territoire doit avoir 8 cases de plus, dans les angles. un carré de 5x5
   avec chaque coin rogner (4cases) ; ouvrage idem rogner mais 7x7 donc 3 cases
   à chaque coin »

Puis, quelques heures plus tard, devant la capture de la carte :

4. « je suis sûr à 100 % qu'on n'est pas obligé de mettre des bases en
   diagonale »

Aucun brief : quatre phrases et trois captures d'écran. Ce rapport dit ce qui a
été fait, ce qui a été **mesuré**, et les points qui reviennent à Ethan.

⚠⚠ **LE §2 A ÉTÉ ÉCRIT DEUX FOIS, ET LE QUATRIÈME RETOUR EST LA RAISON.** La
première réponse à « remplir davantage » desserrait la règle de non-contact aux
quatre voisines orthogonales, au motif — écrit ici même, et **faux** — que
l'exclusion des huit voisines plafonnait mathématiquement la carte à 16 bases
par 12 × 12. Ethan a refusé le procédé ; la mesure lui a donné raison. La
section 3 ci-dessous porte la version qui tient, et dit d'où venait l'erreur.

---

## 1. Référence

| | avant (TRANSFERT) | après |
| --- | ---: | ---: |
| `npm test` | 932 pass / 0 fail | **935 pass / 0 fail** |
| `gradle :maj:test` | 29 tests / 0 fail | **32 tests / 0 fail** |
| `dist/index.html` | 1 591 262 o | **1 592 440 o** (+1 178) |
| références externes | 0 | **0** |
| images inlinées | 16 `data:image` | **16** |
| `SAVE_VERSION` | 24 | **24** |
| version · build | 0.69.0 · 70 | **0.70.1 · 72** |

Marge T10 : **57 560 octets, 3,49 %**, borne **inchangée** à 1 650 000 — aucune
ressource n'entre, et §5 interdit de la relever pour du code.

⚠ **La base de référence du départ a été retrouvée en entier**, contrairement au
lot précédent : `npm ci && npm run check` avant toute modification →
**924 pass / 0 fail**, `dist/index.html` à 1 591 262 octets, version 0.69.0 ·
build 70. Ce sont exactement les nombres que `CLAUDE.md` §0 annonçait.
---

## 2. §3 — le territoire devient un OCTOGONE

### La forme

Une seule règle rend les deux figures qu'Ethan a dessinées :

> la zone est l'intersection du **carré de Tchebychev de rayon `r`** et du
> **losange de Manhattan de rayon `r + 1`**.

| rayon | carré | disque (BASES-1) | **octogone** | retiré par coin |
| ---: | ---: | ---: | ---: | ---: |
| 2 (joueur) | 25 | 13 | **21** | 1 |
| 3 (Ouvrage) | 49 | 29 | **37** | 3 |

C'est **exactement** le « carré de 5x5 avec chaque coin rogné (4 cases) » et le
« 7x7 donc 3 cases à chaque coin » du message — et, des deux côtés, **huit cases
de plus que le disque**, ce qui est le « 8 cases de plus, dans les angles »
recompté et non recopié.

⚠ **Ce n'est PAS un retour sur EUCLIDE.** La portée du raid, la garde du
peuplement et les anneaux de satellites restent des disques. Seule la ZONE
D'INFLUENCE reprend ses angles, et elle ne les reprend qu'en partie : le carré
plein d'avant EUCLIDE est mort.

⚠ **Un seul nombre à tourner** : `GEOGRAPHIE.margeDiagonaleInfluence`, à 1. À 0
la zone redevient le losange, à `r` elle redevient le carré plein.

### CINQ modules écrivaient cette forme — il n'y en a plus qu'un

`dansLOctogoneDInfluence` de `sim/points-attaque.js` est désormais la SEULE
écriture, et quatre appelants y passent :

| module | ce qu'il en fait | forme qu'il portait |
| --- | --- | --- |
| `sim/points-attaque.js` | le PRIX du raid | disque |
| `sim/territoire.js` | le DESSIN sur la carte | disque |
| `sim/fondation.js` | le REFUS de fonder | disque |
| `sim/poi.js` | l'ACQUISITION d'un POI | **carré plein** |

⚠⚠ **Le quatrième n'avait JAMAIS filtré, et deux lots l'ont cherché sans le
trouver.** `releverLesPoisAcquis` peignait le carré de (2r+1)² cases sans le
moindre test de forme : un POI dans un coin était donc **acquis** alors que ni la
carte ne montre cette case comme alliée, ni le barème du raid ne la facture
ainsi. EUCLIDE avait énuméré trois sites de bascule sans le voir ; BASES-1 en a
corrigé un quatrième (`territoire.js`) sans le voir non plus. **C'est un
changement de RÈGLE, pas un nettoyage** — un POI dans un angle rogné n'est plus
acquis — et `POI T25` le nomme désormais.

### Ce que le prix devient — M1

Sur **150 graines**, base posée en (200, 16), toutes les cibles à portée :

| | disque (`origin/main`) | octogone |
| --- | ---: | ---: |
| cibles | 5 143 | 5 143 |
| prix moyen | 27,953 | **27,861** |

**118 cibles sur 5 143 (2,29 %)** passent de **16 à 12 points** — c'est-à-dire de
+3 à +1 par case sur une distance de 2. Aucune autre transition : ce sont
exactement les huit cases par base que le rognage rend au tarif de proximité.
**Rien n'a été compensé.**

---

## 3. §2 — davantage de bases de l'Ouvrage

### Ce qui a été affirmé le matin, et qui était faux

> « Le plafond est MATHÉMATIQUE : la densité des maxima locaux d'un 3 × 3 vaut
> exactement 1/9, soit 16 par 12 × 12, quelle que soit la probabilité. Il n'y
> avait rien à gagner sur la probabilité : c'est le VOISINAGE qui plafonnait. »

Cette phrase a été écrite dans `src/data/sites.js`, dans `src/sim/peuplement.js`,
dans `test/euclide.test.js` et dans le corps de la PR. Elle décrit correctement
**un algorithme** et pas du tout **une règle** :

- l'algorithme était « une case est une base si son hachage domine celui de ses
  huit voisines candidates » — une **passe unique**. La densité de ces maxima
  locaux vaut bien 1/9 ;
- la règle, elle, est « aucune base dans les huit cases autour ». Son empilement
  maximal est un damier au pas de deux, soit **36 par 12 × 12**.

Entre 16 et 36 il y avait un facteur 2,25 que personne n'avait cherché. Ethan :
**« je suis sûr à 100 % qu'on n'est pas obligé de mettre des bases en
diagonale. »**

### Ce qui a été fait : des TOURS

`estBaseOuvrage` ne fait plus une passe mais `PEUPLEMENT.toursDePeuplement`. Au
tour 1, rien ne change. Au tour `k`, on rejoue le même maximum local sur les
seules cases qu'aucun tour précédent n'a **prises ni voisinées**. Le résultat est
un ensemble indépendant **maximal** : plus aucune case ne pourrait être ajoutée
sans toucher une base.

**Deux bases ne se touchent donc jamais, pas même par un coin** — vrai tour par
tour, donc vrai en tout. La règle du 29/08 (« 8 cases autour ») est appliquée à
la lettre, et `contactDiagonalPermis` a été **retiré** de la table plutôt que
remis à `false` : un levier qui ne sert plus qu'à défaire un arbitrage n'a rien
à faire dans `src/data/`.

### La règle reste LOCALE — aucune passe sur la carte

C'est le point qui conditionne tout le reste : la carte est **dérivée**, jamais
stockée, et `basesDeLaFenetre` ne regarde qu'un écran. Le tour `k` d'une case
dépend du tour `k − 1` de ses voisines : la récursion regarde donc un rayon de
`toursDePeuplement` cases et s'arrête là.

| | une passe | quatre tours |
| --- | ---: | ---: |
| hachages par appel isolé | 9 | **59** |
| fenêtre d'écran (1 240 cases) | 0,9 ms | **2,4 ms** |
| carte entière (9 300 cases) | — | 37 ms |
| scénario du témoin, 10 graines | 955 ms | **1 221 ms** (pire graine 231 ms) |

⚠ **Les 2,4 ms tiennent à un mémo PARTAGÉ sur la fenêtre.** Un mémo par case
coûte 5,5 ms : les récursions de 1 240 cases voisines se recouvrent presque
entièrement. `basesDeLaFenetre` en ouvre donc un seul — et comme sa clé ne porte
que la case et le tour, il est **propre à une graine**. Un test compare les deux
chemins sur deux graines successives, et exige qu'elles ne rendent pas la même
carte : sans cette dernière ligne, un mémo qui survivrait d'un appel à l'autre
passerait inaperçu.

### Le réglage, et c'est Ethan qui l'a rendu

Les deux courbes, mesurées sur 20 graines, fenêtres 12 × 12 entièrement hors de
la garde :

```
tours   1      2      3      4      5      6      8
bases   16,24  23,88  25,31  25,42  25,43  25,43  25,43

p       0,30   0,40   0,50   0,60   0,70   0,80   0,90   1,00
bases   19,09  21,50  23,28  24,52  25,42  26,13  26,83  27,28
```

Trois réglages ont été montrés à Ethan **en capture d'écran**, tous sans contact
diagonal : 23,5 · 25,8 · 27,7 bases par 12 × 12. Il a retenu **25,8**, d'où
`probabiliteCandidate: 0,7`. Sur 120 graines, la mesure du test rend **25,431**,
écart-type **1,93 par fenêtre**, de 19 à 31.

`toursDePeuplement: 4` n'est pas un réglage d'équilibrage : c'est le **point
fixe** à un centième près. Le monter ne change rien, le descendre vide la carte.

### La régularité, dite honnêtement

C'est l'autre moitié de l'arbitrage du 02/09 — « pas un cadre parfaitement
rectangulaire comme une sylviculture » —, et il faut la dire dans le bon sens :
**la carte est plus régulière qu'avant, pas moins.** C'est le prix de la
densité, et il n'y a pas d'échappatoire.

| | avant (16 bases) | après (25,4) | à saturation (27,3) |
| --- | ---: | ---: | ---: |
| blocs 3 × 3 entièrement vides | 22,1 % | **1,8 %** | 0,0 % |
| bases touchant une voisine au minimum permis | 89,9 % | **99,6 %** | ~100 % |

Ce que `probabiliteCandidate: 0,7` achète, c'est donc précisément le 1,8 % de
trous qui reste : à p = 1 la carte n'en a plus un seul.

⚠ **La densité mesurée sur la carte entière est de 25,79**, contre 25,43 dans la
fenêtre du test : la différence est un effet de bord de carte, les colonnes 1 et
31 ayant moins de voisines. Les deux nombres décrivent la même règle.

### Ce que ça change ailleurs

- **Bases de l'Ouvrage sur la carte entière**, six graines de référence :
  993 · 993 · 996 · 978 · 984 · 986 → **1 590 · 1 588 · 1 581 · 1 569 · 1 571 ·
  1 572**, soit **+59,7 %**.
- **Cibles à portée**, 150 graines depuis la rangée 200 : **8 325** contre 5 143
  à l'ancienne densité ; prix moyen d'un raid **27,821 points**.
- **Bases attaquantes**, 25 graines du témoin : de 51 à 62, **moyenne 56,0**.
- **Fonder au-delà de la rangée ~272 reste impossible**, sur 40/40 graines —
  inchangé par rapport au réglage du matin. Cases fondables dans le disque de
  rayon 10 : **261,0** à la rangée 295, 269,4 à la 290, 172,4 à la 285, 83,3 à
  la 280, 13,4 à la 275, **0,0** au-delà de la 270.

---

## 4. §1 — la mise à jour dit ce qui TOURNE

### Le défaut, établi par le code

La capture montre, à deux lignes d'intervalle :

```
VERSION        v0.67.0 b68
MISE À JOUR    À jour — build 70.
```

Les deux nombres se contredisent, et rien à l'écran n'explique l'écart.

`EtatMiseAJour.message` affichait `gestionnaire.buildInstalle()`, qui est le
build **du fichier sur le disque**, jamais celui **de la page qui tourne**.
`htmlAuDemarrage()` sert au lancement ce que le disque portait ALORS ; une
vérification qui aboutit ensuite remplace le fichier **sans jamais remplacer la
page** — c'est le fonctionnement voulu, le jeu n'est pas remplacé à chaud. La
vérification SUIVANTE lit donc le disque, y trouve le build du manifeste, et
conclut `A_JOUR`.

**« Rien à télécharger » n'est pas « à jour ».** Le verdict était faux au joueur :
une version plus récente était installée et attendait une relance.

### Ce qui a été fait

- `:maj` — `GestionnaireVersions` retient `buildServi`, le build réellement servi
  à ce lancement (en mémoire, pas sur le disque : il décrit CE lancement-ci).
- `:maj` — un verdict de plus, `EN_ATTENTE_DE_RELANCE`, et
  `verdictSansTelechargement(buildServi, buildInstalle)` qui décide. `A_JOUR` ne
  veut plus dire deux choses.
- `:maj` — le message nomme les DEUX builds **et dit le geste** :
  « Build 70 installé — relance le jeu pour l'activer (build 68 en cours). »
- `:app` — le transport passe les deux builds et APPELLE la décision, il ne la
  refait pas.
- **La page** — `ligneDeMiseAJour(lu, monBuild)`, pure, compare le build que le
  pont annonce sur le disque à celui que la page porte dans son propre balisage
  (`data-build`), et réécrit la ligne quand ils diffèrent.

### ⚠⚠ Pourquoi la moitié JS est celle qui compte

**Le Kotlin n'arrive que par un nouvel APK ; le HTML arrive tout seul.** C'est
tout le sens du projet : Pages met la page à jour, l'enveloppe reste celle qui
est installée. Une correction qui ne vivrait que dans `:maj` n'atteindrait jamais
un joueur qui ne réinstalle pas. La page tranche donc **seule**, avec ce que
l'ancienne enveloppe lui donne déjà.

**Vérifié au boot sans tête**, avec un faux pont qui rend EXACTEMENT le JSON
d'une enveloppe d'avant le correctif (`{"etape":"A_JOUR","build":999,
"message":"À jour — build 999."}`, sans `buildServi`) :

```
version   : v0.69.0 b70
data-build: 70
ligne     : Build 999 installé — relance le jeu pour l'activer (build 70 en cours).
erreurs de page : 0
```

### ⚠⚠ Ce qui n'est PAS prouvé, et il faut le dire

Le mécanisme de rollback de `GestionnaireVersions` — deux lancements consécutifs
sans que `onPageFinished` ne soit appelé écartent la version installée — **peut
aussi produire la capture**, et je n'ai aucun moyen de le départager ici : il n'y
a pas d'appareil, et un test appareil non exécuté se déclare non exécuté (§3).
Je n'ai donc **rien touché** à ce mécanisme : inventer un correctif pour un
défaut non prouvé est exactement ce que §6 interdit.

**Ce que le lot rend possible, c'est de trancher au prochain essai** : si, après
relance, l'écran affiche « À jour — build 71 » et « v0.71.0 b71 », le défaut
était bien le verdict et il est réglé. S'il réaffiche « Build 71 installé —
relance le jeu » alors que tu viens de relancer, le rollback est en cause et on
saura où chercher.

---

## 5. Ce que le témoin de BASES-0 dit

**41 couples sur 322**, tous à partir de la phase 10 — mesuré, pas estimé, et le
bloc est **reconstruit** plutôt que complété : le relevé compare à la chaîne des
lots précédents, si bien qu'un couple revenu à sa valeur d'avant sort du bloc au
lieu d'y rester déclaré à tort.

| phase | champs déplacés |
| --- | --- |
| p10 montée | `poisAcquis` |
| p11 raid Ouvrage | `armee` `attaque` `poisAcquis` `rapports` `recherche` `sitesEntames` |
| p12 veille du raid | + `nbTicks` `prochaineInstanceSatellite` `reserveReparation` `satellites` |
| p13 après le raid | + `disposition` `economie` `position` |
| p14 sous le feu | idem, moins `sitesEntames` |

⚠⚠ **Les NEUF premières phases sont identiques au bit** — la construction de la
base, son économie, sa garnison, son armée, **et le premier raid sur un camp**.
C'est ce qu'on attend : un camp est de l'HISTOIRE, pas du tirage de carte, et la
garde du peuplement tient les bases de l'Ouvrage à quinze cases du départ.

⚠ **L'attribution est mesurée elle aussi.** En remettant la seule densité d'avant
(`toursDePeuplement: 1`, `probabiliteCandidate: 0,35` — ce qui **est**
exactement l'ancienne règle), il n'en reste que **QUATORZE** : ce sont ceux de
l'octogone seul. Les vingt-sept autres sont ceux de la densité.

⚠ **`armee` est neuf par rapport au relevé du matin**, et la raison est simple :
une carte plus dense fait tomber davantage de raids de l'Ouvrage sur la base,
donc les pièces du joueur portent des dégâts qu'elles ne portaient pas.

### Les scalaires

| scalaire | graines déplacées |
| --- | ---: |
| `nbAttaquantes` | 25 / 25 |
| `raidOuvrage` — nombre de cibles | 25 / 25 |
| `raidOuvrage` — cible choisie | 22 / 25 |
| `raidOuvrage` — empreinte du rapport | 23 / 25 |
| gestes, sauvegarde, cases atteignables, déplacement, **tout `raidProche`** | **0 / 25** |

C'est la signature exacte d'une carte plus dense : plus de bases à portée, plus
de cibles, et une cible retenue qui change dès qu'une nouvelle venue coûte moins
cher. Et **la sauvegarde ne grandit pas d'un octet** : le lot ne touche ni l'état
ni sa forme.

---

## 6. Vérifications

### Premier relevé — seize falsifications, les seize mordent

| # | défaut injecté | tombent |
| ---: | --- | ---: |
| F1 | l'octogone redevient un CARRÉ | 9 |
| F2 | l'octogone redevient un LOSANGE | 2 |
| F3 | la carte repeint le disque, le prix garde l'octogone | 4 |
| F4 | le prix repasse au disque, la carte garde l'octogone | 5 |
| F5 | la fondation garde le disque | 1 |
| F6 | le relevé des POI repeint le carré plein | 4 |
| F7 | la garde d'entiers de la zone est retirée | 1 |
| F8 | le contact diagonal est refermé | 8 |
| F9 | la probabilité revient à 0,35 | 6 |
| F10 | (0, 0) entre dans le voisinage d'exclusion | 56 |
| F11 | `basesParDouzeCarre` reste à 16 | 3 |
| F12 | la page répète le message du pont sans le confronter | 2 |
| F13 | le balisage perd `data-build` | 1 |
| F16 | une empreinte du témoin est retouchée | 1 |
| K1 | `verdictSansTelechargement` rend toujours `A_JOUR` | 2 (JVM) |
| K2 | « à jour » renomme le build du DISQUE | 1 (JVM) |
| K3 | `buildServi` n'est plus retenu au démarrage | 1 (JVM) |

⚠⚠ **DEUX NE MORDAIENT PAS AU PREMIER RELEVÉ, et les tests qui les attrapent ont
été écrits APRÈS la mesure :**

- **F6** ne tombait que par le témoin, qui dit seulement « quelque chose a
  bougé ». `POI T25` le NOMME désormais : un POI dans un angle rogné n'est pas
  acquis, sa voisine d'épaule l'est.
- **F7** ne faisait tomber **aucun** test. La garde d'entiers de
  `dansLOctogoneDInfluence` remplace celle que `distanceCarreeCases` portait :
  sans elle, une case mal formée rendrait `NaN`, donc `false`, donc « hors du
  territoire » **en silence** — le raid coûterait le tarif lointain sans que rien
  ne le dise. `EUCLIDE T6 bis` la tient.

⚠ **F8 et F9 sont caduques**, la décision qu'elles gardaient ayant été renversée
le soir même. Elles sont remplacées par les huit ci-dessous.

### Second relevé — la règle multi-passe, huit falsifications

| # | défaut injecté | tombent |
| ---: | --- | ---: |
| F1 | le voisinage reperd ses diagonales (retour aux quatre) | 5 |
| F2 | un seul tour de peuplement | 8 |
| F3 | `libreAuTour` oublie les VOISINES prises aux tours d'avant | 4 |
| F4 | `libreAuTour` saute le premier tour | 1 |
| F5 | le mémo de la fenêtre survit d'un appel à l'autre | 3 |
| F6 | le départage n'exclut plus l'égalité (`>=` → `>`) | **0** |
| F7 | la probabilité candidate revient à 0,35 | 3 |
| F8 | `basesParDouzeCarre` est réécrit pour coller au code | 1 |

⚠⚠ **F6 NE MORD PAS, ET C'EST DÉCLARÉ PLUTÔT QUE CORRIGÉ.** Deux voisines
candidates au hachage EXACTEMENT égal gagneraient toutes deux leur tour, donc se
toucheraient. C'est impossible en pratique, et c'est mesuré : **0 égalité sur
1 023 990 paires de voisines**, trente graines, carte entière. Écrire un test
qui ne peut jamais tomber sur aucune graine ne garderait rien ; la comparaison
stricte reste, et le commentaire du module dit pourquoi. Le défaut existait à
l'identique avant ce lot.

⚠ **F4 ne fait tomber qu'un seul test — `EUCLIDE T5 ter` — et c'est exactement
ce qu'on lui demande.** La densité reste dans la tolérance quand on saute le
premier tour ; seule la confrontation case par case avec la passe globale voit
la différence. C'est la garde qui compte le plus du lot.

### Boot sans tête (Chromium, 412 × 915, sur le HTML livré)

- l'écran Options rend la ligne honnête sous une vieille enveloppe (§4) ;
- l'écran Monde dessine le territoire **en octogone** — contour relevé sur la
  capture : rangées de 3 · 5 · 5 · 5 · 3 cases, soit 21, les quatre coins
  rognés ;
- la carte est visiblement plus dense, et **aucune paire de bases ne se touche**
  à l'œil comme au test ;
- **zéro erreur de page**, sur les quatre variantes construites.

### Ce qui n'a pas été fait

⚠ **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : le lot
ne touche ni `art/`, ni `tools/`.

⚠ **Aucun essai sur appareil.** Le rendu du territoire et la ligne de mise à jour
sont vérifiés dans Chromium, pas sur ton téléphone.

---

## 7. Fichiers touchés

**Moteur et données** — `src/data/sites.js` (`margeDiagonaleInfluence`,
`probabiliteCandidate`, `basesParDouzeCarre`, `toursDePeuplement`),
`src/sim/points-attaque.js` (la forme, une fois), `src/sim/territoire.js`,
`src/sim/fondation.js`, `src/sim/poi.js`, `src/sim/peuplement.js`
(`VOISINES_EXCLUES`, `priseAuTour`, `libreAuTour`, `priseAUnTour`).

**Interface** — `src/ui/session.js` (`ligneDeMiseAJour`), `src/index.src.html`
(`data-build`).

**Enveloppe** — `android/maj/.../GestionnaireVersions.kt` (`buildServi`),
`android/maj/.../EtatMiseAJour.kt` (`EN_ATTENTE_DE_RELANCE`,
`verdictSansTelechargement`), `android/app/.../MiseAJour.kt`.

**Tests** — `test/euclide.test.js`, `test/territoire.test.js`,
`test/bases.test.js`, `test/peuplement.test.js`, `test/poi.test.js`,
`test/raid-ouvrage.test.js`, `test/deplacement.test.js`, `test/maj.test.js`,
`test/temoins-bases-0.js`, plus les deux fichiers de test JVM.

### Trois montages tombés pour une raison qui ne les regardait pas

**Un montage qui écrit une coordonnée ne garde que lui-même** — CLAUDE.md l'écrit
depuis le 31/08, et le dépôt l'a payé trois fois de plus aujourd'hui :

- `BASES-1 T15` et `T15 bis` fondaient sur `{ rangee: 283, colonne: 22 }` en dur.
  La carte densifiée y a mis une base de l'Ouvrage à portée : les deux tests ont
  échoué sur « fondation impossible ». Ils DEMANDENT maintenant une case
  fondable au moteur.
- `RAID-B T7` plantait la base en `{ rangee: 255, colonne: 13 }` pour qu'un
  rasage la fasse tomber sur un POI. Les POI ont bougé — ils esquivent les bases
  de l'Ouvrage. Le montage CHERCHE désormais une case qui satisfasse ses deux
  conditions.
- `DÉPLACEMENT T8` calculait sa cible AVANT un rattrapage de plusieurs heures :
  sur une carte dense, l'Ouvrage rase la base pendant cette fenêtre et la déplace
  de vingt cases, si bien que le refus rendu devenait `trop-loin` — une raison
  qui ne regarde pas ce test, qui mesure un DÉLAI. La cible se recalcule.

⚠ **Aucun des trois n'a eu à être retouché une seconde fois** quand la densité a
changé de méthode le soir : ils demandent au moteur au lieu d'écrire une
coordonnée, donc ils suivent.

---

## 8. Ce qui t'appartient

1. ⚠⚠ **La densité est ton choix, et il est chiffré.** Tu as retenu 25,8 bases
   par 12 × 12 sur trois captures ; `probabiliteCandidate` porte la décision et
   la table donne la courbe complète. Monter à 0,8 ou 0,9 rend 26,1 et 26,8 — au
   prix des derniers trous, les blocs 3 × 3 vides passant de 1,8 % à ~0,5 %.

2. ⚠⚠ **La carte est plus RÉGULIÈRE qu'avant, pas moins, et c'est inévitable.**
   Blocs 3 × 3 entièrement vides : 22,1 % → **1,8 %**. Bases touchant une
   voisine au minimum permis : 89,9 % → **99,6 %**. Plus de bases veut dire moins
   de trous ; « pas une sylviculture » et « remplir davantage » tirent en sens
   contraire, et 0,7 est le point que tu as choisi entre les deux.

3. ⚠⚠ **FONDER se resserre, et au-dessus de la rangée ~272 c'est devenu
   impossible.** Cases fondables dans le disque de rayon 10, sur 40 graines :

   | rangée de la base | avant | après |
   | ---: | ---: | ---: |
   | 295 (le départ) | 261,0 | **261,0** |
   | 290 | 285,4 | 269,4 |
   | 285 | 190,0 | 172,4 |
   | 280 | 98,8 | 83,3 |
   | 275 | 24,1 | 13,4 |
   | 270 et au-delà | 0,7 · 0,8 · 0,4 | **0,0 — sur 40/40 graines** |

   Fonder près du départ reste large ; c'est la dernière fissure au-dessus de la
   rangée 270 qui se referme. **Les deux demandes y contribuent** : plus de bases
   ET un territoire ennemi plus large de huit cases chacune. Le jeu passe donc
   par le rasage, comme depuis BASES-1 — mais plus franchement.

4. ⚠ **Un POI dans un angle rogné n'est plus acquis.** C'est un changement de
   règle, pas un nettoyage. Il rend le relevé cohérent avec ce que la carte
   dessine et avec ce que le raid facture — mais si tu préférais l'ancien carré
   plein, c'est une ligne de `sim/poi.js`.

5. ⚠ **Le rollback de l'enveloppe n'est ni prouvé ni corrigé** (§4). Le prochain
   essai sur ton téléphone tranchera, et le lot est écrit pour que sa réponse
   soit lisible.

**Le merge t'appartient.**
