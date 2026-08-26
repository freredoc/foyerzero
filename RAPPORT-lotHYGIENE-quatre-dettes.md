# RAPPORT — lot HYGIÈNE

> Quatre dettes de la passation du 25/08, closes ensemble. Décisions prises
> seul, à la demande d'Ethan ; chacune est motivée au §6.

---

## 1. Mesuré, pas estimé

| | avant | après |
|---|---|---|
| `npm test` | 154 pass / 0 fail | **164 pass / 0 fail** (+10) |
| durée de la suite | 12,7 s | **13,7 s** (+1,0 s) |
| `npm run build` | 81 236 o | **81 236 o**, inchangé à l'octet |
| fichiers de test | 15 | **16** |

**La suite est VERTE.** Aucun fichier de `src/` touché : ce lot ne change pas
une ligne de code de production.

---

## 2. Les quatre dettes

### 2.1 La garde du lot 1 (`test/clock.test.js`, test 4)

`/\bdocument\b/` déclenchait sur **« documenté »**. `\b` est ASCII en
JavaScript : la frontière de mot tombe entre le « t » et le « é ». Le projet
écrivant tous ses commentaires en français, on avait pris l'habitude d'écrire
« consigné » dans `src/sim/` pour contourner la garde.

Mesuré côte à côte :

| chaîne | ancien motif | nouveau |
|---|---|---|
| `ce comportement est documenté` | **ATTRAPÉ** | passe |
| `la documentation` | passe | passe |
| `un documentaire` | passe | passe |
| `document.body` | ATTRAPÉ | **ATTRAPÉ** |
| `le document est là` | ATTRAPÉ | **ATTRAPÉ** |

Noter l'incohérence de l'ancien : il attrapait `documenté` mais laissait passer
`documentation`. Ce n'était pas « trop strict », c'était **arbitraire**.

Les neuf motifs de mot passent par
`` new RegExp(`(?<![\p{L}\p{N}_])${mot}(?![\p{L}\p{N}_])`, 'u') ``, et `new Date`
gagne la même borne. Les trois motifs à point (`Math.random`, `Date.now`,
`performance.now`) sont inchangés : ils ne sont pas des mots.

**Le test 4 asserte désormais les deux sens** — cinq mots français innocents ne
déclenchent rien, quatre vraies violations restent attrapées. L'ancien
n'assertait que l'appât.

### 2.2 `SPEC-FOYER-ZERO.md` l. 281

La cellule se contredisait dans son propre texte : « couloir **9 × 300**, format
téléphone : 30 de large, 300 de haut ». C'est **30 × 300**, conforme à
`GEOGRAPHIE.carte = { largeur: 30, hauteur: 300 }` de `sites.js`.

Une seule occurrence dans la spec, corrigée. Les quatre autres mentions du
« 9 × 300 » (dans `CLAUDE.md`, la passation et `PATCH-grille-vagues-portrait.md`)
sont des **descriptions du défaut** et restent justes.

C'était le fichier de rang 1 qui mentait, depuis le 24/08.

### 2.3 Les liens morts — sept, pas trois

Le balayage complet de la racine en a trouvé **sept**, dont **quatre réels** :

| cité | réel | occurrences |
|---|---|---|
| `MODELE-REPARATION.md` | `MODELE-REPARATION-1.md` | 4 |
| `COURBE-DE-NIVEAU.md` | `COURBE-DE-NIVEAU-2.md` | 2 |
| `BASE-DU-JOUEUR.md` | `BASE-DU-JOUEUR-1.md` | 1 |
| `FOYER-ZERO-CALIBRAGE.xlsx` | `FOYER-ZERO-CALIBRAGE-2.xlsx` | 2 |

**Neuf références réparées** dans cinq documents : `BASE-DU-JOUEUR-1.md`,
`COURBE-DE-NIVEAU-2.md`, `MODELE-REPARATION-1.md`, `RELEVE-TA-COURBES-2.md`,
`SPEC-FOYER-ZERO.md`.

Les trois autres sont **volontairement sans cible** et se disent telles :
`BRIEF-lot5B-*.md` et `BRIEF-lot5C-*.md` (hors dépôt, passation §6) et
`chantier-economie.xlsx` (`RAPPORT-LOT-1.md`). Non touchés.

Contrôle après réparation : plus aucune citation de la racine ne pointe dans le
vide, sauf ces trois-là et celles que `CLAUDE.md` cite exprès pour documenter le
défaut.

