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
  const trou = trouDansLeMasque(l, h, somme, fond);
  if (!trou) return null;
  return {
    x_pct: (trou.cx - (trou.x0 + trou.W / 2)) / trou.W * 100,
    y_pct: (trou.cy - (trou.y0 + trou.H / 2)) / trou.H * 100,
    part: trou.part,
  };
}

/**
 * La recette elle-même, sur un masque déjà posé : `somme` est la somme RVB de
 * chaque pixel, `fond` vaut 1 hors du sujet. Rend le centroïde de la plus
 * grande tache sombre enfermée, en pixels, avec la boîte du sujet — c'est à
 * l'appelant de choisir son référentiel (la pièce, ou la case).
 *
 * ⚠ PARTAGÉE ENTRE LA SOURCE ET LE SPRITE DEPUIS LE LOT CONDITIONNEMENT-ZÉNITH :
 * `AZ T1` la joue sur le dessin RVB à demi-résolution, `CZ T2` sur le sprite
 * RVBA de 128 tel que l'atlas le coud. Une seconde recette écrite pour le sprite
 * aurait été la copie qui vieillit.
 */
function trouDansLeMasque(l, h, somme, fond) {
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
  return { cx: sx[meilleur] / taille[meilleur], cy: sy[meilleur] / taille[meilleur],
    x0, y0, W, H, part: taille[meilleur] / (W * H) };
}

/**
 * Le trou du logement sur un SPRITE cousu — RVBA, pleine résolution, le fond
 * est l'alpha. Rend le centre de la tache en pourcentage du côté de la CASE,
 * depuis le centre de la case : le référentiel de `dx_case_pct` / `dy_case_pct`.
 * `recadrer` centre la boîte de la pièce dans la cellule, donc le centre de la
 * pièce EST le centre de la case, et la comparaison est directe.
 */
function trouDuSprite(chemin) {
  const { largeur, hauteur, pixels } = decoderRgba(chemin);
  const somme = new Uint16Array(largeur * hauteur);
  const fond = new Uint8Array(largeur * hauteur);
  for (let i = 0; i < largeur * hauteur; i++) {
    somme[i] = pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2];
    fond[i] = pixels[i * 4 + 3] < 128 ? 1 : 0;
  }
  const trou = trouDansLeMasque(largeur, hauteur, somme, fond);
  if (!trou) return null;
  return {
    dx_case_pct: (trou.cx + 0.5 - largeur / 2) / largeur * 100,
    dy_case_pct: (trou.cy + 0.5 - hauteur / 2) / hauteur * 100,
    part: trou.part,
  };
}

/**
 * Transformée de distance euclidienne au carré (Felzenszwalb & Huttenlocher),
 * une dimension : d(p) = min_q (p − q)² + f(q). `f` vaut 0 sur le fond, LOIN
 * ailleurs — LOIN fini, un infini ferait des NaN dans les intersections.
 */
