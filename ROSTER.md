# Roster — unités et bâtiments de *Foyer Zéro*

Complète `MODELE-COMBAT.md` (les règles) et `MODELE-ECONOMIQUE.md` (les courbes). Ce document
donne **le catalogue** : ce que le joueur construit, ce que l'Ouvrage aligne, et dans quel
ordre tout se débloque.

Comme les deux autres : les **formes** doivent tenir, les **valeurs** seront corrigées par le
batch du lot 2B.

---

## 1. Le principe : châssis × spécialité

Une unité n'est pas écrite à la main. Elle est le **croisement d'un châssis** (qui donne PV,
vitesse, portée, cadence) **et d'une spécialité** (qui donne la ligne de la matrice de
ciblage).

```
unité = châssis × spécialité
```

Deux conséquences, et c'est tout l'intérêt du système :

**Équilibrer un châssis équilibre toutes ses unités.** Baisser les PV du blindé corrige quatre
unités d'un coup, sans toucher à leurs rapports mutuels.

**Le catalogue se lit comme une grille**, pas comme une liste. Le joueur qui a compris *blindé*
et *anti-véhicule* comprend *Fendeur* sans l'avoir jamais utilisé.

⚠ **Précision qui manquait au modèle de combat.** Le tableau §5 de `MODELE-COMBAT.md` liste
**cinq châssis**, pas cinq unités. Le roster complet s'en déduit, il n'y était pas écrit — d'où
l'impression légitime qu'il manquait des unités.

---

## 2. Budget d'attention

**Treize unités offensives en fin de run.** Pas vingt-sept.

TA en a 14 en offense et 13 en défense, mais son roster est étalé sur des **mois** de
progression MMO : le joueur en débloque une toutes les deux semaines, et cet égrenage fait
partie de la rétention. Une run solo de quelques heures ne peut pas soutenir ce volume — le
joueur n'aurait le temps d'en comprendre aucune.

> **Le nombre d'unités est un budget d'attention, pas une mesure de richesse.**

La profondeur vient d'ailleurs : des **modules** (une unité, un module — structure reprise de
TA, `REFERENCE-TA.md` §2), du **placement**, et de la **composition** face à une défense qu'on
a observée.

**Cases volontairement vides.** Sur 5 châssis × 4 spécialités = 20 combinaisons, on en retient
13. Les 7 vides ne sont pas des oublis : elles réservent la place d'extensions futures et
évitent la grille pleine, qui transforme le choix en calcul mécanique.

---

## 3. Les châssis

Valeurs de départ, niveau 1. Reprises et complétées depuis `MODELE-COMBAT.md` §5.

| Châssis | Type | PV | Dégâts | Cadence | Portée | P. mini | Vitesse | Réservoir |
|---|---|---|---|---|---|---|---|---|
| **Escouade** | infanterie | 100 | 12 | 0,5 s | 3 | — | 1,2 c/s | Infanterie |
| **Blindé** | véhicule | 250 | 25 | 1,0 s | 4 | — | 0,9 c/s | Véhicules |
| **Aéronef** | aviation | 150 | 20 | 0,7 s | 3 | — | 1,8 c/s | Aviation |
| **Pièce** | véhicule | 180 | 60 | 2,5 s | 9 | **3** | 0,5 c/s | Véhicules |
| **Masse** | véhicule | 500 | 40 | 1,8 s | 2 | — | 0,45 c/s | Véhicules |

**La Masse** est le châssis ajouté ici : très lent, très résistant, courte portée. Son rôle
n'est pas de tuer mais **d'absorber** — il entre en première vague et prend les tirs pendant
que les Pièces travaillent depuis l'arrière. Sans lui, l'artillerie n'a aucun écran et la
portée minimale ne produit pas la tension prévue.

**La Pièce** compte dans le réservoir Véhicules, comme la Masse : trois réservoirs seulement
(Infanterie, Véhicules, Aviation), plus la Base. Repris de TA (`REFERENCE-TA.md` §4).

---

## 4. Les douze unités offensives

