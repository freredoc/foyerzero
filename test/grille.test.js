// Tests de géométrie du lot 2A, et T16 du brief (cohérence arithmétique).
//
// Chaque seuil porte son calcul en commentaire. Un test dont le seuil n'est
// pas justifié est un test raté.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GRILLE, OBSTACLES, UNITES, DEFENSES, COLONNES_DEGATS } from '../src/data/combat.js';
import { POINTS_RECHERCHE, GEOGRAPHIE } from '../src/data/sites.js';
import {
  MILLI_PAR_CASE,
  PREMIERE_RANGEE,
  DERNIERE_RANGEE,
  enEntier,
  milliDepuisCase,
  caseDepuisMilli,
  distanceCarree,
  estDansLaGrille,
  estDansLaBande,
  bornesBande,
  estSortiParLeHaut,
  creerOccupation,
  poser,
  retirer,
  occupantDe,
  cleCase,
  indexerObstacles,
  typeObstacleSur,
  obstacleConcerne,
  vitesseSousObstacle,
  DIVISEUR_OBSTACLE_MILLI,
} from '../src/sim/grille.js';
import { verifierArithmetique, TICKS_MAX_COMBAT, TICKS_PAR_VAGUE } from '../src/sim/combat.js';

test('G1 — conversions en milli-cases, exactes et réversibles', () => {
  assert.equal(MILLI_PAR_CASE, 1000);
  assert.equal(milliDepuisCase(3), 3000);
  assert.equal(milliDepuisCase(18), 18000);
  // La case d'une position est celle qui la contient : [3000, 3999] → 3.
  assert.equal(caseDepuisMilli(3000), 3);
  assert.equal(caseDepuisMilli(3999), 3);
  assert.equal(caseDepuisMilli(4000), 4);
  for (let n = PREMIERE_RANGEE; n <= DERNIERE_RANGEE; n++) {
    assert.equal(caseDepuisMilli(milliDepuisCase(n)), n, `aller-retour cassé en ${n}`);
  }

  // enEntier refuse ce qui n'est pas entier plutôt que d'arrondir en silence.
  assert.equal(enEntier(1.5, 1000, 'essai'), 1500);
  assert.throws(() => enEntier(1.0005, 1000, 'essai'), /n'est pas entier/);
});

test('G2 — distances au carré, en milli-case², sans racine', () => {
  // (3,5) → (4,4) : dr = 1000, dc = 1000 → 1000² + 1000² = 2 000 000.
  assert.equal(distanceCarree(3000, 5, 4000, 4), 2_000_000);
  // (3,5) → (4,6) : strictement la même distance, l'ordre total tranche ailleurs.
  assert.equal(distanceCarree(3000, 5, 4000, 6), 2_000_000);
  // Même colonne, trois cases d'écart : 3000² = 9 000 000.
  assert.equal(distanceCarree(5000, 5, 8000, 5), 9_000_000);
  // Portée 5,5 → 5500² = 30 250 000 ; portée mini 3,5 → 3500² = 12 250 000.
  assert.equal(5500 * 5500, 30_250_000);
  assert.equal(3500 * 3500, 12_250_000);
  // La distance est symétrique et nulle sur soi-même.
  assert.equal(distanceCarree(4000, 2, 4000, 2), 0);
  assert.equal(distanceCarree(1000, 1, 9000, 9), distanceCarree(9000, 9, 1000, 1));
});

test('G3 — bornes de la grille et des trois bandes contiguës', () => {
  assert.equal(GRILLE.largeur, 9);
  assert.equal(GRILLE.longueur, 18);
  assert.ok(estDansLaGrille(1, 1) && estDansLaGrille(18, 9));
  assert.ok(!estDansLaGrille(0, 1) && !estDansLaGrille(19, 1));
  assert.ok(!estDansLaGrille(1, 0) && !estDansLaGrille(1, 10));
  assert.ok(!estDansLaGrille(1.5, 1), 'une rangée non entière n\'est pas une case');

  // Trois bandes contiguës, aucun terrain neutre : 2 + 8 + 8 = 18 rangées.
  const deploiement = bornesBande('deploiement');
  const defense = bornesBande('defense');
  const batiments = bornesBande('batiments');
  assert.deepEqual([deploiement.premiere, deploiement.derniere], [1, 2]);
  assert.deepEqual([defense.premiere, defense.derniere], [3, 10]);
  assert.deepEqual([batiments.premiere, batiments.derniere], [11, 18]);
  assert.equal(defense.premiere, deploiement.derniere + 1);
  assert.equal(batiments.premiere, defense.derniere + 1);
  assert.equal(batiments.derniere, GRILLE.longueur);
  // 8 rangées × 9 colonnes = 72 cases de bâtiments, base de SITES-DENSITE.
  assert.equal((batiments.derniere - batiments.premiere + 1) * GRILLE.largeur, GRILLE.casesBatiments);

  assert.ok(estDansLaBande(3, 'defense') && estDansLaBande(10, 'defense'));
  assert.ok(!estDansLaBande(2, 'defense') && !estDansLaBande(11, 'defense'));
  assert.throws(() => estDansLaBande(3, 'nulle_part'), /bande inconnue/);
});

test('G4 — une case, une entité bloquante', () => {
  const occupation = creerOccupation();
  assert.equal(occupantDe(occupation, 4, 5), undefined);
  poser(occupation, 4, 5, 7);
  assert.equal(occupantDe(occupation, 4, 5), 7);
  // La clé sépare bien rangée et colonne : (4,5) et (5,4) ne se confondent pas.
  assert.notEqual(cleCase(4, 5), cleCase(5, 4));
  assert.equal(occupantDe(occupation, 5, 4), undefined);
  retirer(occupation, 4, 5);
  assert.equal(occupantDe(occupation, 4, 5), undefined);
});

test('G5 — obstacles : index, châssis concerné, ralentissement', () => {
  const index = indexerObstacles([
    { rangee: 4, colonne: 2, type: 'infanterie' },
    { rangee: 5, colonne: 6, type: 'vehicule' },
    { rangee: 7, colonne: 4, type: 'les_deux' },
  ]);
  assert.equal(typeObstacleSur(index, 4, 2), 'infanterie');
  assert.equal(typeObstacleSur(index, 4, 3), undefined);

  assert.ok(obstacleConcerne('infanterie', 'escouade'));
  assert.ok(!obstacleConcerne('infanterie', 'blinde'));
  assert.ok(obstacleConcerne('vehicule', 'blinde'));
  assert.ok(!obstacleConcerne('vehicule', 'escouade'));
  assert.ok(obstacleConcerne('les_deux', 'escouade') && obstacleConcerne('les_deux', 'blinde'));
  // L'aviation ignore le terrain, quel que soit le type de l'obstacle.
  for (const type of OBSTACLES.types) {
    assert.ok(!obstacleConcerne(type, 'aeronef'), `l'aviation subit l'obstacle ${type}`);
  }
  assert.throws(() => obstacleConcerne('marecage', 'escouade'), /type d'obstacle inconnu/);

  // 2,5 en millièmes = 2500 ; 50 → 20, 120 → 48, 300 → 120.
  assert.equal(DIVISEUR_OBSTACLE_MILLI, 2500);
  assert.equal(vitesseSousObstacle(50), 20);
  assert.equal(vitesseSousObstacle(120), 48);
  assert.equal(vitesseSousObstacle(300), 120);
  // 30 / 2,5 = 12 est entier, 31 / 2,5 = 12,4 ne l'est pas : le module refuse.
  assert.throws(() => vitesseSousObstacle(31), /ne donne pas un entier/);
});

test('G6 — au-delà de la dernière rangée, on sort du combat', () => {
  // La rangée 18 va de 18000 à 18999 ; on en sort à 19000.
  assert.ok(!estSortiParLeHaut(18000));
  assert.ok(!estSortiParLeHaut(18999));
  assert.ok(estSortiParLeHaut(19000));
  assert.ok(estSortiParLeHaut(19500));
});

test('T16 — cohérence arithmétique de tout le calibrage', () => {
  // Un tick vaut 0,1 s : 90 s → 900 ticks, 5 s → 50 ticks.
  assert.equal(TICKS_MAX_COMBAT, 900);
  assert.equal(TICKS_PAR_VAGUE, 50);
  assert.equal(GRILLE.vaguesParRaid, 4);

  for (const [id, u] of Object.entries(UNITES)) {
    // LOT 4A — la vitesse EST le milli-case par tick, plus de conversion :
    // 60 · 90 · 120 · 240, quatre valeurs, toutes entières par construction.
    const vitesseMilli = u.vitesse;
    assert.ok(Number.isInteger(vitesseMilli), `${id} : vitesse ${u.vitesse} non entière`);
    // La même vitesse divisée par 2,5 doit rester entière : 60 → 24, 90 → 36,
    // 120 → 48, 240 → 96. On le vérifie en entiers : (v × 1000) % 2500 === 0.
    assert.equal(
      (vitesseMilli * 1000) % 2500, 0,
      `${id} : ${vitesseMilli} / ${OBSTACLES.diviseurVitesse} non entier`,
    );
    assert.equal(vitesseSousObstacle(vitesseMilli), (vitesseMilli * 1000) / 2500);

    // Portées et PV passent aussi en entiers.
    assert.ok(Number.isInteger(u.portee * 1000), `${id} : portée non entière en milli-cases`);
    assert.ok(Number.isInteger(u.porteeMini * 1000), `${id} : portée mini non entière`);
    assert.ok(Number.isInteger(u.pv), `${id} : PV non entiers`);
    assert.ok(Number.isInteger(u.masse), `${id} : masse non entière`);
    assert.ok(Number.isInteger(u.reserve), `${id} : réserve non entière`);
    assert.ok(Number.isInteger(u.degatsParcours), `${id} : dégâts de parcours non entiers`);
    assert.ok(Number.isInteger(u.reparation), `${id} : réparation non entière`);

    // ⚠ SEUIL RÉÉCRIT AU LOT 4A. Le lot 2A exigeait des facteurs de matrice
    // multiples de 100 en millièmes ; le lot 2B a ramené le pas à la dizaine
    // pour la Herse à 0,03. La matrice ayant disparu, l'invariant n'a plus
    // d'objet : ce qui le remplace est plus dur, pas plus lâche — TOUTE valeur
    // de dégâts est un entier de PV, sans échelle ni arrondi.
    for (const colonne of COLONNES_DEGATS) {
      const valeur = u.degats[colonne];
      assert.ok(Number.isInteger(valeur), `${id}.${colonne} : ${valeur} n'est pas entier`);
      assert.ok(valeur >= 0, `${id}.${colonne} : ${valeur} est négatif`);
    }
  }

  for (const [id, d] of Object.entries(DEFENSES)) {
    assert.ok(Number.isInteger(d.pv), `${id} : PV non entiers`);
    assert.ok(Number.isInteger(d.portee * 1000), `${id} : portée non entière`);
    assert.ok(Number.isInteger(d.porteeMini * 1000), `${id} : portée mini non entière`);
    for (const table of ['degats', 'degatsFranchissement']) {
      if (d[table] === null) continue;
      for (const colonne of COLONNES_DEGATS) {
        const valeur = d[table][colonne];
        assert.ok(Number.isInteger(valeur), `${id}.${table}.${colonne} : ${valeur} non entier`);
        assert.ok(valeur >= 0, `${id}.${table}.${colonne} : ${valeur} est négatif`);
      }
    }
    // Une défense tire OU saigne, jamais les deux : la table de franchissement
    // est en milli-PV, celle de tir en PV, et les confondre serait un facteur
    // 1000 d'écart silencieux.
    assert.ok(d.degats === null || d.degatsFranchissement === null,
      `${id} : une défense ne peut pas porter les deux tables à la fois`);
  }

  // Le franchissement des barrières se lit en MILLI-PV par tick et par colonne,
  // seule table du calibrage qui ne soit pas en PV entiers : la Ronce vaut
  // 2,5 PV/tick contre l'infanterie, qui ne s'écrit pas en entier autrement.
  // Report exact des arbitrages du lot 2B — ÷8 sur la Ronce, 15 PV/tick sur la
  // Herse et 0,03 contre l'infanterie — dans la forme absolue du lot 4A :
  //   Ronce   2,5 × {1 · 0,1 · 0}    = {2500 · 250 · 0}
  //   Herse   15  × {0,03 · 1 · 0}   = {450 · 15000 · 0}
  assert.deepEqual(DEFENSES.ronce.degatsFranchissement,
    { infanterie: 2500, vehicule: 250, structureOuAviation: 0 });
  assert.deepEqual(DEFENSES.herse.degatsFranchissement,
    { infanterie: 450, vehicule: 15_000, structureOuAviation: 0 });

  // Les points de recherche doublent par niveau de cible. Le plafond de niveau
  // est 50, donc l'exposant maximal est 49 : 2^49 = 562 949 953 421 312, sous
  // Number.MAX_SAFE_INTEGER = 9 007 199 254 740 991. C'est asserté, pas supposé.
  assert.equal(GEOGRAPHIE.niveauPlafond, 50);
  assert.equal(POINTS_RECHERCHE.multiplicateurParNiveau, 2);
  const plafond = POINTS_RECHERCHE.multiplicateurParNiveau ** (GEOGRAPHIE.niveauPlafond - 1);
  assert.equal(plafond, 562_949_953_421_312);
  assert.ok(Number.isSafeInteger(plafond), '2^49 doit rester un entier sûr');
  assert.ok(plafond < Number.MAX_SAFE_INTEGER);

  // Et le moteur assied les mêmes invariants à son chargement.
  assert.equal(verifierArithmetique(), true);
});
