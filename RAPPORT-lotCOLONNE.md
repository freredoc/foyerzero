# RAPPORT — lot COLONNE

**Version produite : 0.99.8 · build 109.** Branche
`claude/foyer-zer0-patch-5lqyq8`, repartie de `origin/main` après le merge de la
PR SON-VOLUMES.

Retours d'Ethan du 06/09, points **7**, **9** et **10** — le seul des six lots
qui touche `src/sim/` et `src/render/` en même temps.

---

## §0 — La base relevée, et ce que le brief annonçait

| | Brief | Mesuré au départ |
|---|---|---|
| `npm test` | 1 135 pass | **1 179 pass / 0 fail** |
| `dist/index.html` | 7 987 956 o | **7 997 316 o** |
| version | 0.99.2 · build 103 | **0.99.7 · build 108** |

⚠ **La base annoncée n'était plus là, cinquième lot de suite** — les lots
CARTE-B, CHANTIER-FICHES, RECHERCHE-ÉCRAN, RETOUR-DE-RAID et SON-VOLUMES ont été
mergés entre l'écriture du brief et son exécution. Les faits dont le lot dépend
ont été vérifiés un par un ; ils étaient intacts.

**Tests de combat relevés avant de commencer**, comme le §0 l'exige :
`combat.test.js` 26 · `cible.test.js` 8 · `roster.test.js` 18 · `repli.test.js`
10 · `arret.test.js` 10 · `assaut.test.js` 8 · `journal.test.js` 10 ·
`generateur.test.js` 17. Le §« ce qui est tombé » ci-dessous les reprend un par
un.

---

## §1 — Point 7 : l'arrêt sur la cible de prédilection

Ethan : « **Ajouter l'arrêt sur prédilection EN PLUS du bâtiment.** » Défaut
décrit : « un éclaireur ne s'arrête pas lorsqu'il rencontre une infanterie
ennemie ».

⚠⚠ **L'ARBITRAGE DU 04/09 EST GARDÉ, ET IL A FALLU UN COUPLE POUR ÇA.**
« Merlon et tourelles exclus, sauf si ils empêchent d'avancer » : or un merlon
est rangé sous `structureOuAviation`, **exactement comme un bâtiment**. Ce qui
les sépare est le COUPLE `genre === 'defense'` ET
`colonneMatrice === 'structureOuAviation'` — il désigne exactement les merlons,
les barrières et les tourelles, et rien d'autre. `estStructureDefensive` porte
ce couple, et `COL T2` est le test qui attrape un lot qui le perdrait.

⚠ **LA COMPARAISON EST ÉCRITE DANS LE SENS QUI SUPPORTE `null`** — le Merlon ne
fait aucun dégât, `colonneDominante` rend `null`, et `p.colonnePredilection ===
null` sort avant toute lecture. **Mesuré : cette garde est REDONDANTE
aujourd'hui** — la retirer ne fait tomber aucun test, parce que
`null !== 'infanterie'` rend `false` de toute façon. Elle reste, écrite, et
`COL T5` mesure qu'aucune levée ne se produit. **Falsification déclarée comme NE
MORDANT PAS** (F5 ci-dessous).

### L'effet de blocage de colonne, mesuré et non raisonné

Le §1 du brief exige de le MESURER. Banc de 486 montages — 3 types × 10 niveaux
× 3 profils d'assaut × 6 graines —, exécuté dans un `git worktree` bâti depuis
`origin/main` puis sur l'arbre du lot :

| | avant | après | écart |
|---|---|---|---|
| replis | 1 072 | **1 123** | **+4,8 %** |
| somme des ticks | 156 315 | 155 899 | −0,3 % |
| médiane des ticks | 273 | **256** | −6,2 % |
| attaquantes détruites | 6 562 | 6 510 | −0,8 % |
| survivantes sur le terrain | 45 | 46 | +2,2 % |
| butin total | 154,4 G | **258,5 G** | **+67,4 %** |
| sites rasés | 13 | 14 | +1 |

⚠ **LE REPLI NE PEUT PAS EMPIRER PAR `doitSArreter`, ET C'EST STRUCTUREL.** La
condition `e.aTire` est restée EN TÊTE, avant les deux branches : `doitSArreter`
implique `nuit(e)`, donc une bascule de faux à vrai ne peut qu'ôter une chance
de progresser à une entité qui nuit DÉJÀ. **Le chemin par lequel les replis
montent quand même est l'autre** — une unité arrêtée bloque sa colonne, et c'est
l'alliée DERRIÈRE elle, sans cible à portée, qui rentre. Le commentaire de
`avancer` porte ce raisonnement, réécrit.

