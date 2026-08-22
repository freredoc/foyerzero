# Modèle économique — *Chantier*

Tâche **1.2**. Ce document définit **les règles et les paramètres** de l'économie. Les valeurs
numériques sont des **points de départ à calibrer**, pas des vérités : le batch de simulation
de la phase 2 les corrigera. Ce qui doit tenir, ce sont les **formes**.

Chaque emprunt à *Tiberium Alliances* renvoie à `REFERENCE-TA.md`. Chaque écart est justifié.

---

## 1. Ce qu'on reprend, et ce qu'on change

### Repris — la structure

| Mécanisme | Source | Pourquoi |
|---|---|---|
| Production = **packages saturants + flux continu** | TA §6 | Vérifié à l'unité près. Donne un rattrapage hors ligne analytique |
| **Adjacence fixe**, qui ne monte pas avec le niveau | TA §6 | Rend le placement décisif en ouverture et marginal ensuite. Élégant |
| **Coût croisé** — chaque bâtiment coûte cher dans ce qu'il ne produit pas | TA §7 | Verrou économique obtenu sans règle explicite |
| **Pente universelle** — deux constantes par bâtiment, une courbe commune | TA §7 | Six séries indépendantes donnent les mêmes ratios. Trivial à implémenter |
| **Saturation verticale** qui pousse vers l'expansion | TA §7 | Répond directement à la structure en anneaux |
| Réparation : **coût additif, temps = max des réservoirs** | TA §4 | Fait des réservoirs un levier tactique réel |

### Changé — parce que le contexte diffère

| Écart | Raison |
|---|---|
| **Pente de coût adoucie** : ×1,55 de temps de retour par niveau au lieu de ×2,4 | TA sature brutalement pour vendre des raccourcis. Sans monétisation, une saturation aussi raide ne produit que de la frustration |
| **Les chiffres sont affichés** au joueur | TA ne montre jamais une valeur de combat (TA §10). En solo sans classement, l'opacité ne protège rien et empêche de jouer finement |
| **Deux ressources** au lieu de quatre | Décision 0.1. Le coût croisé fonctionne aussi bien avec deux |
| **Le stockage est le vrai plafond de l'idle** | TA fait saturer les packages mais laisse courir le flux continu jusqu'à la limite de stockage. On en fait le levier central du rythme de session |
| **Pas de temps réel long** — rien qui se compte en jours | *« 1 week after first base »* est une contrainte de MMO. Une run solo doit tenir en heures de jeu |

---

## 2. Les deux courbes

Tout le modèle tient sur deux suites de ratios, communes à **tous** les bâtiments.

### Coût

```
ratio_C(n) = R∞c + (R1c − R∞c) / n
C_b(n+1)   = C_b(n) × ratio_C(n)
```

| Paramètre | Valeur de départ | Rôle |
|---|---|---|
| `R1c` | **2,40** | Ratio au premier niveau |
| `R∞c` | **1,70** | Asymptote |

Décroissant : 2,40 → 2,05 → 1,93 → … → 1,74 au niveau 10 → 1,72 au niveau 20.

### Production

```
ratio_P(n) = R∞p + (R1p − R∞p) / n
P_b(n+1)   = P_b(n) × ratio_P(n)
```

| Paramètre | Valeur de départ | Rôle |
|---|---|---|
| `R1p` | **1,45** | Ratio au premier niveau |
| `R∞p` | **1,12** | Asymptote |

### Le rapport des deux est le cœur du jeu

Le temps de retour sur investissement est multiplié par `ratio_C(n) / ratio_P(n)` à chaque
niveau — environ **×1,55**, à peu près constant sur toute la courbe.

> Au niveau 15, améliorer représente un temps de retour **480 fois** plus long qu'au niveau 1.
> C'est ce qui rend l'anneau suivant plus attractif que le niveau suivant.

**Le seul paramètre à surveiller pendant le calibrage, c'est cet écart.** Trop grand, le joueur
se sent puni de progresser ; trop petit, il reste sur sa base de départ et les anneaux ne
servent à rien. Tout le reste est cosmétique à côté.

### Une conséquence à trancher : le niveau maximum

⚠ **Correction apportée par Ethan le 22/08/2026, et elle change la conclusion de cette
section.** Le raisonnement ci-dessous ne compte que la **production de base** comme revenu. Or
sur un compte avancé de TA (niveau 54), le **butin des raids est la source de revenu
principale**, et il croît avec le niveau des cibles.