### 2.4 `verif.mjs` — supprimé, ses invariants promus en test

**Le fichier était doublement mort.** Il importait `MATRICE_COLONNES`, renommé
`COLONNES_DEGATS` depuis un lot antérieur : il plantait à l'import. Et même
l'import réparé, sa boucle testait `u.matrice` sur des entités qui portent
`u.degats` — elle aurait sauté **toutes** les entités en silence et affiché
« ok ». Rien ne le signalait : il n'était pas dans `npm run check`.

J'ai rejoué ses seize invariants, corrigés, sur les données actuelles :
**seize tiennent**, et un est devenu faux — `verif.mjs` bornait les matrices de
dégâts à `[0, 1]`. C'étaient des coefficients ; `degats` porte aujourd'hui des
dégâts **absolus**, jusqu'à 300. Le borner à 1 échouerait sur **51 valeurs**.

Nouveau fichier **`test/donnees.test.js`**, dix tests, dans `npm run check` :

| invariant | statut |
|---|---|
| colonnes de dégâts = `COLONNES_DEGATS`, entiers ≥ 0 | repris, **borne [0,1] abandonnée** |
| bascule `antiStructure` → `antiAerien` en défense | repris |
| aucun aéronef ne défend | repris |
| tout module référencé existe dans `MODULES` | repris |
| parts des bâtiments = 1, deux uniques | repris |
| `GARNISON`/`VAGUES` : sommes à 100, ids connus, déblocage | repris |
| garnison sans unité absente de la défense | repris |
| vagues sans structure | repris |
| barème de recherche ↔ pool défensif, exactement | repris |
| densité ≤ 72 cases, camp ≤ avant-poste | repris |
| budgets de raid monotones **et croissants** | repris, renforcé |
| ~~14 unités / 9 défenses~~ | **écarté** — déjà dans `roster.test.js` |
| ~~bandes contiguës, 72 cases~~ | **écarté** — déjà dans `grille.test.js` |

---

## 3. Falsifiabilité — prouvée sur trois défauts injectés

| défaut injecté | attrapé par |
|---|---|
| part du `noeud` 0,40 → 0,45 | *parts des bâtiments* — « somme des parts = 1.05 » |
| module `fumigene` → `module_fantome` | *modules définis* — « unité meute référence le module inconnu » |
| `merlon: 5` glissé dans `VAGUES` niveau 5 | **deux tests** : *déblocage* (« merlon n'apparaît qu'au niveau 6 ») et *vagues sans structure* |

Et pour la garde du lot 1, la table du §2.1 est elle-même la falsification.

---

## 4. Une erreur commise, et corrigée avant livraison

Ma première rédaction de `donnees.test.js` portait neuf gardes de montage du
type `assert.ok(x >= 5, 'montage trop maigre')`. **Ces seuils étaient devinés.**
L'un d'eux était faux et le test est tombé : il n'y a pas cinq bâtiments
proportionnels, il y en a **trois** (`noeud` 0,4 · `gangue` 0,3 · `terril` 0,3).

C'est exactement la faute que `CLAUDE.md` §5 interdit — « les seuils se
calculent, ne se devinent pas » — commise dans le fichier même qui prétend
asseoir les invariants. Les neuf sont désormais des **égalités mesurées** :

| garde | valeur mesurée |
|---|---|
| entités porteuses de dégâts | **20** sur 23 (les 3 autres sont murs et barrières) |
| unités présentes en défense | **8** sur 14 |
| aéronefs au roster | **4** |
| références de modules / modules définis | **42** / **14** |
| bâtiments proportionnels | **3** |
| lignes de composition parcourues | **22** (11 `GARNISON` + 11 `VAGUES`) |
| pool défensif | **17** |
| paliers de densité | **10** |
| paliers de budget de raid | **9**, de 30 à 250 |

Une égalité plutôt qu'un plancher : ajouter une unité au roster fera tomber le
test, et c'est voulu — le changement doit être **délibéré et visible**.

---

## 5. Fichiers — huit modifiés, un créé, un supprimé

