// Lot TRANSFERT — ce qui se passe au plafond de stockage.
//
// ⚠⚠ DEUX RÈGLES QUI SE LISENT ENSEMBLE, ET C'EST TOUT LE LOT. Le butin d'un
// raid a le droit de DÉPASSER la capacité, et tant qu'il est au-dessus, cette
// ressource-là cesse d'être produite dans cette base. Le transfert entre bases,
// lui, est REFUSÉ s'il ferait déborder : rien ne se perd jamais.
//
// ⚠ T1, T2 ET T3 NE GARDENT PAS DU CODE NEUF — ILS PROUVENT LA PRÉMISSE. Le gel
// du surplus a été arbitré le 26/08 et écrit dans les DEUX chemins de
// `economie-base.js` ; ce lot ne l'invente pas, il retire ce qui l'empêchait.
// Ils vivent ici parce qu'un lot futur qui casserait le gel rendrait la règle du
// butin incohérente, et c'est ICI qu'on lira pourquoi.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { creerEtat, poser, basculerVersLaBase } from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { poserLaBaseSur } from '../src/sim/deplacement.js';
import { fonderUneBase } from '../src/sim/fondation.js';
import {
  tickEconomieBase, rattrapageEconomieBase, capacitesMilli, RESSOURCES,
} from '../src/sim/economie-base.js';
import {
  problemesDuTransfert, transferer, apercuDuTransfert,
  casesEntreDeuxBases, recuMilli,
  RESSOURCES_TRANSFERABLES, RESSOURCES_INTERDITES,
} from '../src/sim/transfert.js';
import { TRANSFERT } from '../src/data/sites.js';
import { vueDuTransfert, nomDeLaBase } from '../src/ui/transfert.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Une base qui produit dans les deux ressources — sinon rien ne sature. */
function baseProductive(graine = 3) {
  const etat = creerEtat(graine);
  const b = baseCourante(etat);
  const poses = { quartz: 0, scorie: 0 };
  for (const c of b.champs.cases) {
    if (poses[c.ressource] >= 2) continue;
    try {
      poser(etat, 'collecteur', c.rangee, c.colonne);
      poses[c.ressource] += 1;
    } catch { /* case illégale : on passe à la suivante */ }
  }
  assert.ok(poses.quartz > 0 && poses.scorie > 0,
    'le montage ne produit pas dans les deux ressources : il ne mesure rien');
  return etat;
}

/**
 * Deux bases du joueur, la seconde à `ecart` cases de la première.
 *
 * ⚠⚠ ON FONDE EN BAS PUIS ON MONTE, ET CE N'EST PAS UN ARRANGEMENT DE TEST :
 * fonder est interdit dans le territoire de l'Ouvrage, qui couvre TOUT au-delà
 * de la rangée 270 environ — mesuré au lot BASES-1, moins d'une case fondable
 * sur 317. Une seconde base loin de la première ne peut donc pas être FONDÉE
 * là : elle s'y déplace. `poserLaBaseSur` est le seul écrivain de `position`,
 * celui-là même qu'emploie le rasage.
 *
 * ⚠ ET LA SOURCE RESTE COURANTE. Fonder rend la neuve courante ; les tests
 * ci-dessous parlent d'indices, mais un écran qui lirait `baseCourante` doit
 * trouver la base 0.
 */
function deuxBases(graine = 3, rangeeSource = 293, ecart = 4) {
  const etat = baseProductive(graine);
  poserLaBaseSur(etat, rangeeSource, 16);
  etat.recherche.basesAutorisees = 2;
  fonderUneBase(etat, { rangee: rangeeSource - 1, colonne: 16 });
  poserLaBaseSur(etat, rangeeSource - ecart, 16, etat.bases[1]);
  basculerVersLaBase(etat, 0);
  assert.equal(
    casesEntreDeuxBases(etat.bases[0].position, etat.bases[1].position), ecart,
    'le montage n\'a pas la distance qu\'il croit',
  );
  return etat;
}

// ---------------------------------------------------------------------------
// T1 · T2 · T3 — la prémisse : le surplus se gèle, par ressource
// ---------------------------------------------------------------------------

