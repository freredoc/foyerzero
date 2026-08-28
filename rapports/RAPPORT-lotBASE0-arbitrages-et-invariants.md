# RAPPORT — lot BASE-0 : arbitrages du 26/08 et mise sous test de `data/base.js`

> Lot vérifiable par exécution, livré en direct. Pas de brief Claude Code.
> Le merge sur `main` appartient à Ethan.

---

## 1. Résultat, mesuré

| | avant | après |
|---|---|---|
| `npm test` | 164 pass / 0 fail | **180 pass / 0 fail** |
| Fichiers `*.test.js` | 16 | **17** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **81 236 o · `f6b082b4…5ad430`** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

**Pas de bump, et c'est délibéré** (`CLAUDE.md` §5). `src/index.src.html`
n'importe que `ui/banc.js` ; ni `data/base.js` ni la nouvelle suite n'entrent
dans le bundle. Le HTML est identique **à l'octet**, SHA-256 vérifié des deux
côtés, donc le manifeste de Pages aussi. Bumper pousserait une mise à jour aux
appareils pour un changement qui ne les concerne pas.

**La livraison laisse `main` VERT**, mesuré et non estimé. Elle est
commitable d'un bloc ou fichier par fichier, dans n'importe quel ordre : rien
n'y dépend de rien d'autre.

---

## 2. Le point de départ n'était pas celui annoncé

`PASSATION-2026-08-26.md` §3.1.1 déclare la base du joueur **bloquée** : «
`BASE-DU-JOUEUR-1.md` §2 nomme sept bâtiments sur onze, et le Chantier de
construction n'est pas nommé du tout ».

**C'est faux depuis le 25/08.** `src/data/base.js` — rang 2, écrit sur les
arbitrages d'Ethan — porte les **onze**, Chantier compris. `BASE-DU-JOUEUR-1.md`
est de rang 4 et daté du **24/08** : la passation citait le document le plus
vieux, et un blocage inexistant a été reconduit pendant une session.

**Leçon, à ranger avec les autres** : un blocage se vérifie dans le fichier de
rang le plus élevé, pas dans celui qui l'a signalé. La hiérarchie de `CLAUDE.md`
§1 existe exactement pour ça, et elle n'a pas été consultée.

---

## 3. Arbitrages d'Ethan du 26/08, transcrits

Tous dans `src/data/base.js`, avec le commentaire qui dit d'où ils viennent.

### 3.1 Le bâtiment des blindés

**« Dépôt de véhicules »**, clé `depotDeVehicules`. Trois noms coexistaient dans
le dépôt pour un seul bâtiment :

| Endroit | Disait | Verdict |
|---|---|---|
| clé et `nom.joueur` de `base.js` | `usine` / « Usine » | **corrigé** |
| commentaire de `COUT_NIVEAU_DEUX`, même fichier | « dépôt de véhicules » | **avait raison** |
| `MODELE-REPARATION-1.md` §3 | « atelier » | **reste à corriger** — voir §6 |

`ta: 'Factory'` est conservé : c'est l'équivalent Tiberium Alliances, pas le nom.

### 3.2 La géométrie — elle existait déjà

**La base du joueur EST la bande `batiments` de `GRILLE`** (`data/combat.js`) :
rangées 11–18 × 9 colonnes = 72 cases. « Base du joueur, base ennemie, camp,
avant-poste : la même géométrie. » Il n'y avait donc **rien à inventer**, et
surtout rien à écrire en double.

`GEOMETRIE_BASE` **référence** `GRILLE.bandes.batiments` et `GRILLE.largeur`.
Elle ne les recopie pas, et un test le garde (§4, T8).

Conséquence non demandée mais mesurée : le plafond d'emplacements du Chantier
(40) est **toujours** le plafond mordant, 40 < 72. Trente-deux cases qu'aucun
niveau n'ouvrira. Ce n'est pas un défaut — c'est ce qui laisse la place aux
champs et aux passages.

### 3.3 Les champs de ressource — `CHAMPS`

| Grandeur | Valeur |
|---|---|
| Cases de champ par base | **12** |
| Répartitions possibles | 5 quartz / 7 scorie · 6 / 6 · 7 quartz / 5 scorie |
| Tailles de bloc | 1, 2 ou 3 cases contiguës |
| Formes d'un triplet | droit ou coudé, rien d'autre |
| Marge de bord | 1 case — jamais sur le pourtour |
| Ce qui s'y pose | **le collecteur, et lui seul** |
| Tirage | déterministe depuis la POSITION sur la carte |

**Correction d'une valeur dictée.** Ethan avait dit « sept fois cinq » pour
l'intérieur. **Mesuré : 6 × 7 = 42**, rangées 12–17, colonnes 2–8. Le 7 × 5
serait l'intérieur d'un 9 × 7 — l'orientation inversée. Corrigé, et l'écart est
écrit dans le commentaire pour qu'il ne se re-devine pas.

