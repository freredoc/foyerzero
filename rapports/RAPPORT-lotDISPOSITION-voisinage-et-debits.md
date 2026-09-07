# RAPPORT — lot DISPOSITION : voisinage typé et débits d'une base posée

> Lot vérifiable par exécution, livré en direct. Pas de brief Claude Code.
> Le merge sur `main` appartient à Ethan.

---

## 1. Résultat, mesuré

| | avant (lot RAFFINERIE) | après |
|---|---|---|
| `npm test` | 198 pass / 0 fail | **213 pass / 0 fail** |
| Fichiers `*.test.js` | 19 | **20** |
| Fichiers `src/sim/` | 8 | **9** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **81 236 o · `f6b082b4…5ad430`** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

Pas de bump : rien de tout ça n'entre dans le bundle. `main` reste **vert**, et
la garde du lot 1 accepte le neuvième fichier de `src/sim/`.

---

## 2. Ce que le lot ajoute

`src/sim/disposition.js` — la pièce qui manquait entre `sim/champs.js` (le
terrain) et le moteur économique. Trois questions, et trois seulement :

| Fonction | Répond à |
|---|---|
| `problemesDeDisposition` | cette disposition est-elle légale, et **sinon en quoi exactement** |
| `voisinsQualifiants` | combien de voisins qualifiants, **par type** |
| `debitDuBatiment` | combien d'unités/h, voisinage compris, avec le détail |
| `ressourceProduite` | quartz, scorie, électricité — ou `null` quand ce n'est pas tranché |
| `casesVoisines` | le 3 × 3 privé de son centre, **dérivé de `VOISINAGE.rayon`** |

### Une disposition s'écrit comme un site de l'Ouvrage

`{ id, rangee, colonne, niveau }`, **un bâtiment par case**. Ce n'est pas une
convention inventée pour l'occasion : c'est exactement ce que produit
`placerBatiments` de `sim/generateur.js` pour un site ennemi. **Vérifié dans le
code avant d'écrire une ligne**, plutôt que supposé — la géométrie est la même
par arbitrage du 26/08, donc l'écriture devait l'être aussi.

### Il signale, il ne corrige pas

`problemesDeDisposition` rend **tous** les défauts, pas le premier, chacun avec
un `code` stable et un `message` en français. Elle **ne lève jamais** pour une
faute de jeu — seulement pour une faute de programme (structure absente, indice
hors liste). C'est « rien ne se retire en silence » (`CLAUDE.md` §4) appliqué :
un joueur qui a trois problèmes les voit ensemble, et c'est lui qui purge.

Huit codes : `inconnu` · `niveau` · `hors-base` · `superposition` ·
`hors-champ` · `champ-gache` · `doublon` · `sans-chantier` ·
`trop-de-batiments`.

⚠ **`champ-gache` compte dans les deux sens.** Poser une centrale sur un champ
ne casse rien mécaniquement — mais ça brûle une des douze cases de collecteur de
la base. Le signaler est le seul moyen que le joueur le voie.

---

## 3. Deux choix mesurables, et pourquoi ils le sont

### 3.1 Aucun plafond de voisins autre que la géométrie

Le modèle du lot 1 plafonnait l'adjacence à **deux** voisins
(`params.adjacence.maxVoisins`). Celui-ci ne plafonne rien : les huit cases du
3 × 3 comptent toutes. **Confondre les deux divise la production par quatre dans
le meilleur cas**, et rien dans le code ne l'aurait dit.

Un test monte donc délibérément à cinq raffineries autour d'un collecteur :
240 + 5 × 72 = **600**. Sous un plafond à deux on lirait 384, et le test asserte
les deux — la valeur juste **et** la valeur fausse.

### 3.2 L'arrondi se fait par type, puis se multiplie

Le choix n'est visible qu'à certains niveaux. Centrale niveau 3, trois champs de
scorie voisins, bonus de base 60 :

```
60 × 1,25² = 93,75
  arrondi par type puis multiplié : round(93,75) × 3 = 94 × 3 = 282
  somme puis arrondie             : round(93,75 × 3) = round(281,25) = 281
```

Une unité d'écart, qui se creuse ensuite. Le test asserte **282, et asserte que
ce n'est pas 281** — sans la seconde moitié, il ne distinguerait pas les deux
méthodes, qui coïncident à presque tous les autres niveaux.

---

## 4. Ce que le module ne tranche pas

