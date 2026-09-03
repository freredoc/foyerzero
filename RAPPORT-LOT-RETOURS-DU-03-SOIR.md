# RAPPORT — lot RETOURS-DU-03-SOIR

**Date** : 03/09/2026
**Branche** : `claude/sprite-refonte-9il369`
**Version produite** : **0.77.0 · build 79**
**Livrable** : `dist/index.html`, **3 350 987 octets**, 0 référence externe
**Suite** : `npm run check` → **964 pass / 0 fail**

---

## 0. Ce qui a été demandé

Trois messages d'Ethan, le 03/09 au soir, captures à l'appui :

1. « remplir les murs jusqu'en bas et rajouter tuiles terrain afin de remplir
   l'ui. purement decoratif »
2. « fix des emblèmes de la carte »
3. « juste avant : eparpille les poi. jamais 2 poi collé, au moins 4 cases
   d'ecart »

Les trois sont traités dans un seul lot. **Un seul des quatre gestes touche la
simulation** — l'espacement des POI —, et c'est mesuré au §6.

---

## 1. Le coût, mesuré

| | avant | après |
|---|---|---|
| `dist/index.html` | 3 348 704 o | **3 350 987 o** |
| `data:image` inlinés | 25 | **25** |
| tests | 960 | **964** |

**+2 283 octets**, et **aucune image n'entre**. La borne T10 reste à
**3 400 000** — marge **49 013 octets, 1,46 %**. C'est la marge la plus mince
depuis BASES-1, et le prochain lot qui fait entrer une image devra la relever
en écrivant pourquoi. Une borne ne se baisse pas pour faire passer un lot.

Détail : le sol décoratif coûte **0 octet d'image** (il réemploie
`--atlas-sol`, inliné depuis le lot SPRITES-ET-ZOOM), les murs jusqu'en bas
**0 octet d'image** (les six mêmes dessins), et l'espacement des POI **126
octets** de code.

---

## 2. Les emblèmes de la carte — un défaut du lot GRILLE-128

### Le défaut, reproduit avant d'être corrigé

Sur la capture d'Ethan, les forteresses de l'Ouvrage apparaissaient comme des
rectangles kaki tronqués au lieu de leur dessin. `src/render/embleme.js`
calcule le rectangle source **en pixels** et lisait le côté de cellule dans
`ZOOM_CARTE.grilleEmbleme`, resté à **64** quand le lot GRILLE-128 a fait
passer l'atlas embarqué à **128**.

**Mesuré, pas déduit** : la cellule (2, 2) de `site_base_o_n1` était lue
`(sx, sy, sCote) = (128, 128, 64)`, c'est-à-dire **le quart haut-gauche de la
cellule (1, 1)** — le sprite du voisin, `site_base_j_n2`, amputé aux trois
quarts.

⚠⚠ **ET LE RAPPORT DE GRILLE-128 ANNONÇAIT LE CONTRAIRE.** Il écrivait « tout
le reste suit — `src/render/sprite.js` calcule en POURCENTAGES, donc il est
sans échelle ». C'est vrai de `sprite.js` et **faux de `embleme.js`**. Une
phrase de rapport qui généralise un module à tout un dossier est exactement le
genre d'affirmation que ce dépôt paye plus tard.

### Le correctif : on retire la donnée, on ne la corrige pas

`ZOOM_CARTE.grilleEmbleme` est **RETIRÉE**. La remettre à 128 aurait laissé
**deux vérités pour la grille de couture**, dont une seule est écrite par
l'outil : `COTE_SPRITE` de `src/data/atlas.js` est GÉNÉRÉ par
`tools/atlas.py`, l'autre était recopiée à la main. `src/data/sites.js` garde à
sa place un commentaire qui dit de ne pas la recréer.

### La garde mesurait un proxy — troisième fois du dépôt

`test/monde.test.js` figeait `ZOOM_CARTE.grilleEmbleme === 64` : vrai, et sans
rapport avec ce qu'elle défendait. Elle lit désormais les **deux** côtés —
le rectangle source rendu vaut `COTE_SPRITE`, et les cellules d'emblème
**pavent** la largeur et la hauteur de l'atlas —, plus une ligne de
falsifiabilité. Même leçon que `ZOOM_BASE_MULTIPLE_MAX` au lot GRILLE-128.

