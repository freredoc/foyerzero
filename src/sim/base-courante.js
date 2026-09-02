// L'accesseur de base courante — le seul endroit du dépôt qui sache où
// habitent les champs par-base.
//
// ⚠⚠ UN MODULE À LUI, SANS AUCUN IMPORT, ET C'EST DÉLIBÉRÉ. Huit modules de
// `sim/` en ont besoin, et les huit sont des DÉPENDANCES de `sim/state.js` :
// l'y définir aurait fait huit cycles d'import. Sans dépendance, ce fichier ne
// peut en créer aucun. `sim/state.js` le ré-exporte pour qui va le chercher là.
//
// ⚠ IL NE PORTE AUCUNE VALEUR DE CALIBRAGE et n'en portera jamais : c'est un
// accesseur, pas une table. CLAUDE.md §4 réserve `src/data/` aux valeurs.

/**
 * La base courante — l'accesseur unique, et le seul endroit qui sache où les
 * champs par-base habitent.
 *
 * ⚠⚠ UNE FONCTION, JAMAIS UN GETTER. Le raccourci séduisant de ce lot était de
 * laisser `etat.disposition` vivre comme un accesseur qui délègue à
 * `etat.bases[etat.baseCourante]` : les deux cent cinquante sites auraient
 * continué de marcher sans être touchés. C'est INTERDIT, et la raison est
 * mécanique et pas esthétique — `simulerRaid` fait `structuredClone(etat)`, et
 * `structuredClone` NE PRÉSERVE PAS LES GETTERS : il copie des valeurs. L'état
 * cloné perdrait le lien vers `bases[]` et se retrouverait avec des copies
 * plates, figées au moment du clone. Le simulateur cesserait silencieusement
 * d'être exact, et le test de non-fuite ne le verrait pas, l'état réel restant
 * intact. Le même raisonnement interdit `Object.defineProperty` et les `Proxy` :
 * l'état doit rester DES DONNÉES SIMPLES, parce que c'est ce que `serialiser` et
 * `structuredClone` supposent tous les deux.
 *
 * ⚠ ELLE LÈVE HORS BORNES, elle ne rend pas `undefined`. Un indice faux donne
 * sinon un `TypeError` sur `undefined.disposition`, trois appels plus loin, et
 * le message ne nomme plus rien.
 *
 * @param {Etat} etat
 * @returns {object} la base désignée par `etat.baseCourante`
 */
export function baseCourante(etat) {
  if (etat === null || typeof etat !== 'object' || !Array.isArray(etat.bases)) {
    throw new TypeError('baseCourante : état attendu, portant une liste `bases`');
  }
  const i = etat.baseCourante;
  if (!Number.isInteger(i) || i < 0 || i >= etat.bases.length) {
    throw new RangeError(
      `baseCourante : indice ${i} hors de 0…${etat.bases.length - 1} `
      + `(${etat.bases.length} base${etat.bases.length > 1 ? 's' : ''})`,
    );
  }
  return etat.bases[i];
}
