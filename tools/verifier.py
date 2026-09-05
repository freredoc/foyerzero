#!/usr/bin/env python3
"""La chaîne graphique répond-elle de ses sprites ?

⚠⚠ CE QUE CE FICHIER EXISTE POUR EMPÊCHER. Le 30/08/2026, `main` portait un
`tools/emblemes.py` corrigé — les deux grosses bases de l'Ouvrage doivent sortir
en 256 × 256 et 384 × 384 à la grille 128 — et les six PNG d'à côté étaient
restés à la taille d'une case. `npm run check` était vert, aucun test ne pouvait
le voir : **un outil et ses fichiers, justes séparément, faux ensemble.** Sur
douze outils, deux seulement — `planches.py` et `atlas.py` — savaient répondre de
ce qu'ils produisent.

COMMENT. On pointe `FZ_SPRITES` sur un dossier temporaire, on rejoue toute la
chaîne dedans, et on compare à l'octet avec `art/sprites/`. Le dépôt n'est jamais
écrit : c'est l'invariant le plus important du fichier, et une démonstration le
mesure par empreinte avant/après.

⚠ QUATRE CATÉGORIES, PAS TROIS. `planches.py` en connaît trois — identiques,
différents, nouveaux. Il en manque une, et c'est la plus utile : **MANQUANTS**,
les fichiers commités qu'aucun outil ne produit plus. Un sprite retiré d'un outil
mais laissé au dépôt ne se voit d'aucune autre façon — c'est ce qui est arrivé
aux 240 tourelles de blindé de l'Ouvrage, retirées au lot PRODUCTION, et personne
n'aurait su si elles étaient restées.

    python3 tools/verifier.py                    # toute la chaîne
    python3 tools/verifier.py --outil emblemes   # un seul, pour itérer
"""
import argparse
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import time

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(RACINE, 'art', 'sprites')

