# RAPPORT — lot SON-CÂBLAGE

**Dix-neuf sons sortent du silence. La simulation n'a pas bougé d'une ligne.**

Le brief en annonçait cinquante-deux. L'écart n'est pas un renoncement : il se
décompose son par son, et **chaque muet a une raison mesurée**. Le §6 les nomme
tous les 239.

---

## 0. Ce qui est produit

| | avant | après |
|---|---|---|
| `npm test` | **993 pass / 1 fail** | **1000 pass / 0 fail** |
| `dist/index.html` | 6 768 502 o | **6 773 971 o** |
| `data:` du livrable | 284 | **284** |
| sons câblés / 263 | 5 | **24** |
| `art/sources/` | 361 consommées · 95 dormantes | **362 · 95** · 457 fichiers |
| `SAVE_VERSION` | 24 | **24** |
| version · build | 0.85.0 · 87 | **0.86.0 · 88** |

⚠ **Les deux sont bumpés ENSEMBLE, et ils restent des CHAÎNES JSON.**
`android/app/build.gradle.kts` les lit `as String` ; un nombre y fait tomber le
build Android à la CONFIGURATION, avant le moindre test — et aucun test JS ne le
verrait (§6 du dépôt). Vérifié : `typeof version === 'string'`,
`typeof config.build === 'string'`.

⚠ **Le numéro de version pèse 100 des 5 469 octets** : il est interpolé dans le
bundle, et le mesurer à part était la seule façon de dire que le reste du lot en
pèse 5 008.

**Coût +5 469 octets, et il est entièrement du JavaScript.** Mesuré poste par
poste contre un livrable REBÂTI depuis `main` à `36826a9` :

| poste | avant | après | écart |
|---|---|---|---|
| audio inliné | 1 193 346 | 1 193 346 | **+0** |
| images inlinées | 5 130 772 | 5 130 772 | **+0** |
| feuille | 4 481 949 | 4 481 949 | **+0** |
| balisage | 1 964 038 | 1 964 038 | **+0** |
| JavaScript | 320 585 | 326 054 | **+5 469** |

*(les postes se recouvrent — les images vivent dans la feuille —, ce sont les
écarts qui se lisent.)* **Aucune image, aucun son n'entre** : les 284 `data:` du
livrable sont les mêmes qu'avant, 21 images et 263 sons.

**Borne T10 inchangée à 7 000 000**, marge **226 029 octets, 3,23 %**.

---

## 1. La baseline était ROUGE — écart déclaré, lot poursuivi

**993 pass / 1 fail sur le clone intact.** Le brief en faisait une condition
d'arrêt « cette fois sans exception ». Elle n'a pas été respectée, et voici
pourquoi.

Le test tombé est `entrées — tout fichier d'art/sources/ est CLASSÉ`
(`test/sprite.test.js`), et son diff nomme **un seul fichier** :
`art/sources/README.md`. C'est le README du pack de sons, qu'Ethan a commité sur
`main` (`d7b47a5`) et que le rapport du lot précédent annonçait comme entrant
« en source dormante », seul écrit portant les niveaux de bus. **Quatrième lot de
suite que `main` vire au rouge sur la même garde, pour la même raison : des
sources commitées avant le lot qui les classe.**

Deux faits ont fait poursuivre plutôt qu'arrêter :

1. le lot devait **de toute façon** relancer `python3 tools/entrees.py --declarer`
   pour faire passer `unit_audio_map.json` de dormante à consommée, ce que le
   brief exige au §2 ; le rouge se referme dans le même geste ;
2. le rouge ne dit rien du code : il dit qu'un fichier n'est pas classé.

**Après : 362 consommées · 95 dormantes · 457 fichiers.** Le diff de
`art/sources-declarees.json` raconte le lot en trois lignes — `unit_audio_map.json`
monte en consommée, `README.md` entre en dormante.

---

## 2. La mémoire

### L'invariant, et l'issue retenue

`evincer()` ne protégeait que les résidentes. Avec des boucles, ça devient faux :
**évincer une entrée de table ne libère pas le tampon** — la source en lecture le
tient encore. Le son ne se coupe donc pas, mais `secondesDecodees` retombe alors
que la mémoire, elle, ne bouge pas. La comptabilité cesserait de décrire la
mémoire réelle, et c'est la seule chose qui tient les 64,67 Mo à distance.

