#!/usr/bin/env python3
"""Les limites de territoire de la carte du monde — quatre formes, deux camps.

Ethan, le 03/09/2026 : « je t'ai envoyé aussi un zip avec des bordures de
territoire pour la carte du monde ». Le zip — `limites_territoire_foyer_zero_v5`
— porte CINQ formes par camp : trait, angle en L, coin extérieur, U, carré.

⚠⚠ LA FRONTIÈRE ÉTAIT DESSINÉE AU TRAIT DEPUIS LE 31/08, ET ELLE DEVIENT UN
SPRITE. `ui/monde.js` traçait les côtés exposés au `strokeStyle`, en os pour le
joueur et en rouge pour l'Ouvrage. Ce que ces dessins-ci apportent, c'est une
frontière qui a une ÉPAISSEUR, un dedans et un dehors : bande sombre côté
territoire, bande claire côté extérieur, et des repères qui pointent vers
l'intérieur. Un trait de deux pixels ne dit pas de quel côté on est.

⚠⚠ LA COUPE ET LA RÉDUCTION SONT VÉRIFIÉES CONTRE LA LIVRAISON, PAS SUPPOSÉES.
Le zip donne la planche 5 × 1 en 1024 ET en 128, plus les dix sprites découpés.
Mesuré ici avant d'écrire une ligne : la coupe en cellules de 1024 reproduit les
dix sprites AU PIXEL PRÈS, et la réduction NEAREST par huit reproduit les dix
sprites de 128 AU PIXEL PRÈS aussi. Ce n'est pas une coïncidence — la planche
est dessinée sur une grille logique de 32 × 32 gros pixels, donc 32 pixels réels
par pixel logique à 1024 et 4 à 128, et 32/8 = 4 exactement. `verifier_reduction`
rejoue cette égalité à chaque exécution, contre les planches de 128 qui sont au
dépôt pour ça.

⚠⚠ LES CINQ FORMES NE SUIVENT PAS UNE SEULE CONVENTION, ET C'EST MESURÉ.
`coin`, `u` et `carre` posent leurs traits sur les BORDS de la case — lignes
logiques 0/1 et 30/31. `trait` et `angle_l` les posent sur les LIGNES MÉDIANES,
15/16. Les deux ne peuvent pas coexister : un `trait` laissé au milieu se
désalignerait d'une demi-case de tout `coin` qu'il rencontre, et la frontière
serait brisée à chaque angle.

⚠⚠ ON NORMALISE `trait` SUR LA CONVENTION DES TROIS AUTRES, ET C'EST UNE
TRANSLATION, PAS UN REDESSIN. Le trait est décalé de quinze pixels logiques vers
le bas : sa bande sombre passe de la ligne 15 à la ligne 30, sa bande claire de
16 à 31 — c'est-à-dire EXACTEMENT le bord bas de `carre`, mesuré. Aucun pixel
n'est inventé, aucun n'est perdu (les repères descendent de 11–14 à 26–29, et
la case en compte 32). `assert_bord` le vérifie sur les quatre formes produites,
au lieu de croire que la translation est tombée juste.

⚠⚠ LE COIN RENTRANT MANQUAIT, ET LE LOT TERRITOIRE AVAIT ÉCRIT LE CONTRAIRE.
Ce paragraphe affirmait, le 03/09 : « dans ce modèle un coin rentrant est déjà
formé par deux traits pleins de DEUX cases voisines qui se rejoignent au sommet.
Vérifié en rendant un territoire d'essai à encoche : la frontière s'y ferme sans
lui. » **C'est faux, et Ethan l'a vu à l'écran** — 05/09 : « quand tu dessines un
territoire en U il manque les deux points, je pense qu'il manque les coins en
270 degrés ». Les deux traits se rejoignent au POINT, pas en surface : une bande
a deux pixels logiques d'épaisseur, et à un sommet rentrant elles laissent
exactement un carré de 2 × 2 non peint. **Reproduit avant d'écrire une ligne**,
en rendant le U `XXX / X.X / X.X` avec les sprites du dépôt : deux sommets
rentrants, **0 pixel logique sur 4 peint à chacun**. Ethan compte deux points, la
mesure en compte deux.

⚠⚠ ET CE N'EST PAS `angle_l` QUI LE COMBLE — MESURÉ, `angle_l` EST UN COIN
SORTANT. Sa bande verticale occupe les colonnes logiques 15–16 sur les rangées
0–16, son horizontale les rangées 15–16 sur les colonnes 0–16, et ses repères
pointent au nord et à l'ouest : c'est le bord SUD-EST du QUART nord-ouest de la
case, donc le même angle que `coin`, à la médiane et à moitié d'échelle. Son
sommet porte `#FFE984` — l'éclat, celui d'un angle qui SORT. Le poser à un sommet
rentrant peindrait une frontière au milieu d'un territoire.

⚠⚠ D'OÙ `pointe`, ET ELLE EST COMPOSÉE, PAS DÉCOUPÉE — C'EST LE SEUL ENDROIT DU
LOT OÙ UN PIXEL NE VIENT PAS D'UNE PLANCHE. Cherché d'abord : sur les cinq
cellules des deux camps, **zéro** bloc de 2 × 2 logiques porte le motif d'un
sommet rentrant — trois tons sombres et un ton clair au coin extérieur. Il n'y en
a pas parce que l'art n'en dessine pas. Les quatre pixels se composent donc des
DEUX tons de bande de la rampe du camp, et le motif est celui du raccord
d'onglet : le pixel qui touche le sommet prend la bande CLAIRE, les trois autres
la bande SOMBRE. C'est l'exact complément d'un coin sortant, où la claire fait le
L de trois et la sombre le pixel du fond — mesuré sur `carre`, dont chaque coin
vaut trois `EAB82B` et un `7E4A12`.

⚠ LES ROTATIONS SE PRODUISENT ICI, ELLES NE SE FONT PAS AU DESSIN. Le README du
zip le demande — « rotations de 90 degrés avec interpolation NEAREST/point
uniquement » —, et `render/canvas2d.js` n'a aucune primitive de rotation : lui en
donner une pour quatre sprites ferait porter une transformation de contexte à
tout le champ de bataille. Une rotation de 90° d'une image carrée est exacte, et
`np.rot90` ne mélange aucun pixel.

⚠⚠ LE DÉTOURAGE PASSE PAR `est_fond`, PAS PAR `est_fond_sujet` — L'INVERSE DU
LOT MURS, ET C'EST MESURÉ. `est_fond_sujet` borne le fond à la composante qui
TOUCHE LE BORD ; or ici le fond est ENFERMÉ : `carre` et `u` posent leur bande
claire tout au long du bord de la case, si bien qu'aucun pixel de fond ne le
touche. Mesuré : `est_fond_sujet` rend **zéro** pixel sur ces deux formes-là, ce
qui les laisserait entièrement opaques, magenta compris. Un mur a son sujet au
milieu et son fond autour ; une limite est un CADRE, et c'est le contraire.

⚠ ET `est_fond` NE PERCE RIEN ICI, ce qui n'allait pas de soi : sa seconde porte
attrape des teintes claires, et ces dessins-ci ont une bande claire. Mesuré sur
les trente combinaisons — cinq formes × deux camps × trois tailles — `est_fond`
rend EXACTEMENT les pixels magenta purs, ni un de plus ni un de moins, et il n'y
a pas un seul pixel « proche du magenta sans l'être » dans toute la livraison.
Le README du zip l'annonçait (« aucun anticrénelage ») ; `assert_fond` le
vérifie à chaque exécution plutôt que de le croire.

⚠ ET LA COULEUR BAVE DANS LE TRANSPARENT, pour la raison du lot MURS, en pire :
un sprite de limite est presque tout transparent, il part dans un atlas WebP q85
— avec perte sur le RVB — et la carte le dessine à quatre crans de zoom, donc
réduit trois fois sur quatre. `baver` vit dans `cond.py` depuis ce lot-ci.
"""