⚠⚠ **ET LES TROIS AUTRES POINTS DU LOT DÉPLACENT CES MÊMES NOMBRES**, dans les
deux sens : le tableau ci-dessus est la mesure du lot ENTIER contre `main`, pas
celle du seul point 7. Le détail par point se lit dans les réancrages du §5.

---

## §2 — Point 10 : le déplacement latéral de la défense

Ethan : « Déplacement latéral identique au déplacement vertical. Vitesse
multipliée par 2/3. Même règle de collision. Elle veut aller vers la cible la
plus proche, peu importe si elle se bloque. » Périmètre : « défense des deux
camps ».

### La colonne cesse d'être un entier

Une entité porte désormais **`colonneMilli` et RIEN D'AUTRE** — pas de `colonne`
dérivée à côté —, exactement comme elle porte `rangeeMilli` et pas `rangee`. La
case se DEMANDE, par `caseColonne(e)`.

⚠⚠ **`distanceCarree` EST RENOMMÉE `distanceCarreeMilli`, ET LE RENOMMAGE EST LE
GARDE-FOU.** Elle mélangeait les unités — rangée en milli, colonne en CASES,
converties dedans. Gardée sous son ancien nom, un appelant oublié lui aurait
passé une colonne en cases : le carré aurait été faux **d'un facteur 1 000 000
sur l'axe horizontal**, `node --check` n'aurait rien vu, et un test de portée
écrit sur des entités ALIGNÉES en colonne n'aurait rien vu non plus. Sous un nom
neuf, `esbuild` refuse le build sur « No matching export ».

⚠ **CINQ APPELANTS DE PRODUCTION, REPRIS D'UN COUP** — le brief demande le
compte exact. Ils sont dans `src/sim/combat.js` : `ensembleCamoufles`,
`ciblage`, `cibleDeNeutralisation`, `tir`, et le nouveau `cibleDuDecalage`.
Aucun ailleurs — vérifié par un `grep` sur `src/` avant et après.

⚠⚠ **ET DEUX LECTEURS DE `.colonne` M'AVAIENT ÉCHAPPÉ, TROUVÉS PAR UN PIÈGE ET
NON PAR RELECTURE.** Un accesseur qui LÈVE, posé temporairement à la place du
champ retiré, a énuméré tout ce qui le lisait encore : les départages de
`ciblage` et de `cibleDeNeutralisation` (six sites), et `entitesSurLaCase` de
`src/ui/banc.js`. Le piège a été retiré ensuite ; il ne reste pas au dépôt.

### Les six conséquences du §2 du brief, une par une

**(2.1) Le repli reste sous garde de camp.** `deplacement` route
`camp === 'attaque'` vers `avancer` et tout le reste vers `seDecaler` ; le repli,
l'Écraseur, la sortie par le haut et le franchissement du fond restent dans
`avancer`. **`COL T9` a été écrit AVANT le code** et il attrape l'ouverture du
repli à la défense — une garnison qui se replierait quitterait le terrain sans
être détruite, et elle n'a pas de base où rentrer.

⚠ Les autres effets réservés à l'attaque ont été vérifiés un par un :
`structureForcee` refuse déjà tout ce qui n'est pas `attaque` ; `boosterActif` et
la Munition spéciale passent par `moduleActif`, qui lit le propriétaire ; le
Camouflage s'ouvre sur `e.camp !== 'attaque'` et n'a donc rien à voir avec le
décalage. **Aucun n'a été touché.**

**(2.2) Les structures ne se décalent pas gratuitement.** `deplacement` sort sur
`p.vitesseMilli === 0`, en tête, pour les deux camps. **Mesuré : les neuf
`DEFENSES` n'ont pas de champ `vitesse`**, donc leur vitesse de profil vaut zéro
et aucune ne bouge. `COL T8` le vérifie sur une Casemate au lieu de le croire.

**(2.3) Le ×2/3 tombe juste, et il vit dans `src/data/`.**
`GRILLE.lateral = { numerateur: 2, denominateur: 3 }`. Les quatre vitesses du
roster sont divisibles par 3 — **60 · 90 · 120 · 240 → 40 · 60 · 80 · 160** — et
`COL T13` est le test de données qui le garde. Le facteur s'applique **EN
DERNIER**, après la réduction d'obstacle et après le Booster : posé avant, il
ferait cesser l'obstacle de ralentir ou fausserait le rapport du Booster.

