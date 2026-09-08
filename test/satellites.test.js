// Les satellites — camps et avant-poste attachés à la base du joueur.
//
// Ce que ce fichier doit prouver : qu'ils PARAISSENT au bout de cinq minutes et
// pas avant, qu'ils tombent dans leur anneau et nulle part ailleurs, qu'un
// satellite détruit revient, et que les deux chemins d'avancement — tick par
// tick et rattrapage analytique — en produisent exactement les mêmes.
//
// ⚠ CE DERNIER POINT EST LE PLUS FRAGILE DU LOT, et c'est pour ça qu'il a son
// test. Un tirage qui consommerait `etat.rng` passerait toutes les autres
// assertions et casserait celle-là — ou pire, ne la casserait qu'un jour sur dix
// selon le nombre de ticks. La graine d'une apparition se dérive de la partie et
// du numéro d'instance, jamais du flux courant.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TICKS_APPARITION, ANNEAUX, satellitesVides, planifierSatellites,
  resoudreSatellites, detruireSatellite, casesDeLAnneau, niveauDuSatellite,
  problemesDesSatellites, TICKS_DUREE_DE_VIE, TICKS_SURSIS, prolongerApresAttaque,
  PREMIERE_INSTANCE,
} from '../src/sim/satellites.js';
import {
  creerEtat, tickJeu, rattraperJeu, serialiser, charger, SAVE_VERSION, migrer,
} from '../src/sim/state.js';
import { poiDeLaCase } from '../src/sim/poi.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { SATELLITES, TYPES_SITE, GEOGRAPHIE } from '../src/data/sites.js';
import { niveauDeLaRangee } from '../src/sim/carte.js';
import { TICKS_PAR_SECONDE } from '../src/sim/clock.js';
import { estSurLaCarte } from '../src/sim/carte.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { creerRng, entier } from '../src/sim/rng.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { baseCourante } from '../src/sim/base-courante.js';
import { saveurDeLaCase } from '../src/sim/saveur.js';

const T0 = 1_700_000_000_000;
const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

test('satellites — deux camps et un avant-poste, cinq minutes après la fondation', () => {
  const etat = creerEtat(4242);

  // À la fondation, la base est SEULE. C'est ce que le joueur doit voir en
  // ouvrant la partie ; poser les trois d'office sauterait le délai arbitré.
  assert.deepEqual(baseCourante(etat).satellites.presents, []);
  assert.equal(baseCourante(etat).satellites.attentes.length, 3);
  assert.deepEqual(
    baseCourante(etat).satellites.attentes.map((a) => a.type).sort(),
    ['avantPoste', 'camp', 'camp'],
  );

  // ⚠ LE DÉLAI SE CALCULE, IL NE SE RECOPIE PAS. 300 s × 10 ticks/s = 3 000.
  assert.equal(TICKS_APPARITION, SATELLITES.delaiApparitionSec * TICKS_PAR_SECONDE);
  assert.equal(TICKS_APPARITION, 3000);

  // Une seconde avant l'échéance : toujours rien. C'est la moitié falsifiable —
  // sans elle, un code qui poserait tout au premier tick passerait la suite.
  for (let i = 0; i < TICKS_APPARITION - 1; i += 1) tickJeu(etat);
  assert.deepEqual(baseCourante(etat).satellites.presents, [], 'ils paraissent avant l\'heure');

  tickJeu(etat);
  assert.equal(baseCourante(etat).satellites.presents.length, 3);
  assert.deepEqual(baseCourante(etat).satellites.attentes, []);
});

test('satellites — chacun dans son anneau, et jamais sur une base de l\'Ouvrage', () => {
  // Balayé sur plusieurs graines : une seule pourrait tomber juste par hasard.
  for (const graine of [1, 7, 42, 1234, 99]) {
    const etat = creerEtat(graine);
    rattraperJeu(etat, TICKS_APPARITION);
    assert.equal(baseCourante(etat).satellites.presents.length, 3, `graine ${graine}`);

    const vues = new Set();
    for (const s of baseCourante(etat).satellites.presents) {
      const anneau = ANNEAUX[s.type];
      const distance = Math.max(
        Math.abs(s.rangee - baseCourante(etat).position.rangee),
        Math.abs(s.colonne - baseCourante(etat).position.colonne),
      );
      assert.ok(
        distance >= anneau.min && distance <= anneau.max,
        `${s.type} à ${distance} cases, attendu ${anneau.min}…${anneau.max} (graine ${graine})`,
      );
      assert.ok(estSurLaCarte(s.rangee, s.colonne));
      assert.ok(
        !estBaseOuvrage(graine, s.rangee, s.colonne),
        `${s.type} posé sur une base de l'Ouvrage (graine ${graine})`,
      );
      const cle = `${s.rangee}:${s.colonne}`;
      assert.ok(!vues.has(cle), `deux satellites en ${cle} (graine ${graine})`);
      vues.add(cle);
      assert.ok(s.niveau >= 1 && s.niveau <= NIVEAU.plafond);
    }
  }
});

test('satellites — les deux chemins d\'avancement rendent les mêmes satellites', () => {
  // ⚠ CE TEST NE PROUVE PAS CE QU'IL AVAIT L'AIR DE PROUVER, ET LA FALSIFICATION
  // L'A MONTRÉ. Sa première rédaction affirmait qu'un tirage passant par
  // `etat.rng` le ferait tomber. C'est FAUX aujourd'hui : rien d'autre ne
  // consomme le flux pendant un tick — l'économie est analytique et ne tire pas
  // —, donc les deux chemins le consomment identiquement et l'égalité tient
  // même sur du code qui viole la règle. Remplacer `creerRng(...)` par
  // `etat.rng` laissait ce test VERT.
  //
  // Il garde sa valeur — il compare l'état sérialisé entier, ce qui attrape
  // beaucoup — mais la règle « aucun tirage par le flux de l'état » est tenue
  // par le test SUIVANT, qui la mesure de face.
  const parBoucle = creerEtat(4242);
  const parRattrapage = creerEtat(4242);

  const duree = TICKS_APPARITION + 500;
  for (let i = 0; i < duree; i += 1) tickJeu(parBoucle);
  rattraperJeu(parRattrapage, duree);

  assert.equal(baseCourante(parBoucle).satellites.presents.length, 3, 'le montage ne mesure rien s\'ils n\'ont pas paru');
  assert.deepEqual(baseCourante(parBoucle).satellites, baseCourante(parRattrapage).satellites);
  // Et la comparaison qui attrape tout le reste avec : l'état sérialisé entier.
  assert.equal(serialiser(parBoucle, T0), serialiser(parRattrapage, T0));
});

test('satellites — un camp détruit revient, avec un NOUVEAU numéro d\'instance', () => {
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION);
  const avant = baseCourante(etat).satellites.presents.map((s) => s.instance);
  assert.equal(new Set(avant).size, 3, 'les trois instances doivent être distinctes');

  const detruit = { ...baseCourante(etat).satellites.presents[0] };
  detruireSatellite(etat, 0);
  assert.equal(baseCourante(etat).satellites.presents.length, 2);
  assert.equal(baseCourante(etat).satellites.attentes.length, 1);
  assert.equal(baseCourante(etat).satellites.attentes[0].type, detruit.type);

  // ⚠⚠ IL REVIENT TOUT DE SUITE DEPUIS LE LOT SATELLITES-RESPAWN, 06/09/2026 —
  // Ethan, « un camp ou avant poste rasé = un autre pop direct ». Ces trois
  // lignes disaient l'INVERSE et elles avaient raison de tomber : elles
  // asseyaient « rattraper TICKS_APPARITION - 1 laisse 2 présents, le tick
  // suivant en rend 3 ». C'est UN tick qui suffit désormais, et le montage est
  // réancré en écrivant les deux règles plutôt qu'en assouplissant l'assertion.
  assert.equal(baseCourante(etat).satellites.attentes[0].tickDu, etat.horloge.nbTicks,
    'l\'attente du remplaçant n\'est pas échue sur-le-champ');
  rattraperJeu(etat, 1);
  assert.equal(baseCourante(etat).satellites.presents.length, 3,
    'le remplaçant n\'est pas paru au tick suivant');

  // ⚠ ET SON INSTANCE EST NEUVE, MÊME S'IL RETOMBE SUR LA MÊME CASE. C'est tout
  // ce qui fait qu'un camp reconstruit n'a pas la même disposition de bâtiments
  // que celui qu'on vient de raser — Ethan, le 29/08.
  const nouveau = baseCourante(etat).satellites.presents[2];
  assert.ok(!avant.includes(nouveau.instance), 'le numéro d\'instance a été réutilisé');
  assert.equal(nouveau.instance, Math.max(...avant) + 1);
});

