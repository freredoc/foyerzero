// Géométrie de la grille de combat : cases, milli-cases, distances, occupation,
// obstacles de terrain.
//
// UNITÉ INTERNE UNIQUE : la MILLI-CASE (× 1000). Aucun flottant ne sort de ce
// module — c'est la contrainte structurante du lot 2A. Les distances se
// comparent AU CARRÉ, en milli-case², jamais par racine carrée : la portée est
// franchie si distance² ≤ portée², la portée minimale si distance² ≥ mini².
//
// CONTRAT DE DÉTERMINISME : aucun tirage pseudo-aléatoire, aucune lecture de
// l'horloge murale, aucune racine carrée dans ce module. Le hasard n'intervient
// qu'à la génération du site, donc au lot 2B, en amont du moteur.
//
// Aucune valeur de calibrage en dur : tout vient de src/data/combat.js.

import { GRILLE, OBSTACLES } from '../data/combat.js';

/** Nombre de milli-cases dans une case. */
export const MILLI_PAR_CASE = 1000;

/** Première et dernière rangée de la grille (1 en bas, 18 au fond). */
export const PREMIERE_RANGEE = 1;
export const DERNIERE_RANGEE = GRILLE.longueur;

/** Première et dernière colonne (1 à gauche). */
export const PREMIERE_COLONNE = 1;
export const DERNIERE_COLONNE = GRILLE.largeur;

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/**
 * Convertit une valeur de src/data/ en entier de milli-quelque-chose, et
 * REFUSE si le produit n'est pas entier. C'est la porte d'entrée unique des
 * flottants du calibrage vers l'arithmétique entière du moteur.
 * @param {number} valeur
 * @param {number} facteur
 * @param {string} contexte Nommé dans le message d'erreur.
 * @returns {number} Entier.
 */
export function enEntier(valeur, facteur, contexte) {
  if (!Number.isFinite(valeur)) {
    throw new Error(`grille : ${contexte} n'est pas un nombre fini (${valeur})`);
  }
  const produit = valeur * facteur;
  const arrondi = Math.round(produit);
  if (Math.abs(produit - arrondi) > 1e-9) {
    throw new Error(`grille : ${contexte} × ${facteur} = ${produit} n'est pas entier`);
  }
  return arrondi;
}

/** Position en milli-cases du centre de la case `n`. */
export function milliDepuisCase(n) {
  return n * MILLI_PAR_CASE;
}

/** Case contenant la position `milli`. */
export function caseDepuisMilli(milli) {
  return Math.floor(milli / MILLI_PAR_CASE);
}

/**
 * Distance AU CARRÉ entre deux positions, en milli-case².
 * Les colonnes sont des entiers de case : elles sont converties ici.
 * @returns {number} Entier.
 */
export function distanceCarree(rangeeMilliA, colonneA, rangeeMilliB, colonneB) {
  const dr = rangeeMilliA - rangeeMilliB;
  const dc = (colonneA - colonneB) * MILLI_PAR_CASE;
  return dr * dr + dc * dc;
}

// ---------------------------------------------------------------------------
// Bandes et bornes
// ---------------------------------------------------------------------------

/** La case (rangee, colonne) est-elle sur la grille ? */
export function estDansLaGrille(rangee, colonne) {
  return (
    Number.isInteger(rangee)
    && Number.isInteger(colonne)
    && rangee >= PREMIERE_RANGEE && rangee <= DERNIERE_RANGEE
    && colonne >= PREMIERE_COLONNE && colonne <= DERNIERE_COLONNE
  );
}

/**
 * La rangée est-elle dans la bande nommée ('deploiement', 'defense',
 * 'batiments') ?
 */
export function estDansLaBande(rangee, nomBande) {
  const bande = GRILLE.bandes[nomBande];
  if (!bande) throw new Error(`grille : bande inconnue « ${nomBande} »`);
  return rangee >= bande.premiere && rangee <= bande.derniere;
}

