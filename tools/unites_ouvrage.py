#!/usr/bin/env python3
"""Lot 7 — les quatorze unités de l'Ouvrage, attaque et défense.

Vingt-deux sprites : 14 en version attaque (de dos) et 8 en version défense
(de face). Trois grilles, soit 66 fichiers.

⚠ LA COUPE. Une escouade est faite d'individus séparés par des espaces aussi
larges que ceux qui séparent deux cellules. Couper à chaque gouttière scinde les
escouades : la planche du trio sort en six morceaux au lieu de trois. Une règle
automatique par ratio d'écart a été essayée et échoue — 3 planches sur 10, quel
que soit le seuil de 1,5 à 3,0 — parce que trois écarts égaux séparent tantôt
trois unités, tantôt les membres d'une même escouade.

La coupe se fait donc aux **N-1 plus grands écarts**, N venant du nom de
fichier. Vérifié contre les groupements donnés par Ethan : **10 planches sur
10**.

L'ATTRIBUTION vient du nom de fichier, qu'Ethan a posé le 30/08. Elle avait
d'abord été tentée par la mesure, et deux des trois signaux tenaient :
  - l'accent donne la spécialité — blanc antiInfanterie, rouge antiVéhicule,
    jaune antiStructure — vérifié 14 fois sur 14 sur les unités du joueur ;
  - la structure de planche donne le palier de points : trio à 10, paire à 15,
    rapport de matière de 1,7 à 1,9 côté Ouvrage comme côté joueur.
Le troisième a échoué : distinguer une planche de dos d'un second jet de face.
L'IoU d'une paire dos/face avérée vaut 0,76 à 0,91, ce qui recouvre exactement
ce que donnerait un doublon. Le nom de fichier tranche, la mesure non.
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from PIL import Image
import numpy as np
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = os.path.join(RACINE, 'art', 'sprites', 'unite')
GRILLES = (128, 64, 32)

# Emprise en gros pixels sur une grille de 32, reprise de la table U de
# final128.py pour que les unités de l'Ouvrage tiennent la même place à l'écran
# que celles du joueur.
EMPRISE = {'escouade': 26, 'blinde': 24, 'aeronef': 28}

PLANCHES = [
    # fichier, châssis, [unités dans l'ordre de lecture], suffixe de sortie
    ('off_o_meute_perceurs_carapace_dos_v2.png', 'escouade', ['meute', 'perceurs', 'carapace'], ''),
    ('off_o_guetteur_fouisseur_dos.png',      'escouade', ['guetteur', 'fouisseurs'], ''),
    ('off_o_ratisseur_fendeur_belier_dos.png', 'blinde',  ['ratisseur', 'fendeur', 'belier'], ''),
    ('off_o_broyeur_pilon_dos.png',           'blinde',   ['broyeur', 'pilon'], ''),
    ('off_o_crecelle_busard_frappeur.png',    'aeronef',  ['crecelle', 'busard', 'frappeur'], ''),
    ('off_o_enclume.png',                     'aeronef',  ['enclume'], ''),
    ('off_o_meute_perceurs_carapace_face.png', 'escouade', ['meute', 'perceurs', 'carapace'], '_def'),
    ('off_o_guetteur_fouisseur_face.png',     'escouade', ['guetteur', 'fouisseurs'], '_def'),
    ('off_o_ratisseur_fendeur_belier_face.png', 'blinde', ['ratisseur', 'fendeur', 'belier'], '_def'),
    ('off_o_broyeur_pilon_face.png',          'blinde',   ['broyeur', 'pilon'], '_def'),
]

# Six unités n'ont pas de version de défense : `UNITES[x].defense.present` est
# faux pour `fouisseurs` et `pilon`, et les quatre aéronefs ne garnissent jamais.
# Les planches de face en portent quand même ; on ne les écrit pas.
SANS_DEFENSE = {'fouisseurs', 'pilon'}


def bandes(v, mini=30):
    o, d = [], None
    for k, x in enumerate(v):
        if x and d is None:
            d = k
        if not x and d is not None:
            o.append((d, k)); d = None
    if d is not None:
        o.append((d, len(v)))
    return [b for b in o if b[1] - b[0] > mini]


def cellules(chemin, n):
    """Coupe aux n-1 plus grands écarts, jamais à chaque gouttière."""
    im = Image.open(chemin).convert('RGBA')
    m = ~est_fond(np.array(im.convert('RGB')).astype(int))
    H, W = m.shape
    bx = bandes(m.any(0))
    if len(bx) < n:
        raise AssertionError(f'{os.path.basename(chemin)} : {len(bx)} bandes pour {n} cellules')
    if n == 1:
        cx = [0, W]
    else:
        ecarts = sorted(((bx[k + 1][0] - bx[k][1], k) for k in range(len(bx) - 1)),
                        reverse=True)[:n - 1]
        cx = [0] + [(bx[k][1] + bx[k + 1][0]) // 2 for _, k in sorted(ecarts, key=lambda e: e[1])] + [W]
    return [im.crop((cx[k], 0, cx[k + 1], H)) for k in range(n)]


n = 0
for fichier, chassis, unites, suffixe in PLANCHES:
    P = pal(True)
    cells = cellules(os.path.join(SRC, fichier), len(unites))
    emp = EMPRISE[chassis]
    for cell, unite in zip(cells, unites):
        if suffixe and unite in SANS_DEFENSE:
            continue
        for N in GRILLES:
            g = conditionner(recadrer(cell, emp * (N // 32), N), P, N)
            d = os.path.join(DST, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'off_o_{unite}{suffixe}.png'))
            n += 1
print(f'{n} fichiers écrits')
