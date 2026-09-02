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
    """Rend (sous_dossier, nom_fichier, boite, emprise32, ouvrage) par sprite."""
    out = []
    for fn, cles, emp in U:
        im = Image.open(os.path.join(SRC, fn)); W, H = im.size
        cw = W // len(cles)
        for i, cle in enumerate(cles):
            out.append(('unite', 'off_j_' + cle, os.path.join(SRC, fn),
                        (i * cw, 0, (i + 1) * cw, H), emp, False))
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
