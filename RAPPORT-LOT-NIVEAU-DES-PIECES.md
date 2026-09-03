# RAPPORT — lot NIVEAU-DES-PIÈCES

**Date** : 03/09/2026 · **Version produite** : 0.81.0 · build 83
**Branche** : `claude/sprite-refonte-9il369`

---

## 0. Ce qui a été demandé

Ethan, 03/09, en réponse aux trois formes qui lui étaient soumises pour « comment
le joueur choisit le niveau d'une pièce » : **« b »** — la pièce s'améliore
**une par une**, au geste du Chantier.

Les deux autres formes lui avaient été présentées et sont écartées par cet
arbitrage : le niveau choisi À LA POSE, et un niveau GLOBAL de la force.

---

## 1. Résultat mesuré

| Grandeur | Avant | Après |
|---|---|---|
| `npm test` | 969 pass / 0 fail | **974 pass / 0 fail** |
| `dist/index.html` | 3 345 467 o | **3 347 583 o** (+2 116) |
| `data:` inlinées | 25 | **25** |
| Borne T10 | 3 400 000 | **3 400 000, inchangée** |
| Marge | 54 533 o (1,60 %) | **52 417 o (1,54 %)** |
| `SAVE_VERSION` | 24 | **24, inchangée** |

⚠ **Aucune image n'entre**, donc la borne T10 ne bouge pas. C'est du code, deux
tables et cinq gardes.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni `tools/` — pas un octet de `art/sprites/` ne change.

---

## 2. Ce qui manquait vraiment, et ce qui ne manquait pas

Mon propre rapport du lot ARMÉE-ET-FRONTIÈRE annonçait qu'il manquait « le GESTE
et le GAIN ». **La moitié était fausse, et il faut le dire dans ce sens-là.**

| Pièce du mécanisme | État avant ce lot |
|---|---|
| Le niveau vit DANS la pièce | ✅ depuis la v7 de la sauvegarde (28/08) |
| Le PRIX d'une montée | ✅ arbitré le 28/08, `data/couts-militaires.js`, entité par entité |
| Le GAIN d'une montée | ✅ **depuis toujours** — `facteurMilli` met PV et dégâts à l'échelle du niveau dans `creerCombat` |
| Le PLAFOND | ✅ écrit dans `POINTS_ARMEE` depuis toujours, appliqué aux éditeurs au lot FREEZE-ET-PALETTE |
| **Le GESTE** | ❌ `poserEffectif` écrivait `niveau: 1` et rien ne le relevait |

Conséquence mesurable de ce seul trou : **`niveauDeLArmee` et `niveauDeLaDefense`
affichaient 1,0 dans TOUTE partie du dépôt**, quelle que soit la graine et quel
que soit le temps joué.

---

## 3. Le moteur — `src/sim/state.js`

Deux fonctions entrent, sur le modèle exact d'`ameliorer` pour les bâtiments :

- `problemesDeLAmeliorationDEffectif(etat, force, index)` — rend une LISTE
- `ameliorerEffectif(etat, force, index)` — LÈVE

Quatre codes de refus : `plafond` (le plafond du jeu), `sans-batiment`,
`plafond-commandement`, `manque:<ressource>`.

### ⚠⚠ Le barème vit dans `FORCES`, il ne se choisit pas par un `if`

`FORCES.garnison.coutDeMontee` vaut `coutDeMonteeDefense`, `FORCES.armee.coutDeMontee`
vaut `coutDeMonteeOffense`. C'est la discipline que ce module tient déjà pour
`axe`, `surLeTerrain`, `porteLActivite` et `roster`.

**Et ce n'est pas cosmétique : les deux barèmes divergent pour de bon.** Mesuré
au palier 2, sur les huit unités présentes des deux côtés :

| Unité | Offense | Défense |
|---|---|---|
| Meute | 2 scorie | 1 |
| **Voltigeur** | **5** | **2** |
| Perceurs | 2 | 2 |
| Carapace | 2 | 2 |
| Éclaireur | 3 | 2 |
| Fendeur | 4 | 2 |
| Broyeur | 12 | 12 |
| Bélier | 4 | 3 |

⚠ **Un cas particulier écrit à la main aurait PARU juste** — trois des huit
unités coûtent le même prix des deux côtés. Le Voltigeur est la sonde des tests
pour cette raison exacte : même unité, même ressource, deux nombres.

### ⚠⚠ Le plafond était déjà écrit dans la donnée

