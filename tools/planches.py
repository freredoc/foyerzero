#!/usr/bin/env python3
"""Conditionne les planches sources en sprites, sur les trois grilles 128/64/32.

Rejoue exactement la chaîne de `final128.py`, mais depuis la racine du dépôt et
sans chemin absolu. Les fichiers déjà commités doivent ressortir identiques à
l'octet près : c'est le contrôle du mode --verifier, et c'est ce qui autorise à
faire confiance aux grilles produites pour la première fois.

    python3 tools/planches.py --verifier   # ne rien écrire, comparer l'existant
    python3 tools/planches.py --ecrire     # produire les trois grilles
"""
import sys, os, math, hashlib, argparse, shutil
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites

from PIL import ImageFile as _IF; _IF.LOAD_TRUNCATED_IMAGES = True
from PIL import Image
import numpy as np
from cond import est_fond, eroder, reduire, boite
from final128 import pal, quant, recadrer, conditionner, ecrire, U, B, PV, OUV, cible
from retirer_appendice import corriger as retirer_appendice

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites()
GRILLES = (128, 64)   # la 32 est sortie au lot PIXELS : ni le jeu ni les tests ne la lisaient

# --- les deux passes de retouche que final128.py ne fait pas -----------------
# Elles ne sont pas décoratives : sans elles, sept sprites sur cinquante-huit
# ne se reproduisent pas, et ce sont les commités qui ont raison.
#
# APPENDICE — VIDE DEPUIS LA BASCULE SUR LES PLANCHES « 1024 » (30/08/2026), et
# ce n'est pas un nettoyage cosmétique : la passe FAIT LEVER sur la V2.
#
# Elle existait pour la V1 seule. L'Accumulateur et la Raffinerie occupaient la
# moitié droite de `P6_4_flux_joueur.png`, dont la coupe en quarts tombait dans
# la matière de la colonne de gauche — occupée jusqu'à x=707 alors que la coupe
# était à x=615 : un bloc parasite arrivait dans la cellule sous forme de
# composante détachée, qu'on effaçait avant de recentrer.
#
# ⚠ SUR LA V2 LES DEUX SUJETS SORTENT D'UN SEUL TENANT, et
# `retirer_appendice.corriger` porte un `assert n == 2` qui LÈVE sur une
# composante unique. Y laisser les deux noms ne ferait donc pas une passe
# inutile, ça ferait planter le script.
#
# ⚠ ET LE COMMENTAIRE EST RÉÉCRIT PLUTÔT QUE LAISSÉ EN PLACE : un commentaire
# qui décrit un mécanisme retiré est pire que pas de commentaire — il envoie
# chercher un traitement qui n'a plus lieu.
APPENDICE = set()
#
# CHENILLES — LA PASSE EST MORTE AU LOT PIXELS, ET DEUX FOIS PLUTÔT QU'UNE.
# Elle dessinait deux bandes de chenille sur les trois blindés à 10 points, en
# coordonnées de grille 32 écrites en dur (CX0=9, CX1=22, CY0=7, CY1=23) : elle
# n'avait de sens qu'à cette grille-là, et la grille 32 est sortie de `GRILLES`.
#
# ⚠⚠ ET ELLE SERAIT RESTÉE SANS EFFET MÊME EN 32. Elle peignait dans `g`, la
# grille d'INDICES de palette ; depuis ce lot `ecrire` ne peint plus `g`, il
# réduit la matière par filtre. Une passe qui retouche une grille que personne
# ne dessine plus est un garde-fou qui ment : c'est la faute que ce dépôt nomme
# ailleurs, « un commentaire qui annonce un futur devenu présent ».
#
# ⚠ `tools/align_chenilles.py` RESTE AU DÉPÔT et n'est plus appelé par personne.
# Le retirer serait une décision d'art — les bandes qu'il dessinait pourraient
# revenir dans la source plutôt que dans l'outil —, et ce lot n'en prend aucune.
#
# ⚠ LES DEUX `ÉCART` PERMANENTS DU VÉRIFICATEUR PARTENT AVEC ELLE :
# `unite/32/off_j_ratisseur.png` et `unite/32/off_j_belier.png` étaient les deux
# seuls fichiers du dépôt que cette chaîne ne reproduisait pas, et ils étaient
# tous les deux en grille 32.
#
# CE QUI SUIT SE LIT AU PASSÉ — l'enquête du 30/08 sur ces deux fichiers, gardée
# parce qu'elle a coûté une matinée et qu'on ne la refera pas. Ils étaient les
# deux seuls que la chaîne ne reproduisait pas ; ils sont sortis du dépôt avec
# la grille 32, et leurs deux lignes d'`ECARTS_PERMANENTS` avec eux.
#
# Mesuré à l'époque, en grille 32 :
#
#   sprite            écarts DANS la caisse (col 9–22)   HORS caisse
#   off_j_ratisseur                                 93             0
#   off_j_belier                                    96             0
#
# LES CHENILLES SE REPRODUISAIENT À L'OCTET. Le zéro de la colonne de droite
# était le fait qui comptait : les bandes que `aligner` dessinait, aux colonnes
# 7-8 et 23-24, étaient identiques dans les deux versions. `CX0..CX1` est le
# cadre de la CAISSE, pas celui des chenilles — s'y tromper faisait accuser
# cette passe d'une faute qu'elle ne commettait pas.
#
# TROIS HYPOTHÈSES ONT ÉTÉ POSÉES ET RÉFUTÉES, chiffres à l'appui :
#   1. une autre planche source — `art/sources/` porte DEUX copies des blindés,
#      `P2_3_…` (citée par final128) et `P2.3_…`, réellement différentes. La
#      seconde donnait 225 à 238 px d'écart, bien PIRE que les 93/96.
#   2. des fichiers antérieurs à la passe — sans `aligner` l'écart montait à
#      149 et 150, et le fendeur passait de 0 à 65.
#   3. une autre érosion — balayée de 0 à 6. Le fendeur touchait 0 exactement à
#      3, la valeur du code ; les deux autres plafonnaient à 88–93, jamais 0.
#
# CONCLUSION D'ALORS : ces deux fichiers avaient été RETOUCHÉS À LA MAIN, ou
# produits par une étape qui n'existait plus, et l'invariant « on n'écrase
# JAMAIS un fichier existant qui ne se reproduit pas » les protégeait. La
# question est close autrement : la grille où ils vivaient n'est plus produite.


