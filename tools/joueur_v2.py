#!/usr/bin/env python3
"""Les quarante-deux sprites du joueur, v2 — une planche pour un sprite.

Ce que ce fichier fait que personne ne faisait. Toutes les planches d'avant
portaient PLUSIEURS sujets : `planches.py` découpe la table `U` en cellules,
`unites_ouvrage.py` coupe aux n-1 plus grands écarts, `tourelles.py` lit une
grille 3 × 4, `socles.py` coupe en tiers. Les planches de la v2 portent un sujet
chacune, et leur nom EST le nom du sprite. Il n'y a donc plus de coupe, plus de
gouttière à trouver, plus d'attribution à mesurer — et c'est tout ce que ce
module apporte : une table, et deux façons de conditionner.

    python3 tools/joueur_v2.py

⚠⚠ DEUX MODES, ET LE SECOND EST CE QUI REND LA ROTATION POSSIBLE.

  `emprise`  le geste ordinaire du dépôt : `recadrer` cadre le sujet sur sa
             boîte englobante et le porte à `emprise/32` de la case, puis
             `conditionner` réduit. C'est ce que font les quinze autres
             producteurs, et les coques, l'infanterie, les aéronefs, les socles,
             le mur et les deux barrières y passent.

  `carre`    aucun recadrage. La planche EST le sprite, à l'échelle près. Les
             onze tourelles tournent au rendu (arbitrage du 05/09) : leur pixel
             de pivot doit rester au centre exact du fichier, et la marge autour
             doit rester intacte, sinon un canon se fait rogner à 45°.
             **Recadrer une tourelle casse sa rotation** — `recadrer` recentre
             sur la boîte englobante, qui n'est PAS centrée sur le pivot.

⚠ ET LES ONZE PLANCHES SONT DÉJÀ CARRÉES ET DÉJÀ CENTRÉES — mesuré, pas supposé.
`def_j_casemate` fait 720 × 720 pour un carré de rotation recalculé de 720, et
les onze sortent « OUI » au même contrôle. Le recentrage a été fait à la source ;
`tools/ancres-defense.py` et `tools/ancres-blindes.py` ne font que MESURER le
côté, ils ne le produisent plus.

⚠⚠ L'EMPRISE EST PAR UNITÉ, PLUS PAR CHÂSSIS, ET LE DISCRIMINANT EXISTAIT DÉJÀ.
`unites_ouvrage.py` portait `{'escouade': 26, 'blinde': 24, 'aeronef': 28}` : une
valeur par châssis, donc **toutes** les coques normalisées sur la même plus
grande dimension. Mesuré sur la v1, les cinq coques d'attaque sortaient à 24,0
gros pixels de long, exactement la même longueur pour les cinq — le Percheron ne
pesait rien de plus que l'Éclaireur. `UNITES[cle].points` vaut 15 pour le
Percheron, l'Obusier et l'Albatros et 10 pour les autres : ce sont exactement les
trois engins lourds, et c'est une donnée du dépôt, pas une seconde liste de noms
à tenir à jour.

⚠ LES VALEURS DES ESCOUADES SE LISENT SUR L'EXISTANT, ELLES NE CHANGENT PAS.
`final128.U` donne 18 aux deux escouades à 5 points et 24 aux trois à 10 points :
la table ci-dessous ne fait que le RELIRE sous la clé `points`.
"""
import argparse
import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites                                  # noqa: E402

from PIL import Image                                                # noqa: E402
from final128 import pal, recadrer, conditionner, ecrire             # noqa: E402
from cond import boite                                               # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
COMBAT = os.path.join(RACINE, 'src', 'data', 'combat.js')
GRILLES = (128, 64)   # la 32 est sortie au lot PIXELS

# ---------------------------------------------------------------------------
# Les emprises, en gros pixels sur une grille de 32
# ---------------------------------------------------------------------------
#
# ⚠ 90 % DE 32 FONT 28,8 ET LES OUTILS PRENNENT UN ENTIER : c'est 29, un de plus
# que les 28 d'aujourd'hui. 85 % font 27,2, donc 27. Les deux écarts à la
# consigne d'Ethan sont sous le tiers de gros pixel, et ils sont déclarés au
# rapport du lot.
EMPRISE_QUATRE_VINGT_DIX = 29
EMPRISE_QUATRE_VINGT_CINQ = 27

EMPRISE_UNITE = {
    # châssis  → { points : emprise }
    'escouade': {5: 18, 10: 24},     # relu sur `final128.U`, inchangé
    'blinde': {10: 20, 15: 31},      # arbitré le 05/09
    'aeronef': {10: 25, 15: 32},     # arbitré le 05/09
}

