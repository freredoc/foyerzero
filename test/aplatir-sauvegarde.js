// L'inverse de la migration 22 → 23, pour les montages de test.
//
// ⚠⚠ CE FICHIER N'EST PAS UN TEST, ET IL EST NOMMÉ DANS LA LISTE BLANCHE de
// `documentation.test.js`, comme `png-rgba.js` et `prereglages-lot3a.js`. Il y
// entre pour la même raison que le décodeur PNG : HUIT fichiers de test en ont
// eu besoin le même jour, et le dupliquer aurait donné huit inverses voisins
// dont un seul serait éprouvé.
//
// ⚠⚠ CE QU'IL SERT : un test qui fabrique une sauvegarde d'ANCIENNE VERSION
// part d'une sérialisation d'aujourd'hui et rabaisse `version`. Depuis le lot
// BASES-0 cela ne suffit plus — une v4 n'a jamais porté `bases`, et lui en
// donner un ferait tourner la chaîne de migrations sur une forme qui n'a jamais
// existé. Les dix montages concernés APLATISSENT donc avant de rabaisser, ce
// qui a un effet de bord précieux : la chaîne complète, v0 → v23, traverse
// vraiment le maillon du dépliage au lieu de le contourner.
//
// ⚠ IL LIT `CHAMPS_DE_BASE`, il ne recopie pas la liste. Une liste écrite à la
// main ici cesserait d'être juste au premier champ qu'une base gagnerait, et
// c'est le genre de divergence qui ne se voit qu'au chargement.

import { CHAMPS_DE_BASE } from '../src/sim/state.js';

/**
 * Remonte les champs de `bases[0]` à la racine et retire l'enveloppe.
 *
 * ⚠ ELLE LÈVE SI LA SAUVEGARDE NE PORTE PAS D'ENVELOPPE. Aplatir deux fois, ou
 * aplatir une sauvegarde déjà plate, veut dire que le montage s'est trompé de
 * version : mieux vaut le dire que rendre l'objet inchangé et laisser le test
 * passer pour la mauvaise raison.
 *
 * @param {object} sauvegarde objet déjà parsé, modifié en place
 * @returns {object} la même sauvegarde, à plat
 */
export function aplatirSauvegarde(sauvegarde) {
  if (!Array.isArray(sauvegarde.bases) || sauvegarde.bases.length !== 1) {
    throw new Error(
      'aplatirSauvegarde : une sauvegarde à UNE base est attendue — '
      + `reçu ${JSON.stringify(sauvegarde.bases)}`,
    );
  }
  const [base] = sauvegarde.bases;
  for (const champ of CHAMPS_DE_BASE) {
    if (base[champ] !== undefined) sauvegarde[champ] = base[champ];
  }
  delete sauvegarde.bases;
  delete sauvegarde.baseCourante;
  return sauvegarde;
}
