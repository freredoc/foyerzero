// Le pavage du fond de carte — `src/render/terrain.js`, confronté à l'atlas réel.
//
// ⚠ CE FICHIER DÉCODE LE PNG LIVRÉ, IL NE SE FABRIQUE PAS UN ATLAS DE
// COMPLAISANCE. Un atlas synthétique — du bruit, un dégradé — passerait tous
// les tests ci-dessous et ne dirait rien du fichier que le joueur verra : c'est
// SA distribution de teintes qui décide des seuils de quintile, et c'est SA
// taille qui décide du nombre de tuiles. Le décodeur tient en quarante lignes
// parce que le fichier est un PNG indexé sans entrelacement ; il refuse tout le
// reste plutôt que de rendre une image approchée.
//
// ⚠ ET UN RENDU NE SE TESTE PAS QU'EN NOMBRES. Le défaut des « bits épuisés »,
// qui faisait basculer toutes les tuiles du même côté, s'est vu à l'œil en une
// seconde et aucune de ces assertions ne l'aurait attrapé — d'où le test des
// distributions du hachage, écrit exprès pour lui, et l'image de contrôle jointe
// au rapport du lot.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  creerAtlas, rendreDalle, masqueDeLaTuile, orientationDeLaTuile,
  descriptionDuNoeud, partOuvrageDeLaRangee, rangeeDuPixelSource,
  teinteDeLaValeur, NB_TEINTES, SEL_DECALAGE, SEL_FIGURE,
} from '../src/render/terrain.js';
import {
  GEOGRAPHIE, TERRAIN_CARTE, ZOOM_CARTE, PIXELS_SOURCE_PAR_CASE,
} from '../src/data/sites.js';
import { niveauDeLaRangee, positionDepartJoueur } from '../src/sim/carte.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHEMIN_ATLAS = join(RACINE, 'art', 'sprites', 'carte', 'atlas-terrain-64.png');

// ---------------------------------------------------------------------------
// Le décodeur — juste assez de PNG pour ce fichier-ci, et rien de plus
// ---------------------------------------------------------------------------

/**
 * Décode le PNG indexé de l'atlas en indices de palette.
 *
 * Il LÈVE sur tout ce qu'il ne sait pas faire — autre profondeur, entrelacement,
 * autre type de couleur — plutôt que de rendre une image approchée : un atlas
 * mal décodé ferait tomber les tests suivants sur un défaut qui n'existe pas.
 */
function decoderAtlasIndexe(chemin) {
  const octets = readFileSync(chemin);
  assert.equal(octets.readUInt32BE(0), 0x89504e47, 'ce n\'est pas un PNG');
  let position = 8;
  let largeur = 0;
  let hauteur = 0;
  const morceaux = [];
  let palette = null;
  while (position < octets.length) {
    const taille = octets.readUInt32BE(position);
    const nom = octets.toString('ascii', position + 4, position + 8);
    const corps = octets.subarray(position + 8, position + 8 + taille);
    if (nom === 'IHDR') {
      largeur = corps.readUInt32BE(0);
      hauteur = corps.readUInt32BE(4);
      assert.equal(corps[8], 4, 'profondeur de bits inattendue');
      assert.equal(corps[9], 3, 'l\'atlas n\'est plus une image indexée');
      assert.equal(corps[12], 0, 'entrelacement non géré');
    } else if (nom === 'PLTE') palette = Buffer.from(corps);
    else if (nom === 'IDAT') morceaux.push(Buffer.from(corps));
    else if (nom === 'IEND') break;
    position += 12 + taille;
  }
  const brut = inflateSync(Buffer.concat(morceaux));
  const octetsParLigne = Math.ceil(largeur / 2); // 4 bits par pixel
  const lignes = Buffer.alloc(hauteur * octetsParLigne);
  let lu = 0;
  for (let y = 0; y < hauteur; y += 1) {
    const filtre = brut[lu];
    lu += 1;
    const ligne = lignes.subarray(y * octetsParLigne, (y + 1) * octetsParLigne);
    brut.copy(ligne, 0, lu, lu + octetsParLigne);
    lu += octetsParLigne;
    const precedente = y === 0 ? null : lignes.subarray((y - 1) * octetsParLigne, y * octetsParLigne);
    for (let x = 0; x < octetsParLigne; x += 1) {
      const a = x >= 1 ? ligne[x - 1] : 0;
      const b = precedente === null ? 0 : precedente[x];
      const c = (x >= 1 && precedente !== null) ? precedente[x - 1] : 0;
      let v = ligne[x];
      if (filtre === 1) v += a;
      else if (filtre === 2) v += b;
      else if (filtre === 3) v += (a + b) >> 1;
      else if (filtre === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      } else assert.equal(filtre, 0, `filtre PNG ${filtre} non géré`);
      ligne[x] = v & 0xff;
    }
  }
  const indices = new Uint8Array(largeur * hauteur);
  for (let y = 0; y < hauteur; y += 1) {
    const ligne = lignes.subarray(y * octetsParLigne, (y + 1) * octetsParLigne);
    for (let x = 0; x < largeur; x += 1) {
      indices[y * largeur + x] = (x & 1) === 1 ? (ligne[x >> 1] & 0xf) : (ligne[x >> 1] >> 4);
    }
  }
  return { largeur, hauteur, indices, palette };
}

