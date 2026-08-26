// Tests 11 et 12 du brief : rattrapage analytique, migration de sauvegarde.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PARAMS } from '../src/data/params.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import {
  SAVE_VERSION,
  creerEtat,
  creerBatiment,
  tickJeu,
  rattraperJeu,
  serialiser,
  charger,
  migrer,
} from '../src/sim/state.js';
import { debitMilliParHeure, DEBIT_MILLI_PAR_HEURE_MAX } from '../src/sim/economy.js';
import { creerRng, entier } from '../src/sim/rng.js';


/**
 * Montage du test 11 : un état volontairement hétérogène —
 * deux types de bâtiments, niveaux et voisins différents, un colis en cours,
 * un colis déjà en attente, un stock déjà entamé et un stock proche de la
 * saturation pour que le plafond de stockage soit réellement traversé.
 */
function etatDeReference() {
  const etat = creerEtat(20260822, PARAMS);
  etat.batiments = [
    creerBatiment('foreuse', 1, 0), // flux faible : ne sature pas en 1 h
    creerBatiment('foreuse', 6, 2), // flux fort, adjacence pleine
    creerBatiment('decapeuse', 4, 1), // produit l'autre ressource
  ];
  etat.batiments[1].colis.progresTicks = 1234; // colis en cours
  etat.batiments[2].colis.enAttente = 1; // un colis déjà prêt
  etat.ressources.quartzMilli = 137_000;
  etat.ressources.scorieMilli = PARAMS.stockage.capaciteMilli - 50_000; // saturera vite
  return etat;
}

test('test 11 — rattrapage analytique identique à la simulation tick par tick (1 h, 24 h, 72 h)', () => {
  // Le montage doit contenir les deux régimes, sinon le test ne prouve rien :
  // au moins un stock qui sature pendant la fenêtre, au moins un qui non.
  const quartzParHeure =
    debitMilliParHeure(etatDeReference().batiments[0], PARAMS) +
    debitMilliParHeure(etatDeReference().batiments[1], PARAMS);
  assert.ok(
    137_000 + quartzParHeure < PARAMS.stockage.capaciteMilli,
    'montage cassé : le quartz sature dès la première heure',
  );

  for (const heures of [1, 24, 72]) {
    const nbTicks = heures * TICKS_PAR_HEURE;

    const simule = etatDeReference();
    for (let t = 0; t < nbTicks; t++) tickJeu(simule, PARAMS);

    const analytique = etatDeReference();
    rattraperJeu(analytique, nbTicks, PARAMS);

    assert.equal(
      JSON.stringify(analytique),
      JSON.stringify(simule),
      `divergence analytique / simulation pour Δt = ${heures} h`,
    );
  }

  // La scorie doit avoir saturé pendant la fenêtre de 24 h : la comparaison
  // ci-dessus a donc bien traversé le plafond de stockage.
  const temoin = etatDeReference();
  rattraperJeu(temoin, 24 * TICKS_PAR_HEURE, PARAMS);
  assert.equal(temoin.ressources.scorieMilli, PARAMS.stockage.capaciteMilli);
  // Et les colis ont plafonné à 2 : le rattrapage a traversé l'arrêt de chaîne.
  for (const b of temoin.batiments) {
    assert.equal(b.colis.enAttente, PARAMS.colis.maxEnAttente);
  }
});

test('test 11 bis — le rattrapage traverse correctement un colis en cours de fabrication', () => {
  // Fenêtre courte et non ronde : 7 min 33 s = 4530 ticks, avec un progrès
  // initial de 1234 ticks → un seul colis produit, progrès résiduel précis.
  const nbTicks = 4530;
  const simule = etatDeReference();
  for (let t = 0; t < nbTicks; t++) tickJeu(simule, PARAMS);
  const analytique = etatDeReference();
  rattraperJeu(analytique, nbTicks, PARAMS);
  assert.equal(JSON.stringify(analytique), JSON.stringify(simule));

  const b = simule.batiments[1];
  assert.equal(b.colis.enAttente, 1, 'le colis en cours aurait dû aboutir');
  assert.equal(b.colis.progresTicks, 1234 + 4530 - 3000, 'progrès résiduel faux');
});

