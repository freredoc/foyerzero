# Annexe — statistiques d'unités

⚠⚠ **PÉRIMÉ DEPUIS LE LOT 4A (24/08). NE PAS CODER À PARTIR DE CE FICHIER.**

Les tables de statistiques ci-dessous — PV, dégâts, portées, vitesses, réserves, et toute la
« matrice d'efficacité » — ont été **remplacées en bloc** par les profils mesurés du §6 de
`RELEVE-TA-COURBES-2.md`, transcrits dans `src/data/combat.js`. Le Fusilier n'a plus 100 PV mais
700 ; **la matrice n'existe plus**, les dégâts sont absolus, un entier par colonne.

Ce qui reste utile ici : la correspondance des noms (Ouvrage / joueur / TA), les châssis, les
spécialités, les comportements aériens, les masses et les points d'armée — que le relevé ne donne
pas. Tout le reste ment. **La seule source de calibrage est `src/data/`.**

---

⚠ **Transcription, pas source.** Ces valeurs proviennent du classeur `FOYER-ZERO-CALIBRAGE-2.xlsx`
rempli par Ethan, qui n'est plus accessible dans la session courante. Elles ont été relevées lors
de l'audit et sont fidèles, mais **le classeur original fait foi** et doit être ajouté au dossier.

Le fichier `GABARIT-CALIBRAGE-vide.xlsx` joint est le gabarit d'origine, non rempli. Il sert de
structure, pas de donnée.

---

## Unités offensives

Cadence **10 tirs/s pour toutes**. DPS = dégâts × 10. Portée minimale nulle partout.

| # | Nom Ouvrage | Châssis | Spécialité | Pts | PV | Dégâts | Portée | Vitesse | Réserve | Masse |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Meute | Escouade | anti-infanterie | 5 | 100 | 8 | 1,5 | 0,5 | 150 | 1 |
| 2 | Perceurs | Escouade | anti-structure | 5 | 100 | 8 | 1,5 | 0,5 | 250 | 1 |
| 3 | Fouisseurs | Escouade | anti-structure | 10 | 150 | 20 | 1,5 | 0,5 | 300 | 1 |
| 4 | Ratisseur | Blindé | anti-infanterie | 10 | 200 | 10 | 1,5 | 1,2 | 150 | 5 |
| 5 | Fendeur | Blindé | anti-véhicule | 10 | 300 | 12 | 2,5 | 1,0 | 200 | 10 |
| 6 | Bélier | Blindé | anti-structure | 10 | 200 | 10 | 2,5 | 1,2 | 250 | 5 |
| 7 | Carapace | Escouade | anti-véhicule | 10 | 150 | 10 | 1,5 | 0,5 | 150 | 1 |
| 8 | Crécelle | Aéronef | anti-infanterie | 10 | 200 | 12 | 1,5 | 1,5 | 150 | 0 |
| 9 | Frappeur | Aéronef | anti-structure | 10 | 150 | 20 | 1,5 | **3,0** | 300 | 0 |
| 10 | Pilon | Blindé | anti-structure | 15 | 400 | 15 | 2,5 | 1,0 | 300 | 20 |
| 11 | Broyeur | Blindé | anti-véhicule | 15 | 500 | 15 | 2,5 | 1,0 | 200 | 20 |
| 12 | Busard | Aéronef | anti-véhicule | 10 | 200 | 10 | 2,5 | 1,5 | 200 | 0 |
| 13 | Enclume | Aéronef | anti-structure | 15 | 300 | 10 | 2,5 | 1,5 | 300 | 0 |
| 14 | Guetteur | Escouade | anti-infanterie | 10 | 100 | 20 | 2,5 | 0,5 | 150 | 1 |

Noms joueur correspondants : Fusiliers, Grenadiers, Sapeurs, Éclaireur, Chasseur, Pionnier,
Cuirassiers, Milan, Foudre, Obusier, Percheron, Épervier, Albatros, Voltigeurs.

### Matrice d'efficacité

Troisième colonne : **structure** en offense, **aviation** en défense.

