#!/usr/bin/env python3
"""Recoupage des planches d'infanterie du joueur — v2.

Une planche = une escouade = un sprite. On ne redessine rien : on découpe une
figure maîtresse au pixel près et on la repose N fois, dans la formation
mesurée sur la planche du Guetteur (67099), qui est la seule à cinq figures.

Ratios de formation, mesurés sur 67099 (W = 156, H = 462) :
    haut   cx = 512            ytop = y0
    milieu cx = 512 ± 1.19 W   ytop = y0 + 0.398 H
    bas    cx = 512 ± 0.56 W   ytop = y0 + 0.714 H
et pour une paire, l'écart entre centres du rang du bas : 1.115 W.

Aucun rééchantillonnage : les pixels copiés sont ceux de la source.
"""
import numpy as np
from PIL import Image

MAGENTA = (255, 0, 255)
COTE = 1024


def masque_sujet(a):
    """Vrai là où le pixel n'est pas du fond magenta (frange comprise)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fond = (g < 100) & (r > 110) & (b > 110) & (np.abs(r - b) < 90)
    return ~fond


def figures(chemin, mini=3000):
    """Rend les figures triées par aire décroissante : (masque, boite)."""
    from scipy import ndimage as nd
    a = np.array(Image.open(chemin).convert('RGB')).astype(int)
    m = masque_sujet(a)
    lab, n = nd.label(m, structure=np.ones((3, 3)))
    out = []
    for i, s in enumerate(nd.find_objects(lab), start=1):
        aire = int((lab[s] == i).sum())
        if aire >= mini:
            out.append((aire, s, i, lab, a))
    out.sort(key=lambda t: -t[0])
    return out


def decoupe(chemin, rang=0):
    """La figure de rang donné, en (pixels RGB, masque booléen)."""
    aire, s, i, lab, a = figures(chemin)[rang]
    m = (lab[s] == i)
    return a[s].astype(np.uint8), m


def toile():
    t = np.zeros((COTE, COTE, 3), np.uint8)
    t[:, :] = MAGENTA
    return t


def poser(t, px, m, cx, ytop):
    """Colle la figure, pixels masqués seulement, ancrée par son centre en x."""
    h, w = m.shape
    x0 = int(round(cx - w / 2))
    y0 = int(round(ytop))
    assert 0 <= x0 and x0 + w <= COTE, f'déborde en x : {x0}..{x0 + w}'
    assert 0 <= y0 and y0 + h <= COTE, f'déborde en y : {y0}..{y0 + h}'
    zone = t[y0:y0 + h, x0:x0 + w]
    zone[m] = px[m]


def formation_cinq(px, m):
    """Une escouade de cinq, formation du Guetteur, centrée sur la toile."""
    h, w = m.shape
    largeur = 3.38 * w          # 2 × 1.19 W + W
    hauteur = 1.714 * h         # 0.714 H + H
    x_centre = COTE / 2
    y0 = (COTE - hauteur) / 2
    assert largeur <= COTE, f'formation trop large : {largeur:.0f}'
    t = toile()
    # du plus loin au plus proche : le rang du bas passe par-dessus.
    poser(t, px, m, x_centre, y0)
    poser(t, px, m, x_centre - 1.19 * w, y0 + 0.398 * h)
    poser(t, px, m, x_centre + 1.19 * w, y0 + 0.398 * h)
    poser(t, px, m, x_centre - 0.56 * w, y0 + 0.714 * h)
    poser(t, px, m, x_centre + 0.56 * w, y0 + 0.714 * h)
    return t


def formation_deux(px, m):
    """Une paire, écart du rang du bas du Guetteur, centrée sur la toile."""
    h, w = m.shape
    ecart = 1.115 * w
    t = toile()
    poser(t, px, m, COTE / 2 - ecart / 2, (COTE - h) / 2)
    poser(t, px, m, COTE / 2 + ecart / 2, (COTE - h) / 2)
    return t


def ecrire(t, nom):
    Image.fromarray(t).save(nom)
    a = t.astype(int)
    n = int(masque_sujet(a).sum())
    print(f'{nom} : {n} px opaques')


if __name__ == '__main__':
    import shutil, os
    os.makedirs('out', exist_ok=True)

    # Perceurs — 3 → 5, les deux poses. Figure maîtresse = la plus grande.
    for src, nom in [('67100.png', 'off_j_perceurs.png'),
                     ('67101.png', 'off_j_perceurs_def.png')]:
        px, m = decoupe(src)
        ecrire(formation_cinq(px, m), f'out/{nom}')

    # Carapace — 1 → 2, les deux poses.
    for src, nom in [('67093.png', 'off_j_carapace.png'),
                     ('67090.png', 'off_j_carapace_def.png')]:
        px, m = decoupe(src)
        ecrire(formation_deux(px, m), f'out/{nom}')

    # Inchangées, seulement renommées.
    for src, nom in [('67102.png', 'off_j_meute.png'),
                     ('67103.png', 'off_j_meute_def.png'),
                     ('67099.png', 'off_j_guetteur.png'),
                     ('67098.png', 'off_j_guetteur_def.png'),
                     ('67091.png', 'off_j_fouisseurs.png')]:
        shutil.copy(src, f'out/{nom}')
        print(f'out/{nom} : copie conforme de {src}')
