# Foyer Zéro — la base du joueur

Relevé de `FOYER-ZERO-LEXIQUE.xlsx`, poussé sur GitHub le 24/08/2026, feuille `LEXIQUE`,
section *BÂTIMENTS DU JOUEUR*. **Rien n'est urgent ici** : le développement de la base du joueur
n'est pas le chantier courant, et Ethan refera les captures de production. Ce document existe pour
que le relevé ne se reperde pas une seconde fois.

---

## 1. Ce que le lexique donne

| Bâtiment | Rôle | Production |
|---|---|---|
| **Centre de commandement** | QG offensif | points d'armée + niveau max des unités |
| **QG de défense** | QG défensif | points d'armée + niveau max des défenses |
| **Complexe de défense** | réparation | sa perte bloque la réparation |
| **Centrale** | produit l'électricité | **par pack**, plus **en continu** selon les champs de scorie à proximité |
| **Accumulateur** | stocke l'électricité | **en continu**, selon le nombre de centrales à proximité |
| **Collecteur** | produit les ressources | quartz ou scorie, **par pack** |
| **Raffinerie** | stocke les ressources | scorie ou quartz **en continu**, selon le nombre de collecteurs à proximité |

Deux contraintes d'unicité, notées dans la colonne des bâtiments de site : le joueur ne peut
construire **qu'une seule Gangue** et **qu'un seul Terril**.

## 2. Ce qui manque encore

Le **Chantier de construction** ne figure pas dans la section, alors que c'est le bâtiment central
du joueur : le seul qui échappe au plancher de 1 PV, celui dont la chute rase la base, et celui
qui commande le temps de réparation des bâtiments.

Manquent aussi la **Caserne**, le **dépôt de véhicules** et l'**aérodrome**, qui commandent le
temps de réparation des unités par châssis. Ethan confirme le 24/08 qu'ils sont bien absents du
lexique — ce n'est pas une erreur de lecture — et nomme au passage le bâtiment des blindés :
**dépôt de véhicules**.

Soit un total de **onze bâtiments** pour une base complète, contre sept nommés à ce jour.

---

## 3. La structure retrouve celle du lot 1

Le couple *pack + flux continu + voisinage* est **déjà implémenté**. `src/data/params.js` porte
`colis` (un toutes les 5 minutes, 2 en attente au maximum), `fluxContinu` (en milli-unités par
tick) et `adjacence` (bonus constant par voisin qualifiant, 2 voisins au plus, jamais indexé sur
le niveau). Le lexique ne décrit donc pas un modèle neuf : il nomme celui du lot 1 et l'étend.

L'extension consiste en deux choses :

1. le voisinage devient **typé** — un accumulateur compte ses centrales, une raffinerie compte ses
   collecteurs, une centrale compte les champs de scorie du terrain ;
2. un bâtiment **stocke et produit à la fois** : l'accumulateur et la raffinerie sont des réserves
   qui rapportent selon leur entourage. C'est ce qui donne un intérêt à la disposition.

---

## 4. L'électricité — arbitré le 24/08

**C'est une quatrième grandeur, et c'est un garde-fou.**

| Propriété | Valeur |
|---|---|
| Qui la produit | **le joueur seul**, et **uniquement sur sa base** |
| Se pille ? | **non** — elle n'existe pas chez l'Ouvrage |
| Ce qu'elle conditionne | **toutes les améliorations**, sans exception |

L'intention est explicite : le joueur ne peut pas se contenter de raser et de farmer. Quoi qu'il
fasse, il doit produire sa propre ressource pour progresser.

**Ça corrige une conclusion du compte rendu.** Il y était écrit : *« ce n'est pas un jeu de
production avec du raid en appoint : c'est un jeu de raid où la production sert d'amorçage »*.
L'électricité rend la production **obligatoire à vie** : le raid finance le quartz et la scorie,
jamais l'électricité. Les deux moitiés du jeu restent attachées du début à la fin.

Combinée au vrai plafond — **le coût des améliorations, qui se multiplie et devient très cher en
fin de partie** — elle forme le régulateur réel de la progression. Le joueur ne peut pas améliorer
gratuitement n'importe quoi, et il ne peut pas non plus acheter sa sortie en pillant plus.

Les barèmes — production par centrale, coût en électricité par amélioration, plafonds — ne sont
pas urgents. Ethan les retrouvera, ils se modifient a posteriori.

Reste à trancher, sans urgence : la **réserve de temps de réparation** de `MODELE-REPARATION-1.md`
§4 est-elle une cinquième grandeur de plein droit, ou un simple compteur interne ?

## 5. Défauts du lexique, à corriger à la source

1. **« Raffinerie » désigne encore deux choses.** La troisième — celle de TA, liée aux crédits —
   est supprimée, comme les trois bâtiments de soutien de l'onglet Spécial. Restent en collision
   le **nom joueur de la Gangue** (silo à quartz) et le **bâtiment de stockage de la base**
   (« produit des scories/quartz en continu selon le nombre de collecteurs à proximité »).
   Lequel des deux garde le nom ?
2. **Le Terril n'a pas de nom joueur** — la colonne est vide, alors que la Gangue en a un.
3. **Le Complexe de défense y répare encore 70 %.** C'est périmé depuis la dictée du même jour :
   il répare **tout**, en une heure. Voir `MODELE-REPARATION-1.md` §3.
4. **Les défenses ont maintenant un nom joueur** — Mur de défense, barbelés, barrière anti-tank,
   Tourelle Mitrailleuse, Canon anti-char, DCA, Mirador, Artillerie lourde, SAM. `src/data/combat.js`
   n'en porte qu'un seul par défense, celui de l'Ouvrage. À aligner sur la convention
   `nom.joueur` / `nom.ouvrage`, **mais pas maintenant** : le fichier est gelé le temps du lot 2A.
5. **Deux informations neuves à replier dans les données** : la Casemate est *gratuite et hors
   arbre de recherche* ; le Guetteur est *camouflé*, ce qui recoupe son module.
6. **Deux modules absents du lexique** : `+20 % PV` (module Ouvrage des murs et barrières) et
   `rayon +1` (module défensif du Guetteur). Ils sont dans `combat.js` et dans la spec §6.
7. **Divergences d'équivalent TA**, sans effet sur les chiffres : Faucheuse donnée pour
   *Watchtower* ici et pour *Reaper* dans l'audit ; Carapace pour *Zone Troopers* ici et
   *exosoldat* dans `combat.js`.
