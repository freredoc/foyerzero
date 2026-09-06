// La réparation de l'armée — une réserve de temps par châssis.
//
// ⚠ CE FICHIER A CHANGÉ DE MODÈLE LE 01/09/2026, en même temps que le module
// qu'il mesure. Ce qui est parti avec le chronomètre : la somme contre le
// maximum, la réparation « d'un bloc », l'abandon par le raid, la sauvegarde
// d'un chantier en cours. Ce qui reste, mot pour mot : les deux courbes, le
// coût en scorie, et le refus quand le bâtiment réparateur manque.
//
// La phrase d'Ethan du 29/08 survit, et c'est le test « parallélisme » qui la
// porte maintenant : « je répare complètement mes véhicules, j'ai 20 minutes
// d'infanterie gratuites ». Sous le modèle à réserve elle est vraie pour une
// raison plus simple — le temps d'infanterie n'a jamais été dépensé.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  diviseurDuBatiment, secondesPleines, batimentDuChassis, reservoirsDeLArmee,
  devisDeLaReparation, problemesDeToutReparer, coutDeLaReparation,
  crediterLesReserves, plafondDeLaReserve, reservesVides, problemesDesReserves,
  problemesDeLaReparationDUnePiece, reparerUnePiece, toutReparer,
  CHASSIS_REPARABLES,
  plafondDeLaReserveDesBatiments, secondesPleinesDUnBatiment,
  coutDeLaReparationDUnBatiment, devisDeLaReparationDesBatiments,
  problemesDeLaReparationDUnBatiment, reparerUnBatiment,
  problemesDeToutReparerLesBatiments, toutReparerLesBatiments,
  problemesDeLaReserveDesBatiments,
  complexeDeLaBase, ticksDeRetour, retourDeLaPiece, ramenerLaGarnison,
  pvMaxDeLaPieceDeGarnisonMilli, pvApresRetour, problemesDuRetour,
} from '../src/sim/reparation.js';
import {
  creerEtat, rattraperJeu, tickJeu, serialiser, charger, migrer, SAVE_VERSION,
  poserEffectif, problemesDeLaPoseDEffectif, poser, problemesDeLaPose,
} from '../src/sim/state.js';
import { executerRaid } from '../src/sim/raid.js';
import { UNITES, GRILLE } from '../src/data/combat.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { REPARATION } from '../src/data/sites.js';
import {
  BASE_BATIMENTS, REPARATION_BASE_JOUEUR, RETOUR_DEFENSES, coutDeMontee,
} from '../src/data/base.js';
import { problemesDeDisposition } from '../src/sim/disposition.js';
import {
  subirUnRaid, basesAttaquantes, prochaineMinuteDeRaid, minuteDeLHorloge, TICKS_PAR_MINUTE,
} from '../src/sim/raid-ouvrage.js';
import { facteurMilli } from '../src/sim/combat.js';
import { TICKS_PAR_SECONDE, TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { niveauDeLArmee, niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { poserLaBaseSur } from '../src/sim/deplacement.js';
import { aplatirSauvegarde } from './aplatir-sauvegarde.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * La source d'un module, commentaires ôtés.
 *
 * ⚠ UNE GARDE QUI LIT SA PROPRE PROSE NE GARDE RIEN — le dépôt l'a payé huit
 * fois. Ce paragraphe-ci nomme `quartz` pour dire que le retour ne le nomme
 * pas ; sans ce filtre, il ferait tomber `F-J T9`.
 */
function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/**
 * Une partie avec les trois bâtiments réparateurs posés au niveau voulu, la
 * scorie à volonté et les trois réservoirs pleins.
 *
 * ⚠ LES RÉSERVOIRS SONT REMPLIS COMME LA SCORIE L'ÉTAIT DÉJÀ, et pour la même
 * raison : un test qui mesure le COÛT en scorie ne doit pas buter d'abord sur
 * une réserve vide, sinon il mesure la réserve. Les tests qui veulent une
 * réserve courte la vident eux-mêmes, et le disent.
 */
function partieOutillee(niveauBatiments = 5) {
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  // ⚠ LA DISPOSITION DOIT RESTER LÉGALE, et le premier jet ne l'était pas : les
  // trois bâtiments tombaient sur des champs et dépassaient les emplacements
  // d'un Chantier de niveau 1. Ça ne se voyait que dans le test qui RECHARGE la
  // partie — `verifierEtat` lève au chargement, pas à la pose à la main. Les
  // cases 13,1 à 13,5 sont hors des douze champs de cette base-là, et le
  // Chantier monte pour ouvrir les emplacements.
  baseCourante(etat).disposition[0].niveau = 12;
  let colonne = 1;
  for (const id of ['caserne', 'depotDeVehicules', 'aerodrome']) {
    baseCourante(etat).disposition.push({ id, rangee: 13, colonne, niveau: niveauBatiments });
    baseCourante(etat).economie.residus.push({});
    colonne += 2;
  }
  baseCourante(etat).economie.ressources.scorie = 1_000_000_000;
  crediterLesReserves(etat, plafondDeLaReserve(etat));
  return etat;
}

/** Pose une unité abîmée d'une fraction de ses PV. */
function abimee(etat, id, part, niveau = 1, vague = 1, colonne = 1) {
  const pvMax = UNITES[id].pv * facteurMilli(niveau);
  baseCourante(etat).armee.push({
    id, vague, colonne, niveau, degatsMilli: Math.round(pvMax * part),
  });
}

// ---------------------------------------------------------------------------
// Les courbes — inchangées, et c'est la preuve que rien n'a glissé
// ---------------------------------------------------------------------------

test('courbe — le diviseur du bâtiment, et sa rupture au niveau 12', () => {
  // ⚠ LA RUPTURE EST AU 12, PAS AU 11. Quatre autres systèmes changent de
  // régime au 11 ; celui-ci fait exception, et le relevé le mesure. Un test qui
  // ne regarderait qu'un point ne verrait pas la différence.
  assert.equal(diviseurDuBatiment(1), 1, 'le niveau 1 ne divise rien');
  assert.equal(REPARATION.diviseurBatiment.niveauRupture, 12);

  const avant = diviseurDuBatiment(12) / diviseurDuBatiment(11);
  const apres = diviseurDuBatiment(13) / diviseurDuBatiment(12);
  assert.ok(Math.abs(avant - 1.09) < 1e-9, `pente basse mesurée ${avant}`);
  assert.ok(Math.abs(apres - 1.12) < 1e-9, `pente haute mesurée ${apres}`);

  // Strictement croissant : un meilleur bâtiment répare toujours plus vite.
  for (let n = 2; n <= 50; n += 1) {
    assert.ok(diviseurDuBatiment(n) > diviseurDuBatiment(n - 1), `rupture de croissance au ${n}`);
  }
});

test('courbe — la série Caserne du relevé est restituée', () => {
  // ⚠ LE MONTAGE EST CELUI DU RELEVÉ : unité figée au niveau 30, Caserne
  // parcourue. Le relevé annonce 0,02 % d'écart sur ces sept points ; on tolère
  // 1 % parce que la base par unité de Foyer Zéro n'est pas exactement celle de
  // TA. Ce qui est tenu, c'est la FORME de la courbe, pas la seconde près.
  const attendus = { 1: 25_483, 5: 18_053, 10: 11_732, 20: 3_988, 30: 1_284, 40: 413, 50: 133 };
  const base = UNITES.meute.reparation;
  assert.equal(base, 441, 'la base des Fusiliers a bougé');

  for (const [caserne, secondes] of Object.entries(attendus)) {
    const mesure = secondesPleines('meute', 30, Number(caserne));
    const ecart = Math.abs(mesure - secondes) / secondes;
    assert.ok(ecart < 0.01, `Caserne ${caserne} : ${mesure.toFixed(0)} s contre ${secondes} s`);
  }
});

// ---------------------------------------------------------------------------
// T1 — le crédit
// ---------------------------------------------------------------------------

test('RÉSERVE T1 — n ticks créditent n ticks dans CHACUN des trois réservoirs', () => {
  const etat = creerEtat(2026);
  assert.deepEqual(baseCourante(etat).reserveReparation, { escouade: 0, blinde: 0, aeronef: 0 },
    'une base neuve doit partir de zéro');
  // ⚠ MONTAGE FALSIFIABLE : le plafond doit être LOIN, sinon on mesurerait le
  // plafond au lieu du crédit. 12 h font 432 000 ticks, on en crédite 1 000.
  assert.ok(plafondDeLaReserve(etat) > 1000, 'montage : le plafond mord déjà');

  crediterLesReserves(etat, 1000);
  for (const chassis of CHASSIS_REPARABLES) {
    assert.equal(baseCourante(etat).reserveReparation[chassis], 1000, `le réservoir ${chassis} n'a pas suivi`);
  }
  // Le taux est 1 pour 1, donc il s'ajoute : mille de plus font deux mille.
  crediterLesReserves(etat, 1000);
  for (const chassis of CHASSIS_REPARABLES) {
    assert.equal(baseCourante(etat).reserveReparation[chassis], 2000, `le réservoir ${chassis} n'a pas suivi`);
  }
  // ⚠ ET LE CRÉDIT PASSE PAR LE TICK DE JEU, pas seulement par la fonction. Un
  // crédit que `tickJeu` n'appellerait pas ne créditerait jamais rien en partie.
  const enJeu = creerEtat(2026);
  for (let i = 0; i < 50; i += 1) tickJeu(enJeu);
  assert.equal(baseCourante(enJeu).reserveReparation.escouade, 50, 'tickJeu ne crédite pas la réserve');
});

// ---------------------------------------------------------------------------
// T2 — le plafond, et le piège des dixièmes
// ---------------------------------------------------------------------------

test('RÉSERVE T2 — plafond 12 h, plus 1 h par niveau d\'armée, dixièmes compris', () => {
  const etat = partieOutillee();
  // Armée vide : douze heures PILE, et pas une seconde de plus.
  baseCourante(etat).armee = [];
  assert.equal(niveauDeLArmee(baseCourante(etat).armee), null, 'montage : l\'armée doit être vide');
  assert.equal(plafondDeLaReserve(etat), REPARATION.plafondHeures * TICKS_PAR_HEURE);
  assert.equal(plafondDeLaReserve(etat), 12 * 3600 * 10, 'douze heures, en ticks');

  // ⚠⚠ LE PIÈGE DES DIXIÈMES. `niveauDeLArmee` rend 100 pour une armée de
  // niveau 10, pas 10 : sans la division le plafond serait de 112 h au lieu de
  // 22 h, soit DIX FOIS le supplément. Le montage prend un niveau entier pour
  // que l'attendu soit calculable à la main.
  baseCourante(etat).armee = [];
  abimee(etat, 'meute', 0, 10, 1, 1);
  abimee(etat, 'meute', 0, 10, 1, 2);
  assert.equal(niveauDeLArmee(baseCourante(etat).armee), 100, 'montage : dixièmes attendus');
  assert.equal(plafondDeLaReserve(etat), (12 + 10) * TICKS_PAR_HEURE,
    'le plafond ne suit pas le niveau d\'armée, ou il confond niveaux et dixièmes');
  assert.ok(plafondDeLaReserve(etat) < (12 + 100) * TICKS_PAR_HEURE,
    'le plafond est dix fois trop grand — les dixièmes sont pris pour des niveaux');

  // ⚠ ET UN DEMI-NIVEAU COMPTE POUR UN DEMI. Deux pièces, niveaux 1 et 2 :
  // moyenne 1,5, donc 13 h 30. C'est ce qu'un arrondi intermédiaire perdrait.
  baseCourante(etat).armee = [];
  abimee(etat, 'meute', 0, 1, 1, 1);
  abimee(etat, 'meute', 0, 2, 1, 2);
  assert.equal(niveauDeLArmee(baseCourante(etat).armee), 15, 'montage : moyenne 1,5 attendue');
  assert.equal(plafondDeLaReserve(etat), Math.floor(13.5 * TICKS_PAR_HEURE));

  // Le crédit s'arrête au plafond, il ne le franchit pas.
  baseCourante(etat).reserveReparation = reservesVides();
  crediterLesReserves(etat, 10 ** 9);
  assert.equal(baseCourante(etat).reserveReparation.escouade, plafondDeLaReserve(etat));
});

// ---------------------------------------------------------------------------
// T3 — l'équivalence des deux chemins
// ---------------------------------------------------------------------------

test('RÉSERVE T3 — tickJeu × n rend le même état que rattraperJeu(n)', () => {
  // ⚠ SUR L'ÉTAT ENTIER, pas seulement sur la réserve : c'est la garde qui
  // attrape un crédit en secondes flottantes, dont l'accumulation d'arrondis ne
  // se verrait sur aucun autre champ.
  const N = 997; // premier, pour qu'aucune division ne tombe ronde
  const etats = [];
  for (const parBoucle of [true, false]) {
    const etat = partieOutillee();
    baseCourante(etat).reserveReparation = reservesVides();
    if (parBoucle) for (let i = 0; i < N; i += 1) tickJeu(etat);
    else rattraperJeu(etat, N);
    etats.push(etat);
  }
  assert.deepEqual(baseCourante(etats[0]).reserveReparation, baseCourante(etats[1]).reserveReparation,
    'boucle et rattrapage divergent sur la réserve');
  assert.deepEqual(etats[0], etats[1], 'boucle et rattrapage divergent sur l\'état');

  // ⚠ MONTAGE FALSIFIABLE : la réserve doit avoir réellement bougé, et rester
  // SOUS le plafond — sinon les deux chemins se retrouveraient au plafond et un
  // crédit faux passerait inaperçu.
  assert.equal(baseCourante(etats[0]).reserveReparation.escouade, N, 'le crédit n\'est pas de 1 par tick');
  assert.ok(N < plafondDeLaReserve(etats[0]), 'montage sans mordant : le plafond a écrasé les deux');
});

// ---------------------------------------------------------------------------
// T4 — le parallélisme
// ---------------------------------------------------------------------------

test('RÉSERVE T4 — vider un réservoir ne touche pas les deux autres', () => {
  // ⚠ C'EST LA PHRASE D'ETHAN DU 29/08, SOUS SA FORME NOUVELLE : « je répare
  // complètement mes véhicules, j'ai 20 minutes d'infanterie gratuites ». Le
  // temps d'infanterie n'est pas rendu gratuit : il n'a jamais été dépensé.
  const etat = partieOutillee();
  abimee(etat, 'meute', 0.6, 1, 1, 1);      // escouade
  abimee(etat, 'ratisseur', 1, 1, 2, 1);    // blinde
  abimee(etat, 'enclume', 1, 1, 3, 1);      // aeronef
  crediterLesReserves(etat, plafondDeLaReserve(etat));

  const avant = { ...baseCourante(etat).reserveReparation };
  // Falsifiable : les trois doivent partir du MÊME niveau, sinon « les deux
  // autres n'ont pas bougé » ne voudrait rien dire.
  assert.equal(new Set(Object.values(avant)).size, 1, 'montage : les trois doivent être égaux');

  const paye = reparerUnePiece(etat, 1); // le blindé
  assert.equal(paye.chassis, 'blinde');
  assert.ok(paye.ticks > 0, 'montage sans mordant : la réparation est gratuite en temps');

  assert.equal(baseCourante(etat).reserveReparation.blinde, avant.blinde - paye.ticks,
    'le réservoir des blindés n\'a pas été débité du bon montant');
  assert.equal(baseCourante(etat).reserveReparation.escouade, avant.escouade,
    'réparer un blindé a entamé la réserve d\'infanterie — les trois sont fusionnés');
  assert.equal(baseCourante(etat).reserveReparation.aeronef, avant.aeronef,
    'réparer un blindé a entamé la réserve d\'aviation — les trois sont fusionnés');

  // Et l'infanterie reste payable, justement parce qu'elle n'a rien dépensé.
  assert.deepEqual(problemesDeLaReparationDUnePiece(etat, 0), []);
});

// ---------------------------------------------------------------------------
// T5 — réparer débite et rend les PV dans le même appel
// ---------------------------------------------------------------------------

test('RÉSERVE T5 — réparer débite le bon châssis ET rend les PV, sans attendre', () => {
  const etat = partieOutillee();
  abimee(etat, 'meute', 0.5, 3, 1, 1);
  const cout = coutDeLaReparation(etat, 0);
  assert.equal(cout.chassis, 'escouade');
  assert.ok(cout.ticks > 0 && cout.scorie > 0, 'montage sans mordant : la réparation est gratuite');

  const reserveAvant = baseCourante(etat).reserveReparation.escouade;
  const scorieAvant = baseCourante(etat).economie.ressources.scorie;

  reparerUnePiece(etat, 0);

  // ⚠ TOUT DANS LE MÊME APPEL : aucun tick ne s'écoule entre le débit et le
  // retour des PV. Un modèle qui ne rendrait les PV qu'au tick suivant laisserait
  // `degatsMilli` non nul ici.
  assert.equal(baseCourante(etat).armee[0].degatsMilli, 0, 'les PV ne sont pas rendus dans le même appel');
  assert.equal(baseCourante(etat).reserveReparation.escouade, reserveAvant - cout.ticks);
  assert.equal(baseCourante(etat).economie.ressources.scorie, scorieAvant - Math.ceil(cout.scorie) * 1000);

  // Une pièce intacte n'a plus rien à réparer, et le refus le dit.
  assert.equal(coutDeLaReparation(etat, 0), null);
  assert.equal(problemesDeLaReparationDUnePiece(etat, 0)[0].code, 'rien-a-reparer');
});

// ---------------------------------------------------------------------------
// T6 — réserve insuffisante : le manque est dit, et rien n'est débité
// ---------------------------------------------------------------------------

test('RÉSERVE T6 — réserve trop courte : on dit le manque, et RIEN ne bouge', () => {
  const etat = partieOutillee();
  abimee(etat, 'meute', 1, 5, 1, 1);
  const cout = coutDeLaReparation(etat, 0);
  assert.ok(cout.ticks > 10, 'montage sans mordant : la réparation ne coûte presque rien');

  // Une réserve d'un tick TROP COURTE — la borne exacte, pas une réserve vide :
  // c'est là qu'un `<` écrit `<=` passerait.
  baseCourante(etat).reserveReparation.escouade = cout.ticks - 1;
  const reserveAvant = baseCourante(etat).reserveReparation.escouade;
  const scorieAvant = baseCourante(etat).economie.ressources.scorie;
  const degatsAvant = baseCourante(etat).armee[0].degatsMilli;

  const problemes = problemesDeLaReparationDUnePiece(etat, 0);
  assert.equal(problemes.length, 1);
  assert.equal(problemes[0].code, 'reserve-insuffisante');
  // ⚠ LE MANQUE, PAS UN BOOLÉEN — « il te manque 7 minutes » est une phrase.
  assert.match(problemes[0].message, /manque/);

  // ⚠⚠ RIEN N'EST DÉBITÉ SI LA RÉPARATION N'A PAS LIEU — ni le temps, ni la
  // scorie, ni les PV. Un débit partiel suivi d'un échec est le pire des trois
  // états possibles.
  assert.throws(() => reparerUnePiece(etat, 0), /réparation impossible/);
  assert.equal(baseCourante(etat).reserveReparation.escouade, reserveAvant, 'le temps a été débité malgré le refus');
  assert.equal(baseCourante(etat).economie.ressources.scorie, scorieAvant, 'la scorie a été débitée malgré le refus');
  assert.equal(baseCourante(etat).armee[0].degatsMilli, degatsAvant, 'les PV ont été rendus malgré le refus');

  // ⚠ ET LA BORNE EST BIEN LÀ : un tick de plus, et ça passe. Sans ça le test
  // passerait aussi sur un code qui refuse tout.
  baseCourante(etat).reserveReparation.escouade = cout.ticks;
  assert.deepEqual(problemesDeLaReparationDUnePiece(etat, 0), []);
  assert.doesNotThrow(() => reparerUnePiece(etat, 0));
  assert.equal(baseCourante(etat).reserveReparation.escouade, 0, 'la réparation pleine doit vider la réserve');
});

// ---------------------------------------------------------------------------
// T7 — sans son bâtiment (conservé du modèle précédent)
// ---------------------------------------------------------------------------

test('réservoirs — sans son bâtiment, un châssis ne se répare pas du tout', () => {
  // ⚠ `null` N'EST PAS ZÉRO : sans Aérodrome il n'y a pas de réparation, pas une
  // réparation instantanée ni infiniment lente. Et le refus se DIT.
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  abimee(etat, 'crecelle', 0.5);
  assert.equal(batimentDuChassis(etat, 'aeronef').niveau, null);

  const devis = devisDeLaReparation(etat);
  assert.equal(devis.secondes, 0);
  assert.equal(devis.piecesSansBatiment, 1);
  assert.equal(problemesDeToutReparer(etat)[0].code, 'rien-a-reparer');
  assert.match(problemesDeToutReparer(etat)[0].message, /Aucun bâtiment de réparation/);

  // Une armée intacte, elle, se voit dire autre chose.
  baseCourante(etat).armee = [];
  assert.match(problemesDeToutReparer(etat)[0].message, /intacte/);
});

test('RÉSERVE T7 bis — la pièce sans bâtiment se refuse par son propre code', () => {
  // ⚠ `sans-batiment`, PAS `reserve-insuffisante`. Le joueur qui n'a pas
  // d'Aérodrome doit être envoyé en construire un, pas attendre du temps qui ne
  // servirait à rien. Et la réserve est PLEINE dans ce montage, exprès.
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  crediterLesReserves(etat, 10 ** 9);
  abimee(etat, 'crecelle', 0.5);

  const problemes = problemesDeLaReparationDUnePiece(etat, 0);
  assert.equal(problemes.length, 1);
  assert.equal(problemes[0].code, 'sans-batiment');
  // Le libellé vient de la table des bâtiments, pas d'une chaîne écrite ici.
  assert.match(problemes[0].message, /Aérodrome/);
  assert.throws(() => reparerUnePiece(etat, 0), /Aérodrome/);
  assert.ok(baseCourante(etat).armee[0].degatsMilli > 0, 'la pièce a été réparée sans son bâtiment');
});

// ---------------------------------------------------------------------------
// T8 — le coût en scorie (conservé du modèle précédent)
// ---------------------------------------------------------------------------

test('coût — additif, en scorie, et payé au moment où l\'on répare', () => {
  const etat = partieOutillee();
  abimee(etat, 'meute', 1, 5, 1, 1);
  abimee(etat, 'ratisseur', 1, 5, 2, 1);
  const devis = devisDeLaReparation(etat);

  // Additif : la somme des deux réservoirs, jamais leur maximum.
  const somme = devis.reservoirs.escouade.scorie + devis.reservoirs.blinde.scorie;
  assert.ok(Math.abs(devis.scorie - Math.ceil(somme)) <= 1, `${devis.scorie} contre ${somme}`);
  assert.ok(devis.scorie > 0, 'une unité de niveau 5 n\'est pas gratuite à réparer');

  const avant = baseCourante(etat).economie.ressources.scorie;
  toutReparer(etat);
  assert.ok(Math.abs((avant - baseCourante(etat).economie.ressources.scorie) - devis.scorie * 1000) <= 2000,
    'le débit en scorie ne suit pas le devis');

  // Sans scorie, le refus dit ce qui manque.
  const pauvre = partieOutillee();
  abimee(pauvre, 'meute', 1, 5);
  baseCourante(pauvre).economie.ressources.scorie = 0;
  const refus = problemesDeToutReparer(pauvre);
  assert.equal(refus[0].code, 'scorie-insuffisante');
  assert.match(refus[0].message, /manque/);
});

test('coût — une unité de niveau 1 se répare gratuitement', () => {
  // Elle n'a jamais été montée : l'ancre du coût est la dernière montée, et il
  // n'y en a pas eu. C'est cohérent avec un premier niveau gratuit à poser.
  const etat = partieOutillee();
  abimee(etat, 'meute', 1, 1);
  const devis = devisDeLaReparation(etat);
  assert.equal(devis.scorie, 0);
  assert.ok(devis.secondes > 0, 'gratuite ne veut pas dire instantanée');
});

// ---------------------------------------------------------------------------
// T9 — tout réparer
// ---------------------------------------------------------------------------

test('RÉSERVE T9 — toutReparer répare tout le payable et compte le reste', () => {
  // ⚠⚠ LE MONTAGE MET L'IMPAYABLE EN PREMIER, ET C'EST TOUT L'ENJEU. Une boucle
  // qui s'arrête à la première erreur laisserait les deux suivantes abîmées, et
  // l'ordre du tableau `etat.armee` déciderait de qui rentre au combat.
  const etat = partieOutillee();
  abimee(etat, 'enclume', 1, 1, 3, 1);    // aeronef — sera rendu impayable
  abimee(etat, 'meute', 0.5, 1, 1, 1);    // escouade — payable
  abimee(etat, 'ratisseur', 0.5, 1, 2, 1); // blinde — payable
  crediterLesReserves(etat, plafondDeLaReserve(etat));
  baseCourante(etat).reserveReparation.aeronef = 0;

  // Falsifiable : la première DOIT être impayable, les deux autres payables.
  assert.equal(problemesDeLaReparationDUnePiece(etat, 0)[0].code, 'reserve-insuffisante');
  assert.deepEqual(problemesDeLaReparationDUnePiece(etat, 1), []);
  assert.deepEqual(problemesDeLaReparationDUnePiece(etat, 2), []);

  const bilan = toutReparer(etat);
  assert.equal(bilan.reparees, 2, 'toutReparer s\'est arrêté à la première pièce impayable');
  assert.equal(bilan.impayables, 1);
  assert.ok(baseCourante(etat).armee[0].degatsMilli > 0, 'l\'impayable a été réparée quand même');
  assert.equal(baseCourante(etat).armee[1].degatsMilli, 0, 'la pièce payable n\'a pas été réparée');
  assert.equal(baseCourante(etat).armee[2].degatsMilli, 0, 'la pièce payable n\'a pas été réparée');

  // Et les deux châssis payés l'ont été chacun sur SON réservoir.
  assert.ok(bilan.ticks.escouade > 0 && bilan.ticks.blinde > 0);
  assert.equal(bilan.ticks.aeronef, 0, 'l\'aviation a été débitée sans être réparée');
});

// ---------------------------------------------------------------------------
// T10 — le raid ne touche plus à la réserve
// ---------------------------------------------------------------------------

test('RÉSERVE T10 — un raid ne touche pas aux réserves', () => {
  // ⚠ L'ARBITRAGE DU 29/08 EST CADUC, PAS CONTREDIT. « Les points de réparation
  // bonus disparaissent si on refait un raid » portait sur un modèle où la
  // réparation DURAIT. Il n'y a plus rien en vol à abandonner, et la réserve est
  // un stock, pas un bonus.
  const etat = partieOutillee();
  for (let c = 1; c <= 6; c += 1) {
    baseCourante(etat).armee.push({ id: 'meute', vague: 1, colonne: c, niveau: 1, degatsMilli: 0 });
  }
  crediterLesReserves(etat, plafondDeLaReserve(etat));
  const avant = { ...baseCourante(etat).reserveReparation };
  // Falsifiable : la réserve doit être non nulle, sinon « elle n'a pas bougé »
  // serait vrai de n'importe quel code.
  assert.ok(avant.escouade > 0, 'montage sans mordant : la réserve est vide');

  const camp = baseCourante(etat).satellites.presents.find((s) => s.type === 'camp');
  executerRaid(etat, baseCourante(etat), { rangee: camp.rangee, colonne: camp.colonne });
  assert.ok(baseCourante(etat).armee.some((p) => p.degatsMilli > 0), 'montage sans mordant : personne n\'est abîmé');

  assert.deepEqual(baseCourante(etat).reserveReparation, avant, 'le raid a entamé la réserve de réparation');

  // Et on peut réparer tout de suite après, sans rien relancer.
  const bilan = toutReparer(etat);
  assert.ok(bilan.reparees > 0, 'on ne peut pas réparer au retour du raid');
  assert.ok(baseCourante(etat).reserveReparation.escouade < avant.escouade, 'réparer n\'a rien débité');
});

// ---------------------------------------------------------------------------
// T11 — la sauvegarde
// ---------------------------------------------------------------------------

test('RÉSERVE T11 — la réserve traverse la sauvegarde, le chronomètre a disparu', () => {
  // ⚠ LA GARDE DU NUMÉRO APPARTIENT AU MAILLON LE PLUS RÉCENT, une seule fois.
  // Elle a vécu ici le temps que v16 → v17 soit le dernier ; elle est passée à
  // `raid.test.js` avec le maillon v17 → v18 du lot RAID-0. Ce qui reste à
  // vérifier ici, c'est que NOTRE maillon est toujours dans la chaîne.
  assert.ok(SAVE_VERSION >= 17, 'le maillon v16 → v17 n\'est plus dans la chaîne');

  const etat = partieOutillee();
  abimee(etat, 'meute', 0.8, 4);
  crediterLesReserves(etat, 12_345);
  const attendu = { ...baseCourante(etat).reserveReparation };

  const recharge = charger(serialiser(etat, 4_000_000), 4_000_000);
  assert.deepEqual(baseCourante(recharge).reserveReparation, attendu, 'la réserve ne traverse pas la sauvegarde');
  // ⚠ DES ENTIERS RONDS, et c'est ce que « en ticks » veut dire. Un flottant
  // sérialisé se relirait `12345.000000001` et ferait diverger les deux chemins.
  for (const chassis of CHASSIS_REPARABLES) {
    assert.ok(Number.isInteger(baseCourante(recharge).reserveReparation[chassis]), `${chassis} n'est pas entier`);
  }

  // ⚠ ET LE CHRONOMÈTRE N'EST PLUS LÀ. Une v16 le portait ; la migration le
  // SUPPRIME, ce que seule la v2 → v3 avait fait avant elle.
  const v16 = JSON.parse(serialiser(etat, 4_000_000));
  // ⚠ APLATIE AVANT D'ÊTRE RABAISSÉE — lot BASES-0. Une v16 n'a jamais
  // porté `bases` : lui en donner un ferait tourner la chaîne de migrations
  // sur une forme qui n'a jamais existé.
  aplatirSauvegarde(v16);
  v16.version = 16;
  v16.reparation = { debutTick: 0, ticks: 500, scorie: 3, pieces: [] };
  delete v16.reserveReparation;

  const migre = migrer(structuredClone(v16));
  assert.equal(migre.version, SAVE_VERSION);
  assert.ok(!('reparation' in migre), 'la migration a laissé le chronomètre dans la sauvegarde');
  assert.deepEqual(baseCourante(migre).reserveReparation, { escouade: 0, blinde: 0, aeronef: 0 },
    'la migration a crédité une réserve rétroactive');

  // Et la sauvegarde migrée se charge et se joue.
  const chargee = charger(JSON.stringify(v16), 4_000_000);
  assert.equal(chargee.version, SAVE_VERSION);
  assert.ok(!('reparation' in chargee));
  tickJeu(chargee);
  assert.ok(baseCourante(chargee).reserveReparation.escouade > 0, 'la partie migrée ne crédite plus rien');
});

test('RÉSERVE T11 bis — une réserve illisible fait lever au chargement', () => {
  assert.deepEqual(problemesDesReserves({ escouade: 0, blinde: 0, aeronef: 0 }), []);
  assert.equal(problemesDesReserves(null).length, 1);
  assert.equal(problemesDesReserves([]).length, 1);
  // Un châssis manquant ferait un NaN au premier crédit, sans jamais lever.
  assert.ok(problemesDesReserves({ escouade: 0, blinde: 0 }).length > 0, 'un réservoir absent passerait');
  assert.ok(problemesDesReserves({ escouade: -1, blinde: 0, aeronef: 0 }).length > 0);
  assert.ok(problemesDesReserves({ escouade: 1.5, blinde: 0, aeronef: 0 }).length > 0,
    'une réserve flottante passerait, et ferait diverger les deux chemins');

  // Et `verifierEtat` s'en sert : un état amputé ne se charge pas.
  const ampute = JSON.parse(serialiser(partieOutillee(), 4_000_000));
  delete ampute.bases[0].reserveReparation;
  assert.throws(() => charger(JSON.stringify(ampute), 4_000_000), /réserve de réparation/);
});

// ---------------------------------------------------------------------------
// Le devis, sous le modèle à réserve
// ---------------------------------------------------------------------------

test('RÉSERVE — le devis SOMME les trois châssis, il n\'en prend plus le maximum', () => {
  // ⚠⚠ CE TEST REMPLACE « le temps est la SOMME des pièces, le total leur
  // MAXIMUM ». Le maximum disait la durée d'immobilisation d'un chantier ; il
  // n'y a plus de chantier. Chaque châssis puise dans SON stock, donc ce que
  // l'opération coûte au joueur est la SOMME des trois. Le parallélisme n'a pas
  // disparu : il est passé du temps aux réservoirs, et T4 le mesure.
  const etat = partieOutillee();
  abimee(etat, 'meute', 0.5, 1, 1, 1);
  abimee(etat, 'meute', 0.5, 1, 1, 2);
  abimee(etat, 'ratisseur', 0.5, 1, 2, 1);
  abimee(etat, 'crecelle', 1, 1, 3, 1);

  const r = reservoirsDeLArmee(etat);
  // Un réservoir additionne toujours ses pièces : deux moitiés font un plein.
  assert.ok(Math.abs(r.escouade.secondes - secondesPleines('meute', 1, 5)) < 1e-6,
    'le réservoir n\'additionne pas ses pièces');
  assert.equal(r.escouade.pieces.length, 2);

  // Falsifiable : les trois doivent être DIFFÉRENTS, sinon somme et maximum se
  // confondraient trop facilement.
  assert.equal(new Set([r.escouade.secondes, r.blinde.secondes, r.aeronef.secondes]).size, 3);

  const devis = devisDeLaReparation(etat);
  const sommeDesTrois = r.escouade.secondes + r.blinde.secondes + r.aeronef.secondes;
  assert.ok(Math.abs(devis.secondes - sommeDesTrois) < 1e-6, 'le devis ne somme pas les trois');
  assert.ok(devis.secondes > Math.max(r.escouade.secondes, r.blinde.secondes, r.aeronef.secondes),
    'le devis prend encore le maximum au lieu de la somme');
});

test('RÉSERVE — le coût d\'une pièce est au prorata de ses dégâts', () => {
  const etat = partieOutillee();
  abimee(etat, 'meute', 1, 3, 1, 1);
  abimee(etat, 'meute', 0.5, 3, 1, 2);

  const plein = coutDeLaReparation(etat, 0);
  const moitie = coutDeLaReparation(etat, 1);
  assert.ok(Math.abs(moitie.secondes / plein.secondes - 0.5) < 0.001,
    'une unité à moitié abîmée ne coûte pas la moitié');
  assert.ok(Math.abs(moitie.scorie / plein.scorie - 0.5) < 0.001,
    'le coût en scorie ne suit pas le prorata');
  // Et le plein vaut bien la formule du relevé, sans détour.
  assert.ok(Math.abs(plein.secondes - secondesPleines('meute', 3, 5)) < 1e-6);
});

test('RÉSERVE — le niveau du bâtiment décote le coût, il ne change pas le crédit', () => {
  // ⚠ ARBITRÉ LE 01/09 : le niveau du bâtiment réparateur rend les réparations
  // MOINS CHÈRES, et c'est son SEUL effet. Le taux de crédit est 1 pour 1 pour
  // tout le monde ; l'appliquer aussi au crédit le compterait deux fois.
  const pauvre = partieOutillee(1);
  const riche = partieOutillee(20);
  abimee(pauvre, 'meute', 1, 5);
  abimee(riche, 'meute', 1, 5);
  assert.ok(coutDeLaReparation(riche, 0).ticks < coutDeLaReparation(pauvre, 0).ticks,
    'un meilleur bâtiment ne décote pas la réparation');

  // Le crédit, lui, est le même des deux côtés.
  for (const etat of [pauvre, riche]) baseCourante(etat).reserveReparation = reservesVides();
  crediterLesReserves(pauvre, 1000);
  crediterLesReserves(riche, 1000);
  assert.equal(baseCourante(pauvre).reserveReparation.escouade, baseCourante(riche).reserveReparation.escouade,
    'le niveau du bâtiment est compté deux fois — il crédite ET il décote');
  assert.equal(baseCourante(riche).reserveReparation.escouade, 1000, 'le crédit n\'est pas de 1 pour 1');
});

test('RÉSERVE M1 — le coût le plus cher atteignable dépasse le plafond, et c\'est arbitré', () => {
  // ⚠⚠ MESURE, PAS RÈGLE. L'unité la plus chère au niveau le plus haut, avec son
  // bâtiment réparateur au niveau le PLUS BAS, coûte bien plus que le plafond :
  // elle est alors irréparable tant que le bâtiment ne monte pas. Soumis à Ethan
  // le 01/09, réponse : « si le joueur est stupide pour avoir une enclume 50 avec
  // un aérodrome 1 c'est son problème ». Ce test FIGE le fait pour qu'il ne se
  // redécouvre pas comme un bogue — et il tombera le jour où l'un des deux
  // nombres de `REPARATION` bougera, ce qui est exactement ce qu'on lui demande.
  const etat = partieOutillee(1);
  abimee(etat, 'enclume', 1, 50, 3, 1);
  crediterLesReserves(etat, plafondDeLaReserve(etat));

  const cout = coutDeLaReparation(etat, 0);
  assert.ok(cout.ticks > plafondDeLaReserve(etat),
    'M1 ne mord plus : le plafond a été relevé, ou le barème a changé');
  assert.equal(problemesDeLaReparationDUnePiece(etat, 0)[0].code, 'reserve-insuffisante');

  // ⚠ ET LA SORTIE EXISTE : le même montage avec un Aérodrome de niveau 50 tient
  // dans le plafond. L'unité n'est pas condamnée, c'est le bâtiment qui est en
  // retard — et c'est ce qui rend l'arbitrage d'Ethan tenable.
  const outille = partieOutillee(50);
  abimee(outille, 'enclume', 1, 50, 3, 1);
  crediterLesReserves(outille, plafondDeLaReserve(outille));
  assert.ok(coutDeLaReparation(outille, 0).ticks < plafondDeLaReserve(outille),
    'même un Aérodrome de niveau 50 ne rentre pas dans le plafond — le barème est à revoir');
  assert.ok(!problemesDeLaReparationDUnePiece(outille, 0).some((p) => p.code === 'reserve-insuffisante'),
    'le temps devrait suffire avec un Aérodrome de niveau 50');

  // ⚠⚠ ET UNE SECONDE MESURE, QUI N'EST PAS CELLE QU'ON CHERCHAIT. Ce qui bloque
  // vraiment une Enclume de niveau 50, ce n'est pas le TEMPS mais la SCORIE :
  // `partDuCoutDeMontee` vaut 1, donc la remettre à neuf coûte sa dernière
  // montée, soit plus de dix milliards. Le nombre est déjà marqué « à arbitrer »
  // dans `REPARATION` ; ce test le FIGE pour qu'il ne se découvre pas en jeu.
  baseCourante(outille).economie.ressources.scorie = 0;
  assert.equal(problemesDeLaReparationDUnePiece(outille, 0)[0].code, 'scorie-insuffisante');
  baseCourante(outille).economie.ressources.scorie = Number.MAX_SAFE_INTEGER;
  assert.deepEqual(problemesDeLaReparationDUnePiece(outille, 0), [],
    'avec le temps ET la scorie, la réparation doit passer');
});

// ---------------------------------------------------------------------------
// La QUATRIÈME réserve — les bâtiments, le quartz, et le Chantier qui décote
// ---------------------------------------------------------------------------
//
// ⚠ LOT RÉSERVE-BASE, 05/09/2026. `MODELE-REPARATION-1.md` §4, réécrit ce
// jour-là : « il y en a quatre, pas une ». Les douze tests qui suivent portent
// le côté BÂTIMENTS, et le montage qui les sert est distinct de
// `partieOutillee` — celui-ci pose des BÂTIMENTS abîmés, pas des unités.

/**
 * Une partie dont la base porte les bâtiments demandés, à leur niveau, avec du
 * quartz à volonté et la réserve de base pleine.
 *
 * ⚠⚠ LA DISPOSITION EST CONFRONTÉE À `problemesDeDisposition` AVANT D'ÊTRE
 * RENDUE, et ce n'est pas une politesse : un montage illégal ne se voit qu'au
 * CHARGEMENT — `verifierEtat` lève là-bas, pas à la pose à la main —, si bien
 * qu'un test pourrait mesurer une réparation sur une base que le jeu refuserait.
 * La rangée 13 est hors des douze champs de cette base-là, et les colonnes
 * impaires laissent une case entre deux uniques.
 *
 * ⚠ LE QUARTZ EST À VOLONTÉ COMME LA SCORIE L'EST PLUS HAUT, et pour la même
 * raison : un test qui mesure le TEMPS ne doit pas buter d'abord sur une
 * ressource absente, sinon il mesure la ressource. Ceux qui veulent une caisse
 * vide la vident eux-mêmes, et le disent.
 */
function baseBatie(niveauChantier, batiments = []) {
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  const laBase = baseCourante(etat);
  laBase.disposition[0].niveau = niveauChantier;
  laBase.disposition[0].degatsMilli = 0;
  let colonne = 1;
  for (const { id, niveau } of batiments) {
    laBase.disposition.push({ id, rangee: 13, colonne, niveau, degatsMilli: 0 });
    laBase.economie.residus.push({});
    colonne += 2;
  }
  laBase.economie.ressources.quartz = 1_000_000_000;
  assert.deepEqual(
    problemesDeDisposition(laBase.disposition, laBase.champs).map((p) => p.code), [],
    'le montage ne mesure rien : sa disposition est illégale',
  );
  crediterLesReserves(etat, plafondDeLaReserveDesBatiments(laBase));
  return etat;
}

/** Abîme un bâtiment d'une fraction de ses PV maximaux. */
function abimerLeBatiment(etat, index, part) {
  const pose = baseCourante(etat).disposition[index];
  const pvMax = BASE_BATIMENTS[pose.id].pv * facteurMilli(pose.niveau);
  pose.degatsMilli = Math.round(pvMax * part);
}

test('RÉSERVE-BASE T1 — plafond 12 h + 1 h par niveau de BÂTIMENTS, dixièmes compris', () => {
  // ⚠⚠ LE MONTAGE VISE 20,5 EXPRÈS, ET C'EST TOUTE LA FALSIFICATION. Deux
  // bâtiments à 20 et 21 rendent une moyenne de 205 DIXIÈMES ; lus comme un
  // niveau entier ils donneraient 12 + 205 = 217 h au lieu de 32,5. Une moyenne
  // ronde laisserait les deux lectures se confondre, et le test ne mesurerait
  // plus l'oubli le plus facile de tout le module.
  const etat = baseBatie(20, [{ id: 'caserne', niveau: 21 }]);
  const laBase = baseCourante(etat);
  assert.equal(niveauDesBatiments(laBase.disposition), 205,
    'le montage ne vise pas 20,5 : il ne discrimine plus les deux lectures');

  const attendu = Math.floor(32.5 * TICKS_PAR_HEURE);
  assert.equal(plafondDeLaReserveDesBatiments(laBase), attendu);
  assert.equal(attendu, 1_170_000);
  assert.notEqual(attendu, Math.floor(217 * TICKS_PAR_HEURE));

  // ⚠ ET LES DEUX NOMBRES VIENNENT DE `REPARATION_BASE_JOUEUR`, PAS DE
  // `REPARATION`. Les deux tables portent aujourd'hui 12 et 1 sous des noms
  // voisins ; lire la mauvaise passerait ce test-ci et mentirait le jour où
  // Ethan en changera un seul. On le mesure en tordant celui des bâtiments.
  assert.equal(REPARATION_BASE_JOUEUR.plafondHeures, 12);
  assert.equal(REPARATION_BASE_JOUEUR.plafondHeuresParNiveauBatiments, 1);
  const heures = REPARATION_BASE_JOUEUR.plafondHeures
    + REPARATION_BASE_JOUEUR.plafondHeuresParNiveauBatiments * 20.5;
  assert.equal(Math.floor(heures * TICKS_PAR_HEURE), attendu);

  // ⚠⚠ ET ELLE LÈVE SUR UNE BASE SANS BÂTIMENT — elle ne rend PAS 12 h. C'est
  // la dissymétrie avec `plafondDeLaReserveDeLaBase`, dont le `?? 0` ne doit pas
  // être recopié : une armée vide est l'état normal d'une base neuve, une base
  // sans un seul bâtiment n'existe pas.
  assert.throws(() => plafondDeLaReserveDesBatiments({ disposition: [] }), RangeError);
});

test('RÉSERVE-BASE T2 — les deux réserves sont DISJOINTES, dans les deux sens', () => {
  const etat = baseBatie(12, [{ id: 'caserne', niveau: 12 }]);
  const laBase = baseCourante(etat);
  crediterLesReserves(etat, 10 * TICKS_PAR_HEURE);
  const troisAvant = { ...laBase.reserveReparation };
  const baseAvant = laBase.reserveReparationBatiments;
  assert.ok(baseAvant > 0 && troisAvant.escouade > 0,
    'le montage ne mesure rien : un réservoir est déjà vide');

  // Vider celui des bâtiments ne touche pas les trois autres…
  laBase.reserveReparationBatiments = 0;
  assert.deepEqual({ ...laBase.reserveReparation }, troisAvant);

  // …et vider les trois ne touche pas celui des bâtiments.
  laBase.reserveReparationBatiments = baseAvant;
  for (const chassis of CHASSIS_REPARABLES) laBase.reserveReparation[chassis] = 0;
  assert.equal(laBase.reserveReparationBatiments, baseAvant);

  // ⚠⚠ ET C'EST UN CHAMP À PART, PAS UNE QUATRIÈME CLÉ. Une clé de plus dans
  // `reserveReparation` passerait les deux assertions ci-dessus et ferait
  // pourtant exactement la fuite qu'on refuse : cette ligne-ci la nomme.
  assert.deepEqual(Object.keys(laBase.reserveReparation).sort(), [...CHASSIS_REPARABLES].sort());
  assert.equal(typeof laBase.reserveReparationBatiments, 'number');
});

test('RÉSERVE-BASE T3 — `reservoirsDeLArmee` rend toujours TROIS entrées', () => {
  // La fuite du §4.1, prise sur le fait : si la réserve des bâtiments était une
  // quatrième clé de `reserveReparation`, elle passerait dans `CHASSIS_REPARABLES`
  // — qui se dérive de `BATIMENT_DE_CHASSIS` — ou dans l'écran d'armée, qui
  // boucle dessus. Les deux sont mesurés ici.
  const etat = baseBatie(12, [{ id: 'caserne', niveau: 12 }]);
  crediterLesReserves(etat, 5 * TICKS_PAR_HEURE);
  assert.equal(CHASSIS_REPARABLES.length, 3);
  assert.equal(Object.keys(reservoirsDeLArmee(etat)).length, 3);
  assert.deepEqual(Object.keys(reservoirsDeLArmee(etat)).sort(), [...CHASSIS_REPARABLES].sort());
  assert.equal(Object.keys(reservesVides()).length, 3);
  assert.equal(CHASSIS_REPARABLES.includes('batiments'), false);
  assert.equal(CHASSIS_REPARABLES.includes('base'), false);
});

test('RÉSERVE-BASE T4 — `tickJeu` × n ≡ `rattraperJeu(n)` — et sa condition de RUPTURE '
  + 'est qu\'améliorer soit instantané', () => {
  // ⚠⚠ CE TEST EST LE PLUS IMPORTANT DU LOT, ET IL DOIT TOMBER LE JOUR OÙ UNE
  // AMÉLIORATION PRENDRA DU TEMPS. L'équivalence des deux chemins tient parce
  // que le plafond NE BOUGE PAS pendant un rattrapage ; pour les trois
  // réservoirs d'armée, la raison est qu'on ne compose pas hors ligne. Ici elle
  // est AUTRE : `ameliorer` est instantanée et déclenchée par le joueur — il n'y
  // a pas de file de construction —, donc `niveauDesBatiments` ne peut pas
  // changer pendant que le temps passe tout seul. Une file de construction
  // ferait du plafond une fonction du temps, et un réservoir plafonné tôt puis
  // relevé tard ne rattrape pas ce qu'il a perdu.
  const parTicks = baseBatie(12, [{ id: 'caserne', niveau: 8 }]);
  const dUnBloc = baseBatie(12, [{ id: 'caserne', niveau: 8 }]);
  for (const etat of [parTicks, dUnBloc]) baseCourante(etat).reserveReparationBatiments = 0;

  for (let i = 0; i < 1000; i += 1) tickJeu(parTicks);
  rattraperJeu(dUnBloc, 1000);

  assert.equal(baseCourante(parTicks).reserveReparationBatiments, 1000,
    'le montage ne mesure rien : le plafond a déjà mordu');
  assert.equal(
    baseCourante(dUnBloc).reserveReparationBatiments,
    baseCourante(parTicks).reserveReparationBatiments,
    'les deux chemins d\'avancement ne créditent pas la même réserve de base',
  );
  // Et l'état entier suit, pas seulement le réservoir qu'on regarde.
  assert.equal(serialiser(dUnBloc, 1_000_000), serialiser(parTicks, 1_000_000));
});

test('RÉSERVE-BASE T5 — le plafond mord, et il ne le dépasse jamais', () => {
  // ⚠ LE BRIEF ANNONÇAIT « 100 000 TICKS SUR UNE BASE NEUVE », ET C'EST TROP
  // COURT — mesuré : une base neuve porte un Chantier de niveau 1, donc
  // 12,1 h = 435 600 ticks. À 100 000 le plafond ne mord PAS, et le test aurait
  // été vert sur n'importe quel code. On sature pour de bon, puis on redemande.
  const etat = baseBatie(12, [{ id: 'caserne', niveau: 12 }]);
  const laBase = baseCourante(etat);
  laBase.reserveReparationBatiments = 0;
  const plafond = plafondDeLaReserveDesBatiments(laBase);
  assert.ok(plafond > 100_000, 'le montage retombe dans le piège du brief : 100 000 saturaient');
  assert.ok(plafond < 1_000_000, 'le montage ne mesure rien : un million de ticks ne sature pas');

  rattraperJeu(etat, 1_000_000);
  assert.equal(laBase.reserveReparationBatiments, plafond);

  // Et il n'avance plus d'un tick une fois saturé.
  rattraperJeu(etat, 1_000_000);
  assert.equal(laBase.reserveReparationBatiments, plafond);
});

test('RÉSERVE-BASE T6 — le temps suit la courbe, et c\'est le RAPPORT qui le dit', () => {
  // ⚠⚠ CE SONT LES DEUX DURÉES ET LEUR RAPPORT, PAS LES DEUX DURÉES SEULES. Une
  // pente `penteNiveau` fausse déplacerait les deux du même facteur et les
  // laisserait toutes deux « plausibles » ; c'est le rapport `D(40)/D(20)` qui
  // isole le diviseur du Chantier, et lui seul.
  const hautChantier = secondesPleinesDUnBatiment('caserne', 40, 40);
  const basChantier = secondesPleinesDUnBatiment('caserne', 40, 20);
  assert.equal(BASE_BATIMENTS.caserne.reparationSec, 88,
    'le montage ne mesure plus la base 88 du relevé');

  assert.ok(Math.abs(hautChantier / 60 - 13.57) < 0.01, `${hautChantier} s au Chantier 40`);
  assert.ok(Math.abs(basChantier / 3600 - 2.181) < 0.001, `${basChantier} s au Chantier 20`);

  const { penteNiveau, diviseurBatiment } = REPARATION_BASE_JOUEUR.courbe;
  const rapport = basChantier / hautChantier;
  assert.ok(Math.abs(rapport - 9.646) < 0.001, `rapport ${rapport}`);
  // ⚠ À UNE ULP PRÈS, PAS À L'ÉGALITÉ STRICTE : le rapport des deux DURÉES passe
  // par `reparationSec × penteNiveau^39`, qui se simplifie en algèbre et pas en
  // virgule flottante — mesuré, l'écart vaut 2 × 10⁻¹⁵.
  const attenduRapport = diviseurDuBatiment(40, diviseurBatiment)
    / diviseurDuBatiment(20, diviseurBatiment);
  assert.ok(Math.abs(rapport - attenduRapport) < 1e-12, `${rapport} contre ${attenduRapport}`);

  // ⚠ ET LA PENTE EST LA CINQUIÈME, PAS L'UNE DES QUATRE CONNUES. 1,1767 ne vaut
  // ni 1,10 (les PV), ni 1,15 (la réparation d'armée), ni 1,32 (les coûts) ; un
  // test qui ne le dirait pas laisserait quelqu'un « harmoniser » les pentes.
  assert.equal(penteNiveau, 1.1767);
  for (const voisine of [1.1, 1.15, 1.32, REPARATION.penteNiveauUnite]) {
    assert.notEqual(penteNiveau, voisine);
  }
  assert.ok(
    Math.abs(secondesPleinesDUnBatiment('caserne', 40, 40)
      - (88 * penteNiveau ** 39) / diviseurDuBatiment(40, diviseurBatiment)) < 1e-9,
  );
});

test('RÉSERVE-BASE T7 — le coût est le prix du niveau ÷ 230, et zéro dans le bas d\'échelle', () => {
  assert.equal(REPARATION_BASE_JOUEUR.courbe.diviseurDuCout, 230);

  const etat = baseBatie(20, [{ id: 'caserne', niveau: 20 }]);
  abimerLeBatiment(etat, 1, 1);
  const cout = coutDeLaReparationDUnBatiment(etat, 1);
  assert.ok(Math.abs(cout.part - 1) < 1e-12, 'le montage ne demande pas une réparation PLEINE');
  assert.ok(Math.abs(cout.quartz - coutDeMontee('caserne', 20).quartz / 230) < 1e-6);

  // ⚠⚠ ET LA GRATUITÉ DU BAS D'ÉCHELLE EST L'ARRONDI AU PLUS PROCHE, MESURÉ.
  // `MODELE-REPARATION-1.md` §3 : « jusqu'au niveau 5, 6 pour la CLASSE LA PLUS
  // LÉGÈRE ». C'est cette frontière-là qui départage les trois lectures — une
  // troncature rendrait DEUX classes gratuites au niveau 6, un `Math.ceil` n'en
  // rendrait aucune au-dessus du niveau 1.
  //
  // ⚠⚠ ET IL A FALLU LE MESURER SUR LE MODULE, PAS SUR LE TÉMOIN — LA
  // FALSIFICATION N'A PAS MORDU AU PREMIER RELEVÉ. Le premier jet écrivait
  // `Math.round(cout.quartz) === 0` DANS LE TEST : remplacer l'arrondi du module
  // par un `Math.ceil` laissait la suite entièrement verte, parce que le test
  // refaisait le calcul au lieu de le lire. Il interroge maintenant les DEUX
  // sorties du module — ce que le devis ANNONCE et ce que la réparation
  // FACTURE — et il exige qu'elles coïncident, ce qui est la seconde propriété
  // qui manquait.
  const gratuit = (id, niveau) => {
    const jeu = baseBatie(12, [{ id, niveau }]);
    abimerLeBatiment(jeu, 1, 1);
    const annonce = devisDeLaReparationDesBatiments(jeu).quartz;
    const paye = reparerUnBatiment(jeu, 1).quartz;
    assert.equal(annonce, paye, `${id} niv. ${niveau} : le devis annonce ${annonce}, on facture ${paye}`);
    return paye === 0;
  };
  for (const id of ['caserne', 'centrale', 'accumulateur']) {
    assert.equal(gratuit(id, 5), true, `${id} au niveau 5 devrait être gratuit`);
  }
  assert.equal(gratuit('accumulateur', 6), true, 'la classe la plus légère paie déjà au niveau 6');
  assert.equal(gratuit('centrale', 6), false, 'la classe « modeste » est gratuite au niveau 6');
  assert.equal(gratuit('caserne', 6), false, 'la classe « courant » est gratuite au niveau 6');

  // ⚠ LE TEMPS, LUI, N'EST JAMAIS NUL — gratuit ne veut pas dire instantané.
  const petit = baseBatie(12, [{ id: 'accumulateur', niveau: 3 }]);
  abimerLeBatiment(petit, 1, 1);
  const coutPetit = coutDeLaReparationDUnBatiment(petit, 1);
  assert.equal(devisDeLaReparationDesBatiments(petit).quartz, 0);
  assert.ok(coutPetit.ticks > 0, 'une réparation gratuite serait devenue instantanée');
});

test('RÉSERVE-BASE T8 — coût et temps sont au prorata des PV perdus', () => {
  const plein = baseBatie(20, [{ id: 'caserne', niveau: 20 }]);
  abimerLeBatiment(plein, 1, 1);
  const moitie = baseBatie(20, [{ id: 'caserne', niveau: 20 }]);
  abimerLeBatiment(moitie, 1, 0.5);

  const a = coutDeLaReparationDUnBatiment(plein, 1);
  const b = coutDeLaReparationDUnBatiment(moitie, 1);
  assert.ok(a.quartz > 1, 'le montage ne mesure rien : la réparation pleine est déjà gratuite');
  assert.ok(Math.abs(b.part - 0.5) < 1e-9);
  assert.ok(Math.abs(b.quartz - a.quartz / 2) < 1e-9, `${b.quartz} contre ${a.quartz / 2}`);
  assert.ok(Math.abs(b.secondes - a.secondes / 2) < 1e-9);
  assert.ok(Math.abs(b.ticks - a.ticks / 2) <= 1, `${b.ticks} contre ${a.ticks / 2}`);

  // Un bâtiment intact ne rend pas zéro : il rend `null`, et rien à réparer.
  const intact = baseBatie(20, [{ id: 'caserne', niveau: 20 }]);
  assert.equal(coutDeLaReparationDUnBatiment(intact, 1), null);
  assert.deepEqual(
    problemesDeLaReparationDUnBatiment(intact, 1).map((p) => p.code), ['rien-a-reparer'],
  );
});

test('RÉSERVE-BASE T9 — le CLIQUET est cassé au niveau du moteur : 1 PV puis réparé', () => {
  // ⚠⚠ C'EST LE TEST QUI DIT CE QUE LE LOT SERT À. `AUDIT-REPARATION.md` §4 :
  // « un raid subi laisse la base du joueur à 1 PV, et rien au monde ne l'en
  // fait remonter. Le raid suivant la traverse. » On enchaîne donc un VRAI raid
  // de l'Ouvrage, on constate le plancher, et on répare.
  const etat = baseBatie(20, [
    { id: 'caserne', niveau: 20 }, { id: 'centrale', niveau: 20 },
    { id: 'accumulateur', niveau: 20 },
  ]);
  const laBase = baseCourante(etat);
  // ⚠ LE NIVEAU DE L'ATTAQUANTE EST MESURÉ, PAS CHOISI. Balayé de 1 à 40 sur ce
  // montage : sous 5 rien n'atteint le plancher, et à 40 la base est RASÉE —
  // donc plus rien à réparer, et le test ne mesurerait plus le cliquet. Le 20
  // abîme quatre bâtiments dont trois au plancher, sans faire tomber le Chantier.
  const rapport = subirUnRaid(etat, {
    type: 'base', niveau: 20, rangee: 190, colonne: 16, saveur: null, instance: 0,
  }, 5, { maxTicks: 900 });
  assert.equal(rapport.rase, false, 'le montage ne mesure rien : la base a été rasée');

  const abimes = laBase.disposition
    .map((b, i) => [i, b])
    .filter(([, b]) => (b.degatsMilli ?? 0) > 0);
  assert.ok(abimes.length > 0, 'le montage ne mesure rien : le raid n\'a rien abîmé');

  // Le plancher est bien à 1 PV sur au moins un bâtiment — c'est le cliquet.
  const auPlancher = abimes.filter(
    ([, b]) => BASE_BATIMENTS[b.id].pv * facteurMilli(b.niveau) - b.degatsMilli === 1000,
  );
  assert.ok(auPlancher.length > 0, 'aucun bâtiment au plancher : le cliquet n\'est pas reproduit');

  crediterLesReserves(etat, plafondDeLaReserveDesBatiments(laBase));
  const [index] = auPlancher[0];
  reparerUnBatiment(etat, index);
  assert.equal(laBase.disposition[index].degatsMilli, 0, 'les PV ne sont pas revenus');

  // Et « tout réparer » ferme le reste, dans l'ordre de `disposition`.
  toutReparerLesBatiments(etat);
  assert.deepEqual(laBase.disposition.filter((b) => (b.degatsMilli ?? 0) > 0), []);
  assert.deepEqual(
    problemesDeToutReparerLesBatiments(etat).map((p) => p.code), ['rien-a-reparer'],
  );
});

test('RÉSERVE-BASE T10 — réparer débite les trois choses, ou aucune', () => {
  const etat = baseBatie(20, [{ id: 'caserne', niveau: 20 }]);
  const laBase = baseCourante(etat);
  abimerLeBatiment(etat, 1, 1);
  const cout = coutDeLaReparationDUnBatiment(etat, 1);
  assert.ok(cout.ticks > 0 && Math.round(cout.quartz) > 0,
    'le montage ne mesure rien : la réparation est gratuite ou instantanée');

  // --- réserve trop courte : on dit le manque, et RIEN ne bouge -------------
  laBase.reserveReparationBatiments = cout.ticks - 1;
  const quartzAvant = laBase.economie.ressources.quartz;
  const degatsAvant = laBase.disposition[1].degatsMilli;
  const problemes = problemesDeLaReparationDUnBatiment(etat, 1);
  assert.deepEqual(problemes.map((p) => p.code), ['reserve-insuffisante']);
  assert.throws(() => reparerUnBatiment(etat, 1), /réparation impossible/);
  assert.equal(laBase.economie.ressources.quartz, quartzAvant, 'le quartz a bougé');
  assert.equal(laBase.disposition[1].degatsMilli, degatsAvant, 'les PV ont bougé');
  assert.equal(laBase.reserveReparationBatiments, cout.ticks - 1, 'la réserve a bougé');

  // --- quartz trop court : même refus, même immobilité ----------------------
  laBase.reserveReparationBatiments = cout.ticks;
  laBase.economie.ressources.quartz = 0;
  assert.deepEqual(
    problemesDeLaReparationDUnBatiment(etat, 1).map((p) => p.code), ['quartz-insuffisant'],
  );
  assert.throws(() => reparerUnBatiment(etat, 1), /quartz/);
  assert.equal(laBase.reserveReparationBatiments, cout.ticks, 'la réserve a été débitée quand même');
  assert.equal(laBase.disposition[1].degatsMilli, degatsAvant);

  // --- payable : les trois bougent ENSEMBLE ---------------------------------
  laBase.economie.ressources.quartz = 1_000_000_000;
  const paye = reparerUnBatiment(etat, 1);
  assert.equal(laBase.reserveReparationBatiments, 0);
  assert.equal(laBase.economie.ressources.quartz, 1_000_000_000 - paye.quartz * 1000);
  assert.equal(laBase.disposition[1].degatsMilli, 0);
  assert.equal(paye.batiment, 'caserne');

  // ⚠ ET LA SCORIE N'A PAS BOUGÉ : les deux moitiés ne partagent pas de caisse.
  assert.equal(laBase.economie.ressources.scorie, etat.bases[0].economie.ressources.scorie);
});

test('RÉSERVE-BASE T11 — la migration pose 0 sur TOUTES les bases, et le numéro bouge', () => {
  // ⚠ LA GARDE DU NUMÉRO A CHANGÉ DE PORTEUR AU LOT COMPLEXE, ET C'EST LA RÈGLE :
  // elle appartient au maillon le plus RÉCENT, une seule fois — écrite dans
  // `points-attaque.test.js` depuis le lot SITE-ENTAMÉ. Ce test-ci garde le
  // maillon 24 → 25 ; le `assert.equal(SAVE_VERSION, …)` est passé sous
  // `RETOUR T10`, qui garde le 25 → 26.
  const etat = creerEtat(4321);
  rattraperJeu(etat, 2 * TICKS_PAR_HEURE);
  const v25 = JSON.parse(serialiser(etat, 5_000_000));
  assert.ok(v25.bases[0].reserveReparationBatiments > 0,
    'le montage ne mesure rien : la réserve de base est déjà à zéro');

  // Une vraie v24 : deux bases, et le champ nulle part.
  const v24 = structuredClone(v25);
  v24.version = 24;
  v24.bases.push(structuredClone(v25.bases[0]));
  for (const b of v24.bases) delete b.reserveReparationBatiments;

  const migre = migrer(structuredClone(v24));
  assert.equal(migre.version, SAVE_VERSION);
  assert.equal(migre.bases.length, 2);
  // ⚠ CE QUE CE TEST GARDE ENCORE, ET QUE LE DÉPLACEMENT DE LA GARDE NE LUI
  // RETIRE PAS : le maillon 24 → 25 fait toujours son travail, quel que soit le
  // numéro du bout de la chaîne. Retirer ce maillon-là fait tomber les trois
  // assertions qui suivent.
  for (const b of migre.bases) {
    assert.equal(b.reserveReparationBatiments, 0, 'la migration crédite une réserve d\'avance');
  }

  // ⚠⚠ ET UNE VALEUR DÉJÀ PRÉSENTE N'EST PAS ÉCRASÉE, comme le compteur
  // d'instance de la v23 → v24. Les montages du dépôt fabriquent leurs vieilles
  // sauvegardes en rabaissant une récente : remettre zéro dessus effacerait une
  // réserve accumulée sans que rien ne le dise.
  const rabaissee = structuredClone(v25);
  rabaissee.version = 24;
  assert.equal(
    migrer(rabaissee).bases[0].reserveReparationBatiments,
    v25.bases[0].reserveReparationBatiments,
    'la migration a effacé une réserve déjà accumulée',
  );

  // Et une v24 aplatie traverse la chaîne complète sans exception.
  const plate = aplatirSauvegarde(structuredClone(v25));
  plate.version = 22;
  delete plate.reserveReparationBatiments;
  const relu = charger(JSON.stringify(plate), 5_000_000);
  assert.equal(baseCourante(relu).reserveReparationBatiments >= 0, true);

  // ⚠ ET UNE RÉSERVE ILLISIBLE FAIT LEVER AU CHARGEMENT, comme les trois autres.
  assert.deepEqual(problemesDeLaReserveDesBatiments(5), []);
  assert.equal(problemesDeLaReserveDesBatiments(-1).length, 1);
  assert.equal(problemesDeLaReserveDesBatiments(1.5).length, 1);
  assert.equal(problemesDeLaReserveDesBatiments(undefined).length, 1);
  const casse = JSON.parse(serialiser(etat, 6_000_000));
  casse.bases[0].reserveReparationBatiments = -3;
  assert.throws(() => charger(JSON.stringify(casse), 6_000_000), /réserve de réparation/);
});

test('RÉSERVE-BASE T12 — le Chantier décote par son NIVEAU, jamais par ses PV', () => {
  // ⚠⚠ C'EST L'INVERSE DU COMPLEXE DE DÉFENSE, et il fallait le mesurer plutôt
  // que le laisser à l'implicite : `MODELE-REPARATION-1.md` §6 point 5 dit que
  // le Complexe répare « au prorata de ses PV ». Aligner les deux en croyant
  // corriger un oubli rendrait une base rasée d'un cheveu irréparable au moment
  // exact où elle en a besoin.
  const intact = baseBatie(20, [{ id: 'caserne', niveau: 20 }]);
  abimerLeBatiment(intact, 1, 1);
  const reference = coutDeLaReparationDUnBatiment(intact, 1);

  const chantierAuPlancher = baseBatie(20, [{ id: 'caserne', niveau: 20 }]);
  abimerLeBatiment(chantierAuPlancher, 1, 1);
  const chantier = baseCourante(chantierAuPlancher).disposition[0];
  const pvMax = BASE_BATIMENTS.chantierDeConstruction.pv * facteurMilli(chantier.niveau);
  chantier.degatsMilli = pvMax - 1000;
  assert.ok(chantier.degatsMilli > 0, 'le montage ne mesure rien : le Chantier est intact');

  const abime = coutDeLaReparationDUnBatiment(chantierAuPlancher, 1);
  assert.equal(abime.secondes, reference.secondes, 'le Chantier décote par ses PV');
  assert.equal(abime.ticks, reference.ticks);
  assert.equal(abime.quartz, reference.quartz);
  assert.equal(abime.niveauChantier, 20);

  // ⚠ ET C'EST BIEN LE NIVEAU QUI COMPTE : le baisser, lui, change tout.
  const chantierBas = baseBatie(10, [{ id: 'caserne', niveau: 20 }]);
  abimerLeBatiment(chantierBas, 1, 1);
  const bas = coutDeLaReparationDUnBatiment(chantierBas, 1);
  assert.ok(bas.secondes > reference.secondes * 2, 'le niveau du Chantier ne décote rien');
  assert.equal(bas.quartz, reference.quartz, 'le Chantier décote AUSSI le coût en quartz');
});

// ---------------------------------------------------------------------------
// Le retour des défenses — ce que le Complexe de défense commande
// ---------------------------------------------------------------------------
//
// ⚠⚠ AUCUN DE CES TESTS NE LIT UNE CONSTANTE POUR CONCLURE. Le dépôt a déjà
// trouvé trois proxys — une garde qui regardait `sim/state.js` quand la fonction
// vivait dans `sim/reparation.js`, et deux tests qui interrogeaient un témoin
// qu'ils avaient eux-mêmes produit. Ceux-ci passent par l'HORLOGE et par les
// PV : ce qu'ils mesurent, c'est ce qu'une pièce a dans le ventre à un instant
// donné.

/**
 * Une base avec son Complexe de défense, ou sans lui si `niveauComplexe` vaut
 * `null` — et c'est ce second montage qui garde la règle « pas de Complexe, pas
 * de retour ».
 */
function baseAvecComplexe(niveauComplexe, niveauChantier = 20) {
  const batiments = niveauComplexe === null
    ? [] : [{ id: 'complexeDeDefense', niveau: niveauComplexe }];
  return baseBatie(niveauChantier, batiments);
}

/**
 * Pose une pièce de garnison sur la première case que le MOTEUR accepte.
 *
 * ⚠ ELLE DEMANDE SA CASE, ELLE NE L'ÉCRIT PAS. « Un montage qui écrit une
 * coordonnée ne garde que lui-même » — cinq tests du dépôt sont tombés pour
 * l'avoir fait, sur un obstacle tiré par une graine qu'ils ne connaissaient pas.
 */
function poserEnGarnison(etat, id, niveau) {
  const bande = GRILLE.bandes.defense;
  for (let rangee = bande.premiere; rangee <= bande.derniere; rangee += 1) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
      const piece = { id, rangee, colonne, niveau };
      if (problemesDeLaPoseDEffectif(etat, 'garnison', piece).length > 0) continue;
      poserEffectif(etat, 'garnison', piece);
      const liste = baseCourante(etat).garnison;
      return liste[liste.length - 1];
    }
  }
  throw new Error(`aucune case libre en garnison pour « ${id} »`);
}

