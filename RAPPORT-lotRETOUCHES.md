# RAPPORT — lot RETOUCHES

Retours d'Ethan du 07/09, points **5**, **16**, **10** et **15**. Quatre points
indépendants, trois écrans, aucune règle de combat.

**Version produite : 0.99.26 · build 128.** Les deux restent des **chaînes
JSON** — vérifié par `typeof` après écriture : `version "0.99.26" string`,
`build "128" string`.

---

## 1. La base de départ, mesurée

Le brief annonce **1 340 pass**, `dist/index.html` **8 256 764 octets**, version
**0.99.23 · build 124**. **Mesuré au départ : 1 370 pass / 0 fail,
8 346 566 octets, 0.99.25 · build 127.**

L'écart s'explique entièrement : le lot **DÉPLACEMENT-ÉCLAIRÉ** — le premier de
la série de quatre — a été exécuté juste avant celui-ci, sur la même branche, et
il ajoute trente tests et 89 802 octets. **Les faits dont ce lot-ci dépend
étaient intacts**, vérifiés un par un : `etatDeLaGarnison` rend bien
`{ avertissement, enAttente, texte }` ; la règle du pointillé partagée du lot
ÉCRAN-DÉFENSE est en place avec ses trois sélecteurs ; **aucun fichier de
`src/ui/` ne lisait `plafondDeLaReserve` ni `reserveReparation`** ; et
`SAVEURS_TIRABLES` n'existait pas.

---

## 2. Le coût du livrable, poste par poste

Mesuré contre un livrable **rebâti dans un `git worktree`** depuis le commit du
lot précédent.

| Poste | Avant | Après | Écart |
|---|---:|---:|---:|
| JavaScript | 371 734 | 372 284 | **+550** |
| feuille | 121 798 | 124 654 | **+2 856** |
| balisage | 34 159 | 34 211 | **+52** |
| images | 6 625 529 | 6 625 529 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| **total** | **8 346 566** | **8 350 024** | **+3 458** |

**La somme des cinq postes tombe EXACTEMENT sur le total.** **297 lignes
`data:` avant, 297 après, 292 URI de part et d'autre** — 29 images, 263 sons :
le lot ne fait entrer ni une image ni un son.

Borne T10 **inchangée à 9 300 000**, marge **949 976 octets, 10,21 %**.

⚠ **Le bump de version ne coûte rien** : `0.99.25 → 0.99.26` et `127 → 128`
gardent leur nombre de chiffres, donc la mesure ci-dessus reste valide après le
bump.

---

## 3. Point 5 — le bandeau de garnison disparaît quand tout va bien

Ethan : « enlever la barre "complexe de niv x" ».

**La lecture du brief est retenue telle quelle** : le bandeau disparaît quand la
garnison est intacte, et reparaît dès qu'il a quelque chose d'anormal à dire.
`ecrireLEtatDeLaGarnison` de `src/ui/chantier.js` lit `etatDeLaGarnison(etat)`
**une fois** et se cache si `!avertissement && enAttente === 0`.

⚠⚠ **LES DEUX CHAMPS SE LISENT, ILS NE SE DEVINENT PAS.** `etatDeLaGarnison`
rend `avertissement` et `enAttente` depuis le lot COMPLEXE ; retester le TEXTE —
« est-ce que la phrase contient "intacte" ? » — aurait été une seconde lecture du
même fait, et la première retouche de libellé l'aurait fait mentir.

⚠ **`RETOUR_DEFENSES.indexeeSur` n'a pas une ligne de changée**, et
`etatDeLaGarnison` non plus : ce lot change **quand** le bandeau paraît, jamais
ce qu'il dit.

### ⚠⚠ ET LE DÉFAUT DU POINT 2 REVENAIT — IL EST TRAITÉ, PAS CONSTATÉ

Le bandeau était en `flex: 0 0 auto`, ce qui ne coûtait rien tant qu'il était
**toujours** là sur la bande Défense. Depuis qu'il paraît et disparaît, le
laisser dans le flux aurait recadré le décor à chaque réparation — le défaut que
le lot ÉCRAN-DÉFENSE a mesuré à 44 px sur la ligne d'avis. **On reprend sa
conclusion, on n'en cherche pas une autre** : `#chantier-garnison` passe en
`position: absolute`, `left: 0; right: 0; top: 0; z-index: 1`, DANS
`#chantier-vue`.

