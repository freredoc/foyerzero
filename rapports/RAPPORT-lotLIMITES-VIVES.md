# Rapport — lot LIMITES-VIVES (05/09/2026)

**Demande d'Ethan, en deux points :**

> Refais les territoires pour le joueur tu prends tu re-appliques un coloris vert
> kaki mais assez vif pour qu'il se détache par rapport au nouveau plan satellite
> et tu prends un violet pareil assez vif comme ouvrage mais qui ressort et qui
> contraste par rapport au nouveau sol de la carte.
>
> Autre chose par exemple quand tu dessines un U un territoire en U il manque les
> deux points je pense qu'il manque les coins comment dirais-je en 270 degrés
> enfin tu lui retrouves tu verras

**Version produite : 0.96.0 · build 98.**
`npm test` → **1096 pass / 0 fail** (1094 avant). `npm run build` →
`dist/index.html`, **8 995 675 octets**, 0 référence externe.
`python3 tools/verifier.py` → **1 431 identiques · 0 différent · 0 nouveau ·
0 MANQUANT**, verdict VERT, 415,5 s.

---

## 0. Base de départ, relevée avant de toucher quoi que ce soit

`origin/main` à `8936f7d`, v0.95.0 · build 97. `npm ci && npm run check` →
**1094 pass / 0 fail**, livrable 8 991 743 octets. Base VERTE.

⚠ Le lot touche `art/` et `tools/` : `python3 tools/verifier.py` était donc dû,
et il a été lancé sur l'arbre final, une fois toutes les falsifications défaites.

⚠ **Le zip d'Ethan est celui du 03/09, à l'octet.** `9e17ab94-foyerzero_limitesterritoire.zip`
porte `limites_territoire_foyer_zero_v5`, et ses quatre planches ont les mêmes
SHA-256 que celles d'`art/sources/`. **Aucune source n'entre**, donc
`art/sources-declarees.json` ne bouge pas — 378 consommées · 95 dormantes ·
473 fichiers, inchangé. Ce lot ne fait entrer aucun dessin ; il recolorise ce qui
est là et compose une pièce que l'art n'a pas.

---

## 1. Les deux points manquaient pour de bon, et c'est mesuré avant d'écrire

Le lot TERRITOIRE (03/09) affirmait le contraire, dans `tools/limites.py` **et**
dans `src/render/limite.js` :

> dans ce modèle un coin rentrant est déjà formé par deux traits pleins de DEUX
> cases voisines qui se rejoignent au sommet. **Vérifié en rendant un territoire
> d'essai à encoche** : la frontière s'y ferme sans lui.

⚠⚠ **C'est FAUX, et la raison est géométrique : les deux traits se rejoignent au
POINT, pas en surface.** Une bande fait deux pixels logiques d'épaisseur ; à un
sommet rentrant, la bande horizontale s'arrête à la verticale du sommet et la
bande verticale part de l'horizontale du sommet. Elles ne partagent qu'un point,
et laissent un carré de **2 × 2 pixels logiques** que ni l'une ni l'autre ne
peint. C'est le raccord d'onglet d'un décalage vers l'intérieur.

**Reproduit avant d'écrire une ligne**, en composant le U `XXX / X.X / X.X` avec
les sprites du dépôt et en comptant les pixels :

```
sommets rentrants attendus : 2  [(0,0) coin sud-est, (0,2) coin sud-ouest]
  case (0,0) coin (1,1) : 0 / 4 pixels logiques peints
  case (0,2) coin (1,-1) : 0 / 4 pixels logiques peints
```

**Ethan compte deux points ; la mesure en compte deux.** Après le lot, les mêmes
huit pixels valent 4 / 4 et 4 / 4.

⚠ **Et ça se voit à l'écran, pas seulement dans un compteur.**
`rapports/lotLIMITES-VIVES-epaule-avant-apres.png` montre l'épaule nord-ouest de
l'octogone du joueur, agrandie ×5, avant à gauche et après à droite : le trou est
franc, et c'est exactement ce qu'Ethan décrit.

### 1.1 Ce n'est PAS `angle_l`, et c'est mesuré aussi

