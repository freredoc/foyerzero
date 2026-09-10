// L'ARRIVÉE D'UNE UNITÉ D'ASSAUT — le fantôme qui monte, lot SON-ET-ARRIVÉE.
//
// Ethan, 10/09 : « Lors des raids faire apparaître les unités une case en
// dessous fantôme pour qu'on voit les véhicules arrivés pour pas qu'ils
// apparaissent directement sur la bande du bas. »
//
// ⚠⚠ MODULE PUR, ET IL NE TOUCHE PAS `src/sim/`. C'est la contrainte qui prime
// sur tout : l'invariant du dépôt veut que `tickJeu × N` et `rattraperJeu(N)`
// rendent le même état à l'octet, et les deux cents témoins de combat comme les
// huit raids de référence en dépendent. Un fantôme est une affaire de DESSIN —
// il n'a aucune raison de traverser le moteur, et l'y faire passer coûterait une
// recapture de témoins que `CLAUDE.md` n'autorise qu'une fois par siècle.
//
// ⚠⚠ ET LE CROCHET EXISTAIT DÉJÀ, ÉCRIT DANS `interpolation.js` : « Une entité
// d'indice ≥ `instantane.length` est née après la prise : elle se dessine sans
// interpolation, à sa position courante. » C'est très exactement ce qu'Ethan
// voit — l'unité APPARAÎT, elle n'arrive pas. Mesuré sur l'arbre intact avant
// d'écrire une ligne : sur un montage à une vague, le sprite de l'attaquant est
// posé à `y = 594`, c'est-à-dire EXACTEMENT `yDeRangeeMilli` de sa case, sans le
// moindre décalage.
//
// ⚠⚠ LE DÉCALAGE EST RENDU EN MILLI-CASES ET S'APPLIQUE EN PIXELS, JAMAIS EN
// BAISSANT `rangeeMilli` — ET C'EST UNE MESURE, PAS UN GOÛT. `yDeRangeeMilli` de
// `render/projection.js` BORNE sa sortie à la grille : son plancher est
// `margeY + (GRILLE.longueur − 1) × tailleCase`, c'est-à-dire le bord haut de la
// rangée 1. Mesuré sur la projection du raid : `yDeRangeeMilli(p, 0)` et
// `yDeRangeeMilli(p, 1000)` rendent le MÊME nombre, 630. Une entité qu'on
// ferait descendre d'une case en lui donnant `rangeeMilli − 1000` serait donc
// écrasée sur sa propre case, et le fantôme n'existerait pas. Le décalage est
// une grandeur de DESSIN, il s'ajoute après la projection.

import { GRILLE } from '../data/combat.js';
import { MILLI_PAR_CASE } from '../sim/grille.js';

/**
 * La durée de la montée, en millisecondes de temps RÉEL.
 *
 * ⚠ 400 ms SE CALCULE, ET LE CALCUL EST CELUI-CI : quatre ticks à 10 Hz, soit
 * un dixième de l'intervalle entre deux vagues (`GRILLE.intervalleVagueSec`
 * vaut 5 s). Assez long pour être vu, trop court pour retarder le combat — et
 * une vague entière est arrivée bien avant que la suivante ne paraisse.
 *
 * ⚠ EN TEMPS RÉEL, PAS EN TICKS, et c'est ce qui la rend juste aux trois
 * vitesses du simulateur. Comptée en ticks, elle durerait quatre fois moins
 * longtemps à ×4, c'est-à-dire cent millisecondes : le fantôme deviendrait un
 * clignotement.
 */
export const ARRIVEE_MS = 400;

/**
 * L'opacité de départ du fantôme, en millièmes.
 *
 * ⚠ EN MILLIÈMES ET EN ENTIERS — le dépôt ne fait pas de flottant dans le rendu,
 * pour la raison qui vaut partout ailleurs : deux exécutions doivent rendre la
 * même liste d'affichage au nombre près, et un flottant accumulé ne le garantit
 * pas. Même unité que `alphaMilli` de `render/interpolation.js`.
 */
export const OPACITE_ARRIVEE = 350;

/** L'opacité pleine, en millièmes — la valeur que porte tout autre sprite. */
export const OPACITE_PLEINE = 1000;

/**
 * L'état d'affichage des arrivées. Il ne va NULLE PART : il vit dans la
 * fermeture de l'écran de raid et meurt avec le déroulé, comme `mesure` et
 * comme l'ensemble des tombées de l'effondrement. Pas un champ n'entre dans la
 * sauvegarde, et `SAVE_VERSION` ne bouge pas.
 *
 * ⚠ `vus` EST UNE MARQUE HAUTE SUR L'INDICE, PAS UN COMPTE D'ENTITÉS VIVANTES.
 * Les indices sont STABLES et le tableau ne rétrécit jamais — une entité morte
 * y reste avec `vivant: false` (lot 2A) —, donc « née depuis le dernier
 * relevé » se lit exactement « indice ≥ vus ». C'est le même fait sur lequel
 * `positionAffichee` s'appuie déjà pour ne pas interpoler une entité neuve.
 *
 * @returns {{vus: number, depuis: Map<number, number>}}
 */
