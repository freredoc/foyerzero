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
export const SAVE_VERSION = 1;

/**
 * @typedef {object} Etat
 * @property {number} version   Version du format de sauvegarde.
 * @property {number} graine    Graine d'origine de la partie.
 * @property {{ s: number }} rng
 * @property {{ tempsSimuleMs: number, nbTicks: number, residuMs: number }} horloge
 * @property {{ quartzMilli: number, scorieMilli: number }} ressources
 * @property {Array<{ type: string, niveau: number, voisinsQualifiants: number,
 *   colis: { enAttente: number, progresTicks: number } }>} batiments
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
    colis: { enAttente: 0, progresTicks: 0 },
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
