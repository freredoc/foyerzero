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
