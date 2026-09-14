// Tests T1 et T2 du brief du lot FREIN — trois étages sur le décalage de la
// défense : freiner, tenir sa cible, rentrer.
//
// Ethan, 13/09/2026, point 1 : « Les unités défensives en déplacement latéral
// semblent aller très vite. » Arbitrage **A** (frein) et **C3** (hystérésis),
// puis « Défense : les unités reviennent à leur position initiale si leur cible
// de prédilection est morte » — lu **β** : le retour au poste n'a lieu que
// lorsqu'il ne reste AUCUNE cible de prédilection sur la grille.
//
// ```
// A   une cible de prédilection est à portée          → on ne bouge pas
// C3  sinon, la cible retenue est encore valide       → on va vers elle
// β   sinon, plus une cible de prédilection en jeu    → on rentre au poste
// ```
//
// ⚠⚠ LE RETOUR EN DERNIER : une pièce en chemin vers son poste doit s'arrêter
// dès qu'une cible entre à portée. L'ordre inverse produirait une sentinelle qui
// rentre en ignorant ce qu'elle a sous le canon.
//
// ⚠⚠ ET CE FICHIER PORTE DEUX TESTS, PAS QUATRE. La démonstration des gardes de
// `doitSArreter` côté défense, celle de `SAVE_VERSION` et le décompte des
// écrasements latéraux sont des MESURES : elles vont au rapport du lot, pas dans
// un verrou. Un test qui fige une mesure de contexte fige aussi le contexte.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GRILLE } from '../src/data/combat.js';
import { creerCombat, tick } from '../src/sim/combat.js';
import { MILLI_PAR_CASE } from '../src/sim/grille.js';

/** La rangée d'où part une vague — dérivée de la bande, jamais écrite « 2 ». */
const DEPART = GRILLE.bandes.deploiement.derniere;

const CADRE = {
  niveau: 1,
  obstacles: [],
  modulesDebloques: {
    ouvrage: { offense: [], defense: [] },
    joueur: { offense: [], defense: [] },
  },
};

/**
 * Fait tourner un combat et relève le trajet LATÉRAL de l'unique défenseuse :
 * ticks de déplacement, ticks de tir, inversions de sens, parcours cumulé.
 *
 * ⚠ LE TIR SE COMPTE SUR `aTire`, POSÉ À L'ÉTAPE 5, ET LE DÉPLACEMENT SUR
 * `colonneMilli`, ÉCRIT À L'ÉTAPE 7. Les deux se lisent après le tick, donc dans
 * le même instantané : un tick où la pièce tire ET se décale compte des deux
 * côtés, ce qui est exactement ce qu'on veut savoir.
 */
function trajet(montage, idDefenseuse, ticksMax = 400) {
  const etat = creerCombat(montage);
  const d = etat.entites.find((e) => e.id === idDefenseuse);
  assert.ok(d !== undefined, `le montage ne porte pas de « ${idDefenseuse} » en défense`);
  const poste = d.colonneMilli;
  const cases = [Math.floor(d.colonneMilli / MILLI_PAR_CASE)];
  let voyage = 0;
  let tirs = 0;
  let inversions = 0;
  let parcours = 0;
  let ecartMax = 0;
  let sensPrecedent = 0;
  for (let t = 1; t <= ticksMax && !etat.termine; t += 1) {
    const avant = d.colonneMilli;
    tick(etat);
    const pas = d.colonneMilli - avant;
    if (pas !== 0) {
      voyage += 1;
      parcours += Math.abs(pas);
      const sens = Math.sign(pas);
      if (sensPrecedent !== 0 && sens !== sensPrecedent) inversions += 1;
      sensPrecedent = sens;
      const c = Math.floor(d.colonneMilli / MILLI_PAR_CASE);
      if (c !== cases[cases.length - 1]) cases.push(c);
    }
    if (d.aTire) tirs += 1;
    ecartMax = Math.max(ecartMax, Math.abs(d.colonneMilli - poste));
  }
  return {
    voyage, tirs, inversions, parcours, ecartMax, poste, cases,
    colonneFinale: d.colonneMilli,
    tick: etat.tick,
    cause: etat.cause,
  };
}

