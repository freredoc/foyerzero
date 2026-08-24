# CLAUDE.md — Foyer Zéro

À lire en premier, à chaque session. Fait autorité sur ce document-ci ;
pour le contenu du jeu, voir la hiérarchie ci-dessous.

**Foyer Zéro** (codename interne : *Chantier*) — jeu de guerre idle solo, hors ligne,
distribué comme un fichier HTML autonome, avec enveloppe Android WebView et
auto-update par GitHub Pages. Paquet : `fr.freredoc.foyerzero`.

---

## 1. Qui fait autorité

Dans cet ordre, sans exception :

| Rang | Fichier | Statut |
|---|---|---|
| 1 | `SPEC-FOYER-ZERO.md` | **la spécification. Arbitrée par Ethan. Fait autorité.** |
| 2 | `src/data/*.js` | transcription figée de la spec, **seule source lue par le code** |
| 3 | `ANNEXE-STATS.md`, `MODELE-COMBAT.md`, `MODELE-ECONOMIQUE.md`, `ROSTER.md` | appui, partiellement périmés |
| 4 | `RELEVE-TA-*.md`, `REFERENCE-TA.md`, `COMPTE-RENDU.md`, `AUDIT-CALIBRAGE.md` | matière première historique |

### Les classeurs `.xlsx` ne sont PAS des sources

`FOYER-ZERO-CALIBRAGE-2.xlsx`, `FOYER-ZERO-PROPORTIONS-IA.xlsx`,
`FOYER-ZERO-RECHERCHE.xlsx`, `GABARIT-CALIBRAGE-vide.xlsx` sont des **feuilles de
saisie**. Le classeur de calibrage est resté à l'état d'avant l'audit du 23/08 :
noms d'unités manquants, Perceurs déclaré anti-véhicule, Broyeur anti-structure,
Guetteur anti-véhicule en défense, colonne `credit` alors que les crédits
n'existent plus, formules de couverture latérale cassées.

**Ne jamais lire un `.xlsx` pour coder.** Tout ce qui est arbitré est déjà dans
`src/data/`. Si une valeur manque, elle se demande à Ethan — elle ne se récupère
pas dans le classeur.

### Sections périmées, à ne pas suivre

- `ROSTER.md` §4 (grille 5 × 4 des châssis) et §9 (cases vides) : périmés par la
  suppression des châssis *Pièce* et *Masse*. Trois châssis seulement.
- `ROSTER.md` : contrainte Affût/Dard du palier 5, dette DA du Dard — **tombées**,
  il n'y a plus d'anti-aérien offensif.
- `MODELE-ECONOMIQUE.md` §5 (composition de site, butin par bâtiment) : remplacé
  par `SPEC-FOYER-ZERO.md` §8 et `src/data/sites.js`.

---

## 2. Arborescence réelle

```
src/index.src.html      point d'entrée ; son <script type="module"> est LE point d'entrée JS
src/data/               toutes les valeurs de calibrage
  params.js             économie (lot 1)
  combat.js             grille, unités, défenses, modules, ciblage, écrasement
  sites.js              bâtiments de site, butin, densité, garnisons, vagues, recherche, géographie
src/sim/                simulation déterministe : rng.js, clock.js, state.js, economy.js
src/render/             vide
src/ui/                 vide
test/                   *.test.js, node:test
tools/build.js          src/ → dist/index.html, un seul fichier autonome
android/                enveloppe WebView + module maj (Kotlin, tests JVM)
```

`dist/` est un produit de build, jamais commité.

---

## 3. Commandes

```
npm ci
npm run build     # node tools/build.js → dist/index.html
npm test          # node --test "test/*.test.js"
npm run check     # build + tests, à passer avant toute livraison
```

Le build **sort en erreur** si le HTML produit référence quoi que ce soit
d'extérieur. L'offline est non négociable.

---

## 4. Conventions

- **ESM**, `"type": "module"`. Français dans le code, les commentaires et les
  messages.
- **Toutes les valeurs de calibrage vivent dans `src/data/`**, jamais en dur dans
  `src/sim/`. Une seule table fait foi par grandeur : ne jamais dupliquer un
  niveau de déblocage ou un barème d'une table à l'autre.
- **Déterminisme strict** : PRNG explicite, boucle à 10 Hz, arithmétique entière
  pour l'économie par tick. Aucun `Math.random`, aucune dépendance à l'horloge
  murale dans la simulation.
- **Deux jeux de noms.** Le joueur emploie le vocabulaire d'une armée régulière
  (Fusiliers, Grenadiers, Percheron…), l'Ouvrage celui des outils et des bêtes
  (Meute, Perceurs, Broyeur…). Même ligne de données, `nom.joueur` et
  `nom.ouvrage`. Ne jamais les mélanger dans une chaîne affichée.
- `node --check` ne prouve que la syntaxe. Un fichier de données se valide **en
  l'important et en asseyant ses invariants** (sommes, bornes, références
  croisées).

---

## 5. Livraison

- Claude Code ouvre une **PR**. Le **merge sur `main` appartient à Ethan seul**.
- Chaque lot produit un `RAPPORT-<lot>.md` **écrit sur disque**, nom descriptif.
  Contenu minimal : version et build réellement produits, fichiers touchés,
  résultat de chaque test (PASS/KO et montage effectif), écarts par rapport au
  brief et leurs raisons, points laissés en suspens.
- Le brief ne propose **aucun numéro de version** : bumper `version` et
  `config.build` de `package.json` ensemble, au numéro disponible au moment de
  l'exécution.
- Ne jamais signaler un défaut connu au moment de livrer : le corriger avant.

---

## 6. Pièges connus

- Le classeur et la spec divergent (§1). La spec gagne, toujours.
- `CIBLAGE-DEFENSE` du classeur porte trois niveaux d'apparition divergents de
  `UNITES` : **`UNITES` fait foi**, arbitré le 24/08.
- La carte fait **30 × 300**, pas 9 × 300 : le « 9 » de la §10 de la spec est une
  contamination de la largeur de la grille de combat. Arbitré le 24/08.
- Le glossaire des modules ne dit pas qui les porte. Les affectations sont dans
  `UNITES[x].module` / `moduleOuvrage`, pas dans la colonne de description.
- Ne jamais dire « l'IA » en parlant de l'adversaire : c'est **l'Ouvrage**.