test('satellites — un déplacement de base remet les trois à zéro', () => {
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION);
  const anciens = baseCourante(etat).satellites.presents.map((s) => `${s.rangee}:${s.colonne}`);
  assert.equal(anciens.length, 3);

  // Le redéploiement n'existe pas encore : on simule ce qu'il fera, déplacer la
  // base, puis reprogrammer.
  baseCourante(etat).position = { rangee: baseCourante(etat).position.rangee - 20, colonne: baseCourante(etat).position.colonne };
  planifierSatellites(etat);
  assert.deepEqual(baseCourante(etat).satellites.presents, [], 'les anciens survivent au déménagement');
  assert.equal(baseCourante(etat).satellites.attentes.length, 3);

  rattraperJeu(etat, TICKS_APPARITION);
  assert.equal(baseCourante(etat).satellites.presents.length, 3);
  // Ils sont autour de la NOUVELLE position, et le montage garantit que les deux
  // jeux de cases ne peuvent pas coïncider : vingt cases séparent les anneaux.
  for (const s of baseCourante(etat).satellites.presents) {
    assert.ok(!anciens.includes(`${s.rangee}:${s.colonne}`));
    assert.ok(Math.abs(s.rangee - baseCourante(etat).position.rangee) <= ANNEAUX[s.type].max);
  }
  // Et le compteur d'instances n'est PAS remis à zéro : deux camps successifs
  // sur une même case doivent rester distinguables même après un déménagement.
  assert.ok(etat.prochaineInstanceSatellite > 4);
});

test('satellites — ils traversent la sauvegarde', () => {
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION + 10);
  const relu = charger(serialiser(etat, T0), T0);
  assert.deepEqual(baseCourante(relu).satellites, baseCourante(etat).satellites);

  // Falsifiable : la table doit être NON TRIVIALE avant d'être comparée.
  assert.equal(baseCourante(relu).satellites.presents.length, 3);

  // Une attente en cours traverse aussi — c'est elle qu'on perdrait le plus
  // facilement, puisqu'elle ne se voit nulle part.
  detruireSatellite(relu, 1);
  const relu2 = charger(serialiser(relu, T0), T0);
  assert.equal(baseCourante(relu2).satellites.attentes.length, 1);
  assert.deepEqual(baseCourante(relu2).satellites.attentes, baseCourante(relu).satellites.attentes);
});

test('satellites — l\'anneau se mesure en Euclide, et il se rogne sur la carte', () => {
  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE (02/09), pas un comportement qui casse.
  // L'anneau était un CARRÉ creux — 5 × 5 moins la case centrale, 24 cases ; il
  // est devenu un DISQUE creux. Ce que le test garde est inchangé : toute case
  // rendue est bien entre `min` et `max`, et l'anneau se rogne sur la carte au
  // lieu de rendre des cases qui n'existent pas.
  const centre = { rangee: 100, colonne: 16 };
  const cases = casesDeLAnneau(centre, 1, 2);
  // Disque de rayon 2, case centrale ôtée : les quatre orthogonales à 1, les
  // quatre diagonales à √2, les quatre orthogonales à 2. Douze.
  assert.equal(cases.length, 12);
  for (const k of cases) {
    const d2 = (k.rangee - centre.rangee) ** 2 + (k.colonne - centre.colonne) ** 2;
    assert.ok(d2 >= 1 && d2 <= 4, `(${k.rangee}, ${k.colonne}) : d² = ${d2}`);
  }
  // ⚠ ET LE COIN DU CARRÉ N'Y EST PLUS. C'est la moitié qui mesure le
  // changement : (±2, ±2) valait 2 en Tchebychev, il vaut √8 en Euclide.
  assert.equal(cases.some((k) => Math.abs(k.rangee - 100) === 2
    && Math.abs(k.colonne - 16) === 2), false);

  // L'anneau 2–5, recompté case par case plutôt que recopié : le nombre se
  // DÉDUIT de la règle, il ne se fige pas à la main.
  let attendu = 0;
  for (let dr = -5; dr <= 5; dr += 1) {
    for (let dc = -5; dc <= 5; dc += 1) {
      const d2 = dr * dr + dc * dc;
      if (d2 >= 4 && d2 <= 25) attendu += 1;
    }
  }
  assert.equal(casesDeLAnneau(centre, 2, 5).length, attendu);

  // Contre un bord, il se rogne au lieu de rendre des cases hors carte.
  const auBord = casesDeLAnneau({ rangee: 1, colonne: 1 }, 1, 2);
  assert.ok(auBord.length < 12, 'l\'anneau au coin doit être rogné');
  for (const k of auBord) assert.ok(estSurLaCarte(k.rangee, k.colonne));
});

test('satellites — le camp suit le niveau du JOUEUR, l\'avant-poste celui de la rangée', () => {
  // ⚠ LE NIVEAU DU JOUEUR EST EN DIXIÈMES, et l'oublier donnerait des camps de
  // niveau 46 devant une base de niveau 4,6. Le montage porte donc des bâtiments
  // à un niveau franchement différent de celui de la rangée, sinon les deux
  // règles rendraient le même nombre et le test ne les distinguerait pas.
  const etat = creerEtat(4242);
  for (const b of baseCourante(etat).disposition) b.niveau = 12;
  const rng = creerRng(1);

  assert.equal(niveauDuSatellite('camp', etat, rng), 12);

  // ⚠⚠ LA BANDE ATTENDUE SE DÉRIVE DE LA RANGÉE, ELLE NE S'ÉCRIT PLUS. Ce test
  // portait « 4…6 » en dur, parce que la rangée de départ valait la strate 5.
  // Le 31/08, Ethan a rapproché le départ du bord bas (275 → 295) : la strate
  // est tombée à 1 et l'assertion avec, alors qu'elle ne mesure pas la position
  // — elle mesure que l'avant-poste suit la RANGÉE et le camp le JOUEUR.
  const strate = niveauDeLaRangee(baseCourante(etat).position.rangee);
  const niveaux = new Set();
  for (let i = 0; i < 50; i += 1) niveaux.add(niveauDuSatellite('avantPoste', etat, rng));
  for (const n of niveaux) {
    assert.ok(Math.abs(n - strate) <= 1,
      `avant-poste de niveau ${n}, attendu ${strate} ± 1`);
  }
  // ⚠ ET LE MONTAGE DOIT DISTINGUER LES DEUX RÈGLES : si la strate valait 12,
  // les deux rendraient le même nombre et le test ne prouverait rien.
  assert.notEqual(strate, 12, 'le montage ne sépare plus le niveau du joueur de celui de la rangée');

  // ⚠ LE ±1 SE MESURE, MAIS IL SE HEURTE AU PLANCHER. `niveauDuSatellite` ne
  // descend jamais sous 1 : à la strate 1, la bande utile est {1, 2}, pas trois
  // valeurs. Exiger plus d'une valeur reste vrai, et c'est ce qui compte — la
  // règle tire encore.
  assert.ok(niveaux.size > 1, 'le ±1 ne tire jamais : la règle est figée');

  // Et les deux tables se croisent : un type de satellite doit être un type de
  // site que le générateur sait peupler.
  for (const type of Object.keys(ANNEAUX)) {
    assert.ok(TYPES_SITE[type] !== undefined, `« ${type} » n'est pas un type de site`);
  }
});

test('satellites — une table malformée est refusée, une table vide ne l\'est pas', () => {
  assert.deepEqual(problemesDesSatellites(satellitesVides(), 1), []);

  const hors = satellitesVides();
  hors.presents.push({
    type: 'camp', rangee: GEOGRAPHIE.carte.hauteur + 5, colonne: 3, niveau: 1, instance: 1,
  });
  assert.ok(problemesDesSatellites(hors, 2).some((m) => m.includes('hors carte')));

  const inconnu = satellitesVides();
  inconnu.presents.push({ type: 'forteresse', rangee: 100, colonne: 3, niveau: 1, instance: 1 });
  assert.ok(problemesDesSatellites(inconnu, 2).some((m) => m.includes('inconnu')));

  // ⚠ UNE INSTANCE AU-DELÀ DU COMPTEUR EST UNE FAUTE, et c'est elle qui
  // attraperait un compteur remis à zéro par erreur — la faute qui ferait
  // repartir toutes les dispositions de camps depuis le début.
  //
  // ⚠ LE COMPTEUR EST PASSÉ EN ARGUMENT DEPUIS BASES-1 : il est GLOBAL à la
  // partie, plus propre à une base. C'est ce qui rend son unicité STRUCTURELLE —
  // deux bases ne peuvent plus partir du même numéro, donc de la même graine
  // d'apparition.
  const avance = satellitesVides();
  avance.presents.push({ type: 'camp', rangee: 100, colonne: 3, niveau: 1, instance: 9 });
  assert.ok(problemesDesSatellites(avance, 2).some((m) => m.includes('au-delà du compteur')));
  // Et un compteur absent ou nul est refusé de face.
  assert.ok(problemesDesSatellites(satellitesVides(), 0).some((m) => m.includes('prochaine instance')));
  assert.ok(problemesDesSatellites(satellitesVides(), undefined).some((m) => m.includes('prochaine instance')));

  assert.ok(problemesDesSatellites(null, 1).length > 0);
  assert.ok(problemesDesSatellites({ presents: [], attentes: {} }, 1).length > 0);
});

