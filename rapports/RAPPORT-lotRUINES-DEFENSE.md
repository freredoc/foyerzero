# RAPPORT — lot RUINES-DÉFENSE

Une pièce de défense abattue laisse sa ruine. Huit sources d'Ethan — quatre par
camp —, conditionnées aux deux grilles, cousues dans l'atlas `defense`, et
tirées sous un sel à elles.

**`npm run check` : 1 648 déclarés · 1 647 pass · 0 fail · 1 skipped**, sortie 0.
`npm run build` → `dist/index.html`, **9 494 171 octets**, 0 référence externe.
Version et build passent à **0.99.69 · build 181**, les deux restant des CHAÎNES.

⚠⚠ **ET CES TROIS NOMBRES SONT CEUX DE LA FUSION AVEC LA PR #161.** Ethan a
fusionné le lot CONDITIONNEMENT-ZÉNITH pendant que celui-ci était ouvert ; écrit
seul sur `105d4fc`, le lot mesurait 1 646 · 9 485 395 · 0.99.68 · 180. Le §10
raconte la fusion, ce qu'elle a coûté et pourquoi aucun de ces nombres ne
s'obtient en additionnant deux diffs.

⚠ **CE RAPPORT A DEUX MOITIÉS, ET LA SECONDE EST DE L'HISTOIRE.** Le lot s'était
arrêté sur son pré-check n° 5 — les huit sources n'étaient pas au dépôt — et
avait rendu ses mesures sous cette forme-là. Le corps de ce rapport d'arrêt est
conservé tel quel à partir du §11, sans qu'un mot en bouge, **y compris son
§7.3, dont le §9 ci-dessous est la rétractation.**

---

## 1. Où vont les huit sprites, et ce que ça pèse

**Dans la famille `defense`, avec les pièces qu'elles remplacent.** La famille
passe de **18 à 26 sprites**, sa grille de **5 × 4 à 6 × 5**.

⚠⚠ **LE POIDS N'A PAS DÉCIDÉ, ET C'EST MESURÉ SUR LES QUATRE CANDIDATS.** Chacun
a été cousu pour de bon à la grille 128 et pesé en base64 :

| candidat | sprites | grille | octets | base64 | écart |
|---|---|---|---|---|---|
| `batiment` (83 → 91) | 91 | 10 × 10 | 582 950 | 777 268 | **+69 652** |
| **`defense` (18 → 26)** | **26** | **6 × 5** | **121 456** | **161 944** | **+75 208** |
| `terrain` (18 → 26) | 26 | 6 × 5 | 133 724 | 178 300 | **+73 228** |
| famille NEUVE `ruine` | 8 | 3 × 3 | 55 594 | 74 128 | **+74 128** |

**5 556 octets séparent le meilleur du pire, soit 0,06 % du livrable.** La
balance ne tranche pas ; c'est le CÂBLAGE qui a décidé, sur trois faits :

1. `defense` est **déjà** dans `ATLAS_DE_LA_PAGE`, dans `atlasDeLaScene` et dans
   la table du banc — **zéro site de câblage neuf**. Une famille neuve en demande
   six, et `executer` **LÈVE** sur une famille absente : l'oubli d'un seul vide
   l'écran de raid au premier montage qui pose une ruine.
2. `batiment` est là où vivent `ruine_j` et `ruine_o` — les ruines de BÂTIMENT.
   C'est la confusion maximale, et c'est très exactement celle que le §1.1 du
   brief existe pour éviter.
3. `terrain` n'a aucun rapport : une ruine de pièce n'est pas du sol.

⚠ **ET LE PALIER DE QUALITÉ N'A PAS ÉTÉ BAISSÉ**, comme au lot ART-90 et pour la
même raison : `QUALITE = 85` de `tools/atlas.py` vaut pour les DIX-NEUF atlas, et
la baisser pour celui-ci dégraderait les dix-huit autres.

### 1.1 Le livrable, poste par poste

Mesuré contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de
`main` = **`105d4fc`**, qui est le merge d'ANCRES-ZÉNITH :

| poste | `main` `105d4fc` | arbre du lot | écart |
|---|---|---|---|
| **total** | 9 409 289 | 9 485 395 | **+76 106** |
| JavaScript | 436 118 | 437 016 | **+898** |
| feuille | 48 043 | 48 043 | +0 |
| balisage | 38 439 | 38 439 | +0 |
| images | 7 683 603 | 7 758 811 | **+75 208** |
| audio | 1 203 086 | 1 203 086 | +0 |

**La partition tombe EXACTEMENT sur le total des DEUX côtés — écart 0 · 0** — et
**306 URI / 307 lignes `data:` de part et d'autre**. Aucune ressource ne prend un
marqueur de plus : c'est le même atlas qui pèse plus.

⚠ **Les +75 208 d'images sont, à l'octet, le delta que la table du §1 annonçait
pour `defense`.** Deux chemins de mesure indépendants — la couture seule, et le
livrable bâti — se rejoignent.

⚠ **Les 898 octets de JavaScript sont le câblage** : `FAMILLE_DE_LA_RUINE`,
`SEL_VARIANTE_RUINE`, la famille passée en paramètre de `nombreDeVariantes` et
les cinq arguments de `couchesDeLaRuine`. Pas une image ne les porte.

### 1.2 La borne T10 passe de 9 600 000 à 9 700 000

⚠⚠ **ET C'EST LE PLANCHER QUI L'A FORCÉ, PAS LA BORNE.** À 9 600 000 le livrable
passait encore — 9 485 395 — mais la marge tombait à **114 605 octets, 1,19 %**,
c'est-à-dire **sous le plancher de 150 000 qu'asserte `PIC T7`**. Le plancher a
fait son travail : il a refusé un lot que la borne aurait laissé passer.

`CLAUDE.md` §5 dit la suite : **on ne rogne jamais pour passer dessous**, la
borne monte et le lot écrit pourquoi. Une ressource entre ici **légitimement** —
huit dessins neufs, pas de l'entropie comme à ART-90, où c'était le même atlas
avec des sprites dessinés plus grands. Marge après relèvement : **214 605
octets, 2,21 %**.

---

## 2. Le sel — la mesure qui a tranché, et ce qu'elle coûte aux parties en cours

### 2.1 La collision est totale, et elle est mesurée

`variante` mélange une bande : `SEL_VARIANTE * 32 + nombre`. Le sol a **quatre**
variantes ; les ruines de défense en ont **quatre** aussi. Sous un sel unique la
bande vaut donc **132 des deux côtés**, et la ruine posée sur une case porte
**toujours** la lettre du sol de cette case.

```
cases                       162
accord ruine/sol, sel du sol   162  = 100,00 %
```

Ce n'est pas une corrélation, c'est une identité. Quatre paires sur seize,
répétées sur toute la base, sur toutes les graines.

### 2.2 Les deux issues, et le coût de chacune

| issue | accord ruine/sol | cases du SOL repeintes sur une partie en cours |
|---|---|---|
| la FAMILLE entre dans le mélange | décorrélé | **76,0 %** |
| **un second SEL** | **26,54 %** | **0 % — identique au bit** |

⚠⚠ **C'EST CE SECOND CHIFFRE QUI A DÉCIDÉ.** Faire entrer la famille règle le cas
génériquement — et change le hachage du SOL, donc **repeint les trois quarts des
cases de la base d'un joueur qui n'a rien demandé**. Le brief le demandait
nommément : *« si le sol change d'aspect sur une sauvegarde existante, c'est un
coût à porter au rapport et à soumettre à Ethan »*. Il y est porté, et il n'est
pas payé : un second sel laisse le sol **identique au bit**.

**26,54 %** est ce qu'on attend de deux tirages indépendants sur quatre valeurs —
l'espérance vaut 25 %, et 43 sur 162 en est à un écart-type près.

### 2.3 Le numéro est 9, et c'est le PREMIER LIBRE

Le brief laissait croire que c'était 8. **Mesuré au grep `export const SEL_` :
`sim/generateur.js` a pris 8 au lot PAQUETS en écrivant qu'il était « le premier
libre partout ». Il ne l'est plus.** Les sels 0 et 1 sont au peuplement, qui ne
les exporte pas ; 2 et 3 aux POI ; 4 à la variante ; 5 au fond ; 6 au bloc ; 7 à
la famille ; 8 au placement des rangées. `SEL_VARIANTE_RUINE = 9`.

