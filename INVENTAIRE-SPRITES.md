# INVENTAIRE-SPRITES.md — Foyer Zéro

> ⚠ **LE LOT 1 EST PRODUIT.** Les dix-huit fichiers sont au dépôt, dans
> `art/sprites/terrain/` — et non `sprites/terrain/`, qui n'existe pas. Ce §2 se
> lit désormais comme une trace de conception : ce qui a été fait, et sur quels
> points la production a démenti la conception, est dit à sa place. Les mesures
> sont dans `RAPPORT-lotSOL-recolorisation.md` et `RAPPORT-lotP1.3-P1.5.md`.
>
> Liste exhaustive des sprites à produire, extraite de `src/data/` le 26/08/2026.
> À lire avec `FICHE-STYLE.md`, qui reste la référence de production ; ce
> document-ci ne dit pas COMMENT dessiner, il dit CE QU'IL FAUT dessiner et
> sous quel nom de fichier.
>
> **Provenance de chaque ligne.** Aucune entrée n'est inventée : les unités et
> les défenses viennent de `UNITES` et `DEFENSES` de `src/data/combat.js`, les
> bâtiments de site de `BATIMENTS` de `src/data/sites.js`, les bâtiments du
> joueur de `BASE_BATIMENTS` de `src/data/base.js`, les modules de `MODULES`,
> les obstacles d'`OBSTACLES`, les terrains du §9 de `FICHE-STYLE.md`. Les
> seules entrées sans source de données sont marquées **[TRANCHÉ 26/08]** ou
> **[REPORTÉ]** — elles relèvent d'un arbitrage d'Ethan, pas d'une lecture de
> .

---

## 0. Total, d'un coup d'œil

> **v3 — 26/08/2026.** Tous les arbitrages du §2.4, §3.4, §4.2, §5.3, §5.4 et
> §6.2 sont tranchés. Deux bascules de fond :
> **(1)** le pipeline n'est plus la composition Python mais la **génération par
> modèle d'image** en 128 × 128, selon `BRIEF-SPRITES-IA.md` ;
> **(2)** la vue n'est plus strictement zénithale mais **top-down haut, ~75°**,
> avec **non-dépassement de case absolu** (amendement A7). Le nombre de fichiers
> ne change pas ; ce qui change, c'est ce que chaque fichier doit contenir.

| Lot | Contenu | Fichiers |
|---|---|---|
| 1 | Sol de base et éléments posés — 8 sols + 4 champs + 6 obstacles | **18** |
| 2 | *fusionné dans le lot 1 le 27/08* | — |
| 3 | Unités offensives — 14 unités × 2 propriétaires | **28** |
| 4 | Défenses — 9 structures × 2 propriétaires, monolithiques | **18** |
| 5 | Bâtiments — 11 joueur + 5 Ouvrage | **16** |
| 5 bis | États de réparation — 3 surcouches + 4 ruines | **7** |
| 6 | Carte — 6 marqueurs + 7 POI de bonus | **13** |
| 7 | Interface | **41** |
| | **À générer** | **141** |

Hors génération :

| Poste | Fichiers | Pourquoi |
|---|---|---|
| Masques de transition `tile_bord_<dir>` | **0** | **Supprimés 27/08.** Ils n'existaient que parce qu'on croyait à sept terrains adjacents. Sur un sol unique il n'y a rien à raccorder : le sous-problème s'évapore, il ne devient pas procédural. §2. |
| `bat_o_foyer_zero.png` | +1 | Reporté, §5.3. |
| Fond de la carte monde | 0 | Procédural au canvas : bruit fractal en trois teintes de la palette, déterministe sur la graine. 30 × 300 cases = 1 410 × 14 100 px CSS, aucune image ne couvre ça. Tranché 27/08, §2.4. |
| `tile_horschamp.png` | −1 | **Supprimé 27/08.** Il ne bordait que le couloir de la carte, qui ne pave plus rien. Devient un traitement du fond procédural, §2.4. |

**Presque zéro sprite d'effet.** Impacts, éclairs de bouche, mort, particules,
barres de PV, ombres portées : `FICHE-STYLE.md` §6 et §8 les rendent en
primitives. Ne rien produire pour eux, et ne pas laisser cette ligne
réapparaître dans un devis.

⚠⚠ **AMENDÉ LE 30/08 : LES EXPLOSIONS SONT LA SEULE EXCEPTION, ET ELLES SONT
PRODUITES.** Ce paragraphe disait « zéro » et interdisait les explosions avec
tout le reste. Ethan a tranché l'inverse après avoir déposé trois planches, et
`tools/effets.py` en tire douze sprites — trois familles de quatre images —
dans `art/sprites/effet/`, aux trois grilles.

⚠ **CE QUI N'A PAS CHANGÉ, ET QUI COMPTE AUTANT.** Les autres effets restent
procéduraux : impacts, éclairs de bouche, mort, particules, traînées, barres de
PV, ombres portées. L'exception porte sur les EXPLOSIONS seules, parce qu'un
souffle qui grandit puis retombe en quatre images ne se rend pas en primitives ;
un impact ponctuel, si.

⚠ **LES PROJECTILES NE SONT PAS DANS L'EXCEPTION.**
`art/sources/roquettes_2x2_1254x1254.png` est au dépôt et reste NON DÉCOUPÉ —
écarté par Ethan le 30/08, en même temps qu'il tranchait pour les explosions.
La distinction est délibérée : ne pas la lire comme un oubli.

⚠ **ET LEUR PALETTE N'EST PAS CELLE DU JEU.** Une explosion est orange et jaune ;
la passer dans la rampe kaki ou celle de l'Ouvrage la détruirait. Chaque famille
porte SA palette de seize teintes, prise sur son propre dessin. C'est le seul
endroit du dépôt où des pixels sortent des deux rampes, et c'est la raison pour
laquelle la garde de palette de `banc.test.js` ne les voit pas : elle balaie du
CODE — `src/render/`, `src/ui/`, `index.src.html` —, jamais des PNG.

---

## 1. Amendements à `FICHE-STYLE.md` §9 — le nommage ne suffit plus

La convention actuelle n'a **aucun axe propriétaire**. Or la règle centrale du
projet est que le joueur et l'Ouvrage ne partagent ni palette ni grammaire de
formes : `off_meute.png` ne peut pas désigner deux sprites. **Sept amendements**,
tous tranchés le 26/08, à reporter dans `FICHE-STYLE.md` avant la première
génération. Les quatre derniers (A4 à A7) ne portent plus sur le nommage mais
sur le rendu, et A7 modifie le §1.1 de la fiche — son premier principe non
négociable.

**A1 — axe propriétaire, en deuxième position.**

```
off_<prop>_<cle>.png            off_j_meute.png · off_o_meute.png
def_<prop>_<chassis>_corps.png  def_j_tourelle_corps.png
arme_<prop>_<cible>[_r].png     arme_j_av_r.png
bat_<prop>_<cle>.png            bat_j_caserne.png · bat_o_souche.png
```

`<prop>` vaut `j` (joueur) ou `o` (Ouvrage). `obs_`, `poi_`, `ui_` et `champ_`
n'en portent pas : ils n'appartiennent à personne.

**A8 — `tile_sol_*` porte l'axe propriétaire.** [27/08] A1 écrivait que `tile_`
n'en portait jamais. C'était vrai tant qu'une tuile était un terrain neutre ;
depuis la refonte du §2, il y a **un sol par camp** — `tile_sol_j_a…d.png` et
`tile_sol_o_a…d.png`, déjà produits pour le joueur. Les éléments posés, eux,
restent neutres et sans axe : un quartz est un quartz.

