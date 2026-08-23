# Audit du classeur de calibrage — Foyer Zéro

Relecture hostile de `FOYER-ZERO-CALIBRAGE-2.xlsx`, 23/08/2026. Formules vérifiées, matrices
recoupées contre les spécialités déclarées, paliers contre l'ordre de déblocage.

Trois niveaux : **BLOQUANT** (empêche d'écrire le brief) · **INCOHÉRENT** (à corriger, sans
blocage) · **À CONFIRMER** (probablement voulu, mais non dit).

---

## A. Ce que la nouvelle passe a résolu

À signaler avant les défauts, parce que ce sont de vraies avancées.

**1. Le problème de l'anti-tout est réglé.** Le Kodiak est devenu anti-structure, avec une
matrice 0,3 / 0,3 / 1. Il ne casse plus le principe des cases vides : c'est un bombardier lourd
tardif, pas une unité qui annule les autres. La question ouverte du ROSTER §9 est close.

**2. La courbe de pression ennemie existe.** Les colonnes *apparition forgotten en niv* et
*apparition module forgotten en niv* donnent, unité par unité, le niveau où l'Ouvrage la
débloque, et son module une vingtaine de niveaux plus tard. C'était le **trou n°1** des
documents, ouvert depuis le début. Il est comblé, et sous une forme meilleure qu'une courbe
abstraite : une table de déblocage, lisible et calibrable.

