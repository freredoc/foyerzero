// Projection de la grille de combat vers les pixels — lot 3A.
//
// Module PUR : aucune lecture du DOM, aucune dépendance au canvas. Il reçoit
// des dimensions en pixels CSS et rend une géométrie ; c'est ce qui le rend
// testable sous node --test, où il n'y a ni fenêtre ni écran.
//
// La grille logique fait 9 colonnes × 18 rangées (GRILLE de src/data/, jamais
// recopié en dur). La rangée 1 est en BAS, la rangée 18 en HAUT : l'attaquant
// monte, conformément à FICHE-STYLE.md §1 — « tout pointe vers le haut ».
//
// La case est CARRÉE, toujours. Le reste du viewport devient des marges égales
// (letterboxing) : ne jamais déformer la case, ne jamais appliquer de zoom ni
// de transform sur le conteneur — le buffer et la géométrie doivent rester
// d'accord.

import { GRILLE } from '../data/combat.js';
import { MILLI_PAR_CASE, estDansLaGrille } from '../sim/grille.js';

/**
 * Calcule la projection pour un viewport donné, en pixels CSS entiers.
 *
 *   tailleCase = floor(min(largeur / 9, hauteur / 18))
 *
 * et le reste en marges égales. Sur 412 px de large : 412/9 = 45,8 → 45, qui
 * demande 18 × 45 = 810 px de haut ; si le HUD n'en laisse pas autant, c'est
 * la hauteur qui commande et la grille se centre horizontalement.
 *
 * @param {number} largeurPx Largeur disponible, en pixels CSS.
 * @param {number} hauteurPx Hauteur disponible, en pixels CSS.
 * @returns {{ tailleCase: number, margeX: number, margeY: number,
 *   largeurPx: number, hauteurPx: number }}
 */
export function calculerProjection(largeurPx, hauteurPx) {
  if (!Number.isFinite(largeurPx) || !Number.isFinite(hauteurPx)
      || largeurPx <= 0 || hauteurPx <= 0) {
    throw new Error(`projection : viewport invalide ${largeurPx} × ${hauteurPx}`);
  }
  const tailleCase = Math.floor(Math.min(
    largeurPx / GRILLE.largeur,
    hauteurPx / GRILLE.longueur,
  ));
  if (tailleCase < 1) {
    throw new Error(`projection : viewport ${largeurPx} × ${hauteurPx} trop petit pour une case`);
  }
  return {
    tailleCase,
    margeX: Math.floor((largeurPx - GRILLE.largeur * tailleCase) / 2),
    margeY: Math.floor((hauteurPx - GRILLE.longueur * tailleCase) / 2),
    largeurPx,
    hauteurPx,
  };
}

/** Bord gauche d'une colonne (1 à 9), en pixels. */
export function xDeColonne(projection, colonne) {
  return projection.margeX + (colonne - 1) * projection.tailleCase;
}

/**
 * Bord HAUT de la case dessinée pour une position en milli-cases.
 *
 * La position m d'une entité est le bas de sa case : elle occupe la bande
 * [m, m + 1000). Le haut de la grille est le haut de la rangée 18, soit le
 * milli 19000 ; le bord haut dessiné vaut donc
 *
 *   y = margeY + (18000 − m) × tailleCase / 1000
 *
 * (à m = r × 1000 exactement : y = margeY + (18 − r) × tailleCase). Un seul
 * floor, en bout. La valeur est BORNÉE à la grille : une entité peut porter un
 * m intermédiaire au sommet (un stoppeur arrêté à 18950) sans être dessinée
 * au-dessus du champ.
 */
export function yDeRangeeMilli(projection, rangeeMilli) {
  const { tailleCase, margeY } = projection;
  const brut = margeY + Math.floor(
    ((GRILLE.longueur * MILLI_PAR_CASE - rangeeMilli) * tailleCase) / MILLI_PAR_CASE,
  );
  const haut = margeY;
  const bas = margeY + (GRILLE.longueur - 1) * tailleCase;
  return Math.min(Math.max(brut, haut), bas);
}

/** Bord haut de la case d'une RANGÉE entière (1 à 18) — obstacles, bâtiments. */
export function yDeRangee(projection, rangee) {
  return projection.margeY + (GRILLE.longueur - rangee) * projection.tailleCase;
}

/**
 * Projection INVERSE : un point en pixels CSS → la case qui le contient.
 *
 * Exacte réciproque de la projection directe, et volontairement STRICTE : un
 * point tombé dans les marges de letterboxing ou hors du canvas ne rend
 * AUCUNE case, jamais la plus proche. Un doigt à côté de la grille n'a rien
 * désigné, et le banc doit le dire plutôt que de deviner.
 *
 * Le bord haut-gauche d'une case lui appartient : la case couvre
 * [x, x + tailleCase) × [y, y + tailleCase).
 *
 * @param {object} projection Résultat de calculerProjection.
 * @param {number} xPx Abscisse en pixels CSS, origine au coin haut-gauche.
 * @param {number} yPx Ordonnée en pixels CSS.
 * @returns {{ rangee: number, colonne: number } | null}
 */
export function caseDepuisPixels(projection, xPx, yPx) {
  const { tailleCase, margeX, margeY } = projection;
  if (!Number.isFinite(xPx) || !Number.isFinite(yPx)) return null;
  const colonne = Math.floor((xPx - margeX) / tailleCase) + 1;
  // La rangée 1 est en BAS : l'axe des y descend, celui des rangées monte.
  const rangee = GRILLE.longueur - Math.floor((yPx - margeY) / tailleCase);
  // Un point à gauche de la marge donnerait un quotient négatif que floor
  // arrondit vers −∞ : le test de bornes suffit à l'écarter.
  if (xPx < margeX || yPx < margeY) return null;
  if (!estDansLaGrille(rangee, colonne)) return null;
  return { rangee, colonne };
}
