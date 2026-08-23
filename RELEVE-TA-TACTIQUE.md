# Relevé tactique — *Tiberium Alliances*

Règles de résolution du combat, dictées par Ethan le 22/08/2026 depuis sa pratique du jeu.
Compagnon de `RELEVE-TA-ARSENAL.md`, qui couvre le catalogue.

**Statut : relevé, pas conception.** Rien n'est transposé dans Foyer Zéro à ce stade.

Trois niveaux de confiance sont marqués dans tout le document :

- **[C]** constaté en jeu, tenu pour acquis
- **[?]** incertain, à vérifier sur un dump ou une session
- **[X]** absent de la source, **à inventer et calibrer**

---

## 1. Le terrain

La grille est commune aux deux camps. L'attaquant part du bas et progresse vers le haut ; le
défenseur occupe le haut. Trois bandes : **base** (bâtiments de production) au fond, **ligne
défensive** au milieu, **zone de départ offensive** en bas.

Le passage de la ligne défensive vers la base est un **événement**, pas une simple position :
il change le régime de la réserve de munitions (§4).

---

## 2. Déplacement et ciblage

### Règle de marche **[C]**

Une unité offensive **va tout droit**. Elle ne s'arrête que dans deux cas :

1. une **cible de prédilection** entre à portée ;
2. elle est **bloquée**.

Elle ne dévie jamais. Il n'y a pas de recherche de chemin.

Une unité défensive ne se déplace **que latéralement**, de gauche à droite et inversement, et
**uniquement** quand une cible de sa prédilection se présente. Elle peut être arrêtée par le
décor, mais **ne l'attaque jamais** — c'est la différence nette avec l'attaquant.

### Ordre de ciblage **[C]**

**Une seule règle pour les deux camps : la cible valide la plus proche de moi ; à égalité, la
plus à gauche.**

Concrètement, l'attaquant trie du bas vers le haut puis de gauche à droite, le défenseur du
haut vers le bas puis de gauche à droite. L'inversion n'est qu'apparente : chaque camp trie par
distance croissante depuis sa propre ligne de départ.

Deux unités ne pouvant occuper la même case, le couple (ligne, colonne) constitue un **ordre
total et stable**. Aucun départage par identifiant n'est nécessaire — le ciblage est
déterministe par construction, sans recours au PRNG.

### Cible hors prédilection **[C]**

Une unité **tire quand même** sur une cible qui n'est pas de sa prédilection, si celle-ci est à
portée. Elle est simplement moins efficace. Ce qui distingue la prédilection, ce n'est donc pas
le droit de tirer, c'est **le droit d'arrêter la marche** : on ne s'immobilise que pour sa
cible de prédilection.

C'est le point le plus important de tout le modèle. La composition ne dose pas de la puissance,
elle répartit des **unités qui s'arrêtent** et des **unités qui passent**.

---

## 3. Structures et blocage

Trois objets distincts, souvent confondus :

| Objet | Comportement | Cible de prédilection de |
|---|---|---|
| **Mur** | **bloque**. L'attaquant l'attaque jusqu'à destruction de l'un ou de l'autre | anti-structure |
| **Tourelle** | tire, et bloque physiquement | anti-structure |
| **Barrière** (antichar, barbelé) | **ne bloque pas** : on la traverse en perdant des PV | anti-structure |

**Correction actée.** J'avais supposé que l'anti-structure n'avait aucune cible de prédilection
dans la ligne défensive et la traversait donc sans s'arrêter. C'est faux : murs, tourelles et
barrières sont des structures. L'anti-structure s'arrête dessus comme les autres. La pénétration
propre ne vient pas d'unités qui ignorent la défense, elle vient de **l'ordre des vagues et de
la vitesse**.

**Conséquence pour Foyer Zéro :** notre Herse est décrite à la fois comme obstacle et comme
blessant au franchissement. Ce sont deux objets différents. Il faut choisir.

---

## 4. La réserve de munitions

Mécanique centrale, et la moins visible du jeu.

### Forme **[C]**

Chaque unité offensive part avec une **réserve prédéterminée**, unique, consommée par tous ses
tirs. Elle ne se recharge jamais.

| Contre quoi elle tire | Effet sur la réserve |
|---|---|
| Unité défensive, mur, tourelle, barrière | consommée, mais **plancher à 10 %** — elle ne descend jamais en dessous |
| **Bâtiment de production de la base** | le plancher de 10 % est **entamé** et descend jusqu'à zéro |

Le plancher protège donc uniquement le combat contre la défense. Une unité qui a beaucoup
combattu en chemin franchit la ligne avec **exactement 10 %** et ne fait presque rien sur la
base. Une unité qui a traversé vite arrive avec l'essentiel de sa réserve.

**Le rendement d'un raid est décidé avant que le premier bâtiment ne soit touché.**

### Épuisement **[C]**

Une unité dont la réserve tombe à zéro **disparaît du champ de bataille**. Elle n'est **pas
détruite** : elle est récupérée et reste disponible pour l'attaque suivante, comme toute unité
survivante. Sortir vide n'est pas une perte de matériel, c'est une perte de tour.

### Unité de mesure **[?]**

Nombre de tirs, ou points de dégâts cumulés ? Non déterminable depuis l'extérieur, et
probablement jamais déterminable. Le relevé d'arsenal apporte un indice faible en faveur du
**compteur de tirs** : le Thumper Forgotten est décrit comme ayant *le double de munitions* du
Mammoth Forgotten — formulation qui compte des coups, pas des dégâts.