test('TRANSFERT T1 — un stock au-dessus du plafond se GÈLE : ni montée, ni amputation', () => {
  const etat = baseProductive();
  const b = baseCourante(etat);
  const caps = capacitesMilli(b.disposition);
  const depart = caps.quartz * 3;

  const eco = structuredClone(b.economie);
  eco.ressources = { quartz: depart, scorie: 0, electricite: 0 };
  for (let i = 0; i < 2000; i += 1) tickEconomieBase(eco, b.disposition, b.champs);

  // ⚠ LES DEUX MOITIÉS COMPTENT. « Il ne monte plus » seul passerait sur un code
  // qui RABAT à la capacité ; « il n'est pas amputé » seul passerait sur un code
  // qui laisse monter sans plafond.
  assert.equal(eco.ressources.quartz, depart, 'le surplus a monté ou a été rogné');
  assert.ok(eco.ressources.quartz > caps.quartz,
    'le montage ne mesure rien : le stock n\'est pas au-dessus du plafond');
});

test('TRANSFERT T2 — les deux chemins s\'accordent EN PARTANT AU-DESSUS du plafond', () => {
  // ⚠⚠ C'EST UN POINT D'ARRÊT DU BRIEF : si les deux chemins divergeaient
  // au-dessus du plafond, ce serait un bogue plus important que tout ce lot.
  const etat = baseProductive();
  const b = baseCourante(etat);
  const caps = capacitesMilli(b.disposition);

  const parTick = structuredClone(b.economie);
  parTick.ressources = { quartz: caps.quartz * 3, scorie: 0, electricite: 0 };
  const enBloc = structuredClone(parTick);

  const N = 4000;
  for (let i = 0; i < N; i += 1) tickEconomieBase(parTick, b.disposition, b.champs);
  rattrapageEconomieBase(enBloc, b.disposition, b.champs, N);

  // ⚠ L'ÉTAT ENTIER, RÉSIDUS COMPRIS — pas seulement les stocks. C'est le résidu
  // qui diverge en premier quand les deux chemins se séparent, et il ne se voit
  // pas dans un stock saturé.
  assert.deepEqual(parTick, enBloc, 'les deux chemins divergent au-dessus du plafond');
  assert.ok(parTick.ressources.scorie > 0,
    'le montage ne mesure rien : rien n\'a été produit pendant la fenêtre');
});

test('TRANSFERT T3 — la production s\'arrête pour CETTE ressource seulement', () => {
  const etat = baseProductive();
  const b = baseCourante(etat);
  const caps = capacitesMilli(b.disposition);

  const eco = structuredClone(b.economie);
  eco.ressources = { quartz: caps.quartz * 3, scorie: 0, electricite: 0 };
  const departQuartz = eco.ressources.quartz;
  for (let i = 0; i < 2000; i += 1) tickEconomieBase(eco, b.disposition, b.champs);

  assert.equal(eco.ressources.quartz, departQuartz, 'le quartz saturé a bougé');
  assert.ok(eco.ressources.scorie > 0,
    'la scorie n\'a rien produit : le quartz plein arrête toute la base');
  assert.ok(eco.ressources.scorie < caps.scorie,
    'le montage ne mesure rien : la scorie a saturé elle aussi pendant la fenêtre');
});

// ---------------------------------------------------------------------------
// T5 · T6 — la racine carrée entière
// ---------------------------------------------------------------------------

test('TRANSFERT T5 — round(√x) en entiers ≡ Math.round(Math.sqrt(x)), sur TOUS les couples', () => {
  let compares = 0;
  const ecarts = [];
  for (let dr = 0; dr <= 140; dr += 1) {
    for (let dc = 0; dc <= 140; dc += 1) {
      const attendu = Math.round(Math.sqrt(dr * dr + dc * dc));
      // ⚠ AU-DELÀ DE LA PORTÉE, LA BOUCLE S'ARRÊTE VOLONTAIREMENT et rend la
      // borne : on ne compare donc que ce qui est dans le domaine utile.
      if (attendu > TRANSFERT.porteeMaxCases) continue;
      const obtenu = casesEntreDeuxBases({ rangee: 0, colonne: 0 }, { rangee: dr, colonne: dc });
      compares += 1;
      if (obtenu !== attendu) ecarts.push(`(${dr},${dc}) : ${obtenu} au lieu de ${attendu}`);
    }
  }
  // ⚠ LE COMPTE EST ASSERTÉ, PAS BORNÉ. Sur les 19 881 couples de 0 à 140 dans
  // les deux axes, 7 879 ont une distance arrondie qui tombe dans les 99 cases
  // permises — les autres sont au-delà de la portée, où la fonction s'arrête
  // volontairement. Un « au moins tant » laisserait le domaine rétrécir en
  // silence le jour où la borne changerait.
  assert.equal(compares, 7879, `${compares} couples comparés : le domaine a changé`);
  assert.deepEqual(ecarts.slice(0, 5), [], `${ecarts.length} désaccord(s) avec la racine flottante`);

  // ⚠ ET LA BORNE MORD, elle n'est pas décorative : au-delà, on rend
  // `porteeMaxCases + 1` sans continuer à compter.
  assert.equal(
    casesEntreDeuxBases({ rangee: 0, colonne: 0 }, { rangee: 3000, colonne: 0 }),
    TRANSFERT.porteeMaxCases + 1,
    'la boucle n\'est pas bornée : une position absurde la ferait tourner longtemps',
  );

  // Falsifiable : tronquer au lieu d'arrondir se voit sur un carré non parfait.
  // 2 cases en diagonale font √8 = 2,83 → 3 arrondi, 2 tronqué.
  assert.equal(casesEntreDeuxBases({ rangee: 0, colonne: 0 }, { rangee: 2, colonne: 2 }), 3);
});