**Issue retenue : protéger les tampons qu'une source lit.** Le motif est dans les
interdits du brief. L'autre issue — « ne décompter que ce qui est réellement
libéré » — demande de savoir QUAND le navigateur relâche un `AudioBuffer`,
c'est-à-dire d'observer son ramasse-miettes : **un mécanisme qu'on ne peut pas
ouvrir**, et « ne pas justifier une propriété par un mécanisme qu'on n'a pas
ouvert ». `tenus` compte les sources en lecture, `source.onended` les relâche et
repasse le budget, et `secondesDecodees` reste un **majorant exact** de ce qui est
décodé et référencé.

⚠ **La protection vaut aussi pour les COUPS, pas seulement pour les boucles.** Le
même raisonnement les couvre, et un invariant qui ne vaudrait que pour 35 sons sur
263 serait le premier oublié. Un coup relâche son tampon dès sa fin, donc le
blocage dure ce que dure le son.

### Le chiffre que le brief demandait

> « Vingt boucles de roulement et de moteur peuvent-elles tenir dans ce budget en
> même temps ? »

**Non.** Et il y en a **seize**, pas vingt.

| ensemble | secondes décodées | mémoire | contre un budget de 30 s |
|---|---|---|---|
| les 8 ambiances (résidentes) | 64,00 s | 12,29 Mo | hors budget, à demeure |
| les 16 roulements + moteurs | **53,60 s** | 10,29 Mo | **dépassement 23,60 s** |
| les 20 boucles non résidentes les plus longues | **73,40 s** | 14,09 Mo | dépassement 43,40 s |
| les 35 boucles du pack | 154,60 s | 29,68 Mo | — |
| tout le pack décodé | 336,80 s | 64,67 Mo | — |

**Le budget n'a pas été gonflé.** `MEMOIRE.budgetSecondesDecodees` reste à **30 s
= 5,76 Mo**, et le plafond total reste **12,29 + 5,76 = 18,05 Mo**.

**Et ce lot n'atteint jamais ce cas, c'est mesuré aussi :**

| pire instant | boucles non résidentes | mémoire |
|---|---|---|
| écran de raid (1 ambiance résidente + 4 roulements) | **12,00 s** | 2,30 Mo |
| écran de la base (1 ambiance résidente + 2 machineries) | **9,20 s** | 1,77 Mo |
| union des deux écrans, sans arrêt entre-temps | **21,20 s** | 4,07 Mo |

Sous le budget dans les trois cas, et il reste au moins 8,8 s pour les coups —
la famille `ui` entière pèse 6,42 s. **Aucune condition d'arrêt n'est atteinte.**

⚠ Si les seize roulements jouaient un jour ensemble, l'éviction ne pourrait plus
descendre sous le budget et **s'arrêterait** plutôt que de couper un son : la
mémoire tenue serait alors bornée par les 29,68 Mo des 35 boucles, jamais par
rien. C'est une dégradation graduée, pas une fuite — et elle est hors d'atteinte
tant que six roulements de l'Ouvrage restent muets.

### Le démarrage

**Rien n'est décodé au démarrage, et le contexte n'est pas créé.** `reconcilier`
ne réveille PAS le contexte audio : un `AudioContext` né hors d'un geste reste
suspendu. La session l'appelle dix fois par seconde dès la première image, et il
ne fait rien tant que le joueur n'a pas touché l'écran. `SON T8` et `SON T16`
le mesurent tous les deux.

---

## 3. La couverture de `art/sources/unit_audio_map.json`

**Le fichier est CONSOMMÉ, et il fallait un geste pour ça.** `tools/sons.py` le
lit **à chaque exécution**, pas seulement sous `--ecrire` : une lecture réservée
au drapeau d'écriture l'aurait laissé DORMANT alors qu'un outil le consomme — le
mensonge exact qu'`entrees.py` existe pour empêcher. Et le contrôle n'est pas
décoratif : `carte_des_unites` refuse un nom qui ne serait pas du pack.

### Ce que le premier jet avait faux

**La carte nomme des ÉVÉNEMENTS, pas des fichiers.** Le premier jet cherchait ses
valeurs parmi les 263 identifiants et écartait `movement_player_flyby` en
concluant « absent du pack » — alors que c'est le GROUPE des trois
`movement_player_flyby_0N`. Mesuré ensuite sur **toutes** les valeurs, les deux
blocs et les sept champs :

**35 valeurs distinctes, 35 se résolvent comme événements, zéro comme identifiant
seul.** La note du fichier ne le dit que de `variant_set` (« désignent un
préfixe ») ; c'est vrai des sept champs.

### La couverture, dans les deux sens

