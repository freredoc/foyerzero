# RAPPORT — les quatre barrières de défense, et deux planches renommées

**Lot** BARRIÈRES · **Date** 30/08/2026 · **Branche** `claude/sprite-9j4llk`
**Base** `origin/main` à `858ead8`

Les deux barrières — ronce et herse — manquaient aux deux camps depuis le
début. Elles sont découpées et conditionnées : **12 fichiers**, et
`art/sprites/defense/` passe de 200 à **204** par grille.

---

## 0. ⚠ `main` était ROUGE à l'ouverture de ce lot

Mesuré avant de toucher à quoi que ce soit, comme `CLAUDE.md` §0 l'exige :

```
npm run check   →   574 pass / 4 fail
```

Les quatre échecs sont les gardes de `documentation.test.js` sur les §0 et §2
de `CLAUDE.md` :

| Garde | Attendu par la garde | Écrit dans `CLAUDE.md` |
|---|---|---|
| §0 annonce le vrai nombre de tests | 578 | 560 |
| §2 annonce la vraie arborescence | 20 fichiers dans `src/sim/` | 19 |
| §2 nomme les fichiers de `test/` | `rendu-pose` présent | absent |
| §2 nomme les fichiers de `src/` | `rendu-pose.js` présent | absent |

Les lots PREMIÈRE-COUCHE et BÂTIMENTS-source-1024 ont déposé `sim/rendu-pose.js`
et son test sans mettre `CLAUDE.md` à jour. **La garde faisait exactement son
travail** — c'est le point que les deux rapports précédents laissaient ouvert,
et il s'est réalisé.

**Corrigé dans ce lot**, bien que ce ne soit pas ce qui était demandé : livrer
sur une base rouge rendrait impossible de distinguer ma casse de celle dont
j'hérite, et la garde ne se contourne pas, elle se satisfait. Quatre nombres et
deux noms ont changé dans `CLAUDE.md` §0 et §2 ; **aucun assouplissement de
test**. Le compte de `test/` est passé de 36 à 37 et celui de `tools/` de 15 à
16 par la même occasion.

Après correction : **578 pass / 0 fail**.

---

## 1. Ce qui manquait, et depuis quand

`INVENTAIRE-SPRITES.md` §4.2 demande **neuf défenses par propriétaire** :
merlon, ronce, herse, casemate, créneau, batterie, faucheuse, mortier, harpon.

`art/sprites/defense/` en portait 200 par grille, et le compte s'explique
exactement : 12 entités à tourelle × 16 orientations = 192, plus 2 merlons × 4
connexions = 8. **Ni la ronce ni la herse n'y étaient**, dans aucun camp : 4
entités sur 18 sans le moindre sprite. Aucun outil ne les produisait — ni
`tourelles.py`, ni `socles.py`, ni `connexions.py`.

C'est ce trou que les deux planches déposées le 30/08 viennent combler.

---

## 2. Les deux renommages

| Ancien nom | Nouveau nom | D'où vient le nom |
|---|---|---|
| `file_00000000724482108867151717effbbb.png` | `P5.2_def_o_ronce_def_o_herse_v2.png` | c'est le pendant Ouvrage de `P4.2_def_j_ronce_def_j_herse.png` ; `P5.2_def_o_ronce_def_o_herse.png` existe déjà, d'où `_v2` — le suffixe que le dépôt emploie déjà pour un redessin (`S10_base_ouvrage_64-256_v2`, `M3/M4_..._v2`) |
| `file_00000000ff8c81f48b93f4ef80871b34.png` | `roquettes_2x2_1254x1254.png` | convention des planches d'effet déjà au dépôt — `explosion_normale_4x1_4096x1024.png` : sujet, grille, dimensions. « roquettes » est le mot du dépôt (`couts-militaires.js` glose `perceurs` en « lance-roquettes ») |

**Les trois planches d'explosion n'ont pas été renommées** :
`explosion_normale_4x1_4096x1024.png`, `explosion_aeronef_…`,
`explosion_champignon_…` portent déjà sujet, grille et dimensions. Il n'y avait
rien à corriger.

**`P4.2_def_j_ronce_def_j_herse.png` non plus** : Ethan l'a remplacée en place,
sous son nom correct.

---

## 3. La découpe — `tools/barrieres.py`

Outil NEUF, modelé sur `socles.py`, qui est le plus proche : une table de
planches, une coupe en cellules, `recadrer` puis `conditionner`. **Aucun outil
existant n'a été modifié.**

### 3.1 La coupe est en deux moitiés, et c'est vérifié

Chaque planche porte deux cellules : la ronce à gauche (accent **blanc**,
anti-infanterie) et la herse à droite (accent **rouge**, anti-véhicule) —
exactement le tableau de `INVENTAIRE-SPRITES.md` §4.2.

Mesuré, bandes de matière par planche :

| Planche | largeur | bandes | milieu | dans une gouttière ? |
|---|---:|---|---:|---|
| `P4.2_def_j_ronce_def_j_herse.png` | 1024 | 47–468, 519–664, 675–818, 830–973 | 512 | **oui** |
| `P5.2_def_o_ronce_def_o_herse_v2.png` | 1254 | 20–592, 633–822, 831–1020, 1028–1218 | 627 | **oui** |

⚠ **La herse est dessinée en TROIS blocs séparés et la ronce en cinq pointes**,
d'où les quatre bandes au lieu de deux. Ce sont des éléments d'un même ouvrage,
pas des variantes — vérifié contre l'ANCIENNE planche du joueur, récupérée dans
l'historique git : elle portait exactement deux cellules, une ronce d'un bloc et
une herse d'un bloc. La disposition n'a pas changé, le dessin si.