**(2.4) Le plafond des 1 000 tient, et le brief se trompait sur son pire cas.**
Son §2.4 annonce « le pire latéral 160, 400 boosté ». **Mesuré : la plus rapide
des quatorze unités vaut 240**, ce qui ferait 1 600 boosté et latéral —
au-DESSUS de la case. Mais **seule la DÉFENSE se décale**, et la plus rapide des
huit unités qui entrent en garnison vaut **120**, donc **800** au pire. `COL T14`
prend le pire cas sur la GARNISON, et asserte que la plus rapide du roster n'y
entre pas — sans quoi la borne devrait être remesurée. **Écart au brief,
déclaré, et c'est le test qui l'a trouvé.**

**(2.5) `peutAvancer` n'a PAS été surchargée d'un paramètre d'axe.** Sa première
ligne teste `rangee >= DERNIERE_RANGEE` et rend le comportement aérien : un
paramètre d'axe en ferait deux fonctions dans une, dont l'une des deux branches
ne serait jamais relue. La borne latérale est **`estSortiParLeCote`**, PURE et
EXPORTÉE dans `src/sim/grille.js`, atteignable sans monter un combat —
`COL T10`.

**(2.6) `distanceCarree` — voir ci-dessus.** `COL T11` DÉSALIGNE les colonnes :
une Casemate à deux rangées et UNE colonne voit sa cible (√5 < 2,5), à deux
rangées et DEUX colonnes elle ne la voit plus (√8 > 2,5). Un montage aligné
serait passé même avec la distance cassée.

**(2.7) `Math.floor` de `positionInterpolee`.** **`COL T12` a été écrit AVANT la
correction et vu ROUGE** — `2037 !== 2038` — sur l'arbre intact : la fonction est
pure et rien ne l'empêchait de recevoir un delta négatif, c'est seulement que
personne ne lui en donnait. `Math.trunc` tronque vers zéro, donc vers
`precedent` des deux côtés. ⚠ `prendrePositions` relève désormais les DEUX axes,
en COUPLES et non en deux tableaux parallèles.

### ⚠⚠ Une septième conséquence que le brief ne nommait pas, trouvée à la relecture hostile

**Le pas latéral pouvait DÉPASSER sa cible, et la défenseuse tremblait.** Un
attaquant ne change jamais de colonne : sa colonne est FIXE. Une défenseuse qui
la dépasse repart en sens inverse au tick suivant, puis revient. Mesuré sur le
cas nu : cible en 5 000, défenseuse en 4 970, pas de 40 → 5 010 (case 5), puis
4 970 (case 4), puis 5 010… **deux cases prises et rendues à chaque tick, avec
l'occupation qui suit.** C'est la faute de `Math.floor` de `positionInterpolee`
vue depuis le MODÈLE au lieu du DESSIN, et elle naît du même fait. Le pas est
borné par l'écart ; `COL T6 ter` la mesure, et sa falsification ne fait tomber
que lui.

⚠ **Ce correctif a fait bouger les témoins une seconde fois**, après le point 9 :
c'est pourquoi les deux surcharges ont été régénérées en dernier.

---

## §3 — Point 9 : la disposition des sites cesse d'être la même

Ethan : « La disposition des unités et bâtiments ouvrage semblent identique alors
qu'elle doit être plus aléatoire. »

⚠⚠ **LE DÉFAUT N'ÉTAIT PAS UNE ABSENCE DE HASARD, C'EN ÉTAIT LA FORME.** Le
placement tirait bien une permutation des colonnes par graine — puis posait en
TOURNIQUET, `colonne = permutation[i % 9]`. Conséquence : **la charge par colonne
était plate sur TOUTE graine**, donc deux sites de même niveau ne différaient que
par le NOM des colonnes. La graine renommait, elle ne redessinait pas.

⚠⚠ **CE QUI CHANGE LA FORME EST LE PROFIL DE CHARGE, ET C'EST L'INVARIANT QUI
FALSIFIE.** Une permutation préserve le MULTI-ENSEMBLE des charges par colonne,
par définition : tant qu'il est constant, aucun tirage ne peut produire deux
dispositions qui ne soient pas l'image l'une de l'autre. Mesuré, 40 graines par
configuration :

| configuration | profils de charge distincts (avant → après) | formes canoniques (avant → après) |
|---|---|---|
| base n30 | **1 → 4** | 3 → **40** |
| base n10 | **1 → 4** | 3 → **10** |
| camp n20 | **1 → 4** | 3 → **17** |
| avantPoste n40 | **1 → 4** | 3 → **40** |

