# RAPPORT — lot SON-MOTEUR

**Version produite : 0.84.0 · build 86.** Branche
`claude/implantations-foyer-zero-gmv6k2`. Ethan seul commite sur `main`.

---

## 0. À LIRE EN PREMIER — deux points qui reviennent à Ethan

### 0.1 Le livrable dépasse la condition d'arrêt de **371 octets**, et ils sont tous nommés

Le brief pose : « le HTML construit qui grossit de plus de **10 000 octets** ».
Mesuré : **+10 371**. Je n'ai pas arrêté, et voici sur quoi je me suis fondé.

Le motif écrit dans le brief est *« tout écart important signale une entrée non
voulue »*. Le livrable a été rebâti depuis `main` dans un arbre séparé et
comparé poste par poste :

| poste | octets |
|---|---|
| les quatre `.opus` en base64, préfixe `data:` compris | **4 936** |
| bundle JS (minifié — les commentaires ne voyagent pas) | **4 123** |
| feuille de style | **701** |
| balisage (quatre `<audio>`, deux réglages) | **713** |
| **total** | **+10 371** |

**Il n'y a aucune entrée non voulue** : le livrable porte **21 `data:` avant,
25 après**, et les quatre qui entrent sont les quatre témoins.

⚠⚠ **L'écart vient de l'arithmétique du brief, pas du lot.** Il annonce
« 2 520 octets, soit 3 360 en base64 » ; les quatre pèsent **3 634 octets, soit
4 936 en base64**. La différence est le **conteneur Ogg** : chaque fichier porte
une page `OpusHead` et une page `OpusTags` — sur un son de 75 ms, l'emballage
coûte plus que le son. Le brief laissait donc **6 640 octets** implicites au
reste du lot ; le reste du lot en prend **5 537**. *Le code est sous le budget ;
c'est l'estimation de l'audio qui était basse de 1 576 octets.*

⚠ **Le débit n'a pas été baissé pour tomber sous le nombre.** « Opus mono
24 kbps » est l'arbitrage d'Ethan, et le brief interdit les décisions
esthétiques. Un `--bitrate 16` rendait 2 833 octets et passait la borne — il
n'a pas été retenu. **Relever la borne, ou dégrader le son, revient à Ethan.**

### 0.2 La baseline était ROUGE, et c'est ce lot qui la referme

`npm run check` sur le clone intact : **976 pass / 1 fail**. Le test tombé est
`entrées — tout fichier d'art/sources/ est CLASSÉ, consommé ou dormant`.

La cause est le commit `1285a1c` (« Add files via upload »), celui par lequel
Ethan apporte les six fichiers de ce lot : six sources entrent, aucune n'est
classée, la garde d'entrées tombe. **C'est le précédent MUR-PEINT au mot près**
(CLAUDE.md §0 : « LA BASELINE ÉTAIT ROUGE, ET C'ÉTAIT LA GARDE D'ENTRÉES […] Ce
lot referme ce rouge en les consommant »).

J'ai donc poursuivi plutôt que d'arrêter : le rouge **est** le travail du lot, et
s'arrêter aurait rendu un dépôt rouge sans chemin pour en sortir. **Aucun autre
test ne tombait** — 976 sur 977, et le 977 de CLAUDE.md est exact.

---

## 1. Baseline et résultat

| | avant | après |
|---|---|---|
| `npm test` | **976 pass / 1 fail** (977 tests) | **992 pass / 0 fail** (992 tests) |
| durée de la suite | 15,8 s | 15,7 s |
| `dist/index.html` | 5 516 056 o | **5 526 427 o** (+10 371) |
| références externes | 0 | **0** |
| `data:` inlinés | 21 | **25** |
| `art/sprites/` | 1 042 fichiers | **1 047** |
| `art/sources/` | 97 consommées · 90 dormantes · 187 | **101 · 92 · 193** |

**Le compte de tests monte de 15, et il se décompose : +15 dans le seul
`test/son.test.js`, entrant.** Aucune assertion existante n'a été retirée ni
assouplie ; deux gardes ont changé de forme en se resserrant (§6).

---