/** Abîme une pièce de garnison d'une fraction de ses PV maximaux. */
function abimerLaPiece(piece, part) {
  piece.degatsMilli = Math.round(pvMaxDeLaPieceDeGarnisonMilli(piece.id, piece.niveau) * part);
  return piece;
}

/** Ce qu'il reste à cette pièce, en part de ses PV maximaux. */
function partRestante(piece) {
  const max = pvMaxDeLaPieceDeGarnisonMilli(piece.id, piece.niveau);
  return (max - (piece.degatsMilli ?? 0)) / max;
}

/** Abîme le Complexe pour qu'il lui reste exactement cette part de ses PV. */
function santeDuComplexe(etat, part) {
  const pose = baseCourante(etat).disposition.find((b) => b.id === 'complexeDeDefense');
  const max = BASE_BATIMENTS.complexeDeDefense.pv * facteurMilli(pose.niveau);
  pose.degatsMilli = Math.round(max * (1 - part));
  return pose;
}

/**
 * Pose un bâtiment sur la première case que le MOTEUR accepte — même discipline
 * que `poserEnGarnison`, et pour la même raison.
 */
function poserUnBatiment(etat, id) {
  const bande = GRILLE.bandes.batiments;
  for (let rangee = bande.premiere; rangee <= bande.derniere; rangee += 1) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
      if (problemesDeLaPose(etat, id, rangee, colonne).length > 0) continue;
      poser(etat, id, rangee, colonne);
      return baseCourante(etat).disposition.at(-1);
    }
  }
  throw new Error(`aucune case libre pour « ${id} »`);
}

