# Rapport — lot 3B : fratricide, repli, et lisibilité du banc

## Version livrée

| | |
|---|---|
| `version` | **0.6.0** (était 0.5.0) |
| `config.build` | **6** (était 5) |
| Build produit | `dist/index.html` — version 0.6.0 build 6 — **55 424 octets (54,1 Kio)** |
| `npm run check` | **PASS** — build **et** 98 tests, 0 échec |

---

## Ce qu'Ethan doit revoir sur l'appareil

| | Paramètres | Ce qu'il faut voir |
|---|---|---|
| **Le fratricide, éteint** | camp · niveau 15 · riche en quartz · graine 1 · **Mixte** | C'est le montage exact qui écrasait un Fusilier en **colonne 5**. Suivre la colonne 5 : le Fusilier de la vague 1 et le Pionnier de la vague 2 se suivent maintenant sans que le second passe sur le premier. Le raid finit sur `attaquants` au tick 427. |
| **Le repli, à l'œil** | camp · niveau **5** · riche en quartz · graine 1 · **Infanterie** | Un Fusilier monte seul la **colonne 1**, n'y trouve jamais rien, atteint le fond et **disparaît au tick 350**. Le calcul est vérifiable : parti de 2000 à 50 milli-cases par tick, il atteint la rangée 18 au tick (18 000 − 2 000)/50 = 320, et sort 30 ticks plus tard. Au pas à pas, l'inspecteur affiche « repli dans N ticks » sur sa case pendant tout le décompte. Un Grenadier le suit au tick 406. |
| **La légende** | bouton **Légende** | Les 19 vignettes sont dessinées par `scene.js`, pas recopiées : elles changeront d'elles-mêmes le jour où la palette bougera. |
| **L'inspecteur** | toucher une case | Nom selon le camp, classe, PV, réserve, cible, et le décompte de repli s'il court. |

---

## Défaut 1 — l'écrasement était fratricide

Mesuré avant correctif, sur les 36 raids du brief (3 préréglages × 3 types × 4 graines, niveau 15) :
**10 écrasements d'alliés pour 45 légitimes, soit 18 %** — les chiffres du brief, retrouvés au
raid près. Et en `mixte / camp 15`, la victime était en **colonne 5** aux graines 1, 2, 3 et 42.

La correction tient en une condition, isolée dans une fonction nommée :

```js
function peutEcraser(e, p, occupante, po) {
  return occupante.camp !== e.camp && po.ecrasable && p.masse > po.masse;
}
```

Après correctif, sur les mêmes 36 raids : **0 écrasement d'allié, 44 légitimes**. Le seul
écrasement légitime perdu est un effet de bord attendu — un blindé qui ne double plus son
infanterie arrive une poignée de ticks plus tard, et le raid diverge.

**Conséquence de jeu, consignée et non corrigée** : la colonne devient un choix. Poser un blindé
derrière une infanterie dans la même colonne gâche le blindé, puisqu'aucune unité ne change
jamais de colonne. Les trois préréglages du banc en souffrent — c'est le sujet, pas un défaut.

## Défaut 2 — l'unité qui ne peut plus rien faire restait plantée

`GRILLE.ticksAvantRepli: 30` vit dans `src/data/combat.js`, et `src/sim/combat.js` ne fait que le
lire. Le compteur `ticksInutiles` est un champ d'entité, à côté de `ecrase` et `sorti` : il est
donc visible au pas à pas, dans l'inspecteur et dans l'état sérialisé.

