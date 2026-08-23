# Relevé d'arsenal — *Tiberium Alliances* (GDI joueur / Forgotten IA)

Source unique : les six pages « Arsenals » de CNCNZ.com, relevées le 22/08/2026.

- `cncnz.com/games/tiberium-alliances/gdi-offensive-units/`
- `cncnz.com/games/tiberium-alliances/gdi-defenses/`
- `cncnz.com/games/tiberium-alliances/gdi-base-structures/`
- `cncnz.com/games/tiberium-alliances/the-forgotten-offensive-units/`
- `cncnz.com/games/tiberium-alliances/the-forgotten-defenses/`
- `cncnz.com/games/tiberium-alliances/the-forgotten-base-structures/`

**Statut : relevé, pas conception.** Aucune valeur n'est transposée dans Foyer Zéro à ce
stade. Les rôles sont reformulés en tags courts ; les points d'armée et les prérequis sont
recopiés tels quels.

**Ce que la source ne donne pas :** aucun PV, aucun dégât, aucune portée en cases, aucune
vitesse, aucun coût en ressources. Le trou « stats d'unités » reste entier après ce relevé.

**Le côté Nod n'a pas été relevé** : le jeu est GDI (joueur) contre Forgotten (IA).

---

## 1. Correction sur le déblocage

Les pages listent des prérequis en **niveau de bâtiment producteur**. Ethan corrige, et il a
raison : ce n'est **pas** le verrou réel. Sur la première base on atteint le niveau 10 en
quelques heures, et l'Aérodrome tourne autour du niveau 30 au moment où le Kodiak devient
pertinent. Le vrai verrou est la **recherche**, payée en points de recherche et en crédits.

Les prérequis relevés ci-dessous sont donc à lire comme un **plancher d'ordre**, pas comme un
coût : ils donnent la séquence voulue par les concepteurs, presque jamais le blocage ressenti.

C'est cohérent avec la description générale du jeu : les points de recherche servent à
débloquer les unités, et les crédits (produits par la Raffinerie) servent à les acheter en
combinaison avec la recherche.

---

## 2. Le fait central : le rôle dépend du côté

**Une même unité n'a pas le même rôle en attaque et en défense.** Six unités GDI sont
utilisées des deux côtés, avec une ligne de ciblage différente — et parfois un module
différent.

| Unité | En attaque | En défense |
|---|---|---|
| **Missile Squad** (inf) | anti-véhicule | **anti-aérien** principal, anti-véhicule secondaire ; se déplace latéralement pour intercepter |
| **Zone Troopers** (inf) | anti-véhicule blindé, ouvre les défenses | anti-véhicule **et** anti-infanterie, à poster derrière les murs |
| **Sniper Team** (inf) | anti-infanterie longue portée, reste en retrait | identique : anti-infanterie longue portée |
| **Guardian** (véh) | anti-infanterie rapide | nid de mitrailleuse **mobile** : anti-infanterie + un peu d'anti-aérien |
| **Pitbull** (véh) | anti-véhicule **et anti-structure** (ouvre les murs) | **anti-aérien** mobile + anti-véhicule ; patrouille la ligne |
| **Predator** (véh) | anti-véhicule et anti-structure, à envoyer en dernier | anti-véhicule, fait des allers-retours sur la ligne |

Deux conséquences structurelles :

1. **Le roster défensif est un sous-ensemble du roster offensif.** Aucune unité n'existe
   uniquement en défense. Douze unités offensives ne servent qu'à l'attaque ; six servent aux
   deux, avec un rôle réécrit.
2. **Le module change aussi de côté.** Le Zone Trooper offensif prend *Charge* (vitesse accrue
   quand il est blessé) ; le défensif prend un EMP qui neutralise un véhicule. Le Transport du
   Guardian offensif dépose un fantassin en première rangée ennemie ; en défense, il en abrite
   un jusqu'à destruction, et l'occupant ne tire pas.

