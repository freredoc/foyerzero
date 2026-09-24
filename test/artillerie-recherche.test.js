// Lot ARTILLERIE-RECHERCHE — 23/09/2026.
//
// Les trois nœuds `soutienAntiInfanterie`, `soutienAntiAerien` et
// `soutienAntiVehicule` de l'onglet Spécial portaient `cout: null` depuis le lot
// RECHERCHE : ils s'affichaient, et ils ne s'achetaient pas. Ce lot leur donne un
// prix, un moteur, un bouton, et fait de leur achat la PORTE des trois bâtiments
// d'artillerie — le lot ARTILLERIE (build 187) avait branché l'EFFET.
//
// ⚠⚠ DEUX TESTS, ET LE PREMIER EST CELUI QU'ON NE RATTRAPE PAS. Le lot fait
// bouger `SAVE_VERSION` de 40 à 41 ; une sauvegarde mal migrée est perdue chez le
// joueur, pas chez nous. `SOUT T1` mesure donc les trois moitiés du maillon — il
// pose, il n'écrase pas, et il ne touche à rien d'autre.
//
// ⚠ PAS DE TROISIÈME TEST, ET C'EST UNE CONSIGNE DU BRIEF. L'achat lui-même —
// codes de refus, tri de la liste, doublon refusé — est le geste d'`acheter` et
// d'`acheterUneBaseDePlus`, déjà tenus par `test/recherche.test.js`. En écrire un
// de plus ici testerait le lot précédent, pas celui-ci.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ARTILLERIES, ORDRE_PALETTE } from '../src/data/base.js';
import {
  creerEtat, SAVE_VERSION, migrer, serialiser, charger, rattraperJeu, poserEffectif,
} from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { executerRaid } from '../src/sim/raid.js';
import { crediterLesReserves, plafondDeLaReserve } from '../src/sim/reparation.js';
import { enModeDeveloppeur } from '../src/sim/mode-developpeur.js';
import {
  acheter, acheterUnSoutien, coutDuSoutienMilli, soutienEstAcquis,
} from '../src/sim/recherche.js';
import { posablesDeLaBase } from '../src/ui/chantier.js';

const GRAINE = 7;
const INSTANT = 1_700_000_000_000;

/**
 * Une partie qui peut raider : un Chantier au niveau 12, les trois bâtiments de
 * production, six Meutes en vague 1, des points d'attaque et de la scorie. C'est
 * le montage de `test/journal-raids.test.js`, repris tel quel par
 * `test/verrous.test.js` avant celui-ci.
 */
function partieJouable(graine) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  baseCourante(etat).disposition[0].niveau = 12;
  let colonne = 1;
  for (const id of ['caserne', 'depotDeVehicules', 'aerodrome']) {
    baseCourante(etat).disposition.push({ id, rangee: 13, colonne, niveau: 5 });
    baseCourante(etat).economie.residus.push({});
    colonne += 2;
  }
  for (let c = 1; c <= 6; c += 1) {
    poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: c, niveau: 1 });
  }
  baseCourante(etat).economie.ressources.scorie = 1_000_000_000;
  etat.attaque.points = 100_000;
  crediterLesReserves(etat, plafondDeLaReserve(etat));
  return etat;
}

/** Le premier camp posé autour de la base. */
function premierCamp(etat) {
  const s = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
  return s === undefined ? null : { rangee: s.rangee, colonne: s.colonne };
}

/**
 * Une sauvegarde v40 RÉELLE : un état complet — raid mené, donc `rapports`
 * peuplé et points de recherche crédités —, une recherche où le joueur a acheté
 * pour de bon, puis la version rabaissée et le champ neuf retiré.
 *
 * ⚠⚠ C'EST L'IDIOME DU DÉPÔT, ET IL N'Y EN A PAS D'AUTRE : « les montages du
 * dépôt fabriquent leurs vieilles sauvegardes en RABAISSANT une récente ».
 * Écrire une v40 à la main donnerait un objet plausible et faux — il manquerait
 * la moitié des champs que les quarante maillons d'avant ont posés, et le
 * `deepStrictEqual` de l'assertion (c) ne mesurerait plus rien.
 */
