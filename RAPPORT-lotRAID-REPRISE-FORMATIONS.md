# RAPPORT — raid, reprise et formations (15/09/2026)

## Résultat

Un raid réel est maintenant représenté par `etat.raidEnCours`, sauvegardé en
version 34 avec son instant de départ, son échéance, son rapport et son état de
publication. Le coût, les dégâts et le butin sont commis une seule fois à
l'engagement. Le rapport reste indisponible jusqu'à l'échéance puis entre une
seule fois dans le journal. Un second engagement est refusé par le moteur tant
que ce marqueur existe.

Le timer `MM:SS` lit cette échéance persistante. `requestAnimationFrame` ne sert
qu'au dessin : un passage en arrière-plan arrête les images sans conclure le
combat. Au retour ou après un chargement, le rejeu se replace au tick déduit de
l'horloge murale ; si l'échéance est passée, le rapport paraît immédiatement.
Les changements répétés de visibilité et les chargements avant et après
l'échéance sont couverts par des tests d'idempotence.

Le simulateur rend son résultat dès le clic et laisse la cible ainsi que la
formation visibles derrière le panneau. « Visualiser la simulation » lance le
rejeu à la demande. Sa fermeture comme sa fin naturelle rendent la cible et le
résultat. Une comparaison de la sauvegarde sérialisée avant et après chaque
chemin garde l'absence totale de mutation.

Les modes Réparer, Améliorer, Déplacer et Démolir/Retirer restent armés après
une réussite, un refus ou une case vide au Chantier et dans l'Offense. Un autre
mode, un second clic, la palette ou la sortie de l'écran les désarment. Après un
déplacement, seule la pièce en main est relâchée. La barre inférieure atténue
désormais le niveau d'une bande uniquement quand sa valeur affichée est `—`.
Le bouton Rejouer du journal vit dans la tête sticky et reste masqué sans
rapport rejouable.

## Raids de l'Ouvrage

La caractérisation porte sur 64 graines à chacun des niveaux 10, 20, 30, 40 et
50, soit 320 cas. L'empreinte SHA-256 des compositions triées reste exactement
celle de `main`. Le flux de composition n'a donc pas bougé. Une graine hachée
avec le sel `SEL_PLACEMENT_RAID_OUVRAGE` alimente séparément les permutations et
le choix de formation ; aucun appel à `Math.random` n'entre dans `src/`.

| Niveau | Compositions distinctes | Placements distincts après | Géométries avant | Géométries après |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 14 | 39 | 3 | 11 |
| 20 | 63 | 64 | 6 | 18 |
| 30 | 64 | 64 | 4 | 9 |
| 40 | 64 | 64 | 2 | 3 |
| 50 | 64 | 64 | 1 | 1 |

Au niveau 50, les 18 emplacements sont occupés : la géométrie ne peut pas
varier, mais le flux séparé varie encore l'affectation des types aux cases. Les
tests gardent aussi le budget, les unités débloquées, les cases uniques, la
borne de 18 et l'identité complète d'un raid pour une même graine et une même
minute.

Le contrôle de verdict emploie le même montage de défense et 32 graines fixes à
chaque niveau. Aucun barème ni table de calibrage n'a changé.

| Niveau | Avant — victoire totale / défaite / défaite totale | Après — victoire totale / défaite / défaite totale |
| ---: | :--- | :--- |
| 10 | 25 / 7 / 0 | 26 / 6 / 0 |
| 20 | 0 / 31 / 1 | 0 / 29 / 3 |
| 30 | 0 / 2 / 30 | 0 / 7 / 25 |
| 40 | 0 / 3 / 29 | 0 / 3 / 29 |
| 50 | 0 / 1 / 31 | 0 / 2 / 30 |

Les scripts reproductibles sont `rapports/mesurer-formations.mjs` et
`rapports/mesurer-victoires-ouvrage.mjs`.

## Quinconce validé à 360 px

La capture de référence `rapports/maquette-quinconce-360.png` a validé une vague
pliée sur trois étages : les colonnes 1 à 3 restent en haut à gauche, les
colonnes 4 à 6 occupent le centre et les colonnes 7 à 9 le bas à droite. La
capture reproductible `rapports/maquette-quinconce-360-appliquee.png`, produite
par `rapports/rendre-maquette-quinconce.py`, confronte cette disposition aux
sprites les plus volumineux. `rapports/capture-quinconce-in-game-360.png` est
une capture du vrai `dist/index.html`, avec une sauvegarde valide de 36 unités.

`src/ui/offense.js` conserve les neuf numéros de colonne du combat et ne change
que `grid-row`. À 360 px, les 348 px utiles moins huit écarts de 3 px donnent
neuf cases carrées de 36 px. Les trois pistes se resserrent d'une demi-case ;
leurs cases ne se recouvrent pas puisqu'elles occupent des colonnes disjointes.
La pièce offensive est bornée à 96 %
(`80 % × 1,2`) ; aucun sprite ni niveau n'est rogné. Cette modification est
strictement visuelle et ne touche ni l'armée sérialisée, ni l'ordre des vagues,
ni l'équilibrage.

Mesure Chromium in-game à 360 × 640 : le bassin fait 324 px de haut et son
`scrollHeight` vaut également 324 px. Chacune des quatre vagues mesure 72,09 px,
la dernière se termine à 427,50 px avant le bord bas du bassin à 433,50 px. Les
quatre titres, les 36 sprites et les 36 niveaux sont donc visibles ensemble.

## Tests et livrable

Tests modifiés :

- `test/bases.test.js`
- `test/batiments-quatre-etats.test.js`
- `test/chantier.test.js`
- `test/formation-et-garnison.test.js`
- `test/journal-raids.test.js`
- `test/monde.test.js`
- `test/offense.test.js`
- `test/pictogramme.test.js`
- `test/raid-ecran.test.js`
- `test/raid-ouvrage.test.js`
- `test/raid.test.js`
- `test/son.test.js`
- `test/state.test.js`

Test ajouté : `test/formation-ouvrage.test.js`. Aucun test n'est supprimé.
`ASSAUT T8` exige désormais le résultat immédiat et le rejeu volontaire ;
`RDR T1` exige la reprise par l'échéance au lieu d'une fin instantanée ;
`RÉPARER T6` exige la persistance du mode.

Le test de quinconce d'`offense.test.js` est remplacé par une garde DOM/CSS qui
vérifie les quatre vagues, leurs 36 cases, le placement 3 + 3 + 3, la correspondance
des colonnes de pointage, la largeur de 36 px et la borne de 96 %. Aucun fichier
de test n'est ajouté ou supprimé par cette validation.

Sous Node 22, la suite complète rend **1 627 déclarés · 1 626 pass · 0 fail ·
1 skipped** (`LIMITE T8`). Le build produit `dist/index.html`, **9 391 301
octets**, version **0.99.66** · build **168**, soit **4 587 octets** de plus que
`main` à `1aca789` et une marge de **208 699 octets, 2,17 %** sous la borne T10.
Le lot n'ajoute ni image ni son de production.