Le zip porte une cinquième cellule, `angle_l`, que le lot TERRITOIRE avait
écartée. Relevée sur la grille logique :

- bande verticale aux colonnes 15–16, rangées 0–16 ;
- bande horizontale aux rangées 15–16, colonnes 0–16 ;
- repères tournés vers le NORD et vers l'OUEST ;
- au sommet du coude, `#FFE984` — **l'éclat**, celui d'un angle qui SORT.

C'est donc le bord sud-est du QUART nord-ouest de la case : le même angle que
`coin`, à la médiane et à moitié d'échelle. **Un angle sortant.** Le poser à un
sommet rentrant peindrait une frontière au milieu d'un territoire, sur une
demi-case de long. Il reste non produit.

### 1.2 La pièce est COMPOSÉE, et c'est le seul pixel du lot qui ne vient pas d'une planche

Cherché d'abord : sur les cinq cellules des deux camps, aux 1024, **zéro** bloc de
2 × 2 pixels logiques porte le motif d'un sommet rentrant (trois tons de bande
sombre et un ton clair au coin extérieur). L'art n'en dessine pas.

Les quatre pixels se composent donc des **deux tons de bande** de la rampe du
camp — rangs 1 et 3, jamais les repères ni les éclats, qu'un carré de deux pixels
de côté n'a pas à porter. Le motif se dérive :

- dans le carré de raccord, la distance à la frontière est la distance au
  SOMMET : 0,71 pour le pixel qui le touche, 1,58 pour ses deux voisins, 2,12
  pour le quatrième ;
- le cran extérieur de la bande va de 0 à 1, donc **un seul pixel est clair**.

⚠ **C'est l'exact complément d'un coin sortant**, où la même règle donne trois
pixels clairs et un sombre — et c'est bien ce que porte chaque coin de `carre`,
mesuré : trois `EAB82B` et un `7E4A12`. **Les deux motifs ne sont donc pas
l'image l'un de l'autre par rotation** ; les composer par symétrie mettrait le
ton clair au fond du territoire.

### 1.3 En jeu réel, la case qui porte le sommet n'a AUCUN côté exposé — 360 sur 360

C'est le fait qui a obligé à toucher `sim/territoire.js` et pas seulement le
dessin. Mesuré sur **20 graines × 4 vues, 50 940 cases occupées** :

| grandeur | valeur |
|---|---|
| sommets rentrants | **360** (0,71 % du nombre de cases) |
| cases en portant au moins un | 360 |
| … dont **sans aucun côté exposé** | **360** |

Sur le U d'Ethan, la case qui porte le sommet a deux côtés exposés — c'est le cas
FACILE. Sur une vraie carte, les territoires sont des unions d'octogones et le
sommet rentrant naît toujours au creux d'une jonction, sur une case entourée des
quatre côtés par son propre camp. `bordsDuTerritoire` ne retenait que les cases à
côté exposé : **elle n'en aurait vu aucun.** Elle retient désormais aussi celles
qui ne touchent le dehors que par un coin. Les deux montages sont dans les tests.

---

## 2. La couleur : ce qui a changé sous la frontière

⚠⚠ **LA FRONTIÈRE ÉTAIT CALIBRÉE CONTRE UN SOL QUI N'EST PLUS À L'ÉCRAN.** Le lot
ARMÉE-ET-FRONTIÈRE (03/09) l'avait recolorisée sur les quatre tons sombres des
rampes de camp, en mesurant l'écart de clarté contre `TERRAIN_CARTE.rampes` — la
référence **DÉCLARÉE** de l'ancien sol indexé, dont les cinq clartés valent
L\* 58,1 · 62,9 · 68,0 · 73,0 · 77,9. Le lot SOL-SATELLITE (05/09) a mis l'art
d'Ethan à la place. Mesuré sur les huit planches alignées, 12,6 millions de
pixels :

| grandeur | rampe déclarée | sol satellite |
|---|---|---|
| clarté la plus basse | 58,1 | **p1 50,72** · p5 54,96 |
| clarté médiane | 68,0 | 64,54 |
| clarté la plus haute | 77,9 | p95 74,24 · p99 77,97 |
| chroma moyenne | — | **25,8**, teinte 46° |

