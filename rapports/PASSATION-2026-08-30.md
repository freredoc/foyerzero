# PASSATION — 30/08/2026, après le lot RECHERCHE

État livré : **0.50.0 · build 51**, `SAVE_VERSION` **14**,
`npm run check` **658 pass / 0 fail**, `dist/index.html` **1 259 092 octets**,
`node tools/audit-maquette.mjs` **ROUGE, 7 écarts** (les mêmes qu'avant le lot).

Le rapport complet est dans `RAPPORT-lotRECHERCHE.md`. Ce qui suit est ce qu'une
session suivante doit savoir AVANT de toucher au dépôt.

## Ce qui a changé de porte

**La recherche seule ouvre les pièces.** `apparition` est redevenue une table de
l'OUVRAGE : `sim/generateur.js` la lit pour peupler ses sites, et plus aucun
chemin du joueur ne la lit — un test balaie `ui/arsenal.js`, `ui/defense.js`,
`ui/chantier.js` et `ui/offense.js` pour l'exiger. Ce que le joueur peut poser se
lit dans `etat.recherche.acquises`.

Le niveau du Centre de commandement ne borne plus que le BUDGET d'armée. Une
pièce déjà posée ne se verrouille donc plus si un bâtiment redescend de niveau.

## Les trois pièges du lot

1. **Le facteur mille vit dans `coutMilli`, et nulle part ailleurs.**
   `ARBRE_RECHERCHE` est en POINTS, `etat.recherche.pointsMilli` en
   MILLI-points. Une comparaison qui l'oublie achète mille fois trop tôt et rien
   à l'écran ne le dit.
2. **`pointsMilli` est une CHAÎNE DÉCIMALE, pas un nombre.** `JSON.stringify`
   lève sur un BigInt, et l'échelle dépasse l'entier sûr dès le niveau 39. Ne
   jamais le passer par `Number`.
3. **`pointsRecherche` lit `modulesDebloques.ouvrage`, jamais `.joueur`.** Les
   deux listes existent dans le même objet ; les confondre majorerait les points
   du joueur de 20 % pour ses propres achats.

## Ce qui est câblé, et ce qui ne l'est pas

- **Un seul module sur quatorze agit : l'Écraseur.** Les treize autres
  s'affichent avec leur description et leur prix, et REFUSENT l'achat par le
  code `effetNonCable` (`data/modules.js`, drapeau `cable`). Câbler un effet =
  écrire la mécanique, puis passer son `cable` à `true`, puis un test qui le
  falsifie.
- **La masse ×2 de l'Écraseur est écrite mais inobservable** : les escouades
  valent toutes 1 de masse, les blindés 5 ou plus. T12bis consigne ce qu'il
  faudrait pour la mesurer et tombera le jour où ce sera possible.
- **L'onglet Spécial n'a aucune mécanique.** Quatre lignes qui s'affichent et ne
  s'achètent pas.
- **Le canal `modulesDebloques.ouvrage` est mort** : le générateur le livre vide,
  donc le bonus de +20 % sur les points de recherche n'est jamais accordé. C'est
  pour ça que les deux corrections de données du §3.3 (Meute et Perceurs, module
  en défense) n'ont AUCUN effet mesurable aujourd'hui — et +19,75 % le jour où ce
  canal sera armé.

## L'écran Recherche

`src/ui/recherche.js`, 9ᵉ fichier de `src/ui/`. Trois panneaux sur un RAIL
(`#recherche-panneaux`, `scroll-snap-type: x mandatory`), pas trois écrans.
L'ordre d'affichage est celui de `ARBRE_RECHERCHE` et **ne se trie pas**
(arbitrage 7 d'Ethan : pas de prérequis entre pièces).

**L'achat se fait en deux touchers** : le premier arme le bouton, le second paie.
Toucher ailleurs désarme, une peinture désarme tout. Un refus est écrit SOUS la
ligne, jamais dans un toast — un bouton `disabled` n'émet aucun clic.

⚠ **Le dépôt n'a toujours pas de DOM en test.** `test/recherche.test.js` porte un
faux `document` d'une soixantaine de lignes, écrit à la main, qui LÈVE sur ce
qu'il ne connaît pas. C'est ce qui rend l'achat en deux touchers falsifiable.
Le réutiliser pour un autre écran est possible ; l'étendre en silence ne l'est
pas — une méthode ajoutée doit rester une méthode que l'écran emploie vraiment.

## Le calibrage, à rouvrir avant le contenu

Récolte remesurée sur un camp rasé : **30 points au niveau 1, 629 au niveau 10,
29 063 au niveau 20, 11 135 435 au niveau 39** — un rapport de **×1,34 à ×1,51
par niveau, décroissant**. L'arbre a été rempli sur une hypothèse de ×2. L'arbre
haut est donc plus loin qu'il n'était censé l'être, et l'écart se creuse : le
module de l'Albatros à 2 500 000 000 demande ~225 camps de niveau 39.

Les prix sont écrits en clair dans `src/data/recherche.js`, sans constante
multiplicative et sans dérivation : un réétalonnage est une ligne de ce fichier.

## Ce qu'il ne faut pas rouvrir sans raison

- La mécanique « plus une unité subit de dégâts, moins elle tape fort »
  (`degatsDUnTir`, `degatsDeFranchissement` de `sim/combat.js`) : câblée depuis
  le lot 2A. Elle est ce qui borne la fenêtre de mesure de l'Écraseur — s'en
  souvenir avant de comparer deux combats tick par tick.
- L'audit maquette : rouge sur sept écarts, et ce n'est aucun de ces lots-ci.

## La marge de taille se resserre

40 908 octets sous la borne de T10, soit **3,1 %** (4,4 % au lot précédent). Le
prochain atlas ne tiendra pas. C'est la borne qu'il faudra rouvrir, pas la
contourner.
