// Les limites de territoire — lot TERRITOIRE, 03/09.
//
// ⚠⚠ CE FICHIER GARDE CE QUE `territoire.test.js` NE PEUT PAS. Celui-là garde le
// MODÈLE : quelles cases sont à qui, quels côtés sont exposés. Ce qui se garde
// ici est le DESSIN — quel sprite porte quelle combinaison de côtés, où il se
// découpe dans l'atlas, et ce que ses pixels valent vraiment.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ATLAS, COTE_SPRITE } from '../src/data/atlas.js';
import { TERRAIN_CARTE } from '../src/data/sites.js';
import { JOUEUR, OUVRAGE } from '../src/sim/territoire.js';
import {
  spritesDeLaLimite, dessinerLimiteDUneCase, LETTRE_DU_CAMP, COTES, COINS, FAMILLE,
} from '../src/render/limite.js';
import { decoderRgba } from './png-rgba.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...b) => readFileSync(join(RACINE, ...b), 'utf8');
const SPRITES = join(RACINE, 'art', 'sprites', 'limite', '128');

/** Les seize combinaisons de côtés exposés, dans l'ordre des bits. */
function tousLesCas() {
  const cas = [];
  for (let b = 0; b < 16; b += 1) {
    cas.push(Object.fromEntries(COTES.map((c, i) => [c, (b & (1 << i)) !== 0])));
  }
  return cas;
}

/** Les seize combinaisons de sommets rentrants, dans l'ordre des bits. */
function tousLesSommets() {
  const cas = [];
  for (let b = 0; b < 16; b += 1) {
    cas.push(Object.fromEntries(COINS.map((c, i) => [c, (b & (1 << i)) !== 0])));
  }
  return cas;
}

// ---------------------------------------------------------------------------
// T1 — les seize cas, et l'atlas, dans les DEUX sens
// ---------------------------------------------------------------------------

test('LIMITE T1 — les seize cas se résolvent, et rien n\'est cousu pour rien', () => {
  const dans = new Set(ATLAS[FAMILLE].noms);
  const employes = new Set();
  for (const camp of [JOUEUR, OUVRAGE]) {
    // ⚠⚠ DEUX AXES DEPUIS LE 05/09, DONC 256 CAS ET NON 16. Les côtés exposés et
    // les sommets rentrants sont INDÉPENDANTS — une case peut n'avoir aucun côté
    // et un sommet, ou les quatre côtés et aucun sommet — et le produit des deux
    // est ce que `bordsDuTerritoire` peut rendre. Ne balayer que les côtés
    // laisserait les quatre pointes de chaque camp cousues et jamais demandées,
    // c'est-à-dire exactement ce que la seconde moitié de ce test refuse.
    for (const cotesNus of tousLesCas()) {
      for (const rentrants of tousLesSommets()) {
      const cotes = { ...cotesNus, rentrants };
      const noms = spritesDeLaLimite(camp, cotes);
      const combien = COTES.filter((c) => cotes[c]).length;
      const sommets = COINS.filter((c) => rentrants[c]).length;
      // ⚠ LE COMPTE DE PIÈCES SE VÉRIFIE, PAS SEULEMENT LEUR EXISTENCE. Deux
      // côtés OPPOSÉS demandent DEUX traits ; une seule pièce y laisserait un
      // des deux bords nu, et un test qui ne regarde que « le nom existe »
      // passerait dessus.
      const bandes = combien === 0 ? 0
        : (combien === 2 && ((cotes.nord && cotes.sud) || (cotes.est && cotes.ouest))) ? 2 : 1;
      assert.equal(noms.length, bandes + sommets,
        `${COTES.filter((c) => cotes[c]).join('+') || 'aucun côté'} + `
        + `${COINS.filter((c) => rentrants[c]).join('+') || 'aucun sommet'} : `
        + `${noms.length} pièce(s), ${bandes + sommets} attendue(s)`);
      // ⚠ ET LES POINTES VIENNENT APRÈS LES BANDES, dans l'ordre de `COINS` :
      // deux images du même état doivent être identiques à l'octet.
      assert.deepEqual(noms.slice(bandes),
        COINS.filter((c) => rentrants[c]).map((c) => `limite_${LETTRE_DU_CAMP[camp]}_pointe_${c}`),
        'les pointes ne sont pas rendues après les bandes, dans l\'ordre des coins');
      for (const n of noms) {
        assert.ok(dans.has(n), `${n} n'est pas dans l'atlas ${FAMILLE}`);
        employes.add(n);
      }
      }
    }
  }
  // ⚠ ET `rentrants` ABSENT NE LÈVE PAS : un appelant qui n'en porte pas — un
  // montage de test, un vieil état — rend ses bandes et rien de plus.
  assert.deepEqual(spritesDeLaLimite(JOUEUR, { nord: true, est: false, sud: false, ouest: false }),
    ['limite_j_trait_n'], 'une case sans champ `rentrants` ne rend plus ses bandes');
  // ⚠⚠ ET DANS L'AUTRE SENS : chaque cellule cousue sert. Un sprite produit,
  // cousu et jamais demandé est du poids payé pour rien — la leçon des murs de
  // l'Ouvrage, restés huit mois... deux lots produits sans être dessinés.
  assert.deepEqual([...employes].sort(), [...dans].sort(),
    'l\'atlas et les seize cas ne couvrent pas les mêmes noms');
  assert.equal(dans.size, 34, `${dans.size} cellules cousues, attendu 34 (17 par camp)`);

  // Un camp inconnu LÈVE : une frontière muette serait une case sans bord.
  assert.throws(() => spritesDeLaLimite(0, tousLesCas()[15]), /camp de territoire/);
  assert.deepEqual(LETTRE_DU_CAMP, { [JOUEUR]: 'j', [OUVRAGE]: 'o' });
});

// ---------------------------------------------------------------------------
// T2 — l'ordre canonique, écrit des deux côtés de la chaîne
// ---------------------------------------------------------------------------