# `usine` est le nom mort du bâtiment : src/data/base.js dit `depotDeVehicules`
# depuis l'arbitrage du 26/08. La table de final128.py garde l'ancienne clé
# parce qu'elle sert aussi d'index dans PV ; la traduction se fait ici, au seul
# moment où un nom de fichier est écrit.
RENOMMAGE = {'usine': 'depot_de_vehicules'}


# ---------------- interface : les pictogrammes du lot S11 --------------------
#
# ⚠⚠ QUATORZIÈME FAMILLE, ET LA PREMIÈRE QUI NE SOIT PAS DU JEU MAIS DE
# L'INTERFACE. Les treize autres dessinent ce que le joueur regarde sur un
# terrain — bâtiments, unités, défenses, sol, emblèmes ; celle-ci dessine ce que
# l'écran DIT. Elle sort donc de la logique d'échelle des autres : voir
# `EMPRISE_INTERFACE` juste dessous.
#
# ⚠⚠ LES GRILLES SONT MESURÉES, PAS RECOPIÉES DU MANIFESTE. `S11_UI_CONTENU.txt`
# annonce des tailles ; les gouttières de fond magenta ont été comptées sur les
# neuf images avant d'écrire une seule ligne. Sept planches confirment le
# manifeste. Les deux autres demandaient de regarder :
#   — P11.8 montre QUATRE bandes verticales sans encre, mais deux ne font que 11
#     et 6 px quand une vraie gouttière en fait 27 à 147 : ce sont des trous
#     INTERNES au cadenas et à la jauge, pas des séparations. La grille est bien
#     2 × 2.
#   — P11.9 est une grille 3 × 2 pour CINQ contenus : la sixième case est VIDE,
#     mesuré à zéro pixel d'encre. C'est le `None` de la table.
#
# ⚠ LES QUATORZE MODULES SONT NOMMÉS PAR LEUR CLÉ DE `src/data/modules.js`, ET
# CE N'EST PAS UNE DEVINETTE. Les deux planches s'annoncent « modules 1-8 » et
# « 9-14 », mais cette numérotation n'est PAS celle de la table — le cœur
# « PV +20 % » est le huitième de la première planche quand `pvPlusVingt` est le
# treizième de `MODULES`. Les quatorze ont donc été identifiés au dessin, et la
# preuve est dans l'UNION : les huit de P11.5 et les six de P11.6 rendent
# exactement les quatorze clés de la table, sans doublon ni manque. Un test le
# confronte.
INTERFACE = [
    ('P11.1_ressources_3x1_1024.png', 3, 1, [
        ['quartz', 'scorie', 'electricite'],
    ]),
    ('P11.2_points_strategiques_2x2_1024.png', 2, 2, [
        ['points_attaque', 'armee_offensive'],
        ['armee_defensive', 'recherche'],
    ]),
    # ⚠ LA TROISIÈME CIBLE S'APPELLE `aviation` ET LA COLONNE DE DÉGÂTS
    # `structureOuAviation` : le pictogramme dessine un avion dans un réticule,
    # donc la moitié qu'il montre. Nommer le sprite d'après la colonne ferait
    # promettre une structure que personne n'a dessinée.
    ('P11.3_cibles_chassis_3x2_1024.png', 3, 2, [
        ['cible_infanterie', 'cible_vehicule', 'cible_aviation'],
        ['chassis_escouade', 'chassis_blinde', 'chassis_aeronef'],
    ]),
    ('P11.4_categories_defense_2x2_1024.png', 2, 2, [
        ['categorie_mur', 'categorie_barriere'],
        ['categorie_tourelle', 'categorie_artillerie'],
    ]),
    ('P11.5_modules_1-8_4x2_1024.png', 4, 2, [
        ['module_flashbang', 'module_camouflage', 'module_emp', 'module_munition_speciale'],
        ['module_tir_de_barrage', 'module_vol_de_vie', 'module_booster', 'module_pv_plus_vingt'],
    ]),
    ('P11.6_modules_9-14_3x2_1024.png', 3, 2, [
        ['module_garnison', 'module_rayon_mini_moins_un', 'module_ecraseur'],
        ['module_rayon_plus_un', 'module_auto_reparation', 'module_bouclier'],
    ]),
    ('P11.7_stats_actions_3x2_1024.png', 3, 2, [
        ['pv', 'degats', 'butin'],
        ['reparation', 'temps', 'niveau'],
    ]),
    ('P11.8_etats_interface_2x2_1024.png', 2, 2, [
        ['verrou', 'emplacement'],
        ['vague', 'budget'],
    ]),
    # ⚠ LA SIXIÈME CASE EST VIDE, MESURÉE À ZÉRO PIXEL D'ENCRE. `None` la saute ;
    # inventer un nom pour du vide ferait un sprite transparent que
    # `recadrer` refuserait — il cherche la boîte de l'encre et `xs.max()`
    # lèverait sur un tableau vide.
    ('P11.9_fleches_plus_moins_3x2_1024.png', 3, 2, [
        ['fleche_gauche', 'fleche_droite', 'fleche_verte'],
        ['plus', 'moins', None],
    ]),
]

