// Les quarante-six pictogrammes d'interface, et l'unique façon de les poser.
//
// ⚠⚠ CE FICHIER EST TOUT CE QUE LES QUATRE LOTS DE CÂBLAGE PARTAGENT. Le lot
// PICTOGRAMMES a produit les sprites sans en afficher un seul ; celui-ci les
// met à l'écran. Ethan, 07/09 : « fais tout d'un seul coup, les quatre lots
// d'un coup ».
//
// ⚠⚠ AUCUN NOM DE SPRITE N'EST ÉCRIT DANS UN ÉCRAN, ET C'EST LA RÈGLE DE CE
// FICHIER. Les tables ci-dessous traduisent une clé de DONNÉE — une ressource,
// un châssis, un type de défense, une colonne de dégâts, un module — en nom de
// pictogramme. Un écran qui écrirait `'ui_module_bouclier'` en dur serait la
// première ligne à mentir le jour où un module change de clé ; ici, la
// traduction est mesurable, et `CÂB T2` confronte chaque table à la table de
// données dont elle dépend.
//
// ⚠ ET LE FOND VIENT DE LA FEUILLE, PAS DU JS. `.picto` porte
// `background-image: var(--atlas-interface)` une fois pour toutes : le JS ne
// pose que le CADRAGE — deux propriétés — au lieu de recopier une adresse
// `data:` de 234 ko par élément. C'est ce qui distingue ce chemin-ci de
// `poserCouches`, qui doit composer PLUSIEURS atlas par élément et passe donc
// par une classe engendrée.

import { fondDuSprite } from '../render/sprite.js';
import { RESSOURCES } from '../sim/economie-base.js';
import { COLONNES_DEGATS } from '../data/combat.js';
import { MODULES } from '../data/modules.js';
import { FAMILLE_DE_CHASSIS } from '../data/base.js';

/**
 * La classe que la feuille peint, et le seul endroit où son nom est écrit.
 *
 * ⚠ ELLE EST EXPORTÉE POUR LES TESTS AUTANT QUE POUR LES ÉCRANS : `CÂB T1`
 * confronte ce nom à la règle de `src/index.src.html`, faute de quoi renommer
 * l'un des deux laisserait des pictogrammes sans fond — invisibles, sans erreur.
 */
export const CLASSE_PICTOGRAMME = 'picto';

/** Les trois ressources, dans l'ordre de `RESSOURCES`. */
export const PICTOGRAMME_DE_LA_RESSOURCE = {
  quartz: 'ui_quartz',
  scorie: 'ui_scorie',
  electricite: 'ui_electricite',
};

/**
 * Le compteur contextuel du bandeau, par contexte de `CONTEXTES`.
 *
 * ⚠ LES TROIS SONT DES COMPTEURS DE LA MÊME TUILE, et c'est pour ça qu'ils sont
 * ensemble : « Emplac. », « Pts déf. » et « Pts off. » se succèdent dans le même
 * bloc selon la bande regardée. Le pictogramme suit le libellé, sinon la tuile
 * dirait « points de défense » sous l'icône des emplacements.
 */
export const PICTOGRAMME_DU_CONTEXTE = {
  batiments: 'ui_emplacement',
  defense: 'ui_armee_defensive',
  offense: 'ui_armee_offensive',
};

/**
 * Les trois colonnes de la matrice de dégâts.
 *
 * ⚠ LA TROISIÈME S'APPELLE `structureOuAviation` ET SON PICTOGRAMME DESSINE UN
 * AVION. C'est la moitié qu'il montre : le sprite a été nommé d'après le dessin
 * au lot PICTOGRAMMES, pas d'après la colonne, et la table fait le pont ici
 * plutôt que de promettre une structure que personne n'a dessinée.
 */
export const PICTOGRAMME_DE_LA_COLONNE = {
  infanterie: 'ui_cible_infanterie',
  vehicule: 'ui_cible_vehicule',
  structureOuAviation: 'ui_cible_aviation',
};

/**
 * Les trois familles de châssis, par la clé de `FAMILLE_DE_CHASSIS`.
 *
 * ⚠ CE SONT LES CLÉS INTERNES — `escouade`, `blinde`, `aeronef` —, pas les mots
 * d'Ethan qui les nomment à l'écran. La donnée porte la clé ; le mot est déjà
 * dans `FAMILLE_DE_CHASSIS`, et les deux ne se recopient pas.
 */
export const PICTOGRAMME_DU_CHASSIS = {
  escouade: 'ui_chassis_escouade',
  blinde: 'ui_chassis_blinde',
  aeronef: 'ui_chassis_aeronef',
};

/** Les quatre catégories de défense, par le champ `type` de `DEFENSES`. */
export const PICTOGRAMME_DE_LA_CATEGORIE = {
  mur: 'ui_categorie_mur',
  barriere: 'ui_categorie_barriere',
  tourelle: 'ui_categorie_tourelle',
  artillerie: 'ui_categorie_artillerie',
};

/**
 * Les pictogrammes qui ne traduisent aucune table — les grandeurs et les gestes.
 *
 * ⚠ ILS SONT NOMMÉS, PAS INDEXÉS, parce qu'ils ne viennent d'aucune clé de
 * donnée : ce sont des mots de l'interface. Les rassembler ici garde la règle
 * du fichier — aucun `'ui_…'` en dur dans un écran.
 */
