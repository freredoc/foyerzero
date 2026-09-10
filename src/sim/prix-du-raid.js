// LE PRIX D'UN RAID — lot RÈGLES-DE-CARTE, 10/09/2026.
//
// Ethan, capture à l'appui : une base de l'Ouvrage de niveau 2, à trois cases,
// dans un territoire peint en VIOLET, facturée douze points. « Il doit y avoir
// un truc lié au fait qu'une base reste toujours dans son territoire, alors que
// le calcul est basé sur la force des territoires en ignorant les exceptions. »
//
// ⚠⚠ LE DIAGNOSTIC ÉTAIT EXACT, ET IL Y AVAIT DEUX DÉFINITIONS DE « À QUI EST
// CETTE CASE ». La carte PEIGNAIT par `campDeLaCase` de `sim/territoire.js` —
// somme de `raison ^ (niveau − distance)` par camp, la case au plus fort, ET
// par-dessus le PLANCHER d'Ethan, « le territoire où la base se trouve ne change
// pas ». Le prix, lui, FACTURAIT par `estEnTerritoireAllie`, un octogone
// purement géométrique autour des bases du joueur, qui ne connaissait ni la
// force, ni le plancher, ni l'Ouvrage. Une base ennemie posée à deux cases de
// chez soi tombait donc dans l'octogone allié et se payait au tarif de chez soi,
// pendant que la carte la peignait à l'Ouvrage.
//
// ⚠⚠ ET L'EN-TÊTE DE `territoire.js` DÉCLARAIT CETTE DIVERGENCE FERMÉE. Il
// écrivait, depuis TERRITOIRE-LU : « il n'y a plus qu'une écriture de la FORME,
// donc plus d'accord à tenir ». C'était vrai de la FORME et faux du PARTAGE :
// réunir les deux géométries a laissé deux règles d'APPARTENANCE. Le paragraphe
// est réécrit dans le même lot — un commentaire qui déclare close une divergence
// ouverte est pire que pas de commentaire.
//
// ⚠⚠ CE MODULE EXISTE PARCE QU'IL Y AURAIT EU UN CYCLE, ET LE CYCLE SE VOIT
// AVANT DE S'ÉCRIRE. `sim/territoire.js` importe DÉJÀ
// `distanceOctogonaleDInfluence` de `sim/points-attaque.js` ; faire lire
// `campDeLaCase` à `points-attaque.js` aurait refermé la boucle. Un import
// paresseux l'aurait cassée en la cachant : sous ESM, un cycle ne lève pas
// toujours, il rend un `undefined` silencieux au premier appel. On SORT donc la
// fonction plutôt que de tordre l'import — même geste que `base-courante.js` au
// lot BASES-0 et que `saveur.js` au lot RETOUCHES.
//
// ⚠ `coutDuRaid` RESTE OÙ ELLE EST ET RESTE PURE. C'est le BARÈME : dix points
// fixes, plus la distance, au tarif de chez soi ou d'ailleurs. Il ne connaît pas
// l'état, et il n'a aucune raison de le connaître. Ce module-ci est ce qui pose
// la QUESTION au monde ; le barème est ce qui répond une fois la question posée.
//
// ⚠ ET LA DISTANCE DU BARÈME NE CHANGE PAS : `distanceTchebychev`, l'arbitrage
// d'EUCLIDE intact — « la PORTÉE est un disque, le PRIX se compte en cases de
// grille ». Ce lot ne parle que du TERRITOIRE.

import { coutDuRaid, distanceTchebychev } from './points-attaque.js';
import { campDeLaCase, JOUEUR } from './territoire.js';

/**
 * Le coût d'un raid tel que l'écran le montrera : une base qui part, une case
 * visée, et l'état pour dire ce que la CARTE tient.
 *
 * ⚠⚠ LA MÊME CASE QUE LA CARTE, ET C'EST TOUT LE LOT. `campDeLaCase` est la
 * fonction que `sim/territoire.js` emploie pour peindre — planchers compris —,
 * et `TL T1` la confronte déjà case par case à `territoireDeLaFenetre`. Le
 * troisième côté du triangle se ferme ici : ce qui est facturé est ce qui est
 * peint.
 *
 * ⚠ « ALLIÉ » VEUT DIRE `JOUEUR`, ET RIEN D'AUTRE. Une case `NEUTRE` se paie au
 * tarif d'ailleurs, comme une case de l'Ouvrage : le barème n'a que deux
 * colonnes — `parCaseAllie` et `parCaseEnnemiOuNeutre` —, et son second nom dit
 * lui-même que le neutre y est rangé.
 *
 * ⚠ ET LE PRIX MONTE, IL NE BAISSE JAMAIS. Mesuré sur vingt graines et cinq
 * rangées, 5 508 cibles : **6,41 % changent de camp, toutes dans le sens de la
 * hausse**, et l'écart vaut +2 ou +4 points — jamais plus, parce que le
 * désaccord ne peut vivre que dans l'octogone de rayon 2, donc à une ou deux
 * cases. Aucun barème n'a été compensé ; voir le rapport du lot.
 *
 * @param {object} etat
 * @param {{ position: { rangee: number, colonne: number } }} baseAttaquante
 * @param {{ rangee: number, colonne: number }} cible
 * @returns {number} coût en points
 */
export function coutDUnRaid(etat, baseAttaquante, cible) {
  const distance = distanceTchebychev(baseAttaquante.position, cible);
  return coutDuRaid(distance, campDeLaCase(etat, cible.rangee, cible.colonne) === JOUEUR);
}