| | compte |
|---|---|
| paires du bloc `player` | 14 |
| paires qui se résolvent contre `UNITES[x].nom` | **14 / 14** |
| unités du jeu sans entrée dans la carte | **0 / 14** |
| paires portant un `movement` | 7 |
| dont le `movement` est une BOUCLE | **4** |
| clés du bloc `ouvrage` | 7 |
| clés du bloc `ouvrage` qui se résolvent | **0 / 7** |

**Les quatre roulements câblés**, un par unité :

| paire | boucle |
|---|---|
| Fusiliers/Meute | `movement_infantry_player_loop` |
| Éclaireur/Ratisseur | `movement_tracks_light_loop` |
| Chasseur/Fendeur | `movement_tracks_medium_loop` |
| Percheron/Broyeur | `movement_tracks_heavy_loop` |

**Les dix autres unités restent muettes, nommées :**

- **trois portent `movement_player_flyby`, qui ne boucle pas** — Milan/Crécelle,
  Épervier/Busard, Albatros/Enclume. C'est un PASSAGE, pas un roulement : le
  jouer en continu inventerait une mécanique que le pack ne demande pas, et le
  jouer en coup demanderait un événement « l'aéronef se met à bouger » qui
  n'existe nulle part.
- **sept ne portent aucun `movement`** — Voltigeurs/Guetteur,
  Grenadiers/Perceurs, Sapeurs/Fouisseurs, Cuirassiers/Carapace,
  Pionnier/Bélier, Obusier/Pilon, Foudre/Frappeur. C'est un fait de la CARTE.

**Le bloc `ouvrage` n'est pas lu, et ses six boucles restent muettes.** Ses sept
clés — « essaim », « marcheur léger », « marcheur moyen », « marcheur lourd »,
« Dard léger », « Dard lourd », « pylône énergétique » — ne sont **aucun** nom du
dépôt : mesuré, zéro sur sept apparaît dans `src/data/`. Leur attribuer une
pièce par ressemblance est nommément interdit.

⚠ **Une jointure par suffixe d'arme a été mesurée et écartée.**
`weapon_player_X` ↔ `weapon_ouvrage_X` sur les `variant_set` ne rend que
**quatre appariements uniques sur six** — `cannon_light`, `cannon_heavy`,
`machinegun_burst`, `missile_launch` — `rifle` et `cannon_medium` restant
ambigus. C'est une piste pour Ethan, pas un câblage.

---

## 4. Ce qui a été écrit

### Trois responsabilités, trois endroits

| module | ce qu'il fait | ce qu'il ne fait pas |
|---|---|---|
| `src/son/cablage.js` **(neuf)** | dit ce que l'état demande en boucle, et quel son un geste réclame | aucun bruit, aucun import hors de `src/data/` |
| `src/son/politique.js` | `reconcilierLesBoucles` : la différence entre le désiré et le courant | aucune API du navigateur |
| `src/ui/son.js` | démarre, rampe, arrête, protège les tampons | ne décide de rien |
| `src/ui/session.js` | réconcilie dix fois par seconde, et joue | ne calcule ni l'ensemble ni la différence |

**L'écran nomme un GESTE, `cablage` nomme le SON, la session le JOUE.** Un écran
ne porte aucun identifiant du pack — `SON T19` balaie les quatre écrans et refuse
les 135 noms d'événement.

### L'horloge n'est pas un argument de la réconciliation

Contrairement à `demanderUnSon`, et il faut le dire plutôt que le laisser
deviner : **une garde ou un plafond de voix sur une boucle refuserait un
démarrage que l'ÉTAT demande**, et la boucle resterait muette jusqu'au prochain
changement d'état — c'est-à-dire un refus qui ne se rattrape jamais, là où un
clic refusé se rejoue au clic suivant. Une boucle a une raison de sonner, ou elle
n'en a pas.

### Le muet passe par la politique, pas par l'appelant

Couper le son doit **arrêter** les boucles en cours, pas seulement empêcher les
suivantes. `reconcilierLesBoucles` vide donc le désiré quand `muet` est vrai ou
le volume nul, ce qui rend l'ensemble des arrêts sans qu'une seconde règle soit
écrite ailleurs.

### Démarrer et arrêter sans claquer

`RAMPE_BOUCLE_MS = 120`, dans `src/data/sons.js`, **hors de `MEMOIRE`** — un
budget de mémoire et une durée de fondu sont deux grandeurs, et les ranger
ensemble parce qu'elles arrivent le même jour est ce qui a fait naître
`data/economie.js` (§4 du dépôt).

