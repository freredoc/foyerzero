#!/usr/bin/env python3
"""Lot 10 — les seize bâtiments détruits et les deux ruines.

Dix-huit sprites, trois grilles, cinquante-quatre fichiers. Le suffixe de sortie
est `_detruit`, sur le modèle du `_def` des unités : même dossier, même nom de
bâtiment, un état de plus.

LA TABLE EST CELLE DE `final128.py`, PAS UNE RECOPIE. Les planches détruites
reprennent exactement la disposition des planches intactes — même grille, mêmes
bâtiments dans le même ordre — et c'est ce qui permet de dériver l'une de
l'autre. Si `B` change, ce lot suit sans intervention. Une table écrite à la
main ici serait la première à diverger, comme l'a montré `SE_LIE_AU_MUR`.

DEUX DOUBLONS ONT ÉTÉ ARBITRÉS PAR MESURE, faute d'instruction, et le critère
est la survie à la grille de 32 gros pixels :

    P2_..._detruite_1024      2,66 gp d'épaisseur médiane   <- retenu
    P2_..._detruite_1024-1    2,48 gp
    P4_..._detruite_1024-1    1,53 gp                        <- retenu
    P4_..._detruite_1024-2    1,17 gp

L'écart est net dans les deux cas — 7 % et 31 % — et va dans le même sens que la
matière totale. ⚠ C'est un critère de LISIBILITÉ, pas de goût : si le jet le
plus fin est le plus beau, c'est un arbitrage d'Ethan et il se change ici.

LES DEUX RUINES viennent de `R2_ruines_mur_tourelle_joueur_ouvrage_2x1`, dont
les deux cellules se séparent au violet : 0,0 % à gauche, 72,0 % à droite. Le
camp est donc mesuré, pas déduit de l'ordre du nom de fichier.

    python3 tools/ruines.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites

from PIL import Image
import numpy as np
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire, B, PV, OUV, cible

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('bâtiment')
GRILLES = (128, 64, 32)

RENOMMAGE = {'usine': 'depot_de_vehicules'}

# Intacte -> détruite. Les deux planches à droite sont les jets retenus.
DETRUITES = {
    'P1_caserne_depot_aerodrome_1024.png':
        'P1_caserne_depot_aerodrome_detruite_1024.png',
    'P2_chantier_qg_complexe_centre_1024.png':
        'P2_chantier_qg_complexe_centre_detruite_1024.png',
    'P3_raffinerie_collecteur_centrale_accumulateur_1024-2.png':
        'P3_raffinerie_collecteur_centrale_accumulateur_detruite_1024.png',
    'P4_souche_etai_1024.png':
        'P4_souche_etai_detruite_1024-1.png',
    'P5_gangue_noeud_terril_1024.png':
        'P5_gangue_noeud_terril_detruite_1024.png',
}

RUINES = ('R2_ruines_mur_tourelle_joueur_ouvrage_2x1.png',
          [('ruine_j', False), ('ruine_o', True)])


def part_violette(a, m):
    px = a[m]
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    return float(((b > r + 8) & (b > g + 8)).mean() * 100)


n = 0
for fichier, nx, ny, grille in B:
    detruite = DETRUITES.get(fichier)
    if detruite is None:
        raise AssertionError(f'{fichier} : aucune planche détruite déclarée')
    im = Image.open(os.path.join(SRC, detruite))
    W, H = im.size
    cw, ch = W // nx, H // ny
    for j in range(ny):
        for i in range(nx):
            cle = grille[j][i]
            ouv = cle in OUV
            nom = ('bat_o_' if ouv else 'bat_j_') + RENOMMAGE.get(cle, cle)
            cell = im.crop((i * cw, j * ch, (i + 1) * cw, (j + 1) * ch))
            P = pal(ouv)
            emp = cible(PV[cle])
            for N in GRILLES:
                g = conditionner(recadrer(cell, emp * (N // 32), N), P, N)
                d = os.path.join(DST, str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, P, os.path.join(d, f'{nom}_detruit.png'))
                n += 1

# --- les deux ruines, camp mesuré au violet ---
fichier, attendus = RUINES
im = Image.open(os.path.join(SRC, fichier))
a = np.array(im.convert('RGB')).astype(int)
m = ~est_fond(a)
W = m.shape[1]
for k, (nom, ouv_attendu) in enumerate(attendus):
    tranche = slice(k * W // 2, (k + 1) * W // 2)
    violet = part_violette(a[:, tranche], m[:, tranche])
    # La cellule de l'Ouvrage est à 72 % de violet, celle du joueur à 0 %. Le
    # seuil à 30 laisse toute la marge voulue et refuse une planche inversée.
    if (violet > 30) != ouv_attendu:
        raise AssertionError(
            f'{fichier} cellule {k} : {violet:.1f} % de violet, '
            f'{"Ouvrage" if ouv_attendu else "joueur"} attendu — planche inversée ?')
    P = pal(ouv_attendu)
    cell = im.crop((k * W // 2, 0, (k + 1) * W // 2, im.size[1]))
    for N in GRILLES:
        g = conditionner(recadrer(cell, 26 * (N // 32), N), P, N)
        d = os.path.join(DST, str(N))
        os.makedirs(d, exist_ok=True)
        ecrire(g, P, os.path.join(d, f'{nom}.png'))
        n += 1

print(f'{n} fichiers écrits')
