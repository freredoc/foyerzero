#!/usr/bin/env python3
"""Les quarante-deux sprites de l'Ouvrage, v2 — une planche pour un sprite.

Le jumeau de `tools/joueur_v2.py`, et il n'en recopie rien : la table des
quarante-deux, les emprises et les deux modes de conditionnement sont IMPORTÉS.

    python3 tools/ouvrage_v2.py

⚠⚠ IL N'A PAS DE TABLE À LUI, ET C'EST UN ÉCART AU BRIEF, DÉCLARÉ. Celui-ci
demandait « la table des tâches couvre 42 entrées » dans ce fichier-ci. Mesuré
avant d'écrire : les huit listes d'identifiants de `joueur_v2.py` décrivent
EXACTEMENT le camp de l'Ouvrage aussi — neuf poses d'infanterie, quatre
aéronefs, neuf coques dont l'Obusier sans pose de défense, cinq tourelles de
blindé, trois pièces monolithiques, six tourelles de défense, six socles. Ethan
a livré la même découpe des deux côtés sans qu'aucune consigne ne le lui
demande. Écrire ici une seconde table de quarante-deux lignes identiques au
changement d'une lettre près aurait été la seconde vérité que `CLAUDE.md` §4
interdit, et la première à mentir le jour où une pièce entre. `taches` prend
donc une lettre de camp, de défaut `'j'`.

⚠⚠ TROIS CHOSES SEULEMENT DIFFÈRENT DU JOUEUR, ET LES TROIS SONT NÉCESSAIRES.

  1. `pal(True)`, PAS `pal(False)`. Le joueur n'emploie pas la rampe ardoise et
     sa palette l'exclut ; l'Ouvrage EST ardoise. Passer `False` ici rabattrait
     ses violets sur le kaki à l'appariement, c'est-à-dire redonnerait au camp
     adverse les couleurs du joueur.

  2. LE FOND EST VERT. Les quarante-deux sources sont sur `#00FF00` quand
     celles du joueur sont sur magenta. Rien n'est à passer en paramètre :
     `cond.cle_de_fond` LIT la clé sur les quatre coins de la planche, et
     `est_fond_sujet` la borne à la composante qui touche le bord. Mais un
     masque écrit en dur quelque part serait faux — c'est exactement le piège
     que `tools/ancres-ouvrage.py` documente en tête, où les `masque()` des deux
     outils du joueur ne connaissaient que le magenta et rendaient une image
     entièrement « sujet » sur les sources de l'Ouvrage.

  3. LA LETTRE DE CAMP, `'o'`, seul argument de `taches`.

⚠ LE FRAPPEUR À ×0,90 ET LES TROIS ARTILLERIES À ×1,10 NE SONT PAS ICI, ET C'EST
VOULU. Ils ne vivent que dans `tools/planche-echelles-ouvrage.py` et attendent
qu'Ethan reprenne les emprises à zéro — le brief du lot le dit en toutes lettres.
Les faire entrer ici les figerait sous l'apparence d'une donnée arbitrée.

⚠⚠ ET LES ONZE TOURELLES PASSENT EN MODE `carre`, COMME CELLES DU JOUEUR. Aucun
recadrage : la planche EST le sprite, à l'échelle près. Leur pixel de pivot doit
rester au centre exact du fichier, sinon un canon se fait rogner à 45° quand le
rendu le tourne. `recadrer` recentrerait sur la boîte englobante, qui n'est PAS
centrée sur le pivot. Les onze planches d'Ethan sont déjà carrées et déjà
centrées — `tools/recentrer-tourelles-ouvrage.py` l'a fait à la source, et un
test du dépôt le remesure sur les vingt-deux tourelles des deux camps.
"""
import argparse
import os
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites                                  # noqa: E402

from PIL import Image                                                # noqa: E402
from final128 import pal, recadrer, conditionner, ecrire             # noqa: E402
from cond import boite                                               # noqa: E402
from joueur_v2 import GRILLES, SRC, taches, unites_du_depot          # noqa: E402


def main():
    argparse.ArgumentParser(description=__doc__).parse_args()
    unites = unites_du_depot()
    P = pal(True)                        # l'Ouvrage EST ardoise — voir l'en-tête
    n = 0
    print(f"{'famille':<15}{'sprite':<30}{'mode':<9}{'empr.':>6}   boîte en 32")
    for famille, nom, source, mode, emprise in taches(unites, 'o'):
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