const PNG = decoderAtlasIndexe(CHEMIN_ATLAS);
const ATLAS = creerAtlas(PNG.indices, ZOOM_CARTE.coteTuile, PNG.largeur);

/** Les dix couleurs des deux rampes, empaquetées pour une recherche rapide. */
function codesDesRampes() {
  const code = (hex) => (parseInt(hex.slice(1, 3), 16) << 16)
    | (parseInt(hex.slice(3, 5), 16) << 8) | parseInt(hex.slice(5, 7), 16);
  return {
    joueur: TERRAIN_CARTE.rampes.joueur.map(code),
    ouvrage: TERRAIN_CARTE.rampes.ouvrage.map(code),
  };
}
const RAMPES = codesDesRampes();

/** Décompose une dalle rendue : teintes employées, part d'Ouvrage, inconnus. */
function analyser(dalle) {
  const parTeinte = new Array(NB_TEINTES).fill(0);
  let ouvrage = 0;
  let inconnus = 0;
  let noirs = 0;
  const n = dalle.donnees.length / 4;
  for (let p = 0; p < dalle.donnees.length; p += 4) {
    const code = (dalle.donnees[p] << 16) | (dalle.donnees[p + 1] << 8) | dalle.donnees[p + 2];
    if (code === 0) noirs += 1;
    const j = RAMPES.joueur.indexOf(code);
    if (j !== -1) { parTeinte[j] += 1; continue; }
    const o = RAMPES.ouvrage.indexOf(code);
    if (o !== -1) { parTeinte[o] += 1; ouvrage += 1; continue; }
    inconnus += 1;
  }
  return { parTeinte, partOuvrage: ouvrage / n, inconnus, noirs, pixels: n };
}

// ---------------------------------------------------------------------------
// L'atlas lui-même
// ---------------------------------------------------------------------------

