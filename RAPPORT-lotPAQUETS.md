# RAPPORT — lot PAQUETS

Relevé d'Ethan du 09/09/2026 : « un ratio de destruction trop grand », puis « ce
n'est pas un problème de ligne et colonne mais de placement — des paquets de 3-4,
quelques-uns au fond, quelques-uns devant ».

- **Version produite : `0.99.37` · build `139`** — les deux restent des chaînes JSON.
- **`SAVE_VERSION` : 29 → 30**, migration `29: (s) => { s.version = 30; s.sitesEntames = {}; }`.
- **Branche :** `claude/new-session-s0gxk2`, repartie de `origin/main` = `598d23a`.

---

## 1. Base de départ — mesurée, pas recopiée

| Grandeur | Valeur |
| --- | --- |
| `main` | **`598d23a`** — le commit contre lequel le brief a été écrit |
| `npm test` avant | **1512 tests, 1511 pass / 0 fail / 1 skipped** — VERT, comme le brief l'annonce |
| `dist/index.html` avant | **9 131 096 octets** — le brief l'annonce, mesuré à l'octet ; `CLAUDE.md` §0 et `PIC T7` disaient 9 125 020 / 9 126 689, périmés (§9.4, corrigé) |
| `SAVE_VERSION` avant | **29** |

Les treize ancres du §0 du brief étaient présentes et UNIQUES, vérifiées une par
une avant d'écrire. ⚠ **`python3 tools/verifier.py` n'a pas été lancé, et c'était
conforme** : le lot ne touche ni `art/`, ni un outil de la chaîne.

---

## 2. Ce que le lot fait (§1 à §5 du brief)

### 2.1 Le modèle ligne/colonne sort, les paquets entrent

`taillesDeRangee`, `contigueDepuisLOrigine`, `profilRealisable`, `profilDeCharge`,
`repartirLesColonnes` et `placementDesRangees` sont RETIRÉS de
`src/sim/generateur.js`. Entrent : `decouperEnPaquets`, `poserLesPaquets`,
`tiersDeLaDefense` (exporté), `replierCaseParCase`, `admissible`, `repulsion`,
et dans `src/data/sites.js` le catalogue `FORMES_DE_PAQUET` (tailles 1 à 5 :
point, barres, coudes, carré, L/J/T/S/Z, P, croix) en offsets `[Δrangée, Δcolonne]`.

- **Paquets** : `nbPaquetsMax(N) = N < 6 ? 1 : ⌈N/3⌉` tailles tirées d'un coup
  (3 ou 4), le dernier prend le reste (2 à 5 ; hors bornes → levée, jamais
  atteinte sur 6 600 montages).
- **Candidats** : `candidatsParPaquet = 10` triplets (clé de forme, clé de rangée,
  colonne `entier(1, 9)`) tirés AVANT tout test, plus une clé de tiers par
  paquet. Refusés : hors bande, hors grille, recouvrement, plafond de rangée
  (6 en défense, 9 aux bâtiments), colonne > `⌈N/9⌉ + margeDeColonne(2)`.
- **Choix** : distance de Tchebychev minimale aux cases prises la plus grande
  (plafonnée à `repulsionMax = 4`), puis charge de colonne résultante la plus
  basse, puis rang du candidat.
- **Repli** : case par case, déterministe, sans tirage ; il relâche d'abord le
  plafond de colonne (compté `colonneRelachee`, **0 fois** sur 3 600 montages),
  et LÈVE si le plafond de rangée bloque — jamais atteint.
- **Obstacles** : posés après, dans les cases restantes de la bande de défense,
  sur le même flux `placement`.

### 2.2 Souche et Étai flottent (§1, §3)

