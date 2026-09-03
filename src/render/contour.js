// Le mur de contour d'une base — sa GÉOMÉTRIE, et rien d'autre.
//
// ⚠⚠ CE MODULE EST NÉ D'UN DÉMÉNAGEMENT, PAS D'UNE ÉCRITURE — lot MURS-OUVRAGE,
// 03/09. `tuilesDuContour` vivait dans `ui/chantier.js` depuis le lot MURS,
// parce qu'un seul écran s'en servait. Ethan : « c'est pour le joueur et pour
// l'ouvrage » — et la base de l'Ouvrage se regarde sur l'écran de RAID, qui est
// un canevas et passe par `render/`. Or `render/` n'a pas le droit d'importer
// `ui/` : la direction des dépendances est celle-là depuis le premier jour, et
// la retourner pour un mur aurait fait de l'écran de la base une dépendance du
// moteur de rendu.
//
// ⚠ ET C'EST BIEN UN DÉPLACEMENT : pas une ligne de la géométrie n'a changé en
// route, et `ui/chantier.js` RÉ-EXPORTE ce qu'il exposait — un ré-export n'est
// pas une copie, c'est la même liaison. Même motif que `baseCourante`, que
// `sim/state.js` ré-exporte depuis `sim/base-courante.js`.
//
// ⚠⚠ IL NE CONNAÎT NI LE DOM, NI LE CANEVAS, NI UNE IMAGE. Il rend des pièces
// en unités de CASE, à charge des deux écrans de les poser — l'un en fonds CSS
// sur une grille, l'autre en primitives `sprite` sur un canevas. C'est ce qui
// fait que les deux murs sont le MÊME mur : deux dessins d'une même liste, et
// non deux listes qui finiraient par diverger.

import { GRILLE } from '../data/combat.js';
import { ligneEcranDeLaBande } from './orientation.js';
import { variante } from './variante.js';

/**
 * La bande dont le HAUT porte le mur du fond — la base elle-même.
 *
 * `GEOMETRIE_BASE` de `data/base.js` RÉFÉRENCE déjà `GRILLE.bandes.batiments` :
 * la base EST cette bande-là, et c'est en haut d'elle que le mur du fond court,
 * entre ses deux coins.
 *
 * ⚠ C'EST AUSSI LA SEULE BANDE AU-DESSUS DE LAQUELLE LE MUR DÉPASSE, ce que
 * `bornesDeDefilement` de l'écran de la base lit pour ne pas couper la rangée
 * de coins.
 */
export const BANDE_DU_CONTOUR = 'batiments';

/**
 * La bande où le contour S'ARRÊTE — le bas de la défense.
 *
 * ⚠⚠ LES FLANCS DESCENDENT LE LONG DE LA DÉFENSE, ET C'EST UN ARBITRAGE
 * D'ETHAN DU 03/09 : « flanc sur la défense aussi ». Sa phrase précédente —
 * « les murs vont du haut de la base jusqu'à la défense et ne ferme pas en
 * bas » — avait d'abord été lue *jusqu'au bord de la base* ; elle voulait dire
 * *jusqu'au bout de la défense*. Le U enferme donc les DEUX bandes que le
 * joueur compose, et ne s'ouvre que sur les deux rangées de déploiement, par
 * lesquelles l'assaut arrive.
 *
 * ⚠ ET LE BAS RESTE SANS MUR, inchangé depuis le 31/08.
 */
export const BANDE_DE_FIN_DU_CONTOUR = 'defense';

/**
 * Ce qu'un mur couvre, et combien de variantes le dessin porte.
 *
 * ⚠ LES DEUX SE MESURENT SUR L'ASSET, ET UN TEST LES CONFRONTE AUX FICHIERS :
 * un mur fait `4 × COTE_SPRITE` de large, et `bord/` porte quatre murs et
 * quatre blocs par camp. Les écrire ici et nulle part ailleurs évite qu'une
 * cinquième variante entre au dépôt sans que le mur s'en serve.
 */
