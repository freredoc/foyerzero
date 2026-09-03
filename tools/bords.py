#!/usr/bin/env python3
"""Les murs de contour d'une base — des BLOCS, deux camps, quatre variantes.

Ethan, le 31/08/2026 : « les murs contour ne sont pas là », puis, devant un
premier conditionnement ramené à 64 × 64 : « mais c'est quoi cette chiasse de
pixel. divise par deux l'asset original. et garde la colorisation. le mur fera
512x64. et le mur fait un U, le bas reste sans mur. »

Puis, le 03/09, quatre planches neuves et une phrase : « déjà refait les murs
avec les nouveaux sprites, et pour que ça passe bien parce que là ça déborde ;
les murs vont du haut de la base jusqu'à la défense et ne ferme pas en bas. »

⚠⚠ CE QU'ELLES CHANGENT N'EST PAS LA TAILLE, C'EST LA NATURE DU DESSIN. La v1
était un TRAIT fin sur fond transparent, posé À CHEVAL sur la ligne du bord —
d'où la demi-case de `padding` de la feuille, et d'où « ça déborde ». La v2 est
un BLOC PLEIN, vu de dessus comme le reste de la base : il occupe une case
entière et ne mord sur rien. Le contour cesse donc d'être un liseré pour devenir
un ANNEAU de cases, ce qui est une géométrie et pas une épaisseur.

⚠⚠ ET LES QUATRE « ANGLES » N'EN SONT PAS. Le nom du zip dit
`angle_bloc_…_1x1`, mais mesuré ET REGARDÉ : ce sont quatre VARIANTES d'un même
bloc carré plein, pas quatre orientations d'un coude. Aucune n'est le miroir
d'une autre (le plus proche couple, v1 et v2 retourné, diffère encore de 4,4 en
moyenne par canal). Ils ne se nomment donc pas `no`/`ne`/`so`/`se` comme ceux de
la v1 : ils se numérotent. Un coin de U et un flanc de U sont le MÊME bloc.

⚠⚠ IL N'Y A NI RÉDUCTION NI QUANTIFICATION, ET C'EST NOUVEAU. Le dessin est
déjà à sa définition finale DANS la planche : chaque cellule de 1024 porte un
mur de 512 × 128 ou un bloc de 128 × 128, mesuré sur les quatre planches. Il n'y
a donc rien à réduire — et depuis le lot PIXELS (02/09) la chaîne ne ramène plus
rien sur une palette fermée. La v1 quantifiait sur seize teintes par camp parce
que le PNG du rendu libre pesait 42 643 octets pour un seul mur ; c'est le WebP
qui répond à ça aujourd'hui, et il y répond mieux.

⚠⚠ LE DÉCOUPAGE EST VÉRIFIÉ CONTRE LA LIVRAISON D'ETHAN, PAS SEULEMENT
ASSERTÉ. Le zip portait les seize sprites déjà découpés à côté des planches :
la COUPE faite ici les reproduit **au pixel près sur les seize**, canal par
canal, dans l'ordre de lecture ci-dessous. C'est ce qui prouve que la fenêtre
est la bonne, et pas seulement qu'elle est plausible.

⚠ L'ENCODAGE, LUI, EST AVEC PERTE — et ce n'est pas la même phrase. WebP q85
n'est exact ni sur le rouge ni sur le vert ; il l'est sur l'ALPHA, que WebP
compresse toujours sans perte, et c'est l'alpha qui porte l'invariant du dépôt
(« aucune transparence partielle »). Mesuré sur `mur_1` du joueur : q85
**6 344 o**, q92 9 140, WebP sans perte 53 956, PNG optimisé 72 651. Le même
réglage que les atlas depuis le 02/09, pour qu'il n'y ait qu'un encodage à
connaître ici.

⚠⚠ MAIS SA COUPE LAISSAIT LE FOND. Mesuré sur `mur_joueur_4x1_v2_1` : **2 029
pixels de magenta pur**, dont 493 sur la seule ligne du haut et 323 sur celle du
bas, enregistrés OPAQUES. Le dessin ne touche pas tout à fait les bords de sa
boîte, et un liseré `#FF00FF` aurait couru sur toute la longueur du mur. On
détoure, comme partout ailleurs dans la chaîne.

⚠ LE DÉTOURAGE PASSE PAR `est_fond_sujet`, PAS PAR `est_fond`. La seconde porte
d'`est_fond` attrape des teintes claires jusqu'au MILIEU d'un sujet ; bornée à
la composante de fond qui touche le bord, elle nettoie la frange sans percer le
bloc. C'est l'acquis du lot PIXELS, appliqué ici pour la première fois hors de
`final128`.

⚠ L'ALPHA REDEVIENT BINAIRE : le dépôt n'a aucune transparence partielle.

    python3 tools/bords.py
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from cond import est_fond_sujet  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
DST = None  # servi par `chemins`, plus bas — il honore FZ_SPRITES

# La cellule d'une planche 2 × 2 de 2048.
CELLULE = 1024
# Le dessin utile DANS la cellule, mesuré sur les quatre planches et asserté à
# chaque exécution. Un mur fait quatre cases de long sur une de haut, un bloc
# une case sur une.
COTE = 128
LONG = COTE * 4
# Le coin haut-gauche du dessin dans sa cellule, par genre.
FENETRE = {
    'mur': ((CELLULE - LONG) // 2, (CELLULE - COTE) // 2, LONG, COTE),
    'bloc': ((CELLULE - COTE) // 2, (CELLULE - COTE) // 2, COTE, COTE),
}

QUALITE = 85
METHODE = 6

# ⚠ L'ORDRE DE LECTURE EST CELUI DE LA PLANCHE, ET IL EST VÉRIFIÉ : les quatre
# cellules lues haut-gauche, haut-droite, bas-gauche, bas-droite reproduisent
# les variantes 1, 2, 3, 4 du zip d'Ethan, au pixel près.
ORDRE = [(0, 0), (1, 0), (0, 1), (1, 1)]

PLANCHES = [
    ('base_bords_joueur_murs_4x1_v2.png', 'j', 'mur'),
    ('base_bords_joueur_blocs_1x1_v2.png', 'j', 'bloc'),
    ('base_bords_ouvrage_murs_4x1_v2.png', 'o', 'mur'),
    ('base_bords_ouvrage_blocs_1x1_v2.png', 'o', 'bloc'),
]


def cellules(chemin):
    """Les quatre quarts exacts d'une planche 2 × 2, dans l'ordre de lecture."""
    im = Image.open(chemin).convert('RGB')
    L, H = im.size
    assert L == H == 2 * CELLULE, f'{os.path.basename(chemin)} : {L}x{H}, attendu {2*CELLULE}²'
    return [im.crop((i * CELLULE, j * CELLULE, (i + 1) * CELLULE, (j + 1) * CELLULE))
            for i, j in ORDRE]


def decouper(cellule, genre):
    """La fenêtre fixe, et l'assertion qui la justifie : rien d'utile n'en sort.

    ⚠ ON NE DÉCOUPE PAS SUR LA BOÎTE ENGLOBANTE. Elle varie d'un pixel d'une
    cellule à l'autre ; des sprites de tailles différentes ne se raccorderaient
    plus. On découpe la fenêtre, et on VÉRIFIE qu'elle contient tout.
    """
    x, y, l, h = FENETRE[genre]
    plein = np.array(cellule)
    utile = ~est_fond_sujet(plein)
    dehors = utile.copy()
    dehors[y:y + h, x:x + l] = False
    assert not dehors.any(), (
        f'{genre} : {int(dehors.sum())} pixels utiles hors de la fenêtre '
        f'({x},{y})+{l}x{h} — la planche a changé de cadrage')
    return plein[y:y + h, x:x + l]


def detourer(rgb):
    """Le fond magenta devient transparent ; l'alpha reste binaire."""
    opaque = ~est_fond_sujet(rgb)
    out = np.zeros((*opaque.shape, 4), np.uint8)
    out[opaque, 0:3] = rgb[opaque]
    out[opaque, 3] = 255
    return baver(out)


