# PASSATION — Foyer Zéro, session du 27/08/2026 (soir)

> Session courte et entièrement consacrée à **deux malentendus de surface** et à
> **un arbitrage de grille**. Aucun sprite produit, aucun code touché. Ce qui
> sort d'ici est censé permettre de reprendre la production au propre, sans
> rouvrir ces trois points.
>
> À lire après `PASSATION-2026-08-27.md`, dont le §3 est la source de la moitié
> de ce document.

---

## 1. Les cinq arbitrages, tranchés par Ethan

| # | Question | Tranché |
|---|---|---|
| 1 | Modèle de la carte monde | **fond continu + un emblème par case occupée** |
| 2 | Fond de la carte | **procédural au canvas**, zéro fichier |
| 3 | Grille de rendu au combat | **32**, confirmé sur pièce |
| 4 | Le 128 détaillé | **conservé**, mais pas au combat — cf. §4, qui redresse la formulation |
| 5 | Le sol validé | **gardé tel quel**, réserve notée au §6 |

---

## 2. Ce qui fondait ces décisions — mesures, pas déductions

**La carte monde.** Deux captures de la référence, prises aux deux bouts du
zoom, écart entre deux emblèmes voisins, en pixels physiques (DPR 3, viewport
412 px CSS) :

| Capture | Largeur | Hauteur | Case en px CSS |
|---|---|---|---|
| Zoom serré | ~300 px | ~220 px | **100 × 73** |
| Zoom large | ~141 px | ~106 px | **47 × 35** |

La plage réelle est donc **47 → 100 px CSS**, pas 17 → 68 comme l'écrivait
l'inventaire. Aucune case minuscule n'existe : le dézoom s'arrête bien avant.
Deux autres faits relevés sur les mêmes captures, et corrigés par Ethan : **rien
de ce qui est visible n'est un champ de ressource** — camps, avant-postes et
bases ennemies sont des sites, et leur ressource est dessinée dans leur emblème ;
et **le fond n'est pas un pavage**, c'est une texture continue avec les
frontières tracées par-dessus.

Fait relevé, **non adopté** : le rapport largeur/hauteur de la case vaut 0,73
dans les deux captures, indépendamment du zoom — la référence compresse
verticalement sa grille. Foyer Zéro garde une grille carrée. Si ce point se
rouvre, ce sera explicitement.

**La grille de combat.** Un comparateur a été écrit et tourné sur le téléphone
d'Ethan : `tools/comparateur-grille.html`, page autonome, scène 9 × 10 à la
taille réelle, `imageSmoothingEnabled = false`, case calée sur un nombre entier
de pixels **physiques**. Trois traitements du **même sujet**, à emprise
normalisée, en ordre tiré au hasard à chaque ouverture :

1. grille 32, 10 couleurs — le `def_j_creneau` validé ;
2. vrais 128 px ramenés sur les 10 mêmes couleurs — isole la grille, sans la
   palette ;
3. vrais 128 px sans contrainte — 4 497 couleurs.

Chiffres affichés par la page elle-même sur l'appareil : case **45,7 px CSS**,
DPR 3, **137 px physiques**, agrandissement **1,07×** pour un fichier de 128.

**Verdict d'Ethan, sur pièce : le 32 fait plus pixel art au combat.** C'est la
seule raison retenue, et elle suffit. Les arguments techniques que j'avais
avancés le matin s'étaient largement effondrés en route : à 1,07× on est
quasiment au 1:1, donc un vrai 128 y serait presque pixel-parfait. Il ne restait
de mon côté que le tremblement d'un détail d'un pixel sur un sprite en position
non entière — 12 % d'un pixel logique en grille 32 contre 47 % en vrai 128 — et
la mesurabilité des contrôles du conditionneur, qui sont tous exprimés en pixels
logiques.

---

## 3. La topologie du terrain, dite une fois pour toutes

C'est le point qui a coûté le plus cher aujourd'hui. Il y a **trois surfaces**
et elles n'ont rien en commun.

| | Carte monde | Base du joueur / champ de bataille |
|---|---|---|
| Source | `GEOGRAPHIE.carte` de `data/sites.js` | `GRILLE` de `data/combat.js` |
| Dimensions | 30 × 300 = **9 000 cases** | 9 × 18 = **162 cases** |
| Rendu | 47 à 100 px CSS | **40 à 46 px CSS, toujours** |
| Contenu | fond continu procédural + **un emblème par case occupée** | sol quasi uni + éléments posés |
| Sprites | les 13 du lot 6, et rien d'autre | les 18 du lot 1 |