# L'emprise d'un pictogramme, en gros pixels d'une grille de 32.
#
# ⚠⚠ 28, ET C'EST LE PLAFOND DES BÂTIMENTS, PAS UNE VALEUR NEUVE. `cible(pv)` de
# `final128.py` rend 16 pour le plus petit bâtiment et 28 pour le plus grand :
# 28 est donc la plus grande emprise que cette chaîne ait jamais produite, soit
# 87,5 % de la case. Un pictogramme se lit petit et n'a rien à côté de lui : il
# prend tout ce que la chaîne sait donner, et les 12,5 % restants sont la marge
# qui l'empêche de toucher le bord — sans elle, l'érosion de `conditionner`
# mordrait dans le dessin.
#
# ⚠ ET IL N'Y A PAS DE `cote_ref` : `produire` passe le défaut `None`, donc
# CHAQUE cellule est normalisée séparément. C'est juste ici et faux ailleurs —
# la référence commune sert à garder le rapport de taille entre les paliers d'un
# MÊME sujet, et deux pictogrammes n'ont aucune échelle commune : un cadenas
# n'est pas plus petit qu'un coffre. Le lot EMBLÈMES-ABÎMÉS l'a mesuré dans
# l'autre sens, sur des bases de niveaux différents.
#
# ⚠⚠ L'ANCRAGE EST `centre`, ET C'EST LE DÉFAUT DE `recadrer` — donc rien à
# passer. C'est la leçon du 06/09 : `ancrage='bas'` pose sur une ligne de sol
# commune, juste pour un bâtiment vu de CÔTÉ, et il a coûté aux emblèmes de
# carte 5 px de marge basse à tous les paliers et jusqu'à 35 px de vide en haut.
# Un pictogramme n'a pas de sol.
EMPRISE_INTERFACE = 28


