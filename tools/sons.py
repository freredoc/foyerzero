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
# ⚠⚠ LA CARTE DES UNITÉS ENTRE DANS LA CHAÎNE — lot SON-CÂBLAGE, 04/09. Elle
# était DORMANTE depuis le lot SON-MOTEUR ; ce lot la CONSOMME pour en dériver
# `BOUCLES_MOUVEMENT`. ⚠ Aucune porte n'a eu à être ajoutée à
# `tools/entrees.py` : la troisième, `json.load`, y est depuis le lot
# SON-CATALOGUE, et elle attrape ce fichier-ci sans qu'on la touche.
CARTE_UNITES = os.path.join(SRC, 'unit_audio_map.json')
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
// ⚠⚠ VINGT-QUATRE SONS SONT CÂBLÉS, ET LES 239 AUTRES SONT MUETS À DESSEIN.
// Le lot SON-CÂBLAGE branche ce qui avait DÉJÀ un point d'accroche dans le
// dépôt : cinq sons `ui`, trois ambiances d'écran, QUATRE boucles de roulement,
// deux boucles de machinerie, et les ponctuels de sélection, d'ordre, de pose et
// d'effondrement. **Aucun son de combat** — ni tir, ni impact, ni explosion : ils
// attendent un journal de `tick` qui n'existe pas, et ce journal est un chantier
// de SIMULATION. Aucun événement de jeu n'a été inventé pour donner un emploi à
// un son, et `src/sim/` n'a pas bougé d'une ligne. Ce qui reste muet est NOMMÉ
// dans `RAPPORT-lotSON-CABLAGE.md`, un par un, avec son motif."""

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
 * ⚠⚠ `boucle` EST LE DRAPEAU `loop` DU MANIFESTE, ET C'EST LA LIGNE QUE LE LOT
 * PRÉCÉDENT ANNONÇAIT. Il écrivait « une ligne du générateur à ajouter le jour
 * où une ambiance jouera » : ce jour est celui-ci. **Il n'est posé que sur les
 * 35 sons qui le portent**, jamais `boucle: false` sur les 228 autres — un
 * champ faux à 228 exemplaires pèserait dans un livrable qui se compte à
 * l'octet, et `!== true` se lit aussi bien que `=== false`.
 *
 * ⚠ ET IL NE SE DÉDUIT PAS DE `residente`. Vingt-sept boucles ne sont PAS
 * résidentes — les roulements, les moteurs, les machineries — et deux sons
 * `weapons` bouclent aussi. « Ce qui tourne » et « ce qui reste décodé » sont
 * deux questions ; les confondre ferait résider vingt-sept tampons de plus.
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

COMMENTAIRE_RAMPE = """/**
 * La rampe anti-claquement d'une boucle, en millisecondes.
 *
 * ⚠⚠ ELLE N'EST PAS DANS `MEMOIRE`, ET C'EST LA RÈGLE §4 DU DÉPÔT. Un budget de
 * mémoire et une durée de fondu sont deux grandeurs ; les ranger ensemble parce
 * qu'elles arrivent le même jour est très exactement ce qui a fait naître
 * `data/economie.js`.
 *
 * ⚠⚠ ET CE N'EST PAS LE FONDU QUE LE README DU PACK INTERDIT. Sa ligne 39 dit
 * « ne pas appliquer de fondu supplémentaire aux fichiers marqués `loop: true` ;
 * leurs bornes exactes sont fournies en échantillons ». Elle parle du FICHIER,
 * qu'on ne touche pas : la boucle rejoue ses bornes à l'échantillon près, sans
 * fondu. La rampe porte sur le GAIN DE LECTURE, au démarrage et à l'arrêt —
 * ailleurs, et sur autre chose. Sans elle, la forme d'onde saute de zéro à sa
 * valeur en un échantillon, et l'oreille entend un clic.
 */"""

COMMENTAIRE_CABLAGE = """/**
 * LES TABLES DU CÂBLAGE — ce que le JEU demande, et à quel son.
 *
 * ⚠⚠ ELLES SONT ICI PARCE QUE C'EST DU CALIBRAGE (§4), ET GÉNÉRÉES PARCE QUE
 * `sons.js` L'EST. Trois d'entre elles sont écrites à la main DANS
 * `tools/sons.py` — un écran, un type de bâtiment et deux seuils de PV ne se
 * dérivent d'aucun manifeste — mais elles y sont VÉRIFIÉES : le générateur
 * refuse un nom de son qui n'existe pas, et refuse une ambiance ou une boucle
 * de bâtiment qui ne serait pas marquée `loop` dans le manifeste.
 *
 * ⚠⚠ CELLES DES UNITÉS, ELLES, SONT DÉRIVÉES — ET ELLES NE S'INVENTENT PAS.
 * `ARME_PAR_PAIRE` et `DEPLOIEMENT_PAR_PAIRE` sortent
 * d'`art/sources/unit_audio_map.json`. Leur clé est la paire « nom joueur/nom
 * Ouvrage », qui est exactement ce que `UNITES[x].nom` porte : mesuré,
 * **quatorze paires sur quatorze se résolvent**. Le bloc `ouvrage` du même
 * fichier n'est PAS lu — ses sept clés ne sont aucun nom du dépôt, et attribuer
 * un son par ressemblance est nommément interdit ; le camp de l'Ouvrage s'obtient
 * par SUBSTITUTION `_player_` → `_ouvrage_`, vérifiée douze fois sur douze.
 */"""