**L'arrêt attend la fin de sa rampe avant de libérer sa source** : `stop(fin)` est
donné à l'horloge du contexte audio, la seule qui sache quand la rampe est finie —
un `setTimeout` dériverait de l'audio. Et **le tampon n'est relâché qu'à
`onended`**, donc après l'arrêt réel : le relâcher plus tôt le rendrait
évinçable pendant qu'il joue encore.

### ⚠⚠ Deux défauts trouvés en relisant en lecteur hostile

**(1) Le curseur de volume.**

Une boucle prend son gain au démarrage et le garde. **Le joueur qui bouge le
curseur de volume aurait vu les clics suivre et l'ambiance rester où elle
était**, jusqu'à ce qu'il change d'écran — et le curseur d'Options est branché sur
`input`, donc il suit le doigt. Le défaut ne se voit pas à la relecture : il faut
avoir le curseur sous le doigt, ce que le dépôt ne peut pas faire (§3, pas de
navigateur).

`suivreLeVolume()` passe à chaque réconciliation, demande le gain à la POLITIQUE —
la même fonction qui l'a donné au démarrage, jamais un second calcul — et **ne
touche à rien quand rien n'a changé** : un `gain.value = x` posé pendant la rampe
de démarrage la couperait net, et la fonction passe dix fois par seconde. Quand le
gain change, elle RAMPE. `SON T16` le mesure, et retirer l'appel le fait tomber.

**(2) Les boucles survivaient au masquage de l'application.** `suspendre()`
arrête la boucle d'IMAGES : plus rien ne réconcilie, donc **une ambiance lancée
continuerait de tourner pendant que l'application est masquée**, ou pendant que
le banc d'essai remplace la page. Ce n'est pas un événement de plus :
`son.reconcilier([])` est la MÊME réconciliation, sur un ensemble désiré vide, et
`reprendre` la refait dès la première image du retour. `SON T16` le mesure aussi,
et retirer la ligne le fait tomber.

⚠ **Et ce n'est pas le fondu que le README du pack interdit.** Sa ligne 39 dit
« ne pas appliquer de fondu supplémentaire aux fichiers marqués `loop: true` ;
leurs bornes exactes sont fournies en échantillons ». Elle parle du FICHIER,
qu'on ne touche pas : `source.loop = true`, sans `loopStart` ni `loopEnd`, rejoue
ses bornes à l'échantillon près. La rampe porte sur le GAIN DE LECTURE.

### `boucle` entre dans la table générée

C'est la ligne que le lot précédent annonçait — « une ligne du générateur à
ajouter le jour où une ambiance jouera ». Il n'est posé que sur les **35** sons
qui le portent, jamais `boucle: false` sur les 228 autres : un champ faux à 228
exemplaires pèserait dans un livrable qui se compte à l'octet.

⚠ **Il ne se déduit pas de `residente`** : **27 boucles ne sont pas résidentes** —
roulements, moteurs, machineries — et **deux sons `weapons` bouclent aussi**.
« Ce qui tourne » et « ce qui reste décodé » sont deux questions.

---

## 5. Les ancres réellement touchées

Extraites des fichiers, jamais retapées.

| son | ancre du brief | ancre réelle | écart |
|---|---|---|---|
| `order_player_select` | `selectionner(index)`, `ui/chantier.js` | le gestionnaire de clic de `#chantier-grille`, juste avant `ouvrirPanneau`/`selectionner` | **oui** — `selectionner` est appelée par `peindre` et `rafraichir`, qui passent dix fois par seconde : l'y accrocher ferait un déclic continu |
| `order_player_move` | `deplacer` / `deplacerLaBase` | `tenterLeDeplacement` (chantier), crochet `apresDeplacement` (monde) | non |
| `order_player_attack` | « le lancement d'une attaque » | `lancer(simule)` de `ui/raid.js`, **branche `!simule` seulement** | non |
| `building_player_complete` | `poser` / `ameliorer`, **`src/sim/state.js`** | `tenterLaPose`, `executerAction` et le bouton du panneau, dans `ui/chantier.js` | **oui** — le brief interdit lui-même de toucher `src/sim/` |
| `building_player_collapse_*` | `demolir`, **`src/sim/state.js`** | `executerAction`, dans `ui/chantier.js`, **avant `agir`** | **oui**, même motif ; et le son part AVANT `agir`, sans quoi la pièce n'est plus dans la liste et son identifiant ne se lit plus |
| `building_player_power_up` / `_down` | la capacité d'électricité, `sim/economie-base.js` | **aucune — muet**, voir §6 | **oui** |
| `alert_player_low_power` | la même | **aucune — muet**, voir §6 | **oui** |

