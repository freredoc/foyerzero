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

⚠⚠ ET `angle_l` N'EST PAS PRODUIT DU TOUT. C'est le coin RENTRANT, celui où la
frontière tourne autour d'une encoche ; or le modèle du dépôt est PAR CASE —
`bordsDuTerritoire` de `sim/territoire.js` rend quatre booléens par case depuis
le 31/08 —, et dans ce modèle un coin rentrant est déjà formé par deux traits
pleins de DEUX cases voisines qui se rejoignent au sommet. Vérifié en rendant
un territoire d'essai à encoche : la frontière s'y ferme sans lui. Le produire
l'aurait fait coudre dans l'atlas et payer au livrable pour zéro pixel dessiné.
Sa cellule reste dans la planche, qui ne s'ampute pas : le jour où un modèle par
SOMMET arriverait, elle est là.

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


def detourer(rgb, forme, camp):
    """Le fond magenta devient transparent ; l'alpha reste binaire, puis bave."""
    opaque = ~assert_fond(rgb, forme, camp)
    out = np.zeros((*opaque.shape, 4), np.uint8)
    out[opaque, 0:3] = rgb[opaque]
    out[opaque, 3] = 255
    return baver(out)


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
    print(f'limites : {ecrits} fichiers écrits dans {DST}')


if __name__ == '__main__':
    main()
