// État de jeu de Chantier : création, boucle, rattrapage, sérialisation,
// migration.
//
// L'état est un objet plein, sérialisable en JSON tel quel, versionné DÈS
// AUJOURD'HUI : le numéro de version et la chaîne de migration existent
// avant la première sauvegarde réelle, pas après coup.

import { baseCourante } from './base-courante.js';
import { creerRng, restaurerRng } from './rng.js';
import { creerHorloge, tick as tickHorloge, avancerTicks, accumuler } from './clock.js';
import { champsDeLaBase, obstaclesDeLaBase } from './champs.js';
import {
  satellitesVides, planifierSatellites, resoudreSatellites, problemesDesSatellites,
  TICKS_DUREE_DE_VIE,
  TICKS_APPARITION,
  PREMIERE_INSTANCE, ANNEAUX,
} from './satellites.js';
import { positionDepartJoueur } from './carte.js';
import { releverLesPoisAcquis, majorationsDeProduction, problemesDesPoisAcquis } from './poi.js';
import {
  creerPointsAttaque, avancerPointsAttaque, plafondDuNiveau, plafondVise,
} from './points-attaque.js';
import {
  sitesEntamesVides, reparerLesSites, problemesDesSitesEntames,
} from './site-entame.js';
import { creerRecherche } from './raid.js';
import { crediterLesReserves, reservesVides, problemesDesReserves } from './reparation.js';
import {
  basesAttaquantes, resoudreLaMinute, prochaineMinuteDeRaid, minuteDeLHorloge,
  TICKS_PAR_MINUTE,
} from './raid-ouvrage.js';
import { dispositionNouvelleBase, problemesDeDisposition } from './disposition.js';
import {
  creerEtatEconomie, tickEconomieBase, rattrapageEconomieBase, RESSOURCES,
  STOCK_DE_DEPART,
} from './economie-base.js';
import {
  BASE_BATIMENTS, BATIMENT_DE_CHASSIS, coutDeMontee, remboursementDuNiveau,
} from '../data/base.js';
import {
  GEOGRAPHIE, POINTS_ARMEE, EMPLACEMENTS_ASSAUT, APRES_RAID,
} from '../data/sites.js';
import { GRILLE, UNITES, DEFENSES } from '../data/combat.js';
import { NIVEAU } from '../data/niveaux.js';
import {
  rosterDefensif, coutDeMonteeOffense, coutDeMonteeDefense,
} from '../data/couts-militaires.js';
import { ARBRE_RECHERCHE, gratuitesDe } from '../data/recherche.js';

// ⚠⚠ L'ACCESSEUR VIT DANS SON PROPRE MODULE, ET C'EST UNE CONTRAINTE
// D'IMPORTS, PAS UN GOÛT. `sim/state.js` importe satellites, poi,
// points-attaque, site-entame, raid, raid-ouvrage, reparation et — par
// `raid-ouvrage` — deplacement : les huit modules qui ont besoin de
// `baseCourante` sont donc ses DÉPENDANCES, et le leur faire importer d'ici
// ferait huit cycles. Un cycle ESM se résout tant qu'on n'appelle rien au
// chargement, mais il rend l'ordre d'évaluation des modules significatif, et
// c'est le genre de fragilité qu'on ne découvre qu'au bundle.
//
// ⚠ IL EST RÉ-EXPORTÉ ICI QUAND MÊME. `state.js` est l'endroit où un lecteur va
// le chercher, et un ré-export n'est PAS une copie : c'est la même liaison, donc
// il ne peut pas y avoir deux implémentations qui divergent.
export { baseCourante } from './base-courante.js';

/** Version courante du format de sauvegarde. */
export const SAVE_VERSION = 24;

/**
 * Les onze champs qui appartiennent à UNE BASE — lot BASES-0, 02/09/2026.
 *
 * ⚠ UNE SEULE LISTE, LUE PAR LA MIGRATION ET PAR `verifierEtat`. En écrire deux
 * ferait diverger ce que la migration DESCEND et ce que la vérification EXIGE :
 * un champ ajouté d'un côté et pas de l'autre passerait au chargement et
 * manquerait en jeu, ou l'inverse. `champs` et `obstacles` y sont, bien qu'ils
 * ne soient jamais sauvegardés — la migration les traite comme absents, et
 * `charger` les redéduit.
 */
export const CHAMPS_DE_BASE = Object.freeze([
  'position', 'fondation', 'disposition', 'garnison', 'armee', 'economie',
  'champs', 'obstacles', 'satellites', 'reserveReparation',
  'dernierDeplacementTick',
]);

/**
 * @typedef {object} Etat
 * @property {number} version   Version du format de sauvegarde.
 * @property {number} graine    Graine d'origine de la partie.
 * @property {{ s: number }} rng
 * @property {{ tempsSimuleMs: number, nbTicks: number, residuMs: number }} horloge
 * @property {Array<Base>} bases    Les bases du joueur — UNE SEULE au lot BASES-0.
 * @property {number} baseCourante   Indice dans `bases`, jamais la base elle-même.
 * @property {Array<{ type: string, bande: number }>} poisAcquis HISTOIRE, GLOBALE — voir `sim/poi.js`.
 */

/**
 * Une base du joueur. Onze champs, et ils étaient tous à la racine de `etat`
 * jusqu'au lot BASES-0 — voir `creerBase` et `baseCourante`.
 *
 * @typedef {object} Base
 * @property {{ rangee: number, colonne: number }} position Sur la carte monde, AUJOURD'HUI.
 * @property {{ rangee: number, colonne: number }} fondation Là où la base a été FONDÉE.
 * @property {Array<{ id: string, rangee: number, colonne: number, niveau: number }>} disposition
 * @property {Array<Effectif>} garnison Les défenses posées dans la bande de défense.
 * @property {Array<Effectif>} armee    Les unités posées dans les quatre vagues.
 * @property {{ ressources: Record<string, number>, residus: Array<Record<string, number>> }} economie
 * @property {object} champs    DÉRIVÉ de `fondation` — voir `serialiser`.
 * @property {object} obstacles DÉRIVÉ de `fondation` — voir `serialiser`.
 * @property {object} satellites            HISTOIRE — voir `sim/satellites.js`.
 * @property {Record<string, number>} reserveReparation Trois stocks, en TICKS.
 * @property {number|null} dernierDeplacementTick `null` = jamais déplacée.
 */

/**
 * Une pièce posée, de garnison ou d'armée. `rangee` pour la garnison, `vague`
 * pour l'armée — l'autre clé est absente, jamais nulle.
 *
 * @typedef {object} Effectif
 * @property {string} id
 * @property {number} [rangee] garnison seulement
 * @property {number} [vague]  armée seulement
 * @property {number} colonne
 * @property {number} niveau
 * @property {number} degatsMilli Dégâts subis, en MILLI-PV. Zéro = intacte.
 */

// ---------------------------------------------------------------------------
// Le terrain est DÉRIVÉ, pas sauvegardé
// ---------------------------------------------------------------------------
//
// ⚠ DÉRIVÉ DE LA FONDATION, PAS DE LA POSITION COURANTE. Arbitré par Ethan le
// 27/08 : « une fois qu'il a posé sa base, les champs de quartz et de scorie ne
// changent plus jamais, sinon ça casserait les collecteurs et le schéma ». Un
// redéploiement change donc la place de la base sur la carte, mais pas son
// terrain : le joueur ne perd jamais la disposition de ses collecteurs en se
// repliant.
//
// ⚠ ET SON NIVEAU NE CHANGE PAS NON PLUS, parce qu'il n'a jamais dépendu de la
// carte. `niveauDeLaRangee` vaut pour les sites de l'OUVRAGE, pas pour la base
// du joueur — arbitré le 27/08. La base du joueur porte TROIS niveaux qui lui
// sont propres, chacun une moyenne : bâtiments, défense, armée offensive. Rien
// de tout ça ne se lit sur la carte.
//
// D'où DEUX positions dans l'état, et il ne faut jamais les confondre :
//   `position`  — où la base est aujourd'hui. Donne le niveau, la carte, les
//                 voisins de carte. Elle bouge.
//   `fondation` — où la base a été posée. Ne sert QU'À une chose, le terrain.
//                 Elle ne bouge jamais.
//
// `champsDeLaBase` est une fonction de la seule case qu'on lui passe : même
// case, même terrain, pour toujours. Il y a donc deux façons de traiter le
// terrain, et une seule bonne.
//
// LE RECALCULER À CHAQUE TICK : non. MESURÉ le 26/08 : **71,6 µs par appel**,
// soit à 10 Hz 0,72 ms par seconde de jeu réel — plus du double du tick
// économique lui-même (0,30 ms/s). Ce serait tripler le coût de la boucle pour
// une valeur qui ne peut pas changer pendant un tick.
//
// LE SAUVEGARDER : non plus. Il serait alors possible qu'une sauvegarde porte
// un terrain qui ne correspond plus à sa position — par édition, par bogue, par
// migration ratée — et rien ne le dirait.
//
// RETENU : il vit dans l'état en mémoire, et `serialiser` l'OMET. La sauvegarde
// ne porte que `fondation`, seule source de vérité ; `charger` en redéduit le
// terrain. Un seul endroit peut mentir, et c'est celui qui est écrit.
//
// ⚠ C'est l'arbitrage du 27/08 qui rend `fondation` NÉCESSAIRE. Tant que le
// terrain suivait la position, `position` suffisait. Geler le terrain sans
// sauvegarder d'où il vient aurait obligé à sauvegarder les douze cases —
// exactement la seconde source de vérité qu'on refuse ici. Deux entiers de plus
// suffisent, et l'invariant tient.

/**
 * Une base du joueur — les onze champs qui lui appartiennent en propre.
 *
 * ⚠⚠ ILS ÉTAIENT À LA RACINE DE `etat` JUSQU'AU LOT BASES-0, 02/09/2026. Le
 * dépliage ne fonde personne : `etat.bases` n'a qu'UN élément à la fin de ce
 * lot, et le jeu se comporte exactement comme avant. Ce qu'il achète, c'est que
 * la deuxième base ne demande plus de retoucher deux cent cinquante sites.
 *
 * ⚠ CE QUI RESTE GLOBAL EST DANS `creerEtat`, et le partage est arbitré :
 * `poisAcquis` (« acquis une fois, valable partout »), `rapports` (les dix
 * derniers EN TOUT), `attaque` (une seule réserve, dont le plafond est mérité
 * par les ARMÉES du moment, au pluriel), `recherche` (elle se paie en points,
 * jamais en ressources), plus la graine, le tirage, l'horloge et le tutoriel.
 *
 * @param {{ rangee: number, colonne: number }} position
 * @param {Array} disposition
 * @returns {object} une base
 */
function creerBase(position, disposition) {
  return {
    position,
    // À la fondation les deux coïncident, et c'est le seul instant où c'est
    // garanti. Une COPIE, jamais la même référence : un redéploiement qui
    // écrirait dans `position` déplacerait sinon aussi la fondation.
    fondation: { rangee: position.rangee, colonne: position.colonne },
    disposition,
    // ⚠ VIDES, ET C'EST UN ÉTAT NORMAL — pas un trou à combler. Une base neuve
    // ne porte qu'un Chantier : ni Centre de commandement ni QG de défense,
    // donc aucun budget, donc rien à poser. Les deux listes sont CREUSES, à la
    // même forme que `disposition` : un objet par pièce posée, rien pour une
    // case vide. Une grille pleine ferait porter 108 `null` à la sauvegarde et
    // imposerait une seconde convention de lecture dans le même fichier.
    garnison: [],
    armee: [],
    economie: creerEtatEconomie(disposition),
    champs: champsDeLaBase(position.rangee, position.colonne),
    // ⚠ DÉRIVÉ COMME `champs`, ET STRIPPÉ COMME LUI PAR `serialiser`. Les dix
    // obstacles sont du TERRAIN : ils se tirent de la fondation, ils ne se
    // sauvegardent pas, et ils ne bougent jamais. Les ranger dans la sauvegarde
    // ferait exister deux vérités pour la même case.
    obstacles: obstaclesDeLaBase(position.rangee, position.colonne),
    // ⚠ SAUVEGARDÉS, EUX. Les camps et l'avant-poste dépendent de ce que le
    // joueur a fait — où il s'est posé, quand, combien de fois il a rasé le même
    // camp —, pas de la seule graine. C'est le premier champ du dépôt qui porte
    // de l'HISTOIRE plutôt qu'un état instantané.
    satellites: satellitesVides(),
    // ⚠⚠ LA RÉSERVE DE TEMPS DE RÉPARATION — trois stocks, un par châssis, EN
    // TICKS. Le temps qui passe les crédite au taux 1 pour 1 ; réparer une unité
    // débite le sien et la rend au combat sur-le-champ. Le modèle est celui de
    // `MODELE-REPARATION-1.md` §4, dicté le 24/08 et redit par Ethan le 01/09.
    //
    // ⚠ À ZÉRO À LA CRÉATION, ET C'EST L'ÉTAT NORMAL. Une base neuve n'a pas
    // d'armée, donc rien à réparer ; le premier tick commence à créditer.
    //
    // ⚠⚠ ET SA CONDITION DE RUPTURE EST ADVENUE — lot BASES-0, 02/09/2026. Ce
    // commentaire annonçait : « la réserve est PAR BASE, pas par joueur ; elle
    // vit sur `etat` uniquement parce qu'il n'y a qu'une base ; le jour du
    // multi-bases, ce champ devra DESCENDRE d'un cran ». C'est fait : il est
    // dans la base. Ce qui RESTE à faire le jour de la seconde base est écrit
    // ici pour ne pas se perdre — `crediterLesReserves` ne crédite que la base
    // courante, et devra boucler sur `etat.bases`. Ne jamais laisser un
    // commentaire qui annonce un futur devenu présent (CLAUDE.md §6).
    reserveReparation: reservesVides(),
    // ⚠⚠ QUAND LA BASE S'EST DÉPLACÉE POUR LA DERNIÈRE FOIS — lot DÉPLACEMENT,
    // 02/09. Un HORODATAGE de jeu, jamais un compte à rebours : un résiduel qui
    // décroîtrait tick par tick divergerait au rattrapage, alors qu'un instant
    // relu contre l'horloge ne dépend pas du chemin par lequel on y est arrivé.
    //
    // ⚠ `null`, PAS ZÉRO, ET C'EST LA MOITIÉ QUI COMPTE. Une base neuve ne s'est
    // jamais déplacée : son premier déplacement n'attend rien. Un zéro se lirait
    // « déplacée au tick 0 », ce qui est vrai par accident aujourd'hui — l'horloge
    // y démarre — et cesserait de l'être le jour où une partie commencerait
    // ailleurs. `ticksAvantProchainDeplacement` distingue les deux de face.
    dernierDeplacementTick: null,
  };
}

/**
 * Crée l'état d'une partie neuve : le joueur ouvre le jeu dans sa base.
 *
 * ARBITRÉ le 26/08 : il démarre rangée 295, colonne 16 de la carte (strate 1),
 * sur un Chantier de construction niveau 1 posé en (18, 5) de sa base.
 *
 * @param {number} graine
 * @returns {Etat}
 */
