// L'ENCOMBREMENT D'UNE BASE — lot VOISINAGE-ET-MENACE, 08/09/2026.
//
// Neuf tests dans l'ordre du brief. Les deux qui comptent le plus ne portent
// pas sur la fondation mais sur ce que la règle FERME : `VM T4` prouve que le
// contournement par déplacement n'existe plus, et `VM T3` mesure le RAYON —
// seul, `VM T1` serait vert à n'importe quel rayon supérieur ou égal à un.
//
// ⚠⚠ TOUS LES MONTAGES RASENT LE VOISINAGE AVANT DE MESURER, ET CE N'EST PAS
// UN CONFORT. Mesuré au moment d'écrire ces tests : passé la garde du départ,
// **0,3 % à 3 % des cases seulement ont un 3 × 3 libre de base de l'Ouvrage** —
// à la rangée 50, ZÉRO sur 290. Un montage qui poserait sa base sur une carte
// intacte mesurerait donc la DENSITÉ du peuplement et pas la règle : tout y est
// refusé, et une falsification qui retire le refus laisserait le test vert.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  problemesDuVoisinageDesBases, CODE_VOISINAGE,
} from '../src/sim/voisinage-des-bases.js';
import { problemesDeLaFondation } from '../src/sim/fondation.js';
import {
  problemesDuDeplacement, casesAtteignables,
} from '../src/sim/deplacement.js';
import { creerEtat } from '../src/sim/state.js';
import { siteDeLaCase } from '../src/sim/site-de-la-case.js';
import { estBaseOuvrage, basesDeLaFenetre } from '../src/sim/peuplement.js';
import { caseRasee, ruineFraiche } from '../src/sim/ruines.js';
import { JOUEUR } from '../src/sim/territoire.js';
import { baseAttaqueALaMinute } from '../src/sim/raid-ouvrage.js';
import { ENCOMBREMENT_DES_BASES } from '../src/data/sites.js';

const RAYON = ENCOMBREMENT_DES_BASES.rayonCases;

/** Rase toutes les bases de l'Ouvrage d'une fenêtre — sauf celles épargnées. */
function raserAutour(etat, centre, rayon, epargnees = []) {
  const garde = new Set(epargnees.map((k) => `${k.rangee},${k.colonne}`));
  const fenetre = {
    premiereRangee: centre.rangee - rayon, derniereRangee: centre.rangee + rayon,
    premiereColonne: centre.colonne - rayon, derniereColonne: centre.colonne + rayon,
  };
  for (const o of basesDeLaFenetre(etat.graine, fenetre)) {
    if (garde.has(`${o.rangee},${o.colonne}`)) continue;
    etat.basesRasees.push(caseRasee(o.rangee, o.colonne));
  }
}

/** La première base de l'Ouvrage trouvée près d'une rangée, sur une graine. */
function uneBaseOuvrage(graine, rangee, colonne, rayon = 6) {
  for (let r = rangee - rayon; r <= rangee + rayon; r += 1) {
    for (let c = colonne - rayon; c <= colonne + rayon; c += 1) {
      if (estBaseOuvrage(graine, r, c)) return { rangee: r, colonne: c };
    }
  }
  return null;
}

/** Les cases à distance de Tchebychev EXACTEMENT `d` d'un centre. */
function couronne(centre, d) {
  const cases = [];
  for (let dr = -d; dr <= d; dr += 1) {
    for (let dc = -d; dc <= d; dc += 1) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
      cases.push({ rangee: centre.rangee + dr, colonne: centre.colonne + dc });
    }
  }
  return cases;
}

const porteLeCode = (liste) => liste.some((p) => p.code === CODE_VOISINAGE);

/** La source d'un module du dépôt, comme `chantier.test.js` la lit. */
function readSource(chemin) {
  return readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');
}

/**
 * Une partie posée près d'une base de l'Ouvrage ISOLÉE À LA MAIN — la seule
 * façon de mesurer la règle plutôt que la densité du peuplement.
 */
function montageAutourDUneBaseOuvrage(graine = 7, rangee = 250, colonne = 16) {
  const etat = creerEtat(graine);
  etat.recherche.basesAutorisees = 9;
  const ouvrage = uneBaseOuvrage(graine, rangee, colonne);
  assert.ok(ouvrage, `graine ${graine} : aucune base de l'Ouvrage près de ${rangee}`);
  // la base du joueur se pose assez près pour que `trop-loin` se taise, et
  // assez loin pour que sa PROPRE couronne ne se mêle pas de la mesure.
  etat.bases[0].position = { rangee: ouvrage.rangee + 5, colonne: ouvrage.colonne };
  raserAutour(etat, ouvrage, 8, [ouvrage]);
  assert.equal(siteDeLaCase(etat, ouvrage.rangee, ouvrage.colonne)?.type, 'base',
    'le montage suppose la base de l\'Ouvrage encore debout');
  return { etat, ouvrage };
}