export function creerArrivees() {
  return { vus: 0, depuis: new Map() };
}

/**
 * Cette entité arrive-t-elle, ou est-elle simplement neuve ?
 *
 * ⚠⚠ LA CONDITION DE CAMP EST CELLE QUI TRAVAILLE. Une défenseuse n'arrive pas :
 * elle est là depuis le début du raid, et la faire monter du bas de l'écran
 * ferait descendre la garnison entière d'une case au premier tick. Mesuré sur
 * douze graines, quatre vagues chacune : **372 naissances de défenseurs contre
 * 60 d'attaquants**, donc c'est le gros du filtre.
 *
 * ⚠⚠ ET LA CONDITION DE RANGÉE EST UNE CEINTURE, VACUEUSE AUJOURD'HUI — MESURÉ,
 * ET IL FAUT LE DIRE DANS CE SENS-LÀ. Le brief la demande pour écarter les
 * passagères ; mesuré sur les mêmes douze graines, **zéro attaquant sur 60 naît
 * hors de la bande de déploiement** — les 60 naissent aux rangées 1 et 2. Une
 * passagère n'échappe donc PAS à ce filtre : `sim/combat.js` la crée AVEC son
 * porteur, dans la bande, et ce qu'il ne journalise qu'au débarquement est
 * l'événement SONORE, pas l'entité. Retirer cette ligne ne fait tomber aucun
 * test, et c'est déclaré plutôt que compté comme une garde.
 *
 * ⚠ ELLE RESTE PARCE QU'ELLE EST LA SEULE À TENIR LE JOUR OÙ UN ATTAQUANT
 * NAÎTRAIT AILLEURS — un renfort, un largage, une pièce créée en cours de
 * combat. `ajouterEntite` ne l'interdit pas ; ce qui l'empêche aujourd'hui est
 * que personne ne l'appelle hors de l'apparition de vague.
 *
 * ⚠⚠ CE QUI ÉCARTE VRAIMENT LA PASSAGÈRE AU DÉBARQUEMENT, C'EST L'EXPIRATION DU
 * STAMP, ET ELLE EST MESURÉE SUR UN MONTAGE. Un Éclaireur portant une Meute
 * débarque au **tick 75**, soit 7 500 ms de temps réel à ×1 et **1 875 ms à
 * ×4**, contre 400 ms de montée : marge **×4,69** au pire. La borne THÉORIQUE
 * est plus serrée et tient aussi — neuf cases au moins (rangée 2 → rangée 11) à
 * 240 milli-cases par tick pour la plus rapide, donc 37,5 ticks, soit 940 ms à
 * ×4 : marge ×2,35.
 *
 * ⚠ ET LA PASSAGÈRE N'EST PAS EXCLUE À SA NAISSANCE, DÉLIBÉRÉMENT. `visible` de
 * `render/scene.js` vaut `e.vivant && !e.sorti` — il ne regarde PAS `embarquee`,
 * contrairement à `estActive` du moteur —, donc une passagère EST dessinée, à la
 * case de son porteur. La stamper comme lui est la seule façon qu'ils montent
 * ENSEMBLE : l'exclure ferait apparaître la passagère à pleine opacité sur la
 * case d'arrivée pendant que son porteur, une case plus bas, monte encore.
 *
 * ⚠ LES DEUX SE VÉRIFIENT DANS `SB T5 bis` : le porteur et sa passagère rendent
 * la MÊME rampe à la naissance, et la passagère n'en a plus aucune au
 * débarquement.
 */
function arrive(e) {
  if (e.camp !== 'attaque') return false;
  const rangee = Math.floor(e.rangeeMilli / MILLI_PAR_CASE);
  const { premiere, derniere } = GRILLE.bandes.deploiement;
  return rangee >= premiere && rangee <= derniere;
}

