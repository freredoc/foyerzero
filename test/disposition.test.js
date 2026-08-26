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
  debitDuBatiment, ressourceProduite, casesVoisines,
} from '../src/sim/disposition.js';
import { champsDeLaBase } from '../src/sim/champs.js';
import { VOISINAGE, CHAMPS, EMPLACEMENTS, emplacementsDuNiveau } from '../src/data/base.js';

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
  assert.deepEqual(
    codes(p),
    ['champ-gache', 'doublon', 'hors-base', 'hors-champ', 'inconnu', 'niveau'],
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
  // C'est l'arbitrage du 25/08 et il a une conséquence forte : au niveau 1 le
  // Chantier ouvre deux emplacements et en prend un, donc il ne reste QU'UN
  // bâtiment libre. Ne pas le compter en offrirait un gratuit.
  assert.equal(EMPLACEMENTS.chantierOccupeUnEmplacement, true);
  assert.equal(emplacementsDuNiveau(1), 2);

  const auRas = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 1 },
    { id: 'centrale', rangee: 17, colonne: 5, niveau: 1 },
  ];
  assert.deepEqual(problemesDeDisposition(auRas, TERRAIN), [], '2 bâtiments tiennent au niveau 1');

  const unDeTrop = [...auRas, { id: 'caserne', rangee: 17, colonne: 4, niveau: 1 }];
  const p = problemesDeDisposition(unDeTrop, TERRAIN);
  assert.deepEqual(codes(p), ['trop-de-batiments']);
  assert.match(p[0].message, /3 bâtiments pour 2 emplacements/);

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
  // ⚠ LE MODÈLE DU LOT 1 PLAFONNAIT À DEUX (`params.adjacence.maxVoisins`).
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
