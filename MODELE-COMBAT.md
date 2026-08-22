# Modèle de combat — *Foyer Zéro*

Pendant de `MODELE-ECONOMIQUE.md`, même discipline : ce document définit **les règles et les
paramètres**, les valeurs numériques sont des **points de départ**. Le batch de calibrage du
lot 2B les corrigera. Ce qui doit tenir, ce sont les **formes**.

Renvois : `REFERENCE-TA.md` pour ce qui est observé, `FICHE-STYLE.md` pour les conséquences
graphiques.

---

## 1. La décision structurante : aucun hasard dans le combat

**La résolution d'un combat est entièrement déterministe. Pas de jet de dés, pas de dispersion
de dégâts, pas de ciblage aléatoire.** Même composition, même défense, même placement → même
résultat, toujours.

Trois raisons, dans l'ordre d'importance :

**Le combat devient un puzzle, pas un pari.** En solo sans classement, un mauvais résultat dû
au hasard n'apprend rien au joueur et ne se rejoue pas utilement. TA le démontre à l'envers :
un raid parfait y est possible (`REFERENCE-TA.md` §8, *« No damage was dealt »*), et c'est ce
qui rend la compétence lisible.

**Le calibrage devient exact.** Faire tourner 10 000 combats n'a de sens que si chacun mesure
une composition, pas une chance. Sans hasard, le batch produit une réponse et non une
distribution à interpréter.

**Le rattrapage reste analytique.** Une défense idle qui se résout au hasard obligerait à
simuler. Sans hasard, le résultat d'un raid repoussé se calcule.

**Où vit alors le PRNG ?** Dans la **génération des défenses** de l'Ouvrage — la carte, les
compositions ennemies, les emplacements. Le hasard décide de ce qu'on affronte, jamais de
l'issue de l'affrontement.

⚠ Conséquence à assumer : deux joueurs de même niveau face à la même base obtiennent
exactement le même résultat. C'est voulu.

---

## 2. Géométrie

| Élément | Valeur de départ | Note |
|---|---|---|
| Grille | **9 colonnes × 16 rangées** | Format portrait mobile. TA utilise 9×20 en paysage |
| Vagues | **4** | Repris de TA (§9) |
| Décalage entre vagues | **5 s** | TA utilise 10 s. Réduit : nos combats doivent être plus courts |
| Durée cible d'un combat | **45 à 60 s** | TA tourne autour de 2 min. Avec 3 à 5 attaques par session, 2 min par combat coûte 10 minutes de session — trop pour de l'idle mobile |
| Résolution | **10 Hz** | 450 à 600 ticks par combat |

Les unités du joueur entrent par le bas, vague après vague, et progressent vers le haut. Les
structures de l'Ouvrage sont fixes.

---

## 3. Les quatre types, et l'asymétrie

Quatre types, comme dans TA (`REFERENCE-TA.md` §1) : **infanterie · véhicule · structure ·
aviation**. Chaque unité vise **un seul** type de prédilection.

### Les formes de l'Ouvrage

| Forme | Type | Rôle | Étalon v4 |
|---|---|---|---|
| **Pylône** | structure | tourelle fixe | ✅ existe |
| **Marcheur** | véhicule | lourd, lent, à pattes | ✅ existe |
| **Essaim** | infanterie | léger, nombreux, terrestre | ✅ existe |
| **(à concevoir)** | aviation | forme volante | ❌ **manquante** |

⚠ **Dette DA à ouvrir.** L'étalon v4 ne comporte aucune forme volante de l'Ouvrage, alors que
la planche joueur contient déjà `arme_aa.png`. Sans elle, l'anti-aérien du joueur n'a pas de
cible et un quart du système de ciblage est mort. À inscrire dans `FICHE-STYLE.md`.

### Asymétrie assumée

Le joueur aligne infanterie, véhicules, aviation — et des structures **en défense seulement**.
L'Ouvrage aligne structures, véhicules, infanterie-équivalent, aviation. Les deux camps ont donc
les quatre types, mais pas dans les mêmes rôles.

---

## 4. Matrice de ciblage

Ligne = spécialité de l'attaquant. Colonne = type de la cible. Multiplicateur appliqué aux
dégâts de base.

