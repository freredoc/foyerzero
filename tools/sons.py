#!/usr/bin/env python3
"""Les sons du jeu : un master WAV, un fichier Opus au poids d'un livrable.

⚠⚠ LES 263 ENTRENT — lot SON-CATALOGUE, 04/09. L'outil n'écrit plus une table
à la main : il la DÉRIVE du manifeste du pack. À quatre entrées une table
recopiée se relisait ; à 263 elle serait une copie qui vieillit, et le dépôt a
déjà payé ce motif trois fois.

⚠⚠ ET IL ÉCRIT AUSSI `src/data/sons.js`, MAIS SEULEMENT SOUS `--ecrire`. C'est
le motif exact de `tools/atlas.py`, et il a la même raison : `tools/verifier.py`
déroute `FZ_SPRITES` sur un dossier temporaire pour rejouer la chaîne, mais
`src/data/` n'est PAS déroutable. Sans ce drapeau, le vérificateur réécrirait
un fichier de `src/` à chaque exécution — « un contrôle qui écrit là où il
compare est un piège ».

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
import re
import shutil
import subprocess
import sys
import wave
import zlib

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
from chemins import dossier_sprites  # noqa: E402

SRC = os.path.join(RACINE, 'art', 'sources')
MANIFESTE = os.path.join(SRC, 'sfx_manifest.json')
DST = dossier_sprites('son')

# Le niveau de compression de l'encodeur : 10 est le plus lent et le plus
# efficace. Sur quatre fichiers de moins d'une seconde, « lent » est
# imperceptible ; sur le catalogue il faudra le remesurer.
COMPRESSION = 10

# ⚠⚠ LE PALIER EST 20 kbps POUR LES 263, ET C'EST UN ARBITRAGE D'ETHAN, TRANCHÉ
# À L'OREILLE sur le haut-parleur du téléphone, qui est l'appareil de sortie
# réel : aucune différence audible entre 20 et 24, différence audible en
# dessous. **Ne pas descendre sous 20 pour gagner des octets.**
DEBIT_PAR_DEFAUT = 20

# ⚠⚠ LA QUALITÉ RESTE PAR ENTRÉE, MÊME QUAND ELLES VALENT TOUTES PAREIL — c'est
# la leçon de `tools/fonds.py`, dont la constante GLOBALE avait failli réécrire
# un fond qu'un autre lot ne touchait pas. Cette table est vide aujourd'hui ;
# elle existe pour qu'un lot futur puisse changer UN débit sans toucher aux 262
# autres octets du livrable.
DEBITS_PARTICULIERS = {}


def debit_de(ident):
    return DEBITS_PARTICULIERS.get(ident, DEBIT_PAR_DEFAUT)


def serie_de(ident):
    """Le numéro de série Ogg d'un son, dérivé de son identifiant.

    ⚠⚠ SANS `--serial`, RIEN N'EST REPRODUCTIBLE — mesuré au lot SON-MOTEUR :
    le numéro de série du flux Ogg est TIRÉ AU HASARD, donc deux exécutions
    rendent des SHA-256 différents et `tools/verifier.py` dirait « 263
    différents » à chaque passage, pour toujours.

    ⚠⚠ ET IL SE DÉRIVE DU NOM, JAMAIS DU RANG. Un numéro pris dans l'ordre de la
    table changerait celui de TOUS les sons qui suivent le jour où une entrée
    s'insère au milieu : deux cent soixante-trois fichiers réécrits pour un son
    ajouté. `crc32` d'un identifiant est stable d'une version de Python à
    l'autre — au contraire de `hash()`, qui est randomisé par processus.
    """
    return zlib.crc32(ident.encode('utf-8'))


def table_des_sons():
    """La table de production, DÉRIVÉE du manifeste et non recopiée.

    Rend une liste de dictionnaires triée par identifiant, pour que l'ordre ne
    dépende pas de celui du JSON.

    ⚠ LA SOURCE SE NOMME `<id>.wav`, SANS PRÉFIXE. Les quatre témoins du lot
    SON-MOTEUR étaient entrés sous `son_<id>.wav` ; le pack complet emploie le
    nom du manifeste, et les 263 le suivent. Les quatre anciens restent au
    dépôt — `art/sources/` ne s'ampute jamais — et passent en `dormantes`,
    exactement comme les planches de la v1 au lot MURS. **Vérifié à l'octet :
    les quatre doublons sont identiques**, donc rien de ce que la chaîne produit
    ne dépend du nom qu'on lit.
    """
    with open(MANIFESTE, encoding='utf-8') as f:
        pack = json.load(f)
    table = [{
        'source': s['id'] + '.wav',
        'nom': s['id'],
        'debit': debit_de(s['id']),
        'serie': serie_de(s['id']),
        'duree_ms': s['duration_ms'],
        'canaux': s['channels'],
        'echantillonnage': s['sample_rate'],
    } for s in pack['sounds']]
    table.sort(key=lambda e: e['nom'])
    series = {e['serie'] for e in table}
    if len(series) != len(table):
        raise SystemExit('collision de numéro de série Ogg : %d séries pour %d sons'
                         % (len(series), len(table)))
    return table


COMMENTAIRE = (
    'FICHIER GÉNÉRÉ par « python3 tools/sons.py ». Les sons sont en Opus et '
    'Node n\'a pas de décodeur Opus ; ce manifeste est ce que la suite JS peut '
    'encore mesurer sur eux — au premier chef leur DURÉE, dont src/data/sons.js '
    'dérive le plafond de voix. Même motif que art/sprites/fond/'
    'fond-empreintes.json depuis le lot MUR-PEINT.'
)


EN_TETE_JS = """// Les 263 sons du pack, et la table de mixage qui les reçoit.
//
// ⚠⚠ FICHIER GÉNÉRÉ par « python3 tools/sons.py --ecrire ». NE PAS MODIFIER À
// LA MAIN : la moindre retouche serait effacée au prochain lot d'art, sans
// bruit. Tout ce qui est ici est DÉRIVÉ d'`art/sources/sfx_manifest.json`, sauf
// les cinq bus et les réglages par défaut, qui viennent du brief et sont écrits
// dans le générateur.
//
// ⚠⚠ ET C'EST L'INVERSE DU LOT SON-MOTEUR, QUI TRANSCRIVAIT QUATRE LIGNES À LA
// MAIN. À quatre entrées une transcription se relit et un test la confronte ; à
// 263 elle serait une copie qui vieillit — le motif que ce dépôt a déjà payé
// trois fois. Le manifeste reste néanmoins CONFRONTÉ : un test rejoue la
// dérivation en JavaScript et compare, si bien que la génération ne peut pas
// mentir sans qu'on le voie.
//
// ⚠ UNE SEULE FAMILLE EST CÂBLÉE — `ui`. Les 240 autres sons sont encodés,
// livrés et jouables ; aucun événement du jeu ne les demande, et on n'en invente
// aucun pour leur donner un usage."""

