#!/usr/bin/env python3
"""Les murs de contour d'une base — trois segments et deux angles, deux camps.

Ethan, le 31/08/2026 : « les murs contour ne sont pas là », avec quatre planches
jointes — `base_bords_{joueur,ouvrage}_{murs,angles}_2x2.png`. Puis, devant un
premier conditionnement ramené à 64 × 64 : « mais c'est quoi cette chiasse de
pixel. divise par deux l'asset original. et garde la colorisation. le mur fera
512x64. et le mur fait un U, le bas reste sans mur. »

⚠⚠ CET OUTIL NE PASSE PAS PAR LA CHAÎNE DES SPRITES DE CASE, ET C'EST TOUT LE
LOT. `planches.py`, `final128.py` et leurs cousins ramènent un dessin de 1024 à
une case de 64, quantifié sur les quatorze teintes de `cond.py` : c'est juste
pour une unité, qui doit tenir dans une case et se lire à trente pixels. Un mur
de contour n'est pas dans une case — il court le long d'un côté entier — et le
réduire au seizième détruisait le seul détail qui le fait lire comme une
construction. Mesuré à l'œil par Ethan sur le livrable, et c'est son mot qui
décide : « chiasse de pixel ».

⚠ « DIVISE PAR DEUX » SE PREND AU MOT. La planche fait 2048 × 2048, donc quatre
cellules de 1024. On la ramène d'un facteur deux, et rien de plus : 512 × 64
pour un mur, 64 × 512 pour l'autre sens, 64 × 64 pour un angle. À 64 pixels par
case — le plafond du zoom, `COTE_SPRITE` — un mur couvre donc HUIT cases au
rapport 1:1, et l'angle exactement une.

⚠⚠ LA FENÊTRE EST FIXE, ELLE NE SE MESURE PAS SUR L'IMAGE. Le trait occupe les
128 lignes centrales de sa cellule de 1024 — vérifié ci-dessous, à l'assertion
près — mais son étendue exacte varie d'un pixel d'une cellule à l'autre (`y =
448..574` sur l'une, `448..575` sur l'autre). Découper sur la boîte englobante
donnerait donc des sprites de tailles différentes, qui ne se raccorderaient plus.
On découpe la fenêtre CENTRALE, et on ASSERTE qu'aucun pixel opaque n'en sort.

⚠⚠ « GARDE LA COLORISATION » : PAS DE PALETTE DU DÉPÔT ICI. `quantifier` de
`cond.py` apparie sur les quatorze teintes de la fiche, réglées pour les unités
et les bâtiments ; sur les bruns de ces planches-ci la porte du ROUGE s'ouvre et
le mur ressort semé de `#E43E32`, la teinte que le dépôt réserve à ce qui ATTAQUE
LE JOUEUR (mesuré au premier jet). Les couleurs retenues sont donc celles du
dessin, réduites à seize PAR CAMP.

⚠ SEIZE, ET C'EST UN COMPROMIS MESURÉ, pas un chiffre rond. Le rendu d'origine
porte 22 000 couleurs distinctes — de l'anti-crénelage, pas une intention — et
pèse 42 643 octets pour un seul mur, soit près de quatre fois la marge du
livrable sous la borne de `banc.test.js` T10. Mesuré sur `mur_h_a` : 8 couleurs
→ 6 507 o, 12 → 8 612, 16 → 10 670, 32 → 16 057, plein → 41 790. Sous seize, le
détail des briques s'aplatit à l'œil ; au-dessus, on paie sans que ça se voie.

⚠ LA PALETTE EST PAR CAMP, PAS PAR SPRITE. Cinq sprites quantifiés chacun de son
côté auraient cinq jeux de seize couleurs voisines, et les joints — l'angle
contre le mur — ne tomberaient pas sur la même teinte. Elle se calcule sur les
huit cellules du camp réunies.

⚠ LA RÉDUCTION EST ALPHA-CORRECTE. Le fond des planches est magenta ; réduire le
RVB sans le prémultiplier par l'alpha ferait baver ce magenta dans le liseré du
mur sur toute sa longueur. On prémultiplie, on réduit, on divise.

    python3 tools/bords.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites
from PIL import Image
import numpy as np
from cond import est_fond

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('bord')

# Le facteur de réduction, dicté par Ethan le 31/08 : « divise par deux l'asset
# original ». Une cellule de 1024 devient 512.
DEMI = 2
# L'épaisseur du trait dans la cellule d'origine, MESURÉE sur les quatre
# planches et assertée à chaque exécution : 128 lignes centrées sur 1024.
BANDE = 128
# Le nombre de couleurs gardées par camp — voir l'en-tête.
COULEURS = 16

# planche, camp, noms des quatre cellules dans l'ordre de lecture
# (haut-gauche, haut-droite, bas-gauche, bas-droite).
#
# ⚠ L'ORDRE DES ANGLES SE LIT SUR LA PLANCHE, il ne se devine pas : chaque
# cellule porte son angle dans le coin qu'il dessert, et la planche est donc sa
# propre légende — le coin haut-gauche de la planche porte l'angle nord-ouest.
PLANCHES = [
    ('base_bords_joueur_murs_2x2.png', 'j',
     ['mur_h_a', 'mur_v_a', 'mur_h_b', 'mur_v_b']),
    ('base_bords_joueur_angles_2x2.png', 'j',
     ['angle_no', 'angle_ne', 'angle_so', 'angle_se']),
    ('base_bords_ouvrage_murs_2x2.png', 'o',
     ['mur_h_a', 'mur_v_a', 'mur_h_b', 'mur_v_b']),
    ('base_bords_ouvrage_angles_2x2.png', 'o',
     ['angle_no', 'angle_ne', 'angle_so', 'angle_se']),
]


def quarts(chemin):
    """Les quatre quarts exacts d'une planche 2 × 2.

    ⚠ LA COUPE EST EN QUARTS EXACTS, PAS PAR GOUTTIÈRE. Le nom des planches dit
    `2x2`, et la coupe par gouttière d'`emblemes.py` ne marcherait pas ici : sur
    la planche des murs, la colonne de droite porte deux tuiles verticales qui
    se touchent bout à bout, sans gouttière horizontale entre elles.
    """
    im = Image.open(chemin).convert('RGB')
    L, H = im.size
    assert L % 2 == 0 and H % 2 == 0, f'{os.path.basename(chemin)} : {L}x{H} non divisible'
    l, h = L // 2, H // 2
    return [im.crop((i * l, j * h, (i + 1) * l, (j + 1) * h))
            for j in range(2) for i in range(2)]


def fenetre(nom, cote):
    """La fenêtre centrale à découper dans une cellule, selon le sens du dessin.

    Un mur horizontal traverse sa cellule et n'en occupe qu'une bande centrale
    en hauteur ; un mur vertical l'inverse ; un angle est centré sur les deux
    axes. Rendue en (x0, y0, x1, y1).
    """
    marge = (cote - BANDE) // 2
    if nom.startswith('mur_h'):
        return (0, marge, cote, marge + BANDE)
    if nom.startswith('mur_v'):
        return (marge, 0, marge + BANDE, cote)
    return (marge, marge, marge + BANDE, marge + BANDE)


def rgba(cellule):
    """La cellule en RVBA, le fond magenta des planches rendu transparent."""
    a = np.array(cellule)
    return a, ~est_fond(a)


def reduire_de_moitie(rgb, alpha, facteur):
    """Réduction alpha-correcte d'un facteur entier.

    ⚠ ON PRÉMULTIPLIE AVANT DE RÉDUIRE. Sans ça, le magenta du fond entre dans
    la moyenne des pixels de bord et le mur ressort ourlé de rose sur toute sa
    longueur — invisible sur une vignette, flagrant sur 512 pixels.
    """
    h, l = alpha.shape
    assert h % facteur == 0 and l % facteur == 0, f'{l}x{h} non divisible par {facteur}'
    a = alpha.astype(np.float64)
    pre = rgb.astype(np.float64) * a[..., None]
    bloc = (h // facteur, facteur, l // facteur, facteur)
    somme = pre.reshape(*bloc, 3).sum(axis=(1, 3))
    poids = a.reshape(*bloc).sum(axis=(1, 3))
    couvert = poids > 0
    out = np.zeros(somme.shape, np.uint8)
    out[couvert] = np.round(somme[couvert] / poids[couvert][..., None]).astype(np.uint8)
    # ⚠ L'ALPHA REDEVIENT BINAIRE : le dépôt n'a pas de transparence partielle,
    # la garde de palette de `banc.test.js` ne tolère qu'un seul `rgba`, et un
    # bord à demi transparent se lirait comme un défaut de rendu.
    return out, (poids >= (facteur * facteur) / 2)


def palette_du_camp(pixels):
    """Seize couleurs tirées du dessin lui-même, par coupe médiane."""
    n = len(pixels)
    cote = int(np.ceil(np.sqrt(n)))
    carre = np.zeros((cote * cote, 3), np.uint8)
    carre[:n] = pixels
    carre[n:] = pixels[-1]
    im = Image.fromarray(carre.reshape(cote, cote, 3), 'RGB')
    return im.quantize(colors=COULEURS, method=Image.MEDIANCUT, dither=Image.NONE)


def appliquer(rgb, alpha, reference):
    """Apparie chaque pixel opaque à la palette du camp, sans tramage."""
    q = Image.fromarray(rgb, 'RGB').quantize(palette=reference, dither=Image.NONE)
    plat = np.array(q.convert('RGB'))
    out = np.zeros((*alpha.shape, 4), np.uint8)
    out[alpha, 0:3] = plat[alpha]
    out[alpha, 3] = 255
    return out


# --- 1. découper, réduire, et retenir les pixels de chaque camp --------------
cellules = {}
pixels_du_camp = {}
for fichier, camp, noms in PLANCHES:
    cells = quarts(os.path.join(SRC, fichier))
    assert len(cells) == len(noms), f'{fichier} : {len(cells)} cellules pour {len(noms)} noms'

    # ⚠ LES QUATRE DOIVENT DIFFÉRER. Une planche à moitié remplie produirait des
    # doublons que rien ne signalerait — et les deux variantes d'un mur, qui
    # servent l'une à gauche et l'autre à droite, seraient le même dessin.
    brutes = [np.array(c) for c in cells]
    for a in range(len(brutes)):
        for b in range(a + 1, len(brutes)):
            assert not np.array_equal(brutes[a], brutes[b]), \
                f'{fichier} : les cellules {a} et {b} sont identiques'

    for cell, suffixe in zip(cells, noms):
        cote = cell.size[0]
        assert cell.size == (cote, cote), f'{fichier}/{suffixe} : cellule non carrée'
        plein, opaque = rgba(cell)

        # ⚠⚠ L'ASSERTION QUI JUSTIFIE LA FENÊTRE FIXE : rien d'opaque n'en sort.
        # Sans elle, un dessin qui déborderait serait rogné en silence.
        x0, y0, x1, y1 = fenetre(suffixe, cote)
        dehors = opaque.copy()
        dehors[y0:y1, x0:x1] = False
        assert not dehors.any(), \
            (f'{fichier}/{suffixe} : {int(dehors.sum())} pixels opaques hors de la bande '
             f'centrale de {BANDE} — la fenêtre fixe rognerait le dessin')

        rgbc = plein[y0:y1, x0:x1]
        alpc = opaque[y0:y1, x0:x1]
        petit, masque = reduire_de_moitie(rgbc, alpc, DEMI)
        cellules[(camp, suffixe)] = (petit, masque)
        pixels_du_camp.setdefault(camp, []).append(petit[masque])

# --- 2. une palette par camp, puis l'écriture --------------------------------
n = 0
os.makedirs(DST, exist_ok=True)
for camp, morceaux in pixels_du_camp.items():
    reference = palette_du_camp(np.concatenate(morceaux))
    for (c, suffixe), (petit, masque) in cellules.items():
        if c != camp:
            continue
        out = appliquer(petit, masque, reference)
        chemin = os.path.join(DST, f'bord_{camp}_{suffixe}.png')
        Image.fromarray(out, 'RGBA').save(chemin, optimize=True)
        n += 1
print(f'{n} fichiers écrits')
