// Le sol de la carte du monde — quels dessins, où, et avec quel poids.
//
// ---------------------------------------------------------------------------
// ⚠⚠ CE MODULE NE REND PLUS DE PIXELS — lot SOL-SATELLITE, 05/09
// ---------------------------------------------------------------------------
//
// Il en rendait, et c'était toute son histoire. Jusqu'ici le fond de carte
// était un PAVAGE À SOMME PONDÉRÉE sur un atlas INDEXÉ : soixante-quatre tuiles
// de 128 px dont chaque pixel valait 0 à 4, semées sur un réseau au pas de 56,
// accumulées à la main dans des `Float32Array` sous la formule
// `μ + Σwᵢ(tᵢ − μ) / √(Σwᵢ²)`, puis REQUANTIFIÉES sur cinq teintes d'une rampe
// de `FICHE-STYLE.md`. Cinq tuiles se superposaient sur chaque pixel.
//
// Ethan, 05/09 : « je viens de t'envoyer 8 planches de terrain satellite pour la
// carte du monde […] tu fais au mieux pour que ce soit joli, que les transitions
// entre les différentes images se passent bien, pas de fond ouvrage pour le
// moment, tu fais le moins de traitement possible ».
//
// « Le moins de traitement possible » condamne la moulinette entière : de l'art
// livré, il ne serait rien resté à l'écran qu'un relief à cinq niveaux repeint.
// Ce qui la remplace tient en une phrase — **on pose la planche telle quelle, et
// on ne fond que les bords**.
//
// ---------------------------------------------------------------------------
// ⚠⚠ LE PAVAGE EST UNE PARTITION DE L'UNITÉ, ET C'EST CE QUI REND LE FONDU SÛR
// ---------------------------------------------------------------------------
//
// Les blocs sont posés sur une grille régulière de pas `PAS_SOURCE`, chacun
// couvrant `COTE_SOURCE` : ils se CHEVAUCHENT donc de `FONDU_SOURCE`. Le poids
// d'un bloc est le produit de deux profils séparables valant 1 au centre et
// montant en `sin²` sur le fondu ; deux profils voisins étant `sin²` et `cos²`
// du même angle, **ils somment exactement à 1**. Mesuré sur le prototype, sur
// toute une vue : `Σw` minimum 1,0000, maximum 1,0000.
//
// D'où trois propriétés qu'aucune autre écriture ne donne ensemble :
//
//   1. `78,6 %` de la surface est le pixel SOURCE, à l'octet — la part où un
//      seul bloc a le poids 1, soit `((COTE − 2·FONDU) / PAS)²`. C'est
//      exactement ce que « le moins de traitement possible » veut dire ;
//   2. dans le fondu, deux blocs (quatre aux coins) se croisent en `sin²`, donc
//      sans discontinuité de pente : aucune ligne ne se lit ;
//   3. `Σw = 1` partout, donc **aucun plancher à prévoir**. L'ancien module
//      portait une garde `sw <= 0` contre le noir, née d'un pas trop large ;
//      ici la question ne se pose pas, et il n'y a rien à garder.
//
// ⚠ ET IL N'Y A PLUS DE NORMALISATION `/√(Σwᵢ²)`. Elle existait pour rattraper
// l'écrasement du contraste que produit la moyenne de CINQ textures ; avec un
// seul bloc à poids plein sur quatre pixels sur cinq, il n'y a plus rien à
// rattraper — l'appliquer ici gonflerait le contraste d'un facteur √2 dans les
// seules bandes de fondu, c'est-à-dire dessinerait le raccord qu'on efface.
//
// ---------------------------------------------------------------------------
// ⚠ CHAQUE DALLE SE CALCULE SEULE, ET RIEN NE DÉPEND DE SES VOISINES
// ---------------------------------------------------------------------------
//
// L'invariant du module d'avant survit mot pour mot, et il vaut toujours autant :
// la grille de blocs est semée par la position ABSOLUE en pixels d'écran, le
// coin d'une dalle n'entre dans aucun hachage, et la position d'un bloc se
// calcule globalement, jamais relativement à la dalle qui le demande. Deux
// dalles adjacentes se raccordent donc exactement, et une zone rendue en une
// dalle est identique à la même rendue en quatre. Une couture ne fait pas
// tomber un test : elle se voit six semaines plus tard sur un téléphone.

import { ZOOM_CARTE, TERRAIN_CARTE, PIXELS_SOURCE_PAR_CASE } from '../data/sites.js';
import { hachageBrut } from '../sim/peuplement.js';

