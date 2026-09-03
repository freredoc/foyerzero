# RAPPORT — lot CONTOUR-ET-ÉTIQUETTES

**Version produite : 0.80.0 · build 82.** `npm run check` → **969 pass / 0 fail**,
`dist/index.html` **3 345 467 octets**, 0 référence externe, **25 `data:` avant,
25 après**. Borne T10 inchangée à 3 400 000, marge **54 533 octets, 1,60 %**.

Base de départ : `648e219` sur `main` (merge de la PR #71), **967 pass / 0 fail**,
3 343 043 octets — relevé avant d'écrire une ligne.

---

## 0. Ce qui a été demandé, et ce qui a été livré

Ethan, 03/09 au soir, sur quatre captures :

1. « le halo doit coller la base, faire son coutour et "clignoter" »
2. « rajouter un petit nom sur fond semi opaque + niveau en dessous de chaque
   entité de la carte »
3. « repartir les unités de l'armée en quinconce comme sur le screen pour
   utiliser toute la place »

Les trois sont faits. Un **quatrième défaut**, que personne n'avait demandé et
qu'aucun test ne pouvait voir, a été trouvé au boot sans tête pendant la
vérification du troisième — voir §3.

---

## 1. Le contour de la base

### Ce qui existait

`geometrieDuHalo` rendait un CERCLE de rayon `0,72 × case` centré sur la base, et
`dessinerHalo` le traçait **avant** les emblèmes. À 0,72 case, l'anneau flotte
autour sans rien toucher — c'est ce qu'on voit sur la troisième capture d'Ethan.

Le commentaire du code justifiait ce débordement : « un cercle inscrit dans la
case serait caché par l'emblème qui s'y dessine ». **C'était vrai** —
`dessinerEmblemeDUneCase` rend `cote: taille`, donc l'emblème couvre la case
ENTIÈRE. Mais la conclusion ne l'était pas : la réponse n'est pas de déborder,
c'est de passer AU-DESSUS.

### Ce qui a été fait

- `geometrieDuHalo` rend `{ x, y, cote, epaisseur }` — le rectangle de la case.
- Le trait **rentre d'une demi-épaisseur**. Un `strokeRect` centre son trait sur
  le chemin : posé sur le bord exact, la moitié mordrait sur les quatre
  voisines, et **deux bases du joueur adjacentes — ce que BASES-1 autorise — se
  toucheraient par leur halo**.
- `dessinerHalo` passe **après** la boucle des emblèmes, comme la flèche. Les
  frontières, elles, restent dessous : elles ceignent des cases qui n'ont pas
  toutes un emblème, et couper le dessin qui dit ce qu'il y a là est ce que le
  lot TERRITOIRE refuse.

### Le clignotement, sans horloge

`maintenantMs` est la **seule** lectrice du temps mural de tout `src/`, et la
garde §11 de `banc.test.js` en exige EXACTEMENT une, dans `ui/session.js` : une
seconde ici aurait fait tomber la suite. Le clignotement compte donc les appels
que la session fait déjà — `boucle()` les cadence à `>= 100` ms —, d'où
`PERIODE_HALO_TICKS = 10` : **une seconde allumé, une seconde éteint**.

`haloAllumeAuTick(tick)` est **pure**, donc mesurable sans navigateur — le dépôt
n'a ni jsdom ni navigateur (§3), et la géométrie du halo a déjà payé une fois
d'être écrite dans la boucle de rendu (le `drawImage` aux rectangles non finis
du lot RETOURS-DU-31).

⚠ **On ne redessine qu'aux DEUX bascules**, pas à chaque appel : repeindre dix
fois par seconde donnerait une image identique neuf fois sur dix, ce que le
commentaire de `rafraichir` existe précisément pour éviter.

### Mesuré dans Chromium

Quatre clichés à 520 ms d'écart, viewport 360 × 800, dpr 3, recentré sur la base :

| cliché | pixels d'os | verdict |
|---|---|---|
| 1 | 19 195 | allumé |
| 2 | **315** | éteint |
| 3 | 19 195 | allumé |
| 4 | 19 195 | allumé |

Les 315 du cliché 2 sont le texte de l'étiquette, pas le cadre. `strokeRect` est
appelé **2 fois en 2 secondes**. Le cadre épouse exactement la case.

---

## 2. Les étiquettes de la carte

### C'est un retour sur l'arbitrage du 30/08, et il se lit dans ce sens-là

Ce qui avait été retiré ce jour-là — « on enlève les lettres quoi qu'il
arrive » — était la **LETTRE** : une capitale peinte SUR l'emblème, qu'il fallait
décoder. Ce qui revient est un **NOM en toutes lettres**, posé SOUS la case, avec
son niveau.

**`CSS_MINI_LETTRE` ne reparaît pas, et le champ `lettre` n'est toujours lu par
aucun écran.** Les deux gardes qui les surveillent sont intactes.