Sur les 36 raids : **9 attaquants immobilisés au fond avant, 3 après** — et les trois restants
sont légitimement occupés, ce sont des Percherons en rangée 18 qui tirent sur l'Étai et la Souche
(dont un à `ticksInutiles: 29`, à un tick de rentrer quand le raid s'est terminé). **16 unités
rentrent maintenant à la base** au lieu de rester plantées.

### Un cas que le brief n'avait pas prévu : le tir à zéro dégât

Le §3 définit « ne peut pas nuire » par *aucune cible à portée dont le facteur de matrice est non
nul*. Ce critère est trop étroit, et le raid C le prouve : après le premier correctif, il
continuait d'expirer au tick 900, bloqué non plus sur six unités mais sur **une seule** — un
Fusilier à **2739 milli-PV sur 2 897 400**.

Sa santé vaut `floor(2739 × 1000 / 2 897 400) = 0 ‰`. Son tir vaut donc
`floor(degats × facteur × 0 / 1000) = 0`. Sa matrice contre l'infanterie est pleine (1,0), mais il
ne retire pas un milli-PV — et son adversaire, dans le même état, ne lui en retire pas davantage.
**Deux unités se tiraient dessus pendant sept cents ticks sans aucun effet.**

Le critère retenu est donc les **dégâts effectifs** : le tir qu'elle porterait ôte-t-il des PV ?
Il subsume celui du brief — un facteur nul donne des dégâts nuls — et referme ce cas. C'est le
seul écart de fond avec le brief, et il était nécessaire pour obtenir le résultat que le brief
lui-même annonce au §3.

⚠ **À signaler à l'arbitrage, sans correction de ma part** : ce blocage à 0 ‰ est une propriété de
la quantification de la santé en millièmes (arbitrage du lot 2A). Une entité tombée sous 1 ‰ de ses
PV maximaux devient définitivement inoffensive sans mourir. Le repli en sort les attaquants ; **le
défenseur, lui, reste sur la grille à 2739 PV pour toujours**. À trancher : faut-il un plancher de
dégâts à 1 milli-PV, ou la mort en dessous d'un certain seuil ?

### Le raid C, avant et après

| | Lot 3A | Lot 3B |
|---|---|---|
| Cause | `duree` | **`attaquants`** |
| Ticks | 900 | **566** |
| Butin | 65 190 quartz · 21 730 scorie | **65 190 quartz · 21 730 scorie** |
| Survivants | 6 | 6 |

Butin **identique** au quartz près, comme le brief l'annonçait : les unités repliées ne faisaient
rien, leur départ ne coûte pas une ressource.

---

## Défaut trouvé en chemin — la projection devenait fausse en cours de partie

L'inspecteur l'a révélé au premier essai sur navigateur : un clic au centre de la case (1,1)
répondait « case (8,3) ».

Le canvas est en `flex: 1`. Au chargement il fait **681 px** de haut ; dès que le panneau de tick
se remplit, il tombe à **411 px**. Or `dimensionner()` n'était appelé qu'au chargement et sur
l'événement `resize` de la fenêtre — qui ne se produit pas. La projection restait donc celle de
681 px : `tailleCase` 37 au lieu de 22, `margeY` 7 au lieu de 7 mais sur une grille de 666 px au
lieu de 396. **Le dessin comme le pointage travaillaient sur une géométrie périmée.**

C'est un défaut du lot 3A, invisible tant que rien ne pointait la grille. Corrigé par un
`ResizeObserver` sur l'élément lui-même, qui couvre tout ce qui change sa taille — panneau qui se
remplit, rotation, clavier virtuel. L'écouteur `resize` est conservé pour le seul cas qu'il ne
voit pas : un changement de `devicePixelRatio` à taille CSS constante. Vérifié au navigateur :
les quatre coins de la grille répondent maintenant juste.

---

## Manque 1 — la légende

19 couples (classe, accent) sont dessinés par `listeLegende(projection)` dans `scene.js`, avec les
**mêmes fonctions de forme** que le champ de bataille et exécutés par le **même**
`canvas2d.executer`. Aucune teinte, aucune cote n'est écrite en propre : balayage du code, zéro
littéral hexadécimal dans le bloc de la légende.

Une primitive `texte` a été ajoutée à `canvas2d.js` — huit lignes, aucune décision : la couleur, la
taille et la position viennent de `scene.js`, et le contrat (« `y` est le centre vertical ») est
posé là.

La liste `ENTREES_LEGENDE` est **écrite à la main**, délibérément. Si elle se déduisait des
données, elle se mettrait à jour toute seule et le test ne prouverait plus rien.

Le bouton **Légende** masque aussi le panneau de tick pendant la lecture : sans cela le canvas
tombe à 411 px et les vignettes à 10 px de côté. Le `ResizeObserver` reprend la projection seul.

## Manque 2 — l'inspecteur

`caseDepuisPixels` dans `projection.js`, pure et **stricte** : un point dans les marges de
letterboxing ou hors du canvas ne rend **aucune** case, jamais la plus proche. Un doigt à côté de
la grille n'a rien désigné, et le banc le dit.

Au toucher comme au clic. L'inspecteur affiche nom selon le camp, classe, PV courants sur PV max,
réserve, cible visée, et `ticksInutiles` sous la forme « repli dans N ticks » quand le compteur
court. Une case peut porter deux entités — l'aviation ne bloque rien — et les deux sont listées.

---

## Fichiers

| Fichier | Lignes | Nature |
|---|---|---|
| `test/repli.test.js` | 475 (neuf) | T1 à T8 |
| `src/render/scene.js` | +146 | la légende et la primitive `texte` |
| `src/sim/combat.js` | +109 / −2 | `peutEcraser`, `peutAvancer`, `peutNuire`, le repli |
| `src/ui/banc.js` | +101 / −4 | légende, inspecteur, `ResizeObserver` |
| `test/combat.test.js` | +64 / −14 | deux tests que la règle a changés |
| `src/render/projection.js` | +30 / −1 | `caseDepuisPixels` |
| `src/data/combat.js` | +9 | `ticksAvantRepli: 30` |
| `src/render/canvas2d.js` | +8 | primitive `texte` |
| `src/index.src.html` | +2 | bouton Légende, curseur du canvas |
| `package.json` | +2 / −2 | version et build |

Aucun `.xlsx` ouvert.

---

## Résultat de chaque test

**98 tests, 98 PASS.** Les dix nouveaux :

| Test | Résultat | Montage effectivement joué |
|---|---|---|
| **T1** | **PASS** | Chasseur (masse 10, 100 milli/tick) en (1,5) derrière un Fusilier allié (masse 1) en (2,5). Après 60 ticks : Fusilier vivant, `ecrase` faux, 100 000 milli-PV intacts, et le Chasseur ne l'a pas doublé. Montage inverse — même Chasseur contre un Meute **défenseur** en (3,5) : écrasé au tick 10 (2000 + 10 × 100 = 3000), et la mobile continue jusqu'à 3000. |
| **T2** | **PASS** | `mixte` / camp 15 / graines 1, 2, 3, 42. Aucun attaquant ne porte `ecrase`. Le test nomme la **colonne 5** et vérifie que le préréglage y pose bien une unité. Garde de non-vacuité : l'écrasement légitime opère toujours sur l'ensemble des quatre graines (il ne se produit pas à chacune — la garnison tirée varie). |
| **T3** | **PASS** | Fusilier seul en colonne 1, unique bâtiment en (18,9) à 8 colonnes (8000² = 64 000 000 contre une portée² de 2 250 000). t₁₈ = (18 000 − 2 000)/50 = **320**, sortie au tick **350** = t₁₈ + 30. Compteur à 0 au tick 320, 1 au tick 321, 29 au tick 349. Vivant, non détruit, compté parmi les survivants ; le raid finit sur `attaquants` au tick 350. |
| **T4** | **PASS** | Fusilier posé d'emblée en rangée 18 (compteur dès le tick 1, sortie au tick 30) et Chasseur en rangée 17 à 100 milli/tick derrière lui. Le Chasseur est bloqué dès le tick 10 (17 000 + 9 × 100 = 17 900, destination en rangée 18 occupée par l'allié) : `ticksInutiles` vaut **20 au tick 29**, puis **0 au tick 30** quand l'allié rentre et libère la case — et le Chasseur repart dans le même tick, à 18 000. |
| **T5** | **PASS** | Le montage du lot 2A : Meute en (2,5), Merlon en (3,5), 2400 milli-PV par tir, mur de 500 000 → 209 ticks. `ticksInutiles` vaut 0 aux ticks 30, 100 et 208 — bloqué mais nuisible — et l'unité ne se replie jamais. |
| **T6** | **PASS** | Le raid C : cause `attaquants`, **566 ticks** (< 900), butin **65 190 / 21 730** identique au lot 3A, 6 survivants dont au moins un rentré à la base. |
| **T7** | **PASS** | Énumération depuis `UNITES`, `DEFENSES` et `BATIMENTS` : **19 couples distincts**, égaux à ceux d'`ENTREES_LEGENDE`, ni manque ni surplus. Chaque entrée porte un libellé. **Falsifiabilité vérifiée** : une unité fictive de châssis `orbital` ajoutée à `UNITES` fait bien diverger les deux ensembles, et la table est rendue intacte ensuite. |
| **T7 bis** | **PASS** | La légende s'exécute par le même `executer` : autant de `fillRect` que de `rect`, de `fillText` que de `texte`, d'`arc` que de `disque`. 29 textes = 19 entrées + 2 camps + 4 divers + 4 titres. Aucune forme hors des cinq connues. |
| **T8** | **PASS** | Les 162 cases en aller-retour sur 412 × 810, 360 × 640 et 800 × 800 — coin supérieur gauche, centre et dernier pixel de chaque case. Marges de letterboxing → `null` des quatre côtés. Hors canvas → `null`. `NaN` → `null`. |
| **T8 bis** | **PASS** | L'inspecteur nomme « Fusiliers » côté assaut et « Meute » côté Ouvrage pour le même identifiant, rend `[]` sur une case vide, affiche la cible après un tick, et « repli dans 25 ticks » sur un Fusilier isolé au tick 325 (30 − 5). |