/**
 * Le sel du pavage.
 *
 * ⚠ IL EN FAUT UN SEUL, LÀ OÙ L'ANCIEN EN PRENAIT DEUX. Le pavage d'avant
 * devait tirer deux décalages de seize bits chacun, un numéro de tuile, une
 * rotation, un miroir et un tirage d'appartenance : quarante-neuf bits, donc
 * deux hachages. Ici trois champs suffisent — le dessin, le quart de tour, le
 * miroir — et ils tiennent dans **six bits** du même mot.
 *
 * ⚠ 2 ET 3 SONT RETIRÉS, PAS RÉEMPLOYÉS. C'étaient `SEL_DECALAGE` et
 * `SEL_FIGURE` ; les reprendre ferait dépendre le sol de la carte du même mot
 * que `sim/poi.js`, qui tire ses rangées et ses colonnes sous ces deux sels-là.
 * Deux tirages sans rapport qui partagent un sel finissent par se corréler, et
 * personne ne s'en aperçoit. Le 6 est libre — 0 et 1 au peuplement, 4 à
 * `render/variante.js`, 5 à `render/fond.js`.
 */
export const SEL_BLOC = 6;

/**
 * Le sel du tirage de FAMILLE — lot SOL-OUVRAGE, 08/09.
 *
 * ⚠⚠ IL EST NEUF, ET IL NE PARTAGE PAS `SEL_BLOC`. Celui-ci porte déjà le
 * dessin, le quart de tour et le miroir sur six bits ; la famille est sans
 * rapport avec eux, et les faire sortir du même mot les corrélerait — une
 * famille donnée finirait par pencher vers une orientation. Relevé avant de
 * choisir : 0 et 1 au peuplement, 2 et 3 à `sim/poi.js`, 4 à
 * `render/variante.js`, 5 à `render/fond.js`, 6 juste au-dessus. **7 est le
 * premier libre.**
 *
 * ⚠ ET IL NE SE TIRE PAS PAR BLOC MAIS PAR NŒUD DE MAILLE — voir
 * `bruitDeFamille`. Deux blocs voisins de la même maille lisent les mêmes
 * quatre nœuds : c'est ce qui fait des plaques plutôt que du poivre et sel.
 */
export const SEL_FAMILLE = 7;

/**
 * Les quatre familles de sol, et combien de dessins chacune porte.
 *
 * ⚠⚠ LA FAMILLE EST CE QUI FAIT LA BASCULE, ET LA COULEUR N'EN EST PAS. Le sol
 * de la carte passait du désert d'Ethan à l'Ouvrage en un seul geste jusqu'au
 * 08/09 : il n'y avait qu'une famille. Il y en a quatre, et un bloc en tire une
 * selon la RANGÉE de son centre — mais **sa teinte, elle, ne dépend que de la
 * rangée du pixel**, jamais de la famille. Voir `TERRAIN_CARTE.ouvrage`.
 *
 * ⚠ L'ORDRE EST LE NOM, ET IL L'EST DEUX FOIS. Le hachage rend un rang DANS une
 * famille, et ce rang n'a que cette liste pour désigner un dessin ; et les
 * quatre familles sont concaténées dans l'ordre ci-dessous pour former
 * `NOMS_DU_SOL`, que `ui/monde.js` indexe par entier. Réordonner l'une ou
 * l'autre rebattrait le sol de toutes les cartes de toutes les graines.
 * `tools/sols.py` porte la même liste, et un test les confronte au manifeste.
 *
 * ⚠⚠ ET L'OCRE VIENT EN PREMIER, CE QUI N'EST PAS UN DÉTAIL. Ses huit planches
 * gardent donc les rangs 0 à 7, et `h % 8` vaut `h & 7` comme avant : à graine
 * égale, **le bas de la carte tire exactement les mêmes dessins qu'avant le
 * lot**. Ce qui change en bas est la géométrie du pavage, pas le tirage.
 */
export const FAMILLES = Object.freeze([
  Object.freeze({ nom: 'ocre', noms: Object.freeze(
    Array.from({ length: 8 }, (_, i) => `sol_carte_${i + 1}`)) }),
  Object.freeze({ nom: 'naturel', noms: Object.freeze(
    Array.from({ length: 7 }, (_, i) => `sol_ouvrage_naturel_${i + 1}`)) }),
  Object.freeze({ nom: 'hybride', noms: Object.freeze(
    Array.from({ length: 3 }, (_, i) => `sol_ouvrage_hybride_${i + 1}`)) }),
  Object.freeze({ nom: 'artificiel', noms: Object.freeze(
    Array.from({ length: 4 }, (_, i) => `sol_ouvrage_artificiel_${i + 1}`)) }),
]);