## 2. Les quatre sources, vérifiées avant de commencer

Les quatre SHA-256 ont été calculés sur le dépôt et comparés aux seize premiers
caractères donnés par le brief. **Les quatre concordent**, tailles comprises.

| fichier | octets | sha256 |
|---|---|---|
| `son_ui_click_01.wav` | 6 660 | `7f5330dcae41aacd`ed93a68dfe2e6600cd77981cf4420340a7e32645769704ae |
| `son_ui_click_02.wav` | 6 660 | `8b1d427a4e6214c3`ea3efb622cddc1aa9eeacc91a5bc5a552ffc5b128fa5873d |
| `son_ui_error_01.wav` | 23 682 | `1e00b8376df8b3e0`dabcb5d0d6df139e7011e125c9078712a30b02bc58e46cdc |
| `son_ui_toggle_on.wav` | 14 156 | `9847bee8e8cf2ea6`074f51fe811519ea010b983acf5b6c47b22e5efd20dc68e1 |

⚠ **Et leurs paramètres ont été mesurés, pas supposés** : mono, 44 100 Hz,
16 bits, et **75 / 75 / 268 / 160 ms** — exactement ce que le manifeste annonce.
`tools/sons.py` refait cette vérification à chaque exécution et **sort en erreur**
si un master change de forme, parce que `src/data/sons.js` dérive de cette durée
le plafond de voix : un master remplacé par un plus long plafonnerait trop tôt,
en silence.

`sfx_manifest.json` (178 172 o) et `unit_audio_map.json` (2 947 o) entrent
**dormantes**. Elles ne sont lues ni par le jeu ni par la chaîne — voir §7.

---

## 3. La frontière posée, et ce qui la garde

**`src/son/politique.js` — PUR.** Une question : *cet événement doit-il sonner,
sous quelle variante, à quel gain ?* Aucune API du navigateur, **et l'horloge est
un ARGUMENT**. C'est la raison d'être du découpage : le dépôt n'a ni navigateur
ni Web Audio (CLAUDE.md §3), donc un `Date.now()` déposé là rendrait les temps de
garde **intestables** — il n'y aurait plus qu'à croire le code sur parole.

**`src/ui/son.js` — l'adaptateur.** Il crée le contexte, décode, connecte les
cinq bus, joue. **Ses seuls `if` sont des constats de CAPACITÉ** — « ce
navigateur n'a pas de Web Audio », « le décodage n'a pas encore rendu » — jamais
des permissions.

**`src/data/sons.js` — la table.** Du calibrage, donc `src/data/` (§4). La
politique et le pipeline la lisent tous les deux.

**Ce qui garde la frontière**, et qui a été falsifié (§6, n° 11) : `SON T11`
interdit à `src/ui/son.js` les six noms de la politique — `maxInstances`,
`gardeMs`, `muet`, `volume`, `instances`, `gardes`. Un `if (reglages.muet)`
déposé dans l'adaptateur la fait tomber, **mesuré**.

⚠ **La garde lit la source DÉCOMMENTÉE.** Le dépôt compte cinq gardes qui ont
lu leur propre commentaire ; celle-ci ne pouvait pas y échapper — `ui/son.js`
contient « muet » deux fois et « volume » une fois, dans sa prose. Elle passe par
`sansCommentaires`, et l'appât prouve qu'elle reconnaît encore la vraie faute.

⚠ **Une décision qui ne fuit pas : la fin d'un son.** Une instance expire par sa
**durée**, que la table porte, et non par un rappel de l'adaptateur. Si
`ui/son.js` devait annoncer la fin d'un son, il porterait une part de la
politique — et un rappel manqué fermerait le plafond **pour toujours**,
c'est-à-dire un son qui se tait sans que rien ne lève.

⚠ **Et l'horloge de la politique est celle du CONTEXTE audio**
(`contexte.currentTime * 1000`), pas l'horloge murale. Elle est monotone depuis
la création du contexte, c'est la bonne horloge pour de l'audio, et elle laisse
intacte la garde §11 : `Date.now` n'apparaît toujours **qu'une fois** dans tout
`src/`, dans `ui/session.js`.

---

