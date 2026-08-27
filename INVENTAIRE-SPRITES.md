# INVENTAIRE-SPRITES.md — Foyer Zéro

> Liste exhaustive des sprites à produire, extraite de `src/data/` le 26/08/2026,
> remise au propre le 27/08. Ce document ne dit pas COMMENT dessiner : il dit
> **ce qu'il faut dessiner, sous quel nom de fichier, et selon quelles
> conventions.**
>
> **Hiérarchie des quatre documents sprite** — `FICHE-STYLE.md` fait foi sur le
> style ; **ce document fait foi sur la liste et sur les conventions de
> nommage et de rendu** ; `BRIEF-SPRITES-IA.md` dit comment le demander à un
> modèle d'image ; `PLAN-PRODUCTION-SPRITES.md` dit dans quel ordre et où on en
> est. Aucune règle de préséance entre eux : depuis le 27/08 ils ne se
> contredisent plus.
>
> **Provenance de chaque ligne.** Aucune entrée n'est inventée : les unités et
> les défenses viennent de `UNITES` et `DEFENSES` de `src/data/combat.js`, les
> bâtiments de site de `BATIMENTS` de `src/data/sites.js`, les bâtiments du
> joueur de `BASE_BATIMENTS` de `src/data/base.js`, les modules de `MODULES`,
> les obstacles d'`OBSTACLES`, les terrains du §9 de `FICHE-STYLE.md`. Les
> seules entrées sans source de données relèvent d'un arbitrage d'Ethan, et
> elles portent sa date.

---

## 0. Total, d'un coup d'œil

| Lot | Contenu | Fichiers |
|---|---|---|
| 1 | Terrain — 7 terrains × 4 variantes + hors-champ | **29** |
| 2 | Obstacles de combat — 3 types × 2 variantes | **6** |
| 3 | Unités offensives — 14 unités × 2 propriétaires | **28** |
| 4 | Défenses — 9 structures × 2 propriétaires, monolithiques | **18** |
| 5 | Bâtiments — 11 joueur + 5 Ouvrage | **16** |
| 5 bis | États de réparation — 3 surcouches + 4 ruines | **7** |
| 6 | Carte — 6 marqueurs + 7 POI de bonus | **13** |
| 7 | Interface | **41** |
| | **À générer** | **158** |

Hors génération :

| Poste | Fichiers | Pourquoi |
|---|---|---|
| Masques de transition `tile_bord_<dir>` | 8 | Ce sont des masques alpha, pas des images. Un modèle d'image ne sait pas les produire : à faire procéduralement au rendu (tramage ordonné sur la bordure). §2.3. |
| `bat_o_foyer_zero.png` | +1 | Reporté, §5.3. Seul poste encore ouvert. |

**Zéro sprite d'effet.** Impacts, explosions, éclairs de bouche, mort,
particules, barres de PV, ombres portées : `FICHE-STYLE.md` §6 et §8 les rendent
en primitives. Ne rien produire pour eux, et ne pas laisser cette ligne
réapparaître dans un devis.

**Format unique.** Un seul format de fichier, **PNG 128 × 128 RGBA**, pour une
grille logique de **32 × 32 gros pixels de 4 px réels**. Aucune seconde taille
nulle part, y compris sur la carte du monde — voir §2.4.

**Destination des fichiers finis : `sprites/`, à la racine du dépôt**, un
sous-dossier par lot — `sprites/terrain/`, `sprites/unites/`, etc. Arrêté le
27/08 en livrant le lot 1. `art/` reste réservé aux **références** : étalons et
sprites de moule, qui ne sont pas des livrables.

⚠ Ne pas remettre les sprites dans `out/sprites/` : c'était le dossier de sortie
du générateur Python, qui n'est plus le pipeline et n'a jamais été commité.

---

## 1. Conventions de nommage et de rendu — A1 à A7

Sept conventions, toutes tranchées par Ethan le 26/08 et **en vigueur**. Elles
ont été portées dans `FICHE-STYLE.md` le 27/08 : la clause de préséance qui
figurait ici et en tête de `BRIEF-SPRITES-IA.md` est donc caduque, il n'y a plus
rien à reporter.

Les étiquettes `A1` à `A7` sont conservées telles quelles. Elles sont citées
dans le brief, dans le plan de production et dans les rapports ; les renommer
échangerait sept références justes contre plusieurs dizaines de mortes.

### A1 — axe propriétaire, en deuxième position

```
off_<prop>_<cle>.png            off_j_meute.png · off_o_meute.png
def_<prop>_<cle>.png            def_j_creneau.png · def_o_creneau.png
bat_<prop>_<cle>.png            bat_j_caserne.png · bat_o_souche.png
```

`<prop>` vaut `j` (joueur) ou `o` (Ouvrage). `tile_`, `obs_`, `poi_`, `dmg_` et
`ui_` n'en portent pas : ils n'appartiennent à personne. Les surcouches de
dégâts sont neutres par construction (§5.4) ; seules les quatre ruines portent
un propriétaire, et il est dans leur suffixe.

Sans cet axe, la convention n'en avait aucun, et `off_meute.png` désignait deux
sprites qui ne partagent ni palette ni grammaire.

### A2 — `<cle>` est la clé du fichier de données, jamais le nom affiché

