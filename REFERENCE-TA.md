# Référence — observations sur *Tiberium Alliances*

Notes de la tâche **1.1**. Ce document sert à **une seule chose** : séparer ce qui a été
observé de ce qui a été supposé, pour qu'on ne croie pas dans six semaines qu'un chiffre
inventé était vérifié.

**Chaque ligne porte sa provenance.** Trois niveaux, jamais mélangés :

| Marque | Sens |
|---|---|
| **[OBS]** | Lu directement à l'écran ou dans la console. Fiable |
| **[CALC]** | Déduit par arithmétique à partir de [OBS]. Le calcul est écrit, donc vérifiable |
| **[SUPP]** | Hypothèse. **Non vérifié.** Ne jamais traiter comme un acquis |

Ce qui manque est écrit comme manquant, en §7. Un blanc n'est pas un oubli.

Relevé le 20/08/2026. Compte niveau 54, monde 284, client navigateur.

---

## 1. Système de ciblage — l'acquis principal

**[OBS]** Les 13 unités d'attaque portent chacune **une étiquette de cible unique**, lisible
dans sa description. Trois cibles seulement :

| Cible | Unités |
|---|---|
| **Infanterie** | Escadron de tireurs, Orca, Gardien (portée limitée), Équipe de snipers |
| **Véhicules** | Paladin, Predator, Exosoldats, Mammouth |
| **Structures** | Pitbull, Juggernaut, Commando, Escadron lance-missiles, Firehawk |

**[OBS]** `ClientLib.Data.EUnitGroup` expose trois groupes : `Infantry`, `Vehicle`, `Aircraft`.

**[CALC]** Le système est donc **3 groupes attaquants × 3 types de cible**, et non une
matrice arme × armure à six entrées comme le plan le supposait. C'est structurellement plus
simple : chaque unité a une spécialisation, pas un profil de dégâts par type d'armure.

**[OBS]** Les modules confirment le découpage par la bande — ils ne connaissent que ces
trois mêmes cibles :

| Module | Effet |
|---|---|
| Viseur laser | ↑ dégâts à l'**infanterie** |
| HEAT-MP-T | ↑ dégâts aux **véhicules** |
| Bombe étourdissante | désactive temporairement une **infanterie** |
| IEM | désactive temporairement un **véhicule** |
| Grenade fumigène | désactive les attaques d'une **structure** |
| Déluge de missiles, Barrage | dégâts étendus autour de la cible principale |
| Nanotechnologie | ↓ temps de réparation après combat |
| Charge (×2) | ↑ vitesse quand l'unité subit des dommages |
| Transporteur (×2) | transporte un escadron d'infanterie vers la base ennemie |

**[SUPP]** Aviation est probablement un **groupe attaquant** sans être un **type de cible** :
aucune unité observée n'est décrite comme anti-aérienne. À confirmer sur l'onglet Défense.

---

## 2. Réparation — règle vérifiée

**[OBS]** Détail par réservoir après un raid :

| Réservoir | Temps | Ressources |
|---|---|---|
| Infanterie | 9:11:42 | 1 022 017 895 |
| Véhicule | 16:11:46 | 1 127 835 228 |
| Aviation | 1:34:52 | 83 067 137 |

**[OBS]** Totaux affichés par le jeu : **16:11:46** et **2,232 G**.

**[CALC]** Somme des ressources = 2 232 920 260 → correspond au total affiché.
Le temps total = **max** des trois (16:11:46 = celui du réservoir Véhicule), **pas** la somme.

> **Règle : les réservoirs réparent en parallèle. Le coût s'additionne, le temps est celui
> du réservoir le plus touché.**

C'est ce qui fait de la séparation en réservoirs un levier tactique réel : concentrer les
pertes sur un seul réservoir coûte le même prix mais immobilise plus longtemps ; les répartir
coûte pareil et libère plus vite.

**[OBS]** Réparation d'une **base** (bâtiments) : coût total 2 307 993 668 ressources et
12j 19:41:36. Barème distinct de celui des unités.

**[SUPP]** L'hypothèse `réparation × 0,7^n` de la synthèse **n'est ni confirmée ni infirmée** —
rien d'observé ne s'en approche. À traiter comme non vérifiée.

---

## 3. Économie de la boucle d'attaque — un chiffre qui interroge

**[OBS]** Sur un raid gagné (« Victoire », base Camp niv. 55, défenseur *Les Oubliés*) :

- Butin : 544,8M + 616,9M + 591,2M + 95,88M de crédits
- Coût de réparation : **2,232 G**
- Déploiement 33 %, pertes −67 % côté attaquant ; état défensif adverse 85 %, dommages −34 %

**[CALC]** Si les trois premières ressources sont comparables entre elles, le butin cumulé
(~1,75 G hors crédits) est **inférieur au coût de réparation**. Ce raid a coûté plus qu'il
n'a rapporté.

**[SUPP]** Trois lectures possibles, non départagées :
1. L'attaque était mal engagée (33 % de déploiement, 67 % de pertes le suggèrent)
2. Les ressources ne sont pas fongibles et la comparaison n'a pas de sens
3. Le jeu tolère structurellement des raids à perte sèche

⚠ **Décision de design à prendre consciemment** pour notre jeu, et elle touche 0.2 : si un
raid peut coûter plus qu'il ne rapporte, le plafond du butin de défense change de sens.

---

## 4. Progression chiffrée — un seul point de mesure

**[OBS]** Centrale niveau 36 : 3 519 893 énergie/h. Niveau 37 annoncé : 3 752 121 énergie/h.