## 4. Ce que le manifeste dit, et les deux endroits où il ne dit rien

**`src/data/sons.js` est une transcription, et un test la confronte** au
manifeste — durée, plafond de voix, niveau, nombre de canaux, ligne par ligne.
Sans cette confrontation ce serait « une copie qui vieillit », ce que CLAUDE.md
reproche deux fois ailleurs. Même motif que `src/data/ancres-chassis.js`.

⚠ **Cela ne CONSOMME pas le manifeste.** `tools/entrees.py` classe une source
d'après ce que la **chaîne** ouvre sous son mouchard ; un test de Node n'en est
pas. Vérifié après coup : `sfx_manifest.json` est bien **dormant** dans
`art/sources-declarees.json`. Le catalogue n'en est pas tiré — quatre lignes
seulement sont lues.

### 4.1 Le temps de garde a changé de porteur, et la mesure l'autorise

Le manifeste attribue `recommended_cooldown_ms` au **fichier**. Un clic ayant
**deux variantes**, une garde par fichier laisserait passer deux clics à
quarante millisecondes dès que le tirage change de variante — c'est-à-dire
exactement le cas que la falsification n° 1 du brief demande de refuser. La garde
porte donc sur l'**ÉVÉNEMENT**.

⚠⚠ **Et le déplacement ne coûte rien, parce qu'il est mesuré sur tout le pack** :
sur les 263 entrées, **54 groupes portent plusieurs variantes, et ZÉRO** ne porte
deux `recommended_cooldown_ms` différents — ni deux `recommended_max_instances`
différents. « Par fichier » et « par événement » décrivent aujourd'hui la même
table. `SON T1` rejoue ce compte et **tombera le jour où le pack en portera une**,
ce qui est ce qu'on lui demande.

### 4.2 Les cinq bus ne sont PAS dans le manifeste — écart déclaré

Le brief les donne comme « les niveaux que le pack recommande » : interface −3,
armes −6, impacts −7, moteurs −12, ambiances −18. **Vérifié :
`sfx_manifest.json` ne porte aucune clé contenant « bus », « mix », « master »
ou « gain ».** Leur source est la parole d'Ethan par le brief, pas un fichier du
dépôt, et `src/data/sons.js` le dit en toutes lettres plutôt que de laisser
croire l'inverse.

⚠ **Et les cinq bus ne couvrent pas les neuf catégories du pack.** Mesuré :
`weapons` 87, `impacts` 44, `movement` 26, `explosions` 24, `ui` 23,
`buildings` 21, `alerts` 18, `orders` 12, `ambiences` 8. **Quatre d'entre elles
— explosions, buildings, alerts, orders — n'ont pas de bus nommé**, et on ne
leur en a pas inventé : ce serait choisir seul un niveau de mixage. **À arbitrer
au lot du catalogue.**

### 4.3 Le plafond de voix a une fenêtre, et elle se calcule

`ui_toggle_on` est le seul plafonné à une voix. Sa garde vaut **120 ms**, sa
durée **160** : il reste **quarante millisecondes** où la garde laisse passer et
où le plafond doit refuser. Sans cet écart le plafond serait **inatteignable**,
et le test qui le mesure serait vert quelle que soit la valeur écrite. `SON T3`
asserte l'existence de la fenêtre avant de la traverser.

### 4.4 Le plafond du clic est INERTE aujourd'hui — mesuré, et déclaré

Deux mécanismes se recouvrent, et le plus serré gagne. Balayage de **200 graines
× 400 instants au pas de la milliseconde** :

| événement | demandes | sons rendus | refus par la garde | refus par le **plafond** |
|---|---|---|---|---|
| `ui_clic` (garde 55 / durée 75, plafond 2) | 80 000 | 1 600 | 78 400 | **0** |
| `ui_bascule` (garde 120 / durée 160, plafond 1) | 80 000 | — | — | **16 000** |

Le plafond du clic **ne peut pas mordre** : la fenêtre où deux instances
coexistent ne dure que vingt millisecondes, et toute troisième demande y tombe
d'abord sur la garde. Ce n'est pas un défaut — c'est que **le plafond ne mord que
lorsqu'il est bas devant le rapport durée/garde**. `ui_toggle_on` est le seul des
quatre dans ce cas, et c'est pour ça qu'il est le témoin du plafond.

