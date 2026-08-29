// Les points d'attaque — plafond à cliquet, régénération, barème du raid.
//
// Arbitrages du 29/08 assertés ici, avec les nombres qu'Ethan a dits lui-même :
// 158 points pour une armée moyenne au niveau 5,8, 600 au niveau 50, 25 points
// pour une cible à cinq cases hors du territoire, et un plafond qui ne
// redescend pas quand l'armée est démantelée.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DIVISEUR_REGENERATION, plafondDuNiveau, plafondVise, creerPointsAttaque,
  releverPlafond, regenerer, avancerPointsAttaque, distanceTchebychev,
  estEnTerritoireAllie, coutDuRaid, coutDUnRaid, manquePourPayer, payer,
  basesDuJoueur,
} from '../src/sim/points-attaque.js';
import { creerEtat, tickJeu, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION } from '../src/sim/state.js';
import { POINTS_ATTAQUE, GEOGRAPHIE } from '../src/data/sites.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';

/** Une armée dont la moyenne vaut exactement le niveau demandé, en dixièmes. */
function armeeAuNiveau(...niveaux) {
  return niveaux.map((niveau) => ({ id: 'fusiliers', niveau }));
}

/** Une base nue, telle que le module la lit : une position et une armée. */
function base(rangee, colonne, armee = []) {
  return { position: { rangee, colonne }, armee };
}

test('plafond — 100 sans armée, 158 à 5,8, 600 au niveau 50', () => {
  // Montage falsifiable : les trois niveaux DOIVENT donner trois plafonds
  // différents, sinon la formule ne serait pas mise à l'épreuve. Et 5,8 n'est
  // pas un rond : c'est le chiffre qu'Ethan a donné pour valider la
  // proportionnalité jusqu'au dixième.
  assert.equal(plafondDuNiveau(null), 100, 'aucune armée posée : le plafond de base');
  assert.equal(plafondDuNiveau(58), 158, '5,8 → 158, le nombre dicté par Ethan');
  assert.equal(plafondDuNiveau(500), 600, '50,0 → 600, la fin de course');

  // Et 5,8 se MESURE sur une vraie armée, il ne se pose pas à la main :
  // [5, 6, 6, 6] a pour moyenne 5,75, qui monte à 5,8.
  assert.equal(plafondVise([base(0, 0, armeeAuNiveau(5, 6, 6, 6))]), 158);
});

test('plafond — le MAXIMUM sur les bases, pas la moyenne des moyennes', () => {
  // Montage falsifiable : deux bases très inégales. Une moyenne des moyennes
  // rendrait 130, un minimum rendrait 110 ; seul le maximum rend 158.
  const bases = [base(0, 0, armeeAuNiveau(1)), base(0, 40, armeeAuNiveau(5, 6, 6, 6))];
  assert.equal(plafondVise(bases), 158);
  assert.equal(plafondVise([...bases].reverse()), 158, 'l\'ordre des bases ne compte pas');

  // Une base sans armée ne tire pas le plafond vers le bas : elle ne compte pas.
  assert.equal(plafondVise([base(0, 0), base(0, 40, armeeAuNiveau(50))]), 600);
});

test('plafond — le CLIQUET : il monte, il ne redescend jamais', () => {
  // ⚠ MONTAGE FALSIFIABLE : le plafond doit d'abord AVOIR MONTÉ, sinon
  // « il n'a pas baissé » ne dirait rien. On le fait donc monter par le chemin
  // réel — un tick de jeu —, puis on démantèle l'armée, puis on retique.
  const etat = creerEtat(2026);
  assert.equal(etat.attaque.plafond, 100, 'une base neuve n\'a pas d\'armée');

  etat.armee = armeeAuNiveau(5, 6, 6, 6);
  tickJeu(etat);
  assert.equal(etat.attaque.plafond, 158, 'le plafond n\'a pas suivi l\'armée');

  // « Si tu supprimes complètement ton armée pour en refaire une autre, ça ne
  // va pas toucher au plafond » — Ethan, 29/08. Un plafond DÉRIVÉ rendrait 100.
  etat.armee = [];
  tickJeu(etat);
  assert.equal(etat.attaque.plafond, 158, 'le plafond a suivi l\'armée démantelée');

  // Et il remonte encore quand une meilleure armée arrive.
  etat.armee = armeeAuNiveau(50);
  tickJeu(etat);
  assert.equal(etat.attaque.plafond, 600);

  // `releverPlafond` dit s'il a bougé — c'est ce que l'écran voudra savoir.
  assert.equal(releverPlafond(etat.attaque, 300), false, '300 < 600 : rien ne bouge');
  assert.equal(etat.attaque.plafond, 600);
});