| Châssis ↓ / Spécialité → | Anti-infanterie | Anti-véhicule | Anti-structure | Anti-aérien |
|---|---|---|---|---|
| **Escouade** | **Fusiliers** | **Perceurs** | **Sapeurs** | — |
| **Blindé** | **Ratisseur** | **Fendeur** | **Bélier** | **Affût** |
| **Aéronef** | **Crécelle** | — | **Frappeur** | — |
| **Pièce** | — | **Canon long** | **Obusier** | **Escopette** |
| **Masse** | — | — | **Broyeur** | — |

Treize unités. Les sept cases vides sont détaillées au §9.

### Ce que chacune fait

| Unité | En un mot |
|---|---|
| **Fusiliers** | l'unité de départ. Nettoie les essaims, ne fait rien d'autre |
| **Perceurs** | infanterie antichar. Fragile, mais un marcheur isolé ne lui résiste pas |
| **Sapeurs** | infanterie de démolition. Lente à ouvrir une structure, mais nombreuse et bon marché |
| **Ratisseur** | blindé léger anti-infanterie. Le contre des essaims quand les Fusiliers ne suffisent plus |
| **Fendeur** | le duelliste. Le meilleur rapport dégâts/PV contre les marcheurs |
| **Bélier** | blindé de rupture. Ouvre les pylônes au contact, meurt vite s'il reste seul |
| **Affût** | anti-aérien mobile. Suit la colonne et abat les Dards |
| **Crécelle** | aéronef anti-infanterie. Rapide, ignore le terrain, fond sur les essaims |
| **Frappeur** | aéronef de bombardement. Frappe une structure et repart |
| **Canon long** | artillerie antichar. Détruit les marcheurs avant qu'ils n'engagent |
| **Obusier** | artillerie de siège. La seule réponse aux pylônes lourds à distance |
| **Escopette** | artillerie anti-aérienne. Verrouille un ciel entier, inutile s'il n'y a rien dedans |

**Trois unités de départ, acquises d'office** : Fusiliers, Ratisseur, Bélier — une par type de
cible terrestre. Le joueur peut jouer dès la première minute sans rien débloquer. Repris de TA,
qui offre trois unités d'entrée (`REFERENCE-TA.md` §2).

---

## 5. Les défenses du joueur

Ce sont des **bâtiments**, pas des unités : ils occupent un emplacement de construction, se
placent sur la carte de base, et montent sur la même courbe.

| Bâtiment | Cible | Nature | Rôle |
|---|---|---|---|
| **Casemate** | infanterie | tourelle | tir rapide, courte portée |
| **Herse** | véhicule | obstacle | **blesse au franchissement**, ne tire pas |
| **Batterie** | aviation | tourelle | portée haute, ne touche que le ciel |
| **Mortier** | véhicule | artillerie, **portée mini 3** | frappe loin, aveugle au contact |
| **Bastion** | — | QG de défense | augmente les PV et la cadence des défenses adjacentes |

**La Herse ne tire pas.** Elle inflige des dégâts aux véhicules qui la traversent — mécanique
reprise de TA (*« damages passing vehicles »*, `REFERENCE-TA.md` §3). C'est une défense de
**canalisation** : elle ne tue pas, elle décide par où l'ennemi passera. Elle donne au
placement un rôle qu'aucune tourelle ne donne.

**Le Mortier hérite de la portée minimale**, avec sa faiblesse : une unité rapide qui le colle
le neutralise. C'est le contre naturel, et il tombe de la géométrie sans règle spéciale.

---

## 6. Les formes de l'Ouvrage

L'Ouvrage n'est pas une armée. Il n'a ni chef, ni infanterie au sens humain : il a des
**modules qui se répliquent**. Les noms sont des désignations d'observation, pas des noms
propres.