⚠ **EN HAUT, la ligne d'avis tenant le bas** : les deux ne peuvent pas se
recouvrir.

⚠⚠ **ET `pointer-events: none` EST LA MOITIÉ QUI COMPTE** — sans elle, le
bandeau avalerait le toucher des cases qu'il couvre, la faute mesurée du lot
TUTORIEL et rappelée par ÉCRAN-DÉFENSE.

### La mesure — Chromium, géométrie du S25 FE, sur DEUX vraies parties chargées

Deux sauvegardes forgées par le moteur, injectées dans `localStorage` et
rechargées : la même base — Chantier 7, QG de défense, **Complexe de défense** —
avec un Merlon de garnison **intact** dans l'une, **abîmé** dans l'autre.

| Grandeur | Garnison INTACTE | Garnison ABÎMÉE | |
|---|---|---|---|
| bandeau | **CACHÉ** | **visible, 16 px** | |
| texte | — | « Complexe de défense niv. 1 — 1 pièce en retour dans 60 min. » | |
| `#chantier-champ` | 492 px | 492 px | **=** |
| `#chantier-defile` | 404 px | 404 px | **=** |
| `scrollTop` | 281 | 281 | **=** |
| `scrollHeight` | 685 | 685 | **=** |
| `--case-cote` | 46 px | 46 px | **=** |
| fond | 360 × 720 @ 50 % 0 % | 360 × 720 @ 50 % 0 % | **=** |
| haut de la grille | −171 | −171 | **=** |

**Les sept grandeurs de géométrie sont identiques : le bandeau coûte ZÉRO pixel
au champ.** `elementFromPoint` au milieu du bandeau rend **`DIV.case.batiments`**
— le toucher passe. **Zéro erreur de page, zéro débordement horizontal.**

⚠ **Une base NEUVE, elle, voit toujours le bandeau** : sans Complexe construit,
`avertissement` vaut `true` et la phrase est « Sans Complexe de défense, les
pièces abîmées de la garnison ne reviennent jamais. » C'est la règle du 05/09,
et elle n'est pas perdue — c'est exactement ce que la lecture retenue garantit.

---

## 4. Point 16 — la palette de l'Offense perd ses fonds pleins

Ethan : « dans le menu offense ».

`#offense-palette .unite` perd `background: #343A2C` et son liseré plein.

### ⚠⚠ D'où vient la règle du pointillé réutilisée

**Elle a été écrite par le lot ÉCRAN-DÉFENSE**, dans `src/index.src.html`, et
elle portait déjà TROIS sélecteurs : `#ecran-offense .emplacement`,
`#ecran-raid .emplacement` et `.posable`. Son commentaire écrit le motif en
toutes lettres — « c'est UN SÉLECTEUR DE PLUS, pas une seconde règle ». **Ce lot
y ajoute le quatrième**, `#offense-palette .unite`, et n'écrit pas une ligne de
`border: 1px dashed`. `ÉD T12` — la garde de ce lot-là — a été **RESSERRÉE** :
elle exigeait UNE règle et nommait trois sélecteurs, elle en nomme quatre.

⚠⚠ **`background: transparent` est OBLIGATOIRE, pas cosmétique**, et c'est
l'acquis mesuré d'ÉCRAN-DÉFENSE : un `<button>` sans fond déclaré retombe sur le
gris clair du navigateur. « Enlever les fonds pleins » se dit en toutes lettres.

### Les trois états, mesurés à l'écran

Le liseré devient le seul discriminant. Relevé dans Chromium sur la vignette de
la palette, les trois classes appliquées tour à tour :

| État | fond calculé | liseré calculé |
|---|---|---|
| au repos | `rgba(0, 0, 0, 0)` | `1px dashed rgb(78, 87, 66)` — **`#4E5742`** |
| verrouillée | `rgba(0, 0, 0, 0)` | `1px dashed rgb(30, 33, 36)` — **`#1E2124`** |
| armée | `rgba(0, 0, 0, 0)` | `1px dashed rgb(245, 243, 232)` — **`#F5F3E8`** |