/** Une durée en ticks, dite « 2 h 36 » — pour que les messages soient lisibles. */
function enHeuresMinutes(ticks) {
  const minutes = Math.round(ticks / (TICKS_PAR_HEURE / 60));
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

test('RETOUR-D T1 — les 70 % arrivent À LA FIN DU RAID, pas un tick plus tard', () => {
  // ⚠ ZÉRO TICK ÉCOULÉ, COMPLEXE ENTIER : une pièce à zéro PV doit déjà être à
  // 70 %. C'est le palier, et il est ce qui distingue la règle du 05/09 de
  // l'échéance sèche qu'elle remplace — avant, la pièce serait restée à zéro.
  const pvMax = 1_000_000;
  const pv = pvApresRetour({
    pvMaxMilli: pvMax, pvApresRaidMilli: 0,
    niveau: 5, niveauComplexe: 5, santeMilli: 1000, ecouleTicks: 0,
  });
  assert.equal(pv, 700_000, `à l'instant du raid la pièce vaut ${pv} sur ${pvMax}`);

  // ⚠ ET LE CHEMIN COMPLET LE DIT AUSSI : `subirUnRaid` appelle
  // `ramenerLaGarnison` sur-le-champ, donc `degatsMilli` porte déjà le palier
  // quand le raid rend la main. Sans cet appel, il faudrait attendre un tick.
  const etat = baseAvecComplexe(5);
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 1);
  assert.equal(partRestante(piece), 0, 'le montage ne mesure rien : la pièce n\'est pas à terre');
  ramenerLaGarnison(etat);
  assert.ok(Math.abs(partRestante(piece) - 0.7) < 0.001,
    `la pièce est à ${(partRestante(piece) * 100).toFixed(1)} % au lieu de 70 %`);
});