/**
 * Les deux seuls `Math.sqrt` que `src/` a le droit de porter — et ils sont
 * NOMMÉS.
 *
 * ⚠⚠ LE BRIEF DEMANDAIT « aucun Math.sqrt dans src/ : le grep reste vide », ET
 * C'EST IMPOSSIBLE — ÉCART DÉCLARÉ. Les deux existent depuis les lots
 * ÉCRAN-CARTE et RETOURS-DU-31, ils sont dans le chemin du DESSIN, et
 * `ui/monde.js` porte déjà le commentaire qui dit pourquoi : « ici une racine
 * est légitime […] on est dans le DESSIN, en pixels, pas dans une règle de jeu ».
 * `render/terrain.js` normalise une somme pondérée de tuiles ; `ui/monde.js`
 * normalise un vecteur d'écran pour tracer une flèche. Les retirer casserait le
 * rendu sans rien gagner : aucun des deux ne DÉCIDE quoi que ce soit.
 *
 * ⚠ CE QUE LA GARDE TIENT VRAIMENT — et c'est la doctrine du lot EUCLIDE, pas
 * une invention de celui-ci : **aucune racine là où une règle se décide**, donc
 * interdiction TOTALE dans `src/sim/` et `src/data/`. Ailleurs, la liste est
 * FERMÉE : un troisième fichier fait tomber ce test, ce qui force à regarder
 * plutôt qu'à ajouter.
 */
// ⚠⚠ `src/render/terrain.js` EN EST SORTI — lot SOL-SATELLITE, 05/09, ET C'EST
// UN RESSERREMENT. Sa racine était le `√(Σwᵢ²)` qui normalisait la somme
// pondérée du pavage indexé ; le sol est maintenant fait de blocs à partition de
// l'unité, où `Σw` vaut exactement 1 et où il n'y a rien à normaliser. La liste
// tombe donc de deux à UN, et un fichier qui la rejoindrait ferait tomber ce
// test — ce qu'on lui demande.
const RACINES_DE_DESSIN_TOLEREES = ['src/ui/monde.js'];

