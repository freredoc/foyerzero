#!/usr/bin/env python3
"""Les fonds d'écran : une image de décor, réduite au poids d'un livrable.

⚠⚠ POURQUOI UN OUTIL POUR UNE SEULE IMAGE. Le fond du bassin arrive en PNG de
**2 158 126 octets** — trois quarts du livrable entier à lui seul, et 2,8 Mo une
fois en base64. Le committer tel quel aurait été possible ; le committer SANS
outil aurait fait de lui une source déclarée de plus, c'est-à-dire un fichier
que personne ne sait reproduire le jour où la palette bouge. Il passe donc par
la chaîne, comme tout le reste.

⚠ CE N'EST PAS UN SPRITE, ET IL N'ENTRE DANS AUCUN ATLAS. Un atlas coud des
cellules CARRÉES d'un même côté ; un décor de 1149 × 1368 n'en est pas une. Il
voyage dans son propre marqueur de `tools/build.js`, comme les murs de contour
et les deux grosses bases de l'Ouvrage.

⚠⚠ ET IL EST EN WEBP, PAS EN PNG. Mesuré sur cette image : PNG optimisé
2 099 998 o, **WebP q85 164 578 o** — treize fois moins. C'est une photographie
de décor, pas du pixel art à teintes comptées : le PNG n'a rien à y gagner. Même
réglage que les atlas depuis le lot PIXELS, pour qu'il n'y ait qu'un encodage à
connaître dans le dépôt.

⚠⚠ ET LA QUALITÉ EST PAR ENTRÉE DEPUIS LE LOT MUR-PEINT, PARCE QU'UNE CONSTANTE
GLOBALE AURAIT RÉÉCRIT `fond_offense`. Les huit fonds de base entrent à **q75**
sur un arbitrage d'Ethan (voir plus bas) ; le bassin, lui, est au dépôt à q85
depuis le lot OFFENSE, et `tools/verifier.py` le compare À L'OCTET. Descendre
`QUALITE` de 85 à 75 aurait donc fait tomber le vérificateur sur un fichier que
ce lot ne touche pas, et changé le livrable pour rien. La qualité vit dans la
table, à côté du fond qu'elle encode.

⚠⚠ LE q75 DES HUIT EST UN ARBITRAGE DE BUDGET, PAS UN CHOIX DE CONFORT — et il
est mesuré. À q85, les huit pèsent 2 720 514 octets, soit 3 627 352 en base64 :
le HTML construit passait de 3 361 351 à **6 988 703 octets, 2,08 fois**, et le
brief du lot pose le doublement comme une condition d'arrêt qui revient à Ethan.
Les paliers lui ont été soumis, mesurés sur les huit : q80 → 1,83× · **q75 →
1,65×** · q70 → 1,60×, et la réduction de résolution → 1,73× à 810 px. Réponse :
q75, pleine résolution.

⚠ LA RÉSOLUTION NE BOUGE PAS, ET C'EST LA MOITIÉ DU CHOIX. Les huit font
1080 × 2160, soit exactement la largeur physique d'un téléphone à dpr 3 : le
fond y tombe au 1:1. Les réduire aurait rendu 5 828 763 octets pour un flou
permanent sur l'appareil d'Ethan — moins de marge que q75, pour plus cher à
l'œil. Confronté à 1:1 sur la zone la plus texturée des huit, q75 ne se
distingue pas de la source.

⚠⚠ LES TROIS DÉCORS LONGS ENTRENT À **q70**, ET C'EST UN ARBITRAGE DE BUDGET
MESURÉ — lot GRILLE LONGUE, 20/09/2026. Ils font 1080 × 3240, une fois et
demie la surface d'un court, pour les sept bases du bout de carte (grille
9 × 27). Pesés sur cette machine, sans redimensionnement, `method=6` : **q85 →
1 540 524 octets · q80 → 1 226 204 · q75 → 980 878 (1 307 840 en base64) ·
q70 → 918 518 (1 224 696) · q65 → 853 102**. À q75, les 1 307 840 octets de
base64 portaient le livrable à 10 687 089, soit **132 911 sous la borne
de 10 820 000 — SOUS le plancher de 150 000** que `PIC T7` exige ; à q70
le livrable pèse 10 603 945 et la marge vaut 216 055, et c'est le brief du
lot qui fixe q70.
⚠ Et q70 sur un long coûte ce que q75 coûte sur un court, PAR PIXEL : 306 k
octets en moyenne pour 1,5 fois la surface d'un court à 206 k — le prix
d'un décor suit sa surface, la qualité ne l'a pas rogné. Les HUIT courts
restent à q75 : les baisser réécrirait huit fichiers que ce lot ne touche
pas, et que `tools/verifier.py` compare à l'octet.

⚠ ET ILS NE SONT NI RECADRÉS NI REDIMENSIONNÉS, comme les huit : la
géométrie de `render/fond.js` est calée sur leurs 1080 × 3240 — dix cases de
large, trente de haut, `COTE_CASE_SOURCE = 108` vérifié sur les trois par
une grille de 108 px décalée de 54, qui longe la face intérieure des flancs
sur x = 54 et x = 1026 comme sur les courts.
"""
import hashlib
import json
import os
import sys

