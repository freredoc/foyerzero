// La disposition de la base — validation, voisinage typé, débits.
//
// LE TERRAIN DE TEST EST ÉCRIT À LA MAIN, pas tiré. Un terrain généré change de
// forme dès qu'on touche au tirage, et les montages qui en dépendent se mettent
// à mesurer autre chose sans le dire. Les cinq champs ci-dessous sont posés
// exprès, dans la zone légale (rangées 12–17, colonnes 2–8), et leur géométrie
// se lit à l'œil :
//
//        col  2  3  4  5  6  7  8
//   rangée 13     S  S
//   rangée 14     S
//   rangée 16              Q  Q
//
// Un terrain RÉEL est quand même passé au module dans le dernier test, pour que
// le montage ne prouve pas seulement qu'il marche sur du sur-mesure.
//
// Les débits attendus sont écrits en CLAIR, pas recalculés depuis les mêmes
// fonctions que celles qu'on teste : réécrire `propre + n × bonus` dans
// l'assertion, ce serait tester le test.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  problemesDeDisposition, dispositionValide, voisinsQualifiants,
  debitDuBatiment, ressourceProduite, productionParRessource, casesVoisines,
  dispositionNouvelleBase,
} from '../src/sim/disposition.js';
import { champsDeLaBase, ressourceDeLaCase } from '../src/sim/champs.js';
import {
  VOISINAGE, CHAMPS, EMPLACEMENTS, BASE_BATIMENTS, GEOMETRIE_BASE,
  emplacementsDuNiveau, zoneDesChamps,
} from '../src/data/base.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';
import { GRILLE } from '../src/data/combat.js';
import { positionDepartJoueur } from '../src/sim/carte.js';

// ⚠ LE TERRAIN DE DÉPART SE DEMANDE, IL NE S'ÉCRIT PLUS — voir la même note
// dans `chantier.test.js`. La position a bougé le 31/08 (275 → 295).
const DEPART = positionDepartJoueur();

/** Terrain de test, écrit à la main. */
const TERRAIN = {
  cases: [
    { rangee: 13, colonne: 3, ressource: 'scorie' },
    { rangee: 13, colonne: 4, ressource: 'scorie' },
    { rangee: 14, colonne: 3, ressource: 'scorie' },
    { rangee: 16, colonne: 6, ressource: 'quartz' },
    { rangee: 16, colonne: 7, ressource: 'quartz' },
  ],
};

/** Une base légale : Chantier niveau 10, centrale, collecteur, deux raffineries. */
function baseDeReference() {
  return [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'centrale', rangee: 14, colonne: 4, niveau: 1 },
    { id: 'collecteur', rangee: 16, colonne: 6, niveau: 1 },
    { id: 'raffinerie', rangee: 16, colonne: 5, niveau: 1 },
    { id: 'raffinerie', rangee: 15, colonne: 6, niveau: 1 },
  ];
}

const codes = (p) => p.map((x) => x.code).sort();

// ---------------------------------------------------------------------------
// Géométrie du voisinage
// ---------------------------------------------------------------------------