### 2.4 Il se passe en ARGUMENT, avec le défaut du terrain

Une seconde fonction de tirage aurait été le second compteur que le brief
interdit ; une table `préfixe → sel` la seconde vérité que §4 interdit. **Tout
appelant d'avant le lot rend le même nombre, au bit** — seule la famille qui
collisionne NOMME son sel.

### 2.5 `nombreDeVariantes` prend la famille, et le mémo la porte aussi

Elle lisait `ATLAS.terrain` en dur. Un SECOND compteur écrit à côté aurait été la
première chose à ne pas suivre le jour où une cinquième variante entrerait d'un
côté seulement.

⚠ **Et la clé du mémo porte la famille** : elle ne portait que le préfixe. Deux
familles qui partageraient un préfixe se seraient rendu le compte l'une de
l'autre, et le premier appel aurait décidé pour le second. **Aucune ne le partage
aujourd'hui — c'est précisément pour ça que la faute aurait été muette.**

---

## 3. L'emprise — §3.4, mesuré sur l'art réel

⚠⚠ **LA PRÉMISSE DU BRIEF EST FAUSSE, ET C'EST CE QUI REND LA RÈGLE A7 GRATUITE.**
Il pose que *« les quatre ruines livrées sont carrées »*. Mesuré sur les huit
sources, boîte d'encre :

| source | taille | encre L × H | L/H |
|---|---|---|---|
| `ruine_def_j_variante_01` | 1254² | 946 × 809 | 1,169 |
| `ruine_def_j_variante_02` | 1254² | 834 × 817 | 1,021 |
| `ruine_def_j_variante_03` | 1254² | 1050 × 827 | 1,270 |
| `ruine_def_j_variante_04` | 1254² | 974 × 790 | 1,233 |
| `ruine_def_o_variante_01` | 1024² | 863 × 817 | 1,056 |
| `ruine_def_o_variante_02` | 1024² | 890 × 813 | 1,095 |
| `ruine_def_o_variante_03` | 1024² | 900 × 661 | 1,362 |
| `ruine_def_o_variante_04` | 1024² | 898 × 822 | 1,092 |

Aucune n'est carrée. **`recadrer` porte la plus GRANDE dimension à l'emprise**,
donc le côté long y tombe et l'autre reste dessous : la règle A7 —
non-dépassement absolu — **tient par construction**, sans rien rogner.

Boîtes conditionnées, mesurées sur la grille de 32 :

| sprite | boîte | | sprite | boîte |
|---|---|---|---|---|
| `ruine_def_j_a` | 29,0 × 24,0 | | `ruine_def_o_a` | 27,5 × 26,5 |
| `ruine_def_j_b` | 29,0 × 28,0 | | `ruine_def_o_b` | 28,5 × 25,5 |
| `ruine_def_j_c` | 29,0 × 22,0 | | `ruine_def_o_c` | 29,0 × 20,0 |
| `ruine_def_j_d` | 28,5 × 23,0 | | `ruine_def_o_d` | 29,0 × 26,0 |

**Toutes sous 29,0 × 28,0.** Et le point que le brief demandait de vérifier
nommément — le mur et les deux barrières : `merlon`, `ronce` et `herse` mesurent
**exactement 29,0** de côté sur `defense/128`, donc une ruine ne dépasse jamais
la pièce qu'elle remplace.

### 3.1 Palier 29, pas 31

Une ruine de défense remplace **UNE PIÈCE** — socle, tourelle, mur —, pas une
base rasée. `EMPRISE_QUATRE_VINGT_DIX` est le palier des pièces qu'elle recouvre ;
les ruines de bâtiment gardent `EMPRISE_QUATRE_VINGT_DIX_HUIT`, celui du Chantier.

### 3.2 Un garde-fou aurait arrêté la production sur des sources saines

`tools/ruines.py` porte un seuil de violet à **30 %** sur le bloc des ruines de
base. Les quatre ruines de l'Ouvrage mesurent **17,5 · 23,4 · 27,7 · 27,8 %** :
le garde-fou n'aurait pas levé de justesse, il aurait levé sur les quatre.
`SEUIL_VIOLET_DEF = 5` entre à côté, avec la mesure écrite en face — **on n'a pas
desserré le seuil existant**, qui garde ce qu'il gardait.

---

## 4. Les deux tests du §4

### 4.1 `RUINES-DÉF T1` — la ruine et le sol tirent séparément

**Montage :** graine témoin 2026, les 162 cases de la grille (18 rangées × 9
colonnes). Pour chaque case on demande la lettre de la ruine **par le chemin de
production** — `couchesDeLaRuine('joueur', 'defense', 2026, r, c)` — et la lettre
du sol par `nomDeVariante('tile_sol_j', …)`. Le test asserte d'abord la référence
à 100,00 % sous le sel du sol, sans quoi la fraction mesurée ne voudrait rien
dire.

**Sortie brute :**
```
cases                          162
accord ruine/sol, sel 9         43  = 26,54 %
accord sous le sel du sol      162  = 100,00 %
```

**Verdict : VERT.** 0,15 ≤ 0,2654 ≤ 0,35. ⚠ Le brief interdisait un test de
valeur absolue, et il a raison : la fraction est une propriété statistique, pas
une constante. La borne encadre, elle n'épingle pas.

⚠⚠ **ET LE MONTAGE A DÛ ÊTRE RÉPARÉ — LA FALSIFICATION F5 N'A PAS MORDU AU
PREMIER RELEVÉ.** Retirer `SEL_VARIANTE_RUINE` **au site d'appel** de
`render/scene.js` laissait la suite du lot **entièrement verte, 3 pass / 0
fail** : `T1` appelait `nomDeVariante` directement et n'exerçait jamais le chemin
de production. Il passe par `couchesDeLaRuine` désormais, et F5 mord. **C'est le
MONTAGE qu'on répare, jamais l'assertion** — et *une falsification qui ne mord
pas se vérifie avant d'être crue*.

### 4.2 `RUINES-DÉF T2` — la défense laisse sa ruine, le bâtiment sa planche

**Montage : DEUX, et le premier jet n'en avait qu'un.** Il tombait sur « la Meute
n'a pas abattu le Merlon en 20 000 ticks ». Mesuré au débogueur plutôt que
supposé : la Meute attaquante vise la Meute **défensive** — sa classe de
prédilection — six colonnes plus loin, ne l'atteint pas, tourne à vide et **se
replie au tick 415**, `sorti: true`, cause `attaquants`. Les deux chemins de
destruction sont donc montés séparément :

- **l'effondrement** (trois genres côte à côte) — une pièce tombée à la fin d'un
  raid gagné ;
- **la mort au moteur** (un mur seul, la géométrie de `VIT T2 bis`) — une pièce
  abattue pendant le combat.

**Assertions :** une pièce de défense détruite rend exactement **une** couche
`defense/ruine_def_[jo]_[a-d]` ; un bâtiment détruit rend `batiment/ruine_[jo]`
et **aucune** `ruine_def_` ; deux appels de `listeAffichage` sur le même état
rendent la **même** liste.

**Verdict : VERT** sur les deux montages.

### 4.3 `RUINES-DÉF T2 bis` — la ruine ne consomme pas le flux

`JSON.stringify(partie.rng)` relevé avant et après une peinture complète :
**identique**. C'est la règle §4 du dépôt, et elle se mesure, elle ne se relit
pas dans un commentaire.

### 4.4 Les cinq falsifications

| # | falsification | ce qui tombe |
|---|---|---|
| F1 | sel remis à `SEL_VARIANTE` (4) | `T1` |
| F2 | famille ramenée à `batiment` | `T2`, `T2 bis` |
| F3 | `RESTE_APRES_DESTRUCTION.defense` remis à `'rien'` | **sept** tests |
| F4 | `variantes: false` dans `FAMILLE_DE_LA_RUINE` | `T2`, `T2 bis`, les couches de `sprite.test.js` |
| F5 | sel retiré du site d'appel de `scene.js` | `T1` — **après réparation du montage** |

---