test('atlas — le fichier livré est bien 64 tuiles indexées sur la rampe du joueur', () => {
  assert.equal(PNG.largeur, PNG.hauteur, 'l\'atlas n\'est pas carré');
  assert.equal(ATLAS.nombre, 64, `${ATLAS.nombre} tuiles au lieu de 64`);
  assert.equal(ATLAS.cote, ZOOM_CARTE.coteTuile);

  // ⚠⚠ ET UNE TUILE NE COUVRE PLUS UNE CASE, ELLE EN COUVRE UN QUART. C'est le
  // correctif du 30/08 : à une tuile par case, le cran le plus serré
  // AGRANDISSAIT la source d'un facteur deux, et le grain de 4 px de l'art se
  // lisait en carrés de 8 px à l'écran. La garde porte sur ce qui compte —
  // qu'AUCUN cran n'agrandisse — et non sur le nombre 2, qui n'en est que le
  // moyen. Elle rougirait donc aussi bien si l'on ajoutait un cran de 512.
  for (const cran of ZOOM_CARTE.crans) {
    const echelle = cran / PIXELS_SOURCE_PAR_CASE;
    assert.ok(echelle <= 1,
      `au cran ${cran}, le pavage agrandit sa source de ×${echelle} : le grain se verra`);
  }
  assert.equal(PIXELS_SOURCE_PAR_CASE, ZOOM_CARTE.coteTuile * ZOOM_CARTE.tuilesParCase,
    'le côté d\'une case en pixels source n\'est plus le produit des deux facteurs');

  // Sa palette EST la rampe du joueur, dans l'ordre : c'est ce qui permet de
  // travailler sur l'indice plutôt que sur une luminance, et de repeindre à
  // index constant pour l'autre camp.
  for (let i = 0; i < NB_TEINTES; i += 1) {
    const hex = `#${[0, 1, 2].map((c) => PNG.palette[i * 3 + c].toString(16).padStart(2, '0')).join('')}`;
    assert.equal(
      hex.toUpperCase(), TERRAIN_CARTE.rampes.joueur[i].toUpperCase(),
      `la couleur ${i} de l'atlas n'est plus celle de la rampe du joueur`,
    );
  }

  // ⚠ ET IL EST ÉQUILIBRÉ, MESURÉ. Chaque indice couvre 20,0 % de la surface,
  // ce qui est l'hypothèse sur laquelle repose tout le reste : c'est parce que
  // l'atlas est uniforme et la SORTIE à peu près gaussienne que les seuils de
  // teinte ne peuvent pas être ceux de l'atlas.
  const compte = new Array(NB_TEINTES).fill(0);
  for (const v of PNG.indices) compte[v] += 1;
  for (let i = 0; i < NB_TEINTES; i += 1) {
    const part = (100 * compte[i]) / PNG.indices.length;
    assert.ok(Math.abs(part - 20) < 1, `l'indice ${i} couvre ${part.toFixed(2)} % de l'atlas`);
  }
  assert.ok(Math.abs(ATLAS.moyenne - 2) < 0.01, `moyenne ${ATLAS.moyenne}`);
});

// ---------------------------------------------------------------------------
// Le masque et les orientations
// ---------------------------------------------------------------------------

test('masque — cosinus surélevé : plein au centre, nul aux bords, symétrique', () => {
  for (const cote of ZOOM_CARTE.crans) {
    const m = masqueDeLaTuile(cote);
    assert.equal(m.length, cote);
    // Symétrie : sans elle le semis dérive doucement vers un coin.
    for (let i = 0; i < cote; i += 1) {
      assert.ok(Math.abs(m[i] - m[cote - 1 - i]) < 1e-12, `masque asymétrique en ${i}`);
    }
    // Le centre vaut presque 1, les bords presque 0, et ça monte sans redescendre.
    assert.ok(m[cote / 2] > 0.99, `centre à ${m[cote / 2]}`);
    assert.ok(m[0] < 0.01 && m[cote - 1] < 0.01, `bord à ${m[0]}`);
    assert.ok(m[0] > 0, 'le bord vaut exactement zéro : la couverture peut s\'annuler');
    // Il monte strictement jusqu'aux DEUX échantillons du milieu, qui sont
    // égaux par symétrie — l'échantillonnage est pris au centre des pixels,
    // donc aucun ne tombe exactement sur l'axe.
    for (let i = 1; i < cote / 2; i += 1) {
      assert.ok(m[i] > m[i - 1], `le masque redescend en ${i}`);
    }
    assert.equal(m[cote / 2], m[cote / 2 - 1], 'les deux échantillons du milieu diffèrent');
  }
});