/**
 * Note l'instant d'apparition de tout ce qui est né depuis le dernier relevé.
 *
 * ⚠⚠ L'INSTANT EST INJECTÉ, comme partout dans `render/` et dans `src/son/`.
 * Aucun module hors de `src/ui/session.js` n'a le droit de lire l'horloge —
 * garde §11 de `test/banc.test.js` —, et c'est aussi ce qui rend la rampe
 * éprouvable sous `node --test`, où il n'y a ni écran ni image.
 *
 * ⚠ ELLE MUTE, ET ELLE LE DIT DANS SON NOM. « Noter » est un geste ; la lecture
 * est `etatDeLArrivee`, qui ne touche à rien.
 *
 * @param {{vus: number, depuis: Map<number, number>}} arrivees modifié en place
 * @param {{entites: Array<object>}} etat l'état de combat, LU seulement
 * @param {number} maintenantMs l'instant, INJECTÉ
 */
export function noterLesArrivees(arrivees, etat, maintenantMs) {
  for (let i = arrivees.vus; i < etat.entites.length; i += 1) {
    const e = etat.entites[i];
    if (arrive(e)) arrivees.depuis.set(e.indice, maintenantMs);
  }
  arrivees.vus = etat.entites.length;
}

/**
 * Où en est l'arrivée de cette entité — ou `null` si elle n'arrive pas (ou
 * plus).
 *
 * `decalageMilli` va d'une case entière à ZÉRO, `opacite` de 350 ‰ à 1000 ‰, les
 * deux linéairement sur `ARRIVEE_MS`.
 *
 * ⚠⚠ LA RAMPE TOMBE EXACTEMENT SUR ZÉRO ET SUR MILLE À `ARRIVEE_MS`, ET C'EST
 * CE QUI COMPTE. Une rampe qui n'arriverait pas juste laisserait l'unité posée
 * un dixième de case sous sa case, à quatre-vingt-dix-neuf pour cent d'opacité —
 * POUR TOUJOURS, puisque plus rien ne la corrigerait ensuite. Les deux
 * expressions sont donc écrites en ENTIERS, avec la division en dernier : à
 * `ecoule = ARRIVEE_MS`, le numérateur du décalage est nul et celui de l'opacité
 * vaut exactement son dénominateur.
 *
 * ⚠ LE DÉCALAGE EST VERS LE BAS DE LA GRILLE, ET LE SENS DE LECTURE N'EST PAS
 * DEVINABLE. Sur cet écran la bande de déploiement — rangées 1 et 2 — est EN
 * BAS : l'attaquant MONTE vers les bâtiments, et `estSortiParLeHaut` du moteur
 * teste `rangeeMilli >= DERNIERE_RANGEE + 1`. « Une case en dessous » est donc
 * la rangée `r − 1`, hors grille, c'est-à-dire un `y` PLUS GRAND à l'écran.
 * L'appelant ajoute, il ne retranche pas.
 *
 * ⚠ UN INSTANT ANTÉRIEUR AU STAMP REND LE DÉPART, il ne lève pas et ne rend pas
 * un décalage plus grand qu'une case. Le pas-à-pas du simulateur peut dessiner
 * deux fois le même instant, et une horloge d'image n'est pas garantie
 * strictement croissante ; le fantôme doit rester dans sa case, pas sauter.
 *
 * @returns {{decalageMilli: number, opacite: number} | null}
 */
export function etatDeLArrivee(arrivees, indice, maintenantMs) {
  const depuis = arrivees.depuis.get(indice);
  if (depuis === undefined) return null;
  const ecoule = Math.min(Math.max(maintenantMs - depuis, 0), ARRIVEE_MS);
  if (maintenantMs - depuis > ARRIVEE_MS) return null;
  return {
    decalageMilli: Math.round((MILLI_PAR_CASE * (ARRIVEE_MS - ecoule)) / ARRIVEE_MS),
    opacite: OPACITE_ARRIVEE
      + Math.round(((OPACITE_PLEINE - OPACITE_ARRIVEE) * ecoule) / ARRIVEE_MS),
  };
}

/**
 * La table des arrivées EN COURS à cet instant, pour une image.
 *
 * ⚠⚠ C'EST L'IDIOME DE `tombeesALEcran`, ET C'EST POURQUOI `listeAffichage` NE
 * REÇOIT QU'UN PARAMÈTRE DE PLUS. L'effondrement passe déjà « un ENSEMBLE
 * d'indices, pas une copie de l'état » ; les arrivées passent une TABLE
 * d'indices, résolue par l'appelant. `render/scene.js` reste donc sans horloge —
 * il ne saurait pas quoi faire d'un instant, et lui en donner un aurait mis le
 * temps dans le module qui décrit une image.
 *
 * @returns {Map<number, {decalageMilli: number, opacite: number}>}
 */
export function arriveesALEcran(arrivees, maintenantMs) {
  const table = new Map();
  for (const indice of arrivees.depuis.keys()) {
    const etat = etatDeLArrivee(arrivees, indice, maintenantMs);
    if (etat !== null) table.set(indice, etat);
  }
  return table;
}
