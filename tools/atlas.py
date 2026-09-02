#!/usr/bin/env python3
"""Coud les sprites d'une famille en un atlas unique, et écrit l'index qui le lit.

C'est le huitième outil de la chaîne, et le seul qui ne PRODUIT pas de sprite :
il assemble ceux que les sept autres ont conditionnés. Comme eux, il est
déterministe — même entrée, mêmes octets — et son mode --verifier le prouve.

    python3 tools/atlas.py --verifier   # ne rien écrire, comparer l'existant
    python3 tools/atlas.py --ecrire     # coudre les atlas et l'index

Deux sorties par exécution :

  art/sprites/atlas-<famille>-64.webp    l'image cousue, inlinée par tools/build.js
  art/sprites/atlas-<famille>-128.webp   la même en grille 128, qu'aucun écran ne lit encore
  src/data/atlas.js                      l'index, importé par src/render/sprite.js

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

⚠ LA GRILLE EMBARQUÉE EST LA 64, ARBITRÉE LE 30/08. Neuf colonnes sur ~380 px
font des cases de ~42 px CSS, soit ~126 px physiques à DPR 3 sur le S25 FE : le
128 serait la taille juste, le 64 est le compromis tenu. La 128 est cousue à
côté depuis le lot PIXELS, et coûte 1 260 ko de dépôt pour zéro octet de
livrable. ET LES DEUX GRILLES NE SONT PAS DES AGRANDISSEMENTS L'UNE DE L'AUTRE :
ce sont deux conditionnements indépendants, chacun réduit depuis la source.

⚠ L'EFFECTIF DE CHAQUE FAMILLE EST ASSERTÉ, PAS DÉDUIT. La leçon du 29/08 (voir
la passation, §4.1) : un outil qui déduit sa grille du contenu écrit sans broncher
un atlas faux. Ici, un sprite ajouté ou retiré fait SORTIR L'OUTIL EN ERREUR, et
c'est voulu — les bâtiments détruits arriveront un jour dans `bâtiment/`, et il
faut que ce jour-là quelqu'un décide, au lieu que l'index change tout seul.
"""
import sys, os, io, json, math, hashlib, argparse
from PIL import Image

from portes import POIDS, PORTES

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(RACINE, 'art', 'sprites')
INDEX = os.path.join(RACINE, 'src', 'data', 'atlas.js')
EMPREINTES = os.path.join(SPRITES, 'atlas-empreintes.json')

# ⚠⚠ DEUX GRILLES COUSUES DEPUIS LE LOT PIXELS, UNE SEULE EMBARQUÉE. La 128 est
# cousue pour qu'elle EXISTE le jour où un écran la demandera — elle ne coûte
# aucun octet au livrable, seulement du dépôt. `COTE_INDEX` est la grille que
# `src/data/atlas.js` décrit et que `tools/build.js` inline ; les deux nombres
# doivent s'accorder, et `test/sprite.test.js` refuse qu'ils divergent.
GRILLES = (64, 128)
COTE_INDEX = 64

# ⚠⚠ WEBP DEPUIS LE LOT PIXELS, ET C'EST LUI QUI REND LE PROTOCOLE TENABLE.
# Les sprites ne sont plus quantifiés sur une palette fermée : ils sortent d'une
# réduction par filtre, donc de quelques milliers de teintes au lieu de
# quatorze. Mesuré sur les huit familles, grille 64 : 479 ko de PNG en palette
# hier, 2 487 ko de PNG en rendu libre — ×5,2, impossible —, 490 ko en WebP q85.
# Ce n'est pas le protocole seul qui tient dans le budget, c'est le WebP.
FORMAT = 'WEBP'
EXTENSION = 'webp'
QUALITE = 85
METHODE = 6

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
# ⚠⚠ TROIS CHAMPS PAR ENTRÉE DEPUIS LE LOT CARTE-EMBLÈMES : slug, effectif COUSU,
# et les fichiers EXCLUS de la couture. Le troisième est explicite et vaut `()`
# partout ailleurs — un champ optionnel aurait laissé croire qu'une famille sans
# exclusion n'a pas eu à en décider.
FAMILLES = {
    'bâtiment': ('batiment', 34, ()),   # 16 intacts + 16 détruits + 2 ruines, lot 10 du 30/08
    'terrain': ('terrain', 18, ()),
    'defense': ('defense', 204, ()),    # 9 pièces × orientations et liaisons, deux camps
    'socle': ('socle', 36, ()),         # les socles des tourelles, deux camps
    'unite': ('unite', 36, ()),         # les 14 unités des deux camps, poses d'attaque et de défense
    'chassis': ('chassis', 10, ()),     # les coques de blindé du JOUEUR seul, attaque et défense
    # ⚠ LE SLUG PREND UN SOULIGNÉ, PAS UN TIRET : il devient une clé JavaScript,
    # et `ATLAS['tourelle-unite']` s'écrirait mais `ATLAS.tourelle-unite` non.
    'tourelle-unite': ('tourelle_unite', 80, ()),  # 5 blindés joueur × 16 orientations
    # ⚠⚠ 43 COUSUS SUR 45 SUR LE DISQUE. Les deux grosses bases de l'Ouvrage
    # mesurent 128×128 et 192×192 à la grille 64 — elles couvrent 2×2 et 3×3
    # cases — et `coudre` exige `COTE × COTE` : les laisser entrer ferait sortir
    # l'outil en erreur. Elles voyagent chacune dans son propre marqueur, comme
    # l'atlas de terrain de la carte du monde. Un atlas d'un seul sprite ne coud
    # rien.
    'carte': ('carte', 43, ('base_o_2x2', 'base_o_3x3')),
    # ⚠⚠ `bord/` N'EST PAS ICI, ET CE N'EST PAS UN OUBLI. Le mur de contour ne
    # tient pas dans une case : ses sprites font 512 × 64, 64 × 512 et 64 × 64
    # (arbitrage d'Ethan du 31/08, « divise par deux l'asset original […] le mur
    # fera 512x64 »), et `coudre` exige des cellules CARRÉES de `COTE`. Ils
    # voyagent donc chacun dans son propre marqueur de `tools/build.js`, comme
    # les deux grosses bases de l'Ouvrage juste au-dessus.
}


