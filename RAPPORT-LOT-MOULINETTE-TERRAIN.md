# RAPPORT — lot MOULINETTE-TERRAIN

**03/09/2026** · branche `claude/sprite-refonte-9il369` · version **0.76.0 ·
build 78** · `dist/index.html` **3 348 704 octets**, 0 référence externe.

Demande d'Ethan, 03/09 : « passe tout les sprites non fait dans le nouveau
modèle. terrain, champs quartz scories etc bâtiments etc ».

---

## 0. Ce qui restait vraiment — mesuré avant d'écrire une ligne

Le message nomme trois familles. Le dépôt en porte onze. Avant de toucher quoi
que ce soit, j'ai compté les **teintes opaques distinctes** de chaque sprite,
famille par famille, à la grille 128 :

| famille | médiane | min | max | verdict |
|---|---:|---:|---:|---|
| socle | 6 221 | 4 627 | 8 311 | passée au lot PIXELS |
| carte | 7 456 | 5 184 | 42 057 | passée |
| bord | 6 688 | 2 382 | 10 586 | passée (lot MURS) |
| chassis | 4 484 | 3 851 | 4 849 | passée |
| tourelle-unite | 4 004 | 2 587 | 5 208 | passée |
| unite | 3 525 | 1 659 | 6 499 | passée |
| **bâtiment** | **3 091** | 1 502 | 7 210 | **passée** |
| defense | 2 408 | 764 | 4 726 | passée |
| limite | 4 | 4 | 4 | art d'Ethan livré à plat, 03/09 |
| effet | 16 | 14 | 16 | palette propre, arbitrée le 30/08 |
| **terrain** | **3** | **1** | **5** | **PAS passée** |

⚠⚠ **Les bâtiments qu'Ethan nomme SONT passés — 3 091 teintes.** Il n'y avait rien
à y refaire, et le dire vaut mieux que de rejouer ce qui est fait. `effet` porte
sa propre palette de seize teintes (`INVENTAIRE-SPRITES.md` §8, arbitré le
30/08) et n'entre dans aucun atlas ; `limite` est le dessin qu'Ethan a livré le
matin même. **La liste des « plein d'autres éléments » se réduit donc à la
famille `terrain`, et à dix de ses dix-huit tuiles.**

---

## 1. Pourquoi personne ne les produisait

`terrain/` est une **source déclarée** de `tools/verifier.py` depuis le 30/08,
sur arbitrage d'Ethan — « déclarer le terrain comme une source » —, au motif que
la branche terrain de `planches.py` était une migration à usage unique qui avait
supprimé ses propres planches.

⚠⚠ **C'était vrai des huit dalles de sol, et FAUX des dix autres.** Les planches
des champs et des obstacles sont au dépôt **depuis toujours**, dans
`art/sources/`, en 1254 × 1254 et de 8 628 à 87 766 couleurs. Elles y dormaient,
classées `dormantes` par le lot ENTRÉES, parce qu'aucun outil ne les nommait.
Personne ne les avait cherchées.

La table portait sa propre contre-épreuve : « le jour où un outil se met à
produire une tuile de terrain, le vérificateur TOMBE, pour qu'on retire la
ligne ». **Ce jour est celui-ci**, et la déclaration se resserre sur les seules
`tile_sol_*`, aux trois grilles.

---

## 2. `tools/terrain.py` — vingt-huitième outil, quinzième producteur

Chemin canonique, celui des neuf autres familles :
`recadrer` → `conditionner` → `ecrire` avec la MATIÈRE, c'est-à-dire détourage,
prémultiplication, réduction LANCZOS, dé-prémultiplication, coupe de l'alpha
sous 8. **Ni `est_fond`, ni `recadrer`, ni `conditionner` ne sont touchés** — le
vérificateur le prouve en rejouant les douze autres outils à l'octet.

### 2.1 La clé de ces planches n'est pas pure — on la normalise en amont