test('LIMITE T2 — le suffixe suit l\'ordre `n e s o`, dans l\'outil comme au rendu', () => {
  // ⚠⚠ DEUX FICHIERS ÉCRIVENT CET ORDRE : `tools/limites.py` NOMME les fichiers,
  // `render/limite.js` les DEMANDE. Un tri qui divergerait rendrait des noms
  // introuvables — mais seulement pour les combinaisons où l'ordre compte, donc
  // pas au premier essai venu. On les confronte.
  const py = lire('tools', 'limites.py');
  const trouve = py.match(/^COTES = '([neso]+)'$/m);
  assert.ok(trouve, 'tools/limites.py n\'écrit plus son ordre canonique');
  assert.equal(trouve[1], COTES.map((c) => c[0]).join(''),
    'l\'outil et le rendu ne trient pas les côtés dans le même ordre');

  // Et l'ordre est bien celui de la boussole horaire, pas l'alphabet : `neso`
  // n'est pas trié, et c'est exprès.
  assert.equal(COTES.join(','), 'nord,est,sud,ouest');
  assert.notEqual(COTES.map((c) => c[0]).join(''),
    COTES.map((c) => c[0]).sort().join(''));

  // Un cas où l'ordre mord : nord + est se nomme `ne`, jamais `en`.
  assert.deepEqual(
    spritesDeLaLimite(JOUEUR, { nord: true, est: true, sud: false, ouest: false }),
    ['limite_j_coin_ne'],
  );
});

// ---------------------------------------------------------------------------
// T3 — la géométrie du découpage, demandée et non recalculée
// ---------------------------------------------------------------------------

test('LIMITE T3 — le découpage vient du module, en entiers, sur la vraie cellule', () => {
  const cote = COTE_SPRITE;
  const pieces = dessinerLimiteDUneCase(
    OUVRAGE, { nord: true, est: false, sud: true, ouest: false }, 12.4, 33.6, 40,
  );
  assert.equal(pieces.length, 2, 'deux côtés opposés font deux pièces');
  for (const d of pieces) {
    assert.equal(d.sCote, cote);
    // Le rectangle source tombe DANS l'atlas — c'est ce qu'un `undefined`
    // aurait manqué, et `drawImage` ne lève pas dessus.
    assert.ok(Number.isFinite(d.sx) && Number.isFinite(d.sy));
    assert.ok(d.sx >= 0 && d.sx + cote <= ATLAS[FAMILLE].colonnes * cote);
    assert.ok(d.sy >= 0 && d.sy + cote <= ATLAS[FAMILLE].rangees * cote);
    // ⚠ ENTIERS : un `drawImage` à une position fractionnaire rend le pixel art
    // flou. La case, elle, arrive en flottant depuis le défilement.
    assert.ok(Number.isInteger(d.x) && Number.isInteger(d.y),
      `position fractionnaire ${d.x},${d.y}`);
    assert.equal(d.cote, 40);
  }
  // Les deux pièces se posent au MÊME endroit et diffèrent par leur découpe :
  // c'est ce qui empêche de les croire interchangeables.
  assert.equal(pieces[0].x, pieces[1].x);
  assert.notEqual(`${pieces[0].sx},${pieces[0].sy}`, `${pieces[1].sx},${pieces[1].sy}`);

  // ⚠ ET L'ÉCRAN NE REFAIT PAS CE CALCUL. La garde de `monde.test.js` le dit
  // déjà pour les emblèmes ; elle a fait tomber le premier jet de ce lot-ci, qui
  // appelait `celluleDuSprite` dans l'écran. On le redit ici, du côté du module.
  const monde = lire('src', 'ui', 'monde.js')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.ok(/dessinerLimiteDUneCase/.test(monde),
    'l\'écran ne demande plus sa géométrie à render/limite.js');
});

// ---------------------------------------------------------------------------
// T4 — les pixels : la convention de bord tient jusque dans les fichiers
// ---------------------------------------------------------------------------

/** Les lignes et colonnes LOGIQUES (32 × 32) entièrement opaques. */
function traits(fichier) {
  const { largeur, hauteur, pixels } = decoderRgba(join(SPRITES, fichier));
  assert.equal(largeur, 128);
  assert.equal(hauteur, 128);
  const pas = largeur / 32;
  const opaque = (gx, gy) => {
    const x = gx * pas + (pas >> 1);
    const y = gy * pas + (pas >> 1);
    return pixels[(y * largeur + x) * 4 + 3] === 255;
  };
  const lignes = [];
  const colonnes = [];
  for (let g = 0; g < 32; g += 1) {
    let l = 0;
    let c = 0;
    for (let k = 0; k < 32; k += 1) {
      if (opaque(k, g)) l += 1;
      if (opaque(g, k)) c += 1;
    }
    if (l >= 30) lignes.push(g);
    if (c >= 30) colonnes.push(g);
  }
  return { lignes, colonnes };
}

