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

⚠⚠ L'EMPRISE NE VIENT PLUS DES PV : ELLE EST LA MÊME POUR LES VINGT — lot
ART-90, 10/09/2026. Ethan : « Les bâtiments sont encore trop petit, ils doivent
tous prendre 90% d'emprise pour être bien visible sur tel », puis, sur le
périmètre : « Seulement bâtiment, pas unités ». Elle vaut donc
`EMPRISE_QUATRE_VINGT_DIX` de `tools/joueur_v2.py`, où le nombre est écrit avec
sa raison depuis le lot SPRITES-V2-JOUEUR — les murs, les barrières et trois
socles du joueur le portent déjà. On le LIT, on ne l'écrit pas une seconde fois.

⚠ CE QUI EST PERDU, ET IL FAUT LE DIRE. `cible(pv)` de `final128.py` portait
depuis le lot 6 une courbe qui faisait de la taille du dessin une LECTURE des
PV : 16 gros pixels à 1 000 PV, 28 à 5 500, une racine entre les deux, soit six
emprises distinctes sur le roster — 16 · 18 · 20 · 21 · 23 · 28. Une Raffinerie
tenait la moitié de sa case et le Chantier 87,5 %, et l'écart SE LISAIT. Il ne se
lit plus : les vingt tiennent la même place, et ce qui distingue un gros bâtiment
d'un petit est désormais le dessin seul. C'est l'arbitrage d'Ethan, pris en
connaissance de ce qu'il coûte. La fonction reste dans `final128.py`, elle n'a
plus d'appelant de production.

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
from final128 import pal, recadrer, conditionner, ecrire, boite, PV, OUV  # noqa: E402
from joueur_v2 import EMPRISE_QUATRE_VINGT_DIX  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
GRILLES = (128, 64)

# ⚠ LES QUATRE SUFFIXES, ET L'INTACT N'EN A PAS. Ils sont l'ordre de la
# dégradation, et `src/data/base.js` porte la même liste sous
# `SUFFIXE_ETAT_BATIMENT` — `AR T3` de `test/art-90.test.js` confronte les deux
# plutôt que de les croire d'accord.
#
# ⚠⚠ ET CETTE PHRASE A ÉTÉ FAUSSE PENDANT DEUX JOURS. Elle était écrite au lot
# BÂTIMENTS-QUATRE-ÉTATS et **aucun test ne le faisait** — mesuré le 10/09 : un
# état ajouté d'un côté et pas de l'autre n'aurait fait tomber personne. La
# garde existe depuis le lot ART-90 ; le renvoi la nomme pour qu'on puisse la
# retrouver au lieu de la croire.
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
# ⚠⚠ ELLE PRENAIT L'EMPRISE DU COLLECTEUR, ET L'EMPRUNT EST DEVENU UNE IDENTITÉ.
# Il existait pour que la vignette de palette soit à la même échelle que ce
# qu'elle pose ; depuis le lot ART-90 les vingt bâtiments partagent une seule
# emprise, donc les deux valent 29 sans qu'on ait à aller la chercher.
#
# ⚠ LE SECOND MEMBRE RESTE, ET IL RESTE VÉRIFIÉ. Il ne sert plus à CALCULER
# l'emprise ; il dit QUEL bâtiment la vignette représente, ce qui est un fait sur
# l'icône et non sur sa taille. `taches` exige toujours qu'il soit dans `PV` : le
# retirer laisserait une vignette qui ne renvoie plus à rien, et un jour à un
# collecteur qui n'existe plus.
VIGNETTES = [('collecteur_mixte', 'collecteur_quartz')]


def taches():
    """Rend (nom_sprite, fichier_source, emprise32, ouvrage) par sprite."""
    out = []
    for cle, emprunte in VIGNETTES:
        if emprunte not in PV:
            raise AssertionError(
                f'{cle} : la vignette renvoie à `{emprunte}`, qui n\'est pas dans '
                '`PV` de final128.py — elle ne représente plus aucun bâtiment')
        nom = 'bat_j_' + cle
        source = os.path.join(SRC, nom + '.png')
        if not os.path.exists(source):
            raise AssertionError(f'{nom}.png : source absente de art/sources/')
        out.append((nom, source, EMPRISE_QUATRE_VINGT_DIX, False))
    for cle in BATIMENTS:
        # ⚠⚠ CETTE GARDE RESTE, ET SA RAISON A CHANGÉ AU LOT ART-90. Elle
        # gardait une emprise CALCULABLE ; l'emprise ne se calcule plus. Ce
        # qu'elle garde désormais, c'est que `BATIMENTS` et `PV` parlent du même
        # roster — ce que `test/donnees.test.js` confronte ensuite à
        # `src/data/base.js`. La supprimer parce que son motif apparent est parti
        # retirerait le garde-fou à l'instant précis où il devient invisible.
        if cle not in PV:
            raise AssertionError(
                f'{cle} : aucune entrée dans `PV` de final128.py — '
                '`BATIMENTS` et `PV` ne décrivent plus le même roster')
        ouv = cle in OUV
        prefixe = 'bat_o_' if ouv else 'bat_j_'
        for etat in ETATS:
            nom = f'{prefixe}{cle}{etat}'
            source = os.path.join(SRC, nom + '.png')
            if not os.path.exists(source):
                raise AssertionError(f'{nom}.png : source absente de art/sources/')
            out.append((nom, source, EMPRISE_QUATRE_VINGT_DIX, ouv))
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
