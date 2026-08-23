# Foyer Zéro — compte rendu de la phase de relevé

22–24 août 2026. Quatre sessions, de la première discussion à la clôture du dossier de
conception. **Aucune ligne de code n'a été écrite** — c'était le but.

---

## Ce qu'on cherchait

Le projet avait un roster, un modèle économique et un modèle de combat, mais tous trois reposaient
sur du theorycraft. Trois trous étaient ouverts depuis le début :

1. la **courbe de butin** par anneau ;
2. la **courbe de pression ennemie** ;
3. le **générateur de défenses**, identifié comme le risque principal.

L'idée directrice a été posée dès la deuxième session : **faire du 1:1 avec Tiberium Alliances**
plutôt que d'inventer, puis dévier en connaissance de cause. Tout ce qui suit découle de là.

---

## Comment on a procédé

Trois sources, dans cet ordre :

- **six pages d'arsenal** de CNCNZ.com, relevées au web — catalogue complet des unités, défenses
  et bâtiments, GDI et Oubliés ;
- **la mémoire d'Ethan**, dictée à l'oral — les règles tactiques, que la documentation ne donne
  nulle part ;
- **trente-cinq captures d'écran en jeu** — les chiffres, qui n'existent dans aucune source
  écrite : butin par bâtiment, densité des sites, composition des garnisons, arbre de recherche.

Chaque relevé a été confronté aux précédents. Sept erreurs ont été détectées par recoupement, dont
cinq de ma part.

---

## Ce qui a été découvert

### La courbe de butin est exacte à quatre chiffres

Le camp 54 et le camp 65, onze niveaux d'écart, donnent **×1,320 par niveau** sur les cinq
bâtiments mesurés, sans exception. 1,32¹¹ = 21,196 ; les rapports mesurés vont de 21,19 à 21,21.

Ce n'est pas une estimation, c'est la constante. Et c'est **exactement la pente des coûts de
construction** : le rapport butin / coût de montée est donc rigoureusement constant. La
progression ne sature jamais et ne s'emballe jamais.

Deux régimes toutefois : sous le niveau 12, la pente est de **1,259** — le début de partie est
plus doux que l'asymptote ne le laisse croire.

### Le butin croît plus vite que la production

×1,32 contre ×1,20. Le rapport pillage/production monte de 10 % par niveau, soit **×6,7 sur vingt
niveaux**. Ce n'est pas un jeu de production avec du raid en appoint : c'est un jeu de raid où la
production sert d'amorçage.

### La carte est le niveau du joueur

Camps et avant-postes détruits ne se réparent jamais. Le farm local s'épuise donc, ce qui force à
avancer ; avancer suppose de raser des bases, au ROI médiocre, mais qui libèrent du territoire ;
le territoire donne accès à des anneaux supérieurs, seule source de revenu abondant.

**La conquête n'est pas une voie parallèle à l'économie : c'est le seul moyen de la renouveler.**
La position remplace une jauge d'expérience.

### Pourquoi l'endgame de TA est raté, et pourquoi Foyer Zéro n'a pas ce problème

Au centre, il n'y a plus de bases à raser, donc plus d'anneaux à ouvrir. Ne subsistent que les
camps, indexés sur le niveau du joueur — et **une cible indexée sur le joueur ne peut jamais être
une récompense** : le rapport butin/coût y reste constant à vie. Tapis roulant par construction.

TA ne pouvait pas faire autrement : jeu persistant, il n'a pas le droit de finir. Foyer Zéro, run
solo de 15 à 25 heures, a ce droit. **La récompense terminale, c'est la fin elle-même.**

### Le plancher de munitions est le convertisseur du modèle

Chaque unité offensive part avec une réserve fixe. Elle se consomme partout, mais **ne descend
jamais sous 10 % tant que l'unité est dans la zone défensive**. Le plancher se lève au passage de
ligne, et le reliquat part dans les bâtiments.

Une composition qui nettoie la défense au canon arrive à 10 % partout et n'ouvre rien. Une
composition qui traverse vite garde 60 % et rase la base. **Le rendement d'un raid est décidé
avant que le premier bâtiment ne soit touché.** La propriété « un raid propre est gratuit », posée
comme un souhait dans le modèle économique, a maintenant une cause mécanique.

### Le ciblage est déterministe sans PRNG

Une seule règle pour les deux camps : **la cible valide la plus proche ; à égalité, la plus à
gauche**. Deux unités ne pouvant occuper la même case, le couple (rangée, colonne) forme un ordre
total et stable. Aucun tirage aléatoire n'intervient dans le ciblage.

### Le seuil de masse remplace trois règles

Infanterie contre infanterie : blocage mutuel. Véhicule contre infanterie : écrasement, donc pas
de blocage. Véhicule contre véhicule : blocage. **Une seule règle, trois cas** — et l'écrasement
est indépendant de la prédilection.

Conséquence de conception : l'infanterie antichar défensive est intéressante précisément parce
qu'elle **ne bloque pas**. Elle tire, meurt écrasée, ne retarde rien. Bloquer et tuer sont deux
rôles distincts, et le seuil de masse les sépare sans règle explicite.

### La matrice se referme sur trois colonnes

En offense la troisième colonne se lit « structure », en défense « aviation ». Les deux ne se
croisent jamais : aucun aéronef ne défend, aucun défenseur ne rencontre de structure amie. **Une
seule matrice suffit pour tout le monde**, unités et défenses comprises.

### Les points de recherche donnent aux bases le ROI qui leur manquait

Ils ne se produisent pas : ils se prennent sur les défenses détruites. Camps et avant-postes ne
réparant jamais, leurs défenses ne paient qu'une fois. Une base se remet à 100 % en une heure :
**ses défenses sont une ferme renouvelable**. Le joueur arbitre entre raser pour le territoire et
conserver pour la recherche.

