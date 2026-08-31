# Rapport — lot MODULES-F

**Munition spéciale, Vol de vie, et le canal de l'Ouvrage.**

- Version livrée : **0.56.0 · build 57** (`origin/main` était à 0.55.0 · 56 ;
  c'est la seule branche distante, 57 était libre).
- `npm run check` → **731 pass / 0 fail** (718 au départ, +13 tests).
- `dist/index.html` → **1 264 511 octets**, soit **+933** sur la base
  (1 263 578). Enveloppe annoncée : 2 500. Marge au plafond de 1 300 000 :
  **35 489 octets, 2,73 %**.
- `node tools/audit-maquette.mjs` → **ROUGE, 7 écarts, code 1** — sortie
  **identique à l'octet** à celle de `origin/main`, `diff` vide.
- `SAVE_VERSION` **inchangé à 14**. Aucun champ de sauvegarde, aucun écran.
- Ni `art/` ni `tools/*.py` touchés.

---

## 1. Le balayage du §1.1, refait

Le brief demandait de le refaire et de publier la table. **Elle concorde,
module par module, porteur par porteur, niveau par niveau.**

| Module | Porteurs | `apparitionModule` |
|---|---|---|
| `camouflage` | carapace, fouisseurs | 28, 38 |
| `munitionSpeciale` | casemate, batterie, creneau | 30, 34, 38 |
| `pvPlusVingt` | merlon, herse, ronce | 32, 34, 38 |
| `rayonMiniMoinsUn` | faucheuse, mortier, harpon | 42, 44, 46 |
| `volDeVie` | broyeur, enclume | 42, 46 |

23 pièces au total, 5 modules distincts, aucune pièce sans `apparitionModule`.
Niveaux d'armement : **28, 30, 32, 34, 38, 42, 44, 46**.

⚠ **Un écart de compte dans le brief.** Il écrit « Treize pièces sur vingt-trois
n'ont **aucun** `moduleOuvrage` ». Mesuré : **treize pièces EN ONT un, dix n'en
ont pas.** Le sens de la phrase est inversé ; les listes, elles, sont exactes.

⚠ **Découverte utile pour T1 : les trois porteuses de la Munition spéciale
couvrent les trois colonnes.** Casemate {20, 7, 8} → `infanterie`, Créneau
{10, 35, 0} → `vehicule`, Batterie {0, 0, 40} → `structureOuAviation`. La grille
de T1 est donc complète : aucune colonne n'est testée par une seule porteuse.

---

## 2. Ce qui a été écrit

### Munition spéciale — dans `degatsContre`, pas dans `tir`

`degatsContre` prend `etat` et applique `floor(degats × 120 / 100)` quand le
tireur porte le module **et** que la colonne lue pour la cible est sa
`colonnePredilection`. Un seul `Math.floor`, sur le produit, en milli-PV.

Mesuré, la grille 3 × 3 complète (milli-PV, un tick, porteuse à pleins PV) :

| Porteuse | infanterie | vehicule | structureOuAviation |
|---|---|---|---|
| Casemate (préd. infanterie) | **20 000 → 24 000** | 7 000 → 7 000 | 8 000 → 8 000 |
| Créneau (préd. vehicule) | 10 000 → 10 000 | **35 000 → 42 000** | 0 → 0 |
| Batterie (préd. struct.) | 0 → 0 | 0 → 0 | **40 000 → 48 000** |

Le Tir de barrage en profite sans qu'une ligne l'y branche — il recalcule ses
voisines par `degatsContre`. Aucune des trois porteuses ne porte le barrage :
le CUMUL des deux modules n'existe sur aucune pièce et n'est donc pas mesurable.
Ce que T2 fige, c'est le CHEMIN — que le barrage passe encore par
`degatsContre`, et que la majoration n'ait pas remonté dans `tir`.

### Vol de vie — deux passes

`appliquerDegats` fait désormais **deux passes**. La passe 1 retire les PV de
toutes les cibles et répartit l'**encaissé** — part absorbée par un Bouclier
PLUS PV réellement retirés — entre les tireurs, **par indice croissant** et
jusqu'à leur nominal. La passe 2, une fois la passe 1 entière terminée, rend
`floor(encaissé × 20 / 100)` aux porteurs, plafonné à `pvMaxMilli`.

Le tampon de `tir` est passé de `Map<cible, total>` à
`Map<cible, Array<{tireur, degats}>>`. Les trois sites d'appel fournissent
l'indice : tir direct, Tir de barrage, et **franchissement — où le tireur est la
BARRIÈRE**.

### Le canal de l'Ouvrage

`genererSite` remplit `modulesDebloques.ouvrage.defense` depuis
`apparitionModule`, **sur toutes les pièces des tables**, triées et
dédoublonnées. `offense` reste vide.

### Les deux drapeaux `cable`

`munitionSpeciale` et `volDeVie` passent à `{ offense: false, defense: true }`.
Il ne reste **qu'un seul module sans effet dans tout le catalogue : la
Garnison**, en attente d'arbitrage.

---

## 3. L'étape 2 prise seule

Le brief demandait de prendre la marche du tampon à part et de rapporter le
résultat. **718 pass / 0 fail — aucun test n'est tombé.**

Et mieux : six raids déterministes (type `base`, niveaux 12 · 28 · 34 · 42 ·
46 · 50, graine `1000 + niveau`, armée de six unités) joués jusqu'au bout
rendent une signature **strictement identique** à `origin/main` — ticks, cause,
butin, points, état sérialisé compris (sha256 tronqué `72a6f6001389f2dbe6e8`
des deux côtés). Cette identité tient encore **à la fin de l'étape 3** : les
deux modules sont écrits mais aucun site ne les débloque avant l'étape 4.

⚠ **Et elle cesse de tenir à l'étape 4, ce qui est le signe que la mesure n'est
pas creuse.** Sur l'arbre livré la même signature vaut `c7eb8e992809c3aeba57` :
le canal armé change quatre des six raids. Une identité qui aurait survécu à
l'étape 4 aurait voulu dire que le canal ne servait à rien.

---

## 4. Les seize tests, et ce qui ferait tomber chacun

Chaque garde a été **vérifiée par sabotage réel**, pas seulement écrite. Douze
sabotages ont été appliqués puis annulés ; chacun fait tomber sa garde, et le
tableau ci-dessous nomme lequel.

| # | Ce qu'il garde | Le sabotage qui le fait tomber | Vérifié |
|---|---|---|---|
| T1 | La majoration porte sur la prédilection, et sur elle seule | Colonne majorée codée en dur sur `'infanterie'` | ✅ tombe |
| T2 | La majoration vit dans `degatsContre`, pas dans `tir` | Majoration remontée dans `tir` (T1 reste vert !) | ✅ tombe |
| T3 | Le franchissement n'est pas majoré | Majoration branchée sur la LISTE débloquée dans `degatsDeFranchissement` | ✅ tombe |
| T4 | Aucune pièce sans prédilection ne peut tirer | `merlon` reçoit une table de dégâts toute à zéro | ✅ tombe |
| T5 | Le vol porte sur l'encaissé | `part = coup.degats` (le nominal) | ✅ tombe |
| T6 | La part absorbée par un Bouclier compte | `encaisse = pvAvant − pvAprès` seul | ✅ tombe |
| T7 | Servi par indice croissant | Partage au prorata | ✅ tombe |
| T8 | Un mort du tick ne se soigne pas | Retrait du test `t.pvMilli > 0` | ✅ tombe |
| T9 | Le soin plafonne | Retrait du `Math.min(pvMaxMilli, …)` | ✅ tombe |
| T10 | Le soin n'ajoute de ligne ni au butin ni aux points | (a) `pvInitialMilli += soin` ; (b) `butin` lit aussi les défenses | ✅ tombe sur les deux |
| T11 | Le franchissement porte l'indice de la barrière | Franchissement rangé sous la victime **ou** tri des tireurs retiré | ✅ tombe sur les deux |
| T12 | Le canal s'arme au bon niveau | Canal laissé vide · seuil `>=` au lieu de `>` · liste versée en offense · seules les pièces présentes comptées | ✅ tombe sur les quatre |
| T13 | Un site généré entre tel quel | Canal laissé vide | ✅ tombe |
| T14 | Les points bougent, le niveau 20 pas | Canal laissé vide · seules les pièces présentes comptées | ✅ tombe |
| T14 bis | Le Camouflage ne fait rien côté Ouvrage | Seuil `>=` · seules les pièces présentes comptées | ✅ tombe |
| T15 | Zéro ligne nouvelle à l'écran | `munitionSpeciale` câblée en offense | ✅ tombe |
| T16 | Le déterminisme tient | (voir ci-dessous) | ⚠ partiel |

⚠ **T16 est le seul dont je n'ai pas trouvé de sabotage propre**, et je le dis
plutôt que de le maquiller. Retirer le tri du tampon par indice de CIBLE ne le
fait pas tomber — c'est **`MODULES-C T6`** qui l'attrape, et c'est sa place.
Retirer le tri par indice de TIREUR ne le fait pas tomber non plus — c'est
**T11** qui l'attrape, et c'est sa place aussi. T16 garde donc l'invariance à la permutation
des défenseurs, qui tient, et ses trois gardes anti-vacuité mordent (la
projection SANS module diffère, la Meute perd plus, le Broyeur se soigne).

### Trois écarts au brief, sur les tests

**T2 — le montage littéral est impossible.** Le brief voulait « un porteur
fictif qui a les deux modules ». `moduleActif` lit **UN SEUL nom par entité**
(`p.module` à l'assaut, `moduleDefense*` en garnison), les tables de profil ne
sont pas exportées, et les deux modules ne cohabitent sur aucune pièce : le
barrage est un module d'ATTAQUANT (il ne frappe que `defense` et `batiment`), la
Munition spéciale un module de tourelle EN GARNISON. T2 garde donc la
conséquence là où elle se décide — la majoration est **dans** `degatsContre` et
**pas dans** `tir` —, et le sabotage prouve que c'est la seule garde qui attrape
ce déplacement (T1 y reste vert).

**T4 — la garde `colonnePredilection === null` est INATTEIGNABLE**, et le test
le dit. `ciblage` n'appelle `degatsContre` qu'après `peutTirer`, qui exige une
table non nulle avec au moins une colonne positive ; or `colonneDominante` ne
rend `null` que dans le cas contraire. Aucun montage ne peut amener une entité
sans prédilection à `degatsContre` **comme tireur**. Ce qui est gardable, c'est
la prémisse, et elle l'est sur la donnée : les trois seules pièces sans
prédilection (`merlon`, `herse`, `ronce`) ont `degats: null`, et aucune cible du
jeu n'a de `colonneMatrice` nulle.

**T8 — la simultanéité des deux passes n'est pas observable aujourd'hui**, et le
test le dit aussi. Le module se lit sur `moduleOuvrage`, donc tout voleur est en
GARNISON, et `creerCombat` numérote les défenseurs avant les attaquants :
l'entrée du voleur dans le tampon est toujours traitée **avant** celle de sa
victime, et un soin posé au fil de la passe 1 arriverait de toute façon après
ses propres dégâts. Ce qui reste observable — et ce que T8 garde — c'est qu'un
mort du tick ne se soigne pas. Le seuil est exact : à **220 176** milli-PV le
Broyeur tombe à zéro, à **220 177** il survit et encaisse **+616** de vol ; sans
la garde il ressortirait à 616 et survivrait.

### Un constat trouvé en écrivant T13

Un `modulesDebloques` **plat au sommet** (`['camouflage']`) ne lève pas : il est
traité comme absent, parce que `['x'].ouvrage` vaut `undefined` et que MODULES-E
a explicitement voulu qu'absent reste permis. La garde de la forme plate porte
sur chaque **propriétaire**, un cran plus bas. Rien à corriger — le générateur
livre toujours la forme complète —, mais c'est écrit dans le test.

---

## 5. T14, la mesure, publiée sans commentaire

Deux balayages, même armée dans les deux — **2 Meutes, 1 Bélier, 1 Crécelle,
2 Perceurs**, type `base`, joués jusqu'au bout. Points de recherche en
milli-points. C'est la seule armée mesurée : une seconde, plus lourde, avait été
tentée et **jette** (deux unités sur la même case), elle n'a produit aucun
chiffre.

**Balayage A — six niveaux, graine `1000 + niveau`.** Ce sont les six raids de
la signature du §3.

| Niveau | Avant (`origin/main`) | Après | Écart |
|---|---|---|---|
| 12 | 612 836 | 612 836 | 0 |
| 28 | 19 708 762 | 19 708 762 | 0 |
| 34 | 94 760 261 | 106 055 176 | +11,9 % |
| 42 | 616 271 233 | 408 228 383 | −33,8 % |
| 46 | 2 265 330 210 | 1 606 638 582 | −29,1 % |
| 50 | 5 242 806 468 | 4 128 257 590 | −21,3 % |

**Balayage B — neuf niveaux, trois graines (11, 22, 33), même armée.** Toutes
les lignes mesurées sont ici, y compris celles qui ne vont pas dans le même sens.

| Niveau | Avant | Après | Direction |
|---|---|---|---|
| 20 | 2 302 652 / 1 146 497 / 1 692 238 | idem | **identique au point, 3/3** |
| 28 | idem | idem | identique, 3/3 |
| 30 | idem | idem | identique, 3/3 |
| 32 | 51 641 059 / 55 933 921 / 51 309 007 | 48 990 320 / 59 459 976 / 51 441 143 | 2 hausses, 1 baisse |
| 34 | 152 694 150 / 76 193 420 / 128 958 304 | 156 010 831 / 80 722 390 / 135 751 759 | **hausse 3/3** |
| 38 | 173 605 846 / 255 641 308 / 286 985 226 | 194 230 489 / 276 265 951 / 308 676 642 | **hausse 3/3** |
| 42 | 758 806 151 / 820 778 352 / 1 054 272 537 | 828 745 128 / 718 372 174 / 778 293 828 | 1 hausse, 2 baisses |
| 46 | 2 285 331 335 / 2 491 808 615 / 3 734 376 265 | 2 466 216 181 / 2 180 907 792 / 2 883 578 306 | 1 hausse, 2 baisses |
| 50 | 15 973 692 801 / 8 318 116 000 / 9 775 306 972 | 15 325 146 868 / 7 043 493 598 / 8 150 073 821 | **baisse 3/3** |

⚠ **Le brief annonçait une hausse ; elle n'est pas générale, et le premier
mouvement n'est même pas une hausse franche.** Les points ne bougent pas du tout
jusqu'au niveau 30 inclus ; ils bougent pour la première fois à **32**, et
déjà dans les deux sens.

Deux forces opposées agissent. Le bonus de MODULES-E pousse vers le haut, mais
il ne s'applique pas au site : `pointsRecherche` le donne **défense par
défense**, et seulement à celles qui sont **endommagées dans ce raid** et dont
le module figure dans le canal débloqué. Une garnison intacte ne rapporte rien,
avec ou sans module — c'est pourquoi 28 et 30 sont identiques au point malgré un
canal non vide. En face, la garnison devenue plus résistante (PV +20 %, Vol de
vie, Rayon minimum −1) réduit ce que l'assaut casse, donc `perduIci`, donc les
points. Le solde bascule entre 38 et 42, quand le Vol de vie et le Rayon
minimum −1 s'arment.

**Aucun barème n'a été touché. Je ne conclus rien sur l'équilibrage et je ne
propose aucune compensation.**

---

## 6. Le Camouflage côté Ouvrage, en toutes lettres

**Il ne fait rien, et c'est mesuré, pas espéré.**

`ensembleCamoufles` s'ouvre sur `if (e.camp !== 'attaque' || !estActive(e))
continue;`. La phrase d'Ethan est « invisible pour la DÉFENSE » : elle désigne un
ATTAQUANT que la garnison ne voit pas. Une Carapace **en garnison** est du camp
`defense` — elle n'est jamais même examinée par la fonction. Le commentaire de
la fonction le disait déjà, depuis MODULES-B.

La mesure : un site de niveau 28 (le seul niveau où le canal ne contient QUE
`camouflage`), graine 1028, qui compte **quatre Carapaces en garnison**. Raid
joué jusqu'au bout, avec et sans le module :

- état sérialisé **identique**, une fois `modulesDebloques` lui-même retiré de la
  comparaison ;
- points de recherche identiques ; butin identique ; même cause, mêmes ticks.

**Non symétrisé, comme le brief le demande** : rendre un ouvrage invisible à
l'attaquant serait un changement de règle, pas un câblage.

---

## 7. Zéro ligne nouvelle à l'écran

Mesuré **des deux côtés du lot**, en parcourant `ARBRE_RECHERCHE` puis
`lignesDeRecherche` :

| | `origin/main` | après MODULES-F |
|---|---|---|
| Lignes à module, offense | 14 | **14** |
| Lignes à module, défense | 17 | **17** |
| Modules visibles | 12 | **12** |

Les douze : `autoReparation`, `booster`, `bouclier`, `camouflage`, `ecraseur`,
`emp`, `flashbang`, `garnison`, `pvPlusVingt`, `rayonMiniMoinsUn`,
`rayonPlusUn`, `tirDeBarrage`. **Ni la Munition spéciale ni le Vol de vie n'y
sont**, et zéro ligne de l'arbre ne porte l'un de ces deux noms.

**Vérifié à l'écran**, dans Chromium (360 × 740, DPR 2), sur une vraie
sauvegarde chargée : panneau Offense 14 lignes, panneau Défense 17 lignes, et
`innerText` de la page ne contient « Munition sp » ni « Vol de vie » dans aucun
des deux panneaux. Une seule erreur console, le 404 de `/favicon.ico`, artefact
du banc.

Le compte `{ offense: 12, defense: 11 }` de `MODULES-C T10` — les lignes que le
drapeau `cable` **ouvre** — est lui aussi inchangé, et c'est un test existant qui
le tient.

---

## 8. Le raid réel sur une base de niveau ≥ 42

Par le chemin du jeu (`executerRaid`), pas par un montage de test. Base placée
en rangée 70, où `niveauDeLaRangee` vaut 46 : les satellites qui y paraissent
sont de ce niveau, c'est la géographie normale du jeu.

Cible : **avant-poste de niveau 46** en (70, 20). Armée de 27 unités de
niveau 50.

| | `origin/main` | après MODULES-F |
|---|---|---|
| Canal de l'Ouvrage | `[]` | les cinq modules |
| Cause | `souche` | `souche` |
| Rasé | oui | oui |
| Ticks | 271 | 271 |
| Butin | 20 quartz / 20 scorie | idem |
| Unités engagées | 27 (1 au plancher) | idem |
| `rechercheMilli` | 133 860 794 990 | **146 850 836 630** (+9,7 %) |

Aucune exception, aucun écart de déroulement : avec cette armée, les cinq
modules ne changent pas l'issue, seul le bonus de recherche bouge.

---

## 9. Ce qui a été rectifié en passant

**Le commentaire de `MODULES-D T4` mentait.** Il disait « `sim/generateur.js`
livre `modulesDebloques.ouvrage` à VIDE sur tous les sites : le bonus de 20 %
n'est jamais accordé en partie ». Ce lot le rend faux. Le test lui-même ne
dépend pas du générateur (son montage est écrit à la main, ses nombres ne
bougent pas), mais le commentaire est réécrit sur place et daté.

**Trois listes de modules câblés ont dû être mises à jour** — `MODULES-A T9`,
`MODULES-B T13`, `MODULES-C T10`. Elles sont conçues pour tomber quand un module
devient câblé (« ajouter un module câblé sans toucher cette ligne fait tomber le
test, et c'est voulu »). Leur chute était donc le signal attendu, pas une
régression : treize modules câblés sur quatorze, six en défense, **un seul sans
effet — la Garnison**.

**Le §0 de `CLAUDE.md`** est synchronisé (731 tests, 1 264 511 octets, marge
2,73 %), et le §6 reçoit l'entrée du lot.

---

## 9 bis. Les écarts au brief, rassemblés

Le brief les demande en un point. Ils sont détaillés à leur place ; les voici
tous, sans en omettre un.

1. **Le compte du §1.1 est inversé dans le brief.** Il écrit « treize pièces
   n'ont AUCUN `moduleOuvrage` » ; ce sont treize pièces qui EN ONT un. Les
   listes du brief, elles, sont exactes. (§1)
2. **Le montage littéral de T2 est impossible** — aucune pièce ne peut porter
   deux modules, et le barrage est un module d'attaquant quand la Munition
   spéciale est un module de garnison. T2 garde le chemin au lieu du cumul. (§4)
3. **La garde de T4 est inatteignable** en jeu : `peutTirer` empêche une pièce
   sans prédilection d'arriver à `degatsContre` comme tireuse. Le test garde la
   prémisse sur la donnée, et le dit. (§4)
4. **L'ordre des deux passes de T8 n'est pas observable** aujourd'hui : tout
   voleur est en garnison, donc d'indice inférieur à sa victime. T8 garde ce qui
   reste observable — un mort du tick ne se soigne pas. (§4)
5. **T16 n'a pas de sabotage propre à lui seul** : les deux tris qu'il devrait
   garder sont attrapés avant lui par `MODULES-C T6` et par T11. Dit tel quel,
   plutôt que maquillé. (§4)
6. **La direction de T14 n'est pas celle annoncée.** Le brief prévoyait une
   hausse ; elle est nulle jusqu'au niveau 30, mixte à 32, franche à 34-38, puis
   s'inverse à 50. Mesuré, publié, non arbitré. (§5)
7. **Le brief ne proposait aucun numéro de version** ; 0.56.0 · build 57 a été
   choisi ici, 57 étant libre sur la seule branche distante.

Rien d'autre n'a été écarté : les cinq étapes sont faites dans l'ordre annoncé,
l'enveloppe est tenue, l'audit est inchangé et `SAVE_VERSION` n'a pas bougé.

---

## 10. Ce qui reste ouvert

- **La Garnison** est le dernier module sans effet du catalogue. Elle attend un
  arbitrage, pas un lot.
- **`ouvrage.offense` reste vide.** L'armer demanderait un module d'attaquant
  déclaré sur `p.module`, ce que `moduleOuvrage` ne fait pas.
- **Le Camouflage reste inerte côté Ouvrage**, par construction. Le symétriser
  est une décision de règle.
- **L'équilibrage des points de recherche** au-delà du niveau 42 : mesuré,
  publié au §5, non arbitré.
- **La simultanéité des deux passes n'est pas testable** avec la donnée
  d'aujourd'hui (§4). Elle le deviendrait le jour où un ATTAQUANT porterait le
  Vol de vie.
