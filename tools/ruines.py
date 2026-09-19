#!/usr/bin/env python3
"""Les ruines : celle d'une case RASÉE, et celles d'une pièce de défense TOMBÉE.

⚠⚠ DEUX CHOSES DIFFÉRENTES SOUS UN MOT, ET C'EST POUR ÇA QU'ELLES SONT DANS LE
MÊME FICHIER. `ruine_j` / `ruine_o` se posent quand la CASE est rasée — une base
entière disparaît de la carte ; `ruine_def_<c>_<v>` se pose quand UNE pièce de
garnison tombe à l'effondrement. Ethan, 19/09 : « parce que les ruines, il y a
déjà des ruines de bâtiments ». Les séparer en deux outils aurait mis deux
producteurs de « ruine » dans `tools/`, dont le nom court se confond — l'accident
du 27/08 (`CLAUDE.md` §6, homonymes).

⚠⚠ IL A PORTÉ SEIZE BÂTIMENTS DÉTRUITS JUSQU'AU LOT BÂTIMENTS-QUATRE-ÉTATS,
08/09/2026, ET IL N'EN PORTE PLUS AUCUN. Ethan a livré quatre-vingts planches à
un sujet chacune — vingt bâtiments × quatre états —, et `tools/batiments_v2.py`
les produit sans découpe. Les seize d'ici étaient les mêmes objets, tirés de
planches à quatre sujets et d'un seul état de destruction : les garder aurait
fait deux producteurs pour les mêmes noms de fichier, dont le second écrasait le
premier selon l'ordre de la chaîne.

⚠ CE QUI RESTE N'A JAMAIS ÉTÉ UN BÂTIMENT. `ruine_j` et `ruine_o` se posent
quand la CASE est rasée ; `bat_<c>_<id>_detruit` quand le bâtiment est à zéro PV
mais encore là. Deux choses différentes, et c'est pour ça que ce fichier ne
disparaît pas avec ses seize.

⚠⚠ LES DEUX RUINES SUIVENT LE CHANTIER ET LA SOUCHE — lot EMPRISES-ET-DÉLAI,
10/09/2026 au soir. Ethan : « Les ruines doivent suivre les bâtiments ». Leur
emprise passe de 26 à 31 gros pixels sur 32, c'est-à-dire au palier HAUT et non
au défaut, et la raison est de jeu : une ruine remplace à l'écran une base RASÉE
TOUT ENTIÈRE, pas un bâtiment ordinaire. Une ruine plus PETITE que le bâtiment
central qu'elle recouvre se lirait comme un rétrécissement du site, c'est-à-dire
comme un changement d'état que le rasage n'a pas produit.

⚠⚠ ET LE NOMBRE NE SE RECOPIE PAS : IL S'IMPORTE. Deux `31` écrits dans deux
fichiers sont deux occasions de diverger, et celle-là serait muette — la ruine
rétrécirait sous le Chantier sans qu'un test le dise. `batiments_v2.py` porte la
table des paliers ; ce fichier-ci la LIT.

Dix-huit sprites, trois grilles, cinquante-quatre fichiers. Le suffixe de sortie
est `_detruit`, sur le modèle du `_def` des unités : même dossier, même nom de
bâtiment, un état de plus.

LA TABLE EST CELLE DE `final128.py`, PAS UNE RECOPIE. Les planches détruites
reprennent exactement la disposition des planches intactes — même grille, mêmes
bâtiments dans le même ordre — et c'est ce qui permet de dériver l'une de
l'autre. Si `B` change, ce lot suit sans intervention. Une table écrite à la
main ici serait la première à diverger, comme l'a montré `rosterDefensif`, qui
lit `DEFENSES` et `UNITES` au lieu d'énumérer dix-sept noms.

DEUX DOUBLONS ONT ÉTÉ ARBITRÉS PAR MESURE, faute d'instruction, et le critère
est la survie à la grille de 32 gros pixels :

    P2_..._detruite_1024      2,66 gp d'épaisseur médiane   <- retenu
    P2_..._detruite_1024-1    2,48 gp
    P4_..._detruite_1024-1    1,53 gp                        <- retenu
    P4_..._detruite_1024-2    1,17 gp

L'écart est net dans les deux cas — 7 % et 31 % — et va dans le même sens que la
matière totale. ⚠ C'est un critère de LISIBILITÉ, pas de goût : si le jet le
plus fin est le plus beau, c'est un arbitrage d'Ethan et il se change ici.

LES DEUX RUINES viennent de `R2_ruines_mur_tourelle_joueur_ouvrage_2x1`, dont
les deux cellules se séparent au violet : 0,0 % à gauche, 72,0 % à droite. Le
camp est donc mesuré, pas déduit de l'ordre du nom de fichier.

LES HUIT RUINES DE DÉFENSE viennent de huit planches à un sujet chacune, quatre
par camp, livrées par Ethan le 19/09. Leur camp est mesuré au violet comme celui
des deux au-dessus — et le seuil n'est PAS le même, parce que la mesure dit
autre chose : voir `SEUIL_VIOLET_DEF`.

    python3 tools/ruines.py
"""
import sys, os
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites

