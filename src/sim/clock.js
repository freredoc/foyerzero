// Horloge de simulation à 10 Hz en temps simulé.
//
// Règles du module :
//   - un tick avance d'exactement 100 ms simulées, ni plus ni moins ;
//   - aucun accès à l'horloge système ici : le temps réel écoulé est injecté
//     depuis l'extérieur (couche ui/) via accumuler(), jamais lu de l'intérieur ;
//   - l'état est un objet plein sérialisable, comme pour le PRNG.

/** Durée d'un tick en millisecondes simulées. */
export const TICK_MS = 100;

/** Nombre de ticks par seconde simulée. */
export const TICKS_PAR_SECONDE = 1000 / TICK_MS;

/**
 * Nombre de ticks par heure simulée. LA grandeur de conversion entre un débit
 * exprimé PAR HEURE (les données de calibrage) et l'accumulation par tick
 * (le moteur). Elle vit ici et nulle part ailleurs : la dériver à la main dans
 * un test ou un module, c'est se préparer à l'oublier le jour où TICK_MS bouge.
 */
export const TICKS_PAR_HEURE = 3600 * TICKS_PAR_SECONDE;

/**
 * @typedef {object} Horloge
 * @property {number} tempsSimuleMs Temps simulé écoulé, en ms (multiple de TICK_MS).
 * @property {number} nbTicks       Nombre de ticks exécutés depuis l'origine.
 * @property {number} residuMs      Temps réel injecté pas encore consommé (< TICK_MS).
 */

/**
 * Crée une horloge à l'origine des temps.
 * @returns {Horloge}
 */
export function creerHorloge() {
  return { tempsSimuleMs: 0, nbTicks: 0, residuMs: 0 };
}

/**
 * Avance l'horloge d'exactement un tick (100 ms simulées).
 * @param {Horloge} horloge
 */
export function tick(horloge) {
  horloge.tempsSimuleMs += TICK_MS;
  horloge.nbTicks += 1;
}

/**
 * Injecte du temps réel écoulé et renvoie le nombre de ticks devenus dus.
 * Le reliquat (< TICK_MS) est conservé dans l'horloge pour l'appel suivant.
 * L'appelant est responsable d'exécuter les ticks rendus dus.
 * @param {Horloge} horloge
 * @param {number} ecouleMs Temps réel écoulé depuis le dernier appel, en ms.
 * @returns {number} Nombre de ticks à exécuter.
 */
export function accumuler(horloge, ecouleMs) {
  if (!(ecouleMs >= 0)) {
    throw new Error(`horloge.accumuler : durée invalide ${ecouleMs}`);
  }
  horloge.residuMs += ecouleMs;
  const dus = Math.floor(horloge.residuMs / TICK_MS);
  horloge.residuMs -= dus * TICK_MS;
  return dus;
}

/**
 * Avance l'horloge de n ticks d'un coup (utilisé par le rattrapage analytique).
 * Strictement équivalent à n appels de tick().
 * @param {Horloge} horloge
 * @param {number} n
 */
export function avancerTicks(horloge, n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`horloge.avancerTicks : nombre de ticks invalide ${n}`);
  }
  horloge.tempsSimuleMs += n * TICK_MS;
  horloge.nbTicks += n;
}
