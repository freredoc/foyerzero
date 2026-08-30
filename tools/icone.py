#!/usr/bin/env python3
"""L'icône de l'application, des cinq densités Android à la palette du jeu.

⚠⚠ CE QUE CET OUTIL REMPLACE. L'APK déclarait `@mipmap/ic_launcher` avec un
premier plan VECTORIEL — un creuset dessiné en `<path>`, provisoire posé au lot
de l'enveloppe. La source est maintenant une scène de pixel art : un blindé kaki
du joueur, un marcheur violet de l'Ouvrage, un éclair orange entre les deux.

⚠⚠ LA SOURCE N'EST PAS PROPRE, ET C'EST MESURÉ : **109 969 teintes distinctes,
et 0,0 % des pixels sur la palette du jeu.** Les dominantes sont `#0B0B14`,
`#0B0B15`, `#0A0A13`, `#0C0C15` — des voisines à un point d'écart, signature
d'une compression avec perte ou d'un redimensionnement interpolé. Réduite telle
quelle, cette bouillie donnerait une icône terne. Elle passe donc par la chaîne
de conditionnement du dépôt, la même que les sprites.

⚠⚠ LE MOTIF EST CADRÉ BORD À BORD, ET UNE ICÔNE ADAPTATIVE N'EN GARANTIT QUE LE
CENTRE. 108 dp de côté, dont **72 seulement** sont sûrs — le lanceur masque le
reste en cercle, en carré arrondi ou en goutte selon l'appareil. Mesuré sur la
source : le motif s'étend de x 21 à x 1244 sur 1254, et **36,0 % en tomberait
hors de la zone sûre** en plein cadre ; un masque circulaire en couperait déjà
10,4 %.

D'où `ENCASTREMENT`, et c'est un CHOIX RÉVERSIBLE d'une constante :
  • **encastré** (retenu) — la scène tient dans les 72/108 centraux. Rien n'est
    coupé ; l'icône paraît un peu plus petite que ses voisines.
  • **plein cadre** — mettre `ENCASTREMENT = 1.0`. Plus présent, mais on perd
    plus du tiers du motif sur un masque carré arrondi.
La vraie réponse serait une composition DESSINÉE pour 108/72, et c'est de l'art,
pas du code.

⚠ CET OUTIL N'ÉCRIT PAS DANS `art/sprites/`, donc il n'est PAS dans la chaîne de
`tools/verifier.py` et ne passe pas par `tools/chemins.py`. Ses sorties vivent
dans `android/`, qui est un angle mort assumé du vérificateur — dit au rapport
du lot plutôt que corrigé à la sauvette.

    python3 tools/icone.py             # écrit les cinq densités
    python3 tools/icone.py --mesurer   # ne rien écrire, tout mesurer
"""
import argparse
import collections
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from PIL import Image

from final128 import pal, quant

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, 'art', 'sources', 'icone_appli.png')
RES = os.path.join(RACINE, 'android', 'app', 'src', 'main', 'res')

# ⚠ LES CINQ COMPARTIMENTS DE DENSITÉ, EN PIXELS DE CÔTÉ POUR 108 dp.
# mdpi est la référence à 1 dp = 1 px ; les autres en sont les multiples
# canoniques d'Android — 1,5 · 2 · 3 · 4.
DENSITES = {
    'mdpi': 108,
    'hdpi': 162,
    'xhdpi': 216,
    'xxhdpi': 324,
    'xxxhdpi': 432,
}

# ⚠⚠ LA PART DE 108 dp QUE LE MOTIF OCCUPE. 72/108 est la zone sûre garantie par
# le format ; c'est le choix (a) du brief, celui qui ne détruit rien. Le porter à
# 1.0 rend le plein cadre, et fait tomber le test de zone sûre — ce qui est le
# but : personne ne repasse en plein cadre sans le dire.
ENCASTREMENT = 72 / 108

# ⚠ LA PALETTE ÉTENDUE, PAS CELLE DU JOUEUR SEUL. La scène porte un blindé kaki
# ET un marcheur de l'Ouvrage : sans les cinq tons d'ardoise (`pal(True)`), le
# violet tomberait sur du métal et le marcheur perdrait son camp.
PALETTE = pal(True)


def conditionner_pleine_image(im):
    """Quantifie TOUTE l'image sur la palette, sans masque ni érosion.

    ⚠ PAS D'`est_fond` ICI, ET C'EST LA DIFFÉRENCE AVEC UN SPRITE. Cette
    fonction-là cherche un fond MAGENTA, la convention des planches ; l'icône a
    un fond sombre qui fait partie du dessin. Le masquer laisserait un trou.

    ⚠ ET PAS D'ÉROSION. Les trois pixels d'érosion des sprites mangent la frange
    d'anti-crénelage contre le magenta ; il n'y en a pas ici, et éroder
    rognerait le bord du motif pour rien.
    """
    rgb = np.array(im.convert('RGB')).astype(np.int32)
    h, w, _ = rgb.shape
    idx = quant(rgb.reshape(-1, 3), PALETTE).astype(np.int16).reshape(h, w)
    return idx


