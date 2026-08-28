// État de jeu de Chantier : création, boucle, rattrapage, sérialisation,
// migration.
//
// L'état est un objet plein, sérialisable en JSON tel quel, versionné DÈS
// AUJOURD'HUI : le numéro de version et la chaîne de migration existent
// avant la première sauvegarde réelle, pas après coup.

import { creerRng, restaurerRng } from './rng.js';
import { creerHorloge, tick as tickHorloge, avancerTicks, accumuler } from './clock.js';
import { champsDeLaBase } from './champs.js';
import { positionDepartJoueur } from './carte.js';
import { dispositionNouvelleBase, problemesDeDisposition } from './disposition.js';
import {
  creerEtatEconomie, tickEconomieBase, rattrapageEconomieBase, RESSOURCES,
  STOCK_DE_DEPART,
} from './economie-base.js';
import { BASE_BATIMENTS, coutDeMontee, remboursementDuNiveau } from '../data/base.js';
import { GEOGRAPHIE } from '../data/sites.js';

/** Version courante du format de sauvegarde. */
export const SAVE_VERSION = 6;

/**
 * @typedef {object} Etat
 * @property {number} version   Version du format de sauvegarde.
 * @property {number} graine    Graine d'origine de la partie.
 * @property {{ s: number }} rng
 * @property {{ tempsSimuleMs: number, nbTicks: number, residuMs: number }} horloge
 * @property {{ rangee: number, colonne: number }} position Sur la carte monde, AUJOURD'HUI.
 * @property {{ rangee: number, colonne: number }} fondation Là où la base a été FONDÉE.
 * @property {Array<{ id: string, rangee: number, colonne: number, niveau: number }>} disposition
 * @property {{ ressources: Record<string, number>, residus: Array<Record<string, number>> }} economie
 * @property {object} champs DÉRIVÉ de `fondation` — voir `serialiser`.
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
    economie: creerEtatEconomie(disposition),
    champs: champsDeLaBase(position.rangee, position.colonne),
  };
  // ⚠ L'AMORCE EST SERVIE ICI, ET NULLE PART AILLEURS. Arbitré le 27/08 : une
  // base neuve ne produit rien tant qu'aucun collecteur n'est posé, et un
  // départ à zéro laisse le joueur devant un écran où aucune action n'est
  // payable. La servir dans `creerEtatEconomie` a été essayé : les MIGRATIONS
  // repassent par elle, et une sauvegarde qu'on monte de version aurait touché
  // l'amorce une seconde fois.
  for (const r of RESSOURCES) etat.economie.ressources[r] = (STOCK_DE_DEPART[r] ?? 0) * 1000;
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

function verifierEtat(etat) {
  // ⚠ `fondation` EST REDONDANT ICI, et la garde reste quand même. Mesuré le
  // 27/08 par injection : retirer `fondation` de cette liste ne fait tomber
  // aucun test, parce que `charger` l'exige déjà plus tôt et qu'il est
  // aujourd'hui le SEUL chemin qui produise un état venu du dehors. Ce qui la
  // rendrait nécessaire : un second point d'entrée — import, éditeur, outil de
  // debug — qui fabriquerait un état sans passer par `charger`. Sans ce
  // commentaire, quelqu'un l'aurait « nettoyée » sans savoir ce qu'elle tient.
  for (const champ of ['position', 'fondation', 'disposition', 'economie', 'champs']) {
    exigerChamp(etat, champ);
  }
  if (etat.economie.residus.length !== etat.disposition.length) {
    throw new Error(
      `etat : ${etat.economie.residus.length} résidus pour ${etat.disposition.length} bâtiments`,
    );
  }
  const problemes = problemesDeDisposition(etat.disposition, etat.champs);
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

/** Le fragment de message qui chiffre un manque, en unités entières. */
function LIBELLE_MANQUE(ressource, manqueMilli) {
  const nom = { quartz: 'quartz', scorie: 'scorie', electricite: 'électricité' }[ressource];
  return `${Math.ceil(manqueMilli / MILLI)} de ${nom}`;
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
  const { champs, ...aSauver } = etat;
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
