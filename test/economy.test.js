// Tests 5 à 10 du brief : courbes, coût croisé, plancher, adjacence.
// ⚠ Le test 9 (« saturation des colis ») a été RETIRÉ le 26/08 avec les colis
// eux-mêmes. Il ne reste pas de trou dans la numérotation du brief : le brief
// est un document daté, pas un contrat.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PARAMS } from '../src/data/params.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import {
  ratioCout,
  ratioProduction,
  coutRelatif,
  productionRelative,
  facteurTempsRetourMoyen,
  coutNiveau,
  bonusAdjacenceRelatif,
  poidsAdjacence,
  debitMilliParHeure,
  tickEconomie,
} from '../src/sim/economy.js';

// Valeurs de contrôle du classeur chantier-economie.xlsx, onglet Courbes,
// reprises dans le brief (le classeur lui-même n'est pas dans le dépôt).
const CONTROLE = {
  coutRelatifNiveau10: 341.0,
  coutRelatifNiveau15: 5744.8,
  facteurTempsRetour: 1.543,
  toleranceFacteur: 0.005,
};

/** Écart relatif entre une valeur obtenue et une valeur attendue. */
function ecartRelatif(obtenu, attendu) {
  return Math.abs(obtenu - attendu) / Math.abs(attendu);
}

test('test 5 — C(n) sur 25 niveaux correspond au classeur à 0,1 % près', () => {
  const c10 = coutRelatif(10, PARAMS);
  const c15 = coutRelatif(15, PARAMS);
  assert.ok(
    ecartRelatif(c10, CONTROLE.coutRelatifNiveau10) <= 0.001,
    `C(10) = ${c10}, attendu ${CONTROLE.coutRelatifNiveau10} à 0,1 % près`,
  );
  assert.ok(
    ecartRelatif(c15, CONTROLE.coutRelatifNiveau15) <= 0.001,
    `C(15) = ${c15}, attendu ${CONTROLE.coutRelatifNiveau15} à 0,1 % près`,
  );

  // La courbe entière doit être saine sur 25 niveaux : croissance stricte,
  // ratio décroissant vers sa limite RInf sans jamais la franchir.
  for (let n = 1; n < 25; n++) {
    assert.ok(coutRelatif(n + 1, PARAMS) > coutRelatif(n, PARAMS), `C non croissant en ${n}`);
    assert.ok(ratioCout(n + 1, PARAMS) < ratioCout(n, PARAMS), `ratio_C non décroissant en ${n}`);
    assert.ok(ratioCout(n, PARAMS) > PARAMS.courbes.cout.RInf, `ratio_C sous sa limite en ${n}`);
  }
  assert.equal(coutRelatif(1, PARAMS), 1, 'C(1) doit valoir 1');
  assert.equal(ratioCout(1, PARAMS), PARAMS.courbes.cout.R1, 'ratio_C(1) doit valoir R1c');
});

test('test 6 — facteur de temps de retour moyen sur 25 niveaux : 1,543 ± 0,005', () => {
  const facteur = facteurTempsRetourMoyen(PARAMS);
  assert.ok(
    Math.abs(facteur - CONTROLE.facteurTempsRetour) <= CONTROLE.toleranceFacteur,
    `facteur moyen = ${facteur}, attendu ${CONTROLE.facteurTempsRetour} ± ${CONTROLE.toleranceFacteur}`,
  );
  // Chaque niveau individuel doit coûter plus vite qu'il ne rapporte,
  // sinon le facteur moyen ne mesure rien.
  for (let n = 1; n <= 25; n++) {
    assert.ok(
      ratioCout(n, PARAMS) / ratioProduction(n, PARAMS) > 1,
      `au niveau ${n}, le coût ne croît pas plus vite que la production`,
    );
  }
});