**Aucun fond plein nulle part, et les trois teintes sont deux à deux
différentes.** **Aucune teinte neuve** : les trois sont dans la palette fermée.
Et l'emplacement de vague voisin rend **le même `dashed rgb(78, 87, 66)`** — une
seule définition, quatre sélecteurs.

⚠ **L'armée garde deux signaux de plus que le liseré** : `.choisie b` passe à
l'os et `.choisie i` gagne un `box-shadow` de 2 px. Retirer le fond plein n'a
donc pas retiré un support sur trois, il en a retiré un sur quatre.

⚠⚠ **ET LE CONFLIT DE CASCADE ENTRE `verrouillee` ET `choisie` EST INERTE,
MESURÉ.** Les deux règles ont la même spécificité et `.verrouillee` est écrite
plus bas, donc elle l'emporterait. **Le cas ne peut pas arriver** :
l'écouteur de la palette sort par un `toast` avant `choisirUnite` dès que
`!unite.disponible`. Une vignette verrouillée n'est jamais armée. **Relevé, non
corrigé** — poser un `:not(.verrouillee)` serait écrire une règle pour un état
que le code interdit.

⚠ **L'Offense grise toujours, elle ne retire pas.** L'arbitrage du 28/08 n'est
pas touché, et `RET T8` le garde dans les deux sens.

---

## 5. Point 10 — le compteur de réparation de l'armée

Ethan : « Compteur de réparation offensive nulle part, ni dans l'ui (global) ni
dans l'onglet unités. »

**Mesuré avant d'écrire une ligne, et le brief avait raison** : aucun fichier de
`src/ui/` ne lisait `plafondDeLaReserve` ni `reserveReparation`. Seul
`plafondDeLaReserveDesBatiments` était affiché, et au Chantier.

`ligneDeLaReserveDArmee(etat)` entre dans `src/ui/offense.js` — **pure et
exportée**, pour que le test la mesure sans passer par le DOM — et
`ecrireLaReserveDArmee` la peint dans `#offense-reserve`.

⚠ **LE NOMBRE SE LIT, IL NE SE RECALCULE PAS.** `plafondDeLaReserve(etat)`,
`CHASSIS_REPARABLES`, `direLaDuree` et `FAMILLE_DE_CHASSIS` viennent tous du
moteur. `src/sim/reparation.js` **n'a pas une ligne de changée**.

⚠ **LES MOTS SONT CEUX D'ETHAN** — « infanterie », « véhicule », « avion » :
`FAMILLE_DE_CHASSIS`, jamais les noms internes.

### ⚠⚠ La garde du brief a été vérifiée, et la réponse est NON

`plafondDeLaReserveDesBatiments` LÈVE sur une disposition vide —
`niveauDesBatiments` refuse une liste vide. **Mesuré : l'équivalent côté ARMÉE ne
lève PAS** — il passe par `niveauDeLArmee(base.armee) ?? 0`, et le plafond vaut
alors douze heures tout rond. **Aucune garde n'a donc été montée**, et
`RET T11` mesure le fait plutôt que de le supposer : il asserte
`doesNotThrow` côté armée ET `throws` côté bâtiments, sur la même base neuve.
En monter une aurait été écrire du code mort.

### Relevé à l'écran

`#offense-reserve` rend, sur une partie chargée :

> **Réparation, max 12.0 h — infanterie 2 s · véhicule 2 s · avion 2 s**

Boîte **360 × 16 px**, `scrollWidth − clientWidth = 0`, page sans débordement
horizontal.

⚠ **`flex: 0 0 auto`, JAMAIS UNE HAUTEUR FIXE.** La garde des 288 px de chrome
énumère les barres à hauteur fixe : celle-ci n'en est pas une, et la somme ne
bouge pas d'un pixel. Relevé : onglets 40 · ressources 44 · **réserve 16** ·
contexte 46 · palette 86 · barre du bas 46 · navigation 26.

⚠ **MÊME FORME QUE `#chantier-reserve`** — même corps, même ton, même famille de
mots. Deux vocabulaires pour la même grandeur obligeraient le joueur à traduire
d'un écran à l'autre.