⚠ **L'écran ne reconnaît pas une action à son nom.** Le dépôt a déjà payé ce cas
particulier deux fois — `demolir` puis `deplacer` — et le son aurait été le
troisième : `ACTIONS[x].geste` porte le geste, `TERRAINS[x].genreSonore` porte
ce que la bande contient. Deux gardes de `chantier.test.js` refusaient déjà cette
forme ; `SON T19` refuse la nouvelle.

---

## 6. Le compte exact — 24 sons sur 263

**Dix-neuf événements, vingt-quatre sons.**

| événement | variantes | d'où |
|---|---|---|
| `ui_click` | 2 | clic délégué (lot SON-MOTEUR) |
| `ui_error` | 2 | les deux registres `toast` (lot SON-MOTEUR) |
| `ui_toggle_on` | 1 | bascule d'Options (lot SON-MOTEUR) |
| `order_player_select` | 2 | toucher une case de la grille |
| `order_player_move` | 2 | déplacer une pièce, déplacer la base |
| `order_player_attack` | 2 | lancer une vraie attaque |
| `building_player_complete` | 1 | poser ou améliorer un bâtiment |
| `building_player_collapse_small` | 1 | démolir raffinerie · accumulateur · collecteur |
| `building_player_collapse_medium` | 1 | démolir centrale · complexe · caserne · dépôt · aérodrome |
| `building_player_collapse_large` | 1 | démolir centre de commandement · QG · Chantier |
| `ambience_base_player_loop` | 1 | écrans chantier · offense · mission · recherche · options |
| `ambience_calm_map_loop` | 1 | écran monde |
| `ambience_battlefield_distant_loop` | 1 | écran raid |
| `building_player_factory_loop` | 1 | caserne · dépôt · aérodrome présents |
| `building_reactor_loop` | 1 | centrale présente |
| `movement_infantry_player_loop` | 1 | Fusiliers qui avancent |
| `movement_tracks_light_loop` | 1 | Éclaireur qui avance |
| `movement_tracks_medium_loop` | 1 | Chasseur qui avance |
| `movement_tracks_heavy_loop` | 1 | Percheron qui avance |

### Les 239 muets, par famille et par raison

| préfixe | câblés | muets | raison |
|---|---|---|---|
| `weapon_` | 0 | **87** | attendent un journal de `tick` — chantier de SIMULATION |
| `impact_` | 0 | **44** | idem |
| `explosion_` | 0 | **24** | idem |
| `alert_` | 0 | **18** | voir ci-dessous |
| `ui_` | 5 | **18** | les dix-huit déclarées au lot SON-CATALOGUE, inchangées |
| `movement_` | 4 | **16** | voir §3 |
| `building_` | 6 | **15** | 6 de l'Ouvrage, 3 boucles sans état, 6 de l'Ouvrage |
| `order_` | 6 | **6** | les six ordres de l'Ouvrage |
| `ambience_` | 3 | **5** | voir ci-dessous |
| `engine_` | 0 | **6** | voir ci-dessous |

**Les cinq ambiances muettes, une par une :**

- `ambience_quartz_field_loop`, `ambience_scoria_field_loop`,
  `ambience_reactor_room_loop` — elles demandent un **contexte**, pas un écran.
  « Être dans un champ de quartz » ne se lit nulle part dans l'état ; l'inventer
  serait créer un événement de jeu, ce que le brief interdit. **Déclarées muettes.**
- `ambience_base_ouvrage_loop` — **aucun écran ne montre la base de l'Ouvrage au
  repos.** L'écran de raid la montre en combat, et il porte
  `ambience_battlefield_distant_loop`.
- `ambience_map_wind_loop` — c'est la **seconde** ambiance de carte. Rien dans le
  dépôt ne départage `calm_map` et `map_wind`. **`calm_map` a été prise pour que
  la carte ne soit pas muette, et c'est le seul choix esthétique du lot** : une
  ligne d'`AMBIANCE_PAR_ECRAN`, qu'Ethan change seul.

**Les trois boucles de bâtiment muettes :**

- `building_player_construction_loop` — **il n'y a pas de file de construction** :
  poser et améliorer sont instantanés.
- `building_player_repair_loop` — **la réparation ne DURE pas** : c'est un stock
  depuis le lot RÉSERVE, `lancerLaReparation` a été retirée ce jour-là.
