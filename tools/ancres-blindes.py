#!/usr/bin/env python3
"""Blindés du joueur, v2 — ancres des coques, tourelles centrées sur leur pivot.

MÊME MÉCANIQUE QUE LES DÉFENSES, et pour la même raison : depuis l'arbitrage du
05/09 la tourelle tourne au rendu. Un sprite par tourelle au lieu de seize, donc
un sprite CARRÉ et centré sur son pivot, avec la marge pour ne rien rogner
à 45°. La coque ne tourne pas : elle publie l'ancre où poser la tourelle.

⚠⚠ LES DIX ANCRES DE `src/data/ancres-chassis.js` NE VALENT PLUS RIEN. Elles ont
été mesurées au lot 8 sur les coques de la v1. Ces coques-ci sont redessinées :
le logement n'est ni au même endroit ni de la même taille. Reprendre les
anciennes valeurs poserait chaque tourelle à côté de son trou, et le test qui
confronte la transcription à `ancres-chassis.json` ne le verrait pas — il
compare la copie à sa source, pas la source au dessin.

Le détecteur est CELUI DU DÉPÔT, `tools/chassis.py:ancre`, importé tel quel.

    python3 tools/ancres-blindes.py
"""
import os
import sys
import json

import numpy as np
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chassis import ancre                                     # noqa: E402
from joueur_v2 import emprise_par_sprite, unites_du_depot     # noqa: E402
from chemins import dossier_sprites                           # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
ANCRES = dossier_sprites('ancres-blindes.json')

BLINDES = ['ratisseur', 'fendeur', 'broyeur', 'belier', 'pilon']
POSES = ['_chassis', '_chassis_def']

# ⚠⚠ L'OBUSIER N'A PAS DE POSE DE DÉFENSE, ET CE N'EST PAS UN FICHIER MANQUANT.
# `pilon.defense.present` vaut `false` dans `src/data/combat.js`, et `nomAvecPose`
# ne demande `_def` que pour la force `garnison` : un blindé qui n'entre jamais
# en garnison ne voit jamais sa coque de défense. La liste des poses se LIT donc
# dans la donnée — la version livrée de cet outil imprimait « SOURCES ABSENTES :
# off_j_pilon_chassis_def » à chaque exécution, un avertissement permanent qui
# aurait fini par couvrir un vrai manque. Ici une source absente qui DEVRAIT
# exister fait LEVER.


def poses_de(cle, unites):
    _, _, defense = unites[cle]
    return POSES if defense else POSES[:1]

# ⚠ CHOISIE À L'ŒIL, À 40 PX, comme pour les défenses. L'embase calée pile sur
# l'ouverture du logement donne un canon illisible à la taille du jeu. 2,2 ici
# et non 1,6 comme aux défenses : l'emprise d'une coque est de 24/32, pas de
# 90 %, et son logement ne vaut que 18 à 35 % de la coque contre 45 % sur le
# socle carré. À 2,8 le tambour déborde sur les chenilles de l'Éclaireur et du
# Percheron ; à 1,6 aucun canon ne se lit. Voir controle/echelle-blindes.png.
ECHELLE = 2.2