/** Le rang du premier dessin de chaque famille dans `NOMS_DU_SOL`. */
const DEBUT_DE_FAMILLE = FAMILLES.reduce((acc, f) => {
  acc.push(acc[acc.length - 1] + f.noms.length);
  return acc;
}, [0]);

/**
 * Les vingt-deux planches, familles concaténées dans l'ordre de `FAMILLES`.
 *
 * ⚠ `ui/monde.js` LES INDEXE PAR ENTIER, et le balisage porte `sol-1` à
 * `sol-22` dans ce même ordre. Les huit premières sont les ocres, donc les
 * balises `sol-1` à `sol-8` ne changent pas de contenu.
 */
export const NOMS_DU_SOL = Object.freeze(FAMILLES.flatMap((f) => [...f.noms]));

/**
 * Le côté d'une planche, en pixels SOURCE.
 *
 * ⚠ IL EST ÉCRIT ICI ET MESURÉ AILLEURS. `render/` est pur : il ne lit aucun
 * fichier, et `naturalWidth` n'existe qu'une fois l'image décodée par un
 * navigateur. La constante est donc au code, et un test la confronte à
 * `art/sprites/sol/sol-empreintes.json` — elle tombe au dépôt, pas chez le
 * joueur. Même motif que `render/fond.js` depuis le lot MUR-PEINT.
 */
export const COTE_SOURCE = 704;

/**
 * La translation ocre → violet, par canal, telle que `tools/sols.py` la mesure.
 *
 * ⚠⚠ LES VINGT-DEUX PLANCHES SONT STOCKÉES SUR LE REPÈRE OCRE, ET C'EST CE QUI
 * REND LES DEUX BOUTS EXACTS D'UN SEUL COUP. En bas la teinte vaut zéro, donc
 * les huit ocres se peignent telles qu'elles sont stockées ; en haut elle vaut
 * un, donc les quatorze neuves — stockées à `art + (ocre − violet)` — retombent
 * exactement sur la référence violette qu'Ethan a rendue.
 *
 * ⚠ ELLE EST ÉCRITE ICI ET MESURÉE AILLEURS, comme `COTE_SOURCE` et pour la
 * même raison : `render/` est pur, il ne lit aucun fichier. Un test la confronte
 * à `art/sprites/sol/sol-empreintes.json`, où l'outil l'écrit — elle tombe au
 * dépôt, pas chez le joueur.
 *
 * ⚠⚠ ET LE ROUGE ET LE VERT SONT SOUSTRAITS, LE BLEU AJOUTÉ. C'est ce que dit le
 * signe, et c'est ce qui oblige `ui/monde.js` à deux passes de composition sur
 * des canaux DISJOINTS. La soustraction n'est exacte que si le sol reste
 * au-dessus de ce qu'on lui retire : `tools/sols.py` pose pour ça un plancher au
 * stockage, et un test relève les minimums au manifeste.
 */
export const DELTA_TEINTE = Object.freeze([-69.0394, -21.0827, 15.6858]);

/** La largeur du fondu entre deux blocs voisins, en pixels SOURCE. */
export const FONDU_SOURCE = TERRAIN_CARTE.fonduSourcePx;

/** Le pas de la grille de blocs : un bloc, moins ce qu'il partage avec le suivant. */
export const PAS_SOURCE = COTE_SOURCE - FONDU_SOURCE;

/**
 * La part de la surface qui est le pixel source, sans le moindre mélange.
 *
 * ⚠ ELLE SE CALCULE, ELLE NE S'ANNONCE PAS. C'est le carré du rapport entre la
 * zone à poids plein d'un bloc — `COTE − 2·FONDU` — et le pas de la grille.
 * Un test la mesure sur le pavage lui-même plutôt que de croire cette ligne.
 */
export const PART_INTACTE = ((COTE_SOURCE - 2 * FONDU_SOURCE) / PAS_SOURCE) ** 2;

/**
 * Combien de pixels d'écran vaut un pixel source, à ce cran de zoom.
 *
 * Une case vaut `PIXELS_SOURCE_PAR_CASE` pixels source et `cran` pixels
 * physiques : l'échelle est le rapport des deux, et elle ne dépasse jamais 1 —
 * le cran le plus serré tombe au 1:1, les autres réduisent. On n'agrandit
 * jamais une source, c'est l'acquis du « gros carré moche » du 30/08.
 *
 * @param {number} cran pixels physiques par case, un cran de `ZOOM_CARTE`
 * @returns {number}
 */
