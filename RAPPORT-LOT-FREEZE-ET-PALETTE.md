# RAPPORT — lot FREEZE-ET-PALETTE

**Date** : 03/09/2026
**Branche** : `claude/sprite-refonte-9il369`
**Version produite** : **0.78.0 · build 80**
**Livrable** : `dist/index.html`, **3 353 939 octets**, 0 référence externe
**Suite** : `npm run check` → **966 pass / 0 fail**

---

## 0. Ce qui a été demandé

Quatre points d'Ethan, le 03/09 :

1. « Claude confond monter le plafond des niveaux et niveau unités. »
2. « Ui base : faire une seule bande pour les bâtiments unités à construire + une
   barre de défilement. Garder la hauteur, comme ça les boutons seront gros.
   Pour les bâtiments, mettre le collecteur, raffinerie, centrale, accumulateur
   en 1er. »
3. « Toutes les unités n'ont pas la même vitesse de déplacement normalement. »
4. « Freeze quand on arrive sur la base ou défense. depuis une autres fenêtres. »

**Trois donnent du code. Le troisième donne une mesure et pas une ligne** — la
raison est au §4, et elle est vérifiable.

---

## 1. Le coût

| | avant | après |
|---|---|---|
| `dist/index.html` | 3 350 987 o | **3 353 939 o** |
| `data:image` inlinés | 25 | **25** |
| tests | 964 | **966** |

**+2 952 octets**, aucune image n'entre. Borne T10 inchangée à **3 400 000** —
marge **46 061 octets, 1,37 %**, la plus mince du dépôt. Le prochain lot qui
fait entrer une image devra la relever en écrivant pourquoi.

---

## 2. Le freeze — trois secondes, à chaque arrivée sur la Base

### Reproduit avant d'être touché

Chromium sans tête, viewport 360 × 720, quatre allers-retours d'affilée :

| geste | coût |
|---|---|
| → Monde | 33 ms |
| **→ Base** | **3 170 ms** |

Ce n'est pas un coût de premier affichage : il se répète identique à chaque
bascule. C'est exactement ce qu'Ethan décrit.

### Ce que ce n'est pas — trois pistes mesurées et écartées

| piste | résultat |
|---|---|
| le sol décoratif de `#chantier-defile` (livré la veille) | le retirer **entièrement** laisse 3 150 ms |
| `image-rendering: pixelated` | le passer à `auto` laisse 3 150 ms |
| `display: none` du masquage → `visibility: hidden` | 1 533 ms — la moitié, pour un changement qui toucherait les sept écrans |

⚠ **Le lot RETOURS-DU-03-SOIR n'y est pour rien**, et il fallait le vérifier
avant tout le reste : c'est ce que le premier essai cherchait.

### La cause, isolée

Le gestionnaire du clic prend **0,4 ms** ; le reste est du rendu. En vidant les
fonds des cases, la bascule retombe à **33,6 ms** — donc c'est le fond, et rien
d'autre. En ne gardant que les n premières couches des 162 cases :

| couches gardées | coût |
|---|---|
| 1 | 533 ms |
| 2 | 1 500 ms |
| 4 | 3 133 ms |

Une droite à **0,78 s la couche**. Et la même liste posée en `url()` littéral au
lieu de `var()` rend **283 ms** — donc l'écart n'est pas la taille de l'atlas,
c'est le **partage** : Chromium décode l'image une fois par substitution de
`var()`, soit **670 décodages** d'un fichier de 1024 × 1024 pour un seul
affichage de la grille.

### Le remède : une règle de feuille partagée

`poserLesAtlas` mint une **classe par séquence d'atlas** et pose la liste
d'adresses **une seule fois** dans une règle ; les éléments ne portent plus
qu'un nom de classe. Le nombre de classes est celui des FORMES de pile — sol
seul, sol et champ, socle et tourelle —, pas celui des cases.

**Mesuré : 3 170 ms → 33 ms**, sur les trois poseurs (cases, jetons, mur de
contour).

⚠ **L'adresse se lit, elle ne s'écrit pas.** `url(` n'apparaît nulle part dans
`ui/chantier.js` : on demande à la page ce que `tools/build.js` a mis dans la
variable, exactement comme `garnirLesAtlas` le fait déjà pour un `src`.
L'écrire l'inlinerait une **seconde** fois — 507 464 octets mesurés au lot
SPRITES-ET-ZOOM — et la poser en ligne sur chaque élément mettrait le base64
dans 670 attributs `style`, soit **~190 Mio** de texte dans le DOM.