test('régénération — 20 % du plafond par heure, mesuré sur une heure', () => {
  // ⚠ MONTAGE FALSIFIABLE : il faut DÉPENSER d'abord. Un état plein resterait
  // plein quoi que fasse la régénération, et le test passerait sur du code qui
  // ne régénère rien du tout.
  const pa = creerPointsAttaque(100);
  payer(pa, 50);
  regenerer(pa, TICKS_PAR_HEURE);
  assert.equal(pa.points, 70, 'plafond 100 : 20 points par heure');

  const haut = creerPointsAttaque(600);
  payer(haut, 300);
  regenerer(haut, TICKS_PAR_HEURE);
  assert.equal(haut.points, 420, 'plafond 600 : 120 points par heure');

  // ⚠ ET C'EST LA MÊME CHOSE QUE `20 + 2 × niveau`, la table d'origine du relevé
  // TA : la part remplace la formule sans changer un seul débit. Les deux bornes
  // ci-dessus SONT ses deux colonnes.
  assert.equal(POINTS_ATTAQUE.regenerationParHeure.partDuPlafondPourCent, 20);
});

test('régénération — cinq heures font le plein, à la borne près', () => {
  // Le plein en cinq heures est la propriété que porte la table, et elle vaut
  // pour TOUS les plafonds puisque le débit en est une fraction. On la mesure
  // au tick près : à un tick de la fin, il manque encore un point.
  for (const plafond of [100, 158, 600]) {
    const pa = creerPointsAttaque(plafond);
    pa.points = 0;
    regenerer(pa, DIVISEUR_REGENERATION - 1);
    assert.equal(pa.points, plafond - 1, `plafond ${plafond} : plein trop tôt`);

    const juste = creerPointsAttaque(plafond);
    juste.points = 0;
    regenerer(juste, DIVISEUR_REGENERATION);
    assert.equal(juste.points, plafond, `plafond ${plafond} : plein pas atteint`);
  }
  // Cinq heures, c'est bien ce que vaut le diviseur.
  assert.equal(DIVISEUR_REGENERATION, 5 * TICKS_PAR_HEURE);
});

test('régénération — les deux chemins d\'avancement donnent le même compte', () => {
  // ⚠ MONTAGE FALSIFIABLE, ET C'EST LA LEÇON DU LOT SATELLITES : le plafond
  // choisi NE DOIT PAS diviser le diviseur, sinon un tick entier suffirait à
  // gagner un point rond et une implémentation naïve — `Math.floor(plafond /
  // DIVISEUR)` à chaque tick — passerait. À 158, ce quotient vaut ZÉRO : le
  // chemin tick-par-tick ne gagnerait jamais rien, et l'écart avec le chemin
  // groupé serait total.
  // ⚠ ET LE MORDANT NE TIENT PAS AU TAUX : il tient à ce que 158 ne divise pas
  // le diviseur, ce que la ligne suivante vérifie au lieu de le supposer. Passer
  // de 10 % à 20 % a changé le diviseur sans rien changer à la démonstration.
  assert.notEqual(DIVISEUR_REGENERATION % 158, 0, 'le montage a perdu son mordant');

  const nbTicks = 5000;
  const unParUn = creerPointsAttaque(158);
  unParUn.points = 0;
  for (let i = 0; i < nbTicks; i++) regenerer(unParUn, 1);

  const dUnCoup = creerPointsAttaque(158);
  dUnCoup.points = 0;
  regenerer(dUnCoup, nbTicks);

  assert.deepEqual(unParUn, dUnCoup, 'rattrapage et boucle divergent');
  // Et le compte n'est pas trivialement nul : 158 × 5 000 / 180 000 = 4,39.
  assert.equal(dUnCoup.points, 4);
});