export function echelleDuCran(cran) {
  if (!ZOOM_CARTE.crans.includes(cran)) {
    throw new RangeError(`terrain : cran ${cran} hors de ${ZOOM_CARTE.crans.join(', ')}`);
  }
  return cran / PIXELS_SOURCE_PAR_CASE;
}

/**
 * La géométrie du pavage à un cran donné, EN PIXELS ENTIERS.
 *
 * ⚠⚠ TOUT SE DÉRIVE DE LA TAILLE ARRONDIE DU BLOC, ET C'EST CE QUI REND LE
 * FONDU EXACT. La tentation est de garder les flottants — `1254 × 0,125` fait
 * 156,75 au cran 32 — et de laisser le navigateur poser les images à la
 * sous-pixel près. Elle se paie : le profil montant d'un bloc et le profil
 * descendant de son voisin seraient alors rééchantillonnés séparément, leurs
 * bandes se décaleraient d'une fraction de pixel, et `Σw` ne vaudrait plus un
 * sur la colonne du raccord — **un liseré d'un pixel, clair ou sombre, sur
 * toute la longueur de chaque couture**.
 *
 * En arrondissant D'ABORD la taille et le fondu, le pas devient entier lui
 * aussi, et la complémentarité `sin² + cos² = 1` tombe juste AU PIXEL, sans
 * rien à normaliser après coup. Un test somme les poids sur une dalle entière
 * et exige exactement 1.
 *
 * ⚠ CE QUE ÇA COÛTE : l'échelle réelle du sol s'écarte de l'échelle nominale
 * d'au plus un demi-pixel sur 1 254, soit **0,04 %**, et le pas d'au plus 0,18 %
 * au cran le plus large. Ça ne se voit pas et ça ne peut rien casser : le sol
 * est un DÉCOR, il n'est indexé sur aucune case — rien n'oblige un bloc à
 * tomber sur une frontière de grille, et rien ne se repère par rapport à lui.
 *
 * @param {number} cran pixels physiques par case, un cran de `ZOOM_CARTE`
 * @returns {{echelle: number, taille: number, fondu: number, pas: number}}
 */
export function geometrieDuCran(cran) {
  const echelle = echelleDuCran(cran);
  const taille = Math.round(COTE_SOURCE * echelle);
  const fondu = Math.round(FONDU_SOURCE * echelle);
  if (fondu < 1 || fondu * 2 > taille) {
    throw new RangeError(
      `terrain : au cran ${cran}, un fondu de ${fondu} ne tient pas dans ${taille}`,
    );
  }
  return { echelle, taille, fondu, pas: taille - fondu };
}

/** Ramène un nombre dans [0, 1]. */
const borne01 = (x) => (x < 0 ? 0 : (x > 1 ? 1 : x));

/**
 * La part d'Ouvrage d'une rangée : 0 chez le joueur, 1 tout en haut.
 *
 * ⚠⚠ ELLE EST ROUVERTE, ET CE N'EST PAS CELLE D'AVANT. Une fonction de ce nom a
 * existé jusqu'au 05/09 ; elle valait `(niveauDeLaRangee(r) − 1) / (plafond − 1)`
 * — la rampe du NIVEAU de site, qui monte sur toute la hauteur de la carte — et
 * elle a été retirée sur demande d'Ethan avec la note « à rouvrir ». La trace a
 * été cherchée dans l'historique avant d'écrire celle-ci : elle en diffère, et
 * c'est voulu. Le sol doit être **entièrement** celui d'aujourd'hui en bas et
 * **entièrement** l'Ouvrage en haut, avec une bascule bornée entre les deux —
 * une rampe indexée sur le niveau ferait basculer le sol dès la deuxième rangée.
 *
 * ⚠ TROIS BRANCHES SE RÉDUISENT À UN `borne01`, ET C'EST EXACTEMENT LA MÊME
 * FONCTION. La rampe atteint 1 à la rangée 76 et 0 à la 226 ; la borner suffit à
 * rendre les deux plateaux, et une écriture à trois branches donnerait trois
 * endroits où se tromper de comparateur.
 *
 * @param {number} rangee rangée de carte, 1 en haut
 * @returns {number} de 0 à 1
 */
export function partOuvrageDeLaRangee(rangee) {
  const { rangeePivot, largeurFamilles } = TERRAIN_CARTE.ouvrage;
  return borne01((rangeePivot - rangee) / largeurFamilles);
}

