// État de jeu de Chantier : création, boucle, rattrapage, sérialisation,
// migration.
//
// L'état est un objet plein, sérialisable en JSON tel quel, versionné DÈS
// AUJOURD'HUI : le numéro de version et la chaîne de migration existent
// avant la première sauvegarde réelle, pas après coup.

import { creerRng, restaurerRng } from './rng.js';
import { creerHorloge, tick as tickHorloge, avancerTicks, accumuler } from './clock.js';
import { champsDeLaBase, obstaclesDeLaBase } from './champs.js';
import {
  satellitesVides, planifierSatellites, resoudreSatellites, problemesDesSatellites,
  TICKS_APPARITION,
} from './satellites.js';
import { positionDepartJoueur } from './carte.js';
import {
  creerPointsAttaque, avancerPointsAttaque, plafondDuNiveau, plafondVise, basesDuJoueur,
} from './points-attaque.js';
import {
  sitesEntamesVides, reparerLesSites, problemesDesSitesEntames,
} from './site-entame.js';
import { creerRecherche } from './raid.js';
import { avancerLaReparation, problemesDeLaReparationEnCours } from './reparation.js';
import { dispositionNouvelleBase, problemesDeDisposition } from './disposition.js';
import {
  creerEtatEconomie, tickEconomieBase, rattrapageEconomieBase, RESSOURCES,
  STOCK_DE_DEPART,
} from './economie-base.js';
import {
  BASE_BATIMENTS, BATIMENT_DE_CHASSIS, coutDeMontee, remboursementDuNiveau,
} from '../data/base.js';
import { GEOGRAPHIE, POINTS_ARMEE, EMPLACEMENTS_ASSAUT } from '../data/sites.js';
import { GRILLE, UNITES, DEFENSES } from '../data/combat.js';
import { NIVEAU } from '../data/niveaux.js';
import { rosterDefensif } from '../data/couts-militaires.js';
import { ARBRE_RECHERCHE, gratuitesDe } from '../data/recherche.js';

/** Version courante du format de sauvegarde. */
export const SAVE_VERSION = 14;