| Spécialité ↓ / Cible → | Infanterie | Véhicule | Structure | Aviation |
|---|---|---|---|---|
| **Anti-infanterie** | **1,00** | 0,30 | 0,15 | 0 |
| **Anti-véhicule** | 0,35 | **1,00** | 0,40 | 0 |
| **Anti-structure** | 0,15 | 0,35 | **1,00** | 0 |
| **Anti-aérien** | 0 | 0 | 0 | **1,00** |

**Ce que la matrice encode :**

L'**anti-structure est mauvais contre le vivant** (0,15 / 0,35) : c'est un marteau, il ouvre la
base mais se fait tailler en pièces s'il est seul. Il force une composition mixte.

L'**anti-véhicule est le plus polyvalent** (0,35 / 0,40 hors spécialité) : c'est le choix par
défaut du joueur qui ne sait pas ce qu'il affronte, et donc jamais le meilleur.

L'**anti-aérien est un pari total** (0 partout ailleurs). Emporté sans aviation adverse, c'est
un emplacement perdu. C'est la décision de reconnaissance du jeu : regarder la base avant de
composer.

**Aucune ligne n'atteint 1,00 hors sa spécialité.** Il n'existe pas d'unité passe-partout, et
c'est ce qui rend la composition intéressante.

---

## 5. Statistiques de base

Valeurs au **niveau 1**, à multiplier par la courbe de production de `MODELE-ECONOMIQUE.md`
(`ratio_P`) — les unités montent sur la même courbe que le reste, une seule loi de progression
dans tout le jeu.

| Type | PV | Dégâts par tir | Cadence | Portée | Portée mini | Vitesse |
|---|---|---|---|---|---|---|
| Infanterie | 100 | 12 | 0,5 s | 3 | — | 1,2 case/s |
| Véhicule | 250 | 25 | 1,0 s | 4 | — | 0,9 case/s |
| Aviation | 150 | 20 | 0,7 s | 3 | — | 1,8 case/s |
| Structure (tourelle) | 400 | 30 | 1,0 s | 5 | — | fixe |
| Artillerie | 180 | 60 | 2,5 s | 9 | **3** | 0,5 case/s |

**Repères de lecture**, calculés et non estimés :

- Un anti-véhicule (25 dégâts, 1 s) tue un marcheur (250 PV) en **10 s** seul, **1,7 s** à six
- Une artillerie (60 dégâts, 2,5 s) ouvre un pylône (400 PV) en **16,7 s** seule
- Un anti-structure contre de l'infanterie : 12 × 0,15 = 1,8 par tir → **inutilisable**, et
  c'est le but

---

## 6. La portée minimale

Reprise de TA (`REFERENCE-TA.md` §3), c'est la mécanique la plus intéressante du relevé.

**L'artillerie ne peut pas tirer sous 3 cases.** Une unité rapide qui la colle la neutralise
sans qu'elle riposte. C'est le contre naturel, et il ne demande aucune règle spéciale : il
tombe de la géométrie.

Ce que ça produit : la profondeur devient une ressource. Le joueur qui perce jusqu'au contact
annule l'artillerie adverse ; le défenseur qui empile de l'artillerie sans écran de proximité
se fait démonter par une seule unité rapide.

**Un module réduira la portée minimale** — équivalent du *SR Arms* de TA. Il fait partie de
l'arbre, pas du lot 2.

---

## 7. Résolution d'un tick

Ordre **strict et invariable**. Toute la reproductibilité en dépend.

```
1. Entrée de vague       si le tick correspond au décalage
2. Ciblage               chaque unité sans cible valide en cherche une
3. Déplacement           les unités sans cible à portée avancent
4. Tir                   les unités dont la cadence est échue tirent
5. Retrait des morts     PV ≤ 0 → retirées, dans l'ordre d'index
6. Test de fin           victoire, défaite ou temps écoulé
```

### Règle de ciblage — déterministe

```
cible = la plus proche dans la portée [portée_mini, portée_max]
        départage 1 : plus grand multiplicateur de la matrice
        départage 2 : plus petit index d'entité
```

