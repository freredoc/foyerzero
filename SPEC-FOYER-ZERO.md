# Foyer Zéro — spécification consolidée

État au 24/08/2026, après quatre sessions de relevé et d'arbitrage sur *Tiberium Alliances*.

Ce document **fait autorité**. Il remplace les sections périmées de `ROSTER.md` et
`MODELE-ECONOMIQUE.md`. Il ne contient que ce qui est tranché ; les points ouverts sont isolés
au §12.

---

## 1. Ressources

Les crédits n'existent pas. Trois grandeurs, aux emplois strictement disjoints :

| Ressource | Construit | Répare | Provient de |
|---|---|---|---|
| **Quartz** | les bâtiments | les bâtiments | production + pillage |
| **Scorie** | défenses **et** unités offensives | les unités offensives | production + pillage |
| **Points de recherche** | débloque l'arbre | — | **destruction des défenses ennemies** |

**Les points de recherche ne se produisent pas, ils se prennent.** Conséquences :

- il n'y a **pas de bâtiment de recherche** — l'Antenne est supprimée ;
- détruire une défense **paie**, même quand elle ne contient aucun butin ;
- camps et avant-postes ne se réparant jamais, leurs défenses ne paient qu'une fois. Une base se
  remet à 100 % en une heure : **ses défenses sont une ferme à recherche renouvelable**. Le
  joueur arbitre entre raser pour le territoire et conserver pour la recherche.

La réparation des défenses n'est financée par rien : seule joue la réparation gratuite de 70 %
assurée par le complexe.

---

## 2. Grille de combat

**9 colonnes × 18 rangées**, trois bandes contiguës, sans terrain neutre.

| Rangées | Contenu |
|---|---|
| 1–2 (bas) | **déploiement** — les vagues y apparaissent l'une après l'autre |
| 3–10 | **8 rangées de défense** |
| 11–18 (haut) | **8 rangées de bâtiments** — 72 cases, base du calcul de remplissage |

| Constante | Valeur |
|---|---|
| Vagues par raid | 4 |
| Intervalle entre vagues | 5 s |
| Tick | 0,1 s (10 Hz) |
| Durée maximale d'un combat | 90 s |
| Plancher de réserve en zone défense | 10 % |
| Plancher de PV des défenseurs | 1 % |
| Réparation gratuite après raid | 70 % des PV perdus, au prorata des PV du complexe |

### Obstacles de terrain

**10 cases**, dispersées au hasard. Trois types :

| Type | Effet |
|---|---|
| ralentit l'infanterie | vitesse ÷ 2,5 |
| ralentit les véhicules | vitesse ÷ 2,5 |
| ralentit les deux | vitesse ÷ 2,5 |

Ils sont **traversables** — ils ne bloquent jamais. **L'aviation les ignore.** On ne peut ni
poser une structure ni placer une unité dessus lors de la configuration de la défense, joueur
comme Ouvrage.

---

## 3. Points d'attaque et points d'armée

### Points d'attaque — le régulateur de session

| | Départ | Niveau 50 | Formule |
|---|---|---|---|
| Plafond | 100 | 600 | `100 + 10 × niveau` |
| Régénération | 20 / h | 120 / h | `20 + 2 × niveau` |

Niveau retenu : celui de **la base la plus élevée du joueur**.

**Coût d'un raid :** 10 points, plus la distance — **+1 par case** en territoire allié, **+3 par
case** en territoire ennemi ou neutre. Rayon maximal 10, donc 40 points au plus loin.

Au départ : 5 raids en réserve, un par heure. En fin de course : 15 raids, trois par heure.

### Points d'armée — le plafond de composition

Deux budgets séparés, chacun adossé à son bâtiment, qui fixe aussi le **niveau maximal** des
unités de son côté :

| Budget | Départ | Progression | Bâtiment |
|---|---|---|---|
| Offense | 20 | +5 par niveau | **Centre de commandement** |
| Défense | 40 | +5 par niveau | **QG de défense** |

Plafond d'unités **constructibles par base**, pas par raid.

### Budget des vagues de l'Ouvrage

