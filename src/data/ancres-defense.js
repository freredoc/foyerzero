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
// ⚠⚠ LA TABLE EST MIXTE DEPUIS LE LOT ANCRES-ZÉNITH (19/09), ET C'EST VOULU :
// NEUF SOCLES MESURÉS SUR DES DESSINS ZÉNITHAUX, TROIS SUR DES DESSINS À 75°.
// Les six socles de l'Ouvrage et les trois socles de tourelle du joueur
// (`casemate`, `creneau`, `batterie`) ont été redessinés vus de dessus, et leur
// logement est AU CENTRE de la pièce — `y_pct` de −0,2 à −1,2 là où il valait
// −17,6 à −35,3. Les trois socles d'artillerie du joueur (`faucheuse`,
// `mortier`, `harpon`) n'ont PAS été redessinés — arbitrage d'Ethan du 19/09,
// « si j'ai pas modifié, c'est qu'il n'y a pas besoin » —, et l'ancre décrit le
// socle : le socle n'a pas bougé, l'ancre non plus (−11,1 · −10,9 · −11,8).
// **Ne pas « harmoniser » ces trois-là** : les relancer dans le détecteur
// réparé rendrait d'ailleurs exactement les mêmes nombres (T1 du lot, au bit
// sur les 30 pièces 75° du dépôt) ; seul un socle redessiné les changera, et
// `test/ancres-zenith.test.js` le dira. ⚠ Leur `cote_case_pct`, lui, a bougé
// avec leur TOURELLE, qui est redessinée : 111,95 → 146,89, 104,96 → 159,17,
// 96,53 → 180,01.
//
// ⚠⚠ ET DEUX DÉTECTEURS ONT ÉTÉ RÉPARÉS POUR CES DESSINS-LÀ, SANS DÉPLACER LE
// 75°. `chassis.ancre` rendait 82,7 % et +7,3 sur le créneau de l'Ouvrage — une
// tache plus haute que large, le logement plus le module inférieur du socle —
// et rejetait les trois marcheurs ; `ancres-defense.pivot` prenait la rangée de
// missiles du Harpon pour son embase (D 858 pour 390). Le détail, mesure par
// mesure, est dans `tools/chassis.py`, `tools/ancres-defense.py` et
// `rapports/RAPPORT-lotANCRES-ZENITH.md`.
//
// ⚠⚠ LE CARRÉ DÉBORDE DE LA CASE SUR DIX SOCLES SUR DOUZE, ET LE MOTIF A CHANGÉ.
// Au 08/09 il débordait sur les douze — 58 à 65 % de demi-case chez le joueur,
// 70 à 84 à l'Ouvrage — parce que le logement était haut sur la pièce. Le
// logement est centré maintenant ; ce qui déborde, c'est le carré lui-même :
// les tourelles zénithales portent des canons et des rampes deux à trois fois
// plus longs que leur embase (`cote_pct_embase` 246 à 336 chez le joueur,
// contre 143 à 209 avant), donc à `echelle` inchangée le carré fait **96 à
// 180 % de la case** — le Créneau, seul, tient dans la sienne (48,98 et 48,18),
// le Harpon joueur atteint 99,97 % de demi-case. **`echelle` a été choisie à
// l'œil sur les dessins à 75° ; la rejuger sur les zénithaux est un arbitrage
// d'Ethan, au lot de conditionnement.** Un test borne les deux camps
// séparément et nomme le pire de chaque côté au centième.
//
// ⚠ ET LA v1 FAISAIT PIRE, ce qui met ces chiffres en perspective : elle
// dessinait la tourelle sur la case ENTIÈRE, `sprite(famille, nom, x, y, t, t)`,
// son canon atteignant le bord par construction.

/**
 * @typedef {{ cote_case_pct: number, diametre_pct: number, dx_case_pct: number,
 *            dy_case_pct: number, mesure: boolean, x_pct: number, y_pct: number }} Ancre
 * @type {Record<string, Ancre>}
 */