function sauvegardeV40(graine) {
  const etat = partieJouable(graine);
  const cible = premierCamp(etat);
  assert.ok(cible !== null, 'le montage n\'a pas de camp à attaquer');
  executerRaid(etat, baseCourante(etat), cible);
  // Le raid crédite les points ; l'achat les dépense. Le Pionnier vaut 100
  // points en offense depuis l'arbitrage du 06/09, donc il est payable au
  // premier raid — ce que la prémisse ci-dessous vérifie plutôt que de le croire.
  acheter(etat, 'offense', 'belier', 'unite');
  const v41 = JSON.parse(serialiser(etat, INSTANT));
  const v40 = structuredClone(v41);
  v40.version = 40;
  delete v40.recherche.soutiens;
  return { etat, v41, v40 };
}

/** La sauvegarde privée des DEUX champs que le maillon a le droit de toucher. */
function sansVersionNiSoutiens(sauvegarde) {
  const copie = structuredClone(sauvegarde);
  delete copie.version;
  if (copie.recherche !== null && typeof copie.recherche === 'object') {
    delete copie.recherche.soutiens;
  }
  return copie;
}

test('SOUT T1 — le maillon v40 → v41 pose la liste, il ne l\'écrase pas, et il ne touche à rien d\'autre', () => {
  const { v41, v40 } = sauvegardeV40(GRAINE);

  // ---- Le montage mesure-t-il quelque chose ? -----------------------------
  // ⚠ SANS CES CINQ LIGNES, LE TEST PASSERAIT SUR UNE SAUVEGARDE VIDE. Un
  // `deepStrictEqual` entre deux objets minuscules ne dit rien du maillon ;
  // c'est la RICHESSE du montage qui fait le test.
  assert.ok(!('soutiens' in v40.recherche),
    'la v40 porte déjà `soutiens` : le montage ne mesure plus le maillon');
  assert.ok(Array.isArray(v40.rapports) && v40.rapports.length > 0,
    'le montage n\'a rangé aucun rapport : le raid n\'a pas eu lieu');
  assert.ok(Array.isArray(v40.bases) && v40.bases.length >= 1,
    'le montage n\'a aucune base');
  assert.ok(v40.recherche.acquises.offense.includes('belier'),
    'le montage n\'a rien acheté : la recherche n\'est pas peuplée');
  assert.ok(BigInt(v40.recherche.pointsMilli) > 0n,
    'le raid n\'a crédité aucun point de recherche');

  // ---- (a) la liste est posée, et l'état se lit ---------------------------
  const pose = migrer(structuredClone(v40));
  assert.equal(pose.version, SAVE_VERSION, 'la chaîne ne va pas jusqu\'au bout');
  assert.deepStrictEqual(pose.recherche.soutiens, [],
    'le maillon ne pose pas la liste vide');
  // ⚠ ET LA LECTURE PASSE PAR LE MOTEUR, PAS PAR LE CHAMP EN CLAIR.
  // `exigerEtat` de `sim/recherche.js` EXIGE `soutiens` : un maillon qui ne
  // ferait qu'`s.version = 41` ferait lever à la première ouverture de l'écran
  // Recherche, chez le joueur. Ces deux lignes-là sont ce que le joueur vit.
  let charge;
  assert.doesNotThrow(() => { charge = charger(JSON.stringify(v40), INSTANT); },
    'une sauvegarde v40 ne se recharge plus');
  assert.equal(soutienEstAcquis(charge, 'soutienAntiVehicule'), false,
    'une v40 migrée croit avoir acheté un soutien');

  // ---- (b) une liste déjà là est rendue INTACTE, l'ordre compris ----------
  // ⚠⚠ LA LISTE TÉMOIN N'EST PAS TRIÉE, ET C'EST DÉLIBÉRÉ. `acheterUnSoutien`
  // trie ce qu'il range, donc une liste triée ne distinguerait pas « le maillon
  // n'y touche pas » de « le maillon la retrie ». Celle-ci les sépare.
  const dejaMigree = structuredClone(v40);
  dejaMigree.recherche.soutiens = ['soutienAntiVehicule', 'soutienAntiInfanterie'];
  const gardee = migrer(structuredClone(dejaMigree));
  assert.deepStrictEqual(gardee.recherche.soutiens,
    ['soutienAntiVehicule', 'soutienAntiInfanterie'],
    'le maillon écrase une liste déjà acquise : trois achats payés plusieurs millions de points');

  // ---- (c) tout le reste est identique au caractère -----------------------
  assert.deepStrictEqual(sansVersionNiSoutiens(pose), sansVersionNiSoutiens(v40),
    'le maillon touche un second champ');
  assert.deepStrictEqual(sansVersionNiSoutiens(gardee), sansVersionNiSoutiens(dejaMigree),
    'le maillon touche un second champ sur une sauvegarde déjà migrée');

  // ⚠ ET IL EST IDEMPOTENT DE BOUT EN BOUT : une sauvegarde à la version
  // courante traverse la chaîne sans être réécrite d'un octet.
  assert.deepStrictEqual(migrer(structuredClone(v41)), v41,
    'une sauvegarde à la version courante est réécrite');
});

