# RAPPORT — lot 4B : les bâtiments, et des assauts qui respectent le budget

## Ce qui est livré

| | |
|---|---|
| `version` | **0.9.0** (0.8.0 → 0.9.0) |
| `config.build` | **9** (8 → 9) |
| `dist/index.html` | **58 186 octets, 56,8 Kio** (lot 4A : 54,6 Kio) |
| `npm run check` | build + **122 tests, tous PASS** (114 → 122) |
| Source des PV | `RELEVE-TA-COURBES-2.md` §6.5 |
| `.xlsx` ouverts | **aucun** |

---

## 1. Fichiers touchés

| Fichier | Lignes | Nature |
|---|---|---|
| `src/data/sites.js` | 21‑46 (les cinq PV), 191‑226 (`PROFILS_ASSAUT`, `EMPLACEMENTS_ASSAUT`) | les cinq PV, les trois profils |
| `src/sim/generateur.js` | 22‑34 (imports), 432‑470 (`tirerSousBudget`), 504 (appel), 526‑638 (`genererAssaut`) | le générateur d'assaut |
| `src/ui/banc.js` | 18‑57 (retrait des préréglages), 58‑77 (`montageDuBanc`) | le banc passe au budget |
| `test/assaut.test.js` | 411 lignes (nouveau) | T1 à T8 |
| `test/prereglages-lot3a.js` | 62 lignes (nouveau) | le témoin historique, hors de `src/` |
| `test/banc.test.js` · `combat.test.js` · `cible.test.js` · `repli.test.js` · `roster.test.js` | voir §8 | seuils déplacés |
| `package.json` | 3, 8 | version et build |

---

## 2. Défaut 1 — les cinq bâtiments

Convertis depuis le §6.5 du relevé. La correspondance était déjà portée par le
champ `ta` de chaque ligne, elle n'a pas eu à être devinée :

| bâtiment | `ta` | équivalent au relevé | PV avant | **PV après** | facteur |
|---|---|---|---|---|---|
| `souche` | Chantier de construction | Construction Yard | 400 | **5 500** | ×13,75 |
| `etai` | Complexe de défense | Defense Facility | 300 | **2 500** | ×8,33 |
| `noeud` | Collecteur | Harvester | 200 | **1 500** | ×7,5 |
| `gangue` | Silo de tiberium | Silo | 150 | **1 000** | ×6,67 |
| `terril` | Silo de cristal | Silo | 150 | **1 000** | ×6,67 |

Rien d'autre ne bouge dans `sites.js` : parts, indices de butin, ressources,
`raseLeSite`, `reparationDefenses` sont inchangés, et T1 les assère un par un.

### Le rapport de masse s'inverse, mesuré sur quinze sites

Pas sur un, pour que le résultat ne tienne pas à un tirage heureux. PV au niveau 1
(à un site de niveau 15, `facteurMilli` multiplie les deux colonnes par le même
28 974 et le rapport ne bouge pas) :

| | bâtiments / défenses |
|---|---|
| avant | **0,30 à 0,46** — les défenses pesaient deux à trois fois les bâtiments |
| après | **2,35 à 3,75** — les bâtiments pèsent deux à quatre fois les défenses |

Le brief annonce « 80 000 contre 348 000 avant, 652 000 contre 348 000 après »,
soit un renversement d'un cinquième à 1,6 fois. **Ces nombres ne se retrouvent
sur aucun de nos sites** — ils viennent d'une composition que le brief ne
précise pas. Le renversement, lui, se retrouve partout, et plus nettement encore.

### Les trois raids de référence, à assaut FIGÉ

C'est la ligne que le brief demandait de reproduire, et elle se reproduit **au
tick et au quartz près** :

| | brief §2 | mesuré |
|---|---|---|
| A · avant-poste 15 · infanterie | 321 t, 102 quartz | **321 t, 102 quartz** |
| B · camp 15 · blindé lourd | 583 t, `souche` | **583 t, `souche`** |
| C · camp 15 · infanterie | 551 t, 65 291 quartz | **551 t, 65 291 quartz** |