def baver(rgba, passes=4):
    """La couleur du bord DÉBORDE dans le transparent — et il le faut.

    ⚠⚠ CE N'EST PAS DE LA COQUETTERIE, C'EST LE CAS NORMAL. Un mur fait 512
    pixels pour quatre cases ; à la case par défaut de 46 px il est affiché en
    184, donc RÉDUIT par le navigateur — le plafond du zoom, 128 px par case,
    est le seul endroit où il tombe au 1:1. Toute réduction mélange les pixels
    voisins, transparents COMPRIS : si leur RVB vaut zéro, le mur ressort ourlé
    de noir sur toute sa longueur.

    ⚠ ET L'ENCODAGE EN RAJOUTE. WebP avec perte stocke le RVB même là où l'alpha
    est nul et le lisse par blocs : mesuré avant ce geste, les transparents du
    bord haut de `mur_1` portaient (65, 0, 0) — du rouge sombre bavé depuis le
    noir. Vu à l'œil sur un rendu de contrôle, pas à la relecture.

    On étend donc la couleur opaque dans le transparent, quelques pixels : ce
    qui bave alors, c'est la couleur du mur. **L'alpha, lui, ne bouge pas** —
    c'est ce qui distingue ce geste d'un épaississement du sprite.
    """
    out = rgba.copy()
    plein = out[..., 3] == 255
    for _ in range(passes):
        if plein.all():
            break
        somme = np.zeros((*plein.shape, 3), np.float64)
        poids = np.zeros(plein.shape, np.float64)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            v = np.roll(np.roll(plein, dy, 0), dx, 1)
            c = np.roll(np.roll(out[..., :3], dy, 0), dx, 1)
            somme[v] += c[v]
            poids[v] += 1
        frange = (~plein) & (poids > 0)
        if not frange.any():
            break
        out[frange, 0:3] = np.rint(somme[frange] / poids[frange][..., None]).astype(np.uint8)
        plein = plein | frange
    return out


