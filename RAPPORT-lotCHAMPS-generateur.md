# RAPPORT — lot CHAMPS : le générateur de terrain d'une base

> Lot vérifiable par exécution, livré en direct. Pas de brief Claude Code.
> Le merge sur `main` appartient à Ethan.

---

## 1. Résultat, mesuré

| | avant (lot BASE-0) | après |
|---|---|---|
| `npm test` | 180 pass / 0 fail | **193 pass / 0 fail** |
| Fichiers `*.test.js` | 17 | **18** |
| Fichiers `src/sim/` | 7 | **8** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **81 236 o · `f6b082b4…5ad430`** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

**Pas de bump.** `src/index.src.html` n'importe toujours que `ui/banc.js` :
ni `sim/champs.js` ni `data/base.js` n'entrent dans le bundle. HTML identique à
l'octet, SHA-256 vérifié, donc manifeste de Pages inchangé.

**`main` reste VERT.** La garde du lot 1 (`clock.test.js` test 4) accepte le
huitième fichier de `src/sim/` : aucune référence navigateur, aucune horloge
système, aucun `Math.random`.

---

## 2. Ce que le lot ajoute

### `src/sim/champs.js` — `champsDeLaBase(rangéeCarte, colonneCarte)`

Rend le terrain d'une base : douze cases de champ, quartz ou scorie, posées en
blocs de une à trois cases contiguës dans les quarante-deux cases intérieures de
la bande `batiments`.

**Le terrain est une FONCTION de la position.** Même case de carte → même
terrain, à l'octet près, pour toujours. Aucune horloge, aucun état global, le
PRNG du projet explicitement passé.

Exports : `champsDeLaBase`, `graineDePosition`, `decouperEnBlocs`,
`blocsDuTerrain`, `categorieDuBloc`, `ressourceDeLaCase`.

### Deux arbitrages consignés dans `data/base.js`

- `ressourceDonneeParLeChamp: true` — **le champ décide de ce que produit le
  collecteur.** C'est pourquoi `BASE_BATIMENTS.collecteur.ressource` vaut
  `quartzOuScorie` : la réponse n'est pas dans la ligne du bâtiment, elle est
  sous lui.
- `tentativesMax: 64` — garde-fou du tirage, avec sa mesure (§4).

### Une règle DÉDUITE, et signalée comme telle

`contactLateralEntreBlocsDeMemeRessource: false`. **Deux blocs de même ressource
ne se touchent jamais par un côté.** Ce n'est pas dicté : c'est déduit. Sans
cette règle, deux blocs de deux posés côte à côte formeraient un bloc de quatre
**à l'œil**, et « les champs viennent par un, deux ou trois » cesserait d'être
vrai à l'écran tout en restant vrai dans les données.

Le contact en **diagonale** reste permis — il ne fusionne rien visuellement — et
un test compte les diagonales pour prouver que la règle porte bien sur les côtés
seuls et pas sur tout.

Deux blocs de ressources **différentes** peuvent se toucher librement.

---

## 3. Mesures sur les 9 000 positions de la carte réelle (30 × 300)

| Grandeur | Mesure |
|---|---|
| Tentatives | **max 1 · médiane 1 · moyenne 1,0000** |
| Répartitions | 5/7 → 3 019 · 6/6 → 2 952 · 7/5 → 3 029 |
| Blocs par taille | 1 → 28 697 · 2 → 18 482 · 3 → 14 113 |
| Triplets | droits 4 844 · coudés 9 269 (rapport 1,91) |
| Cases posées | 108 000 = 9 000 × 12, exactement |

Le rapport 1,91 entre coudés et droits tombe des quatre orientations du L contre
les deux de la barre — attendu 2, mesuré 1,91, l'écart venant des rejets de
placement.

---

## 4. Deux affirmations que j'ai écrites sans les mesurer

Les deux attrapées avant livraison, les deux corrigées. Elles sont notées ici
parce que c'est la même faute que la passation du 26/08 recense déjà en §4.4, et
qu'elle s'est reproduite deux fois dans le même lot.

### 4.1 « Pire cas 4 tentatives, facteur 16 de marge »

Écrit dans `base.js` **avant** d'exécuter quoi que ce soit. **Mesuré : 1
tentative, partout.** Le garde-fou ne se déclenche jamais aux valeurs actuelles.

Plutôt que d'annoncer une marge qui n'a pas de sens, j'ai mesuré **où il
mord**, en saturant la zone :

| cases / 42 | max tentatives | moyenne | échecs |
|---|---|---|---|
| 12 (valeur réelle) | 1 | 1,00 | 0 |
| 24 | 2 | 1,00 | 0 |
| 28 | 4 | 1,13 | 0 |
| 30 | 9 | 1,60 | 0 |
| 32 | 22 | 3,52 | 0 |

Douze cases sont très loin du point de rupture. `tentativesMax: 64` couvre
confortablement un doublement du compte.

### 4.2 « Poser les petits blocs en dernier fait échouer bien plus souvent »

Écrit pour justifier le tri décroissant. **Non mesuré au moment de l'écrire.**

C'est vrai, mais **seulement sous contrainte** — et à douze cases, l'ordre ne
change rigoureusement rien :

