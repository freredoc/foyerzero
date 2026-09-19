// Lot ANCRES-ZÉNITH — 19/09/2026. Les socles et les tourelles de défense sont
// passés du top-down 75° au zénithal ; les deux détecteurs géométriques de
// `tools/chassis.py` et `tools/ancres-defense.py` avaient été écrits pour le
// 75° et RENDAIENT DES VALEURS FAUSSES SANS LEVER : `socle_def_o_creneau` à
// 82,7 % de diamètre et +7,3 % là où ses jumeaux carrés rendent 55 % et −0,2,
// et les trois socles-marcheurs rejetés — voir `rapports/RAPPORT-lotANCRES-ZENITH.md`.
//
// ⚠⚠ CE FICHIER CONFRONTE LA TABLE AU DESSIN, PAS À SON JSON. `sprite.test.js`
// garde déjà « la transcription vaut le JSON » ; c'est la copie contre sa
// source, et §0 de `CLAUDE.md` dit depuis SPRITES-V2-JOUEUR ce que ça ne peut
// pas voir : « le test comparait la transcription à son JSON, jamais la source
// au DESSIN ». Ici on relit `art/sources/`, en RVB, et on refait la mesure par
// une AUTRE voie que celle de l'outil — c'est ce qui rend l'accord probant.
//
// ⚠⚠ DEUX MESURES INDÉPENDANTES, ET IL FAUT QU'ELLES LE RESTENT. `chassis.ancre`
// coupe aux PERCENTILES de luminance de la pièce, REMPLIT les anneaux fermés
// (`fill_holes`), et retient le plus gros candidat sous quatre contraintes de
// forme. Ce test-ci ne fait rien de tout ça : un seuil ABSOLU (somme RVB < 200),
// une ouverture qui efface les traits, une fermeture qui recolle la croix
// métallique du socle joueur, puis la plus grande composante sombre qui ne
// touche pas le fond — le trou du logement, et rien qu'un centroïde. Aucun
// percentile, aucun remplissage, aucune rondeur. Si un jour l'outil reprend
// cette recette, ce test ne prouvera plus rien et il faudra le dire.
//
// ⚠ IL EST ROUGE AVANT LE LOT, ET C'EST MESURÉ. Joué contre la table du 08/09
// (logements 75°, y de −17,6 à −35,3) sur les dessins zénithaux : les neuf
// tombent, écarts de 15,7 à 34,7 % du côté. Un test déjà vert ne prouverait
// rien.
//
// ⚠ ET IL NE PORTE QUE SUR LES NEUF SOCLES REDESSINÉS. Les trois socles
// d'artillerie du joueur sont restés à 75° — arbitrage d'Ethan du 19/09, « si
// j'ai pas modifié, c'est qu'il n'y a pas besoin » —, et sur un trou vu de
// biais la recette ci-dessous ne trouve pas le logement (mesuré : la paroi
// intérieure éclairée n'est pas sombre, la plus grande tache enfermée est
// ailleurs). Ils sont gardés par `AZ T2`, qui dit la table MIXTE de face.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decoderRgba } from './png-rgba.js';
import { ANCRES_DEFENSE } from '../src/data/ancres-defense.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = join(RACINE, 'art', 'sources');

/** Les neuf socles redessinés en zénithal — six de l'Ouvrage, trois du joueur. */
const SOCLES_ZENITHAUX = [
  'socle_def_o_batterie', 'socle_def_o_casemate', 'socle_def_o_creneau',
  'socle_def_o_faucheuse', 'socle_def_o_harpon', 'socle_def_o_mortier',
  'socle_def_j_batterie', 'socle_def_j_casemate', 'socle_def_j_creneau',
];

/** Les trois socles d'artillerie du joueur, toujours à 75° — non redessinés. */
const SOCLES_75_SURVIVANTS = ['socle_def_j_faucheuse', 'socle_def_j_harpon', 'socle_def_j_mortier'];

// Le seuil de « sombre », en somme RVB. Mesuré sur les neuf dessins : l'intérieur
// du logement vaut 129 à 186, le plateau et les plaques 230 et au-delà. 200 est
// entre les deux, loin des deux.
const SOMBRE = 200;
// Ouverture : rayon 1 % de la largeur du sujet — efface les traits (contours,
// ombres fines, 4 à 8 px sur un dessin de 1 024) et garde les taches.
const OUVERTURE_PCT = 1.0;
// Fermeture : rayon 2,5 % — recolle les quatre quartiers du disque du socle
// joueur, séparés par la croix métallique peinte sur le trou (bras ~40 px).
const FERMETURE_PCT = 2.5;
// Tolérance : 2 % du côté du sujet, la borne du brief. Mesuré au lot : 0,05 en
// x, 0,70 en y au pire — la croix décale un peu le centroïde du joueur.
const TOLERANCE_PCT = 2;

