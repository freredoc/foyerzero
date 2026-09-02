#!/usr/bin/env python3
"""Lot 1 — tourelles de défense (16 orientations) et merlons (4 connexions).

Le point dur des tourelles n'est pas la découpe, c'est l'ANCRAGE. Chaque
orientation a été générée dans une image séparée, et le socle n'y occupe pas la
même place : mesuré sur les seize planches, le centre du socle se déplace de 45
à 80 px pour un socle de 80 px de large. Conditionner chaque orientation sur sa
propre boîte englobante — ce que fait `recadrer` — ferait glisser la tourelle
sur le sol pendant qu'elle vise.

L'ancre retenue est le centre du plus grand disque inscrit, obtenu par
transformée de distance. C'est le point le plus épais de la forme, donc le
socle, et il ne demande aucun paramètre à régler. Les seize orientations d'une
même tourelle partagent ensuite une toile carrée unique, dimensionnée sur
l'union des seize, avec le pivot au centre exact.

    python3 tools/tourelles.py --mesurer   # dispersion et noyau stable
    python3 tools/tourelles.py --ecrire    # produire les trois grilles
"""
import sys, os, argparse
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites

from PIL import Image
import numpy as np
from scipy import ndimage as nd
from cond import est_fond
from final128 import pal, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites()
GRILLES = (128, 64)   # la 32 est sortie au lot PIXELS : ni le jeu ni les tests ne la lisaient

# Les seize planches, dans l'ordre de rotation horaire depuis le nord.
# Le nom de fichier donne l'orientation ; l'ordre ci-dessous donne l'indice.
ORIENTATIONS = [
    ('n', 1), ('nne', 9), ('ne', 2), ('ene', 10),
    ('e', 3), ('ese', 11), ('se', 4), ('sse', 12),
    ('s', 5), ('sso', 13), ('so', 6), ('oso', 14),
    ('o', 7), ('ono', 15), ('no', 8), ('nno', 16),
]

# Les douze cellules d'une planche T, grille 3 colonnes × 4 rangées.
# Identification MESURÉE, non devinée :
#   - l'accent donne la cible, comme pour les unités : blanc = infanterie,
#     rouge = véhicule, jaune = aviation. Sur T01, les cellules 0/3/6/9 sont à
#     15-25 % de blanc et 0 % de rouge ; 1/4/7/10 à 11-24 % de rouge ;
#     2/5/8/11 à 10-42 % de jaune.
#   - la longueur du canon donne la portée côté joueur : 160-165 px pour les
#     cellules 0-2, 224-227 px pour les cellules 3-5.
#   - le camp se lit au socle : disque inscrit de 105 px pour les cellules 0-5,
#     de 27 à 35 px pour les cellules 6-11, qui portent aussi la rampe A.
CELLULES = [
    ('def_j_casemate',  False), ('def_j_creneau',  False), ('def_j_batterie',  False),
    ('def_j_faucheuse', False), ('def_j_mortier',  False), ('def_j_harpon',    False),
    ('def_o_casemate',  True),  ('def_o_creneau',  True),  ('def_o_batterie',  True),
    ('def_o_faucheuse', True),  ('def_o_mortier',  True),  ('def_o_harpon',    True),
]

