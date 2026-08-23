# Relevé économique et territorial — *Tiberium Alliances*

Session du 22/08/2026. Mesures relevées en jeu par Ethan (captures d'infobulles) et règles
dictées de mémoire. Troisième volet, après `RELEVE-TA-ARSENAL.md` (catalogue) et
`RELEVE-TA-TACTIQUE.md` (combat).

**Statut : relevé, pas conception.** Les décisions Foyer Zéro sont isolées au §9.

Niveaux de confiance : **[M]** mesuré sur capture · **[C]** constaté en jeu, de mémoire ·
**[?]** à vérifier · **[X]** absent, à inventer.

---

## 1. La courbe de butin

### Mesures brutes **[M]**

Camp niveau 54 et camp niveau 65, onze niveaux d'écart :

| Bâtiment | niv 54 | niv 65 | ratio | par niveau |
|---|---|---|---|---|
| Collecteur | 219,8M | 4,659G | 21,20 | **1,320** |
| Raffinerie | 90,99M | 1,928G | 21,19 | **1,320** |
| Centre d'affaires | 136,4M | 2,893G | 21,21 | **1,320** |
| Chantier de construction | 76,62M | 1,624G | 21,19 | **1,320** |
| Silo (par ressource) | 112M | 2,375G | 21,21 | **1,320** |

1,32¹¹ = 21,196. Concordance à quatre chiffres, sur cinq bâtiments indépendants.

Contrôle interne : les valeurs relevées au niveau 55 divisées par 1,32 redonnent exactement
celles du 54 (collecteur 290,1 → 219,8 · silo 147,9 → 112,0 · QG 101,1 → 76,6).

### Deux régimes **[M]**

Avant-poste niveau 10, deux collecteurs voisins de niveaux 10 et 11 : **3 613 et 4 550**,
soit un ratio de **1,259**.

**La courbe a donc deux régimes.** Le ×1,32 ne s'installe qu'à partir du niveau 12 environ ;
en dessous la pente est plus douce. Cohérent avec le fait déjà tenu pour acquis sur les coûts.
Le début de partie est plus plat que la pente asymptotique ne le suggère.

*(à vérifier : que le collecteur 11 ne soit pas simplement posé sur un gisement plus riche)* **[?]**

### Hiérarchie des cibles, à niveau égal **[M]**

Base 1,00 = la classe QG de défense / Defense Facility / Chantier de construction, qui donnent
**rigoureusement la même valeur**, vérifié aux deux extrémités de la courbe (1 313 chacun au
niveau 10, 76,6M chacun au niveau 54).

| Cible | Indice | Nature |
|---|---|---|
| QG défense · Defense Facility · Chantier | 1,00 | ressource A |
| Raffinerie | 1,16 | crédits |
| Silo | 1,38 **par ressource** (2,76 au total) | A + B |
| Silo spécialisé (tiberium / cristal) | ~2,75 | une seule ressource |
| **Collecteur** | **2,75** | une seule ressource |

Le collecteur est la cible la plus rentable, presque trois fois la classe de base.

### Multiplicateur de site **[M]**

À niveau extrapolé égal, chaque bâtiment d'un **avant-poste** rapporte **3,0 à 3,5 fois** la
valeur d'un camp. Constante identique sur les cinq bâtiments mesurés — c'est un multiplicateur
de site, pas un accident de tirage.

### Butin proportionnel aux dégâts **[?]**

Hypothèse d'Ethan, très probablement juste : le pillage affiché correspond à une destruction
complète, et un bâtiment détruit à 50 % paye la moitié.

**Le butin est donc continu, pas binaire.** Conséquence directe sur la réserve de munitions
(cf. relevé tactique §4) : une unité qui franchit la ligne à 10 % ne rate pas son pillage, elle
en prélève une fraction. Le rendement d'un raid est une **intégrale** — combien de dégâts posés
sur quels contenants — et non un décompte de bâtiments rasés. C'est ce qui rend le plancher de
10 % économiquement lisible plutôt qu'arbitraire.

*(à vérifier : lire une infobulle sur un bâtiment déjà endommagé)*

---

## 2. Les trois types de site

| | **Camp** | **Avant-poste** | **Base** |
|---|---|---|---|
| Densité / bâtiments | faible | élevée | complète |
| Défense | légère | dure | complète |
| Butin par bâtiment | ×1 | **×3 à 3,5** | — |
| Attaque le joueur | non | non | **oui** |
| Indexé sur | **niveau d'attaque du joueur** | **rayon sur la carte** | **rayon sur la carte** |
| Bâtiment détruit | **définitif, jamais réparé** | **définitif, jamais réparé** | réparé |
| Le site respawne | **oui** | **oui** | **non** |
| Rôle | filet de sécurité | source de revenu | conquête territoriale |

**Les cibles de bas niveau sont moins denses que celles de haut niveau** **[C]** — cohérent avec
la logique interne du jeu : QG plus haut → plus de points de commandement → plus d'unités et de
bâtiments.

### La base : ROI faible, valeur territoriale

Raser une base rapporte peu au regard de sa difficulté. Son intérêt est ailleurs :

- elle **disparaît définitivement** de la carte ;
- elle libère du territoire, donc de la progression ;
- **elle cesse d'attaquer** — seules les bases attaquent le joueur.

### L'apparition des avant-postes **[C]**

Les avant-postes n'existent **pas** au démarrage. Ils apparaissent **à la présence du joueur**,
et leur niveau vient du **rayon**, pas des bases voisines.

- Au rayon 30, un joueur qui s'installe voit apparaître un avant-poste oscillant **29–31**.
- **1 à 2 avant-postes par base du joueur à proximité.**
- Ils **se renouvellent automatiquement**.
- Raser les bases d'une zone ne supprime pas ses avant-postes : ils ne dépendent pas d'elles.

**Le déplacement de base est donc l'acte qui crée le farm**, pas un simple ajustement de portée.
Ça donne au verrou de déplacement (§4) sa fonction économique : on ne bride pas la mobilité,
on bride le rythme d'ouverture des ressources.

---

## 3. Géographie

| Fait | Valeur | Confiance |
|---|---|---|
| Zone d'influence, joueur | rayon 2, **fixe, ne croît jamais** | **[C]** |
| Zone d'influence, ennemi | rayon 3, fixe | **[C]** |
| Effet de la zone | interdit la pose d'une base adverse | **[C]** |
| Rayon d'attaque | **10, fixe**, quel que soit le niveau | **[C]** |
| Coût d'attaque, croissance avec la distance | croissant | **[X]** |
| Niveau des bases ennemies | **10** en périphérie → **50** au centre | **[C]** |
| Niveau d'une base | **moyenne des niveaux de ses bâtiments** | **[C]** |
| Composition d'une base | **deux niveaux adjacents**, répartis pour atteindre la moyenne | **[M]** |

Exemples relevés : camp « 54 » mêlant du 54 et du 55 · avant-poste « 10 » mêlant du 10 et du 11
· camp « 65 » uniforme. Une cible visée à 34,6 donnerait 60 % de bâtiments au 35 et 40 % au 34.

**Conséquence pour le générateur :** un seul paramètre, le niveau visé ; la répartition en
découle mécaniquement.

---

## 4. Déplacement de base

| Fait | Valeur | Confiance |
|---|---|---|
| Délai entre deux sauts, base de départ | **1 h** | **[C]** |
| Délai au niveau 50 | **24 h** | **[C]** |
| Déplacement bloqué après avoir subi une attaque | **1 h** | **[C]** |
| Déplacement bloqué après avoir été rasé | **24 h** | **[C]** |

Attaquer **épingle la cible sur place** : on ne peut pas fuir un raid en sautant. Symétrique
pour le joueur.

Note de calibrage : les 24 h viennent d'un multijoueur sur trois mois. Pour une run solo de 15
à 25 h étalée sur 2 à 4 semaines, à réindexer.

---

## 5. Réparation et persistance

| Règle | Confiance |
|---|---|
| Une **base** ennemie s'auto-répare **de 0 à 100 % en 1 h maximum** | **[C]** |
| **Camps et avant-postes ne se réparent jamais** — un bâtiment détruit l'est définitivement | **[C]** |
| Après une attaque, le **complexe de défense répare gratuitement 70 % des PV perdus** lors du dernier raid | **[C]** |
| Cette réparation est **proportionnelle aux PV du complexe** : un complexe à 50 % répare 35 % | **[C]** |
| Détruire le Defense Facility empêche toute réparation ultérieure des défenses | **[C]** |
| Les unités défensives conservent **toujours au moins 1 % de PV** — elles ne disparaissent jamais complètement, même après ~5 raids | **[C]** |

### Hypothèse : 0,7 n'existe qu'une fois

Le complexe répare **70 %** des PV perdus. Le butin décroît en **0,7ⁿ**. Ce n'est probablement
pas une coïncidence : **c'est le même coefficient vu des deux côtés.** Si le butin suit le coût
de réparation des dégâts infligés, et que chaque raid retrouve une défense à 70 % de la
précédente, la décroissance du butin tombe toute seule — il n'y aurait aucun « coefficient de
butin » à écrire.

Contrôle : 0,7⁵ = 0,17, ce qui concorde avec les ~5 raids observés avant épuisement. **[?]**

### Le plancher est un motif de conception

10 % de munitions pour l'attaquant, 1 % de PV pour les défenseurs. Rien ne tombe jamais à zéro
des deux côtés. Règle cohérente, reprenable telle quelle.

---

## 6. Points de commandement — le vrai régulateur

| Fait | Valeur | Confiance |
|---|---|---|
| Régénération | **~10 / heure** | **[C]** approximatif |
| Plafond | **~250** | **[C]** approximatif |
| Coût d'une attaque, relevé | 12, 13 (camps 54 et 65) · 19 (avant-poste 10, plus éloigné) | **[M]** |
| Croissance du coût avec la distance | confirmée par les relevés | **[M]** |

**Ce sont les points de commandement, et non le déplacement, qui limitent la partie.** Chaque
attaque est un choix exclusif : ce qu'on tape, on ne le tape pas ailleurs.

Deux conséquences majeures :

1. **Le farm de bas niveau s'auto-élimine, sans règle dédiée.** Un camp de niveau 1 consomme le
   même point de commandement qu'une cible bien plus grasse. Le filet de sécurité fonctionne
   quand le joueur est à terre — précisément parce qu'il n'a rien de mieux à taper — et devient
   absurde dès qu'il va mieux. C'est le coût d'opportunité qui fait le travail, pas un plafond.
2. **Le rythme est stable sur toute la partie.** Coût et butin montent tous deux à ×1,32, le
   nombre d'attaques ne monte pas. Le nombre de raids nécessaires pour financer un niveau est
   donc à peu près constant du début à la fin. **Vérifiable par un seul quotient** : coût d'un
   niveau ÷ butin d'un avant-poste de même niveau, qui doit être stable.

---

## 7. La boucle de jeu, reconstituée

1. Le farm local **s'épuise** : camps et avant-postes détruits ne se réparent pas.
2. Il faut donc **avancer**.
3. Avancer suppose de **raser des bases** — mauvais ROI, mais ça libère du territoire.
4. Le territoire donne accès à des **anneaux de niveau supérieur**.
5. S'y installer **fait apparaître** de nouveaux avant-postes, seule source de revenu abondant.
6. Lesquels s'épuisent à leur tour.

**La conquête n'est pas une voie parallèle à l'économie : c'est le seul moyen de la renouveler.**
Le raid de base est un investissement en infrastructure.

**La carte est le niveau du joueur.** La position remplace une jauge d'expérience. On progresse
en se déplaçant vers le centre ; les chiffres suivent. Les anneaux ne sont pas des paliers de
difficulté, ce sont des **paliers de rendement**.

---

## 8. Pourquoi l'endgame de TA est décevant

Diagnostic structurel, pas défaut d'équilibrage.

Au centre, il n'y a plus de bases à raser, donc plus de territoire à ouvrir, donc plus
d'avant-postes de niveau supérieur. **Ne subsistent que les camps, indexés sur le niveau
d'attaque du joueur.**

**Une cible indexée sur le joueur ne peut jamais être une récompense.** Si elle monte quand tu
montes, le rapport butin/coût reste constant à vie : des chiffres plus gros pour un pouvoir
d'achat identique. Tapis roulant par construction.

Tout le milieu de partie fonctionne précisément **parce que les cibles sont indexées sur le
lieu**, et que le lieu est fini. TA ne pouvait pas faire autrement : jeu persistant, il doit
occuper les joueurs après épuisement de la carte. **Il n'a pas le droit de finir.**

---

## 9. Décisions Foyer Zéro issues de cette session

Arbitrages d'Ethan, actés.

| # | Décision |
|---|---|
| 1 | **Bases ennemies : aucun respawn.** Rasée = disparue |
| 2 | **Camps : respawn**, indexés sur le niveau d'attaque du joueur — filet de sécurité |
| 3 | **Avant-postes : respawn**, indexés sur **le rayon + la présence d'une base du joueur** — 1 à 2 par base à proximité |
| 4 | Ce double indexage **évite de peupler la carte entière au démarrage** |
| 5 | Le sous-nivelage et le sur-nivelage sont **tous deux fermés par la même formule** : le plafond vient de la zone, le plancher de la présence |
| 6 | **Foyer Zéro a le droit de finir.** Le centre est un terminus, pas un plateau. Une run de 15–25 h n'a pas besoin d'endgame, elle a besoin d'une fin |
| 7 | **Récompense terminale = la fin elle-même.** Deuxième fois que la question revient (après le refus des unités anti-tout) ; ici la réponse est de ne pas récompenser par un objet |
| 8 | **Le générateur de bases n'a pas besoin de sophistication.** Placer aléatoirement le complexe de défense — parfois devant, parfois derrière — suffit à créer de la décision, puisque sa position change la composition optimale. Chez le joueur le placement arrière est optimal donc vide ; chez l'IA l'aléatoire le rend informatif. **Variété la moins chère trouvée pour le risque n°1** |

### Correction actée

J'avais conclu que camps et avant-postes, « indexés sur le joueur », sortaient de la courbe de
butin. **Faux** : dans TA, les avant-postes sont indexés sur **la zone**. Seuls les camps
suivent le joueur, et c'est précisément ce qui ruine l'endgame.

### Le dimensionnement devient un calcul

Puisque le niveau vient de l'anneau et que le butin s'y épuise, il n'y a plus de stock global à
estimer. Il suffit de fixer **ce qu'un anneau rapporte quand on s'y installe**, et de le
comparer au **coût de la montée nécessaire pour attaquer l'anneau suivant**. Un anneau à la
fois, deux nombres, la même équation répétée. Beaucoup plus simple qu'une réserve globale.

---

## 10. Ce qui reste ouvert

| # | Point | Niveau |
|---|---|---|
| 1 | Coût d'attaque en fonction exacte de la distance | **[X]** |
| 2 | PC : 10/h et plafond 250 à confirmer, puis réindexer sur une run solo | **[C]** approximatif |
| 3 | Le collecteur niv 11 n'est-il pas sur un plus gros gisement ? | **[?]** |
| 4 | Proportionnalité butin / dégâts, sur un bâtiment endommagé | **[?]** |
| 5 | 0,7 unique ou deux coefficients distincts | **[?]** |
| 6 | Fréquence des raids ennemis — non relevable en une session | **[X]** |
| 7 | Point de bascule exact entre les deux régimes de courbe (~niveau 12) | **[?]** |
| 8 | Barème d'écrasement, stats d'unités, réserves — inchangé depuis le relevé tactique | **[X]** |

---

*Relevé fidèle et arbitrages d'Ethan. Rien n'est implémenté.*
