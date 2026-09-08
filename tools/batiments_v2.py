#!/usr/bin/env python3
"""Les quatre-vingts sprites de bâtiment, v2 — une planche pour un sprite.

Vingt bâtiments × quatre états × deux grilles. C'est le même geste que
`tools/joueur_v2.py` pour les unités : les planches de la v2 portent un sujet
chacune, leur nom EST le nom du sprite, et il n'y a donc plus de coupe, plus de
gouttière à trouver, plus d'attribution à mesurer.

⚠⚠ ELLES REMPLACENT LES SEIZE ANCIENNES, ELLES NE S'Y AJOUTENT PAS. Jusqu'ici
`tools/planches.py` découpait la table `B` de `final128.py` — cinq planches à
plusieurs sujets — et `tools/ruines.py` en tirait les seize `_detruit`. Les deux
producteurs perdent leurs bâtiments ici, et `ruines.py` ne garde que ce qui n'a
jamais été un bâtiment : `ruine_j` et `ruine_o`. Conserver les deux séries aurait
payé trente-deux sprites en octets pour n'en dessiner que seize.

⚠⚠ L'EMPRISE VIENT DES PV, ET C'EST LA TABLE `PV` DE `final128.py`, PAS UNE
COPIE. `cible(pv)` porte la courbe depuis le lot 6 : 16 gros pixels à 1 000 PV,
28 à 5 500, une racine entre les deux. Cinq clés y entrent avec ce lot — les deux
collecteurs et les trois artilleries — et elles y entrent LÀ-BAS, pas ici, pour
que l'emprise d'un bâtiment reste écrite au même endroit que celle des quinze
autres.

⚠ LES QUATRE ÉTATS PARTAGENT L'EMPRISE DE LEUR BÂTIMENT. Une caserne détruite
doit tenir la place d'une caserne : lui donner sa propre emprise la ferait
grandir ou rétrécir en brûlant, c'est-à-dire annoncer un changement de niveau qui
n'a pas eu lieu. C'est le même motif que la référence d'échelle des emblèmes de
carte, une famille à la fois.

⚠ LA CLÉ DE `PV` EST EN SERPENT, COMME LE NOM DU FICHIER. `BASE_BATIMENTS` parle
en camel — `collecteurQuartz` — et l'art en serpent — `bat_j_collecteur_quartz`.
La conversion est celle de `render/scene.js`, à l'identique ; un test la confronte
plutôt que de la supposer.

    python3 tools/batiments_v2.py
"""
import argparse
import os
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))

from PIL import Image  # noqa: E402
from chemins import dossier_sprites  # noqa: E402
from final128 import pal, recadrer, conditionner, ecrire, boite, PV, OUV, cible  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
GRILLES = (128, 64)

# ⚠ LES QUATRE SUFFIXES, ET L'INTACT N'EN A PAS. Ils sont l'ordre de la
# dégradation, et `src/data/base.js` porte la même liste sous
# `SUFFIXE_ETAT_BATIMENT` — un test confronte les deux plutôt que de les croire
# d'accord.
ETATS = ['', '_abime', '_tres_abime', '_detruit']

# Les vingt bâtiments, en serpent, dans l'ordre de `PV`.
BATIMENTS = [
    'chantier_de_construction', 'centre_de_commandement', 'qg_de_defense',
    'complexe_de_defense', 'caserne', 'depot_de_vehicules', 'aerodrome',
    'centrale', 'collecteur_quartz', 'collecteur_scorie', 'raffinerie',
    'accumulateur', 'artillerie_anti_infanterie', 'artillerie_anti_vehicule',
    'artillerie_anti_aerien',
    'souche', 'etai', 'noeud', 'gangue', 'terril',
]


# ⚠⚠ LA VIGNETTE MIXTE N'A QU'UN ÉTAT, ET CE N'EST PAS UN BÂTIMENT. C'est
# l'icône que la palette montre — « une icône collecteur mixte », Ethan, 08/09 —
# et le joueur ne la pose jamais : ce qui atterrit sur un champ est l'un des deux
# collecteurs, qui ont leurs quatre états. Lui en fabriquer quatre paierait trois
# sprites que rien ne peut afficher.
#
# ⚠ ELLE PREND L'EMPRISE DU COLLECTEUR, pour que la vignette de palette soit à
# la même échelle que ce qu'elle pose. `PV` porte déjà la valeur sous les deux
# collecteurs ; on la lit, on ne l'écrit pas une troisième fois.
VIGNETTES = [('collecteur_mixte', 'collecteur_quartz')]


def taches():
    """Rend (nom_sprite, fichier_source, emprise32, ouvrage) par sprite."""
    out = []
    for cle, emprunte in VIGNETTES:
        nom = 'bat_j_' + cle
        source = os.path.join(SRC, nom + '.png')
        if not os.path.exists(source):
            raise AssertionError(f'{nom}.png : source absente de art/sources/')
        out.append((nom, source, cible(PV[emprunte]), False))
    for cle in BATIMENTS:
        if cle not in PV:
            raise AssertionError(
                f'{cle} : aucune entrée dans `PV` de final128.py — '
                'son emprise ne peut pas se calculer')
        ouv = cle in OUV
        prefixe = 'bat_o_' if ouv else 'bat_j_'
        for etat in ETATS:
            nom = f'{prefixe}{cle}{etat}'
            source = os.path.join(SRC, nom + '.png')
            if not os.path.exists(source):
                raise AssertionError(f'{nom}.png : source absente de art/sources/')
            out.append((nom, source, cible(PV[cle]), ouv))
    return out


def main():
    argparse.ArgumentParser(description=__doc__).parse_args()
    n = 0
    print(f"{'sprite':<40}{'empr.':>6}   boîte en 32")
    for nom, source, emprise, ouv in taches():
        P = pal(ouv)
        im = Image.open(source)
        trace = ''
        for N in GRILLES:
            g, matiere = conditionner(recadrer(im, emprise * (N // 32), N), P, N)
            d = dossier_sprites('bâtiment', str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, nom + '.png'), matiere)
            n += 1
            if N == 64:
                b = boite(g)
                trace = f'{b["l"] / 2:.1f} x {b["h"] / 2:.1f}'
        print(f'{nom:<40}{emprise:>6}   {trace}')
    print(f'{n} fichiers écrits')
    return 0


if __name__ == '__main__':
    sys.exit(main())