C'est ce qui valide la conversion des PV **isolément**, avant que le budget ne
vienne s'y ajouter.

---

## 3. Défaut 2 — le budget d'armée

`genererAssaut({ niveau, budgetPoints, profil, graine })`, dans
`src/sim/generateur.js`.

### Une seule mécanique, pas deux

Le brief demande de réutiliser celle de `genererVague` plutôt que d'en écrire une
seconde. La boucle de tirage pondéré sous contrainte de budget a donc été
**extraite** de `genererVague` en `tirerSousBudget(rng, repartition, budget,
maxEmplacements)`, et les deux générateurs l'appellent. L'extraction est
bit-à-bit : les dix-sept tests du lot 2B passent sans qu'une seule valeur bouge,
ce qui prouve que la consommation du PRNG n'a pas changé d'un tirage.

Un profil n'est pas une liste d'unités mais des **proportions de châssis**, en
pour-cent. Elles viennent des préréglages du lot 3A, mesurées en points d'armée
et arrondies au dixième — les trois profils gardent l'identité qu'Ethan leur a
donnée, seule leur taille devient fonction du niveau :

| profil | mesuré sur le préréglage | retenu |
|---|---|---|
| Infanterie | escouade 100 % | 100 / 0 / 0 |
| Blindé lourd | blindé 100 % | 0 / 100 / 0 |
| Mixte | escouade 32 %, blindé 41 %, aéronef 27 % | **30 / 40 / 30** |

Le CHOIX des unités dans un châssis reste gouverné par `VAGUES.parNiveau`, la
seule table qui dise quelle unité a sa place à quel niveau. En écrire une seconde
pour le joueur aurait dupliqué un barème, ce que les conventions interdisent.

### Composition produite, graine 1

| niveau | budget | profil | engagés | composition |
|---|---|---|---|---|
| **10** | 70 | Infanterie | 70 | Meute ×9, Carapace ×2, Perceurs ×1 |
| | | Blindé lourd | 70 | ⚠ Crécelle ×2, Meute ×8, Perceurs ×2 |
| | | Mixte | 70 | Crécelle ×4, Meute ×1, Carapace ×2, Perceurs ×1 |
| **25** | 145 | Infanterie | 145 | Meute ×5, Guetteur ×3, Carapace ×9 |
| | | Blindé lourd | 140 | Ratisseur ×1, Fendeur ×10, Bélier ×3 |
| | | Mixte | 145 | Crécelle ×3, Guetteur ×3, Meute ×1, Busard ×2, Carapace ×2, Fendeur ×1, Fouisseurs ×1, Frappeur ×1, Bélier ×1 |
| **40** | 220 | Infanterie | 220 | Guetteur ×13, Carapace ×4, Fouisseurs ×5 |
| | | Blindé lourd | 220 | Ratisseur ×10, Broyeur ×2, Bélier ×6, Pilon ×2 |
| | | Mixte | 220 | Guetteur ×5, Ratisseur ×3, Busard ×2, Carapace ×1, Frappeur ×3, Fouisseurs ×4, Enclume ×2, Bélier ×1 |

---

## 4. ⚠ Défaut 3 — celui que le brief ne mentionne pas

**Les préréglages figés alignaient des unités VERROUILLÉES au niveau du site.**

| préréglage | au niveau 15, unités que le joueur ne peut pas posséder |
|---|---|
| Infanterie | Guetteur (débloqué au 22), Fouisseurs (au 24) |
| **Blindé lourd** | **Broyeur (au 28), Pilon (au 32)** |
| Mixte | Bélier (au 16), Frappeur (au 20), Pilon (au 32) |

C'est le plus lourd des trois défauts, et c'est lui qui explique le résultat le
plus commenté du lot 4A : **si B rasait la Souche au niveau 15, c'est qu'il y
amenait du blindé de fin de partie.** Un Broyeur au niveau 15 est une unité que
le joueur n'aura pas avant treize niveaux, un Pilon avant dix-sept.

`genererAssaut` ne peut pas commettre cette faute : le filtre `apparition ≤
niveau` est celui de `composerRepartition`, et T3 le vérifie sur les cinquante
niveaux et les trois profils.

