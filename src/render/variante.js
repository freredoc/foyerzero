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
import { ATLAS } from '../data/atlas.js';

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

/**
 * Combien de dessins porte une famille de terrain — sol, champ ou obstacle.
 *
 * ⚠ CES NOMBRES SE LISENT DANS L'ATLAS, ILS NE S'ÉCRIVENT PAS ICI. Le sol a
 * quatre dessins (`tile_sol_j_a` … `_d`), les champs et les obstacles en ont
 * deux. Les compter depuis les noms cousus fait suivre la table toute seule le
 * jour où une cinquième variante entrera — et fait rougir `sprite.test.js` si
 * l'atlas et le dessin cessent de s'accorder.
 *
 * ⚠⚠ ELLE DESCEND D'`ui/chantier.js` AU LOT ERGONOMIE, ET C'EST UN DÉPLACEMENT,
 * PAS UNE ÉCRITURE. Elle y vivait tant qu'un seul écran choisissait une
 * variante ; le champ de bataille en choisit une aussi depuis que ses obstacles
 * portent leur sprite, et `render/scene.js` n'a pas le droit d'importer `ui/`.
 * Une seconde écriture aurait donné à un même obstacle un dessin dans la base et
 * un autre au combat — invisible tant qu'on ne compare pas les deux écrans.
 *
 * @param {string} prefixe début du nom des sprites de la famille
 * @returns {number} au moins 1
 */
export function nombreDeVariantes(prefixe) {
  const n = ATLAS.terrain.noms.filter((nom) => nom.startsWith(`${prefixe}_`)).length;
  if (n < 1) throw new RangeError(`variante : aucune variante pour « ${prefixe} »`);
  return n;
}

/**
 * Le nom du sprite de terrain qui revient à cette case — variante comprise.
 *
 * ⚠⚠ C'EST LA SEULE PORTE, ET LES DEUX ÉCRANS Y PASSENT. `fondDuTerrain` de
 * `ui/chantier.js` la lit pour le DOM, `listeAffichage` de `render/scene.js`
 * pour le canevas : le même obstacle, à la même graine et sur la même case,
 * porte donc le même dessin des deux côtés. `ERGO T14` le mesure.
 *
 * ⚠ ET LE COMPTE EST MÉMORISÉ. L'écran de la base balaie 162 cases à chaque
 * peinture ; y filtrer les dix-huit noms de l'atlas ferait près de trois mille
 * comparaisons par geste pour un nombre qui ne change jamais de la vie du
 * programme.
 *
 * @param {string} prefixe début du nom, sans la lettre de variante
 * @param {number} graine graine de la partie
 * @param {number} rangee
 * @param {number} colonne
 * @returns {string} un nom de l'atlas `terrain`
 */
const comptesDeVariantes = new Map();
export function nomDeVariante(prefixe, graine, rangee, colonne) {
  if (!comptesDeVariantes.has(prefixe)) {
    comptesDeVariantes.set(prefixe, nombreDeVariantes(prefixe));
  }
  const nombre = comptesDeVariantes.get(prefixe);
  return `${prefixe}_${suffixeDeVariante(graine, rangee, colonne, nombre)}`;
}
