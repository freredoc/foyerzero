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
  spritesDeLaLimite, dessinerLimiteDUneCase, LETTRE_DU_CAMP, COTES, FAMILLE,
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

// ---------------------------------------------------------------------------
// T1 — les seize cas, et l'atlas, dans les DEUX sens
// ---------------------------------------------------------------------------

test('LIMITE T1 — les seize cas se résolvent, et rien n\'est cousu pour rien', () => {
  const dans = new Set(ATLAS[FAMILLE].noms);
  const employes = new Set();
  for (const camp of [JOUEUR, OUVRAGE]) {
    for (const cotes of tousLesCas()) {
      const noms = spritesDeLaLimite(camp, cotes);
      const combien = COTES.filter((c) => cotes[c]).length;
      // ⚠ LE COMPTE DE PIÈCES SE VÉRIFIE, PAS SEULEMENT LEUR EXISTENCE. Deux
      // côtés OPPOSÉS demandent DEUX traits ; une seule pièce y laisserait un
      // des deux bords nu, et un test qui ne regarde que « le nom existe »
      // passerait dessus.
      const attendu = combien === 0 ? 0
        : (combien === 2 && ((cotes.nord && cotes.sud) || (cotes.est && cotes.ouest))) ? 2 : 1;
      assert.equal(noms.length, attendu,
        `${COTES.filter((c) => cotes[c]).join('+') || 'aucun'} : ${noms.length} pièce(s)`);
      for (const n of noms) {
        assert.ok(dans.has(n), `${n} n'est pas dans l'atlas ${FAMILLE}`);
        employes.add(n);
      }
    }
  }
  // ⚠⚠ ET DANS L'AUTRE SENS : chaque cellule cousue sert. Un sprite produit,
  // cousu et jamais demandé est du poids payé pour rien — la leçon des murs de
  // l'Ouvrage, restés huit mois... deux lots produits sans être dessinés.
  assert.deepEqual([...employes].sort(), [...dans].sort(),
    'l\'atlas et les seize cas ne couvrent pas les mêmes noms');
  assert.equal(dans.size, 26, `${dans.size} cellules cousues, attendu 26 (13 par camp)`);

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
  for (const f of readdirSync(SPRITES)) {
    if (!f.endsWith('.png')) continue;
    const m = f.match(/^limite_[jo]_(trait|coin|u|carre)(?:_([neso]+))?\.png$/);
    assert.ok(m, `${f} ne suit pas la convention de nom`);
    const exposes = m[1] === 'carre' ? 'neso' : m[2];
    const { lignes, colonnes } = traits(f);
    const attL = [...(exposes.includes('n') ? bord.n : []),
      ...(exposes.includes('s') ? bord.s : [])];
    const attC = [...(exposes.includes('o') ? bord.o : []),
      ...(exposes.includes('e') ? bord.e : [])];
    assert.deepEqual(lignes, attL.sort((a, b) => a - b), `${f} : lignes pleines`);
    assert.deepEqual(colonnes, attC.sort((a, b) => a - b), `${f} : colonnes pleines`);
    vus += 1;
  }
  assert.equal(vus, 26, `${vus} fichiers lus, attendu 26`);

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
    const forme = f.match(/^limite_[jo]_(trait|coin|u|carre)/)[1];
    (parForme[forme] ??= []).push(trousEnfermes(f));
  }
  for (const forme of ['trait', 'coin']) {
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

test('LIMITE T8 — la frontière porte la rampe de son camp, et elle RESSORT du sol', () => {
  // ⚠⚠ ARBITRAGE D'ETHAN, 03/09 AU SOIR : « code couleur frontiere : vert kaki
  // joueur et l'autre violet ouvrage / il faut que ça ressort sur le terrain. /
  // recolorise si il le faut ». Les dessins livrés portaient OR/AMBRE pour le
  // joueur et GRIS-BLEU PÂLE pour l'Ouvrage — ce que le rapport du lot
  // TERRITOIRE avait relevé comme « un arbitrage qui revient à Ethan ».
  const RAMPES = {
    j: rampeDeLaFiche('### Châssis — kaki désaturé'),
    o: rampeDeLaFiche('### Ouvrage — ardoise violacée'),
  };

  // ⚠⚠ LES QUATRE PREMIERS TONS DE LA RAMPE, PAS QUATRE TONS AU CHOIX, ET LE
  // CHOIX EST MESURÉ CI-DESSOUS : prendre les tons 2 à 5 laisserait le kaki
  // `#8C9A72` à 3,5 de clarté du sol, c'est-à-dire refaire la faute qu'on
  // corrige. L'assertion lit la fiche, qui fait autorité sur le style, plutôt
  // que de recopier une troisième fois quatre hex.
  const QUATRE = 4;
  for (const [lettre, rampe] of Object.entries(RAMPES)) {
    const attendus = rampe.slice(0, QUATRE);
    for (const forme of ['carre', 'trait_n', 'coin_ne', 'u_neo']) {
      const tons = tonsDuSprite(`limite_${lettre}_${forme}.png`);
      assert.equal(tons.length, QUATRE,
        `limite_${lettre}_${forme} : ${tons.length} tons opaques, ${QUATRE} attendus`);
      assert.deepEqual(tons.map((t) => t.map((c) => c.toString(16).padStart(2, '0'))
        .join('').toUpperCase()).map((h) => `#${h}`), attendus,
        `limite_${lettre}_${forme} : la frontière n'est pas sur la rampe de son camp`);
    }
  }

  // ⚠⚠ ET LE SOL DE LA CARTE EST LA GRANDEUR CONTRE LAQUELLE ON MESURE, PAS UN
  // SEUIL D'INTUITION. `TERRAIN_CARTE.rampes` porte les deux rampes de sol, dont
  // les cinq clartés sont identiques rang par rang — FICHE-STYLE §3 le veut
  // ainsi, « deux sols de clarté différente donnent à un camp un camouflage que
  // personne n'a décidé ». Le sol est donc CLAIR des deux côtés, et une
  // frontière ne s'y lit que si elle est franchement plus sombre.
  const solsL = [...TERRAIN_CARTE.rampes.joueur, ...TERRAIN_CARTE.rampes.ouvrage]
    .map((h) => clarte(hexEnRvb(h)));
  const ecartAuSol = (px) => Math.min(...solsL.map((s) => Math.abs(clarte(px) - s)));

  // MESURÉ sur les huit tons des deux camps : le pire écart vaut 10,2 — le kaki
  // `#6A7658`, 11 % du dessin. La borne est à 8.
  const BORNE = 8;
  for (const lettre of ['j', 'o']) {
    for (const px of tonsDuSprite(`limite_${lettre}_carre.png`)) {
      assert.ok(ecartAuSol(px) >= BORNE,
        `limite_${lettre} : un ton à ${ecartAuSol(px).toFixed(1)} de clarté du sol, ${BORNE} au moins`);
    }
  }

  // ⚠⚠ ET LA BORNE N'EST PAS VACUEUSE : LES DEUX TONS QUI ONT FAIT LE RAPPORT
  // D'ETHAN LA FRANCHISSENT. `#CD6F26` — 16,2 % de l'ancienne frontière du
  // joueur — était à 1,5 de clarté du sol le plus sombre, et `#9FB3C5` à 8,8.
  // Sans cette paire, « écart au moins 8 » pourrait être n'importe quel nombre.
  assert.ok(ecartAuSol(hexEnRvb('#CD6F26')) < BORNE,
    'l\'ancien ton or de la frontière passerait la borne : elle ne garde rien');
  assert.ok(ecartAuSol(hexEnRvb('#9FB3C5')) < BORNE,
    'l\'ancien ton gris-bleu de l\'Ouvrage passerait la borne : elle ne garde rien');

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
  // Ouvrage. La borne est à 8, très en dessous des deux.
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
