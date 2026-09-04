#!/usr/bin/env python3
"""Les sons du jeu : un master WAV, un fichier Opus au poids d'un livrable.

⚠⚠ QUATRE TÉMOINS, PAS LE CATALOGUE. Le pack d'Ethan porte 263 sons ; ce lot
pose le MOTEUR et quatre sons choisis pour l'exercer. Le palier de compression
du catalogue et le choix entre tout-inline et assets empaquetés ne sont pas
tranchés, et cet outil ne les préjuge pas : il encode ce que `SONS` nomme, et
`SONS` en nomme quatre.

⚠⚠ LA QUALITÉ EST PAR ENTRÉE, ET C'EST UNE LEÇON PAYÉE PAR `tools/fonds.py`.
Sa constante GLOBALE de qualité aurait réécrit `fond_offense`, un fichier qu'un
autre lot ne touchait pas, et fait tomber le vérificateur sur un octet que
personne n'avait voulu changer. Le débit vit donc dans la table, à côté du son
qu'il encode — même s'ils valent tous 24 aujourd'hui.

⚠⚠ ET LE NUMÉRO DE SÉRIE OGG EST OBLIGATOIRE, PARCE QUE SANS LUI LE RÉSULTAT
N'EST PAS REPRODUCTIBLE. Mesuré, pas supposé : deux exécutions d'`opusenc` sur
le même WAV avec les mêmes réglages rendent des SHA-256 DIFFÉRENTS — le numéro
de série du flux Ogg est tiré au hasard. `tools/verifier.py` compare à l'octet :
sans `--serial`, il aurait rendu « 4 différents » à chaque exécution, pour
toujours, et quelqu'un aurait fini par assouplir le vérificateur. Avec un numéro
fixe par son, deux exécutions rendent le même SHA-256 — mesuré aussi.

⚠ `--padding 0` VAUT 2 452 OCTETS SUR QUATRE FICHIERS, ET C'EST MESURÉ.
`opusenc` réserve 512 octets par fichier pour des métadonnées qu'on n'écrira
jamais : les quatre témoins passent de 6 042 à **3 590 octets**. Sur des sons
de 75 ms, le conteneur pèse plus que le son.

⚠⚠ LA GARANTIE À L'OCTET EST LIÉE À LA VERSION DE L'ENCODEUR, ET LE FICHIER LE
DIT LUI-MÊME. Chaque `.opus` porte dans ses `OpusTags` la chaîne
« libopus 1.4, libopusenc 0.2.1 », le nom d'`opus-tools` et la ligne de commande
complète : un changement de version de la bibliothèque, ou d'un seul réglage
d'encodage, change donc les octets PAR CONSTRUCTION. Ce n'est pas une fragilité
qu'on découvre, c'est une propriété qu'on peut lire dans le fichier — et le jour
où la version bougera, le vérificateur dira « différent » sur les quatre, ce qui
est exactement ce qu'il doit dire.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import wave

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
DST = dossier_sprites('son')

# Le niveau de compression de l'encodeur : 10 est le plus lent et le plus
# efficace. Sur quatre fichiers de moins d'une seconde, « lent » est
# imperceptible ; sur le catalogue il faudra le remesurer.
COMPRESSION = 10

# source, nom livré, débit en kbit/s, numéro de série Ogg.
#
# ⚠ LES QUATRE NUMÉROS DE SÉRIE SONT DISTINCTS ET ARBITRAIRES. Ogg s'en sert
# pour distinguer les flux d'un même fichier ; ici chaque fichier n'en porte
# qu'un, donc seule leur STABILITÉ compte. Les rendre égaux marcherait aussi et
# dirait quelque chose de faux — que c'est le même flux.
#
# ⚠ ET LA DURÉE ATTENDUE EST DANS LA TABLE, confrontée au WAV à chaque
# exécution. C'est elle que `src/data/sons.js` porte pour plafonner les voix :
# un master remplacé par un plus long ferait plafonner trop tôt, en silence.
SONS = [
    ('son_ui_click_01.wav',  'ui_click_01',  24, 1, 75),
    ('son_ui_click_02.wav',  'ui_click_02',  24, 2, 75),
    ('son_ui_error_01.wav',  'ui_error_01',  24, 3, 268),
    ('son_ui_toggle_on.wav', 'ui_toggle_on', 24, 4, 160),
]

COMMENTAIRE = (
    'FICHIER GÉNÉRÉ par « python3 tools/sons.py ». Les sons sont en Opus et '
    'Node n\'a pas de décodeur Opus ; ce manifeste est ce que la suite JS peut '
    'encore mesurer sur eux — au premier chef leur DURÉE, dont src/data/sons.js '
    'dérive le plafond de voix. Même motif que art/sprites/fond/'
    'fond-empreintes.json depuis le lot MUR-PEINT.'
)


def lire_le_master(chemin, duree_attendue_ms):
    """Ouvre le WAV, vérifie ce qu'on croit savoir de lui, rend sa durée.

    ⚠⚠ CETTE OUVERTURE N'EST PAS DÉCORATIVE, ET ELLE A DEUX RAISONS. D'abord
    elle VÉRIFIE : `opusenc` accepterait un stéréo ou un 48 kHz sans rien dire,
    et la durée que `src/data/sons.js` porte cesserait d'être vraie. Ensuite
    elle DÉCLARE : `tools/entrees.py` classe une source « consommée » d'après ce
    que la chaîne OUVRE réellement, sous un mouchard ; `opusenc` est un
    sous-processus, donc sa lecture à lui est invisible. Sans cette ligne, les
    quatre masters seraient classés « dormants » alors qu'un outil les consomme.
    """
    with wave.open(chemin, 'rb') as w:
        if w.getnchannels() != 1:
            raise SystemExit('%s : %d canaux, le pack est mono' % (chemin, w.getnchannels()))
        if w.getframerate() != 44100:
            raise SystemExit('%s : %d Hz, le pack est à 44 100' % (chemin, w.getframerate()))
        duree = round(w.getnframes() / w.getframerate() * 1000)
    if duree != duree_attendue_ms:
        raise SystemExit('%s : %d ms mesurées, %d attendues — src/data/sons.js '
                         'plafonnerait les voix sur une durée fausse'
                         % (chemin, duree, duree_attendue_ms))
    return duree


def main():
    if shutil.which('opusenc') is None:
        raise SystemExit('opusenc est absent : « apt-get install opus-tools »')
    os.makedirs(DST, exist_ok=True)
    empreintes = {}
    for source, nom, debit, serie, duree_ms in SONS:
        chemin = os.path.join(SRC, source)
        duree = lire_le_master(chemin, duree_ms)
        sortie = os.path.join(DST, nom + '.opus')
        subprocess.run(
            ['opusenc', '--quiet',
             '--bitrate', str(debit),
             '--padding', '0',
             '--serial', str(serie),
             '--downmix-mono',
             '--comp', str(COMPRESSION),
             chemin, sortie],
            check=True,
        )
        octets = os.path.getsize(sortie)
        with open(sortie, 'rb') as f:
            sha = hashlib.sha256(f.read()).hexdigest()
        empreintes[nom] = {
            'debit_kbps': debit,
            'duree_ms': duree,
            'octets': octets,
            'serie': serie,
            'sha256': sha,
        }
        print('  %-14s %2d kbps  %4d ms  %d o' % (nom, debit, duree, octets))

    with open(os.path.join(DST, 'son-empreintes.json'), 'w', encoding='utf-8') as f:
        json.dump({'commentaire': COMMENTAIRE, 'sons': empreintes},
                  f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print('%d fichiers écrits, %d octets en tout'
          % (len(SONS), sum(e['octets'] for e in empreintes.values())))
    return 0


if __name__ == '__main__':
    sys.exit(main())
