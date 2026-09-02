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
  casesArrondiesAuSuperieur, RAYON_ATTAQUE_CARRE,
} from '../src/sim/points-attaque.js';
import { horsDeLaGarde, hachageDeCase, estBaseOuvrage } from '../src/sim/peuplement.js';
import { casesDeLAnneau } from '../src/sim/satellites.js';
import { distanceCarree } from '../src/sim/grille.js';
import { positionDepartJoueur, estSurLaCarte } from '../src/sim/carte.js';
import {
  creerEtat, serialiser, migrer, SAVE_VERSION,
} from '../src/sim/state.js';
import { GEOGRAPHIE, PEUPLEMENT } from '../src/data/sites.js';

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

test('EUCLIDE T5 — la densité tombe dans 16 ± 1 sur 120 graines', () => {
  assert.equal(PEUPLEMENT.basesParDouzeCarre, 16);
  assert.equal(PEUPLEMENT.probabiliteCandidate, 0.35);
  assert.equal(PEUPLEMENT.toleranceMesure, 1);

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
  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : l'ancienne valeur, 0,14, rendait
  // 11,97 — hors de la tolérance. Sans cette ligne, une tolérance élargie ou
  // une cible baissée passerait sans qu'on le voie.
  assert.ok(moyenne > 13, `densité ${moyenne.toFixed(2)} : le doublement n'a pas eu lieu`);
});

test('EUCLIDE T5 bis — le plafond de densité est STRUCTUREL, et 24 était hors d\'atteinte', () => {
  // ⚠⚠ CE TEST EXISTE POUR QUE PERSONNE NE REPROPOSE 24. Le brief du lot le
  // demandait ; mesuré, c'est impossible tant que l'exclusion 3 × 3 tient.
  //
  // Une case est retenue si elle est un MAXIMUM LOCAL STRICT du hachage parmi
  // ses huit voisines candidates. À probabilité 1, toutes les cases sont
  // candidates : la densité vaut alors celle des maxima locaux d'un champ
  // indépendant dans un voisinage de neuf, c'est-à-dire exactement 1/9. Sur une
  // fenêtre de 144 cases, cela fait SEIZE, et pas une de plus.
  //
  // On le mesure ici en réimplémentant la règle avec p = 1, ce que la table ne
  // permet pas d'exprimer — et le résultat doit rester sous le plafond.
  const PLAFOND = 144 / 9;
  const candidate = (g, r, c) => estSurLaCarte(r, c) && horsDeLaGarde(r, c);
  const estBase = (g, r, c) => {
    if (!candidate(g, r, c)) return false;
    const mien = hachageDeCase(g, r, c, 1);
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        if (!candidate(g, r + dr, c + dc)) continue;
        if (hachageDeCase(g, r + dr, c + dc, 1) >= mien) return false;
      }
    }
    return true;
  };
  const densites = [];
  for (let g = 1; g <= 20; g += 1) {
    let total = 0;
    let fenetres = 0;
    for (let r = 100; r <= 244; r += 12) {
      for (let c = 1; c + 11 <= GEOGRAPHIE.carte.largeur; c += 12) {
        let k = 0;
        for (let dr = 0; dr < 12; dr += 1) {
          for (let dc = 0; dc < 12; dc += 1) if (estBase(g, r + dr, c + dc)) k += 1;
        }
        total += k;
        fenetres += 1;
      }
    }
    densites.push(total / fenetres);
  }
  const saturation = densites.reduce((a, b) => a + b, 0) / densites.length;
  assert.ok(saturation < PLAFOND + 0.5,
    `saturation mesurée ${saturation.toFixed(2)}, plafond théorique ${PLAFOND.toFixed(2)}`);
  assert.ok(saturation < 24 - PEUPLEMENT.toleranceMesure,
    `24 ± 1 serait atteignable : saturation ${saturation.toFixed(2)}`);
  // Et la valeur retenue est en dessous de la saturation — Ethan : « un peu
  // moins pour que ce soit pas un cadre parfaitement rectangulaire ».
  assert.ok(PEUPLEMENT.basesParDouzeCarre <= saturation,
    'la cible dépasse la saturation : elle ne sera jamais atteinte');
});

// ---------------------------------------------------------------------------
// T6 — la validation d'entrée survit
// ---------------------------------------------------------------------------

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
  assert.equal(SAVE_VERSION, 22, 'le bump de la version des sauvegardes a été oublié');

  const v20 = JSON.parse(serialiser(creerEtat(2026), 0));
  v20.version = 20;
  // Une v20 qui porte VRAIMENT quelque chose — sans quoi « vidé » ne se
  // distinguerait pas de « déjà vide ».
  v20.sitesEntames = { '150:12': { pvBatimentsMilli: [0, null], pvDefensesMilli: [1000] } };
  v20.poisAcquis = [{ type: 'poiQuartz', bande: 3 }, { type: 'poiScorie', bande: 1 }];
  assert.ok(Object.keys(v20.sitesEntames).length > 0, 'le montage ne mesure rien');
  assert.ok(v20.poisAcquis.length > 0, 'le montage ne mesure rien');

  const migre = migrer(structuredClone(v20));
  assert.equal(migre.version, 22);
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
  assert.deepEqual(apres.satellites, v20.satellites, 'les satellites posés ont bougé');
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

test('EUCLIDE — les zones d\'influence restent en Tchebychev, et c\'est une lecture', () => {
  // ⚠⚠ LE LOT NE FAIT BASCULER QUE LES TROIS DISTANCES DE PORTÉE. Les zones
  // d'influence — rayon 2 pour le joueur, 3 pour l'Ouvrage — sont des CARRÉS que
  // `sim/territoire.js` peint case par case sur l'écran Monde. Les passer à
  // Euclide dans le barème du raid sans les repeindre là-bas ferait payer le
  // tarif de proximité sur des cases que la carte ne montre pas comme siennes.
  //
  // C'est une LECTURE, pas un arbitrage : si Ethan veut les zones en disque, ce
  // sont `estEnTerritoireAllie` ET la boucle de `territoire.js` qui changent,
  // ensemble.
  const source = decommentee('src/sim/points-attaque.js');
  assert.match(source, /distanceTchebychev\(base\.position, cible\)/,
    'le territoire allié ne se mesure plus en Tchebychev');
  // La diagonale à 2 est DEDANS en Tchebychev, DEHORS en Euclide : c'est
  // exactement le cas où les deux métriques divergent, et il est mesuré.
  const o = { rangee: 0, colonne: 0 };
  const diagonale = { rangee: 2, colonne: 2 };
  assert.equal(distanceTchebychev(o, diagonale), 2);
  assert.equal(distanceCarreeCases(o, diagonale), 8);
  assert.ok(distanceCarreeCases(o, diagonale) > GEOGRAPHIE.rayonInfluenceJoueur ** 2);
});