Un commentaire périmé de `src/ui/monde.js`, qui nommait encore
`grilleEmbleme`, a été RÉÉCRIT, pas enjambé.

---

## 3. Les murs jusqu'en bas — le troisième arbitrage sur la même ligne

`BANDE_DE_FIN_DU_CONTOUR` de `src/render/contour.js` passe de `'defense'` à
`'deploiement'`.

- 31/08, lot MURS : le U s'arrêtait au bord de la bande des bâtiments.
- 03/09 matin, lot MURS (suite) : « flanc sur la défense aussi ».
- 03/09 soir : « remplir les murs jusqu'en bas ».

**41 pièces d'anneau au lieu de 37**, flancs de **17 à 19 lignes**, et **zéro
image de plus** — ce sont les mêmes six dessins. Le bas du U reste **OUVERT** :
c'est par là que l'assaut arrive, et le fermer serait un changement de règle
que personne n'a demandé.

### Ça ne coûte aucune géométrie, et c'est mesuré

Les flancs vivent aux colonnes `0` et `largeur + 1`, que `calculerProjection`
réserve déjà depuis le lot MURS-OUVRAGE. Allonger un flanc ne prend donc **pas
une case de contenu** : mesuré sur cinq viewports, la taille de case ne bouge
pas d'un pixel.

### Une assertion déclarée inerte est tombée, exactement comme annoncé

Le lot MURS écrivait : « LE FLANC SE MESURE D'UN BORD À L'AUTRE, JAMAIS EN
ADDITIONNANT LES BANDES. Les deux formules coïncident aujourd'hui, les bandes
étant adjacentes — donc cette falsification-là ne mord pas, et elle se
déclare. » Le lot en ajoute une **troisième** : les deux formules divergent, la
garde mord, et elle devient **ACTIVE** dans `test/chantier.test.js` et
`test/contour.test.js`, avec un `assert.notEqual` sur la somme naïve des deux
bandes.

### Une seconde garde mesurait un proxy

`lignesHorsDuU > 0` ne disait rien de l'endroit où le U s'arrête. La garde
nomme désormais la propriété : **aucune pièce à la ligne `haut + 1 + nbLignes`
ni en dessous**, et une falsification prouve qu'elle la voit.

---

## 4. Le sol décoratif — zéro image, zéro couleur

`#chantier-defile` porte `var(--atlas-sol)` en `repeat`. C'est le **même
atlas** que les cases, déjà inliné depuis le lot SPRITES-ET-ZOOM :
**25 `data:` avant, 25 après**, et aucune teinte n'entre — la palette fermée à
trente-trois teintes n'est pas touchée. Le noir `#161914` de
`#chantier-champ` reste dessous, en repli.

⚠ **`background-attachment: local`, JAMAIS `scroll`.** Le champ DÉFILE : sous
`scroll` le sol resterait collé au cadre et glisserait sous la grille à chaque
mouvement du doigt.

⚠⚠ **L'ÉCHELLE SE DÉRIVE, ELLE NE S'ÉCRIT PAS.** Une case vaut
`ZOOM_CARTE.tuilesParCase` tuiles de l'atlas ; l'atlas entier vaut donc
`parAxe / tuilesParCase` = **8 cases**. `casesDeSolParAtlas(doc)` le calcule et
**LÈVE** si la division ne tombe pas juste. Les deux échelles — celle de la
case et celle du pavage — s'écrivent dans **la même fonction**,
`reglerCoteCase` : elles ne peuvent pas diverger au zoom. Écrire « 8 » dans la
feuille aurait donné un pavage juste au zoom par défaut et faux partout
ailleurs.

### La première garde du pavage NE MORDAIT PAS, et elle a été réécrite

Elle vérifiait que `casesDeSolParAtlas` dérive bien de la largeur de l'atlas,
qu'elle suit une image deux fois plus large, qu'elle LÈVE sur un atlas qui ne se
groupe pas en cases entières, et que les deux échelles s'écrivent dans la même
fonction. Tout cela est juste — **et remplacer `${borne * casesParAtlas}px` par
`${borne}px` la laissait VERTE.** Le motif aurait été huit fois trop serré, et
rien ne serait tombé : la garde nommait la PRÉSENCE de la ligne, pas le
FACTEUR. C'est le proxy que ce lot corrige déjà deux fois ailleurs, sur
`grilleEmbleme` et sur `lignesHorsDuU` — trouvé ici par la falsification, pas
par la relecture.

