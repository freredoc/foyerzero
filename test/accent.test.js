// L'accent DESSINÉ confronté à la table de dégâts — lot ACCENT-CONFRONTÉ.
//
// ⚠⚠ POURQUOI CE FICHIER EXISTE. Le lot UNITÉS-AU-COMBAT a remplacé le casque
// procédural — un rectangle à la teinte de la colonne de dégâts dominante — par
// un sprite. Son rapport a posé la question comme une PERTE d'information ;
// mesuré, c'en est une autre : les sprites PORTENT leur accent, dans les teintes
// exactes de la palette, et `accentDe` retombe dessus quatorze fois sur
// quatorze pour les unités entières du joueur. Ce qui a été perdu, ce n'est pas
// l'information — c'est la GARANTIE qu'elle y soit.
//
// C'est un croisement art ↔ table, la classe de défaut qui a mordu cinq fois
// pendant la session des sprites : deux choses justes séparément, fausses
// ensemble. Aucun test ne le faisait.
//
// ⚠⚠ ET IL MESURE CE QUI EST AFFICHÉ, PAS CE QUI PORTE LE NOM DE L'UNITÉ. Un
// blindé du JOUEUR est composé de deux sprites depuis le lot précédent — sa
// coque et sa tourelle — et son sprite `unite/` n'est plus dessiné au combat.
// C'est là que se cachent deux des quatre dettes : `off_j_broyeur` entier est
// JUSTE, son composé ne l'est pas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decoderRgba } from './png-rgba.js';
import { PALETTE, accentDe, classeDe } from '../src/render/scene.js';
import { UNITES } from '../src/data/combat.js';
import { ORIENTATIONS } from '../src/sim/rendu-pose.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites');
const GRILLE = 64; // la seule grille cousue dans un atlas, donc la seule affichée

/**
 * Les six teintes d'accent, LUES DANS `PALETTE`, jamais recopiées.
 *
 * ⚠ C'EST LA MOITIÉ QUI REND CE TEST HONNÊTE. Une table écrite en dur ici
 * resterait verte si quelqu'un changeait une teinte d'accent dans la fiche de
 * style : le dessin et la table diraient alors deux choses différentes, et le
 * garde-fou censé les confronter regarderait un troisième jeu de valeurs.
 */
function teintesDAccent() {
  const table = new Map();
  for (const [colonne, t] of Object.entries(PALETTE.accents)) {
    table.set(t.sombre.toUpperCase(), colonne);
    table.set(t.clair.toUpperCase(), colonne);
  }
  return table;
}