# ⚠⚠ UNE PLANCHE SUR NEUF NE SE COUPE PAS EN PARTS ÉGALES, ET ÇA S'EST VU AU
# PIXEL. `1024 / 3` ne tombe pas juste : la coupe arithmétique de P11.1 tombe à
# 682, alors que sa seconde gouttière finit à 679 et que l'éclair d'électricité
# commence à 680. Résultat mesuré : trois colonnes de l'éclair entraient dans la
# cellule de la scorie — assez pour gonfler la boîte que `recadrer` centre, donc
# pour décaler `ui_scorie` de 11 px vers la gauche sur la grille 128, soit 8,6 %
# d'une case — et l'éclair perdait ces trois colonnes-là.
#
# ⚠ LES HUIT AUTRES PLANCHES TOMBENT JUSTE, mesuré aussi : leurs coupes sont
# toutes DANS une gouttière. Une seule fait exception, elle seule a une ligne.
#
# ⚠⚠ ET C'EST LA GARDE `verifier_les_coupes` QUI L'A TROUVÉE, PAS UNE RELECTURE.
# Sans elle une coupe qui traverse un dessin ne casse rien : elle rend deux
# sprites tronqués, et personne ne le voit avant de regarder les quarante-six.
# C'est mot pour mot ce que `tools/barrieres.py` dit de sa propre coupe en deux.
COUPES_INTERFACE = {
    'P11.1_ressources_3x1_1024.png': ([0, 342, 663, 1024], None),
}


def verifier_les_coupes(encre, fichier, cx, cy):
    """Lève si une coupe INTERNE tombe sur une colonne ou une ligne encrée."""
    for axe, coupes, occupe in (('colonne', cx, encre.any(axis=0)),
                                ('ligne', cy, encre.any(axis=1))):
        for c in coupes[1:-1]:
            if occupe[c]:
                raise ValueError(
                    '%s : la coupe en %s %d tombe dans le dessin — la planche '
                    'ne se coupe pas en parts égales, lui donner ses coupes '
                    'dans COUPES_INTERFACE.' % (fichier, axe, c))


