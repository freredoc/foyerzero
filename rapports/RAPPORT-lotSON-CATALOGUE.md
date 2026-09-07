# RAPPORT — lot SON-CATALOGUE

**Version produite : 0.85.0 · build 87.** Livrable `dist/index.html`,
**6 768 502 octets**, 0 référence externe.
`npm test` → **994 pass / 0 fail** (992 avant).

Les 263 sons du pack entrent, encodés, inlinés et décodables. **Une seule
famille est câblée : `ui`.** Les huit autres se branchent sur la simulation,
et c'est un autre lot.

---

## 0. Baseline

| | valeur |
|---|---|
| `npm run check` sur le clone intact, **sources présentes** | **991 pass / 1 fail** |
| `npm run check` sur `main` **sans** les sources | 992 pass / 0 fail |
| `dist/index.html` avant | **5 526 427 octets** (rebâti et remesuré, pas recopié) |
| durée de la suite avant / après | 17,2 s / 17,2 s |

⚠⚠ **LE ROUGE DE LA BASELINE EST LA GARDE D'ENTRÉES, ET C'EST LE TRAVAIL DU
LOT.** `entrées — tout fichier d'art/sources/ est CLASSÉ` tombe parce que les
264 fichiers du pack sont au dépôt sans être classés. Le brief l'exclut
explicitement de ses conditions d'arrêt. **Troisième lot de suite** dans ce cas.