COMMENTAIRE_SONS = """/**
 * Un son : son bus, et ce que le manifeste dit de lui.
 *
 * ⚠ LE NOM DU MASTER WAV N'EST PAS ICI, ET C'EST VOULU. Le jeu ne voit jamais
 * un WAV — il reçoit un `.opus` déjà encodé, sous un `data:`. Le nom du master
 * est un fait de PRODUCTION : il vit dans `tools/sons.py`, qui est le seul à
 * l'ouvrir.
 *
 * `dureeMs` sert au moteur de voix — une instance est « en cours » tant que sa
 * durée n'est pas écoulée —, donc elle ne peut pas être décorative : un chiffre
 * faux ici plafonnerait trop tôt ou trop tard.
 *
 * ⚠ `maxInstances` EST PAR FICHIER, `gardeMs` EST PAR ÉVÉNEMENT — voir
 * `EVENEMENTS` ci-dessous, qui dit pourquoi et sur quelle mesure.
 *
 * ⚠ LE DRAPEAU `loop` DU MANIFESTE N'EST PAS REPORTÉ, ET C'EST DÉCLARÉ. Rien ne
 * le lirait aujourd'hui : le seul mécanisme qui en aurait besoin — une ambiance
 * qui tourne en fond — n'est pas câblé, et 263 champs qu'aucun code ne lit
 * seraient du poids mort dans un livrable qui se compte à l'octet. Une ligne du
 * générateur à ajouter le jour où une ambiance jouera.
 *
 * ⚠⚠ `residente` DIT CE QUI RESTE DÉCODÉ, ET C'EST LE POINT DUR DU LOT. Un son
 * décodé ne pèse plus rien de ce que pèse son fichier : le navigateur le range
 * en Float32 à 48 kHz, donc les 336,8 secondes du pack vaudraient **64,7 Mo
 * décodés** contre 890 417 octets de fichiers — soixante-treize fois. Les huit
 * ambiances, seules à tourner en boucle en permanence, portent le drapeau et
 * restent en mémoire une fois décodées : 64 s, **12,3 Mo**. Les 255 autres sont
 * relâchées quand le budget de `src/ui/son.js` est atteint.
 *
 * ⚠ ELLE COÏNCIDE AUJOURD'HUI AVEC `bus === 'ambiances'`, ET CE N'EST PAS LA
 * MÊME CHOSE. Le bus est un NIVEAU de mixage, la résidence une décision de
 * MÉMOIRE ; les lire l'un pour l'autre marcherait tant que les deux tables
 * coïncident, et mentirait le jour où une boucle de machinerie serait mise à
 * demeure sans changer de bus.
 */"""