test('LIMITE T4 — chaque trait tombe sur le BORD de la case, jamais au milieu', () => {
  // ⚠⚠ C'EST LA GARDE DE LA NORMALISATION, ET ELLE EXISTE POUR UN DÉFAUT RÉEL.
  // Les cinq formes du zip d'Ethan ne suivent PAS une seule convention : `coin`,
  // `u` et `carre` posent leurs traits sur les bords de la case — lignes
  // logiques 0/1 et 30/31 — quand `trait` et `angle_l` les posent sur les
  // MÉDIANES, 15/16. Mesuré sur les vingt images du zip, aux deux tailles.
  // `tools/limites.py` descend donc le trait de quinze pixels logiques ; si
  // cette translation cessait de tomber juste, la frontière se briserait d'une
  // demi-case à chaque angle — visible seulement à l'œil, sur la carte.
  const bord = { n: [0, 1], s: [30, 31], o: [0, 1], e: [30, 31] };
  let vus = 0;
  let pointes = 0;
  for (const f of readdirSync(SPRITES)) {
    if (!f.endsWith('.png')) continue;
    const m = f.match(/^limite_[jo]_(trait|coin|u|carre|pointe)(?:_([neso]+))?\.png$/);
    assert.ok(m, `${f} ne suit pas la convention de nom`);
    const { lignes, colonnes } = traits(f);
    // ⚠⚠ UNE POINTE NE PORTE AUCUNE LIGNE PLEINE, ET C'EST SA DÉFINITION. Elle
    // ne peint que le carré de 2 × 2 d'un sommet rentrant ; le jour où elle
    // porterait une ligne entière, elle aurait cessé d'être un raccord et
    // barrerait le milieu d'un territoire — la faute exacte qu'aurait faite
    // `angle_l`, dont les bandes courent sur la moitié de la case.
    if (m[1] === 'pointe') {
      assert.deepEqual(lignes, [], `${f} : une pointe porte une ligne pleine`);
      assert.deepEqual(colonnes, [], `${f} : une pointe porte une colonne pleine`);
      pointes += 1;
      continue;
    }
    const exposes = m[1] === 'carre' ? 'neso' : m[2];
    const attL = [...(exposes.includes('n') ? bord.n : []),
      ...(exposes.includes('s') ? bord.s : [])];
    const attC = [...(exposes.includes('o') ? bord.o : []),
      ...(exposes.includes('e') ? bord.e : [])];
    assert.deepEqual(lignes, attL.sort((a, b) => a - b), `${f} : lignes pleines`);
    assert.deepEqual(colonnes, attC.sort((a, b) => a - b), `${f} : colonnes pleines`);
    vus += 1;
  }
  assert.equal(vus, 26, `${vus} fichiers de bande lus, attendu 26`);
  assert.equal(pointes, 8, `${pointes} pointes lues, attendu 8 (quatre par camp)`);

  // ⚠ ET LE MOTIF MESURE BIEN QUELQUE CHOSE : un trait laissé au milieu, comme
  // le zip le livre, tomberait en lignes 15/16 et non 30/31. L'appât le dit.
  assert.notDeepEqual([15, 16], bord.s);
});

// ---------------------------------------------------------------------------
// T5 — le détourage : ce qui est fermé l'est, ce qui est ouvert ne l'est pas
// ---------------------------------------------------------------------------

/** Les pixels transparents que le dessin ENFERME. */
function trousEnfermes(fichier) {
  const { largeur: l, hauteur: h, pixels } = decoderRgba(join(SPRITES, fichier));
  const vide = new Uint8Array(l * h);
  const vu = new Uint8Array(l * h);
  for (let i = 0; i < l * h; i += 1) vide[i] = pixels[i * 4 + 3] < 128 ? 1 : 0;
  const pile = [];
  const pousser = (i) => { if (vide[i] && !vu[i]) { vu[i] = 1; pile.push(i); } };
  for (let y = 0; y < h; y += 1) { pousser(y * l); pousser(y * l + l - 1); }
  for (let x = 0; x < l; x += 1) { pousser(x); pousser((h - 1) * l + x); }
  while (pile.length) {
    const i = pile.pop();
    const y = Math.floor(i / l);
    const x = i % l;
    if (y > 0) pousser(i - l);
    if (y < h - 1) pousser(i + l);
    if (x > 0) pousser(i - 1);
    if (x < l - 1) pousser(i + 1);
  }
  let t = 0;
  let a = 0;
  for (let i = 0; i < l * h; i += 1) { t += vide[i]; a += vu[i]; }
  return t - a;
}

test('LIMITE T5 — le cadre enferme, la forme ouverte n\'enferme rien', () => {
  // ⚠⚠ CETTE GARDE EST LA CONTREPARTIE DE L'EXCLUSION DE `sprite.test.js`. La
  // famille y est écartée du compte global des trous, parce qu'un `carre` en
  // enferme 11 792 à lui seul — c'est sa case, pas un défaut. L'écarter sans
  // rien mettre à la place l'aurait laissée sans garde de détourage : ici on
  // mesure forme par forme, et c'est plus fort que le compte global.
  //
  // ⚠ MESURÉ, ET CONTRE L'INTUITION : `trait` et `coin` sont OUVERTS — leur
  // trait ne fait pas le tour — et enferment donc EXACTEMENT ZÉRO. C'est cette
  // moitié-là qui garde le détourage : un `est_fond` qui percerait la bande
  // claire y ouvrirait des trous là où il ne peut pas y en avoir.
  const parForme = {};
  for (const f of readdirSync(SPRITES)) {
    if (!f.endsWith('.png')) continue;
    const forme = f.match(/^limite_[jo]_(trait|coin|u|carre|pointe)/)[1];
    (parForme[forme] ??= []).push(trousEnfermes(f));
  }
  for (const forme of ['trait', 'coin', 'pointe']) {
    assert.ok(parForme[forme].every((n) => n === 0),
      `${forme} enferme ${parForme[forme]} px : le détourage a percé une bande`);
  }
  // Et les formes FERMÉES enferment, sinon le compteur ne compterait rien.
  assert.ok(parForme.carre.every((n) => n > 10000),
    `carre n'enferme que ${parForme.carre} px : ce n'est plus un cadre fermé`);
  assert.ok(parForme.u.every((n) => n > 0),
    'le U n\'enferme rien : ses deux flancs ne se rejoignent plus');

  // ⚠ ET L'ALPHA RESTE BINAIRE — l'invariant du dépôt depuis toujours. `baver`
  // étend la COULEUR dans le transparent et ne touche pas l'alpha ; si elle s'y
  // mettait, le sprite s'épaissirait sans que sa forme change.
  const { pixels } = decoderRgba(join(SPRITES, 'limite_j_coin_ne.png'));
  for (let i = 3; i < pixels.length; i += 4) {
    assert.ok(pixels[i] === 0 || pixels[i] === 255,
      `alpha intermédiaire ${pixels[i]} : la transparence n'est plus binaire`);
  }
});

// ---------------------------------------------------------------------------
// T6 — le livrable, et le chemin de l'image
// ---------------------------------------------------------------------------

