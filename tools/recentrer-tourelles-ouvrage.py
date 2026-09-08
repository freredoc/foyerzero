"""Recentre les onze tourelles de l'Ouvrage sur leur pivot, dans une toile carrée.

POURQUOI. `tools/joueur_v2.py` conditionne les tourelles en mode `carre` : aucun
recadrage, la planche EST le sprite. Deux conditions, et les onze planches de
l'Ouvrage en manquaient les deux :

  1. le pivot doit être au centre EXACT du fichier, sinon la tourelle décrit un
     cercle autour du centre de l'image au lieu de pivoter sur place ;
  2. le côté doit valoir deux fois la distance pivot → pixel le plus loin, sinon
     le canon se fait rogner à 45°.

Mesuré avant : le pivot était 14 à 147 px sous le centre sur les onze, et quatre
réclamaient un carré plus grand que leur toile — Faucheuse 1220 pour 1024.

CE QUE FAIT LE SCRIPT. Une TRANSLATION, rien d'autre. Le sujet est recopié tel
quel dans une toile plus grande remplie de la couleur de fond LUE sur l'original.
Aucun rééchantillonnage, aucune couleur touchée : le script vérifie que le sujet
sortant a exactement le même nombre de pixels et la même somme que l'entrant.

⚠ LE PIVOT EST CELUI DU DÉPÔT, importé de `tools/ancres-defense.py` : première
ligne de la bande où la silhouette atteint 98 % de sa largeur maximale, c'est-à-
dire le haut de l'ellipse de l'embase. Ce n'est PAS le centre de la boîte du
corps — l'estimation que j'avais utilisée pour le montage tombait un demi-
cylindre plus bas.

⚠ LA TRANSLATION EST ENTIÈRE. Le pivot mesuré peut tomber sur un demi-pixel
(`(xs.min() + xs.max() + 1) / 2`). On arrondit, et l'erreur résiduelle — au plus
un demi-pixel sur 1024, soit 0,02 px à la taille du jeu — est imprimée.
"""
import numpy as np, sys, os
from PIL import Image

RACINE_DEPOT = sys.argv[1] if len(sys.argv) > 1 else None
MARGE = 2


def _charger_depot(racine):
    src = open(os.path.join(racine, 'tools', 'ancres-defense.py'), encoding='utf-8').read()
    debut = src.index('def pivot(m):')
    fin = src.index('def ', src.index('def cote_du_carre'))
    fin = src.index('\n\n\n', src.index('def cote_du_carre'))
    ns = {}
    exec(compile(src[debut:fin], 'ancres-defense', 'exec'), {'np': np}, ns)
    return ns['pivot'], ns['cote_du_carre']


def cle_de_fond(a):
    """Les quatre coins votent, comme `cond.cle_de_fond`."""
    h, w, _ = a.shape
    coins = np.array([a[0, 0], a[0, w - 1], a[h - 1, 0], a[h - 1, w - 1]], int)
    vert, magenta = np.array([0, 255, 0]), np.array([255, 0, 255])
    return vert if ((coins - vert) ** 2).sum() < ((coins - magenta) ** 2).sum() else magenta


def masque(a, fond):
    return (np.abs(a - fond).sum(2) > 90)


def recentrer(entree, sortie, pivot, cote_du_carre):
    a = np.asarray(Image.open(entree).convert('RGB')).astype(int)
    fond = cle_de_fond(a)
    m = masque(a, fond)
    px, py, _ = pivot(m)
    cote = cote_du_carre(m, px, py)
    n = int(cote) + 2 * MARGE
    n += n % 2                                    # côté pair : le centre tombe sur n/2
    toile = np.tile(fond.astype(np.uint8), (n, n, 1))
    dx, dy = int(round(n / 2 - px)), int(round(n / 2 - py))
    h, w = m.shape
    x0, y0 = max(0, dx), max(0, dy)
    sx0, sy0 = max(0, -dx), max(0, -dy)
    lw, lh = min(w - sx0, n - x0), min(h - sy0, n - y0)
    zone = toile[y0:y0 + lh, x0:x0 + lw]
    src = a[sy0:sy0 + lh, sx0:sx0 + lw]
    sm = m[sy0:sy0 + lh, sx0:sx0 + lw]
    zone[sm] = src[sm]
    toile[y0:y0 + lh, x0:x0 + lw] = zone
    Image.fromarray(toile).save(sortie)

    # Contrôles — aucun ne doit pouvoir passer par construction.
    b = np.asarray(Image.open(sortie).convert('RGB')).astype(int)
    m2 = masque(b, fond)
    conserve = (int(m2.sum()) == int(m.sum())) and (int(b[m2].sum()) == int(a[m].sum()))
    px2, py2, _ = pivot(m2)
    cote2 = cote_du_carre(m2, px2, py2)
    centre = abs(px2 - n / 2) <= 0.5 and abs(py2 - n / 2) <= 0.5
    tient = cote2 <= n
    print(f'{os.path.basename(sortie):26s} {w}×{h} → {n}×{n} | '
          f'pivot {px:6.1f},{py:6.1f} → {px2:6.1f},{py2:6.1f} (centre {n/2:.0f}) | '
          f'carré {cote} → {cote2} | sujet conservé {"oui" if conserve else "NON"} | '
          f'centré {"oui" if centre else "NON"} | tient {"oui" if tient else "NON"} | '
          f'reste {abs(px2 - n/2):.1f},{abs(py2 - n/2):.1f} px')
    return conserve and centre and tient


TOURELLES = [f'def_o_{c}' for c in ['casemate', 'creneau', 'batterie',
                                    'faucheuse', 'mortier', 'harpon']] + \
            [f'off_o_{c}_tourelle' for c in ['ratisseur', 'fendeur', 'broyeur',
                                             'belier', 'pilon']]

if __name__ == '__main__':
    racine, entree, sortie = sys.argv[1], sys.argv[2], sys.argv[3]
    pivot, cote = _charger_depot(racine)
    os.makedirs(sortie, exist_ok=True)
    tout = True
    for n in TOURELLES:
        tout &= recentrer(os.path.join(entree, n + '.png'),
                          os.path.join(sortie, n + '.png'), pivot, cote)
    print('TOUT VERT' if tout else '⚠ AU MOINS UN CONTRÔLE ROUGE')