Mesuré : **zéro pixel `#FF00FF` sur les sept planches**. Le fond est un magenta
bruité, coins relevés entre (194, 16, 138) et (236, 11, 143), et il s'assombrit
là où le dessin l'ombre — jusqu'à (168, 23, 113) au creux d'un fourré.

Deux dégâts constatés au rendu de contrôle, pas à la relecture :

1. `fourre_sec_b` laissait **cinquante-sept mouchetures** de fond passer pour du
   sujet — la plus grosse fait 7 pixels quand le dessin en fait 252 420. Elles
   portaient le cadrage de `recadrer` à 1 061 pixels de côté et **jusqu'au bord
   de la planche** : le buisson ressortait décentré et rapetissé à **85 pixels
   dans une case de 128 au lieu de 112**.
2. Les pixels de clé **assombris** survivaient au détourage en restant OPAQUES,
   et la réduction LANCZOS les mélangeait au dessin : l'obstacle ressortait semé
   de points roses.

`normaliser_la_cle` rabat sur le magenta pur ce qui est à moins de `RAYON_CLE`
de la clé mesurée **par médiane** sur une bande de 8 pixels au pourtour (une
moyenne se laisserait tirer par un coin mangé par le dessin). Après quoi la
chaîne reçoit une planche à clé pure et n'a plus rien de particulier à savoir.

### 2.2 `RAYON_CLE = 80` — les deux voisines sont mesurées et écartées

Points roses résiduels dans le sujet, somme sur les sept planches :

| rayon | résidu | coût sur le quartz |
|---:|---:|---|
| 60 | 24 886 | −0,00 % |
| **80** | **6 337** | **−0,24 %** |
| 100 | 2 421 | **−2,3 %**, le cerne violet se troue |

Le cerne violet foncé du quartz est à **94,2** de sa propre clé : à 100 la
normalisation le mange. 80 est la dernière valeur avant que le nettoyage ne se
paie en dessin.

### 2.3 L'érosion est le mauvais levier — mesuré, c'était le premier essai

`conditionner` érode le masque de sujet de trois pixels pour manger la frange.
Trois pixels d'une planche de 1 254 réduite à 128 valent **trois dixièmes de
pixel de sortie**. Portée à un pixel de sortie (8) puis deux (16), elle ne retire
**aucun** point rose — ils ne touchent pas la frange, ils sont enfermés dans le
dessin — et coûte **26 % puis 61 % des pixels opaques du quartz**, cerne compris.
Elle reste au défaut de la maison.

### 2.4 Écart déclaré : `fourre_sec_a` est écartée, et c'est la source

Sa clé a bavé **DANS** le dessin au rendu : l'ombre de ses branches n'est pas
brune mais **marron-violet**, et des pixels franchement magenta sont posés sur
les rameaux eux-mêmes. Regardé au pixel près, à côté de `fourre_sec_b` qui est
nette (branches beiges, cernes noirs, clé propre).

Aucun filtre ne rend du brun à partir du marron-violet sans inventer de la
couleur : le fourré ressortait **rose, c'est-à-dire plus faux que l'ancien**, que
la quantification rabattait par accident sur la rampe kaki. `obs_infanterie` se
produit donc d'une planche et de son miroir, comme les deux champs.

⚠ **C'est le seul écart à la demande d'Ethan**, et il se défait d'une ligne de
`PLANCHES` le jour où il refait un rendu propre de `fourre_sec_a`. La planche
reste au dépôt et redevient `dormante` — `art/sources/` ne s'ampute jamais.

### 2.5 Les miroirs sont relevés, pas décidés

`champ_quartz_b` est le miroir horizontal **EXACT** de `champ_quartz_a` dans les
sprites commités avant ce lot, et `champ_scorie_b` de `champ_scorie_a` : vérifié
pixel par pixel aux deux grilles. C'est cette règle qu'`obs_infanterie` reprend
faute de seconde planche saine ; `obs_les_deux` et `obs_vehicule` gardent leurs
deux vrais dessins.