test('VM T1 — les huit voisines d\'une base Ouvrage sont refusées à la fondation', () => {
  const { etat, ouvrage } = montageAutourDUneBaseOuvrage();
  const huit = couronne(ouvrage, 1);
  assert.equal(huit.length, 8, 'le montage suppose huit voisines');
  for (const c of huit) {
    const p = problemesDeLaFondation(etat, c);
    assert.ok(porteLeCode(p),
      `(${c.rangee},${c.colonne}) devrait porter « ${CODE_VOISINAGE} » — reçu ${p.map((x) => x.code).join('+') || '(rien)'}`);
  }
  // ⚠ ET LE MONTAGE DOIT POUVOIR RENDRE UNE LISTE VIDE, sans quoi il ne
  // mesurerait rien : une case franchement à l'écart passe.
  const loin = { rangee: ouvrage.rangee + 4, colonne: ouvrage.colonne + 4 };
  assert.equal(porteLeCode(problemesDeLaFondation(etat, loin)), false,
    'le montage ne discrimine pas : même une case à l\'écart est refusée');
});

test('VM T2 — la symétrie tient pour les bases du joueur', () => {
  const etat = creerEtat(11);
  etat.recherche.basesAutorisees = 9;
  const chezSoi = { rangee: 288, colonne: 16 };
  etat.bases[0].position = { ...chezSoi };
  raserAutour(etat, chezSoi, 8);
  for (const c of couronne(chezSoi, 1)) {
    assert.ok(porteLeCode(problemesDeLaFondation(etat, c)),
      `(${c.rangee},${c.colonne}) : une base du JOUEUR encombre aussi`);
  }
  // ⚠ LA MOITIÉ QUI DISCRIMINE : sans l'Ouvrage autour, la couronne 2 passe.
  // Sans elle, un montage qui refuserait tout rendrait ce test vert.
  for (const c of couronne(chezSoi, 2)) {
    assert.equal(porteLeCode(problemesDeLaFondation(etat, c)), false,
      `(${c.rangee},${c.colonne}) ne devrait rien porter : le montage est nu`);
  }
});

test('VM T3 — la couronne suivante passe, et c\'est elle qui mesure le rayon', () => {
  const { etat, ouvrage } = montageAutourDUneBaseOuvrage();
  const seize = couronne(ouvrage, 2);
  assert.equal(seize.length, 16, 'le montage suppose seize cases à Tchebychev 2');
  for (const c of seize) {
    assert.equal(porteLeCode(problemesDeLaFondation(etat, c)), false,
      `(${c.rangee},${c.colonne}) est à Tchebychev 2 : le rayon vaut ${RAYON}, elle doit passer`);
  }
  // ⚠ ET LE RAYON SE LIT DANS LA TABLE, il ne se retape pas ici : porter
  // `ENCOMBREMENT_DES_BASES.rayonCases` à 2 doit faire tomber ce test.
  assert.equal(RAYON, 1, 'le rayon de l\'encombrement vaut une case — Tchebychev');
});

