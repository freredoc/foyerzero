#!/usr/bin/env python3
"""Ramène chaque groupe de sprites à une palette ADAPTATIVE, courte et à lui.

C'est le dernier outil de la chaîne, et le seul qui ne lise aucune planche : il
réécrit sur place ce que les onze producteurs viennent d'écrire.

⚠⚠ POURQUOI IL EXISTE. Jusqu'au lot COULEUR, tout sprite était quantifié sur la
palette FERMÉE de `FICHE-STYLE.md` — quatorze teintes, dix-neuf côté Ouvrage —
et la matière du dessin y perdait de 21,9 à 63,9 de distance RVB selon la
famille. `final128.ecrire` rend maintenant la couleur RÉELLE du dessin, par
médoïde ; cet outil-ci la RÉDUIT, groupe par groupe, pour qu'un atlas tienne dans
255 teintes et qu'un PNG palettisé pèse la moitié d'un RGBA.

⚠ CE N'EST PAS LE PRÉCÉDENT DE `bords.py`, C'EST SA GÉNÉRALISATION. Les murs de
contour sont sortis de la palette fermée le 31/08, réduits à seize teintes par
camp, et personne ne l'a regretté. La même règle vaut ici pour les sept familles
conditionnées.

    FZ_SPRITES=... python3 tools/couleurs.py

⚠⚠ IL EST IDEMPOTENT PAR CONSTRUCTION, ET C'EST MESURÉ SUR LA DONNÉE, PAS SUR UN
MARQUEUR. Un groupe libre porte des milliers de teintes ; un groupe déjà réduit
en porte au plus `max(K_CANDIDATS)`. Le second est SAUTÉ — son but est atteint,
il n'y a rien à faire. Sans cette garde, une seconde exécution réduirait un
groupe de 32 teintes à 16, puis à 16 encore, et l'art se dégraderait à chaque
passage sans qu'un fichier ne dise pourquoi.
"""
import os
import sys
from math import isqrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from PIL import Image

from chemins import dossier_sprites

DST = dossier_sprites()

# --- ce qu'on retravaille, et ce qu'on ne retravaille pas --------------------
#
# ⚠⚠ TROIS FAMILLES SONT HORS DE CETTE LISTE, ET CHACUNE POUR SA RAISON.
#
#   `effet`   — hors chaîne quantifiée : ses sprites sont DESSINÉS directement
#               dans leur palette de seize teintes (voir `tools/effets.py` et
#               `INVENTAIRE-SPRITES.md` §8), jamais conditionnés depuis une
#               planche. Mesuré : rendu palette et rendu libre y sont
#               IDENTIQUES, écart 0,0 — une palette adaptative n'y récupère rien
#               et y ajouterait 15,7 d'erreur.
#   `terrain` — déjà libre : `tile_sol_j_a` porte cinq teintes dont AUCUNE n'est
#               dans la palette fermée. C'est une source déclarée de
#               `tools/verifier.py`, qu'aucun outil ne produit.
#   `bord`    — déjà libre, seize teintes par camp, réglé par `tools/bords.py`
#               le 31/08.
FAMILLES = ('bâtiment', 'carte', 'chassis', 'defense', 'socle', 'tourelle-unite', 'unite')
GRILLES = (128, 64, 32)

# ⚠ `K` NE SE CHOISIT PAS, IL SE MESURE : c'est le plus petit de ces quatre qui
# ramène l'écart moyen à la matière sous `ECART_MAX`. Écrire un nombre ici serait
# un choix esthétique, et aucun choix esthétique n'appartient à cet outil.
K_CANDIDATS = (16, 24, 32, 48)
ECART_MAX = 15.0

# ⚠ LA MÊME PONDÉRATION QUE `final128.quant` — (2, 4, 3), vers le vert. Une
# seconde métrique dans la même chaîne serait une seconde vérité sur ce que
# « proche » veut dire entre deux couleurs.
POIDS = np.array([2, 4, 3], dtype=np.int64)