from PIL import Image
import numpy as np
from cond import est_fond
from final128 import pal, recadrer, conditionner, ecrire
from batiments_v2 import EMPRISE_QUATRE_VINGT_DIX_HUIT
from joueur_v2 import EMPRISE_QUATRE_VINGT_DIX

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('bâtiment')
GRILLES = (128, 64)   # la 32 est sortie au lot PIXELS : ni le jeu ni les tests ne la lisaient

RUINES = ('R2_ruines_mur_tourelle_joueur_ouvrage_2x1.png',
          [('ruine_j', False), ('ruine_o', True)])

# ---------------------------------------------------------------------------
# Les huit ruines de défense — lot RUINES-DÉFENSE, 19/09/2026
# ---------------------------------------------------------------------------
#
# ⚠⚠ ELLES NE VONT PAS DANS `bâtiment`, ELLES VONT DANS `defense`, ET LE POIDS
# N'A PAS DÉCIDÉ. Les quatre familles candidates ont été cousues et mesurées en
# base64 : `bâtiment` +69 652, famille NEUVE +74 128, `terrain` +73 228,
# `defense` +75 208 — cinq mille cinq cents octets d'écart entre la moins chère
# et la plus chère, soit 0,06 % du livrable. Ce qui décide est ailleurs :
# `defense` est la famille des pièces que ces ruines REMPLACENT, elle est déjà
# dans `ATLAS_DE_LA_PAGE`, dans `atlasDeLaScene` et dans la table du banc, donc
# elle ne demande AUCUN câblage. Une famille neuve en aurait demandé six, et
# `executer` LÈVE sur une famille absente : en oublier une ferait tomber
# l'écran de raid ET le banc. Et `bâtiment` est l'endroit où vivent
# `ruine_j` / `ruine_o`, c'est-à-dire les ruines de BÂTIMENT — la confusion
# exacte que le brief de ce lot passe son §1.1 à écarter.
#
# ⚠⚠ L'EMPRISE EST CELLE DU MUR, PAS CELLE DES RUINES DE BASE. 29 gros pixels
# sur 32, `EMPRISE_QUATRE_VINGT_DIX`, et non les 31 du bloc ci-dessus : une
# ruine de défense remplace UNE PIÈCE, quand `ruine_j` recouvre une base rasée
# TOUT ENTIÈRE. Mesuré sur les dix-huit sprites de `defense/128`, les trois
# pièces les plus larges — merlon, ronce, herse — tiennent EXACTEMENT 29,0 gros
# pixels, et ce sont celles-là que ces ruines remplacent le plus souvent.
#
# ⚠ ET LE NOMBRE S'IMPORTE DE `joueur_v2`, où les murs et les barrières le
# prennent. Deux `29` dans deux fichiers seraient deux occasions de diverger, et
# celle-là serait muette : la ruine grandirait ou rétrécirait sous le mur sans
# qu'un test le dise. Même discipline que le 31 juste au-dessus.
RUINES_DEFENSE_VARIANTES = 4

