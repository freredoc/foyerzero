#!/usr/bin/env python3
"""Lot 4 — socles de tourelle avec leurs quatre états de connexion.

Les murs ne se raccordent qu'à l'est et à l'ouest, d'où quatre états. Arbitré
par Ethan le 28/08, confirmé le 29/08.

⚠ LA COUPE. Les planches `socles_*_connexions_3x4` ne se coupent PAS en tiers.
Les bandes occupées vont de 159 à 388, 397 à 622 et 630 à 860, quand les coupes
naïves tombent à 341 et 682 — soit deux fois dans la matière. Les douze cellules
sortaient tronquées, et la « pièce large de 341 px » décrite au §3 du rapport du
lot 3 n'existe pas : c'était la colonne de gauche qui débordait dans la
suivante. Même mécanisme que `P6_4_flux_joueur` au lot 0.

La coupe se fait donc par gouttière, et une fois faite la structure est nette.

L'ORDRE DES RANGÉES est mesuré, pas supposé, par l'asymétrie du contenu autour
du pivot — écart entre la portée à droite et la portée à gauche :

    rangée 0   174 px de large, D-G = +13   le plus étroit, symétrique  -> isolé
    rangée 1   211 px,          D-G = +49   déborde à droite            -> est
    rangée 2   212 px,          D-G = -24   déborde à gauche            -> ouest
    rangée 3   229 px,          D-G = +10   le plus large, symétrique   -> traversant

Le même profil se retrouve côté Ouvrage — 184 / 201 (+42) / 194 (-39) / 217 —
et sur les trois colonnes de chaque planche. Les trois colonnes ne diffèrent que
par l'accent : blanc, rouge, jaune, donc casemate, créneau, batterie.

    python3 tools/connexions.py --ecrire
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites
from PIL import Image
import numpy as np
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('socle')
GRILLES = (128, 64, 32)
EMPRISE = 28

ETATS = ['isole', 'est', 'ouest', 'traversant']
SOCLES = ['casemate', 'creneau', 'batterie']
PLANCHES = [('socles_j_tourelles_connexions_3x4.png', 'j', False),
            ('socles_o_tourelles_connexions_3x4.png', 'o', True)]


def bandes(v, mini=20):
    o, d = [], None
    for i, x in enumerate(v):
        if x and d is None:
            d = i
        if not x and d is not None:
            o.append((d, i)); d = None
    if d is not None:
        o.append((d, len(v)))
    return [b for b in o if b[1] - b[0] > mini]


def coupes(m):
    """Coupes au milieu des gouttières, jamais au tiers ni à la moitié."""
    H, W = m.shape
    bx, by = bandes(m.any(0)), bandes(m.any(1))
    cx = [0] + [(bx[i][1] + bx[i + 1][0]) // 2 for i in range(len(bx) - 1)] + [W]
    cy = [0] + [(by[i][1] + by[i + 1][0]) // 2 for i in range(len(by) - 1)] + [H]
    return cx, cy, len(bx), len(by)


n = 0
for fichier, camp, ouv in PLANCHES:
    im = Image.open(os.path.join(SRC, fichier))
    m = ~est_fond(np.array(im.convert('RGB')).astype(int))
    cx, cy, nx, ny = coupes(m)
    assert (nx, ny) == (3, 4), f'{fichier} : grille {nx}x{ny} inattendue'
    P = pal(ouv)
    for r, etat in enumerate(ETATS):
        for c, socle in enumerate(SOCLES):
            cell = im.crop((cx[c], cy[r], cx[c + 1], cy[r + 1]))
            for N in GRILLES:
                g = conditionner(recadrer(cell, EMPRISE * (N // 32), N), P, N)
                d = os.path.join(DST, str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, P, os.path.join(d, f'socle_def_{camp}_{socle}_{etat}.png'))
                n += 1
print(f'{n} fichiers écrits')
