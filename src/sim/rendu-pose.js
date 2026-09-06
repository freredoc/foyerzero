// L'ANGLE d'une pièce posée — une fonction PURE, et rien d'autre.
//
// CE MODULE NE STOCKE RIEN, ET C'EST TOUT SON INTÉRÊT. L'angle d'une tourelle
// n'est pas une donnée de sauvegarde : il change à chaque fois que la pièce
// change de cible. Il se DÉRIVE, comme le terrain d'une base se dérive de sa
// fondation (`state.js`, « Le terrain est DÉRIVÉ, pas sauvegardé »).
//
// La conséquence pratique est que `SAVE_VERSION` ne bouge pas et qu'aucune
// migration n'est nécessaire. Le typedef `Effectif` de `state.js` garde ses
// cinq champs — `id`, `rangee` ou `vague`, `colonne`, `niveau`, `degatsMilli`.
//
// ⚠ ET IL FAUT QUE ÇA RESTE AINSI. `poserEffectif` recopie CHAMP PAR CHAMP dans
// son `push` final : une orientation ajoutée à l'objet passé par l'appelant
// serait jetée en silence, sans erreur ni trace. C'est le genre de bug qui se
// cherche une journée. Si l'angle devait un jour être stocké, il faudrait
// toucher `poserEffectif`, `deplacerEffectif`, le typedef ET la migration — pas
// seulement le premier.
//
// ⚠⚠ CE FICHIER A PERDU LES DEUX TIERS DE SA MATIÈRE AU LOT SPRITES-V2-JOUEUR,
// ET C'EST LE LOT, PAS UN NETTOYAGE. Il portait DEUX mécanismes de plus, et les
// deux ont perdu leur objet le même jour :
//
//   • LES SEIZE ORIENTATIONS — `ORIENTATIONS`, `ORIENTATION_PAR_DEFAUT`,
//     `orientationDeLAngle`, `orientationVers`, `orientationDeLaPiece`. Une
//     tourelle du joueur était dessinée seize fois, une par secteur de 22,5°, et
//     le rendu choisissait le NOM du sprite. Il n'y a plus qu'un dessin, canon au
//     nord, et le rendu le TOURNE : l'angle est continu, la quantification n'a
//     plus rien à quantifier. Quatre-vingts sprites de tourelle d'unité tombent
//     à cinq, quatre-vingt-seize sprites de défense à six par camp.
//
//   • LE CHAÎNAGE DES MURS — `LIAISONS`, `PORTEE_AVEC_TOURELLE`,
//     `SE_LIE_AU_MUR`, `proprietaireChaine`, `liaisonDuMur`, `liaisonDuSocle`.
//     Ethan a arbitré le 05/09 que les pièces ne se raccordent plus : les
//     vingt-quatre socles à amorce et les quatre merlons de liaison ne sont plus
//     dessinés. Un merlon est un merlon.
//
// Les garder aurait laissé dans `src/sim/` un modèle que plus aucun dessin ne
// demande — « une constante que plus rien ne lit est un commentaire menteur en
// puissance » (CLAUDE.md §6). Ce qui reste est ce que le dessin emploie.

/** Nord pour l'armée, sud pour la garnison. Arbitré par Ethan le 30/08. */
export const ANGLE_PAR_DEFAUT = { armee: 0, garnison: 180 };

