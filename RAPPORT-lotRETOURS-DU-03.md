# RAPPORT — lot RETOURS-DU-03

Trois retours d'Ethan, le 03/09/2026, dans son ordre :

1. « le jeu détecte la mise à jour mais refuse de l'implantation »
2. « on davantage remplir le monde avec des bases ouvrage »
3. « le territoire doit avoir 8 cases de plus, dans les angles. un carré de 5x5
   avec chaque coin rogner (4cases) ; ouvrage idem rogner mais 7x7 donc 3 cases
   à chaque coin »

Aucun brief : trois phrases et deux captures d'écran. Ce rapport dit ce qui a
été fait, ce qui a été **mesuré**, et les quatre points qui reviennent à Ethan.

---

## 1. Référence

| | avant (TRANSFERT) | après |
| --- | ---: | ---: |
| `npm test` | 932 pass / 0 fail | **932 pass / 0 fail** |
| `gradle :maj:test` | 29 tests / 0 fail | **32 tests / 0 fail** |
| `dist/index.html` | 1 591 262 o | **1 592 070 o** (+808) |
| références externes | 0 | **0** |
| images inlinées | 16 `data:image` | **16** |
| `SAVE_VERSION` | 24 | **24** |
| version · build | 0.69.0 · 70 | **0.70.0 · 71** |

Marge T10 : **57 930 octets, 3,51 %**, borne **inchangée** à 1 650 000 — aucune
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

### Le plafond était MATHÉMATIQUE, pas un réglage

Une case porte une base si son hachage domine celui de ses voisines candidates.
La densité de ces maxima locaux vaut exactement **1/(1 + n)** où `n` est la
taille du voisinage — donc **1/9, soit 16 par 12 × 12** avec les huit voisines,
**quelle que soit `probabiliteCandidate`**. Le dépôt en était déjà à 15,7 : il
n'y avait **rien à gagner** sur la probabilité.

Mesuré, saturation à p = 1 :

| voisinage | plafond théorique | saturation mesurée |
| --- | ---: | ---: |
| huit voisines | 16,00 | 16,15 |
| **quatre voisines** | **28,80** | **29,13** |

C'est donc le VOISINAGE qui a été desserré. `PEUPLEMENT.contactDiagonalPermis`
porte la décision.

### Ce qui reste vrai, et ce qui change

⚠ **Deux bases ne sont JAMAIS côte à côte** — c'est la lettre du message du
29/08 (« aucune base ne peut être côte à côte »), et ce n'est plus ses « 8 cases
autour ». Elles peuvent se toucher par un **coin**, jamais par un **côté**.

⚠⚠ **C'est une LECTURE, et elle se défait en remettant `false`.** Le message du
29/08 disait aussi « 8 cases autour » ; le desserrer est le seul moyen de
répondre à « davantage remplir le monde », et j'ai retenu la moitié qui le
permet. Le précédent existe : Ethan a ouvert au joueur le droit de fonder au
contact de ses propres bases le 02/09.

### La probabilité — 0,45, le même critère que 0,35 transposé

Ethan, 02/09 : « tu augmentes la densité au maximum, je retire le maximum un peu
moins pour que ce soit pas un cadre parfaitement rectangulaire ».

| p | huit voisines | quatre voisines |
| ---: | ---: | ---: |
| 0,35 | 15,66 (96,1 % du plafond) | 25,53 |
| 0,40 | 15,95 | 26,88 |
| **0,45** | 16,22 | **27,83 (96,2 % du plafond)** |
| 0,50 | 16,20 | 28,26 |
| 0,60 | 16,29 | 28,69 |
| 1,00 | 16,18 | 28,94 |

0,45 rend **la même fraction du plafond** que 0,35 en rendait de l'ancien. Au-delà
on ne gagne plus de densité, on ne fait que resserrer le semis.

### Et la carte devient MOINS régulière, pas plus

Sur 12 graines, les deux indicateurs du 02/09 :

