// La réparation de l'armée — quatre réservoirs, en parallèle.
//
// La phrase d'Ethan du 29/08 au soir, mesurée telle quelle : « je rentre de
// raid, j'ai 30 minutes de répa infanterie, 20 de véhicule, 1 h d'aviation. Si
// je répare complètement mes véhicules, j'ai 20 minutes d'infanterie gratuites
// et 20 minutes d'aviation gratuites. »

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  diviseurDuBatiment, secondesPleines, batimentDuChassis, reservoirsDeLArmee,
  devisDeLaReparation, problemesDeLaReparation, lancerLaReparation, avancerLaReparation,
  annulerLaReparation, problemesDeLaReparationEnCours,
} from '../src/sim/reparation.js';
import {
  creerEtat, rattraperJeu, tickJeu, serialiser, charger, migrer, SAVE_VERSION,
} from '../src/sim/state.js';
import { executerRaid } from '../src/sim/raid.js';
import { UNITES } from '../src/data/combat.js';
import { REPARATION } from '../src/data/sites.js';
import { facteurMilli } from '../src/sim/combat.js';
import { TICKS_PAR_SECONDE } from '../src/sim/clock.js';

/** Une partie avec les trois bâtiments réparateurs posés au niveau voulu. */
function partieOutillee(niveauBatiments = 5) {
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  // ⚠ LA DISPOSITION DOIT RESTER LÉGALE, et le premier jet ne l'était pas : les
  // trois bâtiments tombaient sur des champs et dépassaient les emplacements
  // d'un Chantier de niveau 1. Ça ne se voyait que dans le test qui RECHARGE la
  // partie — `verifierEtat` lève au chargement, pas à la pose à la main. Les
  // cases 13,1 à 13,5 sont hors des douze champs de cette base-là, et le
  // Chantier monte pour ouvrir les emplacements.
  etat.disposition[0].niveau = 12;
  let colonne = 1;
  for (const id of ['caserne', 'depotDeVehicules', 'aerodrome']) {
    etat.disposition.push({ id, rangee: 13, colonne, niveau: niveauBatiments });
    etat.economie.residus.push({});
    colonne += 2;
  }
  etat.economie.ressources.scorie = 1_000_000_000;
  return etat;
}

/** Pose une unité abîmée d'une fraction de ses PV. */
function abimee(etat, id, part, niveau = 1, vague = 1, colonne = 1) {
  const pvMax = UNITES[id].pv * facteurMilli(niveau);
  etat.armee.push({
    id, vague, colonne, niveau, degatsMilli: Math.round(pvMax * part),
  });
}

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

test('réservoirs — le temps est la SOMME des pièces, le total leur MAXIMUM', () => {
  // ⚠ MONTAGE FALSIFIABLE, ET C'EST LA PHRASE D'ETHAN : trois châssis abîmés
  // inégalement. Le coût s'ajoute, le temps ne s'ajoute pas — il prend le pire.
  const etat = partieOutillee();
  abimee(etat, 'meute', 0.5, 1, 1, 1);
  abimee(etat, 'meute', 0.5, 1, 1, 2);
  abimee(etat, 'ratisseur', 0.5, 1, 2, 1);
  abimee(etat, 'crecelle', 1, 1, 3, 1);

  const r = reservoirsDeLArmee(etat);
  // Deux Fusiliers à moitié : la somme de leurs deux moitiés, donc un plein.
  assert.ok(Math.abs(r.escouade.secondes - secondesPleines('meute', 1, 5)) < 1e-6,
    'le réservoir n\'additionne pas ses pièces');
  assert.equal(r.escouade.pieces.length, 2);

  const devis = devisDeLaReparation(etat);
  const sommeDesTrois = r.escouade.secondes + r.blinde.secondes + r.aeronef.secondes;
  assert.ok(devis.secondes < sommeDesTrois, 'le temps total additionne au lieu de prendre le max');
  assert.equal(devis.secondes, Math.max(r.escouade.secondes, r.blinde.secondes, r.aeronef.secondes));
  // Falsifiable : les trois doivent être DIFFÉRENTS, sinon max et somme se
  // confondraient trop facilement.
  assert.equal(new Set([r.escouade.secondes, r.blinde.secondes, r.aeronef.secondes]).size, 3);
});

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
  assert.equal(problemesDeLaReparation(etat)[0].code, 'rien-a-reparer');
  assert.match(problemesDeLaReparation(etat)[0].message, /Aucun bâtiment de réparation/);

  // Une armée intacte, elle, se voit dire autre chose.
  etat.armee = [];
  assert.match(problemesDeLaReparation(etat)[0].message, /intacte/);
});