def reduire_sur(idx, n, nb_teintes):
    """Réduit une grille d'indices à `n × n` par vote majoritaire.

    ⚠⚠ POURQUOI CETTE FONCTION EXISTE AU LIEU D'APPELER `cond.reduire`. Celle-là
    prend `len(cond.PAL)` — **quatorze** — comme sentinelle de transparence.
    Avec la palette ÉTENDUE de dix-neuf teintes, l'indice 14 est `A contour`, le
    ton le plus sombre de l'Ouvrage : `cond.reduire` le lit comme « transparent »
    et l'efface. Mesuré sur la source de l'icône — 64,6 % des pixels y tombent
    sur `A contour` —, tout le fond de la scène disparaissait en silence.
    Celle-ci prend le nombre de teintes en ARGUMENT, donc elle ne peut pas se
    tromper de palette.

    ⚠⚠ ET LE MÊME DÉFAUT MORD LA CHAÎNE DES BÂTIMENTS DE L'OUVRAGE, MESURÉ :
    2,11 % des pixels de `gangue`, 2,13 % de `noeud` et 2,17 % de `terril`
    tombent sur `A contour` avant réduction, et **aucun** ne survit dans le
    sprite commité. Ce n'est PAS corrigé ici : le faire régénérerait des sprites
    commités, recoudrait un atlas et changerait `dist` — c'est un lot à part, et
    un arbitrage d'Ethan. Le rapport du lot le pose ; `test/icone.test.js` le
    garde pour qu'il ne se perde pas.
    """
    h, w = idx.shape
    out = np.full((n, n), -1, dtype=np.int16)
    for by in range(n):
        y0 = by * h // n
        y1 = max(y0 + 1, (by + 1) * h // n)
        for bx in range(n):
            x0 = bx * w // n
            x1 = max(x0 + 1, (bx + 1) * w // n)
            bloc = idx[y0:y1, x0:x1].ravel()
            v = np.where(bloc < 0, nb_teintes, bloc)
            compte = np.bincount(v, minlength=nb_teintes + 1)
            meilleur = int(compte.argmax())
            out[by, bx] = -1 if meilleur == nb_teintes else meilleur
    return out


def rendre(grille):
    """Une grille d'indices → une image RGBA opaque."""
    n = grille.shape[0]
    out = np.zeros((n, n, 4), np.uint8)
    for i, (_nom, _hex, couleur) in enumerate(PALETTE):
        k = grille == i
        out[k, 0], out[k, 1], out[k, 2], out[k, 3] = couleur[0], couleur[1], couleur[2], 255
    return Image.fromarray(out, 'RGBA')


def couleur_dominante(grille):
    """La teinte la plus fréquente de la grille conditionnée, en `#RRGGBB`.

    ⚠ ELLE SE LIT DANS LA SOURCE, ELLE NE S'ÉCRIT PAS EN DUR. `couleurs.xml`
    disait `#161914` — le contour kaki de la fiche de style — quand le fond de la
    scène est un quasi-noir bleuté. Les deux ne peuvent pas rester : un fond qui
    ne prolonge pas le dessin fait un carré visible autour de l'encastrement.
    """
    plat = grille.ravel()
    plat = plat[plat >= 0]
    compte = collections.Counter(plat.tolist())
    return PALETTE[compte.most_common(1)[0][0]][1].upper()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--mesurer', action='store_true',
                    help='ne rien écrire — mesurer et rendre compte')
    a = ap.parse_args()

    source = Image.open(SRC)
    brut = np.array(source.convert('RGB'))
    avant = len(collections.Counter(map(tuple, brut.reshape(-1, 3))))

    # Conditionné une fois à la plus grande densité, puis réduit : réduire
    # l'INDEX plutôt que les pixels garde le vote majoritaire de `reduire`, qui
    # est ce qui rend une réduction de pixel art nette au lieu de l'interpoler.
    plein = conditionner_pleine_image(source)
    fond = couleur_dominante(plein)

    print(f'source           {source.size[0]} × {source.size[1]}, {avant} teintes distinctes')
    print(f'palette          {len(PALETTE)} teintes (base + ardoise de l\'Ouvrage)')
    print(f'encastrement     {ENCASTREMENT:.4f}  ({round(108 * ENCASTREMENT)} dp sur 108)')
    print(f'fond dominant    {fond}')

    ecrits = 0
    for nom, cote in DENSITES.items():
        motif = max(1, round(cote * ENCASTREMENT))
        grille = reduire_sur(plein, motif, len(PALETTE))
        image = rendre(grille)
        # Le motif se CENTRE dans le carré de la densité ; ce qui reste est
        # transparent, et le lanceur y verra `icone_fond`.
        toile = Image.new('RGBA', (cote, cote), (0, 0, 0, 0))
        marge = (cote - motif) // 2
        toile.paste(image, (marge, marge))
        apres = len({tuple(p[:3]) for p in np.array(toile).reshape(-1, 4) if p[3] > 0})
        print(f'  {nom:8} {cote:3d} px   motif {motif:3d} px   marge {marge:3d}   {apres} teintes')
        if a.mesurer:
            continue
        dossier = os.path.join(RES, f'mipmap-{nom}')
        os.makedirs(dossier, exist_ok=True)
        toile.save(os.path.join(dossier, 'ic_launcher_premier_plan.png'))
        ecrits += 1

    if not a.mesurer:
        chemin = os.path.join(RES, 'values', 'couleurs.xml')
        with open(chemin, 'w', encoding='utf-8') as f:
            f.write(
                '<?xml version="1.0" encoding="utf-8"?>\n'
                '<resources>\n'
                '    <!-- ⚠ GÉNÉRÉ PAR tools/icone.py — la teinte est la DOMINANTE de\n'
                '         l\'icône conditionnée, pas une valeur choisie. Elle prolonge le\n'
                '         fond de la scène au-delà de son encastrement : un fond qui ne\n'
                '         le prolongerait pas ferait un carré visible sur l\'écran\n'
                '         d\'accueil. Régénérer : python3 tools/icone.py -->\n'
                f'    <color name="icone_fond">{fond}</color>\n'
                '</resources>\n'
            )
        print(f'{ecrits} densités écrites · couleurs.xml → {fond}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