- `building_player_alarm_loop` — **aucun état « base attaquée » ne persiste** :
  un raid de l'Ouvrage est résolu en un instant par `subirUnRaid`.

**Les six moteurs à l'arrêt** (`engine_*_idle_loop`) — la carte ne dit **rien**
d'un moteur qui tourne à l'arrêt. Choisir quand il tourne — une unité vivante et
immobile ? posée en garnison ? sur l'écran de composition ? — est un arbitrage.
**Proposé, pas tranché.**

**Les six ordres de l'Ouvrage** — il ne donne aucun ordre que le joueur entende.
Ils entrent, ils ne sonnent pas.

---

## 7. Les arbitrages proposés à Ethan

### 7.1 La règle des trois effondrements

Le brief donnait « l'empreinte du bâtiment » comme candidat naturel. **Mesuré,
elle ne discrimine RIEN : les onze bâtiments occupent une case.**

Les PV, eux, se coupent net :

| taille | seuil | bâtiments | PV |
|---|---|---|---|
| `small` | `pv < 2000` | raffinerie · accumulateur · collecteur | 1000 · 1000 · 1500 |
| `medium` | `2000 ≤ pv < 3000` | centrale · complexe de défense · caserne · dépôt de véhicules · aérodrome | 2000 · 2500 ×4 |
| `large` | `pv ≥ 3000` | centre de commandement · QG de défense · Chantier | 3000 · 3000 · 5500 |

`EFFONDREMENT_PV = [2000, 3000]`, dans `src/data/sons.js`, **deux nombres qui se
changent seuls**.

⚠ `classeDeCout` donnerait presque la même partition — elle ne diverge que sur la
Centrale — mais elle a **quatre** classes pour trois tailles : il faudrait en
grouper deux, ce qui est le même choix, déguisé en donnée.

### 7.2 `alert_player_insufficient`

**Non câblé, et le brief le demandait.** Le refus sonne déjà `ui_error` sur le
même geste depuis le lot SON-MOTEUR ; les deux ensemble feraient sonner deux fois
une faute unique. Choisir lequel gagne est une décision de conception.

### 7.3 `building_player_power_up` / `power_down` et `alert_player_low_power`

**Non câblés, et la raison est mesurée.** `capacitesMilli` de
`sim/economie-base.js` est une fonction de la **seule** `disposition` : la
capacité d'électricité ne bouge donc qu'à une pose, une amélioration, un
déplacement ou une démolition — **c'est-à-dire aux quatre gestes qui sonnent
déjà** `building_player_complete`, `order_player_move` ou un effondrement. Les
câbler ferait sonner deux fois chacun de ces gestes, exactement le cas
d'`alert_player_insufficient`.

`alert_player_low_power` n'a **aucun** point d'accroche : le modèle n'a pas d'état
« manque de courant ». L'électricité est un stock avec une capacité, rien de plus.

### 7.4 Les moteurs à l'arrêt, et les six roulements de l'Ouvrage

Voir §3 et §6. Les six `engine_*_idle_loop` demandent une règle qui n'est pas dans
le fichier ; les six roulements de l'Ouvrage demandent une correspondance que
seule une jointure par ressemblance donnerait.

### 7.5 Les quatre familles sans bus

**Inchangées, comme le brief l'exige** : `explosions → impacts`,
`buildings → moteurs`, `alerts → interface`, `orders → interface`. Pas de sixième
bus.

⚠ **Et les cinq niveaux ont enfin un fichier au dépôt.** L'écart déclaré du lot
précédent se referme : `art/sources/README.md`, ligne 36, porte « Bus UI : `-3 dB`
; armes : `-6 dB` ; impacts : `-7 dB` ; moteurs : `-12 dB` ; ambiances :
`-18 dB` » — les cinq valeurs de `BUS`, au décibel près.

---

## 8. Les falsifications

Huit neuves, **huit chutes**. Chaque ligne : propriété défaite → test tombé →
propriété remise, suite reverte.