test('satellites — une apparition ne consomme PAS le flux de l\'état', () => {
  // ⚠ LA RÈGLE MESURÉE DE FACE, parce que le test des deux chemins ne la tient
  // pas (voir son commentaire). Si le tirage passait par `etat.rng`, le flux
  // aurait avancé après l'apparition — et le jour où une autre mécanique tirera
  // pendant un tick, les deux chemins d'avancement divergeraient pour de bon.
  const etat = creerEtat(4242);
  const avant = JSON.stringify(etat.rng);

  rattraperJeu(etat, TICKS_APPARITION);
  assert.equal(baseCourante(etat).satellites.presents.length, 3, 'rien n\'a paru : le montage ne mesure rien');
  assert.equal(
    JSON.stringify(etat.rng), avant,
    'l\'apparition a consommé etat.rng — le rattrapage analytique cesse d\'être équivalent',
  );

  // Falsifiable : le flux DOIT bouger quand on le tire pour de bon, sinon
  // l'égalité ci-dessus passerait sur un état dont le rng est figé.
  entier(etat.rng, 0, 100);
  assert.notEqual(JSON.stringify(etat.rng), avant);
});

test('satellites — un anneau saturé REPORTE l\'attente, il ne la perd pas', () => {
  // ⚠ CE CAS N'ARRIVE JAMAIS DANS LES AUTRES TESTS, et c'est pour ça qu'il faut
  // le fabriquer : les anneaux du départ tiennent entiers dans la garde de
  // quinze cases, donc aucune base de l'Ouvrage ne les encombre. Sans ce
  // montage, jeter l'attente au lieu de la reporter restait VERT — mesuré.
  const etat = creerEtat(4242);
  baseCourante(etat).satellites = satellitesVides();

  // On sature l'anneau des camps — 1 à 2 cases — avec des occupants factices.
  const anneau = casesDeLAnneau(baseCourante(etat).position, ANNEAUX.camp.min, ANNEAUX.camp.max);
  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE : l'anneau des camps est passé du carré
  // creux (24 cases) au disque creux (12). Ce que cette ligne garde n'a pas
  // changé — elle prouve que le montage sature un anneau PLEIN, sans quoi
  // « reporter l'attente » ne serait jamais exercé.
  assert.equal(anneau.length, 12, 'le montage suppose un anneau complet');
  let instance = 1;
  for (const k of anneau) {
    baseCourante(etat).satellites.presents.push({
      type: 'camp', rangee: k.rangee, colonne: k.colonne, niveau: 1, instance,
    });
    instance += 1;
  }
  etat.prochaineInstanceSatellite = instance;

  baseCourante(etat).satellites.attentes = [{ type: 'camp', tickDu: 0 }];
  const parus = resoudreSatellites(etat);

  assert.equal(parus, 0, 'un camp est paru dans un anneau plein');
  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE : douze cases dans l'anneau, pas
  // vingt-quatre. Le compte se DÉDUIT du montage plutôt que de se réécrire — le
  // jour où le rayon de l'anneau bougera, cette ligne suivra toute seule.
  assert.equal(baseCourante(etat).satellites.presents.length, anneau.length,
    'un occupant de trop a été posé dans un anneau plein');
  assert.equal(baseCourante(etat).satellites.attentes.length, 1, 'l\'attente a été perdue en silence');

  // Et elle se satisfait dès qu'une place se libère : reportée, pas annulée.
  baseCourante(etat).satellites.presents.pop();
  assert.equal(resoudreSatellites(etat), 1);
  assert.deepEqual(baseCourante(etat).satellites.attentes, []);
});

test('satellites — jamais sur une base de l\'Ouvrage, même quand il y en a dans l\'anneau', () => {
  // ⚠ L'EXCLUSION EST INERTE AU DÉPART, ET C'EST CE QUI LA RENDAIT INTESTABLE.
  // La garde du peuplement vide quinze cases autour de la fondation ; les
  // anneaux, qui vont au plus à cinq, tiennent entièrement dedans. Retirer
  // l'exclusion laissait donc tous les autres tests VERTS — mesuré. Elle ne
  // mord que lorsque le joueur s'est RAPPROCHÉ, ce que ce montage simule.
  //
  // Position choisie par balayage : (240, 3) sur la graine 4242 porte DIX bases
  // de l'Ouvrage dans son anneau 1–5.
  const etat = creerEtat(4242);
  baseCourante(etat).position = { rangee: 240, colonne: 3 };

  const dansLAnneau = casesDeLAnneau(baseCourante(etat).position, 1, 5)
    .filter((k) => estBaseOuvrage(etat.graine, k.rangee, k.colonne));
  assert.ok(dansLAnneau.length >= 3, `${dansLAnneau.length} bases dans l'anneau : rien à mesurer`);

  // On rejoue l'apparition un grand nombre de fois pour couvrir les tirages : un
  // seul passage pourrait éviter les bases par chance.
  const sur = [];
  for (let n = 0; n < 60; n += 1) {
    planifierSatellites(etat);
    rattraperJeu(etat, TICKS_APPARITION);
    for (const s2 of baseCourante(etat).satellites.presents) {
      if (estBaseOuvrage(etat.graine, s2.rangee, s2.colonne)) sur.push(s2);
    }
  }
  assert.deepEqual(sur, [], `${sur.length} satellites posés sur une base de l'Ouvrage`);
});

// ---------------------------------------------------------------------------
// LA RELÈVE — un satellite qu'on ignore finit par changer de place (31/08)
// ---------------------------------------------------------------------------
//
// ⚠⚠ ETHAN A DEMANDÉ DE VÉRIFIER, ET LA RÉPONSE ÉTAIT NON. Avant ce lot, un
// satellite posé ne bougeait JAMAIS : `planifierSatellites` le programmait,
// `resoudreSatellites` le posait, et plus rien ne le touchait. Seule une
// destruction en raid le faisait réapparaître ailleurs.

/** Avance jusqu'au tick voulu, tick par tick. */
function jusqua(etat, tick) {
  while (etat.horloge.nbTicks < tick) tickJeu(etat);
  return etat;
}

test('relève — un satellite ignoré change de place, et pas avant l\'heure', () => {
  const etat = creerEtat(31_082_026);
  jusqua(etat, TICKS_APPARITION);
  assert.equal(baseCourante(etat).satellites.presents.length, 3, 'montage : les trois doivent être là');

  const avant = baseCourante(etat).satellites.presents.map((s) => `${s.type}:${s.rangee}:${s.colonne}`);
  const echeances = baseCourante(etat).satellites.presents.map((s) => s.tickDeReleve);
  for (const t of echeances) {
    assert.ok(Number.isInteger(t), 'un satellite posé sans échéance ne sera jamais relevé');
  }
  // ⚠ L'ÉCHÉANCE SE COMPTE DEPUIS LA POSE, pas depuis la fondation.
  assert.deepEqual([...new Set(echeances)], [TICKS_APPARITION + TICKS_DUREE_DE_VIE]);

  // Une minute avant : rien n'a bougé. C'est la moitié qui prouve que le test
  // mesure une DATE et pas simplement « ça finit par changer ».
  jusqua(etat, TICKS_APPARITION + TICKS_DUREE_DE_VIE - 1);
  assert.deepEqual(
    baseCourante(etat).satellites.presents.map((s) => `${s.type}:${s.rangee}:${s.colonne}`), avant,
    'un satellite a été relevé AVANT son échéance',
  );

  // À l'échéance, il quitte la carte et une attente le remplace.
  jusqua(etat, TICKS_APPARITION + TICKS_DUREE_DE_VIE);
  assert.equal(baseCourante(etat).satellites.presents.length, 0, 'les trois devaient être relevés ensemble');
  assert.equal(baseCourante(etat).satellites.attentes.length, 3, 'la relève ne reprogramme pas');

  // Puis ils reparaissent — ailleurs, et sous de nouvelles instances.
  jusqua(etat, TICKS_APPARITION + TICKS_DUREE_DE_VIE + TICKS_APPARITION);
  assert.equal(baseCourante(etat).satellites.presents.length, 3);
  const apres = baseCourante(etat).satellites.presents.map((s) => `${s.type}:${s.rangee}:${s.colonne}`);
  assert.notDeepEqual(apres.slice().sort(), avant.slice().sort(),
    'les trois sont revenus exactement aux mêmes cases : le tirage ne dépend pas de l\'instance');
  // ⚠ CHAQUE RELÈVE EST UNE INSTANCE NEUVE : c'est ce qui donne au camp une
  // disposition de bâtiments différente (arbitré le 29/08), et c'est aussi ce
  // qui empêche le tirage de rendre deux fois la même case.
  assert.ok(baseCourante(etat).satellites.presents.every((s) => s.instance > 3));
});