test('disposition — le voisinage est le 3 × 3 privé de son centre', () => {
  const v = casesVoisines(14, 5);
  assert.equal(v.length, VOISINAGE.casesMax);
  assert.equal(v.length, 8);
  // Le centre n'est pas dans sa propre liste : sans ça, un bâtiment se
  // compterait lui-même dès qu'un voisin porterait son id.
  assert.ok(!v.some(([r, c]) => r === 14 && c === 5));
  // Les huit cases exactes, pas « huit cases quelconques ».
  assert.deepEqual(
    v.map(([r, c]) => `${r},${c}`).sort(),
    ['13,4', '13,5', '13,6', '14,4', '14,6', '15,4', '15,5', '15,6'],
  );
  // La liste est DÉRIVÉE du rayon, elle n'est pas écrite en dur : le nombre de
  // cases doit rester (2r+1)² − 1 quel que soit le rayon.
  assert.equal(v.length, (2 * VOISINAGE.rayon + 1) ** 2 - 1);
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test('disposition — une base légale ne remonte aucun problème', () => {
  const base = baseDeReference();
  assert.deepEqual(problemesDeDisposition(base, TERRAIN), []);
  assert.equal(dispositionValide(base, TERRAIN), true);
  // Falsifiable : le montage doit être capable de remonter quelque chose,
  // sinon « liste vide » ne prouverait rien. Une seule case déplacée suffit.
  const casse = baseDeReference();
  casse[2] = { ...casse[2], colonne: 4 }; // collecteur hors champ
  assert.ok(problemesDeDisposition(casse, TERRAIN).length > 0);
});

test('disposition — le collecteur doit être SUR un champ, les autres à côté', () => {
  // Les deux sens comptent. Poser une centrale sur un champ ne casse rien
  // mécaniquement, mais gâche une case de collecteur — et il n'y en a que
  // douze dans toute la base.
  const horsChamp = baseDeReference();
  horsChamp[2] = { ...horsChamp[2], rangee: 15, colonne: 3 };
  assert.deepEqual(codes(problemesDeDisposition(horsChamp, TERRAIN)), ['hors-champ']);

  const gache = baseDeReference();
  gache[1] = { ...gache[1], rangee: 13, colonne: 3 }; // centrale sur un champ
  assert.deepEqual(codes(problemesDeDisposition(gache, TERRAIN)), ['champ-gache']);

  // Et la liste des ayants droit vient des données, pas d'un `=== 'collecteur'`
  // écrit ici : ce test tombera si `posableDessus` change sans qu'on le veuille.
  assert.deepEqual(CHAMPS.posableDessus, ['collecteur']);
});

test('disposition — tous les défauts sont remontés ensemble, pas le premier', () => {
  // Un joueur qui a trois problèmes veut les voir d'un coup. S'arrêter au
  // premier le ferait corriger, relancer, découvrir le deuxième, et ainsi de
  // suite — c'est le comportement qu'on ne veut pas.
  const sale = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'centrale', rangee: 13, colonne: 3, niveau: 1 }, // champ gâché
    { id: 'collecteur', rangee: 15, colonne: 4, niveau: 1 }, // hors champ
    { id: 'qgDeDefense', rangee: 18, colonne: 6, niveau: 0 }, // niveau invalide
    { id: 'qgDeDefense', rangee: 18, colonne: 7, niveau: 1 }, // doublon d'unique
    { id: 'aerodrome', rangee: 99, colonne: 1, niveau: 1 }, // hors base
    { id: 'licorne', rangee: 17, colonne: 2, niveau: 1 }, // id inconnu
  ];
  const p = problemesDeDisposition(sale, TERRAIN);
  // ⚠ `uniques-voisins` APPARAÎT DEUX FOIS, ET C'EST JUSTE. La règle est née le
  // 28/08 : le Chantier (18,5) touche le premier QG (18,6), qui touche le
  // second (18,7). Deux paires, deux défauts — c'est exactement ce que « tous
  // les défauts, pas le premier » veut dire.
  assert.deepEqual(
    codes(p),
    ['champ-gache', 'doublon', 'hors-base', 'hors-champ', 'inconnu', 'niveau',
      'uniques-voisins', 'uniques-voisins'],
  );
  // Chaque problème de bâtiment porte l'indice fautif : sans lui, l'écran ne
  // saurait pas lequel surligner.
  for (const x of p) {
    if (x.code === 'doublon') continue; // défaut d'ensemble, pas d'indice
    assert.ok(Number.isInteger(x.index), `${x.code} sans indice`);
    assert.ok(typeof x.message === 'string' && x.message.length > 0);
  }
});

test('disposition — deux bâtiments sur la même case sont signalés', () => {
  const base = baseDeReference();
  base.push({ id: 'caserne', rangee: 18, colonne: 5, niveau: 1 }); // sur le Chantier
  assert.deepEqual(codes(problemesDeDisposition(base, TERRAIN)), ['superposition']);
});

test('disposition — le Chantier se compte dans ses propres emplacements', () => {
  // C'est l'arbitrage du 25/08 et il a une conséquence forte : le Chantier
  // prend un des emplacements qu'il ouvre. Ne pas le compter en offrirait un
  // gratuit.
  //
  // ⚠ LE NOMBRE A CHANGÉ LE 29/08, PAS LA RÈGLE. La table dictée par Ethan
  // ouvre TROIS emplacements au niveau 1 au lieu de deux : le plafond mord donc
  // au quatrième bâtiment, plus au troisième. Le test lit la fonction plutôt
  // que de réécrire le chiffre, pour qu'il suive la prochaine table.
  assert.equal(EMPLACEMENTS.chantierOccupeUnEmplacement, true);
  const ouvertsNiveau1 = emplacementsDuNiveau(1);
  assert.equal(ouvertsNiveau1, 3);

  const auRas = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 1 },
    { id: 'centrale', rangee: 17, colonne: 5, niveau: 1 },
    { id: 'aerodrome', rangee: 18, colonne: 8, niveau: 1 },
  ];
  assert.equal(auRas.length, ouvertsNiveau1, 'le montage doit remplir la base au RAS');
  assert.deepEqual(problemesDeDisposition(auRas, TERRAIN), [], '3 bâtiments tiennent au niveau 1');

  // ⚠ LES BÂTIMENTS D'APPOINT SONT LOIN DU CHANTIER, ET C'EST DÉLIBÉRÉ DEPUIS
  // LE 28/08. La caserne était en (17,4), donc en diagonale du Chantier — deux
  // uniques voisins, ce qui ajoute un second défaut et brouille ce que ce test
  // mesure. Il mesure le PLAFOND D'EMPLACEMENTS, et rien d'autre : on l'isole.
  const unDeTrop = [...auRas, { id: 'caserne', rangee: 18, colonne: 1, niveau: 1 }];
  const p = problemesDeDisposition(unDeTrop, TERRAIN);
  assert.deepEqual(codes(p), ['trop-de-batiments']);
  assert.match(p[0].message, /4 bâtiments pour 3 emplacements/);

  // Et au niveau 10, les vingt emplacements laissent passer la base de
  // référence : le plafond doit MORDRE ici et pas ailleurs.
  assert.equal(emplacementsDuNiveau(10), 20);
  assert.deepEqual(problemesDeDisposition(baseDeReference(), TERRAIN), []);
});

