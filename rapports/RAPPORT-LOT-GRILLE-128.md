# RAPPORT — LOT GRILLE-128

**Version produite** : `0.71.0` · build `73`.
**Base** : `main` à `cc8cbf1` (lot ENTRÉES fusionné).
**`SAVE_VERSION`** : inchangée, **24**.

---

## 0. Ce que le lot fait, en une phrase

Le jeu embarquait la grille 64 et l'agrandissait ; il embarque désormais la
**128**, que `tools/atlas.py` cousait déjà depuis le lot PIXELS sans que
personne ne la lise.

Arbitrage d'Ethan, 03/09 : « il faut les mettre en 128 au sol, et les unités
aussi ; câbler en 128, je sais que la taille du jeu va dépasser mais tu t'en
fous. »

---

## 1. LE GESTE TIENT EN DEUX CONSTANTES

C'est le dividende du lot PIXELS, qui coud les deux grilles :

| fichier | avant | après |
|---|---|---|
| `tools/atlas.py` | `COTE_INDEX = 64` | `COTE_INDEX = 128` |
| `tools/build.js` | `GRILLE_ATLAS = 64` | `GRILLE_ATLAS = 128` |

Plus le chemin des deux grosses bases de l'Ouvrage, qui voyagent hors atlas et
portaient `carte/64/` en dur — elles lisent maintenant la constante.

**Tout le reste suit sans une ligne** : `src/render/sprite.js` calcule des
POURCENTAGES, donc il est sans échelle ; `src/render/scene.js` lit `COTE_SPRITE`
pour son rectangle source et le suit ; `src/data/atlas.js` est régénéré.

---

## 2. CE QUE ÇA COÛTE, MESURÉ POSTE PAR POSTE

| poste | avant | après | delta |
|---|---|---|---|
| huit atlas `.webp` | 561 240 o | 1 407 414 o | **+1 128 232 en base64** |
| `base_o_2x2` + `base_o_3x3` | 90 047 o | 326 146 o | **+314 799 en base64** |
| atlas du fond de carte | 224 548 o | 224 548 o | **0** |
| **`dist/index.html`** | **1 592 440** | **3 035 474** | **+1 443 034** |

La borne T10 passe de **1 650 000 à 3 200 000**, marge 164 526 octets, soit
5,1 %. La raison est écrite dans le test, poste par poste.

⚠ **L'ATLAS DU FOND DE CARTE NE BOUGE PAS, ET IL FAUT SAVOIR POURQUOI.** Son nom
dit `-64` mais ses tuiles font **déjà 128** : le `-64` désigne la cellule du SOL
DE BASE, dont il y a quatre par case, pas sa grille. C'est une source déclarée,
livrée finie ; le lot n'y touche pas.

---

## 3. LE ZOOM SE RELIT, ET LE JOUEUR NE VOIT RIEN CHANGER

`ZOOM_BASE_MULTIPLE_MAX` passe de **2 à 1**. Le plafond du zoom vaut
`COTE_SPRITE × ce nombre` :

```
hier    64 × 2 = 128 px CSS par case   (un pixel de sprite doublé)
aujourd'hui 128 × 1 = 128 px CSS par case   (un pixel de sprite = un pixel CSS)
```

**La plage ne bouge pas d'un pixel** — plancher 40, plafond 128, soit 3,2× — et
le flou du plafond disparaît. Le laisser à 2 aurait porté le plafond à 256 et
rouvert, à l'envers, la question de plage qu'Ethan a tranchée le 31/08 (« le
zoom de la base est chelou, très lent »).

---

## 4. ⚠⚠ UNE GARDE MESURAIT UN PROXY, ET CE LOT L'A MONTRÉ

`zoom de la base — la plage est assez large pour qu'un geste se voie` exigeait
`ZOOM_BASE_MULTIPLE_MAX >= 2`. C'était vrai **tant que la grille faisait 64**,
où seul un multiple de 2 portait le plafond à 128 px CSS. À 128, le même plafond
s'obtient avec un multiple de 1, et **le multiple ne dit plus rien de la plage**.

La garde nomme désormais le **plafond en pixels**, qui est la grandeur qu'elle
défendait depuis le début. Ce n'est pas un assouplissement : l'assertion de
plage (`COTE_CASE_MAX / plancher >= 3`) n'a pas bougé et mesure toujours 3,2×.

