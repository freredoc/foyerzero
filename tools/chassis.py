#!/usr/bin/env python3
"""Lot 8 — les cinq coques du joueur, sans tourelle, et leurs ancres.

Dix sprites : 5 blindés × 2 poses. Trois grilles, soit 30 fichiers, plus un
fichier d'ancres.

POURQUOI CE LOT EXISTE. `art/sprites/tourelle-unite/` porte 80 tourelles
détachées par grille, qui tournent. Il n'existait aucune coque sur quoi les
poser : `unite/` ne porte que des unités entières, tourelle cuite dans le corps,
donc incapables de viser. Sans ces coques, les 80 tourelles ne servent à rien.
C'est le même appariement que socle + tourelle du côté des défenses.

LES DEUX POSES ne sont pas « de face » et « de profil » au sens de l'infanterie.
Ce sont deux ORIENTATIONS DE COQUE : chenilles verticales, donc l'engin roule
vers le nord ou le sud, et chenilles horizontales, donc il roule vers l'est ou
l'ouest. Ça recoupe l'arbitrage du 29/08 — un véhicule se déplace latéralement
en défense. D'où les noms de sortie : sans suffixe pour l'attaque, `_def` pour
la défense, comme les unités de l'Ouvrage.

⚠ CE LOT NE PRODUIT PAS DE TOURELLE ASSISE. Il aurait fallu la rendre une fois
par pose, soit 5 × 16 × 2 = 160 sprites au lieu de 80, parce que l'anneau ne
tombe pas au même endroit selon la pose — 8 à 10 % de la largeur de coque
d'écart, soit deux gros pixels à la grille 32, largement visible. La tourelle
reste donc centrée sur son propre pivot, et **la coque publie l'ancre où la
poser**. Dix nombres au lieu de deux cent quarante fichiers.

⚠ L'ANNEAU N'A PAS LA MÊME APPARENCE D'UNE COQUE À L'AUTRE : un trou traversant
sur le broyeur et le fendeur, un disque sombre sur le bélier et le ratisseur, un
disque CLAIR sur le pilon. Le détecteur unifié en trouve neuf sur dix ; la
dixième est interpolée et signalée comme telle.

    python3 tools/chassis.py
"""
import sys, os, json
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))

from PIL import Image
import numpy as np
from scipy import ndimage as nd
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire

SRC = os.path.join(RACINE, 'art', 'sources')
DST = os.path.join(RACINE, 'art', 'sprites', 'chassis')
ANCRES = os.path.join(RACINE, 'art', 'sprites', 'ancres-chassis.json')
GRILLES = (128, 64, 32)
EMPRISE = 24                      # même emprise que les blindés de la table U

BLINDES = ['ratisseur', 'fendeur', 'belier', 'broyeur', 'pilon']
POSES = ['', '_def']              # cellule 0 = attaque, cellule 1 = défense

# Le pilon en pose d'attaque n'a pas d'anneau détectable : le sien est un disque
# CLAIR, et les seules zones sombres de sa coque sont ses chenilles. La valeur
# ci-dessous n'est pas mesurée sur lui — elle est interpolée, et c'est pour ça
# qu'elle est ici plutôt que dans le détecteur :
#   - le diamètre vient de SA PROPRE pose de défense, 42 % de la largeur de
#     coque : l'anneau d'un char est le même dans les deux poses ;
#   - le décalage vient de la médiane des quatre autres coques en pose
#     d'attaque — (-0,6 · -0,1 · -1,3 · -0,3) et (-8,1 · -6,9 · -15,1 · -13,3).
# À remplacer par une mesure le jour où la planche est reprise.
ANCRE_FORCEE = {('pilon', ''): {'diametre_pct': 42.0, 'x_pct': -0.5, 'y_pct': -10.7,
                                'mesure': False}}


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


def cellules(chemin):
    im = Image.open(chemin).convert('RGBA')
    a = np.array(im.convert('RGB')).astype(int)
    m = ~est_fond(a)
    H, W = m.shape
    bx = bandes(m.any(0))
    if len(bx) != 2:
        raise AssertionError(f'{os.path.basename(chemin)} : {len(bx)} bandes, 2 attendues')
    cx = [0, (bx[0][1] + bx[1][0]) // 2, W]
    return [(im.crop((cx[k], 0, cx[k + 1], H)),
             a[:, cx[k]:cx[k + 1]], m[:, cx[k]:cx[k + 1]]) for k in range(2)]


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

    if not trouves:
        return None
    _, w, h, mx, my = max(trouves)
    return {'diametre_pct': round(100 * max(w, h) / W, 1),
            'x_pct': round((mx - cx0) / W * 100, 1),
            'y_pct': round((my - cy0) / H * 100, 1),
            'mesure': True}


def main():
    ancres = {}
    n = 0
    for cle in BLINDES:
        chemin = os.path.join(SRC, f'off_j_{cle}_chassis_face_profil.png')
        for k, (cell, a, m) in enumerate(cellules(chemin)):
            nom = f'off_j_{cle}_chassis{POSES[k]}'
            trouve = ANCRE_FORCEE.get((cle, POSES[k])) or ancre(a, m)
            if trouve is None:
                raise AssertionError(f'{nom} : aucune ancre, et aucune valeur forcée')
            ancres[nom] = trouve
            for N in GRILLES:
                g = conditionner(recadrer(cell, EMPRISE * (N // 32), N), pal(False), N)
                d = os.path.join(DST, str(N))
                os.makedirs(d, exist_ok=True)
                ecrire(g, pal(False), os.path.join(d, f'{nom}.png'))
                n += 1
    with open(ANCRES, 'w', encoding='utf-8') as f:
        json.dump(ancres, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write('\n')
    mesurees = sum(1 for v in ancres.values() if v['mesure'])
    print(f'{n} fichiers écrits, {len(ancres)} ancres dont {mesurees} mesurées')
    return 0


if __name__ == '__main__':
    sys.exit(main())