---

## 5. ⚠ Deux contraintes structurelles, dont une contredit le brief

### Le plafond de 36 ne mord JAMAIS

Le §3 du brief demande de consigner que le plafond de quatre vagues de neuf mord
avant le budget à partir du niveau 32 — « 36 × 5 = 180 ≤ 20 + 5 × 32 ». **Mesuré :
il ne mord à aucun niveau.** Le maximum observé, sur les trois profils, cinquante
niveaux et huit graines, est de **27 emplacements** (Infanterie, niveau 50).

Le calcul du brief suppose que l'unité à 5 points reste disponible. Le Fusilier et
les Perceurs le sont au sens du DÉBLOCAGE — apparitions 0 et 4 — mais
`VAGUES.parNiveau` cesse de les aligner : plus de Fusilier au-delà du niveau 30,
plus de Perceurs au-delà du 35. Au niveau 50, les seules escouades retenues sont
le Guetteur et les Fouisseurs, à 10 points pièce : 270 / 10 = **27 unités au
plus**.

Le plafond existe et il est tenu — T6 le prouve en desserrant la seule contrainte
qui mordait, avec un budget de 1 000 puis 10 000 points : la composition
s'arrête exactement à 36, en quatre vagues de neuf, et ne tente pas de 37ᵉ. Mais
**au budget nominal, c'est toujours le budget qui borne.**

### Aucun blindé avant le niveau 12, aucun aéronef avant le 10

| châssis | premier déblocage |
|---|---|
| escouade | Meute, niveau **0** |
| aéronef | Crécelle, niveau **10** |
| blindé | Fendeur, niveau **12** |

Un assaut « blindé lourd » est donc **impossible à honorer** en dessous du niveau
12. La part du châssis manquant se reporte sur les châssis présents ; si aucun
n'est présent, le générateur retombe sur la répartition nue et le signale par
`profilRespecte: false`. Il ne fabrique jamais une unité qui n'existe pas encore.

C'est ce qui explique les ⚠ du tableau du §3 : au niveau 10, « blindé lourd »
livre huit Fusiliers et deux Crécelles.

---

## 6. La mesure qui justifie le lot

Une passe se simule en rejouant le montage : les entités détruites sont retirées,
les PV des survivantes reportés, aucune réparation entre les passes. L'assaut est
refait à chaque passe — le joueur reconstruit son armée, et à graine fixe il
reconstruit la même. Fin quand la Souche tombe ou qu'il ne reste aucun bâtiment.
Au-delà de six passes, on note `>6`.

**Le harnais est validé** : rejoué sur les préréglages figés, à graine 1, il
reproduit le tableau du §4 du brief case pour case.

### Avant — préréglages figés, bâtiments convertis (l'artefact)

| cas | niv 10 | 15 | 25 | 40 |
|---|---|---|---|---|
| camp · blindé lourd | 1 (1–1) | 1 (1–2) | 3 (2–3) | 3 (3–5) |
| camp · infanterie | 1 (1–2) | 2 (2–5) | 5 (3–>6) | 6 (6–>6) |
| avant-poste · blindé lourd | 1 (1–2) | 1 (1–2) | 4 (3–5) | 4 (4–>6) |
| avant-poste · infanterie | 1 (1–2) | 3 (3–5) | >6 (6–>6) | >6 (tous >6) |

### Après — assauts au budget

| cas | niv 10 | 15 | 25 | 40 |
|---|---|---|---|---|
| camp · blindé lourd | >6 (2–>6) | 4 (4–5) | **2** (2–4) | **2** (1–2) |
| camp · infanterie | >6 (2–>6) | 6 (2–6) | >6 (2–>6) | **2** (2–>6) |
| avant-poste · blindé lourd | >6 (2–>6) | 6 (6–6) | 3 (3–6) | 3 (2–3) |
| avant-poste · infanterie | >6 (2–>6) | >6 (3–>6) | >6 (3–>6) | 4 (3–>6) |