test('TRANSFERT T6 — aucun Math.sqrt là où une règle se décide', () => {
  const porteurs = [];
  for (const dossier of ['data', 'sim', 'render', 'ui']) {
    const base = join(RACINE, 'src', dossier);
    for (const nom of readdirSync(base)) {
      if (!nom.endsWith('.js')) continue;
      const source = readFileSync(join(base, nom), 'utf8')
        .split('\n')
        .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')
          && !l.trimStart().startsWith('/*'))
        .join('\n');
      if (/Math\.sqrt/.test(source)) porteurs.push(`src/${dossier}/${nom}`);
    }
  }
  // ⚠⚠ INTERDICTION TOTALE DANS LA SIMULATION ET LES DONNÉES. C'est là que les
  // règles se décident, et une racine flottante y ferait dépendre un refus de la
  // mantisse d'un `double`.
  const dansLaRegle = porteurs.filter((f) => f.startsWith('src/sim/') || f.startsWith('src/data/'));
  assert.deepEqual(dansLaRegle, [],
    `Math.sqrt là où une règle se décide : ${dansLaRegle.join(', ')}`);

  // ⚠ ET LA LISTE DU DESSIN EST FERMÉE, dans les deux sens : un fichier de plus
  // la fait tomber, un fichier qui perdrait sa racine aussi.
  assert.deepEqual(porteurs.sort(), [...RACINES_DE_DESSIN_TOLEREES].sort(),
    'la liste des racines de dessin tolérées ne correspond plus au disque');

  // ⚠ ET `sim/transfert.js` N'EN PORTE AUCUNE, nommément — c'est le fichier que
  // ce lot ajoute, et celui où la tentation serait la plus forte.
  const transfert = readFileSync(join(RACINE, 'src', 'sim', 'transfert.js'), 'utf8');
  assert.doesNotMatch(transfert.replace(/^\s*[*/].*$/gm, ''), /Math\.sqrt/);

  // Falsifiable des deux côtés : le motif attrape l'appât, et le retrait des
  // commentaires ne l'aveugle pas sur le corps du fichier.
  assert.match('const d = Math.sqrt(x);', /Math\.sqrt/);
  assert.doesNotMatch('const d = casesEntreDeuxBases(a, b);', /Math\.sqrt/);
});

// ---------------------------------------------------------------------------
// T7 · T14 — la taxe
// ---------------------------------------------------------------------------

test('TRANSFERT T7 — 0 case → 100 %, 10 cases → 90 %, 99 cases → 1 %', () => {
  assert.equal(TRANSFERT.taxeParCasePct, 1);
  assert.equal(TRANSFERT.porteeMaxCases, 99);
  assert.equal(recuMilli(1_000_000, 0), 1_000_000);
  assert.equal(recuMilli(1_000_000, 10), 900_000);
  assert.equal(recuMilli(1_000_000, 50), 500_000);

  // ⚠⚠ À 99 CASES IL RESTE 1 %, ET CE N'EST PAS UN CAS DÉGÉNÉRÉ : c'est la
  // dernière distance permise, elle doit marcher. La falsification du brief est
  // un refus écrit `>= 99` au lieu de `> 99`, qui rendrait cette ligne morte.
  assert.equal(recuMilli(1_000_000, 99), 10_000);
  assert.ok(recuMilli(1_000_000, 99) > 0, 'à 99 cases il n\'arrive plus rien');

  // Et à 100, il n'arrive rien — c'est pour ça que la borne est à 99.
  assert.equal(recuMilli(1_000_000, 100), 0);
});

test('TRANSFERT T7 bis — un transfert RÉEL à 99 cases passe, à 100 il est refusé', () => {
  // ⚠⚠ CE TEST EXISTE PARCE QUE LE PRÉCÉDENT NE MORDAIT PAS. La falsification
  // « écrire le refus `>= 99` au lieu de `> 99` » laissait TOUTE la suite verte :
  // le barème était bien testé à 99 cases, mais aucun test ne faisait PASSER un
  // transfert à cette distance-là. Mesuré, puis corrigé — c'est la borne du
  // refus, elle doit marcher, et il faut un transfert entier pour le dire.
  const etat = deuxBases(3, 293, 99);
  etat.bases[0].economie.ressources.quartz = 200_000;
  etat.bases[1].economie.ressources.quartz = 0;

  assert.deepEqual(problemesDuTransfert(etat, 0, 1, 'quartz', 100_000), [],
    'un transfert à 99 cases est refusé : la borne est écrite >= au lieu de >');
  const bilan = transferer(etat, 0, 1, 'quartz', 100_000);
  assert.equal(bilan.cases, 99);
  assert.equal(bilan.recuMilli, 1_000, 'il ne reste pas 1 % à 99 cases');
  assert.equal(etat.bases[1].economie.ressources.quartz, 1_000);

  // ⚠ ET À 100 CASES, C'EST REFUSÉ — l'autre côté de la borne.
  const trop = deuxBases(3, 293, 4);
  poserLaBaseSur(trop, 193, 16, trop.bases[1]);
  assert.equal(casesEntreDeuxBases(trop.bases[0].position, trop.bases[1].position), 100);
  trop.bases[0].economie.ressources.quartz = 200_000;
  assert.ok(problemesDuTransfert(trop, 0, 1, 'quartz', 100_000)
    .some((p) => p.code === 'trop-loin'), 'un transfert à 100 cases est accepté');
});

