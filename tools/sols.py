#!/usr/bin/env python3
"""Le sol de la carte du monde : vingt-deux planches, à peine touchées.

⚠⚠ CE QUE CET OUTIL NE FAIT PAS EST PLUS IMPORTANT QUE CE QU'IL FAIT. Ethan,
05/09 : « je viens de t'envoyer 8 planches de terrain satellite pour la carte du
monde […] tu fais le moins de traitement possible ». Il ne quantifie pas, ne
repeint pas, ne détoure pas, ne recolorise pas : les planches sortent telles
qu'Ethan les a rendues, à trois choses près — la mise au côté commun,
l'alignement des moyennes ci-dessous, et l'encodage WebP.

---------------------------------------------------------------------------
⚠⚠ VINGT-DEUX PLANCHES DEPUIS LE LOT SOL-OUVRAGE, ET DEUX AXES SÉPARÉS
---------------------------------------------------------------------------

Le sol cesse d'être uniforme : le bas de la carte reste le désert d'Ethan, le
haut devient l'Ouvrage, et entre les deux la bascule se fait par PLAQUES sans
jamais dessiner de ligne. Ce qui le permet tient en une phrase, et elle commande
tout cet outil :

    la COULEUR du sol ne dépend que de la RANGÉE,
    le MOTIF du sol ne dépend que du BLOC.

La couleur est une translation par canal, peinte en dégradé vertical par
`ui/monde.js` sur la dalle finie ; le motif est le tirage de famille de
`render/terrain.js`. Comme la couleur ne dépend que de `y`, deux pixels voisins
ont presque la même teinte à toutes les échelles et sur toutes les dalles :
**aucune frontière de couleur ne peut apparaître.**

⚠⚠ LA VOIE ÉVIDENTE A ÉTÉ ESSAYÉE ET ELLE EST INUTILISABLE — faire porter la
couleur par la FAMILLE, un bloc étant ocre ou violet. Les deux références sont à
69 niveaux l'une de l'autre sur le rouge et le fondu ne fait que 72 pixels
source : la bascule ressort **en escalier de rectangles orange et violets**, qui
se lit comme une tilemap cassée. La méthode ne tient qu'entre familles qui
partagent une palette.

---------------------------------------------------------------------------
⚠⚠ TOUT S'ALIGNE SUR LE REPÈRE OCRE, LES QUATORZE NEUVES COMPRISES
---------------------------------------------------------------------------

`REFERENCE` est la moyenne des huit planches du désert, `[198,79 · 144,16 ·
124,88]`, et elle ne bouge pas d'un millième. C'est ce qui rend les deux bouts de
la carte exacts d'un seul coup :

  - en bas la teinte vaut zéro, donc les huit ocres se peignent telles qu'elles
    sont stockées ;
  - en haut elle vaut un, donc les quatorze neuves — stockées à
    `art + (ocre − violet)` — retombent EXACTEMENT sur la référence violette
    `[129,75 · 123,08 · 140,57]` qu'Ethan a rendue.

⚠ NE PAS RECALCULER LA RÉFÉRENCE COMME LA MOYENNE DES VINGT-DEUX. Elle
déplacerait le sol du bas, qu'Ethan veut intact, de trente niveaux vers le
violet — c'est-à-dire qu'elle rendrait le désert mauve pour que l'Ouvrage soit
un peu moins violet. La référence est un REPÈRE DE STOCKAGE, pas une moyenne de
ce que ce fichier contient, et le manifeste le dit.

⚠ C'EST UNE TRANSLATION, PAS UNE NORMALISATION. On ajoute une constante par
canal et par planche — la différence entre sa moyenne et la référence — et rien
d'autre. Aucun gain, aucune courbe, aucun contraste touché. Égaliser les
ÉCARTS-TYPES aurait été l'autre geste, et il reste écarté : les planches n'ont
pas le même contraste parce qu'elles ne dessinent pas la même chose.

---------------------------------------------------------------------------
⚠⚠ LE CÔTÉ TOMBE À 704, ET C'EST LA BORNE DE TAILLE QUI L'A DÉSIGNÉ
---------------------------------------------------------------------------

`COTE` est une constante UNIQUE pour tout le pavage : la grille a un seul pas,
et un bloc plus petit que son emplacement laisserait un trou où `Σw` cesserait
de valoir 1. Les vingt-deux sortent donc au même côté.

Mesuré ici, poids base64 des vingt-deux contre un budget de **2 877 836 octets**
— soit `9 300 000 − (8 654 436 − 2 232 272)`, la borne moins ce que le livrable
pèse sans son sol :

    768 / q75 → 3 221 880 o   marge **−344 044**   ✗
    704 / q75 → 2 698 456 o   marge **+179 380**   ← retenu
    704 / q70 → 2 520 244 o   marge  +357 592
    640 / q75 → 2 209 176 o   marge  +668 660
    640 / q70 → 2 063 788 o   marge  +814 048

704 est le plus grand côté qui laisse plus de 150 000 octets, et q75 garde la
qualité d'aujourd'hui. 768 dépasse la borne de 344 044 octets.

⚠ LES HUIT OCRES PASSENT DE 1254 À 704 PAR RECADRAGE CENTRÉ, PAS PAR RÉDUCTION.
Un recadrage ne rééchantillonne rien : ce qu'Ethan voit en bas reste pixel pour
pixel le sol d'aujourd'hui. Une réduction, elle, changerait l'échelle apparente
du désert. Les quatorze neuves passent de 1024 à 704 par réduction Lanczos —
réduire est permis, agrandir ne l'est pas, et aucun côté au-dessus de 1024 n'est
donc recevable.

⚠⚠ ET LE 1:1 N'EST PAS PERDU — LE COMMENTAIRE QUI DISAIT LE CONTRAIRE EST
CORRIGÉ. Il affirmait que « réduire les planches rendrait un flou permanent » au
cran le plus serré. C'est vrai d'une réduction qui garde la COUVERTURE : 1 254 px
ramenés à 704 sur 4,9 cases donneraient 143 pixels source par case contre 256
physiques, donc un agrandissement. Ici la couverture rétrécit AVEC la planche —
704 px sur 2,75 cases font toujours `PIXELS_SOURCE_PAR_CASE = 256` — et au cran
256 la taille de bloc EST le côté, donc `solsALaTaille` rend l'image brute et le
sol tombe au 1:1 comme avant. Ce qui change n'est pas la netteté, c'est le TAUX
DE RÉPÉTITION : une planche couvre 2,75 cases au lieu de 4,9. Vingt-deux dessins
contre huit le compensent largement.

⚠ ET LE RECADRAGE VIENT AVANT L'ALIGNEMENT, LA RÉDUCTION AUSSI. La moyenne qui
compte est celle de l'image FINALE, celle que le joueur a sous les yeux ; aligner
d'abord laisserait le recadrage déplacer la moyenne ensuite. Mesuré, c'est loin
d'être théorique : le centre de `sol_carte_1` est **plus clair de 8 à 9 niveaux**
que la planche entière, donc l'aligner sur sa moyenne d'ensemble la ferait
ressortir en tache — le défaut exact que l'alignement existe pour supprimer — et
ferait tomber `SOL T11`, qui exige que chaque moyenne tombe à moins d'un niveau
de la référence.

---------------------------------------------------------------------------
⚠⚠ LE PLANCHER DE STOCKAGE, ET POURQUOI IL N'EST PAS COSMÉTIQUE
---------------------------------------------------------------------------

`ui/monde.js` peint la bascule en deux passes, et la première est une
SOUSTRACTION obtenue par `difference`, qui rend `|d − s|`. Elle n'est exacte que
si le sol reste au-dessus de ce qu'on lui retire — au plus 69 sur le rouge et 21
sur le vert, entiers. En dessous, le pixel BRILLE au lieu de s'assombrir.

⚠⚠ ET LA MESURE EN PLEINE RÉSOLUTION NE SUFFIT PAS À LE GARANTIR. Sur les
quatorze planches alignées en 1024, les minimums valent `[71 · 21 · 0]` : la
soustraction passe, à un cheveu sur le vert. Après la réduction Lanczos — dont le
rebond descend sous la source — et après l'encodage WebP, ils tombent à
`[69 · 16 · 0]` : **le vert se replierait de 5 niveaux.** Les deux gestes sont
prescrits par ce lot-ci, donc ce n'est pas une planche future qui poserait le
problème, c'est la chaîne elle-même.

D'où un PLANCHER posé au stockage, après l'alignement et avant l'encodage.
Mesuré, en pixels modifiés sur les 6 938 624 des quatorze, et en minimums relevés
APRÈS encodage :

    sans plancher   0 px   →  vert < 21 : 3 pixels (min 16)
    [69, 21, 0]     1 px   →  vert < 21 : 3 pixels (min 16)
    [74, 26, 0]     4 px   →  vert < 21 : 1 pixel  (min 16)
    [80, 32, 0]    11 px   →  vert < 21 : **0**    (min 26)

`[80, 32, 0]` est donc retenu : il coûte **onze pixels sur 6,9 millions,
0,000159 %** — deux mille fois moins que l'écrêtage du haut, qui est du même
geste par l'autre bout et que ce fichier accepte depuis toujours — et il rend la
soustraction exacte PAR CONSTRUCTION, avec dix niveaux de marge sur le rouge et
cinq sur le vert.

⚠ IL NE TOUCHE PAS UN PIXEL DES HUIT OCRES, et c'est mesuré : leur minimum vaut
`[105 · 56 · 37]`, très au-dessus. Le sol du bas est donc rigoureusement celui
d'aujourd'hui.

⚠ ET LE BLEU N'A PAS DE PLANCHER, parce qu'il n'est jamais soustrait : il est
AJOUTÉ par la seconde passe, en `lighter`, qui sature à 255. Son minimum de 0 est
sans objet.

---------------------------------------------------------------------------
⚠ L'ÉCRÊTAGE DU HAUT EST MESURÉ ET IL EST ACCEPTÉ
---------------------------------------------------------------------------

Translater les quatorze de +69 sur le rouge écrête leurs hautes lumières :
**0,354 % de leurs pixels, 0,226 % des vingt-deux**, dans les blancs du blindage.
Les huit ocres, elles, n'écrêtent rien (0,0003 %) : elles sont déjà à leur
repère. Le manifeste porte le relevé.
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('sol')

METHODE = 6
QUALITE = 75

# Le côté commun des vingt-deux planches, en pixels source. ⚠ IL EST UNIQUE POUR
# TOUT LE PAVAGE : `src/render/terrain.js` porte le même nombre sous
# `COTE_SOURCE`, et un test les confronte au manifeste.
COTE = 704

# ⚠ LE PLANCHER DE STOCKAGE, par canal — voir l'en-tête. Il garantit que la
# soustraction de `ui/monde.js` ne se replie nulle part, APRÈS encodage.
PLANCHER = np.array([80, 32, 0], dtype=np.uint8)

# Les quatre familles, dans l'ordre. ⚠⚠ L'ORDRE EST LE NOM, ET IL L'EST DEUX
# FOIS : le hachage tire un rang DANS une famille, et les familles sont
# concaténées dans cet ordre-ci pour former la liste que `ui/monde.js` indexe par
# entier. `src/render/terrain.js` porte la même liste sous `FAMILLES`, et un test
# les confronte. Réordonner l'une ou l'autre rebattrait le sol de toutes les
# cartes de toutes les graines.
#
# ⚠ L'OCRE VIENT EN PREMIER, ET CE N'EST PAS UN DÉTAIL : ses huit planches
# gardent les rangs 0 à 7, donc `h % 8` vaut `h & 7` comme avant le lot, donc le
# bas de la carte tire exactement les dessins qu'il tirait.
FAMILLES = [
    ('ocre', [f'sol_carte_{i}.png' for i in range(1, 9)]),
    ('naturel', [f'sol_ouvrage_naturel_{i}.png' for i in range(1, 8)]),
    ('hybride', [f'sol_ouvrage_hybride_{i}.png' for i in range(1, 4)]),
    ('artificiel', [f'sol_ouvrage_artificiel_{i}.png' for i in range(1, 5)]),
]

# ⚠ LES HUIT OCRES SE RECADRENT, LES QUATORZE NEUVES SE RÉDUISENT. Voir
# l'en-tête : un recadrage ne rééchantillonne rien, et c'est ce qui garde le sol
# du bas pixel pour pixel.
RECADREES = {'ocre'}

COMMENTAIRE = (
    'FICHIER GÉNÉRÉ par « python3 tools/sols.py ». Les planches sont en WebP et '
    'Node n\'a pas de décodeur WebP ; ce manifeste est ce que la suite JS peut '
    'encore mesurer sur elles — au premier chef leur CÔTÉ, dont '
    'src/render/terrain.js dérive la géométrie de son pavage, la correction '
    'de moyenne appliquée à chacune, la CLARTÉ du sol contre laquelle '
    'test/limite.test.js calibre les frontières de territoire, et depuis le '
    '08/09 la translation ocre → violet que ui/monde.js peint et les minimums '
    'par canal qui rendent sa soustraction exacte. Même motif que '
    'art/sprites/fond/fond-empreintes.json.'
)

REPERE = (
    'reference est un REPÈRE DE STOCKAGE, pas la moyenne des vingt-deux : c\'est '
    'la moyenne des HUIT planches ocres seules, inchangée depuis le lot '
    'SOL-SATELLITE. Les quatorze planches de l\'Ouvrage y sont alignées elles '
    'aussi, et ui/monde.js les ramène à delta près sur leur référence violette '
    'au rendu. La recalculer sur les vingt-deux déplacerait le sol du bas, '
    'qu\'Ethan veut intact.'
)

# Les quantiles de clarté relevés sur le sol ATTEIGNABLE, en L* CIE.
#
# ⚠⚠ ILS ENTRENT AU MANIFESTE PARCE QUE LA FRONTIÈRE SE CALIBRE DESSUS.
# `test/limite.test.js` exige que chaque ton de frontière soit à huit clartés au
# moins du sol, et il lit ces nombres-ci.
#
# ⚠⚠ ET ON NE LES MESURE PAS SUR L'UNION BRUTE DES VINGT-DEUX — lot SOL-OUVRAGE.
# Une planche ocre n'est JAMAIS vue à teinte pleine, et une planche artificielle
# n'est jamais vue à teinte nulle : mesurer les vingt-deux telles qu'elles sont
# stockées décrirait un sol qui n'existe nulle part sur la carte, et ouvrirait la
# bande de clarté des deux côtés pour rien. On mesure donc chaque famille SUR
# L'INTERVALLE DE TEINTE OÙ ELLE PEUT APPARAÎTRE, bornes comprises.
QUANTILES = (1, 5, 50, 95, 99)


def clarte(rvb):
    """La clarté L* CIE d'un tableau de pixels sRGB. Sert à MESURER, pas à peindre."""
    a = np.asarray(rvb, dtype=np.float64) / 255.0
    a = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    f = np.where(y > 0.008856, np.cbrt(y), 7.787 * y + 16 / 116)
    return 116 * f - 16