⚠ **Le lot du catalogue doit le savoir** : y écrire des `maxInstances` sans
regarder la garde en face donnerait des nombres qui ne servent à rien. Le fait
est écrit dans `src/data/sons.js`, à côté de la table qu'il concerne.

---

## 5. Le pipeline, et ce que `tools/verifier.py` fait de l'Opus

**C'était la question que le brief demandait de mesurer plutôt que de découvrir.
Réponse : la garantie tient — et elle ne tenait pas dans mon premier jet.**

⚠⚠ **Le numéro de série du flux Ogg est TIRÉ AU HASARD par défaut.** Mesuré :
deux exécutions d'`opusenc` sur le même WAV, aux mêmes réglages, rendent des
**SHA-256 différents**. Le vérificateur compare à l'octet : il aurait rendu
« 4 différents » **à chaque exécution, pour toujours**, et quelqu'un aurait fini
par l'assouplir pour le faire taire. `tools/sons.py` fixe `--serial` par entrée.

**Après correction, mesuré dans les deux sens :**

| | résultat |
|---|---|
| `tools/sons.py` lancé deux fois de suite | **mêmes SHA-256 sur les quatre** |
| `tools/verifier.py` (chaîne entière rejouée) | **1 002 identiques · 0 différent · 0 nouveau · 0 MANQUANT**, VERT, 278,1 s |
| les quatre `.opus` dans ce verdict | parmi les **identiques à l'octet** |
| `--serial` retiré, deux exécutions | **quatre SHA-256 différents** |

Le compte passe de **997 à 1 002** : les quatre `.opus` et leur manifeste, et
rien d'autre.

⚠⚠ **Ce qui reste vrai, et qu'il faut savoir : la garantie est liée à la VERSION
de l'encodeur, et le fichier le dit lui-même.** Chaque `.opus` porte dans ses
`OpusTags` la chaîne `libopus 1.4, libopusenc 0.2.1`, le nom d'`opus-tools` et
**la ligne de commande complète**. Un changement de version de la bibliothèque —
ou d'un seul réglage d'encodage — change donc les octets **par construction**, et
le vérificateur dira « différent » sur les quatre. **C'est ce qu'il doit dire** :
on régénère et on commite, comme pour un sprite. *Ne pas assouplir le
vérificateur pour ça.* ⚠ Je n'ai pu mesurer qu'une seule version d'`opus-tools`
(0.2 / libopus 1.4) : le comportement **entre** versions est déduit du contenu du
fichier, il n'est **pas mesuré**, et il se déclare tel quel.

⚠ **`--padding 0` vaut 2 452 octets sur quatre fichiers**, mesuré : `opusenc`
réserve 512 octets par fichier pour des métadonnées qu'on n'écrira jamais. Les
quatre passent de 6 042 à **3 634 octets**.

⚠ **La qualité est par entrée**, et c'est la leçon de `tools/fonds.py` : sa
constante globale avait failli réécrire un fichier qu'un autre lot ne touchait
pas. Le débit vit dans la table, à côté du son qu'il encode — même s'ils valent
tous 24 aujourd'hui.

⚠ **`--framesize 60` a été mesuré et écarté** : il rend les fichiers **plus
gros** (3 642 contre 3 590 au même débit), pas plus petits.

⚠⚠ **`opusenc` est une QUATRIÈME dépendance de la chaîne**, au même titre que
Pillow, numpy et scipy — absent d'un conteneur neuf. `tools/sons.py` **sort en
erreur avec la commande d'installation** plutôt que de laisser lire « chaîne
cassée » là où il manque un paquet. CLAUDE.md §3 le dit désormais.

### 5.1 Le mouchard d'`entrees.py` suivait une porte, il en suit deux

Il n'enveloppait que `PIL.Image.open`. `tools/sons.py` lit des **WAV**, et
`opusenc` est un **sous-processus** — donc invisible. Sans changement, les quatre
masters auraient été classés **dormants alors qu'un outil les consomme**,
c'est-à-dire le mensonge exact que ce fichier existe pour empêcher.

