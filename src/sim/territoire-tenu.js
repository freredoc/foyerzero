// CE QUE L'OUVRAGE TIENT — lot RÈGLES-DE-CARTE, 10/09/2026.
//
// Ethan, point 16 du 10/09 : « Je ne dois pas pouvoir poser ma base dans [le]
// territoire ouvrage ». La règle EXISTAIT déjà — à la FONDATION, sous le code
// `territoire-ennemi` — et manquait au DÉPLACEMENT, qui ne connaissait que
// `hors-carte`, `sur-place`, `trop-loin`, le voisinage des bases et `delai`.
//
// ⚠⚠ C'EST LE MÊME TROU QUE LE LOT VOISINAGE-ET-MENACE A FERMÉ POUR UNE AUTRE
// RÈGLE, DEUX JOURS PLUS TÔT, ET SON BRIEF L'ÉCRIVAIT MOT POUR MOT : « sans cet
// appel, la règle ne vaudrait RIEN ». On fondait loin, où la règle s'applique,
// puis on sautait dans le violet au geste suivant : le contournement était à un
// toucher.
//
// ⚠⚠ CE MODULE EXISTE POUR QU'IL N'Y AIT QU'UNE ÉCRITURE, ET C'EST TOUT SON
// OBJET — le modèle exact de `sim/voisinage-des-bases.js`. Recopier le bloc de
// `fondation.js` dans `deplacement.js` aurait mis au dépôt deux formulations du
// même refus, qui divergeraient au premier réglage de message : le joueur lirait
// deux phrases pour une seule règle selon le geste, et corriger l'une laisserait
// l'autre mentir.
//
// ⚠ LE MESSAGE EST CELUI DE LA FONDATION, MOT POUR MOT, et il dit vrai des deux
// côtés : ce qui est refusé n'est pas une distance, c'est une appartenance —
// la case est à eux.
//
// ⚠⚠ ET LA QUESTION SE POSE À LA CARTE, JAMAIS À LA PORTÉE. `campDeLaCase` rend
// ce que `territoireDeLaFenetre` PEINT — sommes de force des deux camps, ruines
// comprises, et le PLANCHER d'Ethan par-dessus. C'est la bascule que le lot
// CONQUÊTE-24H avait faite dans `fondation.js` en retirant sa boucle de 49
// cases, et elle vaut ici pour les mêmes trois raisons : les ruines comptent, la
// PROPRIÉTÉ n'est pas la PORTÉE, et une seconde écriture du territoire est la
// faute que ce dépôt a déjà retirée trois fois.

import { campDeLaCase, OUVRAGE } from './territoire.js';

/** Le code que les deux appelants remontent à l'écran. */
export const CODE_TERRITOIRE_ENNEMI = 'territoire-ennemi';

/**
 * Ce qui, du côté du TERRITOIRE, empêche de poser une base ici.
 *
 * ⚠ ELLE REND AU PLUS UN PROBLÈME, et une liste plutôt qu'un booléen : c'est la
 * convention de ses deux appelants, et « Cette case est tenue par l'Ouvrage »
 * est une phrase que l'écran affiche telle quelle.
 *
 * ⚠ SEUL `OUVRAGE` REFUSE. Une case `NEUTRE` est libre — personne ne la tient —
 * et c'est ce que la carte montre : le refus suit le violet, pas l'absence de
 * kaki.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {Array<{code: string, message: string}>} vide si rien
 */
export function problemesDuTerritoireTenu(etat, cible) {
  if (cible === null || typeof cible !== 'object'
    || !Number.isInteger(cible.rangee) || !Number.isInteger(cible.colonne)) {
    throw new TypeError('territoire tenu : la cible n\'est pas une case entière');
  }
  if (campDeLaCase(etat, cible.rangee, cible.colonne) !== OUVRAGE) return [];
  return [{
    code: CODE_TERRITOIRE_ENNEMI,
    message: 'Cette case est tenue par l\'Ouvrage.',
  }];
}