COMMENTAIRE_ROULEMENT = """/**
 * Le roulement d'une pièce qui avance, PAR CHÂSSIS et par camp.
 *
 * ⚠⚠ PAR CHÂSSIS, PAS PAR UNITÉ, ET C'EST CE QUI LE REND TENABLE. Cinq
 * escouades partagent un bruit de bottes ; leur écrire cinq lignes ferait cinq
 * occasions de diverger. `src/son/cablage.js` compose la clé depuis
 * `UNITES[x].chassis` et `UNITES[x].comportementAerien`, qui sont la donnée qui
 * fait foi sur le classement des quatorze — jamais une liste recopiée.
 *
 * ⚠ UN `traversant` N'EST PAS ICI : il PASSE, donc il ne boucle pas. Son coup
 * est `PASSAGE_AERIEN`, et `movement_player_flyby` n'est pas marqué `loop` dans
 * le manifeste — c'est la donnée, pas une lecture.
 */"""

COMMENTAIRE_MOTEUR = """/**
 * Le moteur d'un blindé VIVANT ET IMMOBILE — l'autre moitié du roulement.
 *
 * ⚠⚠ ARBITRAGE D'ETHAN DU 04/09, ET C'EST LA MÊME LECTURE D'ÉTAT QUE LE
 * ROULEMENT, PRISE DANS L'AUTRE SENS. Une pièce qui a bougé au dernier tick
 * roule ; une pièce qui n'a pas bougé tourne au ralenti. Les deux se
 * réconcilient, aucune ne s'événementialise : un moteur qui tourne est un ÉTAT.
 *
 * ⚠ TROIS POIDS, ET CE SONT CEUX DES BLINDÉS — le pack n'en porte pas d'autres.
 * Une escouade n'a pas de moteur ; un aéronef stoppeur tient l'air, et son
 * `dard` couvre déjà ses deux états. Leur en attribuer un serait l'attribution
 * par ressemblance que le brief interdit.
 */"""

COMMENTAIRE_ARCHETYPE = """/**
 * Quel poids porte quel blindé, et lequel des deux dards porte quel stoppeur.
 *
 * ⚠⚠ TROIS DE CES SEPT LIGNES SE LISENT DANS LA CARTE, ET LE GÉNÉRATEUR LES Y
 * CONFRONTE : Ratisseur `tracks_light`, Fendeur `tracks_medium`, Broyeur
 * `tracks_heavy`. ⚠ Bélier et Pilon n'y portent qu'un `deploy` et aucun
 * roulement : ils prennent le moyen, c'est l'arbitrage d'Ethan du 04/09 — « un
 * blindé qui avance ne doit pas être muet ». Le partage des deux stoppeurs suit
 * leurs PV, 1 050 contre 1 800, et le pack n'a que deux dards.
 */"""

COMMENTAIRE_PASSAGE = """/**
 * Le passage d'un aéronef traversant — un COUP, jamais une boucle.
 *
 * ⚠ IL SONNE À L'APPARITION DE LA VAGUE, ET NULLE PART AILLEURS. C'est le seul
 * instant que le moteur publie où un aéronef « passe ». Le jouer à chaque tick
 * de déplacement demanderait un événement « l'aéronef traverse » qui n'existe
 * nulle part, et le rejouer en boucle inventerait une mécanique que le pack ne
 * demande pas — il ne marque d'ailleurs pas ce son `loop`.
 */"""

COMMENTAIRE_DEPLOIEMENT = """/**
 * Le déploiement d'une pièce qui se met en place — un COUP, à l'apparition.
 *
 * ⚠ DEUX UNITÉS SUR QUATORZE, ET CE SONT EXACTEMENT LES DEUX BLINDÉS QUE LA
 * CARTE LAISSAIT SANS ROULEMENT. Elles gardent leur `deploy` ET prennent le
 * roulement moyen : l'arbitrage d'Ethan ajoute, il ne remplace pas.
 */"""

COMMENTAIRE_ARMES = """/**
 * L'arme de chaque unité, dans les deux camps — DÉRIVÉE de la carte du pack.
 *
 * ⚠ DEUX DES DOUZE JEUX DISTINCTS NE SONT PAS DES `weapon_*` : Sapeurs et
 * Albatros tirent une EXPLOSION. C'est le pack qui le dit, et la substitution
 * `_player_` → `_ouvrage_` y marche à l'identique.
 */"""

