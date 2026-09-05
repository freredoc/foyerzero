#!/usr/bin/env python3
"""Le sol de la carte du monde : huit planches satellite, à peine touchées.

⚠⚠ CE QUE CET OUTIL NE FAIT PAS EST PLUS IMPORTANT QUE CE QU'IL FAIT. Ethan,
05/09 : « je viens de t'envoyer 8 planches de terrain satellite pour la carte du
monde […] tu fais le moins de traitement possible ». Il ne réduit pas, ne
recadre pas, ne quantifie pas, ne repeint pas, ne détoure pas — les huit
planches sortent à leurs 1254 × 1254 d'origine, pixel pour pixel, à deux choses
près : l'alignement des moyennes ci-dessous, et l'encodage WebP.

C'est l'inverse exact de ce que le sol de carte subissait jusqu'ici. Le fond
était une image INDEXÉE sur cinq teintes (`art/sprites/carte/atlas-terrain-64.png`),
accumulée par somme pondérée puis REQUANTIFIÉE sur une rampe de
`FICHE-STYLE.md` : de l'art d'Ethan, il ne restait à l'écran qu'un relief à cinq
niveaux de gris repeint. Le lot SOL-SATELLITE retire cette moulinette entière.

---------------------------------------------------------------------------
⚠⚠ L'ALIGNEMENT DES MOYENNES EST LE SEUL TRAITEMENT, ET IL EST MESURÉ
---------------------------------------------------------------------------

Les huit planches ne sont pas à la même clarté. Mesuré, luminance moyenne :

    1: 162,2 · 2: 160,0 · 3: 156,2 · 4: 155,4
    5: 154,0 · 6: 148,7 · 7: 153,9 · 8: 157,2

soit un écart de **13,5 sur 255 entre la plus claire et la plus sombre, 5,4 %**.
Le sol se pave par BLOCS d'une planche entière (voir `src/render/terrain.js`) :
cet écart-là se lit donc à l'écran comme des taches, un bloc sur huit ressortant
franchement gris-mauve à côté de ses voisins. Ce n'est pas une impression —
mesuré sur une vue large de 1 200 × 1 200 au cran 64, écart-type des moyennes
locales (fenêtre de 127 px, soit un demi-bloc à l'écran) :

    sans alignement **4,284** · avec alignement **2,509**, soit **−41 %**

pour **−3,5 % de contraste** (écart-type total 14,573 → 14,064). Le 2,509 qui
reste est la structure propre de l'art, pas un défaut de raccord.

⚠ C'EST UNE TRANSLATION, PAS UNE NORMALISATION. On ajoute une constante par
canal et par planche — la différence entre sa moyenne et la moyenne des huit —
et rien d'autre. Aucun gain, aucune courbe, aucun contraste touché : le grain,
les veines et les fractures sortent identiques. Égaliser les ÉCARTS-TYPES aurait
été l'autre geste, et il est écarté : les planches n'ont pas le même contraste
parce qu'elles ne dessinent pas la même chose — l'éboulis de la 6 est plus
heurté que la poussière de la 3 —, et l'aplatir aurait effacé ce qu'Ethan a
dessiné pour qu'elles ne se ressemblent pas.

⚠ LA MOYENNE DE RÉFÉRENCE EST CELLE DES HUIT, PAS CELLE D'UNE PLANCHE ÉLUE.
`[198,7 · 144,2 · 124,9]`. Prendre la première comme étalon aurait éclairci les
sept autres de 5 unités pour rien ; la moyenne des huit déplace chacune du
minimum nécessaire, et le sol garde la clarté d'ensemble qu'Ethan a rendue.

---------------------------------------------------------------------------
⚠ q75, PLEINE RÉSOLUTION — LE MÊME RÉGLAGE QUE LES HUIT DÉCORS DE BASE
---------------------------------------------------------------------------

Mesuré sur les huit, poids WebP puis base64, et PSNR médian contre la source :

    q85 → 3 660 040 o de base64, 37,4 dB
    q80 → 2 840 884 o, 35,9 dB
    q75 → **2 229 936 o**, 34,7 dB
    q70 → 2 062 264 o, 34,3 dB

Confronté à 1:1 sur la zone la plus texturée de la planche 6 — la plus heurtée
des huit —, q75 ne se distingue pas de la source ; et le sol de la carte est la
SEULE image du jeu qui soit presque toujours affichée RÉDUITE, trois crans de
zoom sur quatre. Descendre à q70 rendrait 167 672 octets de plus pour 0,4 dB,
c'est-à-dire pas assez pour valoir une seconde qualité dans le dépôt.

⚠ ET LA RÉSOLUTION NE BOUGE PAS. Une case de carte vaut `PIXELS_SOURCE_PAR_CASE`
= 256 pixels source, et le cran le plus serré vaut 256 pixels physiques : le sol
y tombe au **1:1**. Réduire les planches rendrait un flou permanent à ce cran-là
pour économiser des octets sur la seule image que le joueur regarde en fond de
tous ses gestes de carte. Même arbitrage que `tools/fonds.py`, pour la même
raison.
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

# Les huit planches, dans l'ordre où Ethan les a envoyées. ⚠ L'ORDRE EST LE
# NOM : `src/render/terrain.js` tire un numéro de bloc entre 1 et 8 et n'a que
# celui-là pour désigner un dessin. Réordonner cette liste rebattrait toutes les
# cartes de toutes les graines — ce n'est pas un défaut, mais il faut le vouloir.
PLANCHES = [f'sol_carte_{i}.png' for i in range(1, 9)]


COMMENTAIRE = (
    'FICHIER GÉNÉRÉ par « python3 tools/sols.py ». Les planches sont en WebP et '
    'Node n\'a pas de décodeur WebP ; ce manifeste est ce que la suite JS peut '
    'encore mesurer sur elles — au premier chef leur CÔTÉ, dont '
    'src/render/terrain.js dérive la géométrie de son pavage, et la correction '
    'de moyenne appliquée à chacune. Même motif que '
    'art/sprites/fond/fond-empreintes.json.'
)


def main():
    os.makedirs(DST, exist_ok=True)

    # Première passe : les moyennes. Elles se lisent AVANT d'écrire quoi que ce
    # soit, la référence étant la moyenne des huit.
    sources = []
    for nom in PLANCHES:
        im = Image.open(os.path.join(SRC, nom)).convert('RGB')
        a = np.asarray(im, dtype=np.float64)
        sources.append((nom, a, a.reshape(-1, 3).mean(axis=0)))
    reference = np.mean([m for _, _, m in sources], axis=0)
    print('  moyenne de référence RVB %s' % np.round(reference, 2).tolist())

    empreintes = {}
    for nom, a, moyenne in sources:
        correction = reference - moyenne
        # ⚠ `rint`, PAS UNE TRONCATURE. `astype(uint8)` tronque vers zéro, ce qui
        # décalerait toute la planche d'un demi-niveau vers le sombre et ferait
        # mentir l'alignement qu'on vient de calculer.
        aligne = np.rint(np.clip(a + correction, 0, 255)).astype(np.uint8)
        court = os.path.splitext(nom)[0]
        sortie = os.path.join(DST, court + '.webp')
        Image.fromarray(aligne).save(sortie, 'WEBP', quality=QUALITE, method=METHODE)
        octets = os.path.getsize(sortie)
        with open(sortie, 'rb') as f:
            sha = hashlib.sha256(f.read()).hexdigest()
        # ⚠ LA MOYENNE EST CELLE DE LA PLANCHE ALIGNÉE, PAS DE LA SOURCE. C'est
        # elle qui rend l'alignement VÉRIFIABLE côté JS : les huit doivent
        # tomber sur la référence, et une chaîne qui cesserait d'aligner les
        # ferait diverger de treize niveaux. Node n'a pas de décodeur WebP —
        # sans ce nombre au manifeste, la suite ne pourrait rien en dire.
        empreintes[court] = {
            'correction': [round(float(c), 4) for c in correction],
            'moyenne': [round(float(m), 4)
                        for m in aligne.reshape(-1, 3).mean(axis=0)],
            'hauteur': aligne.shape[0],
            'largeur': aligne.shape[1],
            'octets': octets,
            'qualite': QUALITE,
            'sha256': sha,
        }
        print('  %-14s %sx%s  correction %s  %d o'
              % (court, aligne.shape[1], aligne.shape[0],
                 np.round(correction, 2).tolist(), octets))

    with open(os.path.join(DST, 'sol-empreintes.json'), 'w', encoding='utf-8') as f:
        json.dump({'commentaire': COMMENTAIRE,
                   'reference': [round(float(c), 4) for c in reference],
                   'sols': empreintes},
                  f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print('%d fichiers écrits' % len(sources))
    return 0


if __name__ == '__main__':
    sys.exit(main())