test('TRANSFERT T14 — en milli entiers : mille envois de 1 valent un envoi de 1000', () => {
  // ⚠⚠ LE MONTAGE NE TOMBE PAS ROND, ET C'EST OBLIGATOIRE. Sur un envoi
  // multiple de 100, `floor(e × 90 / 100)` et `floor(e / 100) × 90` rendent le
  // MÊME nombre : le test passerait sur les deux ordres et ne mesurerait pas
  // l'arrondi. C'est la faute que le dépôt a déjà payée deux fois — « un montage
  // qui tombe rond ne mesure pas un arrondi ».
  const uniteMilli = 1000;
  for (const cases of [1, 7, 10, 33, 50, 99]) {
    const enMille = recuMilli(uniteMilli, cases) * 1000;
    const enUneFois = recuMilli(uniteMilli * 1000, cases);
    assert.equal(enMille, enUneFois, `à ${cases} cases : le fractionnement change le total`);
  }

  // ⚠ ET LA FALSIFICATION MORD ICI : sur une quantité qui n'est pas multiple de
  // cent, diviser avant de multiplier perd jusqu'à 99 % de la fraction.
  const brut = 1050;
  assert.equal(recuMilli(brut, 10), 945, 'l\'ordre des opérations a changé');
  assert.notEqual(Math.floor(brut / 100) * 90, 945,
    'le montage ne distingue pas les deux ordres : il ne mesure rien');
});

// ---------------------------------------------------------------------------
// T8 · T9 · T10 · T11 — le refus
// ---------------------------------------------------------------------------

test('TRANSFERT T8 — un transfert qui déborderait est refusé, et il dit combien il manque', () => {
  const etat = deuxBases();
  const caps = capacitesMilli(etat.bases[1].disposition);
  etat.bases[0].economie.ressources.quartz = 10_000_000;
  etat.bases[1].economie.ressources.quartz = caps.quartz - 5_000;

  const avantSource = etat.bases[0].economie.ressources.quartz;
  const avantDest = etat.bases[1].economie.ressources.quartz;

  const problemes = problemesDuTransfert(etat, 0, 1, 'quartz', 1_000_000);
  const debordement = problemes.find((p) => p.code === 'debordement');
  assert.ok(debordement !== undefined, 'le débordement n\'est pas refusé');
  // ⚠ IL DIT COMBIEN, PAS « IMPOSSIBLE ». Un refus qui ne chiffre rien envoie le
  // joueur essayer au hasard.
  assert.match(debordement.message, /il lui manque \d+ de capacité de quartz/);

  // Et rien n'a bougé — `problemesDuTransfert` ne fait que répondre.
  assert.equal(etat.bases[0].economie.ressources.quartz, avantSource);
  assert.equal(etat.bases[1].economie.ressources.quartz, avantDest);
  assert.throws(() => transferer(etat, 0, 1, 'quartz', 1_000_000), /transfert impossible/);
});

test('TRANSFERT T9 — le refus se calcule sur le REÇU, pas sur l\'envoyé', () => {
  // ⚠⚠ CE MONTAGE NE DISCRIMINAIT PAS, ET LA FALSIFICATION L'A DIT. La première
  // écriture enfermait son assertion dans un `if (recu <= place)` qui n'était
  // jamais vrai : comparer l'ENVOYÉ au lieu du REÇU laissait la suite verte.
  // Il faut trois nombres dans cet ordre — `recu ≤ place < envoye` — et ils sont
  // assertés AVANT la mesure, sinon le test ne mesure rien.
  const etat = deuxBases(3, 293, 50);
  const place = capacitesMilli(etat.bases[1].disposition).quartz;
  etat.bases[1].economie.ressources.quartz = 0;

  const envoye = 80_000;
  const recu = recuMilli(envoye, 50);
  assert.equal(recu, 40_000);
  assert.ok(recu <= place, 'le montage ne mesure rien : le reçu ne tient pas');
  assert.ok(envoye > place,
    'le montage ne distingue pas les deux règles : l\'envoyé tiendrait aussi');

  etat.bases[0].economie.ressources.quartz = envoye;
  assert.deepEqual(
    problemesDuTransfert(etat, 0, 1, 'quartz', envoye), [],
    'un transfert dont le REÇU tient est refusé : le refus compare l\'envoyé',
  );

  // Et il passe vraiment : la destination reçoit le reçu, pas l'envoyé.
  transferer(etat, 0, 1, 'quartz', envoye);
  assert.equal(etat.bases[1].economie.ressources.quartz, recu);
});