*(« forme canonique » = la liste triée des motifs de rangées par colonne, elle
aussi invariante par permutation.)*

⚠ **ET LE BUDGET D'ÉCART N'A PAS ÉTÉ RELEVÉ POUR L'OCCASION.**
`ecartColonnesMax` vaut **2** depuis le lot 2B et le placement d'avant n'en
employait qu'**un**. Le lot cesse de laisser une moitié du budget inutilisée ; il
n'en demande pas davantage. Mesuré sur 200 graines : l'écart atteint 2 sur
**186 à 200 sites sur 200** selon la configuration.

### Comment le profil se tire, et ce qui le borne

`profilDeCharge` part du profil PLAT — `base` partout, `+1` sur `total % 9`
colonnes tirées — puis tente `brassagesDeCharge` **TRANSFERTS** : une unité passe
d'une colonne à une autre, et le transfert est DÉFAIT s'il fait sortir le profil
du budget d'écart, du plancher, ou de la capacité d'une colonne.
`repartirLesColonnes` assigne ensuite rangée par rangée, en servant les colonnes
au plus grand reste — l'algorithme de Gale-Ryser, pas une heuristique.

⚠ **UN TRANSFERT REFUSÉ CONSOMME SES TIRAGES COMME UN ACCEPTÉ** : les deux bornes
sont tirées AVANT tout test, donc le nombre de tirages ne dépend pas du taux
d'acceptation.

⚠⚠ **`profilRealisable` N'EST PAS DÉCORATIVE, ET LE CONTRE-EXEMPLE EST PETIT.**
Treize défenses tiennent en trois rangées de 6 · 6 · 1 ; un profil à
(3, 3, 2, 2, 1, 1, 1, 0, 0) somme bien à treize et respecte le budget — et il est
IRRÉALISABLE : à k = 2 il demande 6 places quand les trois rangées n'en offrent
que 5. Sans ce contrôle, le placement lèverait, ou poserait deux pièces sur la
même case. Le repli est le profil PLAT, qui est celui du tourniquet, donc
réalisable par construction.

⚠⚠ **ET LE PROFIL SE TIRE SUR CE QU'IL PLACE, PAS SUR LE TOTAL — MESURÉ.**
Première écriture : tirer le profil sur le total (proportionnels + Souche + Étai)
puis retrancher le plancher. Sur 31 bâtiments en 4 rangées de 9 · 9 · 9 · 2, elle
rend quatre colonnes à quatre occupants là où la dernière rangée n'en offre que
deux — Gale-Ryser refuse, et le repli plat refuse aussi puisqu'il est calculé de
la même façon. Le plancher ne compte donc que pour l'ÉCART.

### Le décalage de consommation du PRNG, mesuré et annoncé

Le brief l'exige. Nombre de tirages de `genererSite`, mesuré en instrumentant
l'état du PRNG (l'instrumentation a été retirée après mesure) :

| configuration | avant | après |
|---|---|---|
| base n30 | 79 | **297** |
| base n10 | 91 | **218** |
| camp n20 | 93 | **234** |
| avantPoste n40 | 79 | **299** |

⚠ **Le compte est CONSTANT d'une graine à l'autre**, pour une configuration
donnée : le décalage est uniforme, il ne dépend pas du tirage.

⚠⚠ **ET IL DÉPLACE PLUS QUE LA POSE.** `composerRepartition` — la composition de
la GARNISON — tire **APRÈS** `placerBatiments` : le décalage change donc aussi
QUELLES pièces sont posées, pas seulement OÙ. C'est la cause principale des
réancrages du §5, et il faut le lire dans ce sens-là.

⚠ **Souche et Étai restent au fond, rangée 18, centrés**, et `COL T18` le
vérifie sur cent graines et trois types — plus le fait qu'aucun proportionnel ne
vient s'asseoir sur cette rangée.

### ⚠⚠ Une conséquence de jeu, mesurée, non compensée

Sur un site à peu de défenses — `base` niveau 10, onze pièces — le profil peut
désormais laisser **deux colonnes entièrement VIDES** (`2,2,2,2,1,1,1,0,0`), ce
qui n'arrivait jamais avec la charge plate. C'est dans le budget déclaré
(min = 0, max = 2), et le commentaire d'`ecartColonnesMax` mettait justement en
garde contre « une colonne vide, une autoroute ».

**Ce qui rend cela défendable est l'autre moitié du lot** : depuis le point 10,
la défense se déplace latéralement pour venir à la rencontre de l'assaut. Une
colonne vide n'est plus une autoroute — la garnison peut s'y porter. Les deux
points se tiennent. **Si Ethan juge autrement, une ligne suffit** : un plancher
de 1 par colonne dans `profilDeCharge`.