import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cond import baver, est_fond  # noqa: E402

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = os.path.join(RACINE, 'art', 'sources')

# La planche fait cinq cellules de 1024, dans l'ordre du README du zip.
CELLULE = 1024
COLONNES = ['trait', 'angle_l', 'coin', 'u', 'carre']

# La grille LOGIQUE du dessin : 32 × 32 gros pixels, quelle que soit la taille
# du fichier. Tout ce qui suit se compte là-dedans, jamais en pixels réels.
LOGIQUE = 32

# Le décalage qui amène le trait médian sur le bord bas — quinze pixels
# logiques. Il ne s'écrit pas : `assert_bord` le vérifie contre `carre`.
DECALAGE_TRAIT = 15

# Les deux grilles que `tools/atlas.py` coud. La même liste, et pour la même
# raison : une famille qui n'aurait qu'une grille ferait sortir le couseur.
GRILLES = (64, 128)

# ⚠ LE CAMP DONNE LA LETTRE, ET LA LETTRE EST CELLE DU DÉPÔT — `j` et `o`,
# comme `bord_j_`, `off_j_`, `bat_o_`. Le nom du fichier source, lui, écrit le
# mot en entier : c'est Ethan qui l'a nommé ainsi, et on ne renomme pas une
# source.
CAMPS = [('joueur', 'j'), ('ouvrage', 'o')]