### Le ×2 n'est pas une anomalie

Le rendement en points de recherche double par niveau de cible, alors que tout le reste croît en
×1,32. J'ai signalé la divergence comme un défaut majeur. **Les captures de l'arbre l'ont
infirmée** : le coût de chaque échelon double lui aussi (200k → 270k → 500k → 1,5M → 5,8M). Les
deux courbes sont en phase. Il ne reste qu'à caler la cadence.

---

## Les décisions prises

| Domaine | Décision |
|---|---|
| **Châssis** | trois seulement — Escouade, Blindé, Aéronef. *Pièce* et *Masse* supprimés |
| **Anti-aérien** | n'existe qu'en défense. La contrainte Affût/Dard tombe |
| **Anti-tout** | refusé. Le Kodiak devient anti-structure |
| **Aviation** | quatre appareils, deux stoppeurs et deux traversants |
| **Barrières** | traversables, blessent au passage, tombent sous l'anti-structure |
| **Bastion** | scindé — l'un plafonne le niveau, l'autre verrouille la réparation |
| **Site ennemi** | plusieurs bâtiments de valeurs distinctes, plus un central qui rase tout |
| **Crédits** | supprimés. Deux ressources et des points de recherche |
| **Carte** | couloir 30 × 300, format téléphone, 0,2 niveau par case, plafond 50 |
| **Respawn** | jamais pour les bases, toujours pour camps et avant-postes |
| **Indexation** | camps sur le joueur, avant-postes sur le rayon. Jamais l'inverse |
| **Fin de partie** | le centre est un terminus. La récompense est de pouvoir finir |
| **Noms** | deux jeux — armée régulière pour le joueur, outils et bêtes pour l'Ouvrage |

---

## Mes erreurs, corrigées en cours de route

Elles sont consignées parce qu'elles disent où le raisonnement dérape.

1. **J'ai annoncé une pente de butin en ×1,7.** C'était ×1,32. La déduction théorique était
   fausse ; seule la mesure a tranché.
2. **J'ai cru que les anti-structure traversaient la défense sans s'arrêter.** Faux : murs,
   tourelles et barrières sont des structures. La pénétration propre vient de l'ordre des vagues
   et de la vitesse, pas d'unités qui ignorent la ligne.
3. **J'ai conclu que camps et avant-postes sortaient de la courbe de butin.** Faux : les
   avant-postes sont indexés sur la zone. C'est précisément ce qui ruine l'endgame de TA.
4. **J'ai décrit la défense ennemie comme une ligne.** C'est un champ en profondeur, avec des
   rangées successives et un terrain qui oriente.
5. **J'ai signalé le ×2 des points de recherche comme incohérent.** L'arbre double aussi.
6. **J'ai failli signaler une contradiction entre deux colonnes de modules** qui était en réalité
   un glossaire posé à côté du tableau.
7. **J'ai proposé une formule de couverture latérale** qui n'avait pas de sens, les défenseurs
   mobiles traversant librement leur rangée.

À l'inverse, quatre défauts ont été trouvés dans les documents et corrigés : le décompte 5/6/3 au
lieu de 5/5/4, deux matrices contredisant la spécialité déclarée, le Guetteur passé anti-véhicule
en défense, et la collision de nom sur « Obusier ».

---

## Ce qui reste ouvert

Huit points, aucun bloquant pour le prototype de combat.

1. La **part vacante de 0,30** dans la composition des sites, laissée par le retrait de la
   Raffinerie.
2. La **cadence de l'arbre de recherche** — combien de niveaux de progression pour un échelon.
3. Le **×2** des points de recherche, à équilibrer une fois la cadence connue.
4. Les **coûts estimés** : quatre unités déjà acquises et onze modules non affichés.
5. Le **débit de raids triple** entre le début et la fin, ce qui rallonge les sessions tardives.
6. Le **bouclier de l'Albatros**, porté par un aéronef plus rapide que ce qu'il protège.
7. Les **24 h de blocage de saut**, héritées d'un multijoueur sur trois mois.
8. Les **noms**, validés à titre provisoire.

---

## Les fichiers

| Fichier | Contenu |
|---|---|
| **SPEC-FOYER-ZERO.md** | **la spécification consolidée — fait autorité** |
| RELEVE-TA-ARSENAL.md | catalogue TA : unités, défenses, bâtiments, GDI et Oubliés |
| RELEVE-TA-TACTIQUE.md | règles de combat dictées : marche, ciblage, réserve, collisions, aviation |
| RELEVE-TA-ECONOMIE.md | butin mesuré, géographie, types de site, régulateurs |
| AUDIT-CALIBRAGE.md | relecture hostile du classeur, quatorze points |
| SESSION-RELEVE-BUTIN.md | checklist de capture en jeu (close) |
| FOYER-ZERO-CALIBRAGE.xlsx | stats d'unités, défenses, densité et composition des sites |
| FOYER-ZERO-PROPORTIONS-IA.xlsx | composition des vagues et des garnisons, par niveau |
| FOYER-ZERO-RECHERCHE.xlsx | arbre de recherche relevé et transposé |

---

## La suite

La prochaine session est du codage. Le **lot 2A**, moteur de combat déterministe, a tout ce qu'il
lui faut : grille, unités, défenses, ciblage, déplacement, réserve, écrasement, matrice,
composition des garnisons, PV des bâtiments, budgets de vague, obstacles.

Ce qui manque encore ne concerne que l'économie longue, et se pose en placeholder sans bloquer.

---

*Relevé fidèle, arbitrages d'Ethan, corrections assumées.*