COMMENTAIRE_ARME_DEFENSE = """/**
 * Ce que tire chacune des six défenses qui tirent — arbitrage d'Ethan, 04/09.
 *
 * ⚠⚠ C'EST UN TROU DE LA CARTE, ET IL EST MESURÉ : `unit_audio_map.json` ne
 * décrit que les quatorze UNITÉS, aucune de ses clés ne nomme une défense.
 * L'arme suit la colonne DOMINANTE et la portée, relevées dans `DEFENSES` —
 * casemate infanterie 20 à 2,5 · créneau véhicule 35 à 2,5 · batterie aviation
 * 40 à 2,5 · faucheuse infanterie 10 à 5,5 · mortier véhicule 12 à 5,5 · harpon
 * aviation 16 à 5,5 — et un test les REMESURE plutôt que de les croire.
 *
 * ⚠ MERLON, RONCE ET HERSE SONT ABSENTES, ET LA DONNÉE LE DIT : leur `degats`
 * vaut `null`. Elles ne tirent pas ; leur donner une arme serait leur inventer
 * un tir.
 */"""

COMMENTAIRE_EXPLOSION = """/**
 * La taille de l'explosion d'une PIÈCE détruite au combat, sur ses PV.
 *
 * ⚠⚠ CE NE SONT PAS LES SEUILS D'`EFFONDREMENT_PV`, ET C'EST MESURÉ. Les
 * vingt-trois unités et défenses vont de 500 à 2 000 PV : les seuils du bâtiment
 * — 2 000 et 3 000 — en classeraient **21 en `small`, 2 en `medium`, 0 en
 * `large`**. Deux paires, deux échelles.
 *
 * ⚠ 900 ET 1 500 RENDENT 9 · 10 · 4, et la coupure tombe dans un creux :
 * {500…800} · {900…1300} · {1500…2000}. Deux nombres qui se changent seuls.
 */"""