# --- pose de la tourelle sur son socle -------------------------------------
# Arbitré par Ethan le 29/08 : la base de la tourelle occupe 45 % de la largeur
# de la tuile. Mesuré sur planche d'échelles, entre 15 % (le creux du socle) et
# 70 % (la tourelle déborde).
REMPLISSAGE = 0.45
# Repli pour l'Ouvrage, dont la base ne se mesure pas : on cale son étendue sur
# celle que la règle des 45 % donne au joueur, soit 63 % de la tuile.
ETENDUE_OUVRAGE = 0.634
# Le logement n'est pas au centre de la tuile, et son décalage dépend de la
# FAMILLE de socle, pas du camp. Mesuré sur les douze socles, en pixels de la
# grille 128, écart horizontal partout sous 0,7 px donc ignoré :
#   socles de tourelle joueur   -7,7 / -6,1 / -7,1   ->  -7,0
#   socles d'artillerie joueur  +8,5 / +8,8 / +8,7   ->  +8,7
#   socles de tourelle Ouvrage  +2,7 / +3,1 / +2,5   ->  +2,8
#   socles d'artillerie Ouvrage +14,5 / +14,0 / +13,9 -> +14,1
DECALAGE = {'def_j_casemate': -7.0, 'def_j_creneau': -7.0, 'def_j_batterie': -7.0,
            'def_j_faucheuse': 8.7, 'def_j_mortier': 8.7, 'def_j_harpon': 8.7,
            'def_o_casemate': 2.8, 'def_o_creneau': 2.8, 'def_o_batterie': 2.8,
            'def_o_faucheuse': 14.1, 'def_o_mortier': 14.1, 'def_o_harpon': 14.1}

MERLONS = [('merlons_j_connexions_2x2.png', 'def_j_merlon', False),
           ('merlons_o_connexions_2x2.png', 'def_o_merlon', True)]
# Arbitrage du 28/08 : les murs ne se raccordent qu'à l'est et à l'ouest.
CONNEXIONS = ['isole', 'est', 'ouest', 'traversant']


def planche(indice):
    for f in os.listdir(SRC):
        if f.startswith('T%02d_' % indice) and f.endswith('.png'):
            return os.path.join(SRC, f)
    raise FileNotFoundError('planche T%02d absente' % indice)