/**
 * @typedef {object} Etat
 * @property {number} version   Version du format de sauvegarde.
 * @property {number} graine    Graine d'origine de la partie.
 * @property {{ s: number }} rng
 * @property {{ tempsSimuleMs: number, nbTicks: number, residuMs: number }} horloge
 * @property {{ rangee: number, colonne: number }} position Sur la carte monde, AUJOURD'HUI.
 * @property {{ rangee: number, colonne: number }} fondation Là où la base a été FONDÉE.
 * @property {Array<{ id: string, rangee: number, colonne: number, niveau: number }>} disposition
 * @property {Array<Effectif>} garnison Les défenses posées dans la bande de défense.
 * @property {Array<Effectif>} armee    Les unités posées dans les quatre vagues.
 * @property {{ ressources: Record<string, number>, residus: Array<Record<string, number>> }} economie
 * @property {object} champs DÉRIVÉ de `fondation` — voir `serialiser`.
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
 * Crée l'état d'une partie neuve : le joueur ouvre le jeu dans sa base.
 *
 * ARBITRÉ le 26/08 : il démarre rangée 275, colonne 16 de la carte (strate 5),
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
    // ⚠ `null` VEUT DIRE « AUCUNE RÉPARATION EN COURS », et c'est un état, pas
    // une absence. Une base neuve n'a pas d'armée, donc rien à réparer.
    reparation: null,
  };
  // ⚠ L'AMORCE EST SERVIE ICI, ET NULLE PART AILLEURS. Arbitré le 27/08 : une
  // base neuve ne produit rien tant qu'aucun collecteur n'est posé, et un
  // départ à zéro laisse le joueur devant un écran où aucune action n'est
  // payable. La servir dans `creerEtatEconomie` a été essayé : les MIGRATIONS
  // repassent par elle, et une sauvegarde qu'on monte de version aurait touché
  // l'amorce une seconde fois.
  for (const r of RESSOURCES) etat.economie.ressources[r] = (STOCK_DE_DEPART[r] ?? 0) * 1000;
  // La base vient d'être posée : les trois apparitions sont dues dans cinq
  // minutes. Elles ne PARAISSENT pas ici — une base neuve est seule, et c'est
  // exactement ce que le joueur doit voir en ouvrant la partie.
  planifierSatellites(etat);
  verifierEtat(etat);
  return etat;
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
  for (const champ of ['position', 'fondation', 'disposition', 'garnison', 'armee', 'economie', 'champs', 'obstacles', 'satellites', 'attaque', 'sitesEntames', 'basesRasees', 'recherche']) {
    exigerChamp(etat, champ);
  }
  // ⚠ « CHAMP ABSENT » ET « LISTE VIDE » NE SONT PAS LA MÊME CHOSE, et c'est
  // toute la raison d'être de ces deux lignes. Une sauvegarde v7 sans `armee`
  // est un fait de PROGRAMME — quelque chose l'a écrite de travers. Une armée
  // VIDE est parfaitement légale : c'est l'état de toute base neuve, et le
  // rester tant que le Centre de commandement n'est pas posé.
  for (const force of Object.keys(FORCES)) verifierForce(etat, force);
  const defautsSatellites = problemesDesSatellites(etat.satellites);
  if (defautsSatellites.length > 0) {
    throw new Error(`etat : satellites injouables — ${defautsSatellites.join(' ; ')}`);
  }
  const defautsSites = problemesDesSitesEntames(etat.sitesEntames);
  if (defautsSites.length > 0) {
    throw new Error(`etat : sites entamés injouables — ${defautsSites.join(' ; ')}`);
  }
  const defautsReparation = problemesDeLaReparationEnCours(etat.reparation ?? null);
  if (defautsReparation.length > 0) {
    throw new Error(`etat : réparation injouable — ${defautsReparation.join(' ; ')}`);
  }
  if (etat.economie.residus.length !== etat.disposition.length) {
    throw new Error(
      `etat : ${etat.economie.residus.length} résidus pour ${etat.disposition.length} bâtiments`,
    );
  }
  // ⚠ TOUS LES DÉFAUTS NE SONT PAS DES FAUTES DE PROGRAMME — voir
  // `CODES_TOLERES_AU_CHARGEMENT` juste au-dessus.
  const problemes = problemesDeDisposition(etat.disposition, etat.champs)
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
  tickHorloge(etat.horloge);
  tickEconomieBase(etat.economie, etat.disposition, etat.champs);
  resoudreSatellites(etat);
  avancerPointsAttaque(etat, 1);
  reparerLesSites(etat);
  avancerLaReparation(etat);
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
  avancerTicks(etat.horloge, nbTicks);
  rattrapageEconomieBase(etat.economie, etat.disposition, etat.champs, nbTicks);
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
  // ⚠ MÊME FORME QUE LES TROIS AUTRES : un seul appel. La réparation se
  // recalcule depuis les dégâts de DÉPART et l'horloge courante, jamais par
  // soustractions successives — c'est ce qui rend les deux chemins identiques.
  avancerLaReparation(etat);
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
  exigerChamp(etat, 'disposition');
  exigerChamp(etat, 'champs');
  const candidate = [...etat.disposition, { id, rangee, colonne, niveau: 1 }];
  // Les problèmes de la disposition ACTUELLE ne sont pas imputables à la pose :
  // une base déjà bancale — un raid l'a amputée, une sauvegarde ancienne — ne
  // doit pas rendre toute pose impossible en faisant remonter ses propres
  // défauts. On ne garde que ce qui apparaît.
  const avant = new Set(
    problemesDeDisposition(etat.disposition, etat.champs).map((p) => `${p.code}|${p.message}`),
  );
  return problemesDeDisposition(candidate, etat.champs)
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
  etat.disposition.push({ id, rangee, colonne, niveau: 1 });
  const residu = {};
  for (const r of RESSOURCES) residu[r] = 0;
  etat.economie.residus.push(residu);
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
  exigerChamp(etat, 'disposition');
  exigerChamp(etat, 'champs');
  const batiment = etat.disposition[index];
  if (batiment === undefined) {
    throw new RangeError(`deplacer : indice ${index} hors de la disposition`);
  }
  const candidate = etat.disposition.map(
    (b, i) => (i === index ? { ...b, rangee, colonne } : b),
  );
  const avant = new Set(
    problemesDeDisposition(etat.disposition, etat.champs).map((p) => `${p.code}|${p.message}`),
  );
  return problemesDeDisposition(candidate, etat.champs)
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
  const batiment = etat.disposition[index];
  batiment.rangee = rangee;
  batiment.colonne = colonne;
  return etat;
}

export function problemesDeLAmelioration(etat, index) {
  exigerChamp(etat, 'disposition');
  exigerChamp(etat, 'economie');
  const batiment = etat.disposition[index];
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
    if (duMilli > etat.economie.ressources[r]) {
      problemes.push({
        code: `manque:${r}`,
        message: `il manque ${LIBELLE_MANQUE(r, duMilli - etat.economie.ressources[r])}`,
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
  const batiment = etat.disposition[index];
  const cout = coutDeMontee(batiment.id, batiment.niveau + 1);
  for (const r of RESSOURCES) etat.economie.ressources[r] -= cout[r] * MILLI;
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
  exigerChamp(etat, 'disposition');
  const batiment = etat.disposition[index];
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
  const batiment = etat.disposition[index];
  const rendu = remboursementDuNiveau(batiment.id, batiment.niveau);
  for (const r of RESSOURCES) etat.economie.ressources[r] += rendu[r] * MILLI;
  etat.disposition.splice(index, 1);
  etat.economie.residus.splice(index, 1);
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
    // La clé de `POINTS_ARMEE`, qui nomme le bâtiment d'où vient le budget.
    role: 'defense',
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
    role: 'offense',
    roster: new Set(Object.keys(UNITES)),
  },
};

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
 * @param {Etat} etat
 * @param {string} force
 */