⚠ **Le script REFUSE de couper si le milieu tombe dans la matière.** C'est la
faute que `socles.py` raconte en tête : au lot 3, une coupe en tiers traversait
la colonne de gauche et le morceau parasite partait dans la cellule voisine sans
que rien ne le dise.

**La garde a été falsifiée**, pas seulement écrite : soumise à
`P4.1_def_j_merlon.png` — une pièce unique et centrée — elle lève bien, en
nommant la bande fautive (163–866 contient 512). Elle accepte les deux vraies
planches.

### 3.2 L'emprise est mesurée, pas choisie

`EMPRISE = 28` gros pixels sur une grille de 32. Le chiffre vient d'une mesure
sur ce qui existe déjà :

- les huit merlons produits occupent **20 à 29** pixels de large en grille 32 ;
- les douze socles en occupent **28**.

Une barrière se lit à la même échelle qu'un mur, sous peine de paraître d'un
autre jeu posée à côté.

### 3.3 Ce qui sort

```
python3 tools/barrieres.py   →   12 fichiers écrits
```

`def_j_ronce`, `def_j_herse`, `def_o_ronce`, `def_o_herse`, aux trois grilles.

| Sprite (grille 32) | largeur × hauteur | occupation | couleurs hors rampe |
|---|---|---:|---:|
| `def_j_ronce` | 28 × 18 | 30,1 % | 0 |
| `def_j_herse` | 28 × 8 | 17,1 % | 0 |
| `def_o_ronce` | 26 × 15 | 16,4 % | 0 |
| `def_o_herse` | 26 × 8 | 12,4 % | 0 |

**0 couleur hors rampe sur les 12 fichiers** — 14 teintes côté joueur, 19 côté
Ouvrage. Les largeurs tombent dans la fourchette des merlons, ce qui est le but
de l'emprise.

Les quatre sprites ont été **regardés** en 32 et en 64, pas seulement mesurés :
les pointes blanches et les blocs rouges se lisent aux deux grilles, et les deux
camps se distinguent (kaki contre violet).

### 3.4 Rien d'autre n'a bougé

`git status` sur `art/sprites` ne montre que les 12 nouveaux fichiers. Aucun des
1 537 précédents n'a changé d'un octet.

`art/sprites` : **1 549** fichiers. `defense/` : **204** par grille.

---

## 4. ⚠ Ce qui n'a PAS été découpé, et pourquoi

**Les trois planches d'explosion et la planche de roquettes restent des sources
non traitées.** Elles sont renommées ou déjà bien nommées, rien de plus.

`INVENTAIRE-SPRITES.md` l'interdit, deux fois et en toutes lettres :

> **Zéro sprite d'effet.** Impacts, explosions, éclairs de bouche, mort,
> particules, barres de PV, ombres portées : `FICHE-STYLE.md` §6 et §8 les
> rendent en primitives. Ne rien produire pour eux, et ne pas laisser cette
> ligne réapparaître dans un devis.

Et au §10, « Ce qu'il ne faut PAS produire » :

> **Aucun sprite d'effet.** Impacts, explosions, éclairs de bouche, mort,
> particules, traînées : §8, tout est procédural.

`CLAUDE.md` §1 fait d'`INVENTAIRE-SPRITES.md` l'autorité sur la LISTE de ce
qu'on dessine. Les découper serait produire, en silence, ce qu'un arbitrage
écrit refuse — et §10 dit que cette ligne « reviendra dans une conversation
future si elle n'est pas notée ici ».

**Le dépôt des planches est peut-être précisément la décision de changer d'avis
sur ce point.** Si c'est le cas, l'arbitrage se fait dans
`INVENTAIRE-SPRITES.md` et l'outil suit — les explosions sont des grilles 4 × 1
et les roquettes une 2 × 2, la découpe est du même genre que celle de ce lot. Ce
n'est pas moi qui peux le trancher.

---

## 5. Contrôles d'ensemble

| Contrôle | Résultat |
|---|---|
| `npm run check` | **578 pass / 0 fail** — rouge à l'arrivée (574/4), vert au départ |
| `dist/index.html` | **577 357 octets**, inchangé → ni `version` ni `config.build` bumpés |
| Fichiers déjà commités | **aucun** n'a bougé d'un octet |
| `art/sprites` | 1 537 → **1 549** |

`src/` et `test/` ne sont pas touchés. Les seules modifications hors assets sont
`CLAUDE.md` (§0 et §2, pour la CI) et l'ajout de `tools/barrieres.py`.

---

## 6. Points laissés ouverts

1. **Les effets attendent un arbitrage** (§4) — trois explosions et une planche
   de roquettes au dépôt, que l'inventaire interdit de produire.
2. **`P5.2_def_o_ronce_def_o_herse.png`, l'ancienne, reste au dépôt.** La
   version du joueur a été remplacée en place, pas celle de l'Ouvrage : les
   deux coexistent. La supprimer appartient à Ethan, comme les deux `S10_`
   écartés au lot 6.
3. **Les barrières n'ont pas d'état de connexion**, là où le merlon en a quatre.
   Rien ne dit qu'elles en veuillent — mais si un jour une ronce doit se
   raccorder à sa voisine, c'est `connexions.py` qu'il faudra étendre, pas
   `barrieres.py`.
4. **`fouisseur` au singulier** dans les planches de l'Ouvrage, contre la clé
   `fouisseurs` de `UNITES`. Signalé au lot précédent, toujours ouvert.
5. **Les deux `ÉCART` de `planches.py`** — `off_j_ratisseur` et `off_j_belier`
   en 32 — dont la chaîne ne sait toujours pas reproduire la provenance.