test('relève — un satellite ATTAQUÉ gagne du temps, compté depuis le raid', () => {
  const etat = creerEtat(31_082_026);
  jusqua(etat, TICKS_APPARITION);
  const cible = baseCourante(etat).satellites.presents[0];
  const echeanceInitiale = cible.tickDeReleve;

  // On avance jusqu'à la veille de sa relève, puis on l'attaque.
  jusqua(etat, echeanceInitiale - 100);
  const tickDuRaid = etat.horloge.nbTicks;
  assert.ok(prolongerApresAttaque(etat, cible, tickDuRaid), 'le satellite n\'a pas été trouvé');

  // ⚠ LE SURSIS SE COMPTE DEPUIS LE RAID. Un camp attaqué à sa dernière minute
  // doit gagner du temps — sinon la règle ne sert pas dans le cas où elle
  // compte, celui où le joueur revient sur un site qu'il a entamé.
  assert.equal(cible.tickDeReleve, tickDuRaid + TICKS_DUREE_DE_VIE + TICKS_SURSIS);
  assert.ok(cible.tickDeReleve > echeanceInitiale, 'l\'attaque n\'a rien allongé');

  // Et il est toujours là bien après l'échéance qu'il aurait eue sans le raid.
  jusqua(etat, echeanceInitiale + TICKS_SURSIS);
  assert.ok(
    baseCourante(etat).satellites.presents.some((s) => s.instance === cible.instance),
    'le satellite attaqué a été relevé malgré son sursis',
  );

  // ⚠⚠ ET LE SURSIS NE RACCOURCIT JAMAIS UNE VIE. Le cas se construit : il faut
  // une échéance DÉJÀ plus lointaine que ce que le raid donnerait. Un raid
  // ordinaire allonge toujours — `raid + vie + sursis` dépasse forcément une
  // échéance posée à `pose + vie`, puisque le raid vient après la pose. La
  // faute qu'on garde est donc un appel DÉSORDONNÉ dans le temps, la seule
  // forme sous laquelle l'écrasement se commettrait.
  const loin = cible.tickDeReleve;
  assert.equal(prolongerApresAttaque(etat, cible, 0), false,
    'un raid antidaté a raccourci la vie d\'un satellite');
  assert.equal(cible.tickDeReleve, loin);

  // L'appât : le même appel, à sa vraie date, allonge bien.
  assert.equal(prolongerApresAttaque(etat, cible, etat.horloge.nbTicks), true);
  assert.ok(cible.tickDeReleve > loin);

  // Un satellite absent ne fait pas lever : le raid se résout sur un montage.
  assert.equal(
    prolongerApresAttaque(etat, { rangee: 1, colonne: 1, instance: 9999 }, 0), false,
  );
});

test('relève — les deux chemins d\'avancement rendent le MÊME état', () => {
  // ⚠⚠ C'EST LA GARDE LA PLUS IMPORTANTE DU LOT. `resoudreSatellites` ne lisait
  // que l'horloge courante, et l'en-tête du module disait : « le jour où elle
  // dépendra de l'instant précis d'une apparition, cette équivalence tombe ».
  // La relève en dépend — un satellite posé à T meurt à T + durée. La boucle
  // par ÉVÈNEMENT est ce qui la rétablit ; ce test est ce qui le prouve.
  //
  // L'horizon couvre plusieurs relèves complètes : sous une seule, le rattrapage
  // et la boucle coïncideraient par accident.
  const horizon = TICKS_APPARITION + 3 * (TICKS_DUREE_DE_VIE + TICKS_APPARITION) + 500;
  const parBoucle = creerEtat(20_260_831);
  const parSaut = creerEtat(20_260_831);

  for (let i = 0; i < horizon; i += 1) tickJeu(parBoucle);
  rattraperJeu(parSaut, horizon);

  // D'abord : le montage mesure-t-il quelque chose ? Sans plusieurs relèves,
  // l'égalité ne dirait rien.
  assert.ok(parBoucle.prochaineInstanceSatellite > 6,
    `montage sans mordant : seulement ${parBoucle.prochaineInstanceSatellite - 1} poses`);

  assert.deepEqual(
    baseCourante(parSaut).satellites, baseCourante(parBoucle).satellites,
    'le rattrapage analytique et la boucle par tick divergent sur les satellites',
  );
  // ⚠ ET LE FLUX DE L'ÉTAT N'A PAS ÉTÉ CONSOMMÉ DIFFÉREMMENT. C'est la faute que
  // le module interdit depuis le 29/08 : une graine dérivée de `etat.rng`
  // passerait l'égalité ci-dessus tant que rien d'autre ne tire.
  assert.deepEqual(parSaut.rng, parBoucle.rng);
});

test('relève — dix ans d\'absence se rattrapent, et on mesure ce que ça coûte', () => {
  // ⚠ LA BOUCLE AVANCE PAR ÉVÈNEMENT, JAMAIS PAR TICK. Dix ans font 3,15
  // milliards de ticks ; ce qui compte, c'est le nombre de RELÈVES — une par
  // durée de vie. Sans cette propriété, le chargement d'une vieille partie
  // gèlerait le téléphone, et c'est exactement le piège que CLAUDE.md §6 décrit
  // pour le rattrapage économique.
  const dixAns = 10 * 365 * 24 * 3600 * 10;
  const etat = creerEtat(7);
  const t0 = process.hrtime.bigint();
  rattraperJeu(etat, dixAns);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;

  // ⚠ ON COMPTE PRÉSENTS **ET** ATTENTES, PAS LES SEULS PRÉSENTS. Un cycle vaut
  // `vie + apparition` ; selon l'instant où l'on rouvre la partie, les trois
  // peuvent être posés ou entre deux relèves. Dix ans tombent d'ailleurs
  // EXACTEMENT sur une frontière de cycle — mesuré — et exiger trois présents
  // ferait tomber ce test pour une raison qui n'en est pas une.
  assert.equal(
    baseCourante(etat).satellites.presents.length + baseCourante(etat).satellites.attentes.length, 3,
    'un satellite s\'est perdu en route',
  );
  // Le compteur d'instances dit combien de relèves ont vraiment eu lieu : c'est
  // ce qui prouve que la boucle a fait le travail au lieu de le sauter.
  const cycles = Math.floor(dixAns / (TICKS_DUREE_DE_VIE + TICKS_APPARITION));
  assert.ok(etat.prochaineInstanceSatellite > cycles,
    `${etat.prochaineInstanceSatellite - 1} poses pour ${cycles} cycles attendus`);

  // ⚠ LE SEUIL EST LARGE EXPRÈS : il n'est pas là pour mesurer la machine, il
  // est là pour attraper un retour à une boucle par TICK, qui serait mille fois
  // plus lente. Mesuré ici à ~600 ms pour dix ans.
  assert.ok(ms < 10_000, `${ms.toFixed(0)} ms pour dix ans : la boucle avance par tick`);
});

// ---------------------------------------------------------------------------
// SAT-R — lot SATELLITES-RESPAWN, 06/09/2026
//
// Ethan : « un camp ou avant poste rasé = un autre pop direct », puis, sur la
// case du remplaçant, « ailleurs ». Ce que ces tests doivent prouver : que le
// remplaçant est dû SUR-LE-CHAMP et qu'il paraît vraiment, qu'il ne reparaît pas
// sur la case rasée, que le peuplement d'une base neuve garde ses cinq minutes,
// et que le déterminisme du flux tient — c'est-à-dire qu'un seul tirage est
// consommé quoi qu'il arrive.
// ---------------------------------------------------------------------------

/** Les cases de l'anneau des camps autour de la base courante. */
const anneauDesCamps = (etat) => casesDeLAnneau(
  baseCourante(etat).position, ANNEAUX.camp.min, ANNEAUX.camp.max,
);

