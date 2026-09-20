# Licences et sources — les sons remplacés depuis le 19/09/2026

Ce fichier ne couvre QUE les 38 masters remplacés ou ajoutés le 19/09/2026. Les 225 autres
entrées d'`sfx_manifest.json` restent la création originale du pack Foyer Zéro v1.0.0.

Aucune des licences ci-dessous n'impose d'attribution. Ce fichier existe parce qu'une ligne
de manifeste qui affirmerait « sans échantillon externe » serait devenue fausse, et parce
qu'un dépôt qui ne sait plus d'où vient sa matière ne peut plus répondre à la question.


## Correspondance emplacement → source

| Emplacement du jeu | Fichier du lot | Traitement | Sources |
| --- | --- | --- | --- |
| `movement_infantry_player_loop` | `troupes_sol_dur_09` | converti | bsb_1318, bsb_3216 |
| `movement_essaim_ouvrage_loop` | `troupes_course_07` | converti | bsb_1843, bsb_3216 |
| `movement_tracks_light_loop` | `lourd_chenilles_05` | converti | bsb_2151, bsb_0967, bsb_2147 |
| `movement_tracks_medium_loop` | `lourd_chenilles_04` | converti | bsb_2149, bsb_1145, bsb_2147 |
| `movement_tracks_heavy_loop` | `lourd_chenilles_06` | converti | bsb_2150, bsb_1145, bsb_2147 |
| `movement_walker_light_loop` | `tout_terrain_08` | converti | bsb_2149, bsb_1286, bsb_3202 |
| `movement_walker_medium_loop` | `diesel_08` | converti | bsb_0967, bsb_1145 |
| `movement_walker_heavy_loop` | `tout_terrain_09` | converti | bsb_1145, bsb_0967, bsb_3216 |
| `movement_dard_light_loop` | `helicoptere_blackhawk_03` | converti | fs_854492 |
| `movement_dard_heavy_loop` | `helicoptere_blackhawk_01` | converti | fs_854490 |
| `movement_player_flyby_01` | `avion_f35_02` | converti | fs_162408 |
| `movement_player_flyby_02` | `avion_chasseur_06` | converti | fs_162445 |
| `movement_player_flyby_03` | `avion_survol_08` | converti | fs_189446 |
| `movement_ouvrage_flyby_01` | `helicoptere_survol_05` | converti | bsb_0861 |
| `movement_ouvrage_flyby_02` | `helicoptere_survol_07` | converti | bsb_0861 |
| `movement_ouvrage_flyby_03` | `helicoptere_blackhawk_02` | converti | fs_854491 |
| `weapon_player_rifle_01` | `troupes_tir_collectif_01` | converti | fs_854202 |
| `weapon_player_rifle_02` | `troupes_tir_collectif_03` | converti | fs_854203 |
| `weapon_player_rifle_03` | `troupes_tir_collectif_09` | converti | fs_854206 |
| `weapon_player_rifle_04` | `troupes_tir_collectif_10` | converti | fs_854206 |
| `weapon_ouvrage_rifle_01` | `troupes_tir_collectif_05` | converti | fs_854204 |
| `weapon_ouvrage_rifle_02` | `troupes_tir_collectif_06` | converti | fs_854204 |
| `weapon_ouvrage_rifle_03` | `troupes_tir_collectif_07` | converti | fs_854205 |
| `weapon_ouvrage_rifle_04` | `troupes_tir_collectif_12` | converti | fs_854203, fs_854206 |
| `weapon_player_missile_launch_01` | `lance_roquettes_bref_01` | converti | fs_854469 |
| `weapon_player_missile_launch_02` | `lance_roquettes_bref_03` | converti | fs_854471 |
| `weapon_player_missile_launch_03` | `lance_roquettes_bref_04` | converti | fs_854472 |
| `weapon_player_missile_launch_04` | `lance_roquettes_bref_07` | converti | fs_854475 |
| `weapon_ouvrage_missile_launch_01` | `lance_roquettes_bref_02` | converti | fs_854470 |
| `weapon_ouvrage_missile_launch_02` | `lance_roquettes_bref_05` | converti | fs_854473 |
| `weapon_ouvrage_missile_launch_03` | `lance_roquettes_bref_06` | converti | fs_854474 |
| `weapon_ouvrage_missile_launch_04` | `lance_roquettes_bref_08` | converti | fs_854476 |
| `engine_player_light_idle_loop` | `lourd_moteur_10` | monté | bsb_2147, bsb_2149, bsb_1145 |
| `engine_player_medium_idle_loop` | `diesel_07` | monté | bsb_0967, bsb_1286 |
| `engine_player_heavy_idle_loop` | `lourd_moteur_09` | monté | bsb_2147, bsb_2150, bsb_0967 |
| `engine_ouvrage_light_idle_loop` | `tout_terrain_02` | monté | bsb_1286, bsb_0967, bsb_3216 |
| `engine_ouvrage_medium_idle_loop` | `camion_05` | monté | bsb_1145, bsb_1286 |
| `engine_ouvrage_heavy_idle_loop` | `lourd_blinde_07` | monté | bsb_2149, bsb_0967, bsb_1145 |

