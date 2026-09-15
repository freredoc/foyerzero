# Revert de la PR 147 et correctif du raid

La PR #147 est annulée en entier à la demande d'Ethan. Le déroulé du combat est
donc revenu à l'arbre `1aca789` : `ticksDus`, l'accumulateur et l'interpolation
des positions n'ont aucun changement net par rapport à cette référence.

Le chrono du raid réel est maintenant une lecture du combat déjà affiché. Il
soustrait `combat.tick` à `rapport.ticks`, convertit le reste avec `TICK_MS` et
formate le résultat en `MM:SS`. Il ne lit aucune horloge murale, ne rattrape
aucun tick et ne commande aucune position. Il est enfant du titre de la cible,
sans pavé ni position absolue propres, et son texte n'est réécrit que lorsqu'il
change.

En préparation de raid, Réparer et Activer restent armés après une réussite, un
refus ou un toucher vide. Un second clic sur le bouton actif désarme le mode ;
le choix de l'autre bouton change de mode. « Tout réparer » conserve également
Réparer armé.

## Vérifications

- `git diff 1aca789 -- src/render src/sim/combat.js` : vide.
- Contrôle Chromium à 360 × 640 : chrono dans le titre, de x = 327,375 à
  x = 352, parent de 360 px, fond transparent et position statique.
- `node --test test/raid-ecran.test.js` sous Node 22 : 56 tests, 56 réussis.
- `npm run check` sous Node 22 : 1 617 tests déclarés, 1 616 réussis,
  0 échec, 1 ignoré (`LIMITE T8`).
- `dist/index.html` : 9 387 607 octets, version 0.99.69, build 171.

## Tests

Quatre tests `RAID-ERG` sont ajoutés dans `test/raid-ecran.test.js` : calcul du
chrono par ticks, intégration visuelle et absence de réécriture à chaque image,
absence sur le simulateur, persistance des modes après réussite/refus/vide.
Le revert supprime `test/formation-ouvrage.test.js`, qui appartenait à la PR
#147, et restaure les autres tests modifiés par cette PR.