// ---------------------------------------------------------------------------
// FREIN T1 — le voyage est divisé par deux et les inversions disparaissent
// ---------------------------------------------------------------------------

/**
 * Le montage du §3 du brief, à la lettre : un Éclaireur de garnison en colonne
 * 5, rangée 6 ; quatre Fusiliers assaillants en colonnes 1, 3, 7 et 9.
 *
 * ⚠⚠ LA SOUCHE EST EN COLONNE 5, ET CE N'EST PAS INDIFFÉRENT — MESURÉ. Le brief
 * ne dit pas où la poser ; posée en colonne 1 elle tire les assaillants vers le
 * bord et laisse les deux Fusiliers de droite traverser la grille sans jamais
 * entrer à portée, si bien que la défenseuse les réélit quatre ticks avant la
 * fin du raid et repart vers eux — **54 ticks de voyage et une inversion au lieu
 * de 50 et zéro**. Centrée sur la colonne de la défenseuse, elle reproduit au
 * chiffre près la colonne « prototype » du §3. Le montage est donc SYMÉTRIQUE
 * par construction, et c'est ce qui le rend lisible.
 */
const MONTAGE_VOYAGE = {
  ...CADRE,
  batiments: [{ id: 'souche', rangee: 15, colonne: 5, niveau: 1 }],
  defenseurs: [{ id: 'ratisseur', rangee: 6, colonne: 5, niveau: 1 }],
  vagues: [[
    { id: 'meute', colonne: 1, rangee: DEPART, niveau: 1 },
    { id: 'meute', colonne: 3, rangee: DEPART, niveau: 1 },
    { id: 'meute', colonne: 7, rangee: DEPART, niveau: 1 },
    { id: 'meute', colonne: 9, rangee: DEPART, niveau: 1 },
  ]],
};

test('FREIN T1 — la défenseuse voyage deux fois moins et ne fait plus demi-tour', () => {
  const m = trajet(MONTAGE_VOYAGE, 'ratisseur');

  // ⚠⚠ LA MOITIÉ QUI DISCRIMINE, ET ELLE A ÉTÉ VUE ROUGE SUR `main` : le même
  // montage y rend **99 ticks de voyage, 32 de tir, UNE inversion, 7,92 cases
  // parcourues et une colonne finale de 7 000** — la défenseuse descend jusqu'à
  // la colonne 2, sa cible meurt, et elle retraverse toute la grille jusqu'à la
  // 7. Les quatre `notEqual` refusent le retour de ces quatre nombres-là.
  assert.equal(m.inversions, 0,
    'la défenseuse fait encore demi-tour en plein trajet');
  assert.notEqual(m.voyage, 99, 'le voyage est revenu à sa valeur d’avant le lot');
  assert.equal(m.voyage, 50, 'les ticks de voyage ont bougé');
  assert.equal(m.tirs, 31, 'les ticks de tir ont bougé');
  assert.notEqual(m.tirs, 32, 'le tir est revenu à sa valeur d’avant le lot');
  assert.equal(m.parcours, 4 * MILLI_PAR_CASE, 'le parcours latéral cumulé a bougé');
  assert.notEqual(m.parcours, 7920, 'le parcours est revenu à sa valeur d’avant le lot');
  assert.deepEqual(m.cases, [5, 4, 3, 2, 1],
    'la défenseuse ne visite plus les mêmes colonnes');
  assert.equal(m.colonneFinale, MILLI_PAR_CASE, 'la colonne finale a bougé');
  assert.notEqual(m.colonneFinale, 7000, 'la colonne finale est revenue à celle d’avant le lot');

  // ⚠⚠ ET LE BRIEF SE TROMPE ICI, SA PROPRE TABLE LE DIT : il demande
  // d'asserter « ticks de voyage STRICTEMENT INFÉRIEURS aux ticks de tir »,
  // quand le prototype qu'il mesure rend 50 contre 31. L'assertion telle qu'il
  // l'écrit tomberait sur son propre prototype. ⚠ Et le motif qu'il en donne est
  // à l'envers : « sans « voyage < tir » un défenseur immobile le passerait
  // aussi » — un défenseur immobile a un voyage de ZÉRO, donc il PASSE cette
  // clause-là. Ce qui l'attrape est le parcours et les cinq colonnes ci-dessus.
  //
  // La propriété que la clause VOULAIT dire se mesure, elle : le voyage ne
  // dévore plus le tir. Sur `main` il vaut 3,09 fois les ticks de tir ; ici
  // 1,61. La borne est un RAPPORT et non un nombre nu, donc elle tombe sur
  // `main` (99 ≥ 64) et ne se relève pas en réancrant.
  assert.ok(m.voyage < 2 * m.tirs,
    `le voyage (${m.voyage}) dépasse encore le double du tir (${m.tirs})`);

  // ⚠ ET LES DEUX GARDE-FOUS DU BRIEF SONT TENUS : une défenseuse paralysée
  // (tir nul) comme une défenseuse immobile (voyage nul) doivent tomber.
  assert.ok(m.tirs > 0, 'la défenseuse ne tire plus du tout');
  assert.ok(m.voyage > 0, 'la défenseuse ne se décale plus du tout');
  assert.equal(m.cause, 'attaquants', 'le raid ne se conclut plus de la même façon');
});