**Aucune aviation en défense, des deux côtés.** Ni GDI ni Forgotten n'alignent d'appareil dans
une base défendue. L'aviation est purement offensive dans TA.

---

## 3. GDI — offensif (14 unités)

Points d'armée sur trois paliers : **5 / 10 / 15**.

### Infanterie (5)

| Unité | Pts | Prérequis | Rôle | Module |
|---|---|---|---|---|
| Rifleman Squad | 5 | Barracks 1 | anti-infanterie de base | Smoke Grenade — neutralise temporairement une structure défensive ; effet réduit si la cible est de niveau supérieur |
| Missile Squad | 5 | Barracks 3 | anti-véhicule de base, fragile face à l'infanterie | Missile Storm — dégâts de zone, rayon 1,5 autour de la cible |
| Zone Troopers | 5 | Barracks 7 | anti-véhicule blindé, ouvre les défenses | Charge — vitesse accrue quand blessé, interrompue par une cible principale ou un obstacle, puis reprise |
| Commando | 10 | Barracks 9 | anti-structure, résistant, s'infiltre | Charge |
| Sniper Team | 10 | Barracks 12 | anti-infanterie longue portée, lent, cher | Laser Scope — précision et dégâts accrus contre l'infanterie |

### Véhicules (5)

| Unité | Pts | Prérequis | Rôle | Module |
|---|---|---|---|---|
| Guardian | 10 | Factory 1 | anti-infanterie rapide, peu blindé | Transport — emmène un fantassin jusqu'à la première rangée ennemie, relâché sain et sauf si le porteur meurt |
| Pitbull | 10 | Factory 3 | anti-véhicule + anti-structure, franchit les murs | Flashbang — neutralise temporairement une unité d'infanterie |
| Predator Tank | 10 | Factory 5 | anti-véhicule + anti-structure, lent, à envoyer en dernier | HEAT-MP-T — change le type de munition, dégâts indexés sur le niveau |
| Juggernaut | 15 | Factory 7 | artillerie anti-structure, à garder à l'arrière | Barrage — dégâts de zone, rayon 1,5 |
| Mammoth Tank | 15 | Factory 10 | **anti-tout** | Battering Ram — écrase les murs traversés |

### Aviation (4)

| Unité | Pts | Prérequis | Rôle | Module |
|---|---|---|---|---|
| Paladin | 10 | Airfield 1 | anti-véhicule volant, survole, frappe l'arrière de base | Transport — un fantassin de 5 points max jusqu'à la première rangée |
| Firehawk | 10 | Airfield 5 | bombardier anti-structure | Nano Tech — réparation moins chère et 25 % de temps en moins |
| Orca | 10 | Airfield 7 | anti-infanterie volant, rapide | EMP — neutralise temporairement un véhicule |
| Kodiak | 15 | Airfield 10 | **anti-tout**, l'unité la plus forte | Aegis Aura — bouclier de zone rayon 2,5 jusqu'à épuisement |

> **À noter.** TA casse sa propre matrice au sommet : Mammoth et Kodiak sont explicitement
> anti-tout. La récompense de fin de progression est de **ne plus avoir à jouer la matrice**.

---

## 4. GDI — défensif

### Unités défensives (6, toutes empruntées à l'offensif)

| Unité | Pts | Prérequis | Rôle défensif | Module |
|---|---|---|---|---|
| Predator Tank | 10 | Defense Facility 3 | anti-véhicule, mobile sur la ligne | HEAT-MP-T |
| Missile Squad | 5 | Defense Facility 4 | anti-aérien principal + anti-véhicule ; se déplace latéralement | Missile Storm |
| Guardian | 10 | Defense Facility 6 | anti-infanterie mobile + un peu d'anti-aérien | Transport (abrite, l'occupant ne tire pas) |
| Sniper Team | 10 | Defense Facility 9 | anti-infanterie longue portée | Laser Scope |
| Zone Troopers | 5 | Defense Facility 10 | anti-véhicule + anti-infanterie | EMP |
| Pitbull | 10 | Defense Facility 10 | anti-aérien mobile + anti-véhicule | Flashbang |