| n° | propriété défaite | comment | test tombé |
|---|---|---|---|
| 18 | la réconciliation est PURE | `import { baseCourante } from '../sim/base-courante.js'` dans `src/son/cablage.js` | `SON T15` |
| 19 | la différence est JUSTE | `demarrer` et `arreter` intervertis dans `reconcilierLesBoucles` | `SON T15`, `SON T16`, `SON T17` |
| 20 | une boucle ne se relance pas quand elle joue déjà | l'entrée posée APRÈS le décodage au lieu d'avant | `SON T16`, `SON T17` |
| 21 | une boucle s'arrête quand sa raison disparaît | `boucles.delete(nom)` au lieu d'`arreterUneBoucle(nom)` | `SON T16`, `SON T17` |
| — | le curseur de volume touche les boucles en cours | `suivreLeVolume()` retiré de `reconcilier` | `SON T16` |
| — | les boucles se taisent au masquage | `son.reconcilier([])` retiré de `suspendre` | `SON T16` |
| 22 | aucun tampon en lecture n'est perdu de vue | `if (tenus.has(nom)) continue;` retiré d'`evincer` | `SON T17` |
| 23 | la couverture de la carte se mesure | `Chasseur/Fendeur` retiré d'`unit_audio_map.json` | `SON T18` |
| 24 | aucun événement de simulation ne déclenche de son | (a) `import '../son/politique.js';` dans `src/sim/rng.js` · (b) `jouer('weapon_player_rifle')` après `tickCombat` dans `ui/raid.js` | (a) `SON T5` · (b) `SON T14`, `SON T19` |
| 25 | les sons déclarés muets le sont | `sonDeRefus` branché sur `alert_player_insufficient` | `SON T14`, `SON T20` |

### ⚠⚠ La 22 ne mordait pas au premier relevé — septième fois du dépôt

Le test mesurait les DÉCODAGES : retirer la protection ne change **rien
d'observable au son** — la boucle continue de jouer, sa source tient le tampon,
personne ne la redemande, donc rien n'est redécodé. **Mesuré : 23 pass / 0 fail
sur le code fautif.**

Le seul dégât est que `secondesDecodees` cesse de décrire la mémoire, et il ne se
voit que sur la comptabilité elle-même. `mesureMemoire()` entre donc dans
l'adaptateur — trois nombres en lecture, aucune décision — sur le modèle exact de
`mesureImages` de `ui/raid.js`, qui existe pour la mesure M2 et pour rien
d'autre. Le test exige désormais que **tout tampon tenu soit encore compté**, et
que `secondesDecodees` vaille **exactement** la somme des tampons non résidents.

### ⚠ La 24 sous sa première forme ne prouvait rien

`import { jouerUnSon } from '../ui/son.js'` en tête de `src/sim/combat.js` rendait
**0 pass / 1 fail** : le fichier ne se chargeait plus du tout. « 0 pass / 1 fail
ne prouve rien » (§0 du dépôt, lot MUR-PEINT). Refaite en import à effet de bord
dans un module feuille, `src/sim/rng.js`, elle fait tomber `SON T5` et lui seul.

### Les falsifications des lots précédents restent vertes

Rejouées de face : garde élargie à zéro (2 tests), plafond relevé de un (1), muet
désarmé (1), `Date.now` dans la politique (1), la simulation qui importe le son
(1), un écran qui joue un son (2). Les dix-neuf du lot précédent sont couvertes
par `SON T1` à `SON T14`, qui n'ont perdu aucune assertion.

### `src/sim/` n'est pas modifié

Vérifié sur le diff du lot : **aucun fichier de `src/sim/` n'apparaît.**

```
CLAUDE.md · art/sources-declarees.json · src/data/sons.js · src/son/cablage.js
src/son/politique.js · src/ui/chantier.js · src/ui/raid.js · src/ui/session.js
src/ui/son.js · test/son.test.js · test/sprite.test.js · tools/sons.py
RAPPORT-lotSON-CABLAGE.md · package.json
```

---

## 9. Une garde a accusé un innocent, et elle a changé de cible en se resserrant

`entrées — le dossier d'attente est dehors, et rien ne le déclare` comparait des
**noms courts**. Le jour où `art/sources/` a reçu le `README.md` du pack, elle a
accusé le `README.md` d'`art/sourcesstandby/`, qui est un autre fichier, dans un
autre dossier, écrit pour une autre raison — « un fichier en attente est déclaré
comme une source : il a été déplacé sans son lot ».

C'est le mécanisme même que `tools/entrees.py` évite en comparant le dossier
PARENT (§2 du dépôt), vu par l'autre bout.

**Elle se resserre plutôt que de s'assouplir** : ce qu'elle cherche est un
fichier DÉPLACÉ, donc identique à l'octet des deux côtés. Elle compare désormais
les OCTETS. Un vrai déplacement la fait toujours tomber ; deux fichiers
différents qui portent le même nom ne la font plus tomber pour rien. Un appât
vérifie que le motif reconnaît encore la vraie faute.

