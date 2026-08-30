#!/usr/bin/env python3
"""Lot 8 — les quatre barrières de défense : ronce et herse, joueur et Ouvrage.

`INVENTAIRE-SPRITES.md` §4.2 demande neuf défenses par propriétaire. Huit
étaient produites — les six tourelles et artilleries par `tourelles.py`, le
merlon par le même — et les deux barrières manquaient : `art/sprites/defense/`
portait 200 fichiers par grille, soit 12 × 16 orientations plus 2 × 4
connexions, et pas une ronce.

LA COUPE EST EN DEUX MOITIÉS, et ce n'est pas une hypothèse : les planches
portent deux cellules, la ronce à gauche (accent blanc, anti-infanterie) et la
herse à droite (accent rouge, anti-véhicule). Le script le VÉRIFIE avant de
couper — il mesure les bandes de matière et refuse si le milieu tombe dedans.
C'est la faute exacte que `socles.py` raconte en tête : au lot 3, une coupe en
tiers tombait dans la matière de la colonne de gauche, et le morceau parasite
est parti dans la cellule voisine sans que rien ne le dise.

⚠ LES DEUX PLANCHES SONT DES SECONDS JETS. La version du joueur a été remplacée
en place le 30/08 ; celle de l'Ouvrage est arrivée sous un nom opaque et porte
`_v2`, l'ancienne restant au dépôt. Ce sont les V2 qui sont découpées : elles
sont dessinées ensemble, dans le même style, et prendre l'ancienne pour
l'Ouvrage donnerait deux camps qui ne se ressemblent pas.

⚠ CHAQUE CELLULE EST UN SEUL SPRITE, malgré ses pièces répétées. La ronce est
faite de cinq pointes et la herse de trois blocs séparés ; ce sont des éléments
d'un même ouvrage, pas des variantes. L'ancienne planche du joueur dessinait
chacune d'un bloc, ce qui le confirme : la disposition n'a pas changé, le
dessin si.

L'EMPRISE de 28 gros pixels n'est pas choisie, elle est mesurée. Les merlons
déjà produits occupent de 20 à 29 pixels de large sur une grille de 32, et les
socles en occupent 28 : une barrière se lit à la même échelle qu'un mur, sous
peine de paraître d'un autre jeu posée à côté.

    python3 tools/barrieres.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from PIL import Image
import numpy as np
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = os.path.join(RACINE, 'art', 'sprites', 'defense')
GRILLES = (128, 64, 32)
EMPRISE = 28          # gros pixels sur une grille de 32 — voir l'en-tête

PLANCHES = [
    ('P4.2_def_j_ronce_def_j_herse.png',    False, ['def_j_ronce', 'def_j_herse']),
    ('P5.2_def_o_ronce_def_o_herse_v2.png', True,  ['def_o_ronce', 'def_o_herse']),
]

# Une bande plus étroite que ça est un éclat, pas une pièce : la herse est
# dessinée en trois blocs séparés et chacun fait plus de 150 px de large.
LARGEUR_MINI = 20


def bandes_de_matiere(im):
    """Colonnes occupées, groupées en bandes. Sert à valider la coupe."""
    colonnes = (~est_fond(np.array(im.convert('RGB')).astype(int))).any(axis=0)
    out, debut = [], None
    for k, occupe in enumerate(colonnes):
        if occupe and debut is None:
            debut = k
        if not occupe and debut is not None:
            out.append((debut, k)); debut = None
    if debut is not None:
        out.append((debut, len(colonnes)))
    return [b for b in out if b[1] - b[0] >= LARGEUR_MINI]


def verifier_la_coupe(im, fichier):
    """Lève si le milieu de la planche tombe dans de la matière.

    Une coupe qui traverse une pièce n'échoue pas bruyamment : elle produit
    deux sprites tronqués, et personne ne le voit avant de regarder les 32.
    """
    milieu = im.size[0] // 2
    for debut, fin in bandes_de_matiere(im):
        if debut < milieu < fin:
            raise ValueError(
                f'{fichier} : la coupe en deux tombe dans la matière '
                f'({debut}–{fin} contient {milieu}) — la planche n\'est pas '
                f'faite de deux cellules, ou elle a bougé')


def main():
    n = 0
    for fichier, ouv, noms in PLANCHES:
        im = Image.open(os.path.join(SRC, fichier))
        verifier_la_coupe(im, fichier)
        W, H = im.size
        P = pal(ouv)
        for i, nom in enumerate(noms):
            cellule = im.crop((i * W // 2, 0, (i + 1) * W // 2, H))
            for N in GRILLES:
                g = conditionner(recadrer(cellule, EMPRISE * (N // 32), N), P, N)
                d = os.path.join(DST, str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, P, os.path.join(d, f'{nom}.png'))
                n += 1
    print(f'{n} fichiers écrits')
    return 0


if __name__ == '__main__':
    sys.exit(main())