test('test 7 — verrou croisé au niveau 4 : Foreuse 59/131, Décapeuse 259/74', () => {
  const foreuse = coutNiveau(PARAMS.batiments.foreuse, 4, PARAMS);
  assert.deepEqual(foreuse, { quartz: 59, scorie: 131 }, 'coût Foreuse niveau 4');

  const decapeuse = coutNiveau(PARAMS.batiments.decapeuse, 4, PARAMS);
  assert.deepEqual(decapeuse, { quartz: 259, scorie: 74 }, 'coût Décapeuse niveau 4');

  // Le verrou est bien croisé : le producteur de quartz coûte surtout de la
  // scorie, le producteur de scorie surtout du quartz.
  assert.ok(foreuse.scorie > foreuse.quartz, 'la Foreuse devrait coûter surtout de la scorie');
  assert.ok(decapeuse.quartz > decapeuse.scorie, 'la Décapeuse devrait coûter surtout du quartz');
});

test('test 8 — plancher d’amorçage : scorie nulle aux niveaux 1–3 pour TOUS les ρ, positive au niveau 4', () => {
  for (const [classe, rho] of Object.entries(PARAMS.rho)) {
    const batiment = { rho, echelleCout: 30 };
    for (let niveau = 1; niveau <= 3; niveau++) {
      const cout = coutNiveau(batiment, niveau, PARAMS);
      assert.equal(cout.scorie, 0, `${classe} (ρ=${rho}) niveau ${niveau} : scorie non nulle`);
      assert.ok(cout.quartz > 0, `${classe} (ρ=${rho}) niveau ${niveau} : quartz nul`);
    }
    const cout4 = coutNiveau(batiment, 4, PARAMS);
    assert.ok(cout4.scorie > 0, `${classe} (ρ=${rho}) niveau 4 : la scorie devrait être positive`);
    assert.ok(cout4.quartz > 0, `${classe} (ρ=${rho}) niveau 4 : quartz nul`);
  }
});

/** Montage minimal pour l'économie par tick : un seul bâtiment, stocks vides. */
function etatUnBatiment(type, niveau, voisins) {
  return {
    ressources: { quartzMilli: 0, scorieMilli: 0 },
    batiments: [
      {
        type,
        niveau,
        voisinsQualifiants: voisins,
        residuFlux: 0,
      },
    ],
  };
}

test('test 10 — adjacence constante : même bonus au niveau 1 et au niveau 12, poids 50 % puis ≈ 11 %', () => {
  // Au niveau du débit : le supplément apporté par 2 voisins est identique
  // au niveau 1 et au niveau 12. C'est l'arrondi SÉPARÉ du bonus qui le
  // garantit — le replier dans le même Math.round que la production le ferait
  // dériver d'une milli-unité par niveau.
  const bonusDebitNiveau1 =
    debitMilliParHeure({ type: 'foreuse', niveau: 1, voisinsQualifiants: 2 }, PARAMS) -
    debitMilliParHeure({ type: 'foreuse', niveau: 1, voisinsQualifiants: 0 }, PARAMS);
  const bonusDebitNiveau12 =
    debitMilliParHeure({ type: 'foreuse', niveau: 12, voisinsQualifiants: 2 }, PARAMS) -
    debitMilliParHeure({ type: 'foreuse', niveau: 12, voisinsQualifiants: 0 }, PARAMS);
  assert.equal(bonusDebitNiveau1, bonusDebitNiveau12, 'le bonus d’adjacence dépend du niveau');
  assert.ok(bonusDebitNiveau1 > 0, 'bonus d’adjacence nul : le montage ne teste rien');

  // Au niveau de la courbe : bonus relatif constant, plafonné à 2 voisins.
  assert.equal(bonusAdjacenceRelatif(2, PARAMS), 1.0, '2 voisins × 0,5 × P(1) devrait faire 1,0');
  assert.equal(
    bonusAdjacenceRelatif(5, PARAMS),
    bonusAdjacenceRelatif(2, PARAMS),
    'le plafond de 2 voisins ne s’applique pas',
  );

  // Poids relatif : 50 % au niveau 1, ≈ 11 % au niveau 12.
  const poids1 = poidsAdjacence(1, 2, PARAMS);
  const poids12 = poidsAdjacence(12, 2, PARAMS);
  assert.equal(poids1, 0.5, `poids au niveau 1 = ${poids1}, attendu 0,5 exactement`);
  assert.ok(
    Math.abs(poids12 - 0.111) < 0.005,
    `poids au niveau 12 = ${poids12}, attendu ≈ 0,11`,
  );
  assert.ok(poids12 < poids1, 'le poids de l’adjacence devrait décroître avec le niveau');
});

