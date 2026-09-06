#!/usr/bin/env python3
"""Défenses du joueur — ancres des socles, tourelles centrées sur leur pivot.

Depuis l'arbitrage du 05/09, la tourelle d'une défense TOURNE AU RENDU : un
sprite par tourelle au lieu de seize. Deux conséquences, et elles sont
mécaniques, pas esthétiques :

  1. le sprite doit être CARRÉ et centré sur son pivot, sinon la tourelle décrit
     un cercle autour du centre du fichier au lieu de pivoter sur place ;
  2. le côté du carré doit valoir deux fois la distance pivot → pixel le plus
     loin, sinon les canons sortent du cadre à 45° et se font rogner.

Le socle, lui, ne tourne pas : c'est lui qui publie l'ancre où poser la
tourelle, exactement comme une coque de blindé le fait au lot 8. Le détecteur
d'ancre est CELUI DU DÉPÔT, `tools/chassis.py:ancre`, importé tel quel — en
réécrire un second aurait fait deux vérités sur ce qu'est un logement.

    python3 tools/ancres-defense.py
"""
import os
import sys
import json

import numpy as np
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chassis import ancre                                    # noqa: E402
from joueur_v2 import emprise_par_sprite                     # noqa: E402
from chemins import dossier_sprites                          # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
ANCRES = dossier_sprites('ancres-defense.json')

# ⚠ CHOISI À L'ŒIL, À 40 PX, PAS DÉDUIT. Caler l'embase sur l'OUVERTURE du
# logement est géométriquement juste et visuellement mort : à la taille du jeu,
# le canon disparaît et il ne reste qu'un anneau de couleur autour d'un trou
# noir — on ne distingue plus une Casemate d'un Créneau autrement que par la
# teinte. À 1,6 l'embase déborde sur le rebord, le canon se lit, et les quatre
# coins colorés restent à découvert. Comparaison des trois échelles :
# `controle/echelle-tourelles.png`. Deux nombres à retoucher si ça bouge.
#
# ⚠ LES ARTILLERIES SONT À 2,4, PAS À 1,6, ET CE N'EST PAS UNE INCOHÉRENCE.
# Leur socle est une coque à chenilles, plus haute que large et conditionnée à
# 85 % : le logement n'y vaut que 31 à 35 % de la coque, contre 45 % sur le
# socle carré. À échelle égale leur tourelle sortait donc nettement plus petite
# que celle d'une défense de contact, alors que ce sont les pièces à longue
# portée. +50 % demandé le 05/09 après lecture de la planche à 40 px.
ECHELLE = {'contact': 1.6, 'artillerie': 2.4}
ARTILLERIES = ('faucheuse', 'mortier', 'harpon')

# socle → tourelle qui s'y pose.
COUPLES = {
    'socle_def_j_casemate': 'def_j_casemate',
    'socle_def_j_creneau': 'def_j_creneau',
    'socle_def_j_batterie': 'def_j_batterie',
    'socle_def_j_faucheuse': 'def_j_faucheuse',
    'socle_def_j_mortier': 'def_j_mortier',
    'socle_def_j_harpon': 'def_j_harpon',
}