test('disposition — une base sans Chantier est signalée, pas acceptée', () => {
  const orpheline = baseDeReference().filter((b) => b.id !== 'chantierDeConstruction');
  assert.deepEqual(codes(problemesDeDisposition(orpheline, TERRAIN)), ['sans-chantier']);
});

test('disposition — aucune faute de JEU ne fait lever', () => {
  // « Rien ne se retire en silence » : ce module signale, il ne casse pas et il
  // n'ampute pas. Une disposition absurde doit produire une LISTE, pas une
  // exception — sinon l'écran ne peut rien afficher au joueur.
  const absurde = [
    { id: 'licorne', rangee: -5, colonne: 99, niveau: -3 },
    { id: 'centrale', rangee: 1, colonne: 1, niveau: 999 },
  ];
  assert.doesNotThrow(() => problemesDeDisposition(absurde, TERRAIN));
  assert.ok(problemesDeDisposition(absurde, TERRAIN).length >= 3);
  // Une liste vide est légale et ne lève pas non plus (elle manque juste son
  // Chantier).
  assert.deepEqual(codes(problemesDeDisposition([], TERRAIN)), ['sans-chantier']);

  // En revanche une faute de PROGRAMME lève : la distinction est le contrat.
  assert.throws(() => problemesDeDisposition(null, TERRAIN), TypeError);
  assert.throws(() => problemesDeDisposition([], null), TypeError);
  assert.throws(() => voisinsQualifiants(baseDeReference(), TERRAIN, 99), RangeError);
  assert.throws(() => debitDuBatiment(baseDeReference(), TERRAIN, -1), RangeError);
});

// ---------------------------------------------------------------------------
// Voisinage typé
// ---------------------------------------------------------------------------

test('disposition — le voisinage distingue terrain et bâtiments', () => {
  const base = baseDeReference();
  // La centrale en (14,4) touche les trois scories de (13,3), (13,4), (14,3),
  // et aucun accumulateur. Les deux clés sortent, celle à zéro comprise :
  // un panneau doit pouvoir afficher « 0 accumulateur » plutôt que rien.
  assert.deepEqual(voisinsQualifiants(base, TERRAIN, 1), { champDeScorie: 3, accumulateur: 0 });
  // Le collecteur en (16,6) touche les raffineries de (16,5) et (15,6).
  assert.deepEqual(voisinsQualifiants(base, TERRAIN, 2), { raffinerie: 2 });
  // Réciproquement, chaque raffinerie touche le collecteur.
  assert.deepEqual(voisinsQualifiants(base, TERRAIN, 3), { collecteur: 1 });
  assert.deepEqual(voisinsQualifiants(base, TERRAIN, 4), { collecteur: 1 });
  // Le Chantier ne tire aucun bonus : `{}`, pas un décompte inutile.
  assert.deepEqual(voisinsQualifiants(base, TERRAIN, 0), {});

  // Le quartz de (16,7) ne compte PAS pour la centrale : le type qualifiant est
  // `champDeScorie`, pas « champ ». Sans cette distinction, une base posée sur
  // du quartz produirait de l'électricité gratuitement.
  const centraleSurQuartz = baseDeReference();
  centraleSurQuartz[1] = { ...centraleSurQuartz[1], rangee: 15, colonne: 7 };
  assert.equal(voisinsQualifiants(centraleSurQuartz, TERRAIN, 1).champDeScorie, 0);
});

test('disposition — aucun plafond de voisins autre que la géométrie', () => {
  // ⚠ LE MODÈLE DU LOT 1 PLAFONNAIT À DEUX VOISINS (dans `data/params.js`,
  // retiré le 27/08 avec `sim/economy.js`).
  // Celui-ci ne plafonne rien : les huit cases comptent toutes. Confondre les
  // deux diviserait la production par quatre dans le meilleur cas — d'où ce
  // test, qui monte délibérément au-dessus de deux.
  const grappe = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 20 },
    { id: 'collecteur', rangee: 16, colonne: 6, niveau: 1 },
    { id: 'raffinerie', rangee: 15, colonne: 5, niveau: 1 },
    { id: 'raffinerie', rangee: 15, colonne: 6, niveau: 1 },
    { id: 'raffinerie', rangee: 15, colonne: 7, niveau: 1 },
    { id: 'raffinerie', rangee: 16, colonne: 5, niveau: 1 },
    { id: 'raffinerie', rangee: 17, colonne: 6, niveau: 1 },
  ];
  assert.deepEqual(problemesDeDisposition(grappe, TERRAIN), []);
  assert.deepEqual(voisinsQualifiants(grappe, TERRAIN, 1), { raffinerie: 5 });
  // 240 propre + 5 × 72 = 600. Sous un plafond à deux, on lirait 384.
  assert.equal(debitDuBatiment(grappe, TERRAIN, 1).total, 600);
  assert.notEqual(debitDuBatiment(grappe, TERRAIN, 1).total, 384);
});

// ---------------------------------------------------------------------------
// Débits
// ---------------------------------------------------------------------------

