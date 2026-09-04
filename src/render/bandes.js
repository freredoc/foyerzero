// Les trois bandes de la grille — où chacune tombe à l'écran, et jusqu'où l'on
// peut défiler dedans.
//
// ⚠⚠ CE MODULE EST UN DÉPLACEMENT, PAS UNE ÉCRITURE — lot ÉCRAN-RAID, 04/09.
// Tout ce qu'il porte vivait dans `src/ui/chantier.js`, où il servait un seul
// écran. L'écran de raid cadre désormais une bande à la fois lui aussi ; une
// SECONDE table des bandes dans `ui/raid.js` aurait été la deuxième vérité que
// `CLAUDE.md` §4 interdit, et la première à mentir le jour où une rangée bouge.
// Pas une ligne de la géométrie n'a changé en route.
//
// ⚠ ET IL N'Y A PAS DE RÉ-EXPORT DEPUIS `ui/chantier.js`. Le lot MUR-PEINT a
// retiré celui qui restait de `tuilesDuContour` en écrivant pourquoi : les
// appelants prennent à la SOURCE. `ui/chantier.js` importe d'ici comme
// `ui/raid.js`, et `test/chantier.test.js` aussi.
//
// ⚠⚠ IL EST DANS `render/`, PAS DANS `ui/`, ET C'EST CE QUI LE REND PARTAGEABLE.
// Un écran qui importerait l'autre écran pour une géométrie ferait dépendre le
// raid de la mise en page de la base — le couplage exact que `render/fond.js`
// existe pour éviter. Ce module ne connaît ni le DOM, ni le canevas : il rend
// des lignes d'écran et des pixels, à charge des deux écrans de les poser, l'un
// en `scrollTop`, l'autre en marge de projection.

import { GRILLE } from '../data/combat.js';
import { ligneEcranDeLaBande } from './orientation.js';
import { BANDE_SOUS_LE_MUR } from './fond.js';

/**
 * Les trois bandes de la grille, lues dans `GRILLE` et jamais réécrites.
 *
 * ⚠ LA RANGÉE 18 EST LE FOND, PAS « LE HAUT ». L'assaillant paraît aux rangées
 * 1–2 et monte en numéro ; la dernière rangée est donc la dernière qu'il
 * atteint. Le mot « haut » a coûté un lot le 26/08 et il ne se réemploie pas.
 */
export const BANDES = [
  { cle: 'deploiement', nom: 'Déploiement', ...GRILLE.bandes.deploiement },
  { cle: 'defense', nom: 'Défense', ...GRILLE.bandes.defense },
  { cle: 'batiments', nom: 'Chantier', ...GRILLE.bandes.batiments },
];

/**
 * Les bandes qui portent un bouton dans la barre du bas, dans l'ordre où elles
 * se lisent à l'écran : la base d'abord, sa défense ensuite.
 *
 * ⚠ LE DÉPLOIEMENT N'EN EST PAS, ET C'EST UNE CORRECTION. Le lot ÉCRAN-CHANTIER
 * lui avait donné un bouton nommé « Assaut » pointant sur les rangées 1–2. Ces
 * deux rangées sont l'endroit où les vagues PARAISSENT pendant un combat, pas
 * celui où on les COMPOSE : le bouton promettait un éditeur et livrait du sol
 * nu. La composition d'assaut a désormais son propre écran (`ui/offense.js`),
 * atteint par un bouton qui, lui, mène là où il le dit.
 *
 * La bande elle-même reste dans `BANDES` : elle existe toujours dans la grille,
 * elle se dessine, elle se traverse en défilant. Elle n'a simplement plus de
 * raccourci.
 */
export const BANDES_NAVIGABLES = ['batiments', 'defense'];

/**
 * Les deux bandes navigables, DANS L'ORDRE OÙ ELLES TOMBENT À L'ÉCRAN.
 *
 * ⚠ L'ORDRE SE CALCULE, IL NE SE RECOPIE PAS. `BANDES_NAVIGABLES` est écrite
 * dans l'ordre où on les nomme ; ce qui décide de « au-dessus » et « en
 * dessous », c'est `render/orientation.js`, et lui seul. Recopier l'ordre à la
 * main ferait pointer la flèche du mauvais côté le jour où la grille se
 * retournerait — et la grille S'EST déjà retournée une fois, le 27/08.
 */