# ---------------------------------------------------------------------------
# La chaîne
# ---------------------------------------------------------------------------
#
# ⚠ L'ORDRE EST CELUI DE LA CHAÎNE, PAS L'ALPHABET. Il est repris de
# `rapports/RAPPORT-PRODUCTION-SPRITES.md` §2, qui l'a relevé en le jouant.
# `planches.py` passe en premier parce qu'il pose les familles de base ; les
# autres complètent. Le rejouer dans un autre ordre n'a pas été mesuré.
CHAINE = [
    ('planches',        ['--ecrire']),
    ('tourelles',       ['--ecrire']),
    ('tourelles_unite', ['--ecrire']),
    ('socles',          []),
    ('connexions',      []),
    ('emblemes',        []),
    ('unites_ouvrage',  []),
    ('barrieres',       []),
    ('effets',          []),
    ('chassis',         []),
    ('ruines',          []),
    # ⚠⚠ LES MURS DE CONTOUR SONT SORTIS DE LA CHAÎNE — lot MUR-PEINT, 03/09.
    # Ethan a fait peindre le mur DANS le fond de base : l'anneau que le code
    # dessinait n'existe plus, et aucun écran ne lit `bord_j_*` ni `bord_o_*`.
    # Les laisser produire remplirait `art/sprites/bord/` de dix-sept fichiers
    # que le dépôt ne porte plus, donc comptés « nouveaux » à chaque exécution.
    #
    # ⚠ `tools/bords.py` RESTE AU DÉPÔT, SANS APPELANT — comme
    # `tools/align_chenilles.py` depuis la sortie de la grille 32. Ethan :
    # « les `bord_*` ne sont pas supprimés » ; l'outil qui les fabrique non plus.
    # ⚠ LES FONDS D'ÉCRAN — 03/09. Un décor n'est pas un sprite et n'entre dans
    # aucun atlas ; il passe quand même par la chaîne pour que personne n'ait à
    # se demander, dans six mois, comment on referait ce fichier.
    ('fonds',           []),
    # ⚠⚠ LE SOL DE LA CARTE — lot SOL-SATELLITE, 05/09. Huit planches satellite
    # posées telles quelles, à un alignement de moyenne près. Comme les décors
    # juste au-dessus, ce n'est ni un sprite ni une cellule d'atlas — 1 254 px de
    # côté pour 4,9 cases —, et la ligne est due pour la raison ordinaire : sans
    # elle, les huit `.webp` de `sol/` seraient comptés MANQUANTS et les huit
    # planches d'`art/sources/` classées DORMANTES alors qu'un outil les
    # consomme. Mesuré : c'est très exactement ce que le premier
    # `entrees.py --declarer` de ce lot a rendu, avant cette ligne.
    ('sols',            []),
    # ⚠ LES LIMITES DE TERRITOIRE — 03/09. Elles SONT cousues dans un atlas, à
    # la différence des murs juste au-dessus : leurs cellules sont carrées. La
    # ligne reste due pour la raison ordinaire — sans elle, les 52 fichiers de
    # `limite/` seraient comptés MANQUANTS, et les quatre planches d'`art/sources/`
    # classées DORMANTES alors qu'un outil les consomme.
    ('limites',         []),
    # ⚠⚠ LES QUATRE SONS TÉMOINS — lot SON-MOTEUR, 04/09. Un son n'est ni un
    # sprite ni un décor, et il passe quand même par la chaîne, pour la raison
    # ordinaire : sans cette ligne les quatre `.opus` seraient comptés MANQUANTS
    # à chaque exécution, et les quatre masters WAV classés DORMANTS alors qu'un
    # outil les consomme.
    #
    # ⚠⚠ ET IL DEMANDE `opusenc`, QUI N'EST PAS PLUS PRÉSENT QUE PILLOW SUR UN
    # CONTENEUR NEUF. `tools/sons.py` sort en erreur avec la commande
    # d'installation plutôt que de laisser lire « chaîne cassée » là où il
    # manque une dépendance — la leçon du lot SPRITES-S11, prise à l'avance.
    #
    # ⚠⚠ SA GARANTIE À L'OCTET TIENT, ET ELLE A FAILLI NE PAS TENIR. Le numéro
    # de série du flux Ogg est TIRÉ AU HASARD par défaut : deux exécutions
    # rendaient des SHA-256 différents, donc « 4 différents » à chaque passage,
    # pour toujours. `tools/sons.py` fixe `--serial` par entrée, et deux
    # exécutions rendent alors les mêmes octets — mesuré. Ce qui reste vrai :
    # les fichiers portent la version de libopus dans leurs `OpusTags`, donc un
    # changement de version FERA dire « différent » au vérificateur. C'est ce
    # qu'il doit dire ; ne pas l'assouplir pour ça.
    ('sons',            []),
    # ⚠⚠ LES CHAMPS ET LES OBSTACLES — 03/09, lot MOULINETTE-TERRAIN. Cette
    # ligne-ci est la seule de la table qui RETIRE une source déclarée : les dix
    # sprites qu'elle produit étaient couverts par `SOURCES_DECLAREES['terrain/']`
    # depuis le 30/08, au motif que leurs planches n'existaient plus. Elles
    # existaient — sept d'entre elles dorment dans `art/sources/` depuis toujours.
    # La déclaration se resserre donc sur les seuls `tile_sol_*`, juste en
    # dessous, et sa moitié inverse fera tomber le vérificateur le jour où l'on
    # saura les reproduire aussi.
    ('terrain',         []),
    # ⚠⚠ LES ENTRÉES — 03/09, ET ELLE NE PRODUIT AUCUN SPRITE. Comme la ligne
    # `bords` ci-dessus dit pourquoi elle est là, celle-ci dit pourquoi elle
    # n'écrit rien : `entrees.py` OBSERVE ce que la chaîne ouvre dans
    # `art/sources/` et le confronte à `art/sources-declarees.json`. Elle passe
    # en DERNIER, et son dossier de sortie reste vide — le vérificateur ne doit
    # donc pas s'attendre à lui voir produire quoi que ce soit.
    #
    # ⚠ ELLE REJOUE LA CHAÎNE UNE SECONDE FOIS, ET ÇA SE PAIE : mesuré sur la
    # même machine, le vérificateur passe de **185,2 s à 291,9 s**, soit
    # +106,7 s. C'est le prix d'une trace qui est un FAIT d'exécution et non une
    # intention relue — et il est PLUS BAS qu'un doublement parce que la moitié
    # du temps du vérificateur est la comparaison des 931 fichiers, qu'`entrees`
    # ne refait pas : elle jette ce que les outils écrivent.
    ('entrees',         ['--verifier']),
]

