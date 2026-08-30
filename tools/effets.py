#!/usr/bin/env python3
"""Lot 9 — les trois explosions, quatre images chacune, sur les trois grilles.

⚠⚠ CE LOT RENVERSE UN ARBITRAGE ÉCRIT. `INVENTAIRE-SPRITES.md` §8 et §10
disaient « zéro sprite d'effet […] tout est procédural », et le §8 ajoutait
« ne pas laisser cette ligne réapparaître dans un devis ». Ethan a tranché
l'inverse le 30/08 après avoir déposé les planches ; l'inventaire est amendé
dans le même lot, sans quoi la prochaine session découvrirait des sprites que
son document d'autorité interdit.

⚠ LES PROJECTILES NE SONT PAS TRAITÉS. `roquettes_2x2_1254x1254.png` reste une
source non découpée — écarté par Ethan le 30/08. La table ci-dessous ne le
porte pas, et l'ajouter demanderait un ancrage AUTRE que celui de ce fichier
(voir plus bas).

L'ANCRAGE EST LE CENTRE DE LA CELLULE, ET C'EST TOUT LE LOT. Les quatre images
d'une explosion n'ont pas la même taille — 414, 610, 821 puis 522 px de large
pour `normale` — parce que le souffle grandit puis retombe. Les recadrer chacune
sur son propre contenu, ce que fait `recadrer` de `final128.py`, les ramènerait
toutes à la même emprise : l'explosion cesserait de grandir et ne ferait plus
que changer de forme. C'est la faute exacte que `tourelles.py` raconte pour les
seize orientations, où recadrer chaque image sur sa boîte faisait glisser la
tourelle sur le sol.

Mesuré : horizontalement les quatre images sont centrées dans leur cellule à
1,5 px près sur les trois planches. Verticalement elles dérivent — jusqu'à
+161 px sur `champignon`, dont le champignon MONTE. Cette dérive EST
l'animation ; le centre de cellule la conserve, un recentrage la détruirait.

UNE SEULE ÉCHELLE PAR FAMILLE, prise sur l'image la plus large, pour que les
tailles relatives des quatre images tiennent. Et UNE SEULE PALETTE par famille,
pour que l'animation ne scintille pas d'une image à l'autre.

LA PALETTE N'EST PAS CELLE DU JEU, et c'est assumé. Une explosion est orange et
jaune ; la passer dans la rampe kaki ou la rampe de l'Ouvrage la détruirait.
Chaque famille reçoit donc SA palette, prise sur son propre dessin par coupe
médiane. Seize teintes : les rampes du dépôt en font 14 côté joueur et 19 côté
Ouvrage, et 16 tient dans ce registre. L'erreur mesurée à 16 teintes vaut 10,3 /
8,2 / 11,6 par canal sur les trois planches ; elle décroît sans palier net — 12
teintes donnent 12,1 / 9,2 / 12,7 et 24 donnent 6,9 / 6,0 / 6,6 —, donc 16 est
un choix dans une plage mesurée, pas un seuil découvert. Le dire ainsi plutôt
que d'inventer un palier.

    python3 tools/effets.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from PIL import Image
import numpy as np
from cond import est_fond, eroder

SRC = os.path.join(RACINE, 'art', 'sources')
DST = os.path.join(RACINE, 'art', 'sprites', 'effet')
GRILLES = (128, 64, 32)

# L'image la plus large de la famille occupe EMPRISE gros pixels sur une grille
# de 32. 30 sur 32 : une explosion couvre sa case et déborde un peu, là où un
# bâtiment s'arrête à 28 et une unité à 18–28.
EMPRISE = 30
TEINTES = 16

PLANCHES = [
    ('explosion_normale_4x1_4096x1024.png',    4, 1, 'explosion_normale'),
    ('explosion_aeronef_4x1_4096x1024.png',    4, 1, 'explosion_aeronef'),
    ('explosion_champignon_4x1_4096x1024.png', 4, 1, 'explosion_champignon'),
]


def cellules(fichier, nx, ny):
    im = Image.open(os.path.join(SRC, fichier)).convert('RGBA')
    W, H = im.size
    return [im.crop((i * W // nx, j * H // ny, (i + 1) * W // nx, (j + 1) * H // ny))
            for j in range(ny) for i in range(nx)]


def masque(cell, erosion=2):
    a = np.array(cell)
    return (~est_fond(a[..., :3])) & (a[..., 3] >= 128), a[..., :3]


def etendue(cell):
    """Demi-côté du carré centré sur la CELLULE qui contient tout le dessin.

    Centré sur la cellule, pas sur le contenu : c'est ce qui garde la dérive
    verticale de l'animation.
    """
    m, _ = masque(cell)
    ys, xs = np.where(m)
    cw, ch = cell.size
    return max(abs(xs.min() - cw / 2), abs(xs.max() - cw / 2),
               abs(ys.min() - ch / 2), abs(ys.max() - ch / 2))


def palette_de_la_famille(cells, k):
    """Coupe médiane sur TOUTES les images de la famille, prises ensemble."""
    pix = []
    for c in cells:
        m, rgb = masque(c)
        pix.append(rgb[m])
    ech = np.concatenate(pix)
    if len(ech) > 300000:
        ech = ech[np.random.default_rng(0).choice(len(ech), 300000, replace=False)]
    petite = Image.fromarray(ech.reshape(-1, 1, 3).astype(np.uint8), 'RGB')
    q = petite.quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    table = np.array(q.getpalette()[:3 * k], dtype=np.int32).reshape(k, 3)
    return table


def indices(cell, table, erosion=2):
    m, rgb = masque(cell)
    m = eroder(m, erosion)
    idx = np.full(m.shape, -1, dtype=np.int16)
    if m.any():
        d = ((rgb[m].astype(np.int32)[:, None, :] - table[None, :, :]) ** 2).sum(2)
        idx[m] = d.argmin(1)
    return idx


def reduire_vers(idx, demi, N, k):
    """Majorité par bloc, sur le carré de demi-côté `demi` centré sur la cellule."""
    H, W = idx.shape
    cx, cy = W / 2, H / 2
    cote = 2 * demi * 32.0 / EMPRISE          # le carré qui vaut N gros pixels
    x0f, y0f = cx - cote / 2, cy - cote / 2
    out = np.full((N, N), -1, dtype=np.int16)
    for by in range(N):
        ya = int(round(y0f + by * cote / N)); yb = max(ya + 1, int(round(y0f + (by + 1) * cote / N)))
        for bx in range(N):
            xa = int(round(x0f + bx * cote / N)); xb = max(xa + 1, int(round(x0f + (bx + 1) * cote / N)))
            bloc = idx[max(0, ya):max(0, yb), max(0, xa):max(0, xb)].ravel()
            if bloc.size == 0:
                continue
            v = np.where(bloc < 0, k, bloc)
            best = int(np.bincount(v, minlength=k + 1).argmax())
            out[by, bx] = -1 if best == k else best
    return out


def ecrire(g, table, chemin):
    N = g.shape[0]
    out = np.zeros((N, N, 4), np.uint8)
    for i in range(len(table)):
        s = (g == i)
        out[s, 0], out[s, 1], out[s, 2], out[s, 3] = table[i][0], table[i][1], table[i][2], 255
    Image.fromarray(out, 'RGBA').save(chemin)


def main():
    n = 0
    for fichier, nx, ny, prefixe in PLANCHES:
        cells = cellules(fichier, nx, ny)
        table = palette_de_la_famille(cells, TEINTES)
        demi = max(etendue(c) for c in cells)        # une seule échelle par famille
        for rang, cell in enumerate(cells, start=1):
            idx = indices(cell, table)
            for N in GRILLES:
                g = reduire_vers(idx, demi, N, TEINTES)
                d = os.path.join(DST, str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, table, os.path.join(d, f'{prefixe}_{rang}.png'))
                n += 1
    print(f'{n} fichiers écrits')
    return 0


if __name__ == '__main__':
    sys.exit(main())
