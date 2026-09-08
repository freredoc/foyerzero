// LA SAVEUR D'UNE CASE — lot RETOUCHES, 07/09/2026.
//
// ⚠⚠ CE MODULE EXISTE POUR UNE CONTRAINTE D'IMPORTS, ET LE PRÉCÉDENT EST
// `base-courante.js`. Ces quatre choses vivaient dans `sim/site-de-la-case.js`,
// qui importe `satellitesPresents` de `sim/satellites.js` ; le point 15 du
// 07/09 demande à `satellites.js` de choisir la case d'un camp SELON sa saveur,
// donc de lire `saveurDeLaCase`. L'importer depuis `site-de-la-case.js` aurait
// fait le PREMIER cycle de `src/sim/` — mesuré avant d'écrire : le dossier n'en
// portait aucun, et ce n'est pas un accident.
//
// ⚠ C'EST UN DÉPLACEMENT, PAS UNE ÉCRITURE. Pas une ligne des quatre corps n'a
// changé en route, et `sim/site-de-la-case.js` les RÉ-EXPORTE — aucun de leurs
// appelants n'a eu à changer d'import, pas plus que `state.js` ne l'a fait pour
// `baseCourante`.
//
// ⚠ ET IL N'IMPORTE QUE `peuplement.js`, pour son hachage. Un module de bas
// niveau qui remonterait vers `data/sites.js` ou vers un moteur rouvrirait
// exactement la porte qu'on vient de fermer.

import { hachageBrut } from './peuplement.js';

/**
 * Sel du tirage qui ne dépend QUE de la case : le terrain, la saveur.
 *
 * ⚠ UN SEL PAR USAGE. 0 et 1 sont au peuplement, 2 et 3 aux POI, 6 au raid de
 * l'Ouvrage ; 4 et 5 sont au site d'une case, et celui-ci est le 4. Il garde son
 * nom et sa valeur en déménageant : deux tirages qui partageraient un sel
 * finiraient par se corréler.
 */
export const SEL_TERRAIN_DU_SITE = 4;

/**
 * La graine du TERRAIN d'une case : elle ignore l'instance, exprès.
 * @param {number} graine graine de la partie
 * @param {number} rangee
 * @param {number} colonne
 * @returns {number} entier de [0, 2³²[
 */
export function graineDuTerrain(graine, rangee, colonne) {
  return hachageBrut(graine, rangee, colonne, SEL_TERRAIN_DU_SITE);
}

/**
 * Les deux saveurs, dans l'ordre où le tirage les rend.
 *
 * ⚠ DEUX, PAS TROIS, ET LA SPEC LE DIT : « deux variantes de camp et
 * d'avant-poste : riche quartz (75/25) ou riche scorie (l'inverse). Les bases
 * sont proportionnelles. » La clé `base` de `SAVEURS` vaut `null` — c'est
 * l'absence d'inclinaison d'une BASE, pas une troisième saveur qu'un camp
 * pourrait tirer.
 */
export const SAVEURS_TIRABLES = ['richeQuartz', 'richeScorie'];

/**
 * La saveur d'un site posé sur cette case — `null` pour une base.
 *
 * ⚠ ELLE EST DE LA CASE, PAS DE L'INSTANCE. Deux camps successifs sur la même
 * case sont riches de la même chose : c'est l'arbitrage du 29/08, et c'est aussi
 * ce qui fait de la saveur une géographie plutôt qu'une loterie.
 *
 * ⚠⚠ ET C'EST POURQUOI LE POINT 15 DU 07/09 SE RÈGLE SUR LA CASE, PAS SUR LE
 * SATELLITE. « Lorsqu'il y a deux camps ou plus qui spawn, faire au moins
 * 1 quartz 1 scorie » : un champ `saveur` posé sur le satellite serait une
 * SECONDE vérité contre cette fonction, et deux camps successifs sur la même
 * case cesseraient d'être riches de la même chose. Ce qu'on contraint est donc
 * la CASE que le tirage retient — voir `poserUnSatellite`.
 *
 * @param {number} graine
 * @param {number} rangee
 * @param {number} colonne
 * @param {string} type
 * @returns {string|null}
 */
export function saveurDeLaCase(graine, rangee, colonne, type) {
  if (type === 'base') return null;
  const h = graineDuTerrain(graine, rangee, colonne);
  return SAVEURS_TIRABLES[h % SAVEURS_TIRABLES.length];
}