# ⚠⚠ LE SEUIL DE VIOLET N'EST PAS CELUI DES DEUX RUINES DE BASE, ET C'EST UNE
# MESURE QUI L'A DIT. Le bloc ci-dessus compare à 30 parce que la cellule
# Ouvrage de `R2` est à 72 % de violet ; ces planches-ci sont des GRAVATS, très
# largement gris et bruns, et leurs quatre cellules Ouvrage mesurent 17,5 · 23,4
# · 27,7 · 27,8 %. Reprendre 30 aurait fait LEVER les quatre. Relevé côté
# joueur : 0,05 · 0,12 · 0,13 · 0,16 %. Le seuil est posé à 5 — trente et une
# fois au-dessus du plus violet des joueurs, trois fois et demie sous le moins
# violet des Ouvrage — et il refuse toujours une planche inversée.
SEUIL_VIOLET_DEF = 5


def part_violette(a, m):
    px = a[m]
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    return float(((b > r + 8) & (b > g + 8)).mean() * 100)


n = 0

# --- les deux ruines, camp mesuré au violet ---
fichier, attendus = RUINES
im = Image.open(os.path.join(SRC, fichier))
a = np.array(im.convert('RGB')).astype(int)
m = ~est_fond(a)
W = m.shape[1]
for k, (nom, ouv_attendu) in enumerate(attendus):
    tranche = slice(k * W // 2, (k + 1) * W // 2)
    violet = part_violette(a[:, tranche], m[:, tranche])
    # La cellule de l'Ouvrage est à 72 % de violet, celle du joueur à 0 %. Le
    # seuil à 30 laisse toute la marge voulue et refuse une planche inversée.
    if (violet > 30) != ouv_attendu:
        raise AssertionError(
            f'{fichier} cellule {k} : {violet:.1f} % de violet, '
            f'{"Ouvrage" if ouv_attendu else "joueur"} attendu — planche inversée ?')
    P = pal(ouv_attendu)
    cell = im.crop((k * W // 2, 0, (k + 1) * W // 2, im.size[1]))
    for N in GRILLES:
        # ⚠ `N // 32` EST LA MISE À L'ÉCHELLE DE LA GRILLE, pas un nombre magique :
        # `N` vaut 64 ou 128, donc le facteur vaut 2 ou 4. Seule l'emprise change.
        g, matiere = conditionner(
            recadrer(cell, EMPRISE_QUATRE_VINGT_DIX_HUIT * (N // 32), N), P, N)
        d = os.path.join(DST, str(N))
        os.makedirs(d, exist_ok=True)
        ecrire(g, P, os.path.join(d, f'{nom}.png'), matiere)
        n += 1

# --- les huit ruines de défense, camp mesuré au violet lui aussi ---
DST_DEF = dossier_sprites('defense')
for camp, ouv_attendu in (('j', False), ('o', True)):
    P = pal(ouv_attendu)
    for k in range(1, RUINES_DEFENSE_VARIANTES + 1):
        fichier = f'ruine_def_{camp}_variante_{k:02d}.png'
        im = Image.open(os.path.join(SRC, fichier))
        a = np.array(im.convert('RGB')).astype(int)
        violet = part_violette(a, ~est_fond(a))
        if (violet > SEUIL_VIOLET_DEF) != ouv_attendu:
            raise AssertionError(
                f'{fichier} : {violet:.2f} % de violet, '
                f'{"Ouvrage" if ouv_attendu else "joueur"} attendu — planche du mauvais camp ?')
        # ⚠ LA LETTRE EST CELLE QUE `suffixeDeVariante` PRODUIT — `a` … `d`,
        # `String.fromCharCode(97 + i)` dans `src/render/variante.js`. Écrire le
        # numéro `01` … `04` ferait un nom que `nomDeVariante` ne compose pas.
        nom = f'ruine_def_{camp}_{chr(96 + k)}'
        for N in GRILLES:
            g, matiere = conditionner(
                recadrer(im, EMPRISE_QUATRE_VINGT_DIX * (N // 32), N), P, N)
            d = os.path.join(DST_DEF, str(N))
            os.makedirs(d, exist_ok=True)
            ecrire(g, P, os.path.join(d, f'{nom}.png'), matiere)
            n += 1

print(f'{n} fichiers écrits')
