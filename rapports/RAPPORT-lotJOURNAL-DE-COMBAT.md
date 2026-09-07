# RAPPORT — lot JOURNAL-DE-COMBAT

`tick()` calculait déjà qui tire, qui encaisse et qui meurt, **puis le jetait**.
Il publie maintenant cinq listes en lecture seule. **Le lot ne calcule rien de
neuf : il cesse de jeter.**

Version produite : **0.87.0 · build 89** (les deux bumpés ENSEMBLE, et **en
chaînes JSON** — `android/app/build.gradle.kts` les lit `as String`).

---

## 0. Référence, avant et après

| | avant (`origin/main`, 68eb0ac) | après |
|---|---|---|
| `npm test` | **1 000 pass / 0 fail** | **1 015 pass / 0 fail** |
| `dist/index.html` | **6 773 971 octets** | **6 779 831 octets** |
| références externes | 0 | 0 |
| `data:` inlinés | 284 (263 audio + 21 images) | **284** (263 + 21) |

**Coût : +5 860 octets.** Mesuré poste par poste contre un livrable **rebâti
depuis `main`** dans un `git worktree`, jamais estimé :

| poste | avant | après | écart |
|---|---|---|---|
| `data:audio` (263) | 1 193 346 | 1 193 346 | **+0** |
| `data:image` (21) | 5 130 772 | 5 130 772 | **+0** |
| feuille de style | 4 481 934 | 4 481 934 | **+0** |
| balisage | 1 964 070 | 1 964 070 | **+0** |
| **JavaScript** | 326 037 | 331 897 | **+5 860** |

**Le coût est entièrement du JavaScript.** Borne T10 **inchangée à 7 000 000**,
marge **220 169 octets, 3,15 %**.

⚠ La baseline `npm run check` sur le clone intact était **VERTE — 1 000 pass / 0
fail**. C'est le premier lot depuis quatre où la garde d'entrées ne rougit pas :
`art/sources/` n'a pas bougé d'un fichier, et le lot n'y ajoute rien.

---

## 1. La preuve d'additivité — le cœur du lot

**Le journal ne change aucun résultat.** C'est la seule chose qui compte, et elle
se prouve.

### Elle ne se fait PAS en comparant deux exécutions d'un même code

`test/temoins-combat.js` porte **deux cents combats** relevés dans un
`git worktree` positionné sur `origin/main`, **avant qu'une ligne du moteur ne
bouge**, et commités tels quels. Neuf colonnes par ligne :

nom · SHA-256 du résultat · SHA-256 de l'état sérialisé · cause de fin · tick de
fin · butin · points de recherche · PV restants par famille · détruits par
famille.

Le fichier ne se rafraîchit pas — même règle que `temoins-bases-0.js`. Le
recapturer sur le code modifié ferait comparer un code à lui-même.

### Ce qui a été mesuré

- **Balayage : 400 combats** — 5 graines × 4 niveaux (5, 20, 35, 50) × 5 types
  (`camp`/`richeQuartz`, `camp`/`richeScorie`, `avantPoste`/`richeQuartz`,
  `avantPoste`/`richeScorie`, `base`) × 2 armées (les 14 unités, puis une sur
  deux).
- **Huit champs comparés par combat, soit 3 200 valeurs. ÉCARTS : 0.**
- Les **200 premiers** sont le témoin commité, rejoué par `JOURNAL T1` à chaque
  `npm test`.

⚠ **L'état se compare sans sa sortie neuve.** `journal` et `vaguesPosees` sont ce
que le lot AJOUTE ; les opposer à un témoin qui ne les connaît pas ne dirait
rien. Tout le reste de l'état y est, à l'octet.

### Le générateur n'est pas touché

Mesuré de la façon la plus forte possible : **`src/sim/combat.js` ne porte AUCUNE
source d'aléa**, et n'en portait aucune avant le lot — zéro occurrence de `rng`,
`Math.random`, `tirer(`, `Date.now`, motifs bornés en Unicode. Le moteur de
combat est déterministe par construction depuis toujours. `JOURNAL T9` le garde
avec son appât, et un `tirer(etat.rng)` glissé dans le journal le fait tomber
(falsification n° 17 ci-dessous).

En complément, **30 états de générateur** relevés après combat complet des deux
côtés du lot : **0 écart**.

### L'ordre du tick est intact

`JOURNAL T3` lit le corps de `tick()` et exige les onze appels dans l'ordre, avec
le vidage du journal **en tête** — étape 0, avant `expirerEffets`. Il exige aussi
**exactement un** `journalVide()` dans `tick`.

---

## 2. Ce que le journal publie, champ par champ

Cinq listes, remises à zéro en tête de `tick`. Tous les faits partagent le même
noyau, rendu par `faitDeLEntite(e)` :

```
indice · id · genre · proprietaire · rangee · colonne
```

