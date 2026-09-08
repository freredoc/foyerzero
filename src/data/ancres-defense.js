// Où se pose la tourelle sur le socle d'une défense — LES DEUX CAMPS.
//
// ⚠⚠ TRANSCRIPTION À LA MAIN DE `art/sprites/ancres-defense.json` ET DE
// `ancres-defense-ouvrage.json`, ET UN TEST LES CONFRONTE. Les deux JSON sont
// produits par `tools/ancres-defense.py` et `tools/ancres-ouvrage.py`, qui
// MESURENT le logement de tourelle sur l'image ; ils ne peuvent pas entrer dans
// le livrable — `tools/build.js` n'inline que des images, et `render/scene.js`
// ne lit aucun fichier. La transcription est donc la seule voie, et une
// transcription qui ne se confronte pas à sa source est une copie qui vieillit.
// Le test compare les clés ET les valeurs SIGNÉES, dans les deux sens, contre
// l'UNION des deux fichiers.
//
// ⚠⚠ UNE SEULE TABLE POUR LES DEUX CAMPS, ET C'EST CE QUI ÉVITE UN `=== 'o'`.
// Elle est indexée par NOM DE SPRITE, et `socle_def_o_casemate` ne peut pas
// entrer en collision avec `socle_def_j_casemate` : la fusion est sûre par
// construction. Voir `src/data/ancres-blindes.js` pour le motif complet — c'est
// le même, et il est écrit une fois là-bas.
//
// ⚠⚠ ET C'EST LA SEULE CHOSE QUI FAIT TOURNER LES SIX DÉFENSES DE L'OUVRAGE.
// `couchesDeLaDefense` n'a pas changé d'une ligne : elle écrivait déjà
// `socle_def_${c}_${d.id}` et lisait `ANCRES_DEFENSE[socle] ?? null`. Tant que
// la table ne portait que le joueur, le `?? null` rendait `null` pour l'Ouvrage
// et `dessinerCouches` posait la pièce sur la case entière. L'arrivée de ces six
// clés suffit à la faire tourner. Le discriminant est la DONNÉE, jamais le camp.
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
// ⚠⚠ LE CARRÉ DÉBORDE DE LA CASE SUR LES DOUZE SOCLES, ET C'EST MESURÉ, PAS
// SUBI. Le carré de tourelle atteint **58,23 à 65,34 % de demi-case chez le
// joueur** et **69,56 à 83,94 % à l'Ouvrage**, là où 50 est le bord : la
// tourelle mord donc sur la case voisine quand son canon pointe dans cette
// direction-là. Les deux camps débordent ; l'Ouvrage déborde davantage, et le
// motif est dans son DESSIN, pas dans le rendu.
//
// ⚠⚠ ET LE MOTIF DE L'ÉCART SE LIT DANS `y_pct`. Les six socles du joueur
// portent leur logement à 10,9 à 17,6 % au-dessus du centre de la pièce ; ceux
// de l'Ouvrage à **25,1 à 35,3 %** — le socle carré a une haute face avant sous
// son plateau, et l'artillerie est un marcheur qui a ses pattes. C'est ce que
// `tools/ancres-ouvrage.py` documente en passant `decal_max = 0,40` à
// `chassis.ancre` là où le défaut de 0,22 rejetait les six. Le canon est donc
// haut parce que la plate-forme est haute : le poser plus bas le mettrait dans
// les pattes. **Le corriger demanderait de redessiner les socles, pas de
// changer un nombre du rendu — et c'est un arbitrage qui revient à Ethan.**
//
// ⚠ ET LA v1 FAISAIT PIRE, ce qui met les deux chiffres en perspective : elle
// dessinait la tourelle sur la case ENTIÈRE, `sprite(famille, nom, x, y, t, t)`,
// son canon atteignant le bord par construction. **Un test borne les deux camps
// SÉPARÉMENT, chacun sur sa propre fourchette mesurée**, et nomme le pire de
// chaque côté au centième : une borne unique et lâche laisserait passer une
// dérive du camp le plus serré.

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
  socle_def_o_batterie: { cote_case_pct: 93.83, diametre_pct: 32.9, dx_case_pct: 0.09, dy_case_pct: -23.56, mesure: true, x_pct: 0.1, y_pct: -26.0 },
  socle_def_o_casemate: { cote_case_pct: 93.35, diametre_pct: 31.4, dx_case_pct: 0.08, dy_case_pct: -23.56, mesure: true, x_pct: 0.1, y_pct: -26.0 },
  socle_def_o_creneau: { cote_case_pct: 93.61, diametre_pct: 32.8, dx_case_pct: 0.09, dy_case_pct: -22.75, mesure: true, x_pct: 0.1, y_pct: -25.1 },
  socle_def_o_faucheuse: { cote_case_pct: 111.95, diametre_pct: 20.5, dx_case_pct: 0.17, dy_case_pct: -27.97, mesure: true, x_pct: 0.2, y_pct: -35.3 },
  socle_def_o_harpon: { cote_case_pct: 96.52, diametre_pct: 20.4, dx_case_pct: 0.17, dy_case_pct: -27.89, mesure: true, x_pct: 0.2, y_pct: -35.2 },
  socle_def_o_mortier: { cote_case_pct: 104.94, diametre_pct: 20.5, dx_case_pct: 0.17, dy_case_pct: -27.52, mesure: true, x_pct: 0.2, y_pct: -34.7 },
};