Elle lit désormais les deux gabarits `${…}px` dans `reglerCoteCase`, retrouve le
nom du facteur par `const <nom> = casesDeSolParAtlas(` — donc sans le recopier —
et exige trois choses : `--sol-pave` NOMME ce facteur, `--case-cote` ne le nomme
PAS, et `--sol-pave` repart de l'expression de `--case-cote`.

Deux tests entrent dans `test/chantier.test.js`.

---

## 5. L'espacement des POI

### La règle

`ECART_MINIMAL_POI = 4` dans `src/data/sites.js` ; `troppresDUnPoiPose` dans
`src/sim/poi.js`, branchée dans la boucle de rejet juste après
`caseLibrePourUnPoi`.

- **Au carré des deux côtés, jamais de racine** — doctrine EUCLIDE, et
  `src/sim/` s'interdit `Math.sqrt` de face.
- **Elle regarde TOUS les POI déjà posés**, pas seulement ceux de la bande : les
  bandes sont des paquets de rangées contigus, donc deux POI de bandes voisines
  peuvent se retrouver à deux rangées l'un de l'autre. C'est même le cas le plus
  fréquent.
- **O(n) sur soixante-dix poses** — 2 415 comparaisons d'entiers pour une carte
  entière. Un index spatial serait de l'ingénierie pour rien.

### Deux lectures, et celle qui a été retenue est écrite

« quatre cases d'écart » est lu comme une **distance** : deux POI à distance 4
laissent **trois** cases entre eux. L'autre lecture — quatre cases VIDES, donc
distance 5 — se prend en changeant ce seul nombre, **et elle passe encore les
gardes** : mesuré, le seuil 5 est vert ; c'est à partir de **6** que la garde de
marge avertit. Si Ethan voulait dire l'autre, c'est un chiffre à tourner.

### Le défaut, mesuré avant et après

Sur **300 graines** et **724 500 paires** :

| | paires sous 4 cases | distance minimale |
|---|---|---|
| avant | **3 534** (0,488 %) | **1,000** — deux POI côte à côte |
| après | **0** | **4,000** |

**Coût** : 0,463 → **0,546 ms** par carte complète (+18 %), une fois par partie,
mémoïsé.

### La métrique se discrimine, elle ne se suppose pas

Le minimum de **Tchebychev** observé vaut **3** : un carré de même rayon
refuserait des paires que la règle accepte (deux POI en diagonale à trois cases
de côté sont à 4,24 en Euclide). `POI T26` porte cette ligne, et elle est la
seule à tomber quand on troque la métrique.

### La marge d'essais se mesure sur la grandeur qu'elle défend

`POI T27` borne la **probabilité qu'une carte soit impossible** —
`(1 − p)^ESSAIS_MAX` — et non un « dix fois moins que le plafond », qui aurait
été un proxy de plus.

- `p = 0,135` au pire sur cinq graines ; **0,0945** sur trois cents (graine 157,
  bande 1), soit 10,6 essais espérés contre un plafond de 1 000.
- La séparation retire jusqu'à **34,3 %** des cases d'une bande.
- C'est la **garde du peuplement**, pas la séparation, qui serre la bande 1 :
  elle couvre les rangées du départ du joueur.

### Falsifications

| # | falsification | verdict |
|---|---|---|
| F1 | on retire l'appel (l'état d'avant le lot) | `POI T26` tombe |
| F2 | métrique de Tchebychev au lieu d'Euclide | `POI T26` tombe, **sur la ligne de la métrique** : « min Tchebychev 4 : la règle a cessé d'être euclidienne » |
| F3 | `troppresDUnPoiPose` rend toujours `false` | `POI T26` tombe |
| F4 | écart porté à 8 | `POI T27` tombe **sur la marge** : « p = 0,0013, soit 775,0 essais espérés et un risque de 2,75e-1 » |
| F5 | on retire l'appel | **le témoin de BASES-0 rougit** (3 tests) |

Et pour les trois autres gestes du lot :