### Structures défensives (9)

Échelle de points **différente de l'offensif** : 0 / 3 / 10 / 15 / **30**.

| Structure | Pts | Prérequis | Rôle | Module |
|---|---|---|---|---|
| Wall | 0 | aucun | bloque, ne tire pas ; les unités tirent depuis derrière | — |
| MG Nest | 0 | aucun | anti-infanterie de base, **touche aussi l'aviation** | — |
| Anti-Tank Barrier | 3 | Defense Facility 5 | **ralentit** les véhicules et les blesse, ne tire pas | Repair Drones — 100 % des PV restaurés après le combat |
| Barbwire | 3 | Defense Facility 8 | ralentit et blesse l'infanterie | Repair Drones |
| Guardian Cannon | 15 | Defense Facility 7 | anti-véhicule ; faible contre l'infanterie, **aveugle au ciel** | Garrison — abrite un fantassin, qui ne tire pas |
| Flak | 10 | Defense Facility 9 | anti-aérien | Guided Missiles — précision et dégâts accrus contre l'aviation |
| Watchtower | 30 | Defense Facility 10 | anti-infanterie lourd, **portée minimale** | SR Arms — réduit la portée minimale |
| Titan Artillery | 30 | Defense Facility 11 | anti-véhicule lourd, **portée minimale** | SR Arms |
| SAM Site | 30 | Defense Facility 12 | anti-aérien lourd, longue portée | SR Arms |

> **Trois défenses lourdes à portée minimale, une par type de cible**, toutes à 30 points, toutes
> corrigeables par le même module. C'est une famille cohérente, pas trois cas particuliers.
>
> **Deux barrières distinctes** : une anti-véhicule, une anti-infanterie. Toutes deux ralentissent
> **et** blessent. Notre Herse ne couvre que la moitié de cette paire.

### Structures de soutien (3, une seule par base)

| Structure | Cible | Rayon |
|---|---|---|
| Skystrike Support | infanterie | 12 |
| Falcon Support | aviation | 10 |
| Ion Cannon Support | véhicules | 8 |

Elles se déclenchent quand la base — ou une base alliée dans le rayon — passe en alerte, et
leur effet s'effondre si la cible est d'un niveau supérieur au leur. **Une seule par base.**
Le rayon décroît quand la cible devient plus lourde.

---

## 5. GDI — bâtiments de base (12 + 3 soutiens)

| Bâtiment | Rôle | Adjacence relevée |
|---|---|---|
| **Construction Yard** | emplacements de construction + stockage. **Sa destruction détruit toute la base** et livre les ressources | — |
| **Harvester** | revenu principal, posé sur un gisement, produit jusqu'à saturation du stockage | Silo voisin → gros bonus |
| **Power Plant** | énergie, accumulée dans le temps ; sert à acheter **et** à réparer et monter en niveau | voisin Harvester ou Accumulator → bonus ; voisin Refinery → bonus de crédits |
| **Refinery** | seule source de crédits, qui financent la recherche | voisin Power Plant → revenu accru |
| **Silo** | stockage des deux ressources | voisin Harvester → gros bonus |
| **Accumulator** | stockage **et** bonus de production d'énergie | — |
| **Command Center** | plafond de l'armée offensive | — |
| **Barracks** | produit l'infanterie ; son niveau ouvre des types **et améliore la réparation** de l'infanterie | — |
| **Factory** | idem pour les véhicules | — |
| **Airfield** | idem pour l'aviation | — |
| **Defense HQ** | plafonne le **niveau** des unités et structures défensives ; gère leur réparation | — |
| **Defense Facility** | ouvre les **types** de défenses constructibles + efficacité de réparation défensive | — |

> **Deux bâtiments distincts pour la défense** : l'un plafonne le niveau, l'autre ouvre les
> types. Notre Bastion fusionne les deux rôles.
>
> **La réparation est adossée au bâtiment producteur** : Baraque, Atelier, Aire et Defense
> Facility améliorent chacun la réparation de leur réservoir. C'est exactement le couplage
> « trois producteurs pour trois réservoirs » qu'on avait déduit, et il est confirmé.