| liste | champs propres | source du fait, dans le moteur |
|---|---|---|
| `vagues` | `numero`, `effectif`, `proprietaire` | `apparitionDeVague` — l'entrée d'une vague |
| `apparitions` | *(le noyau seul)* | `apparitionDeVague` — une entité par pièce posée |
| `tirs` | `cibleIndice`, `cibleRangee`, `cibleColonne` | `tir()` — seconde passe sur `e.aTire` |
| `impacts` | `encaisseMilli`, `pvMaxMilli` | `appliquerDegats` — après la garde `encaisse <= 0` |
| `destructions` | *(le noyau seul)* | `retirerLesMorts` **et** l'écrasement de `deplacement` |

Relevés sur un raid réel (avant-poste niveau 20, graine 3, 290 ticks) :

```
vague        {"numero":1,"effectif":4,"proprietaire":"joueur"}
apparition   {"indice":47,"id":"meute","genre":"unite","proprietaire":"joueur","rangee":2,"colonne":1}
tir          {"indice":18,"id":"belier","genre":"unite","proprietaire":"ouvrage","rangee":7,"colonne":3,
              "cibleIndice":50,"cibleRangee":4,"cibleColonne":4}
impact       {"indice":50,"id":"frappeur",...,"encaisseMilli":152900,"pvMaxMilli":3363800}
destruction  {"indice":50,"id":"frappeur","genre":"unite","proprietaire":"joueur","rangee":7,"colonne":4}
```

⚠ **Rien n'est dérivé par comparaison d'états entre deux ticks.** Un diff
raterait ce qui naît et meurt dans le même tick.

⚠ **Les faits sont des COPIES.** `JOURNAL T4` mute chaque champ de chaque fait et
vérifie que l'état ne bouge pas. Rendre l'entité elle-même fait tomber 2 tests.

⚠ **UN FRANCHISSEMENT PUBLIE UN IMPACT ET AUCUN TIR, ET C'EST JUSTE.** Une
barrière ne tire pas — elle saigne ce qui la franchit : le moteur ne pose jamais
`aTire` pour elle, mais ses dégâts entrent dans le tampon, donc la victime voit
son impact. Quelque chose a été blessé, rien n'a fait feu. `JOURNAL T5` exclut
donc barrage et franchissement de l'égalité tirs ↔ `aTire`.

⚠ **`tir()` publie en SECONDE PASSE**, délibérément : la première passe est un
enchaînement de `continue` qui décident qui tire ; y intercaler un `push` aurait
fait dépendre le journal de l'ordre exact des gardes. On relit `e.aTire`, que le
moteur pose déjà. `JOURNAL T5` confronte les tirs journalisés à `aTire` tick par
tick, barrage et franchissement exclus.

### ⚠⚠ Le moteur a DEUX sites de mort, et le second a été trouvé par un test

Mon propre commentaire dans `retirerLesMorts` affirmait « c'est la seule ligne du
moteur qui fasse passer `vivant` de vrai à faux ». **C'était faux.**
L'ÉCRASEMENT, dans `deplacement` (phase 7), en est une autre.

**Mesuré : une pièce sur vingt-trois manquait au journal sur la graine 9** — un
`belier` portant `ecrase: true`. `JOURNAL T6` l'a dit ; aucune relecture ne
l'avait vu. Les deux commentaires sont réécrits, et ils disent d'où vient la
correction.

### Le journal vit UN tick, y compris quand personne ne le lit

`resoudre()` boucle sans lecteur — c'est le cas de « Instantané » et de tous les
raids de l'Ouvrage résolus hors ligne. **Mesuré sur un combat complet** (camp
niveau 25, graine 11, > 200 ticks) : le journal produit **plus de 1 000 tirs au
total** et n'en garde jamais plus de quelques dizaines à un instant. Sur le raid
de référence ci-dessus : **1 682 tirs, 938 impacts, 18 destructions,
10 apparitions, 3 vagues en 290 ticks — pire tampon d'un tick : 24 faits.**

L'accumulation aurait donc été fatale, pas gênante. `JOURNAL T2` la garde, et
retirer le vidage fait tomber **6 tests sur 9**.

---

## 3. Le point dur n° 2 — ce qui sonne, et à quelle cadence

### La règle, écrite et mesurée

**Un événement distinct sonne au plus une fois par relevé**, quel que soit le
nombre de faits qui le réclament. `evenementsDuJournal` rend un **ENSEMBLE**.

Le motif : `ticksDus` résout jusqu'à **douze ticks dans la même image en ×4**, et
un raid publie des dizaines de tirs par tick. Un son par tir publié ferait des
centaines de coups de canon dans la même milliseconde. **La politique de voix les
refuserait** — mais compter sur un refus n'est pas une conception : ce serait
demander des centaines de sons pour en obtenir quelques-uns, à chaque image, et
la règle ne serait écrite nulle part.