`off_o_meute.png` et `off_j_meute.png` sont la même ligne de `UNITES` ; le
joueur y lit « Fusiliers », l'Ouvrage « Meute ». Un fichier nommé
`off_j_fusiliers.png` casserait le lien avec `src/data/` et rouvrirait le mélange
des deux jeux de noms que `CLAUDE.md` §4 interdit.

Les clés en camelCase passent en snake_case dans le nom de fichier :
`chantierDeConstruction` → `bat_j_chantier_de_construction.png`.

### A3 — rotation et miroir autorisés pour `tile_*`

L'interdit de rotation vise l'**orientation d'une entité**. Une tuile de terrain
n'a pas d'orientation, et la carte fait 30 × 300 = **9 000 cases** : sans
rotation il faudrait une quinzaine de variantes par terrain pour que le pavage
ne se voie pas. Avec rotation, quatre variantes en donnent seize apparentes.

### A4 — deux transformations au rendu, et seulement deux

La rotation n'est pas libre. Seules deux transformations restent justes quand la
caméra est inclinée à 75° (A7).

| Qui | Transformation | Interdit |
|---|---|---|
| Véhicules (mobiles) | **rotation par pas de 90°** | toute rotation intermédiaire |
| Infanterie | **miroir vertical** (≡ 180°, les figures étant symétriques gauche/droite) | rotation à 90° |
| Tout le reste — bâtiments, défenses ancrées, POI, obstacles, icônes | **aucune** | — |

L'interdit se formule donc : *aucune **seconde orientation dessinée***. On ne
produit jamais un second fichier pour la même entité tournée ; on ne tourne au
rendu que ce qui figure dans ce tableau.

### A5 — les défenses sont monolithiques

L'export en couches (corps + tube séparés) supposait un générateur par
composition, qui garantissait l'alignement au pixel. Un modèle d'image ne le
garantit pas : deux images indépendantes ne se recalent pas. **Une défense = un
fichier.**

Le recul au tir devient un recul de l'entité entière, de 1 px au lieu de 2–3 px
pour le seul tube. C'est le seul effet perdu, et il coûte quatre fichiers de
moins — 18 au lieu de 22.

Corollaire général : **tout est monolithique, partout.** Le recul s'applique à
l'entité entière — 2 à 3 px pour une unité mobile, 1 px pour une défense ancrée,
pour qu'elle ne semble pas glisser.

### A6 — empreintes 18 / 24 / 28, doublées d'un compteur de pièces

Le non-dépassement (A7) plafonne l'empreinte à 28 gros pixels sur 32, marge
comprise. L'échelle est donc **18 / 24 / 28** pour 5 / 10 / 15 points.

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
pixel.

> Mesuré le 27/08 sur `art/joueur/ref_meute.png` : figures de **8 gros pixels de
> haut**, conformes. C'est le gabarit que `guetteur` doit tenir pour en loger
> cinq dans 24 × 24.

⚠ Le §1.3 de la fiche tient toujours : **la forme code la classe**. Le nombre de
pièces code le coût, pas la classe — cinq figures restent une escouade, deux
tubes restent un blindé. On n'ajoute pas un axe, on gradue celui de la taille.

### A7 — vue top-down haute (~75°), non-dépassement absolu

La caméra est à **75° de l'horizontale** (90° serait la verticale exacte) : on
voit le dessus des objets et **une amorce de leur face basse**, rien de plus.

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
   donc rien ne peut masquer rien. Un ordre de dessin par rangée suffit.
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

Le régime B est compatible avec le gradient avant/arrière, et c'est ce qui le
sauve : le flanc dessiné en bas est **sombre**, l'arrière du gradient est
**sombre**, les deux signaux disent la même chose. Après miroir vertical,
l'avant pointe vers le bas et le flanc sombre remonte en haut, où est désormais
l'arrière : toujours juste. C'est la seule raison pour laquelle l'inclinaison et
le retournement des garnisons peuvent coexister.

**Dette assumée.** Un véhicule tourné d'un quart de tour montre son amorce de
flanc sur le côté au lieu du bas. À 2 px logiques sur 32, l'erreur est de 6 % de
la case — présente, non gênante. C'est le prix exact de l'arbitrage, il est
connu, et il ne se paie qu'une fois : plafonner le flanc des unités à 2 px est
ce qui le maintient dans cette fourchette.

---

## 2. Lot 1 — Terrain (29 fichiers + 8 masques procéduraux)

Le plus gros paquet, et celui qui conditionne tout le reste : la carte du monde
et le sol du champ de bataille lisent les **mêmes fichiers**. Un site posé sur
de la croûte se combat sur de la croûte.

### 2.1 Les sept terrains × quatre variantes (28)

Lexique arrêté en Phase 0, `FICHE-STYLE.md` §9. Les variantes se suffixent
`_a`, `_b`, `_c`, `_d`.

