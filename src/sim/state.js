// État de jeu de Chantier : création, boucle, rattrapage, sérialisation,
// migration.
//
// L'état est un objet plein, sérialisable en JSON tel quel, versionné DÈS
// AUJOURD'HUI : le numéro de version et la chaîne de migration existent
// avant la première sauvegarde réelle, pas après coup.

import { creerRng, restaurerRng } from './rng.js';
import { creerHorloge, tick as tickHorloge, avancerTicks } from './clock.js';
import { champsDeLaBase } from './champs.js';
import { positionDepartJoueur } from './carte.js';
import { dispositionNouvelleBase, problemesDeDisposition } from './disposition.js';
import { creerEtatEconomie, tickEconomieBase, rattrapageEconomieBase } from './economie-base.js';

/** Version courante du format de sauvegarde. */
export const SAVE_VERSION = 4;

/**
 * @typedef {object} Etat
 * @property {number} version   Version du format de sauvegarde.
 * @property {number} graine    Graine d'origine de la partie.
 * @property {{ s: number }} rng
 * @property {{ tempsSimuleMs: number, nbTicks: number, residuMs: number }} horloge
 * @property {{ rangee: number, colonne: number }} position Sur la carte monde.
 * @property {Array<{ id: string, rangee: number, colonne: number, niveau: number }>} disposition
 * @property {{ ressources: Record<string, number>, residus: Array<Record<string, number>> }} economie
 * @property {object} champs DÉRIVÉ de `position` — voir `serialiser`.
 */

// ---------------------------------------------------------------------------
// Le terrain est DÉRIVÉ, pas sauvegardé
// ---------------------------------------------------------------------------
//
// `champsDeLaBase` est une fonction de la seule POSITION : même case, même
// terrain, pour toujours. Il y a donc deux façons de le traiter, et une seule
// bonne.
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
// ne porte que `position`, seule source de vérité ; `charger` en redéduit le
// terrain. Un seul endroit peut mentir, et c'est celui qui est écrit.

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
    disposition,
    economie: creerEtatEconomie(disposition),
    champs: champsDeLaBase(position.rangee, position.colonne),
  };
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
function verifierEtat(etat) {
  for (const champ of ['position', 'disposition', 'economie', 'champs']) {
    if (etat[champ] === undefined) {
      throw new Error(`etat : champ « ${champ} » absent`);
    }
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

/**
 * Sérialise l'état en JSON, SANS le terrain.
 *
 * Le terrain se déduit de `position` (voir plus haut) : l'écrire dans la
 * sauvegarde créerait une seconde source de vérité, donc une occasion de
 * divergence. `charger` le reconstruit.
 * @param {Etat} etat
 * @returns {string}
 */
export function serialiser(etat) {
  const { champs, ...aSauver } = etat;
  return JSON.stringify(aSauver);
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
 * Charge une sauvegarde JSON : parse, migre, redéduit le terrain, vérifie.
 * @param {string} json
 * @returns {Etat}
 */
export function charger(json) {
  const etat = migrer(JSON.parse(json));
  etat.rng = restaurerRng(etat.rng);
  // Le terrain n'est pas dans la sauvegarde : il se redéduit de la position.
  // C'est ici, et nulle part ailleurs, qu'il rentre dans l'état.
  etat.champs = champsDeLaBase(etat.position.rangee, etat.position.colonne);
  verifierEtat(etat);
  return etat;
}