const cle = (k) => `${k.rangee}:${k.colonne}`;

/**
 * Occupe l'anneau des camps, sauf les cases nommées.
 *
 * ⚠ C'EST LE MONTAGE QUI REND LE TIRAGE DISCRIMINANT. Sur un anneau de douze
 * cases, un tirage libre retomberait sur la case rasée une fois sur dix : un seul
 * essai ne falsifierait rien. En n'en laissant que deux — la rasée et une autre —
 * le tirage SANS exclusion aurait une chance sur deux, et le tirage AVEC est
 * forcé. La différence se voit alors sur une seule graine.
 *
 * ⚠ `tickDeReleve` EST POSÉ TRÈS LOIN : ces faux satellites ne doivent pas se
 * relever pendant le montage, sinon ils libéreraient les cases qu'ils occupent.
 *
 * ⚠⚠ ET LEURS NUMÉROS D'INSTANCE SORTENT DU COMPTEUR, ILS NE SONT PAS INVENTÉS.
 * `problemesDesSatellites` refuse une instance au-delà du compteur, et
 * `verifierEtat` LÈVE au chargement : un montage à 90 000 passait tant qu'on ne
 * sérialisait pas, et tombait dès qu'on le faisait. C'est la garde qui avait
 * raison — un état qu'on ne peut pas recharger n'est pas un état.
 */
function occuperLAnneau(etat, garder) {
  const base = baseCourante(etat);
  const aGarder = new Set(garder.map(cle));
  const dejaLa = new Set(base.satellites.presents.map(cle));
  for (const k of anneauDesCamps(etat)) {
    if (aGarder.has(cle(k)) || dejaLa.has(cle(k))) continue;
    base.satellites.presents.push({
      type: 'camp', rangee: k.rangee, colonne: k.colonne, niveau: 1,
      instance: etat.prochaineInstanceSatellite, tickDeReleve: 9_000_000,
    });
    etat.prochaineInstanceSatellite += 1;
  }
}

/** Le satellite qui n'était pas là avant — identifié par sa CASE, pas par un numéro. */
function leNouveau(etat, avant) {
  return baseCourante(etat).satellites.presents.find((s) => !avant.has(cle(s)));
}

/** L'anneau est-il vierge de tout ce que le tirage écarte par ailleurs ? */
function anneauSansObstacle(etat) {
  return anneauDesCamps(etat).every(
    (k) => !estBaseOuvrage(etat.graine, k.rangee, k.colonne)
      && poiDeLaCase(etat.graine, k.rangee, k.colonne) === null,
  );
}

/** Monte une partie, fait paraître les trois, et rend l'indice d'un camp. */
function partieAvecTrois(graine) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, TICKS_APPARITION);
  const presents = baseCourante(etat).satellites.presents;
  assert.equal(presents.length, 3, 'les trois n\'ont pas paru');
  const index = presents.findIndex((s) => s.type === 'camp');
  assert.ok(index >= 0, 'aucun camp dans le montage');
  return { etat, index, camp: { ...presents[index] } };
}

test('SAT-R T1 — le remplaçant est dû sur-le-champ, pas dans cinq minutes', () => {
  const { etat, index } = partieAvecTrois(4242);
  const t = etat.horloge.nbTicks;
  detruireSatellite(etat, index);

  const attente = baseCourante(etat).satellites.attentes[0];
  // ⚠ L'ÉGALITÉ, PAS UNE INÉGALITÉ. `tickDu < t + TICKS_APPARITION` passerait sur
  // un délai simplement divisé par deux, c'est-à-dire sur autre chose que ce
  // qu'Ethan a demandé.
  assert.equal(attente.tickDu, t, 'l\'attente du remplaçant n\'est pas échue');
  // Et la constante n'a pas été mise à zéro pour l'occasion : elle sert ailleurs.
  assert.equal(TICKS_APPARITION, SATELLITES.delaiApparitionSec * TICKS_PAR_SECONDE);
  assert.ok(TICKS_APPARITION > 0, 'TICKS_APPARITION a été mis à zéro');
});

test('SAT-R T2 — et il paraît vraiment, au tick suivant', () => {
  const { etat, index } = partieAvecTrois(4242);
  detruireSatellite(etat, index);
  assert.equal(baseCourante(etat).satellites.presents.length, 2);

  // ⚠ UN SEUL TICK. C'est ce qui distingue « échéance à zéro » de « effectivement
  // servi » : une attente due mais qu'aucun chemin ne sert laisserait T1 vert.
  tickJeu(etat);
  assert.equal(baseCourante(etat).satellites.presents.length, 3, 'le remplaçant n\'est pas paru');
  assert.deepEqual(baseCourante(etat).satellites.attentes, [], 'l\'attente n\'a pas été consommée');
});

test('SAT-R T3 — le peuplement d\'une base neuve garde ses cinq minutes', () => {
  // ⚠ CE TEST ATTRAPE UN LOT QUI AURAIT MIS `TICKS_APPARITION` À ZÉRO pour faire
  // passer T1 et T2. Ethan n'a parlé que du REMPLACEMENT d'un site rasé.
  const etat = creerEtat(77);
  const t = etat.horloge.nbTicks;
  const attentes = baseCourante(etat).satellites.attentes;
  assert.equal(attentes.length, 3);
  for (const a of attentes) assert.equal(a.tickDu, t + TICKS_APPARITION);

  rattraperJeu(etat, TICKS_APPARITION - 1);
  assert.deepEqual(baseCourante(etat).satellites.presents, [], 'les trois ont paru avant l\'heure');
});

test('SAT-R T4 — le remplaçant ne reparaît pas sur la case rasée', () => {
  // ⚠⚠ VINGT GRAINES, ET LA PREMIÈRE ÉCRITURE N'EN AVAIT QU'UNE — ELLE NE
  // MORDAIT PAS. Sur un anneau réduit à DEUX cases libres — la rasée et une
  // autre —, le tirage sans exclusion a une chance sur deux d'éviter la rasée
  // tout seul : mesuré, il l'évitait sur la graine 4242, si bien que retirer
  // l'exclusion laissait ce test VERT. Une falsification qui ne mord pas se
  // vérifie avant d'être crue — ici elle a dit que c'était le TEST qui était
  // faible. À vingt graines, la probabilité qu'aucune ne discrimine vaut 2⁻²⁰.
  let sansExclusionAuraitPuTomber = 0;
  for (let g = 1; g <= 20; g += 1) {
    const { etat, index, camp } = partieAvecTrois(g);
    assert.ok(anneauSansObstacle(etat), `graine ${g} : l'anneau porte une base ou un POI`);

    // On ne laisse LIBRES que deux cases : celle qu'on va raser, et une autre.
    // ⚠ ET « UNE AUTRE » SE CHOISIT PARMI CE QUI EST VRAIMENT LIBRE : le second
    // camp et l'avant-poste peuvent occuper une case de cet anneau-là, et sur la
    // graine 2 la première case du balayage est justement prise.
    const occupees = new Set(baseCourante(etat).satellites.presents.map(cle));
    const libre = anneauDesCamps(etat)
      .find((k) => cle(k) !== cle(camp) && !occupees.has(cle(k)));
    assert.ok(libre, `graine ${g} : aucune case libre à garder dans l'anneau`);
    occuperLAnneau(etat, [camp, libre]);
    sansExclusionAuraitPuTomber += 1;

    detruireSatellite(etat, index);
    const restantes = new Set(baseCourante(etat).satellites.presents.map(cle));
    tickJeu(etat);

    const neuf = leNouveau(etat, restantes);
    assert.ok(neuf, `graine ${g} : le remplaçant n'est pas paru`);
    assert.notEqual(cle(neuf), cle(camp), `graine ${g} : le remplaçant est reparu sur la case rasée`);
    assert.equal(cle(neuf), cle(libre), `graine ${g} : le remplaçant n'est pas sur la seule case qui restait`);
  }
  assert.equal(sansExclusionAuraitPuTomber, 20, 'le montage n\'a pas réduit l\'anneau sur les vingt graines');
});

test('SAT-R T4 bis — et sur cent graines, jamais une seule fois', () => {
  // ⚠ L'ANNEAU PLEIN N'EST PAS LE CAS COURANT : sur un anneau de douze cases, un
  // tirage libre retomberait sur la case rasée environ une fois sur dix. Cent
  // graines rendent donc une dizaine d'occasions de tomber ; zéro est une mesure.
  let mesures = 0;
  for (let g = 1; g <= 100; g += 1) {
    const { etat, index, camp } = partieAvecTrois(g);
    detruireSatellite(etat, index);
    tickJeu(etat);
    const neuf = baseCourante(etat).satellites.presents.find((s) => s.instance === 4);
    if (neuf === undefined) continue;
    mesures += 1;
    assert.notEqual(cle(neuf), cle(camp), `graine ${g} : le remplaçant est reparu sur la case rasée`);
  }
  assert.ok(mesures >= 95, `seulement ${mesures} graines mesurées : le montage ne mesure presque rien`);
});

