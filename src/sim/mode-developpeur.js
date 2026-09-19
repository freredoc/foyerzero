// Le mode développeur — UN prédicat, et rien d'autre.
//
// ⚠⚠ IL EXISTE POUR UNE CONTRAINTE D'IMPORTS, ET LES PRÉCÉDENTS SONT
// `base-courante.js`, `saveur.js` ET `batiment-de-production.js`. Sept modules
// de `src/sim/` doivent poser la même question — `state.js`, `recherche.js`,
// `raid.js`, `reparation.js`, `transfert.js`, `deplacement.js` —, et trois
// d'entre eux s'importent déjà les uns les autres. Loger le prédicat dans
// `state.js` aurait fait remonter `deplacement.js` et `transfert.js` vers le
// moteur d'état, c'est-à-dire aurait ouvert un cycle mesuré inexistant avant
// d'écrire une ligne.
//
// ⚠ IL N'IMPORTE RIEN, ET C'EST LA MÊME DISCIPLINE QUE `base-courante.js`. Un
// module que tout le monde lit ne doit dépendre de personne, sinon la
// dépendance qu'il porte devient celle de tout `src/sim/`.
//
// ⚠⚠ LE DRAPEAU EST DANS `etat`, PAS DANS LE MAGASIN DE RÉGLAGES — arbitrage
// d'Ethan du 19/09/2026. Le son et le volume vivent dans `CLE_REGLAGES` parce
// qu'ils ne sont pas des faits de partie ; le mode développeur en EST un — il
// change ce qu'une partie a eu le droit de faire, et une sauvegarde exportée
// doit porter la marque. `SAVE_VERSION` passe donc à 38.
//
// ⚠⚠ ET C'EST UNE LEVÉE DE PÉAGE, JAMAIS UN CRÉDIT. Le mode ne verse aucune
// ressource et n'écrit RIEN dans l'état : il fait sauter le refus et le débit,
// au même endroit, dans le même appel. C'est ce qui rend l'extinction propre —
// il n'y a rien à défaire, parce qu'il n'y a rien eu à faire. Un mode qui
// remplirait les stocks serait irréversible, et « vérifier que le désactiver
// remet tout proprement » n'aurait pas de réponse.

/**
 * La partie tourne-t-elle en mode développeur ?
 *
 * ⚠ ELLE TOLÈRE L'ABSENCE DU CHAMP, et ce n'est pas une précaution de style :
 * les montages de test fabriquent des états à la main depuis des mois, et
 * `verifierEtat` n'exige pas ce champ-là — voir `HORS_EXIGENCE`. « Absent »
 * vaut « éteint », et c'est la seule lecture qui ne change rien à l'existant.
 *
 * ⚠ ELLE NE LÈVE JAMAIS, MÊME SUR `null`. Ses appelants sont des chemins de
 * refus et de débit : y faire lever une lecture de drapeau ferait tomber un
 * geste de jeu pour une raison qui n'est pas un fait de jeu.
 *
 * @param {object} etat
 * @returns {boolean}
 */
export function enModeDeveloppeur(etat) {
  return etat !== null && typeof etat === 'object' && etat.modeDeveloppeur === true;
}