⚠ **Le point décimal de `direLaDuree` est celui du dépôt**, pas une coquette de
ce lot : la fonction est partagée avec la réserve de réparation du Chantier, et
la corriger ici ferait diverger les deux affichages. Dette déclarée depuis le lot
FICHE-JUSTE, non touchée.

### ⚠⚠ Ce qu'un compteur GLOBAL coûterait — mesuré, non fait

Ethan a écrit « ni dans l'ui (global) ». Le bandeau des ressources est relevé à
**360 px de large, 44 px de haut, cinq tuiles de 67 px, écart 4 px, marges
6 px**.

- Une **sixième** tuile : `360 − 12 − 5 × 4 = 328` px pour six, soit **54,7 px
  chacune** — les cinq existantes perdent **18 %** de largeur.
- Mais la réserve de l'armée est **TROIS** nombres, un par châssis, plus un
  plafond : elle ne tient pas dans une tuile. Il en faudrait **trois**, donc huit
  tuiles, donc **38 px chacune** — les stocks passeraient sous « 5,00 M / 191 ».

**C'est le prix, et il est trop cher pour la consigne « tu compresses tout dans
l'UI ».** Le compteur est donc dans l'écran Offense, et le global est signalé
sans être fait. **Ethan tranche.**

---

## 6. Point 15 — deux camps ensemble donnent du quartz ET de la scorie

Ethan : « Lorsqu'il y a deux camps ou plus qui spawn, faire au moins 1 quartz
1 scorie. »

### ⚠⚠ ON CONTRAINT LA CASE, JAMAIS LE SATELLITE

La **saveur est une propriété de la CASE** — arbitrage du 29/08, « deux camps
successifs sur la même case sont riches de la même chose ». Poser un champ
`saveur` sur le satellite aurait été une seconde vérité contre `saveurDeLaCase`,
et **`SAVE_VERSION` aurait dû bouger pour une grandeur qui se calcule.** La
contrainte porte donc sur l'ensemble des cases candidates.

### ⚠⚠ `src/sim/saveur.js` ENTRE, ET C'EST UN CYCLE D'IMPORTS QUI L'A EXIGÉ

`saveurDeLaCase` vivait dans `src/sim/site-de-la-case.js`, qui importe
`satellites.js`. Lui faire importer `saveurDeLaCase` en retour aurait créé le
**premier cycle d'imports de `src/sim/`** — mesuré : il n'y en a **aucun**
aujourd'hui. Les quatre exports — `SEL_TERRAIN_DU_SITE`, `graineDuTerrain`,
`SAVEURS_TIRABLES`, `saveurDeLaCase` — descendent dans un module qui n'importe
que `hachageBrut` de `peuplement.js`. Précédent exact : `src/sim/base-courante.js`
au lot BASES-0.

⚠ **`site-de-la-case.js` les IMPORTE *et* les RÉ-EXPORTE.** Un `export … from`
seul ne crée **aucune liaison locale** — la leçon payée au lot MURS-OUVRAGE : le
module lève au premier appel. Les deux formes sont écrites.

### ⚠⚠ Les deux chemins d'apparition simultanée, relevés et NOMMÉS

Le brief demandait de dire lequel produit vraiment des apparitions simultanées.
**Les deux le font, et c'est mesuré :**

1. **`planifierSatellites`** programme les **trois** apparitions d'une base neuve
   au **MÊME tick** — `du = etat.horloge.nbTicks + TICKS_APPARITION`, écrit une
   fois pour toute la boucle. Mesuré : `new Set(attentes.map(a => a.tickDu)).size
   === 1`.
2. **`detruireSatellite`** en pousse une à la fois — mais depuis le lot
   SATELLITES-RESPAWN elle pousse `tickDu: etat.horloge.nbTicks`, c'est-à-dire
   une attente **déjà échue**. **Deux camps rasés dans la même minute donnent
   donc deux attentes au même tick**, mesuré : `RET T12 bis` en rase deux et
   asserte `new Set(ticks).size === 1`.

Les deux passent par la **même boucle** de `resoudreSatellitesDeLaBase`, et c'est
pourquoi la contrainte y vit et nulle part ailleurs.

