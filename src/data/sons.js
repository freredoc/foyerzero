// Les quatre sons témoins, et la table de mixage qui les reçoit.
//
// ⚠⚠ QUATRE SONS, PAS 263, ET C'EST L'ARBITRAGE DU LOT. Le pack d'Ethan en
// porte deux cent soixante-trois ; `art/sources/sfx_manifest.json` les décrit
// tous et entre au dépôt DORMANT. Ce lot pose le MOTEUR — jouer, refuser de
// trop jouer, se taire — et quatre témoins choisis pour exercer chacun de ses
// mécanismes. Le catalogue est un autre lot, et son palier de compression comme
// son mode de livraison ne sont pas tranchés.
//
// ⚠⚠ CETTE TABLE EST UNE TRANSCRIPTION À LA MAIN DU MANIFESTE, ET UN TEST LES
// CONFRONTE — clés ET valeurs. Même motif que `src/data/ancres-chassis.js`
// contre `art/sprites/ancres-chassis.json` : une transcription qui ne se
// confronte pas à sa source est une copie qui vieillit. Le manifeste n'est lu
// ni par le jeu ni par la chaîne — il reste dormant, comme le brief l'exige ;
// il n'est lu que par la garde qui vérifie ces quatre lignes-ci.

/**
 * Les cinq bus de mixage, en décibels.
 *
 * ⚠⚠ CES CINQ NIVEAUX NE SONT PAS DANS LE MANIFESTE, ET IL FAUT LE DIRE. Ils
 * viennent du brief du lot, qui les donne comme la recommandation du pack ;
 * `sfx_manifest.json` ne porte AUCUNE section de mixage — vérifié, il n'y a pas
 * une clé qui contienne « bus », « mix », « master » ou « gain ». Leur source
 * est donc la parole d'Ethan par le brief, pas un fichier du dépôt.
 *
 * ⚠ TROIS DES CINQ N'ONT AUCUN USAGE ICI, ET ILS SONT POSÉS QUAND MÊME. Le
 * brief le demande explicitement, et le motif est bon : le lot du catalogue les
 * improviserait sinon, chacun à sa mesure, et le mixage entier serait à refaire.
 *
 * ⚠⚠ ET LES CINQ BUS NE COUVRENT PAS LES NEUF CATÉGORIES DU PACK. Mesuré sur
 * les 263 entrées : `weapons` 87, `impacts` 44, `movement` 26, `explosions` 24,
 * `ui` 23, `buildings` 21, `alerts` 18, `orders` 12, `ambiences` 8. Quatre
 * d'entre elles — explosions, buildings, alerts, orders — n'ont pas de bus
 * nommé par le brief, et on ne leur en INVENTE pas : ce serait choisir seul un
 * niveau de mixage, c'est-à-dire exactement ce que ce lot s'interdit.
 */
export const BUS = {
  interface: -3,
  armes: -6,
  impacts: -7,
  moteurs: -12,
  ambiances: -18,
};

/**
 * Un son : son bus, et ce que le manifeste dit de lui.
 *
 * ⚠ LE NOM DU MASTER WAV N'EST PAS ICI, ET C'EST VOULU. Le jeu ne voit jamais
 * un WAV — il reçoit un `.opus` déjà encodé, sous un `data:`. Le nom du master
 * est un fait de PRODUCTION : il vit dans la table de `tools/sons.py`, qui est
 * le seul à l'ouvrir, et un test confronte les deux tables par identifiant.
 * L'écrire ici aurait embarqué quatre chaînes dans le livrable pour que
 * personne ne les lise.
 *
 * `dureeMs` sert au moteur de voix — une instance est « en cours » tant que sa
 * durée n'est pas écoulée —, donc elle ne peut pas être décorative : un chiffre
 * faux ici plafonnerait trop tôt ou trop tard. Le test la confronte au WAV
 * source ET au manifeste, qui s'accordent.
 *
 * ⚠ `maxInstances` EST PAR FICHIER, `gardeMs` EST PAR ÉVÉNEMENT — voir
 * `EVENEMENTS` ci-dessous, qui dit pourquoi et sur quelle mesure.
 */