def au_cote(nom, famille):
    """La planche ramenée au côté commun : recadrée si ocre, réduite sinon."""
    a = np.asarray(Image.open(os.path.join(SRC, nom)).convert('RGB'), dtype=np.float64)
    if famille in RECADREES:
        h, w = a.shape[:2]
        if h < COTE or w < COTE:
            raise SystemExit(f'{nom} : {w}x{h} est plus petit que {COTE}, rien à recadrer')
        y, x = (h - COTE) // 2, (w - COTE) // 2
        return a[y:y + COTE, x:x + COTE]
    h, w = a.shape[:2]
    if h < COTE or w < COTE:
        raise SystemExit(f'{nom} : {w}x{h} est plus petit que {COTE} — on ne '
                         f'grossit jamais une source (acquis du 30/08)')
    im = Image.fromarray(np.rint(a).astype(np.uint8)).resize((COTE, COTE), Image.LANCZOS)
    return np.asarray(im, dtype=np.float64)


def bornes_de_teinte(famille, parts):
    """L'intervalle de teinte où une famille peut être vue, bornes comprises.

    ⚠ IL SE DÉRIVE DES PARTS, IL NE S'ÉCRIT PAS. Une famille apparaît là où sa
    part cumulée est non nulle ; on balaie donc les rangées de la carte, on
    retient celles où elle peut sortir, et on prend le minimum et le maximum de
    la teinte sur cet ensemble-là. Écrire « l'ocre va de 0 à 0,35 » ferait un
    second calibrage à côté de celui de `src/data/sites.js`, et la première
    retouche des seuils en rendrait un faux.
    """
    pivot, largeur_f, largeur_t = parts['pivot'], parts['familles'], parts['teinte']
    basses, hautes = [], []
    for rangee in range(1, parts['hauteur'] + 1):
        p = min(1.0, max(0.0, (pivot - rangee) / largeur_f))
        c1 = min(1.0, max(0.0, (p - 0.0) / 0.65))
        c2 = min(1.0, max(0.0, (p - 0.25) / 0.55))
        c3 = min(1.0, max(0.0, (p - 0.50) / 0.50))
        # la part de la famille elle-même, et non sa part cumulée
        possible = {'ocre': 1 - c1, 'naturel': c1 - c2,
                    'hybride': c2 - c3, 'artificiel': c3}[famille] > 0
        if possible:
            t = min(1.0, max(0.0, (pivot - rangee) / largeur_t))
            basses.append(t)
            hautes.append(t)
    if not basses:
        raise SystemExit(f'{famille} : aucune rangée ne peut la faire apparaître')
    return min(basses), max(hautes)


