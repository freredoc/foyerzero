#!/usr/bin/env python3
"""Les fonds d'écran : une image de décor, réduite au poids d'un livrable.

⚠⚠ POURQUOI UN OUTIL POUR UNE SEULE IMAGE. Le fond du bassin arrive en PNG de
**2 158 126 octets** — trois quarts du livrable entier à lui seul, et 2,8 Mo une
fois en base64. Le committer tel quel aurait été possible ; le committer SANS
outil aurait fait de lui une source déclarée de plus, c'est-à-dire un fichier
que personne ne sait reproduire le jour où la palette bouge. Il passe donc par
la chaîne, comme tout le reste.

⚠ CE N'EST PAS UN SPRITE, ET IL N'ENTRE DANS AUCUN ATLAS. Un atlas coud des
cellules CARRÉES d'un même côté ; un décor de 1149 × 1368 n'en est pas une. Il
voyage dans son propre marqueur de `tools/build.js`, comme les murs de contour
et les deux grosses bases de l'Ouvrage.

⚠⚠ ET IL EST EN WEBP, PAS EN PNG. Mesuré sur cette image : PNG optimisé
2 099 998 o, **WebP q85 164 578 o** — treize fois moins. C'est une photographie
de décor, pas du pixel art à teintes comptées : le PNG n'a rien à y gagner. Même
réglage que les atlas depuis le lot PIXELS, pour qu'il n'y ait qu'un encodage à
connaître dans le dépôt.
"""
import os
import sys

from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('fond')

QUALITE = 85
METHODE = 6

# Un décor, sa source, et le nom qu'il porte dans le livrable.
FONDS = [
    ('fond_offense_bassin.png', 'fond_offense'),
]


def main():
    os.makedirs(DST, exist_ok=True)
    n = 0
    for source, nom in FONDS:
        chemin = os.path.join(SRC, source)
        im = Image.open(chemin).convert('RGB')
        # ⚠ ON NE REDIMENSIONNE PAS. La feuille ROGNE le décor sur sa boîte
        # (`background-size: cover`) plutôt que de l'étirer ; réduire ici
        # figerait une taille d'écran que personne n'a mesurée.
        sortie = os.path.join(DST, nom + '.webp')
        im.save(sortie, 'WEBP', quality=QUALITE, method=METHODE)
        print('  %-28s %sx%s  %d o' % (nom, im.size[0], im.size[1], os.path.getsize(sortie)))
        n += 1
    print('%d fichiers écrits' % n)
    return 0


if __name__ == '__main__':
    sys.exit(main())