### T9 — non-régression, et les deux tests que la règle a changés

Les 88 tests antérieurs restent verts, **sauf deux**, dont le brief prévoyait le cas. Dans les
deux, c'est la règle qui a changé, pas le test qui avait tort.

| Test | Avant | Après |
|---|---|---|
| **T14 du lot 2A** | « un attaquant hors de portée de tout » → `duree` au tick 900 | Un tel attaquant rentre désormais à la base et la fin devient `attaquants`. Pour éprouver encore le plafond de 900 ticks, il faut un raid qui **a** une issue mais ne l'atteint pas : un Meute de **niveau 1** devant un Merlon de **niveau 50** (500 × 480 941 681 = 240 470 840 500 milli-PV). Il nuit — donc il ne se replie jamais — mais 900 ticks à 2400 milli-PV n'entament que 0,0009 % du mur. Cause `duree`, `ticksInutiles` à 0, butin nul. |
| **§7 du lot 3A** | « la stoppeuse s'arrête au fond » : Busard planté à 18 950 jusqu'au tick 900 | Le Busard rentre à la base. Ce que le test prouve toujours, et qui reste vrai : une stoppeuse ne franchit **jamais** le fond. Elle est en rangée 18 dès le début du tick 108 (2000 + 107 × 150 = 18 050), rampe jusqu'à 18 950 au tick 113, refuse le pas suivant, et sort au tick **137** = 108 + 29, sans jamais dépasser 19 000. La moitié « traversante » du test est inchangée : le Frappeur sort au tick 57. |