# ⚠⚠ LA FRONTIÈRE SE RECOLORISE SUR LA RAMPE DE SON CAMP — arbitrage d'Ethan du
# 03/09/2026 au soir : « code couleur frontiere : vert kaki joueur et l'autre
# violet ouvrage / il faut que ça ressort sur le terrain. / recolorise si il le
# faut ». Les dessins livrés portaient leurs propres teintes — OR/AMBRE pour le
# joueur, GRIS-BLEU PÂLE pour l'Ouvrage —, ce que le rapport du lot TERRITOIRE
# avait relevé comme « un arbitrage qui revient à Ethan ». Il est rendu.
#
# ⚠⚠ ET LES DEUX RAMPES ONT ÉTÉ AVIVÉES LE 05/09, PARCE QUE LE SOL A CHANGÉ SOUS
# ELLES. Ethan : « tu re-appliques un coloris vert kaki mais assez vif pour qu'il
# se détache par rapport au nouveau plan satellite et tu prends un violet pareil
# assez vif comme ouvrage mais qui ressort et qui contraste par rapport au
# nouveau sol de la carte ». Le lot SOL-SATELLITE a remplacé un sol INDEXÉ sur
# cinq teintes par l'art d'Ethan ; la frontière, elle, avait été calibrée en
# septembre contre `TERRAIN_CARTE.rampes`, c'est-à-dire contre la référence
# DÉCLARÉE de l'ancien sol. Mesuré sur les huit planches livrées, ce que le sol
# vaut vraiment aujourd'hui :
#
#     L* p1 51,0 · p5 55,3 · médiane 64,6 · p95 74,1 · p99 77,9
#     chroma moyenne 25,8, teinte 46° (terre cuite)
#
# La rampe déclarée s'arrêtait à L* 58,1 par le bas : **le sol réel descend sept
# clartés plus bas qu'elle**, et le ton clair de l'ancienne frontière du joueur —
# `#6A7658`, L* 47,9 — n'était plus qu'à 3,1 du plancher du sol. Surtout, il
# portait une chroma de 18,2 contre 25,8 au sol : il se lisait comme de la boue
# sombre, pas comme un code couleur.
#
# ⚠⚠ CE QUI CHANGE EST LA CHROMA, ET ELLE SEULE : ×2, À CLARTÉ ET TEINTE
# IDENTIQUES. Chaque ton garde son L* au dixième et sa teinte au degré — kaki
# 125°, ardoise 308° —, et sa chroma double. C'est ce que « re-appliquer le même
# coloris, en plus vif » veut dire au pied de la lettre, et ça a une conséquence
# qui compte : **le rangement par clarté ne bouge pas d'un rang**, donc la
# lecture dedans/dehors que ce fichier construit plus bas est intacte PAR
# CONSTRUCTION, et non parce qu'on l'a revérifiée.
#
#     ton                       avant            après         ΔE min au sol
#     kaki 1                 #161914 C 3,9    #161A0E C 8,2    39,5 → 39,9
#     kaki 2 (repères)       #343A2C C 9,7    #2F3C20 C19,2    28,4 → 33,2
#     kaki 3 (bande claire)  #4E5742 C13,6    #475A2F C27,3    23,4 → 33,2
#     kaki 4 (éclats)        #6A7658 C18,2    #5F7A3E C36,1    22,5 → 30,4
#
# Pire écart au sol, sur les quatre tons : **joueur 22,1 → 30,4 (+38 %),
# Ouvrage 30,5 → 41,5 (+36 %)**, mesuré en ΔE76 contre 1,6 million de pixels des
# huit planches.
#
# ⚠ LE FACTEUR EST DEUX, ET LE NOMBRE SE CHANGE SEUL. Mesuré aussi à ×1,5, ×2,5
# et ×3 : le gain de ΔE s'essouffle après ×2 côté Ouvrage (+11,0 de ×1 à ×2,
# +0,5 ensuite), et côté joueur ×2,5 fait sortir le kaki de sa famille — le ton
# clair passe à `#587C2F`, une herbe et non un treillis. Deux est le premier
# facteur où la couleur se NOMME et le dernier où elle reste kaki. **Ethan
# tranche s'il le veut plus vif ; c'est une ligne.**
#
# ⚠ ET LA FICHE A SUIVI, ELLE N'A PAS ÉTÉ CONTOURNÉE. `FICHE-STYLE.md` fait
# autorité sur le style et sa §3 dit « aucune teinte hors de cette liste » : les
# huit tons ci-dessous y entrent sous leur propre titre, avec la date et la
# phrase d'Ethan. Les produire ici sans les y écrire aurait laissé la fiche
# mentir, et le prochain lot les aurait « corrigés » vers la rampe des châssis.
# Un test lit la fiche et confronte les sprites produits, dans les deux sens.
#
# ⚠ LE JOUEUR EST VERT PARCE QUE FICHE-STYLE LE DIT — « la rampe kaki est celle
# du joueur, définitivement », et « aucun vert dans le terrain, nulle part ».
# C'est ce qui rend le kaki lisible comme sien sur un sol de terre cuite : aucune
# tuile de sol ne peut le citer, et l'aviver ne fait que le dire plus fort.
RAMPES = {
    'joueur': ['#161A0E', '#2F3C20', '#475A2F', '#5F7A3E'],
    'ouvrage': ['#100916', '#26193C', '#3B285C', '#523A7A'],
}


