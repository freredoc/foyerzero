// Le fond de la carte — un pavage organique, sans DOM et sans canevas.
//
// Ce module ne dessine pas : il REND DES PIXELS. On lui donne un atlas de
// tuiles, une graine, un cran de zoom et le coin d'une dalle ; il rend un
// tableau RGBA. Le canevas, le cache et le défilement vivent dans `src/ui/`.
//
// ---------------------------------------------------------------------------
// ⚠⚠ CE N'EST PAS DE LA COMPOSITION ALPHA, ET C'EST TOUT LE MODULE
// ---------------------------------------------------------------------------
//
// La formule est, par canal :
//
//     sortie = μ + ( Σ wᵢ·(tᵢ − μ) ) / √( Σ wᵢ² )
//
// où `μ` est la moyenne de l'atlas et `wᵢ` le masque de la tuile `i` au pixel.
// `drawImage` avec `globalAlpha` calcule `Σwᵢtᵢ / Σwᵢ`, qui n'est PAS ça :
// moyenner N textures divise leur écart-type par √N, et le fond devient plat.
// La division par `√(Σwᵢ²)` au lieu de `Σwᵢ` est exactement ce qui rend
// l'écart-type d'une seule tuile — c'est la normalisation d'une somme de
// variables indépendantes, pas celle d'une moyenne.
//
// ⚠ LE RACCOURCI A ÉTÉ ESSAYÉ ET IL NE MARCHE PAS. Composer en alpha ordinaire
// puis « rattraper » le contraste en répartissant par quintiles amplifie le
// bruit au lieu de rendre le relief. Ne pas le refaire.
//
// D'où l'accumulation à la main dans des `Float32Array` : trois accumulateurs
// pour la sortie — la somme pondérée centrée, `Σw`, `Σw²` — et un quatrième
// pour l'appartenance de camp.
//
// ---------------------------------------------------------------------------
// ⚠ CHAQUE DALLE SE CALCULE SEULE, ET RIEN NE DOIT DÉPENDRE DE SES VOISINES
// ---------------------------------------------------------------------------
//
// Le réseau est semé par la position ABSOLUE en pixels : le coin d'une dalle
// n'entre nulle part dans un hachage, et la position d'une tuile à l'écran est
// un entier calculé globalement, jamais relativement à la dalle. Deux dalles
// adjacentes se raccordent donc exactement, et une zone rendue en une dalle est
// identique à la même zone rendue en quatre. Un test l'asserte, parce que c'est
// l'invariant qui casserait en silence — une couture ne fait pas tomber un
// test, elle se voit six semaines plus tard sur un téléphone.
//
// C'est aussi pour ça que les seuils de teinte sont GLOBAUX et non calculés
// dalle par dalle : deux découpages différents de part et d'autre d'un bord
// donneraient une couture nette là où le pavage n'en a pas.

import {
  GEOGRAPHIE, TERRAIN_CARTE, ZOOM_CARTE, PIXELS_SOURCE_PAR_CASE,
} from '../data/sites.js';
import { hachageBrut } from '../sim/peuplement.js';
import { niveauDeLaRangee } from '../sim/carte.js';

/**
 * Les deux sels du pavage.
 *
 * ⚠ ILS SONT DEUX PARCE QU'UN HACHAGE N'A QUE TRENTE-DEUX BITS. Le premier
 * porte les deux décalages — seize bits chacun, tout le mot — et le second le
 * numéro de tuile, la rotation, le miroir et le tirage d'appartenance. Tout
 * prendre au même hachage demanderait quarante-neuf bits ; les tasser, c'est
 * exactement la faute des « bits épuisés » qui faisait basculer toutes les
 * tuiles du même côté pendant la maquette.
 */
export const SEL_DECALAGE = 2;
export const SEL_FIGURE = 3;

/** Le nombre de teintes d'une rampe de sol. Les deux en ont autant. */
export const NB_TEINTES = TERRAIN_CARTE.rampes.joueur.length;

