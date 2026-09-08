"""Fabrique `socle_def_o_batterie` — le socle à liseré jaune — par SUBSTITUTION
DE TON sur le socle rouge `67056`.

POURQUOI PAS UN JET. Les trois socles de tourelle ne diffèrent que par la
couleur du liseré ; le dessin, lui, doit être le MÊME, sinon trois tourelles
posées côte à côte n'ont pas la même assise. Un quatrième jet aurait redessiné
la caisse. La substitution garantit l'inverse : hors du liseré, la sortie est
identique au rouge, bit pour bit — le script le vérifie et le dit.

LA MÉTHODE. Le liseré rouge est repéré par sa TEINTE (secteur rouge) et non par
une distance à `#E43E32` : le dessin porte trois tons de rouge plus les pixels
de bord mélangés à l'ardoise, et une distance les aurait coupés en deux. Chaque
pixel retenu est projeté sur la rampe rouge de `FICHE-STYLE.md`
(`#8A1E17` → `#E43E32`), et sa position sur cette rampe est reportée sur la
rampe jaune (`#A67018` → `#F5B636`). L'ombre reste l'ombre, la lumière reste la
lumière, et les deux teintes de sortie sont celles de la fiche.
"""
import numpy as np, colorsys, sys, os
from PIL import Image

ROUGE = (np.array([0x8A, 0x1E, 0x17], float), np.array([0xE4, 0x3E, 0x32], float))
JAUNE = (np.array([0xA6, 0x70, 0x18], float), np.array([0xF5, 0xB6, 0x36], float))


def masque_accent_rouge(rgb):
    """Secteur de teinte rouge, chroma franche, et pas le fond magenta."""
    a = rgb.astype(float)
    mx = a.max(2); mn = a.min(2); chroma = mx - mn
    r, v, b = a[..., 0], a[..., 1], a[..., 2]
    fond = (r > 150) & (b > 150) & (v < 100)
    # ⚠ « rouge dominant » NE SUFFIT PAS : le jaune aussi a le rouge pour canal
    # dominant. Ce qui les sépare est l'écart vert−bleu rapporté à la chroma —
    # 0,07 sur `#E43E32`, 0,67 sur `#F5B636`. Sans ce test, le contrôle
    # « rouge restant » relisait la sortie jaune comme du rouge et se taisait.
    rouge = (r == mx) & (chroma > 25) & (v - b < 0.35 * chroma)
    return rouge & ~fond


def substituer(rgb, masque):
    a = rgb.astype(float)
    d = ROUGE[1] - ROUGE[0]
    px = a[masque]
    t = ((px - ROUGE[0]) @ d) / (d @ d)          # position sur la rampe rouge
    t = np.clip(t, 0.0, 1.0)[:, None]
    sortie = a.copy()
    sortie[masque] = JAUNE[0] + t * (JAUNE[1] - JAUNE[0])
    return np.clip(sortie, 0, 255).astype(np.uint8)


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    rgb = np.asarray(Image.open(src).convert('RGB'))
    m = masque_accent_rouge(rgb)
    out = substituer(rgb, m)
    Image.fromarray(out).save(dst)

    # Contrôle 1 — hors liseré, rien n'a bougé.
    ecart = int((out[~m] != rgb[~m]).any(-1).sum())
    # Contrôle 2 — plus un pixel de teinte rouge franche dans la sortie.
    reste = int(masque_accent_rouge(out).sum())
    # Contrôle 3 — la surface d'accent est conservée.
    print(f'{os.path.basename(dst)} : {int(m.sum())} px de liseré substitués '
          f'({100 * m.sum() / (rgb.shape[0] * rgb.shape[1]):.2f} % de l\'image) | '
          f'pixels modifiés hors liseré {ecart} | rouge restant {reste}')