| cases / 42 | gros d'abord | petits d'abord |
|---|---|---|
| 12 | max 1 · moy 1,00 · 0 échec | max 1 · moy 1,00 · 0 échec |
| 24 | max 2 · moy 1,00 · 0 échec | max 6 · moy 1,36 · 0 échec |
| 28 | max 4 · moy 1,13 · 0 échec | max 37 · moy 5,74 · 0 échec |
| 30 | max 9 · moy 1,60 · 0 échec | max 64 · moy 19,76 · **139 échecs** |
| 32 | max 22 · moy 3,52 · 0 échec | max 64 · moy 31,41 · **1 269 échecs** |

1 800 positions par ligne. Le commentaire dit maintenant exactement ça, tableau
compris — et il dit aussi que le test qui inverserait cet ordre **ne tomberait
pas**, parce que ce n'est pas un défaut, c'est une marge pour plus tard.

### 4.3 Et une troisième, dans `CLAUDE.md`

En consignant la correction du §5, j'ai écrit « plus aucune occurrence
d'atelier hors `MODELE-ECONOMIQUE.md` ». **Faux** : `grep` en trouve cinq, dont
quatre qui racontent la correction elle-même. Corrigé, avec le compte exact.

---

## 5. Falsification — onze défauts injectés, dix tombés, et le onzième a raison

Chaque défaut appliqué sur une copie fraîche du dépôt, ancre vérifiée à une
occurrence, suite relancée.

| Défaut injecté | Résultat |
|---|---|
| garde anti-collage de même ressource désactivée | tombe (3 tests) |
| graine symétrique — (3,12) = (12,3) | tombe (1) |
| résultat non trié | tombe (1) |
| graine constante — même terrain partout | tombe (4) |
| onze cases au lieu de douze | tombe (10) |
| les champs débordent sur le pourtour | tombe (2) |
| que des cases isolées (`taillesBloc: [1]`) | tombe (3) |
| que des triplets droits | tombe (1) |
| répartition toujours la première | tombe (1) |
| flux de tentative ignorant la position | tombe (1) |
| **petits blocs posés en premier** | **PASSE** |

**Le onzième doit passer**, et c'est ce qui m'a fait mesurer le §4.2 : ce n'est
pas un défaut, c'est une stratégie de placement différente qui produit un
terrain tout aussi valide. La suite a raison de ne pas tomber. Si elle était
tombée, elle aurait asserté un détail d'implémentation au lieu d'une propriété.

**Le premier est le plus important.** Les blocs sont **reconstruits par
composantes connexes** depuis les seules cases (`blocsDuTerrain`), jamais relus
de ce que le tirage croit avoir posé. Un tirage juge de sa propre partie ne
prouve rien : en désactivant la garde, la reconstruction voit des blocs de
quatre et cinq, et trois tests tombent.

---

## 6. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/sim/champs.js` | **nouveau** — le générateur |
| `test/champs.test.js` | **nouveau** — 13 tests |
| `src/data/base.js` | `ressourceDonneeParLeChamp`, `tentativesMax`, `contactLateralEntreBlocsDeMemeRessource` ; bloc « non arbitré » réduit |
| `MODELE-REPARATION-1.md` | §3 « atelier » → **Dépôt de véhicules** (2 endroits) ; §6.2 et §6.3 clos |
| `CLAUDE.md` | §0 compteurs (180 → 193), §2 `src/sim/` 7 → 8 et `test/` 17 → 18, §6 deux pièges neufs, piège « atelier » précisé |
| `test/base.test.js` | un renvoi de commentaire mis à jour |
| `RAPPORT-lotCHAMPS-generateur.md` | ce fichier |

**Découpable ?** Oui, mais dans cet ordre : `src/data/base.js` **avant**
`src/sim/champs.js` — le module lit `CHAMPS.tentativesMax`, qui n'existe pas
sans lui. Les quatre autres sont indépendants. Le plus simple reste de tout
commiter d'un bloc.

---

## 7. Ce qui reste ouvert

### 7.1 Deux points d'arbitrage

- **Un collecteur gagne-t-il un DÉBIT par case de champ adjacente ?** Le champ
  sous lui décide de sa RESSOURCE — c'est tranché. Mais la centrale, elle, gagne
  60/h par champ de scorie voisin, et rien n'est dit pour le collecteur.
- **Le pendant Ouvrage d'une raffinerie à scorie.** `sites.js` a Gangue (silo à
  quartz) ET Terril (tas de scorie) ; `base.js` colle un seul nom, Gangue, à une
  raffinerie qui stocke l'un ou l'autre. Trois sorties : deux noms selon la
  ressource, un équivalent approximatif qui suffit, ou deux bâtiments joueur
  séparés — ce dernier ferait douze bâtiments au lieu d'onze.

### 7.2 Une déduction à confirmer

**Le redéploiement change les champs.** Le tirage dépend de la position ;
Chantier détruit → 20 cases vers le bas → nouvelle position → nouveau terrain.
Ça découle mécaniquement du code livré, mais ça n'a jamais été dit. Si ce n'est
pas voulu, c'est ici qu'il faut le dire, avant que quoi que ce soit en dépende.

### 7.3 Le chantier de fond, inchangé

Brancher la base, c'est **remplacer** `sim/economy.js`, pas l'étendre. Il tourne
encore sur le modèle du lot 1 : deux types de bâtiments, courbe hyperbolique,
adjacence anonyme plafonnée à deux voisins, une capacité globale, deux
ressources — plus le reliquat des colis, morts depuis le 25/08.

`data/base.js` demande onze bâtiments, pente ×1,25, voisinage typé sur huit
cases, capacité par bâtiment, et une troisième ressource. Le terrain sur lequel
tout ça se pose existe maintenant.