test('RETOUR-D T2 — les 70 % touchent les DÉTRUITES, pas seulement les survivantes', () => {
  // ⚠ C'EST LE CHANGEMENT DE FOND DU 05/09, ET IL SE MESURE SUR DEUX PIÈCES À LA
  // FOIS. Avant, seule la seconde bougeait — et seulement au bout d'une heure.
  const etat = baseAvecComplexe(5);
  const morte = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 1);
  const blessee = abimerLaPiece(poserEnGarnison(etat, 'casemate', 5), 0.5);
  ramenerLaGarnison(etat);

  assert.ok(Math.abs(partRestante(morte) - 0.7) < 0.001,
    `la détruite est restée à ${(partRestante(morte) * 100).toFixed(1)} %`);
  assert.ok(Math.abs(partRestante(blessee) - 0.85) < 0.001,
    `la blessée est à ${(partRestante(blessee) * 100).toFixed(1)} % au lieu de 85 %`);
});

test('RETOUR-D T3 — les 70 % suivent la SANTÉ du Complexe', () => {
  // Complexe à mi-vie : la pièce à terre remonte à 35 %, pas à 70 %.
  const etat = baseAvecComplexe(5);
  santeDuComplexe(etat, 0.5);
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 1);
  ramenerLaGarnison(etat);
  assert.ok(Math.abs(partRestante(piece) - 0.35) < 0.001,
    `à mi-vie la pièce remonte à ${(partRestante(piece) * 100).toFixed(1)} % au lieu de 35 %`);

  // ⚠ FALSIFIABLE DANS L'AUTRE SENS : le Complexe entier rend le double.
  const entier = baseAvecComplexe(5);
  const autre = abimerLaPiece(poserEnGarnison(entier, 'merlon', 5), 1);
  ramenerLaGarnison(entier);
  assert.ok(partRestante(autre) > partRestante(piece) * 1.9,
    'la santé ne change rien au palier');
});

