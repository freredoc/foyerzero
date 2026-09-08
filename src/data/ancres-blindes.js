// Où se pose la tourelle sur la coque d'un blindé — LES DEUX CAMPS.
//
// ⚠⚠ TRANSCRIPTION À LA MAIN DE `art/sprites/ancres-blindes.json` ET DE
// `ancres-blindes-ouvrage.json`, ET UN TEST LES CONFRONTE. Les deux JSON sont
// produits par `tools/ancres-blindes.py` et `tools/ancres-ouvrage.py`, qui
// MESURENT le logement de tourelle sur l'image ; ils ne peuvent pas entrer dans
// le livrable — `tools/build.js` n'inline que des images, et `render/scene.js`
// ne lit aucun fichier. La transcription est donc la seule voie, et une
// transcription qui ne se confronte pas à sa source est une copie qui vieillit.
// Le test compare les clés ET les valeurs SIGNÉES, dans les deux sens, contre
// l'UNION des deux fichiers.
//
// ⚠⚠ UNE SEULE TABLE POUR LES DEUX CAMPS, ET C'EST CE QUI ÉVITE UN `=== 'o'`.
// Elle est indexée par NOM DE SPRITE, et `off_o_belier_chassis` ne peut pas
// entrer en collision avec `off_j_belier_chassis` : la fusion est sûre par
// construction. Un second fichier `ancres-blindes-ouvrage.js` aurait fait deux
// tables pour une grandeur — ce que CLAUDE.md §4 interdit — et obligé
// `render/scene.js` à CHOISIR sa table selon le camp, c'est-à-dire à écrire le
// discriminant de camp que ce module dit ailleurs ne pas vouloir. Ici,
// `ANCRES_BLINDES[coque]` marche pour les deux camps sans une ligne de plus.
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
// ⚠ DIX-HUIT ENTRÉES, NEUF PAR CAMP, ET PAS VINGT : ni `off_j_pilon_chassis_def`
// ni `off_o_pilon_chassis_def` n'existent. L'Obusier n'entre jamais en garnison
// — `pilon.defense.present` vaut `false` — et `nomAvecPose` ne demande `_def`
// que pour cette force-là. C'est la même absence des deux côtés, et c'est la
// donnée qui la dicte, pas une liste écrite ici.
//
// ⚠⚠ `y_pct` N'EST PAS NÉGATIF PARTOUT, ET UN TEST QUI L'AFFIRMERAIT SERAIT
// FAUX. `off_j_fendeur_chassis` vaut +1,3 et `off_j_belier_chassis` +4,4 :
// la tourelle du Chasseur et celle du Pionnier sont SOUS le centre de leur
// coque. ⚠ Les neuf coques de l'OUVRAGE, elles, sont toutes négatives — c'est
// une mesure, pas une règle, et le test nomme la liste au lieu de la déduire.
// Asserter « toutes négatives » inviterait à « corriger » une donnée juste.

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
  off_o_belier_chassis: { cote_case_pct: 40.18, diametre_pct: 29.6, dx_case_pct: -0.06, dy_case_pct: -3.09, mesure: true, x_pct: -0.1, y_pct: -5.0 },
  off_o_belier_chassis_def: { cote_case_pct: 38.28, diametre_pct: 28.2, dx_case_pct: -1.94, dy_case_pct: -3.36, mesure: true, x_pct: -3.1, y_pct: -6.1 },
  off_o_broyeur_chassis: { cote_case_pct: 77.1, diametre_pct: 27.2, dx_case_pct: -0.1, dy_case_pct: -5.02, mesure: true, x_pct: -0.1, y_pct: -5.5 },
  off_o_broyeur_chassis_def: { cote_case_pct: 74.83, diametre_pct: 26.4, dx_case_pct: -0.87, dy_case_pct: -4.27, mesure: true, x_pct: -0.9, y_pct: -5.2 },
  off_o_fendeur_chassis: { cote_case_pct: 84.9, diametre_pct: 28.6, dx_case_pct: -0.0, dy_case_pct: -3.06, mesure: true, x_pct: -0.0, y_pct: -4.9 },
  off_o_fendeur_chassis_def: { cote_case_pct: 92.21, diametre_pct: 30.5, dx_case_pct: -0.62, dy_case_pct: -4.35, mesure: true, x_pct: -1.0, y_pct: -8.8 },
  off_o_pilon_chassis: { cote_case_pct: 48.0, diametre_pct: 22.5, dx_case_pct: -0.0, dy_case_pct: -9.21, mesure: true, x_pct: -0.0, y_pct: -9.7 },
  off_o_ratisseur_chassis: { cote_case_pct: 42.44, diametre_pct: 12.8, dx_case_pct: -0.06, dy_case_pct: -11.06, mesure: true, x_pct: -0.1, y_pct: -18.2 },
  off_o_ratisseur_chassis_def: { cote_case_pct: 71.29, diametre_pct: 21.5, dx_case_pct: 4.25, dy_case_pct: -4.31, mesure: true, x_pct: 6.8, y_pct: -7.3 },
};