const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('')}`;
const octets = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/**
 * Les quatorze teintes de la rampe du joueur, dans l'ordre où la chaîne les
 * range : cinq kaki, trois métal, puis les six accents.
 *
 * ⚠ L'ORDRE N'EST PAS DÉCORATIF — c'est celui de `BASE` dans
 * `tools/final128.py`, et les portes ci-dessous s'appliquent PAR FAMILLE de
 * teinte, pas par rang. Ce qui compte ici, c'est que les quatorze soient
 * toutes présentes : une classification au plus proche sur les six accents
 * SEULS ferait tomber tout le kaki sur un accent.
 */
function rampeDuJoueur() {
  const rampe = [];
  for (const cle of ['contour', 'kakiOmbre', 'kakiCorps', 'kakiEclaire', 'kakiLumiere',
    'metalSombre', 'metalMoyen', 'metalClair']) {
    rampe.push({ rgb: octets(PALETTE[cle]), famille: 'corps', colonne: null });
  }
  for (const [colonne, t] of Object.entries(PALETTE.accents)) {
    const famille = { infanterie: 'blanc', vehicule: 'rouge', structureOuAviation: 'jaune' }[colonne];
    rampe.push({ rgb: octets(t.sombre), famille, colonne });
    rampe.push({ rgb: octets(t.clair), famille, colonne });
  }
  return rampe;
}

/**
 * Les poids et les portes de la quantification, LUS DANS LE FICHIER GÉNÉRÉ.
 *
 * ⚠⚠ ILS NE SE RETAPENT PAS ICI, ET C'EST UNE EXIGENCE D'ETHAN, 02/09. Les
 * nombres vivent dans `tools/portes.py`, `tools/final128.quant` les emploie, et
 * `tools/atlas.py` les écrit dans `art/sprites/atlas-empreintes.json`. Ce
 * fichier-ci ne porte que la FORME des trois conditions. Deux tables de
 * seuils, l'une en Python l'autre en JS, dériveraient au premier réglage — et
 * la dérive serait muette, le test continuant de passer sur son propre barème.
 */
function quantification() {
  const chemin = join(SPRITES, 'atlas-empreintes.json');
  assert.ok(existsSync(chemin),
    'art/sprites/atlas-empreintes.json est absent — relancer « python3 tools/atlas.py --ecrire »');
  const q = JSON.parse(readFileSync(chemin, 'utf8')).quantification;
  assert.equal(q.poids.length, 3, 'les poids de la distance ne sont plus trois');
  for (const porte of ['jaune', 'rouge', 'blanc']) {
    assert.ok(q.portes[porte] !== undefined, `la porte « ${porte} » a disparu du fichier généré`);
  }
  return q;
}

/**
 * La teinte de palette la plus proche d'un pixel, sous les trois portes.
 *
 * ⚠⚠ POURQUOI CE N'EST PLUS UNE ÉGALITÉ EXACTE. Jusqu'au lot PIXELS la chaîne
 * QUANTIFIAIT sur ces quatorze teintes : un pixel d'accent l'était au bit près,
 * et ce test comptait des égalités. Elle réduit maintenant la source par
 * FILTRE, et il ne reste plus une seule teinte exacte — mesuré sur
 * `off_j_pilon_s`, **161 pixels de véhicule la veille, ZÉRO le lendemain**.
 *
 * ⚠ TROIS AUTRES FORMULATIONS ONT ÉTÉ MESURÉES ET ÉCARTÉES, pour qu'on ne les
 * repose pas. Sur les 48 combinaisons hors dettes :
 *   • égalité exacte, tolérance 30 — 42 px reconnus sur 546 la veille ;
 *   • le plus proche parmi les SIX accents seuls, sous tolérance — **40/48 au
 *     mieux**, balayé de 10 à 100 dans les deux métriques ;
 *   • le plus proche parmi les quatorze SANS les portes — **46/48**, le
 *     `busard` bascule sur structure (140 px contre 115), ce qui obligerait à
 *     déclarer une dette que l'art ne mérite pas.
 * Celle-ci rend **48/48**.
 */
function accentDuPixel(r, g, b, rampe, q) {
  const [pr, pg, pb] = q.poids;
  const mx = Math.max(r, g, b, 1);
  const mn = Math.min(r, g, b);
  const J = q.portes.jaune;
  const R = q.portes.rouge;
  const B = q.portes.blanc;
  const ouvertes = {
    corps: true,
    jaune: b / mx < J.bleuSurMax && g / mx > J.vertSurMax,
    rouge: g / mx < R.vertSurMax && b / mx < R.bleuSurMax && r >= R.rougeMin,
    blanc: (mx - mn) / mx < B.ecartSurMax && mx >= B.maxMin,
  };
  let meilleur = null;
  let distance = Infinity;
  for (const t of rampe) {
    if (!ouvertes[t.famille]) continue;
    const d = pr * (r - t.rgb[0]) ** 2 + pg * (g - t.rgb[1]) ** 2 + pb * (b - t.rgb[2]) ** 2;
    if (d < distance) { distance = d; meilleur = t.colonne; }
  }
  return meilleur;
}

/**
 * Compte les pixels d'accent d'une pile de sprites.
 *
 * Chaque pixel opaque est apparié à la teinte la plus PROCHE de la rampe, sous
 * les portes : c'est le même geste que `tools/final128.quant`, avec les mêmes
 * nombres, donc ce que la chaîne aurait vu.
 */
function comptesDAccent(chemins) {
  const rampe = rampeDuJoueur();
  const q = quantification();
  const c = { infanterie: 0, vehicule: 0, structureOuAviation: 0, opaques: 0 };
  for (const chemin of chemins) {
    const { largeur, hauteur, pixels } = decoderRgba(chemin);
    for (let i = 0; i < largeur * hauteur; i += 1) {
      const o = i * 4;
      if (pixels[o + 3] < 128) continue;
      c.opaques += 1;
      const colonne = accentDuPixel(pixels[o], pixels[o + 1], pixels[o + 2], rampe, q);
      if (colonne !== null) c[colonne] += 1;
    }
  }
  return c;
}

/** La colonne la plus représentée, ou `null` si le sprite n'a aucun accent. */
function dominant(c) {
  let d = null;
  for (const colonne of Object.keys(PALETTE.accents)) {
    if (c[colonne] > 0 && (d === null || c[colonne] > c[d])) d = colonne;
  }
  return d;
}

const fichier = (famille, nom) => join(SPRITES, famille, String(GRILLE), `${nom}.png`);

/**
 * Les fichiers RÉELLEMENT dessinés pour une unité, camp et force donnés.
 *
 * Il reproduit `couchesDeLUnite` de `render/scene.js` sur le disque — et c'est
 * volontairement une SECONDE lecture : si les deux divergeaient, ce test
 * mesurerait autre chose que ce que le joueur voit, et il faudrait le savoir.
 * `test/sprite.test.js` asserte par ailleurs que les noms rendus par le module
 * existent bien dans l'atlas ; les deux se recoupent sans se remplacer.
 */
function fichiersAffiches(id, lettre, force, orientation = 's') {
  const pose = (base, famille) => {
    const defensif = `${base}_def`;
    return force === 'garnison' && existsSync(fichier(famille, defensif)) ? defensif : base;
  };
  if (classeDe('unite', id) === 'blinde' && lettre === 'j') {
    return [
      fichier('chassis', pose(`off_j_${id}_chassis`, 'chassis')),
      fichier('tourelle-unite', `off_j_${id}_${orientation}`),
    ];
  }
  return [fichier('unite', pose(`off_${lettre}_${id}`, 'unite'))];
}

/**
 * ⚠⚠ LES QUATRE DETTES D'ART, MESURÉES LE 30/08 SUR `main` À `aca172f`.
 *
 * Elles entrent au dépôt comme EXCEPTIONS NOMMÉES pour que le garde-fou puisse
 * être posé sans rendre `main` rouge — et chacune porte sa raison. Ce lot NE
 * CORRIGE PAS L'ART : recolorier une tourelle est une décision de production,
 * au pinceau ou par remappage de palette dans la chaîne, et elle appartient à
 * Ethan.
 *
 * ⚠⚠ CHAQUE DETTE EST ASSERTÉE ENCORE VIOLÉE, ET C'EST CE QUI REND LA TABLE
 * HONNÊTE. Le jour où l'art est corrigé, le test tombe et quelqu'un retire la
 * ligne. Sans cette moitié-là, une liste d'exceptions pourrit en silence — même
 * mécanique que les deux `ÉCART` permanents de `tools/planches.py`, qui sont
 * voulus ET vérifiés.
 *
 * ⚠ LA CLÉ EST (unité, camp), PAS (unité, camp, force). Le brief du lot en
 * comptait quatre ; mesuré, SIX combinaisons violent, parce que `broyeur` et
 * `pilon` violent dans LES DEUX poses — leur tourelle n'a pas de variante `_def`
 * et les deux coques donnent le même verdict. Quatre sujets, six combinaisons :
 * la table dit les quatre et couvre les six, ce qui est le fait mesuré.
 */
const DETTES_ACCENT = [
  {
    unite: 'broyeur',
    camp: 'j',
    attendu: 'vehicule',
    mesure: 'infanterie',
    raison: 'le composé coque + tourelle n\'a AUCUN pixel de véhicule (161 d\'infanterie) '
      + 'alors que le sprite `unite/off_j_broyeur`, lui, est juste : l\'art détaché '
      + 'contredit l\'art entier. Les deux poses violent.',
  },
  {
    unite: 'pilon',
    camp: 'j',
    attendu: 'structureOuAviation',
    mesure: 'vehicule',
    raison: 'le composé dit véhicule (173 contre 19) quand la table dit structure sans '
      + 'ambiguïté — {infanterie 5, vehicule 10, structureOuAviation 50}. Le sprite '
      + '`unite/off_j_pilon` non affiché est juste. Les deux poses violent.',
  },
];

/**
 * ⚠⚠ DEUX DETTES SE SONT REFERMÉES AU LOT PIXELS, ET L'ART N'A PAS ÉTÉ TOUCHÉ.
 * `ratisseur` et `belier`, camp `o`, étaient déclarés en défaut le 30/08 :
 * « la pose d'attaque n'a AUCUN pixel d'accent à la grille 64 » pour le premier,
 * « dit véhicule quand la table dit structure » pour le second.
 *
 * Mesuré après la bascule : les deux rendent EXACTEMENT ce que la table dit.
 * Ce n'est pas l'art qui était de travers, c'est la QUANTIFICATION qui effaçait
 * son accent — un pixel d'accent isolé perdait son vote de bloc contre le kaki
 * autour, et le sprite ressortait nu. La réduction par filtre le conserve en le
 * mélangeant, et la classification au plus proche le retrouve.
 *
 * Les deux lignes sont donc RETIRÉES, comme la table l'exigeait d'elle-même :
 * « le jour où l'art est corrigé, le test tombe et quelqu'un retire la ligne ».
 * Il restait à vérifier que les deux autres violent encore — elles violent.
 */


const estUneDette = (id, lettre) => DETTES_ACCENT.some((d) => d.unite === id && d.camp === lettre);

/** Toutes les combinaisons (unité, camp, force) dont les fichiers existent. */
function combinaisonsAffichees() {
  const sortie = [];
  for (const id of Object.keys(UNITES)) {
    for (const lettre of ['j', 'o']) {
      for (const force of ['armee', 'garnison']) {
        const chemins = fichiersAffiches(id, lettre, force);
        if (chemins.every(existsSync)) sortie.push({ id, lettre, force, chemins });
      }
    }
  }
  return sortie;
}

test('accent — le décodeur rend les comptes attendus sur un sprite connu', () => {
  // ⚠ D'ABORD : LE DÉCODAGE REND-IL DES PIXELS ? Un décodeur cassé qui rendrait
  // zéro pixel opaque ferait passer TOUTES les assertions de ce fichier, la
  // dominante valant alors `null` partout.
  const c = comptesDAccent([fichier('tourelle-unite', 'off_j_pilon_s')]);
  assert.ok(c.opaques > 500, `${c.opaques} pixels opaques : le décodeur ne lit rien`);
  // ⚠ 179 DEPUIS LE LOT PIXELS, 161 AVANT. Le nombre a bougé parce que la
  // mesure a changé de nature — égalité exacte hier, plus proche sous portes
  // aujourd'hui — et pas parce que l'art a bougé : le verdict, lui, est le même.
  assert.equal(c.vehicule, 179, 'off_j_pilon_s doit porter 179 pixels de véhicule à la grille 64');
  assert.equal(dominant(c), 'vehicule');

  // Et les six teintes viennent bien de `PALETTE`, pas d'une copie : six clés,
  // trois colonnes, et chacune se retrouve dans la table de la fiche.
  const teintes = teintesDAccent();
  assert.equal(teintes.size, 6, 'les trois colonnes doivent donner six teintes distinctes');
  for (const [colonne, t] of Object.entries(PALETTE.accents)) {
    assert.equal(teintes.get(t.sombre.toUpperCase()), colonne);
    assert.equal(teintes.get(t.clair.toUpperCase()), colonne);
  }
});

test('accent — l\'accent dessiné est celui de la table, hors dettes', () => {
  const combinaisons = combinaisonsAffichees();
  assert.ok(combinaisons.length >= 40,
    `${combinaisons.length} combinaisons : le balayage n'a pas trouvé les sprites`);

  const violations = [];
  let mesurees = 0;
  for (const { id, lettre, force, chemins } of combinaisons) {
    if (estUneDette(id, lettre)) continue;
    const attendu = accentDe('unite', id).colonne;
    const rendu = dominant(comptesDAccent(chemins));
    mesurees += 1;
    if (rendu !== attendu) violations.push(`${id} ${lettre} ${force} : ${attendu} attendu, ${rendu} dessiné`);
  }

  // ⚠ SANS CETTE LIGNE, UNE TABLE DE DETTES QUI COUVRIRAIT TOUT PASSERAIT.
  // ⚠ RELEVÉ DE 30 À 45 AU LOT PIXELS, ET LA HAUSSE EST UN RESSERREMENT, PAS UN
  // RÉGLAGE : deux dettes se sont refermées, donc quatre combinaisons de plus
  // sont MESURÉES au lieu d'être exemptées. Mesuré, 52 sur 56.
  assert.ok(mesurees >= 45, `${mesurees} combinaisons hors dettes : les exceptions couvrent trop`);
  assert.deepEqual(violations, [],
    'l\'art et la table de dégâts divergent — corriger l\'art, ou ajouter la dette avec sa raison');
});

