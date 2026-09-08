"""Rend la fumée OPAQUE au lieu de la laisser mourir sous la clé.

LE PROBLÈME. Le panache est peint semi-transparent par-dessus le fond de clé.
La porte de détourage en attrape une partie et laisse le reste : sans
traitement, le panache sort à moitié effacé, avec des lambeaux roses accrochés
au toit. Le retirer entièrement est impossible — **18 % de sa surface est déjà
opaque**, mesuré sur neuf cellules, et aucun calcul par pixel ne distingue une
fumée grise opaque d'une peinture grise de bâtiment ; une propagation de proche
en proche à travers les gris sombres retire 377 307 px sur la Caserne, le
bâtiment avec. On garde donc la fumée, et on la rend opaque.

LE CALCUL EST EXACT. Sur fond magenta, le canal VERT ne reçoit rien du fond : il
ne porte que le sujet. Pour un gris `C` posé à l'opacité `a` :

    V = a·C            R = a·C + (1 − a)·255
    ⇒ a = 1 − (R − V)/255       C = V/a

Un pixel opaque donne `R ≈ V`, donc `a ≈ 1` : le seuil sépare **le translucide
de l'opaque**, pas une couleur d'une autre, et c'est ce qui le rend sûr.

QUATRE GARDES, ET CHACUNE CONTRE UN FAUX POSITIF MESURÉ.

  1. `~fond` — le fond lui-même vaut `a = 0` et passait le test d'opacité : sans
     cette ligne, la première mesure annonçait 513 103 px de fumée sur la
     Caserne, soit toute l'image moins le bâtiment.
  2. `|R − B| < 12` — le fond contamine R et B à l'identique, donc la fumée les
     garde ÉGAUX. ⚠ Une première borne à 40 attrapait **l'ardoise de l'Ouvrage**,
     qui n'a que 15 d'écart : 438 548 px de la Souche passaient pour de la fumée.
  3. le pixel doit toucher le fond EXTÉRIEUR de proche en proche — une vitre
     translucide au milieu d'un bâtiment n'est pas reliée au dehors.
  4. le gris reconstitué doit rester sous 200 : au-delà, c'est un reflet clair,
     pas de la fumée.

⚠ À APPLIQUER SUR LA SOURCE MAGENTA, AVANT tout passage au vert. Le calcul
s'appuie sur un canal vert propre ; une fois le fond vert, c'est ce canal-là qui
est contaminé et l'inversion n'a plus la même forme.
"""
import numpy as np, os, sys
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cond

ECART_RB, PLAFOND, PLANCHER, GRIS_MAX = 12, 0.93, 0.25, 200


def opacifier(a):
    r, v, b = (a[..., i].astype(float) for i in range(3))
    fond = cond.est_fond_sujet(a)
    alpha = 1.0 - (r - v) / 255.0
    candidat = ((alpha < PLAFOND) & (alpha > PLANCHER)
                & (np.abs(r - b) < ECART_RB) & ~fond)
    lab, k = ndimage.label(candidat | fond)
    bord = set(np.unique(np.concatenate([lab[0, :], lab[-1, :],
                                         lab[:, 0], lab[:, -1]]))) - {0}
    fumee = candidat & np.isin(lab, list(bord))
    gris = np.clip(v / np.maximum(alpha, 1e-3), 0, 255)
    fumee &= gris < GRIS_MAX
    out = a.copy()
    for i in range(3):
        out[..., i][fumee] = gris[fumee].astype(np.uint8)
    return out, int(fumee.sum())