/**
 * La part de TEINTE d'une rangée : 0 chez le joueur, 1 tout en haut.
 *
 * ⚠⚠ ELLE MONTE PLUS VITE QUE LA PART DE FAMILLE, ET C'EST LE POINT LE PLUS
 * DÉLICAT DU LOT. Les deux partent de la même rangée pivot mais la teinte est
 * pleine dès la rangée 96, quand les familles ne le sont qu'à la 76 : les
 * premières plaques artificielles se peignent donc à teinte pleine, jamais à une
 * teinte intermédiaire qui les rendrait ni ocres ni violettes.
 *
 * ⚠ ELLE EST LINÉAIRE PAR MORCEAUX, DONC ELLE A DEUX COUDES — aux rangées 226 et
 * 96. `ui/monde.js` doit poser un arrêt de dégradé À CHAQUE COUDE qu'une dalle
 * enjambe, faute de quoi le navigateur interpole en droite là où la fonction
 * casse, et le raccord avec la dalle voisine se voit.
 *
 * @param {number} rangee rangée de carte, 1 en haut
 * @returns {number} de 0 à 1
 */
export function partDeTeinteDeLaRangee(rangee) {
  const { rangeePivot, largeurTeinte } = TERRAIN_CARTE.ouvrage;
  return borne01((rangeePivot - rangee) / largeurTeinte);
}

/**
 * Les rangées où la teinte CASSE de pente, de la plus haute à la plus basse.
 *
 * ⚠ ELLES SE DÉRIVENT, ELLES NE S'ÉCRIVENT PAS. `ui/monde.js` les demande pour
 * poser ses arrêts de dégradé ; les recopier là-bas ferait deux vérités sur la
 * forme de la même rampe, et la première retouche de `largeurTeinte` en
 * rendrait une fausse sans qu'un pixel bouge au dépôt.
 */
export const COUDES_DE_TEINTE = Object.freeze([
  TERRAIN_CARTE.ouvrage.rangeePivot - TERRAIN_CARTE.ouvrage.largeurTeinte,
  TERRAIN_CARTE.ouvrage.rangeePivot,
]);

/**
 * Les trois parts cumulées d'une part d'Ouvrage donnée.
 *
 * ⚠⚠ ELLES SONT CROISSANTES ET ORDONNÉES `c1 ≥ c2 ≥ c3` SUR TOUTE LA PLAGE, et
 * c'est ce qui garantit qu'un bloc ne redevient jamais plus naturel quand on
 * monte. Un bruit `u` fixé, faire croître `p` ne peut que faire franchir des
 * seuils vers l'artificiel, jamais l'inverse. Un test l'échantillonne au
 * millième plutôt que de croire cette ligne.
 *
 * @param {number} p part d'Ouvrage, de 0 à 1
 * @returns {{c1: number, c2: number, c3: number}} non-ocre, hybride ou plus, artificielle
 */
export function partsCumulees(p) {
  const { partNonOcre, partHybrideOuPlus, partArtificielle } = TERRAIN_CARTE.ouvrage;
  return {
    c1: borne01((p - partNonOcre.debut) / partNonOcre.largeur),
    c2: borne01((p - partHybrideOuPlus.debut) / partHybrideOuPlus.largeur),
    c3: borne01((p - partArtificielle.debut) / partArtificielle.largeur),
  };
}

/** L'adoucissement d'Hermite, `t²(3 − 2t)` : plat aux deux bouts. */
const adoucir = (t) => t * t * (3 - 2 * t);

/**
 * Le bruit qui décide de la famille d'un bloc, LISSÉ sur une maille de blocs.
 *
 * ⚠⚠ UN TIRAGE PAR BLOC DONNERAIT DU POIVRE ET SEL, ET C'EST LA RAISON D'ÊTRE DE
 * CETTE FONCTION. Deux blocs voisins tireraient deux nombres indépendants : au
 * milieu de la bascule, une plaque violette isolée, une ocre à côté, et rien qui
 * se lise comme un terrain. On tire donc aux NŒUDS d'une maille de
 * `mailleBlocs` blocs et on interpole entre eux, si bien que les plaques font
 * quelques blocs de large.
 *
 * ⚠ BILINÉAIRE AVEC ADOUCISSEMENT, PAS LINÉAIRE. Une interpolation linéaire pure
 * laisse une cassure de pente à chaque nœud, et une cassure de pente dans le
 * champ de bruit se lit comme un alignement de plaques sur la maille — la grille
 * qu'on cherche justement à cacher. `t²(3 − 2t)` est plat aux deux bouts.
 *
 * ⚠⚠ ET `Math.floor` EST OBLIGATOIRE, PAS UNE TRONCATURE. Les indices de bloc
 * sont NÉGATIFS au-dessus et à gauche de l'origine — un bloc mord sur la dalle
 * par le haut —, et `Math.trunc(-1 / 2)` rend 0 quand `Math.floor` rend −1 : la
 * maille se replierait sur elle-même de part et d'autre de l'origine, et la
 * carte porterait une couture invisible en test et flagrante à l'écran.
 *
 * ⚠ ELLE NE PASSE PAS PAR `render/interpolation.js`, ET C'EST DÉLIBÉRÉ. Ce
 * module-là est l'accumulateur de TEMPS de la simulation : il importe
 * `sim/clock.js`, travaille en milli-entiers et tronque vers `precedent`.
 * `positionInterpolee` n'a ni la signature ni le domaine qu'il faudrait ici, et
 * l'y plier ferait dépendre le sol de la carte de l'horloge du combat.
 *
 * @param {number} graine graine de la partie
 * @param {number} by indice de bloc, axe des rangées
 * @param {number} bx indice de bloc, axe des colonnes
 * @returns {number} dans [0, 1)
 */
