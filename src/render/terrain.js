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
 * Les huit planches, dans l'ordre où Ethan les a envoyées.
 *
 * ⚠ L'ORDRE EST LE NOM. Le hachage rend un rang, et ce rang n'a que cette liste
 * pour désigner un dessin : la réordonner rebattrait le sol de toutes les
 * cartes de toutes les graines. `tools/sols.py` porte la même liste, et un test
 * les confronte au manifeste.
 */
export const NOMS_DU_SOL = Object.freeze(
  Array.from({ length: 8 }, (_, i) => `sol_carte_${i + 1}`),
);

/**
 * Le côté d'une planche, en pixels SOURCE.
 *
 * ⚠ IL EST ÉCRIT ICI ET MESURÉ AILLEURS. `render/` est pur : il ne lit aucun
 * fichier, et `naturalWidth` n'existe qu'une fois l'image décodée par un
 * navigateur. La constante est donc au code, et un test la confronte à
 * `art/sprites/sol/sol-empreintes.json` — elle tombe au dépôt, pas chez le
 * joueur. Même motif que `render/fond.js` depuis le lot MUR-PEINT.
 */
export const COTE_SOURCE = 1254;

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

/**
 * Ce que le hachage dit d'un bloc de la grille.
 *
 * ⚠ HUIT EST UNE PUISSANCE DE DEUX, DONC LE TIRAGE DU DESSIN EST SANS BIAIS.
 * `h % 8` et `h & 7` rendent ici la même chose, et aucun reste ne penche — le
 * biais de modulo que `sim/poi.js` déclare et accepte n'a pas d'équivalent.
 * Le jour où une neuvième planche arriverait, il faudra le dire.
 *
 * ⚠ ET LES SIX BITS SONT PRIS PAR LE BAS. Le module d'avant portait la faute
 * inverse en mémoire — des champs découpés dans les trois bits de tête d'un mot
 * déjà entamé, donc toujours minuscules, donc toutes les tuiles du même côté.
 * Trois, deux, un : le compte est écrit ici pour qu'un quatrième champ sache
 * d'où partir.
 *
 * @param {number} graine graine de la partie
 * @param {number} by indice de bloc, axe des rangées
 * @param {number} bx indice de bloc, axe des colonnes
 * @returns {{sol: number, rotation: number, miroir: boolean}}
 */
export function descriptionDuBloc(graine, by, bx) {
  const h = hachageBrut(graine, by, bx, SEL_BLOC);
  return {
    sol: h & 7,
    rotation: (h >>> 3) & 3,
    miroir: ((h >>> 5) & 1) === 1,
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