/** Bornes d'une bande, pour les messages d'erreur. */
export function bornesBande(nomBande) {
  const bande = GRILLE.bandes[nomBande];
  if (!bande) throw new Error(`grille : bande inconnue « ${nomBande} »`);
  return { premiere: bande.premiere, derniere: bande.derniere };
}

/**
 * Une position au-delà de la dernière rangée sort du combat. Seule l'aviation
 * traversante y arrive : le sol refuse le déplacement qui l'y mènerait.
 */
export function estSortiParLeHaut(rangeeMilli) {
  return rangeeMilli >= milliDepuisCase(DERNIERE_RANGEE + 1);
}

// ---------------------------------------------------------------------------
// Occupation
// ---------------------------------------------------------------------------
//
// Deux entités bloquantes ne peuvent pas occuper la même case. L'occupation
// est DÉRIVÉE : elle se reconstruit à chaque étape qui en a besoin, elle
// n'est jamais stockée dans l'état — un index désynchronisé serait une source
// de divergence, donc de non-déterminisme.

/** Clé entière unique d'une case. colonne < 100, donc pas de collision. */
export function cleCase(rangee, colonne) {
  return rangee * 100 + colonne;
}

/** @returns {Map<number, number>} clé de case → indice d'entité. */
export function creerOccupation() {
  return new Map();
}

export function poser(occupation, rangee, colonne, indice) {
  occupation.set(cleCase(rangee, colonne), indice);
}

export function retirer(occupation, rangee, colonne) {
  occupation.delete(cleCase(rangee, colonne));
}

/** @returns {number|undefined} indice de l'occupante, ou undefined. */
export function occupantDe(occupation, rangee, colonne) {
  return occupation.get(cleCase(rangee, colonne));
}

// ---------------------------------------------------------------------------
// Obstacles de terrain
// ---------------------------------------------------------------------------

/** Diviseur de vitesse d'un obstacle, en millièmes (2,5 → 2500). */
export const DIVISEUR_OBSTACLE_MILLI = enEntier(
  OBSTACLES.diviseurVitesse,
  MILLI_PAR_CASE,
  'OBSTACLES.diviseurVitesse',
);

/** Types d'obstacle admis, tels que déclarés par les données. */
export const TYPES_OBSTACLE = OBSTACLES.types;

/**
 * Vitesse ralentie par un obstacle, en milli-cases par tick.
 * REFUSE si le quotient n'est pas entier : le brief exige que toutes les
 * vitesses divisées par 2,5 restent entières (50 → 20 · 120 → 48 · 300 → 120).
 */
export function vitesseSousObstacle(vitesseMilli) {
  const numerateur = vitesseMilli * MILLI_PAR_CASE;
  if (numerateur % DIVISEUR_OBSTACLE_MILLI !== 0) {
    throw new Error(
      `grille : vitesse ${vitesseMilli} milli/tick divisée par `
      + `${OBSTACLES.diviseurVitesse} ne donne pas un entier`,
    );
  }
  return numerateur / DIVISEUR_OBSTACLE_MILLI;
}

/** @returns {Map<number, string>} clé de case → type d'obstacle. */
export function indexerObstacles(obstacles) {
  const index = new Map();
  for (const o of obstacles) index.set(cleCase(o.rangee, o.colonne), o.type);
  return index;
}

/** @returns {string|undefined} type de l'obstacle porté par la case. */
export function typeObstacleSur(index, rangee, colonne) {
  return index.get(cleCase(rangee, colonne));
}

/**
 * L'obstacle concerne-t-il ce châssis ? L'aviation ignore le terrain, quel
 * que soit le type de l'obstacle.
 * @param {string} type 'infanterie' | 'vehicule' | 'les_deux'
 * @param {string} chassis 'escouade' | 'blinde' | 'aeronef'
 */
export function obstacleConcerne(type, chassis) {
  if (chassis === 'aeronef') return false;
  if (type === 'les_deux') return true;
  if (type === 'infanterie') return chassis === 'escouade';
  if (type === 'vehicule') return chassis === 'blinde';
  throw new Error(`grille : type d'obstacle inconnu « ${type} »`);
}
