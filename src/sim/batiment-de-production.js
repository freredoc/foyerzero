// LE BÂTIMENT DE PRODUCTION D'UNE PIÈCE — lot RAID-ET-ÉCRAN, 10/09/2026.
//
// ⚠⚠ CE MODULE EXISTE POUR UNE CONTRAINTE D'IMPORTS, ET LES PRÉCÉDENTS SONT
// `base-courante.js` ET `saveur.js`. `batimentDeProductionManquant` vivait dans
// `sim/state.js` ; le point 4 du 10/09 — « j'ai supprimé un aérodrome, mon
// Épervier peut quand même partir en raid » — demande à `problemesDuRaid` de
// `sim/raid.js` de la lire. Or `state.js` importe DÉJÀ `creerRecherche` de
// `raid.js` : l'importer en retour aurait fait le PREMIER cycle de `src/sim/`
// — mesuré avant d'écrire, le dossier n'en porte aucun, et ce n'est pas un
// accident.
//
// ⚠ C'EST UN DÉPLACEMENT, PAS UNE ÉCRITURE. Pas une ligne du corps n'a changé en
// route, et `sim/state.js` la RÉ-EXPORTE : aucun de ses appelants — les deux
// palettes, l'écran de réparation, le tutoriel, six fichiers de test — n'a eu à
// changer d'import.
//
// ⚠⚠ ET LE RÉ-EXPORT DE `state.js` EST UN `import` PUIS UN `export`, JAMAIS UN
// `export … from` SEUL. `state.js` LIT cette fonction pour son propre
// `problemeDuBatimentDeProduction` ; un `export … from` ne crée aucune liaison
// locale, et le module lèverait au premier geste de pose. C'est la leçon payée
// au lot MURS-OUVRAGE, et elle vaut ici mot pour mot.
//
// ⚠ IL N'IMPORTE QUE `base-courante.js` ET DEUX TABLES. Un module de bas niveau
// qui remonterait vers un moteur rouvrirait exactement la porte qu'on ferme.

import { baseCourante } from './base-courante.js';
import { UNITES } from '../data/combat.js';
import { BATIMENT_DE_CHASSIS } from '../data/base.js';

/**
 * Quel bâtiment de production manque à cette pièce, ou `null`.
 *
 * ⚠ LES OUVRAGES FIXES NE SONT PAS CONCERNÉS, et c'est cette fonction qui le
 * dit, pas un test écrit ailleurs. Merlon, ronce, herse, casemate, créneau,
 * batterie, faucheuse, mortier et harpon ne sont pas dans `UNITES`, n'ont pas de
 * châssis, et elle rend `null` pour eux : un mur n'a jamais eu besoin d'une
 * caserne.
 *
 * ⚠⚠ ELLE RÉPOND POUR N'IMPORTE QUELLE PIÈCE, SANS SAVOIR POUR QUELLE FORCE ON
 * DEMANDE. C'est voulu : elle dit un FAIT — « le bâtiment de ce châssis n'est
 * pas posé » —, jamais une permission. Qui doit s'en soucier est écrit dans
 * `FORCES`, sous `exigeLeBatimentDeProduction`.
 *
 * ⚠ UN CHÂSSIS ABSENT DE `BATIMENT_DE_CHASSIS` LÈVE, il ne rend pas `null` : une
 * quinzième unité ajoutée au roster sans sa ligne partirait sinon en raid sans
 * qu'aucun bâtiment ne la conditionne, et rien ne le dirait.
 *
 * @param {object} etat
 * @param {string} uniteId clé de `UNITES`, ou d'un ouvrage fixe de la défense
 * @returns {string|null} clé du bâtiment manquant dans `BASE_BATIMENTS`
 */
export function batimentDeProductionManquant(etat, uniteId) {
  const base = baseCourante(etat);
  if (base.disposition === undefined) {
    throw new Error('etat : champ « disposition » absent');
  }
  const unite = UNITES[uniteId];
  if (unite === undefined) return null;
  const requis = BATIMENT_DE_CHASSIS[unite.chassis];
  if (requis === undefined) {
    throw new Error(`etat : châssis « ${unite.chassis} » sans bâtiment de production`);
  }
  return base.disposition.some((b) => b.id === requis) ? null : requis;
}