/**
 * D'où vient `cote_case_pct` — la marge de rotation du sprite, et le facteur
 * de lisibilité. Aucun des deux n'est relu au dessin ; ils sont ici pour que le
 * nombre du dessus ne soit pas un nombre tombé du ciel.
 *
 * ⚠ `cote_pct_embase` est le rapport du carré du sprite à son embase — il va de
 * ×1,43 à ×2,21 selon la tourelle, parce qu'un tube long demande plus de marge
 * pour tourner sans se rogner. Chez le JOUEUR, `echelle` vaut 1,6 pour les trois
 * tourelles de contact et 2,4 pour les trois artilleries, CHOISI À L'ŒIL à
 * 40 px : à ×1,0 le canon disparaît et il ne reste qu'un anneau de couleur.
 *
 * ⚠⚠ LES SIX ÉCHELLES DE L'OUVRAGE SONT CALCULÉES, PAS CHOISIES — DÉCISION
 * D'ETHAN DU 07/09. Chacune aligne le carré de la tourelle de l'Ouvrage sur
 * celui de son homologue du joueur, en pourcentage de case, si bien que les deux
 * camps se lisent à la même taille. Elle se RECALCULE quand un dessin change, au
 * lieu d'être une constante à re-arbitrer — voir `src/data/ancres-blindes.js`,
 * qui porte la formule. Vérifiable dans la table ci-dessus : Faucheuse 111,95 %
 * des deux côtés, Batterie 93,82 contre 93,83, Casemate 93,36 contre 93,35.
 */
export const TOURELLES_DEFENSE = {
  def_j_batterie: { cote_pct_embase: 144.1, echelle: 1.6 },
  def_j_casemate: { cote_pct_embase: 143.4, echelle: 1.6 },
  def_j_creneau: { cote_pct_embase: 143.8, echelle: 1.6 },
  def_j_faucheuse: { cote_pct_embase: 209.2, echelle: 2.4 },
  def_j_harpon: { cote_pct_embase: 163.5, echelle: 2.4 },
  def_j_mortier: { cote_pct_embase: 200.0, echelle: 2.4 },
  def_o_batterie: { cote_pct_embase: 171.6, echelle: 1.874 },
  def_o_casemate: { cote_pct_embase: 153.9, echelle: 2.37 },
  def_o_creneau: { cote_pct_embase: 200.4, echelle: 1.604 },
  def_o_faucheuse: { cote_pct_embase: 220.6, echelle: 2.934 },
  def_o_harpon: { cote_pct_embase: 199.2, echelle: 2.815 },
  def_o_mortier: { cote_pct_embase: 200.7, echelle: 3.023 },
};