// ---------------------------------------------------------------------------
// FREIN T2 — β : la pièce rentre à son poste quand sa colonne a quitté le raid
// ---------------------------------------------------------------------------

/**
 * Le montage du §3.1, et c'est le seul qui déclenche β : un Chasseur de garnison
 * en colonne 5 — prédilection VÉHICULE —, un Pionnier assaillant en colonne 9,
 * qui est un blindé donc sa cible, et DEUX Fusiliers en colonnes 1 et 2, qui ne
 * sont pas de sa prédilection et qui font durer le raid.
 *
 * ⚠⚠ LES DEUX FUSILIERS NE SONT PAS DU DÉCOR, ET LE BRIEF LE DIT : avec le seul
 * Pionnier, sa mort TERMINE le raid avant que β ne puisse jouer. β a besoin
 * d'attaquants hors prédilection qui survivent — c'est très exactement la
 * situation qu'Ethan décrit, « les blindés sont morts, l'infanterie continue ».
 */
const MONTAGE_RETOUR = {
  ...CADRE,
  batiments: [{ id: 'souche', rangee: 15, colonne: 5, niveau: 1 }],
  defenseurs: [{ id: 'fendeur', rangee: 6, colonne: 5, niveau: 1 }],
  vagues: [[
    { id: 'belier', colonne: 9, rangee: DEPART, niveau: 1 },
    { id: 'meute', colonne: 1, rangee: DEPART, niveau: 1 },
    { id: 'meute', colonne: 2, rangee: DEPART, niveau: 1 },
  ]],
};

test('FREIN T2 — β : la défenseuse rentre à son poste, et elle en était partie', () => {
  const m = trajet(MONTAGE_RETOUR, 'fendeur', 900);

  // ⚠⚠ VU ROUGE SUR `main` : la défenseuse y finit en **9 000**, échouée à
  // quatre cases de son poste, là où sa cible a disparu. Le `notEqual` refuse le
  // retour de ce nombre-là.
  assert.equal(m.colonneFinale, m.poste,
    'la défenseuse ne rentre pas à son poste une fois sa prédilection sortie du raid');
  assert.notEqual(m.colonneFinale, 9000, 'la colonne finale est revenue à celle d’avant le lot');

  // ⚠⚠ ET SANS CETTE SECONDE MOITIÉ LE TEST MESURERAIT UNE IMMOBILITÉ. Une
  // défenseuse qui n'aurait jamais bougé satisferait l'égalité ci-dessus sans
  // rien prouver de β. Elle s'est écartée de QUATRE cases avant de revenir.
  assert.ok(m.ecartMax >= MILLI_PAR_CASE,
    `la défenseuse ne s'est jamais écartée de son poste (écart max ${m.ecartMax})`);
  assert.equal(m.ecartMax, 4 * MILLI_PAR_CASE, 'l’écart maximal au poste a bougé');
  assert.equal(m.poste, 5 * MILLI_PAR_CASE, 'le poste n’est plus la colonne de pose');
  assert.equal(m.cause, 'attaquants', 'le raid ne se conclut plus de la même façon');
});