export const LONGUEUR_DU_MUR = 4;
export const NB_VARIANTES_DU_MUR = 4;

/**
 * La lettre de camp d'un propriétaire de combat.
 *
 * ⚠ ELLE SE LIT DANS UNE TABLE, ELLE NE SE DEVINE PAS DE L'INITIALE. « joueur »
 * et « ouvrage » commencent tous deux par une voyelle qui ne dit rien, et le
 * dépôt nomme ses fichiers `bord_j_` et `bord_o_` : un `nom[0]` rendrait « j »
 * et « o » par coïncidence aujourd'hui, et n'importe quoi le jour où un
 * troisième propriétaire arriverait. Un propriétaire inconnu LÈVE.
 */
export const CAMP_DU_PROPRIETAIRE = { joueur: 'j', ouvrage: 'o' };

/**
 * Le sel du tirage des variantes du mur. Il ne sort pas d'ici et n'a aucune
 * espèce d'importance — il faut juste qu'il ne change pas.
 */
const SEL_DU_MUR = 0x4d555253;

/**
 * Les pièces du mur de contour, en unités de CASE depuis le coin de la grille.
 *
 * ⚠⚠ LE MUR FAIT UN U, LE BAS RESTE SANS MUR — arbitrage d'Ethan du 31/08, mot
 * pour mot, et il n'a pas bougé. Ce qui a bougé le 03/09, c'est jusqu'OÙ les
 * flancs descendent : « flanc sur la défense aussi ». Le U enferme donc les
 * deux bandes que le joueur compose — bâtiments ET défense — et ne s'ouvre que
 * sur les deux rangées de déploiement, par lesquelles l'assaut arrive. C'est le
 * seul des quatre côtés sans mur, et le seul que l'assaillant franchit.
 *
 * ⚠⚠ ET LES PIÈCES NE SONT PAS À CHEVAL : ELLES CEIGNENT — lot MURS, 03/09.
 * Ethan : « pour que ça passe bien, parce que là ça déborde ». La v1 était un
 * TRAIT centré sur la ligne du bord, donc mordant d'une demi-case de chaque
 * côté. La v2 est un BLOC PLEIN : il occupe une case entière et ne recouvre
 * rien. Le contour est donc un ANNEAU — la boîte fait `largeur + 2` cases de
 * large et `longueur + 1` de haut. C'est une géométrie, pas une épaisseur, et
 * les DEUX écrans la paient : l'un en `padding` de grille, l'autre en cases
 * réservées par `calculerProjection`.
 *
 * ⚠ LE HAUT SE PAVE, ET LE PAVAGE SE CALCULE. Un mur couvre quatre cases, un
 * bloc une : on pose autant de murs qu'il en tient entre les deux coins, et des
 * blocs pour le reste. Sur cette grille-ci, neuf cases entre les coins font
 * deux murs et un bloc — mais rien de tout ça n'est écrit : le jour où la base
 * changera de largeur, le pavage suivra tout seul.
 *
 * ⚠ RIEN NE SE RECOUVRE ET RIEN NE MANQUE. Les longueurs s'additionnent
 * exactement à `largeur + 2`, et un test refait cette somme au lieu de la
 * croire.
 *
 * ⚠⚠ LA VARIANTE D'UN BLOC SE TIRE DU HACHAGE, PAS D'UN COMPTEUR. Un `i % 4`
 * donnerait un damier régulier sur les blocs d'un flanc, ce que quatre
 * variantes existent précisément pour éviter. `variante` est pure, ne touche
 * pas `etat.rng`, et prend la POSITION de la pièce : le mur ne bouge donc pas
 * d'une peinture à l'autre.
 *
 * ⚠ ET IL NE PREND PAS LA GRAINE DE LA PARTIE, VOLONTAIREMENT. Le contour se
 * construit au CÂBLAGE de l'écran, avant qu'aucun état n'existe ; lui passer
 * une graine obligerait à le reconstruire au premier chargement, pour que le
 * mur d'un joueur diffère de celui d'un autre — ce que personne n'a demandé.
 * Le sel est une constante, et il est nommé.
 *
 * @param {string} camp `j` ou `o`
 * @returns {Array<{nom: string, x: number, y: number, l: number, h: number}>}
 *   x, y le coin ; l, h la taille — le tout en unités de case
 */