test('régénération — jamais au-dessus du plafond, et le résidu retombe', () => {
  const pa = creerPointsAttaque(100);
  payer(pa, 1);
  regenerer(pa, TICKS_PAR_HEURE * 100);
  assert.equal(pa.points, 100, 'le plafond a été dépassé');
  assert.equal(pa.residu, 0, 'un résidu survit au plein : un point gratuit après la dépense');

  // Le résidu reste borné en toutes circonstances.
  const long = creerPointsAttaque(158);
  long.points = 0;
  for (const n of [1, 7, 999, 123456]) {
    regenerer(long, n);
    assert.ok(long.residu >= 0 && long.residu < DIVISEUR_REGENERATION, `résidu ${long.residu}`);
  }
});

test('barème — 10 fixes, +1 par case chez soi, +3 ailleurs', () => {
  assert.equal(coutDuRaid(1, true), 11, 'au plus près, chez soi');
  assert.equal(coutDuRaid(2, true), 12);
  // L'exemple d'Ethan, mot pour mot : « une cible à cinq cases de la base du
  // joueur qui attaque, en territoire ennemi, ça fait dix plus quinze ».
  assert.equal(coutDuRaid(5, false), 25);
  assert.equal(coutDuRaid(GEOGRAPHIE.rayonAttaque, false), 40, 'le plus cher possible');

  // Les deux tarifs sont bien DIFFÉRENTS — sans quoi tout ce qui suit ne
  // mesurerait rien.
  assert.notEqual(coutDuRaid(3, true), coutDuRaid(3, false));

  // Hors bornes : zéro case n'est pas un raid, onze cases sont hors de portée.
  assert.throws(() => coutDuRaid(0, true), RangeError);
  assert.throws(() => coutDuRaid(GEOGRAPHIE.rayonAttaque + 1, false), RangeError);
  assert.throws(() => coutDuRaid(3, 'allie'), TypeError);
});

test('territoire — le rayon est celui de GEOGRAPHIE, et il vaut 2', () => {
  const bases = [base(100, 10)];
  assert.equal(GEOGRAPHIE.rayonInfluenceJoueur, 2, 'arbitré le 29/08 : « on garde deux »');

  assert.ok(estEnTerritoireAllie({ rangee: 102, colonne: 12 }, bases), 'la diagonale à 2 est chez soi');
  assert.ok(!estEnTerritoireAllie({ rangee: 103, colonne: 10 }, bases), 'à 3 cases on n\'y est plus');

  // ⚠ CONSÉQUENCE MESURÉE, et elle contredit l'exemple oral d'Ethan : un camp à
  // trois cases coûte 19, pas 13, parce qu'à rayon 2 le tarif à +1 ne couvre
  // que les cases à 1 et 2. Le tarif bon marché ne va donc jamais au-delà de 12.
  const etat = { position: { rangee: 100, colonne: 10 }, armee: [] };
  assert.equal(coutDUnRaid(etat, base(100, 10), { rangee: 103, colonne: 10 }), 19);
  assert.equal(coutDUnRaid(etat, base(100, 10), { rangee: 102, colonne: 10 }), 12);
});

test('territoire — c\'est l\'UNION des zones, pas celle de la base qui attaque', () => {
  // ⚠ MONTAGE FALSIFIABLE ET TOURNÉ VERS LE PLURIEL : la cible est à SIX cases
  // de la base qui part — donc largement hors de sa propre zone — mais à deux
  // cases d'une seconde base. Un code qui ne regarderait que la base attaquante
  // rendrait 28 ; l'union rend 16.
  const attaquante = base(100, 10);
  const seconde = base(108, 10);
  const cible = { rangee: 106, colonne: 10 };
  assert.equal(distanceTchebychev(attaquante.position, cible), 6);
  assert.equal(distanceTchebychev(seconde.position, cible), 2);

  assert.ok(!estEnTerritoireAllie(cible, [attaquante]), 'montage sans mordant');
  assert.ok(estEnTerritoireAllie(cible, [attaquante, seconde]));
  assert.equal(coutDuRaid(6, estEnTerritoireAllie(cible, [attaquante, seconde])), 16);
  assert.equal(coutDuRaid(6, estEnTerritoireAllie(cible, [attaquante])), 28);
});