test('disposition — le débit vaut le propre plus les voisins, en clair', () => {
  const base = baseDeReference();
  // Centrale niveau 1, trois scories : 120 + 3 × 60 = 300.
  assert.deepEqual(debitDuBatiment(base, TERRAIN, 1), {
    total: 300, propre: 120, parVoisin: { champDeScorie: 180, accumulateur: 0 },
  });
  // Collecteur niveau 1, deux raffineries : 240 + 2 × 72 = 384.
  assert.deepEqual(debitDuBatiment(base, TERRAIN, 2), {
    total: 384, propre: 240, parVoisin: { raffinerie: 144 },
  });
  // Une raffinerie n'a pas de production propre : tout vient du voisinage.
  assert.deepEqual(debitDuBatiment(base, TERRAIN, 3), {
    total: 72, propre: 0, parVoisin: { collecteur: 72 },
  });
  // Le Chantier ne produit rien, et le dit sans lever.
  assert.deepEqual(debitDuBatiment(base, TERRAIN, 0), { total: 0, propre: 0, parVoisin: {} });
});

test('disposition — l\'arrondi se fait PAR TYPE, puis se multiplie', () => {
  // Le choix est mesurable, et il ne l'était qu'au niveau 3 : le bonus de la
  // centrale y vaut 60 × 1,25² = 93,75.
  //   arrondi par type puis multiplié : round(93,75) × 3 = 94 × 3 = 282
  //   somme puis arrondie             : round(93,75 × 3) = round(281,25) = 281
  // Un écart d'UNE unité, qui se creuse ensuite. On asserte 282, et on asserte
  // aussi que ce n'est PAS 281 — sinon le test ne distinguerait pas les deux
  // méthodes, qui coïncident à presque tous les autres niveaux.
  const base = baseDeReference();
  base[1] = { ...base[1], niveau: 3 };
  const d = debitDuBatiment(base, TERRAIN, 1); // la centrale
  assert.equal(d.parVoisin.champDeScorie, 282);
  assert.notEqual(d.parVoisin.champDeScorie, 281);
  assert.equal(d.propre, 188); // round(120 × 1,5625) = round(187,5)
  assert.equal(d.total, 470);
});

test('disposition — le bonus suit le niveau du PRODUCTEUR, pas celui du voisin', () => {
  // Règle de `debitVoisinParHeure`, ici vérifiée de bout en bout : monter les
  // raffineries ne change rien au débit du collecteur, monter le collecteur si.
  const basses = baseDeReference();
  const hautes = baseDeReference().map(
    (b) => (b.id === 'raffinerie' ? { ...b, niveau: 30 } : b),
  );
  assert.equal(debitDuBatiment(basses, TERRAIN, 2).total, debitDuBatiment(hautes, TERRAIN, 2).total);
  assert.equal(debitDuBatiment(basses, TERRAIN, 2).total, 384);

  const collecteurHaut = baseDeReference().map(
    (b) => (b.id === 'collecteur' ? { ...b, niveau: 2 } : b),
  );
  // 300 propre + 2 × 90 = 480 au niveau 2.
  assert.equal(debitDuBatiment(collecteurHaut, TERRAIN, 2).total, 480);

  // Falsifiable : les deux montages doivent bien DIFFÉRER quelque part, sinon
  // l'égalité du haut passerait aussi sur un module qui ignore les niveaux.
  assert.notEqual(
    debitDuBatiment(basses, TERRAIN, 3).total,
    debitDuBatiment(hautes, TERRAIN, 3).total,
  );
});

// ---------------------------------------------------------------------------
// Ressource produite
// ---------------------------------------------------------------------------

test('disposition — le champ décide de ce que produit le collecteur', () => {
  assert.equal(CHAMPS.ressourceDonneeParLeChamp, true);
  const base = baseDeReference();
  assert.equal(ressourceProduite(base, TERRAIN, 2), 'quartz'); // posé sur (16,6)

  // Le même collecteur, déplacé sur une scorie, produit de la scorie. C'est
  // toute la mécanique : rien dans sa ligne de données ne le dit.
  const surScorie = baseDeReference();
  surScorie[2] = { ...surScorie[2], rangee: 13, colonne: 3 };
  assert.equal(ressourceProduite(surScorie, TERRAIN, 2), 'scorie');

  // Hors champ, il rend null : il est mal posé, pas ambigu.
  const malPose = baseDeReference();
  malPose[2] = { ...malPose[2], rangee: 15, colonne: 4 };
  assert.equal(ressourceProduite(malPose, TERRAIN, 2), null);

  // Centrale et accumulateur : électricité, tranché.
  assert.equal(ressourceProduite(base, TERRAIN, 1), 'electricite');

  // ⚠ La raffinerie rend null, et c'est un TROU ASSUMÉ, pas un oubli : elle
  // produit 72/h par collecteur voisin, mais rien ne dit de quoi. Le détail par
  // voisin reste disponible pour trancher plus tard.
  assert.equal(ressourceProduite(base, TERRAIN, 3), null);
  assert.equal(debitDuBatiment(base, TERRAIN, 3).parVoisin.collecteur, 72);
});

// ---------------------------------------------------------------------------
// Sur un terrain réel
// ---------------------------------------------------------------------------