**A2 — `<cle>` est la clé du fichier de données, jamais le nom affiché.**
`off_o_meute.png` et `off_j_meute.png` sont la même ligne de `UNITES` ; le
joueur y lit « Fusiliers », l'Ouvrage « Meute ». Un fichier nommé
`off_j_fusiliers.png` casserait le lien avec `src/data/` et rouvrirait le
mélange des deux jeux de noms que `CLAUDE.md` §4 interdit. Les clés en camelCase
passent en snake_case dans le nom de fichier : `chantierDeConstruction` →
`bat_j_chantier_de_construction.png`.

**A3 — rotation et miroir autorisés pour `tile_*`.**
Le §11 les interdit en bloc. L'interdit vise l'ORIENTATION D'UNE ENTITÉ. Une
tuile de terrain n'a pas d'orientation, et la carte fait 30 × 300 = **9 000
cases** : sans rotation, il faudrait une quinzaine de variantes par terrain pour
que le pavage ne se voie pas. Avec rotation, quatre variantes en donnent seize
apparentes.

**A4 — deux transformations au rendu, et seulement deux.** [tranché 26/08, restreint]
Conséquence du §3.4, resserrée par le passage à 75° (A7). La rotation n'est plus
libre : seules deux transformations sont autorisées, parce que seules deux
restent justes quand la caméra est inclinée.

| Qui | Transformation | Interdit |
|---|---|---|
| Véhicules (mobiles) | **rotation par pas de 90°** | toute rotation intermédiaire |
| Infanterie | **miroir vertical** (≡ 180°, les figures étant symétriques gauche/droite) | rotation à 90° |
| Tout le reste — bâtiments, défenses ancrées, POI, obstacles, icônes | **aucune** | — |

L'interdit du §11 devient : *aucune SECONDE ORIENTATION DESSINÉE*. On ne produit
jamais un second fichier pour la même entité tournée ; on ne tourne au rendu que
ce qui figure dans ce tableau.

**A6 — empreintes 18 / 24 / 28, doublées d'un compteur de pièces.** [tranché 26/08]
La fiche §7 annonçait 20 / 26 / 30 gros pixels sur 32 pour 5 / 10 / 15 points, la
dernière valeur étant décrite comme « case débordante ». Le non-dépassement
(A7) supprime cette possibilité et la marge de 2 gros pixels plafonne à 28.
Nouvelle échelle : **18 / 24 / 28**.

Mais la taille seule ne suffit pas, et le relevé de `combat.js` dit pourquoi :
**l'échelle ne sert jamais à trois valeurs, seulement à trois oppositions
binaires**, une par châssis.

| Châssis | Opposition réelle | Absent |
|---|---|---|
| Escouade | 5 (`meute`, `perceurs`) contre 10 (`guetteur`, `fouisseurs`, `carapace`) | pas de 15 |
| Blindé | 10 (`ratisseur`, `fendeur`, `belier`) contre 15 (`broyeur`, `pilon`) | pas de 5 |
| Aéronef | 10 (`crecelle`, `busard`, `frappeur`) contre 15 (`enclume`) | pas de 5 |

Deux conséquences. D'abord **18 gros pixels ne concerne que deux sprites sur
vingt-huit** — le cas « trop petit pour être lisible » est marginal. Ensuite
**24 contre 28 fait 17 % d'écart**, ce que personne ne verra sur deux unités qui
ne sont jamais côte à côte.

D'où le second signal : **compter des pièces**. La pièce garde une taille
lisible, c'est son NOMBRE qui code le coût.

| Châssis | 5 points | 10 points | 15 points |
|---|---|---|---|
| Escouade | **3 figures** | **5 figures** | — |
| Blindé | — | **1 tube**, train de chenilles simple | **2 tubes**, double train |
| Aéronef | — | **3 modules** radiaux | **5 modules** |

C'est ce qui évite la bouillie : un fantassin garde **environ 8 gros pixels**
quel que soit le coût de l'escouade, et l'empreinte passe de 18 à 24 par
accumulation, pas par étirement. Un signal discret qui se compte, doublé d'un
signal continu qui se voit ; aucun des deux ne demande de détail sous le gros
pixel. La grammaire de l'aéronef est celle qui était déjà écrite pour le Dard
(3 modules, 5 pour `enclume`) — elle est simplement généralisée au joueur.

⚠ Le §1.3 de la fiche tient toujours : **la forme code la classe**. Le nombre de
pièces code le coût, pas la classe — cinq figures restent une escouade, deux
tubes restent un blindé. On n'ajoute pas un axe, on gradue celui de la taille.

**A7 — vue top-down haute (~75°), non-dépassement absolu.** [tranché 26/08]
Remplace le « zénithal strict » du §1.1 de la fiche. La caméra est à **75° de
l'horizontale** (90° serait la verticale exacte) : on voit le dessus des objets
et **une amorce de leur face basse**, rien de plus.

Chiffres qui découlent de l'angle, et qui suffisent à tout régler :

- la face visible d'un objet de hauteur `H` occupe `H × cos 75° ≈ H / 4` — **un
  quart de sa hauteur** ;
- l'emprise au sol est comprimée de `sin 75° = 0,97`, soit 3 % : **négligeable,
  et on ne la compresse pas**. La grille reste carrée à l'écran.

⚠ Ce n'est **pas** de l'isométrie. On n'incline pas la grille, on ne déforme pas
les cases, on ne tourne pas la carte de 45°. On dessine simplement chaque sprite
avec une amorce de flanc en bas. Si quelqu'un compresse la grille, il a compris
autre chose que ce qui est écrit ici.

**Non-dépassement.** L'intégralité du sprite — flanc compris, canon compris,
antenne comprise — tient dans un carré centré de **28 × 28 gros pixels sur 32**.
Aucune exception, sauf les tuiles de terrain qui font 32 × 32 bord à bord.
Trois conséquences, toutes bonnes :

1. **Aucun tri par profondeur à écrire.** Rien ne mord sur la case du dessus,
   donc rien ne peut masquer rien. Un ordre de dessin par rangée suffit, et le
   §1.1 de la fiche (« aucun tri par profondeur ») survit intact.
2. **L'ancrage reste le centre de la case**, comme au §2 de la fiche.
3. **La rotation à 90° ne fait jamais sortir un sprite de sa case**, puisque sa
   boîte englobante tient déjà dans un carré.

**Trois régimes d'inclinaison**, parce qu'un flanc généreux et une rotation ne
peuvent pas cohabiter : la caméra ne tourne pas avec l'objet, donc un flanc
dessiné en bas se retrouve en haut après un miroir, et de côté après un quart de
tour.

| Régime | Qui | Flanc visible | Pourquoi |
|---|---|---|---|
| **A — plat** | terrain, obstacles, surcouches de dégâts | **0** | c'est le sol, il n'a pas de hauteur |
| **B — épaisseur** | les 14 unités, et elles seules | **1 à 2 px** | elles tournent et se retournent ; au-delà de 2 px l'erreur se voit |
| **C — volume** | bâtiments, les 9 défenses ancrées, POI, marqueurs, ruines | **4 à 7 px** | rien ne les transforme, elles peuvent se payer le volume entier |

Le régime B est compatible avec le gradient avant/arrière du §5, et c'est ce qui
le sauve : le flanc dessiné en bas est **sombre**, l'arrière du gradient est
**sombre**, les deux signaux disent la même chose. Après miroir vertical, l'avant
pointe vers le bas et le flanc sombre remonte en haut, où est désormais
l'arrière : toujours juste. C'est la seule raison pour laquelle l'inclinaison et
le retournement des garnisons peuvent coexister.

**Dette assumée.** Un véhicule tourné d'un quart de tour montre son amorce de
flanc sur le côté au lieu du bas. À 2 px logiques sur 32, l'erreur est de 6 % de
la case — présente, non gênante. C'est le prix exact de l'arbitrage, il est
connu, et il ne se paie qu'une fois : plafonner le flanc des unités à 2 px est ce
qui le maintient dans cette fourchette.

