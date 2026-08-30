// Orientation d'une pièce posée, et chaînage des murs — deux fonctions PURES.
//
// CE MODULE NE STOCKE RIEN, ET C'EST TOUT SON INTÉRÊT. Ni l'orientation d'une
// tourelle ni l'état de liaison d'un mur ne sont des données de sauvegarde :
// l'une change à chaque fois que la pièce change de cible, l'autre se lit
// entièrement dans les cases voisines. Les deux se DÉRIVENT, comme le terrain
// d'une base se dérive de sa fondation (`state.js`, « Le terrain est DÉRIVÉ,
// pas sauvegardé »).
//
// La conséquence pratique est que `SAVE_VERSION` ne bouge pas et qu'aucune
// migration n'est nécessaire. Le typedef `Effectif` de `state.js` garde ses
// cinq champs — `id`, `rangee` ou `vague`, `colonne`, `niveau`, `degatsMilli`.
//
// ⚠ ET IL FAUT QUE ÇA RESTE AINSI. `poserEffectif` recopie CHAMP PAR CHAMP dans
// son `push` final : une orientation ajoutée à l'objet passé par l'appelant
// serait jetée en silence, sans erreur ni trace. C'est le genre de bug qui se
// cherche une journée. Si l'orientation devait un jour être stockée, il faudrait
// toucher `poserEffectif`, `deplacerEffectif`, le typedef ET la migration — pas
// seulement le premier.

import { GRILLE, DEFENSES } from '../data/combat.js';

// ---------------------------------------------------------------------------
// Les seize orientations
// ---------------------------------------------------------------------------
//
// L'ordre est HORAIRE DEPUIS LE NORD, et il fait foi : c'est celui des noms de
// fichier des sprites, `def_j_casemate_nne`, `off_j_ratisseur_ese`, etc.
// (l'exemple était `off_o_…` jusqu'au 30/08 ; le camp Ouvrage n'a plus de
// sprite de tourelle — ses blindés la portent cuite dans la coque.)
//
// POURQUOI SEIZE, ET PAS HUIT NI TRENTE-DEUX. Mesuré sur la grille 9 × 18 en
// énumérant toutes les cases atteignables : à portée 2,5 les vingt cases à
// portée donnent exactement seize angles distincts, un par secteur de 22,5° ; à
// portée 5,5 les quatre-vingt-seize cases en donnent soixante-quatre, répartis
// eux aussi sur les seize secteurs. **Les seize secteurs sont tous atteignables
// aux deux portées** : aucun sprite n'est du poids mort, et un pas plus fin ne
// serait pas exploité par le résolveur.
//
// ⚠ L'ANGLE EST CONTINU, la quantification ne l'est pas. `distanceCarree`
// travaille sur `rangeeMilli` : une unité qui avance fait balayer l'angle sans
// à-coup. Une tourelle change donc de sprite plusieurs fois pendant qu'une
// cible se rapproche, et c'est le comportement voulu.
export const ORIENTATIONS = [
  'n', 'nne', 'ne', 'ene', 'e', 'ese', 'se', 'sse',
  's', 'sso', 'so', 'oso', 'o', 'ono', 'no', 'nno',
];

/** Nord pour l'armée, sud pour la garnison. Arbitré par Ethan le 30/08. */
export const ORIENTATION_PAR_DEFAUT = { armee: 'n', garnison: 's' };

const PAS = 360 / ORIENTATIONS.length;

/**
 * Quantifie un angle en degrés vers l'une des seize orientations.
 *
 * L'angle est compté HORAIRE DEPUIS LE NORD, comme les noms de sprite : 0 vise
 * la RANGÉE 18 — le fond de la base, qui est la PREMIÈRE ligne d'écran —, 90 la
 * droite, 180 le déploiement.
 *
 * ⚠ LE MOT QUI DÉSIGNE LE SOMMET NE S'EMPLOIE PAS ICI. Selon qu'on regarde
 * l'écran ou les numéros de rangée, il désigne l'un ou l'autre bout de la bande,
 * et la confusion a coûté un lot le 26/08 — `render/orientation.js` l'explique
 * en tête. On dit « la rangée 18 », « le fond », ou « la première ligne
 * d'écran », trois choses non ambiguës. Ce commentaire disait « le haut de la
 * grille » et il a contribué au défaut de boussole corrigé le 30/08.
 *
 * ⚠ `Math.round` et non `Math.floor`. Arrondir vers le bas décalerait chaque
 * secteur d'un demi-pas et ferait viser une tourelle 11° à côté de sa cible en
 * moyenne — visible à l'œil sur un canon long.
 *
 * @param {number} degres
 * @returns {string} l'une des seize clés d'`ORIENTATIONS`
 */