**Mesuré sur 45 raids réels**, au pire instant de chacun :

| fenêtre | faits publiés | **événements distincts demandés** |
|---|---|---|
| 1 tick | 29 | **17** |
| 4 ticks (une fenêtre de 100 ms à ×4) | 102 | **17** |
| 12 ticks (le pire que `ticksDus` résout d'un coup) | **272** | **20** |

Deux cent soixante-douze faits, vingt sons. C'est l'ensemble qui fait ça, et il
le fait avant que la politique de voix ne voie quoi que ce soit.

`SON T22` le garde : 150 tirs de la même pièce → **un** son ; deux pièces
différentes → **deux**.

### Où le relevé se prend, et ce que ça donne aux trois vitesses

Le relevé se prend **là où l'instantané d'interpolation se prend** — dans
`avancerDUnTick`, trois lignes : `precedentes = prendrePositions(combat)`,
`tickCombat(combat)`, `relever()`.

⚠ **Et la session ne vide ce relevé que dix fois par seconde**, pas à chaque
image : `reconcilierLeSon` est derrière la garde `instant - dernierAffichageMs >=
100` de `session.js`, celle qui existe depuis toujours pour ne pas réécrire six
nombres soixante fois par seconde. L'écran accumule dans un `Set` entre deux
passages ; la borne est donc celle du tableau ci-dessus, pas celle d'une image.

| mode | ticks par relevé de la session | ce qui sonne |
|---|---|---|
| **×1** | 1 | les événements du tick — au pire 17 mesurés |
| **×4** | jusqu'à 12 | l'**union**, dédoublonnée — au pire **20** mesurés |
| **Instantané** | tout le combat, d'un bloc | **RIEN** |

⚠⚠ **« Instantané » est muet PAR CONSTRUCTION, pas par un cas particulier écrit à
la main.** Il boucle sur `tickCombat` sans prendre d'instantané — **exactement
comme il le faisait déjà avant ce lot** — donc il ne relève rien. Un combat
résolu d'un coup n'a pas de déroulé.

⚠ **C'est une PROPOSITION sur le fond**, et le brief le demandait ainsi :
« ce qui sonne en Instantané : proposer, pas trancher ». Le rendre sonore
demanderait de choisir quoi jouer d'un combat entier compressé en une image.
**Ethan tranche** ; côté code, c'est une ligne.

`SON T24` lit les trois lignes d'`avancerDUnTick` **et les quatre de
`relever()`** — voir la falsification n° 12, qui ne mordait pas au premier
relevé.

---

## 4. Les comptes : ce qui sonne sur 263

### Ce que le câblage peut rendre

**74 événements sur 135 · 169 sons sur 263 · 94 muets.**
On passe de **24 sons** (lot SON-CÂBLAGE) à **169**.

L'ensemble se **calcule** de bout en bout, il ne se recopie pas : les deux tables
de boucles, la règle de roulement jouée sur les 14 unités × 2 propriétaires × 2
situations, tous les gestes, et la traduction d'un journal portant **tous** les
faits possibles. Une liste écrite à la main déclarerait muet ce qui sonne — le
mensonge le plus dangereux de ce test.

### Ce qu'un raid ATTEINT vraiment

⚠⚠ **Et ce n'est pas le même nombre, il faut le dire dans ce sens-là.**

Balayage de **36 raids réels** (4 graines × 3 niveaux × 3 types, 900 ticks au
plus, les 14 unités engagées) : **47 événements atteints sur les 63 que le combat
peut demander.**

Les **seize** qui manquent, nommés un par un — et ils demandent tous la même
chose : **que l'Ouvrage attaque, ou que le joueur défende**, ce qu'aucun écran ne
montre. `src/ui/raid.js` ne montre qu'un raid **du joueur** ; le raid de
l'Ouvrage se résout **hors ligne** depuis le lot RAID-B.

| son muet en jeu | ce qu'il demande |
|---|---|
| `alert_ouvrage_wave_start` | que l'Ouvrage attaque |
| `movement_essaim_ouvrage_loop`, `movement_walker_{light,medium,heavy}_loop` | idem |
| `engine_ouvrage_{light,medium,heavy}_idle_loop` | idem |
| `movement_ouvrage_deploy`, `movement_ouvrage_flyby` | idem |
| `alert_player_structure_lost`, `building_player_collapse_{small,medium,large}` | que le joueur défende |
| `weapon_player_aa` | idem — la DCA du joueur |
| `weapon_ouvrage_aa_burst` | **le Frappeur**, qui n'apparaît dans AUCUNE garnison que `genererSite` produit — vérifié sur 96 sites |

`SON T23 bis` fige cette liste ; elle tombera le jour où l'écran du raid de
l'Ouvrage existera, ce qui est ce qu'on lui demande.

---

## 5. Les 94 sons muets, un par un, avec leur raison

### Impacts — 36 (la plus grosse famille)

`impact_dirt_{small,heavy}_01..04` · `impact_quartz_*` · `impact_scoria_*` ·
`impact_energy_*` · `impact_ricochet_01..04`

⚠⚠ **Le motif est MESURÉ, pas supposé.** Le moteur ne publie un impact que sur
une **entité touchée** : il n'a **ni tir manqué, ni projectile qui retombe à
côté**, donc **aucune case vide n'est jamais frappée**. `dirt` et `ricochet`
n'ont pas de fait à écouter.

Le brief demandait de mesurer si le champ de bataille connaît le quartz et la
scorie : **il ne les connaît pas**. Le montage de combat porte `obstacles`, dont
les trois types sont `infanterie`, `vehicule`, `les_deux` — c'est ce qu'ils
bloquent, pas de quoi ils sont faits. `impact_energy_*` : aucune arme à énergie
n'existe.

**Seul le métal sonne**, sur deux tailles.

### Armes — 5, et aucune n'est un tir

`weapon_ouvrage_beam_{start,loop,end}` — un RAYON CONTINU, que le moteur n'a pas :
il tire par ticks. Aucune des neuf défenses n'est une arme à énergie, mesuré.
`weapon_missile_lock`, `weapon_missile_flight_loop` — le VOL d'un missile, qui
demanderait un projectile en vol ; le moteur applique ses dégâts au tick du tir.

### Alertes — 12 sur 18 (six sonnent)

Sonnent : `wave_start`, `unit_lost`, `structure_lost`, dans les deux camps.

Muettes : `wave_end` (le moteur ne publie pas de fin de vague — une vague
n'existe pas comme objet, ses unités entrent et se fondent dans `entites`) ;
`enemy_spotted` et `incoming_artillery` (aucun fait de repérage, aucun projectile
en vol) ; `base_attacked` (il n'y a pas d'état « base attaquée » qui dure —
`subirUnRaid` résout un raid en un instant) ; `insufficient` et `low_power`
gardent le motif déclaré au lot précédent — le refus sonne déjà `ui_error`, et le
modèle n'a pas d'état « manque de courant ».

### Bâtiments — 12

Les six effondrements sonnent, dans les deux camps. Restent muets :
`construction_loop` et `complete` côté Ouvrage (il ne construit rien sous les
yeux du joueur), `alarm_loop` (pas d'état « base attaquée » qui persiste),
`repair_loop` (la réparation est un STOCK depuis le lot RÉSERVE, elle ne dure
pas), `factory_loop` côté Ouvrage (aucun écran ne montre sa base au repos),
`power_up`/`power_down` (`capacitesMilli` n'est fonction que de la disposition :
les câbler ferait sonner une seconde fois les quatre gestes qui sonnent déjà).

### Ambiances — 5 sur 8

`quartz_field`, `scoria_field`, `reactor_room` demandent un CONTEXTE que l'état
ne dit pas ; `base_ouvrage` n'a aucun écran ; `map_wind` est la seconde ambiance
de carte, et choisir entre elle et `calm_map` est esthétique — **Ethan a tranché
`calm_map` au lot précédent, et rien n'a bougé.**

### Ordres de l'Ouvrage — 6

Il ne donne aucun ordre que le joueur entende.

### Interface — 18

Inchangé depuis le lot SON-CATALOGUE, motif par motif : pas de survol sur un
écran tactile, `toggle_off` ne doit pas sonner en coupant le son, pas de pause de
JEU, pas de file de construction, pas de compte à rebours, l'économie est un tick
continu sans événement discret, et `victory`/`defeat`/`objective_*`
demanderaient de choisir LEQUEL des deux panneaux de raid sonne — décision
esthétique, **Ethan tranche**.

---

## 6. La mémoire — mesurée à travers le vrai adaptateur

`SON T23` joue **un raid entier, 290 ticks**, à travers `src/ui/son.js`, sous une
fenêtre de papier où **un COUP tient son tampon pendant toute sa durée** — ce que
`faussesFenetres` ne fait pas (là-bas un coup se termine à l'instant où il
commence, ce qui suffit à mesurer l'éviction et rend `tenus` toujours vide).

| grandeur | mesure | budget |
|---|---|---|
| pire `secondesDecodees` | **29,996 s** | **30 s** |
| pire nombre de tampons **tenus** au même instant | **6** | — |
| décodages pour 290 ticks | **35** | — |

**Le budget tient, et il n'a pas été gonflé.** Il est bien SATURÉ, donc
l'éviction mord pour de bon — un budget jamais atteint ne prouverait rien.

⚠ **Ce qui pourrait déborder, c'est `tenus`, pas la table.** L'éviction ramène
`secondesDecodees` sous le budget à chaque décodage **sauf** sur les tampons
qu'une source lit : ce sont eux, et eux seuls, qui pourraient dépasser. Ils ne le
font pas.

⚠ **Un premier relevé annonçait un débordement, et il mesurait la mauvaise
grandeur** : il sommait l'union de tout ce qu'une fenêtre de douze ticks demande
comme si tout devait être résident SIMULTANÉMENT — 34,42 s. C'est faux : un coup
de 200 ms ne tient pas son tampon pendant les douze ticks suivants. Le chiffre
est donné pour qu'on sache qu'il a été écarté, et pourquoi.

**Plafond total inchangé : 12,29 Mo (8 ambiances résidentes) + 5,76 Mo (30 s de
budget) = 18,05 Mo**, contre 64,67 si tout était décodé.

---

## 7. Le coût en temps

Mesuré sur **24 442 ticks** (5 graines × 4 niveaux × 3 types, les 14 unités),
sept exécutions, médiane retenue :

| | médiane | minimum |
|---|---|---|
| avant (`origin/main`) | **381,2 ms** | 337,4 |
| après | **405,2 ms** | 321,0 |

**+6,3 %.** ⚠ Le **nombre de ticks est identique des deux côtés** — 24 442 — ce
qui est la même additivité vue par un autre bout.

---

## 8. Les tables : ce qui est dérivé, ce qui est arbitré

⚠ **Toutes les ancres ci-dessous sont extraites des fichiers, jamais retapées** :
`tools/sons.py` lit `art/sources/unit_audio_map.json` et
`art/sources/sfx_manifest.json` à chaque exécution, et `test/son.test.js` rejoue
les dérivations en JavaScript contre les mêmes fichiers.

### Les armes : DÉRIVÉES, par substitution vérifiée

Le jeu porte **quatorze unités et deux jeux de noms** — `meute` s'appelle *Meute*
pour l'Ouvrage et *Fusiliers* pour le joueur —, si bien que le bloc `player` de
la carte couvre les quatorze pièces **des deux camps**. On substitue `_player_` →
`_ouvrage_` et on **EXIGE** que le résultat soit un événement du pack.

⚠⚠ **ÉCART DÉCLARÉ : le brief annonce « vingt-sept contreparties ». Mesuré, il y
en a DOUZE.** Vingt-sept est le nombre de sons `weapon_*` du pack, pas celui des
substitutions : les quatorze paires ne portent que **douze `variant_set`
distincts** — Voltigeurs et Fusiliers partagent le fusil, Pionnier et Chasseur le
canon moyen. **Douze substitutions, douze résolues, zéro manquante.**

⚠ **Deux des douze ne sont pas des `weapon_*`** : le pack fait tirer
`explosion_player_small` aux Sapeurs/Fouisseurs et `explosion_player_large` à
l'Albatros/Enclume. La substitution y marche à l'identique.

### Les neuf défenses : un ARBITRAGE, et les ancres du brief sont JUSTES

⚠ Le brief demandait de les remesurer, « trois briefs sur trois portaient au
moins une ancre fausse ». **Remesuré dans `DEFENSES` le 04/09 : les six lignes
sont exactes, dominante ET portée.**

| défense | dominante mesurée | portée | arme retenue |
|---|---|---|---|
| `casemate` — Tourelle mitrailleuse | infanterie **20** | **2,5** | `weapon_*_machinegun` |
| `creneau` — Canon anti-char | vehicule **35** | **2,5** | `weapon_*_cannon_medium` |
| `batterie` — DCA | structureOuAviation **40** | **2,5** | `weapon_*_aa` |
| `faucheuse` — Mirador | infanterie **10** | **5,5** | `weapon_*_machinegun_burst` |
| `mortier` — Artillerie lourde | vehicule **12** | **5,5** | `weapon_*_artillery` |
| `harpon` — SAM | structureOuAviation **16** | **5,5** | `weapon_*_missile_launch` |
| `merlon`, `ronce`, `herse` | **`degats: null`** | 0–1 | **muettes** |

⚠⚠ **`ARME_PAR_DEFENSE` reste une table SÉPARÉE d'`ARME_PAR_PAIRE`**, et c'est
voulu : la carte du pack ne décrit **aucune** défense — mesuré, aucune de ses
clés n'en nomme une. Les fondre ferait croire que les deux moitiés se lisent au
même endroit. **L'une est dérivée, l'autre est un arbitrage d'Ethan.**

⚠ **`weapon_missile_lock` et `weapon_missile_flight_loop` n'ont PAS été câblés
sur le Harpon**, contrairement à ce que le brief suggérait : le moteur n'a ni
verrouillage, ni projectile en vol — il applique ses dégâts au tick du tir. Les
brancher inventerait une mécanique. **Déclaré, pas contourné.**

### Le roulement : par CHÂSSIS, quatre lignes sur six confrontées à la carte

`verifier_les_roulements` de `tools/sons.py` **EXIGE**, à chaque exécution, que
les quatre paires que la carte décrit — Fusiliers `infantry`, Ratisseur
`tracks_light`, Fendeur `tracks_medium`, Broyeur `tracks_heavy` — rendent
exactement ce que la table dit, et que **tout nom de roulement ou de moteur soit
un événement du pack qui BOUCLE**.

⚠ **Bélier et Pilon sont l'écart assumé d'Ethan** : la carte leur donne `deploy`
et aucun roulement ; ils prennent le roulement moyen **en plus**. Ce sont les
seuls que ce contrôle ne couvre pas, et le code le dit.

⚠ **Un aéronef `traversant` ne roule pas : il PASSE.** `movement_player_flyby`
n'est pas marqué `boucle` par le pack — c'est la DONNÉE qui l'interdit, et `SON
T15` le mesure. Son coup se joue à l'APPARITION.

⚠ **Les moteurs à l'arrêt** — l'une des six décisions rendues par Ethan : « unité
vivante et immobile pendant un raid ». C'est une **lecture d'état**, pas un
événement, donc `etatDesUnites` rend désormais les deux moitiés ensemble. Une
escouade immobile se tait ; un **stoppeur** immobile tient l'air, donc son `dard`
continue.

### Deux paires de seuils, et il en fallait deux — mesuré

`EFFONDREMENT_PV = [2000, 3000]` appliqué aux PIÈCES les classerait
**21 `small`, 2 `medium`, 0 `large`** — deux sons sur trois inatteignables.

`EXPLOSION_PV = [900, 1500]` rend **9 · 10 · 4**, et la partition tombe
exactement sur les trois listes du brief, membre pour membre :

- **small (9)** : Guetteur 500, Frappeur 550, Faucheuse 600, Harpon 650, Meute
  700, Perceurs 700, Mortier 700, Carapace 800, Bélier 800 ;
- **medium (10)** : Fouisseurs 900, Crécelle 900, Ratisseur 1000, Fendeur 1000,
  Ronce 1000, Casemate 1000, Batterie 1000, Busard 1050, Créneau 1250, Pilon 1300 ;
- **large (4)** : Herse 1500, Enclume 1800, Broyeur 2000, Merlon 2000.

⚠ **`EFFONDREMENT_PV` sert les DEUX camps depuis ce lot** : un raid fait tomber
les bâtiments de l'Ouvrage, dont les PV vont de 1 000 à 5 500. Mesuré :
**3 · 5 · 3** côté joueur, **3 · 1 · 1** côté Ouvrage, sur les mêmes seuils.
`effondrementDuBatiment` lit `BASE_BATIMENTS[id] ?? BATIMENTS[id]` ; les deux
jeux de clés sont **disjoints**, et `verifierArithmetique` LÈVE s'ils cessent de
l'être.

⚠ Les six nombres sont des **données**, pas du code : `SON T21` refuse qu'aucun
d'eux soit écrit en dur dans `src/son/cablage.js`.

---

## 9. Le seul arbitrage esthétique encore ouvert

⚠⚠ **`heavy` ou `small` sur un impact — PROPOSITION, PAS ARBITRAGE.**

Retenu : `IMPACT_LOURD_MILLIEMES = 25`, soit **2,5 % des PV MAX de la cible**.

⚠⚠ **Un seuil ABSOLU serait vide de sens, et c'est mesuré.** `facteurMilli` met
les dégâts **et** les PV à l'échelle du niveau : **le même coup encaisse 67
milli-PV au niveau 5 et 34 683 675 au niveau 50** — un facteur cinq cent mille.
Un seuil en milli-PV classerait tout `small` en bas de carte et tout `heavy` en
haut. La **PART**, elle, ne bouge pas : médianes **12 · 13 · 13 · 14 ‰** aux
niveaux 5 / 20 / 35 / 50.

C'est pour cela, et pour rien d'autre, que le fait d'impact porte `pvMaxMilli` :
sans lui, la part ne se calcule pas.

**Un nombre se change seul. Ethan tranche.**

### Ce que le lot n'a PAS touché, et qui reste ouvert

- **Le mixage des quatre familles sans bus** (`explosions` → impacts,
  `buildings` → moteurs, `alerts` et `orders` → interface) reste **provisoire**,
  comme le brief l'exigeait. **Pas de sixième bus.**
- **`calm_map`** reste la seule ambiance de carte — décision rendue, rien n'a
  bougé.
- **`alert_*_insufficient`**, **`power_up`/`power_down`**, **`low_power`** :
  motifs déclarés au lot précédent, inchangés.
- **La correspondance armes / roulements tranchée le 04/09** n'a été ni rouverte
  ni complétée par ressemblance.

---

## 10. Les falsifications — chacune vérifiée avant d'être crue

| n° | falsification | mesure |
|---|---|---|
| 1 | le journal s'accumule (vidage retiré de `tick`) | **3 pass / 6 fail** |
| 2 | le fait partage l'objet de l'état (`faitDeLEntite` rend `e`) | **7 pass / 2 fail** |
| 3 | l'écrasement n'est pas publié | **8 pass / 1 fail** |
| 4 | l'impact ment sur les PV max de la cible | **36 pass / 1 fail** |
| 5 | **le son se choisit sur le CAMP** | voir ci-dessous |
| 6 | la traduction rend une LISTE, pas un ensemble | **27 pass / 1 fail** |
| 7 | `EXPLOSION_PV` retouché à la main dans le fichier généré | **25 pass / 3 fail** |
| 8 | `src/sim/combat.js` importe la table des sons | **45 pass / 2 fail** |
| 8 bis | un import à **effet de bord** vers `src/son/` (sans `from`) | **45 pass / 2 fail** |
| 9 | un passage d'aéronef branché comme un roulement | **24 pass / 4 fail** |
| 10 | l'Instantané relève le journal | **27 pass / 1 fail** |
| 11 | le relevé ne se vide jamais | **27 pass / 1 fail** |
| 12 | **le relevé ne relève rien** | voir ci-dessous |
| 13 | la session ne joue pas le déroulé | **27 pass / 1 fail** |
| 14 | une défense sans dégâts reçoit une arme | **27 pass / 1 fail** |
| 15 | un `variant_set` sans `_player_` | **27 pass / 1 fail** |
| 15 bis | une substitution qui ne se résout pas dans le pack | **27 pass / 1 fail** |
| 16 | les seuils écrits en dur dans la fonction | voir ci-dessous |
| 17 | un tirage glissé dans le journal | **9 pass / 1 fail** |

### ⚠⚠ Trois d'entre elles ne mordaient pas au premier relevé

**n° 5 — le son se choisit sur le CAMP. HUITIÈME FOIS DU DÉPÔT.**
Remplacer `e.proprietaire` par `e.camp === 'attaque' ? 'joueur' : 'ouvrage'`
laissait la suite **ENTIÈREMENT VERTE — mesuré, 37 pass / 0 fail.** La raison :
**tous** les montages du dépôt font attaquer le joueur, si bien que camp et
propriétaire coïncident partout. Le seul état où ils divergent est celui de
`sim/raid-ouvrage.js` — l'Ouvrage attaque, le joueur défend sa propre base. Sans
ce montage-là, « les sons se choisissent sur le propriétaire » aurait été une
phrase que rien ne vérifie. **`JOURNAL T10` a été écrit APRÈS la mesure**, et il
fait tomber la falsification (37 pass / 1 fail). ⚠ La conséquence est audible,
pas théorique : les Cuirassiers du joueur auraient sonné en
`weapon_ouvrage_machinegun` dès le premier raid sur sa base.

**n° 12 — le relevé ne relève rien.** Tronquer
`evenementsDuJournal(combat.journal)` à zéro dans `src/ui/raid.js` laissait `SON
T24` vert : il ne lisait que l'APPEL, pas le corps. L'écran est hors de portée
des tests faute de DOM (CLAUDE.md §3), donc rien d'autre ne pouvait le dire. La
garde lit désormais les **quatre lignes** de `relever()` comme elle lit les trois
d'`avancerDUnTick` — et la falsification tombe (27 pass / 1 fail).

**n° 16 — les seuils écrits en dur.** Recopier `[900, 1500]` dans la fonction est
**invisible sur le RÉSULTAT** — 28 pass / 0 fail —, ce qui est logique : les
nombres sont les mêmes. Ce qui est observable, c'est que la TABLE pilote le
résultat, et la falsification n° 7 le prouve. Une garde de source a été ajoutée à
`SON T21` : elle refuse les six nombres écrits en dur dans `src/son/cablage.js`,
et elle fait tomber la n° 16 (27 pass / 1 fail).

### Les falsifications des lots précédents restent vertes

Reprises et revérifiées : garde de temps élargie à zéro, plafond de voix relevé,
muet désarmé, `Date.now` dans la politique, absence de Web Audio qui lève,
contexte créé au câblage, décodage au réveil, mise en commun retirée, éviction
désarmée, un écran qui joue un son, un tirage branché sur le flux de la partie.
**`npm test` → 1 015 pass / 0 fail.**

---

## 11. Écarts entre le brief et le dépôt — cherchés, pas attendus

1. ⚠⚠ **« vingt-sept contreparties » : il y en a DOUZE.** Vingt-sept est le
   nombre de sons `weapon_*`, pas celui des substitutions. Mesuré, les quatorze
   paires ne portent que douze `variant_set` distincts. **Écart déclaré ; la
   propriété que le brief voulait — chaque substitution existe dans le pack —
   est vraie, et vérifiée à chaque exécution de l'outil.**
2. ⚠⚠ **« cent cinquante-cinq sons cessent d'être muets » : il y en a 145.** On
   passe de 24 à **169**, soit **+145**. Le nombre du titre du brief est haut de
   dix.
3. ⚠ **« Le journal ne s'accumule pas — un combat complet en Instantané laisse un
   tampon borné par un tick » (falsification n° 4 du brief).** Vrai, et la mesure
   est plus forte : le pire tampon d'un tick vaut **24 faits** sur un raid qui en
   produit **2 651** au total.
4. ⚠ **`weapon_missile_lock` et `weapon_missile_flight_loop`** sont suggérés au
   Harpon par le §2 du brief. **Non câblés** : le moteur n'a ni verrouillage ni
   projectile en vol. Déclaré au §8 ci-dessus.
5. ⚠ **La table des défenses du brief est JUSTE** — six ancres, dominante et
   portée, toutes remesurées. C'est le premier brief sur quatre dans ce cas, et
   il fallait le dire aussi.
6. ⚠ **La partition d'`EXPLOSION_PV` du brief est JUSTE**, membre pour membre sur
   les 23 pièces.
7. ⚠ **La baseline `npm run check` était VERTE** (1 000 pass / 0 fail) — le brief
   prévoyait un rouge possible sur la garde d'entrées ; il n'a pas eu lieu, et
   `art/sources/` n'a pas bougé d'un fichier.

---

## 12. Fichiers touchés

| fichier | nature |
|---|---|
| `src/sim/combat.js` | le journal : `journalVide`, `faitDeLEntite`, cinq points de publication, le vidage en tête de `tick` |
| `src/son/cablage.js` | `etatDesUnites`, `boucleDeLUnite`, `armeDuTireur`, `explosionDeLaPiece`, `evenementsDuJournal`, `MOT_DU_PROPRIETAIRE` |
| `src/ui/raid.js` | `avancerDUnTick`, `relever`, `evenementsSonores()`, `unitesDuCombat()` |
| `src/ui/session.js` | la seconde porte : `son.jouer(evenement)` sur le déroulé du raid |
| `src/data/sons.js` | **GÉNÉRÉ** par `python3 tools/sons.py --ecrire` — sept tables entrent, `MOUVEMENT_PAR_PAIRE` sort |
| `tools/sons.py` | les dérivations : armes, déploiements, contrôle des roulements |
| `test/journal.test.js` | **entre** — 10 tests |
| `test/temoins-combat.js` | **entre** — 200 combats relevés sur `origin/main` |
| `test/son.test.js` | 20 → 28 tests ; T14, T15, T17, T18, T20 réécrits |
| `test/documentation.test.js` | la liste blanche accueille `temoins-combat.js` |
| `CLAUDE.md` | §0 et §2 |
| `package.json` | 0.87.0 · build 89, **en chaînes** |

⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 24.** Pas un champ n'entre dans
l'état sauvegardé : le journal vit un tick et ne traverse ni `serialiser`, ni le
`structuredClone` de `simulerRaid`. **Mesuré : la sauvegarde pèse 1 133 octets
sur les cinq graines témoins, avant comme après — zéro octet d'écart.**

⚠ **`MOUVEMENT_PAR_PAIRE` sort et n'est pas doublé** : la règle par châssis le
remplace — « une seule table fait foi par grandeur » (CLAUDE.md §4).

⚠ **`src/son/cablage.js` gagne une quatrième dépendance, et une seule** :
`../data/sites.js`, pour les bâtiments de l'Ouvrage. Il n'importe toujours **que
des tables**, aucun moteur.

---

## 13. `tools/verifier.py` — VERT

```
identiques à l'octet : 1261
différents           : 0
nouveaux             : 0
MANQUANTS            : 0
durée                : 349,3 s
VERDICT : la chaîne répond de ses sprites
```

Il était dû : le lot touche `tools/`. **Le compte ne bouge pas — 1 261, comme au
lot précédent** : aucun sprite, aucun `.opus` n'entre ni ne sort. Les changements
de `tools/sons.py` portent sur ce qu'il **LIT** et sur la table qu'il écrit dans
`src/data/`, jamais sur l'encodage.

Et la garde d'entrées, dans le même passage :

```
art/sources/            457 fichiers
  consommées (trace)    362   déclarées 362
  dormantes (déduites)   95   déclarées 95
art/sourcesstandby/      34 fichiers, 0 lu(s) par la chaîne
VERDICT : la chaîne lit exactement les sources déclarées
```

**Inchangé** — le lot ne fait entrer aucune source, et `art/sources/` n'a pas
bougé d'un fichier.

⚠ **Il a été relancé une seconde fois, et la première a été ABANDONNÉE.** Le
premier passage tournait pendant que les falsifications mutaient brièvement
`art/sources/unit_audio_map.json`, et « ne jamais le lancer sur un arbre qu'on
modifie » est une règle du dépôt. Le verdict ci-dessus est celui du passage sur
l'arbre stable.