/**
 * Un atlas de tuiles, prêt à être pavé.
 *
 * ⚠ LES VALEURS SONT DES INDICES DE TEINTE, PAS DES COULEURS. L'atlas livré est
 * une image indexée sur la rampe du joueur : chacun de ses pixels vaut 0 à 4,
 * et la mesure dit que les cinq occupent 20,0 % de la surface chacun. Travailler
 * sur l'indice plutôt que sur une luminance en 0–255 n'est pas une
 * simplification : les cinq teintes sont réparties à clarté régulière (L* 58,1 ·
 * 62,9 · 68,0 · 73,0 · 77,9, soit un pas de 4,95 ± 0,15), donc l'indice EST la
 * luminance à une transformation affine près — et la formule comme les quantiles
 * qui la suivent sont invariants par transformation affine.
 *
 * ⚠ ET C'EST CE QUI PERMET AUX DEUX RAMPES DE PARTAGER L'ATLAS. Le camp du sol
 * choisit la rampe ; l'indice, lui, ne change pas. « Repeindre à index
 * constant » ne touche donc ni au contraste ni à la garantie de clarté de
 * `FICHE-STYLE.md`.
 *
 * @param {Uint8Array} valeurs indices de teinte, image entière, ligne par ligne
 * @param {number} cote côté d'une tuile, en pixels
 * @param {number} largeur largeur de l'image, en pixels
 * @returns {{valeurs: Uint8Array, cote: number, largeur: number,
 *   colonnes: number, nombre: number, moyenne: number}}
 */
export function creerAtlas(valeurs, cote, largeur) {
  if (!Number.isInteger(cote) || cote <= 0) {
    throw new RangeError(`terrain : côté de tuile « ${cote} » invalide`);
  }
  if (!Number.isInteger(largeur) || largeur % cote !== 0) {
    throw new RangeError(`terrain : largeur ${largeur} non divisible par ${cote}`);
  }
  const colonnes = largeur / cote;
  const hauteur = valeurs.length / largeur;
  if (!Number.isInteger(hauteur) || hauteur % cote !== 0) {
    throw new RangeError(`terrain : hauteur ${hauteur} non divisible par ${cote}`);
  }
  let somme = 0;
  for (let i = 0; i < valeurs.length; i += 1) {
    if (valeurs[i] >= NB_TEINTES) {
      throw new RangeError(
        `terrain : l'atlas porte l'indice ${valeurs[i]}, hors de 0…${NB_TEINTES - 1}`,
      );
    }
    somme += valeurs[i];
  }
  return {
    valeurs,
    cote,
    largeur,
    colonnes,
    nombre: colonnes * (hauteur / cote),
    moyenne: somme / valeurs.length,
  };
}

/**
 * Les huit orientations d'une tuile, sous forme affine.
 *
 * Une orientation envoie le pixel source `(sx, sy)` sur le pixel d'atlas
 * `(ox + a·sx + b·sy, oy + c·sx + d·sy)`. C'est écrit ainsi — plutôt qu'en
 * huit `if` — parce que le rendu a besoin de sortir `a` et `c` de la boucle
 * intérieure : à `sy` fixé, l'indice dans l'atlas devient une progression
 * arithmétique, un ajout par pixel au lieu de deux multiplications.
 *
 * Le miroir s'applique AVANT la rotation, sur `sx`. L'ordre n'a pas
 * d'importance visuelle — les huit compositions sont les mêmes dans les deux
 * sens — mais il en a une pour la reproductibilité, donc il est fixé ici.
 *
 * @param {number} rotation 0 à 3, quarts de tour
 * @param {boolean} miroir
 * @param {number} cote côté de la tuile
 * @returns {{a: number, b: number, c: number, d: number, ox: number, oy: number}}
 */
export function orientationDeLaTuile(rotation, miroir, cote) {
  const n = cote - 1;
  // Les quatre rotations, dans l'ordre des quarts de tour.
  const ROTATIONS = [
    { a: 1, b: 0, c: 0, d: 1, ox: 0, oy: 0 },
    { a: 0, b: -1, c: 1, d: 0, ox: n, oy: 0 },
    { a: -1, b: 0, c: 0, d: -1, ox: n, oy: n },
    { a: 0, b: 1, c: -1, d: 0, ox: 0, oy: n },
  ];
  const r = ROTATIONS[rotation & 3];
  if (!miroir) return { ...r };
  // sx devient n − sx : les coefficients en `sx` changent de signe, et ce que
  // valait `a·n` passe dans l'offset.
  return {
    a: -r.a, b: r.b, c: -r.c, d: r.d,
    ox: r.ox + r.a * n, oy: r.oy + r.c * n,
  };
}