test('accent — chaque dette déclarée est ENCORE violée', () => {
  // ⚠⚠ L'ASSERTION INVERSE. Le jour où l'art est corrigé, ce test tombe et
  // quelqu'un retire la ligne. Une liste d'exceptions sans cette moitié-là
  // pourrit en silence.
  assert.equal(DETTES_ACCENT.length, 2, 'la table des dettes a changé de taille');

  for (const dette of DETTES_ACCENT) {
    const attendu = accentDe('unite', dette.unite).colonne;
    assert.equal(attendu, dette.attendu,
      `${dette.unite} : la table de dégâts a changé, la dette est à remesurer`);
    assert.ok(dette.raison.length > 40, `${dette.unite} : une dette sans raison écrite`);

    // La dette vaut pour toutes les poses présentes de ce sujet.
    let posesVues = 0;
    for (const force of ['armee', 'garnison']) {
      const chemins = fichiersAffiches(dette.unite, dette.camp, force);
      if (!chemins.every(existsSync)) continue;
      posesVues += 1;
      const rendu = dominant(comptesDAccent(chemins));
      assert.equal(rendu, dette.mesure,
        `${dette.unite} ${dette.camp} ${force} : la dette n'est plus violée comme déclaré — `
        + 'si l\'art est corrigé, RETIRER la ligne de DETTES_ACCENT');
      assert.notEqual(rendu, attendu,
        `${dette.unite} ${dette.camp} ${force} : l'art est réparé, retirer la dette`);
    }
    assert.ok(posesVues > 0, `${dette.unite} : aucune pose trouvée sur le disque`);
  }
});