`POINTS_ARMEE` de `data/sites.js` dit depuis toujours que chaque budget est
adossé à son bâtiment, « **qui fixe aussi le niveau maximal des unités de son
côté** ». Les éditeurs l'appliquaient depuis FREEZE-ET-PALETTE sur un niveau
qu'un banc leur passe ; ce lot-ci l'applique au **geste**, qui est désormais le
seul chemin par lequel un niveau entre dans une partie.

⚠ **Pas de bâtiment, pas de plafond — donc pas d'amélioration.** C'est la lecture
que `niveauDeCommandement` porte déjà en rendant `null` et non zéro. Le cas
arrive pour de bon : une force posée, puis le QG démoli.

### ⚠⚠ Trois choses que le lot ne fait PAS, et chacune est une décision

1. **Les dégâts ne sont pas effacés.** `degatsMilli` est un absolu de milli-PV ;
   le niveau monte les PV MAXIMUM, donc une pièce entamée ressort relativement
   plus saine sans qu'un seul PV lui ait été rendu. Les remettre à zéro ferait de
   l'amélioration un **soin**, c'est-à-dire un second mécanisme de réparation que
   personne n'a arbitré et qui court-circuiterait les réserves de
   `sim/reparation.js`.
2. **Le bâtiment de production n'est pas exigé.** L'arbitrage du 29/08 dit
   « Infanterie **inconstructible** sans caserne » : il porte sur la
   CONSTRUCTION, et une pièce déjà posée l'est. Rien ne s'ouvre par là — le
   budget et le plafond de commandement bornent déjà le lot. **Une ligne à
   ajouter si Ethan veut l'autre lecture.**
3. **Le budget ne bouge pas**, et ce n'est pas un choix de ce lot : les points
   d'armée sont l'une des grandeurs que `data/niveaux.js` ne met **pas** à
   l'échelle, ce que `pointsEngages` écrit noir sur blanc. Améliorer ne peut donc
   jamais faire sortir une composition déjà posée de son budget.

---

## 4. Les deux écrans