### La forme retenue, et pourquoi c'est la seule

```
const dues = laBase.satellites.attentes.filter((a) => a.tickDu <= quand).length;
let rang = 0;
…
const saveurVoulue = dues >= 2 ? SAVEURS_TIRABLES[rang % SAVEURS_TIRABLES.length] : null;
```

puis, dans `poserUnSatellite`, **AVANT le tirage** :

```
const voulues = saveurVoulue === null ? libres
  : libres.filter((k) => saveurDeLaCase(etat.graine, k.rangee, k.colonne, type) === saveurVoulue);
const candidates = voulues.length > 0 ? voulues : libres;
const choisie = candidates[entier(rng, 0, candidates.length - 1)];
```

⚠⚠ **LE DÉTERMINISME NE SE NÉGOCIE PAS, ET C'EST CE QUI DICTE LA FORME.** Un
tirage relancé jusqu'à tomber sur la bonne saveur consommerait un nombre de
tirages qui dépend du **RÉSULTAT**, et deux parties identiques divergeraient.
`entier` est appelé **UNE fois quoi qu'il arrive**.

⚠ **À un seul satellite, rien ne change** — `dues >= 2`, donc `null`, donc aucune
contrainte. `RET T13` balaie 200 graines et exige que les **deux** saveurs
restent atteignables.

⚠ **La contrainte CÈDE plutôt que de ne rien poser.** Un anneau où aucune case
libre ne porte la saveur voulue ferait disparaître le satellite si l'on s'y
tenait ; il vaut mieux deux camps du même bord qu'un camp manquant, et le repli
consomme le même unique tirage.

⚠⚠ **ET CE REPLI N'EST PAS ATTEIGNABLE AUJOURD'HUI — MESURÉ, PAS SUPPOSÉ.**
Balayage de **400 graines × 2 types = 800 anneaux** : **zéro** anneau où une des
deux saveurs manque. Le pire cas relevé est **1 case sur 12** (graines 68 et
290, anneau de camp). **Aucun test comportemental n'est donc écrit pour ce
repli** — « un test qui ne peut tomber sur aucun état d'aujourd'hui se déclare,
il ne se compte pas ». C'est `RET T15` qui le garde, par la SOURCE.

### ⚠⚠ Le décalage de tirages : il vaut ZÉRO, et c'est la mesure exigée

**La contrainte ne consomme AUCUN tirage de plus.** Elle rétrécit l'ensemble des
candidates, elle ne relance rien. Mesuré de deux façons :

- **Par le compteur d'instances** : il avance d'une unité par pose, et une pose
  consomme un tirage de case. Après `rattraperJeu(TICKS_APPARITION)` sur une base
  neuve, `prochaineInstanceSatellite === PREMIERE_INSTANCE + presents.length` —
  **trois satellites, trois tirages**, avant comme après.
- **Par le flux de la partie** : `etat.rng` est identique à celui d'un
  `creerEtat(7)` neuf. La graine d'une apparition se dérive de l'INSTANCE, jamais
  du flux courant.

⚠ **CE QUI CHANGE EST LE RÉSULTAT DU TIRAGE, PAS LEUR NOMBRE** : la liste des
candidates est plus courte, donc l'indice tombe ailleurs, donc les cases bougent.

⚠⚠ **ET LA MESURE DE SOURCE PORTE SUR LE CORPS DE `poserUnSatellite`, JAMAIS SUR
LE FICHIER.** `niveauDuSatellite` tire elle aussi, pour son rayon : compter
`entier(rng,` sur le fichier entier attraperait ce tirage-là, qui n'a rien à voir
avec le choix de la case et qui existait avant le lot. `RET T15` extrait le corps
de la fonction, **prouve d'abord que la tranche n'est pas vide** — elle doit
porter `saveurVoulue` et `const choisie =` — **et qu'elle ne couvre pas tout le
fichier**, puis compte. **Première écriture corrigée après mesure : elle comptait
le fichier et rendait 2.**

### ⚠⚠ Ce que le décalage déplace, et l'attribution est PROUVÉE