| Terrain | Fichiers | Contenu | Rôle de jeu |
|---|---|---|---|
| Stérile | `tile_sterile_a…d.png` | vide | fond majoritaire du couloir |
| Affleurement | `tile_affleurement_a…d.png` | **quartz** | ressource neutre, partout |
| Croûte | `tile_croute_a…d.png` | **scorie** | dépôt de l'Ouvrage ; nourrit `DEBITS.centrale.parVoisin.champDeScorie` |
| Futaie | `tile_futaie_a…d.png` | bois | décor / futur POI |
| Friche | `tile_friche_a…d.png` | broussaille | décor / futur POI |
| Suintement | `tile_suintement_a…d.png` | pétrole | décor / futur POI |
| Vasière | `tile_vasiere_a…d.png` | marais | décor / futur POI |

⚠ **La scorie ne dérive pas vers un cristal vert qui pousse tout seul.** C'est
un dépôt industriel, laissé par l'extension de l'Ouvrage. C'est le point exact
où la reprise C&C se réintroduit sans qu'on la voie.

**Un seul sol, sept matières.** Arrêté le 27/08. Les sept terrains partagent la
**même rampe de sol** (`FICHE-STYLE.md` §3, terre cuite) ; ce qui les distingue
est une matière posée dessus, jamais une teinte de sol différente. Sans cette
règle, sept sols différents se ressemblent tous — c'est ce qu'a produit le
premier jet du lot 1, huit textures de bruit indiscernables les unes des autres.

| Terrain | Matière | Couverture mesurée |
|---|---|---|
| `tile_sterile` | aucune, sol nu | 0 % |
| `tile_friche` | broussaille sèche, en ton de sol clair | 0 % |
| `tile_suintement` | pétrole `#1E2124` | 20 % |
| `tile_futaie` | bois mort `#5B4133` | 21 % |
| `tile_affleurement` | quartz `#9FB3C5` · `#C1CEDA` | 35 % |
| `tile_croute` | scorie `#382E47` | **50 %** |
| `tile_vasiere` | eau croupie `#1F5160` | **53 %** |

⚠ **La couverture est un budget, pas une décoration.** Au-delà d'environ 35 % la
matière cesse d'être posée sur un sol et devient le sol : `tile_croute` et
`tile_vasiere` sont dans ce cas, et sur elles une entité de l'Ouvrage — ardoise
sombre sur scorie ardoise, ou sur eau sombre — redevient difficile à lire. C'est
le défaut symétrique de celui du premier jet. Voir `RAPPORT-S1-terrain.md` §4.

### 2.2 Hors-couloir (1)

`tile_horschamp.png` — ce qui borde le couloir de 30 de large. Une seule tuile,
volontairement muette : elle dit « on ne va pas là », elle ne raconte rien.

### 2.3 Masques de transition (8) — hors génération

`tile_bord_n.png`, `_s.png`, `_e.png`, `_o.png`, `_ne.png`, `_no.png`,
`_se.png`, `_so.png`.

Un seul jeu générique, en niveaux d'alpha, teinté au rendu par la couleur
dominante du terrain voisin. L'alternative — un jeu complet par couple de
terrains — coûterait 7 × 6 × 8 = 336 fichiers pour un gain que personne ne verra
à 17 px par case.

⚠ **Ces huit-là ne se génèrent pas par modèle d'image.** Ce ne sont pas des
images mais des masques alpha : une rampe de transparence régulière, tramée sur
la grille logique. Un générateur d'images produira une jolie texture de bord,
inutilisable comme masque. À faire **procéduralement au rendu** (tramage ordonné
4 × 4 sur les 8 px logiques de bordure), ce qui les fait tomber à zéro fichier.
Ils restent listés ici pour qu'on ne les redécouvre pas plus tard.

### 2.4 Une seule grille, 128 × 128 partout

Tranché le 26/08. La carte **n'a pas à tenir dans l'écran**. À l'ouverture elle
est centrée sur la dernière base du joueur et en montre environ **6 × 12
cases** ; le dézoom descend jusqu'à **24 × 48**. Sur 412 px CSS de large, cela
met la case entre **68 px** (zoom max) et **17 px** (dézoom max).

Conséquence : un fichier 128 × 128 couvre toute la plage, et la seconde grille
16 × 16 qui avait été envisagée n'a plus lieu d'être. **Une seule grille logique
32 × 32, un seul format de fichier 128 × 128, pour tout le projet.**

Deux notes de rendu qui découlent de la plage retenue :