### Le seuil est mesuré sur la DENSITÉ

Fenêtre de 360 × 512 px CSS, vingt graines, fenêtres centrées sur les rangées
250, 150 et 50 :

| px CSS / case | cases à l'écran | sites à l'écran |
|---|---|---|
| 10,7 | 1 632 | **296** |
| 21,3 | 408 | **98** |
| 42,7 | 108 | **33** |
| 85,3 | 30 | **13** |

À 33 sites les plaques se recouvrent — c'est la deuxième capture d'Ethan. À 13
elles ne se touchent pas : mesuré sur trente graines, **88 % des sites ont leur
plus proche voisin à DEUX cases (170 px CSS) et 8,4 % à une seule (85)**, quand
« Base de l'Ouvrage » fait une soixantaine de pixels.

D'où `cssMiniParCase: 64`. ⚠ **En pixels CSS et non en crans** : les crans de
`ZOOM_CARTE` sont en pixels PHYSIQUES, donc le même cran n'a pas la même taille
apparente à densité d'écran différente.

### `ETIQUETTE_CARTE` vit dans `data/sites.js`, et c'est une garde qui l'a exigé

La première écriture posait les trois nombres dans `ui/monde.js`. La garde
« l'écran ne nomme aucune constante de grille ni de zoom en dur » est **tombée
dessus** : le seuil valait 64, et 64 est aussi un cran de zoom. Elle avait raison
pour une raison qu'elle ne connaissait pas — un seuil d'affichage est du
calibrage, et §4 les veut tous dans `src/data/`.

### Trois lectures qui tiennent en une ligne chacune

- **Le nom vient d'`EMBLEMES_CARTE`**, déjà source du titre du panneau de site :
  l'étiquette et le panneau ne peuvent pas se contredire.
- **Le fond semi-opaque est `PALETTE.ombrePortee`, LU dans `render/scene.js`**,
  pas retapé. La garde de palette n'en tolère qu'un dans tout le dépôt —
  « fond semi opaque » n'a donc qu'une écriture possible.
- **La base du joueur n'a pas de ligne de niveau.** Elle en a TROIS —
  bâtiments, défense, armée — et aucun ne vient de sa rangée ; y écrire le
  niveau de la rangée 295 serait la faute que `sim/carte.js` existe pour
  empêcher. Vérifié à l'écran : sa plaque dit « Votre base », une seule ligne.

### L'interdiction de `fillText` nomme une seconde exception

Elle était totale hors de `dessinerFleche` depuis le lot DÉPLACEMENT. Elle l'est
désormais hors de `dessinerFleche` **et** `dessinerEtiquette`. **Une lettre ne
peut toujours pas revenir sur un emblème** — c'est ce que la version large
protégeait, et rien n'en est perdu.

### Mesuré dans Chromium

Au cran de 85 px/case : **90 appels à `fillText` en 2,5 s**, textes
« Base de l'Ouvrage » / « Niveau 7 », « Niveau 6 »… Au cran de 11 px/case :
**zéro**.

---

## 3. Les quatre vagues de l'Offense

### Le défaut qu'Ethan voyait sans le nommer

Avant toute modification, mesuré dans Chromium à 360 px CSS, dpr 3 :

```
première case  15,5 px      ← la moitié des autres
cases 2 à 9    34 px
bord droit     37 px perdus
```

`grid-column: span 2` est le **raccourci** de `grid-column-start: span 2` +
`grid-column-end: auto`. La règle suivante posait `grid-column-start: 1`, ce qui
écrasait le `span 2` du START et laissait le END à `auto` — donc **UNE** colonne.

C'est visible sur les deux captures d'Ethan : dans chaque vague, la case de
gauche est plus étroite. Le lot OFFENSE l'a introduit le 03/09 au matin.

Après correction (`grid-column: 1 / span 2`) : **neuf cases de 34 px, de x = 6 à
x = 336**, et la demi-colonne qui reste EST le décalage du quinconce, comme la
feuille l'annonçait depuis le début.

⚠ **Aucun test ne pouvait le voir** : la garde du quinconce cherchait
`grid-column-start: 2`, c'est-à-dire très exactement la forme fautive. Elle exige
désormais la position ET la portée.

### La répartition verticale

Mesuré avant : les quatre rangées tenaient dans les **218 premiers pixels d'un
bassin de 474**. Après `justify-content: space-between` :

```
vague 1   6 → 53
vague 2 144 → 191
vague 3 283 → 330
vague 4 421 → 468
```

