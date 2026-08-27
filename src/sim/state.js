// État de jeu de Chantier : création, boucle, rattrapage, sérialisation,
// migration.
//
// L'état est un objet plein, sérialisable en JSON tel quel, versionné DÈS
// AUJOURD'HUI : le numéro de version et la chaîne de migration existent
// avant la première sauvegarde réelle, pas après coup.

import { creerRng, restaurerRng } from './rng.js';
import { creerHorloge, tick as tickHorloge, avancerTicks } from './clock.js';
import { tickEconomie, rattrapageEconomie } from './economy.js';

/** Version courante du format de sauvegarde. */
export const SAVE_VERSION = 3;

/**
 * @typedef {object} Etat
 * @property {number} version   Version du format de sauvegarde.
 * @property {number} graine    Graine d'origine de la partie.
 * @property {{ s: number }} rng
 * @property {{ tempsSimuleMs: number, nbTicks: number, residuMs: number }} horloge
 * @property {{ quartzMilli: number, scorieMilli: number }} ressources
 * @property {Array<{ type: string, niveau: number, voisinsQualifiants: number,
 *   residuFlux: number }>} batiments
 */

/**
 * Crée un bâtiment initial.
 * @param {string} type Clé dans params.batiments.
 * @param {number} niveau
 * @param {number} voisinsQualifiants
 */
export function creerBatiment(type, niveau = 1, voisinsQualifiants = 0) {
  return {
    type,
    niveau,
    voisinsQualifiants,
    // Reste exact de la production cumulée, en milli-unités × ticks/heure.
    // Toujours dans [0, TICKS_PAR_HEURE[ ; voir sim/economy.js.
    residuFlux: 0,
  };
}

/**
 * Crée l'état initial d'une partie.
 * @param {number} graine
 * @param {object} params
 * @returns {Etat}
 */
export function creerEtat(graine, params) {
  const etat = {
    version: SAVE_VERSION,
    graine,
    rng: creerRng(graine),
    horloge: creerHorloge(),
    ressources: { quartzMilli: 0, scorieMilli: 0 },
    batiments: [creerBatiment('foreuse', 1, 0)],
  };
  verifierEtat(etat, params);
  return etat;
}

/** Vérifie la cohérence structurelle d'un état (types de bâtiments connus). */
function verifierEtat(etat, params) {
  for (const b of etat.batiments) {
    if (!params.batiments[b.type]) {
      throw new Error(`etat : type de bâtiment inconnu « ${b.type} »`);
    }
  }
}

/**
 * Avance le jeu d'exactement UN tick : horloge puis économie.
 * C'est LA boucle du jeu ; tout ce qui devient par-tick dans les lots
 * suivants (combat, raids) se branche ici.
 * @param {Etat} etat
 * @param {object} params
 */
export function tickJeu(etat, params) {
  tickHorloge(etat.horloge);
  tickEconomie(etat, params);
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
export function rattraperJeu(etat, nbTicks, params) {
  avancerTicks(etat.horloge, nbTicks);
  rattrapageEconomie(etat, nbTicks, params);
}

/**
 * Sérialise l'état en JSON.
 * @param {Etat} etat
 * @returns {string}
 */
export function serialiser(etat) {
  return JSON.stringify(etat);
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
   * un résidu (sim/economy.js). Une sauvegarde v1 n'en a pas ; repartir de
   * zéro est exact — le résidu perdu vaut moins d'une milli-unité.
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
 * Charge une sauvegarde JSON : parse, migre, restaure les invariants.
 * @param {string} json
 * @param {object} params
 * @returns {Etat}
 */
export function charger(json, params) {
  const etat = migrer(JSON.parse(json));
  etat.rng = restaurerRng(etat.rng);
  verifierEtat(etat, params);
  return etat;
}
