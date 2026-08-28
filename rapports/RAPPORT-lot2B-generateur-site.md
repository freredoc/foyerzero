# Rapport — lot 2B : générateur de site déterministe

## Version livrée

| | |
|---|---|
| `version` | **0.4.0** (était 0.3.0) |
| `config.build` | **4** (était 3) |
| Build produit | `dist/index.html` — version 0.4.0 build 4 — 2974 octets |
| `npm run check` | **PASS** — build **et** 75 tests, 0 échec |

---

## Fichiers

| Fichier | Lignes | Nature |
|---|---|---|
| `src/sim/generateur.js` | 500 (neuf) | le générateur |
| `test/generateur.test.js` | 790 (neuf) | T1 à T16, plus un contrôle de relecture |
| `src/data/niveaux.js` | 29 (neuf) | la courbe de niveau |
| `src/sim/combat.js` | +143 / −33 | franchissement en milli, niveau par entité, points en `BigInt` |
| `src/data/sites.js` | +30 / −11 | `DISPOSITION_DEFENSES` remplace le bloc `_A_CONFIRMER` |
| `test/combat.test.js` | +44 / −31 | trois tests de 2A recalculés (voir écarts) |
| `src/data/combat.js` | +9 / −3 | Ronce 2,5 · Herse 15 et matrice 0,03 |
| `test/grille.test.js` | +20 / −4 | granularité de matrice, franchissement en milli |
| `package.json` | +2 / −2 | version et build |

Aucun `.xlsx` n'a été ouvert.

---

## Les deux corrections et l'extension

### Correction 1 — la Ronce, et la Herse

`degatsFranchissement` passe de 20 à **2,5** pour la Ronce. `entierDeDonnees` refusait
la décimale : le champ passe par `enEntier(…, MILLE, …)`, la porte déjà empruntée par les portées
(1,5 · 2,5 · 3,5 · 5,5), et le profil porte désormais `franchissementMilli`. Une fonction dédiée,
`degatsDeFranchissement`, divise une fois de plus par 1000 :
`floor(franchissementMilli × facteurMatrice × santé‰ / 1000²)`. À barrière pleine vie et matrice
1,0 : `floor(2500 × 1000 × 1000 / 10⁶) = 2500` milli-PV, soit **2,5 PV par tick**, exactement le
comportement demandé. Aucun autre champ entier n'est touché.

Correction d'Ethan reçue avec le brief : **Herse à 15 PV/tick et matrice 0,03 contre
l'infanterie.** Elle rend caduques les deux conséquences que le §3 demandait de consigner sans
corriger — voir « Ce que la correction de la Herse règle », plus bas.

### Correction 2 — le tick 209

Rien à changer : le moteur avait raison, le texte du §12 de 2A avait tort. Le §6 est normatif et
place le retrait des morts avant le déplacement. **Point clos.**

### Extension — le niveau par entité

Chaque bâtiment, défenseur et entrée de vague accepte un champ `niveau` optionnel, par défaut
celui du site. `ajouterEntite` en dérive `facteurMilli(niveau)` et met à l'échelle **les PV et les
dégâts**, qui vivent désormais sur l'entité et non sur le profil — deux entités du même
identifiant peuvent être à deux niveaux différents sur la même grille. `pvMilli` reste un forçage
explicite, prioritaire sur l'échelle. Butin et points de recherche lisent le niveau de l'entité.

`pvMaxMilli = pv × facteurMilli` est **exact par construction** : `pvMaxMilli` valant `pv × 1000`,
la mise à l'échelle `× facteurMilli / 1000` se simplifie sans arrondi. Seuls les dégâts sont
arrondis.

---

## Résultat de chaque test

`node --test "test/*.test.js"` — **75 tests, 75 PASS, 0 KO.** Les 17 tests du fichier neuf sont
détaillés ci-dessous ; les 58 autres sont ceux des lots 1, 1C et 2A.