test('RETOUR-D T4 — la rampe rend le plein À LA DURÉE, et pas avant', () => {
  const etat = baseAvecComplexe(5);
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 0.5);
  const duree = ticksDeRetour(5, 5, 1000);
  assert.equal(duree, TICKS_PAR_HEURE, 'une pièce au niveau du Complexe revient en une heure');

  // ⚠ LE PREMIER TICK EST CELUI QUI STAMPE, et l'écoulé se compte À PARTIR DE
  // LUI. Avancer d'abord et stamper ensuite mesurerait une rampe qui n'a pas
  // encore commencé — le palier seul, et rien d'autre.
  tickJeu(etat);
  assert.ok(Math.abs(partRestante(piece) - 0.85) < 0.001,
    `le palier n'a pas rendu 35 % : la pièce est à ${(partRestante(piece) * 100).toFixed(1)} %`);

  rattraperJeu(etat, duree - 1);
  assert.ok((piece.degatsMilli ?? 0) > 0,
    `à ${enHeuresMinutes(duree - 1)} la pièce est déjà entière`);
  // ⚠ ET ELLE A BIEN AVANCÉ : sans ça, « il manque quelque chose » serait vrai
  // d'un code qui ne fait rien du tout.
  assert.ok(partRestante(piece) > 0.99 && partRestante(piece) < 1,
    `la rampe est à ${(partRestante(piece) * 100).toFixed(3)} % au lieu de frôler le plein`);

  tickJeu(etat);
  assert.equal(piece.degatsMilli, 0, `à ${enHeuresMinutes(duree)} la pièce n'est pas revenue`);
  assert.equal(piece.retour, null, 'la rampe finie n\'a pas été retirée de l\'état');
});