test('SAT-R T5 — il n\'atterrit sur aucune case déjà occupée', () => {
  // Non-régression : c'était vrai avant le lot, ça doit le rester.
  const { etat, index } = partieAvecTrois(4242);
  detruireSatellite(etat, index);
  tickJeu(etat);
  const cles = baseCourante(etat).satellites.presents.map(cle);
  assert.equal(new Set(cles).size, cles.length, 'deux satellites sur la même case');
});

test('SAT-R T6 — l\'anneau saturé ne lève pas, et l\'exclusion ne cède pas', () => {
  const { etat, index, camp } = partieAvecTrois(4242);
  assert.ok(anneauSansObstacle(etat), 'montage : l\'anneau porte une base ou un POI');
  // Tout est pris SAUF la case qu'on va raser : après exclusion, il ne reste rien.
  occuperLAnneau(etat, [camp]);
  const avant = baseCourante(etat).satellites.presents.length;

  detruireSatellite(etat, index);
  const restantes = new Set(baseCourante(etat).satellites.presents.map(cle));
  assert.doesNotThrow(() => tickJeu(etat), 'l\'anneau saturé a levé');

  // ⚠ LE CHOIX ÉCRIT : il n'apparaît PAS, et l'attente est reportée AVEC son
  // exclusion. Céder ici briserait « ailleurs » dans le seul cas où le joueur le
  // verrait.
  assert.equal(baseCourante(etat).satellites.presents.length, avant - 1, 'un remplaçant a paru quand même');
  assert.equal(leNouveau(etat, restantes), undefined, 'quelque chose s\'est posé malgré la saturation');
  const attentes = baseCourante(etat).satellites.attentes;
  assert.equal(attentes.length, 1, 'l\'attente a été perdue');
  assert.deepEqual(attentes[0].evite, { rangee: camp.rangee, colonne: camp.colonne },
    'l\'attente reportée a perdu son exclusion');
  assert.ok(!baseCourante(etat).satellites.presents.some((s) => cle(s) === cle(camp)),
    'quelque chose s\'est posé sur la case rasée');

  // On libère UNE case, qui n'est pas la rasée : le remplaçant part dessus.
  const rendue = { ...baseCourante(etat).satellites.presents.find((s) => cle(s) !== cle(camp)
    && anneauDesCamps(etat).some((k) => cle(k) === cle(s))) };
  baseCourante(etat).satellites.presents = baseCourante(etat).satellites.presents
    .filter((s) => cle(s) !== cle(rendue));
  const avantLaPlace = new Set(baseCourante(etat).satellites.presents.map(cle));
  tickJeu(etat);
  const neuf = leNouveau(etat, avantLaPlace);
  assert.ok(neuf, 'le remplaçant n\'est pas parti quand la place s\'est libérée');
  assert.equal(cle(neuf), cle(rendue), 'le remplaçant n\'a pas pris la case libérée');
});

test('SAT-R T7 — deux parties de même graine, deux destructions : identiques au bit', () => {
  // ⚠⚠ ET CE TEST NE GARDE PAS CE QUE LE BRIEF LUI PRÊTAIT — MESURÉ. Son §4
  // annonce qu'un tirage de plus « décale tout ce qui suit », si bien que « deux
  // parties identiques divergent dès le premier remplacement ». **C'est faux, et
  // la falsification le dit** : un `entier(rng, 0, 7)` inconditionnel glissé
  // avant le tirage laisse la suite ENTIÈREMENT VERTE — 29 pass / 0 fail mesuré.
  // Deux exécutions du MÊME code sur la MÊME graine ne peuvent pas diverger d'un
  // nombre de tirages, puisqu'elles le consomment toutes les deux.
  //
  // ⚠⚠ CE QU'IL GARDE POUR DE BON, c'est une source d'aléa qui ne vient PAS de la
  // graine — `Math.random`, l'horloge, l'ordre d'itération d'un ensemble d'objets.
  // Mesuré : un `Math.random()` dans le choix de la case fait tomber ce test et
  // les deux gardes d'équivalence des chemins d'avancement, et rien d'autre.
  //
  // ⚠ LES DEUX DESTRUCTIONS SUCCESSIVES RESTENT, ET ELLES SERVENT AUTRE CHOSE :
  // le second remplacement passe par un anneau que le premier a déjà modifié,
  // donc par un `libres` plus court. C'est le seul endroit du montage où la
  // longueur de l'ensemble des candidates entre dans le tirage.
  const jouer = (g) => {
    const etat = creerEtat(g);
    rattraperJeu(etat, TICKS_APPARITION);
    for (let n = 0; n < 2; n += 1) {
      const i = baseCourante(etat).satellites.presents.findIndex((s) => s.type === 'camp');
      detruireSatellite(etat, i);
      rattraperJeu(etat, 1);
    }
    return etat;
  };
  for (const g of [4242, 7, 99]) {
    const a = jouer(g);
    const b = jouer(g);
    assert.equal(
      a.satellitesDetruits.camp, 2,
      `graine ${g} : le montage n'a pas détruit deux camps — il ne mesure rien`,
    );
    assert.equal(serialiser(a, T0), serialiser(b, T0), `graine ${g} : deux exécutions divergent`);
  }
});

test('SAT-R T8 — le compteur de destructions ne bouge pas', () => {
  const { etat, index, camp } = partieAvecTrois(4242);
  assert.equal(etat.satellitesDetruits[camp.type] ?? 0, 0);
  detruireSatellite(etat, index);
  assert.equal(etat.satellitesDetruits[camp.type], 1, 'le compteur n\'a pas été incrémenté');
  // Le remplaçant qui paraît n'en est PAS une : le compteur mesure des
  // destructions, jamais des apparitions.
  tickJeu(etat);
  assert.equal(etat.satellitesDetruits[camp.type], 1, 'le remplaçant a été compté comme une destruction');
});

test('SAT-R T9 — un camp revient en camp, un avant-poste en avant-poste', () => {
  for (const type of ['camp', 'avantPoste']) {
    const etat = creerEtat(4242);
    rattraperJeu(etat, TICKS_APPARITION);
    const index = baseCourante(etat).satellites.presents.findIndex((s) => s.type === type);
    assert.ok(index >= 0, `montage : aucun ${type}`);
    detruireSatellite(etat, index);
    assert.equal(baseCourante(etat).satellites.attentes[0].type, type);
    tickJeu(etat);
    const neuf = baseCourante(etat).satellites.presents.find((s) => s.instance === 4);
    assert.equal(neuf.type, type, `un ${type} rasé est revenu en autre chose`);
  }
});

test('SAT-R T10 — le niveau du remplaçant suit sa règle, que le lot ne touche pas', () => {
  // ⚠ LE LOT NE CHANGE AUCUNE RÈGLE DE NIVEAU — `niveauDuSatellite` ne reçoit pas
  // une ligne. Ethan a choisi d'AFFICHER l'origine du niveau plutôt que de la
  // changer, et c'est un autre lot.
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION);
  const base = baseCourante(etat);
  const rangee = niveauDeLaRangee(base.position.rangee);
  for (const type of ['camp', 'avantPoste']) {
    const index = base.satellites.presents.findIndex((s) => s.type === type);
    detruireSatellite(etat, index);
    tickJeu(etat);
    const neuf = base.satellites.presents[base.satellites.presents.length - 1];
    assert.equal(neuf.type, type);
    if (type === 'camp') {
      // Camp → le niveau des BÂTIMENTS du joueur, en dixièmes.
      assert.equal(neuf.niveau, Math.max(1, Math.round(niveauDesBatiments(base.disposition) / 10)));
    } else {
      // Avant-poste → le niveau de la RANGÉE, ±1, plancher à 1.
      assert.ok(Math.abs(neuf.niveau - rangee) <= 1 || neuf.niveau === 1,
        `avant-poste de niveau ${neuf.niveau} pour une rangée de niveau ${rangee}`);
    }
  }
});