La base du joueur et le champ de bataille sont **la même grille** : `base.js`
importe `GRILLE` et n'en garde que des références, pas des copies. Trois bandes,
numérotées de 1 en bas — côté attaquant — à 18 en haut :

| Bande | Rangées | Ce qui s'y pose |
|---|---|---|
| Déploiement | **1–2** | rien. Sol nu. Les vagues y apparaissent. |
| Défense | **3–10** | les **10 obstacles**, dispersés : fourré sec, nappe de pétrole, chaos rocheux |
| Bâtiments | **11–18** | les **12 champs**, en blocs de 1 à 3 cases : quartz et scorie |

Donc, pour répondre à la question telle qu'elle a été posée : **oui — les champs
de quartz et de scorie sont du côté de la base, dans la bande des bâtiments, et
les obstacles (dont la nappe de pétrole) sont dans la bande de défense.** Les
champs se tiennent en outre à une case du pourtour (`CHAMPS.margeBord = 1`),
donc entre les rangées 12 et 17.

Deux règles de `base.js` qui portent directement sur les sprites, et qu'il ne
faut pas découvrir au moment de générer :

- **Deux blocs de MÊME ressource ne se touchent jamais par un côté**
  (`contactLateralEntreBlocsDeMemeRessource: false`). Le raccord bord à bord du
  prompt des champs ne sert donc qu'à souder **les cases d'un même bloc**, jamais
  deux blocs voisins. Le contact en diagonale reste permis.
- **Deux ressources différentes peuvent se toucher librement.** Un quartz contre
  une scorie doit rester lisible comme deux matières : c'est un contrôle à faire,
  et il n'est écrit nulle part ailleurs.

---

## 4. Le 128 conservé — ce que ça veut dire exactement

L'instruction est : garder le rendu 128 dans le jeu, pour qu'une icône affichée
en plus gros soit belle, et donc disposer pour chaque sprite d'une version 32 et
d'une version 128.

**Elle ne peut pas s'appliquer telle quelle, et il vaut mieux le dire ici que le
découvrir en S2.** Un jet produit sous le contrat actuel est dessiné *sur* la
grille de 32 gros pixels : son fichier fait déjà 128 × 128, mais il ne contient
que 32 valeurs par côté. En tirer une version « détaillée » est impossible — le
détail n'a jamais existé. Un vrai 128 suppose un **jet différent**, produit sans
la clause de grille.

Trois formes possibles, du moins cher au plus cher :

1. **Archiver le jet source 1024 de chaque sprite** dans `art/sources/`. Coût :
   zéro génération. Ce que ça donne : la possibilité de réafficher n'importe quel
   sprite à n'importe quelle taille sans le régénérer — mais en gros pixels,
   puisque le jet est blocky par construction. **À faire dans tous les cas**, et
   c'est déjà un point ouvert de la passation précédente (§5.3.1 : les 1024 des
   trois références Ouvrage manquent au dépôt).
2. **Donner au lot 7 son propre contrat, sans grille.** Les 41 icônes d'interface
   sont déjà hors du contrat commun — « pas de vue de dessus, ce sont des
   pictogrammes ». Elles ne côtoient jamais un sprite de combat, donc la règle
   « même écran, même taille de pixel apparente » ne s'y oppose pas. Coût : zéro
   génération supplémentaire, puisque ces 41 fichiers étaient à produire de toute
   façon. **C'est là que vit la belle icône.**
3. **Un second jet, sans grille, pour un sprite de combat donné**, le jour où il
   doit paraître en grand — portrait, écran de détail, fiche d'unité. Coût : une
   génération par sprite concerné. À faire **à la demande, un par un**, jamais en
   doublant les 141.

Nommage proposé si la forme 3 sert un jour : `def_j_creneau.png` pour le sprite
de jeu, `def_j_creneau_hd.png` pour sa version détaillée. À confirmer au premier
usage réel, pas maintenant.

**Ce qui reste interdit, et qui est le vrai contenu de l'arbitrage :** mélanger
deux finesses **dans le même écran**. Le combat mêle sol, champs, obstacles,
unités, défenses et bâtiments ; ou tout y est en grille 32, ou rien. La carte et
l'interface sont des écrans séparés, et c'est ce qui les rend libres.

---

## 5. Ce que j'ai affirmé de faux aujourd'hui

Quatre fois, et toujours par le même mécanisme : j'ai raisonné à partir d'une
phrase de documentation au lieu de mesurer.