COMMENTAIRE_EVENEMENTS = """/**
 * Ce que le JEU demande : un événement, qui porte une ou plusieurs variantes.
 *
 * ⚠⚠ LE TEMPS DE GARDE EST UNE PROPRIÉTÉ DE L'ÉVÉNEMENT, PAS DU FICHIER, ET
 * SANS ÇA IL NE MORDRAIT PAS. Le manifeste l'attribue au fichier ; or un clic a
 * DEUX variantes, donc une garde par fichier laisserait passer deux clics à
 * quarante millisecondes d'écart dès que le tirage change de variante — c'est
 * précisément le cas que la garde existe pour refuser.
 *
 * ⚠ ET LE CHOIX NE COÛTE RIEN, PARCE QUE C'EST MESURÉ. Sur les 263 entrées,
 * 54 groupes portent plusieurs variantes, et **zéro** d'entre eux ne porte deux
 * `recommended_cooldown_ms` différents — ni deux `recommended_max_instances`,
 * ni deux `recommended_volume_db`, ni deux catégories. « Par fichier » et « par
 * événement » décrivent donc la même table ; lire par événement ne change
 * aucune valeur, et rend la garde falsifiable.
 *
 * ⚠⚠ ET LE NOM D'UN ÉVÉNEMENT EST CELUI DU PACK, AMPUTÉ DE SON RANG DE
 * VARIANTE. Le lot SON-MOTEUR les nommait en français — `ui_clic`, `ui_refus`,
 * `ui_bascule` : trois noms se relisent, cent trente-cinq demanderaient une
 * table de correspondance écrite à la main, c'est-à-dire la transcription que
 * ce lot retire.
 */"""

COMMENTAIRE_REGLAGES = """/**
 * Les réglages par défaut, au premier démarrage.
 *
 * ⚠ LE SON EST ACTIF PAR DÉFAUT — arbitrage d'Ethan : « une fonction muette par
 * défaut n'est jamais testée ». Le volume est un facteur linéaire de 0 à 1
 * appliqué APRÈS les décibels du bus.
 */"""


def lire_le_master(chemin, entree):
    """Ouvre le WAV, vérifie ce que le MANIFESTE dit de lui, rend sa durée.

    ⚠⚠ CETTE OUVERTURE N'EST PAS DÉCORATIVE, ET ELLE A DEUX RAISONS. D'abord
    elle VÉRIFIE : `opusenc` accepterait un 48 kHz ou une durée autre sans rien
    dire, et la durée que `src/data/sons.js` porte cesserait d'être vraie.
    Ensuite elle DÉCLARE : `tools/entrees.py` classe une source « consommée »
    d'après ce que la chaîne OUVRE réellement, sous un mouchard ; `opusenc` est
    un sous-processus, donc sa lecture à lui est invisible. Sans cette ligne,
    les 263 masters seraient classés « dormants » alors qu'un outil les
    consomme.

    ⚠⚠ ET LE NOMBRE DE CANAUX SE CONFRONTE AU MANIFESTE, IL NE S'IMPOSE PLUS.
    Le lot SON-MOTEUR écrivait `!= 1` en dur, au motif que « le pack est mono » ;
    c'était vrai des quatre témoins et FAUX du pack — mesuré, **quatorze masters
    sont stéréo** : les huit ambiances et les six passages d'aéronef. Le
    manifeste les déclare (`channels`), et c'est lui qui fait foi (§1) ; l'outil
    vérifie donc l'ACCORD entre le fichier et sa déclaration, ce qui attrape la
    faute qui peut vraiment arriver — une source remplacée sans que sa ligne
    suive.

    ⚠ ET LA SORTIE RESTE MONO, ELLE, PARCE QUE C'EST L'ARBITRAGE D'ETHAN :
    « tout en mono, ambiances comprises ». `--downmix-mono` le fait, et
    `verifier_la_sortie` le VÉRIFIE sur le `.opus` produit — sur l'artefact qui
    part au joueur, pas sur le master. Un invariant se garde là où il compte.
    """
    with wave.open(chemin, 'rb') as w:
        if w.getnchannels() != entree['canaux']:
            raise SystemExit('%s : %d canaux, le manifeste en déclare %d'
                             % (chemin, w.getnchannels(), entree['canaux']))
        if w.getframerate() != entree['echantillonnage']:
            raise SystemExit('%s : %d Hz, le manifeste en déclare %d'
                             % (chemin, w.getframerate(), entree['echantillonnage']))
        duree = round(w.getnframes() / w.getframerate() * 1000)
    if duree != entree['duree_ms']:
        raise SystemExit('%s : %d ms mesurées, %d attendues — src/data/sons.js '
                         'plafonnerait les voix sur une durée fausse'
                         % (chemin, duree, entree['duree_ms']))
    return duree