**A5 — les défenses redeviennent monolithiques.** [tranché 26/08]
L'export en couches (corps + tube séparés) supposait un générateur par
composition, qui garantissait l'alignement au pixel. Un modèle d'image ne le
garantit pas : deux images indépendantes ne se recalent pas. Une défense = **un
fichier**. Le recul au tir devient un recul de l'entité entière, de 1 px au lieu
de 2–3 pour le seul tube. C'est le seul effet perdu, et il coûte 4 fichiers de
moins (18 au lieu de 22).

---

## 2. Lot 1 — Sol de base et éléments posés (18 fichiers)

> **[REFONDU 27/08 — deuxième correction de la journée, et la bonne.]**
> Ce lot a d'abord été spécifié comme **le terrain de la carte du monde** : sept
> matières, quatre variantes, 29 tuiles, 8 masques de transition. Il a été
> produit en entier avant qu'on s'aperçoive qu'il servait un écran qui n'existe
> pas. Puis il a été corrigé une première fois le matin même en « 28 tuiles pour
> le combat et la vue de base » — c'était encore faux, et cette version-là a été
> commitée. Voici la troisième, mesurée cette fois.
>
> **Le champ de bataille n'a que DEUX états de terrain.** `ressourceDeLaCase`
> de `sim/champs.js` rend une ressource **ou `null`** : une case est nue, ou
> elle porte un champ. La ligne était au dépôt depuis le début.

| | Champ de bataille | Carte du monde |
|---|---|---|
| Source | `GRILLE` de `data/combat.js` | `GEOGRAPHIE.carte` de `data/sites.js` |
| Dimensions | **9 × 18 = 162 cases** | 30 × 300 = 9 000 cases |
| États de terrain | **deux** : nu, ou champ | sept types de site |
| Rendu | **40 à 46 px CSS par case, toujours** | 47 à 100 px CSS |
| Éléments posés | 12 champs + 10 obstacles | un emblème par case occupée |
| Sert ce lot | **oui, en entier** | **non, rien** |

**L'architecture, reprise d'Archipel Industry** — les gisements de mine posés sur
les tuiles d'île. Un **sol dense et uniforme** sur les 162 cases, un par camp, et
par-dessus des **sprites plus petits** qui disent ce qu'il y a.

⚠ **« Quasi uni » était l'erreur.** Ce document a demandé pendant une journée un
sol à 80 % d'un seul ton ; six jets l'ont appliqué et les six ont donné une
plaque plate. Le sol retenu n'a **aucun ton dominant** — le plus présent est à
35 %. Ce qui rend le fond lisible n'est pas sa propreté mais le fait que son
bruit interne, 20 points de L\*, reste six fois plus faible que l'écart qui le
sépare des entités, 29 à 41 points. Les éléments
posés sont neutres et communs aux deux camps : un quartz est un quartz.

| Bande de `GRILLE` | Rangées | Contenu |
|---|---|---|
| Déploiement | 1–2 | sol nu |
| Défense | 3–10 | sol nu + **10 obstacles** dispersés, 3 types |
| Bâtiments | 11–18 | sol nu + **12 champs**, en blocs de 1 à 3 cases |

Ce que cette architecture règle, et qui justifie de tout refaire : la densité
cesse d'être cuite dans l'image et devient un paramètre de pose ; un élément a un
contour et se détache au lieu d'être une zone de bruit ; et **il n'y a plus rien
à raccorder**, donc les 8 masques de transition disparaissent — ils ne
deviennent pas procéduraux, ils cessent d'exister.

### 2.1 Les deux sols (8)

`tile_sol_j_a…d.png` · `tile_sol_o_a…d.png`

Quatre variantes par camp, posées en damier aléatoire **avec rotation** (A3), ce
qui donne seize apparences par camp. Régime d'inclinaison **A** : c'est le sol,
il n'a pas de hauteur. Régime de conditionneur **Tuile** : 32 × 32 gros pixels
bord à bord, aucun pixel transparent.

⚠ **La contrainte qui fait tout tenir, et la seule :** *l'anneau extérieur de
2 gros pixels est entièrement du ton de sol nu.* Deux tuiles quelconques se
rejoignent alors toujours sur une bande unie, quelles que soient leurs rotations.
C'est ce qui a fait passer la planche 56570 — 9 × 18 cases posées au hasard,
**aucune couture**, une première dans ce projet. Une bordure décorative visible
au lieu d'un anneau uni est le défaut qui a fait jeter la planche jumelle.

Les deux rampes de sol sont dans `FICHE-STYLE.md` §3 : terre cuite pour le
joueur, cendre pour l'Ouvrage. **Elles doivent avoir la même clarté d'ensemble** —
si l'une est plus sombre, elle camoufle mieux, et le camp qui l'occupe joue avec
un avantage que personne n'a décidé.

### 2.2 Les champs de ressource (4)

`champ_quartz_a.png` · `_b.png` · `champ_scorie_a.png` · `_b.png`
*(livrés le 27/08 dans `art/sprites/terrain/` ; ils ne portent pas d'axe
propriétaire, A1, parce qu'ils n'appartiennent à personne)*

Douze cases par base, en blocs de une à trois cases contiguës.

⚠ **LE RACCORD EST ANNULÉ — décision d'Ethan, 27/08 au soir, prise sur pièce.**
Ce document a demandé pendant une journée que la matière touche le milieu des
quatre bords pour qu'un bloc se lise comme un seul gisement. Les quatre fichiers
livrés font l'inverse : **sujets isolés, bordure de 2 gros pixels vides comme
tout le reste**, et un bloc de trois cases montre trois gisements distincts. Une
case, un gisement.

Conséquence directe : **les champs ne sont plus une exception à A7.** Les deux
sols le restent, seuls.

Le quartz est un bouquet de cristaux, `#3E454C` · `#9FB3C5` · `#C1CEDA`. La
scorie est une masse veinée de braises, `#382E47` · `#4E4160` · `#F5B636` — la
seule couleur d'accent du décor, à surveiller si le combat s'en sert pour le feu.

### 2.3 Les obstacles (6) — *ex-lot 2, absorbé ici le 27/08*

`obs_infanterie_a.png` · `_b.png` · `obs_vehicule_a.png` · `_b.png` ·
`obs_les_deux_a.png` · `_b.png`

`OBSTACLES` de `combat.js` : dix cases dispersées, trois types, traversables —
elles ralentissent (`diviseurVitesse: 2.5`) et interdisent de POSER, elles ne
bloquent personne. L'aviation les ignore.

| Type | Matière | Ce que ça doit dire |
|---|---|---|
| `infanterie` | fourré sec | gêne l'homme à pied, pas la chenille |
| `vehicule` | nappe de pétrole | gêne la chenille, pas l'homme |
| `les_deux` | chaos rocheux | gêne tout ce qui touche le sol |

L'attribution matière → type a été tranchée faute d'instruction et **se défait en
une ligne** : ce qui empêtre un homme laisse passer une chenille, ce qui fait
patiner une chenille se contourne à pied, ce qui est haut et dur arrête les deux.

Chaque obstacle est **isolé sur sa case** — ils ne se raccordent jamais entre eux,
donc ils gardent la marge normale d'A7 : bordure de 2 gros pixels vides, emprise
≤ 28 × 28. Deux variantes chacun : dix obstacles tirés dans trois types, sans
variante on voit le motif au premier raid.

⚠ Un obstacle **ne porte jamais de couleur d'accent** — il ne tue rien.

### 2.4 [RÉÉCRIT 27/08] La carte monde — ce que ce lot ne sert PAS

