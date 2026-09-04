# Foyer Zero — Pack SFX v1

Pack original de **263 bruitages**, conçu pour une stratégie mobile lisible : transitoires franches, peu de grave inutile et signatures séparées pour les deux factions.

## Identité sonore

- **Joueur** : mécanique militaire, pneumatique, métal court et signaux radio.
- **Ouvrage** : résonance minérale, oscillations inharmoniques, pulsations et verre/quartz.
- **Anti-infanterie (blanc)** : attaque nette et brillante.
- **Anti-véhicule (rouge)** : masse grave et recul lourd.
- **Antiaérien (jaune)** : rythme rapide, aigus et verrouillage.

## Contenu

- `alerts` : 18 sons
- `ambiences` : 8 sons
- `buildings` : 21 sons
- `explosions` : 24 sons
- `impacts` : 44 sons
- `movement` : 26 sons
- `orders` : 12 sons
- `ui` : 23 sons
- `weapons` : 87 sons

Les dossiers `wav/` et `ogg/` ont la même arborescence. Les WAV sont les masters PCM16 à 44,1 kHz ; les OGG sont prêts pour une intégration mobile. Les ambiances et moteurs sont en boucle. Les ambiances et passages aériens sont stéréo, le reste est mono pour faciliter la spatialisation en jeu.

## Fichiers d'intégration

- `sfx_manifest.json` : chemins, durées, boucles, niveaux mesurés, volumes/cooldowns conseillés.
- `sfx_manifest.csv` : même inventaire, lisible dans un tableur.
- `unit_audio_map.json` : affectation conseillée aux unités Joueur/Ouvrage.
- `previews/` : montages d'écoute rapide par catégorie.

## Réglages de départ conseillés

- Bus UI : `-3 dB` ; armes : `-6 dB` ; impacts : `-7 dB` ; moteurs : `-12 dB` ; ambiances : `-18 dB`.
- Pour chaque tir/impact, choisir une variante au hasard et ajouter au maximum `±2 %` de hauteur et `±1,5 dB` de volume.
- Limiter les tirs rapides grâce aux champs `recommended_max_instances` et `recommended_cooldown_ms` du manifeste.
- Ne pas appliquer de fondu supplémentaire aux fichiers marqués `loop: true` ; leurs bornes exactes sont fournies en échantillons.

## Droits et provenance

Tous les sons sont générés procéduralement pour Foyer Zero. Aucun enregistrement, sample pack ou œuvre musicale externe n'a été incorporé. Vous pouvez utiliser, modifier et distribuer ces fichiers avec le projet Foyer Zero.
