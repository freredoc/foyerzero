// Où tombe une rangée à l'écran — et rien d'autre.
//
// LE MODÈLE NE BOUGE PAS. La rangée 1 reste celle où les vagues paraissent, la
// rangée 18 reste le fond, et `GRILLE` reste la seule table qui les compte.
// Ce module ne fait qu'une chose : dire à quelle ligne d'écran une rangée se
// dessine, et savoir revenir en arrière.
//
//   première ligne d'écran ← rangée 18 … 11   les bâtiments
//                            rangée 10 … 3    la défense
//   dernière ligne d'écran ← rangée  2 … 1    le déploiement
//
// ⚠ POURQUOI CE N'EST PAS ÉCRIT DANS L'ÉCRAN QUI S'EN SERT. La même vue servira
// à regarder une base de l'OUVRAGE pendant un raid — Ethan, le 27/08 : « il faut
// toujours que la base, quoi qu'il arrive, joueur ou Ouvrage, soit [en premier],
// puis défense, puis les deux petites rangées ». La géométrie est la même des
// deux côtés, et c'est exactement pour ça que `GEOMETRIE_BASE` de `data/base.js`
// RÉFÉRENCE `GRILLE` au lieu de la recopier. Une transformation écrite en dur
// dans l'écran Chantier devrait être réécrite pour l'écran de raid, et les deux
// copies divergeraient le jour où l'une serait corrigée.
//
// ⚠ CETTE CONVENTION EXISTAIT DÉJÀ, ET L'ÉCRAN DOM ÉTAIT LE SEUL À LA
// CONTREDIRE. `render/projection.js` place depuis le lot 3A la rangée
// `GRILLE.longueur` tout en premier sur le canvas — `yDeRangee` vaut
// `margeY + (GRILLE.longueur − rangee) × tailleCase`, donc zéro pour la dernière
// rangée. Le banc d'essai dessinait déjà dans le bon sens ; l'écran Chantier,
// écrit au lot ÉCRAN-CHANTIER, posait ses cases dans l'ordre naturel de la
// boucle et se retrouvait retourné. Un test asserte que les deux chemins
// s'accordent, pour qu'on ne puisse plus en corriger un seul.
//
// ⚠ LE MOT QUI DÉSIGNE LE SOMMET NE S'EMPLOIE PAS ICI, et c'est délibéré : selon
// qu'on regarde l'écran ou les numéros de rangée, il désigne l'un ou l'autre
// bout de la bande, et la confusion a coûté un lot le 26/08. On dit « la
// rangée 18 », « le fond », ou « la première ligne d'écran » — trois choses non
// ambiguës.

import { GRILLE } from '../data/combat.js';

/** Une rangée doit exister dans la grille avant qu'on lui cherche une place. */
function exigerRangee(rangee) {
  if (!Number.isInteger(rangee) || rangee < 1 || rangee > GRILLE.longueur) {
    throw new RangeError(`orientation : rangée ${rangee} hors de 1…${GRILLE.longueur}`);
  }
  return rangee;
}

/**
 * La ligne d'écran où se dessine une rangée, numérotée à partir de 1.
 *
 * C'est directement un numéro de ligne de grille CSS, où 1 est la première
 * ligne. La rangée `GRILLE.longueur` y tombe donc en 1, et la rangée 1 en
 * dernier.
 *
 * @param {number} rangee 1…GRILLE.longueur
 * @returns {number} 1…GRILLE.longueur
 */
export function ligneEcranDeLaRangee(rangee) {
  return GRILLE.longueur + 1 - exigerRangee(rangee);
}

/**
 * La réciproque : quelle rangée occupe cette ligne d'écran.
 *
 * Elle sert au pointage — un doigt tombe sur une ligne, il faut savoir de quelle
 * rangée il s'agit — et elle sert surtout à ce que la transformation soit
 * VÉRIFIABLE : une involution se teste en aller-retour, ce qu'une formule écrite
 * deux fois dans deux fichiers ne permet pas.
 *
 * @param {number} ligne 1…GRILLE.longueur
 * @returns {number} 1…GRILLE.longueur
 */
export function rangeeDeLaLigneEcran(ligne) {
  if (!Number.isInteger(ligne) || ligne < 1 || ligne > GRILLE.longueur) {
    throw new RangeError(`orientation : ligne d'écran ${ligne} hors de 1…${GRILLE.longueur}`);
  }
  return GRILLE.longueur + 1 - ligne;
}

/**
 * Où une bande entière se pose à l'écran.
 *
 * ⚠ LA LIGNE DE DÉPART SE CALCULE DEPUIS LA RANGÉE LA PLUS HAUTE EN NUMÉRO.
 * Une bande va de `premiere` à `derniere` en numéros de rangée ; à l'écran, elle
 * commence par sa `derniere`. Prendre `premiere` par symétrie apparente
 * décalerait chaque bande de sa propre longueur — la défense se poserait sur les
 * bâtiments, et le rail désignerait la mauvaise bande sans que rien ne casse.
 *
 * @param {{premiere: number, derniere: number}} bande
 * @returns {{premiereLigne: number, nbLignes: number}}
 */
export function ligneEcranDeLaBande(bande) {
  if (!bande || !Number.isInteger(bande.premiere) || !Number.isInteger(bande.derniere)) {
    throw new TypeError('orientation : bande absente ou malformée');
  }
  if (bande.derniere < bande.premiere) {
    throw new RangeError(
      `orientation : bande ${bande.premiere}…${bande.derniere} — bornes inversées`,
    );
  }
  return {
    premiereLigne: ligneEcranDeLaRangee(bande.derniere),
    nbLignes: bande.derniere - bande.premiere + 1,
  };
}