def rvb(h):
    """Un hex de FICHE-STYLE en triplet d'octets."""
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def clarte(px):
    """La clarté L* d'un pixel sRGB. Sert à RANGER, jamais à peindre.

    ⚠ ON RANGE PAR CLARTÉ, PAS PAR FRÉQUENCE. Les deux donneraient le même
    résultat sur la livraison — mesuré, les quatre tons de chaque camp ont
    exactement les mêmes parts, 41,0 · 31,9 · 16,2 · 11,0 % —, mais la
    fréquence n'a aucun rapport avec ce qu'on veut préserver : c'est l'ORDRE
    DES CLARTÉS qui porte le dedans et le dehors. La bande sombre est du côté
    du territoire, la claire dehors ; un rangement monotone en clarté garde
    cette lecture PAR CONSTRUCTION, quel que soit le dessin qui arrive.
    """
    lin = [c / 255 for c in px]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in lin]
    y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
    return 116 * (y ** (1 / 3) if y > 0.008856 else 7.787 * y + 16 / 116) - 16


# ⚠⚠ L'ORDRE DES CÔTÉS EST `n e s o`, ET IL EST CANONIQUE. C'est celui de la
# boussole dans le sens horaire, et c'est lui qui NOMME les sprites : un ensemble
# de côtés exposés se lit toujours dans cet ordre-là, donc `{est, nord}` s'écrit
# `ne` et jamais `en`. `render/limite.js` refait le même tri, et un test le
# confronte à ces noms-ci.
COTES = 'neso'


def nom_des_cotes(exposes):
    """Le suffixe d'un ensemble de côtés, dans l'ordre canonique."""
    return ''.join(c for c in COTES if c in exposes)


def tourner_cotes(exposes, k):
    """Les côtés après k quarts de tour HORAIRES : n→e→s→o→n."""
    return {COTES[(COTES.index(c) + k) % 4] for c in exposes}


# Les quatre formes posées, avec les côtés exposés de leur orientation de BASE,
# mesurés sur la planche.
#
#   trait  — après normalisation, la bande sombre est en haut : le côté exposé
#            est le SUD ;
#   coin   — traits sur les bords haut et droit : NORD et EST ;
#   u      — traits sur haut, gauche et droite, ouvert en bas : NORD, EST, OUEST ;
#   carre  — les quatre.
#
# ⚠ `carre` N'A QU'UNE ORIENTATION, ET CE N'EST PAS PARCE QU'IL EST SYMÉTRIQUE.
# Mesuré : il ne l'est PAS — ses repères ne retombent pas sur eux-mêmes après un
# quart de tour. Il n'en a qu'une parce qu'il n'y a qu'un seul cas « les quatre
# côtés sont exposés », donc rien à distinguer.
FORMES = {
    'trait': ({'s'}, 4),
    'coin': ({'n', 'e'}, 4),
    'u': ({'n', 'e', 'o'}, 4),
    'carre': ({'n', 'e', 's', 'o'}, 1),
}