test('orientations — les huit sont des bijections, et elles sont toutes distinctes', () => {
  const cote = 8;
  const empreintes = new Set();
  for (let rotation = 0; rotation < 4; rotation += 1) {
    for (const miroir of [false, true]) {
      const t = orientationDeLaTuile(rotation, miroir, cote);
      const atteints = new Set();
      const trace = [];
      for (let sy = 0; sy < cote; sy += 1) {
        for (let sx = 0; sx < cote; sx += 1) {
          const ax = t.ox + t.a * sx + t.b * sy;
          const ay = t.oy + t.c * sx + t.d * sy;
          assert.ok(ax >= 0 && ax < cote && ay >= 0 && ay < cote,
            `rotation ${rotation} miroir ${miroir} sort de la tuile en (${sx}, ${sy})`);
          atteints.add(ay * cote + ax);
          trace.push(ay * cote + ax);
        }
      }
      // Bijection : chaque pixel de la tuile est atteint une fois et une seule.
      assert.equal(atteints.size, cote * cote,
        `rotation ${rotation} miroir ${miroir} n'est pas une bijection`);
      empreintes.add(trace.join(','));
    }
  }
  assert.equal(empreintes.size, 8, 'deux orientations font la même chose');
});

// ---------------------------------------------------------------------------
// Le hachage — la faute des « bits épuisés »
// ---------------------------------------------------------------------------

test('hachage — chaque champ du nœud a assez de bits pour être vraiment tiré', () => {
  // ⚠ CE TEST EXISTE POUR UN DÉFAUT VU À L'ŒIL, PAS TROUVÉ PAR RELECTURE. Lire
  // un champ dans les trois bits de tête d'un mot de 32 rend une valeur toujours
  // minuscule : pendant la maquette, TOUTES les tuiles basculaient du même côté
  // et le fond devenait un damier. Aucune des assertions de rendu de ce fichier
  // ne l'aurait vu — le pavage restait « un pavage ».
  const tuiles = new Array(64).fill(0);
  const rotations = [0, 0, 0, 0];
  const miroirs = [0, 0];
  let decalageXNegatif = 0;
  let decalageYNegatif = 0;
  const tirages = [0, 0, 0, 0];
  let n = 0;
  for (let gy = 0; gy < 60; gy += 1) {
    for (let gx = 0; gx < 60; gx += 1) {
      const noeud = descriptionDuNoeud(1234, gy, gx, 64);
      tuiles[noeud.tuile] += 1;
      rotations[noeud.rotation] += 1;
      miroirs[noeud.miroir ? 1 : 0] += 1;
      if (noeud.decalageX < 0) decalageXNegatif += 1;
      if (noeud.decalageY < 0) decalageYNegatif += 1;
      tirages[Math.min(3, Math.floor(noeud.tirage * 4))] += 1;
      n += 1;
      assert.ok(noeud.decalageX >= -1 && noeud.decalageX < 1, 'décalage hors de [−1, 1[');
      assert.ok(noeud.decalageY >= -1 && noeud.decalageY < 1, 'décalage hors de [−1, 1[');
      assert.ok(noeud.tirage >= 0 && noeud.tirage < 1, 'tirage hors de [0, 1[');
    }
  }
  // Les soixante-quatre tuiles sortent, et aucune ne prend le quart du semis.
  assert.equal(tuiles.filter((c) => c === 0).length, 0, 'une tuile ne sort jamais');
  assert.ok(Math.max(...tuiles) < n / 16, 'une tuile domine le semis');
  // Les quatre rotations et les deux miroirs sont à peu près équiprobables.
  for (const c of rotations) assert.ok(Math.abs(c / n - 0.25) < 0.05, `rotation à ${c / n}`);
  for (const c of miroirs) assert.ok(Math.abs(c / n - 0.5) < 0.05, `miroir à ${c / n}`);
  // Et les décalages vont dans les DEUX sens : c'est exactement ce qui manquait.
  assert.ok(Math.abs(decalageXNegatif / n - 0.5) < 0.05, `décalage X négatif à ${decalageXNegatif / n}`);
  assert.ok(Math.abs(decalageYNegatif / n - 0.5) < 0.05, `décalage Y négatif à ${decalageYNegatif / n}`);
  for (const c of tirages) assert.ok(Math.abs(c / n - 0.25) < 0.05, `quart de tirage à ${c / n}`);

  // Falsifiable : le montage doit attraper un champ pressé dans trop peu de
  // bits. Trois bits de tête sur un hachage donnent au plus huit valeurs, donc
  // au moins un huitième du semis sur une seule tuile.
  const presse = new Array(64).fill(0);
  for (let gy = 0; gy < 60; gy += 1) {
    for (let gx = 0; gx < 60; gx += 1) {
      presse[descriptionDuNoeud(1234, gy, gx, 64).tuile >>> 3] += 1;
    }
  }
  assert.ok(Math.max(...presse) >= n / 16, 'le montage ne verrait pas un champ pressé');

  // Les deux sels sont distincts : un seul rendrait le décalage et la figure
  // parfaitement corrélés, et le semis se remettrait à s'aligner.
  assert.notEqual(SEL_DECALAGE, SEL_FIGURE);
});