export function tuilesDuContour(camp) {
  if (camp !== 'j' && camp !== 'o') {
    throw new RangeError(`contour : camp de contour « ${camp} » inconnu`);
  }
  const bandeHaute = GRILLE.bandes[BANDE_DU_CONTOUR];
  const bandeBasse = GRILLE.bandes[BANDE_DE_FIN_DU_CONTOUR];
  const { premiereLigne } = ligneEcranDeLaBande(bandeHaute);
  const fin = ligneEcranDeLaBande(bandeBasse);
  const haut = premiereLigne - 1;
  const gauche = 0;
  const droite = GRILLE.largeur + 1;
  // ⚠ LA HAUTEUR DU FLANC SE CALCULE D'UN BORD À L'AUTRE, elle ne s'additionne
  // pas bande par bande : si un jour une troisième bande se glissait entre les
  // deux, une somme la sauterait et le mur aurait un trou.
  const nbLignes = fin.premiereLigne + fin.nbLignes - premiereLigne;
  const bloc = (x, y) => ({
    nom: `bord_${camp}_bloc_${variante(SEL_DU_MUR, y, x, NB_VARIANTES_DU_MUR) + 1}`,
    x, y, l: 1, h: 1,
  });

  const pieces = [bloc(gauche, haut), bloc(droite, haut)];
  // Le haut, entre les deux coins : des murs de quatre cases tant qu'il en
  // tient, puis des blocs.
  //
  // ⚠⚠ LA VARIANTE D'UN MUR TOURNE PAR RANG, ELLE NE SE TIRE PAS. Les blocs
  // sont dix-huit et le hachage les mélange bien ; les murs, eux, sont DEUX sur
  // cette grille-ci — un tirage y emploierait deux variantes sur quatre, prises
  // au hasard, et le livrable paierait les deux autres pour rien. Le rang les
  // prend dans l'ordre : autant de variantes que de créneaux, et pas une de
  // plus. Le jour où la base s'élargira, la troisième entrera d'elle-même.
  let x = gauche + 1;
  let rang = 0;
  while (x < droite) {
    if (droite - x >= LONGUEUR_DU_MUR) {
      pieces.push({
        nom: `bord_${camp}_mur_${(rang % NB_VARIANTES_DU_MUR) + 1}`,
        x, y: haut, l: LONGUEUR_DU_MUR, h: 1,
      });
      x += LONGUEUR_DU_MUR;
      rang += 1;
    } else {
      pieces.push(bloc(x, haut));
      x += 1;
    }
  }
  // Les deux flancs, du bas des coins au bord de la base.
  for (let y = haut + 1; y <= haut + nbLignes; y += 1) {
    pieces.push(bloc(gauche, y), bloc(droite, y));
  }
  return pieces;
}

/**
 * Les DESSINS qu'un anneau emploie vraiment, une fois chacun, dans l'ordre.
 *
 * ⚠⚠ ELLE SE DÉRIVE DE L'ANNEAU, ELLE NE SE RECOPIE PAS. Le livrable ne porte
 * que ces images-là — six sur seize —, et deux endroits ont besoin de la liste :
 * `tools/build.js` par ses marqueurs, et les deux écrans par leur table
 * d'images. Une liste écrite à la main serait la première à mentir le jour où
 * la base changerait de largeur : un troisième créneau de mur entrerait dans
 * l'anneau sans que personne n'inline son image, et le mur aurait un trou que
 * seul l'œil verrait.
 *
 * @param {string} camp `j` ou `o`
 * @returns {string[]}
 */
export function nomsDuContour(camp) {
  const vus = [];
  for (const piece of tuilesDuContour(camp)) {
    if (!vus.includes(piece.nom)) vus.push(piece.nom);
  }
  return vus.sort();
}