| # | falsification | verdict |
|---|---|---|
| FA | `BANDE_DE_FIN_DU_CONTOUR` remis à `'defense'` | 2 tests tombent |
| FB | la cellule d'emblème redécoupée à 64 | 2 tests tombent |
| FC bis | `--sol-pave` réglé à la taille de la case | tombe : « --sol-pave vaut « borne » : le pavage ne multiplie plus par casesParAtlas » |
| FC ter | le facteur posé sur `--case-cote` | tombe |
| FC quater | le facteur écrit en dur, `borne * 8` | tombe : « --sol-pave vaut « borne * 8 » » |
| FD | `background-attachment: scroll` | tombe |

**Onze falsifications, onze chutes** — et une douzième, la première forme de la
garde du pavage, **ne mordait pas** : elle est déclarée au §4 et a été réécrite
plutôt que comptée.

⚠ **F4 se déclare avec son détail** : à un écart de **12** la carte devient
franchement impossible et `tirerLesPoi` LÈVE avant que la garde de marge ne
s'exprime. La garde a donc une **fenêtre d'avertissement réelle** — elle parle
de 6 à 11, avant que le tirage ne casse.

### Un commentaire devenu faux a été réécrit, pas enjambé

`partieSurLePoi`, dans `test/poi.test.js`, portait : « Deux POI peuvent se
toucher — rien ne l'interdit, ils ne s'excluent qu'à la case —, et le premier de
la carte de 4242 a effectivement un voisin à une case. » C'est faux depuis ce
lot. Le commentaire dit maintenant pourquoi la recherche d'un POI isolé reste
**nécessaire** : le montage demande un carré de Tchebychev de rayon 5, la règle
donne un disque euclidien de rayon 4, et les deux ne se recouvrent pas — sur la
graine 4242, **32 des 70 POI** passent.

---

## 6. Le témoin de BASES-0 — 21 couples déclarés sur 350

### L'attribution est mesurée

En retirant la **seule** ligne `troppresDUnPoiPose` du tirage — c'est-à-dire en
remettant exactement l'état d'avant le lot —, `test/bases.test.js` repasse
**30 pass / 0 fail**. Les vingt et un couples sont donc **tous** à l'espacement
des POI : les murs, le sol et les emblèmes n'atteignent pas le moteur, et ce
n'est pas une déduction, c'est une exécution.

### La chaîne se lit d'un bout à l'autre

Les POI changent de case → `poisAcquis` change dès la **phase 10**, qui est
celle où la base monte et acquiert ses premiers gisements → la **majoration de
production** change → `economie` bouge aux phases 13 et 14 → la sanction d'un
rasage détruit d'autres montants → `rapports` bouge → `recherche` bouge, le
point de recherche étant un solde. `satellites` suit pour une raison distincte
et écrite depuis le lot POI : **un satellite ne se pose jamais SUR un POI**,
donc déplacer les POI déplace l'ensemble des cases libres.

Les **neuf premières phases** — construction, économie, garnison, armée, et les
deux premiers raids — sont **identiques au bit**.

### Ce qui ne bouge pas est la moitié qui prouve

Sur les vingt-cinq graines, **zéro écart** sur : gestes de construction, gestes
d'armement, taille de la sauvegarde, cases atteignables, déplacement, nombre de
bases attaquantes, nombre de cibles du raid lointain, cible retenue, et **tout
le raid de proximité**. Le seul scalaire déplacé est l'empreinte du rapport du
raid lointain, **sur deux graines (4 et 6)** — d'où un bloc
`RAPPORTS_RETOURS_DU_03_SOIR` de deux lignes, plutôt qu'une surcharge des
vingt-cinq.

**Neuf graines sur vingt-cinq** gardent leur empreinte d'avant au bit — 1, 2, 3,
10, 11, 15, 19, 20 et 22 —, et elles restent donc gardées contre la valeur
précédente. Le bloc est **RECONSTRUIT** plutôt que complété : un couple revenu à
sa valeur d'avant sort du bloc au lieu d'y rester déclaré à tort.

---

## 7. `SAVE_VERSION` ne bouge pas, et reste à 24

`poisAcquis` range le couple `{ type, bande }` et **jamais une position** : un
POI déplacé reste le même POI. Il n'y a rien à migrer, et la sauvegarde ne
grandit pas d'un octet — le témoin le mesure sur les vingt-cinq graines.

