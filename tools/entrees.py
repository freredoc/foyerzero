#!/usr/bin/env python3
"""Quelles sources la chaîne LIT-elle vraiment ?

⚠⚠ CE QUE CE FICHIER EXISTE POUR EMPÊCHER. `art/sources/` porte 165 fichiers et
la chaîne n'en ouvre que la moitié : les `P2.x` remplacés par les `P2_x`, `M3` et
`M4` remplacés par leurs `_v2`, les `_ancien_connecte_ECARTE`, les `_original`.
**Rien ne distingue une source vive d'une source morte en la regardant**, et de
nouvelles images arrivent qui ne doivent PAS entrer dans la chaîne pour
l'instant. Sans garde, elles rejoignent les dormantes et personne ne sait plus
lesquelles comptent.

    python3 tools/entrees.py --declarer   # ⚠ à la main, et à la main seulement
    python3 tools/entrees.py --verifier   # ce que `tools/verifier.py` appelle

⚠⚠ LES DEUX MODES NE DOIVENT JAMAIS SE CONFONDRE, ET C'EST TOUT LE SUJET. Une
garde qui RÉGÉNÈRE la déclaration puis la compare à ce qu'elle vient d'écrire ne
peut pas échouer. La déclaration est une INTENTION commitée ; la trace est un
FAIT d'exécution. Deux sources indépendantes, sinon rien — c'est la faute que ce
dépôt a déjà payée, et `--declarer` n'est appelé ni par `verifier.py`, ni par
`npm run check`, ni par un test. Un test l'asserte de face.

⚠⚠ « DORMANTE » NE VEUT PAS DIRE « MORTE ». Ces deux listes disent ce que la
CHAÎNE ouvre, et la chaîne n'est pas tout l'outillage : `tools/icone.py` lit
`icone_appli.png` et n'est pas dans `CHAINE` — il écrit dans `android/`, hors du
périmètre du vérificateur. Son fichier est donc déclaré dormant et il sert.
Aucune source n'est supprimée sur la foi de ce classement.

⚠ ET AUCUN SPRITE N'EST PRODUIT ICI. L'outil rejoue la chaîne dans un dossier
JETABLE, uniquement pour observer ce qu'elle ouvre ; ce qu'elle écrit est
détruit avec le dossier temporaire.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = os.path.join(RACINE, 'art', 'sources')
ATTENTE = os.path.join(RACINE, 'art', 'sourcesstandby')
DECLARATION = os.path.join(RACINE, 'art', 'sources-declarees.json')

# ⚠⚠ LA CHAÎNE SE LIT DANS `verifier.py`, ELLE NE SE RECOPIE PAS. Une seconde
# liste d'outils vieillirait au premier ajout, et la garde mesurerait alors une
# chaîne qui n'est plus celle qu'on joue.
#
# ⚠⚠ ET ON S'EN RETIRE SOI-MÊME, SINON LA RÉCURSION EST INFINIE. `entrees` est
# le dernier maillon de `CHAINE` ; rejouer `CHAINE` sans cette ligne ferait
# rejouer `entrees`, qui rejouerait `CHAINE`… Importer `verifier` ne LANCE rien —
# son `main()` est sous `if __name__ == '__main__'`.
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from verifier import CHAINE  # noqa: E402

OUTILS = [(nom, args) for nom, args in CHAINE if nom != 'entrees']

# Le mouchard, déposé sur le `PYTHONPATH` des outils rejoués. Python importe
# `sitecustomize` au démarrage de CHAQUE processus, donc il n'y a rien à changer
# dans les treize outils — et c'est la moitié qui compte : une garde qui
# demanderait aux outils de se déclarer eux-mêmes ne verrait pas celui qui
# oublie de le faire.
# ⚠⚠ ET IL SUIT MAINTENANT TROIS PORTES — lot SON-CATALOGUE, 04/09. La
# chaîne a cessé de n'ouvrir que des images : `tools/sons.py` lit des WAV. Une
# source qu'aucune porte ne surveille serait classée DORMANTE alors qu'un outil
# la consomme, c'est-à-dire exactement le mensonge que ce fichier existe pour
# empêcher.
#
# ⚠ ON ÉLARGIT À `wave.open`, PAS À `open`. La porte reste NOMMÉE : envelopper
# le `open` du langage attraperait les JSON, les fichiers temporaires et les
# sorties des outils eux-mêmes, et la trace ne voudrait plus rien dire. C'est
# l'exact pendant audio d'`Image.open`.
#
# ⚠⚠ ET LA TROISIÈME PORTE EST `json.load`, PARCE QUE LA CHAÎNE LIT MAINTENANT
# UNE SOURCE QUI N'EST NI UNE IMAGE NI UN SON : `art/sources/sfx_manifest.json`.
# `tools/sons.py` en DÉRIVE sa table de production — il n'écrit plus 263 lignes
# à la main —, donc c'est une source CONSOMMÉE au sens strict, et la laisser
# dormante serait le mensonge exact que ce fichier empêche. Elle reste NOMMÉE :
# `json.load` reçoit un fichier déjà ouvert, dont on lit le `name`, et tout ce
# qui n'est pas posé dans `art/sources/` est écarté au classement.
#
# ⚠ ET `opusenc` EST UN SOUS-PROCESSUS, DONC SA LECTURE EST INVISIBLE ICI.
# `tools/sons.py` ouvre chaque master avec `wave` pour VÉRIFIER ses paramètres —
# mono, 44,1 kHz, durée — et c'est cette ouverture-là que la trace voit. Le
# contrôle et la déclaration sont le même geste, ce qui est ce qui les tient
# d'accord : supprimer la vérification ferait basculer les quatre WAV en
# « dormants », et la garde tomberait.
MOUCHARD = '''import json
import os
import wave
from PIL import Image

def _noter(fp):
    try:
        chemin = os.path.abspath(fp if isinstance(fp, str) else getattr(fp, 'name', ''))
    except Exception:
        chemin = ''
    if chemin:
        with open(os.environ['FZ_TRACE'], 'a', encoding='utf-8') as f:
            f.write(chemin + chr(10))

_ouvrir_image = Image.open
def _trace_image(fp, *a, **k):
    _noter(fp)
    return _ouvrir_image(fp, *a, **k)
Image.open = _trace_image

_ouvrir_wave = wave.open
def _trace_wave(fp, *a, **k):
    _noter(fp)
    return _ouvrir_wave(fp, *a, **k)
wave.open = _trace_wave

_charger_json = json.load
def _trace_json(fp, *a, **k):
    _noter(fp)
    return _charger_json(fp, *a, **k)
json.load = _trace_json
'''


def fichiers_de(dossier):
    """Les fichiers à la RACINE d'un dossier, triés. Jamais récursif.

    ⚠ `art/sources/carte/` est un monde à part — des planches de terrain, deux
    `.md` et deux sous-dossiers — et le vérificateur le déclare déjà source. Le
    balayer ici mêlerait deux inventaires sans rapport.
    """
    if not os.path.isdir(dossier):
        return []
    return sorted(n for n in os.listdir(dossier)
                  if os.path.isfile(os.path.join(dossier, n)) and not n.startswith('.'))


def dans(dossier, chemin):
    """Le chemin est-il un fichier posé DIRECTEMENT dans ce dossier ?

    ⚠⚠ PAR LE DOSSIER PARENT, JAMAIS PAR UNE SOUS-CHAÎNE. `art/sourcesstandby`
    a `art/sources` pour PRÉFIXE : un `if 'art/sources' in chemin` rangerait
    chaque image en attente parmi les sources, et la garde qui existe pour les
    séparer les confondrait elle-même. C'est le mécanisme exact du défaut
    d'`os.listdir` que ce lot désarme par ailleurs.
    """
    return os.path.dirname(os.path.abspath(chemin)) == os.path.abspath(dossier)


def tracer():
    """Rejoue la chaîne sous le mouchard, et rend les noms qu'elle a ouverts.

    Rend `(consommees, attente_lues, hors_racine)` : ce qu'elle ouvre dans
    `art/sources/`, ce qu'elle ouvre dans le dossier d'attente — qui doit être
    vide —, et ce qu'elle ouvre ailleurs sous `art/sources/` (ses sous-dossiers).
    """
    boite = tempfile.mkdtemp(prefix='fz-entrees-')
    try:
        chemin_mouchard = os.path.join(boite, 'sitecustomize.py')
        with open(chemin_mouchard, 'w', encoding='utf-8') as f:
            f.write(MOUCHARD)
        trace = os.path.join(boite, 'trace.txt')
        open(trace, 'w').close()
        sprites = os.path.join(boite, 'sprites')
        os.makedirs(sprites)

        env = dict(os.environ)
        env['PYTHONPATH'] = boite + os.pathsep + env.get('PYTHONPATH', '')
        env['FZ_TRACE'] = trace
        env['FZ_SPRITES'] = sprites

        for nom, args in OUTILS:
            outil = os.path.join(RACINE, 'tools', nom + '.py')
            r = subprocess.run([sys.executable, outil] + list(args),
                               cwd=RACINE, env=env, capture_output=True, text=True)
            if r.returncode != 0:
                echec('%s sort en %d pendant la trace :\n%s'
                      % (nom, r.returncode, r.stderr.strip()[-2000:]))

        with open(trace, encoding='utf-8') as f:
            vus = [l.strip() for l in f if l.strip()]
    finally:
        shutil.rmtree(boite, ignore_errors=True)

    consommees, attente_lues, hors_racine = set(), set(), set()
    for chemin in vus:
        if dans(SOURCES, chemin):
            consommees.add(os.path.basename(chemin))
        elif dans(ATTENTE, chemin):
            attente_lues.add(os.path.basename(chemin))
        elif os.path.abspath(chemin).startswith(os.path.abspath(SOURCES) + os.sep):
            hors_racine.add(os.path.relpath(chemin, SOURCES))
    return sorted(consommees), sorted(attente_lues), sorted(hors_racine)


def declarer():
    """Écrit la déclaration depuis la trace — À LA MAIN, et jamais autrement."""
    consommees, attente_lues, hors_racine = tracer()
    presentes = fichiers_de(SOURCES)
    dormantes = [n for n in presentes if n not in set(consommees)]
    contenu = {
        'commentaire': (
            'FICHIER COMMITÉ, écrit par « python3 tools/entrees.py --declarer ». '
            'Il dit ce que la chaîne graphique OUVRE dans art/sources/. '
            '« dormante » veut dire « non ouverte par CHAINE », pas « morte » : '
            'tools/icone.py lit icone_appli.png et n\'est pas dans CHAINE. '
            'Aucune source n\'est supprimée sur la foi de ce classement.'
        ),
        'consommees': consommees,
        'dormantes': dormantes,
    }
    with open(DECLARATION, 'w', encoding='utf-8') as f:
        json.dump(contenu, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('déclaration écrite : %d consommées · %d dormantes · %d dans art/sources/'
          % (len(consommees), len(dormantes), len(presentes)))
    if attente_lues:
        print('  ⚠ la chaîne a ouvert %d fichier(s) du dossier d\'attente' % len(attente_lues))
    if hors_racine:
        print('  (hors racine, non classés : %s)' % ', '.join(hors_racine))
    return 0


def verifier():
    """Les trois assertions. Chacune attrape une faute distincte."""
    if not os.path.exists(DECLARATION):
        echec('art/sources-declarees.json est absent — le produire une fois par '
              '« python3 tools/entrees.py --declarer », puis le commiter.')
    with open(DECLARATION, encoding='utf-8') as f:
        declare = json.load(f)
    consommees_dec = list(declare.get('consommees', []))
    dormantes_dec = list(declare.get('dormantes', []))

    consommees, attente_lues, hors_racine = tracer()
    presentes = fichiers_de(SOURCES)
    fautes = []

    # 1. La trace est-elle celle qu'on a déclarée ? Attrape un fichier d'attente
    #    consommé par accident, et une source qui cesse d'être lue.
    entrees_de_trop = sorted(set(consommees) - set(consommees_dec))
    sorties_de_trace = sorted(set(consommees_dec) - set(consommees))
    for n in entrees_de_trop:
        fautes.append('OUVERTE ET NON DÉCLARÉE  %s' % n)
    for n in sorties_de_trace:
        fautes.append('DÉCLARÉE ET PLUS OUVERTE %s' % n)

    # 2. Tout fichier d'`art/sources/` est-il CLASSÉ ? C'est ce qui empêche le
    #    dossier de se remettre à pourrir : une image neuve doit être rangée
    #    d'un côté ou de l'autre, par un lot qui le dit.
    classees = set(consommees_dec) | set(dormantes_dec)
    for n in sorted(set(presentes) - classees):
        fautes.append('NI CONSOMMÉE NI DORMANTE %s' % n)
    for n in sorted(classees - set(presentes)):
        fautes.append('DÉCLARÉE ET ABSENTE      %s' % n)

    # 3. Le dossier d'attente est-il bien hors de la chaîne ?
    for n in attente_lues:
        fautes.append('LUE DANS L\'ATTENTE       %s' % n)

    print('art/sources/           %4d fichiers' % len(presentes))
    print('  consommées (trace)   %4d   déclarées %d' % (len(consommees), len(consommees_dec)))
    print('  dormantes (déduites) %4d   déclarées %d'
          % (len(presentes) - len(consommees), len(dormantes_dec)))
    print('art/sourcesstandby/    %4d fichiers, %d lu(s) par la chaîne'
          % (len(fichiers_de(ATTENTE)), len(attente_lues)))
    if hors_racine:
        print('  (sous-dossiers de art/sources/ ouverts : %s)' % ', '.join(hors_racine))

    if fautes:
        print()
        for f in fautes:
            print('  ' + f)
        print('\nENTRÉES EN ÉCHEC — %d écart(s). Une image neuve se CLASSE : '
              'la consommer par un lot qui le dit, ou la laisser en attente.' % len(fautes),
              file=sys.stderr)
        return 1
    print('\nVERDICT : la chaîne lit exactement les sources déclarées')
    return 0


def echec(message):
    print('\nENTRÉES EN ÉCHEC — %s' % message, file=sys.stderr)
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--declarer', action='store_true')
    ap.add_argument('--verifier', action='store_true')
    a = ap.parse_args()
    if a.declarer == a.verifier:
        ap.error('choisir --declarer ou --verifier')
    return declarer() if a.declarer else verifier()


if __name__ == '__main__':
    sys.exit(main())