## 5. ⚠⚠ Ce qui a été trouvé et qui n'est pas de ce lot : `main` est ROUGE au vérificateur

`python3 tools/verifier.py` a été lancé **des deux côtés**, chaîne entière —
c'est ce que le lot doit, puisqu'il touche `art/` et `tools/`.

| | identiques à l'octet | différents | nouveaux | MANQUANTS |
|---|---|---|---|---|
| `main` pristine `105d4fc` | **934** | **176** | 0 | 0 |
| arbre du lot | **950** | **176** | 0 | 0 |

⚠⚠ **LES DEUX LISTES DE 176 SONT IDENTIQUES, LIGNE POUR LIGNE** — `diff` vide.
**Pas un seul des différents n'est de ce lot.** Et l'écart des identiques vaut
**+16**, c'est-à-dire exactement les huit ruines aux deux grilles : elles se
reproduisent toutes à l'octet, ce qui est la seule chose qui dise que l'art
commité vient de l'outil commité.

Répartition des 176, des deux côtés :

```
132  bâtiment/
 24  defense/
 18  socle/
  2  chassis/
```

⚠ **ET C'EST PLUS LARGE QUE LES 44 QUE J'AVAIS D'ABORD MESURÉS.** Ce premier
chiffre ne portait que sur `joueur_v2` et `ouvrage_v2`, les deux outils que le
diff d'ANCRES-ZÉNITH désignait ; la chaîne ENTIÈRE en rend quatre fois plus. Les
**42** de `defense/` et `socle/` sont ceux des 22 sources zénithales — le lot
ANCRES-ZÉNITH a remplacé les **SOURCES** et réparé les **DÉTECTEURS**, sans
régénérer les **SPRITES**. Les **134** de `bâtiment/` et `chassis/`, eux, ne
correspondent à aucune source de ce lot-là : ils sont **plus anciens encore**, et
ce rapport ne les attribue à personne — il les compte.

⚠⚠ **C'EST LE DÉFAUT QUE L'EN-TÊTE DE `tools/verifier.py` DÉCRIT MOT POUR MOT** —
*« un outil et ses fichiers, justes séparément, faux ensemble »*. Le fichier
existe pour ça, il l'a vu, et personne ne l'a lancé.

### 5.1 Ce lot ne le répare pas, et voici pourquoi

Régénérer les 176 ferait **la moitié manquante d'un AUTRE lot** — et, pour 134
d'entre eux, d'un lot que personne n'a encore nommé. Ça changerait ce que le jeu
**dessine** sans brief, et ferait entrer un redessin zénithal dans une PR qui
parle de ruines. Le brief §5 nomme ANCRES-ZÉNITH comme un lot séparé.

**Ce qui est vérifié à la place, et qui suffit à ce que ce lot-ci soit propre :**

- `python3 tools/ruines.py` reproduit ses **20 fichiers à l'octet — zéro diff** ;
- `python3 tools/atlas.py --ecrire --forcer defense` rend `src/data/atlas.js`
  **identique**, `atlas-empreintes.json` **identique**, et un atlas **identique**
  à celui que le lot avait cousu avant la fusion — la couture ne dépend pas des
  sprites qu'ANCRES-ZÉNITH n'a pas régénérés, elle dépend de ceux du dépôt ;
- **l'atlas et les PNG du dépôt s'accordent**, ce que `sprite.test.js` garde à
  chaque `npm run check`. C'est l'accord **SOURCE → PNG** qui manque, et il
  manquait déjà.

⚠ Les trois ÉCART de `atlas.py` — `carte-64`, `carte-128`, `interface-128` —
sont les trois préexistants, laissés exactement où ils ont été trouvés.

**Ethan tranche** : soit un lot de suite régénère les 176 et recoud, soit
ANCRES-ZÉNITH est repris pour les 42 qui sont les siens — et les **134** de
`bâtiment/` et `chassis/` restent à attribuer. Ce rapport ne fait que nommer le
trou et le mesurer.

### 5.2 Et la question du §5 de l'amendement a sa réponse