export function orientationDeLAngle(degres) {
  if (!Number.isFinite(degres)) {
    throw new Error(`orientationDeLAngle : « ${degres} » n'est pas un angle`);
  }
  const index = Math.round((((degres % 360) + 360) % 360) / PAS) % ORIENTATIONS.length;
  return ORIENTATIONS[index];
}

/**
 * Orientation d'un tireur vers sa cible.
 *
 * ⚠⚠ LE NORD EST LA RANGÉE CROISSANTE, ET C'EST UN CORRECTIF DU 30/08.
 * Ce module portait DEUX conventions de nord qui se contredisaient, et les deux
 * étaient figées par des tests voisins : `orientationVers` posait que le nord
 * est la rangée DÉCROISSANTE, quand `ORIENTATION_PAR_DEFAUT` fait regarder la
 * garnison au sud — c'est-à-dire vers le déploiement, donc vers les rangées 1
 * et 2, donc vers les rangées décroissantes. Une tourelle au repos visait juste
 * et se retournait à 180° dès qu'elle acquérait une cible.
 *
 * Mesuré avant correction : une garnison en rangée 5 visant un assaillant en
 * rangée 2 rendait `n`, alors que `render/orientation.js` pose la cible en ligne
 * d'écran 17 contre 14 pour le tireur — donc PLUS BAS à l'écran.
 *
 * C'est `ORIENTATION_PAR_DEFAUT` qui avait raison, et il n'a pas bougé. Le nord
 * est la rangée 18 — le fond de la base, la première ligne d'écran. Ce sens rend
 * trois choses vraies EN MÊME TEMPS : la garnison au repos regarde au sud, vers
 * l'assaut ; l'armée au repos regarde au nord, vers la base qu'elle attaque ; et
 * le sprite `_s` pointe vers le bas de l'image comme vers le bas de l'écran.
 *
 * D'où `atan2(dc, dr)` et non `atan2(dc, -dr)`.
 *
 * @param {{ rangee: number, colonne: number }} tireur
 * @param {{ rangee: number, colonne: number }} cible
 * @param {string} [defaut] rendu si les deux occupent la même case
 * @returns {string}
 */
export function orientationVers(tireur, cible, defaut = 'n') {
  const dr = cible.rangee - tireur.rangee;
  const dc = cible.colonne - tireur.colonne;
  // Même case : il n'y a pas d'angle. Rendre `n` au lieu de le signaler ferait
  // pointer la pièce au nord sans qu'on sache pourquoi.
  if (dr === 0 && dc === 0) return defaut;
  return orientationDeLAngle((Math.atan2(dc, dr) * 180) / Math.PI);
}

/**
 * Orientation à afficher pour une pièce, avec ou sans cible.
 *
 * @param {string} force `garnison` ou `armee`
 * @param {{ rangee: number, colonne: number }} pièce
 * @param {{ rangee: number, colonne: number }|null} cible
 * @returns {string}
 */
export function orientationDeLaPiece(force, piece, cible) {
  const defaut = ORIENTATION_PAR_DEFAUT[force];
  if (defaut === undefined) {
    throw new Error(`orientationDeLaPiece : « ${force} » n'est pas une force`);
  }
  return cible === null || cible === undefined
    ? defaut
    : orientationVers(piece, cible, defaut);
}

// ---------------------------------------------------------------------------
// Le chaînage des murs
// ---------------------------------------------------------------------------
//
// ARBITRÉ PAR ETHAN LE 30/08 : côté Ouvrage, aucune liaison ; côté joueur, le
// mur se lie aux tourelles. Les liaisons sont EST et OUEST seulement — un
// merlon est un mur de front, il court le long des rangées de la bande de
// défense et n'a pas de raccord nord-sud à représenter.
//
// ⚠ DEUX MERLONS VOISINS SE LIENT AUSSI, et c'est MOI qui le tranche, faute
// d'instruction. La phrase d'Ethan répondait à « merlon ou n'importe quelle
// défense », pas à « merlon avec merlon », et un mur de deux segments dont les
// moitiés ne se rejoignent pas serait visiblement cassé. Se défait en retirant
// `merlon` de `SE_LIE_AU_MUR`.
//
// ⚠ CONSÉQUENCE À CONNAÎTRE : côté Ouvrage, seul l'état `isole` est jamais lu.
// Les neuf `socle_def_o_*_{est,ouest,traversant}` et les trois
// `def_o_merlon_{est,ouest,traversant}` — trente-six fichiers sur trois grilles
// — sont du poids mort tant que cet arbitrage tient. Ils sont régénérables ;
// les laisser ne coûte que la confusion de les voir dans l'arbre.

