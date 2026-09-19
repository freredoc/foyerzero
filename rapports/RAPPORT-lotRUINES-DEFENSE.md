# RAPPORT — lot RUINES-DÉFENSE

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