test('LIMITE T6 — l\'atlas entre au livrable par sa balise, et rien d\'autre', () => {
  const html = lire('src', 'index.src.html');
  assert.match(html, /<img id="monde-limites"[^>]*src="%ATLAS_LIMITE%"/,
    'la balise des limites a disparu ou ne porte plus son marqueur');
  assert.match(lire('tools', 'build.js'), /atlas\('limite'\)/,
    '%ATLAS_LIMITE% n\'est plus produit par le build');
  // ⚠ PAS DE VARIABLE CSS : l'atlas ne sert qu'au canevas. Une seconde
  // déclaration l'inlinerait DEUX fois — 25 570 octets pour rien, et c'est le
  // couplage que le lot SPRITES-ET-ZOOM a mesuré à 507 464 octets sur les atlas
  // partagés.
  assert.ok(!/--atlas-limite/.test(html),
    'l\'atlas des limites a pris une variable CSS : il s\'inlinerait deux fois');

  const dist = join(RACINE, 'dist', 'index.html');
  if (existsSync(dist)) {
    const produit = readFileSync(dist, 'utf8');
    assert.ok(!produit.includes('%ATLAS_LIMITE%'), 'le marqueur n\'a pas été remplacé');
    assert.match(produit, /id="monde-limites"[^>]*src="data:image\/webp;base64,/,
      'la balise des limites ne porte pas d\'image inlinée');
  }
});

test('LIMITE T7 — la frontière n\'est plus un trait, et l\'épaisseur est partie', () => {
  const monde = lire('src', 'ui', 'monde.js');
  const nue = monde
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  // ⚠⚠ UNE ASSERTION A ÉTÉ RETIRÉE AVEC ELLE, ET ELLE SE DÉCLARE :
  // `frontières — l'épaisseur suit le cran` de `territoire.test.js` gardait
  // `epaisseurDeFrontiere`, qui n'a plus aucun appelant de production depuis que
  // la frontière est faite de sprites. Une fonction que seul son test atteint
  // est morte ; on la retire plutôt que de garder un test qui se garde lui-même.
  assert.ok(!/epaisseurDeFrontiere/.test(nue),
    'l\'épaisseur de frontière est revenue sans que la frontière soit un trait');
  // Le repli au trait est parti aussi : voir le commentaire de `dessinerFrontieres`.
  const bloc = nue.slice(nue.indexOf('function dessinerFrontieres'));
  const corps = bloc.slice(0, bloc.indexOf('\n  }\n'));
  assert.ok(!/strokeStyle|ctx\.stroke\(\)/.test(corps),
    'la frontière trace encore au strokeStyle');
  assert.match(corps, /drawImage/, 'la frontière ne dessine plus de sprite');

  // ⚠ `TEINTES_TERRITOIRE` RESTE, et ce n'est pas un oubli : le halo de la base
  // attaquante et la flèche du raid s'en servent toujours.
  assert.match(nue, /TEINTES_TERRITOIRE\[JOUEUR\]/,
    'les teintes de territoire ne servent plus à rien — les retirer, alors');
});

// ---------------------------------------------------------------------------
// T8 — la couleur de la frontière, et son écart au sol de la carte
// ---------------------------------------------------------------------------

/** La clarté L* d'un pixel sRGB. Elle RANGE et elle MESURE, elle ne peint pas. */
function clarte([r, v, b]) {
  const lin = [r, v, b].map((c) => c / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return 116 * (y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116) - 16;
}

const hexEnRvb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Les hex d'une rampe de `FICHE-STYLE.md`, dans l'ordre du creux à la lumière. */
function rampeDeLaFiche(titre) {
  const fiche = lire('FICHE-STYLE.md');
  const debut = fiche.indexOf(titre);
  assert.notEqual(debut, -1, `FICHE-STYLE.md ne porte plus la rampe « ${titre} »`);
  const suite = fiche.slice(debut + titre.length);
  const bloc = suite.slice(0, suite.indexOf('\n### ') === -1 ? undefined : suite.indexOf('\n### '));
  const hex = [...bloc.matchAll(/`(#[0-9A-Fa-f]{6})`/g)].map((m) => m[1].toUpperCase());
  assert.equal(hex.length, 5, `« ${titre} » ne porte plus cinq tons mais ${hex.length}`);
  return hex;
}

/** Les tons OPAQUES d'un sprite de limite, du plus sombre au plus clair. */
function tonsDuSprite(fichier) {
  const { largeur, hauteur, pixels } = decoderRgba(join(SPRITES, fichier));
  const vus = new Map();
  for (let i = 0; i < largeur * hauteur; i += 1) {
    // ⚠ SEUIL À 128, PAS « ALPHA > 0 ». `baver` étend la couleur opaque dans le
    // transparent et `decoderRgba` dé-prémultiplie : la frange porte donc des
    // teintes intermédiaires à alpha faible, qui ne sont pas des tons du
    // dessin. C'est le même seuil que la garde de clé de `sprite.test.js`.
    if (pixels[i * 4 + 3] < 128) continue;
    const px = [pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]];
    vus.set(px.join(','), px);
  }
  return [...vus.values()].sort((a, b) => clarte(a) - clarte(b));
}

/** Les deux rampes de frontière de `FICHE-STYLE.md`, rang par rang. */
function rampesDeFrontiere() {
  const fiche = lire('FICHE-STYLE.md');
  const titre = '### Frontières de territoire';
  const debut = fiche.indexOf(titre);
  assert.notEqual(debut, -1, 'FICHE-STYLE.md ne porte plus la section des frontières');
  const suite = fiche.slice(debut + titre.length);
  const bloc = suite.slice(0, suite.indexOf('\n### '));
  // Chaque ligne du tableau porte son rang, son rôle, puis les deux hex.
  const lignes = [...bloc.matchAll(/^\| (\d) \|[^|]*\| `(#[0-9A-Fa-f]{6})` \| `(#[0-9A-Fa-f]{6})` \|$/gm)];
  assert.equal(lignes.length, 4,
    `la section des frontières porte ${lignes.length} rangs, quatre attendus`);
  lignes.forEach((m, i) => assert.equal(Number(m[1]), i + 1, 'les rangs ne se suivent plus'));
  return { j: lignes.map((m) => m[2].toUpperCase()), o: lignes.map((m) => m[3].toUpperCase()) };
}