| Niveau de la base attaquante | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 |
|---|---|---|---|---|---|---|---|---|---|
| Points d'armée engagés | 30 | 70 | 105 | 140 | 170 | 200 | 225 | 250 | 250 |

Les bases ennemies n'attaquent **qu'à partir du niveau 10**. À bas niveau, une seule vague peu
fournie ; à haut niveau, quatre vagues pleines.

---

## 4. La matrice unique

**Trois colonnes, valables pour toutes les entités.**

| Colonne | En offense | En défense |
|---|---|---|
| 1 | vs infanterie | vs infanterie |
| 2 | vs véhicule | vs véhicule |
| 3 | **vs structure** | **vs aviation** |

Les deux lectures ne se croisent jamais : aucun aéronef ne défend, aucun défenseur ne rencontre
de structure amie.

**Règle de bascule, sans exception :** anti-structure en attaque → **anti-aérien** en défense.
Les deux autres spécialités se conservent.

---

## 5. Unités

**Trois châssis** : Escouade, Blindé, Aéronef. Les châssis *Pièce* et *Masse* sont supprimés,
ainsi que la grille 5 × 4 et la liste des cases vides du `ROSTER.md` §9.

**Aucune portée minimale offensive.** Elle n'existe plus que côté défense.

**Aucun anti-aérien offensif** — l'aviation ne défend jamais. La contrainte du palier 5
(synchronisation Affût / Dard) et la dette DA du Dard **tombent**.

**Cadence 10 tirs/s pour tout le monde.** Tout tire en continu dès qu'une cible est à portée.
DPS = dégâts × 10.

**Les dégâts sont proportionnels au pourcentage de PV restants**, partout : unités offensives,
unités défensives, structures.

**Deux jeux de noms.** Le joueur emploie le vocabulaire d'une armée régulière, l'Ouvrage celui
des outils, des bêtes et des gestes.

| Châssis · rôle offensif | Joueur | Ouvrage | Cible défensive |
|---|---|---|---|
| Escouade · anti-infanterie | **Fusiliers** | **Meute** | anti-infanterie |
| Escouade · anti-inf. longue portée | **Voltigeurs** | **Guetteur** | anti-infanterie |
| Escouade · anti-structure | **Grenadiers** | **Perceurs** | anti-aérien |
| Escouade · anti-structure | **Sapeurs** | **Fouisseurs** | absent |
| Escouade · anti-véhicule | **Cuirassiers** | **Carapace** | anti-véhicule |
| Blindé · anti-infanterie | **Éclaireur** | **Ratisseur** | anti-infanterie |
| Blindé · anti-véhicule | **Chasseur** | **Fendeur** | anti-véhicule |
| Blindé · anti-véhicule lourd | **Percheron** | **Broyeur** | anti-véhicule |
| Blindé · anti-structure | **Pionnier** | **Bélier** | anti-aérien |
| Blindé · anti-structure lourd | **Obusier** | **Pilon** | absent |
| Aéronef · anti-infanterie | **Milan** | **Crécelle** | absent |
| Aéronef · anti-véhicule | **Épervier** | **Busard** | absent |
| Aéronef · anti-structure rapide | **Foudre** | **Frappeur** | absent |
| Aéronef · anti-structure lourd | **Albatros** | **Enclume** | absent |

Répartition : 4 anti-infanterie, 4 anti-véhicule, 6 anti-structure. Le déséquilibre est assumé —
la structure est l'objectif du raid.