test('SAT-R T11 — la chaîne de migrations, et le numéro qu\'elle porte', () => {
  // ⚠ LA GARDE DU NUMÉRO APPARTIENT AU MAILLON LE PLUS RÉCENT, une seule fois —
  // la règle que `points-attaque.test.js` écrit depuis le lot SITE-ENTAMÉ. Elle
  // vivait sous `RÉSERVE-BASE T11` à `=== 25`, puis sous `RETOUR-D T18` à
  // `=== 26`, puis ici à `=== 27` ; elle est passée à `C24 T12` le 07/09, avec
  // le maillon v27 → v28 du lot CONQUÊTE-24H. Ce qui RESTE ici est ce que ce
  // test-ci a toujours mesuré : que SON maillon existe encore.
  assert.ok(SAVE_VERSION >= 27, 'le maillon v26 → v27 n\'est plus dans la chaîne');

  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION);
  const vieille = JSON.parse(serialiser(etat, T0));
  vieille.version = 26;
  // Une v26 ne porte AUCUNE exclusion : le champ est né avec ce lot.
  for (const a of vieille.bases[0].satellites.attentes) delete a.evite;

  const migre = migrer(vieille);
  assert.equal(migre.version, SAVE_VERSION);
  for (const a of migre.bases[0].satellites.attentes) {
    assert.equal(a.evite, undefined, 'la migration a inventé une case à éviter');
  }

  // ⚠ ET CE QU'ELLE FAIT, ELLE LE FAIT : une valeur héritée malformée est
  // RETIRÉE. Un état fabriqué à la main en montage peut en porter une.
  const tordue = JSON.parse(serialiser(etat, T0));
  tordue.version = 26;
  tordue.bases[0].satellites.attentes = [{ type: 'camp', tickDu: 0, evite: { rangee: -3, colonne: 900 } }];
  assert.equal(
    migrer(tordue).bases[0].satellites.attentes[0].evite, undefined,
    'le maillon v26 → v27 ne retire pas une exclusion hors carte',
  );
});

test('SAT-R T12 — l\'exclusion survit à la sauvegarde, et c\'est pour ça qu\'elle y entre', () => {
  // ⚠⚠ C'EST LA MESURE QUI JUSTIFIE LE BUMP, et elle contredit le brief, qui
  // posait « rien n'est ajouté à l'état ». `executerRaid` détruit le satellite,
  // puis `ui/raid.js` appelle `apresGeste()`, qui SAUVEGARDE ; le tick qui sert
  // l'attente vient après. Une exclusion gardée en mémoire seule serait perdue
  // exactement dans le cas courant — le joueur rase un camp et ferme le jeu.
  const { etat, index, camp } = partieAvecTrois(4242);
  assert.ok(anneauSansObstacle(etat), 'montage : l\'anneau porte une base ou un POI');
  const autres = anneauDesCamps(etat).filter((k) => cle(k) !== cle(camp));
  const libre = autres[0];
  occuperLAnneau(etat, [camp, libre]);
  detruireSatellite(etat, index);

  const json = serialiser(etat, T0);
  assert.match(json, /"evite"/, 'l\'exclusion ne traverse pas la sérialisation');

  const restantes = new Set(baseCourante(etat).satellites.presents.map(cle));
  const recharge = charger(json, T0);
  tickJeu(recharge);
  const neuf = leNouveau(recharge, restantes);
  assert.ok(neuf, 'le remplaçant n\'est pas paru après rechargement');
  assert.equal(cle(neuf), cle(libre), 'l\'exclusion a été perdue au rechargement');
});

test('SAT-R T11 bis — un « evite » malformé rend la sauvegarde injouable', () => {
  // ⚠⚠ CE TEST A ÉTÉ ÉCRIT APRÈS UNE FALSIFICATION QUI NE MORDAIT PAS. Retirer la
  // garde de forme de `problemesDesSatellites` laissait la suite ENTIÈREMENT
  // VERTE — 87 pass / 0 fail mesuré sur `satellites` et `state` : rien ne
  // mesurait le refus d'une exclusion malformée au chargement. Une falsification
  // qui ne mord pas se vérifie avant d'être crue, et ici elle a dit qu'il
  // manquait un test.
  //
  // ⚠ ET C'EST UN FAIT DE PROGRAMME, PAS DE JEU : il ne rejoint pas
  // `CODES_TOLERES_AU_CHARGEMENT`. Une v26 ne peut porter aucun `evite`, et le
  // jeu n'en écrit jamais un hors carte — s'il en existe un, la sauvegarde a été
  // écrite de travers, comme pour « deux satellites sur une case ».
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION);
  const { index, camp } = { index: 0, camp: baseCourante(etat).satellites.presents[0] };
  detruireSatellite(etat, index);
  assert.ok(camp, 'montage : aucun satellite détruit');

  const sain = JSON.parse(serialiser(etat, T0));
  assert.equal(problemesDesSatellites(sain.bases[0].satellites, sain.prochaineInstanceSatellite).length, 0,
    'montage : la sauvegarde saine est déjà refusée — le test ne mesurerait rien');

  for (const tordue of [{ rangee: -1, colonne: 4 }, { rangee: 3, colonne: 9_999 }, 42]) {
    const casse = JSON.parse(serialiser(etat, T0));
    casse.bases[0].satellites.attentes[0].evite = tordue;
    assert.ok(
      problemesDesSatellites(casse.bases[0].satellites, casse.prochaineInstanceSatellite)
        .some((m) => m.includes('case évitée')),
      `l'exclusion ${JSON.stringify(tordue)} passe la garde de forme`,
    );
    assert.throws(() => charger(JSON.stringify(casse), T0), /satellites injouables/,
      `l'exclusion ${JSON.stringify(tordue)} passe le chargement`);
  }

  // ⚠ ET « ABSENT » RESTE LÉGAL : une attente de peuplement initial n'en porte
  // aucune, et une v26 non plus. L'exiger rendrait illisible tout l'avant du lot.
  const sans = JSON.parse(serialiser(etat, T0));
  delete sans.bases[0].satellites.attentes[0].evite;
  assert.doesNotThrow(() => charger(JSON.stringify(sans), T0), 'une attente sans exclusion est refusée');
});

// ---------------------------------------------------------------------------
// lot RETOUCHES — 07/09/2026, point 15
//
// Ethan : « Lorsqu'il y a deux camps ou plus qui spawn, faire au moins 1 quartz
// 1 scorie. »
//
// ⚠⚠ LA SAVEUR EST UNE PROPRIÉTÉ DE LA CASE, PAS DU SATELLITE — arbitrage du
// 29/08, « deux camps successifs sur la même case sont riches de la même
// chose ». La contrainte porte donc sur la CASE que le tirage retient, jamais
// sur un champ posé à la pose : un tel champ serait une seconde vérité contre
// `saveurDeLaCase`, et il ferait bouger `SAVE_VERSION` pour une grandeur qui se
// calcule.
// ---------------------------------------------------------------------------

/** Les saveurs des satellites présents d'une base, dans l'ordre de la liste. */
function saveursPresentes(etat, filtre = () => true) {
  return baseCourante(etat).satellites.presents
    .filter(filtre)
    .map((s) => saveurDeLaCase(etat.graine, s.rangee, s.colonne, s.type));
}

test('RET T12 — deux camps qui paraissent ensemble donnent les DEUX saveurs', () => {
  // ⚠⚠ UNE SEULE GRAINE NE FALSIFIE RIEN : le tirage libre y produit déjà le
  // bon résultat une fois sur deux. **Mesuré sur 200 graines AVANT le lot : les
  // deux camps sortaient du même bord 91 fois.** On balaie donc, et on exige
  // ZÉRO.
  const memeBord = [];
  for (let graine = 1; graine <= 200; graine += 1) {
    const etat = creerEtat(graine);
    rattraperJeu(etat, TICKS_APPARITION);
    const camps = saveursPresentes(etat, (s) => s.type === 'camp');
    assert.equal(camps.length, ANNEAUX.camp.nombre,
      `graine ${graine} : le montage ne pose pas ses deux camps`);
    if (new Set(camps).size === 1) memeBord.push(graine);
  }
  assert.deepEqual(memeBord, [],
    `graine(s) où les deux camps sont du même bord : ${memeBord.join(', ')}`);
});

