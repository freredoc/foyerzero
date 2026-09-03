// LA CARTE PASSE EN DISTANCE EUCLIDIENNE — lot EUCLIDE, 02/09/2026.
//
// Trois distances de PORTÉE basculent ensemble : celle du raid, la garde du
// peuplement, les anneaux des satellites. Ce fichier tient les propriétés du
// lot ; les baselines que le changement de carte a fait bouger sont remesurées
// dans leurs fichiers d'origine, chacune avec sa raison écrite sur place.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  distanceCarreeCases, distanceTchebychev, estAPorteeDAttaque,
  casesArrondiesAuSuperieur, RAYON_ATTAQUE_CARRE, dansLOctogoneDInfluence,
  estEnTerritoireAllie,
} from '../src/sim/points-attaque.js';
import {
  horsDeLaGarde, hachageDeCase, estBaseOuvrage, VOISINES_EXCLUES,
} from '../src/sim/peuplement.js';
import { casesDeLAnneau } from '../src/sim/satellites.js';
import { distanceCarree } from '../src/sim/grille.js';
import { positionDepartJoueur, estSurLaCarte } from '../src/sim/carte.js';
import {
  creerEtat, serialiser, migrer, SAVE_VERSION,
} from '../src/sim/state.js';
import { GEOGRAPHIE, PEUPLEMENT } from '../src/data/sites.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { aplatirSauvegarde } from './aplatir-sauvegarde.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES_EUCLIDE = [
  'src/sim/points-attaque.js', 'src/sim/peuplement.js', 'src/sim/satellites.js',
];

