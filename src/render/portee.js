// Quelles cases une pièce de défense couvre — la portée du COMBAT, dessinée.
//
// ⚠⚠ CE MODULE NE DÉCIDE D'AUCUN NOMBRE, IL DEMANDE. Ethan, 07/09, point 3 :
// « Afficher le rayon d'attaque. » La fiche donne déjà le chiffre — « Portée :
// 2,5 cases » — et il manquait le dessin sur le terrain. Le dessin doit montrer
// EXACTEMENT ce que le moteur atteint, sinon il apprend au joueur une géométrie
// qui n'est pas celle du raid.
//
// ⚠⚠ ET UNE PORTÉE DE 2,5 N'EST PAS UN CERCLE DE 2,5 CASES. Le moteur compare
// des CARRÉS de milli-cases : `distanceCarreeMilli(...) <= porteeCarree` et
// `>= porteeMiniCarree`, avec les positions posées par `milliDepuisCase` sur le
// centre de leur case. Un disque tracé au rayon 2,5 couvrirait des morceaux de
// cases hors de portée et laisserait dehors des morceaux de cases à portée :
// ce qu'on rend est donc l'ENSEMBLE DES CASES, et il se dérive des deux mêmes
// fonctions que le combat — jamais d'un `Math.hypot` réécrit ici.
//
// ⚠ LA PORTÉE MINIMALE EXISTE, ET ELLE FAIT UN TROU. Les trois artilleries
// portent `porteeMini: 3.5` : un disque plein mentirait sur ce qu'elles
// couvrent, et le joueur poserait une Faucheuse au contact de ce qu'elle ne peut
// pas toucher. Le trou est donc rendu, par la même comparaison que le moteur.

import {
  distanceCarreeMilli, milliDepuisCase, estDansLaGrille, enEntier, MILLI_PAR_CASE,
} from '../sim/grille.js';
import { COLONNES_DEGATS } from '../data/combat.js';

/**
 * Ce qu'une ligne de roster dit de sa portée — `null` si la pièce ne tire pas.
 *
 * ⚠⚠ LES TROIS CONDITIONS SONT CELLES DE `peutTirer` DU MOTEUR, dans le même
 * ordre : pas de table de dégâts, portée nulle, ou table entièrement à zéro. Un
 * Mur de défense a `degats: null` et `portee: 0` ; une Ronce a une portée de 1
 * et aucune table — elle FRANCHIT, elle ne tire pas. Dessiner un rayon autour
 * d'elles annoncerait un tir qui n'aura jamais lieu.
 *
 * ⚠ ELLE PREND LA LIGNE, PAS L'IDENTIFIANT. Les pièces de garnison viennent de
 * DEUX tables — `DEFENSES` et `UNITES` — et c'est l'appelant qui sait laquelle,
 * comme `apercuDeLaPiece` le fait déjà. Réimporter les deux ici mettrait dans ce
 * module une seconde façon de résoudre un identifiant.
 *
 * @param {object} ligne une entrée de `DEFENSES` ou d'`UNITES`
 * @returns {{portee: number, porteeMini: number}|null}
 */
export function porteeQuiTire(ligne) {
  if (ligne === undefined || ligne === null) return null;
  if (!(ligne.portee > 0)) return null;
  const degats = ligne.degats;
  if (degats === null || degats === undefined) return null;
  if (!COLONNES_DEGATS.some((colonne) => (degats[colonne] ?? 0) > 0)) return null;
  return { portee: ligne.portee, porteeMini: ligne.porteeMini ?? 0 };
}

/**
 * Les cases de la grille qu'une pièce posée en (rangee, colonne) atteint.
 *
 * ⚠ LE BALAYAGE EST BORNÉ PAR LA PORTÉE, PAS PAR LA GRILLE ENTIÈRE. Une portée
 * de 5,5 tient dans un carré de onze cases de côté ; parcourir les 162 cases
 * rendrait le même ensemble pour six fois le travail, et cette fonction est
 * appelée à chaque sélection.
 *
 * ⚠ ET LA COMPARAISON EST CELLE DU MOTEUR, AU CARRÉ DES DEUX CÔTÉS. `portee`
 * est un décimal — 2,5 — donc `porteeMilli` vaut 2500 et le carré 6 250 000 :
 * en entiers, exact. Comparer des racines carrées flottantes ferait tomber ou
 * entrer une case au hasard des arrondis.
 *
 * ⚠⚠ ET LA CONVERSION EN MILLI-CASES EST CELLE DU MOTEUR, TROUVÉE À LA
 * RELECTURE HOSTILE DU §10. La première écriture faisait `Math.round(portee ×
 * 1000)` : c'était la SECONDE fois que le dépôt convertissait cette
 * grandeur-là — `creerCombat` la convertit déjà par `enEntier`, et le millier
 * était une seconde écriture de `MILLI_PAR_CASE`. Les deux ne rendent pas la
 * même chose : `Math.round` ACCEPTE une portée de 2,5001 et l'arrondit en
 * silence, quand `enEntier` LÈVE en nommant la table fautive. Le dessin aurait
 * donc pu montrer un rayon qu'aucun tir n'atteint, sans que rien ne le dise.
 *
 * @param {{rangee: number, colonne: number}} depuis
 * @param {{portee: number, porteeMini: number}} portees
 * @returns {{rangee: number, colonne: number}[]}
 */
export function casesAPortee(depuis, portees) {
  const porteeMilli = enEntier(portees.portee, MILLI_PAR_CASE, 'portee.portee');
  const miniMilli = enEntier(portees.porteeMini ?? 0, MILLI_PAR_CASE, 'portee.porteeMini');
  const porteeCarree = porteeMilli * porteeMilli;
  const miniCarree = miniMilli * miniMilli;
  const rayon = Math.ceil(portees.portee);
  const cases = [];
  for (let r = depuis.rangee - rayon; r <= depuis.rangee + rayon; r += 1) {
    for (let c = depuis.colonne - rayon; c <= depuis.colonne + rayon; c += 1) {
      if (!estDansLaGrille(r, c)) continue;
      const d2 = distanceCarreeMilli(
        milliDepuisCase(depuis.rangee), milliDepuisCase(depuis.colonne),
        milliDepuisCase(r), milliDepuisCase(c),
      );
      if (d2 > porteeCarree || d2 < miniCarree) continue;
      cases.push({ rangee: r, colonne: c });
    }
  }
  return cases;
}
