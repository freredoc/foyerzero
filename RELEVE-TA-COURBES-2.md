# Relevé TA — courbes et arsenal

> Source : captures directes de l'Arsenal du jeu d'origine, session du 24/08/2026.
> Toutes les valeurs sont lues à l'écran, jamais interpolées. Les lois sont ajustées sur
> ces valeurs et l'écart résiduel est indiqué à chaque fois.
>
> Remplace `COURBE-DE-NIVEAU.md` §2 et complète `MODELE-REPARATION.md` §3.
>
> **Note de lecture :** le client français nomme « Points » le champ que le client anglais
> nomme « Hitpoints ». Ce sont les **points de vie**. Toute lecture antérieure de ce champ
> comme un score de classement est erronée.

---

## 0. Les cinq lois

| grandeur | facteur par niveau | régime | qualité |
|---|---|---|---|
| Points de vie (unités) | **×1,10** | unique, 1→50 | 0,02 % sur 9 niveaux |
| Dégâts | ×1,10 puis amorti vers **×1,086** | rupture au 11 | 0,9 % |
| Temps de réparation (niveau d'unité) | **×1,15** | unique | 0,3 % |
| Temps de réparation (niveau du bâtiment) | ÷1,09 puis **÷1,12** | rupture au 12 | 0,02 % |
| Coût d'amélioration — bâtiments **et** unités | **×1,32** | rampe puis régime, rupture au 11 | 0,04 % sur 38 niveaux |

Le butin, mesuré séparément, monte lui aussi de ×1,32 : **le nombre de raids par niveau
est constant**, et l'économie de ressources est neutre par construction.

**Quatre systèmes indépendants changent de régime au niveau 11** — dégâts, diviseur de
réparation, coût des bâtiments, coût des unités. C'est une frontière du moteur, pas une
propriété d'un système. Tout ce qui précède relève de l'accueil du joueur et ne se
modélise pas : passer la Caserne de 1 à 2 coûte 5 unités de tibérium là où la courbe
extrapolée en réclamerait 8 966.

---

## 1. Points de vie

```
PV(L) = PV_base × 1,10^(L−1)
```

Vérifié sur l'Escadron de tireurs aux niveaux 1, 8, 11, 12, 13, 20, 30, 40 et 50 : écart
maximal 0,02 %. **Aucune rupture au niveau 11**, contrairement aux dégâts.

⚠ **Réserve sur les structures défensives.** Le Barbwire affiche 1 000 PV au niveau 1 mais
85 076,55 au niveau 56 — ce qui correspond à une base de 450, pas 1 000. Ni la courbe de
PV ni celle des dégâts ne relient les deux (la seconde passe à 5,5 % près, trop pour du
bruit). **Les défenses suivent probablement une autre loi de PV.** Une mesure du Barbwire
à un niveau intermédiaire (30 par exemple) tranche.

---

## 2. Dégâts

### 2.1 Table de multiplicateurs — universelle

Vérifiée sur deux unités aux profils opposés (Escadron de tireurs, Escadron
lance-missiles). Écart de 0,02 % au niveau 30 sur les trois colonnes non nulles.
**Un seul point de mesure par entité suffit à reconstruire toute sa courbe.**

| niveau | 1 | 8 | 11 | 12 | 13 | 20 | 30 | 40 | 50 |
|---|---|---|---|---|---|---|---|---|---|
| × base | 1,0000 | 1,9500 | 2,5955 | 2,6832 | 2,7912 | 4,4017 | 9,2009 | 20,9841 | 48,0227 |

### 2.2 Forme analytique

- **Niveaux 1 à 11** : `dégâts = base × 1,10^(L−1)`, exact à 0,07 %.
- **Niveaux 13 à 50** : `dégâts ≈ 10 376 × 1,1^L / L^0,504` avec la base du tireur.
  L'exposant ajusté vaut 0,504 — un demi à 1 % près. Écart maximal 0,88 %.
- Le niveau 12 est transitoire et n'entre proprement dans aucun des deux.

Le taux par niveau monte de 1,034 (11→12) à 1,086 et s'y stabilise. Le résidu oscille en
signe, ce qui suggère une table interne plutôt qu'une formule fermée — sans conséquence
sous 1 %.

### 2.3 Portée, vitesse et munitions ne varient jamais avec le niveau

Constantes sur les neuf niveaux mesurés. C'est acquis : **notre modèle a raison de les
figer**, et le plancher de réserve de munitions à 10 % tient.

---

## 3. La bascule anti-structure / anti-aérien — règle validée

**La règle de Foyer Zéro est celle du moteur d'origine.** La même unité, consultée en
onglet Attaque puis en onglet Défense, porte les mêmes valeurs à une case près : la
quatrième bascule de la colonne bâtiment vers la colonne aviation.

Escadron lance-missiles, niveau 1 :

| mode | inf | véh | air | bât | vitesse |
|---|---|---|---|---|---|
| Attaque (« Section anti-structures ») | 800 | 1 920 | **0** | **4 000** | 60 |
| Défense (« Infanterie mobile antiaérienne ») | 800 | 1 920 | **4 000** | **0** | 40 |

**Aucune quatrième colonne n'est nécessaire.** Le modèle à trois colonnes est correct tel
quel, la Meute garde ses 1 · 0,20 · 0,30.

**La vitesse passe en ×2/3 en défense.** Vérifié sur deux points : 60 → 40 et 120 → 80.
Transformation fixe, pas une donnée par unité.

---

## 4. Réparation

```
T(L, C) = base_unité × 1,15^(L−1) / D(C)
D(C)    = 1,09^(min(C,12)−1) × 1,12^max(C−12, 0)
```

`L` = niveau de l'unité, `C` = niveau du bâtiment producteur. Restitue les sept points de
la série Caserne à 0,02 % et les niveaux 30/40/50 à 0,1 %. L'écart monte à 3 % sous le
niveau 13, où l'affichage tronque à la seconde.

**La base dépend de l'unité** — six valeurs distinctes au bâtiment niveau 1 : 441 s
(Rifleman, Missile, Zone Troopers), 882 s (Sniper, Commando), 972 s (Pitbull, Predator,
Guardian), 1 458 s (Mammoth, Juggernaut), 1 070 s (Orca, Paladin, Firehawk), 1 605 s
(Kodiak). Elle n'est pas proportionnelle aux PV.

Série Caserne mesurée, unité figée au niveau 30 :

| Caserne | 1 | 5 | 10 | 20 | 30 | 40 | 50 |
|---|---|---|---|---|---|---|---|
| secondes | 25 483 | 18 053 | 11 732 | 3 988 | 1 284 | 413 | 133 |

Le bâtiment producteur n'agit **que** sur la vitesse de réparation. Il ne monte pas le
niveau des unités, qui s'achètent séparément et en parallèle.

---

## 5. Économie

`coût(n → n+1) = base × 1,32^(n−11)` pour n ≥ 11, sur les bâtiments comme sur les unités.

| entité | monnaie | coût au palier 11 | vérification |
|---|---|---|---|
| Caserne | tibérium | 144 000 | ×1,32000 de 11 à 47, ×1,31998 de 47 à 50 |
| Exosoldat | cristaux | 96 000 | ×1,32 sur 11→15 et 45→50 ; pont 11→45 à 0,018 % |

L'électricité vaut systématiquement **le quart** de la monnaie principale. Bâtiments payés
en tibérium, unités en cristaux. La marche de rupture est unique et nette : de 10 à 11 le
coût d'une unité fait ×1,794, puis ×1,32 jusqu'au bout.

**Le levier stratégique est la montée en parallèle.** Chaque unité se monte séparément au
même coefficient : monter treize unités coûte treize fois plus par niveau que d'en monter
trois. Un joueur spécialisé progresse **4,3 fois plus vite**. Il n'y a pas d'arbre de
compétences — il y a un budget et treize files d'attente.

---

## 6. Arsenal GDI au niveau 1

Bâtiment producteur au niveau 1. `parc.` = dégâts de parcours (écrasement).

### 6.1 Infanterie — Caserne

| unité | PV | inf | véh | air | bât | parc. | portée | vit. | mun. | répar. |
|---|---|---|---|---|---|---|---|---|---|---|
| Rifleman Squad | 700 | 3 520 | 1 760 | 0 | 1 120 | 0 | 1,5 | 60 | 700 | 7:21 |
| Missile Squad | 700 | 800 | 1 920 | 0 | 4 000 | 0 | 1,5 | 60 | 2 500 | 7:21 |
| Sniper Team | 500 | 4 800 | 800 | 0 | 640 | 0 | 2,5 | 60 | 400 | 14:42 |
| Zone Troopers | 800 | 640 | 5 600 | 0 | 960 | 0 | 1,5 | 60 | 600 | 7:21 |
| Commando | 900 | 1 280 | 640 | 0 | 8 000 | 0 | 1,5 | 60 | 5 000 | 14:42 |

### 6.2 Véhicules — Usine

| unité | PV | inf | véh | air | bât | parc. | portée | vit. | mun. | répar. |
|---|---|---|---|---|---|---|---|---|---|---|
| Pitbull | 800 | 1 120 | 1 920 | 0 | 4 000 | 1 120 | 2,5 | 120 | 2 500 | 16:12 |
| Predator | 1 000 | 960 | 3 680 | 0 | 1 600 | 3 680 | 2,5 | 90 | 1 000 | 16:12 |
| Guardian | 1 000 | 5 120 | 1 920 | 0 | 2 400 | 5 120 | 1,5 | 120 | 800 | 16:12 |
| Mammoth | 2 000 | 2 400 | 4 480 | 0 | 2 880 | 4 000 | 2,5 | 90 | 1 800 | 24:18 |
| Juggernaut | 1 300 | 800 | 1 600 | 0 | 8 000 | 6 400 | 2,5 | 60 | 5 000 | 24:18 |

**Les dégâts de parcours sont une propriété des véhicules**, non des barrières. Infanterie
et aviation sont à zéro. C'est l'écrasement, pas le franchissement.

### 6.3 Aviation — Aérodrome

| unité | PV | inf | véh | air | bât | parc. | portée | vit. | mun. | répar. |
|---|---|---|---|---|---|---|---|---|---|---|
| Orca | 900 | 5 760 | 2 880 | 0 | 1 920 | 0 | 1,5 | 120 | 1 200 | 17:50 |
| Paladin | 1 050 | 640 | 3 200 | 0 | 1 920 | 0 | 2,5 | 120 | 1 200 | 17:50 |
| Kodiak | 1 800 | 1 600 | 2 400 | 0 | 6 400 | 0 | 2,5 | 120 | 4 000 | 26:45 |
| Firehawk | 550 | 0 | 0 | 0 | **48 000** | 0 | 1,5 | **240** | 4 500 | 17:50 |

Le Firehawk est un cas extrême : anti-structure pur, deux fois plus rapide que tout le
reste, le plus fragile de l'aviation. C'est le « traverser » à l'état pur.

### 6.4 Défenses

| structure | PV | inf | véh | air | bât | portée | portée min | blindage |
|---|---|---|---|---|---|---|---|---|
| Guardian Cannon | 1 250 | 1 600 | 5 600 | 0 | 0 | 2,5 | — | structure |
| MG Nest | 1 000 | 3 200 | 1 120 | 1 280 | 0 | 2,5 | — | **infanterie** |
| Flak | 1 000 | 0 | 0 | 6 400 | 0 | 2,5 | — | structure |
| Titan Artillery | 700 | 320 | 1 920 | 0 | 0 | 5,5 | **3,5** | **véhicule** |
| Watchtower | 600 | 1 600 | 320 | 160 | 0 | 5,5 | **3,5** | **véhicule** |
| SAM Site | 650 | 0 | 0 | 2 560 | 0 | 5,5 | **3,5** | **véhicule** |
| Barbwire | 1 000 | 0 | 0 | 0 | 0 | statique | — | structure |
| Anti-tank barrier | 1 500 | 0 | 0 | 0 | 0 | statique | — | structure |
| Wall | 2 000 | 0 | 0 | 0 | 0 | statique | — | structure |

Deux mécaniques absentes de notre modèle :

- **Portée minimale.** Les trois artilleries ont une zone morte entre 0 et 3,5, et ne
  tirent qu'entre 3,5 et 5,5. Elles sont sans défense au contact.
- **Trois classes de blindage chez les défenses**, pas une seule.

Les trois barrières affichent zéro partout malgré des descriptions qui mentionnent des
dégâts de contact. **La valeur existe mais n'est exposée nulle part** : le ÷8 de la Ronce
et les 15 PV/tick de la Herse restent des choix de design, mesurables sur notre propre
moteur au lot 2A.

### 6.5 Bâtiments de base

| bâtiment | PV | répar. | particularité |
|---|---|---|---|
| Construction Yard | 5 500 | 1:28 | stockage 50 tib/cristal + 40 énergie, 4 emplacements |
| Barracks / Factory / Airfield | 2 500 | 1:28 | accès aux unités, accélère leur réparation |
| Command Center | 3 000 | 1:28 | **10 points d'armée**, plafonne le niveau des unités |
| Defense HQ | 3 000 | 1:28 | **20 points de défense**, plafonne le niveau des défenses |
| Defense Facility | 2 500 | 1:28 | **répare 70 % des PV perdus lors de la dernière attaque** |
| Power Plant | 2 000 | 1:05 | 2 énergie / minute par paquet |
| Harvester | 1 500 | 1:05 | 4 ressources / minute par paquet |
| Silo | 1 000 | 0:42 | stockage 20 tibérium/cristal |
| Accumulator | 1 000 | 0:42 | stockage 15 énergie |

Non capturés : Refinery, MCV, et les PV des trois bâtiments de soutien.

Les **deux budgets séparés** — points d'armée au Command Center, points de défense au
Defense HQ — sont la structure que nous appelons points de commande. Et les **70 % du
Defense Facility** sont le coefficient 0,7 de nos notes, retrouvé à la source.

### 6.6 Bâtiments de soutien

Artillerie de zone qui appuie automatiquement toutes les bases alliées en alerte dans son
rayon. Un seul par base. Barème de dégâts sur une échelle sans rapport avec celle des
unités, et divisé par le nombre de cibles :

| soutien | rayon | calibrage | vs 1 | vs 2 | vs 3 |
|---|---|---|---|---|---|
| Skystrike | 8 | 30 s + 40 s/case | 5 · 3 · 3 | 2,5 · 1,5 · 1,5 | 1,7 · 1 · 1 |
| Falcon | 10 | 60 s + 40 s/case | 0 · 0 · 8 | 0 · 0 · 4 | 0 · 0 · 2,7 |
| Ion Cannon | 12 | 120 s + 40 s/case | 4 · 6 · 0 | 2 · 3 · 0 | 1,3 · 2 · 0 |

Le rapport est exactement `base / N`. Plus le rayon est grand, plus le calibrage est long.

---

## 7. Échelle de temps et durée des combats

Aucun panneau ne donne le pas de temps des dégâts. Une observation de combat le fixe :
**deux Sniper Teams de niveau 53, 306 000 de dégâts chacun, tuent un Rifleman Squad de
niveau 53 en ~3 secondes.** Les PV de la cible valant 99 430, les dégâts affichés sont
délivrés en **environ 18,5 secondes** — 20 en arrondissant.

Avec T = 20 s, le temps de mise à mort en miroir (tireur contre tireur) vaut :

| niveau | 1 | 20 | 30 | 40 | 50 |
|---|---|---|---|---|---|
| TTK | 3,98 s | 5,55 s | 6,81 s | 7,87 s | 8,80 s |
| ticks à 10 Hz | 40 | 55 | 68 | 79 | 88 |

Quatre secondes au début, presque neuf à la fin, jamais moins de 40 ticks : lisible sur
toute la plage sans réglage. Que ça atterrisse dans une fenêtre saine sans être forcé est
un argument pour que les 20 secondes soient la vraie valeur.

**Pour Foyer Zéro, T est un paramètre libre.** Les PV et les dégâts se lisent dans la même
table ; seule leur conversion en secondes est à notre main, et un seul nombre global la
fixe pour toutes les unités.

Décodage d'échelle annexe : la capacité « Grenade fumigène » affiche une portée de 150
quand l'unité affiche 1,5 — facteur 100 entre l'affichage joueur et l'unité moteur.

---

## 8. Ce qui reste fermé sans mesure

**Dégâts de franchissement des barrières.** Non exposés (§6.4).

**Onglet Optimisation.** Déblocages de capacités payés une fois en recherche (Grenade
fumigène : 5 M + 10 M), pas des coûts d'amélioration. Sans structure à extraire.

---

## 9. Suites pour Foyer Zéro

1. **Rien à arbitrer sur la bascule sol/air** : la règle existante est celle du moteur
   d'origine. Penser à porter la vitesse en ×2/3 en défense.
2. **MG Nest en structure** — décision prise. Conséquence : ce sont les unités
   anti-structure (Commando, lance-missiles, Firehawk) qui le contrent, plus les
   anti-infanterie.
3. **Trancher la montée en parallèle** : reprend-on les treize files d'attente de
   l'original, ou une progression à voie unique ? Le roster actuel supporte les deux.
4. **Décider si l'on reprend la portée minimale** des artilleries. C'est une vraie
   mécanique tactique — une zone morte au contact — et notre modèle n'a rien d'équivalent.
5. **Reporter les coefficients** dans `FOYER-ZERO-CALIBRAGE.xlsx` : la table du §2.1
   remplace toute courbe devinée, les tables du §6 remplacent tout profil estimé.
6. **Une mesure restante** : le Barbwire à un niveau intermédiaire, pour fermer la loi de
   PV des structures défensives (§1).
