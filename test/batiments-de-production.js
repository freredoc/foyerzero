// Les trois bâtiments de production, posés sur une base de montage.
//
// ⚠⚠ CE FICHIER EXISTE À CAUSE DU LOT PRODUCTION-EN-DÉFENSE, 07/09/2026. La
// règle « infanterie inconstructible sans caserne » vivait dans les deux
// PALETTES ; elle est descendue dans `sim/state.js`, où elle garde les trois
// chemins de geste — poser, déplacer, permuter. Conséquence mécanique : tout
// montage de test qui pose une UNITÉ doit désormais porter le bâtiment de son
// châssis, exactement comme il porte déjà un bâtiment de commandement pour avoir
// un budget. Sans lui, le refus viendrait d'ailleurs et le test ne prouverait
// plus ce qu'il annonce.
//
// ⚠ UN SEUL FICHIER, PAS SIX COPIES. Six fichiers de test en avaient besoin le
// même jour ; six recopies auraient divergé au premier déplacement d'un
// bâtiment. C'est la même discipline que `test/temoins-*.js`.
//
// ⚠ LES OUVRAGES FIXES N'EN ONT JAMAIS BESOIN. Merlon, ronce, herse, casemate,
// créneau, batterie, faucheuse, mortier et harpon ne sont pas dans `UNITES` :
// un montage qui n'en pose que ceux-là n'appelle pas cette fonction.

import { baseCourante } from '../src/sim/base-courante.js';
import { BATIMENT_DE_CHASSIS } from '../src/data/base.js';

/**
 * Le niveau minimal de Chantier qui ouvre assez d'emplacements pour six
 * bâtiments. Au niveau 1 il en ouvre DEUX et en prend un ; au niveau 5, dix.
 * C'est le nombre que `etatAvecCommandement` de `state.test.js` employait déjà.
 */
const NIVEAU_CHANTIER_MINIMAL = 5;

/**
 * Pose la Caserne, le Dépôt de véhicules et l'Aérodrome sur la base courante.
 *
 * ⚠ RANGÉE 13, COLONNES 1, 4 ET 7 PAR DÉFAUT, ET CE N'EST PAS ARBITRAIRE. Les
 * trois sont `unique: true` : la règle « uniques-voisins » du 28/08 leur interdit
 * de se toucher, et interdit aussi de toucher les deux QG que les montages
 * posent en rangée 11 ou le Chantier de (18, 5). Deux cases d'écart partout.
 * Un montage qui occupe déjà ces cases passe les siennes.
 *
 * ⚠ ELLE ÉCRIT DANS `disposition` À LA MAIN, ELLE N'APPELLE PAS `poser`. Un
 * montage ne doit pas dépendre du stock de départ ni du barème de construction :
 * ce qu'il mesure est ailleurs. C'est déjà ce que faisait `etatAvecCommandement`
 * pour les deux bâtiments de commandement.
 *
 * ⚠ IDEMPOTENTE. Un bâtiment déjà posé n'est pas doublé — deux exemplaires d'un
 * `unique: true` rendraient la disposition illégale au chargement.
 *
 * @param {object} etat modifié en place
 * @param {{rangee?: number, colonnes?: number[]}} [ou] où les poser
 * @returns {object} le même état
 */
export function poserLesBatimentsDeProduction(etat, ou = {}) {
  const { rangee = 13, colonnes = [1, 4, 7] } = ou;
  const base = baseCourante(etat);
  if (base.disposition[0].niveau < NIVEAU_CHANTIER_MINIMAL) {
    base.disposition[0].niveau = NIVEAU_CHANTIER_MINIMAL;
  }
  // ⚠ LA LISTE SE LIT DANS `BATIMENT_DE_CHASSIS`, ELLE NE SE RECOPIE PAS. Un
  // quatrième châssis ajouté un jour à la table serait servi sans qu'on y pense ;
  // trois identifiants écrits ici l'auraient manqué en silence.
  Object.values(BATIMENT_DE_CHASSIS).forEach((id, i) => {
    if (base.disposition.some((b) => b.id === id)) return;
    base.disposition.push({
      id, rangee, colonne: colonnes[i], niveau: 1, degatsMilli: 0,
    });
  });
  // Les résidus d'économie sont indexés par bâtiment : la liste doit suivre.
  while (base.economie.residus.length < base.disposition.length) {
    base.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  }
  return etat;
}
