#!/usr/bin/env python3
"""Aéronefs du joueur — extraction des deux poses de canon utiles.

Deux planches portent six appareils chacune, canon braqué à des angles
différents. On n'en garde que deux par planche : un canon à gauche, un à droite.

LE DÉCOUPAGE NE SE FAIT PAS À LA GRILLE. Les six appareils débordent des cases
de 1024 : le canon du rang du bas remonte dans la case du dessus. Découper à la
grille coupait le canon net et faisait croire à un rognage de la source. Chaque
appareil est donc isolé par composante connexe.

L'ANGLE SE MESURE, il ne se juge pas : `dx` est l'écart entre le bout du canon
— le centre de la ligne la plus haute — et l'axe du fuselage — le centre de la
ligne la plus large, celle des nacelles.

LA PAIRE RETENUE EST LA PLUS FRANCHE, À SYMÉTRIE PRÈS. Deux pièges opposés :
prendre les deux extrêmes donne un braquage inégal — 193 px à gauche contre 166
à droite se lit comme un défaut de dessin ; prendre la paire parfaitement
symétrique donne, sur l'Épervier, −66 / +66, soit un canon qui bouge à peine et
ne se distingue plus de la pose de face. Le score retenu est donc
`min(|g|, |d|) − |écart|`, qui garde −164 / +166 sur l'un et −220 / +218 sur
l'autre.

LES TROIS POSES SE CALENT SUR LE FUSELAGE, pas sur leur boîte englobante.
Centrer chaque pose sur sa propre boîte ferait sauter l'appareil d'une pose à
l'autre, puisque le canon qui penche déplace la boîte. L'ancre est le centre de
la ligne la plus large, reportée à l'identique depuis la pose de face.

    python3 tools/canons-aeronefs.py
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC = 'sources-brutes'
DST = 'sorties'
COTE = 1024

# planche → (pose de face qui donne l'échelle et l'ancre, nom de sortie)
PLANCHES = {
    '72952.png': ('72949.png', 'off_j_busard'),
    '72953.png': ('72951.png', 'off_j_enclume'),
}


def masque(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ~((g < 100) & (r > 110) & (b > 110) & (np.abs(r - b) < 90))


def fuselage(m):
    """(centre x, y, largeur) de la ligne la plus large : l'axe des nacelles."""
    larg = m.sum(axis=1)
    y = int(np.argmax(larg))
    xs = np.where(m[y])[0]
    return (xs.min() + xs.max() + 1) / 2, y, int(larg.max())


def bout_du_canon(m):
    ys = np.where(m.any(axis=1))[0]
    y = int(ys.min())
    xs = np.where(m[y])[0]
    return (xs.min() + xs.max() + 1) / 2


def appareils(chemin):
    """Les six appareils d'une planche, isolés par composante connexe."""
    a = np.array(Image.open(chemin).convert('RGB')).astype(int)
    m = masque(a)
    lab, n = nd.label(m, np.ones((3, 3)))
    tailles = nd.sum(m, lab, range(1, n + 1))
    out = []
    for i in np.argsort(-tailles)[:6] + 1:
        z = (lab == i)
        cx, cy, L = fuselage(z)
        out.append({'masque': z, 'image': a, 'dx': bout_du_canon(z) - cx,
                    'cx': cx, 'cy': cy, 'largeur': L})
    return out


def paire_retenue(liste):
    """Le couple gauche/droite au braquage le plus franc, à symétrie près."""
    gauches = [p for p in liste if p['dx'] < 0]
    droites = [p for p in liste if p['dx'] > 0]
    def score(c):
        g, d = abs(c[0]['dx']), abs(c[1]['dx'])
        return min(g, d) - abs(g - d)
    return max(((g, d) for g in gauches for d in droites), key=score)


def poser(p, echelle, ancre):
    """Recadre à l'échelle de la pose de face, fuselage sur l'ancre."""
    ys, xs = np.where(p['masque'])
    dec = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
    dec[ys - ys.min(), xs - xs.min(), :3] = p['image'][ys, xs]
    dec[ys - ys.min(), xs - xs.min(), 3] = 255
    im = Image.fromarray(dec, 'RGBA')
    if abs(echelle - 1) > 0.002:
        im = im.resize((max(1, round(im.width * echelle)),
                        max(1, round(im.height * echelle))), Image.LANCZOS)
    ax = (p['cx'] - xs.min()) * echelle
    ay = (p['cy'] - ys.min()) * echelle
    toile = Image.new('RGBA', (COTE, COTE), (0, 0, 0, 0))
    x0, y0 = round(ancre[0] - ax), round(ancre[1] - ay)
    toile.alpha_composite(im, (x0, y0))
    deborde = x0 < 0 or y0 < 0 or x0 + im.width > COTE or y0 + im.height > COTE
    fond = Image.new('RGB', (COTE, COTE), (255, 0, 255))
    fond.paste(toile, (0, 0), toile)
    return fond, deborde


def main():
    os.makedirs(DST, exist_ok=True)
    for planche, (face, nom) in PLANCHES.items():
        a = np.array(Image.open(os.path.join(SRC, face)).convert('RGB')).astype(int)
        mf = masque(a)
        fx, fy, fL = fuselage(mf)

        liste = appareils(os.path.join(SRC, planche))
        g, d = paire_retenue(liste)
        print(f'{nom} : face L={fL}  '
              f"retenus dx={g['dx']:+.0f} et {d['dx']:+.0f} "
              f"(sur {sorted(round(p['dx']) for p in liste)})")
        for p, suffixe in ((g, '_canon_g'), (d, '_canon_d')):
            echelle = fL / p['largeur']
            img, deborde = poser(p, echelle, (fx, fy))
            img.save(os.path.join(DST, nom + suffixe + '.png'))
            print(f'   {nom}{suffixe}  échelle ×{echelle:.3f}'
                  + ('  ⚠ DÉBORDE DE LA TOILE' if deborde else ''))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
