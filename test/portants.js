// ---------------------------------------------------------------------------
// `portants` — d'un NOM de module vers les PIÈCES qui le portent
// ---------------------------------------------------------------------------
//
// ⚠⚠ POURQUOI CE FICHIER EXISTE — ETHAN, 17/09, DÉFAUT N° 2 DE L'AUDIT :
// « par pièce ». Jusqu'à ce lot, `montage.modulesDebloques[qui][branche] `
// portait des NOMS de modules, et `moduleActif` se contentait de vérifier que la
// pièce portait ce nom-là. C'était une fuite dans les deux camps, mesurée :
//
//   — OUVRAGE : `data/combat.js` déclare TREIZE seuils d'`apparitionModule`, le
//     déblocage par nom n'en lisait que CINQ, le plus bas de chaque module. Un
//     Créneau tirait à +20 % dès le niveau 30 quand sa donnée dit 38.
//   — JOUEUR : SIX pièces portent `autoReparation`, de 1,2 M (Merlon) à 450 M
//     (Batterie). Acheter la moins chère les armait toutes les six.
//
// Les listes portent donc des IDENTIFIANTS DE PIÈCES depuis ce lot.
//
// ⚠⚠ ET CE HELPER N'EST PAS UN CONTOURNEMENT DU CORRECTIF — C'EST LA TRADUCTION
// FIDÈLE DE CE QUE LES ANCIENS MONTAGES DISAIENT. Un montage qui écrivait
// `defense: ['ecraseur']` armait, de fait, TOUTES les porteuses de l'Écraseur :
// c'est exactement ce que `portants` rend. Les nombres mesurés par ces
// montages-là ne bougent donc pas d'un millième, et c'est la preuve que le
// correctif ne change QUE ce qu'il devait changer.
//
// ⚠⚠ UN MONTAGE QUI MESURE LA BARRIÈRE ELLE-MÊME N'UTILISE PAS CE HELPER : il
// écrit ses identifiants en clair, sans quoi il ne mesurerait plus rien. Voir
// `MODULES-F T17` et `MODULES-F T18` dans `test/recherche.test.js`.
//
// ⚠⚠ ET IL NE RECOPIE PLUS RIEN DEPUIS LE 18/09 : IL DÉLÈGUE. La traduction
// « un nom → ses porteuses » est entrée en PRODUCTION avec la migration
// v35 → v36, qui doit relire les listes de l'ancien format rangées dans les
// rapports de raid déjà sauvegardés. Ce fichier avait sa propre copie du
// routage des trois champs de module ; deux lectures de la même règle est
// exactement la faute que ce dépôt refuse, et c'est la production qui fait foi.

import { piecesPortant } from '../src/sim/recherche.js';

/**
 * Toutes les pièces qui portent l'un de ces modules — triées, sans doublon.
 *
 * @param {'joueur'|'ouvrage'} qui
 * @param {'offense'|'defense'} branche
 * @param {...string} noms
 * @returns {string[]} identifiants de pièces
 */
export function portants(qui, branche, ...noms) {
  if (qui !== 'joueur' && qui !== 'ouvrage') {
    throw new Error(`portants : propriétaire « ${qui} » inconnu`);
  }
  if (branche !== 'offense' && branche !== 'defense') {
    throw new Error(`portants : branche « ${branche} » inconnue`);
  }
  // ⚠ AUCUN NOM REND UNE LISTE VIDE, et ce n'est pas la même chose qu'un nom
  // inconnu : « ce montage n'arme rien » est la moitié de toute contre-épreuve.
  if (noms.length === 0) return [];
  const pieces = new Set();
  for (const nom of noms) {
    const porteuses = piecesPortant(qui, branche, nom);
    // ⚠ UN NOM QUI NE PORTE RIEN LÈVE, il ne rend pas une liste vide : un montage
    // qui arme un module inexistant — nom mal orthographié, module retiré de la
    // donnée — mesurerait l'absence du module en croyant mesurer sa présence, et
    // passerait en silence. C'est la faute que ce fichier existe pour empêcher.
    if (porteuses.length === 0) {
      throw new Error(`portants : aucune pièce ne porte « ${nom} » pour ${qui}/${branche}`);
    }
    for (const id of porteuses) pieces.add(id);
  }
  return [...pieces].sort();
}