export function bruitDeFamille(graine, by, bx) {
  const m = TERRAIN_CARTE.ouvrage.mailleBlocs;
  const gy = Math.floor(by / m);
  const gx = Math.floor(bx / m);
  const ty = adoucir((by - gy * m) / m);
  const tx = adoucir((bx - gx * m) / m);
  const noeud = (jy, jx) => hachageBrut(graine, jy, jx, SEL_FAMILLE) / 0x100000000;
  const haut = noeud(gy, gx) * (1 - tx) + noeud(gy, gx + 1) * tx;
  const bas = noeud(gy + 1, gx) * (1 - tx) + noeud(gy + 1, gx + 1) * tx;
  return haut * (1 - ty) + bas * ty;
}

/**
 * La rangée de carte que touche le CENTRE d'un bloc.
 *
 * ⚠⚠ ELLE SE CALCULE EN PIXELS SOURCE, JAMAIS EN PIXELS D'ÉCRAN, et c'est ce qui
 * rend la carte des familles STABLE AU ZOOM. Passer par le `pas` de
 * `geometrieDuCran` — qui est arrondi au cran — ferait glisser la carte des
 * familles d'un cran à l'autre : une plaque changerait de famille sous le doigt
 * qui pince, ce qui se lit comme un scintillement et qu'aucun test de pixel ne
 * verrait. Un test compare la famille d'un même bloc aux quatre crans.
 *
 * ⚠ CE QUI DÉRIVE QUAND MÊME, ET IL FAUT LE DIRE : le `pas` d'écran est arrondi,
 * donc la POSITION PHYSIQUE d'un bloc s'écarte d'au plus 0,18 % de sa position
 * nominale au cran le plus large. Le bord d'une plaque peut donc bouger d'environ
 * un quart de rangée au milieu de la carte quand on pince. C'est sous la case et
 * rien ne s'indexe dessus — mais `geometrieDuCran` déclarait jusqu'ici que ce
 * 0,18 % n'avait AUCUN lecteur, et il en a un depuis ce lot.
 *
 * @param {number} by indice de bloc, axe des rangées
 * @returns {number} rangée de carte, non bornée et non entière
 */
export function rangeeDuBloc(by) {
  return (by * PAS_SOURCE + COTE_SOURCE / 2) / PIXELS_SOURCE_PAR_CASE + 1;
}

/**
 * La famille d'un bloc : sa rangée décide des parts, le bruit lissé tranche.
 *
 * @param {number} graine graine de la partie
 * @param {number} by indice de bloc, axe des rangées
 * @param {number} bx indice de bloc, axe des colonnes
 * @returns {number} rang dans `FAMILLES`
 */
export function familleDuBloc(graine, by, bx) {
  const { c1, c2, c3 } = partsCumulees(partOuvrageDeLaRangee(rangeeDuBloc(by)));
  const u = bruitDeFamille(graine, by, bx);
  if (u < c3) return 3;
  if (u < c2) return 2;
  if (u < c1) return 1;
  return 0;
}