test('disposition — le module tient sur un terrain généré, pas seulement sur mesure', () => {
  // Le terrain de test est écrit à la main ; celui-ci est tiré. Sans ce
  // dernier, on ne prouverait que la cohérence du montage avec lui-même.
  let posesVerifiees = 0;
  for (const [r, c] of [[42, 15], [7, 3], [180, 22], [299, 30]]) {
    const champs = champsDeLaBase(r, c);
    // Un collecteur sur CHAQUE case de champ : c'est le maximum légal, douze.
    const dispo = [{ id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 30 }];
    for (const k of champs.cases) {
      dispo.push({ id: 'collecteur', rangee: k.rangee, colonne: k.colonne, niveau: 1 });
    }
    assert.deepEqual(
      problemesDeDisposition(dispo, champs), [],
      `(${r},${c}) : douze collecteurs sur douze champs devraient être légaux`,
    );
    assert.equal(dispo.length - 1, CHAMPS.total);

    for (let i = 1; i < dispo.length; i++) {
      // Chacun produit ce qu'il y a sous lui, et jamais null.
      const res = ressourceProduite(dispo, champs, i);
      assert.ok(res === 'quartz' || res === 'scorie', `ressource ${res}`);
      // Aucune raffinerie posée, donc chacun est à son débit propre nu.
      assert.equal(debitDuBatiment(dispo, champs, i).total, 240);
      posesVerifiees += 1;
    }

    // Le treizième collecteur n'a nulle part où aller : toutes les cases de
    // champ sont prises. C'est le plafond réel du jeu, vérifié sur du généré.
    const treizieme = [...dispo, { id: 'collecteur', rangee: 12, colonne: 2, niveau: 1 }];
    assert.ok(
      problemesDeDisposition(treizieme, champs).length > 0,
      'un treizième collecteur devrait être refusé',
    );
  }
  // MESURÉ : 4 terrains × 12 collecteurs = 48 poses vérifiées.
  assert.equal(posesVerifiees, 48);
});

// ---------------------------------------------------------------------------
// Production par ressource — arbitrage du 26/08
// ---------------------------------------------------------------------------

/**
 * Le montage de l'exemple d'Ethan, monté à la lettre : une raffinerie entourée
 * de deux collecteurs à quartz et de trois à scorie.
 *
 *        col  4  5  6
 *   rangée 14  Q  Q          les cinq champs, chacun avec son collecteur
 *   rangée 15     R          la raffinerie, sur une case nue
 *   rangée 16  S  S  S
 */
const TERRAIN_MELANGE = {
  cases: [
    { rangee: 14, colonne: 4, ressource: 'quartz' },
    { rangee: 14, colonne: 5, ressource: 'quartz' },
    { rangee: 16, colonne: 4, ressource: 'scorie' },
    { rangee: 16, colonne: 5, ressource: 'scorie' },
    { rangee: 16, colonne: 6, ressource: 'scorie' },
  ],
};

function baseMelangee() {
  return [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'raffinerie', rangee: 15, colonne: 5, niveau: 1 },
    ...TERRAIN_MELANGE.cases.map(
      (k) => ({ id: 'collecteur', rangee: k.rangee, colonne: k.colonne, niveau: 1 }),
    ),
  ];
}

test('disposition — l\'exemple d\'Ethan : 144 de quartz et 216 de scorie', () => {
  // ARBITRÉ le 26/08, cité mot pour mot : « une raffinerie niveau 1 avec
  // 2 collecteurs quartz et 3 scories, ça fait 144/h quartz et 216/h scorie ».
  const base = baseMelangee();
  assert.deepEqual(problemesDeDisposition(base, TERRAIN_MELANGE), []);
  assert.deepEqual(
    productionParRessource(base, TERRAIN_MELANGE, 1),
    { quartz: 144, scorie: 216 },
  );

  // Les deux ne s'additionnent PAS pour le joueur, mais leur somme doit valoir
  // le débit brut : rien ne se perd en route, tout se sépare. C'est ce qui
  // relie ce calcul au précédent, et ce qui tomberait si l'un dérivait.
  const brut = debitDuBatiment(base, TERRAIN_MELANGE, 1);
  assert.equal(brut.total, 360);
  assert.equal(144 + 216, brut.total);
  assert.equal(brut.propre, 0, 'une raffinerie n\'a pas de production propre');
});

test('disposition — la ressource du VOISIN ne vaut que pour la raffinerie', () => {
  // ⚠ LA RÈGLE NE SE GÉNÉRALISE PAS, et c'est le piège de tout ce lot. Une
  // centrale qui touche trois champs de scorie ne produit PAS de la scorie :
  // elle produit de l'électricité. Le discriminant est `ressource` de
  // BASE_BATIMENTS, pas la nature du voisin.
  const avecCentrale = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'centrale', rangee: 15, colonne: 5, niveau: 1 },
  ];
  assert.deepEqual(
    productionParRessource(avecCentrale, TERRAIN_MELANGE, 1),
    { electricite: 300 },
  );
  // Le montage mesure bien quelque chose : la centrale COMPTE ces trois champs
  // (120 + 3 × 60 = 300). Elle les compte, mais dans sa propre ressource.
  assert.equal(voisinsQualifiants(avecCentrale, TERRAIN_MELANGE, 1).champDeScorie, 3);
  assert.equal(debitDuBatiment(avecCentrale, TERRAIN_MELANGE, 1).total, 300);
  assert.ok(!('scorie' in productionParRessource(avecCentrale, TERRAIN_MELANGE, 1)));

  // Un collecteur non plus : son bonus de raffinerie va dans SA ressource à
  // lui, celle du champ sous lui. 240 + 1 × 72 = 312.
  const base = baseMelangee();
  assert.deepEqual(productionParRessource(base, TERRAIN_MELANGE, 2), { quartz: 312 });
  assert.deepEqual(productionParRessource(base, TERRAIN_MELANGE, 4), { scorie: 312 });

  // Les trois familles se lisent dans les données, pas dans un `if` écrit ici.
  assert.equal(BASE_BATIMENTS.collecteur.ressource, 'quartzOuScorie');
  assert.equal(BASE_BATIMENTS.raffinerie.ressource, 'quartzEtScorie');
  assert.equal(BASE_BATIMENTS.centrale.ressource, 'electricite');
});