test('RETOUR-D T5 — le dépassement suit `facteurMilli`, jamais une pente écrite en dur', () => {
  // ⚠⚠ LE DISCRIMINANT EST L'ARRONDI AU MILLIÈME. `facteurMilli(11)` rend 2 594,
  // là où 1,10^10 vaut 2,5937424601 : l'écart est de NEUF TICKS sur 93 384, soit
  // un dix-millième. Un test « à 1 % près » ne verrait rien.
  const attendu = Math.ceil((facteurMilli(11) / 1000) * TICKS_PAR_HEURE);
  const mesure = ticksDeRetour(15, 5, 1000);
  assert.equal(mesure, attendu, `+10 rend ${enHeuresMinutes(mesure)}`);
  assert.equal(mesure, 93_384, '+10 doit rendre 2 h 36, à la seconde');
  assert.notEqual(mesure, Math.ceil(1.10 ** 10 * TICKS_PAR_HEURE),
    'une pente écrite en dur rendrait le même nombre : l\'arrondi ne discrimine plus');

  // ⚠⚠ SECOND DISCRIMINANT : LA PENTE DE `data/niveaux.js`, PAS LE DRAPEAU.
  // Le brief proposait de basculer `NIVEAU.deuxRegimes` ; MESURÉ, c'est INERTE
  // sur la donnée d'aujourd'hui — `penteBasse` et `penteHaute` valent toutes
  // deux 1,1 depuis le 25/08, donc les deux régimes rendent le même nombre et le
  // test serait vert sur une pente écrite en dur. On bouge la PENTE, qui est la
  // grandeur que le drapeau était censé faire lire.
  const memoire = NIVEAU.penteHaute;
  try {
    NIVEAU.penteHaute = 1.2;
    assert.notEqual(ticksDeRetour(15, 5, 1000), mesure,
      'la durée ne suit pas `NIVEAU.penteHaute` : la pente est recopiée quelque part');
  } finally {
    NIVEAU.penteHaute = memoire;
  }
  assert.equal(ticksDeRetour(15, 5, 1000), mesure, 'le montage n\'a pas rendu la table');
  assert.equal(NIVEAU.penteBasse, NIVEAU.penteHaute,
    'les deux pentes diffèrent : `NIVEAU.deuxRegimes` redevient un discriminant');
});