/**
 * Le masque, échantillonné sur le côté d'une tuile à l'écran.
 *
 * Cosinus surélevé, SÉPARABLE : `m(u) = 0,5 − 0,5·cos(π·(1 − |u|))` avec
 * `u ∈ [−1, 1]`, appliqué en produit sur les deux axes. Il vaut 1 au centre et
 * 0 aux deux bords, sans discontinuité de pente — c'est ce qui empêche qu'on
 * lise le contour d'une tuile dans le fond.
 *
 * @param {number} cotePx côté de la tuile à l'écran, en pixels
 * @returns {Float64Array}
 */
export function masqueDeLaTuile(cotePx) {
  const m = new Float64Array(cotePx);
  const demi = cotePx / 2;
  for (let i = 0; i < cotePx; i += 1) {
    // Le centre du pixel, pas son bord : sans le demi-pixel, le masque est
    // asymétrique d'un pixel et le semis dérive doucement vers un coin.
    const u = (i + 0.5) / demi - 1;
    m[i] = 0.5 - 0.5 * Math.cos(Math.PI * (1 - Math.abs(u)));
  }
  return m;
}

/**
 * Ce que le hachage dit d'un nœud du réseau.
 *
 * ⚠ CHAQUE CHAMP A SES BITS, ET ILS SONT COMPTÉS ICI. Décalages : seize bits
 * chacun, sur le premier hachage. Tuile : six bits — assez pour soixante-quatre.
 * Rotation : deux. Miroir : un. Appartenance : les vingt-trois qui restent.
 * Aucun champ ne se sert dans les trois bits de tête d'un mot déjà découpé,
 * ce qui est la faute que ce module se souvient d'avoir vue.
 *
 * @param {number} graine graine de la partie
 * @param {number} gy indice de nœud, axe des rangées
 * @param {number} gx indice de nœud, axe des colonnes
 * @param {number} nombreDeTuiles
 * @returns {{decalageY: number, decalageX: number, tuile: number,
 *   rotation: number, miroir: boolean, tirage: number}}
 */
export function descriptionDuNoeud(graine, gy, gx, nombreDeTuiles) {
  const h0 = hachageBrut(graine, gy, gx, SEL_DECALAGE);
  const h1 = hachageBrut(graine, gy, gx, SEL_FIGURE);
  return {
    // De −1 à +1, en fraction du décalage maximal.
    decalageY: ((h0 & 0xffff) / 0x10000) * 2 - 1,
    decalageX: (((h0 >>> 16) & 0xffff) / 0x10000) * 2 - 1,
    tuile: (h1 & 0x3f) % nombreDeTuiles,
    rotation: (h1 >>> 6) & 3,
    miroir: ((h1 >>> 8) & 1) === 1,
    tirage: ((h1 >>> 9) & 0x7fffff) / 0x800000,
  };
}

/**
 * La probabilité qu'une tuile posée sur cette rangée appartienne à l'Ouvrage.
 *
 * ⚠ CETTE FORMULE EST UNE PROPOSITION, PAS UN ARBITRAGE. Elle est linéaire du
 * niveau 1 — la rangée du joueur au départ en vaut 5, donc 8 % de tuiles — au
 * niveau 50, où elle vaut 1 : le bout de la carte est entièrement à l'Ouvrage.
 * Elle tient en une ligne et se change en une ligne.
 *
 * ⚠ LE NIVEAU EST CELUI DE L'OUVRAGE, PAS CELUI DU JOUEUR. `niveauDeLaRangee`
 * le dit en en-tête : la base du joueur porte trois niveaux qui lui sont
 * propres, et aucun ne se déduit d'une rangée.
 *
 * @param {number} rangee
 * @returns {number} de 0 à 1
 */
export function partOuvrageDeLaRangee(rangee) {
  return (niveauDeLaRangee(rangee) - 1) / (GEOGRAPHIE.niveauPlafond - 1);
}

/**
 * La rangée de carte que touche un pixel source donné, bornée à la carte.
 *
 * ⚠ ON BORNE, ON NE LÈVE PAS. Le pavage déborde volontiers des bords : les
 * tuiles qui couvrent le bas de la dernière rangée ont leur centre au-delà, et
 * refuser de les décrire ferait un trou noir sur toute la bordure.
 *
 * @param {number} sourceY
 * @returns {number} rangée de 1 à `GEOGRAPHIE.carte.hauteur`
 */
export function rangeeDuPixelSource(sourceY) {
  const brute = Math.floor(sourceY / PIXELS_SOURCE_PAR_CASE) + 1;
  if (brute < 1) return 1;
  return brute > GEOGRAPHIE.carte.hauteur ? GEOGRAPHIE.carte.hauteur : brute;
}