⚠ **Le miroir se prend sur la SORTIE.** LANCZOS n'est pas symétrique au pixel
près sur un côté pair : retourner la planche d'abord donnerait un `b` qui n'est
plus rigoureusement le miroir de `a`. Même argument que les rotations de
`tools/limites.py`.

### 2.6 L'emprise se lit sur ce qui est au dépôt

Les dix sprites commités occupent **112 pixels de 128** et **56 de 64**,
centrés — sept huitièmes, marge d'un seizième —, mesuré sur les dix aux deux
grilles. En unités de la grille 32 dont `recadrer` se sert : **28**. En choisir
une autre aurait fait grandir ou maigrir tous les champs de toutes les bases
pour une raison qui n'est pas dans le message d'Ethan.

---

## 3. Les huit dalles de sol ne sont pas produites — trois mesures

1. Leur source apparente, `sol_source_grille64_1536.png`, porte **exactement les
   cinq teintes de la rampe « sol joueur »** de `FICHE-STYLE.md` : c'est un
   INDEX, pas une matière, et le passer au filtre mélangerait des indices.
2. **Aucune des 576 cellules de 64** de cette source, ni aucune fenêtre glissante
   de 64 × 64 sur ses 1 536², ne reproduit une seule des quatre dalles : la
   migration a fait autre chose qu'une coupe, et ce qu'elle a fait n'est plus au
   dépôt.
3. **Aucun écran ne les dessine.** Le sol de la base est découpé dans l'atlas du
   MONDE depuis le 30/08, quatre cellules par case ; `fondDuTerrain` de
   `ui/chantier.js` n'est appelé que sur `champ_<ressource>` et `obs_<type>`.

⚠ Et leur grille 128 n'en est pas une : les quatre dalles de 128 sont le
**doublement NEAREST exact** des quatre de 64. Elles ne portent aucun détail de
plus.

⚠ Leur type de couleur n'est même pas cohérent d'une grille à l'autre — RVBA en
32 et 64, **RVB sans couche alpha en 128** —, ce qui est une raison de plus de ne
pas prétendre savoir les reproduire.

Reconstruire à l'aveugle huit dalles que personne ne regarde, à partir d'un index
qu'on ne sait pas replier, aurait été inventer de l'art plutôt que de le passer à
la moulinette.

## 3 bis. Les dix autres tuiles de la grille 32 sortent du dépôt

La 32 n'est produite par aucun outil depuis le lot PIXELS, et la seule raison de
garder `terrain/32` était l'irrécupérabilité de ses tuiles — qui vient de cesser
d'être vraie pour dix d'entre elles. Un fichier qu'aucun outil ne produit et
qu'aucun écran ne lit est exactement ce que le vérificateur appelle un MANQUANT.
`terrain/32` ne porte plus que les huit dalles, et un test l'asserte.

---

## 4. Le coût, poste par poste

| poste | avant | après | écart |
|---|---:|---:|---:|
| `atlas-terrain-128.webp` (embarqué) | 14 814 | 68 476 | **+53 662** |
| `atlas-terrain-64.webp` (au dépôt seul) | 14 598 | 30 268 | +15 670 |
| `dist/index.html` | 3 277 152 | **3 348 704** | **+71 552** |

Le livrable ne porte que la grille 128 (`GRILLE_ATLAS` de `tools/build.js`) ;
+53 662 octets de WebP font +71 549 en base64, plus trois octets de bourrage.

⚠ **25 `data:` avant, 25 après** : aucune image n'entre, c'est une image qui
grossit. Borne T10 **inchangée à 3 400 000**, marge **51 296 octets, 1,5 %** —
la plus mince depuis BASES-1. Le prochain lot qui fait entrer une image devra la
relever **en écrivant pourquoi**.

---