/** La chroma C* d'un pixel sRGB, et sa teinte en degrés. */
function chromaEtTeinte([r, v, b]) {
  const lin = [r, v, b].map((c) => c / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const xyz = [
    (0.4124 * lin[0] + 0.3576 * lin[1] + 0.1805 * lin[2]) / 0.95047,
    0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2],
    (0.0193 * lin[0] + 0.1192 * lin[1] + 0.9505 * lin[2]) / 1.08883,
  ].map((t) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116));
  const a = 500 * (xyz[0] - xyz[1]);
  const bb = 200 * (xyz[1] - xyz[2]);
  return { chroma: Math.hypot(a, bb), teinte: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

test('LIMITE T8 — la frontière porte sa rampe, et elle RESSORT du sol satellite', () => {
  // ⚠⚠ ARBITRAGE D'ETHAN, 05/09 : « tu re-appliques un coloris vert kaki mais
  // assez vif pour qu'il se détache par rapport au nouveau plan satellite et tu
  // prends un violet pareil assez vif comme ouvrage mais qui ressort et qui
  // contraste par rapport au nouveau sol de la carte ». La frontière avait été
  // recolorisée le 03/09 sur les quatre tons sombres des rampes de CAMP ; elle
  // porte depuis le 05/09 deux rampes à elle, écrites dans FICHE-STYLE.md.
  const RAMPES = rampesDeFrontiere();

  // ⚠⚠ ET C'EST LA FICHE QU'ON LIT, PAS UNE TRANSCRIPTION. Les huit tons vivent
  // dans `tools/limites.py`, qui les produit, et dans la fiche, qui fait autorité
  // sur le style. Les recopier ici en ferait une troisième copie, celle qui
  // vieillit — la faute que ce dépôt a déjà payée sur la palette de `banc.test.js`.
  for (const [lettre, rampe] of Object.entries(RAMPES)) {
    for (const forme of ['carre', 'trait_n', 'coin_ne', 'u_neo']) {
      const tons = tonsDuSprite(`limite_${lettre}_${forme}.png`);
      assert.equal(tons.length, 4,
        `limite_${lettre}_${forme} : ${tons.length} tons opaques, 4 attendus`);
      assert.deepEqual(tons.map((t) => `#${t.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`),
        rampe, `limite_${lettre}_${forme} : la frontière n'est pas sur la rampe de son camp`);
    }
    // ⚠ LA POINTE N'EN PORTE QUE DEUX, ET CE SONT LES DEUX TONS DE BANDE. Les
    // rangs 2 et 4 sont les repères et les éclats ; un carré de deux pixels de
    // côté n'a ni l'un ni l'autre à porter.
    for (const coin of COINS) {
      const tons = tonsDuSprite(`limite_${lettre}_pointe_${coin}.png`);
      assert.deepEqual(tons.map((t) => `#${t.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`),
        [rampe[0], rampe[2]],
        `limite_${lettre}_pointe_${coin} : ce ne sont pas les deux tons de bande`);
    }
  }

  // ⚠⚠ LE SOL SE LIT DANS SON MANIFESTE, ET C'EST CE QUI A CHANGÉ LE 05/09.
  // Cette garde mesurait contre `TERRAIN_CARTE.rampes`, la référence DÉCLARÉE de
  // l'ancien sol indexé, dont les cinq clartés s'arrêtaient à L* 58,1 par le bas.
  // Le lot SOL-SATELLITE a mis l'art d'Ethan à la place, et il descend plus bas :
  // le manifeste porte désormais les quantiles MESURÉS sur les huit planches
  // alignées. Node n'a pas de décodeur WebP — sans ces nombres, la suite ne
  // pourrait rien dire du sol qui est vraiment à l'écran.
  const sol = JSON.parse(lire('art', 'sprites', 'sol', 'sol-empreintes.json'));
  assert.ok(sol.clarte && typeof sol.clarte.p5 === 'number',
    'sol-empreintes.json ne porte plus la clarté du sol');
  assert.ok(sol.clarte.p1 < sol.clarte.p5 && sol.clarte.p5 < sol.clarte.p50
    && sol.clarte.p50 < sol.clarte.p95, 'les quantiles de clarté du sol ne sont pas rangés');

  // ⚠⚠ ET LA GRANDEUR EST SIGNÉE : LA FRONTIÈRE EST PLUS SOMBRE QUE LE SOL, PAS
  // « LOIN DE LUI ». Un écart en valeur absolue serait tenu par un ton PLUS CLAIR
  // que le sol, ce qui est le cas de l'ancien gris-bleu de l'Ouvrage — et sur un
  // sol dont le p95 vaut 74,2, aucun ton lisible n'est atteignable par le haut en
  // sRGB. MESURÉ : le pire des huit tons est le kaki de rang 4, à 7,1 sous le p5.
  const SOUS_LE_SOL = 5;
  for (const [lettre, rampe] of Object.entries(RAMPES)) {
    for (const hex of rampe) {
      const ecart = sol.clarte.p5 - clarte(hexEnRvb(hex));
      assert.ok(ecart >= SOUS_LE_SOL,
        `limite_${lettre} : ${hex} est à ${ecart.toFixed(1)} sous le p5 du sol (${SOUS_LE_SOL} au moins)`);
    }
  }

  // ⚠⚠ ET LA BORNE N'EST PAS VACUEUSE : LES DEUX TONS QUI ONT FAIT LE PREMIER
  // RAPPORT D'ETHAN LA FRANCHISSENT ENCORE. `#CD6F26` — l'or de la frontière
  // livrée — est à 1,6 seulement sous le p5, et `#9FB3C5` est AU-DESSUS du sol,
  // donc pris par le signe. Sans cette paire, « cinq clartés » pourrait être
  // n'importe quel nombre.
  assert.ok(sol.clarte.p5 - clarte(hexEnRvb('#CD6F26')) < SOUS_LE_SOL,
    'l\'ancien ton or de la frontière passerait la borne : elle ne garde rien');
  assert.ok(sol.clarte.p5 - clarte(hexEnRvb('#9FB3C5')) < SOUS_LE_SOL,
    'l\'ancien ton gris-bleu de l\'Ouvrage passerait la borne : elle ne garde rien');

  // ⚠⚠ « ASSEZ VIF » EST LA DEMANDE, ET C'EST UNE CHROMA, PAS UNE CLARTÉ. C'est
  // la seule moitié de l'arbitrage du 05/09 qu'aucune autre assertion ne mesure :
  // les quatre tons gardent la CLARTÉ et la TEINTE de la rampe de camp de même
  // rang, et doublent sa chroma. Écrit ainsi, l'énoncé tombe dans les deux sens —
  // une rampe qui s'éclaircirait, une qui virerait de teinte, une qui
  // retomberait sur les tons de châssis.
  const CAMPS = { j: '### Châssis — kaki désaturé', o: '### Ouvrage — ardoise violacée' };
  for (const [lettre, titre] of Object.entries(CAMPS)) {
    const entite = rampeDeLaFiche(titre).slice(0, 4);
    RAMPES[lettre].forEach((hex, rang) => {
      const f = { ...chromaEtTeinte(hexEnRvb(hex)), clarte: clarte(hexEnRvb(hex)) };
      const e = { ...chromaEtTeinte(hexEnRvb(entite[rang])), clarte: clarte(hexEnRvb(entite[rang])) };
      assert.ok(Math.abs(f.clarte - e.clarte) <= 0.3,
        `${hex} : clarté ${f.clarte.toFixed(1)} contre ${e.clarte.toFixed(1)} pour ${entite[rang]}`);
      // ⚠ LA TEINTE NE SE COMPARE QUE LÀ OÙ ELLE EXISTE. Le rang 1 des deux
      // rampes de camp est presque neutre — chroma 3,9 côté kaki, 3,7 côté
      // ardoise — et la teinte d'un ton neutre est du bruit : le kaki de rang 1
      // rend 133° quand les trois autres rendent 125°. Exiger l'égalité là ferait
      // tomber la garde sur une rampe parfaitement juste. Le seuil est celui
      // sous lequel `chromaEtTeinte` cesse de vouloir dire quelque chose.
      const CHROMA_LISIBLE = 8;
      if (e.chroma >= CHROMA_LISIBLE) {
        const dTeinte = Math.abs(((f.teinte - e.teinte + 540) % 360) - 180);
        assert.ok(dTeinte <= 3,
          `${hex} : teinte ${f.teinte.toFixed(0)}° contre ${e.teinte.toFixed(0)}° pour ${entite[rang]}`);
      }
      assert.ok(f.chroma >= 1.8 * e.chroma,
        `${hex} : chroma ${f.chroma.toFixed(1)} contre ${e.chroma.toFixed(1)} pour ${entite[rang]} — `
        + 'la frontière n\'est plus « assez vive »');
    });
    // ⚠ ET LA RAMPE DE FRONTIÈRE A UNE TEINTE À ELLE, CONSTANTE SUR SES QUATRE
    // RANGS. C'est ce que le rang 1 ne peut pas dire ci-dessus, et c'est la
    // moitié qui reste à mesurer : une rampe dont un ton virerait ne serait plus
    // le même coloris « en plus vif », elle serait un autre coloris.
    const teintes = RAMPES[lettre].map((h) => chromaEtTeinte(hexEnRvb(h)).teinte);
    for (const t of teintes) {
      assert.ok(Math.abs(((t - teintes[2] + 540) % 360) - 180) <= 3,
        `la rampe ${lettre} vire de teinte : ${teintes.map((x) => x.toFixed(0)).join('°, ')}°`);
    }
  }

  // ⚠⚠ ET LE DEDANS RESTE SOMBRE, LE DEHORS CLAIR — LA GARDE L'AVAIT MANQUÉ.
  // Une première version de ce test ne comparait que l'ENSEMBLE des tons à la
  // rampe : mesuré, renverser le rangement par clarté dans `tools/limites.py`
  // — donc peindre la bande extérieure du creux et la bande intérieure de la
  // lumière — la laissait ENTIÈREMENT VERTE, la permutation ne faisant pas
  // sortir un seul ton de la rampe. Or c'est précisément ce que la frontière
  // apporte sur un trait de deux pixels : « bande sombre côté territoire, bande
  // claire dehors ». La garde nomme donc la propriété, et non l'ensemble.
  //
  // Le `carre` expose ses quatre côtés, donc son territoire est DEDANS : sa
  // ligne logique 0 est le tout bord — dehors —, et la 1 est juste en dedans.
  // MESURÉ : L* moyen 38,7 contre 10,0 côté joueur, 23,3 contre 4,4 côté
  // Ouvrage. La borne est à 8, très en dessous des deux. ⚠ L'aviver n'y change
  // rien PAR CONSTRUCTION, les clartés étant celles d'avant au dixième.
  const LOGIQUE = 32;
  const ECART_DEDANS_DEHORS = 8;
  for (const lettre of ['j', 'o']) {
    const { largeur, pixels } = decoderRgba(join(SPRITES, `limite_${lettre}_carre.png`));
    const pas = largeur / LOGIQUE;
    const moyenne = (g) => {
      const vus = [];
      for (let x = 0; x < LOGIQUE; x += 1) {
        const i = ((g * pas + Math.floor(pas / 2)) * largeur + x * pas + Math.floor(pas / 2)) * 4;
        if (pixels[i + 3] >= 128) vus.push(clarte([pixels[i], pixels[i + 1], pixels[i + 2]]));
      }
      assert.ok(vus.length > LOGIQUE / 2, `limite_${lettre} : la ligne logique ${g} est vide`);
      return vus.reduce((t, v) => t + v, 0) / vus.length;
    };
    const dehors = moyenne(0);
    const dedans = moyenne(1);
    assert.ok(dehors - dedans >= ECART_DEDANS_DEHORS,
      `limite_${lettre} : dehors L* ${dehors.toFixed(1)} contre dedans ${dedans.toFixed(1)} — `
      + 'la bande sombre n\'est plus du côté du territoire');
  }

  // ⚠ « VERT » ET « VIOLET » SE VÉRIFIENT, ILS NE SE CROIENT PAS. Ethan a nommé
  // deux teintes ; un rangement par clarté seule serait vrai de deux rampes
  // grises. Le kaki a le VERT dominant, l'ardoise le BLEU — sur les quatre tons,
  // pas seulement sur le corps.
  for (const [r, v, b] of tonsDuSprite('limite_j_carre.png')) {
    assert.ok(v > r && v >= b, `la frontière du joueur n'est pas verte : ${r} ${v} ${b}`);
  }
  for (const [r, v, b] of tonsDuSprite('limite_o_carre.png')) {
    assert.ok(b > r && b > v, `la frontière de l'Ouvrage n'est pas violette : ${r} ${v} ${b}`);
  }
});

// ---------------------------------------------------------------------------
// T9 — le sommet rentrant : le modèle le nomme, le dessin le pose
// ---------------------------------------------------------------------------

test('LIMITE T9 — un sommet rentrant se lit sur la DIAGONALE, et il porte sa pointe', () => {
  // ⚠⚠ ETHAN, 05/09 : « quand tu dessines un territoire en U il manque les deux
  // points, je pense qu'il manque les coins en 270 degrés ». Un sommet est
  // rentrant quand les deux voisines orthogonales du coin sont du même camp et
  // que la DIAGONALE ne l'est pas. C'est un fait de modèle, et le seul que les
  // quatre booléens de côté ne peuvent pas exprimer.
  const dedans = (u, r, c) => r >= 0 && r < u.length && c >= 0 && c < u[0].length
    && u[r][c] === 'X';
  const bord = (u, r, c) => {
    const autre = (dr, dc) => !dedans(u, r + dr, c + dc);
    const rentrant = (dr, dc) => !autre(dr, 0) && !autre(0, dc) && autre(dr, dc);
    return {
      nord: autre(-1, 0), est: autre(0, 1), sud: autre(1, 0), ouest: autre(0, -1),
      rentrants: {
        ne: rentrant(-1, 1), es: rentrant(1, 1), so: rentrant(1, -1), no: rentrant(-1, -1),
      },
    };
  };

  // Le U d'Ethan : deux sommets rentrants, un par épaule de l'encoche.
  const U = ['XXX', 'X.X', 'X.X'];
  const sommets = [];
  for (let r = 0; r < U.length; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (!dedans(U, r, c)) continue;
      const b = bord(U, r, c);
      for (const coin of COINS) if (b.rentrants[coin]) sommets.push(`${r},${c},${coin}`);
    }
  }
  assert.deepEqual(sommets, ['0,0,es', '0,2,so'],
    'le U ne porte plus exactement les deux sommets rentrants qu\'Ethan compte');

  // ⚠⚠ ET CE SONT DEUX CASES QUI ONT DÉJÀ DES CÔTÉS EXPOSÉS — le cas FACILE.
  // Sur une vraie carte c'est l'inverse : mesuré au lot, les 360 sommets
  // rentrants de vingt graines sont tous sur des cases dont les quatre côtés
  // sont intérieurs. Le montage en pose un, sans quoi ce test ne verrait que la
  // moitié du problème.
  const enclave = ['XXX', 'XXX', 'XX.'];
  const centre = bord(enclave, 1, 1);
  assert.deepEqual(
    { nord: centre.nord, est: centre.est, sud: centre.sud, ouest: centre.ouest },
    { nord: false, est: false, sud: false, ouest: false },
    'le montage de l\'enclave a cessé d\'être le cas sans côté exposé',
  );
  assert.deepEqual(spritesDeLaLimite(JOUEUR, centre), ['limite_j_pointe_es'],
    'une case sans côté exposé et à sommet rentrant ne rend pas sa seule pointe');

  // Et le coin nommé est bien le coin dessiné : quatre montages, un par coin.
  const parCoin = {
    ne: ['XXX', 'XXX', '.XX'.split('').reverse().join('')],
    es: ['XXX', 'XXX', 'XX.'],
    so: ['XXX', 'XXX', '.XX'],
    no: ['.XX', 'XXX', 'XXX'],
  };
  parCoin.ne = ['XX.', 'XXX', 'XXX'];
  for (const [coin, u] of Object.entries(parCoin)) {
    assert.deepEqual(spritesDeLaLimite(OUVRAGE, bord(u, 1, 1)), [`limite_o_pointe_${coin}`],
      `le coin ${coin} ne rend pas la pointe attendue`);
  }

  // ⚠ ET LE DÉCOUPAGE PASSE PAR LE MÊME CHEMIN QUE LES BANDES : une pointe est
  // une cellule de l'atlas comme une autre, posée sur la case ENTIÈRE. C'est le
  // sprite qui sait où est son carré, pas l'écran.
  const pieces = dessinerLimiteDUneCase(JOUEUR, centre, 10.2, 20.7, 40);
  assert.equal(pieces.length, 1);
  assert.equal(pieces[0].nom, 'limite_j_pointe_es');
  assert.equal(pieces[0].cote, 40, 'la pointe n\'est pas posée à la taille de la case');
  assert.ok(Number.isInteger(pieces[0].x) && Number.isInteger(pieces[0].y),
    'la pointe se pose à une position fractionnaire');
});