⚠ **L'autre lecture d'« utiliser toute la place » est écartée PAR LA MESURE**, pas
par goût. Laisser les cases GRANDIR en hauteur déformerait les sprites : `.piece`
prend `84 %` en largeur ET en hauteur, et un pourcentage se résout sur la largeur
du bloc pour l'une et sur sa hauteur pour l'autre. `aspect-ratio: 1` ne bouge
donc pas, et `flex: 0 0 auto` empêche une vague de se laisser écraser quand
l'écran est court — le bassin défile à la place.

⚠ **`gap: 8px` tient le minimum** : sur un écran court, `space-between` n'a plus
de mou à distribuer, et deux vagues collées se liraient comme une.

---

## 4. Falsifications — quinze, quinze chutes

| # | falsification | verdict |
|---|---|---|
| F1 | le contour redevient un cercle | ✓ |
| F2 | le contour ne clignote plus | ✓ |
| F3 | le contour repasse sous les emblèmes | **✗ puis ✓** |
| F4 | le clignotement redessine à chaque appel | ✓ |
| F5 | la base du joueur se voit inventer un niveau | ✓ |
| F6 | le seuil ouvre un cran trop dense (40) | ✓ |
| F7 | le seuil ferme tout (200) | ✓ |
| F8 | la plaque retape son `rgba` | ✓ |
| F9 | du texte hors des deux exceptions | ✓ |
| F10 | les vagues se recollent en haut | ✓ |
| F11 | les cases de l'Offense cessent d'être carrées | **✗ puis ✓** |
| F12 | la case demi-largeur revient | ✓ |
| F13 | la rangée décalée perd sa portée | ✓ (2 rouges) |
| F14 | une vague se laisse écraser | ✓ |
| F15 | la pièce de l'Offense se mesure en pixels | **✗ puis ✓** |

⚠⚠ **F3 NE MORDAIT PAS, ET C'EST LA GARDE QUI MANQUAIT.** Remettre `dessinerHalo`
avant les emblèmes fait **disparaître le contour de l'écran**, et la suite restait
ENTIÈREMENT VERTE. Un test lit maintenant le corps de `dessiner` et exige que
contour, étiquettes et flèche viennent après les emblèmes — et que les frontières
restent AVANT, elles. ⚠ Il lit le corps de la fonction, pas le module entier :
comparer deux `indexOf` sur tout le fichier ferait tomber la garde le jour où une
déclaration remonte, ce que le dépôt a payé au lot GARNISON-ET-ARMÉE.

⚠ **F11 ET F15 NE MORDAIENT PAS PARCE QUE MES FALSIFICATIONS VISAIENT LE MAUVAIS
BLOC.** Le Chantier porte les mêmes `aspect-ratio: 1` et `--jeton-part: 84 %` que
l'Offense : mon `replace` touchait sa règle à lui. Refaites en bornant le
remplacement au bloc de l'Offense, les deux tombent. **Une falsification qui ne
mord pas se vérifie avant d'être crue** — sans cela, deux gardes justes auraient
été déclarées inertes.

---

## 5. Fichiers touchés

| fichier | ce qui change |
|---|---|
| `src/data/sites.js` | `ETIQUETTE_CARTE` — seuil, police, encre |
| `src/ui/monde.js` | contour rectangulaire, clignotement, étiquettes, ordre du dessin |
| `src/index.src.html` | vagues réparties, portée du premier emplacement |
| `test/monde.test.js` | 1 test entrant, 2 gardes resserrées (`fillText`, ordre) |
| `test/offense.test.js` | 1 test entrant, 1 garde resserrée (quinconce) |
| `test/deplacement.test.js` | géométrie du halo retournée, clignotement asserté |
| `CLAUDE.md` | §0 |
| `package.json` | 0.79.0 · 81 → 0.80.0 · 82 |

**Deux tests entrent, le compte passe de 967 à 969.** Trois gardes existantes
sont RESSERRÉES sans perdre une assertion.

`SAVE_VERSION` **ne bouge pas et reste à 24** : aucun champ n'entre dans l'état —
un cadre, deux lignes de texte et une répartition verticale.

`python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot ne
touche ni `art/`, ni `tools/`. Pas un octet de `art/sprites/` ne change.

---

## 6. Ce qui reste ouvert

- **La longueur des noms.** « Base de l'Ouvrage » fait une soixantaine de pixels
  sous une case de 85 : ça tient, mais de peu. Si Ethan trouve la carte chargée,
  le levier est `ETIQUETTE_CARTE.cssMiniParCase` (monter le seuil) ou un nom
  court dans `EMBLEMES_CARTE` — **pas** la lettre, qui a été retirée par
  arbitrage.
- **Le clignotement s'applique à la seule base COURANTE.** Avec plusieurs bases,
  c'est celle qui attaque qui clignote — haloter et basculer sont le même geste
  depuis BASES-1. Inchangé par ce lot.
- **Comment le joueur choisit le niveau d'une pièce** reste non arbitré (voir le
  rapport du lot ARMÉE-ET-FRONTIÈRE).