test('TRANSFERT T10 — une destination déjà au-dessus de son plafond ne reçoit RIEN', () => {
  const etat = deuxBases();
  const caps = capacitesMilli(etat.bases[1].disposition);
  etat.bases[0].economie.ressources.quartz = 1_000_000;
  etat.bases[1].economie.ressources.quartz = caps.quartz * 3;

  // ⚠ CE N'EST PAS UN CAS PARTICULIER, c'est `max(cap, stock)` appliqué : la
  // place vaut zéro, donc même une unité déborde.
  const problemes = problemesDuTransfert(etat, 0, 1, 'quartz', 1000);
  assert.ok(problemes.some((p) => p.code === 'debordement'),
    'une base au-dessus de son plafond accepte encore du transfert');
  assert.throws(() => transferer(etat, 0, 1, 'quartz', 1000), /transfert impossible/);
});

test('TRANSFERT T11 — rien ne bouge quand le transfert échoue', () => {
  const etat = deuxBases();
  etat.bases[0].economie.ressources.quartz = 1_000_000;
  etat.bases[1].economie.ressources.quartz = capacitesMilli(etat.bases[1].disposition).quartz;

  const avant = JSON.stringify(etat);
  assert.throws(() => transferer(etat, 0, 1, 'quartz', 500_000));
  assert.equal(JSON.stringify(etat), avant,
    'un transfert refusé a modifié l\'état : le débit précède la vérification');

  // ⚠ ET LES AUTRES REFUS AUSSI — pas seulement le débordement.
  for (const [s, d, r, q] of [
    [0, 0, 'quartz', 1000], [0, 9, 'quartz', 1000],
    [0, 1, 'electricite', 1000], [0, 1, 'quartz', 0],
    [0, 1, 'quartz', 99_999_999],
  ]) {
    assert.throws(() => transferer(etat, s, d, r, q));
    assert.equal(JSON.stringify(etat), avant, `refus (${s}→${d}, ${r}, ${q}) : l'état a bougé`);
  }
});

// ---------------------------------------------------------------------------
// T12 · T13 — l'électricité, et d'où vient la distance
// ---------------------------------------------------------------------------

test('TRANSFERT T12 — l\'électricité est refusée, et la phrase la nomme', () => {
  const etat = deuxBases();
  etat.bases[0].economie.ressources.electricite = 40_000;

  const problemes = problemesDuTransfert(etat, 0, 1, 'electricite', 1000);
  const refus = problemes.find((p) => p.code === 'ressource-interdite');
  assert.ok(refus !== undefined, 'l\'électricité se transfère');
  assert.match(refus.message, /électricité/,
    'le refus ne nomme pas la ressource : le joueur cherchera un déblocage');

  // ⚠ LA LISTE EST CONFRONTÉE À `RESSOURCES`, dans les DEUX sens : une quatrième
  // ressource ajoutée au jeu doit faire ROUGIR ce test, pas devenir
  // transférable sans que personne l'ait décidé.
  assert.deepEqual([...RESSOURCES_TRANSFERABLES].sort(), ['quartz', 'scorie']);
  assert.deepEqual([...RESSOURCES_INTERDITES], ['electricite']);
  assert.deepEqual(
    [...RESSOURCES_TRANSFERABLES, ...RESSOURCES_INTERDITES].sort(), [...RESSOURCES].sort(),
    'une ressource du jeu n\'est ni transférable ni interdite',
  );

  // Les deux autres passent, elles.
  for (const r of RESSOURCES_TRANSFERABLES) {
    assert.equal(
      problemesDuTransfert(etat, 0, 1, r, 1000).some((p) => p.code === 'ressource-interdite'),
      false, `${r} est refusée alors qu'elle est transférable`,
    );
  }
});