| | huit · 0,35 | quatre · 0,45 |
| --- | ---: | ---: |
| bases collées au minimum permis | 90,1 % | **63,2 %** |
| blocs 3 × 3 entièrement vides | 22,4 % | **4,9 %** |

C'est le contraire de la sylviculture qu'Ethan refuse : le monde est plus plein
ET moins régulier.

### Le compte réel, carte entière

| graine | avant | après | |
| ---: | ---: | ---: | ---: |
| 1 | 993 | 1 719 | +73 % |
| 7 | 993 | 1 704 | +72 % |
| 42 | 996 | 1 711 | +72 % |
| 777 | 978 | 1 662 | +70 % |
| 2026 | 984 | 1 667 | +69 % |
| 4242 | 986 | 1 682 | +71 % |

**+72 % en moyenne** — exactement le rapport des deux plafonds structurels.

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

**37 couples sur 322**, tous à partir de la phase 10 — mesuré, pas estimé.

| phase | champs déplacés |
| --- | --- |
| p10 montée | `poisAcquis` |
| p11 raid Ouvrage | `attaque` `poisAcquis` `rapports` `recherche` `sitesEntames` |
| p12 veille du raid | + `nbTicks` `prochaineInstanceSatellite` `reserveReparation` `satellites` |
| p13 après le raid | + `disposition` `economie` `position` |
| p14 sous le feu | idem, moins `sitesEntames` |

⚠⚠ **Les NEUF premières phases sont identiques au bit** — la construction de la
base, son économie, sa garnison, son armée, **et le premier raid sur un camp**.
C'est ce qu'on attend : un camp est de l'HISTOIRE, pas du tirage de carte, et la
garde du peuplement tient les bases de l'Ouvrage à quinze cases du départ.

⚠ **L'attribution est mesurée elle aussi.** En remettant la seule densité d'avant
(`contactDiagonalPermis: false`, `probabiliteCandidate: 0,35`), il n'en reste que
**QUATORZE** : ce sont ceux de l'octogone seul. Les vingt-trois autres sont ceux
de la densité.

### Les scalaires

| scalaire | graines déplacées |
| --- | ---: |
| `nbAttaquantes` | 25 / 25 |
| `raidOuvrage` — nombre de cibles | 25 / 25 |
| `raidOuvrage` — cible choisie | 6 / 25 |
| `raidOuvrage` — empreinte du rapport | 9 / 25 |
| gestes, sauvegarde, cases atteignables, déplacement, **tout `raidProche`** | **0 / 25** |

C'est la signature exacte d'une carte plus dense : plus de bases à portée, plus
de cibles, mais celle que le barème retient ne change que là où une nouvelle
venue coûte moins cher. Et **la sauvegarde ne grandit pas d'un octet** : le lot
ne touche ni l'état ni sa forme.

---

## 6. Vérifications

### Seize falsifications, sur copie fraîche — les seize mordent

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

### Boot sans tête (Chromium, 412 × 915, sur le HTML livré)

- l'écran Options rend la ligne honnête sous une vieille enveloppe (§4) ;
- l'écran Monde dessine le territoire **en octogone** — contour relevé sur la
  capture : rangées de 3 · 5 · 5 · 5 · 3 cases, soit 21, les quatre coins
  rognés ;
- la carte est visiblement plus dense ;
- **zéro erreur de page**.

### Ce qui n'a pas été fait

⚠ **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : le lot
ne touche ni `art/`, ni `tools/`.

⚠ **Aucun essai sur appareil.** Le rendu du territoire et la ligne de mise à jour
sont vérifiés dans Chromium, pas sur ton téléphone.

---

## 7. Fichiers touchés

**Moteur et données** — `src/data/sites.js` (`margeDiagonaleInfluence`,
`probabiliteCandidate`, `basesParDouzeCarre`, `contactDiagonalPermis`),
`src/sim/points-attaque.js` (la forme, une fois), `src/sim/territoire.js`,
`src/sim/fondation.js`, `src/sim/poi.js`, `src/sim/peuplement.js`
(`VOISINES_EXCLUES`).

**Interface** — `src/ui/session.js` (`ligneDeMiseAJour`), `src/index.src.html`
(`data-build`).

