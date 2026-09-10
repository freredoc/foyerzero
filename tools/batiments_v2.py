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

⚠⚠ L'EMPRISE NE VIENT PLUS DES PV, ET ELLE A TROIS PALIERS DEPUIS LE LOT
EMPRISES-ET-DÉLAI, 10/09/2026 au soir. Le lot ART-90, le matin même, avait mis
les vingt à la même valeur — « ils doivent tous prendre 90% d'emprise » ; Ethan
est revenu dessus : « Passer tous les bâtiments collecteur et central etc à 85.
Les autres 92 %. Chantier et souche 98 % », puis, la classification lui ayant été
soumise ligne par ligne, « Emprise 3 palier ok ».

⚠⚠ ET LE PALIER MÉDIAN NE DÉPLACE PAS UN PIXEL : 92 % de 32 font 29,44, donc 29,
qui est exactement ce qu'ART-90 avait posé partout. Neuf bâtiments DESCENDENT à
27 et deux MONTENT à 31 ; les neuf autres ne bougent pas. C'est ce qui rend ce
lot-ci beaucoup moins cher en octets que celui du matin.

⚠⚠ LES TROIS PALIERS SONT ÉCRITS ICI ET NON LUS DANS `tools/joueur_v2.py`, ALORS
QUE DEUX DE LEURS VALEURS Y EXISTENT DÉJÀ. `EMPRISE_QUATRE_VINGT_DIX` (29) et
`EMPRISE_QUATRE_VINGT_CINQ` (27) y servent les murs, les barrières et les socles
d'artillerie — c'est-à-dire des UNITÉS et des DÉFENSES, qu'Ethan a nommément
exclues du périmètre : « seulement bâtiment, pas unités ». Les partager ferait
bouger quatorze unités le jour où il règle le palier des collecteurs, et **aucun
test ne le dirait** puisque les nombres sont égaux. Ce sont deux grandeurs qui
coïncident, pas une seule — la règle §4 de `CLAUDE.md`, prise à l'endroit.

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


# ---------------------------------------------------------------------------
# Les trois paliers d'emprise, en gros pixels sur une grille de 32
# ---------------------------------------------------------------------------
#
# ⚠ LES POURCENTAGES D'ETHAN DEVIENNENT DES ENTIERS, ET L'ÉCART SE DÉCLARE.
# 98 % de 32 font 31,36 → 31 (96,9 %) ; 92 % font 29,44 → 29 (90,6 %) ; 85 %
# font 27,2 → 27 (84,4 %). Les trois écarts à la consigne sont sous le demi-gros
# pixel. Un outil qui découperait au dixième rendrait des boîtes non entières,
# donc un recadrage qui ne tombe pas sur la grille.
EMPRISE_QUATRE_VINGT_DIX_HUIT = 31
EMPRISE_QUATRE_VINGT_DOUZE = 29
EMPRISE_QUATRE_VINGT_CINQ_BATIMENT = 27

# ⚠⚠ LE DÉFAUT EST LE PALIER MÉDIAN, ET IL EST ÉCRIT COMME UN DÉFAUT. Les deux
# autres sont des EXCEPTIONS NOMMÉES : un vingt-et-unième bâtiment ajouté demain
# prend 92 % sans que personne n'ait à l'inscrire, ce qui est le bon
# comportement — c'est le palier qu'Ethan désigne par « les autres ».
EMPRISE_DEFAUT = EMPRISE_QUATRE_VINGT_DOUZE