/** Les quatre états, dans l'ordre des suffixes de sprite. */
export const LIAISONS = ['isole', 'est', 'ouest', 'traversant'];

/**
 * Portée minimale d'une défense qui porte une tourelle orientable.
 *
 * ⚠ CE N'EST PAS « PORTÉE NON NULLE », et le premier jet s'y est trompé. La
 * ronce et la herse ont une portée de 1 sans avoir de tourelle : ce sont des
 * obstacles qui blessent au contact. Seules les six défenses de portée 2,5 et
 * 5,5 ont un socle et une tourelle, et ce sont les seules que le mur raccorde.
 * Un test croise ce seuil avec `DEFENSES` et tombe si une défense passe entre
 * les mailles.
 */
export const PORTEE_AVEC_TOURELLE = 2.5;

/**
 * Ce à quoi un mur se raccorde : un merlon, et toute défense à tourelle.
 *
 * ⚠ LA LISTE SE LIT DANS LES TABLES, elle ne se recopie pas. `DEFENSES` est la
 * source ; une défense ajoutée avec une tourelle entrera d'elle-même, et une
 * liste écrite à la main serait la première à diverger. Même principe que le
 * `roster` de `FORCES` dans `state.js`.
 */
export const SE_LIE_AU_MUR = new Set([
  'merlon',
  ...Object.entries(DEFENSES)
    .filter(([, d]) => d.portee >= PORTEE_AVEC_TOURELLE)
    .map(([id]) => id),
]);

/**
 * Le camp joueur chaîne, le camp Ouvrage non.
 *
 * @param {string} camp `joueur` ou `ouvrage`
 */
export function campChaine(camp) {
  return camp === 'joueur';
}

/**
 * État de liaison d'un mur posé, lu dans ses deux voisines.
 *
 * @param {Array<{ id: string, rangee: number, colonne: number }>} garnison
 * @param {{ rangee: number, colonne: number }} mur
 * @param {string} [camp]
 * @returns {'isole'|'est'|'ouest'|'traversant'}
 */
export function liaisonDuMur(garnison, mur, camp = 'joueur') {
  if (!campChaine(camp)) return 'isole';
  // Les bords de grille ne comptent pas comme des voisines : un mur en colonne 1
  // n'a pas de raccord à l'ouest, il est simplement au bord.
  const voisine = (dc) => {
    const colonne = mur.colonne + dc;
    if (colonne < 1 || colonne > GRILLE.largeur) return false;
    return garnison.some(
      (p) => p.rangee === mur.rangee && p.colonne === colonne && SE_LIE_AU_MUR.has(p.id),
    );
  };
  const est = voisine(1);
  const ouest = voisine(-1);
  if (est && ouest) return 'traversant';
  if (est) return 'est';
  if (ouest) return 'ouest';
  return 'isole';
}

/**
 * Amorces à afficher sur le socle d'une tourelle : celles qui pointent vers un
 * merlon adjacent.
 *
 * ⚠ CE N'EST PAS `liaisonDuMur` AVEC UN AUTRE NOM. Un mur se raccorde à un mur
 * comme à une tourelle ; le socle d'une tourelle ne pousse une amorce que vers
 * un MUR. Deux tourelles côte à côte ne se soudent pas.
 *
 * @param {Array<{ id: string, rangee: number, colonne: number }>} garnison
 * @param {{ rangee: number, colonne: number }} tourelle
 * @param {string} [camp]
 * @returns {'isole'|'est'|'ouest'|'traversant'}
 */
export function liaisonDuSocle(garnison, tourelle, camp = 'joueur') {
  if (!campChaine(camp)) return 'isole';
  const merlon = (dc) => {
    const colonne = tourelle.colonne + dc;
    if (colonne < 1 || colonne > GRILLE.largeur) return false;
    return garnison.some(
      (p) => p.rangee === tourelle.rangee && p.colonne === colonne && p.id === 'merlon',
    );
  };
  const est = merlon(1);
  const ouest = merlon(-1);
  if (est && ouest) return 'traversant';
  if (est) return 'est';
  if (ouest) return 'ouest';
  return 'isole';
}
