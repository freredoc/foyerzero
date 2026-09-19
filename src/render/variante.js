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
//
// ⚠⚠ ET IL Y EN A DEUX DEPUIS LE LOT RUINES-DÉFENSE, 19/09 — PARCE QUE `nombre`
// NE SUFFIT PAS À DÉCORRÉLER DEUX FAMILLES QUI ONT LE MÊME COMPTE. Le sol a
// QUATRE variantes ; les ruines de défense en ont quatre aussi. Sous un sel
// unique, `SEL_VARIANTE * 32 + nombre` vaut 132 des deux côtés, donc la ruine
// posée sur une case porte TOUJOURS la lettre du sol de cette case : quatre
// paires sur seize, répétées sur toute la base. **Mesuré : 100,00 % d'accord
// sur les 162 cases de la graine témoin.**
//
// ⚠⚠ DEUX ISSUES, ET C'EST LA MESURE QUI A TRANCHÉ, PAS LE GOÛT. Faire entrer
// la FAMILLE dans le mélange règle le cas génériquement — et change le hachage
// du SOL, donc repeint **76,0 % des cases d'une partie en cours**, mesuré, pour
// un joueur qui n'a rien demandé. Un second sel, lui, laisse le sol
// **identique au bit** et rend 25,86 % d'accord, ce qu'on attend de deux
// tirages indépendants sur quatre valeurs. C'est donc un SEL, et il se passe en
// ARGUMENT : une seconde fonction de tirage aurait été le second compteur que
// le brief interdit, et une table `préfixe → sel` la seconde vérité que §4
// interdit. La famille qui collisionne NOMME son sel, les autres gardent le
// défaut et ne bougent pas d'un pixel.

import { hachageBrut } from '../sim/peuplement.js';
import { ATLAS } from '../data/atlas.js';

/** Le sel de ce module, distinct des quatre déjà employés dans `src/`. */
export const SEL_VARIANTE = 4;

/**
 * Le sel des ruines de pièce de défense — le PREMIER LIBRE, et pas un de plus.
 *
 * ⚠ NEUF, PARCE QUE HUIT EST PRIS. `sim/generateur.js` a pris 8 au lot PAQUETS
 * en écrivant qu'il était « le premier libre partout » ; il ne l'est plus. Les
 * dix sels de `src/` se lisent au grep `export const SEL_` — 0 et 1 sont au
 * peuplement, qui ne les exporte pas.
 *
 * ⚠ ET IL NE SERT QU'AUX RUINES DE DÉFENSE. Le jour où une famille de plus
 * arrive avec quatre variantes, elle prend le suivant : deux tirages sans
 * rapport qui partagent un sel finissent par se corréler, et c'est très
 * exactement la faute que ce lot corrige.
 */
export const SEL_VARIANTE_RUINE = 9;

/**
 * La variante d'une case, dans `0 … nombre−1`.
 *
 * ⚠ `nombre` ENTRE DANS LE MÉLANGE, IL NE SE CONTENTE PAS DE BORNER. Sans lui,
 * la variante du champ posé sur une case serait la variante de son sol modulo 2 :
 * deux couches du même dessin choisiraient ensemble, et les paires
 * sol/champ se répéteraient à l'œil. Le faire entrer dans le sel décorrèle les
 * familles d'effectifs différents sans rien coûter.
 *
 * ⚠ ET LE SEL EST UN ARGUMENT DEPUIS LE LOT RUINES-DÉFENSE, parce que `nombre`
 * ne décorrèle QUE des familles d'effectifs différents — voir l'en-tête. Son
 * défaut est celui du terrain : tout appelant d'avant le lot rend le même
 * nombre, au bit.
 *
 * @param {number} graine graine de la partie
 * @param {number} rangee rangée de la case
 * @param {number} colonne colonne de la case
 * @param {number} nombre compte de variantes disponibles, au moins 1
 * @param {number} sel bande de sel ; `SEL_VARIANTE` par défaut
 * @returns {number} 0 … nombre−1
 */
export function variante(graine, rangee, colonne, nombre, sel = SEL_VARIANTE) {
  if (!Number.isInteger(nombre) || nombre < 1) {
    throw new RangeError(`variante : nombre de variantes invalide (${nombre})`);
  }
  if (!Number.isInteger(sel) || sel < 0) {
    throw new RangeError(`variante : sel invalide (${sel})`);
  }
  return hachageBrut(graine, rangee, colonne, sel * 32 + nombre) % nombre;
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
 * @param {number} sel bande de sel ; `SEL_VARIANTE` par défaut
 * @returns {string} une lettre minuscule
 */
export function suffixeDeVariante(graine, rangee, colonne, nombre, sel = SEL_VARIANTE) {
  return String.fromCharCode(97 + variante(graine, rangee, colonne, nombre, sel));
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
 * ⚠⚠ ET LA FAMILLE EST UN PARAMÈTRE DEPUIS LE LOT RUINES-DÉFENSE, 19/09. Elle
 * était `ATLAS.terrain` en dur ; les ruines de pièce vivent dans `defense`,
 * avec les pièces qu'elles remplacent. Un SECOND compteur écrit à côté aurait
 * été la seconde vérité que §4 interdit, et la première à ne pas suivre le jour
 * où une cinquième variante entrerait d'un côté seulement.
 *
 * ⚠ UNE FAMILLE INCONNUE LÈVE plutôt que de rendre zéro : `ATLAS[famille]`
 * vaudrait `undefined`, et `.noms` sur `undefined` lèverait de toute façon —
 * mais plus loin, et sans dire quelle famille manque.
 *
 * @param {string} prefixe début du nom des sprites de la famille
 * @param {string} famille famille d'atlas ; `terrain` par défaut
 * @returns {number} au moins 1
 */
export function nombreDeVariantes(prefixe, famille = 'terrain') {
  const atlas = ATLAS[famille];
  if (atlas === undefined) {
    throw new RangeError(`variante : famille d'atlas inconnue (« ${famille} »)`);
  }
  const n = atlas.noms.filter((nom) => nom.startsWith(`${prefixe}_`)).length;
  if (n < 1) {
    throw new RangeError(`variante : aucune variante pour « ${prefixe} » dans « ${famille} »`);
  }
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
 * ⚠⚠ ET LA CLÉ DU MÉMO PORTE LA FAMILLE DEPUIS QUE LA FAMILLE EST UN PARAMÈTRE.
 * Elle ne portait que le préfixe : deux familles qui partageraient un préfixe se
 * seraient rendu le compte l'une de l'autre, et le premier appel aurait décidé
 * pour le second. Aucune ne le partage aujourd'hui — c'est pour ça que la faute
 * aurait été muette.
 *
 * @param {string} prefixe début du nom, sans la lettre de variante
 * @param {number} graine graine de la partie
 * @param {number} rangee
 * @param {number} colonne
 * @param {string} famille famille d'atlas ; `terrain` par défaut
 * @param {number} sel bande de sel ; `SEL_VARIANTE` par défaut
 * @returns {string} un nom de l'atlas `famille`
 */
const comptesDeVariantes = new Map();
export function nomDeVariante(
  prefixe, graine, rangee, colonne, famille = 'terrain', sel = SEL_VARIANTE,
) {
  const cle = `${famille}/${prefixe}`;
  if (!comptesDeVariantes.has(cle)) {
    comptesDeVariantes.set(cle, nombreDeVariantes(prefixe, famille));
  }
  const nombre = comptesDeVariantes.get(cle);
  return `${prefixe}_${suffixeDeVariante(graine, rangee, colonne, nombre, sel)}`;
}