/**
 * Les quatre seuils, lus une fois. La boucle finale du rendu les compare
 * 262 144 fois par dalle : les relire dans la table à chaque pixel coûtait
 * plusieurs millisecondes pour rien.
 */
const SEUILS = TERRAIN_CARTE.seuilsDeTeinte;

/**
 * L'indice de teinte d'une valeur accumulée.
 * @param {number} z
 * @returns {number} 0 à `NB_TEINTES − 1`
 */
export function teinteDeLaValeur(z) {
  let i = 0;
  while (i < SEUILS.length && z >= SEUILS[i]) i += 1;
  return i;
}

/**
 * L'ordre des octets de la machine.
 *
 * ⚠ IL SE MESURE, IL NE SE SUPPOSE PAS. La passe finale écrit un pixel par
 * entier de 32 bits plutôt que quatre octets clampés — c'est trois fois plus
 * rapide, mesuré — mais l'ordre des octets d'un `ImageData` est RVBA, toujours,
 * quand celui d'un entier dépend de la machine. Tous les navigateurs visés sont
 * en petit-boutiste ; l'écrire en dur reviendrait quand même à parier, et le
 * pari se paierait en couleurs interverties sur un appareil qu'on n'a pas.
 */
const PETIT_BOUTISTE = (() => {
  const sonde = new Uint32Array(1);
  new Uint8Array(sonde.buffer)[0] = 1;
  return sonde[0] === 1;
})();

/** Une rampe de `FICHE-STYLE.md`, décodée une fois en pixels RVBA empaquetés. */
function decoderRampe(hexs) {
  return Uint32Array.from(hexs, (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const v = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return PETIT_BOUTISTE
      ? ((255 << 24) | (b << 16) | (v << 8) | r) >>> 0
      : ((r << 24) | (v << 16) | (b << 8) | 255) >>> 0;
  });
}

const RAMPE_JOUEUR = decoderRampe(TERRAIN_CARTE.rampes.joueur);
const RAMPE_OUVRAGE = decoderRampe(TERRAIN_CARTE.rampes.ouvrage);

/**
 * Les quatre accumulateurs, ENTRELACÉS dans un seul tableau, et gardés d'un
 * appel à l'autre.
 *
 * ⚠ L'ENTRELACEMENT EST UNE MESURE, PAS UNE ÉLÉGANCE. En quatre tableaux
 * séparés d'un mégaoctet, chaque pixel touchait quatre lignes de cache
 * distantes : 21 ms la dalle de 512. Entrelacés — les quatre valeurs d'un
 * pixel côte à côte, donc dans la même ligne de cache — c'est 14 ms, mesuré sur
 * les quatre crans. Un tiers du temps de rendu tenait dans la disposition
 * mémoire, pas dans l'arithmétique.
 *
 * ⚠ ET ILS SONT REMIS À ZÉRO À L'ENTRÉE, jamais lus d'un appel sur l'autre. Le
 * rendu reste une fonction de ses arguments — c'est ce que vérifie de face le
 * test qui rend deux fois la même zone et compare au pixel près.
 */
const tampons = new Map();

/** Les quatre postes d'un pixel dans le tampon entrelacé. */
const SOMME = 0;
const POIDS = 1;
const POIDS_CARRE = 2;
const OUVRAGE = 3;
const POSTES = 4;

function obtenirTampon(cote) {
  let t = tampons.get(cote);
  if (t === undefined) {
    t = new Float32Array(cote * cote * POSTES);
    tampons.set(cote, t);
  }
  t.fill(0);
  return t;
}

/**
 * Pave une dalle du fond de carte.
 *
 * ⚠ `x0` ET `y0` SONT DES PIXELS ABSOLUS DE LA CARTE, jamais des coordonnées de
 * dalle. C'est ce qui rend les dalles indépendantes : le semis est semé par la
 * position, pas par le découpage.
 *
 * @param {object} options
 * @param {object} options.atlas rendu par `creerAtlas`
 * @param {number} options.graine graine de la partie
 * @param {number} options.cran pixels écran par case — un cran de `ZOOM_CARTE`
 * @param {number} options.x0 coin gauche de la dalle, en pixels écran absolus
 * @param {number} options.y0 coin haut de la dalle
 * @param {number} [options.cote] côté de la dalle, en pixels écran
 * @param {boolean} [options.alphaOrdinaire] pour le test de contraste SEULEMENT :
 *   compose en `Σwt / Σw` au lieu de la formule. Voir l'en-tête — ce chemin est
 *   celui qu'on refuse, et il n'existe que pour qu'un test puisse MESURER de
 *   combien il est moins bon plutôt que de le croire sur parole.
 * @returns {{donnees: Uint8ClampedArray, cote: number, couvertureMin: number}}
 *   `couvertureMin` est le plus petit `Σw` de la dalle. ⚠ IL EST RENDU POUR
 *   QU'UN TEST PUISSE MESURER QUE LE PLANCHER NE MORD PAS. À un pas de 56, la
 *   couverture ne s'annule jamais ; à 84, elle s'annulait et le fond rendait du
 *   noir. Sans ce nombre, la garde `sw <= 0` serait une branche que rien ne
 *   distingue d'une branche morte — et le jour où quelqu'un élargirait le pas,
 *   aucun test ne le dirait.
 */
