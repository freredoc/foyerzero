# Arbre de recherche — relevé TA et transposition

Relevé du 23/08/2026, à partir de douze captures de l'écran Recherche de *Tiberium Alliances*.
Trois onglets : **Offense**, **Défense**, **Spécial**.

Les coûts marqués **⟨estimé⟩** ne figurent sur aucune capture : ils sont reconstruits par
extrapolation et **à corriger**.

---

## 1. Ce que montrent les captures

### Règles observées

- Chaque recherche coûte **deux monnaies** : des crédits et des points de recherche. Le rapport
  est constant, entre **2,0 et 2,5 points par crédit**, sur les 27 recherches lisibles.
- **Chaque module est une recherche distincte**, conditionnée par son unité : la carte du module
  est grisée et porte la mention *Requires X* tant que l'unité n'est pas achetée.
- **Les modules ont des niveaux.** Les quatre modules dont le coût est visible affichent
  *Upgrade* et non *Research* — ce sont des coûts de montée, pas d'acquisition. Le coût
  d'acquisition initial n'apparaît nulle part.
- Les unités de départ sont déjà acquises : leur coût initial est invisible.

### Onglet OFFENSE — 14 unités

Dans l'ordre de l'arbre. Coûts en crédits / points de recherche.

| # | TA | Foyer Zéro | Rôle | Coût |
|---|---|---|---|---|
| 1 | Rifleman Squad | **Fusiliers** | escouade anti-infanterie | ⟨4 k / 10 k⟩ |
| 2 | Guardian | **Éclaireur** | blindé anti-infanterie rapide | ⟨9 k / 22 k⟩ |
| 3 | Paladin | **Épervier** | aéronef anti-véhicule | ⟨18 k / 45 k⟩ |
| 4 | Pitbull | **Pionnier** | blindé anti-structure rapide | ⟨38 k / 95 k⟩ |
| 5 | Missile Squad | **Grenadiers** | escouade anti-structure | 80 k / 200 k |
| 6 | Predator | **Chasseur** | blindé anti-véhicule | 110 k / 270 k |
| 7 | Firehawk | **Foudre** | aéronef anti-structure rapide | 200 k / 500 k |
| 8 | Zone Troopers | **Cuirassiers** | escouade anti-véhicule | 600 k / 1,5 M |
| 9 | Commando | **Sapeurs** | escouade anti-structure endurante | 2,4 M / 5,8 M |
| 10 | Orca | **Milan** | aéronef anti-infanterie | 4,1 M / 9,85 M |
| 11 | Juggernaut | **Obusier** | blindé anti-structure lent | 8,65 M / 19,6 M |
| 12 | Sniper Team | **Voltigeurs** | escouade anti-infanterie longue portée | 19 M / 42,5 M |
| 13 | Mammoth | **Percheron** | blindé lourd anti-véhicule | 40 M / 100 M |
| 14 | Kodiak | **Albatros** | aéronef anti-structure lourd | 60 M / 120 M |

**Les quatorze descriptions confirment nos spécialités**, y compris les deux corrections
d'hier : le Missile Squad est décrit *send to attack structures* — donc Grenadiers est bien
anti-structure — et le Mammoth *best used against vehicles* — donc Percheron est bien
anti-véhicule.

La progression est régulière : **×2,09 en moyenne d'un cran au suivant**, sur les neuf pas
mesurables. C'est ce ratio qui sert à reconstruire les quatre premiers coûts.

### Modules offensifs