/**
 * Réduit l'image d'un facteur deux par moyenne de blocs 2 × 2 — la précision
 * du centroïde est en pixels, la tolérance en dizaines : la demi-résolution
 * divise le coût par quatre sans rien changer au verdict.
 */
function demiResolution({ largeur, hauteur, pixels }) {
  const l = largeur >> 1;
  const h = hauteur >> 1;
  const somme = new Uint16Array(l * h);
  const fond = new Uint8Array(l * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      let r = 0; let g = 0; let b = 0;
      for (const [dy, dx] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
        const i = ((2 * y + dy) * largeur + 2 * x + dx) * 4;
        r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2];
      }
      r >>= 2; g >>= 2; b >>= 2;
      somme[y * l + x] = r + g + b;
      // La clé est le magenta, et la distance de 140 est celle de `cond.est_fond`.
      fond[y * l + x] = (r - 255) ** 2 + g ** 2 + (b - 255) ** 2 < 140 * 140 ? 1 : 0;
    }
  }
  return { l, h, somme, fond };
}

/** Érosion (`min`) ou dilatation (`max`) par un carré de demi-côté k, séparable. */
function morpho(m, l, h, k, dilater) {
  const vide = dilater ? 0 : 1;
  const passe = (src, dst, longueur, pas, debut) => {
    for (let i = 0; i < longueur; i++) {
      let v = vide;
      for (let j = Math.max(0, i - k); j <= Math.min(longueur - 1, i + k); j++) {
        const p = src[debut + j * pas];
        if (dilater ? p > v : p < v) v = p;
      }
      dst[debut + i * pas] = v;
    }
  };
  const tmp = new Uint8Array(l * h);
  const out = new Uint8Array(l * h);
  for (let y = 0; y < h; y++) passe(m, tmp, l, 1, y * l);
  for (let x = 0; x < l; x++) passe(tmp, out, h, l, x);
  return out;
}

/** Composantes 4-connexes ; rend les étiquettes (0 = rien) et le nombre. */
function etiqueter(m, l, h) {
  const lab = new Int32Array(l * h);
  const pile = new Int32Array(l * h);
  let n = 0;
  for (let s = 0; s < l * h; s++) {
    if (!m[s] || lab[s]) continue;
    n += 1;
    let sommet = 0;
    pile[sommet++] = s; lab[s] = n;
    while (sommet) {
      const i = pile[--sommet];
      const x = i % l; const y = (i - x) / l;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= l || ny >= h) continue;
        const j = ny * l + nx;
        if (m[j] && !lab[j]) { lab[j] = n; pile[sommet++] = j; }
      }
    }
  }
  return { lab, n };
}

/**
 * Le trou du logement : la plus grande composante sombre ENFERMÉE dans le
 * sujet — aucun de ses pixels n'est voisin du fond ni du bord. Rend son
 * centroïde dans le référentiel de `chassis.ancre` : en pourcentage de la
 * largeur et de la hauteur du sujet, depuis le centre de sa boîte.
 */
function trouDuLogement(chemin) {
  const { l, h, somme, fond } = demiResolution(decoderRgba(chemin));
  let x0 = l; let x1 = -1; let y0 = h; let y1 = -1;
  const sombre = new Uint8Array(l * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      const i = y * l + x;
      if (fond[i]) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (somme[i] < SOMBRE) sombre[i] = 1;
    }
  }
  const W = x1 - x0 + 1; const H = y1 - y0 + 1;
  const ko = Math.max(1, Math.round(OUVERTURE_PCT / 100 * W));
  const kf = Math.max(1, Math.round(FERMETURE_PCT / 100 * W));
  let tache = morpho(morpho(sombre, l, h, ko, false), l, h, ko, true);   // ouverture
  tache = morpho(morpho(tache, l, h, kf, true), l, h, kf, false);        // fermeture
  const { lab, n } = etiqueter(tache, l, h);
  const taille = new Int32Array(n + 1);
  const touche = new Uint8Array(n + 1);
  const sx = new Float64Array(n + 1);
  const sy = new Float64Array(n + 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      const c = lab[y * l + x];
      if (!c) continue;
      taille[c] += 1; sx[c] += x; sy[c] += y;
      if (x === 0 || y === 0 || x === l - 1 || y === h - 1
        || fond[y * l + x - 1] || fond[y * l + x + 1] || fond[(y - 1) * l + x] || fond[(y + 1) * l + x]) {
        touche[c] = 1;
      }
    }
  }
  let meilleur = 0;
  for (let c = 1; c <= n; c++) if (!touche[c] && taille[c] > taille[meilleur]) meilleur = c;
  if (!meilleur) return null;
  return {
    x_pct: ((sx[meilleur] / taille[meilleur]) - (x0 + W / 2)) / W * 100,
    y_pct: ((sy[meilleur] / taille[meilleur]) - (y0 + H / 2)) / H * 100,
    part: taille[meilleur] / (W * H),
  };
}