Le témoin de BASES-0 bouge de **soixante-dix couples sur 350**, à partir de la
**phase 2** — celle où les satellites paraissent. **La phase 1 est identique AU
BIT.** Neuf champs sont touchés : `satellites`, `prochaineInstanceSatellite`,
`satellitesDetruits`, puis `economie`, `armee`, `attaque`, `recherche`,
`rapports`, `sitesEntames` à partir du premier raid.

⚠⚠ **L'ATTRIBUTION EST MESURÉE, PAS RAISONNÉE.** En neutralisant **la seule
ligne** de la contrainte — `saveurVoulue = null` — **et** la couche de témoin de
ce lot, `test/bases.test.js` repasse **30 pass / 0 fail**. Tout le déplacement
est imputable à cette ligne, et à elle seule.

⚠⚠ **UN SEUL SCALAIRE BOUGE, ET SUR QUATORZE GRAINES SUR VINGT-CINQ** : la cible
du raid de proximité. Un camp qui n'est plus sur la même case n'est plus la même
cible. **Les ONZE autres restent gardées contre la capture d'origine.** Gestes,
gestes d'armement, **taille de la sauvegarde**, cases atteignables, déplacement,
nombre de bases attaquantes et nombre de cibles : **0 sur 25 pour chacun** —
c'est la mesure qui dit que le lot ne touche que la saveur des satellites.

⚠ **Les deux empreintes de rapport bougent sur les vingt-cinq graines** : un camp
d'une autre saveur rend un autre butin, et ce que la base a en stock quand
l'Ouvrage la frappe en dépend.

⚠ **Le témoin est SURCHARGÉ, jamais rafraîchi.** `DEPLACES_PAR_RETOUCHES` entre
comme treizième couche par-dessus les douze précédentes.

---

## 7. Les tests — PASS/KO et montage effectivement écrit

**`npm test` : 1 370 → 1 386 pass / 0 fail. Seize tests entrent.** Aucune
assertion n'a été retirée ni assouplie ; **une garde change de cible et se
RESSERRE** — `ÉD T12`, qui passe de trois à quatre sélecteurs.

| Code | Verdict | Montage effectivement écrit |
|---|---|---|
| **RET T1** | PASS | Base avec Complexe, garnison intacte, bande Défense : le bandeau est `hidden`. |
| **RET T2** | PASS | La même, garnison abîmée : `hidden === false`, et le texte porte le délai. |
| **RET T3** | PASS | Base **sans** Complexe : le bandeau sort, et c'est l'autre cas anormal. |
| **RET T4** | PASS | Feuille décommentée : `position: absolute` **et** `pointer-events: none`, et l'absence de `flex: 0 0` sur cet identifiant. |
| **RET T5** | PASS | Règle CSS de `#offense-palette .unite` : `background: transparent`, aucun `#343A2C`. |
| **RET T6** | PASS | UNE règle de pointillé dans toute la feuille, portant les **quatre** sélecteurs nommés. |
| **RET T7** | PASS | Les trois `border-color` extraites de la feuille, triées : `['#1E2124', '#4E5742', '#F5F3E8']` — deux à deux différentes. Plus les deux signaux de l'armée. |
| **RET T8** | PASS | `vueDeLOffense` rend le roster ENTIER, avec des verrouillées ET des disponibles, chacune avec sa raison ; la feuille grise par `opacity`. |
| **RET T9** | PASS | Trois réserves **distinctes** et **différentes de celle des bâtiments** ; l'écran monté écrit exactement `ligneDeLaReserveDArmee`, les trois familles s'y lisent, le plafond est celui du moteur, et **ce n'est pas celui des bâtiments**. |
| **RET T10** | PASS | La réserve change dans l'état → le texte peint change ; puis le NIVEAU de l'armée change → il change encore. |
| **RET T11** | PASS | Base neuve, armée vide : `doesNotThrow` côté armée, `throws` côté bâtiments, et la ligne se peint. |
| **RET T12** | PASS | **200 graines**, `rattraperJeu(TICKS_APPARITION)` : les deux camps ne sont jamais du même bord. **Zéro sur 200.** |
| **RET T12 bis** | PASS | Le montage mesure sa propre prémisse : trois attentes au même tick ; puis deux camps rasés donnent deux attentes au même tick. |
| **RET T13** | PASS | 200 graines, **une** attente : les deux saveurs restent atteignables. |
| **RET T14** | PASS | Même graine deux fois → même sérialisation ; graine voisine → différente ; et `tickJeu × n ≡ rattraperJeu(n)`. |
| **RET T15** | PASS | Compteur d'instances **dérivé**, `etat.rng` intact, et le corps de `poserUnSatellite` porte **un seul** `entier(rng,` avec le filtre **avant** lui. |