test('TRANSFERT T13 — la distance vient des `position`, pas des `fondation`', () => {
  const etat = deuxBases(3, 293, 4);
  assert.equal(casesEntreDeuxBases(etat.bases[0].position, etat.bases[1].position), 4);

  // ⚠ ON DÉPLACE LA SECONDE BASE : sa `fondation` ne bouge pas, sa `position`
  // si. La distance doit suivre la POSITION — une base déplacée a bougé, son
  // terrain non.
  const fondationAvant = { ...etat.bases[1].fondation };
  poserLaBaseSur(etat, 283, 16, etat.bases[1]);
  assert.deepEqual(etat.bases[1].fondation, fondationAvant, 'le montage a bougé la fondation');
  assert.notDeepEqual(etat.bases[1].position, fondationAvant,
    'le montage ne mesure rien : position et fondation coïncident encore');

  const parPosition = casesEntreDeuxBases(etat.bases[0].position, etat.bases[1].position);
  const parFondation = casesEntreDeuxBases(etat.bases[0].fondation, etat.bases[1].fondation);
  assert.equal(parPosition, 10, 'la distance ne suit pas la position');
  assert.notEqual(parPosition, parFondation,
    'le montage ne distingue pas les deux : les deux distances sont égales');

  const apercu = apercuDuTransfert(etat, 0, 1, 100_000);
  assert.equal(apercu.cases, parPosition, 'l\'aperçu mesure depuis la fondation');
});

// ---------------------------------------------------------------------------
// Le transfert qui RÉUSSIT, et la taxe qui ne va nulle part
// ---------------------------------------------------------------------------

test('TRANSFERT — un transfert qui passe débite, crédite, et perd la taxe', () => {
  const etat = deuxBases(3, 293, 10);
  const cases = casesEntreDeuxBases(etat.bases[0].position, etat.bases[1].position);
  assert.equal(cases, 10);

  etat.bases[0].economie.ressources.quartz = 50_000;
  etat.bases[1].economie.ressources.quartz = 0;
  const totalAvant = etat.bases[0].economie.ressources.quartz
    + etat.bases[1].economie.ressources.quartz;

  assert.deepEqual(problemesDuTransfert(etat, 0, 1, 'quartz', 20_000), []);
  const bilan = transferer(etat, 0, 1, 'quartz', 20_000);

  assert.equal(bilan.cases, 10);
  assert.equal(bilan.taxePct, 10);
  assert.equal(bilan.recuMilli, 18_000);
  assert.equal(bilan.perduMilli, 2_000);
  assert.equal(etat.bases[0].economie.ressources.quartz, 30_000, 'la source n\'est pas débitée');
  assert.equal(etat.bases[1].economie.ressources.quartz, 18_000, 'la destination n\'est pas créditée');

  // ⚠⚠ LA TAXE NE VA NULLE PART, et c'est ce que ce test dit de face : le total
  // des deux bases a BAISSÉ d'exactement ce qui est annoncé perdu. Elle n'est ni
  // rangée dans un compteur, ni versée à une troisième base.
  const totalApres = etat.bases[0].economie.ressources.quartz
    + etat.bases[1].economie.ressources.quartz;
  assert.equal(totalAvant - totalApres, bilan.perduMilli, 'la taxe est allée quelque part');
});

test('TRANSFERT — le transfert n\'ajoute aucun champ à l\'état', () => {
  // ⚠ §2.8 DU BRIEF : le transfert est INSTANTANÉ, donc `SAVE_VERSION` ne bouge
  // pas. Un champ persistant apparu ici serait une migration due, et personne ne
  // le verrait avant la première sauvegarde relue.
  const etat = deuxBases(3, 293, 10);
  etat.bases[0].economie.ressources.quartz = 50_000;
  const clesAvant = {
    etat: Object.keys(etat).sort(),
    base: Object.keys(etat.bases[0]).sort(),
    economie: Object.keys(etat.bases[0].economie).sort(),
  };
  transferer(etat, 0, 1, 'quartz', 20_000);
  assert.deepEqual(Object.keys(etat).sort(), clesAvant.etat);
  assert.deepEqual(Object.keys(etat.bases[0]).sort(), clesAvant.base);
  assert.deepEqual(Object.keys(etat.bases[0].economie).sort(), clesAvant.economie);
});