La boucle réelle est donc : monter → attaquer plus loin → butin plus gros → monter encore.
**La saturation verticale ne bloque pas la progression, elle transfère son financement** de la
production vers le raid.

Ce qui donne sa vraie justification au calibrage directeur des 3 à 5 attaques par session : il
n'est pas là pour le rythme, il est là parce que **le raid devient le revenu principal passé un
certain palier**. Un joueur qui n'attaque pas ne progresse plus — c'est exactement l'incitation
recherchée.

⚠ **Ce que ce classeur ne modélise pas :** la courbe de butin par anneau. Sans elle, le seuil
de rentabilité calculé ici est faux par construction — il ignore la moitié des revenus. À
ajouter avant toute conclusion sur le niveau maximum.

Le classeur montre qu'au niveau 25 le coût vaut **1,4 million de fois** celui du niveau 1, pour
une production seulement 43 fois supérieure. Ce n'est pas une anomalie du modèle, c'est sa
logique poussée à bout — mais ça veut dire que **les niveaux au-delà de ~18 ne seront jamais
atteints**, sauf en toute fin de partie sur un seul bâtiment clé.

Deux options, à décider en phase 2 quand le batch aura tourné :

- **Plafonner à 15–18 niveaux** et l'assumer dans l'interface. Honnête, lisible, et évite
  d'afficher au joueur une barre qu'il ne remplira jamais
- **Laisser courir** et se servir des niveaux hauts comme d'un puits à ressources de fin de
  partie, quand il n'y a plus d'anneau à prendre

Ma préférence allait au plafond. **Je la retire** : avec le butin des raids en revenu
principal, le niveau 50 est atteignable — c'est le cas sur le compte de référence. La question
n'est donc plus « où plafonner » mais **« la courbe de butin suit-elle la courbe de coût ? »**.
Si le butin croît plus vite que ×1,7 par niveau, la progression ne sature jamais ; s'il croît
moins vite, elle sature quand même, plus tard. À mesurer avant de trancher.

---

## 3. Le coût croisé

Le coût d'un niveau se répartit entre quartz et scorie selon une constante propre au bâtiment.

```
ρ_b        = part_quartz / part_scorie          (constante du bâtiment)
quartz_b(n) = C_b(n) × ρ_b / (1 + ρ_b)
scorie_b(n) = C_b(n) × 1  / (1 + ρ_b)
```

| Bâtiment produit… | ρ_b | Lecture |
|---|---|---|
| **du quartz** | **0,45** | coûte surtout de la **scorie** |
| rien (militaire, stockage) | **1,20** | équilibré, léger biais quartz |
| structure défensive | **1,50** | biais quartz plus marqué |
| **de la scorie** | **3,50** | coûte surtout du **quartz** |

**Plancher d'amorçage.** Les **trois premiers niveaux** de tout bâtiment ne coûtent **que du
quartz**. Sans ça, le joueur ne peut rien construire avant d'avoir pris du terrain contaminé —
blocage mortel en ouverture. TA fait exactement pareil : sa centrale ne coûte aucune énergie à
ses deux premiers paliers (TA §7).

**Ce que ça produit.** La scorie est sur la croûte, la croûte est tenue par l'Ouvrage. Monter
ses foreuses à quartz consomme de la scorie, donc **oblige à attaquer**. Monter ses décapeuses
à scorie consomme du quartz, donc **oblige à tenir du terrain sûr**. Aucune des deux branches
ne se développe seule. C'est le verrou central, et il ne demande aucune règle explicite.

---

## 4. Production, adjacence, saturation

```
P_totale(n) = débit_packages(n) + continu_base(n) + Σ adjacences
```

### Packages — la part saturante

Le bâtiment dépose un colis toutes les `T` minutes. Au-delà de `K` colis en attente, il
**s'arrête**.

| Paramètre | Valeur de départ |
|---|---|
| `T` — période | **5 min** |
| `K` — colis max en attente | **2** |
| Part du total au niveau 1 | ~45 % |

Absent plus de `T × K` = 10 minutes, le joueur ne perd rien de plus. C'est la part qui
récompense le retour, sans punir l'absence.

### Continu — la part qui coule

Ne s'arrête jamais, **sauf stockage plein**. C'est le plafond réel de l'idle (§6).

### Adjacence — le levier d'ouverture

```
adjacence = A_b par voisin qualifiant, plafonnée à 2 voisins
A_b       = 0,5 × P_b(1)        ← constante, NE MONTE JAMAIS
```