test('disposition — l\'attribution suit le niveau de la RAFFINERIE, pas des collecteurs', () => {
  // Même voisinage, raffinerie au niveau 2 : 2 × 90 et 3 × 90.
  const n2 = baseMelangee().map((b, i) => (i === 1 ? { ...b, niveau: 2 } : b));
  assert.deepEqual(productionParRessource(n2, TERRAIN_MELANGE, 1), { quartz: 180, scorie: 270 });

  // Monter les COLLECTEURS ne change rien à ce que la raffinerie produit —
  // c'est la règle de `debitVoisinParHeure`, vérifiée ici de bout en bout.
  const collecteursHauts = baseMelangee().map(
    (b) => (b.id === 'collecteur' ? { ...b, niveau: 40 } : b),
  );
  assert.deepEqual(
    productionParRessource(collecteursHauts, TERRAIN_MELANGE, 1),
    { quartz: 144, scorie: 216 },
  );
  // Falsifiable : les collecteurs, eux, doivent bien avoir changé.
  assert.notEqual(
    productionParRessource(collecteursHauts, TERRAIN_MELANGE, 2).quartz,
    productionParRessource(baseMelangee(), TERRAIN_MELANGE, 2).quartz,
  );
});

test('disposition — un voisin mal posé tombe dans `indetermine`, il n\'est pas inventé', () => {
  // Un collecteur hors champ ne produit rien d'identifiable. Son apport à la
  // raffinerie ne peut donc pas être attribué — et il ne doit surtout pas être
  // versé au hasard dans le quartz. `indetermine` est un SIGNAL : sur une
  // disposition valide, il n'apparaît jamais.
  const mal = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'raffinerie', rangee: 15, colonne: 5, niveau: 1 },
    { id: 'collecteur', rangee: 15, colonne: 4, niveau: 1 }, // case nue
  ];
  assert.deepEqual(productionParRessource(mal, TERRAIN_MELANGE, 1), { indetermine: 72 });
  // Et la disposition est bien signalée comme fautive par ailleurs : les deux
  // mécanismes se recoupent au lieu de se contredire.
  assert.deepEqual(codes(problemesDeDisposition(mal, TERRAIN_MELANGE)), ['hors-champ']);

  // Sur les dispositions valides du fichier, `indetermine` n'apparaît nulle part.
  for (const [dispo, terrain] of [[baseMelangee(), TERRAIN_MELANGE], [baseDeReference(), TERRAIN]]) {
    for (let i = 0; i < dispo.length; i++) {
      assert.ok(
        !('indetermine' in productionParRessource(dispo, terrain, i)),
        `${dispo[i].id} produit de l'indéterminé sur une base valide`,
      );
    }
  }
});

test('disposition — ce qui ne produit rien rend un objet vide, pas zéro', () => {
  // Le Chantier, la caserne, le QG : aucune ligne dans DEBITS. Rendre `{}`
  // plutôt que `{ quartz: 0 }` évite qu'un panneau affiche « 0 quartz/h » pour
  // une caserne, ce qui laisserait croire qu'elle pourrait en produire.
  const base = baseMelangee();
  assert.deepEqual(productionParRessource(base, TERRAIN_MELANGE, 0), {});
  assert.throws(() => productionParRessource(base, TERRAIN_MELANGE, 99), RangeError);

  // Une raffinerie isolée ne produit rien non plus : pas de propre, pas de
  // voisin. Elle rend `{}`, pas `{ quartz: 0, scorie: 0 }`.
  const seule = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'raffinerie', rangee: 13, colonne: 7, niveau: 1 },
  ];
  assert.deepEqual(productionParRessource(seule, TERRAIN_MELANGE, 1), {});
});

// ---------------------------------------------------------------------------
// La fondation d'une base neuve — arbitrage du 26/08
// ---------------------------------------------------------------------------