export const ANCRES_DEFENSE = {
  socle_def_j_batterie: { cote_case_pct: 130.2, diametre_pct: 26.9, dx_case_pct: -0.0, dy_case_pct: -1.06, mesure: true, x_pct: -0.0, y_pct: -1.2 },
  socle_def_j_casemate: { cote_case_pct: 107.19, diametre_pct: 26.9, dx_case_pct: -0.0, dy_case_pct: -1.06, mesure: true, x_pct: -0.0, y_pct: -1.2 },
  socle_def_j_creneau: { cote_case_pct: 95.84, diametre_pct: 26.9, dx_case_pct: -0.0, dy_case_pct: -1.06, mesure: true, x_pct: -0.0, y_pct: -1.2 },
  socle_def_j_faucheuse: { cote_case_pct: 146.89, diametre_pct: 35.4, dx_case_pct: -0.0, dy_case_pct: -9.37, mesure: true, x_pct: -0.0, y_pct: -11.1 },
  socle_def_j_harpon: { cote_case_pct: 180.01, diametre_pct: 35.3, dx_case_pct: -0.07, dy_case_pct: -9.96, mesure: true, x_pct: -0.1, y_pct: -11.8 },
  socle_def_j_mortier: { cote_case_pct: 159.17, diametre_pct: 31.2, dx_case_pct: -0.0, dy_case_pct: -9.2, mesure: true, x_pct: -0.0, y_pct: -10.9 },
  socle_def_o_batterie: { cote_case_pct: 130.18, diametre_pct: 55.1, dx_case_pct: 0.0, dy_case_pct: -0.18, mesure: true, x_pct: 0.0, y_pct: -0.2 },
  socle_def_o_casemate: { cote_case_pct: 107.19, diametre_pct: 55.0, dx_case_pct: -0.0, dy_case_pct: -0.36, mesure: true, x_pct: -0.0, y_pct: -0.4 },
  socle_def_o_creneau: { cote_case_pct: 95.82, diametre_pct: 55.0, dx_case_pct: -0.0, dy_case_pct: -0.27, mesure: true, x_pct: -0.0, y_pct: -0.3 },
  socle_def_o_faucheuse: { cote_case_pct: 146.88, diametre_pct: 24.2, dx_case_pct: -0.0, dy_case_pct: -0.47, mesure: true, x_pct: -0.0, y_pct: -0.6 },
  socle_def_o_harpon: { cote_case_pct: 179.99, diametre_pct: 22.1, dx_case_pct: -0.0, dy_case_pct: -0.56, mesure: true, x_pct: -0.0, y_pct: -0.7 },
  socle_def_o_mortier: { cote_case_pct: 159.18, diametre_pct: 20.4, dx_case_pct: -0.0, dy_case_pct: -0.62, mesure: true, x_pct: -0.0, y_pct: -0.8 },
};

/**
 * D'où vient `cote_case_pct` — la marge de rotation du sprite, et le facteur
 * de lisibilité. Aucun des deux n'est relu au dessin ; ils sont ici pour que le
 * nombre du dessus ne soit pas un nombre tombé du ciel.
 *
 * ⚠ `cote_pct_embase` est le rapport du carré du sprite à son embase — il va de
 * ×1,48 à ×3,34 selon la tourelle depuis le lot ANCRES-ZÉNITH (×1,43 à ×2,21 sur
 * les dessins à 75°), parce qu'un tube long demande plus de marge pour tourner
 * sans se rogner, et que les dessins zénithaux ont des tubes plus longs. Chez le
 * JOUEUR, `echelle` vaut 1,6 pour les trois tourelles de contact et 2,4 pour les
 * trois artilleries, CHOISI À L'ŒIL à 40 px sur les dessins à 75° : à ×1,0 le
 * canon disparaît et il ne reste qu'un anneau de couleur.
 *
 * ⚠ EN ZÉNITHAL, L'EMBASE EST LE PLUS GRAND DISQUE INSCRIT DANS LA SILHOUETTE
 * — `tools/ancres-defense.py:pivot`. Sur une plaque plus large que haute
 * (`def_j_batterie`, 742 × 370 px) c'est la hauteur qui compte, d'où un ratio
 * de 3,34 ; prendre la largeur de la plaque aurait donné 1,85 et un carré de
 * 72 % au lieu de 130. C'est la définition retenue — le plus grand disque qui
 * tienne sous le corps dessiné — et elle est écrite là où elle se mesure.
 *
 * ⚠⚠ LES SIX ÉCHELLES DE L'OUVRAGE SONT CALCULÉES, PAS CHOISIES — DÉCISION
 * D'ETHAN DU 07/09. Chacune aligne le carré de la tourelle de l'Ouvrage sur
 * celui de son homologue du joueur, en pourcentage de case, si bien que les deux
 * camps se lisent à la même taille. Elle se RECALCULE quand un dessin change, au
 * lieu d'être une constante à re-arbitrer — voir `src/data/ancres-blindes.js`,
 * qui porte la formule. Vérifiable dans la table ci-dessus : Faucheuse 146,89
 * contre 146,88, Batterie 130,20 contre 130,18, Casemate 107,19 des deux côtés
 * (au 08/09 : 111,95 · 93,82 / 93,83 · 93,36 / 93,35). ⚠ Le Créneau de
 * l'Ouvrage passe SOUS 1 (0,992) : son embase est plus petite que son carré ne
 * le demande, et c'est le calage qui le dit, pas un choix.
 */
export const TOURELLES_DEFENSE = {
  def_j_batterie: { cote_pct_embase: 333.8, echelle: 1.6 },
  def_j_casemate: { cote_pct_embase: 274.8, echelle: 1.6 },
  def_j_creneau: { cote_pct_embase: 245.7, echelle: 1.6 },
  def_j_faucheuse: { cote_pct_embase: 274.5, echelle: 2.4 },
  def_j_harpon: { cote_pct_embase: 304.9, echelle: 2.4 },
  def_j_mortier: { cote_pct_embase: 303.3, echelle: 2.4 },
  def_o_batterie: { cote_pct_embase: 205.6, echelle: 1.268 },
  def_o_casemate: { cote_pct_embase: 147.5, echelle: 1.458 },
  def_o_creneau: { cote_pct_embase: 193.6, echelle: 0.993 },
  def_o_faucheuse: { cote_pct_embase: 325.5, echelle: 2.21 },
  def_o_harpon: { cote_pct_embase: 270.3, echelle: 3.571 },
  def_o_mortier: { cote_pct_embase: 282.9, echelle: 3.269 },
};