# ⚠⚠ `pointe` N'EST PAS DANS `FORMES` PARCE QU'ELLE N'EST PAS DANS LA PLANCHE.
# Les quatre formes ci-dessus se découpent, se normalisent, se détourent et se
# recolorisent ; celle-ci se COMPOSE, à partir des deux tons de bande que la
# recolorisation vient de poser. Lui donner une entrée dans `FORMES` aurait
# obligé la boucle principale à savoir laquelle de ses cinq entrées n'a pas de
# cellule — un cas particulier nommé à la main dans la boucle qu'on veut garder
# uniforme. Elle a sa propre fonction, et son propre contrôle.
#
# ⚠ SON ORIENTATION DE BASE EST LE COIN NORD-EST, comme `coin`, et pour la même
# raison : les deux se nomment par les MÊMES suffixes — `ne`, `es`, `so`, `no` —
# donc `tourner_cotes` les fait tourner ensemble. Un `pointe_es` est le sommet
# rentrant au coin SUD-EST de la case, exactement là où `coin_es` porterait un
# angle sortant.
POINTE = ({'n', 'e'}, 4)

# L'épaisseur d'une bande, en pixels logiques — deux, comme `assert_bord` le
# vérifie sur les quatre formes de la planche. La pointe est le carré de raccord
# d'onglet, donc elle en fait exactement autant de côté.
EPAISSEUR = 2


def cellules(chemin, cote):
    """Les cinq cellules carrées d'une planche 5 × 1, dans l'ordre du README."""
    im = Image.open(chemin).convert('RGB')
    L, H = im.size
    assert H == cote and L == 5 * cote, (
        f'{os.path.basename(chemin)} : {L}x{H}, attendu {5 * cote}x{cote}')
    return {n: im.crop((i * cote, 0, (i + 1) * cote, cote))
            for i, n in enumerate(COLONNES)}


def verifier_reduction(cellules_1024, cellules_128, camp):
    """La réduction NEAREST par huit rend EXACTEMENT la planche de 128 livrée.

    ⚠⚠ C'EST LA GARDE QUI JUSTIFIE LA RÉDUCTION, et elle n'est pas décorative :
    sans elle, « on réduit par huit » serait une affirmation sur la grille
    logique du dessin, invérifiable depuis le dépôt. Ethan a livré les deux
    tailles ; on s'en sert. Le jour où une planche de 1024 arriverait sur une
    autre grille logique, la réduction cesserait d'être exacte et cette
    assertion tomberait — au lieu que le sprite sorte flou.
    """
    for n in COLONNES:
        vu = cellules_1024[n].resize((128, 128), Image.NEAREST)
        assert vu.tobytes() == cellules_128[n].tobytes(), (
            f'{camp}/{n} : la réduction NEAREST par huit ne rend pas la planche '
            f'de 128 livrée — la grille logique du dessin a changé')


def normaliser(rgb, forme, cote):
    """`trait` descend sur le bord ; les trois autres y sont déjà.

    ⚠ LA TRANSLATION SE FAIT EN PIXELS LOGIQUES, PAS EN PIXELS RÉELS. À 128 un
    pixel logique vaut 4 pixels ; à 64, 2. Écrire « 60 » marcherait pour la
    grille de 128 et décalerait celle de 64 d'un demi-trait.
    """
    if forme != 'trait':
        return rgb
    pas = cote // LOGIQUE
    out = np.full_like(rgb, 255)
    out[..., 1] = 0                       # le fond de la zone libérée : magenta
    d = DECALAGE_TRAIT * pas
    out[d:, :] = rgb[:cote - d, :]
    return out


def assert_fond(rgb, forme, camp):
    """`est_fond` ne retient QUE le magenta pur — l'art est sans anticrénelage.

    ⚠⚠ CETTE ASSERTION EST LA CONTREPARTIE D'AVOIR CHOISI `est_fond`. Sa seconde
    porte attrape des teintes claires jusqu'au milieu d'un sujet — c'est ce qui a
    fait les trous du lot PIXELS —, et la bande CLAIRE de ces dessins-ci est
    précisément ce qu'elle ne doit pas prendre. Le jour où une planche arriverait
    anticrénelée, ou avec une bande claire plus pâle, elle tombe ; sans elle, le
    liseré extérieur se mettrait à disparaître sans que rien ne le dise.
    """
    pur = (rgb == np.array([255, 0, 255], np.uint8)).all(-1)
    vu = est_fond(rgb)
    ecart = int((pur != vu).sum())
    assert ecart == 0, (
        f'{camp}/{forme} : `est_fond` et le magenta pur diffèrent de {ecart} pixels — '
        f'la planche est anticrénelée, ou sa bande claire a changé de teinte')
    return vu