# ⚠⚠ LES DEUX EXCEPTIONS, ET RIEN D'AUTRE. Y inscrire un bâtiment au défaut
# ferait une ligne qui ne dit rien et qui survivrait à un changement de défaut.
#
# ⚠ LE CHANTIER ET LA SOUCHE SONT LE MÊME OBJET DES DEUX CÔTÉS, et c'est pour ça
# qu'ils partagent le palier haut : ce sont les deux bâtiments dont la perte RASE
# la base — `raseLeSite` de `src/data/sites.js` et de `src/data/base.js` le dit
# de tous les deux. Le plus gros bâtiment du camp tient donc la plus grande place.
#
# ⚠⚠ CASERNE, DÉPÔT ET AÉRODROME SONT AU PALIER DES « AUTRES », PAS À CELUI DE
# L'ÉCONOMIE, et c'est un choix soumis à Ethan puis validé — « Emprise 3 palier
# ok ». Ils PRODUISENT des unités ; ils ne produisent pas de ressource. La
# formule d'Ethan nomme « collecteur et central etc », c'est-à-dire la chaîne
# quartz/scorie/électricité et ses deux entrepôts, plus leurs quatre pendants de
# l'Ouvrage — Nœud, Gangue, Terril — qui sont littéralement les mêmes bâtiments
# sous l'autre jeu de noms.
EMPRISE_PAR_BATIMENT = {
    'chantier_de_construction': EMPRISE_QUATRE_VINGT_DIX_HUIT,
    'souche': EMPRISE_QUATRE_VINGT_DIX_HUIT,

    'centrale': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
    'collecteur_quartz': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
    'collecteur_scorie': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
    'raffinerie': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
    'accumulateur': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
    'noeud': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
    'gangue': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
    'terril': EMPRISE_QUATRE_VINGT_CINQ_BATIMENT,
}


def emprise_du_batiment(cle):
    """L'emprise d'un bâtiment, en gros pixels sur une grille de 32.

    ⚠⚠ UNE FAUTE DE FRAPPE DANS `EMPRISE_PAR_BATIMENT` ENVERRAIT UN BÂTIMENT AU
    DÉFAUT EN SILENCE — `collecteur_scorries` ne serait jamais lu, le collecteur
    resterait à 92 %, et rien ne lèverait. La garde est ICI parce que le défaut
    est ce qui rend la faute muette : elle exige que toute clé de la table soit
    un bâtiment du roster.
    """
    inconnues = [c for c in EMPRISE_PAR_BATIMENT if c not in BATIMENTS]
    if inconnues:
        raise AssertionError(
            f'EMPRISE_PAR_BATIMENT : {", ".join(sorted(inconnues))} — '
            'aucun bâtiment de ce nom dans `BATIMENTS` ; une clé mal '
            'orthographiée enverrait son bâtiment au palier par défaut en silence')
    return EMPRISE_PAR_BATIMENT.get(cle, EMPRISE_DEFAUT)


# ⚠⚠ LA VIGNETTE MIXTE N'A QU'UN ÉTAT, ET CE N'EST PAS UN BÂTIMENT. C'est
# l'icône que la palette montre — « une icône collecteur mixte », Ethan, 08/09 —
# et le joueur ne la pose jamais : ce qui atterrit sur un champ est l'un des deux
# collecteurs, qui ont leurs quatre états. Lui en fabriquer quatre paierait trois
# sprites que rien ne peut afficher.
#
# ⚠⚠ SON SECOND MEMBRE REDEVIENT UN CALCUL, ET C'EST LE POINT ÉLÉGANT DU LOT
# EMPRISES-ET-DÉLAI. Il a été un emprunt d'emprise jusqu'au lot ART-90, qui l'a
# laissé en place en écrivant qu'il « ne sert plus à CALCULER l'emprise ; il dit
# QUEL bâtiment la vignette représente » — vrai tant que les vingt partageaient
# une seule valeur. Les paliers reviennent, donc l'emprunt aussi : l'emprise de
# `collecteur_mixte` est CELLE DE `collecteur_quartz`, lue dans la table.
#
# ⚠⚠ ÉCRIRE 27 EN DUR PASSERAIT AUJOURD'HUI ET MENTIRAIT DEMAIN. Ce serait deux
# vérités sur la même vignette, et la seconde se tairait au premier réglage
# d'Ethan sur le palier de l'économie — la palette montrerait une icône à une
# échelle que plus aucun collecteur ne pose. Le test compare les DEUX SORTIES,
# jamais l'une à un nombre.
#
# ⚠ LA GARDE `emprunte not in PV` RESTE, ET SA RAISON REDEVIENT DOUBLE : elle
# gardait que la vignette renvoie encore à un bâtiment ; elle garde de nouveau la
# LISIBILITÉ du palier, puisqu'un renvoi cassé rendrait une emprise inventée.
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
        out.append((nom, source, emprise_du_batiment(emprunte), False))
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
            out.append((nom, source, emprise_du_batiment(cle), ouv))
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