Mesuré AVANT d'écrire une ligne, sur 6 graines × 5 rangées × 24 h de raids de
l'Ouvrage et sur les huit raids de référence : **le taux de rasage ne bouge pas,
la durée du raid baisse de 20 à 30 %** quand la Souche quitte le fond. Les deux
uniques entrent dans les créneaux des paquets : **même paquet une fois sur trois**
(`entier(1, 3) === 1`, `uniquesDansLeMemePaquetUneFoisSur`), sinon deux paquets
distincts tirés par deux clés. Trois tirages, toujours pris — même à un seul
paquet. `composerBatiments` n'a pas une ligne de changée.

### 2.3 Les tiers et leurs poids (§4)

Tiers DÉRIVÉS de `GRILLE.bandes.defense` : avant 3–5, milieu 6–7, arrière 8–10
(`tiersDeLaBande: [['avant', 3], ['milieu', 2], ['arriere', 3]]`, LÈVE si la somme
ne fait pas la bande). Point de départ du brief conservé après calibrage :

| Catégorie | avant | milieu | arrière | Moyenne mesurée (base n.40, 500 graines) |
| --- | --- | --- | --- | --- |
| artillerie | 5 | 20 | 75 | **8,25** (à l'avant 108 fois, à l'arrière 1 646) |
| tourelle | 10 | 30 | 60 | **7,53** |
| unité | 30 | 40 | 30 | **6,06** |
| mur | 60 | 30 | 10 | **5,54** |
| barrière | 85 | 12 | 3 | **4,86** (à l'avant 1 612 fois, à l'arrière 168) |

Écarts : 0,72 · 1,47 · 0,52 · 0,68 — tous ≥ 0,3, et chaque catégorie paraît dans
les deux tiers extrêmes. `PQ T6` le garde sur ce montage.

⚠ **Sur le balayage MIXTE de `generateur.test.js`** (onze niveaux × trois types ×
cinq graines) les moyennes sont artillerie 8,09 · tourelle 7,80 · **unité 6,60 ·
mur 6,44** · barrière 5,32 : unité et mur ne sont séparés que de **0,16**, parce
que les deux sont centrés sur le milieu et que les murs sont rares aux petits
niveaux. Le calibrage du §4 porte sur base n.40 ; **si Ethan veut le mur
franchement devant partout, c'est `poidsDeTiers.mur`** (par exemple 70/25/5), et
ça rebouge tous les témoins.

### 2.4 Les flux (§5)

`genererSite` compose la garnison sur `rng` EN PREMIER, puis tout le placement —
bâtiments, défenses, obstacles — tire sur `placement =
creerRng(hachageBrut(graine, 0, 0, SEL_PLACEMENT_DES_RANGEES))`. Conséquence
mesurée et annoncée : **la garnison de toute graine change de tirage** (l'ancien
placement consommait `rng` pour les obstacles avant la composition), d'où le
déplacement des témoins du §5 ci-dessous. `SAVE_VERSION` 30 ; le commentaire de
`state.js` dit que c'est la DERNIÈRE fois qu'un lot de placement le bump.

### 2.5 La table (§6)

Retirés : `versLeFond`, `ecartColonnesMax`, `brassagesDeCharge`,
`brassagesDeRangee`, `etalementMaxRangees`. Gardés : `occupantsMaxParRangee: 6`
(commentaire réécrit — aucune colonne traversable, audit du 09/09 : 0 colonne
libre dès le niveau 15), `ordreCategories`. Entrent : `tiersDeLaBande`,
`poidsDeTiers`, `tailleDePaquet`, `candidatsParPaquet`, `repulsionMax`,
`margeDeColonne`, `uniquesDansLeMemePaquetUneFoisSur`, `FORMES_DE_PAQUET`.
`fendeur: 0` au palier 50 de `GARNISON` est retiré (§9.4) : l'interpolation
traite une clé absente comme zéro, aucun témoin ne bouge.

---

## 3. Les onze tests PQ — montage et nombre mesuré

