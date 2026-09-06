// Où se pose la tourelle sur la coque d'un blindé du joueur.
//
// ⚠⚠ TRANSCRIPTION À LA MAIN DE `art/sprites/ancres-blindes.json`, ET UN TEST LES
// CONFRONTE. Le JSON est produit par `tools/ancres-blindes.py`, qui MESURE le
// logement de tourelle sur l'image ; il ne peut pas entrer dans le livrable —
// `tools/build.js` n'inline que des images, et `render/scene.js` ne lit aucun
// fichier. La transcription est donc la seule voie, et une transcription qui ne
// se confronte pas à sa source est une copie qui vieillit. Le test compare les
// clés ET les valeurs SIGNÉES, dans les deux sens.
//
// ⚠⚠ DEUX RÉFÉRENTIELS COHABITENT ICI, ET LES CONFONDRE FAIT DEUX FOIS LA
// TAILLE DE LA CASE. Les trois premiers nombres sont MESURÉS sur le dessin, en
// pourcentage de la PIÈCE ; les trois derniers sont ceux que le rendu emploie,
// en pourcentage de la CASE. La pièce n'occupe pas la case entière —
// `recadrer` porte sa plus grande dimension à `emprise / 32` — donc prendre les
// premiers pour les seconds multiplie le carré de la tourelle par
// `32 / largeur_de_la_pièce`. Mesuré sur la v2 : le carré du Chasseur ferait
// **131,9 pixels de case sur 64**, deux fois la case, et celui de la Faucheuse
// 113,8.
//
//   diametre_pct   diamètre du logement, en % de la largeur de la pièce
//   x_pct, y_pct   décalage du centre du logement, en % de sa largeur / hauteur
//   cote_case_pct  le côté du carré de tourelle À DESSINER, en % de la case
//   dx_case_pct    décalage du centre de ce carré, en % de la case, vers la droite
//   dy_case_pct    décalage du centre de ce carré, en % de la case, vers le BAS
//   mesure         le logement a-t-il été trouvé sur l'image, ou estimé
//
// ⚠ `cote_case_pct` PORTE DÉJÀ L'ÉCHELLE ET LA MARGE DE ROTATION. Il vaut
// `largeur_de_la_pièce_dans_la_case × diametre_pct/100 × cote_pct_embase/100 ×
// echelle` : le rendu n'a donc rien à multiplier, et les deux nombres de la
// table des tourelles ci-dessous sont là pour dire D'OÙ il vient, pas pour être
// relus au dessin.
//
// ⚠⚠ ELLE REMPLACE `src/data/ancres-chassis.js`, QUI ÉTAIT PÉRIMÉ SANS QUE RIEN
// NE PUISSE LE DIRE. Ses dix valeurs avaient été mesurées au lot 8 sur les
// coques de la V1 ; celles-ci sont redessinées, et le logement n'est ni au même
// endroit ni de la même taille — le Percheron passe de 50,2 % à 28,5 % en
// attaque. Le test d'alors ne l'aurait jamais vu : il comparait la
// transcription à son JSON, c'est-à-dire la copie à sa source, jamais la source
// au dessin.
//
// ⚠ NEUF ENTRÉES, PAS DIX : `off_j_pilon_chassis_def` a disparu avec le sprite.
// L'Obusier n'entre jamais en garnison — `pilon.defense.present` vaut `false` —
// et `nomAvecPose` ne demande `_def` que pour cette force-là.
//
// ⚠⚠ `y_pct` N'EST PAS NÉGATIF PARTOUT, ET UN TEST QUI L'AFFIRMERAIT SERAIT
// FAUX. `off_j_fendeur_chassis` vaut +1,3 et `off_j_belier_chassis` +4,4 :
// la tourelle du Chasseur et celle du Pionnier sont SOUS le centre de leur
// coque. Le test compare les valeurs signées à la source, ce qui reste vrai quel
// que soit le signe — asserter « toutes négatives » inviterait à « corriger »
// une donnée juste.

/**
 * @typedef {{ cote_case_pct: number, diametre_pct: number, dx_case_pct: number,
 *            dy_case_pct: number, mesure: boolean, x_pct: number, y_pct: number }} Ancre
 * @type {Record<string, Ancre>}
 */
export const ANCRES_BLINDES = {
  off_j_belier_chassis: { cote_case_pct: 40.19, diametre_pct: 37.5, dx_case_pct: 0.12, dy_case_pct: 2.75, mesure: true, x_pct: 0.3, y_pct: 4.4 },
  off_j_belier_chassis_def: { cote_case_pct: 28.81, diametre_pct: 17.8, dx_case_pct: -2.56, dy_case_pct: -1.59, mesure: true, x_pct: -4.1, y_pct: -4.1 },
  off_j_broyeur_chassis: { cote_case_pct: 77.1, diametre_pct: 28.5, dx_case_pct: 0.0, dy_case_pct: -11.24, mesure: true, x_pct: 0.0, y_pct: -11.6 },
  off_j_broyeur_chassis_def: { cote_case_pct: 64.05, diametre_pct: 18.9, dx_case_pct: 1.84, dy_case_pct: -4.84, mesure: true, x_pct: 1.9, y_pct: -7.5 },
  off_j_fendeur_chassis: { cote_case_pct: 84.92, diametre_pct: 35.4, dx_case_pct: -0.08, dy_case_pct: 0.81, mesure: true, x_pct: -0.2, y_pct: 1.3 },
  off_j_fendeur_chassis_def: { cote_case_pct: 83.35, diametre_pct: 22.9, dx_case_pct: -2.31, dy_case_pct: 0.47, mesure: true, x_pct: -3.7, y_pct: 1.2 },
  off_j_pilon_chassis: { cote_case_pct: 48.01, diametre_pct: 22.5, dx_case_pct: -0.09, dy_case_pct: -12.01, mesure: true, x_pct: -0.1, y_pct: -12.4 },
  off_j_ratisseur_chassis: { cote_case_pct: 42.44, diametre_pct: 31.4, dx_case_pct: -0.05, dy_case_pct: -6.81, mesure: true, x_pct: -0.1, y_pct: -10.9 },
  off_j_ratisseur_chassis_def: { cote_case_pct: 36.49, diametre_pct: 21.3, dx_case_pct: 0.31, dy_case_pct: -0.87, mesure: true, x_pct: 0.5, y_pct: -2.1 },
};

/**
 * D'où vient `cote_case_pct`. Voir `src/data/ancres-defense.js` pour le motif.
 *
 * ⚠ `echelle` vaut 2,2 pour les cinq, et non 1,6 comme aux défenses de contact :
 * l'emprise d'une coque vaut 20 ou 31 sur 32, pas 90 %, et son logement ne
 * représente que 18 à 38 % de la coque contre 45 % sur le socle carré. À 1,6
 * aucun canon ne se lit à 40 px ; à 2,8 le tambour déborde sur les chenilles.
 */
export const TOURELLES_BLINDES = {
  off_j_belier_tourelle: { cote_pct_embase: 117.7, echelle: 2.2 },
  off_j_broyeur_tourelle: { cote_pct_embase: 159.0, echelle: 2.2 },
  off_j_fendeur_tourelle: { cote_pct_embase: 264.7, echelle: 2.2 },
  off_j_pilon_tourelle: { cote_pct_embase: 109.0, echelle: 2.2 },
  off_j_ratisseur_tourelle: { cote_pct_embase: 124.6, echelle: 2.2 },
};
