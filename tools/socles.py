#!/usr/bin/env python3
"""Socles de défense de l'OUVRAGE — six socles nus, un par pièce à tourelle.

⚠⚠ IL N'EN PRODUIT PLUS QUE SIX, ET LE JOUEUR EST PARTI — lot SPRITES-V2-JOUEUR,
05/09. M1 et M2 donnaient les six socles du joueur ; ses socles v2 sont dessinés
et passent par `tools/joueur_v2.py`, une planche pour un sprite. M3 et M4
restent : l'art de l'Ouvrage n'est pas redessiné, seule sa FORME suit — un socle
nu, plus de liaison. Les six sprites qui restent sortent identiques à l'octet à
ce qu'ils étaient, c'est le vérificateur qui le dit.

Ce qui suit décrit la coupe des quatre planches, et vaut encore pour les deux
qui restent.

Les quatre planches M1 à M4 portent trois cellules chacune, et l'accent y donne
la cible comme partout ailleurs : blanc = infanterie, rouge = véhicule,
jaune = aviation. Mesuré sur M1 : 9,7 % de blanc / 0 % de rouge, puis 18,4 % de
rouge, puis 23,6 % de jaune. La forme donne la portée : M1 et M3 sont carrés
(rapport 1,18), M2 et M4 sont hauts (rapport 0,72).

⚠⚠ IL NE PRODUIT PLUS QUE LES SIX SOCLES DE L'OUVRAGE — lot SPRITES-V2-JOUEUR,
05/09. Ethan a livré les socles du joueur redessinés, découpés un par un et
conditionnés par `tools/joueur_v2.py` ; les planches M1 et M2 ne servent plus.
Elles restent au dépôt — `art/sources/` n'est jamais amputé — et passent en
sources DORMANTES.

⚠⚠ ET IL N'Y A PLUS D'ÉTAT DE CONNEXION. Ce paragraphe renvoyait les deux
planches `socles_*_tourelles_connexions_3x4` à `tools/connexions.py`, qui les
coupait en trois socles × quatre états de raccord. Les pièces ne se raccordent
plus (Ethan, 05/09) : cet outil-là est SUPPRIMÉ, et les vingt-quatre socles à
amorce avec lui. Un socle est un socle.

Six socles, un par défense à tourelle de l'Ouvrage.

BASCULE du 30/08 : les deux planches de l'Ouvrage passent à leur V2, arbitrée
par Ethan. Les V1 restent au dépôt — `art/sources/` n'est jamais amputé, rien
n'y est un produit, tout y est un original — mais plus rien ne les cite.

CORRECTION du 29/08 : le rapport du lot 3 décrivait dans ces planches « une
pièce large de 341 px » au centre. Elle n'existe pas. C'était la colonne de
gauche qui débordait dans la suivante, la coupe en tiers tombant à 341 alors que
la matière court jusqu'à 388. (Le renvoi était vers `tools/connexions.py`, qui
n'existe plus ; la correction, elle, vaut toujours pour la coupe en tiers.)
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites
from PIL import Image
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('socle')
GRILLES = (128, 64)   # la 32 est sortie au lot PIXELS : ni le jeu ni les tests ne la lisaient
EMPRISE = 28          # gros pixels sur une grille de 32, comme les gros bâtiments

PLANCHES = [
    ('M3_socles_o_tourelles_3_v2.png',   True, ['def_o_casemate', 'def_o_creneau', 'def_o_batterie']),
    ('M4_socles_o_artilleries_3_v2.png', True, ['def_o_faucheuse', 'def_o_mortier', 'def_o_harpon']),
]

n = 0
for fichier, ouv, noms in PLANCHES:
    im = Image.open(os.path.join(SRC, fichier))
    W, H = im.size
    P = pal(ouv)
    for i, nom in enumerate(noms):
        cell = im.crop((i * W // 3, 0, (i + 1) * W // 3, H))
        for N in GRILLES:
            g, matiere = conditionner(recadrer(cell, EMPRISE * (N // 32), N), P, N)
            d = os.path.join(DST, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'socle_{nom}.png'), matiere)
            n += 1
print(f'{n} fichiers écrits')