---

## 6. Forgotten — offensif (14 unités)

Même découpage que GDI : **5 infanterie / 5 véhicules / 4 aériens**. Aucun point d'armée ni
prérequis publié pour l'IA.

| Unité | Type | Rôle |
|---|---|---|
| Forgotten | infanterie | anti-infanterie de base |
| Rocket Fist | infanterie | anti-véhicule, correctement blindé, **aussi courant que l'infanterie de base** |
| Missile Squad | infanterie | anti-aérien, secondairement anti-véhicule |
| Sniper Team | infanterie | anti-infanterie longue portée |
| Commando | infanterie | anti-structure ; **aucune capacité spéciale**, contrairement à ses homologues joueurs |
| Bowler | véhicule | anti-infanterie **à portée limitée**, fragile |
| Scooper | véhicule | anti-véhicule lourd |
| Scrapbus | véhicule | anti-aérien **exclusif** — incapable de toucher le sol, donc gratuit si on n'amène pas d'avion |
| Mammoth Tank | véhicule | anti-blindé lourd (châssis GDI capturé) |
| Thumper | véhicule | artillerie de fortune, lente, **double munition** du Mammoth, très efficace sur les structures |
| Wasp | aviation | anti-infanterie — **le seul appareil ennemi qui touche l'infanterie** |
| Locust | aviation | anti-véhicule |
| Smoker | aviation | appareil de frappe très rapide, **apparaît uniquement lors des frappes aériennes** |
| Dreadnought | aviation | anti-structure lourd |

---

## 7. Forgotten — défensif (13)

### Unités (8)

| Unité | Type | Rôle défensif |
|---|---|---|
| Forgotten | infanterie | anti-infanterie |
| Missile Squad | infanterie | anti-aérien ; **se repositionne activement** pour tirer |
| Rocket Fist | infanterie | anti-véhicule |
| Sniper Team | infanterie | anti-infanterie longue portée |
| Bowler | véhicule | anti-infanterie, portée courte |
| Scooper | véhicule | anti-véhicule lourd |
| Scrapbus | véhicule | anti-aérien exclusif |
| Mammoth Tank | véhicule | anti-blindé lourd |

Absents de la défense : Commando, Thumper, et **toute l'aviation**.

### Structures (5)

| Structure | Rôle |
|---|---|
| MG Nest | anti-infanterie, servie par de l'infanterie ; se contre au sniper ou au véhicule mitrailleur |
| Flak | tourelle lourde anti-aérienne |
| Demolisher Artillery | artillerie anti-véhicule, **portée minimale** |
| Reaper Artillery | artillerie **anti-infanterie** longue portée — le pendant du Demolisher |
| SAM Site | anti-aérien lourd, efficace même sur les appareils les plus solides |

