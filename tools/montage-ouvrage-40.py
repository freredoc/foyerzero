"""Montage À LA FORMULE DU RENDU, pas à l'œil : `cote_case_pct` et les deux
décalages sont pris tels quels dans les JSON d'ancres, et la case fait 40 px.
C'est le seul montage qui teste ce que le jeu fera.
"""
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tools'))
from cond import est_fond_sujet
from joueur_v2 import (EMPRISE_QUATRE_VINGT_CINQ, EMPRISE_QUATRE_VINGT_DIX,
                       emprise_de, unites_du_depot)

CASE, ZOOM = 40, 6
SRC = 'art/sources'


def rgba(n):
    a = np.asarray(Image.open(f'{SRC}/{n}.png').convert('RGB'))
    f = est_fond_sujet(a)
    b = np.dstack([a, np.where(f, 0, 255).astype(np.uint8)])
    ys, xs = np.nonzero(~f)
    return Image.fromarray(b[ys.min():ys.max() + 1, xs.min():xs.max() + 1])


def carre(n):
    """La tourelle entière, carrée : le fichier est déjà centré sur le pivot."""
    a = np.asarray(Image.open(f'{SRC}/{n}.png').convert('RGB'))
    f = est_fond_sujet(a)
    return Image.fromarray(np.dstack([a, np.where(f, 0, 255).astype(np.uint8)]))


def pose(im, cote):
    return im.resize((max(1, round(cote)), max(1, round(cote * im.size[1] / im.size[0]))),
                     Image.LANCZOS)


def case(coque, emprise, tourelle, anc, tuile):
    c = Image.new('RGBA', (CASE, CASE))
    c.paste(tuile, (0, 0))
    p = rgba(coque)
    f = emprise / 32 * CASE / max(p.size)
    p = p.resize((max(1, round(p.size[0] * f)), max(1, round(p.size[1] * f))), Image.LANCZOS)
    c.alpha_composite(p, ((CASE - p.size[0]) // 2, (CASE - p.size[1]) // 2))
    t = carre(tourelle)
    cote = anc['cote_case_pct'] / 100 * CASE
    t = t.resize((max(1, round(cote)), max(1, round(cote))), Image.LANCZOS)
    cx = CASE / 2 + anc['dx_case_pct'] / 100 * CASE
    cy = CASE / 2 + anc['dy_case_pct'] / 100 * CASE
    c.alpha_composite(t, (int(round(cx - t.size[0] / 2)), int(round(cy - t.size[1] / 2))))
    return c


if __name__ == '__main__':
    bl = json.load(open('art/sprites/ancres-blindes-ouvrage.json'))
    df = json.load(open('art/sprites/ancres-defense-ouvrage.json'))
    unites = unites_du_depot()
    tuile = Image.open('art/sprites/terrain/128/tile_sol_o_a.png').convert('RGB').resize((CASE, CASE), Image.LANCZOS)
    lignes = [[(n, emprise_de(n.split('_')[2] if False else n[len('off_o_'):].split('_')[0], unites),
                f"off_o_{n[len('off_o_'):].split('_')[0]}_tourelle", bl['coques'][n])
               for n in sorted(bl['coques'])],
              [(n, EMPRISE_QUATRE_VINGT_CINQ if n.split('_')[-1] in ('faucheuse', 'mortier', 'harpon')
                else EMPRISE_QUATRE_VINGT_DIX, f"def_o_{n.split('_')[-1]}", df['socles'][n])
               for n in sorted(df['socles'])]]
    cols = max(len(l) for l in lignes)
    p = Image.new('RGBA', (CASE * cols, CASE * len(lignes)))
    for j, ligne in enumerate(lignes):
        for i, (coque, emp, tour, anc) in enumerate(ligne):
            p.alpha_composite(case(coque, emp, tour, anc, tuile), (i * CASE, j * CASE))
            print(f'  {coque:30s} emprise {emp} · carré {anc["cote_case_pct"]:6.2f}% de case')
    p.resize((p.size[0] * ZOOM, p.size[1] * ZOOM), Image.NEAREST).save('MONTAGE-OUVRAGE-40.png')
