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
  problemesDesSatellites,
} from '../src/sim/satellites.js';
import {
  creerEtat, tickJeu, rattraperJeu, serialiser, charger,
} from '../src/sim/state.js';
import { SATELLITES, TYPES_SITE, GEOGRAPHIE } from '../src/data/sites.js';
import { TICKS_PAR_SECONDE } from '../src/sim/clock.js';
import { estSurLaCarte } from '../src/sim/carte.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { creerRng, entier } from '../src/sim/rng.js';

const T0 = 1_700_000_000_000;

test('satellites — deux camps et un avant-poste, cinq minutes après la fondation', () => {
  const etat = creerEtat(4242);

  // À la fondation, la base est SEULE. C'est ce que le joueur doit voir en
  // ouvrant la partie ; poser les trois d'office sauterait le délai arbitré.
  assert.deepEqual(etat.satellites.presents, []);
  assert.equal(etat.satellites.attentes.length, 3);
  assert.deepEqual(
    etat.satellites.attentes.map((a) => a.type).sort(),
    ['avantPoste', 'camp', 'camp'],
  );

  // ⚠ LE DÉLAI SE CALCULE, IL NE SE RECOPIE PAS. 300 s × 10 ticks/s = 3 000.
  assert.equal(TICKS_APPARITION, SATELLITES.delaiApparitionSec * TICKS_PAR_SECONDE);
  assert.equal(TICKS_APPARITION, 3000);

  // Une seconde avant l'échéance : toujours rien. C'est la moitié falsifiable —
  // sans elle, un code qui poserait tout au premier tick passerait la suite.
  for (let i = 0; i < TICKS_APPARITION - 1; i += 1) tickJeu(etat);
  assert.deepEqual(etat.satellites.presents, [], 'ils paraissent avant l\'heure');

  tickJeu(etat);
  assert.equal(etat.satellites.presents.length, 3);
  assert.deepEqual(etat.satellites.attentes, []);
});