test('AZ T1 — sur les neuf socles zénithaux, le logement de la table est le trou du dessin, à 2 % près', () => {
  // Montage falsifiable d'abord : la recette doit TROUVER une tache, et une
  // tache qui compte — pas un rivet. Un `null` ou une poussière rendrait la
  // comparaison ci-dessous vide de sens, et les deux socles carrés de l'Ouvrage
  // portent un trou de 43 % de leur largeur, soit 15 % de leur boîte.
  const ecarts = [];
  for (const cle of SOCLES_ZENITHAUX) {
    const ancre = ANCRES_DEFENSE[cle];
    assert.ok(ancre, `${cle} : absente de la table`);
    const trou = trouDuLogement(join(SOURCES, `${cle}.png`));
    assert.ok(trou, `${cle} : aucune tache sombre enfermée dans le sujet`);
    assert.ok(trou.part > 0.01, `${cle} : la tache trouvée ne fait que ${(100 * trou.part).toFixed(2)} % de la boîte`);
    const dx = Math.abs(trou.x_pct - ancre.x_pct);
    const dy = Math.abs(trou.y_pct - ancre.y_pct);
    ecarts.push([cle, dx, dy]);
    assert.ok(dx < TOLERANCE_PCT && dy < TOLERANCE_PCT,
      `${cle} : la table pose le logement en (${ancre.x_pct}, ${ancre.y_pct}) %, le dessin le porte en `
      + `(${trou.x_pct.toFixed(2)}, ${trou.y_pct.toFixed(2)}) % — écart ${Math.max(dx, dy).toFixed(2)} %`);
  }
  assert.equal(ecarts.length, 9, 'les neuf socles n\'ont pas tous été mesurés');
  // ⚠ ET LA MESURE SAIT DISTINGUER : rejouée contre les valeurs 75° d'avant le
  // lot, elle rend des écarts de 16 à 35 %. Le test le tient de face : une
  // table qui remettrait le logement de l'Ouvrage à un quart au-dessus du
  // centre, comme au 08/09, doit tomber ici.
  for (const cle of SOCLES_ZENITHAUX.filter((c) => c.startsWith('socle_def_o_'))) {
    const trou = trouDuLogement(join(SOURCES, `${cle}.png`));
    assert.ok(Math.abs(trou.y_pct - (-26.0)) > TOLERANCE_PCT, `${cle} : l'appât 75° passerait — le montage ne mesure rien`);
  }
});

test('AZ T2 — la table est MIXTE : neuf logements zénithaux centrés, trois logements 75° au-dessus du centre', () => {
  // ⚠⚠ C'EST VOULU, ET CE TEST EXISTE POUR QUE LE PROCHAIN LECTEUR NE
  // « HARMONISE » PAS. Les six socles Ouvrage et les trois socles de tourelle du
  // joueur sont redessinés vu de dessus, leur logement est au centre. Les trois
  // socles d'artillerie du joueur n'ont PAS été redessinés — arbitrage d'Ethan
  // du 19/09 —, et l'ancre décrit le socle : le socle n'a pas bougé, l'ancre non
  // plus. Les relancer dans un détecteur réparé pour une autre géométrie
  // rendrait d'ailleurs les MÊMES nombres (T1 du lot : identiques au bit sur
  // les 30 pièces 75°). Une ancre centrée sur l'un de ces trois-là ne peut
  // venir que d'un socle redessiné, et c'est un lot qui le dira.
  for (const cle of SOCLES_ZENITHAUX) {
    assert.ok(Math.abs(ANCRES_DEFENSE[cle].y_pct) < TOLERANCE_PCT,
      `${cle} : logement à ${ANCRES_DEFENSE[cle].y_pct} % — un socle zénithal porte son trou au centre`);
  }
  for (const cle of SOCLES_75_SURVIVANTS) {
    // Mesuré le 05/09 et inchangé : −11,1 · −11,8 · −10,9. Un plateau vu de
    // biais est toujours au-dessus du centre de la pièce, sa face avant est
    // dessous ; la borne est large (−5) pour ne pas épingler un centième.
    assert.ok(ANCRES_DEFENSE[cle].y_pct < -5,
      `${cle} : logement à ${ANCRES_DEFENSE[cle].y_pct} % — ce socle 75° a-t-il été redessiné sans le dire ?`);
  }
  // Et les deux listes couvrent exactement la moitié joueur + la moitié Ouvrage.
  const tous = [...SOCLES_ZENITHAUX, ...SOCLES_75_SURVIVANTS].sort();
  assert.deepEqual(tous, Object.keys(ANCRES_DEFENSE).sort(), 'les douze clés de la table ne sont pas toutes classées');
});