function bandesDansLOrdreDeLEcran() {
  return BANDES
    .filter((b) => BANDES_NAVIGABLES.includes(b.cle))
    .map((b) => ({ ...b, ...ligneEcranDeLaBande(b) }))
    .sort((a, b) => a.premiereLigne - b.premiereLigne);
}

/**
 * Ce que fait le bouton de bascule quand on est sur cette bande.
 *
 * ⚠⚠ ETHAN, 31/08 : « on ne doit plus passer librement de la base joueur à la
 * def joueur. On rajoute un bouton avec une flèche en bas à droite. » La bascule
 * cesse donc d'être un défilement et devient un GESTE — ce qui veut dire qu'il
 * faut dire vers OÙ il emmène.
 *
 * ⚠ LE SENS DE LA FLÈCHE SE DÉDUIT DES LIGNES D'ÉCRAN, il ne s'écrit pas. La
 * bande des bâtiments tombe en haut, celle de la défense en dessous : aller à la
 * défense DESCEND. Écrire « ▼ pour la défense » en dur serait juste aujourd'hui
 * et faux le jour où la grille changerait de sens, sans que rien ne le dise.
 *
 * @param {string} cleCourante
 * @returns {{cible: string, glyphe: string, libelle: string}}
 */
export function basculeDeBande(cleCourante) {
  const ordre = bandesDansLOrdreDeLEcran();
  const ici = ordre.findIndex((b) => b.cle === cleCourante);
  // ⚠ UNE BANDE NON NAVIGABLE RENVOIE VERS LA PREMIÈRE, elle ne lève pas. Le
  // déploiement n'a pas de bouton et n'en aura pas ; s'y trouver ne doit pas
  // laisser le joueur sans porte de sortie.
  const depart = ici < 0 ? -1 : ici;
  const cible = ordre[(depart + 1) % ordre.length];
  const descend = depart < 0 || cible.premiereLigne > ordre[depart].premiereLigne;
  return {
    cible: cible.cle,
    glyphe: descend ? '▼' : '▲',
    libelle: `Aller à ${cible.nom}`,
  };
}

/**
 * Jusqu'où le champ a le droit de défiler quand on regarde cette bande.
 *
 * ⚠⚠ C'EST CE QUI REMPLACE LE DÉFILEMENT LIBRE. Avant le 31/08, la molette
 * traversait les trois bandes d'un trait : on passait des bâtiments à la défense
 * sans l'avoir demandé, et la palette changeait sous le doigt au milieu du
 * geste. Le défilement reste — il faut bien atteindre le bas d'une bande quand
 * on a zoomé — mais il ne FRANCHIT plus une frontière.
 *
 * ⚠ LA BORNE BASSE D'UNE BANDE EST LE HAUT DE LA SUIVANTE **NAVIGABLE**, pas le
 * haut de la bande suivante tout court. La défense est la dernière des deux ;
 * sous elle il n'y a que le déploiement, qui n'a pas de bouton et n'est pas un
 * endroit où l'on compose. Le lui rattacher est ce qui fait que ces deux rangées
 * restent ATTEIGNABLES : les enfermer aurait retiré du jeu deux rangées que le
 * défilement montrait, et « rien ne se retire en silence ».
 *
 * ⚠⚠ LE CONTENU NE COMMENCE PLUS AU HAUT DE LA GRILLE. Depuis le mur de
 * contour, `#chantier-grille` porte une demi-case de `padding` : la première
 * rangée est donc décalée d'autant, et l'ignorer ferait s'arrêter chaque bascule
 * une demi-rangée trop haut — on verrait la fin de la bande précédente au lieu
 * du début de celle qu'on a demandée. Mesuré : la bascule vers la Défense
 * s'arrêtait à 288 px au lieu de 306.
 *
 * ⚠⚠ ET LE MUR NE DÉBORDE QU'AU-DESSUS DE LA BANDE QU'IL ENTOURE. Il se pose à
 * cheval sur la ligne du bord, donc il monte d'une demi-case au-dessus de la
 * première rangée de la base — c'est ce que `min` retire pour cette bande-là, et
 * pour elle seule. En bas, il n'y a rien à retirer : le mur fait un U, ses bras
 * s'arrêtent au bord de la base (arbitrage d'Ethan du 31/08).
 *
 * ⚠ `padding` VAUT ZÉRO PAR DÉFAUT, et c'est ce qui garde le sens d'origine :
 * sans marge, une bande va d'une rangée à l'autre, exactement comme avant.
 *
 * @param {string} cleBande
 * @param {number} hauteurRangee hauteur d'une rangée à l'écran, en pixels
 * @param {number} hauteurVue hauteur visible du champ, en pixels
 * @param {number} [padding] marge de la grille, en pixels — une demi-case
 * @returns {{min: number, max: number}} bornes de `scrollTop`
 */
