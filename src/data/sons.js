// Les 263 sons du pack, et la table de mixage qui les reçoit.
//
// ⚠⚠ FICHIER GÉNÉRÉ par « python3 tools/sons.py --ecrire ». NE PAS MODIFIER À
// LA MAIN : la moindre retouche serait effacée au prochain lot d'art, sans
// bruit. Tout ce qui est ici est DÉRIVÉ d'`art/sources/sfx_manifest.json`, sauf
// les cinq bus et les réglages par défaut, qui viennent du brief et sont écrits
// dans le générateur.
//
// ⚠⚠ ET C'EST L'INVERSE DU LOT SON-MOTEUR, QUI TRANSCRIVAIT QUATRE LIGNES À LA
// MAIN. À quatre entrées une transcription se relit et un test la confronte ; à
// 263 elle serait une copie qui vieillit — le motif que ce dépôt a déjà payé
// trois fois. Le manifeste reste néanmoins CONFRONTÉ : un test rejoue la
// dérivation en JavaScript et compare, si bien que la génération ne peut pas
// mentir sans qu'on le voie.
//
// ⚠⚠ VINGT-QUATRE SONS SONT CÂBLÉS, ET LES 239 AUTRES SONT MUETS À DESSEIN.
// Le lot SON-CÂBLAGE branche ce qui avait DÉJÀ un point d'accroche dans le
// dépôt : cinq sons `ui`, trois ambiances d'écran, QUATRE boucles de roulement,
// deux boucles de machinerie, et les ponctuels de sélection, d'ordre, de pose et
// d'effondrement. **Aucun son de combat** — ni tir, ni impact, ni explosion : ils
// attendent un journal de `tick` qui n'existe pas, et ce journal est un chantier
// de SIMULATION. Aucun événement de jeu n'a été inventé pour donner un emploi à
// un son, et `src/sim/` n'a pas bougé d'une ligne. Ce qui reste muet est NOMMÉ
// dans `RAPPORT-lotSON-CABLAGE.md`, un par un, avec son motif.

/**
 * Ce que le jeu s'autorise à garder décodé, en secondes, hors résidentes.
 *
 * ⚠⚠ UN SON DÉCODÉ NE PÈSE PLUS RIEN DE CE QUE PÈSE SON FICHIER. Le navigateur
 * le range en Float32 à 48 kHz : les 336,8 secondes du pack vaudraient
 * **64,7 Mo décodés** contre 890 417 octets de fichiers. Ce nombre ne se voit
 * ni dans le HTML, ni au démarrage, et c'est pour ça qu'il est écrit ici.
 *
 * ⚠ EN SECONDES, PAS EN FICHIERS : `secondes × 48 000 × 4` donne les octets, et
 * c'est la mémoire qu'on défend. Un plafond « au plus N sons » ne bornerait
 * rien, les durées allant de 44 ms à 8 s.
 *
 * ⚠ TRENTE SECONDES VALENT 5,8 Mo, DONC 18,1 Mo AVEC LES HUIT AMBIANCES. Et
 * elles tiennent la famille `ui` entière — 23 sons, 6,42 s — donc tant qu'elle
 * est la seule câblée, rien n'est jamais évincé.
 */
export const MEMOIRE = { budgetSecondesDecodees: 30 };

/**
 * La rampe anti-claquement d'une boucle, en millisecondes.
 *
 * ⚠⚠ ELLE N'EST PAS DANS `MEMOIRE`, ET C'EST LA RÈGLE §4 DU DÉPÔT. Un budget de
 * mémoire et une durée de fondu sont deux grandeurs ; les ranger ensemble parce
 * qu'elles arrivent le même jour est très exactement ce qui a fait naître
 * `data/economie.js`.
 *
 * ⚠⚠ ET CE N'EST PAS LE FONDU QUE LE README DU PACK INTERDIT. Sa ligne 39 dit
 * « ne pas appliquer de fondu supplémentaire aux fichiers marqués `loop: true` ;
 * leurs bornes exactes sont fournies en échantillons ». Elle parle du FICHIER,
 * qu'on ne touche pas : la boucle rejoue ses bornes à l'échantillon près, sans
 * fondu. La rampe porte sur le GAIN DE LECTURE, au démarrage et à l'arrêt —
 * ailleurs, et sur autre chose. Sans elle, la forme d'onde saute de zéro à sa
 * valeur en un échantillon, et l'oreille entend un clic.
 */
export const RAMPE_BOUCLE_MS = 120;

export const BUS = {
  interface: -3,
  armes: -6,
  impacts: -7,
  moteurs: -12,
  ambiances: -18,
};

/**
 * Un son : son bus, et ce que le manifeste dit de lui.
 *
 * ⚠ LE NOM DU MASTER WAV N'EST PAS ICI, ET C'EST VOULU. Le jeu ne voit jamais
 * un WAV — il reçoit un `.opus` déjà encodé, sous un `data:`. Le nom du master
 * est un fait de PRODUCTION : il vit dans `tools/sons.py`, qui est le seul à
 * l'ouvrir.
 *
 * `dureeMs` sert au moteur de voix — une instance est « en cours » tant que sa
 * durée n'est pas écoulée —, donc elle ne peut pas être décorative : un chiffre
 * faux ici plafonnerait trop tôt ou trop tard.
 *
 * ⚠ `maxInstances` EST PAR FICHIER, `gardeMs` EST PAR ÉVÉNEMENT — voir
 * `EVENEMENTS` ci-dessous, qui dit pourquoi et sur quelle mesure.
 *
 * ⚠⚠ `boucle` EST LE DRAPEAU `loop` DU MANIFESTE, ET C'EST LA LIGNE QUE LE LOT
 * PRÉCÉDENT ANNONÇAIT. Il écrivait « une ligne du générateur à ajouter le jour
 * où une ambiance jouera » : ce jour est celui-ci. **Il n'est posé que sur les
 * 35 sons qui le portent**, jamais `boucle: false` sur les 228 autres — un
 * champ faux à 228 exemplaires pèserait dans un livrable qui se compte à
 * l'octet, et `!== true` se lit aussi bien que `=== false`.
 *
 * ⚠ ET IL NE SE DÉDUIT PAS DE `residente`. Vingt-sept boucles ne sont PAS
 * résidentes — les roulements, les moteurs, les machineries — et deux sons
 * `weapons` bouclent aussi. « Ce qui tourne » et « ce qui reste décodé » sont
 * deux questions ; les confondre ferait résider vingt-sept tampons de plus.
 *
 * ⚠⚠ `residente` DIT CE QUI RESTE DÉCODÉ, ET C'EST LE POINT DUR DU LOT. Un son
 * décodé ne pèse plus rien de ce que pèse son fichier : le navigateur le range
 * en Float32 à 48 kHz, donc les 336,8 secondes du pack vaudraient **64,7 Mo
 * décodés** contre 890 417 octets de fichiers — soixante-treize fois. Les huit
 * ambiances, seules à tourner en boucle en permanence, portent le drapeau et
 * restent en mémoire une fois décodées : 64 s, **12,3 Mo**. Les 255 autres sont
 * relâchées quand le budget de `src/ui/son.js` est atteint.
 *
 * ⚠ ELLE COÏNCIDE AUJOURD'HUI AVEC `bus === 'ambiances'`, ET CE N'EST PAS LA
 * MÊME CHOSE. Le bus est un NIVEAU de mixage, la résidence une décision de
 * MÉMOIRE ; les lire l'un pour l'autre marcherait tant que les deux tables
 * coïncident, et mentirait le jour où une boucle de machinerie serait mise à
 * demeure sans changer de bus.
 */