⚠ **Le départage par index est obligatoire.** Sans lui, le résultat dépend de l'ordre
d'itération d'une structure de données — et le déterminisme casse le jour où quelqu'un change
un tableau en dictionnaire. C'est le genre de bug qui ne se voit qu'après des mois.

### Arithmétique entière

Comme l'économie du lot 1 : **PV et dégâts en milli-unités, entiers**. Aucun flottant dans la
résolution. Les multiplicateurs de la matrice sont appliqués en entier
(`dégâts × coef_millièmes / 1000`), avec une règle d'arrondi écrite une fois et testée.

---

## 8. Fin de combat, butin, réparation

| Issue | Condition |
|---|---|
| **Victoire** | toutes les structures de l'Ouvrage détruites |
| **Défaite** | plus aucune unité du joueur en vie |
| **Temps écoulé** | au-delà de la durée max — compté comme défaite partielle |

**Butin** proportionnel aux structures détruites, même en cas de défaite : une attaque qui
ouvre la moitié d'une base rapporte la moitié. Sans ça, l'échec ne rapporte rien et
l'apprentissage coûte trop cher.

**Réparation** : règle de TA reprise telle quelle (`REFERENCE-TA.md` §4), vérifiée
arithmétiquement là-bas.

```
coût_total  = Σ coût(réservoir)          ← additif
temps_total = max(temps(réservoir))      ← le réservoir le plus touché
```

**Un raid propre doit rester gratuit.** Aucune perte, aucune réparation. C'est ce qui convertit
la compétence en économie.

---

## 9. Ce que le batch de calibrage doit vérifier (lot 2B)

| # | Test | Critère |
|---|---|---|
| 1 | **Déterminisme** | 1 000 combats rejoués depuis le même état → résultats identiques au bit près |
| 2 | **Durée** | 90 % des combats se terminent entre 30 et 75 s |
| 3 | **Pas d'unité dominante** | Aucune composition mono-type ne gagne plus de 60 % des bases générées |
| 4 | **Utilité de l'anti-aérien** | Contre une base avec aviation, l'emporter double le taux de victoire. Sans aviation, c'est une perte sèche |
| 5 | **Portée minimale** | Une composition rapide bat une base sur-artillée. Si ce n'est pas le cas, la portée mini n'existe pas dans les faits |
| 6 | **Calibrage directeur** | 3 à 5 attaques par session, à tous les paliers. Le critère qui commande tous les autres |
| 7 | **Raid propre** | Il existe, à chaque palier, une composition qui gagne sans perte |
| 8 | **Coût de l'échec** | Un raid raté coûte, mais jamais plus que ce qu'une session produit |

**Le test 6 arbitre.** Si les autres passent et que celui-là échoue, ce sont les autres qu'il
faut revoir.

---

## 10. Ce que ce modèle ne couvre pas

- **Le générateur de défenses de l'Ouvrage** — risque principal identifié par la synthèse. Se
  conçoit mieux après avoir vu 10 000 combats tourner
- **Les modules** (dégâts de zone, neutralisation temporaire, aura, réparation instantanée) —
  structure connue de TA (§3), à écrire
- **La courbe de pression ennemie** — trou n° 1, toujours entier
- **Le rendu** — lot 3. Tant qu'un combat se lit dans un log, il n'a pas besoin d'être vu

---

## 11. Récapitulatif des paramètres

Tous dans `data/params.js`, aucun en dur.

| Paramètre | Départ | Effet si on l'augmente |
|---|---|---|
| Grille | 9 × 16 | Combats plus longs, placement plus fin |
| Décalage de vague | 5 s | Étale l'engagement, favorise la défense |
| Durée max | 60 s | Favorise les compositions lentes |
| Matrice hors spécialité | 0,15 – 0,40 | Rend les unités plus polyvalentes, la composition moins importante |
| PV / dégâts par type | cf. §5 | — |
| Portée minimale artillerie | 3 cases | Rend l'artillerie plus vulnérable au contact |
| Cadence | 0,5 – 2,5 s | Grossit ou lisse les paliers de dégâts |
| Butin par structure | proportionnel | Rend l'échec plus ou moins coûteux |