### T10 — le build reste hors ligne

`npm run build` passe. Le HTML produit ne contient aucune URL, aucun `src`/`href` non-`data:`, et
le test le rebalaie indépendamment de la garde de `tools/build.js`. **55 424 octets**, contre
50 025 au lot 3A — la légende et l'inspecteur pèsent 5,4 Kio.

### Vérification sur navigateur réel

Page conduite dans Chromium en 412 × 900, **réseau coupé** : légende ouverte et refermée (canvas
rendu à 681 px pendant la lecture, 411 px après), raid `mixte / camp 15 / graine 1` lancé à ×4 puis
mis en pause, inspecteur cliqué sur les quatre coins de la grille et dans la marge — les quatre
cases répondent juste, la marge répond « hors de la grille ». Zéro erreur de console, zéro requête
réseau.

---

## Écarts par rapport au brief, et leurs raisons

1. **« Ne peut pas nuire » se mesure aux dégâts effectifs, pas au facteur de matrice.** Détaillé
   plus haut : le critère du brief laissait le raid C expirer, ce que le brief lui-même interdit.
2. **Une unité arrêtée pour sa cible de prédilection ne « progresse » pas.** Le brief définit
   « ne peut pas avancer » par deux cas structurels ; une unité qui halte volontairement n'y entre
   pas, et ne se replierait donc jamais. Or c'est exactement l'état du Fusilier du raid C : arrêté
   pour une prédilection, à zéro dégât. Une unité qui halte et dont le tir porte reste en jeu par
   `peutNuire` — le comportement voulu est préservé, seul le cas dégénéré est refermé.