test('RETOUR-D T6 — la pénalité touche ses deux points arbitrés, et elle est LINÉAIRE', () => {
  // Les deux points d'Ethan : une heure à pleine santé, le plancher à 1 PV.
  assert.equal(ticksDeRetour(5, 5, 1000), TICKS_PAR_HEURE, 'pleine santé ne rend pas une heure');

  const etat = baseAvecComplexe(1);
  const pose = santeDuComplexe(etat, 0);
  const max = BASE_BATIMENTS.complexeDeDefense.pv * facteurMilli(pose.niveau);
  pose.degatsMilli = max - 1000; // 1 PV, pas zéro
  const complexe = complexeDeLaBase(baseCourante(etat));
  assert.notEqual(complexe.santeMilli, null, 'à 1 PV le Complexe est ENCORE debout');
  const plancher = ticksDeRetour(1, 1, complexe.santeMilli);
  assert.equal(plancher, RETOUR_DEFENSES.heuresAuPlancher * TICKS_PAR_HEURE,
    `à 1 PV la pièce revient en ${enHeuresMinutes(plancher)}`);

  // ⚠⚠ ET LA FORME ENTRE LES DEUX EST LINÉAIRE — arbitrage d'Ethan du 06/09 qui
  // renverse la proposition GÉOMÉTRIQUE des deux briefs. Les deux formes
  // touchent les mêmes deux points ; elles ne diffèrent qu'entre eux, et c'est
  // là qu'on les départage.
  const miVie = ticksDeRetour(5, 5, 500);
  assert.equal(miVie, (TICKS_PAR_HEURE + plancher) / 2,
    `à mi-vie la pénalité rend ${enHeuresMinutes(miVie)} au lieu de la moyenne des deux bornes`);
  const geometrique = Math.ceil(RETOUR_DEFENSES.heuresAuPlancher ** 0.5 * TICKS_PAR_HEURE);
  assert.notEqual(miVie, geometrique,
    'la pénalité est géométrique : Ethan a tranché pour la linéaire le 06/09');
});

test('RETOUR-D T7 — les deux facteurs se MULTIPLIENT, ils ne se remplacent pas', () => {
  const seulDepassement = ticksDeRetour(15, 5, 1000);
  const seuleSante = ticksDeRetour(5, 5, 500);
  const les2 = ticksDeRetour(15, 5, 500);

  assert.equal(les2, 1_167_300, `+10 sur un Complexe à mi-vie rend ${enHeuresMinutes(les2)}`);
  assert.ok(Math.abs(les2 - (seulDepassement * seuleSante) / TICKS_PAR_HEURE) <= 1,
    `${les2} n'est pas le produit de ${seulDepassement} et ${seuleSante}`);
  assert.ok(les2 > seulDepassement && les2 > seuleSante,
    'un des deux facteurs a écrasé l\'autre au lieu de s\'y multiplier');
});

test('RETOUR-D T8 — chaque pièce a SA durée, jamais une seule pour la garnison', () => {
  // ⚠⚠ ET C'EST `facteurMilli` QUI L'IMPOSE : elle REFUSE un niveau non entier,
  // or `niveauDeLaDefense` rend une moyenne en dixièmes. Une règle en agrégat ne
  // pourrait donc même pas s'écrire.
  const etat = baseAvecComplexe(5);
  const pieces = [
    abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 0.5),
    abimerLaPiece(poserEnGarnison(etat, 'casemate', 8), 0.5),
    abimerLaPiece(poserEnGarnison(etat, 'creneau', 12), 0.5),
  ];
  const maintenant = etat.horloge.nbTicks;
  const echeances = pieces.map((p) => retourDeLaPiece(baseCourante(etat), p, maintenant).ticks);

  assert.equal(new Set(echeances).size, 3, `trois niveaux, ${new Set(echeances).size} échéance(s)`);
  assert.ok(echeances[0] < echeances[1] && echeances[1] < echeances[2],
    `les échéances ne croissent pas avec le niveau : ${echeances.join(' · ')}`);
  assert.equal(echeances[0], TICKS_PAR_HEURE, 'la pièce au niveau du Complexe ne paie rien');
});

test('RETOUR-D T9 — Complexe à ZÉRO PV : rien ne revient, JAMAIS', () => {
  // ⚠⚠ LA GARDE, ET ELLE N'EST PAS ÉMERGENTE. À santé nulle la formule rend la
  // pénalité maximale — vingt-quatre heures — et non « jamais » : c'est la ligne
  // `santeMilli === null` de `pvApresRetour` qui refuse. Le rapport mesure ce
  // qui se passe quand on la retire, et c'est 24 h.
  const pvMax = 1_000_000;
  const cent = 100 * TICKS_PAR_HEURE;
  const mort = pvApresRetour({
    pvMaxMilli: pvMax, pvApresRaidMilli: 250_000,
    niveau: 5, niveauComplexe: 5, santeMilli: null, ecouleTicks: cent,
  });
  assert.equal(mort, 250_000, `cent heures plus tard la pièce vaut ${mort} sur ${pvMax}`);

  // ⚠ FALSIFIABLE : la MÊME pièce, sous un Complexe à un millième de vie,
  // revient — et en 24 h très exactement. C'est ce que la garde refuse, et sans
  // ce couple « zéro n'est pas rien » ne voudrait rien dire.
  const vivant = pvApresRetour({
    pvMaxMilli: pvMax, pvApresRaidMilli: 250_000,
    niveau: 5, niveauComplexe: 5, santeMilli: 0, ecouleTicks: cent,
  });
  assert.equal(vivant, pvMax, 'un Complexe à 1 PV ne ramène plus rien');
  assert.equal(ticksDeRetour(5, 5, 0), 24 * TICKS_PAR_HEURE,
    'sans la garde, une santé nulle rendrait tout en 24 h — c\'est ce qu\'elle empêche');
});

test('RETOUR-D T10 — sans Complexe construit, la garnison ne revient JAMAIS', () => {
  const etat = baseAvecComplexe(null);
  assert.equal(complexeDeLaBase(baseCourante(etat)), null,
    'le montage ne mesure rien : cette base a un Complexe');
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 0.5);
  const degats = piece.degatsMilli;

  rattraperJeu(etat, 100 * TICKS_PAR_HEURE);
  assert.equal(piece.degatsMilli, degats, 'la pièce est revenue sans Complexe');
  assert.equal(piece.retour ?? null, null, 'une rampe a été posée sans Complexe');
  assert.equal(retourDeLaPiece(baseCourante(etat), piece, etat.horloge.nbTicks).etat,
    'sans-retour', 'l\'écran annoncerait un retour qui n\'arrivera jamais');

  // ⚠ ET LE JOUR OÙ LE JOUEUR EN POSE UN, LE TICK SUIVANT LA PREND EN CHARGE.
  // Sans ça, une pièce abîmée avant la construction resterait à terre pour
  // toujours — et rien à l'écran ne dirait pourquoi.
  poserUnBatiment(etat, 'complexeDeDefense');
  tickJeu(etat);
  assert.ok(piece.degatsMilli < degats, 'le Complexe posé n\'a rien changé');
});

test('RETOUR-D T11 — la santé se FIGE à l\'instant du raid', () => {
  // ⚠ RÉPARER LE COMPLEXE ENSUITE NE RACCOURCIT PAS LA RAMPE EN COURS. C'est ce
  // qui donne une raison de le garder entier AVANT d'être attaqué.
  const etat = baseAvecComplexe(5);
  santeDuComplexe(etat, 0.5);
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 0.5);
  tickJeu(etat);
  const avant = retourDeLaPiece(baseCourante(etat), piece, etat.horloge.nbTicks).ticks;
  assert.ok(avant > TICKS_PAR_HEURE, 'le montage ne mesure rien : le Complexe est entier');
  const degatsAvant = piece.degatsMilli;

  // Le Complexe est remis à neuf : la rampe en cours ne doit pas bouger.
  santeDuComplexe(etat, 1);
  tickJeu(etat);
  const apres = retourDeLaPiece(baseCourante(etat), piece, etat.horloge.nbTicks).ticks;
  assert.equal(apres, avant - 1, `l'échéance a bougé de ${avant - apres} ticks`);
  assert.ok(piece.degatsMilli < degatsAvant, 'la rampe ne s\'est pas mise en route');

  // ⚠ FALSIFIABLE : une pièce abîmée APRÈS la réparation, elle, profite du
  // Complexe neuf. Sans ce couple, « figée » serait vrai d'un code qui ne lit
  // jamais la santé.
  const neuve = abimerLaPiece(poserEnGarnison(etat, 'casemate', 5), 0.5);
  tickJeu(etat);
  assert.equal(retourDeLaPiece(baseCourante(etat), neuve, etat.horloge.nbTicks).ticks,
    TICKS_PAR_HEURE, 'la pièce neuve n\'a pas profité du Complexe réparé');
});

test('RETOUR-D T12 — les deux chemins d\'avancement rendent la même garnison, RAID COMPRIS', () => {
  // ⚠⚠ ET IL PORTE BIEN UN RAID DANS SA FENÊTRE, CE QU'IL PROUVE AVANT DE
  // COMPARER. Sans raid, aucune pièce n'est jamais abîmée et le test serait vert
  // sur n'importe quel code : `rattraperJeu` découpe sa fenêtre aux instants des
  // raids, et c'est ce découpage-là qu'on mesure.
  const etats = [];
  for (const parBoucle of [true, false]) {
    const etat = baseAvecComplexe(5);
    // ⚠ LA BASE DÉMÉNAGE EN RANGÉE 200. À la rangée 295 — le départ — la garde
    // du peuplement écarte toutes les bases de l'Ouvrage à quinze cases, donc
    // aucune n'attaque et la fenêtre serait vide.
    poserLaBaseSur(etat, 200, 16);
    for (const [id, niveau] of [['merlon', 5], ['casemate', 8], ['creneau', 12]]) {
      poserEnGarnison(etat, id, niveau);
    }
    const n = 6 * TICKS_PAR_HEURE;
    if (parBoucle) for (let i = 0; i < n; i += 1) tickJeu(etat);
    else rattraperJeu(etat, n);
    etats.push(etat);
  }

  const [boucle, saut] = etats;
  assert.ok(boucle.rapports.length > 0, 'aucun raid dans la fenêtre : ce test ne mesure rien');
  assert.ok(boucle.bases[0].garnison.some((p) => p.retour !== null && p.retour !== undefined),
    'aucune pièce en rampe : le raid n\'a pas abîmé la garnison');
  assert.deepEqual(boucle.bases[0].garnison, saut.bases[0].garnison,
    'boucle et rattrapage rendent deux garnisons différentes');
  assert.equal(serialiser(boucle, 1_000), serialiser(saut, 1_000),
    'boucle et rattrapage divergent, sérialisation comprise');
});