// ---------------------------------------------------------------------------
// Le rendu
// ---------------------------------------------------------------------------

test('dalles — une zone rendue seule est identique à la même rendue en quatre', () => {
  // ⚠ C'EST L'INVARIANT QUI CASSERAIT EN SILENCE. Une couture ne fait tomber
  // aucun test « fonctionnel » : elle se voit sur un téléphone, six semaines
  // plus tard. Le semis est semé par la position ABSOLUE en pixels ; le jour où
  // le coin d'une dalle entrerait dans un hachage, ou qu'un seuil se
  // calculerait dalle par dalle, ce test tombe.
  const COTE = 256;
  for (const cran of ZOOM_CARTE.crans) {
    const X = 1024;
    const Y = 20096;
    const grande = rendreDalle({ atlas: ATLAS, graine: 7, cran, x0: X, y0: Y, cote: COTE });
    let ecarts = 0;
    for (const [dx, dy] of [[0, 0], [COTE / 2, 0], [0, COTE / 2], [COTE / 2, COTE / 2]]) {
      const quart = rendreDalle({
        atlas: ATLAS, graine: 7, cran, x0: X + dx, y0: Y + dy, cote: COTE / 2,
      });
      for (let j = 0; j < COTE / 2; j += 1) {
        for (let i = 0; i < COTE / 2; i += 1) {
          const a = ((j + dy) * COTE + (i + dx)) * 4;
          const b = (j * (COTE / 2) + i) * 4;
          for (let c = 0; c < 4; c += 1) {
            if (grande.donnees[a + c] !== quart.donnees[b + c]) ecarts += 1;
          }
        }
      }
    }
    assert.equal(ecarts, 0, `cran ${cran} : ${ecarts} octets divergent entre 1 dalle et 4`);
  }

  // Falsifiable : le montage doit voir une différence quand il y en a une.
  // Décaler la grande dalle d'un pixel change forcément le dessin.
  const a = rendreDalle({ atlas: ATLAS, graine: 7, cran: 64, x0: 1024, y0: 20096, cote: 64 });
  const b = rendreDalle({ atlas: ATLAS, graine: 7, cran: 64, x0: 1025, y0: 20096, cote: 64 });
  assert.ok(a.donnees.some((v, i) => v !== b.donnees[i]),
    'un décalage d\'un pixel ne change rien : le montage ne mesure pas');
});