`ACTIONS_ARMEE.ameliorer` (Offense) et `TERRAINS.defense.actions.ameliorer`
(bande Défense de l'écran de la base) perdent leur `null` et gagnent la paire
`problemes` + `agir`.

⚠ **Toute la plomberie existait déjà.** Les deux écrans écrivaient
« vers niv. N+1 » dans un `<em>`, sous la garde « cette ligne ne s'écrit QUE là
où améliorer existe ». Brancher le moteur les allume tous les deux sans qu'une
ligne d'affichage soit à écrire.

⚠ **Les commentaires devenus faux sont partis avec les `null`.** Celui de la
bande Défense affirmait que « ce que gagne une unité améliorée n'est pas
arbitré » : c'était **faux et l'avait toujours été**. Un commentaire qui décrit un
manque comblé envoie chercher un travail déjà fait ; celui-là envoyait en plus
chercher un arbitrage déjà rendu.

---

## 5. ⚠⚠ Le boot sans tête a trouvé trois défauts, dont UN antérieur au lot

Chromium préinstallé, `playwright-core` installé **hors du dépôt** (`/tmp/pw`),
viewport 360 × 800, dpr 3, sur une sauvegarde forgée portant un Mur de défense et
des Voltigeurs.

### (a) La ligne de détail décrivait le mauvais objet — **défaut antérieur, reproduit sur `main`**

`rafraichir` réécrivait `#chantier-selection-detail` avec
`detailDuBatiment(etat, selection)` **sans regarder `terrainSelection`** : une
pièce de garnison sélectionnée se voyait donc décrite par le bâtiment de **même
indice** dans `disposition`.

**Mesuré sur `main` avant toute modification, dans un worktree bâti exprès :**

```
main   : nom "Mur de défense" · detail "Niv. 12"        ← le Chantier, niveau 12
après  : nom "Mur de défense" · detail "Niv. 1 · 5 pts" ← la pièce
```

⚠ **Et `selectionner` écrivait déjà la bonne ligne.** C'est ce qui a caché le
défaut : la bonne valeur s'affichait, puis `rafraichir` passait dans les cent
millisecondes et l'écrasait. **Deux écrivains du même élément qui ne se
connaissent pas** — la faute exacte qu'`avis()` a déjà corrigée ailleurs.

Le défaut date du jour où la bande Défense est devenue éditable (28/08) ; c'est ce
lot qui le rend visible, en donnant enfin au joueur une raison de lire ce
niveau-là.

### (b) et (c) Deux défauts que ce lot venait d'introduire

- **La sélection était lâchée après n'importe quelle action.** Sans effet tant
  que « Retirer » était la seule à agir — elle fait vraiment disparaître la pièce
  — et faux dès qu'« Améliorer » a eu un moteur : le joueur perdait son unité de
  vue au moment même où il venait de la monter.
- **L'`<em>` annonçait une demi-phrase.** Le niveau visé était interpolé À
  L'INTÉRIEUR du gabarit, si bien qu'une barre sans unité choisie affichait
  « Améliorer **vers niv.** ». Invisible tant qu'`agir` valait `null`.

### ⚠ Le correctif retire un cas particulier au lieu d'en ajouter un

`executerAction` testait `nom === 'demolir'` pour décider de lâcher la sélection.
Le cas particulier a tenu tant qu'il était seul, et l'écran Offense en aurait
écrit un second. **`retireLaPiece: true` entre dans les deux tables**, sur le
modèle exact de `cible` — et les deux écrans lisent le champ.

### Relevé final, au doigt, dans Chromium

```
DÉFENSE   avant : "Niv. 1 · 5 pts" · "vers niv. 2" · bandeau "Défense 1,0"
          après : "Niv. 2 · 5 pts" · "vers niv. 3" · bandeau "Défense 2,0"
          après : "Niv. 3 · 5 pts" · "vers niv. 4" · bandeau "Défense 3,0"

OFFENSE   avant : "vague 1 · niveau 1 · 10 pts" · title "Voltigeurs — niveau 1"
          après : "vague 1 · niveau 2 · 10 pts" · title "Voltigeurs — niveau 2"
                  bandeau "Offense 2,0", sélection conservée
```

Zéro erreur de page, zéro erreur de console.

---

## 6. M1 — ce qu'une montée coûte et ce qu'elle donne

Le lot ne touche **aucune valeur d'équilibrage** ; ces nombres sont la
conséquence de tables déjà arbitrées, relevés pour qu'Ethan les voie avant de
jouer avec.

**Ce qu'elle donne** (`facteurMilli`, PV et dégâts) : ×1,10 au niveau 2, **×2,358
au niveau 10**, ×106,7 au niveau 50.

**Ce qu'elle coûte**, Voltigeur, cumulé depuis le niveau 1 :

| Jusqu'au | Offense | Défense |
|---|---|---|
| niveau 10 | 32 639 scorie + 8 159 élec. | 16 319 scorie + 4 080 élec. |
| niveau 50 | 18 141 722 146 scorie | — |

⚠ **La montée est chère très tôt.** 32 639 de scorie pour doubler un Voltigeur,
quand une base neuve en stocke 50. Ce n'est pas un défaut de ce lot — c'est la
courbe d'`ECONOMIE_NIVEAU` appliquée à l'ancre du 28/08 — mais **c'est un
arbitrage qui revient à Ethan** s'il trouve la marche trop haute.

## 7. M2 — la sauvegarde et la réserve de réparation

Quatre Meutes portées du niveau 1 au niveau 10 :

- **la sauvegarde grandit de 4 octets** — quatre `"niveau":1` devenus
  `"niveau":10`, et rien d'autre ; aucun champ n'entre ;
- **l'aller-retour rend les niveaux intacts** : `[10,10,10,10]` ;
- ⚠ **le plafond de la réserve de réparation suit** : **468 000 ticks (13 h) →
  792 000 (22 h)**. C'est la règle arbitrée au lot RÉSERVE — 12 h plus une heure
  par niveau d'armée —, qui devient enfin atteignable maintenant que le niveau
  d'armée peut dépasser 1,0. **Conséquence, pas décision.**

---

## 8. Les gardes

**Cinq tests entrent, le compte passe de 969 à 974.**

| Fichier | Test |
|---|---|
| `test/state.test.js` | `AMÉLIORER-PIÈCE — le geste monte la pièce et débite le barème de SA force` |
| `test/state.test.js` | `AMÉLIORER-PIÈCE — le plafond est le bâtiment de commandement, et sans lui rien ne monte` |
| `test/state.test.js` | `AMÉLIORER-PIÈCE — UN moteur pour les deux forces, et le barème vient de la table` |
| `test/chantier.test.js` | `défense — la ligne de détail suit le TERRAIN, jamais la disposition` |
| `test/offense.test.js` | `offense — la sélection survit à l'amélioration, et la ligne ne dit pas une demi-phrase` |

**Trois gardes existantes sont RESSERRÉES sans perdre une assertion** : la table
des terrains, la barre contextuelle de l'Offense, et l'`<em>` du bouton
Améliorer.

⚠⚠ **L'UNE D'ELLES ÉTAIT UN PIÈGE POSÉ EXPRÈS LE 31/08, ET IL A FONCTIONNÉ.**
`offense — le compteur de points n'est pas dans le bouton Améliorer` portait
`assert.equal(ACTIONS_ARMEE.ameliorer.agir, null, 'améliorer a gagné un moteur :
vérifier ce que le bouton annonce désormais')`. Elle est tombée **au lot qui
branche le moteur, et pas avant**. Elle garde désormais la moitié qui restait
invérifiée : l'`<em>` écrit bien `niveau + 1` et non le niveau courant.

⚠ **La garde de « un seul site d'appel du moteur » s'élargit** aux deux entrées
neuves : une amélioration est un geste comme les autres, donc elle n'a qu'un
chemin, et il est dans la table des terrains.

### ⚠ Vingt falsifications, vingt chutes

| # | Falsification | Ce qui tombe |
|---|---|---|
| F1 | barème croisé (garnison paie l'offense) | les trois `AMÉLIORER-PIÈCE` |
| F2 | plafond de commandement désarmé | le plafond |
| F3 | `sans-batiment` toléré | le plafond |
| F4 | débit calculé après l'incrément | le geste |
| F5 | l'amélioration efface les dégâts | le geste |
| F6 | plafond du jeu rendu vide | le plafond |
| F7 | `'armee'` écrit en dur dans le moteur | le plafond + un moteur |
| F8 | points d'armée mis à l'échelle du niveau | le geste + la vue de l'armée |
| F9 | `ACTIONS_ARMEE.ameliorer` désarmé | les deux gardes Offense |
| F10 | `ameliorer` sans `problemes` (offense) | la barre contextuelle |
| F11 | le bouton annonce le niveau COURANT | l'`<em>` |
| F12 | `TERRAINS.defense.ameliorer` remis à `null` | les deux gardes Défense |
| F13 | second site d'appel du moteur | le geste écrit une fois |
| F14 | `ameliorerEffectif` ne lève plus sur un refus | le plafond |
| F15 | indice hors liste rendu silencieux | le plafond |
| F16 | la ligne de détail repasse par la disposition | la ligne de détail |
| F17 | `retireLaPiece` retiré de `demolir` | la ligne de détail |
| F18 | la sélection relâchée après chaque action | la sélection |
| F19 | le gabarit redevient conditionnel | la sélection |
| F20 | `retireLaPiece` retiré de `retirer` | la sélection |

⚠ **F8 a d'abord été comptée « ne mord pas », et c'était MA falsification qui
était fausse** — elle remplaçait le texte par lui-même. Reprise pour de bon, elle
fait tomber deux tests. **Une falsification qui ne mord pas se vérifie avant
d'être crue** — troisième fois que cette règle sert.

⚠ **Une garde a compté sa propre définition au premier jet.** Celle qui exige un
seul appel de `detailDuBatiment` trouvait `export function detailDuBatiment(` :
c'est « une garde qui lit ce qu'on a écrit à son sujet », déjà payée quatre fois
par le dépôt. Elle retire la déclaration avant de compter.

⚠ **Un montage a écrit une coordonnée, et il est tombé.** Le premier jet posait en
(3, 3) : sur la graine du montage, cette case porte un obstacle. Les quatre poses
**demandent** désormais leur case au moteur. Cinquième fois que « un montage qui
écrit une coordonnée ne garde que lui-même » se vérifie.

⚠ **Et un montage a vidé la mauvaise ressource.** Il mettait la scorie à zéro pour
voir un `manque:` sur un Mur de défense — qui se paie en **quartz**, les six
ouvrages fixes étant bâtis. Il vide les trois.

---

## 9. Ce qui reste ouvert, et qui revient à Ethan

1. **La hauteur de la marche.** 32 639 de scorie pour porter un Voltigeur au
   niveau 10, quand une base neuve en stocke 50. Aucune valeur n'a été touchée ;
   c'est un arbitrage de calibrage.
2. **Le bâtiment de production à l'amélioration.** Retenu : non exigé (l'arbitrage
   du 29/08 parle de construction). Une ligne à ajouter si Ethan lit autrement.
3. **Le code couleur des ressources** — inchangé depuis le lot
   MOULINETTE-TERRAIN : le quartz est violet et la scorie noire à veines orange,
   alors que `FICHE-STYLE.md` réserve encore `#9FB3C5`, `#C1CEDA` et `#382E47` à
   un rendu qui n'existe plus.
4. **« Réparer » sur les barres Base et Offense reste sans moteur, et c'est
   exact** — mais la réparation EXISTE et elle est câblée : `reparerUnePiece` et
   `toutReparer` vivent dans `ui/raid.js`, c'est-à-dire là où le joueur voit son
   armée abîmée en revenant d'un raid. Rien à corriger ; à savoir.