Au niveau 1, deux bons voisins valent **la moitié de la production totale**. Au niveau 8 ils
n'en font plus que 18 %, au niveau 12 un peu plus de 11 %. Le placement est une décision
d'ouverture qu'on ne peut pas rattraper plus tard, et qui cesse de peser une fois la base
mûre. Repris tel quel de TA (§6) parce que c'est juste.

Voisins qualifiants : une foreuse gagne à toucher un affleurement, une décapeuse une croûte,
un atelier un silo. **À fixer bâtiment par bâtiment en phase 2.**

---

## 5. Les bâtiments

Noms **provisoires**, registre du chantier industriel, cohérents avec le lexique de 0.1.
Le tableur porte les constantes ; ce tableau porte les rôles.

| # | Nom | Rôle | Produit | ρ_b |
|---|---|---|---|---|
| 1 | **Poste** | pivot : emplacements, stockage, temps de réparation | — | 1,20 |
| 2 | **Foreuse** | extraction sur affleurement | quartz | 0,45 |
| 3 | **Décapeuse** | raclage sur croûte | scorie | 3,50 |
| 4 | **Silo** | stockage | — | 1,20 |
| 5 | **Fonderie** | convertit quartz → scorie à perte | scorie | 3,50 |
| 6 | **Baraque** | produit l'infanterie | — | 1,20 |
| 7 | **Atelier** | produit les véhicules | — | 1,20 |
| 8 | **Aire** | produit l'aviation | — | 1,20 |
| 9 | **Antenne** | recherche | — | 1,20 |
| 10 | **Bastion** | QG de défense | — | 1,50 |
| 11 | **Casemate** | défense anti-infanterie | — | 1,50 |
| 12 | **Herse** | obstacle, blesse les véhicules qui passent | — | 1,50 |
| 13 | **Batterie** | défense anti-aviation | — | 1,50 |
| 14 | **Mortier** | artillerie, **portée minimale** | — | 1,50 |

**La Fonderie mérite un mot.** Elle convertit du quartz en scorie avec une perte importante
(taux de départ : **5 pour 1**). Elle existe pour donner une **sortie de secours** au joueur
bloqué faute de scorie, sans annuler la pression territoriale — c'est un taux volontairement
mauvais, une soupape et non une alternative. Elle n'a pas d'équivalent dans TA ; c'est une
compensation nécessaire de l'absence de commerce entre joueurs.

**Le Mortier reprend la portée minimale** de TA (§3) : incapable de tirer trop près. C'est la
mécanique la plus intéressante du relevé — elle récompense la pénétration en profondeur au
lieu de la simple accumulation de portée.

---

## 6. Idle, stockage et rattrapage hors ligne

### Le stockage plafonne tout

```
capacité = cap_Poste(n) + Σ cap_Silo(n)
```

Le flux continu **s'arrête quand c'est plein**. Le temps de saturation est donc :

```
t_sat = capacité / flux_continu
```

Cible de départ : **environ 24 h** au début de partie, décroissant vers **8 h** en fin de
courbe si le joueur ne monte pas ses silos.

C'est le vrai régulateur de rythme : il donne une raison de revenir, une raison de monter le
stockage, et il **borne le gain d'une longue absence** sans jamais rien confisquer.

### Le rattrapage est analytique

Aucune resimulation au chargement. À l'ouverture, pour un temps écoulé `Δt` :

```
packages = min(K, Δt / T)                            ← sature
continu  = min(capacité − stock, flux × Δt)          ← sature
butin_def = min(plafond_butin, raids_repoussés × gain)  ← sature
PV        = max(plancher, PV − dégâts_cumulés)       ← plancher
```

**Les quatre termes saturent.** Revenir après trois jours se calcule en quatre lignes, sans
faire tourner une seule seconde de simulation. C'était l'exigence posée en 0.2, et elle est
tenue.

---

## 7. La boucle d'attaque

### Butin de défense (décision 0.2)

Réserve **saturante**, collecte manuelle, plafond ≈ **le gain d'une attaque menée à la main**.
Le joueur absent 6 h et celui absent 3 jours trouvent la même réserve pleine.

**Sanction d'une défense insuffisante : par les PV, pas par une taxe.** La production est
proportionnelle aux PV du bâtiment ; un raid qui passe fait tomber la production et vide le
réservoir de réparation. Aucun prélèvement forfaitaire — payer un loyer pour avoir dormi est
la sensation exacte qu'on veut éviter.

**Plancher de PV.** Les dégâts hors ligne ne descendent jamais sous un plancher (départ :
**40 %**). Sans lui, une longue absence peut rendre la reprise impossible — spirale mortelle
classique de l'idle.