## 5. Ce qui change pour le joueur — et l'arbitrage que ça rouvre

⚠⚠ **Les couleurs des ressources changent.** La vieille chaîne ne faisait pas que
quantifier : elle **repeignait** sur les quatorze teintes de `cond.py`. Le quartz
d'Ethan est **VIOLET** et ressortait bleu-gris pâle ; sa scorie est **NOIRE À
VEINES ORANGE** et ressortait violet sombre à veines ambre. Le nouveau modèle ne
repeint rien — c'est sa définition —, donc les champs reprennent la couleur de
leurs planches.

`FICHE-STYLE.md` réserve `#9FB3C5` et `#C1CEDA` au quartz et `#382E47` à la
scorie. **Ces trois teintes décrivaient le rendu de l'ancienne moulinette, pas le
dessin d'Ethan.** C'est son art et il fait foi sur ce qu'il dessine, mais le code
couleur des ressources n'est plus celui qu'il était.

⚠ **C'est la deuxième fois en deux lots** — après les teintes de la frontière de
territoire, or/ambre pour le joueur et gris-bleu pâle pour l'Ouvrage là où
`TEINTES_TERRITOIRE` posait l'os et le rouge. **Les deux se tranchent ensemble.**

---

## 6. Les gardes

Quatre tests entrent dans `test/sprite.test.js` — pas un fichier neuf : c'est
déjà lui qui garde le conditionnement des sprites, il importe `decoderRgba`, et
un fichier de plus aurait demandé une entrée dans §2 de `CLAUDE.md` pour une
famille qui y est déjà.