| Forme | Type | Rôle | Étalon v4 |
|---|---|---|---|
| **Pylône** | structure | tourelle fixe, anti-tout terrestre | ✅ |
| **Pylône haut** | structure | tourelle anti-aérienne | ⚠ variante |
| **Marcheur** | véhicule | lourd, lent, à pattes | ✅ |
| **Marcheur lourd** | véhicule | version tardive, PV doublés | ⚠ variante |
| **Essaim** | infanterie | léger, nombreux, terrestre | ✅ |
| **Dard** | aviation | rapide, isolé, fragile | ❌ **à créer** |
| **Nœud** | structure | producteur, ne combat pas — **objectif de raid** | ❌ à créer |
| **Racine** | structure | relie les Nœuds, s'étend d'anneau en anneau | ❌ à créer |
| **Le Foyer** | structure | fin de run | ❌ à créer |

⚠ **Dette DA ouverte** (inscrite dans `FICHE-STYLE.md`) : le **Dard** n'existe pas dans
l'étalon v4, alors que `arme_aa.png` existe côté joueur. Sans lui, l'Affût et l'Escopette n'ont
aucune cible et **un quart de la matrice est mort**.

**Le Nœud est la cible qui compte.** Ce n'est pas une tourelle : c'est ce que le joueur vient
détruire, et ce qui détermine le butin. Une base sans Nœud ne vaut pas l'attaque.

**Asymétrie assumée** : l'Ouvrage n'aligne aucune unité mobile en attaque au début de partie.
La pression ennemie (trou n° 1 de la synthèse) décidera si et quand il en envoie.

---

## 7. Les quatorze bâtiments

Confirmés et complétés depuis `MODELE-ECONOMIQUE.md` §5. `ρ` est la constante de coût croisé
(part quartz / part scorie) ; `E` l'échelle de coût au niveau 1.

| # | Bâtiment | Rôle | Produit | ρ | E |
|---|---|---|---|---|---|
| 1 | **Poste** | emplacements, stockage, temps de réparation. **Unique** | — | 1,20 | 60 |
| 2 | **Foreuse** | extraction sur affleurement | quartz | 0,45 | 20 |
| 3 | **Décapeuse** | raclage sur croûte | scorie | 3,50 | 35 |
| 4 | **Silo** | stockage | — | 1,20 | 25 |
| 5 | **Fonderie** | convertit quartz → scorie, **5 pour 1** | scorie | 3,50 | 70 |
| 6 | **Baraque** | produit les Escouades | — | 1,20 | 40 |
| 7 | **Atelier** | produit Blindés, Pièces et Masses | — | 1,20 | 80 |
| 8 | **Aire** | produit les Aéronefs | — | 1,20 | 120 |
| 9 | **Antenne** | recherche | — | 1,20 | 50 |
| 10 | **Bastion** | QG de défense | — | 1,50 | 100 |
| 11 | **Casemate** | défense anti-infanterie | — | 1,50 | 30 |
| 12 | **Herse** | obstacle anti-véhicule | — | 1,50 | 25 |
| 13 | **Batterie** | défense anti-aérienne | — | 1,50 | 90 |
| 14 | **Mortier** | artillerie défensive, portée mini | — | 1,50 | 150 |

**Le Poste est le pivot**, repris du Construction Yard de TA (`REFERENCE-TA.md` §5) : il porte
à lui seul le nombre d'emplacements, la capacité de stockage **et** le temps de réparation. Il
ne peut pas être adjacent à un autre bâtiment unique.

**L'Atelier produit trois châssis** au lieu d'un. Un bâtiment par châssis en ferait seize, et
l'Aire ne servirait qu'à deux unités. Le regroupement suit le **réservoir de réparation**, pas
le châssis — trois producteurs pour trois réservoirs, c'est cohérent de bout en bout.

---

## 8. Ordre de déblocage

Trois unités d'office, les neuf autres par la recherche. Chaque unité débloque **un module**
(structure de TA, `REFERENCE-TA.md` §2).