# ---------------------------------------------------------------------------
# Les écarts déclarés
# ---------------------------------------------------------------------------
#
# ⚠⚠ UNE TABLE D'EXCEPTIONS SANS ASSERTION INVERSE POURRIT EN SILENCE. Chaque
# ligne ci-dessous est vérifiée DEUX fois : le fichier a le droit de différer, et
# **il doit encore différer**. Le jour où l'un se remet à se reproduire, le
# vérificateur tombe et quelqu'un vient retirer la ligne. C'est la mécanique de
# `DETTES_ACCENT` dans `test/accent.test.js`.
ECARTS_PERMANENTS = {}
# ⚠⚠ ELLE EST VIDE DEPUIS LE LOT PIXELS, ET C'EST LA TABLE QUI A TENU SA
# PROMESSE. Elle portait `unite/32/off_j_ratisseur.png` et
# `unite/32/off_j_belier.png` — les deux seuls fichiers du dépôt que la chaîne
# ne reproduisait pas, arbitrés « on garde les commités » le 30/08. La grille 32
# est sortie de `GRILLES` au lot PIXELS : les deux fichiers ont quitté le dépôt,
# donc les deux lignes n'avaient plus rien à couvrir. Laisser une exception qui
# ne désigne plus rien est exactement ce que la moitié inverse ci-dessus refuse.


# ---------------------------------------------------------------------------
# Ce qui n'appartient pas à la chaîne redirigée
# ---------------------------------------------------------------------------
#
# ⚠ LES SEPT ATLAS SONT COUSUS PAR `tools/atlas.py`, QUI RESTE À PART. Il écrit
# aussi `src/data/atlas.js`, qui n'est pas un sprite, et il porte déjà son propre
# `--verifier` qui ne touche à rien. Ce vérificateur-ci l'APPELLE plutôt que de
# le dérouter — sinon les sept fichiers seraient MANQUANTS à chaque exécution, et
# un contrôle qui crie toujours cesse d'être lu.
#
# ⚠ LA LISTE SE CALCULE, ELLE NE S'ÉCRIT PAS. Un huitième atlas cousu demain
# entrerait tout seul ; une liste de sept noms serait la première à vieillir.
def est_un_atlas(rel):
    return os.path.basename(rel).startswith('atlas-') and os.path.dirname(rel) == ''


# ---------------------------------------------------------------------------
# Les sources déclarées
# ---------------------------------------------------------------------------
#
# ⚠⚠ ARBITRÉ PAR ETHAN LE 30/08, en réponse aux 56 MANQUANTS du lot
# CHAÎNE-VÉRIFIÉE : « déclarer le terrain comme une source ». Ces fichiers sont
# au dépôt et AUCUN outil ne les produit — non par oubli, mais parce qu'ils SONT
# la source. Les compter manquants ferait crier le vérificateur à chaque
# exécution, et un contrôle qui crie toujours cesse d'être lu.
#
# ⚠⚠ ET LA MOITIÉ QUI REND LA TABLE HONNÊTE : chaque source déclarée doit ENCORE
# être introuvable dans la production. Le jour où un outil se met à produire une
# tuile de terrain, le vérificateur TOMBE, pour qu'on retire la ligne au lieu de
# laisser une déclaration périmée couvrir un vrai produit. C'est la mécanique
# d'`ECARTS_PERMANENTS` juste en dessous, et de `DETTES_ACCENT` dans
# `test/accent.test.js`.
#
# ⚠⚠ LE PRIX DE CET ARBITRAGE, ÉCRIT ICI POUR QU'IL SOIT LU PAR CELUI QUI LE
# PAIERA : **un futur changement de palette ne pourra pas être appliqué au
# terrain automatiquement.** Les 54 tuiles ne se régénèrent plus — la branche
# terrain de `planches.py` était une migration à usage unique, qui a supprimé ses
# propres originaux. Il faudra les retoucher à la main, ou retrouver les planches.
# ⚠⚠ ELLE S'EST RESSERRÉE LE 03/09, ET C'EST LA MOITIÉ INVERSE QUI L'A EXIGÉ.
# La ligne `terrain/` couvrait les 54 tuiles ; `tools/terrain.py` en produit
# désormais 20, donc la déclaration mentait sur celles-là et le vérificateur
# tombait — exactement ce qu'on lui demande. Ce qui reste déclaré, ce sont les
# huit dalles de sol, aux trois grilles : leur seule source apparente est un
# INDEX à cinq teintes, aucune de ses 576 cellules ni aucune fenêtre glissante
# ne les reproduit, et aucun écran ne les dessine depuis que le sol de la base
# est découpé dans l'atlas du MONDE. Les dix autres tuiles de la grille 32 ont
# été RETIRÉES du dépôt dans le même lot : la 32 n'est produite par aucun outil
# depuis le lot PIXELS, et la seule raison de les garder était leur
# irrécupérabilité, qui vient de cesser d'être vraie.
_RAISON_SOL = (
    'les huit dalles de sol sont la SOURCE, pas un produit : leur seul original '
    'apparent est un index à cinq teintes que la migration n\'a pas découpé tel '
    'quel, et cette migration a supprimé ce dont elle est partie. ⚠ Un '
    'changement de palette ne pourra pas leur être appliqué automatiquement.'
)
SOURCES_DECLAREES = {
    **{f'terrain/{grille}/{nom}.png': _RAISON_SOL
       for grille in (32, 64, 128)
       for nom in ('tile_sol_j_a', 'tile_sol_j_b', 'tile_sol_j_c', 'tile_sol_j_d',
                   'tile_sol_o_a', 'tile_sol_o_b', 'tile_sol_o_c', 'tile_sol_o_d')},
    'carte/atlas-terrain-64.png': (
        'livré fini au lot ÉCRAN-CARTE, 224 548 octets ; tools/build.js l\'inline, '
        'aucun outil du dépôt ne le produit'
    ),
    'carte/controle-pavage.png': (
        'image de contrôle du pavage, produite une fois au lot ÉCRAN-CARTE et '
        'citée par son rapport'
    ),
}