---

## 5. ⚠⚠ LES MURS SONT UNE DETTE DATÉE, CHIFFRÉE, ET ASSERTÉE ENCORE VIOLÉE

Les seize sprites de `bord/` sont ceux du 31/08, taillés pour une case de 64.
Sur une grille de 128 ils s'affichent toujours — `background-size: 100% 100%`
les étire sur leur boîte — mais **exactement DEUX FOIS**, donc à la moitié de la
définition de tout ce qui les entoure.

Le test ne fait pas semblant :

```js
const COTE_MUR = 64;
assert.notEqual(COTE_MUR, COTE_SPRITE,
  'les murs sont à la grille du jeu : retirer COTE_MUR et lire COTE_SPRITE');
…
const etirement = (haut.l * COTE_SPRITE) / LONG;
assert.equal(etirement, 2,
  `le mur du haut est étiré ${etirement}× : ni le 2 de la dette, ni le 1 de l'asset refait`);
```

**Deux assertions inverses** : le jour où les murs passent à 128, les deux
tombent, et quelqu'un vient retirer la dette au lieu de la laisser mentir.

### Pourquoi les murs ne sont PAS dans ce lot

Ethan a livré leur remplacement le même jour. Mesuré sur les fichiers :

- `mur_{joueur,ouvrage}_4x1_v2_{1..4}.png` — **512 × 128**, quatre variantes par
  camp ;
- `angle_bloc_{joueur,ouvrage}_1x1_v2_{1..4}.png` — **128 × 128**, quatre par
  camp ;
- plus les quatre planches `2048 × 2048` qui les portent, sur clé magenta
  `#FF00FF` — donc conditionnables par `tools/bords.py`.

⚠⚠ **CE NE SONT PAS DES MURS PLUS ÉPAIS : CE SONT DES BLOCS.** Mesuré, un mur
`4x1` est **opaque à 97 %** de sa boîte, un angle à 100 % — là où les actuels
sont des TRAITS fins sur fond transparent, posés **à cheval sur le bord** avec
une demi-case de `padding` de chaque côté. Poser des blocs demande de décider
s'ils mangent une case de la grille ou s'ils la ceignent d'un anneau : c'est une
GÉOMÉTRIE, pas une taille, et elle change le plancher du zoom, le `padding` de
la feuille et `bornesDeDefilement`. C'est le lot MURS.

---

## 6. BORNES

| mesure | **mesuré** |
|---|---|
| `npm test` | **939 pass / 0 fail** (939 avant) |
| `dist/index.html` | **3 035 474 o**, 0 référence externe |
| marge T10 | 164 526 o, **5,1 %** |
| `tools/verifier.py` | **931 · 0 · 0 · 0**, vert, 304,1 s |
| sprites réécrits | **0** — le lot change la grille LUE, pas les dessins |
| `data:` dans le HTML | 16 avant, **16** après |

---

## 7. LES ÉCARTS, ET CE QUI RESTE

Aucun écart : le lot fait ce qu'Ethan a demandé et rien de plus.

**Ce qui reste, dans l'ordre où je le propose :**

1. **MURS** — les 8 blocs `4x1` et 8 angles `1x1`, le U qui descend du haut de
   la base jusqu'au bas de la bande de défense et **ne ferme pas en bas**.
   Demande l'arbitrage « anneau ou case mangée ».
2. **OFFENSE** — le fond livré (1148 × 1368) et les quatre rangées de neuf **en
   quinconce**. Les pastilles de la capture sont un croquis : mesurées, elles
   sont 27 sur sept rangées lâches, quand la règle dictée est 4 × 9.
3. **TERRITOIRE** — les cinq formes (trait, angle en L, coin, U, carré) × deux
   camps, livrées en 128, pour remplacer les côtés tracés de l'écran Monde.
4. **MOULINETTE-TERRAIN** — les champs de quartz et de scorie, et le fond de
   carte, qui n'ont jamais traversé le rendu au filtre du lot PIXELS. ⚠ Les
   tuiles sources sont au dépôt (`art/sources/carte/tiles/`, 261 fichiers de
   128), mais l'atlas livré est une **source déclarée** qu'aucun outil ne
   produit : le lot devra d'abord écrire le couseur qui manque.
