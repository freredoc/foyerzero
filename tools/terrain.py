#!/usr/bin/env python3
"""Les champs et les obstacles de la base — dix sprites, sept planches.

Ethan, le 03/09/2026 : « il y a par exemple les champs de quartz […] il y a
plein d'autres éléments qui sont pas passés dans la nouvelle moulinette comme tu
dis si bien et donc ils sont encore moche à l'ancienne », puis, sans détour :
« passe tout les sprites non fait dans le nouveau modèle. terrain, champs quartz
scories etc bâtiments etc ».

⚠⚠ CE QU'IL RESTAIT, C'ÉTAIT LA FAMILLE `terrain`, ET ELLE SEULE — MESURÉ,
FAMILLE PAR FAMILLE, AVANT D'ÉCRIRE UNE LIGNE. Nombre de teintes opaques
distinctes, médiane sur les sprites de la grille 128 : bâtiment 3 091, defense
2 408, unite 3 525, chassis 4 484, socle 6 221, tourelle-unite 4 004, carte
7 456, bord 6 688 — tous passés au filtre du lot PIXELS. **`terrain` : 3.**
Minimum 1, maximum 5. Les deux autres familles à faible compte se justifient
d'elles-mêmes : `effet` porte sa propre palette de seize teintes, arbitrée le
30/08 et écrite dans `INVENTAIRE-SPRITES.md` §8, et `limite` est l'art d'Ethan
livré à plat le 03/09. Les bâtiments qu'il nomme SONT passés — 3 091 teintes —,
et le dire est le travail du rapport : la liste des « plein d'autres éléments »
se réduit à dix dessins, et c'est ce fichier-ci.

⚠⚠ POURQUOI PERSONNE NE LES PRODUISAIT. `terrain/` est une SOURCE DÉCLARÉE de
`tools/verifier.py` depuis le 30/08 — arbitrage d'Ethan, « déclarer le terrain
comme une source » —, au motif que la branche terrain de `planches.py` était une
migration à usage unique qui avait supprimé ses propres planches. C'était vrai
des huit `tile_sol_*`, et FAUX des dix autres : les planches d'origine des
champs et des obstacles sont au dépôt depuis toujours, dans `art/sources/`, en
1254 × 1254 et 8 628 à 87 766 couleurs. Elles y dormaient, classées `dormantes`
par le lot ENTRÉES, parce qu'aucun outil ne les nommait. Le vérificateur avait
donc raison de ne pas crier, et sa déclaration couvrait trop large.

⚠⚠ ET LA MOITIÉ INVERSE DE `SOURCES_DECLAREES` VA TOMBER, C'EST CE QU'ON LUI
DEMANDE. Elle dit : « le jour où un outil se met à produire une tuile de
terrain, le vérificateur TOMBE, pour qu'on retire la ligne ». Ce jour est
celui-ci. La déclaration ne disparaît pas — elle se RESSERRE sur les seuls
`tile_sol_*`, qui restent irreproductibles, voir plus bas.

⚠⚠ LES HUIT `tile_sol_*` NE SONT PAS PRODUITS ICI, ET LE REFUS EST MESURÉ.
Ce sont les quatre dalles de sol du joueur et leurs quatre jumelles de
l'Ouvrage. Trois faits, relevés avant de renoncer : (1) leur source apparente,
`sol_source_grille64_1536.png`, porte EXACTEMENT les cinq teintes de la rampe
« sol joueur » — c'est un INDEX, pas une matière, et le passer au filtre
mélangerait des indices ; (2) aucune des 576 cellules de 64 de cette source, ni
aucune fenêtre glissante de 64 × 64 sur ses 1 536², ne reproduit une seule des
quatre dalles : la migration a fait autre chose qu'une coupe, et ce qu'elle a
fait n'est plus au dépôt ; (3) **aucun écran ne les dessine** — le sol de la
base est découpé dans l'atlas du MONDE depuis le 30/08, quatre cellules par
case, et `fondDuTerrain` de `ui/chantier.js` n'est appelé que sur
`champ_<ressource>` et `obs_<type>`. Reconstruire à l'aveugle huit dalles que
personne ne regarde, à partir d'un index qu'on ne sait pas replier, aurait été
inventer de l'art plutôt que de le passer à la moulinette.

⚠ ET LEUR GRILLE 128 N'EN EST PAS UNE, MESURÉ AUSSI : les quatre dalles de 128
sont le doublement NEAREST exact des quatre de 64. Elles ne portent aucun détail
de plus. C'est un fait à connaître le jour où quelqu'un voudra les refaire ;
ce n'est pas une raison de les refaire aujourd'hui.

⚠⚠ LA CLÉ DE CES PLANCHES N'EST PAS PURE, ET ON LA NORMALISE AVANT LA CHAÎNE.
Mesuré : **zéro pixel `#FF00FF` sur les sept planches**. Le fond est un magenta
BRUITÉ — coins relevés entre (194, 16, 138) et (236, 11, 143) — et il
s'assombrit là où le dessin l'ombre, jusqu'à (168, 23, 113) au creux d'un
fourré. Deux conséquences, toutes deux constatées avant d'être corrigées :
  • `est_fond` laisse passer des MOUCHETURES de fond pour du sujet. Sur
    `fourre_sec_b`, cinquante-sept d'entre elles — la plus grosse fait 7 pixels
    quand le dessin en fait 252 420 — portaient le cadrage de `recadrer` à 1 061
    pixels de côté et **jusqu'au bord de la planche** : le buisson ressortait
    décentré et rapetissé à 85 pixels dans une case de 128 au lieu de 112.
  • Les pixels de clé ASSOMBRIS survivent au détourage et restent OPAQUES : la
    réduction LANCZOS les mélange au dessin, et l'obstacle ressort semé de
    points roses. Vu à l'œil sur un rendu de contrôle, pas à la relecture.

⚠⚠ ON RABAT DONC SUR LE MAGENTA PUR CE QUI EST À MOINS DE `RAYON_CLE` DE LA CLÉ
MESURÉE, ET RIEN D'AUTRE. La clé se lit sur une bande de huit pixels au pourtour
de la planche, par MÉDIANE — une moyenne se laisserait tirer par un coin mangé
par le dessin. Après quoi la chaîne canonique reçoit une planche à clé pure et
n'a plus rien de particulier à savoir : **ni `est_fond`, ni `recadrer`, ni
`conditionner` ne sont touchés**, et le vérificateur le prouve en rejouant les
douze autres outils à l'octet.

⚠⚠ `RAYON_CLE = 80`, ET LES DEUX VOISINES SONT MESURÉES ET ÉCARTÉES. Points
roses résiduels dans le sujet, somme sur les sept planches : **r = 60 → 24 886 ;
r = 80 → 6 337 ; r = 100 → 2 421**. Mais à 100 la clé mange l'ART : le cerne
violet foncé du quartz est à 94,2 de sa propre clé, si bien que le sujet du
quartz tombe de 296 240 à 289 456 pixels, **−2,3 %**, et le cerne se troue. À 80
il ne perd que 0,24 %. C'est la dernière valeur avant que le nettoyage ne se
paie en dessin.

⚠⚠ ET L'ÉROSION EST LE MAUVAIS LEVIER, MESURÉ AUSSI — C'ÉTAIT LE PREMIER
ESSAI. `conditionner` érode le masque de sujet de trois pixels pour manger la
frange ; trois pixels d'une planche de 1 254 réduite à 128 valent **trois
dixièmes de pixel de sortie**. La porter à un pixel de sortie (huit) puis deux
(seize) ne retire AUCUN point rose — ils ne touchent pas la frange, ils sont
enfermés dans le dessin — et coûte **26 % puis 61 % des pixels opaques du
quartz**, dont son cerne entier. L'érosion reste donc au défaut de la maison.

⚠⚠ `fourre_sec_a` EST ÉCARTÉE, ET C'EST LA SOURCE QUI EST EN CAUSE, PAS L'OUTIL.
Sa clé a bavé DANS le dessin au rendu : l'ombre de ses branches n'est pas brune
mais MARRON-VIOLET, et des pixels franchement magenta sont posés sur les
rameaux eux-mêmes. Regardée au pixel près, à côté de `fourre_sec_b` qui est
nette. Aucun filtre ne rend du brun à partir du marron-violet sans inventer de
la couleur : le fourré ressortait rose, c'est-à-dire **plus faux que l'ancien**,
que la quantification rabattait par accident sur la rampe kaki. Elle reste au
dépôt et redevient `dormante` ; `obs_infanterie` se produit donc comme les deux
champs, d'une planche et de son miroir. Une ligne à remettre le jour où Ethan
en refait un rendu propre.

⚠⚠ DEUX SPRITES SUR DIX SONT DES MIROIRS DANS L'ART DU DÉPÔT, ET C'EST RELEVÉ,
PAS DÉCIDÉ. `champ_quartz_b` est le miroir horizontal EXACT de `champ_quartz_a`
dans les sprites commités, et `champ_scorie_b` de `champ_scorie_a` : vérifié
pixel par pixel sur les deux grilles. C'est cette règle-là qu'`obs_infanterie`
reprend faute de seconde planche saine ; `obs_les_deux` et `obs_vehicule`, eux,
gardent leurs deux vrais dessins.

⚠ LE MIROIR SE PREND SUR LE SPRITE, PAS SUR LA PLANCHE. Retourner la source puis
la réduire donnerait un `b` qui n'est plus rigoureusement le miroir de `a`, le
filtre LANCZOS n'étant pas symétrique au pixel près sur un côté pair. Retourner
la sortie est exact — même argument que les rotations de `tools/limites.py`.

⚠ L'EMPRISE SE LIT SUR CE QUI EST AU DÉPÔT, ELLE NE SE CHOISIT PAS. Les dix
sprites commités occupent **112 pixels de 128** et **56 de 64**, centrés, soit
sept huitièmes et une marge d'un seizième de part et d'autre — mesuré sur les
dix, aux deux grilles. En unités de la grille 32 dont `recadrer` se sert, cela
fait 28. Choisir autre chose aurait fait grandir ou maigrir tous les champs de
toutes les bases pour une raison qui n'est pas dans le message d'Ethan.

⚠⚠ LES COULEURS DU JEU CHANGENT, ET C'EST LA CONSÉQUENCE À LIRE EN FACE. La
vieille chaîne ne faisait pas que quantifier : elle REPEIGNAIT sur les quatorze
teintes de `cond.py`. Le quartz d'Ethan est VIOLET et ressortait bleu-gris pâle ;
sa scorie est NOIRE À VEINES ORANGE et ressortait violet sombre à veines ambre.
Le nouveau modèle ne repeint rien — c'est sa définition —, donc les champs
reprennent la couleur de leurs planches. `FICHE-STYLE.md` réserve `#9FB3C5` et
`#C1CEDA` au quartz et `#382E47` à la scorie ; ces trois teintes-là décrivaient
le rendu de l'ancienne moulinette, pas le dessin d'Ethan. C'est son art et il
fait foi sur ce qu'il dessine — mais le code couleur des ressources n'est plus
celui qu'il était, et personne ne l'a arbitré de face.

    python3 tools/terrain.py
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cond import est_fond  # noqa: E402
from final128 import conditionner, ecrire, pal, recadrer  # noqa: E402

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = os.path.join(RACINE, 'art', 'sources')

# Les deux grilles que `tools/atlas.py` coud, dans l'ordre de la chaîne.
GRILLES = (128, 64)

# L'emprise du dessin, en unités de la grille 32 dont `recadrer` se sert :
# 28 / 32 = 7 / 8, donc 112 sur 128 et 56 sur 64. Relevé sur les dix sprites
# commités, pas choisi.
EMPRISE32 = 28

# La largeur de la bande, au pourtour de la planche, sur laquelle la clé se
# mesure. Huit pixels sur 1 254 : assez pour une médiane franche, assez peu
# pour qu'aucun dessin de cette série n'y morde — la plus faible marge mesurée
# vaut 164.
BANDE_DE_CLE = 8

# Le rayon autour de la clé mesurée en deçà duquel un pixel EST du fond. 80, et
# les deux voisines sont écartées à la mesure : voir l'en-tête.
RAYON_CLE = 80

# La marge minimale entre le sujet et le bord de sa planche, en pixels de la
# source. La plus faible mesurée vaut 164 ; la borne est au vingtième.
MARGE_MIN = 64

# ⚠ LE NOM DU SPRITE À GAUCHE, CELUI DE LA PLANCHE À DROITE, ET ILS NE SE
# RESSEMBLENT PAS. Ethan nomme ses sources par ce qu'elles DESSINENT — des
# cristaux, des braises, un chaos rocheux, un fourré sec, une nappe de pétrole ;
# le dépôt nomme ses sprites par ce qu'ils FONT — un champ de quartz, un
# obstacle qui ralentit l'infanterie. Les deux vocabulaires sont justes, et
# c'est cette table qui les apparie. L'appariement a été relevé à l'œil sur les
# dix sprites commités et leurs planches : la corrélation de luminance n'a rien
# rendu de concluant, la vieille quantification écrasant trop.
#
# ⚠ UNE SEULE PLANCHE VEUT DIRE « ET SON MIROIR », deux planches veulent dire
# deux dessins. C'est l'art du dépôt, mesuré, pas une règle qu'on impose.
PLANCHES = {
    'champ_quartz':   ['champ_quartz_cristaux.png'],
    'champ_scorie':   ['champ_scorie_braises.png'],
    # ⚠ `fourre_sec_a.png` EST ÉCARTÉE : sa clé a bavé dans le dessin au rendu.
    # Voir l'en-tête. Elle reste au dépôt, et `dormante`.
    'obs_infanterie': ['fourre_sec_b.png'],
    'obs_les_deux':   ['chaos_rocheux_a.png', 'chaos_rocheux_b.png'],
    'obs_vehicule':   ['nappe_petrole_a.png', 'nappe_petrole_b.png'],
}


def cle_de_la_planche(rgb):
    """La teinte du fond, lue au pourtour, PAR MÉDIANE.

    ⚠ MÉDIANE ET NON MOYENNE. Un dessin qui déborderait sur la bande tirerait la
    moyenne vers sa propre couleur et déplacerait la clé de tout le monde ; la
    médiane ne bouge pas tant que la moitié de la bande est du fond.
    """
    b = BANDE_DE_CLE
    bande = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3),
                            rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    return np.median(bande.astype(np.int32), 0)


def normaliser_la_cle(chemin):
    """Rabat la clé bruitée de la planche sur le magenta pur qu'attend la chaîne.

    ⚠⚠ C'EST LE SEUL GESTE PROPRE À CETTE FAMILLE, ET IL EST EN AMONT DE TOUT.
    Une fois la clé pure, `recadrer` cadre juste et `conditionner` détoure juste,
    sans qu'aucune de leurs portes n'ait à être desserrée pour l'occasion —
    desserrer `est_fond` aurait déplacé les cellules de trois autres outils, qui
    s'en servent pour DÉCOUPER leurs planches.

    ⚠ CE QUI EST RABATTU EST PEINT, PAS EFFACÉ. Le pixel devient `#FF00FF`
    opaque, exactement ce que `recadrer` peint déjà dans les marges de sa boîte :
    la planche reste une planche, et rien en aval n'a à connaître ce geste.
    """
    rgb = np.array(Image.open(chemin).convert('RGB')).astype(np.int32)
    cle = cle_de_la_planche(rgb)
    d = ((rgb - cle) ** 2).sum(-1)
    out = rgb.copy()
    out[d < RAYON_CLE * RAYON_CLE] = (255, 0, 255)
    return Image.fromarray(out.astype(np.uint8), 'RGB')


def assert_marge(im, planche):
    """Le sujet touche-t-il le bord de sa planche ? Alors ce n'est pas le sujet.

    ⚠⚠ C'EST LA GARDE DE LA NORMALISATION, ET ELLE MESURE LA FAUTE QUI S'EST
    PRODUITE. Une planche de cette série porte UN dessin centré, avec du fond
    tout autour ; quand le cadrage se met à toucher le bord, c'est qu'il a
    attrapé du fond, et `recadrer` calcule alors une boîte trop grande — le
    dessin ressort décentré et rapetissé, sans qu'aucune erreur ne soit levée.
    Vu sur `fourre_sec_b` avant normalisation : marge 0, côté 1 061 au lieu de
    802. Après : marge 193.

    ⚠ ELLE PORTE SUR LES SEPT PLANCHES, PAS SUR CELLE QUI A FAUTÉ. Une garde qui
    ne regarderait que `fourre_sec_b` ne dirait pas si le rayon qu'on impose
    convient aux six autres, c'est-à-dire exactement ce qu'on veut savoir.
    Marges mesurées après normalisation : 164, 166, 177, 193, 213, 219, 251,
    256 pixels.
    """
    a = np.array(im.convert('RGBA'))
    m = (~est_fond(a[..., :3])) & (a[..., 3] >= 128)
    ys, xs = np.where(m)
    assert len(xs), f'{planche} : aucun sujet après normalisation de la clé'
    h, w = m.shape
    marge = int(min(xs.min(), ys.min(), w - 1 - xs.max(), h - 1 - ys.max()))
    assert marge >= MARGE_MIN, (
        f'{planche} : le sujet passe à {marge} pixels du bord de la planche '
        f'(minimum {MARGE_MIN}) — du fond est pris pour du dessin, et le cadrage '
        f'sortira décentré. Relever RAYON_CLE, ou nettoyer la planche.')


def main():
    from chemins import dossier_sprites
    dst = dossier_sprites('terrain')
    for cote in GRILLES:
        os.makedirs(os.path.join(dst, str(cote)), exist_ok=True)

    # ⚠ LA PALETTE NE PEINT RIEN ICI, ET IL FAUT LE SAVOIR. Depuis le lot
    # PIXELS, `ecrire` à qui l'on donne la MATIÈRE réduit la source par filtre
    # et ne regarde plus la grille d'indices : `P` ne sert qu'à `conditionner`,
    # dont la sortie `g` n'est plus lue que pour sa taille. Elle reste dans la
    # signature parce que c'est le chemin canonique des neuf autres familles, et
    # qu'en sortir pour celle-ci ferait un dixième chemin.
    P = pal(False)

    ecrits = 0
    for prefixe, planches in PLANCHES.items():
        propres = [normaliser_la_cle(os.path.join(SOURCES, p)) for p in planches]
        for im, planche in zip(propres, planches):
            assert_marge(im, planche)
        for cote in GRILLES:
            rendus = {}
            for i, im in enumerate(propres):
                cell = recadrer(im, EMPRISE32 * (cote // 32), cote)
                g, matiere = conditionner(cell, P, cote)
                lettre = 'ab'[i]
                chemin = os.path.join(dst, str(cote), f'{prefixe}_{lettre}.png')
                ecrire(g, P, chemin, matiere)
                rendus[lettre] = chemin
                ecrits += 1
            if len(propres) == 1:
                # ⚠ LE MIROIR EST EXACT, ET IL EST PRIS SUR LA SORTIE. Voir
                # l'en-tête : retourner la planche AVANT la réduction donnerait
                # un `b` qui n'est plus rigoureusement le miroir de `a`.
                a = np.array(Image.open(rendus['a']).convert('RGBA'))
                chemin = os.path.join(dst, str(cote), f'{prefixe}_b.png')
                Image.fromarray(a[:, ::-1], 'RGBA').save(chemin)
                ecrits += 1
    print(f'terrain : {ecrits} fichiers écrits dans {dst}')


if __name__ == '__main__':
    main()