**[CALC]** Ratio **1,066** par niveau (+6,6 %).

**[SUPP]** Que ce ratio soit constant sur toute la courbe, ou identique pour les autres
bâtiments. **Un seul point de mesure ne définit pas une courbe** — il en faut au moins trois
sur le même bâtiment pour distinguer une géométrique d'autre chose.

**[OBS]** Optimisation de la Centrale : coût 128,9M + 12,4M, « possible uniquement à 100 %
de points » (mécanisme non élucidé).

---

## 5. Terrains

**[OBS]** `ClientLib.Data.ECityTerrainType` contient au moins `WATER`, `SWAMP`, `FOREST`,
`BRIAR`. Cohérent avec les 7 terrains du modèle de données déjà relevé.

**[OBS]** Visible à l'écran : zones d'eau, souches et racines mortes, buissons, cratères
sombres, champs de cristal vert et de cristal bleu.

**[CALC]** Les deux couleurs de cristal confirment **deux ressources extraites distinctes** —
ce qui valide la décision de 0.1 (quartz / scorie) plutôt qu'une ressource unique.

---

## 6. Structure de l'interface

**[OBS]** Recherche : trois onglets — **Attaque**, **Défense**, **Spécial**. L'onglet Attaque
présente deux rangées de trois cartes par page, avec pagination latérale. Rangée du haut =
unités, rangée du bas = modules, reliées par des chevrons (le module dérive de l'unité).

**[OBS]** Monnaies de recherche : **points de recherche** et **crédits**, distincts.

**[OBS]** Combat : **4 vagues d'attaque**, décalées de **+10 s** l'une par rapport à la
précédente. Chaque vague est une rangée de cases où l'on place ses unités.

**[OBS]** Portée affichée en jeu par un cercle vert autour de l'unité sélectionnée, avec des
marqueurs numériques (« 2.5 ») sur le pourtour. **[SUPP]** Ce serait un rayon en cases —
non confirmé, l'échelle écran → cases n'est pas établie.

**[OBS]** Durée d'un combat observée : de l'ordre de **2 minutes** (compteurs 01:43 → 01:55).

**[OBS]** Bouton « Réparer tout » avec coût total en infobulle avant confirmation.

---

## 7. Ce qui manque — à inventer et calibrer

**Aucune statistique chiffrée d'unité n'a été obtenue.** Ni PV, ni dégâts, ni portée en
cases, ni vitesse, ni coût de production, ni temps de recrutement.

Manquent également :

- **Coefficients de ciblage** — de combien un anti-véhicule frappe plus fort un véhicule
  qu'une infanterie. Le rapport structurel est connu, l'amplitude non
- **Arbre de recherche complet** — structure, coûts, prérequis, nombre de nœuds. Seules
  deux rangées de six cartes ont été vues, sur trois onglets paginés
- **Les 14 bâtiments** — noms visibles dans la barre du bas (Collecteur, Centrale, Raffinerie,
  Silo, Accumulateur, Centre de commandement, Usine, Caserne, Aérodrome, QG de défense,
  Complexe, Frappe aérienne, Canon à ions, Falcon), aucune donnée chiffrée
- **Courbes de progression** — un seul point de mesure, sur un seul bâtiment
- **Formule de butin** — comment le montant pillé se calcule
- **Génération des défenses ennemies** — le risque principal identifié par la synthèse,
  toujours entier

**Ces valeurs seront inventées puis calibrées par le batch de simulation.** C'était le plan B
prévu, et c'est la raison qui a fait pencher 0.3 vers la toolchain : un cœur déterministe
testable en Node permet de faire tourner 10 000 combats pour régler ce que le dump ne donne
pas.

⚠ **Ne pas recopier les valeurs de TA même si on finit par les obtenir.** Elles sont calibrées
pour un MMO compétitif avec monétisation, sessions courtes et pression sociale. Notre jeu est
solo, idle, sans paiement. C'est la **structure** qui se transpose, pas les nombres.

---

## 8. Méthode — ce qui a marché et ce qui n'a pas marché

**N'a pas marché :**

- Les simulateurs communautaires (TABS V2, TACS, ta-combat-sim-pro) sont **« 100 % API »** :
  ils délèguent le calcul au serveur EA et **ne contiennent aucune table de balance**.
  Code de `ta-combat-sim-pro` inspecté pour vérification — il appelle `ClientLib.Data.Combat`
- Le client est **fortement obfusqué**. `ClientLib.Data.MainData.GetInstance()` retourne
  `$I.HXKMHE {HTNCES: …, BQWLSA: …, JELZET: …}`. `Base.Unit` mélange des noms lisibles
  (`GetUpgradeModulTypeByMdbUnitId`, `CanBeTransported`) et des symboles minifiés
  (`TJTZRH`, `PGIJMQ`)
- Les énumérations (`EArmorType`, `EUnitType`…) existent comme noms mais rendent `{}` à
  `Object.keys` — constantes attachées autrement, pattern Qooxdoo

**A marché :**

- **Lire l'interface du jeu.** Un jeu dont les dégâts dépendent du type de cible doit le dire
  au joueur, sinon personne ne peut jouer. Les descriptions d'unités ont donné les axes
  du système en une demi-heure, là où la console a échoué en deux
- **Vérifier l'arithmétique des totaux affichés.** La règle de réparation en parallèle sort
  d'une addition et d'un maximum, pas d'un dump

> **Leçon à retenir : l'interface est une source de données, et souvent la meilleure.
> Ce que le joueur doit comprendre est nécessairement exposé.**