test('SOUT T2 — la porte s\'ouvre, et elle ne s\'ouvre que pour son bâtiment', () => {
  const etat = creerEtat(GRAINE);

  // ⚠⚠ MODE DÉVELOPPEUR ÉTEINT, ET C'EST ASSERTÉ, PAS SUPPOSÉ. Il lève le péage
  // sans rien créditer : le solde resterait à 7 500 000 après l'achat, et la
  // dernière assertion de ce test cesserait de mesurer quoi que ce soit.
  assert.equal(enModeDeveloppeur(etat), false,
    'le mode développeur est allumé : le solde ne dit plus rien');

  const prix = coutDuSoutienMilli('soutienAntiVehicule');
  assert.equal(prix, 7_500_000_000n,
    'le prix du Soutien anti-véhicule n\'est plus 7 500 000 points');
  etat.recherche.pointsMilli = prix.toString();

  const avant = posablesDeLaBase(etat);

  // ---- Avant : les TROIS sont grisées, et par la recherche ----------------
  assert.equal(avant.length, ORDRE_PALETTE.length, 'la palette a changé de longueur');
  assert.equal(ORDRE_PALETTE.length - ARTILLERIES.length, 10,
    'la palette ne compte plus treize vignettes dont trois artilleries');
  for (const id of ARTILLERIES) {
    const vignette = avant.find((p) => p.id === id);
    assert.ok(vignette !== undefined, `${id} n'est pas dans la palette`);
    // ⚠ LE MOTIF EST CELUI DE LA RECHERCHE, PAS CELUI DE L'ARTILLERIE EN PLACE :
    // une base neuve n'en porte aucune. Sans cette forme, un grisage qui se
    // tromperait de motif passerait — la marque serait la même.
    assert.match(vignette.raison, /^la recherche .+ ouvre ce bâtiment$/,
      `${id} n'est pas grisé par la recherche avant l'achat`);
  }

  // ---- L'achat ------------------------------------------------------------
  acheterUnSoutien(etat, 'soutienAntiVehicule');
  const apres = posablesDeLaBase(etat);

  // ---- Après : SEUL le Canon ionique s'ouvre ------------------------------
  assert.equal(soutienEstAcquis(etat, 'soutienAntiVehicule'), true,
    'le soutien acheté n\'est pas acquis');
  assert.equal(apres.find((p) => p.id === 'artillerieAntiVehicule').raison, null,
    'le Canon ionique reste grisé après l\'achat de son soutien');
  for (const id of ['artillerieAntiInfanterie', 'artillerieAntiAerien']) {
    assert.equal(soutienEstAcquis(etat, id === 'artillerieAntiInfanterie'
      ? 'soutienAntiInfanterie' : 'soutienAntiAerien'), false,
    `${id} : un soutien non acheté est acquis`);
    assert.notEqual(apres.find((p) => p.id === id).raison, null,
      `${id} s'est ouvert avec le soutien anti-véhicule : la porte ouvre les trois d'un coup`);
    assert.equal(apres.find((p) => p.id === id).raison,
      avant.find((p) => p.id === id).raison,
      `${id} a changé de motif de grisage`);
  }

  // ---- Les dix autres vignettes ne bougent pas d'un caractère -------------
  const autres = (palette) => palette.filter((p) => !ARTILLERIES.includes(p.id));
  assert.equal(autres(avant).length, ORDRE_PALETTE.length - ARTILLERIES.length,
    'la palette ne porte plus les dix vignettes hors artillerie');
  assert.deepStrictEqual(autres(apres), autres(avant),
    'l\'achat d\'un soutien déborde sur le reste de la palette');

  // ---- Le solde tombe à zéro, du prix exact -------------------------------
  assert.equal(BigInt(etat.recherche.pointsMilli), 0n,
    'le solde ne tombe pas à zéro : l\'achat est gratuit, ou il ne coûte pas son prix');
  assert.equal(prix - BigInt(etat.recherche.pointsMilli), prix,
    'le débit n\'est pas exactement le prix du soutien');
});