def sprites_de(dossier, effectif, exclus, cote):
    """Les chemins d'une famille, dans l'ordre qui fait l'index.

    L'ordre est celui de `sorted` sur le nom de fichier — points de code, pas
    locale : le tri d'une locale française rangerait `off_o_belier_def` et
    `off_o_belier` autrement selon la machine, et l'index cesserait d'être
    reproductible.

    ⚠⚠ UNE EXCLUSION SE JUSTIFIE DANS LES DEUX SENS. Le fichier exclu doit
    EXISTER et ne doit PAS être `COTE × COTE` : sans cette seconde moitié, une
    exclusion deviendrait un moyen de faire disparaître un sprite cassé, ou de
    laisser pourrir un nom qui ne désigne plus rien. Même discipline que les
    écarts permanents de `planches.py` et de `verifier.py`.
    """
    chemin = os.path.join(SPRITES, dossier, str(cote))
    if not os.path.isdir(chemin):
        echec(f'{dossier}/{cote} est absent du dépôt')
    tous = sorted(n[:-4] for n in os.listdir(chemin) if n.endswith('.png'))
    for nom in exclus:
        if nom not in tous:
            echec(
                f'{dossier}/{cote} : « {nom} » est exclu de la couture mais absent du disque.\n'
                f"  Une exclusion qui ne désigne rien est une ligne morte : la retirer."
            )
        taille = Image.open(os.path.join(chemin, nom + '.png')).size
        if taille == (cote, cote):
            echec(
                f'{dossier}/{cote} : « {nom} » mesure {cote}×{cote} et pourrait donc être cousu.\n'
                f"  Son exclusion n'a plus de raison d'être : retirer sa ligne de FAMILLES."
            )
    noms = [n for n in tous if n not in exclus]
    if len(noms) != effectif:
        echec(
            f'{dossier}/{cote} porte {len(noms)} sprites cousables, {effectif} attendus.\n'
            f"  Ce n'est pas un incident à contourner : si l'ajout est voulu, "
            f"corriger l'effectif dans FAMILLES et relire l'index produit."
        )
    return noms, chemin