test('disposition — toute base neuve est un Chantier niveau 1 en (18, 5)', () => {
  // ARBITRÉ le 26/08, en deux temps : « la première base est gratuite et
  // immédiatement posée », puis « toutes les bases que le joueur pose suivront
  // la même logique : chantier niveau 1 gratuit, sur position 18,5 ».
  // Ce n'est donc pas la règle du DÉMARRAGE, c'est la règle de FONDATION.
  const dispo = dispositionNouvelleBase();
  assert.equal(dispo.length, 1, 'un seul bâtiment à la fondation');
  // ⚠ `degatsMilli: 0` DEPUIS LE LOT RAID-B (02/09) : un bâtiment du joueur peut
  // désormais être endommagé, l'Ouvrage attaquant sa base. Le champ est présent
  // et nul plutôt qu'absent — c'est ce qui évite à `pvCourantsMilli` d'avoir à
  // deviner, et c'est la même convention que sur une pièce de garnison.
  assert.deepEqual(dispo[0], {
    id: 'chantierDeConstruction', niveau: 1, rangee: 18, colonne: 5, degatsMilli: 0,
  });

  // Les deux coordonnées sont DÉRIVÉES de GEOMETRIE_BASE, pas écrites en dur :
  // un changement de GRILLE doit les déplacer.
  assert.equal(dispo[0].rangee, GEOMETRIE_BASE.derniereRangee);
  assert.equal(
    dispo[0].colonne,
    (GEOMETRIE_BASE.premiereColonne + GEOMETRIE_BASE.derniereColonne) / 2,
    'la largeur de 9 a un centre EXACT : pas d\'arrondi à cet endroit',
  );

  // Le niveau 1 ne coûte rien : c'est ce qui rend la fondation « gratuite »
  // vraie au sens du modèle économique, pas seulement au sens du récit.
  assert.ok(ECONOMIE_NIVEAU.premierNiveauPayant > 1, 'le niveau 1 doit être gratuit');
});

test('disposition — le Chantier est posé au FOND, la rangée la plus protégée', () => {
  // ⚠ CE TEST EXISTE PARCE QUE LE CONTRAIRE A ÉTÉ CODÉ D'ABORD. « En haut »
  // avait été lu comme la rangée 11 — celle que l'assaillant atteint en
  // PREMIER parmi les bâtiments. Ethan a précisé « 18,5 » : c'est le FOND.
  //
  // L'assaillant part des rangées 1–2, traverse la défense (3–10), puis les
  // bâtiments en montant en numéro de rangée. La 18 est donc la dernière.
  // C'est cohérent avec ce qu'est le Chantier : le seul bâtiment sans plancher
  // de PV, et celui dont la perte force le redéploiement.
  const dispo = dispositionNouvelleBase();
  assert.equal(dispo[0].rangee, GEOMETRIE_BASE.derniereRangee);
  assert.notEqual(
    dispo[0].rangee, GEOMETRIE_BASE.premiereRangee,
    'le Chantier est reposé du côté exposé',
  );
  // Le fond est bien le côté OPPOSÉ au déploiement des vagues.
  assert.ok(GRILLE.bandes.deploiement.premiere < GRILLE.bandes.batiments.premiere);
  assert.ok(
    dispo[0].rangee > GRILLE.bandes.defense.derniere,
    'le Chantier doit être derrière la défense, pas devant',
  );
  // Et le seul sans plancher de PV, ce qui justifie de l'abriter.
  assert.equal(BASE_BATIMENTS.chantierDeConstruction.plancherPv, false);
});

test('disposition — une COPIE fraîche à chaque appel, jamais la table', () => {
  // Une disposition se modifie en jouant. Rendre la donnée de `data/base.js`
  // elle-même laisserait une base abîmer la suivante — et comme la règle vaut
  // pour TOUTES les bases du joueur, le défaut se propagerait de fondation en
  // fondation au lieu de rester dans une partie.
  const a = dispositionNouvelleBase();
  const b = dispositionNouvelleBase();
  assert.deepEqual(a, b);
  assert.notEqual(a[0], b[0], 'le même objet est rendu deux fois');
  a[0].niveau = 42;
  assert.equal(dispositionNouvelleBase()[0].niveau, 1, 'la table a été abîmée');
});

test('disposition — il reste EXACTEMENT deux emplacements libres à la fondation', () => {
  // ⚠ IL EN RESTAIT UN JUSQU'AU 29/08. La table d'emplacements dictée par Ethan
  // ouvre trois emplacements au niveau 1 : le début de partie gagne un bâtiment,
  // et c'est la conséquence voulue de la table.
  assert.equal(emplacementsDuNiveau(1), 3);
  assert.equal(EMPLACEMENTS.chantierOccupeUnEmplacement, true);
  assert.equal(emplacementsDuNiveau(1) - dispositionNouvelleBase().length, 2);

  // Prouvé dans les deux sens : deux bâtiments de plus passent, trois non.
  //
  // ⚠ LES BÂTIMENTS D'APPOINT SONT SUR LA RANGÉE 18, pas ailleurs. Une première
  // rédaction les posait en (12,5), qui porte un champ à cette graine : le test
  // tombait sur `champ-gache` au lieu de mesurer le plafond d'emplacements.
  // Le pourtour de la bande est le seul endroit garanti libre de champs.
  const champs = champsDeLaBase(DEPART.rangee, DEPART.colonne);
  const auRas = [
    ...dispositionNouvelleBase(),
    { id: 'centrale', rangee: 18, colonne: 6, niveau: 1 },
    { id: 'aerodrome', rangee: 18, colonne: 8, niveau: 1 },
  ];
  assert.deepEqual(problemesDeDisposition(auRas, champs), []);
  const unDeTrop = [...auRas, { id: 'caserne', rangee: 18, colonne: 1, niveau: 1 }];
  assert.deepEqual(
    problemesDeDisposition(unDeTrop, champs).map((p) => p.code), ['trop-de-batiments'],
  );
});