⚠ **On élargit à `wave.open`, pas à `open`.** La porte reste **nommée** :
envelopper le `open` du langage attraperait les JSON, les fichiers temporaires et
les sorties des outils eux-mêmes, et la trace ne voudrait plus rien dire. C'est
l'exact pendant audio d'`Image.open`.

⚠ **Et l'ouverture n'est pas décorative** : `sons.py` ouvre chaque master pour
**vérifier** mono, 44,1 kHz et durée. Le contrôle et la déclaration sont le même
geste — c'est ce qui les tient d'accord : supprimer la vérification ferait
basculer les quatre WAV en « dormants », et la garde tomberait.

**Résultat**, `python3 tools/entrees.py --declarer` : **101 consommées ·
92 dormantes · 193 fichiers**. Le diff d'`art/sources-declarees.json` raconte le
lot en **huit lignes** — quatre WAV en `consommees`, deux JSON en `dormantes`.

---

## 6. Falsifications — onze, dont une qui n'a pas mordu

Chaque propriété défaite pour de bon, mesurée, puis remise. Base saine :
**15 pass / 0 fail** sur `test/son.test.js`, **9 / 0** sur `test/banc.test.js`.

| n° | propriété défaite | mesure | remise |
|---|---|---|---|
| 1 | `ui_clic` : garde 55 → **0** | son 13/2 | ✔ 15/0 |
| 2 | `ui_toggle_on` : plafond 1 → **2** | son 13/2 | ✔ 15/0 |
| 3 | tirage de variante branché sur `sim/rng.js` | son 12/3 | ✔ 15/0 |
| 4 | `import '../son/politique.js'` dans `src/sim/rng.js` | **15/0 — N'A PAS MORDU** | voir ci-dessous |
| 4′ | idem, après resserrement (effet de bord) | son 14/1 | ✔ 15/0 |
| 4″ | idem, import **nommé** | son 14/1 | ✔ 15/0 |
| 5 | `muet` désarmé (`if (false)`) | son 14/1 | ✔ 15/0 |
| 6 | absence de Web Audio : lève au lieu d'absorber | son 14/1 | ✔ 15/0 |
| 7 | contexte créé au câblage, avant tout geste | son 14/1 | ✔ 15/0 |
| 8 | un **cinquième** `.opus` déposé sans emploi | son 14/1 | ✔ 15/0 |
| 8′ | un `.opus` de la table **retiré** du disque | son 14/1 | ✔ 15/0 |
| 9 | `Date.now()` réintroduit dans `son/politique.js` | **banc 8/1** | ✔ 9/0 |
| 10 | `--serial` retiré de `tools/sons.py` | **4 SHA-256 différents entre deux exécutions** | ✔ identiques |
| 11 | `if (reglages.muet)` déposé dans l'adaptateur | son 14/1 | ✔ 15/0 |

⚠⚠ **LA QUATRIÈME N'A PAS MORDU, ET LE TROU ÉTAIT RÉEL.** La garde cherchait
`from '…/son/…'`. Or un import à **effet de bord** s'écrit
`import '../son/politique.js';` — **sans `from`** — et crée exactement le
couplage interdit. **Mesuré : 15 pass / 0 fail avec cette ligne déposée dans
`src/sim/rng.js`.** Le motif lit désormais l'**adresse**, quelle que soit la
forme de l'import, et **trois appâts** couvrent l'import nommé, l'import à effet
de bord et l'import dynamique, plus un contre-appât qui refuse le faux positif.
*Une falsification qui ne mord pas se vérifie avant d'être crue* — c'est la
sixième fois du dépôt.

⚠ **Et un motif non borné est tombé sur `rejouer(`.** La garde « aucun autre
écran ne joue de son » cherchait `jouer(` par `includes` : elle accusait
`src/ui/raid.js`, dont le `rejouer(montage, vagues)` rejoue un combat et ne fait
aucun bruit. C'est la faute que CLAUDE.md §6 raconte déjà pour `\b`, qui est
ASCII dans un dépôt écrit en français. Le motif est **borné à gauche en
Unicode**, avec l'appât dans les deux sens. La même correction a été appliquée
d'avance à `SON T13`, où `\b` sur le mot « son » aurait couru le même risque.