test('territoire — le singulier d\'aujourd\'hui tient en UNE fonction', () => {
  // `basesDuJoueur` est le seul endroit du module qui sache qu'il n'y a qu'une
  // base. Le jour du pluriel, elle seule change — le test le dit à qui lira.
  const etat = creerEtat(7);
  const bases = basesDuJoueur(etat);
  assert.equal(bases.length, 1);
  assert.equal(bases[0].position, etat.position, 'la base d\'aujourd\'hui EST l\'état');
});

test('payer — le manque est un nombre, et rien ne bouge quand ça manque', () => {
  const pa = creerPointsAttaque(100);
  payer(pa, 40);
  assert.equal(pa.points, 60);
  assert.equal(manquePourPayer(pa, 40), null, '60 points couvrent 40');
  assert.equal(manquePourPayer(pa, 67), 7, 'il manque exactement 7 points');

  assert.throws(() => payer(pa, 67), RangeError);
  assert.equal(pa.points, 60, 'un paiement refusé a quand même débité');
});

test('état — une partie neuve démarre LE PLEIN, et le tick ne le dépasse pas', () => {
  const etat = creerEtat(2026);
  assert.deepEqual(etat.attaque, { points: 100, plafond: 100, residu: 0 });

  // Mille ticks sur un état plein : rien ne monte, rien ne déborde.
  for (let i = 0; i < 1000; i++) tickJeu(etat);
  assert.deepEqual(etat.attaque, { points: 100, plafond: 100, residu: 0 });

  // Et le rattrapage suit le même chemin que la boucle, jusque dans le résidu.
  const boucle = creerEtat(2026);
  boucle.attaque.points = 0;
  const groupe = creerEtat(2026);
  groupe.attaque.points = 0;
  for (let i = 0; i < 4321; i++) tickJeu(boucle);
  rattraperJeu(groupe, 4321);
  assert.deepEqual(boucle.attaque, groupe.attaque, 'les deux chemins de l\'état divergent');
  assert.ok(boucle.attaque.points > 0, 'montage sans mordant : rien n\'a été régénéré');
});

test('état — le cliquet traverse la sauvegarde, points compris', () => {
  // ⚠ MONTAGE FALSIFIABLE, ET IL VISE LE CLIQUET : on monte le plafond à 600,
  // puis on recharge une partie dont l'ARMÉE EST VIDE. Un plafond dérivé de
  // l'armée au chargement rendrait 100 ; seul un plafond rangé dans la
  // sauvegarde rend 600. C'est la propriété qui coûte un champ sauvegardé, donc
  // c'est celle qu'il faut mesurer.
  const etat = creerEtat(31);
  releverPlafond(etat.attaque, 600);
  assert.equal(etat.attaque.points, 100, 'un plafond qui monte ne DONNE pas de points');
  payer(etat.attaque, 25);
  const attendu = { ...etat.attaque };

  // Même instant des deux côtés : aucune absence à rattraper, donc rien ne
  // régénère entre l'écriture et la lecture.
  const recharge = charger(serialiser(etat, 1_000_000), 1_000_000);
  assert.deepEqual(recharge.armee, [], 'montage sans mordant : il reste une armée');
  assert.deepEqual(recharge.attaque, attendu, 'le champ n\'a pas survécu au tour');
  assert.equal(recharge.attaque.plafond, 600, 'le plafond acquis s\'est perdu au chargement');
});

test('migration — v9 → v10 donne le plein, et le plafond de l\'armée sauvegardée', () => {
  assert.equal(SAVE_VERSION, 10, 'le bump de la version des sauvegardes a été oublié');

  // Une v9 qui avait déjà une armée : elle mérite son plafond, et le cliquet ne
  // pourra plus le lui rendre après coup.
  const v9 = { version: 9, armee: [{ id: 'fusiliers', niveau: 6 }, { id: 'fusiliers', niveau: 5 }] };
  const migre = migrer(structuredClone(v9));
  assert.equal(migre.version, 10);
  assert.deepEqual(migre.attaque, { points: 155, plafond: 155, residu: 0 }, '5,5 → 155');

  // Une v9 sans armée retombe sur le plafond de base, plein lui aussi.
  const nu = migrer({ version: 9, armee: [] });
  assert.deepEqual(nu.attaque, { points: 100, plafond: 100, residu: 0 });
});
