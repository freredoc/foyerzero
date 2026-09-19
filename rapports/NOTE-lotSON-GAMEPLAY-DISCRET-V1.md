# Lot SON-GAMEPLAY-DISCRET-V1 — 38 masters remplacés ou montés

Livré le 19/09/2026. Ce n'est pas un lot de code : aucun fichier de `src/` n'est touché,
`src/data/sons.js` se régénère.

## Ce que l'archive contient

- `art/sources/` — 38 WAV, PCM 16 bits, 44 100 Hz. 32 mono, 6 stéréo (les passages d'aéronef).
- `art/sources/sfx_manifest.json` — le manifeste du dépôt, avec 38 entrées corrigées et la ligne
  `license` réécrite. Les 225 autres entrées sont inchangées, à l'octet.
- `art/sources/LICENCE_ET_SOURCES.md` — d'où vient chaque master, emplacement par emplacement.

## À lancer

```
python3 tools/sons.py --ecrire      # réencode les .opus, réécrit src/data/sons.js
npm run check                       # build + suite complète, dont SON T1 à T20
```

`opusenc` doit être présent (`apt-get install opus-tools`).

## Ce qui a été mesuré avant livraison

`lire_le_master()` de `tools/sons.py` a été rejoué hors chaîne sur **les 263 masters** — les 38
neufs et les 225 du dépôt — contre le manifeste écrit : canaux, échantillonnage et durée à la
milliseconde. Zéro écart. Les invariants de `SON T1` ont été rejoués de même : 263 entrées,
**14 masters stéréo** tous ambiance ou `_flyby_`, 135 groupes d'événement coïncidant avec
`EVENEMENTS`, et aucun groupe portant deux `recommended_*` ou deux `category` différents.

⚠ Les six passages d'aéronef sont écrits en **stéréo double-mono**. Les sources du lot sont mono ;
les déclarer `channels: 1` aurait fait tomber `assert.equal(stereo.length, 14)` de `SON T1` et
demandé de retoucher le test. Deux voies identiques coûtent le poids du master — pas celui du
livrable, que `--downmix-mono` ramène à une voie de toute façon.

⚠ Les points de boucle des 16 boucles remplacées sont recalés sur le fichier entier
(`loop_start_sample: 0`, `loop_end_sample` = nombre de trames). Les laisser aux anciennes valeurs
aurait décrit une boucle d'une autre longueur que le fichier.

## Les six moteurs au ralenti sont MONTÉS, pas enregistrés

Le lot fourni ne contenait aucun ralenti : ses 28 roulements sont tous des prises en mouvement.
Chacun des six est fabriqué depuis la prise nommée dans `LICENCE_ET_SOURCES.md` — fenêtre dont
l'enveloppe varie le moins, passe-bas à 320, 380 ou 420 Hz selon le poids pour retirer le roulement
et garder le moteur, mise en boucle par fondu croisé de 200 ms, longueur calée exactement sur la
durée déjà déclarée au manifeste (3 200 · 3 600 · 4 000 ms), donc aucune durée à changer pour eux.

⚠ **Le niveau est calé sur le roulement voisin moins 3 dB, pas sur la crête.** Un passe-bas écrase
le facteur de crête : une normalisation à −6 dBFS rendait un RMS de −14 dB, soit **13 dB au-dessus**
du roulement que ce ralenti remplace quand la pièce s'arrête — un blindé à l'arrêt aurait couvert un
blindé qui avance. Les six sont donc à −3,0 dB de leur roulement, mesuré.

## Les coutures n'ont PAS été refaites, et c'est une mesure

Le rééchantillonnage 48 000 → 44 100 Hz déplace la couture des boucles. Sur les dix boucles
converties, le saut à la jointure vaut **0,0× à 2,7× la variation médiane d'un échantillon au
suivant du signal lui-même** : la discontinuité est à l'intérieur du bruit propre de la prise, donc
inaudible. Un fondu croisé de plus aurait doublé celui que le pack avait déjà posé, pour rien. Le
seuil retenu était 0,01 en valeur absolue ; le pire mesuré est 0,0084 sur
`movement_walker_heavy_loop`.

## La garde des salves, portée de 22 à 450 ms

Ethan a demandé le 19/09 de **ne pas recouper les salves**. Elles entrent donc entières, et cela
laisse un problème mesuré :

| | avant | après |
| --- | --- | --- |
| `weapon_player_rifle_*` | 240 ms | 1 300 à 1 450 ms |
| `weapon_ouvrage_rifle_*` | 311 ms | 1 450 à 1 500 ms |

La garde de ces groupes vaut **22 ms**, réglée pour un coup sec de 240 ms. Une salve de 1 300 ms
tirée toutes les 22 ms sature en permanence le plafond de huit voix : huit salves superposées en
continu. Le plafond empêche le pire, il ne rend pas le résultat lisible.

Le correctif ne touche pas le son : il porte sur `recommended_cooldown_ms`, porté de **22 à 450 ms**
sur les huit variantes — arbitrage d'Ethan du 19/09. Le recouvrement passe de 57–68 salves
simultanées à **2,8–3,3** : dense, mais on entend encore les départs.

⚠ **Les huit variantes, pas seulement celles qui gênent.** `SON T1` exige qu'un groupe d'événement
ne porte qu'une seule valeur de `recommended_cooldown_ms` ; régler deux variantes sur quatre ferait
tomber le test. Vérifié après écriture : aucun groupe hétérogène dans les 135.

⚠ Le champ se propage SEUL dans `EVENEMENTS.gardeMs` de `src/data/sons.js`, que `tools/sons.py`
dérive du manifeste. Rien à écrire à la main, et surtout rien à recopier dans le test : il relit les
deux et compare.

⚠ **Les lance-roquettes n'ont PAS été touchés, et c'est mesuré.** 617 à 717 ms pour une garde de
70 ms et un plafond de cinq voix : cinq départs superposés, ce qui est une salve — le comportement
attendu d'un lance-roquettes, pas un défaut. Le plafond suffit là où il ne suffisait pas aux fusils.