test('VM T4 — le déplacement refuse les mêmes huit cases', () => {
  const { etat, ouvrage } = montageAutourDUneBaseOuvrage();
  // la base doit pouvoir ATTEINDRE la couronne : on la met à cinq cases, et on
  // purge le délai pour que `delai` ne parle pas à la place du voisinage.
  etat.bases[0].dernierDeplacementTick = null;
  for (const c of couronne(ouvrage, 1)) {
    const p = problemesDuDeplacement(etat, c);
    assert.ok(porteLeCode(p),
      `(${c.rangee},${c.colonne}) : le déplacement doit refuser comme la fondation`);
  }
  // ⚠⚠ LE TROU QUE LE LOT FERME : la case EXACTE. Avant lui,
  // `problemesDuDeplacement` ne connaissait que `hors-carte`, `sur-place`,
  // `trop-loin` et `delai` — déplacer sa base SUR une base de l'Ouvrage était
  // permis, et le geste l'effaçait de la carte.
  assert.ok(porteLeCode(problemesDuDeplacement(etat, ouvrage)),
    'la case exacte d\'une base de l\'Ouvrage doit être refusée au déplacement');
  // et la couronne 2 échappe au VOISINAGE, sinon le test ne mesure rien
  //
  // ⚠⚠ LA DISCRIMINATION PORTE SUR LE CODE, PLUS SUR LA LISTE VIDE — lot
  // RÈGLES-DE-CARTE, 10/09/2026. Elle cherchait une case de la couronne 2 SANS
  // AUCUN problème ; il n'y en a plus, et pas parce que le voisinage aurait
  // grossi : le déplacement refuse désormais une case TENUE par l'Ouvrage, et la
  // base laissée vivante par ce montage tient son octogone de rayon 3 — donc
  // toute la couronne 2. Ce que ce test mesure est le RAYON du voisinage, qui
  // vaut un ; il le mesure donc sur SON code, et la falsification garde toute sa
  // force — une règle de voisinage élargie à deux cases le fait tomber.
  const libre = couronne(ouvrage, 2).find(
    (c) => !porteLeCode(problemesDuDeplacement(etat, c)),
  );
  assert.ok(libre,
    'le montage ne discrimine pas : la couronne 2 porte le code de voisinage');
  // ⚠ ET ELLE EST BIEN REFUSÉE POUR UNE AUTRE RAISON, QUI EST LA BONNE : le
  // territoire. Sans cette ligne, on ne saurait pas si la couronne 2 est libre
  // ou refusée par la règle d'à côté, et le rapport ne pourrait pas le dire.
  assert.ok(
    problemesDuDeplacement(etat, libre).some((p) => p.code === 'territoire-ennemi'),
    'la couronne 2 devrait être tenue par la base de l\'Ouvrage restée vivante',
  );
});

test('VM T5 — la base qui bouge ne se refuse pas elle-même', () => {
  const etat = creerEtat(11);
  const chezSoi = { rangee: 288, colonne: 16 };
  etat.bases[0].position = { ...chezSoi };
  etat.bases[0].dernierDeplacementTick = null;
  raserAutour(etat, chezSoi, 8);

  for (const c of couronne(chezSoi, 1)) {
    const p = problemesDuDeplacement(etat, c);
    assert.equal(porteLeCode(p), false,
      `(${c.rangee},${c.colonne}) : la base qui bouge libère sa case de départ`);
  }
  // ⚠⚠ LA MOITIÉ QUI PROUVE QUE L'EXCLUSION EST BIEN CIBLÉE, et sans elle ce
  // test passerait sur une fonction qui ne compte AUCUNE base du joueur : la
  // MÊME case, demandée sans exclure la base, doit être refusée.
  for (const c of couronne(chezSoi, 1)) {
    assert.ok(porteLeCode(problemesDuVoisinageDesBases(etat, c)),
      `(${c.rangee},${c.colonne}) : sans exclusion, la base de départ encombre`);
  }
  // ⚠ ET UNE SECONDE BASE, ELLE, COMPTE TOUJOURS. L'exclusion porte sur UNE
  // base — celle qui bouge —, jamais sur toutes.
  const voisine = { rangee: chezSoi.rangee + 3, colonne: chezSoi.colonne };
  etat.bases.push({ ...etat.bases[0], position: { ...voisine } });
  assert.ok(porteLeCode(problemesDuDeplacement(etat, { rangee: voisine.rangee + 1, colonne: voisine.colonne })),
    'une AUTRE base du joueur encombre, même quand la courante est exclue');
});

test('VM T6 — poser SUR une base garde son message d\'origine', () => {
  const { etat, ouvrage } = montageAutourDUneBaseOuvrage();
  const p = problemesDeLaFondation(etat, ouvrage);
  assert.ok(p.some((x) => x.code === 'case-occupee'
    && x.message === 'Une base de l\'Ouvrage occupe cette case.'),
  `la case exacte doit garder son refus de crushabilité — reçu ${JSON.stringify(p)}`);
  // ⚠ ET LE VOISINAGE PARLE AUSSI, ce qui est un ÉCART DÉCLARÉ au brief : les
  // deux répondent à deux questions différentes — « y a-t-il ici quelque chose
  // que je ne peux pas écraser ? » et « le 3 × 3 est-il libre de bases ? ».
  assert.ok(porteLeCode(p), 'le 3 × 3 contient son centre : le voisinage parle aussi');
});