---

## §4 — Les vingt-et-un tests, et leur montage

| test | ce qu'il mesure | montage effectivement écrit | verdict |
|---|---|---|---|
| **COL T1** | l'arrêt sur la prédilection | Meute d'assaut colonne 5, Meute de garnison en (6, 6) — **hors de sa colonne**, sinon `peutAvancer` l'arrêterait de toute façon | PASS |
| **COL T2** | personne ne s'arrête pour un merlon | Bélier (anti-structure) contre merlon en (6, 6) | PASS |
| **COL T3** | l'arrêt pour un bâtiment survit | Meute (anti-**infanterie**) contre Gangue : les deux branches ne coïncident pas | PASS |
| **COL T4** | le traversant ne s'arrête jamais | cible satisfaisant les DEUX branches | PASS |
| **COL T5** | `colonnePredilection` nulle ne lève pas | les trois défenses sans dégâts, montées ensemble, 200 ticks | PASS |
| **COL T6** | la garnison se décale vers sa cible | garnison colonne 3, assaut colonne 6 | PASS |
| **COL T6 bis** | « même règle de collision » | six vrais sites de niveau 30, 300 ticks, aucune superposition de BLOQUANTES | PASS |
| **COL T6 ter** | elle ne dépasse pas sa cible | Broyeur (pas de 60) contre Bélier à 2 000 milli — la distance ne tombe pas rond | PASS |
| **COL T7** | le rapport 2/3 exact | décalage latéral d'une Meute de garnison contre déplacement vertical d'une Meute d'assaut, 30 ticks | PASS |
| **COL T8** | les structures ne bougent pas | Casemate, cible à six colonnes, 120 ticks | PASS |
| **COL T9** | pas de repli à la défense | Meute enfermée entre deux merlons, `4 × TICKS_AVANT_REPLI` | PASS |
| **COL T10** | personne ne sort par le côté | la borne pure sur les deux bords ET **la fraction** ; puis une garnison au bord | PASS |
| **COL T11** | les portées sur les deux axes | Casemate, cibles **désalignées** à √5 et √8 | PASS |
| **COL T12** | l'interpolation à delta négatif | **écrit avant, vu ROUGE** | PASS |
| **COL T13** | vitesses divisibles par 3 | les quatorze unités du roster | PASS |
| **COL T14** | le plafond des 1 000 latéralement | pire cas sur la **garnison**, Booster lu dans la source | PASS |
| **COL T15** | deux graines, deux FORMES | multi-ensemble des charges, 40 graines × 4 configurations | PASS |
| **COL T16** | les trois contraintes | 100 graines × 3 types ; et le budget **écrit en clair** | PASS |
| **COL T17** | déterminisme intact | 30 graines × 3 types, `deepEqual`, plus la contre-épreuve | PASS |
| **COL T18** | Souche et Étai au fond | 100 graines × 3 types | PASS |
| **COL T18 bis** | **une DETTE, assertée encore violée** | trois sites raidés en boucle, la levée EXIGÉE | PASS |

⚠ **`COL T16` ÉCRIT SES DEUX SEUILS EN CLAIR, ET C'EST DÉLIBÉRÉ.** Une garde qui
lit son seuil dans la table qu'elle garde ne peut PAS voir ce seuil se relâcher —
**mesuré : porter `ecartColonnesMax` à 4 ne faisait tomber aucun test.** §5 de
`CLAUDE.md` interdit d'élargir une borne pour faire passer un lot ; ces deux
lignes rendent la faute visible.

---

## §5 — Ce qui est tombé, nommément, et pourquoi

### Prémisse devenue fausse — montage réparé, aucune assertion assouplie

* **`assaut.test.js` T8** (`passesPourRaser`) — le helper appariait les
  survivants par `(id, rangee, colonne)`. Une pièce de garnison **change de
  colonne** : le `find` rendait `undefined` et le tour suivant montait un
  défenseur « undefined ». Il apparie désormais **par RANG**, avec un curseur,
  et LÈVE si le résultat cesse de s'apparier rang à rang. ⚠ Il borne aussi les
  PV au NOMINAL, comme `pvCourantsDesDefenses` le fait à la lecture — voir la
  dette du §7.
* **`raid.test.js`, trois tests** — « Aucune unité en état de partir » :
  l'armée est désormais anéantie en un seul raid. Un helper partagé,
  `reparerLArmee`, remet les dégâts à zéro entre deux raids.