const LOIN = 1e12;
function edt1d(f, n, d) {
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/**
 * Le pivot d'une tourelle zénithale, par la règle du lot ANCRES-ZÉNITH — le
 * plus grand disque inscrit dans la silhouette —, refaite ici en JavaScript sur
 * le masque au QUART de la résolution : la transformée de distance exacte, puis
 * le centre du plateau du maximum (à un centième du rayon). Rend le centre en
 * pixels pleine résolution, le rayon, et la distance du pixel de sujet le plus
 * loin du centre du FICHIER, mesurée à pleine résolution.
 */
function pivotDeLaTourelle(chemin) {
  const { largeur, hauteur, pixels } = decoderRgba(chemin);
  const l = largeur >> 2;
  const h = hauteur >> 2;
  const f = new Float64Array(l * h);
  // ⚠ LE FOND EST LA CLÉ MAGENTA, À 140 COMME `cond.est_fond` ; un bloc de 4 × 4
  // est du sujet à la majorité de ses seize pixels.
  let loin = 0;
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const i = (y * largeur + x) * 4;
      const r = pixels[i]; const g = pixels[i + 1]; const b = pixels[i + 2];
      const sujet = (r - 255) ** 2 + g ** 2 + (b - 255) ** 2 >= 140 * 140;
      if (!sujet) continue;
      const d = Math.hypot(x + 0.5 - largeur / 2, y + 0.5 - hauteur / 2);
      if (d > loin) loin = d;
      if ((x >> 2) < l && (y >> 2) < h) f[(y >> 2) * l + (x >> 2)] += 1;
    }
  }
  for (let i = 0; i < l * h; i++) f[i] = f[i] >= 8 ? LOIN : 0;
  // colonnes puis lignes : la distance au fond le plus proche, au carré
  const colonne = new Float64Array(h); const dc = new Float64Array(h);
  for (let x = 0; x < l; x++) {
    for (let y = 0; y < h; y++) colonne[y] = f[y * l + x];
    edt1d(colonne, h, dc);
    for (let y = 0; y < h; y++) f[y * l + x] = dc[y];
  }
  const ligne = new Float64Array(l); const dl = new Float64Array(l);
  let max = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) ligne[x] = f[y * l + x];
    edt1d(ligne, l, dl);
    for (let x = 0; x < l; x++) { f[y * l + x] = dl[x]; if (dl[x] > max) max = dl[x]; }
  }
  const rayon = Math.sqrt(max);
  const seuil = (rayon - Math.max(1, 0.01 * rayon)) ** 2;
  let n = 0; let sx = 0; let sy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      if (f[y * l + x] >= seuil) { n += 1; sx += x + 0.5; sy += y + 0.5; }
    }
  }
  return { largeur, hauteur, px: 4 * sx / n, py: 4 * sy / n, rayon: 4 * rayon, loin };
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

// ---------------------------------------------------------------------------
// Lot CONDITIONNEMENT-ZÉNITH — 19/09/2026. Il ferme l'état transitoire laissé par
// ANCRES-ZÉNITH : ancres zénithales sur des sprites encore à 75°.
// ---------------------------------------------------------------------------

/** Les douze tourelles de défense zénithales, six par camp. */
const TOURELLES_ZENITHALES = ['j', 'o'].flatMap((c) =>
  ['casemate', 'creneau', 'batterie', 'faucheuse', 'mortier', 'harpon'].map((k) => `def_${c}_${k}`));

test('CZ T1 — les douze tourelles zénithales sont centrées sur leur pivot, et leur carré tient dans la planche', () => {
  // ⚠⚠ C'EST LA CONDITION DU MODE `carre` DE `joueur_v2.py` — « aucun recadrage,
  // la planche EST le sprite » —, et les douze sources livrées le 19/09 la
  // violaient : l'embase de 21 à 225 px SOUS le centre du fichier, le carré de
  // rotation plus grand que la planche sur dix d'entre elles (1 430 à 1 638 pour
  // 1 254 chez le joueur). Conditionnées telles quelles, elles auraient tourné
  // en décrivant un cercle autour de leur embase, canon rogné à 45°.
  // `tools/recentrer-tourelles-ouvrage.py` les a recentrées EN PLACE ; ce test
  // le remesure par sa propre voie — transformée de distance exacte au quart de
  // la résolution, plateau du maximum — et non en relisant ce que l'outil a écrit.
  //
  // ⚠ ROUGE AVANT LE LOT, ET C'EST MESURÉ : sur les sources telles que livrées,
  // les douze tombent — écart vertical de 2,1 % (`def_o_casemate`, 21 px sur
  // 1 024) à 18,0 % (`def_j_mortier`, 225 px sur 1 254), et dix planches trop
  // petites pour leur carré.
  for (const nom of TOURELLES_ZENITHALES) {
    const { largeur, hauteur, px, py, rayon, loin } = pivotDeLaTourelle(join(SOURCES, `${nom}.png`));
    assert.equal(largeur, hauteur, `${nom} : planche ${largeur} × ${hauteur}, pas carrée`);
    // Montage : la mesure a trouvé une embase qui compte — un rayon de trois
    // pixels serait un rivet, et l'écart au centre ne voudrait rien dire.
    assert.ok(rayon > 0.1 * largeur, `${nom} : embase de rayon ${rayon.toFixed(0)} px sur ${largeur} — la mesure n'a pas trouvé l'embase`);
    const ecart = Math.hypot(px - largeur / 2, py - hauteur / 2);
    assert.ok(ecart < 0.01 * largeur,
      `${nom} : pivot en (${px.toFixed(1)}, ${py.toFixed(1)}) pour un centre à ${largeur / 2} — écart `
      + `${ecart.toFixed(1)} px, ${(100 * ecart / largeur).toFixed(2)} % du côté`);
    assert.ok(loin <= largeur / 2,
      `${nom} : un pixel de sujet à ${loin.toFixed(1)} du centre pour une demi-planche de ${largeur / 2} — `
      + 'le canon sera rogné à 45°');
  }
});