export function creerEtat(graine) {
  const position = positionDepartJoueur();
  const disposition = dispositionNouvelleBase();
  const etat = {
    version: SAVE_VERSION,
    graine,
    rng: creerRng(graine),
    horloge: creerHorloge(),
    // ⚠ LA SEULE CHOSE QUE LE TUTORIEL SAUVEGARDE, ET CE N'EST PAS SA
    // PROGRESSION. Ce qui est fait ou non se recalcule depuis la base à chaque
    // demande (`sim/missions.js`) : la base est la première source de vérité et
    // elle ne peut pas mentir. « J'ai quitté le tuto », en revanche, est une
    // DÉCISION du joueur, et aucune base ne l'exprime — c'est de l'histoire, au
    // même titre que `satellites`, donc ça se garde.
    tutoriel: { ferme: false },
    // ⚠ LE PLEIN, PAS ZÉRO, et c'est un arbitrage d'Ethan du 29/08 : « au tout
    // début du jeu, on lui donne immédiatement le plein — c'est frustrant de
    // démarrer le jeu puis d'attendre que ça se remplisse ». Une base neuve n'a
    // pas d'armée, donc le plafond de départ est celui de base : 100 points,
    // dix raids courts en réserve.
    attaque: creerPointsAttaque(),
    // ⚠ DEUX CHAMPS VIDES, ET DEUX FAITS QUE LA GRAINE NE PEUT PAS RENDRE : ce
    // que le joueur a cassé et n'a pas fini, et les bases qu'il a rasées. Le
    // reste de la carte se recalcule ; ces deux-là sont de l'HISTOIRE, au même
    // titre que `satellites`.
    sitesEntames: sitesEntamesVides(),
    basesRasees: [],
    // ⚠ UNE CHAÎNE DÉCIMALE, PAS UN NOMBRE. Le compteur de recherche est un
    // BigInt — le barème dépasse l'entier sûr dès le niveau 39 — et
    // `JSON.stringify` lève sur un BigInt. Voir `sim/raid.js`.
    recherche: creerRecherche(),
    // ⚠ DE L'HISTOIRE, DONC SAUVEGARDÉ — au même titre que `satellites` et
    // `basesRasees`. Les soixante-dix POSITIONS de POI se recalculent depuis la
    // graine et n'entrent jamais ici ; ce qui est ACQUIS dépend de là où le
    // joueur est passé, et rien d'autre ne peut le dire. Une liste de paires
    // `{ type, bande }`, triée : le couple est unique, donc soixante-dix clés
    // possibles au plus.
    //
    // ⚠ VIDE À LA CRÉATION, ET LE PREMIER TICK LA REMPLIT. `creerEtat` ne relève
    // rien lui-même : le relevé vit dans `tickJeu`, en un seul endroit, et le
    // faire aussi ici en ferait deux.
    poisAcquis: [],
    // ⚠⚠ LES DIX DERNIERS RAPPORTS DE RAID, EN TOUT — arbitré par Ethan le
    // 01/09, et la borne vit dans `APRES_RAID.rapportsGardes`, jamais ici ni
    // dans l'écran. C'est de l'HISTOIRE, au même titre que `satellites` : rien
    // ne permet de recalculer ce que le joueur a attaqué la semaine dernière.
    //
    // ⚠ DES RAPPORTS, JAMAIS DES `resultat` DE COMBAT. Un résultat porte les
    // vagues, les positions et les PV de chaque entité tick par tick ; dix de
    // ces objets rendraient la sauvegarde illisible. Mesuré : un rapport pèse
    // 645 octets, dix en pèsent moins de sept kilo-octets.
    //
    // ⚠ VIDE À LA CRÉATION, ET C'EST L'ÉTAT NORMAL. Une base neuve n'a attaqué
    // personne.
    rapports: [],
    // ⚠⚠ LE COMPTEUR D'INSTANCE DES SATELLITES EST GLOBAL — lot BASES-1,
    // 02/09/2026. Il vivait dans `satellites`, donc dans la BASE ; deux bases
    // seraient toutes deux parties de l'instance 1, donc de la MÊME graine
    // d'apparition, et leurs satellites auraient été tirés du même flux. Global,
    // l'unicité est structurelle — et avec une seule base il rend exactement la
    // suite 1, 2, 3… qu'elle tirait déjà, donc rien ne bouge pour l'existant.
    prochaineInstanceSatellite: PREMIERE_INSTANCE,
    // ⚠⚠ CE QUE LE JOUEUR A DÉTRUIT, PAR TYPE — lot BASES-1. C'est le pendant de
    // `basesRasees` pour les satellites : un camp rasé quitte `presents` et
    // n'entre nulle part, si bien que la partie ne saurait plus jamais qu'il a
    // existé. Le tutoriel en a besoin pour cocher « Attaquer et détruire un
    // camp », et c'est de l'HISTOIRE — au même titre que `basesRasees` et
    // `poisAcquis`, qui sont sauvegardés eux aussi.
    //
    // ⚠ UN COMPTE, PAS UNE LISTE DE CASES. `basesRasees` retient des CASES parce
    // qu'une base ne doit plus jamais reparaître là ; un camp, lui, reparaît —
    // la case ne dit donc rien, seul le nombre le dit.
    satellitesDetruits: Object.fromEntries(Object.keys(ANNEAUX).map((t) => [t, 0])),
    // ⚠⚠ UNE LISTE, ET D'UN SEUL ÉLÉMENT — lot BASES-0, 02/09/2026. Le multi-bases
    // est déplié dans la FORME, il n'est pas ouvert dans le JEU : fonder,
    // basculer, transférer sont les lots suivants. La coquille de bascule de
    // `index.src.html` reste donc désactivée, et son « 1 / 1 » reste vrai.
    bases: [creerBase(position, disposition)],
    // ⚠ L'INDICE, PAS LA BASE. Ranger l'objet ferait DEUX chemins vers la même
    // base — la liste et le raccourci — qui divergeraient au premier
    // `structuredClone`, la copie ne rétablissant aucune identité de référence.
    baseCourante: 0,
  };
  // ⚠ L'AMORCE EST SERVIE ICI, ET NULLE PART AILLEURS. Arbitré le 27/08 : une
  // base neuve ne produit rien tant qu'aucun collecteur n'est posé, et un
  // départ à zéro laisse le joueur devant un écran où aucune action n'est
  // payable. La servir dans `creerEtatEconomie` a été essayé : les MIGRATIONS
  // repassent par elle, et une sauvegarde qu'on monte de version aurait touché
  // l'amorce une seconde fois.
  servirLAmorce(baseCourante(etat));
  // La base vient d'être posée : les trois apparitions sont dues dans cinq
  // minutes. Elles ne PARAISSENT pas ici — une base neuve est seule, et c'est
  // exactement ce que le joueur doit voir en ouvrant la partie.
  planifierSatellites(etat);
  verifierEtat(etat);
  return etat;
}

/**
 * Bascule sur une autre base — lot BASES-1.
 *
 * ⚠⚠ ELLE ÉCRIT UN INDICE, ET C'EST TOUT CE QU'ELLE FAIT. BASES-0 a rangé
 * l'indice plutôt que l'objet, en écrivant pourquoi : « ranger l'objet ferait
 * DEUX chemins vers la même base, qui divergeraient au premier
 * `structuredClone` ». Introduire ici un raccourci vers la base — même « pour
 * la commodité de l'écran » — referait exactement ce défaut.
 *
 * ⚠ ELLE VIT DANS `sim/`, PAS DANS L'ÉCRAN, comme `poser` et `reglerTutoriel`.
 * Deux vues touchent ce champ — les flèches et le halo de la carte — et sans
 * elle chacune l'aurait écrit de son côté.
 *
 * ⚠ ELLE LÈVE HORS BORNES, elle ne rabote pas. L'appelant a une liste et un
 * indice : arriver ici avec un indice impossible est un fait de PROGRAMME, et
 * le rabattre en silence ferait basculer sur une base que personne n'a désignée.
 *
 * @param {Etat} etat modifié en place
 * @param {number} indice
 * @returns {number} l'indice retenu
 */
export function basculerVersLaBase(etat, indice) {
  if (!Number.isInteger(indice) || indice < 0 || indice >= etat.bases.length) {
    throw new RangeError(
      `etat : bascule vers l'indice ${indice}, hors de 0…${etat.bases.length - 1}`,
    );
  }
  etat.baseCourante = indice;
  return indice;
}

/** L'amorce, versée à toute base neuve — celle du départ comme les suivantes. */
function servirLAmorce(base) {
  for (const r of RESSOURCES) base.economie.ressources[r] = (STOCK_DE_DEPART[r] ?? 0) * 1000;
}

/**
 * Ajoute une base au joueur, et rend son indice — lot BASES-1.
 *
 * ⚠⚠ ELLE NE DÉCIDE DE RIEN : c'est `sim/fondation.js` qui dit OÙ l'on peut
 * fonder, ce qu'on écrase et qui encaisse le butin. Ici on FABRIQUE, par le même
 * `creerBase` que la première base et par la même `dispositionNouvelleBase` —
 * en écrire une seconde donnerait deux définitions de ce qu'est une base neuve.
 *
 * ⚠⚠ L'AMORCE EST SERVIE, ET CE N'EST PAS UNE LECTURE : c'est l'arbitrage du
 * 26/08 appliqué. « Toutes les bases que le joueur pose suivront la même
 * logique » — une base neuve n'est qu'un Chantier de niveau 1, et sans stock
 * rien n'y est payable. Le transfert de ressources est le lot suivant ; sans
 * l'amorce, une base fondée serait inerte jusque-là.
 *
 * ⚠ ELLE NE TOUCHE PAS À `baseCourante`. Basculer est un geste, et c'est
 * l'appelant qui le fait — le mélanger ici ferait que fonder change d'écran
 * sans qu'on puisse l'en empêcher.
 *
 * ⚠ `planifierSatellites` PREND LA BASE. Les camps paraissent dans un anneau
 * autour de LEUR base ; les planifier sans la nommer les ferait paraître autour
 * de la courante, c'est-à-dire ailleurs.
 *
 * @param {Etat} etat modifié en place
 * @param {{rangee: number, colonne: number}} position
 * @returns {number} l'indice de la base ajoutée
 */
export function ajouterUneBase(etat, position) {
  const base = creerBase(
    { rangee: position.rangee, colonne: position.colonne },
    dispositionNouvelleBase(),
  );
  servirLAmorce(base);
  etat.bases.push(base);
  planifierSatellites(etat, base);
  return etat.bases.length - 1;
}

/**
 * Vérifie qu'un état est jouable, et dit précisément ce qui ne va pas sinon.
 *
 * ⚠ ELLE LÈVE, là où `problemesDeDisposition` rend une liste — et la différence
 * est voulue. Une disposition illégale en cours de partie est un fait de JEU :
 * on la montre au joueur, il purge. Une disposition illégale au CHARGEMENT est
 * un fait de programme : la partie n'est pas jouable, et continuer produirait
 * des résultats faux en silence.
 *
 * @param {Etat} etat
 */
function exigerChamp(etat, champ) {
  if (etat[champ] === undefined) {
    throw new Error(`etat : champ « ${champ} » absent`);
  }
}

/**
 * Les défauts de disposition qui NE FONT PAS lever au chargement.
 *
 * ⚠ POURQUOI CET ENSEMBLE EXISTE, ET POURQUOI IL DOIT RESTER MINUSCULE.
 * `verifierEtat` lève là où `problemesDeDisposition` rend une liste, et c'est
 * la bonne règle : une disposition illégale en cours de partie est un fait de
 * JEU, au chargement c'est un fait de PROGRAMME. Mais elle a une limite qu'on
 * a rencontrée le 28/08 : une règle AJOUTÉE APRÈS COUP rend illégales des bases
 * qui étaient parfaitement légales quand le joueur les a construites.
 *
 * `uniques-voisins` est exactement ce cas. La règle « deux bâtiments uniques ne
 * se touchent pas » a été arbitrée le 28/08 ; la base d'Ethan, mesurée sur sa
 * capture du même jour, porte le Centre de commandement, le QG de défense et le
 * Chantier côte à côte. La faire lever au chargement aurait rendu sa partie
 * INJOUABLE — et pour une faute qu'il n'a pas commise.
 *
 * ⚠ CE N'EST PAS UNE INDULGENCE, C'EST UN REPORT. Le défaut est toujours
 * SIGNALÉ — `problemesDeDisposition` le rend, l'écran le montre — et il
 * interdit toujours toute NOUVELLE pose au contact d'un unique, puisque
 * `problemesDeLaPose` ne filtre que les défauts PRÉEXISTANTS. Le joueur voit,
 * le joueur purge. C'est « rien ne se retire en silence » (CLAUDE.md §4).
 *
 * ⚠ N'Y METTRE QU'UNE RÈGLE NÉE APRÈS DES SAUVEGARDES. Un code de faute
 * structurelle — `sans-chantier`, `superposition`, `hors-base` — n'a rien à y
 * faire : ceux-là n'ont jamais été légaux, donc aucune sauvegarde honnête ne
 * les porte, et les tolérer ferait tourner le moteur sur un état incohérent.
 */
// ⚠ `obstacle` A REJOINT L'ENSEMBLE LE 29/08, et pour la raison EXACTE qui
// justifiait `uniques-voisins` : c'est une règle qui peut rendre illégale une
// pièce posée légalement. Mieux — ou pire — ici, le terrain se REDÉDUIT à chaque
// chargement : le jour où le tirage des obstacles changera (les deux tirages qui
// coexistent devront se rejoindre, voir CLAUDE.md), un obstacle apparaîtra sous
// une pièce déjà posée sans que le joueur ait touché à quoi que ce soit.
// Le défaut reste SIGNALÉ — `problemesDeLaPoseDEffectif` le rend, l'écran le
// montre — et toute NOUVELLE pose au même endroit est refusée.
export const CODES_TOLERES_AU_CHARGEMENT = new Set(['uniques-voisins', 'obstacle']);

function verifierEtat(etat) {
  // ⚠ `fondation` EST REDONDANT ICI, et la garde reste quand même. Mesuré le
  // 27/08 par injection : retirer `fondation` de cette liste ne fait tomber
  // aucun test, parce que `charger` l'exige déjà plus tôt et qu'il est
  // aujourd'hui le SEUL chemin qui produise un état venu du dehors. Ce qui la
  // rendrait nécessaire : un second point d'entrée — import, éditeur, outil de
  // debug — qui fabriquerait un état sans passer par `charger`. Sans ce
  // commentaire, quelqu'un l'aurait « nettoyée » sans savoir ce qu'elle tient.
  for (const champ of ['bases', 'baseCourante', 'attaque', 'sitesEntames', 'basesRasees', 'recherche', 'poisAcquis', 'prochaineInstanceSatellite', 'satellitesDetruits']) {
    exigerChamp(etat, champ);
  }
  // ⚠ LA LISTE DE BASES SE VÉRIFIE AVANT SES BASES. Sans ces deux lignes,
  // `baseCourante` lèverait sur une sauvegarde amputée avec un message qui parle
  // d'un indice, pas d'un champ manquant.
  if (!Array.isArray(etat.bases) || etat.bases.length === 0) {
    throw new Error('etat : « bases » doit être une liste d\'au moins une base');
  }
  if (!Number.isInteger(etat.baseCourante)
    || etat.baseCourante < 0 || etat.baseCourante >= etat.bases.length) {
    throw new Error(
      `etat : base courante ${etat.baseCourante} hors de 0…${etat.bases.length - 1}`,
    );
  }
  // ⚠⚠ DEUX CHAMPS DE `CHAMPS_DE_BASE` NE SONT PAS EXIGÉS ICI, ET C'EST LE
  // COMPORTEMENT D'AVANT LE DÉPLIAGE, PAS UN OUBLI. `reserveReparation` est
  // vérifiée quinze lignes plus bas par `problemesDesReserves`, qui rend un
  // message qui parle de RÉSERVE — l'exiger ici la ferait échouer d'abord, sur
  // « champ absent », et le refus cesserait de dire ce qui manque vraiment.
  // `dernierDeplacementTick`, lui, n'a jamais été vérifié : une base qui ne
  // l'a pas ne s'est jamais déplacée, ce que `ticksAvantProchainDeplacement`
  // lit déjà comme `null`.
  //
  // ⚠ ILS SE RETIRENT DE LA LISTE COMMUNE, ils ne se recopient pas. Une seconde
  // liste écrite à la main cesserait d'être juste au premier champ qu'une base
  // gagnerait, et la divergence ne se verrait qu'au chargement.
  const HORS_EXIGENCE = new Set(['reserveReparation', 'dernierDeplacementTick']);
  for (const base of etat.bases) {
    for (const champ of CHAMPS_DE_BASE) {
      if (!HORS_EXIGENCE.has(champ)) exigerChamp(base, champ);
    }
  }
  const base = baseCourante(etat);
  // ⚠ « CHAMP ABSENT » ET « LISTE VIDE » NE SONT PAS LA MÊME CHOSE, et c'est
  // toute la raison d'être de ces deux lignes. Une sauvegarde v7 sans `armee`
  // est un fait de PROGRAMME — quelque chose l'a écrite de travers. Une armée
  // VIDE est parfaitement légale : c'est l'état de toute base neuve, et le
  // rester tant que le Centre de commandement n'est pas posé.
  for (const b of etat.bases) {
    for (const force of Object.keys(FORCES)) verifierForce(b, force);
  }
  // ⚠ CHAQUE BASE, ET LE COMPTEUR GLOBAL AVEC — lot BASES-1. Les satellites sont
  // par base, le compteur d'instance ne l'est plus : ne vérifier que la base
  // courante laisserait passer une seconde base malformée jusqu'au premier tick.
  for (const b of etat.bases) {
    const defautsSatellites = problemesDesSatellites(b.satellites, etat.prochaineInstanceSatellite);
    if (defautsSatellites.length > 0) {
      throw new Error(`etat : satellites injouables — ${defautsSatellites.join(' ; ')}`);
    }
  }
  const defautsPois = problemesDesPoisAcquis(etat.poisAcquis);
  if (defautsPois.length > 0) {
    throw new Error(`etat : POI acquis injouables — ${defautsPois.join(' ; ')}`);
  }
  const defautsSites = problemesDesSitesEntames(etat.sitesEntames);
  if (defautsSites.length > 0) {
    throw new Error(`etat : sites entamés injouables — ${defautsSites.join(' ; ')}`);
  }
  for (const b of etat.bases) {
    const defautsReserve = problemesDesReserves(b.reserveReparation ?? null);
    if (defautsReserve.length > 0) {
      throw new Error(`etat : réserve de réparation injouable — ${defautsReserve.join(' ; ')}`);
    }
  }
  // ⚠ UNE LISTE, ET PAS PLUS LONGUE QUE LA BORNE. Un journal qui déborde est un
  // fait de PROGRAMME — rien dans le jeu ne peut l'allonger au-delà de dix — et
  // il grossirait la sauvegarde sans que rien ne le dise. Le CONTENU d'un
  // rapport, lui, n'est pas vérifié : c'est de l'affichage, pas une règle, et
  // un rapport mal formé ne rend la partie ni incohérente ni injouable.
  if (!Array.isArray(etat.rapports)) {
    throw new Error('etat : « rapports » n\'est pas une liste');
  }
  if (etat.rapports.length > APRES_RAID.rapportsGardes) {
    throw new Error(
      `etat : ${etat.rapports.length} rapports gardés pour une borne de `
      + `${APRES_RAID.rapportsGardes}`,
    );
  }
  if (base.economie.residus.length !== base.disposition.length) {
    throw new Error(
      `etat : ${base.economie.residus.length} résidus pour ${base.disposition.length} bâtiments`,
    );
  }
  // ⚠ TOUS LES DÉFAUTS NE SONT PAS DES FAUTES DE PROGRAMME — voir
  // `CODES_TOLERES_AU_CHARGEMENT` juste au-dessus.
  const problemes = problemesDeDisposition(base.disposition, base.champs)
    .filter((p) => !CODES_TOLERES_AU_CHARGEMENT.has(p.code));
  if (problemes.length > 0) {
    throw new Error(`etat : disposition injouable — ${problemes.map((p) => p.message).join(' ; ')}`);
  }
}

/**
 * Avance le jeu d'exactement UN tick : horloge puis économie.
 * C'est LA boucle du jeu ; tout ce qui devient par-tick dans les lots
 * suivants (combat, raids) se branche ici.
 * @param {Etat} etat
 * @param {object} params
 */