def trous_enfermes(rgba):
    """Les pixels transparents que le dessin ENFERME — un détourage qui perce.

    ⚠⚠ CETTE MESURE N'EXISTE QUE DANS L'OUTIL, ET IL FAUT LE SAVOIR.
    `test/png-rgba.js` ne lit que du PNG ; les murs sont en WebP, donc la suite
    JS ne peut pas refaire ce comptage. Il part dans le manifeste, que le test
    LIT — même motif que les empreintes d'atlas depuis le 02/09.
    """
    vide = rgba[..., 3] < 128
    h, l = vide.shape
    vu = np.zeros_like(vide)
    pile = [(y, x) for y in range(h) for x in (0, l - 1) if vide[y, x]]
    pile += [(y, x) for x in range(l) for y in (0, h - 1) if vide[y, x]]
    for y, x in pile:
        vu[y, x] = True
    while pile:
        y, x = pile.pop()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            j, i = y + dy, x + dx
            if 0 <= j < h and 0 <= i < l and vide[j, i] and not vu[j, i]:
                vu[j, i] = True
                pile.append((j, i))
    return int(vide.sum() - vu.sum())


def main():
    global DST
    from chemins import dossier_sprites
    DST = dossier_sprites('bord')
    os.makedirs(DST, exist_ok=True)

    # ⚠ LE DOSSIER SE VIDE DE SES `.png`, ET C'EST LA V1 QUI PART. Ses seize
    # traits ne sont plus produits par personne : les laisser au dépôt les
    # ferait compter MANQUANTS par `tools/verifier.py` à chaque exécution,
    # c'est-à-dire « le dépôt les porte, aucun outil ne les fait ».
    for f in sorted(os.listdir(DST)):
        if f.endswith('.png'):
            os.remove(os.path.join(DST, f))

    empreintes = {}
    n = 0
    for fichier, camp, genre in PLANCHES:
        cells = cellules(os.path.join(SRC, fichier))

        # ⚠ LES QUATRE DOIVENT DIFFÉRER. Une planche à moitié remplie produirait
        # des doublons que rien ne signalerait, et les quatre variantes qui
        # existent pour casser la répétition seraient le même dessin.
        brutes = [np.array(c) for c in cells]
        for a in range(len(brutes)):
            for b in range(a + 1, len(brutes)):
                assert not np.array_equal(brutes[a], brutes[b]), \
                    f'{fichier} : les cellules {a + 1} et {b + 1} sont identiques'

        for rang, cellule in enumerate(cells, start=1):
            rgba = detourer(decouper(cellule, genre))
            assert set(np.unique(rgba[..., 3])) <= {0, 255}, f'{fichier} : alpha partiel'

            nom = f'bord_{camp}_{genre}_{rang}'
            chemin = os.path.join(DST, nom + '.webp')
            Image.fromarray(rgba, 'RGBA').save(
                chemin, 'WEBP', quality=QUALITE, method=METHODE, exact=True)

            opaques = rgba[rgba[..., 3] == 255][:, :3]
            empreintes[nom] = {
                'sha256': hashlib.sha256(open(chemin, 'rb').read()).hexdigest(),
                'largeur': int(rgba.shape[1]),
                'hauteur': int(rgba.shape[0]),
                'teintes': len({tuple(p) for p in opaques}),
                'transparents': int((rgba[..., 3] == 0).sum()),
                'trousEnfermes': trous_enfermes(rgba),
                'octets': os.path.getsize(chemin),
            }
            n += 1

    manifeste = os.path.join(DST, 'bord-empreintes.json')
    with open(manifeste, 'w', encoding='utf-8') as f:
        json.dump({
            'commentaire': (
                'FICHIER GÉNÉRÉ par « python3 tools/bords.py ». Les murs sont en '
                'WebP et Node n\'a pas de décodeur WebP ; ce manifeste est ce que '
                'la suite JS peut encore mesurer sur eux. Même motif que '
                'art/sprites/atlas-empreintes.json depuis le lot PIXELS.'),
            'qualite': QUALITE,
            'sprites': empreintes,
        }, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')

    total = sum(v['octets'] for v in empreintes.values())
    for nom in sorted(empreintes):
        v = empreintes[nom]
        print('  %-20s %4dx%-4d %6d o  %5d teintes  %4d trous'
              % (nom, v['largeur'], v['hauteur'], v['octets'], v['teintes'], v['trousEnfermes']))
    print('%d fichiers écrits, %d octets au total' % (n, total))
    return 0


if __name__ == '__main__':
    sys.exit(main())