def recoloriser(out, opaque, forme, camp):
    """Les quatre tons du dessin passent sur les quatre tons de la rampe du camp.

    ⚠⚠ EXACTEMENT QUATRE TONS, ET LE COMPTE EST ASSERTÉ AVANT LA SUBSTITUTION.
    Une cinquième teinte — une planche anticrénelée, un dessin repris avec un
    ton de plus — n'aurait aucune image dans la rampe : sans cette garde elle
    passerait TELLE QUELLE, et la frontière ressortirait mi-kaki mi-or sans que
    rien ne le dise. C'est la même discipline qu'`assert_fond` juste au-dessus :
    on vérifie la livraison, on ne la suppose pas.

    ⚠ ET LA SUBSTITUTION SE FAIT SUR UN MASQUE PRIS D'AVANCE, jamais en place.
    Peindre ton par ton dans le tableau qu'on lit ferait qu'un ton déjà réécrit
    puisse être relu comme un ton source — le kaki `#343A2C` de l'Ouvrage n'est
    pas dans sa rampe, mais rien ne garantit qu'aucune rampe ne recoupera jamais
    un ton de dessin.
    """
    tons = [tuple(int(c) for c in t) for t in np.unique(out[opaque, 0:3], axis=0)]
    attendu = len(RAMPES[camp])
    assert len(tons) == attendu, (
        f'{camp}/{forme} : {len(tons)} tons opaques, {attendu} attendus — la planche '
        f'a changé de palette, il n\'y a plus de correspondance rang par rang')
    # Du plus sombre au plus clair, des deux côtés : la bande sombre du dessin
    # prend le creux de la rampe, la bande claire prend sa lumière.
    tons.sort(key=clarte)
    cible = [rvb(h) for h in RAMPES[camp]]
    assert cible == sorted(cible, key=clarte), (
        f'{camp} : la rampe n\'est pas rangée du creux à la lumière — le rangement '
        f'rang par rang inverserait le dedans et le dehors')
    masques = [(out[..., 0:3] == np.array(t, np.uint8)).all(-1) & opaque for t in tons]
    for m, t in zip(masques, cible):
        out[m, 0:3] = t
    return out


def detourer(rgb, forme, camp):
    """Le fond magenta devient transparent, l'alpha reste binaire, puis on
    recolorise et la couleur bave.

    ⚠⚠ L'ORDRE DES TROIS GESTES N'EST PAS LIBRE. `assert_fond` travaille sur le
    RVB de la LIVRAISON — c'est ce qui lui permet de mesurer que la planche est
    sans anticrénelage —, donc la recolorisation vient APRÈS lui. Et `baver`
    vient après elle : il étend la couleur opaque dans le transparent, donc
    baver d'abord laisserait dans la frange le RVB des anciennes teintes, que le
    WebP q85 de l'atlas lisserait en un liseré or autour d'une frontière kaki.
    C'est exactement le liseré rouge sombre mesuré au lot MURS, dans l'autre
    couleur.
    """
    opaque = ~assert_fond(rgb, forme, camp)
    out = np.zeros((*opaque.shape, 4), np.uint8)
    out[opaque, 0:3] = rgb[opaque]
    out[opaque, 3] = 255
    return baver(recoloriser(out, opaque, forme, camp))