function verifierForce(etat, force) {
  const f = exigerForce(force);
  const liste = etat[f.champ];
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
    const problemes = problemesDeLEffectif(force, liste, liste[i], i, etat.obstacles?.cases ?? [])
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
  exigerChamp(etat, f.champ);
  return problemesDeLEffectif(
    force, etat[f.champ], { degatsMilli: 0, ...piece }, null, etat.obstacles?.cases ?? [],
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
  const complete = { degatsMilli: 0, ...piece };
  const problemes = problemesDeLaPoseDEffectif(etat, force, complete);
  if (problemes.length > 0) {
    throw new Error(
      `poserEffectif : pose illégale en ${f.quoi} — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  etat[f.champ].push({
    id: complete.id,
    [f.axe]: complete[f.axe],
    colonne: complete.colonne,
    niveau: complete.niveau,
    degatsMilli: complete.degatsMilli,
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
  exigerChamp(etat, f.champ);
  const piece = etat[f.champ][index];
  if (piece === undefined) {
    throw new RangeError(`retirerEffectif : indice ${index} hors de la ${f.quoi}`);
  }
  etat[f.champ].splice(index, 1);
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
  exigerChamp(etat, f.champ);
  const piece = etat[f.champ][index];
  if (piece === undefined) {
    throw new RangeError(`deplacerEffectif : indice ${index} hors de la ${f.quoi}`);
  }
  return problemesDeLEffectif(
    force, etat[f.champ], { ...piece, ...position }, index, etat.obstacles?.cases ?? [],
  );
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
  const problemes = problemesDuDeplacementDEffectif(etat, force, index, position);
  if (problemes.length > 0) {
    throw new Error(
      `deplacerEffectif : déplacement illégal en ${f.quoi} — `
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const piece = etat[f.champ][index];
  piece[f.axe] = position[f.axe];
  piece.colonne = position.colonne;
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
  exigerChamp(etat, f.champ);
  let total = 0;
  for (const piece of etat[f.champ]) {
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
  exigerChamp(etat, 'disposition');
  const chantier = etat.disposition.find((b) => b.id === ID_CHANTIER);
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
  exigerChamp(etat, 'disposition');
  const unite = UNITES[uniteId];
  if (unite === undefined) return null;
  const requis = BATIMENT_DE_CHASSIS[unite.chassis];
  if (requis === undefined) {
    throw new Error(`etat : châssis « ${unite.chassis} » sans bâtiment de production`);
  }
  return etat.disposition.some((b) => b.id === requis) ? null : requis;
}

export function niveauDeCommandement(etat, force) {
  const f = exigerForce(force);
  exigerChamp(etat, 'disposition');
  const commandant = POINTS_ARMEE[f.role].batiment;
  const batiment = etat.disposition.find((b) => b.id === commandant);
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
  const { champs, obstacles, ...aSauver } = etat;
  return JSON.stringify({ ...aSauver, instantSauvegardeMs: instantMs });
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
    const plafond = Array.isArray(s.armee)
      ? plafondVise(basesDuJoueur(s))
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
      const niveau = Array.isArray(s.disposition) ? niveauDeCommandement(s, force) : null;
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
  exigerChamp(etat, 'fondation');

  // Le terrain n'est pas dans la sauvegarde : il se redéduit de la FONDATION,
  // pas de la position courante. C'est ici, et nulle part ailleurs, qu'il
  // rentre dans l'état.
  etat.champs = champsDeLaBase(etat.fondation.rangee, etat.fondation.colonne);
  etat.obstacles = obstaclesDeLaBase(etat.fondation.rangee, etat.fondation.colonne);
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
