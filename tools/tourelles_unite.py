#!/usr/bin/env python3
"""Lot 2 — tourelles des blindés, 16 orientations, deux camps.

Même ancrage que les tourelles de défense : pivot sur le centre du plus grand
disque inscrit, toile carrée commune aux seize orientations. Voir le §2 du
rapport du lot 1 pour la raison.

Ce qui change ici, c'est la provenance de l'orientation. Les tourelles de
défense avaient une planche par orientation, nommée. Celles-ci ont huit
orientations par planche, sans étiquette, et deux planches par tourelle.

**L'ordre vient d'Ethan, arbitré le 29/08** : lecture normale, de gauche à
droite puis de haut en bas, dans les deux camps, malgré la grille 4 × 2 côté
joueur et 2 × 4 côté Ouvrage.

    principales    N · NE · E · SE · S · SO · O · NO
    intermédiaires NNE · ENE · ESE · SSE · SSO · OSO · ONO · NNO

⚠ Je n'ai pas su le retrouver par la mesure. L'estimateur de direction de canon
qui retrouve 6/6 l'ordre des planches T échoue ici — ces tourelles sont plates,
à canon court, sur un socle octogonal large dont les coins sont plus éloignés du
pivot que le canon lui-même. Le test de structure miroir ne tranche pas non plus
(0,886 contre 0,953 sur le ratisseur joueur, 0,932 contre 0,892 sur le pilon).
La validation est donc visuelle et différée : voir --fluidite.

    python3 tools/tourelles_unite.py --fluidite  # contrôle de rotation
    python3 tools/tourelles_unite.py --ecrire
"""
import sys, os, argparse
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))

from PIL import Image
import numpy as np
from scipy import ndimage as nd
from cond import est_fond
from final128 import pal, conditionner, ecrire
from tourelles import pivot, demi_portee, recadrer_pivot

SRC = os.path.join(RACINE, 'art', 'sources')
DST = os.path.join(RACINE, 'art', 'sprites', 'tourelle-unite')
GRILLES = (128, 64, 32)

BLINDES = ['ratisseur', 'fendeur', 'belier', 'broyeur', 'pilon']
PRINCIPALES = ['n', 'ne', 'e', 'se', 's', 'so', 'o', 'no']
INTERMEDIAIRES = ['nne', 'ene', 'ese', 'sse', 'sso', 'oso', 'ono', 'nno']
# ordre de rotation, pour le contrôle de fluidité
ROTATION = ['n', 'nne', 'ne', 'ene', 'e', 'ese', 'se', 'sse',
            's', 'sso', 'so', 'oso', 'o', 'ono', 'no', 'nno']


def planches(cle, camp):
    """Rend (chemin, nx, ny, noms) pour les deux planches d'une tourelle."""
    if camp == 'j':
        return [(f'off_j_{cle}_tourelle_8_directions.png', 4, 2, PRINCIPALES),
                (f'off_j_{cle}_tourelle_8_intermediaires.png', 4, 2, INTERMEDIAIRES)]
    return [(f'tourelle_off_o_{cle}_8_directions.png', 2, 4, PRINCIPALES),
            (f'tourelle_off_o_{cle}_8_directions_intermediaires.png', 2, 4, INTERMEDIAIRES)]


def cellules(chemin, nx, ny):
    im = Image.open(chemin).convert('RGBA')
    W, H = im.size
    return [im.crop((i * W // nx, j * H // ny, (i + 1) * W // nx, (j + 1) * H // ny))
            for j in range(ny) for i in range(nx)]


def serie(cle, camp):
    """Les seize orientations, toile commune, pivot au centre."""
    brut = {}
    for fichier, nx, ny, noms in planches(cle, camp):
        chemin = os.path.join(SRC, fichier)
        for nom, im in zip(noms, cellules(chemin, nx, ny)):
            px, py, m = pivot(im)
            brut[nom] = (im, px, py, demi_portee(im, px, py, m), m)
    demi = max(v[3] for v in brut.values())
    return {n: recadrer_pivot(im, px, py, demi) for n, (im, px, py, _, _) in brut.items()}


def masque_ancre(im, C=760):
    m = ~est_fond(np.array(im.convert('RGB')).astype(int))
    d = nd.distance_transform_edt(m)
    py, px = np.unravel_index(d.argmax(), d.shape)
    o = np.zeros((C, C), bool)
    dy, dx = int(C // 2 - py), int(C // 2 - px)
    h, w = m.shape
    o[max(0, dy):min(C, h + dy), max(0, dx):min(C, w + dx)] = \
        m[max(0, -dy):min(h, C - dy), max(0, -dx):min(w, C - dx)]
    return o


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fluidite', action='store_true')
    ap.add_argument('--ecrire', action='store_true')
    a = ap.parse_args()
    if not (a.fluidite or a.ecrire):
        ap.error('choisir --fluidite ou --ecrire')

    if a.fluidite:
        # Une rotation correcte donne des IoU consécutifs élevés ET réguliers.
        # Un ordre faux fait chuter une ou deux transitions sans toucher aux
        # autres : c'est le creux qu'on cherche, pas la moyenne.
        print(f"{'tourelle':16s} {'IoU moyen':>10s} {'IoU mini':>9s} {'transition la plus basse':>26s}")
        for camp in ('j', 'o'):
            for cle in BLINDES:
                S = serie(cle, camp)
                M = {n: masque_ancre(im) for n, im in S.items()}
                v = []
                for k in range(16):
                    x, y = ROTATION[k], ROTATION[(k + 1) % 16]
                    v.append(((M[x] & M[y]).sum() / (M[x] | M[y]).sum(), f'{x}->{y}'))
                sc = [x[0] for x in v]
                pire = min(v)
                print(f'{camp + " " + cle:16s} {np.mean(sc):10.3f} {min(sc):9.3f} {pire[1]:>26s}')
        return 0

    n = 0
    for camp, ouv in (('j', False), ('o', True)):
        P = pal(ouv)
        for cle in BLINDES:
            for orient, im in serie(cle, camp).items():
                for N in GRILLES:
                    g = conditionner(im, P, N)
                    d = os.path.join(DST, str(N))
                    os.makedirs(d, exist_ok=True)
                    ecrire(g, P, os.path.join(d, f'off_{camp}_{cle}_{orient}.png'))
                    n += 1
    print(f'{n} fichiers écrits')
    return 0


if __name__ == '__main__':
    sys.exit(main())
