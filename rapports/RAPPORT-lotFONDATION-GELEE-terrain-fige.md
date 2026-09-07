# RAPPORT — lot FONDATION-GELÉE : le terrain ne suit plus la base

> Arbitrage d'Ethan du **27/08/2026** : « une fois qu'il a posé sa base, les
> champs de quartz et de scorie ne changent plus jamais, sinon ça casserait les
> collecteurs et le schéma. »
> Il clôt le premier des deux points ouverts de `PASSATION-2026-08-26-soir.md`
> §3.3.

---

## 1. Version et build produits

**Aucun bump. `dist/index.html` n'a pas bougé d'un octet.**

| | Avant | Après |
|---|---|---|
| `version` · `config.build` | 0.12.0 · 12 | **0.12.0 · 12** |
| `dist/index.html` | 81 236 o | **81 236 o** |
| SHA-256 | `f6b082b4…5ad430` | **identique** |
| `SAVE_VERSION` | 4 | **5** |
| `npm test` | 241 pass / 0 fail | **245 pass / 0 fail** |

`sim/state.js` n'est pas dans le graphe d'`index.src.html` : le HTML ne pouvait
pas bouger, et le SHA le confirme au lieu de l'espérer. Onzième reconduction.

---

## 2. Ce que l'arbitrage a forcé

Le terrain se déduisait de la **position courante**. Geler le terrain tout en
laissant la base se déplacer rend cette dérivation fausse dès le premier
redéploiement. Deux issues, une seule acceptable :

| Issue | Verdict |
|---|---|
| Sauvegarder les douze cases | **non** — c'est exactement la seconde source de vérité que `state.js` refuse depuis la bascule : une sauvegarde pourrait porter un terrain qui ne correspond à rien, et rien ne le dirait |
| Sauvegarder la case de FONDATION et continuer à dériver | **retenu** — deux entiers, l'invariant tient |

L'état porte donc désormais **deux positions**, et elles ne se confondent
jamais :

- `position` — où la base est aujourd'hui sur la carte. Elle bouge.
- `fondation` — où la base a été posée. Ne sert **qu'au terrain**. Elle ne bouge
  jamais.

Conséquence de jeu, qui découle et mérite d'être dite : **un joueur qui se
replie ne perd pas la disposition de ses collecteurs.** C'est cohérent avec
« rien ne se retire en silence ».

### La migration 4 → 5 ne perd rien — la première depuis la v2

Sous la v4 le terrain était calculé depuis `position`. Écrire
`fondation = position` rend donc **exactement** le terrain que la sauvegarde
avait. La base n'a de toute façon jamais pu bouger, le redéploiement n'existant
pas encore. Un test l'asserte en calculant le terrain v4 **avant** le
chargement et en comparant case par case.

---

## 3. Fichiers touchés

| Fichier | Ce qui change |
|---|---|
| `src/sim/state.js` | `SAVE_VERSION` 5, champ `fondation`, dérivation du terrain, migration 4 → 5, garde `exigerChamp`, bloc d'en-tête réécrit |
| `test/state.test.js` | 4 tests ajoutés, garde du bump mise à 5 et **renforcée** |
| `CLAUDE.md` | §0 (245), §6 (deux positions, terrain gelé, migration) |

---

## 4. Falsification — sept défauts injectés, six attrapés, et le septième a fait corriger le CODE

| # | Défaut injecté | Résultat |
|---|---|---|
| D1 | `charger` redérive le terrain de `position` (l'ancienne règle) | **rouge** |
| D2 | `fondation` partage la référence de `position` | **rouge** |
| D3 | `serialiser` oublie `fondation` | **rouge**, 5 tests |
| D4 | la migration 4 → 5 pose une fondation décalée de 20 rangées | **rouge**, 2 tests |
| D5 | `verifierEtat` ne réclame plus `fondation` | **passe** — voir ci-dessous |
| D6 | le garde-fou `exigerChamp` retiré de `charger` | **rouge** |
| D7 | `SAVE_VERSION` laissée à 4 | **rouge**, 2 tests |

### D5, premier tour : un test qui levait pour la mauvaise raison

Au premier passage, D5 laissait la suite **verte**. Le test « une sauvegarde
amputée de `fondation` est refusée » se contentait d'`assert.throws`. Or sans
`fondation`, `charger` déréférençait `undefined.rangee` **trois lignes avant**
que `verifierEtat` ait pu nommer le champ manquant : ça levait dans les deux
cas, et un seul des deux messages était lisible.

**Le défaut était dans le code, pas dans le test.** Deux corrections :

- `exigerChamp` a été extrait et posé dans `charger` **avant** la dérivation du
  terrain, si bien que le refus nomme le champ ;
- le test asserte désormais le **message**, pas seulement le fait de lever.

C'est `CLAUDE.md` §5 appliqué : *un test qui passerait aussi sur du code cassé
ne prouve rien*. Ici il passait sur du code correct **pour une raison fausse**,
ce qui est la même faute vue de l'autre côté.

### D5, second tour : une garde devenue morte, gardée et documentée

Le correctif rend `fondation` **redondant** dans la liste de `verifierEtat` :
`charger` est aujourd'hui le seul chemin par lequel un état venu du dehors entre
dans le jeu. La garde a été **conservée**, avec le commentaire qui dit ce qui la
rendrait nécessaire — un second point d'entrée qui fabriquerait un état sans
passer par `charger`. C'est la règle de `CLAUDE.md` §6 : une garde morte se
documente, elle ne se supprime pas.

---

## 5. Une interprétation fausse, relevée par Ethan et corrigée avant livraison

La première rédaction de ce lot affirmait qu'un redéploiement « change la
position, et avec elle le NIVEAU de la base, qui suit la rangée ». **C'est
faux**, et Ethan l'a repris le jour même : les niveaux de la carte concernent
**l'Ouvrage seul**. La base du joueur n'a aucun niveau qui vienne de la carte.

Elle en porte **trois**, qui lui sont propres et qui sont chacun une MOYENNE :
niveau de ses **bâtiments**, niveau de sa **défense**, niveau de son **armée
offensive**. Aucun ne bouge quand la base se déplace.

Trois fichiers portaient l'erreur et ont été corrigés avant tout dépôt :

| Fichier | Ce qui était faux |
|---|---|
| `src/sim/state.js` | le bloc d'en-tête faisait suivre le niveau à la rangée |
| `src/sim/carte.js` | `niveauDeLaRangee` s'annonçait « niveau des sites d'une rangée » sans dire que ça ne vaut pas pour le joueur |
| `CLAUDE.md` | « il démarre rangée 275, colonne 16, **niveau 5** » — c'est une **strate**, le niveau des sites de l'Ouvrage à cet endroit, pas celui de la base du joueur. La formule traînait depuis le lot CARTE. |

L'arbitrage des trois niveaux est consigné dans `CLAUDE.md` §6. **Il n'est pas
implémenté** : deux points restent à trancher — l'arrondi de la moyenne, et ce
qui entre dans le compte. Aucune ligne de code ne fabrique aujourd'hui de niveau
de base joueur, et c'est le bon état de départ.

---

## 6. Points laissés en suspens

- **Le redéploiement lui-même n'existe pas.** Ce lot prépare le terrain — au
  sens propre — mais rien ne déplace encore une base. Les tests simulent le
  déplacement en écrivant dans `position`.
- **Brancher un écran** reste devant, et la maquette `foyer-zero-ui.html`
  diverge des données arbitrées sur six points (voir la note de session).
- Les valeurs manquantes du classeur restent à arbitrer.