### La mesure d'avant le lot qui rend `RET T12` non vacuous

**Mesuré sur 200 graines AVANT d'écrire une ligne : les deux camps sortaient du
même bord 91 fois.** Une seule graine n'aurait rien falsifié — le tirage libre y
produit déjà le bon résultat une fois sur deux.

---

## 8. Les falsifications — vingt tentatives, vingt chutes

| # | Falsification | Ce qui tombe |
|---|---|---|
| 1 | Le bandeau reparaît toujours (la ligne de retrait enfermée dans `if (false)`) | `RET T1` |
| 2 | Seul l'avertissement le retient (`enAttente` oublié) | `RET T2` |
| 3 | Le fond plein revient sur la vignette | `RET T5` |
| 4 | Le pointillé est **RECOPIÉ** dans une troisième règle | `RET T5`, `T6`, `T7` |
| 5 | L'armé et le repos rendent le même liseré | `RET T7` |
| 6 | Le plafond est écrit en dur (`432000`) au lieu d'être lu | `RET T9`, `T10` |
| 7 | C'est la réserve des **bâtiments** qui est peinte | `RET T9`, `T10` |
| 8 | La ligne ne se peint jamais (`'—'` en dur) | `RET T9`, `T10`, `T11` |
| 9 | La contrainte est retirée — **la seule ligne du lot** | `RET T12` + les trois BASES-0 |
| 10 | Un **re-tirage en boucle** plutôt qu'une contrainte avant le tirage | `RET T15` + les trois BASES-0 |
| 11 | La contrainte s'applique même à **UN** seul satellite (`dues >= 1`) | `RET T13` + deux BASES-0 |
| 12 | La saveur voulue ne tourne plus — toujours la première | `RET T12` |
| 13 | La contrainte **ne cède plus** — un anneau sans la saveur ne pose rien | `RET T15` |
| 14 | Le bandeau retourne dans le flux (`flex: 0 0 auto`) | `RET T4` |
| 15 | Le bandeau avale le toucher (`pointer-events` retiré) | `RET T4` |
| 16 | Sans Complexe, l'avertissement se tait | `RET T3` + `RETOUR-D T17` |
| 17 | Les trois attentes sont **échelonnées** | `RET T12`, `T12 bis`, `T15` + 17 gardes de satellites |
| 18 | La palette de l'Offense **FILTRE** de nouveau | `RET T8` + 3 gardes existantes |
| 19 | La vignette éteinte perd son `opacity` | `RET T8` |
| 20 | Le choix de la case consomme `etat.rng` | `RET T15` + les trois BASES-0 + une garde existante |

⚠⚠ **LA TREIZIÈME NE MORD QUE PAR LA SOURCE, ET IL FAUT LE DIRE.** Retirer le
repli fait tomber `RET T15` parce que le motif `voulues.length > 0` disparaît, et
non parce qu'un comportement change : **le repli n'est atteignable sur aucun
anneau d'aujourd'hui**, mesuré ci-dessus sur 800 anneaux. La garde est écrite
quand même, à l'endroit où elle peut l'être.

⚠ **DEUX FALSIFICATIONS ONT DÛ ÊTRE REPRISES AVANT D'ÊTRE COMPTÉES**, et aucune
des deux ne mesurait ce qu'elle prétendait. (1) Le plafond remplacé par
`12 * TICKS_PAR_HEURE` : la constante n'étant pas importée, le MODULE ne se
chargeait plus et cinq tests tombaient, dont deux sans rapport. (2) Une
falsification de `saveurDeLaCase` par renommage : même faute, le fichier de test
entier refusait de se charger. **Ce n'est pas la propriété qu'elles mesurent**,
et les deux ont été réécrites en changeant une VALEUR et non un NOM.