test('rattrapage — une très longue absence reste exacte au bit près (contrôle BigInt)', () => {
  // Ce que le test 11 ne peut PAS atteindre : une fenêtre qu'on ne peut pas
  // simuler tick par tick. Le rattrapage y décompose nbTicks en heures pleines
  // + reste ; la seule référence disponible est l'arithmétique exacte, donc
  // BigInt. Cinq cents tirages déterministes, graine fixe.
  const rng = creerRng(20260826);
  const TPH = TICKS_PAR_HEURE;
  let plusGrandIntermediaire = 0;

  for (let i = 0; i < 500; i++) {
    // Débits jusqu'au millième du seuil exact, absences jusqu'à dix ans à 10 Hz.
    const debit = entier(rng, 1, Math.floor(DEBIT_MILLI_PAR_HEURE_MAX / 1000));
    const residuDepart = entier(rng, 0, TPH - 1);
    const nbTicks = entier(rng, 0, 3_200_000_000);

    // Référence : arithmétique exacte, sans décomposition.
    const total = BigInt(residuDepart) + BigInt(nbTicks) * BigInt(debit);
    const gainAttendu = total / BigInt(TPH);
    const residuAttendu = total % BigInt(TPH);

    // Ce que fait le moteur.
    const heuresPleines = Math.floor(nbTicks / TPH);
    const ticksRestants = nbTicks - heuresPleines * TPH;
    const cumulPartiel = residuDepart + ticksRestants * debit;
    plusGrandIntermediaire = Math.max(plusGrandIntermediaire, cumulPartiel);
    const report = Math.floor(cumulPartiel / TPH);
    const residuObtenu = cumulPartiel - report * TPH;
    const gainObtenu = BigInt(heuresPleines) * BigInt(debit) + BigInt(report);

    assert.equal(gainObtenu, gainAttendu, `gain faux au tirage ${i}`);
    assert.equal(BigInt(residuObtenu), residuAttendu, `résidu faux au tirage ${i}`);
  }

  // Le seuil DEBIT_MILLI_PAR_HEURE_MAX doit tenir sa promesse : aucun entier
  // intermédiaire du rattrapage n'a quitté les entiers sûrs.
  assert.ok(
    plusGrandIntermediaire <= Number.MAX_SAFE_INTEGER,
    `intermédiaire ${plusGrandIntermediaire} au-dessus de l'entier sûr`,
  );
  // Et le montage doit avoir réellement chargé la mule, sinon il ne prouve rien.
  assert.ok(
    plusGrandIntermediaire > 1e12,
    `montage trop léger : plus grand intermédiaire ${plusGrandIntermediaire}`,
  );
});

test('sérialisation — sauvegarder en pleine partie, recharger, poursuivre : trajectoires identiques', () => {
  const continu = creerEtat(555, PARAMS);
  for (let t = 0; t < 5000; t++) tickJeu(continu, PARAMS);

  const interrompu = creerEtat(555, PARAMS);
  for (let t = 0; t < 2000; t++) tickJeu(interrompu, PARAMS);
  const recharge = charger(serialiser(interrompu), PARAMS);
  for (let t = 2000; t < 5000; t++) tickJeu(recharge, PARAMS);

  assert.equal(serialiser(recharge), serialiser(continu));
});

test('test 12 — une sauvegarde de version N−1 se charge sans perte', () => {
  // Sauvegarde v0 fabriquée à la main : pas de champ version, pas de
  // residuMs dans l'horloge, pas de voisinsQualifiants sur les bâtiments.
  const v0 = {
    graine: 777,
    rng: { s: 123456 },
    horloge: { tempsSimuleMs: 250_000, nbTicks: 2500 },
    ressources: { quartzMilli: 42_000, scorieMilli: 7_000 },
    batiments: [
      { type: 'decapeuse', niveau: 5, colis: { enAttente: 1, progresTicks: 42 } },
    ],
  };

  const etat = charger(JSON.stringify(v0), PARAMS);

  assert.equal(etat.version, SAVE_VERSION, 'version non mise à jour');
  // Aucune perte : tout ce que la v0 contenait est intact.
  assert.equal(etat.graine, 777);
  assert.equal(etat.rng.s, 123456);
  assert.equal(etat.horloge.tempsSimuleMs, 250_000);
  assert.equal(etat.horloge.nbTicks, 2500);
  assert.deepEqual(etat.ressources, { quartzMilli: 42_000, scorieMilli: 7_000 });
  assert.equal(etat.batiments[0].niveau, 5);
  assert.deepEqual(etat.batiments[0].colis, { enAttente: 1, progresTicks: 42 });
  // Les champs apparus en v1 ont reçu leur valeur par défaut.
  assert.equal(etat.horloge.residuMs, 0);
  assert.equal(etat.batiments[0].voisinsQualifiants, 0);
  // Celui apparu en v2 aussi : la chaîne 0 → 1 → 2 a bien été parcourue en
  // entier, pas seulement son premier maillon.
  assert.equal(etat.batiments[0].residuFlux, 0, 'la migration v1 → v2 n’a pas été appliquée');

  // L'état migré est fonctionnel : la boucle tourne dessus sans erreur.
  tickJeu(etat, PARAMS);
  assert.equal(etat.horloge.nbTicks, 2501);
});

test('migration — une sauvegarde plus récente que le jeu est refusée, pas corrompue', () => {
  assert.throws(
    () => migrer({ version: SAVE_VERSION + 1 }),
    /plus récente/,
    'charger une sauvegarde du futur devrait échouer explicitement',
  );
});
