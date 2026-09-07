# RAPPORT — lot FONDATION : ce que contient toute base neuve du joueur

> Remplace le lot DEPART, qui n'a pas été commité. Ses deux archives sont
> **périmées** : elles posaient le Chantier en (11, 5).

---

## 1. Résultat, mesuré

| | `main` | après ce lot |
|---|---|---|
| `npm test` | 238 pass / 0 fail | **243 pass / 0 fail** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **inchangé, même SHA-256** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

---

## 2. Deux corrections par rapport au lot DEPART

### 2.1 La position : (11, 5) → **(18, 5)**

> « Quand j'ai dit en haut je pensais à 18,5 »

Le signalement du lot précédent portait donc juste, et la réponse **renverse**
la position. La rangée 18 est le **FOND** de la bande : l'assaillant part des
rangées 1–2, traverse la défense (3–10), puis progresse en montant en numéro de
rangée. La 18 est la dernière qu'il atteint.

**Et ça devient cohérent.** Le Chantier est le seul bâtiment sans plancher de PV
(`plancherPv: false`), et sa perte force le redéploiement de 20 cases. L'abriter
au fond a du sens ; l'exposer en première ligne n'en avait pas.

⚠ **« En haut » est ambigu et ne doit plus être employé** : selon qu'on regarde
l'écran ou les numéros de rangée, il désigne l'un ou l'autre bout. La confusion
a coûté un lot. La fonction s'appelle donc `caseDuChantier`, jamais
`caseHaute` ni `caseBasse` — le nom dit ce que la case EST.

### 2.2 La portée : la première base → **toutes les bases**

> « Toutes les bases que le joueur posent suivront la même logique : chantier
> niv 1 gratuit, sur position 18,5 »

Ce n'est donc pas la règle du DÉMARRAGE, c'est la règle de **FONDATION**. Deux
renommages, faits maintenant parce que rien n'est commité :

| Avant | Après |
|---|---|
| `BASE_INITIALE` | **`BASE_NEUVE`** |
| `dispositionInitiale()` | **`dispositionNouvelleBase()`** |
| `caseHauteCentrale()` | **`caseDuChantier()`** |

« Initiale » aurait fait croire à un cas particulier du démarrage, et quelqu'un
aurait fini par écrire une seconde fonction pour les bases suivantes.

---

## 3. Ce qui n'a pas changé, et qui tient toujours

- **Les coordonnées sont dérivées de `GEOMETRIE_BASE`**, pas écrites en dur. Un
  changement de `GRILLE` les déplacerait tout seul.
- **Le centre est EXACT** : la bande fait 9 colonnes, donc 5 tombe juste. Rien à
  arbitrer, contrairement au centre de la carte monde.
- **Un emplacement libre**, prouvé dans les deux sens : un bâtiment de plus
  passe, deux donnent `trop-de-batiments`.
- **La case ne porte jamais de champ.** Les champs se tiennent entre les rangées
  12 et 17 : ni la 11 ni la 18 n'en portent. La fondation est légale partout
  **par construction** — ce qui compte d'autant plus maintenant que la règle
  vaut pour des positions inconnues à l'avance. Vérifié sur **65 terrains
  tirés** sur toute la carte, pas seulement sur la position de départ.

---

## 4. Falsification — six défauts, six tombés

| Défaut injecté | Résultat |
|---|---|
| reposée rangée 11 (le côté exposé) | **tombe (2 tests)** |
| colonne 4 au lieu du centre | tombe |
| niveau 2 à la fondation | tombe (3) |
| la table est rendue au lieu d'une copie | tombe |
| deux bâtiments à la fondation | tombe (2) |
| les champs mordent sur le pourtour (`margeBord` 0) | tombe |

Le premier est le plus utile : un test dédié asserte que le Chantier est
**derrière** la défense et **pas** sur `premiereRangee`, de sorte qu'un retour
en arrière silencieux est impossible.

---

## 5. Fichiers — ⚠ DEUX ARCHIVES

| Archive | Fichiers |
|---|---|
| **1 — `src/`** | `src/data/base.js`, `src/sim/disposition.js` |
| **2 — `test/` + racine** | `test/disposition.test.js`, `CLAUDE.md`, ce rapport |

⚠ **Jeter les deux archives `lotDEPART`.** Elles posent le Chantier en (11, 5).

---

## 6. Les trois arbitrages sont clos

1. ✅ **Position sur la carte** — rangée 275, colonne 16, niveau 5 (lot CARTE).
2. ✅ **Contenu d'une base neuve** — ce lot.
3. ✅ **Sauvegardes** — aucune n'existe, personne ne joue.

**Plus rien ne bloque la bascule de `sim/state.js`** : remplacer `batiments` par
`disposition` + `champs` + `economie`, brancher `economie-base` à la place
d'`economy`, écrire la migration 3 → 4 qui reconstruit une base neuve **et le
dit**, puis retirer `sim/economy.js` et `params.batiments`.
