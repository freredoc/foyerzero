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
// Les deux autres niveaux — ce qui manque pour les écrire
// ---------------------------------------------------------------------------
//
// `niveauDeLaDefense` et `niveauDeLArmeeOffensive` suivront EXACTEMENT la même
// règle et appelleront `moyenneEnDixiemes`, sans la réécrire : trois moyennes
// qui divergeraient seraient trois grandeurs différentes portant le même nom.
//
// Ils ne sont pas ici parce que la matière n'existe pas encore : `sim/state.js`
// ne porte que `disposition`, c'est-à-dire les bâtiments. La garnison du joueur
// et son armée d'assaut se composent aujourd'hui dans `ui/defense.js` et
// `ui/arsenal.js`, qui sont des ÉDITEURS — rien de ce qu'ils produisent n'est
// sauvegardé. Écrire les deux fonctions maintenant reviendrait à choisir seul
// la forme de cet état ; les écrire au moment où il est arbitré coûte deux
// lignes de plus et ne devine rien.