test('RETOUR-D T16 — le filet stampe ce qui n\'est pas stampé', () => {
  const etat = baseAvecComplexe(5);
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 0.5);
  tickJeu(etat);
  assert.ok(piece.retour, 'le filet n\'a rien stampé du tout');

  // On retire la rampe à la main — c'est ce que fait une sauvegarde d'avant ce
  // lot, et ce que ferait tout chemin futur qui abîmerait la garnison sans
  // passer par `subirUnRaid`.
  const degats = piece.degatsMilli;
  piece.retour = null;
  tickJeu(etat);
  assert.ok(piece.retour, 'la pièce non stampée ne l\'a pas été au tick suivant');
  assert.equal(piece.retour.tickDuRaid, etat.horloge.nbTicks,
    'le filet a stampé avec un autre instant que le sien');
  assert.ok(piece.degatsMilli < degats, 'la rampe n\'est pas repartie');

  // ⚠ ET IL RESTAMPE CE QUE LA RAMPE N'EXPLIQUE PAS. Des dégâts plus grands que
  // ce qu'elle prévoit ne peuvent venir que d'un raid neuf ; sans ce test, la
  // réécriture analytique les écraserait au tick suivant.
  const echeance = piece.retour.tickDuRaid;
  const neufs = abimerLaPiece(piece, 0.9).degatsMilli;
  const avant = partRestante(piece);
  rattraperJeu(etat, 10);
  assert.ok(piece.retour.tickDuRaid > echeance, 'les dégâts neufs n\'ont pas restampé la rampe');
  assert.equal(piece.retour.degatsAuDebutMilli, neufs,
    'la rampe est repartie d\'un autre point que les dégâts neufs');
  // ⚠ ELLE REPART DES NEUFS, DONC LE PALIER LES REND À 70 % — pas au niveau
  // d'avant. Le mesurer contre `avant` serait faux : le palier remonte.
  assert.ok(partRestante(piece) > avant, 'le palier n\'a rien rendu sur les dégâts neufs');
  assert.ok(partRestante(piece) < 0.85,
    `les dégâts neufs ont été effacés : la pièce est à ${(partRestante(piece) * 100).toFixed(1)} %`);
});

test('RETOUR-D T18 — la migration ne calcule AUCUNE rampe, et le numéro bouge', () => {
  // ⚠ LA GARDE DU NUMÉRO A DÉMÉNAGÉ, ELLE N'A PAS ÉTÉ RETIRÉE — même règle que
  // celle qui l'avait amenée ici : « elle appartient au maillon le plus RÉCENT,
  // une seule fois ». Elle vivait sous `RÉSERVE-BASE T11` à `=== 25`, puis ici à
  // `=== 26` ; depuis le lot SATELLITES-RESPAWN (06/09/2026) elle est sous
  // `SAT-R T11`, à `=== 27`. Ce qui reste ici est ce que ce test-ci mesure : que
  // le maillon v25 → v26 est encore dans la chaîne et qu'il n'invente aucune
  // rampe, ce qu'un numéro figé ne dirait pas.
  //
  // ⚠⚠ ET CE QUI LA REMPLACE EST PLUS FORT QU'UN NOMBRE : on fait passer une v25
  // qui porte un `retour` MALFORMÉ et on exige qu'il ressorte à `null`. C'est
  // très exactement ce que le maillon v25 → v26 fait, et rien d'autre dans la
  // chaîne ne le fait — le retirer fait tomber cette ligne, là où un numéro figé
  // se contentait de signaler qu'on avait ajouté un maillon ailleurs.
  const etat = baseAvecComplexe(5);
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 0.5);
  const degats = piece.degatsMilli;

  const malformee = JSON.parse(serialiser(etat, 1_000));
  malformee.version = 25;
  for (const p of malformee.bases[0].garnison) p.retour = { tickDuRaid: 'jamais' };
  assert.equal(
    migrer(malformee).bases[0].garnison[0].retour, null,
    'le maillon v25 → v26 ne refuse plus un retour malformé',
  );

  // Une v25 fabriquée en rabaissant une sauvegarde d'aujourd'hui.
  const vieille = JSON.parse(serialiser(etat, 1_000));
  vieille.version = 25;
  for (const p of vieille.bases[0].garnison) delete p.retour;

  const migre = migrer(vieille);
  assert.equal(migre.version, SAVE_VERSION);
  const migree = migre.bases[0].garnison.find((p) => p.degatsMilli > 0);
  assert.equal(migree.retour ?? null, null, 'la migration a inventé une rampe');
  assert.equal(migree.degatsMilli, degats, 'la migration a rendu des PV');

  // ⚠ ET C'EST LE FILET QUI S'EN CHARGE AU PREMIER TICK, avec le Complexe
  // D'AUJOURD'HUI. Mesuré en CHANGEANT le Complexe entre le chargement et le
  // tick : la rampe suit le Complexe du jour, pas celui de la sauvegarde.
  const recharge = charger(JSON.stringify(migre), 1_000);
  santeDuComplexe(recharge, 0.5);
  tickJeu(recharge);
  const vivante = baseCourante(recharge).garnison.find((p) => (p.degatsMilli ?? 0) > 0);
  assert.ok(vivante.retour, 'le filet n\'a pas stampé la pièce migrée');
  assert.equal(vivante.retour.santeMilli, 500,
    'la rampe n\'a pas pris la santé du Complexe D\'AUJOURD\'HUI');
});

test('RETOUR-D T20 — une rampe malformée est REFUSÉE au chargement', () => {
  // ⚠ L'ABSENCE EST LÉGALE, LA MALFORMATION NON. Une sauvegarde d'avant ce lot
  // n'en porte aucune, une pièce fraîchement posée non plus ; ce qui est refusé,
  // c'est une valeur PRÉSENTE et fausse, qui ferait rendre à la rampe des PV qui
  // n'existent pas.
  assert.deepEqual(problemesDuRetour(undefined), [], 'l\'absence doit rester légale');
  assert.deepEqual(problemesDuRetour(null), [], '« null » doit rester légal');
  assert.deepEqual(problemesDuRetour({
    tickDuRaid: 12, santeMilli: 500, niveauComplexe: 3, degatsAuDebutMilli: 40,
  }), [], 'une rampe bien formée est refusée');

  for (const [quoi, valeur] of [
    ['tick négatif', { tickDuRaid: -1, santeMilli: 0, niveauComplexe: 1, degatsAuDebutMilli: 0 }],
    ['tick flottant', { tickDuRaid: 1.5, santeMilli: 0, niveauComplexe: 1, degatsAuDebutMilli: 0 }],
    ['santé > 1000', { tickDuRaid: 0, santeMilli: 1001, niveauComplexe: 1, degatsAuDebutMilli: 0 }],
    ['santé en chaîne', { tickDuRaid: 0, santeMilli: 'plein', niveauComplexe: 1, degatsAuDebutMilli: 0 }],
    ['niveau absent', { tickDuRaid: 0, santeMilli: 0, degatsAuDebutMilli: 0 }],
    ['dégâts négatifs', { tickDuRaid: 0, santeMilli: 0, niveauComplexe: 1, degatsAuDebutMilli: -3 }],
    ['pas un objet', 7],
  ]) {
    assert.ok(problemesDuRetour(valeur).length > 0, `${quoi} : accepté au chargement`);
  }

  // ⚠ ET LE CHARGEMENT LE REFUSE POUR DE BON, pas seulement la fonction de forme.
  const etat = baseAvecComplexe(5);
  poserEnGarnison(etat, 'merlon', 5);
  const brut = JSON.parse(serialiser(etat, 1_000));
  brut.bases[0].garnison[0].retour = { tickDuRaid: -4 };
  assert.throws(() => charger(JSON.stringify(brut), 1_000), /retour/,
    'une rampe malformée traverse le chargement en silence');
});

test('RETOUR-D T19 — `1 + dépassement` ne sort jamais de la table des niveaux', () => {
  // La borne tient par construction — le Complexe vaut au moins 1 — mais la
  // nommer donne un message qui dit LEQUEL des deux niveaux est en cause.
  assert.equal(ticksDeRetour(NIVEAU.plafond, 1, 1000) > 0, true);
  assert.throws(
    () => ticksDeRetour(NIVEAU.plafond + 1, 1, 1000),
    /niveau de pièce|dépassement|hors de/,
    'un dépassement hors table passe en silence',
  );
  assert.throws(() => ticksDeRetour(5.5, 1, 1000), /entier/, 'un niveau non entier passe');
});

// ---------------------------------------------------------------------------
// Lot FICHE-JUSTE — le retour de la garnison ne coûte QUE du temps
// ---------------------------------------------------------------------------

/** Le corps d'une fonction de `src/sim/reparation.js`, accolades appariées. */
function corpsDe(source, nom) {
  const debut = source.indexOf(`export function ${nom}(`);
  assert.ok(debut >= 0, `${nom} n'existe plus dans le module`);
  let i = source.indexOf('{', debut);
  let profondeur = 0;
  for (; i < source.length; i += 1) {
    if (source[i] === '{') profondeur += 1;
    else if (source[i] === '}') {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(debut, i + 1);
    }
  }
  throw new Error(`${nom} : accolades non appariées`);
}

test('F-J T9 — le retour de la garnison ne nomme ni ressource ni réserve', () => {
  // ⚠⚠ C'EST LA PHRASE DE `RETOUR_DEFENSES` MISE À L'ÉPREUVE. Elle écrit depuis
  // le lot RETOUR-DÉFENSES : « ET C'EST GRATUIT, DONC IL N'Y A NI RÉSERVE NI
  // RESSOURCE. Rien ici ne ressemble à `REPARATION_BASE_JOUEUR` au-dessus. »
  // C'était une AFFIRMATION que rien ne mesurait — exactement la faute que le
  // lot FICHE-JUSTE répare pour le voisinage. Ethan, 06/09 : « Complexe
  // seulement du temps. »
  //
  // ⚠ ET C'EST CE QUI SÉPARE LES DEUX MÉCANISMES DE CE MODULE. La réparation
  // d'un BÂTIMENT coûte du quartz pour de bon — `reparerUnBatiment` le débite —
  // et `REPARATION_BASE_JOUEUR` a raison de dire « il paie ». Le RETOUR d'une
  // défense, lui, ne se paie pas. Les fondre serait la faute ; ce test tient les
  // deux moitiés séparées.
  const source = sansCommentaires(readFileSync(join(RACINE, 'src/sim/reparation.js'), 'utf8'));
  const INTERDITS = [
    'ressources', 'reserveReparation', 'reserveReparationBatiments',
    'quartz', 'scorie', 'electricite', 'coutDeMontee', 'coutDeLaReparation',
  ];
  for (const nom of ['pvApresRetour', 'ramenerLaGarnison', 'ticksDeRetour']) {
    const corps = corpsDe(source, nom);
    for (const mot of INTERDITS) {
      assert.ok(!corps.includes(mot),
        `${nom} nomme « ${mot} » : le retour de la garnison s'est mis à coûter`);
    }
  }

  // ⚠ ET LE MOTIF N'EST PAS AVEUGLE : les mêmes mots sont bien présents dans le
  // module, du côté qui paie. Sans cette ligne, huit `includes` sur une chaîne
  // vide passeraient tout aussi bien.
  const paie = corpsDe(source, 'reparerUnBatiment');
  assert.ok(paie.includes('quartz'),
    'la réparation d\'un bâtiment ne nomme plus le quartz : le test ne discrimine rien');

  // ⚠ ET LA MESURE SE FAIT AUSSI PAR EXÉCUTION, pas seulement sur le texte : un
  // retour complet ne bouge ni les stocks, ni les quatre réserves.
  const etat = baseAvecComplexe(5);
  const piece = abimerLaPiece(poserEnGarnison(etat, 'merlon', 5), 1);
  const laBase = baseCourante(etat);
  const avant = JSON.stringify({
    ressources: laBase.economie.ressources,
    reserves: laBase.reserveReparation,
    batiments: laBase.reserveReparationBatiments,
  });
  assert.ok(piece.degatsMilli > 0, 'le montage ne porte aucune pièce abîmée');
  // ⚠ DEUX APPELS, ET IL EN FAUT DEUX : le premier STAMPE la pièce et applique
  // le palier de 70 %, le second sert la rampe une fois le temps écoulé. Un seul
  // appel après l'avance ferait partir la rampe de là, et la pièce resterait à
  // 70 % — c'est ce que la première écriture de ce montage a mesuré.
  ramenerLaGarnison(etat);
  etat.horloge.nbTicks += TICKS_PAR_HEURE * 48;
  ramenerLaGarnison(etat);
  assert.equal(piece.degatsMilli, 0, 'la pièce n\'est pas revenue : le montage ne mesure rien');
  assert.equal(JSON.stringify({
    ressources: laBase.economie.ressources,
    reserves: laBase.reserveReparation,
    batiments: laBase.reserveReparationBatiments,
  }), avant, 'le retour de la garnison a dépensé quelque chose');
});