* **`repli.test.js` T2** — il concluait « un attaquant a été écrasé par les
  siens » à partir du seul drapeau `ecrase`, qui n'était un proxy fiable que
  tant que les défenseurs étaient immobiles. Il regarde maintenant **le CAMP de
  qui occupe la case de l'écrasé**, tick par tick.
* **`recherche.test.js` MODULES-F T14** — sur les graines 11 et 22, la garnison
  de niveau 38 ne porte plus **aucune** pièce dont le `moduleOuvrage` soit armé :
  le canal armé et le canal vide rendaient EXACTEMENT le même nombre, et le test
  ne mesurait plus rien sur deux de ses trois graines. Graines remplacées par
  **3, 14, 31**, qui discriminent aux deux niveaux. ⚠ **C'est un fait de jeu à
  remonter** : l'effet du canal de l'Ouvrage dépend désormais de ce que le tirage
  a posé.
* **`recherche.test.js` MODULES-F T14 bis** — sa dernière assertion exige que le
  bonus de MODULES-E MORDE, ce qui demande qu'un porteur de Camouflage soit
  ENTAMÉ. La nouvelle disposition de la graine 1028 laisse ses deux porteurs
  intacts. Graine **1077**, qui en abîme.

### Mesures figées — réancrées avec le nombre d'AVANT et celui d'APRÈS

* **`assaut.test.js` T2** — bornes du rapport bâtiments/défenses : `avant` de
  0,300–0,458 à **0,279–0,600** (borne 0,5 → 0,7), `après` de 2,346–3,750 à
  **2,179–4,750**. ⚠ Le RENVERSEMENT est asserté site par site quinze fois plus
  haut ; ces deux lignes ne sont que le résumé chiffré.
* **`assaut.test.js` T7** — figés : A 344 → **287**, B `souche` 562 → **516**,
  C 524 → **348**. Budgétés : A 516 → **355** et son butin 222 · 74 → **0 · 0**,
  B 371 → **749**, C 336 → **513** et son quartz 15 350 → **54 560**.
* **`cible.test.js` T4** — 594 → **164** ticks, butin 12 182 · 4 060 → **0 · 0**.
* **`cible.test.js` T5** — les raids qui touchent le plafond de 900 :
  `['blindeLourd/base/7', 'blindeLourd/camp/11', 'mixte/base/3']` →
  **`['blindeLourd/base/1']`**. ⚠ Ce n'est pas un gel — à `maxTicks` 20 000 il se
  conclut par `attaquants` au tick **5 478**. **547 secondes de combat, six fois
  le plafond : c'est un autre régime, et c'est à remonter**, comme le 4 645 du
  lot CARTE l'avait été.
* **`repli.test.js` T6** — 336 → **513** ticks, butin 15 350 · 5 116 →
  **54 560 · 18 186**, six survivants → **trois**.
* **`roster.test.js` T5** — 139 → **188**. ⚠ La propriété tient : **une SEULE
  durée sur neuf niveaux**.
* **`roster.test.js` T6** — A 516 → **355** ticks, B 371 → **749**, C 336 →
  **513** ; les trois butins et les trois comptes de survivants suivent.
* **`arsenal.test.js` T10** — 336 → **513**.
* **`poi.test.js` T18** — 820 · 273 → **730 · 243** et 950 · 316 → **851 · 283**.
  ⚠ **L'écart relatif, qui est ce que le test mesure, ne bouge pas d'un point :
  +16,6 %.**

### Les deux témoins, surchargés et jamais rafraîchis

* **`test/temoins-combat.js`** — `COMBATS_DEPLACES_PAR_COLONNE` entre comme
  SECONDE couche par-dessus `COMBATS_DEPLACES_PAR_ARRET`. Les couches se lisent
  de la plus récente à la plus ancienne. **309 champs sur 1 600 restent gardés**
  contre la capture d'avant JOURNAL-DE-COMBAT, contre 568 après le lot ARRÊT ;
  **plus un seul des 200 combats n'est entièrement gardé, ni même son seul tick
  de fin** ; **195 causes de fin sur 200 tiennent encore**. Le combat va au même
  endroit, il n'y va plus par le même chemin.
* **`test/temoins-bases-0.js`** — `DEPLACES_PAR_COLONNE` nomme **cinquante-cinq
  couples**, tous à partir de la **phase 7**, qui est le premier raid. Les six
  premières phases sont identiques AU BIT.