def cellule(chemin, k, nx=3, ny=4):
    im = Image.open(chemin).convert('RGBA')
    W, H = im.size
    j, i = divmod(k, nx)
    return im.crop((i * W // nx, j * H // ny, (i + 1) * W // nx, (j + 1) * H // ny))


def pivot(im):
    """Centre du plus grand disque inscrit : le socle, sans paramètre à régler."""
    m = ~est_fond(np.array(im.convert('RGB')).astype(int))
    d = nd.distance_transform_edt(m)
    y, x = np.unravel_index(d.argmax(), d.shape)
    return float(x), float(y), m


def demi_portee(im, px, py, m):
    """Distance du pivot au pixel opaque le plus lointain."""
    ys, xs = np.where(m)
    return float(np.sqrt((xs - px) ** 2 + (ys - py) ** 2).max())


def recadrer_pivot(im, px, py, demi):
    """Toile carrée centrée sur le pivot, sans redimensionner la source."""
    c = int(np.ceil(demi)) * 2 + 1
    out = Image.new('RGBA', (c, c), (255, 0, 255, 255))
    out.paste(im, (c // 2 - int(round(px)), c // 2 - int(round(py))))
    return out


def diametre_base(m):
    """Diamètre du plus grand disque inscrit : la base de la tourelle."""
    return 2.0 * nd.distance_transform_edt(m).max()


def serie(k):
    """Les seize orientations d'une tourelle, posées sur le logement du socle.

    La toile n'est plus dimensionnée sur l'étendue des seize mais sur le
    REMPLISSAGE voulu : la base de la tourelle doit occuper 45 % de la largeur
    de la tuile. La toile est donc commune aux seize par construction, et le
    pivot y est placé sur le logement du socle, pas au centre.
    """
    nom_def = CELLULES[k][0]
    dy = DECALAGE[nom_def] / 128.0
    brut = []
    for nom, ind in ORIENTATIONS:
        im = cellule(planche(ind), k)
        px, py, m = pivot(im)
        ys, xs = np.where(m)
        cheby = max(abs(xs - px).max(), abs(ys - py).max())   # demi-côté carré
        brut.append((nom, im, px, py, diametre_base(m), cheby))
    # La base se mesure par le disque inscrit. Ça ne vaut que si la matière
    # est plus épaisse que le disque qu'on cherche — vrai pour le joueur, dont
    # l'épaisseur médiane est de 12 à 14 px, faux pour l'Ouvrage, dessiné en
    # filigrane à 3 px. Là-bas le disque inscrit mesure l'épaisseur du trait et
    # la mise à l'échelle explose : l'étendue passait à 98 % de la tuile contre
    # 63 % côté joueur, et 119 sprites sur 192 débordaient.
    # On retombe donc sur l'étendue pour l'Ouvrage, calée sur le ratio que la
    # règle des 45 % produit côté joueur.
    if CELLULES[k][1]:                       # camp Ouvrage
        # Aucune règle d'échelle ne tient sur ces sprites : mise à l'échelle sur
        # le disque inscrit, l'étendue passe à 98 % de la tuile et 119 sprites
        # sur 192 débordent ; sur l'étendue, elle tombe à 26 % et des sprites
        # sortent vides. On garde donc le cadrage du lot 1 — toile commune sur
        # la portée maximale — en attendant que l'art soit redessiné. Voir le §
        # « filigrane » du rapport.
        cote = int(np.ceil(max(demi_portee(im, px, py, ~est_fond(np.array(im.convert('RGB')).astype(int)))
                               for _, im, px, py, _, _ in brut))) * 2 + 1
    else:
        base = float(np.mean([b[4] for b in brut]))
        cote = int(round(base / REMPLISSAGE))
    out = []
    for nom, im, px, py, _, _ in brut:
        toile = Image.new('RGBA', (cote, cote), (255, 0, 255, 255))
        toile.paste(im, (int(round(cote * 0.5 - px)),
                         int(round(cote * (0.5 + dy) - py))))
        out.append((nom, toile))
    return out


def noyau(k, mode):
    """Pixels couverts par les seize orientations à la fois."""
    tot = None
    for nom, ind in ORIENTATIONS:
        im = cellule(planche(ind), k)
        px, py, m = pivot(im)
        if mode == 'boite':
            ys, xs = np.where(m); px, py = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        C = 700
        o = np.zeros((C, C), np.int32)
        dy, dx = int(C // 2 - py), int(C // 2 - px)
        h, w = m.shape
        o[max(0, dy):min(C, h + dy), max(0, dx):min(C, w + dx)] = \
            m[max(0, -dy):min(h, C - dy), max(0, -dx):min(w, C - dx)]
        tot = o if tot is None else tot + o
    return int((tot == 16).sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mesurer', action='store_true')
    ap.add_argument('--ecrire', action='store_true')
    a = ap.parse_args()
    if not (a.mesurer or a.ecrire):
        ap.error('choisir --mesurer ou --ecrire')

    if a.mesurer:
        print(f"{'tourelle':18s} {'noyau boite':>12s} {'noyau pivot':>12s} {'gain':>6s}")
        for k, (nom, ouv) in enumerate(CELLULES):
            b, p = noyau(k, 'boite'), noyau(k, 'pivot')
            print(f'{nom:18s} {b:12d} {p:12d} {p / max(1, b):6.2f}')
        return 0

    n = 0
    for k, (nom, ouv) in enumerate(CELLULES):
        P = pal(ouv)
        for orient, im in serie(k):
            for N in GRILLES:
                g, matiere = conditionner(im, P, N)
                d = os.path.join(DST, 'defense', str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, P, os.path.join(d, f'{nom}_{orient}.png'), matiere)
                n += 1
    for fichier, nom, ouv in MERLONS:
        P = pal(ouv)
        chemin = os.path.join(SRC, fichier)
        for k, conn in enumerate(CONNEXIONS):
            im = cellule(chemin, k, nx=2, ny=2)
            px, py, m = pivot(im)
            im = recadrer_pivot(im, px, py, demi_portee(im, px, py, m))
            for N in GRILLES:
                g, matiere = conditionner(im, P, N)
                d = os.path.join(DST, 'defense', str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, P, os.path.join(d, f'{nom}_{conn}.png'), matiere)
                n += 1
    print(f'{n} fichiers écrits')
    return 0


if __name__ == '__main__':
    sys.exit(main())