| fichier | ce qui change |
|---|---|
| `test/clock.test.js` | garde bornée en Unicode + assertions des deux sens |
| **`test/donnees.test.js`** | **NOUVEAU** — dix tests d'invariants de données |
| **`verif.mjs`** | **À SUPPRIMER** (racine) |
| `CLAUDE.md` | référence 164 tests · liens morts · spec · garde · arborescence · §`verif.mjs` |
| `SPEC-FOYER-ZERO.md` | l. 281 : 9 × 300 → **30 × 300** ; 1 lien réparé |
| `BASE-DU-JOUEUR-1.md` | 2 liens réparés |
| `COURBE-DE-NIVEAU-2.md` | 1 lien réparé |
| `MODELE-REPARATION-1.md` | 2 liens réparés |
| `RELEVE-TA-COURBES-2.md` | 3 liens réparés |

`src/` : **non touché**. `package.json` : **non touché**, voir §7.

---

## 6. Les décisions prises, et leur motif

**`verif.mjs` : supprimé, pas réparé.** Le réparer aurait rendu à la racine un
script qu'aucune commande ne lance — il aurait re-pourri, exactement comme la
première fois, et personne ne l'aurait su. La règle qui en sort : *un audit hors
de `npm run check` ne s'exécute pas, donc n'existe pas.* Elle est écrite dans
`CLAUDE.md`.

**Liens morts : citations corrigées, fichiers NON renommés.** Renommer
`MODELE-REPARATION-1.md` en `MODELE-REPARATION.md` aurait été plus propre en
apparence, mais aurait cassé **toutes** les citations des passations et des neuf
rapports, qui font l'historique du projet — on aurait échangé quatre liens morts
contre plusieurs dizaines. La réparation des citations est strictement additive :
elle ne casse rien.

**Deux invariants de `verif.mjs` écartés plutôt que recopiés.** « 14 unités,
9 défenses » et « bandes contiguës, 72 cases » sont déjà assertés dans
`roster.test.js` et `grille.test.js`. Les recopier aurait créé deux endroits où
la même vérité s'écrit — c'est la faute que `CLAUDE.md` §4 interdit pour les
données, et elle est aussi laide dans les tests.

**La borne `[0, 1]` des dégâts abandonnée plutôt que « corrigée ».** Elle datait
d'un modèle de matrice de coefficients qui n'existe plus. Lui inventer une borne
absolue de remplacement aurait été un seuil deviné. Ce qui reste vérifiable,
ce sont les **clés** et le fait qu'un dégât soit un entier ≥ 0.

---

## 7. Où déposer

**Dépôt `freredoc/foyerzero`, branche `main`.**

Racine : `CLAUDE.md`, `SPEC-FOYER-ZERO.md`, `BASE-DU-JOUEUR-1.md`,
`COURBE-DE-NIVEAU-2.md`, `MODELE-REPARATION-1.md`, `RELEVE-TA-COURBES-2.md`
Dossier `test/` : `clock.test.js`, `donnees.test.js`
**Et `git rm verif.mjs`** à la racine — c'est la seule action que je ne peux pas
livrer sous forme de fichier.

**Découpage.** Trois commits possibles sans jamais casser `main` :

1. **Documentation seule** — les six `.md` de la racine sauf `CLAUDE.md`.
   Aucun effet sur les tests.
2. **`test/clock.test.js` + `test/donnees.test.js` + suppression de
   `verif.mjs`** — ces trois vont ensemble : `CLAUDE.md` décrit `donnees.test.js`
   comme le remplaçant de `verif.mjs`.
3. **`CLAUDE.md`** en dernier, puisqu'il décrit l'état d'après.

En un seul commit, ça marche aussi.

**`package.json` n'est pas livré, délibérément.** `dist/index.html` est
identique à l'octet près, donc son SHA-256 et le manifeste de Pages aussi.
Bumper la version pousserait une mise à jour aux appareils pour un lot qui ne
touche que des tests et de la documentation. Même raisonnement qu'au lot MIROIR.

---

## 8. Laissé en suspens

- **La suite gagne 1,0 s** (12,7 → 13,7 s). Dont ~0,1 s pour `donnees.test.js`,
  qui ne fait que lire des tables. Le reste est du bruit de mesure.
- Rien d'autre du lot HYGIÈNE n'est ouvert : les quatre dettes sont closes.
- Restent, côté Foyer Zéro : la base du joueur en jeu (bloquée sur tes
  captures), la boucle du hors-combat à 1 Hz, les six tests appareil du lot 5C,
  les valeurs manquantes du classeur bâtiments — et une passation du 26/08 à
  écrire en fin de session.