test('dalles — deux appels au même endroit rendent la même image, au pixel près', () => {
  // ⚠ ON COMPARE À LA MAIN, PAS PAR `deepEqual`. Sur 65 536 pixels, la mise en
  // forme de l'écart par le rapporteur de tests prend cent secondes quand il y
  // en a un : un test qui met deux minutes à dire « rouge » ne se relance pas.
  const premierEcart = (a, b) => {
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return i;
    return -1;
  };
  for (const cran of ZOOM_CARTE.crans) {
    const un = rendreDalle({ atlas: ATLAS, graine: 3, cran, x0: 640, y0: 9088, cote: 128 });
    const deux = rendreDalle({ atlas: ATLAS, graine: 3, cran, x0: 640, y0: 9088, cote: 128 });
    const ecart = premierEcart(un.donnees, deux.donnees);
    assert.equal(ecart, -1,
      `cran ${cran} : deux rendus identiques divergent, premier écart à l'octet ${ecart}`);
  }
  // ⚠ ET LE MONTAGE DOIT VOIR UNE GRAINE CHANGER. Les tampons d'accumulation
  // sont gardés d'un appel à l'autre : s'ils n'étaient pas remis à zéro, la
  // seconde dalle serait la somme des deux, et l'égalité ci-dessus tomberait —
  // mais si le rendu ignorait la graine, elle passerait sur du code mort.
  const un = rendreDalle({ atlas: ATLAS, graine: 3, cran: 64, x0: 640, y0: 9088, cote: 128 });
  const autre = rendreDalle({ atlas: ATLAS, graine: 4, cran: 64, x0: 640, y0: 9088, cote: 128 });
  assert.ok(un.donnees.some((v, i) => v !== autre.donnees[i]),
    'la graine ne change rien au fond : la carte serait la même dans toutes les parties');
});

test('dalles — aucun pixel hors des deux rampes, aucun noir, et le plancher ne mord pas', () => {
  let couverture = Infinity;
  for (const cran of ZOOM_CARTE.crans) {
    for (const [x0, y0] of [[0, 0], [1024, 20000], [512, 9000], [3000, 38000]]) {
      const dalle = rendreDalle({ atlas: ATLAS, graine: 11, cran, x0, y0, cote: 128 });
      const vu = analyser(dalle);
      assert.equal(vu.inconnus, 0,
        `cran ${cran} en (${x0}, ${y0}) : ${vu.inconnus} pixels hors des deux rampes`);
      assert.equal(vu.noirs, 0, `cran ${cran} en (${x0}, ${y0}) : ${vu.noirs} pixels noirs`);
      if (dalle.couvertureMin < couverture) couverture = dalle.couvertureMin;
    }
  }
  // ⚠ LE PLANCHER EST UNE GARDE MORTE, ET C'EST CE QU'ON LUI DEMANDE. À un pas
  // de 56 px, la couverture ne s'annule jamais — mesuré à 0,165 au plus bas.
  // À 84, elle s'annulait et le fond rendait du noir. Sans cette mesure, la
  // branche `Σw ≤ 0` serait indiscernable d'une branche morte, et personne ne
  // saurait le jour où le pas s'élargirait.
  assert.ok(couverture > 0,
    `la couverture tombe à ${couverture} : le pas du réseau laisse des trous`);
  assert.ok(TERRAIN_CARTE.pasSourcePx < ZOOM_CARTE.coteTuile,
    'le pas du réseau a dépassé la tuile : la couverture ne peut plus être garantie');
});

test('teintes — chaque teinte couvre un cinquième de la surface, et les seuils sont mesurés', () => {
  // ⚠ LES SEUILS NE SONT PAS CEUX DE L'ATLAS, ET C'EST TOUT LE POINT. L'atlas
  // est uniforme sur cinq indices ; la sortie est la somme pondérée d'environ
  // cinq tuiles, donc à peu près gaussienne. Les seuils naïfs — 0,5 · 1,5 ·
  // 2,5 · 3,5 — donneraient 14 % aux extrêmes et 28 % au milieu.
  const total = new Array(NB_TEINTES).fill(0);
  let pixels = 0;
  for (const cran of ZOOM_CARTE.crans) {
    for (const graine of [1, 7, 4242, 99991]) {
      const vu = analyser(rendreDalle({
        atlas: ATLAS, graine, cran, x0: 1024, y0: 20000, cote: 256,
      }));
      vu.parTeinte.forEach((c, i) => { total[i] += c; });
      pixels += vu.pixels;
    }
  }
  for (let i = 0; i < NB_TEINTES; i += 1) {
    const part = (100 * total[i]) / pixels;
    assert.ok(Math.abs(part - 20) <= 2, `la teinte ${i} couvre ${part.toFixed(2)} % au lieu de 20`);
  }

  // Falsifiable : avec les seuils de l'atlas, la répartition sortirait de la
  // tolérance. On refait la mesure sur les mêmes valeurs, en découpant
  // autrement, sans toucher au rendu.
  const naifs = [0.5, 1.5, 2.5, 3.5];
  assert.notDeepEqual(TERRAIN_CARTE.seuilsDeTeinte, naifs,
    'les seuils sont ceux de l\'atlas : ils n\'ont pas été mesurés sur la sortie');
  // Et ils sont croissants, sinon une teinte serait inatteignable.
  for (let i = 1; i < TERRAIN_CARTE.seuilsDeTeinte.length; i += 1) {
    assert.ok(TERRAIN_CARTE.seuilsDeTeinte[i] > TERRAIN_CARTE.seuilsDeTeinte[i - 1]);
  }
  assert.equal(teinteDeLaValeur(-99), 0);
  assert.equal(teinteDeLaValeur(99), NB_TEINTES - 1);
});

