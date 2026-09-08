#!/usr/bin/env python3
"""Ancres de l'Ouvrage — MÊME CALCUL que le joueur, sur les sources de l'Ouvrage.

Il ne réinvente rien : `ancre`, `pivot`, `cote_du_carre`, `boite_dans_la_case` et
`ancre_de_case` sont IMPORTÉS de `tools/chassis.py`, `tools/ancres-blindes.py` et
`tools/ancres-defense.py`. Réécrire ces cinq fonctions ici aurait produit une
seconde vérité, et c'est exactement la faute que `CLAUDE.md` §4 interdit.

⚠⚠ UN SEUL POINT DIFFÈRE, ET IL EST OBLIGATOIRE : LE MASQUE. Les deux outils du
joueur portent chacun un `masque()` qui ne connaît QUE le magenta. Les sources de
l'Ouvrage sont sur fond vert `#00FF00` — le violet de l'ardoise passe à 140,0 du
magenta, pile sur le seuil de `cond.est_fond`. Appelées telles quelles, leurs
fonctions rendraient une image entièrement « sujet » et l'ancre tomberait au
milieu du fond. On passe donc par `cond.est_fond_sujet`, qui LIT la clé sur les
quatre coins et marche sur les deux camps.

⚠⚠ ET UN SECOND POINT, TROUVÉ À L'EXÉCUTION : LE GARDE-FOU DE DÉCALAGE.
`chassis.py:ancre` écarte un candidat dont le centre est à plus de 22 % du
centre de la pièce — le garde-fou qui rejette les chenilles. Les six socles de
défense de l'Ouvrage portent leur logement à **25 à 35 %** au-dessus du centre :
le socle carré a une haute face avant sous son plateau, le marcheur a ses
pattes. Les six étaient donc rejetés, alors que leur rondeur vaut 0,65 à 0,83
quand une chenille est à 0,1.

Le seuil est devenu le paramètre `decal_max`, **défaut 0,22 inchangé**. Contrôle :
`ancres-defense.py` et `ancres-blindes.py` rejoués après le changement rendent
des JSON et des sorties texte IDENTIQUES au bit près. Les neuf coques de
l'Ouvrage passent au défaut ; seules les défenses demandent 0,40.

⚠⚠ UNE ÉCHELLE PAR PIÈCE, ET ELLE NE SE CHOISIT PAS À L'ŒIL. Décision d'Ethan du
07/09. Chaque échelle est calculée pour que le carré de la tourelle de l'Ouvrage
occupe **la même fraction de case que celui de son homologue du joueur** :

    echelle_ouvrage = 2,2 × cote_case_pct(joueur) / cote_case_pct(ouvrage à 2,2)

Les deux camps se lisent alors à la même taille, et la valeur se recalcule si un
dessin change au lieu d'être une constante à re-arbitrer. Les nombres du joueur
sont LUS dans `art/sprites/ancres-blindes.json` et `ancres-defense.json`, jamais
recopiés.

⚠ ET LE CARRÉ QUI DÉPASSE LA CASE N'EST PAS UN DÉFAUT. Il porte la marge de
rotation : `socle_def_j_faucheuse` est à 111,95 % chez le joueur, `mortier` à
104,96, et le rendu du joueur est juste. J'avais annoncé l'inverse au rapport
précédent — les deux camps tiennent en fait la même fourchette, 28 à 112 % chez
le joueur, 29 à 117 % à l'Ouvrage.

    python3 tools/ancres-ouvrage.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))

import importlib.util as _u                                          # noqa: E402
from chassis import ancre                                            # noqa: E402
from cond import est_fond_sujet                                      # noqa: E402
from joueur_v2 import (EMPRISE_QUATRE_VINGT_CINQ, EMPRISE_QUATRE_VINGT_DIX,
                       emprise_de, unites_du_depot)                  # noqa: E402


def _module(nom):
    """`ancres-blindes` et `ancres-defense` portent un tiret : pas importables."""
    chemin = os.path.join(RACINE, 'tools', nom + '.py')
    spec = _u.spec_from_file_location(nom.replace('-', '_'), chemin)
    mod = _u.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


BL = _module('ancres-blindes')
DEF = _module('ancres-defense')

SRC = os.path.join(RACINE, 'art', 'sources')
BLINDES = ['ratisseur', 'fendeur', 'broyeur', 'belier', 'pilon']
CONTACT = ['casemate', 'creneau', 'batterie']
ARTILLERIES = ['faucheuse', 'mortier', 'harpon']
DECAL_DEFENSES = 0.40      # voir l'en-tête : 0,22 rejette les six socles
JOUEUR = os.path.join(RACINE, 'art', 'sprites')


def echelle_calee(cle, famille, cote_pct_embase, lc, diam_pct, echelle_ref):
    """L'échelle qui aligne le carré de l'Ouvrage sur celui du joueur."""
    fichier = 'ancres-blindes.json' if famille == 'blinde' else 'ancres-defense.json'
    d = json.load(open(os.path.join(JOUEUR, fichier), encoding='utf-8'))
    bloc = d.get('coques') or d.get('socles')
    nom = f'off_j_{cle}_chassis' if famille == 'blinde' else f'socle_def_j_{cle}'
    cible = bloc[nom]['cote_case_pct']
    brut = lc * diam_pct / 100 * cote_pct_embase / 100        # carré à échelle 1
    return round(cible / brut, 3)


def charger(nom):
    a = np.array(Image.open(os.path.join(SRC, nom + '.png')).convert('RGB')).astype(int)
    return a, ~est_fond_sujet(a.astype(np.uint8))


def coques_et_tourelles():
    unites = unites_du_depot()
    coques, tourelles, lignes = {}, {}, []
    for cle in BLINDES:
        poses = ['_chassis', '_chassis_def'] if unites[cle][2] else ['_chassis']
        nomt = f'off_o_{cle}_tourelle'
        _, mt = charger(nomt)
        px, py, D = BL.pivot(mt)
        cote = BL.cote_du_carre(mt, px, py)
        cpe = round(100 * cote / D, 1)
        a0, m0 = charger(f'off_o_{cle}_chassis')
        anc0 = ancre(a0, m0)
        lc0, _ = BL.boite_dans_la_case(m0, emprise_de(cle, unites))
        tourelles[nomt] = {'cote_pct_embase': cpe,
                           'echelle': echelle_calee(cle, 'blinde', cpe, lc0,
                                                    anc0['diametre_pct'], BL.ECHELLE)}
        for pose in poses:
            nom = f'off_o_{cle}{pose}'
            a, m = charger(nom)
            trouve = ancre(a, m)
            if trouve is None:
                raise AssertionError(f'{nom} : aucun logement détecté')
            trouve.update(BL.ancre_de_case(trouve, m, emprise_de(cle, unites),
                                           tourelles[nomt]))
            coques[nom] = trouve
            ys, xs = np.where(m)
            lignes.append((nom, trouve, round(trouve['diametre_pct'] / 100
                                              * (xs.max() - xs.min() + 1))))
        lignes.append((nomt, {'embase': D, 'carre': cote}, None))
    return coques, tourelles, lignes


def socles_et_tourelles():
    socles, tourelles, rapport = {}, {}, []
    for cle in CONTACT + ARTILLERIES:
        socle, tourelle = f'socle_def_o_{cle}', f'def_o_{cle}'
        a, m = charger(socle)
        trouve = ancre(a, m, decal_max=DECAL_DEFENSES)
        if trouve is None:
            raise AssertionError(f'{socle} : aucun logement détecté')
        _, mt = charger(tourelle)
        px, py, D = DEF.pivot(mt)
        cote = DEF.cote_du_carre(mt, px, py)
        famille = 'artillerie' if cle in ARTILLERIES else 'contact'
        cpe = round(100 * cote / D, 1)
        emprise = (EMPRISE_QUATRE_VINGT_CINQ if cle in ARTILLERIES
                   else EMPRISE_QUATRE_VINGT_DIX)
        lc0, _ = DEF.boite_dans_la_case(m, emprise)
        tourelles[tourelle] = {'cote_pct_embase': cpe,
                               'echelle': echelle_calee(cle, 'defense', cpe, lc0,
                                                        trouve['diametre_pct'],
                                                        DEF.ECHELLE[famille])}
        trouve.update(DEF.ancre_de_case(trouve, m, emprise, tourelles[tourelle]))
        socles[socle] = trouve
        ys, xs = np.where(m)
        rapport.append((tourelle, D, cote, round(cote / D, 3), trouve,
                        round(trouve['diametre_pct'] / 100 * (xs.max() - xs.min() + 1))))
    return socles, tourelles, rapport


def main():
    coques, tour_bl, lignes = coques_et_tourelles()
    socles, tour_def, rapport = socles_et_tourelles()

    for nom, contenu in [('ancres-blindes-ouvrage.json',
                          {'coques': coques, 'tourelles': tour_bl}),
                         ('ancres-defense-ouvrage.json',
                          {'socles': socles, 'tourelles': tour_def})]:
        with open(os.path.join(RACINE, 'art', 'sprites', nom), 'w', encoding='utf-8') as f:
            json.dump(contenu, f, ensure_ascii=False, indent=2, sort_keys=True)
            f.write('\n')

    for nom, val, px in lignes:
        if 'embase' in val:
            print(f"{nom:<32} embase {val['embase']:>4}  carré {val['carre']:>4}"
                  f"  marge ×{val['carre'] / val['embase']:.3f}")
        else:
            print(f"{nom:<32} logement {val['diametre_pct']:>5}% = {px} px,"
                  f" x {val['x_pct']:+.1f}%, y {val['y_pct']:+.1f}%,"
                  f" carré {val['cote_case_pct']:.2f}% de case")
    print()
    print(f'{"tourelle":<18}{"embase":>8}{"carré":>8}{"ratio":>8}   logement du socle')
    for nom, D, cote, ratio, anc, d_px in rapport:
        print(f'{nom:<18}{D:>8}{cote:>8}{ratio:>8}   '
              f"{anc['diametre_pct']}% = {d_px} px, carré {anc['cote_case_pct']:.2f}% de case")
    return 0


if __name__ == '__main__':
    sys.exit(main())