// ---------------------------------------------------------------------------
// T10 — le U rendu : les deux points sont là, et ils raccordent
// ---------------------------------------------------------------------------

test('LIMITE T10 — le U se ferme à ses deux sommets rentrants', () => {
  // ⚠⚠ CE TEST REND VRAIMENT LE U, ET C'EST CE QUI LE REND FALSIFIABLE. Les
  // autres gardes de ce fichier lisent des NOMS ; celle-ci compose les sprites
  // sur une toile et regarde les pixels du sommet. Sur `origin/main` elle tombe :
  // mesuré avant d'écrire une ligne de ce lot, les deux carrés de raccord y
  // valent **0 pixel logique peint sur 4**.
  const T = COTE_SPRITE;
  const U = ['XXX', 'X.X', 'X.X'];
  const dedans = (r, c) => r >= 0 && r < U.length && c >= 0 && c < 3 && U[r][c] === 'X';
  const W = 3 * T;
  const H = U.length * T;
  const toile = new Uint8Array(W * H * 4);
  const cache = new Map();
  for (let r = 0; r < U.length; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (!dedans(r, c)) continue;
      const autre = (dr, dc) => !dedans(r + dr, c + dc);
      const rentrant = (dr, dc) => !autre(dr, 0) && !autre(0, dc) && autre(dr, dc);
      const cotes = {
        nord: autre(-1, 0), est: autre(0, 1), sud: autre(1, 0), ouest: autre(0, -1),
        rentrants: {
          ne: rentrant(-1, 1), es: rentrant(1, 1), so: rentrant(1, -1), no: rentrant(-1, -1),
        },
      };
      for (const nom of spritesDeLaLimite(JOUEUR, cotes)) {
        if (!cache.has(nom)) cache.set(nom, decoderRgba(join(SPRITES, `${nom}.png`)));
        const s = cache.get(nom);
        for (let y = 0; y < T; y += 1) {
          for (let x = 0; x < T; x += 1) {
            const si = (y * s.largeur + x) * 4;
            if (s.pixels[si + 3] < 128) continue;
            const di = ((r * T + y) * W + c * T + x) * 4;
            toile[di] = s.pixels[si];
            toile[di + 1] = s.pixels[si + 1];
            toile[di + 2] = s.pixels[si + 2];
            toile[di + 3] = 255;
          }
        }
      }
    }
  }

  const LOGIQUE = 32;
  const pas = T / LOGIQUE;
  const lire = (y, x) => {
    const i = (y * W + x) * 4;
    return toile[i + 3] < 128 ? null : [toile[i], toile[i + 1], toile[i + 2]];
  };
  // Le pixel logique (g, h) de la case (r, c), pris en son centre.
  const px = (r, c, g, h) => lire(r * T + g * pas + pas / 2, c * T + h * pas + pas / 2);

  const RAMPE = rampesDeFrontiere().j.map((x) => x.toUpperCase());
  const hex = (p) => `#${p.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

  // ⚠ LES DEUX SOMMETS, ET LEURS QUATRE PIXELS CHACUN. Le carré de raccord de
  // l'épaule gauche est au coin SUD-EST de la case (0, 0) ; celui de l'épaule
  // droite au coin SUD-OUEST de la case (0, 2).
  // ⚠ LA COLONNE DU SOMMET EST LA PLUS EXTÉRIEURE DES DEUX, ET ELLE CHANGE DE
  // CÔTÉ : 31 pour un raccord au sud-est, 0 pour un raccord au sud-ouest.
  // L'écrire à l'envers fait tomber ce test en nommant le ton lu — c'est arrivé
  // en l'écrivant, et c'est le signe qu'il mesure bien le pixel qu'il vise.
  for (const [c, colonneDuCarre, colonneDuSommet] of [[0, 30, 31], [2, 1, 0]]) {
    const bloc = [];
    for (let g = 30; g <= 31; g += 1) {
      for (const h of [colonneDuCarre, colonneDuSommet]) bloc.push([g, h, px(0, c, g, h)]);
    }
    for (const [g, h, p] of bloc) {
      assert.ok(p, `case (0, ${c}) : le pixel logique (${g}, ${h}) du sommet rentrant est vide — `
        + 'c\'est le trou qu\'Ethan a vu sur le U');
    }
    // Le pixel qui TOUCHE le sommet porte la bande claire, les trois autres la
    // sombre : c'est le raccord d'onglet, et son inverse mettrait le clair au
    // fond du territoire.
    const sommet = px(0, c, 31, colonneDuSommet);
    assert.equal(hex(sommet), RAMPE[2],
      `case (0, ${c}) : le pixel du sommet vaut ${hex(sommet)}, la bande claire attendue`);
    for (const [g, h, p] of bloc) {
      if (g === 31 && h === colonneDuSommet) continue;
      assert.equal(hex(p), RAMPE[0],
        `case (0, ${c}) : le pixel (${g}, ${h}) vaut ${hex(p)}, la bande sombre attendue`);
    }
  }

  // ⚠⚠ ET LE RACCORD SE MESURE CONTRE SES VOISINES, PAS DANS SON COIN. Les deux
  // bandes qui arrivent au sommet appartiennent à d'AUTRES cases : celle du
  // dessus vient du `trait_s` de (0, 1), celle du dessous du `trait_e` de (1, 0).
  // Une pointe qui porterait les bons tons dans le mauvais ordre laisserait une
  // rupture visible d'un pixel, et rien d'autre ne la verrait.
  assert.equal(hex(px(0, 1, 30, 0)), hex(px(0, 0, 30, 30)),
    'la bande sombre ne se continue pas de (0, 1) dans le raccord de (0, 0)');
  assert.equal(hex(px(0, 1, 31, 0)), hex(px(0, 0, 31, 31)),
    'la bande claire ne se continue pas de (0, 1) dans le raccord de (0, 0)');
  assert.equal(hex(px(1, 0, 0, 30)), hex(px(0, 0, 31, 30)),
    'la bande sombre ne se continue pas de (1, 0) dans le raccord de (0, 0)');
  assert.equal(hex(px(1, 0, 0, 31)), hex(px(0, 0, 31, 31)),
    'la bande claire ne se continue pas de (1, 0) dans le raccord de (0, 0)');

  // ⚠ ET LA POINTE NE DÉBORDE PAS : le pixel logique juste en dedans du carré
  // reste vide, sans quoi elle aurait cessé d'être un raccord.
  assert.equal(px(0, 0, 29, 29), null,
    'la pointe déborde de son carré : elle peint le dedans du territoire');
});