test('TRANSFERT — les sept codes de refus existent, et chacun se déclenche', () => {
  const etat = deuxBases();
  etat.bases[0].economie.ressources.quartz = 1000;
  const code = (s, d, r, q) => problemesDuTransfert(etat, s, d, r, q).map((p) => p.code);

  assert.ok(code(0, 99, 'quartz', 1000).includes('base-inconnue'));
  assert.ok(code(0, 0, 'quartz', 1000).includes('meme-base'));
  assert.ok(code(0, 1, 'electricite', 1000).includes('ressource-interdite'));
  assert.ok(code(0, 1, 'quartz', 0).includes('quantite-nulle'));
  assert.ok(code(0, 1, 'quartz', 9_999_999).includes('stock-insuffisant'));

  const loin = deuxBases(3, 293, 4);
  poserLaBaseSur(loin, 60, 16, loin.bases[1]);
  assert.ok(problemesDuTransfert(loin, 0, 1, 'quartz', 1000)
    .map((p) => p.code).includes('trop-loin'));

  const plein = deuxBases();
  plein.bases[0].economie.ressources.quartz = 1_000_000;
  plein.bases[1].economie.ressources.quartz = capacitesMilli(plein.bases[1].disposition).quartz;
  assert.ok(problemesDuTransfert(plein, 0, 1, 'quartz', 500_000)
    .map((p) => p.code).includes('debordement'));
});

// ---------------------------------------------------------------------------
// §4.7 — le panneau, et ce qu'il annonce
// ---------------------------------------------------------------------------

test('TRANSFERT — le panneau annonce le REÇU, la distance et la taxe', () => {
  const etat = deuxBases(3, 293, 10);
  etat.bases[0].economie.ressources.quartz = 50_000;
  etat.bases[1].economie.ressources.quartz = 0;

  const vue = vueDuTransfert(etat, 1, 'quartz', 20);
  assert.equal(vue.cases, 10);
  assert.equal(vue.taxePct, 10);
  assert.equal(vue.envoye, 20);
  // ⚠ C'EST CE CHIFFRE-LÀ QUE LE JOUEUR NE PEUT PAS DEVINER, et c'est pour lui
  // que le panneau existe : 20 partent, 18 arrivent.
  assert.equal(vue.recu, 18);
  assert.equal(vue.perdu, 2);
  assert.equal(vue.possible, true);
  assert.deepEqual(vue.problemes, []);

  // ⚠ ET IL DIT LA PLACE QUI RESTE À L'ARRIVÉE, sans quoi un refus de
  // débordement tomberait sans prévenir.
  assert.equal(vue.place, Math.floor(capacitesMilli(etat.bases[1].disposition).quartz / 1000));
});

test('TRANSFERT — le panneau n\'existe pas tant qu\'il n\'y a qu\'une base', () => {
  const seule = creerEtat(3);
  assert.equal(vueDuTransfert(seule, 1, 'quartz', 10), null,
    'le panneau se peint sur une partie à une seule base');
  assert.equal(vueDuTransfert(null, 1, 'quartz', 10), null);

  // ⚠ ET LE BOUTON NAÎT CACHÉ DANS LE BALISAGE, pas seulement à la peinture :
  // sans l'attribut, il paraîtrait le temps d'une image au démarrage.
  const page = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  assert.match(page, /id="navigation-transfert" hidden/);
  assert.match(page, /id="transfert-panneau" hidden/);
});

test('TRANSFERT — l\'électricité n\'est pas dans la liste de l\'écran', () => {
  // ⚠⚠ UNE ABSENCE, PAS UN GRISÉ. Un choix grisé invite à chercher comment le
  // dégriser ; l'électricité ne se transférera jamais.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'transfert.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*'))
    .join('\n');
  assert.doesNotMatch(ecran, /'electricite'/,
    'l\'écran nomme l\'électricité : elle ne doit même pas figurer dans la liste');
  assert.match(ecran, /RESSOURCES_TRANSFERABLES/,
    'l\'écran écrit sa propre liste de ressources au lieu de lire celle du moteur');

  // Et la liste que l'écran garnit est bien celle du moteur, à deux entrées.
  assert.equal(RESSOURCES_TRANSFERABLES.length, 2);
});

test('TRANSFERT — l\'écran ne recalcule NI la taxe NI la portée', () => {
  // ⚠ IL DEMANDE, IL NE DÉCIDE PAS. Une seconde lecture des règles dans l'écran
  // divergerait de la première au premier réglage, et la divergence se lirait
  // comme un bogue de jeu. Le test cherche les deux nombres du calibrage.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'transfert.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')
      && !l.trimStart().startsWith('/*'))
    .join('\n');
  assert.doesNotMatch(ecran, /\b99\b/, 'la portée est écrite en dur dans l\'écran');
  assert.doesNotMatch(ecran, /100\s*-\s*/, 'la taxe est recalculée dans l\'écran');
  assert.match(ecran, /apercuDuTransfert|problemesDuTransfert/,
    'l\'écran ne passe pas par le moteur');
});