/**
 * D'où vient `cote_case_pct`. Voir `src/data/ancres-defense.js` pour le motif.
 *
 * ⚠ `echelle` vaut 2,2 pour les cinq tourelles du JOUEUR, et non 1,6 comme aux
 * défenses de contact : l'emprise d'une coque vaut 20 ou 31 sur 32, pas 90 %, et
 * son logement ne représente que 18 à 38 % de la coque contre 45 % sur le socle
 * carré. À 1,6 aucun canon ne se lit à 40 px ; à 2,8 le tambour déborde sur les
 * chenilles.
 *
 * ⚠⚠ LES CINQ ÉCHELLES DE L'OUVRAGE SONT CALCULÉES, PAS CHOISIES — DÉCISION
 * D'ETHAN DU 07/09. Chacune aligne le carré de la tourelle de l'Ouvrage sur
 * celui de son homologue du joueur, EN POURCENTAGE DE CASE :
 *
 *     echelle_ouvrage = 2,2 × cote_case_pct(joueur) / cote_case_pct(ouvrage à 2,2)
 *
 * Les deux camps se lisent donc à la même taille, et la valeur se RECALCULE si
 * un dessin change au lieu d'être une constante à re-arbitrer. C'est pourquoi
 * elles vont de 1,407 à 3,192 là où le joueur en porte une seule : elles ne
 * décrivent pas un goût, elles corrigent l'écart de dessin entre deux camps.
 * Vérifiable dans la table ci-dessus, colonne `cote_case_pct` : Percheron 77,10
 * des deux côtés, Chasseur 84,90 contre 84,92, Éclaireur 42,44 des deux côtés.
 */
export const TOURELLES_BLINDES = {
  off_j_belier_tourelle: { cote_pct_embase: 117.7, echelle: 2.2 },
  off_j_broyeur_tourelle: { cote_pct_embase: 159.0, echelle: 2.2 },
  off_j_fendeur_tourelle: { cote_pct_embase: 264.7, echelle: 2.2 },
  off_j_pilon_tourelle: { cote_pct_embase: 109.0, echelle: 2.2 },
  off_j_ratisseur_tourelle: { cote_pct_embase: 124.6, echelle: 2.2 },
  off_o_belier_tourelle: { cote_pct_embase: 144.3, echelle: 1.505 },
  off_o_broyeur_tourelle: { cote_pct_embase: 201.1, echelle: 1.455 },
  off_o_fendeur_tourelle: { cote_pct_embase: 247.3, echelle: 1.956 },
  off_o_pilon_tourelle: { cote_pct_embase: 156.5, echelle: 1.407 },
  off_o_ratisseur_tourelle: { cote_pct_embase: 166.2, echelle: 3.192 },
};