> Le couple **Demolisher / Reaper** est le miroir exact du couple **Titan Artillery /
> Watchtower** côté joueur. L'artillerie défensive existe en deux lignes de ciblage des deux
> côtés. Notre Mortier n'en couvre qu'une.
>
> Note de confiance moindre (source forum, pas la page d'arsenal) : une **Particle Cannon**
> Forgotten, tourelle anti-aérienne longue portée, existerait uniquement dans la Forteresse.

---

## 8. Forgotten — bâtiments (9), et le butin

**Chaque bâtiment ennemi est un contenant de butin, avec une charge propre.** C'est le point le
plus exploitable de tout le relevé.

| Bâtiment | Ce que sa destruction livre |
|---|---|
| **Construction Yard** | détruit **toute la base**, qui disparaît de la carte, et livre tout ce qu'elle contient |
| **Harvester** | ce qu'il a récolté depuis son gisement |
| **Refinery** | crédits **et** les deux ressources |
| **Silo** | les deux ressources |
| **Tiberium Silo** | ressource A seule |
| **Crystal Silo** | ressource B seule |
| **Defense HQ** | ressources ; **sa présence signale une base plus forte qu'un simple camp** |
| **Defense Facility** | ressources |
| **Trade Center** | crédits — donc directement de la recherche |

Deux mécaniques attachées :

- **Colis de ravitaillement** : certains camps et bases portent un bâtiment marqué d'une icône ;
  le détruire donne un colis au contenu aléatoire. Le Defense HQ des bases Forgotten est un
  porteur fréquent.
- **Le butin est indexé sur le niveau de la base** : détruire une base plus difficile rapporte
  davantage.

Absents de la liste ennemie : **aucune centrale, aucun producteur d'unités, aucun accumulateur**.
L'IA n'a pas d'économie d'énergie et ne fabrique rien — sa base est un dépôt défendu.

Trois niveaux de site sont nommés par la source : **camp**, **avant-poste**, **base**.

---

## 9. Faits transverses

| Fait | Portée |
|---|---|
| Points d'armée offensifs : **5 / 10 / 15** | trois paliers seulement, tous côtés confondus |
| Points de défense : **0 / 3 / 10 / 15 / 30** | échelle distincte ; les trois défenses lourdes valent **le double** de la plus grosse unité offensive |
| **Un module par unité**, réécrit selon le côté | confirme la structure « une unité, un module » |
| Taxonomie des modules | neutralisation temporaire · dégâts de zone r=1,5 · vitesse quand blessé · transport d'un fantassin · changement de munition · réduction du coût de réparation · bouclier de zone r=2,5 · précision accrue · réduction de portée minimale · restauration des PV après combat |
| **Portée minimale** | 3 défenses joueur, 2 défenses ennemies ; toujours corrigeable par un module |
| **Ralentir** est une mécanique à part entière | deux barrières qui ne tirent pas mais blessent et retardent |
| L'aviation survole | c'est ce qui permet d'engager la défense sur deux vagues simultanées |
| Les défenseurs mobiles se repositionnent | latéralement pour l'anti-aérien, en va-et-vient pour l'anti-véhicule |
| Adjacences relevées | Silo↔Harvester · Centrale↔Harvester · Centrale↔Accumulateur · Centrale↔Raffinerie |
| L'énergie sert **aussi** à réparer et à monter en niveau | pas seulement à construire |
| Les crédits achètent la recherche | et proviennent d'un bâtiment dédié, plus du Trade Center ennemi |

---

## 10. Écarts constatés avec nos documents

À arbitrer plus tard — ce relevé ne tranche rien.

| # | Constat | Notre état |
|---|---|---|
| 1 | Roster offensif **5 / 5 / 4** | `SYNTHESE` §3 annonce 5 / 6 / 3 — **erreur à corriger** |
| 2 | Les unités changent de rôle selon le côté | notre roster fixe une spécialité unique par unité |
| 3 | Le roster défensif est un sous-ensemble de l'offensif | nos défenses sont 5 bâtiments dédiés, sans réemploi |
| 4 | Deux barrières : anti-véhicule **et** anti-infanterie | nous n'avons que la Herse (anti-véhicule) |
| 5 | Deux artilleries défensives par camp | nous n'avons que le Mortier (anti-véhicule) |
| 6 | Defense HQ **et** Defense Facility séparés | notre Bastion fusionne niveau et types |
| 7 | Chaque bâtiment ennemi porte un butin propre | notre Nœud est un objectif unique et indifférencié |
| 8 | Les bases ennemies se défendent avec des **unités mobiles** | notre Ouvrage n'aligne que du fixe |
| 9 | L'aviation n'est jamais défensive | non tranché chez nous |
| 10 | Deux unités anti-tout au sommet | interdit par notre principe des cases vides |
| 11 | Échelle de points défensifs distincte, sommet à 30 | non modélisé |
| 12 | 12 bâtiments + 3 soutiens exclusifs | nous en avons 14 sans soutien |

---

*Relevé fidèle. Aucune décision de conception n'y est prise.*
