// Accumulateur à pas fixe et interpolation de position — lot 3A.
//
// Module PUR : la simulation est à 10 Hz, le rendu à 60 fps, et les deux ne se
// pilotent pas l'un l'autre. Le temps réel écoulé est injecté par l'appelant
// (couche ui/), jamais lu ici — même règle que src/sim/clock.js.
//
// L'interpolation est À UNE DIMENSION : une entité ne change jamais de colonne
// (le déplacement du moteur est strictement vertical), seule rangeeMilli
// s'interpole. Et les indices d'entités sont STABLES : une entité morte reste
// dans etat.entites avec vivant: false, elle n'est jamais retirée du tableau —
// il n'y a donc ni apparition ni disparition à gérer ici, seulement les
// entités nées après la prise du dernier instantané, dessinées sans
// interpolation. Les deux faits sont vérifiés dans le moteur (lot 2A) et
// asseyés par les tests du banc.
//
// Les PV ne s'interpolent JAMAIS : une barre de vie qui glisse ment sur
// l'instant de la mort.

import { TICK_MS } from '../sim/clock.js';

/**
 * Temps écoulé maximal pris en compte par image, en ms. Sans ce plafond, un
 * retour d'onglet après dix minutes déclencherait 6000 ticks dans une seule
 * image : la simulation se fige et le téléphone chauffe. 250 ms = deux ticks
 * et demi à ×1 : le rattrapage reste imperceptible.
 */
export const PLAFOND_RATTRAPAGE_MS = 250;

/**
 * Ticks exécutés au plus par image — au-delà, le reliquat est ABANDONNÉ, pas
 * reporté. La spirale de la mort se produit quand une image met plus longtemps
 * que le temps qu'elle simule : reporter le retard le fait enfler. Avec le
 * plafond de rattrapage à 250 ms, la demande vaut au plus
 * floor((250 + intervalle − 1) / intervalle) = 10 ticks à ×4 : ce second
 * garde-fou est une défense en profondeur, qui tient même si le premier bouge.
 */
export const TICKS_MAX_PAR_IMAGE = 10;

/** Vitesses de simulation offertes par le banc. */
export const VITESSES = [1, 2, 4];

/**
 * Intervalle entre deux ticks à une vitesse donnée, en ms. La vitesse DIVISE
 * l'intervalle : à ×4 la simulation avance quatre fois plus vite, le rendu
 * reste à 60 fps. Elle ne touche jamais à l'interpolation ni au nombre
 * d'images. TICK_MS vient de src/sim/clock.js, jamais recopié.
 */
export function intervalleMs(vitesse) {
  if (!VITESSES.includes(vitesse)) {
    throw new Error(`interpolation : vitesse ×${vitesse} inconnue (${VITESSES.join(', ')})`);
  }
  return TICK_MS / vitesse; // 100 · 50 · 25 — entiers tous les trois.
}

/** @returns {{ residuMs: number }} accumulateur neuf, sans dette. */
export function creerAccumulateur() {
  return { residuMs: 0 };
}

/**
 * Injecte le temps écoulé et rend le nombre de ticks devenus dus, plafonds
 * appliqués. L'appelant exécute les ticks — en prenant l'instantané des
 * positions AVANT chacun, sinon il n'y a rien à interpoler.
 * @param {{ residuMs: number }} accumulateur
 * @param {number} ecouleMs Temps réel écoulé depuis la dernière image.
 * @param {number} vitesse 1, 2 ou 4.
 * @returns {number} Ticks à exécuter.
 */
export function ticksDus(accumulateur, ecouleMs, vitesse) {
  if (!(ecouleMs >= 0)) {
    throw new Error(`interpolation : durée invalide ${ecouleMs}`);
  }
  const intervalle = intervalleMs(vitesse);
  accumulateur.residuMs += Math.min(ecouleMs, PLAFOND_RATTRAPAGE_MS);
  const dus = Math.floor(accumulateur.residuMs / intervalle);
  if (dus > TICKS_MAX_PAR_IMAGE) {
    // Abandon du reliquat : on repart d'un accumulateur vide plutôt que de
    // traîner une dette qui grossirait à chaque image.
    accumulateur.residuMs = 0;
    return TICKS_MAX_PAR_IMAGE;
  }
  accumulateur.residuMs -= dus * intervalle;
  return dus;
}

/**
 * Fraction du tick courant déjà écoulée, en millièmes (0…1000 exclu).
 * Après ticksDus, residuMs < intervalle, donc le résultat est < 1000.
 */
export function alphaMilli(accumulateur, vitesse) {
  return Math.floor((accumulateur.residuMs * 1000) / intervalleMs(vitesse));
}

/**
 * Position affichée entre deux ticks, en milli-cases entières :
 *
 *   rangeeAffichee = precedent + floor((courant − precedent) × alphaMilli / 1000)
 *
 * À alpha = 0 la position précédente, à alpha = 1000 la courante, à alpha = 500
 * le milieu entier. Le moteur ne déplace que vers le haut : courant ≥ precedent,
 * le floor est donc un plancher franc, jamais une troncature vers le haut.
 */
export function positionInterpolee(precedentMilli, courantMilli, alpha) {
  return precedentMilli + Math.floor(((courantMilli - precedentMilli) * alpha) / 1000);
}

/**
 * Instantané des positions courantes, indexé par indice d'entité. À prendre
 * AVANT chaque tick. Une entité d'indice ≥ instantane.length est née après la
 * prise : elle se dessine sans interpolation, à sa position courante.
 * @returns {number[]} rangeeMilli par indice.
 */
export function prendrePositions(etat) {
  return etat.entites.map((e) => e.rangeeMilli);
}