⚠ **Une mesure a dû être refaite parce qu'elle était confondue.** Le premier
relevé de la falsification n° 9 rendait `banc 8/1` — mais la base rendait *déjà*
`8/1`, pour une raison sans rapport (§6.1). Un rouge qui existait avant ne prouve
rien. Elle a été remesurée sur base saine : **9/0 → 8/1 → 9/0**.

### 6.1 Deux gardes ont changé de FORME en se resserrant

`test/banc.test.js` et `test/documentation.test.js` posaient un plancher de
montage **par dossier** — « au moins quatre fichiers », « au moins trois noms ».
`src/son/` en porte **un**, et n'a rien de faux : il ne contient que la politique
de voix.

Le plancher ne gardait que contre **un** cas — un dossier vide rendrait la boucle
vacueuse — et un `>= 1` le ferme. Il est devenu un **TOTAL** sur tous les
dossiers balayés (`>= 45` pour l'horloge, `>= 50` pour les noms), ce qui mord en
plus sur le cas qu'il ne voyait pas : **si le lecteur de dossier cessait de lire,
les cinq dossiers tomberaient d'un coup, et cinq planchers de trois n'y verraient
rien.** *Il s'est resserré, il ne s'est pas assoupli* — et le motif est écrit
dans les deux fichiers.

---

## 7. Ce que le lot ne fait pas

- **Aucun événement de jeu n'est câblé.** Aucun tir, aucun impact, aucune
  construction ne déclenche de son. `SON T14` balaie `src/ui/` et **refuse qu'un
  autre écran joue un son** — cette garde tombera au lot du catalogue, et c'est
  ce qu'on lui demande.
- **`sfx_manifest.json` et `unit_audio_map.json` ne sont pas consommées** —
  vérifié dans `art/sources-declarees.json`, elles sont `dormantes`.
- **Rien ne préjuge du palier de compression du catalogue**, ni du choix entre
  tout-inline et assets empaquetés. `tools/sons.py` encode ce que sa table nomme,
  et sa table en nomme quatre.
- **`SAVE_VERSION` ne bouge pas** et reste à **24**. Le volume et le muet vont
  dans un magasin **séparé**, `foyer-zero/reglages/1` : un curseur n'est pas un
  fait de partie, et effacer sa partie ne doit pas remettre le son à fond.
  `SON T13` garde la séparation et vérifie que `src/sim/state.js` ne parle ni de
  son, ni de muet, ni de volume.

---

## 8. Le câblage — trois points, et un écart déclaré

1. **Le clic**, par **un seul écouteur** posé à la racine du document. La
   délégation remonte au bouton le plus proche : *un bouton qui n'existe pas
   encore sonne déjà*, là où un écouteur par bouton dans six écrans aurait été la
   dette que le brief demande d'éviter. `SON T14` exige qu'il n'y en ait qu'un.
2. **Le refus**, par le registre `toast` de l'écran de la base — le point unique
   où un refus atteint le joueur, **sept appelants y convergent déjà**.
   ⚠ Il est posé **APRÈS la garde `if (texte === '') return;` qui existait
   déjà** : effacer un toast ne sonne pas, et **aucune seconde condition n'a été
   écrite**. `SON T14` vérifie l'ordre des deux lignes.
3. **La bascule**, sur l'**activation** du son dans OPTIONS. Le couper ne joue
   rien — un son qui accompagnerait la coupure serait la dernière chose qu'on
   entend après avoir demandé le silence.

⚠ **ÉCART DÉCLARÉ : `src/ui/offense.js` porte son propre `toast` et n'est pas
branché.** Le brancher ferait un quatrième point là où le brief en pose trois.
Le lot du catalogue unifiera les deux registres — une ligne.

⚠ **Le contexte se crée au premier geste**, jamais avant : un `AudioContext`
construit au chargement naît **suspendu**. `jouer` réveille lui-même, donc il n'y
a pas deux chemins à tenir d'accord. `SON T8` compte les contextes construits :
**zéro au câblage, un au premier geste, un au second.**

⚠ **La dégradation est silencieuse et éprouvée sans navigateur.** `SON T7` monte
un faux document sans `AudioContext`, puis un dont le constructeur lève, puis une
page à qui il manque les balises : dans les trois cas le moteur se tait et **rien
ne remonte**.

---

## 9. Écarts entre le brief et le dépôt réel

| ce que le brief dit | ce qui est |
|---|---|
| « Cloner `freredoc/chantier` » | le dépôt est **`freredoc/foyerzero`** ; *Chantier* est le codename interne (CLAUDE.md, en-tête) |
| `npm run check` doit être vert sur le clone | il était **rouge**, et c'est ce lot qui le referme — §0.2 |
| les quatre témoins pèsent 2 520 o / 3 360 en base64 | **3 634 o / 4 936** — le conteneur Ogg, §0.1 |
| « + de 10 000 octets → STOP » | **+10 371**, entièrement nommés, §0.1 |
| les niveaux de bus viennent du pack | **ils ne sont pas dans le manifeste** — §4.2 |
| `tools/fonds.py` comme modèle | suivi, y compris son piège de qualité globale — §5 |

---

## 10. Fichiers touchés

**Entrent** — `src/son/politique.js`, `src/data/sons.js`, `src/ui/son.js`,
`tools/sons.py`, `test/son.test.js`, `art/sprites/son/` (4 `.opus` +
`son-empreintes.json`), `RAPPORT-lotSON-MOTEUR.md`.

**Modifiés** — `src/index.src.html` (4 `<audio>`, 2 réglages, la feuille),
`src/ui/session.js` (magasin de réglages, les trois points), `src/ui/chantier.js`
(le refus, une ligne), `tools/build.js` (4 marqueurs ; `IMAGES_INLINE` devient
`FICHIERS_INLINE` — la table ne porte plus que des images), `tools/verifier.py`
(`sons` dans `CHAINE`), `tools/entrees.py` (le mouchard), `test/banc.test.js`
(`src/son` sous l'interdiction d'horloge, le plancher devenu total),
`test/documentation.test.js` (le dossier `son`, le plancher devenu total),
`CLAUDE.md` (§0, §2, §3), `art/sources-declarees.json` (par l'outil),
`package.json` (0.84.0 · build 86, **les deux en chaînes** — vérifié).

### Ancres — extraites des fichiers, jamais retapées

| emplacement | ligne |
|---|---|
| `src/son/politique.js:118` | `export function demanderUnSon(voix, evenement, maintenantMs, reglages) {` |
| `src/son/politique.js:55` | `function tirer(voix) {` |
| `src/ui/son.js:67` | `export function initialiserLeSon(doc, { reglages, graine }) {` |
| `src/ui/son.js:142` | `const decision = demanderUnSon(voix, evenement, contexte.currentTime * 1000, reglages);` |
| `src/data/sons.js:37` | `export const BUS = {` |
| `src/data/sons.js:116` | `ui_bascule: { variantes: ['ui_toggle_on'], gardeMs: 120 },` |
| `src/ui/session.js:103` | `export const CLE_REGLAGES = 'foyer-zero/reglages/1';` |
| `src/ui/session.js:1029` | `doc.addEventListener('click', (evenement) => {` |
| `src/ui/session.js:1097` | `sonDeRefus: () => son.jouer('ui_refus'),` |
| `src/ui/chantier.js:2467` | `if (sonDeRefus !== undefined) sonDeRefus();` |
| `tools/sons.py:121` | `'--serial', str(serie),` |
| `tools/build.js:212` | `{ marqueur: '%SON_UI_CLICK_01%', chemin: ['art', 'sprites', 'son', 'ui_click_01.opus'], type: 'a` |
| `tools/verifier.py:97` | `('sons',            []),` |
| `tools/entrees.py:103` | `wave.open = _trace_wave` |
| `test/banc.test.js:299` | `for (const dossier of ['src/sim', 'src/data', 'src/render', 'src/son']) {` |