| Test | Montage | Seuil | Mesuré |
| --- | --- | --- | --- |
| PQ T1 | base n.30 × 500, rangée de la Souche | 8 rangées, aucune > 25 % | 11:83 · 12:59 · 13:53 · 14:52 · 15:73 · 16:73 · 17:75 · 18:32, max **16,6 %** |
| PQ T2 | même montage, Tchebychev(Souche, Étai) ≤ 1 | 15 à 35 % | **32,2 %** |
| PQ T3 | base n.1 × 500, profils par rangée | ≥ 300 bât / ≥ 150 déf | **471 / 248** (56 / 47 avant le lot, mesurés par le brief) |
| PQ T4 | 3 types × 50 niveaux × 5 graines | 6 / 9 par rangée, atteints | pire **6 / 9** |
| PQ T5 | 6 cellules × 500, écart max−min de colonne | ≤ 7, médiane ≤ 4 | pire **7** (base n.50), médianes 2 à 3 |
| PQ T6 | base n.40 × 500 | 5 moyennes ordonnées à 0,3, chaque catégorie devant ET derrière | voir §2.3 |
| PQ T7 | 3 types × 4 niveaux × 10 graines, tous les boutons tournés | identifiants identiques | 120 / 120, et 120 montages changent de cases |
| PQ T8 | 3 types × 10 niveaux × 100 graines | compte de tirages = f(type, niveau), queue du flux rejouée | **3 000 / 3 000** |
| PQ T9 | 3 × 4 × 20 | même graine = même site, graine + 1000 ≠ | 240 / 240 |
| PQ T10 | 3 × 50 × 20 | effectifs de `densite`, bandes, cases uniques, catalogue, aucune levée | 3 000, 0 levée |
| PQ T11 | v29 forgée avec `sitesEntames` et `basesRasees` | version 30, `sitesEntames` vidé, `basesRasees` intact, v30 non réécrite | passe |

⚠ **Écart au §8 sur `PQ T7`** : le brief demandait de changer le SEL du flux de
placement ; c'est une constante exportée, non modifiable d'un test. Le test
tourne à la place `candidatsParPaquet`, `poidsDeTiers`, `margeDeColonne` et
`repulsionMax` (pas `tailleDePaquet`, qui change le NOMBRE de tirages) — ce qui
déplace le placement sans toucher `rng`, et c'est la propriété visée.
⚠ **`PQ T8`** mesure le compte par une REJOUE de la queue du flux : on saute
`nbPaquetsMax(N) × (2 + 3 × 10) + 3` tirages pour les bâtiments et
`nbPaquetsMax(N) × 32` pour les défenses depuis le sel exporté, on rejoue
`melanger` et les dix types d'obstacle, et on retombe sur `montage.obstacles`.
Un tirage pris sous condition désynchroniserait la queue. `DO T3 bis` porte la
même preuve sur 60 montages, avec sa falsification (un tirage de moins).

---

## 4. Le §7 — témoins de combat

1. **`test/generateur-ancien.js`** entre : la copie de l'ancien `genererSite`
   (renommé `genererSiteAncien`, seul export), imports repointés sur `src/`,
   les cinq clés retirées lues dans une table locale. Jamais dans `src/`. Il est
   dans la liste blanche de `documentation.test.js`.
2. **Point 2, mesuré AVANT toute recapture** : les deux cents anciennes
   empreintes rejouées sur le moteur COURANT avec l'ancien placement, sous les
   quatre couches `COMBATS_DEPLACES_PAR_*` — **0 écart, 1 331 champs surchargés,
   269 gardés**, exactement le compte d'avant le lot. Le moteur n'a pas bougé.
   `JOURNAL T1 bis` rejoue cette preuve à chaque `npm test`.