### Réparation

Quatre réservoirs — infanterie, véhicules, aviation, base — qui réparent **en parallèle**.

```
coût_total  = Σ coût(réservoir)          ← additif
temps_total = max(temps(réservoir))      ← le plus touché
```

Repris de TA §4, où la règle a été vérifiée arithmétiquement. Concentrer ses pertes sur un
réservoir coûte pareil mais immobilise plus longtemps ; les répartir libère plus vite.

### Un raid propre doit être gratuit

TA le démontre : *« No damage was dealt »* sur un raid bien mené (TA §8). **On garde cette
propriété.** Le rendement dépend de la qualité de l'engagement, pas du hasard : le joueur qui
attaque bien ne paie rien, celui qui force paie cher. La compétence se convertit directement
en économie.

---

## 8. Calibrage — ce que le batch doit vérifier

Le calibrage directeur reste : **3 à 5 attaques par session, à tous les paliers**.

| # | Test | Critère |
|---|---|---|
| 1 | **Rythme de session** | Le stock accumulé pendant `t_sat` finance 3 à 5 attaques, du premier au dernier anneau |
| 2 | **Écart des courbes** | Au niveau `n`, prendre l'anneau suivant doit être plus rentable que monter d'un niveau. Le point de bascule doit tomber vers le **niveau 8–12**, pas au 3 ni au 25 |
| 3 | **Verrou croisé** | Aucune branche ne se développe seule au-delà du niveau 5. Vérifier qu'un joueur qui ignore la scorie plafonne |
| 4 | **Soupape Fonderie** | À 5:1, elle débloque sans concurrencer l'attaque. Si le batch montre des joueurs qui vivent en Fonderie, monter le taux |
| 5 | **Adjacence** | Un bon placement initial vaut 1,5 à 2 niveaux d'avance. Au-delà, le placement devient un piège à optimisation |
| 6 | **Plancher de PV** | Après 7 jours d'absence, la base reste jouable sans assistance |
| 7 | **Rattrapage** | L'état calculé analytiquement est **identique** à celui d'une simulation complète. Test de non-régression obligatoire |

**Le test 7 est le plus important techniquement.** Si le rattrapage analytique diverge de la
simulation, tout le modèle idle s'effondre en silence — le joueur perd ou gagne des ressources
sans que rien ne le signale. C'est exactement le genre de bug qu'un cœur déterministe testable
en Node attrape en millisecondes, et c'est pourquoi la décision 0.3 a penché vers la toolchain.

---

## 9. Ce que ce modèle ne couvre pas encore

- **La courbe de butin par anneau** — manque le plus urgent. Sans elle, aucun calcul de
  rentabilité n'est valide au-delà des premiers niveaux (§2)
- **Les valeurs de combat** — PV, dégâts, portées, vitesses. Phase 2, en rectangles colorés
- **Les coefficients de ciblage** — le seul manque réel de la 1.1, jamais exposé par TA
- **Le coût des unités** — vraisemblablement même structure, constantes propres (TA §7)
- **L'arbre de recherche** — structure connue (une unité → un module), contenu à écrire
- **La courbe de pression ennemie** — trou n° 1 de la synthèse, toujours entier. Contrainte
  déjà posée : indexée sur la progression, jamais sur la vulnérabilité
- **Les objectifs** — TA en a un système entier (TA §9), le plan n'en dit rien
- **La méta-progression au reset**

---

## 10. Récapitulatif des paramètres

Tous dans l'onglet **Paramètres** du tableur, tous modifiables, aucun codé en dur ailleurs.

| Paramètre | Départ | Effet si on l'augmente |
|---|---|---|
| `R1c` / `R∞c` | 2,40 / 1,70 | Progression plus chère, saturation plus rapide |
| `R1p` / `R∞p` | 1,45 / 1,12 | Progression plus payante, saturation repoussée |
| `ρ_b` extracteurs | 0,45 / 3,50 | Verrou croisé plus serré |
| Plancher d'amorçage | 3 niveaux | Ouverture plus confortable |
| `T` / `K` packages | 5 min / 2 | Récompense du retour fréquent |
| `A_b` adjacence | 0,5 × P(1) | Placement plus décisif |
| `t_sat` cible | 24 h → 8 h | Tolérance à l'absence |
| Taux Fonderie | 5:1 | Soupape plus généreuse |
| Plancher de PV | 40 % | Absence longue moins punitive |
| Plafond butin défense | 1 attaque | Défense plus rentable |
