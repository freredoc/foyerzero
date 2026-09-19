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

⚠⚠ GÉNÉRALISÉ AU LOT CONDITIONNEMENT-ZÉNITH (19/09), ET RÉPARÉ EN PASSANT. Il
exécutait le SOURCE de `pivot` avec `np` pour seul nom global ; depuis
ANCRES-ZÉNITH `ancres-defense.pivot` est le plus grand disque inscrit et demande
`scipy.ndimage` — le script tombait en `NameError`. Il importe maintenant les
deux modules d'ancres comme des modules, et prend la règle d'embase DE LA
FAMILLE : `def_*` → `ancres-defense.pivot` (disque inscrit, tourelles de défense
zénithales), `off_*_tourelle` → `ancres-blindes.pivot` (tambour, tourelles de
blindé encore à 75°) — c'est-à-dire, pour les cinq blindés de l'Ouvrage, la même
règle que celle qui les a recentrés le 07/09.

Le masque est celui des outils, `cond.est_fond_sujet`, et non plus « à plus de
90 de la clé en somme » : les sources du joueur ont un fond BRUITÉ (5 000
couleurs, coins à (239, 14, 239)), et les deux masques divergeaient sur la
frange. La toile est remplie de la clé pure, le fond bruité n'est pas recopié —
il était déjà du fond pour toute la chaîne.

Les noms à traiter se passent en arguments après le dossier de sortie ; sans eux,
la liste historique des onze de l'Ouvrage. Les douze tourelles de défense
zénithales — six par camp — ont été recentrées ainsi le 19/09, EN PLACE dans
`art/sources/` (brief §1) : pivot de 21 à 225 px sous le centre du fichier,
carré plus grand que la planche sur dix d'entre elles.
"""
import numpy as np, sys, os
from PIL import Image

RACINE_DEPOT = sys.argv[1] if len(sys.argv) > 1 else None
MARGE = 2


def _charger_depot(racine):
    """Les deux modules d'ancres, importés — plus jamais exécutés par morceaux."""
    import importlib.util as u
    sys.path.insert(0, os.path.join(racine, 'tools'))
    mods = {}
    for nom in ('ancres-defense', 'ancres-blindes'):
        spec = u.spec_from_file_location(nom.replace('-', '_'),
                                         os.path.join(racine, 'tools', nom + '.py'))
        mods[nom] = u.module_from_spec(spec)
        spec.loader.exec_module(mods[nom])
    return mods['ancres-defense'], mods['ancres-blindes']


def regle(nom, DEF, BL):
    """La règle d'embase de la famille : disque inscrit pour une défense, tambour pour un blindé."""
    if nom.startswith('def_'):
        return DEF.pivot, DEF.cote_du_carre
    if nom.endswith('_tourelle'):
        return BL.pivot, BL.cote_du_carre
    raise AssertionError(f'{nom} : ni tourelle de défense ni tourelle de blindé')


def cle_de_fond(a):
    """La clé LUE sur les quatre coins — `cond.cle_de_fond`, pas une seconde écriture."""
    from cond import cle_de_fond as lire
    return np.array(lire(a.astype(np.uint8)), int)


def masque(a, fond):
    """Le sujet tel que la chaîne le voit — `cond.est_fond_sujet`, pas un seuil à part."""
    from cond import est_fond_sujet
    return ~est_fond_sujet(a.astype(np.uint8))


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
    noms = sys.argv[4:] or TOURELLES
    DEF, BL = _charger_depot(racine)
    os.makedirs(sortie, exist_ok=True)
    tout = True
    for n in noms:
        pivot, cote = regle(n, DEF, BL)
        tout &= recentrer(os.path.join(entree, n + '.png'),
                          os.path.join(sortie, n + '.png'), pivot, cote)
    print('TOUT VERT' if tout else '⚠ AU MOINS UN CONTRÔLE ROUGE')
    sys.exit(0 if tout else 1)