**Le sol réel descend sept clartés plus bas que la référence déclarée.** Le ton
clair de la frontière du joueur — `#6A7658`, L\* 47,9 — n'était donc plus qu'à
**3,1** du plancher du sol, quand la garde en exigeait 8 contre une référence qui
n'était plus la bonne. Et surtout : sa chroma valait 18,2 contre 25,8 au sol.
Une frontière moins colorée que le terrain se lit comme de la boue.

### 2.1 Ce qui change est la CHROMA, et elle seule : ×2

Chaque ton garde **sa clarté au dixième** et **sa teinte au degré** — kaki 125°,
ardoise 308° — et double sa chroma.

| rang | joueur avant | après | Ouvrage avant | après |
|---|---|---|---|---|
| 1 — bande intérieure | `#161914` C 3,9 | `#161A0E` C 8,2 | `#0D0B12` C 3,7 | `#100916` C 7,4 |
| 2 — repères | `#343A2C` C 9,7 | `#2F3C20` C 19,2 | `#231D2E` C 12,6 | `#26193C` C 25,7 |
| 3 — bande extérieure | `#4E5742` C 13,6 | `#475A2F` C 27,3 | `#382E47` C 17,5 | `#3B285C` C 35,5 |
| 4 — éclats | `#6A7658` C 18,2 | `#5F7A3E` C 36,1 | `#4E4160` C 20,6 | `#523A7A` C 41,6 |

⚠⚠ **ET C'EST CE QUI REND LE RESTE GRATUIT.** La lecture dedans-sombre /
dehors-clair repose sur le RANGEMENT PAR CLARTÉ que `tools/limites.py` applique.
Les clartés ne bougeant pas d'un dixième, ce rangement est identique rang par
rang : **la lecture est intacte par construction, pas parce qu'on l'a
revérifiée.** La garde qui la mesure (L\* moyen 38,7 dehors contre 10,0 dedans
côté joueur) passe au vert pour la bonne raison.

Pire écart au sol, ΔE76 sur les huit tons contre 1,6 million de pixels de sol :

| camp | avant | après |
|---|---|---|
| joueur | 22,1 | **30,4** (+38 %) |
| Ouvrage | 30,5 | **41,5** (+36 %) |

### 2.2 Le facteur est DEUX, et le nombre se change seul

Mesuré aussi à ×1,5, ×2,5 et ×3, à teinte et clarté constantes :

| facteur | pire ΔE joueur | pire ΔE Ouvrage |
|---|---|---|
| ×1 (avant) | 22,1 | 30,5 |
| ×1,5 | 26,9 | 36,8 |
| **×2** | **30,4** | **41,5** |
| ×2,5 | 33,7 | 42,0 |
| ×3 | 36,9 | 42,4 |

Le gain s'essouffle après ×2 côté Ouvrage — **+11,0 de ×1 à ×2, +0,5 ensuite** —
et côté joueur ×2,5 fait sortir le kaki de sa famille : sa chroma passe à 45 et le
ton clair vire à l'herbe, là où Ethan demande un treillis. **Deux est le premier
facteur où la couleur se NOMME et le dernier où elle reste kaki.**
`rapports/lotLIMITES-VIVES-rampes-sur-le-sol.png` pose les six rampes sur un vrai
morceau de sol satellite : ×1, ×2 et ×2,5 pour chaque camp, dans cet ordre.

**Si Ethan le veut plus vif, c'est une ligne** — `RAMPES` dans
`tools/limites.py`, et le tableau de `FICHE-STYLE.md` qui doit suivre.

### 2.3 La fiche a suivi, elle n'a pas été contournée

⚠⚠ `FICHE-STYLE.md` fait autorité sur le style et sa §3 dit « aucune teinte hors
de cette liste ». Les huit tons y entrent sous leur propre titre — **Frontières de
territoire — kaki vif et violet vif** — avec la date, la phrase d'Ethan et la
mesure. Les produire dans `tools/limites.py` sans les y écrire aurait laissé la
fiche mentir, et le lot suivant les aurait « corrigés » vers la rampe des
châssis. La palette passe de **trente-trois à quarante-et-une teintes**, et c'est
son premier élargissement depuis la v4 de la fiche (27/08).

