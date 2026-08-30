// Quelle variante de dessin porte une case — et rien d'autre.
//
// Le sol a quatre variantes (`_a` à `_d`), les champs et les obstacles en ont
// deux. Le choix doit être DÉTERMINISTE ET STABLE : une case ne change pas de
// dessin entre deux peintures — `rafraichir` passe dix fois par seconde, un
// tirage frais ferait scintiller le sol sous le doigt — ni entre deux
// chargements de la même partie.
//
// ⚠⚠ IL NE CONSOMME PAS `etat.rng`, ET C'EST UNE RÈGLE, PAS UNE PRÉFÉRENCE.
// Le PRNG de l'état est celui de la SIMULATION : y prendre un tirage pour
// choisir une texture décale tout ce que le moteur tirera ensuite, et la partie
// cesse de se rejouer à l'identique. Le déterminisme strict est la règle §4 du
// dépôt. Un test le prouve en relevant l'état du flux avant et après une
// peinture complète — pas en relisant ce commentaire.
//
// ⚠ ET IL N'ÉCRIT PAS UN SECOND HACHAGE. `hachageBrut` de `sim/peuplement.js`
// existe précisément pour ça : `render/terrain.js` s'en sert déjà pour le pavage
// du fond de carte. En écrire un deuxième aurait mis deux tirages voisins dans
// le dépôt, tous deux « FNV, à peu près », dont un seul serait testé.
//
// ⚠ LE SEL EST À LUI, ET IL EST NEUF. Les sels 0 et 1 départagent les bases de
// l'Ouvrage (`sim/peuplement.js`), les sels 2 et 3 pavent le fond de la carte
// (`render/terrain.js`). Reprendre l'un des quatre corrélerait la texture d'une
// case à une décision de jeu prise ailleurs sur les mêmes coordonnées.

import { hachageBrut } from '../sim/peuplement.js';

/** Le sel de ce module, distinct des quatre déjà employés dans `src/`. */
export const SEL_VARIANTE = 4;

/**
 * La variante d'une case, dans `0 … nombre−1`.
 *
 * ⚠ `nombre` ENTRE DANS LE MÉLANGE, IL NE SE CONTENTE PAS DE BORNER. Sans lui,
 * la variante du champ posé sur une case serait la variante de son sol modulo 2 :
 * deux couches du même dessin choisiraient ensemble, et les paires
 * sol/champ se répéteraient à l'œil. Le faire entrer dans le sel décorrèle les
 * familles d'effectifs différents sans rien coûter.
 *
 * @param {number} graine graine de la partie
 * @param {number} rangee rangée de la case
 * @param {number} colonne colonne de la case
 * @param {number} nombre compte de variantes disponibles, au moins 1
 * @returns {number} 0 … nombre−1
 */
export function variante(graine, rangee, colonne, nombre) {
  if (!Number.isInteger(nombre) || nombre < 1) {
    throw new RangeError(`variante : nombre de variantes invalide (${nombre})`);
  }
  return hachageBrut(graine, rangee, colonne, SEL_VARIANTE * 32 + nombre) % nombre;
}

/**
 * Le suffixe de nom de fichier qui va avec cette variante : `a`, `b`, `c`, `d`…
 *
 * Les sprites se nomment `tile_sol_j_a` … `tile_sol_j_d`, `champ_quartz_a` …
 * Le suffixe se DÉDUIT du rang plutôt que de se lire dans une table de quatre
 * lignes : une table serait une seconde vérité, et la première à diverger le
 * jour où une cinquième variante entrerait au dépôt.
 *
 * @param {number} graine
 * @param {number} rangee
 * @param {number} colonne
 * @param {number} nombre
 * @returns {string} une lettre minuscule
 */
export function suffixeDeVariante(graine, rangee, colonne, nombre) {
  return String.fromCharCode(97 + variante(graine, rangee, colonne, nombre));
}