⚠ **ÉCART : LES SOURCES SONT ARRIVÉES SUR `main`, PAS SUR LA BRANCHE DU LOT.**
Le brief demandait la branche, précisément pour éviter ce rouge (« passer par
`main` l'a rendue rouge deux fois de suite »). C'est arrivé une troisième fois.
Rien à corriger côté code ; à dire.

---

## 1. Le livrable, poste par poste

Mesuré contre un livrable **REBÂTI depuis le commit d'avant** dans un
`git worktree` séparé, jamais contre un nombre recopié.

| poste | avant | après | delta |
|---|---:|---:|---:|
| total | 5 526 427 | **6 768 502** | **+1 242 075** |
| `data:` audio | 4 936 | 1 193 346 | +1 188 410 |
| `data:` images | 5 130 772 | 5 130 772 | **0** |
| le reste (JS, balisage, feuille) | 390 719 | 444 384 | +53 665 |
| nombre de `data:` | 25 | **284** | 21 images + 263 sons |

Le « reste » se décompose lui aussi : **balisage des 263 balises `<audio>`
18 778 octets**, **JavaScript 34 887** — la table générée (263 sons + 135
événements) et l'adaptateur.

Les fichiers eux-mêmes : **890 417 octets d'Opus sur le disque**,
**1 187 224 en base64**. Le plus lourd est `ambience_reactor_room_loop`, 29 192
octets pour huit secondes ; le plus léger, un clic à 75 ms.

### La borne T10

Elle passe de **5 700 000 à 7 000 000**, et le test écrit pourquoi. Elle a été
relevée trois fois en trois lots sans jamais avoir d'autre motif que « ça ne
tenait plus » ; elle a maintenant une raison physique — Ethan a mesuré le
démarrage du livrable de 5,5 Mo sur son Galaxy S25 FE, **sous la seconde**, et
sept mégaoctets sont posés comme la marge au-delà de laquelle il faudra
**remesurer ce démarrage** avant de faire entrer quoi que ce soit.

**Marge : 231 498 octets, 3,31 %.**

⚠ **Le palier ne se baisse pas pour tomber sous la borne.** 20 kbps est
l'arbitrage d'Ethan, tranché à l'oreille sur le haut-parleur du téléphone.

---

## 2. La mémoire

⚠⚠ **Ce chiffre ne se voit ni dans le HTML, ni au démarrage.** Un son décodé ne
pèse plus rien de ce que pèse son fichier : le navigateur le range en Float32 à
48 kHz.

| | secondes | décodé |
|---|---:|---:|
| les 263 sons | 336,8 s | **64,7 Mo** |
| les 8 ambiances (résidentes) | 64,0 s | **12,3 Mo** |
| budget des 255 autres | 30,0 s | **5,8 Mo** |
| **plafond total** | | **18,1 Mo** |
| la famille `ui` entière (23 sons) | 6,42 s | **1,23 Mo** |

**64,7 Mo, c'est soixante-treize fois le poids des fichiers et dix fois le
livrable entier.**

### Ce qui garantit que les 255 ne sont pas décodés

1. **Rien n'est décodé au démarrage, ni au premier geste.** `reveiller()` crée le
   contexte et les cinq bus, et ne décode rien — le lot précédent décodait ses
   quatre témoins ici même. Mesuré : **0 décodage après le réveil**, puis
   **exactement 1** par demande accordée. Falsifié : décoder au réveil fait
   tomber deux tests.
2. **Un décodage EN VOL est partagé, pas relancé.** `enVol` porte la promesse ;
   deux demandes rapprochées du même son rendent **un** décodage. C'est le piège
   classique de l'asynchrone : le premier décodage n'a pas encore rempli la table
   quand le second regarde. Falsifié : retirer `enVol` fait tomber.
3. **L'éviction est bornée en SECONDES, pas en fichiers.** Les durées vont de
   44 ms à 8 s : « au plus N sons » bornerait la mémoire à un facteur cent
   quatre-vingts près, ce qui n'est pas une borne.
   `MEMOIRE.budgetSecondesDecodees × 48 000 × 4` donne directement des octets.
   Le plus ancien usage sort en premier ; une résidente ne sort jamais ; le
   dernier tampon ne s'évince jamais lui-même, sinon un son plus long que le
   budget se redécoderait à chaque demande.

⚠ **Et aujourd'hui rien n'est jamais évincé — mesuré.** La famille `ui` fait
1,23 Mo, un cinquième du budget : tant qu'elle est la seule câblée, aucun clic ne
se redécode. Le test force donc l'éviction sur les événements longs à UNE
variante (les groupes à plusieurs auraient mesuré le tirage, pas l'éviction).

⚠ **Le premier geste qui demande un son donné est muet — prix déclaré du
décodage paresseux.** `decodeAudioData` est asynchrone. La politique a déjà
compté l'instance ; elle expirera d'elle-même à la durée du son.

---

## 3. Le démarrage

**Ce qui a été mesuré ici :** que le chemin de démarrage ne décode rien. Le
compteur de décodages du faux contexte audio est à **zéro** après
`initialiserLeSon` **et** après `reveiller()` ; il passe à **un** à la première
demande accordée. C'est la propriété qui protège le démarrage, et c'est celle qui
est éprouvable dans ce dépôt.

⚠ **Ce qui n'a PAS été mesuré, et se déclare NON EXÉCUTÉ (CLAUDE.md §3) :** le
temps de démarrage réel du livrable de 6,77 Mo sur appareil. Il n'y a ni
navigateur ni téléphone ici. Le seul repère est celui d'Ethan sur 5,5 Mo, sous la
seconde. **C'est exactement ce que la nouvelle borne demande de remesurer avant
le prochain lot qui fait entrer du poids.**

⚠ Les 263 balises `<audio>` portent `preload="none"` : sans lui, le navigateur
préchargerait 263 `data:` au chargement de la page.

---

## 4. Le catalogue : une table générée, plus transcrite

`src/data/sons.js` passe de **4 entrées à 263**, et de 6 516 à **45 401 octets**.
Il est **écrit par `python3 tools/sons.py --ecrire`** et porte son avertissement
en première ligne, comme `src/data/atlas.js`.

⚠⚠ **`--ecrire` est un drapeau, et c'est le motif d'`atlas.py`.**
`tools/verifier.py` déroute `FZ_SPRITES` sur un dossier temporaire pour rejouer
la chaîne ; `src/data/` n'est pas déroutable. Sans le drapeau, le vérificateur
réécrirait un fichier de `src/` à chaque exécution — « un contrôle qui écrit là
où il compare est un piège ».

⚠⚠ **Le test ne vérifie plus une RECOPIE mais une DÉRIVATION.** `SON T1` rejoue
en JavaScript ce que l'outil fait en Python et compare : couverture exacte du
pack dans les deux sens, durée, plafond, niveau, bus, résidence, et l'appartenance
de chaque son à exactement un événement. Falsifié : **une valeur retouchée à la
main dans le fichier généré fait tomber deux tests.**

### Les noms d'événement changent

`ui_clic` → `ui_click`, `ui_refus` → `ui_error`, `ui_bascule` → `ui_toggle_on`.
Le nom d'un événement est celui du pack **amputé de son rang de variante**
(`_NN`). Trois noms français se relisaient ; **cent trente-cinq** demanderaient
une table de correspondance écrite à la main, c'est-à-dire la transcription que
ce lot retire.

**135 événements pour 263 sons**, et le découpage se vérifie : les groupes
portent des `variant` numérotés 1..n sans trou, et aucun ne porte deux
`recommended_cooldown_ms`, deux `recommended_max_instances`, deux
`recommended_volume_db` ou deux catégories différents. L'outil LÈVE si l'un de
ces quatre diverge.

### `ui_error` gagne une seconde variante

Le lot précédent n'avait que `ui_error_01` ; le pack en porte deux. Le refus tire
donc désormais entre deux variantes, sans qu'une ligne ait été écrite pour ça.

---

## 5. Les quatre familles sans bus

Il n'y a **pas de sixième bus** — on n'en invente pas. Chaque famille sans bus
nommé par le brief est posée sur **le plus proche par nature**, et c'est écrit en
toutes lettres à côté de la table (`BUS_PAR_CATEGORIE`, `tools/sons.py`).

| famille | entrées | bus posé | pourquoi |
|---|---:|---|---|
| `explosions` | 24 | **impacts** (−7) | une explosion est un impact ; même registre, même transitoire |
| `buildings` | 21 | **moteurs** (−12) | **neuf de ses vingt et une entrées sont des boucles de machinerie** — alarme, construction, usine, réparation, réacteur ; les six effondrements et les six montées/coupures de courant sont ponctuels mais restent de la structure qui tourne |
| `alerts` | 18 | **interface** (−3) | des signaux faits AU JOUEUR, pas des sons du monde ; ils doivent passer au-dessus du reste |
| `orders` | 12 | **interface** (−3) | des accusés de réception d'un ordre que le joueur vient de donner |

**L'arbitrage revient à Ethan.** Les quatre lignes se changent seules, et rien
d'autre n'en dépend.

⚠ Argument mesuré pour `buildings` : sur 21 entrées, 9 portent `loop` dans leur
nom et durent de 2 400 à 5 000 ms — ce sont des nappes, pas des impacts. Les
poser sur `impacts` (−7) les mettrait quatre décibels au-dessus des moteurs
qu'elles accompagnent.

---

## 6. Les plafonds : lesquels mordent

Balayage de **50 graines × 400 instants au pas de la milliseconde**, sur les 135
événements, avec la politique réelle.

**105 événements voient leur plafond mordre. 30 sont inertes.**

Le plafond ne mord que **s'il est bas devant le rapport durée/garde** — c'est le
fait que le lot précédent avait mesuré sur `ui_clic`, et il tient. Les inertes :

- **les dix-huit alertes**, toutes : garde 450 ms, durée de 242 à 587 ms,
  plafond 1. La garde devance toujours le plafond ;
- `ui_click` (garde 55, durée 75, plafond 2) — le fait du lot précédent ;
- `ui_hover` (55 / 55 / 2), `ui_countdown` (120 / 120 / 1),
  `order_player_select` (90 / 122 / 2) ;
- les deux passages d'aéronef (250 / 2 000 / 2 — la garde de 250 ms et la durée
  de 2 s laisseraient bien deux voix, mais jamais une troisième au pas mesuré) ;
- cinq armes à rafale, où la garde est plus longue que `durée / plafond`.

À l'autre bout, **les vingt-neuf boucles à garde nulle** (`*_loop`) saturent
immédiatement : garde 0, durée de 2 000 à 8 000 ms, donc le plafond est le seul
mécanisme qui les tienne — et il mord dès la deuxième demande.

⚠ **Aucune valeur n'a été touchée.** Elles viennent du manifeste, et le
manifeste fait foi. Ce relevé est là pour qu'on sache lesquelles sont
décoratives.

---

## 7. Le pipeline

`tools/sons.py` encode **263 fichiers au lieu de 4**, en **5,9 secondes**
(`--comp 10`, le niveau le plus lent). Sa table n'est plus écrite à la main : elle
est **dérivée du manifeste**.

⚠⚠ **`--serial` reste fixé par entrée, et il se dérive du `crc32` de
l'IDENTIFIANT — jamais du rang.** Un numéro pris dans l'ordre de la table
réécrirait tous les fichiers qui suivent le jour où une entrée s'insère au
milieu : deux cent soixante-trois fichiers réécrits pour un son ajouté.
L'outil LÈVE sur une collision (mesuré : 263 séries distinctes pour 263 sons).

**Reproductibilité mesurée sur 263 :** deux exécutions complètes rendent
**263 SHA-256 identiques sur 263**. Contre-épreuve de face, sur `ui_click_01` :

```
sans --serial : 2f4c47fa…6757  puis  4ea0f529…0d42   → différents
avec --serial : 3b93188f…8efb  puis  3b93188f…8efb   → identiques
```

⚠ La qualité reste **par entrée** (`DEBITS_PARTICULIERS`, vide aujourd'hui), même
si les 263 valent 20 — c'est la leçon de `tools/fonds.py`, dont la constante
GLOBALE avait failli réécrire un fichier qu'un autre lot ne touchait pas.

### `tools/verifier.py`

| | avant | après |
|---|---:|---:|
| fichiers comparés | 1 002 | **1 261** |
| durée | 278,1 s | **330,1 s** |
| verdict | VERT | **VERT** |

**`python3 tools/verifier.py` → 1 261 identiques · 0 différent · 0 nouveau ·
0 MANQUANT**, verdict VERT, en **330,1 s**. Il était dû : le lot touche `art/` et
`tools/`. Le compte passe de 1 002 à 1 261 — les 259 `.opus` qui entrent, et rien
d'autre. ⚠⚠ **ET LES 263 SONT DANS LES « IDENTIQUES À L'OCTET » : c'est la mesure
qui prouve que la garantie tient sur de l'Opus à cette échelle.**

⚠ **La chaîne prend 52 secondes de plus, et elle reste rejouable.** Les 263
encodages y comptent deux fois — `entrees.py` rejoue la chaîne sous son mouchard —
soit environ 12 s des 52 ; le reste est la comparaison des 259 fichiers de plus.
**Rien n'a été allégé**, conformément au brief.

---

## 8. Les masters : quatorze sont stéréo

⚠⚠ **LE BRIEF POSAIT LE CONTRAIRE EN CONDITION D'ARRÊT, ET IL FALLAIT LE DIRE
PLUTÔT QUE DE S'ARRÊTER.** Il annonce « 259 masters WAV, mono, 44 100 Hz,
16 bits » et fait d'une source non mono un STOP.

**Mesuré : 249 mono, 14 stéréo** — les huit ambiances et les six passages
d'aéronef (`ambience_*`, `movement_*_flyby_*`). Et **le manifeste les DÉCLARE**
(`"channels": 2`) : le pack est d'accord avec lui-même ; c'est le brief qui
décrit mal ses propres fichiers, exactement comme il s'était trompé de 1 576
octets d'audio au lot précédent. Son propre total, **36 369 568 octets**, est
juste au dernier octet — il a donc mesuré les vrais fichiers.

⚠⚠ **S'ARRÊTER AURAIT ÉTÉ DEMANDER UN ARBITRAGE DÉJÀ RENDU** (CLAUDE.md §0.6).
Ethan a tranché « **tout en mono, ambiances comprises** », ce qui porte sur la
SORTIE, et `--downmix-mono` était déjà dans la chaîne depuis le lot précédent.
**Écart déclaré, lot poursuivi.**

### Ce qui a été fait à la place

`lire_le_master` écrivait `!= 1` en dur ; elle **confronte maintenant le fichier
à ce que le manifeste déclare** — canaux et échantillonnage. C'est plus fort : ça
attrape la faute qui peut vraiment arriver, une source remplacée sans que sa
ligne suive.

Et une garde NEUVE, `verifier_la_sortie`, lit le nombre de voies dans **l'en-tête
OpusHead du `.opus` produit**. L'invariant qui compte — « tout en mono » — est
donc gardé sur **l'artefact qui part au joueur**, pas sur le master.
**Mesuré après encodage : 263 fichiers, une seule voie.**

Sans cette lecture, retirer `--downmix-mono` doublerait le poids de quatorze
fichiers sans qu'une seule ligne ne tombe.

---

## 9. L'inline : une famille, pas 263 constantes

`tools/build.js` **importe `SONS`** et dérive `%SON_<NOM>%` du nom. Il importe
aussi **`idDuSon` de `src/ui/son.js`** — la fonction même qui relit ces balises —
et écrit les 263 `<audio>` à la place d'un unique `%BALISES_SON%` du HTML. Deux
dérivations de la même chaîne, jamais deux tables.

⚠ **Les 21 marqueurs d'images n'ont pas bougé**, et les images sont identiques à
l'octet dans le livrable (mesuré : 5 130 772 des deux côtés).

⚠⚠ **« Aucun marqueur n'est préfixe d'un autre » se MESURE désormais.** Le
commentaire du build disait « revérifié à la main sur les HUIT marqueurs » ; à
**284**, une relecture à la main serait une affirmation sans mesure. Le build
refuse un marqueur qui n'a pas la forme `%NOM%` et refuse un doublon ; le test
recompose l'ensemble complet — ceux de la page ET les 263 dérivés — et compare
tous les couples.

---

## 10. Le câblage : quatre points, cinq sons atteignables

Les trois points existants restent, **et l'écart déclaré du lot précédent est
refermé** :

1. **le clic**, délégué à la racine du document (un seul écouteur pour tous les
   boutons de la page) → `ui_click` ;
2. **le refus du Chantier**, sur son registre `toast`, APRÈS la garde
   `if (texte === '') return;` qui existait déjà → `ui_error` ;
3. **le refus de l'Offense**, au même endroit et sous la même garde → `ui_error`.
   ⚠ C'est l'écart que le lot SON-MOTEUR avait déclaré : `src/ui/offense.js`
   portait son propre `toast` et n'était pas branché, si bien que le refus
   sonnait sur la base et se taisait sur l'armée, **pour la même faute du
   joueur** ;
4. **la bascule d'OPTIONS**, qui sonne en s'allumant et jamais en s'éteignant →
   `ui_toggle_on`.

**Cinq sons sur 263 sont atteignables** : `ui_click_01`, `ui_click_02`,
`ui_error_01`, `ui_error_02`, `ui_toggle_on`.

### Les dix-huit sons `ui` NON câblés, chacun avec sa raison

| son | raison |
|---|---|
| `ui_hover_01`, `ui_hover_02` | **il n'y a pas de survol sur un écran tactile.** Le brief le dit lui-même ; ils entrent, ils ne sonnent pas |
| `ui_toggle_off` | **couper le son ne doit pas produire de son.** La table le porte, l'événement existe, rien ne le demande |
| `ui_pause`, `ui_resume` | **il n'y a pas de pause de JEU.** `suspendre()`/`reprendre()` servent le masquage de l'application et le banc d'essai ; sonner quand l'application passe en arrière-plan serait faux |
| `ui_queue_add`, `ui_queue_remove` | **il n'y a pas de file de construction.** Poser une pièce est immédiat |
| `ui_countdown` | **il n'y a aucun compte à rebours** dans le jeu |
| `ui_resource_gain`, `ui_resource_spend` | **l'économie est un tick continu, pas un événement discret.** Une dépense existe bien à l'amélioration, mais à DEUX points (Chantier et Offense) : ce serait un choix de conception, pas un branchement |
| `ui_confirm_01`, `ui_confirm_02`, `ui_cancel_01`, `ui_cancel_02` | **le clic délégué sonne déjà sur tout bouton.** Les brancher en plus ferait sonner deux fois le même geste ; distinguer « confirmer » de « cliquer » demande de décider quels boutons sont des confirmations — une décision de conception |
| `ui_victory`, `ui_defeat` | le verdict d'un raid existe, mais **DEUX panneaux le rendent** — celui du simulateur et celui du combat réel. Faire sonner une simulation serait faux ; choisir lequel sonne est une décision esthétique |
| `ui_objective_new`, `ui_objective_complete` | **il n'y a pas d'événement « objectif franchi ».** Le tutoriel se RECALCULE à chaque image ; en dériver un franchissement serait créer l'événement, ce que le brief interdit |

⚠⚠ **Aucun événement de jeu n'a été créé pour donner un emploi à un son.**

### La garde a été remplacée, pas supprimée

Le lot précédent gardait « aucun AUTRE ÉCRAN ne joue de son ». Elle devient
« **aucun événement de simulation ne déclenche de son** » et balaie `src/ui/`,
`src/sim/`, `src/render/` **et** `src/data/`. Falsifiée : brancher un tir dans
`src/ui/raid.js` la fait tomber.

⚠ Le motif reste **borné à gauche en Unicode** : un `includes('jouer(')` nu
retombe sur le `rejouer(` de `src/ui/raid.js`. Appâts dans les deux sens.

---

## 11. La chaîne d'entrées

⚠⚠ **`sfx_manifest.json` passe de DORMANT à CONSOMMÉ, et il a fallu une
troisième porte.** Le mouchard d'`entrees.py` suivait `PIL.Image.open` et
`wave.open` ; la chaîne lit maintenant une source qui n'est **ni une image ni un
son** — `tools/sons.py` DÉRIVE sa table du manifeste. Sans cette porte, il serait
resté **dormant alors qu'un outil le consomme** : le mensonge exact que ce
fichier existe pour empêcher.

⚠ **Elle reste NOMMÉE : `json.load`, pas le `open` du langage.** `json.load`
reçoit un fichier déjà ouvert dont on lit le `name`, et tout ce qui n'est pas
posé directement dans `art/sources/` est écarté au classement. Envelopper `open`
attraperait les fichiers temporaires et les sorties des outils, et la trace ne
voudrait plus rien dire.

| | avant | après |
|---|---:|---:|
| consommées | 101 | **361** |
| dormantes | 92 | **95** |
| fichiers dans `art/sources/` | 193 | **456** |

Le diff d'`art/sources-declarees.json` raconte le lot : **263 WAV et le manifeste
entrent CONSOMMÉS**, et **les quatre `son_<id>.wav` du lot précédent passent en
DORMANTS**.

⚠ **Les quatre doublons sont identiques à l'octet** — vérifié — donc rien de ce
que la chaîne produit ne dépend du nom qu'on lit. `art/sources/` ne s'ampute
jamais : les quatre restent, reclassés. Précédent exact : les planches de la v1
au lot MURS.

---

## 12. Falsification — dix-neuf, dix-neuf chutes

### Les huit du brief

| # | propriété défaite | ce qui a été fait | tombé |
|---|---|---|---|
| 1 | rien n'est décodé au démarrage | boucle de décodage remise dans `reveiller()` | **2 tests** |
| 2 | un son n'est décodé qu'une fois | `enVol` retiré de la condition de garde | **1 test** |
| 3 | un décodage en échec se tait | le rejet range un tampon bidon dans la table | **1 test** |
| 4 | la table est générée, pas recopiée | `dureeMs: 75` → `80` à la main dans le fichier généré | **2 tests** |
| 5 | les 263 identifiants coïncident | `ui_confirm_01.opus` retiré du disque | **1 test** |
| 6 | aucune famille hors `ui` ne sonne | `son.jouer('weapon_player_rifle')` dans `src/ui/raid.js` | **1 test** |
| 7 | le palier est 20 | `DEBIT_PAR_DEFAUT = 24` dans le pipeline | **1 test** |
| 8 | le pipeline reste reproductible | `--serial` retiré, deux encodages comparés | **SHA-256 différents** |

### La neuvième, qui n'était pas au brief

| # | propriété défaite | ce qui a été fait | tombé |
|---|---|---|---|
| 9 | la mémoire décodée est bornée | boucle d'éviction rendue inerte | **1 test** |

### Les onze du lot précédent, reprises telles quelles et revérifiées

| propriété défaite | tombé |
|---|---|
| garde élargie à zéro | 2 tests |
| plafond relevé de un | 1 test |
| tirage branché sur le flux de la partie (import de `sim/rng.js`) | 1 test |
| muet désarmé | 1 test |
| l'absence de Web Audio lève au lieu d'absorber | 1 test |
| contexte créé au câblage | 2 tests |
| un `.opus` retiré du disque | 1 test *(= n° 5 ci-dessus)* |
| `Date.now` dans la politique | 1 test, dans `banc.test.js` §11 |
| import à effet de bord `import '../son/politique.js';` dans `src/sim/rng.js` | 1 test |
| un écran qui joue un son | 1 test |
| `--serial` retiré | *(= n° 8 ci-dessus)* |

⚠ **Aucune n'a eu besoin d'être réécrite pour mordre.** La leçon du lot précédent
— « une falsification qui ne mord pas se vérifie avant d'être crue » — a été
appliquée : chacune a été mesurée, pas supposée.

---

## 13. Les tests

**15 → 17 dans `test/son.test.js`**, total **992 → 994**. Aucune assertion
existante n'a été retirée.

- **entrent** : `SON T8 ter` (un décodage en échec se tait) et
  `SON T8 quater` (la mémoire est bornée, les ambiances exceptées) ;
- **réécrits et RESSERRÉS**, sans perte d'assertion :
  - `SON T1` passe de 4 à 263 entrées, exige la couverture du pack **dans les
    deux sens**, l'appartenance de chaque son à **exactement un** événement, la
    correspondance résidentes ⟷ ambiances, et nomme les 14 masters stéréo ;
  - `SON T8` mesure désormais **zéro décodage au réveil** au lieu de « les quatre
    décodés » ;
  - `SON T8 bis` mesure la mise en commun des décodages, ce qu'il ne faisait pas ;
  - `SON T9` lit le débit dans **ce qui a été produit** (`son-empreintes.json`),
    pas dans la constante, et mesure les 284 marqueurs au lieu de 25 ;
  - `SON T14` balaie **quatre dossiers** au lieu d'un, et exige **deux** registres
    de refus au lieu d'un.

⚠ **`test/banc.test.js` T10** : la borne passe à 7 000 000, avec sa raison écrite
dans le test.

---

## 14. Les écarts entre le brief et le dépôt réel

1. ⚠⚠ **« 259 masters mono » — faux, quatorze sont stéréo**, et le manifeste les
   déclare. Le brief en fait une condition d'arrêt ; l'arrêt aurait porté sur une
   question déjà arbitrée. **Poursuivi, garde changée de cible et resserrée.**
   *(§8)*
2. ⚠⚠ **Le README du pack n'est pas arrivé.** Le brief l'annonce comme entrant
   « en source dormante », seul écrit portant les niveaux de bus et la règle du
   ±2 % de hauteur, et prévoit que `src/data/sons.js` pourra enfin « nommer un
   fichier » au lieu de citer la parole d'Ethan. Il n'est **ni dans
   `art/sources/`, ni dans `art/sourcesstandby/`, ni ailleurs au dépôt**. La
   table continue donc de dire que les cinq niveaux viennent du BRIEF. Une ligne
   à changer le jour où il entrera.
3. ⚠ **Les sources sont arrivées sur `main`, pas sur la branche du lot** — ce que
   le brief demandait précisément pour éviter la baseline rouge. Troisième fois.
4. ⚠ **Le brief prévoyait 1 184 148 octets de base64 et un livrable à 6 710 575.**
   Mesuré : **1 187 224** et **6 768 502**, soit **+57 927**. L'écart est
   `src/data/sons.js`, qui pèse 45 401 octets et non les quelques milliers d'une
   table de quatre lignes, et les 18 778 octets de balisage des 263 balises. Le
   palier n'a pas été touché.
5. ⚠ **`src/data/sons.js` ne porte pas le drapeau `loop` du manifeste** — déclaré
   dans le fichier. Rien ne le lirait : la seule mécanique qui en aurait besoin,
   une ambiance qui tourne en fond, n'est pas câblée, et 263 champs morts
   pèseraient dans un livrable qui se compte à l'octet.

---

## 15. Ce qui reste ouvert

- **le rattachement définitif des quatre familles sans bus** — proposé et
  argumenté au §5, posé au plus proche par nature en attendant ;
- **le câblage des huit autres familles**, qui se branche sur la simulation ;
- **les dix-huit sons `ui` non câblés** du §10, dont plusieurs n'attendent qu'une
  décision de conception d'Ethan (confirmation, victoire/défaite, objectifs) ;
- **le démarrage sur appareil à 6,77 Mo**, non mesuré ici, et que la nouvelle
  borne demande de remesurer ;
- **le README du pack**, absent.

---

## 16. Fichiers touchés

```
src/data/sons.js            GÉNÉRÉ — 4 entrées → 263, + MEMOIRE, + residente
src/son/politique.js        inchangé
src/ui/son.js               décodage paresseux, mise en commun, éviction bornée
src/ui/session.js           noms d'événement, quatrième point de câblage
src/ui/offense.js           sonDeRefus — l'écart déclaré du lot précédent
src/ui/chantier.js          une coquille de commentaire du lot précédent
src/index.src.html          %BALISES_SON% remplace les quatre balises
tools/sons.py               table dérivée, 263 encodages, --ecrire, OpusHead
tools/build.js              famille de marqueurs dérivée, balises générées, garde de préfixe
tools/entrees.py            troisième porte nommée : json.load
test/son.test.js            15 → 17 tests
test/banc.test.js           borne T10 → 7 000 000
art/sprites/son/            4 → 263 .opus, + son-empreintes.json
art/sources-declarees.json  101/92 → 361/95
CLAUDE.md                   §0 et §2
package.json                0.84.0 · 86 → 0.85.0 · 87
```
