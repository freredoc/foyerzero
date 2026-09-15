# Revert de la PR 147 et correctif du raid

Les fonctions de la PR #147 sont annulées à la demande d'Ethan. Le déroulé du
combat est donc revenu à l'arbre `1aca789` : `ticksDus`, l'accumulateur et
l'interpolation des positions n'ont aucun changement net par rapport à cette
référence.

La version 34 ayant déjà été publiée sur Android, la sauvegarde avance en v35.
La migration 34 → 35 range une fois son éventuel rapport en attente, retire
`raidEnCours`, puis charge le reste de la partie dans le modèle courant. Elle ne
rejoue ni coût, ni dégâts, ni butin. Une v33 traverse d'abord un maillon 33 → 34
vide.

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
- `npm run check` sous Node 22 : 1 619 tests déclarés, 1 618 réussis,
  0 échec, 1 ignoré (`LIMITE T8`).
- `dist/index.html` : 9 388 040 octets, version 0.99.71, build 173. Le build 173
  est strictement supérieur au 171 déjà installé, condition exigée par
  l'auto-update Android pour servir la migration v35.
- Le démarrage Android écarte aussi un HTML téléchargé plus ancien que l'asset
  de l'APK. Le test JVM reproduit un fichier interne 171 conservé lors de
  l'installation manuelle de l'APK 172 et exige que l'asset v35 soit servi.

## Tests

Quatre tests `RAID-ERG` sont ajoutés dans `test/raid-ecran.test.js` : calcul du
chrono par ticks, intégration visuelle et absence de réécriture à chaque image,
absence sur le simulateur, persistance des modes après réussite/refus/vide.
`COMPAT-147 T1/T2`, dans `test/state.test.js`, chargent une sauvegarde Android
v34 et couvrent un raid absent, un rapport en attente et un rapport déjà publié.
Le revert supprime `test/formation-ouvrage.test.js`, qui appartenait à la PR
#147, et restaure les autres tests modifiés par cette PR.