**3. Deux saveurs de site.** Camps et avant-postes riches en quartz (75/25) ou en scorie
(l'inverse), bases proportionnelles. Ça donne une géographie des ressources et un choix de
cible, et ça s'articule avec le verrou croisé du modèle économique : monter ses foreuses à
quartz coûte de la scorie, donc oblige à taper des sites à scorie.

**4. La composition de site en proportions.** Deux bâtiments uniques (Souche, Étai) et quatre
proportionnels sommant à 1,00 (0,3 / 0,3 / 0,2 / 0,2). Le générateur n'a besoin que du nombre
total de bâtiments : la répartition en découle. Élégant.

**5. Le glossaire des modules.** Onze modules définis en colonnes 26–27, indépendamment des
unités portées par la même ligne. Lecture confirmée : c'est un dictionnaire, pas une
affectation. Les affectations sont en colonne 19, et elles suivent TA fidèlement (Bélier =
fumigène comme le Pitbull, Crécelle = EMP comme l'Orca).

---

## B. BLOQUANT

### B1. Les crédits apparaissent, alors que le jeu n'a que deux ressources

`SITES-BATIMENTS` ajoute une colonne **credit**, et le Creuset (raffinerie) y met 1 — donc il
ne rend ni quartz ni scorie. Ses colonnes calculées valent 0 et 0.

Or `MODELE-ECONOMIQUE.md` ne connaît que quartz et scorie. Trois issues :

- **on ajoute une troisième ressource**, les crédits, réservée à la recherche comme dans TA.
  Ça change le modèle économique en profondeur : l'Antenne se paierait en crédits, et une
  branche entière de progression deviendrait indépendante du territoire ;
- **le Creuset paie en quartz et scorie** comme les autres, et la colonne credit disparaît ;
- **les crédits existent mais ne sont qu'un nom** pour une des deux ressources.

Rien ne peut être calibré tant que ce n'est pas tranché : le butin total d'un site en dépend.

### B2. La grille se contredit entre deux feuilles

`GRILLE` annonce une profondeur de zone défenseur de **16**. `SITES-DENSITE` calcule le
remplissage sur **72 cases**, c'est-à-dire 9 × **8**.

L'hypothèse qui réconcilie tout : la zone défenseur fait bien 16 de profondeur, dont **8
rangées de bâtiments au fond et 8 rangées de défenses devant**. Le remplissage ne concerne que
les bâtiments, donc 72. Si c'est ça, il faut l'écrire — c'est une contrainte structurante pour
le générateur, et elle n'apparaît nulle part.

Deux points annexes sur la même feuille :

- la note « 4 × 9 = 36 emplacements » est périmée : les rangées de déploiement sont passées à 2,
  donc 18 emplacements ;
- *Profondeur restante* vaut 0. Il n'y a aucun terrain neutre entre les deux zones, ce qui est
  cohérent avec « les vagues spawnent 2 cases sous la défense », mais mérite d'être confirmé.

### B3. Le budget d'attaque n'existe pas

`GRILLE` annonce **4 vagues simultanées** et **2 rangées de déploiement**. Rien ne dit :

- si les 18 emplacements sont partagés par les 4 vagues ou disponibles à chaque vague ;
- combien de **points d'armée** le joueur peut engager par raid, ni ce qui fait monter ce
  plafond.

Les unités coûtent 5, 10 ou 15 points ; sans plafond, la colonne *Points armée* ne sert à rien
et aucune composition ne peut être évaluée. C'est le dernier chiffre qui manque pour que le
modèle de combat soit fermé.

---

## C. INCOHÉRENT

### C1. Deux matrices contredisent la spécialité déclarée

| Unité | Spécialité déclarée | Matrice (inf / véh / struct) | Maximum réel |
|---|---|---|---|
| **Perceurs** | anti-véhicule | 0,2 / **0,5** / **1** | structure |
| **Broyeur** | anti-structure | 0,3 / **1** / 0,4 | véhicule |

Perceurs ressemble à une recopie depuis la ligne Sapeurs ; son équivalent TA, le Missile Squad,
est anti-char à l'attaque. Correction probable : 0,2 / 1 / 0,3.

Broyeur est plus ambigu : son équivalent est le Mammoth, anti-tout dans TA. Si on suit la
matrice, c'est le blindé lourd anti-véhicule — et alors Obusier et Enclume restent les deux
anti-structure lourds, ce qui est propre. **Ma recommandation : suivre la matrice et déclarer
Broyeur anti-véhicule.**

### C2. Aucune unité anti-structure au palier 0

Les trois unités de départ sont Fusiliers, Ratisseur et **Busard** — anti-infanterie,
anti-infanterie, anti-véhicule. Aucune anti-structure. Or le raid consiste à détruire des
bâtiments.

Elles peuvent le faire à 0,3 / 0,4 / 0,3 d'efficacité, donc ce n'est pas bloquant, mais le
roster précédent plaçait délibérément le Bélier au palier 0 pour cette raison. Aujourd'hui il
est au palier 1.

Deux anomalies de palier au passage :

- **Busard au palier 0.** Un aéronef disponible d'emblée, alors que Crécelle est au palier 4.
  Si l'Aire reste le producteur d'aéronefs, ça suppose de la débloquer dès le départ.
- **Sapeurs au palier 10.** L'infanterie de démolition « nombreuse et bon marché » arrive en
  dernier, après le Broyeur et en même temps que l'Enclume. Elle était au palier 1.

### C3. La couverture latérale dépasse 100 %

Les formules `=(F/6)*100` puis `=(G/6)*100` s'enchaînent sans signification — tu l'as noté
toi-même. Résultat : 108 % à l'avant-poste 25, 135 % à partir du 40. Impossible par définition.

Formule proposée, qui respecte la contrainte « jamais 100 % » observée dans TA :

```
couverture_max      = 7 / 9          (deux colonnes libres au minimum)
rangées_défensives  = ARRONDI.SUP(nb_défenses / (9 × couverture_max))
couverture_moyenne  = nb_défenses / (rangées × 9)
```

Au camp 5 : 3 défenses → 1 rangée, couverture 33 %. À l'avant-poste 40 : 35 défenses → 6
rangées, couverture 65 %. Les valeurs restent dans le domaine, et le nombre de rangées croît
comme la difficulté.

### C4. Les niveaux d'apparition ennemis divergent entre deux feuilles

| Unité | UNITES | CIBLAGE-DEFENSE |
|---|---|---|
| Ratisseur | 18 | 14 |
| Fendeur | 12 | 11 |
| Cuirassier | 8 | 10 |

Une seule table doit faire foi. Je propose que ce soit `UNITES`, et que `CIBLAGE-DEFENSE` la
référence par formule plutôt que de la dupliquer.

### C5. Le Guetteur défend en anti-véhicule

`CIBLAGE-DEFENSE` lui donne *anti véhicule* en défense, alors qu'il est anti-infanterie en
attaque. Dans TA, le Sniper est la **seule** unité qui garde son rôle des deux côtés — c'est
même ce qui le caractérise. Un tireur d'élite qui vise les blindés est difficile à défendre,
et son module défensif (« 1 rayon d'attaque supplémentaire ») va dans le sens contraire.

### C6. Collision de nom sur « Obusier »

L'unité 10 et la tourelle anti-véhicule portent le même nom. Résolu ci-dessus en nommant la
tourelle **Créneau**, mais l'inverse est aussi possible.

### C7. Deux modules définis, jamais attribués

**autorepair** et **munition spéciale** figurent au glossaire mais n'apparaissent dans aucune
colonne *Module* ni *module forgotten*. Soit ils manquent à une unité, soit ils sont à retirer.

---

## D. À CONFIRMER

### D1. La cadence est morte

Toutes les unités et toutes les défenses sont à **10 tirs/s**, soit un tir par tick. La colonne
ne différencie plus rien : seuls les dégâts par tir varient, et le DPS n'est que ×10. Deux
options : supprimer la colonne et ne garder que les dégâts par tick, ou s'en servir comme
levier (une artillerie lente à 2 tirs/s, une mitrailleuse à 10).

### D2. La réserve s'épuise en quinze secondes

150 à 300 tirs, à 10 tirs/s, donne **15 à 30 secondes de tir continu**, pour un combat qui peut
durer 90 s. Une unité qui mitraille tout ce qui passe arrive vide.

C'est probablement l'effet recherché — c'est même le cœur du modèle de pénétration. Mais avec
le plancher de 10 %, un Fusilier arrivé vide dispose de 15 tirs à 8 dégâts, soit 120 dégâts,
face à un Merlon de 500 PV. **Autrement dit : arriver vide, c'est ne rien faire du tout.** Le
plancher ne sert pas à garantir un minimum de butin, il sert seulement à ne pas faire
disparaître l'unité. À confirmer comme tel.

### D3. Les dégâts proportionnels aux PV changent tout l'équilibre

Mécanique ajoutée dans ton message : une unité blessée tape moins fort, au prorata de ses PV.
Quatre conséquences, toutes fortes :

- **Le focus fire devient strictement dominant.** Tuer une unité vaut mieux que d'en blesser
  deux, toujours, sans exception. Ça simplifie l'IA de ciblage, mais ça retire de la décision.
- **Le cinquième raid sur un site est trivial.** Les défenseurs conservent 1 % de PV, donc
  infligent 1 % de dégâts. Ils ne sont plus une menace, juste des sacs à points de vie. Le farm
  répété devient de plus en plus facile **et** de moins en moins rentable — les deux courbes
  jouent dans le même sens, ce qui est cohérent.
- **Vol de vie et autoréparation prennent une valeur disproportionnée** : ils restaurent du DPS,
  pas seulement de la survie.
- **Le bouclier de l'Enclume devient très fort** : il protège les alliés de la dégradation, pas
  seulement de la mort. À vérifier : porté par un aéronef à 1,5 case/s, il dépassera les unités
  au sol qu'il est censé couvrir.

Question ouverte : **la règle s'applique-t-elle aussi aux structures défensives ?** Une tourelle
à 10 % de PV qui tire à 10 % raccourcit énormément les combats.

### D4. Il manque une colonne « vs aviation » aux unités

Les défenses ont une matrice à trois colonnes (infanterie / véhicule / aviation). Les unités ont
une matrice à trois colonnes aussi, mais différentes : infanterie / véhicule / **structure**.

Or `CIBLAGE-DEFENSE` donne à Perceurs et Bélier la cible *anti-air* quand ils défendent. Sans
colonne *vs aviation*, leur efficacité contre un aéronef ennemi n'est nulle part.

Deux lectures possibles, et il faut choisir : soit une matrice unique à quatre colonnes pour
tout le monde, soit deux matrices distinctes, offensive et défensive, par unité.

### D5. Il n'y a plus d'anti-aérien offensif, et c'est peut-être très bien

Affût et Escopette ont disparu. Aucune unité offensive n'a de spécialité anti-aérienne, et la
matrice offensive n'a pas de colonne aviation.

C'est **cohérent** : l'aviation ne défend jamais, donc l'attaquant ne rencontre jamais
d'aéronef. L'anti-aérien n'a de sens qu'en défense, où il existe (Batterie, Harpon, Perceurs,
Bélier).

Deux conséquences documentaires : la contrainte du palier 5 (« l'Affût doit être disponible au
moment exact où le premier Dard apparaît ») **disparaît**, et la dette DA du Dard avec elle.

### D6. Les châssis Pièce et Masse ont disparu

Obusier et Broyeur sont passés en **Blindé**. Il ne reste que trois châssis — Escouade, Blindé,
Aéronef — exactement comme TA.

Conséquence : plus aucune unité offensive n'a de **portée minimale** (colonne à 0 partout). La
portée minimale n'existe plus que côté défense (Faucheuse, Mortier, Harpon, à 3,5).

C'est une simplification saine, mais elle **périme la grille 5 × 4 du ROSTER §4 et la liste des
cases vides du §9**. Ces deux sections sont à réécrire, pas à corriger.

### D7. L'Obusier ne défend pas

`CIBLAGE-DEFENSE` le marque absent. C'est défendable — une artillerie de siège n'a pas de rôle
en défense rapprochée — mais dans TA, la Titan Artillery est justement une **défense**. À
confirmer comme choix, pas comme oubli.

### D8. Ni Bastion ni QG de défense joueur

`DEFENSES` liste neuf structures, aucune n'est un QG. Le seul objet de ce type est l'**Étai**,
côté ennemi, dans `SITES-BATIMENTS`.

La décision 6 de la session précédente — scinder le Bastion en deux bâtiments, l'un plafonnant
le niveau, l'autre ouvrant les types et verrouillant la réparation — n'apparaît nulle part. Soit
elle est abandonnée, soit les deux bâtiments sont à ajouter côté joueur.

---

## E. Noms proposés

À valider ou écarter en bloc.

### Unités

| Ligne | Équivalent TA | Rôle | Nom |
|---|---|---|---|
| 7 | exosoldat | infanterie anti-véhicule blindée | **Cuirassier** |
| 12 | Paladin | aéronef anti-véhicule, stoppeur | **Busard** |
| 13 | Kodiak | aéronef anti-structure lourd | **Enclume** |
| 14 | sniper | infanterie anti-infanterie camouflée | **Guetteur** |

### Défenses

| Équivalent TA | Type | Nom |
|---|---|---|
| mur | structure bloquante | **Merlon** |
| barbelés | barrière anti-infanterie | **Ronce** |
| anti-tank barrier | barrière anti-véhicule | **Herse** *(existant)* |
| mg nest | tourelle anti-infanterie | **Casemate** *(existant)* |
| tourelle anti-véhicule | tourelle | **Créneau** |
| flak | tourelle anti-aérienne | **Batterie** *(existant)* |
| reaper | artillerie anti-infanterie | **Faucheuse** |
| demolisher | artillerie anti-véhicule | **Mortier** *(existant)* |
| sam | artillerie anti-aérienne | **Harpon** |

### Bâtiments de site

| Équivalent TA | Rôle | Nom |
|---|---|---|
| Chantier de construction | central, sa chute rase le site | **Souche** |
| Raffinerie | conversion | **Creuset** |
| Silo de tiberium | stockage quartz | **Gangue** |
| Silo de cristal | stockage scorie | **Terril** |
| Complexe de défense | répare 70 % des défenses | **Étai** |
| Collecteur | producteur | **Nœud** *(existant)* |

### Logique des registres

Trois familles, une par fonction, pour que le joueur identifie un objet sans lire son nom :

- **outils agricoles** — Herse, Ronce, Faucheuse : ce qui blesse et retarde ;
- **fortification** — Merlon, Casemate, Créneau, Batterie, Mortier, Harpon : ce qui tire ;
- **végétal** — Souche, Nœud, Racine : ce que l'Ouvrage fait pousser, et qu'on arrache.

Creuset, Gangue et Terril forment une quatrième petite famille, minière, pour les contenants.

---

## F. Ce qu'il reste à faire avant le brief

1. Trancher **B1** (crédits), **B2** (grille) et **B3** (budget d'attaque)
2. Corriger les deux matrices de **C1**, les paliers de **C2**, les formules de **C3**
3. Choisir la forme de la matrice en **D4**
4. Réécrire les sections périmées de `ROSTER.md` : la grille des châssis, les cases vides, la
   contrainte Affût/Dard, la Herse, le Bastion
5. Réécrire le §5 de `MODELE-ECONOMIQUE.md` : composition de site, butin par bâtiment

Rien de tout cela ne demande de code.