def unites_du_depot():
    """`{clé: (châssis, points, pose de défense)}`, LU dans `src/data/combat.js`.

    ⚠⚠ ON LIT LA DONNÉE, ON NE LA RECOPIE PAS. Une table de noms lourds écrite
    ici serait la seconde vérité que `CLAUDE.md` §4 interdit, et la première à
    mentir le jour où une quinzième unité arrive. La lecture est bornée : elle
    LÈVE si elle ne retrouve pas quatorze unités, ou si l'une d'elles n'a ni
    châssis ni points. Un parseur qui rendrait une table incomplète ferait
    conditionner à la mauvaise échelle sans rien dire.
    """
    texte = open(COMBAT, encoding='utf-8').read()
    debut = texte.index('export const UNITES = {')
    corps = texte[debut:texte.index('\n};', debut)]
    out = {}
    for bloc in re.finditer(r'\n  (\w+): \{(.*?)\n  \},', corps, re.S):
        cle, contenu = bloc.group(1), bloc.group(2)
        c = re.search(r"chassis: '(\w+)'", contenu)
        p = re.search(r'points: (\d+)', contenu)
        d = re.search(r'defense: \{ present: (true|false)', contenu)
        if c and p and d:
            out[cle] = (c.group(1), int(p.group(1)), d.group(1) == 'true')
    if len(out) != 14:
        raise AssertionError(
            f'src/data/combat.js : {len(out)} unités lues, 14 attendues — '
            'la forme du fichier a bougé, le parseur doit suivre')
    if set(c for c, _, _ in out.values()) != {'escouade', 'blinde', 'aeronef'}:
        raise AssertionError('châssis inattendu dans UNITES')
    return out


def emprise_de(cle, unites):
    chassis, points, _ = unites[cle]
    table = EMPRISE_UNITE[chassis]
    if points not in table:
        raise AssertionError(
            f'{cle} : {points} points, et la table n\'a que {sorted(table)} pour '
            f'un {chassis}. Une valeur d\'emprise est à arbitrer, pas à deviner.')
    return table[points]


# ---------------------------------------------------------------------------
# La table des quarante-deux
# ---------------------------------------------------------------------------
#
# `(dossier de famille, nom du sprite, planche source, mode, emprise)`.
# L'emprise vaut `None` en mode `carre`.
#
# ⚠ LE NOM DE LA PLANCHE EST LE NOM DU SPRITE, sauf pour les six tourelles de
# défense, dont la planche s'appelle déjà `def_j_<id>` : c'est le même nom, et
# c'est voulu — une tourelle EST la défense, son socle est une pièce à part.

INFANTERIE = ['meute', 'meute_def', 'guetteur', 'guetteur_def', 'perceurs',
              'perceurs_def', 'fouisseurs', 'carapace', 'carapace_def']
AERONEFS = ['crecelle', 'busard', 'frappeur', 'enclume']
COQUES = ['ratisseur_chassis', 'ratisseur_chassis_def',
          'fendeur_chassis', 'fendeur_chassis_def',
          'broyeur_chassis', 'broyeur_chassis_def',
          'belier_chassis', 'belier_chassis_def',
          'pilon_chassis']
TOURELLES_BLINDE = ['ratisseur', 'fendeur', 'broyeur', 'belier', 'pilon']
TOURELLES_DEFENSE = ['casemate', 'creneau', 'batterie', 'faucheuse', 'mortier', 'harpon']
CONTACT = ['casemate', 'creneau', 'batterie']
ARTILLERIES = ['faucheuse', 'mortier', 'harpon']
MUR_ET_BARRIERES = ['merlon', 'ronce', 'herse']


# ⚠⚠ L'EMPRISE PAR SPRITE, POUR LES DEUX OUTILS D'ANCRE. `tools/ancres-defense.py`
# et `tools/ancres-blindes.py` en ont besoin pour convertir une ancre mesurée en
# pourcentage de la PIÈCE vers le pourcentage de la CASE que le rendu emploie —
# voir leur en-tête. Ils l'IMPORTENT d'ici plutôt que de la recopier : une
# seconde table divergerait au premier réglage, et la tourelle se poserait à côté
# de son trou sans que rien ne lève.
def emprise_par_sprite():
    unites = unites_du_depot()
    out = {}
    for nom in COQUES:
        out[f'off_j_{nom}'] = emprise_de(nom.split('_')[0], unites)
    for cle in CONTACT:
        out[f'socle_def_j_{cle}'] = EMPRISE_QUATRE_VINGT_DIX
    for cle in ARTILLERIES:
        out[f'socle_def_j_{cle}'] = EMPRISE_QUATRE_VINGT_CINQ
    return out