3. **Ramper dans sa propre case ne compte pas comme avancer, sur la dernière rangée.** Sans cela un
   Fusilier arrivé en rangée 18 aurait encore 19 ticks de reptation avant que le compteur ne parte,
   et T3 ne tomberait pas sur t₁₈ + 30. Le brief dit « elle est sur la dernière rangée » : c'est
   pris à la lettre.
4. **La légende présente les quatre classes de structure séparément** — mur, barrière, tourelle,
   artillerie — là où le tableau du §4 écrit « structure ». Ce sont quatre silhouettes distinctes
   dans `scene.js` ; les fondre en une aurait fait mentir la légende, ce que T7 interdit.
5. **Le bouton Légende masque le panneau de tick.** Non demandé, mais sans cela les vignettes
   tombent à 10 px de côté et la légende est illisible — le défaut même qu'elle vient corriger.
6. **`ResizeObserver` ajouté** : défaut du lot 3A trouvé en chemin, détaillé plus haut.

---

## Points laissés en suspens

1. **Le blocage à 0 ‰ de santé.** Détaillé plus haut. Le repli en sort les attaquants ; le
   défenseur reste sur la grille, définitivement inoffensif et définitivement vivant. Plancher de
   dégâts à 1 milli-PV, ou mort sous un seuil ? Arbitrage d'Ethan.
2. **Un raid sur 36 expire encore** — `blindeLourd / avantPoste 15 / graine 1`. Légitime : un
   Percheron à **réserve 0** avance encore vers les bâtiments, donc il progresse et ne se replie
   pas. C'est « arriver vide, c'est ne rien faire » du lot 2A, appliqué à la lettre. Faut-il que le
   repli couvre aussi l'unité qui progresse sans munitions ? Le brief ne le demande pas.
3. **Les trois préréglages du banc alignent des unités dans la même colonne**, ce qui gâche
   maintenant les blindés placés derrière une infanterie. C'est la conséquence de jeu annoncée au
   §2 du brief ; les préréglages n'ont pas été retouchés, pour que le raid de démonstration reste
   comparable à celui du lot 3A.
4. **La rampe ennemie 5 tons** reste une dette DA, comme au lot 3A : l'Ouvrage est toujours dessiné
   dans la rampe métal, et la légende le dit explicitement.

---

## Les huit contrôles du §7

| Contrôle | État |
|---|---|
| L'écrasement teste le camp, et rien d'autre n'a changé dans `deplacement()` | **OK** — le diff contre `main` ne supprime que **deux lignes** : le test d'écrasement et le `continue` du `doitSArreter`. Tout le reste est ajout. |
| `ticksAvantRepli` vit dans `src/data/combat.js`, jamais en dur dans `src/sim/` | **OK** — une seule occurrence dans `src/sim/`, la lecture `GRILLE.ticksAvantRepli`. |
| La légende n'écrit aucune couleur ni aucune forme en propre | **OK** — zéro littéral hexadécimal dans son bloc, et les vignettes passent par les mêmes `dessinerEscouade` / `dessinerBlinde` / `dessinerStructure` que le champ. |
| La projection inverse est l'exacte réciproque de la directe | **OK** — T8, aller-retour des 162 cases sur trois viewports, aux trois points de chaque case. |
| Aucune teinte hors de `FICHE-STYLE.md` | **OK** — le balayage du lot 3A couvre `src/render/`, `src/ui/` et la page, et reste vert avec la légende. |
| Aucun `Math.random` dans `src/` | **OK** — balayage, commentaires exclus. |
| `npm run check` passe | **OK** — build 0.6.0 b6 (55 424 octets) et 98 tests. |
| Aucun `.xlsx` ouvert | **OK.** |
