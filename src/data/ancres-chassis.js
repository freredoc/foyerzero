// Où se pose la tourelle sur la coque d'un blindé du joueur.
//
// ⚠⚠ TRANSCRIPTION À LA MAIN DE `art/sprites/ancres-chassis.json`, ET UN TEST
// LES CONFRONTE. Le JSON est produit par `tools/chassis.py`, qui MESURE le
// logement de tourelle sur chaque coque ; il ne peut pas entrer dans le
// livrable — `tools/build.js` n'inline que des images, et `render/scene.js` ne
// lit aucun fichier. La transcription est donc la seule voie, et une
// transcription qui ne se confronte pas à sa source est une copie qui vieillit
// (CLAUDE.md, la garde de palette). Le test compare les clés ET les valeurs
// SIGNÉES, dans les deux sens.
//
// ⚠ LES TROIS NOMBRES SONT DES POURCENTAGES DE LA COQUE, pas des pixels. C'est
// ce qui les rend valables aux trois grilles — 32, 64 et 128 — sans être
// recalculés : une coque de 64 px et la même en 128 posent leur tourelle au
// même endroit relatif.
//
//   diametre_pct  diamètre du logement, en % du côté de la coque
//   x_pct         décalage horizontal du CENTRE, en % du côté, vers la droite
//   y_pct         décalage vertical du CENTRE, en % du côté, vers le BAS
//
// ⚠⚠ `y_pct` EST NÉGATIF SUR NEUF ENTRÉES SUR DIX, PAS SUR LES DIX. La tourelle
// est presque toujours au-dessus du centre de la coque — mais
// `off_j_fendeur_chassis_def` fait exception à **+1,0**. Mesuré le 30/08, contre
// un brief qui annonçait les dix négatives. Un test qui asserterait « toutes
// négatives » serait donc FAUX, et pire, il inviterait à « corriger » une donnée
// juste. Le test compare les valeurs signées à la source, ce qui reste vrai
// quel que soit le signe.
//
// ⚠ `mesure` DIT SI LE LOGEMENT A ÉTÉ TROUVÉ SUR L'IMAGE ou estimé. Une seule
// entrée vaut `false` — `off_j_pilon_chassis` —, ce qui est le « 10 ancres dont
// 9 mesurées » qu'affiche `tools/chassis.py`. Le champ est transcrit tel quel :
// il ne change rien au dessin, et il dit à qui relit quelle valeur se méfier.

/**
 * @typedef {{ diametre_pct: number, mesure: boolean, x_pct: number, y_pct: number }} Ancre
 * @type {Record<string, Ancre>}
 */
export const ANCRES_CHASSIS = {
  off_j_belier_chassis: { diametre_pct: 29.2, mesure: true, x_pct: -0.6, y_pct: -8.1 },
  off_j_belier_chassis_def: { diametre_pct: 24.0, mesure: true, x_pct: 6.0, y_pct: -1.0 },
  off_j_broyeur_chassis: { diametre_pct: 50.2, mesure: true, x_pct: -0.1, y_pct: -6.9 },
  off_j_broyeur_chassis_def: { diametre_pct: 38.7, mesure: true, x_pct: -5.6, y_pct: -0.3 },
  off_j_fendeur_chassis: { diametre_pct: 18.5, mesure: true, x_pct: -1.3, y_pct: -15.1 },
  off_j_fendeur_chassis_def: { diametre_pct: 16.7, mesure: true, x_pct: -15.9, y_pct: 1.0 },
  off_j_pilon_chassis: { diametre_pct: 42.0, mesure: false, x_pct: -0.5, y_pct: -10.7 },
  off_j_pilon_chassis_def: { diametre_pct: 41.6, mesure: true, x_pct: -8.1, y_pct: -3.1 },
  off_j_ratisseur_chassis: { diametre_pct: 29.7, mesure: true, x_pct: -0.3, y_pct: -13.3 },
  off_j_ratisseur_chassis_def: { diametre_pct: 24.8, mesure: true, x_pct: -15.2, y_pct: -2.0 },
};