def taches(unites, camp='j'):
    """Rend `(famille, nom, source, mode, emprise)` pour les quarante-deux.

    ⚠⚠ ELLE PREND UN CAMP DEPUIS LE LOT OUVRAGE-CÂBLAGE, ET C'EST UN ÉCART AU
    BRIEF, DÉCLARÉ. Il demandait un `tools/ouvrage_v2.py` « jumeau » portant sa
    propre table de quarante-deux entrées. Mesuré avant d'écrire : les huit
    listes d'identifiants au-dessus décrivent EXACTEMENT le camp de l'Ouvrage
    aussi — neuf poses d'infanterie, quatre aéronefs, neuf coques dont l'Obusier
    sans pose de défense, cinq tourelles de blindé, trois pièces monolithiques,
    six tourelles de défense, six socles. Une seconde table aurait donc recopié
    quarante-deux lignes à l'identique au seul changement d'une lettre, et
    `CLAUDE.md` §4 le refuse : « une seule table fait foi par grandeur ». La
    lettre de camp est le SEUL paramètre, et `tools/ouvrage_v2.py` l'appelle avec
    `'o'`.

    ⚠ LE DÉFAUT VAUT `'j'`, DONC RIEN NE CHANGE POUR LE JOUEUR — et ce n'est pas
    une supposition : `tools/verifier.py` rejoue `joueur_v2.py` et compare ses
    quatre-vingt-quatre fichiers à l'octet.
    """
    if camp not in ('j', 'o'):
        raise AssertionError(f'camp « {camp} » : la lettre vaut « j » ou « o »')
    out = []
    # unité — les neuf poses d'infanterie et les quatre aéronefs
    for suffixe in INFANTERIE + AERONEFS:
        cle = suffixe[:-4] if suffixe.endswith('_def') else suffixe
        out.append(('unite', f'off_{camp}_{suffixe}', f'off_{camp}_{suffixe}',
                    'emprise', emprise_de(cle, unites)))
    # chassis — les neuf coques ; l'Obusier n'a pas de pose de défense
    for nom in COQUES:
        cle = nom.split('_')[0]
        out.append(('chassis', f'off_{camp}_{nom}', f'off_{camp}_{nom}',
                    'emprise', emprise_de(cle, unites)))
    # tourelle-unite — les cinq tourelles de blindé, carrées
    for cle in TOURELLES_BLINDE:
        out.append(('tourelle-unite', f'off_{camp}_{cle}_tourelle',
                    f'off_{camp}_{cle}_tourelle', 'carre', None))
    # defense — le mur, les deux barrières, les six tourelles
    for cle in MUR_ET_BARRIERES:
        out.append(('defense', f'def_{camp}_{cle}', f'def_{camp}_{cle}',
                    'emprise', EMPRISE_QUATRE_VINGT_DIX))
    for cle in TOURELLES_DEFENSE:
        out.append(('defense', f'def_{camp}_{cle}', f'def_{camp}_{cle}', 'carre', None))
    # socle — trois socles de tourelle à 90 %, trois coques d'artillerie à 85 %
    for cle in CONTACT:
        out.append(('socle', f'socle_def_{camp}_{cle}', f'socle_def_{camp}_{cle}',
                    'emprise', EMPRISE_QUATRE_VINGT_DIX))
    for cle in ARTILLERIES:
        out.append(('socle', f'socle_def_{camp}_{cle}', f'socle_def_{camp}_{cle}',
                    'emprise', EMPRISE_QUATRE_VINGT_CINQ))
    return out


def main():
    argparse.ArgumentParser(description=__doc__).parse_args()
    unites = unites_du_depot()
    P = pal(False)                       # le joueur n'emploie pas la rampe ardoise
    n = 0
    print(f"{'famille':<15}{'sprite':<30}{'mode':<9}{'empr.':>6}   boîte en 32")
    for famille, nom, source, mode, emprise in taches(unites):
        im = Image.open(os.path.join(SRC, source + '.png'))
        trace = ''
        for N in GRILLES:
            cellule = im if mode == 'carre' else recadrer(im, emprise * (N // 32), N)
            g, matiere = conditionner(cellule, P, N)
            d = dossier_sprites(famille, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, nom + '.png'), matiere)
            n += 1
            if N == 64:
                b = boite(g)
                trace = f'{b["l"] / 2:.1f} x {b["h"] / 2:.1f}'
        print(f'{famille:<15}{nom:<30}{mode:<9}'
              f'{("—" if emprise is None else emprise):>6}   {trace}')
    print(f'{n} fichiers écrits')
    return 0


if __name__ == '__main__':
    sys.exit(main())
