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
 * ⚠⚠ `murCases` RÉSERVE LE MUR PEINT, ET IL VAUT ZÉRO PAR DÉFAUT — lot
 * MUR-PEINT, 03/09. Il a remplacé `contour`, qui réservait l'ANNEAU de blocs
 * que le code dessinait case par case : cet anneau n'existe plus, le mur est
 * peint dans le fond de base. Ce qui reste à réserver, c'est la place que le
 * mur occupe DANS l'image — une demi-case de chaque côté et une en haut, au
 * lieu d'une case pleine.
 *
 * ⚠⚠ ET LE PARAMÈTRE N'A PAS ÉTÉ RETIRÉ, IL A CHANGÉ DE VALEUR — il fallait le
 * dire plutôt que d'annoncer une suppression. La boîte affichée passe de
 * `largeur + 2` × `longueur + 1` (11 × 19) à `largeur + 1` × `longueur + 0,5`
 * (10 × 18,5) : la case GROSSIT d'environ 10 % à surface d'écran égale. Le
 * garder à zéro pour le banc reste nécessaire — il n'a pas de fond peint, et
 * lui réserver un mur déplacerait la douzaine de positions en pixels que ses
 * assertions portent.
 *
 * ⚠ IL EST EN CASES, PAS EN DRAPEAU, et c'est ce qui garde la géométrie du mur
 * chez le fond. `MUR_CASES` vit dans `render/fond.js`, avec la mesure qui le
 * justifie ; ce module-ci ne fait que réserver ce qu'on lui dit de réserver, et
 * n'a donc rien à savoir des huit décors. `ui/raid.js` passe `MUR_CASES`,
 * `ui/banc.js` ne passe rien.
 *
 * ⚠ UN PARAMÈTRE, PAS UNE SECONDE FONCTION. `calculerProjectionAvecContour`
 * aurait mis DEUX formules de letterboxing dans le dépôt, dont une seule
 * serait corrigée le jour d'une correction. C'est la même formule, avec un
 * nombre de cases réservées — et `murCases = 0` la rend au caractère près.
 *
 * @param {number} largeurPx Largeur disponible, en pixels CSS.
 * @param {number} hauteurPx Hauteur disponible, en pixels CSS.
 * @param {number} [murCases] Cases réservées au mur peint de chaque côté, 0 à 1.
 * @returns {{ tailleCase: number, margeX: number, margeY: number,
 *   largeurPx: number, hauteurPx: number, murCases: number }}
 */
export function calculerProjection(largeurPx, hauteurPx, murCases = 0) {
  if (!Number.isFinite(largeurPx) || !Number.isFinite(hauteurPx)
      || largeurPx <= 0 || hauteurPx <= 0) {
    throw new Error(`projection : viewport invalide ${largeurPx} × ${hauteurPx}`);
  }
  // ⚠ UN BOOLÉEN PASSÉ PAR MÉGARDE LÈVE ICI. `Number.isFinite(true)` rend
  // `false`, donc un `true` ne se coerce pas en 1 en silence — c'est la garde
  // que `contour` portait déjà, et elle n'a pas de raison de partir avec lui.
  if (!Number.isFinite(murCases) || murCases < 0 || murCases > 1) {
    throw new RangeError(`projection : mur peint « ${murCases} » — entre 0 et 1 case`);
  }
  // Le mur peint prend une demi-case À GAUCHE, une À DROITE et une EN HAUT.
  // Jamais en bas : le U s'ouvre sur les deux rangées de déploiement, par
  // lesquelles l'assaut arrive. D'où `2 ×` en largeur et une seule en hauteur.
  const colonnes = GRILLE.largeur + 2 * murCases;
  const lignes = GRILLE.longueur + murCases;
  const tailleCase = Math.floor(Math.min(largeurPx / colonnes, hauteurPx / lignes));
  if (tailleCase < 1) {
    throw new Error(`projection : viewport ${largeurPx} × ${hauteurPx} trop petit pour une case`);
  }
  return {
    tailleCase,
    // ⚠⚠ LA MARGE POINTE SUR LE CONTENU, PAS SUR LE MUR, et c'est tout ce qui
    // rend ce paramètre payable. `xDeColonne`, `yDeRangee`, `yDeRangeeMilli` et
    // `caseDepuisPixels` n'ont pas changé d'un caractère : la colonne 1 tombe
    // toujours en `margeX`. Le mur est simplement replié DANS la marge, où le
    // fond se pose en reculant de `MUR_CASES` — voir `rectangleDuFond`.
    margeX: Math.floor((largeurPx - colonnes * tailleCase) / 2) + murCases * tailleCase,
    margeY: Math.floor((hauteurPx - lignes * tailleCase) / 2) + murCases * tailleCase,
    largeurPx,
    hauteurPx,
    murCases,
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
 * Bord haut d'une LIGNE D'ÉCRAN, numérotée à partir de 1 comme dans
 * `render/orientation.js`.
 *
 * ⚠⚠ ELLE EXISTE POUR CE QUI N'EST PAS UNE RANGÉE — le mur de contour. Ses
 * pièces se posent en lignes d'écran, et sa première ligne est la ZÉRO : elle
 * est AU-DESSUS de la grille, donc au-dessus de la rangée `GRILLE.longueur`, et
 * `yDeRangee` la refuserait au titre qu'aucune rangée 19 n'existe. La distinction
 * est celle qu'`orientation.js` pose depuis le 27/08 : une rangée est du
 * MODÈLE, une ligne d'écran est du DESSIN, et l'anneau n'a que du dessin.
 *
 * ⚠ ET `yDeRangee` EN EST UN CAS, pas une seconde formule : la rangée `r` se
 * dessine en ligne `GRILLE.longueur + 1 − r`, et les deux expressions coïncident
 * alors terme à terme. Un test le refait plutôt que de le croire.
 */
export function yDeLigneEcran(projection, ligne) {
  return projection.margeY + (ligne - 1) * projection.tailleCase;
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