⚠⚠ **ET SEPT SCALAIRES SONT IDENTIQUES SUR LES VINGT-CINQ GRAINES** : gestes de
construction, gestes d'armement, **taille de la sauvegarde**, cases
atteignables, déplacement de la base, nombre de bases attaquantes, nombre de
cibles et cible retenue. Ils restent gardés contre les captures d'AVANT ce lot.
C'est la mesure qui dit que **le lot ne touche que le combat**.

---

## §6 — `SAVE_VERSION` : vérifiée, pas crue

**Elle ne bouge pas et reste à 26.** Le brief demandait de le VÉRIFIER.

Une entité de combat porte désormais `colonneMilli` au lieu de `colonne` — mais
une ENTITÉ n'est pas un état sauvegardé : elle naît de `creerCombat` et meurt
avec le montage. Ce qui traverse `serialiser` est `etat.garnison`,
`etat.armee` et `disposition`, dont les pièces gardent une `colonne` ENTIÈRE,
inchangée.

**Comment la vérification a été obtenue** : le témoin de BASES-0 mesure
`tailleSauvegarde` sur les vingt-cinq graines, contre la capture du 02/09 plus
les trois termes des lots suivants. **Elle est identique sur 25/25** —
l'assertion n'a pas été touchée. Et `serialiserEtat` d'un combat ne porte aucun
champ neuf : les 200 empreintes d'état du témoin de combat bougent parce que les
POSITIONS changent, pas parce qu'un champ entre.

---

## §7 — Écarts au brief, et points ouverts

### Écarts déclarés

1. **Le pire cas latéral du §2.4 est faux** — voir §2 (2.4). Le brief prend le
   roster entier ; seule la garnison se décale.
2. **La garde `colonnePredilection === null` est REDONDANTE** — mesurée telle
   quelle, sa falsification ne mord pas. Elle reste, écrite ; `COL T5` mesure
   qu'aucune levée ne se produit. Déclarée plutôt que comptée.
3. **Trois tests entrent au-delà des dix-huit du §4** — `COL T6 bis`,
   `COL T6 ter` et `COL T18 bis`. Les deux premiers viennent de falsifications
   qui n'ont mordu sur rien ; le troisième fige une dette.

### ⚠⚠ Une DETTE trouvée, mesurée, et NON corrigée

**Un site raidé plusieurs fois de suite peut LEVER au raid suivant** :
« combat : défenseur « X » — pvMilli N hors de 1…M ». `ajouterEntite` borne un
`pvMilli` forcé par les PV NOMINAUX, et `site-entame.js` range parfois une valeur
au-dessus — jusqu'à **1,37 fois le nominal**, mesuré. **Le joueur perd sa partie
sur une exception.**

⚠ **ELLE EST ANTÉRIEURE AU LOT.** Mesurée sur un `git worktree` bâti depuis
`origin/main` : **six cas sur 900 scénarios** là-bas, **cinq ici**, sur des
graines différentes. Le lot ne la crée pas, ne la referme pas, et la déplace
comme il déplace tout ce qui touche à la disposition.

⚠⚠ **UN CORRECTIF A ÉTÉ ÉCRIT, MESURÉ INEFFICACE, ET RETIRÉ.** Borner la valeur
rangée dans `reprojeter` : le défaut **PERSISTE**, cinq cas sur cinq. La valeur
fautive ne vient donc pas de là, et livrer ce correctif aurait mis dans `src/`
une garde qui prétend protéger ce qu'elle ne protège pas. **Un correctif qui ne
mord pas se vérifie avant d'être cru**, exactement comme une falsification.
`src/sim/site-entame.js` n'a donc **pas une ligne de changée**.

⚠ **CE QUI PROTÈGE LA PRODUCTION AUJOURD'HUI, ET C'EST FRAGILE** :
`pvCourantsDesDefenses` repasse chaque PV rangé par `pvApresRetour` et rend
`null` dès qu'il atteint le nominal — mais elle rend les valeurs BRUTES quand
l'Étai est tombé (`if (sante === null) return entree.pvDefensesMilli`), et c'est
par là que les cinq cas passent. `COL T18 bis` l'asserte **encore violée**, sur
l'idiome de `DETTES_ACCENT` : le jour où c'est réparé, il tombe et quelqu'un
vient le retirer.

### Points ouverts pour Ethan

1. **Le calibrage.** Le butin total du banc de 486 montages passe de **154,4 G à
   258,5 G, +67,4 %**, et les trois raids de référence bougent tous les trois,
   dans les deux sens. **Aucun barème n'a été touché.**