from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('fond')

METHODE = 6

# Un décor, sa source, le nom qu'il porte dans le livrable, et sa qualité.
#
# ⚠ LES ONZE FONDS DE BASE PORTENT LE MUR PEINT DANS L'IMAGE. C'est tout le lot
# MUR-PEINT : l'anneau de `render/contour.js` a disparu des deux écrans, et ce
# que le joueur voit du mur, il le voit ici. Ne pas les recadrer, ne pas les
# redimensionner — la géométrie de l'écran est calée sur leurs 1080 × 2160,
# et sur les 1080 × 3240 des trois longs (lot GRILLE LONGUE, 20/09/2026).
# ⚠ LES TROIS LONGS SONT À q70, LES HUIT COURTS À q75 — voir l'en-tête : le
# format se lit dans `FORMAT_DU_FOND` de `src/render/fond.js`, la qualité ici.
FONDS = [
    ('fond_offense_bassin.png', 'fond_offense', 85),
    ('base_fond_joueur_01.png', 'fond_j_01', 75),
    ('base_fond_joueur_02.png', 'fond_j_02', 75),
    ('base_fond_joueur_03.png', 'fond_j_03', 75),
    ('base_fond_joueur_04.png', 'fond_j_04', 75),
    ('base_fond_ouvrage_austere.png', 'fond_o_austere', 75),
    ('base_fond_ouvrage_hostile.png', 'fond_o_hostile', 75),
    ('base_fond_ouvrage_menacante.png', 'fond_o_menacante', 75),
    ('base_fond_ouvrage_oppressante.png', 'fond_o_oppressante', 75),
    ('base_fond_ouvrage_verrou_a.png', 'fond_o_verrou_a', 70),
    ('base_fond_ouvrage_verrou_b.png', 'fond_o_verrou_b', 70),
    ('base_fond_ouvrage_finale.png', 'fond_o_finale', 70),
]


COMMENTAIRE = (
    'FICHIER GÉNÉRÉ par « python3 tools/fonds.py ». Les fonds sont en WebP et '
    'Node n\'a pas de décodeur WebP ; ce manifeste est ce que la suite JS peut '
    'encore mesurer sur eux — au premier chef leurs DIMENSIONS, dont '
    'src/render/fond.js dérive le rectangle source de sa primitive. Même motif '
    'que art/sprites/bord/bord-empreintes.json depuis le lot MURS.'
)


def main():
    os.makedirs(DST, exist_ok=True)
    empreintes = {}
    n = 0
    for source, nom, qualite in FONDS:
        chemin = os.path.join(SRC, source)
        im = Image.open(chemin).convert('RGB')
        # ⚠ ON NE REDIMENSIONNE PAS. La feuille ROGNE le décor sur sa boîte
        # (`background-size: cover`) plutôt que de l'étirer ; réduire ici
        # figerait une taille d'écran que personne n'a mesurée.
        sortie = os.path.join(DST, nom + '.webp')
        im.save(sortie, 'WEBP', quality=qualite, method=METHODE)
        octets = os.path.getsize(sortie)
        with open(sortie, 'rb') as f:
            sha = hashlib.sha256(f.read()).hexdigest()
        empreintes[nom] = {
            'hauteur': im.size[1],
            'largeur': im.size[0],
            'octets': octets,
            'qualite': qualite,
            'sha256': sha,
        }
        print('  %-22s q%-3d %sx%s  %d o' % (nom, qualite, im.size[0], im.size[1], octets))
        n += 1

    # ⚠⚠ LE MANIFESTE EST CE QUI REND LE RECTANGLE SOURCE VÉRIFIABLE.
    # `render/` est pur : il ne lit aucun fichier, et `naturalWidth` n'existe
    # qu'une fois l'image décodée par un navigateur. `src/render/fond.js` porte
    # donc les dimensions en constantes, et un test les confronte À CE FICHIER —
    # il tombe au dépôt, pas chez le joueur.
    with open(os.path.join(DST, 'fond-empreintes.json'), 'w', encoding='utf-8') as f:
        json.dump({'commentaire': COMMENTAIRE, 'fonds': empreintes},
                  f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print('%d fichiers écrits' % n)
    return 0


if __name__ == '__main__':
    sys.exit(main())