def verifier_la_sortie(chemin, octets):
    """Lit l'en-tête OpusHead du fichier produit et exige UNE voie.

    ⚠⚠ C'EST LA SEULE MESURE QUI PORTE SUR CE QUI PART AU JOUEUR. Quatorze
    masters sont stéréo ; `--downmix-mono` les ramène à une voie, et sans cette
    lecture-ci, retirer ce drapeau doublerait le poids de quatorze fichiers sans
    qu'une seule ligne ne tombe. L'en-tête OpusHead range le nombre de voies au
    neuvième octet après sa signature — c'est le format, pas une heuristique.
    """
    marque = octets.find(b'OpusHead')
    if marque < 0:
        raise SystemExit('%s : pas d\'en-tête OpusHead' % chemin)
    voies = octets[marque + 9]
    if voies != 1:
        raise SystemExit('%s : %d voies en sortie, l\'arbitrage est « tout en '
                         'mono, ambiances comprises »' % (chemin, voies))


# ⚠⚠ LE BUDGET DE MÉMOIRE DÉCODÉE, EN SECONDES, HORS RÉSIDENTES. Trente
# secondes valent `30 × 48 000 × 4 = 5 760 000` octets — la traduction est
# exacte, c'est la définition du Float32 à 48 kHz. Le plafond total du jeu est
# donc 12,3 Mo d'ambiances plus 5,8 Mo, soit **18,1 Mo**, contre 64,7 si tout
# était décodé.
#
# ⚠ ET IL SE COMPTE EN SECONDES, PAS EN FICHIERS. Les sons vont de 44 ms à 8 s :
# un plafond « au plus N sons » bornerait la mémoire à un facteur cent
# quatre-vingts près, ce qui n'est pas une borne. ⚠ Trente secondes tiennent
# aussi la famille `ui` ENTIÈRE — 23 sons, 6,42 s mesurées — donc tant qu'elle
# est la seule câblée, rien n'est jamais évincé et aucun clic ne se redécode.
BUDGET_SECONDES_DECODEES = 30

COMMENTAIRE_MEMOIRE = """/**
 * Ce que le jeu s'autorise à garder décodé, en secondes, hors résidentes.
 *
 * ⚠⚠ UN SON DÉCODÉ NE PÈSE PLUS RIEN DE CE QUE PÈSE SON FICHIER. Le navigateur
 * le range en Float32 à 48 kHz : les 336,8 secondes du pack vaudraient
 * **64,7 Mo décodés** contre 890 417 octets de fichiers. Ce nombre ne se voit
 * ni dans le HTML, ni au démarrage, et c'est pour ça qu'il est écrit ici.
 *
 * ⚠ EN SECONDES, PAS EN FICHIERS : `secondes × 48 000 × 4` donne les octets, et
 * c'est la mémoire qu'on défend. Un plafond « au plus N sons » ne bornerait
 * rien, les durées allant de 44 ms à 8 s.
 *
 * ⚠ TRENTE SECONDES VALENT 5,8 Mo, DONC 18,1 Mo AVEC LES HUIT AMBIANCES. Et
 * elles tiennent la famille `ui` entière — 23 sons, 6,42 s — donc tant qu'elle
 * est la seule câblée, rien n'est jamais évincé.
 */"""

