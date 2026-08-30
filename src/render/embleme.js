// Quel dessin porte un site de la carte du monde — un module PUR.
//
// ⚠ IL NE TOUCHE NI AU DOM NI À UN CONTEXTE. Il rend des NOMS de sprite et une
// géométrie ; `src/ui/monde.js` appelle `drawImage`. C'est la même discipline
// que `render/scene.js`, qui émet des primitives sans jamais voir une image.
//
// ⚠⚠ LE FICHIER S'APPELLE `embleme.js`, AU SINGULIER, ET CE N'EST PAS
// NÉGOCIABLE. `tools/emblemes.py` produit les sprites que ce module nomme ; un
// sélecteur de téléphone n'affiche que les noms courts, et deux fichiers qui ne
// diffèrent que par un `s` final sont exactement l'accident du 27/08 où le
// moteur de combat a été écrasé par la table de données du même nom court
// (CLAUDE.md §6, homonymes).
//
// ⚠⚠ NEUF SPRITES SONT PRÉ-BRANCHÉS, ET IL FAUT SAVOIR CE QUE ÇA ACHÈTE. Les
// sept POI et les deux grosses bases entrent dans le fichier livré, leurs noms
// se résolvent par une fonction, et un test asserte que chacun est joignable.
// **Rien ne les dessine** : le modèle ne produit aucun site de type POI, et une
// base ne connaît pas sa taille — `sim/peuplement.js` pose des bases d'UNE case.
// Ce que ça achète : le jour où le modèle en produira, SEUL le modèle changera.
// Ce que ça coûte : 37 038 octets pour les deux grosses bases, payés par tous
// les joueurs pour ce que personne ne voit encore.
//
// ⚠ ET ON N'INVENTE AUCUN TYPE DE SITE. Ajouter `poi_reacteur` à
// `EMBLEMES_CARTE` écrirait dans la table du MODÈLE une entrée que le modèle ne
// produit pas, et le prochain lot devrait la contredire. Le pré-branchement se
// fait donc entièrement du côté du DESSIN, ici.

import { ATLAS } from '../data/atlas.js';
import { ZOOM_CARTE } from '../data/sites.js';
import { existeDansAtlas } from './sprite.js';

/** La famille d'atlas où vivent les emblèmes. */
export const FAMILLE = 'carte';

/**
 * Les sept points d'intérêt, LUS dans l'atlas et non recopiés.
 *
 * ⚠ UNE LISTE ÉCRITE À LA MAIN VIEILLIRAIT au premier POI ajouté ou renommé, et
 * rien ne le dirait — c'est la faute que `SE_LIE_AU_MUR` de `sim/rendu-pose.js`
 * évite déjà en lisant `DEFENSES` plutôt qu'en énumérant.
 */
export const SPRITES_POI = ATLAS[FAMILLE].noms.filter((nom) => nom.startsWith('poi_'));

/**
 * Les deux grosses bases, par leur côté en cases.
 *
 * ⚠ ELLES NE SONT PAS DANS L'ATLAS, et c'est mesuré : à la grille 64 elles font
 * 128 × 128 et 192 × 192, quand `coudre` exige 64 × 64. Chacune voyage dans son
 * propre marqueur, comme l'atlas de terrain de la carte du monde. `tools/atlas.py`
 * les exclut nommément, et asserte qu'elles ne sont PAS carrées à la taille de
 * case — sans quoi l'exclusion deviendrait un moyen de cacher un sprite cassé.
 */
export const SPRITES_GROSSE_BASE = {
  2: 'base_o_2x2',
  3: 'base_o_3x3',
};

/**
 * Le sprite d'un site de la carte.
 *
 * ⚠ `camp` ET `avantPoste` SE DISTINGUENT PAR LEUR SAVEUR, PAS PAR LEUR TYPE.
 * L'art n'a pas de dessin propre à l'avant-poste : il a `site_quartz_n*` et
 * `site_scorie_n*`, qui disent ce qu'on y prend. C'est la saveur de la CASE
 * (`sim/site-de-la-case.js`), donc deux camps successifs au même endroit portent
 * le même emblème.
 *
 * ⚠⚠ `baseTerminale` PREND L'EMBLÈME DE BASE OUVRAGE DU DERNIER PALIER, faute de
 * sprite propre. **Ce n'est pas satisfaisant** — elle se confondra avec une base
 * de niveau 45 — et c'est un candidat naturel pour la grosse base 3 × 3. Posé au
 * rapport, non décidé ici.
 *
 * @param {string} type clé d'`EMBLEMES_CARTE`
 * @param {number} palier 1…9, de `palierDeNiveau`
 * @param {string|null} saveur `richeQuartz`, `richeScorie` ou `null`
 * @returns {string} un nom de la famille `carte`
 */
