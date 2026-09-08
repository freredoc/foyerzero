"""Porte une escouade de trois figures à cinq, SANS REDESSINER : la figure
maîtresse est recopiée au pixel près et reposée dans la formation mesurée sur
l'escouade qui a déjà cinq figures.

LA FORMATION NE SE DEVINE PAS, ELLE SE LIT. Le script ouvre `off_o_carapace`,
la seule à cinq, y repère les cinq figures et en tire deux nombres : l'écart
horizontal et l'écart vertical, exprimés en LARGEURS DE FIGURE. Ils sont
réappliqués tels quels. Changer de référence changerait la formation partout,
et c'est ce qu'on veut.

⚠ L'ÉCART VERTICAL SE NORMALISE PAR LA LARGEUR, PAS PAR LA HAUTEUR. Les figures
qui pointent une arme vers le haut sont hautes sans occuper plus de sol — les
Perceurs font 459 px de haut pour 342 de large, la Carapace 358 pour 311.
Normaliser par la hauteur écarterait les Perceurs d'un tiers de plus que la
Carapace pour la même emprise au sol.

⚠ LE COLLAGE VA DU PLUS LOIN AU PLUS PROCHE. Les boîtes se chevauchent — c'est
voulu, c'est ce qui fait un groupe et non un alignement — donc l'ordre décide
qui passe devant. Le script COMPTE les pixels réellement recouverts et le dit :
un chevauchement de boîtes n'est pas un chevauchement de pixels.
"""
import numpy as np, sys, os
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cond

VERT = np.array([0, 255, 0], np.uint8)
MARGE, MINI = 24, 3000


def sujet(a):
    """⚠ Le détecteur du dépôt, pas un test sur le vert. La référence de
    formation peut être une planche du JOUEUR, restée sur fond magenta :
    `cond.est_fond_sujet` lit la clé sur les quatre coins et fonctionne sur les
    deux, un test sur le vert aurait rendu une image entièrement « sujet »."""
    return ~cond.est_fond_sujet(a)


def figures(a):
    m = sujet(a)
    lab, k = ndimage.label(m)
    t = ndimage.sum(m, lab, range(1, k + 1))
    out = []
    for i in range(k):
        if t[i] < MINI:
            continue
        ys, xs = np.nonzero(lab == i + 1)
        out.append({'aire': int(t[i]), 'x': xs.mean(), 'y': ys.mean(),
                    'boite': (xs.min(), ys.min(), xs.max(), ys.max()),
                    'masque': (lab == i + 1)})
    return out


def formation(chemin_reference):
    """Les postes, en largeurs de figure, LUS sur une escouade de référence.

    Le nombre de figures n'est pas un paramètre : c'est celui de la référence.
    `off_o_carapace` en a cinq et donne le quinconce ; `off_j_carapace` du dépôt
    en a deux et donne la paire côte à côte. Changer de référence change la
    formation, et c'est la seule façon de la changer.

    Les postes sont rendus du plus LOIN au plus PROCHE — ordre du collage.
    """
    a = np.asarray(Image.open(chemin_reference).convert('RGB'))
    f = figures(a)
    if len(f) < 2:
        raise SystemExit(f'{chemin_reference} : {len(f)} figure, il en faut au moins 2')
    W = np.mean([d['boite'][2] - d['boite'][0] + 1 for d in f])
    cx = np.mean([d['x'] for d in f]); cy = np.mean([d['y'] for d in f])
    bruts = [((d['x'] - cx) / W, (d['y'] - cy) / W) for d in f]

    # ⚠ ON SYMÉTRISE PAR RANGÉE, ET SEULEMENT EN X. Les figures sont posées à la
    # main par le générateur : les quatre coins du quinconce de la Carapace
    # sortent à 0,647 · 0,647 · 0,664 · 0,663 de largeur, et ce tremblement
    # serait hérité par toutes les escouades recoupées.
    #
    # ⚠⚠ MAIS L'ÉCART VERTICAL NE SE MOYENNE PAS. Une première version donnait à
    # tous les postes le même |dy| : sur le Guetteur du joueur, qui a TROIS
    # rangées, elle collait la figure du milieu dans celle du haut et le
    # recoupage de la Meute sortait avec 1 688 pixels recouverts. Les rangées se
    # regroupent, chacune garde SA hauteur, et la symétrie ne joue qu'à
    # l'intérieur d'une rangée.
    rangees = []
    for x, y in sorted(bruts, key=lambda p: p[1]):
        if rangees and abs(y - rangees[-1][0][1]) < 0.25:
            rangees[-1].append((x, y))
        else:
            rangees.append([(x, y)])
    postes = []
    for r in rangees:
        yr = sum(p[1] for p in r) / len(r)
        ecarts = [abs(p[0]) for p in r if abs(p[0]) > 0.1]
        mx = sum(ecarts) / len(ecarts) if ecarts else 0.0
        for x, _ in r:
            postes.append((0.0 if abs(x) <= 0.1 else (mx if x > 0 else -mx), yr))
    return sorted(postes, key=lambda p: p[1]), W, len(f)


def recomposer(entree, sortie, postes):
    a = np.asarray(Image.open(entree).convert('RGB'))
    maitresse = max(figures(a), key=lambda d: d['aire'])
    x0, y0, x1, y1 = maitresse['boite']
    vignette = a[y0:y1 + 1, x0:x1 + 1]
    masque = maitresse['masque'][y0:y1 + 1, x0:x1 + 1]
    h, w = masque.shape
    reels = [(kx * w, ky * w) for kx, ky in postes]

    xs = [p[0] for p in reels]; ys = [p[1] for p in reels]
    L = int(max(xs) - min(xs) + w) + 2 * MARGE
    H = int(max(ys) - min(ys) + h) + 2 * MARGE
    # ⚠ La toile prend la couleur de fond DE L'ENTRÉE, pas le vert en dur. Les
    # planches du joueur sont restées sur magenta ; les remplir de vert aurait
    # changé leur clé de détourage au passage d'un recoupage.
    fond = np.array(cond.cle_de_fond(a), np.uint8)
    toile = np.tile(fond, (H, L, 1)).astype(np.uint8)
    peint = np.zeros((H, L), bool)
    ox = MARGE - int(min(xs)); oy = MARGE - int(min(ys))

    recouverts = 0
    for dx, dy in reels:
        px, py = ox + int(round(dx)), oy + int(round(dy))
        zone = (slice(py, py + h), slice(px, px + w))
        recouverts += int((masque & peint[zone]).sum())
        bloc = toile[zone]; bloc[masque] = vignette[masque]; toile[zone] = bloc
        peint[zone] |= masque

    Image.fromarray(toile).save(sortie)
    aire = int(masque.sum())
    print(f'{os.path.basename(sortie):26s} figure {w}×{h} ×{len(reels)} | '
          f'toile {L}×{H} | pixels recouverts {recouverts} '
          f'({100 * recouverts / (len(reels) * aire):.1f} %)')


if __name__ == '__main__':
    dossier, reference = sys.argv[1], sys.argv[2]
    postes, W, n = formation(reference if os.path.exists(reference)
                             else os.path.join(dossier, reference + '.png'))
    print(f'formation lue sur {os.path.basename(reference)} : {n} figures, '
          f'largeur {W:.0f} px, postes ' +
          ', '.join(f'({a:+.3f}, {b:+.3f})' for a, b in postes))
    for nom in sys.argv[3:]:
        recomposer(os.path.join(dossier, nom + '.png'),
                   os.path.join(dossier, nom + '.png'), postes)