def est_source_declaree(rel):
    """Un chemin relatif est-il couvert par une source déclarée ?

    ⚠ LE PRÉFIXE SE TERMINE PAR UNE BARRE POUR UN DOSSIER, et c'est ce qui
    empêche `terrain/` de couvrir un hypothétique `terrain-bis/`. Un fichier se
    déclare par son chemin exact.
    """
    for cle in SOURCES_DECLAREES:
        if cle.endswith('/'):
            if rel.startswith(cle.replace('/', os.sep)):
                return cle
        elif rel == cle.replace('/', os.sep):
            return cle
    return None


def empreinte(chemin):
    with open(chemin, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def arbre(racine):
    """Chemins relatifs de tous les fichiers sous `racine`, triés.

    ⚠ `__pycache__` et les fichiers cachés sont écartés : ce ne sont pas des
    sprites, et un `.DS_Store` déposé par un système de fichiers ferait rougir
    le vérificateur pour une raison qui n'a rien à voir avec la chaîne.
    """
    trouves = []
    for dossier, sous, fichiers in os.walk(racine):
        sous[:] = [d for d in sous if d != '__pycache__' and not d.startswith('.')]
        for f in fichiers:
            if f.startswith('.'):
                continue
            chemin = os.path.join(dossier, f)
            trouves.append(os.path.relpath(chemin, racine))
    return sorted(trouves)


def jouer(nom, arguments, destination):
    """Lance un outil dans un environnement dérouté. Rend (code, sortie)."""
    env = dict(os.environ)
    env['FZ_SPRITES'] = destination
    # ⚠ `PYTHONDONTWRITEBYTECODE` : sans lui, l'import de `cond` et de `chemins`
    # sème un `tools/__pycache__` qui salit `git status` à chaque exécution.
    env['PYTHONDONTWRITEBYTECODE'] = '1'
    r = subprocess.run(
        [sys.executable, os.path.join(RACINE, 'tools', f'{nom}.py'), *arguments],
        cwd=RACINE, env=env, capture_output=True, text=True,
    )
    return r.returncode, (r.stdout or '') + (r.stderr or '')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--outil', help='ne rejouer qu\'un outil, pour itérer')
    ap.add_argument('--silencieux', action='store_true',
                    help='taire la sortie des outils, garder le verdict')
    a = ap.parse_args()

    chaine = CHAINE
    if a.outil:
        chaine = [(n, args) for n, args in CHAINE if n == a.outil]
        if not chaine:
            connus = ' '.join(n for n, _ in CHAINE)
            ap.error(f'« {a.outil} » n\'est pas de la chaîne — connus : {connus}')

    depart = time.time()
    temporaire = tempfile.mkdtemp(prefix='fz-verifier-')
    try:
        # 1. rejouer
        for nom, arguments in chaine:
            t = time.time()
            code, sortie = jouer(nom, arguments, temporaire)
            duree = time.time() - t
            print(f'### {nom}.py {" ".join(arguments)}  ({duree:.1f} s)')
            if not a.silencieux:
                print(sortie.rstrip())
            # ⚠ UN OUTIL QUI LÈVE ARRÊTE LA COURSE. Le compter comme « rien à
            # produire » ferait passer sa famille entière en MANQUANTS, et le
            # rapport accuserait le dépôt d'un défaut qui est dans l'outil.
            if code != 0:
                print(f'\n⚠ {nom}.py sort en {code} — la course s\'arrête ici.')
                if a.silencieux:
                    print(sortie.rstrip())
                return 2

        # 2. comparer
        #
        # ⚠ LES ATLAS SORTENT DES DEUX CÔTÉS À LA FOIS. Les retirer d'un seul
        # les ferait basculer en MANQUANTS ou en NOUVEAUX au lieu de les
        # soustraire, ce qui est la faute que cette ligne évite.
        produits = {p for p in arbre(temporaire) if not est_un_atlas(p)}
        commites = {c for c in arbre(SPRITES) if not est_un_atlas(c)}
        # ⚠⚠ AVEC `--outil`, « MANQUANT » N'EST PAS CALCULABLE, ET LE DIRE VAUT
        # MIEUX QUE DE LE TAIRE. Un seul outil ne produit pas toute une famille :
        # `emblemes.py` peuple `carte/` mais n'y produit ni l'atlas du monde ni
        # l'image de contrôle du pavage, qui viennent d'ailleurs. Les compter
        # manquants ferait crier l'option qui sert à itérer ; les cacher
        # laisserait croire qu'elle vaut la chaîne entière. On restreint la
        # comparaison à la famille, on ne rend AUCUN manquant, et le verdict le
        # dit en toutes lettres.
        if a.outil:
            familles = {p.split(os.sep)[0] for p in produits}
            commites = {c for c in commites if c.split(os.sep)[0] in familles}
            commites &= produits

        identiques, differents, nouveaux, manquants = [], [], [], []
        # ⚠ CE QUI EST DÉCLARÉ SOURCE ET QUI SE MET À ÊTRE PRODUIT : la
        # déclaration est périmée, et le vérificateur doit TOMBER dessus.
        sources_trahies = []
        for rel in sorted(produits | commites):
            ici = os.path.join(temporaire, rel)
            la = os.path.join(SPRITES, rel)
            source = est_source_declaree(rel)
            if rel not in commites:
                nouveaux.append(rel)
            elif rel not in produits:
                # ⚠ UNE SOURCE DÉCLARÉE N'EST PAS UN MANQUANT. C'est tout l'objet
                # de la table : le dépôt la porte, aucun outil ne la produit, et
                # c'est voulu.
                if source is None:
                    manquants.append(rel)
            elif empreinte(ici) == empreinte(la):
                identiques.append(rel)
                if source is not None:
                    sources_trahies.append((rel, source))
            else:
                differents.append(rel)
                if source is not None:
                    sources_trahies.append((rel, source))

        # 3. les écarts déclarés, dans les deux sens
        declares = set(ECARTS_PERMANENTS)
        attendus = {e for e in declares if e in produits and e in commites}
        differents_nus = [d for d in differents if d not in declares]
        # ⚠⚠ L'ASSERTION INVERSE : un écart déclaré qui s'est remis à se
        # reproduire n'est plus un écart, et sa ligne doit partir.
        reconcilies = sorted(e for e in attendus if e in identiques)

        # 3. les atlas, par leur propre vérificateur
        #
        # ⚠⚠ APRÈS LA COMPARAISON, ET C'EST UNE CORRECTION TROUVÉE PAR LA
        # DÉMONSTRATION 2 DU BRIEF. Ce contrôle passait AVANT : retirer un sprite
        # commité faisait échouer `atlas.py` — son effectif ne collait plus — et
        # le vérificateur s'arrêtait là, sans jamais rendre le MANQUANT qu'on lui
        # demandait de voir. Un contrôle secondaire qui masque le verdict
        # principal est pire qu'un contrôle absent.
        #
        # ⚠ IL A DEUX FAÇONS DE MAL FINIR, ET ELLES NE SE DISENT PAS PAREIL. Un
        # effectif qui ne colle plus le fait SORTIR EN 1 avec « ATLAS EN ÉCHEC » ;
        # un atlas simplement périmé le fait sortir en 0 en le DISANT dans sa
        # ligne de résumé. On lit donc le code ET la ligne — et on exige d'avoir
        # trouvé la ligne, sans quoi un reformatage de sa sortie rendrait ce
        # contrôle-ci muet pour toujours.
        atlas_faute = atlas_casse = False
        atlas_sortie = ''
        if not a.outil:
            code, atlas_sortie = jouer('atlas', ['--verifier'], temporaire)
            resume = [l for l in atlas_sortie.splitlines()
                      if l.startswith('atlas identiques :')]
            if code != 0 or len(resume) != 1:
                atlas_casse = True
            else:
                atlas_faute = ('différents : 0' not in resume[0]
                               or 'nouveaux : 0' not in resume[0])

        duree = time.time() - depart
        print()
        # ⚠ « MANQUANT » SE LIT DANS LE SENS DE LA CHAÎNE, ET LE MOT PEUT
        # TROMPER : c'est le dépôt qui porte le fichier et la chaîne qui ne le
        # produit pas — un orphelin, pas un trou. Son symétrique, « NOUVEAU »,
        # est le fichier que la chaîne produit et que le dépôt n'a pas. La
        # légende est imprimée pour qu'on ne l'apprenne pas de travers.
        print('identiques : le dépôt et la chaîne s\'accordent à l\'octet')
        print('différents : les deux l\'ont, ils ne sont pas les mêmes')
        print('nouveaux   : la chaîne le produit, le dépôt ne l\'a pas')
        print('MANQUANTS  : le dépôt le porte, aucun outil ne le produit —')
        print('             hors sources déclarées, qui sont dans ce cas EXPRÈS')
        print()
        print(f'identiques à l\'octet : {len(identiques)}')
        print(f'différents           : {len(differents)}')
        print(f'nouveaux             : {len(nouveaux)}')
        print(f'MANQUANTS            : {len(manquants)}')
        print(f'durée                : {duree:.1f} s')
        for rel in differents_nus:
            print('  DIFFÈRE  ', rel)
        for rel in sorted(d for d in differents if d in declares):
            print('  écart déclaré ', rel, '—', ECARTS_PERMANENTS[rel])
        for rel in nouveaux:
            print('  NOUVEAU  ', rel)
        for rel in manquants:
            print('  MANQUANT ', rel)
        for rel in reconcilies:
            print('  ⚠ ÉCART DÉCLARÉ QUI SE REPRODUIT MAINTENANT :', rel)
            print('    il n\'est plus un écart — retirer sa ligne d\'ECARTS_PERMANENTS')
        for rel, cle in sources_trahies:
            print('  ⚠ SOURCE DÉCLARÉE QUE LA CHAÎNE PRODUIT MAINTENANT :', rel)
            print(f'    couverte par « {cle} » — la déclaration est périmée, retirer sa ligne')

        if a.outil:
            print('  (MANQUANTS non calculable pour un seul outil — voir le commentaire)')
        if atlas_faute:
            print('  ATLAS    un atlas cousu ne correspond plus à ses sprites '
                  '— relancer `python3 tools/atlas.py --ecrire`')
        if atlas_casse:
            print('  ATLAS    `atlas.py --verifier` n\'a pas pu conclure — sa sortie :')
            for ligne in atlas_sortie.rstrip().splitlines():
                print('      ' + ligne)

        faute = bool(differents_nus or nouveaux or manquants or reconcilies
                     or sources_trahies or atlas_faute or atlas_casse)
        print()
        print('VERDICT : la chaîne ne répond pas de ses sprites' if faute
              else 'VERDICT : la chaîne répond de ses sprites')
        return 1 if faute else 0
    finally:
        shutil.rmtree(temporaire, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