1. **« Les tuiles de terrain servent le combat et la vue de base. »** Écrit dans
   la v4 de l'inventaire, livré, et commité. Faux : le champ de bataille a deux
   états de terrain, pas sept.
2. **« Les 8 masques de transition survivent, ils servent les blocs de champs. »**
   Faux pour la même raison : les champs sont des sprites posés sur un sol uni,
   il n'y a rien à raccorder.
3. **« Emprise 20 × 20 gros pixels pour les éléments posés. »** Inventé alors que
   `PROMPTS-sol-de-base.md` avait déjà tranché mieux : la matière touche le
   milieu des quatre bords, les angles restent vides.
4. **Les arguments techniques contre le vrai 128**, présentés le matin comme
   solides, se sont révélés faibles une fois la taille de rendu mesurée. Le bon
   argument était esthétique, et c'est Ethan qui l'a tranché sur pièce.

La règle qui en sort, et qui est la même que celle du §3.5 de la passation
précédente : **une phrase de documentation qui couple deux systèmes est une
hypothèse.** Elle se vérifie contre `src/data/` avant de servir de prémisse.

---

## 6. Réserve notée : le sol

Le terrain vu dans le comparateur **n'est pas `tile_sol_j`** : c'est un grain
provisoire de vingt lignes écrit dans la page, parce que les quatre tuiles
validées ne sont pas au dépôt. Le jugement « le terrain est moche » porte donc
sur mon grain, pas sur la planche 56570, qui reste validée et intacte.

Réserve d'Ethan enregistrée telle quelle : **on peut faire mieux que le sol
actuel.** Ce n'est pas l'objet de cette session, et ça ne bloque rien — mais si
le sol se reprend un jour, il se reprend comme un lot à part, avec le même test
qui l'a validé : 9 × 18 cases posées au hasard avec rotation, et la chasse à la
couture.

---

## 7. État des documents

| Document | État |
|---|---|
| `INVENTAIRE-SPRITES.md` | **v5 livrée** — lot 1 refondu en sol de base et éléments posés (18), lot 2 absorbé, masques supprimés, A8 ajouté, total **141**. La v4 commitée dans la journée contient un §2 faux : la v5 l'écrase. |
| `PLAN-PRODUCTION-SPRITES.md` | **non touché ce soir.** Sa S1 est cochée close sur le mauvais lot. À rouvrir ou à remplacer par une S1 bis — décision d'Ethan, pas encore prise. |
| `PROMPTS-sol-de-base.md` | valable, 5 planches, rien à corriger. |
| `RAPPORT-S1-terrain.md` | décrit le mauvais lot, à réécrire ou à marquer périmé. |
| `tools/comparateur-grille.html` | nouveau, autonome, à commiter dans `tools/`. |

**À reporter dans les documents, et pas encore fait :**

1. Le §7 de l'inventaire (les 41 icônes) doit recevoir le contrat **sans grille**
   décidé au §4 ci-dessus, avec la raison : écran séparé, aucun voisinage avec
   un sprite de combat.
2. Un amendement **A9** sur l'archivage des jets 1024 dans `art/sources/`, qui
   devient obligatoire pour tout sprite validé.
3. La topologie du §3 mérite d'être dans `FICHE-STYLE.md`, pas seulement dans une
   passation : c'est elle qu'on a perdue deux fois.

---

## 8. Ce qui reste ouvert

1. **Grille des 13 emblèmes de carte** — dette 3 bis de l'inventaire. À 47–100 px
   CSS, la grille 32 donne des pixels logiques de 4,4 à 9,4 px. Tranché sur pièce
   au premier jet de S10, en générant P10.1 dans les deux grilles.
2. **Le fond procédural de la carte** n'a ni spécification ni test. Zéro sprite,
   mais un lot de code : trois teintes, une graine, une fonction de bruit, et la
   question de savoir si les frontières et le hors-couloir se dessinent dans la
   même passe.
3. **S1 bis** — le lot 1 refondu reste à produire : sol de l'Ouvrage, 4 champs,
   6 obstacles. Le sol du joueur est fait.
4. **Les 1024 sources** des références Ouvrage, toujours absentes du dépôt.
5. **Trois défauts du conditionneur**, par brief Claude Code.
6. **La reprise du sol**, si Ethan décide qu'elle vaut un lot (§6).

---

*Session close. Trois arbitrages figés — carte monde, grille de combat,
statut du 128 — et une topologie écrite noir sur blanc pour qu'on cesse de la
redécouvrir.*