| Unité | Module | Effet | Coût de montée |
|---|---|---|---|
| Fusiliers | **Fumigène** | neutralise temporairement les tirs d'une **structure** | 5 M / 10 M |
| Éclaireur | **Transport** | emmène une escouade jusqu'à la base ennemie | 30 M / 60 M |
| Épervier | **Transport** | idem, par largage | 270 M / 540 M |
| Pionnier | **Flashbang** | neutralise temporairement une **infanterie** | 40 M / 80 M |
| Grenadiers | **Tir de barrage** | dégâts de zone autour de la cible | — |
| Chasseur | **Munition spéciale** | dégâts accrus contre les véhicules | — |
| Foudre | **Nanotech** | réduit le temps de réparation après combat | — |
| Cuirassiers | **Charge** | vitesse accrue quand l'unité est blessée | — |
| Sapeurs | **Charge** | idem | — |
| Milan | **EMP** | neutralise temporairement un **véhicule** | — |
| Obusier | **Tir de barrage** | dégâts de zone | — |
| Voltigeurs | **Lunette** | dégâts accrus contre l'infanterie | — |
| Percheron | **Bélier** | traverse les murs | — |
| Albatros | **Bouclier** | protège les unités au sol proches | — |

⚠ **Fumigène et Flashbang sont deux modules différents**, et notre classeur les confond sous le
seul nom de « fumigène ». Le premier neutralise une **structure**, le second une **infanterie**.
Il faut deux noms.

Le coût de montée du Transport de l'Épervier — 270 M — vaut **neuf fois** celui du même module
sur l'Éclaireur. Le module n'a donc pas un prix propre : il est indexé sur le châssis qui le
porte.

### Onglet DÉFENSE — 13 recherches, plus 2 gratuites

| # | TA | Foyer Zéro | Rôle défensif | Coût |
|---|---|---|---|---|
| — | Wall | **Merlon** | mur, bloque | gratuit |
| — | MG Nest | **Casemate** | tourelle anti-infanterie | gratuit |
| 1 | Predator | **Chasseur** | anti-véhicule mobile | 55 k / 135 k |
| 2 | Missile Squad | **Grenadiers** | **anti-aérien** mobile | 70 k / 170 k |
| 3 | Anti-Tank Barrier | **Herse** | barrière anti-véhicule | 80 k / 200 k |
| 4 | Guardian | **Éclaireur** | anti-infanterie mobile | 100 k / 250 k |
| 5 | Guardian Cannon | **Créneau** | tourelle anti-véhicule | 125 k / 320 k |
| 6 | Pitbull | **Pionnier** | **anti-aérien** mobile | 380 k / 940 k |
| 7 | Barbwire | **Ronce** | barrière anti-infanterie | 920 k / 2,2 M |
| 8 | Sniper Team | **Voltigeurs** | anti-infanterie longue portée | 2,6 M / 6,2 M |
| 9 | Flak | **Batterie** | tourelle anti-aérienne | 5,4 M / 12,3 M |
| 10 | Zone Trooper | **Cuirassiers** | anti-véhicule mobile | 9,5 M / 21 M |
| 11 | Watchtower | **Faucheuse** | artillerie anti-infanterie, portée mini | 24 M / 48 M |
| 12 | Titan Artillery | **Mortier** | artillerie anti-véhicule, portée mini | 50 M / 120 M |
| 13 | SAM Site | **Harpon** | artillerie anti-aérienne, portée mini | 125 M / 300 M |

**La règle de bascule est confirmée par le jeu lui-même** : le Missile Squad, *send to attack
structures* en offense, devient *mobile anti-air infantry* en défense. Le Pitbull, anti-structure
en offense, devient *mobile, fast anti-air vehicle*. Anti-structure ⇄ anti-aérien, sans exception.

Progression plus douce que l'offense : **×1,90 par cran**. Mais le sommet est plus haut — le
Harpon coûte 2,5 fois l'Albatros. La défense est moins chère à ouvrir et plus chère à compléter.

**Modules défensifs :** Herse et Ronce → *Drones de réparation*. Créneau → *Garnison*. Faucheuse,
Mortier et Harpon → *SR Arms*, qui réduit la portée minimale. Batterie → *Missiles guidés*. Les
unités mobiles gardent le module de leur version offensive, sauf les Cuirassiers qui passent de
*Charge* à *EMP*.

### Onglet SPÉCIAL — 4 recherches