**Enveloppe** — `android/maj/.../GestionnaireVersions.kt` (`buildServi`),
`android/maj/.../EtatMiseAJour.kt` (`EN_ATTENTE_DE_RELANCE`,
`verdictSansTelechargement`), `android/app/.../MiseAJour.kt`.

**Tests** — `test/euclide.test.js`, `test/territoire.test.js`,
`test/bases.test.js`, `test/peuplement.test.js`, `test/poi.test.js`,
`test/raid-ouvrage.test.js`, `test/deplacement.test.js`, `test/maj.test.js`,
`test/temoins-bases-0.js`, plus les deux fichiers de test JVM.

### Deux montages tombés pour une raison qui ne les regardait pas

**Un montage qui écrit une coordonnée ne garde que lui-même** — CLAUDE.md l'écrit
depuis le 31/08, et le dépôt l'a payé deux fois de plus aujourd'hui :

- `BASES-1 T15` et `T15 bis` fondaient sur `{ rangee: 283, colonne: 22 }` en dur.
  La carte densifiée y a mis une base de l'Ouvrage à portée : les deux tests ont
  échoué sur « fondation impossible ». Ils DEMANDENT maintenant une case
  fondable au moteur.
- `RAID-B T7` plantait la base en `{ rangee: 255, colonne: 13 }` pour qu'un
  rasage la fasse tomber sur un POI. Les POI ont bougé — ils esquivent les bases
  de l'Ouvrage. Le montage CHERCHE désormais une case qui satisfasse ses deux
  conditions.

Et `DÉPLACEMENT T8` calculait sa cible AVANT un rattrapage de plusieurs heures :
avec 28 bases par 12 × 12, l'Ouvrage rase la base pendant cette fenêtre et la
déplace de vingt cases, si bien que le refus rendu devenait `trop-loin` — une
raison qui ne regarde pas ce test, qui mesure un DÉLAI. La cible se recalcule.

---

## 8. Ce qui t'appartient

1. ⚠⚠ **Le contact diagonal des bases de l'Ouvrage est une LECTURE.** Ton
   message du 29/08 disait « côte à côte — 8 cases autour » ; j'ai gardé la
   première moitié et desserré la seconde, parce que c'est la seule façon
   d'obtenir « davantage ». Si tu voulais garder les 8 cases, la densité est
   **plafonnée à 16** et il n'y a rien à faire de plus.
   `contactDiagonalPermis: false` rend la carte d'avant à l'identique.

2. ⚠⚠ **FONDER se resserre, et au-dessus de la rangée ~272 c'est devenu
   impossible.** Cases fondables dans le disque de rayon 10, sur 40 graines :

   | rangée de la base | avant | après |
   | ---: | ---: | ---: |
   | 295 (le départ) | 261,0 | **261,0** |
   | 290 | 285,4 | 270,0 |
   | 285 | 190,0 | 173,0 |
   | 280 | 98,8 | 83,9 |
   | 275 | 24,1 | 13,6 |
   | 270 et au-delà | 0,7 · 0,8 · 0,4 | **0,0 — sur 40/40 graines** |

   Fonder près du départ reste large ; c'est la dernière fissure au-dessus de la
   rangée 270 qui se referme. **Les deux demandes y contribuent** : plus de bases
   ET un territoire ennemi plus large de huit cases chacune. Le jeu passe donc
   par le rasage, comme depuis BASES-1 — mais plus franchement.

3. ⚠ **Un POI dans un angle rogné n'est plus acquis.** C'est un changement de
   règle, pas un nettoyage. Il rend le relevé cohérent avec ce que la carte
   dessine et avec ce que le raid facture — mais si tu préférais l'ancien carré
   plein, c'est une ligne de `sim/poi.js`.

4. ⚠ **Le rollback de l'enveloppe n'est ni prouvé ni corrigé** (§4). Le prochain
   essai sur ton téléphone tranchera, et le lot est écrit pour que sa réponse
   soit lisible.

**Le merge t'appartient.**