| test | ce qu'il tient | falsification | verdict |
|---|---|---|---|
| teintes | les dix > 32, les dalles == 5 | remettre le sprite quantifié d'avant | **tombe** |
| emprise | 112/128 et 56/64, centrés | `EMPRISE32` 28 → 26 | **tombe** |
| miroirs | trois le sont, deux ne le sont pas | rendre `obs_les_deux_b` miroir de `_a` | **tombe** |
| miroirs | (l'autre moitié) | un pixel changé dans `champ_quartz_b` | **tombe** |
| clé + 32 | zéro clé opaque, huit dalles seules | pixel `#FF00FF` à alpha 255 | **tombe** |
| clé + 32 | (l'autre moitié) | remettre `terrain/32/champ_quartz_a.png` | **tombe** |

**Six falsifications, six chutes.**

⚠⚠ **Deux de ces gardes ont mordu pour de bon en cours d'écriture, et les deux
ont été CORRIGÉES — pas assouplies pour faire passer le lot :**

- La garde des teintes exigeait « plus de cent » ; `obs_vehicule`, une nappe de
  pétrole presque plate, en porte **82** à la grille 64. **Un seuil qui ne tient
  pas dans l'intervalle qu'on vient soi-même de mesurer n'est pas un seuil,
  c'est un chiffre rond.** Il est à **32** : six fois au-dessus de l'ancien
  maximum (5), deux fois et demie sous le nouveau minimum (82).
- La garde de la clé exigeait zéro pixel magenta à quelque alpha que ce soit, et
  elle est tombée sur dix-huit pixels de `champ_quartz_a`. Ils n'ont rien à voir
  avec le détourage : `ecrire` dé-prémultiplie en divisant par l'alpha, si bien
  qu'un pixel de frange à alpha 9 voit son arrondi amplifié jusqu'à retomber sur
  `#FF00FF`. **Ce n'est pas propre à cette famille** — mesuré sur tout
  `art/sprites/` : `defense` en porte 246, `unite` 58, `socle` 41, et **ZÉRO,
  dans tout le dépôt, à alpha ≥ 128**. C'est cette borne-là qui est vraie, et
  c'est elle qu'un détourage manqué franchirait : il laisse sa clé à alpha 255,
  pas à 9. Le pire de `terrain` est à **51**.

⚠ **Un commentaire devenu faux a été réécrit, pas enjambé.** `sprite.test.js`
écartait `terrain` de la garde des trous au motif qu'« aucun outil ne les produit,
la chaîne ne les a jamais touchées ». C'est vrai des quatre `tile_sol_o_*` — les
seuls fichiers que son filtre `_o_` ramasse — et faux de la famille depuis ce
lot.

---

## 7. Résultats

- `npm run check` → **960 pass / 0 fail** (956 avant, +4).
- `npm run build` → `dist/index.html`, **3 348 704 octets**, 0 référence externe.
- `python3 tools/verifier.py` → **1 005 identiques · 0 différent · 0 nouveau ·
  0 MANQUANT**, verdict **VERT**, en **312,4 s**. Il était dû : le lot touche
  `art/` et `tools/`. Le compte passe de 985 à 1 005 — les vingt tuiles qui
  cessent d'être une source déclarée pour devenir un produit, et rien d'autre.
- `tools/entrees.py --verifier` → **95 consommées / 95 déclarées, 79 dormantes /
  79 déclarées** ; sept planches passent de `dormantes` à `consommees`, et
  `fourre_sec_a` reste dormante. `art/sourcesstandby/` : 34 fichiers, **0 lu**.
- **`SAVE_VERSION` ne bouge pas et reste à 24.** Un champ de quartz est un
  dessin : le lot ne touche ni l'état, ni la sauvegarde, ni une règle de jeu.

### Fichiers touchés

```
tools/terrain.py                      NEUF — 15e producteur, 28e outil
tools/verifier.py                     CHAINE + SOURCES_DECLAREES resserrée
tools/atlas.py                        (inchangé — la famille y était déjà)
art/sprites/terrain/{64,128}/*.png    20 tuiles reproduites
art/sprites/terrain/32/*.png          10 retirées, 8 dalles conservées
art/sprites/atlas-terrain-{64,128}.webp   recousus
art/sprites/atlas-empreintes.json     recalculé
art/sources-declarees.json            88/86 → 95/79
test/sprite.test.js                   +4 tests, 1 commentaire corrigé
CLAUDE.md                             §0 et §2
package.json                          0.75.0/77 → 0.76.0/78
```

---

## 8. Ce qui reste ouvert

1. ⚠⚠ **Les couleurs — deux lots d'affilée les ont déplacées sans arbitrage.**
   Frontière de territoire (or/ambre et gris-bleu pâle) et champs de ressource
   (quartz violet, scorie noire et orange). À trancher ensemble.
2. **`fourre_sec_a` attend un rendu propre.** Une ligne de `PLANCHES` à remettre.
3. ⚠ **Le fond de la carte du monde n'est PAS dans ce lot, et ce n'est pas un
   oubli.** `art/sprites/carte/atlas-terrain-64.png` est 1024 × 1024 en mode
   PALETTE, **cinq indices couvrant exactement 20,0 % de la surface chacun** :
   ce n'est pas une image quantifiée, c'est une **carte d'indices**, et c'est ce
   qui permet à UN atlas de servir les deux rampes de sol. `render/terrain.js`
   accumule ces indices, quintile la sortie avec `TERRAIN_CARTE.seuilsDeTeinte`
   et applique la rampe du camp. Le passer au filtre ne serait pas un passage à
   la moulinette : ce serait **remplacer le moteur de rendu de la carte** —
   perdre le recolorage par camp, les quintiles et l'invariant « une zone rendue
   en une dalle est identique à la même rendue en quatre ». Ses quatre planches
   sources sont au dépôt (`art/sources/carte/`, 1024 × 1024, 27 à 35 000
   couleurs) : **c'est faisable, et c'est un lot à soi, avec un arbitrage
   dedans** — que devient le sol de l'Ouvrage, s'il n'est plus un recolorage de
   celui du joueur ?
4. **Les huit dalles de sol** restent une source déclarée, et le §3 dit à quelles
   conditions cela cesserait.