| TA | Rôle | Coût |
|---|---|---|
| MCV | fonder une **deuxième base** | 1,8 M / 1,4 M |
| MCV additionnel | base suivante | 2 T / 1,2 T |
| Ion Cannon Support | soutien anti-véhicule, défend les bases alliées en alerte | 150 k / 380 k |
| Falcon Support | soutien anti-aérien | 460 k / 1,13 M |
| Skystrike Support | soutien anti-infanterie | ⟨190 k / 480 k⟩ |

Deux anomalies utiles :

- **Le MCV est la seule recherche où les points de recherche coûtent moins que les crédits.**
- **Le saut entre la deuxième base et la troisième est de 1,4 M à 1,2 T**, soit presque un
  million de fois. Ce n'est pas une progression, c'est **une porte fermée**. TA autorise une
  deuxième base facilement et rend la troisième pratiquement inaccessible.

---

## 2. Coûts reconstruits

Les quatre premières unités offensives sont déjà acquises au moment de la capture. En remontant
la progression mesurée (×2,09) depuis les Grenadiers à 80 k :

| Unité | Crédits ⟨estimé⟩ | Recherche ⟨estimé⟩ |
|---|---|---|
| Fusiliers | 4 k | 10 k |
| Éclaireur | 9 k | 22 k |
| Épervier | 18 k | 45 k |
| Pionnier | 38 k | 95 k |

Le Skystrike Support est estimé par interpolation entre l'Ion Cannon (150 k) et le Falcon
(460 k), en suivant la hiérarchie de rayon donnée par la source — infanterie 12, aviation 10,
véhicule 8.

**Coûts d'acquisition des modules : introuvables.** Les quatre valeurs visibles sont des montées
de niveau. Faute de mieux, la règle proposée est **acquisition d'un module = 2 × le coût de son
unité**, ce qui reste à vérifier.

---

## 3. Transposition Foyer Zéro

### 3.1 Une seule monnaie

Les crédits étant supprimés, **la recherche ne coûte que des points de recherche**. La colonne
crédits disparaît.

Alternative si l'on veut conserver une tension à deux ressources : faire payer la recherche en
points **et** en scorie. À trancher.

### 3.2 Le problème du ×2, chiffré

Avec le barème dicté — 10 à 60 points par défense de niveau 1, **doublés à chaque niveau** — et
les proportions de garnison déjà remplies :

| Niveau du site | Valeur moyenne d'une défense | Défenses | **Récolte par raid** |
|---|---|---|---|
| 10 | 5 500 | 10 | 55 000 |
| 20 | 9,2 M | 24 | **221 M** |
| 30 | 11,6 G | 31 | **360 G** |

L'arbre complet de TA coûte de l'ordre du milliard de points. **Il serait donc intégralement
acheté avant le niveau 22, en deux ou trois raids.** Le reste de la partie n'aurait plus aucun
sink.

Avec un rendement en **×1,32** — la constante de tout le reste du jeu :

| Niveau du site | Récolte par raid |
|---|---|
| 10 | 1 150 |
| 20 | 73 500 |
| 30 | 1,5 M |
| 40 | 23 M |
| 50 | 310 M |

La courbe devient exploitable : l'arbre se paie progressivement et se termine vers le niveau 45.

**Recommandation : ramener le rendement à ×1,32.** Le jeu se comporte à l'identique, avec une
constante de moins et un arbre qui garde sa fonction du début à la fin.

### 3.3 Arbre offensif proposé

Points de recherche seuls. Progression **×2,4**, calée pour qu'une unité coûte environ dix raids
au niveau où elle devient pertinente.

| Unité | Niveau visé | Coût ⟨proposé⟩ |
|---|---|---|
| Fusiliers | 0 | gratuit |
| Éclaireur | 2 | 700 |
| Épervier | 4 | 1 700 |
| Pionnier | 6 | 4 000 |
| Grenadiers | 8 | 10 000 |
| Chasseur | 11 | 24 000 |
| Foudre | 14 | 55 000 |
| Cuirassiers | 17 | 130 000 |
| Sapeurs | 21 | 320 000 |
| Milan | 25 | 750 000 |
| Obusier | 29 | 1,8 M |
| Voltigeurs | 34 | 4,3 M |
| Percheron | 39 | 10 M |
| Albatros | 44 | 25 M |