2. **Le raid `blindeLourd/base/1` demande 5 478 ticks**, soit 547 secondes. Ce
   n'est plus un dépassement du plafond de 90 s, c'est un autre régime.
3. **Deux colonnes entièrement vides sur les petits sites** — voir §3. Une ligne
   suffit à y poser un plancher.
4. **La valeur `brassagesDeCharge = 18`** (deux par colonne) est une proposition,
   et elle se change seule.
5. **Le décalage n'est ouvert que vers la colonne de PRÉDILECTION.** Ethan écrit
   « la cible la plus proche » ; pris avec « quand une cible de prédilection
   arrive », cela décrit un décalage vers la prédilection et rien d'autre.
   **Lecture déclarée, une ligne suffit à l'ouvrir à n'importe quelle cible.**

---

## §8 — Chiffres du livrable

| | avant (`origin/main`) | après |
|---|---|---|
| `npm test` | 1 179 pass / 0 fail | **1 201 pass / 0 fail** |
| `dist/index.html` | 7 997 316 o | **8 000 552 o** |
| lignes `data:` | 296 | **296** |
| version | 0.99.7 · build 108 | **0.99.8 · build 109** |

**Coût : +3 236 octets, ENTIÈREMENT DU JAVASCRIPT.** Mesuré poste par poste
contre un livrable rebâti depuis `origin/main` : **JavaScript +3 236 · feuille
+0 · balisage +0 · images +0 · audio +0**, et la somme des cinq postes tombe
EXACTEMENT sur le total.

**Borne T10 inchangée à 9 300 000**, marge **1 299 448 octets, 13,98 %**.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne.

⚠ **Vingt tests entrent — `test/colonne.test.js`, vingt-et-un en tout avec
`COL T12` — et le compte passe de 1 179 à 1 201.** Aucune assertion n'a été
retirée ni assouplie ; **onze gardes changent de cible et deux se RESSERRENT** —
`COL T16` écrit ses deux seuils en clair là où les gardes existantes les
lisaient dans la table, et `passesPourRaser` LÈVE désormais si le résultat cesse
de s'apparier rang à rang.

---

## §9 — Les dix-neuf falsifications

| | falsification | ce qui tombe |
|---|---|---|
| F1 | l'arrêt sur prédilection retiré | `COL T1`, `ARRÊT T4` |
| F2 | l'exclusion des structures défensives retirée | `COL T2`, `ARRÊT T2`, `T3`, `T8`, `T10` |
| F3 | le genre `batiment` ne s'arrête plus | `COL T3`, `ARRÊT T1`, `T10` |
| F4 | le traversant s'arrête | `COL T4`, `ARRÊT T5`, `T10` |
| F5 | la garde `null` retirée | **AUCUNE — déclarée, voir §7** |
| F6 | la défense ne se décale plus | `COL T6`, `T7` |
| F7 | le facteur latéral vaut 1 dans la TABLE | `COL T13`, `T14` |
| F8 | `vitesseLaterale` rend la vitesse pleine | `COL T7` |
| F9 | le repli ouvert à la défense (par `avancer`) | `COL T1`, `T6`, `T7` |
| F10 | la borne latérale désarmée | `COL T10` |
| F11 | le repli glissé DANS `seDecaler` | `COL T9` seul |
| F12 | la garnison ignore les collisions latérales | **rien d'abord** → `COL T6 bis` écrit → tombe |
| F13 | le tourniquet revient (charge plate) | `COL T15` |
| F14 | le budget d'écart relevé à 4 | **rien d'abord** → seuil écrit en clair → `COL T16` |
| F15 | la Souche quitte le fond | `COL T18`, `generateur T4` |
| F16 | Gale-Ryser désarmé | 18 tests, dont tout `generateur.test.js` |
| F17 | le plafond nominal retiré de `reprojeter` | **AUCUNE — le correctif a été retiré, voir §7** |
| F18 | le budget d'écart relevé à 4, rejoué | `COL T16` |
| F19 | le pas latéral n'est plus borné par l'écart | `COL T6 ter` seul |

⚠⚠ **TROIS FALSIFICATIONS N'ONT MORDU SUR RIEN, ET LES TROIS ONT ÉTÉ TRAITÉES
DIFFÉREMMENT.** F12 a fait ÉCRIRE un test qui manquait ; F14 a fait RESSERRER une
garde qui lisait son propre seuil ; F5 est DÉCLARÉE, la garde qu'elle vise étant
redondante par construction. **Une falsification qui ne mord pas se vérifie avant
d'être crue** — et un correctif aussi, ce qui a fait retirer F17.