# ⚠⚠ LES SIX TEINTES D'ACCENT, VERROUILLÉES. `final128.ecrire` les a posées
# EXACTES ; les laisser entrer dans la coupe médiane les ferait requantifier, et
# le liseré blanc, rouge et jaune se dissoudrait dans la matière. Premier jet de
# l'essai, sans ce verrou : `def_j_batterie_e` sortait à 348 teintes dont 324
# dans la seule zone d'accent. Elles sont recopiées de `FICHE-STYLE.md` et
# `test/accent.test.js` les confronte à `PALETTE.accents` de `src/render/scene.js`.
ACCENTS = np.array([
    (0x8A, 0x1E, 0x17), (0xE4, 0x3E, 0x32),   # rouge — véhicule
    (0xA6, 0x70, 0x18), (0xF5, 0xB6, 0x36),   # jaune — structure et aviation
    (0x92, 0x8E, 0x80), (0xF5, 0xF3, 0xE8),   # blanc — infanterie
], dtype=np.int32)

# ⚠⚠ `_o` FINAL EST UNE ORIENTATION, PAS UN CAMP. `off_j_belier_o` est le blindé
# du JOUEUR tourné vers l'ouest. Sans cette garde, cinq tourelles et six défenses
# du joueur partent dans le groupe Ouvrage et y prennent sa palette violette :
# mesuré, `defense` sortait à 96 / 108 au lieu de 102 / 102, et `tourelle-unite`
# à 75 / 5 au lieu de 80 / 0.
#
# ⚠ ET LA GARDE EST BORNÉE AUX DEUX FAMILLES ORIENTÉES. `ruine_o` est bien de
# l'Ouvrage : `bâtiment` n'est pas une famille orientée, son dernier jeton n'est
# donc pas retiré.
ORIENT = {'n', 's', 'e', 'o', 'ne', 'no', 'se', 'so',
          'nne', 'nno', 'ene', 'ese', 'sse', 'sso', 'ono', 'oso'}
FAMILLES_ORIENTEES = ('defense', 'tourelle-unite')

# Un échantillon carré plus grand que ça ne change plus la coupe et coûte du
# temps : 600 × 600 fait 360 000 pixels, soit trois fois le plus gros groupe.
COTE_ECHANTILLON_MAX = 600


def camp(nom, famille):
    """Le camp d'un sprite, d'après son nom de fichier."""
    p = nom.split('_')
    if famille in FAMILLES_ORIENTEES and p and p[-1] in ORIENT:
        p = p[:-1]
    return 'ouvrage' if 'o' in p else 'joueur'


def masque_accent(rgb):
    """Les pixels EXACTEMENT d'une des six teintes d'accent."""
    m = np.zeros(rgb.shape[:2], dtype=bool)
    for c in ACCENTS:
        m |= (rgb == c).all(-1)
    return m


def echantillon(pixels):
    """Un carré de pixels, réparti sur TOUT le groupe et non sur son début.

    ⚠ LES INDICES SONT ÉTALÉS, PAS TRONQUÉS. Prendre les `n` premiers pixels
    ferait la palette du groupe sur ses premiers fichiers dans l'ordre
    alphabétique, et le dernier sprite de la famille n'aurait jamais son mot à
    dire sur la coupe.
    """
    n = len(pixels)
    cote = min(isqrt(n), COTE_ECHANTILLON_MAX)
    if cote < 1:
        return None
    pris = cote * cote
    idx = (np.arange(pris, dtype=np.int64) * n) // pris
    return pixels[idx].reshape(cote, cote, 3).astype(np.uint8)