export function tickJeu(etat) {
  // ⚠ LA MINUTE SE PREND AVANT L'HORLOGE, ET C'EST CE QUI REND LES DEUX CHEMINS
  // COMPARABLES. Le rattrapage fait exactement le même geste sur toute sa
  // fenêtre : il note où il part, il avance, il résout les minutes traversées.
  const minuteAvant = minuteDeLHorloge(etat.horloge.nbTicks);
  tickHorloge(etat.horloge);
  // ⚠ AVANT L'ÉCONOMIE, PAS APRÈS. Sinon le tick où un POI est acquis produit
  // encore à l'ancien débit. Aujourd'hui la différence est invisible —
  // l'acquisition est figée dès le tick 0, la base ne bougeant pas — mais
  // l'ordre juste ne coûte rien à écrire maintenant et coûterait un bogue à
  // trouver le jour du redéploiement.
  releverLesPoisAcquis(etat);
  const base = baseCourante(etat);
  tickEconomieBase(
    base.economie, base.disposition, base.champs,
    majorationsDeProduction(etat.poisAcquis),
  );
  resoudreSatellites(etat);
  avancerPointsAttaque(etat, 1);
  reparerLesSites(etat);
  crediterLesReserves(etat, 1);
  // ⚠⚠ EN DERNIER, ET APRÈS TOUT LE RESTE. Un raid modifie la disposition, la
  // position, l'économie et la réserve : le placer avant l'économie ferait
  // produire le tick sur une base déjà rasée, et le rattrapage — qui découpe sa
  // fenêtre AUX instants des raids — ne pourrait pas reproduire cet ordre-là.
  //
  // ⚠ ET LA LISTE DES ATTAQUANTES NE SE PREND QU'AU PASSAGE D'UNE MINUTE.
  // `basesAttaquantes` coûte 441 lectures de case ; l'appeler à chaque tick
  // multiplierait par cent le coût de la boucle du jeu, pour une réponse
  // identique 599 fois sur 600.
  resoudreLesMinutes(etat, minuteAvant, minuteDeLHorloge(etat.horloge.nbTicks));
}

/**
 * Résout les raids de l'Ouvrage des minutes de `]minuteAvant, minuteApres]`.
 *
 * ⚠ LE MÊME CODE SERT LES DEUX CHEMINS, et c'est ce qui fait tenir T1. Le direct
 * l'appelle sur une fenêtre d'une minute au plus ; le rattrapage l'appelle sur
 * la minute exacte d'un raid qu'il vient d'aller chercher. Deux implémentations
 * — une « par tick », une « par fenêtre » — auraient divergé au premier cas
 * particulier, et la divergence ne se serait vue qu'au retour d'un joueur après
 * trois jours.
 *
 * @param {Etat} etat modifié en place
 * @param {number} minuteAvant exclue
 * @param {number} minuteApres incluse
 */
function resoudreLesMinutes(etat, minuteAvant, minuteApres) {
  if (minuteApres <= minuteAvant) return;
  for (let m = minuteAvant + 1; m <= minuteApres; m += 1) {
    resoudreLaMinute(etat, m, basesAttaquantes(etat));
  }
}

/**
 * Rattrapage analytique : strictement équivalent à nbTicks appels de
 * tickJeu, en temps constant par bâtiment (test 11). Utilisé au retour
 * d'une absence : le temps hors ligne est converti en ticks par l'horloge
 * (accumuler), puis rattrapé ici d'un coup.
 * @param {Etat} etat
 * @param {number} nbTicks
 * @param {object} params
 */
export function rattraperJeu(etat, nbTicks) {
  // ⚠⚠⚠ LE SEUL SYSTÈME DU JEU QUI NE SE RÉSOUDE PAS EN UN APPEL, ET IL FALLAIT
  // DÉCOUPER LA FENÊTRE PLUTÔT QUE DE LE CONTOURNER — lot RAID-B, 02/09.
  //
  // Les cinq systèmes ci-dessous ne lisent que l'horloge courante : mille ticks
  // d'un coup leur valent mille ticks un par un, et chacun porte sa condition de
  // rupture écrite. Un raid de l'Ouvrage, lui, arrive à un INSTANT PRÉCIS et
  // MODIFIE l'état pour tout ce qui suit — il vide la réserve de réparation, il
  // peut raser la base et la DÉPLACER de vingt cases, il met les stocks à zéro.
  // Deux raids résolus dans le désordre ne rendent pas ce que l'ordre rend.
  //
  // La fenêtre est donc coupée à chaque raid retenu, et chaque morceau est
  // rattrapé par le corps analytique d'avant, inchangé. `tickJeu` × n ≡
  // `rattraperJeu(n)` tient alors PAR CONSTRUCTION et non par vérification :
  // c'est la même fonction qui résout les minutes des deux côtés.
  //
  // ⚠ CE QUI BORNE LA BOUCLE : le nombre de RAIDS RETENUS, pas le nombre de
  // ticks. Sur 36 h avec cinq bases à portée, 10 800 tirages — un hachage
  // chacun — pour environ sept combats. La liste des attaquantes, elle, coûte
  // 441 lectures de case et se prend UNE fois par segment.
  //
  // ⚠ ET VOICI SA CONDITION DE RUPTURE, ÉCRITE : cette boucle cesserait d'être
  // tenable le jour où `RAID_OUVRAGE.chanceParMinute` monterait d'un ordre de
  // grandeur, ou où les bases à portée se compteraient par dizaines. Ce ne
  // serait plus sept combats de 900 ticks mais soixante-dix, et le retour d'une
  // absence de trois jours se paierait en secondes. C'est M1 qui le mesure.
  exigerTicks(nbTicks);
  let restants = nbTicks;
  while (restants > 0) {
    const minuteCourante = minuteDeLHorloge(etat.horloge.nbTicks);
    const minuteFin = minuteDeLHorloge(etat.horloge.nbTicks + restants);
    // ⚠ LA LISTE SE PREND ICI, UNE FOIS PAR SEGMENT, ET C'EST EXACT. Elle ne
    // dépend que de la graine, de la position du joueur et des bases rasées ;
    // aucun des trois ne bouge entre deux raids. Le jour où un satellite pourrait
    // se poser sur une base de l'Ouvrage — `poserUnSatellite` le refuse — ou où
    // la carte changerait au fil du temps, cette mise en cache cesserait d'être
    // juste, et c'est T1 qui le dirait.
    const attaquantes = basesAttaquantes(etat);
    const minuteDuRaid = prochaineMinuteDeRaid(
      etat.graine, attaquantes, minuteCourante, minuteFin,
    );
    if (minuteDuRaid === null) {
      avancerAnalytiquement(etat, restants);
      return;
    }
    // On avance JUSQU'AU premier tick de cette minute — celui-là même où le
    // chemin direct aurait franchi la frontière et résolu le raid.
    const jusque = minuteDuRaid * TICKS_PAR_MINUTE - etat.horloge.nbTicks;
    avancerAnalytiquement(etat, jusque);
    restants -= jusque;
    resoudreLaMinute(etat, minuteDuRaid, attaquantes);
  }
}

/** Une durée de rattrapage est un nombre entier de ticks, jamais négatif. */
function exigerTicks(nbTicks) {
  if (!Number.isInteger(nbTicks) || nbTicks < 0) {
    throw new RangeError(`rattraperJeu : « ${nbTicks} » ticks — entier ≥ 0 attendu`);
  }
}

/**
 * Le rattrapage analytique d'un segment SANS raid — le corps d'avant RAID-B,
 * mot pour mot.
 *
 * ⚠ IL N'A PAS BOUGÉ D'UNE LIGNE, ET C'EST VOULU. Les cinq conditions de rupture
 * qu'il porte étaient justes et le restent ; ce qui a changé, c'est qu'on
 * l'appelle plusieurs fois au lieu d'une. La composition est exacte pour chacun
 * des cinq — c'est ce que la ligne « rattraper deux fois vaut rattraper une
 * fois » dit déjà de l'économie, et les quatre autres se composent pour la même
 * raison : `min` et addition d'entiers, ou lecture de l'horloge courante.
 *
 * @param {Etat} etat
 * @param {number} nbTicks
 */
function avancerAnalytiquement(etat, nbTicks) {
  if (nbTicks === 0) return;
  avancerTicks(etat.horloge, nbTicks);
  // ⚠⚠ UN SEUL APPEL, PAS UNE BOUCLE — même raisonnement que `resoudreSatellites`
  // ci-dessous, mais pour une raison à lui : l'acquisition ne dépend QUE de la
  // POSITION des bases, qu'aucun tick ne modifie. Mille ticks d'un coup
  // acquièrent donc exactement ce que mille ticks un par un auraient acquis.
  //
  // ⚠⚠ ET SA CONDITION DE RUPTURE EST ADVENUE — lot RAID-B, 02/09/2026. Elle
  // annonçait : « le jour où la base pourra se DÉPLACER en cours de rattrapage,
  // cette ligne cessera d'être juste — le territoire aura balayé des cases que ce
  // seul appel n'aura jamais vues ». Ce jour est celui du rasage : la sanction de
  // `RAID_OUVRAGE` redéploie la base de vingt cases vers le bas, et elle peut
  // tomber au milieu d'une absence de trois jours.
  //
  // ⚠ CE QUI LA TRAITE : le rattrapage ne fait plus UN appel mais un par SEGMENT,
  // et `subirUnRaid` rappelle lui-même `releverLesPoisAcquis` à l'instant du
  // rasage. La ligne ci-dessous redevient donc juste au sens strict — pendant un
  // segment, la base ne bouge pas, par construction, puisqu'un segment s'arrête
  // à chaque raid. C'est T7 qui le mesure, avec la falsification qui retire le
  // rappel : les POI de l'ancienne position survivent alors au déménagement.
  releverLesPoisAcquis(etat);
  const base = baseCourante(etat);
  rattrapageEconomieBase(
    base.economie, base.disposition, base.champs, nbTicks,
    majorationsDeProduction(etat.poisAcquis),
  );
  // ⚠ UN SEUL APPEL, PAS UNE BOUCLE, ET C'EST CE QUI REND LES DEUX CHEMINS
  // ÉQUIVALENTS. `resoudreSatellites` ne lit que l'horloge courante : mille
  // ticks d'un coup font paraître exactement ce que mille ticks un par un
  // auraient fait paraître. Le jour où une apparition dépendra de l'instant
  // PRÉCIS où elle tombe, cette ligne cessera d'être juste — et le test des deux
  // chemins le dira.
  resoudreSatellites(etat);
  // ⚠ MÊME RAISON, MÊME FORME : un seul appel de n ticks, pas une boucle. Le
  // résidu de `regenerer` porte la fraction de point non acquise, si bien que
  // `plafond × n + résidu` est le numérateur EXACT de n ticks d'un coup. Un
  // test compare les deux chemins sur un plafond qui ne divise pas le
  // diviseur — c'est le seul montage où une implémentation naïve diverge.
  avancerPointsAttaque(etat, nbTicks);
  // ⚠ MÊME RAISON QUE LES SATELLITES : un seul appel, pas une boucle. La
  // réparation ne lit que l'horloge courante, donc mille ticks d'un coup
  // réparent ce que mille ticks un par un auraient réparé.
  reparerLesSites(etat);
  // ⚠ MÊME FORME QUE LES TROIS AUTRES : un seul appel de n ticks, pas une
  // boucle. La réserve se crédite par `min(plafond, reserve + n)`, en TICKS
  // ENTIERS : l'addition et le `min` étant exacts, n crédits de 1 donnent
  // exactement le même nombre que n d'un coup. Créditer en secondes flottantes
  // ferait diverger les deux chemins par accumulation d'arrondis.
  //
  // ⚠ ET VOICI SA CONDITION DE RUPTURE, ÉCRITE : l'équivalence tient parce que
  // le PLAFOND NE BOUGE PAS pendant le rattrapage — il ne dépend que du niveau
  // de l'armée, et l'armée ne se compose pas hors ligne. Le jour où elle pourra
  // monter de niveau en cours de rattrapage, le plafond deviendra une fonction
  // du temps et cette ligne cessera d'être juste. C'est le test d'équivalence
  // des deux chemins qui doit tomber en premier.
  crediterLesReserves(etat, nbTicks);
}

// ---------------------------------------------------------------------------
// Poser un bâtiment — la seule action du joueur qui n'attende aucun arbitrage
// ---------------------------------------------------------------------------
//
// ⚠ POSER NE COÛTE RIEN, ET CE N'EST PAS UNE FACILITÉ. `ECONOMIE_NIVEAU.premierNiveauPayant`
// vaut 2 : le niveau 1 est gratuit pour les onze bâtiments. Le premier coût est
// celui du niveau 2, c'est-à-dire de la première AMÉLIORATION — et c'est elle,
// pas la pose, qui bute sur l'arbitrage manquant (comment un coût se répartit
// entre quartz et scorie). Améliorer et démonter ne sont donc pas ici ; poser
// l'est, parce que rien ne l'en empêchait.
//
// ⚠ AUCUNE RÈGLE N'EST RÉÉCRITE ICI. La légalité d'une pose, c'est exactement la
// légalité de la disposition qui en résulterait : `problemesDeDisposition` sait
// déjà tout dire — case occupée, hors base, collecteur hors champ, champ gâché
// par autre chose, exemplaire en trop d'un bâtiment `unique`, emplacements
// dépassés. Fabriquer une seconde liste de règles ici, c'est se préparer à les
// faire diverger. On construit la disposition CANDIDATE et on la soumet.
//
// ⚠ DEUX FONCTIONS, ET LA DIFFÉRENCE EST LA MÊME QU'AILLEURS. `problemesDeLaPose`
// rend une LISTE : une pose refusée est un fait de JEU, le joueur a visé une
// case prise, on le lui montre. `poser` LÈVE : appelée sans que l'appelant ait
// regardé, c'est un fait de PROGRAMME.

/**
 * Ce qui empêcherait de poser ce bâtiment là, au niveau 1.
 *
 * @param {Etat} etat
 * @param {string} id clé de BASE_BATIMENTS
 * @param {number} rangee
 * @param {number} colonne
 * @returns {Array<{code: string, message: string}>} vide si la pose est légale
 */
export function problemesDeLaPose(etat, id, rangee, colonne) {
  const base = baseCourante(etat);
  exigerChamp(base, 'disposition');
  exigerChamp(base, 'champs');
  const candidate = [...base.disposition, { id, rangee, colonne, niveau: 1 }];
  // Les problèmes de la disposition ACTUELLE ne sont pas imputables à la pose :
  // une base déjà bancale — un raid l'a amputée, une sauvegarde ancienne — ne
  // doit pas rendre toute pose impossible en faisant remonter ses propres
  // défauts. On ne garde que ce qui apparaît.
  const avant = new Set(
    problemesDeDisposition(base.disposition, base.champs).map((p) => `${p.code}|${p.message}`),
  );
  return problemesDeDisposition(candidate, base.champs)
    .filter((p) => !avant.has(`${p.code}|${p.message}`));
}

/**
 * Pose un bâtiment de niveau 1 sur la case donnée.
 *
 * ⚠ LE RÉSIDU SUIT LE BÂTIMENT. `economie-base` tient un résidu par bâtiment et
 * par ressource, et il asserte que les deux listes ont la même longueur. Poser
 * sans allonger les résidus ferait lever le tick suivant — pas la pose, le tick,
 * donc loin de la faute.
 *
 * @param {Etat} etat modifié en place
 * @param {string} id
 * @param {number} rangee
 * @param {number} colonne
 * @returns {Etat} le même état
 */