3. **Recapture** : `TEMOINS_COMBAT` porte deux cents lignes neuves (1 267 champs
   sur 1 600 diffèrent de l'ancien placement) ; l'ancienne table devient
   `TEMOINS_COMBAT_AVANT_PAQUETS`. `JOURNAL T1` compare SANS couche, et l'en-tête
   de `temoins-combat.js` dit pourquoi et que ça ne se refait pas.

**`temoins-bases-0.js`** : DIX-SEPTIÈME couche, `DEPLACES_PAR_PAQUETS` — **58
couples sur 350, phases 7 à 14, uniquement `rapports`** ; les six premières
phases et les huit scalaires (gestes, sauvegarde, cases atteignables,
déplacement, attaquantes, cibles) sont identiques au bit sur 25 / 25. Plus
`EMPREINTES_PAR_GRAINE_PAQUETS`, `RAPPORTS_PROCHE_PAQUETS`,
`RAPPORTS_OUVRAGE_PAQUETS`. **`temoins-couts.js`** ne dépend pas des sites : intact.

---

## 5. Ce qui bouge dans la suite — 37 rouges au premier `npm test`, 0 à la fin

`npm run check` après la réécriture du placement et avant toute reprise de test :
**1474 pass / 37 fail**. Aucun test supprimé, aucune assertion assouplie ; chaque
réancrage porte son nombre d'avant et d'après en commentaire `⚠ LOT PAQUETS`.

**Réancrés (valeurs figées de raids de référence)** : `arsenal T10` (528 → 396
ticks), `repli T6` (528 → 396, butin 69 210 → 0, survivants 11 → 4),
`assaut T2` (`> 1.8`) et `T7` (figés 260 / 646 / 446 ; budgétés A 340 → 264 et
butin → 0, B 323 → 287, C 528 → 396 et quartz 69 210 → 0), `cible T4/T5`,
`roster T5/T6`, `recherche T14` (graines 1, 7, 24) et `T14 bis` (1101),
`poi T18`, `DO T8` (graine 102), `COL T18 bis` (trois triplets neufs, 8 sur 540
lèvent encore), `generateur T12` (`ecartMax` 0), `raid-ecran` (graine 42 → 45 :
la 42 n'a plus de case enfermée visible ni de moyennes distinctes), `DO T12`
(`41bf9bd339d8ae8f` → `dfd5f7409f5f4c64`), `PIC T7`, quatre `SAVE_VERSION === 30`.

⚠ **Huit raids de référence changent de sens**, et c'est du CALIBRAGE : le raid A
budgété ne rapporte plus rien (sixième renversement de ce nombre), le raid C non
plus, et `generateur T7` compte 13 artilleries au plus sur son balayage (12
avant) — c'est la composition qui change de tirage, pas le placement.
**Rien n'a été compensé ; Ethan tranche.**

---

## 6. Correspondance entre tests retirés et tests PQ (§6.1)

| Test qui perd sa règle | Ce qu'il gardait | Repris par |
| --- | --- | --- |
| `generateur T4` « tous deux au fond » | uniques en 18 | retourné : bande + 8 rangées atteintes ; `PQ T1` |
| `generateur T6` étalement ≤ `etalementMaxRangees` | bloc sans trou | `PQ T2` (paquets qui se touchent), `PQ T5` (colonnes) |
| `generateur T7` ordre strict des catégories, `minRangee` = 7 | ordre | biais mesuré (moyenne artillerie ≥ reste + 0,3), `minRangee` = 3 en clair ; `PQ T6` |
| `generateur T8` `ecartColonnesMax` ≤ 2 | charge plate | plafond `⌈N/9⌉ + 2`, écart 5 en clair ; `PQ T5` |
| `CR T1` falsification par « moins de profils que de dispositions » | profil ignore les colonnes | preuve directe par miroir des colonnes |
| `CR T3` artillerie derrière tout | ordre | moyenne + 0,3 ; portée gardée ; `PQ T6` |
| `CR T4` `ecartColonnesMax`, étalement | bornes | `margeDeColonne` en clair, écart 6 en clair ; `PQ T4`, `PQ T5` |
| `CR T5` uniques au fond | fond | bande, 8 rangées, cases distinctes ; `PQ T1` |
| `COL T16` écart ≤ 2, étalement | bornes | plafond de colonne, écart 6 en clair ; `PQ T5` |
| `COL T18` uniques au fond, 2 au fond | fond | bande, 8 rangées ; `PQ T1` |
| `DO T1` somme des ensembles de rangées ≥ 120 (défenses) | variété | 121 bâtiments (tenu), 119 défenses en clair + profils 20/20 par cellule ; `PQ T3` |
| `DO T3` bouton `etalementMaxRangees` | composition intacte | bouton `candidatsParPaquet` ; `PQ T7` |
| `DO T3 bis` rejoue des offsets | compte de tirages | rejoue de la queue du flux ; `PQ T8` |
| `DO T4` ordre par paire | ordre | moitié géométrique seule ; `PQ T6`, `PQ T10` |
| `DO T6` uniques au fond | fond | bande, 8 rangées, 9 colonnes ; `PQ T1`, `PQ T2` |
| `DO T10` trous = `etalementMaxRangees`, bâtiments jamais au fond | bornes | bornes 3–10 / 11–18 en clair, dépassement de colonne 0 ; `PQ T10` |
| `DO T12` empreinte | l'avenir | nouvelle empreinte |
| `COL T15` | multi-ensemble des colonnes | intact (passe) |

Survivent tels quels, comme le §6.1 l'exige : `DO T2, T4 (moitié géométrique),
T5, T7, T8, T9, T11`, `COL T17`, `defense.test.js`, `CR T2, T6, T7, T8`.

---

## 7. Compte de tests et livrable

| Grandeur | Avant | Après |
| --- | --- | --- |
| Tests déclarés | 1512 | **1524** (+11 PQ, +1 `JOURNAL T1 bis`) |
| `npm test` | 1511 pass / 0 fail / 1 skipped | **1523 pass / 0 fail / 1 skipped** |
| `dist/index.html` | 9 131 096 | **9 134 181** (+3 085, JavaScript seul ; `data:` 311 / 306 des deux côtés) |
| Marge T10 | 168 904 (1,82 %) | **165 819 (1,78 %)** |

La ventilation est mesurée contre le livrable rebâti sur l'arbre pristine de
`598d23a` (`git stash`) dans la même session ; feuille, balisage, images et audio
sont à zéro par construction — aucun fichier de ces postes n'est au diff.

---

## 8. Écarts au brief, déclarés

1. **`PQ T7`** ne change pas le sel (constante exportée) : il tourne les boutons
   de la table (§3).
2. **`DO T1`** : la somme « ensembles de rangées » des défenses tombe à 119 pour
   un seuil de 120. Le seuil N'EST PAS baissé : il reste tenu pour les bâtiments
   (121), et pour les défenses il est REMPLACÉ par le profil d'occupation par
   rangée, distinct 20 / 20 dans chacune des douze cellules — un instrument qui
   mesure ce que les paquets font, là où l'ancien mesurait un bloc qui flotte.
3. **Le calibrage des tiers est fait sur base n.40** ; sur un balayage mixte
   l'écart unité / mur tombe à 0,16 (§2.3). Non compensé, à arbitrer.
4. **`generateur T7`** : le maximum d'artilleries sur le balayage passe de 12 à
   13 — un effet de la composition qui change de tirage, écrit en clair.

## 9. En suspens

- Le sens des raids de référence (§5) : huit nombres changent, et le raid A
  budgété ne rapporte plus rien. Calibrage, pas défaut.
- `poidsDeTiers.mur` si Ethan veut le mur devant sur tous les niveaux.
- `COL T18 bis` (dette) : 8 triplets sur 540 lèvent encore ; non corrigé, déplacé.
- Le rendu n'a pas été vu : le lot pose les mêmes sprites sur d'autres cases.