/** La source d'un fichier, commentaires ôtés — une garde ne lit pas sa propre prose. */
function decommentee(chemin) {
  return readFileSync(join(RACINE, chemin), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
}

// ---------------------------------------------------------------------------
// T1 — la portée compte 316 cases, pas 440
// ---------------------------------------------------------------------------

test('EUCLIDE T1 — à rayon 10, 316 cases sont à portée, pas 440', () => {
  const R = GEOGRAPHIE.rayonAttaque;
  assert.equal(R, 10, 'le rayon d\'attaque a bougé : relire ce test');
  assert.equal(RAYON_ATTAQUE_CARRE, 100);

  const centre = { rangee: 0, colonne: 0 };
  let euclide = 0;
  let tchebychev = 0;
  for (let dr = -R; dr <= R; dr += 1) {
    for (let dc = -R; dc <= R; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      if (estAPorteeDAttaque(centre, { rangee: dr, colonne: dc })) euclide += 1;
      if (Math.max(Math.abs(dr), Math.abs(dc)) <= R) tchebychev += 1;
    }
  }
  assert.equal(euclide, 316);
  // ⚠ ET L'ANCIEN COMPTE EST GARDÉ À CÔTÉ, pour que la falsification se voie.
  // Rendre `estAPorteeDAttaque` à Tchebychev ferait remonter le premier à 440.
  assert.equal(tchebychev, 440);
  assert.equal(euclide < tchebychev, true);
  assert.equal(tchebychev - euclide, 124, 'les coins du carré : 124 cases perdues');
});

// ---------------------------------------------------------------------------
// T2 — la diagonale coûte ce qu'elle vaut
// ---------------------------------------------------------------------------

test('EUCLIDE T2 — dix rangées ET dix colonnes est HORS de portée, dix rangées seules non', () => {
  const o = { rangee: 0, colonne: 0 };
  assert.equal(estAPorteeDAttaque(o, { rangee: 10, colonne: 10 }), false,
    'la diagonale à 10/10 fait 14,1 cases : elle doit être refusée');
  assert.equal(estAPorteeDAttaque(o, { rangee: 10, colonne: 0 }), true);
  assert.equal(estAPorteeDAttaque(o, { rangee: 0, colonne: 10 }), true);
  // La borne se lit des deux côtés : (6, 8) fait exactement 10, (7, 8) fait 10,6.
  assert.equal(estAPorteeDAttaque(o, { rangee: 6, colonne: 8 }), true, '6² + 8² = 100');
  assert.equal(estAPorteeDAttaque(o, { rangee: 7, colonne: 8 }), false, '7² + 8² = 113');
  // ⚠ LA BORNE EST INCLUSE, et c'est ce que dit `d² ≤ rayon²`.
  assert.equal(distanceCarreeCases(o, { rangee: 6, colonne: 8 }), RAYON_ATTAQUE_CARRE);
});

// ---------------------------------------------------------------------------
// T3 — aucune racine carrée dans les trois sites
// ---------------------------------------------------------------------------

test('EUCLIDE T3 — aucune racine carrée dans les trois modules qui ont basculé', () => {
  for (const chemin of SOURCES_EUCLIDE) {
    const source = decommentee(chemin);
    assert.doesNotMatch(source, /Math\.sqrt/, `${chemin} prend une racine carrée`);
    assert.doesNotMatch(source, /\*\*\s*0\.5/, `${chemin} prend une racine déguisée`);
  }
  // Falsifiable : les deux motifs doivent attraper un appât.
  assert.match('const d = Math.sqrt(x);', /Math\.sqrt/);
  assert.match('const d = x ** 0.5;', /\*\*\s*0\.5/);

  // ⚠ ET L'EXCEPTION SE NOMME : `casesArrondiesAuSuperieur` calcule bien une
  // racine, mais en ENTIERS et pour une phrase — jamais pour une décision. Le
  // test ci-dessus le laisse passer parce qu'il ne fait aucun appel flottant.
  assert.equal(casesArrondiesAuSuperieur(100), 10);
  assert.equal(casesArrondiesAuSuperieur(101), 11);
  assert.equal(casesArrondiesAuSuperieur(99), 10);
  assert.equal(casesArrondiesAuSuperieur(0), 0);
  assert.throws(() => casesArrondiesAuSuperieur(-1), /entier ≥ 0/);
  assert.throws(() => casesArrondiesAuSuperieur(1.5), /entier ≥ 0/);
});

// ---------------------------------------------------------------------------
// T4 — ce que la garde libère
// ---------------------------------------------------------------------------

test('EUCLIDE T4 — la garde interdit 697 cases, et une base peut se poser à 11 en diagonale', () => {
  const depart = positionDepartJoueur();
  const garde = PEUPLEMENT.gardeAutourDuDepart;
  assert.equal(garde, 15, 'la garde a bougé : relire ce test');

  let interdites = 0;
  let interditesTchebychev = 0;
  for (let dr = -garde; dr <= garde; dr += 1) {
    for (let dc = -garde; dc <= garde; dc += 1) {
      if (!horsDeLaGarde(depart.rangee + dr, depart.colonne + dc)) interdites += 1;
      if (Math.max(Math.abs(dr), Math.abs(dc)) < garde) interditesTchebychev += 1;
    }
  }
  assert.equal(interdites, 697);
  // ⚠ L'ANCIEN COMPTE À CÔTÉ, pour que la falsification se voie : 29 × 29 = 841.
  assert.equal(interditesTchebychev, 841);
  assert.equal(interditesTchebychev - interdites, 144, '144 cases libérées, en diagonale');

  // ⚠ ET LA CONSÉQUENCE DE JEU, MESURÉE : une base peut désormais se tenir à
  // onze cases de grille du départ, là où il en fallait quinze.
  assert.ok(horsDeLaGarde(depart.rangee - 11, depart.colonne - 11), '(11, 11) doit être dehors');
  assert.equal(horsDeLaGarde(depart.rangee - 10, depart.colonne - 10), false,
    '(10, 10) doit rester dedans');
  // En ligne droite, en revanche, rien n'a changé.
  assert.ok(horsDeLaGarde(depart.rangee - garde, depart.colonne));
  assert.equal(horsDeLaGarde(depart.rangee - garde + 1, depart.colonne), false);
});

// ---------------------------------------------------------------------------
// T5 — la densité
// ---------------------------------------------------------------------------

test('EUCLIDE T5 — la densité tombe dans 25 ± 1 sur 120 graines', () => {
  // ⚠⚠ LA CIBLE A BOUGÉ DEUX FOIS LE MÊME JOUR, ET LA SECONDE FOIS EST LA
  // BONNE. 16 → 28 le matin, en desserrant l'exclusion aux quatre voisines
  // orthogonales ; 28 → 25 le soir, en la REMETTANT aux huit et en reposant des
  // bases tour après tour. Ethan : « je suis sûr à 100 % qu'on n'est pas obligé
  // de mettre des bases en diagonale. » C'est T5 bis qui mesure pourquoi les
  // deux chemins mènent à peu près au même endroit.
  assert.equal(PEUPLEMENT.basesParDouzeCarre, 25);
  assert.equal(PEUPLEMENT.probabiliteCandidate, 0.7);
  assert.equal(PEUPLEMENT.toleranceMesure, 1);
  assert.equal(PEUPLEMENT.toursDePeuplement, 4);
  // ⚠ LE LEVIER DU MATIN N'EXISTE PLUS, ET SON ABSENCE EST LE MESSAGE.
  assert.ok(!Object.prototype.hasOwnProperty.call(PEUPLEMENT, 'contactDiagonalPermis'),
    'contactDiagonalPermis est revenu : le voisinage peut se desserrer en silence');

  // ⚠ LA MESURE SE FAIT HORS DE LA GARDE. Une fenêtre prise dans le rayon de
  // quinze cases autour du départ porte zéro base par construction ; la compter
  // ferait tomber la moyenne et donnerait l'impression d'un réglage faux.
  const densites = [];
  for (let graine = 1; graine <= 120; graine += 1) {
    let total = 0;
    let fenetres = 0;
    for (let r = 100; r <= 244; r += 12) {
      for (let c = 1; c + 11 <= GEOGRAPHIE.carte.largeur; c += 12) {
        let k = 0;
        for (let dr = 0; dr < 12; dr += 1) {
          for (let dc = 0; dc < 12; dc += 1) {
            if (estBaseOuvrage(graine, r + dr, c + dc)) k += 1;
          }
        }
        total += k;
        fenetres += 1;
      }
    }
    densites.push(total / fenetres);
  }
  const moyenne = densites.reduce((a, b) => a + b, 0) / densites.length;
  assert.ok(
    Math.abs(moyenne - PEUPLEMENT.basesParDouzeCarre) <= PEUPLEMENT.toleranceMesure,
    `densité ${moyenne.toFixed(2)} hors de ${PEUPLEMENT.basesParDouzeCarre} `
    + `± ${PEUPLEMENT.toleranceMesure}`,
  );
  // ⚠⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : sous une SEULE passe, la densité ne
  // peut pas dépasser 16,2 quelle que soit la probabilité — c'est T5 bis qui le
  // prouve, et c'était la carte du dépôt jusqu'au 03/09. Un seuil à 20 est donc
  // hors d'atteinte de tout réglage à une passe : sans cette ligne, un retour à
  // l'ancienne sélection passerait sous une tolérance élargie.
  assert.ok(moyenne > 20,
    `densité ${moyenne.toFixed(2)} : les tours de peuplement n'ont pas eu lieu`);
});

// ---------------------------------------------------------------------------
// Le peuplement réimplémenté SUR LA CARTE ENTIÈRE, en passes successives.
//
// ⚠⚠ C'EST LA SEULE CHOSE QUI PUISSE DIRE QUE LA RÉCURSION LOCALE EST JUSTE.
// `sim/peuplement.js` ne parcourt jamais la carte : il répond case par case, en
// remontant les tours d'un rayon de quatre cases. Une passe globale, elle, est
// évidente à lire — on prend, on interdit les voisines, on recommence. Les deux
// doivent rendre le même dessin ; c'est T5 ter qui les confronte, et T5 bis qui
// s'en sert pour mesurer les plafonds.
// ---------------------------------------------------------------------------
const { largeur: LARGEUR_CARTE, hauteur: HAUTEUR_CARTE } = GEOGRAPHIE.carte;
const HUIT = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

/**
 * La carte, en passes successives sur la grille entière.
 *
 * @param {number} graine
 * @param {number} p probabilité qu'une case soit candidate
 * @param {number} tours nombre de passes
 * @param {Array<Array<number>>} voisinage
 * @returns {Set<string>} clés « rangée:colonne » des bases
 */
function carteParPasses(graine, p, tours, voisinage = HUIT) {
  const cle = (r, c) => `${r}:${c}`;
  const candidate = new Set();
  for (let r = 1; r <= HAUTEUR_CARTE; r += 1) {
    for (let c = 1; c <= LARGEUR_CARTE; c += 1) {
      if (!horsDeLaGarde(r, c)) continue;
      if (hachageDeCase(graine, r, c, 0) < p) candidate.add(cle(r, c));
    }
  }
  const bases = new Set();
  const interdit = new Set();
  for (let tour = 0; tour < tours; tour += 1) {
    const pris = [];
    for (const k of candidate) {
      if (bases.has(k) || interdit.has(k)) continue;
      const [r, c] = k.split(':').map(Number);
      const mien = hachageDeCase(graine, r, c, 1);
      let gagne = true;
      for (const [dr, dc] of voisinage) {
        const v = cle(r + dr, c + dc);
        if (!candidate.has(v) || bases.has(v) || interdit.has(v)) continue;
        if (hachageDeCase(graine, r + dr, c + dc, 1) >= mien) { gagne = false; break; }
      }
      if (gagne) pris.push([r, c]);
    }
    if (pris.length === 0) break;
    for (const [r, c] of pris) {
      bases.add(cle(r, c));
      for (const [dr, dc] of voisinage) interdit.add(cle(r + dr, c + dc));
    }
  }
  return bases;
}

/** La densité par 12 × 12 d'une carte rendue en clés, hors de la garde. */
function densiteDe(bases) {
  let total = 0;
  let fenetres = 0;
  for (let r = 100; r <= 244; r += 12) {
    for (let c = 1; c + 11 <= LARGEUR_CARTE; c += 12) {
      for (let dr = 0; dr < 12; dr += 1) {
        for (let dc = 0; dc < 12; dc += 1) if (bases.has(`${r + dr}:${c + dc}`)) total += 1;
      }
      fenetres += 1;
    }
  }
  return total / fenetres;
}

test('EUCLIDE T5 bis — le plafond de 16 appartenait à la PASSE, pas à la RÈGLE', () => {
  // ⚠⚠ CE TEST A DIT LE CONTRAIRE PENDANT UNE JOURNÉE, ET C'EST POUR ÇA QU'IL
  // EXISTE SOUS CETTE FORME. Il affirmait que « le voisinage fixe le plafond » et
  // que la densité valait `144 / (1 + n)` — vrai d'une SÉLECTION EN UNE PASSE,
  // faux de la règle. Ethan : « je suis sûr à 100 % qu'on n'est pas obligé de
  // mettre des bases en diagonale. » Les trois mesures ci-dessous sont la
  // réponse, et elles sont faites avec la MÊME exclusion des huit voisines.

  // ⚠ LA LISTE DU MODULE EST CONFRONTÉE, pas supposée : c'est elle qui porte la
  // règle de non-contact, et une diagonale qui en sortirait rendrait la carte
  // dense pour une raison qu'Ethan a refusée.
  assert.deepEqual(VOISINES_EXCLUES, HUIT);
  assert.equal(VOISINES_EXCLUES.length, 8);
  assert.ok(!VOISINES_EXCLUES.some(([dr, dc]) => dr === 0 && dc === 0),
    '(0, 0) est dans le voisinage : aucune case ne pourrait jamais être une base');

  // (1) UNE PASSE SATURE À 144/9, quelle que soit la probabilité. C'est le fait
  //     historique — « ignore le 24 », Ethan, 02/09 — et il tient toujours.
  const unePasse = densiteDe(carteParPasses(1, 1, 1));
  assert.ok(Math.abs(unePasse - 144 / 9) < 0.5,
    `une passe à p = 1 : ${unePasse.toFixed(2)}, attendu ${(144 / 9).toFixed(2)}`);
  assert.ok(unePasse < 24 - PEUPLEMENT.toleranceMesure,
    `24 ± 1 aurait été atteignable en une passe : ${unePasse.toFixed(2)}`);

  // (2) LES TOURS FRANCHISSENT CE PLAFOND SANS TOUCHER AU VOISINAGE. C'est la
  //     phrase d'Ethan, mesurée.
  const enTours = densiteDe(carteParPasses(1, 1, PEUPLEMENT.toursDePeuplement));
  assert.ok(enTours > unePasse * 1.5,
    `les tours ne remplissent pas : ${enTours.toFixed(2)} contre ${unePasse.toFixed(2)}`);

  // (3) ET IL RESTE DE LA MARGE SOUS L'EMPILEMENT MAXIMAL. Le damier au pas de
  //     deux est LÉGAL sous l'exclusion des huit — on le construit, on vérifie
  //     qu'aucune paire ne se touche, et il fait 36 par 12 × 12. C'est ce qui
  //     prouve que la règle, elle, n'a jamais plafonné à 16.
  const damier = new Set();
  for (let r = 2; r <= HAUTEUR_CARTE; r += 2) {
    for (let c = 2; c <= LARGEUR_CARTE; c += 2) damier.add(`${r}:${c}`);
  }
  for (const k of damier) {
    const [r, c] = k.split(':').map(Number);
    for (const [dr, dc] of HUIT) {
      assert.ok(!damier.has(`${r + dr}:${c + dc}`), 'le damier au pas de deux se touche');
    }
  }
  assert.equal(densiteDe(damier), 36);
  assert.ok(enTours < 36, 'la carte a atteint l\'empilement maximal : plus aucun trou');

  // Et la cible retenue tient entre les deux, comme Ethan l'a choisie : au-dessus
  // de ce qu'une passe peut rendre, sous ce que la saturation rendrait.
  assert.ok(PEUPLEMENT.basesParDouzeCarre > unePasse,
    'la cible tient en une passe : les tours ne servent à rien');
  assert.ok(PEUPLEMENT.basesParDouzeCarre <= enTours,
    'la cible dépasse la saturation : elle ne sera jamais atteinte');
});

test('EUCLIDE T5 ter — la règle LOCALE rend exactement la passe GLOBALE', () => {
  // ⚠⚠ C'EST LA GARDE QUI COMPTE LE PLUS DE TOUT LE LOT. `estBaseOuvrage` ne
  // parcourt jamais la carte : il remonte les tours d'un rayon de quatre cases,
  // par récursion mémoïsée. Rien, à la relecture, ne dit qu'il n'a pas oublié un
  // tour ou compté une voisine deux fois — sauf la comparaison, case par case,
  // avec l'itération évidente sur la carte entière.
  const p = PEUPLEMENT.probabiliteCandidate;
  const tours = PEUPLEMENT.toursDePeuplement;
  let cases = 0;
  for (const graine of [1, 7, 42]) {
    const globale = carteParPasses(graine, p, tours);
    // Falsifiable : une carte vide s'accorderait avec une carte vide.
    assert.ok(globale.size > 1200,
      `graine ${graine} : ${globale.size} bases, la passe globale ne mesure rien`);
    for (let r = 1; r <= HAUTEUR_CARTE; r += 1) {
      for (let c = 1; c <= LARGEUR_CARTE; c += 1) {
        cases += 1;
        assert.equal(estBaseOuvrage(graine, r, c), globale.has(`${r}:${c}`),
          `désaccord en (${r}, ${c}), graine ${graine}`);
      }
    }
  }
  assert.equal(cases, 3 * HAUTEUR_CARTE * LARGEUR_CARTE);
});

test('EUCLIDE T5 quater — quatre tours, c\'est le point fixe', () => {
  // ⚠ `toursDePeuplement` EST UN PLAFOND DE TRAVAIL, PAS UN RÉGLAGE. Au-delà de
  // quatre il ne reste presque plus de case libre à prendre : la densité ne bouge
  // plus. Le descendre, en revanche, viderait la carte — d'où les deux bornes.
  const p = PEUPLEMENT.probabiliteCandidate;
  const t = PEUPLEMENT.toursDePeuplement;
  const auPoint = densiteDe(carteParPasses(1, p, t));
  const bienAuDela = densiteDe(carteParPasses(1, p, t + 6));
  assert.ok(Math.abs(auPoint - bienAuDela) < 0.05,
    `${t} tours rendent ${auPoint.toFixed(3)}, ${t + 6} en rendent ${bienAuDela.toFixed(3)} : `
    + 'le point fixe n\'est pas atteint');
  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : un tour de moins se voit.
  const unDeMoins = densiteDe(carteParPasses(1, p, t - 1));
  assert.ok(auPoint - unDeMoins > 0.05,
    `${t - 1} tours rendent déjà ${unDeMoins.toFixed(3)} : le dernier tour ne sert à rien`);
});

// ---------------------------------------------------------------------------
// T6 — la validation d'entrée survit
// ---------------------------------------------------------------------------

test('EUCLIDE T6 bis — la zone d\'influence LÈVE aussi sur une case non entière', () => {
  // ⚠⚠ CETTE ASSERTION EXISTAIT SANS ÊTRE ÉCRITE, ET LE LOT DU 03/09 A FAILLI LA
  // PERDRE. `estEnTerritoireAllie` passait par `distanceCarreeCases`, qui lève
  // sur une case non entière ; en la faisant passer par `dansLOctogoneDInfluence`
  // — deux `Math.abs` et deux comparaisons —, une case mal formée aurait rendu
  // `NaN`, donc `false`, donc « hors du territoire » EN SILENCE : le raid aurait
  // coûté le tarif lointain sans que rien ne le dise. La garde a suivi la
  // fonction ; ce test-ci est ce qui l'y tient.
  //
  // ⚠ FALSIFIÉ : retirer les deux lignes de garde de `dansLOctogoneDInfluence`
  // ne faisait tomber AUCUN test avant celui-ci.
  const bases = [{ position: { rangee: 100, colonne: 16 } }];
  assert.equal(estEnTerritoireAllie({ rangee: 100, colonne: 16 }, bases), true);
  for (const cible of [
    { rangee: 100.5, colonne: 16 },
    { rangee: 100, colonne: 16.5 },
  ]) {
    assert.throws(() => estEnTerritoireAllie(cible, bases), /entiers attendus/);
  }
  assert.throws(() => dansLOctogoneDInfluence(1.5, 0, 2), /entiers attendus/);
  assert.throws(() => dansLOctogoneDInfluence(0, Number.NaN, 2), /entiers attendus/);
});

test('EUCLIDE T6 — distanceCarreeCases lève sur une case non entière, en nommant le point', () => {
  const bon = { rangee: 3, colonne: 4 };
  assert.equal(distanceCarreeCases(bon, { rangee: 0, colonne: 0 }), 25);

  assert.throws(() => distanceCarreeCases({ rangee: 1.5, colonne: 2 }, bon),
    /distanceCarreeCases : a n'est pas une case entière/);
  assert.throws(() => distanceCarreeCases(bon, { rangee: 1, colonne: 2.5 }),
    /distanceCarreeCases : b n'est pas une case entière/);
  assert.throws(() => distanceCarreeCases(null, bon), /a n'est pas une case entière/);
  assert.throws(() => distanceCarreeCases(bon, undefined), /b n'est pas une case entière/);
  assert.throws(() => distanceCarreeCases(bon, { rangee: 1 }), /b n'est pas une case entière/);

  // ⚠ LE NOM DU POINT FAUTIF EST LA MOITIÉ QUI SERT. Un message qui dirait
  // seulement « case non entière » laisserait chercher lequel des deux.
  assert.throws(() => distanceCarreeCases({ rangee: 1.5, colonne: 2 }, bon), (e) => {
    assert.match(e.message, /\ba\b/);
    assert.doesNotMatch(e.message, /\bb\b/);
    return true;
  });
});

// ---------------------------------------------------------------------------
// T7 — les deux échelles ne se mélangent pas
// ---------------------------------------------------------------------------

test('EUCLIDE T7 — la distance de la CARTE et celle du COMBAT restent séparées', () => {
  // ⚠⚠ DEUX FONCTIONS AUX NOMS PRESQUE IDENTIQUES, ET UN FACTEUR UN MILLION
  // ENTRE ELLES. `distanceCarree` de `sim/grille.js` travaille en MILLI-CASES :
  // deux cases voisines y sont à 1 000 000. Les confondre donnerait un résultat
  // faux sans que rien ne lève.
  // ⚠ ET LES SIGNATURES NE SE RESSEMBLENT MÊME PAS : celle du combat prend
  // QUATRE scalaires, celle de la carte DEUX cases. C'est une protection de
  // plus, et elle se mesure — passer deux objets à celle du combat rend `NaN`.
  const voisines = distanceCarree(0, 1, 0, 2);
  assert.equal(voisines, 1_000_000, 'deux cases voisines valent un million de milli-cases');
  const surLaCarte = distanceCarreeCases({ rangee: 0, colonne: 1 }, { rangee: 0, colonne: 2 });
  assert.equal(surLaCarte, 1);
  assert.equal(voisines / surLaCarte, 1_000_000);
  assert.ok(Number.isNaN(distanceCarree(
    { rangee: 0, colonne: 1 }, { rangee: 0, colonne: 2 },
  )), 'la distance du combat doit refuser des cases');

  // ⚠ ET AUCUN DES TROIS MODULES QUI ONT BASCULÉ N'IMPORTE LA DISTANCE DU
  // COMBAT. La garde porte sur l'import, pas sur l'usage : c'est l'import qui
  // rendrait la confusion possible.
  for (const chemin of SOURCES_EUCLIDE) {
    const source = decommentee(chemin);
    assert.doesNotMatch(source, /distanceCarree(?![A-Za-z])/,
      `${chemin} emploie la distance du COMBAT`);
  }
  // Falsifiable : le motif doit attraper l'appât, et laisser passer le nom long.
  assert.match('import { distanceCarree } from "./grille.js";', /distanceCarree(?![A-Za-z])/);
  assert.doesNotMatch('distanceCarreeCases(a, b)', /distanceCarree(?![A-Za-z])/);
});

// ---------------------------------------------------------------------------
// T8 — la migration 20 → 21 vide plutôt que de faire semblant
// ---------------------------------------------------------------------------

test('EUCLIDE T8 — la migration 20 → 21 vide les dégâts de site et les POI acquis', () => {
  // ⚠ LE NUMÉRO N'EST PLUS GARDÉ ICI, ET C'EST LA RÈGLE DU DÉPÔT, PAS UN
  // ASSOUPLISSEMENT. `points-attaque.test.js` l'écrit depuis le lot
  // SITE-ENTAMÉ : « la garde du numéro appartient au maillon le plus RÉCENT
  // de la chaîne, une seule fois ». Ce test-ci avait gardé le sien, et le lot
  // BASES-0 l'aurait rendu rouge pour une raison qui ne le regarde pas. Ce
  // qu'il vérifie vraiment, c'est que SON maillon est encore là.
  assert.ok(SAVE_VERSION >= 21, 'le maillon v20 → 21 n\'est plus dans la chaîne');

  const v20 = JSON.parse(serialiser(creerEtat(2026), 0));
  // ⚠ APLATIE AVANT D'ÊTRE RABAISSÉE — lot BASES-0. Une v20 n'a jamais
  // porté `bases` : lui en donner un ferait tourner la chaîne de migrations
  // sur une forme qui n'a jamais existé.
  aplatirSauvegarde(v20);
  v20.version = 20;
  // Une v20 qui porte VRAIMENT quelque chose — sans quoi « vidé » ne se
  // distinguerait pas de « déjà vide ».
  v20.sitesEntames = { '150:12': { pvBatimentsMilli: [0, null], pvDefensesMilli: [1000] } };
  v20.poisAcquis = [{ type: 'poiQuartz', bande: 3 }, { type: 'poiScorie', bande: 1 }];
  assert.ok(Object.keys(v20.sitesEntames).length > 0, 'le montage ne mesure rien');
  assert.ok(v20.poisAcquis.length > 0, 'le montage ne mesure rien');

  const migre = migrer(structuredClone(v20));
  assert.equal(migre.version, SAVE_VERSION);
  assert.deepEqual(migre.sitesEntames, {}, 'les dégâts de site ont été recopiés');
  assert.deepEqual(migre.poisAcquis, [], 'les POI acquis ont été recopiés');

  // ⚠ ET DEUX CHAMPS NE SONT PAS VIDÉS, DÉLIBÉRÉMENT. `basesRasees` ne porte pas
  // un état de site mais le fait qu'une case ne doit PLUS rien rendre : le vider
  // ferait REPARAÎTRE une base que le joueur a rasée. `satellites` porte de
  // l'histoire : un camp posé est là où le joueur l'a vu.
  const avecHistoire = structuredClone(v20);
  avecHistoire.basesRasees = ['150:12'];
  const apres = migrer(avecHistoire);
  assert.deepEqual(apres.basesRasees, ['150:12'], 'une base rasée est réapparue');
  assert.deepEqual(baseCourante(apres).satellites, v20.satellites, 'les satellites posés ont bougé');
});

// ---------------------------------------------------------------------------
// T9 — les anneaux de satellites
// ---------------------------------------------------------------------------

test('EUCLIDE T9 — les anneaux de satellites sont euclidiens', () => {
  const centre = { rangee: 150, colonne: 16 };
  for (const [min, max] of [[1, 2], [2, 5], [3, 7]]) {
    const cases = casesDeLAnneau(centre, min, max);
    for (const k of cases) {
      const d2 = distanceCarreeCases(centre, k);
      assert.ok(d2 >= min * min && d2 <= max * max,
        `anneau ${min}–${max} : (${k.rangee}, ${k.colonne}) a d² = ${d2}`);
    }
    // ⚠ ET IL FAUT AUSSI QUE LE DISQUE SOIT PLEIN, sans quoi un anneau vide
    // passerait la boucle ci-dessus. On recompte la règle plutôt que de figer
    // un nombre.
    let attendu = 0;
    for (let dr = -max; dr <= max; dr += 1) {
      for (let dc = -max; dc <= max; dc += 1) {
        const d2 = dr * dr + dc * dc;
        if (d2 >= min * min && d2 <= max * max) attendu += 1;
      }
    }
    assert.equal(cases.length, attendu, `anneau ${min}–${max} : compte`);
    // ⚠ ET LE COIN DU CARRÉ EN EST SORTI — c'est ce qui distingue les deux
    // métriques, et un anneau resté carré le contiendrait.
    assert.equal(
      cases.some((k) => Math.abs(k.rangee - centre.rangee) === max
        && Math.abs(k.colonne - centre.colonne) === max),
      false,
      `anneau ${min}–${max} : le coin (${max}, ${max}) est encore dedans`,
    );
  }
});

// ---------------------------------------------------------------------------
// La cohérence — un seul endroit décide de la portée
// ---------------------------------------------------------------------------

test('EUCLIDE — une seule fonction décide de la portée, et tous les lecteurs y passent', () => {
  // ⚠ TROIS LECTEURS POSAIENT LA QUESTION CHACUN À SA FAÇON avant ce lot : le
  // balayage de `ciblesAPortee`, le refus de `problemesDuRaid`, le panneau de
  // l'écran Monde. Trois écritures d'une même règle divergent sur un cas limite,
  // et l'écran proposerait alors une cible que le refus rejette.
  for (const chemin of ['src/sim/site-de-la-case.js', 'src/sim/raid.js']) {
    const source = decommentee(chemin);
    assert.match(source, /estAPorteeDAttaque\(/, `${chemin} n'interroge pas la portée`);
    assert.doesNotMatch(source, /rayonAttaque\s*\)?\s*[<>]/,
      `${chemin} compare une distance au rayon à la main`);
  }
});

test('EUCLIDE — les zones d\'influence sont un OCTOGONE, et une seule écriture le dit', () => {
  // ⚠⚠ CETTE LECTURE A ÉTÉ RETOURNÉE DEUX FOIS, ET LE TEST A NOMMÉ CHAQUE FOIS
  // SA PROPRE CONDITION DE RETOURNEMENT. Version d'EUCLIDE : « les zones
  // d'influence restent en Tchebychev […] si Ethan veut les zones en disque, ce
  // sont `estEnTerritoireAllie` ET la boucle de `territoire.js` qui changent,
  // ensemble. » BASES-1 les a passées au disque, ensemble. Ethan, le 03/09 :
  // « le territoire doit avoir 8 cases de plus, dans les angles » — l'octogone.
  //
  // ⚠ IL EST PLUS STRICT À CHAQUE FOIS, JAMAIS PLUS LÂCHE. Il vérifiait qu'UN
  // fichier portait Tchebychev ; puis que les DEUX portaient le disque ; il exige
  // maintenant qu'aucun des deux N'ÉCRIVE la forme — les deux doivent APPELER la
  // même fonction. Une forme écrite deux fois est la divergence que CLAUDE.md
  // nomme depuis EUCLIDE, et deux appels ne peuvent plus diverger.
  const barème = decommentee('src/sim/points-attaque.js');
  const carte = decommentee('src/sim/territoire.js');
  assert.match(barème, /dansLOctogoneDInfluence\(/,
    'le barème ne demande pas la zone à la fonction commune');
  assert.match(carte, /dansLOctogoneDInfluence\(dr, dc, rayon\)/,
    'la boucle de peinture ne demande pas la zone à la fonction commune');
  // ⚠ ET AUCUN DES DEUX NE REFAIT LE CALCUL DANS SON COIN. C'est l'assertion qui
  // porte le « une seule écriture » : les deux formes précédentes — la comparaison
  // au disque et celle de Tchebychev — sont interdites de retour.
  assert.doesNotMatch(carte, /dr \* dr \+ dc \* dc/,
    'la boucle de peinture refait le calcul de zone à la main');
  assert.doesNotMatch(barème, /distanceCarreeCases\(base\.position, cible\)/,
    'le barème refait le calcul de zone à la main');
  assert.doesNotMatch(barème, /distanceTchebychev\(base\.position, cible\)/,
    'le territoire allié se mesure encore en Tchebychev dans le barème');

  // ⚠⚠ LES DEUX FIGURES SE COMPTENT, ELLES NE SE LISENT PAS. Ethan a dicté un
  // 5 × 5 dont chaque coin perd UNE case et un 7 × 7 dont chaque coin en perd
  // TROIS ; on recompte les deux depuis la fonction elle-même.
  for (const [rayon, attendu, parCoin] of [[2, 21, 1], [3, 37, 3]]) {
    let dedans = 0;
    const coins = [];
    for (let dr = -rayon; dr <= rayon; dr += 1) {
      for (let dc = -rayon; dc <= rayon; dc += 1) {
        if (dansLOctogoneDInfluence(dr, dc, rayon)) dedans += 1;
        else coins.push([dr, dc]);
      }
    }
    assert.equal(dedans, attendu, `rayon ${rayon} : ${dedans} cases au lieu de ${attendu}`);
    assert.equal(coins.length, parCoin * 4, `rayon ${rayon} : ${coins.length} cases retirées`);
    // ⚠ ET CE SONT BIEN LES ANGLES, PAS UN ANNEAU. Toute case retirée est à la
    // fois au bord en rangée ET loin en colonne — sinon la figure serait un
    // losange, qui a le même compte au rayon 2 et pas au rayon 3.
    for (const [dr, dc] of coins) {
      assert.ok(Math.abs(dr) + Math.abs(dc) > rayon + 1,
        `rayon ${rayon} : (${dr}, ${dc}) retirée sans être dans un angle`);
    }
  }

  // ⚠⚠ CE SONT HUIT CASES DE PLUS QUE LE DISQUE, DES DEUX CÔTÉS — le « 8 cases
  // de plus » du message d'Ethan, recompté et non recopié.
  for (const rayon of [GEOGRAPHIE.rayonInfluenceJoueur, GEOGRAPHIE.rayonInfluenceEnnemie]) {
    let disque = 0;
    let octogone = 0;
    for (let dr = -rayon; dr <= rayon; dr += 1) {
      for (let dc = -rayon; dc <= rayon; dc += 1) {
        if (dr * dr + dc * dc <= rayon * rayon) disque += 1;
        if (dansLOctogoneDInfluence(dr, dc, rayon)) octogone += 1;
      }
    }
    assert.equal(octogone - disque, 8, `rayon ${rayon} : ${octogone - disque} cases gagnées`);
  }

  // La diagonale à 2 était DEDANS en Tchebychev, DEHORS sous le disque de
  // BASES-1, et elle est DEHORS sous l'octogone : c'est précisément le coin
  // qu'Ethan fait rogner. Celle à (2, 1), elle, revient DEDANS.
  assert.equal(dansLOctogoneDInfluence(2, 2, 2), false, 'le coin (2, 2) n\'est pas rogné');
  assert.equal(dansLOctogoneDInfluence(2, 1, 2), true, 'la case (2, 1) manque à l\'octogone');
  assert.equal(distanceCarreeCases({ rangee: 0, colonne: 0 }, { rangee: 2, colonne: 1 }), 5);
  assert.ok(5 > GEOGRAPHIE.rayonInfluenceJoueur ** 2,
    'le montage ne mesure rien : (2, 1) était déjà dans le disque');

  // ⚠ ET LE BARÈME, LUI, COMPTE TOUJOURS EN CASES DE GRILLE. C'est l'autre
  // lecture d'EUCLIDE, celle-là INTACTE : la PORTÉE est un disque, le PRIX se
  // compte en cases de grille, et un raid en diagonale ne renchérit pas pour la
  // seule raison qu'il est en diagonale.
  assert.match(barème, /distanceTchebychev\(baseAttaquante\.position, cible\)/,
    'le barème du raid ne compte plus la distance en cases de grille');
});