**Ce que disait la v3, et qui était faux.** La carte montrait entre 6 × 12 et
24 × 48 cases, soit une case entre 68 et 17 px CSS sur 412 px de large ; elle
pavait des tuiles de terrain ; il fallait une exception `imageSmoothingEnabled` en
dessous de 24 px. Rien de tout cela ne tient : le modèle avait été déduit d'un
raisonnement sur le zoom, pas d'une mesure sur la référence.

**Ce que dit la mesure.** Deux captures de la référence, prises aux deux bouts du
zoom, écart entre deux emblèmes voisins en pixels physiques (téléphone en DPR 3,
viewport de 412 px CSS) :

| Capture | Écart en largeur | Écart en hauteur | Case en px CSS |
|---|---|---|---|
| Zoom serré | ~300 px | ~220 px | **100 × 73** |
| Zoom large | ~141 px | ~106 px | **47 × 35** |

Trois faits en sortent, tous vérifiables sur les captures :

1. **La plage réelle est 47 → 100 px CSS par case**, pas 17 → 68. Il n'y a jamais
   de case minuscule : le dézoom s'arrête bien avant.
2. **Chaque case occupée porte UN objet et un seul** — un emblème de site, avec
   son étiquette de niveau posée en texte par-dessus. Pas de bâtiment, pas de
   tourelle, pas d'unité, pas d'objet « ressource » séparé : la ressource d'un
   camp est dessinée DANS l'emblème du camp.
3. **Le fond n'est pas un pavage de cases.** C'est une texture continue, sans
   correspondance visible avec la grille ; les frontières d'alliance sont une
   surcouche tracée par-dessus.