export function bornesDeDefilement(cleBande, hauteurRangee, hauteurVue, padding = 0) {
  if (!(hauteurRangee > 0)) {
    throw new RangeError(`bandes : hauteur de rangée « ${hauteurRangee} » invalide`);
  }
  const ordre = bandesDansLOrdreDeLEcran();
  const ici = ordre.findIndex((b) => b.cle === cleBande);
  if (ici < 0) throw new RangeError(`bandes : bande « ${cleBande} » non navigable`);
  const suivante = ordre[ici + 1];
  const premiereLigneApres = suivante === undefined
    ? GRILLE.longueur + 1
    : suivante.premiereLigne;
  // Le mur ne dépasse qu'au-dessus de la bande qu'il entoure — le U n'a pas de
  // bas —, et sa hauteur de dépassement est très exactement celle du `padding`.
  const murAuDessus = cleBande === BANDE_SOUS_LE_MUR ? padding : 0;
  const min = padding + (ordre[ici].premiereLigne - 1) * hauteurRangee - murAuDessus;
  // ⚠ LE BAS EST LE BAS DU CONTENU, PAS DE LA BOÎTE : la demi-case de `padding`
  // du bas ne porte aucun dessin, et la rendre atteignable ferait défiler dans
  // du vide.
  const bas = padding + (premiereLigneApres - 1) * hauteurRangee;
  // ⚠ `max` NE PASSE JAMAIS SOUS `min`. Quand la bande tient entière dans la vue
  // — le cas normal au zoom d'ouverture — il n'y a rien à défiler du tout, et
  // une borne haute négative ferait remonter le champ au-dessus de sa bande.
  return { min, max: Math.max(min, bas - hauteurVue) };
}

/**
 * La bande à laquelle appartient une rangée.
 * @param {number} rangee
 * @returns {string} clé de bande
 */
export function bandeDeLaRangee(rangee) {
  const trouvee = BANDES.find((b) => rangee >= b.premiere && rangee <= b.derniere);
  if (trouvee === undefined) {
    throw new RangeError(`bandes : rangée ${rangee} hors de la grille`);
  }
  return trouvee.cle;
}


/**
 * Combien de CASES une bande occupe verticalement, mur peint compris.
 *
 * ⚠⚠ LE MUR NE COMPTE QUE POUR LA BANDE QU'IL ENTOURE, et c'est la même règle
 * que `bornesDeDefilement` applique déjà à sa borne haute. Il se pose à cheval
 * sur le bord du haut de la base ; l'ajouter aux trois bandes réserverait une
 * demi-case de vide au-dessus de la défense et du déploiement, où il n'y a
 * rien de peint.
 *
 * ⚠ `null` DÉSIGNE LA VUE D'ENSEMBLE — les dix-huit rangées et le mur. C'est
 * ce que le DÉROULÉ d'un combat demande : un raid part des rangées 1–2 et
 * atteint les bâtiments en 11–18, donc cadrer une seule bande pendant qu'il se
 * joue serait regarder ailleurs.
 *
 * @param {string|null} cleBande clé de bande, ou `null` pour la vue d'ensemble
 * @param {number} [murCases] ce que le mur peint occupe, en cases
 * @returns {number} hauteur en cases
 */