test('CZ T2 — sur les neuf socles redessinés, le sprite 128 cousu porte son trou là où la table pose la tourelle', () => {
  // ⚠⚠ LA TABLE ET L'ART S'ACCORDENT ENFIN. Depuis ANCRES-ZÉNITH la table
  // décrivait des dessins zénithaux (logement au centre) pendant que l'atlas
  // portait encore les sprites à 75° (logement à −15,74 % de la case chez le
  // joueur, −22,75 à −27,97 à l'Ouvrage) : la tourelle était posée au centre
  // d'un socle dont le trou était en haut, 15 px d'écart sur une case de 64.
  // Ce test relit le SPRITE — celui que `tools/atlas.py` coud et que l'écran
  // dessine —, y refait le trou par la recette d'`AZ T1`, et le confronte au
  // `dy_case_pct` de la table. Rouge avant ce lot sur les neuf ; vert après.
  //
  // ⚠ LES TROIS SOCLES D'ARTILLERIE DU JOUEUR N'Y SONT PAS : non redessinés,
  // toujours à 75°, la recette ne trouve pas un trou vu de biais (voir `AZ T1`).
  for (const cle of SOCLES_ZENITHAUX) {
    const ancre = ANCRES_DEFENSE[cle];
    const trou = trouDuSprite(join(RACINE, 'art', 'sprites', 'socle', '128', `${cle}.png`));
    assert.ok(trou, `${cle} : aucune tache sombre enfermée dans le sprite`);
    assert.ok(trou.part > 0.01, `${cle} : la tache ne fait que ${(100 * trou.part).toFixed(2)} % de la boîte`);
    const dx = Math.abs(trou.dx_case_pct - ancre.dx_case_pct);
    const dy = Math.abs(trou.dy_case_pct - ancre.dy_case_pct);
    assert.ok(dx < TOLERANCE_PCT && dy < TOLERANCE_PCT,
      `${cle} : la table pose la tourelle en (${ancre.dx_case_pct}, ${ancre.dy_case_pct}) % de la case, le sprite `
      + `porte son trou en (${trou.dx_case_pct.toFixed(2)}, ${trou.dy_case_pct.toFixed(2)}) — écart `
      + `${Math.max(dx, dy).toFixed(2)} % de la case, ${(Math.max(dx, dy) * 0.64).toFixed(1)} px sur 64`);
  }
  // ⚠ ET LA MESURE SAIT DISTINGUER : le trou du socle 75° du joueur était à
  // −15,74 % ; un sprite qui le porterait encore là doit tomber ici.
  for (const cle of SOCLES_ZENITHAUX.filter((c) => c.startsWith('socle_def_j_'))) {
    const trou = trouDuSprite(join(RACINE, 'art', 'sprites', 'socle', '128', `${cle}.png`));
    assert.ok(Math.abs(trou.dy_case_pct - (-15.74)) > TOLERANCE_PCT, `${cle} : l'appât 75° passerait — le montage ne mesure rien`);
  }
});