def coupe_mediane(pixels, k):
    """Les `k` teintes (au plus) que la coupe médiane retient sur ce groupe."""
    ech = echantillon(pixels)
    if ech is None:
        return None
    im = Image.fromarray(ech, 'RGB').quantize(
        colors=k, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    # ⚠ ON NE PREND QUE LES ENTRÉES RÉELLEMENT EMPLOYÉES. `getpalette` en rend
    # 256, complétées de noir : les entrées mortes attireraient les pixels
    # sombres et rendraient une teinte que la coupe n'a jamais retenue.
    table = np.array(im.getpalette(), dtype=np.int32).reshape(-1, 3)
    return table[np.unique(np.asarray(im))]


def plus_proches(pixels, table):
    """L'indice de la teinte la plus proche, par paquets pour tenir en mémoire."""
    sortie = np.empty(len(pixels), dtype=np.int32)
    pas = 200_000
    for d in range(0, len(pixels), pas):
        bloc = pixels[d:d + pas].astype(np.int64)
        ecart = bloc[:, None, :] - table[None, :, :].astype(np.int64)
        sortie[d:d + pas] = (POIDS * ecart * ecart).sum(2).argmin(1)
    return sortie


def ecart_moyen(avant, apres):
    """Distance RVB moyenne, par pixel — l'écart à la matière."""
    d = avant.astype(np.float64) - apres.astype(np.float64)
    return float(np.sqrt((d * d).sum(1)).mean())


def groupes(famille, grille):
    """Les fichiers d'une famille et d'une grille, rangés par camp."""
    d = os.path.join(DST, famille, str(grille))
    if not os.path.isdir(d):
        return {}
    par_camp = {}
    for f in sorted(n for n in os.listdir(d) if n.endswith('.png')):
        par_camp.setdefault(camp(f[:-4], famille), []).append(os.path.join(d, f))
    return par_camp


def traiter(chemins):
    """Réduit un groupe. Rend (k, écart, teintes avant, teintes après, écrits)."""
    images, libres = [], []
    for chemin in chemins:
        a = np.array(Image.open(chemin).convert('RGBA'))
        opaque = a[..., 3] >= 128
        libre = opaque & ~masque_accent(a[..., :3].astype(np.int32))
        images.append((chemin, a, libre))
        libres.append(a[..., :3][libre])
    pixels = np.concatenate(libres) if libres else np.empty((0, 3), np.uint8)
    avant = len(np.unique(pixels.reshape(-1, 3), axis=0)) if len(pixels) else 0
    # ⚠ LA GARDE D'IDEMPOTENCE : sous le plafond, le but est atteint.
    if avant <= max(K_CANDIDATS):
        return None, 0.0, avant, avant, 0

    for k in K_CANDIDATS:
        table = coupe_mediane(pixels, k)
        rendus = table[plus_proches(pixels, table)]
        ecart = ecart_moyen(pixels, rendus)
        if ecart < ECART_MAX or k == K_CANDIDATS[-1]:
            break

    d = 0
    for chemin, a, libre in images:
        n = int(libre.sum())
        a[..., :3][libre] = rendus[d:d + n].astype(np.uint8)
        d += n
        Image.fromarray(a, 'RGBA').save(chemin)
    assert d == len(pixels), 'le découpage par sprite ne recouvre pas le groupe'
    apres = len(np.unique(rendus.reshape(-1, 3), axis=0))
    return k, ecart, avant, apres, len(images)


def main():
    ecrits = 0
    print(f"{'groupe':34s} {'sprites':>7s} {'K':>3s} {'écart':>7s} {'avant':>6s} {'après':>6s}")
    for famille in FAMILLES:
        for grille in GRILLES:
            for c, chemins in sorted(groupes(famille, grille).items()):
                k, ecart, avant, apres, n = traiter(chemins)
                ecrits += n
                cle = f'{famille}/{grille} {c}'
                if k is None:
                    print(f'{cle:34s} {len(chemins):7d}   —       —  {avant:6d} {apres:6d}'
                          '   déjà sous le plafond, sauté')
                else:
                    print(f'{cle:34s} {n:7d} {k:3d} {ecart:7.2f} {avant:6d} {apres:6d}')
    print(f'{ecrits} fichiers réécrits')
    return 0


if __name__ == '__main__':
    sys.exit(main())