export function casesDeLaBande(cleBande, murCases = 0) {
  if (cleBande === null) return GRILLE.longueur + murCases;
  const bande = BANDES.find((b) => b.cle === cleBande);
  if (bande === undefined) throw new RangeError(`bandes : bande « ${cleBande} » inconnue`);
  const rangees = bande.derniere - bande.premiere + 1;
  return rangees + (cleBande === BANDE_SOUS_LE_MUR ? murCases : 0);
}

/**
 * Jusqu'où un CANEVAS a le droit de décaler sa vue quand il cadre cette bande.
 *
 * ⚠⚠ C'EST `bornesDeDefilement` COMPOSÉE AVEC LE BORD DU CONTENU, et les deux
 * bornes sont nécessaires. La première dit où la BANDE permet d'aller — c'est
 * elle qui empêche de franchir une frontière, exactement comme sur l'écran de
 * la base. La seconde dit où le CONTENU s'arrête : sur un canevas, la vue est
 * souvent PLUS HAUTE que la bande — au plancher de zoom, treize rangées tiennent
 * dans le cadre pour une bande qui en fait huit —, et s'en tenir à la première
 * laisserait trois cents pixels de noir sous la dernière rangée.
 *
 * ⚠ ELLE NE REMPLACE PAS `bornesDeDefilement`, ELLE L'APPELLE. Refaire le
 * calcul des lignes d'écran ici aurait donné deux réponses à « où commence la
 * défense », et la divergence se lirait comme une bascule qui s'arrête au
 * mauvais endroit — la faute que la demi-case de `padding` a déjà coûtée une
 * fois à l'écran de la base.
 *
 * @param {string|null} cleBande clé de bande, ou `null` pour la vue d'ensemble
 * @param {number} coteCase côté d'une case, en pixels
 * @param {number} hauteurVue hauteur visible, en pixels
 * @param {number} [murCases] ce que le mur peint occupe, en cases
 * @returns {{min: number, max: number}} bornes du décalage vertical, en pixels
 */
export function bornesDuDecalage(cleBande, coteCase, hauteurVue, murCases = 0) {
  if (!(coteCase > 0)) {
    throw new RangeError(`bandes : côté de case « ${coteCase} » invalide`);
  }
  const padding = murCases * coteCase;
  // Le contenu va du haut du mur au bas de la rangée 1 : la demi-case du mur,
  // puis les dix-huit rangées. Rien en dessous — le U s'ouvre sur le bas.
  const contenu = padding + GRILLE.longueur * coteCase;
  const plafond = Math.max(0, contenu - hauteurVue);
  if (cleBande === null) return { min: 0, max: plafond };
  const bornes = bornesDeDefilement(cleBande, coteCase, hauteurVue, padding);
  return { min: Math.min(bornes.min, plafond), max: Math.min(bornes.max, plafond) };
}

/**
 * Jusqu'où un canevas a le droit de décaler sa vue HORIZONTALEMENT.
 *
 * ⚠ ELLE N'A PAS D'ÉQUIVALENT SUR L'ÉCRAN DE LA BASE, qui laisse le navigateur
 * borner son propre défilement. Un canevas n'a pas de conteneur qui défile :
 * ce qu'on ne borne pas ici, personne ne le borne.
 *
 * ⚠ ET LA BOÎTE FAIT `LARGEUR_EN_CASES`, mur peint compris — c'est la largeur
 * que le décor occupe, donc celle qu'on peut atteindre en promenant le doigt.
 *
 * @param {number} coteCase côté d'une case, en pixels
 * @param {number} largeurVue largeur visible, en pixels
 * @param {number} [murCases] ce que le mur peint occupe, en cases
 * @returns {{min: number, max: number}} bornes du décalage horizontal, en pixels
 */
export function bornesDuDecalageX(coteCase, largeurVue, murCases = 0) {
  if (!(coteCase > 0)) {
    throw new RangeError(`bandes : côté de case « ${coteCase} » invalide`);
  }
  const contenu = (GRILLE.largeur + 2 * murCases) * coteCase;
  return { min: 0, max: Math.max(0, contenu - largeurVue) };
}