Deux comportements aériens : **stoppeurs** (s'arrêtent pour leur cible de prédilection) et
**traversants** (traversent la carte quoi qu'il arrive). Un aéronef qui survit et atteint le
fond rentre et ne revient pas dans le combat en cours.

**Réserve de munitions** : 150 à 300 tirs, soit 15 à 30 s de tir continu. Une unité arrivée à
son plancher de 10 % ne fait plus rien d'utile sur les bâtiments — c'est l'effet recherché.

---

## 6. Défenses

Neuf structures. Le joueur et l'Ouvrage construisent les mêmes.

| Nom | Type | Cible | Module joueur | Module Ouvrage |
|---|---|---|---|---|
| **Merlon** | mur, bloque | — | auto-réparation | +20 % PV |
| **Ronce** | barrière traversable | infanterie | auto-réparation | +20 % PV |
| **Herse** | barrière traversable | véhicule | auto-réparation | +20 % PV |
| **Casemate** | tourelle | infanterie | auto-réparation | munition spéciale |
| **Créneau** | tourelle | véhicule | auto-réparation | munition spéciale |
| **Batterie** | tourelle | aviation | auto-réparation | munition spéciale |
| **Faucheuse** | artillerie mobile | infanterie | rayon mini −1 | rayon mini −1 |
| **Mortier** | artillerie mobile | véhicule | rayon mini −1 | rayon mini −1 |
| **Harpon** | artillerie mobile | aviation | rayon mini −1 | rayon mini −1 |

Les **barrières** ne bloquent pas : on les traverse en perdant des PV. Elles sont cible de
prédilection pour l'anti-structure. Le **mur** bloque et s'attaque jusqu'à destruction.

Une unité défensive mobile **traverse librement toute sa rangée**, tant qu'aucun bâtiment ne la
bloque.

---

## 7. Bâtiments

| Bâtiment | Côté joueur | Côté Ouvrage |
|---|---|---|
| **Centre de commandement** | points d'armée offensifs + niveau max des unités offensives | — |
| **QG de défense** | points d'armée défensifs + niveau max des défenses | — |
| **Complexe de défense** (**Étai**) | réparation des défenses | **seul QG qui compte** |

Côté Ouvrage, seul le complexe existe. Sa destruction empêche définitivement la réparation des
défenses du site.

---

## 8. Sites

### Composition et butin

Deux bâtiments uniques, les autres proportionnels. Le générateur n'a besoin que du nombre total
de bâtiments.

| Bâtiment | Rôle | Part | Indice butin | PV |
|---|---|---|---|---|
| **Souche** | sa destruction rase le site et livre tout | unique | 1 · quartz | **400** |
| **Étai** | répare 70 % des défenses | unique | 1 · quartz | **300** |
| **Nœud** | producteur | 0,30 | 2 · 50/50 | **200** |
| **Gangue** | stockage quartz | 0,20 | 3 · quartz pur | **150** |
| **Terril** | stockage scorie | 0,20 | 3 · scorie pur | **150** |
| *(part vacante)* | — | **0,30** | — | — |

⚠ Le retrait des crédits a supprimé la Raffinerie : **0,30 de part reste à attribuer.**

**Ancrage du butin : 300 au niveau 1**, pour un indice de 1. Croissance ×1,259 sous le niveau 12,
×1,32 au-delà.

**Le butin est proportionnel aux dégâts** : un bâtiment détruit à moitié paie la moitié.

### Saveurs

Deux variantes de camp et d'avant-poste : **riche quartz** (75/25) ou **riche scorie**
(l'inverse). Les bases sont proportionnelles. Ça s'articule avec le verrou croisé : monter ses
foreuses à quartz coûte de la scorie.

### Densité

Tables explicites par niveau dans `FOYER-ZERO-CALIBRAGE.xlsx`. Camp plafonné à 25 bâtiments,
avant-poste à 35, **base = avant-poste de même niveau + 10 %**. Sous le niveau 15 la défense est
en retard sur le bâti ; au-delà, une défense par bâtiment.

### Composition des garnisons et des vagues

Tables complètes dans `FOYER-ZERO-PROPORTIONS-IA.xlsx`, par tranches de 5 niveaux.
**Variance : ±10 points** autour de la courbe. Une garnison donnée peut donc être nettement plus
infanterie ou plus structure que la moyenne.

---

## 9. Points de recherche

Barème par défense détruite, **au niveau 1**, **×2 par niveau**, **+20 % si le module de la
cible est débloqué**, et **proportionnel au pourcentage de PV détruits**.

| Cible | Points | Cible | Points |
|---|---|---|---|
| Merlon · Herse · Ronce | **2** | Batterie | 20 |
| Meute · Perceurs | 10 | Ratisseur | 25 |
| Carapace · Casemate · Bélier | 20 | Créneau · Fendeur · Guetteur | 30 |
| Faucheuse · Mortier · Harpon | 40 | Broyeur | 60 |

Casser des murs ne paie pas ; tuer des défenseurs paie. La recherche dépend donc du combat réel.

**Le ×2 est cohérent avec lui-même** : l'arbre de recherche de TA double lui aussi de coût à
chaque échelon (200k → 270k → 500k → 1,5M → 5,8M …). Reste à caler la cadence — combien de
niveaux de progression pour un échelon d'arbre. Voir `FOYER-ZERO-RECHERCHE.xlsx`.

**Les modules sont des améliorations permanentes**, appliquées à toutes les unités du type.

---

## 10. Géographie

| Fait | Valeur |
|---|---|
| Carte | couloir **9 × 300**, format téléphone : 30 de large, 300 de haut |
| Départ du joueur | strate 5, à 25 cases du bord bas |
| Progression du niveau | **0,2 par case** vers le haut, plafond 50 |
| Base terminale | à 25 cases du bord haut, au centre |
| Zone d'influence joueur | rayon 2, **fixe** |
| Zone d'influence ennemie | rayon 3, **fixe** |
| Rayon d'attaque | **10, fixe** |
| Niveau d'une base | **moyenne des niveaux de ses bâtiments** |
| Composition d'une base | deux niveaux adjacents, répartis pour atteindre la moyenne |
| Délai entre deux sauts | **1 h** au départ → **24 h** au niveau 50 |
| Blocage après avoir subi une attaque | 1 h |
| Blocage après avoir été rasé | 24 h |

### Les trois types de site

| | Camp | Avant-poste | Base |
|---|---|---|---|
| Butin par bâtiment | ×1 | **×3 à 3,5** | — |
| Attaque le joueur | non | non | **oui** |
| Indexé sur | **niveau du joueur** | **rayon + présence du joueur** | rayon |
| Bâtiment détruit | définitif | définitif | réparé en 1 h |
| Le site respawne | oui | oui | **non** |
| Rôle | filet de sécurité | revenu | conquête + recherche |

**1 à 2 avant-postes par base du joueur à proximité**, apparaissant à l'installation, de niveau
égal au rayon ±1. Ils se renouvellent.

---

## 11. Comportement des raids de l'Ouvrage

**Seules les bases attaquent**, et seulement à partir du niveau 10.

**Déclenchement :** chaque minute, chaque base ennemie à portée (10 cases) a **1 chance sur
1440** d'attaquer. Huit bases à portée donnent donc environ huit attaques par jour, une toutes
les trois heures. S'installer au milieu du gras se paie.

**Cibles, dans l'ordre :** Centre de commandement, puis Complexe de défense, puis Chantier de
construction. À priorité égale, du plus proche au plus loin.

**Ordre des vagues :** d'abord les anti-infanterie et les anti-véhicule, ensuite les
anti-structure. C'est la traduction directe de la règle tactique — les unités qui s'arrêtent
passent devant, celles qui doivent arriver avec des munitions passent derrière.

**Si le Chantier de construction tombe, la base du joueur est rasée.** Le joueur doit se
redéployer **20 cases vers le bas**, tout réparer, et **perd les ressources stockées** dans la
base détruite. C'est la sanction la plus lourde du jeu, et elle est réversible sans être
indolore.

---

## 12. Ce qui reste ouvert

| # | Point |
|---|---|
| 1 | **La part vacante de 0,30** dans la composition des sites |
| 2 | **La cadence de l'arbre de recherche** : combien de niveaux pour un échelon |
| 3 | Le ×2 des points de recherche, à équilibrer une fois la cadence connue |
| 4 | Les coûts de recherche estimés (quatre unités et onze modules) |
| 5 | Le débit de raids triple entre le début et la fin de partie |
| 6 | Le bouclier de l'Albatros est porté par un aéronef plus rapide que ce qu'il protège |
| 7 | Les 24 h de blocage de saut, à réindexer sur une run de 15 à 25 h |
| 8 | Les noms sont validés à titre provisoire |

---

*Tranché par Ethan. Aucune ligne de code n'a été écrite.*