test('VM T7 — ni camp, ni avant-poste, ni ruine n\'encombre', () => {
  const etat = creerEtat(11);
  etat.recherche.basesAutorisees = 9;
  const chezSoi = { rangee: 288, colonne: 16 };
  etat.bases[0].position = { ...chezSoi };
  raserAutour(etat, chezSoi, 10);

  const candidate = { rangee: chezSoi.rangee + 4, colonne: chezSoi.colonne + 4 };
  assert.equal(porteLeCode(problemesDeLaFondation(etat, candidate)), false,
    'le montage doit partir d\'une candidate acceptée');

  // un camp et un avant-poste DANS la couronne de la candidate
  etat.bases[0].satellites.presents.push(
    { type: 'camp', rangee: candidate.rangee - 1, colonne: candidate.colonne, niveau: 3, instance: 1 },
    { type: 'avantPoste', rangee: candidate.rangee + 1, colonne: candidate.colonne, niveau: 4, instance: 2 },
  );
  etat.prochaineInstanceSatellite = 3;
  assert.equal(siteDeLaCase(etat, candidate.rangee - 1, candidate.colonne)?.type, 'camp',
    'le montage suppose le camp posé');
  assert.equal(porteLeCode(problemesDeLaFondation(etat, candidate)), false,
    'un camp et un avant-poste ne sont pas des bases : ils n\'encombrent pas');

  // une RUINE active dans la couronne
  etat.basesRasees.push(
    ruineFraiche(candidate.rangee, candidate.colonne + 1, 'base', JOUEUR, 12, etat.horloge.nbTicks),
  );
  assert.equal(porteLeCode(problemesDeLaFondation(etat, candidate)), false,
    'une ruine n\'est pas une base : elle n\'encombre pas');
});

test('VM T8 — casesAtteignables ne propose plus une case qui sera refusée', () => {
  const { etat, ouvrage } = montageAutourDUneBaseOuvrage();
  etat.bases[0].dernierDeplacementTick = null;
  const atteignables = casesAtteignables(etat);
  assert.ok(atteignables.length > 0, 'le montage doit laisser des cases atteignables');
  const fautives = atteignables.filter(
    (c) => porteLeCode(problemesDuVoisinageDesBases(etat, c, etat.bases[0])),
  );
  assert.deepEqual(fautives, [],
    'aucune case proposée ne doit porter le refus de voisinage');
  // ⚠⚠ ELLE SUIT PAR CONSTRUCTION, ET C'EST LE FAIT À GARDER : elle INTERROGE
  // `problemesDuDeplacement` au lieu de réécrire ses règles — le motif de
  // `casesPosables` de l'écran Chantier. La faute qui peut arriver n'est pas
  // « oublier de la corriger », c'est qu'elle se remette à décider seule.
  const source = readSource('src/sim/deplacement.js');
  const corps = source.slice(source.indexOf('export function casesAtteignables'));
  assert.match(corps, /problemesDuDeplacement\(etat, \{ rangee: r, colonne: c \}\)/,
    'casesAtteignables doit INTERROGER problemesDuDeplacement, pas réécrire ses règles');
  // et la couronne de l'Ouvrage est bien dans le carré qu'elle balaie
  assert.ok(couronne(ouvrage, 1).every(
    (c) => Math.abs(c.rangee - etat.bases[0].position.rangee) <= 10,
  ), 'le montage suppose la couronne dans le carré de balayage');
});

test('VM T9 — non-régression du tirage de raid', () => {
  // ⚠⚠ ELLE HACHE LA CASE ET LA MINUTE, JAMAIS LA CIBLE. Ce lot ne touche pas
  // `sim/raid-ouvrage.js` ; si cette suite bouge, quelque chose a été touché
  // qui ne devait pas l'être. L'empreinte est celle de l'arbre de ce lot, et
  // elle est FIGÉE ici pour que le prochain lot la confronte.
  let empreinte = 0;
  let tirs = 0;
  for (let graine = 1; graine <= 20; graine += 1) {
    const base = { rangee: 240 + graine, colonne: 10 + (graine % 7) };
    for (let minute = 1; minute <= 1000; minute += 1) {
      const b = baseAttaqueALaMinute(graine, base, minute);
      if (b) { tirs += 1; empreinte = (empreinte * 31 + graine * 1000 + minute) % 1000000007; }
    }
  }
  assert.equal(tirs, 7, 'le nombre de tirs sur 20 graines × 1000 minutes a changé');
  assert.equal(empreinte, 662170501, 'la SUITE des minutes qui tirent a changé');
});

