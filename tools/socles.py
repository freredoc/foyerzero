#!/usr/bin/env python3
"""Lot 3 — socles des douze défenses à tourelle.

Les quatre planches M1 à M4 portent trois cellules chacune, et l'accent y donne
la cible comme partout ailleurs : blanc = infanterie, rouge = véhicule,
jaune = aviation. Mesuré sur M1 : 9,7 % de blanc / 0 % de rouge, puis 18,4 % de
rouge, puis 23,6 % de jaune. La forme donne la portée : M1 et M3 sont carrés
(rapport 1,18), M2 et M4 sont hauts (rapport 0,72).

Douze socles, un par défense à tourelle, ce qui recoupe exactement les douze
tourelles du lot 1.

⚠ Les deux planches `socles_*_tourelles_connexions_3x4` ne sont PAS traitées
ici : leurs 12 cellules sont 4 rangées identiques de trois pièces — un carré à
accent blanc, une pièce LARGE de 341 px à accent rouge, un carré à accent jaune.
Les quatre rangées ne diffèrent que par la hauteur (148, 150, 150, 143 px) et de
deux points d'accent. Ce que représentent ces quatre rangées n'est pas
déductible ; voir le rapport.
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from PIL import Image
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = os.path.join(RACINE, 'art', 'sprites', 'socle')
GRILLES = (128, 64, 32)
EMPRISE = 28          # gros pixels sur une grille de 32, comme les gros bâtiments

PLANCHES = [
    ('M1_socles_j_tourelles_3.png',    False, ['def_j_casemate', 'def_j_creneau', 'def_j_batterie']),
    ('M2_socles_j_artilleries_3.png',  False, ['def_j_faucheuse', 'def_j_mortier', 'def_j_harpon']),
    ('M3_socles_o_tourelles_3.png',    True,  ['def_o_casemate', 'def_o_creneau', 'def_o_batterie']),
    ('M4_socles_o_artilleries_3.png',  True,  ['def_o_faucheuse', 'def_o_mortier', 'def_o_harpon']),
]

n = 0
for fichier, ouv, noms in PLANCHES:
    im = Image.open(os.path.join(SRC, fichier))
    W, H = im.size
    P = pal(ouv)
    for i, nom in enumerate(noms):
        cell = im.crop((i * W // 3, 0, (i + 1) * W // 3, H))
        for N in GRILLES:
            g = conditionner(recadrer(cell, EMPRISE * (N // 32), N), P, N)
            d = os.path.join(DST, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'socle_{nom}.png'))
            n += 1
print(f'{n} fichiers écrits')