⚠ **LE PRIX EST DÉCLARÉ : la garde de palette de `banc.test.js` s'élargit de huit
teintes.** Elle balaie `src/render/`, `src/ui/` et la feuille, et refuse toute
couleur hors de la fiche ; huit tons de plus dans la fiche, c'est huit tons de
plus autorisés dans le code. **Aucun des huit n'y est employé aujourd'hui** — ils
ne vivent que dans les pixels des sprites. C'est le prix de les avoir écrits là
où on les cherchera.

⚠⚠ **ET UN TON ÉCARTÉ NE SE CITE PLUS EN PROSE DANS LA FICHE.** Le premier jet de
la section nommait la valeur essayée à ×2,5 pour dire qu'on l'écarte : les deux
gardes comptent les teintes au motif `#` suivi de six chiffres, et la fiche est
passée à **quarante-deux**. Une valeur écartée serait donc entrée dans la palette
et serait devenue autorisée dans la feuille de style. La prose la décrit
désormais sans l'écrire, et la fiche porte l'avertissement. **C'est la septième
fois du dépôt qu'une garde lit ce qu'on a écrit à son sujet** — mais prise à
l'endroit cette fois : c'est le TEXTE qui a été corrigé, pas la garde, parce que
la garde a raison — tout hex écrit dans la fiche EST dans la palette, c'est sa
définition.

---

## 3. Le sol se mesure, il ne se déclare plus

`tools/sols.py` écrit désormais dans `art/sprites/sol/sol-empreintes.json` les
quantiles de clarté des huit planches **alignées** :

```json
"clarte": { "p1": 50.72, "p5": 54.96, "p50": 64.54, "p95": 74.24, "p99": 77.97 }
```

⚠ **Node n'a pas de décodeur WebP** : sans ces nombres, la suite ne peut rien dire
du sol qui est vraiment à l'écran. Même motif que les autres champs du manifeste,
et que `fond-empreintes.json`.

⚠ **Ce sont des QUANTILES, pas un minimum et un maximum.** Sur 12,6 millions de
pixels, les extrêmes ne décrivent rien — quelques pixels très sombres au fond
d'une fracture ne disent pas contre quoi la frontière se lit.

⚠ **La clarté se mesure sur les planches ALIGNÉES**, pas sur les sources :
l'alignement des moyennes déplace chaque planche de plusieurs niveaux, et c'est
la planche alignée que le joueur a sous les yeux.

⚠ **Les huit `.webp` sont identiques à l'octet** — seul le JSON change. C'est la
mesure qui dit que l'encodage n'a pas bougé.

### 3.1 La garde de T8 change de référence, et la grandeur devient SIGNÉE

`LIMITE T8` exigeait « au moins 8 de clarté d'écart au sol », en valeur absolue et
contre `TERRAIN_CARTE.rampes`. Elle exige désormais que **chaque ton soit au moins
5 clartés SOUS le p5 du sol mesuré**. Deux changements, deux raisons :

- **la référence** : la rampe déclarée n'est plus le sol ;
- **le signe** : un écart en valeur absolue serait tenu par un ton PLUS CLAIR que
  le sol — c'est le cas de l'ancien gris-bleu de l'Ouvrage — et sur un sol dont le
  p95 vaut 74,2, aucun ton lisible n'est atteignable par le haut en sRGB.

Pire des huit tons : le kaki de rang 4, à **7,1** sous le p5. La borne est à 5.

⚠ **Et elle n'est pas vacueuse** : les deux tons qui ont fait le premier rapport
d'Ethan la franchissent encore. `#CD6F26` est à 1,6 seulement sous le p5, et
`#9FB3C5` est AU-DESSUS du sol, donc pris par le signe.

### 3.2 Une garde neuve mesure « assez vif », qui n'était mesuré par rien

C'est la moitié de l'arbitrage qu'aucune assertion ne couvrait. `LIMITE T8` exige
maintenant, ton par ton, contre la rampe de camp de même rang lue dans la fiche :