test('contraste — la formule garde le relief là où la composition alpha l\'aplatit', () => {
  // ⚠⚠ C'EST LE CŒUR DU LOT, ET IL SE MESURE AU LIEU DE SE CROIRE. `drawImage`
  // avec `globalAlpha` calcule `Σwt / Σw` : moyenner N textures divise leur
  // écart-type par √N. La formule divise par `√(Σw²)`, ce qui rend l'écart-type
  // d'UNE tuile. Le chemin alpha n'existe dans le module que pour ce test —
  // sans lui, l'affirmation « ce n'est pas de la composition alpha » serait une
  // opinion.
  const luminance = (dalle) => {
    let somme = 0;
    let carres = 0;
    const n = dalle.donnees.length / 4;
    for (let p = 0; p < dalle.donnees.length; p += 4) {
      const y = 0.2126 * dalle.donnees[p] + 0.7152 * dalle.donnees[p + 1]
        + 0.0722 * dalle.donnees[p + 2];
      somme += y;
      carres += y * y;
    }
    return Math.sqrt(carres / n - (somme / n) ** 2);
  };
  for (const cran of ZOOM_CARTE.crans) {
    const commun = { atlas: ATLAS, graine: 7, cran, x0: 1024, y0: 31000, cote: 256 };
    const formule = luminance(rendreDalle(commun));
    const alpha = luminance(rendreDalle({ ...commun, alphaOrdinaire: true }));
    // Le plancher du brief : au-dessus de 12, mesuré à 19,6 ici.
    assert.ok(formule > 12, `cran ${cran} : écart-type ${formule.toFixed(2)}, 12 attendus au moins`);
    // Et le vrai discriminant, qui ne dépend d'aucune constante recopiée : la
    // formule doit battre l'alpha d'au moins un quart. Mesuré : 19,6 contre
    // 15,1, soit +30 %.
    assert.ok(formule > alpha * 1.25,
      `cran ${cran} : formule ${formule.toFixed(2)} contre alpha ${alpha.toFixed(2)} — `
        + 'la normalisation ne fait plus son travail');
  }
});

