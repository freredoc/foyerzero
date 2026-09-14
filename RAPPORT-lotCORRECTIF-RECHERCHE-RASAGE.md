# RAPPORT — correctif recherche au rasage (14/09/2026)

## Résultat

Quand la Souche tombe, `pointsRecherche` rémunère la fraction de PV que chaque
défense possédait au début du raid (`pvInitialMilli / pvMaxMilli`), même si elle
est encore debout. Hors rasage, seuls les dégâts de la passe sont rémunérés.
Une défense intacte paie donc 100 % du barème ; une défense déjà entamée à
50 % n'en paie que 50 %. Le barème par cible et
`POINTS_RECHERCHE.echelle` ne changent pas.

## Réparation de l'upload

Les commits `0e5fc03` et `5b4b7ed` avaient remplacé les versions du 14/09 de
`src/sim/combat.js` et `test/combat.test.js` par deux fichiers issus d'un
checkout plus ancien. Le moteur avait perdu notamment `ECRASEMENT_FREIN`,
`ECRASEMENT_TICKS` et `facteurRechercheMilli`, puis relu la courbe du butin pour
la recherche. Sur `origin/main` après ces uploads, le build passait mais la
suite mesurée sous Node 24 rendait **1 536 pass, 33 fail, 1 skipped** ; plusieurs
fichiers de test ne pouvaient même plus importer le moteur.

Les deux fichiers sont repartis du commit `178b69e`, immédiatement antérieur
aux uploads. Le correctif de rasage a été appliqué sur cette version récente,
en conservant le facteur de recherche et tous les mécanismes ajoutés depuis
l'ancien checkout.

## Témoins et tests

- `test/combat.test.js` garde, dans T11, une défense intacte et encore debout
  après rasage : **17 750 milli-points** au niveau 1. T13 garde une défense
  entamée à 50 % avant le raid : **8 875 milli-points** après rasage, et
  **4 437** pour 25 % de dégâts lors d'une passe sans rasage. Les valeurs
  tiennent compte de `facteurRechercheMilli(1) = 8 875` et de la troncature
  BigInt ; aucun barème n'a été retouché. Le nombre de tests déclarés reste 1 613.
- `test/temoins-combat.js` ajoute une couche, sans recapturer les anciennes
  tables : **18 champs sur 1 600**, tous en colonne 6, tous sur des combats
  terminés par la Souche. `test/journal.test.js` vérifie ce périmètre ;
  `JOURNAL T1 bis` conserve l'ancien placement et ses couches inchangés.
- `test/pictogramme.test.js` réancre `PIC T7` sur la taille mesurée du livrable.

`npm ci` réussit. Sous Node **22.23.2**, la version de la CI, `node --check`
réussit sur les cinq fichiers JavaScript touchés ; le build produit
`dist/index.html`, **9 386 714 octets**, sans référence externe, version
**0.99.62** · build **164**. C'est **58 octets de plus** que le livrable
du commit `178b69e` (9 386 656 octets). La marge sous la borne T10 de
9 600 000 octets est **213 286 octets, 2,22 %**. La suite complète rend
**1 613 déclarés · 1 612 pass · 0 fail · 1 skipped** (`LIMITE T8`).

Sur Windows, `npm run check` s'arrête avant les tests car son motif cité
`"test/*.test.js"` n'est pas développé par le shell. Le même build et la suite
complète ont été exécutés avec Node 22 et la liste explicite des fichiers ;
les deux commandes sortent en 0. Aucun test n'a été assoupli.

## Fichiers touchés et suite

`src/sim/combat.js`, `test/combat.test.js`, `test/journal.test.js`,
`test/temoins-combat.js`, `test/pictogramme.test.js`, `package.json`,
`CLAUDE.md` et ce rapport. Ni `src/data/`, ni l'échelle de recherche, ni les
barèmes ne sont modifiés. Le merge de la PR reste à faire par Ethan.