- **clarté identique à 0,3 près** ;
- **teinte identique à 3° près**, là où elle veut dire quelque chose ;
- **chroma au moins 1,8 fois** celle du ton de camp.

⚠ **LA TEINTE NE SE COMPARE QUE LÀ OÙ ELLE EXISTE.** Le rang 1 des deux rampes de
camp est presque neutre — chroma 3,9 côté kaki, 3,7 côté ardoise — et la teinte
d'un ton neutre est du bruit : `#161914` rend 133° quand les trois autres tons du
kaki rendent 125°. Exiger l'égalité là aurait fait tomber la garde sur une rampe
parfaitement juste ; le seuil est celui sous lequel la mesure cesse de vouloir
dire quelque chose. **La moitié qui reste est mesurée autrement** : la rampe de
frontière doit avoir une teinte à elle, constante sur ses quatre rangs à 3° près.

---

## 4. Ce qui entre dans le code

| fichier | ce qui change |
|---|---|
| `tools/limites.py` | `RAMPES` avivées ; `composer_pointe` et `assert_pointe` entrent ; le paragraphe sur `angle_l` est réécrit |
| `tools/atlas.py` | l'effectif de `limite` passe de 26 à 34 |
| `tools/sols.py` | les quantiles de clarté entrent au manifeste |
| `src/sim/territoire.js` | `bordsDuTerritoire` rend `rentrants` et retient les cases qui n'ont qu'un sommet |
| `src/render/limite.js` | `COINS` entre ; `spritesDeLaLimite` ajoute les pointes après les bandes |
| `FICHE-STYLE.md` | la section des deux rampes de frontière |
| `CLAUDE.md` | §0, §2, et le paragraphe de palette |

⚠ **`src/ui/monde.js` N'A PAS CHANGÉ D'UN CARACTÈRE**, et c'est la mesure du bon
découpage : l'écran passe l'objet de bord entier à `dessinerLimiteDUneCase`, donc
un champ de plus le traverse sans qu'une ligne bouge. La géométrie vit dans
`render/`, comme la garde de `monde.test.js` l'exige depuis RETOURS-DU-31.

⚠ **`pointe` n'est PAS dans `FORMES`.** Les quatre formes de la planche se
découpent, se normalisent, se détourent et se recolorisent ; celle-ci se compose.
Lui donner une entrée aurait obligé la boucle principale à savoir laquelle de ses
cinq entrées n'a pas de cellule — un cas particulier nommé à la main dans la
boucle qu'on veut garder uniforme.

⚠ **Son orientation de base est le coin nord-est, comme `coin`**, et les deux
familles se nomment par les mêmes suffixes : `coin_es` porte l'angle SORTANT du
coin sud-est, `pointe_es` son angle RENTRANT. Un seul jeu de suffixes à retenir,
et `tourner_cotes` les fait tourner ensemble.

⚠ **Un appelant sans `rentrants` ne lève pas** : il rend ses bandes et rien de
plus. Un montage de test ancien continue de marcher.

---

## 5. Coût, poste par poste

Mesuré contre un livrable **rebâti depuis `origin/main`** dans un `git worktree`.

| poste | avant | après | écart |
|---|---|---|---|
| **total** | 8 991 743 | **8 995 675** | **+3 932** |
| images (base64) | — | — | **+3 492** |
| JavaScript | — | — | **+440** |
| audio | — | — | 0 |
| feuille | — | — | 0 |
| balisage | — | — | 0 |

**296 `data:` avant, 296 après** — aucune ressource n'entre au livrable. Les
+3 492 octets sont l'atlas `limite`, qui passe de **10 472 à 13 092 octets** en
gagnant huit cellules ; sa grille passe de 6 × 5 à **6 × 6**.

⚠ **Borne T10 INCHANGÉE à 9 300 000**, marge **304 325 octets, 3,27 %**. Aucune
image n'entre : ce sont les mêmes vingt-six dessins recolorisés, plus huit carrés
de deux pixels de côté.

⚠ **L'atlas grossit alors que les tons s'assombrissent peu** : le WebP q85
compresse moins bien huit tons chromatiques que huit tons presque neutres. C'est
le mouvement inverse de celui du lot ARMÉE-ET-FRONTIÈRE, qui avait RENDU 11 608
octets en désaturant.