C'est la différence avec le lot EUCLIDE, qui avait dû **vider** `sitesEntames`
et `poisAcquis` : ces deux-là désignaient la carte **par position**. Depuis le
lot POI, `poisAcquis` désigne par couple, et il traverse.

---

## 8. Fichiers touchés

**Production**

| Fichier | Ce qui change |
|---|---|
| `src/data/sites.js` | `ECART_MINIMAL_POI` entre ; `ZOOM_CARTE.grilleEmbleme` sort |
| `src/sim/poi.js` | `troppresDUnPoiPose`, branchée dans le tirage |
| `src/render/embleme.js` | le rectangle source se calcule sur `COTE_SPRITE` |
| `src/render/contour.js` | `BANDE_DE_FIN_DU_CONTOUR` → `'deploiement'` |
| `src/ui/chantier.js` | `casesDeSolParAtlas`, l'échelle du pavage |
| `src/ui/monde.js` | un commentaire périmé réécrit |
| `src/index.src.html` | le fond de `#chantier-defile` |
| `package.json` | 0.77.0 · build 79 (chaînes, pas des nombres) |

**Tests** — `test/poi.test.js` (+2), `test/chantier.test.js` (+2),
`test/monde.test.js`, `test/contour.test.js`, `test/bases.test.js`,
`test/temoins-bases-0.js`.

**Documentation** — `CLAUDE.md` §0, ce rapport.

---

## 9. Vérifications

- `npm run check` → **964 pass / 0 fail**, `dist/index.html` **3 350 987
  octets**, 0 référence externe.
- **Rendu sans tête, Chromium** : murs descendus jusqu'en bas, sol pavé sous la
  grille, forteresses violettes de l'Ouvrage à la place des rectangles kaki
  tronqués sur la carte du monde. **Zéro erreur de page.**
  ⚠ `playwright-core` s'installe **hors du dépôt** — `CLAUDE.md` §3 interdit
  d'ajouter une dépendance de test, et cette règle tient.
  ⚠ **CE RENDU PORTE SUR LE LIVRABLE D'AVANT L'ESPACEMENT DES POI, et il faut
  le dire.** Les trois gestes de dessin y étaient tous ; l'espacement est venu
  ensuite et ne touche **aucun chemin de dessin** — il déplace des positions que
  `ui/monde.js` lit sans les calculer. Le rendu n'a pas été refait après lui, et
  ce n'est donc pas un rendu vérifié de la version finale.
- `python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le
  lot ne touche ni `art/`, ni `tools/` — pas un octet de `art/sprites/` ne
  change. Son dernier verdict connu reste celui de MOULINETTE-TERRAIN :
  1 005 identiques · 0 différent · 0 nouveau · 0 MANQUANT.
- `tools/entrees.py --verifier` non lancé, même motif.

---

## 10. Points laissés en suspens

1. **La lecture de « 4 cases d'écart ».** Distance 4 (retenue) ou quatre cases
   vides, donc distance 5 ? Les deux passent les gardes. Un chiffre à tourner
   dans `src/data/sites.js` si Ethan voulait dire l'autre.
2. **Le code couleur des ressources et des frontières**, ouvert depuis les lots
   TERRITOIRE et MOULINETTE-TERRAIN : le quartz d'Ethan est violet et sa scorie
   noire à veines orange, là où `FICHE-STYLE.md` réserve `#9FB3C5`, `#C1CEDA` et
   `#382E47` ; les frontières de territoire sont or/ambre et gris-bleu pâle là
   où `TEINTES_TERRITOIRE` posait l'os et le rouge. **Trois arbitrages en
   attente, à rendre ensemble.**
3. **L'atlas du sol de la carte du monde** n'est pas passé au nouveau modèle, et
   c'est délibéré : c'est un INDEX à cinq teintes que `render/terrain.js` lit
   comme une carte de quintiles, pas une image quantifiée. Le passer au filtre
   remplacerait le moteur de rendu du fond de carte, et il faudrait d'abord
   arbitrer ce que devient le sol de l'Ouvrage.
4. **Les huit `tile_sol_*`** restent une source déclarée, pour le motif mesuré
   au lot MOULINETTE-TERRAIN : aucune coupe de leur original apparent ne les
   reproduit, et aucun écran ne les dessine.