Observation notée, non adoptée : le rapport largeur/hauteur de la case vaut 0,73
dans les DEUX captures, indépendamment du zoom — la référence compresse
verticalement sa grille. **Foyer Zéro garde une grille carrée** (§1.1 de la
fiche, « la grille reste carrée à l'écran »). Si ce point se rouvre un jour, il
se rouvre comme un arbitrage explicite, pas par imitation.

**Ce qui est tranché [27/08, Ethan].**

- **Le fond de carte est procédural**, à zéro fichier : bruit fractal en trois
  teintes de la palette, déterministe sur la graine de la carte, dessiné au
  canvas. Une carte de 30 × 300 cases fait 1 410 × 14 100 px CSS au zoom large :
  aucune image ne couvre ça, et de grandes tuiles de fond auraient rouvert le
  problème de couture qu'on vient de fermer. Le hors-couloir est un traitement
  du même fond, pas une tuile (§2.2).
- **Rien du lot 1 ne s'affiche sur la carte.** Ni les deux sols, ni les champs,
  ni les obstacles : ils décrivent les 162 cases d'un champ de bataille, pas les
  9 000 d'un monde.
- **La grille 32 × 32 / fichier 128 × 128 reste la règle du projet**, et elle est
  maintenant justifiée par le seul rendu qui l'emploie : 40 px CSS au combat.

**Ce qui reste ouvert, et qu'il ne faut pas trancher en passant.** À 47–100 px
CSS, un emblème de carte est demandé entre 141 et 300 px physiques. Sur une
grille 32, cela fait des pixels logiques de **4,4 à 9,4 px** — trois à sept fois
plus gros qu'au combat. C'est tenable comme parti pris assumé ; ce n'est pas le
même objet visuel qu'une unité vue à 40 px. Deux options, à trancher **sur
pièce, au premier jet de S10**, et pas avant :

- *garder 32/128 partout* — cohérence totale, emblèmes très gros grain ;
- *une grille dédiée aux 13 fichiers du lot 6* (48/192 ou 64/256) — grain
  comparable au combat, au prix de la règle « une seule grille », pour des
  fichiers qui n'apparaissent jamais à côté d'une unité.

Note de rendu, la seule qui survit : au zoom maximum l'emblème est agrandi d'un
facteur non entier (300 / 128 = 2,34). En nearest, pixels logiques inégaux.
**Plafonner le zoom carte au ratio exact** — 128 px physiques par case, soit
~43 px CSS — reste la recommandation, exactement comme dans la v3. Il n'y a en
revanche **plus aucune exception `imageSmoothingEnabled`** : elle n'existait que
pour le pavage au dézoom, qui n'existe plus.

---

## 3. Lot 3 — Unités offensives (28 fichiers)

> **[27/08]** Les 6 obstacles de combat qui occupaient le §3.1 ont rejoint le
> lot 1 (§2.3) : ils se posent sur le sol de base, ils se génèrent avec lui, et
> ils se jugent dans la même scène. Le lot 2 n'existe plus comme lot.

### 3.2 Les quatorze unités, dans les deux grammaires (28)

Chaque ligne donne deux fichiers : `off_j_<cle>.png` (joueur, rampe kaki, armée
régulière) et `off_o_<cle>.png` (Ouvrage, rampe ennemie, radial + pattes +
accent émis).

| Clé | Joueur | Ouvrage | Châssis | Accent | Points → empreinte · pièces |
|---|---|---|---|---|---|
| `meute` | Fusiliers | Meute | escouade | **ai** blanc | 5 → 18 × 18 · 3 figures |
| `guetteur` | Voltigeurs | Guetteur | escouade | **ai** blanc | 10 → 24 × 24 · 5 figures |
| `perceurs` | Grenadiers | Perceurs | escouade | **aa** jaune | 5 → 18 × 18 · 3 figures |
| `fouisseurs` | Sapeurs | Fouisseurs | escouade | **aa** jaune | 10 → 24 × 24 · 5 figures |
| `carapace` | Cuirassiers | Carapace | escouade | **av** rouge | 10 → 24 × 24 · 5 figures |
| `ratisseur` | Éclaireur | Ratisseur | blindé | **ai** blanc | 10 → 24 × 24 · 1 tube |
| `fendeur` | Chasseur | Fendeur | blindé | **av** rouge | 10 → 24 × 24 · 1 tube |
| `broyeur` | Percheron | Broyeur | blindé | **av** rouge | 15 → 28 × 28 · **2 tubes** |
| `belier` | Pionnier | Bélier | blindé | **aa** jaune | 10 → 24 × 24 · 1 tube |
| `pilon` | Obusier | Pilon | blindé | **aa** jaune | 15 → 28 × 28 · **2 tubes** |
| `crecelle` | Milan | Crécelle | aéronef | **ai** blanc | 10 → 24 × 24 · 3 modules |
| `busard` | Épervier | Busard | aéronef | **av** rouge | 10 → 24 × 24 · 3 modules |
| `frappeur` | Foudre | Frappeur | aéronef | **aa** jaune | 10 → 24 × 24 · 3 modules |
| `enclume` | Albatros | Enclume | aéronef | **aa** jaune | 15 → 28 × 28 · **5 modules** |

**Pourquoi l'anti-structure est jaune.** Il n'y a que trois accents, et la
troisième colonne de dégâts s'appelle `structureOuAviation` : elle vaut
structure en attaque et aviation en défense (`combat.js`, règle de bascule).
Le jaune désigne donc la troisième colonne, pas « l'anti-aérien » — et c'est
justement ce qui fait que la même unité garde son accent des deux côtés du
champ. Aucune variante de couleur à produire pour la garnison.

**Longue portée.** Le Guetteur (2,5) et tous les blindés à 2,5 portent le tube
long du §5. Ils ne prennent PAS le suffixe `_r`, réservé aux artilleries
défensives à portée minimale.

**Les pièces se comptent, la taille se voit.** La dernière colonne porte les deux
signaux d'A6. Le nombre de figures, de tubes ou de modules est le signal fiable à
40 px ; l'empreinte est le signal d'appoint. Ne jamais rétrécir la pièce pour
tenir dans l'empreinte : c'est l'empreinte qui suit le nombre de pièces.

**Vitesse et masse ne se dessinent pas.** Le Frappeur à 240 milli-cases/tick et
le Pilon à 60 se distinguent au mouvement, pas au sprite. Ne pas essayer de coder
la vitesse dans la forme : `FICHE-STYLE.md` §1.3, la forme code la classe.

### 3.3 Tout est monolithique

Révisé le 26/08 (amendement A5) : les défenses ne sont plus exportées en
couches. **Un fichier par entité, partout.** Le recul au tir s'applique à
l'entité entière — 2 à 3 px pour une unité mobile, 1 px pour une défense
ancrée, pour qu'elle ne semble pas glisser.

### 3.4 [TRANCHÉ 26/08] Les défenseurs se retournent au rendu — 0 fichier

Huit des quatorze unités garnissent une défense (`defense.present: true`) :
`meute`, `guetteur`, `perceurs`, `carapace`, `ratisseur`, `fendeur`, `broyeur`,
`belier`. Dessinées vers le haut, elles tournent le dos à l'assaut.

**Arbitrage : aucun sprite supplémentaire.** Le retournement se fait au rendu,
selon le tableau d'A4 — rotation par pas de 90° pour les véhicules, miroir
vertical pour l'infanterie, rien pour le reste.

Trois conditions, non négociables, sans lesquelles l'arbitrage tombe :

1. **Boîte englobante dans un carré centré de 28 × 28** (A7). Un canon collé au
   bord déborde sur la case voisine dès le premier quart de tour.
2. **Flanc plafonné à 2 gros pixels** pour les quatorze unités — régime B d'A7.
   C'est ce qui garde l'erreur de perspective sous les 6 % de la case quand
   elles tournent.
3. **Aucun éclairage de scène cuit dans le sprite.** Le gradient du §5 est
   fonctionnel (l'avant est clair parce que c'est l'avant), jamais directionnel
   (« le soleil vient d'en haut à gauche »). Un sprite éclairé de biais devient
   faux dès qu'il tourne. À vérifier sur chaque jet.

Le flanc du régime B n'est pas un compromis subi : il est **sombre**, comme
l'arrière du gradient, et les deux signaux se renforcent au lieu de se
contredire, y compris après retournement. Voir A7.

---

## 4. Lot 4 — Les neuf défenses (18 fichiers)

Neuf structures, construites à l'identique par les deux camps ; seul le module
diffère (`DEFENSES.moduleJoueur` / `moduleOuvrage`). Mais la grammaire de formes,
elle, diffère entièrement — d'où deux jeux complets.

### 4.1 Les neuf entités logiques

| Clé | Joueur | Ouvrage | Type | Accent | Composition |
|---|---|---|---|---|---|
| `merlon` | Mur de défense | Merlon | mur | **aucun** | `mur_corps` |
| `ronce` | Barbelés | Ronce | barrière | **ai** | `barriere_ai_corps` |
| `herse` | Barrière anti-char | Herse | barrière | **av** | `barriere_av_corps` |
| `casemate` | Tourelle mitrailleuse | Casemate | tourelle | **ai** | `tourelle_corps` + `arme_ai` |
| `creneau` | Canon anti-char | Créneau | tourelle | **av** | `tourelle_corps` + `arme_av` |
| `batterie` | DCA | Batterie | tourelle | **aa** | `tourelle_corps` + `arme_aa` |
| `faucheuse` | Mirador | Faucheuse | artillerie | **ai** | `artillerie_corps` + `arme_ai_r` |
| `mortier` | Artillerie lourde | Mortier | artillerie | **av** | `artillerie_corps` + `arme_av_r` |
| `harpon` | SAM | Harpon | artillerie | **aa** | `artillerie_corps` + `arme_aa_r` |

⚠ **Le Merlon ne porte aucun accent.** Il ne tire pas (`degats: null`), il ne tue
rien. `scene.js` le rend déjà sans accent et le §11 l'exige. Les deux barrières,
elles, en portent un : elles ne tirent pas non plus mais leur franchissement est
typé (`degatsFranchissement`), et c'est cette table qui donne leur accent.

⚠ **Les trois artilleries sont des VÉHICULES, pas des structures** (commentaire
de `DEFENSES` dans `combat.js`). Leur socle doit le dire : chenilles claires,
pas de bord-à-bord carré. C'est ce qui explique la part de cibles véhicule d'une
garnison de haut niveau, et le joueur doit pouvoir l'anticiper à l'œil.

### 4.2 Les fichiers réellement à produire (9 par propriétaire)

Révisé le 26/08 : **monolithique** (amendement A5), le tube n'est plus un
fichier séparé.

```
def_<prop>_merlon.png
def_<prop>_ronce.png            def_<prop>_herse.png
def_<prop>_casemate.png         def_<prop>_creneau.png      def_<prop>_batterie.png
def_<prop>_faucheuse.png        def_<prop>_mortier.png      def_<prop>_harpon.png
```

`<prop>` ∈ {`j`, `o`} → **18 fichiers pour 18 entités**, un par ligne de
`DEFENSES`. Le nom de fichier reprend la clé de données (A2) et non le couple
châssis+cible : `def_j_creneau.png` EST la tourelle anti-véhicule, et le lien
avec `src/data/combat.js` reste direct.

Ce que chaque fichier doit porter, et qui n'est plus factorisé par la
composition — donc à rappeler dans chaque prompt :

| Clé | Châssis | Tube | Accent |
|---|---|---|---|
| `merlon` | mur | aucun | **aucun** — il ne tire pas |
| `ronce` | barrière | aucun | blanc (`degatsFranchissement` anti-infanterie) |
| `herse` | barrière | aucun | rouge (anti-véhicule) |
| `casemate` | tourelle | double fin, court | blanc |
| `creneau` | tourelle | simple épais, long | rouge |
| `batterie` | tourelle | simple fin, incliné | jaune |
| `faucheuse` | véhicule | double fin **rallongé de moitié** | blanc |
| `mortier` | véhicule | simple épais **rallongé** | rouge |
| `harpon` | véhicule | simple fin **rallongé** | jaune |

⚠ Les trois artilleries sont des **véhicules**, pas des structures : caisse +
chenilles claires, empreinte allongée verticalement. Leur `porteeMini: 3.5` est
ce que le tube rallongé annonce — c'est une portée MINIMALE, pas un bonus.

L'étalon `art/etalon/joueur/` reste la référence de lecture (silhouettes,
proportions, contraste), mais ses fichiers ne se recyclent plus tels quels :
ils sont en couches, le nouveau pipeline ne l'est pas.

---

## 5. Lot 5 — Bâtiments (16 fichiers) et états de réparation (7)

### 5.1 Les onze du joueur (`BASE_BATIMENTS`)

| Fichier | Nom affiché | Rôle | PV niv. 1 |
|---|---|---|---|
| `bat_j_chantier_de_construction.png` | Chantier de construction | **central** — sa chute rase la base | 5 500 |
| `bat_j_centre_de_commandement.png` | Centre de commandement | QG offensif | 3 000 |
| `bat_j_qg_de_defense.png` | QG de défense | QG défensif | 3 000 |
| `bat_j_complexe_de_defense.png` | Complexe de défense | réparation | 2 500 |
| `bat_j_caserne.png` | Caserne | produit les escouades | 2 500 |
| `bat_j_usine.png` | Usine | produit les blindés | 2 500 |
| `bat_j_aerodrome.png` | Aérodrome | produit les aéronefs | 2 500 |
| `bat_j_centrale.png` | Centrale | produit l'électricité | 2 000 |
| `bat_j_collecteur.png` | Collecteur | produit quartz/scorie | 1 500 |
| `bat_j_raffinerie.png` | Raffinerie | stocke quartz/scorie | 1 000 |
| `bat_j_accumulateur.png` | Accumulateur | stocke l'électricité | 1 000 |

Les PV donnent l'échelle d'empreinte : le Chantier à 5 500 doit peser deux fois
et demie l'Accumulateur à 1 000, exactement comme le §7 fait peser une unité à
15 points plus qu'une à 5.

Les trois bâtiments de production doivent porter **le châssis qu'ils sortent** —
la Caserne une escouade, l'Usine un blindé, l'Aérodrome un aéronef. C'est
gratuit et ça supprime un texte d'interface.

Les deux couples réciproques de `DEBITS` — centrale ↔ accumulateur, collecteur ↔
raffinerie — doivent se lire comme des paires : même sous-forme, même prise, de
sorte que le joueur devine l'adjacence avant qu'on la lui explique. C'est tout
l'intérêt du voisinage à huit cases.

### 5.2 Les cinq de l'Ouvrage (`BATIMENTS` de `sites.js`)

| Fichier | Nom | Rôle | PV | Ressource |
|---|---|---|---|---|
| `bat_o_souche.png` | Souche | **unique** — sa destruction rase le site | 5 500 | quartz |
| `bat_o_etai.png` | Étai | **unique** — sa chute bloque la réparation des défenses | 2 500 | quartz |
| `bat_o_noeud.png` | Nœud | 40 % du bâti | 1 500 | quartz + scorie |
| `bat_o_gangue.png` | Gangue | 30 % du bâti | 1 000 | quartz |
| `bat_o_terril.png` | Terril | 30 % du bâti | 1 000 | scorie |

Gangue et Terril ont les mêmes PV, la même part et le même rôle : **seule la
ressource les distingue.** Elles doivent donc partager la forme et ne différer
que par la matière stockée — c'est le seul endroit du jeu où la matière porte
l'information, et elle doit trancher immédiatement.

Quatre de ces cinq ont un pendant chez le joueur (Souche ↔ Chantier, Étai ↔
Complexe de défense, Nœud ↔ Collecteur, Gangue ↔ Raffinerie). Le pendant doit
être **reconnaissable en fonction, illisible en style** : même silhouette
générale, grammaire opposée. C'est ce qui vend l'Ouvrage comme une contrefaçon
automatisée de ce que le joueur reconstruit.

### 5.3 Le Foyer — [REPORTÉ 26/08]

`bat_o_foyer_zero.png`. `GEOGRAPHIE.baseTerminale` pose une base à 25 cases du
bord haut, colonne centrale ; le §12 de `FICHE-STYLE.md` veut **un creuset qui
rayonne, pas une citadelle**. Reste ouvert : cette base porte-t-elle un bâtiment
propre, ou est-ce une base ordinaire de niveau 50 ?

**Aucune urgence** — c'est le dernier écran du jeu et rien en amont n'en
dépend. À rouvrir quand la fin de partie sera conçue. Non compté dans les 158.

### 5.4 [TRANCHÉ 26/08] Cinq états de réparation — 7 fichiers

Le butin est proportionnel aux dégâts, la réparation est le cœur de l'économie :
l'état d'un bâtiment est une information de premier plan et doit se lire d'un
coup d'œil, sans barre de PV.

| État | PV | Rendu |
|---|---|---|
| 1 — bon état | 100 % | sprite nu, aucune surcouche |
| 2 — abîmé | 80 % → 99,99 % | `dmg_1_abime.png` par-dessus |
| 3 — très abîmé | 30 % → 79,99 % | `dmg_2_tres_abime.png` |
| 4 — partiellement détruit | 1 PV → 29,99 % | `dmg_3_partiel.png` |
| 5 — détruit | 0 PV | le sprite est **remplacé** par une ruine |

**Trois surcouches, pas dix-sept.** Aucun bâtiment n'occupe plus d'une case
(rien dans `base.js` ni `sites.js` ne déclare d'empreinte multi-cases) : une
surcouche 128 × 128 se pose sur n'importe quel bâtiment, n'importe quelle
défense, des deux côtés. Elles sont **neutres** — suie, brèches, tôles
arrachées, trous ouverts sur du noir — donc hors des deux rampes, ce qui est
justement ce qui les rend universelles.

**Quatre ruines**, parce qu'un tas de décombres kaki et un tas de décombres
anodisé ne sont pas le même tas, et qu'une ruine unique répétée sur une base
entière se voit immédiatement :

```
dmg_1_abime.png   dmg_2_tres_abime.png   dmg_3_partiel.png
dmg_4_ruine_j_a.png   dmg_4_ruine_j_b.png
dmg_4_ruine_o_a.png   dmg_4_ruine_o_b.png
```

Progression à tenir d'un état au suivant : 2 = suie et tôles tordues, la
silhouette intacte ; 3 = une brèche ouverte, un pan effondré, la silhouette
entamée ; 4 = la moitié de la surface éventrée, structure visible à travers.
Si les états 2 et 3 se confondent à 40 px, la surcouche a raté son seul travail.

---

## 6. Lot 6 — La carte (13 fichiers)

> **[REQUALIFIÉ 27/08.]** Depuis la réécriture du §2.4, ces 13 fichiers ne sont
> plus des marqueurs posés sur un décor de tuiles : **ils SONT la carte.** Tout
> le reste de la vue est procédural — le fond, les frontières, les niveaux, les
> rayons, les halos de propriété. Un joueur qui ouvre la carte ne voit que ces
> treize dessins et du texte.
>
> Trois conséquences qui n'étaient pas dans la v3 :
>
> 1. **L'emblème porte la signature de son terrain.** C'est la seule chose qui
>    reste du terrain à l'échelle de la carte : un camp posé sur de la scorie doit
>    se lire comme tel avant qu'on clique dessus. La ressource se dessine DANS
>    l'emblème, jamais à côté.
> 2. **Chacun se juge à 47–100 px CSS**, pas à 40. Le protocole de contrôle du §6
>    du brief — vignettes à 40 px — est le mauvais gabarit pour ce lot seul : le
>    juger à 47 et à 100.
> 3. **La grille de ce lot n'est pas tranchée** (§2.4, dernier point). Le premier
>    jet de S10 sert d'arbitrage, comme les dettes 1, 2, 4 et 5 du §8.

### 6.1 Marqueurs de site (6)

`TYPES_SITE` de `sites.js` en donne trois, la géographie en ajoute trois.

| Fichier | Ce que c'est | Signe distinctif |
|---|---|---|
| `poi_camp.png` | camp de l'Ouvrage | indexé sur le niveau du joueur, filet de sécurité, respawn |
| `poi_avant_poste.png` | avant-poste de l'Ouvrage | butin ×3,25, indexé sur le rayon, respawn |
| `poi_base_ouvrage.png` | base de l'Ouvrage | **la seule qui attaque**, dès le niveau 10 |
| `poi_base_joueur.png` | base du joueur | départ strate 5, 25 cases du bord bas |
| `poi_avant_poste_joueur.png` | avant-poste du joueur | 1 à 2 par base, renouvelable |
| `poi_base_terminale.png` | l'objectif | 25 cases du bord haut, colonne centrale |

⚠ Le marqueur de base de l'Ouvrage doit dire **qu'elle attaque** — c'est la
seule information de la carte qui décide où le joueur ose s'installer. Une base
et un avant-poste qui se ressemblent, c'est un joueur qui campe à portée sans le
savoir.

**Ne pas produire** : niveaux et strates (texte, procédural), rayons
d'influence 2 et 3 et rayon d'attaque 10 (cercles, procéduraux), état bloqué
après attaque ou rasage (teinte, procédurale).

### 6.2 [TRANCHÉ 26/08] Les sept POI de bonus (7)

Sept bonus, un par fichier. Les noms ci-dessous sont proposés — ils suivent le
lexique arrêté en Phase 0 et n'empruntent rien à C&C.

| Fichier | Bonus | Lecture visuelle |
|---|---|---|
| `poi_veine_quartz.png` | rendement quartz | affleurement cristallin blanc-gris, même famille que `champ_quartz` mais **concentré et net** |
| `poi_coulee_scorie.png` | rendement scorie | dépôt vitrifié sombre, même famille que `champ_scorie`, **jamais un cristal vert qui pousse** |
| `poi_reacteur.png` | énergie / production | cuve cylindrique éventrée, anneau de refroidissement, la seule chose émissive de la carte |
| `poi_cantonnement.png` | bonus infanterie | baraquements bas alignés, accent **blanc** |
| `poi_parc_roulant.png` | bonus véhicules | dalle béton, traçages, carcasses à chenilles, accent **rouge** |
| `poi_plot_aerien.png` | bonus aérien | cercle d'appontage, mire centrale, accent **jaune** |
| `poi_redoute.png` | bonus défensif | enceinte massive à angles, **aucun tube**, aucun accent — comme le merlon |

Les trois derniers accents ne sont pas décoratifs : ils reprennent à la lettre
la règle absolue du §3 (blanc = infanterie, rouge = véhicule, jaune = aérien) et
disent au joueur, sans texte, quelle branche ce POI renforce.

⚠ Ce que ces sept fichiers **ne disent pas** : combien ils donnent, ni s'ils
sont pris. Le montant est du texte, la propriété est une teinte de halo — les
deux sont procéduraux. `SYNTHESE-ET-PLAN.md` §4 B point 3 reste à remplir côté
règles ; les sprites, eux, ne dépendent plus de lui.

---

## 7. Lot 7 — Interface (41 fichiers)

### 7.1 Ressources (3)

`ui_quartz.png` · `ui_scorie.png` · `ui_electricite.png`

Le quartz et la scorie se lisent aussi en `champ_quartz` et `champ_scorie` :
mêmes matières, deux échelles. Elles doivent se répondre — l'icône est le
gisement vu de près. *(Renommé le 27/08 : `tile_affleurement` et `tile_croute`
n'existent plus, §2.)*

### 7.2 Compteurs (4)

`ui_point_attaque.png` — plafond 100 → 600, régénération 20 → 120/h
`ui_point_armee_offense.png` — adossé au Centre de commandement
`ui_point_armee_defense.png` — adossé au QG de défense
`ui_point_recherche.png` — pris sur les défenses détruites, jamais produit

Les deux points d'armée sont **deux budgets distincts et non fongibles** ; s'ils
se ressemblent, le joueur croira pouvoir dépenser l'un pour l'autre.

### 7.3 Cibles et châssis (6)

`ui_cible_ai.png` · `ui_cible_av.png` · `ui_cible_aa.png`
`ui_chassis_escouade.png` · `ui_chassis_blinde.png` · `ui_chassis_aeronef.png`

Les trois icônes de cible **sont** la légende de la règle d'accent. Elles
reprennent exactement les couples du §3 de la fiche, sans variation.

### 7.4 Catégories de défense (4)

`ui_categorie_mur.png` · `ui_categorie_barriere.png` ·
`ui_categorie_tourelle.png` · `ui_categorie_artillerie.png`

Ce sont les quatre entrées de `DISPOSITION_DEFENSES.ordreCategories` (`unite`
étant la cinquième, déjà couverte par les icônes de châssis). Elles servent
l'éditeur de garnison et l'indice de couverture.

### 7.5 Les quatorze modules (14)

Un par entrée de `MODULES`. Ce sont les cartes de l'arbre de recherche.

```
ui_module_fumigene.png              ui_module_camouflage.png
ui_module_emp.png                   ui_module_munition_speciale.png
ui_module_tir_de_barrage.png        ui_module_vol_de_vie.png
ui_module_booster.png               ui_module_pv_plus_vingt.png
ui_module_garnison.png              ui_module_rayon_mini_moins_un.png
ui_module_ecraseur.png              ui_module_rayon_plus_un.png
ui_module_auto_reparation.png       ui_module_bouclier.png
```

⚠ `MODULES` est un **glossaire : il ne dit pas qui porte quoi.** Les
affectations sont dans `UNITES[x].module` / `moduleOuvrage` et
`DEFENSES[x].moduleJoueur` / `moduleOuvrage`. Un module peut donc apparaître
sur une unité du joueur et sur une défense de l'Ouvrage : l'icône doit dire
**l'effet**, jamais le porteur, sous peine d'être fausse la moitié du temps.

### 7.6 États et actions (10)

```
ui_pv.png              ui_degats.png         ui_butin.png
ui_reparation.png      ui_temps.png          ui_niveau.png
ui_verrou.png          ui_emplacement.png    ui_vague.png
ui_budget.png
```

`ui_verrou.png` sert les trois défauts de composition — `verrouilles` en
défense, `verrouillees` à l'Arsenal, `depassementBudget` et `surObstacle`. La
doctrine du §4.5 de la passation est que **rien ne se retire en silence** :
l'icône signale, elle n'ampute pas.

---

## 8. Dette DA — statut au 27/08

| # | Dette | Statut | Traitement |
|---|---|---|---|
| 1 | **La rampe ennemie 5 tons n'est pas inscrite dans la fiche.** | **premier jet, puis validation** | Deux rampes candidates proposées dans `BRIEF-SPRITES-IA.md` §5, générées côte à côte sur la même entité. Ethan tranche sur pièce, la gagnante entre dans `FICHE-STYLE.md` §3. |
| 2 | **La forme volante de l'Ouvrage — le Dard — n'existe pas.** | **premier jet, puis validation** | Forme proposée au §5 du brief : trois modules identiques en triangle radial autour d'un moyeu, aucune aile portante. Bloque les quatre `off_o_*` aéronefs, donc tout l'anti-aérien du joueur. |
| 0 | **Le lot 1 servait la mauvaise surface.** | **soldé 27/08, au prix d'un lot entier** | 29 tuiles produites pour la carte du monde alors que le besoin était le sol du combat. Cause : une phrase de couplage jamais vérifiée contre le code (§2). Règle qui en sort : **avant un lot, mesurer la surface qu'il couvre** — combien de cases, à quel rendu, vues comment. Deux minutes de `grep` dans `src/data/`. |
| 0 bis | **Une planche isolée ne montre pas le jeu.** | **soldé 27/08** | Sept textures qui se distinguaient très bien une par une donnaient une scène où la scorie avalait les défenses de l'Ouvrage. **La composition devient un contrôle obligatoire du §6 du brief, AVANT validation d'un lot, jamais après.** |
| 3 | **Modèle de la carte monde.** | **retranché 27/08** | §2.4 réécrit sur MESURE et non plus sur déduction : fond continu procédural, un emblème par case occupée, aucune tuile. La v3 se trompait de modèle, et c'est ce qui bloquait les sessions. |
| 3 bis | **Grille des 13 emblèmes du lot 6.** | **ouvert — premier jet** | À 47–100 px CSS, une grille 32 donne des pixels logiques de 4,4 à 9,4 px. Garder 32/128 partout, ou une grille dédiée 48/192 ou 64/256 pour ce lot seul. Tranché sur pièce au premier jet de S10, §2.4. |
| 4 | Marcheur : pattes trop fines, se confond avec le pylône à 40 px. | **premier jet** | Correction à imposer dans le prompt : pattes de 2 px logiques minimum, plus courtes, trois pattes radiales, corps massif. |
| 5 | Casques d'infanterie neutres ; dôme de tourelle qui mange le socle. | **premier jet** | Casque = accent plein sur chaque figure. Dôme ≤ 60 % de la largeur du socle, anneau d'accent visible sur tout son pourtour. |

Les points 1, 2, 4 et 5 se soldent **par la génération elle-même** : c'est le
premier jet d'essai qui sert d'arbitrage, pas une décision écrite en amont. Le
protocole d'essai est au §6 du brief.

---

## 9. Ordre de production

Le pipeline a changé : plus de composition Python, **génération par modèle
d'image en 128 × 128**, selon `BRIEF-SPRITES-IA.md`. L'ordre suit les
dépendances.

0. **Jet d'essai** (§6 du brief) — sept images qui tranchent les dettes 1, 2, 4
   et 5 d'un coup. Rien d'autre ne se génère avant qu'il soit validé.
1. **Lot 1, sol de base et éléments posés** (18) — le sol des 162 cases et ce qui
   s'y pose. Il sert le combat et lui seul. Indépendant du reste, et le seul lot
   où le modèle travaille sans contrainte de silhouette. **Sa validation passe
   par une scène composée, pas par des planches isolées** (§8, dette 0 bis).
2. **Lot 3, unités** (28) — le plus visible, et celui qui fige la rampe ennemie
   pour tous les suivants.
3. **Lot 4, défenses** (18) — même grammaire que les unités, il en hérite.
4. **Lot 5, bâtiments** (16) — dépend des deux grammaires, donc vient après.
5. **Lot 6, carte** (13) — **remonté le 27/08**, de l'avant-dernière place à
   celle-ci. Il porte désormais l'intégralité du visuel de la carte (§6), et il
   emprunte sa grammaire aux bâtiments : un emblème de base est une base lue de
   loin. Il ne pouvait donc pas passer avant le lot 5, mais il n'a plus rien à
   faire après les états de réparation et les obstacles.
6. **Lot 5 bis, états de réparation** (7) — se juge SUR les bâtiments finis, pas
   dans le vide.
7. **Lot 7, interface** (41) — en dernier : une icône de module se dessine
   d'après le module fini, une icône de châssis d'après le châssis fini.

Livraison inchangée : `out/sprites/`, ZIP versionné, un lot par archive.

---

## 10. Ce qu'il ne faut PAS produire

Liste défensive : chacune de ces lignes a une raison écrite quelque part, et
chacune reviendra dans une conversation future si elle n'est pas notée ici.

- **Aucun sprite d'effet, SAUF les explosions** — amendé le 30/08, voir §8.
  Impacts, éclairs de bouche, mort, particules, traînées : procéduraux, comme
  avant. Les explosions sont produites, les projectiles ne le sont pas.
- **Aucune ombre portée.** Elle n'est plus cuite dans le sprite depuis la v4 du
  générateur ; elle se trace au rendu, et son décalage est le seul signal
  d'altitude (§6).
- **Aucune barre de PV, aucun cadre de sélection.** `scene.js` les émet en
  primitives et son T5 compte ces primitives.
- **Aucune seconde orientation DESSINÉE.** Depuis l'amendement A4, la rotation
  et le miroir au RENDU sont libres (§3.4) ; ce qui reste interdit, c'est de
  produire un second fichier pour la même entité tournée.
- **Aucun éclairage directionnel cuit dans le sprite.** Corollaire d'A4 : un
  sprite éclairé « d'en haut à gauche » devient faux dès la première rotation.
  Les deux seuls écarts de valeur autorisés sont fonctionnels : l'avant est
  clair parce que c'est l'avant, le flanc est sombre parce que c'est un flanc.
- **Aucun dépassement de case.** Flanc, canon, antenne compris : tout tient dans
  28 × 28 gros pixels sur 32 (A7). Les tuiles de terrain sont la seule exception,
  elles font 32 × 32 bord à bord.
- **Aucune isométrie.** L'inclinaison à 75° se dessine DANS le sprite ; la grille,
  elle, reste carrée et non tournée. Compresser ou incliner la grille est le
  contresens à ne pas faire.
- **Aucun flanc au-delà de 2 gros pixels sur une unité.** Régime B d'A7 : c'est
  la contrepartie de la rotation et du miroir.
- **Aucune planche d'animation** tant qu'une transformation suffit. Si une
  planche devient nécessaire, l'invariant d'Archipel s'applique : **frame 0
  pixel-pour-pixel identique au sprite statique.**
- **Aucun sprite hors grammaire.** La « composition » du §1.5 de la fiche
  décrivait un générateur Python qui n'est plus le pipeline. Le principe
  survit et se reformule : une entité nouvelle est un enregistrement
  `{châssis, arme, rôle, taille}` déjà couvert par les axes existants, jamais une
  invention isolée. Un prompt qui ne se déduit pas de ces quatre champs décrit
  une entité qui n'a pas sa place.
- **Aucun texte, aucun chiffre, aucun logo dans un sprite.** Niveaux, coûts,
  quantités, propriétaire d'un POI : tout ça est du texte procédural posé par
  l'interface. Un modèle d'image en ajoutera spontanément — c'est le motif de
  rejet le plus fréquent d'un jet.
- **Aucune reprise de Command & Conquer.** Ni tibérium, ni Mammoth, ni GDI/Nod,
  ni silhouette reconnaissable. Les noms TA de `src/data/` sont une traçabilité
  interne, **pas une référence visuelle** : `broyeur.ta === 'Mammoth'` ne
  légitime rien.
- **Aucune tuile par terrain au combat.** Le champ de bataille a DEUX états —
  nu, ou champ posé — et `ressourceDeLaCase` est la ligne qui fait foi. Sept
  matières de sol, c'est la carte du monde, et ce n'est pas ce lot.
- **Aucun masque de transition.** Ils supposaient des terrains adjacents
  différents. Sur un sol unique il n'y a rien à raccorder — ne pas les rouvrir
  « en procédural », ils n'ont plus d'objet.
- **Aucune tuile de terrain sur la carte monde**, et aucun fond de carte en
  fichier. Le fond est procédural (§2.4). C'est la ligne qui a coûté le plus de
  sessions : elle revient dès qu'on relit « la carte et le combat lisent les
  mêmes fichiers » quelque part.
- **Aucun objet ressource posé à côté d'un site sur la carte.** La ressource d'un
  camp se dessine DANS l'emblème du camp (§6). Un champ séparé est une lecture
  fausse de la référence.
- **Aucun décor de présentation.** Sol, socle, vignette, cadre, ombre au sol,
  reflet, « mise en scène » : le sprite est découpé sur fond vide et rien
  d'autre ne doit s'y trouver. Même motif : le modèle en produira par défaut.

---

*v5 — 27/08/2026, soir. Refonte du lot 1 : le champ de bataille a deux états de
terrain, pas sept. Sol de base 8 + champs 4 + obstacles 6 = 18 fichiers ; le
lot 2 est absorbé ; les 8 masques de transition sont supprimés ; A8 ajouté.
Total 157 → **141**. Voir `PASSATION-2026-08-27.md` §3, qui est la source de
cette correction, et `RAPPORT-lotSOL-refonte-du-lot-1.md`.*

*v4 — 27/08/2026. Correction du modèle de carte : §2 (ouverture), §2.2, §2.3,
§2.4 (réécrit), §6 (requalifié), §8 (dettes 3 et 3 bis), §9 (ordre), §10. Total
158 → 157, lot 1 29 → 28. Le fond de carte devient procédural. Voir
`RAPPORT-lotEMBLEME-carte-monde.md`.*

*v3 — 26/08/2026. Arbitrages §2.4, §3.4, §5.3, §5.4, §6.2 tranchés par Ethan.
Amendements ajoutés : A4 (deux transformations au rendu, et seulement deux),
A5 (défenses monolithiques), A6 (empreintes 18/24/28 + compteur de pièces), A7 (top-down à 75°,
non-dépassement absolu, trois régimes d'inclinaison). Pipeline basculé sur
génération par modèle d'image, cf. `BRIEF-SPRITES-IA.md`. A7 modifie le §1.1 de
`FICHE-STYLE.md`, qui est son premier principe non négociable : la fiche doit
être amendée avant la première génération, pas après.*