export function spriteDuSite(type, palier, saveur) {
  if (!Number.isInteger(palier) || palier < 1 || palier > 9) {
    throw new RangeError(`emblème : palier ${palier} hors de 1…9`);
  }
  if (type === 'base') return `site_base_o_n${palier}`;
  if (type === 'baseJoueur') return `site_base_j_n${palier}`;
  // La terminale est une base de l'Ouvrage, et la plus haute qui soit.
  if (type === 'baseTerminale') return `site_base_o_n9`;
  if (type === 'camp' || type === 'avantPoste') {
    if (saveur === 'richeQuartz') return `site_quartz_n${palier}`;
    if (saveur === 'richeScorie') return `site_scorie_n${palier}`;
    throw new RangeError(`emblème : « ${type} » sans saveur — reçu « ${saveur} »`);
  }
  throw new RangeError(`emblème : type de site inconnu « ${type} »`);
}

/**
 * Où se pose une grosse base, en CASES, autour de la case du site.
 *
 * ⚠⚠ UNE 3 × 3 SE CENTRE, UNE 2 × 2 NE PEUT PAS. `data/sites.js` a déjà buté sur
 * cette parité — « une largeur paire n'a pas de centre », et la carte est passée
 * de 30 à 31 colonnes pour cette raison. **Retenu : la case du site est le coin
 * HAUT-GAUCHE du carré pair.** C'est un choix réversible d'une ligne, et il est
 * dit au rapport comme tel : le coin bas-droit, ou un décalage d'un demi-pixel,
 * seraient aussi défendables.
 *
 * @param {number} cotes 2 ou 3
 * @param {{rangee: number, colonne: number}} site
 * @returns {{rangee: number, colonne: number, cotes: number}} le coin haut-gauche
 */
export function empriseDeLaGrosseBase(cotes, site) {
  if (SPRITES_GROSSE_BASE[cotes] === undefined) {
    throw new RangeError(`emblème : pas de grosse base de ${cotes} cases de côté`);
  }
  // Impair : le carré se centre, donc il déborde de (cotes − 1) / 2 de chaque
  // côté. Pair : la case EST le coin, donc aucun débordement vers le haut.
  const recul = (cotes - 1) % 2 === 0 ? (cotes - 1) / 2 : 0;
  return { rangee: site.rangee - recul, colonne: site.colonne - recul, cotes };
}

/**
 * La primitive de dessin d'une grosse base — position et taille, en pixels.
 *
 * ⚠ L'ÉCHELLE SE LIT DANS `ZOOM_CARTE`, elle ne se réécrit pas. Une grosse base
 * couvre `cotes` cases, donc `cran × cotes` pixels de côté ; un emblème
 * ordinaire vaut `cran / grilleEmbleme` fois sa taille source. Écrire ces
 * nombres ici en ferait une seconde vérité, et le dessin cesserait de suivre le
 * jour où un cran bougerait.
 *
 * @param {number} cotes 2 ou 3
 * @param {{rangee: number, colonne: number}} site
 * @param {number} cran pixels physiques par case
 * @param {{x: number, y: number}} origine coin haut-gauche de la vue, en pixels
 * @returns {{nom: string, x: number, y: number, cote: number}}
 */
export function dessinerGrosseBase(cotes, site, cran, origine) {
  if (!ZOOM_CARTE.crans.includes(cran)) {
    throw new RangeError(`emblème : cran ${cran} hors de ${ZOOM_CARTE.crans.join(', ')}`);
  }
  const emprise = empriseDeLaGrosseBase(cotes, site);
  return {
    nom: SPRITES_GROSSE_BASE[cotes],
    // ⚠ ENTIERS. Un `drawImage` à une position fractionnaire rééchantillonne et
    // rend le pixel art flou — c'est déjà la règle du fond de carte.
    x: Math.round((emprise.colonne - 1) * cran - origine.x),
    y: Math.round((emprise.rangee - 1) * cran - origine.y),
    cote: cran * emprise.cotes,
  };
}

/**
 * Tous les noms que ce module peut demander, atlas et hors-atlas confondus.
 *
 * ⚠ ELLE EXISTE POUR LE TEST, ET C'EST ASSUMÉ. Sans elle, le test des neuf
 * pré-branchés devrait réénumérer ce que le module sait produire, c'est-à-dire
 * recopier la moitié du fichier qu'il vérifie.
 */
export function nomsPreBranches() {
  return [...SPRITES_POI, ...Object.values(SPRITES_GROSSE_BASE)];
}

/**
 * Un nom est-il disponible — dans l'atlas, ou hors atlas par son marqueur ?
 *
 * Les deux grosses bases ne sont dans aucun atlas : leur disponibilité se
 * mesure sur le disque, pas sur l'index, et c'est le test qui va le chercher.
 * Ici on répond pour ce que le livrable porte : l'atlas.
 */
export function estDansLAtlas(nom) {
  return existeDansAtlas(FAMILLE, nom);
}