**`ressourceProduite` rend `null` pour la raffinerie, et c'est assumé.** Elle
produit 72/h par collecteur voisin, mais **rien ne dit de quoi**. La lecture la
plus naturelle serait « la ressource du collecteur qui l'a causé », ce qui
ferait de sa production un mélange — et ce n'est pas une inférence à faire à ta
place.

Le détail par voisin est rendu dans `debitDuBatiment().parVoisin` : de quoi
trancher plus tard **sans rien recalculer**.

Les trois autres sont tranchés : collecteur → ce qu'il y a sous lui (arbitré le
26/08) · centrale et accumulateur → électricité.

---

## 5. Falsification — onze défauts, dix tombés, et le onzième a trouvé du code mort

| Défaut injecté | Résultat |
|---|---|
| le collecteur peut être posé hors champ | tombe (4 tests) |
| n'importe qui peut occuper un champ | tombe (2) |
| plafond à 2 voisins (modèle du lot 1) | tombe (4) |
| arrondi de la somme au lieu du type | tombe (1) |
| bonus figé au niveau 1 | tombe (2) |
| le Chantier ne compte pas dans ses emplacements | tombe (1) |
| on s'arrête au premier problème | tombe (2) |
| `champDeScorie` compte n'importe quel champ | tombe (1) |
| la ressource vient de la fiche, pas du champ | tombe (1) |
| le centre est dans son propre voisinage | tombe (1) |
| **un bâtiment se compte lui-même comme voisin** | **PASSE** |

### Le onzième n'est pas un test faible, c'est une garde morte

Retirer `i !== index` de `voisinsQualifiants` ne fait tomber aucun test — et
c'est **normal** : `casesVoisines` exclut le centre, donc la case du bâtiment
lui-même n'est jamais parcourue. La garde est **inatteignable aujourd'hui**.

Elle reste, et le code dit maintenant pourquoi : sans elle, la justesse de
`voisinsQualifiants` dépendrait d'une propriété écrite dans une **autre**
fonction. Et il suffirait qu'un jour `DEBITS[x].parVoisin` porte une clé égale à
`x` — un collecteur qui paierait ses collecteurs voisins — pour qu'elle
redevienne nécessaire si la géométrie bougeait aussi. Garde locale, coût nul,
morte pour l'instant : **écrit dans le fichier pour que personne ne la
« nettoie » sans savoir ce qu'elle tenait.**

### Une inefficacité trouvée au passage

La carte des cases occupées se reconstruisait **une fois par type de voisin** au
lieu d'une fois par bâtiment. Corrigé — sans effet sur les résultats, tous les
tests le confirment.

---

## 6. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/sim/disposition.js` | **nouveau** — le module |
| `test/disposition.test.js` | **nouveau** — 15 tests |
| `CLAUDE.md` | §0 compteur, §2 `src/sim/` 8 → 9 et `test/` 19 → 20, §6 quatre pièges neufs |
| `RAPPORT-lotDISPOSITION-voisinage-et-debits.md` | ce fichier |

**Ordre de commit** : `CLAUDE.md` **avec** `test/disposition.test.js` — le garde
fou documentaire du lot précédent asserte le compte de tests, donc l'un sans
l'autre laisse `main` rouge. Tout commiter d'un bloc.

### Le garde-fou du lot précédent a servi dès son premier lot

J'ai mis `CLAUDE.md` à jour, relancé, et la suite est passée **rouge** : elle
m'a donné 213 au lieu de me laisser deviner. C'est exactement ce pour quoi il a
été écrit, et c'est la deuxième fois qu'il tombe sur moi.

---

## 7. Ce qui reste ouvert

1. **La ressource produite par la raffinerie** (§4). C'est la dernière
   inconnue avant d'écrire le moteur.
2. **Le redéploiement change les champs** — découle du code, jamais dit.
3. **Le reliquat des colis** : `params.colis` + les deux blocs de `economy.js`.
   ⚠ **À faire AVEC le remplacement du moteur, pas avant** : les deux touchent
   `SAVE_VERSION`, et les grouper coûte UNE migration au lieu de deux.
4. **Les valeurs manquantes ailleurs** : coûts de réparation, plafonds
   d'électricité, réserve de temps de réparation, formule du dépassement.
5. **Le remplacement de `sim/economy.js`.** Il tourne encore sur le modèle du
   lot 1. Ce lot-ci lui fournit ce qui lui manquait : le terrain, la validation,
   le voisinage typé et les débits. Ce qui reste à écrire, c'est le TICK — le
   stock par ressource et par bâtiment, la saturation, le rattrapage.