export const SONS = {
  ui_click_01: {
    bus: 'interface',
    dureeMs: 75,
    maxInstances: 2,
    volumeDb: 0,
  },
  ui_click_02: {
    bus: 'interface',
    dureeMs: 75,
    maxInstances: 2,
    volumeDb: 0,
  },
  ui_error_01: {
    bus: 'interface',
    dureeMs: 268,
    maxInstances: 2,
    volumeDb: 0,
  },
  ui_toggle_on: {
    bus: 'interface',
    dureeMs: 160,
    maxInstances: 1,
    volumeDb: 0,
  },
};

/**
 * Ce que le JEU demande : un événement, qui porte une ou plusieurs variantes.
 *
 * ⚠⚠ LE TEMPS DE GARDE EST UNE PROPRIÉTÉ DE L'ÉVÉNEMENT, PAS DU FICHIER, ET
 * SANS ÇA IL NE MORDRAIT PAS. Le manifeste l'attribue au fichier ; or un clic
 * a DEUX variantes, donc une garde par fichier laisserait passer deux clics à
 * quarante millisecondes d'écart dès que le tirage change de variante — c'est
 * précisément le cas que la garde existe pour refuser.
 *
 * ⚠ ET LE CHOIX NE COÛTE RIEN, PARCE QUE C'EST MESURÉ. Sur les 263 entrées du
 * pack, 54 groupes portent plusieurs variantes, et **zéro** d'entre eux ne
 * porte deux `recommended_cooldown_ms` différents — ni deux
 * `recommended_max_instances` différents. « Par fichier » et « par événement »
 * décrivent donc aujourd'hui la même table ; lire par événement ne change
 * aucune valeur, et rend la garde falsifiable.
 */
export const EVENEMENTS = {
  // Les deux variantes d'un clic de bouton — c'est le tirage de variante.
  ui_clic: { variantes: ['ui_click_01', 'ui_click_02'], gardeMs: 55 },
  // Une action refusée. Une variante, une autre durée, le même bus.
  ui_refus: { variantes: ['ui_error_01'], gardeMs: 55 },
  // ⚠ LE SEUL PLAFOND À UNE VOIX DES QUATRE, ET SA FENÊTRE EXISTE : sa garde
  // (120 ms) est plus COURTE que sa durée (160 ms), donc il reste quarante
  // millisecondes où la garde laisse passer et où le plafond refuse. Sans cet
  // écart, le plafond serait inatteignable et le test qui le mesure serait vert
  // quelle que soit la valeur écrite.
  ui_bascule: { variantes: ['ui_toggle_on'], gardeMs: 120 },
};

// ⚠⚠ ET LE PLAFOND DU CLIC EST INERTE AUJOURD'HUI — MESURÉ, ET DÉCLARÉ PLUTÔT
// QUE TU. Sur 200 graines et 400 instants au pas de la milliseconde, `ui_clic`
// rend **80 000 demandes, 1 600 sons, et ZÉRO refus par le plafond** : sa garde
// (55 ms) et sa durée (75) ne laissent qu'une fenêtre de vingt millisecondes où
// deux instances coexistent, et toute troisième demande y tombe sur la garde.
// `ui_bascule`, lui, refuse 16 000 fois dans le même balayage.
//
// Ce n'est pas un défaut : c'est que DEUX mécanismes se recouvrent, et que le
// plus serré gagne. Le plafond ne mord que lorsqu'il est bas devant le rapport
// durée/garde — ce qui est le cas d'`ui_toggle_on` et ne l'est d'aucun autre
// témoin. **Le lot du catalogue doit le savoir** : y écrire des plafonds sans
// regarder la garde en face donnerait des nombres qui ne servent à rien.

/**
 * Les réglages par défaut, au premier démarrage.
 *
 * ⚠ LE SON EST ACTIF PAR DÉFAUT — arbitrage d'Ethan : « une fonction muette par
 * défaut n'est jamais testée ». Le volume est un facteur linéaire de 0 à 1
 * appliqué APRÈS les décibels du bus.
 */
export const REGLAGES_PAR_DEFAUT = { muet: false, volume: 0.7 };