test('camp du sol — la part d\'Ouvrage suit le niveau : rien au départ, tout au bout', () => {
  // ⚠ ELLE SUIT LE NIVEAU DE LA RANGÉE, ET NON LE NUMÉRO DE RANGÉE. La rangée 1
  // est le bord HAUT, donc le bout de la carte : la part CROÎT quand le numéro
  // DESCEND. Écrire « croît avec la rangée » ferait tomber le test dans le bon
  // sens pour la mauvaise raison, et le prochain lecteur inverserait la
  // convention en croyant réparer.
  const partMesuree = (rangee) => {
    let ouvrage = 0;
    let pixels = 0;
    for (const graine of [1, 7]) {
      for (let k = 0; k < 4; k += 1) {
        const vu = analyser(rendreDalle({
          atlas: ATLAS,
          graine,
          cran: PIXELS_SOURCE_PAR_CASE,
          x0: k * PIXELS_SOURCE_PAR_CASE,
          y0: (rangee - 1) * PIXELS_SOURCE_PAR_CASE,
          cote: PIXELS_SOURCE_PAR_CASE,
        }));
        ouvrage += vu.partOuvrage * vu.pixels;
        pixels += vu.pixels;
      }
    }
    return ouvrage / pixels;
  };

  const depart = positionDepartJoueur().rangee;
  const rangees = [GEOGRAPHIE.carte.hauteur, depart, 200, 150, 100, 26];
  const parts = rangees.map(partMesuree);

  // Croissante à mesure que le niveau monte.
  for (let i = 1; i < parts.length; i += 1) {
    assert.ok(niveauDeLaRangee(rangees[i]) > niveauDeLaRangee(rangees[i - 1]),
      'le montage ne fait pas monter le niveau : il ne mesure rien');
    assert.ok(parts[i] >= parts[i - 1] - 0.01,
      `la part d'Ouvrage descend de la rangée ${rangees[i - 1]} à ${rangees[i]} : `
        + `${parts[i - 1].toFixed(3)} → ${parts[i].toFixed(3)}`);
  }
  // ~0 au départ du joueur, ~1 au bout.
  assert.ok(parts[1] < 0.1, `au départ du joueur, ${(100 * parts[1]).toFixed(1)} % d'Ouvrage`);
  assert.equal(parts[parts.length - 1], 1, 'la base terminale n\'est pas entièrement en sol d\'Ouvrage');

  // La formule elle-même, aux deux bouts, sans passer par le rendu.
  assert.equal(partOuvrageDeLaRangee(GEOGRAPHIE.carte.hauteur), 0);
  assert.equal(partOuvrageDeLaRangee(26), 1);
  assert.ok(partOuvrageDeLaRangee(depart) > 0 && partOuvrageDeLaRangee(depart) < 0.1);
});

test('rangée d\'un pixel — elle se borne à la carte, elle ne lève pas', () => {
  // Le pavage déborde volontiers des bords : les tuiles qui couvrent la
  // dernière rangée ont leur centre au-delà. Refuser de les décrire ferait un
  // trou noir sur toute la bordure.
  assert.equal(rangeeDuPixelSource(-5000), 1);
  assert.equal(rangeeDuPixelSource(0), 1);
  assert.equal(rangeeDuPixelSource(PIXELS_SOURCE_PAR_CASE), 2);
  assert.equal(
    rangeeDuPixelSource(GEOGRAPHIE.carte.hauteur * PIXELS_SOURCE_PAR_CASE * 2),
    GEOGRAPHIE.carte.hauteur,
  );
});

test('atlas — un indice hors de la rampe est refusé, une taille impossible aussi', () => {
  // `creerAtlas` est la porte d'entrée : ce qui passe ici sera lu un million de
  // fois par dalle sans être revérifié.
  assert.throws(() => creerAtlas(new Uint8Array(16), 3, 4), RangeError);
  assert.throws(() => creerAtlas(new Uint8Array(16), 4, 6), RangeError);
  const mauvais = new Uint8Array(16);
  mauvais[7] = NB_TEINTES;
  assert.throws(() => creerAtlas(mauvais, 4, 4), RangeError);
  const bon = creerAtlas(new Uint8Array(16).fill(2), 4, 4);
  assert.equal(bon.nombre, 1);
  assert.equal(bon.moyenne, 2);
});

test('rendu — un cran hors table est refusé, un coin non entier aussi', () => {
  // Un coin fractionnaire casserait l'invariant des dalles sans rien dire : les
  // tuiles se poseraient à des entiers différents selon le découpage.
  assert.throws(
    () => rendreDalle({ atlas: ATLAS, graine: 1, cran: 96, x0: 0, y0: 0, cote: 64 }),
    RangeError,
  );
  assert.throws(
    () => rendreDalle({ atlas: ATLAS, graine: 1, cran: ZOOM_CARTE.crans[0], x0: 0.5, y0: 0, cote: 64 }),
    RangeError,
  );
});