test('satellites — chacun dans son anneau, et jamais sur une base de l\'Ouvrage', () => {
  // Balayé sur plusieurs graines : une seule pourrait tomber juste par hasard.
  for (const graine of [1, 7, 42, 1234, 99]) {
    const etat = creerEtat(graine);
    rattraperJeu(etat, TICKS_APPARITION);
    assert.equal(etat.satellites.presents.length, 3, `graine ${graine}`);

    const vues = new Set();
    for (const s of etat.satellites.presents) {
      const anneau = ANNEAUX[s.type];
      const distance = Math.max(
        Math.abs(s.rangee - etat.position.rangee),
        Math.abs(s.colonne - etat.position.colonne),
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

  assert.equal(parBoucle.satellites.presents.length, 3, 'le montage ne mesure rien s\'ils n\'ont pas paru');
  assert.deepEqual(parBoucle.satellites, parRattrapage.satellites);
  // Et la comparaison qui attrape tout le reste avec : l'état sérialisé entier.
  assert.equal(serialiser(parBoucle, T0), serialiser(parRattrapage, T0));
});

test('satellites — un camp détruit revient, avec un NOUVEAU numéro d\'instance', () => {
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION);
  const avant = etat.satellites.presents.map((s) => s.instance);
  assert.equal(new Set(avant).size, 3, 'les trois instances doivent être distinctes');

  const detruit = { ...etat.satellites.presents[0] };
  detruireSatellite(etat, 0);
  assert.equal(etat.satellites.presents.length, 2);
  assert.equal(etat.satellites.attentes.length, 1);
  assert.equal(etat.satellites.attentes[0].type, detruit.type);

  // Il ne revient pas tout de suite.
  rattraperJeu(etat, TICKS_APPARITION - 1);
  assert.equal(etat.satellites.presents.length, 2, 'le respawn est immédiat');

  rattraperJeu(etat, 1);
  assert.equal(etat.satellites.presents.length, 3);

  // ⚠ ET SON INSTANCE EST NEUVE, MÊME S'IL RETOMBE SUR LA MÊME CASE. C'est tout
  // ce qui fait qu'un camp reconstruit n'a pas la même disposition de bâtiments
  // que celui qu'on vient de raser — Ethan, le 29/08.
  const nouveau = etat.satellites.presents[2];
  assert.ok(!avant.includes(nouveau.instance), 'le numéro d\'instance a été réutilisé');
  assert.equal(nouveau.instance, Math.max(...avant) + 1);
});

test('satellites — un déplacement de base remet les trois à zéro', () => {
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION);
  const anciens = etat.satellites.presents.map((s) => `${s.rangee}:${s.colonne}`);
  assert.equal(anciens.length, 3);

  // Le redéploiement n'existe pas encore : on simule ce qu'il fera, déplacer la
  // base, puis reprogrammer.
  etat.position = { rangee: etat.position.rangee - 20, colonne: etat.position.colonne };
  planifierSatellites(etat);
  assert.deepEqual(etat.satellites.presents, [], 'les anciens survivent au déménagement');
  assert.equal(etat.satellites.attentes.length, 3);

  rattraperJeu(etat, TICKS_APPARITION);
  assert.equal(etat.satellites.presents.length, 3);
  // Ils sont autour de la NOUVELLE position, et le montage garantit que les deux
  // jeux de cases ne peuvent pas coïncider : vingt cases séparent les anneaux.
  for (const s of etat.satellites.presents) {
    assert.ok(!anciens.includes(`${s.rangee}:${s.colonne}`));
    assert.ok(Math.abs(s.rangee - etat.position.rangee) <= ANNEAUX[s.type].max);
  }
  // Et le compteur d'instances n'est PAS remis à zéro : deux camps successifs
  // sur une même case doivent rester distinguables même après un déménagement.
  assert.ok(etat.satellites.prochaineInstance > 4);
});

test('satellites — ils traversent la sauvegarde', () => {
  const etat = creerEtat(4242);
  rattraperJeu(etat, TICKS_APPARITION + 10);
  const relu = charger(serialiser(etat, T0), T0);
  assert.deepEqual(relu.satellites, etat.satellites);

  // Falsifiable : la table doit être NON TRIVIALE avant d'être comparée.
  assert.equal(relu.satellites.presents.length, 3);

  // Une attente en cours traverse aussi — c'est elle qu'on perdrait le plus
  // facilement, puisqu'elle ne se voit nulle part.
  detruireSatellite(relu, 1);
  const relu2 = charger(serialiser(relu, T0), T0);
  assert.equal(relu2.satellites.attentes.length, 1);
  assert.deepEqual(relu2.satellites.attentes, relu.satellites.attentes);
});

test('satellites — l\'anneau se mesure en Tchebychev, et il se rogne sur la carte', () => {
  const centre = { rangee: 100, colonne: 16 };
  const cases = casesDeLAnneau(centre, 1, 2);
  // 5×5 moins la case centrale : 24.
  assert.equal(cases.length, 24);
  for (const k of cases) {
    const d = Math.max(Math.abs(k.rangee - centre.rangee), Math.abs(k.colonne - centre.colonne));
    assert.ok(d >= 1 && d <= 2);
  }
  // L'anneau 2–5 : 11×11 moins 3×3.
  assert.equal(casesDeLAnneau(centre, 2, 5).length, 121 - 9);

  // Contre un bord, il se rogne au lieu de rendre des cases hors carte.
  const auBord = casesDeLAnneau({ rangee: 1, colonne: 1 }, 1, 2);
  assert.ok(auBord.length < 24, 'l\'anneau au coin doit être rogné');
  for (const k of auBord) assert.ok(estSurLaCarte(k.rangee, k.colonne));
});

test('satellites — le camp suit le niveau du JOUEUR, l\'avant-poste celui de la rangée', () => {
  // ⚠ LE NIVEAU DU JOUEUR EST EN DIXIÈMES, et l'oublier donnerait des camps de
  // niveau 46 devant une base de niveau 4,6. Le montage porte donc des bâtiments
  // à un niveau franchement différent de celui de la rangée, sinon les deux
  // règles rendraient le même nombre et le test ne les distinguerait pas.
  const etat = creerEtat(4242);
  for (const b of etat.disposition) b.niveau = 12;
  const rng = creerRng(1);

  assert.equal(niveauDuSatellite('camp', etat, rng), 12);
  // La rangée de départ vaut 5 : l'avant-poste tombe dans 4…6, jamais 12.
  const niveaux = new Set();
  for (let i = 0; i < 50; i += 1) niveaux.add(niveauDuSatellite('avantPoste', etat, rng));
  for (const n of niveaux) assert.ok(n >= 4 && n <= 6, `avant-poste de niveau ${n}, attendu 4…6`);
  assert.ok(niveaux.size > 1, 'le ±1 ne tire jamais : la règle est figée');

  // Et les deux tables se croisent : un type de satellite doit être un type de
  // site que le générateur sait peupler.
  for (const type of Object.keys(ANNEAUX)) {
    assert.ok(TYPES_SITE[type] !== undefined, `« ${type} » n'est pas un type de site`);
  }
});

test('satellites — une table malformée est refusée, une table vide ne l\'est pas', () => {
  assert.deepEqual(problemesDesSatellites(satellitesVides()), []);

  const hors = satellitesVides();
  hors.presents.push({
    type: 'camp', rangee: GEOGRAPHIE.carte.hauteur + 5, colonne: 3, niveau: 1, instance: 1,
  });
  hors.prochaineInstance = 2;
  assert.ok(problemesDesSatellites(hors).some((m) => m.includes('hors carte')));

  const inconnu = satellitesVides();
  inconnu.presents.push({ type: 'forteresse', rangee: 100, colonne: 3, niveau: 1, instance: 1 });
  inconnu.prochaineInstance = 2;
  assert.ok(problemesDesSatellites(inconnu).some((m) => m.includes('inconnu')));

  // ⚠ UNE INSTANCE AU-DELÀ DU COMPTEUR EST UNE FAUTE, et c'est elle qui
  // attraperait un compteur remis à zéro par erreur — la faute qui ferait
  // repartir toutes les dispositions de camps depuis le début.
  const avance = satellitesVides();
  avance.presents.push({ type: 'camp', rangee: 100, colonne: 3, niveau: 1, instance: 9 });
  assert.ok(problemesDesSatellites(avance).some((m) => m.includes('au-delà du compteur')));

  assert.ok(problemesDesSatellites(null).length > 0);
  assert.ok(problemesDesSatellites({ presents: [], attentes: {} }).length > 0);
});

test('satellites — une apparition ne consomme PAS le flux de l\'état', () => {
  // ⚠ LA RÈGLE MESURÉE DE FACE, parce que le test des deux chemins ne la tient
  // pas (voir son commentaire). Si le tirage passait par `etat.rng`, le flux
  // aurait avancé après l'apparition — et le jour où une autre mécanique tirera
  // pendant un tick, les deux chemins d'avancement divergeraient pour de bon.
  const etat = creerEtat(4242);
  const avant = JSON.stringify(etat.rng);

  rattraperJeu(etat, TICKS_APPARITION);
  assert.equal(etat.satellites.presents.length, 3, 'rien n\'a paru : le montage ne mesure rien');
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
  etat.satellites = satellitesVides();

  // On sature l'anneau des camps — 1 à 2 cases — avec des occupants factices.
  const anneau = casesDeLAnneau(etat.position, ANNEAUX.camp.min, ANNEAUX.camp.max);
  assert.equal(anneau.length, 24, 'le montage suppose un anneau complet');
  let instance = 1;
  for (const k of anneau) {
    etat.satellites.presents.push({
      type: 'camp', rangee: k.rangee, colonne: k.colonne, niveau: 1, instance,
    });
    instance += 1;
  }
  etat.satellites.prochaineInstance = instance;

  etat.satellites.attentes = [{ type: 'camp', tickDu: 0 }];
  const parus = resoudreSatellites(etat);

  assert.equal(parus, 0, 'un camp est paru dans un anneau plein');
  assert.equal(etat.satellites.presents.length, 24, 'un vingt-cinquième occupant a été posé');
  assert.equal(etat.satellites.attentes.length, 1, 'l\'attente a été perdue en silence');

  // Et elle se satisfait dès qu'une place se libère : reportée, pas annulée.
  etat.satellites.presents.pop();
  assert.equal(resoudreSatellites(etat), 1);
  assert.deepEqual(etat.satellites.attentes, []);
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
  etat.position = { rangee: 240, colonne: 3 };

  const dansLAnneau = casesDeLAnneau(etat.position, 1, 5)
    .filter((k) => estBaseOuvrage(etat.graine, k.rangee, k.colonne));
  assert.ok(dansLAnneau.length >= 3, `${dansLAnneau.length} bases dans l'anneau : rien à mesurer`);

  // On rejoue l'apparition un grand nombre de fois pour couvrir les tirages : un
  // seul passage pourrait éviter les bases par chance.
  const sur = [];
  for (let n = 0; n < 60; n += 1) {
    planifierSatellites(etat);
    rattraperJeu(etat, TICKS_APPARITION);
    for (const s2 of etat.satellites.presents) {
      if (estBaseOuvrage(etat.graine, s2.rangee, s2.colonne)) sur.push(s2);
    }
  }
  assert.deepEqual(sur, [], `${sur.length} satellites posés sur une base de l'Ouvrage`);
});