/**
 * Ce que le hachage dit d'un bloc de la grille.
 *
 * ⚠⚠ SEPT, TROIS ET QUATRE NE SONT PAS DES PUISSANCES DE DEUX, ET LE BIAIS SE
 * DÉCLARE. Ce commentaire affirmait jusqu'au 08/09 que « huit est une puissance
 * de deux, donc le tirage du dessin est sans biais », en ajoutant « le jour où
 * une neuvième planche arriverait, il faudra le dire ». Ce jour est celui-ci :
 * trois familles sur quatre ont un effectif qui ne divise pas 2³², donc `h % n`
 * penche vers les petits restes. Le biais relatif vaut `n / 2³²`, soit **moins
 * de 2⁻²⁹** pour sept — un dessin sur cinq cents millions de blocs. C'est le
 * même ordre que celui que `sim/poi.js` déclare et accepte, et il est accepté
 * ici pour la même raison : le corriger demanderait de retirer un tirage, donc
 * de rendre le nombre de tirages dépendant du résultat.
 *
 * ⚠ L'OCRE, ELLE, RESTE EXACTE. Huit divise 2³², donc `h % 8` vaut `h & 7` : à
 * graine égale, le bas de la carte tire exactement le dessin qu'il tirait avant
 * le lot.
 *
 * ⚠ ET LES SIX BITS SONT PRIS PAR LE BAS. Le module d'avant portait la faute
 * inverse en mémoire — des champs découpés dans les trois bits de tête d'un mot
 * déjà entamé, donc toujours minuscules, donc toutes les tuiles du même côté.
 * Trois, deux, un : le compte est écrit ici pour qu'un quatrième champ sache
 * d'où partir. ⚠ Le dessin prend le mot ENTIER par le modulo, la rotation les
 * bits 3–4 et le miroir le bit 5 : sept étant impair, `h % 7` et `(h >>> 3) & 3`
 * restent indépendants.
 *
 * @param {number} graine graine de la partie
 * @param {number} by indice de bloc, axe des rangées
 * @param {number} bx indice de bloc, axe des colonnes
 * @returns {{sol: number, rotation: number, miroir: boolean, famille: number}}
 */
export function descriptionDuBloc(graine, by, bx) {
  const h = hachageBrut(graine, by, bx, SEL_BLOC);
  const famille = familleDuBloc(graine, by, bx);
  return {
    sol: DEBUT_DE_FAMILLE[famille] + (h % FAMILLES[famille].noms.length),
    rotation: (h >>> 3) & 3,
    miroir: ((h >>> 5) & 1) === 1,
    famille,
  };
}

/**
 * Le profil de poids d'un bloc sur un axe, échantillonné à sa taille d'écran.
 *
 * `1` sur tout l'intérieur, `sin²(π/2 · t)` sur le fondu de chaque bord.
 *
 * ⚠⚠ C'EST LA COMPLÉMENTARITÉ QUI COMPTE, PAS LA FORME. Le profil montant d'un
 * bloc et le profil descendant de son voisin couvrent EXACTEMENT la même bande
 * — c'est ce que `PAS = COTE − FONDU` veut dire — et `sin²θ + cos²θ = 1` les
 * fait sommer à un, au pixel près, sans que rien n'ait à être normalisé après
 * coup. Une rampe linéaire sommerait à un elle aussi, mais avec une cassure de
 * pente aux deux bouts de la bande, qui se lit comme un liseré ; le `sin²` n'en
 * a pas.
 *
 * ⚠ LE CENTRE DU PIXEL, PAS SON BORD. Sans le demi-pixel, le profil est
 * asymétrique d'un pixel et le semis dérive doucement vers un coin — la faute
 * que l'ancien masque avait déjà payée.
 *
 * @param {number} taille côté du bloc à l'écran, en pixels
 * @param {number} fondu largeur du fondu à l'écran, en pixels
 * @returns {Float64Array}
 */
export function profilDuBloc(taille, fondu) {
  if (!Number.isInteger(taille) || taille <= 0) {
    throw new RangeError(`terrain : taille de bloc « ${taille} » invalide`);
  }
  if (!Number.isInteger(fondu) || fondu < 0 || fondu * 2 > taille) {
    throw new RangeError(`terrain : fondu « ${fondu} » hors de 0…${Math.floor(taille / 2)}`);
  }
  const p = new Float64Array(taille).fill(1);
  for (let i = 0; i < fondu; i += 1) {
    const t = (i + 0.5) / fondu;
    const w = Math.sin((Math.PI * t) / 2) ** 2;
    p[i] = w;
    p[taille - 1 - i] = w;
  }
  return p;
}