export function rendreDalle({
  atlas, graine, cran, x0, y0, cote = TERRAIN_CARTE.dalleCotePx, alphaOrdinaire = false,
}) {
  if (!ZOOM_CARTE.crans.includes(cran)) {
    throw new RangeError(`terrain : cran ${cran} hors de ${ZOOM_CARTE.crans.join(', ')}`);
  }
  if (!Number.isInteger(x0) || !Number.isInteger(y0)) {
    throw new RangeError(`terrain : coin de dalle non entier (${x0}, ${y0})`);
  }

  // ⚠⚠ UNE TUILE NE FAIT PLUS UNE CASE, ELLE EN FAIT UN QUART — deux par axe,
  // `ZOOM_CARTE.tuilesParCase`. Une case vaut donc `PIXELS_SOURCE_PAR_CASE`
  // pixels source, et le cran est cette même case à l'écran : l'échelle est le
  // rapport des deux. La tuile, elle, suit — `cran / tuilesParCase`.
  //
  // ⚠ C'EST CE RAPPORT QUI DÉCIDE DU GRAIN, et c'est tout le correctif du 30/08.
  // À une tuile par case, l'échelle valait `cran / 128` et montait donc à 2 au
  // cran le plus serré : le pavage agrandissait sa source, et le grain de 4 px
  // de l'art se lisait en carrés de 8 px. À deux tuiles par axe elle vaut
  // `cran / 256`, donc au plus 1 : on ne grossit plus jamais un pixel source.
  const echelle = cran / PIXELS_SOURCE_PAR_CASE;
  const tuilePx = cran / ZOOM_CARTE.tuilesParCase;
  const demiTuile = tuilePx / 2;
  const pasDest = TERRAIN_CARTE.pasSourcePx * echelle;
  const decalageMaxDest = TERRAIN_CARTE.pasSourcePx * TERRAIN_CARTE.decalageFraction * echelle;

  const masque = masqueDeLaTuile(tuilePx);
  // À quel pixel de la tuile source correspond le pixel `i` de la tuile à
  // l'écran. Tabulé : la boucle intérieure ne fait plus que lire.
  const sourceDe = new Int32Array(tuilePx);
  for (let i = 0; i < tuilePx; i += 1) {
    sourceDe[i] = Math.floor((i * atlas.cote) / tuilePx);
  }
  const ecartAtlas = new Int32Array(tuilePx);
  const valeurs = atlas.valeurs;

  const acc = obtenirTampon(cote);
  const mu = atlas.moyenne;

  // Les nœuds qui peuvent mordre sur la dalle. Le demi-pixel vient de l'arrondi
  // du centre : sans lui, une tuile à cheval sur le bord serait oubliée une fois
  // sur deux, et la couture se verrait.
  const marge = demiTuile + decalageMaxDest + 1;
  const gx0 = Math.floor((x0 - marge) / pasDest);
  const gx1 = Math.ceil((x0 + cote + marge) / pasDest);
  const gy0 = Math.floor((y0 - marge) / pasDest);
  const gy1 = Math.ceil((y0 + cote + marge) / pasDest);

  for (let gy = gy0; gy <= gy1; gy += 1) {
    for (let gx = gx0; gx <= gx1; gx += 1) {
      const noeud = descriptionDuNoeud(graine, gy, gx, atlas.nombre);

      const centreY = gy * pasDest + noeud.decalageY * decalageMaxDest;
      const centreX = gx * pasDest + noeud.decalageX * decalageMaxDest;
      // ⚠ L'ARRONDI EST GLOBAL, ET C'EST CE QUI FAIT TENIR LES DALLES ENSEMBLE.
      // Le coin d'une tuile est un entier de la carte, calculé sans jamais
      // consulter la dalle qui la demande.
      const haut = Math.round(centreY) - demiTuile;
      const gauche = Math.round(centreX) - demiTuile;

      // Découpe sur la dalle.
      const jDebut = Math.max(0, y0 - haut);
      const jFin = Math.min(tuilePx, y0 + cote - haut);
      if (jDebut >= jFin) continue;
      const iDebut = Math.max(0, x0 - gauche);
      const iFin = Math.min(tuilePx, x0 + cote - gauche);
      if (iDebut >= iFin) continue;

      // L'appartenance de la tuile se décide sur la rangée de son CENTRE : une
      // tuile déborde sur deux rangées, il faut bien en choisir une, et le
      // centre est la seule qui ne dépende pas du sens de lecture.
      const rangee = rangeeDuPixelSource(centreY / echelle);
      const estOuvrage = noeud.tirage < partOuvrageDeLaRangee(rangee) ? 1 : 0;

      const t = orientationDeLaTuile(noeud.rotation, noeud.miroir, atlas.cote);
      const tuileX = (noeud.tuile % atlas.colonnes) * atlas.cote;
      const tuileY = Math.floor(noeud.tuile / atlas.colonnes) * atlas.cote;
      // À `sy` fixé, l'indice dans l'atlas est une progression arithmétique en
      // `sx` : c'est tout l'intérêt d'avoir écrit les orientations sous forme
      // affine. Le pas est tabulé une fois par tuile, la boucle intérieure ne
      // fait plus qu'une addition.
      const pasAtlas = t.a + t.c * atlas.largeur;
      for (let i = iDebut; i < iFin; i += 1) ecartAtlas[i] = sourceDe[i] * pasAtlas;

      for (let j = jDebut; j < jFin; j += 1) {
        const wy = masque[j];
        const sy = sourceDe[j];
        const baseAtlas = (tuileY + t.oy + t.d * sy) * atlas.largeur
          + tuileX + t.ox + t.b * sy;
        const ligneDalle = ((haut + j - y0) * cote + (gauche - x0)) * POSTES;
        for (let i = iDebut; i < iFin; i += 1) {
          const w = wy * masque[i];
          const k = ligneDalle + i * POSTES;
          const v = valeurs[baseAtlas + ecartAtlas[i]];
          acc[k + SOMME] += w * (v - mu);
          acc[k + POIDS] += w;
          acc[k + POIDS_CARRE] += w * w;
          if (estOuvrage === 1) acc[k + OUVRAGE] += w;
        }
      }
    }
  }

  // ⚠ LA PASSE FINALE COÛTE, ELLE AUSSI. Elle traverse 262 144 pixels : les deux
  // rampes y sont pré-aplaties en octets et les seuils lus hors de la boucle,
  // sinon un tiers du temps de rendu part en accès de propriété.
  const octets = new Uint8ClampedArray(cote * cote * 4);
  const pixels = new Uint32Array(octets.buffer);
  const teinteMoyenne = teinteDeLaValeur(mu);
  const seuilOuvrage = TERRAIN_CARTE.seuilOuvrage;
  let couvertureMin = Infinity;
  for (let pixel = 0; pixel < cote * cote; pixel += 1) {
    const k = pixel * POSTES;
    const sw = acc[k + POIDS];
    if (sw < couvertureMin) couvertureMin = sw;
    // ⚠ LE PLANCHER : jamais de noir. Un pas plus large que 56 laisse des
    // pixels sans aucune tuile, et le noir qui en sortait s'est vu tout de
    // suite sur la maquette. À 56 la couverture ne s'annule pas — mais la
    // garde reste, parce qu'elle coûte une comparaison et qu'un carré noir
    // livré coûte un lot.
    let teinte;
    let part;
    if (sw <= 0) {
      teinte = teinteMoyenne;
      part = 0;
    } else {
      const z = alphaOrdinaire
        ? mu + acc[k + SOMME] / sw
        : mu + acc[k + SOMME] / Math.sqrt(acc[k + POIDS_CARRE]);
      teinte = teinteDeLaValeur(z);
      part = acc[k + OUVRAGE] / sw;
    }
    pixels[pixel] = part >= seuilOuvrage ? RAMPE_OUVRAGE[teinte] : RAMPE_JOUEUR[teinte];
  }
  return { donnees: octets, cote, couvertureMin };
}