def main():
    os.makedirs(DST, exist_ok=True)

    # ⚠⚠ LA RÉFÉRENCE SE LIT SUR LES HUIT PLANCHES ENTIÈRES, PAS SUR LEUR CENTRE,
    # ET C'EST CE QUI LA REND INCHANGÉE DEPUIS LE LOT SOL-SATELLITE. La calculer
    # sur les recadrées la déplacerait de **1,2 niveau** — mesuré, le centre des
    # huit est un peu plus clair que leur ensemble —, donc déplacerait le sol du
    # bas ET la translation ocre → violet avec lui, pour une raison qui n'est pas
    # une décision : le côté retenu au §4.2. Le repère ne doit dépendre que de
    # l'art, jamais de la taille à laquelle on le range.
    ocres = [(nom, au_cote(nom, 'ocre')) for _, noms in FAMILLES[:1] for nom in noms]
    reference = np.mean([
        np.asarray(Image.open(os.path.join(SRC, nom)).convert('RGB'),
                   dtype=np.float64).reshape(-1, 3).mean(axis=0)
        for _, noms in FAMILLES[:1] for nom in noms], axis=0)
    print('  repère de stockage (moyenne des 8 ocres entières) RVB %s'
          % np.round(reference, 4).tolist())

    empreintes = {}
    alignees = {}
    ecretes = {}
    ecr_bruts, tot_bruts = {}, {}
    for famille, noms in FAMILLES:
        ecr, total = 0, 0
        for nom in noms:
            a = dict(ocres).get(nom)
            if a is None:
                a = au_cote(nom, famille)
            correction = reference - a.reshape(-1, 3).mean(axis=0)
            brut = a + correction
            ecr += int(((brut < 0) | (brut > 255)).sum())
            total += brut.size
            # ⚠ `rint`, PAS UNE TRONCATURE. `astype(uint8)` tronque vers zéro, ce
            # qui décalerait toute la planche d'un demi-niveau vers le sombre.
            aligne = np.rint(np.clip(brut, 0, 255)).astype(np.uint8)
            # ⚠ LE PLANCHER EN DERNIER, APRÈS l'alignement : posé avant, il serait
            # défait par la translation qui suit.
            avant = aligne
            aligne = np.maximum(aligne, PLANCHER)
            plancher_px = int((aligne != avant).any(axis=-1).sum())

            court = os.path.splitext(nom)[0]
            sortie = os.path.join(DST, court + '.webp')
            Image.fromarray(aligne).save(sortie, 'WEBP', quality=QUALITE, method=METHODE)
            octets = os.path.getsize(sortie)
            with open(sortie, 'rb') as f:
                sha = hashlib.sha256(f.read()).hexdigest()
            # ⚠⚠ LES MINIMUMS SE RELÈVENT SUR L'IMAGE RELUE, PAS SUR CE QU'ON VIENT
            # D'ÉCRIRE. L'encodage est AVEC PERTE : c'est lui qui recrée des pixels
            # sombres, et c'est ce qu'il rend que le joueur verra. Les mesurer sur
            # le tableau aligné annoncerait une marge que le fichier n'a pas.
            relu = np.asarray(Image.open(sortie).convert('RGB')).reshape(-1, 3)
            alignees.setdefault(famille, []).append(relu)
            empreintes[court] = {
                'famille': famille,
                'correction': [round(float(c), 4) for c in correction],
                'moyenne': [round(float(m), 4)
                            for m in aligne.reshape(-1, 3).mean(axis=0)],
                'minimum': [int(v) for v in relu.min(axis=0)],
                'plancherPixels': plancher_px,
                'hauteur': aligne.shape[0],
                'largeur': aligne.shape[1],
                'octets': octets,
                'qualite': QUALITE,
                'sha256': sha,
            }
            print('  %-28s %-11s %sx%s  correction %s  %d o'
                  % (court, famille, aligne.shape[1], aligne.shape[0],
                     np.round(correction, 2).tolist(), octets))
        ecretes[famille] = 100.0 * ecr / total
        ecr_bruts[famille], tot_bruts[famille] = ecr, total

    # --- la translation ocre → violet ---------------------------------------
    #
    # ⚠⚠ ELLE SE MESURE ICI, ELLE NE S'ÉCRIT PAS AU CODE. C'est la moyenne des
    # quatorze planches de l'Ouvrage TELLES QU'ETHAN LES A RENDUES, moins le
    # repère ocre : `src/render/terrain.js` en porte la copie sous
    # `DELTA_TEINTE`, et un test les confronte.
    violettes = []
    for famille, noms in FAMILLES[1:]:
        for nom in noms:
            violettes.append(au_cote(nom, famille).reshape(-1, 3).mean(axis=0))
    reference_violette = np.mean(violettes, axis=0)
    delta = reference_violette - reference
    print('  référence violette RVB %s' % np.round(reference_violette, 2).tolist())
    print('  delta ocre → violet    %s' % np.round(delta, 4).tolist())

    # --- la clarté du sol ATTEIGNABLE ---------------------------------------
    parts = {'pivot': 226, 'familles': 150, 'teinte': 130, 'hauteur': 300}
    echantillons = []
    portees = {}
    for famille, _ in FAMILLES:
        bas, haut = bornes_de_teinte(famille, parts)
        portees[famille] = [round(bas, 4), round(haut, 4)]
        pixels = np.concatenate(alignees[famille]).astype(np.float64)
        # ⚠ LES DEUX BORNES, ET CE QU'IL Y A ENTRE ELLES N'AJOUTE RIEN : la teinte
        # est une translation, donc monotone par canal, donc la clarté d'un pixel
        # est monotone en `t`. Les extrêmes de l'intervalle bornent l'image.
        for t in (bas, haut):
            v = pixels.copy()
            v[:, 0] -= round(-delta[0] * t)
            v[:, 1] -= round(-delta[1] * t)
            v[:, 2] += round(delta[2] * t)
            echantillons.append(clarte(np.clip(v, 0, 255)))
    L = np.concatenate(echantillons)
    clartes = {'p%d' % q: round(float(np.percentile(L, q)), 2) for q in QUANTILES}
    print('  clarté du sol atteignable : %s' % clartes)
    ecr_total = 100.0 * sum(ecr_bruts.values()) / sum(tot_bruts.values())
    print('  écrêtage : %s  — ensemble %.4f %%'
          % ({f: round(v, 4) for f, v in ecretes.items()}, ecr_total))
    if ecr_total > 1.0:
        raise SystemExit('écrêtage de %.4f %% : au-delà du pour-cent, on s\'arrête '
                         'et on le porte au rapport (BRIEF §4.1)' % ecr_total)

    minimums = {c: int(min(e['minimum'][c] for e in empreintes.values()))
                for c in range(3)}
    print('  minimums par canal, les 22 relues : %s'
          % [minimums[0], minimums[1], minimums[2]])

    with open(os.path.join(DST, 'sol-empreintes.json'), 'w', encoding='utf-8') as f:
        json.dump({'commentaire': COMMENTAIRE,
                   'repere': REPERE,
                   'clarte': clartes,
                   'cote': COTE,
                   'delta': [round(float(c), 4) for c in delta],
                   'ecretagePourCent': {f: round(v, 4) for f, v in ecretes.items()},
                   'ecretagePourCentTotal': round(ecr_total, 4),
                   'familles': [f for f, _ in FAMILLES],
                   'minimumParCanal': [minimums[0], minimums[1], minimums[2]],
                   'plancher': [int(v) for v in PLANCHER],
                   'porteeDeTeinte': portees,
                   'reference': [round(float(c), 4) for c in reference],
                   'referenceViolette': [round(float(c), 4) for c in reference_violette],
                   'sols': empreintes},
                  f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print('%d fichiers écrits' % len(empreintes))
    return 0


if __name__ == '__main__':
    sys.exit(main())
