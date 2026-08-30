#!/usr/bin/env python3
"""Coud les sprites d'une famille en un atlas unique, et écrit l'index qui le lit.

C'est le huitième outil de la chaîne, et le seul qui ne PRODUIT pas de sprite :
il assemble ceux que les sept autres ont conditionnés. Comme eux, il est
déterministe — même entrée, mêmes octets — et son mode --verifier le prouve.

    python3 tools/atlas.py --verifier   # ne rien écrire, comparer l'existant
    python3 tools/atlas.py --ecrire     # coudre les atlas et l'index

Deux sorties par exécution :

  art/sprites/atlas-<famille>-64.png   l'image cousue, inlinée par tools/build.js
  src/data/atlas.js                    l'index, importé par src/render/sprite.js

⚠ LE LECTEUR S'APPELLE `sprite.js`, PAS `atlas.js`, ET C'EST UNE PRÉCAUTION DE
DÉPÔT. Le dépôt se met à jour depuis un téléphone, dont le sélecteur n'affiche
que les noms courts : deux `atlas.js` dans deux dossiers, c'est exactement
l'accident du 27/08 qui a fait écraser le moteur de combat par la table du même
nom court (CLAUDE.md §6, homonymes).

⚠ POURQUOI UN ATLAS ET PAS 511 FICHIERS. Le livrable est un HTML autonome : une
image y entre en `data:`, et un `data:` par sprite voudrait dire 511 marqueurs
dans tools/build.js. Mesuré le 30/08 : sept atlas pèsent 697 898 octets en
base64 contre 719 018 pour un atlas unique et 957 205 pour les fichiers séparés.
Le découpage par FAMILLE, et pas par écran, évite qu'un sprite servant à deux
écrans y soit deux fois.

⚠ LA GRILLE EST LA 64, ARBITRÉE LE 30/08. Neuf colonnes sur ~380 px font des
cases de ~42 px CSS, soit ~126 px physiques à DPR 3 sur le S25 FE : le 128
serait la taille juste, le 32 serait visiblement flou, le 64 est le compromis
tenu. ET LES TROIS GRILLES NE SONT PAS DES AGRANDISSEMENTS L'UNE DE L'AUTRE —
sur 40 sprites tirés au sort, 2 seulement vérifient `128 == 32 × 4` au plus
proche. Ce sont trois conditionnements indépendants ; on ne peut pas embarquer
le 32 et l'agrandir en CSS pour retrouver le 128.

⚠ L'EFFECTIF DE CHAQUE FAMILLE EST ASSERTÉ, PAS DÉDUIT. La leçon du 29/08 (voir
la passation, §4.1) : un outil qui déduit sa grille du contenu écrit sans broncher
un atlas faux. Ici, un sprite ajouté ou retiré fait SORTIR L'OUTIL EN ERREUR, et
c'est voulu — les bâtiments détruits arriveront un jour dans `bâtiment/`, et il
faut que ce jour-là quelqu'un décide, au lieu que l'index change tout seul.
"""
import sys, os, io, math, argparse
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(RACINE, 'art', 'sprites')
INDEX = os.path.join(RACINE, 'src', 'data', 'atlas.js')

COTE = 64

# --- les familles cousues ----------------------------------------------------
#
# On ajoute une ligne ici QUAND LE LOT QUI CONSOMME LA FAMILLE ARRIVE, jamais
# avant : chaque famille cousue est un `data:` de plus dans le HTML livré, donc
# des octets payés par tous les joueurs pour un écran qui n'existe pas encore.
#
#   dossier          → (slug ASCII, effectif attendu)
#
# Le slug est ASCII parce qu'il devient un nom de fichier, un marqueur de build
# et une clé JavaScript ; « bâtiment » ne peut être aucun des trois sans risque.
FAMILLES = {
    'bâtiment': ('batiment', 34),   # 16 intacts + 16 détruits + 2 ruines, lot 10 du 30/08
    'terrain': ('terrain', 18),
    'defense': ('defense', 204),    # 9 pièces × orientations et liaisons, deux camps
    'socle': ('socle', 36),         # les socles des tourelles, deux camps
}

# Les familles restantes, pour mémoire, avec leur effectif relevé le 30/08 :
#   socle 36 · defense 200 · unite 36 · tourelle-unite 160 · carte 45


def sprites_de(dossier, effectif):
    """Les chemins d'une famille, dans l'ordre qui fait l'index.

    L'ordre est celui de `sorted` sur le nom de fichier — points de code, pas
    locale : le tri d'une locale française rangerait `off_o_belier_def` et
    `off_o_belier` autrement selon la machine, et l'index cesserait d'être
    reproductible.
    """
    chemin = os.path.join(SPRITES, dossier, str(COTE))
    if not os.path.isdir(chemin):
        echec(f'{dossier}/{COTE} est absent du dépôt')
    noms = sorted(n[:-4] for n in os.listdir(chemin) if n.endswith('.png'))
    if len(noms) != effectif:
        echec(
            f'{dossier}/{COTE} porte {len(noms)} sprites, {effectif} attendus.\n'
            f"  Ce n'est pas un incident à contourner : si l'ajout est voulu, "
            f"corriger l'effectif dans FAMILLES et relire l'index produit."
        )
    return noms, chemin