/**
 * L'angle d'un tireur vers sa cible, en degrés horaires depuis le nord.
 *
 * ⚠⚠ ELLE GÉNÉRALISE `orientationVers`, ELLE NE SE DOUBLE PAS — et le brief
 * demandait de trancher après lecture. `orientationVers` faisait DEUX choses :
 * calculer l'angle par un `atan2`, puis le quantifier sur seize secteurs. On
 * garde la première ; la seconde n'a plus d'objet. Écrire une seconde fonction
 * à côté aurait mis deux `atan2` dans le dépôt, dont un seul aurait reçu la
 * correction de boussole du 30/08 le jour d'après.
 *
 * ⚠⚠ LE NORD EST LA RANGÉE CROISSANTE, ET C'EST UN CORRECTIF DU 30/08 QU'ON NE
 * REFAIT PAS. Ce module portait alors deux conventions de nord qui se
 * contredisaient, et les deux étaient figées par des tests voisins :
 * `orientationVers` posait que le nord est la rangée DÉCROISSANTE, quand
 * l'orientation par défaut fait regarder la garnison au sud — c'est-à-dire vers
 * le déploiement, donc vers les rangées 1 et 2, donc vers les rangées
 * décroissantes. Une tourelle au repos visait juste et se retournait à 180° dès
 * qu'elle acquérait une cible.
 *
 * Mesuré avant correction : une garnison en rangée 5 visant un assaillant en
 * rangée 2 rendait le nord, alors que `render/orientation.js` pose la cible en
 * ligne d'écran 17 contre 14 pour le tireur — donc PLUS BAS à l'écran.
 *
 * Le nord est donc la rangée 18 — le fond de la base, la première ligne
 * d'écran. Ce sens rend trois choses vraies EN MÊME TEMPS : la garnison au repos
 * regarde au sud, vers l'assaut ; l'armée au repos regarde au nord, vers la base
 * qu'elle attaque ; et le canon dessiné vers le haut de l'image pointe vers le
 * haut de l'écran à angle nul. D'où `atan2(dc, dr)`, jamais `atan2(dc, -dr)`.
 *
 * ⚠ LE MOT QUI DÉSIGNE LE SOMMET NE S'EMPLOIE PAS ICI. Selon qu'on regarde
 * l'écran ou les numéros de rangée, il désigne l'un ou l'autre bout de la bande,
 * et la confusion a coûté un lot le 26/08 — `render/orientation.js` l'explique
 * en tête. On dit « la rangée 18 », « le fond », ou « la première ligne
 * d'écran », trois choses non ambiguës.
 *
 * ⚠ L'ANGLE EST CONTINU, ET C'EST CE QUE LA v2 ACHÈTE. `distanceCarree`
 * travaille sur `rangeeMilli` : une unité qui avance fait balayer l'angle sans
 * à-coup, et la tourelle la suit au degré. Le modèle à seize sprites la faisait
 * sauter par crans de 22,5°.
 *
 * @param {{ rangee: number, colonne: number }} tireur
 * @param {{ rangee: number, colonne: number }} cible
 * @param {number} [defaut] rendu si les deux occupent la même case
 * @returns {number} degrés, horaires depuis le nord
 */
export function angleVers(tireur, cible, defaut = 0) {
  // Même case : il n'y a pas d'angle. Rendre zéro au lieu du défaut ferait
  // pointer la pièce au nord sans qu'on sache pourquoi.
  const dr = cible.rangee - tireur.rangee;
  const dc = cible.colonne - tireur.colonne;
  if (dr === 0 && dc === 0) return defaut;
  if (!Number.isFinite(dr) || !Number.isFinite(dc)) {
    throw new Error(`angleVers : « ${dr}, ${dc} » n'est pas un écart de case`);
  }
  return (Math.atan2(dc, dr) * 180) / Math.PI;
}

/**
 * L'angle à afficher pour une pièce, avec ou sans cible — en degrés.
 *
 * ⚠ UNE FORCE INCONNUE LÈVE, elle ne retombe pas sur zéro. Un défaut silencieux
 * ferait pointer au nord toute une garnison dont la force aurait été mal
 * nommée, et rien à l'écran ne dirait que c'est une faute d'appel.
 *
 * @param {string} force `garnison` ou `armee`
 * @param {{ rangee: number, colonne: number }} piece
 * @param {{ rangee: number, colonne: number }|null} cible
 * @returns {number}
 */
export function angleDeLaPiece(force, piece, cible) {
  const defaut = ANGLE_PAR_DEFAUT[force];
  if (defaut === undefined) {
    throw new Error(`angleDeLaPiece : « ${force} » n'est pas une force`);
  }
  return cible === null || cible === undefined
    ? defaut
    : angleVers(piece, cible, defaut);
}