def charger(nom):
    a = np.array(Image.open(os.path.join(SRC, nom + '.png')).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ~((g < 100) & (r > 110) & (b > 110) & (np.abs(r - b) < 90))
    return a, m


def pivot(m):
    """Le centre de la face supérieure de l'embase.

    Une embase est un cylindre vu de biais. Sa silhouette atteint sa largeur
    maximale sur une BANDE de lignes : de l'horizontale de l'ellipse du haut à
    celle de l'ellipse du bas. Le pivot est donc sur la PREMIÈRE ligne de cette
    bande, pas au milieu de la silhouette — prendre le milieu poserait la
    tourelle un demi-cylindre trop bas.
    """
    larg = m.sum(axis=1)
    D = int(larg.max())
    lignes = np.where(larg >= 0.98 * D)[0]
    y = int(lignes.min())
    xs = np.where(m[y])[0]
    return (xs.min() + xs.max() + 1) / 2, float(y), D


def cote_du_carre(m, px, py):
    """Le côté du carré de rotation : deux fois la distance pivot → pixel le plus loin.

    ⚠⚠ IL SE MESURE, IL NE SE PRODUIT PLUS. La version livrée de cet outil
    écrivait aussi le PNG recentré, dans `art/sources/centrees/`. Deux raisons de
    ne pas le garder : `art/sources/` ne porte que des ORIGINAUX — « rien n'y est
    un produit, tout y est un original » (CLAUDE.md §2) — et surtout la mesure
    dit que le geste n'a rien à faire. Les six planches livrées sont DÉJÀ carrées
    et déjà centrées sur leur pivot : `def_j_casemate` mesure 720 × 720 pour un
    carré recalculé de 720, et les onze tourelles des deux familles sortent
    « OUI » au même contrôle. Le recentrage est donc idempotent, et le seul
    nombre qui sert en aval est ce côté-ci.

    ⚠ CE QUI DISPARAÎT AVEC LE PNG : le contrôle « aucun pixel perdu au
    recentrage » que l'outil livré faisait par assertion. Il n'a plus d'objet —
    on ne recentre plus rien. Ce qui le remplace est plus fort et vit dans
    `test/sprite.test.js` : le sprite est carré, et aucun pixel opaque n'est plus
    loin du centre que la moitié du côté.
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
    socles, tourelles, rapport = {}, {}, []
    emprises = emprise_par_sprite()
    for socle, tourelle in COUPLES.items():
        a, m = charger(socle)
        trouve = ancre(a, m)
        if trouve is None:
            raise AssertionError(f'{socle} : aucun logement détecté')
        socles[socle] = trouve

        _, mt = charger(tourelle)
        px, py, D = pivot(mt)
        cote = cote_du_carre(mt, px, py)

        # ⚠ LE RATIO N'EST PAS COSMÉTIQUE. Le sprite d'une tourelle n'est plus
        # collé sur son embase : il porte la marge de rotation, et cette marge
        # va de ×1,43 à ×2,09 selon la tourelle. Sans ce nombre, une tourelle
        # dessinée « au diamètre du logement » aurait son embase deux fois trop
        # petite, et pas du même facteur d'une tourelle à l'autre.
        famille = 'artillerie' if tourelle.split('_')[-1] in ARTILLERIES else 'contact'
        tourelles[tourelle] = {'cote_pct_embase': round(100 * cote / D, 1),
                               'echelle': ECHELLE[famille]}
        socles[socle].update(ancre_de_case(trouve, m, emprises[socle],
                                           tourelles[tourelle]))

        ys, xs = np.where(m)
        W = xs.max() - xs.min() + 1
        d_px = trouve['diametre_pct'] / 100 * W
        rapport.append((tourelle, D, cote, round(cote / D, 3), trouve, round(d_px)))

    with open(ANCRES, 'w', encoding='utf-8') as f:
        json.dump({'socles': socles, 'tourelles': tourelles},
                  f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write('\n')

    print(f'{"tourelle":<18}{"embase":>8}{"carré":>8}{"ratio":>8}   logement du socle')
    for nom, D, cote, ratio, anc, d_px in rapport:
        print(f'{nom:<18}{D:>8}{cote:>8}{ratio:>8}   '
              f"{anc['diametre_pct']}% = {d_px} px, x {anc['x_pct']}%, y {anc['y_pct']}%")
    print()
    print(f'{"socle":<24}{"côté/case":>11}{"dx/case":>9}{"dy/case":>9}')
    for socle in COUPLES:
        v = socles[socle]
        print(f"{socle:<24}{v['cote_case_pct']:>10.2f}%{v['dx_case_pct']:>8.2f}%"
              f"{v['dy_case_pct']:>8.2f}%")
    return 0


if __name__ == '__main__':
    sys.exit(main())
