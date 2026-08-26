# INVENTAIRE-SPRITES.md — Foyer Zéro

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

> **v2 — 26/08/2026.** Tous les arbitrages du §2.4, §3.4, §4.2, §5.3, §5.4 et
> §6.2 sont tranchés. Le pipeline change : les sprites ne sont plus composés en
> Python mais **générés par modèle d'image**, en 128 × 128, selon
> `BRIEF-SPRITES-IA.md`. Les conséquences sont reportées dans chaque lot.

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
| Masques de transition `tile_bord_<dir>` | 8 | Ce sont des masques alpha, pas des images. Un modèle d'image ne sait pas les produire : à faire procéduralement au rendu (tramage ordonné sur la bordure). |
| `bat_o_foyer_zero.png` | +1 | Reporté, §5.3. |

**Zéro sprite d'effet.** Impacts, explosions, éclairs de bouche, mort,
particules, barres de PV, ombres portées : `FICHE-STYLE.md` §6 et §8 les rendent
en primitives. Ne rien produire pour eux, et ne pas laisser cette ligne
réapparaître dans un devis.

---

## 1. Amendements à `FICHE-STYLE.md` §9 — le nommage ne suffit plus

La convention actuelle n'a **aucun axe propriétaire**. Or la règle centrale du
projet est que le joueur et l'Ouvrage ne partagent ni palette ni grammaire de
formes : `off_meute.png` ne peut pas désigner deux sprites. Trois amendements,
à valider avant la première génération.

**A1 — axe propriétaire, en deuxième position.**

```
off_<prop>_<cle>.png            off_j_meute.png · off_o_meute.png
def_<prop>_<chassis>_corps.png  def_j_tourelle_corps.png
arme_<prop>_<cible>[_r].png     arme_j_av_r.png
bat_<prop>_<cle>.png            bat_j_caserne.png · bat_o_souche.png
```

`<prop>` vaut `j` (joueur) ou `o` (Ouvrage). `tile_`, `obs_`, `poi_` et `ui_`
n'en portent pas : ils n'appartiennent à personne.

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

**A4 — rotation libre des entités au rendu.** [tranché 26/08]
Conséquence du §3.4. La vue est **strictement zénithale** et le gradient
avant/arrière du §5 est attaché à l'objet, pas à une source de lumière de
scène : un sprite tourné de 90° ou de 180° reste physiquement juste. L'interdit
du §11 devient : *aucune SECONDE ORIENTATION DESSINÉE*. La rotation au rendu, elle,
est libre. **Contrepartie obligatoire, à inscrire dans la fiche §2 :** la marge de
2 px logiques passe du seul bord haut aux **quatre bords**, sans quoi une entité
tournée déborde sur la case voisine.

**A5 — les défenses redeviennent monolithiques.** [tranché 26/08]
L'export en couches (corps + tube séparés) supposait un générateur par
composition, qui garantissait l'alignement au pixel. Un modèle d'image ne le
garantit pas : deux images indépendantes ne se recalent pas. Une défense = **un
fichier**. Le recul au tir devient un recul de l'entité entière, de 1 px au lieu
de 2–3 pour le seul tube. C'est le seul effet perdu, et il coûte 4 fichiers de
moins (18 au lieu de 22).

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

⚠ Rappel du §9 : **la scorie ne dérive pas vers un cristal vert qui pousse tout
seul.** C'est un dépôt industriel, laissé par l'extension de l'Ouvrage. C'est le
point exact où la reprise C&C se réintroduit sans qu'on la voie.

### 2.2 Hors-couloir (1)

`tile_horschamp.png` — ce qui borde le couloir de 30 de large. Une seule tuile,
volontairement muette : elle dit « on ne va pas là », elle ne raconte rien.

### 2.3 Masques de transition (8) — **hors génération**

`tile_bord_n.png`, `_s.png`, `_e.png`, `_o.png`, `_ne.png`, `_no.png`,
`_se.png`, `_so.png`.

Un seul jeu générique, en niveaux d'alpha, teinté au rendu par la couleur
dominante du terrain voisin. L'alternative — un jeu complet par couple de
terrains — coûterait 7 × 6 × 8 = 336 fichiers pour un gain que personne ne
verra à 17 px par case.