**Conséquence de fond, dérivée et non dictée** : puisque seul le collecteur se
pose sur un champ et qu'il y a douze cases, il y a **douze collecteurs au
maximum**, dont cinq à sept en quartz. C'est un régulateur qui mord bien avant
les quarante emplacements, et un test l'asserte.

### 3.4 Les colis sont morts

Reconfirmé : « ils sont bien abandonnés, tous les bâtiments font de la
production continue ». Consigné dans `base.js`. **Rien retiré ici** :
`params.colis` et le bloc colis de `tickEconomie` / `rattrapageEconomie`
tournent encore et sont gardés par des tests. Les retirer est un lot à part
(§6), pas un effet de bord de celui-ci.

⚠ `BASE-DU-JOUEUR-1.md` §3 affirme l'inverse. Document du 24/08, rang 4 : il a
un jour de retard sur l'arbitrage.

---

## 4. `test/base.test.js` — 16 tests, seuils mesurés

`data/base.js` existait depuis un mois, portait onze bâtiments, sept tables et
cinq fonctions, et **aucune ligne de test ne le touchait**. Ce n'était pas le
cas `verif.mjs` (« un audit hors de `npm run check` n'existe pas ») — c'était
pire : il n'y avait pas d'audit, et aucun module du jeu ne l'importe, donc rien
ne pouvait révéler une faute.

**Une y dormait déjà.** L'en-tête annonçait « trois bâtiments ont un nom
d'Ouvrage » depuis le 25/08. **Ils sont quatre** : Souche, Étai, Nœud, Gangue.
Personne n'avait compté. Corrigé, et asserté par `hasOwnProperty` dans les deux
sens.

| # | Test | Ce qu'il mesure |
|---|---|---|
| T1 | onze bâtiments, nommés, dépôt de véhicules | 11 exactement ; l'ancienne clé `usine` doit avoir disparu |
| T2 | quatre noms d'Ouvrage | liste exacte + les 7 autres SANS la clé |
| T3 | 7 uniques / 4 libres, Chantier seul sans plancher | `plancherPv` est un booléen, jamais calculé |
| T4 | trois châssis | tombent sur ceux de `combat.js`, un par châssis |
| T5 | quatre classes de coût | 3 · 4 · 2 · 2 = 11, aucune orpheline dans les deux sens |
| T6 | `emplacementsDuNiveau` | 10 couples + croissance stricte jusqu'à 30 + stagnation + 6 bornes qui lèvent |
| T7 | le Chantier occupe une case | 1 libre au niveau 1 ; niveau 3 insuffisant, niveau 4 suffisant |
| T8 | la géométrie RÉFÉRENCE `GRILLE` | 8 × 9 = 72 = `casesBatiments` ; `estDansLaBase` sur 4 coins + 4 débords |
| T9 | intérieur = 42, pas 35 | zone exacte + 30 cases de pourtour + toute la zone dans la base |
| T10 | 12 cases, 3 répartitions, 12 collecteurs | les 3 sommes = 12 ; plafond mordant avant les emplacements |
| T11 | `debitParHeure` | 240 → 300 → 13 452 465 ; pente LUE dans `economie.js` ; croissance stricte sur 50 niveaux |
| T12 | voisinage typé et réciproque | 5 bonus ; réciprocité d'EXISTENCE (48 ≠ 72) ; `VOISINAGE` = 3×3 − 1 |
| T13 | `capaciteDuNiveau` | = autonomie × débit du producteur apparié, sur 2 × 6 couples ; 4 bornes qui lèvent |
| T14 | marge arithmétique du niveau 50 | 20 raffineries n50 → marge > 1 000 en milli-unités |
| T15 | réparation manuelle | 3 paliers seulement : 42 / 65 / 88 s |
| T16 | électricité | payante à partir du niveau 3, après le quartz ; 3 fractions dans ]0,1[ |

**Aucune assertion supprimée, aucun seuil abaissé.** Les 164 tests d'origine
sont intacts et passent.

### Chaque nombre écrit a été mesuré avant d'être asserté

`13 452 465` (collecteur n50), `161 429 580` (raffinerie n50), `2 880`,
`1 440`, `42`, `30`, `3 · 4 · 2 · 2` : tous calculés en exécutant le module,
jamais dérivés de tête. Les deux premiers recoupent des valeurs déjà écrites
dans `CLAUDE.md` §6 et dans `base.js` — elles concordent.

### La falsification — 14 défauts injectés, 14 tombés

Un test qui passe n'est pas un test qui prouve. Chaque défaut a été appliqué sur
une copie fraîche du dépôt, ancre vérifiée à 1 occurrence, suite relancée.

| Défaut injecté | Résultat |
|---|---|
| clé `usine` restaurée | tombe |
| la raffinerie perd son `nom.ouvrage` | tombe |
| `margeBord` 1 → 0 | tombe |
| répartition 7/5 → 8/5 (somme 13) | tombe |
| raffinerie ajoutée à `posableDessus` | tombe |
| `GRILLE.largeur` 9 → 8 | tombe |
| `penteProduction` réalignée sur 1,32 | tombe |
| `autonomieHeures` 12 → 6 | tombe |
| le QG offensif perd son plancher de PV | tombe |
| `parNiveauEnsuite` 1 → 2 | tombe |
| bonus centrale ← champ de scorie mis à 0 | tombe |
| `chassis: 'blinde'` → `'vehicule'` | tombe |
| fraction d'électricité `autres` 0,25 → 0,05 | tombe |
| **`derniereColonne` littéralisé à 9 ET `GRILLE.largeur` → 8** | tombe (T8 seul) |

Le dernier est le plus important : c'est celui qui prouve que T8 asserte une
**référence** et pas une coïncidence de valeur. Littéraliser sans toucher
`GRILLE` passe — et c'est correct, rien n'a encore divergé.

---

## 5. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/data/base.js` | clé renommée, `GEOMETRIE_BASE`, `CHAMPS`, `zoneDesChamps()`, `estDansLaBase()`, import de `GRILLE`, 4 commentaires corrigés |
| `test/base.test.js` | **nouveau** — 16 tests |
| `CLAUDE.md` | §0 compteurs (164 → 180), §2 arborescence (16 → 17 fichiers), §6 quatre pièges neufs |
| `RAPPORT-lotBASE0-arbitrages-et-invariants.md` | ce fichier |

Diff hors commentaires de `base.js` : **une seule valeur existante modifiée**,
la clé `usine` → `depotDeVehicules` et son `nom.joueur`. Tout le reste est de
l'ajout. Vérifié par `diff` contre `main`.

---

## 6. Ce qui reste ouvert — quatre points, deux d'arbitrage

### 6.1 Ce qu'un champ de quartz fait au collecteur — ARBITRAGE

`DEBITS.collecteur` produit `quartzOuScorie` et ne tire **aucun** bonus d'un
champ voisin ; seule la centrale en tire un (`champDeScorie: 60`). En l'état,
**un champ de quartz ne fait rien du tout.**

L'hypothèse naturelle est que le champ, étant le socle, **décide de la
ressource** du collecteur qui s'y pose. Elle colle avec `quartzOuScorie` et avec
l'absence de ligne `parVoisin`. **Elle n'est pas confirmée, donc elle n'est pas
codée.** Reste aussi ouvert : un collecteur gagne-t-il quelque chose par case de
champ **adjacente**, comme la centrale ?

### 6.2 Le Terril n'a pas de pendant — ARBITRAGE

`sites.js` porte **cinq** bâtiments de site : souche, etai, noeud, gangue,
terril. `base.js` n'en apparie que quatre. Or la raffinerie stocke
`quartzOuScorie`, et côté Ouvrage la Gangue est le silo à quartz quand le Terril
est le tas de scorie : **une raffinerie qui stocke de la scorie devrait
s'appeler Terril.** Soit `nom.ouvrage` devient dépendant de la ressource, soit
il n'est qu'un équivalent approximatif et la ligne est bonne. Non tranché, non
modifié.

### 6.3 Le redéploiement retire-t-il les champs ?

Le tirage est déterministe **par la position**. Le redéploiement (Chantier
détruit, 20 cases vers le bas) change la position, donc change les champs : ça
**découle**, mais ça n'a pas été dit. À confirmer avant que quoi que ce soit en
dépende.

### 6.4 Deux dettes de nettoyage, chacune un lot

- **`MODELE-REPARATION-1.md` §3 dit encore « atelier ».** Non corrigé ici
  délibérément : c'est la transcription d'une dictée du 24/08, et son §6.3
  déclare le bâtiment encore sans nom — le document est cohérent avec sa date.
  Le corriger, c'est décider d'éditer l'historique. À Ethan.
- **Le reliquat des colis** : `params.colis` + les deux blocs de `economy.js` +
  les tests qui les gardent. Chirurgical mais transverse.

### 6.5 Et le vrai chantier reste devant

Brancher la base, ce n'est pas étendre `sim/economy.js` — c'est **le
remplacer**. Il tourne sur le modèle du lot 1 : deux types de bâtiments,
courbe hyperbolique, adjacence anonyme plafonnée à 2 voisins, **une** capacité
globale, deux ressources. `data/base.js` demande onze bâtiments, pente ×1,25,
voisinage typé sur 8 cases, capacité **par bâtiment**, et une troisième
ressource. Les deux modèles ne se recouvrent pas.

Le prochain lot naturel, entièrement vérifiable ici et sans arbitrage en
attente : **le générateur de champs** — poser 12 cases en blocs de 1/2/3, I ou
L, dans les 42 cases de l'intérieur, depuis une graine de position, de façon
reproductible. Il n'a besoin d'aucune des réponses du §6.1 à §6.3.
