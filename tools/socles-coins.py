#!/usr/bin/env python3
"""Socles de tourelle du joueur — colorisation des quatre coins.

Une seule source est dessinée, `67014.png`, sans aucun accent. Les trois socles
du jeu s'en déduisent en teintant les quatre pastilles de coin dans la couleur
de cible de la tourelle qui s'y pose : blanc = infanterie, rouge = véhicule,
jaune = aviation.

LES QUATRE PASTILLES SE MESURENT, ELLES NE SE SAISISSENT PAS. Elles sont les
quatre plus grandes composantes connexes de luminance > 110 de la source, et
elles sortent symétriques deux à deux :

    haut-gauche  y 179-261  x 211-318      haut-droit  y 179-263  x 706-814
    bas-gauche   y 575-664  x 198-311      bas-droit   y 575-664  x 713-827

Le teintage garde le relief : chaque pixel est remis à l'échelle par sa
luminance rapportée à la médiane de sa pastille, puis multiplié par la couleur
d'accent. Une pastille plate serait illisible à 40 px, une pastille teintée
garde ses arêtes.

Les trois couleurs sont ÉCHANTILLONNÉES sur les tourelles livrées, pas
inventées : le liseré de `67015` (casemate), de `67001` (créneau) et de `67002`
(batterie).
"""
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SOURCE = '67014.png'
ACCENTS = {
    'casemate': (254, 251, 237),   # blanc  — anti-infanterie, liseré de 67015
    'creneau': (245, 19, 19),      # rouge  — anti-véhicule,  liseré de 67001
    'batterie': (252, 202, 4),     # jaune  — anti-aérien,    liseré de 67002
}


def masque_sujet(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ~((g < 100) & (r > 110) & (b > 110) & (np.abs(r - b) < 90))


def pastilles(a, combien=4):
    """Les quatre plus grandes composantes claires : les coins du socle."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    L = 0.299 * r + 0.587 * g + 0.114 * b
    clair = masque_sujet(a) & (L > 110)
    lab, n = nd.label(clair, structure=np.ones((3, 3)))
    tailles = nd.sum(clair, lab, range(1, n + 1))
    gagnantes = np.argsort(-tailles)[:combien] + 1
    return [(lab == i) for i in gagnantes], L


def teinter(a, zones, L, accent):
    out = a.copy()
    for z in zones:
        ref = np.median(L[z])
        facteur = (L[z] / ref)[:, None]
        out[z] = np.clip(np.array(accent)[None, :] * facteur, 0, 255)
    return out


if __name__ == '__main__':
    import os
    os.makedirs('out', exist_ok=True)
    a = np.array(Image.open(SOURCE).convert('RGB')).astype(int)
    zones, L = pastilles(a)
    for z in zones:
        ys, xs = np.where(z)
        print(f'pastille  y {ys.min()}-{ys.max()}  x {xs.min()}-{xs.max()}  {z.sum()} px')
    for cle, accent in ACCENTS.items():
        t = teinter(a, zones, L, accent)
        nom = f'out/socle_def_j_{cle}.png'
        Image.fromarray(t.astype(np.uint8)).save(nom)
        print(f'{nom}  accent {accent}')
