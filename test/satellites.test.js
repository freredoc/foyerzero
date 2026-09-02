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
} from '../src/sim/satellites.js';
import {
  creerEtat, tickJeu, rattraperJeu, serialiser, charger,
} from '../src/sim/state.js';
import { SATELLITES, TYPES_SITE, GEOGRAPHIE } from '../src/data/sites.js';
import { niveauDeLaRangee } from '../src/sim/carte.js';
import { TICKS_PAR_SECONDE } from '../src/sim/clock.js';
import { estSurLaCarte } from '../src/sim/carte.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { creerRng, entier } from '../src/sim/rng.js';
import { baseCourante } from '../src/sim/base-courante.js';

const T0 = 1_700_000_000_000;

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

  // Il ne revient pas tout de suite.
  rattraperJeu(etat, TICKS_APPARITION - 1);
  assert.equal(baseCourante(etat).satellites.presents.length, 2, 'le respawn est immédiat');

  rattraperJeu(etat, 1);
  assert.equal(baseCourante(etat).satellites.presents.length, 3);

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