def coudre(noms, chemin):
    """L'atlas d'une famille, et sa géométrie.

    La grille est la plus carrée possible : `colonnes = ceil(√n)`. Les cases
    au-delà du dernier sprite restent transparentes — elles ne sont jamais
    adressées, l'index ne portant que les noms réels.
    """
    n = len(noms)
    colonnes = math.ceil(math.sqrt(n))
    rangees = math.ceil(n / colonnes)
    atlas = Image.new('RGBA', (colonnes * COTE, rangees * COTE), (0, 0, 0, 0))
    for i, nom in enumerate(noms):
        sprite = Image.open(os.path.join(chemin, nom + '.png'))
        if sprite.size != (COTE, COTE):
            echec(f'{nom}.png mesure {sprite.size}, {COTE}×{COTE} attendu')
        atlas.paste(sprite.convert('RGBA'), ((i % colonnes) * COTE, (i // colonnes) * COTE))
    tampon = io.BytesIO()
    atlas.save(tampon, 'PNG', optimize=True)
    return tampon.getvalue(), colonnes, rangees


def index_js(familles):
    """Le module d'index, écrit tel qu'il sera lu.

    Il ne porte AUCUNE coordonnée : rien que les noms, dans l'ordre de couture,
    et la géométrie de la grille. La cellule d'un sprite se calcule de son
    rang — `src/render/atlas.js` s'en charge. Écrire 511 paires de nombres
    ici, ce serait 511 occasions qu'un des deux calculs dérive de l'autre.
    """
    lignes = [
        '// FICHIER GÉNÉRÉ PAR tools/atlas.py — NE PAS MODIFIER À LA MAIN.',
        '//',
        "// Il dit ce que chaque atlas contient et dans quel ordre. `test/sprite.test.js`",
        "// le confronte au contenu réel de `art/sprites/` : un sprite ajouté sans que",
        "// l'outil soit relancé fait rougir la suite, il ne fait pas dessiner de travers.",
        '',
        'export const COTE_SPRITE = %d;' % COTE,
        '',
        'export const ATLAS = {',
    ]
    for slug, (colonnes, rangees, noms) in familles.items():
        lignes.append(f'  {slug}: {{')
        lignes.append(f'    colonnes: {colonnes}, rangees: {rangees},')
        lignes.append('    noms: [')
        for nom in noms:
            lignes.append(f"      '{nom}',")
        lignes.append('    ],')
        lignes.append('  },')
    lignes.append('};')
    lignes.append('')
    return '\n'.join(lignes)


def echec(message):
    print(f'\nATLAS EN ÉCHEC — {message}', file=sys.stderr)
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ecrire', action='store_true')
    ap.add_argument('--verifier', action='store_true')
    args = ap.parse_args()
    if args.ecrire == args.verifier:
        ap.error('choisir --ecrire ou --verifier')

    familles = {}
    identiques = differents = nouveaux = 0
    for dossier, (slug, effectif) in FAMILLES.items():
        noms, chemin = sprites_de(dossier, effectif)
        octets, colonnes, rangees = coudre(noms, chemin)
        familles[slug] = (colonnes, rangees, noms)
        sortie = os.path.join(SPRITES, f'atlas-{slug}-{COTE}.png')
        etat = comparer(sortie, octets)
        if etat == 'identique':
            identiques += 1
        elif etat == 'different':
            differents += 1
            print(f'  ÉCART atlas-{slug}-{COTE}.png')
        else:
            nouveaux += 1
            print(f'  NOUVEAU atlas-{slug}-{COTE}.png')
        if args.ecrire:
            with open(sortie, 'wb') as f:
                f.write(octets)
        print(
            f'{dossier:16} {len(noms):4d} sprites  '
            f'{colonnes}×{rangees}  {len(octets):7d} o  ({len(octets) * 4 // 3} o en base64)'
        )

    js = index_js(familles)
    etat = comparer(INDEX, js.encode('utf-8'))
    if args.ecrire:
        with open(INDEX, 'w', encoding='utf-8') as f:
            f.write(js)
    print(f'src/data/atlas.js  {etat}')
    print(f'atlas identiques : {identiques} · différents : {differents} · nouveaux : {nouveaux}')


def comparer(chemin, octets):
    if not os.path.exists(chemin):
        return 'nouveau'
    with open(chemin, 'rb') as f:
        return 'identique' if f.read() == octets else 'different'


if __name__ == '__main__':
    main()