test('débit horaire — la production suit P(n) et l’erreur d’arrondi par tick est nulle', () => {
  // P(4) ≈ 2,2918 → round(2,2918 × 720 000) = 1 650 094 milli/h niveau 4.
  const debit = debitMilliParHeure({ type: 'foreuse', niveau: 4, voisinsQualifiants: 0 }, PARAMS);
  assert.equal(
    debit,
    Math.round(productionRelative(4, PARAMS) * PARAMS.fluxContinu.baseMilliParHeureNiveau1),
  );

  // Le montage ne prouve quelque chose QUE si le débit ne tombe pas rond sur
  // un tick : sinon il n'y a pas de résidu à mesurer.
  assert.notEqual(debit % TICKS_PAR_HEURE, 0, 'débit divisible : le test ne mesure aucun résidu');

  // Une heure de ticks produit EXACTEMENT le débit horaire, au milli près,
  // et referme son résidu. C'est tout l'objet du lot.
  const etat = etatUnBatiment('foreuse', 4, 0);
  for (let t = 0; t < TICKS_PAR_HEURE; t++) tickEconomie(etat, PARAMS);
  assert.equal(etat.ressources.quartzMilli, debit, 'une heure de ticks ≠ un débit horaire');
  assert.equal(etat.batiments[0].residuFlux, 0, 'résidu non nul après une heure pleine');

  // Et à chaque instant intermédiaire, pas seulement au bout : le stock vaut
  // la part entière exacte de la production cumulée, le résidu reste borné.
  const partiel = etatUnBatiment('foreuse', 4, 0);
  for (let t = 1; t <= 250; t++) {
    tickEconomie(partiel, PARAMS);
    assert.equal(
      partiel.ressources.quartzMilli,
      Math.floor((t * debit) / TICKS_PAR_HEURE),
      `stock faux au tick ${t}`,
    );
    const r = partiel.batiments[0].residuFlux;
    assert.ok(r >= 0 && r < TICKS_PAR_HEURE, `résidu hors bornes au tick ${t} : ${r}`);
  }

  // Témoin de l'ancien régime : arrondir le débit AU TICK coûtait 0,36 % à ce
  // niveau, en permanence. Seuil calculé sur le montage, pas deviné.
  const ancienParTick = Math.round(debit / TICKS_PAR_HEURE);
  const perte = Math.abs(ancienParTick * TICKS_PAR_HEURE - debit) / debit;
  assert.ok(perte > 0.003, `montage sans intérêt : l’ancien arrondi ne coûtait que ${perte}`);
});

test('saturation — le stock s’arrête à la capacité, le résidu continue d’avancer', () => {
  const etat = etatUnBatiment('foreuse', 4, 0);
  etat.ressources.quartzMilli = PARAMS.stockage.capaciteMilli - 100;
  for (let t = 0; t < 5000; t++) {
    tickEconomie(etat, PARAMS);
    assert.ok(
      etat.ressources.quartzMilli <= PARAMS.stockage.capaciteMilli,
      `le stock déborde la capacité au tick ${t}`,
    );
  }
  assert.equal(
    etat.ressources.quartzMilli,
    PARAMS.stockage.capaciteMilli,
    'pas saturé à la capacité',
  );
  // Le résidu, lui, n'a pas été gelé par la saturation — c'est ce qui rend le
  // rattrapage analytique exact, et le retirer casserait le test 11.
  const r = etat.batiments[0].residuFlux;
  assert.ok(r >= 0 && r < TICKS_PAR_HEURE, `résidu hors bornes après saturation : ${r}`);
});