### Le rendu est identique à l'octet — et mon premier protocole était faux

La première comparaison donnait **33,4 % des octets différents**. Ce n'était pas
le code : **la graine change à chaque partie neuve**, et deux chargements du
MÊME livrable diffèrent sur les 162 cases. Vérifié en comparant `avant.html` à
lui-même.

En rejouant **la même sauvegarde** dans les deux builds : **0 case différente
sur 162**, et les deux captures sont **identiques à l'octet**.

### Un rappel payé en vingt-huit tests

La fonction de plafond du §5 a d'abord été insérée **à l'intérieur** de
`verifierNiveau`. JS valide, `node --check` vert, et vingt-huit tests rouges sur
« is not defined ». `node --check` ne prouve que la syntaxe — c'est écrit au §4
de `CLAUDE.md`, et c'est vrai.

---

## 3. La palette — une bande, un défilement, l'économie en tête

`#chantier-palette` passe de deux rangées à une seule, avec `overflow-x: auto`.

⚠ **C'est l'inverse du 28/08**, et ce jour-là avait raison en son temps : la
palette était passée de colonnes défilantes à deux rangées qui tiennent, parce
que « la première vignette était coupée et deux bâtiments vivaient hors de
l'écran ». Le motif était juste et il avait un prix qu'on ne mesurait pas :
dans 86 px, deux rangées laissent **38 px** par vignette, sprite et libellé
compris — et la bande Défense en porte dix-sept. Une seule rangée en laisse
**76**.

⚠ **La hauteur ne bouge pas**, et c'est la moitié de la demande :
`flex: 0 0 86px` est inchangé, donc les **288 px** de chrome que
`chantier.test.js` somme ne bougent pas non plus.

⚠ **L'interdiction de défiler horizontalement nomme son exception** plutôt que
d'être retirée : elle reste **totale** sur les cinq autres barres fixes — une
barre de compteurs qui défile cacherait un nombre que rien ne ferait
réapparaître.

⚠ **La largeur d'une colonne quitte le JS pour la feuille.** Tant que la palette
devait TENIR, seul le JS savait combien de vignettes il y avait ; maintenant
qu'elle défile, c'est une constante d'écran.

### L'ordre est une table, pas un tri

`ORDRE_PALETTE` entre dans `data/base.js` : **collecteur, raffinerie, centrale,
accumulateur**, puis les sept autres. Ce sont les quatre de l'économie, ceux que
la chaîne du tutoriel demande en premier — ils étaient en huitième à onzième
position.

⚠ Aucune clé du roster ne dit « ce bâtiment vient tôt » ; en inventer une pour
pouvoir trier ferait une donnée de calibrage qui n'en est pas une. Un test exige
que ce soit une **permutation exacte** du roster, ni un nom en trop ni un
oublié. Et l'ordre de `BASE_BATIMENTS` n'est **pas** touché : le réordonner
aurait déplacé tout ce qui l'énumère — le générateur, les tests, la maquette —
pour une décision qui ne concerne que la barre du bas.

---

## 4. Les vitesses — mesurées, fidèles, et rien n'a été touché

Les vitesses **sont** différenciées et elles **mordent**.

| vitesse (milli-cases/tick) | unités |
|---|---|
| 60 | Fusiliers, Guetteur, Perceurs, Fouisseurs, Carapace, Pilon |
| 90 | Fendeur, Broyeur |
| 120 | Ratisseur, Bélier, Crécelle, Busard, Enclume |
| 240 | Frappeur |

`deplacement` ajoute `p.vitesseMilli` par tick. Mesuré sur un combat monté : les
trois groupes présents avancent de **60, 90 et 120 milli-cases en un tick**,
exactement la table.

⚠ **Et la table est fidèle au §6 de `RELEVE-TA-COURBES-2.md`, ligne par ligne.**
Si six unités partagent 60, c'est que le relevé mesuré le dit — les cinq
escouades y sont toutes à 60. Les re-répartir serait un **arbitrage de
calibrage**, et `CLAUDE.md` §1 interdit d'inventer une valeur : elle se demande
à Ethan. **Rien n'a donc été touché.**

⚠ **Une chose du relevé n'est pas implémentée, et elle est sans objet** : « la
vitesse passe en ×2/3 en défense » (§3 du relevé). Aucun défenseur ne bouge —
`deplacement` écarte tout ce qui n'est pas `camp === 'attaque'` —, donc la
transformation n'aurait rien à multiplier.

---

