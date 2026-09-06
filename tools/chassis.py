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
le dernier recours.
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))

import numpy as np
from scipy import ndimage as nd


def ancre(a, m):
    """L'anneau de tourelle : trou traversant OU disque sombre, le plus gros.

    Trois contraintes écartent les faux positifs — les chenilles sont sombres,
    allongées et excentrées :
      - rondeur > 0,55, une chenille est à 0,1 ;
      - centre à moins de 22 % du centre de coque ;
      - largeur entre 12 et 62 % de la coque.
    """
    ys0, xs0 = np.where(m)
    W = xs0.max() - xs0.min() + 1
    H = ys0.max() - ys0.min() + 1
    cx0 = xs0.min() + W / 2
    cy0 = ys0.min() + H / 2
    trouves = []

    def ajouter(masque):
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
            if rondeur > 0.55 and decal < 0.22 and 0.12 < w / W < 0.62:
                trouves.append((t[i], w, h, xs.mean(), ys.mean()))

    ajouter(nd.binary_fill_holes(m) & ~m)            # anneau ouvert
    lum = a[m].sum(-1)
    for q in (6, 10, 15, 22, 30):                    # anneau peint sombre
        ajouter(nd.binary_fill_holes(m & (a.sum(-1) < np.percentile(lum, q))))

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
            clair = m & (a.sum(-1) > np.percentile(lum, q))
            ajouter(nd.binary_fill_holes(clair) & ~clair)

    if not trouves:
        return None
    _, w, h, mx, my = max(trouves)
    return {'diametre_pct': round(100 * max(w, h) / W, 1),
            'x_pct': round((mx - cx0) / W * 100, 1),
            'y_pct': round((my - cy0) / H * 100, 1),
            'mesure': True}

