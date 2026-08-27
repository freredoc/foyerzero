// La carte monde — où l'on est, et quel niveau ça vaut.
//
// Trois choses seulement, et elles se dérivent toutes de `GEOGRAPHIE` : la
// colonne du centre, le niveau d'une rangée, et les deux positions remarquables
// (le départ du joueur, la base terminale).
//
// ⚠ POURQUOI CE MODULE EXISTE ALORS QUE `GEOGRAPHIE` EST DÉJÀ ÉCRITE.
// `GEOGRAPHIE` porte des DISTANCES (« 25 cases depuis le bord bas », « colonne
// centre ») et pas des coordonnées. Tant que personne n'avait besoin d'une
// rangée et d'une colonne, ça suffisait. `sim/champs.js` en a besoin : le
// terrain d'une base se tire de sa POSITION. Traduire une distance en
// coordonnée demande de fixer deux conventions — d'où est comptée une rangée,
// et où tombe le centre d'une largeur paire — et ces conventions ne doivent
// exister qu'ICI, une fois.
//
// ⚠ LA CONVENTION DE RANGÉE N'A PAS ÉTÉ CHOISIE, ELLE A ÉTÉ DÉDUITE.
// `GEOGRAPHIE.departJoueur` porte DEUX faits liés : `strate: 5` et
// `casesDepuisBordBas: 25`. Avec `niveauParCase: 0.2`, un seul décalage les
// rend tous les deux vrais — 25 × 0,2 = 5. Le test l'asserte de face : si
// quelqu'un décale d'une rangée, la strate cesse de valoir 5 et la suite tombe.
// C'est ce qui fait qu'aucun « plus ou moins un » n'a été tranché à la main.

import { GEOGRAPHIE } from '../data/sites.js';

/**
 * Colonne du centre de la carte.
 *
 * ⚠ LA LARGEUR EST PAIRE (30), DONC IL N'Y A PAS DE CENTRE EXACT. Il faut
 * choisir entre 15 et 16, et le choix n'a aucune conséquence de jeu — ce qui
 * compte, c'est qu'il soit fait UNE fois et que les deux positions
 * remarquables l'emploient. `GEOGRAPHIE.baseTerminale.colonne` vaut la chaîne
 * `'centre'` sans dire laquelle ; cette fonction est la réponse, et elle est
 * la seule.
 *
 * Retenu : la moitié SUPÉRIEURE, soit 16 sur 30 — la même règle qu'un
 * `Math.ceil` de milieu de tableau, celle qu'on réécrit d'instinct.
 * @returns {number}
 */
export function colonneCentre() {
  return Math.ceil((GEOGRAPHIE.carte.largeur + 1) / 2);
}

/**
 * Niveau des sites d'une rangée de la carte.
 *
 * Le niveau monte de `niveauParCase` à chaque case en s'éloignant du bord BAS,
 * et se plafonne à `niveauPlafond`. Il ne descend jamais sous 1 : la rangée du
 * bord bas vaudrait 0, qui n'est pas un niveau.
 *
 * ⚠ RANGÉE 1 = BORD HAUT, RANGÉE `hauteur` = BORD BAS. C'est l'ordre de
 * lecture d'un écran, et c'est aussi celui de la grille de combat, où la
 * rangée 1 est le côté d'où arrivent les vagues. Une seule convention pour les
 * deux grilles, sinon on passe son temps à retourner des coordonnées.
 *
 * @param {number} rangee de 1 à `GEOGRAPHIE.carte.hauteur`
 * @returns {number} entier de 1 à `niveauPlafond`
 */
export function niveauDeLaRangee(rangee) {
  if (!Number.isInteger(rangee) || rangee < 1 || rangee > GEOGRAPHIE.carte.hauteur) {
    throw new RangeError(
      `carte : rangée ${rangee} hors de 1…${GEOGRAPHIE.carte.hauteur}`,
    );
  }
  const depuisLeBas = GEOGRAPHIE.carte.hauteur - rangee;
  const brut = Math.round(depuisLeBas * GEOGRAPHIE.niveauParCase);
  if (brut < 1) return 1;
  return brut > GEOGRAPHIE.niveauPlafond ? GEOGRAPHIE.niveauPlafond : brut;
}

/**
 * Distance d'une rangée au bord bas, en cases. Le bord bas lui-même vaut 0.
 * @param {number} rangee
 * @returns {number}
 */
export function casesDepuisBordBas(rangee) {
  return GEOGRAPHIE.carte.hauteur - rangee;
}

/**
 * Où le joueur ouvre le jeu.
 *
 * ARBITRÉ le 26/08 : « le joueur démarre tout en bas au milieu ». La COLONNE
 * vient de là — elle n'était écrite nulle part. La RANGÉE, elle, était déjà
 * arbitrée par `GEOGRAPHIE.departJoueur` : 25 cases depuis le bord bas, ce qui
 * fait la strate 5. Ce n'est donc pas le bord lui-même, et ça ne peut pas
 * l'être : le bord vaudrait le niveau 0.
 *
 * @returns {{rangee: number, colonne: number}}
 */
export function positionDepartJoueur() {
  return {
    rangee: GEOGRAPHIE.carte.hauteur - GEOGRAPHIE.departJoueur.casesDepuisBordBas,
    colonne: colonneCentre(),
  };
}

/**
 * Où se trouve la base terminale — le bout de la carte.
 * `GEOGRAPHIE.baseTerminale.colonne` dit `'centre'` ; c'est `colonneCentre()`
 * qui le traduit, la même que pour le départ du joueur. Les deux extrémités du
 * couloir sont donc alignées, ce qui n'est pas un hasard : la carte EST un
 * couloir.
 * @returns {{rangee: number, colonne: number}}
 */
export function positionBaseTerminale() {
  if (GEOGRAPHIE.baseTerminale.colonne !== 'centre') {
    throw new Error(
      `carte : colonne de base terminale « ${GEOGRAPHIE.baseTerminale.colonne} » non traduite`,
    );
  }
  return {
    rangee: 1 + GEOGRAPHIE.baseTerminale.casesDepuisBordHaut,
    colonne: colonneCentre(),
  };
}

/**
 * La case est-elle sur la carte ?
 * @param {number} rangee
 * @param {number} colonne
 * @returns {boolean}
 */
export function estSurLaCarte(rangee, colonne) {
  return Number.isInteger(rangee) && Number.isInteger(colonne)
    && rangee >= 1 && rangee <= GEOGRAPHIE.carte.hauteur
    && colonne >= 1 && colonne <= GEOGRAPHIE.carte.largeur;
}