def decouper(im, fichier, nx, ny):
    """Les `nx+1` et `ny+1` bornes de coupe d'une planche d'interface."""
    largeur, hauteur = im.size
    explicites = COUPES_INTERFACE.get(fichier, (None, None))
    cx = explicites[0] or [i * (largeur // nx) for i in range(nx)] + [largeur]
    cy = explicites[1] or [j * (hauteur // ny) for j in range(ny)] + [hauteur]
    a = np.array(im.convert('RGBA'))
    encre = (~est_fond(a[..., :3])) & (a[..., 3] >= 128)
    verifier_les_coupes(encre, fichier, cx, cy)
    return cx, cy


def sha(chemin):
    with open(chemin, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def produire(im, boite_cellule, emprise32, ouvrage, N, sortie, nom=''):
    """emprise32 est l'emprise visée en gros pixels sur une grille de 32."""
    P = pal(ouvrage)
    cellule = im.crop(boite_cellule)
    g, matiere = conditionner(recadrer(cellule, emprise32 * (N // 32), N), P, N)
    ecrire(g, P, sortie, matiere)
    if nom in APPENDICE:
        retirer_appendice(sortie, sortie)
    return boite(g)


def taches():
    """Rend (sous_dossier, nom_fichier, boite, emprise32, ouvrage) par sprite.

    ⚠⚠ LA TABLE `U` N'EST PLUS PARCOURUE — lot SPRITES-V2-JOUEUR, 05/09. Elle
    donnait les treize unités du joueur, découpées à plusieurs par planche ; la
    v2 en dessine une par planche, et `tools/joueur_v2.py` les produit. Elle
    reste importée pour ses EMPRISES : `joueur_v2` relit dedans les 18 et 24 des
    escouades, qui ne changent pas dans ce lot, et un test le confronte. Il ne
    reste donc ici que les trente-quatre bâtiments et les deux ruines.
    """
    out = []
    for fn, nx, ny, gr in B:
        im = Image.open(os.path.join(SRC, fn)); W, H = im.size
        cw, ch = W // nx, H // ny
        for j in range(ny):
            for i in range(nx):
                cle = gr[j][i]
                ouv = cle in OUV
                nom = ('bat_o_' if ouv else 'bat_j_') + RENOMMAGE.get(cle, cle)
                out.append(('bâtiment', nom, os.path.join(SRC, fn),
                            (i * cw, j * ch, (i + 1) * cw, (j + 1) * ch),
                            cible(PV[cle]), ouv))
    # --- les pictogrammes d'interface, lot PICTOGRAMMES du 07/09 -------------
    #
    # ⚠ `ouvrage=False` POUR TOUS, ET CE N'EST PAS UN DÉFAUT PRIS PAR HABITUDE.
    # Le drapeau n'ouvre que les teintes violettes de `pal()`, qui sont celles de
    # l'Ouvrage. Un pictogramme n'appartient à aucun camp : il dit une grandeur.
    # ⚠⚠ ET LA PALETTE NE CONTRAINT PLUS LES COULEURS DEPUIS LE LOT PIXELS :
    # `ecrire` réduit par FILTRE quand la matière lui est passée, et `produire`
    # la lui passe. La flèche VERTE de P11.9 garde donc son vert, qui n'est
    # pourtant dans aucune des quatorze teintes de base — vérifié plutôt que
    # supposé, un test le mesure.
    for fn, nx, ny, gr in INTERFACE:
        im = Image.open(os.path.join(SRC, fn))
        cx, cy = decouper(im, fn, nx, ny)
        for j in range(ny):
            for i in range(nx):
                cle = gr[j][i]
                if cle is None:
                    continue
                out.append(('interface', 'ui_' + cle, os.path.join(SRC, fn),
                            (cx[i], cy[j], cx[i + 1], cy[j + 1]),
                            EMPRISE_INTERFACE, False))
    return out


def reduire_exact(chemin, N):
    """Réduit un PNG de 128 à N par division entière du gros pixel.

    N'est licite que si l'image est faite de blocs uniformes de 128//N pixels ;
    la fonction le vérifie et refuse sinon, parce qu'un rééchantillonnage
    silencieux donnerait des tons hors palette.
    """
    a = np.array(Image.open(chemin).convert('RGBA'))
    k = a.shape[0] // N
    b = a.reshape(N, k, N, k, 4)
    if not (b == b[:, 0:1, :, 0:1, :]).all():
        raise ValueError(f'{chemin} : blocs {k}x{k} non uniformes, réduction exacte impossible')
    return Image.fromarray(b[:, 0, :, 0, :], 'RGBA')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ecrire', action='store_true')
    ap.add_argument('--verifier', action='store_true')
    a = ap.parse_args()
    if not (a.ecrire or a.verifier):
        ap.error('choisir --ecrire ou --verifier')

    tmp = os.path.join(RACINE, '.planches-tmp')
    os.makedirs(tmp, exist_ok=True)
    identiques = differents = neufs = 0
    ecarts = []

    # --- unités et bâtiments : rejeu depuis la source 1024 ---
    # Invariant : on n'écrase JAMAIS un fichier existant qui ne se reproduit
    # pas. S'il diverge, c'est que sa provenance n'est pas entièrement dans
    # cette chaîne, et le fichier commité fait foi jusqu'à preuve du contraire.
    for famille, nom, src, bte, emp, ouv in taches():
        im = Image.open(src)
        for N in GRILLES:
            rel = f'{famille}/{N}/{nom}.png'
            prov = os.path.join(tmp, nom + f'_{N}.png')
            produire(im, bte, emp, ouv, N, prov, nom)
            ref = os.path.join(DST, rel)
            if os.path.exists(ref):
                if sha(prov) == sha(ref):
                    identiques += 1
                else:
                    differents += 1; ecarts.append(rel)
                    os.remove(prov)
                    continue
            else:
                neufs += 1
            if a.ecrire:
                os.makedirs(os.path.dirname(ref), exist_ok=True)
                os.replace(prov, ref)

    # --- terrain : le 128 est déplacé à l'octet, le 64 et le 32 en sont
    #     déduits par division entière du gros pixel (blocs 4x4 uniformes) ---
    plat = os.path.join(DST, 'terrain')
    sources_terrain = sorted(f for f in os.listdir(plat) if f.endswith('.png')) \
        if os.path.isdir(plat) and not os.path.isdir(os.path.join(plat, '128')) else []
    for f in sources_terrain:
        chemin = os.path.join(plat, f)
        for N in GRILLES:
            neufs += 1
            if N != 128:
                img = reduire_exact(chemin, N)   # lève si les blocs ne sont pas uniformes
            if not a.ecrire:
                continue
            d = os.path.join(DST, 'terrain', str(N))
            os.makedirs(d, exist_ok=True)
            if N == 128:
                shutil.copyfile(chemin, os.path.join(d, f))
            else:
                img.save(os.path.join(d, f))
    if a.ecrire and sources_terrain:
        for f in sources_terrain:
            os.remove(os.path.join(plat, f))

    # --- le nom mort : bat_j_usine cède la place à bat_j_depot_de_vehicules ---
    if a.ecrire:
        for N in GRILLES:
            mort = os.path.join(DST, 'bâtiment', str(N), 'bat_j_usine.png')
            if os.path.exists(mort):
                os.remove(mort)

    print(f'identiques à l\'octet : {identiques}')
    print(f'différents           : {differents}')
    print(f'nouveaux             : {neufs}')
    for e in ecarts:
        print('  ÉCART', e)
    return 1 if differents else 0


if __name__ == '__main__':
    sys.exit(main())