| Palier | Débloque | Ce que ça ouvre au joueur |
|---|---|---|
| **0** — départ | Fusiliers · Ratisseur · Bélier | jouer sans rien débloquer |
| **1** | Sapeurs · Perceurs | l'infanterie devient polyvalente |
| **2** | Fendeur | premier vrai duelliste antichar |
| **3** | Herse · Casemate | la défense existe |
| **4** | Canon long | la portée entre en jeu |
| **5** | **Affût** | ⚠ premier Dard rencontré au même palier |
| **6** | Crécelle · Aire | l'aviation s'ouvre |
| **7** | Obusier · Mortier | le siège à distance |
| **8** | Frappeur · Batterie | |
| **9** | Broyeur · Masse | l'écran d'artillerie |
| **10** | Escopette · Bastion | |

⚠ **Le palier 5 est une contrainte dure.** L'Affût doit être disponible **au moment exact** où
le premier Dard apparaît. Débloqué trop tôt, c'est un emplacement mort ; trop tard, le joueur
subit une menace sans réponse. C'est le point de synchronisation le plus fragile de tout le
déblocage, et le batch doit le vérifier explicitement.

---

## 9. Les sept cases vides, et pourquoi

| Case | Décision |
|---|---|
| Escouade × anti-aérien | **Jamais.** Un fantassin qui abat un aéronef affaiblit tout le système anti-aérien |
| Aéronef × anti-véhicule | **Réservé.** Un aéronef antichar rendrait le Canon long inutile — il ferait la même chose en plus mobile |
| Aéronef × anti-aérien | **Réservé.** Chasse aérienne : intéressant, mais suppose une aviation ennemie développée |
| Pièce × anti-infanterie | **Jamais.** Une artillerie qui écrase les essaims annule le seul rôle du Ratisseur |
| Masse × anti-infanterie / anti-véhicule / anti-aérien | **Réservé.** La Masse doit rester un **écran**, pas un char polyvalent. Lui donner des rôles la rendrait obligatoire dans toute composition |

**Principe qui gouverne les vides :** une case reste fermée quand la remplir **rendrait une
autre unité inutile**. C'est le seul critère — pas l'équilibrage, pas le thème.

---

## 10. Ce qui reste ouvert

- **Les modules** — une unité, un module, structure connue. Contenu à écrire
- **Les valeurs par unité** — les châssis sont posés, les modificateurs de spécialité non.
  Une Escouade anti-structure a-t-elle exactement les PV d'une Escouade anti-infanterie ? Je
  propose **oui** au départ : le châssis seul décide, la spécialité ne touche qu'à la matrice.
  Plus simple à équilibrer, quitte à ajouter des écarts plus tard s'ils manquent
- **Le coût de production des unités** — vraisemblablement même structure que les bâtiments
  (coût croisé + pente universelle), constantes propres. Non relevé sur TA
- **Le générateur de défenses de l'Ouvrage** — risque principal de la synthèse
- **La courbe de pression ennemie** — trou n° 1, toujours entier
- **La courbe de butin par anneau** — manque le plus urgent côté économie
  (`MODELE-ECONOMIQUE.md` §2)

---

## 11. Ce que le batch devra vérifier sur le roster

| # | Test | Critère |
|---|---|---|
| 1 | **Aucune unité morte** | Chacune des 13 est le meilleur choix dans au moins une situation générée |
| 2 | **Aucune unité obligatoire** | Aucune n'apparaît dans plus de 80 % des compositions gagnantes |
| 3 | **Synchronisation Affût/Dard** | Au palier 5, le joueur dispose de l'Affût avant de subir un Dard |
| 4 | **Les trois de départ suffisent** | Une composition Fusiliers/Ratisseur/Bélier gagne les bases du premier anneau |
| 5 | **La Masse sert d'écran** | Une composition Pièces + Masse bat une composition Pièces seules |
| 6 | **La Herse canalise** | Sa présence change le trajet de l'attaquant, mesurable sur les positions |
| 7 | **Les cases vides ne manquent pas** | Aucune situation générée ne devient injouable faute d'une combinaison absente |

**Le test 2 est le plus sévère.** Une unité présente partout n'est pas une bonne unité : c'est
une taxe. Si elle apparaît, c'est sa ligne de matrice ou son châssis qu'il faut corriger, pas
son coût.