## 5. Le plafond contre le niveau — Ethan a raison, et c'était en un mot

Les deux éditeurs — `ui/arsenal.js` et `ui/defense.js` — portaient **un** champ
`niveau` qui jouait **deux** rôles sans le dire :

- argument de `budgetDuNiveau`, où il désigne le **niveau du bâtiment** de
  commandement ;
- niveau écrit sur **chaque pièce posée**, où il désigne le **niveau de
  l'unité**.

Les deux coïncidaient au banc, où un seul curseur les réglait ensemble : c'est
ce qui a caché la confusion pendant des semaines.

⚠⚠ **Et la règle était déjà écrite dans la donnée, sans être appliquée nulle
part.** `POINTS_ARMEE` de `data/sites.js` dit depuis toujours : « chaque budget
est adossé à son bâtiment, **qui fixe aussi le niveau maximal des unités de son
côté** ». C'est un **plafond**, exactement comme le Chantier en pose un sur les
bâtiments — pas une valeur qu'on recopie sur la pièce.

`niveauDesPieces` entre donc dans les deux éditeurs, le plafond **lève** quand
il est franchi, et **le défaut vaut le plafond** : rien ne bouge pour un
appelant existant, le banc compris.

⚠ **Ce qui n'est toujours pas arbitré : comment le joueur choisit le niveau
d'une pièce.** Le jeu pose au niveau 1 et rien ne le monte. Ce lot **nomme** les
deux grandeurs et fait appliquer la borne ; il n'invente pas la mécanique.

---

## 6. Falsifications

| # | falsification | verdict |
|---|---|---|
| F1 | le mur repasse par `style.backgroundImage` | tombe : « 3 appels à poserLesAtlas » |
| F2 | l'adresse est écrite au lieu d'être lue | tombe : « l'écran fabrique une adresse `url(` » |
| F3 | `fondsPoses` relit le style | tombe : « ne relit plus la séquence là où elle est écrite » |
| F4 | la pièce reprend le niveau du bâtiment | tombe : « la pièce porte encore le niveau du bâtiment » |
| F5 | le plafond désarmé | tombe : « Missing expected exception » |
| F6 | le budget suit la pièce | tombe |
| F7–F9 | les trois de la palette (colonnes en JS, défilement, hauteur) | tombent |

**Neuf falsifications, neuf chutes.**

⚠ Une garde a dû être **resserrée** en cours d'écriture : un `doesNotMatch` sur
`gridTemplateColumns` tout court attrapait la **grille des cases**, qui la pose
légitimement depuis toujours. Une garde qui tombe sur du code juste se fait
retirer, pas resserrer — c'est comme ça qu'on perd une garde. Elle nomme
désormais la palette.

---

## 7. Fichiers touchés

**Production** — `src/ui/chantier.js` (fond partagé, ordre, palette),
`src/ui/arsenal.js` et `src/ui/defense.js` (les deux niveaux),
`src/data/base.js` (`ORDRE_PALETTE`), `src/index.src.html` (la bande),
`package.json` (0.78.0 · build 80, en chaînes).

**Tests** — `test/chantier.test.js` (+1, deux gardes retournées),
`test/arsenal.test.js` (+1), `test/recherche.test.js` (le faux document apprend
ce que le code emploie).

**Documentation** — `CLAUDE.md` §0, ce rapport.

---

## 8. Vérifications

- `npm run check` → **966 pass / 0 fail**, `dist/index.html` **3 353 939
  octets**, 0 référence externe.
- Chromium sans tête : bascule Base **33 ms** (contre 3 170), **0 erreur de
  page**, captures **identiques à l'octet** sur une partie épinglée.
- `python3 tools/verifier.py` **non lancé, et c'était conforme** : le lot ne
  touche ni `art/`, ni `tools/`.

---

## 9. Points laissés en suspens

1. **Comment le joueur choisit le niveau d'une pièce** — non arbitré. Le plafond
   existe désormais et il est nommé ; la mécanique reste à Ethan.
2. **Les vitesses**, si Ethan veut qu'elles soient re-réparties : c'est un
   arbitrage de calibrage, et le relevé fait foi tant qu'il ne tranche pas.
3. **La palette de l'écran Offense n'est pas touchée** — Ethan a écrit « Ui
   base ». Elle garde ses deux rangées ; le jour où il la veut pareille, c'est
   la même règle à trois lignes.
4. **Le code couleur** des ressources et des frontières, ouvert depuis
   TERRITOIRE et MOULINETTE-TERRAIN.
