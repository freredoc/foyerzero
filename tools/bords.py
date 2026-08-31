#!/usr/bin/env python3
"""Les murs de contour d'une base — quatre segments et quatre angles, deux camps.

Ethan, le 31/08/2026 : « les murs contour ne sont pas là », avec quatre planches
jointes — `base_bords_{joueur,ouvrage}_{murs,angles}_2x2.png`. Seize sprites en
tout : deux variantes de mur horizontal, deux de mur vertical, quatre angles, et
tout ça pour chacun des deux camps.

⚠⚠ CES TUILES SE POSENT SUR LE CENTRE, PAS SUR LE BORD, ET C'EST MESURÉ.
Le trait d'un mur occupe `y = 448..575` sur 1024, c'est-à-dire le MILIEU de sa
cellule ; l'angle occupe `448..575` sur les deux axes, donc le centre exact. La
conséquence porte tout le branchement : une tuile posée sur une case dessinerait
son mur au milieu de la case. Pour que le mur tombe sur la LIGNE qui sépare deux
cases, la tuile doit être posée À CHEVAL sur cette ligne — décalée d'une demi-
case. C'est `ui/chantier.js` qui le fait ; ici on se contente de ne rien
recadrer.

⚠ AUCUN RECADRAGE, DONC, ET C'EST LA DIFFÉRENCE AVEC TOUS LES AUTRES OUTILS.
`recadrer` de `final128.py` centre le motif et le met à l'échelle d'une emprise
voulue : c'est juste pour une unité ou un bâtiment, qui doit remplir sa case,
et c'est FAUX pour une tuile de raccord, dont la position dans la cellule EST
l'information. Un mur recadré viendrait toucher les bords de sa tuile et ne se
raccorderait plus à son voisin.

⚠ LA COUPE EST EN QUARTS EXACTS, PAS PAR GOUTTIÈRE. Le nom des planches dit
`2x2`, et la coupe par gouttière de `emblemes.py` ne marcherait pas ici : sur la
planche des murs, la colonne de droite porte deux tuiles verticales qui se
touchent bout à bout, sans gouttière horizontale entre elles.

⚠ LES QUATRE CELLULES SONT DISTINCTES, VÉRIFIÉ. Les deux murs horizontaux ne
sont pas le même dessin, ni les deux verticaux, ni aucun des quatre angles :
l'outil l'asserte plutôt que de le supposer, sinon une planche livrée à moitié
produirait seize fichiers dont huit doublons silencieux.

    python3 tools/bords.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites
from PIL import Image
import numpy as np
from final128 import pal, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('bord')
GRILLES = (128, 64, 32)

# planche, camp, ouvrage, noms des quatre cellules dans l'ordre de lecture
# (haut-gauche, haut-droite, bas-gauche, bas-droite).
#
# ⚠ L'ORDRE DES ANGLES SE LIT SUR LA PLANCHE, il ne se devine pas : chaque
# cellule porte son angle dans le coin qu'il dessert, et la planche est donc sa
# propre légende — le coin haut-gauche de la planche porte l'angle nord-ouest.
PLANCHES = [
    ('base_bords_joueur_murs_2x2.png', 'j', False,
     ['mur_h_a', 'mur_v_a', 'mur_h_b', 'mur_v_b']),
    ('base_bords_joueur_angles_2x2.png', 'j', False,
     ['angle_no', 'angle_ne', 'angle_so', 'angle_se']),
    ('base_bords_ouvrage_murs_2x2.png', 'o', True,
     ['mur_h_a', 'mur_v_a', 'mur_h_b', 'mur_v_b']),
    ('base_bords_ouvrage_angles_2x2.png', 'o', True,
     ['angle_no', 'angle_ne', 'angle_so', 'angle_se']),
]


def quarts(chemin):
    """Les quatre quarts exacts d'une planche 2 × 2."""
    im = Image.open(chemin).convert('RGBA')
    L, H = im.size
    assert L % 2 == 0 and H % 2 == 0, f'{os.path.basename(chemin)} : {L}x{H} non divisible'
    l, h = L // 2, H // 2
    return [im.crop((i * l, j * h, (i + 1) * l, (j + 1) * h))
            for j in range(2) for i in range(2)]


n = 0
for fichier, camp, ouv, noms in PLANCHES:
    P = pal(ouv)
    cells = quarts(os.path.join(SRC, fichier))
    assert len(cells) == len(noms), f'{fichier} : {len(cells)} cellules pour {len(noms)} noms'

    # ⚠ LES QUATRE DOIVENT DIFFÉRER. Une planche à moitié remplie produirait des
    # doublons que rien ne signalerait — et l'alternance des variantes le long
    # d'un mur cesserait d'alterner sans qu'on le voie.
    brutes = [np.array(c) for c in cells]
    for a in range(len(brutes)):
        for b in range(a + 1, len(brutes)):
            assert not np.array_equal(brutes[a], brutes[b]), \
                f'{fichier} : les cellules {a} et {b} sont identiques'

    for cell, suffixe in zip(cells, noms):
        nom = f'bord_{camp}_{suffixe}'
        for N in GRILLES:
            # ⚠ PAS DE `recadrer` : voir l'en-tête. La position du trait DANS la
            # cellule est l'information ; la recentrer casserait le raccord.
            g = conditionner(cell, P, N)
            d = os.path.join(DST, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'{nom}.png'))
            n += 1
print(f'{n} fichiers écrits')