| # | Nom | vs infanterie | vs véhicule | vs structure / aviation |
|---|---|---|---|---|
| 1 | Meute | **1,0** | 0,2 | 0,3 |
| 2 | Perceurs | 0,2 | 0,5 | **1,0** |
| 3 | Fouisseurs | 0,2 | 0,2 | **1,0** |
| 4 | Ratisseur | **1,0** | 0,3 | 0,4 |
| 5 | Fendeur | 0,3 | **1,0** | 0,4 |
| 6 | Bélier | 0,2 | 0,3 | **1,0** |
| 7 | Carapace | 0,2 | **1,0** | 0,2 |
| 8 | Crécelle | **1,0** | 0,2 | 0,2 |
| 9 | Frappeur | 0,0 | 0,0 | **1,0** |
| 10 | Pilon | 0,3 | 0,3 | **1,0** |
| 11 | Broyeur | 0,3 | **1,0** | 0,4 |
| 12 | Busard | 0,2 | **1,0** | 0,3 |
| 13 | Enclume | 0,3 | 0,3 | **1,0** |
| 14 | Guetteur | **1,0** | 0,1 | 0,1 |

### Comportement aérien

**Traversants** : Crécelle, Frappeur — traversent la carte sans jamais s'arrêter.
**Stoppeurs** : Busard, Enclume — s'arrêtent pour leur cible de prédilection, comme des chars
volants.

---

## Modules

Améliorations **permanentes**, appliquées à toutes les unités du type concerné.

| Module | Effet |
|---|---|
| **Fumigène** | désactive une infanterie 5 s, une fois par raid. Effet −20 % si la cible est de niveau supérieur |
| **EMP** | désactive un véhicule 5 s, une fois par raid. Même pénalité de niveau |
| **Tir de barrage** | 30 % des dégâts sur les structures voisines |
| **Booster** | après avoir été blessée, vitesse ×10 pendant 3 s, une fois par raid |
| **Garnison** | embarque une infanterie, la débarque derrière la ligne ou à la destruction du porteur, sans pénalité |
| **Écraseur** | force les murs — 10 % de dégâts par seconde — et masse ×2 pour l'écrasement |
| **Auto-réparation** | répare 20 % des PV manquants après le raid, indépendamment du QG |
| **Bouclier** | encaisse les dégâts des alliés dans un rayon de 2,5. PV du bouclier = 100 % des PV du porteur |
| **Camouflage** | invisible pour la défense ; sort du camouflage si une cible de prédilection entre à portée |
| **Munition spéciale** | +0,2 sur la matrice contre la cible de prédilection |
| **Vol de vie** | convertit 20 % des dégâts infligés en PV |

---

## Défenses — valeurs relevées

Cadence 10 tirs/s pour toutes. Module joueur commun : auto-réparation.

| Nom | Type | Cible | Pts | PV | Portée | Portée mini | Bloque |
|---|---|---|---|---|---|---|---|
| Merlon | mur | — | 5 | 500 | 0 | 0 | **oui** |
| Ronce | barrière | infanterie | 5 | — | — | — | non |
| Herse | barrière | véhicule | 5 | — | — | — | non |
| Casemate | tourelle | infanterie | 8 | 350 | — | 0 | oui |
| Créneau | tourelle | véhicule | 10 | 350 | — | 0 | oui |
| Batterie | tourelle | aviation | 10 | 350 | — | 0 | oui |
| Faucheuse | artillerie | infanterie | 22 | 200 | 5,5 | **3,5** | oui |
| Mortier | artillerie | véhicule | 30 | 200 | 5,5 | **3,5** | oui |
| Harpon | artillerie | aviation | 30 | 200 | 5,5 | **3,5** | oui |

Les trois artilleries sont des **véhicules**, pas des structures — c'est ce qui explique qu'au
niveau 50 la garnison ennemie soit à 55 % de véhicules en termes de cibles.

Modules Ouvrage : **+20 % PV** pour Merlon, Ronce et Herse ; **munition spéciale** pour les trois
tourelles ; **rayon minimum −1** pour les trois artilleries.

---

## Bâtiments de site

| Bâtiment | PV | Indice butin | Ressource |
|---|---|---|---|
| **Souche** | 400 | 1 | quartz |
| **Étai** | 300 | 1 | quartz |
| **Nœud** | 200 | 2 | 50 / 50 |
| **Gangue** | 150 | 3 | quartz pur |
| **Terril** | 150 | 3 | scorie pur |

Ancrage : **300 au niveau 1** pour un indice de 1.

---

## Points de recherche par défense détruite

Au niveau 1. **×2 par niveau.** **+20 %** si le module de la cible est débloqué. Proportionnel au
pourcentage de PV détruits.

| Cible | Points | Cible | Points |
|---|---|---|---|
| Merlon · Herse · Ronce | 2 | Batterie · Casemate · Carapace · Bélier | 20 |
| Meute · Perceurs | 10 | Ratisseur | 25 |
| Créneau · Fendeur · Guetteur | 30 | Faucheuse · Mortier · Harpon | 40 |
| Broyeur | 60 | | |

---

*À revérifier contre le classeur original avant toute implémentation.*