def masque(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return ~((g < 100) & (r > 110) & (b > 110) & (np.abs(r - b) < 90))


def charger(nom):
    chemin = os.path.join(SRC, nom + '.png')
    if not os.path.exists(chemin):
        return None, None
    a = np.array(Image.open(chemin).convert('RGB')).astype(int)
    return a, masque(a)


def pivot(m):
    """Centre de la face supérieure de l'embase : première ligne la plus large."""
    larg = m.sum(axis=1)
    D = int(larg.max())
    y = int(np.where(larg >= 0.98 * D)[0].min())
    xs = np.where(m[y])[0]
    return (xs.min() + xs.max() + 1) / 2, float(y), D


def cote_du_carre(m, px, py):
    """Le côté du carré de rotation. Voir `tools/ancres-defense.py` pour le motif :
    les cinq tourelles livrées sont DÉJÀ carrées et centrées sur leur pivot —
    `off_j_fendeur_tourelle` mesure 1 138 × 1 138 pour un carré recalculé de
    1 138 —, donc le recentrage est idempotent et le PNG qu'écrivait la version
    livrée n'avait rien à produire. `art/sources/` ne porte que des originaux.
    """
    ys, xs = np.where(m)
    rayon = int(np.ceil(np.sqrt(((xs - px) ** 2 + (ys - py) ** 2).max())))
    return 2 * rayon


# ---------------------------------------------------------------------------
# De l'ancre MESURÉE à l'ancre que le rendu emploie
# ---------------------------------------------------------------------------
#
# ⚠⚠ DEUX RÉFÉRENTIELS, ET LES CONFONDRE FAIT DEUX FOIS LA TAILLE DE LA CASE.
# `chassis.py:ancre` mesure sur le DESSIN : `diametre_pct` est un pourcentage de
# la LARGEUR de la pièce, `x_pct` et `y_pct` des pourcentages de sa largeur et de
# sa hauteur. Le rendu, lui, ne connaît que le côté de la case. Or la pièce
# n'occupe pas la case entière : `recadrer` porte sa PLUS GRANDE dimension à
# `emprise / 32`, et l'autre suit le rapport du dessin.
#
# Prendre les nombres mesurés pour des pourcentages de case — ce que faisait le
# rendu du lot 8, et ce que la formule du brief reconduit — multiplie le carré
# par `32 / largeur_de_la_pièce`. Mesuré sur la v2 : le carré du Chasseur ferait
# **131,9 pixels de case sur 64**, soit deux fois la case ; celui de la Faucheuse
# 113,8. La conversion n'est donc pas un raffinement, c'est ce qui rend le
# montage possible.
#
# ⚠ ET C'EST LA FORMULE QUI REND LES PLAFONDS DU BRIEF. Emprise maximale à
# laquelle l'union coque + carré tient encore dans la case : **23,6 pour le
# Chasseur, 31,5 pour le Percheron, 32,0 pour les trois autres** — les trois
# nombres que le brief donne comme mesurés. La formule littérale du brief, elle,
# ne dépend pas de l'emprise et ne peut donc rendre aucun plafond.
#
# Les trois nombres publiés sont donc, en pourcentage de la CASE :
#   cote_case_pct  le côté du carré à dessiner
#   dx_case_pct    le décalage du centre du carré, horizontal
#   dy_case_pct    le décalage du centre du carré, vertical


def boite_dans_la_case(m, emprise):
    """La boîte de la pièce conditionnée, en pourcentage de la case.

    `recadrer` porte la plus grande dimension du sujet à `emprise / 32` de la
    case et centre la boîte ; l'autre dimension suit le rapport du dessin.
    """
    ys, xs = np.where(m)
    W = xs.max() - xs.min() + 1
    H = ys.max() - ys.min() + 1
    grand = max(W, H)
    return 100.0 * emprise / 32 * W / grand, 100.0 * emprise / 32 * H / grand


def ancre_de_case(anc, m, emprise, tour):
    """Les trois nombres du rendu, dérivés de l'ancre mesurée."""
    lc, hc = boite_dans_la_case(m, emprise)
    return {
        'cote_case_pct': round(lc * anc['diametre_pct'] / 100
                               * tour['cote_pct_embase'] / 100 * tour['echelle'], 2),
        'dx_case_pct': round(lc * anc['x_pct'] / 100, 2),
        'dy_case_pct': round(hc * anc['y_pct'] / 100, 2),
    }


def main():
    coques, tourelles, absents, introuvables, lignes = {}, {}, [], [], []
    emprises = emprise_par_sprite()
    masques = {}

    unites = unites_du_depot()
    for cle in BLINDES:
        for pose in poses_de(cle, unites):
            nom = f'off_j_{cle}{pose}'
            a, m = charger(nom)
            if a is None:
                raise AssertionError(
                    f'{nom} : source absente, alors que {cle}.defense.present '
                    'la déclare nécessaire')
            trouve = ancre(a, m)
            if trouve is None:
                introuvables.append(nom)
                continue
            coques[nom] = trouve
            masques[nom] = m
            ys, xs = np.where(m)
            W = xs.max() - xs.min() + 1
            lignes.append((nom, trouve, round(trouve['diametre_pct'] / 100 * W)))

        nom = f'off_j_{cle}_tourelle'
        a, m = charger(nom)
        if a is None:
            raise AssertionError(f'{nom} : source de tourelle absente')
        px, py, D = pivot(m)
        cote = cote_du_carre(m, px, py)
        tourelles[nom] = {'cote_pct_embase': round(100 * cote / D, 1),
                          'echelle': ECHELLE}
        for pose in poses_de(cle, unites):
            coque = f'off_j_{cle}{pose}'
            if coque in coques:
                coques[coque].update(ancre_de_case(
                    coques[coque], masques[coque], emprises[coque], tourelles[nom]))
        lignes.append((nom, {'embase': D, 'carre': cote}, None))

    with open(ANCRES, 'w', encoding='utf-8') as f:
        json.dump({'coques': coques, 'tourelles': tourelles},
                  f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write('\n')

    for nom, val, px in lignes:
        if 'embase' in val:
            print(f"{nom:<32} embase {val['embase']:>4}  carré {val['carre']:>4}"
                  f"  marge ×{val['carre'] / val['embase']:.3f}")
        else:
            print(f"{nom:<32} logement {val['diametre_pct']:>5}% = {px} px,"
                  f" x {val['x_pct']:+.1f}%, y {val['y_pct']:+.1f}%")
    if absents:
        print('\n⚠ SOURCES ABSENTES : ' + ', '.join(absents))
    if introuvables:
        print('⚠ LOGEMENT NON DÉTECTÉ : ' + ', '.join(introuvables))
    print()
    print(f'{"coque":<32}{"côté/case":>11}{"dx/case":>9}{"dy/case":>9}')
    for coque in sorted(coques):
        v = coques[coque]
        print(f"{coque:<32}{v['cote_case_pct']:>10.2f}%{v['dx_case_pct']:>8.2f}%"
              f"{v['dy_case_pct']:>8.2f}%")
    return 0


if __name__ == '__main__':
    sys.exit(main())