---

## 10. Les tests

**Six entrent — `SON T15` à `SON T20` — et le compte passe de 994 à 1000.**
Aucune assertion existante n'a été retirée.

| test | ce qu'il mesure |
|---|---|
| `SON T15` | la pureté du câblage, l'ensemble désiré, la différence dans les deux sens, le muet, les sept écrans |
| `SON T16` | une boucle démarre une fois, ne se relance pas, s'arrête sur une rampe, et la coupure attend la fin de la rampe |
| `SON T17` | aucun tampon en lecture n'est évincé, et un tampon relâché redevient évinçable |
| `SON T18` | la couverture de la carte, dans les deux sens, et la dérivation rejouée |
| `SON T19` | l'écran ne nomme aucun son, le geste vient de la table, la règle des trois effondrements |
| `SON T20` | les 239 muets, calculés et non recopiés, avec les listes nommées |

⚠ **`SON T14` est RÉÉCRIT, et il fallait le faire.** Il lisait les sons
atteignables dans les seuls **littéraux** de `session.js` ; depuis ce lot la
session appelle aussi `son.jouer(evenement)` avec une **variable**, dont la
valeur sort de `src/son/cablage.js`. Un test qui n'aurait lu que les littéraux
aurait annoncé **cinq** sons atteignables sur vingt-quatre — c'est-à-dire
déclaré muet ce qui sonne, le mensonge le plus dangereux de ce fichier. Il
recompte désormais par les DEUX portes.

⚠ **Et le faux navigateur a dû apprendre à finir un son.** Un
`AudioBufferSourceNode` de papier qui n'appelle jamais `onended` laisserait
chaque tampon TENU pour toujours, donc l'éviction bloquée : le faux mentirait sur
le mécanisme même que ces tests mesurent. Un coup s'y termine tout de suite, une
boucle attend son `stop`.

---

## 11. La chaîne

`python3 tools/verifier.py` → **1 261 identiques à l'octet · 0 différent ·
0 nouveau · 0 MANQUANT**, verdict **VERT**, en **514,5 s**. Il était dû : le lot
touche `tools/sons.py`.

⚠ **Le compte ne bouge pas** — 1 261 avant, 1 261 après. Aucun sprite, aucun
`.opus` n'entre ni ne sort : le lot ne touche pas un octet d'`art/sprites/`, et
les changements de `tools/sons.py` portent sur ce qu'il LIT et sur la table qu'il
écrit dans `src/data/`, jamais sur l'encodage. **C'est la mesure qui le prouve**,
et c'est aussi ce qui montre que la lecture systématique de `unit_audio_map.json`
n'a rien changé aux fichiers produits.

⚠ **Et il a été relancé une seconde fois, sur un arbre stable.** Le premier
passage tournait pendant que les falsifications mutaient `art/sources/` — « ne
jamais le lancer sur un arbre qu'on modifie » (§0 du dépôt). Les deux passages
rendent le même verdict ; c'est le second qui est rapporté.

Sa seconde moitié, `entrees.py --verifier`, rend :

```
art/sources/            457 fichiers
  consommées (trace)    362   déclarées 362
  dormantes (déduites)   95   déclarées 95
art/sourcesstandby/      34 fichiers, 0 lu(s) par la chaîne

VERDICT : la chaîne lit exactement les sources déclarées
```

`python3 tools/entrees.py --declarer` → **362 consommées · 95 dormantes ·
457 fichiers** dans `art/sources/` (avant : 361 / 95 / 457).

---

## 12. Ce qui reste ouvert

1. **Les 174 sons de combat** attendent un journal de `tick`. C'est un lot de
   SIMULATION : il sert aussi les effets visuels du raid, et il ne se construit
   pas deux fois.
2. **Les cinq arbitrages du §7**, dont trois qui rendraient muets neuf sons de
   plus si Ethan tranche dans l'autre sens.
3. **Les six roulements de l'Ouvrage** : ils attendent soit une table de
   correspondance d'Ethan, soit une refonte du bloc `ouvrage` de
   `unit_audio_map.json` en noms du dépôt.
4. **La borne T10 est à 7 000 000 et la marge à 3,23 %.** Le prochain lot qui
   fait entrer une ressource devra la relever EN ÉCRIVANT POURQUOI — et le §0 de
   `CLAUDE.md` pose que sept mégaoctets sont la marge au-delà de laquelle il
   faudra **remesurer le démarrage** sur l'appareil d'Ethan.