L'amendement demandait : *« il faudra que tu dises lequel passe en premier si les
deux sont en vol »*. **La réponse n'est plus à donner, elle est mesurée** : Ethan
a fusionné ANCRES-ZÉNITH le 19/09 à 20 h 01 (PR #160, merge `105d4fc`). Ce lot a
donc **fusionné `main` puis rejoué sa chaîne par-dessus** — `ruines.py` et
`atlas.py --forcer defense` —, ce qui est l'ordre qui ne clobbère rien.

---

## 6. Un choix qui n'est gardé par aucun test, et qui se déclare

⚠⚠ **`caseDepuisMilli`, JAMAIS `positionDe(e)`.** Une entité de combat n'a ni
`e.rangee` ni `e.colonne` — le moteur range `rangeeMilli` / `colonneMilli`. Entre
les deux lectures disponibles :

- `caseDepuisMilli(e.rangeeMilli)` rend la case **du modèle** ;
- `positionDe(e)` rend la position **INTERPOLÉE** entre deux ticks.

Sous la seconde, la ruine changerait de lettre pendant qu'on la regarde.

⚠ **Mesuré : la falsification ne mord sur aucun montage d'aujourd'hui.** À
`alpha 0` et `precedentes null` — l'état de tous les montages du dépôt — les deux
lectures coïncident. Elle mordrait dans le DÉROULÉ, que rien n'automatise ici.
**Un test qui ne peut tomber sur aucun état d'aujourd'hui se déclare, il ne se
compte pas.**

---

## 7. Les réancrages — sept, aucun assoupli

| test | avant | après |
|---|---|---|
| `ER T6` | `defense: 'rien'` | `defense: 'ruine'` + `notEqual` |
| `PIC T6` | `atlas-defense-128` 65 050 · `-64` 27 124 | **121 456** · **46 924** |
| `PIC T7` | 9 386 656 o, marge 213 344 (2,22 %) | **9 485 395**, marge **214 605** (2,21 %) |
| `EFF T11` | ruine générique comptée | `ruine_o`/`ruine_j` **nommées**, `ruine_def_` comptée à part |
| `EFF T12` | va-et-vient `rien` → `ruine` | va-et-vient **inversé**, `unite: 'ruine'` lève |
| `T5` (`rendu.test.js`) | le Merlon mort ne laisse rien | il laisse **une** `ruine_def_` + `notEqual` |
| `VIT T2 bis` | la bascule OUVRE | la bascule **FERME** vers `'rien'` |
| `sprite.test.js` | `noms.size` 50 | **58** + balayage des 8 ruines + `notEqual` |

Chacun écrit le nombre d'avant à côté de celui d'après et porte une
contre-assertion `notEqual` qui refuse le retour de l'ancien.

Et `banc.test.js` **T10** relève la borne, en écrivant le motif — voir §1.2.

---

## 8. Ce qui reste ouvert

1. ⚠⚠ **Les 176 sprites que la chaîne ne reproduit plus** (§5) — 132 `bâtiment/`,
   24 `defense/`, 18 `socle/`, 2 `chassis/`. Antérieurs au lot, mesurés des deux
   côtés, listes identiques, **non réparés**. C'est le point le plus important de
   ce rapport, et il en cache un second : 134 d'entre eux sont plus vieux
   qu'ANCRES-ZÉNITH et personne ne les avait comptés.
2. **Le rendu n'a pas été vu**, ni sur appareil ni dans un navigateur. À regarder
   au premier essai : que les quatre variantes ne se lisent pas comme quatre fois
   le même tas, et que la ruine d'un mur ne se confonde pas avec le mur intact au
   cran le plus large.
3. **`ruine_j` et `ruine_o` redeviennent dormantes côté défense**, et restent
   employées par les bâtiments. Rien n'est retiré.
4. **Le lot n'est pas sur la branche que le brief nomme.** Il demande
   `claude/ruines-defense-<suffixe>` ; l'environnement épingle la session à
   `claude/new-session-fx3z9w` et interdit de pousser ailleurs sans autorisation
   explicite. **Écart déclaré.**

---

## 9. ⚠⚠ RÉTRACTATION — la mesure du §7.3 est fausse, et le §7.3 reste écrit

Le rapport d'arrêt, §7.3 ci-dessous, refusait les copies reçues en s'appuyant sur
**trois** indices. Ethan a répondu le 19/09 : *« son troisième indice ne tient
pas »*. Il a raison, et la mesure le dit.

### 9.1 Ce qui est retiré

Le §7.3 écrit deux nombres, en table :

> clé `#FF00FF` pure : **22,1 % au minimum sur 152 planches**
> quasi-clé : **36,5 % au maximum**

**Les deux sont faux.** Remesuré sur `art/sources/`, filtre honnête — une planche
compte dès que `cle_de_fond` rend le magenta ET que `est_fond` en classe au moins
10 % :

```
planches à clé magenta      264
à 0,00 % de clé pure         89   (34 %)
médiane de pureté          54,7 %
minimum / maximum      0,00 % / 98,56 %
quasi-clé maximale        98,93 %   (roquettes_2x2_1254x1254.png)
```

**Minimum réel 0,00 %, annoncé 22,1 %. Quasi-clé maximale réelle 98,93 %,
annoncée 36,5 %.** Ce ne sont pas des approximations, ce sont d'autres nombres.

### 9.2 La cause, qui est un filtre circulaire

Mon balayage écartait toute planche sous **1 % de clé pure** — « ce n'est pas une
planche à clé » — puis rapportait le **minimum de pureté sur ce qui restait**.
C'est une tautologie : le filtre EST la conclusion. Toute planche dont la clé est
**bruitée** — c'est-à-dire exactement le cas que je prétendais mesurer — était
silencieusement exclue avant le comptage. Les 89 planches à 0,00 % n'ont jamais
été regardées.

⚠ Ethan l'avait déduit sans voir le code : *« il a dû échantillonner les anciennes
planches, pas les récentes »*. La cause est un cran plus haut — ce n'est pas
l'échantillon qui est vieux, c'est le filtre qui se mord la queue — mais le
diagnostic pointait le bon endroit.

### 9.3 Et le critère invoqué n'était pas celui du dépôt

Ethan : *« Le critère du dépôt n'est pas la pureté de la clé, c'est
`cond.est_fond` et son seuil de 140. Un fond à (252, 3, 250) est à 5,9 du
magenta. »* **Vérifié** : les huit sources livrées se découpent, et
`M3_socles_o_tourelles_3_v2.png`, déjà commitée depuis le lot OUVRAGE-CÂBLAGE,
est elle aussi à 0,00 % de clé pure. Une règle que l'art du dépôt viole déjà
n'est pas une règle du dépôt.

### 9.4 Ce qui survit

**L'indice du transport**, que le §7.3 tire de l'en-tête `VP8 ` et du profil ICC,
et qu'Ethan accorde : *« ce qu'il a reçu était bien un collage ré-encodé en
WebP »*. Et l'argument de **STATUT** — une image collée dans une conversation
n'est pas un fichier livré. Ce sont eux qui ont motivé la demande de pièce
jointe, et la demande était fondée.

### 9.5 Ce qu'Ethan a fait avec, et qui est mesurable ici

*« il a rendu service : j'ai aplati la clé à `#FF00FF` exact sur tous les pixels
déjà classés fond. Opération neutre par construction, et vérifiée — masque
`est_fond` identique sur les 45 fichiers, zéro dérive. »*

**Confirmé sur les huit sources de ce lot** : `fond` et `clé pure` y coïncident
au centième, donc **quasi-clé exactement 0,000 %** sur les huit. Il n'y a plus un
pixel de clé bruitée à découper.

| source | fond | clé pure | quasi-clé |
|---|---|---|---|
| `ruine_def_j_variante_01` | 69,10 % | 69,10 % | **0,000** |
| `ruine_def_j_variante_02` | 66,67 % | 66,67 % | **0,000** |
| `ruine_def_j_variante_03` | 65,85 % | 65,85 % | **0,000** |
| `ruine_def_j_variante_04` | 69,01 % | 69,01 % | **0,000** |
| `ruine_def_o_variante_01` | 60,31 % | 60,31 % | **0,000** |
| `ruine_def_o_variante_02` | 67,13 % | 67,13 % | **0,000** |
| `ruine_def_o_variante_03` | 59,13 % | 59,13 % | **0,000** |
| `ruine_def_o_variante_04` | 56,10 % | 56,10 % | **0,000** |

### 9.6 Pourquoi le §7.3 n'est pas corrigé sur place

**Rien ne se retire en silence** (`CLAUDE.md` §4), et une mesure fausse qu'on
réécrit ne s'est jamais produite. Le §7.3 reste tel qu'il a été rendu ; cette
section-ci le contredit, nommément, avec les nombres. La prochaine personne qui
lira la table du §7.3 lira aussi qu'elle est retirée.

---

## 10. ⚠⚠ La fusion avec la PR #161 — sept fichiers croisés, un atlas recousu, un numéro de build sauvé

Ethan a fusionné le lot **CONDITIONNEMENT-ZÉNITH** (PR #161) le 19/09 à 23 h 25,
pendant que celui-ci était ouvert. `main` passe de **`105d4fc`** à **`fd1a007`**.
Tous les nombres de ce rapport écrits avant cette ligne ont été **remesurés**, pas
recalculés, et l'en-tête porte ceux de la fusion.

### 10.1 Sept fichiers se croisent, et cinq n'étaient pas prévisibles

| fichier | pourquoi il se croise |
|---|---|
| `CLAUDE.md` | le bloc §0 en tête — les deux lots parallèles s'y heurtent toujours |
| `package.json` | le numéro de version — idem |
| `test/pictogramme.test.js` | `PIC T6` et `PIC T7`, réancrés par les deux |
| `test/sprite.test.js` | réancré par les deux, **auto-fusionné sans conflit** |
| `art/sprites/atlas-defense-64.webp` | **les deux lots recousent la même famille** |
| `art/sprites/atlas-defense-128.webp` | idem |
| `art/sprites/atlas-empreintes.json` | idem, c'est le manifeste de la couture |

Les deux premiers sont ceux que `CLAUDE.md` annonce depuis le lot ÉCRANS du
13/09 : *« ce sont les trois que deux lots parallèles heurtent toujours »*. Les
**cinq autres sont neufs**, et ils viennent d'un fait unique : #161 recentre les
**douze tourelles de défense** sur leur pivot, celui-ci ajoute **huit ruines** —
dans la **même** famille `defense`.

### 10.2 ⚠⚠ Un `.webp` ne se fusionne pas : l'atlas est RECOUSU

Git ne sait rien faire d'un binaire en conflit, et choisir un côté aurait perdu
l'autre — prendre le mien effaçait les douze tourelles recentrées, prendre le
sien effaçait les huit ruines. La règle du dépôt est écrite : *« regenerate
generated files with the repo's tooling, never by hand »*.

Les répertoires de sprites, eux, ont fusionné **proprement** : les deux lots y
touchent des fichiers DISJOINTS — #161 réécrit `def_{j,o}_*.png`, celui-ci ajoute
`ruine_def_{j,o}_{a,b,c,d}.png`. `art/sprites/defense/128/` porte donc **26
fichiers** après fusion, et c'est l'ensemble juste.

```
python3 tools/atlas.py --ecrire --forcer defense
  defense   64   26 sprites  6×5    44 454 o
  defense  128   26 sprites  6×5   115 110 o
  src/data/atlas.js  identique
```

⚠ **`src/data/atlas.js` est IDENTIQUE**, et c'est la moitié qui rassure : la
grille reste 6 × 5, donc aucune cellule ne se déplace — les 26 noms sont les
mêmes, seuls les pixels de 18 d'entre eux ont changé.

⚠ **`atlas.py --verifier` rend les trois mêmes ÉCART qu'avant** — `carte-64`,
`carte-128`, `interface-128` —, laissés là où les deux lots les ont trouvés.

### 10.3 ⚠⚠ `package.json` s'est auto-fusionné EN SILENCE, et c'est le piège

Les deux lots avaient bumpé au **MÊME** numéro, `0.99.68 · build 180`, parce que
tous deux l'avaient pris comme « le suivant disponible » sur la même base. Git ne
voit alors **aucun conflit** : il garde la valeur, `git status` ne dit rien, et
**deux livrables différents auraient porté le même `config.build`** — que
l'enveloppe Android lit pour décider d'une mise à jour.

C'est la **cinquième** fois du dépôt, après ÉCRANS du 10/09,
ARRIVÉE-CARTE-ET-BUILD et le lot ÉCRANS d'origine. La fusion prend donc
**0.99.69 · build 181**, et les deux restent des **CHAÎNES**, vérifié au type —
`android/app/build.gradle.kts` les lit `as String`, et un nombre y fait tomber le
job Android à la configuration.

### 10.4 Le livrable, remesuré contre `fd1a007`

| poste | `main` `fd1a007` | arbre fusionné | écart |
|---|---|---|---|
| **total** | 9 418 621 | 9 494 171 | **+75 550** |
| JavaScript | 436 118 | 437 016 | **+898** |
| feuille | 48 043 | 48 043 | +0 |
| balisage | 38 439 | 38 439 | +0 |
| images | 7 692 935 | 7 767 587 | **+74 652** |
| audio | 1 203 086 | 1 203 086 | +0 |

**La partition tombe EXACTEMENT sur le total des DEUX côtés — écart 0 · 0** — et
**306 URI / 307 lignes `data:` de part et d'autre**.

⚠⚠ **ET LE COÛT EN IMAGES BAISSE DE 556 OCTETS SANS QU'UN DESSIN AIT CHANGÉ.**
+75 208 contre `105d4fc`, **+74 652** contre `fd1a007` ; l'atlas `defense` passe
de 121 456 / 46 924 à **115 110 / 44 454**. Les tourelles zénithales recentrées
ne remplissent plus leur cellule qu'à 11 à 43 % : l'atlas recousu se comprime
autrement. **Une somme des deux diffs aurait donné un troisième nombre, faux** —
c'est ce que le §6 de `CLAUDE.md` appelle « deux ancres justes séparément et
fausses ensemble ».

Marge sous la borne T10 de 9 700 000 : **205 829 octets, 2,12 %** — 214 605 et
2,21 % avant la fusion. La borne, elle, **ne bouge pas une seconde fois** : elle
a été relevée pour une ressource qui entre, et rien n'entre à la fusion.

### 10.5 Ce que la fusion a coûté en tests : une seule chute, et c'était la garde

Suite complète sur l'arbre fusionné, avant tout réancrage : **1 648 déclarés ·
1 646 pass · 1 fail · 1 skipped**. L'unique rouge est
`documentation — CLAUDE.md §0 annonce le vrai nombre de tests`, qui faisait
exactement son travail — la §0 annonçait 1 646, l'arbre en déclare 1 648.

⚠ **`PIC T6`, `sprite.test.js` et les trois tests du lot sont VERTS sans
retouche.** Les tailles d'atlas `socle` et `chassis` viennent de #161 telles
quelles ; seules les deux lignes `defense` ont été remesurées. `sprite.test.js` a
fusionné sans conflit parce que les deux lots y touchent des régions disjointes —
#161 change le compteur de trous et l'ancre du carré de tourelle, celui-ci ajoute
le balayage des huit ruines et porte `noms.size` de 50 à 58.

⚠ **Deux tests entrent avec la fusion** — `CZ T1` et `CZ T2`, qui sont ceux de
#161. Le compte va donc 1 643 (ANCRES-ZÉNITH) → 1 645 (`main`) → **1 648** ici.

### 10.6 Les trois réancrages de la fusion, aucun assoupli

| garde | avant | après | motif |
|---|---|---|---|
| `PIC T6` · `atlas-defense-128.webp` | 121 456 | **115 110** | atlas recousu sur l'arbre fusionné |
| `PIC T6` · `atlas-defense-64.webp` | 46 924 | **44 454** | idem |
| `PIC T7` · `MESURE` / `MARGE` | 9 485 395 / 214 605 | **9 494 171 / 205 829** | livrable remesuré contre `fd1a007` |

`PIC T7` gagne une **contre-assertion de plus** — `notEqual(MARGE, 214_605)` —
qui refuse le retour de l'ancre du lot seul, c'est-à-dire un lot futur qui
déferait la fusion.

### 10.7 ⚠ Le bloc §0 de `CLAUDE.md` : l'ordre d'atterrissage tranche

CONDITIONNEMENT-ZÉNITH est sur `main`, RUINES-DÉFENSE atterrit après lui : le
bloc de celui-ci passe **en tête**, celui de #161 est **RÉTROGRADÉ** en
« Auparavant », **sans qu'un mot de son corps ne bouge** — seul son titre change.
En garder un seul aurait effacé un lot entier de l'historique que ce fichier EST.

---

## 11. — CE QUI SUIT EST LE RAPPORT D'ARRÊT, RENDU AVANT QUE LES SOURCES N'ARRIVENT

⚠ **Il est conservé sans qu'un mot en bouge**, §7.3 compris, dont le §9 ci-dessus
est la rétractation. Ses §1 à §6 décrivent l'état du lot au moment où il s'est
arrêté sur son pré-check n° 5 ; ses mesures de sel, d'emprise et de câblage sont
celles que les sections ci-dessus reprennent et complètent.

---

**Verdict : le lot est ARRÊTÉ sur son propre pré-check n° 5. Aucune ligne de
`src/` n'est touchée, aucun test n'entre, `dist/index.html` ne bouge pas d'un
octet, version et build ne sont pas bumpés.**

Ce rapport porte ce que le lot a pu MESURER sans l'art, pour que la session qui
l'exécutera quand les sprites arriveront ne refasse ni les pré-checks ni les
arbitrages. Les deux questions ouvertes du brief — le sel, et l'emprise — sont
tranchées par la mesure ci-dessous.

---

## 0. Base de départ

`npm ci && npm run check` **AVANT toute modification** :
**1641 déclarés · 1640 pass · 0 fail · 1 skipped** (`LIMITE T8`, suspendu par
Ethan le 08/09). C'est exactement ce que la §0 de `CLAUDE.md` annonce — la base
est saine, et rien de ce qui suit ne la déplace.

`git status` est vide à la fin du lot hors ce fichier.

---

## 1. Pré-check n° 5 — les huit sources ne sont pas au dépôt

Le brief pose la condition d'arrêt en toutes lettres : « Vérifier que les huit
sources `ruine_def_{j,o}_variante_01..04` sont entrées dans `art/sources/` […]
**Si elles n'y sont pas, ce lot n'a rien à câbler.** »

**Elles n'y sont pas.** Cherché exhaustivement, pas au premier `ls` :

| Endroit | Résultat |
|---|---|
| `art/sources/` | aucun `ruine_def_*`, aucun `*variante*` |
| `art/sourcesstandby/` | aucun |
| `art/reserve/` | aucun |
| `find art -iname '*ruine*'` | 41 fichiers, **tous des PRODUITS** — les 36 `site_base_*_ruine` de la famille `carte`, et `ruine_j` / `ruine_o` de la famille `bâtiment` |
| `find art -iname '*variante*'` | **zéro** |
| `git log --since=2026-09-17 -- art/` | un seul lot, SON-GAMEPLAY-DISCRET : 38 `.wav`, pas une image |
| dossier d'upload de la session | le brief seul |

⚠ **LA SEULE PLANCHE DE RUINES DU DÉPÔT EST DÉJÀ CONSOMMÉE, ET CE N'EST PAS
CELLE-LÀ.** `art/sources/R2_ruines_mur_tourelle_joueur_ouvrage_2x1.png` est
déclarée `consommees` et son consommateur est `tools/ruines.py`, qui en tire
**`ruine_j` et `ruine_o`** — les ruines de BÂTIMENT, celles qui existent déjà.
Son nom porte pourtant « mur tourelle » : ne pas la prendre pour la livraison du
19/09. Elle est au dépôt depuis la PR #119.

**Conséquence :** les §3.1, §3.2 et §3.4 du brief n'ont pas d'objet, et le §3.3
est **actif­ement nuisible** seul — voir ci-dessous.

### 1.1 Pourquoi `defense: 'ruine'` seul aurait été une faute

Vérifié dans le code plutôt que déduit du commentaire. `src/render/scene.js`
l. 770 :

```js
export function couchesDeLaRuine(proprietaire) {
  return [{ famille: 'batiment', nom: `ruine_${lettreDuProprietaire(proprietaire)}` }];
}
```

La famille est `batiment`, en dur. Passer `RESTE_APRES_DESTRUCTION.defense` à
`'ruine'` aujourd'hui ferait donc poser **la ruine de bâtiment sous chaque
défense détruite** — très exactement ce qu'Ethan écarte le 19/09 (« parce que
les ruines, il y a déjà des ruines de bâtiments »). Le commentaire « passer à
`'ruine'` suffit » de `src/data/sites.js` l. 494 est donc **périmé et
trompeur** ; il n'a pas été retiré, parce que le retirer sans livrer le
remplacement laisserait la table muette sur la raison. Le lot qui câble l'art le
retirera dans le même geste.

---

## 2. Le piège du sel — MESURÉ, et il est total

C'est le seul point du brief qui se prouve sans l'art, et c'est le plus
dangereux : **il ne lève pas, il ne se voit pas à l'œil, et il est à 100 %.**

### 2.1 L'état du sel

`src/render/variante.js` :

```js
export const SEL_VARIANTE = 4;
hachageBrut(graine, rangee, colonne, SEL_VARIANTE * 32 + nombre) % nombre
```

Le sel effectif ne dépend que de `nombre`. Effectifs relevés dans
`ATLAS.terrain` (18 noms) :

| famille | variantes | sel effectif |
|---|---|---|
| `tile_sol_j` | **4** | 132 |
| `tile_sol_o` | **4** | 132 |
| `champ_quartz`, `champ_scorie` | 2 | 130 |
| `obs_infanterie`, `obs_vehicule`, `obs_les_deux` | 2 | 130 |

Des ruines à quatre variantes tomberaient donc sur **132**, le sel du sol.

### 2.2 La mesure

Balayage de **3 240 cases** — 20 graines × 18 rangées × 9 colonnes :

| configuration | cases où la ruine porte la lettre du sol |
|---|---|
| **sel actuel, ruines à 4 variantes** | **100,00 %** |
| bande neuve (`SEL_… * 32 + nombre`, valeur 5) | **25,86 %** |
| contrôle : sol (4) contre champ (2) | 45,1 % — déjà décorrélé |

Répartition des quatre lettres sous la bande neuve : **25,3 / 25,6 / 25,2 /
23,9 %** — non biaisée.

Le contrôle est la moitié qui compte : il montre que la protection décrite par
la docstring (« `nombre` entre dans le mélange ») **fonctionne pour des
effectifs DIFFÉRENTS et tombe pour des effectifs ÉGAUX**. Ce n'est pas une
faute du module, c'est sa limite, et elle n'avait jamais été atteinte — aucune
famille à quatre variantes n'existe à côté du sol aujourd'hui.

### 2.3 L'arbitrage du §2, tranché par la mesure

Le brief laissait deux issues et demandait de vérifier le coût de la seconde
avant de choisir. Vérifié :

**Faire entrer la famille dans le mélange déplace le sol de 76,0 % des cases.**
Mesuré sur les mêmes 3 240 cases : la lettre de `tile_sol_j` change sur trois
cases sur quatre. C'est-à-dire que **le terrain de toutes les parties en cours
change d'aspect**, pour un bénéfice nul aujourd'hui.

→ **La bande neuve l'emporte, et la seconde issue est disqualifiée par un
nombre.** Elle reste la bonne réponse le jour où plusieurs familles neuves
partageront un effectif, mais elle se paie alors une fois, en connaissance de
cause.

### 2.4 ⚠ Le numéro à retenir n'est pas celui que `CLAUDE.md` laisse croire

La §6 de `CLAUDE.md` résume le sel comme un entier plat (« 0 et 1 au peuplement,
2 et 3 aux POI, 4 à la variante, 5 au fond, 6 au bloc, 7 à la famille »). Relevé
dans le code, **l'espace est mixte, et deux modules emploient déjà le même
entier sans se gêner** :

| constante | valeur | forme |
|---|---|---|
| `SEL_RANGEE`, `SEL_COLONNE` (poi) | 2, 3 | sel plat |
| `SEL_TERRAIN_DU_SITE` (saveur) | 4 | sel plat |
| `SEL_VARIANTE` (variante) | 4 | **bande 129–159** (`×32 + nombre`) |
| `SEL_INSTANCE_DU_SITE` (site-de-la-case) | 5 | sel plat |
| `SEL_FOND` (fond) | 5 | **passé en GRAINE**, pas en sel — `variante(SEL_FOND, r, c, n)` |
| `SEL_RAID_OUVRAGE` | 6 | sel plat |
| `SEL_BLOC`, `SEL_FAMILLE` (terrain) | 6, 7 | sels plats |
| `SEL_PLACEMENT_DES_RANGEES` (generateur) | 8 | sel plat |

Les sels plats valent tous ≤ 8 ; la bande de `variante()` occupe 129–159. Les
deux espaces sont donc **déjà disjoints**, et une bande neuve à `5 × 32` =
161–191 ne heurte rien — **bien que l'entier 5 soit pris deux fois ailleurs**.

⚠ **C'est un piège de lecture, pas un piège de code.** Écrire
`SEL_VARIANTE_RUINE = 5` à côté de `SEL_FOND = 5` et
`SEL_INSTANCE_DU_SITE = 5` ferait croire à une collision à la première
relecture. Le lot qui câble doit soit prendre un entier visiblement libre (9),
soit nommer la bande plutôt que le sel. **Décision laissée au lot qui livre**,
parce qu'une constante que rien ne lit est ce que ce dépôt appelle un
commentaire menteur en puissance.

### 2.5 `nombreDeVariantes` et son mémo

Le §2.1 du brief est exact, vérifié :

```js
ATLAS.terrain.noms.filter((nom) => nom.startsWith(`${prefixe}_`)).length
```

`ATLAS.terrain` est en dur, et `comptesDeVariantes` est une `Map` **clé par
préfixe seul**. Si la famille devient un paramètre, la clé du mémo doit le
devenir dans le même geste — sinon deux familles partageant un préfixe se
voleraient leur compte, en silence.

---

## 3. L'emprise — §3.4 mesuré aussi loin que l'art absent le permet

Le brief demande : « Mesurer si une ruine carrée posée sur l'emprise d'un mur
tient dans sa case (règle A7 : non-dépassement absolu). »

### 3.1 Aucun dépassement n'est possible, et c'est mesuré sur 113 sprites

Balayage de l'encre (alpha ≥ 128) sur les trois familles concernées, grille 128,
avec le décodeur PNG du dépôt (`test/png-rgba.js` — aucune dépendance neuve) :

| famille | sprites | débordements | emprise max | emprise min |
|---|---|---|---|---|
| `defense` | 18 | **0** | 95,3 % (`def_j_creneau`) | 75,0 % (`def_o_faucheuse`) |
| `socle` | 12 | **0** | 90,6 % (`socle_def_o_batterie`) | 84,4 % (`socle_def_j_faucheuse`) |
| `bâtiment` | 83 | **0** | 100,0 % (`bat_j_chantier_de_construction_detruit`) | 79,7 % |

**113 sprites, zéro débordement.** La règle A7 tient **par construction** :
`recadrer` de la chaîne de conditionnement ramène le contenu de chaque sprite à
`emprise / 32` de sa cellule. Une ruine passée par cette chaîne ne peut pas
déborder, quelle que soit sa forme.

### 3.2 Mais le PALIER est une vraie question, et elle a une réponse

Le risque n'est pas le débordement, c'est l'ÉCHELLE. Mesuré case par case :

| sprite | encre (l × h) | emprise | palier de l'outil |
|---|---|---|---|
| `ruine_j` | 124 × 48 | **96,9 %** | `EMPRISE_QUATRE_VINGT_DIX_HUIT = 31` (`ruines.py`) |
| `ruine_o` | 123 × 48 | **96,1 %** | idem |
| `def_j_merlon` (MUR) | 115 × 104 | 89,8 % | `EMPRISE_QUATRE_VINGT_DIX = 29` |
| `def_o_merlon` (MUR) | 116 × 112 | 90,6 % | idem |
| `def_j_herse` (BARRIÈRE) | 116 × 48 | 90,6 % | idem |
| `def_o_herse` | 116 × 87 | 90,6 % | idem |
| `def_j_ronce` (BARRIÈRE) | 116 × 45 | 90,6 % | idem |
| `def_o_ronce` | 116 × 108 | 90,6 % | idem |

⚠⚠ **CONDITIONNÉES COMME LES RUINES EXISTANTES, LES HUIT SERAIENT PLUS GRANDES
QUE LES PIÈCES QU'ELLES REMPLACENT — 96,9 % CONTRE 90,6 %.** Le palier 31 a été
arbitré le 10/09 pour une raison qui ne vaut PAS ici : « une ruine remplace à
l'écran une base RASÉE TOUT ENTIÈRE, plus petite que le bâtiment central qu'elle
recouvre, elle se lirait comme un rétrécissement du site ». Une ruine de DÉFENSE
remplace **une pièce**, pas une base.

→ **Recommandation mesurée : conditionner les huit à
`EMPRISE_QUATRE_VINGT_DIX = 29`**, le palier des murs, barrières et socles,
et non à celui de `tools/ruines.py`. Arbitrage à Ethan ; le nombre est le seul
en jeu.

### 3.3 ⚠ Et « les quatre ruines livrées sont carrées » n'a pas pu être vérifié

Le brief le pose ; les fichiers étant absents, c'est invérifiable. À noter tout
de même : **les ruines existantes ne sont pas carrées** — `ruine_j` fait
124 × 48, soit un tas large et bas, au rapport 2,6 : 1. Si les huit sortent de
la même chaîne avec le même ancrage, elles ne le seront pas non plus, et
l'hypothèse du §3.4 tombe avec.

⚠⚠ **CE PARAGRAPHE A ÉTÉ DÉPASSÉ LE JOUR MÊME, ET SA PRÉDICTION TOMBE JUSTE.**
Les huit images sont arrivées par la conversation quelques heures après ce
rapport : elles sont MESURÉES au §7, elles ne sont **pas carrées**, et
l'hypothèse du §3.4 tombe pour de bon. Le paragraphe est laissé tel quel — il
dit ce qui était vrai à l'heure où il a été écrit.

---

## 4. Les deux tests du §4 — ce qui a été mesuré, ce qui n'a pas été écrit

**Aucun test n'entre au dépôt**, et c'est la conséquence directe du §1 : un test
qui garde un câblage inexistant ne garde rien.

**T1** est néanmoins **joué comme mesure**, et son verdict est au §2.2 :
- montage : 20 graines × 162 cases = 3 240 cases, graines 1 à 20 ;
- sortie brute : sel actuel **100,00 %**, bande neuve **25,86 %** ;
- l'assertion du brief (fraction dans 0,15–0,35) **passerait** avec une bande
  neuve et **tomberait** avec le sel repris — ce qui est exactement ce qu'on lui
  demande, et ce qui confirme que la falsification annoncée par le brief est la
  bonne.

**T2 n'est pas écrit** : il exige qu'« une casemate rende un nom de ruine **de
défense** », et ce nom n'existe pas. Sa seconde moitié — le flux `etat.rng`
intact après une peinture — est **déjà gardée** par le dépôt (`render/variante.js`
ne consomme pas le flux, et un test l'asserte depuis le lot PREMIÈRE-COUCHE) ;
la réécrire ici en ferait une seconde vérité.

---

## 5. Ce qui reste ouvert

1. **Les huit sources.** Tout le lot en dépend. Elles doivent entrer dans
   `art/sources/`, être conditionnées en 64 et 128, et être déclarées par
   `python3 tools/entrees.py --declarer` — sans quoi la garde d'entrées fait
   rougir `npm run check`, comme aux lots MUR-PEINT et SON-MOTEUR.
2. **Où elles vivent** (§3.1) : famille `batiment` à côté de `ruine_j`/`ruine_o`,
   ou famille neuve. Non tranché — la mesure de poids demandée par le §7.1 ne
   peut pas se faire sur des fichiers absents. ⚠ Une famille neuve oblige à
   toucher `tools/atlas.py`, `src/data/atlas.js` (généré) et
   `nombreDeVariantes`, qui est câblé sur `ATLAS.terrain` seul.
3. **Le porteur de l'information « quelle ruine pour quel genre »** (§3.2). Le
   brief recommande d'étendre `RESTE_APRES_DESTRUCTION`, qui est déjà indexée
   par genre, plutôt que de poser une table dans `render/scene.js`. Rien ne
   contredit cette lecture ; elle n'a simplement pas pu être mise à l'épreuve.
4. **Le palier d'emprise** : 29 plutôt que 31 — voir §3.2, arbitrage à Ethan.
5. **Le numéro de la bande de sel** : visiblement libre (9) plutôt que 5 — voir
   §2.4.
6. **Le commentaire périmé** de `src/data/sites.js` l. 494, qui annonce que
   « passer à `'ruine'` suffit » alors que le §1.1 mesure le contraire. À retirer
   par le lot qui livre, pas avant.

---

## 6. Versionnage

**Ni `version`, ni `config.build`, ni `SAVE_VERSION` ne bougent.** `dist/index.html`
est identique à l'octet — aucun fichier de `src/` n'apparaît au diff — et la §5
de `CLAUDE.md` interdit de bumper dans ce cas : cela pousserait une mise à jour
aux appareils pour rien.

Les deux points de collision que le brief déclare avec le lot ANCRES-ZÉNITH — les
compteurs de `documentation.test.js` et la ligne version/build de `CLAUDE.md` —
**ne sont donc pas touchés**, et ce lot ne peut pas heurter l'autre.

---

## 7. Les huit images sont arrivées — ce qu'elles établissent, et pourquoi ces copies-là ne peuvent pas devenir des sources

Ethan les a postées dans la conversation, sans un mot, quelques heures après les
six sections qui précèdent. Elles sont **les huit du brief** : le §1 de ce
rapport, qui arrêtait le lot faute d'art, n'a plus sa cause — il a l'autre.

### 7.1 Ce qu'elles sont, mesuré et non regardé

⚠⚠ **LE PARTAGE EN DEUX CAMPS EST MESURÉ À LA PALETTE, PAS DÉDUIT DE L'ORDRE
D'ENVOI** — c'est la méthode du lot SOL-OUVRAGE, reprise telle quelle. Distance
euclidienne médiane du sujet au ton le plus proche de chaque rampe de
`FICHE-STYLE.md`, un pixel sur onze :

| image | canevas | kaki (joueur) | ardoise (Ouvrage) | verdict |
|---|---|---|---|---|
| 1 | 1254 × 1254 | **26,9** | 34,4 | joueur |
| 2 | 1254 × 1254 | **33,8** | 54,1 | joueur |
| 3 | 1254 × 1254 | **27,7** | 40,6 | joueur |
| 8 | 1254 × 1254 | **29,1** | 44,7 | joueur |
| 4 | 1024 × 1024 | 38,6 | **26,3** | Ouvrage |
| 5 | 1024 × 1024 | 40,3 | **29,5** | Ouvrage |
| 6 | 1024 × 1024 | 39,8 | **26,6** | Ouvrage |
| 7 | 1024 × 1024 | 38,3 | **26,2** | Ouvrage |

**Quatre par camp, et la mesure ne laisse aucune ambiguïté** : l'écart au second
candidat vaut 7 à 20 du côté joueur, 10 à 12 du côté Ouvrage. Le canevas suit le
camp sans exception — les quatre du joueur en 1254, les quatre de l'Ouvrage en
1024 — et les deux tailles sont des conventions établies du dossier (45 sources
en 1254, 206 en 1024). Ce sont donc bien
`ruine_def_j_variante_01..04` et `ruine_def_o_variante_01..04`.

### 7.2 ⚠⚠ « Les quatre ruines livrées sont carrées » est FAUX — la prémisse du §3.4 tombe

Boîte d'encre, seuil de clé à 80 — le `RAYON_CLE` de `tools/terrain.py` :

| image | camp | boîte d'encre | L/H |
|---|---|---|---|
| 1 | j | 835 × 818 | **1,021** |
| 2 | j | 1051 × 828 | 1,269 |
| 3 | j | 975 × 791 | 1,233 |
| 8 | j | 948 × 810 | 1,170 |
| 4 | o | 863 × 818 | 1,055 |
| 5 | o | 892 × 813 | 1,097 |
| 6 | o | 901 × 661 | **1,363** |
| 7 | o | 899 × 823 | 1,092 |

**Une seule sur huit est carrée à 5 % près.** L'écart maximal vaut **36,3 %** :
la sixième est plus large que haute d'un bon tiers. Le §3.3 l'annonçait sans
pouvoir le prouver — « si les huit sortent de la même chaîne avec le même
ancrage, elles ne le seront pas non plus » —, et c'est ce que la mesure rend.

⚠ **ET LA QUESTION DU §3.4 NE SE POSE DONC PAS DANS LA FORME OÙ LE BRIEF LA
POSE.** Il demande si « une ruine carrée posée sur l'emprise d'un mur tient dans
sa case ». `recadrer` porte la plus GRANDE dimension du contenu à `emprise / 32`
de la cellule : ce qui gouverne est `max(L, H)`, jamais le côté d'un carré. Une
ruine au rapport 1,363 voit donc sa largeur calée sur l'emprise et sa hauteur
tomber à 73 % de celle-ci. **La règle A7 tient par construction**, exactement
comme le balayage des 113 sprites du §3.1 le montrait déjà — et le §3.2 s'en
trouve renforcé : au palier 31 une ruine plus large que haute occuperait 96,9 %
de la case en travers contre 90,6 % au merlon qu'elle remplace. **Le palier 29
reste la recommandation, et l'arbitrage reste à Ethan.**

### 7.3 ⚠⚠ Mais ces copies-là sont des transcodages AVEC PERTE, et elles ne peuvent pas entrer dans `art/sources/`

Lu dans l'en-tête RIFF des huit fichiers : **`VP8 `, pas `VP8L`** — du WebP avec
perte, plus un profil ICC de 456 octets. Le client de conversation les a
ré-encodées en transit ; ce ne sont pas les fichiers qu'Ethan a exportés.

Ce que ça coûte, mesuré contre le dossier entier plutôt que contre une
impression :

| | les huit reçues | `art/sources/` (152 planches à clé) |
|---|---|---|
| clé `#FF00FF` **pure** | **0,0 %** (0 à 57 pixels sur ~1,5 M) | **22,1 % au minimum**, 45 à 72 % couramment |
| quasi-clé (à moins de 80 de la clé, sans l'être) | **55,5 % à 68,8 %** | **36,5 % au maximum**, et c'est le halo des trois planches d'explosion |

**Les huit sortent de la plage observée du dossier sur les deux axes**, et
largement : le fond ÉTAIT du magenta pur, il est devenu deux tiers de surface
*presque* magenta, étalée sur des milliers de valeurs. Le compte de couleurs le
redit — 35 868 à 64 987, dont 33 339 à 59 619 hors clé.

⚠ **LE COMPTE DE COULEURS SEUL N'AURAIT RIEN PROUVÉ, ET IL FALLAIT LE VÉRIFIER
AVANT DE CONCLURE.** `off_j_meute.png` en porte 24 567 et
`01_pylone_ouvrage_rampe_a_original.png` 36 669 : les rendus d'Ethan sont
anti-crénelés et riches, et la chaîne ne quantifie plus depuis le lot PIXELS —
elle réduit la MATIÈRE. C'est la **clé** qui disqualifie, pas la richesse.

⚠⚠ **ET LE MOTIF QUI TRANCHE N'EST MÊME PAS CELUI-LÀ.** `normaliser_la_cle` de
`tools/terrain.py` existe précisément pour rabattre un fond impur — elle a été
écrite pour des planches dont la clé n'était pas pure, et son `RAYON_CLE = 80`
est mesuré. Elle sauverait le fond. Ce qu'elle ne peut pas sauver, c'est le
STATUT du fichier : **`art/sources/` ne porte que des ORIGINAUX** — « rien ici
n'est un produit, tout y est un original, c'est ce qui le distingue
d'`art/sprites/`, qui est entièrement reproductible » (`CLAUDE.md` §2). Un
transcodage avec perte fabriqué par un client de messagerie est un PRODUIT de
l'original. L'y committer mettrait un dérivé dégradé dans le seul dossier dont
le dépôt garantit qu'il ne l'est pas, et `tools/verifier.py` certifierait ensuite
l'exactitude à l'octet d'une chaîne nourrie d'une entrée abîmée — pour toujours,
et sans que rien ne le dise.

⚠ Accessoirement, `art/sources/` porte **654 fichiers et pas un `.webp`** —
382 PNG, 267 WAV, deux JSON, deux Markdown, un texte. (La §2 de `CLAUDE.md` en
annonce 653 : un de moins que le disque, sa dérive habituelle, aucune garde ne
comptant ce dossier.) Une source `.webp` serait une première, et elle le serait
pour une raison qui n'en est pas une.

⚠⚠ **ET LE RÉ-ENCODAGE A ÉTÉ REPRODUIT : LES HUIT SONT ARRIVÉES UNE SECONDE
FOIS, ET LA SECONDE COPIE EST AUSSI ABÎMÉE QUE LA PREMIÈRE.** Ethan les a
repostées quelques heures plus tard, déposées sur le disque cette fois ; mesuré
sur les seize fichiers, **seize empreintes MD5 distinctes** — ce ne sont donc
pas les mêmes octets, c'est un SECOND transcodage indépendant des mêmes huit
dessins. Et il rend exactement le même verdict : `VP8 ` avec perte, profil ICC
de 456 octets, **clé pure 0,00 % à 0,01 %** (0 à 67 pixels), **quasi-clé 55,50 %
à 68,79 %**, aux mêmes canevas — 1 254² pour les quatre du joueur, 1 024² pour
les quatre de l'Ouvrage. Les deux copies d'un même dessin s'accordent d'ailleurs
au pixel près sur le compte de quasi-clé (625 186 contre 625 178 ; 581 921 contre
581 911), ce qui dit que la dégradation est **déterministe et propre au
transport**, pas un accident d'un envoi. ⚠ **Reposter ne débloquera donc rien**,
quel que soit le nombre d'essais : c'est le collage en IMAGE qui ré-encode, et la
sortie se prend en FICHIER joint ou en commit direct.

### 7.4 Ce qu'il faut, et ce que ça débloque

**Les huit PNG d'origine**, tels qu'Ethan les a exportés — clé `#FF00FF` pure,
sans ré-encodage —, déposés dans `art/sources/` sous les noms du brief :
`ruine_def_j_variante_01..04.png` et `ruine_def_o_variante_01..04.png`. Le plus
sûr est de les committer directement sur une branche, ou de les joindre en
**fichiers** plutôt qu'en images collées : c'est le collage qui déclenche le
ré-encodage.

Tout le reste du lot est instruit. À l'arrivée des PNG, il se déroule d'une
traite et sans arbitrage neuf :

1. `python3 tools/entrees.py --declarer`, puis conditionnement — **hors lot par
   le §5 du brief**, donc à confirmer : sans lui il n'y a rien dans l'atlas, et
   `nombreDeVariantes` lèverait. C'est le seul point de méthode qui reste à
   trancher.
2. Famille et poids (§3.1), bande de sel neuve **9** (§2.3 et §2.4), extension de
   `RESTE_APRES_DESTRUCTION` par genre (§3.2 du brief), `defense: 'ruine'` et
   retrait du commentaire périmé, palier **29** (§3.2).
3. T1 et T2 s'écrivent alors pour de bon : T1 est déjà joué comme mesure
   (25,86 % contre 100,00 %), T2 attend le nom de ruine de défense qu'il asserte.

### 7.5 Ce que ce complément change au reste du rapport

Rien n'est retiré. Le §1 garde sa mesure — les huit n'étaient pas au dépôt, et
elles n'y sont toujours pas. Le §2 ne bouge pas d'un chiffre : le sel se mesure
sur des coordonnées, pas sur des pixels. Le §3.1 et le §3.2 sont confirmés par
le §7.2. Le §3.3 est **dépassé et le dit**. Le §6 tient : `dist/index.html` est
toujours identique à l'octet, donc **ni `version`, ni `config.build`, ni
`SAVE_VERSION` ne bougent**.
