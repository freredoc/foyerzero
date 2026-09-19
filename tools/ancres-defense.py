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
from scipy import ndimage as nd

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
    """Le centre et le diamètre de l'embase — le plus grand disque inscrit.

    ⚠⚠ L'HYPOTHÈSE DU CYLINDRE VU DE BIAIS EST TOMBÉE AVEC LES DESSINS — lot
    ANCRES-ZÉNITH, 19/09. Cette fonction disait : « une embase est un cylindre vu
    de biais, sa silhouette atteint sa largeur maximale sur une bande, le pivot
    est sur la PREMIÈRE ligne de cette bande ». Vrai des douze tourelles à 75°,
    faux des douze tourelles zénithales : vu de dessus il n'y a plus de bande,
    et la largeur maximale est atteinte là où le dessin est le plus large — qui
    n'est pas l'embase. Mesuré sur `def_o_harpon` : la bande était la rangée
    de missiles, D = 858 pour une embase de 390, soit ×2,2 ; le pivot rendu
    tombait à 157 px au-dessus du disque. Sur les cinq autres de l'Ouvrage, la
    première ligne de la bande d'un DISQUE est à 0,1 D au-dessus de son centre —
    d'où les +3 à +12 % relevés par le brief.

    EN ZÉNITHAL, L'EMBASE EST LE PLUS GRAND DISQUE INSCRIT DANS LA SILHOUETTE :
    son centre est le maximum de la transformée de distance, son diamètre deux
    fois cette distance. Les canons, rampes et ailerons sont des appendices
    plus minces que l'embase et ne le déplacent pas. Vérifié sur les douze
    dessins, disque tracé sur chacun (`rapports/`, planche du lot) : les six de
    l'Ouvrage l'épousent, les six du joueur trouvent la plaque sous les canons,
    et les deux harpons ignorent leurs rampes.

    ⚠ LE MAXIMUM EST UN PLATEAU, PAS UN POINT. Sur une plaque plus large que
    haute, ou sur une embase ovale, la distance maximale est atteinte sur un
    SEGMENT : `def_o_mortier` la tient de y = 614 à 695 pour un anneau centré
    vers 655, et `argmax` rendrait le premier pixel, 40 px trop haut. On prend
    donc le centre des pixels à moins d'un centième du rayon du maximum — au
    moins un pixel : à un demi-pixel le plateau ne fait que 14 px et penche
    encore (640) ; à un centième il en fait 86 et tombe à 654. Coordonnées en
    bords de pixel, comme avant.

    ⚠ UNE APPROXIMATION ASSUMÉE : sur une embase polygonale ou à brides, le
    disque inscrit est l'apothème, un peu sous la largeur du plateau — 606 pour
    627 sur `def_o_casemate`, 3 %. Pour l'Ouvrage c'est sans effet sur le
    rendu, `echelle` étant calée sur le carré du joueur ; pour le joueur c'est
    la définition retenue : le plus grand disque qui tienne sous le corps.

    ⚠⚠ LE 75° N'A PLUS DE LECTEUR ICI, ET IL N'EST PAS PERDU. Les douze
    tourelles de défense sont zénithales depuis ce lot ; la règle du tambour vit
    encore, inchangée, dans `tools/ancres-blindes.py:pivot`, pour les dix
    tourelles de blindé qui restent à 75°. Aucun discriminant automatique
    75°/zénithal n'a tenu la mesure — cinq ont été essayés sur les vingt-quatre
    planches, voir le rapport —, donc deux fonctions, une par géométrie, chacune
    avec ses lecteurs. Le montage T1 du lot rejoue cet outil sur les sources 75°
    écartées AVEC la règle du tambour et retrouve le JSON d'avant à l'octet.
    """
    dist = nd.distance_transform_edt(m)
    rayon = float(dist.max())
    ys, xs = np.where(dist >= rayon - max(1.0, 0.01 * rayon))
    return float(xs.mean()) + 0.5, float(ys.mean()) + 0.5, int(round(2 * rayon))


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

    ⚠⚠ CE QUI PRÉCÈDE ÉTAIT VRAI DES PLANCHES À 75° ET EST FAUX DES PLANCHES
    ZÉNITHALES — lot ANCRES-ZÉNITH, 19/09, mesuré sur les douze. Elles sont
    carrées (1 254 ou 1 024) mais PAS centrées sur leur pivot : l'embase est de
    21 px (`def_o_casemate`) à 225 px (`def_j_mortier`) SOUS le centre du
    fichier, et le carré de rotation dépasse le côté du fichier sur dix d'entre
    elles (1 430 à 1 638 pour 1 254 chez le joueur). Le mode `carre` de
    `joueur_v2.py` — « aucun recadrage, la planche EST le sprite » — ne peut donc
    pas leur être appliqué tel quel : le lot de conditionnement devra RECENTRER
    chaque tourelle sur le pivot que cette fonction-ci reçoit et agrandir la
    toile au côté qu'elle rend, sans quoi la tourelle décrira un cercle de 20 à
    225 px autour de son embase en tournant. Ce lot-ci MESURE ; il ne
    conditionne pas (brief §5).
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