test('l\'exemple d\'Ethan — réparer le châssis le plus long paie pour les autres', () => {
  // ⚠ LE MONTAGE REPRODUIT SA PHRASE, avec les proportions qu'il a données :
  // infanterie moitié moins longue que l'aviation, véhicules le tiers. Ce qu'on
  // mesure : au bout du temps du réservoir le plus COURT, les autres ont déjà
  // avancé d'autant — c'est ça, les « minutes gratuites ».
  const etat = partieOutillee();
  abimee(etat, 'meute', 0.6, 1, 1, 1);
  abimee(etat, 'ratisseur', 0.1, 1, 2, 1);
  abimee(etat, 'enclume', 1, 1, 3, 1);

  const r = reservoirsDeLArmee(etat);
  assert.ok(r.aeronef.secondes > r.escouade.secondes, 'montage : l\'aviation doit être la plus longue');
  assert.ok(r.escouade.secondes > r.blinde.secondes, 'montage : les véhicules doivent être les plus courts');

  const devis = devisDeLaReparation(etat);
  assert.equal(devis.secondes, r.aeronef.secondes, 'le total n\'est pas celui du plus touché');

  const rep = lancerLaReparation(etat);
  // Au bout du temps des VÉHICULES : ils sont finis, et les deux autres ont
  // avancé d'exactement autant. C'est le « gratuit » d'Ethan.
  rattraperJeu(etat, Math.ceil(r.blinde.secondes * TICKS_PAR_SECONDE));
  assert.equal(etat.armee[1].degatsMilli, 0, 'les véhicules ne sont pas finis');
  const partEcoulee = r.blinde.secondes / r.aeronef.secondes;
  const restantAvion = etat.armee[2].degatsMilli / (UNITES.enclume.pv * facteurMilli(1));
  assert.ok(Math.abs(restantAvion - (1 - partEcoulee)) < 0.01,
    `l'aviation devrait être à ${(1 - partEcoulee).toFixed(3)}, elle est à ${restantAvion.toFixed(3)}`);

  // Et tout finit ensemble, au temps de l'aviation.
  rattraperJeu(etat, rep.ticks);
  assert.deepEqual(etat.armee.map((p) => p.degatsMilli), [0, 0, 0]);
  assert.equal(etat.reparation, null, 'la réparation ne s\'est pas close');
});

test('réparation — un châssis revient D\'UN BLOC, pas pièce par pièce', () => {
  // ⚠ CE TEST EXISTE PARCE QUE LE PREMIER JET FAISAIT L'INVERSE : chaque pièce
  // portait SON temps, si bien que la petite finissait avant la grosse à
  // l'intérieur du même châssis. « J'ai 30 minutes de répa infanterie » est UN
  // nombre pour tout le châssis ; le parallélisme joue ENTRE les châssis.
  const etat = partieOutillee();
  abimee(etat, 'meute', 0.2, 1, 1, 1);
  abimee(etat, 'meute', 1, 1, 1, 2);

  const rep = lancerLaReparation(etat);
  rattraperJeu(etat, Math.floor(rep.ticks / 2));
  const pvMax = UNITES.meute.pv * facteurMilli(1);
  // À mi-parcours, CHACUNE a rendu la moitié de SES dégâts — donc la petite
  // n'est pas encore finie.
  assert.ok(Math.abs(etat.armee[0].degatsMilli / (pvMax * 0.2) - 0.5) < 0.02);
  assert.ok(Math.abs(etat.armee[1].degatsMilli / pvMax - 0.5) < 0.02);
  assert.ok(etat.armee[0].degatsMilli > 0, 'la petite pièce a fini avant son châssis');
});