export const SONS = {
  alert_ouvrage_base_attacked: { bus: 'interface', dureeMs: 587, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_enemy_spotted: { bus: 'interface', dureeMs: 450, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_incoming_artillery: { bus: 'interface', dureeMs: 587, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_insufficient: { bus: 'interface', dureeMs: 313, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_low_power: { bus: 'interface', dureeMs: 450, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_structure_lost: { bus: 'interface', dureeMs: 585, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_unit_lost: { bus: 'interface', dureeMs: 585, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_wave_end: { bus: 'interface', dureeMs: 587, maxInstances: 1, volumeDb: 0 },
  alert_ouvrage_wave_start: { bus: 'interface', dureeMs: 587, maxInstances: 1, volumeDb: 0 },
  alert_player_base_attacked: { bus: 'interface', dureeMs: 516, maxInstances: 1, volumeDb: 0 },
  alert_player_enemy_spotted: { bus: 'interface', dureeMs: 379, maxInstances: 1, volumeDb: 0 },
  alert_player_incoming_artillery: { bus: 'interface', dureeMs: 516, maxInstances: 1, volumeDb: 0 },
  alert_player_insufficient: { bus: 'interface', dureeMs: 242, maxInstances: 1, volumeDb: 0 },
  alert_player_low_power: { bus: 'interface', dureeMs: 379, maxInstances: 1, volumeDb: 0 },
  alert_player_structure_lost: { bus: 'interface', dureeMs: 514, maxInstances: 1, volumeDb: 0 },
  alert_player_unit_lost: { bus: 'interface', dureeMs: 514, maxInstances: 1, volumeDb: 0 },
  alert_player_wave_end: { bus: 'interface', dureeMs: 516, maxInstances: 1, volumeDb: 0 },
  alert_player_wave_start: { bus: 'interface', dureeMs: 516, maxInstances: 1, volumeDb: 0 },
  ambience_base_ouvrage_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  ambience_base_player_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  ambience_battlefield_distant_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  ambience_calm_map_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  ambience_map_wind_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  ambience_quartz_field_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  ambience_reactor_room_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  ambience_scoria_field_loop: { bus: 'ambiances', dureeMs: 8000, maxInstances: 1, volumeDb: -12, boucle: true, residente: true },
  building_ouvrage_alarm_loop: { bus: 'moteurs', dureeMs: 2400, maxInstances: 3, volumeDb: -6, boucle: true },
  building_ouvrage_collapse_large: { bus: 'moteurs', dureeMs: 2466, maxInstances: 2, volumeDb: 0 },
  building_ouvrage_collapse_medium: { bus: 'moteurs', dureeMs: 1609, maxInstances: 2, volumeDb: 0 },
  building_ouvrage_collapse_small: { bus: 'moteurs', dureeMs: 1371, maxInstances: 2, volumeDb: 0 },
  building_ouvrage_complete: { bus: 'moteurs', dureeMs: 429, maxInstances: 2, volumeDb: 0 },
  building_ouvrage_construction_loop: { bus: 'moteurs', dureeMs: 4000, maxInstances: 3, volumeDb: -6, boucle: true },
  building_ouvrage_factory_loop: { bus: 'moteurs', dureeMs: 4200, maxInstances: 3, volumeDb: -6, boucle: true },
  building_ouvrage_power_down: { bus: 'moteurs', dureeMs: 1150, maxInstances: 2, volumeDb: 0 },
  building_ouvrage_power_up: { bus: 'moteurs', dureeMs: 1321, maxInstances: 2, volumeDb: 0 },
  building_ouvrage_repair_loop: { bus: 'moteurs', dureeMs: 3200, maxInstances: 3, volumeDb: -6, boucle: true },
  building_player_alarm_loop: { bus: 'moteurs', dureeMs: 2400, maxInstances: 3, volumeDb: -6, boucle: true },
  building_player_collapse_large: { bus: 'moteurs', dureeMs: 2466, maxInstances: 2, volumeDb: 0 },
  building_player_collapse_medium: { bus: 'moteurs', dureeMs: 1609, maxInstances: 2, volumeDb: 0 },
  building_player_collapse_small: { bus: 'moteurs', dureeMs: 1371, maxInstances: 2, volumeDb: 0 },
  building_player_complete: { bus: 'moteurs', dureeMs: 635, maxInstances: 2, volumeDb: 0 },
  building_player_construction_loop: { bus: 'moteurs', dureeMs: 4000, maxInstances: 3, volumeDb: -6, boucle: true },
  building_player_factory_loop: { bus: 'moteurs', dureeMs: 4200, maxInstances: 3, volumeDb: -6, boucle: true },
  building_player_power_down: { bus: 'moteurs', dureeMs: 1150, maxInstances: 2, volumeDb: 0 },
  building_player_power_up: { bus: 'moteurs', dureeMs: 1321, maxInstances: 2, volumeDb: 0 },
  building_player_repair_loop: { bus: 'moteurs', dureeMs: 3200, maxInstances: 3, volumeDb: -6, boucle: true },
  building_reactor_loop: { bus: 'moteurs', dureeMs: 5000, maxInstances: 2, volumeDb: -8, boucle: true },
  engine_ouvrage_heavy_idle_loop: { bus: 'moteurs', dureeMs: 4000, maxInstances: 5, volumeDb: -7, boucle: true },
  engine_ouvrage_light_idle_loop: { bus: 'moteurs', dureeMs: 3200, maxInstances: 5, volumeDb: -7, boucle: true },
  engine_ouvrage_medium_idle_loop: { bus: 'moteurs', dureeMs: 3600, maxInstances: 5, volumeDb: -7, boucle: true },
  engine_player_heavy_idle_loop: { bus: 'moteurs', dureeMs: 4000, maxInstances: 5, volumeDb: -7, boucle: true },
  engine_player_light_idle_loop: { bus: 'moteurs', dureeMs: 3200, maxInstances: 5, volumeDb: -7, boucle: true },
  engine_player_medium_idle_loop: { bus: 'moteurs', dureeMs: 3600, maxInstances: 5, volumeDb: -7, boucle: true },
  explosion_ouvrage_large_01: { bus: 'impacts', dureeMs: 2389, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_large_02: { bus: 'impacts', dureeMs: 2428, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_large_03: { bus: 'impacts', dureeMs: 2466, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_large_04: { bus: 'impacts', dureeMs: 2505, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_medium_01: { bus: 'impacts', dureeMs: 1489, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_medium_02: { bus: 'impacts', dureeMs: 1511, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_medium_03: { bus: 'impacts', dureeMs: 1534, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_medium_04: { bus: 'impacts', dureeMs: 1557, maxInstances: 3, volumeDb: 0 },
  explosion_ouvrage_small_01: { bus: 'impacts', dureeMs: 959, maxInstances: 6, volumeDb: 0 },
  explosion_ouvrage_small_02: { bus: 'impacts', dureeMs: 972, maxInstances: 6, volumeDb: 0 },
  explosion_ouvrage_small_03: { bus: 'impacts', dureeMs: 985, maxInstances: 6, volumeDb: 0 },
  explosion_ouvrage_small_04: { bus: 'impacts', dureeMs: 998, maxInstances: 6, volumeDb: 0 },
  explosion_player_large_01: { bus: 'impacts', dureeMs: 2389, maxInstances: 3, volumeDb: 0 },
  explosion_player_large_02: { bus: 'impacts', dureeMs: 2428, maxInstances: 3, volumeDb: 0 },
  explosion_player_large_03: { bus: 'impacts', dureeMs: 2466, maxInstances: 3, volumeDb: 0 },
  explosion_player_large_04: { bus: 'impacts', dureeMs: 2505, maxInstances: 3, volumeDb: 0 },
  explosion_player_medium_01: { bus: 'impacts', dureeMs: 1489, maxInstances: 3, volumeDb: 0 },
  explosion_player_medium_02: { bus: 'impacts', dureeMs: 1511, maxInstances: 3, volumeDb: 0 },
  explosion_player_medium_03: { bus: 'impacts', dureeMs: 1534, maxInstances: 3, volumeDb: 0 },
  explosion_player_medium_04: { bus: 'impacts', dureeMs: 1557, maxInstances: 3, volumeDb: 0 },
  explosion_player_small_01: { bus: 'impacts', dureeMs: 959, maxInstances: 6, volumeDb: 0 },
  explosion_player_small_02: { bus: 'impacts', dureeMs: 972, maxInstances: 6, volumeDb: 0 },
  explosion_player_small_03: { bus: 'impacts', dureeMs: 985, maxInstances: 6, volumeDb: 0 },
  explosion_player_small_04: { bus: 'impacts', dureeMs: 998, maxInstances: 6, volumeDb: 0 },
  impact_dirt_heavy_01: { bus: 'impacts', dureeMs: 820, maxInstances: 8, volumeDb: 0 },
  impact_dirt_heavy_02: { bus: 'impacts', dureeMs: 838, maxInstances: 8, volumeDb: 0 },
  impact_dirt_heavy_03: { bus: 'impacts', dureeMs: 856, maxInstances: 8, volumeDb: 0 },
  impact_dirt_heavy_04: { bus: 'impacts', dureeMs: 874, maxInstances: 8, volumeDb: 0 },
  impact_dirt_small_01: { bus: 'impacts', dureeMs: 340, maxInstances: 8, volumeDb: 0 },
  impact_dirt_small_02: { bus: 'impacts', dureeMs: 358, maxInstances: 8, volumeDb: 0 },
  impact_dirt_small_03: { bus: 'impacts', dureeMs: 376, maxInstances: 8, volumeDb: 0 },
  impact_dirt_small_04: { bus: 'impacts', dureeMs: 394, maxInstances: 8, volumeDb: 0 },
  impact_energy_heavy_01: { bus: 'impacts', dureeMs: 891, maxInstances: 8, volumeDb: 0 },
  impact_energy_heavy_02: { bus: 'impacts', dureeMs: 909, maxInstances: 8, volumeDb: 0 },
  impact_energy_heavy_03: { bus: 'impacts', dureeMs: 927, maxInstances: 8, volumeDb: 0 },
  impact_energy_heavy_04: { bus: 'impacts', dureeMs: 945, maxInstances: 8, volumeDb: 0 },
  impact_energy_small_01: { bus: 'impacts', dureeMs: 411, maxInstances: 8, volumeDb: 0 },
  impact_energy_small_02: { bus: 'impacts', dureeMs: 429, maxInstances: 8, volumeDb: 0 },
  impact_energy_small_03: { bus: 'impacts', dureeMs: 447, maxInstances: 8, volumeDb: 0 },
  impact_energy_small_04: { bus: 'impacts', dureeMs: 465, maxInstances: 8, volumeDb: 0 },
  impact_metal_heavy_01: { bus: 'impacts', dureeMs: 891, maxInstances: 8, volumeDb: 0 },
  impact_metal_heavy_02: { bus: 'impacts', dureeMs: 909, maxInstances: 8, volumeDb: 0 },
  impact_metal_heavy_03: { bus: 'impacts', dureeMs: 927, maxInstances: 8, volumeDb: 0 },
  impact_metal_heavy_04: { bus: 'impacts', dureeMs: 945, maxInstances: 8, volumeDb: 0 },
  impact_metal_small_01: { bus: 'impacts', dureeMs: 411, maxInstances: 8, volumeDb: 0 },
  impact_metal_small_02: { bus: 'impacts', dureeMs: 429, maxInstances: 8, volumeDb: 0 },
  impact_metal_small_03: { bus: 'impacts', dureeMs: 447, maxInstances: 8, volumeDb: 0 },
  impact_metal_small_04: { bus: 'impacts', dureeMs: 465, maxInstances: 8, volumeDb: 0 },
  impact_quartz_heavy_01: { bus: 'impacts', dureeMs: 891, maxInstances: 8, volumeDb: 0 },
  impact_quartz_heavy_02: { bus: 'impacts', dureeMs: 909, maxInstances: 8, volumeDb: 0 },
  impact_quartz_heavy_03: { bus: 'impacts', dureeMs: 927, maxInstances: 8, volumeDb: 0 },
  impact_quartz_heavy_04: { bus: 'impacts', dureeMs: 945, maxInstances: 8, volumeDb: 0 },
  impact_quartz_small_01: { bus: 'impacts', dureeMs: 411, maxInstances: 8, volumeDb: 0 },
  impact_quartz_small_02: { bus: 'impacts', dureeMs: 429, maxInstances: 8, volumeDb: 0 },
  impact_quartz_small_03: { bus: 'impacts', dureeMs: 447, maxInstances: 8, volumeDb: 0 },
  impact_quartz_small_04: { bus: 'impacts', dureeMs: 465, maxInstances: 8, volumeDb: 0 },
  impact_ricochet_01: { bus: 'impacts', dureeMs: 534, maxInstances: 5, volumeDb: 0 },
  impact_ricochet_02: { bus: 'impacts', dureeMs: 569, maxInstances: 5, volumeDb: 0 },
  impact_ricochet_03: { bus: 'impacts', dureeMs: 604, maxInstances: 5, volumeDb: 0 },
  impact_ricochet_04: { bus: 'impacts', dureeMs: 639, maxInstances: 5, volumeDb: 0 },
  impact_scoria_heavy_01: { bus: 'impacts', dureeMs: 891, maxInstances: 8, volumeDb: 0 },
  impact_scoria_heavy_02: { bus: 'impacts', dureeMs: 909, maxInstances: 8, volumeDb: 0 },
  impact_scoria_heavy_03: { bus: 'impacts', dureeMs: 927, maxInstances: 8, volumeDb: 0 },
  impact_scoria_heavy_04: { bus: 'impacts', dureeMs: 945, maxInstances: 8, volumeDb: 0 },
  impact_scoria_small_01: { bus: 'impacts', dureeMs: 411, maxInstances: 8, volumeDb: 0 },
  impact_scoria_small_02: { bus: 'impacts', dureeMs: 429, maxInstances: 8, volumeDb: 0 },
  impact_scoria_small_03: { bus: 'impacts', dureeMs: 447, maxInstances: 8, volumeDb: 0 },
  impact_scoria_small_04: { bus: 'impacts', dureeMs: 465, maxInstances: 8, volumeDb: 0 },
  movement_dard_heavy_loop: { bus: 'moteurs', dureeMs: 3400, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_dard_light_loop: { bus: 'moteurs', dureeMs: 3400, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_essaim_ouvrage_loop: { bus: 'moteurs', dureeMs: 2400, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_infantry_player_loop: { bus: 'moteurs', dureeMs: 2400, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_ouvrage_deploy_01: { bus: 'moteurs', dureeMs: 1371, maxInstances: 3, volumeDb: 0 },
  movement_ouvrage_deploy_02: { bus: 'moteurs', dureeMs: 1389, maxInstances: 3, volumeDb: 0 },
  movement_ouvrage_flyby_01: { bus: 'moteurs', dureeMs: 2000, maxInstances: 2, volumeDb: 0 },
  movement_ouvrage_flyby_02: { bus: 'moteurs', dureeMs: 2000, maxInstances: 2, volumeDb: 0 },
  movement_ouvrage_flyby_03: { bus: 'moteurs', dureeMs: 2000, maxInstances: 2, volumeDb: 0 },
  movement_player_deploy_01: { bus: 'moteurs', dureeMs: 1371, maxInstances: 3, volumeDb: 0 },
  movement_player_deploy_02: { bus: 'moteurs', dureeMs: 1389, maxInstances: 3, volumeDb: 0 },
  movement_player_flyby_01: { bus: 'moteurs', dureeMs: 2000, maxInstances: 2, volumeDb: 0 },
  movement_player_flyby_02: { bus: 'moteurs', dureeMs: 2000, maxInstances: 2, volumeDb: 0 },
  movement_player_flyby_03: { bus: 'moteurs', dureeMs: 2000, maxInstances: 2, volumeDb: 0 },
  movement_tracks_heavy_loop: { bus: 'moteurs', dureeMs: 3200, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_tracks_light_loop: { bus: 'moteurs', dureeMs: 3200, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_tracks_medium_loop: { bus: 'moteurs', dureeMs: 3200, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_walker_heavy_loop: { bus: 'moteurs', dureeMs: 3600, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_walker_light_loop: { bus: 'moteurs', dureeMs: 3600, maxInstances: 6, volumeDb: -6, boucle: true },
  movement_walker_medium_loop: { bus: 'moteurs', dureeMs: 3600, maxInstances: 6, volumeDb: -6, boucle: true },
  order_ouvrage_attack_01: { bus: 'interface', dureeMs: 299, maxInstances: 2, volumeDb: 0 },
  order_ouvrage_attack_02: { bus: 'interface', dureeMs: 299, maxInstances: 2, volumeDb: 0 },
  order_ouvrage_move_01: { bus: 'interface', dureeMs: 299, maxInstances: 2, volumeDb: 0 },
  order_ouvrage_move_02: { bus: 'interface', dureeMs: 299, maxInstances: 2, volumeDb: 0 },
  order_ouvrage_select_01: { bus: 'interface', dureeMs: 220, maxInstances: 2, volumeDb: 0 },
  order_ouvrage_select_02: { bus: 'interface', dureeMs: 220, maxInstances: 2, volumeDb: 0 },
  order_player_attack_01: { bus: 'interface', dureeMs: 189, maxInstances: 2, volumeDb: 0 },
  order_player_attack_02: { bus: 'interface', dureeMs: 189, maxInstances: 2, volumeDb: 0 },
  order_player_move_01: { bus: 'interface', dureeMs: 189, maxInstances: 2, volumeDb: 0 },
  order_player_move_02: { bus: 'interface', dureeMs: 189, maxInstances: 2, volumeDb: 0 },
  order_player_select_01: { bus: 'interface', dureeMs: 122, maxInstances: 2, volumeDb: 0 },
  order_player_select_02: { bus: 'interface', dureeMs: 122, maxInstances: 2, volumeDb: 0 },
  ui_cancel_01: { bus: 'interface', dureeMs: 190, maxInstances: 2, volumeDb: 0 },
  ui_cancel_02: { bus: 'interface', dureeMs: 190, maxInstances: 2, volumeDb: 0 },
  ui_click_01: { bus: 'interface', dureeMs: 75, maxInstances: 2, volumeDb: 0 },
  ui_click_02: { bus: 'interface', dureeMs: 75, maxInstances: 2, volumeDb: 0 },
  ui_confirm_01: { bus: 'interface', dureeMs: 256, maxInstances: 2, volumeDb: 0 },
  ui_confirm_02: { bus: 'interface', dureeMs: 256, maxInstances: 2, volumeDb: 0 },
  ui_countdown: { bus: 'interface', dureeMs: 120, maxInstances: 1, volumeDb: 0 },
  ui_defeat: { bus: 'interface', dureeMs: 1235, maxInstances: 1, volumeDb: 0 },
  ui_error_01: { bus: 'interface', dureeMs: 268, maxInstances: 2, volumeDb: 0 },
  ui_error_02: { bus: 'interface', dureeMs: 268, maxInstances: 2, volumeDb: 0 },
  ui_hover_01: { bus: 'interface', dureeMs: 55, maxInstances: 2, volumeDb: 0 },
  ui_hover_02: { bus: 'interface', dureeMs: 55, maxInstances: 2, volumeDb: 0 },
  ui_objective_complete: { bus: 'interface', dureeMs: 635, maxInstances: 1, volumeDb: 0 },
  ui_objective_new: { bus: 'interface', dureeMs: 377, maxInstances: 1, volumeDb: 0 },
  ui_pause: { bus: 'interface', dureeMs: 190, maxInstances: 1, volumeDb: 0 },
  ui_queue_add: { bus: 'interface', dureeMs: 148, maxInstances: 1, volumeDb: 0 },
  ui_queue_remove: { bus: 'interface', dureeMs: 148, maxInstances: 1, volumeDb: 0 },
  ui_resource_gain: { bus: 'interface', dureeMs: 260, maxInstances: 1, volumeDb: 0 },
  ui_resource_spend: { bus: 'interface', dureeMs: 152, maxInstances: 1, volumeDb: 0 },
  ui_resume: { bus: 'interface', dureeMs: 155, maxInstances: 1, volumeDb: 0 },
  ui_toggle_off: { bus: 'interface', dureeMs: 140, maxInstances: 1, volumeDb: 0 },
  ui_toggle_on: { bus: 'interface', dureeMs: 160, maxInstances: 1, volumeDb: 0 },
  ui_victory: { bus: 'interface', dureeMs: 1011, maxInstances: 1, volumeDb: 0 },
  weapon_missile_flight_loop: { bus: 'armes', dureeMs: 2000, maxInstances: 4, volumeDb: -4, boucle: true },
  weapon_missile_lock: { bus: 'armes', dureeMs: 425, maxInstances: 1, volumeDb: 0 },
  weapon_ouvrage_aa_01: { bus: 'armes', dureeMs: 351, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_aa_02: { bus: 'armes', dureeMs: 351, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_aa_03: { bus: 'armes', dureeMs: 351, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_aa_04: { bus: 'armes', dureeMs: 351, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_aa_burst_01: { bus: 'armes', dureeMs: 541, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_aa_burst_02: { bus: 'armes', dureeMs: 547, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_aa_burst_03: { bus: 'armes', dureeMs: 553, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_artillery_01: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_artillery_02: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_artillery_03: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_artillery_04: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_beam_end: { bus: 'armes', dureeMs: 621, maxInstances: 3, volumeDb: 0 },
  weapon_ouvrage_beam_loop: { bus: 'armes', dureeMs: 2400, maxInstances: 3, volumeDb: 0, boucle: true },
  weapon_ouvrage_beam_start: { bus: 'armes', dureeMs: 721, maxInstances: 3, volumeDb: 0 },
  weapon_ouvrage_cannon_heavy_01: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_heavy_02: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_heavy_03: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_heavy_04: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_light_01: { bus: 'armes', dureeMs: 691, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_light_02: { bus: 'armes', dureeMs: 691, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_light_03: { bus: 'armes', dureeMs: 691, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_light_04: { bus: 'armes', dureeMs: 691, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_medium_01: { bus: 'armes', dureeMs: 891, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_medium_02: { bus: 'armes', dureeMs: 891, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_medium_03: { bus: 'armes', dureeMs: 891, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_cannon_medium_04: { bus: 'armes', dureeMs: 891, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_grenade_01: { bus: 'armes', dureeMs: 571, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_grenade_02: { bus: 'armes', dureeMs: 571, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_grenade_03: { bus: 'armes', dureeMs: 571, maxInstances: 4, volumeDb: 0 },
  weapon_ouvrage_machinegun_01: { bus: 'armes', dureeMs: 249, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_machinegun_02: { bus: 'armes', dureeMs: 249, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_machinegun_03: { bus: 'armes', dureeMs: 249, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_machinegun_04: { bus: 'armes', dureeMs: 249, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_machinegun_burst_01: { bus: 'armes', dureeMs: 474, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_machinegun_burst_02: { bus: 'armes', dureeMs: 483, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_machinegun_burst_03: { bus: 'armes', dureeMs: 492, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_missile_launch_01: { bus: 'armes', dureeMs: 875, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_missile_launch_02: { bus: 'armes', dureeMs: 900, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_missile_launch_03: { bus: 'armes', dureeMs: 925, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_missile_launch_04: { bus: 'armes', dureeMs: 950, maxInstances: 5, volumeDb: 0 },
  weapon_ouvrage_rifle_01: { bus: 'armes', dureeMs: 311, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_rifle_02: { bus: 'armes', dureeMs: 311, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_rifle_03: { bus: 'armes', dureeMs: 311, maxInstances: 8, volumeDb: 0 },
  weapon_ouvrage_rifle_04: { bus: 'armes', dureeMs: 311, maxInstances: 8, volumeDb: 0 },
  weapon_player_aa_01: { bus: 'armes', dureeMs: 280, maxInstances: 8, volumeDb: 0 },
  weapon_player_aa_02: { bus: 'armes', dureeMs: 280, maxInstances: 8, volumeDb: 0 },
  weapon_player_aa_03: { bus: 'armes', dureeMs: 280, maxInstances: 8, volumeDb: 0 },
  weapon_player_aa_04: { bus: 'armes', dureeMs: 280, maxInstances: 8, volumeDb: 0 },
  weapon_player_aa_burst_01: { bus: 'armes', dureeMs: 470, maxInstances: 5, volumeDb: 0 },
  weapon_player_aa_burst_02: { bus: 'armes', dureeMs: 476, maxInstances: 5, volumeDb: 0 },
  weapon_player_aa_burst_03: { bus: 'armes', dureeMs: 482, maxInstances: 5, volumeDb: 0 },
  weapon_player_artillery_01: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_player_artillery_02: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_player_artillery_03: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_player_artillery_04: { bus: 'armes', dureeMs: 1719, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_heavy_01: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_heavy_02: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_heavy_03: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_heavy_04: { bus: 'armes', dureeMs: 1389, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_light_01: { bus: 'armes', dureeMs: 620, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_light_02: { bus: 'armes', dureeMs: 620, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_light_03: { bus: 'armes', dureeMs: 620, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_light_04: { bus: 'armes', dureeMs: 620, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_medium_01: { bus: 'armes', dureeMs: 820, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_medium_02: { bus: 'armes', dureeMs: 820, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_medium_03: { bus: 'armes', dureeMs: 820, maxInstances: 4, volumeDb: 0 },
  weapon_player_cannon_medium_04: { bus: 'armes', dureeMs: 820, maxInstances: 4, volumeDb: 0 },
  weapon_player_grenade_01: { bus: 'armes', dureeMs: 500, maxInstances: 4, volumeDb: 0 },
  weapon_player_grenade_02: { bus: 'armes', dureeMs: 500, maxInstances: 4, volumeDb: 0 },
  weapon_player_grenade_03: { bus: 'armes', dureeMs: 500, maxInstances: 4, volumeDb: 0 },
  weapon_player_machinegun_01: { bus: 'armes', dureeMs: 178, maxInstances: 8, volumeDb: 0 },
  weapon_player_machinegun_02: { bus: 'armes', dureeMs: 178, maxInstances: 8, volumeDb: 0 },
  weapon_player_machinegun_03: { bus: 'armes', dureeMs: 178, maxInstances: 8, volumeDb: 0 },
  weapon_player_machinegun_04: { bus: 'armes', dureeMs: 178, maxInstances: 8, volumeDb: 0 },
  weapon_player_machinegun_burst_01: { bus: 'armes', dureeMs: 403, maxInstances: 5, volumeDb: 0 },
  weapon_player_machinegun_burst_02: { bus: 'armes', dureeMs: 412, maxInstances: 5, volumeDb: 0 },
  weapon_player_machinegun_burst_03: { bus: 'armes', dureeMs: 421, maxInstances: 5, volumeDb: 0 },
  weapon_player_missile_launch_01: { bus: 'armes', dureeMs: 875, maxInstances: 5, volumeDb: 0 },
  weapon_player_missile_launch_02: { bus: 'armes', dureeMs: 900, maxInstances: 5, volumeDb: 0 },
  weapon_player_missile_launch_03: { bus: 'armes', dureeMs: 925, maxInstances: 5, volumeDb: 0 },
  weapon_player_missile_launch_04: { bus: 'armes', dureeMs: 950, maxInstances: 5, volumeDb: 0 },
  weapon_player_rifle_01: { bus: 'armes', dureeMs: 240, maxInstances: 8, volumeDb: 0 },
  weapon_player_rifle_02: { bus: 'armes', dureeMs: 240, maxInstances: 8, volumeDb: 0 },
  weapon_player_rifle_03: { bus: 'armes', dureeMs: 240, maxInstances: 8, volumeDb: 0 },
  weapon_player_rifle_04: { bus: 'armes', dureeMs: 240, maxInstances: 8, volumeDb: 0 },
};

/**
 * Ce que le JEU demande : un événement, qui porte une ou plusieurs variantes.
 *
 * ⚠⚠ LE TEMPS DE GARDE EST UNE PROPRIÉTÉ DE L'ÉVÉNEMENT, PAS DU FICHIER, ET
 * SANS ÇA IL NE MORDRAIT PAS. Le manifeste l'attribue au fichier ; or un clic a
 * DEUX variantes, donc une garde par fichier laisserait passer deux clics à
 * quarante millisecondes d'écart dès que le tirage change de variante — c'est
 * précisément le cas que la garde existe pour refuser.
 *
 * ⚠ ET LE CHOIX NE COÛTE RIEN, PARCE QUE C'EST MESURÉ. Sur les 263 entrées,
 * 54 groupes portent plusieurs variantes, et **zéro** d'entre eux ne porte deux
 * `recommended_cooldown_ms` différents — ni deux `recommended_max_instances`,
 * ni deux `recommended_volume_db`, ni deux catégories. « Par fichier » et « par
 * événement » décrivent donc la même table ; lire par événement ne change
 * aucune valeur, et rend la garde falsifiable.
 *
 * ⚠⚠ ET LE NOM D'UN ÉVÉNEMENT EST CELUI DU PACK, AMPUTÉ DE SON RANG DE
 * VARIANTE. Le lot SON-MOTEUR les nommait en français — `ui_clic`, `ui_refus`,
 * `ui_bascule` : trois noms se relisent, cent trente-cinq demanderaient une
 * table de correspondance écrite à la main, c'est-à-dire la transcription que
 * ce lot retire.
 */
export const EVENEMENTS = {
  alert_ouvrage_base_attacked: { variantes: ['alert_ouvrage_base_attacked'], gardeMs: 450 },
  alert_ouvrage_enemy_spotted: { variantes: ['alert_ouvrage_enemy_spotted'], gardeMs: 450 },
  alert_ouvrage_incoming_artillery: { variantes: ['alert_ouvrage_incoming_artillery'], gardeMs: 450 },
  alert_ouvrage_insufficient: { variantes: ['alert_ouvrage_insufficient'], gardeMs: 450 },
  alert_ouvrage_low_power: { variantes: ['alert_ouvrage_low_power'], gardeMs: 450 },
  alert_ouvrage_structure_lost: { variantes: ['alert_ouvrage_structure_lost'], gardeMs: 450 },
  alert_ouvrage_unit_lost: { variantes: ['alert_ouvrage_unit_lost'], gardeMs: 450 },
  alert_ouvrage_wave_end: { variantes: ['alert_ouvrage_wave_end'], gardeMs: 450 },
  alert_ouvrage_wave_start: { variantes: ['alert_ouvrage_wave_start'], gardeMs: 450 },
  alert_player_base_attacked: { variantes: ['alert_player_base_attacked'], gardeMs: 450 },
  alert_player_enemy_spotted: { variantes: ['alert_player_enemy_spotted'], gardeMs: 450 },
  alert_player_incoming_artillery: { variantes: ['alert_player_incoming_artillery'], gardeMs: 450 },
  alert_player_insufficient: { variantes: ['alert_player_insufficient'], gardeMs: 450 },
  alert_player_low_power: { variantes: ['alert_player_low_power'], gardeMs: 450 },
  alert_player_structure_lost: { variantes: ['alert_player_structure_lost'], gardeMs: 450 },
  alert_player_unit_lost: { variantes: ['alert_player_unit_lost'], gardeMs: 450 },
  alert_player_wave_end: { variantes: ['alert_player_wave_end'], gardeMs: 450 },
  alert_player_wave_start: { variantes: ['alert_player_wave_start'], gardeMs: 450 },
  ambience_base_ouvrage_loop: { variantes: ['ambience_base_ouvrage_loop'], gardeMs: 0 },
  ambience_base_player_loop: { variantes: ['ambience_base_player_loop'], gardeMs: 0 },
  ambience_battlefield_distant_loop: { variantes: ['ambience_battlefield_distant_loop'], gardeMs: 0 },
  ambience_calm_map_loop: { variantes: ['ambience_calm_map_loop'], gardeMs: 0 },
  ambience_map_wind_loop: { variantes: ['ambience_map_wind_loop'], gardeMs: 0 },
  ambience_quartz_field_loop: { variantes: ['ambience_quartz_field_loop'], gardeMs: 0 },
  ambience_reactor_room_loop: { variantes: ['ambience_reactor_room_loop'], gardeMs: 0 },
  ambience_scoria_field_loop: { variantes: ['ambience_scoria_field_loop'], gardeMs: 0 },
  building_ouvrage_alarm_loop: { variantes: ['building_ouvrage_alarm_loop'], gardeMs: 0 },
  building_ouvrage_collapse_large: { variantes: ['building_ouvrage_collapse_large'], gardeMs: 180 },
  building_ouvrage_collapse_medium: { variantes: ['building_ouvrage_collapse_medium'], gardeMs: 180 },
  building_ouvrage_collapse_small: { variantes: ['building_ouvrage_collapse_small'], gardeMs: 180 },
  building_ouvrage_complete: { variantes: ['building_ouvrage_complete'], gardeMs: 150 },
  building_ouvrage_construction_loop: { variantes: ['building_ouvrage_construction_loop'], gardeMs: 0 },
  building_ouvrage_factory_loop: { variantes: ['building_ouvrage_factory_loop'], gardeMs: 0 },
  building_ouvrage_power_down: { variantes: ['building_ouvrage_power_down'], gardeMs: 150 },
  building_ouvrage_power_up: { variantes: ['building_ouvrage_power_up'], gardeMs: 150 },
  building_ouvrage_repair_loop: { variantes: ['building_ouvrage_repair_loop'], gardeMs: 0 },
  building_player_alarm_loop: { variantes: ['building_player_alarm_loop'], gardeMs: 0 },
  building_player_collapse_large: { variantes: ['building_player_collapse_large'], gardeMs: 180 },
  building_player_collapse_medium: { variantes: ['building_player_collapse_medium'], gardeMs: 180 },
  building_player_collapse_small: { variantes: ['building_player_collapse_small'], gardeMs: 180 },
  building_player_complete: { variantes: ['building_player_complete'], gardeMs: 150 },
  building_player_construction_loop: { variantes: ['building_player_construction_loop'], gardeMs: 0 },
  building_player_factory_loop: { variantes: ['building_player_factory_loop'], gardeMs: 0 },
  building_player_power_down: { variantes: ['building_player_power_down'], gardeMs: 150 },
  building_player_power_up: { variantes: ['building_player_power_up'], gardeMs: 150 },
  building_player_repair_loop: { variantes: ['building_player_repair_loop'], gardeMs: 0 },
  building_reactor_loop: { variantes: ['building_reactor_loop'], gardeMs: 0 },
  engine_ouvrage_heavy_idle_loop: { variantes: ['engine_ouvrage_heavy_idle_loop'], gardeMs: 0 },
  engine_ouvrage_light_idle_loop: { variantes: ['engine_ouvrage_light_idle_loop'], gardeMs: 0 },
  engine_ouvrage_medium_idle_loop: { variantes: ['engine_ouvrage_medium_idle_loop'], gardeMs: 0 },
  engine_player_heavy_idle_loop: { variantes: ['engine_player_heavy_idle_loop'], gardeMs: 0 },
  engine_player_light_idle_loop: { variantes: ['engine_player_light_idle_loop'], gardeMs: 0 },
  engine_player_medium_idle_loop: { variantes: ['engine_player_medium_idle_loop'], gardeMs: 0 },
  explosion_ouvrage_large: { variantes: ['explosion_ouvrage_large_01', 'explosion_ouvrage_large_02', 'explosion_ouvrage_large_03', 'explosion_ouvrage_large_04'], gardeMs: 110 },
  explosion_ouvrage_medium: { variantes: ['explosion_ouvrage_medium_01', 'explosion_ouvrage_medium_02', 'explosion_ouvrage_medium_03', 'explosion_ouvrage_medium_04'], gardeMs: 110 },
  explosion_ouvrage_small: { variantes: ['explosion_ouvrage_small_01', 'explosion_ouvrage_small_02', 'explosion_ouvrage_small_03', 'explosion_ouvrage_small_04'], gardeMs: 45 },
  explosion_player_large: { variantes: ['explosion_player_large_01', 'explosion_player_large_02', 'explosion_player_large_03', 'explosion_player_large_04'], gardeMs: 110 },
  explosion_player_medium: { variantes: ['explosion_player_medium_01', 'explosion_player_medium_02', 'explosion_player_medium_03', 'explosion_player_medium_04'], gardeMs: 110 },
  explosion_player_small: { variantes: ['explosion_player_small_01', 'explosion_player_small_02', 'explosion_player_small_03', 'explosion_player_small_04'], gardeMs: 45 },
  impact_dirt_heavy: { variantes: ['impact_dirt_heavy_01', 'impact_dirt_heavy_02', 'impact_dirt_heavy_03', 'impact_dirt_heavy_04'], gardeMs: 25 },
  impact_dirt_small: { variantes: ['impact_dirt_small_01', 'impact_dirt_small_02', 'impact_dirt_small_03', 'impact_dirt_small_04'], gardeMs: 25 },
  impact_energy_heavy: { variantes: ['impact_energy_heavy_01', 'impact_energy_heavy_02', 'impact_energy_heavy_03', 'impact_energy_heavy_04'], gardeMs: 25 },
  impact_energy_small: { variantes: ['impact_energy_small_01', 'impact_energy_small_02', 'impact_energy_small_03', 'impact_energy_small_04'], gardeMs: 25 },
  impact_metal_heavy: { variantes: ['impact_metal_heavy_01', 'impact_metal_heavy_02', 'impact_metal_heavy_03', 'impact_metal_heavy_04'], gardeMs: 25 },
  impact_metal_small: { variantes: ['impact_metal_small_01', 'impact_metal_small_02', 'impact_metal_small_03', 'impact_metal_small_04'], gardeMs: 25 },
  impact_quartz_heavy: { variantes: ['impact_quartz_heavy_01', 'impact_quartz_heavy_02', 'impact_quartz_heavy_03', 'impact_quartz_heavy_04'], gardeMs: 25 },
  impact_quartz_small: { variantes: ['impact_quartz_small_01', 'impact_quartz_small_02', 'impact_quartz_small_03', 'impact_quartz_small_04'], gardeMs: 25 },
  impact_ricochet: { variantes: ['impact_ricochet_01', 'impact_ricochet_02', 'impact_ricochet_03', 'impact_ricochet_04'], gardeMs: 35 },
  impact_scoria_heavy: { variantes: ['impact_scoria_heavy_01', 'impact_scoria_heavy_02', 'impact_scoria_heavy_03', 'impact_scoria_heavy_04'], gardeMs: 25 },
  impact_scoria_small: { variantes: ['impact_scoria_small_01', 'impact_scoria_small_02', 'impact_scoria_small_03', 'impact_scoria_small_04'], gardeMs: 25 },
  movement_dard_heavy_loop: { variantes: ['movement_dard_heavy_loop'], gardeMs: 0 },
  movement_dard_light_loop: { variantes: ['movement_dard_light_loop'], gardeMs: 0 },
  movement_essaim_ouvrage_loop: { variantes: ['movement_essaim_ouvrage_loop'], gardeMs: 0 },
  movement_infantry_player_loop: { variantes: ['movement_infantry_player_loop'], gardeMs: 0 },
  movement_ouvrage_deploy: { variantes: ['movement_ouvrage_deploy_01', 'movement_ouvrage_deploy_02'], gardeMs: 100 },
  movement_ouvrage_flyby: { variantes: ['movement_ouvrage_flyby_01', 'movement_ouvrage_flyby_02', 'movement_ouvrage_flyby_03'], gardeMs: 250 },
  movement_player_deploy: { variantes: ['movement_player_deploy_01', 'movement_player_deploy_02'], gardeMs: 100 },
  movement_player_flyby: { variantes: ['movement_player_flyby_01', 'movement_player_flyby_02', 'movement_player_flyby_03'], gardeMs: 250 },
  movement_tracks_heavy_loop: { variantes: ['movement_tracks_heavy_loop'], gardeMs: 0 },
  movement_tracks_light_loop: { variantes: ['movement_tracks_light_loop'], gardeMs: 0 },
  movement_tracks_medium_loop: { variantes: ['movement_tracks_medium_loop'], gardeMs: 0 },
  movement_walker_heavy_loop: { variantes: ['movement_walker_heavy_loop'], gardeMs: 0 },
  movement_walker_light_loop: { variantes: ['movement_walker_light_loop'], gardeMs: 0 },
  movement_walker_medium_loop: { variantes: ['movement_walker_medium_loop'], gardeMs: 0 },
  order_ouvrage_attack: { variantes: ['order_ouvrage_attack_01', 'order_ouvrage_attack_02'], gardeMs: 90 },
  order_ouvrage_move: { variantes: ['order_ouvrage_move_01', 'order_ouvrage_move_02'], gardeMs: 90 },
  order_ouvrage_select: { variantes: ['order_ouvrage_select_01', 'order_ouvrage_select_02'], gardeMs: 90 },
  order_player_attack: { variantes: ['order_player_attack_01', 'order_player_attack_02'], gardeMs: 90 },
  order_player_move: { variantes: ['order_player_move_01', 'order_player_move_02'], gardeMs: 90 },
  order_player_select: { variantes: ['order_player_select_01', 'order_player_select_02'], gardeMs: 90 },
  ui_cancel: { variantes: ['ui_cancel_01', 'ui_cancel_02'], gardeMs: 55 },
  ui_click: { variantes: ['ui_click_01', 'ui_click_02'], gardeMs: 55 },
  ui_confirm: { variantes: ['ui_confirm_01', 'ui_confirm_02'], gardeMs: 55 },
  ui_countdown: { variantes: ['ui_countdown'], gardeMs: 120 },
  ui_defeat: { variantes: ['ui_defeat'], gardeMs: 120 },
  ui_error: { variantes: ['ui_error_01', 'ui_error_02'], gardeMs: 55 },
  ui_hover: { variantes: ['ui_hover_01', 'ui_hover_02'], gardeMs: 55 },
  ui_objective_complete: { variantes: ['ui_objective_complete'], gardeMs: 120 },
  ui_objective_new: { variantes: ['ui_objective_new'], gardeMs: 120 },
  ui_pause: { variantes: ['ui_pause'], gardeMs: 120 },
  ui_queue_add: { variantes: ['ui_queue_add'], gardeMs: 120 },
  ui_queue_remove: { variantes: ['ui_queue_remove'], gardeMs: 120 },
  ui_resource_gain: { variantes: ['ui_resource_gain'], gardeMs: 120 },
  ui_resource_spend: { variantes: ['ui_resource_spend'], gardeMs: 120 },
  ui_resume: { variantes: ['ui_resume'], gardeMs: 120 },
  ui_toggle_off: { variantes: ['ui_toggle_off'], gardeMs: 120 },
  ui_toggle_on: { variantes: ['ui_toggle_on'], gardeMs: 120 },
  ui_victory: { variantes: ['ui_victory'], gardeMs: 120 },
  weapon_missile_flight_loop: { variantes: ['weapon_missile_flight_loop'], gardeMs: 0 },
  weapon_missile_lock: { variantes: ['weapon_missile_lock'], gardeMs: 300 },
  weapon_ouvrage_aa: { variantes: ['weapon_ouvrage_aa_01', 'weapon_ouvrage_aa_02', 'weapon_ouvrage_aa_03', 'weapon_ouvrage_aa_04'], gardeMs: 22 },
  weapon_ouvrage_aa_burst: { variantes: ['weapon_ouvrage_aa_burst_01', 'weapon_ouvrage_aa_burst_02', 'weapon_ouvrage_aa_burst_03'], gardeMs: 80 },
  weapon_ouvrage_artillery: { variantes: ['weapon_ouvrage_artillery_01', 'weapon_ouvrage_artillery_02', 'weapon_ouvrage_artillery_03', 'weapon_ouvrage_artillery_04'], gardeMs: 65 },
  weapon_ouvrage_beam_end: { variantes: ['weapon_ouvrage_beam_end'], gardeMs: 60 },
  weapon_ouvrage_beam_loop: { variantes: ['weapon_ouvrage_beam_loop'], gardeMs: 60 },
  weapon_ouvrage_beam_start: { variantes: ['weapon_ouvrage_beam_start'], gardeMs: 60 },
  weapon_ouvrage_cannon_heavy: { variantes: ['weapon_ouvrage_cannon_heavy_01', 'weapon_ouvrage_cannon_heavy_02', 'weapon_ouvrage_cannon_heavy_03', 'weapon_ouvrage_cannon_heavy_04'], gardeMs: 65 },
  weapon_ouvrage_cannon_light: { variantes: ['weapon_ouvrage_cannon_light_01', 'weapon_ouvrage_cannon_light_02', 'weapon_ouvrage_cannon_light_03', 'weapon_ouvrage_cannon_light_04'], gardeMs: 65 },
  weapon_ouvrage_cannon_medium: { variantes: ['weapon_ouvrage_cannon_medium_01', 'weapon_ouvrage_cannon_medium_02', 'weapon_ouvrage_cannon_medium_03', 'weapon_ouvrage_cannon_medium_04'], gardeMs: 65 },
  weapon_ouvrage_grenade: { variantes: ['weapon_ouvrage_grenade_01', 'weapon_ouvrage_grenade_02', 'weapon_ouvrage_grenade_03'], gardeMs: 65 },
  weapon_ouvrage_machinegun: { variantes: ['weapon_ouvrage_machinegun_01', 'weapon_ouvrage_machinegun_02', 'weapon_ouvrage_machinegun_03', 'weapon_ouvrage_machinegun_04'], gardeMs: 22 },
  weapon_ouvrage_machinegun_burst: { variantes: ['weapon_ouvrage_machinegun_burst_01', 'weapon_ouvrage_machinegun_burst_02', 'weapon_ouvrage_machinegun_burst_03'], gardeMs: 80 },
  weapon_ouvrage_missile_launch: { variantes: ['weapon_ouvrage_missile_launch_01', 'weapon_ouvrage_missile_launch_02', 'weapon_ouvrage_missile_launch_03', 'weapon_ouvrage_missile_launch_04'], gardeMs: 70 },
  weapon_ouvrage_rifle: { variantes: ['weapon_ouvrage_rifle_01', 'weapon_ouvrage_rifle_02', 'weapon_ouvrage_rifle_03', 'weapon_ouvrage_rifle_04'], gardeMs: 22 },
  weapon_player_aa: { variantes: ['weapon_player_aa_01', 'weapon_player_aa_02', 'weapon_player_aa_03', 'weapon_player_aa_04'], gardeMs: 22 },
  weapon_player_aa_burst: { variantes: ['weapon_player_aa_burst_01', 'weapon_player_aa_burst_02', 'weapon_player_aa_burst_03'], gardeMs: 80 },
  weapon_player_artillery: { variantes: ['weapon_player_artillery_01', 'weapon_player_artillery_02', 'weapon_player_artillery_03', 'weapon_player_artillery_04'], gardeMs: 65 },
  weapon_player_cannon_heavy: { variantes: ['weapon_player_cannon_heavy_01', 'weapon_player_cannon_heavy_02', 'weapon_player_cannon_heavy_03', 'weapon_player_cannon_heavy_04'], gardeMs: 65 },
  weapon_player_cannon_light: { variantes: ['weapon_player_cannon_light_01', 'weapon_player_cannon_light_02', 'weapon_player_cannon_light_03', 'weapon_player_cannon_light_04'], gardeMs: 65 },
  weapon_player_cannon_medium: { variantes: ['weapon_player_cannon_medium_01', 'weapon_player_cannon_medium_02', 'weapon_player_cannon_medium_03', 'weapon_player_cannon_medium_04'], gardeMs: 65 },
  weapon_player_grenade: { variantes: ['weapon_player_grenade_01', 'weapon_player_grenade_02', 'weapon_player_grenade_03'], gardeMs: 65 },
  weapon_player_machinegun: { variantes: ['weapon_player_machinegun_01', 'weapon_player_machinegun_02', 'weapon_player_machinegun_03', 'weapon_player_machinegun_04'], gardeMs: 22 },
  weapon_player_machinegun_burst: { variantes: ['weapon_player_machinegun_burst_01', 'weapon_player_machinegun_burst_02', 'weapon_player_machinegun_burst_03'], gardeMs: 80 },
  weapon_player_missile_launch: { variantes: ['weapon_player_missile_launch_01', 'weapon_player_missile_launch_02', 'weapon_player_missile_launch_03', 'weapon_player_missile_launch_04'], gardeMs: 70 },
  weapon_player_rifle: { variantes: ['weapon_player_rifle_01', 'weapon_player_rifle_02', 'weapon_player_rifle_03', 'weapon_player_rifle_04'], gardeMs: 22 },
};

/**
 * Les réglages par défaut, au premier démarrage.
 *
 * ⚠ LE SON EST ACTIF PAR DÉFAUT — arbitrage d'Ethan : « une fonction muette par
 * défaut n'est jamais testée ». Le volume est un facteur linéaire de 0 à 1
 * appliqué APRÈS les décibels du bus.
 */
export const REGLAGES_PAR_DEFAUT = { muet: false, volume: 0.7 };

/**
 * LES TABLES DU CÂBLAGE — ce que le JEU demande, et à quel son.
 *
 * ⚠⚠ ELLES SONT ICI PARCE QUE C'EST DU CALIBRAGE (§4), ET GÉNÉRÉES PARCE QUE
 * `sons.js` L'EST. Trois d'entre elles sont écrites à la main DANS
 * `tools/sons.py` — un écran, un type de bâtiment et deux seuils de PV ne se
 * dérivent d'aucun manifeste — mais elles y sont VÉRIFIÉES : le générateur
 * refuse un nom de son qui n'existe pas, et refuse une ambiance ou une boucle
 * de bâtiment qui ne serait pas marquée `loop` dans le manifeste.
 *
 * ⚠⚠ CELLES DES UNITÉS, ELLES, SONT DÉRIVÉES — ET ELLES NE S'INVENTENT PAS.
 * `ARME_PAR_PAIRE` et `DEPLOIEMENT_PAR_PAIRE` sortent
 * d'`art/sources/unit_audio_map.json`. Leur clé est la paire « nom joueur/nom
 * Ouvrage », qui est exactement ce que `UNITES[x].nom` porte : mesuré,
 * **quatorze paires sur quatorze se résolvent**. Le bloc `ouvrage` du même
 * fichier n'est PAS lu — ses sept clés ne sont aucun nom du dépôt, et attribuer
 * un son par ressemblance est nommément interdit ; le camp de l'Ouvrage s'obtient
 * par SUBSTITUTION `_player_` → `_ouvrage_`, vérifiée douze fois sur douze.
 */
export const AMBIANCE_PAR_ECRAN = {
  chantier: 'ambience_base_player_loop',
  mission: 'ambience_base_player_loop',
  monde: 'ambience_calm_map_loop',
  offense: 'ambience_base_player_loop',
  options: 'ambience_base_player_loop',
  raid: 'ambience_battlefield_distant_loop',
  recherche: 'ambience_base_player_loop',
};

export const BOUCLES_DE_BATIMENT = {
  aerodrome: 'building_player_factory_loop',
  caserne: 'building_player_factory_loop',
  centrale: 'building_reactor_loop',
  depotDeVehicules: 'building_player_factory_loop',
};

/**
 * Le roulement d'une pièce qui avance, PAR CHÂSSIS et par camp.
 *
 * ⚠⚠ PAR CHÂSSIS, PAS PAR UNITÉ, ET C'EST CE QUI LE REND TENABLE. Cinq
 * escouades partagent un bruit de bottes ; leur écrire cinq lignes ferait cinq
 * occasions de diverger. `src/son/cablage.js` compose la clé depuis
 * `UNITES[x].chassis` et `UNITES[x].comportementAerien`, qui sont la donnée qui
 * fait foi sur le classement des quatorze — jamais une liste recopiée.
 *
 * ⚠ UN `traversant` N'EST PAS ICI : il PASSE, donc il ne boucle pas. Son coup
 * est `PASSAGE_AERIEN`, et `movement_player_flyby` n'est pas marqué `loop` dans
 * le manifeste — c'est la donnée, pas une lecture.
 */
export const ROULEMENT_PAR_CHASSIS = {
  aeronef_stoppeur_leger: { joueur: 'movement_dard_light_loop', ouvrage: 'movement_dard_light_loop' },
  aeronef_stoppeur_lourd: { joueur: 'movement_dard_heavy_loop', ouvrage: 'movement_dard_heavy_loop' },
  blinde_leger: { joueur: 'movement_tracks_light_loop', ouvrage: 'movement_walker_light_loop' },
  blinde_lourd: { joueur: 'movement_tracks_heavy_loop', ouvrage: 'movement_walker_heavy_loop' },
  blinde_moyen: { joueur: 'movement_tracks_medium_loop', ouvrage: 'movement_walker_medium_loop' },
  escouade: { joueur: 'movement_infantry_player_loop', ouvrage: 'movement_essaim_ouvrage_loop' },
};

/**
 * Le moteur d'un blindé VIVANT ET IMMOBILE — l'autre moitié du roulement.
 *
 * ⚠⚠ ARBITRAGE D'ETHAN DU 04/09, ET C'EST LA MÊME LECTURE D'ÉTAT QUE LE
 * ROULEMENT, PRISE DANS L'AUTRE SENS. Une pièce qui a bougé au dernier tick
 * roule ; une pièce qui n'a pas bougé tourne au ralenti. Les deux se
 * réconcilient, aucune ne s'événementialise : un moteur qui tourne est un ÉTAT.
 *
 * ⚠ TROIS POIDS, ET CE SONT CEUX DES BLINDÉS — le pack n'en porte pas d'autres.
 * Une escouade n'a pas de moteur ; un aéronef stoppeur tient l'air, et son
 * `dard` couvre déjà ses deux états. Leur en attribuer un serait l'attribution
 * par ressemblance que le brief interdit.
 */
export const MOTEUR_PAR_CHASSIS = {
  blinde_leger: { joueur: 'engine_player_light_idle_loop', ouvrage: 'engine_ouvrage_light_idle_loop' },
  blinde_lourd: { joueur: 'engine_player_heavy_idle_loop', ouvrage: 'engine_ouvrage_heavy_idle_loop' },
  blinde_moyen: { joueur: 'engine_player_medium_idle_loop', ouvrage: 'engine_ouvrage_medium_idle_loop' },
};

/**
 * Quel poids porte quel blindé, et lequel des deux dards porte quel stoppeur.
 *
 * ⚠⚠ TROIS DE CES SEPT LIGNES SE LISENT DANS LA CARTE, ET LE GÉNÉRATEUR LES Y
 * CONFRONTE : Ratisseur `tracks_light`, Fendeur `tracks_medium`, Broyeur
 * `tracks_heavy`. ⚠ Bélier et Pilon n'y portent qu'un `deploy` et aucun
 * roulement : ils prennent le moyen, c'est l'arbitrage d'Ethan du 04/09 — « un
 * blindé qui avance ne doit pas être muet ». Le partage des deux stoppeurs suit
 * leurs PV, 1 050 contre 1 800, et le pack n'a que deux dards.
 */
export const ARCHETYPE_PAR_UNITE = {
  belier: 'blinde_moyen',
  broyeur: 'blinde_lourd',
  busard: 'aeronef_stoppeur_leger',
  enclume: 'aeronef_stoppeur_lourd',
  fendeur: 'blinde_moyen',
  pilon: 'blinde_moyen',
  ratisseur: 'blinde_leger',
};

/**
 * Le passage d'un aéronef traversant — un COUP, jamais une boucle.
 *
 * ⚠ IL SONNE À L'APPARITION DE LA VAGUE, ET NULLE PART AILLEURS. C'est le seul
 * instant que le moteur publie où un aéronef « passe ». Le jouer à chaque tick
 * de déplacement demanderait un événement « l'aéronef traverse » qui n'existe
 * nulle part, et le rejouer en boucle inventerait une mécanique que le pack ne
 * demande pas — il ne marque d'ailleurs pas ce son `loop`.
 */
export const PASSAGE_AERIEN = { joueur: 'movement_player_flyby', ouvrage: 'movement_ouvrage_flyby' };

/**
 * Le déploiement d'une pièce qui se met en place — un COUP, à l'apparition.
 *
 * ⚠ DEUX UNITÉS SUR QUATORZE, ET CE SONT EXACTEMENT LES DEUX BLINDÉS QUE LA
 * CARTE LAISSAIT SANS ROULEMENT. Elles gardent leur `deploy` ET prennent le
 * roulement moyen : l'arbitrage d'Ethan ajoute, il ne remplace pas.
 */
export const DEPLOIEMENT_PAR_PAIRE = {
  'Obusier/Pilon': { joueur: 'movement_player_deploy', ouvrage: 'movement_ouvrage_deploy' },
  'Pionnier/Bélier': { joueur: 'movement_player_deploy', ouvrage: 'movement_ouvrage_deploy' },
};

/**
 * L'arme de chaque unité, dans les deux camps — DÉRIVÉE de la carte du pack.
 *
 * ⚠ DEUX DES DOUZE JEUX DISTINCTS NE SONT PAS DES `weapon_*` : Sapeurs et
 * Albatros tirent une EXPLOSION. C'est le pack qui le dit, et la substitution
 * `_player_` → `_ouvrage_` y marche à l'identique.
 */
export const ARME_PAR_PAIRE = {
  'Albatros/Enclume': { joueur: 'explosion_player_large', ouvrage: 'explosion_ouvrage_large' },
  'Chasseur/Fendeur': { joueur: 'weapon_player_cannon_medium', ouvrage: 'weapon_ouvrage_cannon_medium' },
  'Cuirassiers/Carapace': { joueur: 'weapon_player_machinegun', ouvrage: 'weapon_ouvrage_machinegun' },
  'Foudre/Frappeur': { joueur: 'weapon_player_aa_burst', ouvrage: 'weapon_ouvrage_aa_burst' },
  'Fusiliers/Meute': { joueur: 'weapon_player_rifle', ouvrage: 'weapon_ouvrage_rifle' },
  'Grenadiers/Perceurs': { joueur: 'weapon_player_grenade', ouvrage: 'weapon_ouvrage_grenade' },
  'Milan/Crécelle': { joueur: 'weapon_player_machinegun_burst', ouvrage: 'weapon_ouvrage_machinegun_burst' },
  'Obusier/Pilon': { joueur: 'weapon_player_artillery', ouvrage: 'weapon_ouvrage_artillery' },
  'Percheron/Broyeur': { joueur: 'weapon_player_cannon_heavy', ouvrage: 'weapon_ouvrage_cannon_heavy' },
  'Pionnier/Bélier': { joueur: 'weapon_player_cannon_medium', ouvrage: 'weapon_ouvrage_cannon_medium' },
  'Sapeurs/Fouisseurs': { joueur: 'explosion_player_small', ouvrage: 'explosion_ouvrage_small' },
  'Voltigeurs/Guetteur': { joueur: 'weapon_player_rifle', ouvrage: 'weapon_ouvrage_rifle' },
  'Éclaireur/Ratisseur': { joueur: 'weapon_player_cannon_light', ouvrage: 'weapon_ouvrage_cannon_light' },
  'Épervier/Busard': { joueur: 'weapon_player_missile_launch', ouvrage: 'weapon_ouvrage_missile_launch' },
};

/**
 * Ce que tire chacune des six défenses qui tirent — arbitrage d'Ethan, 04/09.
 *
 * ⚠⚠ C'EST UN TROU DE LA CARTE, ET IL EST MESURÉ : `unit_audio_map.json` ne
 * décrit que les quatorze UNITÉS, aucune de ses clés ne nomme une défense.
 * L'arme suit la colonne DOMINANTE et la portée, relevées dans `DEFENSES` —
 * casemate infanterie 20 à 2,5 · créneau véhicule 35 à 2,5 · batterie aviation
 * 40 à 2,5 · faucheuse infanterie 10 à 5,5 · mortier véhicule 12 à 5,5 · harpon
 * aviation 16 à 5,5 — et un test les REMESURE plutôt que de les croire.
 *
 * ⚠ MERLON, RONCE ET HERSE SONT ABSENTES, ET LA DONNÉE LE DIT : leur `degats`
 * vaut `null`. Elles ne tirent pas ; leur donner une arme serait leur inventer
 * un tir.
 */
export const ARME_PAR_DEFENSE = {
  batterie: { joueur: 'weapon_player_aa', ouvrage: 'weapon_ouvrage_aa' },
  casemate: { joueur: 'weapon_player_machinegun', ouvrage: 'weapon_ouvrage_machinegun' },
  creneau: { joueur: 'weapon_player_cannon_medium', ouvrage: 'weapon_ouvrage_cannon_medium' },
  faucheuse: { joueur: 'weapon_player_machinegun_burst', ouvrage: 'weapon_ouvrage_machinegun_burst' },
  harpon: { joueur: 'weapon_player_missile_launch', ouvrage: 'weapon_ouvrage_missile_launch' },
  mortier: { joueur: 'weapon_player_artillery', ouvrage: 'weapon_ouvrage_artillery' },
};

export const EFFONDREMENT_PV = [2000, 3000];

/**
 * La taille de l'explosion d'une PIÈCE détruite au combat, sur ses PV.
 *
 * ⚠⚠ CE NE SONT PAS LES SEUILS D'`EFFONDREMENT_PV`, ET C'EST MESURÉ. Les
 * vingt-trois unités et défenses vont de 500 à 2 000 PV : les seuils du bâtiment
 * — 2 000 et 3 000 — en classeraient **21 en `small`, 2 en `medium`, 0 en
 * `large`**. Deux paires, deux échelles.
 *
 * ⚠ 900 ET 1 500 RENDENT 9 · 10 · 4, et la coupure tombe dans un creux :
 * {500…800} · {900…1300} · {1500…2000}. Deux nombres qui se changent seuls.
 */
export const EXPLOSION_PV = [900, 1500];

/**
 * Au-delà de quelle PART de ses PV une cible prend un impact « lourd », en
 * millièmes.
 *
 * ⚠⚠ UNE PART, ET NON UN MONTANT, PARCE QUE LE MONTANT SUIT LE NIVEAU. Mesuré
 * sur **57 864 impacts** de raids réels, l'encaissé va de 67 à 34 683 675
 * milli-PV — cinq ordres de grandeur —, `facteurMilli` mettant dégâts et PV à
 * l'échelle ensemble : un seuil absolu classerait tout en `small` au niveau 5 et
 * tout en `heavy` au niveau 50. La part, elle, ne bouge pas — médiane **12 · 13
 * · 13 · 14** millièmes aux niveaux 5, 20, 35 et 50.
 *
 * ⚠ 25 EST LE TROISIÈME QUARTILE MESURÉ, donc « le quart supérieur des coups ».
 * C'est le SEUL arbitrage encore ouvert de ce lot, et il se change seul.
 */
export const IMPACT_LOURD_MILLIEMES = 25;