- À 68 px CSS et DPR 3, la tuile est demandée à ~204 px physiques pour 128
  dessinés : agrandissement de 1,6×. En nearest-neighbour il donne des pixels
  logiques inégaux (certains 6 px, d'autres 7). Soit on plafonne le zoom carte à
  ~43 px CSS (= 128 px physiques, ratio exact 1:1), soit on accepte
  l'irrégularité. **Recommandation : plafonner.** Elle ne coûte rien et le rendu
  reste net.
- À 17 px CSS, la tuile est réduite d'un facteur 2,5 : en nearest, le pavage
  moiré. **Passer `imageSmoothingEnabled = true` pour la carte en dessous de
  24 px CSS par case**, et le laisser à `false` au combat. C'est l'unique
  exception de tout le projet et elle est locale à la vue carte.

---

## 3. Lots 2 et 3 — Obstacles et unités offensives (34 fichiers)

### 3.1 Obstacles de combat (6)

`OBSTACLES` de `combat.js` : dix cases dispersées, trois types, traversables —
elles ralentissent (`diviseurVitesse: 2.5`) et interdisent de POSER, elles ne
bloquent personne. L'aviation les ignore.

| Type | Fichiers | Ce que ça doit dire |
|---|---|---|
| `infanterie` | `obs_infanterie_a.png` · `_b.png` | gêne l'homme à pied, pas la chenille |
| `vehicule` | `obs_vehicule_a.png` · `_b.png` | gêne la chenille, pas l'homme |
| `les_deux` | `obs_les_deux_a.png` · `_b.png` | gêne tout ce qui touche le sol |

Deux variantes chacune : dix obstacles tirés dans trois types, sans variante on
voit le motif au premier raid.

⚠ Un obstacle **ne porte jamais de couleur d'accent** — il ne tue rien.

### 3.2 Les quatorze unités, dans les deux grammaires (28)

Chaque ligne donne deux fichiers : `off_j_<cle>.png` (joueur, rampe kaki, armée
régulière) et `off_o_<cle>.png` (Ouvrage, ardoise violacée, radial + pattes +
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
structure en attaque et aviation en défense (`combat.js`, règle de bascule). Le
jaune désigne donc la troisième colonne, pas « l'anti-aérien » — et c'est
justement ce qui fait que la même unité garde son accent des deux côtés du
champ. Aucune variante de couleur à produire pour la garnison.

**Longue portée.** Le Guetteur (2,5) et tous les blindés à 2,5 portent le tube
long. Ils ne prennent PAS le suffixe `_r`, réservé aux artilleries défensives à
portée minimale.

**Les pièces se comptent, la taille se voit.** La dernière colonne porte les deux
signaux d'A6. Le nombre de figures, de tubes ou de modules est le signal fiable à
40 px ; l'empreinte est le signal d'appoint. Ne jamais rétrécir la pièce pour
tenir dans l'empreinte : c'est l'empreinte qui suit le nombre de pièces.

**Vitesse et masse ne se dessinent pas.** Le Frappeur à 240 milli-cases/tick et
le Pilon à 60 se distinguent au mouvement, pas au sprite. Ne pas essayer de coder
la vitesse dans la forme : la forme code la classe.

### 3.3 La grammaire de l'Ouvrage

Le châssis se traduit dans l'autre grammaire, et c'est cette traduction qui porte
toute l'opposition :

| Joueur | Ouvrage | Ce qui change |
|---|---|---|
| infanterie | **essaim** | plus de figures, plus petites, identiques, sans casque distinct — l'accent passe sur le corps |
| véhicule | **marcheur** | pas de chenilles : trois pattes radiales, corps massif au centre |
| tourelle, structure | **pylône** | colonne à modules empilés, symétrie radiale, aucun angle droit |
| aéronef | **Dard** | moyeu central, modules identiques en triangle radial, aucune aile portante |

⚠ **La grammaire de l'Ouvrage répète une pièce ; elle ne dessine pas un objet.**
C'est ce qui la fait lire comme une installation qui s'auto-réplique, et c'est ce
qu'un modèle d'image rate le plus spontanément. Référence de la grammaire réussie :
`art/ouvrage/ref_dard.png`, validé le 27/08 — le premier sprite du projet où la
pièce répétée apparaît réellement.

⚠ **Conséquence acceptée : un Dard n'a pas d'avant.** La symétrie radiale coûte
l'orientation. Le contrôle « l'avant est-il identifiable sans le canon » ne
s'applique pas aux quatre aéronefs de l'Ouvrage.

### 3.4 Les défenseurs se retournent au rendu — 0 fichier

Tranché le 26/08. Huit des quatorze unités garnissent une défense
(`defense.present: true`) : `meute`, `guetteur`, `perceurs`, `carapace`,
`ratisseur`, `fendeur`, `broyeur`, `belier`. Dessinées vers le haut, elles
tournent le dos à l'assaut.

**Aucun sprite supplémentaire.** Le retournement se fait au rendu, selon le
tableau d'A4 — rotation par pas de 90° pour les véhicules, miroir vertical pour
l'infanterie, rien pour le reste.

Trois conditions, non négociables, sans lesquelles l'arbitrage tombe :

1. **Boîte englobante dans un carré centré de 28 × 28** (A7). Un canon collé au
   bord déborde sur la case voisine dès le premier quart de tour.
2. **Flanc plafonné à 2 gros pixels** pour les quatorze unités — régime B d'A7.
   C'est ce qui garde l'erreur de perspective sous les 6 % de la case quand elles
   tournent.
3. **Aucun éclairage de scène cuit dans le sprite.** Le gradient est fonctionnel
   (l'avant est clair parce que c'est l'avant), jamais directionnel (« le soleil
   vient d'en haut à gauche »). Un sprite éclairé de biais devient faux dès qu'il
   tourne. À vérifier sur chaque jet.

---

## 4. Lot 4 — Les neuf défenses (18 fichiers)

Neuf structures, construites à l'identique par les deux camps ; seul le module
diffère (`DEFENSES.moduleJoueur` / `moduleOuvrage`). Mais la grammaire de formes,
elle, diffère entièrement — d'où deux jeux complets.

### 4.1 Les neuf entités logiques

| Clé | Joueur | Ouvrage | Type | Accent |
|---|---|---|---|---|
| `merlon` | Mur de défense | Merlon | mur | **aucun** |
| `ronce` | Barbelés | Ronce | barrière | **ai** blanc |
| `herse` | Barrière anti-char | Herse | barrière | **av** rouge |
| `casemate` | Tourelle mitrailleuse | Casemate | tourelle | **ai** blanc |
| `creneau` | Canon anti-char | Créneau | tourelle | **av** rouge |
| `batterie` | DCA | Batterie | tourelle | **aa** jaune |
| `faucheuse` | Mirador | Faucheuse | artillerie | **ai** blanc |
| `mortier` | Artillerie lourde | Mortier | artillerie | **av** rouge |
| `harpon` | SAM | Harpon | artillerie | **aa** jaune |

⚠ **Le Merlon ne porte aucun accent.** Il ne tire pas (`degats: null`), il ne tue
rien, et `scene.js` le rend déjà sans accent. Les deux barrières, elles, en
portent un : elles ne tirent pas non plus mais leur franchissement est typé
(`degatsFranchissement`), et c'est cette table qui donne leur accent.

### 4.2 Les fichiers à produire (9 par propriétaire)

Monolithiques (A5) : le tube n'est plus un fichier séparé.

```
def_<prop>_merlon.png
def_<prop>_ronce.png            def_<prop>_herse.png
def_<prop>_casemate.png         def_<prop>_creneau.png      def_<prop>_batterie.png
def_<prop>_faucheuse.png        def_<prop>_mortier.png      def_<prop>_harpon.png
```

`<prop>` ∈ {`j`, `o`} → **18 fichiers pour 18 entités**, un par ligne de
`DEFENSES`. Le nom reprend la clé de données (A2) et non le couple châssis+cible :
`def_j_creneau.png` EST la tourelle anti-véhicule, et le lien avec
`src/data/combat.js` reste direct.

Ce que chaque fichier doit porter, et qui n'est plus factorisé par la
composition — donc à rappeler dans chaque prompt :

| Clé | Châssis | Tube | Accent |
|---|---|---|---|
| `merlon` | mur | aucun | **aucun** — il ne tire pas |
| `ronce` | barrière | aucun | blanc |
| `herse` | barrière | aucun | rouge |
| `casemate` | tourelle | double fin, court | blanc |
| `creneau` | tourelle | simple épais, long | rouge |
| `batterie` | tourelle | simple fin, incliné | jaune |
| `faucheuse` | véhicule | double fin **rallongé de moitié** | blanc |
| `mortier` | véhicule | simple épais **rallongé** | rouge |
| `harpon` | véhicule | simple fin **rallongé** | jaune |

⚠ **Les trois artilleries sont des VÉHICULES de forme et des DÉFENSES de
fonction** (commentaire de `DEFENSES` dans `combat.js`) : caisse + chenilles
claires, empreinte allongée verticalement, mais **régime C** puisqu'elles ne
bougent jamais. **C'est le seul endroit du projet où les deux axes divergent.**
Leur `porteeMini: 3.5` est ce que le tube rallongé annonce — c'est une portée
MINIMALE, pas un bonus. Le socle doit dire le véhicule : c'est ce qui explique la
part de cibles véhicule d'une garnison de haut niveau, et le joueur doit pouvoir
l'anticiper à l'œil.

### 4.3 La référence de la famille tourelle

`art/def_j_creneau_source.png`, validé le 26/08 au premier jet, prompt libre.
Mesuré : accent 18,9 %, métal 24,6 %, châssis 24,8 %, emprise 23 × 28 gp,
10 couleurs.

⚠ **Il ne se régénère plus.** Quatre relances de cette famille ont échoué par le
même mécanisme — socle mangé, accent surcorrigé — dont une le 27/08 à
accent 33 % / métal 0,9 % / châssis 59 %. `casemate` et `batterie` se produisent
en joignant ce PNG comme moule, méthode du §3 ter du brief, jamais par relance
libre.

L'étalon `art/etalon/joueur/` reste une référence de lecture (silhouettes,
proportions, contraste), mais ses fichiers ne se recyclent pas tels quels : ils
sont en couches, le pipeline ne l'est plus.

---

## 5. Lot 5 — Bâtiments (16 fichiers) et états de réparation (7)

Régime **C**, le plus généreux : ce sont les seules entités du jeu qui ont une
vraie hauteur, et l'inclinaison à 75° est là pour elles avant tout.

Arithmétique à respecter, et c'est elle qui cadre les prompts : **emprise du toit
+ hauteur de flanc ≤ 28.** Un bâtiment de 22 × 22 avec 6 px de flanc fait 22 de
large et 28 de haut : c'est la limite exacte.

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
et demie l'Accumulateur à 1 000, exactement comme A6 fait peser une unité à
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

### 5.3 Le Foyer — REPORTÉ

`bat_o_foyer_zero.png`. `GEOGRAPHIE.baseTerminale` pose une base à 25 cases du
bord haut, colonne centrale ; le §12 de `FICHE-STYLE.md` veut **un creuset qui
rayonne, pas une citadelle**. Reste ouvert : cette base porte-t-elle un bâtiment
propre, ou est-ce une base ordinaire de niveau 50 ?

**Aucune urgence** — c'est le dernier écran du jeu et rien en amont n'en dépend.
À rouvrir quand la fin de partie sera conçue. Non compté dans les 158.

### 5.4 Cinq états de réparation — 7 fichiers

Tranché le 26/08. Le butin est proportionnel aux dégâts, la réparation est le
cœur de l'économie : l'état d'un bâtiment est une information de premier plan et
doit se lire d'un coup d'œil, sans barre de PV.

| État | PV | Rendu |
|---|---|---|
| 1 — bon état | 100 % | sprite nu, aucune surcouche |
| 2 — abîmé | 80 % → 99,99 % | `dmg_1_abime.png` par-dessus |
| 3 — très abîmé | 30 % → 79,99 % | `dmg_2_tres_abime.png` |
| 4 — partiellement détruit | 1 PV → 29,99 % | `dmg_3_partiel.png` |
| 5 — détruit | 0 PV | le sprite est **remplacé** par une ruine |

**Trois surcouches, pas dix-sept.** Aucun bâtiment n'occupe plus d'une case (rien
dans `base.js` ni `sites.js` ne déclare d'empreinte multi-cases) : une surcouche
128 × 128 se pose sur n'importe quel bâtiment, n'importe quelle défense, des deux
côtés. Elles sont **neutres** — suie, brèches, tôles arrachées, trous ouverts sur
du noir — donc hors des deux rampes, ce qui est justement ce qui les rend
universelles. Régime **A**, calques plats, au moins la moitié de la surface vide.

**Quatre ruines**, parce qu'un tas de décombres kaki et un tas de décombres
ardoise ne sont pas le même tas, et qu'une ruine unique répétée sur une base
entière se voit immédiatement. Régime **C** : un tas de décombres a du volume.

```
dmg_1_abime.png   dmg_2_tres_abime.png   dmg_3_partiel.png
dmg_4_ruine_j_a.png   dmg_4_ruine_j_b.png
dmg_4_ruine_o_a.png   dmg_4_ruine_o_b.png
```

Progression à tenir d'un état au suivant : 2 = suie et tôles tordues, la
silhouette intacte ; 3 = une brèche ouverte, un pan effondré, la silhouette
entamée ; 4 = la moitié de la surface éventrée, structure visible à travers.

⚠ **Contrôle décisif** : poser les trois surcouches sur le même bâtiment et
vérifier que 2 et 3 ne se confondent pas à 40 px. Si elles se confondent, la
surcouche a raté son seul travail.

---

## 6. Lot 6 — La carte (13 fichiers)

Régime **C**, comme les bâtiments : la carte est la même vue que le combat.

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

**Ne pas produire** : niveaux et strates (texte, procédural), rayons d'influence
2 et 3 et rayon d'attaque 10 (cercles, procéduraux), état bloqué après attaque ou
rasage (teinte, procédurale).

### 6.2 Les sept POI de bonus (7)

Tranché le 26/08. Sept bonus, un par fichier. Les noms suivent le lexique arrêté
en Phase 0 et n'empruntent rien à C&C.

| Fichier | Bonus | Lecture visuelle |
|---|---|---|
| `poi_veine_quartz.png` | rendement quartz | affleurement cristallin blanc-gris, même famille que `tile_affleurement` mais **concentré et net** |
| `poi_coulee_scorie.png` | rendement scorie | dépôt vitrifié, même famille que `tile_croute`, **jamais un cristal vert qui pousse** |
| `poi_reacteur.png` | énergie / production | cuve cylindrique éventrée, anneau de refroidissement, la seule chose émissive de la carte |
| `poi_cantonnement.png` | bonus infanterie | baraquements bas alignés, accent **blanc** |
| `poi_parc_roulant.png` | bonus véhicules | dalle béton, traçages, carcasses à chenilles, accent **rouge** |
| `poi_plot_aerien.png` | bonus aérien | cercle d'appontage, mire centrale, accent **jaune** |
| `poi_redoute.png` | bonus défensif | enceinte massive à angles, **aucun tube**, aucun accent — comme le merlon |

Les trois derniers accents ne sont pas décoratifs : ils reprennent à la lettre la
règle absolue du §3 de la fiche et disent au joueur, sans texte, quelle branche
ce POI renforce.

⚠ Ce que ces sept fichiers **ne disent pas** : combien ils donnent, ni s'ils sont
pris. Le montant est du texte, la propriété est une teinte de halo — les deux
sont procéduraux.

---

## 7. Lot 7 — Interface (41 fichiers)

⚠ **Les icônes d'interface ne sont pas en vue de dessus.** Ce sont des
pictogrammes : le format, la palette et les interdits s'appliquent, la clause de
vue et celle de régime **sautent**. Silhouette pleine, frontale, symétrique, un
seul niveau de lecture, aucune inclinaison, aucune face visible, aucune
profondeur. À dire explicitement dans chaque prompt, sinon le modèle produit des
icônes inclinées au milieu d'un lot cohérent.

Affichage à 24 px : chaque icône doit se lire en silhouette pleine, sans contour
ajouté, sans cercle de fond, sans cadre.

### 7.1 Ressources (3)

`ui_quartz.png` · `ui_scorie.png` · `ui_electricite.png`

Le quartz et la scorie se lisent aussi en `tile_affleurement` et `tile_croute` :
mêmes matières, deux échelles. Elles doivent se répondre — l'icône est la tuile
vue de près.

### 7.2 Compteurs (4)

`ui_point_attaque.png` — plafond 100 → 600, régénération 20 → 120/h
`ui_point_armee_offense.png` — adossé au Centre de commandement
`ui_point_armee_defense.png` — adossé au QG de défense
`ui_point_recherche.png` — pris sur les défenses détruites, jamais produit

⚠ Les deux points d'armée sont **deux budgets distincts et non fongibles** ;
s'ils se ressemblent, le joueur croira pouvoir dépenser l'un pour l'autre.

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

⚠ `MODULES` est un **glossaire : il ne dit pas qui porte quoi.** Les affectations
sont dans `UNITES[x].module` / `moduleOuvrage` et `DEFENSES[x].moduleJoueur` /
`moduleOuvrage`. Un module peut donc apparaître sur une unité du joueur et sur
une défense de l'Ouvrage : **l'icône doit dire l'effet, jamais le porteur**, sous
peine d'être fausse la moitié du temps.

### 7.6 États et actions (10)

```
ui_pv.png              ui_degats.png         ui_butin.png
ui_reparation.png      ui_temps.png          ui_niveau.png
ui_verrou.png          ui_emplacement.png    ui_vague.png
ui_budget.png
```

`ui_verrou.png` sert les trois défauts de composition — `verrouilles` en défense,
`verrouillees` à l'Arsenal, `depassementBudget` et `surObstacle`. La doctrine est
que **rien ne se retire en silence** : l'icône signale, elle n'ampute pas.

---

## 8. Les cinq dettes DA — toutes closes

| # | Dette | Close le | Où vit la réponse |
|---|---|---|---|
| 1 | La rampe de l'Ouvrage n'est pas inscrite dans la fiche | **27/08** | **Ardoise violacée**, `FICHE-STYLE.md` §3. Arbitrage sur pièce, trois critères sur trois contre la fonte oxydée. `RAPPORT-S0-rampe-ouvrage.md` §3. |
| 2 | La forme volante de l'Ouvrage — le Dard — n'existe pas | **27/08** | Moyeu central, modules identiques en triangle radial, aucune aile portante. Référence `art/ouvrage/ref_dard.png`. `BRIEF-SPRITES-IA.md` §5.2. |
| 3 | Taille de tuile de la carte | **26/08** | Une seule grille, 128 × 128 partout. §2.4 ci-dessus. |
| 4 | Marcheur : pattes trop fines, se confond avec le pylône à 40 px | **27/08** | Trois pattes radiales de 2 gp minimum, plus courtes, corps massif. Référence `art/ouvrage/ref_marcheur.png`. |
| 5 | Casques d'infanterie neutres ; dôme de tourelle qui mange le socle | **27/08** | Casque = accent plein sur chaque figure (`art/joueur/ref_meute.png`). Dôme ≤ 60 % de la largeur du socle, anneau visible sur tout le pourtour (`art/def_j_creneau_source.png`). |

Les dettes 1, 2, 4 et 5 se sont soldées **par la génération elle-même**, sur le
jet d'essai S0 : c'est le jet qui a servi d'arbitrage, pas une décision écrite en
amont. C'est la méthode à reprendre pour toute dette de forme.

### 8.1 Les cinq sprites de référence

Une famille, une référence. C'est le **moule** qu'on joint aux frères, méthode du
§3 ter du brief — un prompt ne transmet pas un équilibre visuel, une image si.

| Fichier | Famille | Validé |
|---|---|---|
| `art/def_j_creneau_source.png` | tourelle joueur | 26/08 |
| `art/ouvrage/ref_pylone.png` | structure Ouvrage | 27/08 |
| `art/ouvrage/ref_marcheur.png` | blindé Ouvrage | 27/08 |
| `art/ouvrage/ref_dard.png` | aéronef Ouvrage | 27/08 |
| `art/joueur/ref_meute.png` | escouade joueur | 27/08 |

⚠ **Trois traits des références Ouvrage s'écartent du contrat du brief, et ont
été acceptés par Ethan le 27/08.** Ils deviennent la norme de la famille,
puisque les frères s'en déclinent : le pylône porte **deux accents** (jaune et
rouge) là où la règle en veut un ; **aucune face de régime n'est mesurable** sur
le pylône ni sur le marcheur ; et ni l'un ni l'autre ne répète de module, à la
différence du Dard. Ce n'est pas un oubli, et ça ne se rouvre pas sans décision.

### 8.2 Ce qui reste ouvert

1. **La destination des fichiers finis** (§0). À trancher avant le lot 1.
2. **`bat_o_foyer_zero.png`** (§5.3), sans urgence.
3. **Les 1024 sources des références Ouvrage** ne sont pas au dépôt. Le §3 ter en
   a besoin : c'est le PNG source qu'on joint, pas le 128 conditionné.

---

## 9. Ordre de production

Le détail, le découpage en planches et l'état d'avancement sont dans
**`PLAN-PRODUCTION-SPRITES.md`**, qui fait foi sur ce point et se coche au fur et
à mesure. Ce document-ci ne donne que la logique de dépendance, qui elle ne
bouge pas :

0. **Jet d'essai** — tranche les dettes de forme avant tout le reste. **Fait le
   27/08, 7/7.**
1. **Lot 1, terrain** (29) — le fond de tout, carte comme champ de bataille,
   indépendant du reste, et le seul lot où le modèle travaille sans contrainte de
   silhouette.
2. **Lot 3, unités** (28) — le plus visible, et celui qui fige la grammaire de
   l'Ouvrage pour tous les suivants.
3. **Lot 4, défenses** (18) — même grammaire que les unités, il en hérite.
4. **Lot 5, bâtiments** (16) — dépend des deux grammaires, donc vient après.
5. **Lot 5 bis, états de réparation** (7) — se juge SUR les bâtiments finis, pas
   dans le vide.
6. **Lot 2, obstacles** (6) — petit, indépendant.
7. **Lot 6, carte** (13) — marqueurs et POI.
8. **Lot 7, interface** (41) — en dernier : une icône de module se dessine
   d'après le module fini, une icône de châssis d'après le châssis fini.

---

## 10. Ce qu'il ne faut PAS produire

Liste défensive : chacune de ces lignes a une raison écrite quelque part, et
chacune reviendra dans une conversation future si elle n'est pas notée ici.

- **Aucun sprite d'effet.** Impacts, explosions, éclairs de bouche, mort,
  particules, traînées : tout est procédural.
- **Aucune ombre portée.** Elle ne se cuit pas dans le sprite ; elle se trace au
  rendu, et son décalage est le seul signal d'altitude.
- **Aucune barre de PV, aucun cadre de sélection.** `scene.js` les émet en
  primitives et son T5 compte ces primitives.
- **Aucune seconde orientation DESSINÉE.** La rotation et le miroir au RENDU
  sont réglés par A4 ; ce qui reste interdit, c'est de produire un second fichier
  pour la même entité tournée.
- **Aucun éclairage directionnel cuit dans le sprite.** Un sprite éclairé « d'en
  haut à gauche » devient faux dès la première rotation. Les deux seuls écarts de
  valeur autorisés sont fonctionnels : l'avant est clair parce que c'est l'avant,
  le flanc est sombre parce que c'est un flanc.
- **Aucun dépassement de case.** Flanc, canon, antenne compris : tout tient dans
  28 × 28 gros pixels sur 32 (A7). Les tuiles de terrain sont la seule exception,
  elles font 32 × 32 bord à bord.
- **Aucune isométrie.** L'inclinaison à 75° se dessine DANS le sprite ; la
  grille, elle, reste carrée et non tournée. Compresser ou incliner la grille est
  le contresens à ne pas faire.
- **Aucun flanc au-delà de 2 gros pixels sur une unité.** Régime B d'A7 : c'est
  la contrepartie de la rotation et du miroir.
- **Aucune planche d'animation** tant qu'une transformation suffit. Si une
  planche devient nécessaire, l'invariant d'Archipel s'applique : **frame 0
  pixel-pour-pixel identique au sprite statique** — et c'est précisément ce qu'un
  modèle d'image ne sait pas garantir.
- **Aucun sprite hors grammaire.** Une entité nouvelle est un enregistrement
  `{châssis, arme, rôle, taille}` déjà couvert par les axes existants, jamais une
  invention isolée. Un prompt qui ne se déduit pas de ces quatre champs décrit
  une entité qui n'a pas sa place.
- **Aucun texte, aucun chiffre, aucun logo, aucun emblème dans un sprite.**
  Niveaux, coûts, quantités, propriétaire d'un POI : tout ça est du texte
  procédural posé par l'interface. Un modèle d'image en ajoutera spontanément —
  c'est le motif de rejet le plus fréquent d'un jet.
- **Aucune reprise de Command & Conquer.** Ni tibérium, ni Mammoth, ni GDI/Nod,
  ni silhouette reconnaissable. Les noms TA de `src/data/` sont une traçabilité
  interne, **pas une référence visuelle** : `broyeur.ta === 'Mammoth'` ne
  légitime rien.
- **Aucun décor de présentation.** Sol, socle, vignette, cadre, ombre au sol,
  reflet, « mise en scène » : le sprite est découpé sur fond vide et rien d'autre
  ne doit s'y trouver. Même motif : le modèle en produira par défaut.

---

*v5 — 27/08/2026. Lot 1 livré. Rampe de sol arrêtée (terre cuite) et doctrine
« un seul sol, sept matières » écrite au §2.1 avec les couvertures mesurées.
Destination des fichiers finis tranchée : `sprites/`.*

*v4 — 27/08/2026. Remise au propre. Les cinq dettes DA sont closes (§8) et le
tableau les date. Les sept amendements A1 à A7 cessent d'être des amendements en
attente : ils sont **portés dans `FICHE-STYLE.md`** et deviennent ici les
conventions du §1, remises dans l'ordre A1…A7 — les étiquettes sont conservées,
elles sont citées ailleurs. Les marqueurs [TRANCHÉ 26/08] sont repliés dans le
texte des sections concernées. §8.1 recense les cinq sprites de référence et les
trois écarts acceptés ; §8.2 les trois points encore ouverts. §9 ne duplique plus
`PLAN-PRODUCTION-SPRITES.md`, il y renvoie.*

*v3 — 26/08/2026. Bascule du pipeline sur la génération par modèle d'image et de
la vue sur le top-down haut à 75°.*