COMMENTAIRE_IMPACT = """/**
 * Au-delà de quelle PART de ses PV une cible prend un impact « lourd », en
 * millièmes.
 *
 * ⚠⚠ UNE PART, ET NON UN MONTANT, PARCE QUE LE MONTANT SUIT LE NIVEAU. Mesuré
 * sur **57 864 impacts** de raids réels, l'encaissé va de 67 à 34 683 675
 * milli-PV — cinq ordres de grandeur —, `facteurMilli` mettant dégâts et PV à
 * l'échelle ensemble : un seuil absolu classerait tout en `small` au niveau 5 et
 * tout en `heavy` au niveau 50. La part, elle, ne bouge pas — médiane **12 · 13
 * · 13 · 14** millièmes aux niveaux 5, 20, 35 et 50.
 *
 * ⚠ 25 EST LE TROISIÈME QUARTILE MESURÉ, donc « le quart supérieur des coups ».
 * C'est le SEUL arbitrage encore ouvert de ce lot, et il se change seul.
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

# ⚠⚠ LA RAMPE ANTI-CLAQUEMENT D'UNE BOUCLE, EN MILLISECONDES. Une boucle qui
# démarre ou s'arrête à plein gain claque : la forme d'onde saute de zéro à sa
# valeur en un échantillon, et l'oreille entend un clic. Cent vingt
# millisecondes sont assez courtes pour qu'un roulement suive l'unité et assez
# longues pour que la marche disparaisse.
# ⚠⚠ ET CE N'EST PAS LE FONDU QUE LE README DU PACK INTERDIT. Sa ligne 39 dit
# « ne pas appliquer de fondu supplémentaire aux fichiers marqués `loop: true` ;
# leurs bornes exactes sont fournies en échantillons » : elle parle du FICHIER,
# qu'on ne touche pas — la boucle rejoue ses bornes à l'échantillon près, sans
# fondu, `source.loop = true`. La rampe est sur le GAIN DE LECTURE, au démarrage
# et à l'arrêt, c'est-à-dire ailleurs et sur autre chose.
RAMPE_BOUCLE_MS = 120

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

# ⚠⚠ QUEL ÉCRAN PORTE QUELLE AMBIANCE. Trois écrans, trois ambiances, et le
# reste des huit est DÉCLARÉ MUET faute d'une lecture qui ne s'invente pas —
# voir `RAPPORT-lotSON-CABLAGE.md`. ⚠ `ambience_calm_map_loop` contre
# `ambience_map_wind_loop` est le SEUL choix esthétique que ce lot ait pris, et
# il l'a pris pour que la carte ne soit pas muette : les deux sont des ambiances
# de carte, rien dans le dépôt ne départage, et Ethan tranche en changeant cette
# ligne-ci. ⚠ `ambience_base_ouvrage_loop` n'a AUCUN écran qui montre la base de
# l'Ouvrage au repos ; `ambience_battlefield_distant_loop` en a un, le raid.
AMBIANCE_PAR_ECRAN = {
    'chantier': 'ambience_base_player_loop',
    'offense': 'ambience_base_player_loop',
    'mission': 'ambience_base_player_loop',
    'recherche': 'ambience_base_player_loop',
    'options': 'ambience_base_player_loop',
    'monde': 'ambience_calm_map_loop',
    'raid': 'ambience_battlefield_distant_loop',
}

# ⚠⚠ LES DEUX BOUCLES DE BÂTIMENT QUE LA BASE SAIT DIRE, ET RIEN D'AUTRE. Une
# boucle par TYPE présent, jamais par bâtiment : six usines ne font pas six fois
# le même bruit. Les trois autres boucles du pack sont muettes et le rapport dit
# pourquoi — il n'y a ni file de construction, ni réparation qui DURE (c'est un
# stock depuis le lot RÉSERVE), ni état « base attaquée » qui persiste.
BOUCLES_DE_BATIMENT = {
    'caserne': 'building_player_factory_loop',
    'depotDeVehicules': 'building_player_factory_loop',
    'aerodrome': 'building_player_factory_loop',
    'centrale': 'building_reactor_loop',
}

# ⚠⚠ LA TAILLE D'UN EFFONDREMENT SE LIT SUR LES PV, ET C'EST UNE PROPOSITION.
# Le brief donnait « l'empreinte du bâtiment » comme candidat naturel ; mesuré,
# elle ne discrimine RIEN — les onze occupent une case. Les PV, eux, vont de
# 1 000 à 5 500 et se coupent net : {1000, 1000, 1500} · {2000, 2500 ×4} ·
# {3000, 3000, 5500}. ⚠ `classeDeCout` donnerait presque la même partition —
# elle ne diverge que sur la Centrale — mais elle a QUATRE classes pour trois
# tailles, donc il faudrait en grouper deux, ce qui est le même choix déguisé.
# **Ethan tranche ; ces deux nombres se changent seuls.**
EFFONDREMENT_PV = [2000, 3000]

# ⚠⚠ ET LA TAILLE D'UNE PIÈCE DÉTRUITE AU COMBAT SE LIT SUR D'AUTRES SEUILS.
# `EFFONDREMENT_PV` ne convient PAS ici, et c'est mesuré : les vingt-trois
# unités et défenses vont de 500 à 2 000 PV, si bien que ses seuils les
# classeraient **21 en `small`, 2 en `medium`, 0 en `large`**. Deux paires, deux
# usages — l'effondrement volontaire d'un bâtiment de la base et la destruction
# d'une pièce au combat ne sont pas la même échelle.
#
# ⚠ 900 ET 1 500 RENDENT 9 · 10 · 4, et la coupure tombe dans un creux :
# {500…800} · {900…1300} · {1500…2000}. Ethan a rendu ces deux nombres le 04/09 ;
# ils se changent seuls, comme les deux précédents.
EXPLOSION_PV = [900, 1500]

# ⚠⚠ AU-DELÀ DE QUELLE PART DE SES PV UNE CIBLE PREND UN IMPACT « LOURD » —
# EN MILLIÈMES, ET C'EST LE SEUL ARBITRAGE ENCORE OUVERT DE CE LOT.
#
# ⚠⚠ UNE PART, PAS UN MONTANT, PARCE QUE LE MONTANT SUIT LE NIVEAU. Mesuré sur
# 57 864 impacts de raids réels : l'encaissé va de **67 à 34 683 675 milli-PV**,
# cinq ordres de grandeur, parce que `facteurMilli` met dégâts ET PV à l'échelle
# ensemble. Un seuil absolu classerait donc tout en `small` au niveau 5 et tout
# en `heavy` au niveau 50. La PART, elle, ne bouge pas : médiane **12 · 13 · 13 ·
# 14** millièmes aux niveaux 5, 20, 35 et 50.
#
# ⚠ 25 EST LE TROISIÈME QUARTILE MESURÉ : un impact lourd est le quart supérieur.
# **Ethan tranche ; ce nombre se change seul.**
IMPACT_LOURD_MILLIEMES = 25

# ⚠⚠ LE ROULEMENT EST PAR CHÂSSIS, ET LES POIDS SONT DÉJÀ ÉCRITS DANS LA CARTE.
# Arbitrage d'Ethan du 04/09, en entier. Les poids léger/moyen/lourd des blindés
# sont REPRIS du bloc `player` d'`unit_audio_map.json` — Ratisseur y porte
# `tracks_light`, Fendeur `tracks_medium`, Broyeur `tracks_heavy` —, ils ne sont
# pas inventés ; `verifier_les_roulements` les y confronte à chaque exécution.
#
# ⚠ LA COUPURE DES AÉRONEFS VIENT DE `comportementAerien`, QUI EST DANS LA
# DONNÉE : un `traversant` PASSE — c'est un coup, pas une boucle — et un
# `stoppeur` tient l'air, donc il boucle. Les deux stoppeurs prennent le même
# roulement dans les deux camps : le pack ne porte qu'un `dard`.
#
# ⚠⚠ BÉLIER ET PILON SONT UN ÉCART ASSUMÉ, ET IL EST D'ETHAN. La carte leur donne
# `deploy` et AUCUN `movement` ; un blindé qui avance ne doit pas être muet, donc
# ils prennent le roulement moyen EN PLUS de leur `deploy`.
ROULEMENT_PAR_CHASSIS = {
    'escouade': ('movement_infantry_player_loop', 'movement_essaim_ouvrage_loop'),
    'blinde_leger': ('movement_tracks_light_loop', 'movement_walker_light_loop'),
    'blinde_moyen': ('movement_tracks_medium_loop', 'movement_walker_medium_loop'),
    'blinde_lourd': ('movement_tracks_heavy_loop', 'movement_walker_heavy_loop'),
    'aeronef_stoppeur_leger': ('movement_dard_light_loop', 'movement_dard_light_loop'),
    'aeronef_stoppeur_lourd': ('movement_dard_heavy_loop', 'movement_dard_heavy_loop'),
}

# Quel poids porte quel blindé, et lequel des deux dards porte quel stoppeur.
# ⚠ LES TROIS PREMIÈRES LIGNES SE LISENT DANS LA CARTE et y sont confrontées ;
# Bélier et Pilon sont l'arbitrage d'Ethan. Le partage des deux stoppeurs suit
# leurs PV — 1 050 contre 1 800 — et le pack n'a que deux dards.
POIDS_DE_BLINDE = {
    'ratisseur': 'blinde_leger',
    'fendeur': 'blinde_moyen',
    'broyeur': 'blinde_lourd',
    'belier': 'blinde_moyen',
    'pilon': 'blinde_moyen',
}
POIDS_DE_STOPPEUR = {'busard': 'aeronef_stoppeur_leger', 'enclume': 'aeronef_stoppeur_lourd'}

# ⚠⚠ ET LE MOTEUR QUI TOURNE À L'ARRÊT — ARBITRAGE D'ETHAN DU 04/09, sur
# « unité vivante et immobile pendant un raid ». C'est l'exact complément du
# roulement : la même lecture d'état, prise dans l'autre sens.
#
# ⚠ SEULS LES BLINDÉS EN ONT UN, ET C'EST LE PACK QUI LE DIT : il porte trois
# poids, léger, moyen et lourd, exactement ceux des blindés. Une escouade n'a pas
# de moteur ; un aéronef stoppeur tient l'air, et son `dard` couvre déjà les deux
# états. Leur en attribuer un serait l'attribution par ressemblance interdite.
MOTEUR_PAR_CHASSIS = {
    'blinde_leger': ('engine_player_light_idle_loop', 'engine_ouvrage_light_idle_loop'),
    'blinde_moyen': ('engine_player_medium_idle_loop', 'engine_ouvrage_medium_idle_loop'),
    'blinde_lourd': ('engine_player_heavy_idle_loop', 'engine_ouvrage_heavy_idle_loop'),
}

# ⚠⚠ CE QUE TIRE CHACUNE DES NEUF DÉFENSES — UN TROU DE LA CARTE, COMBLÉ PAR
# ETHAN LE 04/09. `unit_audio_map.json` ne décrit que les quatorze UNITÉS ;
# mesuré, aucune de ses clés ne nomme une défense. La colonne dominante et la
# portée sont RELEVÉES dans `DEFENSES` — casemate infanterie 20 à 2,5 ; créneau
# véhicule 35 à 2,5 ; batterie aviation 40 à 2,5 ; faucheuse infanterie 10 à
# 5,5 ; mortier véhicule 12 à 5,5 ; harpon aviation 16 à 5,5 — et un test les
# remesure plutôt que de les croire.
#
# ⚠ MERLON, RONCE ET HERSE SONT ABSENTS, ET C'EST LA DONNÉE QUI LE DIT : leur
# `degats` vaut `null`, elles ne tirent pas.
ARME_PAR_DEFENSE = {
    'casemate': 'weapon_player_machinegun',
    'creneau': 'weapon_player_cannon_medium',
    'batterie': 'weapon_player_aa',
    'faucheuse': 'weapon_player_machinegun_burst',
    'mortier': 'weapon_player_artillery',
    'harpon': 'weapon_player_missile_launch',
}

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
# n'y porte aucune clé contenant « bus », « mix », « master » ou « gain ».
# ⚠⚠ MAIS ILS ONT ENFIN UN FICHIER AU DÉPÔT, ET C'EST L'ÉCART DU LOT PRÉCÉDENT
# QUI SE REFERME. `art/sources/README.md` est arrivé sur `main` le 04/09 ; sa
# ligne 36 porte « Bus UI : -3 dB ; armes : -6 dB ; impacts : -7 dB ; moteurs :
# -12 dB ; ambiances : -18 dB », c'est-à-dire les cinq valeurs ci-dessous, au
# décibel. Elles cessent donc d'être la parole d'Ethan recopiée : elles se
# LISENT, et un test les confronte au fichier.
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


def carte_des_unites(sons_par_id):
    """Lit `unit_audio_map.json` et VÉRIFIE que ses valeurs sont du pack.

    ⚠⚠ ELLE EST LUE À CHAQUE EXÉCUTION, PAS SEULEMENT SOUS `--ecrire`, ET C'EST
    CE QUI LA REND CONSOMMÉE. `tools/entrees.py` classe une source d'après ce que
    la CHAÎNE ouvre sous son mouchard ; une lecture réservée au drapeau
    d'écriture l'aurait laissée DORMANTE alors qu'un outil la consomme — le
    mensonge exact que ce fichier existe pour empêcher. Et le contrôle n'est pas
    décoratif : il attrape un nom de son qui bouge dans le pack sans que la carte
    suive, ce qu'aucune autre garde ne verrait.

    ⚠ ON RÉSOUT COMME ÉVÉNEMENT, PAS COMME IDENTIFIANT. La note du fichier le
    dit — « les entrées `variant_set` désignent un préfixe » — et c'est vrai de
    ses SEPT champs, pas du seul `variant_set` : mesuré, **trente-quatre valeurs
    sur trente-quatre** se résolvent comme événements, zéro comme identifiant
    seul. Le premier jet cherchait des identifiants et écartait
    `movement_player_flyby` pour la mauvaise raison.
    """
    with open(CARTE_UNITES, encoding='utf-8') as f:
        carte = json.load(f)
    evenements = {}
    for s in sons_par_id.values():
        evenements.setdefault(base_evenement(s['id']), []).append(s)
    inconnues = sorted({v for bloc in ('player', 'ouvrage')
                        for entree in carte[bloc].values()
                        for v in entree.values() if v not in evenements})
    if inconnues:
        raise SystemExit('unit_audio_map.json nomme %d valeur(s) qui ne sont pas '
                         'des événements du pack : %s' % (len(inconnues), inconnues))
    return carte, evenements


def armes_des_unites(sons_par_id):
    """L'arme de chaque unité, DÉRIVÉE de la carte, dans les DEUX camps.

    ⚠⚠ LE SON DE L'OUVRAGE S'OBTIENT PAR SUBSTITUTION, ET ELLE EST VÉRIFIÉE, PAS
    SUPPOSÉE. Le jeu porte quatorze unités et DEUX JEUX DE NOMS — `meute`
    s'appelle *Meute* pour l'Ouvrage et *Fusiliers* pour le joueur —, si bien que
    le bloc `player` de la carte couvre les quatorze pièces DES DEUX CAMPS. On
    remplace `_player_` par `_ouvrage_` et on EXIGE que le résultat soit un
    événement du pack : mesuré, **douze `variant_set` distincts, douze
    substitutions résolues**. Une seule qui manquerait ferait lever ici, au
    dépôt, jamais chez le joueur.

    ⚠ DEUX DES DOUZE NE SONT PAS DES `weapon_*` : Sapeurs/Fouisseurs tirent
    `explosion_player_small` et Albatros/Enclume `explosion_player_large`. C'est
    le pack qui le dit, et la substitution y marche à l'identique.
    """
    carte, evenements = carte_des_unites(sons_par_id)
    table = {}
    for paire, entree in sorted(carte['player'].items()):
        joueur = entree['variant_set']
        if '_player_' not in joueur:
            raise SystemExit('unit_audio_map.json : « %s » ne porte pas `_player_`, '
                             'la substitution vers l\'Ouvrage ne s\'y applique pas'
                             % joueur)
        ouvrage = joueur.replace('_player_', '_ouvrage_')
        if ouvrage not in evenements:
            raise SystemExit('unit_audio_map.json : « %s » substitué en « %s », qui '
                             'n\'est pas un événement du pack' % (joueur, ouvrage))
        table[paire] = (joueur, ouvrage)
    return table


def deploiements_des_unites(sons_par_id):
    """Le `deploy` que la carte donne à certaines unités, dans les deux camps.

    ⚠⚠ DEUX UNITÉS SUR QUATORZE EN PORTENT UN, ET CE SONT CELLES QUI N'ONT PAS DE
    ROULEMENT : Pionnier/Bélier et Obusier/Pilon. Ethan a tranché qu'elles
    prennent le roulement moyen EN PLUS ; leur `deploy` reste, il n'est pas
    remplacé. Il sonne à l'APPARITION — le seul instant que le moteur publie où
    une pièce se met en place — et il ne boucle pas, ce que ce contrôle exige.
    """
    carte, evenements = carte_des_unites(sons_par_id)
    table = {}
    for paire, entree in sorted(carte['player'].items()):
        nom = entree.get('deploy')
        if nom is None:
            continue
        if evenements[nom][0]['loop']:
            raise SystemExit('%s : « %s » boucle — un déploiement est un coup'
                             % (paire, nom))
        ouvrage = nom.replace('_player_', '_ouvrage_')
        if ouvrage not in evenements:
            raise SystemExit('%s : « %s » substitué en « %s », qui n\'est pas un '
                             'événement du pack' % (paire, nom, ouvrage))
        table[paire] = (nom, ouvrage)
    return table


def verifier_les_roulements(sons_par_id):
    """Confronte `ROULEMENT_PAR_CHASSIS` à la carte, et exige que tout boucle.

    ⚠⚠ LES POIDS NE SONT PAS INVENTÉS, ET C'EST ICI QUE ÇA SE PROUVE. Quatre
    paires portent un `movement` qui boucle dans le bloc `player` — Fusiliers
    `infantry`, Ratisseur `tracks_light`, Fendeur `tracks_medium`, Broyeur
    `tracks_heavy` — et cette fonction exige que la table leur rende EXACTEMENT
    ce que la carte dit. Bélier et Pilon n'y portent que `deploy` : ils sont
    l'écart assumé d'Ethan, et les seuls que ce contrôle ne couvre pas.
    """
    carte, evenements = carte_des_unites(sons_par_id)
    par_paire = {'Éclaireur/Ratisseur': 'blinde_leger',
                 'Chasseur/Fendeur': 'blinde_moyen',
                 'Percheron/Broyeur': 'blinde_lourd',
                 'Fusiliers/Meute': 'escouade'}
    for paire, archetype in par_paire.items():
        attendu = ROULEMENT_PAR_CHASSIS[archetype][0]
        vu = carte['player'][paire].get('movement')
        if vu != attendu:
            raise SystemExit('ROULEMENT_PAR_CHASSIS[%s] = %s, mais la carte donne %s '
                             'à « %s »' % (archetype, attendu, vu, paire))
    for archetype, couple in {**ROULEMENT_PAR_CHASSIS, **MOTEUR_PAR_CHASSIS}.items():
        for nom in couple:
            if nom not in evenements:
                raise SystemExit('ROULEMENT_PAR_CHASSIS[%s] : « %s » n\'est pas un '
                                 'événement du pack' % (archetype, nom))
            if not evenements[nom][0]['loop']:
                raise SystemExit('ROULEMENT_PAR_CHASSIS[%s] : « %s » ne boucle pas — '
                                 'un roulement qui ne boucle pas se couperait net'
                                 % (archetype, nom))
    return len(par_paire)


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
              COMMENTAIRE_RAMPE,
              'export const RAMPE_BOUCLE_MS = %d;' % RAMPE_BOUCLE_MS, '',
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
        boucle = ', boucle: true' if s['loop'] else ''
        lignes.append("  %s: { bus: '%s', dureeMs: %d, maxInstances: %d, volumeDb: %s%s%s },"
                      % (s['id'], BUS_PAR_CATEGORIE[categorie], s['duration_ms'],
                         s['recommended_max_instances'],
                         nombre_js(s['recommended_volume_db']), boucle, residente))
    lignes += ['};', '', COMMENTAIRE_EVENEMENTS, 'export const EVENEMENTS = {']
    for nom in sorted(groupes):
        membres = sorted(groupes[nom], key=lambda m: m['variant'])
        variantes = ', '.join("'%s'" % m['id'] for m in membres)
        lignes.append('  %s: { variantes: [%s], gardeMs: %d },'
                      % (nom, variantes, membres[0]['recommended_cooldown_ms']))
    lignes += ['};', '', COMMENTAIRE_REGLAGES,
               'export const REGLAGES_PAR_DEFAUT = { muet: false, volume: 0.7 };', '']

    par_id = {s['id']: s for s in sons}

    def exiger_une_boucle(nom, ou):
        if nom not in par_id:
            raise SystemExit('%s : « %s » n\'est pas un son du pack' % (ou, nom))
        if not par_id[nom]['loop']:
            raise SystemExit('%s : « %s » n\'est pas marqué `loop` dans le '
                             'manifeste — une boucle qui ne boucle pas se '
                             'couperait net à la fin du fichier' % (ou, nom))

    lignes.append(COMMENTAIRE_CABLAGE)
    lignes.append('export const AMBIANCE_PAR_ECRAN = {')
    for ecran in sorted(AMBIANCE_PAR_ECRAN):
        exiger_une_boucle(AMBIANCE_PAR_ECRAN[ecran], 'AMBIANCE_PAR_ECRAN[%s]' % ecran)
        lignes.append("  %s: '%s'," % (ecran, AMBIANCE_PAR_ECRAN[ecran]))
    lignes += ['};', '', 'export const BOUCLES_DE_BATIMENT = {']
    for bat in sorted(BOUCLES_DE_BATIMENT):
        exiger_une_boucle(BOUCLES_DE_BATIMENT[bat], 'BOUCLES_DE_BATIMENT[%s]' % bat)
        lignes.append("  %s: '%s'," % (bat, BOUCLES_DE_BATIMENT[bat]))
    def paire_js(couple):
        return "{ joueur: '%s', ouvrage: '%s' }" % tuple(couple)

    armes = armes_des_unites(par_id)
    deploiements = deploiements_des_unites(par_id)
    confrontes = verifier_les_roulements(par_id)
    poids = {**POIDS_DE_BLINDE, **POIDS_DE_STOPPEUR}
    lignes += ['};', '', COMMENTAIRE_ROULEMENT, 'export const ROULEMENT_PAR_CHASSIS = {']
    for archetype in sorted(ROULEMENT_PAR_CHASSIS):
        lignes.append('  %s: %s,' % (archetype, paire_js(ROULEMENT_PAR_CHASSIS[archetype])))
    lignes += ['};', '', COMMENTAIRE_MOTEUR, 'export const MOTEUR_PAR_CHASSIS = {']
    for archetype in sorted(MOTEUR_PAR_CHASSIS):
        lignes.append('  %s: %s,' % (archetype, paire_js(MOTEUR_PAR_CHASSIS[archetype])))
    lignes += ['};', '', COMMENTAIRE_ARCHETYPE, 'export const ARCHETYPE_PAR_UNITE = {']
    for unite in sorted(poids):
        lignes.append("  %s: '%s'," % (unite, poids[unite]))
    lignes += ['};', '', COMMENTAIRE_PASSAGE,
               "export const PASSAGE_AERIEN = { joueur: 'movement_player_flyby',"
               " ouvrage: 'movement_ouvrage_flyby' };", '',
               COMMENTAIRE_DEPLOIEMENT, 'export const DEPLOIEMENT_PAR_PAIRE = {']
    for paire in deploiements:
        lignes.append("  '%s': %s," % (paire, paire_js(deploiements[paire])))
    lignes += ['};', '', COMMENTAIRE_ARMES, 'export const ARME_PAR_PAIRE = {']
    for paire in armes:
        lignes.append("  '%s': %s," % (paire, paire_js(armes[paire])))
    lignes += ['};', '', COMMENTAIRE_ARME_DEFENSE, 'export const ARME_PAR_DEFENSE = {']
    for piece in sorted(ARME_PAR_DEFENSE):
        joueur = ARME_PAR_DEFENSE[piece]
        lignes.append('  %s: %s,'
                      % (piece, paire_js((joueur, joueur.replace('_player_', '_ouvrage_')))))
    lignes += ['};', '',
               'export const EFFONDREMENT_PV = [%s];'
               % ', '.join(str(n) for n in EFFONDREMENT_PV), '',
               COMMENTAIRE_EXPLOSION,
               'export const EXPLOSION_PV = [%s];'
               % ', '.join(str(n) for n in EXPLOSION_PV), '',
               COMMENTAIRE_IMPACT,
               'export const IMPACT_LOURD_MILLIEMES = %d;' % IMPACT_LOURD_MILLIEMES, '']

    chemin = os.path.join(RACINE, 'src', 'data', 'sons.js')
    with open(chemin, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lignes))
    print('src/data/sons.js : %d sons (%d boucles), %d événements, %d armes '
          'd\'unité, %d déploiements, %d roulements confrontés à la carte, %d octets'
          % (len(sons), sum(1 for s in sons if s['loop']), len(groupes), len(armes),
             len(deploiements), confrontes, os.path.getsize(chemin)))


def nombre_js(x):
    """Rend un nombre du manifeste sans le zéro décimal des flottants Python."""
    return str(int(x)) if float(x) == int(x) else repr(float(x))


def main():
    ecrire = '--ecrire' in sys.argv[1:]
    if shutil.which('opusenc') is None:
        raise SystemExit('opusenc est absent : « apt-get install opus-tools »')
    os.makedirs(DST, exist_ok=True)
    table = table_des_sons()
    # ⚠ LA CARTE DES UNITÉS SE LIT ET SE VÉRIFIE À CHAQUE EXÉCUTION — voir
    # `carte_des_unites`. C'est ce qui la fait compter CONSOMMÉE par
    # `tools/entrees.py`, et ce qui attrape un nom de son qui bougerait sans elle.
    with open(MANIFESTE, encoding='utf-8') as f:
        carte_des_unites({s['id']: s for s in json.load(f)['sounds']})
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