test('accent — le verdict d\'un blindé ne dépend pas de l\'orientation de sa tourelle', () => {
  const blindes = Object.keys(UNITES).filter((id) => classeDe('unite', id) === 'blinde');
  assert.ok(blindes.length > 0, 'aucun blindé au roster : le test ne mesure rien');
  assert.equal(ORIENTATIONS.length, 16, 'le compte d\'orientations a changé');

  for (const id of blindes) {
    const verdicts = new Set();
    for (const orientation of ORIENTATIONS) {
      verdicts.add(dominant(comptesDAccent(fichiersAffiches(id, 'j', 'armee', orientation))));
    }
    assert.equal(verdicts.size, 1,
      `${id} : ${verdicts.size} verdicts distincts sur 16 orientations (${[...verdicts].join(', ')})`);
  }

  // ⚠ FALSIFIABLE : le montage sait DISTINGUER deux verdicts. Sans cet appât,
  // une fonction `dominant` qui rendrait toujours la même chose ferait passer la
  // boucle ci-dessus sur n'importe quel art.
  assert.notEqual(
    dominant(comptesDAccent(fichiersAffiches('pilon', 'j', 'armee'))),
    dominant(comptesDAccent(fichiersAffiches('broyeur', 'j', 'armee'))),
    'le montage ne distingue pas deux verdicts différents',
  );
});
