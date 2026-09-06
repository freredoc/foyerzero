// Où se pose la tourelle sur le socle d'une défense du joueur.
//
// ⚠⚠ TRANSCRIPTION À LA MAIN DE `art/sprites/ancres-defense.json`, ET UN TEST LES
// CONFRONTE. Le JSON est produit par `tools/ancres-defense.py`, qui MESURE le
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
// ⚠⚠ LE CARRÉ DÉBORDE DE LA CASE SUR LES SIX SOCLES, ET C'EST MESURÉ, PAS SUBI.
// L'union du socle et du carré de sa tourelle vaut de 32,1 à 35,8 gros pixels
// sur 32 : la tourelle mord donc de 0,1 à 3,8 gros pixels sur la case voisine
// quand son canon pointe dans cette direction-là. Les neuf coques de blindé,
// elles, tiennent toutes. Deux arbitrages se croisent ici et le lot n'en défait
// aucun : l'emprise des socles est celle qu'Ethan a donnée — 90 % pour les
// socles de tourelle, 85 % pour les coques d'artillerie —, et `echelle` est ce
// qu'il a fallu pour que le canon SE LISE à 40 px. Les faire tenir demanderait
// de descendre `echelle` à ~1,35, où l'artiste a mesuré que « le canon pointe »
// sans se lire. **Un test mesure le débordement et tombe si l'un des deux
// nombres bouge** ; le corriger est un arbitrage, et il revient à Ethan.
//
// ⚠ ET LA v1 FAISAIT PIRE, ce qui met le chiffre en perspective : elle dessinait
// la tourelle sur la case ENTIÈRE, `sprite(famille, nom, x, y, t, t)`, son canon
// atteignant le bord par construction.

/**
 * @typedef {{ cote_case_pct: number, diametre_pct: number, dx_case_pct: number,
 *            dy_case_pct: number, mesure: boolean, x_pct: number, y_pct: number }} Ancre
 * @type {Record<string, Ancre>}
 */
export const ANCRES_DEFENSE = {
  socle_def_j_batterie: { cote_case_pct: 93.82, diametre_pct: 44.9, dx_case_pct: -0.09, dy_case_pct: -15.74, mesure: true, x_pct: -0.1, y_pct: -17.6 },
  socle_def_j_casemate: { cote_case_pct: 93.36, diametre_pct: 44.9, dx_case_pct: -0.09, dy_case_pct: -15.74, mesure: true, x_pct: -0.1, y_pct: -17.6 },
  socle_def_j_creneau: { cote_case_pct: 93.62, diametre_pct: 44.9, dx_case_pct: -0.09, dy_case_pct: -15.74, mesure: true, x_pct: -0.1, y_pct: -17.6 },
  socle_def_j_faucheuse: { cote_case_pct: 111.95, diametre_pct: 35.4, dx_case_pct: -0.0, dy_case_pct: -9.37, mesure: true, x_pct: -0.0, y_pct: -11.1 },
  socle_def_j_harpon: { cote_case_pct: 96.53, diametre_pct: 35.3, dx_case_pct: -0.07, dy_case_pct: -9.96, mesure: true, x_pct: -0.1, y_pct: -11.8 },
  socle_def_j_mortier: { cote_case_pct: 104.96, diametre_pct: 31.2, dx_case_pct: -0.0, dy_case_pct: -9.2, mesure: true, x_pct: -0.0, y_pct: -10.9 },
};

/**
 * D'où vient `cote_case_pct` — la marge de rotation du sprite, et le facteur
 * de lisibilité. Aucun des deux n'est relu au dessin ; ils sont ici pour que le
 * nombre du dessus ne soit pas un nombre tombé du ciel.
 *
 * ⚠ `cote_pct_embase` est le rapport du carré du sprite à son embase — il va de
 * ×1,43 à ×2,09 selon la tourelle, parce qu'un tube long demande plus de marge
 * pour tourner sans se rogner. `echelle` vaut 1,6 pour les trois tourelles de
 * contact et 2,4 pour les trois artilleries, CHOISI À L'ŒIL à 40 px : à ×1,0
 * le canon disparaît et il ne reste qu'un anneau de couleur.
 */
export const TOURELLES_DEFENSE = {
  def_j_batterie: { cote_pct_embase: 144.1, echelle: 1.6 },
  def_j_casemate: { cote_pct_embase: 143.4, echelle: 1.6 },
  def_j_creneau: { cote_pct_embase: 143.8, echelle: 1.6 },
  def_j_faucheuse: { cote_pct_embase: 209.2, echelle: 2.4 },
  def_j_harpon: { cote_pct_embase: 163.5, echelle: 2.4 },
  def_j_mortier: { cote_pct_embase: 200.0, echelle: 2.4 },
};
