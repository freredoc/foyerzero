# Terrain de la carte — Foyer Zéro

## Contenu

- `planches/terrain_map_planche_a.png` à `d.png` : 4 planches de 1024 × 1024 px.
- Chaque planche contient 8 × 8 cases implicites de 128 × 128 px, sans grille visible.
- `tiles/a` à `tiles/d` : les 256 cases déjà découpées en PNG 128 × 128.
- `apercu_4_planches.png` : aperçu des quatre planches.

Les planches A à D gardent la même palette, la même clarté et le même contraste. Seule la structure géologique varie : terre fracturée, strates obliques, poussière minérale diffuse et érosion ramifiée.

## Pose recommandée sur la carte 300 × 30

La carte fait 9 000 cases. Traiter chaque planche comme un macro-bloc de 8 × 8 cases : choisir A, B, C ou D avec un hachage déterministe de la graine et des coordonnées du macro-bloc, puis appliquer une rotation de 0°, 90°, 180° ou 270° et éventuellement un miroir.

Ne pas tirer les 256 cases indépendamment : les motifs traversent les limites internes de la planche. Conserver les voisinages de la planche rend le terrain continu. Entre deux macro-blocs, employer un chevauchement ou un masque de bruit d'environ 32 px pour fondre les bords.

Pour une case située aux coordonnées locales `(x, y)` d'une planche :

- `sourceX = (x % 8) × 128`
- `sourceY = (y % 8) × 128`
- largeur et hauteur source : `128`

Les emblèmes se centrent dans la case et restent plafonnés à 120 × 120 px, soit une marge minimale de 4 px sur chaque côté.

## Contraintes visuelles retenues

- Vue zénithale orthographique.
- Pixel art à bords francs, sans texte ni élément de jeu.
- Palette terre cuite désaturée avec ombres cendre violacée.
- Contraste interne bas pour laisser les emblèmes dominer.
- Aucun relief haut, route, rivière, végétation, bâtiment, frontière ou ligne de case.