Total ≈ **42 M**.

### 3.4 Arbre défensif proposé

Progression **×2,3**, départ plus bas, sommet plus haut — comme dans TA.

| Structure ou unité | Coût ⟨proposé⟩ |
|---|---|
| Merlon | gratuit |
| Casemate | gratuit |
| Chasseur (défense) | 400 |
| Grenadiers (défense) | 900 |
| Herse | 2 100 |
| Éclaireur (défense) | 4 800 |
| Créneau | 11 000 |
| Pionnier (défense) | 25 000 |
| Ronce | 58 000 |
| Voltigeurs (défense) | 135 000 |
| Batterie | 310 000 |
| Cuirassiers (défense) | 700 000 |
| Faucheuse | 1,6 M |
| Mortier | 3,7 M |
| Harpon | 8,5 M |

Total ≈ **15 M**.

⚠ **Contrainte dure** : l'aviation ennemie culmine à **40 % au niveau 25**. La Batterie et les
Grenadiers défensifs doivent donc être accessibles **avant** ce niveau. Dans le tableau ci-dessus,
la Batterie coûte 310 000 points, ce qui correspond à une récolte de niveau 25 environ. **C'est
trop tard.** Il faut soit avancer la Batterie dans l'ordre, soit lisser le pic d'aviation.

### 3.5 Onglet spécial

| Recherche | Coût ⟨proposé⟩ |
|---|---|
| Deuxième base | 500 000 |
| Troisième base | 50 M |
| Quatrième base | 5 G |
| Soutien anti-infanterie | 40 000 |
| Soutien anti-aérien | 90 000 |
| Soutien anti-véhicule | 200 000 |

La progression des bases reprend la logique de TA — chaque base suivante coûte cent fois la
précédente — mais en moins brutal, puisque les bases multiples sont ici un vrai levier de
progression : c'est le déplacement qui ouvre le farm.

---

## 4. Questions ouvertes

| # | Point |
|---|---|
| 1 | **Les modules ont-ils des niveaux**, comme dans TA, ou sont-ils un déblocage unique ? Un système de niveaux double la taille de l'arbre |
| 2 | Le coût d'acquisition d'un module est-il indexé sur son unité ? Le Transport de l'Épervier coûte neuf fois celui de l'Éclaireur |
| 3 | Fumigène et Flashbang sont **deux modules distincts** — il faut deux noms dans le classeur |
| 4 | La recherche coûte-t-elle uniquement des points, ou aussi de la scorie ? |
| 5 | La Batterie doit être accessible avant le niveau 25 — réordonner l'arbre, ou lisser le pic d'aviation |
| 6 | Combien de bases au total sur une run ? Le coût de la troisième et de la quatrième en dépend |

---

## 5. Deux données actées au passage

**Budget d'armée de l'Ouvrage**, corrigé :

| Niveau | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 |
|---|---|---|---|---|---|---|---|---|---|
| Points | 30 | 70 | 105 | 140 | 170 | 200 | 225 | 250 | 250 |

Plateau à 250 dès le niveau 45. Le joueur, à `20 + 5 × niveau`, atteint 270 au niveau 50 : il
garde une marge d'un cran sur l'Ouvrage tout du long.

**Base du joueur rasée.** L'Ouvrage peut détruire le Chantier de construction et raser une base.
Le joueur doit alors **se redéployer 20 cases vers le bas**, tout réparer, et perd les ressources
stockées dans la base rasée. Vingt cases représentent quatre niveaux de progression : la
sanction est lourde mais rattrapable, et elle donne un sens défensif au Centre de commandement,
première cible de l'IA.