export const PICTOGRAMMES = {
  pointsAttaque: 'ui_points_attaque',
  recherche: 'ui_recherche',
  pv: 'ui_pv',
  degats: 'ui_degats',
  butin: 'ui_butin',
  reparation: 'ui_reparation',
  temps: 'ui_temps',
  niveau: 'ui_niveau',
  verrou: 'ui_verrou',
  emplacement: 'ui_emplacement',
  vague: 'ui_vague',
  budget: 'ui_budget',
  precedent: 'ui_fleche_gauche',
  suivant: 'ui_fleche_droite',
  ameliorer: 'ui_fleche_verte',
  plus: 'ui_plus',
  moins: 'ui_moins',
};

/**
 * Le pictogramme d'un module, DÉRIVÉ de sa clé.
 *
 * ⚠⚠ DÉRIVÉ, PAS TABULÉ, ET C'EST LA MOITIÉ QUI COMPTE. Quatorze lignes écrites
 * à la main seraient quatorze occasions de se tromper d'un module — et le lot
 * PICTOGRAMMES a montré que c'est le risque réel de cette famille : les planches
 * s'annoncent « modules 1-8 » et « 9-14 » sans que cette numérotation soit celle
 * de `MODULES`. La conversion camel → serpent est la même que celle qui a servi
 * à NOMMER les sprites, donc les deux ne peuvent pas diverger.
 *
 * ⚠ ET ELLE LÈVE SUR UNE CLÉ INCONNUE. Rendre `undefined` ferait un
 * pictogramme vide, c'est-à-dire un carré transparent que personne ne verrait
 * manquer.
 *
 * @param {string} cle clé de `MODULES`
 * @returns {string} nom de sprite
 */
export function pictogrammeDuModule(cle) {
  if (!Object.hasOwn(MODULES, cle)) {
    throw new RangeError(`pictogramme : « ${cle} » n'est pas un module`);
  }
  return `ui_module_${cle.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)}`;
}

/**
 * Pose le CADRAGE d'un pictogramme sur un élément qui porte déjà `.picto`.
 *
 * ⚠ IL NE POSE PAS L'IMAGE. `fondDuSprite` lève si le nom n'est pas dans
 * l'atlas — c'est la garde qui attrape un sprite renommé —, et le
 * `background-image` vient de la feuille.
 *
 * @param {HTMLElement} element
 * @param {string} nom nom de sprite de la famille `interface`
 */
export function poserPictogramme(element, nom) {
  const fond = fondDuSprite('interface', nom);
  element.style.backgroundSize = fond.taille;
  element.style.backgroundPosition = fond.position;
  element.dataset.picto = nom;
}

/**
 * Un pictogramme neuf, prêt à être inséré.
 *
 * ⚠⚠ IL PORTE UN `aria-label` OU RIEN, JAMAIS UN LABEL VIDE. Un pictogramme
 * posé À CÔTÉ de son libellé est décoratif : le lecteur d'écran lirait deux fois
 * la même chose. Un pictogramme SEUL — la flèche d'une bascule, le cadenas d'une
 * vignette — porte le sens, et doit se dire. Les appelants tranchent, parce
 * qu'eux seuls savent si le mot est à côté.
 *
 * @param {Document} doc
 * @param {string} nom nom de sprite de la famille `interface`
 * @param {string} [libelle] ce que le pictogramme DIT, s'il est seul à le dire
 * @returns {HTMLElement}
 */
export function creerPictogramme(doc, nom, libelle = '') {
  const element = doc.createElement('span');
  element.className = CLASSE_PICTOGRAMME;
  poserPictogramme(element, nom);
  if (libelle === '') {
    element.setAttribute('aria-hidden', 'true');
  } else {
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', libelle);
  }
  return element;
}

/** Les quarante-six noms, pour les tests et pour rien d'autre. */
export function tousLesPictogrammes() {
  return [
    ...Object.values(PICTOGRAMME_DE_LA_RESSOURCE),
    ...Object.values(PICTOGRAMME_DU_CONTEXTE),
    ...Object.values(PICTOGRAMME_DE_LA_COLONNE),
    ...Object.values(PICTOGRAMME_DU_CHASSIS),
    ...Object.values(PICTOGRAMME_DE_LA_CATEGORIE),
    ...Object.values(PICTOGRAMMES),
    ...Object.keys(MODULES).map(pictogrammeDuModule),
  ];
}

/**
 * Les trois tables qui doivent couvrir EXACTEMENT une table de données.
 *
 * ⚠ ELLE EXISTE POUR LE TEST, et elle est ici plutôt que là-bas parce que le
 * couple « table de pictogrammes ↔ table de données » est une propriété de ce
 * fichier : un test qui recopierait les paires serait la seconde vérité que
 * tout ce module existe pour éviter.
 */
export const ACCORDS = [
  ['PICTOGRAMME_DE_LA_RESSOURCE', PICTOGRAMME_DE_LA_RESSOURCE, RESSOURCES],
  ['PICTOGRAMME_DE_LA_COLONNE', PICTOGRAMME_DE_LA_COLONNE, COLONNES_DEGATS],
  ['PICTOGRAMME_DU_CHASSIS', PICTOGRAMME_DU_CHASSIS, Object.keys(FAMILLE_DE_CHASSIS)],
];
