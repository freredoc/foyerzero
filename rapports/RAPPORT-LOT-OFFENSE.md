# RAPPORT — LOT OFFENSE

**Version produite** : `0.72.0` · build `74`.
**Base** : `claude/sprite-refonte-9il369` à `b82ca8e` (lot GRILLE-128, PR #66).
**`SAVE_VERSION`** : inchangée, **24**.

---

## 0. Ce que le lot fait, en une phrase

L'écran des quatre vagues montrait trente-six cases tiretées sur du noir : il
montre maintenant **le sol d'un bassin**, et ses neuf emplacements par rangée
sont **en quinconce**.

Ethan, 03/09 : « je t'ai envoyé un sprite pour combler le menu armée ou
offense », et « toujours 4 rangées de 9, mais les neuf tu les mets en quinconce
pour que ça passe à peu près ».

---

## 1. LE BASSIN — CE QU'IL COÛTE, ET CE QUI LE REND PAYABLE

| poste | mesuré |
|---|---|
| la source livrée, `fond_offense_bassin.png` | 1149 × 1368, **2 158 126 o** |
| le même en PNG optimisé | **2 099 998 o** |
| **`fond/fond_offense.webp`, q85, méthode 6** | **164 578 o** |
| ce qu'il pèse **en base64** dans le livrable | **+219 440 o** |
| le balisage, la feuille et le quinconce | **+2 278 o** |
| **`dist/index.html`** | 3 035 474 → **3 257 192** (+221 718) |

**C'est le WebP qui rend ce décor payable, et le rapport est de treize.** Le PNG
l'aurait à lui seul porté le livrable au-delà de cinq mégaoctets. Ce n'est pas
du pixel art à teintes comptées, c'est une photographie de décor : le PNG n'a
rien à y gagner, et le lot PIXELS avait déjà tranché l'encodage pour les atlas —
il n'y a qu'un réglage à connaître dans le dépôt.

**La borne T10 passe de 3 200 000 à 3 400 000**, marge **142 808 octets, 4,2 %**,
raison écrite poste par poste dans le test. C'est la règle §5 prise par le bon
bout : une ressource entre légitimement, la borne monte, et le lot dit pourquoi.

⚠ **`data:` dans le HTML : 16 avant, 17 après.** C'est la première image qui
entre depuis le lot MUR-DE-CONTOUR du 31/08.

---

## 2. ⚠⚠ IL PASSE PAR UN OUTIL, ET C'EST TOUT LE PRIX DE LA VÉRIFIABILITÉ

`tools/fonds.py` — vingt-sixième fichier de `tools/`, treizième producteur.

Committer le `.webp` conditionné **sans outil** aurait marché, et aurait fait de
lui une **source déclarée** de plus : un fichier que personne ne sait reproduire
le jour où l'encodage ou la palette bougent. Le dépôt en porte déjà cinquante-six
(`terrain/`, `carte/`), et chacune s'est payée. Il est donc dans `CHAINE`, donc
`tools/verifier.py` le rejoue et compare à l'octet.

⚠ **CE N'EST PAS UN SPRITE, ET IL N'ENTRE DANS AUCUN ATLAS.** `coudre` de
`tools/atlas.py` exige des cellules **carrées d'un même côté** ; un décor de
1149 × 1368 n'en est pas une. Il voyage par son propre marqueur de
`tools/build.js` — `%FOND_OFFENSE%` —, exactement comme les cinq murs de contour
et les deux grosses bases de l'Ouvrage.

⚠ **IL NE REDIMENSIONNE PAS.** La feuille rogne le décor sur sa boîte ; réduire
dans l'outil figerait une taille d'écran que personne n'a mesurée.

⚠ **ET IL EST DÉROUTABLE.** Comme les douze autres producteurs, il demande sa
destination à `tools/chemins.py`, qui honore `FZ_SPRITES` — sans quoi le
vérificateur écrirait dans `art/sprites/` là où il compare.

---

## 3. ⚠ `cover`, JAMAIS `100% 100%`

Le décor a un rapport de **0,84** et l'écran non. L'étirer déformerait des
tuyaux et des grilles d'aération, que l'œil lit comme des objets : **on rogne,
on ne déforme pas.** Un test refuse l'étirement, et refuse aussi la répétition —
un bassin répété ferait une couture au milieu de l'écran.

Et il est fixé au CADRE, pas au contenu : le bassin est la salle, il ne défile
pas avec ce qu'on y pose.

---

## 4. ⚠⚠ LE QUINCONCE PASSE PAR LA GRILLE, JAMAIS PAR UN `transform`

Un `transform: translateX(50%)` faisait le dessin en une ligne. Il était exclu :
**il déplace le dessin sans déplacer la géométrie du pointage**, et le doigt
cesserait de tomber sur l'emplacement qu'il vise. C'est la faute que le dépôt
refuse depuis toujours sur la grille du Chantier, et qu'il a déjà payée sur le
calque des traits de voisinage.

On compte donc en **demi-colonnes** :

```
repeat(NB_COLONNES × 2 + 1, 1fr)        posé par ui/offense.js
.emplacement            { grid-column: span 2; }
.emplacements           .emplacement:first-child { grid-column-start: 1; }
.emplacements.decalee   .emplacement:first-child { grid-column-start: 2; }
```

**La demi-case de mou EST le décalage**, et le test le mesure au lieu de le
lire : avec `× 2` la rangée décalée déborde d'un demi-emplacement, avec `× 2 + 2`
elle n'est plus au ras du bord et le quinconce n'en est plus un.

⚠ **LE NOMBRE DE DEMI-COLONNES N'EST PAS DANS LA FEUILLE.** `NB_COLONNES` vient
d'`EMPLACEMENTS_ASSAUT`, et le CSS ne sait pas lire une donnée : c'est le module
qui pose la valeur. Le test **évalue l'expression trouvée dans la source** avec
le vrai `NB_COLONNES` et exige en plus qu'elle **nomme** la donnée — écrire
« 19 » passerait l'égalité aujourd'hui et mentirait le jour où une vague
changerait de largeur. Et il refuse tout `repeat(` chiffré dans le bloc de la
feuille.

⚠ **LA RANGÉE DÉCALÉE EST MARQUÉE, PAS DEVINÉE.** Un `:nth-child` aurait lié le
quinconce à la structure du DOM, qu'un titre inséré un jour aurait décalée en
silence. C'est une classe, `decalee`, si bien que la garde des classes de
`chantier.test.js` — toute classe basculée par le JS doit avoir une règle —
s'applique d'elle-même.

### Ce que ça change, CALCULÉ SUR LA FEUILLE

Le dépôt n'a pas de navigateur, donc ce nombre est une arithmétique sur les
déclarations, pas un relevé d'écran : sur une dalle de 360 px CSS, avec les
6 px de marge de `#offense-vagues` et le `gap` de 3, un emplacement passe de
`(348 − 8×3) / 9 = **36,0 px**` à `2 × (348 − 18×3) / 19 + 3 = **33,9 px**` de
côté. C'est le prix du décalage, et c'est exactement le « pour que ça passe à
peu près » du message. **Le rendu lui-même n'a pas été vérifié sur appareil, et
un test appareil non exécuté se déclare non exécuté** (§3).

---

## 5. LES GARDES, ET LEUR FALSIFICATION

Deux tests entrent, **941 au total**. Les deux ont été falsifiés, et chaque
falsification fait tomber **exactement un** test :

| falsification | verdict |
|---|---|
| `NB_COLONNES * 2` (mou retiré) | tombe |
| `repeat(${19}, 1fr)` (nombre en dur) | tombe |
| `classList.add('decalee')` retiré | tombe |
| décalage refait par `style.transform` | tombe |
| demi-colonnes écrites dans la feuille | tombe |
| `grid-column: span 2` retiré | tombe |
| `background-size: 100% 100%` | tombe |
| `background-image` retiré du livrable | tombe |

---

## 6. ⚠ LA GARDE DES ENTRÉES A MORDU, ET C'EST SON PREMIER VRAI USAGE

Le lot ENTRÉES est de la veille ; il a servi le lendemain. Poser
`fond_offense_bassin.png` dans `art/sources/` a fait **rougir la suite** tant
que `art/sources-declarees.json` n'a pas été régénéré. Le diff de la déclaration
est **d'une seule ligne** — l'image passe de rien à `consommees` —, ce qui est
la preuve que la chaîne l'ouvre pour de bon.

`art/sources/` : **165 → 166** fichiers à plat, **83 → 84** consommées,
82 dormantes.

---

## 7. BORNES

| mesure | **mesuré** |
|---|---|
| `npm test` | **941 pass / 0 fail** (939 avant) |
| `dist/index.html` | **3 257 192 o**, 0 référence externe |
| marge T10 | 142 808 o, **4,2 %** |
| `tools/verifier.py` | **932 · 0 · 0 · 0**, vert, 305,7 s (931 avant) |
| `data:` dans le HTML | 16 avant, **17** après |
| sprites réécrits | **0** — aucun dessin de case n'est touché |

---

## 8. LES ÉCARTS, ET CE QUI RESTE

**Un écart, déclaré** : le lot retire un doublon de commentaire dans
`src/ui/offense.js` — la ligne « Défait tous les modes » y était écrite deux
fois de suite, antérieurement au lot. Elle est dans le bloc que ce lot touche ;
la laisser aurait été laisser du bruit sous les yeux du lecteur suivant.

**Non fait, et non demandé** : le décor ne s'affiche que sur l'écran Offense.
L'écran Chantier et l'écran Défense partagent la même colonne mais pas la même
salle, et rien dans le message d'Ethan ne dit qu'ils devraient.

**Ce qui reste, dans l'ordre :**

1. **MURS** — les 8 blocs `4x1` et 8 angles `1x1`, le U qui descend du haut de
   la base jusqu'au bas de la bande de défense et **ne ferme pas en bas**.
   ⚠ **En attente d'un arbitrage** : ce sont des BLOCS opaques, pas des traits ;
   mangent-ils une case de la grille, ou la ceignent-ils d'un anneau ? Défaut
   retenu à défaut de réponse : l'anneau, la grille passant de 10 à 11 unités.
2. **TERRITOIRE** — les cinq formes (trait, angle en L, coin, U, carré) × deux
   camps, livrées en 128, pour remplacer les côtés tracés de l'écran Monde.
3. **MOULINETTE-TERRAIN** — les champs de quartz et de scorie, et le fond de
   carte, qui n'ont jamais traversé le rendu au filtre du lot PIXELS. ⚠ Les
   tuiles sources sont au dépôt (`art/sources/carte/tiles/`, 261 fichiers de
   128), mais l'atlas livré est une **source déclarée** qu'aucun outil ne
   produit : le lot devra d'abord écrire le couseur qui manque.