test('disposition — la fondation est légale sur TOUTES les graines, par construction', () => {
  // ⚠ CE N'EST PAS UNE CHANCE. Les champs se tiennent à `CHAMPS.margeBord` du
  // pourtour, donc entre les rangées 12 et 17. Ni la 11 ni la 18 n'en portent,
  // quelle que soit la position sur la carte. Un test qui ne vérifierait que la
  // position de départ du joueur ne distinguerait pas « toujours vrai » de
  // « vrai ici » — et c'est d'autant plus important que la règle vaut désormais
  // pour toutes les bases, donc pour des positions inconnues à l'avance.
  assert.ok(
    zoneDesChamps().derniereRangee < GEOMETRIE_BASE.derniereRangee,
    'si les champs atteignaient la dernière rangée, la fondation pourrait échouer',
  );

  const { rangee: rc, colonne: cc } = dispositionNouvelleBase()[0];
  let terrains = 0;
  for (let r = 5; r <= 295; r += 23) {
    for (let c = 1; c <= 30; c += 7) {
      const champs = champsDeLaBase(r, c);
      assert.deepEqual(
        problemesDeDisposition(dispositionNouvelleBase(), champs), [],
        `(${r},${c}) : la fondation devrait être légale`,
      );
      assert.equal(
        ressourceDeLaCase(champs, rc, cc), null,
        `(${r},${c}) : un champ est tombé sur la case du Chantier`,
      );
      terrains += 1;
    }
  }
  // MESURÉ : 13 rangées × 5 colonnes = 65 terrains tirés.
  assert.equal(terrains, 65);
});

test('disposition — deux bâtiments uniques ne peuvent pas être voisins', () => {
  // ⚠ ARBITRÉ PAR ETHAN LE 28/08 : « les bâtiments uniques ne peuvent être
  // placés à côté d'un autre bâtiment unique ». Sept des onze le sont, donc la
  // règle force la base à s'étaler — c'est elle qui lui donne sa géométrie.
  const uniques = Object.keys(BASE_BATIMENTS).filter((id) => BASE_BATIMENTS[id].unique === true);
  assert.equal(uniques.length, 7, 'le montage suppose sept uniques');

  // Les huit cases autour du Chantier sont interdites aux uniques, et à elles
  // seules : on parcourt le 3 × 3 complet plutôt que d'en écrire une liste.
  const chantier = { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 };
  for (const [dr, dc] of [[0, 1], [0, -1], [-1, 0], [-1, 1], [-1, -1]]) {
    const voisine = [
      { ...chantier },
      { id: 'caserne', rangee: 18 + dr, colonne: 5 + dc, niveau: 1 },
    ];
    assert.ok(
      codes(problemesDeDisposition(voisine, TERRAIN)).includes('uniques-voisins'),
      `(${dr},${dc}) devrait être refusé à un unique`,
    );
  }

  // ⚠ ET LE VOISINAGE EST CELUI DE `casesVoisines`, PAS UN SECOND. Le bonus de
  // proximité et cette interdiction doivent parler du même 3 × 3 : deux
  // géométries pour le même mot, et le joueur en apprendrait une fausse.
  for (const [r, c] of casesVoisines(18, 5)) {
    if (r < GRILLE.bandes.batiments.premiere || r > GRILLE.bandes.batiments.derniere) continue;
    if (c < 1 || c > GRILLE.largeur) continue;
    const paire = [{ ...chantier }, { id: 'caserne', rangee: r, colonne: c, niveau: 1 }];
    assert.ok(codes(problemesDeDisposition(paire, TERRAIN)).includes('uniques-voisins'),
      `(${r},${c}) est voisine et devrait être refusée`);
  }

  // À deux cases, plus de conflit — sinon la règle interdirait toute la base.
  const loin = [{ ...chantier }, { id: 'caserne', rangee: 18, colonne: 3, niveau: 1 }];
  assert.deepEqual(problemesDeDisposition(loin, TERRAIN), []);

  // Un NON-unique a le droit de coller un unique : c'est ce qui rend le
  // voisinage productif encore jouable.
  const centrale = [{ ...chantier }, { id: 'centrale', rangee: 17, colonne: 5, niveau: 1 }];
  assert.deepEqual(problemesDeDisposition(centrale, TERRAIN), []);
  assert.equal(BASE_BATIMENTS.centrale.unique, false, 'le montage perd son sens si la centrale devient unique');

  // Le message nomme LES DEUX bâtiments : « X et Y sont tous deux uniques ».
  // Sans les deux noms, le joueur ne sait pas lequel déplacer.
  const p = problemesDeDisposition(
    [{ ...chantier }, { id: 'qgDeDefense', rangee: 17, colonne: 4, niveau: 1 }], TERRAIN,
  );
  assert.equal(p.length, 1);
  assert.match(p[0].message, /Chantier de construction/);
  assert.match(p[0].message, /QG de défense/);
  assert.ok(Number.isInteger(p[0].index), 'le défaut doit désigner un bâtiment');
});