test('RET T12 bis — les TROIS paraissent au même tick, et c\'est ce qui rend le lot dû', () => {
  // ⚠ LE MONTAGE MESURE SA PROPRE PRÉMISSE. Si les trois satellites d'une base
  // neuve ne paraissaient PAS ensemble, la contrainte n'aurait rien à
  // contraindre et `RET T12` serait vert pour une raison qui n'est pas la
  // sienne. Mesuré : `planifierSatellites` programme les trois au MÊME tick.
  const etat = creerEtat(7);
  const attentes = baseCourante(etat).satellites.attentes;
  assert.equal(attentes.length, 3, 'le montage ne programme pas trois apparitions');
  assert.equal(new Set(attentes.map((a) => a.tickDu)).size, 1,
    'les trois attentes ne tombent plus au même tick : la contrainte ne mord plus ici');

  // ⚠ ET LE SECOND CHEMIN EN PRODUIT AUSSI : deux camps rasés dans la MÊME
  // minute poussent deux attentes échues au même tick. Les deux passent par la
  // même boucle, et c'est pourquoi la contrainte y vit.
  const joue = creerEtat(7);
  rattraperJeu(joue, TICKS_APPARITION);
  const laBase = baseCourante(joue);
  const premier = laBase.satellites.presents.findIndex((s) => s.type === 'camp');
  detruireSatellite(joue, premier);
  const second = laBase.satellites.presents.findIndex((s) => s.type === 'camp');
  assert.ok(second >= 0, 'le montage ne porte plus qu\'un camp');
  detruireSatellite(joue, second);
  const ticks = laBase.satellites.attentes.map((a) => a.tickDu);
  assert.equal(ticks.length, 2, 'les deux destructions n\'ont pas programmé deux attentes');
  assert.equal(new Set(ticks).size, 1,
    'deux camps rasés la même minute ne paraissent plus ensemble');
});

test('RET T13 — un seul satellite n\'est PAS contraint', () => {
  // ⚠ LA CONTRAINTE NE MORD QU'À PARTIR DE DEUX. À un seul, les deux saveurs
  // doivent rester possibles — sinon la règle serait devenue « tout camp est
  // riche en quartz », ce que personne n'a demandé.
  const vues = new Set();
  for (let graine = 1; graine <= 200 && vues.size < 2; graine += 1) {
    const etat = creerEtat(graine);
    const laBase = baseCourante(etat);
    // Une seule attente, donc une seule apparition à ce tick.
    laBase.satellites.attentes = [{ type: 'camp', tickDu: etat.horloge.nbTicks }];
    resoudreSatellites(etat);
    assert.equal(laBase.satellites.presents.length, 1,
      `graine ${graine} : le montage n'a pas posé son unique camp`);
    for (const s of saveursPresentes(etat)) vues.add(s);
  }
  assert.deepEqual([...vues].sort(), ['richeQuartz', 'richeScorie'],
    'à un seul satellite, une saveur est devenue inatteignable');
});

test('RET T14 — le déterminisme tient : même graine, même monde', () => {
  // ⚠⚠ UN NOMBRE DE TIRAGES QUI DÉPENDRAIT DU RÉSULTAT FERAIT DIVERGER DEUX
  // PARTIES IDENTIQUES. La contrainte porte sur l'ENSEMBLE des candidates, posé
  // AVANT le tirage : `entier` est appelé une fois quoi qu'il arrive.
  for (const graine of [7, 42, 2026]) {
    const a = creerEtat(graine); rattraperJeu(a, TICKS_APPARITION);
    const b = creerEtat(graine); rattraperJeu(b, TICKS_APPARITION);
    assert.equal(serialiser(a, 0), serialiser(b, 0),
      `graine ${graine} : deux exécutions ont divergé`);
  }
  // ⚠ ET LA CONTRE-ÉPREUVE : une graine voisine donne un AUTRE monde. Sans
  // elle, un code qui rendrait toujours la même chose passerait l'égalité.
  const x = creerEtat(7); rattraperJeu(x, TICKS_APPARITION);
  const y = creerEtat(8); rattraperJeu(y, TICKS_APPARITION);
  assert.notEqual(serialiser(x, 0), serialiser(y, 0),
    'deux graines voisines rendent le même monde : le test ne mesure rien');

  // ⚠ ET LES DEUX CHEMINS D'AVANCEMENT RESTENT ÉQUIVALENTS — c'est l'invariant
  // que ce module protège depuis le lot SATELLITES.
  const parTicks = creerEtat(7);
  for (let i = 0; i < TICKS_APPARITION; i += 1) tickJeu(parTicks);
  assert.equal(serialiser(parTicks, 0), serialiser(x, 0),
    'le tick à tick et le rattrapage ne rendent plus le même monde');
});

test('RET T15 — le décalage de tirages est mesuré, et il vaut ZÉRO', () => {
  // ⚠⚠ C'EST LA MESURE QUE LE BRIEF EXIGE, ET ELLE EST PLUS FORTE QUE PRÉVU :
  // **la contrainte ne consomme AUCUN tirage de plus**. Elle rétrécit l'ensemble
  // des candidates, elle ne relance rien — donc le choix de la case coûte
  // exactement un `entier` par pose, avant comme après. Ce qui CHANGE est le
  // RÉSULTAT du tirage, pas leur nombre : la liste des candidates est plus
  // courte, donc l'indice tombe ailleurs.
  //
  // ⚠ CE DÉCALAGE-LÀ EST MESURÉ AILLEURS, ET IL EST DÉCLARÉ : le témoin de
  // BASES-0 bouge de **soixante-dix couples sur 322**, à partir de la phase 2 —
  // celle où les satellites paraissent —, et l'attribution est prouvée en
  // neutralisant la seule ligne de la contrainte : le témoin retombe alors à
  // zéro couple déplacé.
  const etat = creerEtat(7);
  rattraperJeu(etat, TICKS_APPARITION);
  const laBase = baseCourante(etat);
  assert.equal(laBase.satellites.presents.length, 3, 'le montage ne pose pas ses trois satellites');
  assert.deepEqual(laBase.satellites.attentes, [], 'des attentes n\'ont pas été servies');

  // ⚠⚠ LE COMPTEUR D'INSTANCES EST LA MESURE DIRECTE : il avance d'une unité par
  // POSE, et une pose consomme EXACTEMENT un tirage de case. Trois satellites,
  // trois instances — donc trois tirages, ni plus ni moins. Le compte se DÉRIVE
  // du premier numéro et du nombre de présents : écrire « 4 » ici ne dirait plus
  // rien le jour où une base neuve porterait un quatrième satellite.
  assert.equal(etat.prochaineInstanceSatellite,
    PREMIERE_INSTANCE + laBase.satellites.presents.length,
    'le nombre de poses a changé : la contrainte consomme ou perd des tirages');

  // ⚠⚠ ET LA SOURCE PORTE L'AUTRE MOITIÉ, celle qu'un compte ne peut pas voir :
  // le choix de la case ne s'écrit qu'UNE fois, et la contrainte se pose AVANT
  // lui. Un « tire, puis recommence si la saveur ne va pas » demanderait une
  // boucle et un second site d'appel — c'est très exactement ce que le §4 du
  // brief interdit, et c'est ce que cette assertion attrape.
  //
  // ⚠ ET LA MESURE PORTE SUR LE CORPS DE `poserUnSatellite`, JAMAIS SUR LE
  // FICHIER : `niveauDuSatellite` tire elle aussi, pour son rayon, et compter le
  // fichier entier attraperait ce tirage-là — qui n'a rien à voir avec le choix
  // de la case et qui existait avant le lot.
  const source = readFileSync(join(RACINE, 'src', 'sim', 'satellites.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  const debut = source.indexOf('function poserUnSatellite(');
  assert.ok(debut > 0, 'poserUnSatellite a été renommée : la mesure ne porte plus sur rien');
  const fin = source.indexOf('\n}\n', debut);
  const corps = source.slice(debut, fin);
  // ⚠ UN TÉMOIN, POUR QUE LA TRANCHE NE PUISSE PAS ÊTRE VIDE : elle doit porter
  // le paramètre de la contrainte ET le choix de la case, sans quoi zéro tirage
  // passerait pour un tirage unique.
  assert.ok(corps.includes('saveurVoulue') && corps.includes('const choisie ='),
    'la tranche mesurée ne porte pas le corps de poserUnSatellite');
  assert.ok(source.split('entier(rng,').length - 1 > corps.split('entier(rng,').length - 1,
    'la tranche couvre tout le fichier : elle ne mesure plus la fonction');
  const tirages = [...corps.matchAll(/entier\(rng,/g)];
  assert.equal(tirages.length, 1,
    `le tirage de la case est écrit ${tirages.length} fois : un re-tirage a été introduit`);
  const iFiltre = corps.indexOf('voulues.length > 0');
  const iTirage = corps.indexOf('entier(rng,');
  assert.ok(iFiltre > 0 && iFiltre < iTirage,
    'la contrainte ne se pose plus AVANT le tirage');

  // ⚠ ET LE FLUX DE LA PARTIE N'EST PAS TOUCHÉ : la graine d'une apparition se
  // dérive de l'INSTANCE, jamais d'`etat.rng`.
  assert.deepEqual(etat.rng, { ...creerEtat(7).rng },
    'la pose a consommé le flux de la partie');
});