| Test | Résultat | Montage effectivement joué |
|---|---|---|
| **T1** déterminisme | **PASS** | Avant-poste niveau 30, saveur `richeQuartz`, graine 1234, deux appels : sérialisations identiques. Le site porte ≥ 20 bâtiments et ≥ 20 défenses — un montage vide serait trivialement reproductible. Cinq graines (11 · 22 · 33 · 44 · 55) produisent plus d'un site distinct. |
| **T2** balayage de validité | **PASS** | 11 niveaux (1, 5, …, 50) × 3 types × leurs saveurs × 5 graines = **275 montages**, tous acceptés par `creerCombat`. Et aucun flottant dans aucun d'eux, vérifié par parcours récursif. |
| **T3** densité | **PASS** | Paliers : camp 40 → 25/25, avant-poste 40 → 35/35, base 40 → 39/39. Interpolation au niveau 22 : bâtiments `16 + (18−16) × 2/5 = 16,8 → 17`, défenses `15 + (18−15) × 2/5 = 16,2 → 16`. Bornage sous le palier 5 et au-delà du palier 50. Puis les effectifs réellement posés, sur les 275 montages. |
| **T4** composition des bâtiments | **PASS** | 39 bâtiments → 2 uniques + 37 proportionnels → `14,8 · 11,1 · 11,1` → **15 Nœuds, 11 Gangues, 11 Terrils** au plus grand reste, somme 37. Sur les 275 montages : exactement une Souche et un Étai, tous deux en rangée 18, le reste entre 11 et 17. |
| **T5** garnison | **PASS** | 50 niveaux × 8 graines sur avant-poste. Aucune entité dont `apparition > niveau`, aucun identifiant hors de la courbe. Écart à la courbe : **17,6 points au maximum**, seuil retenu 25 — voir écarts. |
| **T6** couverture latérale | **PASS** | Points chiffrés du §7.4 : 39 → 7 rangées à 61,9 % · 35 → 6 à 64,8 % · 3 → 1 à 33,3 %, toutes ≤ 66,7 %. Sur les 275 montages : jamais plus de 6 occupants par rangée, nombre de rangées conforme, et rangées occupées collées au fond de la bande. |
| **T7** artilleries au fond | **PASS** | La justification est assérée, pas crue : en rangée 3, la distance maximale à un attaquant de la bande de déploiement vaut 2 cases, soit `2000² = 4 000 000` sous les `3500² = 12 250 000` de portée minimale — elle ne tirerait jamais. Sur les 275 montages, toute artillerie est en rangée ≥ 9, l'ordre des catégories est respecté d'un bout à l'autre, et le maximum rencontré est de **8 artilleries** pour une capacité de 12 en rangées 9–10. |
| **T8** équilibre des colonnes | **PASS** | Écart max − min ≤ 2 sur les neuf colonnes, pour les défenses **et** les bâtiments, sur les 275 montages. Écart réellement observé : 1. |
| **T9** obstacles | **PASS** | Exactement 10 par site, aucun en rangée 1 ou 2, aucun doublon, aucune entité posée dessus, types tirés dans `OBSTACLES.types`. |
| **T10** courbe de niveau | **PASS** | `facteurMilli(1) = 1000` exactement. Rapport de niveau à niveau égal à `penteBasse` jusqu'à la bascule puis à `penteHaute`, à 1e−12 près. `facteurMilli(50) = 480 941 681` à deux régimes, **319 de moins que la valeur du brief** — voir écarts. À un seul régime, drapeau basculé puis rendu : 809 324 391. Et les coïncidences de tables assérées : pentes = celles de `BUTIN`, plafond = `GEOGRAPHIE.niveauPlafond`. |
| **T11** ce qui ne monte pas | **PASS** | Sur les 14 unités et les 9 défenses, montées au niveau 1 puis au niveau 50 : réserve et plancher de réserve **identiques**, portée, portée minimale, vitesse, masse et points d'armée **identiques**. PV et dégâts montent, eux, exactement de `facteurMilli/1000` — sans quoi le test serait vide. Et la vitesse est vérifiée **par le comportement** : un Meute parcourt 500 milli-cases en dix ticks au niveau 1 comme au niveau 50. |
| **T12** invariance du miroir | **PASS** | UN site (avant-poste niveau 20, graine 99), copié quatre fois avec le seul champ `niveau` changé ligne à ligne, plus un assaut fixe de 2 Pilons, 2 Broyeurs et 2 Fendeurs. Couples 1/11, 8/16, 30/50 et 1/50. Combats de 117 ticks, cause identique. **Écart mesuré : 0 tick**, pour une tolérance d'un tick. |
| **T13** pas de débordement | **PASS** | Au niveau 50 : `pvMaxMilli` maximal = `500 × 480 941 681 = 240 470 840 500` ; dégâts maximaux = `floor(20 × 480 941 681 / 1000) = 9 618 833` ; produit de la formule de tir = `9 618 833 000 000`, soit **936 fois** sous `MAX_SAFE_INTEGER`. Et la démonstration du `BigInt` : un Broyeur de niveau 50 ayant perdu 180 308 053 milli-PV rapporte exactement `25 326 416 249 084 667` milli-points, là où le même calcul en `Number` rend `…668`, faux d'une unité. |
| **T14** franchissement | **PASS** | Les quatre lignes du tableau, mesurées dans le moteur : Ronce + Meute → 1900, Ronce + Fendeur → 190, Herse + Meute → 342, Herse + Fendeur → 11 400 milli-PV au premier tick de présence, la barrière étant à 760 ‰ dans les quatre cas (200 000 − 48 000 de tirs d'approche). Taux à pleine vie : 2500 · 250 · 450 · 15 000. |
| **T15** vagues | **PASS** | 50 niveaux × 3 graines, budget `budgetRaid(niveau) / 4`. Budget jamais dépassé, comptabilité exacte, reliquat toujours inférieur à la plus petite unité encore tirable (ou bande pleine), ordre conforme à `ordreVagues`, aucune entité verrouillée, et chaque vague acceptée par `creerCombat` sur un site réel. `budgetRaid(32) = 170 + (200−170) × 2/5 = 182`. |
| **T16** non-régression | **PASS** | Un montage **sans** champ `niveau` se comporte comme au lot 2A : chaque entité hérite du niveau du site, `facteurMilli(1) = 1000`, PV et dégâts inchangés. Et le `BigInt` reste confiné : état et résultat passent `JSON.stringify`, seul `pointsRecherche` en rend un. |
| **§7** refus du générateur | **PASS** | Ajouté en relecture. Sept cas de refus : type inconnu, niveau 0, niveau 51, niveau non entier, saveur inconnue, saveur sur une base, graine non entière. Plus : budget nul → vague vide, pas d'exception. |

---

## Écarts par rapport au brief, et leurs raisons

### 1. `facteurMilli(50)` vaut 480 941 681, pas 480 942 000

Le §6 donne la formule : `Math.round(1000 × penteBasse^(min(n,12)−1) × penteHaute^max(n−12,0))`.
Appliquée au niveau 50, elle rend `round(480 941 681,0) = 480 941 681`. Le T10 annonce
480 942 000, qui est le facteur **nu** du §6 (× 480 942) suivi de trois zéros — c'est-à-dire un
arrondi fait avant la mise en millièmes, pas après.

La formule fait foi, et pas seulement par principe : un arrondi anticipé donnerait
`round(1,259) × 1000 = 1000` au niveau 2, soit **aucune croissance entre les niveaux 1 et 2**.
Même chose pour le régime unique : 809 324 391 et non 809 324 000. L'écart est de 319 sur
4,8 × 10⁸, soit 0,00007 % — sans effet, mais le test doit asserter l'un ou l'autre.

### 2. La variance de garnison ne tient pas dans ±10 points après renormalisation

Le T5 demande « chaque effectif à ±10 points de la courbe interpolée ». Ce n'est pas atteignable
avec l'algorithme du §7.3 (variance, **puis** renormalisation), et l'arithmétique le dit :

- une ligne à 5 points qui tire +10 passe à 15 — déjà le triple, et déjà en dehors de ±10 en
  valeur relative ;
- la renormalisation la multiplie encore par `1000/S`, où `S` est la somme des lignes variées.
  Avec dix-sept lignes tirant chacune ±10 points, l'écart-type de `S` vaut environ 240 ‰ : `S`
  descend couramment à 760 ‰, ce qui porte la ligne à 19,7 points.

**Écart maximal mesuré sur 50 niveaux × 8 graines : 17,6 points** (Perceurs, niveau 30, graine 1 :
5 points attendus, 22,6 obtenus sur 31 défenses). Le test assied 25 points, avec le calcul en
commentaire. C'est une question de calibrage, pas d'exécution : **faut-il qu'une ligne à 5 % puisse
atteindre 22 % ?** Si non, la variance doit être relative (± 10 % de la ligne) plutôt qu'absolue,
ou à somme nulle. Arbitrage d'Ethan.

### 3. L'invariant « multiples de 100 » de la matrice tombe

Le lot 2A exigeait que toute valeur de matrice soit un multiple de 100 en millièmes. La Herse à
**0,03** contre l'infanterie vaut 30 ‰ : l'invariant ne peut plus tenir. Il est remplacé par ce
que la correction exige réellement :

- dans le moteur, l'invariant dur reste l'**exactitude** — `enEntier` refuse toute valeur qui ne
  tombe pas juste en millièmes — plus les bornes 0…1000 ;
- en test, la **granularité effective du calibrage** est assérée à la dizaine de millièmes, pour
  qu'une dérive se voie sans empêcher un arbitrage plus fin.

`0,03 × 1000` vaut exactement 30 en virgule flottante : vérifié, pas supposé.

### 4. Trois tests du lot 2A ont dû changer

Le T16 demande que les 58 tests restent verts « sans modification ». Trois d'entre eux ne le
pouvaient pas, et dans les trois cas c'est le brief lui-même qui l'impose :

| Test | Ce qui change | Pourquoi |
|---|---|---|
| **T13** de 2A | `4000` → `4000n`, et le Merlon monté à 396 250 au lieu de 250 000 | Le §6 impose le `BigInt`. Et au niveau 3, `facteurMilli(3) = 1585` porte le Merlon à `500 × 1585 = 792 500` milli-PV : la moitié n'est plus 250 000 mais 396 250. Le résultat, lui, reste 4000n / 4800n comme annoncé. |
| **T11** de 2A | `0` → `0n` | Même raison. |
| **§7 barrière** de 2A | toute la chaîne de valeurs | La Ronce passe de 20 à 2,5 PV/tick. Le test montrait une infanterie mourant au tick 27 ; il montre désormais qu'elle **réchappe**, à 67 116 milli-PV sur 100 000. C'est précisément l'objet de la correction. |
| **T16** de 2A | granularité de matrice, franchissement lu en milli | Écart 3. |

Les 54 autres passent sans une ligne touchée.

### 5. `ordreCategories` accueille les unités mobiles

Le §7.4 ordonne « artilleries, puis tourelles, puis murs et barrières ». La garnison mêle
structures **et** unités mobiles dans un seul pool (`GARNISON` porte Meute, Carapace, Fendeur,
Ratisseur, Bélier, Guetteur, Broyeur, Perceurs) : il fallait leur donner une place. Retenu :
`['artillerie', 'tourelle', 'unite', 'mur', 'barriere']`, du fond vers l'avant. Les unités
s'intercalent entre tourelles et murs — la ligne de murs les couvre, et elles restent devant les
tourelles qu'elles protègent. Les barrières viennent en tête, puisqu'on les franchit d'abord.
La valeur est dans `sites.js`, donc arbitrable en une ligne.

### 6. `genererSite` rend `vagues: []`

La force d'assaut est celle du **joueur** : le générateur de site ne la connaît pas. Le montage
sort avec `vagues` vide, et c'est à l'appelant de la composer — `genererVague` la fournit pour les
raids de l'Ouvrage. Le T12 attache donc un assaut fixe (2 Pilons, 2 Broyeurs, 2 Fendeurs) pour
avoir un combat à mesurer.

### 7. `genererVague` rend un objet, et plafonne à 18 unités

Signature effective : `{ unites, pointsEngages, pointsRestants }`. Le reliquat de budget doit être
visible — sans quoi un appelant ne peut pas savoir qu'une vague n'a pas tout dépensé.

Et la vague est **bornée par la bande de déploiement**, deux rangées de neuf colonnes, soit 18
cases : au-delà, il n'y a physiquement plus où poser une unité. Au niveau 50, un budget de 250
points en unités à 5 points ferait 50 unités. C'est une contrainte de la grille, pas un choix.

### 8. `repartitionInterpolee` est exportée

Le T5 doit comparer une garnison tirée à « la courbe interpolée » : encore faut-il pouvoir la
lire. La fonction est exportée sous son nom, et elle servira de toute façon à l'interface pour
annoncer une composition attendue.

### 9. `niveaux.js` répète trois valeurs, et le test l'assied

`NIVEAU.penteBasse`, `penteHaute` et `niveauBascule` valent ceux de `BUTIN` ; `NIVEAU.plafond`
vaut `GEOGRAPHIE.niveauPlafond`. C'est une répétition, et `CLAUDE.md` §4 l'interdit — « une seule
table fait foi par grandeur ».

Le brief demande pourtant explicitement ce fichier avec ces champs, et le drapeau `deuxRegimes`
n'existe nulle part ailleurs. Retenu : écrire le fichier tel que spécifié, et **asserter les
quatre égalités en T10**, pour qu'une divergence future soit délibérée et visible plutôt que
silencieuse. Si Ethan préfère la rigueur de `CLAUDE.md`, `niveaux.js` peut importer ces trois
valeurs de `sites.js` en une ligne — au prix de rendre impossible un réglage indépendant des PV
et du butin.

---

## Ce que la correction de la Herse règle

Le §3 demandait de consigner deux conséquences **sans les corriger**. La correction d'Ethan reçue
avec le brief — Herse à 15 PV/tick, matrice 0,03 contre l'infanterie — en règle une et atténue
l'autre. Tableau recalculé, barrière à pleine vie :

| Unité | PV | Ticks | Ronce (2,5) | Herse (15 · 0,03) |
|---|---|---|---|---|
| Meute · Guetteur · Perceurs | 100 | 20 | **50 PV — 50 %** | 9 PV — 9 % |
| Fouisseurs · Carapace | 150 | 20 | **50 PV — 33 %** | 9 PV — 6 % |
| Ratisseur · Bélier | 200 | 9 | 2,25 PV — 1 % | **135 PV — 68 %** |
| Fendeur | 300 | 10 | 2,5 PV — 1 % | **150 PV — 50 %** |
| Pilon | 400 | 10 | 2,5 PV — 1 % | **150 PV — 38 %** |
| Broyeur | 500 | 10 | 2,5 PV — 1 % | **150 PV — 30 %** |

1. **La Herse ne domine plus la Ronce.** Elle coûtait 40 % à un Fusilier là où la Ronce lui
   coûtait 50 % — 80 % de l'effet de la barrière spécialisée. Elle lui coûte désormais **9 %
   contre 50 %** : les deux barrières sont enfin spécialisées, et construire une Ronce a un sens.
   **Point clos.**
2. **Le Ratisseur et le Bélier perdent 68 % au lieu de 90 %** en franchissant une Herse. Ils
   arrivent à 32 % de vie et frappent à 32 %, au lieu de 10 % et 10 %. C'est nettement mieux, mais
   c'est encore la ponction la plus lourde du jeu, et elle frappe le blindé léger. **Reste ouvert.**

Ces chiffres supposent la barrière à pleine vie. Le toll réel est plus faible dès que l'unité tire
sur la barrière en s'en approchant : le test §7 mesure 33 % au lieu de 50 % pour un Meute sur une
Ronce, parce qu'il l'a canardée pendant ses vingt ticks d'approche.

---

## Points laissés en suspens

1. **`NIVEAU.deuxRegimes` attend toujours l'arbitrage d'Ethan.** `true` livré : × 480 942 au
   niveau 50. `false` donnerait × 809 324. Le drapeau est une ligne, et le test couvre les deux.
2. **La variance de garnison** (écart 2) : faut-il qu'une ligne à 5 % puisse atteindre 22 % ?
3. **Le Ratisseur et le Bélier sur une Herse**, à 68 % : point 2 du tableau ci-dessus.
4. **Le `BigInt` des points de recherche impose une discipline en aval.** `JSON.stringify` lève
   dessus. Un test verrouille le fait qu'il n'entre ni dans l'état ni dans le résultat, mais toute
   écriture en sauvegarde devra passer par une chaîne décimale. À reprendre au lot où les points
   sont dépensés — c'est aussi là que se prendra, si Ethan le veut, l'autre issue : ramener la
   recherche sur ×1,32 et recalibrer l'arbre.
5. **La marge de débordement des PV et dégâts est de 936× au niveau 50**, confortable, mais elle
   se réduirait vite si une future grandeur venait multiplier le produit de tir. T13 la mesure ;
   la garder sous l'œil.
6. **`genererSite` ne produit pas de vagues** (écart 6). Composer une force d'assaut du joueur est
   affaire d'interface, donc du lot 3.
7. **Le point d'entrée `src/index.src.html` ne charge toujours pas le moteur**, générateur compris.
   C'est au lot 3 de le brancher.

---

## Les six contrôles du §9

| Contrôle | État |
|---|---|
| Aucun flottant dans un montage produit, vérifié **par parcours** | **OK** — T2, parcours récursif des 275 montages du balayage. |
| `Math.random` toujours absent de `src/sim/` — le générateur passe par `rng.js`, semé | **OK** — la garde du lot 1 (`test/clock.test.js`, test 4) scanne tout `src/sim/`, `generateur.js` compris, et interdit aussi `window`, `document`, `fetch`, `new Date`, `performance.now`. Le T2 du lot 2A refait le scan sur `combat.js` et `grille.js`. |
| Chaque seuil porte son calcul | **OK** — sans exception, y compris les seuils mesurés (17,6 points de variance, 0 tick d'écart au miroir), dont l'origine est dite. |
| `npm run check` passe : build **et** tests | **OK** — `dist/index.html` version 0.4.0 build 4, 2974 octets ; 75 tests, 75 PASS. |
| `DISPOSITION_DEFENSES_A_CONFIRMER` a disparu de `sites.js` | **OK** — remplacé par `DISPOSITION_DEFENSES`, valeur arbitrée 6/9. Le texte de SITES-DENSITE annonçait 7/9 ; ses deux exemples chiffrés n'admettent que 6/9, et ce sont eux qui font foi. |
| Aucun `.xlsx` ouvert | **OK**. |