BUS_PAR_CATEGORIE = {
    # Les cinq que le brief nomme, et leur famille évidente.
    'ui': 'interface',
    'weapons': 'armes',
    'impacts': 'impacts',
    'movement': 'moteurs',
    'ambiences': 'ambiances',
    # ⚠⚠ ET LES QUATRE QUE LE BRIEF NE NOMME PAS. Il n'y a pas de sixième bus —
    # on n'en invente pas — donc chacune est rattachée au plus PROCHE PAR
    # NATURE, et c'est une proposition, pas un arbitrage : une explosion est un
    # impact ; un bâtiment est de la machinerie qui tourne (alarmes,
    # construction, usine, réparation, réacteur — neuf boucles sur vingt et un) ;
    # une alerte et un ordre sont des retours faits AU JOUEUR, donc de
    # l'interface. Ethan tranche ; ces quatre lignes se changent seules.
    'explosions': 'impacts',
    'buildings': 'moteurs',
    'alerts': 'interface',
    'orders': 'interface',
}

# Les cinq bus, en décibels. ⚠ Ils ne sont PAS dans le manifeste — vérifié, il
# n'y porte aucune clé contenant « bus », « mix », « master » ou « gain ». Ils
# viennent du brief, qui les donne comme la recommandation du pack : leur source
# est la parole d'Ethan, pas un fichier du dépôt.
BUS = {
    'interface': -3,
    'armes': -6,
    'impacts': -7,
    'moteurs': -12,
    'ambiances': -18,
}


# ⚠⚠ CE QUI RESTE DÉCODÉ, ET RIEN D'AUTRE. Un son décodé ne pèse plus rien de ce
# que pèse son fichier : le navigateur le range en Float32 à 48 kHz, si bien que
# les 336,8 secondes du pack feraient **64,7 Mo décodés** contre 890 Ko de
# fichiers. Les huit ambiances sont les seules qui tournent en boucle en
# permanence — 64 s, 12,3 Mo — et les redécoder à chaque tour serait absurde ;
# les 255 autres n'ont aucune raison de rester en mémoire une fois jouées.
#
# ⚠ C'EST UNE FAMILLE, PAS UNE LISTE DE HUIT NOMS. Une ambiance ajoutée demain
# hérite de la règle ; huit noms recopiés l'oublieraient.
FAMILLES_RESIDENTES = {'ambiences'}


def base_evenement(ident):
    """Le nom d'ÉVÉNEMENT d'un son : son identifiant sans son rang de variante.

    ⚠⚠ ON DÉRIVE, ON NE TRADUIT PAS. Le lot SON-MOTEUR nommait ses trois
    événements en français — `ui_clic`, `ui_refus`, `ui_bascule` — ce qui se
    relit à trois et ne se dérive pas à cent trente-cinq : il aurait fallu une
    table de correspondance écrite à la main, c'est-à-dire très exactement la
    transcription que ce lot existe pour retirer. Le nom d'un événement est donc
    celui du pack, amputé du `_NN` qui distingue ses variantes.

    ⚠ ET LE DÉCOUPAGE SE VÉRIFIE, IL NE SE SUPPOSE PAS : mesuré sur les 263,
    les 135 groupes ainsi formés portent des `variant` numérotés 1..n sans un
    trou, et **aucun** ne porte deux `recommended_cooldown_ms`, deux
    `recommended_max_instances`, deux `recommended_volume_db` ou deux
    `category` différents. Un test rejoue ce compte.
    """
    return re.sub(r'_\d+$', '', ident)


