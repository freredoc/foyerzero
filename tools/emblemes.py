#!/usr/bin/env python3
"""Lot 6 — emblèmes de la carte du monde, POI et grosses bases de l'Ouvrage.

Quarante-cinq sprites : 36 emblèmes de site, 7 points d'intérêt, 2 grosses bases
de l'Ouvrage. Trois grilles chacun, soit 135 fichiers.

LA COUPE se fait par gouttière, jamais en tiers. Le §1 du rapport du lot 4
rappelle pourquoi : sur les planches de connexions, la coupe régulière tombait
deux fois dans la matière et tronquait les douze cellules.

DEUX PLANCHES SONT ÉCARTÉES, et c'est un arbitrage, pas un oubli :
  - `S10_base_ouvrage_64-256.png` (v1) perd contre `_v2`. Mesuré sur les neuf
    niveaux conditionnés : v1 se casse en **10,4 morceaux détachés par cellule**
    contre 2,8 pour v2, et sa progression du niveau 1 au 9 est de -4 % quand
    celle de v2 est de +21 %. Les trois autres planches d'emblème donnent un
    seul bloc.
  - `S10_base_joueur_32-128_comparaison.png` est un essai de grille.

LES GRILLES sont mesurées, pas supposées : 3 × 3 pour les quatre planches S10,
3 × 1 pour les POI de ressource, 2 × 2 pour les POI de bonus, 1 × 1 pour les
deux grosses bases.

⚠ L'ORDRE DES NEUF NIVEAUX est la lecture normale, de gauche à droite puis de
haut en bas. Il n'est pas vérifiable par la mesure : l'occupation croît de 38 %
sur la base du joueur et de 55 % sur les camps de quartz, ce qui va dans le bon
sens, mais elle est plate à -5 % sur les camps de scories, dont les neuf niveaux
ne diffèrent que par le tracé des veines.

⚠ Les noms des POI sont repris du nom de fichier, faute de mieux. Les sept
cellules ne sont pas identifiées une par une.

    python3 tools/emblemes.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from PIL import Image
import numpy as np
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = os.path.join(RACINE, 'art', 'sprites', 'carte')
GRILLES = (128, 64, 32)
EMPRISE = 30          # gros pixels sur 32 : un emblème remplit sa case de carte

NIVEAUX = [f'n{i}' for i in range(1, 10)]

PLANCHES = [
    ('S10_base_joueur_64-256.png',              3, 3, False, 'site_base_j',   NIVEAUX),
    ('S10_base_ouvrage_64-256_v2.png',          3, 3, True,  'site_base_o',   NIVEAUX),
    ('S10_camps_avant-postes_quartz_64-256.png', 3, 3, False, 'site_quartz',  NIVEAUX),
    ('S10_camps_avant-postes_scories_64-256.png', 3, 3, False, 'site_scorie', NIVEAUX),
    ('P10.3_poi_ressources_reacteur_64-256.png', 3, 1, False, 'poi',
     ['ressource_a', 'ressource_b', 'reacteur']),
    ('P10.4_poi_bonus_64-256.png',              2, 2, False, 'poi_bonus',
     ['a', 'b', 'c', 'd']),
    ('ChatGPT Image 28 août 2026, 21_16_42.png', 1, 1, True, 'base_o_2x2', ['']),
    ('file_0000000077f0820a88f6a88415d71d25.png', 1, 1, True, 'base_o_3x3', ['']),
]


def bandes(v, mini=30):
    o, d = [], None
    for i, x in enumerate(v):
        if x and d is None:
            d = i
        if not x and d is not None:
            o.append((d, i)); d = None
    if d is not None:
        o.append((d, len(v)))
    return [b for b in o if b[1] - b[0] > mini]


def cellules(chemin, nx, ny):
    """Coupe par gouttière, avec assertion sur la grille attendue."""
    im = Image.open(chemin).convert('RGBA')
    m = ~est_fond(np.array(im.convert('RGB')).astype(int))
    H, W = m.shape
    bx, by = bandes(m.any(0)), bandes(m.any(1))
    if (len(bx), len(by)) != (nx, ny):
        # une planche à sprite unique peut se lire en plusieurs bandes
        if nx == ny == 1:
            bx = by = [(0, W)]
        else:
            raise AssertionError(f'{os.path.basename(chemin)} : grille '
                                 f'{len(bx)}x{len(by)} au lieu de {nx}x{ny}')
    cx = [0] + [(bx[i][1] + bx[i + 1][0]) // 2 for i in range(len(bx) - 1)] + [W]
    cy = [0] + [(by[j][1] + by[j + 1][0]) // 2 for j in range(len(by) - 1)] + [H]
    return [im.crop((cx[i], cy[j], cx[i + 1], cy[j + 1]))
            for j in range(len(cy) - 1) for i in range(len(cx) - 1)]


n = 0
for fichier, nx, ny, ouv, prefixe, noms in PLANCHES:
    P = pal(ouv)
    cells = cellules(os.path.join(SRC, fichier), nx, ny)
    assert len(cells) == len(noms), f'{fichier} : {len(cells)} cellules pour {len(noms)} noms'
    for cell, suffixe in zip(cells, noms):
        nom = f'{prefixe}_{suffixe}' if suffixe else prefixe
        for N in GRILLES:
            g = conditionner(recadrer(cell, EMPRISE * (N // 32), N), P, N)
            d = os.path.join(DST, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'{nom}.png'))
            n += 1
print(f'{n} fichiers écrits')