---

## 6. Treize falsifications, treize chutes

| # | falsification | ce qui tombe |
|---|---|---|
| F1 | le motif d'onglet inversé (clair au fond) | **l'outil LÈVE** (`assert_pointe`) + 4 tests |
| F2 | la pointe déborde de son carré (épaisseur 3) | **l'outil LÈVE** + 4 tests |
| F3 | rotation dans le mauvais sens (`+k`) | **l'outil LÈVE** + 4 tests |
| F4 | le sommet rentrant ne regarde plus la diagonale | 1 test |
| F5 | seules les cases à côté exposé entrent dans la liste | 1 test |
| F6 | les pointes rendues AVANT les bandes | 1 test |
| F7 | le manifeste du sol perd sa clarté | 1 test |
| F8 | la chroma remise à ×1 (fiche ET outil) | `LIMITE T8` — *« la frontière n'est plus assez vive »* |
| F9 | une pointe fautive qui ATTEINT le dépôt | `LIMITE T10` |
| F10 | les rampes des deux camps échangées | `LIMITE T8` |
| F11 | un sprite modifié sans recoudre l'atlas | `sprite — l'atlas cousu répond des sprites d'aujourd'hui` |
| F12 | le rendu ignore les sommets rentrants | 3 tests |
| F13 | le suffixe d'un coin écrit à l'envers (`en`) | 3 tests |

⚠⚠ **F1 À F3 SONT ATTRAPÉES PAR LE PRODUCTEUR, PAS PAR LA SUITE JS, ET C'EST LE
BON ENDROIT.** `assert_pointe` lève à la production : le sprite fautif n'atteint
jamais le dépôt, exactement comme `assert_bord` le fait depuis le lot TERRITOIRE.
Les quatre tests JS qui tombent ensuite ne tombent que parce que les fichiers
manquent — ce n'est pas la propriété qu'ils mesurent, et il fallait le dire.

⚠⚠ **D'OÙ F9, QUI EST LA CONTRE-ÉPREUVE.** On écrit à la main une pointe dont les
deux tons sont permutés, sans passer par l'outil, et on regarde qui la voit :
**`LIMITE T8` ne la voit PAS** — elle compare l'ENSEMBLE des tons, que la
permutation ne change pas —, **`LIMITE T10` la voit**, parce qu'elle rend le U et
nomme le pixel du sommet. C'est la même leçon que la garde du rangement par clarté
du lot ARMÉE-ET-FRONTIÈRE, à un lot d'intervalle.

⚠ **ET UNE GARDE EXISTANTE A MORDU POUR DE BON PENDANT LE LOT**, sans qu'on la
provoque : `tools/atlas.py` refuse de coudre une famille dont l'effectif ne
correspond pas à sa table — « limite/64 porte 34 sprites cousables, 26 attendus ».
Elle a forcé à écrire le nouveau compte et à relire l'index produit.

---

## 7. Relevé à l'écran, dans Chromium

360 × 780 à dpr 3, sur le livrable du lot.

- La carte s'ouvre, **zéro erreur de page**, l'atlas `monde-limites` décode en
  768 × 768 (6 × 6 cellules de 128), les huit `sol-*` en 1 254 × 1 254.
- `drawImage` instrumenté : **203 poses depuis l'atlas des limites** par image, à
  tous les crans de zoom.
- L'octogone du joueur — `rapports/lotLIMITES-VIVES-octogone-avant-apres.png`,
  avant à gauche, après à droite : **les quatre épaules sont fermées après et
  trouées avant**, et la frontière se lit VERTE là où elle se lisait noire.
- La frontière de l'Ouvrage —
  `rapports/lotLIMITES-VIVES-frontiere-ouvrage.png` : un trait violet franc sur
  la terre cuite, ses sommets rentrants fermés.

⚠ **CE N'EST PAS L'APPAREIL D'ETHAN**, et §3 de `CLAUDE.md` veut qu'on le dise :
un test appareil non exécuté se déclare non exécuté.

⚠ **AU CRAN LE PLUS LARGE, LA BANDE CLAIRE FAIT MOINS D'UN PIXEL.** Une case y
vaut 11 px CSS, donc la bande de 2 pixels logiques vaut 2/32 × 33 ≈ 2 pixels
physiques, dont un seul pour le ton clair. La frontière y lit surtout son ton
sombre — encore vert, mais peu. Aux trois autres crans (21, 43 et 85 px CSS) elle
porte ses deux tons. **Ce n'est pas un défaut de ce lot** : c'est la géométrie du
zoom, et elle était la même avant.

---

## 8. Chaîne et comptes

- `python3 tools/verifier.py` → **1 431 identiques · 0 différent · 0 nouveau ·
  0 MANQUANT**, verdict VERT, en **415,5 s**. Il était **dû** : le lot touche
  `art/` et `tools/`. **Le compte passe de 1 415 à 1 431** — les seize pointes, et
  rien d'autre. Lancé sur l'arbre FINAL, une fois les treize falsifications
  défaites — « ne jamais le lancer sur un arbre qu'on modifie ».
- Son second verdict tient aussi : « la chaîne lit exactement les sources
  déclarées », **378 / 378** et **95 / 95**, `art/sourcesstandby/` 34 fichiers,
  **0 lu**.
- `art/sources/` : **inchangé**, 378 consommées · 95 dormantes · 473 fichiers.
  Aucune source n'entre, le zip étant celui du 03/09 à l'octet.
- `art/sprites/limite/` : **26 → 34 fichiers par grille**, soit 68 en tout aux
  deux grilles.
- **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 24.** Pas un champ n'entre dans
  l'état : `rentrants` est calculé par `bordsDuTerritoire`, qui ne stocke rien, et
  une couleur de frontière est un dessin.

### Le compte de tests

**1094 → 1096.** Deux tests entrent : `LIMITE T9` (le sommet rentrant se lit sur
la diagonale) et `LIMITE T10` (le U se ferme, rendu et mesuré au pixel).

⚠ **AUCUNE ASSERTION N'A ÉTÉ RETIRÉE NI ASSOUPLIE.** Quatre gardes existantes
changent de cible, chacune en écrivant pourquoi, et **trois d'entre elles se
resserrent** :

- `LIMITE T1` balaie **256 cas au lieu de 16** — les côtés et les sommets sont
  deux axes indépendants — et exige 34 cellules au lieu de 26 ;
- `LIMITE T4` accepte le nom `pointe` et exige d'elle qu'elle ne porte **aucune**
  ligne logique pleine, ce qui est sa définition ;
- `LIMITE T8` change de référence de sol et gagne la mesure de la chroma ;
- `territoire — les côtés exposés sont ceux de l'OCTOGONE` distingue désormais
  **12 cases à côté exposé** et **16 entrées**, les quatre autres étant les
  sommets rentrants de l'octogone ; et son assertion sur la diagonale intérieure
  porte sur les CÔTÉS au lieu de l'absence de la case.

⚠ **Le décodeur de nombres français de `documentation.test.js` apprend « une ».**
Il se disait capable d'aller « de un à quatre-vingt-dix-neuf » et ne savait pas
lire « quarante-et-une », le féminin qu'exige le mot « teintes » : il rendait
`null`, donc la garde serait tombée sur du vrai.

---

## 9. Ce qui reste ouvert

- **Le facteur de chroma est une proposition.** ×2 est mesuré et justifié ; ×2,5
  et ×3 sont mesurés aussi. Un nombre se change seul, **Ethan tranche**.
- **`angle_l` reste non produit.** C'est un angle SORTANT à la médiane ; il
  n'aurait d'emploi que dans un modèle par SOMMET, où une case pourrait être à
  moitié dans un territoire. Sa cellule reste dans la planche, qui ne s'ampute
  pas.
- **Le fond Ouvrage de la carte reste retiré**, sur demande du 05/09 (« pas de
  fond ouvrage pour le moment »). Ce que le joueur lit du camp d'une zone, il ne
  le lit que dans ces frontières — ce qui rend ce lot-ci plus important qu'il n'y
  paraît, et c'est une raison de plus de les avoir avivées.
