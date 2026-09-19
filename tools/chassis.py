#!/usr/bin/env python3
"""Le détecteur d'ancre de tourelle — une bibliothèque, plus un producteur.

⚠⚠ IL NE PRODUIT PLUS AUCUN SPRITE — lot SPRITES-V2-JOUEUR, 05/09. Il fabriquait
les dix coques de la v1 depuis les cinq planches `off_j_*_chassis_face_profil`,
deux cellules chacune, et il écrivait `art/sprites/ancres-chassis.json`. Les
coques v2 sont dessinées une par planche : `tools/joueur_v2.py` les conditionne,
`tools/ancres-blindes.py` mesure leurs ancres. Ce qui reste ici est le seul
morceau que les deux réemploient, et le seul qu'on ne voulait pas voir écrit
deux fois : **la détection du logement de tourelle sur une image**.

⚠ IL SORT DONC DE `CHAINE`. Un outil de la chaîne doit produire des fichiers
qu'on compare ; celui-ci n'en produit plus. `tools/ancres-defense.py` et
`tools/ancres-blindes.py` prennent sa place dans la table du vérificateur, et
tous deux L'IMPORTENT — écrire un second détecteur aurait fait deux vérités sur
ce qu'est un logement.

⚠ LES DIX ANCRES DU LOT 8 ONT ÉTÉ REJOUÉES AVANT DE LE VIDER, et elles sortent
identiques — même JSON, mêmes vingt sprites à l'octet — avec l'ancienne version
du détecteur et avec celle-ci. C'est le contrôle que le brief du lot exigeait
avant toute autre modification du fichier.

⚠ L'ANNEAU N'A PAS LA MÊME APPARENCE D'UNE COQUE À L'AUTRE : un trou traversant
sur le Percheron et le Chasseur, un disque sombre sur le Pionnier et l'Éclaireur,
un disque CLAIR sur l'Obusier. D'où les trois familles de passes ci-dessous, et
le dernier recours — deux depuis le lot ANCRES-ZÉNITH, voir sous les imports.
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))

import numpy as np
from scipy import ndimage as nd


# ⚠⚠ LE DÉTECTEUR A ÉTÉ ÉCRIT POUR LE 75° ET RENDAIT DES VALEURS FAUSSES SANS
# LEVER SUR LE ZÉNITHAL — lot ANCRES-ZÉNITH, 19/09. Mesuré sur les neuf socles
# redessinés AVANT de toucher une ligne, les trois contraintes imprimées pour
# chaque candidat (`rapports/RAPPORT-lotANCRES-ZENITH.md` §1) :
#
#   • `socle_def_o_creneau` MENTAIT : diamètre 82,7 % et y +7,3 % là où ses
#     deux jumeaux carrés rendent 55 % et −0,2. Le bon logement EST trouvé à
#     q10 (145 760 px, rondeur 0,72, centré) ; mais à q22 le contour sombre de
#     la bride sud enferme le disque AVEC le module inférieur du socle, la tache
#     remplie fait 264 755 px, rondeur 0,58, largeur 0,60 W — elle passe les
#     trois contraintes de justesse et, plus grosse, elle gagne. Sa boîte fait
#     555 × 763 : une tache PLUS HAUTE QUE LARGE, h/w = 1,374.
#   • Les trois marcheurs (`faucheuse`, `harpon`, `mortier`) étaient REJETÉS,
#     à 0,22 comme à 0,40, et pas sur le décalage : leur logement est centré.
#     L'intérieur du disque vaut 176 à 186 en somme RVB, son liseré 157 à 167 ;
#     or les pattes et leurs ombres tirent les percentiles vers le noir — q22
#     tombe à 118–144, q30 à 172–175 —, donc le disque n'est JAMAIS sous la
#     coupe avant que le réseau de contours ne se referme sur tout le corps :
#     à q30 la tache remplie fait 97 à 100 % de la largeur, rejetée « largeur ».
#     Sur les socles carrés, c'est le liseré du disque (102–113, sous q10) que
#     `fill_holes` remplit ; les marcheurs n'ont pas ce liseré-là.
#
# DEUX RÉPARATIONS, ET AUCUNE NE DÉPLACE LE 75° — MESURÉ AU BIT, PAS RAISONNÉ :
#
#   1. Une QUATRIÈME contrainte : un logement n'est jamais plus haut que large.
#      Vu de dessus il est rond (h = w), vu de biais c'est une ellipse écrasée
#      verticalement (h < w). Mesuré sur les 30 pièces 75° du dépôt — 12 socles,
#      18 coques — et sur TOUS leurs candidats retenus, pas seulement les
#      gagnants : h/w ≤ 1,076 (le disque du Pionnier, dernier recours). Sur les
#      logements zénithaux justes : 0,96 à 1,03. La fausse tache du créneau :
#      1,374. Le seuil est à 1,2, à distance des deux bords.
#   2. Un SECOND dernier recours, après le « trou du clair » : la TACHE sombre.
#      Une ouverture morphologique (disque de rayon 1 % de W) efface les traits
#      — contours, ombres fines — et garde les taches ; on ne remplit rien.
#      Percentiles 30 à 60, la première coupe qui rend un candidat l'emporte.
#      Il ne court QUE si les passes précédentes n'ont rien trouvé : les 30
#      pièces 75° trouvent toutes plus haut, donc il ne s'exécute jamais sur
#      elles. Les trois marcheurs y trouvent leur disque, à −0,6 / −0,7 / −0,8 %.
#
# ⚠ TROIS PISTES ONT ÉTÉ MESURÉES ET ÉCARTÉES, pour qu'on ne les repropose pas :
# exclure les pixels d'accent saturé de la coupe (déplace trois coques de
# l'Ouvrage, et ne répare pas le créneau — sa tache ne contient pas l'anneau
# rouge) ; préférer le candidat le plus rond, ou refuser qu'une tache qui
# grossit perde de la rondeur (le Pionnier 75° a un candidat emboîté plus rond
# de +0,148 que son gagnant, plus que le créneau à +0,142) ; l'excentrement du
# centre de masse dans sa boîte (0,024 au créneau, 0,037 au Pionnier).
#
# ⚠ `journal`, s'il est donné, reçoit chaque candidat examiné avec ses quatre
# contraintes et son verdict : c'est ce qui a permis de dire LAQUELLE rejette
# avant de toucher au code, et c'est ce qui le redira la prochaine fois.
HAUTEUR_SUR_LARGEUR_MAX = 1.2
RAYON_OUVERTURE_PCT = 1.0


def ancre(a, m, decal_max=0.22, journal=None):
    """L'anneau de tourelle : trou traversant OU disque sombre, le plus gros.

    Quatre contraintes écartent les faux positifs — les chenilles sont sombres,
    allongées et excentrées, et une tache qui a annexé un module est plus haute
    que large :
      - rondeur > 0,55, une chenille est à 0,1 ;
      - centre à moins de 22 % du centre de coque ;
      - largeur entre 12 et 62 % de la coque ;
      - hauteur au plus 1,2 fois la largeur — voir ci-dessus.
    """
    ys0, xs0 = np.where(m)
    W = xs0.max() - xs0.min() + 1
    H = ys0.max() - ys0.min() + 1
    cx0 = xs0.min() + W / 2
    cy0 = ys0.min() + H / 2
    trouves = []

    def ajouter(masque, passe=''):
        lab, n = nd.label(masque)
        if not n:
            return
        t = np.bincount(lab.ravel()); t[0] = 0
        for i in np.argsort(t)[::-1][:3]:
            if t[i] < 200:
                break
            ys, xs = np.where(lab == i)
            w = xs.max() - xs.min() + 1
            h = ys.max() - ys.min() + 1
            rondeur = t[i] / (np.pi * (max(w, h) / 2) ** 2)
            decal = max(abs(xs.mean() - cx0) / W, abs(ys.mean() - cy0) / H)
            retenu = (rondeur > 0.55 and decal < decal_max and 0.12 < w / W < 0.62
                      and h <= HAUTEUR_SUR_LARGEUR_MAX * w)
            if journal is not None:
                journal.append({'passe': passe, 'taille': int(t[i]), 'w': int(w), 'h': int(h),
                                'rondeur': float(rondeur), 'decal': float(decal),
                                'largeur': float(w / W), 'h_sur_w': float(h / w),
                                'x_pct': float((xs.mean() - cx0) / W * 100),
                                'y_pct': float((ys.mean() - cy0) / H * 100),
                                'retenu': bool(retenu)})
            if retenu:
                trouves.append((t[i], w, h, xs.mean(), ys.mean()))

    somme = a.sum(-1)
    ajouter(nd.binary_fill_holes(m) & ~m, 'anneau ouvert')   # anneau ouvert
    lum = a[m].sum(-1)
    for q in (6, 10, 15, 22, 30):                    # anneau peint sombre
        ajouter(nd.binary_fill_holes(m & (somme < np.percentile(lum, q))), f'sombre q{q}')

    # ⚠⚠ DERNIER RECOURS, ET SEULEMENT SI RIEN N'A ÉTÉ TROUVÉ. L'anneau du
    # Pionnier v2 — `off_j_belier_chassis` — est aussi sombre que ses chenilles :
    # au seuil qui l'attrape,
    # `fill_holes` recolle les deux en une seule tache, rejetée sur la largeur.
    # Le voir comme un TROU DANS LE BLINDAGE CLAIR, et non comme une tache
    # sombre, le sépare des chenilles, qui sont dehors.
    # Ce passage ne s'exécute jamais sur les dix coques du lot 8 — elles
    # trouvent toutes plus haut — et il redonne, sur les quatre coques v2 où
    # les deux méthodes se croisent, les mêmes valeurs à 0,2 % près.
    if not trouves:
        for q in (40, 50, 60, 70):
            clair = m & (somme > np.percentile(lum, q))
            ajouter(nd.binary_fill_holes(clair) & ~clair, f'trou du clair q{q}')

    # ⚠⚠ SECOND DERNIER RECOURS — LA TACHE SOMBRE, lot ANCRES-ZÉNITH. Les trois
    # socles-marcheurs zénithaux de l'Ouvrage n'ont ni trou, ni liseré sombre
    # sous q10, ni blindage clair qui enferme le disque : il ne reste que la
    # TACHE elle-même. L'ouverture efface les traits qui la relieraient au
    # reste, et on ne remplit pas — remplir, c'est ce qui recollait tout le
    # corps. Il ne court que si les deux familles précédentes n'ont rien rendu,
    # ce qui n'arrive sur aucune des 30 pièces 75° du dépôt.
    if not trouves:
        rayon = max(2, int(round(RAYON_OUVERTURE_PCT / 100 * W)))
        yy, xx = np.mgrid[-rayon:rayon + 1, -rayon:rayon + 1]
        disque = (xx ** 2 + yy ** 2) <= rayon * rayon
        for q in (30, 40, 50, 60):
            sombre = m & (somme < np.percentile(lum, q))
            ajouter(nd.binary_opening(sombre, structure=disque), f'tache q{q}')
            if trouves:
                break

    if not trouves:
        return None
    _, w, h, mx, my = max(trouves)
    return {'diametre_pct': round(100 * max(w, h) / W, 1),
            'x_pct': round((mx - cx0) / W * 100, 1),
            'y_pct': round((my - cy0) / H * 100, 1),
            'mesure': True}