### Nature du plancher **[?]**

Plancher absolu à 10 % de la réserve initiale, ou réserve qui se vide réellement mais bute à
10 % ? Les deux donnent le même résultat à l'arrivée. **Une unité offensive ne recule jamais**
et la ligne ne bouge pas, donc les deux lectures sont indiscernables en jeu. Sans conséquence
pratique, mais à fixer explicitement dans notre implémentation pour que le rattrapage
analytique et la simulation ne divergent pas.

---

## 5. Collisions

### Entre alliés **[C]**

Pas de traversée. Les unités d'un même camp ne se superposent jamais.

### Entre camps opposés **[C]**

Le **seuil de masse** décide, et il décide seul. Il n'y a pas de règle de blocage séparée :

| Rencontre | Résultat |
|---|---|
| Infanterie ↔ infanterie | **blocage mutuel.** Les deux veulent avancer, aucune ne passe |
| Véhicule → infanterie | **écrasement.** Le véhicule continue, l'infanterie meurt |
| Véhicule ↔ véhicule | **blocage mutuel** |

L'écrasement est **indépendant de la prédilection** : un char antichar qui n'a aucune raison de
tirer sur de l'infanterie l'écrase quand même en passant, parce qu'il avance vers autre chose.

**Conséquence de conception :** l'infanterie antichar défensive est intéressante précisément
parce qu'elle **ne bloque pas**. Elle se place devant le char, tire, et meurt écrasée sans rien
retarder. Un bloqueur et un tireur sont deux rôles différents, et le seuil de masse les sépare
sans règle explicite.

### Barème d'écrasement **[X]**

L'efficacité dépend du châssis : un char de base écrase facilement, un Mammoth très facilement,
un blindé léger nettement moins. **Les chiffres n'existent nulle part et devront être
inventés.**

C'est **le seul point du modèle tactique qui pourrait toucher au PRNG.** Deux formes possibles :

- **seuil déterministe** — au-delà d'une masse donnée, l'écrasement est systématique ;
- **probabilité par masse** — tirée du PRNG injecté.

La première préserve la rejouabilité sans effort. À trancher au moment du prototype.

---

## 6. L'aviation

**Deux comportements distincts, et c'est la découverte la plus structurante de la dictée.**

| Classe | Comportement | Exemples TA |
|---|---|---|
| **Stoppeurs** | se comportent comme des chars volants : voient une cible de prédilection, **s'arrêtent et tirent** | Paladin, Kodiak |
| **Traversants** | **traversent la carte quoi qu'il arrive**, sans jamais s'arrêter | Firehawk, Orca |

Communs aux deux : l'aviation **survole** la défense, ce qui permet d'engager sur deux vagues
simultanées. Un appareil peut être abattu en chemin. **S'il survit et atteint le fond, il rentre
et ne revient pas** dans le combat en cours — mais il n'est pas perdu, il est simplement sorti.
Il reste à réparer comme les autres.

**La vitesse est le vrai paramètre du traversant.** Le Firehawk est rapide, donc peu exposé en
traversée, donc excellent bombardier et finisseur de base. Un traversant lent serait une cible.

**Conséquence directe sur notre roster :** nos deux aéronefs — Crécelle et Frappeur — sont tous
les deux des traversants. La case laissée vide *Aéronef × anti-véhicule* correspond exactement
au Paladin. En la fermant, on ne renonce pas à une unité : **on renonce à toute une classe de
comportement.** À rouvrir.

---

## 7. Ce qui reste à trancher

| # | Point | Niveau |
|---|---|---|
| 1 | Réserve : tirs ou dégâts cumulés | **[?]** indice faible en faveur des tirs |
| 2 | Plancher absolu ou plancher butoir | **[?]** indiscernable en jeu, à fixer par convention |
| 3 | Barème d'écrasement par châssis | **[X]** à inventer |
| 4 | Écrasement déterministe ou probabiliste | **[X]** à trancher — seul point touchant au PRNG |
| 5 | Valeur de la réserve initiale par unité | **[X]** à inventer |
| 6 | Perte de PV à la traversée d'une barrière | **[X]** à inventer |
| 7 | Herse : obstacle bloquant **ou** barrière traversable | décision Foyer Zéro |
| 8 | Rouvrir la case *Aéronef × anti-véhicule* | décision Foyer Zéro |

---

## 8. Ce que ces règles donnent gratuitement

Quatre propriétés qu'on cherchait, et qui tombent des règles sans mécanique dédiée :

1. **Le raid propre est gratuit** — la réserve à plancher convertit la qualité de la
   pénétration en dégâts sur la base, directement.
2. **Le ciblage est déterministe** — l'ordre (ligne, colonne) est total et stable, aucun appel
   au PRNG. Le test 7 du modèle économique en est facilité.
3. **Bloquer et tuer sont deux rôles séparés** — le seuil de masse suffit à les distinguer.
4. **La composition est une décision de rythme**, pas de puissance : qui s'arrête, qui passe,
   qui arrive avec des munitions.

---

*Dicté par Ethan, mis en forme sans arbitrage. Les points marqués **[X]** appellent des valeurs
que la source ne contient pas et que le batch devra calibrer.*