def coudre(noms, chemin, cote):
    """L'atlas d'une famille, et sa géométrie.

    La grille est la plus carrée possible : `colonnes = ceil(√n)`. Les cases
    au-delà du dernier sprite restent transparentes — elles ne sont jamais
    adressées, l'index ne portant que les noms réels.
    """
    n = len(noms)
    colonnes = math.ceil(math.sqrt(n))
    rangees = math.ceil(n / colonnes)
    atlas = Image.new('RGBA', (colonnes * cote, rangees * cote), (0, 0, 0, 0))
    for i, nom in enumerate(noms):
        sprite = Image.open(os.path.join(chemin, nom + '.png'))
        if sprite.size != (cote, cote):
            echec(f'{nom}.png mesure {sprite.size}, {cote}×{cote} attendu')
        atlas.paste(sprite.convert('RGBA'), ((i % colonnes) * cote, (i // colonnes) * cote))
    tampon = io.BytesIO()
    # ⚠ `exact=True` : sans lui, l'encodeur a le droit de réécrire le RGB des
    # pixels transparents pour mieux comprimer. Les octets resteraient
    # déterministes, mais deux sprites qui ne diffèrent que sous l'alpha
    # deviendraient indistinguables — et le dépôt compare à l'octet.
    atlas.save(tampon, FORMAT, quality=QUALITE, method=METHODE, exact=True)
    return tampon.getvalue(), colonnes, rangees


def empreinte(octets):
    return hashlib.sha256(octets).hexdigest()


def manifeste(familles, empreintes_atlas):
    """Ce que le côté JS doit savoir de la chaîne sans pouvoir la rejouer.

    ⚠⚠ POURQUOI IL EXISTE, ET CE QU'IL REMPLACE. `test/sprite.test.js` DÉCODAIT
    l'atlas et comparait sa cellule `i` aux pixels du sprite `i` — la garde née
    du 30/08, quand seize sprites avaient été régénérés sous un atlas resté
    celui de la veille, `npm run check` vert et rien pour le voir. Les atlas
    sont passés au WebP au lot PIXELS ; Node n'a pas de décodeur WebP, et §3 du
    CLAUDE.md interdit d'ajouter une dépendance de test.

    Ce fichier porte donc les EMPREINTES : celle de chaque atlas, et celle de
    chaque sprite source. Le test vérifie les deux sans décoder un pixel. Le
    défaut du 30/08 tombe dedans de face — un sprite régénéré sans que l'outil
    soit relancé fait mentir l'empreinte de la source.

    ⚠ CE QU'IL NE TIENT PLUS, ET IL FAUT LE SAVOIR : la correspondance CELLULE ↔
    SPRITE. Elle est refaite par RECONSTRUCTION, à chaque `tools/verifier.py`,
    par `atlas.py --verifier` lui-même — donc sur les lots qui touchent à l'art,
    plus à chaque `npm run check`. Arbitré par Ethan le 02/09, contre les deux
    autres issues mesurées : committer aussi un PNG jamais embarqué (+1,6 Mio de
    dépôt, deux fichiers pour une vérité, et rien qui les relie), ou rester en
    PNG (le livrable passe de 1,58 à 2,94 Mo).

    ⚠ ET IL PORTE AUSSI LES PORTES DE QUANTIFICATION, pour la même raison de
    fond : `test/accent.test.js` classe désormais les pixels au plus proche sous
    ces portes-là, et leurs nombres ne doivent exister qu'à un seul endroit —
    `tools/portes.py`. Le JS n'en porte que la forme.
    """
    return {
        'commentaire': 'FICHIER GÉNÉRÉ PAR tools/atlas.py — NE PAS MODIFIER À LA MAIN.',
        'cote': COTE_INDEX,
        'quantification': {'poids': list(POIDS), 'portes': PORTES},
        'familles': {
            slug: {
                'atlas': empreintes_atlas[slug],
                'sprites': {nom: emp for nom, emp in sprites},
            }
            for slug, (_c, _r, _noms, sprites) in familles.items()
        },
    }


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
        'export const COTE_SPRITE = %d;' % COTE_INDEX,
        '',
        'export const ATLAS = {',
    ]
    for slug, (colonnes, rangees, noms, _empreintes) in familles.items():
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
    empreintes_atlas = {}
    identiques = differents = nouveaux = 0
    for cote in GRILLES:
        for dossier, (slug, effectif, exclus) in FAMILLES.items():
            noms, chemin = sprites_de(dossier, effectif, exclus, cote)
            octets, colonnes, rangees = coudre(noms, chemin, cote)
            if cote == COTE_INDEX:
                sprites = [(n, empreinte(open(os.path.join(chemin, n + '.png'), 'rb').read()))
                           for n in noms]
                familles[slug] = (colonnes, rangees, noms, sprites)
                empreintes_atlas[slug] = empreinte(octets)
            sortie = os.path.join(SPRITES, f'atlas-{slug}-{cote}.{EXTENSION}')
            etat = comparer(sortie, octets)
            if etat == 'identique':
                identiques += 1
            elif etat == 'different':
                differents += 1
                print(f'  ÉCART atlas-{slug}-{cote}.{EXTENSION}')
            else:
                nouveaux += 1
                print(f'  NOUVEAU atlas-{slug}-{cote}.{EXTENSION}')
            if args.ecrire:
                with open(sortie, 'wb') as f:
                    f.write(octets)
            print(
                f'{dossier:16} {cote:4d}  {len(noms):4d} sprites  '
                f'{colonnes}×{rangees}  {len(octets):7d} o  ({len(octets) * 4 // 3} o en base64)'
            )

    js = index_js(familles)
    etat = comparer(INDEX, js.encode('utf-8'))
    if args.ecrire:
        with open(INDEX, 'w', encoding='utf-8') as f:
            f.write(js)
    print(f'src/data/atlas.js  {etat}')

    manif = json.dumps(manifeste(familles, empreintes_atlas),
                       ensure_ascii=False, indent=2, sort_keys=True) + '\n'
    etat_manif = comparer(EMPREINTES, manif.encode('utf-8'))
    if args.ecrire:
        with open(EMPREINTES, 'w', encoding='utf-8') as f:
            f.write(manif)
    if etat_manif != 'identique':
        differents += 1 if etat_manif == 'different' else 0
        nouveaux += 1 if etat_manif == 'nouveau' else 0
    print(f'atlas-empreintes.json  {etat_manif}')
    print(f'atlas identiques : {identiques} · différents : {differents} · nouveaux : {nouveaux}')


def comparer(chemin, octets):
    if not os.path.exists(chemin):
        return 'nouveau'
    with open(chemin, 'rb') as f:
        return 'identique' if f.read() == octets else 'different'


if __name__ == '__main__':
    main()