def ecrire_la_table(pack):
    """Écrit `src/data/sons.js` : 263 sons et 135 événements, dérivés.

    ⚠⚠ SEULEMENT SOUS `--ecrire`, ET C'EST LE MOTIF DE `tools/atlas.py`.
    `tools/verifier.py` déroute `FZ_SPRITES` sur un dossier temporaire pour
    rejouer la chaîne ; `src/data/` n'est PAS déroutable. Sans ce drapeau, le
    vérificateur réécrirait un fichier de `src/` à chaque exécution — « un
    contrôle qui écrit là où il compare est un piège ».
    """
    sons = sorted(pack['sounds'], key=lambda s: s['id'])
    groupes = {}
    for s in sons:
        groupes.setdefault(base_evenement(s['id']), []).append(s)

    for nom, membres in groupes.items():
        rangs = sorted(m['variant'] for m in membres)
        if rangs != list(range(1, len(membres) + 1)):
            raise SystemExit('%s : variantes %s, attendu 1..%d'
                             % (nom, rangs, len(membres)))
        for champ in ('recommended_cooldown_ms', 'recommended_max_instances',
                      'recommended_volume_db', 'category'):
            if len({m[champ] for m in membres}) > 1:
                raise SystemExit('%s : deux %s différents dans un même groupe — '
                                 'le temps de garde est porté par l\'ÉVÉNEMENT, '
                                 'donc il doit être unique par groupe' % (nom, champ))

    lignes = [EN_TETE_JS, '', COMMENTAIRE_MEMOIRE,
              'export const MEMOIRE = { budgetSecondesDecodees: %d };'
              % BUDGET_SECONDES_DECODEES, '',
              'export const BUS = {']
    for bus, db in BUS.items():
        lignes.append('  %s: %d,' % (bus, db))
    lignes += ['};', '', COMMENTAIRE_SONS, 'export const SONS = {']
    for s in sons:
        categorie = s['category']
        if categorie not in BUS_PAR_CATEGORIE:
            raise SystemExit('%s : catégorie « %s » sans bus — en inventer un '
                             'serait choisir seul un niveau de mixage'
                             % (s['id'], categorie))
        residente = ', residente: true' if categorie in FAMILLES_RESIDENTES else ''
        lignes.append("  %s: { bus: '%s', dureeMs: %d, maxInstances: %d, volumeDb: %s%s },"
                      % (s['id'], BUS_PAR_CATEGORIE[categorie], s['duration_ms'],
                         s['recommended_max_instances'],
                         nombre_js(s['recommended_volume_db']), residente))
    lignes += ['};', '', COMMENTAIRE_EVENEMENTS, 'export const EVENEMENTS = {']
    for nom in sorted(groupes):
        membres = sorted(groupes[nom], key=lambda m: m['variant'])
        variantes = ', '.join("'%s'" % m['id'] for m in membres)
        lignes.append('  %s: { variantes: [%s], gardeMs: %d },'
                      % (nom, variantes, membres[0]['recommended_cooldown_ms']))
    lignes += ['};', '', COMMENTAIRE_REGLAGES,
               'export const REGLAGES_PAR_DEFAUT = { muet: false, volume: 0.7 };', '']

    chemin = os.path.join(RACINE, 'src', 'data', 'sons.js')
    with open(chemin, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lignes))
    print('src/data/sons.js : %d sons, %d événements, %d octets'
          % (len(sons), len(groupes), os.path.getsize(chemin)))


def nombre_js(x):
    """Rend un nombre du manifeste sans le zéro décimal des flottants Python."""
    return str(int(x)) if float(x) == int(x) else repr(float(x))


def main():
    ecrire = '--ecrire' in sys.argv[1:]
    if shutil.which('opusenc') is None:
        raise SystemExit('opusenc est absent : « apt-get install opus-tools »')
    os.makedirs(DST, exist_ok=True)
    table = table_des_sons()
    empreintes = {}
    for entree in table:
        chemin = os.path.join(SRC, entree['source'])
        duree = lire_le_master(chemin, entree)
        sortie = os.path.join(DST, entree['nom'] + '.opus')
        subprocess.run(
            ['opusenc', '--quiet',
             '--bitrate', str(entree['debit']),
             '--padding', '0',
             '--serial', str(entree['serie']),
             '--downmix-mono',
             '--comp', str(COMPRESSION),
             chemin, sortie],
            check=True,
        )
        with open(sortie, 'rb') as f:
            octets = f.read()
        verifier_la_sortie(sortie, octets)
        empreintes[entree['nom']] = {
            'debit_kbps': entree['debit'],
            'duree_ms': duree,
            'octets': len(octets),
            'serie': entree['serie'],
            'sha256': hashlib.sha256(octets).hexdigest(),
        }

    with open(os.path.join(DST, 'son-empreintes.json'), 'w', encoding='utf-8') as f:
        json.dump({'commentaire': COMMENTAIRE, 'sons': empreintes},
                  f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print('%d fichiers écrits, %d octets en tout'
          % (len(table), sum(e['octets'] for e in empreintes.values())))

    if ecrire:
        with open(MANIFESTE, encoding='utf-8') as f:
            ecrire_la_table(json.load(f))
    return 0


if __name__ == '__main__':
    sys.exit(main())