⚠ **Ces huit-là ne se génèrent pas par modèle d'image.** Ce ne sont pas des
images mais des masques alpha : une rampe de transparence régulière, tramée sur
la grille logique. Un générateur d'images produira une jolie texture de bord,
inutilisable comme masque. À faire **procéduralement au rendu** (tramage
ordonné 4 × 4 sur les 8 px logiques de bordure), ce qui les fait tomber à zéro
fichier. Ils restent listés ici pour qu'on ne les redécouvre pas plus tard.

### 2.4 [TRANCHÉ 26/08] Une seule grille, 128 × 128 partout

La carte **n'a pas à tenir dans l'écran**. À l'ouverture elle est centrée sur la
dernière base du joueur et en montre environ **6 × 12 cases** ; le dézoom
descend jusqu'à **24 × 48**. Sur 412 px CSS de large, cela met la case entre
**68 px** (zoom max) et **17 px** (dézoom max).

Conséquence : un fichier 128 × 128 couvre toute la plage, et la seconde grille
16 × 16 qui était recommandée n'a plus lieu d'être. **Une seule grille logique
32 × 32, un seul format de fichier 128 × 128, pour tout le projet.**

Deux notes de rendu qui découlent de la plage retenue :

- À 68 px CSS et DPR 3, la tuile est demandée à ~204 px physiques pour 128
  dessinés : c'est un agrandissement de 1,6×. En nearest-neighbour il donne des
  pixels logiques inégaux (certains 6 px, d'autres 7). Soit on plafonne le zoom
  carte à ~43 px CSS (= 128 px physiques, ratio exact 1:1), soit on accepte
  l'irrégularité. **Recommandation : plafonner.** Elle ne coûte rien et le
  rendu reste net.
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

⚠ Un obstacle **ne porte jamais de couleur d'accent** — il ne tue rien. Le
§11 de la fiche s'applique sans exception.

### 3.2 Les quatorze unités, dans les deux grammaires (28)

Chaque ligne donne deux fichiers : `off_j_<cle>.png` (joueur, rampe kaki, armée
régulière) et `off_o_<cle>.png` (Ouvrage, rampe ennemie, radial + pattes +
accent émis).

| Clé | Joueur | Ouvrage | Châssis | Accent | Points → empreinte |
|---|---|---|---|---|---|
| `meute` | Fusiliers | Meute | escouade | **ai** blanc | 5 → ~20×20 |
| `guetteur` | Voltigeurs | Guetteur | escouade | **ai** blanc | 10 → ~26×26 |
| `perceurs` | Grenadiers | Perceurs | escouade | **aa** jaune | 5 → ~20×20 |
| `fouisseurs` | Sapeurs | Fouisseurs | escouade | **aa** jaune | 10 → ~26×26 |
| `carapace` | Cuirassiers | Carapace | escouade | **av** rouge | 10 → ~26×26 |
| `ratisseur` | Éclaireur | Ratisseur | blindé | **ai** blanc | 10 → ~26×26 |
| `fendeur` | Chasseur | Fendeur | blindé | **av** rouge | 10 → ~26×26 |
| `broyeur` | Percheron | Broyeur | blindé | **av** rouge | 15 → ~30×30 |
| `belier` | Pionnier | Bélier | blindé | **aa** jaune | 10 → ~26×26 |
| `pilon` | Obusier | Pilon | blindé | **aa** jaune | 15 → ~30×30 |
| `crecelle` | Milan | Crécelle | aéronef | **ai** blanc | 10 → ~26×26 |
| `busard` | Épervier | Busard | aéronef | **av** rouge | 10 → ~26×26 |
| `frappeur` | Foudre | Frappeur | aéronef | **aa** jaune | 10 → ~26×26 |
| `enclume` | Albatros | Enclume | aéronef | **aa** jaune | 15 → ~30×30 |

**Pourquoi l'anti-structure est jaune.** Il n'y a que trois accents, et la
troisième colonne de dégâts s'appelle `structureOuAviation` : elle vaut
structure en attaque et aviation en défense (`combat.js`, règle de bascule).
Le jaune désigne donc la troisième colonne, pas « l'anti-aérien » — et c'est
justement ce qui fait que la même unité garde son accent des deux côtés du
champ. Aucune variante de couleur à produire pour la garnison.

**Longue portée.** Le Guetteur (2,5) et tous les blindés à 2,5 portent le tube
long du §5. Ils ne prennent PAS le suffixe `_r`, réservé aux artilleries
défensives à portée minimale.

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

**Arbitrage : aucun sprite supplémentaire.** Le retournement se fait au rendu.

| Châssis | Transformation | Pourquoi elle est juste |
|---|---|---|
| Infanterie | miroir vertical (≡ rotation 180°, les figures étant symétriques gauche/droite) | Le gradient avant/arrière du §5 s'inverse avec l'objet et reste vrai. |
| Véhicule, tourelle | **rotation libre**, par pas de 90° pour les déplacements latéraux, continue pour la visée | Vue zénithale stricte : aucun côté d'objet n'est visible, donc rien ne se déforme en tournant. |

Deux conditions, non négociables, sans lesquelles l'arbitrage tombe :

1. **Marge de 2 px logiques sur les quatre bords** de tout sprite susceptible de
   tourner — unités, défenses, véhicules. Un canon collé au bord haut déborde
   sur la case voisine dès la première rotation.
2. **Aucun éclairage de scène cuit dans le sprite.** Le gradient du §5 est
   fonctionnel (l'avant est clair parce que c'est l'avant), jamais directionnel
   (« le soleil vient d'en haut à gauche »). Un sprite éclairé de biais devient
   faux dès qu'il tourne. À vérifier sur chaque jet.

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
| `poi_veine_quartz.png` | rendement quartz | affleurement cristallin blanc-gris, même famille que `tile_affleurement` mais **concentré et net** |
| `poi_coulee_scorie.png` | rendement scorie | dépôt vitrifié sombre, même famille que `tile_croute`, **jamais un cristal vert qui pousse** |
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

Le quartz et la scorie se lisent aussi en `tile_affleurement` et `tile_croute` :
mêmes matières, deux échelles. Elles doivent se répondre — l'icône est la tuile
vue de près.

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

## 8. Dette DA — statut au 26/08

| # | Dette | Statut | Traitement |
|---|---|---|---|
| 1 | **La rampe ennemie 5 tons n'est pas inscrite dans la fiche.** | **premier jet, puis validation** | Deux rampes candidates proposées dans `BRIEF-SPRITES-IA.md` §5, générées côte à côte sur la même entité. Ethan tranche sur pièce, la gagnante entre dans `FICHE-STYLE.md` §3. |
| 2 | **La forme volante de l'Ouvrage — le Dard — n'existe pas.** | **premier jet, puis validation** | Forme proposée au §5 du brief : trois modules identiques en triangle radial autour d'un moyeu, aucune aile portante. Bloque les quatre `off_o_*` aéronefs, donc tout l'anti-aérien du joueur. |
| 3 | **Taille de tuile de la carte.** | **tranché** | §2.4 : une seule grille, 128 × 128 partout. |
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
1. **Lot 1, terrain** (29) — le fond de tout, carte comme champ de bataille,
   indépendant du reste, et le seul lot où le modèle travaille sans contrainte
   de silhouette.
2. **Lot 3, unités** (28) — le plus visible, et celui qui fige la rampe ennemie
   pour tous les suivants.
3. **Lot 4, défenses** (18) — même grammaire que les unités, il en hérite.
4. **Lot 5, bâtiments** (16) — dépend des deux grammaires, donc vient après.
5. **Lot 5 bis, états de réparation** (7) — se juge SUR les bâtiments finis, pas
   dans le vide.
6. **Lot 2, obstacles** (6) — petit, indépendant.
7. **Lot 6, carte** (13) — marqueurs et POI.
8. **Lot 7, interface** (41) — en dernier : une icône de module se dessine
   d'après le module fini, une icône de châssis d'après le châssis fini.

Livraison inchangée : `out/sprites/`, ZIP versionné, un lot par archive.

---

## 10. Ce qu'il ne faut PAS produire

Liste défensive : chacune de ces lignes a une raison écrite quelque part, et
chacune reviendra dans une conversation future si elle n'est pas notée ici.

- **Aucun sprite d'effet.** Impacts, explosions, éclairs de bouche, mort,
  particules, traînées : §8, tout est procédural.
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
  Le seul gradient autorisé est fonctionnel (l'avant est clair parce que c'est
  l'avant).
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

- **Aucun décor de présentation.** Sol, socle, vignette, cadre, ombre au sol,
  reflet, « mise en scène » : le sprite est découpé sur fond vide et rien
  d'autre ne doit s'y trouver. Même motif : le modèle en produira par défaut.

---

*v2 — 26/08/2026. Arbitrages §2.4, §3.4, §5.3, §5.4, §6.2 tranchés par Ethan ;
amendements A4 (rotation au rendu) et A5 (défenses monolithiques) ajoutés ;
pipeline basculé sur génération par modèle d'image, cf. `BRIEF-SPRITES-IA.md`.*