def lignes_pleines(rgba, cote):
    """Les lignes et colonnes LOGIQUES entièrement opaques — où sont les traits."""
    pas = cote // LOGIQUE
    plein = rgba[..., 3] == 255
    ech = plein[pas // 2::pas, pas // 2::pas][:LOGIQUE, :LOGIQUE]
    return ([g for g in range(LOGIQUE) if ech[g].sum() >= LOGIQUE - 2],
            [g for g in range(LOGIQUE) if ech[:, g].sum() >= LOGIQUE - 2])


def assert_bord(rgba, forme, exposes, cote):
    """Chaque forme pose ses traits sur les BORDS de la case, et sur eux seuls.

    ⚠⚠ C'EST LA GARDE DE LA NORMALISATION, et elle porte sur les QUATRE formes,
    pas seulement sur celle qu'on a déplacée. Une garde qui ne regarderait que
    `trait` ne dirait pas si la convention qu'on lui impose est bien celle des
    trois autres — c'est-à-dire exactement ce qu'on veut savoir.
    """
    l, c = lignes_pleines(rgba, cote)
    attendu_l = ([0, 1] if 'n' in exposes else []) + ([30, 31] if 's' in exposes else [])
    attendu_c = ([0, 1] if 'o' in exposes else []) + ([30, 31] if 'e' in exposes else [])
    assert l == sorted(attendu_l) and c == sorted(attendu_c), (
        f'{forme} ({nom_des_cotes(exposes)}) : traits en lignes {l} colonnes {c}, '
        f'attendu {sorted(attendu_l)} / {sorted(attendu_c)} — la convention de bord '
        f'n\'est pas tenue')


def composer_pointe(camp, cote):
    """Le carré de raccord d'un sommet RENTRANT, au coin nord-est de la case.

    ⚠⚠ LE MOTIF EST CELUI DE L'ONGLET, ET IL SE DÉRIVE, IL NE SE CHOISIT PAS.
    Une bande hugge sa frontière par l'intérieur : le pixel extérieur porte le
    ton CLAIR, celui d'un cran plus dedans le ton SOMBRE — c'est ce que `carre`
    fait sur ses quatre côtés, mesuré. À un sommet rentrant, les deux bandes
    arrivent perpendiculairement et l'onglet remplit le carré de 2 × 2 qui leur
    manque à toutes les deux. Dans ce carré, la distance à la frontière est la
    distance au SOMMET : le seul pixel qui le touche est à 0,71, les deux autres
    à 1,58 et le quatrième à 2,12. Un seul est donc dans le cran extérieur.

    ⚠ C'EST L'EXACT COMPLÉMENT D'UN COIN SORTANT, où la même règle donne trois
    pixels clairs et un sombre — et c'est bien ce que porte chaque coin de
    `carre` : trois `EAB82B` et un `7E4A12`. Les deux motifs ne sont donc PAS
    l'image l'un de l'autre par rotation ; les composer par symétrie mettrait le
    ton clair au fond du territoire.

    ⚠ LES DEUX TONS SONT LES DEUX TONS DE BANDE DE LA RAMPE, RANGS 1 ET 3. Les
    rangs 2 et 4 sont les repères et les éclats, mesurés sur la planche : 16,2 %
    et 11,0 % du dessin, et jamais une bande. Une pointe n'a ni repère à porter
    ni éclat à donner — elle fait deux pixels de côté.
    """
    pas = cote // LOGIQUE
    sombre = rvb(RAMPES[camp][0])
    clair = rvb(RAMPES[camp][2])
    out = np.zeros((cote, cote, 4), np.uint8)
    for g in range(EPAISSEUR):                      # ligne logique, depuis le haut
        for h in range(EPAISSEUR):                  # colonne logique, depuis la droite
            ton = clair if (g == 0 and h == 0) else sombre
            y = g * pas
            x = cote - (h + 1) * pas
            out[y:y + pas, x:x + pas, 0:3] = ton
            out[y:y + pas, x:x + pas, 3] = 255
    return baver(out)


def assert_pointe(rgba, camp, exposes, cote):
    """Une pointe n'occupe QUE son carré de coin, et son ton clair touche le sommet.

    ⚠⚠ LA SECONDE MOITIÉ EST CELLE QUI COMPTE. « Quatre pixels opaques dans le
    bon coin » resterait vrai d'un carré entièrement sombre, ou d'un carré dont
    le clair serait au fond du territoire — c'est-à-dire de la faute exacte que
    le commentaire de `composer_pointe` existe pour empêcher. La garde nomme
    donc le pixel : celui qui touche le sommet est le ton de bande CLAIR, les
    trois autres le SOMBRE.
    """
    pas = cote // LOGIQUE
    plein = rgba[..., 3] == 255
    attendu = 4 * pas * pas
    assert int(plein.sum()) == attendu, (
        f'{camp}/pointe ({nom_des_cotes(exposes)}) : {int(plein.sum())} pixels opaques, '
        f'{attendu} attendus — la pointe déborde de son carré')
    g0 = 0 if 'n' in exposes else LOGIQUE - EPAISSEUR
    c0 = LOGIQUE - EPAISSEUR if 'e' in exposes else 0
    coin = [(g0 + g, c0 + h) for g in range(EPAISSEUR) for h in range(EPAISSEUR)]
    for g, c in coin:
        assert plein[g * pas + pas // 2, c * pas + pas // 2], (
            f'{camp}/pointe ({nom_des_cotes(exposes)}) : le pixel logique ({g},{c}) '
            f'du carré de coin est vide')
    # Le sommet de la case, c'est-à-dire le pixel logique le plus extérieur du carré.
    sg = 0 if 'n' in exposes else LOGIQUE - 1
    sc = LOGIQUE - 1 if 'e' in exposes else 0
    lu = tuple(int(v) for v in rgba[sg * pas + pas // 2, sc * pas + pas // 2, 0:3])
    assert lu == rvb(RAMPES[camp][2]), (
        f'{camp}/pointe ({nom_des_cotes(exposes)}) : le pixel du sommet vaut {lu}, '
        f'{rvb(RAMPES[camp][2])} attendu — la bande claire n\'est plus au dehors')


def main():
    from chemins import dossier_sprites
    DST = dossier_sprites('limite')
    for cote in GRILLES:
        d = os.path.join(DST, str(cote))
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d):
            if f.endswith('.png'):
                os.remove(os.path.join(d, f))

    ecrits = 0
    for camp, lettre in CAMPS:
        c1024 = cellules(os.path.join(SOURCES, f'planche_limites_{camp}_5x1_1024.png'), 1024)
        c128 = cellules(os.path.join(SOURCES, f'planche_limites_{camp}_5x1_128.png'), 128)
        verifier_reduction(c1024, c128, camp)
        for cote in GRILLES:
            for forme, (base, rotations) in FORMES.items():
                # ⚠ ON RÉDUIT DEPUIS LE 1024, JAMAIS DEPUIS LE 128. Enchaîner
                # 1024 → 128 → 64 donnerait le même résultat ici, la grille
                # logique tombant juste aux deux étages ; partir de la source à
                # chaque fois le garde vrai si elle cesse de tomber juste.
                rgb = np.array(c1024[forme].resize((cote, cote), Image.NEAREST))
                rgb = normaliser(rgb, forme, cote)
                rgba = detourer(rgb, forme, camp)
                assert_bord(rgba, forme, base, cote)
                for k in range(rotations):
                    # ⚠ `np.rot90` TOURNE DANS LE SENS TRIGONOMÉTRIQUE ; nos
                    # quarts de tour sont HORAIRES, d'où le `-k`. Se tromper de
                    # sens rendrait des sprites justes, tous mal nommés, et rien
                    # ne le dirait avant l'écran.
                    tourne = np.rot90(rgba, -k)
                    cotes = tourner_cotes(base, k)
                    suffixe = nom_des_cotes(cotes)
                    nom = f'limite_{lettre}_{forme}'
                    if forme != 'carre':
                        nom += f'_{suffixe}'
                    assert_bord(tourne, forme, cotes, cote)
                    chemin = os.path.join(DST, str(cote), f'{nom}.png')
                    Image.fromarray(tourne, 'RGBA').save(chemin, optimize=True)
                    ecrits += 1
            # ⚠ LA POINTE SE COMPOSE APRÈS LES QUATRE FORMES, ET ELLE TOURNE DE
            # LA MÊME FAÇON — même sens horaire, mêmes suffixes, même garde de
            # rotation. Elle est en dehors de la boucle des formes parce qu'elle
            # n'a pas de cellule à découper, pas parce qu'elle vit à part.
            base, rotations = POINTE
            rgba = composer_pointe(camp, cote)
            assert_pointe(rgba, camp, base, cote)
            for k in range(rotations):
                tourne = np.rot90(rgba, -k)
                cotes = tourner_cotes(base, k)
                assert_pointe(tourne, camp, cotes, cote)
                nom = f'limite_{lettre}_pointe_{nom_des_cotes(cotes)}'
                Image.fromarray(tourne, 'RGBA').save(
                    os.path.join(DST, str(cote), f'{nom}.png'), optimize=True)
                ecrits += 1
    print(f'limites : {ecrits} fichiers écrits dans {DST}')


if __name__ == '__main__':
    main()