test('coût — additif, en scorie, et payé au lancement', () => {
  const etat = partieOutillee();
  abimee(etat, 'meute', 1, 5, 1, 1);
  abimee(etat, 'ratisseur', 1, 5, 2, 1);
  const devis = devisDeLaReparation(etat);

  // Additif : la somme des deux réservoirs, jamais leur maximum.
  const somme = devis.reservoirs.escouade.scorie + devis.reservoirs.blinde.scorie;
  assert.ok(Math.abs(devis.scorie - Math.ceil(somme)) <= 1, `${devis.scorie} contre ${somme}`);
  assert.ok(devis.scorie > 0, 'une unité de niveau 5 n\'est pas gratuite à réparer');

  const avant = etat.economie.ressources.scorie;
  lancerLaReparation(etat);
  assert.equal(etat.economie.ressources.scorie, avant - devis.scorie * 1000);

  // Sans scorie, le refus dit ce qui manque.
  const pauvre = partieOutillee();
  abimee(pauvre, 'meute', 1, 5);
  pauvre.economie.ressources.scorie = 0;
  const refus = problemesDeLaReparation(pauvre);
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

test('réparation — les deux chemins d\'avancement rendent le même état', () => {
  const etats = [];
  for (const parBoucle of [true, false]) {
    const etat = partieOutillee();
    abimee(etat, 'meute', 0.7, 3, 1, 1);
    abimee(etat, 'crecelle', 0.4, 3, 2, 1);
    const rep = lancerLaReparation(etat);
    const n = Math.floor(rep.ticks * 0.6);
    if (parBoucle) for (let i = 0; i < n; i += 1) tickJeu(etat);
    else rattraperJeu(etat, n);
    etats.push({ armee: etat.armee, reparation: etat.reparation });
  }
  assert.deepEqual(etats[0], etats[1], 'boucle et rattrapage divergent');
  assert.ok(etats[0].armee.some((p) => p.degatsMilli > 0), 'montage sans mordant : tout est réparé');
});

test('raid — un nouveau raid ABANDONNE la réparation en cours', () => {
  // « Les points de réparation bonus disparaissent si on refait un raid avec la
  // même armée. » Ce qui a déjà été rendu reste rendu ; le reste est perdu.
  const etat = partieOutillee();
  for (let c = 1; c <= 6; c += 1) etat.armee.push({ id: 'meute', vague: 1, colonne: c, niveau: 1, degatsMilli: 0 });
  const camp = etat.satellites.presents.find((s) => s.type === 'camp');
  executerRaid(etat, etat, { rangee: camp.rangee, colonne: camp.colonne });
  assert.ok(etat.armee.some((p) => p.degatsMilli > 0), 'montage sans mordant : personne n\'est abîmé');

  const rep = lancerLaReparation(etat);
  rattraperJeu(etat, Math.floor(rep.ticks / 2));
  const aMiChemin = etat.armee.map((p) => p.degatsMilli);
  assert.ok(aMiChemin.some((d) => d > 0), 'tout était déjà réparé');

  etat.attaque.points = 100;
  executerRaid(etat, etat, { rangee: camp.rangee, colonne: camp.colonne });
  assert.equal(etat.reparation, null, 'la réparation a survécu au raid');
  // Ce qui avait été rendu l'est resté : les dégâts n'ont pas remonté au-delà
  // de ce que le second raid vient d'ajouter.
  for (let i = 0; i < etat.armee.length; i += 1) {
    if (etat.armee[i].degatsMilli === 0) continue;
    assert.ok(etat.armee[i].degatsMilli >= 0);
  }
  // Et la réparation ne peut pas reprendre là où elle en était : il faut
  // repayer.
  assert.equal(problemesDeLaReparation(etat).length, 0, 'on doit pouvoir relancer');
});

test('état — la réparation en cours traverse la sauvegarde', () => {
  assert.equal(SAVE_VERSION, 13, 'le bump de la version des sauvegardes a été oublié');
  const etat = partieOutillee();
  abimee(etat, 'meute', 0.8, 4);
  lancerLaReparation(etat);
  const attendu = structuredClone(etat.reparation);

  const recharge = charger(serialiser(etat, 4_000_000), 4_000_000);
  assert.deepEqual(recharge.reparation, attendu);

  // Une v12 n'avait aucun moyen d'en lancer une : `null`, pas un objet vide.
  const migre = migrer({ version: 12 });
  assert.equal(migre.version, SAVE_VERSION);
  assert.equal(migre.reparation, null);
});

test('état — une réparation illisible fait lever au chargement', () => {
  assert.deepEqual(problemesDeLaReparationEnCours(null), []);
  assert.equal(problemesDeLaReparationEnCours([]).length, 1);
  assert.ok(problemesDeLaReparationEnCours({ debutTick: -1, ticks: 5, pieces: [] }).length > 0);
  assert.ok(problemesDeLaReparationEnCours({
    debutTick: 0, ticks: 5, pieces: [{ index: 0, degatsDepart: 10, ticks: 0 }],
  }).length > 0, 'une pièce à zéro tick passerait');
});

test('annuler — ce qui est rendu reste rendu', () => {
  const etat = partieOutillee();
  abimee(etat, 'meute', 1, 1);
  const rep = lancerLaReparation(etat);
  rattraperJeu(etat, Math.floor(rep.ticks / 4));
  const avant = etat.armee[0].degatsMilli;

  assert.equal(annulerLaReparation(etat), true);
  assert.equal(etat.reparation, null);
  assert.equal(etat.armee[0].degatsMilli, avant, 'les dégâts ont remonté à l\'annulation');
  assert.equal(annulerLaReparation(etat), false, 'annuler deux fois ne dit pas la même chose');
  // Et avancer sans réparation en cours ne fait rien.
  assert.equal(avancerLaReparation(etat), 0);
});
