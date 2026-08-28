// Les trois niveaux d'une base du JOUEUR.
//
// ARBITRÉ par Ethan le 27/08/2026 : « les niveaux, ça concerne uniquement
// l'Ouvrage. Les niveaux du joueur, par base, il en a trois : le niveau de ses
// bâtiments, le niveau de sa défense et le niveau de son armée offensive. À
// chaque fois c'est une moyenne. »
//
// Deux précisions arbitrées le même jour :
//   — la moyenne se donne à UNE DÉCIMALE (5,8) ;
//   — elle porte sur ce qui est POSÉ, et sur rien d'autre. Un emplacement vide
//     ne compte pas pour zéro, il ne compte pas du tout. Le Chantier de
//     construction, lui, est un bâtiment posé comme les autres et il compte.
//
// ⚠ CE NIVEAU N'A RIEN À VOIR AVEC LA CARTE. `sim/carte.js` donne le niveau des
// sites de l'OUVRAGE sur une rangée ; aucune des trois moyennes ci-dessous ne
// le lit, et un redéploiement ne les change pas. Écrire « le joueur est au
// niveau de sa rangée » est la faute que ce module existe pour empêcher.
//
// ⚠ RENDU EN DIXIÈMES ENTIERS, JAMAIS EN FLOTTANT. `5,8` se range `58`. C'est
// la même discipline que l'économie, qui range des milli-unités : une décimale
// stockée en flottant s'additionne mal, se compare mal, et se sérialise avec
// des `5.799999999999999`. La conversion pour l'affichage — diviser par dix,
// virgule française, décimale TOUJOURS montrée, donc « 6,0 » et jamais « 6 » —
// appartient à l'interface et vit là-bas.

/**
 * Moyenne d'une liste de niveaux, en DIXIÈMES entiers.
 *
 * ⚠ L'ARRONDI SE FAIT EN ARITHMÉTIQUE ENTIÈRE, à la demie supérieure. Écrire
 * `Math.round(somme * 10 / n)` passerait par un flottant intermédiaire pour un
 * calcul qui n'en a pas besoin. `(somme × 20 + n) / (2n)` tronqué donne le même
 * résultat sans jamais quitter les entiers exacts : le numérateur ajoute une
 * demi-unité de dixième avant de tronquer, ce qui EST l'arrondi à la demie
 * supérieure.
 *
 * ⚠ ELLE LÈVE SUR UNE LISTE VIDE, elle ne rend pas zéro. Une base sans un seul
 * bâtiment n'existe pas — toute base neuve porte son Chantier — et rendre 0
 * ferait passer un état impossible pour une base de niveau zéro. C'est un fait
 * de programme, pas un fait de jeu.
 *
 * @param {Array<number>} niveaux entiers ≥ 1
 * @returns {number} dixièmes de niveau, entier
 */
export function moyenneEnDixiemes(niveaux) {
  if (!Array.isArray(niveaux)) {
    throw new TypeError('moyenneEnDixiemes : une liste de niveaux est attendue');
  }
  if (niveaux.length === 0) {
    throw new RangeError('moyenneEnDixiemes : liste vide — une base a toujours son Chantier');
  }
  let somme = 0;
  for (const niveau of niveaux) {
    if (!Number.isInteger(niveau) || niveau < 1) {
      throw new RangeError(`moyenneEnDixiemes : niveau « ${niveau} » — entier ≥ 1 attendu`);
    }
    somme += niveau;
  }
  const n = niveaux.length;
  return Math.floor((somme * 20 + n) / (2 * n));
}

/**
 * Niveau des BÂTIMENTS d'une base, en dixièmes.
 *
 * Il porte sur la disposition telle qu'elle est posée : un bâtiment par case,
 * `{ id, rangee, colonne, niveau }`. Les emplacements ouverts et vides ne
 * comptent pas.
 *
 * @param {Array<{ niveau: number }>} disposition
 * @returns {number} dixièmes de niveau
 */
export function niveauDesBatiments(disposition) {
  if (!Array.isArray(disposition)) {
    throw new TypeError('niveauDesBatiments : une disposition est attendue');
  }
  return moyenneEnDixiemes(disposition.map((b) => b.niveau));
}

// ---------------------------------------------------------------------------
// Les deux autres niveaux — écrits le 28/08, quand l'état a porté la matière
// ---------------------------------------------------------------------------
//
// Ils suivent EXACTEMENT la même règle que le premier et appellent
// `moyenneEnDixiemes` sans la réécrire : trois moyennes qui divergeraient
// seraient trois grandeurs différentes portant le même nom.
//
// ⚠⚠ UNE SEULE DIVERGENCE AVEC LEUR JUMEAU, ET ELLE EST ASSUMÉE : LA LISTE
// VIDE. `niveauDesBatiments` LÈVE dessus, et il a raison — une base sans un
// seul bâtiment n'existe pas, toute base neuve porte son Chantier, donc une
// disposition vide est un fait de programme. Une garnison vide et une armée
// vide sont au contraire l'état NORMAL de toute base neuve : ni Centre de
// commandement ni QG de défense n'y sont posés, donc il n'y a rien à engager.
// Lever dessus rendrait le premier affichage impossible.
//
// ⚠ ELLES RENDENT `null`, PAS ZÉRO, et c'est la convention que l'écran connaît
// déjà : `formaterNiveau` de `ui/chantier.js` rend « — » sur `null` depuis le
// lot MISE-EN-PAGE. Zéro se lirait « niveau zéro », c'est-à-dire une force
// posée et nulle, alors qu'il n'y a rien de posé du tout. C'est la même
// distinction que `CONTEXTES[x].chiffre` : dire si la grandeur EXISTE n'est pas
// dire si elle vaut zéro.

/**
 * Niveau de la GARNISON, en dixièmes — moyenne des pièces posées dans la bande
 * de défense. `null` si rien n'est posé.
 *
 * @param {Array<{ niveau: number }>} garnison
 * @returns {number|null} dixièmes de niveau, ou null
 */
export function niveauDeLaDefense(garnison) {
  if (!Array.isArray(garnison)) {
    throw new TypeError('niveauDeLaDefense : une garnison est attendue');
  }
  if (garnison.length === 0) return null;
  return moyenneEnDixiemes(garnison.map((p) => p.niveau));
}

/**
 * Niveau de l'ARMÉE d'assaut, en dixièmes — moyenne des unités posées dans les
 * quatre vagues. `null` si rien n'est posé.
 *
 * ⚠ UNE PIÈCE DÉTRUITE COMPTE QUAND MÊME. Elle reste dans la liste, à zéro PV,
 * en attente de réparation — arbitré le 28/08 : « les unités sont détruites
 * mais pas perdues ». Elle est POSÉE, donc elle entre dans la moyenne : filtrer
 * sur les dégâts ferait monter le niveau de l'armée à mesure qu'elle se fait
 * démolir.
 *
 * @param {Array<{ niveau: number }>} armee
 * @returns {number|null} dixièmes de niveau, ou null
 */
export function niveauDeLArmee(armee) {
  if (!Array.isArray(armee)) {
    throw new TypeError('niveauDeLArmee : une armée est attendue');
  }
  if (armee.length === 0) return null;
  return moyenneEnDixiemes(armee.map((p) => p.niveau));
}