⚠ **ET LA DIX-SEPTIÈME EST LA PLUS BRUYANTE**, ce qui est le signe qu'elle
touche un fait structurel : échelonner les attentes fait tomber vingt tests, dont
dix-sept gardes qui existaient bien avant ce lot.

---

## 9. Ce qui n'a pas bougé, vérifié plutôt que cru

⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 28 — vérifié au diff.**
`src/sim/state.js` n'a **pas une ligne de changée**. Pas un champ n'entre dans
l'état : la saveur se CALCULE depuis la case, un bandeau caché est un affichage,
une ligne de réserve est une lecture, et un liseré est un dessin. **La taille de
la sauvegarde ne bouge pas d'un octet** sur les vingt-cinq graines du témoin.

⚠ **`src/sim/reparation.js` n'a pas une ligne de changée** — le brief l'exige :
aucun plafond, aucun débit, aucune réserve. Le lot LIT.

⚠ **`etatDeLaGarnison` et `RETOUR_DEFENSES` n'ont pas une ligne de changée**
non plus.

⚠ **L'arbitrage grisage / filtrage n'est pas touché** : l'Offense grise, la
Défense grise aussi, et `RET T8` garde le premier.

⚠ **Les niveaux et les rayons des satellites ne sont pas touchés** : seule la
saveur est contrainte, et `niveauDuSatellite` garde son propre tirage.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne.

---

## 10. Écarts déclarés

⚠⚠ **LA BASE ANNONCÉE PAR LE BRIEF N'ÉTAIT PLUS LÀ.** 1 340 pass et
8 256 764 octets contre **1 370 pass et 8 346 566 octets** mesurés. Le lot
DÉPLACEMENT-ÉCLAIRÉ a été exécuté juste avant, sur la même branche. **Signalé,
pas traité comme un point d'arrêt** — les faits dont ce lot dépend étaient
intacts, vérifiés un par un.

⚠⚠ **LE LOT N'EST PAS SUR SA PROPRE BRANCHE.** L'environnement d'exécution
épingle la session à une branche unique ; les quatre lots de la série sont donc
quatre **COMMITS** distincts sur `claude/foyer-zer0-patch-5lqyq8`. Celui-ci est
le second. Précédent exact : la série EMBLÈME-CENTRÉ du 06/09.

⚠ **`src/sim/saveur.js` ENTRE, ET LE BRIEF NE LE PRÉVOYAIT PAS.** Le motif est
mesuré — voir §6 — et le fichier ne porte que du déplacement : pas une ligne de
`saveurDeLaCase` n'a changé en route.

⚠ **AUCUN COMPTEUR GLOBAL** — signalé, chiffré au §5, non fait.

---

## 11. Points en suspens, pour Ethan

1. **Le compteur global de la barre des ressources.** Chiffré : six tuiles
   ramènent les cinq existantes à 54,7 px, huit à 38 px. **À trancher.**
2. **`direLaDuree` et son point décimal** — « 12.0 h » au lieu de « 12,0 h ». La
   fonction est partagée avec le Chantier ; la corriger demande de corriger les
   deux affichages ensemble, dans un lot qui les nomme tous les deux.
3. **La rotation des saveurs porte sur TOUTES les apparitions dues, pas sur les
   seuls camps.** Une base neuve pose deux camps et un avant-poste : les rangs 0
   et 1 vont aux deux camps — quartz puis scorie, ce qu'Ethan demande — et le
   rang 2, l'avant-poste, retombe sur quartz. **Lecture prise, réversible d'une
   ligne** si Ethan veut la rotation par TYPE.
4. **Le repli de la contrainte est inatteignable aujourd'hui** (0 sur 800
   anneaux). Il est écrit et gardé par la source ; le jour où un anneau saturé le
   rendra atteignable, il faudra un test comportemental.

---

## 12. Le rendu

`npm run check` : **1 386 pass / 0 fail**, `npm run build` → `dist/index.html`,
**8 350 024 octets**, **0 référence externe**.

Relevé dans Chromium à la géométrie du S25 FE, sur deux vraies parties chargées :
**zéro erreur de page, zéro débordement horizontal**.