**converti** : rééchantillonné de 48 000 à 44 100 Hz, ramené en WAV PCM 16 bits, sans autre
retouche. Les six passages d'aéronef sont écrits en stéréo double-mono, pour que le compte de
quatorze masters stéréo que `test/son.test.js` vérifie reste vrai ; la sortie est de toute
façon ramenée en mono par `--downmix-mono`.

**monté** : le pack ne contenait aucun moteur au ralenti. Les six `engine_*_idle_loop` ont été
fabriqués à partir des prises nommées — segment le plus stable de la prise, passe-bas à 320,
380 ou 420 Hz selon le poids pour retirer le roulement et garder le moteur, mise en boucle par
fondu croisé de 200 ms, niveau calé 3 dB sous le roulement du même poids.


## Les enregistrements

### bsb_1318

- Titre : Fast Steps on Concrete
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/fast-steps-on-concrete-s1318.html

### bsb_3216

- Titre : Footsteps on Gravels #4
- Auteur / provenance : Joseph SARDIN & Axeline T.
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/footsteps-on-gravels-4-s3216.html

### bsb_1843

- Titre : Running in the Tall Grass
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/running-in-the-tall-grass-s1843.html

### bsb_2151

- Titre : Excavator, passage (Volvo EC55B, rubber tracks)
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/excavator-passage-s2151.html

### bsb_0967

- Titre : Big diesel engine (Kia Carnival 2.9 L)
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/big-diesel-engine-s0967.html

### bsb_2147

- Titre : Excavator, engine (Volvo EC55B)
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/excavator-engine-s2147.html

### bsb_2149

- Titre : Excavator, displacement (Volvo EC55B, rubber tracks)
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/excavator-displacement-s2149.html

### bsb_1145

- Titre : Truck engine (Iveco Daily 3.0 diesel)
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/truck-engine-s1145.html

### bsb_2150

- Titre : Excavator, removal (Volvo EC55B, rubber tracks)
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/excavator-removal-s2150.html

### bsb_1286

- Titre : Car on a Road (Peugeot 107)
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/car-on-a-road-s1286.html

### bsb_3202

- Titre : Footsteps on Gravels #3
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/footsteps-on-gravels-3-s3202.html

### fs_854492

- Titre : UH-60 Black Hawk Helicopter Hover Loop 3
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854492/

### fs_854490

- Titre : UH-60 Black Hawk Helicopter Hover Loop 1
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854490/

### fs_162408