export function poser(etat, id, rangee, colonne) {
  const problemes = problemesDeLaPose(etat, id, rangee, colonne);
  if (problemes.length > 0) {
    throw new Error(
      `poser : pose illégale — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  // ⚠⚠ CETTE LISTE EST FERMÉE, ET C'EST LE PIÈGE QUE `CLAUDE.md` §6 NOMME DÉJÀ
  // POUR `ajouterEntite` ET `poserEffectif`. Un champ que l'appelant croit poser
  // et qui n'est pas nommé ICI disparaît en SILENCE. `degatsMilli` y est entré
  // au lot RAID-B, avec `BASE_NEUVE` : l'oublier aurait donné un bâtiment sans
  // le champ dans la sauvegarde, donc un `undefined` que `pvCourantsMilli` lit
  // comme « intact » — un bâtiment neuf est bien intact, si bien qu'AUCUN raid
  // de référence n'aurait bronché, jusqu'au premier bâtiment posé PUIS attaqué.
  const base = baseCourante(etat);
  base.disposition.push({
    id, rangee, colonne, niveau: 1, degatsMilli: 0,
  });
  const residu = {};
  for (const r of RESSOURCES) residu[r] = 0;
  base.economie.residus.push(residu);
  return etat;
}

// ---------------------------------------------------------------------------
// Améliorer et démolir
// ---------------------------------------------------------------------------
//
// Les deux suivent la forme de `poser` : une fonction qui LISTE les problèmes,
// une fonction qui agit et lève si la liste n'est pas vide. L'écran interroge
// la première pour savoir s'il peut proposer le geste, et appelle la seconde.
// Un `catch` qui rattraperait le refus serait le signe que l'écran a appelé
// sans regarder — même discipline que pour la pose.
//
// ⚠ LES COÛTS SONT EN UNITÉS, LES STOCKS EN MILLI-UNITÉS. `data/base.js` rend
// des unités, `etat.economie.ressources` en compte des milliers. La conversion
// se fait ICI et une seule fois, par `MILLI`. Un coût comparé à un stock sans
// conversion rend une amélioration mille fois trop chère — donc jamais
// finançable, donc un bouton qui ne s'allume jamais, ce qui se lit comme
// « l'arbitrage n'est pas descendu » et non comme un défaut.
//
// ⚠ IL N'Y A AUCUNE MINUTERIE DE CONSTRUCTION, et ce n'est pas un oubli : le
// dépôt n'en porte nulle part, et la « réserve de temps » est encore un TROU du
// classeur. Une montée est donc INSTANTANÉE. Le jour où une file de
// construction est arbitrée, c'est ici qu'elle s'intercale — entre la garde et
// la mutation — et `SAVE_VERSION` bougera.

/** Le facteur entre une unité de `data/` et une milli-unité de l'état. */
const MILLI = 1000;

/**
 * Ce qui empêche d'améliorer le bâtiment d'indice donné. Liste vide = geste
 * possible. Chaque entrée porte un `code` lisible par l'écran et un `message`
 * en français lisible par le joueur.
 *
 * @param {Etat} etat
 * @param {number} index indice dans `etat.disposition`
 * @returns {Array<{code: string, message: string}>}
 */
/**
 * Ce qui empêche de déplacer le bâtiment d'indice donné vers cette case.
 *
 * ⚠ AUCUNE RÈGLE N'EST RÉÉCRITE, exactement comme pour `problemesDeLaPose` : la
 * légalité d'un déplacement est celle de la disposition qui en résulterait. On
 * construit la candidate — le même bâtiment, la même liste, une autre case — et
 * on la soumet à `problemesDeDisposition`. Une seconde table de règles finirait
 * par diverger de la première, sur le voisinage ou sur les champs.
 *
 * ⚠ LES DÉFAUTS PRÉEXISTANTS SONT FILTRÉS, pour la même raison que la pose :
 * une base déjà bancale doit rester réarrangeable. C'est même le cas qui compte
 * le plus ici — depuis le 28/08 une base peut porter deux uniques voisins,
 * tolérés au chargement, et déplacer est précisément ce qui permet de la
 * réparer. Faire remonter le défaut sur chaque déplacement enfermerait le
 * joueur dans la faute qu'on lui demande de corriger.
 *
 * ⚠ RESTER SUR PLACE EST LÉGAL, et rend une liste vide. Ce n'est pas un cas
 * d'erreur : le joueur a le droit de reposer le bâtiment là où il était, et le
 * refuser obligerait l'écran à connaître cette exception.
 *
 * @param {Etat} etat
 * @param {number} index indice dans `etat.disposition`
 * @param {number} rangee
 * @param {number} colonne
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDuDeplacement(etat, index, rangee, colonne) {
  const base = baseCourante(etat);
  exigerChamp(base, 'disposition');
  exigerChamp(base, 'champs');
  const batiment = base.disposition[index];
  if (batiment === undefined) {
    throw new RangeError(`deplacer : indice ${index} hors de la disposition`);
  }
  const candidate = base.disposition.map(
    (b, i) => (i === index ? { ...b, rangee, colonne } : b),
  );
  const avant = new Set(
    problemesDeDisposition(base.disposition, base.champs).map((p) => `${p.code}|${p.message}`),
  );
  return problemesDeDisposition(candidate, base.champs)
    .filter((p) => !avant.has(`${p.code}|${p.message}`));
}

/**
 * Déplace un bâtiment vers une autre case de la base.
 *
 * ⚠ DÉPLACER NE COÛTE RIEN, ET CE N'EST PAS UN OUBLI. Aucun prix n'a été
 * arbitré ; en inventer un serait trancher seul une mécanique de jeu, ce que le
 * dépôt s'interdit. Le jour où Ethan en fixera un, il se débitera ici, au même
 * endroit qu'`ameliorer` débite le sien.
 *
 * ⚠ L'INDICE NE BOUGE PAS, DONC LE RÉSIDU SUIT TOUT SEUL. `economie.residus`
 * est parallèle à `disposition` : un déplacement qui réécrirait la liste dans
 * un autre ordre — un `splice` puis un `push`, par exemple — décalerait les
 * résidus d'un cran et ferait produire à chaque bâtiment le reste de son
 * voisin. On modifie la case EN PLACE, et il n'y a rien à faire de plus.
 *
 * @param {Etat} etat modifié en place
 * @param {number} index
 * @param {number} rangee
 * @param {number} colonne
 * @returns {Etat} le même état
 */
export function deplacer(etat, index, rangee, colonne) {
  const problemes = problemesDuDeplacement(etat, index, rangee, colonne);
  if (problemes.length > 0) {
    throw new Error(
      `deplacer : déplacement illégal — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const batiment = baseCourante(etat).disposition[index];
  batiment.rangee = rangee;
  batiment.colonne = colonne;
  return etat;
}

export function problemesDeLAmelioration(etat, index) {
  const base = baseCourante(etat);
  exigerChamp(base, 'disposition');
  exigerChamp(base, 'economie');
  const batiment = base.disposition[index];
  if (batiment === undefined) {
    throw new RangeError(`ameliorer : indice ${index} hors de la disposition`);
  }

  const problemes = [];
  const vise = batiment.niveau + 1;
  if (vise > GEOGRAPHIE.niveauPlafond) {
    problemes.push({
      code: 'plafond',
      message: `déjà au niveau ${GEOGRAPHIE.niveauPlafond}, le maximum`,
    });
    // Sans niveau visé légal, il n'y a pas de coût à calculer : s'arrêter ici
    // plutôt que de faire lever `coutDeMontee` sur un niveau hors bornes.
    return problemes;
  }

  // ⚠⚠ LE CHANTIER PLAFONNE TOUTE LA BASE — arbitré le 29/08/2026 par Ethan :
  // « le chantier de construction définit le niveau max des bâtiments. Donc
  // aucun bâtiment ne peut avoir un niveau supérieur à celui du chantier. »
  // C'est ce qui fait du Chantier le vrai rythme de la partie : on ne monte
  // plus rien tant qu'il n'est pas monté lui-même.
  //
  // ⚠ ET IL NE SE PLAFONNE PAS LUI-MÊME. Il EST la référence ; lui appliquer la
  // règle le figerait à son niveau de départ, et plus rien dans la base ne
  // monterait jamais. Son seul plafond est celui du jeu, testé juste au-dessus.
  const plafondDuChantier = niveauDuChantier(etat);
  if (batiment.id !== ID_CHANTIER && vise > plafondDuChantier) {
    problemes.push({
      code: 'plafond-chantier',
      message: `le ${BASE_BATIMENTS[ID_CHANTIER].nom.joueur} est au niveau `
        + `${plafondDuChantier} : montez-le d'abord`,
    });
    // Le coût du niveau visé n'a pas de sens tant qu'il est interdit, mais on
    // le calcule quand même : le joueur doit pouvoir lire les DEUX raisons
    // d'un refus, pas seulement la première. « Un indice n'est pas une
    // interdiction » vaut aussi pour les messages.
  }

  const cout = coutDeMontee(batiment.id, vise);
  for (const r of RESSOURCES) {
    const duMilli = cout[r] * MILLI;
    if (duMilli > base.economie.ressources[r]) {
      problemes.push({
        code: `manque:${r}`,
        message: `il manque ${LIBELLE_MANQUE(r, duMilli - base.economie.ressources[r])}`,
      });
    }
  }
  return problemes;
}

/**
 * Le fragment de message qui chiffre un manque, en unités entières.
 *
 * ⚠ L'ÉLISION EST PORTÉE PAR LA TABLE, pas par une règle. « de électricité »
 * s'est affiché tel quel dans le panneau de détail jusqu'au 28/08. Écrire une
 * règle d'élision sur la voyelle initiale marcherait pour ces trois mots-ci et
 * se tromperait au premier nom qui commence par un h aspiré ; la préposition
 * voyage donc AVEC le nom, une fois pour toutes.
 */
function LIBELLE_MANQUE(ressource, manqueMilli) {
  const nom = {
    quartz: 'de quartz', scorie: 'de scorie', electricite: 'd\'électricité',
  }[ressource];
  return `${Math.ceil(manqueMilli / MILLI)} ${nom}`;
}

/**
 * Monte le bâtiment d'un niveau et débite son coût.
 *
 * ⚠ LE DÉBIT ET LA MONTÉE SONT INDISSOCIABLES, et l'ordre importe : le coût se
 * calcule sur le niveau VISÉ, donc avant l'incrément. L'écrire dans l'autre
 * sens ferait payer le palier suivant.
 *
 * @param {Etat} etat modifié en place
 * @param {number} index
 * @returns {Etat} le même état
 */
export function ameliorer(etat, index) {
  const problemes = problemesDeLAmelioration(etat, index);
  if (problemes.length > 0) {
    throw new Error(
      `ameliorer : impossible — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const base = baseCourante(etat);
  const batiment = base.disposition[index];
  const cout = coutDeMontee(batiment.id, batiment.niveau + 1);
  for (const r of RESSOURCES) base.economie.ressources[r] -= cout[r] * MILLI;
  batiment.niveau += 1;
  return etat;
}

/**
 * Ce qui empêche de démolir le bâtiment d'indice donné.
 *
 * ⚠ LE CHANTIER NE SE DÉMOLIT PAS. Il ouvre les emplacements, il porte la
 * poche, et `verifierEtat` refuse une base qui n'en a pas : le retirer rendrait
 * la partie non chargeable. La garde est ici plutôt que dans l'écran pour que
 * ce soit vrai quel que soit l'appelant.
 *
 * @param {Etat} etat
 * @param {number} index
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaDemolition(etat, index) {
  const base = baseCourante(etat);
  exigerChamp(base, 'disposition');
  const batiment = base.disposition[index];
  if (batiment === undefined) {
    throw new RangeError(`demolir : indice ${index} hors de la disposition`);
  }
  const problemes = [];
  if (BASE_BATIMENTS[batiment.id]?.role === 'central') {
    problemes.push({
      code: 'central',
      message: 'le Chantier de construction ne se démolit pas',
    });
  }
  return problemes;
}

/**
 * Retire le bâtiment et rend 90 % de tout ce qui a été investi dedans.
 *
 * ⚠ TROIS LISTES SONT PARALLÈLES À `disposition`, ET UNE SEULE EXISTE
 * AUJOURD'HUI. `economie.residus` est indexée par la même position : la retirer
 * au même indice, ou `verifierEtat` lèvera au prochain chargement — et il
 * lèvera loin de la faute, comme le disait déjà le commentaire de `poser`. Si
 * un lot ajoute une seconde liste parallèle, c'est ici qu'elle se retire aussi.
 *
 * ⚠ LE REMBOURSEMENT N'EST PAS PLAFONNÉ PAR LA CAPACITÉ, délibérément. Démolir
 * une raffinerie fait baisser la capacité et peut porter le stock au-dessus :
 * `economie-base` GÈLE un stock excédentaire au lieu de l'amputer — « rien ne
 * se retire en silence », arbitré le 26/08. Écrêter ici ferait disparaître des
 * ressources que le joueur vient de récupérer, sans rien lui dire.
 *
 * @param {Etat} etat modifié en place
 * @param {number} index
 * @returns {{quartz: number, scorie: number, electricite: number}} le rendu, en
 *   UNITÉS — l'écran l'annonce au joueur.
 */
export function demolir(etat, index) {
  const problemes = problemesDeLaDemolition(etat, index);
  if (problemes.length > 0) {
    throw new Error(
      `demolir : impossible — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const base = baseCourante(etat);
  const batiment = base.disposition[index];
  const rendu = remboursementDuNiveau(batiment.id, batiment.niveau);
  for (const r of RESSOURCES) base.economie.ressources[r] += rendu[r] * MILLI;
  base.disposition.splice(index, 1);
  base.economie.residus.splice(index, 1);
  return rendu;
}

// ---------------------------------------------------------------------------
// La garnison et l'armée — les deux forces du joueur
// ---------------------------------------------------------------------------
//
// ARBITRÉ par Ethan le 28/08/2026 : « Les unités sont détruites mais pas
// perdues, doivent être réparées avec temps de réparation arbitré par caserne /
// usine / aérodrome. On garde le placement dans les 36 cases, déplacement
// gratuit, comme bâtiment. »
//
// Ce qui s'en déduit, et rien de plus :
//   — une unité détruite RESTE dans sa case, à zéro, en attente de réparation.
//     Elle n'est pas retirée de la liste. C'est le plancher de
//     `MODELE-REPARATION-1.md` §2 — « plancher 1 PV, ne meurt pas vraiment » ;
//   — le placement est une donnée de SAUVEGARDE, pas une composition jetable
//     qu'on referait à chaque raid ;
//   — déplacer ne coûte rien, comme pour un bâtiment.
//
// ⚠ VOCABULAIRE : `garnison` et `armee`, jamais `defenses` ni `unites`. Ces
// deux derniers sont déjà les noms des TABLES de `data/combat.js` et prêteraient
// à confusion à chaque relecture. Une pièce posée, de l'un ou l'autre côté,
// s'appelle un EFFECTIF — c'est ce mot qui nomme les fonctions ci-dessous.
//
// ⚠⚠ `degatsMilli` ET NON `pvMilli`, et le choix se justifie deux fois. Une
// pièce intacte se sérialise alors à `0`, ce qui est le cas courant. Et surtout :
// le jour où un PV de `data/combat.js` change, une valeur ABSOLUE enregistrée
// peut dépasser le maximum et rendre la sauvegarde incohérente en silence,
// alors que des dégâts se BORNENT à la lecture. Milli-PV parce que c'est l'unité
// du moteur de combat — deux unités feraient un arrondi à chaque passage.
//
// ⚠⚠ AUCUN TABLEAU PARALLÈLE. `economie.residus` est indexé sur `disposition`,
// et c'est ce couplage qui rend `deplacer` délicat — mutation en place, jamais
// `splice` puis `push`. Il n'est recréé ni pour la garnison ni pour l'armée :
// tout ce qui appartient à une pièce se range DANS la pièce. C'est pourquoi le
// niveau et les dégâts sont des champs de l'effectif et non deux listes de plus.
//
// ⚠ LE NIVEAU EST PAR PIÈCE, MAIS RIEN NE PERMET ENCORE D'EN POSER DEUX
// DIFFÉRENTS. Les deux éditeurs portent UN niveau pour toute la grille et le
// recopient sur chaque pièce ; ce lot conserve ce comportement. Le ranger par
// pièce dès maintenant coûte zéro et évite une SECONDE migration le jour où la
// mécanique sera arbitrée. Comment se choisit le niveau d'une pièce posée n'est
// pas tranché — ne pas l'inventer ici.

/**
 * Ce qui distingue les deux forces, et rien d'autre. Le reste du code lit cette
 * table au lieu de reconnaître « garnison » par son nom : un cas particulier
 * écrit à la main serait le premier à diverger.
 *
 * `axe` est la clé de position propre à la force — `rangee` pour la garnison,
 * qui vit dans la bande de défense de la grille, `vague` pour l'armée, dont les
 * quatre vagues ne sont pas des rangées de terrain mais des rangs d'entrée.
 */
export const FORCES = {
  garnison: {
    champ: 'garnison',
    quoi: 'garnison',
    // ⚠ SEULE LA GARNISON EST SUR LE TERRAIN, et c'est ce champ qui le dit. Ses
    // cases SONT celles du champ de bataille, donc elles peuvent porter un
    // obstacle. Les quatre vagues de l'armée sont une grille de COMPOSITION :
    // leurs colonnes deviennent les couloirs du raid, mais leurs rangées ne sont
    // pas des rangées de la grille — la bande de déploiement n'en porte d'ailleurs
    // aucun. Reconnaître « garnison » par son nom au lieu de lire ce champ serait
    // le premier cas particulier écrit à la main.
    surLeTerrain: true,
    axe: 'rangee',
    // ⚠ LE LIBELLÉ N'EST PAS LA CLÉ. `axe` indexe l'objet, `axeLibelle` s'affiche :
    // les messages de refus sont repris MOT POUR MOT par l'écran, et « rangee 11 »
    // sans accent trahirait qu'une clé de code a fui jusque sous les yeux du joueur.
    axeLibelle: 'rangée',
    axeMin: GRILLE.bandes.defense.premiere,
    axeMax: GRILLE.bandes.defense.derniere,
    colonneMax: GRILLE.largeur,
    // ⚠ LA GARNISON NE PORTE PAS LE DRAPEAU D'ACTIVITÉ. « Actif » veut dire
    // « part au raid » : une pièce de garnison ne part jamais, elle défend chez
    // elle. Lui poser le champ ferait croire qu'on peut la laisser à la maison,
    // et la migration v17 → v18 — qui ne sert que `armee` — laisserait de toute
    // façon les deux moitiés du dépôt en désaccord.
    porteLActivite: false,
    // La clé de `POINTS_ARMEE`, qui nomme le bâtiment d'où vient le budget.
    role: 'defense',
    // ⚠⚠ LE BARÈME DE MONTÉE EST DANS LA TABLE, PARCE QUE LES DEUX SONT
    // RÉELLEMENT DIFFÉRENTS. `data/couts-militaires.js` porte DEUX ancres, et
    // l'écart va jusqu'au rapport de 2,5 — le Voltigeur vaut 5 en assaut et 2
    // en garnison. `ameliorerEffectif` lit donc ce champ au lieu de choisir par
    // un `if` sur le nom de la force : le cas particulier écrit à la main
    // serait le premier à diverger, et il paraîtrait juste sur le Percheron,
    // qui est le seul à coûter le même prix des deux côtés.
    coutDeMontee: coutDeMonteeDefense,
    // Les neuf ouvrages plus les unités qui ont un rôle défensif. La liste se
    // LIT dans les tables (`data/couts-militaires.js`), elle ne se recopie pas :
    // un test croise déjà cette lecture avec celle de l'écran de défense.
    roster: new Set(rosterDefensif()),
  },
  armee: {
    champ: 'armee',
    quoi: 'armée',
    surLeTerrain: false,
    axe: 'vague',
    axeLibelle: 'vague',
    axeMin: 1,
    axeMax: EMPLACEMENTS_ASSAUT.vagues,
    colonneMax: EMPLACEMENTS_ASSAUT.parVague,
    // ⚠ SEULE L'ARMÉE PORTE LE DRAPEAU D'ACTIVITÉ, et c'est ce champ qui le dit,
    // sur le modèle exact de `surLeTerrain` ci-dessus. Reconnaître « armee » par
    // son nom au lieu de lire ce champ serait le cas particulier écrit à la main
    // que ce fichier refuse déjà ailleurs.
    porteLActivite: true,
    role: 'offense',
    coutDeMontee: coutDeMonteeOffense,
    roster: new Set(Object.keys(UNITES)),
  },
};

/**
 * Le défaut d'activité d'une pièce, pour la force qui porte le drapeau.
 *
 * ⚠ IL S'ÉTALE AVANT `...piece`, TOUJOURS : un appelant qui pose explicitement
 * `actif: false` doit gagner. L'inverse écraserait sa demande en silence.
 *
 * @param {object} f la ligne de `FORCES`
 * @returns {{actif?: boolean}}
 */
function defautDActivite(f) {
  return f.porteLActivite ? { actif: true } : {};
}

function exigerForce(force) {
  if (FORCES[force] === undefined) {
    throw new Error(`etat : « ${force} » n'est pas une force — garnison ou armee`);
  }
  return FORCES[force];
}

/**
 * Les défauts STRUCTURELS d'un effectif : ce qui empêcherait la sauvegarde
 * d'être relue, pas ce qui empêcherait le joueur de jouer.
 *
 * ⚠⚠ LE BUDGET N'EST PAS ICI, ET SON ABSENCE EST DÉLIBÉRÉE. Une composition qui
 * dépasse son budget est un fait de JEU, pas un fait de programme : elle arrive
 * pour de bon dès que le budget BAISSE — QG démoli, QG tombé au raid — sous une
 * armée déjà posée. La refuser au chargement rendrait la partie illisible pour
 * une faute que le joueur n'a pas commise, exactement comme `uniques-voisins`
 * l'aurait fait le 28/08. On le SIGNALE et on propose de purger ; jamais
 * d'amputation automatique (CLAUDE.md §4).
 *
 * ⚠ NI L'APPARITION, POUR LA MÊME RAISON. Un niveau de commandement qui
 * redescend verrouille des unités déjà posées ; c'est `purger` des éditeurs qui
 * s'en occupe, sur demande du joueur.
 *
 * @param {string} force 'garnison' ou 'armee'
 * @param {Array<Effectif>} liste la force entière, pour la superposition
 * @param {Effectif} piece
 * @param {number|null} indexIgnore indice à ne pas compter comme voisin — la
 *   pièce elle-même, quand on la vérifie ou qu'on la déplace
 * @returns {Array<{code: string, message: string}>}
 */
function problemesDeLEffectif(force, liste, piece, indexIgnore, obstacles = []) {
  const f = exigerForce(force);
  const problemes = [];

  if (!f.roster.has(piece.id)) {
    problemes.push({ code: 'inconnu', message: `« ${piece.id} » n'a pas sa place en ${f.quoi}` });
  }
  const axe = piece[f.axe];
  if (!Number.isInteger(axe) || axe < f.axeMin || axe > f.axeMax) {
    problemes.push({
      code: 'hors-grille',
      message: `${f.axeLibelle} ${axe} hors de ${f.axeMin}…${f.axeMax}`,
    });
  }
  if (!Number.isInteger(piece.colonne) || piece.colonne < 1 || piece.colonne > f.colonneMax) {
    problemes.push({
      code: 'hors-grille',
      message: `colonne ${piece.colonne} hors de 1…${f.colonneMax}`,
    });
  }
  const occupee = liste.some(
    (autre, i) => i !== indexIgnore && autre[f.axe] === axe && autre.colonne === piece.colonne,
  );
  if (occupee) {
    problemes.push({ code: 'superposition', message: 'cette case est déjà occupée' });
  }
  // ⚠ « OCCUPÉE » ET « OBSTRUÉE » SONT DEUX CODES, PAS UN. Le joueur peut
  // déplacer ce qui occupe ; il ne déplacera jamais un obstacle. Les confondre
  // ferait dire à l'écran « cette case est déjà occupée » devant un rocher, et
  // le joueur chercherait la pièce à retirer.
  if (f.surLeTerrain && obstacles.some(
    (o) => o.rangee === axe && o.colonne === piece.colonne,
  )) {
    problemes.push({ code: 'obstacle', message: 'cette case porte un obstacle' });
  }
  if (!Number.isInteger(piece.niveau) || piece.niveau < 1 || piece.niveau > NIVEAU.plafond) {
    problemes.push({
      code: 'niveau',
      message: `niveau ${piece.niveau} hors de 1…${NIVEAU.plafond}`,
    });
  }
  // ⚠ AUCUN PLAFOND SUR LES DÉGÂTS, ET C'EST LE POINT DE `degatsMilli`. Les
  // borner ici exigerait de lire les PV de la table, donc de refuser une
  // sauvegarde le jour où un PV baisse. Ils se bornent à la LECTURE, par qui
  // calcule des PV restants — pas à l'écriture.
  if (!Number.isInteger(piece.degatsMilli) || piece.degatsMilli < 0) {
    problemes.push({
      code: 'degats',
      message: `dégâts « ${piece.degatsMilli} » — entier de milli-PV ≥ 0 attendu`,
    });
  }
  return problemes;
}

/**
 * Vérifie une force entière au chargement. LÈVE — au chargement, un effectif
 * malformé est un fait de programme.
 *
 * ⚠ ELLE PREND UNE BASE, PAS L'ÉTAT — lot BASES-0. Elle ne lit que des champs
 * par-base ; lui passer l'état l'obligerait à choisir laquelle, alors que
 * `verifierEtat` doit les vérifier TOUTES.
 *
 * @param {Base} base
 * @param {string} force
 */
function verifierForce(base, force) {
  const f = exigerForce(force);
  const liste = base[f.champ];
  if (!Array.isArray(liste)) {
    throw new Error(`etat : « ${f.champ} » n'est pas une liste`);
  }
  for (let i = 0; i < liste.length; i += 1) {
    // ⚠ LES OBSTACLES SONT PASSÉS, ET LEUR CODE EST TOLÉRÉ JUSTE APRÈS. Voir
    // `CODES_TOLERES_AU_CHARGEMENT` : une pièce sous un obstacle est exactement
    // le cas d'une règle née après des sauvegardes. Elle ne peut plus se créer —
    // `poserEffectif` la refuse — mais elle peut apparaître SANS QUE LE JOUEUR
    // AIT RIEN FAIT le jour où le tirage des obstacles changera, puisque le
    // terrain se redéduit à chaque chargement. Faire lever rendrait alors la
    // partie injouable pour une faute que personne n'a commise.
    const problemes = problemesDeLEffectif(force, liste, liste[i], i, base.obstacles?.cases ?? [])
      .filter((p) => !CODES_TOLERES_AU_CHARGEMENT.has(p.code));
    if (problemes.length > 0) {
      throw new Error(
        `etat : ${f.quoi} injouable — ${problemes.map((p) => p.message).join(' ; ')}`,
      );
    }
  }
}

/**
 * Ce qui empêcherait de poser cette pièce là. Liste vide = pose légale.
 *
 * ⚠ LES RÈGLES DE JEU NE SONT PAS ICI, ET C'EST LA MÊME FRONTIÈRE QUE PARTOUT.
 * Budget, niveau d'apparition et occupants maximum par rangée vivent dans les
 * deux ÉDITEURS — `ui/defense.js` et `ui/arsenal.js` — qui sont purs, déjà
 * testés, et qui font foi là-dessus. Les recopier ici ferait deux tables de
 * règles, et la première divergence se lirait comme un déséquilibre de jeu. Ce
 * module garde ce que la SAUVEGARDE doit garantir ; l'appelant demande le reste
 * à l'éditeur avant d'appeler.
 *
 * @param {Etat} etat
 * @param {string} force 'garnison' ou 'armee'
 * @param {Effectif} piece sans `degatsMilli` — une pièce posée est intacte
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaPoseDEffectif(etat, force, piece) {
  const f = exigerForce(force);
  const base = baseCourante(etat);
  exigerChamp(base, f.champ);
  return problemesDeLEffectif(
    force, base[f.champ], { degatsMilli: 0, ...defautDActivite(f), ...piece },
    null, base.obstacles?.cases ?? [],
  );
}

/**
 * Pose une pièce. LÈVE si elle est illégale — même discipline que `poser` pour
 * les bâtiments : une pose refusée est un fait de jeu qu'on montre au joueur,
 * une levée est un fait de programme.
 *
 * ⚠ POSER NE COÛTE RIEN. `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2 et
 * Ethan l'a redit le 28/08 pour les unités : « une unité posée en def ou off est
 * niveau 1 et gratuit ». Le premier prix est celui de la première AMÉLIORATION,
 * et il vit dans `data/couts-militaires.js`.
 *
 * @param {Etat} etat modifié en place
 * @param {string} force
 * @param {Effectif} piece
 * @returns {Etat} le même état
 */
export function poserEffectif(etat, force, piece) {
  const f = exigerForce(force);
  const complete = { degatsMilli: 0, ...defautDActivite(f), ...piece };
  const problemes = problemesDeLaPoseDEffectif(etat, force, complete);
  if (problemes.length > 0) {
    throw new Error(
      `poserEffectif : pose illégale en ${f.quoi} — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  // ⚠⚠ CETTE LISTE EST FERMÉE, ET C'EST LE PIÈGE DE `ajouterEntite` (CLAUDE.md
  // §6) SOUS UN AUTRE NOM : un champ que l'appelant passe et qui n'est pas
  // nommé ici DISPARAÎT EN SILENCE. Poser le défaut d'activité plus haut sans
  // l'ajouter là aurait donné une pièce active à la validation et une pièce
  // SANS le champ dans la sauvegarde — donc active quand même, par le défaut de
  // `composerLesVagues`, si bien que le drapeau n'aurait jamais rien retenu et
  // qu'aucun raid de référence n'aurait bronché.
  baseCourante(etat)[f.champ].push({
    id: complete.id,
    [f.axe]: complete[f.axe],
    colonne: complete.colonne,
    niveau: complete.niveau,
    degatsMilli: complete.degatsMilli,
    // Normalisé en booléen : ce qui n'est pas `false` part au raid.
    ...(f.porteLActivite ? { actif: complete.actif !== false } : {}),
  });
  return etat;
}

/**
 * Retire une pièce et la rend.
 *
 * ⚠ AUCUN REMBOURSEMENT, faute d'arbitrage. `REMBOURSEMENT_DEMOLITION` vaut
 * pour les bâtiments de la base ; rien n'a été rendu pour les effectifs, et en
 * inventer un serait trancher seul une mécanique de jeu. Le jour où Ethan en
 * fixera un, il se crédite ici.
 *
 * @param {Etat} etat modifié en place
 * @param {string} force
 * @param {number} index
 * @returns {Effectif} la pièce retirée
 */
export function retirerEffectif(etat, force, index) {
  const f = exigerForce(force);
  const base = baseCourante(etat);
  exigerChamp(base, f.champ);
  const piece = base[f.champ][index];
  if (piece === undefined) {
    throw new RangeError(`retirerEffectif : indice ${index} hors de la ${f.quoi}`);
  }
  base[f.champ].splice(index, 1);
  return piece;
}

/**
 * Ce qui empêcherait de déplacer cette pièce vers cette case.
 *
 * ⚠ RESTER SUR PLACE EST LÉGAL, et rend une liste vide — d'où `indexIgnore` :
 * la pièce ne se fait pas obstacle à elle-même. Le refuser obligerait l'écran à
 * connaître cette exception et priverait le joueur de toute annulation.
 *
 * @param {Etat} etat
 * @param {string} force
 * @param {number} index
 * @param {object} position la nouvelle case, `{ rangee, colonne }` ou
 *   `{ vague, colonne }` selon la force
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDuDeplacementDEffectif(etat, force, index, position) {
  const f = exigerForce(force);
  const base = baseCourante(etat);
  exigerChamp(base, f.champ);
  const piece = base[f.champ][index];
  if (piece === undefined) {
    throw new RangeError(`deplacerEffectif : indice ${index} hors de la ${f.quoi}`);
  }
  return problemesDeLEffectif(
    force, base[f.champ], { ...piece, ...position }, index, base.obstacles?.cases ?? [],
  );
}

/**
 * Laisse une unité d'assaut à la maison, ou la renvoie au raid.
 *
 * ⚠⚠ ELLE VIT ICI, ET PAS DANS L'ÉCRAN, PARCE QUE C'EST LA RÈGLE DU DÉPÔT.
 * `reglerTutoriel` a créé le précédent : un champ de l'état se touche par une
 * fonction de `sim/state.js`, jamais par l'écran, sinon chaque vue qui l'écrit
 * le fait de son côté. RAID-A aura deux points d'appel — le bouton et, un jour,
 * un « tout activer » — et ils doivent passer par la même porte.
 *
 * ⚠ ELLE BASCULE, ELLE NE REPOSE PAS. Retirer puis reposer la pièce donnerait
 * le même drapeau et perdrait `degatsMilli` : une unité abîmée reviendrait
 * intacte, ce qui ferait de la désactivation une réparation gratuite. La pièce
 * est modifiée EN PLACE, et son indice ne bouge pas — même discipline que
 * `deplacerEffectif` juste dessous.
 *
 * ⚠ LÈVE SUR UNE FORCE QUI NE PORTE PAS LE DRAPEAU. La garnison ne part jamais
 * au raid ; lui demander de se désactiver est un fait de PROGRAMME, pas un
 * refus de jeu, donc une levée et non une liste.
 *
 * @param {Etat} etat modifié en place
 * @param {string} force
 * @param {number} index indice dans la liste de la force
 * @param {boolean} actif
 * @returns {Etat} le même état
 */
export function reglerActivite(etat, force, index, actif) {
  const f = exigerForce(force);
  if (!f.porteLActivite) {
    throw new Error(`reglerActivite : la ${f.quoi} ne part pas au raid`);
  }
  const base = baseCourante(etat);
  exigerChamp(base, f.champ);
  if (typeof actif !== 'boolean') {
    throw new RangeError(`reglerActivite : « ${actif} » — booléen attendu`);
  }
  const piece = base[f.champ][index];
  if (piece === undefined) {
    throw new RangeError(`reglerActivite : indice ${index} hors de la ${f.quoi}`);
  }
  piece.actif = actif;
  return etat;
}

/**
 * Déplace une pièce. Gratuit — Ethan, 28/08 : « déplacement gratuit, comme
 * bâtiment ».
 *
 * ⚠⚠ LA CASE EST MODIFIÉE EN PLACE, JAMAIS PAR `splice` PUIS `push`. Aucune
 * liste n'est aujourd'hui parallèle à `garnison` ni à `armee` — c'est justement
 * ce qu'on a voulu en rangeant niveau et dégâts DANS la pièce — mais l'ordre
 * d'une liste est de toute façon observable : il décide de l'indice que l'écran
 * garde en main entre deux touchers d'un déplacement. Réécrire la liste dans un
 * autre ordre ferait viser au geste suivant une pièce qui n'est plus celle-là.
 * C'est la faute exacte que `deplacer` évite déjà pour les bâtiments.
 *
 * @param {Etat} etat modifié en place
 * @param {string} force
 * @param {number} index
 * @param {object} position
 * @returns {Etat} le même état
 */
export function deplacerEffectif(etat, force, index, position) {
  const f = exigerForce(force);
  const base = baseCourante(etat);
  const problemes = problemesDuDeplacementDEffectif(etat, force, index, position);
  if (problemes.length > 0) {
    throw new Error(
      `deplacerEffectif : déplacement illégal en ${f.quoi} — `
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const piece = base[f.champ][index];
  piece[f.axe] = position[f.axe];
  piece.colonne = position.colonne;
  return etat;
}

/**
 * Ce qui empêche de monter cette pièce d'un niveau. Liste vide = amélioration
 * légale.
 *
 * ⚠⚠ LE GESTE EST CELUI DU CHANTIER, ET C'EST L'ARBITRAGE D'ETHAN DU
 * 03/09/2026. Trois formes lui ont été soumises — niveau choisi à la pose,
 * pièce améliorée une par une, niveau global de la force — et il a retenu la
 * seconde. C'est le geste que le joueur connaît déjà pour ses bâtiments, il ne
 * demande AUCUNE migration — le champ `niveau` est dans la pièce depuis la v7 —
 * et il laisse les deux autres formes ouvertes, là où un niveau global les
 * aurait fermées.
 *
 * ⚠ LE PRIX N'EST PAS INVENTÉ ICI. `data/couts-militaires.js` le porte depuis
 * l'arbitrage du 28/08, entité par entité, dans la ressource que la table dit ;
 * et la FONCTION qui le donne se lit dans `FORCES`, elle ne se choisit pas par
 * un test sur le nom de la force.
 *
 * ⚠⚠ LE GAIN NON PLUS, ET IL EXISTAIT DÉJÀ. `facteurMilli` de
 * `data/niveaux.js` met les PV et les dégâts à l'échelle du niveau dans
 * `creerCombat` depuis toujours : une pièce montée se bat mieux sans qu'une
 * seule ligne de ce lot le dise. Ce qui manquait était le GESTE, et lui seul —
 * `poserEffectif` écrivait `niveau: 1` et rien ne le relevait, si bien que
 * `niveauDeLArmee` et `niveauDeLaDefense` affichaient 1,0 dans toute partie.
 *
 * ⚠ ET LE BUDGET NE BOUGE PAS — voir `pointsEngages` : les points d'armée sont
 * l'une des grandeurs que la courbe ne met PAS à l'échelle. Améliorer ne peut
 * donc jamais faire sortir une composition déjà posée de son budget, et il n'y
 * a rien à vérifier de ce côté.
 *
 * @param {Etat} etat
 * @param {string} force 'garnison' ou 'armee'
 * @param {number} index
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLAmeliorationDEffectif(etat, force, index) {
  const f = exigerForce(force);
  const base = baseCourante(etat);
  exigerChamp(base, f.champ);
  exigerChamp(base, 'economie');
  const piece = base[f.champ][index];
  if (piece === undefined) {
    throw new RangeError(`ameliorerEffectif : indice ${index} hors de la ${f.quoi}`);
  }

  const problemes = [];
  const vise = piece.niveau + 1;
  if (vise > NIVEAU.plafond) {
    // Sans niveau visé légal il n'y a pas de coût à calculer : on s'arrête ici
    // plutôt que de faire lever le barème sur un niveau hors bornes — il lève
    // pour de bon, exactement comme `coutDeMontee` des bâtiments.
    return [{ code: 'plafond', message: `déjà au niveau ${NIVEAU.plafond}, le maximum` }];
  }

  // ⚠⚠ LE PLAFOND EST CELUI DU BÂTIMENT DE COMMANDEMENT, ET LA RÈGLE ÉTAIT
  // DÉJÀ ÉCRITE DANS LA DONNÉE. `POINTS_ARMEE` de `data/sites.js` dit depuis
  // toujours que chaque budget est adossé à son bâtiment, « QUI FIXE AUSSI LE
  // NIVEAU MAXIMAL DES UNITÉS DE SON CÔTÉ ». Les deux éditeurs l'appliquent
  // depuis le lot FREEZE-ET-PALETTE, sur un niveau qu'un banc leur passe ; ce
  // lot-ci l'applique au GESTE, c'est-à-dire au seul chemin par lequel un
  // niveau entre désormais dans une partie.
  //
  // ⚠ C'est le pendant exact du Chantier, qui plafonne les onze bâtiments, à
  // une différence près : le Chantier ne se plafonne pas LUI-MÊME, étant la
  // référence, alors qu'ici le bâtiment commandant n'est pas une pièce de la
  // force — il est dans `disposition`. Il n'y a donc aucune exception à écrire.
  const commandant = POINTS_ARMEE[f.role].batiment;
  const plafond = niveauDeCommandement(etat, force);
  if (plafond === null) {
    // ⚠ PAS DE BÂTIMENT, PAS DE PLAFOND — DONC PAS D'AMÉLIORATION. C'est la
    // lecture que `niveauDeCommandement` porte déjà en rendant `null` et non
    // zéro : il n'y a pas un plafond nul, il n'y a PAS de plafond du tout.
    // Monter une pièce sous une règle qui n'existe pas serait l'inventer, et le
    // cas arrive pour de bon — une force posée, puis le QG démoli.
    problemes.push({
      code: 'sans-batiment',
      message: `sans ${BASE_BATIMENTS[commandant].nom.joueur}, aucune pièce ne monte`,
    });
  } else if (vise > plafond) {
    problemes.push({
      code: 'plafond-commandement',
      message: `le ${BASE_BATIMENTS[commandant].nom.joueur} est au niveau ${plafond}`
        + ' : montez-le d\'abord',
    });
  }

  // Le coût se calcule MÊME quand le plafond refuse : le joueur doit pouvoir
  // lire les deux raisons d'un refus, pas seulement la première. « Un indice
  // n'est pas une interdiction » (CLAUDE.md §4) vaut aussi pour les messages,
  // et `problemesDeLAmelioration` fait déjà exactement ça pour les bâtiments.
  const cout = f.coutDeMontee(piece.id, vise);
  for (const r of RESSOURCES) {
    const duMilli = cout[r] * MILLI;
    if (duMilli > base.economie.ressources[r]) {
      problemes.push({
        code: `manque:${r}`,
        message: `il manque ${LIBELLE_MANQUE(r, duMilli - base.economie.ressources[r])}`,
      });
    }
  }
  return problemes;
}

/**
 * Monte une pièce d'un niveau et débite son coût. LÈVE si c'est illégal — même
 * discipline que partout : un refus est un fait de JEU qu'on montre au joueur,
 * une levée est un fait de PROGRAMME.
 *
 * ⚠ LE DÉBIT SE CALCULE SUR LE NIVEAU VISÉ, DONC AVANT L'INCRÉMENT. Même piège
 * et même ordre qu'`ameliorer` pour les bâtiments ; l'écrire dans l'autre sens
 * ferait payer le palier suivant, et l'écart ne se verrait qu'au bout de
 * plusieurs niveaux.
 *
 * ⚠⚠ LES DÉGÂTS NE SONT PAS EFFACÉS, ET CE N'EST PAS UN OUBLI. `degatsMilli`
 * est un ABSOLU de milli-PV, et le niveau monte les PV MAXIMUM : une pièce
 * entamée ressort donc relativement plus saine sans qu'un seul PV lui ait été
 * rendu. Les remettre à zéro ferait de l'amélioration un SOIN — un second
 * mécanisme de réparation que personne n'a arbitré, et qui court-circuiterait
 * les trois réserves de `sim/reparation.js`.
 *
 * ⚠ ET LE BÂTIMENT DE PRODUCTION N'EST PAS EXIGÉ. L'arbitrage du 29/08 dit
 * « Infanterie INCONSTRUCTIBLE sans caserne » : il porte sur la CONSTRUCTION,
 * et une pièce déjà posée l'est. Rien ne s'ouvre par là — le budget et le
 * plafond de commandement bornent déjà le lot, et les points d'armée ne montent
 * pas avec le niveau. Si Ethan veut l'autre lecture, c'est un
 * `batimentDeProductionManquant` de plus dans la liste ci-dessus, et rien
 * d'autre.
 *
 * @param {Etat} etat modifié en place
 * @param {string} force
 * @param {number} index
 * @returns {Etat} le même état
 */
export function ameliorerEffectif(etat, force, index) {
  const f = exigerForce(force);
  const problemes = problemesDeLAmeliorationDEffectif(etat, force, index);
  if (problemes.length > 0) {
    throw new Error(
      `ameliorerEffectif : impossible en ${f.quoi} — `
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const base = baseCourante(etat);
  const piece = base[f.champ][index];
  const cout = f.coutDeMontee(piece.id, piece.niveau + 1);
  for (const r of RESSOURCES) base.economie.ressources[r] -= cout[r] * MILLI;
  piece.niveau += 1;
  return etat;
}

/**
 * Les points d'armée engagés par une force — ce que le compteur du bandeau
 * affiche en face du budget.
 *
 * ⚠ LES POINTS NE MONTENT PAS AVEC LE NIVEAU, et c'est une règle du moteur,
 * pas un oubli : réserve, portée, vitesse, masse, cadence et points d'armée
 * sont les grandeurs que `data/niveaux.js` ne met PAS à l'échelle. Multiplier
 * ici par le niveau ferait qu'améliorer une unité la ferait sortir du budget.
 *
 * ⚠ UNE PIÈCE DÉTRUITE COMPTE ENCORE. Elle occupe sa case et son budget en
 * attendant d'être réparée — « détruites mais pas perdues ». La décompter
 * ferait de la destruction une façon de poser plus d'unités.
 *
 * @param {Etat} etat
 * @param {string} force
 * @returns {number} points d'armée
 */
export function pointsEngages(etat, force) {
  const f = exigerForce(force);
  const base = baseCourante(etat);
  exigerChamp(base, f.champ);
  let total = 0;
  for (const piece of base[f.champ]) {
    // Une pièce de garnison est soit un ouvrage, soit une unité ; l'assaut n'a
    // que des unités. Les deux tables portent le même champ `points`.
    const ligne = DEFENSES[piece.id] ?? UNITES[piece.id];
    if (ligne === undefined) {
      throw new Error(`pointsEngages : « ${piece.id} » n'est ni une défense ni une unité`);
    }
    total += ligne.points;
  }
  return total;
}

/**
 * Le niveau du bâtiment qui commande cette force, ou `null` s'il n'est pas posé.
 *
 * ⚠⚠ C'EST LE SEUL ENDROIT QUI LIT CETTE GRANDEUR, ET C'EST VOULU. Le budget
 * d'engagement et le filtrage des palettes en découlent tous les deux ;
 * `POINTS_ARMEE` de `data/sites.js` nomme déjà le bâtiment de chaque côté —
 * Centre de commandement pour l'offense, QG de défense pour la défense. Le lire
 * ailleurs, ou passer un niveau à la main, ferait deux vérités sur ce que le
 * joueur peut engager.
 *
 * ⚠⚠ `null` N'EST PAS ZÉRO, ET LA DIFFÉRENCE EST UN ARBITRAGE QUI MANQUE.
 * Les deux bâtiments sont `unique: true` et AUCUN n'est dans la base neuve :
 * tant que le joueur ne les a pas posés, il n'a ni armée ni garnison. Ce qu'un
 * budget vaut alors n'a PAS été arbitré — le défaut retenu est « pas de
 * bâtiment, pas de budget », cohérent avec une base neuve qui ne porte qu'un
 * Chantier. Il tient en une ligne chez l'appelant, et c'est exprès : si Ethan
 * tranche autrement, il n'y a qu'un endroit à changer.
 *
 * @param {Etat} etat
 * @param {string} force
 * @returns {number|null} le niveau du bâtiment, ou null s'il n'est pas posé
 */
/**
 * L'identifiant du Chantier de construction, écrit une fois dans ce fichier.
 * `sim/disposition.js` porte déjà le même littéral pour la règle « une base a
 * exactement un Chantier » ; ce n'est pas une seconde table, c'est le même
 * bâtiment nommé là où il est interrogé.
 */
const ID_CHANTIER = 'chantierDeConstruction';

/**
 * Le niveau du Chantier de construction de la base.
 *
 * ⚠ IL LÈVE SI LE CHANTIER MANQUE, là où `niveauDeCommandement` rend `null`.
 * La différence n'est pas un oubli : une base SANS Centre de commandement est
 * un état normal — une base neuve n'en a pas — alors qu'une base sans Chantier
 * est un fait de PROGRAMME. `problemesDeDisposition` porte le code
 * `sans-chantier`, il n'est pas dans `CODES_TOLERES_AU_CHARGEMENT`, et aucune
 * sauvegarde honnête ne peut en produire une.
 *
 * @param {object} etat
 * @returns {number} niveau du Chantier
 */
export function niveauDuChantier(etat) {
  const base = baseCourante(etat);
  exigerChamp(base, 'disposition');
  const chantier = base.disposition.find((b) => b.id === ID_CHANTIER);
  if (chantier === undefined) {
    throw new Error('etat : aucun Chantier de construction dans la disposition');
  }
  return chantier.niveau;
}

/**
 * Le bâtiment de production qui MANQUE pour construire cette unité, ou `null`.
 *
 * ARBITRÉ le 29/08/2026 par Ethan : « Infanterie inconstructible sans caserne.
 * Même règle pour véhicule et avion. » Le châssis de l'unité désigne le
 * bâtiment ; `BATIMENT_DE_CHASSIS` de data/base.js porte les trois lignes.
 *
 * ⚠ ELLE RÉPOND POUR LES DEUX FORCES, ET C'EST UNE LECTURE. Ethan a énoncé une
 * règle sur les UNITÉS, sans dire « à l'assaut » ni « en garnison » : la
 * restreindre à un écran aurait été le choix arbitraire, pas l'appliquer
 * partout. Les ouvrages fixes de la défense — murs, tourelles, artilleries — ne
 * sont pas dans `UNITES`, n'ont pas de châssis, et ne sont donc pas concernés.
 *
 * ⚠⚠ ET ELLE N'EST PAS DANS `verifierEtat`, exactement comme le budget. Elle
 * peut devenir fausse SOUS une composition déjà posée — la Caserne démolie, ou
 * tombée au raid — et refuser le chargement rendrait la partie injouable pour
 * une faute que le joueur n'a pas commise. On SIGNALE au geste, le joueur
 * purge. C'est aussi ce qui évite une migration : aucune sauvegarde ne change.
 *
 * @param {object} etat
 * @param {string} uniteId clé de `UNITES`, ou d'un ouvrage fixe de la défense
 * @returns {string|null} clé du bâtiment manquant dans `BASE_BATIMENTS`
 */
export function batimentDeProductionManquant(etat, uniteId) {
  const base = baseCourante(etat);
  exigerChamp(base, 'disposition');
  const unite = UNITES[uniteId];
  if (unite === undefined) return null;
  const requis = BATIMENT_DE_CHASSIS[unite.chassis];
  if (requis === undefined) {
    throw new Error(`etat : châssis « ${unite.chassis} » sans bâtiment de production`);
  }
  return base.disposition.some((b) => b.id === requis) ? null : requis;
}

export function niveauDeCommandement(etat, force) {
  return niveauDeCommandementDeLaBase(baseCourante(etat), force);
}

/**
 * Le même niveau, lu sur une BASE.
 *
 * ⚠⚠ ELLE EXISTE POUR LES MIGRATIONS, ET C'EST UNE VRAIE RAISON. La migration
 * 13 → 14 interroge le niveau de commandement d'une sauvegarde v13, où la
 * disposition est ENCORE À LA RACINE : lui faire traverser `baseCourante` la
 * ferait lever, `bases` n'existant qu'à partir de la v23. Une migration doit
 * tourner sur la forme de SON époque, jamais sur celle d'aujourd'hui — c'est ce
 * que le dépliage a failli casser en silence, la chaîne complète n'étant rejouée
 * que par un test.
 *
 * @param {{ disposition: Array }} base
 * @param {string} force
 * @returns {number|null} `null` si le bâtiment commandant n'est pas posé
 */
export function niveauDeCommandementDeLaBase(base, force) {
  const f = exigerForce(force);
  exigerChamp(base, 'disposition');
  const commandant = POINTS_ARMEE[f.role].batiment;
  const batiment = base.disposition.find((b) => b.id === commandant);
  return batiment === undefined ? null : batiment.niveau;
}

/**
 * Le joueur a-t-il quitté le tutoriel ?
 *
 * ⚠ CE N'EST PAS UNE PROGRESSION, ET LA DISTINCTION PORTE TOUT LE CHOIX DE LE
 * SAUVEGARDER. Ce qui est FAIT se relit dans la base à chaque demande
 * (`sim/missions.js`) et n'est écrit nulle part ; ce qui est ici, c'est le seul
 * fait que la base ne peut pas exprimer — un geste du joueur sur une croix.
 *
 * ⚠ ELLE LÈVE SI LE CHAMP MANQUE, elle ne rend pas `false` par défaut. Une
 * sauvegarde migrée le porte toujours ; son absence serait un fait de PROGRAMME,
 * et un défaut par tolérance rouvrirait la fenêtre au joueur qui l'a fermée
 * sans que rien ne le dise.
 *
 * @param {Etat} etat
 * @returns {boolean}
 */
export function tutorielEstFerme(etat) {
  exigerChamp(etat, 'tutoriel');
  return etat.tutoriel.ferme === true;
}

/**
 * Ferme ou rouvre la mini-fenêtre du tutoriel.
 *
 * ⚠ L'ÉCRAN N'ÉCRIT PAS DANS L'ÉTAT LUI-MÊME. C'est la même frontière que pour
 * `poser` ou `ameliorer` : `src/ui/` demande, `sim/state.js` écrit. Sans cette
 * fonction, deux écrans — la mini-fenêtre et l'onglet Mission — toucheraient le
 * même champ chacun de son côté.
 *
 * @param {Etat} etat modifié en place
 * @param {boolean} ferme
 * @returns {Etat} le même état
 */
export function reglerTutoriel(etat, ferme) {
  exigerChamp(etat, 'tutoriel');
  if (typeof ferme !== 'boolean') {
    throw new TypeError(`etat : tutoriel fermé « ${ferme} » — booléen attendu`);
  }
  etat.tutoriel.ferme = ferme;
  return etat;
}

/**
 * Sérialise l'état en JSON, SANS le terrain et AVEC l'instant d'écriture.
 *
 * Le terrain se déduit de `fondation` (voir plus haut) : l'écrire dans la
 * sauvegarde créerait une seconde source de vérité, donc une occasion de
 * divergence. `charger` le reconstruit.
 *
 * ⚠ `instantSauvegardeMs` FAIT LE CHEMIN INVERSE DU TERRAIN. Le terrain vit
 * dans l'état et sort de la sauvegarde ; l'instant vit dans la sauvegarde et
 * n'entre JAMAIS dans l'état. Une fois la partie chargée il ne veut plus rien
 * dire — il sera recalculé à la prochaine écriture — et le garder en mémoire
 * inviterait quelqu'un à s'en servir comme d'une horloge.
 *
 * ⚠ L'INSTANT EST UN ARGUMENT, PAS UNE LECTURE. Aucun fichier de `src/` n'a le
 * droit d'appeler l'horloge système (`banc.test.js` §11 le balaie). Le temps
 * mural entre par la couche qui touche au DOM, et par elle seule — c'est la
 * même discipline que `accumuler()` de `sim/clock.js`, qui reçoit une durée
 * écoulée au lieu d'aller la chercher.
 *
 * @param {Etat} etat
 * @param {number} instantMs Instant d'écriture, en ms depuis l'époque.
 * @returns {string}
 */
export function serialiser(etat, instantMs) {
  exigerInstant(instantMs, 'serialiser');
  // ⚠ DEUX CHAMPS DÉRIVÉS SORTENT ICI, PAS UN. `obstacles` a rejoint `champs` au
  // lot OBSTACLES : les deux se retirent du même terrain, à la même fondation, et
  // laisser l'un dans la sauvegarde en ferait la source de vérité concurrente du
  // tirage.
  //
  // ⚠ ET ILS SORTENT DE CHAQUE BASE, PLUS DE LA RACINE — lot BASES-0. Le
  // déstructurant sur `etat` ne trouverait plus rien à retirer et la sauvegarde
  // porterait le terrain, silencieusement : c'est exactement la seconde source de
  // vérité que ces quatre lignes existent pour empêcher.
  const bases = etat.bases.map(({ champs, obstacles, ...reste }) => reste);
  return JSON.stringify({ ...etat, bases, instantSauvegardeMs: instantMs });
}

/**
 * Un instant mural doit être un entier fini positif, sinon toute la durée
 * d'absence qu'on en tirerait serait fantaisiste.
 * @param {number} instantMs
 * @param {string} ou nom de la fonction appelante, pour le message
 */
function exigerInstant(instantMs, ou) {
  if (!Number.isInteger(instantMs) || instantMs < 0) {
    throw new RangeError(`${ou} : instant « ${instantMs} » — entier de ms ≥ 0 attendu`);
  }
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------
//
// Chaque entrée fait passer une sauvegarde de la version N à la version N+1,
// en place. On les enchaîne jusqu'à SAVE_VERSION. La chaîne existe dès le
// premier jour, même quasi vide, pour que le mécanisme soit éprouvé avant
// d'être indispensable.

const MIGRATIONS = {
  /**
   * v0 → v1 : les sauvegardes antérieures au versionnage (version absente ou 0)
   * n'avaient pas de reliquat d'horloge ni de compteur de voisins qualifiants.
   * @param {object} s
   */
  0: (s) => {
    s.version = 1;
    if (s.horloge && typeof s.horloge.residuMs !== 'number') {
      s.horloge.residuMs = 0;
    }
    if (Array.isArray(s.batiments)) {
      for (const b of s.batiments) {
        if (typeof b.voisinsQualifiants !== 'number') b.voisinsQualifiants = 0;
      }
    }
  },

  /**
   * v1 → v2 : le débit se range désormais PAR HEURE et chaque bâtiment porte
   * un résidu (règle née dans l'ancien sim/economy.js, retiré le 27/08 ;
   * elle vit maintenant dans sim/economie-base.js). Une sauvegarde v1 n'en a
   * pas ; repartir de zéro est exact — le résidu perdu vaut moins d'une
   * milli-unité.
   * @param {object} s
   */
  1: (s) => {
    s.version = 2;
    if (Array.isArray(s.batiments)) {
      for (const b of s.batiments) {
        if (typeof b.residuFlux !== 'number') b.residuFlux = 0;
      }
    }
  },

  /**
   * v2 → v3 : les COLIS sont retirés. Abandonnés le 25/08, reconfirmés le 26 —
   * « tous les bâtiments font de la production continue ». Le rôle qu'ils
   * tenaient, borner ce qui s'accumule pendant une absence, est passé au
   * stockage, qui s'écrit en heures d'autonomie.
   *
   * ⚠ CETTE MIGRATION SUPPRIME UN CHAMP, ce qu'aucune autre n'avait fait — les
   * deux précédentes en AJOUTAIENT. Elle est écrite quand même, plutôt que de
   * laisser le champ traîner : une sauvegarde qui porte `colis` alors que plus
   * une ligne ne le lit est une invitation à croire, dans six mois, qu'il sert
   * encore. Ce qui est retiré ici n'est pas une ressource du joueur, c'est un
   * compteur mort — rien ne se perd.
   * @param {object} s
   */
  2: (s) => {
    s.version = 3;
    if (Array.isArray(s.batiments)) {
      for (const b of s.batiments) delete b.colis;
    }
  },

  /**
   * v3 → v4 : le moteur du lot 1 est remplacé. L'ancien état portait des
   * `batiments` typés `foreuse` / `decapeuse` SANS coordonnées, et deux stocks
   * globaux. Le nouveau porte une POSITION sur la carte, une DISPOSITION de
   * bâtiments placés à la case, et une économie à trois ressources.
   *
   * ⚠ CETTE MIGRATION NE CONVERTIT RIEN, ELLE REFONDE — et c'est le seul choix
   * honnête. Il n'existe aucune correspondance entre une `foreuse` sans
   * coordonnée et un `collecteur` qui doit se poser sur un champ : inventer une
   * case reviendrait à fabriquer une partie qui n'a jamais été jouée.
   *
   * ⚠ ELLE NE DÉTRUIT RIEN NON PLUS, PARCE QU'IL N'Y AVAIT RIEN. Ethan, le
   * 26/08 : « aucune sauvegarde actuellement, personne ne joue, pas même moi ».
   * Cette migration est écrite pour que la CHAÎNE reste continue — le mécanisme
   * doit rester éprouvé — pas pour préserver des données qui n'ont jamais
   * existé. Si un jour des sauvegardes circulent, une refondation silencieuse
   * ne serait plus acceptable : il faudrait prévenir le joueur AVANT.
   *
   * Ce qui survit : la graine, l'état du tirage, l'horloge. Autrement dit le
   * TEMPS de la partie, pas son contenu.
   * @param {object} s
   */
  3: (s) => {
    s.version = 4;
    delete s.batiments;
    delete s.ressources;
    s.position = positionDepartJoueur();
    s.disposition = dispositionNouvelleBase();
    s.economie = creerEtatEconomie(s.disposition);
  },

  /**
   * v4 → v5 : le terrain se dérive désormais de `fondation`, pas de
   * `position`. Arbitré le 27/08 — voir le bloc en tête de fichier.
   *
   * ⚠ CELLE-CI NE PERD RIEN, et c'est la première depuis la v2. Sous la v4 le
   * terrain était calculé depuis `position` ; écrire `fondation = position`
   * redonne donc EXACTEMENT le terrain que la sauvegarde avait. La base n'a de
   * toute façon jamais pu bouger : le redéploiement n'existe pas encore. Le
   * jour où il existera, cette migration restera juste pour les sauvegardes
   * d'avant lui, et fausse pour aucune.
   * @param {object} s
   */
  4: (s) => {
    s.version = 5;
    s.fondation = { rangee: s.position.rangee, colonne: s.position.colonne };
  },

  /**
   * v5 → v6 : la sauvegarde porte l'instant mural de son écriture, ce qui rend
   * le rattrapage hors ligne possible.
   *
   * ⚠ UNE SAUVEGARDE v5 NE DONNE AUCUNE ABSENCE, et c'est le seul choix
   * honnête. On ne sait pas quand elle a été écrite. Lui inventer une durée
   * fabriquerait des ressources ; lui donner l'instant du chargement en
   * fabriquerait zéro, ce qui est faux aussi mais ne donne rien à personne.
   * `null` dit « on ne sait pas » — `charger` l'ancre à maintenant et le joueur
   * repart de là. C'est légitime tant qu'aucune sauvegarde ne circule (27/08) ;
   * le jour où il y en aura, il faudra le lui dire AVANT.
   * @param {object} s
   */
  5: (s) => {
    s.version = 6;
    s.instantSauvegardeMs = null;
  },

  /**
   * v6 → v7 : l'état porte enfin la GARNISON et l'ARMÉE du joueur. Jusqu'ici
   * les deux se composaient dans `ui/defense.js` et `ui/arsenal.js`, qui sont
   * des éditeurs dont la sortie n'était sauvegardée nulle part — d'où l'écran
   * Offense resté coquille, les compteurs bloqués à « — » et la bande Défense
   * en lecture seule.
   *
   * ⚠ ELLE NE PERD RIEN ET N'INVENTE RIEN. Une sauvegarde v6 ne porte aucune
   * composition : il n'y a rien à convertir, et deux listes VIDES sont
   * exactement ce que la partie avait. C'est la migration la plus sûre de la
   * chaîne — elle ajoute, comme les v0 → v1 et v1 → v2.
   *
   * ⚠ ELLE N'APPELLE NI `creerEtat` NI `creerEtatEconomie`, et ce n'est pas un
   * détail de style : les migrations traversent l'économie, et c'est ce qui a
   * fait tomber huit tests au lot AMORCE-ET-SIGNATURE quand la dotation de
   * départ y avait été placée. Une migration écrit les champs qu'elle ajoute, à
   * la main, et rien d'autre.
   * @param {object} s
   */
  6: (s) => {
    s.version = 7;
    s.garnison = [];
    s.armee = [];
  },

  /**
   * v7 → v8 : la table des satellites — les deux camps et l'avant-poste qui
   * suivent la base du joueur.
   *
   * ⚠ ELLE PROGRAMME LES TROIS APPARITIONS, elle ne les fait pas paraître. Une
   * sauvegarde v7 a été écrite avant que les satellites existent : sa base n'a
   * jamais rien eu autour d'elle. Les poser d'office mettrait trois sites sur la
   * carte à l'instant du chargement, sans les cinq minutes qu'Ethan a arbitrées
   * — et le joueur les verrait apparaître pendant qu'il regarde ailleurs. Les
   * programmer, c'est traiter le chargement comme ce qu'il est de son point de
   * vue : le moment où sa base entre dans un monde qui a maintenant des voisins.
   *
   * ⚠ ELLE LIT `s.horloge.nbTicks`, ET IL FAUT QU'IL SOIT LÀ. Toutes les
   * sauvegardes depuis la v1 le portent — la v0 → v1 crée l'horloge —, donc la
   * chaîne le garantit. Le `?? 0` couvre le cas d'une v7 écrite à la main, pas
   * un cas réel.
   *
   * ⚠ ELLE N'APPELLE PAS `planifierSatellites`, pour la raison de la migration
   * précédente : une migration écrit les champs qu'elle ajoute, à la main. La
   * fonction lit `etat.satellites`, qui n'existe pas encore au moment où elle
   * serait appelée.
   * @param {object} s
   */
  7: (s) => {
    s.version = 8;
    const du = (s.horloge?.nbTicks ?? 0) + TICKS_APPARITION;
    s.satellites = {
      presents: [],
      attentes: [
        { type: 'camp', tickDu: du },
        { type: 'camp', tickDu: du },
        { type: 'avantPoste', tickDu: du },
      ],
      prochaineInstance: 1,
    };
  },

  /**
   * v8 → v9 : la mini-fenêtre du tutoriel, et le fait que le joueur l'ait
   * fermée ou non.
   *
   * ⚠ ELLE N'AJOUTE PAS DE PROGRESSION, ET C'EST TOUT L'ÉCART. Une sauvegarde
   * v8 porte déjà tout ce qu'il faut pour SAVOIR où en est le tutoriel : sa
   * base. Ce qu'elle ne porte pas, c'est le choix de ne plus voir la fenêtre —
   * et `false` est la bonne valeur pour une partie qui n'a jamais eu de croix à
   * cliquer. Elle est donc du même genre que la v6 → v7 : elle ajoute un champ
   * neuf avec sa valeur neutre, sans rien convertir et sans rien perdre.
   * @param {object} s
   */
  8: (s) => {
    s.version = 9;
    s.tutoriel = { ferme: false };
  },

  /**
   * v9 → v10 : les POINTS D'ATTAQUE — le régulateur de session. Une sauvegarde
   * v9 a été écrite avant qu'un raid coûte quoi que ce soit.
   *
   * ⚠ ELLE DONNE LE PLEIN, comme une partie neuve, et c'est le même arbitrage
   * du 29/08 : le joueur ne doit pas ouvrir sa partie devant une jauge vide
   * qu'il faudra regarder se remplir. Il n'y a d'ailleurs rien à convertir —
   * la sauvegarde ne porte aucune grandeur d'où des points pourraient venir.
   *
   * ⚠ LE PLAFOND SE CALCULE SUR L'ARMÉE SAUVEGARDÉE, pas sur la valeur de
   * base : un joueur v9 qui avait déjà monté son armée mérite son plafond, et
   * le cliquet ne pourra plus le lui rendre après coup s'il la démantèle.
   *
   * ⚠ ELLE APPELLE DEUX FONCTIONS DE `sim/points-attaque.js`, ET C'EST PERMIS.
   * La règle de la chaîne — « une migration écrit les champs qu'elle ajoute, à
   * la main » — vise `creerEtat` et `creerEtatEconomie`, qui ÉCRIVENT dans
   * l'état et que les migrations traversent deux fois (lot AMORCE-ET-SIGNATURE,
   * huit tests tombés). `plafondVise` et `plafondDuNiveau` ne sont que des
   * lectures pures ; recopier ici la moyenne des niveaux d'armée créerait la
   * seconde table que CLAUDE.md §4 interdit.
   * @param {object} s
   */
  9: (s) => {
    s.version = 10;
    // ⚠ `[s]` ET NON `basesDuJoueur(s)` — lot BASES-0. Une sauvegarde v9 porte
    // son armée À LA RACINE : elle EST la base, au sens de `plafondVise`, et
    // `basesDuJoueur` lèverait dessus puisqu'elle lit `s.bases`, qui n'existe
    // qu'à partir de la v23. Une migration tourne sur la forme de SON époque.
    const plafond = Array.isArray(s.armee)
      ? plafondVise([s])
      : plafondDuNiveau(null);
    s.attaque = { points: plafond, plafond, residu: 0 };
  },

  /**
   * v10 → v11 : ce que le joueur a entamé et n'a pas fini, et les bases qu'il a
   * rasées.
   *
   * ⚠ DEUX TABLES VIDES, ET C'EST EXACT. Une sauvegarde v10 a été écrite avant
   * qu'un raid puisse laisser quoi que ce soit derrière lui : aucun site n'a été
   * entamé, aucune base n'a été rasée. Elle ajoute, comme les v6 → v7 et
   * v9 → v10, sans rien convertir et sans rien perdre.
   * @param {object} s
   */
  10: (s) => {
    s.version = 11;
    s.sitesEntames = {};
    s.basesRasees = [];
  },

  /**
   * v11 → v12 : le compteur de points de recherche.
   *
   * ⚠ ZÉRO EN CHAÎNE, PAS EN NOMBRE. Une sauvegarde v11 n'a jamais rangé de
   * points — ils se calculaient et n'allaient nulle part —, donc il n'y a rien à
   * convertir ; mais la forme compte dès la première écriture, sinon la première
   * addition ferait `0 + 12n` et lèverait sur un mélange de types.
   * @param {object} s
   */
  11: (s) => {
    s.version = 12;
    s.recherche = { pointsMilli: '0' };
  },

  /**
   * v12 → v13 : la réparation en cours, ou son absence.
   *
   * ⚠ `null`, PAS UN OBJET VIDE. Une sauvegarde v12 n'avait aucun moyen de
   * lancer une réparation, donc il n'y en a pas une en cours ; et `null` est
   * l'état que `avancerLaReparation` reconnaît pour ne rien faire.
   * @param {object} s
   */
  12: (s) => {
    s.version = 13;
    s.reparation = null;
  },

  /**
   * v13 → v14 : la recherche ouvre les pièces, et elle seule.
   *
   * ⚠⚠ CELLE-CI DONNE, LÀ OÙ TOUTES SES VOISINES NE CONVERTISSENT RIEN — et
   * c'est la seule façon de ne rien retirer au joueur. Jusqu'à la v13, ce qu'on
   * pouvait poser dépendait du NIVEAU du bâtiment commandant : `apparition <=
   * niveau`. Une sauvegarde v13 porte donc une garnison et une armée composées
   * sous cette règle. Poser les seules gratuites verrouillerait rétroactivement
   * tout ce que le joueur a déjà sur sa grille, et `bilan` le lui dirait au
   * premier écran — une pièce payée, posée, et soudain illégale.
   *
   * La migration OFFRE donc exactement ce que l'ancienne règle autorisait :
   * tout ce dont l'`apparition` était atteinte au niveau du bâtiment commandant.
   * Sa situation est reproduite au poil, et rien ne se dé-recherche ensuite.
   *
   * ⚠ AUCUN MODULE, LES DEUX LISTES VIDES. Aucun module n'a jamais été acquis
   * avant ce lot, et aucun n'avait d'effet : en offrir serait inventer un achat
   * que le joueur n'a pas fait.
   *
   * ⚠ BÂTIMENT ABSENT → LES GRATUITES SEULEMENT. `niveauDeCommandement` rend
   * `null` quand le Centre de commandement ou le QG de garnison n'est pas posé.
   * Sous l'ancienne règle, sans bâtiment il n'y avait ni budget ni pièce
   * posable ; les gratuites suffisent donc à reproduire cet état, et elles sont
   * ce qu'une partie neuve aurait de toute façon.
   * @param {object} s
   */
  13: (s) => {
    s.version = 14;
    const pointsMilli = s.recherche?.pointsMilli ?? '0';
    const offertes = (branche, force) => {
      // ⚠ TOLÉRANT À UNE SAUVEGARDE SANS `disposition`. La chaîne de migrations
      // remonte depuis la v0, et rien ne garantit la forme d'un objet à
      // mi-parcours. Sans disposition il n'y a pas de bâtiment commandant, donc
      // pas de niveau : c'est exactement le cas « bâtiment absent ».
      // ⚠ LA VARIANTE « DE LA BASE », pour la même raison qu'en migration 9 :
      // une v13 porte sa disposition à la racine, et `baseCourante` lèverait.
      const niveau = Array.isArray(s.disposition)
        ? niveauDeCommandementDeLaBase(s, force) : null;
      const ouvertes = niveau === null ? [] : Object.keys(ARBRE_RECHERCHE[branche])
        .filter((id) => (DEFENSES[id] ?? UNITES[id]).apparition <= niveau);
      // ⚠ UNION AVEC LES GRATUITES, ET CE N'EST PAS UNE GÉNÉROSITÉ. À bas niveau
      // l'ancienne règle donnait MOINS que ce qu'une partie neuve reçoit
      // aujourd'hui : au niveau 4, elle n'ouvrait que la Meute et les Perceurs,
      // alors que l'Éclaireur et l'Épervier sont désormais gratuits. Sans cette
      // union, un joueur qui recharge aurait moins qu'un joueur qui recommence,
      // et devrait aller cliquer « acheter » à zéro point pour rattraper.
      return [...new Set([...ouvertes, ...gratuitesDe(branche)])].sort();
    };
    s.recherche = {
      pointsMilli,
      acquises: { offense: offertes('offense', 'armee'), defense: offertes('defense', 'garnison') },
      modules: { offense: [], defense: [] },
    };
  },

  /**
   * v14 → v15 : les satellites ont une DATE DE RELÈVE.
   *
   * ⚠⚠ ETHAN, 31/08 : « vérifier que les camps et avant-poste change de spawn
   * aléatoirement si personne ne les attaque ». Avant ce lot, un satellite posé
   * ne bougeait jamais : il n'avait donc aucune échéance à sauvegarder. Une v14
   * en porte de parfaitement valides, simplement immortels.
   *
   * ⚠ ELLE COMPTE DEPUIS MAINTENANT, PAS DEPUIS LA POSE. La sauvegarde ne dit
   * pas quand chaque satellite a été posé — l'information n'a jamais été écrite,
   * et l'inventer serait fabriquer un passé. Leur donner une vie pleine à
   * partir du chargement est le choix le plus doux : personne ne voit ses camps
   * disparaître en ouvrant sa partie, ce qui est exactement ce que la migration
   * v7 → v8 refusait déjà pour l'apparition.
   *
   * ⚠ ET ELLE TOLÈRE UNE TABLE ABSENTE OU MALFORMÉE. La chaîne remonte depuis la
   * v0 ; rien ne garantit la forme d'un objet à mi-parcours, et une migration
   * qui lève laisse le joueur devant « sauvegarde illisible » pour un champ
   * qu'elle était censée réparer.
   * @param {object} s
   */
  14: (s) => {
    s.version = 15;
    const presents = s.satellites?.presents;
    if (!Array.isArray(presents)) return;
    const echeance = (s.horloge?.nbTicks ?? 0) + TICKS_DUREE_DE_VIE;
    for (const present of presents) {
      if (present !== null && typeof present === 'object') present.tickDeReleve = echeance;
    }
  },

  /**
   * v15 → v16 : la carte porte soixante-dix POI, et le joueur en acquiert.
   *
   * ⚠⚠ ELLE N'ACCORDE RIEN RÉTROACTIVEMENT, ET C'EST LE CHOIX JUSTE. Rien
   * n'existait avant ; le PREMIER TICK relèvera de lui-même ce qui se trouve dans
   * le territoire, donc un joueur qui a un POI sous le nez l'aura avant d'avoir
   * vu l'écran. Accorder ici ferait le même travail plus tôt, moins bien testé,
   * et à un endroit qui ne connaît ni la carte ni la graine.
   *
   * ⚠ LISTE VIDE, PAS CHAMP ABSENT. `verifierEtat` exige le champ ; une v15 ne
   * l'a jamais eu, et la distinction est celle que le commentaire voisin porte
   * déjà — champ absent est un fait de programme, liste vide est l'état normal
   * d'une partie neuve.
   * @param {object} s
   */
  15: (s) => {
    s.version = 16;
    if (!Array.isArray(s.poisAcquis)) s.poisAcquis = [];
  },

  /**
   * v16 → v17 : la réparation cesse de DURER et devient un STOCK par châssis.
   *
   * ⚠⚠ ELLE RETIRE UN CHAMP, ce que seule la v2 → v3 avait fait avant elle, et
   * pour la même raison : une sauvegarde qui porte `reparation` alors que plus
   * une ligne ne le lit ferait croire, six mois plus tard, que le chronomètre
   * existe encore. Ce qui part est un chantier en cours, pas une ressource du
   * joueur — et sous le nouveau modèle il n'y a rien à convertir, une réparation
   * qui durait n'ayant pas d'équivalent dans un stock.
   *
   * ⚠ LES TROIS RÉSERVOIRS À ZÉRO, ET RIEN DE RÉTROACTIF. Créditer le temps déjà
   * écoulé de la partie donnerait au joueur douze heures de réserve à l'instant
   * du chargement, pour un mécanisme qui n'existait pas quand il jouait. Le
   * premier tick commence à créditer, comme pour une base neuve.
   *
   * ⚠ ET LES PV RENDUS RESTENT RENDUS : `avancerLaReparation` écrivait
   * `degatsMilli` au fil de l'eau, donc ce que la réparation avait déjà réparé
   * est dans `s.armee` et n'est pas touché ici. Ce qui est perdu, c'est le temps
   * restant d'un chantier en vol — sans conséquence, le jeu n'étant pas jouable.
   * @param {object} s
   */
  16: (s) => {
    s.version = 17;
    delete s.reparation;
    s.reserveReparation = reservesVides();
  },

  /**
   * v17 → v18 : une unité d'assaut peut rester à la maison.
   *
   * ⚠ TOUTES ACTIVES, ET C'EST LE SEUL CHOIX JUSTE. Une sauvegarde v17 n'avait
   * aucun moyen de désactiver quoi que ce soit : tout ce qui était posé partait
   * au raid. Poser `actif: true` partout REPRODUIT donc au poil la situation du
   * joueur, là où l'omettre laisserait le champ à `undefined` — actif aussi, par
   * le défaut de `composerLesVagues`, mais alors la sauvegarde ne dirait plus ce
   * qu'elle porte. Même genre que la v6 → v7 et la v8 → v9 : un champ neuf,
   * servi à sa valeur neutre.
   *
   * ⚠ LA GARNISON N'EN REÇOIT PAS, et l'omission est le message. Le drapeau dit
   * « part au raid » ; une pièce de garnison ne part jamais.
   * `FORCES.garnison.porteLActivite` dit déjà non du côté de la pose, et les
   * deux moitiés doivent s'accorder.
   * @param {object} s
   */
  17: (s) => {
    s.version = 18;
    if (!Array.isArray(s.armee)) return;
    for (const piece of s.armee) {
      if (piece !== null && typeof piece === 'object') piece.actif = true;
    }
  },

  /**
   * v18 → v19 : l'état garde les dix derniers rapports de raid.
   *
   * ⚠ UNE LISTE VIDE, ET RIEN DE RÉTROACTIF. Une sauvegarde v18 n'avait aucun
   * moyen de garder un rapport : elle n'en a pas, et lui en inventer un
   * fabriquerait un raid qui n'a pas eu lieu. Même genre que la v15 → v16, qui
   * posait `poisAcquis` à vide plutôt que d'accorder un POI.
   * @param {object} s
   */
  18: (s) => {
    s.version = 19;
    if (!Array.isArray(s.rapports)) s.rapports = [];
  },

  /**
   * v19 → v20 : les bâtiments de la base peuvent être endommagés.
   *
   * ⚠ À ZÉRO, ET C'EST LA SEULE VALEUR HONNÊTE. Une sauvegarde v19 n'avait aucun
   * moyen d'abîmer un bâtiment — rien, dans tout le dépôt, n'écrivait de dégât
   * sur la base du joueur avant le lot RAID-B, et `CLAUDE.md` §6 le disait de
   * face. Une base v19 est donc intacte par construction : lui inventer des
   * dégâts fabriquerait un raid qui n'a pas eu lieu, et lui laisser le champ
   * absent ferait porter à `pvCourantsMilli` la charge de deviner.
   *
   * ⚠ ELLE N'AJOUTE RIEN À LA GARNISON NI À L'ARMÉE : les deux portent
   * `degatsMilli` depuis la v7 et la v8. C'est `disposition` qui rattrape son
   * retard, pas une troisième convention qui arrive.
   * @param {object} s
   */
  19: (s) => {
    s.version = 20;
    if (!Array.isArray(s.disposition)) return;
    for (const batiment of s.disposition) {
      if (batiment !== null && typeof batiment === 'object'
        && typeof batiment.degatsMilli !== 'number') {
        batiment.degatsMilli = 0;
      }
    }
  },

  /**
   * v20 → v21 : la carte a changé sous les sauvegardes — lot EUCLIDE, 02/09.
   *
   * ⚠⚠ ELLE VIDE, ELLE NE CONVERTIT PAS, ET C'EST LE SEUL GESTE HONNÊTE. Deux
   * champs désignent la carte PAR POSITION : `sitesEntames` dit ce que le joueur
   * a cassé et n'a pas fini, `poisAcquis` ce qu'il a ramassé en chemin. Le
   * passage à Euclide et le relèvement de la densité déplacent les bases de
   * l'Ouvrage ET les POI de chaque graine : recopier ces deux champs produirait
   * un état syntaxiquement valide et sémantiquement FAUX — un site marqué à
   * moitié détruit là où il n'y a plus rien, un gisement compté acquis alors
   * qu'il est ailleurs. Une migration qui fait semblant est pire qu'une
   * migration qui renonce, parce qu'elle ne se voit pas.
   *
   * ⚠ ET LA PERTE EST ACCEPTÉE, PAS SUBIE. Ethan, 02/09 : « ignore problème de
   * sauvegarde, je réinstalle le jeu, je suis le seul testeur ». Le jour où il y
   * aura d'autres joueurs, un lot qui déplace la carte devra les prévenir AVANT
   * — c'est déjà ce que dit la note de la migration 3 → 4, qui refondait.
   *
   * ⚠ `basesRasees` N'EST PAS VIDÉ, et la nuance compte. Il ne porte pas un
   * état de site : il porte le fait qu'une case ne doit PLUS rien rendre. Sur
   * une case que le peuplement ne peuple plus, l'entrée devient inerte — elle
   * n'invente rien. La vider, en revanche, ferait REPARAÎTRE une base que le
   * joueur a rasée, ce que `TYPES_SITE.base.respawn: false` interdit.
   *
   * ⚠ NI `satellites`. Ils sont de l'HISTOIRE : leurs cases sont enregistrées,
   * pas dérivées. Les anneaux ont changé de forme, donc les PROCHAINES
   * apparitions tomberont ailleurs — mais un camp déjà posé est là où le joueur
   * l'a vu, et le déplacer serait lui retirer quelque chose qu'il possède.
   * @param {object} s
   */
  20: (s) => {
    s.version = 21;
    s.sitesEntames = {};
    s.poisAcquis = [];
  },

  /**
   * v21 → v22 : la base peut se déplacer, et l'état retient quand.
   *
   * ⚠ `null`, PAS ZÉRO. Une sauvegarde v21 n'avait aucun moyen de déplacer la
   * base autrement que par un rasage, qui ne consomme pas le délai : son joueur
   * n'a donc jamais bougé volontairement, et son premier déplacement ne doit
   * rien attendre. Écrire `0` se lirait « déplacée au tick 0 » — vrai par
   * accident sur une partie jeune, faux sur une partie de trois jours, où cela
   * accorderait le déplacement sans délai pour une raison fausse.
   * @param {object} s
   */
  21: (s) => {
    s.version = 22;
    if (s.dernierDeplacementTick === undefined) s.dernierDeplacementTick = null;
  },

  /**
   * v22 → v23 : les onze champs d'une base descendent d'un cran, dans
   * `bases[0]`, et `baseCourante` vaut 0 — lot BASES-0, 02/09/2026.
   *
   * ⚠⚠ ELLE NE PERD RIEN, ET C'EST LE PREMIER DÉPLIAGE DE LA CHAÎNE. Aucune
   * valeur n'est convertie, aucune n'est inventée : les mêmes objets changent
   * d'adresse. Une v22 et sa v23 décrivent exactement la même partie.
   *
   * ⚠ `champs` ET `obstacles` NE SONT PAS RECOPIÉS, et il n'y a rien à
   * recopier : `serialiser` les a toujours retirés de la sauvegarde, et
   * `charger` les redéduit de `fondation` — qui, elle, voyage. Les poser ici
   * ferait exister dans la sauvegarde le terrain que le dépôt refuse d'y mettre
   * depuis le lot FONDATION-GELÉE.
   *
   * ⚠ ET LES ONZE AUTRES CHAMPS NE BOUGENT PAS. `poisAcquis` est GLOBAL — Ethan,
   * 02/09 : « acquis une fois, valable partout » —, `rapports` porte les dix
   * derniers EN TOUT, `attaque` est une réserve unique dont le plafond est
   * mérité par les ARMÉES du moment, et `recherche` se paie en points et jamais
   * en ressources. Les descendre dans la base serait un changement de RÈGLE,
   * pas un dépliage.
   *
   * @param {object} s
   */
  22: (s) => {
    s.version = 23;
    const base = {};
    for (const champ of CHAMPS_DE_BASE) {
      if (s[champ] !== undefined) base[champ] = s[champ];
      delete s[champ];
    }
    s.bases = [base];
    s.baseCourante = 0;
  },

  /**
   * v23 → v24 : le compteur d'instance des satellites REMONTE d'un cran, de la
   * base à l'état — lot BASES-1, 02/09/2026.
   *
   * ⚠⚠ ELLE NE PERD RIEN, ET LA VALEUR SE PREND AU MAXIMUM. Une v23 n'a qu'une
   * base, donc le maximum EST son compteur ; l'écrire comme un maximum plutôt
   * que comme `bases[0]` fait que la migration resterait juste si une v23 à
   * plusieurs bases avait existé — et surtout dit ce qu'elle veut dire : aucun
   * numéro déjà distribué ne doit pouvoir resservir.
   *
   * ⚠ LE CHAMP SORT DE CHAQUE BASE. Le laisser y traîner ferait exister deux
   * compteurs pour une même grandeur, et le premier à mentir serait celui que
   * personne ne lit — c'est la seconde source de vérité que ce dépôt refuse
   * partout ailleurs.
   *
   * @param {object} s
   */
  23: (s) => {
    s.version = 24;
    // ⚠ UN COMPTEUR NE RECULE JAMAIS, et c'est pourquoi on part de ce qui est
    // déjà là. Une vraie v23 ne porte pas le champ — le maximum vaut alors 1,
    // puis celui des bases. Mais une sauvegarde fabriquée à partir d'une v24
    // rabaissée le porte encore : l'écraser distribuerait une seconde fois des
    // numéros déjà pris, et deux camps successifs partageraient leur tirage.
    let maximum = Number.isInteger(s.prochaineInstanceSatellite)
      ? s.prochaineInstanceSatellite : 1;
    for (const base of s.bases ?? []) {
      const n = base.satellites?.prochaineInstance;
      if (Number.isInteger(n) && n > maximum) maximum = n;
      if (base.satellites !== undefined) delete base.satellites.prochaineInstance;
    }
    s.prochaineInstanceSatellite = maximum;
    // ⚠⚠ ET LE DROIT DE FONDER SE DÉDUIT DE CE QUI EST DÉJÀ POSÉ, PAS DE ZÉRO.
    // Une v23 n'a qu'une base et aucun moyen d'en fonder une seconde ; mais une
    // sauvegarde qui en porterait plusieurs — il n'y en a pas, et il pourrait y
    // en avoir demain — se verrait retirer le droit d'avoir celles qu'elle a.
    // On prend donc le plus grand des deux : ce qui est écrit, et ce qui est là.
    const posees = Array.isArray(s.bases) ? s.bases.length : 1;
    const ecrit = Number.isInteger(s.recherche?.basesAutorisees)
      ? s.recherche.basesAutorisees : 1;
    if (s.recherche !== undefined) {
      s.recherche.basesAutorisees = posees > ecrit ? posees : ecrit;
    }
    // ⚠ À ZÉRO, ET SANS RIEN INVENTER. Une v23 ne garde aucune trace des camps
    // que le joueur a rasés : les compter rétroactivement demanderait de deviner,
    // et créditer d'office cocherait une mission du tutoriel que personne n'a
    // faite. Zéro est la seule valeur honnête — le joueur recasse un camp, et
    // c'est vite fait.
    s.satellitesDetruits = { ...Object.fromEntries(Object.keys(ANNEAUX).map((t) => [t, 0])),
      ...(s.satellitesDetruits ?? {}) };
  },
};

/**
 * Migre une sauvegarde (objet déjà parsé) vers SAVE_VERSION, en place.
 * @param {object} sauvegarde
 * @returns {object} La même sauvegarde, à jour.
 */
export function migrer(sauvegarde) {
  let version = typeof sauvegarde.version === 'number' ? sauvegarde.version : 0;
  if (version > SAVE_VERSION) {
    throw new Error(
      `sauvegarde de version ${version} plus récente que le jeu (${SAVE_VERSION})`,
    );
  }
  while (version < SAVE_VERSION) {
    const migration = MIGRATIONS[version];
    if (!migration) {
      throw new Error(`aucune migration depuis la version ${version}`);
    }
    migration(sauvegarde);
    if (sauvegarde.version !== version + 1) {
      throw new Error(`la migration ${version} → ${version + 1} n'a pas mis à jour la version`);
    }
    version = sauvegarde.version;
  }
  return sauvegarde;
}

/**
 * Charge une sauvegarde JSON : parse, migre, redéduit le terrain, vérifie, PUIS
 * rattrape le temps passé hors ligne.
 *
 * ⚠ LE RATTRAPAGE SE FAIT ICI, PAS APRÈS. Un état chargé mais pas rattrapé ment
 * sur l'heure qu'il est : il afficherait les stocks d'hier soir. Le seul moment
 * où l'on connaît à la fois la sauvegarde et l'instant présent, c'est celui-ci.
 *
 * ⚠ UNE HORLOGE QUI RECULE NE FAIT RIEN, ELLE NE LÈVE PAS. Fuseau, NTP, joueur
 * qui change la date : la durée écoulée peut être négative. Elle est ramenée à
 * zéro et la partie se réancre sur l'instant présent. Refuser la sauvegarde
 * punirait le joueur pour l'heure de son téléphone ; avancer d'une durée
 * négative n'a pas de sens.
 *
 * @param {string} json
 * @param {number} instantMs Instant présent, en ms depuis l'époque.
 * @returns {Etat}
 */
export function charger(json, instantMs) {
  exigerInstant(instantMs, 'charger');
  const brut = JSON.parse(json);
  const etat = migrer(brut);
  const ecrit = etat.instantSauvegardeMs;
  // L'instant ne descend pas dans l'état : il a fait son travail ici.
  delete etat.instantSauvegardeMs;
  etat.rng = restaurerRng(etat.rng);
  // ⚠ EXIGER `fondation` AVANT DE S'EN SERVIR. Sans ce garde-fou, une
  // sauvegarde amputée du champ lèverait une TypeError sur `undefined.rangee`
  // — trois lignes avant que `verifierEtat` ait pu nommer le champ manquant.
  // Ça lève dans les deux cas, mais un seul des deux messages est lisible, et
  // c'est la falsification du 27/08 qui l'a montré : le test « refusé au
  // chargement » restait vert alors que `verifierEtat` ne surveillait plus
  // `fondation` du tout. Ça levait, pour la mauvaise raison.
  if (!Array.isArray(etat.bases)) {
    throw new Error('etat : champ « bases » absent');
  }
  for (const base of etat.bases) exigerChamp(base, 'fondation');

  // Le terrain n'est pas dans la sauvegarde : il se redéduit de la FONDATION,
  // pas de la position courante. C'est ici, et nulle part ailleurs, qu'il
  // rentre dans l'état — pour CHAQUE base depuis le lot BASES-0.
  for (const base of etat.bases) {
    base.champs = champsDeLaBase(base.fondation.rangee, base.fondation.colonne);
    base.obstacles = obstaclesDeLaBase(base.fondation.rangee, base.fondation.colonne);
  }
  verifierEtat(etat);

  // Rattrapage hors ligne. `ecrit === null` vient d'une sauvegarde d'avant la
  // v6 : durée inconnue, donc aucune.
  if (ecrit !== null && ecrit !== undefined) {
    exigerInstant(ecrit, 'charger (instant de la sauvegarde)');
    const ecouleMs = instantMs - ecrit;
    const dus = accumuler(etat.horloge, ecouleMs > 0 ? ecouleMs : 0);
    if (dus > 0) {
      rattraperJeu(etat, dus);
    }
  }
  return etat;
}