*(graine 1, puis l'étendue sur cinq graines entre parenthèses)*

### Ce que ça dit

**Le tableau n'est pas plat, et il penche dans l'autre sens.** Le tableau figé
montait avec le niveau ; le tableau budgété **descend** — beaucoup de passes en
bas, peu en haut. L'artefact était bien celui que le brief décrivait, mais le
corriger n'a pas révélé une courbe plate : il a révélé une courbe inverse.

**Ce n'est pas un effet de masse.** Le rapport PV du site / PV de l'assaut est
remarquablement stable — mesuré de 2,07 à 2,98 entre les niveaux 10 et 50, sans
tendance. L'invariance en miroir tient sur la masse, comme elle le doit.

**C'est un effet de composition.** Les dégâts anti-structure de l'assaut, par
point d'armée dépensé, ne sont pas monotones du tout :

| niveau | Infanterie | Blindé lourd | Mixte |
|---|---|---|---|
| 10 | 1,43 | 1,86 | 1,31 |
| 15 | 1,69 | 1,00 | 1,11 |
| 20 | 1,35 | 1,17 | 1,31 |
| 25 | 0,70 | 1,36 | **3,28** |
| 30 | 3,11 | 1,53 | **7,94** |
| 40 | 1,48 | 1,98 | **5,91** |
| 50 | 2,27 | 1,42 | **5,95** |

Le saut de « Mixte » au niveau 25 est l'entrée du Frappeur, qui frappe à 300 PV
contre les bâtiments quand un Fusilier en met 7. Le creux d'« Infanterie » au
niveau 25 est l'inverse : la table y donne beaucoup de Carapaces, anti-véhicule,
qui ne font que 6 contre une structure.

**Ce qu'Ethan a à trancher n'est donc pas une courbe de difficulté mais un
problème de disponibilité.** Aux bas niveaux, le joueur n'a ni blindé ni
anti-structure sérieux, et 70 points de Fusiliers ne viennent pas à bout d'un
camp de onze bâtiments. Aux hauts niveaux, une seule unité — le Frappeur — décide
du résultat. L'ancre « deux passes » n'est tenue qu'en un seul point :
**camp · blindé lourd aux niveaux 25 et 40**.

⚠ **Rien n'a été recalibré.** Ni densité, ni PV, ni budget. Le brief l'interdit
et le §7 le contrôle.

---

## 7. Les 54 raids de niveau 15

| | avant le lot | **après** |
|---|---|---|
| `attaquants` | 35 | **52** |
| `souche` | 18 | **0** |
| `duree` | 1 | **2** |

**Plus aucun site n'est rasé au niveau 15.** C'est la conséquence directe des
deux corrections cumulées : les bâtiments pèsent huit fois plus, et l'assaut ne
peut plus tricher sur son budget ni sur ses déblocages.

Les deux raids qui touchent le plafond de 900 ticks — `infanterie/base/11` et
`blindeLourd/base/11` — **ne sont pas des gels**. Vérifié en levant le plafond :
ils se concluent d'eux-mêmes aux ticks **1084** et **1964**, par `attaquants`.
Ce sont des combats trop longs, pas des combats sans issue. Le point signalé au
lot 4A s'aggrave donc : la marge sous les 90 secondes n'existe plus.

---

## 8. Les seuils déplacés, avec leurs deux valeurs et la raison

**Aucun n'est une régression.** Deux causes seulement : les PV de bâtiments, et
le passage de l'assaut au budget.

| test | avant | après | raison |
|---|---|---|---|
| combat T5 bis | Gangue 101 000, butin 294 | **951 000**, butin **44** | Gangue 150 → 1 000 PV. Le butin suit la FRACTION détruite, qui est cinq fois moindre |
| combat T11 | Souche au tick 8 | tick **110** | Souche 400 → 5 500 PV. `ceil(5 500 000 / 50 000) = 110`, exactement |
| combat T12 | 3 ticks, 75 000 perdus | **20 ticks**, **500 000** | Gangue ×6,67 ; la moitié se fait en 20 ticks. **Le butin, lui, ne bouge pas** : 450 quartz avant comme après — la preuve que l'économie n'a pas été touchée |
| cible T3 | Gangue 150 000 | **1 000 000** | idem |
| cible T4 | `souche` t419, 299 878 q, 4 surv. | **`attaquants` t383**, **2 656 q**, 2 surv. | bâtiments ×8 **et** le préréglage ne peut plus aligner Broyeur ni Pilon |
| cible T5 | 1 raid par `duree` | **2 raids** | combats plus longs (§7) |
| cible T6 | Gangue 125 000 | **975 000** | Gangue ×6,67 |
| repli T6 (raid C) | 66 992 q, 6 surv., t471 | **26 319 q**, **7 surv.**, **t315** | bâtiments ×8 et budget de 95 points |
| roster T6 (A·B·C) | 321 · 267 · 471 | **434 · 409 · 315** | les deux causes |
| banc — montage | « 3 ou 4 vagues » | **1 à 4 vagues** | un assaut budgété n'a qu'une vague au niveau 5, où 45 points n'achètent que neuf Fusiliers. Le test tient désormais le PLAFOND, pas un plancher arbitraire |

### Un seuil qui n'a PAS bougé, et pourquoi c'est la preuve

**Le butin de combat T12 : 450 quartz avant, 450 après**, alors que la Gangue
quintuple de PV. Le butin est proportionnel à la *fraction* détruite, jamais aux
PV absolus. La moitié d'une Gangue paie 450 quartz qu'elle en ait 150 ou 1 000.
C'est ce qui montre que le lot n'a pas fui dans l'économie.

---

## 9. Tests

| | ce qu'il tient | résultat |
|---|---|---|
| **T1** | les cinq PV égalent le §6.5, parts et indices de butin inchangés | **PASS** |
| **T2** | le renversement du rapport de masse, sur **quinze** sites | **PASS** |
| **T3** | 50 niveaux × 3 profils : budget tenu, aucune unité verrouillée, ≤ 36 emplacements, ≤ 9 par vague, colonnes distinctes, `creerCombat` accepte | **PASS** |
| **T4** | l'assaut croît strictement du niveau 10 au 40, et de dix en dix jusqu'à 50 | **PASS** |
| **T5** | déterminisme : même graine même assaut, deux graines deux assauts, montage du banc reproductible | **PASS** |
| **T6** | le plafond de 36 est tenu à budget desserré ; **et il ne mord jamais au budget nominal** | **PASS** |
| **T7** | A · B · C, les deux séries, plus la cause du renversement de B | **PASS** |
| **T8** | le tableau des passes, **imprimé et non asséré** | **PASS** |

**T9 — non-régression** : les 114 tests antérieurs passent, seuils mis à jour au §8.
**T10 — build hors ligne** : `npm run build` passe, **58 186 octets**, aucune URL.

### Vérifié dans un vrai navigateur

Chromium, réseau coupé (toute requête non-`file:` avortée) : raid
`Mixte / camp 40 / riche en quartz / graine 1` joué jusqu'à sa fin au tick 470,
légende ouverte et refermée, inspecteur cliqué. **0 requête sortante, 0 erreur de
page, 0 erreur console.**

---

## 10. Les six contrôles du §7

| contrôle | état |
|---|---|
| les cinq PV viennent du §6.5, aucun arrondi ni ajustement | ✔ T1 les compare un par un à la transcription |
| `genererAssaut` réutilise la mécanique de `genererVague` | ✔ `tirerSousBudget` extrait et appelé par les deux ; extraction bit-à-bit, les 17 tests du lot 2B passent inchangés |
| aucun recalibrage sous couvert de mesure | ✔ `DENSITE`, `GARNISON`, `POINTS_ARMEE`, `VAGUES` intacts ; T8 imprime au lieu d'asserter |
| aucun bâtiment de la base du joueur ajouté | ✔ `BATIMENTS` compte toujours cinq lignes, T1 le vérifie |
| `npm run check` passe | ✔ build + **122 tests PASS** |
| aucun `.xlsx` ouvert | ✔ |

---

## 11. Écarts par rapport au brief

1. **Le plafond de 36 ne mord jamais** (§5). Le brief demandait de consigner qu'il
   mord à partir du niveau 32 ; la mesure dit le contraire, et T6 le documente
   plutôt que de l'asserter faussement.
2. **T6 réécrit.** Le brief l'énonce comme « au niveau 50, la composition atteint
   36 emplacements » — impossible, les escouades y coûtant 10 points. Le test
   éprouve la même chose autrement : à budget desserré, la composition s'arrête
   exactement à 36.
3. **T2 mesuré sur quinze sites, pas un**, et sans les nombres du brief (80 000 /
   348 000 / 652 000), qui ne se retrouvent sur aucune de nos compositions.
4. **`PREREGLAGES` sorti de `src/`.** Le brief dit que le banc n'emprunte plus les
   préréglages ; ils ne servaient plus qu'à mesurer l'écart de ce lot. Les
   laisser dans `src/ui/banc.js` coûtait **1 187 octets** au fichier HTML hors
   ligne. Ils vivent dans `test/prereglages-lot3a.js`, avec les tests qui s'en
   servent, et le fichier porte sa date de péremption.
5. **`profilRespecte` ajouté** au retour de `genererAssaut` (§5). Non demandé,
   mais un « blindé lourd » qui livre des Fusiliers doit le dire.
6. **`degatsParcours` et `reparation`** du lot 4A restent rangés et non câblés,
   comme convenu.

---

## 12. Points laissés en suspens

**La marge sous 900 ticks a disparu.** Signalée au lot 4A avec un raid sur 54 ;
elle en concerne deux, et les dépassements sont bien plus larges — 1084 et 1964
ticks contre 907. Trois issues, inchangées depuis le lot 4A : ne rien faire,
porter le plafond à 100 ou 120 secondes, ou revoir T. Ma recommandation change :
**porter le plafond**, parce qu'un combat qui a besoin de deux fois le temps
imparti n'est plus une queue de distribution.

**L'ancre « deux passes » n'est pas tenue.** Elle l'est en un point sur seize.
C'est le résultat que le lot devait produire, et il appelle un arbitrage sur la
densité ou sur le budget — pas sur les deux à la fois, sous peine de rendre la
mesure suivante illisible.

**Aucun anti-structure sérieux avant le niveau 20.** Les Perceurs (25 PV contre
une structure, débloqués au 4) sont la seule réponse jusqu'au Frappeur du niveau
20 et aux Fouisseurs du 24. C'est pourquoi les bas niveaux demandent plus de six
passes. Une piste, à ne pas prendre sans arbitrage : avancer l'apparition des
Fouisseurs.

**Le franchissement des barrières** reste décroché de l'échelle des PV (lot 4A),
et **le gel à 0 ‰** reste ouvert.

**Hors périmètre, comme demandé** : les bâtiments de la base du joueur, la vitesse
en ×2/3 en défense, l'écrasement par dégâts, les classes de blindage.

---

## 13. Ce qu'Ethan doit regarder au banc

### `Mixte / camp / niveau 40 / riche en quartz / graine 1`

**C'est la première fois qu'une armée de la taille que le jeu autorise vraiment
entre sur la grille** : 220 points, 21 unités, trois vagues — Guetteur ×5,
Ratisseur ×3, Busard ×2, Carapace ×1, Frappeur ×3, Fouisseurs ×4, Enclume ×2,
Bélier ×1. Les préréglages n'en alignaient que douze, pour 110 points, quel que
soit le niveau.

Le raid se conclut au **tick 470**, aucun survivant, 11 859 904 quartz de butin.
Trois choses à regarder :

- **la grille est pleine** — neuf colonnes occupées à chaque vague, ce que le banc
  n'avait jamais montré ;
- **les trois Frappeurs**, qui décident du résultat à eux seuls contre les
  bâtiments ;
- **la Souche à 5 500 PV**, qui tient enfin devant l'assaut au lieu de tomber en
  huit ticks.

### Et le contraste : `Mixte / camp / niveau 10 / graine 1`

70 points, huit unités, une seule vague. Le site a onze bâtiments. **Plus de six
passes** pour le raser. C'est le bas de la courbe, et c'est là que l'arbitrage se
joue.
