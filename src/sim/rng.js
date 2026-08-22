// PRNG à graine, reproductible — algorithme mulberry32.
//
// Règles du module :
//   - aucun état global : une instance est un objet plein créé par creerRng(graine)
//     et passé explicitement à chaque fonction ;
//   - l'état tient dans un seul entier 32 bits non signé (`s`), donc il est
//     sérialisable tel quel dans la sauvegarde JSON ;
//   - toute source d'aléa du moteur passe par ici, jamais par l'horloge système
//     ni par le générateur du langage.

/**
 * @typedef {{ s: number }} Rng État sérialisable du générateur (uint32).
 */

/**
 * Crée une instance de PRNG à partir d'une graine entière.
 * @param {number} graine
 * @returns {Rng}
 */
export function creerRng(graine) {
  return { s: graine >>> 0 };
}

/**
 * Restaure une instance depuis un état sérialisé (copie défensive).
 * @param {Rng} etat
 * @returns {Rng}
 */
export function restaurerRng(etat) {
  if (!etat || typeof etat.s !== 'number') {
    throw new Error('rng : état sérialisé invalide');
  }
  return { s: etat.s >>> 0 };
}

/**
 * Tirage suivant : flottant dans [0, 1). Fait avancer l'état.
 * @param {Rng} rng
 * @returns {number}
 */
export function tirer(rng) {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Entier uniforme dans [min, max], bornes incluses.
 * @param {Rng} rng
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function entier(rng, min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new Error(`rng.entier : bornes invalides [${min}, ${max}]`);
  }
  return min + Math.floor(tirer(rng) * (max - min + 1));
}

/**
 * Choisit un élément du tableau, uniformément.
 * @template T
 * @param {Rng} rng
 * @param {readonly T[]} tableau
 * @returns {T}
 */
export function choisir(rng, tableau) {
  if (!tableau.length) {
    throw new Error('rng.choisir : tableau vide');
  }
  return tableau[entier(rng, 0, tableau.length - 1)];
}

/**
 * Mélange le tableau en place (Fisher–Yates) et le renvoie.
 * @template T
 * @param {Rng} rng
 * @param {T[]} tableau
 * @returns {T[]}
 */
export function melanger(rng, tableau) {
  for (let i = tableau.length - 1; i > 0; i--) {
    const j = entier(rng, 0, i);
    const tmp = tableau[i];
    tableau[i] = tableau[j];
    tableau[j] = tmp;
  }
  return tableau;
}