- Titre : F-35C Liftoff and Fly-by
- Auteur / provenance : qubodup (extrait d'une vidéo du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/162408/

### fs_162445

- Titre : Jet Fighter Views During Liftoff, Flight and Landing
- Auteur / provenance : qubodup (extrait d'une vidéo du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/162445/

### fs_189446

- Titre : Jet Plane Flyby
- Auteur / provenance : qubodup (extrait d'une vidéo du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/189446/

### bsb_0861

- Titre : Two helicopters flying
- Auteur / provenance : Joseph SARDIN
- Licence : CC0 1.0
- Page source : https://bigsoundbank.com/two-helicopters-flying-s0861.html

### fs_854491

- Titre : UH-60 Black Hawk Helicopter Hover Loop 2
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854491/

### fs_854202

- Titre : Volley Rifle Fire 1
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854202/

### fs_854203

- Titre : Volley Rifle Fire 2
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854203/

### fs_854206

- Titre : Volley Rifle Fire 5
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854206/

### fs_854204

- Titre : Volley Rifle Fire 3
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854204/

### fs_854205

- Titre : Volley Rifle Fire 4
- Auteur / provenance : qubodup (prise militaire du gouvernement américain)
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854205/

### fs_854469

- Titre : M142 HIMARS Rocket Launch 1
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854469/

### fs_854471

- Titre : M142 HIMARS Rocket Launch 3
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854471/

### fs_854472

- Titre : M142 HIMARS Rocket Launch 4
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854472/

### fs_854475

- Titre : M142 HIMARS Rocket Launch 7
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854475/

### fs_854470

- Titre : M142 HIMARS Rocket Launch 2
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854470/

### fs_854473

- Titre : M142 HIMARS Rocket Launch 5
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854473/

### fs_854474

- Titre : M142 HIMARS Rocket Launch 6
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854474/

### fs_854476

- Titre : M142 HIMARS Rocket Launch 8
- Auteur / provenance : qubodup / U.S. Army
- Licence : CC0 1.0 / domaine public
- Page source : https://freesound.org/people/qubodup/sounds/854476/


---

## Lot 2 — les tirs et les mises en place (20/09/2026)

**70 masters, création originale.** Synthèse physique et stochastique : souffles filtrés,
impulsions, frictions, mécanique, queues diffuses courtes. **Aucun échantillon tiers, aucune
source externe** — rien à attribuer, et rien qui engage une licence de tiers.

Traitement appliqué au dépôt : rééchantillonnage de 48 000 à 44 100 Hz et passage en WAV PCM
16 bits mono, sans autre retouche.

⚠ **Deux fichiers ont été réduits en gain.** `weapon_player_cannon_light_03` et `_04`
ressortaient à −2,98 et −2,66 dBFS après rééchantillonnage, au-dessus du plafond de −3 dBFS que
le pack tient partout ailleurs. Le débordement vient de l’interpolation, pas de la source : les
masters d’origine sont sous le plafond à 48 kHz. Gain appliqué −0,02 et −0,34 dB.

### Les groupes livrés

| Groupe | Variantes |
| --- | --- |
| `movement_ouvrage_deploy` | 2 |
| `movement_player_deploy` | 2 |
| `weapon_ouvrage_aa` | 4 |
| `weapon_ouvrage_aa_burst` | 3 |
| `weapon_ouvrage_artillery` | 4 |
| `weapon_ouvrage_cannon_heavy` | 4 |
| `weapon_ouvrage_cannon_light` | 4 |
| `weapon_ouvrage_cannon_medium` | 4 |
| `weapon_ouvrage_grenade` | 3 |
| `weapon_ouvrage_machinegun` | 4 |
| `weapon_ouvrage_machinegun_burst` | 3 |
| `weapon_player_aa` | 4 |
| `weapon_player_aa_burst` | 3 |
| `weapon_player_artillery` | 4 |
| `weapon_player_cannon_heavy` | 4 |
| `weapon_player_cannon_light` | 4 |
| `weapon_player_cannon_medium` | 4 |
| `weapon_player_grenade` | 3 |
| `weapon_player_machinegun` | 4 |
| `weapon_player_machinegun_burst` | 3 |