/**
 * Les arrêts du dégradé de teinte d'une dalle, en fraction de sa hauteur.
 *
 * ⚠⚠ DEUX ARRÊTS NE SUFFISENT PAS QUAND UNE DALLE ENJAMBE UN COUDE. La rampe de
 * teinte est linéaire PAR MORCEAUX : posés aux seuls bords de la dalle, les
 * arrêts feraient interpoler le navigateur EN DROITE là où la fonction casse, et
 * la dalle voisine — dont les bords tombent ailleurs — casserait au même endroit
 * avec une autre pente. Le raccord se verrait, en biais, à l'endroit exact où le
 * joueur regarde la bascule. On pose donc un arrêt à CHAQUE coude enjambé.
 *
 * ⚠⚠ ET LE CALCUL EST EN COORDONNÉES ABSOLUES DE CARTE. `y0` est le coin haut de
 * la dalle en pixels d'écran absolus, jamais une coordonnée locale : c'est
 * l'invariant du module — une zone rendue en une dalle doit être identique à la
 * même rendue en quatre. Calculer la teinte relativement à la dalle donnerait un
 * dégradé qui recommence à chaque dalle, soit des bandes horizontales de la
 * taille d'une dalle sur toute la carte.
 *
 * ⚠ LES ARRÊTS SONT RENDUS DANS L'ORDRE CROISSANT ET BORNÉS À [0, 1] :
 * `addColorStop` refuse le reste.
 *
 * @param {number} y0 coin haut de la dalle, en pixels écran absolus
 * @param {number} cote côté de la dalle, en pixels écran
 * @param {number} cran pixels physiques par case
 * @returns {Array<{s: number, t: number}>} au moins deux arrêts
 */
export function arretsDeTeinte(y0, cote, cran) {
  const rangeeDuY = (y) => y / cran + 1;
  const positions = [0, 1];
  for (const coude of COUDES_DE_TEINTE) {
    const s = ((coude - 1) * cran - y0) / cote;
    if (s > 0 && s < 1) positions.push(s);
  }
  positions.sort((a, b) => a - b);
  return positions.map((s) => ({ s, t: partDeTeinteDeLaRangee(rangeeDuY(y0 + s * cote)) }));
}

/**
 * Les blocs qui mordent sur une dalle, et où ils tombent DEDANS.
 *
 * ⚠⚠ `x0` ET `y0` SONT DES PIXELS ABSOLUS DE LA CARTE, jamais des coordonnées
 * de dalle — c'est ce qui rend les dalles indépendantes. Ce que la fonction
 * rend, en revanche, est LOCAL à la dalle : `x` et `y` sont le coin du bloc
 * relativement à elle, et ils peuvent être négatifs, un bloc mordant sur la
 * dalle par la gauche ou par le haut.
 *
 * ⚠ TOUT EST ENTIER, ET ÇA VIENT DE `geometrieDuCran`. Le pas est arrondi une
 * fois pour toutes au cran, donc `bx · pas` est un entier de la CARTE, calculé
 * sans jamais consulter la dalle qui le demande — l'arrondi est global, comme
 * il l'était dans le module d'avant et pour la même raison.
 *
 * @param {object} options
 * @param {number} options.graine graine de la partie
 * @param {number} options.cran pixels physiques par case, un cran de `ZOOM_CARTE`
 * @param {number} options.x0 coin gauche de la dalle, en pixels écran absolus
 * @param {number} options.y0 coin haut de la dalle
 * @param {number} options.cote côté de la dalle, en pixels écran
 * @returns {Array<{sol: number, rotation: number, miroir: boolean,
 *   x: number, y: number, taille: number}>}
 */
export function blocsDeLaDalle({ graine, cran, x0, y0, cote }) {
  if (!Number.isInteger(x0) || !Number.isInteger(y0)) {
    throw new RangeError(`terrain : coin de dalle non entier (${x0}, ${y0})`);
  }
  if (!Number.isInteger(cote) || cote <= 0) {
    throw new RangeError(`terrain : côté de dalle « ${cote} » invalide`);
  }
  const { taille, pas } = geometrieDuCran(cran);

  // Un bloc d'indice `b` couvre `[b·pas, b·pas + taille)` : il mord sur
  // `[d0, d0 + cote)` dès que `b·pas < d0 + cote` et `b·pas + taille > d0`.
  const premier = (d0) => Math.floor((d0 - taille) / pas) + 1;
  const dernier = (d0) => Math.ceil((d0 + cote) / pas) - 1;

  const blocs = [];
  for (let by = premier(y0); by <= dernier(y0); by += 1) {
    for (let bx = premier(x0); bx <= dernier(x0); bx += 1) {
      const { sol, rotation, miroir } = descriptionDuBloc(graine, by, bx);
      blocs.push({
        sol, rotation, miroir, taille,
        x: bx * pas - x0,
        y: by * pas - y0,
      });
    }
  }
  return blocs;
}
