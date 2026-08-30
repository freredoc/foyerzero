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

⚠ NE PAS CONFONDRE LA GRILLE DE COUPE ET L'EMPRISE SUR LA CARTE. `nx × ny` dit
combien de cellules la PLANCHE contient ; `cases` dit combien de cases de carte
le sprite produit OCCUPE. Les deux grosses bases sont chacune une seule cellule
de planche — d'où `1, 1` — mais elles couvrent quatre et neuf cases de carte, et
sortent donc en `cases × N` pixels : 256 et 384 à la grille 128, 128 et 192 à la
64, 64 et 96 à la 32. Arbitré par Ethan le 30/08 : la 2 × 2 est un gros carré,
la 3 × 3 un hexagone.

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
from chemins import dossier_sprites
from PIL import Image
import numpy as np
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('carte')
GRILLES = (128, 64, 32)
EMPRISE = 30          # gros pixels sur 32 : un emblème remplit sa case de carte

NIVEAUX = [f'n{i}' for i in range(1, 10)]

# fichier, nx, ny, ouvrage, préfixe, noms, cases occupées sur la carte
PLANCHES = [
    ('S10_base_joueur_64-256.png',              3, 3, False, 'site_base_j',   NIVEAUX, 1),
    ('S10_base_ouvrage_64-256_v2.png',          3, 3, True,  'site_base_o',   NIVEAUX, 1),
    ('S10_camps_avant-postes_quartz_64-256.png', 3, 3, False, 'site_quartz',  NIVEAUX, 1),
    ('S10_camps_avant-postes_scories_64-256.png', 3, 3, False, 'site_scorie', NIVEAUX, 1),
    ('P10.3_poi_ressources_reacteur_64-256.png', 3, 1, False, 'poi',
     ['ressource_a', 'ressource_b', 'reacteur'], 1),
    ('P10.4_poi_bonus_64-256.png',              2, 2, False, 'poi_bonus',
     ['a', 'b', 'c', 'd'], 1),
    ('S10_base_ouvrage_2x2.png',                 1, 1, True, 'base_o_2x2', [''], 2),
    ('S10_base_ouvrage_3x3_finale.png',          1, 1, True, 'base_o_3x3', [''], 3),
]

# ⚠ L'EMPRISE S'ÉCRIT, ELLE NE SE DÉDUIT PAS. Un septième champ absent pourrait
# se compléter à 1 en silence ; il lèverait alors une base multi-cases ramenée à
# une case sans que rien ne le dise. Le tuple est donc de longueur fixe, et
# l'assertion tombe si une planche est ajoutée sans qu'on ait décidé.
for _p in PLANCHES:
    assert len(_p) == 7, f'{_p[0]} : emprise en cases manquante'


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
for fichier, nx, ny, ouv, prefixe, noms, cases in PLANCHES:
    P = pal(ouv)
    cells = cellules(os.path.join(SRC, fichier), nx, ny)
    assert len(cells) == len(noms), f'{fichier} : {len(cells)} cellules pour {len(noms)} noms'
    for cell, suffixe in zip(cells, noms):
        nom = f'{prefixe}_{suffixe}' if suffixe else prefixe
        for N in GRILLES:
            # Le sprite sort en `cases × N` pixels et son emprise croît d'autant :
            # sans quoi une grosse base tiendrait la place d'une seule case,
            # simplement dessinée plus gros.
            cote = cases * N
            g = conditionner(recadrer(cell, EMPRISE * cases * (N // 32), cote), P, cote)
            d = os.path.join(DST, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'{nom}.png'))
            n += 1
print(f'{n} fichiers écrits')
